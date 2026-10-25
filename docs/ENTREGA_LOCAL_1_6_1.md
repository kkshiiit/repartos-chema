# Entrega individual Android 1.6.1 — Repartos Chema

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

## Alcance y cambios

Edición gratuita, individual, local/offline. Inicio vacío, sin borrar bases existentes; SQLite, fotos locales y copias JSON conservados. Se mantienen cuatro pestañas, diseño Papel/Cobalto, temas Claro/Oscuro/Sistema, cuenta local por nombre, inventario, historial, recuperación, viaje, documentos y avisos locales. No hay publicidad ni backend obligatorio, Firebase productivo, EAS, hosting o facturación activados.

1. **Integridad de entrega anticipada:** rechaza retiro anterior a la fecha de entrega planificada antes de mover cantidades. La fecha efectiva sigue separada. Dos regresiones verifican rechazo sin persistir y copia/restauración/reapertura válida con fechas coherentes. Archivo `src/domain/engine.ts`; prueba `tests/fecha-entrega-integridad.test.ts`. No modifica fechas automáticamente.
2. **Parche de validación:** Zod exacto 4.6.6 en aplicación y Functions heredado, con locks coherentes. Una carga que excede el máximo de100 componentes se rechaza antes de validar cada elemento. Prueba `tests/zod-limits.test.ts`. Se conserva decoder0.5.0 local CommonJS y su override.
3. **Remito legacy:** fecha de retiro ausente/inválida muestra «Sin fecha de retiro». Cinco casos, sin modificar el alquiler. `src/utils/whatsapp.ts`, `tests/whatsapp-legacy.test.ts`.
4. **Manual vigente:** corrige la descripción de los avisos: general opcional08:00/3/2/1/0, herencia, personalización y manuales migrados. `docs/USO_LOCAL_ANDROID.md`.
5. **Auditoría y continuidad:** informe completo guardado y respaldado desde1ef9be4; checkpoint persistente, perfiles QA/seguridad/arquitectura/entrega aplicados a revisión real. Los282 perfiles no se ejecutan todos ni significan una automatización permanente.

## Pruebas actuales y resultados

| Comando/acción | Resultado real | Evidencia |
|---|---|---|
| npm run check |444/444,40archivos; tipos/Functions correctos; lint0errores/1advertencia | cierre-2026-10-25-check.txt |
| npm ci aislado, scripts habilitados |1565paquetes; Zod4.6.6/decoder/transitivo/lock correctos | cierre-2026-10-25-npm-ci-final.txt |
| npm run build:web |exportación local correcta,6fragmentosJS; principal5.5MB reportado por Expo | cierre-2026-10-25-web.txt |
| CHEMA_TEST_LOCAL=true npx playwright test --workers=1 --reporter=list,json |57/57,0omitidas,0fallidas,4.8min | cierre-2026-10-25-ui.txt/json |
| Capturas y comparaciones |348actuales/19tableros;8Axe0violaciones/0incompletas | cierre-2026-10-25-capturas.json y GALERIA_AVISOS_1_6.md |
| Gradle assembleRelease ARM64 |BUILD SUCCESSFUL9min12s,701tareas | cierre-2026-10-25-android.txt |
| Firma/metadatos/CRC/recursos |correctos, certificado anterior, SQLite y3WAV por hash | android-1.6.1-*.json/txt |
| Publicación y recuperación independiente |SHA/firma/CRC correctos,8APKprevios intactos | cierre-2026-10-25-descarga-remota.json |
| Fuente ZIP antes de Gradle |1594hashes correctos al extraer y recuperarGit | cierre-2026-10-25-respaldo-remoto-previo.json |
| Firebase Emulator/producción, iOS, teléfono/emulador |no ejecutados/no disponibles; no necesarios para local | límites explícitos |

Intentos fallidos conservados: verificador con nombre index.js incorrecto; instalación concurrente señal9/Chromium crashed por memoria; expectativa ISO en campoDD/MM; navegación anticipada del test de cambio de nombre. Se corrigieron las comprobaciones y se repitieron hasta resultados finales reales, sin modificar el dominio para acomodar las pruebas. Cgroup8GiB: no ejecutar tareas pesadas juntas. Gradle informa APIs obsoletas para una futura versión10; no impidió el build9.3.1 ni justifica actualizar nativos sin comprobar compatibilidad.

## Seguridad y límites de uso

La auditoría integral detalla21entradas raíz/10Functions heredado; los nuevos avisos analizados son herramientas dev bajoFirebaseCLI, sin caminoAPK identificado. No se declara0vulnerabilidades. No se activaron servidores/productos cloud. Copias JSON/comerciales deben guardarse en privado; su tamaño máximo50MB no garantiza consumo de RAM acotado. La clave de firma está fuera de Git y necesita custodia privada externa; no compartirla con el código.

APK no declara alarmas exactas. Android puede retrasar avisos por permisos, batería, fabricante o force-stop. No hay pruebas físicas de instalación/migración/SQLite/permisos/cámara/Compartir/TalkBack/reinicio/consumo. No hay PDF automático ni sincronización entre teléfonos.

## Instalación y pruebas desde Android

1. Antes de actualizar: Ajustes → Copias y restauración → Descargar copia. Guardar JSON fuera de la app y comprobar su archivo, preferiblemente en Descargas/RepartosChema.
2. Descargar el APK versionado con sesión GitHub de `kkshiiit`. Instalar **encima**, sin desinstalar ni borrar datos. Si Android rechaza la actualización, conservar mensaje y app actual: no reemplazar certificado ni borrar almacenamiento.
3. Abrir y comprobar cantidades de depósito/alquilados/a reparar/perdidos, alquileres, responsables, historial y fotos anteriores. Revisar fechas y temas.
4. Activar modo avión, cerrar normalmente y reabrir. Registrar un cambio controlado y verificar que persiste. No usar Empezar vacío sobre inventario de trabajo para una prueba.
5. Probar un alquiler con entrega planificada futura: un retiro anterior debe mostrar error dentro del panel y conservar valores/stock; corregir la fecha y confirmar una sola vez. Guardar otro JSON y revisar que se puede seleccionar y validar sin confirmar una restauración innecesaria.
6. Programar un aviso a unos minutos futuros, conceder permiso y comprobar estado real. Probar app abierta/segundo plano/cierre/reinicio y tocarlo; debe abrir el alquiler sin cambiar cantidades. Probar horario general, personalizado, vuelta a General y cancelación al retirar.
7. Generar Word/Excel y abrir/compartir con lector instalado; cámara/galería; GPS y Volver al depósito. Mapas/WhatsApp dependen de sus aplicaciones y conectividad/mapas descargados.

Una instalación nueva inicia vacía. Si se actualiza una base antigua, no se restablece automáticamente: se conserva y valida la migración existente. Ante un error de lectura o espacio, conservar original y mensaje, no desinstalar.

## Desarrollo reproducible

```bash
npm ci
npm --prefix functions ci
npm run check
npm run build:web
npm run preview
CHEMA_TEST_LOCAL=true npm run test:ui -- --workers=1
```

No se necesita `.env` para el uso individual; `.env.example` no contiene secretos. Para Android usar JDK21, SDK/build-tools36, NDK27.1.12297006 y clave anterior mediante `CHEMA_ANDROID_KEYSTORE`; detalles en [ANDROID.md](ANDROID.md). No incluir la clave en respaldos compartidos. No se pide al usuario ejecutar estos comandos desde el celular.

## Instalador, fuentes y commits

- APK: [repartos-chema-local-1.6.1-arm64.apk](https://github.com/kkshiiit/repartos-chema/raw/refs/heads/descargas/android/v1.6.1-local.1/repartos-chema-local-1.6.1-arm64.apk); SHA256 `03e42657ad62d9c39ddd3cc2060a8ebd1d11d861fd78c0da46bda2f311c578f1`. Publicación `293e748c162a5518a02b9f91330779064beed6f5` y recuperación independiente comprobadas.
- Fuente funcional `f9f018d3d33d6d474babcc669b1144412802ad28`; ZIP previo a Gradle publicado815cafeddd9e2d380058866650ecf490e011f143, SHA256 d7eecffe67effa7d5c93f684a4afe8c01253935d673ef33011658ae4a9ce4fb5. Se conserva junto a fuente de cierre y manifiestos en [respaldos1.6.1](https://github.com/kkshiiit/repartos-chema/tree/descargas/respaldos/v1.6.1-local).
- Main:1ef9be4(guardafechas/Zod/auditoría), acdb43f(remito/manual),663b3ce(instalación/seguridad/test),f9f018d(57recorridos/capturas y fuente delAPK),2c1c3e2(respaldo remoto/puntoGradle). Commits posteriores son cierre documental/evidencia, sin cambiar código delAPK.
- [Auditoría completa](AUDITORIA_MAESTRA_ACTUAL.md), [checkpoint](CONTINUIDAD_CODEX.md), [manual](USO_LOCAL_ANDROID.md), [capturas](GALERIA_AVISOS_1_6.md). Las versiones anteriores se preservan; no forzar reinstalación ni borrar almacenamiento.

## Estado por categoría

Completado y comprobado: dominio/pruebas unitarias, recorridosweb, capturas/contraste automatizado, instalación de dependencias, exportaciónweb, GradleAPK/firma/integridad/publicación/recuperación, código y copiasSHA. Implementado pero pendiente de validación física: APIsAndroid, migración e instalación sobre datos reales, avisos/reinicio, cámara/selector/Compartir/TalkBack y rendimiento del teléfono. Bloqueo externo de esa validación: no hay dispositivo conectado; debe realizarla el usuario. Pendiente: mantenimiento de herramientas/transitivos y custodia privada externa de firma. No hay un bloqueo de facturación o credenciales para utilizar la edición individual.
