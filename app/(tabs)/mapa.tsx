import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ChevronRight,
  CornerDownLeft,
  LocateFixed,
  MoreHorizontal,
  Navigation,
  Route,
  Warehouse,
} from 'lucide-react-native';
import * as Location from 'expo-location';
import { useInventory } from '../../src/context/InventoryContext';
import { useAuth } from '../../src/context/AuthContext';
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
import { DataList } from '../../src/components/DataList';
import { Segmented } from '../../src/components/ListStructure';
import { StatusChip } from '../../src/components/StatusChip';
import { PublishedRoutePanel } from '../../src/components/PublishedRoutePanel';
import { TripOrderEditor } from '../../src/components/TripOrderEditor';
import {
  buildTripRoutes,
  depotDirectionsUrl,
  DEFAULT_DEPOT,
  sortTripStops,
} from '../../src/utils/trip';
import {
  eligibleTripStops,
  reconcileTripSequence,
  visibleTripStops,
  permuteVisibleTripIds,
  sortTripByDistance,
  sortTripByMaterial,
  materialQuantity,
  tripOriginSignature,
  coordinateOrNull,
  type TripStop,
  type TripTaskFilter,
  type MaterialBasis,
} from '../../src/domain/tripOrder';
import {
  TripPreferencesStore,
  initialTripPreferences,
  type TripPreferences,
  type TripOrigin,
} from '../../src/services/tripPreferences';
import { loadDepot } from '../../src/services/depotSettings';
import {
  captureTripOrigin,
  needsTripLocationReview,
  TripLocationError,
} from '../../src/services/tripLocation';
import { businessDate, distanceKm, measureKey } from '../../src/domain/rules';
import { mapsUrl } from '../../src/utils/whatsapp';
import { openLink } from '../../src/services/links';
import { userError } from '../../src/services/errors';
import { rentalSummary } from '../../src/utils/listPresentation';
import { isCalendarDate } from '../../src/utils/retirementCalendar';
import { useBusinessClock } from '../../src/hooks/useBusinessClock';
import { fonts } from '../../src/theme/tokens';

const dateLabel = (date: string) =>
  isCalendarDate(date) ? date.split('-').reverse().join('/') : 'Sin fecha prevista';
type SortKind = 'DISTANCE' | 'ASC' | 'DESC';
export default function Trip() {
  const { C, s } = useUI(),
    { state, ready: inventoryReady, workspaceId, workspaceKey, queue } = useInventory(),
    { user } = useAuth();
  const now = useBusinessClock(),
    today = businessDate(now);
  // UI preferences are separate from inventory. Team integration supplies a workspace namespace.
  const store = useMemo(
    () =>
      new TripPreferencesStore(
        AsyncStorage,
        `${workspaceId || workspaceKey || 'individual'}:${user?.uid || 'local'}`,
      ),
    [user?.uid, workspaceId, workspaceKey],
  );
  const [prefs, setPrefs] = useState<TripPreferences>(initialTripPreferences),
    [ready, setReady] = useState(false),
    [readError, setReadError] = useState('');
  const [error, setError] = useState(''),
    [success, setSuccess] = useState(''),
    [busy, setBusy] = useState(false),
    [locating, setLocating] = useState(false),
    [permissionBlocked, setPermissionBlocked] = useState(false);
  const [depot, setDepot] = useState(DEFAULT_DEPOT),
    [panel, setPanel] = useState<
      'options' | 'routes' | 'stop' | 'depot' | 'confirmSort' | 'locationReview' | null
    >(null),
    [published, setPublished] = useState(false),
    [editor, setEditor] = useState(false),
    [selectedId, setSelectedId] = useState<string | null>(null),
    [pendingSort, setPendingSort] = useState<SortKind | null>(null),
    [candidate, setCandidate] = useState<TripOrigin | null>(null);
  const prefsRef = useRef(prefs),
    readyRef = useRef(ready),
    mounted = useRef(true),
    writeLock = useRef(false),
    requestId = useRef(0),
    reconciliationAttempt = useRef('');
  const worksRef = useRef(state.obras);
  useLayoutEffect(() => {
    prefsRef.current = prefs;
    readyRef.current = ready;
    worksRef.current = state.obras;
  }, [prefs, ready, state.obras]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const load = useCallback(
    () =>
      store.load().then(
        (value) => {
          if (mounted.current) {
            prefsRef.current = value;
            setReadError('');
            setPrefs(value);
            setReady(true);
            readyRef.current = true;
            reconciliationAttempt.current = '';
          }
        },
        (e) => {
          if (mounted.current) {
            setReadError(userError(e));
            setReady(false);
            readyRef.current = false;
          }
        },
      ),
    [store],
  );
  useEffect(() => {
    void load();
  }, [load]);
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
        requestId.current++;
        setLocating(false);
      };
    }, []),
  );
  const stops = useMemo(
    () => eligibleTripStops(sortTripStops(state.obras, { today })),
    [state.obras, today],
  );
  const allIds = useMemo(
    () =>
      reconcileTripSequence(
        prefs.ids,
        stops.map((s) => s.id),
      ),
    [prefs.ids, stops],
  );
  const visible = useMemo(
    () => visibleTripStops(allIds, stops, { task: prefs.task, zone: prefs.zone }),
    [allIds, stops, prefs.task, prefs.zone],
  );
  const zones = [...new Set(stops.map((s) => s.obra.localidadBarrio))].sort((a, b) =>
    a.localeCompare(b),
  );
  const selected = stops.find((s) => s.id === selectedId);
  const materials = useMemo(() => {
    const map = new Map<string, { value: string; label: string; basis: MaterialBasis }>();
    const entries = [
      ...state.materiales.map((m) => ({ materialId: m.id, nombre: m.nombre, medida: m.medida })),
      ...state.obras.flatMap((o) => o.materialesCargados),
    ];
    for (const m of entries) {
      const basis = { materialId: m.materialId, medida: m.medida };
      const value = JSON.stringify([m.materialId, measureKey(m.medida)]);
      if (!map.has(value))
        map.set(value, { value, label: [m.nombre, m.medida].filter(Boolean).join(' · '), basis });
    }
    return [...map.values()];
  }, [state.materiales, state.obras]);
  const basisKey = prefs.basis
    ? JSON.stringify([prefs.basis.materialId, measureKey(prefs.basis.medida)])
    : '';
  const basisLabel = materials.find((m) => m.value === basisKey)?.label || '';
  const currentOrigin = prefs.origin;
  const scopeChanged =
    !!prefs.criterion.scopeSignature &&
    prefs.criterion.scopeSignature !== `${prefs.task}:${prefs.zone}`;
  const materialChanged =
    prefs.criterion.kind === 'MATERIAL' && prefs.criterion.materialSignature !== basisKey;
  const originChanged =
    prefs.criterion.kind === 'DISTANCE' &&
    prefs.criterion.originSignature !== tripOriginSignature(currentOrigin);
  const orderingLabel = originChanged
    ? 'Origen cambiado · pulsá Cercanía para volver a ordenar'
    : scopeChanged
      ? 'Filtro cambiado · conservamos las posiciones'
      : materialChanged
        ? 'Material cambiado · elegí un criterio para ordenar'
        : prefs.criterion.label;
  const routes = useMemo(() => {
    try {
      return {
        items: buildTripRoutes(
          visible.map((s) => s.obra),
          depot,
          currentOrigin?.coordinates,
        ),
        error: '',
      };
    } catch (e) {
      return { items: [], error: userError(e) };
    }
  }, [visible, depot, currentOrigin]);
  async function commit(update: (current: TripPreferences) => TripPreferences) {
    if (!readyRef.current)
      throw new Error(
        'Primero reintentá la lectura del orden guardado. No se reemplazaron tus preferencias.',
      );
    if (writeLock.current) throw new Error('Esperá a que termine de guardarse el cambio anterior.');
    writeLock.current = true;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const proposed = update(prefsRef.current);
      proposed.ids = reconcileTripSequence(
        proposed.ids,
        eligibleTripStops(worksRef.current).map((s) => s.id),
      );
      if (proposed.previousIds) {
        const eligible = new Set(eligibleTripStops(worksRef.current).map((s) => s.id));
        proposed.previousIds = proposed.previousIds.filter((id) => eligible.has(id));
      }
      const saved = await store.save(proposed);
      prefsRef.current = saved;
      if (mounted.current) setPrefs(saved);
      return saved;
    } catch (e) {
      if (mounted.current) setError(userError(e));
      throw e;
    } finally {
      writeLock.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  const eligibleKey = stops.map((s) => s.id).join('|');
  useEffect(() => {
    if (!ready || !inventoryReady || busy || JSON.stringify(allIds) === JSON.stringify(prefs.ids))
      return;
    const key = `${prefs.revision}:${eligibleKey}`;
    if (reconciliationAttempt.current === key) return;
    reconciliationAttempt.current = key;
    void commit((value) => ({
      ...value,
      ids: reconcileTripSequence(
        value.ids,
        stops.map((s) => s.id),
      ),
    })).catch(() => undefined);
    // Reconcile changes of eligible IDs once. Storage failure remains visible, without an infinite retry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, inventoryReady, busy, eligibleKey, prefs.revision]);
  async function run(operation: () => Promise<unknown>) {
    try {
      setError('');
      setSuccess('');
      await operation();
    } catch (e) {
      setError(userError(e));
    }
  }
  function closePanel() {
    requestId.current++;
    setLocating(false);
    setPanel(null);
  }
  async function saveOrigin(origin: TripOrigin) {
    await commit((value) => ({ ...value, origin }));
    setSuccess('Origen guardado. El orden no cambió.');
    setPanel('options');
  }
  async function locate() {
    const request = ++requestId.current;
    setLocating(true);
    setError('');
    setPermissionBlocked(false);
    try {
      const origin = await captureTripOrigin(
        {
          servicesEnabled: Location.hasServicesEnabledAsync,
          permission: Location.getForegroundPermissionsAsync,
          requestPermission: Location.requestForegroundPermissionsAsync,
          currentPosition: () =>
            Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        },
        { isCancelled: () => !mounted.current || request !== requestId.current },
      );
      if (!mounted.current || request !== requestId.current) return;
      if (needsTripLocationReview(origin)) {
        setCandidate(origin);
        setPanel('locationReview');
      } else await saveOrigin(origin);
    } catch (e) {
      if (mounted.current && request === requestId.current) {
        setPermissionBlocked(e instanceof TripLocationError && e.reason === 'PERMISSION_BLOCKED');
        setError(userError(e));
      }
    } finally {
      if (mounted.current && request === requestId.current) setLocating(false);
    }
  }
  async function applySort(kind: SortKind) {
    const live = prefsRef.current;
    const liveStops = eligibleTripStops(worksRef.current);
    const full = reconcileTripSequence(
      live.ids,
      liveStops.map((s) => s.id),
    );
    const visibleNow = visibleTripStops(full, liveStops, live);
    const result =
      kind === 'DISTANCE'
        ? sortTripByDistance(visibleNow, live.origin?.coordinates || null)
        : live.basis
          ? sortTripByMaterial(visibleNow, live.basis, kind)
          : { ids: full, error: 'Elegí el material y la medida que querés comparar.' };
    if (result.error) throw new Error(result.error);
    await commit((value) => ({
      ...value,
      ids: permuteVisibleTripIds(full, result.ids),
      previousIds: full,
      criterion:
        kind === 'DISTANCE'
          ? {
              kind: 'DISTANCE',
              label: 'Último orden: cercanía desde el origen',
              originSignature: tripOriginSignature(live.origin),
              scopeSignature: `${live.task}:${live.zone}`,
            }
          : {
              kind: 'MATERIAL',
              label: `${kind === 'ASC' ? 'Menos' : 'Más'} del material · ${basisLabel}`,
              scopeSignature: `${live.task}:${live.zone}`,
              materialSignature: basisKey,
            },
    }));
    setSuccess('Orden guardado en este teléfono.');
    setPanel(null);
  }
  const requestSort = (kind: SortKind) => {
    if (prefs.criterion.kind === 'MANUAL') {
      setPendingSort(kind);
      setPanel('confirmSort');
    } else return run(() => applySort(kind));
  };
  async function undoOrder() {
    await commit((value) => {
      if (!value.previousIds) throw new Error('No hay un cambio de orden para deshacer.');
      return {
        ...value,
        ids: reconcileTripSequence(
          value.previousIds,
          eligibleTripStops(worksRef.current).map((s) => s.id),
        ),
        previousIds: null,
        criterion: { kind: 'MANUAL', label: 'Orden anterior recuperado' },
      };
    });
    setSuccess('Recuperamos el orden anterior de las paradas vigentes.');
  }
  const originLabel = !currentOrigin
    ? 'Sin origen elegido'
    : currentOrigin.kind === 'DEPOT'
      ? 'Origen: depósito'
      : `Ubicación tomada ${new Date(currentOrigin.capturedAt).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}${currentOrigin.accuracy !== undefined ? ` · precisión ±${Math.round(currentOrigin.accuracy)} m` : ''}`;
  const emptyLoads = state.obras.filter(
    (o) =>
      ['PENDIENTE_ENTREGA', 'ENTREGADO'].includes(o.estadoProceso) &&
      !stops.some((s) => s.id === o.id),
  ).length;
  const row = (stop: TripStop, index: number) => {
    const o = stop.obra;
    const point = coordinateOrNull(o.coordenadas);
    const distance = !point
      ? 'Sin ubicación'
      : currentOrigin
        ? `${distanceKm(currentOrigin.coordinates, point).toFixed(1)} km desde el origen`
        : 'Con ubicación';
    const n = prefs.basis ? materialQuantity(stop, prefs.basis) : null;
    return (
      <View
        style={[
          s.row,
          {
            alignItems: 'stretch',
            backgroundColor: C.panel,
            borderBottomColor: C.hairline,
            borderBottomWidth: 1,
            gap: 12,
            paddingHorizontal: 10,
          },
        ]}
      >
        <View style={{ paddingTop: 18, minWidth: 28, alignItems: 'center' }}>
          <Text
            style={[
              s.label,
              {
                color: C.selectionText,
                fontVariant: ['tabular-nums'],
                fontFamily: fonts.monoMedium,
              },
            ]}
          >
            {index + 1}
          </Text>
          <View style={{ flex: 1, width: 1, backgroundColor: C.hairline, marginTop: 8 }} />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Parada ${index + 1}: ${o.clienteNombre}. Ver detalles`}
          onPress={() => {
            setSelectedId(o.id);
            setPanel('stop');
          }}
          style={({ pressed }) => ({
            flex: 1,
            minWidth: 0,
            paddingVertical: 14,
            gap: 5,
            backgroundColor: pressed ? C.selection : 'transparent',
          })}
        >
          <View style={[s.row, { alignItems: 'flex-start', gap: 8 }]}>
            <Text style={[s.body, s.grow, { fontWeight: '700' }]}>{o.clienteNombre}</Text>
            <ChevronRight size={20} color={C.muted} />
          </View>
          <Text style={s.body}>{o.direccion}</Text>
          <Text style={s.muted}>
            {o.localidadBarrio} · {distance}
          </Text>
          <Text style={s.muted}>
            {stop.task === 'RETIRE' ? 'Retiro previsto' : 'Entrega prevista'} ·{' '}
            {dateLabel(stop.task === 'RETIRE' ? o.fechaRetiroEstimada : o.fechaEntrega)}
          </Text>
          <View style={[s.row, { flexWrap: 'wrap', gap: 8 }]}>
            <StatusChip obra={o} compact today={today} />
            <Text style={s.muted}>{stop.task === 'RETIRE' ? 'Retiro' : 'Entrega'}</Text>
          </View>
          <Text style={s.muted}>
            {prefs.basis
              ? `${n === null ? 'Sin cantidad comparable' : `${n} unidades`} · ${basisLabel}`
              : rentalSummary(o)}
          </Text>
        </Pressable>
      </View>
    );
  };
  const footer = (
    <View style={{ gap: 10, marginTop: 12 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Depósito: ver regreso"
        onPress={() => setPanel('depot')}
        style={[s.row, { minHeight: 60, padding: 12, backgroundColor: C.panel2, borderRadius: 12 }]}
      >
        <Warehouse size={22} color={C.muted} />
        <View style={s.grow}>
          <Text style={s.label}>Regreso al depósito</Text>
          <Text style={s.muted}>{depot.direccion}</Text>
        </View>
        <ChevronRight size={20} color={C.muted} />
      </Pressable>
      <Text style={s.muted}>
        {routes.items.length > 1
          ? `Abrí los ${routes.items.length} tramos en orden; el último vuelve al depósito.`
          : 'Maps conserva las paradas visibles en este orden y termina en el depósito.'}
      </Text>
      {emptyLoads ? (
        <Text style={s.muted}>
          {emptyLoads} alquileres sin carga o saldo operativo. Podés revisarlos en Alquileres.
        </Text>
      ) : null}
    </View>
  );
  return (
    <Screen
      title="Viaje"
      scroll={false}
      subtitle={`${visible.length} ${visible.length === 1 ? 'parada' : 'paradas'} · ${today.split('-').reverse().join('/')}`}
      action={
        <IconButton
          label="Opciones del viaje"
          icon={MoreHorizontal}
          onPress={() => setPanel('options')}
        />
      }
      footer={
        visible.length ? (
          <Button
            label="Abrir recorrido"
            icon={Navigation}
            loading={busy}
            disabled={!ready || !routes.items.length}
            onPress={() =>
              routes.items.length > 1
                ? setPanel('routes')
                : routes.items[0]
                  ? run(() => openLink(routes.items[0]!.url))
                  : undefined
            }
          />
        ) : undefined
      }
    >
      <View style={{ gap: 10 }}>
        <Segmented
          value={prefs.task}
          options={[
            { value: 'ALL', label: 'Todas' },
            { value: 'RETIRE', label: 'Solo retiros' },
            { value: 'DELIVER', label: 'Solo entregas' },
          ]}
          onChange={(task) => {
            void run(() => commit((p) => ({ ...p, task: task as TripTaskFilter })));
          }}
        />
        <Select
          label="Zona del viaje"
          compact
          value={prefs.zone}
          options={[
            { label: 'Todas las zonas', value: 'TODAS' },
            ...zones.map((z) => ({ label: z, value: z })),
          ]}
          onChange={(zone) => {
            void run(() => commit((p) => ({ ...p, zone })));
          }}
        />
        <View style={[s.row, { justifyContent: 'space-between', gap: 8 }]}>
          <Text style={[s.muted, s.grow]}>{orderingLabel}</Text>
          <Button
            label="Cambiar orden"
            variant="secondary"
            disabled={!ready || busy || visible.length < 2}
            onPress={() => setEditor(true)}
          />
        </View>
        {readError ? (
          <>
            <Notice text={readError} tone="error" />
            <Button label="Reintentar lectura" variant="secondary" onPress={load} />
          </>
        ) : !ready ? (
          <Notice text="Leyendo el recorrido guardado…" />
        ) : null}
        {error || routes.error ? <Notice text={error || routes.error} tone="error" /> : null}
        {success ? (
          <Text accessibilityLiveRegion="polite" style={s.muted}>
            {success}
          </Text>
        ) : null}
      </View>
      <DataList
        data={visible}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => row(item, index)}
        ListFooterComponent={footer}
        ListEmptyComponent={
          <View style={{ gap: 12 }}>
            <Empty
              title="Sin paradas"
              detail={
                stops.length
                  ? 'No hay paradas con estos filtros.'
                  : 'Los alquileres con carga o saldo pendiente aparecen aquí.'
              }
            />
            <Button
              label="Restablecer filtros"
              variant="secondary"
              disabled={!ready || busy}
              onPress={() => run(() => commit((p) => ({ ...p, task: 'ALL', zone: 'TODAS' })))}
            />
          </View>
        }
        contentContainerStyle={{ paddingBottom: 16 }}
      />
      <Sheet
        visible={panel !== null}
        title={
          panel === 'stop'
            ? `Parada ${visible.findIndex((s) => s.id === selectedId) + 1}`
            : panel === 'depot'
              ? 'Regreso al depósito'
              : panel === 'routes'
                ? 'Tramos del recorrido'
                : panel === 'confirmSort'
                  ? '¿Cambiar el orden manual?'
                  : panel === 'locationReview'
                    ? 'Revisar ubicación'
                    : 'Opciones del viaje'
        }
        busy={busy}
        onClose={closePanel}
      >
        {panel === 'options' ? (
          <>
            <Button
              label="Plan publicado del equipo"
              variant="secondary"
              disabled={!ready || !inventoryReady}
              onPress={() => {
                setPanel(null);
                setPublished(true);
              }}
            />
            <Text style={s.label}>Ordenar las paradas visibles</Text>
            <Text style={s.muted}>{originLabel}</Text>
            <Button
              label="Usar depósito como origen"
              icon={Warehouse}
              variant="secondary"
              disabled={!ready}
              onPress={() =>
                run(async () => {
                  if (!coordinateOrNull(depot.coordenadas))
                    throw new Error(
                      'El depósito no tiene coordenadas. Completalas en Ajustes o usá mi ubicación.',
                    );
                  await saveOrigin({
                    kind: 'DEPOT',
                    coordinates: depot.coordenadas!,
                    capturedAt: new Date().toISOString(),
                  });
                })
              }
            />
            <Button
              label="Usar mi ubicación"
              icon={LocateFixed}
              variant="secondary"
              disabled={!ready || locating}
              loading={locating}
              onPress={() => {
                void locate();
              }}
            />
            {locating ? (
              <Button
                label="Cancelar ubicación"
                variant="ghost"
                onPress={() => {
                  requestId.current++;
                  setLocating(false);
                }}
              />
            ) : null}
            {permissionBlocked ? (
              <Button
                label="Abrir permisos"
                variant="secondary"
                onPress={() => Linking.openSettings()}
              />
            ) : null}
            <Button
              label="Ordenar por cercanía"
              variant="secondary"
              disabled={!ready || busy || !visible.length}
              onPress={() => requestSort('DISTANCE')}
            />
            <Text style={s.muted}>
              Distancia en línea recta desde un único origen. Sin tráfico ni cálculo de capacidad de
              carga. Cambiar el origen no cambia el orden.
            </Text>
            <Select
              label="Material para comparar"
              value={basisKey}
              options={[
                { value: '', label: 'Elegí material y medida' },
                ...materials.map((m) => ({ value: m.value, label: m.label })),
              ]}
              onChange={(value) => {
                const basis = materials.find((m) => m.value === value)?.basis || null;
                void run(() => commit((p) => ({ ...p, basis })));
              }}
            />
            <Button
              label="Menos del material primero"
              variant="secondary"
              disabled={!ready || !prefs.basis || !visible.length}
              onPress={() => requestSort('ASC')}
            />
            <Button
              label="Más del material primero"
              variant="secondary"
              disabled={!ready || !prefs.basis || !visible.length}
              onPress={() => requestSort('DESC')}
            />
            <Text style={s.muted}>
              Se compara sólo este material y medida: saldo en obra para retiros y carga prevista
              para entregas. No convertimos piezas en cuerpos.
            </Text>
            <Button
              label="Cambiar orden"
              variant="secondary"
              disabled={!ready || visible.length < 2}
              onPress={() => {
                setPanel(null);
                setEditor(true);
              }}
            />
            {prefs.previousIds ? (
              <Button
                label="Deshacer último orden"
                variant="secondary"
                onPress={() => run(undoOrder)}
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
                variant="ghost"
                onPress={() => setPanel('routes')}
              />
            ) : null}
          </>
        ) : panel === 'confirmSort' ? (
          <>
            <Text style={s.body}>
              Este criterio reemplazará el orden manual de las paradas visibles. Las ocultas
              conservan sus posiciones. Podés deshacer el último cambio.
            </Text>
            <Button
              label="Cambiar orden"
              onPress={() => (pendingSort ? run(() => applySort(pendingSort)) : undefined)}
            />
            <Button
              label="Conservar manual"
              variant="secondary"
              onPress={() => setPanel('options')}
            />
          </>
        ) : panel === 'locationReview' && candidate ? (
          <>
            <Text style={s.body}>
              La captura tiene precisión baja o no es reciente. Revisala antes de usarla; el origen
              anterior sigue intacto.
            </Text>
            <Text style={s.muted}>
              Tomada {new Date(candidate.capturedAt).toLocaleString('es-AR')} · precisión{' '}
              {candidate.accuracy === undefined
                ? 'desconocida'
                : `±${Math.round(candidate.accuracy)} m`}
            </Text>
            <Button label="Usar esta captura" onPress={() => run(() => saveOrigin(candidate))} />
            <Button
              label="Conservar origen anterior"
              variant="secondary"
              onPress={() => setPanel('options')}
            />
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
        ) : selected ? (
          <>
            <Text style={s.h2}>{selected.obra.clienteNombre}</Text>
            <Text style={s.body}>{selected.obra.direccion}</Text>
            <Text style={s.muted}>{selected.obra.localidadBarrio}</Text>
            <StatusChip obra={selected.obra} today={today} />
            <Text style={s.label}>
              {selected.task === 'RETIRE' ? 'Saldo por retirar' : 'Carga prevista'}
            </Text>
            {selected.obra.materialesCargados.map((m, i) => (
              <Text key={`${m.materialId}:${i}`} style={s.body}>
                {m.nombre}
                {m.medida ? ` · ${m.medida}` : ''} ·{' '}
                {selected.task === 'RETIRE'
                  ? (selected.obra.saldosEnObra[m.materialId] ?? 0)
                  : m.cantidad}
              </Text>
            ))}
            <Button
              label="Cómo llegar"
              icon={Navigation}
              variant="secondary"
              onPress={() => run(() => openLink(mapsUrl(selected.obra)))}
            />
            <Button
              label="Ver alquiler"
              variant="secondary"
              onPress={() => {
                closePanel();
                router.push(`/obra/${selected.obra.id}`);
              }}
            />
            <Button
              label="Cambiar orden"
              variant="ghost"
              disabled={!ready || visible.length < 2}
              onPress={() => {
                setPanel(null);
                setEditor(true);
              }}
            />
          </>
        ) : null}
        {error || routes.error ? <Notice text={error || routes.error} tone="error" /> : null}
      </Sheet>
      {published ? (
        <PublishedRoutePanel
          key={`${workspaceId}:${user?.uid}`}
          visible={published}
          stops={stops}
          ids={allIds}
          pending={queue.length > 0}
          ready={ready && inventoryReady}
          onClose={() => setPublished(false)}
          onLoad={async (ids) => {
            await commit((value) => ({
              ...value,
              previousIds: value.ids,
              ids: reconcileTripSequence(
                ids,
                eligibleTripStops(worksRef.current).map((stop) => stop.id),
              ),
              criterion: { kind: 'MANUAL', label: 'Copia del plan publicado' },
            }));
          }}
        />
      ) : null}
      <TripOrderEditor
        visible={editor}
        stops={visible}
        revision={state.revision}
        onClose={() => setEditor(false)}
        onSave={async (ids) => {
          await commit((value) => {
            const liveStops = eligibleTripStops(worksRef.current),
              full = reconcileTripSequence(
                value.ids,
                liveStops.map((s) => s.id),
              ),
              currentVisible = visibleTripStops(full, liveStops, value).map((s) => s.id);
            const reviewed = reconcileTripSequence(ids, currentVisible);
            return {
              ...value,
              ids: permuteVisibleTripIds(full, reviewed),
              previousIds: full,
              criterion: { kind: 'MANUAL', label: 'Orden manual' },
            };
          });
          setSuccess('Orden guardado en este teléfono.');
        }}
      />
    </Screen>
  );
}
