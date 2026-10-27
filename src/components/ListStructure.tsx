import React from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { Search, SlidersHorizontal } from 'lucide-react-native';
import { IconButton, useUI } from './ui';

/** One integrated toolbar shared by operational lists. Filters live in a panel. */
export function SearchToolbar({
  label,
  value,
  onChange,
  placeholder,
  filterLabel = 'Filtros',
  onFilter,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  filterLabel?: string;
  onFilter: () => void;
}) {
  const { C, s } = useUI();
  return (
    <View style={[s.row, { gap: 8 }]}>
      <View style={[s.input, s.row, s.grow, { paddingVertical: 0, gap: 8 }]}>
        <Search size={18} color={C.muted} />
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={C.muted}
          style={{ flex: 1, minWidth: 0, minHeight: 48, color: C.text, fontSize: 16 }}
        />
      </View>
      <IconButton label={filterLabel} icon={SlidersHorizontal} onPress={onFilter} />
    </View>
  );
}
export function SectionHeading({ title, count }: { title: string; count?: number }) {
  const { s, C } = useUI();
  return (
    <View style={[s.row, { paddingTop: 8, paddingBottom: 8, justifyContent: 'space-between' }]}>
      <Text accessibilityRole="header" style={[s.label, s.grow]}>
        {title}
      </Text>
      {count !== undefined ? <Text style={[s.muted, { color: C.muted }]}>{count}</Text> : null}
    </View>
  );
}
export function Segmented({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const { C, s } = useUI();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: C.panel2, padding: 4, borderRadius: 12 }}>
      {options.map((option) => (
        <Pressable
          key={option.value}
          accessibilityRole="button"
          accessibilityLabel={option.label}
          accessibilityState={{ selected: value === option.value }}
          aria-pressed={value === option.value}
          onPress={() => onChange(option.value)}
          style={({ pressed }) => ({
            flex: 1,
            minWidth: 0,
            minHeight: 48,
            paddingVertical: 10,
            paddingHorizontal: 4,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor:
              value === option.value ? C.panel : pressed ? C.selection : 'transparent',
          })}
        >
          <Text
            style={[
              s.label,
              {
                maxWidth: '100%',
                alignSelf: 'stretch',
                textAlign: 'center',
                color: value === option.value ? C.link : C.text,
              },
            ]}
          >
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
