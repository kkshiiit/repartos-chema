# Punto activo — papel/cobalto 1.4.0 en validación (18/10/2026)

Base 1e5dcc9; paquete autorizado completo y manifiesto verificado. Bloques publicados:1542ce4 insumos/deps,80d4649 primitivas,d35a01c avisos opt-in. Implementación de rutas y wizard lista, check actual217/217 (27 archivos), typecheck/lint/functionsbuild correctos. Build web local individual correcto: script garantiza LOCAL_ONLY=true/DATA_MODE=demo. Firma Android existente coincide con1.3 fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c. No dispositivo ADB.

Primer recorrido web:25 pasan,17 fallan (log artifacts/validacion/cobalto-ui-intento1.txt): detectó desbordamiento320, doble Escape web, selectores viejos tras reorganización y build iniciado sin flagindividual. Corregidos en código; segundo recorrido en marcha con captura/contraste/texto200. No es validación final todavía.

Próximo paso exacto: leer /tmp/chema-ui-cobalto2.txt; corregir fallos reales y repetir afectados, inspeccionar capturas; verificar npmci limpio. Respaldar cambios por bloques antes Gradle completo. Versión prevista1.4.0/code7, mismo package/cert. Todavía NO hay APK nuevo. No se modificaron dominio, SQLite, migración ni validación JSON. Falta respaldar y publicar nueva carpeta descargas, recuperar APK desdeGitHub y compararhash. Ver docs/REDISENO_PAPEL_COBALTO.md para cobertura y docs/AVISOS_LOCALES.md para límites.

---

> **Preparación visual posterior:** se instalaron únicamente las7skills solicitadas en `.agents/skills/`, sin cambiar la app ni recompilar. Procedencia, licencias, verificaciones y adaptación de un enlace en [HERRAMIENTAS_UI.md](HERRAMIENTAS_UI.md). **Esperar referencias y especificación visual antes de implementar.** Este bloque no autoriza migraciones, bibliotecas o servicios. El estado de la entrega1.3.0 inferior se conserva como antecedente.

# Continuidad Repartos Chema — 17/10/2026

## Alcance y estado actual

Edición individual Android local/offline1.3.0/code6, ARM64, package `com.grupochema.repartos`. Instalación nueva vacía; actualización conserva datos. Sin publicidad ni Firebase/Cloudflare/backend obligatorio o servicios pagos. No retomar multiusuario/PDF/Play Store ni cambiar certificado. No borrar datos para corregir errores.

El usuario autorizó cierre local y Aurora/glass integral. UI lista en4a82322, resolución reproducible del decoder en **d5da6a599243b8433c4be2cdf41524ea27ad5ef2**. Docs/firma en a9608a6, build/verificación en c3f2676, documentación de entrega y snapshot final en **1d37618**; este commit posterior registra la publicación/restauración. Consultar git log/remoto para el hash de cierre actual. Main para código; descargas para artefactos, siempre preservando anteriores. No force push.

**APK1.3.0 publicado y recuperado desde GitHub**, APK en descargas5ae0da1 y respaldo final en53b4ad9. Segundo Gradle completo: BUILD SUCCESSFUL14m46s,658tareas; log aurora-android.txt. El primer intento se perdió con el reinicio del entorno y no se cuenta como éxito. No recompilar por cambios documentales. Siguiente puerta: prueba física en Android del usuario.


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

## APK publicado y comprobado

[Descargar1.3.0](https://github.com/kkshiiit/repartos-chema/raw/refs/heads/descargas/android/v1.3.0-local.1/repartos-chema-local-1.3.0-arm64.apk). 51514361bytes, SHA256 `5404659c3ce0dec2149508e81f85c817664be7dbe42294d344e9fb23a2c4cb8b`. Android7+,ARM64,versionCode6,package com.grupochema.repartos. Firma v2/certificado1.2.2, SQLite nativo, CRC y no debuggable comprobados; no anuncios ni configuración Firebase detectados. **Sin prueba física.**

Descargas **5ae0da176f789b82b28a0bc0741578073df54bbc**; instalador único y web, versiones anteriores preservadas. APK y fuente d5da6a5 recuperados desde GitHub en checkout independiente; SHA/CRC/firma y371archivos fuente correctos. `aurora-github.json`. Ver README e informe para capturas/enlaces.

## Respaldo final publicado y restaurado

Descargas **53b4ad958df23ea675385dd8ca73aa0f4acf4530**. `respaldos/v1.3.0-local/repartos-chema-1d37618.zip`:381archivos,8.544.827bytes, SHA256 `f099475912c001b0bab40d15627e6919ce8dad2a427072be706575e61e3a5f3c`. Se recuperó desde GitHub, CRC y todos los hashes restaurados correctos. Snapshot incluye runtime d5da6a5, documentación, capturas y logs finales hasta1d37618. El APK conserva exactamente el blob verificado de5ae0da1. Archivo `aurora-github.json` registra ambas comprobaciones. Exportación web1.3 y fuentes previas conservadas.

## Próxima acción exacta

1. Entrega y respaldo final completos. No recompilar APK por documentos; su runtime es d5da6a5. Siguiente puerta: actualización/migración en Android físico según pasos3–5.
2. Si otra sesión continúa, leer git status/log/ls-remote antes de tocar nada. No rehacer lock, migración, auditoría ni Aurora. Comprobar hashes/enlaces existentes, no repetir publicación ni auditoría sin un fallo nuevo.
3. Usuario Android: guardar JSON externo desde la versión anterior, descargar APK e instalar encima sin desinstalar; verificar nombre/tema/alquileres/cantidades/fotos. Probar cierre/reapertura y modo avión con una operación pequeña.
4. Probar Guardar copia en carpeta, cancelar sin efectos y abrir/compartir Word/Excel. Cámara/galería/GPS/Maps/WhatsApp por separado. No usar el único inventario real para ensayar restauración destructiva sin copia.
5. Si falla la puerta física: conservar mensaje/modelo/Android/datos; reproducir y corregir con regresión, commit/push antes de nuevo build con nueva versión. No borrar almacenamiento ni rotar firma para solucionar un fallo.


## Entorno y comandos

Toolchain restaurado: JDK `/workspace/jdk21/jdk-21.0.12.1+1`, SDK `/workspace/android-sdk`, build-tools36.0.0, NDK27.1.12297006, CMake3.22.1. GRADLE_USER_HOME `/workspace/gradle-cache`, ANDROID_USER_HOME `/workspace/android-user`. No establecer ANDROID_PREFS_ROOT ni modificar HOME.

Segundo build: env -u ANDROID_PREFS_ROOT, `ORG_GRADLE_PROJECT_kotlin.compiler.execution.strategy=in-process`, JAVA_HOME/ANDROID_HOME anteriores, GRADLE_OPTS con proxy HTTP/HTTPS `proxy:8080`, trustStore `/etc/ssl/certs/java/cacerts`, org.gradle.daemon=false y org.gradle.parallel=false, EXPO_NO_TELEMETRY=1. Ejecuta `npm run build:android:demo` (Gradle assembleRelease ARM64,2workers). No reanudar un build copiando solo JS a un APK viejo.

`npm ci`; `npm --prefix functions ci`; `npm run check`; `npm run build:web`; `npm run preview` (8081); `CHEMA_TEST_LOCAL=true npm run test:ui -- tests/ui/local.spec.ts --workers=1`. No imprimir tokens ni cambiar credenciales sin fallo real. No hay automatización de continuidad activa ni promesa de ejecución futura.

Los JSON/fotos locales no están cifrados. AutoBackup Android existente no sustituye copia externa comprobada. No eliminar archivos/fotos retenidos para ganar espacio sin exportación y autorización. Sin gastos ni despliegue productivo.
