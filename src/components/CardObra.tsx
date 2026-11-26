import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import type { ObraCard, MaterialItem } from '../types';
import { useUI } from './ui';
import { fonts } from '../theme/tokens';
import { DeleteRentalButton } from './DeleteRentalButton';
import { deleteBlocker } from '../utils/deleteRental';
import { StatusChip } from './StatusChip';
import { rentalSummary, rentalTaskForDate, rentalMaterialPreview } from '../utils/listPresentation';
import { businessDate } from '../domain/rules';
import { formatDate } from '../utils/formatters';
import { isCalendarDate } from '../utils/retirementCalendar';
/** A visible address and one task per rental; all commercial actions live in detail. */
export function CardObra({
  obra: o,
  first = false,
  last = false,
  now = new Date(),
  materials = [],
}: {
  obra: ObraCard;
  first?: boolean;
  last?: boolean;
  now?: Date;
  materials?: MaterialItem[];
}) {
  const { C, s } = useUI();
  const today = businessDate(now);
  const task = rentalTaskForDate(o, today);
  const taskColor =
    task.group === 'overdue' ? C.danger : task.group === 'today' ? C.warning : C.muted;
  const stripe =
    task.group === 'overdue'
      ? C.danger
      : task.group === 'today'
        ? C.warning
        : o.estadoProceso === 'PENDIENTE_ENTREGA'
          ? C.blue
          : o.estadoProceso === 'ENTREGADO'
            ? C.success
            : C.line;
  void first;
  void last;
  const when = task.date
    ? `${task.kind === 'DELIVER' ? 'Entrega' : 'Retiro'} ${formatDate(task.date, true)}`
    : task.kind === 'DELIVER' || !isCalendarDate(o.fechaRetiroEstimada)
      ? 'Sin fecha de retiro'
      : '';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir ${o.clienteNombre}`}
      accessibilityHint={`${o.direccion}, ${o.localidadBarrio}. ${rentalSummary(o)}. ${task.label}. Abrir detalle y operaciones.`}
      onPress={() => router.push(`/obra/${o.id}`)}
      style={({ pressed }) => ({
        backgroundColor: pressed ? C.panel2 : C.panel,
        borderWidth: 1,
        borderColor: C.hairline,
        borderRadius: 14,
        marginBottom: 10,
        paddingVertical: 14,
        paddingLeft: 20,
        paddingRight: 8,
        overflow: 'hidden',
      })}
    >
      {/* Riel de estado: el color se lee antes que el texto. */}
      <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, backgroundColor: stripe }} />
      <View style={[s.row, { alignItems: 'flex-start', gap: 6 }]}>
        <View style={[s.grow, { gap: 3 }]}>
          <Text numberOfLines={2} style={{ color: C.text, fontFamily: fonts.semibold, fontSize: 18, lineHeight: 23 }}>
            {o.clienteNombre}
          </Text>
          <Text numberOfLines={1} style={[s.muted, { color: C.text }]}>
            {o.direccion}
            <Text style={{ color: C.muted }}>{`, ${o.localidadBarrio}`}</Text>
          </Text>
          <Text numberOfLines={1} style={[s.muted, { fontSize: 14 }]}>
            {rentalMaterialPreview(o, materials)}
          </Text>
        </View>
        {deleteBlocker(o) === null ? <DeleteRentalButton obra={o} size={40} /> : <ChevronRight size={20} color={C.subtle} style={{ marginTop: 2 }} />}
      </View>
      <View style={[s.row, { gap: 8, marginTop: 10, paddingRight: 8, flexWrap: 'wrap' }]}>
        <StatusChip obra={o} compact today={today} />
        {task.kind !== 'FINISHED' ? (
          <Text numberOfLines={1} style={{ color: taskColor, fontFamily: fonts.semibold, fontSize: 15, flexShrink: 1 }}>
            {task.label}
          </Text>
        ) : null}
        <View style={s.grow} />
        {when ? (
          <Text style={{ color: C.muted, fontFamily: fonts.displaySemi, fontSize: 17, fontVariant: ['tabular-nums'] }}>
            {when}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
