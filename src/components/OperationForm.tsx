import { userError } from '../services/errors';
import { useFeedback } from '../context/FeedbackContext';
import React, { useEffect, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import type { IncidentInput, ObraCard } from '../types';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';
import { Button, Chip, Field, Notice, Select, StepTitle, useUI, usePanelChanges } from './ui';
import { TriangleAlert } from 'lucide-react-native';
import { SmartCounter } from './SmartCounter';
import { FaltantesForm } from './FaltantesForm';
import { required } from '../domain/rules';
export function Drivers({
  value,
  onChange,
  step,
  title = 'Quién lo hace',
}: {
  value: string[];
  onChange: (v: string[]) => void;
  step?: number;
  title?: string;
}) {
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
      <StepTitle n={step} title={title} hint="Tocá uno o más nombres (fletero, ayudante)." />
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
          <View style={s.wrap}>
            <Chip label="+ Agregar nombre" onPress={() => setAdding(true)} />
          </View>
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
  const { C, s } = useUI();
  const { notifySuccess, notifyError } = useFeedback();
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
  const [showIncidents, setShowIncidents] = useState(false);
  const shortages = obra.materialesCargados.filter(
    (i) => i.cantidad > (state.materiales.find((m) => m.id === i.materialId)?.cantidadGalpon || 0),
  );
  const returning = Object.entries(obra.saldosEnObra)
    .filter(([, n]) => n > 0)
    .map(([id, n]) => {
      const affected = incidents.filter((i) => i.materialId === id).reduce((sum, i) => sum + i.cantidad, 0);
      const m = state.materiales.find((m) => m.id === id);
      return {
        id,
        nombre: m?.nombre || id,
        medida: obra.materialesCargados.find((i) => i.materialId === id)?.medida || m?.medida || 'Sin medida',
        n: Math.max(0, n - affected),
      };
    });
  const pieces = (list: { n: number }[]) => list.reduce((sum, i) => sum + i.n, 0);
  const driverBlock = (step: number, title: string) => (
    <>
      <Drivers
        step={step}
        title={title}
        value={drivers}
        onChange={(v) => {
          markDirty();
          setDrivers(v);
          setDriverError('');
        }}
      />
      {driverError ? <Notice text={driverError} tone="error" /> : null}
    </>
  );
  const materialList = (items: { id: string; nombre: string; medida: string; n: number }[]) => (
    <View style={{ borderRadius: 12, borderWidth: 1, borderColor: C.hairline, backgroundColor: C.panel, overflow: 'hidden' }}>
      {items.map((i, index) => (
        <View
          key={i.id}
          style={[s.row, { paddingVertical: 9, paddingHorizontal: 12, gap: 10, borderTopWidth: index ? 1 : 0, borderColor: C.hairline }]}
        >
          <Text style={[s.h2, { fontVariant: ['tabular-nums'], minWidth: 34 }]}>{i.n}</Text>
          <View style={s.grow}>
            <Text style={s.label}>{i.nombre}</Text>
            <Text style={s.muted}>{i.medida}</Text>
          </View>
        </View>
      ))}
    </View>
  );
  return (
    <>
      {mode === 'entrega' ? (
        <>
          <StepTitle n={1} title="Qué se lleva" hint={`${pieces(obra.materialesCargados.map((i) => ({ n: i.cantidad })))} piezas salen del depósito.`} />
          {materialList(
            obra.materialesCargados.map((i) => ({ id: i.materialId, nombre: i.nombre, medida: i.medida || 'Sin medida', n: i.cantidad })),
          )}
          {shortages.map((i) => {
            const stock = state.materiales.find((m) => m.id === i.materialId)?.cantidadGalpon || 0,
              missing = i.cantidad - stock;
            return (
              <View key={i.materialId} style={{ gap: 10 }}>
                <Notice
                  tone="error"
                  text={`Falta stock de ${i.nombre}: pedidas ${i.cantidad}, hay ${stock} en el depósito (faltan ${missing}).`}
                />
                {user?.role === 'ADMIN' ? (
                  <Select
                    label={`Sacar de otro alquiler · ${i.nombre}`}
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
                  <Notice text="Pedí autorización a administración para sacarlo de otro alquiler." />
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
          {driverBlock(2, 'Quién lo lleva')}
          <StepTitle n={3} title="Quién recibe y hasta cuándo" />
          <Field
            label="Recibió"
            placeholder="Nombre de quien recibe en la obra"
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
        </>
      ) : null}
      {mode === 'retiro' ? (
        <>
          <StepTitle n={1} title="Qué vuelve al depósito" hint={`${pieces(returning)} piezas sanas. Lo ya registrado no se descuenta otra vez.`} />
          {materialList(returning)}
          {driverBlock(2, 'Quién lo retira')}
          {showIncidents || incidents.length ? (
            <>
              <StepTitle n={3} title="Faltantes o daños" hint="Lo dañado va a taller; lo perdido sale del stock. Queda en la Auditoría." />
              <FaltantesForm obra={obra} value={incidents} onChange={setIncidents} />
              {incidents.map((i, index) => (
                <Text key={index} style={s.muted}>
                  {i.cantidad} ×{' '}
                  {i.itemNombre || state.materiales.find((m) => m.id === i.materialId)?.nombre || 'Ítem fuera del inventario'} →{' '}
                  {i.materialId ? (i.tipo === 'DANADO' ? 'Taller' : 'Perdido') : 'Registro sin movimiento de stock'}
                </Text>
              ))}
            </>
          ) : (
            <Button
              label="¿Falta algo o volvió roto?"
              icon={TriangleAlert}
              variant="secondary"
              onPress={() => setShowIncidents(true)}
            />
          )}
        </>
      ) : null}
      {mode === 'faltante' ? (
        <>
          <Notice text="El material afectado sale del saldo alquilado y queda registrado en la Auditoría con tu nombre." />
          <FaltantesForm obra={obra} value={incidents} onChange={setIncidents} />
          <Text style={s.muted}>
            {returning.map((i) => `${i.nombre}: ${i.n} siguen alquiladas`).join(' · ')}
          </Text>
        </>
      ) : null}
      {mode === 'transferencia' ? (
        <>
          {driverBlock(1, 'Quién lo lleva')}
          <StepTitle n={2} title="A qué alquiler y cuánto" hint="Traslado directo entre obras. No pasa por el depósito." />
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
        </>
      ) : null}
      <View style={{ height: 4 }} />
      {error ? <Notice text={error} tone="error" /> : null}
      <Button
        label={
          {
            entrega: 'Confirmar entrega',
            retiro: 'Confirmar retiro',
            faltante: 'Confirmar faltante',
            transferencia: 'Confirmar triangulación',
          }[mode]
        }
        loading={busy}
        onPress={async () => {
          if (saving.current) return;
          if (mode !== 'faltante' && !drivers.length) {
            setDriverError('Elegí quién lo hace (tocá un nombre).');
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
