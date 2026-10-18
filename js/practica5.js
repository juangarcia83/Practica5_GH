// practica 5 gpc: luces y materiales (opcion 1, brazo robot)
// juan alfonso garcia-real

var renderer, scene, camera, cameraTop;
var cameraControls;
var baseMesh, armAssembly, forearmAssembly, handAssembly;
var finger, otherFinger;
var gui;
var reloj = new THREE.Clock();
var teclas = {};
var animaciones = [];

// orden de las caras: +x, -x, +y, -y, +z, -z
var environmentFaces = [
  'images/posx.jpg', 'images/negx.jpg',
  'images/posy.jpg', 'images/negy.jpg',
  'images/posz.jpg', 'images/negz.jpg'
];

var controls = {
  giroBase: 0,
  giroBrazo: 0,
  giroAntebrazoY: 0,
  giroAntebrazoZ: 0,
  giroPinza: 0,
  separacionPinza: 10,
  alambres: false,
  anima: animarRobot
};

init();
loadScene();
setupGUI();
render();

function init()
{
  renderer = new THREE.WebGLRenderer({ antialias: true });
  // hay dos vistas en el mismo canvas, asi q el clear lo hago yo
  renderer.autoClear = false;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setClearColor( new THREE.Color(0xFFFFFF) );
  document.getElementById('container').appendChild( renderer.domElement );

  scene = new THREE.Scene();

  var aspectRatio = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera( 50, aspectRatio, 0.1, 3000 );
  camera.position.set( 300, 250, 350 );

  // cenital: mira hacia abajo, x eso el "arriba" de la imagen es -z
  cameraTop = new THREE.OrthographicCamera( -100, 100, 100, -100, 1, 1000 );
  cameraTop.position.set( 0, 500, 0 );
  cameraTop.up.set( 0, 0, -1 );
  cameraTop.lookAt( 0, 0, 0 );

  cameraControls = new THREE.OrbitControls( camera, renderer.domElement );
  cameraControls.target.set( 0, 110, 0 );
  cameraControls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
  cameraControls.mouseButtons.RIGHT = THREE.MOUSE.PAN;
  cameraControls.enableZoom = true;
  cameraControls.screenSpacePanning = true;
  cameraControls.update();

  window.addEventListener('resize', updateAspectRatio);

  // guardo q teclas estan pulsadas y el movimiento se hace en update()
  document.addEventListener('keydown', function(event) {
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
      event.preventDefault();
      teclas[event.code] = true;
    }
  });
  document.addEventListener('keyup', function(event) {
    teclas[event.code] = false;
  });
  window.addEventListener('blur', function() {
    teclas = {};
  });
}

function loadScene()
{
  const textureLoader = new THREE.TextureLoader();
  const paintTexture = textureLoader.load('images/blue_metal_plate_512.jpg');
  const metalTexture = textureLoader.load('images/metal_128.jpg');

  const floorTexture = textureLoader.load('images/pisometalico_1024.jpg');
  floorTexture.wrapS = THREE.RepeatWrapping;
  floorTexture.wrapT = THREE.RepeatWrapping;
  floorTexture.repeat.set(4, 4);

  const cubemap = new THREE.CubeTextureLoader().load(environmentFaces);

  const shinyMaterial = new THREE.MeshPhongMaterial({
    map: metalTexture, specular: 0xaaaaaa, shininess: 80
  });
  const matteMaterial = new THREE.MeshLambertMaterial({ map: paintTexture });
  const jointMaterial = new THREE.MeshPhongMaterial({
    envMap: cubemap, specular: 0xffffff, shininess: 100
  });

  // base
  const baseGeometry = new THREE.CylinderGeometry( 50, 50, 15, 64 );
  baseMesh = new THREE.Mesh( baseGeometry, shinyMaterial );
  baseMesh.position.y = 7.5;
  scene.add(baseMesh);

  // brazo
  armAssembly = new THREE.Object3D();
  baseMesh.add(armAssembly);

  const shoulderAxleMesh = new THREE.Mesh( new THREE.CylinderGeometry( 20, 20, 18, 64 ), matteMaterial );
  shoulderAxleMesh.rotation.x = Math.PI / 2;
  armAssembly.add(shoulderAxleMesh);

  const upperArmMesh = new THREE.Mesh( new THREE.BoxGeometry( 18, 120, 12 ), matteMaterial );
  upperArmMesh.position.y = 60;
  armAssembly.add(upperArmMesh);

  const elbowJointMesh = new THREE.Mesh( new THREE.SphereGeometry( 20, 32, 16 ), jointMaterial );
  elbowJointMesh.position.y = 120;
  armAssembly.add(elbowJointMesh);

  // antebrazo
  forearmAssembly = new THREE.Object3D();
  forearmAssembly.position.y = 120;
  armAssembly.add(forearmAssembly);

  const forearmDiskMesh = new THREE.Mesh( new THREE.CylinderGeometry( 22, 22, 6, 64 ), shinyMaterial );
  forearmAssembly.add(forearmDiskMesh);

  const supportBarGeometry = new THREE.BoxGeometry( 4, 80, 4 );
  const supportBarPositions = [ [-11, 11], [11, 11], [-11, -11], [11, -11] ];
  for (const [x, z] of supportBarPositions) {
    const supportBar = new THREE.Mesh( supportBarGeometry, shinyMaterial );
    supportBar.position.set( x, 40, z );
    forearmAssembly.add(supportBar);
  }

  // mano: nodo aparte sin el giro del cilindro, pa q los dedos no lo hereden
  handAssembly = new THREE.Object3D();
  handAssembly.position.y = 80;
  forearmAssembly.add(handAssembly);

  const wristMesh = new THREE.Mesh( new THREE.CylinderGeometry( 15, 15, 40, 64 ), matteMaterial );
  wristMesh.rotation.x = Math.PI / 2;
  handAssembly.add(wristMesh);

  // pinza: hago un dedo y el otro es el mismo girado 180 en x
  finger = new THREE.Object3D();
  const fingerBase = new THREE.Mesh( new THREE.BoxGeometry(19, 20, 4), shinyMaterial );
  fingerBase.position.set( 19 / 2, 0, 2 );
  finger.add(fingerBase);
  finger.add(new THREE.Mesh( createTipGeometry(), shinyMaterial ));

  otherFinger = finger.clone();
  otherFinger.rotation.x = Math.PI;
  handAssembly.add(finger, otherFinger);

  // suelo
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(1000, 1000),
    new THREE.MeshPhongMaterial({ map: floorTexture, specular: 0x222222, shininess: 20 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  baseMesh.traverse(function(obj) {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  // habitacion con las mismas imagenes q el envmap de la rotula
  const roomMaterials = environmentFaces.map(function(path) {
    return new THREE.MeshBasicMaterial({
      map: textureLoader.load(path),
      side: THREE.BackSide,
      depthWrite: false
    });
  });
  const room = new THREE.Mesh(new THREE.BoxGeometry(1000, 1000, 1000), roomMaterials);
  // three invierte la x en los cubemaps, si no las paredes salen al reves q el reflejo
  room.scale.x = -1;
  room.position.y = 499;
  room.renderOrder = -1;
  scene.add(room);

  // luces
  scene.add(new THREE.AmbientLight(0x333333));

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
  directionalLight.position.set(-300, 400, 100);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.set(2048, 2048);
  // q la camara de sombras cubra todo el suelo, sino al mover el robot se pierde la sombra
  directionalLight.shadow.camera.left = -800;
  directionalLight.shadow.camera.right = 800;
  directionalLight.shadow.camera.top = 800;
  directionalLight.shadow.camera.bottom = -800;
  directionalLight.shadow.camera.near = 10;
  directionalLight.shadow.camera.far = 2000;
  directionalLight.shadow.camera.updateProjectionMatrix();
  directionalLight.shadow.bias = -0.0002;
  directionalLight.shadow.normalBias = 0.5;
  scene.add(directionalLight);
  scene.add(directionalLight.target);

  const spotLight = new THREE.SpotLight(0xffffff, 0.6);
  spotLight.position.set(-200, 450, -200);
  spotLight.target.position.set(0, 0, 0);
  spotLight.angle = Math.PI / 5;
  spotLight.penumbra = 0.3;
  spotLight.castShadow = true;
  spotLight.shadow.mapSize.set(2048, 2048);
  spotLight.shadow.camera.near = 100;
  spotLight.shadow.camera.far = 1600;
  spotLight.shadow.bias = -0.0002;
  spotLight.shadow.normalBias = 0.5;
  scene.add(spotLight);
  scene.add(spotLight.target);
}

function createTipGeometry()
{
  // de x=19 a x=38: alto 20 -> 15 y grosor 4 -> 2, la cara de dentro (z=0) plana
  const v = [
    [19, -10,  0], [19,  10,  0], [19,  10,  4], [19, -10,  4],
    [38, -7.5, 0], [38,  7.5, 0], [38,  7.5, 2], [38, -7.5, 2]
  ].map(function(p) { return new THREE.Vector3(p[0], p[1], p[2]); });

  // caras en antihorario vistas desde fuera
  const faces = [
    [0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4],
    [3, 7, 6, 2], [1, 2, 6, 5], [0, 4, 7, 3]
  ];

  // cada cara lleva sus 4 vertices pa q la normal sea la de esa cara
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  faces.forEach(function(face, i) {
    const [a, b, c, d] = face.map(function(k) { return v[k]; });
    const normal = new THREE.Vector3()
      .crossVectors(new THREE.Vector3().subVectors(b, a), new THREE.Vector3().subVectors(c, a))
      .normalize();

    for (const p of [a, b, c, d]) {
      positions.push(p.x, p.y, p.z);
      normals.push(normal.x, normal.y, normal.z);
    }
    uvs.push(0, 0,  1, 0,  1, 1,  0, 1);

    const k = i * 4;
    indices.push(k, k + 1, k + 2,  k, k + 2, k + 3);
  });

  const tipGeometry = new THREE.BufferGeometry();
  tipGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  tipGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  tipGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  tipGeometry.setIndex(indices);
  return tipGeometry;
}

function updateAspectRatio()
{
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

function setupGUI()
{
  gui = new lil.GUI({ title: 'Control Robot' });
  gui.add(controls, 'giroBase', -180, 180, 1).name('Giro Base').listen().onChange(pararAnimacion);
  gui.add(controls, 'giroBrazo', -45, 45, 1).name('Giro Brazo').listen().onChange(pararAnimacion);
  gui.add(controls, 'giroAntebrazoY', -180, 180, 1).name('Giro Antebrazo Y').listen().onChange(pararAnimacion);
  gui.add(controls, 'giroAntebrazoZ', -90, 90, 1).name('Giro Antebrazo Z').listen().onChange(pararAnimacion);
  gui.add(controls, 'giroPinza', -40, 220, 1).name('Giro Pinza').listen().onChange(pararAnimacion);
  gui.add(controls, 'separacionPinza', 0, 15, 0.1).name('Separacion Pinza').listen().onChange(pararAnimacion);
  gui.add(controls, 'alambres').name('Alambres');
  gui.add(controls, 'anima').name('Anima');
}

function pararAnimacion()
{
  for (const animacion of animaciones) animacion.stop();
  animaciones = [];
}

function animarRobot()
{
  // paro la anterior pa q no se solapen
  pararAnimacion();

  const acercar = new TWEEN.Tween(controls).to({
    giroBase: 90, giroBrazo: 30, giroAntebrazoY: 0,
    giroAntebrazoZ: -60, giroPinza: 90, separacionPinza: 15
  }, 2000).easing(TWEEN.Easing.Quadratic.InOut);

  const cerrar = new TWEEN.Tween(controls).to({ separacionPinza: 0 }, 800)
    .easing(TWEEN.Easing.Quadratic.Out);

  const levantar = new TWEEN.Tween(controls).to({
    giroBase: -90, giroBrazo: -30, giroAntebrazoY: 180,
    giroAntebrazoZ: 45
  }, 2500).easing(TWEEN.Easing.Quadratic.InOut);

  const volver = new TWEEN.Tween(controls).to({
    giroBase: 0, giroBrazo: 0, giroAntebrazoY: 0,
    giroAntebrazoZ: 0, giroPinza: 0, separacionPinza: 10
  }, 2000).easing(TWEEN.Easing.Quadratic.InOut);

  acercar.chain(cerrar);
  cerrar.chain(levantar);
  levantar.chain(volver);
  animaciones = [acercar, cerrar, levantar, volver];
  acercar.start();
}

function update()
{
  // con el delta la velocidad no depende de los fps
  const paso = 80 * Math.min(reloj.getDelta(), 0.1);
  if (teclas.ArrowUp) baseMesh.position.z -= paso;
  if (teclas.ArrowDown) baseMesh.position.z += paso;
  if (teclas.ArrowLeft) baseMesh.position.x -= paso;
  if (teclas.ArrowRight) baseMesh.position.x += paso;

  // suelo de 1000 y base de radio 50: q no se salga
  const limite = 500 - baseMesh.geometry.parameters.radiusTop;
  baseMesh.position.x = THREE.MathUtils.clamp(baseMesh.position.x, -limite, limite);
  baseMesh.position.z = THREE.MathUtils.clamp(baseMesh.position.z, -limite, limite);

  TWEEN.update();

  baseMesh.rotation.y = THREE.MathUtils.degToRad(controls.giroBase);
  armAssembly.rotation.z = THREE.MathUtils.degToRad(controls.giroBrazo);
  forearmAssembly.rotation.y = THREE.MathUtils.degToRad(controls.giroAntebrazoY);
  forearmAssembly.rotation.z = THREE.MathUtils.degToRad(controls.giroAntebrazoZ);
  handAssembly.rotation.z = THREE.MathUtils.degToRad(controls.giroPinza);

  finger.position.z = controls.separacionPinza / 2;
  otherFinger.position.z = -controls.separacionPinza / 2;

  baseMesh.traverse(function(obj) {
    if (obj.isMesh) obj.material.wireframe = controls.alambres;
  });

  // la cenital sigue al robot
  cameraTop.position.set(baseMesh.position.x, 500, baseMesh.position.z);
  cameraTop.lookAt(baseMesh.position.x, 0, baseMesh.position.z);
  cameraControls.update();
}

function render()
{
  requestAnimationFrame( render );
  update();

  const width = renderer.domElement.clientWidth;
  const height = renderer.domElement.clientHeight;

  renderer.setScissorTest(false);
  renderer.setViewport(0, 0, width, height);
  renderer.setClearColor(0xffffff);
  renderer.clear();
  renderer.render(scene, camera);

  // miniatura de 1/4 de la dimension menor; webgl cuenta la y desde abajo
  const side = Math.min(width, height) / 4;
  renderer.setViewport(0, height - side, side, side);
  renderer.setScissor(0, height - side, side, side);
  renderer.setScissorTest(true);
  renderer.setClearColor(0xe8eef5);
  renderer.clear();
  renderer.render(scene, cameraTop);
  renderer.setScissorTest(false);
}
