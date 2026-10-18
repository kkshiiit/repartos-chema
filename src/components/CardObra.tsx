import { userError } from '../services/errors';
import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { ArrowUpRight, Navigation, MessageCircle } from 'lucide-react-native';
import type { ObraCard } from '../types';
import { Button, Notice, Pending, useUI } from './ui';
import { StatusChip } from './StatusChip';
import { mapsUrl, whatsappUrl } from '../utils/whatsapp';
import { openLink } from '../services/links';
import { MotionView } from './MotionView';
export function CardObra({ obra: o }: { obra: ObraCard }) {
  const { C, s } = useUI();
  const [error, setError] = useState('');
  const run = async (f: () => string) => {
    try {
      await openLink(f());
      setError('');
    } catch (e) {
      setError(userError(e));
    }
  };
  const loads =
    o.estadoProceso === 'ENTREGADO'
      ? o.materialesCargados
          .map((m) => ({ ...m, cantidad: o.saldosEnObra[m.materialId] || 0 }))
          .filter((m) => m.cantidad > 0)
      : o.materialesCargados;
  return (
    <MotionView style={[s.card, { gap: 12 }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Abrir ${o.clienteNombre}`}
        onPress={() => router.push(`/obra/${o.id}`)}
        style={({ pressed }) => ({
          gap: 8,
          backgroundColor: pressed ? C.selection : 'transparent',
          borderRadius: 12,
          minHeight: 48,
        })}
      >
        <View style={[s.row, { justifyContent: 'space-between' }]}>
          <StatusChip obra={o} />
          <ArrowUpRight size={20} color={C.muted} />
        </View>
        <Text style={s.h2}>{o.clienteNombre}</Text>
        <Text style={s.body}>{o.direccion}</Text>
        <Text style={s.muted}>{o.localidadBarrio}</Text>
        <Text style={s.muted}>
          {loads.length
            ? loads
                .map((m) => `${m.cantidad} ${m.nombre}${m.medida ? ` ${m.medida}` : ''}`)
                .join(' · ')
            : 'Carga por preparar'}
        </Text>
        <View style={[s.row, { flexWrap: 'wrap', justifyContent: 'space-between' }]}>
          <Text style={[s.muted, { fontVariant: ['tabular-nums'] }]}>
            Retiro {o.fechaRetiroEstimada.split('-').reverse().join('/')}
          </Text>
          <Pending />
        </View>
        <Text style={s.muted}>
          {(o.estadoProceso === 'RETIRADO' || o.estadoProceso === 'REINGRESADO'
            ? o.retiradoPor
            : o.entregadoPor
          )?.join(', ') || 'Responsable por asignar'}
        </Text>
      </Pressable>
      <View style={s.divider} />
      <View style={[s.wrap, { gap: 4 }]}>
        <Button
          label="GPS"
          icon={Navigation}
          variant="ghost"
          onPress={() => run(() => mapsUrl(o))}
        />
        <Button
          label="Remito"
          icon={MessageCircle}
          variant="ghost"
          onPress={() => run(() => whatsappUrl(o))}
        />
        <Button
          label={
            o.estadoProceso === 'PENDIENTE_ENTREGA'
              ? 'Entregar'
              : o.estadoProceso === 'ENTREGADO'
                ? 'Retirar'
                : 'Ver alquiler'
          }
          variant="secondary"
          onPress={() =>
            router.push(
              `/obra/${o.id}?accion=${o.estadoProceso === 'PENDIENTE_ENTREGA' ? 'entrega' : o.estadoProceso === 'ENTREGADO' ? 'retiro' : 'ver'}`,
            )
          }
        />
      </View>
      {error ? <Notice text={error} tone="error" /> : null}
    </MotionView>
  );
}
