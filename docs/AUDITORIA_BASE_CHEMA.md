# Auditoría base Chema — revisión 26/10/2026

## Alcance y base comprobada

Etapa1 del [contrato completo](ESPECIFICACION_MAESTRA_CHEMA.md): analizar y planificar, sin implementar. Rama `plan/chema-maestro-2026-10-26`, creada desde main 81cd39afb97d8df6626572ce95886039fd421fd5 después de fetch; remoto kkshiiit/repartos-chema PRIVATE, permiso ADMIN observado mediante gh. Árbol limpio al comenzar; no AGENTS.md aplicable en /, /workspace, repo ni subdirectorios inspeccionados. Encargo original guardado íntegro y respaldado 3af1c2c; hash del adjunto fb484a28c27dfbd0afd4f333b207f19dee738b7d1b72b7a926ef5bb96837c0f7. Preparación documental y evidencia 80f0126. Consultar gitlog para siguientes commits, no inferir HEAD de una auditoría anterior.

Leídos continuidad vigente, CONTINUIDAD_REDISENO (histórico1.1), HERRAMIENTAS_UI (histórico1.3), auditoría maestra/entrega1.6.1, configuración, repositorio y callers relevantes. Las prohibiciones antiguas de volver a rediseñar NO anulan la nueva dirección Modern Dark. Se conserva su evidencia, no se reactiva Firebase. No hay PRODUCT.md/DESIGN.md actual: el encargo nuevo es la autoridad, no una historia de estilo ya descartada.

## Instalado, publicado y desconocido

|Objeto|Estado verificable|
|---|---|
|Fuente|package.json/app.json1.6.1, versionCode 10, aplicación com.grupochema.repartos|
|APK conocido|56 176 031 bytes, ARM64/minSDK 24, SHA256 03e42657ad62d9c39ddd3cc2060a8ebd1d11d861fd78c0da46bda2f311c578f1; firma v2 verificada nuevamente en esta etapa|
|Certificado conocido|fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c; clave privada fuera de Git, no copiada|
|Publicado|descargas/bddaf75; APK1.6.1 en android/v1.6.1-local.1; fuente funcional f9f018d y fuente cierre f6648de; ochoAPKprevios preservados según recibos existentes|
|Instalada «2.0»|NO IDENTIFICADA. No hay APK exacto ni ADB conectado. No equiparar nombre de usuario a versionName/código/certificado de1.6.1|
|Descarga reportada fallida|Sin sesión, ficha/raw responden404; API autenticada confirma archivo56 176 031 bytes. Es repositorio privado. No se ha comprobado la descarga en Android del usuario; abrir ficha en Chrome con cuenta autorizada. No cambiar privacidad ni publicar una copia pública por iniciativa propia|

Ningún APK se recompiló en etapa 1. Antes de una actualización futura: obtener APK exacto instalado o paquete desde ADB autorizado, verificar applicationId/versionName/versionCode/firma; elegir código superior a las versiones pertinentes, sin reemplazar certificado. Si no coinciden, bloquear sólo la entrega de actualización; continuar tareas independientes. Nunca pedir desinstalar.

## Stack y organización real

Expo 57.0.30, React Native 0.86.3, React 19.2.3, TypeScript 6.0.3, Expo Router 57.0.28. FlashList 2.0.2, Reanimated 4.5.1/Worklets 0.10.1/Gesture Handler 2.32, Lucide 1.54, Zod 4.6.6, AsyncStorage 2.2, Expo SQLite 57.0.4, DateTimePicker 9.1.0, SecureStore, Location, Notifications, Audio, FileSystem/DocumentPicker/Sharing. ExcelJS 4.4/docx 9.9; Vitest 5.0.3, Playwright 1.64, ESLint 9.39.5. Versiones efectivas y locks sin modificar. Firebase 13 y Functions históricos siguen declarados, pero LOCAL_ONLY/dataMode demo evita nube en la edición publicada. No Supabase/Appwrite SDK instalado.

```text
app/_layout.tsx                   proveedores/sesión/stack
app/(auth)/login.tsx              ingreso local y bienvenida
app/(tabs)/_layout.tsx            navegación4destinos, variante lateral>=1000
app/(tabs)/index.tsx              alquileres/búsqueda/filtros
app/(tabs)/galpon.tsx             depósito/materiales
app/(tabs)/mapa.tsx               viaje y paradas
app/(tabs)/historial.tsx          cronología y filtros
app/obra/{nueva,editar,[id]}.tsx   alta/edición/detalle
app/{configuracion,combos,exportar}.tsx
src/components/{ui,CardObra,ObraForm,OperationForm,LoadEditor,BackupImport,...}.tsx
src/context/{Auth,Inventory,Theme,Feedback}Context.tsx
src/domain/{engine,rules,schema,team}.ts
src/data/{repository,validation,sqliteStorage,nativeInventoryStorage,migrateLocalStorage,...}.ts
src/services/{files,backupService,photoCache,teamService,firebase,depotSettings,...}.ts
src/services/feedback/{reminders,notification-adapter.native,reminderNavigation}.ts
src/utils/{trip,listPresentation,retirementCalendar,whatsapp,...}.ts
src/theme/tokens.ts
functions/src/                   generadores locales y backend Firebase histórico
scripts/{package,package-web,verify-android}.py + build-android-demo.mjs
```

## Mapa funcional y reglas que se conservan

|Función|Implementación y límites|
|---|---|
|Alta/edición|ObraForm tres pasos; CREATE_OBRA/UPDATE_OBRA/SET_LOAD; alta pendiente no descuenta stock; expectedVersion protege edición|
|Operaciones|OperationForm→InventoryContext.dispatch→Repository.dispatch→applyOperation; DELIVER, RETIRE, REENTER, REACTIVATE, REPORT, RECOVER, CORRECT_INCIDENT, TRANSFER|
|Stock|enteros no negativos, cuatro buckets, origen/motivo, medidas compatibles, transacciones SQLite, reversión/idempotencia; retiro procesa saldo completo con incidencias; REENTER sólo cierra estado sin devolver dos veces|
|Historial|ActivityLog con movimientos/autor/fecha; undoReason sólo autor,≤300000 ms y revisión global compatible. El motor elimina inversos anteriores al registrar otra acción; NO hay deshacer ilimitado/perentidad|
|Local|SqliteStorage tabla chema_kv, WAL/synchronous FULL; withExclusiveTransactionAsync/atomicSet. JSON Envelope contiene confirmado+estado+cola; migración conserva original AsyncStorage y no reinicia datos ante corrupción|
|JSON|pickBackup→inspectBackup→prepareRestore→restoreDemo; límite50 MiB/BOM/JPEG/fotos/referencias/esquema; archiva antes, rollback/recuperación; seleccionar/cancelar no escribe. Reemplaza, no combina|
|Fotos/documentos|photoCache.ts nativo y photoCache.web.ts; files.ts usaExpoFileSystem en la rama nativa (NO existe files.native.ts). JPEG compresión/permisos/refsretenidas; Word/Excel locales desde generadores; APIsfísicas pendientes|
|Avisos|Un ReminderService, FEEDBACK_KEYchema:local-feedback:v1 con estado v2; general opt-in 08:00 / 3-2-1-0, herencia/personalización, manuales migrados, futuros/cancelación/retry, tap seguro; fechas Argentina y reloj/resume|
|Viaje|sortTripStops,buildTripRoutes,depotDirectionsUrl enutils/trip.ts; loadDepot/saveDepot enservices/depotSettings.ts; GPSsolicitudpuntual, Mapsen tramos móviles+depósito, sin algoritmo de conducción|
|Sesión|Nombre local identifica, no autentica persona. AuthContext.apply asignaADMIN en el legado; no reutilizarlo como autorización de equipo. Firebase/equipo previo no está desplegado ni es el backend nuevo|

## Hallazgos por impacto contra el contrato nuevo

|ID/impacto|Hallazgo comprobado y evidencia|Corrección propuesta / hito|
|---|---|---|
|P1-Datos|No hay backend activo no Firebase, membresía/RLS ni protocolo nuevo; RemoteAdapter actual fetch/commit y colaPENDING/CONFLICT no cubren cursor/recibos/tarea comercial|H3/H4; no presentar colaboración como existente|
|P1-Viaje|mapa.tsx order sólo useState; move usa exclusivamente works filtradas, setZone y GPS hacen setOrder([]); no persistencia/borrador/cancelación ni filtro entrega/retiro|H2: secuencia completa de elegibles y preferencias separadas, permutación de posiciones visibles|
|P1-Cercanía|sortTripStops compara rank antes de distancia; origen nuevo ordena automáticamente y resetea manual; no timeout/cancelación/edad/precisión robustos deGPS|H2: botón explícito desde único origen, distancias ascendentes, desconocidas al final, permiso contextual|
|P1-Cantidad|rentalSummary suma piezas de todos los materiales, no cuerpos; no equivalencia universal en MaterialItem. La fixture «Cuerpo» es sintética y no acredita catálogo real|Decisión negocio mínima + base material/medida explícita H2; nunca marcos/2|
|P1-Alquileres|CardObra muestra localidad, pero dirección está sólo en accessibilityHint. Búsqueda index.tsx concatena cliente+dirección, no localidad|H1: dirección visible y búsqueda ampliada|
|P1-Hoy|segmentoHoy=AMARILLO; agrupa retiros y omite entregas previstas hoy|H1: filtro de tareas de fecha civil, sin duplicados|
|P1-Navegación|tabsLayout usaSlot/router.replace, barra lateral>=1000; query/filters sonuseState locales, no prueba específica de conservar scroll al desmontar|H1: cuatro pestañas inferiores siempre, estado de consulta y offset explícito; regresión volver desde detalle|
|P1-Diseño|Tokens Papel/Cobalto y fuente de sistema Georgia/serif; NO hay fuentes Geist niassets/fonts. No afirmar tipografía embebida por un informe anterior|H1: Modern Dark/claro/Geist oficial TTF con OFL; restoH5|
|P1-Authfutura|AuthContext y sesiónFirebase legados no representan rol confiable del nuevo espacio; authPersistence.native borra cabecera antes de escribir chunks|H3: roles desde backend y vault generacional; riesgo de reutilización, no pérdida demostrada de sesión activa individual|
|P2-ImportaciónUX|BackupImport selection sólo raw/counts; pickBackup devuelve string y descarta asset.name; no listado completo todos los alquileres/materiales enpreview|H0 conserva validación/motor, amplíaDTO/vista y estados; no rediagnosticar fallo histórico como actual|
|P2-Ubicaciónacciones|exportar/combos se ofrecen dentro de filtros de alquileres (index.tsx149/157), ajustes duplican acceso|H1/H5: documentos en Datos/Ajustes y combos en Depósito; inventario de destinos enPlan|
|P2-Gesto/volumen|Viaje works.map en View ySheet usa PanResponder/Animated; no GestureHandlerRootView en root. No hay FPS físico medido|H2/H5: virtualización y gesto con Reanimated/GH existentes, alternativa directa ylector de pantalla|
|P2-Evidencia|APK instalado 2.0 y JSON exacto faltan. Sin ADB, no selectorAndroid/IME/TalkBack/gestos/cierre/reinicio reales|H0/H6: solicitar únicamente archivos exactos necesarios; seguir trabajo independiente|
|P2-Mantenimiento|audit 25/10:21 entradas raíz/10 Functions histórico, no audit actual repetido hoy; dependencias dev y límites de JSON documentados|H6 revisióncompatible separada, no audit fix --force ni0 riesgos ficticios|

No se afirma pérdida real de filtros al volver sin un caso reproducido: el riesgo surge de Slot/replace y falta de contrato/recuperación explícitos. Tampoco se atribuye jank a PanResponder sin medirlo. La interfaz sí es ReactNative, no un WebView; el cambio exige composición completa y accesibilidad, no reemplazo del framework.

## Evidencia y pruebas de esta etapa

`npm run check`: exit 0,444/444 en 40 archivos,9.37 s Vitest; tipos/Functions build correctos, lint 0 errores/1 advertencia Axe. La compilaciónFunctions es análisis estático, no despliegue. Sus fixtures Word/Excel se copiaron antes y restauraron byte por byte después. `CHEMA_TEST_LOCAL=true npx playwright test tests/ui/import-json.spec.ts --workers=1 --reporter=list,json`:1/1,5.6s, seleccionar/JSONroto/cancelar/confirmar 5 sintéticos/reabrir/deshacer. No modificó inventario de usuario ni fuentes. Registros en [evidencias-etapa 1](evidencias-etapa 1/).

La prueba usa tests/fixtures/whatsapp-five.json, explícitamente sintético; no se encontró `repartos-chema-5-pedidos-whatsapp.json` exacto entre adjuntos/repo/artefactos. No dar H5 por probado. No se copian datos comerciales/fotos reales aGit para investigarlo.

57/57 UI general,348 capturas/19 comparativas,8 Axe yGradle9m 12s son resultados del 25/10 sobre código funcional f9f018d, idéntico al código aplicativo 81cd. No se contaron como ejecuciones nuevas. Se abrieron ahora imágenes reales guardadas en Git principal claro, viaje oscuro y panel avisos oscuro; son Chromium/sintéticas, no la instalación2.0. Evidencian dirección ausente en filas, filtro/jerarquía de Viaje ypaleta actual. No se fabricó un «después»Modern Dark ni se juzgaron animaciones desdePNG.

`adb devices -l`:vacío. APK conocido: firma validada nuevamente; no instalación ni migración física. No se compilaron Android/web nuevos ni se desplegóbackend. Sin cuenta Supabase/Appwrite creada. CLI de skills lista 10; motorcontextoImpeccable0 pero platform:null/PRODUCT ausente, lectura Android manual. No se usódetect web como certificación.

## Protecciones y herramientas

[Especificación](ESPECIFICACION_MAESTRA_CHEMA.md) es autoridad nueva. Las 7 skills antiguas y 282 perfiles se conservan; se suman 3 skills documentales completas ylicencias en .agents/skills. Uso ycommits/HASH en HERRAMIENTAS_UI.md ysu manifiesto. Figma/MotionSites/Context7/Video no son requisitos ni se fingió conexión/uso. No se invocóAPI de IA, SMS, EAS, hosting, Firebase o plan pago. Toda consulta de precios fue HTTP pública a fuentes oficiales. GitHub CLI autorizado para repo, sin tokens en salida. No se pidieron contraseñas ni se eligióotra cuenta.

Los hashes de todos los archivos rastreados al comienzo coincidían después de check/import/instalar skills; los únicos cambios posteriores permitidos son documentos/skills/evidencias. Se vuelve a verificar al cerrar etapa 1. La firma, JSON,SQLite,fotos,package/lock y código no cambian. Custodia externa de clave privada no confirmada; no incluirla en ZIP Git.
