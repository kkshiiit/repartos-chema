import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useInventory } from '../context/InventoryContext';
import { inspectBackup } from '../services/backupService';
import { userError } from '../services/errors';
import { pickBackup } from '../services/files';
import { Button, ConfirmButton, Notice, Sheet, useUI } from './ui';

export function BackupImport() {
  const { s } = useUI();
  const { state, restore, undoRestore } = useInventory();
  const [selection, setSelection] = useState<{
    raw: string;
    obras: number;
    materiales: number;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const choose = async () => {
    setSelection(null);
    setError('');
    setSuccess('');
    setBusy(true);
    try {
      const raw = await pickBackup();
      if (raw === null) return;
      const { envelope } = inspectBackup(raw);
      setSelection({
        raw,
        obras: envelope.state.obras.length,
        materiales: envelope.state.materiales.length,
      });
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
      setSuccess(
        `Importación completada: ${selection.obras} alquileres guardados en este celular.`,
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
        Elegí el archivo JSON y revisá su contenido antes de confirmar. Elegirlo todavía no cambia
        tus datos.
      </Text>
      <Button
        label="Elegir copia"
        variant="secondary"
        loading={busy}
        onPress={() => void choose()}
      />
      {error && !selection ? <Notice text={error} tone="error" /> : null}
      {success ? <Notice text={success} tone="success" /> : null}
      <Sheet
        visible={selection !== null}
        title="Revisar importación JSON"
        onClose={() => !busy && setSelection(null)}
      >
        {selection ? (
          <>
            <Notice
              text={`Archivo validado: ${selection.obras} alquileres y ${selection.materiales} materiales.`}
            />
            <Text style={s.body}>
              Se reemplazarán los {state.obras.length} alquileres y {state.materiales.length}{' '}
              materiales actuales por los de esta copia. No se combinan inventarios. Se archivarán
              tus datos actuales antes del cambio; podés recuperarlos con «Deshacer última
              importación».
            </Text>
            {error ? <Notice text={error} tone="error" /> : null}
            <Button label="Confirmar importación" loading={busy} onPress={() => void confirm()} />
            <Button
              label="Cancelar importación"
              variant="secondary"
              disabled={busy}
              onPress={() => setSelection(null)}
            />
          </>
        ) : null}
      </Sheet>
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
    </View>
  );
}
