import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';

/** A short appearance transition; children and form state keep their identity. */
export function MotionView({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { motionEnabled } = useTheme();
  const [progress] = useState(() => new Animated.Value(1));
  const appeared = useRef(false);
  useEffect(() => {
    if (appeared.current || !motionEnabled) {
      appeared.current = true;
      progress.setValue(1);
      return;
    }
    appeared.current = true;
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 160,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [motionEnabled, progress]);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
