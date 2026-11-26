import React, { useEffect, useState } from 'react';
import { Animated, Pressable } from 'react-native';
import { Moon, Sun } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
/** Cambia entre Sol y Noche. `tone="band"` para usarlo sobre la franja de marca. */
export function ThemeToggle({ tone = 'surface' }: { tone?: 'surface' | 'band' }) {
  const { mode, colors, toggle, motionEnabled } = useTheme();
  const Icon = mode === 'dark' ? Sun : Moon;
  const [transition] = useState(() => new Animated.Value(1));
  useEffect(() => {
    if (!motionEnabled) {
      transition.setValue(1);
      return;
    }
    transition.setValue(0);
    const animation = Animated.timing(transition, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [mode, motionEnabled, transition]);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={mode === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
      onPress={toggle}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 22,
        backgroundColor: pressed ? (tone === 'band' ? '#FFFFFF2E' : colors.panel2) : 'transparent',
      })}
    >
      <Animated.View
        style={{
          opacity: transition,
          transform: [
            {
              rotate: transition.interpolate({
                inputRange: [0, 1],
                outputRange: ['-20deg', '0deg'],
              }),
            },
          ],
        }}
      >
        <Icon size={24} color={tone === 'band' ? colors.onBand : colors.text} />
      </Animated.View>
    </Pressable>
  );
}
