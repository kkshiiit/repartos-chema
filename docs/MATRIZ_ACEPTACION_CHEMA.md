# Matriz de aceptación Chema — revisión 26/10/2026

**94/94 subrequisitos trazados.** La cobertura documental no es un porcentaje de implementación. Los estados describen la base de etapa 1; una propuesta de prueba no cuenta como prueba ejecutada. El contrato íntegro está en [ESPECIFICACION_MAESTRA_CHEMA.md](ESPECIFICACION_MAESTRA_CHEMA.md); los hitos H0–H6 y archivos propuestos se explican en [PLAN_MAESTRO_CHEMA.md](PLAN_MAESTRO_CHEMA.md).

Base: main `81cd39afb97d8df6626572ce95886039fd421fd5`; rama `plan/chema-maestro-2026-10-26`. Evidencia fresca: `npm run check` 444/444 y regresión web de importación 1/1 el 26/10. Suites/capturas del 25/10 son históricas, no nuevas. APK instalado «2.0», selector/fotos/notificaciones/instalación físicos y backend nuevo no están acreditados.

En cada fila: **Comprobado** se limita al hecho descrito; **Existente** prueba presencia de código, no cobertura física completa; **Parcial** señala brecha; **Pendiente/Planificado** no significa implementado; **Bloqueado** afecta sólo a la prueba que necesita el insumo. Las guías opcionales no son funciones obligatorias a instalar.

## A — Estado y datos

|ID|Estado inicial|Archivos/evidencia actual|Prueba propuesta / criterio verificable|Evidencia faltante|Hito|
|---|---|---|---|---|---|
|A1|Comprobado en etapa 1|Git/status/log/remoto; package.json/app.json y scripts; auditoría base|Verificar diff acotado y SHA de todos los archivos originales; remoto contiene los commits documentales|Cierre SHA/remoto del último commit de esta preparación|H0|
|A2|Comprobado en etapa 1|CONTINUIDAD_CODEX, CONTINUIDAD_REDISENO, HERRAMIENTAS_UI, entrega 1.6.1; código y PNG abiertos|Contrastar instrucciones vigentes con HEAD y conservar historia sin imponer Aurora/Cobalto|Nueva captura Modern Dark sólo tras implementación|H0/H1|
|A3|Comprobado en etapa 1|Base 81cd39a; stack real en AUDITORIA_BASE_CHEMA y locks intactos|Guardar versiones efectivas y demostrar que la preparación no retrocede main ni actualiza dependencias|Revalidación de compatibilidad sólo si una dependencia futura cambia|H0|
|A4|Bloqueado sólo para certificar actualización instalada|APK conocido 1.6.1/code10/firma verificada; adb sin dispositivo|Comparar applicationId/versionName/code/certificado con APK exacto llamado 2.0; instalar encima conservando datos|APK exacto instalado o ADB autorizado; aceptación física|H0/H6|
|A5|Parcial existente; alcance inventariado|Tabla de destinos/secundarias del PLAN; app/ y src/components/|Recorrer cada destino y cada acción secundaria en ambos temas sin quitar funciones|Implementación y capturas de toda la nueva composición|H1/H5|
|A6|Regresión web y motor comprobados; Android pendiente|backupService.ts/repository.ts; check 444; import-ui 1/1 del 26/10|Seleccionar/cancelar no muta; restaurar y reabrir conserva 5 sintéticos; stock/fotos/historial recuperables|Selector Android y JSON exacto; no reabrir como fallo histórico por defecto|H0|

## B — Costo y arquitectura

|ID|Estado inicial|Archivos/evidencia actual|Prueba propuesta / criterio verificable|Evidencia faltante|Hito|
|---|---|---|---|---|---|
|B1|Existente y conservado|Expo/RN/SQLite en package.json y sqliteStorage.ts|Diff sin sustitución por web/WebView ni componentes DOM dentro del APK|Validación del nuevo código nativo de etapa 2|Todos|
|B2|Restricción respetada en preparación|LOCAL_ONLY; sin cuentas/servicios/depuración paga creados; fuentes públicas|Revisar dependencias, licencias, configuración y modalidad Free sin tarjeta/upgrade/APIs pagas|Seguimiento de cuotas reales al configurar colaboración|Todos|
|B3|Evaluado y planificado; no implementado|PLAN: Supabase Free recomendado frente a Appwrite; fuentes oficiales fechadas|Revalidar cuotas/pausa/auth/backups/salida y probar caída sin bloquear individual|Cuenta/proyecto autorizado y pruebas reales; no gratuidad ilimitada prometida|H3/H4|
|B4|Individual existente; equipo pendiente|repository.ts/sqliteStorage.ts; login local; pruebas locales|Sin cuenta ni red: crear/entregar/retirar/respaldar; equipo offline conserva outbox y distingue provisional|Recorridos de equipo y físicos después de implementar|H0/H3/H4|
|B5|Conservado; ampliaciones propuestas|engine.ts/rules.ts/repository.ts/ui.tsx; hashes base|Reusar applyOperation en cliente/servidor; justificar cada librería con licencia/API/versión; lock sin estética|Integración Edge del mismo core sin bifurcar reglas|Todos|

## C — Skills y herramientas

|ID|Estado inicial|Archivos/evidencia actual|Prueba propuesta / criterio verificable|Evidencia faltante|Hito|
|---|---|---|---|---|---|
|C1|Comprobado para herramientas pertinentes|10 skills listadas por CLI; 7 previas/3 nuevas; HERRAMIENTAS_UI y manifiesto|Abrir SKILL/referencias pertinentes desde rutas reales; distinguir catálogo Cloud de archivos locales|No se afirma recarga nativa de esta sesión ni MCP no probado|Preparación|
|C2|Comprobado: siete conservadas|Manifiesto original y hashes de 83 archivos; skills-lock.json intacto|Comparar todos los archivos previos por SHA y no instalar HeroUI por tener su guía|Repetir protección si otra sesión actualiza una skill|Preparación|
|C3|Instalada y aplicada como guía documental|impeccable@989c484; LICENSE.upstream/NOTICE; context exit0; platform:null|Verificar copia/referencias/scripts/hashes y usar Operate/Android; detector web no acredita APK|Aplicación/revisión de UI nativa en etapa 2; revisión nueva difiere del hash histórico|Preparación/H1/H5|
|C4|Instalada; PNG existentes abiertos|visual-eyes@c2ff506; scripts/docs CI/MIT; view_image en 3 PNG|Abrir antes/después reales iguales en tema/tamaño/fixture; etiquetar Chromium frente a Android|Capturas posteriores y nativas; pixel diff solo visual|Preparación/H6|
|C5|Instalada y leída como complemento|ux-designer@c869d32; SKILL/README/references/LICENSE.upstream|Comprobar procedencia/licencia/copia íntegra; aplicar mobile, notificaciones y conflictos sin imponer CRDT al stock|Revisión de los flujos implementados|Preparación/H5|
|C6|Complemento no instalado por redundancia|Expo/Callstack presentes; inventario HERRAMIENTAS_UI|Si se vuelve necesario, verificar fuente/frontmatter actual antes de instalar; no agregar pack completo|No es dependencia ni bloqueo de esta etapa|Opcional|
|C7|Referencias opcionales; no packs nuevos|Inventario local; Impeccable/Expo como sistema principal|Revisar que no se impongan tres sistemas ni uipro-cli@2.5.0; mantener dirección elegida|Sólo verificar un recurso concreto si se usa después|Opcional|
|C8|Aplicado a planificación|writing-plans; hitos pequeños, un core y pruebas significativas|Revisar que cada hito resuelva el contrato sin frameworks de proceso duplicados|TDD/depuración pertinentes al implementar, no instalar por prevención|Todos|
|C9|Comprobado para tres incorporaciones|HERRAMIENTAS_UI.preparacion_2026_10_26.json; copias completas/licencias|Verificar hashes y referencias; no sobrescribir siete previas ni modificar package/lock|Cierre de manifiesto y push de la referencia CI complementaria|Preparación|
|C10|Sin vídeo nuevo; salvaguarda definida|PLAN/evidencias identifican capturas, no audio/fluidez|Si hay vídeo nativo, conservar original/timestamp y analizar escenas; transcribir local si importa audio|Vídeo/entorno nativo disponible; ningún fallback OPENAI_API_KEY|H6|
|C11|Opciones no necesarias; no instaladas|HERRAMIENTAS_UI: no dependencia de promoción/MCP|Usar sólo patrón concreto gratuito/licenciado si hace falta y traducirlo a RN|No bloquea la aplicación ni autoriza servicios de pago|Opcional|

## D — Sistema visual

|ID|Estado inicial|Archivos/evidencia actual|Prueba propuesta / criterio verificable|Evidencia faltante|Hito|
|---|---|---|---|---|---|
|D1|Parcial: cuatro destinos, sidebar ancho incompatible|app/(tabs)/_layout.tsx usa Slot y variante >=1000|Cuatro pestañas inferiores en orden a todos los anchos; Nuevo alquiler fuera; selección con etiqueta/icono/forma|Cambio de navegación y prueba Android/Atrás/restauración de pantalla|H1/H5|
|D2|Pendiente: paleta actual Papel/Cobalto|src/theme/tokens.ts; PNG actuales|Aplicar #050505/0E0E0E/181818/F2F2F2, primaria blanca y menta pequeña; estados texto/icono|Componentes y capturas Modern Dark; no falso después|H1/H5|
|D3|Temas persistentes existentes; nueva paleta pendiente|ThemeContext.tsx/tokens.ts; tests/themes.test.ts; contraste estático en PLAN|Claro completo; alternar/sistema/persistir sin perder formularios; medir roles reales de control/texto|PNG y contraste renderizado de todos los destinos|H1/H5|
|D4|Pendiente: no hay Geist local en assets|assets/ sólo logo y WAV; fuente TTF/OFL upstream verificada|Incluir Geist/Mono TTF oficiales+OFL y cargar con expo-font existente; escala y texto ampliado|Archivos de fuente y medición de textos largos en Android|H1|
|D5|Parcial; objetivo definido sin medición dp física|ui.tsx/SmartCounter/Sheet y pantallas existentes|Medir objetivos >=48dp y primaria ~52dp, scroll del último elemento sin bloqueo|Pruebas nativas y tamaños ampliados; px Chromium no son dp|H1/H5|
|D6|Parcial; nueva composición sin aplicar|ListStructure/ui/ToolsLayout y tabla del PLAN|Comparar estructura real completa con contrato; tokens compartidos en hojas/errores/vacíos, sin paneles/loops decorativos|Capturas comparables y revisión de todas las superficies|H1/H5|
|D7|Parcial; hay textos legados|ObraForm/OperationForm/CardObra/configuracion; PLAN fija microcopy|Recorrer títulos/errores/fechas y traducir servicios; sin códigos de dominio como títulos|Revisión de copys en estados normales y fallidos|H1/H5|

## E — Alquileres y operaciones

|ID|Estado inicial|Archivos/evidencia actual|Prueba propuesta / criterio verificable|Evidencia faltante|Hito|
|---|---|---|---|---|---|
|E1|Pendiente parcial: Hoy sólo retiros|index.tsx/listPresentation.ts; filtro AMARILLO|Con fixture de entrega hoy/retiro hoy/atrasado/próximo, agrupar una vez cada alquiler y mostrar fecha/filtros|Nuevas pruebas de grupos y vista compacta|H1|
|E2|Parcial: localidad no buscada, dirección sólo hint|index.tsx query local; CardObra.tsx; Slot descarta estado|Buscar por tres campos; abrir/volver conserva consulta/filtros/scroll y dirección visible en fila|Implementación y tests de regreso/textos largos|H1|
|E3|Parcial: acciones secundarias en filtros|index.tsx exportar/combos; CardObra abre detalle|Mover documentos a Datos y combos a Depósito; toque de fila jamás entrega/retira|Acceso verificable a cada acción tras reubicarla|H1/H5|
|E4|Estados existentes por revisar|index.tsx/ui.tsx/InventoryContext|Separar vacío inicial/búsqueda/carga/error con alta/limpiar/reintentar y sin borrar datos|Capturas/pruebas de los cuatro estados con error inyectado|H1|
|E5|Detalle funcional existente; nueva jerarquía pendiente|app/obra/[id].tsx/OperationForm/LoadEditor/links|Comprobar dirección/contacto/fechas/saldo y todas las secundarias; falta teléfono permite completarlo|Revisión visual y funcional del detalle nuevo|H1/H5|
|E6|Contrato actual comprobado por código/pruebas|engine.ts: RETIRE saldo completo; REENTER cierre sin doble suma|Entregar, registrar daños/pérdidas, retirar saldo completo y reingresar; invariantes por bucket iguales antes/después|Nueva UI no introduce retiro parcial; aceptación Android pendiente|H1/H3|
|E7|Motor y persistencia protegidos; UI parcial|OperationForm/repository.ts/engine.ts; expectedVersion/opId|Revisar destinos/medidas/responsables; error conserva inputs; doble toque/timeout no duplican y éxito tras commit durable|Recorridos nuevos y servidor autoritativo compartido|H1/H3|
|E8|Tres pasos/calendario existentes|ObraForm.tsx/DateTimeFields.native.tsx/retirementCalendar|Cliente-fechas/materiales/revisión; dd/mm/aaaa, teléfono opcional permitido y retiro >=entrega prevista/efectiva|Regresión de entradas y teclado en Android|H1|
|E9|Existente con contadores/combos|LoadEditor/SmartCounter/ScaffoldSelector/engine CREATE_OBRA|Cambiar búsqueda conserva selección; enteros/medidas/combos revisables; guardar pendiente no descuenta stock|Prueba visual/nativa tras nueva composición|H1/H5|
|E10|Parcial; estado principalmente de componente|ObraForm/useState; navegación actual reemplaza rutas|Volver entre pasos conserva datos/posición; error junto al campo/foco; borrador UI separado y descarte explícito|Test de desmontaje/reapertura si se implementa borrador persistente|H1|

## F — Depósito, historial y ajustes

|ID|Estado inicial|Archivos/evidencia actual|Prueba propuesta / criterio verificable|Evidencia faltante|Hito|
|---|---|---|---|---|---|
|F1|Módulo funcional; presentación/combos por pulir|galpon.tsx/combos.tsx/engine.ts|Lista por material+medida con cuatro buckets; alta/ajuste/mover/recuperar/combo mantienen totales y auditoría|UI completa y regresión de secundarios en ambos temas|H5|
|F2|Existente; límites reales comprobados|historial.tsx/engine.undoReason; últimos inversos eliminados|Autor/5min/revisión global; sin inverso o acción posterior explica rechazo; filtros no mutan inventario|Cronología nueva y accesibilidad revisadas|H5/H3|
|F3|Parcial; ajustes y documentos reales existentes|configuracion.tsx/exportar.tsx/files.ts; LOCAL_ONLY|Separar preferencias/datos/inventario/equipo; Word/Excel/fotos reales sin nube ficticia ni botones demo|Recorridos Android compartir/generar y estado nuevo de equipo|H5/H4|

## G — Viaje

|ID|Estado inicial|Archivos/evidencia actual|Prueba propuesta / criterio verificable|Evidencia faltante|Hito|
|---|---|---|---|---|---|
|G1|Comprobado en etapa 1|mapa.tsx/trip.ts/rules.ts/listPresentation/depotSettings/InventoryContext|Verificar callers/pruebas y conservar Maps/depósito reales; no reescribir helpers ya útiles|Cambios sólo tras etapa 2|Preparación/H2|
|G2|Parcial: sólo zona, sin filtros de tarea|mapa.tsx; reglas de saldo existentes|Todas/retiros/entregas+zona; excluir finales; vacío positivo y contadores; sin carga no inventa tarea|Fixtures de saldos/cargas vacías e interfaz nueva|H2|
|G3|Pendiente: orden derivado del subconjunto filtrado|mapa.tsx move/setOrder y cambio de zona|[A,X,B,Y] filtrado A/B -> [B,X,A,Y]; volver Todas mantiene cuatro únicos; filtrar no reordena|Funciones puras/permutación y pruebas UI de ocultas|H2|
|G4|Pendiente: sortTripStops prioriza estado|src/utils/trip.ts rank anterior a distancia|Entrega cercana antes de retiro vencido lejano con un único origen; un toque y sólo visibles|Prueba específica cercanía estricta y botón/origen explícitos|H2|
|G5|Parcial: Haversine disponible|rules.ts distanceKm/coordinates; trip.ts|Sin coord al final, no cero; empates estables; sin datos no éxito; cambiar origen invalida criterio sin ordenar|Casos puros y pantalla con estados de origen|H2|
|G6|Parcial: GPS puntual sin todos los casos|mapa.tsx getCurrentPositionAsync; depotSettings.ts|Denegación/permanente/GPS apagado/timeout/baja precisión/cancelación; no fallback ni respuesta tardía aplicada|Android permisos/servicios y datos de edad/precisión reales|H2/H6|
|G7|Pendiente y decisión mínima de unidad|MaterialItem sin campo cuerpo/equivalencia; rentalSummary suma piezas|Comparar 3/6 del mismo material/medida; no dividir marcos por dos ni prometer capacidad de camioneta|Confirmación del catálogo real o rótulo literal por material|H2|
|G8|Pendiente; fallback útil definido en PLAN|PLAN sortTripByMaterial; engine saldos/transferencias|Retiro usa saldo, entrega carga; desconocidas últimas asc/desc distintas de cero; mixtas y medidas no se suman|Decisión unidad o uso del material explícito; pruebas de incidencias/traspasos|H2|
|G9|Pendiente: controles de subir/bajar actuales|mapa.tsx; Reanimated/GestureHandler ya instalados|Agarre+autoscroll sólo desde handle; posición directa/TalkBack/teclado y anuncio posición/total|Editor real, pruebas de gesto nativas y alternativa accesible|H2|
|G10|Pendiente: orden sólo useState|mapa.tsx; PLAN TripPreferencesV1 separado de stock|Abrir borrador/cancelar/guardar tras persistencia; error preserva anterior; confirmar automático y deshacer seguro|Servicio UI duradero y fallo de escritura probado|H2|
|G11|Pendiente: sin reconciliación duradera|mapa.tsx/InventoryContext|Cerrar una parada durante edición/undo/importación: quitarla, conservar restantes y añadir nuevas sin resucitar|Pruebas de revisión cambiante, reapertura y vuelta del detalle|H2/H4|
|G12|Helpers existentes; nuevo orden/filtro pendiente|trip.ts buildTripRoutes/depotDirectionsUrl; mapa.tsx|Maps recibe sólo visibles en orden, último depósito, tramos/URLs móviles; error conserva lista y no mueve stock|Regresión de enlace y apertura Android real|H2/H6|

## H — JSON y recuperación

|ID|Estado inicial|Archivos/evidencia actual|Prueba propuesta / criterio verificable|Evidencia faltante|Hito|
|---|---|---|---|---|---|
|H1|Motor preservado; regresión web fresca aprobada|BackupImport/files/backupService/repository; import-ui 1/1|Cadena elegir-leer-validar-preview-confirmar-archivar-commit-resultado; cancelar no muta|Prueba picker/URI en Android después de mejorar preview|H0|
|H2|Parcial: sólo resumen/cantidades y raw|files.pickBackup descarta nombre; BackupImport/inspectBackup|Preview con nombre si existe, versión, todos los alquileres/materiales/medidas y comparación real|Nueva metadata/preview completa; sin fake ids como nombres|H0|
|H3|Protección existente; microcopy por completar|backupService.prepareRestore/repository.restoreDemo; archivo previo/undo|Reemplazo explícito sin suma; copia automática accesible; cancelar y deshacer con garantías actuales|Verificación UI texto exacto/recuperación y fallos de exportación|H0|
|H4|Varias validaciones probadas; OS pendiente|files.ts/backupService.ts; límite 50MiB/BOM/JPEG/schema|content:// inaccesible/proveedor offline/vacío/JSON roto/versión/tamaño/fallo commit no vacían nada|Errores nativos reales sin MANAGE_EXTERNAL_STORAGE|H0/H6|
|H5|Bloqueado por archivo exacto ausente|Búsquedas en adjuntos/repo/artefactos; fixture whatsapp-five sintética|Con archivo exacto: validar 5 pedidos, importar/reabrir y comparar stock/fotos/historial; separar nativo|repartos-chema-5-pedidos-whatsapp.json exacto; no sustituir por fixture|H0/H6|
|H6|Planificado; equipo no implementado|PLAN: restore en espacio local aislado y bootstrap explícito|JSON antiguo en equipo nunca reemplaza remoto ni reenvía operaciones confirmadas; no opción de mezclar|Integración de aislamiento/namespaces y revisión UI de alcance|H4A|

## I — Fechas y avisos

|ID|Estado inicial|Archivos/evidencia actual|Prueba propuesta / criterio verificable|Evidencia faltante|Hito|
|---|---|---|---|---|---|
|I1|Existente; fechas/calendario probados en unitarias|retirementCalendar/useBusinessClock/DateTimeFields/CardObra|Hoy/mañana/atraso, cambio mes/año/día Argentina y regreso background recalculan sin guardar contador|Regresión nueva presentación y reloj Android|H1/H5|
|I2|Existente y probado en lógica/web histórica|ReminderService/FeedbackContext/RentalReminderPanel/Settings|3/2/1/0; horario general/personalizado/herencia y opt-in anterior intactos al migrar|Validación Android; namespaces personales al añadir equipo|H5|
|I3|Parcial: adaptador/scheduler disponibles, física sin probar|notification-adapter.native/reminderNavigation/reminders|Permiso negado no bloquea guardar; editar/finalizar/restaurar cancela/reconcilia; tap frío espera contexto; dedup por dispositivo|Dos teléfonos, permisos/reinicio/cierre y cambio de espacio nativos|H5/H6|
|I4|Sonidos/háptica optativos existentes|3 WAV locales/FeedbackContext/canales; APK recursos verificados|Silencio/no molestar/reducir movimiento; sin sonido por escritura remota; canal existente conserva comportamiento Android|Entrega física/ahorro batería/force-stop no acreditados|H5/H6|

## J — Colaboración

|ID|Estado inicial|Archivos/evidencia actual|Prueba propuesta / criterio verificable|Evidencia faltante|Hito|
|---|---|---|---|---|---|
|J1|Pendiente: local individual activo; team legado no prueba colaboración|AuthContext/teamService LOCAL_ONLY; PLAN memberships/spaces|Crear primer espacio autorizado, incorporar/revocar segundo; datos compartidos separados de preferencias|Backend/identidad/RLS/configuración autorizados y dos clientes reales|H3/H4A|
|J2|Pendiente; decisión personal/publicado definida|PLAN published_routes/versiones; Viaje local actual|Reordenar/filtro no publica; publicación explícita con autor; dos versiones concurrentes -> revisión, sin sobreescritura|Tabla/RPC/UI de ruta compartida e integración concurrente|H4B|
|J3|Evaluado; recomendación no implementada|Fuentes oficiales 26/10; Supabase vs Appwrite en PLAN|Free sin tarjeta/SMTP/SMS pago obligatorio; cuotas/pausas/backups/salida y fallback local comprobados|Proyecto Free autorizado, pruebas del core Edge y acceso seguro|H3|
|J4|Patrón local existe; protocolo nuevo pendiente|Repository serial/atomicSet/queue/appliedIds; PLAN command/receipt|Commit local+outbox atómico; kill/reopen; timeout tras commit consulta recibo; mismo opId+otro hash rechaza|Pruebas de servidor y dos clientes, no adapter que acepte todo|H3|
|J5|Motor local real; autoridad compartida pendiente|engine.applyOperation/rules; PLAN RPC CAS+ACL|Última unidad y versiones bajo lock; todo movimiento pasa mismo core; rechazar cantidades inválidas/LWW|SQL/Edge/RLS reales y pruebas de rollback/carrera|H3/H4A|
|J6|Pendiente: UUID individual no cubre hecho entre teléfonos|PLAN taskInstanceId/task_fulfillments + revisión|Misma devolución con UUID distintos confirma una vez; segundo conserva propuesta; UNDO crea sucesora y envío viejo no la completa|Integración crítica dos clientes/última unidad/retiro completo|H3|
|J7|Pendiente: adapter legado devuelve snapshot completo|Repository RemoteAdapter; PLAN secuencia bajo lock/cursor atómico|Pull paginado con duplicados/huecos/fuera de orden/reloj errado/cierre conserva cursor y eventos; Realtime sólo hint|Implementación cursor/watermark y recuperación real|H3/H4A|
|J8|Conflictos locales existen; política nueva pendiente|repository replayQueue primer conflicto; PLAN dependencias/uncertain|Persistir conflicto/propuesta tras reinicio; stock nunca merge/LWW; ruta y descripción revisión; uncertain consulta recibo|Pruebas de cola dependiente, edición y corrección auditada|H3/H4A/H4B|
|J9|Pendiente en backend nuevo; riesgo legado identificado|AuthContext eleva miembros ADMIN; authPersistence cabecera antes de write|RLS niega otro espacio; revocación durante commit; rol desde membership; no service_role en APK/log/Git; vault falla sin perder previo|Políticas/función/secure vault auditados y tests de cuenta aislada|H3/H4A|
|J10|Planificado; no migración aplicada|PLAN namespaces/bootstrap_batches/fingerprint/serverEpoch|Dos copias comunes -> bootstrap una vez; segundo sólo pull; restore antiguo no revive eventos; cambio usuario no reasigna outbox|Integración bootstrap/restore/desastre y recuperación verificable|H4A|
|J11|Fotos locales existen; upload equipo pendiente|photoCache.ts/.web.ts/files.ts/backupService; PLAN photo_objects|Foto falla sin bloquear alquiler; acceso privado por espacio; retry por hash/ID; backup incluye bytes; limpieza respeta undo|Storage privado/reglas/cuotas y dos clientes con fotos sintéticas|H4B|
|J12|Individual offline existente; estado compartido propuesto|PLAN confirmado/provisional y fallback de cuotas|Dos teléfonos offline pueden proponer; sólo servidor confirma disponibilidad; caída/pausa no bloquean individual|Pruebas de desconexión/pausa/cuota; nada de sync cerrada garantizada|H3/H4A|
|J13|Textos/estados definidos; UI nueva pendiente|PLAN command/receipt y estados inline; conflictos legados|Pendiente/error/conflicto/última sync sobreviven cierre; confirmado sólo con recibo; no popup rutinario ni duplicado|Recorridos con fallos reales y revisión UX de estados|H3/H4A/H5|

## K — Accesibilidad y rendimiento

|ID|Estado inicial|Archivos/evidencia actual|Prueba propuesta / criterio verificable|Evidencia faltante|Hito|
|---|---|---|---|---|---|
|K1|Animaciones actuales distintas del objetivo|ui.Sheet Animated/PanResponder; Reanimated/GH disponibles|Presión/hoja/pasos breves sin demorar persistencia ni doble toque; mover parada mantiene continuidad|Medición release nativa y vídeo cuando haya dispositivo|H1/H2/H5|
|K2|Guías existentes; cumplimiento completo sin validar|Theme/Feedback/ui; PLAN sin blur/loops|Reducir movimiento elimina transformaciones no necesarias; lector funciona; listas no animan altura/blur continuo|Pruebas Android Remove animations y perfilado si se reproduce jank|H1/H5/H6|
|K3|Parcial: labels/hints existentes, no suficiente|Componentes y formularios; dirección hint no visible|TalkBack/foco/retorno/selected/Atrás/IME/safearea y alternativa al drag; labels no placeholders|Prueba nativa y teclado/lector en recorridos completos|H1/H2/H5/H6|
|K4|Layouts/capturas web históricos; nuevo tema pendiente|artifacts/capturas, tests/ui; PLAN contraste estático|320/360/390/412 y ampliación de texto; nombres largos/errores/listas; medir contraste real y problema reproducido|Capturas posteriores y medidas nativas; no FPS/RAM inventados|H1/H2/H5/H6|

## L — Pruebas

|ID|Estado inicial|Archivos/evidencia actual|Prueba propuesta / criterio verificable|Evidencia faltante|Hito|
|---|---|---|---|---|---|
|L1|Check fresco 444/444; no pruebas nuevas de producto|check-2026-10-26.txt: typecheck/lint/test/functions; 0 errores/1 warning lint|Cada cambio futuro tiene regresión pertinente y suite; justificar contrato antes de cambiar expectativas|Suite de la implementación futura; no se considera ya probada|Todos/H6|
|L2|Motor existente probado; nuevas UX pendientes|tests/domain.test.ts, repository.test.ts, backup.test.ts, fecha-entrega-integridad.test.ts y tests/ui/operations.spec.ts|Dirección/Hoy/volver/borrador/fechas/alta/daños/responsables/doble toque/fallo/RETIRE/REENTER y fotos íntegros|Pruebas de la nueva UI/servidor y operaciones físicas|H1/H3/H5|
|L3|Cobertura actual parcial; contrato nuevo pendiente|tests/trip.test.ts/tests/ui/trip.spec.ts y PLAN H2|Ejecutar tabla G2-G12: filtros ocultas/GPS/3-6/desconocidas/drag/guardar/Maps sin un solo movimiento comercial|Funciones/editor implementados y Android GPS/drag/Maps|H2/H6|
|L4|Web import 1/1 fresco; varias unitarias verdes|import-ui-2026-10-26.json; tests/import*.test.ts/backup*.test.ts|JSON exacto si disponible, cancelar/URI/versiones/límite/commit/reinicio; modo equipo aislado|Exacto H5, selector Android e integración equipo|H0/H4A/H6|
|L5|Lógica existente probada; OS pendiente|tests/feedback-context/local-feedback-web y scheduler|3/2/1/0, fecha/día, herencia/propio, permiso, restore, tap y dedup en cada dispositivo|Entrega local nativa/cierre/reinicio no se deriva de timers|H5/H6|
|L6|Pendiente: no backend compartido nuevo|PLAN H3/H4A/H4B pruebas de servidor|Dos clientes: devolución/última unidad/timeout/outbox/reloj/revocar/foto/cuota/restore y copia común|Servidor local con transacciones/RLS reales y piloto remoto Free autorizado|H3/H4/H6|
|L7|Separación actual documentada|BASE_VERIFICADA y AUDITORIA_BASE; check26 vs UI57/57 del25|Guardar comando/commit/entorno/resultado para cada ejecución; no contar histórico/cache como fresco|Evidencias de etapa 2 por categoría y pendientes físicos|Todos|
|L8|Tres PNG históricos abiertos; no después nuevo|PNG web existentes citados en AUDITORIA_BASE|Capturar y mirar todos los destinos/ventanas claros-oscuros y offline/error/conflicto con fixture igual; vídeo sólo si nativo|Nuevas capturas tras implementar; restaurar preferencias de prueba|H1/H2/H5/H6|

## M — Respaldo y entrega

|ID|Estado inicial|Archivos/evidencia actual|Prueba propuesta / criterio verificable|Evidencia faltante|Hito|
|---|---|---|---|---|---|
|M1|Preparación respaldada por bloques; cierre en curso|Rama plan/chema-maestro-2026-10-26; commits 3af1c2c/80f0126|Diff sólo documentos/skills/evidencia; push por hito y checkpoint con próximo paso; sin secretos/keystore/db|Último commit de etapa 1 y verificación remota|Todos|
|M2|APK anterior comprobado; nueva compilación no autorizada aquí|APK1.6.1/code10 firma/ABI/CRC/SHA; scripts Gradle existentes|Después de etapa 2: misma firma/package, código creciente pertinente; update encima conserva datos|APK instalado 2.0 exacto y build/instalación futura; no APK por documentación|H0/H6|
|M3|Anterior publicado y conservado; distribución privada diagnosticada|Rama descargas/android/v1.6.1-local.1; API auth encuentra bytes; anon404|Archivo futuro nuevo con ruta inequívoca; previos idénticos; descargar autenticado y comparar SHA|Nueva publicación sólo tras código/build verificados; descarga Android del usuario pendiente|H6|
|M4|Trazabilidad anterior existe; release futuro pendiente|BASE_VERIFICADA y entrega1.6.1 fuente f9f018d/firma/SHA|Registrar source/publicación/versiones/bytes/certificado y entorno; bloqueo explícito si falta compatibilidad|Evidencia futura local+equipo; APK intermedio no cierra sync|H6|
|M5|Matriz y autoauditoría de plan preparadas; producto pendiente|Este archivo + AUTOAUDITORIA_PLAN_CHEMA; 94 requisitos|Revisar diff/UX finales y repetir checks afectados; matriz final implementación-evidencia-veredicto sin 100% ficticio|Cierre de implementación, integración, visual y físico según acceso|H6|

## Entregables de esta etapa, separados de la aceptación del producto

|Paso del encargo|Documento / resultado|Cierre requerido|
|---|---|---|
|1|ESPECIFICACION_MAESTRA_CHEMA.md, contrato íntegro|SHA del original y copia byte por byte|
|2|AUDITORIA_BASE_CHEMA.md|Base, reglas, herramientas, comprobaciones y límites reales|
|3|PLAN_MAESTRO_CHEMA.md|Arquitectura, flujo, UX, costo, proveedor y decisiones mínimas|
|4|H0/H1/H2/H3/H4A/H4B/H5/H6|Orden y dependencias ejecutables sin dos motores|
|5|Cada hito con archivos/pruebas/riesgo/reversión/respaldo|Individual sigue utilizable durante el piloto|
|6|MATRIZ_ACEPTACION_CHEMA.md|94 IDs únicos y ninguno omitido|
|7|AUTOAUDITORIA_PLAN_CHEMA.md|Contradicciones/gates y recomendaciones resueltas en el plan|
|8|Commits/push de documentos y skills, checkpoint actualizado|No implementar hasta el archivo 02; plan principal también en texto de entrega|
