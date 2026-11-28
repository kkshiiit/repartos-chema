import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import {
  CalendarClock,
  Check,
  ChevronRight,
  CircleAlert,
  PackageMinus,
  PackagePlus,
  Plus,
} from 'lucide-react-native';
import { useInventory } from '../../src/context/InventoryContext';
import { useAuth } from '../../src/context/AuthContext';
import { Button, Screen, useUI } from '../../src/components/ui';
import { LegacyImport } from '../../src/components/LegacyImport';
import { businessDate } from '../../src/domain/rules';
import { rentalTaskForDate } from '../../src/utils/listPresentation';
import { BUSINESS_TIME_ZONE } from '../../src/utils/retirementCalendar';
import { useBusinessClock } from '../../src/hooks/useBusinessClock';
import { api } from '../../src/sync/api';
import { fonts } from '../../src/theme/tokens';
import type { ObraCard } from '../../src/types';

/**
 * Hoy: la primera pantalla responde una sola pregunta, «¿qué tengo que hacer ahora?».
 * - Lo atrasado va primero y lo de hoy después (posición serial: lo primero se ve y se recuerda).
 * - «Hechas 2 de 5» y la barra muestran lo que falta (efecto Zeigarnik: lo inconcluso empuja a terminar).
 * - Sólo el día: lo de mañana se ve en Alquileres (ley de Parkinson: un plazo corto y claro).
 * - Un solo color de acción (azul) y rojo sólo para lo atrasado (atención selectiva).
 */
export default function Today() {
  const { C, s } = useUI();
  const { state } = useInventory();
  const { user } = useAuth();
  const now = useBusinessClock();
  const today = businessDate(now);
  const workingDate = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: BUSINESS_TIME_ZONE,
  }).format(now);
  const plan = useMemo(() => {
    const overdue: ObraCard[] = [],
      due: ObraCard[] = [],
      done: { obra: ObraCard; kind: 'DELIVER' | 'RETIRE' }[] = [];
    let upcoming = 0,
      nextDate = '';
    for (const o of state.obras) {
      const task = rentalTaskForDate(o, today);
      if (task.group === 'overdue') overdue.push(o);
      else if (task.group === 'today') due.push(o);
      else if (task.group === 'upcoming') {
        upcoming++;
        if (!nextDate || (task.date && task.date < nextDate)) nextDate = task.date || '';
      }
      if (o.fechaRetiroEfectiva === today) done.push({ obra: o, kind: 'RETIRE' });
      else if (o.fechaEntregaEfectiva === today) done.push({ obra: o, kind: 'DELIVER' });
    }
    const byDate = (a: ObraCard, b: ObraCard) =>
      (rentalTaskForDate(a, today).date || '').localeCompare(rentalTaskForDate(b, today).date || '');
    overdue.sort(byDate);
    return { overdue, due, done, upcoming, nextDate };
  }, [state.obras, today]);
  const total = plan.overdue.length + plan.due.length + plan.done.length;
  const left = plan.overdue.length + plan.due.length;
  return (
    <Screen
      title="Hoy"
      subtitle={workingDate.charAt(0).toUpperCase() + workingDate.slice(1)}
    >
      <LegacyImport />
      <Progress done={plan.done.length} total={total} left={left} />
      {plan.overdue.length ? (
        <Group title="Atrasadas" tone={C.danger} count={plan.overdue.length}>
          {plan.overdue.map((o, i) => (
            <TaskRow key={o.id} obra={o} today={today} last={i === plan.overdue.length - 1} />
          ))}
        </Group>
      ) : null}
      {plan.due.length ? (
        <Group title="Para hoy" count={plan.due.length}>
          {plan.due.map((o, i) => (
            <TaskRow key={o.id} obra={o} today={today} last={i === plan.due.length - 1} />
          ))}
        </Group>
      ) : null}
      {plan.done.length ? (
        <Group title="Hechas hoy" count={plan.done.length}>
          {plan.done.map(({ obra, kind }, i) => (
            <Pressable
              key={obra.id}
              accessibilityRole="button"
              accessibilityLabel={`Abrir ${obra.clienteNombre}. ${kind === 'DELIVER' ? 'Entregado' : 'Retirado'} hoy`}
              onPress={() => router.push(`/obra/${obra.id}`)}
              style={({ pressed }) => [
                s.row,
                rowStyle(C, i === plan.done.length - 1),
                { backgroundColor: pressed ? C.panel2 : C.panel },
              ]}
            >
              <View style={[dot, { backgroundColor: C.successBackground }]}>
                <Check size={18} color={C.success} strokeWidth={3} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={{ color: C.muted, fontFamily: fonts.medium, fontSize: 16 }}>
                  {obra.clienteNombre}
                </Text>
                <Text style={{ color: C.success, fontFamily: fonts.medium, fontSize: 14 }}>
                  {kind === 'DELIVER' ? 'Entregado' : 'Retirado'}
                </Text>
              </View>
            </Pressable>
          ))}
        </Group>
      ) : null}
      <Setup />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Ver todos los alquileres. ${plan.upcoming} con tareas en los próximos días`}
        onPress={() => router.push('/alquileres')}
        style={({ pressed }) => [
          s.row,
          {
            gap: 12,
            padding: 14,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: C.hairline,
            backgroundColor: pressed ? C.panel2 : C.panel,
          },
        ]}
      >
        <CalendarClock size={22} color={C.muted} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: C.text, fontFamily: fonts.semibold, fontSize: 16 }}>Próximos días</Text>
          <Text style={{ color: C.muted, fontSize: 14, fontFamily: fonts.regular }}>
            {plan.upcoming
              ? `${plan.upcoming} ${plan.upcoming === 1 ? 'tarea' : 'tareas'} · la primera el ${formatShort(plan.nextDate)}`
              : 'Nada programado todavía'}
          </Text>
        </View>
        <ChevronRight size={20} color={C.muted} />
      </Pressable>
      {user?.role === 'ADMIN' ? (
        <Button label="Nuevo alquiler" icon={Plus} variant="secondary" onPress={() => router.push('/obra/nueva')} />
      ) : null}
    </Screen>
  );
}

const dot = { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' } as const;
function rowStyle(C: ReturnType<typeof useUI>['C'], last: boolean) {
  return {
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: last ? 0 : 1,
    borderColor: C.hairline,
  } as const;
}
function formatShort(date: string) {
  if (!date) return '';
  const [y, m, d] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('es-AR', { weekday: 'short', day: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(y!, m! - 1, d!)),
  );
}

/** «Hechas 2 de 5»: el número que falta es el que empuja a seguir. */
function Progress({ done, total, left }: { done: number; total: number; left: number }) {
  const { C } = useUI();
  const ratio = total ? done / total : 0;
  const title = !total
    ? 'Sin entregas ni retiros para hoy'
    : left === 0
      ? '¡Listo! Terminaste lo de hoy'
      : `Falta${left === 1 ? '' : 'n'} ${left} de ${total}`;
  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={total ? `${title}. Hechas ${done} de ${total}.` : title}
      style={{ gap: 10, padding: 16, borderRadius: 16, backgroundColor: C.panel, borderWidth: 1, borderColor: C.hairline }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <Text style={{ color: C.text, fontFamily: fonts.display, fontSize: 24, lineHeight: 28, flexShrink: 1 }}>{title}</Text>
        {total ? (
          <Text style={{ color: C.muted, fontFamily: fonts.medium, fontSize: 14 }}>
            {done} {done === 1 ? 'hecha' : 'hechas'}
          </Text>
        ) : null}
      </View>
      {total ? (
        <View style={{ height: 8, borderRadius: 4, backgroundColor: C.panel2, overflow: 'hidden' }}>
          <View style={{ width: `${Math.max(ratio * 100, done ? 4 : 0)}%`, height: 8, borderRadius: 4, backgroundColor: C.success }} />
        </View>
      ) : (
        <Text style={{ color: C.muted, fontSize: 14, fontFamily: fonts.regular }}>
          Cuando haya algo para entregar o retirar, aparece acá primero.
        </Text>
      )}
    </View>
  );
}

function Group({ title, count, tone, children }: { title: string; count: number; tone?: string; children: React.ReactNode }) {
  const { C } = useUI();
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {tone ? <CircleAlert size={18} color={tone} /> : null}
        <Text accessibilityRole="header" style={{ color: tone || C.text, fontFamily: fonts.display, fontSize: 20, lineHeight: 24 }}>
          {title}
        </Text>
        <Text style={{ color: C.muted, fontFamily: fonts.semibold, fontSize: 14 }}>{count}</Text>
      </View>
      <View style={{ borderRadius: 14, borderWidth: 1, borderColor: tone || C.hairline, overflow: 'hidden', backgroundColor: C.panel }}>
        {children}
      </View>
    </View>
  );
}

function TaskRow({ obra, today, last }: { obra: ObraCard; today: string; last: boolean }) {
  const { C, s } = useUI();
  const task = rentalTaskForDate(obra, today);
  const deliver = task.kind === 'DELIVER';
  const Icon = deliver ? PackagePlus : PackageMinus;
  const late = task.group === 'overdue';
  const verb = deliver ? 'Entregar' : 'Retirar';
  return (
    <View style={[s.row, rowStyle(C, last)]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Abrir ${obra.clienteNombre}`}
        accessibilityHint={`${obra.direccion}, ${obra.localidadBarrio}. ${task.label}.`}
        onPress={() => router.push(`/obra/${obra.id}`)}
        style={({ pressed }) => [s.row, { flex: 1, minWidth: 0, gap: 12, opacity: pressed ? 0.7 : 1 }]}
      >
        <View style={[dot, { backgroundColor: late ? C.dangerBackground : C.panel2 }]}>
          <Icon size={19} color={late ? C.danger : C.text} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={{ color: C.text, fontFamily: fonts.semibold, fontSize: 16 }}>
            {obra.clienteNombre}
          </Text>
          <Text numberOfLines={1} style={{ color: C.muted, fontFamily: fonts.regular, fontSize: 14 }}>
            {obra.direccion}
            {obra.localidadBarrio ? `, ${obra.localidadBarrio}` : ''}
          </Text>
          {late ? (
            <Text style={{ color: C.danger, fontFamily: fonts.semibold, fontSize: 13 }}>{task.label}</Text>
          ) : null}
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${verb} ${obra.clienteNombre}`}
        onPress={() => router.push(`/obra/${obra.id}?accion=${deliver ? 'entrega' : 'retiro'}`)}
        style={({ pressed }) => ({
          minHeight: 40,
          paddingHorizontal: 14,
          borderRadius: 10,
          justifyContent: 'center',
          backgroundColor: C.primary,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Text style={{ color: C.onPrimary, fontFamily: fonts.semibold, fontSize: 15 }}>{verb}</Text>
      </Pressable>
    </View>
  );
}

/**
 * Lista corta para dejar el equipo andando. El primer paso ya viene hecho (crear el equipo):
 * una lista empezada se termina más que una vacía. Desaparece cuando está completa.
 */
function Setup() {
  const { C, s } = useUI();
  const { state } = useInventory();
  const { session, members } = useAuth();
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    if (session)
      api
        .pinStatus(session.code)
        .then((v) => alive && setHasPin(!!v?.hasPin))
        .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [session]);
  const steps = [
    { label: 'Crear el equipo', done: true, go: () => undefined },
    { label: 'Cargar los materiales del depósito', done: state.materiales.length > 0, go: () => router.push('/galpon') },
    { label: 'Sumar a tu equipo', done: members.length > 1, go: () => router.push('/configuracion') },
    { label: 'Elegir responsable con PIN', done: hasPin !== false, go: () => router.push('/configuracion') },
    { label: 'Crear el primer alquiler', done: state.obras.length > 0, go: () => router.push('/obra/nueva') },
  ];
  const doneCount = steps.filter((v) => v.done).length;
  if (doneCount === steps.length) return null;
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text accessibilityRole="header" style={{ color: C.text, fontFamily: fonts.display, fontSize: 20, lineHeight: 24 }}>
          Terminá de configurar
        </Text>
        <Text style={{ color: C.muted, fontFamily: fonts.semibold, fontSize: 14 }}>
          {doneCount} de {steps.length}
        </Text>
      </View>
      <View style={{ borderRadius: 14, borderWidth: 1, borderColor: C.hairline, overflow: 'hidden', backgroundColor: C.panel }}>
        {steps.map((step, i) => (
          <Pressable
            key={step.label}
            accessibilityRole="button"
            accessibilityLabel={`${step.label}${step.done ? ', hecho' : ''}`}
            disabled={step.done}
            onPress={step.go}
            style={({ pressed }) => [s.row, rowStyle(C, i === steps.length - 1), { backgroundColor: pressed ? C.panel2 : C.panel }]}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: step.done ? C.success : 'transparent',
                borderWidth: step.done ? 0 : 2,
                borderColor: C.controlBorder,
              }}
            >
              {step.done ? <Check size={15} color={C.bg} strokeWidth={3.2} /> : null}
            </View>
            <Text
              style={{
                flex: 1,
                color: step.done ? C.muted : C.text,
                fontFamily: step.done ? fonts.regular : fonts.medium,
                fontSize: 15,
                textDecorationLine: step.done ? 'line-through' : 'none',
              }}
            >
              {step.label}
            </Text>
            {step.done ? null : <ChevronRight size={18} color={C.muted} />}
          </Pressable>
        ))}
      </View>
    </View>
  );
}
