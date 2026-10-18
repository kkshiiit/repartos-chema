import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useUI } from './ui';

export function ToolGroup({ title, children }: { title?: string; children: React.ReactNode }) {
  const { C, s } = useUI();
  return (
    <View style={{ gap: 8 }}>
      {title ? (
        <Text accessibilityRole="header" style={s.h2}>
          {title}
        </Text>
      ) : null}
      <View style={{ backgroundColor: C.panel, borderRadius: 16, paddingHorizontal: 16 }}>
        {children}
      </View>
    </View>
  );
}

export function ToolRow({
  label,
  detail,
  value,
  icon: Icon,
  onPress,
  last = false,
}: {
  label: string;
  detail?: string;
  value?: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  onPress: () => void;
  last?: boolean;
}) {
  const { C, s } = useUI();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={detail}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 64,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: C.hairline,
        backgroundColor: pressed ? C.selection : 'transparent',
      })}
    >
      <Icon size={24} color={C.muted} />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text style={s.body}>{label}</Text>
        {detail ? <Text style={s.muted}>{detail}</Text> : null}
      </View>
      {value ? <Text style={[s.muted, { flexShrink: 1, textAlign: 'right' }]}>{value}</Text> : null}
      <ChevronRight size={20} color={C.muted} />
    </Pressable>
  );
}
