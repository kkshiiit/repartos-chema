import React from 'react';
import { Pressable } from 'react-native';
import { Moon, Sun } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
export function ThemeToggle() {
  const { mode, colors, toggle } = useTheme();
  const Icon = mode === 'dark' ? Sun : Moon;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={mode === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
      onPress={toggle}
      style={({ pressed }) => ({
        minWidth: 44,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.line,
        backgroundColor: pressed ? colors.selection : colors.panel2,
      })}
    >
      <Icon size={21} color={colors.text} />
    </Pressable>
  );
}
