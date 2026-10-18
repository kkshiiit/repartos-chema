import React, { useMemo, useState } from 'react';
import { View, Text } from 'react-native';
import { Plus } from 'lucide-react-native';
import { router } from 'expo-router';
import { useInventory } from '../../src/context/InventoryContext';
import { useAuth } from '../../src/context/AuthContext';
import { Button, Empty, Screen, Select, Sheet, useUI } from '../../src/components/ui';
import { CardObra } from '../../src/components/CardObra';
import { DataList } from '../../src/components/DataList';
import { SearchToolbar, SectionHeading, Segmented } from '../../src/components/ListStructure';
import { businessDate, matchesStatusFilter, obraStatus } from '../../src/domain/rules';
import { rentalRows } from '../../src/utils/listPresentation';
export default function Home() {
  const { s } = useUI();
  const { state } = useInventory(),
    { user } = useAuth();
  const [query, setQuery] = useState(''),
    [status, setStatus] = useState('TODAS'),
    [zone, setZone] = useState('TODAS'),
    [filtersOpen, setFiltersOpen] = useState(false);
  const today = businessDate();
  const zones = [...new Set(state.obras.map((o) => o.localidadBarrio))].sort();
  const filtered = useMemo(
    () =>
      state.obras.filter(
        (o) =>
          (zone === 'TODAS' || o.localidadBarrio === zone) &&
          matchesStatusFilter(o, status, today) &&
          `${o.clienteNombre} ${o.direccion}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [state.obras, zone, status, query, today],
  );
  const rows = useMemo(() => rentalRows(filtered, today), [filtered, today]);
  const active = state.obras.filter((o) => o.estadoProceso === 'ENTREGADO').length;
  const due = state.obras.filter((o) =>
    ['ROJO', 'AMARILLO'].includes(obraStatus(o, today).key),
  ).length;
  return (
    <Screen
      title="Alquileres"
      scroll={false}
      subtitle={`${active} activos · ${due} retiros pendientes`}
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
          onChange={setQuery}
          placeholder="Cliente o dirección"
          onFilter={() => setFiltersOpen(true)}
        />
        <Segmented
          value={status}
          options={[
            { value: 'TODAS', label: 'Todos' },
            { value: 'AMARILLO', label: 'Hoy' },
            { value: 'ROJO', label: 'Vencidos' },
          ]}
          onChange={setStatus}
        />
        {zone !== 'TODAS' || !['TODAS', 'AMARILLO', 'ROJO'].includes(status) ? (
          <Text style={s.muted}>
            {zone !== 'TODAS' ? `${zone} · ` : ''}
            {filtered.length} resultados
          </Text>
        ) : null}
      </View>
      <DataList
        data={rows}
        keyExtractor={(r) => r.id}
        getItemType={(r) => r.kind}
        ListEmptyComponent={
          <Empty
            title={state.obras.length ? 'Sin resultados' : 'Sin alquileres'}
            detail={
              state.obras.length
                ? 'Cambiá la búsqueda o los filtros.'
                : 'Creá el primer alquiler para registrar la carga y su destino.'
            }
          />
        }
        renderItem={({ item, index }) =>
          item.kind === 'section' ? (
            <SectionHeading title={item.title} count={item.count} />
          ) : (
            <CardObra
              obra={item.obra}
              first={rows[index - 1]?.kind === 'section'}
              last={!rows[index + 1] || rows[index + 1]?.kind === 'section'}
            />
          )
        }
        contentContainerStyle={{ paddingBottom: 16 }}
      />
      <Sheet visible={filtersOpen} title="Filtrar alquileres" onClose={() => setFiltersOpen(false)}>
        <Select
          label="Zona"
          value={zone}
          options={[
            { value: 'TODAS', label: 'Todas las zonas' },
            ...zones.map((z) => ({ value: z, label: z })),
          ]}
          onChange={setZone}
        />
        <Select
          label="Estado"
          value={status}
          options={[
            { value: 'TODAS', label: 'Todos' },
            { value: 'ROJO', label: 'Vencidos' },
            { value: 'AMARILLO', label: 'Retiro hoy' },
            { value: 'VERDE', label: 'Al día' },
            { value: 'PENDIENTE', label: 'Por entregar' },
            { value: 'RETIRADO', label: 'Retirados' },
          ]}
          onChange={setStatus}
        />
        <Button label="Ver resultados" onPress={() => setFiltersOpen(false)} />
        <Button
          label="Limpiar filtros"
          variant="ghost"
          onPress={() => {
            setZone('TODAS');
            setStatus('TODAS');
            setQuery('');
            setFiltersOpen(false);
          }}
        />
        {user?.role === 'ADMIN' ? (
          <>
            <Button
              label="Exportar"
              variant="secondary"
              onPress={() => {
                setFiltersOpen(false);
                router.push('/exportar');
              }}
            />
            <Button
              label="Gestionar combos"
              variant="ghost"
              onPress={() => {
                setFiltersOpen(false);
                router.push('/combos');
              }}
            />
          </>
        ) : null}
      </Sheet>
    </Screen>
  );
}
