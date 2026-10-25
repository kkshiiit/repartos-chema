# AUDITORÍA MAESTRA Y CONTEXTO DE RECUPERACIÓN — REPARTOS CHEMA

**Documento único para el usuario y otro asistente.** Fecha de apertura: 2026-10-24T17:55:41.358643+00:00. Base inicial: `dc69734fae42224fa380278ba9516cb75cadf8c6`. Este archivo se guarda al comenzar el cierre para no depender de los tokens/historial. Los anexos conservan evidencia histórica completa; el estado actual de esta primera parte prevalece sobre sus pendientes antiguos. No contiene claves privadas ni datos comerciales del teléfono.

## Estado final comprobado — 25/10/2026 (Argentina)

**Edición individual gratuita cerrada dentro del alcance del entorno. APK 1.6.1/código10 generado, publicado y recuperado desde GitHub.** Este estado final prevalece sobre los registros previos de preparación y los anexos históricos. La aceptación en un Android físico sigue pendiente y no se declara realizada.

- [Descargar APK ARM64](https://github.com/kkshiiit/repartos-chema/raw/refs/heads/descargas/android/v1.6.1-local.1/repartos-chema-local-1.6.1-arm64.apk) · [Fuente y web](https://github.com/kkshiiit/repartos-chema/tree/descargas/respaldos/v1.6.1-local) · [Guía de instalación](https://github.com/kkshiiit/repartos-chema/blob/descargas/android/v1.6.1-local.1/LEEME.md).
- Paquete `com.grupochema.repartos`, Android7+/ARM64, 56176031bytes, versión1.6.1/code10. SHA256 **`03e42657ad62d9c39ddd3cc2060a8ebd1d11d861fd78c0da46bda2f311c578f1`**.
- CertificadoSHA256 `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`, igual al1.6.0 y sus anteriores. Firma v2/CRC/ABI/SQLite/3tonos por hash/no debuggable comprobados. Nueva guarda de entrega presente en Hermes. Sin marcadores publicitarios propios ni configuraciónFirebase embebida. No equivale a una auditoría completa de cada dependencia binaria.
- Gradle completo **BUILD SUCCESSFUL,9min12s,701tareas (673ejecutadas/28actualizadas)**. Código funcional congelado **`f9f018d3d33d6d474babcc669b1144412802ad28`**; los commits documentales posteriores no cambian el runtime. Descargas APK **`293e748c162a5518a02b9f91330779064beed6f5`**, recuperado desde clon independiente: SHA/CRC/firma correctos; **ocho APK anteriores con objetosGit idénticos**.
- **444/444 unitarias en40archivos;57/57 recorridos Chromium en4.8min,0omitidos/fallidos; npmci limpio1565paquetes, Zod4.6.6/decoder/lock verificados; tipos y Functions build correctos; lint0errores/1advertencia.** 348capturas actuales,19comparativas,8Axe0violaciones/0incompletas. Los intentos fallidos están conservados y explicados, no sumados como aprobados.
- Corregidos **F1** (fecha de retiro incoherente con entrega planificada), **F2** (Zod4.6.6) y **F3** (remito legacy sin fecha). La corrección previene nuevas operaciones incoherentes; no inspecciona ni reescribe silenciosamente los datos reales de un teléfono. Si un alquiler antiguo ya tiene fechas incompatibles, conservar la copia original y corregirlas explícitamente.
- Fuente previa a Gradle: ZIP1594archivos, SHA256 `d7eecffe67effa7d5c93f684a4afe8c01253935d673ef33011658ae4a9ce4fb5`, publicado y recuperado con todos sus hashes verificados antes de compilar. El respaldo de cierre con documentación actualizada se guarda adicionalmente, preservando ese snapshot.
- Sin publicidad, backend obligatorio, Firebase productivo, hosting, EAS, despliegue, PlayStore ni facturación activados. Una instalación nueva empieza vacía; una actualización conserva datos. No hay sincronización entre celulares ni promesa de trabajo automático futuro.
- **Pendientes reales:** instalación/actualización y migraciónSQLite en teléfono, permisos/cámara/selector/Compartir/TalkBack, recepción de avisos con cierre/reinicio/batería y rendimiento en dispositivo. No se promete puntualidad exacta. Audit npm actual21raíz/10Functions; nuevos avisos clasificados como herramientas dev bajoFirebaseCLI, sin caminoAPK identificado. Persisten mantenimiento de transitivos, límite de memoria con JSON grande y custodia externa segura de la clave de firma. La fuente no incluye esa clave.

## Inventario exacto de cambios de este cierre

Base anterior al encargo: `dc69734`. A=archivo nuevo, M=modificado. Incluye capturas y logs generados, además de código/configuración/documentación. Sin borrados de datos ni cambios de firma/SQLite/fotos/JSON. Los registros de pruebas fallidas se conservan; una salida de auditoría npm1 informa avisos, no prueba un build fallido. Este inventario se obtuvo de Git, no de memoria.

```text
M	README.md
M	app.json
M	artifacts/capturas/estructura-1.5/bienvenida-1.png
M	artifacts/capturas/estructura-1.5/comparacion-antes-despues-alquileres-dark.png
M	artifacts/capturas/estructura-1.5/comparacion-antes-despues-alquileres-light.png
M	artifacts/capturas/estructura-1.5/comparacion-antes-despues-deposito-dark.png
M	artifacts/capturas/estructura-1.5/comparacion-antes-despues-deposito-light.png
M	artifacts/capturas/estructura-1.5/comparacion-antes-despues-historial-dark.png
M	artifacts/capturas/estructura-1.5/comparacion-antes-despues-historial-light.png
M	artifacts/capturas/estructura-1.5/comparacion-antes-despues-viaje-dark.png
M	artifacts/capturas/estructura-1.5/comparacion-antes-despues-viaje-light.png
M	artifacts/capturas/estructura-1.5/comparacion-referencia-ajustes.png
M	artifacts/capturas/estructura-1.5/comparacion-referencia-alquileres.png
M	artifacts/capturas/estructura-1.5/comparacion-referencia-carga.png
M	artifacts/capturas/estructura-1.5/comparacion-referencia-combos.png
M	artifacts/capturas/estructura-1.5/comparacion-referencia-deposito.png
M	artifacts/capturas/estructura-1.5/comparacion-referencia-detalle.png
M	artifacts/capturas/estructura-1.5/comparacion-referencia-documentos.png
M	artifacts/capturas/estructura-1.5/comparacion-referencia-historial.png
M	artifacts/capturas/estructura-1.5/comparacion-referencia-nuevo.png
M	artifacts/capturas/estructura-1.5/comparacion-referencia-retiro.png
M	artifacts/capturas/estructura-1.5/comparacion-referencia-viaje.png
M	artifacts/capturas/estructura-1.5/dashboard-desktop.png
M	artifacts/capturas/estructura-1.5/dashboard-mobile.png
M	artifacts/capturas/estructura-1.5/despues-filtros-historial-dark.png
M	artifacts/capturas/estructura-1.5/local-alquileres.png
M	artifacts/capturas/estructura-1.5/matriz/320-dark-alquileres.png
M	artifacts/capturas/estructura-1.5/matriz/320-dark-detalle-texto200.png
M	artifacts/capturas/estructura-1.5/matriz/320-dark-detalle.png
M	artifacts/capturas/estructura-1.5/matriz/320-dark-nuevo-texto200.png
M	artifacts/capturas/estructura-1.5/matriz/320-dark-nuevo.png
M	artifacts/capturas/estructura-1.5/matriz/320-dark-viaje-texto200.png
M	artifacts/capturas/estructura-1.5/matriz/320-dark-viaje.png
M	artifacts/capturas/estructura-1.5/matriz/320-light-alquileres.png
M	artifacts/capturas/estructura-1.5/matriz/320-light-deposito-texto200.png
M	artifacts/capturas/estructura-1.5/matriz/320-light-detalle-texto200.png
M	artifacts/capturas/estructura-1.5/matriz/320-light-detalle.png
M	artifacts/capturas/estructura-1.5/matriz/320-light-nuevo.png
M	artifacts/capturas/estructura-1.5/matriz/320-light-viaje-texto200.png
M	artifacts/capturas/estructura-1.5/matriz/320-light-viaje.png
M	artifacts/capturas/estructura-1.5/matriz/360-dark-alquileres-texto200.png
M	artifacts/capturas/estructura-1.5/matriz/360-dark-alquileres.png
M	artifacts/capturas/estructura-1.5/matriz/360-dark-detalle-texto200.png
M	artifacts/capturas/estructura-1.5/matriz/360-dark-detalle.png
M	artifacts/capturas/estructura-1.5/matriz/360-dark-nuevo-texto200.png
M	artifacts/capturas/estructura-1.5/matriz/360-dark-nuevo.png
M	artifacts/capturas/estructura-1.5/matriz/360-dark-panel-carga-texto200.png
M	artifacts/capturas/estructura-1.5/matriz/360-dark-viaje-texto200.png
M	artifacts/capturas/estructura-1.5/matriz/360-dark-viaje.png
M	artifacts/capturas/estructura-1.5/matriz/360-light-alquileres.png
M	artifacts/capturas/estructura-1.5/matriz/360-light-detalle-texto200.png
M	artifacts/capturas/estructura-1.5/matriz/360-light-detalle.png
M	artifacts/capturas/estructura-1.5/matriz/360-light-nuevo-texto200.png
M	artifacts/capturas/estructura-1.5/matriz/360-light-nuevo.png
M	artifacts/capturas/estructura-1.5/matriz/360-light-viaje-texto200.png
M	artifacts/capturas/estructura-1.5/matriz/360-light-viaje.png
M	artifacts/capturas/estructura-1.5/matriz/390-dark-alquileres-texto200.png
M	artifacts/capturas/estructura-1.5/matriz/390-dark-alquileres.png
M	artifacts/capturas/estructura-1.5/matriz/390-dark-detalle-texto200.png
M	artifacts/capturas/estructura-1.5/matriz/390-dark-detalle.png
M	artifacts/capturas/estructura-1.5/matriz/390-dark-nuevo-texto200.png
M	artifacts/capturas/estructura-1.5/matriz/390-dark-nuevo.png
M	artifacts/capturas/estructura-1.5/matriz/390-dark-viaje-texto200.png
M	artifacts/capturas/estructura-1.5/matriz/390-dark-viaje.png
M	artifacts/capturas/estructura-1.5/matriz/390-light-alquileres-texto200.png
M	artifacts/capturas/estructura-1.5/matriz/390-light-alquileres.png
M	artifacts/capturas/estructura-1.5/matriz/390-light-detalle-texto200.png
M	artifacts/capturas/estructura-1.5/matriz/390-light-detalle.png
M	artifacts/capturas/estructura-1.5/matriz/390-light-historial-texto200.png
M	artifacts/capturas/estructura-1.5/matriz/390-light-nuevo.png
M	artifacts/capturas/estructura-1.5/matriz/390-light-viaje-texto200.png
M	artifacts/capturas/estructura-1.5/matriz/390-light-viaje.png
M	artifacts/capturas/estructura-1.5/matriz/412-dark-alquileres-texto200.png
M	artifacts/capturas/estructura-1.5/matriz/412-dark-alquileres.png
M	artifacts/capturas/estructura-1.5/matriz/412-dark-detalle-texto200.png
M	artifacts/capturas/estructura-1.5/matriz/412-dark-detalle.png
M	artifacts/capturas/estructura-1.5/matriz/412-dark-nuevo.png
M	artifacts/capturas/estructura-1.5/matriz/412-dark-panel-carga-texto200.png
M	artifacts/capturas/estructura-1.5/matriz/412-dark-viaje-texto200.png
M	artifacts/capturas/estructura-1.5/matriz/412-dark-viaje.png
M	artifacts/capturas/estructura-1.5/matriz/412-light-alquileres-texto200.png
M	artifacts/capturas/estructura-1.5/matriz/412-light-alquileres.png
M	artifacts/capturas/estructura-1.5/matriz/412-light-deposito-texto200.png
M	artifacts/capturas/estructura-1.5/matriz/412-light-detalle-texto200.png
M	artifacts/capturas/estructura-1.5/matriz/412-light-detalle.png
M	artifacts/capturas/estructura-1.5/matriz/412-light-nuevo.png
M	artifacts/capturas/estructura-1.5/matriz/412-light-viaje-texto200.png
M	artifacts/capturas/estructura-1.5/matriz/412-light-viaje.png
M	artifacts/capturas/estructura-1.5/responsable.png
M	artifacts/capturas/estructura-1.5/rutas-1440-dark-alquileres.png
M	artifacts/capturas/estructura-1.5/rutas-1440-dark-entrega.png
M	artifacts/capturas/estructura-1.5/rutas-1440-dark-mapa.png
M	artifacts/capturas/estructura-1.5/rutas-1440-dark-obra-nueva.png
M	artifacts/capturas/estructura-1.5/rutas-1440-dark-obra-obra_5.png
M	artifacts/capturas/estructura-1.5/rutas-1440-dark-obras.png
M	artifacts/capturas/estructura-1.5/rutas-1440-light-alquileres.png
M	artifacts/capturas/estructura-1.5/rutas-1440-light-entrega.png
M	artifacts/capturas/estructura-1.5/rutas-1440-light-mapa.png
M	artifacts/capturas/estructura-1.5/rutas-1440-light-obra-nueva.png
M	artifacts/capturas/estructura-1.5/rutas-1440-light-obra-obra_5.png
M	artifacts/capturas/estructura-1.5/rutas-1440-light-obras.png
M	artifacts/capturas/estructura-1.5/rutas-390-dark-alquileres.png
M	artifacts/capturas/estructura-1.5/rutas-390-dark-detalle.png
M	artifacts/capturas/estructura-1.5/rutas-390-dark-entrega.png
M	artifacts/capturas/estructura-1.5/rutas-390-dark-historial.png
M	artifacts/capturas/estructura-1.5/rutas-390-dark-mapa.png
M	artifacts/capturas/estructura-1.5/rutas-390-dark-nuevo.png
M	artifacts/capturas/estructura-1.5/rutas-390-dark-obra-nueva.png
M	artifacts/capturas/estructura-1.5/rutas-390-dark-obras.png
M	artifacts/capturas/estructura-1.5/rutas-390-dark-viaje.png
M	artifacts/capturas/estructura-1.5/rutas-390-light-alquileres.png
M	artifacts/capturas/estructura-1.5/rutas-390-light-detalle.png
M	artifacts/capturas/estructura-1.5/rutas-390-light-entrega.png
M	artifacts/capturas/estructura-1.5/rutas-390-light-mapa.png
M	artifacts/capturas/estructura-1.5/rutas-390-light-nuevo.png
M	artifacts/capturas/estructura-1.5/rutas-390-light-obra-nueva.png
M	artifacts/capturas/estructura-1.5/rutas-390-light-obras.png
M	artifacts/capturas/estructura-1.5/rutas-390-light-viaje.png
M	artifacts/capturas/estructura-1.5/superficies/390-dark-editar-cliente.png
M	artifacts/capturas/estructura-1.5/superficies/390-dark-selector-historial-alquiler.png
M	artifacts/capturas/estructura-1.5/superficies/390-dark-selector-historial-usuario.png
M	artifacts/capturas/estructura-1.5/superficies/390-dark-ubicacion-editor.png
M	artifacts/capturas/estructura-1.5/superficies/390-dark-wizard-revisar.png
M	artifacts/capturas/estructura-1.5/superficies/390-light-editar-cliente.png
M	artifacts/capturas/estructura-1.5/superficies/390-light-selector-historial-alquiler.png
M	artifacts/capturas/estructura-1.5/superficies/390-light-selector-historial-usuario.png
M	artifacts/capturas/estructura-1.5/superficies/390-light-ubicacion-editor.png
M	artifacts/capturas/estructura-1.5/superficies/390-light-wizard-revisar.png
A	artifacts/validacion/android-1.6.1-apk.json
A	artifacts/validacion/android-1.6.1-firma.txt
A	artifacts/validacion/android-1.6.1-metadata.txt
A	artifacts/validacion/cierre-2026-10-24-audit-functions.json
A	artifacts/validacion/cierre-2026-10-24-audit-runtime.json
A	artifacts/validacion/cierre-2026-10-24-check.txt
A	artifacts/validacion/cierre-2026-10-24-web.txt
A	artifacts/validacion/cierre-2026-10-24-zod-focal.txt
A	artifacts/validacion/cierre-2026-10-24-zod-functions-build.txt
A	artifacts/validacion/cierre-2026-10-24-zod-install-functions.txt
A	artifacts/validacion/cierre-2026-10-24-zod-install-root.txt
A	artifacts/validacion/cierre-2026-10-24-zod-lint.txt
A	artifacts/validacion/cierre-2026-10-24-zod-red.txt
A	artifacts/validacion/cierre-2026-10-24-zod-suite.txt
A	artifacts/validacion/cierre-2026-10-24-zod-typecheck.txt
A	artifacts/validacion/cierre-2026-10-25-android.txt
A	artifacts/validacion/cierre-2026-10-25-apk-contenido.json
A	artifacts/validacion/cierre-2026-10-25-audit-functions.json
A	artifacts/validacion/cierre-2026-10-25-audit-raiz.json
A	artifacts/validacion/cierre-2026-10-25-capturas.json
A	artifacts/validacion/cierre-2026-10-25-check.txt
A	artifacts/validacion/cierre-2026-10-25-compilacion-base.json
A	artifacts/validacion/cierre-2026-10-25-descarga-remota.json
A	artifacts/validacion/cierre-2026-10-25-descargas-previas.json
A	artifacts/validacion/cierre-2026-10-25-focal.txt
A	artifacts/validacion/cierre-2026-10-25-npm-ci-final.txt
A	artifacts/validacion/cierre-2026-10-25-npm-ci-verificado.txt
A	artifacts/validacion/cierre-2026-10-25-npm-ci.txt
A	artifacts/validacion/cierre-2026-10-25-recursos.json
A	artifacts/validacion/cierre-2026-10-25-respaldo-remoto-previo.json
A	artifacts/validacion/cierre-2026-10-25-seguridad-clasificacion.md
A	artifacts/validacion/cierre-2026-10-25-ui-antes-espera.json
A	artifacts/validacion/cierre-2026-10-25-ui-antes-espera.txt
A	artifacts/validacion/cierre-2026-10-25-ui-concurrente.json
A	artifacts/validacion/cierre-2026-10-25-ui-concurrente.txt
A	artifacts/validacion/cierre-2026-10-25-ui-estatico.txt
A	artifacts/validacion/cierre-2026-10-25-ui-focal.json
A	artifacts/validacion/cierre-2026-10-25-ui-focal.txt
A	artifacts/validacion/cierre-2026-10-25-ui-nombre-diagnostico.json
A	artifacts/validacion/cierre-2026-10-25-ui-nombre-diagnostico.txt
A	artifacts/validacion/cierre-2026-10-25-ui.json
A	artifacts/validacion/cierre-2026-10-25-ui.txt
A	artifacts/validacion/cierre-2026-10-25-web.txt
A	artifacts/validacion/cierre-2026-10-25-welcome-estatico.txt
A	artifacts/validacion/cierre-2026-10-25-whatsapp-red.txt
A	docs/AUDITORIA_MAESTRA_ACTUAL.md
M	docs/CONTINUIDAD_CODEX.md
A	docs/ENTREGA_LOCAL_1_6_1.md
M	docs/GALERIA_AVISOS_1_6.md
M	docs/USO_LOCAL_ANDROID.md
M	functions/package-lock.json
M	functions/package.json
M	package-lock.json
M	package.json
M	src/domain/engine.ts
M	src/utils/whatsapp.ts
A	tests/fecha-entrega-integridad.test.ts
A	tests/ui/fecha-entrega.spec.ts
M	tests/ui/welcome.spec.ts
A	tests/whatsapp-legacy.test.ts
A	tests/zod-limits.test.ts
```

## Registro previo: compilación en curso y fuente asegurada — 25/10/2026

Código congelado `f9f018d3d33d6d474babcc669b1144412802ad28`. CopiaZIP en descargas `815cafeddd9e2d380058866650ecf490e011f143`:1594archivos, SHA256 `d7eecffe67effa7d5c93f684a4afe8c01253935d673ef33011658ae4a9ce4fb5`. Extraída y restaurada localmente; recuperada desde clon independiente y verificados todos los hashes individuales/CRC. Fuente y web disponibles antes de iniciar Gradle. No incluye claves de firma ni dependencias regenerables.

Gradle completo1.6.1/code10 está en curso en `cierre-2026-10-25-android.txt`; todavía no se acredita instalador nuevo. La fuente no cambiará durante la compilación. Los commits documentales posteriores no alteran el código funcional congelado. La siguiente sección acredita las pruebas terminadas; el cierre final añadirá APK, firma, SHA y recuperación real.

## Registro previo: puerta previa al instalador superada — 25/10/2026

**Resultados frescos:** 444/444 unitarias (40archivos); tipos y Functions build correctos; lint0errores/1advertencia de test. Instalación limpia y decoder aprobados. **Suite completa final: 57/57, cero omitidas y cero fallidas, 4.8min**, con un worker y sin instalaciones/Gradle concurrentes. El caso de cambio de nombre espera ahora el acuse visual antes de forzar navegación; el fallo anterior y los intentos con OOM están conservados. No se rebajaron reglas de negocio ni expectativas de cantidades/autores.

Los recorridos incluyen inicio vacío, nombres/autores, inventario, carga/combos, entrega/retiro/reingreso, triangulación, faltantes/recuperación, historial/deshacer, JSON/fotos/restauración, reapertura offline, Word/Excel, viaje, contador y ajustes de avisos. Temas y formularios/paneles se comprueban en320/360/390/768/1440px; contraste renderizado/texto200% en320/360/390/412dp, dos temas. Ocho superficies Axe sin violaciones/incompletas. Son comprobaciones Chromium; no certifican Android físico, TalkBack ni consumo móvil.

Se regeneraron19comparativas con referencias originales y capturas reales al mismo tamaño/tema; el diseño no cambió en este parche. El manifiesto `artifacts/validacion/cierre-2026-10-25-capturas.json` identifica las capturas actuales por SHA y dimensiones. No interpretar el nombre histórico de las carpetas como la versión del instalador. Se conservan imágenes anteriores en Git.

El código funcional está en main (`1ef9be4` integridad/Zod; `acdb43f` remito; `663b3ce` comprobaciones/manual). Próxima etapa: respaldar el árbol estable, comprobar restauración y compilar **1.6.1/code10** con el mismo certificado. Todavía no se declara publicada hasta confirmar Gradle, firma, SHA y recuperación desde descargas.

## Seguridad y pruebas actualizadas — 25/10/2026

La revisión fresca del registro npm informa **21 entradas en raíz: 12 altas, 9 moderadas, 0 críticas**; Functions heredado conserva10 (1alta/9moderadas). Esto sustituye el recuento de9del24/10, que permanece como evidencia histórica. No son21 vulnerabilidades independientes: el informe propaga cadenas de dependencia.

Los avisos nuevos analizados (`basic-ftp`, `fast-uri`, `ip-address`, `body-parser`, `undici`, `@opentelemetry/core`) se resuelven exclusivamente bajo `firebase-tools@15.33.0`, con `dev:true` en el lock y sin imports desde aplicación o generadores. No se identificó un camino de ejecución suyo en el APK local. Se conservan como mantenimiento de herramientas; no exponer sus servidores CLI/MCP/emuladores a entradas no confiables. La clasificación y cadenas/versiones están en `artifacts/validacion/cierre-2026-10-25-seguridad-clasificacion.md`; esto no demuestra ausencia total de vulnerabilidades. No se usó `audit fix` ni se alteró Expo/React Native para silenciar avisos.

**Instalación reproducible final aprobada:** `npm ci --no-fund --no-audit`, 1565paquetes, scripts habilitados, Zod4.6.6, lock sin cambios. Decoder0.5.0 CommonJS directo y desde query-string, español/plus/entradas inválidas y largas correctos. Log `cierre-2026-10-25-npm-ci-final.txt`. Los intentos anteriores se conservan: primer verificador buscó index.js en lugar de index.cjs; una segunda instalación concurrente fue terminada por señal9. No son instalaciones exitosas presentadas como un verificador aprobado.

**Recursos del entorno:** cgroup8GiB; dos instalaciones más Chromium ocasionaron cierres Page/Target crashed y eventosOOM. La tanda concurrente se interrumpió (19pasados,5fallidos,2interrumpidos,31sin ejecutar). Se redujo la concurrencia, sin cambiar aplicación, expectativas ni timeouts para ocultar fallos. La primera suite secuencial terminó56/57: sólo el cambio de nombre navegaba con page.goto antes del acuse visual de la entrega; el mismo caso pasó aislado sin cambiarlo. Se corrigió la sincronización de esa prueba para esperar login y «Registrar retiro», igual que los recorridos existentes. Se repite la suite completa; no se declara verde hasta que termine.

## Registro previo: continuación comprobada — 25/10/2026 (Argentina)

Este documento completo ya está en GitHub desde `1ef9be4`. Se retomó sobre ese commit, conservando la carpeta y el remoto privado. La revisión independiente aplicó los perfiles QA y entrega Android; encontró una contradicción documental sobre avisos, corregida en `docs/USO_LOCAL_ANDROID.md`. No se reinstalaron perfiles ni se activaron servicios.

- F1 y F2 están corregidos y probados en código; todavía no se presenta el APK anterior como si incluyera esos cambios.
- F3 menor: el remito de WhatsApp de un registro antiguo con fecha ausente/inválida mostraba `undefined`, `null` o el texto inválido. Ahora muestra **Sin fecha de retiro**, sin modificar el alquiler. Se reprodujo el fallo antes del cambio y pasaron cinco casos después.
- Check coordinado fresco del 25/10: **444/444 pruebas en 40 archivos**, TypeScript y compilación de Functions correctos; lint cero errores y una advertencia `import/no-named-as-default` en la prueba de Axe. Evidencia: `artifacts/validacion/cierre-2026-10-25-check.txt`.
- Se agregó el recorrido `tests/ui/fecha-entrega.spec.ts`: rechazo sin mover stock ni perder formulario y corrección posterior con reapertura. Su ejecución y la suite general se registrarán al concluir.
- En curso: instalación limpia aislada con `npm ci`, exportación web final, suite UI, respaldo del commit estable, Gradle completo y publicación versionada 1.6.1. No se afirma aún que el APK nuevo esté generado ni publicado.
- Sin dispositivo conectado: ninguna comprobación con mocks, Chromium, firma o Gradle se declara prueba física.

## Registro histórico del cierre — 24/10/2026

Registro histórico del24/10, conservado para trazabilidad; el Estado final del25/10 prevalece sobre sus estados y recuentos anteriores.

- **F1 corregido:** el dominio ahora rechaza una entrega cuyo retiro sea anterior a la entrega planificada, además del límite por fecha efectiva. No corrige fechas automáticamente ni mueve stock ante rechazo. Dos regresiones comprueban persistencia intacta y el ciclo de copia → restauración → reapertura cuando el retiro coincide con la fecha planificada.
- **F2 corregido en la app y Functions:** Zod fijado a **4.6.6**, exclusivamente en esos paquetes y sus lockfiles. Una petición SET_LOAD de 101 elementos inválidos producía 304 errores; el parche rechaza por un único límite antes de procesar cada elemento. No se simuló un agotamiento de memoria real. Las colecciones sin límite individual de las copias siguen siendo un límite de recursos a evaluar: el archivo tiene máximo de 50 MB, pero eso no garantiza consumo acotado de RAM.
- **Pruebas frescas de los especialistas:** 439/439 unitarias en 39 archivos; focal de integridad 199/199 y focal de Zod 128/128, tipos y compilación de Functions correctos. La revisión no encontró otro bloqueo nuevo reproducible dentro de su alcance. El check coordinado y los recorridos de entrega se registrarán al finalizar.
- **Auditoría de dependencias actual:** raíz todavía informa nueve entradas (cinco altas, cuatro moderadas), propagadas. Zod de la app ya está parcheado; permanece Zod 3.x de Expo CLI. Node-forge todavía no tiene parche publicado confirmado. Los consumidores inspeccionados de uuid usan v4 sin buffer; no se demostró exposición al aviso de v3/v5/v6. No se hicieron downgrades o audit fix forzados.
- **Functions histórico:** auditoría separada con diez entradas (una alta body-parser, nueve moderadas), sin desplegar y fuera del APK. Su instalación avisa Node 24 frente al engine 22 declarado; compiló, no se promete ejecución productiva.
- Se prepara **1.6.1 / código 10**, mismo paquete y certificado. El APK 1.6.0 publicado no contiene estos parches. No se considerará publicada la corrección hasta verificar el nuevo archivo y recuperarlo desde GitHub.
- No hay teléfono/emulador conectado. Los pendientes físicos se conservan como tales; no son bloqueos de facturación ni credenciales.

## 1. Conclusión y alcance vigente

Repartos Chema es una aplicación interna de Grupo Chema Construcciones para registrar alquileres de andamios/equipos, destino, cliente, materiales, responsables, fechas, entrega, retiro, triangulación, daños, pérdidas y recuperación. Su entrega vigente es **individual Android, gratuita y local/offline**, con inicio vacío, fotos locales, documentos y respaldos JSON. No necesita una PC encendida, servidor, Firebase, Cloudflare, anuncios ni suscripción para operar con datos locales.

Hay un APK1.6.1/code10 completo publicado y recuperado desde GitHub, con firma/paquete e integridad comprobados. La versión1.6.0 anterior permanece conservada. Eso **no equivale a prueba física de funcionamiento**: no hay teléfono/emulador conectado. Ya se verificaron el dominio y los recorridos web; instalación encima, SQLite físico, permisos, cámara/compartir y avisos/reinicio requieren Android real. El cierre actual corrigió fallos concretos y entregó1.6.1, sin reabrir el diseño ni reescribir la app.

**Hallazgos nuevos comprobados el24/10:** (F1) entrega anticipada con fecha de retiro anterior a entrega planificada podía producir copia no restaurable; (F2) aviso de seguridad nuevo ZodGHSA-mrhx-c7xc-m3w5, parche4.6.6. Corregidos en código y cubiertos por regresiones; el encabezado vigente registra su entrega. El APK1.6 anterior no incluye esas correcciones. No se presenta una revisión en curso como éxito final.

## 2. Historial recuperado y límites

Fuentes: historial de usuario disponible en esta conversación; código/Git; `docs/CONTINUIDAD_CODEX.md`, auditoría17/10, entregas1.2/1.3/1.4/1.6 y registros `artifacts/validacion`. No hay acceso universal a otros chats. El usuario citó `/workspace/informes/repartos-chema-auditoria-maestra-2026-10-13.md`; su disponibilidad se registra en el inventario al final, no se inventa haberlo leído. Las rutas Windows de adjuntos son referencias del usuario, no acceso remoto a su PC. El logo existe como recurso del proyecto.

### Requisitos originales

React Native/Expo/TypeScript/Router, arquitectura separada UI/dominio/repositorio/integraciones; FirebaseAuth/Firestore/Storage/FCM/Functions para producción y demo persistente sin credenciales. RolesADMIN/OPERADOR validados en datos/dominio. Dashboard tipoKeep oscuro, semáforo calendario, búsqueda/estado/zona, obra dinámica, catálogo/materiales/medidas/apodos/combos, faltantes/fotos, inventario en cuatro ubicaciones, entrega/retiro/triangulación, procedencia alternativa autorizada, historial/deshacer5min, GPS/WhatsApp, Word/Excel institucionales, pruebas y documentación. No inventar stock, usuarios reales, claves o servicios configurados.

### Cambios posteriores confirmados

- Sólo equipo interno. Se pidió publicidad discreta inicialmente; después se ordenó **eliminación total**. Sigue prohibida, incluso tras instalar perfiles de marketing.
- «Cerradas» se agrupa con «Retiradas»; RETIRADO/REINGRESADO siguen como estados técnicos auditables, sin filtroCerradas independiente.
- Claro/Oscuro/Sistema, preferencia persistente, botón rápido sólo en cabeceras principales, sin repetir sol/luna en todos los modales.
- Logo real de la empresa; eliminar slogans extensos y badgeAD. Vocabulario público: Alquileres, Depósito, Alquilados, A reparar; conservar identificadores técnicos por compatibilidad.
- Bienvenida/tutorial breve; responsables configurables distintos de usuarios autenticados. Se pidió equipo con vinculación/expulsión; esa vía cloud quedó histórica al priorizar uso individual gratuito.
- Volver al depósito con destino fijo provisto mediante `https://maps.app.goo.gl/ZVFoghjHrGDunK4v5`; Viaje prioriza retiros vencidos/hoy y lista de paradas. No inventar coordenadas ni prometer optimización global del tránsito.
- NoBlaze/servicios pagos. Se autorizó quitar fotos si no había solución gratis; se conservaron **fotos locales**, sin subida cloud obligatoria.
- Edición individual: inventario y alquileres inicialmente vacíos, sin borrar existentes; importar/exportar JSON; APKARM64, mismo package/certificado, backup/pushmain y carpeta versionada endescargas conservando versiones anteriores.
- RediseñoAurora/glass fue implementado1.3 y luego sustituido por **Papel/Cobalto** del paquete de referencias. La1.4 fue criticada por conservar composición;1.5 cambió filas/agrupaciones/navegación. No volver a Aurora por leer documentos antiguos.
- Fin del alquiler: «Alquilado hasta» reutiliza fechaRetiroEstimada; contador civil argentino, selector cómodo; avisos3/2/1/0días,08:00 editable, opt-in general, herencia real, personalización, cancelaciones/reintentos/migración manual y apertura desde aviso. Implementado1.6, pendiente prueba física.
- Protocolo persistente de continuidad, commits frecuentes y archivo recuperable antes de agotar uso. No prometer automatización si no se configuró realmente.
- AgencyAgents: selección inicial7; luego **catálogo completo282** en18divisiones, con7adaptaciones conservadas y275genéricos. Elegir sólo los necesarios. Son perfiles, no282agentes activos ni modelos instalados.

### Requisitos modificados o fuera del cierre actual

Firebase/multiusuario/push remoto/hosting y publicaciónPlayStore quedan fuera de la edición individual; no son bloqueos para usarla. Anuncios descartados. PDF automático y firma digital no implementados; Word tiene espacio de firma manuscrita. No hay promesa de sincronización cerrada/background ni nube demo. No se elige una cuentaGitHub arbitraria: el usuario autorizó **kkshiiit/repartos-chema**, privado, main/descargas. No autoriza gastos ni publicar en producción.

## 3. Plataforma, stack y arquitectura comprobable

| Área | Implementación/evidencia |
|---|---|
| Versiones base | Expo57.0.30, RN0.86.3, React19.2.3, TS6.0.3; package.json/package-lock.json/app.json |
| Navegación | ExpoRouter, app/_layout.tsx y app/(tabs)/_layout.tsx; Alquileres/Depósito/Viaje/Historial, rutas secundarias/detalle dinámico |
| Dominio | src/types/index.ts; src/domain/engine.ts, rules.ts, schema.ts; Zod, invariantes y autorización |
| Estado | AuthContext, InventoryContext, ThemeContext, FeedbackContext; Context y servicios, no Redux añadido |
| Repositorio | src/data/repository.ts, serialización/idempotencia/revisión y validación de sobre |
| PersistenciaAndroid | localStorage.native.ts → nativeInventoryStorage.ts → sqliteStorage.ts; DBchema-inventario-v1.db; migración conserva AsyncStorageoriginal |
| Persistenciaweb | localStorage.ts/AsyncStorage; fotoCache.web/IndexedDB; limitaciones de navegador distintas de SQLite |
| Arranque | localInitialState.ts vacío; clave histórica comercialchema:demo:v1; no reset automático |
| Tema/UI | theme/tokens.ts, ThemeContext, componentes compartidosui/Editorial/ListStructure/ToolsLayout; controles accesibles, fuentes locales |
| Listas | DataList/FlashList2.0.2; claves y agrupaciones derivadas, filas compactas |
| Recordatorios | services/feedback/reminders.ts y adaptadores native/web, FeedbackContext; expo-notifications local |
| Calendario | retirementCalendar.ts, useBusinessClock.ts, DateTimeFields(.native/.shared); datetimepicker9.1.0 compatible con Expo57 |
| Fotos | storageService/photoCache/JPEGvalidation, ExpoFileSystem/ImagePicker/ImageManipulator; JPEG1024px/calidad0.7 y referencias estables |
| Archivos | files.ts, backupService.ts, BackupImport/LocalBackupActions; destinos externos y verificación de lectura |
| Documentos | localDocuments(.web), exportService; generadores compartidos functions/src/excelGenerator.ts/wordGenerator.ts; ExcelJS/docx |
| Legado cloud | firebase.ts, notifications.ts, Auth/Team, functions/src/index.ts; reglasFirestore/Storage; no activado en LOCAL_ONLY |
| Pruebas | Vitest, Playwright, Axe, helpersSQL y fixtures; emuladoresFirebase separados/no necesarios |
| Android | scripts/build-android-demo.mjs, JDK21/SDK36/NDK27.1/CMake, GradleassembleRelease ARM64 |
| Control | Gitmain/descargas, scripts/package.py/package-web.py/verify-android.py, SHA256/CRC/certificado |

El dominio no usa React ni SQLite para expresar movimientos. El repositorio persiste antes de anunciar éxito. La capa de fotos y los avisos no sustituyen el inventario. SQLite comercial no significa que tema/sesión/políticas de avisos hayan migrado: éstos continúan separados en AsyncStorage.

## 4. Modelos, estados y reglas

UserProfile conserva rol técnicoADMIN/OPERADOR; el acceso individual por nombre **no es autenticación productiva**. MaterialItem mantiene galpón/obra/taller/perdido con enteros no negativos. ObraCard conserva cliente/teléfono/dirección/zona/coordenadas opcionales, carga histórica, saldo real por material, faltantes/recuperado, fotos/responsables, fechas planificadas/efectivas, versión y syncStatus. Logs registran usuario/fecha/movimientos/origen/destino/motivo e inverso/revisión; combos agrupanmaterialId+cantidad.

- Entrega: galpón→obra, responsables y procedencia validados; insuficiencia no inventa disponibilidad. Origenalternativo/triangulación requiere saldo real, misma medida y autorización correspondiente.
- Retiro actual: inspección/faltantes y devolución de **todo el saldo restante** a galpón/taller/perdido. No se añadió un retiro parcial diferente al motor existente. REPORT/TRANSFER no finalizan por sí solos; estadoENTREGADO conserva avisos hasta cierre real.
- Reingreso: RETIRADO→REINGRESADO, sin duplicar devolución. Reactivar: vuelve aPENDIENTE_ENTREGA y limpia fechas/responsables efectivos, conservando historial.
- Recuperación de faltantes y movimiento de buckets: ajustes auditados con reserva contra incidentes, no duplicar efecto ni liberar piezas reservadas dos veces.
- Deshacer: sólo autor, rol exigido,≤5min, revisión segura y sin cambios posteriores incompatibles; crea evidencia nueva, no borra historia.
- Semáforo: por fecha civilAmerica/Argentina/Buenos_Aires. PENDIENTE es propio, RETIRADO/REINGRESADO final; fecha inválida se muestra neutral y se completa explícitamente.
- Lectura legacy: sólo fechaRetiroEstimada str/null/ausente tolerada al abrir base existente, sin reescritura; comandos/importación de estado activo siguen exigiendo datos válidos. Los snapshots inversos históricos conservan evidencia; una reversión hacia estado inválido se rechaza sin persistir.

## 5. Matriz funcional real

**U/W** significa código y evidencia unitaria/web registrados; no representa automáticamente pruebaAndroidfísica. Las pruebas físicas no realizadas se indican aunque el módulo esté implementado.

| Función solicitada | Estado actual y archivos | Verificación/límite |
|---|---|---|
| Ingreso local por nombre/sesión | AuthContext, teamService, login | U/W; noAuthreal ni sincronización entre celulares |
| Roles/permisos | domain/rules, engine, schema | U; local usa perfil administrativo técnico sin badge/selector público; cloud no certificado |
| Crear/editar/consultar alquiler | ObraForm, obra/nueva/editar/[id] | U/W; datos/errores/drafts conservados |
| Buscar cliente/dirección/zona/estado | tabs/index, listPresentation | U/W; agrupación vencidos/hoy/pendientes/próximos/retirados |
| Tarjetas/filas compactas | CardObra/ListStructure | Capturas reales y comparación con referencias; contador agregó una línea |
| Preparar carga/medida/apodo | LoadEditor/ScaffoldSelector/SmartCounter | U/W; maatmaestro no se renombra por apodo, cantidades enteras |
| ComboCRUD/aplicar/revisar | combos/LoadDraft/domain | U/W, fusiona IDs y medidas sin duplicar accidentalmente |
| Entrega/retirar/reingresar/reactivar | OperationForm/engine | U/W; F1corregido con2regresiones y recorridoUI |
| Triangulación/procedencia | engine/OperationForm | U/W, origen/destino/motivo/saldo real |
| Galpón/buckets/ajustes | tabs/galpon/engine | U/W; reservas de incidentes y confirmación |
| Pérdidas/daños/recuperación | FaltantesForm/engine | U/W, taller/perdido sin stock negativo; pushremoto fuera |
| Responsables/recibió/observaciones | ObraForm/OperationForm/config | U/W; nombres de choferes distintos de cuentas reales |
| Historial/filtros/deshacer | tabs/historial/historyService/engine | U/W, feed compacto y filtros en panel |
| Viaje/ruta/GPS/regreso | tabs/mapa/trip/depotSettings | U/W de lógica/listas; GPS/Maps externos físicos pendientes, sin proveedor de mapa pago |
| WhatsApp/remito | utils/whatsapp/links | U/Wtexto/enlace, usuario confirma envío en app externa; no envía solo |
| Fotoscámara/galería/compresión | storageService/photoCache | U/Wconfixtures/mocks; cámara/galería real pendiente |
| JSONrevisión/import/deshacer | backupService/BackupImport/repository | U/W, originales y fotos conservados, validación semántica |
| Guardado externo | files/LocalBackupActions | Testsadaptador/web; selector/Compartir físicos pendientes |
| Recuperación/SQLite | nativeInventoryStorage/sqliteStorage/migrateLocalStorage | UconadaptadorSQL; actualización física pendiente |
| Word/Excel institucional | generadores/exportService | U/Wdescargas; lector/CompartirAndroid pendiente; noPDF automático |
| Claro/Oscuro/Sistema/rápido | ThemeContext/ThemeToggle/ui | U/W; preferencia/drafts conservados, sin toggles en cada modal |
| Bienvenida/logo/tutorial | WelcomeProvider/login/assets/brand | U/W, reabrir tutorial y nombre sin reset comercial |
| Fecha fin/contador | ObraForm/CardObra/detail/retirementCalendar | U/W, civil/medianoche/resume, fecha efectiva separada |
| General08:00/3-2-1-0 | RetirementReminderSettings/ReminderService | U/Wconfig; programación real requierepermisoAndroid |
| Personalizado/herencia | RentalReminderPanel/ReminderService | U/W, generalreprograma herederos sin tocar personalizados |
| Avisospersistencia/retry/cancel | ReminderService/adapter | Uintenciones/IDsestables/legacy; cierre/reinicioOS físico pendiente |
| Tapdeaviso | reminderNavigation/FeedbackContext | Uconmocks arranque/foreground/espera navegación; físico pendiente |
| Publicidad | Eliminada/ausente en la entrega | Verificación APK previa sinmarcadores/configpropios; perfilesAds noSDK |
| Firebase/FCMmultiusuario | Código histórico desacoplado | No desplegado ni necesario; no se promete producción |
| APK/build/descarga | 1.6.0/code9 publicado; cierrecorrectivo encurso | Firma/CRC/SHA/ABI comprobados, no prueba de uso físico |
| Agentes/skills | 282perfiles/7skills preservados | CargaCodexnativa ensayada, no282procesos ni nuevosmodelos |

## 6. UI/UX y diseño

La dirección actual es Papel/Cobalto: claro cálido#F4F2EC, tintaoscura#121A22 y accióncobalto#335CFF, con tokens semánticos y estados comerciales por color+texto. Los documentos conservan rojo institucional. Logo original enassets/brand. No reintroducirAurora/vidrio por su presencia histórica en componentes/referencias.

Alquileres integra búsqueda/filtros, filas y agrupaciones temporales; secundaria en detalle/menú. Depósito lista cantidades alineadas/acciones por pieza. Viaje secuencia numerada con una acciónprincipal. Historial cronología y panel de filtros. Alta/edición3pasos; detalle primero identidad/fechas/saldos y CTA, ajustes/combos/documentos/selectores/paneles conservan funciones. Safeareas/teclado/foco/estado busy y pérdida de drafts están cubiertos en código y recorridos web.

Referencias: `docs/diseno-papel-cobalto/referencias/`. Diecinueve comparativas reales (11referencia/app,8antes/después), tamaño/tema/datos igualados y diferencias deliberadas documentadas. `docs/GALERIA_AVISOS_1_6.md` enlaza capturas recientes. El directorio histórico`estructura-1.5` contiene capturas actualizadas1.6 por nombres de los tests; el manifiesto identifica archivos/fechas/hashes. No usar sólo el nombre de carpeta como prueba de versión. Puntuaciones automáticas o tests funcionales no acreditan fidelidadvisual perfecta.

Axe registrado:8superficies nuevas0violaciones/0incompletas;80superficies previas de contraste y tamaños320/360/390/412/tablet/escritorio, texto200%DOM. No equivalen a certificaciónWCAG, TalkBack ni fontScale físico. Brillo/sol dependen también del dispositivo; app no cambia brillo automáticamente.

## 7. Offline, avisos y límites de persistencia

La app individual guarda datos comerciales localmente y distingue guardado real de intenciones pendientes. No significa SYNCEDcloud. Sobre serializado, operacionesappliedIds, revisiones y transaccionesSQLite protegen stock. Los archivos internos de recuperación conservan originales; no se borra auditoría para ganar espacio. Fotos mantienen UUID/bytes mientras estén referenciadas por una recuperación, y JSON completo permite transportar datos/fotos.

Los avisos usan una sola clave existente`chema:local-feedback:v1` y representaciónv2. General apagado al inicio,08:00visible,4anticipaciones; cada alquiler hereda realmente salvocustom/legacy. Se persiste intención antes de OS, una programación por offset con ID estable, sólofuturos; cambios de fecha/horario cancelan y recalculan. V1manual conserva dato/identificador, se cancela antes de sustituir. Cancelaciones fallidas y parcialidad permanecen recuperables; estados viejos ante error se presentan «Programaciónporverificar». Automáticos silenciosos; confirmaciones opcionales independientes.

Al tocar se validaID/tipo y se espera sesión/inventario/navegación. El aviso no mueve stock. AndroiddeclaraBOOT_COMPLETED/POST_NOTIFICATIONS; sinpermisos de alarmasexactas, horario=solicitudOS, puede retrasarseporbatería/DND/canales/fabricante/force-stop. PruebaSDK/mocks no demuestra recepción después de reinicio real. Web no programa avisos nativos. Las preferencias de avisos son por dispositivo y no forman parte del JSON comercial existente.

## 8. Publicidad y servicios

Anuncios solicitados inicialmente fueron descartados después. No hay AdMob operativo, banners activos o facturación para monetización en la edición. La entregaAPK fue escaneada por marcadores/cfg propios; esto no significa auditoría total binaria de todos los SDKtransitivos. ExpoNotifications puede incluir dependencias nativas del ecosistemaGoogle sin que eso configure nube o pushremoto. Lo comprobado es ausencia de configuraciónFirebaseembebida/Adspropios y flujoLOCAL_ONLY sin inicialización/remotorequerido.

FirebaseJS y functions/reglas siguen en el árbol para integración histórica. No activarAuth/Storage/FCM/Functions/Blaze al cerrar la edición gratuita. .env.example sin secretos permite modoindividual. No hace falta una clave de mapas: navegación externa sólo abre URL y pide ubicación cuando se necesita.

## 9. Seguridad y riesgos reales

| Riesgo/hallazgo | Evidencia/estado | Cierre o limitación |
|---|---|---|
| F1fechasDELIVER vsbackup | Repro actual24/10enfixture: entregaanticipada admite retiro<planificada, JSON luego rechazado | Corregido y probado: guarda previa al stock,2unitarias y recorridoUI; datos reales no reescritos |
| F2ZodGHSA-mrhx-c7xc-m3w5 | Aviso actual24/10, validación de colecciones/import puede agotar memoria; firstpatched4.6.6 | Parche4.6.6 raíz/Functions y locks; regresión de límites aprobada; no se afirmó reproducir agotamiento real |
| Node-forge transitivoCLI | AvisoRSAverificación; cadena herramientasExpoCLI, sinparche publicado comprobado en revisión | No bajarExpo a44ni auditfixforce; no afirmarque afectaautomáticamenteAPK |
| UUIDtransitivo | Aviso de buffers/APIv3-v5-v6; ExcelJS/xcodeusanv4 según revisión | Exposición específica por seguir; no inventar0vulnerabilidades |
| Nombredeingreso | Identificaciónlocal sin verificación | Usoindividual deliberado; bloqueo delteléfono/copiaexterna, noAuthproductiva |
| Clavedefirma | Certificado interno deplantilla conservado | No subirkeystore ni rotarlo; no publicacióncomercial ni custodiaempresarialcertificada |
| JSON/fotos/comercial | ContienenPII y no tienen cifrado deaplicación propio | Guardarprivado; no asumir ausencia de cifrado delsistema ni implementarmigracióninnecesaria |
| Discoperdido/desinstalación | Base y fotos sonlocales | Copias externas verificadas periódicas; no promete nube/restoregarantizado |
| allowBackupAndroid | Config/manifestdeplantilla permitemecanismosOS | No confundirbackupOS conbackupsaplicación; cambios requierenevaluaciónde recuperación |
| Volumencreciente | Snapshot/logs/IDscrecen; SQLite evita cuota comercialAsyncStorage | No hay paginación/retención automática milagrosa; medirconvolumenrealantesmigrar |
| Permisos/Doc/NotificacionesOS | Sin teléfono en entorno | Lista de aceptación física pendiente |

Nunca imprimir tokens/contraseñas/keystores. Claves públicas de configFirebase no son claves privadas, pero no se necesitan en esta edición. SAST/npm y mocks no certifican seguridadproductiva. El resultado npm histórico9entradas propagadas no se debe reutilizar como auditoría nueva: en24/10apareció Zod y cambió la distribución aun manteniendo el total9.

## 10. Errores anteriores y su estado

La auditoría17/10integral se conserva en el anexoA. A1validaciónsemántica: corregida con39casos; A2cuotaAsyncStorage: SQLite/migración/transacciones y recuperación explícita; A3fotoshistóricas/UUID: referenciasretenidas; A4compartirnocertificaexterno: selector/verificacióndedestino ycancelación; A5textoCloud/erroresdetrásdemodal: adaptados/localinline; A6adjuntosexternosJPEG: validaciónbytes/tamaños/referencias; A7parchesSDK/decoder: reparados, restanavisosactuales; A8suiteUIantigua: actualizada y ampliada, físicoaúnpendiente.

Otros corregidos enGit/pruebas: decoder local filetransitivo/lock inválido eninstalaciónlimpia; Worddescargabloqueadopor filtroExcel; excesodecabecera/accionesdecuadro/tokenstema; medidasdecarganoequivalentes; conflictos desaparecíantrasreinicio; stocktaller/perdidosin salida; confirmacionesbusy/dobles toques; permisosdenegadossin falsoéxito; avisosmanualesduplicados; expiradosconpermisodenegado; snapshotsprogramadosviejos trasfalloguardado; sonidoautomáticoacopladoaconfirmación; error tapfrío borradopor reconcile; legacyproponíahoy eneditar; ariagroupenpanelessinrol.

Cada afirmación remite al código/commit/tests del inventario; el estado de los nuevosF1/F2 no se confunde con esos cierres históricos.

## 11. Rendimiento

Se conservan virtualizaciónFlashList, filascompactas, cálculosderivados y un reloj porpantalla, pausaAppState/movimiento reducido, carga diferida de documentos/workersweb y compresiónlocaldefotos. No se añadióblur costoso por elemento. No se cambióelgestor deestado por preferencia.

Medidas disponibles: tamañoAPK1.6.1=56176031bytes (1.6.0anterior56.174.111), webexport≈7.8MBsincomprimir/ZIP≈1.9MB; tiemposdetests/Gradle son delentorno, no latenciadelapp. NingúnFPS, RAM/batería o arranquefísico medido. Snapshotagregadoylogs, cientosdeavisos, imágenes grandes y múltiplescopiaspuedenafectar memoria/IO; riesgos concretos ameritanmediciónconfixture antes de cambios. No se promete escala ilimitada.

## 12. Git, respaldos, entrega y persistencia

Repo privadoautorizado:`https://github.com/kkshiiit/repartos-chema.git`. Main=código/docs; descargas=APK/ZIPversionados. Git está inicializado, sin reset/forcepush. El usuario eligiókkshiiit entre doscuentas. La copia delcódigo no incluye node_modules/secretos/firmaprivada. Herramientapackage.pycreaSHA256.json, compruebaCRC, extraetodosycomparahashes. La persistenciadelentorno remoto no se promete indefinida: elrespaldodescargable/GitHub es la ruta derecuperación.

APK1.6.0/code9 (antecedente preservado; versión vigente1.6.1 en Estado final):
- packagecom.grupochema.repartos; Android7+/ARM64; nodebuggable;SQLitey3WAVoriginales.
- runtime295a97757446310eba5a48260804ae7b655ec0dd; Gradle9m32s/701tareas.
- SHA256`29a4a57b7ea1a746c6127d2f8b688b12278a7e41837bd8f85e05eb97ba3bf675`.
- certificadoSHA256`fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`, mismo queentregasprevias.
- descargas4f4f7988a2c194637df6a0ab37bfdcbb65f1f8b5; recuperadodesdeclonindependiente conbytes/SHA/CRCigualy7APKpreviosintactos.
- [Descargar](https://github.com/kkshiiit/repartos-chema/raw/refs/heads/descargas/android/v1.6.0-local.1/repartos-chema-local-1.6.0-arm64.apk). Este enlace seguirá siendo histórico cuando sepubliqueelcorrectivo.

Fuenteantesdebuild295a977ZIPrestaurado1254archivos, SHAeefd6b61ea2fb60b51ce62d873ff89784d40a24a2ad9978d2ce57487d6af8759. WebZIPSHA b084b6eec37d54224fdd13a3374b86752c2ca42ff17616c0fd7edddeeba67772. Fuente55c0725de cierre existe localmente; laampliacióndeagentes posteriornoalteróAPK. El cierre actual también tiene fuente f9f018d restaurada y recuperada; ver Estado final y carpeta1.6.1.

No hubo creación comprobada de carpeta en C:\Users delusuario desdeesteentorno. El trabajo viveen/workspaceyGitHub; sepuedeusarAPKdesdeAndroid sinPC. No se inventanURLsdepreviewpúblicas; localhostdelentorno noesaccesodesdeelcelular.

## 13. Herramientas y perfiles

Git/Node/npm/TypeScript/ESLint/Vitest/Playwright/Chromium y SDKAndroid/JDK/Gradle han estado disponibles; versionesexactas actuales se registranconloscomandosdecierre. CodexCLI0.159.2reconociólos282perfiles enprueba aislada sininferencia. Susdatos/procedencia están `.codex/agents` ydocs/AGENCY_AGENTS*. Seaplicanpocos perfiles relevantes; enestaAPI no hayselectoragent_type: leerunperfilcomoguía noesinstanciarunmodelonuevo.

Enesta ejecuciónseaplicanarquitectura/QA/seguridad/entrega como guíasen subagentes reales conalcancesacotados. No seconfundeeso con recarga delcatálogo. SkillsExpo/RN sepreservan. Figma/MotionSites/Context7fueron solicitados históricamente: no seafirma usoo disponibilidad actual sinherramienta yprueba. No seinstalanplugins redundantesporpalabrasclave. Railway/Firebase/hosting no sonnecesarios nicostosautorizados. MCPdela sesiónpuedevariar; queChatGPTtengaconectorno garantizasudisponibilidadenotroCodex.

Noautomatización dereanudación configuradaparaeste cierre. Herramientasdeautomatización puedenexistirencliente, perono equivalenaprocesocodingpersistente garantizado; no seprograma/activa ningúntrabajofuturoenestaejecución. Alagotaruso sólo cuentan archivos/commitsconservados.

## 14. Pruebas y compilación: evidencias y límites

Resultados actuales del25/10:444/444,57/57UI,348capturas/19comparativas/8Axe0errores, npmci y Gradle9m12s correctos. Evidencias `artifacts/validacion/cierre-2026-10-25-*` y `android-1.6.1-*`. Primera tanda concurrente se interrumpió por agotamiento del entorno; secuencial56/57 identificó una espera faltante del test, corregida y suite completa repetida57/57. No se ocultan esas ejecuciones ni se cuentan como éxito.

Comandos reproducibles (Node24 probado en este entorno; Functions declara22 y su instalación avisa esa diferencia):

```bash
npm ci
npm --prefix functions ci
npm run check
npm run build:web
npm run preview
CHEMA_TEST_LOCAL=true npm run test:ui -- --workers=1
```

Playwright usa Chromium instalado; se puede definir CHROMIUM_PATH para otra ubicación. Android exige JDK21/SDK36/NDK27.1 y la clave previa externa mediante CHEMA_ANDROID_KEYSTORE; ver docs/ANDROID.md. No ejecutar npmci/Chrome/Gradle juntos en este entorno de8GiB. Firebase Emulator/producción no se ejecutó ni se necesita para el modo local. Compilar Functions no es desplegar. iOS no se compiló ni certificó. Un bundle Hermes no sustituye un APK. Las capturas y contrastes de navegador no acreditan hardware ni TalkBack.

## 15. Cierre gratuito y próximos pasos priorizados

1. **Completado y comprobado:** auditoría completa temprana en GitHub, commits por bloques, fuente ZIP/SHA/restauración y recuperación independiente. No se depende sólo del entorno ni del chat.
2. **Completado y comprobado en unidad/web:** F1/F2/F3, integridad y recorridos de la edición individual, documentos, JSON/fotos y temas. No migrar frameworks o datos por preferencia.
3. **Completado y comprobado como artefacto:** Gradle completo, APK1.6.1 con paquete/certificado anteriores, firma/CRC/ABI/recursos/markers, publicación y recuperación independiente preservando8APKanterior.
4. **Completado y comprobado en navegador:** capturas claras/oscuras y comparativas estructurales; no es validación Android.
5. **Pendiente de aceptación física:** copiaJSON externa → instalar encima → comparar stock/alquileres/fotos/historial → modoavión/cierre/reapertura → permisos/notificaciones/reinicio → Word/Excel/Compartir/cámara/GPS. Registrar modelo/versiónOS y mensajes exactos; no borrar almacenamiento para resolver fallos.
6. **Mantenimiento siguiente:** parches compatibles de herramientas, custodia privada de firma fuera del entorno, medición de volumen/memoria y copias grandes. No auditfixforce ni actualización nativa sin prueba y compatibilidad. Si se informa un error real, conservar original y reproducirlo antes de corregir; no reabrir auditoría general ni reconstruir APK sólo por documentación.

La app actual no necesita servicios externos pagos. No se promete capacidad ilimitada, disponibilidad permanente del workspace, sincronización cloud ni puntualidad garantizada del sistema operativo.

## 16. CONTEXTO COMPLETO PARA CONTINUAR EL DESARROLLO

Proyecto privado `kkshiiit/repartos-chema`, directorio `/workspace/repartos-chema`. Objetivo confirmado: edición individual Android gratuita/local/offline, inicialmente vacía, datos existentes preservados, sin anuncios, backend obligatorio, servicios pagos, Firebase productivo ni PlayStore. Diseño actual Papel/Cobalto, cuatro pestañas Alquileres/Depósito/Viaje/Historial, Claro/Oscuro/Sistema persistente y control principal. No volver a Aurora ni agregar Cerradas por leer documentos antiguos.

Stack verificado: Expo57.0.30, RN0.86.3, React19.2.3, TS6.0.3/Router/Context, SQLite comercial con migraciónAsyncStorage no destructiva, fotos locales comprimidas, JSON completo, docx/ExcelJS, Vitest/Playwright. Dominio separado de UI/repositorio; enteros no negativos, IDs estables, revisiones, idempotencia y auditoría/undo5min. Alquileres/carga/combos/entrega/retiro/reingreso/reactivación/triangulación/faltantes/recuperación/ajustes/responsables, viaje/GPS/WhatsApp, historial, fotos y documentos están implementados con pruebas unitarias/web; sus APIs nativas necesitan aceptación física. Nombre local identifica movimientos y no autentica una cuenta cloud. Roles técnicos se conservan; no agregar cuentas demo a la interfaz individual.

**Entregado1.6.1/code10**, paquete `com.grupochema.repartos`, fuente funcional `f9f018d3d33d6d474babcc669b1144412802ad28`. APK `https://github.com/kkshiiit/repartos-chema/raw/refs/heads/descargas/android/v1.6.1-local.1/repartos-chema-local-1.6.1-arm64.apk`, SHA256 `03e42657ad62d9c39ddd3cc2060a8ebd1d11d861fd78c0da46bda2f311c578f1`, 56176031bytes. CertificadoSHA256 `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`, idéntico al anterior. Descargas `293e748c162a5518a02b9f91330779064beed6f5`; recuperado en clon independiente con firma/SHA/CRC coincidentes y8APKprevios intactos. No recompilar por un cambio de documentación. Si falta la clave externa, no sustituirla ni rotarla. Fuente previa ZIPf9f018d restaurada/recuperada1594archivos; respaldos adicionales y audit final en carpeta1.6.1, cada uno con manifiesto. No subir claves/envs/dependencias regenerables.

F1 cerrado: DELIVER rechaza retiro anterior a entrega planificada antes de mover stock; fechas efectivas separadas,2regresiones yUI. F2 cerrado en app/Functions: Zod4.6.6, locks y límites con regresión. F3 cerrado: remito legacy sin fecha usa «Sin fecha de retiro»,5casos. No normaliza datos reales silenciosamente. Legacy sin fecha puede abrirse para completar; importación activa estricta, originales y snapshots retenidos. No borrar datos ni desinstalar para arreglar corrupción.

Avisos1.6: fechaRetiroEstimada = Alquilado hasta; cuenta civil Argentina derivada, actualiza al cambiar día/resume/edición. General opt-in08:00+3/2/1/0, herencia real y personalizados, un ReminderService/clavev1 con representaciónv2, manuales conservados, intenciones/reintentos/cancelación reconciliados. Sólo futuros; finalizar retiro/reingreso cancela. Avisos no mueven stock. Taps esperan sesión/inventario/navegación. Android no declara alarmas exactas: no prometer puntualidad, recepción con cierre/reinicio/force-stop o ejecución permanente sin probarla.

Pruebas frescas25/10:444unitarias/40archivos,57/57UI/0omitidas,8Axe0violaciones,348capturas actuales/19comparativas, npmci limpio1565paquetes/decoder directo y transitivo/lockintacto, tipos y Functions build correctos, lint0errores/1advertencia. Gradle9m12s/701tareas. Logs de fallos previos conservados: OOM al ejecutar instalaciones yChrome juntos; test de cambio de nombre adelantaba navegación completa y ahora espera acuse. No repetirlos ni inventar prueba física. Cgroup8GiB: ejecutar tareas pesadas secuencialmente.

Seguridad residual: npm audit21raíz(12altas9moderadas0críticas)/10Functions heredado. Nuevos avisos revisados son herramientas dev bajoFirebaseCLI; Zod de app parcheado, CLI3.x sigue señalado; node-forge sin parche confirmado; uuid consumidores revisadosv4 sin buffer. Sin camino de ejecución nuevo en APK identificado, no ausencia total de vulnerabilidades. No auditfixforce/downgrades SDK ni exponer servidores CLI/MCP/emuladores. JSON máximo50MB no garantiza RAM acotada para arrays sin máximo individual. Respaldo privado externo del certificado requiere custodia segura; nunca publicarlo.

**Primera acción al retomar:** leer docs/CONTINUIDAD_CODEX.md, esta auditoría y docs/ENTREGA_LOCAL_1_6_1.md; gitstatus/log/remoto. Si sólo piden APK, entregar el ya publicado. Siguiente tarea pendiente real: aceptar en un Android del usuario con JSONexterno, actualizar encima y comprobar stock/fotos/historial/temas/offline/avisos/permisos/cámara/compartir. No existe teléfono/emulador conectado ni automatización de trabajo futuro confirmada. Usar sólo perfiles/skills pertinentes entre282agentes instalados; instalar perfiles no los ejecuta. No reactivar cloud o publicidad. Guardar resultados y checkpoint antes de límites; no prometer continuidad fuera de la ejecución activa.

## 17. Inventario y evidencia histórica íntegra

Los siguientes inventarios se generan del repositorio y no afirman haber probado cada ruta. Los anexos son documentos históricos íntegros, con su fecha/base; **sus pendientes pueden estar resueltos hoy**. La primera parte y las actualizaciones posteriores son el estado vigente.

### Árbol de código y pruebas inspeccionables

```text
app/(auth)/login.tsx
app/(tabs)/_layout.tsx
app/(tabs)/galpon.tsx
app/(tabs)/historial.tsx
app/(tabs)/index.tsx
app/(tabs)/mapa.tsx
app/_layout.tsx
app/combos.tsx
app/configuracion.tsx
app/equipo/unirse.tsx
app/exportar.tsx
app/obra/[id].tsx
app/obra/editar.tsx
app/obra/nueva.tsx
functions/src/bootstrap.ts
functions/src/excelGenerator.ts
functions/src/index.ts
functions/src/team.ts
functions/src/wordGenerator.ts
scripts/build-android-demo.mjs
scripts/build-web-local.mjs
scripts/build-workers.mjs
scripts/compare-structure.py
scripts/emulator-local.cjs
scripts/package-json-hotfix.py
scripts/package-web.py
scripts/package.py
scripts/serve.mjs
scripts/verify-android.py
src/components/AuroraBackground.tsx
src/components/BackupImport.tsx
src/components/CardObra.tsx
src/components/DataList.tsx
src/components/DateTimeFields.native.tsx
src/components/DateTimeFields.shared.ts
src/components/DateTimeFields.tsx
src/components/DepotSettings.tsx
src/components/Editorial.tsx
src/components/FaltantesForm.tsx
src/components/FeedbackSettings.tsx
src/components/ListStructure.tsx
src/components/LoadEditor.tsx
src/components/LocalBackupActions.tsx
src/components/MotionView.tsx
src/components/ObraForm.tsx
src/components/OperationForm.tsx
src/components/PhotoImage.tsx
src/components/RentalReminderPanel.tsx
src/components/RetirementReminderSettings.tsx
src/components/ScaffoldSelector.tsx
src/components/SmartCounter.tsx
src/components/StatusChip.tsx
src/components/TeamSettings.tsx
src/components/ThemeToggle.tsx
src/components/ToolsLayout.tsx
src/components/WelcomeProvider.tsx
src/components/ui.tsx
src/context/AuthContext.tsx
src/context/FeedbackContext.tsx
src/context/InventoryContext.tsx
src/context/ThemeContext.tsx
src/data/localInitialState.ts
src/data/localStorage.native.ts
src/data/localStorage.ts
src/data/migrateLocalStorage.ts
src/data/nativeInventoryStorage.ts
src/data/repository.ts
src/data/seed.ts
src/data/sqliteStorage.ts
src/data/validation.ts
src/domain/engine.ts
src/domain/rules.ts
src/domain/schema.ts
src/domain/team.ts
src/hooks/useBusinessClock.ts
src/hooks/useHaptics.ts
src/hooks/useMotionPreferences.ts
src/services/authPersistence.native.ts
src/services/authPersistence.ts
src/services/backupService.ts
src/services/depotSettings.ts
src/services/errors.ts
src/services/exportService.ts
src/services/feedback/notification-adapter.native.ts
src/services/feedback/notification-adapter.ts
src/services/feedback/reminderNavigation.ts
src/services/feedback/reminders.ts
src/services/files.ts
src/services/firebase.ts
src/services/historyService.ts
src/services/jpegValidation.ts
src/services/links.ts
src/services/localDocuments.ts
src/services/localDocuments.web.ts
src/services/localId.native.ts
src/services/localId.ts
src/services/localMode.ts
src/services/notifications.ts
src/services/photoCache.ts
src/services/photoCache.web.ts
src/services/profileCache.ts
src/services/storageService.ts
src/services/teamService.ts
src/theme/tokens.ts
src/types/exceljs-browser.d.ts
src/types/index.ts
src/utils/dateInput.ts
src/utils/formatters.ts
src/utils/listPresentation.ts
src/utils/retirementCalendar.ts
src/utils/trip.ts
src/utils/whatsapp.ts
src/workers/firebase-messaging-sw.ts
tests/aurora.test.ts
tests/backend.integration.test.ts
tests/backup-destination.test.ts
tests/backup.test.ts
tests/counter-presentation.test.ts
tests/date-input.test.ts
tests/date-time-fields.test.ts
tests/documents.test.ts
tests/domain.test.ts
tests/feedback-context.test.ts
tests/files-native.test.ts
tests/files.test.ts
tests/firebase.integration.test.ts
tests/fixtures/foto-sintetica.jpg
tests/fixtures/whatsapp-five.json
tests/formularios-cobalto.test.ts
tests/helpers/sqlite.ts
tests/import-integrity.test.ts
tests/import-json.test.ts
tests/import-screen.test.ts
tests/legacy-query.test.ts
tests/legacy-retirement-date.test.ts
tests/list-presentation.test.ts
tests/local-documents.test.ts
tests/local-feedback-web.test.ts
tests/local-notifications.test.ts
tests/local-reminders.test.ts
tests/local-start.test.ts
tests/native-storage.test.ts
tests/panels.test.ts
tests/photo-recovery.test.ts
tests/recovery-regressions.test.ts
tests/reminder-navigation.test.ts
tests/reminder-presentation.test.ts
tests/repository.test.ts
tests/retirement-calendar.test.ts
tests/retirement-reminders.test.ts
tests/storage-migration.test.ts
tests/team-backend.integration.test.ts
tests/team.test.ts
tests/themes.test.ts
tests/trip.test.ts
tests/ui/accessibility.spec.ts
tests/ui/app.spec.ts
tests/ui/aurora.spec.ts
tests/ui/cobalto-surfaces.spec.ts
tests/ui/cobalto.spec.ts
tests/ui/combos-local.spec.ts
tests/ui/deposito-viaje-estructura.spec.ts
tests/ui/estructura.spec.ts
tests/ui/helpers.ts
tests/ui/import-json.spec.ts
tests/ui/local.spec.ts
tests/ui/operations.spec.ts
tests/ui/recovery.spec.ts
tests/ui/reminders.spec.ts
tests/ui/themes.spec.ts
tests/ui/trip.spec.ts
tests/ui/welcome.spec.ts
tests/uri-decoder.test.ts
```

### Historial Git accesible (últimos100commits)

```text
dc69734 2026-10-24 chore: completar catálogo Agency Agents conservando perfiles Chema
21f33ba 2026-10-24 chore: instalar perfiles Agency Agents de proyecto para Codex
55c0725 2026-10-23 release: acreditar APK 1.6 publicado y su recuperación íntegra
206793b 2026-10-23 docs: guardar recuperación remota y continuidad durante Gradle 1.6
295a977 2026-10-23 test: validar cierre de avisos y capturas antes de APK 1.6
59c9a6d 2026-10-23 fix: comprobar avisos parciales, expiración y recuperación sin falsas confirmaciones
cca787e 2026-10-23 fix: consultar y documentar alquileres legacy sin inventar fechas
6086ff2 2026-10-23 fix: abrir fechas legacy para reparación sin relajar stock ni importaciones
4a8dbd3 2026-10-23 feat: calendario argentino y avisos de retiro heredables y durables
bc3068c 2026-10-23 test: recuperar cierre visual y verificar APK estructural 1.5
67f3a2e 2026-10-18 test: acreditar estructura con capturas comparativas y estados accesibles
e9a1e5c 2026-10-18 ui: priorizar carga seleccionada y documentar comparación por composición
5eaa298 2026-10-18 ui: precisar conteo de materiales y completar fixtures de comparación
e65025c 2026-10-18 ui: afinar densidad de filas y recorridos con regresiones preservadas
b4e8f4c 2026-10-18 ui: reorganizar detalle formularios y herramientas con acciones en paneles
f978056 2026-10-18 ui: reemplazar tarjetas operativas por listas agrupadas y recorrido secuencial
332e56e 2026-10-18 docs: dejar comandos de continuidad listos para ejecutar
049c7d2 2026-10-18 docs: cerrar continuidad cobalto con APK y respaldos recuperados
876bf4a 2026-10-18 release: documentar APK cobalto 1.4 verificado y recuperado desde GitHub
8cc746a 2026-10-18 test(ui): respaldar 44 recorridos y evidencia cobalto en ambos temas
679807b 2026-10-18 fix(android): nombrar tonos válidos y preservar firma durante prebuild
72e6971 2026-10-18 fix(ui): preservar cierre y accesibilidad con texto ampliado y exportación local limpia
d7e9187 2026-10-18 feat(ui): aplicar edición cobalto y asistente de alquiler sin alterar existencias
d35a01c 2026-10-18 feat(local): añadir avisos y tonos opcionales con recuperación sin backend
80d4649 2026-10-18 feat(ui): centralizar papel y cobalto con paneles seguros y movimiento breve
1542ce4 2026-10-18 docs: preservar encargo cobalto y preparar audio local compatible
1e5dcc9 2026-10-17 docs: instalar y verificar siete skills de UI para Codex sin modificar la app
d6fc0a1 2026-10-17 docs: cerrar entrega 1.3.0 con APK y fuente final restaurados desde GitHub
1d37618 2026-10-17 docs: entregar APK Aurora verificado desde GitHub y guia de actualizacion Android
c3f2676 2026-10-17 build: verificar APK ARM64 1.3.0 completo con certificado compatible y SQLite
8c6ff9f 2026-10-17 test: comprobar respaldo remoto y flujos locales tras reparacion del lock
a9608a6 2026-10-17 docs: verificar firma recuperada y respaldo GitHub antes del segundo Gradle
d5da6a5 2026-10-17 fix: hacer reproducible npm ci del decoder local tras restauracion limpia
ce43195 2026-10-17 test: validar 175 pruebas y 31 recorridos Aurora y guardar checkpoint de cierre
cd6013a 2026-10-17 test: guardar capturas Aurora y regresiones de fotos GPS combos y temas
4a82322 2026-10-17 test: ampliar QA local y quitar aviso duplicado en ventanas Aurora
62e04a4 2026-10-17 fix: acotar decodificacion de URI malformadas manteniendo compatibilidad del router
1c7bb72 2026-10-17 fix: habilitar recuperacion explicita y copias restaurables con almacenamiento bloqueado
6c90f2e 2026-10-17 chore: alinear SDK57 y preparar recorridos locales anonimos para Aurora 1.3.0
e9d0770 2026-10-17 fix: verificar copias externas y preservar fotos de recuperaciones locales
3506b9e 2026-10-17 feat: aplicar sistema Aurora glass accesible con movimiento ambiental adaptable
deb23ce 2026-10-17 fix: detectar base SQLite ausente sin recuperar legado desactualizado
636781e 2026-10-17 feat: migrar inventario Android a SQLite con originales y recuperaciones preservados
d26a9ef 2026-10-17 fix: validar integridad de copias antes de importar sin bloquear legado
fb5ec6e 2026-10-17 docs: auditar cierre local gratuito y planificar integridad y validacion Android
bfb8943 2026-10-16 docs: cerrar entrega 1.2.2 con APK y respaldo recuperados desde GitHub
f77a2dc 2026-10-16 build: verificar APK ARM64 1.2.2 y documentar pulido local
adbdc0e 2026-10-16 test: comprobar accesibilidad y ordenar continuidad del pulido local
bae300e 2026-10-16 merge: conservar importacion JSON e integrar pulido local 1.2.2
9174621 2026-10-16 fix: pulir responsables documentos y archivos del uso individual
31cd72d 2026-10-16 build: entregar APK 1.2.1 firmado con evidencias y respaldo sin perdida
9dafd56 2026-10-16 fix: revisar JSON antes de importar y recuperar inventario anterior
e9f8ec7 2026-10-16 test: reproducir importacion JSON local y confirmar cinco pedidos reales
327c653 2026-10-16 docs: cerrar entrega APK local 1.2 descargable y recuperada desde GitHub
8008596 2026-10-16 build: verificar APK local 1.2 ARM64 y conservar evidencias
e140b51 2026-10-16 docs: explicar instalacion y uso individual sin servicios externos
a820afe 2026-10-16 test: validar flujo individual offline respaldos y documentos locales
22792ce 2026-10-16 feat: preparar uso individual con inventario vacio y recuperacion local
aabe9d8 2026-10-15 docs: comprobar Authentication inicializado sin crear usuarios
c7ce4c8 2026-10-15 docs: registrar configuracion web recibida y comprobacion publica Auth
72cd9ab 2026-10-15 chore: registrar proyecto Firebase indicado sin activar servicios
e288c73 2026-10-15 docs: preparar conexion Firebase desde Android sin activar facturacion
10ed0ae 2026-10-15 docs: cerrar entrega 1.1 y enlaces privados de recuperacion
89abc6c 2026-10-15 fix: validar invitaciones en Android y entregar APK 1.1 verificado
d7f1665 2026-10-15 feat: renovar alquileres con bienvenida equipo e itinerario al deposito
c27ad9f 2026-10-15 docs: enlazar APK privado y verificar copia descargable
fd8d5c1 2026-10-15 docs: verificar restauracion GitHub y registrar limite de assets
ad66b61 2026-10-15 docs: confirmar respaldo privado y acceso a entregables
b691e52 2026-10-15 docs: registrar acceso GitHub y bloqueo de creacion 403
47ac249 2026-10-15 docs: preservar recuperacion de autenticacion GitHub
7a635f3 2026-10-15 docs: registrar autorizacion GitHub pendiente de acceso
ed606fd 2026-10-15 docs: verificar APK interno y registrar entrega recuperable
3a89b19 2026-10-15 fix: evitar recortes en detalle movil y preservar entrega verificada
c83e0e8 2026-10-14 Prepara entrega web verificable y limita permisos del APK
52aa064 2026-10-14 Corrige accesibilidad y guarda 19 pruebas UI; prepara APK interno reproducible
5530d4c 2026-10-14 Cierra pruebas de operaciones, documentos y seguridad; documenta entrega
1436419 2026-10-14 Valida recuperación con fotos y concurrencia del backend; guarda continuidad
c634908 2026-10-13 feat: temas persistentes, cero publicidad y recuperación con fotos
d258544 2026-10-13 fix: recuperar persistencia y proteger movimientos de inventario
5c554c4 2026-10-13 chore: preservar base original antes de recuperación
```

### Archivos de auditoría13/10 citados por el usuario

- `/workspace/informes/repartos-chema-auditoria-maestra-2026-10-13.md`: no disponible; contenido no inventado.
- `/workspace/repartos-chema/docs/AUDITORIA_LOCAL_2026_10_17.md`: disponible.

---

# ANEXO A · Auditoría histórica íntegra17/10

> Documento histórico conservado; no sustituye el resultado del cierre24/10.

# Auditoría de cierre gratuito — Repartos Chema

Fecha: 17/10/2026 UTC. Base inspeccionada: main `bfb894315ed828725baa98b8e2e75255d36f97d3`; descargas `bb0bfba2da69af18572d8bbd4674443f9bfeae5b`. El código estaba limpio al comenzar. Esta tarea es auditoría y planificación: no corrige los hallazgos ni cambia la versión del APK.

## Conclusión

La edición individual ya tiene una base ejecutable, persistente y probada en web. No se considera terminada para uso diario Android: faltan fortalecer la importación/recuperación, resolver límites de almacenamiento y verificar funciones nativas en un teléfono. No hay evidencia de un nuevo fallo de stock en las operaciones normales cubiertas, pero las pruebas actuales no cubren todos los datos que puede introducir una copia JSON.

El cierre sin costos de infraestructura es viable con **un celular, almacenamiento local, documentos locales y copias manuales JSON**. No requiere Firebase, Cloudflare, hosting, EAS, Play Store, anuncios ni APIs de mapas. El desarrollo usa los recursos ya disponibles en esta sesión; no se promete acceso gratuito e indefinido a plataformas externas o cómputo futuro. El APK instalado no necesita mantener esta sesión ni una computadora encendida.

## Arquitectura y alcance conservados

- Expo 57.0.27, React Native 0.86.3, React 19.2.3, TypeScript 6.0.3, Expo Router; Context y AsyncStorage. FlashList, Zod, Lucide, Expo FileSystem/Sharing/DocumentPicker/Location/ImagePicker/ImageManipulator; ExcelJS y docx.
- Dominio: `src/domain/engine.ts`, `rules.ts`, `schema.ts`. Repositorio serializado: `src/data/repository.ts`. Validación de sobres: `src/data/validation.ts`.
- `EXPO_PUBLIC_LOCAL_ONLY=true` obliga a DATA_MODE demo/local en `src/services/firebase.ts`; no inicializa el adaptador remoto. El nombre identifica movimientos locales, no autentica una identidad. Los roles técnicos internos no vuelven a ser una elección pública.
- Clave comercial existente: `chema:demo:v1`; instalación nueva vacía. Una actualización no borra ejemplos o datos previos automáticamente.
- Navegación: Alquileres, Depósito, Viaje, Historial; detalle/alta/edición, combos, ajustes y documentos como pantallas secundarias. Retirados agrupa RETIRADO/REINGRESADO; no agregar Cerradas.
- Fotos actuales: persistentes en almacenamiento local nativo o IndexedDB web, hasta 1024 px/JPEG0.7. No requieren Storage ni Blaze para conservarse en el celular.
- Compilación: `scripts/build-android-demo.mjs`, Gradle/JDK21/SDK Android; sin EAS obligatorio. `android/` se genera y está ignorado por Git.

## Verificaciones nuevas de esta auditoría

| Comando / inspección | Resultado real |
| --- | --- |
| `npm run typecheck` | Correcto |
| `npm run lint` | Correcto, sin errores ni advertencias |
| `npm test` | 108/108, 13 archivos; integración Firebase excluida por configuración |
| `CHEMA_TEST_LOCAL=true npm run test:ui -- tests/ui/local.spec.ts tests/ui/import-json.spec.ts tests/ui/accessibility.spec.ts --workers=1` | 6/6, 30,6s, contra la exportación local existente; no se generó un build nuevo |
| `npx --no-install expo install --check` | Detectó siete diferencias de parches recomendados, enumeradas abajo; no instaló nada |
| `npm audit --omit=dev --json` | Exit1: 30 entradas afectadas, 18 altas/12 moderadas/0 críticas; cuatro avisos raíz identificados, no 30 vulnerabilidades independientes |
| `apksigner verify --verbose APK1.2.2` | Correcto, APK Signature Scheme v2 |
| `sha256sum APK1.2.2` | Coincide con la entrega: `43835da902859f6c5af77947d315fb8ec2922d9921cebe558948460b0f1ba8eb` |
| `git ls-remote` | main/descargas coinciden con las bases anteriores antes de guardar este informe |
| `adb devices` | Ningún dispositivo conectado |

Los seis recorridos abarcan flujo individual desde vacío, stock, entrega/deshacer/retiro/reingreso, responsable dentro de la entrega, JSON con revisión/cancelación/importación/deshacer, persistencia, reapertura web offline, Word/Excel, filtro Excel inválido y temas. Axe cubre claro/oscuro en ocho rutas; algunas están vacías, no todos los estados/modal ni accesibilidad física. No se ejecutó toda la suite UI histórica ni se probó Android físico.

Playwright regeneró dos muestras Word/Excel versionadas; se repusieron exactamente desde HEAD después de la prueba. No se conservaron cambios accidentales en esas muestras ni se editaron datos de usuario.

## Hallazgos priorizados

### A1 — Alta: validación semántica incompleta de copias

**Reproducido en memoria con las funciones actuales**, sin restaurar datos reales: `parseEnvelope` acepta un materialId de carga inexistente, dos combos con el mismo ID, retiro previsto anterior a entrega y un faltante con recuperado mayor que cantidad. Cantidades básicas y saldos en calle sí tienen validación, pero no bastan para validar todos los vínculos.

Evidencia: `src/data/validation.ts:153`, `src/domain/engine.ts:71`, `src/services/backupService.ts:57`. Se ejecutó el TypeScript actual mediante transpilación en memoria y estados sintéticos; no es una prueba de Android. La tolerancia de BOM UTF8 real se comprobó y funciona: no es un error pendiente.

**Corrección propuesta:** validación semántica específica antes de ofrecer importar; IDs únicos/referencias, fechas relacionadas, medidas e incidentes recuperados/reservados. No modificar cantidades para hacer pasar la validación. No endurecer el arranque de forma que bloquee sin recuperación una base histórica: validar lo nuevo y ofrecer diagnóstico/recuperación del original incompatible.

### A2 — Alta: capacidad y recuperación para uso prolongado

**Límite comprobado en el build:** AsyncStorage Android configura `AsyncStorage_db_size = 6L` en su BuildConfig generado. El repositorio guarda el sobre completo (state y confirmed duplicados), logs e IDs; cada importación/vaciado/recuperación añade una copia íntegra bajo otra clave sin catálogo ni gestión de retención. Hay riesgo de agotar ese límite aunque el teléfono tenga espacio.

Evidencia: `src/data/repository.ts:51,69,89,101,120,141`; `node_modules/@react-native-async-storage/async-storage/android/build/generated/source/buildConfig/release/com/reactnativecommunity/asyncstorage/BuildConfig.java`. Los límites de lectura por fila dependen del dispositivo; no se reprodujo un fallo de CursorWindow ni disco lleno Android. Una medición sintética con 100/500/1000 materiales y sus logs produjo sobres de 111.625/562.825/1.126.839 bytes; no son datos o tiempos reales de la empresa ni umbrales garantizados.

**Corrección propuesta:** adaptador SQLite nativo local, gratuito, detrás de Repository y migración transaccional verificada que conserve originales. AsyncStorage permanece para tema/sesión y en web. Evitar reescribir el dominio o borrar auditoría/IDs para ahorrar espacio. Catálogo de recuperaciones y gestión explícita, sin eliminar copias automáticamente.

### A3 — Alta: recuperar una copia interna puede recuperar referencias a fotos ya borradas

**Deducido de una ruta concreta, pendiente de regresión automatizada:** se archiva un estado con foto; se recupera y luego se elimina esa foto; `deleteLocalPhoto` borra su archivo. Recuperar otra vez el archivo interno antiguo restaura el URI, pero no los bytes eliminados. Las copias JSON externas completas sí incluyen bytes y son un mecanismo diferente.

Evidencia: `src/data/repository.ts:108`, `app/obra/[id].tsx:278`, `src/services/photoCache.ts`, `photoCache.web.ts`. El borrado de fotos debe considerar todas las recuperaciones retenidas. Importar fotos usa Date.now para IDs, sin protección fuerte frente a reloj repetido; emplear UUID y no sobrescritura.

**Corrección propuesta:** referencias de adjuntos en estado activo y archivos internos; conservar los bytes mientras cualquiera los use. Probar copiar/recuperar/eliminar/recuperar y dos importaciones con reloj fijo. No hacer una limpieza masiva de imágenes.

### A4 — Media: compartir no demuestra un respaldo externo guardado

**Comprobado por API/flujo; cancelación nativa pendiente de teléfono:** `saveFile` escribe en caché y espera `Sharing.shareAsync`, cuyo resultado no certifica que otra app guardó el archivo. «Empezar vacío» continúa después de ese diálogo. Se archiva el original internamente, pero no hay garantía de copia externa durable si se canceló Compartir.

Evidencia: `src/services/files.ts:26`, `app/configuracion.tsx`, `src/services/backupService.ts`. Proponer un guardado Android mediante selector de destino que permita comprobar escritura, o separar explícitamente compartir de guardar copia verificada. No presentar caché como respaldo permanente. Cancelar una exportación no debe autorizar una operación destructiva.

### A5 — Media: mensajes de nube y errores en modales

**Comprobado por código:** detalle dice «Pendiente de nube», «Subida pendiente», «Foto en nube» y limpieza remota aun en LOCAL_ONLY. `PhotoImage` propone reabrir con conexión si falta una foto local. En ubicación/recuperación, algunos errores se guardan en el detalle detrás de Sheet; deben mostrarse dentro del modal correspondiente.

Evidencia: `app/obra/[id].tsx:270,277,334`, `src/components/PhotoImage.tsx:37`. No es evidencia de una conexión cloud activa. Cambiar el texto según adaptador sin migrar ni marcar falsamente SYNCED los datos comerciales. En local: «Guardado en este celular», «Foto local», recuperación desde copia.

### A6 — Media: adjuntos externos en un JSON local

**Riesgo por inspección:** la validación admite URI genérico; prepareRestore conserva referencias HTTPS sin bytes locales y PhotoImage puede usarlas como fuente. Una copia importada puede introducir una imagen remota en la edición offline. No se ejecutó una descarga de terceros para demostrarlo.

Evidencia: `src/data/validation.ts` (fotos.uri), `src/services/backupService.ts:74,87`, `src/components/PhotoImage.tsx:23`. La edición local debe importar bytes válidos, conservar referencias no disponibles con aviso o rechazar la copia antes de modificar datos; no cargar recursos externos silenciosamente. Validar tamaño y JPEG real, no solo caracteres base64.

### A7 — Media: mantenimiento de dependencias y firma

El chequeo Expo recomienda estos parches dentro de SDK57: expo~57.0.30, constants~57.0.22, crypto~57.0.4, linking~57.0.13, location~57.0.21, router~57.0.28 y sharing~57.0.23. No se instaló nada ni se concluye que el APK esté roto por estas diferencias.

Auditoría npm: avisos raíz de braces, decode-uri-component, node-forge y uuid, propagados a otras dependencias. Expo/Metro/firma incluyen herramientas de construcción aunque npm las catalogue prod; no es demostración de explotación en el APK. decode-uri-component y la cadena de documentos merecen revisar alcance en runtime. **No usar `npm audit fix --force`: propone, entre otras cosas, Expo44/RN0.72 o cambios de SDK incompatibles.** Evaluar parches/overrides compatibles y repetir comprobaciones.

La variante release usa la clave debug de plantilla (`android/app/build.gradle:115`). Funciona para actualización interna con el mismo certificado, pero no equivale a custodia de una clave privada de la empresa. No rotar la firma ni cambiar el package sobre instalaciones con datos sin diseñar/probar la transición. Los JSON no están cifrados y el nombre no protege el acceso: usar bloqueo del teléfono y copias en una carpeta privada. El manifest habilita allowBackup; documentar/decidir conscientemente el respaldo del sistema Android, no confundirlo con nube de la app ni cambiarlo sin considerar recuperaciones.

### A8 — Media: cobertura nativa e histórica incompleta

`tests/ui/recovery.spec.ts` todavía usa obra_1 y botones «Restaurar copia»/«Copia restaurada» del flujo anterior; no corresponde a la instalación local vacía ni al diálogo actual. Otros recorridos históricos esperan la semilla. No se ejecutaron para hacerlos pasar ni se cuentan como aprobados. Faltan recorridos actuales de fotos, triangulación, combos, daños/recuperación, errores dentro de modales, tamaños de fuente grandes y actualización Android con datos.

La documentación histórica también mezcla prioridades antiguas: `docs/ANDROID.md` abre con1.2.0 y contiene instrucciones de perfiles que ya no son el acceso vigente. `package.json` sigue en1.0.0 aunque app.json/APK son1.2.2. La identidad instalable real la determina app.json/Gradle, pero conviene una única política de versión para evitar entregas mal identificadas.

## Qué ya está y qué no

| Módulo | Estado comprobable |
| --- | --- |
| Inicio vacío, persistencia, JSON normal, revisión/cancelación/deshacer | Implementado, probado unitario y web; faltan casos semánticos y selector Android real |
| Stock/entrega/retiro/reingreso/deshacer | Cubierto en dominio y recorrido local; sin validación de campo Android |
| Triangulación, medidas, daños/pérdidas/recuperaciones, permisos técnicos | Código y pruebas de dominio; faltan recorridos locales ampliados y físico |
| Responsables y formularios | Alta inline probada en web; falta teclado físico/Android y repetición rápida |
| Claro/oscuro/sistema, bienvenida, navegación y logo | Implementados; tema persistente/formulario/Axe probados; no certificación integral de accesibilidad |
| Viaje, GPS/WhatsApp externos y volver al depósito | Código/pruebas de utilidades; apertura/denegación de permisos Android pendiente |
| Word/Excel | Generadores y descargas web probados; Compartir/abrir archivos reales Android pendiente |
| Fotos | Código local y pruebas parciales con mocks; recuperación histórica/borrado y uso nativo pendientes |
| Publicidad | Eliminada de código/configuración/dependencias propias; conservar ausencia |
| APK/respaldos de código | APK completo1.2.2, firma/SHA actuales comprobados; restauración desde GitHub documentada en entrega anterior |
| Firebase/FCM/Storage/Functions, invitaciones multiusuario | Históricos, fuera del cierre local; no desplegados ni necesarios |
| PDF/firma digital/ruta óptima global | No implementados ni necesarios para el cierre individual acordado; firma de recibido en Word es un espacio de firma |

## Modelo económico de cierre

| Necesidad | Solución de costo de infraestructura cero | Límite real |
| --- | --- | --- |
| Operación/datos | APK con base local | Pérdida/desinstalación del teléfono exige copia externa |
| Fotos | Archivos locales comprimidos | Espacio del dispositivo y respaldo; sin subida automática |
| Word/Excel | Generadores JS en el teléfono | Validar tamaño/Compartir y lector externo gratuito |
| Navegación | Enlaces a Google Maps y coordenadas reales | El mapa externo puede necesitar internet/mapas descargados; sin API paga propia |
| Código/instalador | Repositorio privado existente y descargas Git normales | No almacenamiento infinito; evitar LFS/Actions pagos, sin depender de cuotas para operar |
| Construcción | Gradle/JDK/SDK con herramientas locales disponibles | Recursos de construcción disponibles, sin garantía de cómputo cloud perpetuo |
| Respaldo comercial | JSON en almacenamiento externo elegido por el usuario | Guardarlo regularmente y probar restauración; nube personal opcional, no obligatoria |

No conectar un medio de pago ni activar Blaze. No usar EAS/hosting como requisito, ni GitHub Actions de pago. No eliminar fotos por un costo que no existe en almacenamiento local. Una futura sincronización multiusuario cambiaría el alcance y requiere otra evaluación; no prometer que una cuota gratuita externa durará indefinidamente.

## Criterio de terminado

Terminado significa una versión individual Android con hallazgos de integridad cerrados, datos y copias recuperables, todos los recorridos críticos locales aprobados, actualización física conservando datos y manual sin contradicciones. Debe funcionar en modo avión para lo local; GPS/WhatsApp/Maps externos se declaran aparte. Sin cargos de backend, publicidad ni cuentas cloud necesarias. El plan ejecutable está en `docs/superpowers/plans/2026-10-17-cierre-local-gratuito.md`.


---

# ANEXO B · Entrega1.6 íntegra, estado previo a este cierre

> Documento histórico conservado; no sustituye el resultado del cierre24/10.

# Entrega individual Android1.6 · Repartos Chema

## Estado comprobado antes del instalador

Código funcional main295a977, package `com.grupochema.repartos`, versión1.6.0/code9. Trabajo sobre main existente, sin reescritura. La versión1.5/code8 previa se recuperó, su Gradle/UI habían finalizado y fue verificada antes de conservarla fuera de android. No es el APK que incluye estos avisos.

Edición individual local/offline, inicio vacío sin ejemplos comerciales. Sin publicidad, Firebase/Cloudflare/servidor/hosting obligatorio, EAS o facturación. Se conservaron SQLite, migración, fotos, inventario, reglas de stock, JSON comercial y certificado. Ninguna notificación altera existencias. Paquete fuente previo a compilación restaurado y recuperado desdeGit:1254archivos, SHA256 `eefd6b61ea2fb60b51ce62d873ff89784d40a24a2ad9978d2ce57487d6af8759`.

## Funcionalidades

- Alquilado hasta reutiliza fechaRetiroEstimada, separado de retiro efectivo. Calendario/reloj nativo compatible y escritura alternativa; web controles del navegador. Crear/editar siguen validando fechas.
- Contador civil argentino derivado, sin persistir número de días. Hoy/mañana/futuro/vencido/sinfecha; finales sin contador pendiente. Cambio de día, reanudación y edición actualizan presentación y agrupación.
- Avisos generales inicialmente apagados,08:00 editable visible y3/2/1/0días seleccionados. Herencia verdadera para alquileres existentes/nuevos. Personalización por alquiler y vuelta a General sin sobrescribir personalizados.
- Un único ReminderService extendido con intenciones v2, IDs estables por alquiler/offset, sólo futuros, cancelación/reprogramación segura. V1/manuales migrados sin duplicación; reintentos, permisos y programación parcial explícitos. Automáticos silenciosos independientes de confirmaciones; manuales conservan opciones.
- Taps locales esperan sesión/inventario/navegación antes del detalle. IDs validados, deduplicación y confirmación de lectura. Eliminados generan aviso persistente. No se navega a URLs arbitrarias.
- Legacy sin retiro válido puede abrirse y editarse sin normalizar ni escribir automáticamente. Editar no rellena hoy. Nuevas operaciones/importaciones activas exigen fecha válida; históricos originales conservados. Stock y demás campos mantienen validación.
- Depósito, Viaje, Historial, combos, carga, entrega/retiro/reingreso/triangulación, responsables, fotos y copias conservados. Viaje prioriza vencidos/hoy, ruta por paradas y regreso al depósito. Reporte Excel y remito Word institucionales funcionan en web; distribución/compartir nativos necesitan teléfono.

El dominio actual RETIRE liquida el saldo restante completo; no se agregó un retiro parcial inexistente. Transferencias/daños no finalizan por sí mismos la operación: mientras siga ENTREGADO conserva política. Finales RETIRADO/REINGRESADO cancelan avisos.

## Evidencia y pruebas reales

| Acción | Resultado | Evidencia |
|---|---|---|
| npmci aislado, scripts habilitados |1565paquetes, exit0; decoder directo/transitivo y picker9.1.0 comprobados | avisos-npm-ci.txt |
| npmruncheck final |436/436 en37archivos; tsc/lint/Functions build pasan | avisos-check-release.txt |
| Playwright suite general local |56/56 en4.1min | avisos-ui.txt/json |
| Después de ajuste de vacío legacy/semántica de panel |6/6 repetidos,44.5s | avisos-ui-entrega.txt/json |
| Axe nuevos principal/detalle/general/custom ×2temas |8superficies,0violaciones/0incompletas | avisos-axe-*.json |
| Comparación visual independiente |19tableros, dimensiones/tema/fixture igualados; revisión manual de afectadas | GALERIA_AVISOS_1_6.md |
| Copia fuente desdeGit |SHA coincide/CRC correcto,1254entradasmanifest | avisos-respaldo-remoto.json |
| adbdevices |ningún dispositivo | no prueba física |

Comandos exactos (desarrollo, no se los tiene que ejecutar el usuario para instalar el APK):

```bash
npm ci
npm run check
npm run build:web
npm run preview
CHEMA_TEST_LOCAL=true npm run test:ui -- --workers=2
```

La exportación limpia se repitió incrementalmente con los mismos flags locales tras las correcciones. Gradle usa JDK21/SDK36/NDK27.1, ARM64 y la misma clave externa mediante CHEMA_ANDROID_KEYSTORE; comando completo en docs/ANDROID.md y checkpoint. Funciones sólo compiladas, Firebase Emulator/producción no ejecutados: no hacen falta para esta edición.

Fallos encontrados y corregidos, con registros conservados: dos infracciones lint del efecto/test de navegación; formulario legacy proponía hoy; prueba de ese formulario buscaba Notice cuando el calendario usa alert/aria-invalid; cuatro comprobaciones Axe incompletas por etiqueta de grupo sin rol. Corregidos, nuevas corridas verdes. No se ocultan los intentos fallidos ni se cuentan como éxito.

## Restricciones y comprobación física

Las capturas y recorridos corresponden a Chromium, con datos sintéticos, no Android. No se acreditan instalación, migración SQLite física, permisos/cámara/compartir/TalkBack, cierre/reinicio real, batería, FPS o memoria de un teléfono. El SDK declara recepción de arranque y reconciliación, pero su presencia en código no prueba entrega física.

Android puede retrasar notificaciones por permisos, canales, DND, ahorro de batería, fabricante o force-stop. Sin autorización de alarmas exactas usa programación inexacta permitida en reposo. Horario elegido = solicitud al OS, no garantía de puntualidad. No se pide permiso sensible adicional de alarmas exactas. Web guarda preferencias, no entrega avisos nativos. Preferencias de avisos se guardan por dispositivo fuera del JSON comercial.

Auditoría npm:9entradas(5altas/4moderadas/0críticas), principalmente cadenas propagadas de node-forge en herramientas ExpoCLI y uuid en ExcelJS/xcode. No se aplicaron downgrades incompatibles sugeridos por npm. No son9fallos independientes ni se demostró exposición de esos caminos en APK; revisión compatible de transitivos queda pendiente. Ver AVISOS_RETIRO_1_6.md y JSON de auditoría.

## Prueba desde tu Android, sin computadora

1. En la app actual, guardar copiaJSON en Descargas/Documentos fuera de la app. Conservarla aunque la instalación salga bien.
2. Descargar APK nuevo desde el repositorio privado, con sesiónGitHubkkshiiit; permitir instalación desde el navegador si Android lo pide. Instalar como actualización encima, **sin desinstalar ni borrar datos**. Si rechaza, conservar app/datos y compartir mensaje; no intentar resolver borrando almacenamiento.
3. Abrir y comprobar cantidades, alquileres, historial, fotos y Claro/Oscuro/Sistema. Verificar un alquiler antiguo y su fecha. En Editar, extender retiro y confirmar contador.
4. Crear un alquiler de prueba con fecha de hoy y aviso algunos minutos en el futuro. En Ajustes → Avisos y sonidos → Avisos de retiro, comprobar08:00/4opciones, elegir horario futuro y activar permiso. Debe indicar Programado sólo si OS aceptó; con denegación debe conservar alquiler y explicar noactivo.
5. Cerrar normalmente, esperar y tocar aviso; repetir con app abierta/en segundo plano. Debe abrir el alquiler sin cambiar cantidades. Cambiar fecha/hora general, probar personalizado y volver a General, completar retiro y confirmar cancelación.
6. Programar otro futuro y reiniciar teléfono. Registrar recepción/retraso, modelo y versiónAndroid. Forzar detención es distinto y puede impedir avisos hasta reabrir. Probar cámara/galería, copiaJSON, Word/Excel y compartir; no borrar datos para probar.

## Estado del instalador

**APK1.6.0/code9 generado, publicado y recuperado/verificado desdeGitHub.** Gradle completo BUILD SUCCESSFUL9m32s,701tareas(673ejecutadas/28actualizadas). Código funcional `295a97757446310eba5a48260804ae7b655ec0dd`; commits documentales posteriores no cambian el runtime. 56174111bytes, ARM64/Android7+, package `com.grupochema.repartos`.

[Descargar APK](https://github.com/kkshiiit/repartos-chema/raw/refs/heads/descargas/android/v1.6.0-local.1/repartos-chema-local-1.6.0-arm64.apk) · [Verificación/instalación](https://github.com/kkshiiit/repartos-chema/blob/descargas/android/v1.6.0-local.1/LEEME.md) · [Respaldo fuente/web](https://github.com/kkshiiit/repartos-chema/tree/descargas/respaldos/v1.6.0-local)

SHA256: `29a4a57b7ea1a746c6127d2f8b688b12278a7e41837bd8f85e05eb97ba3bf675`

Certificado: `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`, idéntico al APK1.5 verificado contra1.4. Firma v2/CRC/ABI/minSDK24/no debuggable/SQLite/tresWAV originales comprobados. Marcadores nuevos Alquilado hasta/globalPolicy/rentalPolicies/claveexistente presentes en bundleHermes. APK declara RECEIVE_BOOT_COMPLETED/POST_NOTIFICATIONS, sin SCHEDULE_EXACT_ALARM ni USE_EXACT_ALARM. Ausencia de marcadores publicitarios propios y configuraciónFirebase embebida comprobada; esto no acredita una auditoría total del código de todas las dependencias.

Publicado en descargas `4f4f7988a2c194637df6a0ab37bfdcbb65f1f8b5`; recuperado desde clon independiente, SHA/CRC y bytes coincidentes. Los7APK anteriores tienen los mismos objetosGit, sin sobrescritura. Logs/metadatos en artifacts/validacion/avisos-android.txt, android-1.6.0-*.json/txt, avisos-apk-contenido.json y avisos-descarga-remota.json. No equivale a prueba física de ejecución.

## Cambios de archivos respecto del código1.5

- `app.json`
- `app/(tabs)/index.tsx`
- `app/(tabs)/mapa.tsx`
- `app/configuracion.tsx`
- `app/exportar.tsx`
- `app/obra/[id].tsx`
- `docs/AVISOS_RETIRO_1_6.md`
- `docs/CONTINUIDAD_CODEX.md`
- `docs/GALERIA_AVISOS_1_6.md`
- `docs/GALERIA_ESTRUCTURA_1_5.md`
- `functions/src/excelGenerator.ts`
- `functions/src/wordGenerator.ts`
- `package-lock.json`
- `package.json`
- `scripts/compare-structure.py`
- `src/components/CardObra.tsx`
- `src/components/DateTimeFields.native.tsx`
- `src/components/DateTimeFields.shared.ts`
- `src/components/DateTimeFields.tsx`
- `src/components/FeedbackSettings.tsx`
- `src/components/ObraForm.tsx`
- `src/components/RentalReminderPanel.tsx`
- `src/components/RetirementReminderSettings.tsx`
- `src/components/StatusChip.tsx`
- `src/components/ui.tsx`
- `src/context/FeedbackContext.tsx`
- `src/data/repository.ts`
- `src/data/validation.ts`
- `src/hooks/useBusinessClock.ts`
- `src/services/feedback/notification-adapter.native.ts`
- `src/services/feedback/notification-adapter.ts`
- `src/services/feedback/reminderNavigation.ts`
- `src/services/feedback/reminders.ts`
- `src/utils/formatters.ts`
- `src/utils/listPresentation.ts`
- `src/utils/retirementCalendar.ts`
- `src/utils/trip.ts`
- `tests/counter-presentation.test.ts`
- `tests/date-time-fields.test.ts`
- `tests/feedback-context.test.ts`
- `tests/formularios-cobalto.test.ts`
- `tests/legacy-query.test.ts`
- `tests/legacy-retirement-date.test.ts`
- `tests/list-presentation.test.ts`
- `tests/local-notifications.test.ts`
- `tests/reminder-navigation.test.ts`
- `tests/reminder-presentation.test.ts`
- `tests/retirement-calendar.test.ts`
- `tests/retirement-reminders.test.ts`
- `tests/ui/estructura.spec.ts`
- `tests/ui/reminders.spec.ts`

Los cambios se agrupan en commits coherentes: bc3068c(cierre recuperado1.5),4a8dbd3(calendario/motor/UI),6086ff2(lectura legacy separada),cca787e(consultas/documentos),59c9a6d(regresiones de permisos/persistencia),295a977(verificación/capturas previa al APK). No subir clave privada ni .env al repositorio.


## Estado final por categoría

- **Completado y comprobado:** código/commits/remotos, respaldo recuperable y fuente desdeGit, instalaciónnpm limpia, lógica de fechas/políticas/recuperación, recorridos web de operación/JSON/fotos/documentos/temas, comparativas reales y verificaciones estáticas de APK/firma/publicación.
- **Implementado, pendiente de validar en Android físico:** instalación encima/migración del dispositivo, calendario nativo real, entrega de avisos con appcerrada/reinicio/canales/batería, cámara/galería, compartirWord/Excel/JSON, TalkBack/fontScale/teclado y rendimiento del teléfono. No hay resultados físicos simulados.
- **Pendiente de mantenimiento:** revisión compatible de las dependencias transitivas señaladas por npm. No se hicieron cambios de versión incompatibles ni se oculta el informe.
- **Fuera de alcance por decisión vigente:** publicidad, backend obligatorio, multiusuario/cloud, Blaze, servicios pagos, publicaciónPlayStore y PDF automático. Functions/Firebase no desplegados. No son requisitos para iniciar esta edición individual.

La próxima acción es la prueba física de los seis pasos anteriores. Si sólo se pide descargar, usar este APK existente, no recompilar por cambios documentales. Para retomar: leer CONTINUIDAD_CODEX.md, comprobar Git/remoto/archivos y atender el resultado concreto del Android.


---

# ANEXO C · Reglas y pruebas de avisos1.6

> Documento histórico conservado; no sustituye el resultado del cierre24/10.

# Fecha y avisos de retiro · edición individual 1.6

## Uso

En alta/edición, **Alquilado hasta** abre calendario (escritura alternativa disponible). Es `fechaRetiroEstimada`, fecha prevista de devolución del alquiler. El proyecto no tiene un fin comercial distinto del retiro planificado; no se inventó otro campo. Entrega planificada/efectiva y retiro efectivo siguen separados.

Las filas y el detalle calculan «Retirar en N días», «Retirar mañana», «Retirar hoy» o «Retiro vencido hace N días» por fechas civiles de America/Argentina/Buenos_Aires. No se guarda el contador. Se refresca al cambiar el día, reanudar o editar. Retirado/reingresado muestra estado final. Sin fecha válida no se programa y se muestra «Sin fecha de retiro» para completar desde Editar.

Ajustes → **Avisos de retiro**: inicialmente apagado, 08:00 visible/editable y 3/2/1/0 días seleccionados. Activar solicita permiso. Cada alquiler nuevo hereda el ajuste general sin copiarlo. Cambiar hora/días generales reprograma los heredados. En el alquiler → Recordatorios se puede personalizar y volver a la configuración general. La personalización permanece independiente.

Si se deniega permiso se guarda la intención, no se bloquea el alquiler y se explica que NO hay avisos activos. Conceder permiso en Ajustes Android y Reintentar reconcilia los futuros. «Programado» significa que el sistema aceptó la solicitud, no que el usuario la recibió puntualmente. Pendiente o cancelación pendiente nunca se presentan como éxito.

## Persistencia y seguridad

Se amplía el mismo ReminderService/AsyncStorage `chema:local-feedback:v1`: representación v2 con políticas generales y por alquiler, e intenciones. La clave existente se conserva. La lectura migra v1 en memoria sin sobreescribir; el próximo guardado correcto conserva preferencias y el aviso manual anterior como legacy protegido. No se agrega simultáneamente la serie automática. Elegir General/Personalizado cancela primero el manual; si falla, bloquea la nueva serie de ese alquiler hasta reintentar.

IDs de OS: `chema-local-reminder:<id>:d<offset>`; manual histórico conserva su identificador. Se persiste intención antes de programar/cancelar. Cancelación fallida, programación parcial y fallo al confirmar guardado son recuperables con IDs estables. Cada anticipación es independiente. Sólo se programan instantes todavía futuros; los pasados no se disparan juntos. Cambiar fecha cancela/recalcula. Finalizar retiro/reingreso cancela pendientes; eliminar también. El dominio actual RETIRE retira todo el saldo restante, no ofrece retiro parcial. REPORT/TRANSFER pueden dejar saldo y estado ENTREGADO: no se dan por finalizados automáticamente y conservan la política. Reactivar aplica la fecha vigente y sólo avisos futuros.

Tocar un aviso abre su alquiler tras esperar sesión local, inventario y navegación; respuestas duplicadas se deduplican y se confirma lectura al OS después de navegar. Una respuesta no modifica el stock ni ejecuta retiros. El inventario, SQLite, fotos y JSON comercial no almacenan el número de días ni dependen de permisos de avisos. Las preferencias de notificaciones son locales del dispositivo y no forman parte del JSON comercial existente.

## Límites de Android y plataformas

Sin servidor, Internet, facturación ni push. Expo Notifications Android declara RECEIVE_BOOT_COMPLETED y reprograma solicitudes guardadas al arrancar (código SDK instalado revisado). Android12+ sin autorización de alarmas exactas usa setAndAllowWhileIdle; con autorización del sistema puede usar exactas. No se solicitó un permiso sensible adicional de alarmas exactas. Ahorro de batería, force-stop, ajustes del fabricante, DND y permisos/canales pueden retrasar o impedir el aviso. 08:00 es horario solicitado en Argentina, nunca promesa de puntualidad exacta. Abrir la app reconcilia con el OS y reintenta lo futuro.

La versión web permite gestionar preferencias pero no programa notificaciones nativas. No se simulan notificaciones enviadas. El selector nativo 9.1.0 coincide con bundledNativeModules de Expo57; no se actualizaron Expo/RN/Reanimated. Esta entrega necesita Gradle nuevo con el mismo certificado.

## Verificación en curso

Pruebas automatizadas de calendario, hook de medianoche/reanudación, políticas, cancelaciones, permisos denegados, reintentos, migración manual, adaptador y navegación con mocks. Check inicial completo:414/414 pruebas, TypeScript, ESLint y build Functions pasan tras corregir dos infracciones de lint (efecto de navegación y Probe de test). Functions sólo se compila, no se despliega. Recorridos/capturas web y APK nuevo pendientes al escribir este bloque.

No hay dispositivo Android conectado: cierre/reapertura, reinicio real, permiso real, apertura desde notificación y precisión temporal deben validarse físicamente. Los mocks y el navegador no acreditan esas pruebas.

## Prueba física recomendada (sin borrar datos)

1. Exportar JSON antes de actualizar y guardarlo fuera de la app. Instalar encima, sin desinstalar ni borrar almacenamiento; verificar inventario/fotos/historial.
2. Crear un alquiler sintético con devolución mañana. Confirmar contador y abrir calendario. Cambiar tema sin perder borrador. Editar/extender fecha y comprobar contador.
3. En Avisos de retiro, elegir hora unos minutos futura, mantener los avisos necesarios y activar permiso. Ver estado Programado por solicitud; si se deniega, el alquiler persiste y el estado avisa que no están activos.
4. Cerrar normalmente y esperar. Tocar notificación con app abierta, en segundo plano y cerrada: debe abrir el alquiler. Comprobar que no cambió stock.
5. Cambiar hora general; personalizar otro alquiler y verificar que se conserva su hora. Volver a General. Extender/acortar/retirar: avisos viejos se cancelan, sin duplicados ni disparar pasados.
6. Reiniciar teléfono con un aviso futuro; esperar y registrar resultado/versiónAndroid/ajustes de batería. Forzar detención es distinto de cerrar y puede impedir avisos hasta reabrir. No eliminar datos para probar.

## Compatibilidad de registros antiguos

La lectura del almacenamiento existente permite `fechaRetiroEstimada` ausente, `null` o texto inválido. No reescribe ni normaliza el original: la UI muestra Sin fecha de retiro y permite Editar. Ningún otro campo de stock/ID/cantidad pierde validación. Crear/editar nuevos alquileres e importar estados activos siguen exigiendo fecha válida. Los snapshots inversos históricos conservan el dato original para auditoría; así el JSON de un alquiler ya reparado sigue siendo exportable/restaurable. Deshacer hacia un dato sin fecha puede rechazarse de forma segura por las reglas vigentes; no se finge reversión ni se modifica stock para forzarla. Se documenta completar fecha antes de operar en esos alquileres.

Treinta regresiones comprueban lectura sin escritura, reparación auditada y reapertura, cantidades/saldos, importación estricta y ciclo real backup→inspección→restauración del estado reparado. No se cambia el esquema SQLite ni el flujo de migración AsyncStorage→SQLite.

## Revisión y regresiones posteriores

- Los avisos automáticos se solicitan silenciosos y sin vibración propia; no heredan los controles de sonido/vibración de confirmaciones. Los manuales históricos conservan sus opciones. No se cambia un aviso silencioso a sonoro al reconciliar por haber cambiado una confirmación.
- Si falla el almacenamiento durante una extensión, el servicio intenta cancelar los avisos antiguos. La UI no presenta el snapshot anterior como confirmación actual: muestra «Programación por verificar», error y reintento. No inventa un guardado correcto.
- Con permiso denegado, los horarios ya pasados pasan a transcurridos y no quedan como reintentos pendientes imposibles.
- Un aviso abierto para un alquiler eliminado permanece visible aunque termine una reconciliación automática posterior; no se borra la explicación ni se ejecutan operaciones comerciales.
- Check actualizado: **433/433 en37archivos**, tipos/lint/Functions build correctos. Instalación limpia aislada con scripts:1565paquetes; decoder local directo/transitivo y datetimepicker9.1.0 verificados, lock original intacto. No se ejecutó npm audit fix.

## Dependencias: resultado real de auditoría

`npm audit --omit=dev --json` informó9entradas (5altas,4moderadas,0críticas), conservadas en artifacts/validacion/avisos-audit-runtime.json. No son9vulnerabilidades independientes: propagación del aviso de node-forge por ExpoCLI/certificados/Expo/peer del selector; uuid afecta ExcelJS y herramientas xcode. Las entradas se clasifican por árbol npm: eso no demuestra exposición en el APK. Node-forge está en herramientas de firma/certificados de ExpoCLI; el APK interno se firma con Gradle/apksigner. uuid requiere revisar la ruta/API de buffers indicada por su aviso. No se acreditó explotación ni ausencia total de riesgo.

El instalador propone degradar Expo a44 y el selector a8.1 para algunas cadenas; no se aplicó esa solución incompatible. Queda revisión específica de parches transitivos compatibles, separada de una actualización ciega del stack. La app opera offline; no se habilitó ningún servicio ni gasto. Este informe no equivale a certificación de seguridad.
