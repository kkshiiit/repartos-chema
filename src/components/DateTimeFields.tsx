import React, { useEffect, useId, useRef, useState } from 'react';
import { radius } from '../theme/tokens';
import { usePanelChanges, useUI } from './ui';
import {
  type DateTimeFieldProps,
  type PickerMode,
  displayPickerValue,
  isPickerValue,
  serializePickerDraft,
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
  const { C } = useUI();
  const { markDirty } = usePanelChanges();
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const emitted = useRef<string | null>(null);
  const [manual, setManual] = useState(value !== '' && !isPickerValue(value, mode));
  const valid = isPickerValue(value, mode);
  const errorId = `${id}-error`;
  const change = (next: string, source: 'picker' | 'manual') => {
    if (disabled) return;
    if (next !== value) markDirty();
    emitted.current = source === 'picker' ? next : null;
    onChange(next);
  };

  useEffect(() => {
    // Uncontrolled date/time inputs retain incomplete browser segments. Only an
    // external value change replaces them; echoing onChange must not erase a draft.
    if (emitted.current === value) {
      emitted.current = null;
      return;
    }
    if (input.current) input.current.value = isPickerValue(value, mode) ? value : '';
  }, [value, mode]);

  useEffect(() => {
    // Browsers without date/time inputs fall back to an editable text field.
    if (input.current && input.current.type !== mode) setManual(true);
  }, [mode]);

  const controlStyle: React.CSSProperties = {
    boxSizing: 'border-box',
    width: '100%',
    minWidth: 0,
    minHeight: 48,
    border: `1px solid ${error ? C.danger : C.line}`,
    borderRadius: radius.input,
    backgroundColor: C.panel,
    color: C.text,
    padding: '12px 14px',
    fontSize: 16,
    fontFamily: 'inherit',
    colorScheme: C.background === '#121A22' ? 'dark' : 'light',
    opacity: disabled ? 0.5 : 1,
    accentColor: C.primary,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
      <label
        htmlFor={manual ? `${id}-manual` : id}
        style={{ color: C.text, fontSize: 14, fontWeight: 600 }}
      >
        {label}
      </label>
      <input
        ref={input}
        id={id}
        type={mode}
        hidden={manual}
        lang="es-AR"
        defaultValue={valid ? value : ''}
        step={mode === 'time' ? 60 : undefined}
        disabled={disabled}
        aria-label={manual ? undefined : label}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        style={controlStyle}
        onChange={(event) => {
          const control = event.currentTarget;
          if (control.validity.badInput) {
            // Incomplete segments stay visible in the browser, while the form
            // becomes invalid so it cannot accidentally save the previous date.
            change('', 'picker');
          } else if (control.value === '' || isPickerValue(control.value, mode)) {
            change(control.value, 'picker');
          }
        }}
      />
      {manual ? (
        <input
          id={`${id}-manual`}
          type="text"
          inputMode="text"
          placeholder={mode === 'date' ? 'DD/MM/AAAA' : 'HH:mm'}
          value={displayPickerValue(value, mode)}
          maxLength={mode === 'date' ? 10 : 5}
          disabled={disabled}
          aria-label={label}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          style={controlStyle}
          onChange={(event) =>
            change(serializePickerDraft(event.currentTarget.value, mode), 'manual')
          }
        />
      ) : value && !valid ? (
        <span style={{ color: C.muted, fontSize: 14 }}>
          Borrador: {displayPickerValue(value, mode)}
        </span>
      ) : null}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setManual((previous) => !previous)}
        style={{
          alignSelf: 'flex-start',
          minHeight: 48,
          padding: '8px 0',
          border: 0,
          background: 'transparent',
          color: C.link,
          fontSize: 14,
          fontFamily: 'inherit',
          cursor: disabled ? 'default' : 'pointer',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {manual
          ? mode === 'date'
            ? 'Usar calendario'
            : 'Usar reloj'
          : mode === 'date'
            ? 'Escribir fecha'
            : 'Escribir hora'}
      </button>
      {error ? (
        <span id={errorId} role="alert" style={{ color: C.danger, fontSize: 14 }}>
          {error}
        </span>
      ) : null}
    </div>
  );
}

export function CalendarField(props: DateTimeFieldProps) {
  return <DateTimeField {...props} mode="date" />;
}

export function TimeField(props: DateTimeFieldProps) {
  return <DateTimeField {...props} mode="time" />;
}
