# Cierre03 — cola dependiente

Implementado en `src/shared/repository.ts`, `tests/shared-repository.test.ts`, `src/components/ProposalArchivesPanel.tsx` (nuevo) y `src/components/SharedTeamSettings.tsx`.

`dismissConflict(operationId)` conserva prefijo anterior, permite sólo CONFLICT definitivamente rechazado y sufijo PENDING attempts=0 sin uncertain. Archiva originales completos, contexto legible, motivo, fecha y scope espacio+uid. AtomicSet único escribe archivo, índice y nueva cola/proyección; no publica valor/listeners antes del commit. Nunca reenvía archivo ni toca remoto. Rechaza sufijo SENDING/ERROR o cualquier intento incierto. Falla atómica conserva cola, ausencia de archivo e índice.

APIs: `listConflictArchives(): Promise<ConflictArchiveSummary[]>`, `readConflictArchive(id): Promise<ConflictArchive|null>`; tipos exportados en repository. Provider/root integra `proposalArchives?: ConflictArchiveSummary[]`, `readProposalArchive?: (id)=>Promise<ConflictArchive|null>` y refresco init/discard. Panel sólo muestra índice scope actual, lee archivo, resuelve material y cliente con contexto, conserva cantidades/motivos/operación y exporta únicamente propuestas propias y detalles referenciados. El contexto de stock NO se exporta. No hay acción recuperar/reenviar archivo.

RED: `npx vitest run tests/shared-repository.test.ts` falló en cadena rechazo+2 pendientes con «Hay cambios dependientes…». GREEN: mismo comando, 6/6. Test real SQLite (node:sqlite) comprueba reapertura, archivo originales íntegros, 1 único envío antes y ninguno después de archivar/sync, rollback al fallar tercera escritura, cola/prefijo/proyección y aislamiento usuario; SENDING/ERROR/PENDING inciertos bloqueados. ESLint scoped 4 archivos limpio. Typecheck primera corrida sólo falló por propiedades de InventoryValue pendientes integración root (3 errores en SharedTeamSettings).

Sin commits, deploy, dependencias ni ediciones provider/InventoryState/engine/migraciones/firma. Fuentes estables comunicadas a root antes QA/build. Pendiente root: contrato provider y validación UI integrada / build final.
