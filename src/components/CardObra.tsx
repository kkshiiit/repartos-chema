import { userError } from '../services/errors';
import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import {
  ArrowUpRight,
  MapPin,
  Navigation,
  MessageCircle,
  Users,
  CalendarDays,
  Box,
} from 'lucide-react-native';
import type { ObraCard } from '../types';
import { statusColor } from '../theme/tokens';
import { obraStatus } from '../domain/rules';
import { Button, Notice, Pending, useUI } from './ui';
import { StatusChip } from './StatusChip';
import { mapsUrl, whatsappUrl } from '../utils/whatsapp';
import { openLink } from '../services/links';
import { MotionView } from './MotionView';
export function CardObra({ obra: o }: { obra: ObraCard }) {
  const { C, s } = useUI();
  const [error, setError] = useState('');
  const color = statusColor(obraStatus(o).key, C);
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
    <MotionView
      style={[
        s.card,
        { padding: 0, overflow: 'hidden', borderTopWidth: 2, borderTopColor: color, gap: 0 },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Abrir ${o.clienteNombre}`}
        onPress={() => router.push(`/obra/${o.id}`)}
        style={({ pressed }) => ({
          padding: 17,
          gap: 12,
          backgroundColor: pressed ? C.selection : 'transparent',
        })}
      >
        <View style={[s.row, { justifyContent: 'space-between' }]}>
          <StatusChip obra={o} />
          <ArrowUpRight size={18} color={C.subtle} />
        </View>
        <View style={{ gap: 7 }}>
          <Text
            numberOfLines={2}
            style={{ color: C.text, fontSize: 19, fontWeight: '700', letterSpacing: -0.4 }}
          >
            {o.clienteNombre}
          </Text>
          <View style={[s.row, { gap: 6 }]}>
            <MapPin size={14} color={C.subtle} />
            <Text numberOfLines={1} style={[s.muted, { flex: 1 }]}>
              {o.direccion}
            </Text>
          </View>
          <Text style={{ color: C.muted, fontSize: 12, paddingLeft: 20 }}>{o.localidadBarrio}</Text>
        </View>
        <View style={{ backgroundColor: C.panel2, borderRadius: 14, padding: 12, gap: 8 }}>
          {loads.slice(0, 2).map((m) => (
            <View key={m.materialId} style={[s.row, { gap: 8 }]}>
              <Box size={13} color={C.subtle} />
              <Text numberOfLines={1} style={{ flex: 1, fontSize: 12, color: C.muted }}>
                {m.nombre} {m.medida}
              </Text>
              <Text style={{ fontWeight: '700', color: C.text, fontSize: 12 }}>×{m.cantidad}</Text>
            </View>
          ))}
          <Text style={{ fontSize: 11, color: C.subtle }}>
            {o.materialesCargados.length > 2
              ? `+${o.materialesCargados.length - 2} piezas`
              : o.materialesCargados.length
                ? o.estadoProceso === 'PENDIENTE_ENTREGA'
                  ? 'Carga preparada'
                  : o.estadoProceso === 'ENTREGADO'
                    ? 'Piezas alquiladas'
                    : 'Carga histórica'
                : 'Carga sin preparar'}
          </Text>
        </View>
        <View style={s.row}>
          <CalendarDays size={14} color={C.subtle} />
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={{ fontSize: 11, color: C.muted }}>
              Entrega {o.fechaEntrega.split('-').reverse().join('/')}
            </Text>
            <Text style={{ fontSize: 12, color: C.muted }}>Retiro</Text>
          </View>
          <Text style={{ fontSize: 12, fontWeight: '600', color }}>
            {o.fechaRetiroEstimada.split('-').reverse().join('/')}
          </Text>
        </View>
        <View style={[s.row, { justifyContent: 'space-between' }]}>
          <View style={[s.row, { gap: 6, flexShrink: 1 }]}>
            <Users size={13} color={C.subtle} />
            <Text style={{ color: C.muted, fontSize: 11 }} numberOfLines={1}>
              {(o.estadoProceso === 'RETIRADO' || o.estadoProceso === 'REINGRESADO'
                ? o.retiradoPor
                : o.entregadoPor
              )?.join(', ') || 'Por asignar'}
            </Text>
          </View>
          {o.syncStatus === 'PENDING' ? (
            <Pending />
          ) : (
            <Text style={{ color: C.green, fontSize: 11 }}>Sincronizado</Text>
          )}
        </View>
      </Pressable>
      <View
        style={{
          flexDirection: 'row',
          borderTopWidth: 1,
          borderColor: C.hairline,
          padding: 8,
          gap: 3,
        }}
      >
        <Button
          label="GPS"
          icon={Navigation}
          variant="ghost"
          onPress={() => void run(() => mapsUrl(o))}
          style={{ flex: 1, paddingHorizontal: 5 }}
        />
        <Button
          label="Remito"
          icon={MessageCircle}
          variant="ghost"
          onPress={() => void run(() => whatsappUrl(o))}
          style={{ flex: 1, paddingHorizontal: 5 }}
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
          style={{ flex: 1, paddingHorizontal: 8 }}
        />
      </View>
      {error ? (
        <View style={{ padding: 10 }}>
          <Notice text={error} tone="error" />
        </View>
      ) : null}
    </MotionView>
  );
}
