import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Archive, History, RotateCcw, ShieldCheck } from 'lucide-react-native';
import { Button, Notice, Screen, useUI } from '../src/components/ui';
import { RestoreSheet } from '../src/components/RestoreSheet';
import { useInventory } from '../src/context/InventoryContext';
import type { BackupInfo } from '../src/sync/api';
import { userError } from '../src/services/errors';
import { fonts } from '../src/theme/tokens';

const when = (iso: string) =>
  new Date(iso).toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

export default function Copias() {
  const { C, s } = useUI();
  const inv = useInventory();
  const [list, setList] = useState<BackupInfo[] | null>(null),
    [error, setError] = useState(''),
    [chosen, setChosen] = useState<BackupInfo | null>(null);
  const load = useCallback(() => {
    inv
      .backups?.()
      .then((l) => (setList(l), setError('')))
      .catch((e) => setError(userError(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(load, [load]);
  return (
    <Screen title="Copias y restauración" back>
      <View style={[s.card, { gap: 10 }]}>
        <View style={s.row}>
          <ShieldCheck size={24} color={C.success} />
          <Text style={[s.h2, s.grow]}>Tus datos están protegidos</Text>
        </View>
        <Text style={s.body}>
          • Cada semana se guarda sola una <Text style={{ fontWeight: '700' }}>copia completa</Text> del
          inventario en el servidor. Se conservan las últimas 8 (unos 2 meses).
        </Text>
        <Text style={s.body}>
          • Además, cada cambio queda guardado: desde la <Text style={{ fontWeight: '700' }}>Auditoría</Text>{' '}
          podés volver a como estaba todo justo antes de cualquier cambio.
        </Text>
        <Text style={s.body}>
          • Antes de restaurar se guarda una copia de cómo está ahora, así que siempre se puede volver.
        </Text>
      </View>

      <View style={[s.card, { gap: 10 }]}>
        <View style={s.row}>
          <History size={22} color={C.accent} />
          <Text style={[s.h2, s.grow]}>Volver a antes de un cambio</Text>
        </View>
        <Text style={s.body}>
          Abrí la Auditoría, tocá el cambio que querés deshacer y elegí{' '}
          <Text style={{ fontWeight: '700' }}>“Volver a como estaba antes”</Text>. Sirve, por ejemplo, si
          alguien importó un archivo equivocado o borró algo por error.
        </Text>
        <Button label="Ir a la Auditoría" icon={History} variant="secondary" onPress={() => router.push('/historial')} />
      </View>

      <Text style={s.h2}>Copias guardadas</Text>
      {error ? <Notice tone="error" text={error} /> : null}
      {list === null && !error ? <ActivityIndicator /> : null}
      {list?.length === 0 ? (
        <Notice text="Todavía no hay copias. La primera se guarda sola cuando el equipo tenga datos y un teléfono sincronice." />
      ) : null}
      {list?.map((b) => (
        <Pressable
          key={b.id}
          accessibilityRole="button"
          accessibilityLabel={`Copia del ${when(b.createdAt)}: ${b.obras} alquileres, ${b.materiales} materiales. Restaurar`}
          onPress={() => setChosen(b)}
          style={({ pressed }) => [
            s.row,
            {
              minHeight: 72,
              padding: 12,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: C.hairline,
              backgroundColor: pressed ? C.selection : C.panel,
            },
          ]}
        >
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              backgroundColor: b.reason === 'auto' ? C.successBackground : C.panel2,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Archive size={22} color={b.reason === 'auto' ? C.success : C.muted} />
          </View>
          <View style={s.grow}>
            <Text style={[s.body, { fontFamily: fonts.semibold, fontWeight: '700' }]}>{when(b.createdAt)}</Text>
            <Text style={s.muted}>
              {b.reason === 'auto' ? 'Copia semanal' : `Antes de una restauración${b.createdBy ? ` · ${b.createdBy}` : ''}`} ·{' '}
              {b.obras} alquileres · {b.materiales} materiales
            </Text>
          </View>
          <RotateCcw size={20} color={C.muted} />
        </Pressable>
      ))}
      <RestoreSheet
        visible={!!chosen}
        title="Restaurar esta copia"
        explain={chosen ? `Todo el equipo vuelve a como estaba el ${when(chosen.createdAt)}. Lo que se cargó después deja de verse (pero queda en la Auditoría).` : ''}
        accion={chosen ? `Restauró la copia del ${when(chosen.createdAt)}` : ''}
        load={() => inv.previewBackup!(chosen!.id)}
        onClose={() => setChosen(null)}
        onDone={load}
      />
    </Screen>
  );
}
