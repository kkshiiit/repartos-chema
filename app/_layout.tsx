import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { InventoryProvider } from '../src/context/InventoryContext';
import { AdsProvider } from '../src/context/AdsContext';
import { C } from '../src/components/ui';
function Navigation() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const authRoute = segments[0] === '(auth)';
  useEffect(() => {
    if (!loading) {
      if (!user && !authRoute) router.replace('/(auth)/login');
      if (user && authRoute) router.replace('/');
    }
  }, [user, loading, authRoute]);
  if (loading)
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', gap: 12 }}>
        <ActivityIndicator color={C.red} />
        <Text style={{ color: C.muted, textAlign: 'center' }}>Cargando Repartos Chema…</Text>
      </View>
    );
  return (
    <InventoryProvider key={user?.uid || 'anonymous'}>
      <AdsProvider>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }} />
      </AdsProvider>
    </InventoryProvider>
  );
}
export default function Root() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <Navigation />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
