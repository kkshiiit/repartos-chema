import { FeedbackProvider } from '../src/context/FeedbackContext';
import { WelcomeProvider } from '../src/components/WelcomeProvider';
import { Stack, router, useSegments } from 'expo-router';
import { ThemeProvider } from '../src/context/ThemeContext';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, ActivityIndicator, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { InventoryProvider } from '../src/context/InventoryContext';
import { useUI } from '../src/components/ui';
function Navigation() {
  const { C } = useUI();
  const { user, loading } = useAuth();
  const segments = useSegments();
  const authRoute = segments[0] === '(auth)' || segments[0] === 'equipo';
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
      <FeedbackProvider>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }} />
      </FeedbackProvider>
    </InventoryProvider>
  );
}
export default function Root() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <WelcomeProvider>
              <Navigation />
            </WelcomeProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
