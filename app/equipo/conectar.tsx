import React from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { SharedTeamSettings } from '../../src/components/SharedTeamSettings';
import { Button, useUI } from '../../src/components/ui';
export default function ConnectTeam() {
  const { C } = useUI();
  const { token } = useLocalSearchParams<{ token?: string }>();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20, flexGrow: 1 }}
      >
        <View style={{ width: '100%', maxWidth: 580, alignSelf: 'center', gap: 20 }}>
          <Button
            label="Volver"
            variant="ghost"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          />
          <SharedTeamSettings invitation={token} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
