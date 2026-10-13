import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import type { ObraCard } from '../types';
import { makeId, useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';
import { businessDate } from '../domain/rules';
import { Button, Field, Notice, Screen, s } from './ui';
export function ObraForm({ obra }: { obra?: ObraCard }) {
  const { dispatch } = useInventory(),
    { user } = useAuth();
  const [nombre, setNombre] = useState(obra?.clienteNombre || ''),
    [tel, setTel] = useState(obra?.clienteTelefono || ''),
    [direccion, setDireccion] = useState(obra?.direccion || ''),
    [zona, setZona] = useState(obra?.localidadBarrio || ''),
    [entrega, setEntrega] = useState(obra?.fechaEntrega || businessDate()),
    [retiro, setRetiro] = useState(obra?.fechaRetiroEstimada || businessDate()),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  return (
    <Screen
      title={obra ? 'Editar obra' : 'Nueva obra'}
      subtitle="El primer paso de una entrega en orden."
      back
    >
      <View style={[s.card, { maxWidth: 700, width: '100%', alignSelf: 'center', gap: 20 }]}>
        {user?.role !== 'ADMIN' ? (
          <Notice text="Solo administración puede gestionar obras." tone="error" />
        ) : (
          <>
            <Text style={s.h2}>Cliente y ubicación</Text>
            <Field
              label="Nombre del cliente"
              value={nombre}
              onChangeText={setNombre}
              placeholder="Cliente o nombre de la obra"
            />
            <Field
              label="Teléfono con país"
              value={tel}
              onChangeText={setTel}
              placeholder="Opcional · incluye código de país"
              keyboardType="phone-pad"
            />
            <Field
              label="Dirección"
              value={direccion}
              onChangeText={setDireccion}
              placeholder="Calle y número"
            />
            <Field
              label="Barrio / localidad"
              value={zona}
              onChangeText={setZona}
              placeholder="Ej. San Martín"
            />
            <View style={s.divider} />
            <Text style={s.h2}>Planificación</Text>
            <Field
              label="Entrega · AAAA-MM-DD"
              value={entrega}
              onChangeText={setEntrega}
              maxLength={10}
            />
            <Field
              label="Retiro · AAAA-MM-DD"
              value={retiro}
              onChangeText={setRetiro}
              maxLength={10}
            />
            <Text style={s.muted}>
              Después podrás preparar la carga y seleccionar los responsables.
            </Text>
            {error ? <Notice text={error} tone="error" /> : null}
            <Button
              label="Guardar obra"
              loading={busy}
              onPress={async () => {
                setBusy(true);
                try {
                  const data = {
                    id: obra?.id || makeId(),
                    clienteNombre: nombre.trim(),
                    clienteTelefono: tel.trim(),
                    direccion: direccion.trim(),
                    localidadBarrio: zona.trim(),
                    fechaEntrega: entrega,
                    fechaRetiroEstimada: retiro,
                    ...(obra?.coordenadas ? { coordenadas: obra.coordenadas } : {}),
                  };
                  await dispatch({ type: obra ? 'UPDATE_OBRA' : 'CREATE_OBRA', obra: data });
                  router.replace(`/obra/${data.id}`);
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            />
          </>
        )}
      </View>
    </Screen>
  );
}
