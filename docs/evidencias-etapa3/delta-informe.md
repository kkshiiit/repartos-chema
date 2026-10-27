# Cierre03 J7/H4A — delta duradero

Fuentes estables: src/shared/protocol.ts, client.ts, server.ts, repository.ts; nueva supabase/migrations/20261027213000_chema_durable_delta.sql; tests/shared-delta.test.ts y scripts/backend-postgres-test.ts. No core regenerado, deploy ni commit por este agente.

## APIs y garantías
- SharedDelta por IDs: obras/materiales/combos upserts/removals y orden explícito; resto de estado, versiones y tareas. makeDelta/applyDelta verifican espacio/generación/from/cursor contiguos y estado final.
- SharedRemote.deltaPull opcional conserva mocks/adaptadores previos y protocolo1/pull anteriores. API delta-pull autentica como las existentes y RPC revalida membresía bajo lock compartido.
- RPC chema_delta_pull captura watermark; pagina secuencias del espacio, limita1..200 (API100); huecos/deltas nulos históricos devuelven RESET explícito del agregado actual. RESET de otra generación bloquea reemplazo conservando local.
- Repository persiste confirmado+cursor+watermark+outbox/proyección en el mismo sobre/atomicSet por página antes de pedir siguiente; max5 páginas/sync, receivingPending señala continuación; SQLite restart retoma watermark sin duplicar. ACK propio y snapshot de conflicto limpian watermark anterior. Fallo de guardado restaura la última copia persistida antes de reportar error; cursor no avanza por una página fallida.
- Se preservaron cola/archivo, SENDING/uncertain y CONFLICT. prepareCommit/actor/roles siguen autoridad servidor y SQL, última unidad/tareas no cambiaron.
- Delta persistido no contiene payloadInverso. Historial delta conserva sólo log resumido; RPC devuelve currentLog separado desde snapshot agregado únicamente en página final cuyo watermark es revisión actual; receptor valida e integra el inverso actual para UNDO del autor. Recibos excluyen snapshot y delta. ACK propio sigue snapshot actual.

## Migration
Recrea chema_commit desde 20261027201000 sin cambiar guardias, CAS P0001, roles, idempotencia o grants existentes. Agrega chema_changes.delta nullable e inserta delta dentro de la misma transacción de commit. Nueva RPC sólo service_role, revocada a public/anon/authenticated. No borrar filas ni migrar datos comerciales. Migration requiere despliegue coordinado Edge+cliente; servidor viejo escribe delta NULL y nuevo pull resuelve mediante RESET seguro.

## Evidencia ejecutada
- npm run typecheck: verde.
- npx vitest run tests/shared-delta.test.ts tests/shared-repository.test.ts tests/shared-server.test.ts tests/shared-http.test.ts:14/14 verdes.
- node scripts/backend-test.mjs: PostgreSQL17 Docker real + SQLite Node real,15/15 verdes. Nuevo caso cubre watermark fijo con commit concurrente entre páginas, límite, gap→RESET, epoch→RESET, aislamiento espacio, membresía/privilegios RPC; asserts ausencia de payloadInverso en chema_changes.delta/receipts; receptor SQLite con2páginas recibe último inverso y prepara UNDO. Se conservaron14casos previos (últimaunidad, recibo perdido/restart, roles, conflicto P0001/ruta, etc.).
- Nuevos tests unidad cubren IDs/orden/removals, duplicadas/gap/epoch,8páginas con corte5 y restart SQLite, fallo de guardado sin avanzar, página repetida rechazada.
- ESLint focalizado sin errores ni warnings tras limpieza.

## Límites / riesgos para documentación
- Si watermark fijo quedó viejo debido a escrituras concurrentes, no se adjunta currentLog más nuevo a un estado anterior: último deshacer queda disponible al siguiente sync que alcance revisión actual. Nunca se archiva inverso histórico para resolverlo.
- ACK propio sigue snapshot completo; datos descriptivos conservan política previa (sin nuevo LWW). Versiones/tareas y resto no comercial se envían completos dentro del delta. No se optimizó order[] ni metadata completa.
- Orden/cuerpo corrupto recibido se rechaza conservando último cursor; gap detectado por SQL dispara RESET. No se ejecuta rebase ciego de propuestas ni se borra cola; versiones obsoletas quedan como conflicto explícito mediante circuito existente.
- receivingPending disponible en SharedEnvelope; root decide exposición UI.
- No agregué realtime/background polling ni toqué engine/media/UI/docs. Backend runner usa Postgres17 existente, no14 (brief decía14, script real fija17).
