import React, { useState } from 'react';
import { View, Text } from 'react-native';
import type { IncidentInput, ObraCard } from '../types';
import { useInventory } from '../context/InventoryContext';
import { Button, Chip, Field, Select, Notice, useUI, usePanelChanges } from './ui';
import { SmartCounter } from './SmartCounter';
import { Disclosure } from './Editorial';
export function FaltantesForm({
  obra,
  value,
  onChange,
}: {
  obra: ObraCard;
  value: IncidentInput[];
  onChange: (v: IncidentInput[]) => void;
}) {
  const { C, s } = useUI();
  const { markDirty } = usePanelChanges();
  const { state } = useInventory();
  const available = state.materiales.filter((m) => (obra.saldosEnObra[m.id] || 0) > 0);
  const [selected, setSelected] = useState(available[0]?.id || '');
  const add = (id: string) => {
    markDirty();
    onChange([
      ...value,
      { ...(id ? { materialId: id } : {}), cantidad: 1, tipo: 'PERDIDO', notas: '' },
    ]);
  };
  return (
    <View style={{ gap: 15 }}>
      <View style={s.wrap}>
        {['Tornillos/Tuercas', 'Pasadores', 'Abrazaderas', 'Manijas'].map((name) => {
          const m = available.find((m) => m.nombre === name);
          return m ? <Chip key={name} label={name} onPress={() => add(m.id)} /> : null;
        })}
      </View>
      <Select
        label="Material afectado"
        value={selected}
        options={[
          { label: 'Ítem fuera del inventario', value: '' },
          ...available.map((m) => ({
            label: `${m.nombre} · ${obra.materialesCargados.find((i) => i.materialId === m.id)?.medida || m.medida || 'Sin medida'} · ${obra.saldosEnObra[m.id]} alquiladas`,
            value: m.id,
          })),
        ]}
        onChange={setSelected}
      />
      <Button
        label="Agregar faltante"
        text="+ Agregar faltante"
        variant="secondary"
        onPress={() => add(selected)}
      />
      {value.map((i, index) => {
        const set = (change: Partial<IncidentInput>) => {
          markDirty();
          onChange(value.map((v, n) => (n === index ? { ...v, ...change } : v)));
        };
        const name = state.materiales.find((m) => m.id === i.materialId);
        const over =
          !!i.materialId &&
          value
            .filter((v) => v.materialId === i.materialId)
            .reduce((sum, v) => sum + v.cantidad, 0) > (obra.saldosEnObra[i.materialId] || 0);
        return (
          <View
            key={index}
            style={{
              gap: 10,
              padding: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: i.tipo === 'DANADO' ? C.warning : C.danger,
              backgroundColor: C.panel,
            }}
          >
            <View style={[s.row, { gap: 8 }]}>
              <Text style={[s.label, s.grow]}>
                {name
                  ? `${name.nombre}${name.medida ? ` · ${name.medida}` : ''}`
                  : 'Ítem fuera del inventario'}
              </Text>
              <Button
                label="Quitar"
                text="Quitar"
                variant="ghost"
                compact
                onPress={() => {
                  markDirty();
                  onChange(value.filter((_, n) => n !== index));
                }}
              />
            </View>
            <View style={[s.row, { gap: 10, flexWrap: 'wrap' }]}>
              <SmartCounter
                value={i.cantidad}
                label={`Faltante ${index + 1}`}
                onChange={(cantidad) => set({ cantidad })}
              />
              <Chip
                label="Perdido"
                selected={i.tipo === 'PERDIDO'}
                onPress={() => set({ tipo: 'PERDIDO' })}
              />
              <Chip
                label="Dañado"
                selected={i.tipo === 'DANADO'}
                onPress={() => set({ tipo: 'DANADO' })}
              />
            </View>
            <Text style={s.muted}>
              {i.tipo === 'DANADO' ? 'Va a taller para reparar.' : 'Sale del stock como perdido.'}
              {name ? '' : ' No mueve stock.'}
            </Text>
            {over ? (
              <Notice
                text="Las cantidades registradas superan el saldo alquilado de este material."
                tone="error"
              />
            ) : null}
            {i.materialId ? (
              <Disclosure
                title="Detalle y notas (opcional)"
                compact
                initiallyOpen={!!(i.itemNombre || i.notas)}
              >
                <Field
                  label="Ítem específico"
                  value={i.itemNombre || ''}
                  placeholder="Ej. con orejas, n.º de serie"
                  onChangeText={(itemNombre) => set({ itemNombre })}
                />
                <Field
                  label="Notas"
                  value={i.notas || ''}
                  onChangeText={(notas) => set({ notas })}
                  multiline
                />
              </Disclosure>
            ) : (
              <>
                <Field
                  label="Ítem específico"
                  value={i.itemNombre || ''}
                  placeholder="Obligatorio · ej. candado de seguridad"
                  onChangeText={(itemNombre) => set({ itemNombre })}
                />
                {!i.itemNombre?.trim() ? (
                  <Notice text="Indicá el nombre del ítem fuera del inventario." tone="error" />
                ) : null}
                <Field
                  label="Notas"
                  value={i.notas || ''}
                  onChangeText={(notas) => set({ notas })}
                  multiline
                />
              </>
            )}
          </View>
        );
      })}
    </View>
  );
}
