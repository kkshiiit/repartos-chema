# Entrega individual Android 1.2.0

## APK comprobado

APK ARM64 real generado: versión1.2.0/code3, package `com.grupochema.repartos`, Android7 o superior. Gradle terminó correctamente en10m2s,658tareas. Código funcional `a820afe`, respaldado en main antes de compilar; manual posterior `e140b51`. No se desplegó nube ni se contrató un servicio.

Archivo: `/workspace/entregas/local-1.2.0/repartos-chema-local-1.2.0-arm64.apk`,49.483.920bytes.

SHA256: `063019c53294fdb6d43e3916faad7d0d0f9b03312fdabed03d47de917f589962`.

Firma v2 y CRCZIP correctos. Certificado comparado e igual al APK1.1: permite actualización a nivel de firma/paquete/versionCode; instalación sobre datos reales todavía pendiente de prueba física. Firma interna de plantilla, no keystore productivo de la empresa. Solo bibliotecas arm64-v8a. Sin permisos RECORD_AUDIO, SYSTEM_ALERT_WINDOW ni AD_ID. Configuración Firebase proporcionada por usuario ausente del bundle individual. Evidencias `artifacts/validacion/local-120-{apk.json,firma.txt,metadata.txt,android-build.txt}`.

## Uso y preservación

Instalación nueva comienza vacía. Se conserva la clave de datos anterior al actualizar; no se borran ejemplos ni datos reales automáticamente. Empezar vacío es explícito y confirmado, exporta JSON y archiva el estado previo; Recuperar anterior restaura ese archivo incluso después de reabrir. Importación JSON validada conserva también el original. Un fallo de lectura/escritura/corrupción no inicia silenciosamente otra base.

Ver [manual local](USO_LOCAL_ANDROID.md). Preparar responsables en Ajustes, piezas en Depósito y cantidades iniciales mediante ajuste con procedencia. No hay acceso compartido entre teléfonos. Ingreso por nombre local; no equivale a autenticación real. Sin publicidad, suscripción ni conexión a Firebase/Cloudflare para las operaciones. Mapas y WhatsApp abren servicios externos por intervención del usuario y dependen de sus condiciones/conectividad.

## Pruebas reales

- `npm run check`:94/94; typecheck correcto, lint0errores/1warning histórico de import AxeBuilder, Functions build correcto. Functions no se necesita para uso local.
- `CHEMA_TEST_LOCAL=true npm run test:ui -- tests/ui/local.spec.ts --workers=1`:2/2,11,2s. Inicio vacío, material/ajuste20, alquiler/carga/entrega19disponibles+1alquilado, deshacer20+0, entregar/retirar/reingresar20+0, historial, JSONexport/import, vaciado confirmado/recuperación, persistencia, reapertura web offline, temas y borrador conservado. Cero solicitudes a Firebase/Cloudflare en ese recorrido.
- Word y Excel descargados desde navegador, cabeceraZIP real. Generador usado por móvil probado en Node1/1: DOCX y XLSX institucional legibles; Word usa ArrayBuffer. Esto no acredita Compartir de Android.
- Exportación web individual correcta. Dist no se reconstruyó mientras corrían pruebas.
- `npm run build:android:demo` con JDK21/SDK36: código0,10m2s. El script fuerza LOCAL_ONLY y demo/local; su nombre es histórico.
- ZIPfuente a820afe restaurado con CRC y SHA de226archivos coincidentes. Originales intactos.

La primera prueba UI falló por leer un material antes de completarse la restauración y por consultar un atributo de tema inexistente. Se corrigieron espera/selector del test y pasó2/2. Se conserva el fallo en local-120-ui.txt y el éxito en local-120-ui-final.txt; no se debilitaron reglas de negocio.

## Límites de validación

ADB no detecta dispositivos y no hay emulador Android operativo. **No se probó físicamente este APK.** Pendientes en celular: primera apertura, actualización conservando datos, permisos/cámara/galería, compartir Word/Excel/JSON, selector de importación y apertura de Maps/WhatsApp. No hay PDF automático. La lógica local y la UI web están comprobadas; no equivalen a todos los procesos nativos.

Guardar JSON fuera de la aplicación. Desinstalar o borrar almacenamiento elimina datos y archivos internos, incluidos archivos previos al vaciado. Excel/Word no sustituyen el JSON.

## Publicación pendiente de comprobar

Destino versionado: rama privada descargas, `android/v1.2.0-local.1/repartos-chema-local-1.2.0-arm64.apk`, con SHA256. Conservar1.0/1.1. Confirmar publicación y restauración desde GitHub en CONTINUIDAD_LOCAL después de ejecutarlas.

Nube gratuita incompleta conservada en `trabajo/gratuito-pausado-20261016`/`0f179f9`. No es dependencia de esta edición ni debe fusionarse para cerrar la entrega local. No hay servicios pagos ni automatización de continuidad activados.
