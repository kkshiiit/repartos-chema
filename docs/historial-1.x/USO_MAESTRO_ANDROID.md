# Uso y prueba en Android — Repartos Chema

Guía de la edición maestra 1.7.0. La versión exacta disponible, enlace privado, commit fuente, firma, SHA256 y resultados finales se registran en [ENTREGA_MAESTRA_CHEMA.md](ENTREGA_MAESTRA_CHEMA.md). No uses el APK1.6.1 histórico como si incluyera esta etapa. La validación automatizada en navegador/servidor no acredita instalación o uso en un Android físico.

## Actualizar conservando datos

1. En la instalación actual, entrá a Ajustes → Datos y exportá una copia JSON fuera de la app, por ejemplo a Descargas. Si hay fotografías, verificá que la copia incluya sus bytes y que no anuncie imágenes faltantes. Conservá también cualquier archivo original de importación.
2. Abrí el enlace de la entrega en Chrome con la cuenta GitHub autorizada, kkshiiit. El repositorio es privado: sin esa sesión puede aparecer404. En la ficha del APK elegí **Download raw / Descargar archivo sin procesar**. Comprobá versión y tamaño contra la entrega.
3. Abrí el instalador y elegí **Actualizar**. **No desinstales ni borres almacenamiento.** Si Android rechaza firma, versión o paquete, detené la actualización y enviá el mensaje exacto. No intentes resolverlo borrando el inventario.
4. Después de actualizar compará cantidades por pieza y estado, alquileres, responsables, fechas, fotos, historial y tema. Activá modo avión, cerrá y volvé a abrir: el inventario individual debe conservarse.
5. La identidad conocida se compara con1.6.1/code 10. La instalación llamada «2.0» todavía no fue identificada: no se certifica que este APK actualice esa instalación sin comprobar sus metadatos/certificado. Tampoco se probó aquí una actualización en tu teléfono.

## Empezar en modo individual

Entrá con tu nombre. Este modo no necesita cuenta, servidor ni conexión; una instalación nueva empieza sin inventario ni alquileres ficticios. Tu nombre identifica los registros locales, pero no autentica una cuenta remota.

No importes datos sintéticos sobre inventario comercial para hacer pruebas. Si la app ya tiene datos, los conserva; no se vacían automáticamente para empezar de nuevo.

En Depósito agregá cada pieza con su medida y cantidad, registrando la procedencia. El menú de la pieza contiene editar, mover existencias, ajustar y recuperar. «Alquilados» es el material que todavía está fuera; «A reparar» y «Perdidos» tienen salidas auditadas. Un ajuste exige revisar cantidades y motivo.

## Crear, entregar y retirar

1. En Alquileres tocá Nuevo alquiler. Completá cliente, contacto, dirección, localidad, entrega prevista y **Alquilado hasta**. Esta última fecha alimenta el contador y los avisos de retiro.
2. Prepará la carga por material/medida. Podés aplicar un combo y revisar sus cantidades antes de guardar. Un apodo describe esa carga; no crea otra identidad de material.
3. Revisá el resumen. Guardar como pendiente **no descuenta stock**. Una advertencia de stock bajo no inventa disponibilidad: registrá la procedencia real o la transferencia desde otro alquiler.
4. En el detalle, Entregar solicita responsables y mueve una sola vez disponible→alquilado. La fecha prevista y la fecha efectiva se conservan por separado.
5. Antes de Retirar registrá pérdidas o daños y revisá su distribución. El retiro procesa el saldo completo pendiente según las reglas reales del inventario. Los dañados pasan a reparación y los perdidos a su estado correspondiente.
6. Reingresar cierra el proceso sin sumar las mismas piezas otra vez. Recuperaciones y correcciones quedan en Historial. La triangulación exige origen, destino y saldo disponible reales.

El contador usa días calendario de Argentina: hoy, mañana, días restantes o atraso. Una fecha inválida antigua aparece como sin fecha y puede completarse. Al retirarse el saldo, se muestra su estado final sin contador pendiente.

Buscá por cliente, dirección o localidad. Las agrupaciones priorizan atrasados y tareas de hoy; Hoy incluye entregas y retiros. Las acciones secundarias están en el detalle. Al volver se conservan búsqueda, filtros y desplazamiento. Claro/Oscuro/Sistema se configura en Ajustes; el botón de cabecera cambia rápido sin borrar el formulario.

## Historial y correcciones

Historial permite filtrar y consultar autor, fecha, alquiler y movimientos. **Deshacer** está limitado al autor, los primeros cinco minutos y la ausencia de movimientos posteriores incompatibles. Crea un registro nuevo: no borra la evidencia. Si no es seguro, registrá una corrección compensatoria con motivo.

En equipo puede haber más páginas disponibles. «Cargar más» continúa la cronología incluso si llegaron eventos nuevos después de haberla agotado. Una copia del teléfono sólo contiene la historia efectivamente disponible allí.

## Viaje

Elegí Todas, Sólo retiros o Sólo entregas y, si hace falta, una zona. En Opciones seleccioná depósito como origen o pedí ubicación GPS puntual. Si denegás GPS, usá un origen manual o el depósito. Cercanía usa ese único origen, sin prioridades escondidas; no incluye tráfico ni garantiza capacidad de carga. Las paradas sin coordenadas van al final y se distinguen.

La comparación de cantidades usa un material y una medida concretos. No convierte piezas a «cuerpos» sin una equivalencia confirmada. Una cantidad desconocida no se presenta como cero.

Cambiar orden permite arrastrar desde el agarre o elegir una posición directamente. Fuera del agarre se puede desplazar la lista. Guardar conserva el borrador; Cancelar mantiene el orden anterior. Deshacer respeta las paradas todavía vigentes. Reordenar una vista filtrada conserva las posiciones ocultas y no revive alquileres cerrados.

Abrir recorrido envía a Maps las paradas visibles en su orden y el depósito al final; puede dividirse en tramos. Volver al depósito abre el destino fijo configurado. Ordenar o abrir navegación no mueve inventario.

En equipo, publicar el plan es una acción explícita distinta del borrador personal. Comparte orden y asignaciones, con autor y revisión. Si otra persona publicó primero, revisá el conflicto: no se sobrescribe silenciosamente. Cargar un plan conserva sólo tareas vigentes. Los filtros personales no lo publican.

## Copias JSON y recuperación

Exportá regularmente la copia fuera de la app y conservá más de una versión. El teléfono puede perderse; una copia guardada sólo dentro de la misma instalación no alcanza como respaldo externo.

Al importar, revisá archivo, esquema, cantidades y la lista completa de alquileres/materiales antes de **Restaurar esta copia**. En modo individual es un reemplazo explícito, sin suma ni fusión, con respaldo previo. Cancelar, elegir un JSON roto o fallar al leer/escribir no debe vaciar los datos. Ante un error de almacenamiento, conservá el original y reportá el mensaje.

**En equipo la restauración abre una copia individual aislada.** No reemplaza el servidor ni reenvía movimientos de una cola vieja. Su JSON identifica `LOCAL_CACHE_ONLY`: protege la proyección local, propuestas y el historial disponible en ese teléfono. No es un backup completo de todos los eventos remotos, usuarios o archivos del servidor. El respaldo administrativo requiere además SQL y objetos de Storage con un manifiesto; un dump SQL no incluye las fotografías.

El archivo exacto `repartos-chema-5-pedidos-whatsapp.json` no estuvo disponible en esta auditoría. Su importación concreta sigue pendiente; una prueba con cinco pedidos sintéticos no lo reemplaza.

## Avisos de retiro, sonido y fotos

En Ajustes → Avisos de retiro revisá el horario y las anticipaciones 3/2/1/0 días antes de activar. La referencia inicial es 08:00 si no existe otra preferencia guardada. Se pide permiso al activar. Si se deniega, el alquiler se guarda normalmente y se informa que no hay avisos activos.

Cada alquiler puede heredar la configuración general o personalizarla. Cambiar el horario general reprograma sólo los heredados; volver a general recupera esa herencia. Extender la fecha, completar el retiro o restaurar una copia reconcilia avisos pendientes. Los avisos pasados no se disparan juntos. Una notificación no mueve stock.

Son avisos locales y preferencias por dispositivo/espacio: dos personas que los activen pueden recibirlos en ambos teléfonos. No se promete exactitud bajo ahorro de batería, force-stop, permisos denegados o reinicio sin comprobarlo en el dispositivo. Tonos y háptica son opcionales; los canales de Android pueden conservar elecciones previas del usuario.

Desde el detalle se puede tomar o elegir una foto, con permiso y reducción/compresión. En individual se conserva localmente; en equipo puede quedar en cola de subida sin bloquear el alquiler. Una URI local no es una foto accesible para otro teléfono: para compartirla deben confirmarse sus bytes y autorización. Las pruebas de cámara, permisos y reintento físico siguen pendientes.

## Equipo opcional y conflictos

El modo individual sigue funcionando aunque no se configure equipo. La modalidad compartida usa Supabase Free autorizado; no exige activar Firebase, facturación, tarjeta, SMS ni SMTP pago. **Free tiene cuotas y puede pausarse**: no garantiza capacidad infinita ni backup automático completo. Si el servicio no está disponible, conservá los cambios pendientes; no repitas manualmente el mismo movimiento para forzar su envío.

El equipo exige invitación privada de un uso y correo/contraseña propios. Poner un nombre no autentica remotamente. La invitación autoriza el alta, pero no demuestra propiedad del email. No hay un correo de recuperación ya validado por esta prueba; la recuperación administrativa exige control autorizado del proyecto y un procedimiento seguro. No compartas contraseña ni invitación por Git o capturas públicas.

El primer responsable comercial aún necesita aprovisionamiento privado. No se creó una cuenta comercial ficticia. El ADMIN gestiona el equipo y operaciones administrativas; OPERADOR registra las operaciones de campo permitidas. Ocultar un botón no reemplaza las reglas del servidor.

Ajustes → Equipo permite entrar, vincularse, consultar miembros y reintentar. Sólo el responsable incorpora explícitamente una copia individual al primer equipo vacío. El segundo celular se vincula y descarga, sin volver a sumar esa copia.

Un cambio sin conexión se guarda primero en el teléfono y es **provisional** hasta que el servidor lo confirme. Una respuesta incierta se consulta antes de reenviar. Un conflicto conserva la propuesta; no se fusionan cantidades de stock silenciosamente.

Si un rechazo tiene cambios dependientes definitivamente no enviados:

1. Abrí Ajustes → Equipo y revisá el motivo y las propuestas pendientes.
2. Elegí **Archivar rechazo y dependientes sin enviar** y leé la confirmación. La acción conserva originales, motivo y contexto en el teléfono, y retira esa rama de la cola sin mover stock remoto.
3. Consultá **Propuestas archivadas** y, si hace falta, **Exportar estas propuestas**. El archivo no se reenvía automáticamente ni exporta el snapshot de stock del equipo.
4. Revisá el inventario confirmado y registrá una corrección nueva con motivo. Los intentos inciertos o ya enviados no se archivan como si nunca hubieran salido: primero se verifica su recibo.

Cerrar sesión o volver a individual no reasigna la cola a otra persona. La revocación conocida bloquea acceso remoto; no promete borrar instantáneamente una copia previamente vista por un teléfono offline.

## Documentos

Ajustes → Documentos permite elegir filtros y generar Excel o Word institucionales localmente para abrir/compartir. El remito contiene cliente, dirección, fechas, materiales/medidas, cantidades y responsables. WhatsApp prepara un texto para que vos decidas enviarlo; no lo manda solo. No hay PDF automático anunciado como implementado.

La descarga web se prueba por separado de Android. Abrir y compartir Word/Excel desde el APK requiere aceptación con las aplicaciones disponibles en tu teléfono.

## Prueba breve en tu Android y en un segundo teléfono

Usá datos sintéticos claramente identificados y conservá antes un respaldo externo. No reemplaces inventario comercial ni desinstales para probar.

| Paso | Acción                                                                                              | Resultado esperado                                                                                                                                                |
| ---- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Actualizar encima y reabrir en modo avión                                                           | Se conservan inventario, alquileres, fotos, historial y tema. Si Android rechaza, detenerse sin borrar datos.                                                     |
| 2    | En un espacio de prueba crear una pieza, un alquiler pendiente y prepararlo                         | El pendiente no descuenta; la entrega descuenta una sola vez y registra responsables.                                                                             |
| 3    | Retirar con incidencia y luego reingresar                                                           | La distribución coincide con la inspección; reingresar no suma otra vez.                                                                                          |
| 4    | Cambiar tema con un formulario abierto, ampliar texto y usar Atrás/teclado/TalkBack                 | Valores conservados; controles alcanzables y lectura/foco coherentes.                                                                                             |
| 5    | Exportar JSON, cancelar una importación y restaurar sólo una copia sintética revisada               | Cancelar no altera; copia previa disponible; reapertura conserva lo confirmado.                                                                                   |
| 6    | Probar cámara/galería, Word/Excel, GPS/Maps y un aviso futuro                                       | Permisos/errores claros; archivos abren; navegación correcta; tap del aviso abre el alquiler sin mover stock. Repetir segundo plano/reinicio y registrar demoras. |
| 7    | Con el equipo aprovisionado, vincular dos cuentas con roles distintos                               | Ambos reciben el mismo inventario; OPERADOR no ejecuta ajustes reservados. El segundo no vuelve a incorporar la copia inicial.                                    |
| 8    | En ambos teléfonos proponer el retiro del mismo alquiler o la entrega de la última unidad sintética | Sólo uno queda confirmado; el otro conserva una propuesta/conflicto revisable, sin stock negativo.                                                                |
| 9    | En B cortar red, guardar, cerrar/reabrir y recuperar conexión                                       | Pendiente durable; después recibe confirmación o conflicto, sin duplicar. No prometer envío mientras la app está cerrada.                                         |
| 10   | Publicar ruta en A y revisar/cargar en B; provocar un conflicto de revisión                         | Autor y versión visibles; no se pisa una publicación posterior ni se mueven existencias por ordenar.                                                              |

Si falla, enviá **versión y code, modelo/Android, paso, esperado, observado, mensaje, conectividad y captura**. Indicá qué quedó guardado. No envíes contraseñas, tokens, invitaciones ni una copia comercial completa. Conservá la instalación y los archivos originales para diagnosticar.
