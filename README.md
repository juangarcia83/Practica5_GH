# Práctica 5 GPC – Luces y materiales

Brazo robot articulado hecho con Three.js (r140), correspondiente a la opción 1 de la práctica 5 de Gráficos por Computador (MUIARFID, UPV).

**Demo:** https://USUARIO.github.io/GPC/practica5.html

## Qué incluye

- **Iluminación:** luz ambiental, direccional y focal; las dos últimas proyectan sombras.
- **Materiales y texturas:** suelo de chapa metálica, piezas de metal brillante (Phong) y de metal pintado mate (Lambert), y pinza texturada.
- **Mapa de entorno:** la rótula refleja el entorno, y la habitación usa las mismas seis imágenes en sus paredes.
- **Sombras:** todas las piezas del robot proyectan y reciben sombras.
- **Lo de prácticas anteriores:** grafo de escena del robot (P2), cámara orbital con vista cenital en miniatura (P3), y control con flechas, panel de giros y animación (P4).

## Controles

| Acción | Control |
|---|---|
| Orbitar / desplazar / zoom | Botón izquierdo / botón derecho / rueda del ratón |
| Mover el robot | Flechas del teclado |
| Giros, apertura de la pinza, modo alambre y animación | Panel *Control Robot* |

## Estructura

```
practica5.html   página principal
js/              código de la práctica
lib/             three.js, OrbitControls, lil-gui y tween.js
images/          texturas y mapa de entorno
```

## Créditos

Las texturas proceden del material de la asignatura, salvo `blue_metal_plate_512.jpg`, que es de [Poly Haven](https://polyhaven.com/a/blue_metal_plate) (licencia CC0).
