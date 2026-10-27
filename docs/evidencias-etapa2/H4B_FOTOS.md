# H4B fotos compartidas — corte implementado

Sin commits, push, deploy ni cambios de stock. Fuentes estables para build.

## Cambios
- `src/shared/media.ts`: cola durable separada `chema:media:v1:<espacio>:<usuario>`, intentos/error/hash guardados antes de red, confirmaciones durables independientes; validación JPEG estructural acotada (SOF, dimensiones≤1024, SOS/EOI), SHA256 y límite2MiB; downloader privado valida bytes antes de caché.
- `mediaHash.ts` usa WebCrypto en web/Node/Edge; `mediaHash.native.ts` usa expo-crypto ya instalado. No SDK nuevo.
- `server.ts`: `photo-upload` y `photo-download` bajo sesión Auth; RPC de acceso antes y después de Storage. Binarios como base64 sólo en transporte autenticado. POST immutable x-upsert=false; retry lee objeto existente y compara hash. Nunca URL pública ni serviceKey en cliente. Cuerpo limitado3MiB para JPEG2MiB base64. Edge bundle `supabase/functions/chema-api/core.js` regenerado con script existente.
- Migration NUEVA `supabase/migrations/20261027120000_chema_private_media.sql`: tabla privada `chema_photo_objects` con PK espacio/obra/foto y hash inmutable; RPC sólo service_role confirma membresía cada llamada, referencia vigente obra/foto, autor coincidente, subida autor/admin. `author_id text` conserva identificadores legacy bootstrap. Reafirma bucket chema-photos privado y límite/tipo existente. Borrado de referencia no borra tabla/objeto; no GC.
- `protocol.ts`: PHOTO sale con uri lógica, statusPENDING y sin storagePath. Servidor rechaza PHOTO con referencia física/no portátil.
- `SharedInventoryProvider`: cola sobre inventoryStorage (SQLite nativo existente), separada de operaciones; sólo fotos con bytes scopeados; no retrasa guardado alquileres por subida. Pendientes/error visibles y persistentes, error media separado para no borrarlo al sincronizar inventario. Agregado accessBlocked solicitado por root. Inventario/proyección dominio conserva estado lógicoPENDING, confirmación binaria vive en sidecar durable, UI ya no afirma subida por stocksync.
- `PhotoImage`: en shared sólo caché espacio+usuario y descarga bajo membresía/ref vigente; sin fallback a URI externa. Texto copia disponible/pending.
- `SharedTeamSettings`: bootstrap explícito copia originales disponibles al scope espacio+usuario antes de enviar, limpia rutas físicas e inversos del payload, conserva copia fuente. Admin puede subir fotos de autores legacy conservando autor original. Si falta original sigue PENDING.
- `photoCache.ts/.web.ts`: reintento bytes idénticos permitido, discrepancia no sobreescribe original. Native no borra en shared. Web transacción add y verificación previa, carrera se aborta preservando ganador.
- `backupService.backupData(raw, readPhoto = photoBytes)`: parámetro reader opcional compatible; export shared resuelve bytes scopeados/descarga privada si falta y falla explícitamente si no puede completar. Retiene originales para undo/copias.
- `app/obra/[id].tsx`: sólo labels de foto del equipo y borrado lógico con retención; no limpieza local en shared.

## Interfaces
- Requests Edge: photo-upload `{spaceId,obraId,photoId,hash,data(base64)}` → `{hash}`; photo-download `{spaceId,obraId,photoId}` → `{hash,data(base64)}`.
- RPC `chema_photo_access(p_space text,p_user uuid,p_obra text,p_photo text,p_hash text default null)` → `{path,hash}` exclusivamente servidor. Registro previo a objeto admite reintento tras pérdida de respuesta; hash ya registrado no cambia.
- SharedMediaQueue/storage/getBytes sin modificar Action ni motor applyOperation.

## Pruebas y evidencia
- RED antes de implementación: `npx vitest run tests/shared-media.test.ts` falló por módulo media inexistente. Este RED verifica ausencia del flujo, no debe presentarse como fallo remoto ni como assertionRED del backend desplegado.
- GREEN final: `npx vitest run tests/shared-media.test.ts tests/shared-photo-cache.test.ts tests/shared-server.test.ts tests/shared-client.test.ts tests/shared-repository.test.ts tests/backup.test.ts`: 5 archivos/16 pruebas. Vitest omite pathname nonexistent shared-client.test.ts, por eso5 archivos y no6. Salida `/tmp/chema-stage2/media-green.txt`.
- Cubre JPEG falso/sobretamaño/hash discrepante; cola offline/reapertura/reintento; Edge fetch mock de objeto inmutable/reintento/descarga/revocación; URI local no se transmite; caché distingue usuario/espacio; caché nativa mock no pisa originales y acepta retry idéntico.
- `npm run typecheck`: OK último corte, incluyendo gate accessBlocked de root.
- ESLint archivos afectados: OK, cero errores y warnings tras ordenar import final.
- `node scripts/backend-build.mjs`: OK.
- Estos tests son unitarios/fetch y File mock. NO se ejecutaron pruebas remotas ni físicas de Android/iOS, no se afirma verificación Storage real.

## Rollout y pendientes
Root debe aplicar nueva migration, desplegar Edge regenerado y frontend juntos; validar remoto con dos miembros y datos sintéticos: JPEG privado, revocación, otra obra/espacio, missing object, cuota y response-loss; confirmar bucket privado real. Probar dispositivo físico cámara→SQLite outbox→cierre/reapertura→upload→segundo dispositivo→export/undo. No APK generado acá.
La copia descargada autorizada permanece disponible offline en caché aislada; revocación impide nuevas descargas/subidas, no borra originales locales. El estado binario independiente se expone en summary/error y PhotoImage; no se ejecuta operación comercial para marcar SYNCED. No se altera stock ni historia con uploads.

Cierre adicional: `npx vitest run tests/shared-http.test.ts tests/shared-local-recovery.test.ts` → 2 suites/3 pruebas OK. Bucket: no se CREA en esta migration; el DO final sólo actualiza propiedades del bucket previo si storage.buckets existe. No se tocaron fuentes después del corte comunicado a root.
