import React, { useCallback, useEffect, useId, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { brand } from '../theme/tokens';

/** Two shared, slow layers. No per-card blur, timers, or layout animation. */
export function AuroraBackground() {
  const { colors, ambientEnabled } = useTheme();
  const id = useId().replace(/:/g, '');
  const [focused, setFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );
  const [drift] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!ambientEnabled || !focused) {
      drift.stopAnimation();
      drift.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 14000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 14000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
      drift.stopAnimation();
    };
  }, [ambientEnabled, focused, drift]);
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}
    >
      <Animated.View
        style={{
          position: 'absolute',
          top: -180,
          left: '-20%',
          width: '130%',
          height: 690,
          opacity: colors.auroraOpacity,
          transform: [
            { translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [-16, 32] }) },
            { translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [0, 35] }) },
          ],
        }}
      >
        <Svg width="100%" height="100%" viewBox="0 0 900 690" preserveAspectRatio="none">
          <Defs>
            <RadialGradient id={`${id}-pink`} cx="12%" cy="24%" rx="65%" ry="62%">
              <Stop offset="0" stopColor={brand.pink} />
              <Stop offset="1" stopColor={brand.pink} stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id={`${id}-violet`} cx="86%" cy="20%" rx="62%" ry="70%">
              <Stop offset="0" stopColor={brand.violet} />
              <Stop offset="1" stopColor={brand.purple} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect width="900" height="690" fill={`url(#${id}-pink)`} />
          <Rect width="900" height="690" fill={`url(#${id}-violet)`} />
        </Svg>
      </Animated.View>
      <Animated.View
        style={{
          position: 'absolute',
          bottom: -300,
          right: '-30%',
          width: '100%',
          height: 640,
          opacity: colors.auroraOpacity * 0.6,
          transform: [
            { translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [20, -20] }) },
          ],
        }}
      >
        <Svg width="100%" height="100%" viewBox="0 0 600 640">
          <Defs>
            <RadialGradient id={`${id}-red`}>
              <Stop offset="0" stopColor={brand.red} />
              <Stop offset="1" stopColor={brand.red} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect width="600" height="640" fill={`url(#${id}-red)`} />
        </Svg>
      </Animated.View>
    </View>
  );
}
