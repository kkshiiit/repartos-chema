import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import type { ObraCard } from '../types';
import { useInventory } from '../context/InventoryContext';
import { userError } from '../services/errors';
import { Button, Notice, Sheet, useUI } from './ui';
import { deleteBlocker } from '../utils/deleteRental';
export { deleteBlocker };

/** Papelera visible con confirmación: borra el alquiler entero de una vez. */
export function DeleteRentalButton({
  obra,
  size = 48,
  onDeleted,
}: {
  obra: ObraCard;
  size?: number;
  onDeleted?: () => void;
}) {
  const { C, s } = useUI();
  const { dispatch } = useInventory();
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const blocker = deleteBlocker(obra);
  const pieces = obra.materialesCargados.reduce((n, m) => n + m.cantidad, 0);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Borrar alquiler de ${obra.clienteNombre}`}
        hitSlop={6}
        onPress={() => {
          setError('');
          setOpen(true);
        }}
        style={({ pressed }) => ({
          width: size,
          height: size,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: C.danger,
          backgroundColor: pressed ? C.dangerBackground : C.panel,
        })}
      >
        <Trash2 size={Math.round(size * 0.46)} color={C.danger} />
      </Pressable>
      <Sheet visible={open} title="¿Borrar este alquiler?" busy={busy} onClose={() => setOpen(false)}>
        <View style={{ gap: 4 }}>
          <Text style={s.h2}>{obra.clienteNombre}</Text>
          <Text style={s.muted}>
            {obra.direccion} · {obra.localidadBarrio}
          </Text>
          <Text style={s.body}>
            {pieces
              ? `${pieces} ${pieces === 1 ? 'pieza cargada' : 'piezas cargadas'} (${obra.materialesCargados.map((m) => `${m.cantidad} ${m.nombre}`).join(', ')}).`
              : 'Sin materiales cargados.'}
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
              Se borra todo de una vez: cliente, materiales cargados y fotos. El stock del depósito no
              cambia. Queda registrado en la Auditoría; desde ahí se puede deshacer en los 5 minutos siguientes si nadie hizo otro cambio después.
            </Text>
            {error ? <Notice tone="error" text={error} /> : null}
            <Button
              label="Sí, borrar alquiler"
              icon={Trash2}
              variant="danger"
              loading={busy}
              onPress={async () => {
                setBusy(true);
                try {
                  await dispatch({ type: 'DELETE_OBRA', obraId: obra.id });
                  setOpen(false);
                  onDeleted?.();
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
