# Herramientas del proyecto: Agency Agents — 24/10/2026

Alcance de esta ejecución: instalar y verificar perfiles de proyecto, sin modificar ni compilar la aplicación. Base main55c0725/remoto coincidente y limpio. Se agregaron7TOML en `.codex/agents/`: chema_arquitectura_datos, chema_react_native, chema_accesibilidad, chema_qa_evidencia, chema_rendimiento, chema_seguridad y chema_entrega_android. Upstream4e3ac3ca6604c75113f52c695dbddcc7af928b46, adaptados al stack/edición local en español; licencia MIT y hashes en ORIGEN.json. Skills/config existentes conservados; no nuevo config.toml, modelos, MCP, servicios ni permisos.

Verificación:7TOML correctos y loader nativo CodexCLI0.159.2 reconoció7nombres en prueba controlada sobre la ruta real; duplicados temporales retirados, carga final0advertencias. Sólo initialize/config/read, sin turn/start/inferencia. Confianza configurada únicamente en home temporal de prueba; no cambiarla en configuración personal. Catálogo de esta sesión no recargado ni selector agent_type expuesto: para invocar nativamente abrir sesión nueva desde repo con confianza del cliente; alternativa lectura explícita del perfil sin fingir subagente. Guía y pruebas en docs/AGENCY_AGENTS.md y AGENCY_AGENTS.verificacion.json.

**La app y el APK1.6 del cierre inferior no cambiaron.** No reconstruirlos por instalar perfiles. Próximo paso: usar sólo el especialista necesario cuando el usuario indique una tarea; si pide APK, entregar la versión ya publicada. Estos perfiles no activan rediseños ni trabajo persistente automático. Consultar gitlog para el commit de esta instalación.

---

# Cierre1.6 individual — APK publicado y recuperado — 23/10/2026

**Completado dentro del acceso disponible. Próxima acción: prueba física en Android del usuario.** No reconstruir ni continuar rediseño por un cambio documental. La ejecución actual no activa continuidad automática ni servicios pagos.

Runtime APK: **295a97757446310eba5a48260804ae7b655ec0dd**, versión1.6.0/code9, packagecom.grupochema.repartos, ARM64/Android7+,56174111bytes. Main anterior a este cierre206793b; el siguiente commit guarda informe/pruebas de publicación(consultar gitlog). DescargasAPK **4f4f7988a2c194637df6a0ab37bfdcbb65f1f8b5**, fuente295a977 en96e2274 y web enfad45fc. Descargar android/v1.6.0-local.1/repartos-chema-local-1.6.0-arm64.apk.

SHA256 **29a4a57b7ea1a746c6127d2f8b688b12278a7e41837bd8f85e05eb97ba3bf675**. Certificado **fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c**, mismo que1.5/1.4. Gradle completo BUILD SUCCESSFUL9m32s/701tareas; firma v2,CRC,ABI,minSDK24,no debuggable,SQLite/tresWAV porhash y marcadoresnuevos comprobados. Recuperado desde clon independiente, hash/CRC idénticos y7APKanterior blobs intactos. Ver avisos-descarga-remota.json. APK1.5 anterior permanece preservado localmente en /workspace/entregas/cobalto-1.5.0, no confundir con1.6.

Check final436/436 en37archivos, tsc/lint/Functions build pasan. UIgeneral56/56(4.1min); tras ajuste de formulariolegacy y rolgrupo6/6repetidos(44.5s),8Axe0violaciones/0incompletas. Npmci limpio1565paquetes y lock/decoder verificados. Web exportada;19comparativas reales, manifiesto/capturas/GALERIA_AVISOS_1_6.md. Contraste/renderweb no eshardware. Npm audit9entradas propagadas,0críticas, revisióncompatible pendiente; no auditfix/downgrade.

FechaRetiroEstimada se presenta Alquilado hasta; no nuevofincomercial distinto. CountdowncalendarioArgentina sin guardar días, hookmedianoche/resume. Un único ReminderService migrado v1→v2, generaloptin08:00+3/2/1/0, herencia/personalizaciónreal, manualprotegido, intenciones/cancelaciones/reintentos/permisos converdadparcial. No altera stock. Legacyfechasinválidas se leen sinreescribir y se completan explícitamente; nuevoscomandos/importactivos siguenestrictos. SQLite/migración/fotos/JSON/reglasstock sinreescribir. Automáticossilenciosos independientesdeconfirmaciones, sólohorariosfuturos. Taps esperan sesión/inventario/navegación.

**Límites reales:** adb sin dispositivo/emulador. Instalación/migraciónfísica, calendario, cámara/compartir, notificaciones con appcerrada/reinicio/puntualidad, TalkBack y rendimiento debenprobarse. APK no declaraalarmasexactas; OS puede retrasaravisos. Web no programaavisos. Sin nube/Ads/Firebaseobligatorio/facturación/PlayStore/PDF.

**Retomar:** comprobarworkspace/git/remoto y este punto. Si pideAPK, entregar enlaceexistente y pasosAndroid en ENTREGALOCAL1.6; no recompilar. Si informaerror, conservaroriginal/JSON, reproducirproblemaespecífico sinreset/desinstalar. ClavefueraGit /workspace/respaldos/firma-interna/chema-restaurada-1.3.keystore; no publicar/incluirenZIP ni cambiarfirma. Fuente/runtime295a977 respaldada y restaurada; cierre documental se empaqueta aparte preservando snapshot previo. Guía/informe: docs/ENTREGA_LOCAL_1_6.md y AVISOS_RETIRO_1_6.md.

---

# Gradle1.6 en curso y fuente recuperada de GitHub — 23/10/2026 21:27UTC

Código funcional congelado295a977, main respaldado antes de compilar. ZIP1254archivos en descargas96e2274, SHAeefd6b61ea2fb60b51ce62d873ff89784d40a24a2ad9978d2ce57487d6af8759; restauración local completa y recuperación desde clon independiente con hash/CRC iguales. WebZIP en descargasfad45fc. No borradas versiones anteriores. Reporte principal preparado docs/ENTREGA_LOCAL_1_6.md.

**Proceso actual:** Gradle completo `npm run build:android:demo` iniciado tras backup limpio, log `artifacts/validacion/avisos-android.txt`, sesión shell28857 en esta ejecución. Selector9.1.0 Java/Kotlin compiló, CMake ARM64 avanzó, bundle generado y lintVital en curso. No BUILD SUCCESSFUL al escribir. No presentar instalador como terminado aún. No hay teléfono/emulador conectado. Clave externa/paquete conservados; no sourcechange durante build.

**Próxima acción exacta:** leer final del log y revisar APK existente ANTES de decidir recompilar. Si termina correcto ejecutar verify-android.py contra APK1.5 preservado, fuente295a977; copiar instalador único1.6.0/code9, comprobar SHA/firma/CRC/ARM64/SQLite/sonidos/noads/noFirebaseembebido. Después publicar android/v1.6.0-local.1, recuperar Git para verificar bytes y7APKanteriores, cerrar documentación, commit/push y ZIPfinal. La fuente ya se puede recuperar aunque se interrumpa la ejecución. No se promete continuidad automática después de detenerse.

---

# Puerta previa al APK1.6 superada — 23/10/2026

**Estado:** código funcional terminado y verificado dentro del acceso disponible. General56/56UI (4.1min); después corrección acotada para que Editar un legacy sinfecha NO invente hoy y rolgrupo accesible en panel: check436/436, tsc/lint/Functions build pasan y6/6UI de avisos/calendario/edición/capturas repetidos(44.5s). Ocho Axe WCAG2A/AA con0violaciones/0incompletas. Datos sintéticos, no Android físico. Comparativas19regeneradas con rótulo1.6 y revisión manual de principales afectadas; ver GALERIA_AVISOS_1_6.md y manifiesto de capturas. No servicios pagos.

**Último main al escribir:**59c9a6d; el siguiente commit guarda este punto y evidencia final. Cambios de datos separados6086ff2/cca787e, reglasdecomandos/stock/SQLite/migración/fotos/JSON preservadas. Lecturaexistinglegacy tolera fecha ausente para completar; importactiva exigeválida. No más cambios funcionales previstos antes del APK.

**Próxima acción exacta:** commit/push de este bloque, comprobar árbol limpio y HEAD=origin/main; generar ZIP con scripts/package.py verificando todosSHA al restaurar. Ejecutar Gradle completo1.6.0/code9 con JDK21/SDK36 y CHEMA_ANDROID_KEYSTORE existente, log artifacts/validacion/avisos-android.txt. APK1.5 anterior preservado en /workspace/entregas/cobalto-1.5.0, certificado fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c. Verificar1.6 contraeseAPK con scripts/verify-android.py. Luego publicar carpeta nueva android/v1.6.0-local.1 y respaldo fuente en descargas preservando7versiones anteriores, recuperar desdeGit y comparar bytes/SHA. Actualizar informe/checkpoint y entregarlink.

**Bloqueos reales:** no hardware/emuladoradbconectado; instalación encima, migraciónSQLite real, permisos/cámara/compartir/notificación/reinicio puntualidad requierenAndroidfísico. npm audit9entradas propagadas(0críticas), ver AVISOS_RETIRO_1_6.md; no downgradeExpo ni auditfix. No automatización de continuidad configurada ni promesa de ejecución futura.

---

# Integración de avisos 1.6 — 23/10/2026 · punto previo a validación UI

Último bloque publicado al escribir: cca787e (queries legacy), precedido por6086ff2(lectura compatible) y4a8dbd3(calendario/recordatorios). APK1.5 verificado y preservado; NO confundirlo con1.6. Paquete com.grupochema.repartos y clave existente sin cambios. Se prepara1.6.0/code9 con selector nativo9.1.0 (única dependencia añadida, compatiblebundledExpo57).

**Comprobado ahora:** check433/433 en37archivos, tsc/lint/Functions build pasan; npmci limpio1565paquetes, decoder/lock verificados. Web limpia y reexportada incrementalmente con mismosflags LOCAL_ONLY=true/DATA_MODE=demo, no nube. Pruebas nuevas de calendario/hook/políticas/legacy/selectores/navegación/permisos/reintentos/presentación. No dispositivo físico. Auditoría npm9entradas transitivas propagadas documentadas, sin auditfix ni downgrade.

**En curso:**6recorridos Playwright nuevos contra web actual (log avisos-ui-nuevo-inicial); después suite completa y capturas. Revisión corrigió acoplamiento de sonido a confirmaciones, expiradosconpermiso denegado, verdadUI antepersistenciafallida y error de tapfrío borrado porreconcile. Docdetalle AVISOS_RETIRO_1_6.md. Cambios de lectura de datos en commit separado; no SQLite/migración/fotos/stock alterados.

**Próxima acción exacta:** revisar6UI, corregir selectores/bugs reales y volver a exportar si cambia fuente. Correr56UI, inspeccionar capturas claras/oscuras y comparativas previas de estructura. Commit/push estable, árbol limpio y ZIP fuente verificado antes de Gradle completo. VerificarAPK1.6 contra1.5/preservarcertificado/ARM64/CRC/SHA. Publicar versiones únicas en descargas junto a fuente y checks; recuperar desde Git para comparar hashes. Actualizar este punto. Pruebas físicas de actualización/migración/notificaciones/reinicio siguen pendientes y no se sustituyen por mocks.

---

# Reanudación y ampliación de avisos — 23/10/2026

Main recuperado: 67f3a2e011ce335e1e903c02ae78d92a2dd2771e, remoto comprobado sin divergencia. La ejecución anterior sí terminó: UI50/50 (8.9min) y Gradle1.5 BUILD SUCCESSFUL (13m49s). Se verificó y preservó el APK1.5 fuera de android antes de nuevos cambios: /workspace/entregas/cobalto-1.5.0/repartos-chema-local-1.5.0-arm64.apk. SHA256 2aaeefdb3a278c674e0a78c2a349702575604f580cafdd2170b6263469eade82. Firma v2, certificado idéntico a1.4, package com.grupochema.repartos, code8, ARM64/CRC/SQLite/tresWAV verificados. No probado en hardware ni publicado aún. Este registro cierra evidencias de1.5, no acredita los nuevos avisos.

**Ampliación autorizada en curso:** Alquilado hasta reutiliza fechaRetiroEstimada (retiro previsto, sin fecha comercial distinta en modelo); fechaRetiroEfectiva se conserva. Contador derivado del calendario Argentina, refresco medianoche/reanudación. General opt-in08:00 con offsets3/2/1/0, herencia real y personalización. Extender único ReminderService con migración v1→v2, intenciones durables/cancelaciones/reintentos/permiso, proteger manuales anteriores. Taps al detalle tras carga y sesión. Selector nativo compatible9.1.0; web date/time. Nueva versión funcional prevista1.6/code9, independiente del APK1.5 preservado. No datos/stock/SQLite/fotos/JSON/certificado alterados por diseño.

**Próxima acción exacta:** integrar motor/políticas/calendario/selectores/UI; ejecutar pruebas de nuevos avisos, check y UI, respaldar fuente y push ANTES del Gradle1.6. Publicar APK nuevo solo tras verificación, conservar anteriores. Cierre/reinicio real Android y puntualidad OS quedan pendientes de dispositivo físico. No prometer trabajo futuro automático.

---

# Puerta visual superada — 1.5.0/code8 — 18/10/2026 20:48 UTC

**Estado activo:** estructura implementada y comparada manualmente ANTES del APK.19comparativas (11contra recortes de referencias al mismo tamaño/tema y8antes/después),346capturas actuales en artifacts/capturas/estructura-1.5. Ver COMPARACION_VISUAL_1_5.md para datos sintéticos y diferencias intencionales.

Check final222/222 en28archivos, tsc/lint/Functions pasan.80superficies de contraste0violaciones/0incompletas. Última captura de referencias2/2 pasa, incluido catálogo plegado tras combo y aria-expanded explícito en web. Revisiones previas encontraron selectores antiguos en tests y conteo mal rotulado; corregidos. Los intentos fallidos se conservan en artifacts/validacion/estructura-*. No presentar sus fallos como éxitos. **Falta repetir suiteUI completa final sobre este punto**, y APK/instalación física siguen pendientes.

Commits publicados f978056,b4e8f4c,e65025c,5eaa298,e9a1e5c; el siguiente registra aria/evidencias. Sin cambios en dominio,SQLite,migración,JSON,fotos o dependencias (sólo versión raíz1.5.0/code8). Clave privada existente fueraGit /workspace/respaldos/firma-interna/chema-restaurada-1.3.keystore; mismo paquete com.grupochema.repartos. No servicios pagos/cloud.

**Próxima acción exacta:** comprobar gitstatus limpio y main respaldado, empaquetar fuente verificando restauración; ejecutar Gradle completo con la clave existente y log artifacts/validacion/estructura-android.txt. Puede correrse la UI final en paralelo porque código UI queda congelado. Verificar APK contra1.4, SHA/CRC/ABI/certificado. Después publicar APK1.5 en carpeta nueva de descargas sin tocar anteriores, recuperar desde clon independiente, documentación y ZIP final. No afirmar pruebas físicas: adb no tiene dispositivos conectados.

---

# Continuidad activa — corrección estructural 1.5 — 18/10/2026

El usuario reabrió el rediseño porque 1.4 conservaba composición anterior. Este bloque prevalece sobre el cierre histórico inferior. Base main332e56e sincronizada, árbol limpio antes de comenzar; ZIP base verificado descrito en CIERRE_ESTRUCTURAL_1_5.md.

Fase actual: implementación estructural de las4pestañas, detalle/alta/carga, ajustes/combos/documentos. Sin cambios en dominio, SQLite, migración, fotos ni JSON. Footer compartido y paneles conservan funciones secundarias. Capturas baseline reales430×840 claro/oscuro y fixture fijo en artifacts/capturas/estructura-1.5. No APK nuevo todavía. Pendientes: check completo, adaptar recorridos a paneles, exportar web, comparar capturas con referencias y corregir estructura antes de compilar. Después commits/push, APK1.5.0/code8 con certificado existente, verificación y descargas sin borrar versiones anteriores. No validación física disponible.

Bloques publicados f978056 (pestañas/primitivas) y b4e8f4c (detalle/herramientas). Check nuevo222/222,28archivos, lint/tsc/Functions pasan. Primera UI tuvo7fallos:4cotas estrechas de nombre Depósito y3selectores de menú/CTA no adaptados (Deshacer, Depósito Chema, Agregar material); no se ocultan. Correcciones aplicadas y pendientes repetir. Capturas reales revisadas: alquileres96px/3visibles; se compactaron más Viaje/detalle/carga antes de cierre. Preparada versión1.5.0/code8, sin cambios de dependencias salvo metadata versión.

Próxima acción exacta: terminar check y nueva exportación web, correr UI con JSONreport, generar comparativas exactas contra las láminas y revisarlas ANTES de Gradle. No marcar APK nuevo disponible aún. Consultar gitlog para commits posteriores.

---

# Cierre de edición individual cobalto 1.4.0 — 18/10/2026

## Estado guardado

Implementación, verificación web y APK estructuralmente verificado/publicado completas dentro del acceso disponible. **Pendiente validación física Android por el usuario**, no bloqueada por facturación/credenciales. No reanudar rediseño ni recompilar por un cambio documental.

Código funcional APK: **679807b3e135ba791cf7fd78aff5087abde57bc9**. Último main publicado al escribir este punto:876bf4a; el siguiente commit contiene este cierre documental(consultar git log-1). Bloques previos1542ce4/80d4649/d35a01c/d7e9187/72e6971/8cc746a. Paquete base1e5dcc9 conservado; main y descargas del repositorio privado kkshiiit/repartos-chema.

APK **1.4.0/code7**, com.grupochema.repartos, ARM64/Android7+,56.039.655bytes. Gradle completo10m36s/658tareas. Certificado idéntico a1.3:fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c. Firma v2/CRC/minSDK24/no debuggable/SQLite/tresWAV originales por SHA comprobados. SHA256 **79ad05905267460596270333316403796465e5bc9e874d478b04ca8710ca6bb1**.

Publicado descargas7c9a282 en android/v1.4.0-local.1; recuperado desde un clon independiente y hash/CRC coincidentes. Fuente876bf4a con manifiesto806archivos, web y base publicadas descargasb38e226 y recuperadas/verificadas. Se agrega ZIP de este cierre documental para conservar este punto también dentro de la copia descargable. Las versiones anteriores permanecen intactas.

## Pruebas y límites

Check218/218(27archivos), typecheck/lint/build Functions correctos. npmci completo en carpeta nueva1564paquetes, decoder local reparado conservado. Web limpia con LOCAL_ONLY=true y DATA_MODE=demo; inicio vacío sin credenciales ni servicios pagos. UI **44/44** en3.7min,271capturas nuevas,80superficies de contraste sin violaciones/incomplete,320/360/390/412ytablet/escritorio; texto200 simuladoDOM. Temas/cierres/doble toque/datos/JSON/fotos/documentos/operaciones cubiertos con fixtures/adaptadores. Integraciones Firebase excluidas y no ejecutadas, sin despliegues.

No Android físico/emulador conectado: no afirmar SQLite/migración, cámara, compartir, permisos, avisos, TalkBack, teclado/fontScale o rendimiento físico verificados. Sonidos/recordatorios locales opcionales, sin push/cloud y con límitesOS. Firma interna de plantilla, no publicación comercial.

## Archivos y decisiones

Ver docs/ENTREGA_COBALTO_1_4.md, GALERIA_COBALTO.md, REDISENO_PAPEL_COBALTO.md, AVISOS_LOCALES.md. Papel/tinta/cobalto reemplaza Aurora; logo original y Word/Excel institucionales intactos. Dominio/SQLite/migración/validaciónJSON no se reescribieron. Tokens/primitivas/rutas/wizard/paneles/feedback rediseñados. Confirmaciones solo tras persistencia; errores inline. Primer prebuild rechazó nombresWAV numéricos: alias chema_ sin cambiar bytes. AAPT compacta rutas de recursos: verificador resuelve tabla y compara hashes. Script nativo conserva clave privada antes/después prebuild.

Clave existente fueraGit: /workspace/respaldos/firma-interna/chema-restaurada-1.3.keystore. No publicar ni incluir en ZIP. Si falta, bloquear actualización con otro certificado. Backups/APK locales /workspace/entregas/cobalto-1.4.0; repositorio descargas /workspace/entregas/apk-github-20261017; recuperación independiente /workspace/recuperacion-github-140.

## Próxima acción exacta

Entregar enlace del APK e instruccionesAndroid del informe. Cuando el usuario pruebe: recoger resultados/error concreto antes de modificar código; guardar JSON externo y actualizar encima sin desinstalar/borrar almacenamiento. Si retoma desarrollo, comprobar workspace/Git/remoto y leer este checkpoint; conservar cambios posteriores. Si solo pide descargar, usar APK ya publicado, no repetir compilación/auditoría.

Comandos de verificación (mantener preview en otra terminal):

```bash
npm ci
npm run check
npm run build:web
npm run preview
CHEMA_TEST_LOCAL=true npm run test:ui -- --workers=2
```

Build nativo: JDK21/SDK36/NDK27.1/CMake3.22.1 y CHEMA_ANDROID_KEYSTORE con la clave existente, sin servicios pagos. Ver docs/ANDROID.md para entorno y comando exactos.

El contenido siguiente conserva checkpoints históricos; prevalece este cierre.

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
