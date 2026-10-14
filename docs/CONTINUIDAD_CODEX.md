## Punto de compilación 14/10 19:34 UTC

- Commit estable `52aa064`, copia restaurada verificada. Suite actual 19/19 UI (incluye axe) y check 74; backend 14/14.
- Build JDK funciona y compila CMake ARM64, log `chema-android-jdk-build.log`; aún sin APK. No detener salvo error/timeout. JAVA_HOME `/workspace/jdk21/jdk-21.0.12.1+1` y GRADLE_OPTS añade `-Djavax.net.ssl.trustStore=/etc/ssl/certs/java/cacerts` para conservar CA del proxy.
- `app.json` cambió después del prebuild en curso: bloquea RECORD_AUDIO y SYSTEM_ALERT_WINDOW y desactiva microphonePermission. **Antes de entregar APK, regenerar manifest/prebuild y recompilar con esa exclusión; verificar permisos con aapt.**
- Web empaquetada/restaurada: `/workspace/entregas/repartos-chema-web-20261014.zip` y SHA/acta. No equivale a URL pública accesible desde Android.
- Script nuevo `scripts/package-web.py` pendiente de commit; no sobrescribe entregas existentes. Registros actuales en artifacts/validacion. Finalizar reporte y paquetes después del resultado Android.

## Prioridad del usuario — entrega hoy 14/10 a las 21:00 Argentina

Trabajar sobre la versión validada y producir APK interno ARM64; no añadir funciones ahora. Demo local sin configuración productiva. La suite web actual pasó 19/19, incluida accesibilidad axe. JDK21 oficial descargado y verificado SHA-256 en `/workspace/jdk21/jdk-21.0.12.1+1`. Build con `npm run build:android:demo`, JAVA_HOME a ese directorio, ANDROID_HOME al SDK, GRADLE_USER_HOME a caché y proxy/TLS del entorno. Log `/workspace/informes/chema-android-jdk-build.log`. No APK hasta comprobar resultado. No prometer trabajo automático entre ejecuciones.

# Reanudación actual — 14/10/2026 19:29 UTC

El entorno reinició procesos; archivos y commits intactos. Se levantó preview de nuevo. No hubo trabajo automático prometido entre ejecuciones. La última tentativa Android falló por JRE21 sin JAVA_COMPILER (`javac` ausente); SDK/NDK/CMake/Gradle ya instalados. Siguiente acción: descargar JDK21 oficial Adoptium en workspace, verificar SHA-256, ejecutar Gradle con JAVA_HOME de ese JDK. Log anterior `chema-android-build-final.log`.

Cambios posteriores a `5530d4c` aún sin commit: dependencia de desarrollo @axe-core/playwright y test WCAG AA; tablist y aria-selected en navegación, foco de teclado en métricas. Primer axe encontró esos errores; corregidos y web regenerada. `check` pasó 74. Nueva suite 19 casos en ejecución: `/workspace/informes/chema-ui-20261014-1929.log`; la tentativa previa tras reinicio falló por preview apagado, no se cuenta como aprobada. `artifacts/validacion/ui.txt` conserva último 17/17 antes de axe.

Reportes/manual/árbol creados, faltan cierre APK, actualizar resultados finales y paquetes. Respaldos `5530d4c`, `1436419`, `c634908` verificados. Releer estado abajo para detalle histórico, sin repetir auditoría.

# Continuidad de Repartos Chema

Actualizado: 14/10/2026, 07:40 UTC. **Misión en curso, no finalizada.**

## Objetivo y permisos

Completar la app interna offline-first para Grupo Chema: integridad de inventario, cero publicidad, temas claro/oscuro/sistema, demo persistente sin credenciales. Modificaciones, pruebas y commits locales autorizados. No gastos, despliegues productivos, publicaciones ni repositorios remotos sin autorización. No hay automatización verificada que reanude este workspace; no se configuró ninguna.

## Fase actual

Respaldo original y versionado completos. Persistencia/inventario, retirada de anuncios, temas, documentos locales y recuperación implementados; se están cerrando integración, pruebas visuales, compilación Android y documentación. Las pruebas físicas y producción siguen pendientes.

## Guardado y respaldo

- Git local `main`, sin remoto. Base `5c554c4`, datos `d258544`, temas/fotos `c634908`; consultar `git log -5` para puntos posteriores.
- Original: `/workspace/respaldos/chema-original-20261013/repartos-chema-original.zip`, 92 archivos, CRC y todos los SHA comprobados tras extraer. No sobrescribir.
- Punto anterior: `/workspace/entregas/puntos-control/repartos-chema-c634908.zip` y manifiestos.
- `scripts/package.py` crea ZIP de archivos versionados con manifiesto y verifica restauración. Ejecutar con árbol limpio tras commit para que el nombre corresponda al contenido.

## Completado y comprobado

- Corrupción/errores de lectura/escritura no reinician datos; conflictos persistidos siguen visibles; recuperación ADMIN archiva el sobre previo antes de reemplazar.
- Stock protegido, movimientos taller/perdido, correcciones, medidas por variante, fechas efectivas separadas, revisión de formularios y operaciones idempotentes.
- Faltantes fuera del maestro registran ítem y aviso sin inventar stock; recuperación conserva auditoría.
- Retiradas agrupa RETIRADO/REINGRESADO. Cero componentes/dependencias/configuración publicitaria en fuente actual.
- Temas dinámicos y persistentes, acceso rápido en cabeceras y modales. Paletas contrastadas mediante tests.
- Fotos web IndexedDB, copia con imágenes, IDs nuevos al restaurar, conservación preventiva y prueba de reinicio. No respaldadas automáticamente en nube demo.
- Word y Excel descargados realmente en Chromium. Generador nativo implementado, pendiente ejecución física.
- 14/10 `npm run check`: 74 pruebas, tipos, lint y build Functions correctos.
- 14/10 emuladores: 14/14 (7 reglas y 7 handlers backend, incluidos documentos privados y bytes JPEG). Handler con contexto Auth controlado y Firestore real emulado; no acredita transporte callable HTTP/FCM.
- 14/10 web exportada; suite UI actual 17/17 aprobada (incluye triangulación/daño/recuperación y foto/copia/restauración). 48 capturas en `artifacts/capturas`. Bundles Hermes Android/iOS generados, no son APK.

## Trabajo abierto

- Suite UI final aprobada. Capturas dashboard 390 claro/oscuro revisadas visualmente; falta validación física/ampliación de texto.
- Android SDK oficial instalado parcialmente; plataforma 36 disponible, build-tools/NDK/platform-tools en descarga. Sin APK aún. Revisar logs `/workspace/informes/chema-sdk-*.log`.
- Compilar APK si viable y regenerar bundles nativos sin anuncios; probar exportaciones nativas en dispositivo cuando esté disponible.
- Revisar seguridad restante: FCM nativo no implementado, reintentos parciales FCM, tokens al cerrar sesión. Auditoría remota de deshacer corregida y probada. Reintentos parciales FCM implementados, pendientes de prueba FCM real. Fotos remotas usan enlaces privados con token; precisar límites.
- Auditoría dependencias: override grpc 1.14.6 aplicado; repetir audit y documentar avisos upstream sin forzar downgrades.
- README/ARQUITECTURA/FIREBASE actualizados; manual, validación, cambios y árbol creados. Completar reporte final y entregar ZIP fuente/web con hashes nuevos.
- Firebase real, credenciales, CORS, usuarios verificados, FCM, hardware, firma de distribución y autorización de despliegue pendientes externos.

## Archivos del punto actual

FaltantesForm, dominio/schema/types/validation y tests; backupService y PhotoImage; detalle; dependencia directa buffer; nuevos tests backup/backend/recovery, configs Vitest y scripts/package.py. Ver `git show --stat` para inventario exacto. No secretos.

## Comandos

Desde `/workspace/repartos-chema`:

```bash
npm run check
XDG_CONFIG_HOME=/tmp/chema-firebase node -r ./scripts/emulator-local.cjs ./node_modules/firebase-tools/lib/bin/firebase.js emulators:exec --project demo-repartos-chema --only firestore,storage 'npx --no-install vitest run --config vitest.integration.config.mts'
EXPO_NO_TELEMETRY=1 __UNSAFE_EXPO_HOME_DIRECTORY=/tmp/chema-expo npm run build:web
npm run preview
npm run test:ui -- --workers=2
python3 scripts/package.py /workspace/entregas/puntos-control
```

Red/procesos de navegador/emuladores requieren permisos de red del sandbox. Conservar proxy y certificados. No reasignar HOME. Logs de esta ejecución: `/workspace/informes/chema-*-20261014.log`.

## Próxima acción exacta

Leer resultados de `chema-ui-20261014.log` y descargas SDK; resolver fallos, ejecutar build Android con SDK/Gradle en `/workspace`, completar documentación y paquetes. No repetir la auditoría ni recrear la app. Actualizar este documento antes de terminar.

## Registro histórico (los resultados de arriba prevalecen)

## Punto de control — datos e inventario, 13/10 22:14 UTC

- Fases 3–4: implementadas las regresiones principales. `npm run check` terminó con código 0: typecheck, lint, 66 pruebas (incluyen aún 3 publicitarias) y build Functions. Repository: 14 pruebas aprobadas.
- Nuevos módulos: `src/data/validation.ts`. Modificados repository, InventoryContext, dominio/types/schema/rules, formularios de obra/carga/operación, Galpón, Combos, detalle y tests. Consultar commit para diff exacto.
- Conflictos reabiertos siguen recuperables; lectura/corrupción no reinicia datos; fallo de persistencia no publica cambios. Stock externo puede moverse entre depósitos y darse de baja sin consumir faltantes vinculados. Corrección ADMIN vuelve al saldo real o reclasifica faltantes. Las medidas son identidad de variante, sin conversión física ni cambio sobre materiales usados. Entrega conserva fecha prevista y registra efectiva. Versiones protegen formularios obra/material/combo; carga captura versión. Se añadieron observaciones e identidad histórica en auditoría.
- Pendientes de esta fase: validación UI nueva, backup/importación de datos de usuario, fotos/quota, servidor y escenarios de integración. No se consideran todas las fases aceptadas por las pruebas unitarias.
- Próximo paso: retirar publicidad; generación local de documentos; sistema de temas y validación UI completa.

## Punto de control — temas, documentos y UI, 13/10 22:25 UTC

- `npm run check`: 70 pruebas aprobadas, tipos/lint/build Functions con código 0, después de añadir temas y copia/restauración. Cambios posteriores (errores traducidos/compactación/SDK Android) requieren nuevo check.
- Publicidad retirada de fuente, configuración y dependencia. Falta acta final de búsqueda sobre todos los bundles regenerados.
- Temas claro/oscuro/sistema implementados, preferencia `chema:theme:v1`, detección en vivo, botón en login/cabeceras/modales, estilos dinámicos y barras del sistema. Contraste: primer test de borde oscuro falló (2.84:1), corregido; los 5 tests de paleta pasan.
- Web exportada a las ~22:20, build correcto (79 s Metro), principal 5.4 MB frente a 6.35 MB histórico; no afirmar latencia móvil medida. Documentos ahora cargan diferidos. Word y Excel descargados en Playwright satisfactoriamente.
- Playwright: 14/15 pasaron; el único fallo fue atributo de estado del selector de tema. Corregido a `aria-pressed` con rol botón; necesita nuevo build/rerun. Formularios, live system y persistencia parcial alcanzados antes del fallo. Capturas reales: 48 en `artifacts/capturas`, 390/1440 px claro/oscuro. Inspeccionadas tres; cabecera móvil todavía alta y se compactó después. Rehacer capturas finales.
- Emuladores Firestore/Storage: 6/6 pasaron. Añadida séptima prueba para documentos existentes/propietario/expirados, pendiente rerun.
- Fotos web nuevas en IndexedDB con referencias cortas; caché local de fotos remotas y borrado local. Demo: copia JSON con fotos; restauración ADMIN con validación y archivo preventivo; dos tests de restauración pasan. No borrar datos del usuario durante pruebas; solo perfiles/browser aislados.
- Functions: recibo previo a validar foto, URL de bucket exacto, DomainError separado de fallos transitorios, notificaciones agotadas salen de reintentos, bootstrap conserva fecha de alta, exportaciones agrupan Retiradas. Integración callable y FCM real aún no probadas.
- Auditoría npm detectó 34 alertas (22 altas, 12 moderadas), varias transitivas de herramientas. No usar `audit fix --force` (propone downgrades incompatibles). Aplicando override compatible @grpc/grpc-js 1.14.6. Braces 3.0.3 y node-forge 1.4.0 siguen siendo últimas versiones consultadas, con avisos abiertos; registrar límites de producción. Informe original `/workspace/informes/chema-npm-audit-app.json`.
- Android: `expo prebuild --platform android --no-install --skip-dependency-update react,react-native` exitoso. Directorio generado ignorado en Git; todavía NO APK. Descargando herramientas SDK oficiales para investigar build local gratuito. Sin claves Firebase ni publicación.
- Próximo paso exacto: terminar instalación SDK si viable; corregir checks de última fuente, build web, suite UI completa (incluida foto/backup), integración de 7 reglas, validaciones de Functions, documentación y paquetes con hashes. Actualizar este archivo y commits antes de cualquier interrupción. Misión sigue pendiente.

## Punto Android 14/10 07:40 UTC

- Gradle 9.3.1 descargado y plugins Kotlin compilando. Log `/workspace/informes/chema-android-build.log`. JVM precisa `GRADLE_OPTS` con proxy heredado del entorno; no desactivar TLS. SDK plataforma36/build-tools36/platform-tools instalados.
- SDK CLI NDK agotó 480 s; descarga oficial con curl reanudable `/workspace/scratch/android-ndk-r27b-linux.zip`, log `chema-ndk-curl.log`. Tamaño esperado 663976775, SHA1 oficial 6fc476b2e57d7c01ac0c95817746b927035b9749; validar antes de extraer a `/workspace/android-sdk/ndk/27.1.12297006`. CMake3.22.1 reintento por CLI.
- Build: desde android, `ANDROID_HOME=/workspace/android-sdk ANDROID_USER_HOME=/workspace/android-user GRADLE_USER_HOME=/workspace/gradle-cache GRADLE_OPTS='-Dhttp.proxyHost=proxy -Dhttp.proxyPort=8080 -Dhttps.proxyHost=proxy -Dhttps.proxyPort=8080' ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a --max-workers=2`. Configuración del proxy solo para este entorno. No APK comprobado todavía.
- Último commit de recuperación `1436419`, ZIP verificado correspondiente en puntos-control. Cambios actuales de cierre requieren commit.
