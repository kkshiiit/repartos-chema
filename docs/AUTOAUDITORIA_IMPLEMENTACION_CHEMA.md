# Autoauditoría de implementación — 27 de octubre de 2026

**Estado: implementación avanzada, cierre y APK pendientes.** Fuente comprobada en GitHub: `1a9355aa24ed3a7e38769bfdd3220be88addee53`, rama `feat/chema-maestro-etapa2`. No equivale a main ni al APK1.6.1 anterior. Este informe complementa la auditoría base y distingue presencia de código, pruebas ejecutadas y aceptación física.

## Hallazgos abiertos antes del APK

|Gravedad|Hallazgo y evidencia|Impacto|Corrección y comprobación necesarias|
|---|---|---|---|
|Alta|SharedInventoryProvider cancela la suscripción cuando cambia getRepo/media; getRepo devuelve temprano si ya existe repoRef. Comprobado en código de GitHub, todavía sin reproducción automatizada.|Revalidar la misma cuenta puede dejar la pantalla sin recibir cambios aunque el repositorio guarde y sincronice.|Suscribir/desuscribir desde el efecto aun al reutilizar el repositorio; probar revalidación, operación y actualización visible. Comprobar aislamiento al cambiar espacio con el mismo usuario.|
|Alta|dismissConflict rechaza retirar un conflicto si hay propuestas dependientes, y sync se detiene en el primero. La UI ofrece esa misma acción.|Una cola con conflicto inicial y cambios posteriores puede quedar sin salida práctica.|Archivar explícitamente y de forma atómica la rama rechazada y sus dependientes definitivamente no enviados; permitir consultar/exportar lo archivado. Conservar intentos inciertos hasta consultar recibos; nunca reenviar dependientes automáticamente. Probar cierre/reapertura y fallo de escritura.|
|Por verificar|loadHistory combina páginas manteniendo el cursor mínimo global.|Podría quedar un hueco de eventos tras una desconexión larga si se salta desde una página antigua al lote reciente.|Reproducir con más de una página de eventos nuevos; comprobar que cargar más recorre también el intervalo intermedio, sin duplicar ni marcar una cronología incompleta como completa.|
|Operativa|No se aprovisionó todavía una cuenta comercial responsable ni un procedimiento de recuperación de acceso validado.|El modo individual funciona, pero la incorporación comercial al equipo aún necesita una invitación privada inicial.|Preparar un alta privada de un uso, sin credenciales en Git/APK; documentar recuperación por responsable del proyecto. No presentar correo aprovisionado como correo verificado.|
|Prueba externa|No hay APK exacto de la instalación llamada2.0 ni JSON exacto de cinco pedidos.|No se puede certificar compatibilidad con esa instalación ni importación de ese archivo concreto.|Conservar datos y app instalada; solicitar los insumos cuando se prueben esos casos. No sustituirlos por APK1.6.1 o fixture sintética.|
|Prueba física|No hubo teléfono Android conectado ni emulador validado.|No están comprobados instalación encima, cámara, selector content://, GPS, TalkBack, notificaciones tras reinicio ni rendimiento del APK.|Recorridos reproducibles en Android, sin desinstalar ni borrar almacenamiento. Las pruebas web no acreditan estas funciones físicas.|

La revisión independiente se interrumpió por límite de uso después de señalar los dos primeros hallazgos. No se declara revisión final aprobada. El entorno remoto después quedó pendiente/fuera de línea; la corrección y nuevas pruebas requieren recuperar ejecución.

## Defectos corregidos con evidencia

|Gravedad|Problema comprobado|Corrección y evidencia|Límite|
|---|---|---|---|
|Crítica|La misma devolución con UUID distintos o dos entregas de la última unidad podrían duplicar efectos.|Tarea comercial estable, mismo motor de dominio, bloqueo/CAS y recibos. Pruebas PostgreSQL/SQLite y dos identidades Auth reales.|Aceptación con dos teléfonos pendiente.|
|Alta|Una renovación tardía podía revivir una sesión cerrada o enviar la cola de A con token de B.|Generaciones, renovación compartida, publicación serializada del vault y expectedUserId en cliente/servidor; pruebas RED→GREEN.|SecureStore físico pendiente.|
|Alta|RPC void devuelve HTTP204 y el cliente intentaba leer JSON.|Aceptar respuesta vacía; prueba HTTP y flujo Auth remoto posterior8/8.|Desplegado, sin afirmar prueba física.|
|Alta|Fallo al cancelar avisos al cambiar espacio perdía el intento.|Diario durable previo, serialización por almacenamiento y recuperación al abrir/reconciliar; prueba de dos espacios y reinicio del servicio.|Cancelación del sistema operativo real pendiente.|
|Alta|Auth401 al renovar no se distinguía de fallo de red.|Error de sesión con status401, bloqueo de envíos y puerta de acceso que oculta la caché sin borrarla; pruebas de comportamiento.|La suscripción al revalidar sigue siendo el hallazgo abierto anterior.|
|Alta|Viaje podía reconciliar contra inventario inicial todavía sin hidratar y perder orden al recargar.|Esperar inventoryReady. Reproducción previa y siete recorridos de interfaz posteriores aprobados.|Gesto/GPS del APK pendientes.|
|Alta|Las fotos compartidas carecían de intercambio privado durable y las URI locales no son portables.|Referencia lógica, cola independiente, JPEG≤1024px/2MiB, SHA256, Storage privado y caché por espacio/usuario; cinco comprobaciones remotas reales con JPEG sintético.|Cámara y subida desde Android pendientes.|
|Alta|Una escritura nativa incompleta de foto dejaba un archivo vacío que bloqueaba el reintento seguro.|Archivo provisional verificado antes de publicar; prueba RED obtuvo archivo vacío, GREEN permite recuperar sin pisar original.|Filesystem simulado, no dispositivo.|
|Alta|Restaurar una copia en equipo podría reemplazar datos ajenos o repetir operaciones.|Recuperación en namespace individual nuevo; pruebas de aislamiento y conservación de originales.|No se implementa una fusión global silenciosa.|
|Alta|Una respuesta antigua podía reducir el cursor y volver a datos confirmados anteriores.|Guardia monotónica por generación, prueba RED→GREEN del repositorio.|La suite general posterior estaba en curso; comprobar su log.|
|Alta|Reincorporar una cuenta revocada con invitación nueva chocaba con la PK de membresía.|Migración conserva identidad y rol, reactiva sólo con invitación nueva autorizada; PostgreSQL14/14. Reusar invitación consumida no reactiva.|Prueba Auth remota adicional pendiente de recuperar su log.|
|Media|Cambiar planes podía sobrescribir el trabajo de otra persona o perder asignaciones personales.|Publicación explícita con revisión esperada, historia y borrador separado durable; pruebas SQL/componentes. Filtros personales no publican.|Cerrar QA remota y visual integrada.|
|Media|El test de depósito encontró dos textos iguales y el test de Viaje dependía del orden DOM virtualizado.|Acotar texto al panel y seleccionar la parada por su número visible. No se borró información útil para satisfacer el test.|Siete casos posteriores pasan.|

## Incidencias de ejecución conservadas

Se mantienen los registros fallidos: importación de Flow nativo en un test Node, primer test .tsx fuera de la selección de Vitest, build web durante edición de un archivo aún inexistente y selectores ambiguos. Se corrigieron las causas y se ejecutaron pruebas posteriores pertinentes. Un intento sin archivos de prueba no se contó como aprobado; un fallo de build temporal no se presentó como APK distribuido.

## Resultados comprobados

- `npm run check`:514/514 en57archivos; TypeScript y build de Functions correctos; lint0errores y1advertencia histórica de AxeBuilder.
- PostgreSQL17 real en Docker y SQLiteNode:14/14, incluidos los once casos originales y extensiones de rutas/reincorporación.
- Auth/Edge/PostgreSQL reales:8/8 con dos cuentas sintéticas.
- Fotos privadas en Auth/Edge/Storage reales:5/5 con JPEG sintético de1px.
- UI local afectada:7/7. UI con dos contextos y Auth real:2/2.
- Capturas web reales antes/después y ambos temas en `artifacts/capturas/maestro-etapa2/`. No son capturas nativas.
- Un guard de cursor y pruebas focales se agregaron después de la suite general514; revisar el log posterior antes de publicar otro total.

No sumar ejecuciones repetidas para anunciar más pruebas únicas. No dar por terminadas las suites que quedaron en curso cuando el entorno se interrumpió.

## Seguridad e integridad

El servidor ejecuta el mismo applyOperation; la UI no tiene otro motor de stock. RETIRE retira el saldo completo después de registrar incidencias. REENTER no vuelve a sumar. Deshacer conserva autor, plazo de cinco minutos y revisión global. La unidad de cuerpos no se inventa: se compara material/medida literal.

RLS está habilitado; RPC privilegiadas sólo son ejecutables por service_role. Edge valida Auth y membresía, con una excepción de aprovisionamiento que requiere invitación privada de alta entropía y un uso. verify_jwt=false en el gateway no habilita lectura pública: la función realiza validación real y SQL vuelve a comprobar acceso. El cliente contiene sólo URL y clave publicable.

Sesión nativa en SecureStore; web en memoria. La revocación impide acceso remoto y oculta el contenido al conocerse, pero no borra una copia local previamente autorizada. No se promete borrado remoto de archivos ni revocación instantánea estando sin conexión.

## Decisiones y límites operativos

- El modo individual sigue sin cuenta ni backend obligatorio. Firebase legado permanece en el árbol, pero no se inicializa para esta modalidad; no se afirma que su SDK fue eliminado.
- Supabase Free fue autorizado en kkshiiit, sin tarjeta ni plan pago activados. Tiene cuotas, pausa y cambios posibles de condiciones; no se garantiza gratuidad ilimitada.
- El intercambio actual usa snapshot comercial completo con cursor monotónico e historial separado paginado. No se anuncia un motor incremental de entidades que todavía no existe. Transferencia, tamaño y contención limitan el crecimiento.
- Los binarios de fotos borradas lógicamente se retienen para copias/deshacer. Esto evita pérdida irreversible, pero requiere vigilancia de cuota y limpieza posterior autorizada.
- Restaurar una copia compartida abre un espacio individual aislado; no fusiona ni reemplaza el equipo.
- No hay publicidad, servicios pagos activados, firma nueva ni cambios al identificador Android.
- Fuente candidata1.7.0/code11, mismo paquete y certificado conocidos. Aún no hay APK1.7.0 comprobado/publicado.
- El checkpoint remoto permite retomar tras la caída. No hay promesa de trabajo automático fuera de una ejecución activa.
