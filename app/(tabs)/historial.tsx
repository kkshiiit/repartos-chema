import React, { useCallback, useState } from 'react';
import { View, Text, AppState, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { History, ArrowRight } from 'lucide-react-native';
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
  useUI,
} from '../../src/components/ui';
import { DATA_MODE } from '../../src/services/firebase';
import { loadHistory, HistoryCursor } from '../../src/services/historyService';
import type { ActivityLog } from '../../src/types';
import { DataList } from '../../src/components/DataList';
export default function HistoryPage() {
  const { C, s } = useUI();
  const { state, dispatch } = useInventory(),
    { user } = useAuth();
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
  const data = all.filter(
    (l) =>
      `${l.accion} ${l.usuarioNombre} ${l.obraNombre || state.obras.find((o) => o.id === l.obraId)?.clienteNombre || ''}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (obra === 'TODAS' || l.obraId === obra) &&
      (actor === 'TODOS' || l.usuarioUid === actor) &&
      (!date || businessDate(new Date(l.timestamp)) === date),
  );
  return (
    <Screen title="Historial" scroll={false}>
      <DataList
        data={data}
        keyExtractor={(l) => l.id}
        ListHeaderComponent={
          <View style={{ gap: 14, paddingBottom: 20 }}>
            <Field
              label="Buscar actividad"
              value={query}
              onChangeText={setQuery}
              placeholder="Acción, alquiler o responsable"
            />
            <View style={s.wrap}>
              <View style={{ flex: 1, minWidth: 180 }}>
                <Select
                  label="Alquiler"
                  value={obra}
                  options={[
                    { value: 'TODAS', label: 'Todos los alquileres' },
                    ...[...works].map(([value, label]) => ({ value, label })),
                  ]}
                  onChange={setObra}
                />
              </View>
              <View style={{ flex: 1, minWidth: 180 }}>
                <Select
                  label="Usuario"
                  value={actor}
                  options={[
                    { value: 'TODOS', label: 'Todos los usuarios' },
                    ...users.map(([value, label]) => ({ value, label })),
                  ]}
                  onChange={setActor}
                />
              </View>
              <View style={{ flex: 1, minWidth: 180 }}>
                <Field
                  label="Fecha · AAAA-MM-DD"
                  value={date}
                  onChangeText={setDate}
                  placeholder="Todas las fechas"
                  maxLength={10}
                />
              </View>
            </View>
          </View>
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
                    setError('No se pudo consultar el historial remoto. Reintenta con conexión.');
                  } finally {
                    setBusy(false);
                  }
                }}
              />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <Empty
            title="Sin movimientos"
            detail="Las acciones registradas aparecerán aquí. Prueba cambiando los filtros."
          />
        }
        renderItem={({ item: l }) => {
          const reason = user ? undoReason(state, l, user, now) : 'Inicia sesión.';
          return (
            <View style={[s.card, { marginBottom: 14 }]}>
              <View style={s.row}>
                <View style={{ padding: 11, borderRadius: 12, backgroundColor: C.panel2 }}>
                  <History size={21} color={C.muted} />
                </View>
                <View style={s.grow}>
                  <Text style={s.h2}>{l.accion}</Text>
                  <Text style={s.muted}>
                    {l.usuarioNombre} ·{' '}
                    {new Date(l.timestamp).toLocaleString('es-AR', {
                      timeZone: 'America/Argentina/Buenos_Aires',
                    })}
                  </Text>
                </View>
              </View>
              {l.obraId ? (
                <Text style={s.body}>
                  {l.obraNombre ||
                    state.obras.find((o) => o.id === l.obraId)?.clienteNombre ||
                    'Alquiler eliminado'}
                </Text>
              ) : null}
              {l.movimientos.map((m, i) => (
                <View key={i} style={s.row}>
                  <ArrowRight size={14} color={C.blue} />
                  <Text style={[s.muted, { flex: 1 }]}>
                    {m.cantidad} ×{' '}
                    {m.materialNombre ||
                      state.materiales.find((x) => x.id === m.materialId)?.nombre ||
                      m.materialId}{' '}
                    ·{' '}
                    {m.origen.startsWith('obra:')
                      ? state.obras.find((o) => o.id === m.origen.slice(5))?.clienteNombre ||
                        'Obra archivada'
                      : m.origen}{' '}
                    →{' '}
                    {m.destino.startsWith('obra:')
                      ? state.obras.find((o) => o.id === m.destino.slice(5))?.clienteNombre ||
                        'Obra archivada'
                      : m.destino}
                    {`\n`}
                    {m.motivo}
                  </Text>
                </View>
              ))}
              {reason ? (
                <Text style={s.muted}>{reason}</Text>
              ) : (
                <ConfirmButton
                  label="Deshacer"
                  title="Deshacer movimiento"
                  description="Se restaurarán obra e inventario y se agregará un registro de reversión. Debe seguir siendo la última operación y estar dentro de los 5 minutos."
                  variant="secondary"
                  onConfirm={() => dispatch({ type: 'UNDO', logId: l.id })}
                />
              )}
            </View>
          );
        }}
      />
    </Screen>
  );
}
