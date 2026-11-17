import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, UserPlus } from 'lucide-react-native';
import { Button, Field, Notice, initials, useUI } from '../src/components/ui';
import { useAuth } from '../src/context/AuthContext';
import { userError } from '../src/services/errors';
import { fonts } from '../src/theme/tokens';

/** Cada persona entra con su nombre: así la auditoría sabe quién hizo cada cambio. */
export default function Quien() {
  const { C, s } = useUI();
  const { session, members, refreshMembers, enterAs, leaveTeam } = useAuth();
  const [name, setName] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState<string | null>(null),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    refreshMembers()
      .catch((e) => setError(userError(e)))
      .finally(() => setLoading(false));
  }, [refreshMembers]);
  const enter = async (value: string) => {
    setBusy(value);
    setError('');
    try {
      await enterAs(value);
    } catch (e) {
      setError(userError(e));
    } finally {
      setBusy(null);
    }
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, flexGrow: 1 }}>
          <View style={{ width: '100%', maxWidth: 520, alignSelf: 'center', gap: 18 }}>
            <Text style={[s.muted, { fontSize: 14 }]}>Equipo: {session?.teamName}</Text>
            <Text accessibilityRole="header" style={[s.title, { fontSize: 30, lineHeight: 36 }]}>
              ¿Quién sos?
            </Text>
            <Text style={s.body}>Tocá tu nombre. Si es tu primera vez, escribilo abajo.</Text>
            {loading ? <Text style={s.muted}>Buscando personas del equipo…</Text> : null}
            {members.length ? (
              <View style={{ gap: 10 }}>
                {members.map((m) => (
                  <Pressable
                    key={m.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Entrar como ${m.name}`}
                    disabled={!!busy}
                    onPress={() => void enter(m.name)}
                    style={({ pressed }) => [
                      s.row,
                      {
                        minHeight: 68,
                        paddingHorizontal: 14,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: C.hairline,
                        backgroundColor: pressed ? C.selection : C.panel,
                      },
                    ]}
                  >
                    <View
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 23,
                        backgroundColor: C.primary,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ color: C.onPrimary, fontFamily: fonts.semibold, fontSize: 18, fontWeight: '700' }}>
                        {initials(m.name)}
                      </Text>
                    </View>
                    <Text style={[s.body, s.grow, { fontSize: 18, fontFamily: fonts.semibold }]}>{m.name}</Text>
                    {busy === m.name ? <Text style={s.muted}>Entrando…</Text> : <ChevronRight size={22} color={C.muted} />}
                  </Pressable>
                ))}
              </View>
            ) : null}
            <View style={[s.card, { gap: 12 }]}>
              <Text style={s.h2}>Soy nuevo/a</Text>
              <Field
                label="Tu nombre y apellido"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                maxLength={60}
                placeholder="Ej.: Juan Pérez"
                onSubmitEditing={() => void enter(name)}
              />
              <Button
                label="Entrar con este nombre"
                icon={UserPlus}
                loading={busy === name && !!name}
                disabled={name.trim().length < 2}
                onPress={() => enter(name)}
              />
            </View>
            {error ? <Notice text={error} tone="error" /> : null}
            <Button label="Usar otro código de equipo" variant="ghost" onPress={leaveTeam} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
