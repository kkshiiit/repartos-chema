import React, { useEffect, useState } from 'react';
import { Animated, Pressable } from 'react-native';
import { Moon, Sun } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
export function ThemeToggle() {
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
        minWidth: 48,
        minHeight: 48,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.hairline,
        backgroundColor: pressed ? colors.selection : colors.panel,
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
        <Icon size={21} color={colors.accent} />
      </Animated.View>
    </Pressable>
  );
}
