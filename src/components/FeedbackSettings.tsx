import React from 'react';
import { Switch, Text, View } from 'react-native';
import { Button, useUI } from './ui';
import { useFeedback } from '../context/FeedbackContext';
export function FeedbackToggle({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  const { C, s } = useUI();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 }}>
      <Text style={[s.body, { flex: 1 }]}>{label}</Text>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: C.line, true: C.primary }}
      />
    </View>
  );
}
export function FeedbackSettings() {
  const feedback = useFeedback(),
    { s } = useUI();
  const p = feedback.state.preferences;
  return (
    <View style={s.section}>
      <Text style={s.h2}>Sonido y avisos locales</Text>
      <Text style={s.body}>
        Las confirmaciones son opcionales y aparecen después de guardar una operación. En Android,
        sonido o vibración de confirmación usan una notificación del sistema que se cierra tras unos
        segundos y requieren permiso al activarlos. Los recordatorios se activan por alquiler, con
        fecha y hora elegidas.
      </Text>
      <FeedbackToggle
        label="Confirmaciones opcionales"
        value={p.confirmations}
        disabled={!feedback.ready || feedback.busy || !feedback.supported}
        onChange={(value) => {
          void feedback.savePreferences({ confirmations: value });
        }}
      />
      <FeedbackToggle
        label="Sonido de confirmación"
        value={p.sound}
        disabled={!p.confirmations || feedback.busy || !feedback.supported}
        onChange={(value) => {
          void feedback.savePreferences({ sound: value });
        }}
      />
      <FeedbackToggle
        label="Vibración de confirmación"
        value={p.vibration}
        disabled={!p.confirmations || feedback.busy || !feedback.supported}
        onChange={(value) => {
          void feedback.savePreferences({ vibration: value });
        }}
      />
      <Text style={s.muted}>
        {feedback.supported
          ? 'Android controla volumen, silencio, No molestar y canales. Los cambios de sonido crean un canal distinto; el sistema conserva los ajustes de cada canal.'
          : 'En web se muestran confirmaciones de texto. No se programan notificaciones ni se reproduce audio automáticamente.'}
      </Text>
      {!!feedback.error && (
        <>
          <Text accessibilityRole="alert" style={s.error}>
            {feedback.error}
          </Text>
          <Button
            label="Reintentar avisos locales"
            variant="secondary"
            loading={feedback.busy}
            onPress={() => {
              void feedback.retry();
            }}
          />
        </>
      )}
    </View>
  );
}
