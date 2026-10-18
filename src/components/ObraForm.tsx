import { displayDate } from '../utils/dateInput';
import { userError } from '../services/errors';
import { useFeedback } from '../context/FeedbackContext';
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, type TextInput } from 'react-native';
import { router, useNavigation } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import type { MaterialCargado, ObraCard } from '../types';
import { makeId, useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';
import { businessDate, required, validDate, quantity, measureKey } from '../domain/rules';
import { Button, Chip, Field, Notice, Screen, Sheet, useUI } from './ui';
import { LoadDraft } from './LoadEditor';

export function ObraForm({ obra }: { obra?: ObraCard }) {
  const { s } = useUI();
  const { notifySuccess } = useFeedback();
  const { state, dispatch } = useInventory();
  const { user } = useAuth();
  const [id] = useState(() => obra?.id || makeId());
  const [nombre, setNombre] = useState(obra?.clienteNombre || '');
  const [observaciones, setObservaciones] = useState(obra?.observaciones || '');
  const [tel, setTel] = useState(obra?.clienteTelefono || '');
  const [direccion, setDireccion] = useState(obra?.direccion || '');
  const [zona, setZona] = useState(obra?.localidadBarrio || '');
  const [entrega, setEntrega] = useState(obra?.fechaEntrega || businessDate());
  const [retiro, setRetiro] = useState(obra?.fechaRetiroEstimada || businessDate());
  const [items, setItems] = useState<MaterialCargado[]>(obra?.materialesCargados || []);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const inputs = useRef<Record<string, TextInput | null>>({});
  useEffect(() => {
    if (step === 0) inputs.current[Object.keys(errors)[0] || '']?.focus();
  }, [errors, step]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  const completed = useRef(false);
  const navigation = useNavigation();
  const [leave, setLeave] = useState<null | (() => void)>(null);
  // A load failure keeps the persisted identity/version, so retry never creates a duplicate.
  const persisted = useRef<{ version: number; data: string } | null>(null);
  const editableLoad = !obra || obra.estadoProceso === 'PENDIENTE_ENTREGA';
  const data = {
    id,
    clienteNombre: nombre.trim(),
    clienteTelefono: tel.trim(),
    direccion: direccion.trim(),
    localidadBarrio: zona.trim(),
    observaciones: observaciones.trim(),
    fechaEntrega: entrega,
    fechaRetiroEstimada: retiro,
    ...(obra?.coordenadas ? { coordenadas: obra.coordenadas } : {}),
  };
  const [initial] = useState(() => JSON.stringify({ data, items }));
  const dirty = JSON.stringify({ data, items }) !== initial;
  usePreventRemove(dirty, ({ data: event }) => {
    if (completed.current) {
      navigation.dispatch(event.action);
      return;
    }
    if (saving.current) return;
    setLeave(() => () => navigation.dispatch(event.action));
  });
  const validateClient = () => {
    const next: Record<string, string> = {};
    for (const [key, value, label] of [
      ['nombre', nombre, 'Cliente'],
      ['direccion', direccion, 'Dirección'],
      ['zona', zona, 'Zona'],
    ]) {
      try {
        required(value!, label!);
      } catch (e) {
        next[key!] = userError(e);
      }
    }
    if (tel.trim() && !/^\+?[\d\s()-]{8,25}$/.test(tel.trim()))
      next.tel = 'Teléfono inválido. Usa código de país.';
    for (const [key, value] of [
      ['entrega', entrega],
      ['retiro', retiro],
    ]) {
      try {
        validDate(value!);
      } catch (e) {
        next[key!] = userError(e);
      }
    }
    if (!next.entrega && !next.retiro && retiro < entrega)
      next.retiro = 'El retiro debe ser posterior o igual a la entrega.';
    if (obra?.fechaEntregaEfectiva && retiro < obra.fechaEntregaEfectiva)
      next.retiro = 'El retiro no puede preceder la entrega efectiva.';
    setErrors(next);
    return !Object.keys(next).length;
  };
  const validateLoad = () => {
    try {
      if (editableLoad)
        for (const i of items.filter((i) => i.cantidad > 0)) {
          quantity(i.cantidad, true);
          const m = state.materiales.find((m) => m.id === i.materialId);
          if (!m || measureKey(i.medida) !== measureKey(m.medida))
            throw new Error(
              'La medida debe coincidir con el material maestro. Selecciona la variante correcta.',
            );
          if (i.apodo) required(i.apodo, 'Apodo', 80);
        }
      if (items.length > 100) throw new Error('Máximo 100 materiales.');
      setError('');
      return true;
    } catch (e) {
      setError(userError(e));
      return false;
    }
  };
  const field = (
    key: string,
    label: string,
    value: string,
    onChangeText: (v: string) => void,
    extra = {},
  ) => (
    <View style={{ gap: 4 }}>
      <Field
        {...{
          ref: (input: TextInput | null) => {
            inputs.current[key] = input;
          },
        }}
        label={label}
        value={value}
        onChangeText={onChangeText}
        {...extra}
      />
      {errors[key] ? <Notice text={errors[key]!} tone="error" /> : null}
    </View>
  );
  return (
    <Screen title={obra ? 'Editar alquiler' : 'Nuevo alquiler'} back>
      <View style={{ maxWidth: 700, width: '100%', alignSelf: 'center', gap: 20 }}>
        {user?.role !== 'ADMIN' ? (
          <Notice text="Solo administración puede gestionar obras." tone="error" />
        ) : (
          <>
            <View style={s.wrap}>
              {['Cliente', 'Carga', 'Revisar'].map((label, index) => (
                <Chip
                  key={label}
                  label={`${index + 1} · ${label}`}
                  selected={step === index}
                  onPress={() => {
                    if (busy) return;
                    if (index < step || (validateClient() && (index < 2 || validateLoad())))
                      setStep(index);
                  }}
                />
              ))}
            </View>
            <Text style={s.muted}>Paso {step + 1} de 3</Text>
            {step === 0 ? (
              <>
                <Text accessibilityRole="header" style={s.h2}>
                  Cliente y ubicación
                </Text>
                {field('nombre', 'Nombre del cliente', nombre, setNombre, {
                  placeholder: 'Cliente o nombre del alquiler',
                })}
                {field('tel', 'Teléfono con país', tel, setTel, {
                  placeholder: 'Opcional · incluye código de país',
                  keyboardType: 'phone-pad',
                })}
                {field('direccion', 'Dirección', direccion, setDireccion, {
                  placeholder: 'Calle y número',
                })}
                {field('zona', 'Barrio / localidad', zona, setZona)}
                <View style={s.divider} />
                <Text accessibilityRole="header" style={s.h2}>
                  Planificación
                </Text>
                {field('entrega', 'Entrega · AAAA-MM-DD', entrega, setEntrega, { maxLength: 10 })}
                {field('retiro', 'Retiro · AAAA-MM-DD', retiro, setRetiro, { maxLength: 10 })}
                <Field
                  label="Observaciones"
                  value={observaciones}
                  onChangeText={setObservaciones}
                  multiline
                  maxLength={1000}
                />
                {obra?.coordenadas ? (
                  <Text style={s.muted}>
                    Ubicación guardada: {obra.coordenadas.lat}, {obra.coordenadas.lng}
                  </Text>
                ) : null}
                <Button
                  label="Continuar a carga"
                  onPress={() => {
                    if (validateClient()) setStep(1);
                  }}
                />
              </>
            ) : step === 1 ? (
              <>
                <Text style={s.h2}>{nombre}</Text>
                <Text style={s.muted}>{zona}</Text>
                {editableLoad ? (
                  <LoadDraft items={items} onChange={setItems} />
                ) : (
                  <>
                    <Notice text="Este alquiler ya fue entregado o cerrado. La carga histórica se conserva." />
                    {items.map((i) => (
                      <Text key={i.materialId} style={s.body}>
                        {i.cantidad} × {i.nombre} · {i.medida || 'Sin medida'}
                        {i.apodo ? ` · ${i.apodo}` : ''}
                      </Text>
                    ))}
                  </>
                )}
                {error ? <Notice text={error} tone="error" /> : null}
                <Button label="Volver a cliente" variant="secondary" onPress={() => setStep(0)} />
                <Button
                  label="Revisar alquiler"
                  onPress={() => {
                    if (validateLoad()) setStep(2);
                  }}
                />
              </>
            ) : (
              <>
                <Text accessibilityRole="header" style={s.h2}>
                  Revisar alquiler
                </Text>
                <Text style={s.h2}>{nombre}</Text>
                <Text style={s.body}>
                  {direccion} · {zona}
                </Text>
                <Text style={s.body}>Teléfono: {tel || 'Sin teléfono'}</Text>
                <Text style={s.body}>
                  Entrega: {displayDate(entrega)} · Retiro: {displayDate(retiro)}
                </Text>
                <Text style={s.body}>Observaciones: {observaciones || 'Sin observaciones'}</Text>
                {obra?.coordenadas ? (
                  <Text style={s.body}>
                    Ubicación: {obra.coordenadas.lat}, {obra.coordenadas.lng}
                  </Text>
                ) : null}
                <View style={s.divider} />
                <Text style={s.h2}>Materiales</Text>
                {items
                  .filter((i) => i.cantidad > 0)
                  .map((i) => (
                    <Text key={i.materialId} style={s.body}>
                      {i.cantidad} × {i.nombre} · {i.medida || 'Sin medida'}
                      {i.apodo ? ` · ${i.apodo}` : ''}
                    </Text>
                  ))}
                {!items.some((i) => i.cantidad > 0) ? (
                  <Text style={s.muted}>Sin carga preparada.</Text>
                ) : null}
                <Notice text="Guardar conserva los datos y la carga preparada. No confirma la entrega ni mueve existencias." />
                {error ? <Notice text={error} tone="error" /> : null}
                <Button
                  label="Volver a carga"
                  variant="secondary"
                  disabled={busy}
                  onPress={() => setStep(1)}
                />
                <Button
                  label="Guardar alquiler"
                  loading={busy}
                  onPress={async () => {
                    if (saving.current) return;
                    if (!validateClient()) {
                      setStep(0);
                      return;
                    }
                    if (!validateLoad()) {
                      setStep(1);
                      return;
                    }
                    saving.current = true;
                    setBusy(true);
                    setError('');
                    try {
                      const serialized = JSON.stringify(data);
                      if (!persisted.current || persisted.current.data !== serialized) {
                        const version = persisted.current?.version ?? (obra?.version || 0);
                        await dispatch(
                          obra || persisted.current
                            ? { type: 'UPDATE_OBRA', obra: data, expectedVersion: version }
                            : { type: 'CREATE_OBRA', obra: data },
                        );
                        persisted.current = { version: version + 1, data: serialized };
                      }
                      if (
                        editableLoad &&
                        JSON.stringify(items) !== JSON.stringify(obra?.materialesCargados || [])
                      ) {
                        await dispatch({
                          type: 'SET_LOAD',
                          obraId: id,
                          expectedVersion: persisted.current.version,
                          items: items.filter((i) => i.cantidad > 0),
                        });
                      }
                      notifySuccess(obra ? 'Alquiler actualizado.' : 'Alquiler guardado.');
                      completed.current = true;
                      router.replace(`/obra/${id}`);
                    } catch (e) {
                      setError(
                        `${persisted.current ? 'Los datos del alquiler están guardados; revisá y reintentá la carga. ' : ''}${userError(e)}`,
                      );
                    } finally {
                      saving.current = false;
                      setBusy(false);
                    }
                  }}
                />
              </>
            )}
          </>
        )}
      </View>
      <Sheet visible={!!leave} title="¿Descartar los cambios?" onClose={() => setLeave(null)}>
        <Notice text="Los cambios de este formulario todavía no se guardaron." />
        <Button label="Seguir editando" onPress={() => setLeave(null)} />
        <Button
          label="Descartar cambios"
          variant="danger"
          onPress={() => {
            completed.current = true;
            leave?.();
            setLeave(null);
          }}
        />
      </Sheet>
    </Screen>
  );
}
