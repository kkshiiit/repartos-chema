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

Máximo 12 fotos por obra. JPEG 0.7, lado máximo 1024 px. En móvil se copian al directorio persistente de la app; en web se guarda un Blob en IndexedDB y el inventario conserva una referencia corta `chema-photo:ID`. Las referencias data URI históricas siguen siendo legibles. Al agotarse la cuota no se confirma la operación.

Firebase sube a una ruta inmutable por usuario/obra/ID. Un reintento consulta el objeto antes de subir, para evitar sobrescrituras. El servidor comprueba propiedad, bucket/ruta exactos, tamaño, MIME y cabecera JPEG antes de registrar la referencia. Un archivo subido cuya operación fracasa puede quedar huérfano; para producción establecer limpieza por retención tras comparar referencias, sin borrar cargas en cola.

Los enlaces de descarga de fotos contienen tokens de acceso de Firebase: tratarlos como información privada y revocarlos cuando corresponda. Los documentos no usan URLs públicas: la función devuelve una ruta Storage que se descarga con autorización, con expiración y limpieza programada.

## Recuperación y temas

`src/data/validation.ts` valida el sobre persistido y sus invariantes. Una versión desconocida, JSON corrupto o fallo de lectura no autoriza sembrar datos nuevos. Los fallos de escritura no publican el cambio en UI. `Repository.restoreDemo` exige ADMIN, archiva primero el sobre anterior y solo entonces sustituye los datos. La copia completa incluye fotos en base64 exclusivamente dentro del archivo de exportación; la base de datos activa usa referencias, no imágenes incrustadas nuevas. La restauración remapea IDs y elimina inversos de otra instalación.

Las fotos remotas no disponibles localmente no se descargan automáticamente al crear un respaldo. En producción se requiere además respaldo de Firestore y Storage por un administrador; una copia del cliente no es un backup íntegro del servidor. Los archivos locales huérfanos tras una restauración interrumpida no se limpian automáticamente, para evitar borrar la única copia.

`ThemeContext` mantiene `chema:theme:v1`, independiente de la cola. Los tokens en `src/theme/tokens.ts` distinguen texto, superficies, borde, foco, selección y colores semánticos. `useUI` retorna estilos previamente creados para cada paleta. Cambiar tema no cambia claves de formularios ni reinicia proveedores de datos. La lectura inicial precede al montaje de pantallas. Sistema usa `useColorScheme`; un toque rápido pasa a selección manual. La barra del sistema usa Expo StatusBar/SystemUI.

## Fechas, medidas y revisiones

`fechaEntrega` conserva la planificación. `fechaEntregaEfectiva` se establece al entregar. Los datos históricos anteriores que carezcan de esa separación se muestran sin inventar una fecha efectiva. Retiro previsto/efectivo son campos diferentes. Reactivar limpia fechas efectivas para el nuevo ciclo conservando la planificación, que puede editarse.

Una medida identifica la variante del material. Normalizar espacios y separador decimal no convierte cm en m ni intercambia piezas. Carga y triangulación verifican el maestro; un maestro usado no cambia de medida. Se crea otra variante cuando físicamente corresponde.

Las ediciones de obra/material/combo contrastan versión. La carga envía versión desde la UI; la aceptación de comandos antiguos sin esa versión sigue siendo una compatibilidad del dominio que debe revisarse antes de admitir clientes externos. Las operaciones de existencias se serializan y vuelven a validar siempre en la transacción.

`MOVE_STOCK` mueve stock no vinculado a faltantes. `CORRECT_INCIDENT` ajusta registros vinculados sin descontar dos veces. Un faltante sin materialId es una observación auditada con cantidad y aviso: no inventa existencias maestras.
