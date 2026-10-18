import { userError } from '../services/errors';
import { useFeedback } from '../context/FeedbackContext';
import React, { useEffect, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import type { MaterialCargado, ObraCard } from '../types';
import { useInventory } from '../context/InventoryContext';
import { mergeLoads } from '../domain/engine';
import { Button, Chip, Field, Notice, Select, Sheet, useUI, usePanelChanges } from './ui';
import { Layers } from 'lucide-react-native';
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
  const { s } = useUI();
  const { markDirty } = usePanelChanges();
  const { state } = useInventory();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(state.materiales[0]?.id || '');
  const [error, setError] = useState('');
  const [showCombos, setShowCombos] = useState(false);
  const [combo, setCombo] = useState('');
  const change = (next: MaterialCargado[]) => {
    markDirty();
    onChange(next);
  };
  const update = (id: string, patch: Partial<MaterialCargado>) =>
    change(items.map((i) => (i.materialId === id ? { ...i, ...patch } : i)));
  const materials = state.materiales.filter((m) =>
    `${m.nombre} ${m.medida || ''}`
      .toLocaleLowerCase('es')
      .includes(search.toLocaleLowerCase('es')),
  );
  return (
    <View style={{ gap: 16 }}>
      <View style={[s.row, { justifyContent: 'space-between', flexWrap: 'wrap' }]}>
        <Text style={[s.label, { flex: 1, minWidth: 120 }]}>
          {items.reduce((sum, i) => sum + i.cantidad, 0)} piezas seleccionadas
        </Text>
        <Button
          label="Usar combo"
          icon={Layers}
          variant="secondary"
          onPress={() => setShowCombos(true)}
        />
      </View>
      <Field
        label="Buscar material"
        value={search}
        onChangeText={setSearch}
        placeholder="Nombre o medida"
      />
      <Disclosure
        key={search ? 'search' : items.length ? 'selected' : 'empty'}
        title="Agregar materiales"
        compact
        initiallyOpen={!!search || !items.length}
      >
        {!materials.length ? (
          <Text style={s.muted}>No hay materiales que coincidan con la búsqueda.</Text>
        ) : (
          <>
            <Select
              label="Agregar material"
              value={selected}
              options={materials.map((m) => ({
                label: `${m.nombre} · ${m.medida || 'Sin medida'} · ${m.cantidadGalpon} en depósito`,
                value: m.id,
              }))}
              onChange={setSelected}
            />
            <Button
              label="Agregar material"
              variant="secondary"
              onPress={() => {
                try {
                  const m = materials.find((m) => m.id === selected);
                  if (!m) throw new Error('Seleccioná un material de la lista.');
                  change(
                    mergeLoads(items, [
                      { materialId: m.id, nombre: m.nombre, medida: m.medida, cantidad: 1 },
                    ]),
                  );
                  setError('');
                } catch (e) {
                  setError(userError(e));
                }
              }}
            />
          </>
        )}
      </Disclosure>
      {error ? <Notice text={error} tone="error" /> : null}
      {!items.length ? (
        <Text style={s.muted}>
          Agregá materiales o un combo. Podés guardar el alquiler sin carga y prepararla después.
        </Text>
      ) : null}
      <View>
        {items.map((i) => {
          const m = state.materiales.find((m) => m.id === i.materialId);
          return (
            <View
              key={i.materialId}
              style={{
                gap: 4,
                paddingVertical: 8,
                borderBottomWidth: 1,
                borderBottomColor: s.divider.backgroundColor,
              }}
            >
              <View style={[s.row, { flexWrap: 'wrap', gap: 12 }]}>
                <View style={{ flex: 1, minWidth: 112, gap: 4 }}>
                  <Text style={s.label}>{i.nombre}</Text>
                  <Text style={s.muted}>
                    {i.medida || 'Sin medida'} · {m?.cantidadGalpon ?? 0} en depósito
                  </Text>
                </View>
                <SmartCounter
                  label={`${i.nombre} ${i.medida || ''}`}
                  value={i.cantidad}
                  onChange={(cantidad) => update(i.materialId, { cantidad })}
                />
              </View>
              {m && i.cantidad > m.cantidadGalpon ? (
                <Notice
                  text={`Stock bajo: Pedidos ${i.cantidad} | En Depósito ${m.cantidadGalpon}. Puedes guardar la carga. La entrega requiere procedencia autorizada.`}
                />
              ) : null}
              <Disclosure title={`Detalles de ${i.nombre}`} compact>
                <Text style={s.muted}>
                  Medida: {i.medida || 'Sin medida'}. Para otra medida, selecciona su material
                  maestro.
                </Text>
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
      <Text style={s.muted}>
        La carga se prepara aquí. Las existencias se mueven al confirmar la entrega.
      </Text>
      <Sheet visible={showCombos} title="Usar combo" onClose={() => setShowCombos(false)}>
        <View style={{ gap: 12 }}>
          {!state.combos.length ? (
            <Text style={s.muted}>Todavía no hay combos guardados.</Text>
          ) : (
            <>
              <Select
                label="Cargar combo"
                value={combo}
                options={state.combos.map((c) => ({ label: c.nombreCombo, value: c.id }))}
                onChange={setCombo}
              />
              <Button
                label="Revisar combo"
                variant="secondary"
                onPress={() => {
                  try {
                    const c = state.combos.find((c) => c.id === combo);
                    if (!c) throw new Error('Selecciona un combo.');
                    const loads = c.items.map((i) => {
                      const m = state.materiales.find((m) => m.id === i.materialId);
                      if (!m) throw new Error('El combo contiene un material inexistente.');
                      return {
                        materialId: m.id,
                        nombre: m.nombre,
                        medida: m.medida,
                        cantidad: i.cantidad,
                      };
                    });
                    change(mergeLoads(items, loads));
                    setError('');
                    setShowCombos(false);
                  } catch (e) {
                    setError(userError(e));
                  }
                }}
              />
            </>
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
