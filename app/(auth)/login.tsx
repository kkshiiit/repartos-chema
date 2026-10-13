import React, { useState } from 'react';
import { View, Text, ScrollView, useWindowDimensions } from 'react-native';
import { Boxes, ArrowRight, ShieldCheck, Truck, WifiOff, HardHat } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { DATA_MODE } from '../../src/services/firebase';
import { Button, C, Field, Notice, s } from '../../src/components/ui';
export default function Login() {
  const { demoLogin, login, error: authError, reset } = useAuth();
  const [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('');
  const { width } = useWindowDimensions();
  const run = async (f: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await f();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 1050,
            alignSelf: 'center',
            flexDirection: width > 800 ? 'row' : 'column',
            gap: width > 800 ? 80 : 30,
          }}
        >
          <View style={{ flex: 1, gap: 28, justifyContent: 'center' }}>
            <View style={s.row}>
              <View style={{ backgroundColor: C.red, padding: 13, borderRadius: 13 }}>
                <Boxes size={27} color="white" />
              </View>
              <View>
                <Text style={{ color: C.text, fontWeight: '900', fontSize: 22 }}>
                  CHEMA<Text style={{ color: C.red }}>.</Text>
                </Text>
                <Text style={{ color: C.muted, fontSize: 10, letterSpacing: 2 }}>
                  CONSTRUCCIONES
                </Text>
              </View>
            </View>
            <Text
              style={{
                fontSize: width > 800 ? 54 : 34,
                fontWeight: '800',
                color: C.text,
                lineHeight: width > 800 ? 62 : 41,
                letterSpacing: -1.7,
              }}
            >
              Cada equipo.{`\n`}Cada obra.{`\n`}Todo en orden.
            </Text>
            <Text style={[s.muted, { fontSize: 16, maxWidth: 360, lineHeight: 25 }]}>
              La operación de Grupo Chema, desde el galpón hasta la última entrega.
            </Text>
            <View style={s.wrap}>
              <ChipItem icon={Truck} text="Entregas y retiros" />
              <ChipItem icon={WifiOff} text="Trabajo sin conexión" />
            </View>
          </View>
          <View
            style={[
              s.card,
              { flex: 1, padding: 30, alignSelf: 'center', width: '100%', maxWidth: 440, gap: 22 },
            ]}
          >
            <View style={{ gap: 9 }}>
              <Text style={s.label}>REPARTOS CHEMA</Text>
              <Text style={[s.h2, { fontSize: 25 }]}>
                {DATA_MODE === 'demo' ? 'Entrá a la operación' : 'Bienvenido de nuevo'}
              </Text>
              <Text style={s.muted}>
                {DATA_MODE === 'demo'
                  ? 'Elegí un perfil para explorar la aplicación.'
                  : 'Ingresá con tu cuenta de la empresa.'}
              </Text>
            </View>
            {DATA_MODE === 'demo' ? (
              <>
                <Notice text="DEMOSTRACIÓN LOCAL · Datos ficticios. Sin autenticación real ni sincronización cloud." />
                <Button
                  label="Administración"
                  icon={ShieldCheck}
                  loading={busy}
                  onPress={() => void run(() => demoLogin('ADMIN'))}
                />
                <Button
                  label="Operación"
                  icon={HardHat}
                  variant="secondary"
                  disabled={busy}
                  onPress={() => void run(() => demoLogin('OPERADOR'))}
                />
                <Text style={s.muted}>
                  Administración gestiona obras e inventario. Operación registra el trabajo en
                  campo.
                </Text>
              </>
            ) : (
              <>
                <Field
                  label="Correo electrónico"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
                <Field
                  label="Contraseña"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="current-password"
                />
                <Button
                  label="Ingresar"
                  icon={ArrowRight}
                  loading={busy}
                  onPress={() => void run(() => login(email, password))}
                />
                <Button
                  label="Recuperar acceso"
                  variant="ghost"
                  onPress={() =>
                    void run(async () => {
                      await reset(email);
                      setNotice('Si la cuenta existe, recibirás un correo de recuperación.');
                    })
                  }
                />
              </>
            )}
            {error || authError ? <Notice text={error || authError} tone="error" /> : null}
            {notice ? <Notice text={notice} tone="success" /> : null}
            <View style={s.divider} />
            <Text style={{ color: C.subtle, textAlign: 'center', fontSize: 11 }}>
              Herramienta interna · Grupo Chema Construcciones
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
function ChipItem({ icon: Icon, text }: { icon: typeof Truck; text: string }) {
  return (
    <View style={s.row}>
      <Icon size={17} color={C.red} />
      <Text style={s.muted}>{text}</Text>
    </View>
  );
}
