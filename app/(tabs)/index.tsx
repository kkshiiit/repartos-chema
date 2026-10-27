import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FlashListRef } from '@shopify/flash-list';
import { Plus } from 'lucide-react-native';
import { router } from 'expo-router';
import { useInventory } from '../../src/context/InventoryContext';
import { useAuth } from '../../src/context/AuthContext';
import { Button, Empty, Notice, Screen, Select, Sheet, useUI } from '../../src/components/ui';
import { CardObra } from '../../src/components/CardObra';
import { DataList } from '../../src/components/DataList';
import { SearchToolbar, SectionHeading, Segmented } from '../../src/components/ListStructure';
import { businessDate } from '../../src/domain/rules';
import {
  rentalRows,
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

export default function Home() {
  const inventory = useInventory();
  const { user } = useAuth();
  const workspace =
    'workspaceId' in inventory && typeof inventory.workspaceId === 'string'
      ? inventory.workspaceId
      : 'local';
  const scope = `${workspace}:${user?.uid || 'anonymous'}`;
  return <RentalList key={scope} scope={scope} />;
}
function RentalList({ scope }: { scope: string }) {
  const { C, s } = useUI();
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
      subtitle={workingDate}
      scroll={false}
      footer={
        user?.role === 'ADMIN' ? (
          <Button label="Nuevo alquiler" icon={Plus} onPress={() => router.push('/obra/nueva')} />
        ) : undefined
      }
    >
      <View style={{ gap: 10 }}>
        <SearchToolbar
          label="Buscar alquileres"
          value={query}
          onChange={(value) => changeView({ query: value })}
          placeholder="Cliente, dirección o localidad"
          onFilter={() => setFiltersOpen(true)}
        />
        <Segmented
          value={status}
          options={[
            { value: 'TODAS', label: 'Todos' },
            { value: 'HOY', label: 'Hoy' },
            { value: 'ATRASADOS', label: 'Atrasados' },
          ]}
          onChange={(value) => changeView({ status: value })}
        />
        <View style={[s.row, { justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }]}>
          <Text style={s.muted}>
            {filtered.length} {filtered.length === 1 ? 'alquiler' : 'alquileres'}
            {zone !== 'TODAS' ? ` · ${zone}` : ''}
          </Text>
          {hasFilters ? (
            <Button label="Limpiar filtros" variant="ghost" onPress={clearFilters} />
          ) : null}
        </View>
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
              restoredScroll.current = true;
              list.current?.scrollToOffset({ offset: current.current.scroll, animated: false });
            }
          }}
          onScroll={(event) => {
            if (!restoredScroll.current) return;
            const scroll = Math.max(0, event.nativeEvent.contentOffset.y);
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
