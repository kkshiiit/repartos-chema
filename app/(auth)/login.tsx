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
import { LOCAL_ONLY } from '../../src/services/localMode';
import { userError } from '../../src/services/errors';
import { useLocalSearchParams } from 'expo-router';
import { AuroraBackground } from '../../src/components/AuroraBackground';
import { ThemeToggle } from '../../src/components/ThemeToggle';
import { MotionView } from '../../src/components/MotionView';
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
      <AuroraBackground />
      <View style={{ alignSelf: 'flex-end', marginRight: 20, marginTop: 12 }}>
        <ThemeToggle />
      </View>
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
          <MotionView style={{ width: '100%', maxWidth: 460, alignSelf: 'center', gap: 28 }}>
            <View style={{ alignItems: 'center', gap: 18, paddingTop: 12 }}>
              <Image
                source={require('../../assets/brand/grupo-chema.png')}
                resizeMode="contain"
                accessibilityLabel="Logo Grupo Chema Construcciones"
                style={{ width: 210, height: 144 }}
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
            <View style={[s.card, { padding: width < 400 ? 20 : 26, gap: 20 }]}>
              <View style={{ width: 38, height: 4, borderRadius: 4, backgroundColor: C.accent }} />
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
              {!showInvite && !LOCAL_ONLY ? (
                <Button
                  label="Tengo una invitación"
                  icon={Link}
                  variant="ghost"
                  onPress={() => setShowInvite(true)}
                />
              ) : null}
              {LOCAL_ONLY ? (
                <Text style={[s.muted, { fontSize: 12 }]}>
                  Uso individual · Sin conexión ni servicios pagos. En una instalación nueva, el
                  inventario comienza vacío.
                </Text>
              ) : DATA_MODE === 'demo' ? (
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
          </MotionView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
