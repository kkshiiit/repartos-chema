# Autoauditoría del plan Chema — 26/10/2026

## Veredicto y límites

**La etapa 1 entrega un plan ejecutable; no entrega el rediseño ni la colaboración implementados.** Los cinco documentos maestros solicitados están preparados, el contrato original está conservado y cada uno de sus **94 subrequisitos** tiene estado inicial, evidencia, prueba propuesta y brecha en la matriz. Ese número mide cobertura documental, no avance del producto.

Base de aplicación: `81cd39afb97d8df6626572ce95886039fd421fd5`, funcionalmente igual a `f9f018d3d33d6d474babcc669b1144412802ad28`. Rama de preparación: `plan/chema-maestro-2026-10-26`. No se afirma que la instalada «2.0» sea esta compilación. Los commits de esta etapa sólo contienen documentos, guías y evidencia; no cambian pantallas, reglas de negocio, dependencias, migraciones o APK.

Revisión realizada por el agente de esta sesión, **sin afirmar revisión independiente por un equipo o subagentes nuevos**. Las guías pertinentes se leyeron como orientación. La comprobación automática de cobertura y hashes se registra aparte en `evidencias-etapa1/CIERRE_DOCUMENTAL_2026_10_26.json`; no reemplaza esta revisión técnica.

## Hallazgos resueltos dentro del plan

|Riesgo de omisión o contradicción|Resolución y lugar|Comprobación pendiente durante la implementación|
|---|---|---|
|Tratar Aurora/Cobalto o la prohibición histórica de rediseño como alcance actual|La especificación nueva es autoridad; Modern Dark y tema claro tienen tokens y composición definidos en H1/H5. Se conserva la historia|Comparar PNG reales de toda la app, no sólo colores de las cuatro pestañas|
|Reemplazar RN por una plantilla web o instalar muchas librerías|Se conservan Expo/RN/SQLite, componentes y gestos existentes. Geist TTF/OFL sólo se incorpora en etapa 2; HeroUI es documentación|Compatibilidad, licencia y necesidad verificadas para cualquier dependencia futura|
|Cuatro nombres de pestañas pero sidebar en pantalla ancha|D1 exige cuatro pestañas inferiores también en ancho grande; prevalece sobre la recomendación genérica de rail de una guía Android|Ver navegación real en anchos pequeños/grandes y Android Atrás|
|Sólo cambiar las pantallas principales y perder secundarios|Tabla de destinos incluye formularios, detalles, cargas, operaciones, fotos, incidencias, combos, documentos, recuperación, ajustes y avisos. Exportaciones salen de filtros hacia Datos; combos hacia Depósito|Cada acción debe seguir siendo accesible y ejecutar el mismo comando real|
|«Hoy» omite entregas y la dirección sólo existe para lector|H1 deriva la tarea según estado y fecha civil, hace visible la dirección y busca localidad; conserva consulta/filtros/scroll sin acoplarlos a stock|Fixture con entrega hoy y retiro hoy; volver desde detalle sin perder contexto|
|Inventar retiros parciales o sumar de nuevo en reingreso|El contrato real de `engine.ts` manda: RETIRE procesa el saldo completo después de incidencias; REENTER cierra sin volver a sumar stock. Las menciones antiguas no crean una operación nueva|Regresión por los cuatro buckets, daños/pérdidas y responsables múltiples|
|Confundir cantidad de piezas con cuerpos|No hay equivalencia universal en MaterialItem. H2 compara materialId+medida; sólo usa «cuerpos» si la unidad real se confirma|3/6, cero/desconocido, mezcla de medidas y saldo tras transferencia/incidencias|
|Filtros de Viaje destruyen el orden oculto|Se guarda la secuencia completa y se permutan sólo las posiciones visibles; reconciliación no resucita cerradas|A-X-B-Y → B-X-A-Y; cerrar/parada nueva mientras hay borrador/Deshacer|
|Cercanía antepone vencimiento o cambia origen y orden silenciosamente|Un único origen explícito, distancias locales estrictamente ascendentes, desconocidas al final; cambiar origen no ordena hasta pulsar|Entrega cercana antes de retiro vencido lejano; GPS negado/timeout/precisión/edad/cancelación|
|Reordenamiento muestra éxito antes de guardarse|Preferencias UI separadas, borrador, guardar con acuse duradero, cancelar sin mutar y recuperar error|Fallo de escritura/reapertura; alternativa de posición directa/TalkBack al arrastre|
|Dos teléfonos con UUID distintos registran el mismo retiro|Instancia de tarea comercial vigente + revisión + cumplimiento único en la transacción. El segundo conserva su propuesta como conflicto, sin otra devolución|Dos clientes con Auth y Postgres reales, no dos mocks de éxito|
|Deduplicación permanente impide deshacer y repetir legítimamente|UNDO/REACTIVATE crean una tarea sucesora; un envío viejo de la tarea anterior nunca completa la nueva. TRANSFER también actualiza tareas de las transiciones que produce|DELIVER→UNDO→DELIVER y RETIRE→UNDO→RETIRE; envío rezagado; transferencia que entrega destino|
|Dos motores con reglas distintas entre app y SQL|El mismo `applyOperation` TS produce la proyección autorizada. SQL controla ACL/CAS/atomicidad/recibos, sin replicar reglas de stock|Build Edge reproducible y pruebas equivalentes contra datos confiables; límites de CPU/bundle|
|Lectura optimista del servidor pisa el trabajo concurrente|Precondiciones por entidad y tarea; CAS de revisión del espacio, membresía revalidada dentro del commit, reintento acotado sólo si las entidades relevantes no cambiaron|Última unidad, edición simultánea y permiso revocado entre lectura y commit|
|Timeout después de commit causa doble movimiento|El recibo por operationId es duradero; primero se consulta. Hash diferente con mismo ID rechaza. Una respuesta incierta no permite descartar como si nunca se hubiera enviado|Commit exitoso con respuesta cortada, cierre de SENDING y reintento|
|Cursor salta un commit por reloj o secuencia asignada fuera de orden|Secuencia por espacio asignada bajo el mismo lock; snapshot+cursor coherentes, pull paginado con watermark y escritura local atómica|Huecos, duplicados, fuera de orden, reloj desfasado y desconexión larga|
|Un conflicto desaparece al cerrar un aviso o pierde la cola posterior|Sobre compartido duradero conserva propuesta/base/dependencias; no LWW para stock. Descripciones y rutas empiezan con revisión explícita|Reinicio, rebase, conflicto persistente y corrección auditada|
|Confundir nombre local con identidad de servidor o promover a todos a ADMIN|Auth y membresía reales; roles mínimos propuestos, servidor deriva actor/rol/hora. No se reutiliza la elevación del AuthContext legado|RLS por espacio, rechazo de escrituras directas/RPC, revocación/sesión expirada y cambio de usuario|
|Perder sesión por escribir el nuevo almacén como el legado de Firebase|Vault generacional con partes nuevas y manifiesto confirmado al final; no reutilizar el borrado previo de cabecera de authPersistence|Fallo entre chunks, falta de espacio, recuperación de la última generación válida|
|Dos copias JSON se vuelven dos inventarios del equipo|Bootstrap explícito de espacio vacío una sola vez; segundo cliente sólo se incorpora y descarga. Copias divergentes requieren revisión|Mismo JSON en dos teléfonos, reintento/interrupción y fingerprint de bootstrap|
|Restauración local reemplaza equipo o revive movimientos enviados|Restaurar en equipo abre espacio local aislado; no hace reemplazo remoto ni replay de IDs. No se ofrece fusión automática. Recuperación servidor usa serverEpoch|Restaurar copia antigua con recibos nuevos; recuperación del servidor y cliente rezagado|
|Fotos fallidas bloquean alquiler o se comparte file:// entre celulares|Referencia lógica, trabajo de upload independiente por ID/hash, objeto privado y cache local; limpieza respeta undo/archivo/exportación|Objeto ausente/upload fallido/cuota/otro espacio; exportación incluye bytes|
|Cambiar filtro publica una ruta o dos órdenes se pisan|Borrador personal; Publicar recorrido explícito con autor/versión/asignaciones y revisión concurrente|Dos publicaciones desde la misma revisión; tarea que se completa no se convierte silenciosamente en otra|
|Sync o avisos de un teléfono cerrado se presentan como instantáneos|Realtime sólo sugiere pull. Avisos locales por dispositivo; el cerrado puede tener la última fecha conocida. Tap consulta estado disponible, nunca mueve stock|Dos teléfonos con preferencias distintas, reconexión, permisos/reinicio/force-stop sin promesa de exactitud|
|Deshacer se vuelve ilimitado por cambiar la cronología|Se conserva autor, 5 minutos y revisión global del motor; otra operación elimina inversos anteriores. Historial/recibos paginados no almacenan snapshots completos para todos los eventos|Deshacer inseguro explica por qué y ofrece corrección, sin borrar evidencia|
|Backup del proveedor se interpreta como copia completa gratuita|Free no ofrece backup diario administrado. Copia administrativa SQL + objetos, JSON y salida neutral; prueba de restauración|Restaurar SQL y binarios con dos clientes de prueba; no sólo descargar un dump|
|Futuro APK se firma con otra clave o exige desinstalar|H0 identifica APK exacto instalado; H6 mantiene paquete/certificado y código creciente. Nunca desinstalar para demostrar migración|Firma/código exactos y actualización encima, inventario/fotos/historial conservados|
|Un 404 del repo privado se «soluciona» publicándolo|Se conserva privado; API autenticada encuentra el archivo. Instrucciones de Chrome/GitHub autenticado y Download raw file; no cambiar privacidad|Descarga Android del usuario todavía no verificada; obtener síntoma si persiste|

## Costo cero: conclusión con límites reales

**Supabase Free es una recomendación para revisión, no una integración ya realizada.** Se compararon únicamente Supabase y Appwrite, con fuentes oficiales consultadas el 26/10/2026. La segunda opción no expuso cuotas completas en la respuesta disponible; no se inventaron números ni se usó un índice genérico como prueba de su política de pausas.

Supabase verifica $0, dos proyectos activos gratuitos, 500 MB de base por proyecto, 1 GB de Storage y cuotas mensuales de egress/funciones/Realtime. Puede pausar tras una semana de inactividad y no garantiza backup administrado en Free. Edge tiene 2 segundos de CPU por petición y 256 MB; el core y datos representativos se probarán antes de dar el backend por viable. Estas son condiciones fechadas, no una garantía comercial perpetua.

El plan no requiere SMTP ni SMS pagos para iniciar sesión con contraseña: propone incorporación privada y aprovisionamiento autorizado. Falta implementar y probar la saga Auth+membresía y recuperación administrativa del propietario. No se presenta el SMTP predeterminado, limitado al equipo del proyecto y 2 mensajes/hora, como correo productivo confiable; tampoco se presenta un email no verificado como identidad verificada. Si el control de la cuenta del proveedor se pierde, no se promete recuperación sin ese control.

No se crea proyecto, cuenta, servicio, tarjeta, hosting o tarea de keepalive en etapa 1. Agotamiento de cuota/pausa conserva individual y cola compartida; no habilita upgrade ni borrado de datos. El mantenimiento y respaldo administrativo deberán tener responsable y procedimiento; una app no puede garantizar gratis para siempre las políticas de un tercero.

## Pruebas ejecutadas frente a pruebas propuestas

|Categoría|Ejecución comprobada ahora|Límite|
|---|---|---|
|Estática/unidad|`npm run check`: tipos correctos, lint 0 errores/1 advertencia, 444/444 unitarias en 40 archivos, build TS de Functions correcto|Prueba la base existente, no la UI o backend propuestos. Fixtures Word/Excel restauradas por SHA después|
|Web importación|Playwright import-json 1/1, 5.6 s, datos sintéticos: cancelar/JSON roto/restaurar/reabrir/deshacer|No es selector Android ni el archivo exacto del usuario|
|APK conocido|Firma v2, paquete/code/ABI/minSDK y SHA de 1.6.1 verificados; no recompilado|No demuestra correspondencia con instalada «2.0», instalación ni migración física|
|Visual|Abiertas tres capturas web existentes y contrastadas con código. Contrastes de tokens calculados estáticamente|No hay «después» Modern Dark; PNG no demuestra animación, sonido, FPS o dp físicos|
|Herramientas|CLI enumera 10 skills, hashes/licencias y fuentes registrados; Impeccable context exit0|platform:null y ausencia de PRODUCT/DESIGN no son certificación Android; no recarga nativa del catálogo afirmada|
|Histórico separado|57/57 UI, 348 PNG/19 comparativas, 8 Axe y Gradle del 25/10, sobre el mismo runtime anterior|No se cuentan como ejecuciones actuales ni se extienden al futuro backend|
|Pendiente|Servidor nuevo con dos clientes, permisos nativos, TalkBack/gestos/IME/avisos/fotos/Word/Excel/Maps físicos y rendimiento|No hay ADB conectado ni backend nuevo configurado|

La especificación exige L1–L8 al implementar. El plan identifica pruebas concretas por hito y la matriz no marca esas propuestas como aprobadas. Los avisos de dependencias del 25/10 siguen documentados; no se declara una auditoría npm fresca ni «cero vulnerabilidades».

## Decisiones o accesos mínimos agrupados

1. **Cantidad real del catálogo:** confirmar qué material/medida representa un cuerpo. Recomendación técnica ya resuelta: comparación literal por material/medida hasta tener esa evidencia. No bloquea manual/cercanía ni justifica conversiones inventadas.
2. **Colaboración y permisos:** revisar recomendación Supabase Free y facilitar acceso autorizado al proyecto sólo en etapa 2. Propuesta conservadora: responsable ADMIN e integrante OPERADOR; si ambos deben crear alquileres o ajustar stock, el responsable debe confirmar esa política. Identidad/membresía reales, sin contraseñas o secretos por chat.
3. **Pruebas exactas:** APK instalado «2.0» y `repartos-chema-5-pedidos-whatsapp.json` cuando se comprueben actualización/H5. Su ausencia no se sustituye con el APK publicado ni con la fixture sintética y no paraliza UI, Viaje o planificación.

No se pide otra entrevista visual: Modern Dark, tema claro, cuatro pestañas y fuentes ya están definidos. No se necesita Figma, un MCP opcional, API de IA, librería comercial ni PC encendida del usuario para avanzar con lo independiente.

## Cierre de esta etapa y próxima acción

Revisar diff/hashes, confirmar los documentos y enviar la rama de preparación. `docs/CONTINUIDAD_CODEX.md` conserva el punto exacto y las evidencias. No fusionar una implementación inexistente ni compilar un APK por documentación.

**Después de revisar el plan, el usuario enviará `02-Codex-implementar-y-entregar-Chema.txt`, como exige expresamente su encargo.** La siguiente sesión debe leer especificación/plan/matriz/checkpoint, comprobar HEAD/remoto y comenzar H0; H1/H2 pueden avanzar sin backend. Esto es un límite explícito de alcance de la etapa 1, no una aprobación adicional inventada por una skill.
