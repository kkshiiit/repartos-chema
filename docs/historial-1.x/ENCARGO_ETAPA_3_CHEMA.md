# Encargo de auditoría de cierre — 27/10/2026

Adjunto íntegro. SHA256: `2ea87b63b13140613a43e7ea7b0e168952ef5f51cd51462f1655439c1ade1513`.

REPARTOS CHEMA — ETAPA 3: AUDITORÍA DE CIERRE CON CORRECCIONES
USO: pegar después de la implementación y entrega de 02-Codex-implementar-y-entregar-Chema.txt. Puede ejecutarse en la misma conversación o en una nueva con acceso al repositorio; la especificación debe estar conservada en GitHub.

Auditá y cerrá el encargo unificado de Repartos Chema en kkshiiit/repartos-chema. No aceptes el resumen del implementador como prueba de que funciona. Leé código, pruebas, capturas, registros y artefactos reales. La autorización incluye reproducir, corregir defectos dentro del alcance, verificar, hacer commits/push y reconstruir/publicar un APK nuevo si las correcciones cambian la app. No autoriza pagar, ampliar el producto por gusto, activar servicios ajenos al plan o modificar datos privados de producción para probar.

BASE Y FUENTE ÚNICA

1. Inspeccioná AGENTS.md, git status, rama, remotos y commits. Preservá trabajo ajeno. Leé docs/ESPECIFICACION_MAESTRA_CHEMA.md (contrato A1–M5), PLAN_MAESTRO_CHEMA.md, MATRIZ_ACEPTACION_CHEMA.md, ENTREGA_MAESTRA_CHEMA.md, AUTOAUDITORIA_IMPLEMENTACION_CHEMA.md y continuidad. Localizá equivalentes actuales si cambiaron nombres; no sustituirlos por prompts antiguos.
2. Identificá qué commits se auditan, cuáles generaron el APK y qué backend/esquema/configuración se probó. Separá resultados históricos, recién ejecutados y no reproducibles. Si falta la especificación, recuperá 01-Codex-plan-maestro-Chema.txt; no inventes un contrato reducido.
3. No cambies requisitos para hacer que el resultado pase. La app instalada llamada «2.0» sigue requiriendo evidencia de identidad/firma; no la equipares a la versión fuente por memoria. No supongas acceso a un teléfono, MCP, cuenta o secreto por aparecer en un documento.

MÉTODO

Armá la matriz requisito -> implementación -> evidencia -> veredicto para TODOS los A1–M5. Usá PASA, FALLA, NO EJECUTADO o NO APLICA CON JUSTIFICACIÓN. Un requisito puede tener código completo y aceptación física pendiente; separá ambas cosas.

Priorizá pérdida/corrupción o exposición de datos, duplicación de stock, firma incompatible, restauración compartida y costos no autorizados; después bloqueos operativos, UX/accesibilidad y detalles de acabado. Una captura linda no compensa un retiro duplicado, y un test unitario verde no demuestra un formulario utilizable.

Reutilizá herramientas/skills actuales, incluida revisión visual nativa cuando sea posible. Instalarlas no prueba que se usaron. No agregar otro conjunto de herramientas por formalidad. Revisá un conjunto útil de estados, corregí la tanda y volvé a comprobar lo afectado; evitá ciclos cosméticos interminables.

INSPECCIONES Y REPRODUCCIONES OBLIGATORIAS

A. Integridad y dominio.
Seguí el recorrido crear -> entregar -> retirar con incidencias -> reingresar/cerrar según los comandos reales. Alta pendiente no descuenta stock. Revisá medidas, disponibles/en obra/taller/pérdidas, responsables múltiples, transferencias, reintentos y versiones. Confirmá que RETIRE/REENTER no sumen dos veces y que el rediseño no haya creado retiros parciales inexistentes o una segunda lógica de inventario. Validá errores de escritura sin pérdida del formulario ni anuncio de éxito.

B. UI/UX completa.
Abrí las cuatro pestañas y sus recorridos secundarios: lista, búsqueda/filtros/scroll al volver, urgencias y Hoy con entregas/retiros, detalle, alta/edición, materiales/combos, operaciones, fotos/documentos, Ajustes, copias y avisos. Compará antes/después reales en ambos temas. Direcciones y medidas visibles, lenguaje profesional, funciones secundarias encontrables, controles sin superposición y acciones reales. Detectá pantallas que solo cambiaron colores, botones de demostración, métricas inventadas o funciones eliminadas. No pedir un nuevo estilo si se cumple el acordado.

C. Viaje.
Verificá elegibilidad/saldos; Todas/retiros/entregas + zona; cercanía estricta desde un origen fijo sin prioridad escondida; GPS denegado/timeout, destino sin coordenadas al final y origen cambiado sin orden falso. Cantidad con unidad y medidas probadas, saldo vigente, desconocida distinta de cero y 3/6 en ambos sentidos. Si no existe equivalencia de cuerpos, comprobar la alternativa acordada sin inventarla.
Probá arrastre desde agarre, scroll normal fuera, posición directa y alternativa TalkBack; borrador/guardar/cancelar/deshacer; persistencia/reapertura; cambio comercial mientras se edita. Reordenar filtradas conserva posiciones ocultas y no revive IDs cerrados. Maps recibe visibles en orden, depósito final y tramos completos; manejo de errores, sin Directions API paga ni movimientos comerciales causados por ordenar.

D. JSON y recuperación.
Probá selector/URI/lectura/validación/vista previa/confirmación/commit/recuperación según el entorno real. Cancelación, JSON/esquema/versión inválidos y fallo de lectura/escritura no vacían datos. Revisá conteos y acceso a todos los elementos, respaldo previo y deshacer con límites correctos. Verificá el archivo exacto repartos-chema-5-pedidos-whatsapp.json si está disponible y sus cinco pedidos; identificar archivo/hash, sin sustituir una demo. Si falta, informar esa prueba como pendiente.
En espacio compartido, comprobar que una copia local no sobrescribe todos los datos, no duplica movimientos y no elimina la cola/confirmaciones indebidamente. Probar copia vieja y dos instalaciones derivadas del mismo respaldo. Que el parser acepte un JSON no demuestra restauración y persistencia Android.

E. Colaboración y seguridad.
Usar al menos dos clientes independientes para la integración, con identidades/permisos separados donde corresponda. Misma devolución, última unidad concurrente, entidad editada a la vez, doble toque, timeout luego del commit remoto, duplicados/fuera de orden, reconexión, reinicio con outbox y relojes desfasados. Buscar pérdida silenciosa, duplicados semánticos, last-write-wins en cantidades y éxito sin confirmación.
Verificar transacción local del cambio/outbox, confirmación duradera, protocolo de pull/cursor y conflictos. Revisar ruta borrador/pública y filtros privados. Auth expirada/revocada, aislamiento entre espacios, consultas no autorizadas y RLS si corresponde; no aceptar solo «RLS habilitado» como prueba. Inspeccionar cliente/configuración/logs/artefactos para exposición de secretos, sin imprimir sus valores ni subirlos a Git.
Caída de backend, cuota agotada y foto fallida no deben inutilizar el modo local o perder pendientes. Fotos/adjuntos tienen acceso correcto, referencia estable y recuperación. Un servidor simulado o dos pestañas web no son dos teléfonos Android: informar el entorno exacto y los casos nativos pendientes.

F. Fechas, avisos y sonido.
Días restantes/atrasados, cambio de día/zona del negocio, fecha editada y regreso desde segundo plano. Avisos 3/2/1/0, horario general y propio, opt-in/denegación, cancelación al cerrar, restauración y cambios compartidos, sin duplicados. Tap abre el alquiler correcto. Tonos/háptica opcionales y canales reales, sin sonido por cada escritura. No certificar entrega exacta con force-stop/reinicio/batería si no se probó.

G. Accesibilidad, movimiento y rendimiento.
TalkBack, etiquetas/estados, texto ampliado, foco y lectura de hojas/diálogos, volver al control de origen, teclado/insets/safe areas, botón Atrás, reducción de movimiento y lista larga. Mirar capturas completas y video nativo disponible para presión, abrir/cerrar y reordenar; distinguir fotogramas de evaluación de fluidez. Contraste medido y áreas táctiles Android, sin convertir CSS px en dp físicos. Medir un problema reproducible antes de prometer FPS o añadir optimizadores.

H. Costo, operación y continuidad.
Contrastar con fuentes oficiales actuales el plan/configuración del backend, cuotas, pausa, fotos/egress, auth/recuperación, respaldos y procedimiento de salida. Sin Firebase, pago, trial facturable o tarjeta. Si un servicio gratuito no cubre el alcance, dejarlo como bloqueo real con alternativa; no prometer gratuidad ilimitada. Verificar modo individual sin login y exportación/recuperación utilizables. Revisar continuidad y que las skills no modificaron dependencias innecesariamente.

I. APK y GitHub.
Comprobar código publicado frente al commit del build y posibles cambios posteriores. applicationId, versión/code, firma/certificado, ABI, minSDK, integridad, tamaño y SHA256. Evidencia de actualización conservando datos cuando exista instalación disponible; no desinstalar para esquivar un fallo. Si no hay APK instalado exacto, no afirmar compatibilidad demostrada con «2.0».
Confirmar archivo nuevo y enlace real en rama descargas. Comparar el APK recuperado de GitHub con el compilado y los datos de la entrega. Verificar que los artefactos anteriores conservaron rutas y blobs/hashes contra la revisión anterior pertinente; si no hay evidencia, no dar esa conservación por probada. No generar una firma nueva ni sobrescribir un APK anterior. Si corregiste la app, reconstruir/publicar versión nueva y actualizar los hashes/commits; no dejar el enlace de una versión anterior como si incluyera la corrección.

CORREGIR Y VERIFICAR

Para cada hallazgo: ID, severidad, requisito afectado, reproducción, resultado esperado/actual, causa, archivo/función, corrección, prueba/regresión y resultado. Corregí defectos dentro del encargo; las decisiones de negocio no resueltas requieren una pregunta concreta con recomendación, no una respuesta inventada. Preservar cambios ajenos y datos.

Repetí checks afectados y los obligatorios de release después de las correcciones. Si pasan y no hay cambios posteriores ni dudas nuevas, no repetir suites solo para aumentar conteos. Commit y push coherentes, sin force-push, y continuidad al día. Si hay bloqueo de firma/cuenta/dispositivo, cerrar el trabajo independiente y detallar qué falta; no ocultarlo con un «todo listo».

ENTREGA FINAL

Guardar docs/AUDITORIA_CIERRE_MAESTRO_CHEMA.md y actualizar la matriz, la entrega, el manual y continuidad. El informe debe ser autocontenido e incluir:

1. Alcance/revisión auditados, rama/commits y cambios reales de esta auditoría.
2. Dictamen separado: implementación, pruebas automatizadas/integración, aceptación Android, operación compartida y publicación. Usar listo/listo con pendientes/bloqueado, con justificación y bloqueantes; sin porcentaje de perfección inventado.
3. Hallazgos abiertos y corregidos, por impacto, con evidencia y pruebas.
4. Matriz completa A1–M5 con enlaces/rutas reproducibles y estados honestos. Listar explícitamente lo no ejecutado y el motivo.
5. Capturas/video realmente revisados, su origen y limitaciones. No presentaciones generadas como capturas de la app.
6. Resumen de integridad de datos, prueba de la misma devolución/última unidad, respaldo/restauración y seguridad/costos del espacio compartido.
7. APK si existe: ruta/enlace autenticado, versión/code/package, certificado, SHA256, tamaño, fuente y publicación verificadas; estado de anteriores y compatibilidad comprobada o pendiente.
8. Checklist breve para dos teléfonos reales, si aún hace falta aceptación física: pasos, datos sintéticos, resultado esperado y cómo reportar versión/paso/esperado/observado/captura. No pedir borrar la instalación real.
9. Próximo paso concreto y mínimo, separado entre trabajo técnico que podés resolver y acceso/decisión/evidencia que requiere al usuario.

Devolvé también un resumen corto en texto para pegar a ChatGPT, incluyendo los hallazgos importantes y los pendientes, no solo enlaces privados. La auditoría termina cuando los problemas encontrados se corrigieron y verificaron o quedaron declarados como bloqueos precisos; no cuando el documento parece prolijo.
