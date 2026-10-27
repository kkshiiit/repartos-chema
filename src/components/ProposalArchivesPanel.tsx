import React, { useState } from 'react';
import { Text, View } from 'react-native';
import type { Action } from '../types';
import type { ConflictArchive, ConflictArchiveSummary } from '../shared/repository';
import { saveFile } from '../services/files';
import { userError } from '../services/errors';
import { Button, Notice, useUI } from './ui';

const actionNames: Record<Action['type'], string> = {
  CREATE_OBRA: 'Crear alquiler',
  UPDATE_OBRA: 'Editar alquiler',
  DELETE_OBRA: 'Eliminar alquiler',
  SET_LOAD: 'Preparar carga',
  DELIVER: 'Registrar entrega',
  RETIRE: 'Registrar retiro',
  REPORT: 'Registrar incidencia',
  RECOVER: 'Recuperar piezas',
  REENTER: 'Registrar reingreso',
  REACTIVATE: 'Reactivar alquiler',
  TRANSFER: 'Transferir piezas',
  SAVE_MATERIAL: 'Guardar material',
  ADJUST: 'Ajustar inventario',
  MOVE_STOCK: 'Mover existencias',
  CORRECT_INCIDENT: 'Corregir incidencia',
  SAVE_COMBO: 'Guardar combo',
  DELETE_COMBO: 'Eliminar combo',
  RESPONSABLES: 'Configurar responsables',
  PHOTO: 'Agregar foto',
  DELETE_PHOTO: 'Quitar foto',
  LOCATION: 'Guardar ubicación',
  UNDO: 'Deshacer movimiento',
};
/** Resolve only identifiers used in this proposal; never export the stock snapshot. */
function readableProposal(value: unknown, archive: ConflictArchive): unknown {
  if (Array.isArray(value)) return value.map((entry) => readableProposal(entry, archive));
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => {
      if (key === 'materialId' && typeof entry === 'string') {
        const material = archive.context.materiales.find((item) => item.id === entry);
        return [
          key,
          material ? [material.nombre, material.medida].filter(Boolean).join(' · ') : entry,
        ];
      }
      if ((key === 'obraId' || key === 'targetId') && typeof entry === 'string') {
        const obra = archive.context.obras.find((item) => item.id === entry);
        return [key, obra ? `${obra.clienteNombre} · ${obra.direccion} (${entry})` : entry];
      }
      return [key, readableProposal(entry, archive)];
    }),
  );
}
export function ProposalArchivesPanel({
  archives,
  readArchive,
}: {
  archives: ConflictArchiveSummary[];
  readArchive: (id: string) => Promise<ConflictArchive | null>;
}) {
  const { s } = useUI();
  const [selected, setSelected] = useState<ConflictArchive | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await task();
    } catch (e) {
      setError(userError(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <View style={s.section}>
      <Text style={s.h2}>Propuestas archivadas</Text>
      <Text style={s.muted}>
        Son propuestas propias conservadas para consultar y corregir manualmente con los datos
        actuales. No se reenvían al equipo.
      </Text>
      {error ? <Notice text={error} tone="error" /> : null}
      {archives.length === 0 ? (
        <Text style={s.muted}>Todavía no hay propuestas archivadas.</Text>
      ) : null}
      {archives.map((archive) => (
        <Button
          key={archive.id}
          label={`${new Date(archive.archivedAt).toLocaleString('es-AR')} · ${archive.reason}`}
          variant="secondary"
          disabled={busy}
          onPress={() =>
            run(async () => {
              const found = await readArchive(archive.id);
              if (!found) throw new Error('No se encontró la propuesta archivada.');
              setSelected(found);
            })
          }
        />
      ))}
      {selected ? (
        <View style={s.card}>
          <Text style={s.label}>{selected.reason}</Text>
          {selected.proposals.map((row) => (
            <View key={row.command.operationId} style={s.card}>
              <Text style={s.label}>{actionNames[row.command.action.type]}</Text>
              <Text style={s.body}>
                {row.error || 'Dependiente sin enviar; requiere revisión manual.'}
              </Text>
              <Text selectable style={s.body}>
                {JSON.stringify(readableProposal(row.command.action, selected), null, 2)}
              </Text>
            </View>
          ))}
          <Button
            label="Exportar estas propuestas"
            variant="secondary"
            disabled={busy}
            onPress={() =>
              run(async () => {
                const ownProposals = {
                  schema: 1,
                  spaceId: selected.spaceId,
                  userId: selected.userId,
                  archivedAt: selected.archivedAt,
                  reason: selected.reason,
                  proposals: selected.proposals.map((row) => ({
                    ...row,
                    detail: readableProposal(row.command.action, selected),
                  })),
                };
                await saveFile(
                  'chema-propuestas-archivadas.json',
                  new TextEncoder().encode(JSON.stringify(ownProposals, null, 2)),
                  'application/json',
                  'Guardar propuestas propias',
                );
              })
            }
          />
          <Button label="Cerrar propuesta" variant="ghost" onPress={() => setSelected(null)} />
        </View>
      ) : null}
    </View>
  );
}
