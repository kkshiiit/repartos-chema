import { FeedbackProvider } from '../src/context/FeedbackContext';
import { Stack, router, useSegments } from 'expo-router';
import { ThemeProvider } from '../src/context/ThemeContext';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, ActivityIndicator, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { InventoryProvider } from '../src/context/InventoryContext';
import { PinProvider } from '../src/context/PinContext';
import { useUI } from '../src/components/ui';

const OPEN_ROUTES = ['bienvenida', 'quien', 'guia'];
function Navigation() {
  const { C } = useUI();
  const { user, session, loading } = useAuth();
  const segments = useSegments();
  const first = segments[0] || '';
  useEffect(() => {
    if (loading) return;
    if (!session && first !== 'bienvenida' && first !== 'guia') router.replace('/bienvenida');
    else if (session && !user && first !== 'quien' && first !== 'guia') router.replace('/quien');
    else if (user && (first === 'bienvenida' || first === 'quien')) router.replace('/');
  }, [user, session, loading, first]);
  if (loading)
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', gap: 12 }}>
        <ActivityIndicator color={C.accent} size="large" />
        <Text style={{ color: C.muted, textAlign: 'center' }}>Cargando Chema Andamios…</Text>
      </View>
    );
  const blocked = !user && !OPEN_ROUTES.includes(first);
  return (
    <PinProvider>
    <InventoryProvider key={session?.teamId || "none"}>
      <FeedbackProvider>
        {blocked ? (
          <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center' }}>
            <ActivityIndicator color={C.accent} size="large" />
          </View>
        ) : (
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'fade_from_bottom',
              animationDuration: 180,
              contentStyle: { backgroundColor: C.bg },
            }}
          />
        )}
      </FeedbackProvider>
    </InventoryProvider>
    </PinProvider>
  );
}
export default function Root() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <Navigation />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
