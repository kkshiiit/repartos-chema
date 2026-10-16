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

Check final completo:94/94, typecheck correcto, lint0errores/1warning histórico de import AxeBuilder, Functions build correcto. Comando `npm run check`, evidencia local-120-check-final.txt. No se ejecutó despliegue ni se necesita Functions para la app local.

Actualización antes de compilar: bloque inicial `22792ce` ya en main remoto. Web individual compiló correctamente. Recorrido Playwright individual2/2 en11,2s: inicio vacío; creación material/ajuste20 con procedencia; alquiler/carga; entrega19/1; deshacer20/0; nueva entrega/retiro/reingreso20/0; Word/Excel descargables; JSON export/import; Empezar vacío/Recuperar anterior; reapertura offline; cero solicitudes Firebase/Cloudflare; temas y formulario conservado. Evidencia local-120-ui-final.txt y capturas local-120-*.png. Primera ejecución falló por dos errores del test (lectura antes de restauración y atributo de tema inexistente), corregidos; no ocultar local-120-ui.txt.

Generador móvil Word pasó de salida nodebuffer a ArrayBuffer para evitar depender de Buffer global. Prueba local-documents genera DOCX real y abre XLSX institucional,1/1 aprobado en Node; no equivale a usar Compartir en Android físico. ADB no detecta dispositivos conectados. Cámara, galería, GPS externo, selector JSON y Compartir nativos siguen pendientes físicos; no bloquear la entrega ni declararlos probados.

`npm run check`: 93 pruebas aprobadas, typecheck/lint/Functions build sin errores (ver artifacts/validacion/local-120-check.txt). Esas pruebas se ejecutaron antes del último refuerzo que obliga modo demo con LOCAL_ONLY; repetir la comprobación final antes de compilar. Cinco pruebas nuevas cubren inicio vacío, actualización con datos, recuperación tras reinicio, fallo de archivo previo y corrupción sin reseed.

Pendiente inmediato: recorrido Playwright individual empezando vacío y creando stock/alquiler real de prueba; entregar/retirar/deshacer/historial/offline/JSON/documentos/temas. Exportar web con LOCAL_ONLY=true. Guardar/push código antes de compilar ARM64. No afirmar pruebas físicas de Android: adb existe, no se encontró emulador/KVM; revisar dispositivo disponible antes de declarar validado nativo.

## Reanudación

Leer este archivo y docs/CONTINUIDAD_CODEX.md; revisar git status/log. Ejecutar pruebas pendientes, corregir fallos, push main, compilar APK, verificar firma/SHA/CRC/versiones y publicar versionado en descargas. Preservar APK anteriores. Documentar resultados reales y enlace.
