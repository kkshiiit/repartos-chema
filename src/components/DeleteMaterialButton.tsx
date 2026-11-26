import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import type { MaterialItem } from '../types';
import { useInventory } from '../context/InventoryContext';
import { userError } from '../services/errors';
import { materialDeleteBlocker } from '../utils/deleteRental';
import { Button, Notice, Sheet, useUI } from './ui';

/** Papelera visible con confirmación para dar de baja un material del depósito. */
export function DeleteMaterialButton({ material: m }: { material: MaterialItem }) {
  const { C, s } = useUI();
  const { state, dispatch } = useInventory();
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const name = `${m.nombre}${m.medida ? ` ${m.medida}` : ''}`;
  const blocker = materialDeleteBlocker(m, state.obras);
  const combos = state.combos.filter((c) => c.items.some((i) => i.materialId === m.id));
  const stock = m.cantidadGalpon + m.cantidadEnTaller + m.cantidadPerdido;
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Borrar material ${name}`}
        hitSlop={4}
        onPress={() => {
          setError('');
          setOpen(true);
        }}
        style={({ pressed }) => ({
          width: 48,
          height: 48,
          borderRadius: 24,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: pressed ? C.dangerBackground : 'transparent',
        })}
      >
        {({ pressed }) => <Trash2 size={22} color={pressed ? C.danger : C.subtle} />}
      </Pressable>
      <Sheet visible={open} title="¿Borrar este material?" busy={busy} onClose={() => setOpen(false)}>
        <View style={{ gap: 4 }}>
          <Text style={s.h2}>{name}</Text>
          <Text style={s.body}>
            {m.cantidadGalpon} en depósito · {m.cantidadEnTaller} a reparar · {m.cantidadPerdido} perdidos
          </Text>
        </View>
        {blocker ? (
          <>
            <Notice tone="error" text={blocker} />
            <Button label="Entendido" variant="secondary" onPress={() => setOpen(false)} />
          </>
        ) : (
          <>
            <Text style={s.body}>
              {stock
                ? `Se da de baja todo el stock (${stock} piezas) y el material deja de aparecer en el depósito.`
                : 'El material deja de aparecer en el depósito.'}
              {combos.length ? ` También se quita de ${combos.length === 1 ? 'el combo' : 'los combos'} ${combos.map((c) => c.nombreCombo).join(', ')}.` : ''}{' '}
              Los alquileres anteriores conservan su nombre. Queda registrado en la Auditoría.
            </Text>
            {error ? <Notice tone="error" text={error} /> : null}
            <Button
              label="Sí, borrar material"
              icon={Trash2}
              variant="danger"
              loading={busy}
              onPress={async () => {
                setBusy(true);
                try {
                  await dispatch({ type: 'DELETE_MATERIAL', materialId: m.id });
                  setOpen(false);
                } catch (e) {
                  setError(userError(e));
                } finally {
                  setBusy(false);
                }
              }}
            />
            <Button label="No, conservarlo" variant="ghost" onPress={() => setOpen(false)} />
          </>
        )}
      </Sheet>
    </>
  );
}
