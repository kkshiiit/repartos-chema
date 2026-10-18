import React, { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import type { ObraCard } from '../types';
import { Button, Field, useUI } from './ui';
import { FeedbackToggle } from './FeedbackSettings';
import { useFeedback } from '../context/FeedbackContext';
import { parseReminderDate } from '../services/feedback/reminders';
export function RentalReminderPanel({ obra }: { obra: ObraCard }) {
  const feedback = useFeedback(),
    { s } = useUI();
  const [date, setDate] = useState(''),
    [time, setTime] = useState(''),
    [sound, setSound] = useState(false),
    [vibrate, setVibrate] = useState(false),
    [error, setError] = useState('');
  const lock = useRef(false);
  const reminder = feedback.state.reminders[obra.id];
  const final = ['RETIRADO', 'REINGRESADO'].includes(obra.estadoProceso);
  const active = reminder && ['pending', 'scheduled'].includes(reminder.status);
  const save = async () => {
    if (lock.current) return;
    const at = parseReminderDate(date, time);
    if (!at || at.getTime() <= Date.now()) {
      setError('Ingresá una fecha válida (DD/MM/AAAA) y una hora futura (HH:MM).');
      return;
    }
    lock.current = true;
    setError('');
    try {
      await feedback.scheduleReminder(obra, at.toISOString(), sound, vibrate);
    } finally {
      lock.current = false;
    }
  };
  return (
    <View style={s.section}>
      <Text style={s.h2}>Recordatorio de este alquiler</Text>
      <Text style={s.body}>
        Un aviso local, una sola vez. Elegí la fecha y la hora; no se repite automáticamente.
      </Text>
      {!feedback.supported ? (
        <Text style={s.muted}>
          Disponible en la app Android/iOS. La versión web no programa notificaciones.
        </Text>
      ) : (
        <>
          {active && (
            <Text accessibilityLiveRegion="polite" style={s.body}>
              {reminder.status === 'pending'
                ? 'Pendiente de completar la programación: '
                : 'Programado: '}
              {new Date(reminder.at).toLocaleString('es-AR')}. Sonido{' '}
              {reminder.sound ? 'activado' : 'desactivado'}; vibración{' '}
              {reminder.vibrate ? 'activada' : 'desactivada'}.
            </Text>
          )}
          {!!reminder?.reason && <Text style={s.muted}>{reminder.reason}</Text>}
          {!final && (
            <>
              <Field
                label="Fecha del aviso (DD/MM/AAAA)"
                placeholder="DD/MM/AAAA"
                value={date}
                onChangeText={setDate}
                keyboardType="numbers-and-punctuation"
              />
              <Field
                label="Hora del aviso (24 h, HH:MM)"
                placeholder="HH:MM"
                value={time}
                onChangeText={setTime}
                keyboardType="numbers-and-punctuation"
              />
              <FeedbackToggle
                label="Sonido del recordatorio"
                value={sound}
                disabled={feedback.busy}
                onChange={setSound}
              />
              <FeedbackToggle
                label="Vibración del recordatorio"
                value={vibrate}
                disabled={feedback.busy}
                onChange={setVibrate}
              />
              <Text style={s.muted}>
                Se solicitará permiso al activar. Si cambia la fecha de retiro, se cancela este
                aviso y tendrás que elegir una nueva fecha y hora.
              </Text>
              <Button
                label={active ? 'Reemplazar recordatorio' : 'Activar recordatorio'}
                disabled={!feedback.ready}
                loading={feedback.busy}
                onPress={() => {
                  void save();
                }}
              />
            </>
          )}
          {active && (
            <Button
              label="Desactivar recordatorio"
              variant="secondary"
              loading={feedback.busy}
              onPress={() => {
                void feedback.cancelReminder(obra.id);
              }}
            />
          )}
          {!!(error || feedback.error) && (
            <Text accessibilityRole="alert" style={s.error}>
              {error || feedback.error}
            </Text>
          )}
          {!!feedback.error && (
            <Button
              label="Reintentar programación o cancelación"
              variant="secondary"
              loading={feedback.busy}
              onPress={() => {
                void feedback.retry();
              }}
            />
          )}
        </>
      )}
    </View>
  );
}
