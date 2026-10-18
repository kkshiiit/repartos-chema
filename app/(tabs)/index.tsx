import React, { useMemo, useState } from 'react';
import { View, Text, useWindowDimensions, TextInput, ScrollView } from 'react-native';
import { Plus, Search, Layers, Download, SlidersHorizontal } from 'lucide-react-native';
import { router } from 'expo-router';
import { useInventory } from '../../src/context/InventoryContext';
import { useAuth } from '../../src/context/AuthContext';
import { Button, Chip, Empty, Screen, Select, useUI } from '../../src/components/ui';
import { CardObra } from '../../src/components/CardObra';
import { DataList } from '../../src/components/DataList';
import { obraStatus, businessDate, matchesStatusFilter } from '../../src/domain/rules';
export default function Home() {
  const { C, s } = useUI();
  const { state } = useInventory(),
    { user } = useAuth(),
    { width } = useWindowDimensions();
  const [query, setQuery] = useState(''),
    [status, setStatus] = useState('TODAS'),
    [zone, setZone] = useState('TODAS');
  const columns = width >= 1100 ? 2 : 1;
  const zones = [...new Set(state.obras.map((o) => o.localidadBarrio))].sort();
  const today = businessDate();
  const filtered = useMemo(
    () =>
      state.obras
        .filter(
          (o) =>
            (zone === 'TODAS' || o.localidadBarrio === zone) &&
            matchesStatusFilter(o, status, today) &&
            `${o.clienteNombre} ${o.direccion}`.toLowerCase().includes(query.toLowerCase()),
        )
        .sort((a, b) => {
          const ranks: Record<string, number> = {
            ROJO: 0,
            AMARILLO: 1,
            PENDIENTE: 2,
            VERDE: 3,
            RETIRADO: 4,
            REINGRESADO: 5,
          };
          return (
            (ranks[obraStatus(a, today).key] ?? 9) - (ranks[obraStatus(b, today).key] ?? 9) ||
            a.fechaRetiroEstimada.localeCompare(b.fechaRetiroEstimada)
          );
        }),
    [state.obras, zone, status, query, today],
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const due = state.obras.filter((o) =>
    ['ROJO', 'AMARILLO'].includes(obraStatus(o, today).key),
  ).length;
  const header = (
    <View style={{ gap: 16, paddingBottom: 20 }}>
      <View style={[s.row, { justifyContent: 'space-between', flexWrap: 'wrap' }]}>
        <Text style={s.muted}>
          {state.obras.filter((o) => o.estadoProceso === 'ENTREGADO').length} alquileres activos ·{' '}
          {due} retiros pendientes
        </Text>
        <Button
          label="Filtros"
          icon={SlidersHorizontal}
          variant="ghost"
          onPress={() => setFiltersOpen(!filtersOpen)}
        />
      </View>
      <View style={[s.row, { flexWrap: 'wrap' }]}>
        <View style={[s.input, s.row, { flexGrow: 1, flexBasis: width < 600 ? 155 : 230 }]}>
          <Search size={18} color={C.subtle} />
          <TextInput
            accessibilityLabel="Buscar alquileres"
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar cliente o dirección…"
            placeholderTextColor={C.subtle}
            style={{ color: C.text, flex: 1, fontSize: 16 } as never}
          />
        </View>
        {filtersOpen ? (
          <View
            style={{ minWidth: width < 600 ? 130 : 180, maxWidth: width < 600 ? 135 : undefined }}
          >
            <Select
              label="Zona"
              compact={width < 600}
              value={zone}
              options={[
                { value: 'TODAS', label: 'Zona' },
                ...zones.map((z) => ({ value: z, label: z })),
              ]}
              onChange={setZone}
            />
          </View>
        ) : null}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {[
          { key: 'TODAS', label: 'Todos', color: C.text },
          { key: 'ROJO', label: 'Vencidos', color: C.danger },
          { key: 'AMARILLO', label: 'Retiro hoy', color: C.yellow },
          { key: 'VERDE', label: 'Al día', color: C.green },
          { key: 'PENDIENTE', label: 'Por entregar', color: C.purple },
          { key: 'RETIRADO', label: 'Retirados', color: C.muted },
        ].map((f) => (
          <Chip
            key={f.key}
            label={`${f.label}${f.key === 'TODAS' ? `  ${state.obras.length}` : ''}`}
            color={f.color}
            selected={status === f.key}
            onPress={() => setStatus(f.key)}
          />
        ))}
      </ScrollView>
      <View style={[s.row, { justifyContent: 'space-between', flexWrap: 'wrap' }]}>
        <Text style={s.h2}>
          Resultados{' '}
          <Text style={{ color: C.subtle, fontSize: 14, fontWeight: '400' }}>
            {' '}
            / {filtered.length}
          </Text>
        </Text>
        <Text style={{ color: C.subtle, fontSize: 14 }}>Prioridad de retiro</Text>
      </View>
    </View>
  );
  return (
    <Screen
      title="Alquileres"
      subtitle="Entregas, retiros y cada pieza en su lugar."
      scroll={false}
      action={
        user?.role === 'ADMIN' ? (
          <View style={s.wrap}>
            <Button
              label="Exportar"
              icon={Download}
              variant="secondary"
              onPress={() => router.push('/exportar')}
            />
            <Button label="Nuevo alquiler" icon={Plus} onPress={() => router.push('/obra/nueva')} />
          </View>
        ) : undefined
      }
    >
      <DataList
        key={columns}
        numColumns={columns}
        data={filtered}
        keyExtractor={(o) => o.id}
        ListHeaderComponent={header}
        ListFooterComponent={
          user?.role === 'ADMIN' && width < 1000 ? (
            <Button
              label="Gestionar combos"
              icon={Layers}
              variant="secondary"
              onPress={() => router.push('/combos')}
            />
          ) : null
        }
        ListEmptyComponent={
          <Empty title="Sin alquileres" detail="Prueba otra búsqueda o cambia los filtros." />
        }
        renderItem={({ item }) => (
          <View style={{ paddingRight: columns > 1 ? 14 : 0, paddingBottom: 16 }}>
            <CardObra obra={item} />
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 18 }}
      />
    </Screen>
  );
}
