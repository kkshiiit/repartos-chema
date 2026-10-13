# Arquitectura e invariantes

## Capas

- `app/`: rutas Expo Router, cuatro secciones móviles y pantallas secundarias. No hay una pestaña por cada formulario.
- `src/components/`: UI accesible, botones de 44–48 px, SmartCounter, selectores y formularios.
- `src/domain/`: motor puro, validación Zod, RBAC, semáforo, cantidades, transiciones y reversión. Compartido con Functions.
- `src/data/`: adaptador local, semilla ficticia y repositorio serial con cola durable.
- `src/context/`: sesión, inventario, conectividad.
- `src/services/`: límites con Auth/Firestore/Storage, archivos, ubicación/enlaces y documentos.
- `functions/src/`: transacción remota, auditoría, avisos FCM, limpieza de archivos y generadores.

## Inventario

Para cada material, `cantidadEnObra` debe equivaler a la suma de `saldosEnObra` de todas las obras. Los cuatro depósitos contienen enteros entre 0 y 100000. IDs estables; cargas sin materialId duplicado; fechas civiles reales AAAA-MM-DD. Los apodos y medidas de una carga se conservan sin renombrar el maestro.

`materialesCargados` conserva lo entregado; `saldosEnObra` representa lo que continúa físicamente allí. Un daño/pérdida disminuye ese saldo, aumenta taller/perdido y crea un registro recuperable. El retiro devuelve solo el saldo restante al galpón. Recuperar devuelve desde taller/perdido al galpón y aumenta `recuperado` en el faltante, sin volver a aplicar la pérdida.

Las triangulaciones mueven saldo directamente de obra a obra, conservando el total global y registrando origen, destino, cantidad, responsable y motivo. Un destino pendiente debe estar sin carga; si ya está cargado, usar entrega con procedencia autorizada para el faltante. Los ajustes externos son ADMIN y requieren motivo/procedencia.

El retiro distribuye las existencias según inspección. Reingresar cierra la revisión, sin sumar nuevamente. Ambos estados aparecen bajo **Retiradas** en el tablero. Reactivar vuelve a pendiente, para revisar fecha y carga antes de la siguiente entrega.

## Confirmación y conflictos

1. El dominio valida el comando contra el último estado disponible.
2. El repositorio guarda estado optimista + comando en un solo valor de AsyncStorage antes de notificar a la UI.
3. En modo Firebase la cola se reenvía al volver la red, al retomar la app y cada 30 segundos en primer plano.
4. El servidor obtiene el usuario desde Auth, verifica correo y perfil, vuelve a leer el rol dentro de la transacción y valida el mismo dominio.
5. El movimiento, la auditoría, la revisión y el comprobante idempotente se escriben juntos.
6. La app elimina el comando de la cola y muestra SYNCED únicamente tras recibir la respuesta confirmada.

Un envío cuya respuesta se perdió se repite con el mismo ID; `operations/{id}` conserva UID y hash de la acción. Nunca se reutiliza para otro movimiento. Los comprobantes no tienen TTL, por lo que no reaparecen duplicados tras una cola antigua.

Un rechazo conserva el comando y su error. La app bloquea más cambios hasta resolverlo. `Descartar rechazo` conserva una copia local del intento y vuelve a leer el estado remoto; luego se registra una operación compensatoria con motivo. No se permite descartar un envío con resultado incierto. Rebase de comandos pendientes también puede revelar conflictos; no se sobrescriben saldos mediante última escritura ganadora.

El repositorio es el responsable de offline móvil; la caché persistente IndexedDB de Firestore solo se configura en web. La sesión nativa usa SecureStore fragmentado para evitar límites de tamaño de token; no se guardan contraseñas. Un perfil previamente verificado se conserva para apertura offline, pero sus permisos se revalidan en servidor al reenviar movimientos.

## Deshacer

Ventana inclusiva de 300000 ms, con el reloj del servidor al confirmar. Solo el autor, con el rol requerido, y solo si la revisión global coincide con la esperada. La política global es conservadora: incluso una acción posterior de otra obra bloquea la inversión. Evita reconstrucciones inseguras de un snapshot del inventario.

Se restaura el snapshot y se agrega un registro nuevo; el registro original conserva `undoneBy`. La app conserva un solo snapshot inverso vigente para no multiplicar fotos/datos. Fotos y operaciones que emiten avisos externos no se deshacen: se eliminan fotos o se registra recuperación/ajuste de forma explícita.

## Fotos y archivos

Máximo 12 fotos por obra. JPEG 0.7, lado máximo 1024 px. En móvil se copian al directorio persistente de la app; en demo web se conserva data URI y se informa si se supera el límite local. Al agotarse la cuota no se confirma la operación.

Firebase sube a una ruta inmutable por usuario/obra/ID. Un reintento consulta el objeto antes de subir, para evitar sobrescrituras. El servidor comprueba propiedad y metadatos antes de registrar la referencia. Un archivo subido cuya operación fracasa puede quedar huérfano; para producción establecer limpieza por retención tras comparar referencias, sin borrar cargas en cola.

Los enlaces de descarga de fotos contienen tokens de acceso de Firebase: tratarlos como información privada y revocarlos cuando corresponda. Los documentos no usan URLs públicas: la función devuelve una ruta Storage que se descarga con autorización, con expiración y limpieza programada.

