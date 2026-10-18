import React, { useEffect, useState } from 'react';
import { Slot, router, usePathname } from 'expo-router';
import { Animated, View, Text, Image, Pressable, useWindowDimensions } from 'react-native';
import { LayoutGrid, Warehouse, Map, History, Layers, Settings } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { useUI } from '../../src/components/ui';
import { useTheme } from '../../src/context/ThemeContext';
type Link = { path: string; label: string; icon: typeof LayoutGrid };
function TabItem({ link, active, wide }: { link: Link; active: boolean; wide: boolean }) {
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
      duration: 180,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [active, motionEnabled, progress]);
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      aria-selected={active}
      onPress={() => router.replace(link.path as '/')}
      style={({ pressed }) => ({
        flex: wide ? undefined : 1,
        flexDirection: wide ? 'row' : 'column',
        alignItems: 'center',
        justifyContent: wide ? 'flex-start' : 'center',
        gap: wide ? 12 : 5,
        padding: wide ? 13 : 7,
        borderRadius: 16,
        minHeight: 52,
        minWidth: 0,
        backgroundColor: pressed ? C.selection : 'transparent',
        overflow: 'hidden',
      })}
    >
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: C.hairline,
          backgroundColor: C.selection,
          opacity: progress,
          transform: [
            { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
          ],
        }}
      />
      <link.icon size={wide ? 19 : 21} color={active ? C.link : C.muted} />
      <Text
        style={{
          color: active ? C.link : C.muted,
          fontWeight: active ? '700' : '500',
          fontSize: 12,
          flexShrink: 1,
          textAlign: wide ? 'left' : 'center',
        }}
      >
        {link.label}
      </Text>
      <Animated.View
        style={{
          position: 'absolute',
          bottom: wide ? undefined : 2,
          left: wide ? 0 : undefined,
          width: wide ? 3 : 16,
          height: wide ? 20 : 3,
          borderRadius: 3,
          backgroundColor: C.accent,
          opacity: progress,
          transform: [
            { scaleX: progress.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
          ],
        }}
      />
    </Pressable>
  );
}
export default function Tabs() {
  const { C, s } = useUI();
  const { width } = useWindowDimensions(),
    wide = width >= 1000,
    insets = useSafeAreaInsets(),
    path = usePathname(),
    { user } = useAuth();
  const links = [
    { path: '/', label: 'Alquileres', icon: LayoutGrid },
    { path: '/galpon', label: 'Depósito', icon: Warehouse },
    { path: '/mapa', label: 'Viaje', icon: Map },
    { path: '/historial', label: 'Historial', icon: History },
  ];
  const nav = (
    <View
      style={{
        width: wide ? 228 : undefined,
        backgroundColor: C.panel,
        borderRightWidth: wide ? 1 : 0,
        borderTopWidth: wide ? 0 : 1,
        borderColor: C.hairline,
        padding: wide ? 20 : 8,
        paddingTop: wide ? 32 : 8,
        paddingBottom: wide ? 24 : Math.max(insets.bottom, 8),
        flexDirection: wide ? 'column' : 'row',
        gap: wide ? 10 : 2,
      }}
    >
      {wide ? (
        <>
          <Image
            source={require('../../assets/brand/grupo-chema.png')}
            accessibilityLabel="Grupo Chema Construcciones"
            resizeMode="contain"
            style={{ width: 165, height: 115, marginBottom: 24 }}
          />
        </>
      ) : null}
      <View
        accessibilityRole="tablist"
        accessibilityLabel="Secciones principales"
        style={{
          flex: wide ? undefined : 1,
          flexDirection: wide ? 'column' : 'row',
          gap: wide ? 10 : 2,
        }}
      >
        {links.map((link) => (
          <TabItem key={link.path} link={link} active={path === link.path} wide={wide} />
        ))}
      </View>
      {wide ? (
        <>
          <View style={[s.divider, { marginVertical: 16 }]} />
          {user?.role === 'ADMIN' ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/combos')}
              style={[s.row, { padding: 12, minHeight: 48 }]}
            >
              <Layers size={19} color={C.subtle} />
              <Text style={s.muted}>Combos</Text>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/configuracion')}
            style={[s.row, { padding: 12, minHeight: 48 }]}
          >
            <Settings size={19} color={C.subtle} />
            <Text style={s.muted}>Configuración</Text>
          </Pressable>
          <View style={{ flex: 1 }} />
          <Text style={s.muted}>Grupo Chema Construcciones</Text>
        </>
      ) : null}
    </View>
  );
  return (
    <View style={{ flex: 1, backgroundColor: C.bg, flexDirection: wide ? 'row' : 'column' }}>
      {wide ? nav : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Slot />
      </View>
      {!wide ? nav : null}
    </View>
  );
}
