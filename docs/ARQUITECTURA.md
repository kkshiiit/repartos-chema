# Arquitectura — Chema Andamios

## Visión general

```
 Teléfono A ─┐                         ┌─ Teléfono B
  SQLite     │   HTTPS (RPC c2_*)      │   SQLite
  cola local ├──────────► Supabase ◄───┤   cola local
  réplica    │        c2_ops (orden)   │   réplica
```

La app es **local primero**: cada cambio se valida y se guarda en el teléfono al instante, y se envía al servidor cuando hay señal.

## Modelo de datos: registro de operaciones

- Cada cambio es una **operación inmutable** (`{ id, createdAt, actor, action }`), por ejemplo `DELIVER`, `RETIRE`, `ADJUST`, `SAVE_MATERIAL`, `IMPORT_SNAPSHOT` o `NOTE`.
- El servidor sólo guarda y **ordena** operaciones (`c2_ops.seq`). No interpreta reglas de negocio.
- Cada teléfono aplica las operaciones confirmadas, en ese orden, con el mismo motor puro (`src/domain/engine.ts` + `src/sync/ops.ts`). Misma entrada ⇒ mismo resultado en todos los teléfonos.
- El estado resultante incluye `logs`: esa es la **auditoría** que se ve en la app (persona, hora, movimientos de stock).

## Conflictos

Si dos personas usan el mismo material a la vez, ambas operaciones llegan al servidor, que las ordena. Al aplicarlas, la segunda ya no es válida (por ejemplo, falta stock): todos los teléfonos la descartan de la misma forma, y al autor se le muestra un aviso explicando que su cambio no se aplicó.

## Componentes principales

| Módulo | Responsabilidad |
|---|---|
| `src/sync/api.ts` | Llamadas RPC al servidor, mensajes de error en castellano, generación del código de equipo. |
| `src/sync/store.ts` | `SyncStore`: estado confirmado + operaciones pendientes, envío por lotes, descarga paginada, rechazos. |
| `src/sync/ops.ts` | Operaciones propias de la sincronización (`IMPORT_SNAPSHOT`, `NOTE`) sobre el motor existente. |
| `src/sync/kv*.ts` | Almacenamiento local (SQLite en Android, `localStorage` en web de prueba). |
| `src/context/AuthContext.tsx` | Sesión: equipo + persona; lista de personas (también sin señal). |
| `src/context/InventoryContext.tsx` | Expone el inventario a las pantallas; sincroniza al abrir, al volver, cada 15 s y al recuperar señal. |
| `src/components/LegacyImport.tsx` | Ofrece pasar al equipo los datos de la app anterior guardados en el teléfono. |
| `src/utils/ticketFormat.ts` / `src/services/ticket.ts` | Ticket en texto/HTML (puro) y su envío (PDF, WhatsApp, Word, Excel). |

## Servidor

Esquema completo en `supabase/migrations/20261117000000_inicial.sql`.

| Función | Uso |
|---|---|
| `c2_create_team(code, name)` | Crea el equipo (guarda el hash del código). |
| `c2_join(code)` | Valida el código y devuelve nombre del equipo y personas. |
| `c2_member_add / c2_member_remove / c2_members` | Lista de personas. |
| `c2_push(code, ops)` | Agrega operaciones (idempotente por `opId`). |
| `c2_pull(code, after, limit)` | Devuelve operaciones a partir de un número de orden. |
| `c2_photo_put / c2_photo_get` | Fotos JPEG comprimidas (base64). |
| `c2_backup_put / c2_backup_list / c2_backup_get` | Copias del inventario: semanal automática (máx. una cada 6 días, se guardan 8) y "antes de restaurar". |

## Copias y restauración

- **Copia semanal:** tras sincronizar, cada teléfono revisa (una vez por día) si hace falta; el servidor guarda como máximo una cada 6 días y conserva las 8 más nuevas.
- **Volver atrás:** `src/sync/restore.ts` vuelve a aplicar, en orden, las operaciones del servidor hasta justo antes de la elegida. El resultado se aplica como una operación `IMPORT_SNAPSHOT` (con texto propio en la Auditoría), así que todos los teléfonos convergen y la auditoría completa se conserva.
- Antes de restaurar se sube una copia `antes-de-restaurar` del estado actual.

## Pruebas

- `tests/sync-store.test.ts`: dos teléfonos convergen, conflicto rechazado y avisado, importación y notas auditadas.
- `tests/ui/equipo.spec.ts`: recorrido completo en navegador contra el servidor real con dos teléfonos y migración de la app anterior.
- El resto de `tests/` cubre motor, validación, fechas, documentos, copias, avisos e interfaz.
