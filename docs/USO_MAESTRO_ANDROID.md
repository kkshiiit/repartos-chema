# Uso y prueba en Android — edición maestra

**Estado al27/10/2026:** instrucciones para la versión candidata1.7.0; su APK todavía no está comprobado ni publicado. La fuente está respaldada en la rama feat/chema-maestro-etapa2. Consultá ENTREGA_MAESTRA_CHEMA antes de descargar: el APK1.6.1 anterior no incluye esta etapa.

## Actualizar sin perder datos

1. En la app instalada, entrá a Ajustes → Datos y exportá una copia JSON completa. Guardala fuera de la app, por ejemplo en Descargas.
2. Cuando se publique el APK nuevo, abrí su enlace en Chrome con la sesión GitHub de kkshiiit. En el repositorio privado, elegí Descargar archivo sin procesar / Download raw.
3. Abrí el APK y elegí Actualizar. **No desinstales ni borres almacenamiento.** Si Android rechaza firma o versión, conservá todo y enviá el mensaje exacto.
4. Compará cantidades de cada pieza y estado, alquileres, fotos, historial, fechas y tema. Activá modo avión, cerrá y volvé a abrir; los datos deben conservarse.
5. La identidad se compara contra1.6.1 conocido. La instalación llamada2.0 todavía no pudo identificarse; no se certifica su actualización sin comprobar su APK.

## Empezar y registrar un alquiler

El modo individual funciona con tu nombre, sin cuenta ni conexión. Una instalación nueva empieza vacía. No importes datos de prueba encima del inventario comercial.

En Depósito agregá la pieza, su medida y cantidad con procedencia. En Nuevo alquiler completá cliente, dirección, entrega prevista y Alquilado hasta. Cargá las piezas, revisá el resumen y guardá. Crear un alquiler pendiente **no descuenta stock**.

Buscá por cliente, dirección o zona. Abrí una fila y volvé: búsqueda, filtros y desplazamiento se conservan. El cambio de tema no debe perder los valores del formulario abierto.

Desde el detalle podés consultar saldo, responsables, incidencias y fotos; abrir GPS y preparar un remito en WhatsApp. El mensaje no se envía solo. El contador de retiro se calcula por fecha calendario de Argentina.

## Entregar, retirar y corregir

Entregar solicita responsables y registra un único movimiento desde disponible a alquilado. Antes del retiro, revisá daños o pérdidas y su distribución. Retirar procesa el saldo completo pendiente según las reglas de inspección. Reingresar cierra el proceso y no suma las piezas por segunda vez.

La triangulación requiere origen, destino y saldo válido. Una advertencia de stock bajo no inventa disponibilidad: debe registrarse la procedencia real.

En Historial, Deshacer está limitado al autor, los primeros cinco minutos y la ausencia de movimientos posteriores incompatibles. Si no es seguro, corresponde una corrección auditada con motivo.

## Viaje

Elegí Todas, Sólo retiros o Sólo entregas y, si hace falta, una zona. En Opciones seleccioná depósito como origen o pedí GPS puntual. Cercanía usa un único origen; no incluye tráfico ni garantiza capacidad de carga. Las paradas sin coordenadas se distinguen y van al final.

Comparar cantidades usa un material y medida concretos. No convierte marcos a cuerpos sin una equivalencia confirmada.

Cambiar orden permite arrastrar desde el agarre o elegir una posición directamente. Guardar conserva el orden; Cancelar mantiene el anterior. Deshacer reconcilia las paradas todavía vigentes. Los filtros conservan las posiciones ocultas.

Abrir recorrido envía a Maps sólo las paradas visibles en su orden y el depósito al final. Puede dividirlo en tramos. Volver al depósito abre el destino fijo configurado. Planificar o abrir Maps no mueve inventario.

En equipo, el plan publicado es independiente del borrador personal. Publicar comparte de forma explícita el orden completo y sus asignaciones. Si otra persona publica primero, debe revisarse el conflicto; no se sobrescribe silenciosamente. Cargar el plan pide confirmación y conserva sólo tareas todavía vigentes.

## Copias y recuperación

Exportá periódicamente una copia JSON completa fuera de la app. Una copia con fotos necesita sus bytes; si falta una imagen, no se anuncia una copia completa.

Para importar, elegí el archivo y revisá nombre, esquema, cantidades y todos los alquileres/materiales antes de confirmar. En modo individual reemplaza el inventario: no suma ni fusiona. Se conserva una copia previa y la recuperación prevista.

Cancelar, elegir un archivo roto o fallar al leer no debe vaciar los datos. Si aparece un error de espacio o persistencia, conservá el original y comunicá el mensaje.

En equipo, restaurar abre una copia individual aislada. No reemplaza datos de otros celulares ni reenvía movimientos viejos al servidor.

## Avisos de retiro

En Ajustes → Avisos de retiro, revisá el horario y las anticipaciones3/2/1/0días antes de activar. La referencia inicial es08:00 sólo si no hay otra configuración guardada.

Cada alquiler puede heredar la configuración general o personalizarla. Cambiar el horario general afecta sólo a los heredados. Extender fechas o finalizar cancela las programaciones anteriores.

Si denegás el permiso, el alquiler se guarda igualmente y se informa que los avisos no están activos. Son avisos locales y preferencias personales por dispositivo/espacio: si dos personas los activan, ambos pueden recibirlos.

Prueba física pendiente: programá un aviso futuro; probá app abierta, segundo plano, cierre y reinicio. Al tocarlo debe abrir el alquiler correcto sin alterar stock. Android puede demorar o impedir avisos por batería, force-stop o permisos; no se promete puntualidad exacta.

## Equipo opcional

El ingreso al equipo requiere invitación privada y correo/contraseña propios. Poner un nombre no autentica una cuenta real. La invitación autoriza el alta, pero no verifica la propiedad del correo.

El primer responsable comercial todavía requiere aprovisionamiento privado. No hay contraseñas reales inventadas ni incluidas en Git/APK.

Ajustes → Equipo → Tengo invitación permite vincular el dispositivo. Sólo el responsable incorpora explícitamente una copia individual al primer equipo vacío. El segundo celular se vincula y descarga: no vuelve a sumar la misma copia.

ADMIN gestiona; OPERADOR registra las operaciones de campo permitidas. Sin red, los cambios compartidos quedan en este teléfono y son provisionales hasta confirmación del servidor.

Si hay error, reintentá sin repetir manualmente el movimiento. Una respuesta incierta se consulta antes de reenviar. Un conflicto conserva la propuesta para revisión.

**Limitación de la candidata todavía abierta:** se están corrigiendo la actualización de pantalla después de revalidar sesión y la recuperación de colas con propuestas dependientes de un conflicto. No se considera cerrado el modo compartido hasta resolverlas y probarlas.

Volver al uso individual conserva el inventario de ese modo y no publica datos automáticamente. Una fotografía compartida puede quedar pendiente sin bloquear el alquiler; sus bytes se intercambian con conexión y acceso autorizado.

## Documentos y prueba final

Desde Ajustes → Documentos, elegí filtros y generá Excel o Word para abrir/compartir. Son archivos institucionales locales; no se ofrece un PDF automático inexistente.

En tu Android deben comprobarse especialmente: actualización encima, apertura/compartir Word y Excel, cámara/galería/permisos, selector JSON, GPS, TalkBack, texto ampliado y avisos después de reiniciar. Las pruebas del navegador no sustituyen este recorrido.

Si falla, enviá versión, pantalla, pasos, mensaje exacto y si había conexión. Indicá qué quedó guardado. No publiques contraseñas, invitaciones ni una copia comercial completa. No borres datos ni desinstales como solución improvisada.
