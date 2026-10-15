import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Field, Notice, useUI } from './ui';
import { loadDepot, saveDepot } from '../services/depotSettings';
import { DEFAULT_DEPOT, depotDirectionsUrl } from '../utils/trip';
import { openLink } from '../services/links';
import { userError } from '../services/errors';
export function DepotSettings() {
  const { s } = useUI();
  const [depot, setDepot] = useState(DEFAULT_DEPOT),
    [address, setAddress] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState('');
  useEffect(() => {
    void loadDepot()
      .then((d) => {
        setDepot(d);
        setAddress(d.direccion);
      })
      .catch((e) => setError(userError(e)));
  }, []);
  return (
    <View style={s.card}>
      <Text style={s.h2}>Depósito</Text>
      <Text style={s.muted}>Destino fijo para regresar después del recorrido.</Text>
      <Field label="Dirección del depósito" value={address} onChangeText={setAddress} />
      <Button
        label="Guardar dirección"
        loading={busy}
        onPress={() => {
          setBusy(true);
          void saveDepot({
            ...depot,
            direccion: address.trim(),
            coordenadas: address.trim() === depot.direccion ? depot.coordenadas : undefined,
          })
            .then((d) => {
              setDepot(d);
              setNotice('Dirección guardada en este dispositivo.');
              setError('');
            })
            .catch((e) => setError(userError(e)))
            .finally(() => setBusy(false));
        }}
      />
      <Button
        label="Volver al depósito"
        variant="secondary"
        onPress={() =>
          void openLink(depotDirectionsUrl(depot)).catch((e) => setError(userError(e)))
        }
      />
      {error ? <Notice tone="error" text={error} /> : null}
      {notice ? <Notice text={notice} /> : null}
    </View>
  );
}
