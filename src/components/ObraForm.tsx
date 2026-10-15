import { userError } from '../services/errors';
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import type { ObraCard } from '../types';
import { makeId, useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';
import { businessDate } from '../domain/rules';
import { Button, Field, Notice, Screen, useUI } from './ui';
export function ObraForm({ obra }: { obra?: ObraCard }) {
  const { s } = useUI();
  const { dispatch } = useInventory(),
    { user } = useAuth();
  const [nombre, setNombre] = useState(obra?.clienteNombre || ''),
    [baseVersion] = useState(obra?.version || 0),
    [observaciones, setObservaciones] = useState(obra?.observaciones || ''),
    [tel, setTel] = useState(obra?.clienteTelefono || ''),
    [direccion, setDireccion] = useState(obra?.direccion || ''),
    [zona, setZona] = useState(obra?.localidadBarrio || ''),
    [entrega, setEntrega] = useState(obra?.fechaEntrega || businessDate()),
    [retiro, setRetiro] = useState(obra?.fechaRetiroEstimada || businessDate()),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  return (
    <Screen title={obra ? 'Editar alquiler' : 'Nuevo alquiler'} back>
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
              placeholder="Cliente o nombre de el alquiler"
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
            <Field
              label="Observaciones"
              value={observaciones}
              onChangeText={setObservaciones}
              multiline
              maxLength={1000}
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
              label="Guardar alquiler"
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
                    observaciones: observaciones.trim(),
                    fechaEntrega: entrega,
                    fechaRetiroEstimada: retiro,
                    ...(obra?.coordenadas ? { coordenadas: obra.coordenadas } : {}),
                  };
                  await dispatch(
                    obra
                      ? { type: 'UPDATE_OBRA', obra: data, expectedVersion: baseVersion }
                      : { type: 'CREATE_OBRA', obra: data },
                  );
                  router.replace(`/obra/${data.id}`);
                } catch (e) {
                  setError(userError(e));
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
