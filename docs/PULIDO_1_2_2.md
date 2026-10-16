# Pulido local 1.2.2 — resultados y límites

## Alcance

Edición individual, local y offline, sin publicidad, servicios pagos ni sincronización entre celulares. El usuario pidió pulir el uso diario, sin otro rediseño ni ampliar las integraciones. Se preservan datos existentes y versiones previas; una instalación nueva comienza vacía.

## Cambios implementados

- **Responsables desde la operación:** entrega, retiro y triangulación permiten agregar un nombre, guardarlo con auditoría y seleccionarlo sin salir del formulario. Se normalizan espacios y se reutilizan nombres existentes sin distinguir mayúsculas. Busy, cancelación y errores visibles. Los nombres no son cuentas autenticadas. Archivo: `src/components/OperationForm.tsx`.
- **Word independiente de Excel:** un filtro de fecha de Excel inválido ya no bloquea el remito Word. Selector «Alquiler» y descripción de generación local. Archivo: `app/exportar.tsx`.
- **Copias y documentos Android separados:** rutas únicas por archivo, incluso si se crean dentro del mismo milisegundo; `File.create({overwrite:false})` evita reutilizar una ruta que otra aplicación esté leyendo. No se eliminan archivos ni datos previos. Descargas web conservan sus nombres. Archivos: `src/services/files.ts`, `src/services/exportService.ts`.
- **JSON integrado:** se conservaron los cambios remotos de selección Android, inspección y resumen antes de confirmar, cancelación sin cambios y Deshacer última importación. El selector acepta proveedores que identifican JSON como texto/binario y luego valida el contenido. Archivos: `src/components/BackupImport.tsx`, `src/services/backupService.ts` y repositorio/contexto existentes. Se corrigió el singular «1 alquiler guardado».
- **Mensajes locales:** los faltantes indican registro en historial y no prometen un push FCM.
- **Continuidad y manual:** checkpoint vigente compacto, historial anterior íntegro en `docs/archivo/CONTINUIDAD_ANTERIOR_2026_10_16.md`; manual actualizado con pasos reales del diálogo JSON.

No se cambiaron las reglas de cantidades, estados de negocio ni la clave comercial persistida `chema:demo:v1`.

## Integración y respaldos

El primer push del pulido `9174621` fue rechazado porque main avanzó hasta `31cd72d` con la importación JSON y un APK 1.2.1/code4. Se conservaron ambas líneas, sin force push ni reset. La integración `bae300e80e6644226f0df408faae632461582c26` fue subida a main antes de compilar. El único conflicto fue una prueba UI: conserva el alta de responsable y el nuevo diálogo de confirmación JSON.

La nueva versión es **1.2.2/code5**, no reemplaza 1.2.1. Se conservan la rama local `respaldo/pulido-9174621`, ZIPs originales y las entregas anteriores. El ZIP de bae300e se restauró comprobando CRC y SHA de los 260 archivos antes de iniciar Android. Los commits posteriores solo añaden pruebas/evidencia/documentación.

## Pruebas ejecutadas en esta sesión

| Verificación | Resultado observado | Evidencia |
| --- | --- | --- |
| `npm run check` tras integrar | 108/108 pruebas, typecheck y compilación TypeScript Functions correctos | `artifacts/validacion/pulido-122-check.txt` |
| `npm run lint` final | 0 errores, 0 advertencias | `pulido-122-lint-final.txt` |
| Prueba filesystem nativo simulado | 1/1; dos archivos del mismo nombre/milisegundo conservan ambos contenidos | `pulido-122-files-final.txt` |
| Exportación web | Correcta, versión 1.2.2 | `pulido-122-web.txt` |
| Playwright local + JSON + Axe | 6/6 en 2,2 minutos | `pulido-122-ui-final.txt` |
| Publicidad propia y declaraciones | Sin coincidencias en 71 archivos app/src/configuración/dependencias | `pulido-122-publicidad.json` |
| Dispositivos ADB | Ninguno conectado | `pulido-122-adb.txt` |

Recorridos web: instalación vacía, material y ajuste inicial, alquiler, alta/selección de responsable, entrega, deshacer, retiro, reingreso, stock, JSON exportado/importado y recuperado, cancelación sin alterar datos, persistencia tras recarga y apertura offline con caché. Descargas Word/Excel reales verificadas como documentos ZIP. Cero solicitudes Firebase/Cloudflare en el recorrido individual. Prueba de temas con cambio de sistema/manual, persistencia y conservación del formulario. Axe en ocho rutas para claro/oscuro; algunas rutas sin datos muestran estado vacío, por lo que no cubre todos los estados posibles de detalle o modal ni certifica accesibilidad integral.

Se reprodujeron los defectos antes de corregirlos: faltaba Agregar responsable, Word no descargaba con filtro Excel inválido y el modelo de filesystem sobrescribía el mismo nombre. Evidencias `pulido-121-ui-red.txt` y `pulido-121-files-red.txt`, seguidas de pruebas verdes. Las cifras históricas 95/3 o 108/4 corresponden a etapas anteriores; las cifras finales son 108/6.

Captura nueva real revisada: [alta de responsable, web móvil claro](../artifacts/capturas/pulido-122-responsable.png). No es una captura Android nativa.

## Android y entrega

Compilación Gradle completa ARM64 **correcta en 9m 38s**, 658 tareas. APK 1.2.2/code5, paquete `com.grupochema.repartos`, Android 7+ (SDK24), 49.499.336 bytes. Firma v2, certificado coincidente con 1.2.1, ZIP/CRC y ABI comprobados. Sin permisos publicitarios/contactos/SMS/gestión global de almacenamiento ni clave de la configuración Firebase local en el bundle. Evidencias `pulido-122-{android,firma,metadata}.txt` y `pulido-122-apk.json`. Advertencia Gradle sobre APIs obsoletas para una futura actualización a Gradle10; no impide esta compilación.

SHA256: `43835da902859f6c5af77947d315fb8ec2922d9921cebe558948460b0f1ba8eb`. Archivo completo preparado en `/workspace/entregas/pulido-1.2.2/repartos-chema-local-1.2.2-arm64.apk`; publicado como archivo completo en `descargas`, commit `bb0bfba2da69af18572d8bbd4674443f9bfeae5b`. Se recuperó el APK y el ZIP fuente desde GitHub en un repositorio independiente: SHA/CRC correctos, y restauración de los 271 archivos fuente coincidente con el manifiesto. Evidencia `artifacts/validacion/pulido-122-github.json`. No se probó físicamente.

## Límites y pendientes reales

- Sin Android físico o emulador operativo: instalación/actualización, selector JSON, Compartir, permisos, cámara/galería, GPS y WhatsApp nativos siguen pendientes. El filesystem nativo probado usa un adaptador simulado; los documentos se comprobaron mediante navegador y pruebas de generación, no abriendo Office en un celular.
- Firma interna de plantilla, no un keystore de distribución productiva. Mantener el mismo certificado para actualizar, y respaldar JSON fuera de la app antes de instalar encima. No desinstalar ni borrar almacenamiento para actualizar.
- No hay sincronización multiusuario, autenticación real en el ingreso por nombre ni PDF automático. El backend histórico compilado no está desplegado ni se usa para operar localmente.
- No se midieron FPS, memoria, batería ni latencia en hardware; no se afirman mejoras porcentuales.
- No hay automatización futura verificada: retomar leyendo `docs/CONTINUIDAD_CODEX.md`.
