import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, Link, BookOpen } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useWelcome } from '../../src/components/WelcomeProvider';
import { Button, Field, Notice, useUI } from '../../src/components/ui';
import { DATA_MODE } from '../../src/services/firebase';
import { userError } from '../../src/services/errors';
import { useLocalSearchParams } from 'expo-router';
export default function Login() {
  const { C, s } = useUI(),
    { width } = useWindowDimensions(),
    { enterTeam, error: authError } = useAuth(),
    { openWelcome } = useWelcome();
  const params = useLocalSearchParams<{ token?: string }>();
  const [name, setName] = useState(''),
    [invite, setInvite] = useState(params.token || ''),
    [showInvite, setShowInvite] = useState(!!params.token || DATA_MODE === 'firebase'),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function enter() {
    setBusy(true);
    setError('');
    try {
      await enterTeam(name, invite);
    } catch (e) {
      setError(userError(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            padding: width < 400 ? 24 : 36,
          }}
        >
          <View style={{ width: '100%', maxWidth: 460, alignSelf: 'center', gap: 30 }}>
            <View style={{ alignItems: 'center', gap: 18, paddingTop: 12 }}>
              <Image
                source={require('../../assets/brand/grupo-chema.png')}
                resizeMode="contain"
                accessibilityLabel="Logo Grupo Chema Construcciones"
                style={{ width: 230, height: 158, opacity: 0.9 }}
              />
              <View style={{ gap: 6 }}>
                <Text
                  accessibilityRole="header"
                  style={{
                    color: C.text,
                    fontSize: 32,
                    lineHeight: 38,
                    fontWeight: '800',
                    textAlign: 'center',
                    letterSpacing: -1,
                  }}
                >
                  Grupo Chema{`\n`}Construcciones
                </Text>
                <Text style={[s.muted, { textAlign: 'center', marginTop: 8 }]}>
                  Repartos · Alquiler de andamios
                </Text>
              </View>
            </View>
            <View style={[s.card, { padding: 24, gap: 20 }]}>
              <Text style={s.h2}>Ingresar al equipo</Text>
              <Field
                label="Tu nombre"
                placeholder="¿Cómo te llamás?"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                maxLength={60}
                autoComplete="name"
                returnKeyType="go"
                onSubmitEditing={() => void enter()}
              />
              {showInvite ? (
                <Field
                  label="Enlace de invitación"
                  placeholder="Pegá la invitación del equipo"
                  value={invite}
                  onChangeText={setInvite}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              ) : null}
              {error || authError ? <Notice text={error || authError} tone="error" /> : null}
              <Button
                label="Entrar"
                icon={ArrowRight}
                loading={busy}
                onPress={() => void enter()}
              />
              {!showInvite ? (
                <Button
                  label="Tengo una invitación"
                  icon={Link}
                  variant="ghost"
                  onPress={() => setShowInvite(true)}
                />
              ) : null}
              {DATA_MODE === 'demo' ? (
                <Text style={[s.muted, { fontSize: 12 }]}>
                  Prueba local · Los datos se guardan en este celular. Compartir entre celulares
                  requiere conectar el equipo.
                </Text>
              ) : (
                <Text style={s.muted}>
                  Usá el enlace que te compartió el responsable del equipo.
                </Text>
              )}
            </View>
            <Button label="Cómo se usa" icon={BookOpen} variant="ghost" onPress={openWelcome} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
