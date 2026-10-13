import React, { useState } from 'react';
import { View, Text } from 'react-native';
import type { MaterialCargado, ObraCard } from '../types';
import { useInventory } from '../context/InventoryContext';
import { mergeLoads } from '../domain/engine';
import { Button, Chip, Field, Notice, Select, s } from './ui';
import { SmartCounter } from './SmartCounter';
import { ScaffoldSelector } from './ScaffoldSelector';
export function LoadEditor({ obra, onDone }: { obra: ObraCard; onDone: () => void }) {
  const { state, dispatch } = useInventory();
  const [items, setItems] = useState<MaterialCargado[]>(obra.materialesCargados),
    [selected, setSelected] = useState(state.materiales[0]?.id || ''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [combo, setCombo] = useState('');
  const update = (id: string, change: Partial<MaterialCargado>) =>
    setItems(items.map((i) => (i.materialId === id ? { ...i, ...change } : i)));
  return (
    <>
      <Notice text="La carga es una reserva informativa. Las existencias se mueven al confirmar la entrega." />
      <Select
        label="Agregar material"
        value={selected}
        options={state.materiales.map((m) => ({
          label: `${m.nombre} ${m.medida || ''} · ${m.cantidadGalpon} en galpón`,
          value: m.id,
        }))}
        onChange={setSelected}
      />
      <Button
        label="Agregar material"
        variant="secondary"
        onPress={() => {
          const m = state.materiales.find((m) => m.id === selected);
          if (m)
            setItems(
              mergeLoads(items, [
                { materialId: m.id, nombre: m.nombre, medida: m.medida, cantidad: 1 },
              ]),
            );
        }}
      />
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
              return { materialId: m.id, nombre: m.nombre, medida: m.medida, cantidad: i.cantidad };
            });
            setItems(mergeLoads(items, loads));
            setError('');
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      />
      <Text style={s.h2}>Revisar carga</Text>
      {items.map((i) => {
        const m = state.materiales.find((m) => m.id === i.materialId);
        return (
          <View key={i.materialId} style={s.card}>
            <Text style={s.h2}>{i.nombre}</Text>
            <SmartCounter
              label={i.nombre}
              value={i.cantidad}
              onChange={(n) => update(i.materialId, { cantidad: n })}
            />
            {m && i.cantidad > m.cantidadGalpon ? (
              <Notice
                text={`⚠️ Stock bajo: Pedidos ${i.cantidad} | En Galpón ${m.cantidadGalpon}. Puedes guardar la carga. La entrega requiere procedencia autorizada.`}
              />
            ) : null}
            <ScaffoldSelector
              value={i.medida || ''}
              onChange={(medida) => update(i.materialId, { medida })}
            />
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
              onPress={() => setItems(items.filter((x) => x.materialId !== i.materialId))}
            />
          </View>
        );
      })}
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
          setBusy(true);
          try {
            await dispatch({
              type: 'SET_LOAD',
              obraId: obra.id,
              items: items.filter((i) => i.cantidad > 0),
            });
            onDone();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      />
    </>
  );
}
