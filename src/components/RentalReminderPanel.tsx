import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import type { ObraCard } from '../types';
import type { RentalReminderPolicy, RetirementPolicy } from '../services/feedback/reminders';
import { useFeedback } from '../context/FeedbackContext';
import { Button, Notice, Sheet, usePanelChanges, useUI } from './ui';
import { FeedbackToggle } from './FeedbackSettings';
import {
  ReminderStatusList,
  RetirementPolicyFields,
  retirementPolicySummary,
  validReminderTime,
} from './RetirementReminderSettings';

function RentalPolicyEditor({
  obraId,
  initial,
  onSaved,
}: {
  obraId: string;
  initial: RetirementPolicy;
  onSaved: () => void;
}) {
  const feedback = useFeedback();
  const { s } = useUI();
  const panel = usePanelChanges();
  const [draft, setDraft] = useState<RetirementPolicy>(() => ({
    ...initial,
    offsets: [...initial.offsets],
  }));
  const [localError, setLocalError] = useState('');
  const lock = useRef(false);
  const saved = feedback.state.rentalPolicies[obraId];
  const matchesSaved =
    saved?.mode === 'custom' &&
    saved.enabled === draft.enabled &&
    saved.time === draft.time &&
    [...saved.offsets].sort().join(',') === [...draft.offsets].sort().join(',');
  const resetDirty = panel.resetDirty;
  useEffect(() => {
    if (matchesSaved) resetDirty();
  }, [matchesSaved, resetDirty]);
  const save = async () => {
    if (lock.current || feedback.busy) return;
    lock.current = true;
    setLocalError('');
    try {
      if (await feedback.configureRental(obraId, { mode: 'custom', ...draft })) {
        panel.resetDirty();
        onSaved();
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
        Estos ajustes se guardan solo para este alquiler. Se conservan cuando cambia la
        configuración general y siguen su fecha estimada de retiro.
      </Text>
      {!feedback.supported ? (
        <Notice text="La versión web permite consultar y guardar preferencias, pero no programa notificaciones nativas. Para recibir avisos, configurálos en la app Android/iOS." />
      ) : null}
      <RetirementPolicyFields policy={draft} onChange={setDraft} disabled={feedback.busy} />
      <FeedbackToggle
        label="Solicitar avisos para este alquiler"
        value={draft.enabled}
        disabled={feedback.busy || (!draft.enabled && !draft.offsets.length)}
        onChange={(enabled) => {
          panel.markDirty();
          setDraft({ ...draft, enabled });
        }}
      />
      <Text style={s.muted}>
        Al guardar con los avisos solicitados se pedirá permiso. Solo el estado Programado confirma
        que el aviso quedó registrado en el sistema.
      </Text>
      <Button
        label="Guardar avisos del alquiler"
        loading={feedback.busy}
        disabled={!validReminderTime(draft.time) || (draft.enabled && !draft.offsets.length)}
        onPress={save}
      />
      {localError || feedback.error ? (
        <>
          <Notice text={localError || feedback.error} tone="error" />
          {matchesSaved ? (
            <Text style={s.muted}>
              La preferencia quedó guardada; hay cambios de programación o cancelación pendientes.
              Cerrar este panel no desactiva la solicitud.
            </Text>
          ) : null}
        </>
      ) : null}
    </>
  );
}

export function RentalReminderPanel({ obra }: { obra: ObraCard }) {
  const feedback = useFeedback();
  const { s } = useUI();
  const [editing, setEditing] = useState(false);
  const [localError, setLocalError] = useState('');
  const policy: RentalReminderPolicy = feedback.state.rentalPolicies[obra.id] ?? {
    mode: 'general',
  };
  const effective = policy.mode === 'custom' ? policy : feedback.state.globalPolicy;
  const reminders = Object.values(feedback.state.reminders).filter(
    (reminder) => reminder.obraId === obra.id,
  );
  const legacy = policy.mode === 'legacy';
  const final = ['RETIRADO', 'REINGRESADO'].includes(obra.estadoProceso);
  const scheduled = reminders.filter(
    (reminder) => reminder.status === 'scheduled' && !reminder.cancellationPending,
  ).length;
  const pending = reminders.some(
    (reminder) => reminder.status === 'pending' || reminder.cancellationPending,
  );
  const useGeneral = async () => {
    setLocalError('');
    try {
      await feedback.configureRental(obra.id, { mode: 'general' });
    } catch (error) {
      setLocalError(
        error instanceof Error ? error.message : 'No se pudo usar la configuración general.',
      );
    }
  };
  return (
    <View style={s.section}>
      <Text accessibilityRole="header" style={s.h2}>
        Avisos de este alquiler
      </Text>
      {!feedback.ready ? (
        <Text accessibilityLiveRegion="polite" style={s.muted}>
          Cargando recordatorios…
        </Text>
      ) : (
        <>
          <Text style={s.body}>
            {legacy
              ? 'Aviso anterior conservado'
              : policy.mode === 'custom'
                ? 'Configuración personalizada'
                : 'Usa la configuración general'}
          </Text>
          {legacy ? (
            <Text style={s.muted}>
              Se conserva el aviso manual anterior. Al pasar a la configuración general o
              personalizada, se cancela antes de programar los nuevos avisos.
            </Text>
          ) : (
            <>
              <Text style={s.body}>{retirementPolicySummary(effective)}</Text>
              <Text style={s.muted}>
                {policy.mode === 'general'
                  ? 'Los cambios generales también se aplican a este alquiler.'
                  : 'Los cambios generales no reemplazan estos ajustes.'}
              </Text>
              <Text accessibilityLiveRegion="polite" style={s.body}>
                {!feedback.supported
                  ? 'Sin avisos activos en este navegador.'
                  : scheduled
                    ? `${scheduled} ${scheduled === 1 ? 'aviso programado' : 'avisos programados'}${pending ? ' · hay avisos pendientes' : ''}.`
                    : pending
                      ? 'Hay cambios de programación o cancelación pendientes de completar.'
                      : final
                        ? 'Alquiler finalizado. No se programan nuevos avisos.'
                        : effective.enabled
                          ? 'Sin avisos programados para horarios futuros.'
                          : 'Solicitud de avisos desactivada.'}
              </Text>
            </>
          )}
          {!feedback.supported ? (
            <Text style={s.muted}>
              La versión web no programa notificaciones nativas. Podés consultar y guardar las
              preferencias; para recibir avisos, configurálos en la app Android/iOS.
            </Text>
          ) : null}
          <ReminderStatusList reminders={reminders} supported={feedback.supported} />
          {!final ? (
            <>
              <Button
                label={
                  policy.mode === 'custom' ? 'Editar avisos personalizados' : 'Personalizar avisos'
                }
                variant="secondary"
                disabled={feedback.busy}
                onPress={() => {
                  setLocalError('');
                  setEditing(true);
                }}
              />
              {policy.mode !== 'general' ? (
                <Button
                  label="Usar configuración general"
                  variant="secondary"
                  loading={feedback.busy}
                  onPress={useGeneral}
                />
              ) : null}
            </>
          ) : null}
          {legacy &&
          reminders.some(
            (reminder) =>
              reminder.offset === undefined &&
              (reminder.status === 'scheduled' || reminder.status === 'pending'),
          ) ? (
            <Button
              label="Desactivar aviso anterior"
              variant="secondary"
              loading={feedback.busy}
              onPress={async () => {
                await feedback.cancelReminder(obra.id);
              }}
            />
          ) : null}
          {localError || feedback.error || pending ? (
            <>
              {localError || feedback.error ? (
                <Notice text={localError || feedback.error} tone="error" />
              ) : null}
              <Button
                label="Reintentar programación o cancelación"
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
      )}
      <Sheet
        visible={editing}
        title="Avisos personalizados"
        onClose={() => setEditing(false)}
        busy={feedback.busy}
        protectChanges
      >
        {editing ? (
          <RentalPolicyEditor
            obraId={obra.id}
            initial={effective}
            onSaved={() => setEditing(false)}
          />
        ) : null}
      </Sheet>
    </View>
  );
}
