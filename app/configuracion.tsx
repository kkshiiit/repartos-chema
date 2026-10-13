import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useInventory } from '../src/context/InventoryContext';
import { DATA_MODE } from '../src/services/firebase';
import { Button, Field, Notice, Screen, s } from '../src/components/ui';
import { useAds, adProvider, adTestMode } from '../src/context/AdsContext';
import { enableNotifications } from '../src/services/notifications';
export default function Settings() {
  const ads = useAds();
  const { user } = useAuth(),
    { state, dispatch } = useInventory();
  const [names, setNames] = useState<string | null>(null),
    [error, setError] = useState(''),
    [success, setSuccess] = useState('');
  const run = async (f: () => Promise<unknown>) => {
    try {
      await f();
      setError('');
      setSuccess('Configuración guardada.');
    } catch (e) {
      setError((e as Error).message);
    }
  };
  return (
    <Screen title="Configuración" back>
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
              label="Activar avisos"
              variant="secondary"
              onPress={() => void run(enableNotifications)}
            />
          </>
        ) : null}
        <View style={s.divider} />
        <Text style={s.h2}>Publicidad discreta</Text>
        <Text style={s.muted}>
          Un banner al final de Obras y Galpón. Sin anuncios en entregas, retiros, fotos o
          historial. No enviamos nombres de clientes, direcciones de obra ni coordenadas GPS al SDK
          publicitario.
        </Text>
        <Notice
          text={
            adProvider === 'none'
              ? 'Pendiente de configurar una cuenta AdMob o un patrocinador. No se generan ingresos.'
              : adProvider === 'admob' && adTestMode
                ? 'AdMob en modo de prueba. Los anuncios de prueba no generan ingresos.'
                : ads.enabled
                  ? 'Publicidad habilitada en este dispositivo.'
                  : 'Publicidad desactivada en este dispositivo.'
          }
        />
        {ads.error ? <Notice text={ads.error} tone="error" /> : null}
        {user?.role === 'ADMIN' ? (
          <Button
            label={ads.enabled ? 'Desactivar publicidad' : 'Activar publicidad'}
            variant="secondary"
            onPress={() => void run(() => ads.setEnabled(!ads.enabled))}
          />
        ) : null}
        {adProvider === 'admob' ? (
          <Button
            label="Privacidad publicitaria"
            variant="ghost"
            onPress={() => void run(ads.privacy)}
          />
        ) : null}
        {error ? <Notice text={error} tone="error" /> : null}
        {success ? <Notice text={success} tone="success" /> : null}
      </View>
    </Screen>
  );
}
