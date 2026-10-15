# Compilación Android interna

No se necesita EAS, una cuenta paga ni Play Store para compilar localmente. Esto no implica que el dispositivo se haya probado. Consultar INFORME_ENTREGA para el resultado real de esta ejecución.

Requisitos: Node/npm, **JDK 21 completo con javac**, Android SDK plataforma 36, build-tools 36.0.0, platform-tools, NDK 27.1.12297006 y CMake 3.22.1. Confirmar contra las versiones del proyecto si se actualiza Expo. El runtime Java sin compilador sirve para los emuladores de Firebase, pero no para crear el APK.

```bash
npm ci
# JAVA_HOME debe apuntar al JDK, ANDROID_HOME al SDK real instalado.
# No sustituir las rutas del usuario por valores ficticios.
npm run build:android:demo
```

El script valida javac y SDK, regenera el proyecto nativo compatible con Expo, fuerza modo demo y compila ARM64. `android/` se genera y se excluye del ZIP fuente/Git. Resultado esperado solo tras build correcto: `android/app/build/outputs/apk/release/app-release.apk`.

Esta variante usa la firma de desarrollo generada por la plantilla para pruebas internas. No es la identidad de firma definitiva de la empresa. Para actualizaciones y distribución real se necesita un keystore de la empresa, guardado fuera del repositorio, una política de custodia y un build autorizado. No publicar este APK en Play Store.

La demo no requiere Google Services ni credenciales Firebase. No confundir el modo demo con backend productivo. Permisos de cámara/fotos/ubicación se solicitan al usar esas funciones. No hay SDK publicitario.

## Particularidades del entorno remoto

Se usaron SDK/NDK bajo `/workspace/android-sdk`, caché Gradle `/workspace/gradle-cache` y JDK descargado por API oficial de Adoptium con SHA-256. El proxy existente se conserva con `GRADLE_OPTS`; no desactivar TLS. `ANDROID_USER_HOME` fija una carpeta escribible; no establecer a la vez un ANDROID_PREFS_ROOT incompatible. No se modifica HOME.

El resultado instalable deberá inspeccionarse con `apksigner verify`, `aapt dump badging` y ZIP CRC, y luego probarse en un Android ARM64 real. No se afirma prueba física por el mero hecho de obtener un APK.

## APK de esta entrega

Compilación final correcta11m10, ARM64 Android7+, firma APKv2 verificada, 49.078.452bytes. No probado físicamente. Descargar `repartos-chema-demo-arm64.apk` desde el chat, abrirlo en Android y autorizar la instalación desde ese navegador/gestor solo si confías en esta entrega. No desactivar protecciones generales del dispositivo. Si Android rechaza la instalación, conservar el mensaje exacto; no desinstalar una versión con datos sin exportar antes su copia JSON.

Abrir Repartos Chema y elegir perfil de prueba ADMIN u OPERADOR. Los datos son locales de demostración; no se comparten entre celulares. Firma con clave de prueba de plantilla: pendiente clave productiva administrada.

## Actualización1.1.0

versionCode2, mismo certificado de prueba que1.0. Instalar encima sin desinstalar; copiar datos JSON antes. APK definitivo candidato v1.1.0-demo.2 en rama descargas del GitHub privado. Primer build completo14m2 y corrección incremental2m23. No son pruebas físicas. El parser de invitaciones ya no depende de URL de navegador; regresión unitaria reproducida y corregida.
