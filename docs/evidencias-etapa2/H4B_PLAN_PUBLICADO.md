# H4B — Ruta publicada y asignaciones

Fuentes estables; sin commit, deploy, build web ni regeneración de core.js por este agente.

## Archivos propios
- src/services/publishedRoute.ts: contrato schema1, validación, identidad de tareas, reconciliación y caché durable espacio+uid.
- src/components/PublishedRoutePanel.tsx: panel reutilizable con tema UI existente, plan guardado/copia local, autor/fecha/revisión, consulta offline, publicación explícita de borrador completo, asignación opcional a miembros activos y carga confirmada.
- app/(tabs)/mapa.tsx: entrada desde Opciones y montaje de panel, onLoad guarda preferencias con reconciliación sobre obras vigentes. Conservada guardia inventoryReady y cuatro tabs.
- src/shared/server.ts: import validador y casos route-history/route; get-route existente. Preservados cambios media previos.
- supabase/migrations/20261027150000_chema_route_plans.sql: nueva migración; no editadas aplicadas.
- tests/published-route.test.ts, tests/published-route-http.test.ts, tests/published-route-panel.test.ts.
- scripts/backend-postgres-test.ts: aplica migración route nueva y agrega dos casos sin modificar casos comerciales originales.

## APIs y contrato
- get-route: última versión {revision,route,userId,updatedAt} o null; ACL de membresía activa existente.
- route: {expected:entero>=0,route:{schema:1,ids:string[],tasks:{[obraId]:taskId},assignments:{[obraId]:uid}}}. Máximo500 paradas; IDs únicos; claves exactas; no metadatos autor/fecha cliente. Devuelve versión y autor/fecha servidor.
- route-history: {before?:revision} → hasta50 versiones descendentes anteriores; ACL activa.
- chema_publish_route usa bloqueo de espacio y CAS de revisión. Valida identidad exacta de cada tarea contra snapshot.tasks y miembro activo para cada asignación. No modifica snapshot, stock, movimientos ni outbox.
- chema_route_history conserva versión previa existente al migrar y todas las nuevas; RLS, revoke anon/authenticated, acceso service_role únicamente. Lectura sólo por RPC con membresía.

## Interacción
Ordenar, filtrar y mover personal no publica. Abrir panel consulta equipo/caché y captura revisión base; Publicar nunca hace get-route previo para ocultar409. Propuesta/asignaciones siguen visibles ante conflicto; cerrar/abrir permite revisar nueva versión. Cargar pide confirmación, obtiene snapshot actual, descarta tareas completas o sustituidas y cruza con elegibles locales; añade paradas nuevas vigentes al final mediante preferencias existentes. Se bloquean carga/publicación con outbox pendiente. La consulta offline funciona; carga requiere respuesta actual para evitar usar identidad de tarea vieja. La publicación requiere sesión/red confirmadas y no entra en outbox comercial.

## Verificación real
- npm run typecheck: PASS.
- ESLint archivos modificados: PASS.
- vitest route/client/http/trip-order/trip-preferences: 5 archivos,20 tests PASS (incluye ciclo reabrir panel sin conexión, reset de confirmación/online, bloqueo publicación y borrador de asignaciones durable).
- node scripts/backend-test.mjs: PostgreSQL17 Docker real + SQLite Node real,13 casos PASS (11 anteriores +2 nuevos). CAS rechaza segundo plan sobre misma revisión; historia2,1 y autor correcto; snapshot comercial idéntico; inválidos/tarea vieja/asignación fuera del plan/revocado/ACL rechazados.
- No capturé RED previo a implementar: pruebas se agregaron después. No alego ciclo TDD ni validación física en teléfonos.
- QA navegador/tema/ancho/mobile de este panel queda a root; no ejecutado por este agente. Tests HTTP usan Auth mock; SQL usa auth.users fixture, no GoTrue.

## Rollout
1. Aplicar 20261027150000_chema_route_plans.sql en backend.
2. Regenerar core.js desde fuentes completas y desplegar Edge (root).
3. Build frontend + QA dos usuarios/409/carga/caché/desconexión y temas.
No borrar historial en rollback. RPC route mantiene firma anterior; revertir UI no borra planes.

## Límites conocidos
- Panel muestra hasta50 publicaciones con versión, autor y fecha; API permite paginar más, UI no agrega otra página.
- Copia offline conserva UID internos; UI usa Integrante del equipo cuando no conoce el nombre, sin exponer UUID.
- Planes heredados anteriores que no cumplan schema1 se conservan pero el cliente los rechaza con error inline; no se reparan silenciosamente. Confirmar si existían antes del rollout.
- No transporte de asignaciones a movimientos comerciales, capacidad de carga o push/background.

## Correcciones tras revisión root
- Aunque mapa desmonta el panel al cerrar, se agregó reset explícito al comenzar cada consulta para reutilización segura: online/snapshot/confirm/known/draftReady/versions. Test componente verifica reapertura misma instancia, fallo de red, copia local y publicación bloqueada.
- Asignaciones del borrador ahora se guardan separadas del plan remoto en AsyncStorage por espacio+uid. Un plan nuevo no sobrescribe propuesta de asignaciones al reabrir; sólo carga explícita confirmada copia las asignaciones todavía activas. Escritura confirmada, errores inline y exclusión de acciones simultáneas.
- Fallbacks UI de autor/asignado = Integrante del equipo.
- SQL rechaza elementos ids que no sean strings antes de convertir; incluido caso numérico en test PostgreSQL real.
- Visor básico del historial últimas50 publicaciones con autor/fecha/revisión.
