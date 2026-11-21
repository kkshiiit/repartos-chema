import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { KeyRound } from 'lucide-react-native';
import { useAuth } from './AuthContext';
import { api, SyncError } from '../sync/api';
import { Button, Notice, Sheet, useUI } from '../components/ui';
import { fonts } from '../theme/tokens';

interface PinValue {
  /**
   * Ejecuta `action` con el PIN del responsable. Si el equipo no tiene PIN, la ejecuta enseguida.
   * Si lo tiene, lo pide; ante un PIN incorrecto lo vuelve a pedir sin cerrar la ventana.
   */
  withPin: <T>(reason: string, action: (pin: string) => Promise<T>) => Promise<T>;
}
const Context = createContext<PinValue | null>(null);

type Ask = { reason: string; responsable?: string | null; resolve: (pin: string | null) => void };

export function PinProvider({ children }: { children: React.ReactNode }) {
  const { C, s } = useUI();
  const { session } = useAuth();
  const [ask, setAsk] = useState<Ask | null>(null),
    [pin, setPin] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const pending = useRef<Ask | null>(null);

  const prompt = (reason: string, responsable?: string | null, message = '') =>
    new Promise<string | null>((resolve) => {
      const next = { reason, responsable, resolve };
      pending.current = next;
      setPin('');
      setError(message);
      setBusy(false);
      setAsk(next);
    });

  const withPin = useCallback(
    async <T,>(reason: string, action: (pin: string) => Promise<T>): Promise<T> => {
      if (!session) throw new Error('Primero entrá a un equipo.');
      const status = await api.pinStatus(session.code);
      if (!status.hasPin) return action('');
      let message = '';
      for (;;) {
        const value = await prompt(reason, status.responsable, message);
        if (value === null) {
          setAsk(null);
          throw new Error('Acción cancelada. No se cambió nada.');
        }
        setBusy(true);
        try {
          const result = await action(value);
          setAsk(null);
          return result;
        } catch (e) {
          if (e instanceof SyncError && e.code === 'PIN_INCORRECTO') {
            message = e.message;
            continue;
          }
          setAsk(null);
          throw e;
        }
      }
    },
    [session],
  );

  const close = (value: string | null) => {
    const current = pending.current;
    pending.current = null;
    current?.resolve(value);
  };

  return (
    <Context.Provider value={{ withPin }}>
      {children}
      {/* Se monta recién al pedir el PIN, así queda por encima de cualquier otra ventana abierta. */}
      {ask ? (
        <Sheet visible title="PIN del responsable" busy={busy} onClose={() => close(null)}>
          <View style={[s.row, { gap: 12 }]}>
            <KeyRound size={26} color={C.accent} />
            <Text style={[s.body, s.grow]}>
              {ask?.reason}
              {ask?.responsable ? ` La puede autorizar ${ask.responsable}.` : ''}
            </Text>
          </View>
          <TextInput
            accessibilityLabel="Escribí el PIN"
            value={pin}
            onChangeText={(v) => setPin(v.replace(/\D/g, '').slice(0, 8))}
            keyboardType="number-pad"
            secureTextEntry
            autoFocus
            maxLength={8}
            placeholder="••••"
            placeholderTextColor={C.subtle}
            onSubmitEditing={() => pin.length >= 4 && close(pin)}
            style={[
              s.input,
              {
                fontFamily: fonts.monoMedium,
                fontSize: 28,
                letterSpacing: 10,
                textAlign: 'center',
              },
            ]}
          />
          {error ? <Notice tone="error" text={error} /> : null}
          <Button
            label="Autorizar"
            loading={busy}
            disabled={pin.length < 4}
            onPress={() => close(pin)}
          />
          <Button label="Cancelar" variant="ghost" onPress={() => close(null)} />
        </Sheet>
      ) : null}
    </Context.Provider>
  );
}

export function usePin() {
  const c = useContext(Context);
  if (!c) throw new Error('Falta PinProvider.');
  return c;
}
