import { fonts } from '../theme/tokens';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useUI } from './ui';
/** Secondary sections keep their children mounted so opening a panel never resets a draft. */
export function Disclosure({
  title,
  children,
  initiallyOpen = false,
  compact = false,
  icon: Lead,
  detail,
}: {
  title: string;
  children: React.ReactNode;
  initiallyOpen?: boolean;
  compact?: boolean;
  /** Ícono a la izquierda y una línea de resumen visible aun cerrado («3 fotos», «Sin faltantes»). */
  icon?: React.ComponentType<{ size: number; color: string }>;
  detail?: string;
}) {
  const { C, s } = useUI();
  const [open, setOpen] = useState(initiallyOpen);
  const Icon = open ? ChevronUp : ChevronDown;
  return (
    <View style={[compact ? undefined : s.card, { gap: open ? (compact ? 12 : 16) : 0 }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ expanded: open }}
        aria-expanded={open}
        onPress={() => setOpen(!open)}
        style={[s.row, { minHeight: 48, justifyContent: 'space-between', gap: 12 }]}
      >
        {Lead ? <Lead size={22} color={C.accent} /> : null}
        <View style={s.grow}>
          <Text style={Lead ? [s.body, { fontFamily: fonts.semibold }] : compact ? s.label : s.h2}>{title}</Text>
          {detail ? <Text style={s.muted}>{detail}</Text> : null}
        </View>
        <Icon size={20} color={C.muted} />
      </Pressable>
      <View style={{ display: open ? 'flex' : 'none', gap: compact ? 12 : 16 }}>{children}</View>
    </View>
  );
}
