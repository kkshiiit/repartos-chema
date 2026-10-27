# Entrega maestra Chema — ejecución en curso, 27/10/2026

**Este documento es un punto recuperable, no un certificado de finalización ni del APK anterior.** Rama `feat/chema-maestro-etapa2`; main `81cd39a` todavía no integra esta etapa. Consultar `git log` y CONTINUIDAD_CODEX antes de repetir trabajo. Contrato íntegro: ESPECIFICACION_MAESTRA_CHEMA A1–M5 y autorización ENCARGO_ETAPA_2_CHEMA.

## Resultado implementado hasta este corte

- Base nativa Expo57/RN0.86 preservada; tokens Modern Dark y claro, Geist/Mono locales licenciadas, cuatro pestañas inferiores en todos los anchos. Sin bibliotecas visuales nuevas, anuncios ni backend obligatorio.
- Alquileres compactos por urgencia/Hoy (entregas y retiros)/próximos, dirección y material/medida visibles, consulta/localidad/filtros/desplazamiento conservados. Alta en tres pasos y operaciones de dominio originales.
- Viaje personal: filtros tarea/zona, distancia estricta desde origen elegido, material/medida literal sin equivalencia inventada de cuerpos, editor por agarre/posición, guardar/cancelar/deshacer, reconciliación y persistencia. Maps respeta visibles en orden y depósito final. No ejecuta movimientos comerciales.
- Copias JSON: nombre/tamaño/esquema/conteos y revisión completa virtualizada; cancelar no escribe; reemplazo local explícito con copia previa. En equipo, restaurar abre un inventario individual aislado y no sustituye el servidor.
- Equipo opcional real sobre Supabase Free autorizado en organización kkshiiit: Auth privado por invitación de un uso, membresía ADMIN/OPERADOR en servidor, mismo motor de stock, CAS y tarea comercial única, recibos/idempotencia, outbox SQLite aislada por usuario/espacio. Modo individual no requiere sesión, red, Firebase o servicios pagos.
- Fotos compartidas: JPEG≤1024px/2MiB, huellaSHA256, cola independiente durable, acceso privado y caché aislada por usuario/espacio. Reintentos no reemplazan originales. Borrado de referencia autorizado conserva binarios para historial/copia/deshacer; no hay limpieza automática destructiva.
- Avisos del servicio existente: configuración/herencia 3/2/1/0 conservadas; namespaces por espacio y diario durable de cancelaciones fallidas. Rechazo conocido de Auth/membresía bloquea envíos y oculta el contenido sin borrar la cola.

## Dónde están las acciones

Alquileres → fila → detalle → entregar/retirar, carga, responsables, incidencias, fotos, remito/WhatsApp, GPS y correcciones. Depósito → filas por pieza → menú para editar/mover/ajustar; Combos en cabecera. Viaje → Cambiar orden y Opciones del viaje. Historial → filtros y Deshacer con límites reales. Ajustes → Datos/copia/recuperación/documentos, apariencia, avisos, responsables y equipo. Equipo compartido opcional tiene ingreso/vinculación propios, no usa un nombre como autenticación real.

## Pruebas comprobadas y límites

Evidencia vigente en `docs/evidencias-etapa2/`. General previa a últimos fixes:493/493, tipos/Functions/lint0errores y1warningAxe histórico. Focales posteriores:67 avisos/Auth,9 gate/espacios/Auth,8 media/cache/HTTP. Sumar ejecuciones repetidas no produce un total de pruebas únicas; falta cierre general sobre fuente final.

PostgreSQL17 real +SQLiteNode:11 casos iniciales; ampliación ruta en revisión13. Backend Auth/Edge/SQL real:8/8 con dos cuentas sintéticas. Fotos Storage/Auth/Edge reales:5/5 JPEG sintético. Interfaz local del corte media:7/7; interfaz real equipo:2 contextos en Chromium comparten3alquileres sintéticos, operario sin altaADMIN. Capturas originales y comparaciones web en `artifacts/capturas/maestro-etapa2/`.

Los intentos fallidos se conservan: selector de depósito ambiguo, orden al reabrir antes de hidratar inventario, build web durante edición de mediaHash y primer test `.tsx` fuera de include. Los resultados nuevos no convierten los fallidos en aprobados. No hubo teléfono Android físico, ADB conectado ni emulador nativo validado. No se acredita TalkBack, cámara/GPS real, entrega de alarmas/reinicio, desempeño físico o instalación encima por pruebas Chromium.

## APK y respaldo

**Todavía no hay APK nuevo de esta etapa en este corte.** El1.6.1 conocido no contiene Modern Dark/equipo. Su identidad conservada es `com.grupochema.repartos`, code10, certificadoSHA256 `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`. La instalación que el usuario llamó2.0 no está identificada; no certificar compatibilidad con ella ni pedir desinstalar.

Respaldo original verificado: `/workspace/respaldos/etapa2-base-2026-10-26/repartos-chema-e133ae4.zip` y manifiestos en la misma carpeta. Fuentes publicadas en rama temática por bloques; firma privada fueraGit. Antes de Gradle: repetir checks afectados, commit/push, ZIP+SHA restaurado y registrar fuente exacta. Publicar archivo nuevo en descargas, verificar descarga autenticada y conservar anteriores byte por byte.

## Pendientes concretos

1. Cerrar revisión y pruebas del plan publicado/asignaciones/historia y desplegar migración/Edge correspondiente.
2. Regresión completa sobre fuente integrada, capturas de secundarios/ventanas/texto ampliado y revisión visual manual de ambos temas; contraste actual.
3. Recuperación de acceso operativo y guía de backup/salida del backend, provisión privada del primer responsable. Ninguna cuenta comercial fue inventada.
4. Limpiar exclusivamente usuarios/espacio/objetos QA sintéticos antes de entregar; conservar evidencia sin secretos.
5. Actualizar matriz94IDs, autoauditoría/manual/continuidad y generar APK firmado. Pruebas físicas y JSON exacto de5pedidos siguen pendientes por insumos ausentes.

## Costo, datos y restricciones

Proyecto autorizado `lttfkynkhveomntejqhc`, Free, SãoPaulo. No tarjeta, facturación ni addon pago activado. Free tiene cuotas/pausa/límites y puede cambiar; no se promete servicio gratuito ilimitado. Sinconexión los cambios compartidos son provisionales hasta confirmación; puede haber rechazo por concurrencia. El refresco está acotado mientras la app está activa; no se promete sincronización con app cerrada. El modo individual no depende de esa disponibilidad.

Sesión Android en SecureStore; web en memoria, cerrar la página requiere volver a ingresar. Invitación privada autoriza aprovisionamiento, no verifica propiedad del correo. Backend restringe roles/membresía en cada petición/transacción; clave pública no concede acceso. Caché local privada persiste para recuperación y no se borra por revocar. El volumen agregado, la transferencia de snapshots y la retención de objetos necesitan seguimiento antes de crecimiento grande.
