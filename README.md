# MultiTool AutoStudio

Aplicación web 3D interactiva para personalización automotriz: creación y mezcla de pinturas con códigos OEM, aplicación de stickers/vinilos sobre carrocerías 3D, manipulación de piezas y carga de modelos externos, optimizada para escritorio y celular.

## Características
- **Estudio de Pintura y Códigos de Color:** Selector en tiempo real, conversión a **HEX, RGB, HSL, CMYK** y código OEM, 6 acabados físicos (`Brillante`, `Metálico`, `Perlado / Camaleón`, `Satinado`, `Mate`, `Cromo Espejo`) y catálogo de colores OEM.
- **Stickers y Vinilos 3D:** Proyección directa (`DecalGeometry`) haciendo clic sobre el modelo 3D, plantillas racing/dorsales, carga de PNG/SVG personalizados y control de escala, rotación y opacidad por capa.
- **Modelos 3D y Piezas:** 3 modelos integrados + importación y Drag & Drop de `.glb`, `.gltf`, `.obj`, `.fbx`, `.stl`, `.dae`, `.ply` y `.3ds`. Selección individual de piezas, pintura por pieza, visibilidad y gizmo 3D (`Mover`, `Rotar`, `Escalar`).
- **Escena y Exportación:** Iluminación de estudio (`Showroom`, `Neón Night`, `Atardecer`), captura PNG, exportación de ficha de color `.JSON` y guardado en navegador.
- **Soporte Móvil y Red Local:** Controles táctiles (`touch-action: none`), vista adaptable (`100dvh`) y acceso desde red local (`host: true`).

## Ejecución local
```bash
npm install
npm run dev
```

## Compilación de producción
```bash
npm run build
```
