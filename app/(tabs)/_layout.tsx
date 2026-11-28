import React, { useEffect, useState } from 'react';
import { Slot, router, usePathname } from 'expo-router';
import { Animated, View, Text, Pressable } from 'react-native';
import { CalendarCheck, Construction, Warehouse, Truck, Menu } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUI } from '../../src/components/ui';
import { useTheme } from '../../src/context/ThemeContext';
import { fonts, motionMs } from '../../src/theme/tokens';
/**
 * Barra inferior de 5 destinos, como Mercado Libre, WhatsApp o Gmail (ley de Jakob):
 * lo del día primero, «Más» al final con lo que se usa de vez en cuando.
 */
const links = [
  { path: '/', label: 'Hoy', icon: CalendarCheck, also: [] as string[] },
  { path: '/alquileres', label: 'Alquileres', icon: Construction, also: [] as string[] },
  { path: '/galpon', label: 'Depósito', icon: Warehouse, also: [] as string[] },
  { path: '/mapa', label: 'Viaje', icon: Truck, also: [] as string[] },
  { path: '/mas', label: 'Más', icon: Menu, also: ['/historial'] },
];
function TabItem({ link, active }: { link: (typeof links)[number]; active: boolean }) {
  const { C } = useUI();
  const { motionEnabled } = useTheme();
  const [progress] = useState(() => new Animated.Value(active ? 1 : 0));
  useEffect(() => {
    if (!motionEnabled) {
      progress.setValue(active ? 1 : 0);
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: active ? 1 : 0,
      duration: motionMs.tab,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [active, motionEnabled, progress]);
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={link.label}
      accessibilityState={{ selected: active }}
      aria-selected={active}
      onPress={() => {
        if (!active || link.also.length) router.replace(link.path as '/');
      }}
      style={({ pressed }) => ({
        flex: 1,
        minWidth: 0,
        minHeight: 58,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        paddingTop: 8,
        paddingBottom: 6,
        paddingHorizontal: 2,
        backgroundColor: pressed ? C.panel2 : 'transparent',
      })}
    >
      {/* Barra superior roja que marca la pestaña activa. */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          height: 3,
          width: 40,
          borderBottomLeftRadius: 3,
          borderBottomRightRadius: 3,
          backgroundColor: C.accent,
          opacity: progress,
          transform: [{ scaleX: progress.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }],
        }}
      />
      <link.icon size={24} color={active ? C.accent : C.muted} strokeWidth={active ? 2.4 : 1.9} />
      <Text
        style={{
          fontFamily: active ? fonts.semibold : fonts.medium,
          color: active ? C.text : C.muted,
          fontSize: 13,
          lineHeight: 18,
          textAlign: 'center',
          maxWidth: '100%',
          alignSelf: 'stretch',
          flexShrink: 1,
        }}
      >
        {link.label}
      </Text>
    </Pressable>
  );
}
export default function Tabs() {
  const { C } = useUI(),
    insets = useSafeAreaInsets(),
    path = usePathname();
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Slot />
      </View>
      <View
        style={{
          borderTopWidth: 1,
          borderColor: C.hairline,
          backgroundColor: C.panel,
          paddingBottom: Math.max(insets.bottom, 6),
          paddingHorizontal: 8,
        }}
      >
        <View
          accessibilityRole="tablist"
          accessibilityLabel="Secciones principales"
          style={{
            flexDirection: 'row',
            width: '100%',
            maxWidth: 900,
            alignSelf: 'center',
            gap: 2,
          }}
        >
          {links.map((link) => (
            <TabItem key={link.path} link={link} active={path === link.path || link.also.includes(path)} />
          ))}
        </View>
      </View>
    </View>
  );
}
