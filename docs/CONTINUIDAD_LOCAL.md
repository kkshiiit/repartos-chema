# Prioridad vigente — APK individual local 1.2.0

Solicitud del usuario al reanudar: APK ARM64 para una persona, hoy por la mañana, sin depender de Firebase, Cloudflare ni servicios pagos. Preservar datos, JSON import/export, inicio vacío y commits/push antes de compilar. No desplegar nube.

El trabajo gratuito incompleto quedó guardado en rama privada `trabajo/gratuito-pausado-20261016`, commit `0f179f9`. No mezclar con esta entrega. Main parte de `aabe9d8`.

## Bloque local implementado

- `EXPO_PUBLIC_LOCAL_ONLY=true` obliga modo local aunque exista otra selección Firebase; script Android fija ambas variables. En una instalación nueva usa emptyLocalState sin alquileres, materiales ni responsables de ejemplo.
- Se conserva la clave `chema:demo:v1` para mantener los datos anteriores al actualizar. No se reinicia una base existente ni corrupta automáticamente.
- Ajustes: Empezar vacío requiere confirmación, exporta JSON primero, archiva original antes de cambiar y ofrece Recuperar anterior. Una importación JSON conserva también el original.
- Nombre local para atribución, sin invitaciones ni botón push en esta versión. Temas y rutas existentes conservados.
- Versión Android1.2.0/code3, mismo package; firma debe comprobarse contra1.1 antes de distribuir.

## Pruebas y estado

`npm run check`: 93 pruebas aprobadas, typecheck/lint/Functions build sin errores (ver artifacts/validacion/local-120-check.txt). Esas pruebas se ejecutaron antes del último refuerzo que obliga modo demo con LOCAL_ONLY; repetir la comprobación final antes de compilar. Cinco pruebas nuevas cubren inicio vacío, actualización con datos, recuperación tras reinicio, fallo de archivo previo y corrupción sin reseed.

Pendiente inmediato: recorrido Playwright individual empezando vacío y creando stock/alquiler real de prueba; entregar/retirar/deshacer/historial/offline/JSON/documentos/temas. Exportar web con LOCAL_ONLY=true. Guardar/push código antes de compilar ARM64. No afirmar pruebas físicas de Android: adb existe, no se encontró emulador/KVM; revisar dispositivo disponible antes de declarar validado nativo.

## Reanudación

Leer este archivo y docs/CONTINUIDAD_CODEX.md; revisar git status/log. Ejecutar pruebas pendientes, corregir fallos, push main, compilar APK, verificar firma/SHA/CRC/versiones y publicar versionado en descargas. Preservar APK anteriores. Documentar resultados reales y enlace.
