# Encargo de implementación — 26/10/2026

Adjunto conservado íntegramente. SHA256: `6d80bc8af00632f88af4f55c5a6331813c361a1bcec6f210a088d48d8eba5379`. Esta autorización habilita implementar el contrato maestro; los checkpoints anteriores de «esperar02» quedan históricos.

REPARTOS CHEMA — ETAPA 2: IMPLEMENTAR, PROBAR Y ENTREGAR
USO: pegar después de revisar el plan de 01-Codex-plan-maestro-Chema.txt. Este prompt nuevo reemplaza los antiguos prompts de implementación de UX/Viaje. No pegar todos como órdenes simultáneas.

Implementá el encargo completo de Repartos Chema en kkshiiit/repartos-chema: UX de todas las pantallas, Viaje, copias seguras, avisos y coordinación entre mi jefe y yo desde distintos celulares, manteniendo modo individual/offline y costo objetivo $0 sin Firebase.

FUENTE ÚNICA Y AUTORIZACIÓN

1. Leé AGENTS.md aplicables, docs/ESPECIFICACION_MAESTRA_CHEMA.md, AUDITORIA_BASE_CHEMA.md, PLAN_MAESTRO_CHEMA.md, MATRIZ_ACEPTACION_CHEMA.md, AUTOAUDITORIA_PLAN_CHEMA.md y continuidad actual. Usá la revisión acordada y las correcciones posteriores del usuario. Si los nombres cambiaron, localizá los documentos equivalentes por contenido y commit, sin elegir una entrega antigua por comodidad.
2. El contrato maestro completo A1–M5 es obligatorio; no lo reduzcas al título de este archivo. Si no está guardado, buscá el adjunto 01-Codex-plan-maestro-Chema.txt y conservá su contenido en el repositorio antes de continuar. Si faltan ambos, indicá exactamente cuál hace falta; no construyas una versión recortada desde el recuerdo ni pidas los prompts históricos.
3. El envío de ESTE prompt autoriza la implementación del plan revisado, pruebas, ajustes de UI/UX, correcciones necesarias, documentación, commits/push frecuentes, build local firmado y publicación de un APK nuevo en descargas conservando anteriores. Incluye las configuraciones gratuitas acordadas del backend dentro de la cuenta autorizada y con los accesos disponibles, sin tarjeta, facturación, pruebas pagas ni planes superiores. No autoriza nuevas decisiones de negocio materiales, pérdida de datos o secretos en Git.
4. No me pidas permiso por cada tarea reversible ya incluida. Si falta una decisión real del negocio, credencial, APK exacto, firma o acceso de cuenta, agrupá el bloqueo con el mínimo pedido necesario y seguí el resto del trabajo independiente. No inventes una cuenta conectada, un consentimiento o una prueba física.
5. El usuario no ejecuta comandos de programación. Codex resuelve código, dependencias necesarias, conflictos rutinarios, pruebas, capturas, build y respaldo. No cierres con otro plan si ya tenés los datos para implementar.

RECONSTRUIR Y RESPALDAR ANTES DE EDITAR

- Verificá rama, commit, remotos, cambios ajenos, versiones reales y herramientas. Los datos del 26/10/2026 son una referencia histórica, no una orden de resetear el repositorio.
- Conservá la identidad Android y resolvé el APK llamado «2.0» con evidencia de package/versionCode/certificado. No asumir correspondencia con 1.2 o 1.6.1.
- Inventariá reglas de stock, entrega, retiro, reingreso, incidentes y revisiones. Buscá callers, pruebas y fixtures antes de editar lógica compartida. No crear un motor alternativo desde componentes UI ni retiros parciales inexistentes.
- Confirmá respaldo/recuperación sobre datos sintéticos antes de migraciones. Conservá originales y firmá/validá las migraciones. La instalación de producción y sus fotos no son un fixture desechable.
- Ejecutá los checks iniciales apropiados; documentá fallos preexistentes y no los presentes luego como regresiones inventadas. Evitá repetir suites sin cambios o dudas que lo justifiquen.

IMPLEMENTACIÓN POR HITOS COMPLETOS

Seguí el orden y dependencias del plan. Cada hito termina con comportamiento real, verificaciones pertinentes, revisión de lo renderizado y un commit/push. No llenar el APK de botones demostrativos para dar por cubierta una pantalla.

Hito 1 — Datos y base reutilizable.
Preservar dominio, SQLite, JSON, historial/fotos y firma. Establecer componentes y tokens nativos comunes; dependencias solo justificadas. Reutilizar las skills y herramientas verificadas en el maestro. Documentar cambios de skill por separado de bibliotecas de la app. No instalar todos los paquetes promocionales de las referencias.

Hito 2 — UX de la aplicación completa.
Aplicar el sistema oscuro/claro acordado a las cuatro pestañas, encabezados, listas, detalle, alta/edición, operaciones, materiales/combos, fotos/documentos, Ajustes, copias, avisos, hojas, diálogos, vacíos y errores. Mantener dirección/material/medida visibles, agrupación de urgencias y Hoy con entregas y retiros, búsqueda/filtros/scroll al volver, borradores y errores recuperables. Las acciones secundarias siguen disponibles en ubicaciones claras. No limitarse a una paleta ni eliminar funciones.

Hito 3 — Viaje completo.
Todas/solo retiros/solo entregas + zona; orden estricto desde un único origen; cantidades con unidad comprobable; desconocidas diferenciadas de cero; arrastre desde agarre y elección directa accesible; borrador, guardar/cancelar/deshacer, persistencia y reconciliación sin resucitar IDs. Reordenar filtradas mantiene posiciones ocultas. GPS puntual foreground con errores claros. Maps recibe visibles en orden y depósito final, respetando tramos y error de apertura. Ningún control de planificación ejecuta movimientos comerciales ni certifica la capacidad de la camioneta.

Hito 4 — Primer corte real de sincronización.
Implementar el protocolo, autenticación/permisos y transacciones acordados para una operación crítica con dos clientes de prueba. Antes de extender, demostrar que la misma devolución no aumenta stock dos veces y que una última unidad no queda confirmada para dos operaciones incompatibles. Probar commit remoto + timeout + reintento, cierre con outbox y reconexión. No reemplazar la integración por mocks que siempre aceptan las escrituras.

Hito 5 — Colaboración completa dentro del alcance.
Extender a entidades acordadas, bootstrap/migración desde instalaciones previas, fotos pendientes, asignaciones y borrador/ruta compartida, recepción duradera de cambios, conflictos y revocación. Realtime solo como señal. Mantener preferencias personales y modo local sin login obligatorio. Una restauración local nunca se convierte en sobrescritura global; copias comunes no duplican inventario. Mostrar guardado local, pendiente, confirmada, error o conflicto según el estado real. Documentar operación y recuperación dentro de cupos gratuitos.

Hito 6 — Fechas, avisos, sonido, accesibilidad y rendimiento.
Verificar días restantes con reloj/zona del negocio, avisos 3/2/1/0 y horarios general/por alquiler, reconciliación/cancelación y deduplicación. Permisos y canales Android reales; sonidos/háptica optativos, sin reproducirlos por cada evento. Probar ambos temas, texto ampliado, TalkBack, teclado, foco, safe areas/Atrás y movimiento reducido. Las animaciones ayudan a tocar, abrir/cerrar y reordenar; no bloquean la tarea ni añaden fondos continuos.

Hito 7 — Regresión, autoauditoría y entrega.
Cerrar los casos L1–L8 del maestro y los requisitos propios del repositorio. Inspeccionar el diff total y los recorridos renderizados. Corregir fallos, actualizar la matriz y repetir las pruebas afectadas. Ningún hito parcial prueba por sí solo que el producto entero esté listo.

REGLAS DE EJECUCIÓN Y EVIDENCIA

- Un caso nuevo con lógica relevante deja una prueba pequeña y significativa. Preservar validación, seguridad, accesibilidad y controles contra pérdida de datos.
- Éxito solo tras escritura duradera; retry/doble toque no duplica. Distinguir cantidades en depósito, en obra, incidencias y disponibilidad compartida provisional/confirmada.
- Verificar el JSON exacto de cinco pedidos si está disponible; identificar archivo/hash y resultado. Si falta, dejar pendiente ese caso, no sustituirlo por los cinco ejemplos del prototipo. Probar Android content:// y selector cuando haya entorno adecuado, además del parser.
- Una prueba de navegador no es GPS/SQLite/drag/notificación del APK. Registrar entorno, comando, commit, resultado y evidencia. Guardar capturas y video del entorno que realmente se usó; abrirlos y revisar lo visible. No afirmar pruebas físicas si no hubo acceso.
- Si el backend real está bloqueado por acceso o cuenta, completar preparación y pruebas locales útiles sin anunciar sync operativa. Se puede entregar un APK local intermedio si es compatible y útil, rotulado como tal y con faltantes; no cerrar el objetivo colaborativo con él.
- No pagar, activar un trial facturable ni conectar una API por encontrar una clave en variables de entorno. No subir datos privados para demostrar una función.
- No rehacer una pantalla ya aprobada por gusto de otra skill. No silenciar avisos o pruebas ni inflar conteos para declarar éxito.

GITHUB Y CONTINUIDAD

Hacé commits coherentes y pushes al terminar hitos y antes de cerrar o pausar. No acumular todo al final ni reescribir historia. Usá el flujo de integración vigente (rama/PR/main según corresponda) y dejá explícito dónde quedaron los cambios. No declarar main actualizado si el trabajo sigue solo en otra rama.

Actualizá docs/CONTINUIDAD_CODEX.md y un registro de este encargo con: commit publicado, cambios locales restantes, checks ejecutados, bloqueos, artefactos y próximo paso concreto. No prometas detectar cuándo termina el límite de uso ni continuar automáticamente después de cerrar una sesión.

APK Y PUBLICACIÓN

Reutilizá toolchain/build local y firma correctas. Validá applicationId, versionName/code, certificado, ABI, minSDK, integridad, tamaño y SHA256; dejá claro qué se comparó con la instalación exacta y qué sigue sin identificar. No generar otra llave para esquivar un error ni pedir desinstalar con pérdida de datos.

En rama descargas, publicar un archivo NUEVO bajo android/v<version>-<modalidad>.<n>/, preservando todos los APK anteriores byte a byte. Actualizar enlaces/documentación; verificar el archivo descargado desde GitHub contra el hash compilado. Registrar commit fuente del build y commit de publicación. Si cambia código después de construir, reconstruir o identificar el APK anterior como previo a esos cambios; no asociarle el nuevo commit falsamente.

ENTREGA OBLIGATORIA

1. docs/ENTREGA_MAESTRA_CHEMA.md: cambios funcionales y ubicación de acciones secundarias, fases cerradas/pendientes y decisiones reales.
2. docs/MATRIZ_ACEPTACION_CHEMA.md actualizada: cada A1–M5 con implementación, prueba/evidencia, entorno y veredicto. Conservar identificadores y dividir requisitos si hace falta, sin borrar los pendientes.
3. docs/AUTOAUDITORIA_IMPLEMENTACION_CHEMA.md: hallazgos con severidad, reproducción, causa, corrección, comprobación y abiertos. Incluir seguridad de datos, UX visible y costo/operación del backend gratuito.
4. Capturas antes/después y estados relevantes de ambos temas, identificadas como web/emulador/dispositivo; video corto cuando el entorno permita capturar interacciones reales. Sin datos personales innecesarios.
5. Manual breve y reproducible para Android: actualizar conservando datos, crear/buscar/volver, entregar/retirar/reingresar con incidencias, Viaje con filtros/orden/Maps, copia/restauración/recuperación, avisos, trabajo offline y sincronización con segundo dispositivo. Utilizar datos de prueba; explicar resultados esperados y cómo informar un fallo.
6. APK y enlace si se generó: rama/ruta, versión, applicationId, certificado, tamaño, SHA256, fuente y publicación verificadas; o bloqueo exacto y trabajo respaldado si no se pudo.
7. Resumen autocontenido para pegar a ChatGPT: qué cambió, pruebas PASADAS/FALLIDAS/NO EJECUTADAS, límites físicos, hallazgos abiertos, commits y próximo paso. No devolver solo links privados ni declarar «100%» a partir de pruebas parciales.

Terminá el trabajo autorizado que puedas comprobar. Si queda un bloqueo real, agotadas las alternativas seguras y gratuitas, entregá evidencia, lo completado y la acción mínima necesaria para continuar. El prompt 3 hará una revisión final adicional; no uses esa revisión futura para postergar problemas que ya conocés.
