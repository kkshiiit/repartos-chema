import { userError } from '../services/errors';
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import type { IncidentInput, ObraCard } from '../types';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';
import { Button, Chip, Field, Notice, Select, useUI } from './ui';
import { SmartCounter } from './SmartCounter';
import { FaltantesForm } from './FaltantesForm';
export function Drivers({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const { s } = useUI();
  const { state } = useInventory();
  return (
    <View style={{ gap: 9 }}>
      <Text style={s.label}>RESPONSABLES / FLETE</Text>
      <View style={s.wrap}>
        {state.responsables.map((n) => (
          <Chip
            key={n}
            label={n}
            selected={value.includes(n)}
            onPress={() =>
              onChange(value.includes(n) ? value.filter((x) => x !== n) : [...value, n])
            }
          />
        ))}
      </View>
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
  const shortages = obra.materialesCargados.filter(
    (i) => i.cantidad > (state.materiales.find((m) => m.id === i.materialId)?.cantidadGalpon || 0),
  );
  return (
    <>
      {mode !== 'faltante' ? <Drivers value={drivers} onChange={setDrivers} /> : null}
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
            const stock = state.materiales.find((m) => m.id === i.materialId)!.cantidadGalpon,
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
                    onChange={(id) => setOrigins({ ...origins, [i.materialId]: id })}
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
            onChange={setTarget}
          />
          <Select
            label="Material"
            value={material}
            options={state.materiales
              .filter((m) => (obra.saldosEnObra[m.id] || 0) > 0)
              .map((m) => ({
                value: m.id,
                label: `${m.nombre} · ${obra.saldosEnObra[m.id]} disponibles`,
              }))}
            onChange={setMaterial}
          />
          <SmartCounter value={cantidad} onChange={setCantidad} />
          <Field label="Motivo de transferencia" value={motivo} onChangeText={setMotivo} />
          <Notice text="Traslado directo entre obras. No suma disponibilidad al depósito." />
        </>
      ) : null}
      {error ? <Notice text={error} tone="error" /> : null}
      <Button
        label="Confirmar operación"
        loading={busy}
        onPress={async () => {
          setBusy(true);
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
                          state.materiales.find((m) => m.id === i.materialId)!.cantidadGalpon,
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
            onDone();
          } catch (e) {
            setError(userError(e));
          } finally {
            setBusy(false);
          }
        }}
      />
    </>
  );
}
