import { userError } from '../services/errors';
import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { Button, Field, Notice, Sheet, useUI } from './ui';
import { quantity, MAX_QUANTITY } from '../domain/rules';
import { haptic } from '../hooks/useHaptics';
export function SmartCounter({
  value,
  onChange,
  label = 'Cantidad',
  max = MAX_QUANTITY,
}: {
  value: number;
  onChange: (n: number) => void;
  label?: string;
  max?: number;
}) {
  const { C, s } = useUI();
  const [open, setOpen] = useState(false),
    [draft, setDraft] = useState(''),
    [error, setError] = useState('');
  const set = (n: number) => {
    if (n >= 0 && n <= max) {
      onChange(n);
      haptic();
    }
  };
  return (
    <>
      <View
        style={[
          s.row,
          {
            gap: 0,
            borderWidth: 1,
            borderColor: C.line,
            borderRadius: 10,
            overflow: 'hidden',
            alignSelf: 'flex-start',
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Reducir ${label}`}
          disabled={value === 0}
          onPress={() => set(value - 1)}
          style={{ padding: 14, opacity: value === 0 ? 0.35 : 1 }}
        >
          <Minus size={18} color={C.text} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Editar ${label}: ${value}`}
          onPress={() => {
            setDraft(String(value));
            setError('');
            setOpen(true);
          }}
          style={{
            minWidth: 56,
            minHeight: 46,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: C.bg,
          }}
        >
          <Text style={{ fontSize: 21, fontWeight: '800', color: C.text }}>{value}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Aumentar ${label}`}
          disabled={value >= max}
          onPress={() => set(value + 1)}
          style={{ padding: 14, opacity: value >= max ? 0.35 : 1 }}
        >
          <Plus size={18} color={C.text} />
        </Pressable>
      </View>
      <Sheet visible={open} title={label} onClose={() => setOpen(false)}>
        <Field
          label="Cantidad entera"
          keyboardType="number-pad"
          autoFocus
          value={draft}
          onChangeText={setDraft}
        />
        {error ? <Notice text={error} tone="error" /> : null}
        <Button
          label="Aplicar"
          onPress={() => {
            try {
              if (!/^\d+$/.test(draft)) throw new Error('Escribe un entero no negativo.');
              const n = quantity(Number(draft));
              if (n > max) throw new Error(`Máximo ${max}.`);
              set(n);
              setOpen(false);
            } catch (e) {
              setError(userError(e));
            }
          }}
        />
        <Button label="Cancelar" variant="ghost" onPress={() => setOpen(false)} />
      </Sheet>
    </>
  );
}
