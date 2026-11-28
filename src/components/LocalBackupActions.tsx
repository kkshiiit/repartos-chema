import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useInventory } from '../context/InventoryContext';
import { userError } from '../services/errors';
import type { BackupDestination } from '../services/files';
import { Button, Chip, ConfirmButton, Notice, Sheet, useUI } from './ui';
/** `safe`: descargar y recuperar. `danger`: empezar vacío, separado al final para no tocarlo sin querer. */
export function LocalBackupActions({ part = 'all' }: { part?: 'all' | 'safe' | 'danger' } = {}) {
  const { s } = useUI();
  const inv = useInventory();
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [result, setResult] = useState<BackupDestination | null>(null),
    [manual, setManual] = useState(false),
    [revision, setRevision] = useState(-1),
    [message, setMessage] = useState(''),
    [error, setError] = useState('');
  const [copies, setCopies] = useState<Awaited<ReturnType<typeof inv.archives>>>([]);
  async function save() {
    setBusy(true);
    setError('');
    try {
      const r = await inv.backupToDestination();
      setResult(r);
      setRevision(inv.state.revision);
      setMessage(
        r.saved
          ? 'Copia verificada en el destino elegido.'
          : r.prepared
            ? 'Descarga preparada. Guardá el JSON fuera de la aplicación.'
            : 'No se guardó una copia. Tus datos siguen intactos.',
      );
    } catch (e) {
      setError(userError(e));
      setResult(null);
    } finally {
      setBusy(false);
    }
  }
  const allowed =
    (result?.saved || (result?.prepared && manual)) && revision === inv.state.revision;
  return (
    <View style={s.section}>
      {part !== 'danger' ? (
        <Button
          label="Descargar copia"
          variant="secondary"
          loading={busy}
          onPress={() => void save()}
        />
      ) : null}
      {message && !open ? (
        <Notice text={message} tone={result?.saved ? 'success' : 'info'} />
      ) : null}
      {error && !open ? <Notice text={error} tone="error" /> : null}
      {part !== 'safe' ? (
        <Button
          label="Empezar vacío"
          variant="danger"
          onPress={() => {
            setResult(null);
            setManual(false);
            setError('');
            setMessage('');
            setOpen(true);
          }}
        />
      ) : null}
      <Sheet
        busy={busy}
        visible={open}
        title="Nuevo inventario vacío"
        onClose={() => !busy && setOpen(false)}
      >
        <Text style={s.body}>
          Guardá una copia fuera de la aplicación antes de continuar. También se conservará una
          recuperación interna. No se combinarán inventarios.
        </Text>
        <Button
          label="Guardar copia"
          variant="secondary"
          loading={busy}
          onPress={() => void save()}
        />
        {message ? <Notice text={message} /> : null}
        {result?.prepared ? (
          <Chip label="Guardé el JSON fuera" selected={manual} onPress={() => setManual(!manual)} />
        ) : null}
        {error ? <Notice text={error} tone="error" /> : null}
        <Button
          label="Vaciar inventario"
          variant="danger"
          loading={busy}
          disabled={!allowed}
          onPress={async () => {
            if (!allowed || busy) return;
            setBusy(true);
            try {
              await inv.startEmpty();
              setMessage('Inventario vacío. La recuperación anterior se conserva.');
              setOpen(false);
            } catch (e) {
              setError(userError(e));
            } finally {
              setBusy(false);
            }
          }}
        />
      </Sheet>
      {part !== 'danger' ? (
        <Button
          label="Ver recuperaciones"
          variant="secondary"
          onPress={async () => {
            try {
              setCopies(await inv.archives());
              setError('');
            } catch (e) {
              setError(userError(e));
            }
          }}
        />
      ) : null}
      {copies.map((c) => (
        <View key={c.key} style={[s.section, { borderTopWidth: 1, paddingTop: 16 }]}>
          <Text style={s.body}>
            {c.createdAt ? new Date(c.createdAt).toLocaleString('es-AR') : 'Copia anterior'}
          </Text>
          <Text style={s.muted}>
            {c.reason.includes('empty')
              ? 'Antes de vaciar'
              : c.reason.includes('restore')
                ? 'Importación'
                : 'Recuperación'}
          </Text>
          <ConfirmButton
            label="Recuperar copia"
            title="Recuperar esta copia"
            confirmLabel="Recuperar copia"
            description="Se archivarán los datos actuales antes de recuperar la copia elegida. No se combinan inventarios."
            onConfirm={async () => {
              await inv.recoverArchive(c.key);
              setMessage('Copia recuperada. Los datos anteriores también se conservaron.');
            }}
          />
        </View>
      ))}
    </View>
  );
}
