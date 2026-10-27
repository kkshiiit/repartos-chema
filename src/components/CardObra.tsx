import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import type { ObraCard, MaterialItem } from '../types';
import { useUI } from './ui';
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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir ${o.clienteNombre}`}
      accessibilityHint={`${o.direccion}, ${o.localidadBarrio}. ${rentalSummary(o)}. ${task.label}. Abrir detalle y operaciones.`}
      onPress={() => router.push(`/obra/${o.id}`)}
      style={({ pressed }) => ({
        backgroundColor: pressed ? C.selection : C.panel,
        borderBottomWidth: last ? 0 : 1,
        borderColor: C.hairline,
        borderTopLeftRadius: first ? 12 : 0,
        borderTopRightRadius: first ? 12 : 0,
        borderBottomLeftRadius: last ? 12 : 0,
        borderBottomRightRadius: last ? 12 : 0,
        paddingVertical: 12,
        paddingHorizontal: 14,
        gap: 4,
      })}
    >
      <View style={[s.row, { alignItems: 'flex-start', gap: 8 }]}>
        <Text style={[s.label, s.grow, { fontSize: 16, lineHeight: 22, fontWeight: '700' }]}>
          {o.clienteNombre}
        </Text>
        <ChevronRight size={18} color={C.muted} />
      </View>
      <Text style={[s.body, { fontSize: 14, lineHeight: 20 }]}>
        {o.direccion} <Text style={{ color: C.muted }}>· {o.localidadBarrio}</Text>
      </Text>
      <Text style={[s.muted, { fontSize: 13, lineHeight: 19 }]}>
        {rentalMaterialPreview(o, materials)}
      </Text>
      <View style={[s.row, { flexWrap: 'wrap', gap: 6, marginTop: 3 }]}>
        <StatusChip obra={o} compact today={today} />
        {task.kind !== 'FINISHED' ? (
          <Text style={[s.muted, { color: taskColor, fontSize: 13, lineHeight: 19 }]}>
            {task.label}
          </Text>
        ) : null}
        {task.date ? (
          <Text style={[s.muted, { fontSize: 13, lineHeight: 19, fontVariant: ['tabular-nums'] }]}>
            {task.kind === 'DELIVER' ? 'Entrega ' : 'Hasta '}
            {formatDate(task.date, true)}
          </Text>
        ) : null}
        {task.kind === 'DELIVER' ? (
          <Text style={[s.muted, { fontSize: 13, lineHeight: 19, fontVariant: ['tabular-nums'] }]}>
            {isCalendarDate(o.fechaRetiroEstimada)
              ? `Hasta ${formatDate(o.fechaRetiroEstimada, true)}`
              : 'Sin fecha de retiro'}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
