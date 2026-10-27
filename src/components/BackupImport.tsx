import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useInventory } from '../context/InventoryContext';
import { inspectBackup } from '../services/backupService';
import { userError } from '../services/errors';
import { pickBackupSelection, type BackupSelection } from '../services/files';
import type { Envelope, MaterialItem, ObraCard } from '../types';
import { formatDate } from '../utils/formatters';
import { DataList } from './DataList';
import { Button, ConfirmButton, Notice, Sheet, useUI } from './ui';

type Selection = BackupSelection & { envelope: Envelope };
type PreviewRow =
  | { id: string; kind: 'rental'; obra: ObraCard }
  | { id: string; kind: 'material'; material: MaterialItem };

export function BackupImport() {
  const { s, C } = useUI();
  const { state, restore, undoRestore, backup, workspaceId } = useInventory();
  const [selection, setSelection] = useState<Selection | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const rows = useMemo<PreviewRow[]>(
    () =>
      selection
        ? [
            ...selection.envelope.state.obras.map((obra) => ({
              id: `rental:${obra.id}`,
              kind: 'rental' as const,
              obra,
            })),
            ...selection.envelope.state.materiales.map((material) => ({
              id: `material:${material.id}`,
              kind: 'material' as const,
              material,
            })),
          ]
        : [],
    [selection],
  );
  const choose = async () => {
    setSelection(null);
    setError('');
    setSuccess('');
    setBusy(true);
    try {
      const file = await pickBackupSelection();
      if (file === null) return;
      const { envelope } = inspectBackup(file.raw);
      setSelection({ ...file, envelope });
    } catch (e) {
      setError(userError(e));
    } finally {
      setBusy(false);
    }
  };
  const confirm = async () => {
    if (!selection || busy) return;
    setBusy(true);
    setError('');
    try {
      await restore(selection.raw);
      const count = selection.envelope.state.obras.length;
      setSuccess(
        `Importación completada: ${count} ${count === 1 ? 'alquiler guardado' : 'alquileres guardados'} en este celular.`,
      );
      setSelection(null);
    } catch (e) {
      setError(userError(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <View style={s.section}>
      <Text style={s.muted}>
        Elegí el archivo JSON y revisá su contenido. Hasta confirmar, tus datos no cambian.
      </Text>
      <Button label="Elegir copia" variant="secondary" loading={busy} onPress={choose} />
      {error && !selection ? <Notice text={error} tone="error" /> : null}
      {success ? <Notice text={success} tone="success" /> : null}
      <Sheet
        visible={selection !== null}
        title="Revisar importación JSON"
        scroll={false}
        busy={busy}
        onClose={() => !busy && setSelection(null)}
      >
        {selection ? (
          <DataList<PreviewRow>
            data={rows}
            keyExtractor={(row) => row.id}
            getItemType={(row) => row.kind}
            contentContainerStyle={{ paddingBottom: 12 }}
            ListHeaderComponent={
              <View style={{ gap: 12, paddingBottom: 16 }}>
                <Text style={s.h2}>{selection.name || 'Copia seleccionada'}</Text>
                <Text style={s.muted}>
                  Formato Chema · versión {selection.envelope.schema}
                  {selection.size !== undefined
                    ? ` · ${(selection.size / 1024).toLocaleString('es-AR', { maximumFractionDigits: 1 })} KB`
                    : ''}
                </Text>
                <Notice
                  text={`Archivo validado: ${selection.envelope.state.obras.length} alquileres y ${selection.envelope.state.materiales.length} materiales.`}
                />
                <Text style={s.body}>
                  El archivo reemplazará el inventario actual. No se suman ni se combinan los
                  alquileres.
                </Text>
                <Text style={s.muted}>
                  Actual: {state.obras.length} alquileres · {state.materiales.length} materiales. Se
                  guardará automáticamente una copia de recuperación antes del cambio. Podés
                  recuperarla con «Deshacer última importación».
                </Text>
                {error ? <Notice text={error} tone="error" /> : null}
              </View>
            }
            renderItem={({ item }) =>
              item.kind === 'rental' ? (
                <View
                  style={{
                    paddingVertical: 12,
                    gap: 4,
                    borderTopWidth: 1,
                    borderTopColor: C.hairline,
                  }}
                >
                  <Text style={s.label}>{item.obra.clienteNombre}</Text>
                  <Text style={s.body}>
                    {item.obra.direccion} · {item.obra.localidadBarrio}
                  </Text>
                  <Text style={s.muted}>
                    Entrega prevista {formatDate(item.obra.fechaEntrega)} · Alquilado hasta{' '}
                    {formatDate(item.obra.fechaRetiroEstimada)}
                  </Text>
                  {item.obra.materialesCargados.map((m, i) => (
                    <Text key={`${m.materialId}:${i}`} style={s.muted}>
                      {m.cantidad} × {m.nombre}
                      {m.medida ? ` · ${m.medida}` : ''}
                    </Text>
                  ))}
                </View>
              ) : (
                <View
                  style={{
                    paddingVertical: 12,
                    gap: 4,
                    borderTopWidth: 1,
                    borderTopColor: C.hairline,
                  }}
                >
                  <Text style={s.label}>
                    {item.material.nombre}
                    {item.material.medida ? ` · ${item.material.medida}` : ''}
                  </Text>
                  <Text style={s.muted}>
                    Disponible {item.material.cantidadGalpon} · Alquilado{' '}
                    {item.material.cantidadEnObra} · A reparar {item.material.cantidadEnTaller} ·
                    Perdido {item.material.cantidadPerdido}
                  </Text>
                </View>
              )
            }
            ListFooterComponent={
              <View style={{ gap: 12, paddingTop: 16 }}>
                <Button
                  label={workspaceId ? 'Abrir copia individual' : 'Restaurar esta copia'}
                  variant="danger"
                  loading={busy}
                  onPress={confirm}
                />
                <Button
                  label="Cancelar importación"
                  variant="secondary"
                  disabled={busy}
                  onPress={() => setSelection(null)}
                />
                <Button
                  label="Guardar copia actual"
                  variant="ghost"
                  loading={busy}
                  onPress={async () => {
                    try {
                      await backup();
                      setError('');
                    } catch (e) {
                      setError(userError(e));
                    }
                  }}
                />
              </View>
            }
          />
        ) : null}
      </Sheet>
      {!workspaceId ? (
        <ConfirmButton
          label="Deshacer última importación"
          title="Recuperar datos anteriores"
          description="Volverás a los datos anteriores a la última importación. Los datos activos también se archivarán antes del cambio."
          onConfirm={async () => {
            await undoRestore();
            setError('');
            setSuccess('Se recuperaron los datos anteriores a la importación.');
          }}
        />
      ) : null}
    </View>
  );
}
