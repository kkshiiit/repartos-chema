import { displayDate } from '../utils/dateInput';
import { userError } from '../services/errors';
import { useFeedback } from '../context/FeedbackContext';
import React, { useEffect, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import type { IncidentInput, ObraCard } from '../types';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';
import { Button, Chip, Field, Notice, Select, useUI, usePanelChanges } from './ui';
import { SmartCounter } from './SmartCounter';
import { FaltantesForm } from './FaltantesForm';
import { LOCAL_ONLY } from '../services/localMode';
import { required } from '../domain/rules';
export function Drivers({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const { s } = useUI();
  const { markDirty, setBusy: setPanelBusy } = usePanelChanges();
  const { state, dispatch } = useInventory();
  const { user } = useAuth();
  const [adding, setAdding] = useState(false),
    [draft, setDraft] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  useEffect(() => {
    setPanelBusy?.(busy);
    return () => setPanelBusy?.(false);
  }, [busy, setPanelBusy]);
  const saving = useRef(false);
  return (
    <View style={{ gap: 12 }}>
      <Text style={s.label}>RESPONSABLES / FLETE</Text>
      {!state.responsables.length ? (
        <Notice text="Agregá el nombre de quien realiza la entrega o el retiro." />
      ) : null}
      <View style={s.wrap}>
        {state.responsables.map((n) => (
          <Chip
            key={n}
            label={n}
            selected={value.includes(n)}
            onPress={() => {
              markDirty();
              onChange(value.includes(n) ? value.filter((x) => x !== n) : [...value, n]);
            }}
          />
        ))}
      </View>
      {user?.role === 'ADMIN' ? (
        adding ? (
          <View style={{ gap: 10 }}>
            <Field
              label="Nombre del responsable"
              value={draft}
              onChangeText={setDraft}
              maxLength={80}
              autoFocus
              autoCapitalize="words"
            />
            {error ? <Notice text={error} tone="error" /> : null}
            <Button
              label="Guardar responsable"
              loading={busy}
              onPress={async () => {
                if (saving.current) return;
                saving.current = true;
                setBusy(true);
                try {
                  const name = required(draft.trim().replace(/\s+/g, ' '), 'Responsable', 80);
                  const existing = state.responsables.find(
                    (n) => n.toLocaleLowerCase('es') === name.toLocaleLowerCase('es'),
                  );
                  if (!existing)
                    await dispatch({
                      type: 'RESPONSABLES',
                      nombres: [...state.responsables, name],
                    });
                  markDirty();
                  onChange([...new Set([...value, existing || name])]);
                  setAdding(false);
                  setDraft('');
                  setError('');
                } catch (e) {
                  setError(userError(e));
                } finally {
                  saving.current = false;
                  setBusy(false);
                }
              }}
            />
            <Button
              label="Cancelar"
              variant="ghost"
              disabled={busy}
              onPress={() => {
                setAdding(false);
                setDraft('');
                setError('');
              }}
            />
          </View>
        ) : (
          <Button label="Agregar responsable" variant="secondary" onPress={() => setAdding(true)} />
        )
      ) : null}
    </View>
  );
}
export function OperationForm({
  obra,
  mode,
  onDone,
}: {
  obra: ObraCard;
  mode: 'entrega' | 'retiro' | 'faltante' | 'transferencia';
  onDone: () => void;
}) {
  const { s } = useUI();
  const { notifySuccess } = useFeedback();
  const { markDirty, setBusy: setPanelBusy } = usePanelChanges();
  const { state, dispatch } = useInventory(),
    { user } = useAuth();
  const [drivers, setDrivers] = useState<string[]>([]),
    [received, setReceived] = useState(''),
    [incidents, setIncidents] = useState<IncidentInput[]>([]),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [retiro, setRetiro] = useState(obra.fechaRetiroEstimada),
    [motivo, setMotivo] = useState(''),
    [origins, setOrigins] = useState<Record<string, string>>({}),
    [target, setTarget] = useState(''),
    [material, setMaterial] = useState(
      Object.keys(obra.saldosEnObra).find((id) => obra.saldosEnObra[id]! > 0) || '',
    ),
    [cantidad, setCantidad] = useState(1);
  useEffect(() => {
    setPanelBusy?.(busy);
    return () => setPanelBusy?.(false);
  }, [busy, setPanelBusy]);
  const saving = useRef(false);
  const [driverError, setDriverError] = useState('');
  const shortages = obra.materialesCargados.filter(
    (i) => i.cantidad > (state.materiales.find((m) => m.id === i.materialId)?.cantidadGalpon || 0),
  );
  return (
    <>
      {mode !== 'faltante' ? (
        <>
          <Drivers
            value={drivers}
            onChange={(v) => {
              markDirty();
              setDrivers(v);
              setDriverError('');
            }}
          />
          {driverError ? <Notice text={driverError} tone="error" /> : null}
        </>
      ) : null}
      {mode === 'entrega' ? (
        <>
          <Notice text="Confirmá las piezas y el flete antes de entregar." />
          <Field
            label="Recibió"
            placeholder="Nombre de quien recibió los andamios"
            value={received}
            onChangeText={setReceived}
            maxLength={80}
          />
          <Field
            label="Retiro previsto · AAAA-MM-DD"
            value={retiro}
            onChangeText={setRetiro}
            maxLength={10}
          />
          {obra.materialesCargados.map((i) => (
            <Text key={i.materialId} style={s.body}>
              {i.cantidad} × {i.nombre} {i.medida}
            </Text>
          ))}
          {shortages.map((i) => {
            const stock = state.materiales.find((m) => m.id === i.materialId)?.cantidadGalpon || 0,
              missing = i.cantidad - stock;
            return (
              <View key={i.materialId} style={{ gap: 10 }}>
                <Notice
                  text={`⚠️ Stock bajo: Pedidos ${i.cantidad} | En Depósito ${stock}. ${i.nombre}: faltan ${missing}.`}
                />
                {user?.role === 'ADMIN' ? (
                  <Select
                    label={`Alquiler de origen · ${i.nombre}`}
                    value={origins[i.materialId] || ''}
                    options={state.obras
                      .filter(
                        (o) =>
                          o.id !== obra.id &&
                          o.estadoProceso === 'ENTREGADO' &&
                          (o.saldosEnObra[i.materialId] || 0) >= missing,
                      )
                      .map((o) => ({
                        label: `${o.clienteNombre} · saldo ${o.saldosEnObra[i.materialId]}`,
                        value: o.id,
                      }))}
                    onChange={(id) => {
                      markDirty();
                      setOrigins({ ...origins, [i.materialId]: id });
                    }}
                  />
                ) : (
                  <Notice text="Solicita autorización de administración para la procedencia alternativa." />
                )}
              </View>
            );
          })}
          {shortages.length ? (
            <Field
              label="Motivo y autorización"
              value={motivo}
              onChangeText={setMotivo}
              placeholder="Detalle de la triangulación autorizada"
            />
          ) : null}
        </>
      ) : null}
      {mode === 'retiro' || mode === 'faltante' ? (
        <>
          <Notice
            text={
              mode === 'retiro'
                ? 'El material sano vuelve a depósito. Registra aquí solo los nuevos daños o pérdidas de esta inspección.'
                : LOCAL_ONLY
                  ? 'El material afectado sale del saldo alquilado y queda registrado en el historial de este celular. No se envían avisos externos.'
                  : 'El material afectado sale del saldo de este alquiler. El aviso a administración quedará pendiente hasta que el servicio FCM lo confirme.'
            }
          />
          <FaltantesForm obra={obra} value={incidents} onChange={setIncidents} />
        </>
      ) : null}
      {mode === 'transferencia' ? (
        <>
          <Select
            label="Alquiler destino"
            value={target}
            options={state.obras
              .filter(
                (o) =>
                  o.id !== obra.id &&
                  (o.estadoProceso === 'ENTREGADO' ||
                    (o.estadoProceso === 'PENDIENTE_ENTREGA' && !o.materialesCargados.length)),
              )
              .map((o) => ({ value: o.id, label: o.clienteNombre }))}
            onChange={(id) => {
              markDirty();
              setTarget(id);
            }}
          />
          <Select
            label="Material"
            value={material}
            options={state.materiales
              .filter((m) => (obra.saldosEnObra[m.id] || 0) > 0)
              .map((m) => ({
                value: m.id,
                label: `${m.nombre} · ${obra.materialesCargados.find((i) => i.materialId === m.id)?.medida || m.medida || 'Sin medida'} · ${obra.saldosEnObra[m.id]} disponibles`,
              }))}
            onChange={(id) => {
              markDirty();
              setMaterial(id);
            }}
          />
          <SmartCounter value={cantidad} onChange={setCantidad} />
          <Field label="Motivo de transferencia" value={motivo} onChangeText={setMotivo} />
          <Notice text="Traslado directo entre obras. No suma disponibilidad al depósito." />
        </>
      ) : null}
      <View style={{ gap: 12, paddingVertical: 16 }}>
        <View style={s.divider} />
        <Text accessibilityRole="header" style={s.h2}>
          Revisar operación
        </Text>
        <Text style={s.body}>{obra.clienteNombre}</Text>
        {mode !== 'faltante' ? (
          <Text style={s.body}>Responsables: {drivers.join(', ') || 'Sin seleccionar'}</Text>
        ) : null}
        {mode === 'entrega' ? (
          <>
            <Text style={s.body}>
              Recibió: {received || 'Sin indicar'} · Retiro: {displayDate(retiro)}
            </Text>
            <Text style={s.muted}>
              La carga pasa a saldo alquilado. Se descuenta el depósito disponible y, si
              corresponde, el saldo del origen autorizado.
            </Text>
          </>
        ) : mode === 'transferencia' ? (
          <>
            <Text style={s.body}>
              Destino:{' '}
              {state.obras.find((o) => o.id === target)?.clienteNombre || 'Sin seleccionar'}
            </Text>
            <Text style={s.body}>
              {cantidad} ×{' '}
              {state.materiales.find((m) => m.id === material)?.nombre || 'Sin material'} ·{' '}
              {obra.materialesCargados.find((i) => i.materialId === material)?.medida ||
                'Sin medida'}
            </Text>
            <Text style={s.muted}>
              El saldo pasa directamente al destino. No aumenta el depósito. Si el destino está
              pendiente, queda entregado.
            </Text>
          </>
        ) : (
          <>
            {Object.entries(obra.saldosEnObra)
              .filter(([, n]) => n > 0)
              .map(([id, n]) => {
                const affected = incidents
                  .filter((i) => i.materialId === id)
                  .reduce((sum, i) => sum + i.cantidad, 0);
                const m = state.materiales.find((m) => m.id === id);
                return (
                  <Text key={id} style={s.body}>
                    {m?.nombre || id} ·{' '}
                    {obra.materialesCargados.find((i) => i.materialId === id)?.medida ||
                      m?.medida ||
                      'Sin medida'}
                    :{' '}
                    {mode === 'retiro'
                      ? `${Math.max(0, n - affected)} sanas vuelven a depósito`
                      : `${Math.max(0, n - affected)} siguen alquiladas`}
                  </Text>
                );
              })}
            {incidents.map((i, index) => (
              <Text key={index} style={s.body}>
                {i.cantidad} ×{' '}
                {i.itemNombre ||
                  state.materiales.find((m) => m.id === i.materialId)?.nombre ||
                  'Ítem fuera del inventario'}{' '}
                →{' '}
                {i.materialId
                  ? i.tipo === 'DANADO'
                    ? 'Taller'
                    : 'Perdido'
                  : 'Registro sin movimiento de stock'}
              </Text>
            ))}
            <Text style={s.muted}>Lo ya registrado no se descuenta otra vez.</Text>
          </>
        )}
      </View>
      {error ? <Notice text={error} tone="error" /> : null}
      <Button
        label="Confirmar operación"
        loading={busy}
        onPress={async () => {
          if (saving.current) return;
          if (mode !== 'faltante' && !drivers.length) {
            setDriverError('Selecciona responsables.');
            return;
          }
          saving.current = true;
          setBusy(true);
          setError('');
          try {
            if (mode === 'entrega')
              await dispatch({
                type: 'DELIVER',
                recibidoPor: received.trim(),
                fechaRetiroEstimada: retiro,
                obraId: obra.id,
                responsables: drivers,
                ...(shortages.length
                  ? {
                      origins: shortages.map((i) => ({
                        materialId: i.materialId,
                        obraId: origins[i.materialId] || '',
                        cantidad:
                          i.cantidad -
                          (state.materiales.find((m) => m.id === i.materialId)?.cantidadGalpon ||
                            0),
                      })),
                      motivo,
                    }
                  : {}),
              });
            else if (mode === 'retiro')
              await dispatch({ type: 'RETIRE', obraId: obra.id, responsables: drivers, incidents });
            else if (mode === 'faltante')
              await dispatch({ type: 'REPORT', obraId: obra.id, incidents });
            else
              await dispatch({
                type: 'TRANSFER',
                obraId: obra.id,
                targetId: target,
                materialId: material,
                cantidad,
                motivo,
                responsables: drivers,
              });
            notifySuccess(
              {
                entrega: 'Entrega confirmada.',
                retiro: 'Retiro registrado.',
                faltante: 'Daños y faltantes registrados.',
                transferencia: 'Transferencia confirmada.',
              }[mode],
            );
            onDone();
          } catch (e) {
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
