import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BookOpen, LogIn, Plus, Truck } from 'lucide-react-native';
import { Button, Field, Notice, useUI } from '../src/components/ui';
import { ThemeToggle } from '../src/components/ThemeToggle';
import { useAuth } from '../src/context/AuthContext';
import { userError } from '../src/services/errors';
import { fonts } from '../src/theme/tokens';

export default function Bienvenida() {
  const { C, s } = useUI();
  const { createTeam, joinTeam } = useAuth();
  const [mode, setMode] = useState<'start' | 'join' | 'create'>('start');
  const [code, setCode] = useState(''),
    [teamName, setTeamName] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const go = async (f: () => Promise<unknown>) => {
    setBusy(true);
    setError('');
    try {
      await f();
      router.replace('/quien');
    } catch (e) {
      setError(userError(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 520, alignSelf: 'center', gap: 20, flex: 1 }}>
            <View style={[s.row, { justifyContent: 'flex-end' }]}>
              <ThemeToggle />
            </View>
            <View style={{ alignItems: 'center', gap: 14, paddingVertical: 12 }}>
              <View
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: 26,
                  backgroundColor: C.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Truck size={44} color={C.onPrimary} />
              </View>
              <Text accessibilityRole="header" style={[s.title, { fontSize: 32, lineHeight: 38, textAlign: 'center' }]}>
                Repartos Chema
              </Text>
              <Text style={[s.body, { textAlign: 'center', color: C.muted }]}>
                Alquiler de andamios: entregas, retiros, depósito y viajes. Todo el equipo ve lo mismo
                en su teléfono.
              </Text>
            </View>
            {mode === 'start' ? (
              <View style={{ gap: 12 }}>
                <Button label="Unirme a un equipo" icon={LogIn} onPress={() => setMode('join')} />
                <Text style={[s.muted, { textAlign: 'center' }]}>Si alguien ya usa la app, pedile el código.</Text>
                <Button label="Crear un equipo nuevo" icon={Plus} variant="secondary" onPress={() => setMode('create')} />
                <Text style={[s.muted, { textAlign: 'center' }]}>Para la primera persona del negocio.</Text>
              </View>
            ) : null}
            {mode === 'join' ? (
              <View style={[s.card, { gap: 14 }]}>
                <Text style={s.h2}>Unirme a un equipo</Text>
                <Field
                  label="Código del equipo (12 letras y números)"
                  value={code}
                  onChangeText={(v) => setCode(v.toUpperCase())}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  placeholder="ABCD-EFGH-JKLM"
                  style={{ fontFamily: fonts.monoMedium, fontSize: 22, letterSpacing: 2, textAlign: 'center' }}
                  onSubmitEditing={() => void go(() => joinTeam(code))}
                />
                {error ? <Notice text={error} tone="error" /> : null}
                <Button label="Entrar" loading={busy} disabled={code.replace(/[^A-Z0-9]/gi, '').length < 8} onPress={() => go(() => joinTeam(code))} />
                <Button label="Volver" variant="ghost" onPress={() => { setMode('start'); setError(''); }} />
              </View>
            ) : null}
            {mode === 'create' ? (
              <View style={[s.card, { gap: 14 }]}>
                <Text style={s.h2}>Crear un equipo</Text>
                <Field
                  label="Nombre del negocio"
                  value={teamName}
                  onChangeText={setTeamName}
                  placeholder="Ej.: Andamios Chema"
                  maxLength={80}
                  onSubmitEditing={() => void go(() => createTeam(teamName))}
                />
                <Text style={s.muted}>
                  Vamos a generar un código para que el resto del equipo se sume. Lo vas a ver en Ajustes.
                </Text>
                {error ? <Notice text={error} tone="error" /> : null}
                <Button label="Crear equipo" loading={busy} disabled={teamName.trim().length < 2} onPress={() => go(() => createTeam(teamName))} />
                <Button label="Volver" variant="ghost" onPress={() => { setMode('start'); setError(''); }} />
              </View>
            ) : null}
            <View style={{ flex: 1 }} />
            <Button label="Ver la guía de uso" icon={BookOpen} variant="ghost" onPress={() => router.push('/guia')} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
