import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { RotateCcw } from 'lucide-react-native';
import type { DomainSnapshot } from '../types';
import { useInventory } from '../context/InventoryContext';
import { userError } from '../services/errors';
import { snapshot } from '../domain/engine';
import { summary } from '../sync/restore';
import { fonts } from '../theme/tokens';
import { Button, Notice, Sheet, useUI } from './ui';

function Column({ title, s, strong }: { title: string; s: ReturnType<typeof summary>; strong?: boolean }) {
  const { C } = useUI();
  return (
    <View
      style={{
        flex: 1,
        borderRadius: 14,
        borderWidth: strong ? 2 : 1,
        borderColor: strong ? C.accent : C.hairline,
        backgroundColor: strong ? C.selection : C.panel,
        padding: 12,
        gap: 4,
      }}
    >
      <Text style={{ color: C.muted, fontFamily: fonts.semibold, fontSize: 13 }}>{title}</Text>
      <Text style={{ color: C.text, fontFamily: fonts.semibold, fontSize: 22 }}>{s.obras}</Text>
      <Text style={{ color: C.muted, fontSize: 13 }}>alquileres</Text>
      <Text style={{ color: C.text, fontFamily: fonts.semibold, fontSize: 18 }}>{s.materiales}</Text>
      <Text style={{ color: C.muted, fontSize: 13 }}>materiales · {s.piezas} piezas</Text>
    </View>
  );
}

/**
 * Muestra "Ahora" vs "Quedaría así" y pide confirmación antes de restaurar.
 * `load` trae el inventario de destino; `accion` es el texto que queda en la Auditoría.
 */
export function RestoreSheet({
  visible,
  title,
  explain,
  accion,
  load,
  onClose,
  onDone,
}: {
  visible: boolean;
  title: string;
  explain: string;
  accion: string;
  load: () => Promise<DomainSnapshot>;
  onClose: () => void;
  onDone?: () => void;
}) {
  const { s } = useUI();
  const inv = useInventory();
  const [target, setTarget] = useState<DomainSnapshot | null>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!visible) return;
    let active = true;
    load()
      .then((t) => active && (setTarget(t), setError('')))
      .catch((e) => active && setError(userError(e)));
    return () => {
      active = false;
      setTarget(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);
  return (
    <Sheet visible={visible} title={title} busy={busy} onClose={onClose}>
      <Text style={s.body}>{explain}</Text>
      {!target && !error ? (
        <View style={{ alignItems: 'center', gap: 8, padding: 16 }}>
          <ActivityIndicator />
          <Text style={s.muted}>Calculando cómo quedaría…</Text>
        </View>
      ) : null}
      {target ? (
        <>
          <View style={[s.row, { alignItems: 'stretch', gap: 10 }]}>
            <Column title="Ahora" s={summary(snapshot(inv.state))} />
            <Column title="Quedaría así" s={summary(target)} strong />
          </View>
          <Notice text="Antes de restaurar se guarda sola una copia de cómo está ahora, así que esto también se puede deshacer. Queda registrado en la Auditoría con tu nombre." />
          <Button
            label="Sí, restaurar"
            icon={RotateCcw}
            variant="danger"
            loading={busy}
            onPress={async () => {
              setBusy(true);
              try {
                await inv.restoreSnapshot?.(target, accion);
                onClose();
                onDone?.();
              } catch (e) {
                setError(userError(e));
              } finally {
                setBusy(false);
              }
            }}
          />
          <Button label="No, dejar todo como está" variant="ghost" onPress={onClose} />
        </>
      ) : null}
      {error ? <Notice tone="error" text={error} /> : null}
    </Sheet>
  );
}
