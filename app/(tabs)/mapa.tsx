import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { View, Text } from 'react-native';
import {
  Navigation,
  LocateFixed,
  ArrowUp,
  ArrowDown,
  CornerDownLeft,
  Route,
  RotateCcw,
} from 'lucide-react-native';
import * as Location from 'expo-location';
import { useInventory } from '../../src/context/InventoryContext';
import { Button, Empty, Notice, Screen, Select, IconButton, useUI } from '../../src/components/ui';
import { StatusChip } from '../../src/components/StatusChip';
import {
  sortTripStops,
  buildTripRoutes,
  depotDirectionsUrl,
  DEFAULT_DEPOT,
} from '../../src/utils/trip';
import { loadDepot } from '../../src/services/depotSettings';
import { distanceKm, businessDate } from '../../src/domain/rules';
import { mapsUrl } from '../../src/utils/whatsapp';
import { openLink } from '../../src/services/links';
import { userError } from '../../src/services/errors';
export default function Trip() {
  const { C, s } = useUI(),
    { state } = useInventory();
  const [zone, setZone] = useState('TODAS'),
    [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null),
    [order, setOrder] = useState<string[]>([]),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [depot, setDepot] = useState(DEFAULT_DEPOT);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      void loadDepot()
        .then((d) => {
          if (active) setDepot(d);
        })
        .catch((e) => {
          if (active) setError(userError(e));
        });
      return () => {
        active = false;
      };
    }, []),
  );
  const today = businessDate();
  const works = useMemo(
    () =>
      sortTripStops(
        state.obras.filter((o) => zone === 'TODAS' || o.localidadBarrio === zone),
        { today, origin, manualOrder: order },
      ),
    [state.obras, zone, today, origin, order],
  );
  const zones = [...new Set(state.obras.map((o) => o.localidadBarrio))].sort();
  async function run(f: () => Promise<unknown>) {
    setBusy(true);
    try {
      await f();
      setError('');
    } catch (e) {
      setError(userError(e));
    } finally {
      setBusy(false);
    }
  }
  const routes = useMemo(() => {
    try {
      return { items: buildTripRoutes(works, depot, origin), error: '' };
    } catch (e) {
      return { items: [], error: userError(e) };
    }
  }, [works, depot, origin]);
  function move(id: string, delta: number) {
    const ids = works.map((o) => o.id),
      index = ids.indexOf(id),
      target = index + delta;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target]!, ids[index]!];
    setOrder(ids);
  }
  return (
    <Screen title="Viaje">
      <View style={[s.card, { gap: 18 }]}>
        <View style={s.row}>
          <View style={{ backgroundColor: C.selection, padding: 10, borderRadius: 14 }}>
            <Route size={25} color={C.blue} />
          </View>
          <View style={s.grow}>
            <Text style={s.h2}>Primero, los retiros</Text>
            <Text style={s.muted}>
              {order.length
                ? 'Orden manual'
                : origin
                  ? 'Prioridad de retiro y cercanía'
                  : 'Vencidos · Hoy · Entregas'}
            </Text>
          </View>
        </View>
        <Button
          label="Volver al depósito"
          icon={CornerDownLeft}
          variant="secondary"
          onPress={() => void run(() => openLink(depotDirectionsUrl(depot)))}
        />
        <Text style={[s.muted, { fontSize: 12 }]}>{depot.direccion}</Text>
      </View>
      <Select
        label="Zona del viaje"
        value={zone}
        options={[
          { label: 'Todas las zonas', value: 'TODAS' },
          ...zones.map((z) => ({ label: z, value: z })),
        ]}
        onChange={(v) => {
          setZone(v);
          setOrder([]);
        }}
      />
      <View style={[s.wrap, { gap: 8 }]}>
        <Button
          label="Usar mi ubicación"
          icon={LocateFixed}
          variant="secondary"
          loading={busy}
          onPress={() =>
            void run(async () => {
              const permission = await Location.requestForegroundPermissionsAsync();
              if (!permission.granted)
                throw new Error(
                  'Ubicación no habilitada. Podés navegar con las direcciones y ordenar manualmente.',
                );
              const position = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
              });
              setOrigin({ lat: position.coords.latitude, lng: position.coords.longitude });
              setOrder([]);
            })
          }
        />
        {order.length || origin ? (
          <Button
            label="Restablecer orden"
            icon={RotateCcw}
            variant="ghost"
            onPress={() => {
              setOrder([]);
              setOrigin(null);
            }}
          />
        ) : null}
      </View>
      {error || routes.error ? <Notice text={error || routes.error} tone="error" /> : null}
      {!works.length ? (
        <Empty title="Sin paradas" detail="No hay alquileres pendientes en esta zona." />
      ) : (
        <>
          <View style={{ gap: 10 }}>
            {routes.items.map((r, i) => (
              <Button
                key={i}
                label={routes.items.length === 1 ? 'Abrir recorrido' : `Abrir tramo ${i + 1}`}
                icon={Navigation}
                onPress={() => void run(() => openLink(r.url))}
              />
            ))}
            <Text style={s.muted}>
              {routes.items.length > 1
                ? 'Recorrido dividido en tramos compatibles con Google Maps. Abrilos en orden. El último vuelve al depósito.'
                : 'Google Maps abre las paradas en este orden y regresa al depósito.'}{' '}
              {origin ? 'La cercanía usa distancia en línea recta, sin tráfico.' : ''}
            </Text>
          </View>
          {works.map((o, index) => (
            <View key={o.id} style={[s.card, { gap: 16 }]}>
              <View style={[s.row, { alignItems: 'flex-start' }]}>
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 11,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: C.selection,
                  }}
                >
                  <Text style={{ color: C.text, fontSize: 17, fontWeight: '800' }}>
                    {index + 1}
                  </Text>
                </View>
                <View style={[s.grow, { gap: 6 }]}>
                  <StatusChip obra={o} />
                  <Text style={s.h2}>{o.clienteNombre}</Text>
                  <Text style={s.body}>{o.direccion}</Text>
                  <Text style={s.muted}>
                    {o.localidadBarrio}
                    {origin && o.coordenadas
                      ? ` · ${distanceKm(origin, o.coordenadas).toFixed(1)} km`
                      : ''}
                  </Text>
                </View>
              </View>
              <View style={[s.row, { justifyContent: 'space-between' }]}>
                <View style={s.row}>
                  <IconButton
                    label={`Subir parada ${index + 1}`}
                    icon={ArrowUp}
                    onPress={() => move(o.id, -1)}
                  />
                  <IconButton
                    label={`Bajar parada ${index + 1}`}
                    icon={ArrowDown}
                    onPress={() => move(o.id, 1)}
                  />
                </View>
                <Button
                  label="Cómo llegar"
                  icon={Navigation}
                  variant="secondary"
                  onPress={() => void run(() => openLink(mapsUrl(o)))}
                />
              </View>
            </View>
          ))}
        </>
      )}
    </Screen>
  );
}
