# Continuidad Repartos Chema — 17/10/2026

## Alcance y estado actual

Edición individual Android local/offline1.3.0/code6, ARM64, package `com.grupochema.repartos`. Instalación nueva vacía; actualización conserva datos. Sin publicidad ni Firebase/Cloudflare/backend obligatorio o servicios pagos. No retomar multiusuario/PDF/Play Store ni cambiar certificado. No borrar datos para corregir errores.

El usuario autorizó cierre local y Aurora/glass integral. UI lista en4a82322, resolución reproducible del decoder en **d5da6a599243b8433c4be2cdf41524ea27ad5ef2**. Docs/firma en **a9608a6**; consultar git log/remoto para commits documentales siguientes. Main para código; descargas para artefactos, siempre preservando anteriores. No force push.

**Segundo Gradle completo en ejecución**, log `artifacts/validacion/aurora-android.txt`. Instantánea parcial subida en aurora-android-progreso.txt; no equivale a build terminado. El primer intento perdió el entorno03:42–03:44UTC; no sobrevivieron su log/ZIP/toolchain ni un APK1.3. Se recuperó el proyecto desde GitHub. No se conoce la causa del reinicio; no afirmar OOM o fallo del compilador. No lanzar otro Gradle sin revisar primero proceso/log/APK existentes.

## Bloques cerrados (no repetir auditoría/desarrollo)

- d26a9ef: validación semántica de copias nuevas,39casos, sin endurecer el arranque legacy a ciegas.
- 636781e/deb23ce: SQLite nativo transaccional y migración preservando AsyncStorage, sin fallback viejo cuando falta SQLite.
- 3506b9e: tokens y Aurora compartidos, separado de datos; SVG/Animated y vidrio de alta opacidad sin blur pesado por tarjeta. Claro/Oscuro/Sistema, preferencia persistente, opción estática, reducir movimiento y pausa por segundo plano/ruta oculta.
- e9d0770: carpeta externa con lectura de comprobación, cancelación segura, fotos UUID y bytes conservados para recuperaciones.
- 6c90f2e: parches compatibles SDK57, fixtures sintéticos, versión1.3.0/code6.
- 1c7bb72: recuperación explícita con SQLite ausente/bloqueada; marcador fuera de cuota AsyncStorage; copias validadas como importables antes de permitir vaciado.3fallos importantes de revisión corregidos con regresiones.
- 62e04a4: decoder0.5.0 MIT adaptado a CJS, bloqueo adversario corregido.
- d5da6a5: instalación limpia reveló enlace transitivo file inválido. Dependencia local directa + override `$decode-uri-component`, lock raíz correcto. No cambia bytes/API del decoder ni reglas de stock.

Informe y capturas: `docs/ENTREGA_AURORA_1_3.md`. Plan original: `docs/superpowers/plans/2026-10-17-cierre-local-gratuito.md`; especificación visual posterior prevalece sobre su antigua restricción de rediseño. Antecedentes en Git y docs/archivo.

## Verificaciones comprobadas

- Npm ci limpio:1560paquetes/2min. Rojo/verde `aurora-npm-ci-{red,green}.txt`; consumidor decoder2/2 `aurora-decoder-ci.txt`.
- Nuevo `npm run check` después de restaurar: **175/175**,21archivos, tipos/lint/Functions build correctos (`aurora-check-restaurado.txt`). Functions no desplegado ni prueba productiva.
- Suite UI anterior sobre mismo código visual: **31/31 en5.6min**, `aurora-ui-entrega.txt`, tamaños320/360/390/768/1440, capturas Aurora claras/oscuras, Axe, operaciones, copias/fotos, documentos, temas.
- Reexportación web tras lock reparado correcta (`aurora-web-restaurada.txt`). **3/3 recorridos locales nuevos en28.5s**, `aurora-ui-lock-restaurado.txt`: inventario/operaciones/JSON/documentos/offline y temas/formulario. No se repitió la suite completa sin cambios UI.
- SQLite real de Node: >7MiB, rollback/idempotencia/fallos/recuperación. APIs de archivos nativos con dobles de prueba. No son Android físico.
- Expo install --check correcto dentro SDK57. Audit histórico27entradas(18altas/9moderadas,3avisos raíz) tras corregir decoder; avisos transitivos restantes documentados. No afirmar0vulnerabilidades.
- Sin ADB conectado ni emulador operativo. Pendientes instalación/actualización/migración ExpoSQLite físicas, permisos/cámara/galería, carpeta/readback, Compartir/importar y accesibilidad/rendimiento Android. Sin FPS/RAM/batería medidos.

## Respaldo remoto y firma recuperada

GitHub privado autorizado `kkshiiit/repartos-chema`. Descargas **6059dcbd6e8c54a108aa7b7431a150dd7425bc06** contiene `respaldos/v1.3.0-local/repartos-chema-d5da6a5.zip`:371archivos,8.536.276bytes, SHA256 `0a9764dd301bc23164e38c0d63c963c4c6265452b55383a7c51d25a125a48b11`. Recuperado desde GitHub en checkout independiente; CRC y todos los hashes restaurados coinciden (`aurora-fuente-github.json`). No depende solo del workspace.

Firma de plantilla regenerada y **comparada con1.2.2: coincide**, prueba `aurora-firma-restaurada.json`. Copia fuera de Git en `/workspace/respaldos/firma-interna/chema-restaurada-1.3.keystore`, modo600. Es clave interna genérica de plantilla, no identidad productiva de la empresa. CertificadoSHA256 `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`.

APK1.2.2 recuperado de GitHub en `/workspace/entregas/pulido-1.2.2/repartos-chema-local-1.2.2-arm64.apk`, SHA `43835da902859f6c5af77947d315fb8ec2922d9921cebe558948460b0f1ba8eb`. Sigue siendo el último instalador publicado hasta verificar/subir1.3.0. No presentar el antiguo como nuevo.

## Próxima acción exacta

1. Leer git status/log/ls-remote y el final de `aurora-android.txt`. Revisar procesos/archivo antes de reiniciar Gradle. Si BUILD SUCCESSFUL, verificar APK existente.
2. `python3 scripts/verify-android.py android/app/build/outputs/apk/release/app-release.apk /workspace/entregas/pulido-1.2.2/repartos-chema-local-1.2.2-arm64.apk /workspace/entregas/aurora-cierre d5da6a5`, con JDK21. Verifica versión/ABI/CRC/firma misma/SQLite nativo/config y no sobrescribe instaladores.
3. Registrar resultado, actualizar informe/manual y push main; generar ZIP fuente final restaurado. Reponer únicamente las muestras Word/Excel regeneradas por tests desde HEAD antes de empaquetar. No descartar cambios de usuario.
4. Publicar APK único+SHA+verificación y ZIP final/web en descargas: `android/v1.3.0-local.1/` y `respaldos/v1.3.0-local/`. Repo local `/workspace/entregas/apk-github-20261017` es clone parcial/sparse; preservar todo fuera del sparse checkout. Fetch/ff, nunca force.
5. Recuperar APK/ZIP desde GitHub mediante `/workspace/recuperacion-github-130`, comprobar SHA/CRC/manifiesto, guardar evidencia. Actualizar README/checkpoint con enlaces y commits reales; push final.
6. Puerta física: usuario guarda JSON fuera de la app, instala encima sin desinstalar, verifica datos/tema/fotos y migración, modo avión y carpeta/Compartir. No declarar esa puerta completada sin resultado físico.

## Entorno y comandos

Toolchain restaurado: JDK `/workspace/jdk21/jdk-21.0.12.1+1`, SDK `/workspace/android-sdk`, build-tools36.0.0, NDK27.1.12297006, CMake3.22.1. GRADLE_USER_HOME `/workspace/gradle-cache`, ANDROID_USER_HOME `/workspace/android-user`. No establecer ANDROID_PREFS_ROOT ni modificar HOME.

Segundo build: env -u ANDROID_PREFS_ROOT, `ORG_GRADLE_PROJECT_kotlin.compiler.execution.strategy=in-process`, JAVA_HOME/ANDROID_HOME anteriores, GRADLE_OPTS con proxy HTTP/HTTPS `proxy:8080`, trustStore `/etc/ssl/certs/java/cacerts`, org.gradle.daemon=false y org.gradle.parallel=false, EXPO_NO_TELEMETRY=1. Ejecuta `npm run build:android:demo` (Gradle assembleRelease ARM64,2workers). No reanudar un build copiando solo JS a un APK viejo.

`npm ci`; `npm --prefix functions ci`; `npm run check`; `npm run build:web`; `npm run preview` (8081); `CHEMA_TEST_LOCAL=true npm run test:ui -- tests/ui/local.spec.ts --workers=1`. No imprimir tokens ni cambiar credenciales sin fallo real. No hay automatización de continuidad activa ni promesa de ejecución futura.

Los JSON/fotos locales no están cifrados. AutoBackup Android existente no sustituye copia externa comprobada. No eliminar archivos/fotos retenidos para ganar espacio sin exportación y autorización. Sin gastos ni despliegue productivo.
