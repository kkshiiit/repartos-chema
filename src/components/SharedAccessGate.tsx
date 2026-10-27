import React from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useSegments } from 'expo-router';
import { useInventory } from '../context/InventoryContext';
import { Button, useUI } from './ui';
/** A known Auth/membership rejection masks the cache without erasing any pending proposal. */
export function SharedAccessGate({ children }: { children: React.ReactNode }) {
  const { accessBlocked } = useInventory(), { C, s } = useUI();
  const segments = useSegments();
  if (!accessBlocked || segments[0] === 'equipo') return children;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ padding: 24, gap: 20, maxWidth: 580, width: '100%', alignSelf: 'center' }}>
        <Text accessibilityRole="header" style={s.title}>Revisar acceso</Text>
        <Text style={s.body}>El equipo rechazó este acceso. Tus datos y propuestas siguen guardados en este teléfono. Validá la cuenta para continuar o elegí uso individual desde esa pantalla.</Text>
        <Button label="Validar acceso" onPress={() => router.push('/equipo/conectar')} />
      </View>
    </SafeAreaView>
  );
}
