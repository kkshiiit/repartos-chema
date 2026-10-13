import { userError } from '../src/services/errors';
import { useTheme } from '../src/context/ThemeContext';
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useInventory } from '../src/context/InventoryContext';
import { DATA_MODE } from '../src/services/firebase';
import { Button, Chip, ConfirmButton, Field, Notice, Screen, useUI } from '../src/components/ui';
import { pickBackup } from '../src/services/files';
import { enableNotifications } from '../src/services/notifications';
export default function Settings() {
  const { s } = useUI();
  const theme = useTheme();
  const { user } = useAuth(),
    { state, dispatch, backup, restore } = useInventory();
  const [names, setNames] = useState<string | null>(null),
    [restoreRaw, setRestoreRaw] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [success, setSuccess] = useState('');
  const run = async (f: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await f();
      setError('');
      setSuccess('Configuración guardada.');
    } catch (e) {
      setError(userError(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen title="Configuración" back>
      <View style={[s.card, { maxWidth: 700 }]}>
        <Text style={s.h2}>Apariencia</Text>
        <View style={s.wrap}>
          {(
            [
              { value: 'light', label: 'Claro' },
              { value: 'dark', label: 'Oscuro' },
              { value: 'system', label: 'Seguir sistema' },
            ] as const
          ).map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={theme.preference === option.value}
              onPress={() => theme.setPreference(option.value)}
            />
          ))}
        </View>
        <Text style={s.muted}>
          El sol o la luna cambian el tema al instante. Tu elección se guarda solo en este
          dispositivo.
        </Text>
        {theme.error ? <Notice text={theme.error} tone="error" /> : null}
      </View>
      <View style={[s.card, { maxWidth: 700 }]}>
        <Text style={s.h2}>Entorno de trabajo</Text>
        <Notice
          text={
            DATA_MODE === 'demo'
              ? 'Demostración local. Datos ficticios persistidos en este dispositivo. No hay sincronización cloud ni push enviados.'
              : 'Firebase configurado. Las operaciones se confirman con el servidor y los conflictos requieren revisión.'
          }
        />
        <Text style={s.muted}>
          El calendario usa America/Argentina/Buenos_Aires. Los nombres del flete son responsables
          configurables, no usuarios autenticados.
        </Text>
        {user?.role === 'ADMIN' ? (
          <>
            <Field
              label="Responsables · uno por línea"
              value={names ?? state.responsables.join('\n')}
              onChangeText={setNames}
              multiline
              style={{ minHeight: 140 }}
            />
            <Button
              loading={busy}
              label="Guardar responsables"
              onPress={() =>
                void run(() =>
                  dispatch({
                    type: 'RESPONSABLES',
                    nombres: (names ?? state.responsables.join('\n'))
                      .split('\n')
                      .map((n) => n.trim())
                      .filter(Boolean),
                  }),
                )
              }
            />
            <Button
              label="Gestionar combos"
              variant="secondary"
              onPress={() => router.push('/combos')}
            />
            <Button
              loading={busy}
              label="Activar avisos"
              variant="secondary"
              onPress={() => void run(enableNotifications)}
            />
          </>
        ) : null}
        {user?.role === 'ADMIN' ? (
          <View style={s.section}>
            <Text style={s.h2}>Copia de datos</Text>
            <Notice text="Guarda la copia en un lugar privado. Contiene obras, historial y fotos locales; no incluye contraseñas. Los archivos Excel y Word no reemplazan esta copia." />
            <Button
              label="Descargar copia"
              variant="secondary"
              loading={busy}
              onPress={() => void run(backup)}
            />
            {DATA_MODE === 'demo' ? (
              <Button
                label="Elegir copia"
                variant="secondary"
                loading={busy}
                onPress={() => void run(async () => setRestoreRaw(await pickBackup()))}
              />
            ) : null}
            {restoreRaw !== null ? (
              <ConfirmButton
                label="Restaurar copia"
                title="Reemplazar datos demo"
                description="Se validará la copia y se conservará el inventario anterior en este dispositivo antes de reemplazarlo. Esta acción cambia todas las obras de la demo."
                onConfirm={async () => {
                  await restore(restoreRaw);
                  setRestoreRaw(null);
                  setSuccess('Copia restaurada.');
                }}
              />
            ) : null}
          </View>
        ) : null}
        {error ? <Notice text={error} tone="error" /> : null}
        {success ? <Notice text={success} tone="success" /> : null}
      </View>
    </Screen>
  );
}
