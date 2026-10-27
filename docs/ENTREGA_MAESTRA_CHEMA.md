# Entrega maestra Chema — estado real al27/10/2026

**Todavía no es una entrega final ni hay APK1.7.0 publicado.** Se completaron bloques de implementación y pruebas; quedan correcciones de recuperación, regresión final y compilación.

## Código y respaldo comprobados

Repositorio privado kkshiiit/repartos-chema. Fuente confirmada: `1a9355aa24ed3a7e38769bfdd3220be88addee53`, rama `feat/chema-maestro-etapa2`. Main conserva la base anterior81cd39a. El checkpoint posterior se guarda en CONTINUIDAD_CODEX.

Commits principales:13399f2 autorización/respaldo; d456ade sistema visual; a8fdd39 revisión JSON;6018528 alquileres; f7348bd Viaje;94bd97d equipo transaccional; dff2864 Auth remoto;0f4f5a6 recuperación;1a9355a fotos privadas, plan publicado y guardas de integridad.

Respaldo original verificado y restaurado: /workspace/respaldos/etapa2-base-2026-10-26/repartos-chema-e133ae4.zip. La firma privada está fuera de Git. La fuente actual está en GitHub; el ZIP final debe generarse y verificarse antes de Gradle.

## Implementación realizada

- Expo57/RN0.86 y SQLite conservados. Sistema Modern Dark y claro, fuentes Geist/Mono locales licenciadas, cuatro pestañas inferiores y componentes compartidos. Sin nueva biblioteca visual pesada.
- Alquileres en filas compactas por urgencia, Hoy incluye entregas y retiros, dirección/material/medida visibles. Búsqueda por cliente/dirección/localidad y contexto de lista conservado.
- Alta en tres pasos, detalle y operaciones existentes. Crear pendiente no descuenta stock. Retiro completo, reingreso sin doble suma, incidencias, transferencias, auditoría y deshacer mantienen el motor original.
- Viaje con filtros por tarea/zona, distancia estricta desde un origen elegido, comparación literal por material/medida, editor de posiciones, guardar/cancelar/deshacer y reconciliación. Maps recibe visibles en orden y depósito final.
- Copia JSON con metadata y revisión completa virtualizada. Cancelar no modifica datos. Restauración individual explícita con copia previa; en equipo abre recuperación individual aislada.
- Equipo opcional sobre Supabase Free autorizado: Auth real, invitación privada de un uso, roles en servidor, outbox SQLite por usuario/espacio, recibos idempotentes, CAS y tarea comercial estable.
- Fotos compartidas privadas con cola independiente, validación JPEG/hash y caché aislada. El fallo de una subida no bloquea guardar el alquiler.
- Publicación explícita del plan de Viaje, asignaciones por miembro, revisión esperada y últimas50versiones. Los filtros personales no publican.
- Avisos existentes con herencia3/2/1/0, ámbitos separados y diario durable para recuperar cancelaciones fallidas.

## Ubicación de acciones

|Destino|Acciones|
|---|---|
|Alquileres → fila → detalle|Entregar/retirar, carga, responsables, incidencias, fotos, remito/WhatsApp, GPS y correcciones|
|Depósito → menú de pieza|Editar, mover, ajustar y recuperar; Combos en cabecera|
|Viaje|Cambiar orden, Opciones, origen, criterios, Maps, regreso y plan publicado|
|Historial|Filtros y deshacer con límites de autor/plazo/revisión|
|Ajustes|Datos, copias, recuperación, documentos, apariencia, avisos, responsables y equipo|
|Equipo|Ingreso/vinculación real, miembros, invitaciones, revocación e incorporación explícita al equipo vacío|

## Pruebas comprobadas

|Entorno|Resultado guardado|Alcance|
|---|---|---|
|Node/check|514/514 en57archivos; tipos/Functions correctos; lint0errores/1warning histórico|Corte integrado anterior al último guard de cursor|
|PostgreSQL17 + SQLiteNode reales|14/14|Concurrencia, idempotencia, bootstrap, permisos, rutas y reincorporación|
|Auth/Edge/PostgreSQL remotos reales|8/8|Dos cuentas sintéticas, devolución, última unidad, timeout/recibo y revocación|
|Auth/Edge/Storage remotos reales|5/5|JPEG sintético, reintento, descarga privada y acceso público rechazado|
|Chromium local|7/7|Depósito, Viaje, conservación de contexto e importación sintética|
|Chromium y Auth real|2/2|Dos contextos acceden al mismo equipo, con roles distintos|
|Android físico|No ejecutado|Instalación, cámara, GPS, notificaciones, selector, lector y rendimiento pendientes|

Evidencia en docs/evidencias-etapa2; capturas web antes/después y ambos temas en artifacts/capturas/maestro-etapa2. No sumar repeticiones como pruebas únicas. Se conservan los intentos fallidos y sus correcciones.

Después del último guard de cursor quedaron procesos para check final, QA de rutas y build web. El entorno se interrumpió: sus resultados deben recuperarse antes de anunciar más pruebas aprobadas.

## Correcciones pendientes de cierre

La revisión señaló dos problemas importantes confirmados por inspección de código, todavía sin reproducción/corrección final: suscripción de pantalla al revalidar la misma cuenta y recuperación de una cola con propuestas dependientes de un conflicto. AUTOAUDITORIA_IMPLEMENTACION_CHEMA detalla síntomas, archivos y pruebas necesarias.

También debe comprobarse un posible hueco de historial al combinar páginas después de una desconexión larga. El borrador de formulario conserva valores entre pasos/errores/temas, pero no se anuncia persistencia general tras matar el proceso antes de guardar.

Faltan regresión completa integrada, capturas finales de ventanas/secundarios y contraste, actualización de la matriz94IDs, provisión privada del responsable y recuperación operativa, limpieza restringida de QA, ZIP final y APK.

## APK: identidad y publicación

Candidata fuente1.7.0/code11. Paquete conservado: `com.grupochema.repartos`. Certificado conocido SHA256: `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`.

El APK anterior1.6.1/code10 no contiene esta etapa. La instalación denominada2.0 no está identificada: no se certifica actualización sobre ella ni se pide desinstalar.

Antes de publicar: corregir los hallazgos, cerrar las pruebas, commit/push, ZIP restaurado/SHA y Gradle completo con firma existente. Verificar paquete, versión, ABI, minSDK, firma, tamaño, CRC y SHA. Publicar archivo nuevo en descargas, conservar anteriores y recuperar bytes de GitHub para cotejar hash. No hay enlace de APK nuevo porque ese archivo aún no está generado y verificado.

## Costo y límites

La aplicación individual funciona sin cuenta, servidor o Internet. La colaboración usa el proyecto Supabase Free autorizado lttfkynkhveomntejqhc en kkshiiit; cinco migraciones aplicadas y Edgechema-api v4. Sin facturación, tarjeta, addon pago, Firebase obligatorio, hosting adicional o publicidad.

Free tiene cuotas y posibles pausas/cambios: no se promete gratuidad ilimitada. Los cambios offline compartidos son provisionales hasta confirmación autoritativa. No hay sincronización garantizada con app cerrada.

El estado comercial se recibe como snapshot completo con cursor monotónico e historial paginado aparte. No se afirma recepción incremental de entidades. Las fotos borradas lógicamente se retienen para recuperación; es necesario vigilar cuota antes de una limpieza autorizada.

No se creó una cuenta comercial real. Los datos remotos actuales son exclusivamente QA sintética y deben limpiarse de forma controlada. El archivo exacto de cinco pedidos tampoco está disponible; la fixture sintética no lo reemplaza.

## Bloqueo actual y próxima acción

El entorno de ejecución informa pending/offline y rechaza comandos. GitHub sí está accesible, por lo que el checkpoint y estos informes se respaldan mediante su conector. No se modificó más código ni se ejecutaron nuevas pruebas durante ese bloqueo.

Al recuperarse: leer CONTINUIDAD_CODEX, preservar el trabajo local, integrar los commits documentales, comprobar logs pendientes y ejecutar primero las correcciones de recuperación. Después cerrar QA, respaldo y compilación. No existe una continuidad automática confirmada fuera de una ejecución activa.
