import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { fonts } from '../theme/tokens';
import { useUI } from './ui';

export interface Stat {
  key: string;
  label: string;
  n: number;
  color: string;
}

/**
 * Tablero de una sola pieza con números grandes: se lee de un vistazo, también al sol.
 * Si recibe `onChange`, cada número es un filtro (tocar de nuevo lo quita).
 */
export function StatBoard({ items, value, onChange }: { items: Stat[]; value?: string; onChange?: (key: string) => void }) {
  const { C } = useUI();
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: C.panel,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: C.hairline,
        overflow: 'hidden',
      }}
    >
      {items.map((t, i) => {
        const selected = value === t.key;
        const quiet = t.n === 0 && !selected;
        const body = (
          <>
            <Text
              style={{
                color: quiet ? C.subtle : t.color,
                fontFamily: fonts.display,
                fontSize: t.n > 999 ? 30 : 38,
                lineHeight: 42,
                fontVariant: ['tabular-nums'],
              }}
            >
              {t.n}
            </Text>
            <Text numberOfLines={1} style={{ color: C.text, fontFamily: fonts.medium, fontSize: 14, maxWidth: '100%' }}>
              {t.label}
            </Text>
            {selected ? (
              <View
                style={{
                  position: 'absolute',
                  left: 10,
                  right: 10,
                  bottom: 0,
                  height: 4,
                  borderTopLeftRadius: 4,
                  borderTopRightRadius: 4,
                  backgroundColor: t.color,
                }}
              />
            ) : null}
          </>
        );
        const cell = {
          flex: 1,
          minWidth: 0,
          minHeight: 92,
          paddingTop: 12,
          paddingBottom: 10,
          paddingHorizontal: 6,
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
          gap: 2,
          borderLeftWidth: i ? 1 : 0,
          borderColor: C.hairline,
        };
        return onChange ? (
          <Pressable
            key={t.key}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`${t.label}: ${t.n}. ${selected ? 'Filtro activo, tocar para ver todos' : 'Tocar para filtrar'}`}
            onPress={() => onChange(t.key)}
            style={({ pressed }) => ({ ...cell, backgroundColor: pressed || selected ? C.panel2 : 'transparent' })}
          >
            {body}
          </Pressable>
        ) : (
          <View key={t.key} accessible accessibilityLabel={`${t.label}: ${t.n}`} style={cell}>
            {body}
          </View>
        );
      })}
    </View>
  );
}
