import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import {
  Navigation,
  LocateFixed,
  ArrowUp,
  ArrowDown,
  CornerDownLeft,
  Route,
  RotateCcw,
  MoreHorizontal,
  ChevronRight,
  Warehouse,
} from 'lucide-react-native';
import * as Location from 'expo-location';
import { useInventory } from '../../src/context/InventoryContext';
import {
  Button,
  Empty,
  Notice,
  Screen,
  Select,
  IconButton,
  Sheet,
  useUI,
} from '../../src/components/ui';
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
import { spacing, radius } from '../../src/theme/tokens';
export default function Trip() {
  const { C, s } = useUI(),
    { state } = useInventory();
  const [zone, setZone] = useState('TODAS'),
    [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null),
    [order, setOrder] = useState<string[]>([]),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [depot, setDepot] = useState(DEFAULT_DEPOT),
    [panel, setPanel] = useState<'options' | 'routes' | 'stop' | 'depot' | null>(null),
    [selectedId, setSelectedId] = useState<string | null>(null);
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
  const selectedIndex = works.findIndex((o) => o.id === selectedId);
  const selectedStop = works[selectedIndex];
  const orderingLabel = order.length
    ? 'Orden manual'
    : origin
      ? 'Prioridad de retiro y cercanía'
      : 'Vencidos · Hoy · Entregas';
  const locate = () =>
    run(async () => {
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
    });
  return (
    <Screen
      title="Viaje"
      action={
        <IconButton
          label="Opciones del viaje"
          icon={MoreHorizontal}
          onPress={() => setPanel('options')}
        />
      }
      footer={
        works.length ? (
          <Button
            label="Abrir recorrido"
            icon={Navigation}
            loading={busy}
            disabled={!routes.items.length}
            onPress={() => {
              if (routes.items.length > 1) setPanel('routes');
              else if (routes.items[0]) return run(() => openLink(routes.items[0]!.url));
            }}
          />
        ) : undefined
      }
    >
      <View
        style={[
          s.row,
          {
            padding: spacing.md,
            backgroundColor: C.infoBackground,
            borderRadius: radius.object,
          },
        ]}
      >
        <Route size={24} color={C.infoText} />
        <View style={s.grow}>
          <Text style={[s.body, { fontWeight: '700', color: C.infoText }]}>
            Primero, los retiros
          </Text>
          <Text style={[s.muted, { color: C.infoText }]}>{orderingLabel}</Text>
        </View>
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
      {error || routes.error ? <Notice text={error || routes.error} tone="error" /> : null}
      {!works.length ? (
        <Empty title="Sin paradas" detail="No hay alquileres pendientes en esta zona." />
      ) : (
        <>
          <Text style={s.muted}>
            {works.length} {works.length === 1 ? 'parada' : 'paradas'} · regreso al depósito
          </Text>
          <View
            style={{
              backgroundColor: C.panel,
              borderRadius: radius.object,
              paddingHorizontal: spacing.md,
            }}
          >
            {works.map((o, index) => (
              <View key={o.id} style={{ flexDirection: 'row', gap: spacing.md }}>
                <View style={{ width: spacing.xxl, alignItems: 'center' }}>
                  {/* The rail joins consecutive stops without adding a card to each one. */}
                  <View
                    style={{
                      position: 'absolute',
                      top: spacing.lg,
                      bottom: -spacing.lg,
                      width: 1,
                      backgroundColor: C.hairline,
                    }}
                  />
                  <View
                    style={{
                      marginTop: spacing.lg,
                      minWidth: spacing.xxl,
                      minHeight: spacing.xxl,
                      borderRadius: radius.pill,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: C.selection,
                    }}
                  >
                    <Text
                      style={[
                        s.body,
                        {
                          fontWeight: '700',
                          color: C.selectionText,
                          fontVariant: ['tabular-nums'],
                        },
                      ]}
                    >
                      {index + 1}
                    </Text>
                  </View>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Parada ${index + 1}: ${o.clienteNombre}. Ver detalles y ordenar`}
                  onPress={() => {
                    setSelectedId(o.id);
                    setPanel('stop');
                  }}
                  style={({ pressed }) => ({
                    flex: 1,
                    minWidth: 0,
                    minHeight: spacing.touch,
                    paddingVertical: spacing.lg,
                    borderBottomWidth: 1,
                    borderBottomColor: C.hairline,
                    backgroundColor: pressed ? C.selection : 'transparent',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.sm,
                  })}
                >
                  <View style={[s.grow, { gap: spacing.xs }]}>
                    <Text style={[s.body, { fontWeight: '700' }]}>{o.clienteNombre}</Text>
                    <Text style={s.muted}>{o.direccion}</Text>
                    <Text style={s.muted}>
                      {o.localidadBarrio}
                      {origin && o.coordenadas
                        ? ` · ${distanceKm(origin, o.coordenadas).toFixed(1)} km`
                        : ''}
                    </Text>
                    <View style={{ alignItems: 'flex-start' }}>
                      <StatusChip obra={o} />
                    </View>
                  </View>
                  <ChevronRight size={20} color={C.subtle} />
                </Pressable>
              </View>
            ))}
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <View style={{ width: spacing.xxl, alignItems: 'center', paddingTop: spacing.lg }}>
                <View
                  style={{
                    minWidth: spacing.xxl,
                    minHeight: spacing.xxl,
                    borderRadius: radius.pill,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: C.panel2,
                  }}
                >
                  <Warehouse size={20} color={C.muted} />
                </View>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Depósito: ver regreso"
                onPress={() => setPanel('depot')}
                style={({ pressed }) => ({
                  flex: 1,
                  minWidth: 0,
                  minHeight: spacing.touch,
                  paddingVertical: spacing.lg,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.sm,
                  backgroundColor: pressed ? C.selection : 'transparent',
                })}
              >
                <View style={s.grow}>
                  <Text style={[s.body, { fontWeight: '700' }]}>Depósito</Text>
                  <Text style={s.muted}>Regreso · {depot.direccion}</Text>
                </View>
                <ChevronRight size={20} color={C.subtle} />
              </Pressable>
            </View>
          </View>
          <Text style={s.muted}>
            {routes.items.length > 1
              ? `Recorrido dividido en ${routes.items.length} tramos. Abrilos en orden; el último vuelve al depósito.`
              : 'Google Maps abre las paradas en este orden y regresa al depósito.'}
            {origin ? ' La cercanía usa distancia en línea recta, sin tráfico.' : ''}
          </Text>
        </>
      )}
      <Sheet
        visible={panel !== null}
        title={
          panel === 'stop'
            ? `Parada ${selectedIndex + 1}`
            : panel === 'depot'
              ? 'Regreso al depósito'
              : panel === 'routes'
                ? 'Tramos del recorrido'
                : 'Opciones del viaje'
        }
        busy={busy}
        onClose={() => setPanel(null)}
      >
        {panel === 'options' ? (
          <>
            <Text style={s.muted}>{orderingLabel}</Text>
            <Button
              label="Usar mi ubicación"
              icon={LocateFixed}
              variant="secondary"
              loading={busy}
              onPress={locate}
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
            <Button
              label="Volver al depósito"
              icon={CornerDownLeft}
              variant="secondary"
              onPress={() => run(() => openLink(depotDirectionsUrl(depot)))}
            />
            <Text style={s.muted}>{depot.direccion}</Text>
            {routes.items.length ? (
              <Button
                label="Ver tramos del recorrido"
                icon={Route}
                variant="secondary"
                onPress={() => setPanel('routes')}
              />
            ) : null}
          </>
        ) : panel === 'routes' ? (
          <>
            <Text style={s.muted}>Abrí los tramos en orden. El último vuelve al depósito.</Text>
            {routes.items.map((r, i) => (
              <Button
                key={i}
                label={`Abrir tramo ${i + 1}`}
                icon={Navigation}
                variant="secondary"
                onPress={() => run(() => openLink(r.url))}
              />
            ))}
          </>
        ) : panel === 'depot' ? (
          <>
            <Text style={s.body}>{depot.direccion}</Text>
            <Button
              label="Volver al depósito"
              icon={CornerDownLeft}
              variant="secondary"
              onPress={() => run(() => openLink(depotDirectionsUrl(depot)))}
            />
          </>
        ) : selectedStop ? (
          <>
            <Text style={s.h2}>{selectedStop.clienteNombre}</Text>
            <StatusChip obra={selectedStop} />
            <Text style={s.body}>{selectedStop.direccion}</Text>
            <Text style={s.muted}>{selectedStop.localidadBarrio}</Text>
            <Button
              label="Cómo llegar"
              icon={Navigation}
              variant="secondary"
              onPress={() => run(() => openLink(mapsUrl(selectedStop)))}
            />
            <View style={s.wrap}>
              <Button
                label={`Subir parada ${selectedIndex + 1}`}
                icon={ArrowUp}
                variant="secondary"
                disabled={selectedIndex === 0}
                onPress={() => move(selectedStop.id, -1)}
              />
              <Button
                label={`Bajar parada ${selectedIndex + 1}`}
                icon={ArrowDown}
                variant="secondary"
                disabled={selectedIndex === works.length - 1}
                onPress={() => move(selectedStop.id, 1)}
              />
            </View>
          </>
        ) : null}
        {error || routes.error ? <Notice text={error || routes.error} tone="error" /> : null}
      </Sheet>
    </Screen>
  );
}
