import React from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Building2, ChevronRight } from 'lucide-react-native';
import type { ObraCard } from '../types';
import { useUI } from './ui';
import { StatusChip } from './StatusChip';
import { rentalSummary } from '../utils/listPresentation';
import { businessDate } from '../domain/rules';
import { retirementCountdown, isCalendarDate } from '../utils/retirementCalendar';
import { formatDate } from '../utils/formatters';
/** A rental is a row. Secondary actions and complete information belong in its detail. */
export function CardObra({
  obra: o,
  first = false,
  last = false,
  now = new Date(),
}: {
  obra: ObraCard;
  first?: boolean;
  last?: boolean;
  now?: Date;
}) {
  const { C, s } = useUI();
  const { fontScale } = useWindowDimensions();
  const countdown = retirementCountdown(o, now);
  const rowDate = o.estadoProceso === 'PENDIENTE_ENTREGA' ? o.fechaEntrega : o.fechaRetiroEstimada;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir ${o.clienteNombre}`}
      accessibilityHint={`${o.direccion}, ${o.localidadBarrio}. ${rentalSummary(o)}. ${countdown.label}. Abrir detalle y operaciones.`}
      onPress={() => router.push(`/obra/${o.id}`)}
      style={({ pressed }) => ({
        backgroundColor: pressed ? C.selection : C.panel,
        borderBottomWidth: last ? 0 : 1,
        borderTopLeftRadius: first ? 16 : 0,
        borderTopRightRadius: first ? 16 : 0,
        borderBottomLeftRadius: last ? 16 : 0,
        borderBottomRightRadius: last ? 16 : 0,
        borderColor: C.hairline,
        paddingVertical: 14,
        paddingHorizontal: 12,
        minHeight: 96,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
      })}
    >
      {fontScale <= 1.3 ? <Building2 size={22} color={C.muted} /> : null}
      <View style={[s.grow, { gap: 2 }]}>
        <Text style={[s.label, { fontSize: 16, lineHeight: 22, fontWeight: '700' }]}>
          {o.clienteNombre}
        </Text>
        <Text numberOfLines={1} style={[s.muted, { fontSize: 13, lineHeight: 19 }]}>
          {o.localidadBarrio}
        </Text>
        <Text numberOfLines={1} style={[s.muted, { fontSize: 13, lineHeight: 19 }]}>
          {rentalSummary(o)}
        </Text>
        {!countdown.finished &&
        (countdown.days !== null || o.estadoProceso === 'PENDIENTE_ENTREGA') ? (
          <Text style={[s.muted, { fontSize: 12, lineHeight: 17 }]}>{countdown.label}</Text>
        ) : null}
      </View>
      <View style={{ alignItems: 'flex-end', gap: 5, maxWidth: '39%' }}>
        <StatusChip obra={o} compact today={businessDate(now)} />
        {isCalendarDate(rowDate) ? (
          <Text style={[s.muted, { fontSize: 12, lineHeight: 17, fontVariant: ['tabular-nums'] }]}>
            {o.estadoProceso === 'PENDIENTE_ENTREGA' ? 'Entrega ' : 'Hasta '}
            {formatDate(rowDate, true)}
          </Text>
        ) : null}
      </View>
      <ChevronRight size={16} color={C.muted} />
    </Pressable>
  );
}
