# Avisos locales y feedback opcional

Implementación del rediseño del 18/10/2026. Este documento describe código y pruebas automatizadas; **no acredita una prueba en el teléfono del usuario**.

## Comportamiento

Cada alquiler admite **un recordatorio local, una sola vez**. En el detalle se ingresan explícitamente fecha `DD/MM/AAAA` y hora `HH:MM` de 24 horas. Ambos campos empiezan vacíos: no se supone una hora a partir de la fecha de retiro, ni hay repetición o activación automática. La fecha se interpreta en la zona local del dispositivo al elegirla y se guarda como un instante ISO; cambiar después de zona horaria no redefine el instante.

Sonido y vibración se eligen por recordatorio y empiezan apagados. Activar requiere permiso de notificaciones; denegarlo conserva el inventario y no crea un recordatorio. Si el sistema ya no permite volver a solicitarlo, se explica que debe habilitarse desde Ajustes del dispositivo. No hay solicitud de permiso en el arranque, al leer preferencias ni al reconciliar avisos.

Cambiar `fechaRetiroEstimada`, retirar/reingresar o eliminar el alquiler cancela su aviso pendiente y muestra una explicación en el detalle cuando sigue existiendo. Cambiar la fecha de retiro exige elegir nuevamente fecha y hora del aviso; no se inventa un nuevo horario. Restaurar un inventario que elimina o modifica alquileres produce la misma reconciliación. No se cambian estados, stock, cantidades, fotos ni SQLite para gestionar recordatorios.

Las confirmaciones opcionales están desactivadas inicialmente. Los avisos de texto pueden mostrarse después de una operación real: el éxito se cierra tras 6,5 segundos; un error permanece hasta cerrarlo y puede ofrecer un reintento. La reproducción opcional no determina si la operación se guardó y nunca demora su persistencia. El botón de reintento bloquea invocaciones simultáneas.

## Plataforma y sonidos

- Android utiliza `expo-notifications` con canales locales. Las confirmaciones con sonido o vibración también usan una notificación del sistema, sin banner solicitado en primer plano, que la app intenta retirar tras 6,5 segundos. La preferencia explica esta modalidad y solicita permiso al activarla. En segundo plano el sistema puede conservar el aviso más tiempo si suspende JavaScript.
- El canal utiliza audio de notificación, no de alarma, y `bypassDnd: false`; no fuerza audibilidad. Volumen, silencio, No molestar y las modificaciones que haga el usuario en los ajustes de cada canal gobiernan el resultado. No hay permisos de notificación crítica, alarma exacta o acceso a la política DND.
- Cada combinación de tipo/sonido/vibración posee un ID de canal distinto. Android mantiene las preferencias de sus canales; cambiar un switch no modifica retroactivamente el sonido de un canal ya creado ni revierte una configuración manual del sistema.
- Se incorporan los WAV originales locales `01_recordatorio_calido.wav`, `02_confirmacion_sutil.wav` y `03_atencion_suave.wav`. El plugin nativo debe incluir los tres archivos en el APK. No hay audio remoto, licencia por reproducción ni descarga al iniciar.
- El adaptador iOS usa `expo-audio` para confirmaciones, sin reproducción en silencio ni segundo plano; los recordatorios usan notificaciones locales. El destino principal de esta entrega sigue siendo Android. La configuración y reproducción iOS no se han verificado físicamente.
- Web muestra feedback textual y explica que no programa notificaciones nativas. No pide permisos de notificación ni promete avisos con el navegador cerrado.

No se registran tokens push, no se crea backend y no se utiliza Firebase, EAS, telemetría o servicios pagos para este bloque. Dependencias compatibles con el SDK instalado: `expo-audio ~57.0.5`, `expo-notifications ~57.0.23`; ambas declaran licencia MIT.

## Persistencia, concurrencia y recuperación

`src/services/feedback/reminders.ts` guarda preferencias e intenciones en AsyncStorage, clave `chema:local-feedback:v1`, separada de SQLite y del estado de inventario. Las copias institucionales del inventario no transfieren la programación ni los permisos del dispositivo. Borrar datos/desinstalar elimina estas preferencias; no debe hacerse como prueba sobre datos reales.

El motor serializa operaciones y utiliza un identificador del sistema estable por alquiler (`chema-local-reminder:<id>`). Guarda la intención antes de tocar la programación nativa, cancela la programación anterior antes de reemplazarla y marca `scheduled` solo después de la respuesta nativa y la escritura final. Un fallo conserva una intención reintentable; repetir la operación no acumula avisos. Preferencias corruptas o un fallo al escribir generan un error y no se sustituyen silenciosamente por una configuración vacía.

La reconciliación ocurre cuando el inventario está listo, cuando cambian los alquileres y al volver al primer plano. Consulta los avisos nativos y el permiso sin solicitarlo. Reintenta intenciones pendientes, cancela avisos obsoletos/huérfanos propios y conserva los de otros módulos. La revocación del permiso cancela las intenciones activas con explicación; volver a otorgarlo no las reactiva automáticamente.

Si cambia el dominio y falla la escritura de preferencias, igualmente se intenta cancelar el aviso obsoleto del sistema: el alquiler actual permite repetir esa cancelación en el siguiente intento sin revivirlo. Un fallo de cancelación de un alquiler no impide intentar cancelar los demás. Si tanto almacenamiento como sistema fallan, se informa el error y el usuario debe reintentar; no se afirma que esté cancelado con éxito.

Los avisos cuya hora pasó y ya no figuran programados se marcan transcurridos y no se repiten. Su ausencia **no demuestra que se hayan mostrado o leído**. Un aviso previamente programado que el sistema aún mantiene después de la hora se conserva para permitir su entrega demorada, sin duplicarlo.

## Límites reales

La hora es la solicitada al sistema, no una garantía de puntualidad: ahorro de batería, Doze, permisos, canales, teléfono apagado y políticas del fabricante pueden retrasar o impedir la presentación. El aspecto lo decide Android. No hay ejecución de servidor ni garantía después de forzar la detención de la app; al abrir nuevamente se reconcilia lo que devuelve el sistema.

No existe acción rápida que retire materiales desde una notificación, ni se confirma una operación al tocar o cerrar un aviso. La notificación recuerda revisar el alquiler en la app; no se implementó una ruta especial ni un cambio automático del inventario. Un recordatorio ya entregado no se recupera como si todavía estuviera pendiente al modificar el alquiler.

## Evidencia automatizada

Comando del bloque:

```sh
npx vitest run tests/local-reminders.test.ts tests/local-notifications.test.ts tests/local-feedback-web.test.ts
```

Resultado registrado: **30 pruebas pasando**. Incluyen almacenamiento inicial/final fallido, recuperación tras interrupción, intención durable, doble activación, activar/cancelar simultáneos, cancelación nativa fallida, cancelaciones independientes, cambios de fecha/estado/eliminación, permiso denegado/revocado y solicitud concurrente única, fechas inválidas, avisos vencidos/demorados, canales sin bypass DND y fallback web honesto. Los adaptadores nativos se prueban con mocks; esto no verifica el sistema Android real. Typecheck y ESLint de estos módulos también se ejecutaron correctamente.

## Prueba breve en Android del usuario

Utilizar un alquiler de prueba claramente identificado, sin mover stock ni importar datos reales para probar avisos. Conservar una copia mediante el flujo habitual antes de pruebas generales de actualización. No borrar datos, reinstalar con otra firma ni cambiar manualmente el reloj del teléfono.

1. Abrir Ajustes y comprobar que confirmaciones, sonido y vibración estén inicialmente apagados; navegar entre pantallas sin solicitudes de permiso ni tonos.
2. En el alquiler de prueba, introducir una fecha/hora de unos minutos más adelante, dejando sonido/vibración apagados. Activar; denegar permiso cuando corresponda. Comprobar error legible y que el alquiler/materiales permanezcan iguales. Conceder el permiso desde Ajustes Android si no vuelve a preguntarlo, regresar y activar explícitamente otra vez.
3. Activar un aviso futuro, salir y volver a entrar al detalle, cerrar/reabrir la app y comprobar la misma hora elegida y un único aviso. Repetir con dos toques rápidos en Activar; no deben aparecer duplicados.
4. Programar otro aviso de prueba, desactivarlo y esperar su hora. No debe presentarse. Cambiar la fecha estimada de retiro y comprobar que se explique la cancelación y se solicite una nueva elección de fecha/hora.
5. Con fixtures separados y sin material real, comprobar cancelación al retirar/reingresar/eliminar. Si no se dispone de datos de prueba seguros, omitir esta parte y dejarla pendiente; no ejecutar movimientos reales solo para probar una notificación.
6. Probar por separado sonido, vibración y ambos apagados. Comprobar con pantalla bloqueada, app en segundo plano, volumen de notificación bajo, silencio y No molestar. Revisar el canal concreto en Ajustes Android: una configuración manual del sistema puede prevalecer sobre el switch de la app.
7. Activar confirmaciones opcionales y sus controles; comprobar explicación y permiso. Confirmar una operación de prueba realmente guardada: un solo feedback, tono elegido y aviso del sistema retirado al seguir activa la app. Desactivar confirmaciones: ninguna reproducción en operaciones siguientes.
8. Revocar permiso desde Ajustes Android, volver a la app y comprobar cancelación explicada sin nuevas solicitudes espontáneas. Volver a otorgarlo: debe requerirse activar nuevamente el recordatorio.
9. Anotar modelo, versión Android, versión/code del APK, permisos/canal usados, fecha/hora esperada y observada, estado de batería/primer plano y resultado de cada paso. El reporte debe distinguir claramente prueba física, emulador y mocks.

Pendiente al redactar: comprobación física de permiso Android, presentación/sonido/vibración, silencio/DND, persistencia real después de reinicio, políticas de batería y recurso WAV dentro del APK final. No se declaran medidas de FPS o batería.

## Recursos Android

El plugin Expo exige nombres que comiencen con letra. Los WAV originales se conservan en docs/diseno-papel-cobalto/sonidos-v2 y se incluyen sin modificar sus bytes como assets/sounds/chema_recordatorio_calido.wav, chema_confirmacion_sutil.wav y chema_atencion_suave.wav. La validación del plugin (más estricta que aapt2 compile aislado) rechazó los nombres numéricos originales en el primer prebuild; se corrigió antes de Gradle.
