import { Slot, router, usePathname } from 'expo-router';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import {
  Boxes,
  LayoutGrid,
  Warehouse,
  Map,
  History,
  Layers,
  Settings,
  ArrowUpRight,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { useUI } from '../../src/components/ui';
export default function Tabs() {
  const { C, s } = useUI();
  const { width } = useWindowDimensions(),
    wide = width >= 1000,
    insets = useSafeAreaInsets(),
    path = usePathname(),
    { user } = useAuth();
  const links = [
    { path: '/', label: 'Obras', icon: LayoutGrid },
    { path: '/galpon', label: 'Galpón', icon: Warehouse },
    { path: '/mapa', label: 'Viaje', icon: Map },
    { path: '/historial', label: 'Historial', icon: History },
  ];
  const nav = (
    <View
      style={{
        width: wide ? 216 : undefined,
        backgroundColor: wide ? C.bg : C.panel,
        borderRightWidth: wide ? 1 : 0,
        borderTopWidth: wide ? 0 : 1,
        borderColor: C.line,
        padding: wide ? 20 : 8,
        paddingTop: wide ? 32 : 8,
        paddingBottom: wide ? 24 : Math.max(insets.bottom, 8),
        flexDirection: wide ? 'column' : 'row',
        gap: wide ? 10 : 2,
      }}
    >
      {wide ? (
        <>
          <View style={[s.row, { marginBottom: 45 }]}>
            <View style={{ backgroundColor: C.red, padding: 10, borderRadius: 11 }}>
              <Boxes size={24} color="white" />
            </View>
            <View>
              <Text style={{ color: C.text, fontSize: 22, fontWeight: '900' }}>
                CHEMA<Text style={{ color: C.red }}>.</Text>
              </Text>
              <Text style={{ color: C.subtle, fontSize: 10, letterSpacing: 1.3 }}>REPARTOS</Text>
            </View>
          </View>
          <Text style={[s.label, { fontSize: 10, marginBottom: 9 }]}>OPERACIÓN</Text>
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
        {links.map((l) => {
          const active = path === l.path;
          return (
            <Pressable
              key={l.path}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              aria-selected={active}
              onPress={() => router.replace(l.path as '/')}
              style={{
                flex: wide ? undefined : 1,
                flexDirection: wide ? 'row' : 'column',
                alignItems: 'center',
                gap: wide ? 12 : 5,
                padding: wide ? 13 : 7,
                borderRadius: 10,
                backgroundColor: active ? C.dangerBg : 'transparent',
                minHeight: 48,
              }}
            >
              <l.icon size={wide ? 19 : 21} color={active ? C.danger : C.subtle} />
              <Text
                style={{
                  color: active ? C.danger : C.muted,
                  fontWeight: active ? '700' : '500',
                  fontSize: wide ? 14 : 10,
                }}
              >
                {l.label}
              </Text>
              {wide && active ? (
                <View
                  style={{
                    marginLeft: 'auto',
                    width: 5,
                    height: 5,
                    borderRadius: 3,
                    backgroundColor: C.red,
                  }}
                />
              ) : null}
            </Pressable>
          );
        })}
      </View>
      {wide ? (
        <>
          <View style={[s.divider, { marginVertical: 16 }]} />
          {user?.role === 'ADMIN' ? (
            <Pressable
              onPress={() => router.push('/combos')}
              style={[s.row, { padding: 12, minHeight: 48 }]}
            >
              <Layers size={19} color={C.subtle} />
              <Text style={s.muted}>Combos</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => router.push('/configuracion')}
            style={[s.row, { padding: 12, minHeight: 48 }]}
          >
            <Settings size={19} color={C.subtle} />
            <Text style={s.muted}>Configuración</Text>
          </Pressable>
          <View style={{ flex: 1 }} />
          <View style={{ padding: 15, backgroundColor: C.panel, borderRadius: 12, gap: 8 }}>
            <Text style={{ color: C.text, fontSize: 12, fontWeight: '600' }}>
              Hecho para la obra <ArrowUpRight size={12} color={C.subtle} />
            </Text>
            <Text style={{ color: C.subtle, fontSize: 11, lineHeight: 17 }}>
              Grupo Chema{`\n`}Construcciones
            </Text>
          </View>
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
