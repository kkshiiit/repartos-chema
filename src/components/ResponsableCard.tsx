import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { KeyRound, ShieldAlert, ShieldCheck } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useInventory } from '../context/InventoryContext';
import { api, type PinStatus } from '../sync/api';
import { userError } from '../services/errors';
import { Button, Field, Notice, Sheet, useUI } from './ui';

/** Responsable del equipo: su PIN protege importar, restaurar, empezar vacío, cambiar código y sacar personas. */
export function ResponsableCard() {
  const { C, s } = useUI();
  const { session, user } = useAuth();
  const inv = useInventory();
  const [status, setStatus] = useState<PinStatus | null>(null),
    [open, setOpen] = useState(false),
    [name, setName] = useState(''),
    [current, setCurrent] = useState(''),
    [pin, setPin] = useState(''),
    [repeat, setRepeat] = useState(''),
    [error, setError] = useState(''),
    [done, setDone] = useState(''),
    [busy, setBusy] = useState(false);
  const load = useCallback(() => {
    if (session) api.pinStatus(session.code).then(setStatus).catch(() => undefined);
  }, [session]);
  useEffect(load, [load]);
  const has = !!status?.hasPin;
  const openSheet = () => {
    setName(status?.responsable || user?.nombre || '');
    setCurrent('');
    setPin('');
    setRepeat('');
    setError('');
    setOpen(true);
  };
  const digits = (v: string) => v.replace(/\D/g, '').slice(0, 8);
  return (
    <View style={[s.card, { gap: 12 }]}>
      <View style={s.row}>
        {has ? <ShieldCheck size={24} color={C.success} /> : <ShieldAlert size={24} color={C.warning} />}
        <Text style={[s.h2, s.grow]}>Responsable</Text>
      </View>
      {has ? (
        <Text style={s.body}>
          <Text style={{ fontWeight: '700' }}>{status?.responsable}</Text> autoriza con su PIN las acciones que
          cambian todo el equipo: importar o restaurar copias, empezar vacío, cambiar el código y sacar personas.
          El trabajo diario no pide PIN.
        </Text>
      ) : (
        <Text style={s.body}>
          Todavía no hay responsable: cualquiera puede importar, restaurar o cambiar el código. Recomendado: elegí un
          responsable con un PIN de 4 a 8 números.
        </Text>
      )}
      {done ? <Notice tone="success" text={done} /> : null}
      <Button
        label={has ? 'Cambiar PIN o responsable' : 'Elegir responsable y PIN'}
        icon={KeyRound}
        variant={has ? 'secondary' : 'primary'}
        onPress={openSheet}
      />
      <Sheet visible={open} title={has ? 'Cambiar PIN' : 'Responsable y PIN'} busy={busy} onClose={() => setOpen(false)}>
        <Field label="Responsable (nombre)" value={name} onChangeText={setName} maxLength={60} />
        {has ? (
          <Field
            label="PIN actual"
            value={current}
            onChangeText={(v) => setCurrent(digits(v))}
            keyboardType="number-pad"
            secureTextEntry
          />
        ) : null}
        <Field label="PIN nuevo (4 a 8 números)" value={pin} onChangeText={(v) => setPin(digits(v))} keyboardType="number-pad" secureTextEntry />
        <Field label="Repetir PIN nuevo" value={repeat} onChangeText={(v) => setRepeat(digits(v))} keyboardType="number-pad" secureTextEntry />
        <Notice text="Guardá el PIN en un lugar seguro. Si se olvida, hay que pedir que lo reseteen desde el servidor. Cinco intentos equivocados lo bloquean 15 minutos." />
        {error ? <Notice tone="error" text={error} /> : null}
        <Button
          label="Guardar"
          loading={busy}
          disabled={pin.length < 4 || name.trim().length < 2 || (has && current.length < 4)}
          onPress={async () => {
            if (pin !== repeat) return setError('Los dos PIN nuevos no coinciden.');
            setBusy(true);
            setError('');
            try {
              const next = await api.pinSet(session!.code, pin, name.trim(), has ? current : undefined);
              setStatus(next);
              await inv.note?.(has ? `Cambió el PIN del responsable (${name.trim()})` : `Designó responsable a ${name.trim()}`);
              setOpen(false);
              setDone(has ? 'PIN actualizado.' : 'Listo: las acciones importantes ahora piden el PIN.');
            } catch (e) {
              setError(userError(e));
            } finally {
              setBusy(false);
            }
          }}
        />
      </Sheet>
    </View>
  );
}
