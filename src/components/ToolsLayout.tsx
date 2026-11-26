import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useUI } from './ui';
import { fonts } from '../theme/tokens';

export function ToolGroup({ title, children }: { title?: string; children: React.ReactNode }) {
  const { C } = useUI();
  return (
    <View style={{ gap: 8 }}>
      {title ? (
        <Text accessibilityRole="header" style={{ color: C.muted, fontFamily: fonts.semibold, fontSize: 15, paddingLeft: 4 }}>
          {title}
        </Text>
      ) : null}
      <View style={{ backgroundColor: C.panel, borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: C.hairline }}>
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
        backgroundColor: pressed ? C.panel2 : 'transparent',
      })}
    >
      <Icon size={22} color={C.accent} />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text style={[s.body, { fontFamily: fonts.medium }]}>{label}</Text>
        {detail ? <Text style={s.muted}>{detail}</Text> : null}
      </View>
      {value ? <Text style={[s.muted, { flexShrink: 1, textAlign: 'right' }]}>{value}</Text> : null}
      <ChevronRight size={20} color={C.muted} />
    </Pressable>
  );
}
