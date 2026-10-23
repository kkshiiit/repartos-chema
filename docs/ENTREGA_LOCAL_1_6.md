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

Gradle completo en curso al escribir esta sección. No se presenta como APK verificado hasta que exista el reporte android-1.6.0-apk.json y la publicación recuperada por hash. El cierre posterior actualiza esta sección y docs/CONTINUIDAD_CODEX.md.

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
