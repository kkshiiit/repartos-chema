# Plan maestro Chema — etapa 2 propuesta, revisión 26/10/2026

> Para quien implemente: leer primero la especificación y el checkpoint. Usar `superpowers:executing-plans` para ejecutar hitos con pruebas y commits. Este documento NO autoriza implementarlos: el usuario revisa etapa1 y envía `02-Codex-implementar-y-entregar-Chema.txt`. No abrir entrevistas de estilo, imponer otro framework ni delegar programación al usuario.

**Objetivo:** terminar una app Android nativa, individual/offline y opcionalmente compartida entre jefe y operario, con UI Modern Dark completa, Viaje organizado sin efectos comerciales y sincronización transaccional sin Firebase ni servicios pagos obligatorios.

**Arquitectura:** conservar React Native/Expo, SQLite y un único motor puro `applyOperation`. Añadir preferencias de Viaje separadas del inventario y un protocolo compartido por operaciones/recibos, con validación autoritativa y membresía real. Mantener aislado el espacio individual mientras se valida el equipo. El backend recomendado se presenta para revisión; no está creado ni implementado.

**Stack comprobado:** Expo57.0.30, RN0.86.3, React19.2.3, TypeScript6.0.3, Router, SQLite, Reanimated4.5.1/Worklets0.10.1/GestureHandler2.32, FlashList2, Lucide y Zod4.6.6. No se actualizan por estética. **Especificación:** [ESPECIFICACION_MAESTRA_CHEMA.md](ESPECIFICACION_MAESTRA_CHEMA.md). **Base:** main81cd39a; rama documental `plan/chema-maestro-2026-10-26`.

## Restricciones globales

- Costo objetivo $0: no tarjeta, trial con cobro posterior, Firebase, EAS pago, SMS ni API de IA. No prometer cuotas gratuitas ilimitadas o permanentes. No se crean cuentas/proyectos ni servicios en etapa1.
- Cuatro pestañas inferiores, exactamente Alquileres / Depósito / Viaje / Historial, incluso en ancho grande; sin sidebar, quinta pestaña o módulo de cobros.
- Individual funciona sin cuenta/red; colaborar exige identidad real y conexión inicial, luego caché/outbox local duraderas. Mapas externos no organizan ni alteran stock.
- Inventario, historial, fotos, JSON, medidas y firma se conservan. RETIRE es retiro completo según el motor, REENTER no devuelve dos veces. Ningún ordenamiento, aviso o gesto ejecuta un movimiento.
- No hay equivalencia universal de marcos a cuerpos. No dividir por dos ni sumar medidas/accesorios distintos. La cantidad comparable se identifica por material y medida.
- Datos compartidos no usan last-write-wins en stock; una respuesta incierta se consulta por ID antes de reintentar o permitir descartar.
- Un APK conocido1.6.1 no identifica la instalada que el usuario llama2.0. Su APK exacto/firma/código son condición de una actualización compatible, no de seguir el trabajo independiente.

## Foco de revisión: cinco fallos que deben tener una prueba propia

1. Misma devolución con UUID diferente en dos celulares: una única transición/stock; la segunda propuesta no se presenta como nueva devolución exitosa. H3.
2. Deshacer entrega/retiro y volver a hacerlo legítimamente: se crea una nueva instancia de tarea; un envío viejo no puede completar esa nueva tarea. H3.
3. Cambia inventario mientras se reordena un subconjunto filtrado: conservar posiciones ocultas y no resucitar cerradas al guardar/deshacer. H2.
4. Dos instalaciones con el mismo JSON: bootstrap único de un espacio vacío, segundo ingreso sólo descarga; nunca duplica el stock. H4.
5. Cursor/snapshot no atómicos o respuesta perdida tras commit: ninguna operación desaparece ni se confirma sólo en UI; reapertura recupera outbox/recibo. H3/H4.

## Recorridos y ubicación de todas las funciones

|Destino real|Acción principal y contenido|Secundarias conservadas / destino|
|---|---|---|
|Ingreso local `app/(auth)/login.tsx` + WelcomeProvider|Continuar en este teléfono, nombre para atribuir movimientos; primer valor real sin ejemplos obligatorios|Bienvenida reabrible desde Ajustes; entrar al equipo es opción separada, no requisito local|
|Alquileres `app/(tabs)/index.tsx`|Fecha de trabajo, búsqueda cliente/dirección/localidad, filtros explícitos, grupos Atrasados/Hoy/Próximos/Por preparar/Finalizados sin duplicados; Nuevo alquiler fuera de pestañas|Filtros sólo filtran. Zona/tarea/fecha visibles; conservar consulta/scroll al volver. Documentos pasa a Ajustes→Datos; combos pasa a Depósito|
|Detalle `app/obra/[id].tsx`|Cliente y dirección visibles, Maps/contacto, fechas previstas/efectivas, materiales/saldo, acción según estado|Editar (`obra/editar`), preparar carga, responsables/recibió, fotos, observaciones, incidencias/recuperación, transferencia, remito, ubicación, reactivar/reingresar/eliminar según dominio/permisos, historial de ese alquiler, recordatorios. No ocultarlas sin alternativa|
|Alta/edición `ObraForm`|Cliente/fechas → materiales → revisión; una persistencia al final|Calendario nativo y escritura dd/mm/aaaa, teléfono opcional según dominio, observaciones, combos/apodos/medidas, volver a corregir conservando datos. Borrador UI nunca es stock|
|Depósito `galpon.tsx`|Lista con material/medida y columnas alineadas: disponible, alquilado, a reparar, perdido|Agregar/editar, ajustar con procedencia/motivo, mover buckets/recuperaciones y combos (`app/combos.tsx`). Incidencias visibles, no resumidas como cero|
|Viaje `mapa.tsx`|Paradas visibles en secuencia; Abrir recorrido|Todas/Solo retiros/Solo entregas + zona; origen y ordenar por cercanía/cantidad; Cambiar orden abre borrador con agarre y posición directa; depósito/regreso, materiales completos en detalle; publicar plan de equipo separado de filtros/orden personal|
|Historial `historial.tsx`|Cronología legible, operación/autor/fecha/alquiler/material|Panel de filtros, detalle de movimientos, deshacer sólo si autor/tiempo/revisión lo permiten; corrección compensatoria auditada cuando no|
|Ajustes `configuracion.tsx`|Preferencias / Datos-documentos / Depósito / Equipo, sin estados cloud ficticios|Tema y movimiento; avisos/sonidos; JSON/recuperaciones/vaciar protegido; Word/Excel `exportar.tsx`; responsables y depósito fijo; identidad local/bienvenida; membresía/sesión/pendientes sólo si equipo está configurado|

**Regla de fechas/Hoy:** para PENDIENTE_ENTREGA la tarea usa `fechaEntrega`; para ENTREGADO con saldo retirado pendiente usa `fechaRetiroEstimada`. La misma tarjeta aparece una vez según su estado actual, nunca en dos grupos. Atrasados precede a Hoy y Próximos en el listado operativo; esa prioridad NO contamina el botón de cercanía de Viaje.

## Sistema visual propuesto, todavía no aplicado

Extender `src/theme/tokens.ts`, `ThemeContext` y los componentes existentes de `ui.tsx`/ListStructure/ToolsLayout/DateTimeFields. No crear una segunda librería de estilos o duplicar pantallas por tema. Mantener alias mientras se migra cada caller, retirarlos sólo al comprobar que no quedan usos. Diferenciar acción primaria de error: no convertir indiscriminadamente `C.red` en blanco donde indica peligro.

|Rol|Oscuro|Claro|
|---|---|---|
|Fondo|#050505|#F5F6F7|
|Superficie / elevada|#0E0E0E / #181818|#FFFFFF / superficie neutral|
|Texto / apoyo|#F2F2F2 / #A6A9AD|#151719 / #52575E|
|Línea decorativa|#303030|#CBD0D5|
|Selección/señal pequeña|#3FD6C6|#006D62|
|Primaria / texto sobre primaria|#F2F2F2 / #050505|#151719 / #FFFFFF|
|Borde interactivo / foco|contraste≥3:1 real con fondo|#7A8087 candidato / #006D62; medir renderizado|

Los colores semánticos conservan significado con texto/icono. Cálculo estático de pares iniciales: texto oscuro18.21:1; apoyo8.18:1; menta11.30:1; texto claro17.97:1; apoyo7.28:1; señal clara6.24:1. `#CBD0D5` sobre blanco sólo1.55:1: apto para separador decorativo, **no** borde identificador único de un campo/foco. El candidato #7A8087 da3.99:1. Estos cálculos no certifican componentes aún sin implementar.

Geist Regular/Medium/SemiBold y Geist Mono Regular/Medium TTF locales, desde vercel/geist-font@b5d164a0c066c2c9bfcd5ab65dd8244551f0ac06, OFL.txt(SIL1.1) preservado. Existen `fonts/Geist/ttf` y `fonts/GeistMono/ttf`; no WOFF2. Nueva carpeta de assets propuesta en etapa2 y carga con expo-font ya instalado; hoy la app usa serif/sistema, no esos archivos. Escala28/34,22/28,15/22,13/19; números tabulares, sin impedir escalado del sistema.

Superficies opacas, botones48×48dp mínimo/primaria≈52dp, labels reales y foco/errores junto a campo; largos y texto ampliado hacen crecer filas. Hojas/diálogos/avisos reutilizan el mismo sistema; no panel por cada dato, métricas inventadas, glass, halos o loops. Preferencia claro/oscuro/sistema y opt-ins actuales se conservan. Presión100–120ms, hojas180–220ms, pasos160–200ms son objetivos a verificar en release; reducir movimiento usa cambio inmediato/fade sin retrasar operación. No medir FPS mediante PNG ni cambiar brillo del celular.

## Viaje: contrato de datos e interfaces propuestas

**Reutilizar:** `utils/trip.ts` para Maps/depósito/tramos≤2048chars y `rules.ts` para coordenadas/Haversine. `sortTripStops` actual mezcla prioridad/distancia: migrar callers/pruebas al contrato explícito y retirar la ruta vieja al finalizar, no mantener dos ordenadores contradictorios.

**Nuevos archivos propuestos (no existentes):** `src/domain/tripOrder.ts` (funciones puras), `src/services/tripPreferences.ts` (preferencias duraderas), `src/components/TripOrderEditor.tsx` (borrador/gestos/alternativa accesible). `mapa.tsx` consume resultados, no implementa otro motor de stock.

- `eligibleTripStops(state): TripStop[]`: entregas pendientes con carga positiva operable, retiros ENTREGADO con saldo físico positivo. Sin carga/saldo se explican como no operables y mantienen acceso al alquiler; no se inventa cierre de estado. Excluir finales. Una parada tiene ID de alquiler local, tipo, nombre/dirección/zona, fecha, materiales y coordenadas opcionales.
- `reconcileTripSequence(savedIds, eligibleIds): string[]`: quitar no elegibles/repetidos, conservar orden relativo y agregar nuevos en orden estable. Nunca resucitar IDs desde un deshacer viejo.
- `visibleTripStops(allIds, stops, filter): TripStop[]`: filtro `ALL|RETIRE|DELIVER` + zona. Cambiarlo no reordena ni elimina IDs persistidos.
- `permuteVisibleTripIds(allIds, visibleIdsInNewOrder): string[]`: permutar **sólo** posiciones de ese subconjunto; validar que no agrega/omite/repite. `[A,X,B,Y]` con visiblesA/B → `[B,X,A,Y]`.
- `sortTripByDistance(visible, origin): TripSortResult`: línea recta desde un único origen validado; ascendente estricta, desconocidas al final, empates conservan orden anterior. Sin origen/destinos calculables devuelve motivo y NO éxito. No prioridad por vencimiento ni vecino-más-cercano. Cambiar origen invalida rótulo previo, pero no ordena hasta pulsar.
- `sortTripByMaterial(visible, basis, direction): TripSortResult`: basis identifica materialId y medida; entrega=carga prevista, retiro=saldo actual. Ausentes/desconocidas al final **en ambos sentidos**, distintas de cero; no sumar otras medidas/materiales. Conservar desglose mixto en detalle.

**Unidad/cuerpos:** no está probada una equivalencia en el catálogo real. Recomendación mínima: elegir el material/medida que se quiere comparar, rotularlo literalmente y usar su cantidad directa. Sólo si el responsable confirma que una unidad de ese ítem es un cuerpo se etiqueta «cuerpos · medida». Si no confirma, mostrar «Menos/Más del material» con el material visible, no un total falso de andamios. Nada comparable devuelve explicación y ofrece orden manual. Esta es la única decisión de negocio sobre unidades; no modificar cantidades maestras para resolverla.

**Persistencia propuesta:** `TripPreferencesV1` separada de Envelope comercial: secuencia completa, filtro/zona, origen `{kind,coordinates,accuracy,capturedAt}`, descriptor del último criterio, revisión UI y último orden confirmado para deshacer. Clave namespaced por espacio/cuenta, individual separado. `load/save` validan esquema/IDs y comprueban escritura; error de lectura conserva raw y ofrece reintentar/orden temporal no persistido, nunca sobrescribe con vacío. No almacenar snapshots de inventario aquí.

**GPS:** permiso foreground al invocar Mi ubicación; comprobar servicio/canAskAgain, captura puntual Balanced, timeout y cancelación lógica por requestId/montaje. Ignorar respuestas tardías. Advertir precisión baja y mostrar hora/edad; aceptar esa captura requiere decisión visible, no otro origen silencioso. Depósito usa coordenadas de `loadDepot`; si faltan, cercanía no se calcula, aunque Maps pueda abrir la dirección. No geocodificación ficticia ni tracking background.

**Editor:** al abrir crea borrador desde secuencia válida y revisión base. Agarres inician arrastre; fuera de ellos se desplaza normalmente. FlashList2/mediciones de filas variables + Reanimated/GestureHandler existentes, autoscroll por borde, un overlay sin blur. Posición directa visible y accessibilityActions/TalkBack/teclado con anuncio «posiciónN deM». Guardar confirma persistencia; Cancelar descarta. Comparar revisión/eligibles antes de guardar y reconciliar con aviso si cambiaron. Sustituir manual por automático pide confirmación; deshacer orden revalida IDs actuales, no modifica inventario.

`buildTripRoutes` recibe únicamente visibles en orden, depósito al final, y conserva tramos móviles. Abrir Maps sólo navega, no entrega/retira. Sin aplicación o con URL inválida, error dentro del contexto con reintento/dirección copiable.

## Backend gratuito evaluado y fecha de fuentes

Fuentes oficiales consultadas26/10/2026 por HTTP público, sin crear cuenta; URLs y hashes en `docs/evidencias-etapa1/fuentes-consultadas-2026-10-26.json`.

|Opción|Lo verificado|Decisión|
|---|---|---|
|Supabase Free|$0,2proyectos activos,500MBDB/proyecto,1GBStorage,5GBegress+5GBcached,50kMAU,500kEdgeinvocaciones,2MmensajesRealtime/200conexiones. Pausa tras1semana inactiva; Free sin backup diario administrado. Funciones256MB,2sCPU/request,150sworkerFree,100funciones y bundle20MBlocal/5MBservidor|**Recomendada para revisar**, por Postgres/RLS/CAS/SQL y motorTS enEdge. No implementada ni configurada|
|Appwrite Cloud Free|FAQoficial confirma Free100%gratis y congelación al superar recursos; transacciones con detección de conflicto y hasta100operaciones enFree. La página actual no expuso cuotas numéricas completas enHTML y la ruta buscada de pausas devolvió índice genérico|Alternativa no seleccionada; no inventar cuotas/pausas/backups ni prometerla equivalente. Más adaptación de permisos/almacenamiento/funciones; revalidar si falla la viabilidad de Supabase|

No se comparan más proveedores. Servidor propio no es infraestructura gratis garantizada ni elimina electricidad/mantenimiento/PC encendida; no se propone como dependencia. JSON manual es copia/intercambio, no sincronización.

Fuentes: [preciosSupabase](https://supabase.com/pricing), [billing/cuotas](https://supabase.com/docs/guides/platform/billing-on-supabase), [backups](https://supabase.com/docs/guides/platform/backups), [límitesEdge](https://supabase.com/docs/guides/functions/limits), [SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [passwords](https://supabase.com/docs/guides/auth/passwords), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [changelog](https://supabase.com/changelog), [Appwriteprecios](https://appwrite.io/pricing), [transaccionesAppwrite](https://appwrite.io/docs/products/databases/transactions). Changelog relevante: retirada de cifrados TLS1.2 antiguos prevista10/11/2026; probar TLS en Android soportado, no asumir incompatibilidad automática.

**Política $0:** organización/proyecto sólo Free, sin tarjeta/add-ons/upgrade/cron de keepalive artificial. Alertar uso y conservar operación local si se agota cuota o pausa; no habilitar cobro como recuperación. Exportar JSON/fotos regularmente y respaldos administrativos SQL+objetos privados, porque un dumpDB no incluye binariosStorage. Sin backup/SLA gratuitos garantizados. Salida: dumpPostgres, objetos por manifest, versiones del dominio y exportación neutral; importación a otro proveedor en etapa explícita, no bloqueo de datos por SDK. Umbrales de uso se configuran antes del piloto; no borrar historia/fotos reales para evitar un límite. Estimar y medir volumen real enH3/H4, no prometer capacidad infinita.

## Protocolo compartido propuesto — una autoridad, dos clientes

### Separación local/equipo y autorización

Individual conserva su key/base actual. Equipo usa namespace aislado por spaceId+userUid; mismaSQLite, sin copiar el workspace sobre `chema:demo:v1`. `activeWorkspace` es preferencia, no movimiento. Tema/filtros/búsqueda/ordenborrador/avisos son personales; catálogo, alquileres, stock, movimientos, asignaciones y ruta **publicada** compartidos. Cambiar de cuenta no reasigna autor/outbox de la anterior.

SupabaseAuth real de contraseña y membresía separada del nombre. Alta cerrada por invitación/autorización del responsable, sin depender de magiclinks/SMS/SMTP pago: aprovisionamiento administrativo autorizado y credencial elegida en flujo seguro; no simular que email/nombre equivale a verificación. No usar SMTP predeterminado como envío confiable: sólo destinatarios del equipo de proyecto y2mensajes/h según fuente. La etapa2 debe probar onboarding sin correos pagos y documentar el mecanismo de recuperación administrativa del propietario con su cuenta del proveedor; contraseña/recovery nunca por Git/log/chat. No se desactiva seguridad de una cuenta real en etapa1. Si el aprovisionamiento involucra Auth y DB en dos pasos, registrar saga/idempotencia: un Auth huérfano nunca obtiene membresía ni acceso; reintento seguro, no prometer una transacción entre servicios que no la tienen.

Roles mínimos propuestos: responsable→ADMIN del dominio, integrante→OPERADOR. Reusar `authorize/adminActions`; no elevar automáticamente miembros aADMIN como el AuthContext legado. Invitación criptográfica de un uso/TTL, hash en servidor, revocación y consumo atómico; incorporación no concede acceso sólo por conocer spaceId. Owner inicial único mediante bootstrap administrativo controlado, no «primero que llegue». Recuperar propietario requiere control autorizado del proyecto; sin eso y sin credenciales no se promete recuperación mágica.

JWT/sesión enSecureStore; extraer/revisar el patrón existente sin copiar su borrado de cabecera antes de escribir. Nuevo vault generacional: escribir partes nuevas, confirmar manifiesto al final, conservar sesión anterior si falla. Cliente contiene URL/clave pública, nunca service_role. Backend obtiene usuario verificado, rol/membresía activos y hora del servidor. No confiar en user_metadata/clientActor para permisos. RLS en todo lo expuesto; miembros sólo leen su espacio. Denegar escrituras directas de inventario/eventos y ejecutar commit privilegiado sólo desde función servidor autorizada; RPCprivilegiada con EXECUTErevocado aPUBLIC/anon/authenticated y schema/search_path fijo. Revalidar membresía dentro de la transacción, no sólo enJWTviejo.

Revocación/sesión expirada: parar envíos/pull/objetos y mostrar bloqueo persistente; conservar outbox/original, sin reasignarlo a otro usuario. No borrar base para «cerrar sesión». Un teléfono desconectado puede conservar datos ya vistos y rol en caché: no se promete revocación/borrado instantáneos offline. Al volver, servidor rechaza lo no autorizado; accesoUI se bloquea y responsable revisa pendientes. Tokens expiran/refresh se manejan con proveedor; no confiar únicamente en claims desactualizados.

### Escritura local, recibos y hechos comerciales

`Repository` se extiende por contrato/adaptador; no otro engine. Nuevo SharedEnvelope versionado contiene confirmado, proyección provisional, outbox, cursor, versiones y tareas. Cambio local+intención se guardan en **la misma transacción SQLite** (un sobre/atomicSet), antes de informar «Guardado en este teléfono». Cola por workspace con IDs estables, estados PENDING/SENDING/CONFIRMED/CONFLICT/ERROR y metadatos de intento duraderos. Reinicio de SENDING consulta opId/retoma sin duplicar.

Sobre propuesto `SyncCommandV1`: protocolVersion, spaceId, clientId, operationId, action existente, expectedEntityVersions, expectedTaskId si corresponde, dependencies, clientTimestamp informativo y payloadHash. El servidor reconstruye `actor`/createdAt, conserva hora del cliente sólo como dato no autoritativo. Respuesta `CommitReceiptV1`: operationId, serverSequence, serverTimestamp, resultKind, affectedVersions, delta confirmado o conflicto tipado. Un mismo opId con hash distinto se rechaza.

**Un UUID por teléfono no identifica el hecho.** Crear una proyección de **instancias de tarea** por alquiler/estado/ciclo. DELIVER/RETIRE llevan expectedTaskId vigente y revisión de alquiler. Una transición causada porTRANSFER también completa/crea las tareas correspondientes. Unique(spaceId,taskInstanceId) en el ledger de cumplimiento: dos retiros del mismo saldo no aplican dos veces aunque traigan UUIDdistintos. El segundo devuelve «Ya registrado por…»/conflicto y preserva su propuesta; no falso éxito ni descarte de daños/responsables diferentes. El usuario puede vincularse al registro existente o preparar corrección auditada sin mover stock otra vez.

**UNDO legítimo:** una reversión autorizada que reabre PENDIENTE/ENTREGADO crea una **nueva instancia** derivada del eventoUNDO, sin reutilizar la tarea completada. Así se permite entregar/retirar nuevamente de verdad; una cola vieja dirigida a la tarea anterior nunca completa la sucesora. Lo mismo enREACTIVATE. Mantener límite5min/autor/revisión global de undoReason; no deshacer movimientos de otros por introducir colaboración.

Última unidad: cada comando incluye versiones de materiales/alquileres que leyó. El servidor valida esas precondiciones y usa `applyOperation` sobre estado confiable; el primero puede confirmar, el otro queda en conflicto sin stock negativo ni sobreasignación confirmada. Operación offline aparece provisional, nunca como disponibilidad compartida garantizada. ADJUST/TRANSFER/REPORT/RECOVER también requieren versiones de entidades afectadas; un ajuste idéntico con UUIDdistinto no se aplica automáticamente sobre saldo que cambió.

### Commit autoritativo y almacenamiento propuesto

Nuevas rutas propuestas para etapa2: `src/data/sharedProtocol.ts`, `src/services/shared/{client,session,sync}.ts`, `src/data/sharedRepository.ts` sólo si no cabe como adaptador del existente (sin duplicar motor), `supabase/functions/commands/index.ts`, `supabase/functions/_shared/domain` generado desde el core, y migracionesSQL creadas con CLI verificada. Nombres finales se ajustan al patrón del repo, pero no se presentan como archivos que hoy existen.

Tablas propuestas: spaces/current_domain+revision; memberships; operations/receipts; changes(space_id,sequence); current_task_instances y task_fulfillments; entity_versions; published_routes; photo_objects; invitations/bootstrap_batches. DomainSnapshot sigue siendo el contrato de reglas. Historial/recibos paginados fuera del documento agregado y deduplicaciónSQL durable evitan bajar todo/appliedIds ilimitados en cada pull. `applyOperation` recibe sólo logs necesarios para el último deshacer; salida se codifica a eventos/deltas. El motor actual ya quita inversos previos: conservar ese contrato, no archivar snapshots completos de toda la empresa por cada evento. Mantener resumen, movimientos y autor del historial; nunca truncarlos silenciosamente.

Secuencia servidor: autenticar → leer snapshot/revisión/entidades/tarea confiables → validar precondiciones → ejecutar el **mismo TypeScript** de dominio → RPC transaccional con lock de espacio, comparación de revisión leída, membresía vigente, identidad/idempotencia/tarea única → persistir nuevo dominio+versiones+evento+recibo+tareas en conjunto. Si cambia revisión entre lectura ycommit, refetch/revalidar con reintento acotado; no reaplicar sobre versiones de material/tarea que cambiaron. La RPC decide commit/CAS/ACL, no copia las reglas de stock a un segundo motorSQL. `service_role` sólo servidor; fallo intermedio hace rollback.

Empaquetar el coreTS con imports/validación compatibles con Deno/Edge (build reproducible desde código existente, sin fork manual). Probar bundle/CPU/memoria contra límites reales2s/256MB y datos representativos. Si el motor no cabe, no anunciarlo listo: reducir transferencias/history con representación equivalente o revisar alternativa gratuita, sin migrar ni contratar por sorpresa.

### Pull, conflictos y conexión incierta

La secuencia es revisión por espacio asignada **bajo lock en el mismo commit**, no reloj del teléfono ni bigserial global que pueda comprometerse fuera de orden. Bootstrap entrega snapshot+cursor del mismo estado atómico. Pull paginado desde cursor duradero, límite y watermark; validar/deduplicar secuencias y persistir cambios+cursor+outbox juntos. Hueco/orden inválido obliga a refrescar consistentemente, no saltar eventos. Realtime sólo sugiere pull; recuperar al abrir/foco/red/reintento. Sin polling background inútil; fallback sólo appactiva/conexión, backoff con jitter y corte por revocación/cuota.

Timeout después de commit: preguntar por operationId; recibo existente confirma sin segunda mutación. Fallo sin certeza no permite «Descartar» como si el servidor hubiese rechazado. Conflicto confirmado conserva propuesta/base/versión actual y acción siguiente. FIFO conserva dependencias; no perder operaciones posteriores al primer conflicto. Rebase usa applyOperation y marca bloqueadas las dependientes; no se presenta toda la cola como sincronizada. Para datos descriptivos y rutas, inicialmente revisión explícita sin auto-merge: comparar y aceptar/reeditar. Stock, devoluciones, borrado y restauración jamás LWW. Una corrección es otro comando auditado, no editar un saldo por fuera.

Textos visibles: «Guardado en este teléfono», «3 cambios pendientes», «Última sincronización:…», «No pudimos enviar los cambios. Reintentar», «El retiro ya fue registrado por…», «Revisar conflicto». Indicadores persistentes inline, no popup por cada cambio remoto. Confirmado sólo tras recibo duradero; la app cerrada no tiene sync instantánea prometida.

### Bootstrap, JSON, fotos y ruta compartida

Importar/recuperar JSON en equipo abre un **espacio local aislado** para revisar. No reemplaza datos del equipo ni reenvía movimientos antiguos. Mantener el mensaje de reemplazo sólo en individual. No ofrecer fusión de inventarios. Bootstrap de un espacio nuevo vacío requiere responsable, copia explícita y transacción que se ejecuta una vez; fingerprint canónico/procedencia guardados. Segundo teléfono con el mismo JSON se incorpora al espacio existente y descarga; nunca suma su inventario. Si son copias divergentes, comparar/exportar y revisión, no sumar saldos. Espacios/IDs namespaced; un restore local no resucita recibos/borrados remotos.

Fotos: referencias lógicas por space/photoId, no file:// de otro celular; subidas pendientes separadas, bytes JPEG locales existentes/1024px/calidad0.7/límite real preservados. Upload por hash/ID estable, privado conRLS/membresía, verificación antes deSYNCED; fallo no impide guardar alquiler. Descarga/cache local y URL privada temporal; nunca service_role o URLs públicas permanentes. No borrar objetos requeridos por estado/undo/recuperación/exportación; cuota/conexión conserva cola. Respaldo incluye objetos, no sóloSQL. Ninguna foto/base real se lleva aGit.

Orden personal no se comparte al cambiar filtros. «Publicar recorrido» explícito crea published_route con autor, versión y asignaciones. Dos publicaciones sobre la misma revisión: sólo una confirma; la otra compara/revisa, no pisa. Paradas publicadas apuntan a tarea comercial vigente, no se convierten silenciosamente en retiro al completar una entrega. Reconciliar cerradas/nuevas con aviso y revisión, conservar el plan anterior/auditoría. Misma regla de visibles/Maps se aplica al recorrido elegido.

Avisos: fechas del alquiler compartidas; preferencias globales/personalizadas **por dispositivo y espacio**. Mantener08:00 sólo en configuración nueva y no habilitar opt-in al sincronizar. Ambos pueden recibir un aviso si ambos lo activan; deduplicar por tarea/offset/dispositivo, no suprimir el del otro sin decisión. Reconciliar cuando llegan cambios, al abrir y al reanudar. Sin push/backendbackground, un celular cerrado puede avisar con su última fecha conocida: documentarlo y comprobar estado actual al tocar; nunca mover stock por notificación. Usar el ReminderService/canales/sonidos existentes, no un scheduler paralelo.

## Hitos ejecutables y puntos de respaldo

Todos los pasos siguientes están **pendientes de etapa2**, aunque reutilicen piezas ya existentes. Dentro de cada hito: prueba significativa fallando cuando cambie contrato → cambio mínimo → pruebas verdes + revisión visual pertinente → commit/push. No esperar al último APK. Archivos llamados «propuestos» no existen aún; los demás son reales. Cada corte conserva la app individual operable.

### H0 — Base, identidad instalada y recuperación

**Cubre:** A1–A6, B1/B4/B5, H1–H6, M1/M2. **Archivos reales:** files.ts, BackupImport.tsx, backupService.ts, repository.ts, validation.ts, sqliteStorage.ts, nativeInventoryStorage.ts, tests/import*.test.ts, tests/ui/import-json.spec.ts. **Propuestos:** pruebas de selección con metadata y preview completa.

- [ ] Verificar APK exacto llamado2.0 (paquete/códigos/certificado) sin instalar/borrar datos. Si falta, registrar gate de release y seguir lo independiente. Obtener JSON exacto sólo paraH5; nunca sustituirlo por la fixture sintética.
- [ ] Preservar selección/inspección/archivo previo/commit actuales. Introducir `pickBackupSelection():Promise<{raw:string;name?:string;size?:number}|null>` y mantener `pickBackup():Promise<string|null>` como wrapper para callers existentes (incluido Screen de recuperación). Una lectura/selector, sin perder caché ni tipo flexible Android.
- [ ] Vista previa virtualizada de TODOS los alquileres/materiales/medidas, nombre real disponible y comparación; copy exactaH3, «Restaurar esta copia», cancelar intacto. No exigir una copia manual adicional para protección que ya hace la transacción interna. Mantener protección externa de Empezar vacío.
- [ ] Probar: cancelación, URIcontent/cache, nombre ausente, proveedoroffline/eliminado, vacío/BOM/truncado/esquema/50MiB/fotos inválidas, fallo al archivar y al commit, reapertura/recuperación; objeto/anterior idéntico en fallos. Cinco exactos sólo si se obtiene su archivo. Modelo compartido de restauración local aislada definido antes de tocar su UI.

**Aceptación:** regresiones existentes siguen verdes, preview completa y estado anterior conservado; A4/H5 pendientes explícitos si faltan archivos, sin impedirH1/H2. **Riesgo/reversión:** conservar JSON/raw/archivos previos; no cambiar formato comercial para metadata del selector. **Respaldo:** commit de importUX después de check y evidencia; copia fuente antes de futuros builds, no subir JSON real.

### H1 — Tokens y UX nativa principal (dos cortes verificables)

**Cubre:** D1–D7, E1–E10, B1/B5, K1–K4, L2. **Archivos reales:** src/theme/tokens.ts, ThemeContext, ui.tsx, ListStructure/ToolsLayout/ThemeToggle, app/_layout.tsx, tabsLayout/index, CardObra, ObraForm, OperationForm, LoadEditor, DateTimeFields, detalle/editar/nueva; app.json sólo si una configuración nativa justificada lo exige. **Propuestos:** assets deGeist/OFL y pruebas de tareas/estadoUI.

- [ ] Corte1: roles de tema únicos y fuentes locales cargadas con expo-font, fallback legible sin parpadeo ni pérdida de formulario. Reemplazar navegación lateral por cuatro pestañas inferiores; respetar safeareas/ancho de contenido. No quitar controles secundarios; cambiar su destino según tabla de recorridos.
- [ ] Corte2: `rentalTaskForDate`/agrupación pura para Hoy entregas+retiros, vencidos/fechasinválidas/finales sin duplicación; búsqueda incluye localidad y dirección visible en filas. Estado de búsqueda/filtros/offset separado del negocio; regresar desde detalle conserva estado.
- [ ] Alta/edición conserva sus tres pasos, cantidades/fechas/roles/idempotencia/revisión. Campos al volver/error/tema y borrador perdurable separado si se añade; descartar sólo explícito/success. Revisión por material/medida/responsables/destinos e incidencias antes de confirmar; no retirar parcialmente por rediseño.
- [ ] Tests: hoy con pendiente+entregado, ayer/mañana/cambio de año/zonaArgentina; búsqueda local/dirección larga; falta teléfono editable; estado vacío inicial vs filtro/error/carga; volver/scroll; guardar pendiente no mueve stock; dobletoque/errorpersistencia mantiene formulario. Usar y ampliar counter-presentation/date-time-fields/formularios-cobalto/domain existentes, sin convertirlos en test de colores antiguos.
- [ ] Capturas base/nuevas con misma fixture/tamaño/tema; contraste real de botones/campos/errores/selección, fuente ampliada/IME/Atrás. No declarar TalkBack ni Android desde Chromium.

**Aceptación:** un recorrido local completo con UI nueva y stock idéntico; todos los principales y controles comunes consistentes, sin sidebar ni acciones perdidas. **Dependencia:** arquitectura de espacios acordada en plan, implementación de sync aún no necesaria. **Reversión:** commits de tokens y composición separados de datos; tema/sesión existentes intactos. **Respaldo:** push después de cada corte, sin actualizar Expo/RN/lock por estética.

### H2 — Viaje completo, sin efectos comerciales

**Cubre:** G1–G12, E2, K1–K4, L3. **Archivos reales:** mapa.tsx, utils/trip.ts, listPresentation.ts, rules.ts, depotSettings.ts, InventoryContext (lectura), tests/trip*.test.ts y tests/ui/trip.spec.ts. **Propuestos:** tripOrder.ts, tripPreferences.ts, TripOrderEditor.tsx y `tests/trip-order.test.ts`, `trip-preferences.test.ts`, `tests/ui/trip-order.spec.ts`.

- [ ] Implementar funciones/interfases del contrato Viaje anterior con tests antes: elegibilidad/cargas/saldos, filtros combinados, permutaciónA-X-B-Y, reconciliación, conocidos/desconocidos/empates, 3/6 en ambas direcciones sin convertir marcos ni sumar medidas.
- [ ] Preferencias duraderas y editor transaccional UI: cargar/guardar/cancelar/deshacer con verificación, revisión de eligibles y errores recuperables. Cambio de filtro/origen no modifica orden; confirmación al reemplazar manual por automático. Archivo corrupto no vacía preferencias ni inventario.
- [ ] GPS puntual con servicio/permiso permanente/timeout/baja precisión/cancelación y timestamp; probar resultado tardío al salir. Retiro vencido lejano debe quedar detrás de entrega cercana al pulsar cercanía. Ningún resultado sin coordenadas muestra0km.
- [ ] Arrastre desde agarre con autoscroll y posición directa/TalkBack/teclado. Configurar GestureHandlerRootView enroot si hace falta (actualmente no está); reutilizar Reanimated/Worklets sin upgrades. Medir filas dinámicas, no fijar alturas para esconder direcciones/texto grande. No instalar una biblioteca de drag sin compatibilidad/licencia y necesidad verificadas.
- [ ] Maps recibe sólo visibles en ese orden +depósito, dividido por límites existentes; error por enlaces/apps/URLlarga. Tests comparan inventario completo antes/después de cada orden/preview/Maps: cero cambios comerciales.

**Aceptación:** guardar/reabrir mantiene secuencia/filtros/origen; caso subconjunto conserva posiciones ocultas; mutación concurrente de elegibles informa y no resucitaIDs. La comparación por cuerpos no se presenta si no está confirmada su unidad. **Reversión:** preferencias separadas/versionadas, originalraw conservado; no tocaSQLite comercial. **Respaldo:** commits puros/servicio/editor/gestos con sus pruebas; push por corte.

### H3 — Primer corte real de equipo: dos clientes y una operación crítica

**Cubre:** J1/J3–J9/J12/J13, B2–B4, I3, L6. **Reutilizar:** engine/rules/schema/types, Repository/SqliteStorage, InventoryContext/AuthContext; descartar Firebase como dependencia nueva. **Propuestos:** protocolo/client/session/sync, migraciones y función servidor indicadas arriba; `tests/integration/team-retire.test.ts`, `team-stock.test.ts`, `team-auth.test.ts`, `outbox-reopen.test.ts`.

- [ ] Preparar Supabase CLI/versiones actuales y stack **local** Docker/Postgres/Auth/Edge; no cuenta ni servicio remoto hasta acceso/autorización de etapa2. Compilar mismo coreTS para función ycliente. Medir coste/payload y validar cabida enFree antes de escogerlo definitivo.
- [ ] Identidad/membresía/roles confiables, invitación y sesiones reales; RLS/ACL de tablas/RPC/objetos contra lecturas cruzadas. No falsear Auth mediante un mock que acepta cualquierUID. Escribir desde APK con claves públicas no debe permitir saltarse la función ni elevar rol.
- [ ] Sobre compartido aislado con escritura local+outbox atómica, recibos, expectedEntityVersions y tarea comercial estable. Snapshot+cursor del mismo commit y ledger durable. No auto-migrar individual al activar equipo.
- [ ] Dos clientes con SQLite real de prueba, dos Authusuarios y Postgres real: mismaRETIRE con opIdsdistintos sólo una devolución; últimaunidad sólo una entrega confirmada; timeout después de commit y retry no duplican; fallo antescommit no persiste remoto; cierre/reapertura deSENDING consulta recibo.
- [ ] ProbarDELIVER→UNDO→DELIVER yRETIRE→UNDO→RETIRE: nueva instancia legítima permitida; envío rezagado de la tarea vieja rechazado. Transferencia que entrega destino pendiente genera/cierra tareas adecuadas. Prueba de reactivación/ciclo nuevo. Ninguna regla de retiro parcial nueva.
- [ ] Mostrar PENDING/SENDING/CONFIRMED/CONFLICT/ERROR reales y conflicto con siguienteacción. Permiso revocado/cambio de cuenta no reasignaoutbox. Conexión perdida después del acuse no cambia confirmación ya durable.

**Aceptación:** invariantes demostradas en integración servidor+dosclientes, no sólo unitarias; modoindividual sigue funcionando sin cuenta/backend. **Riesgo:** autoridad/duplicados; gate impide extender un protocolo inseguro alresto. **Migración/reversión:** claves nuevas/esquema compartido separado, flagEquipo no visible como listo sin backend verificado; exportar caché antes de cambiar protocolo. **Respaldo:** commit/push y scripts/migraciones reproducibles sin secretos; ninguna keyprivilegiada en app/Git.

### H4A — Extender sync a entidades, historial, bootstrap y recuperación

**Cubre:** J1/J4/J5/J7–J10/J13, H6, F1/F2, L6. **Propuestos:** deltas/pull/versions/bootstrap sobre el mismo adaptador y tablas, pruebas de replay/integración; componentes de pendientes/conflictos. **Existentes:** formularios y servicios consumen el mismo InventoryContext.

- [ ] Catálogo/combos/responsables, alquileres/carga/operaciones/incidencias, movimientos e historial con permisos reales. Stock sigue en applyOperation; autor/fecha se reconstruyen en servidor. Deltas validados sin reenviar snapshots e historial completos por cambio.
- [ ] Cursor porrevision bajo lock, paginación y watermark; duplicados/ordeninvertido/huecos/relarga desconexión. Persistencia atómica de confirmado+cursor+outbox y rebase seguro de pendientes/dependencias. Realtime sólo señal, foco/red/manual +fallback activo acotado, sin procesos background inútiles.
- [ ] Conflictos descriptivos/ruta/stock/borrado con propuestas/versiones visibles; no LWW. No descartar un envío incierto. Si no se puede deshacer por autor/5min/revisión, explicar y abrir corrección compensatoria auditada.
- [ ] Bootstrap vacío una vez, selección explícita de copia. Dos dispositivos con el mismoJSON y reinicios no duplican inventario. Identidades/namespaces conservadas; divergentes no se mezclan. JSON/recuperación deequipo abrelocal aislado y no reenvíaacksviejos. Exportar datos y fotos legítimamente autorizados.
- [ ] Recuperación de un backup servidor cambia `serverEpoch`/generación: clientes se detienen para reconciliar recibos confirmados fuera del backup. No replay ciego ni resurrección de movimientos/borrados después de desastre. Ensayar backup+restore local administrativo con ambosclientes.

**Aceptación:** todas las operaciones tienen evidencia server/cliente y autor; reconexión converge o muestra conflicto recuperable, nunca estado sincronizado falso. **Migración:** snapshots/originales preservados, importación aislada por defecto; no ejecutar migración irreversible de una base real sin revisión autorizada. **Reversión:** volver aindividual separado, conservarteamcache/outbox y exportaciones; no downgrade que borre esquema. **Respaldo:** push por entidad/lote verificado; copia SQL y objetos de prueba privados (noGit).

### H4B — Adjuntos y recorrido compartido

**Cubre:** J2/J11, G10–G12, L6. **Propuestos:** adaptadorStorage privado/cola de fotos y publicación de ruta, tests de autorización/hash/cuota y ruta concurrente. **Existentes:** photoCache.ts/web, storageService.ts, fotos del detalle, tripOrder/tripPreferences deH2.

- [ ] Upload porID/hash estable con reconexión/parcialfallo/permisos; fotoPENDING no bloquea alquiler; sólo marcar subida aceptada cuando servidor confirma objeto correcto. Otrocelular resuelve referencia lógica, noURIlocal; URLprivada temporal sin hacer bucket público.
- [ ] Retención segura respecto de estado/undo/recuperaciones/exportaciones; alcanzar cuota conserva archivo ypendiente yofrece copia, no borra archivos por sorpresa. Pruebaobjeto fallido/ausente/borradosegúnpermisos y exportacióncompleta.
- [ ] Publicar plan deViaje/ asignaciones explícitamente, versionado/autor/historial. Dosreordenamientos simultáneos no se sobrescriben. Filtros y borradores personales no publican. Tarea cerrada no reaparece ni se transforma silenciosamente; Maps usa visibles delplan elegido.

**Aceptación:** clientes distintos ven sólo adjuntos autorizados y plan confirmado; caída/quota no rompe trabajo local. **Riesgo:** datosprivados/consumo; usar sólo sintéticos en pruebas. **Reversión:** flags separados de upload/publicación, referencias originales y copias retenidas, sin limpieza comercial. **Respaldo:** commit/push con pruebas y manifiestos; no fotosreales/SQLprivado enGit.

### H5 — Extensión visual completa, avisos y accesibilidad

**Cubre:** A5, D1–D7, F1–F3, I1–I4, K1–K4, L2/L4/L5/L8. **Archivos reales:** galpon/historial/configuracion/combos/exportar, ui/ToolsLayout/ScaffoldSelector/SmartCounter/FaltantesForm/LoadEditor, FeedbackContext, RentalReminderPanel/RetirementReminderSettings, ReminderService/adapters, useBusinessClock, fotos/documentos, links yotros callers inventariados.

- [ ] Aplicar composición/tokens deH1 a TODAS las pantallas y estados; no sólo principales. Depósito en filas con cantidades porbucket/medida e incidencias; historial temporal compacto con panel de filtros; ajustes separados en preferencias/datos/inventario/equipo; selectores/ventanas/cargas/errores coherentes.
- [ ] ConservarWord/Excel institucionales y flujos foto/cámara/galería/selector/compartir/Maps/WhatsApp reales. Ningún botón pasa a demostración. Fuentes de documentos no se cambian por instalarGeist enUI. No prometerPDF.
- [ ] Extender ReminderService existente para namespaces/teamfechas recibidas, conservando manuales y preferencia08:00/optin/offsets previos. Avisos personales por dispositivo; cancelar/reprogramar al cerrar/restaurar/sincronizar sin duplicar. Permiso negado guarda alquiler y mensaje claro; tap frío espera contexto real.
- [ ] Pruebas nativas de Atrás/gestopredictivo según soporte, IME/safeareas, fuente ampliada, reducción de movimiento, roles/labels/foco/posición delarrastre/selección perceptible. No bloquear lecturas con avisos repetidos ni sonido por evento remoto. Duraciones y fluidez sólo con release/dispositivo, sinFPSinventado.

**Aceptación:** cada acción secundaria de la tabla está accesible; todos los temas/errores/vacíos/formularios/documentos tienen prueba pertinente. **Riesgo:** pérdida de operaciones por cambiarUI; comparar inventario antes/después de cada recorrido. **Reversión:** commits visuales separados de migraciones/datos, preferencias conservadas; no restaurar una revisión insegura de stock por estética. **Respaldo:** push por módulo y captura real antes/después etiquetada.

### H6 — Validación final, APK y entrega

**Cubre:** L1–L8, M1–M5 y filas de la matriz aún pendientes. **Reutilizar:** npm scripts, scripts/build-android-demo.mjs/verify-android.py/package.py, herramientasSDK existentes. El nombre demo del script no se considera prueba de equipo: adaptar flags únicamente cuando la configuración opcional nueva esté implementada y verificada, manteniendo buildindividual reproducible.

- [ ] Ejecutar check, integración nueva real y recorridos completos locales/equipo/errores. Revisar matriz94requisitos: cada aprobado apunta a evidencia y commit; no omitir fallos para subir elAPK. Firebaseemuladores históricos no prueban nuevo backend. APKlocalintermedio no cierra colaboración.
- [ ] Revisar PNG reales de todas las pantallas/ventanas claras/oscuras con mismafixture/tamaño. Captura nativa si hayemulador/ADB; vídeo nativo corto de arrastre/transiciones sólo si disponible, sinfallbackAPIpaga. Sin dispositivo: marcar no probado y proporcionar pasos alusuario; no simular.
- [ ] Comprobar update contra APKexacto instalado. VersionCode superior a los pertinentes y mismo package/certificado. Si faltanfirma/APKbase, bloquear instalador compatible y explicar; nunca desinstalar/rotarfirma. Rollback a fuente anterior requiere APKfirmado con código superior y datos compatibles, no prometer queAndroid permite un downgrade común.
- [ ] Commit/push y fuenteZIP restaurada antes de Gradlecompleto si hay cambios nativos; SHA/CRC/ABI/minSDK/firma/recursos. Publicar archivo NUEVO en descargas `android/v<version>-<modalidad>.<n>/`; rama descargas no es prefijo de ruta. Conservaranteriores, actualizarlinksprivados, recuperarbytesGitHub ycompararSHA. No publicar repo niAPKpúblico para resolver un404 deautenticación.
- [ ] Entregar informe, cambios/commits, matriz final, APK+SHA, código/respaldos, capturas, manual y pendientes reales; actualizarcontinuidad antes de límites. No afirmar100% sinerrores, física/producción/cloud no configuradas o trabajo automático futuro.

**Aceptación:** fuente recuperable yartefactos verificables; individual usable ycolaboración realmente verificada enplataformas declaradas, con límites gratuitos visibles. **Respaldo:** porhito yantesdebuildlargo; último checkpoint indica qué quedó guardado ypróximaacción. Costo yprivacidad siguen loscontroles globales.

## Dependencias, decisiones y revisión de etapa1

H0 y definición compartida preceden cambios de persistencia. H1/H2 pueden avanzar localmente mientras se obtiene acceso albackend; H3 requiere diseño de autoridad aprobado y servicioslocales, no unapi key inventado. H4A/H4B no se inician sobre unH3 que duplique stock. H5 completa cobertura de todas las superficies; H6 exige revisión íntegra, no sólo unitarias.

Decisiones mínimas para revisión, con recomendación:

1. **Unidad de cantidad:** seleccionar material/medida real y confirmar si una unidad es un cuerpo. Recomendación: base explícita por material, sin conversiones ni agregados entre medidas; fallback útil por material hasta confirmación.
2. **Backend/acceso:** recomendarSupabaseFree con límites anteriores y cuentas/membresía reales; no creado. Para etapa2 hará falta cuenta delusuario/proyectoFree y autorización segura; no solicitarpassword/secretos porchat ni activarcorreo/serviciopago. Rol inicial conservador: responsableADMIN/integranteOPERADOR según dominioexistente; si ambos deben crearalquileres/ajustarstock, confirmarlo explícitamente en la revisión de permisos.
3. **Evidencias exactas:** APKinstalado llamado2.0 y `repartos-chema-5-pedidos-whatsapp.json` cuando se deban comprobarupdate/H5. No son nombres que se pueden sustituir porúltimopublicado/fixture. No bloquean planificación yUIindependiente.

Revisión preparada en [AUTOAUDITORIA_PLAN_CHEMA.md](AUTOAUDITORIA_PLAN_CHEMA.md); todos los subrequisitos están en [MATRIZ_ACEPTACION_CHEMA.md](MATRIZ_ACEPTACION_CHEMA.md). Esta etapa termina con documentos listos para revisar. La siguienteacción de desarrollo exige el archivo02; no se considera permiso para implementar por el solo hecho de aprobar una skill o un listado de tareas.
