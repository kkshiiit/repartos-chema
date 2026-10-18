import React, { useState } from 'react';
import { View, Text } from 'react-native';
import type { IncidentInput, ObraCard } from '../types';
import { useInventory } from '../context/InventoryContext';
import { Button, Chip, Field, Select, Notice, useUI, usePanelChanges } from './ui';
import { SmartCounter } from './SmartCounter';
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
      <Button label="Agregar faltante" variant="secondary" onPress={() => add(selected)} />
      {value.map((i, index) => {
        const set = (change: Partial<IncidentInput>) => {
          markDirty();
          onChange(value.map((v, n) => (n === index ? { ...v, ...change } : v)));
        };
        return (
          <View
            key={index}
            style={{
              gap: 12,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: C.hairline,
            }}
          >
            <Text style={s.label}>
              {state.materiales.find((m) => m.id === i.materialId)?.nombre ||
                'Sin stock maestro · no mueve existencias'}
            </Text>
            <SmartCounter
              value={i.cantidad}
              label={`Faltante ${index + 1}`}
              onChange={(cantidad) => set({ cantidad })}
            />
            {i.materialId &&
            value
              .filter((v) => v.materialId === i.materialId)
              .reduce((sum, v) => sum + v.cantidad, 0) > (obra.saldosEnObra[i.materialId] || 0) ? (
              <Notice
                text="Las cantidades registradas superan el saldo alquilado de este material."
                tone="error"
              />
            ) : null}
            <View style={s.wrap}>
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
            <Field
              label="Ítem específico"
              value={i.itemNombre || ''}
              placeholder={
                i.materialId
                  ? 'Opcional · detalle del material'
                  : 'Obligatorio · ej. candado de seguridad'
              }
              onChangeText={(itemNombre) => set({ itemNombre })}
            />
            {!i.materialId && !i.itemNombre?.trim() ? (
              <Notice text="Indicá el nombre del ítem fuera del inventario." tone="error" />
            ) : null}
            <Field
              label="Notas"
              value={i.notas || ''}
              onChangeText={(notas) => set({ notas })}
              multiline
            />
            <Button
              label="Quitar"
              variant="ghost"
              onPress={() => {
                markDirty();
                onChange(value.filter((_, n) => n !== index));
              }}
            />
          </View>
        );
      })}
    </View>
  );
}
