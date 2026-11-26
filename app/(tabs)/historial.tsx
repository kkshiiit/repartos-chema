import React, { useCallback, useState } from 'react';
import { View, Text, AppState, Platform, Pressable, ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ArrowRight, ChevronRight, RotateCcw } from 'lucide-react-native';
import { useInventory } from '../../src/context/InventoryContext';
import { useAuth } from '../../src/context/AuthContext';
import { undoReason } from '../../src/domain/engine';
import { businessDate } from '../../src/domain/rules';
import {
  Button,
  Chip,
  ConfirmButton,
  initials,
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
import type { ActivityLog } from '../../src/types';
import { DataList } from '../../src/components/DataList';
import { fonts } from '../../src/theme/tokens';
import { RestoreSheet } from '../../src/components/RestoreSheet';
export default function HistoryPage() {
  const { C, s } = useUI();
  const { state, dispatch, rejected, previewBefore } = useInventory(),
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
  const all = [...state.logs].sort((a, b) =>
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
  const [restoreFor, setRestoreFor] = useState<ActivityLog | null>(null);
  const shortWhen = (iso: string) =>
    new Date(iso).toLocaleString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  const reason = selected && user ? undoReason(state, selected, user, now) : 'Iniciá sesión.';
  const locationName = (value: string) =>
    value.startsWith('obra:')
      ? state.obras.find((o) => o.id === value.slice(5))?.clienteNombre || 'Alquiler archivado'
      : { galpon: 'Depósito', taller: 'A reparar', perdido: 'Perdido', baja: 'Dado de baja' }[value] || value;
  return (
    <Screen title="Auditoría" subtitle={`${all.length} registros · quién hizo cada cambio, cuándo y qué movió`} scroll={false}>
      <SearchToolbar
        label="Buscar actividad"
        value={query}
        onChange={setQuery}
        placeholder="Acción, alquiler o persona"
        filterLabel="Filtrar auditoría"
        onFilter={() => setFiltersOpen(true)}
      />
      {users.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 8 }}>
          <Chip label="Todas las personas" selected={actor === 'TODOS'} onPress={() => setActor('TODOS')} />
          {users.map(([value, label]) => (
            <Chip key={value} label={label} selected={actor === value} onPress={() => setActor(actor === value ? 'TODOS' : value)} />
          ))}
        </ScrollView>
      ) : null}
      {rejected?.length ? (
        <Notice tone="error" text={`Rechazados (no aplicados): ${rejected.map((r) => describeRejected(r.op.action.type)).join(', ')}`} />
      ) : null}
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
        renderItem={({ item }) => {
          if (item.kind === 'section') return <SectionHeading title={item.title} />;
          const l = item.log;
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
              <View style={{ width: 38, alignItems: 'center', alignSelf: 'stretch' }}>
                {/* La auditoría responde "¿quién?": sus iniciales van primero. */}
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    backgroundColor: C.panel2,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: C.text, fontFamily: fonts.display, fontSize: 16 }}>{initials(l.usuarioNombre)}</Text>
                </View>
                
              </View>
              <View style={[s.grow, { gap: 3 }]}>
                <Text style={[s.body, { fontFamily: fonts.medium }]}>{l.accion}</Text>
                {name(l) ? <Text style={s.body}>{name(l)}</Text> : null}
                <Text numberOfLines={1} style={[s.muted, { color: C.text }]}>
                  <Text style={{ fontWeight: '700' }}>{l.usuarioNombre}</Text>
                  {l.movimientos.length
                    ? ` · ${l.movimientos.reduce((sum, m) => sum + m.cantidad, 0)} piezas movidas`
                    : ''}
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
      <Sheet visible={filtersOpen} title="Filtrar auditoría" onClose={() => setFiltersOpen(false)}>
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
          label="Persona"
          value={actor}
          options={[
            { value: 'TODOS', label: 'Todas las personas' },
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
            <Button
              label="Volver a como estaba antes"
              icon={RotateCcw}
              variant="secondary"
              onPress={() => {
                setRestoreFor(selected);
                setSelectedId(null);
              }}
            />
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
      <RestoreSheet
        visible={!!restoreFor}
        title="Volver a como estaba antes"
        explain={
          restoreFor
            ? `Todo el equipo vuelve a como estaba justo antes de “${restoreFor.accion}” (${restoreFor.usuarioNombre}, ${shortWhen(restoreFor.timestamp)}). Se deshace ese cambio y todo lo que se cargó después.`
            : ''
        }
        accion={restoreFor ? `Volvió a como estaba antes de “${restoreFor.accion.slice(0, 80)}” (${shortWhen(restoreFor.timestamp)})` : ''}
        load={() => previewBefore!(restoreFor!.operationId || restoreFor!.id)}
        onClose={() => setRestoreFor(null)}
        onDone={() => setSelectedId(null)}
      />
    </Screen>
  );
}

const REJECTED_LABELS: Record<string, string> = {
  DELIVER: 'una entrega',
  RETIRE: 'un retiro',
  ADJUST: 'un ajuste de stock',
  MOVE_STOCK: 'un movimiento de stock',
  TRANSFER: 'un traspaso',
  SET_LOAD: 'una carga',
  UPDATE_OBRA: 'una edición',
};
function describeRejected(type: string) {
  return REJECTED_LABELS[type] || 'un cambio';
}
