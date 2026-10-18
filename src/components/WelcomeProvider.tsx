import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text } from 'react-native';
import { Package, Truck, Navigation, History, ArrowRight, Check } from 'lucide-react-native';
import { Button, Sheet, Notice, useUI } from './ui';
const KEY = 'chema:welcome:v2';
const Context = createContext({ openWelcome: () => {} });
const steps = [
  {
    title: 'Tus alquileres, en un lugar',
    text: 'Registrá a quién alquilaste los andamios, dónde están y cuándo hay que retirarlos.',
    icon: Package,
  },
  {
    title: 'Prepará la entrega',
    text: 'Agregá cuerpos, tablones, ruedas y accesorios. Confirmá la entrega con el flete y el nombre de quien recibió.',
    icon: Truck,
  },
  {
    title: 'Organizá el viaje',
    text: 'Revisá primero los retiros pendientes. Abrí el recorrido en Google Maps y usá Volver al depósito para regresar.',
    icon: Navigation,
  },
  {
    title: 'Cerrá cada movimiento',
    text: 'Al retirar, separá lo devuelto, lo que necesita reparación y lo perdido. El historial conserva quién hizo cada cambio.',
    icon: History,
  },
];
export function WelcomeProvider({ children }: { children: React.ReactNode }) {
  const { C, s } = useUI();
  const [visible, setVisible] = useState(false),
    [step, setStep] = useState(0),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(KEY)
      .then((value) => {
        if (active && value !== 'done') setVisible(true);
      })
      .catch(() => {
        if (active) {
          setVisible(true);
          setError('No se pudo leer la bienvenida guardada.');
        }
      });
    return () => {
      active = false;
    };
  }, []);
  async function finish() {
    setBusy(true);
    try {
      await AsyncStorage.setItem(KEY, 'done');
      setVisible(false);
      setError('');
    } catch {
      setError(
        'No se pudo guardar la preferencia. Podés cerrar esta guía y volver a verla desde Ajustes.',
      );
    } finally {
      setBusy(false);
    }
  }
  const current = steps[step]!;
  return (
    <Context.Provider
      value={{
        openWelcome: () => {
          setStep(0);
          setVisible(true);
        },
      }}
    >
      {children}
      <Sheet
        visible={visible}
        title="Bienvenido a Repartos Chema"
        onClose={() => {
          setVisible(false);
          void AsyncStorage.setItem(KEY, 'done').catch(() => {});
        }}
      >
        <View style={{ gap: 24, paddingVertical: 12 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: C.hairline,
              backgroundColor: C.selection,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <current.icon size={32} color={C.accent} />
          </View>
          <Text accessibilityRole="header" style={s.title}>
            {current.title}
          </Text>
          <Text style={[s.body, { color: C.muted }]}>{current.text}</Text>
          <View style={s.row}>
            {steps.map((_, i) => (
              <View
                key={i}
                style={{
                  height: 5,
                  width: i === step ? 28 : 8,
                  borderRadius: 3,
                  backgroundColor: i === step ? C.primary : C.hairline,
                }}
              />
            ))}
            <Text style={[s.muted, { marginLeft: 'auto' }]}>
              {step + 1} de {steps.length}
            </Text>
          </View>
          {error ? <Notice text={error} tone="error" /> : null}
          <Button
            label={step === steps.length - 1 ? 'Empezar' : 'Siguiente'}
            icon={step === steps.length - 1 ? Check : ArrowRight}
            loading={busy}
            onPress={() => (step === steps.length - 1 ? void finish() : setStep(step + 1))}
          />
          {step > 0 ? (
            <Button label="Anterior" variant="ghost" onPress={() => setStep(step - 1)} />
          ) : (
            <Button label="Omitir guía" variant="ghost" onPress={() => void finish()} />
          )}
        </View>
      </Sheet>
    </Context.Provider>
  );
}
export function useWelcome() {
  return useContext(Context);
}
