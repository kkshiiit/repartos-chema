import { FeedbackSettings } from '../src/components/FeedbackSettings';
import { Disclosure } from '../src/components/Editorial';
import { DepotSettings } from '../src/components/DepotSettings';
import { TeamSettings } from '../src/components/TeamSettings';
import { LocalBackupActions } from '../src/components/LocalBackupActions';
import { BackupImport } from '../src/components/BackupImport';
import { useWelcome } from '../src/components/WelcomeProvider';
import { userError } from '../src/services/errors';
import { useTheme } from '../src/context/ThemeContext';
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useInventory } from '../src/context/InventoryContext';
import { DATA_MODE } from '../src/services/firebase';
import { LOCAL_ONLY } from '../src/services/localMode';
import { Button, Chip, ConfirmButton, Field, Notice, Screen, useUI } from '../src/components/ui';
import { enableNotifications } from '../src/services/notifications';
export default function Settings() {
  const { s } = useUI();
  const theme = useTheme();
  const { openWelcome } = useWelcome();
  const { user } = useAuth(),
    { state, dispatch, backup, recoverPrevious } = useInventory();
  const [names, setNames] = useState<string | null>(null),
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
    <Screen title="Ajustes" back>
      <Button label="Ver bienvenida" variant="secondary" onPress={openWelcome} />

      <Disclosure title="Apariencia" initiallyOpen>
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
          Tu elección se guarda en este dispositivo. También podés cambiarla desde la cabecera
          principal.
        </Text>
        <Text style={s.h2}>Movimiento</Text>
        <View style={s.wrap}>
          <Chip
            label="Transiciones suaves"
            selected={theme.motionPreference === 'ambient'}
            onPress={() => theme.setMotionPreference('ambient')}
          />
          <Chip
            label="Estático"
            selected={theme.motionPreference === 'static'}
            onPress={() => theme.setMotionPreference('static')}
          />
        </View>
        <Text style={s.muted}>
          Se respeta reducir movimiento del sistema. El fondo es estático en ambos modos.
        </Text>
        {theme.motionError ? <Notice text={theme.motionError} tone="error" /> : null}
        {theme.error ? <Notice text={theme.error} tone="error" /> : null}
      </Disclosure>
      <FeedbackSettings />
      <TeamSettings />
      <DepotSettings />
      <View style={[s.card, { maxWidth: 700 }]}>
        <Text style={s.h2}>Entorno de trabajo</Text>
        <Notice
          text={
            LOCAL_ONLY
              ? 'Uso individual sin conexión. Los datos se guardan en este celular; no se envían a Firebase ni a otros servicios. Conserva copias JSON fuera del dispositivo.'
              : DATA_MODE === 'demo'
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
                run(() =>
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
            {!LOCAL_ONLY ? (
              <Button
                loading={busy}
                label="Activar avisos"
                variant="secondary"
                onPress={() => run(enableNotifications)}
              />
            ) : null}
          </>
        ) : null}
        {user?.role === 'ADMIN' ? (
          <View style={s.section}>
            <Text style={s.h2}>Copia de datos</Text>
            <Notice text="Guarda la copia en un lugar privado. Contiene alquileres, historial y fotos locales; no incluye contraseñas. Los archivos Excel y Word no reemplazan esta copia." />
            {LOCAL_ONLY ? (
              <LocalBackupActions />
            ) : (
              <Button
                label="Descargar copia"
                variant="secondary"
                loading={busy}
                onPress={() => run(backup)}
              />
            )}
            {DATA_MODE === 'demo' ? <BackupImport /> : null}
            {LOCAL_ONLY ? (
              <>
                <ConfirmButton
                  label="Recuperar anterior"
                  title="Recuperar inventario anterior"
                  description="Se recuperará la copia local anterior a Empezar vacío. Los datos activos también se archivarán antes del cambio."
                  onConfirm={async () => {
                    await recoverPrevious();
                    setNames(null);
                    setSuccess('Inventario anterior recuperado.');
                  }}
                />
              </>
            ) : null}
          </View>
        ) : null}
        {error ? <Notice text={error} tone="error" /> : null}
        {success ? <Notice text={success} tone="success" /> : null}
      </View>
    </Screen>
  );
}
