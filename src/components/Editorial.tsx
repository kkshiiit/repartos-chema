import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useUI } from './ui';
/** Secondary sections keep their children mounted so opening a panel never resets a draft. */
export function Disclosure({
  title,
  children,
  initiallyOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  initiallyOpen?: boolean;
}) {
  const { C, s } = useUI();
  const [open, setOpen] = useState(initiallyOpen);
  const Icon = open ? ChevronUp : ChevronDown;
  return (
    <View style={[s.card, { gap: open ? 16 : 0 }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(!open)}
        style={[s.row, { minHeight: 48, justifyContent: 'space-between' }]}
      >
        <Text style={[s.h2, s.grow]}>{title}</Text>
        <Icon size={20} color={C.muted} />
      </Pressable>
      <View style={{ display: open ? 'flex' : 'none', gap: 16 }}>{children}</View>
    </View>
  );
}
