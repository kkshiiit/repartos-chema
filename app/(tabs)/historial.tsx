import React, { useCallback, useState } from 'react';
import { View, Text, AppState, Platform, Pressable } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { History, ArrowRight, ChevronRight, ArrowDown, ArrowUp } from 'lucide-react-native';
import { useInventory } from '../../src/context/InventoryContext';
import { useAuth } from '../../src/context/AuthContext';
import { undoReason } from '../../src/domain/engine';
import { businessDate } from '../../src/domain/rules';
import {
  Button,
  ConfirmButton,
  Empty,
  Field,
  Notice,
  Screen,
  Select,
  Sheet,
  useUI,
} from '../../src/components/ui';
import { SearchToolbar, SectionHeading } from '../../src/components/ListStructure';
import { historyRows } from '../../src/utils/listPresentation';
import { DATA_MODE } from '../../src/services/firebase';
import { loadHistory, HistoryCursor } from '../../src/services/historyService';
import type { ActivityLog } from '../../src/types';
import { DataList } from '../../src/components/DataList';
export default function HistoryPage() {
  const { C, s } = useUI();
  const { state, dispatch } = useInventory(),
    { user } = useAuth();
  const [filtersOpen, setFiltersOpen] = useState(false),
    [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState(''),
    [obra, setObra] = useState('TODAS'),
    [actor, setActor] = useState('TODOS'),
    [date, setDate] = useState(''),
    [now, setNow] = useState(new Date());
  useFocusEffect(
    useCallback(() => {
      const timer = setInterval(() => {
        if (
          AppState.currentState !== 'background' &&
          (Platform.OS !== 'web' || document.visibilityState === 'visible')
        )
          setNow(new Date());
      }, 10000);
      return () => clearInterval(timer);
    }, []),
  );
  const [older, setOlder] = useState<ActivityLog[]>([]),
    [cursor, setCursor] = useState<HistoryCursor>(),
    [more, setMore] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const all = [...new Map([...older, ...state.logs].map((l) => [l.id, l])).values()].sort((a, b) =>
    b.timestamp.localeCompare(a.timestamp),
  );
  const users = [...new Map(all.map((l) => [l.usuarioUid, l.usuarioNombre])).entries()];
  const works = new Map(
    all.filter((l) => l.obraId).map((l) => [l.obraId!, l.obraNombre || 'Alquiler eliminado']),
  );
  for (const o of state.obras) works.set(o.id, o.clienteNombre);
  const name = (l: ActivityLog) =>
    l.obraNombre || state.obras.find((o) => o.id === l.obraId)?.clienteNombre || '';
  const data = all.filter(
    (l) =>
      `${l.accion} ${l.usuarioNombre} ${name(l)}`.toLowerCase().includes(query.toLowerCase()) &&
      (obra === 'TODAS' || l.obraId === obra) &&
      (actor === 'TODOS' || l.usuarioUid === actor) &&
      (!date || businessDate(new Date(l.timestamp)) === date),
  );
  const selected = all.find((l) => l.id === selectedId);
  const reason = selected && user ? undoReason(state, selected, user, now) : 'Iniciá sesión.';
  const locationName = (value: string) =>
    value.startsWith('obra:')
      ? state.obras.find((o) => o.id === value.slice(5))?.clienteNombre || 'Alquiler archivado'
      : { galpon: 'Depósito', taller: 'A reparar', perdido: 'Perdido' }[value] || value;
  return (
    <Screen title="Historial" subtitle="Cada movimiento, con su responsable." scroll={false}>
      <SearchToolbar
        label="Buscar actividad"
        value={query}
        onChange={setQuery}
        placeholder="Acción, alquiler o persona"
        filterLabel="Filtrar historial"
        onFilter={() => setFiltersOpen(true)}
      />
      {obra !== 'TODAS' || actor !== 'TODOS' || date ? (
        <Text style={s.muted}>{data.length} resultados · Filtros activos</Text>
      ) : null}
      <DataList
        data={historyRows(data)}
        keyExtractor={(r) => r.id}
        getItemType={(r) => r.kind}
        ListEmptyComponent={
          <Empty
            title="Sin movimientos"
            detail="Las acciones registradas aparecerán aquí. Probá cambiando los filtros."
          />
        }
        ListFooterComponent={
          DATA_MODE === 'firebase' && user?.role === 'ADMIN' ? (
            <View style={{ gap: 10 }}>
              {error ? <Notice text={error} tone="error" /> : null}
              <Button
                label={more ? 'Cargar historial' : 'Historial completo'}
                disabled={!more}
                loading={busy}
                variant="secondary"
                onPress={async () => {
                  setBusy(true);
                  try {
                    const result = await loadHistory(cursor);
                    setOlder([...older, ...result.items]);
                    setCursor(result.cursor);
                    setMore(result.more);
                    setError('');
                  } catch {
                    setError('No se pudo consultar el historial remoto. Reintentá con conexión.');
                  } finally {
                    setBusy(false);
                  }
                }}
              />
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          if (item.kind === 'section') return <SectionHeading title={item.title} />;
          const l = item.log;
          const EntryIcon = /retir/i.test(l.accion)
            ? ArrowUp
            : /entreg/i.test(l.accion)
              ? ArrowDown
              : History;
          const entryColor = /retir/i.test(l.accion) ? C.green : C.link;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Ver movimiento: ${l.accion}${name(l) ? ` · ${name(l)}` : ''}`}
              onPress={() => setSelectedId(l.id)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                gap: 12,
                padding: 14,
                minHeight: 96,
                borderBottomWidth: 1,
                borderColor: C.hairline,
                backgroundColor: pressed ? C.selection : C.panel,
                alignItems: 'flex-start',
              })}
            >
              <View style={{ width: 32, alignItems: 'center', alignSelf: 'stretch' }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: C.selection,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <EntryIcon size={17} color={entryColor} />
                </View>
                <View style={{ width: 1, flex: 1, marginTop: 6, backgroundColor: C.hairline }} />
              </View>
              <View style={[s.grow, { gap: 3 }]}>
                <Text style={s.label}>{l.accion}</Text>
                {name(l) ? <Text style={s.body}>{name(l)}</Text> : null}
                <Text numberOfLines={1} style={s.muted}>
                  {l.movimientos.length
                    ? `${l.movimientos.reduce((sum, m) => sum + m.cantidad, 0)} piezas · `
                    : ''}
                  {l.usuarioNombre}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 8 }}>
                <Text style={[s.muted, { fontSize: 12, fontVariant: ['tabular-nums'] }]}>
                  {new Date(l.timestamp).toLocaleTimeString('es-AR', {
                    timeZone: 'America/Argentina/Buenos_Aires',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
                <ChevronRight size={16} color={C.muted} />
              </View>
            </Pressable>
          );
        }}
        contentContainerStyle={{ paddingBottom: 16 }}
      />
      <Sheet visible={filtersOpen} title="Filtrar historial" onClose={() => setFiltersOpen(false)}>
        <Select
          label="Alquiler"
          value={obra}
          options={[
            { value: 'TODAS', label: 'Todos los alquileres' },
            ...[...works].map(([value, label]) => ({ value, label })),
          ]}
          onChange={setObra}
        />
        <Select
          label="Usuario"
          value={actor}
          options={[
            { value: 'TODOS', label: 'Todos los usuarios' },
            ...users.map(([value, label]) => ({ value, label })),
          ]}
          onChange={setActor}
        />
        <Field
          label="Fecha · AAAA-MM-DD"
          value={date}
          onChangeText={setDate}
          placeholder="Todas las fechas"
          maxLength={10}
        />
        <Button label="Ver resultados" onPress={() => setFiltersOpen(false)} />
        <Button
          label="Limpiar filtros"
          variant="ghost"
          onPress={() => {
            setObra('TODAS');
            setActor('TODOS');
            setDate('');
            setQuery('');
            setFiltersOpen(false);
          }}
        />
      </Sheet>
      <Sheet
        visible={!!selected}
        title="Detalle del movimiento"
        onClose={() => setSelectedId(null)}
      >
        {selected ? (
          <>
            <Text style={s.h2}>{selected.accion}</Text>
            {name(selected) ? <Text style={s.body}>{name(selected)}</Text> : null}
            <Text style={s.muted}>
              {selected.usuarioNombre} ·{' '}
              {new Date(selected.timestamp).toLocaleString('es-AR', {
                timeZone: 'America/Argentina/Buenos_Aires',
              })}
            </Text>
            {selected.movimientos.map((m, i) => (
              <View
                key={i}
                style={{ gap: 5, borderTopWidth: 1, borderColor: C.hairline, paddingTop: 12 }}
              >
                <Text style={s.label}>
                  {m.cantidad} ×{' '}
                  {m.materialNombre ||
                    state.materiales.find((x) => x.id === m.materialId)?.nombre ||
                    m.materialId}
                </Text>
                <View style={s.row}>
                  <ArrowRight size={16} color={C.link} />
                  <Text style={[s.muted, s.grow]}>
                    {locationName(m.origen)} → {locationName(m.destino)}
                  </Text>
                </View>
                <Text style={s.muted}>{m.motivo}</Text>
              </View>
            ))}
            {reason ? (
              <Text style={s.muted}>{reason}</Text>
            ) : (
              <ConfirmButton
                label="Deshacer"
                title="Deshacer movimiento"
                description="Se restaurarán alquiler e inventario y se agregará una reversión. Debe seguir siendo la última operación y estar dentro de los cinco minutos."
                variant="secondary"
                onConfirm={() => dispatch({ type: 'UNDO', logId: selected.id })}
              />
            )}
          </>
        ) : null}
      </Sheet>
    </Screen>
  );
}
