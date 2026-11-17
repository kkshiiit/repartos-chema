import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, ActivityIndicator, Pressable, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FlashListRef } from '@shopify/flash-list';
import { AlertTriangle, CalendarClock, HardHat, PackagePlus, Plus } from 'lucide-react-native';
import { router } from 'expo-router';
import { useInventory } from '../../src/context/InventoryContext';
import { useAuth } from '../../src/context/AuthContext';
import { Button, Empty, Notice, Screen, Select, Sheet, useUI } from '../../src/components/ui';
import { CardObra } from '../../src/components/CardObra';
import { LegacyImport } from '../../src/components/LegacyImport';
import { DataList } from '../../src/components/DataList';
import { SearchToolbar, SectionHeading } from '../../src/components/ListStructure';
import { businessDate } from '../../src/domain/rules';
import {
  rentalRows,
  rentalTaskForDate,
  matchesPresentationStatusFilter,
  matchesRentalSearch,
  type RentalRow,
} from '../../src/utils/listPresentation';
import {
  createRentalListPreferences,
  emptyRentalListPreferences,
  rememberedRentalList,
  rememberRentalList,
  type RentalListPreferences,
} from '../../src/services/rentalListPreferences';
import { BUSINESS_TIME_ZONE } from '../../src/utils/retirementCalendar';
import { useBusinessClock } from '../../src/hooks/useBusinessClock';
import { fonts } from '../../src/theme/tokens';
import type { ObraCard } from '../../src/types';

export default function Home() {
  const inventory = useInventory();
  const { user } = useAuth();
  const workspace =
    'workspaceId' in inventory && typeof inventory.workspaceId === 'string'
      ? inventory.workspaceId
      : inventory.workspaceKey || 'local';
  const scope = `${workspace}:${user?.uid || 'anonymous'}`;
  return <RentalList key={scope} scope={scope} />;
}
function RentalList({ scope }: { scope: string }) {
  const { C } = useUI();
  const inventory = useInventory();
  const { state } = inventory;
  const { user } = useAuth();
  const store = useMemo(() => createRentalListPreferences(AsyncStorage, scope), [scope]);
  const [recalled] = useState(() => rememberedRentalList(scope));
  const [view, setView] = useState<RentalListPreferences>(
    () => recalled?.preferences || emptyRentalListPreferences(),
  );
  const current = useRef(view);
  const mounted = useRef(true);
  const list = useRef<FlashListRef<RentalRow>>(null);
  const restoredScroll = useRef(false);
  // onLoad starts a native scroll request; it does not confirm its final offset.
  // Ignore the initial zero event until that request reaches its target (or the
  // actual end of a list whose content has shortened while detail was open).
  const restoringOffset = useRef<number | null>(null);
  const writesBlocked = useRef(recalled?.writesBlocked ?? true);
  const changedBeforeLoad = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [ready, setReady] = useState(!!recalled);
  const [viewError, setViewError] = useState(recalled?.error || '');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { query, status, zone } = view;
  const now = useBusinessClock();
  const today = businessDate(now);
  const zones = useMemo(
    () => [...new Set(state.obras.map((o) => o.localidadBarrio))].sort(),
    [state.obras],
  );
  const filtered = useMemo(
    () =>
      state.obras.filter(
        (o) =>
          (zone === 'TODAS' || o.localidadBarrio === zone) &&
          matchesPresentationStatusFilter(o, status, today) &&
          matchesRentalSearch(o, query),
      ),
    [state.obras, zone, status, query, today],
  );
  const rows = useMemo(() => rentalRows(filtered, today), [filtered, today]);
  const workingDate = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    timeZone: BUSINESS_TIME_ZONE,
  }).format(now);

  const saveView = useCallback(
    (next: RentalListPreferences) => {
      if (writesBlocked.current) return;
      void store
        .save(next)
        .then(() => {
          if (mounted.current && current.current === next) {
            rememberRentalList(scope, next, '', false);
            if (mounted.current) setViewError('');
          }
        })
        .catch(() => {
          const error = 'La vista se mantiene abierta, pero no pudo guardarse en este teléfono.';
          if (mounted.current) {
            rememberRentalList(scope, current.current, error, writesBlocked.current);
            setViewError(error);
          } else {
            const latest = rememberedRentalList(scope);
            if (latest && JSON.stringify(latest.preferences) === JSON.stringify(current.current))
              rememberRentalList(scope, latest.preferences, error, latest.writesBlocked);
          }
        });
    },
    [scope, store],
  );
  useEffect(() => {
    mounted.current = true;
    let active = true;
    if (!recalled) {
      void store
        .load()
        .then((value) => {
          if (!active) return;
          writesBlocked.current = false;
          if (changedBeforeLoad.current) {
            rememberRentalList(scope, current.current);
            saveView(current.current);
            return;
          }
          current.current = value;
          setView(value);
          rememberRentalList(scope, value);
        })
        .catch(() => {
          if (!active) return;
          writesBlocked.current = true;
          const error =
            'No se pudo recuperar la vista anterior. El original se conserva; podés consultar sin guardar filtros.';
          rememberRentalList(scope, current.current, error, true);
          setViewError(error);
        })
        .finally(() => {
          if (active) setReady(true);
        });
    }
    return () => {
      active = false;
      mounted.current = false;
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
        saveView(current.current);
      }
    };
  }, [scope, store, recalled, saveView]);
  const changeView = (patch: Partial<RentalListPreferences>) => {
    if (patch.query && patch.query.length > 1000) {
      setViewError('La búsqueda admite hasta 1000 caracteres. La consulta anterior se conserva.');
      return;
    }
    changedBeforeLoad.current = true;
    const next = { ...current.current, ...patch, scroll: 0 };
    current.current = next;
    restoringOffset.current = null;
    setView(next);
    rememberRentalList(scope, next, viewError, writesBlocked.current);
    list.current?.scrollToOffset({ offset: 0, animated: false });
    saveView(next);
  };
  const clearFilters = () => {
    changeView({ query: '', status: 'TODAS', zone: 'TODAS' });
    setFiltersOpen(false);
  };
  const hasFilters = query.trim() !== '' || status !== 'TODAS' || zone !== 'TODAS';
  return (
    <Screen
      title="Alquileres"
      subtitle={`${workingDate} · ${filtered.length} ${filtered.length === 1 ? 'alquiler' : 'alquileres'}${zone !== 'TODAS' ? ` · ${zone}` : ''}`}
      scroll={false}
      footer={
        user?.role === 'ADMIN' ? (
          <Button label="Nuevo alquiler" icon={Plus} onPress={() => router.push('/obra/nueva')} />
        ) : undefined
      }
    >
      <LegacyImport />
      <View style={{ gap: 10 }}>
        <SearchToolbar
          label="Buscar alquileres"
          value={query}
          onChange={(value) => changeView({ query: value })}
          placeholder="Cliente, dirección o localidad"
          onFilter={() => setFiltersOpen(true)}
        />
        <SummaryTiles obras={state.obras} today={today} value={status} onChange={(value) => changeView({ status: status === value ? 'TODAS' : value })} />
        {hasFilters ? (
          <View style={{ alignItems: 'flex-start' }}>
            <Button label="Limpiar filtros" variant="ghost" onPress={clearFilters} />
          </View>
        ) : null}
      </View>
      {viewError ? (
        <View style={{ gap: 4 }}>
          <Notice text={viewError} />
          <Button
            label="Reintentar vista"
            variant="ghost"
            onPress={async () => {
              try {
                await store.load();
                writesBlocked.current = false;
                await store.save(current.current);
                rememberRentalList(scope, current.current);
                setViewError('');
              } catch {
                setViewError(
                  'La vista no pudo guardarse. El original y el inventario se conservan.',
                );
              }
            }}
          />
        </View>
      ) : null}
      {!ready ? (
        <ActivityIndicator accessibilityLabel="Recuperando vista de alquileres" color={C.text} />
      ) : (
        <DataList
          ref={list}
          testID="lista-alquileres"
          data={rows}
          keyExtractor={(r) => r.id}
          getItemType={(r) => r.kind}
          keyboardShouldPersistTaps="handled"
          onLoad={() => {
            if (!restoredScroll.current) {
              restoringOffset.current = current.current.scroll > 0 ? current.current.scroll : null;
              restoredScroll.current = true;
              list.current?.scrollToOffset({ offset: current.current.scroll, animated: false });
            }
          }}
          onScrollBeginDrag={() => {
            // A deliberate gesture takes precedence over a pending restoration.
            restoringOffset.current = null;
          }}
          onScroll={(event) => {
            if (!restoredScroll.current) return;
            const scroll = Math.max(0, event.nativeEvent.contentOffset.y);
            if (restoringOffset.current !== null) {
              const { contentSize, layoutMeasurement } = event.nativeEvent;
              const maximum = contentSize.height - layoutMeasurement.height;
              const target =
                maximum > 0 ? Math.min(restoringOffset.current, maximum) : restoringOffset.current;
              // Fractional layout/font rounding may shift the requested offset.
              if (Math.abs(scroll - target) > 4) return;
              restoringOffset.current = null;
            }
            const next = { ...current.current, scroll };
            current.current = next;
            rememberRentalList(scope, next, viewError, writesBlocked.current);
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(() => {
              timer.current = null;
              saveView(current.current);
            }, 250);
          }}
          scrollEventThrottle={100}
          ListEmptyComponent={
            <View style={{ gap: 12 }}>
              <Empty
                title={
                  inventory.error
                    ? 'Datos no disponibles'
                    : hasFilters
                      ? 'Sin resultados'
                      : 'Sin alquileres'
                }
                detail={
                  inventory.error
                    ? 'Los datos guardados se conservan. Usá Reintentar para recuperarlos.'
                    : hasFilters
                      ? 'Probá otra búsqueda o quitá los filtros.'
                      : 'Creá el primer alquiler para registrar materiales, cliente y destino.'
                }
              />
              {hasFilters ? (
                <Button label="Ver todos" variant="secondary" onPress={clearFilters} />
              ) : null}
            </View>
          }
          renderItem={({ item, index }) =>
            item.kind === 'section' ? (
              <SectionHeading title={item.title} count={item.count} />
            ) : (
              <CardObra
                obra={item.obra}
                materials={state.materiales}
                now={now}
                first={rows[index - 1]?.kind === 'section'}
                last={!rows[index + 1] || rows[index + 1]?.kind === 'section'}
              />
            )
          }
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
      <Sheet visible={filtersOpen} title="Filtrar alquileres" onClose={() => setFiltersOpen(false)}>
        <Select
          label="Zona"
          value={zone}
          options={[
            { value: 'TODAS', label: 'Todas las zonas' },
            ...zones.map((value) => ({ value, label: value })),
          ]}
          onChange={(value) => changeView({ zone: value })}
        />
        <Select
          label="Tarea o estado"
          value={status}
          options={[
            { value: 'TODAS', label: 'Todos' },
            { value: 'HOY', label: 'Entregas y retiros de hoy' },
            { value: 'ATRASADOS', label: 'Entregas y retiros atrasados' },
            { value: 'PROXIMOS', label: 'Próximas tareas' },
            { value: 'PENDIENTE', label: 'Por entregar' },
            { value: 'EN_OBRA', label: 'En obra' },
            { value: 'ROJO', label: 'Retiros vencidos' },
            { value: 'AMARILLO', label: 'Retiros de hoy' },
            { value: 'VERDE', label: 'Al día' },
            { value: 'SIN_FECHA', label: 'Sin fecha de retiro' },
            { value: 'RETIRADO', label: 'Retirados' },
          ]}
          onChange={(value) => changeView({ status: value })}
        />
        <Button label="Ver resultados" onPress={() => setFiltersOpen(false)} />
        <Button label="Limpiar filtros" variant="ghost" onPress={clearFilters} />
      </Sheet>
    </Screen>
  );
}

/** Resumen del día: cuatro números grandes que además filtran la lista al tocarlos. */
function SummaryTiles({
  obras,
  today,
  value,
  onChange,
}: {
  obras: ObraCard[];
  today: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const { C } = useUI();
  const counts = useMemo(() => {
    let overdue = 0,
      todayCount = 0,
      pending = 0,
      working = 0;
    for (const o of obras) {
      const group = rentalTaskForDate(o, today).group;
      if (group === 'overdue') overdue++;
      if (group === 'today') todayCount++;
      if (o.estadoProceso === 'PENDIENTE_ENTREGA') pending++;
      if (o.estadoProceso === 'ENTREGADO') working++;
    }
    return { overdue, todayCount, pending, working };
  }, [obras, today]);
  const tiles = [
    { key: 'ATRASADOS', label: 'Atrasados', n: counts.overdue, icon: AlertTriangle, color: C.danger, bg: C.dangerBackground },
    { key: 'HOY', label: 'Para hoy', n: counts.todayCount, icon: CalendarClock, color: C.warning, bg: C.warningBackground },
    { key: 'PENDIENTE', label: 'Por entregar', n: counts.pending, icon: PackagePlus, color: C.purple, bg: C.panel2 },
    { key: 'EN_OBRA', label: 'En obra', n: counts.working, icon: HardHat, color: C.success, bg: C.successBackground },
  ];
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {tiles.map((t) => {
        const selected = value === t.key;
        return (
          <Pressable
            key={t.key}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`${t.label}: ${t.n}. ${selected ? 'Filtro activo, tocar para ver todos' : 'Tocar para filtrar'}`}
            onPress={() => onChange(t.key)}
            style={({ pressed }) => ({
              flexGrow: 1,
              flexBasis: '45%',
              minHeight: 74,
              borderRadius: 16,
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderWidth: selected ? 2.5 : 1,
              borderColor: selected ? t.color : C.hairline,
              backgroundColor: pressed ? C.selection : selected ? t.bg : C.panel,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            })}
          >
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}>
              <t.icon size={22} color={t.color} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ color: C.text, fontFamily: fonts.semibold, fontSize: 26, lineHeight: 30, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
                {t.n}
              </Text>
              <Text numberOfLines={1} style={{ color: C.muted, fontFamily: fonts.medium, fontSize: 13 }}>
                {t.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
