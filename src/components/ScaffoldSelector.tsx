import React, { useState } from 'react';
import { View } from 'react-native';
import { Chip, Field, useUI, usePanelChanges } from './ui';
export function ScaffoldSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const { s } = useUI();
  const { markDirty } = usePanelChanges();
  const [custom, setCustom] = useState(
    !['70cm', '80cm', '90cm', '1.30m', '1.50m', '2.00m', ''].includes(value),
  );
  return (
    <View style={{ gap: 10 }}>
      <View style={s.wrap}>
        {['70cm', '80cm', '90cm', '1.30m', '1.50m', '2.00m'].map((m) => (
          <Chip
            key={m}
            label={m}
            selected={value === m}
            onPress={() => {
              markDirty();
              onChange(m);
              setCustom(false);
            }}
          />
        ))}
        <Chip label="Otra medida" selected={custom} onPress={() => setCustom(true)} />
      </View>
      {custom ? (
        <Field
          label="Medida personalizada"
          value={value}
          maxLength={30}
          onChangeText={onChange}
          placeholder="Ej. 1.80m"
        />
      ) : null}
    </View>
  );
}
