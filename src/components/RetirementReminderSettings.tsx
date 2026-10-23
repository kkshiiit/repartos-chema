import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { useFeedback } from '../context/FeedbackContext';
import type { Reminder, RetirementPolicy } from '../services/feedback/reminders';
import { Button, Notice, usePanelChanges, useUI } from './ui';
import { TimeField } from './DateTimeFields';
import { FeedbackToggle } from './FeedbackSettings';

const offsets = [3, 2, 1, 0];
const offsetLabel = (value: number) =>
  value === 0 ? 'El mismo día' : `${value} ${value === 1 ? 'día' : 'días'} antes`;
export const validReminderTime = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

export function retirementPolicySummary(policy: Pick<RetirementPolicy, 'offsets' | 'time'>) {
  const days = [...policy.offsets].filter((day) => day > 0).sort((a, b) => b - a);
  const before = days.length
    ? `${days.join(', ')} ${days[days.length - 1] === 1 ? 'día' : 'días'} antes`
    : '';
  const sameDay = policy.offsets.includes(0);
  const description = before
    ? `${before}${sameDay ? ' y el mismo día' : ''}`
    : sameDay
      ? 'El mismo día'
      : 'Sin días seleccionados';
  return `${description} · ${policy.time}`;
}

export function RetirementPolicyFields({
  policy,
  onChange,
  disabled = false,
}: {
  policy: RetirementPolicy;
  onChange: (policy: RetirementPolicy) => void;
  disabled?: boolean;
}) {
  const { C, s } = useUI();
  const panel = usePanelChanges();
  const change = (next: RetirementPolicy) => {
    panel.markDirty();
    onChange(next);
  };
  return (
    <>
      <TimeField
        label="Horario de los avisos"
        value={policy.time}
        onChange={(time) => change({ ...policy, time })}
        disabled={disabled}
        error={validReminderTime(policy.time) ? undefined : 'Elegí una hora válida (HH:MM).'}
      />
      <Text style={s.label}>Cuándo avisar</Text>
      <View style={s.wrap}>
        {offsets.map((offset) => {
          const selected = policy.offsets.includes(offset);
          return (
            <Pressable
              key={offset}
              accessibilityRole="checkbox"
              accessibilityLabel={offsetLabel(offset)}
              accessibilityState={{ checked: selected, disabled }}
              disabled={disabled}
              onPress={() =>
                change({
                  ...policy,
                  offsets: selected
                    ? policy.offsets.filter((value) => value !== offset)
                    : [...policy.offsets, offset].sort((a, b) => b - a),
                })
              }
              style={{
                minHeight: 48,
                maxWidth: '100%',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 13,
                paddingVertical: 10,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: selected ? C.accent : C.hairline,
                backgroundColor: selected ? C.selection : C.panel,
                opacity: disabled ? 0.6 : 1,
              }}
            >
              {selected ? <Check size={15} color={C.selectionText} /> : null}
              <Text
                style={[s.body, { flexShrink: 1, color: selected ? C.selectionText : C.muted }]}
              >
                {offsetLabel(offset)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {!policy.offsets.length ? (
        <Text style={s.muted}>Elegí al menos un día para solicitar avisos.</Text>
      ) : null}
      <Text style={s.muted}>Hora de Buenos Aires. Solo se programan horarios futuros.</Text>
    </>
  );
}

export function ReminderStatusList({
  reminders,
  supported,
}: {
  reminders: Reminder[];
  supported: boolean;
}) {
  const { s } = useUI();
  if (!reminders.length) return null;
  return (
    <View accessibilityLiveRegion="polite" style={{ gap: 10 }}>
      {[...reminders]
        .sort((a, b) => Date.parse(a.at) - Date.parse(b.at))
        .map((reminder) => {
          const date = new Date(reminder.at).toLocaleString('es-AR', {
            timeZone: 'America/Argentina/Buenos_Aires',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
          const label = reminder.cancellationPending
            ? 'Cancelación pendiente'
            : reminder.status === 'scheduled'
              ? supported
                ? 'Programado'
                : 'Registrado como programado en la app'
              : reminder.status === 'pending'
                ? 'Pendiente de programación · no activo'
                : reminder.status === 'elapsed'
                  ? 'Horario pasado'
                  : 'Cancelado';
          return (
            <View key={`${reminder.obraId}:${reminder.offset ?? 'manual'}`} style={{ gap: 3 }}>
              <Text style={s.body}>
                {label} · {date}
              </Text>
              {reminder.reason ? <Text style={s.muted}>{reminder.reason}</Text> : null}
            </View>
          );
        })}
    </View>
  );
}

function GeneralReminderEditor() {
  const feedback = useFeedback();
  const { s } = useUI();
  const panel = usePanelChanges();
  const [draft, setDraft] = useState<RetirementPolicy>(() => ({
    ...feedback.state.globalPolicy,
    offsets: [...feedback.state.globalPolicy.offsets],
  }));
  const [localError, setLocalError] = useState('');
  const lock = useRef(false);
  const saved = feedback.state.globalPolicy;
  const reminders = Object.values(feedback.state.reminders).filter((reminder) => {
    const policy = feedback.state.rentalPolicies[reminder.obraId];
    return reminder.offset !== undefined && (!policy || policy.mode === 'general');
  });
  const scheduled = reminders.filter(
    (reminder) => reminder.status === 'scheduled' && !reminder.cancellationPending,
  ).length;
  const pending = reminders.filter(
    (reminder) => reminder.status === 'pending' || reminder.cancellationPending,
  ).length;
  const changed =
    draft.time !== saved.time ||
    [...draft.offsets].sort().join(',') !== [...saved.offsets].sort().join(',');
  const valid = validReminderTime(draft.time);
  const resetDirty = panel.resetDirty;
  useEffect(() => {
    if (!changed) resetDirty();
  }, [changed, saved.enabled, resetDirty]);
  const save = async (enabled: boolean) => {
    if (lock.current || feedback.busy) return;
    if (enabled && (!valid || !draft.offsets.length)) return;
    lock.current = true;
    setLocalError('');
    try {
      const next = { ...draft, enabled, time: valid ? draft.time : saved.time };
      if (await feedback.configureGeneral(next)) {
        if (valid) {
          setDraft(next);
          panel.resetDirty();
        } else {
          panel.markDirty();
        }
      }
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'No se pudieron guardar los avisos.');
    } finally {
      lock.current = false;
    }
  };
  return (
    <>
      <Text style={s.body}>
        Configuración general para los alquileres que la usan. Los avisos siguen la fecha estimada
        de retiro y se actualizan cuando cambia.
      </Text>
      <Text style={s.muted}>{retirementPolicySummary(saved)}</Text>
      {!feedback.supported ? (
        <Notice text="La versión web no programa notificaciones nativas. Podés consultar y guardar las preferencias; para recibir avisos, configurálos en la app Android/iOS." />
      ) : null}
      <RetirementPolicyFields policy={draft} onChange={setDraft} disabled={feedback.busy} />
      <FeedbackToggle
        label="Solicitar avisos de retiro"
        value={saved.enabled}
        disabled={feedback.busy || (!saved.enabled && (!valid || !draft.offsets.length))}
        onChange={(enabled) => {
          void save(enabled);
        }}
      />
      <Text style={s.muted}>
        El permiso se solicita al activar. Esta preferencia no confirma que el sistema haya
        programado los avisos.
      </Text>
      <Button
        label="Guardar horario y días"
        variant="secondary"
        disabled={!changed || !valid || (saved.enabled && !draft.offsets.length)}
        loading={feedback.busy}
        onPress={() => save(saved.enabled)}
      />
      <Text accessibilityLiveRegion="polite" style={s.body}>
        {!feedback.supported
          ? 'Sin avisos activos en este navegador.'
          : scheduled
            ? `${scheduled} ${scheduled === 1 ? 'aviso programado' : 'avisos programados'}${pending ? ` · ${pending} pendientes` : ''}.`
            : pending
              ? `Hay ${pending} cambios de programación o cancelación pendientes de completar.`
              : saved.enabled
                ? 'Sin avisos programados. No hay horarios futuros disponibles o falta completar la programación.'
                : 'Solicitud general desactivada.'}
      </Text>
      {localError || feedback.error || pending ? (
        <>
          {localError || feedback.error ? (
            <Notice text={localError || feedback.error} tone="error" />
          ) : null}
          <Button
            label="Reintentar avisos de retiro"
            variant="secondary"
            loading={feedback.busy}
            onPress={async () => {
              setLocalError('');
              await feedback.retry();
            }}
          />
        </>
      ) : null}
    </>
  );
}

export function RetirementReminderSettings() {
  const feedback = useFeedback();
  const { s } = useUI();
  return (
    <View style={s.section}>
      <Text accessibilityRole="header" style={s.h2}>
        Avisos de retiro
      </Text>
      {feedback.ready ? (
        <GeneralReminderEditor />
      ) : (
        <Text accessibilityLiveRegion="polite" style={s.muted}>
          Cargando configuración de avisos…
        </Text>
      )}
    </View>
  );
}
