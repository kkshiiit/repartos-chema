# Continuidad vigente — Repartos Chema local 1.2.2

## Objetivo y límites confirmados

App interna de andamios para Grupo Chema Construcciones. Prioridad vigente: una persona, un celular, datos persistentes offline, sin Firebase/Cloudflare/servicios pagos para operar. Sin publicidad. No retomar nube ni ampliar alcance sin nueva instrucción. Usuario pidió pulir los flujos diarios y preservar todos los datos.

GitHub privado autorizado: kkshiiit/repartos-chema. Trabajar en main y hacer commit/push por bloques, aproximadamente cada 10 minutos, siempre antes de compilar. Publicar instaladores nuevos en rama independiente descargas, conservar anteriores y comprobar descarga por restauración Git/SHA/CRC. Nunca forzar push ni borrar datos/historial para resolver errores.

## Código guardado y situación de integración

- Base entregada 1.2.0: 327c653, funcional a820afe, APK a52f581 en descargas.
- Aparecieron cambios remotos hasta 31cd72d: importación JSON y APK1.2.1/code 4. El push9174621 fue rechazado; se conservaron ambas líneas y se integraron sin force/reset.
- Último bloque funcional combinado: **bae300e80e6644226f0df408faae632461582c26**, ya en main remoto y respaldado en /workspace/entregas/pulido-1.2.2/repartos-chema-bae300e.zip.260 archivos, CRC/restauraciónSHA correctos. Consultar git log y ls-remote para commits documentales posteriores.
- Código de nube incompleto separado en trabajo/gratuito-pausado-20261016/0f179f9. No fusionarlo en esta edición individual.

## Pulido implementado y verificado

- Agregar/seleccionar responsable desde entrega, retiro o transferencia. Guarda lista con auditoría; reutiliza nombre existente por mayúsculas. No se confunden choferes con usuarios autenticados.
- Word no valida filtros exclusivos de Excel. Etiquetas dicen Alquiler y generación local.
- Archivos nativos de documentos y JSON con nombres distintos y File.create(overwrite:false), evitando reutilizar una ruta de caché compartida. API contrastada con SDK instalado. Descargas web conservan sus nombres.
- Mensaje de faltantes local no promete FCM.
- Integración JSON conservada: selector Android compatible con proveedores de texto/binario, inspección y resumen antes de confirmar, cancelar no cambia datos, errores claros y Deshacer última importación.
- Instalación nueva vacía; actualización conserva la clave `chema:demo:v1`. Empezar vacío exporta/archiva y Recuperar anterior restaura. No reinicio silencioso por corrupción.

## Pruebas actuales

- npm run check tras integrar: **108/108**, typecheck y Functions build correctos; el backend Functions es histórico y no se ejecuta en local. Inicialmente 2 advertencias de imports en tests, ambos corregidos; npm run lint final termina con0 errores/0 advertencias.
- CHEMA_TEST_LOCAL=true npm run test:ui -- tests/ui/local.spec.ts tests/ui/import-json.spec.ts tests/ui/accessibility.spec.ts --workers=1: **6/6 en2,2 minutos**. Incluye stock/entrega/deshacer/retiro/reingreso, inicio vacío, JSON/revisión/cancelar/importar/deshacer, Word/Excel, persistencia/offline, temas/formulario y Axe WCAG AA claro/oscuro en 8 rutas. Cero solicitudes Firebase/Cloudflare en el recorrido individual.
- Prueba de archivos nativos simulados 1/1: dos copias en el mismo milisegundo conservan ambos contenidos. No es una prueba de filesystem/Compartir Android físico.
- Se conservaron pruebas rojas de los defectos antes de corregir, pulido-121-*-red.txt. Evidencias actuales pulido-122-{check,lint-final,files-final,ui-final,web}.txt y captura pulido-122-responsable.png (revisada).
- No inventar FPS/RAM ni afirmar todas las comprobacionesWCAG/hardware por Axe.

## APK compilado y verificado

- Configuración app.json: **1.2.2/versionCode5**, ARM64, mismo package `com.grupochema.repartos`.
- Código funcionalbae300e subido y ZIP verificado **antes** de iniciar npm run build:android:demo. El script fuerza EXPO_PUBLIC_LOCAL_ONLY=true y DATA_MODE=demo, sin cargar `.env.firebase.local`.
- Compilación Gradle terminada correctamente en 9m38s, 658 tareas. APK local `/workspace/entregas/pulido-1.2.2/repartos-chema-local-1.2.2-arm64.apk`, 49.499.336bytes. Firma v2, certificado igual a1.2.1, versión/ABI/SDK24/CRC comprobados. SHA256 `43835da902859f6c5af77947d315fb8ec2922d9921cebe558948460b0f1ba8eb`. Evidencia pulido-122-apk.json y logs de firma/metadatos/build. Sin dispositivo ADB, no afirmar instalación probada.
- APKs anteriores:1.2.0 completo en descargas/android/v1.2.0-local.1;1.2.1 dividido en partes en descargas/android/v1.2.1-local.1. Se reconstruyó 1.2.1 localmente y verificó SHA8135af0ed6193fd25d10b16d9dda2c13776d6b474b078106d810c9966d09f029. Certificado coincide con1.2.0. Archivo temporal /tmp/chema-121-cert-comparison.apk para comparar el nuevo instalador.
- La nueva entrega debe ser **un APK completo**, no partes para reconstruir en el celular. Ruta prevista android/v1.2.2-local.1/repartos-chema-local-1.2.2-arm64.apk.

## Entrega publicada y verificada

- Main: bloque APK `f77a2dc`, pruebas/documentación `adbdc0e`; el commit posterior de cierre solo actualiza README/checkpoint/evidencia. Consultar `git log -1` para su hash.
- Descargas: **bb0bfba2da69af18572d8bbd4674443f9bfeae5b**. APK completo1.2.2 y ZIP fuente `repartos-chema-f77a2dc.zip` (271 archivos), sin borrar entregas previas.
- [Descargar APK](https://github.com/kkshiiit/repartos-chema/raw/refs/heads/descargas/android/v1.2.2-local.1/repartos-chema-local-1.2.2-arm64.apk). Repositorio privado: iniciar sesión con acceso.
- APK y ZIP recuperados desde GitHub mediante fetch en repositorio independiente `/tmp/chema-restauracion-122`; SHA/CRC coinciden y los271 archivos fuente restaurados coinciden con el manifiesto. Evidencia `artifacts/validacion/pulido-122-github.json`.
- Fuente ZIP SHA256 `9c4963dc405d3666888a5727c5560b9b963c8383d9bc4f266267332330eb6994`. Respaldo local `/workspace/entregas/pulido-1.2.2`.

## Próxima acción exacta

1. La edición local1.2.2 está compilada, publicada y verificada como archivo; no requiere recompilar por documentación.
2. Antes de otros cambios: leer este checkpoint, git status/log/fetch y comprobar main/descargas. No duplicar las correcciones ya probadas.
3. Siguiente validación necesaria: el usuario guarda JSON fuera de la app e instala1.2.2 encima, sin desinstalar. Confirmar conservación de datos, selector JSON/vista previa/cancelación/importación/deshacer, Compartir Word/Excel y responsables con teclado real.
4. Si aparece un fallo físico, reproducirlo sin borrar datos, corregir con prueba y subir main antes de una compilación con nueva versión. Mantener instaladores previos. No retomar Firebase/multiusuario por iniciativa propia.

## Pendientes reales y herramientas

No hay dispositivo ADB ni emulador operativo: faltan instalación/actualización física, permisos/cámara/galería, GPS/WhatsApp externos y Compartir/importar nativos. El nombre local no autentica una cuenta. No hay sincronización entre teléfonos ni PDF automático. Mantener JSON fuera de la app: desinstalar/borrar almacenamiento elimina datos internos.

JDK 21: `/workspace/jdk21/jdk-21.0.12.1+1`; SDK 36: `/workspace/android-sdk`; caché Gradle: `/workspace/gradle-cache`; ANDROID_USER_HOME: `/workspace/android-user`. No establecer ANDROID_PREFS_ROOT incompatible ni reemplazar HOME. Preservar proxy/TLS con trustStore `/etc/ssl/certs/java/cacerts`. No cambiar credenciales ni pedir otro login sin error real. No hay automatización de continuidad confirmada.

Manual: [USO_LOCAL_ANDROID.md](USO_LOCAL_ANDROID.md). Cambios/pruebas: [PULIDO_1_2_2.md](PULIDO_1_2_2.md). [Historial completo anterior](archivo/CONTINUIDAD_ANTERIOR_2026_10_16.md), conservado como antecedente; prevalece este checkpoint.
