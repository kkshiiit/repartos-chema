import { userError } from '../services/errors';
import { useFeedback } from '../context/FeedbackContext';
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import type { MaterialCargado, ObraCard } from '../types';
import { useInventory } from '../context/InventoryContext';
import { mergeLoads } from '../domain/engine';
import { Button, Chip, Field, Notice, Sheet, useUI, usePanelChanges } from './ui';
import { Layers, Plus } from 'lucide-react-native';
import { Disclosure } from './Editorial';
import { SmartCounter } from './SmartCounter';

/** Shared draft only: selecting materials never persists or moves stock. */
export function LoadDraft({
  items,
  onChange,
}: {
  items: MaterialCargado[];
  onChange: (items: MaterialCargado[]) => void;
}) {
  const { s, C } = useUI();
  const { markDirty } = usePanelChanges();
  const { state } = useInventory();
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [showCombos, setShowCombos] = useState(false);
  const change = (next: MaterialCargado[]) => {
    markDirty();
    onChange(next);
  };
  const update = (id: string, patch: Partial<MaterialCargado>) =>
    change(items.map((i) => (i.materialId === id ? { ...i, ...patch } : i)));
  const query = search.trim().toLocaleLowerCase('es');
  const matches = (text: string) => !query || text.toLocaleLowerCase('es').includes(query);
  // Lo elegido arriba (lo que ya está en la carga), el resto del depósito abajo: como un carrito.
  const rest = state.materiales.filter(
    (m) => !items.some((i) => i.materialId === m.id) && matches(`${m.nombre} ${m.medida || ''}`),
  );
  const total = items.reduce((sum, i) => sum + i.cantidad, 0);
  const add = (m: (typeof state.materiales)[number]) => {
    try {
      change(mergeLoads(items, [{ materialId: m.id, nombre: m.nombre, medida: m.medida, cantidad: 1 }]));
      setError('');
    } catch (e) {
      setError(userError(e));
    }
  };
  const box = { borderRadius: 12, borderWidth: 1, borderColor: C.hairline, backgroundColor: C.panel, overflow: 'hidden' as const };
  return (
    <View style={{ gap: 14 }}>
      <View style={[s.row, { justifyContent: 'space-between', gap: 8 }]}>
        <View style={s.grow}>
          <Text style={s.h2}>{total ? `${total} ${total === 1 ? 'pieza' : 'piezas'}` : 'Carga vacía'}</Text>
          <Text style={s.muted}>
            {items.length ? `${items.length} ${items.length === 1 ? 'material' : 'materiales'}` : 'Tocá «Agregar» o usá un combo'}
          </Text>
        </View>
        <Button label="Usar combo" icon={Layers} variant="secondary" compact onPress={() => setShowCombos(true)} />
      </View>
      {error ? <Notice text={error} tone="error" /> : null}
      {items.length ? (
        <View style={box}>
          {items.map((i, index) => {
            const m = state.materiales.find((m) => m.id === i.materialId);
            const low = !!m && i.cantidad > m.cantidadGalpon;
            return (
              <View key={i.materialId} style={{ gap: 6, padding: 12, borderTopWidth: index ? 1 : 0, borderColor: C.hairline }}>
                <View style={[s.row, { gap: 10 }]}>
                  <View style={s.grow}>
                    <Text style={s.label}>
                      {i.nombre}
                      {i.apodo ? <Text style={s.muted}>{` · ${i.apodo}`}</Text> : null}
                    </Text>
                    <Text style={[s.muted, low && { color: C.danger }]}>
                      {i.medida || 'Sin medida'} · {m?.cantidadGalpon ?? 0} en depósito
                    </Text>
                  </View>
                  <SmartCounter
                    label={`${i.nombre} ${i.medida || ''}`}
                    value={i.cantidad}
                    onChange={(cantidad) =>
                      cantidad === 0
                        ? change(items.filter((x) => x.materialId !== i.materialId))
                        : update(i.materialId, { cantidad })
                    }
                  />
                </View>
                {low ? (
                  <Notice
                    tone="error"
                    text={`Hay ${m!.cantidadGalpon} en el depósito. Podés guardar igual; al entregar hay que sacar lo que falta de otro alquiler.`}
                  />
                ) : null}
                <Disclosure title="Apodo o quitar" compact>
                  <View style={s.wrap}>
                    {['Con orejas', 'Antideslizante', 'Reforzado', 'De madera'].map((apodo) => (
                      <Chip
                        key={apodo}
                        label={apodo}
                        selected={i.apodo === apodo}
                        onPress={() => update(i.materialId, { apodo })}
                      />
                    ))}
                  </View>
                  <Field
                    label="Apodo de esta carga"
                    value={i.apodo || ''}
                    onChangeText={(apodo) => update(i.materialId, { apodo })}
                    maxLength={80}
                  />
                  <Button
                    label="Quitar material"
                    variant="ghost"
                    onPress={() => change(items.filter((x) => x.materialId !== i.materialId))}
                  />
                </Disclosure>
              </View>
            );
          })}
        </View>
      ) : null}
      <Text accessibilityRole="header" style={[s.label, { color: C.muted }]}>
        Del depósito
      </Text>
      {state.materiales.length > 6 ? (
        <Field label="Buscar material" value={search} onChangeText={setSearch} placeholder="Nombre o medida" />
      ) : null}
      {!rest.length ? (
        <Text style={s.muted}>
          {state.materiales.length ? 'No hay más materiales que coincidan.' : 'Cargá materiales en la pestaña Depósito.'}
        </Text>
      ) : (
        <View style={box}>
          {rest.map((m, index) => (
            <View key={m.id} style={[s.row, { gap: 10, paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: index ? 1 : 0, borderColor: C.hairline }]}>
              <View style={s.grow}>
                <Text style={s.label}>{m.nombre}</Text>
                <Text style={s.muted}>
                  {m.medida || 'Sin medida'} · {m.cantidadGalpon} en depósito
                </Text>
              </View>
              <Button label="Agregar material" text="+ Agregar" variant="secondary" compact onPress={() => add(m)} />
            </View>
          ))}
        </View>
      )}
      <Text style={s.muted}>La carga se prepara acá. El stock se mueve recién al confirmar la entrega.</Text>
      <Sheet visible={showCombos} title="Usar combo" onClose={() => setShowCombos(false)}>
        <View style={{ gap: 12 }}>
          {!state.combos.length ? (
            <Text style={s.muted}>Todavía no hay combos guardados.</Text>
          ) : (
            <View style={{ borderRadius: 12, borderWidth: 1, borderColor: C.hairline, overflow: 'hidden' }}>
              {state.combos.map((c, index) => (
                <Pressable
                  key={c.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Cargar combo ${c.nombreCombo}`}
                  onPress={() => {
                    try {
                      const loads = c.items.map((i) => {
                        const m = state.materiales.find((m) => m.id === i.materialId);
                        if (!m) throw new Error('El combo contiene un material inexistente.');
                        return { materialId: m.id, nombre: m.nombre, medida: m.medida, cantidad: i.cantidad };
                      });
                      change(mergeLoads(items, loads));
                      setError('');
                      setShowCombos(false);
                    } catch (e) {
                      setError(userError(e));
                    }
                  }}
                  style={({ pressed }) => [
                    s.row,
                    { gap: 12, padding: 14, borderTopWidth: index ? 1 : 0, borderColor: C.hairline, backgroundColor: pressed ? C.panel2 : C.panel },
                  ]}
                >
                  <Layers size={22} color={C.accent} />
                  <View style={s.grow}>
                    <Text style={s.label}>{c.nombreCombo}</Text>
                    <Text style={s.muted} numberOfLines={2}>
                      {c.items
                        .map((i) => `${i.cantidad} × ${state.materiales.find((m) => m.id === i.materialId)?.nombre || '?'}`)
                        .join(' · ')}
                    </Text>
                  </View>
                  <Plus size={20} color={C.accent} />
                </Pressable>
              ))}
            </View>
          )}
        </View>
        {error ? <Notice text={error} tone="error" /> : null}
      </Sheet>
    </View>
  );
}

export function LoadEditor({ obra, onDone }: { obra: ObraCard; onDone: () => void }) {
  const { notifySuccess, notifyError } = useFeedback();
  const { setBusy: setPanelBusy } = usePanelChanges();
  const { state, dispatch } = useInventory();
  const [items, setItems] = useState(obra.materialesCargados);
  const [baseVersion] = useState(obra.version || 0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setPanelBusy?.(busy);
    return () => setPanelBusy?.(false);
  }, [busy, setPanelBusy]);
  const saving = useRef(false);
  return (
    <>
      <LoadDraft items={items} onChange={setItems} />
      {error ? <Notice text={error} tone="error" /> : null}
      <Button
        label={
          items.some(
            (i) =>
              i.cantidad >
              (state.materiales.find((m) => m.id === i.materialId)?.cantidadGalpon || 0),
          )
            ? 'Cargar igual'
            : 'Guardar carga'
        }
        loading={busy}
        onPress={async () => {
          if (saving.current) return;
          saving.current = true;
          setBusy(true);
          try {
            await dispatch({
              type: 'SET_LOAD',
              expectedVersion: baseVersion,
              obraId: obra.id,
              items: items.filter((i) => i.cantidad > 0),
            });
            notifySuccess('Carga guardada. Las existencias se mueven al entregar.');
            onDone();
          } catch (e) {
            notifyError(userError(e));
            setError(userError(e));
          } finally {
            saving.current = false;
            setBusy(false);
          }
        }}
      />
    </>
  );
}
