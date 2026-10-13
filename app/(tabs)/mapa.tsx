import React, { useMemo, useState } from 'react';
import { View, Text } from 'react-native';
import { Navigation, LocateFixed, MapPin, ArrowUp, ArrowDown, Route } from 'lucide-react-native';
import * as Location from 'expo-location';
import { useInventory } from '../../src/context/InventoryContext';
import { Button, C, Chip, Empty, Field, Notice, Screen, Sheet, s } from '../../src/components/ui';
import { StatusChip } from '../../src/components/StatusChip';
import { distanceKm, coordinates } from '../../src/domain/rules';
import { mapsUrl } from '../../src/utils/whatsapp';
import { openLink } from '../../src/services/links';
export default function Trip() {
  const { state } = useInventory();
  const [zone, setZone] = useState('TODAS'),
    [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null),
    [order, setOrder] = useState<string[]>([]),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [manual, setManual] = useState(false),
    [lat, setLat] = useState(''),
    [lng, setLng] = useState('');
  const zones = [...new Set(state.obras.map((o) => o.localidadBarrio))];
  const works = useMemo(() => {
    const works = state.obras.filter(
      (o) =>
        ['PENDIENTE_ENTREGA', 'ENTREGADO'].includes(o.estadoProceso) &&
        (zone === 'TODAS' || o.localidadBarrio === zone),
    );
    return works.sort((a, b) => {
      if (order.length)
        return (
          (order.indexOf(a.id) < 0 ? 999 : order.indexOf(a.id)) -
          (order.indexOf(b.id) < 0 ? 999 : order.indexOf(b.id))
        );
      if (origin)
        return (
          (a.coordenadas ? distanceKm(origin, a.coordenadas) : Infinity) -
          (b.coordenadas ? distanceKm(origin, b.coordenadas) : Infinity)
        );
      return a.fechaRetiroEstimada.localeCompare(b.fechaRetiroEstimada);
    });
  }, [state.obras, zone, origin, order]);
  const move = (id: string, d: number) => {
    const ids = works.map((o) => o.id),
      index = ids.indexOf(id),
      target = index + d;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target]!, ids[index]!];
    setOrder(ids);
  };
  const run = async (f: () => Promise<void>) => {
    setBusy(true);
    try {
      await f();
      setError('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen
      title="Tu próximo recorrido"
      subtitle="Organizá las paradas y salí a la obra."
      action={
        <Button
          label="Ordenar por GPS"
          icon={LocateFixed}
          loading={busy}
          onPress={() =>
            void run(async () => {
              const p = await Location.requestForegroundPermissionsAsync();
              if (!p.granted)
                throw new Error('Permiso no concedido. Puedes elegir un origen manual.');
              const loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
              });
              setOrigin({ lat: loc.coords.latitude, lng: loc.coords.longitude });
              setOrder([]);
            })
          }
        />
      }
    >
      <View style={[s.card, { flexDirection: 'row', alignItems: 'center' }]}>
        <View style={{ padding: 16, backgroundColor: '#60A5FA12', borderRadius: 15 }}>
          <Route size={32} color={C.blue} />
        </View>
        <View style={{ flex: 1, gap: 5 }}>
          <Text style={s.h2}>Lista de viaje</Text>
          <Text style={s.muted}>
            Sin proveedor de mapa configurado. Navegación externa por dirección o coordenadas
            reales.
          </Text>
        </View>
      </View>
      <View style={s.wrap}>
        <Chip
          label="Todas las zonas"
          selected={zone === 'TODAS'}
          onPress={() => {
            setZone('TODAS');
            setOrder([]);
          }}
        />
        {zones.map((z) => (
          <Chip
            key={z}
            label={z}
            selected={zone === z}
            onPress={() => {
              setZone(z);
              setOrder([]);
            }}
          />
        ))}
      </View>
      <View style={s.wrap}>
        <Button
          label="Origen manual"
          icon={MapPin}
          variant="secondary"
          onPress={() => setManual(true)}
        />
        {origin ? (
          <Button
            label="Quitar origen"
            variant="ghost"
            onPress={() => {
              setOrigin(null);
              setOrder([]);
            }}
          />
        ) : null}
      </View>
      {origin ? (
        <Notice text="Distancia en línea recta desde el origen; no considera calles ni tráfico. Las obras sin coordenadas quedan al final. Puedes reordenar las paradas." />
      ) : null}
      {error ? <Notice text={error} tone="error" /> : null}
      {!works.length ? (
        <Empty title="Sin paradas" detail="No hay obras activas en esta zona." />
      ) : (
        works.map((o, index) => (
          <View
            key={o.id}
            style={[s.card, { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }]}
          >
            <View
              style={{
                backgroundColor: C.panel2,
                borderRadius: 12,
                width: 44,
                height: 44,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: C.text, fontWeight: '800', fontSize: 19 }}>{index + 1}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 170, gap: 7 }}>
              <StatusChip obra={o} />
              <Text style={s.h2}>{o.clienteNombre}</Text>
              <Text style={s.muted}>
                {o.direccion} · {o.localidadBarrio}
              </Text>
              <Text style={{ fontSize: 12, color: C.blue }}>
                {origin && o.coordenadas
                  ? `${distanceKm(origin, o.coordenadas).toFixed(1)} km desde el origen`
                  : o.coordenadas
                    ? 'Coordenadas registradas'
                    : 'Sin coordenadas · navegar por dirección'}
              </Text>
            </View>
            <View style={s.wrap}>
              <Button
                label="Subir"
                icon={ArrowUp}
                variant="ghost"
                disabled={index === 0}
                onPress={() => move(o.id, -1)}
              />
              <Button
                label="Bajar"
                icon={ArrowDown}
                variant="ghost"
                disabled={index === works.length - 1}
                onPress={() => move(o.id, 1)}
              />
              <Button
                label="Navegar"
                icon={Navigation}
                variant="secondary"
                onPress={() => void run(() => openLink(mapsUrl(o)))}
              />
            </View>
          </View>
        ))
      )}
      <Sheet visible={manual} title="Origen manual" onClose={() => setManual(false)}>
        <Field
          label="Latitud"
          value={lat}
          onChangeText={setLat}
          keyboardType="numbers-and-punctuation"
        />
        <Field
          label="Longitud"
          value={lng}
          onChangeText={setLng}
          keyboardType="numbers-and-punctuation"
        />
        {error ? <Notice text={error} tone="error" /> : null}
        <Button
          label="Ordenar viaje"
          onPress={() => {
            try {
              if (!lat.trim() || !lng.trim()) throw new Error('Completa ambas coordenadas.');
              const c = { lat: Number(lat), lng: Number(lng) };
              coordinates(c);
              setOrigin(c);
              setOrder([]);
              setManual(false);
              setError('');
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        />
      </Sheet>
    </Screen>
  );
}
