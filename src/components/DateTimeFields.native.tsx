import React, { useId, useRef, useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { BUSINESS_TIME_ZONE } from '../utils/retirementCalendar';
import { Button, Sheet, usePanelChanges, useUI } from './ui';
import {
  type DateTimeFieldProps,
  type PickerMode,
  displayPickerValue,
  pickerAnchor,
  serializePickerDraft,
  serializePickerSelection,
} from './DateTimeFields.shared';

export type { DateTimeFieldProps } from './DateTimeFields.shared';

function DateTimeField({
  label,
  value,
  onChange,
  error,
  disabled = false,
  mode,
}: DateTimeFieldProps & { mode: PickerMode }) {
  const { C, s } = useUI();
  const { markDirty } = usePanelChanges();
  const id = useId();
  const [manual, setManual] = useState(Platform.OS !== 'android' && Platform.OS !== 'ios');
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState<Date | null>(null);
  const opening = useRef(false);
  const change = (next: string) => {
    if (disabled) return;
    if (next !== value) markDirty();
    onChange(next);
  };
  const selected = (date: Date) => {
    const next = serializePickerSelection(date, mode);
    if (next === null) setManual(true);
    else change(next);
  };
  const open = () => {
    if (disabled || opening.current) return;
    const anchor = pickerAnchor(value, mode);
    if (Platform.OS === 'android') {
      opening.current = true;
      try {
        DateTimePickerAndroid.open({
          value: anchor,
          mode,
          display: 'default',
          timeZoneName: BUSINESS_TIME_ZONE,
          is24Hour: true,
          positiveButton: { label: 'Elegir', textColor: C.primary },
          negativeButton: { label: 'Cancelar' },
          onValueChange: (_event, date) => {
            opening.current = false;
            selected(date);
          },
          onDismiss: () => {
            opening.current = false;
          },
          onError: () => {
            opening.current = false;
            setManual(true);
          },
        });
      } catch {
        opening.current = false;
        setManual(true);
      }
    } else if (Platform.OS === 'ios') {
      setDraft(anchor);
      setVisible(true);
    } else {
      setManual(true);
    }
  };

  return (
    <View style={{ gap: 8 }}>
      <Text nativeID={`${id}-label`} style={s.label}>
        {label}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ? displayPickerValue(value, mode) : mode === 'date' ? 'Elegir fecha' : 'Elegir hora'}`}
        accessibilityHint={mode === 'date' ? 'Abrir calendario' : 'Abrir reloj'}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={open}
        style={[
          s.input,
          {
            justifyContent: 'center',
            borderColor: error ? C.danger : C.line,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        <Text style={{ color: value ? C.text : C.subtle, fontSize: 16 }}>
          {value
            ? displayPickerValue(value, mode)
            : mode === 'date'
              ? 'Elegir fecha'
              : 'Elegir hora'}
        </Text>
      </Pressable>
      {manual ? (
        <TextInput
          accessibilityLabel={`${label} · escribir ${mode === 'date' ? 'fecha' : 'hora'}`}
          accessibilityHint={mode === 'date' ? 'Formato día, mes y año' : 'Formato de 24 horas'}
          value={displayPickerValue(value, mode)}
          onChangeText={(next) => change(serializePickerDraft(next, mode))}
          placeholder={mode === 'date' ? 'DD/MM/AAAA' : 'HH:mm'}
          placeholderTextColor={C.subtle}
          maxLength={mode === 'date' ? 10 : 5}
          keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
          autoCorrect={false}
          autoCapitalize="none"
          editable={!disabled}
          style={[s.input, { borderColor: error ? C.danger : C.line }]}
        />
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={() => setManual((previous) => !previous)}
        style={{
          minHeight: 48,
          justifyContent: 'center',
          alignSelf: 'flex-start',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <Text style={{ color: C.link, fontSize: 14 }}>
          {manual ? 'Ocultar escritura' : mode === 'date' ? 'Escribir fecha' : 'Escribir hora'}
        </Text>
      </Pressable>
      {error ? (
        <Text accessibilityRole="alert" style={s.error}>
          {error}
        </Text>
      ) : null}
      <Sheet visible={visible} title={label} onClose={() => setVisible(false)}>
        {visible && draft ? (
          <DateTimePicker
            value={draft}
            mode={mode}
            display="spinner"
            locale="es-AR"
            timeZoneName={BUSINESS_TIME_ZONE}
            themeVariant={C.background === '#121A22' ? 'dark' : 'light'}
            textColor={C.text}
            disabled={disabled}
            onValueChange={(_event, date) => setDraft(date)}
            onDismiss={() => setVisible(false)}
          />
        ) : null}
        <Button
          label="Elegir"
          disabled={disabled}
          onPress={() => {
            if (draft) selected(draft);
            setVisible(false);
          }}
        />
        <Button label="Cancelar" variant="secondary" onPress={() => setVisible(false)} />
      </Sheet>
    </View>
  );
}

export function CalendarField(props: DateTimeFieldProps) {
  return <DateTimeField {...props} mode="date" />;
}

export function TimeField(props: DateTimeFieldProps) {
  return <DateTimeField {...props} mode="time" />;
}
