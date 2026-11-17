import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { History } from 'lucide-react-native';
import type { AppState } from '../types';
import { inventoryStorage } from '../data/localStorage';
import { parseEnvelope } from '../data/validation';
import { snapshot } from '../domain/engine';
import { useInventory } from '../context/InventoryContext';
import { kv } from '../sync/kv';
import { userError } from '../services/errors';
import { Button, Notice, useUI } from './ui';

const LEGACY_KEY = 'chema:demo:v1';

/** Ofrece pasar al equipo los datos que este teléfono tenía en la versión 1.x (solo local). */
export function LegacyImport() {
  const { C, s } = useUI();
  const inv = useInventory();
  const team = inv.workspaceId || '';
  const flag = `chema2:legacy-done:${team}`;
  const [legacy, setLegacy] = useState<AppState | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  useEffect(() => {
    if (!team) return;
    let active = true;
    void (async () => {
      if (await kv.getItem(flag)) return;
      const raw = await inventoryStorage.getItem(LEGACY_KEY);
      if (!raw) return;
      const e = parseEnvelope(raw, { allowLegacyRetirementDate: true });
      if (active && (e.state.obras.length || e.state.materiales.length)) setLegacy(e.state);
    })().catch(() => undefined);
    return () => {
      active = false;
    };
  }, [team, flag]);
  if (!legacy) return null;
  const hide = async () => {
    await kv.setItem(flag, '1');
    setLegacy(null);
  };
  const replaces = inv.state.obras.length > 0 || inv.state.materiales.length > 0;
  return (
    <View style={[s.card, { borderColor: C.accent, borderWidth: 2, gap: 10 }]}>
      <View style={[s.row]}>
        <History size={24} color={C.accent} />
        <Text style={[s.h2, s.grow]}>Datos de la versión anterior</Text>
      </View>
      <Text style={s.body}>
        Este teléfono tiene {legacy.obras.length} alquileres y {legacy.materiales.length} materiales de la
        versión anterior. ¿Querés pasarlos al equipo para que todos los vean?
      </Text>
      {replaces ? (
        <Notice tone="error" text="El equipo ya tiene datos: importar los reemplaza por los de este teléfono." />
      ) : null}
      {error ? <Notice tone="error" text={error} /> : null}
      <Button
        label="Pasar datos al equipo"
        loading={busy}
        onPress={async () => {
          setBusy(true);
          try {
            await inv.importSnapshot?.(snapshot(legacy), 'versión anterior de este teléfono');
            await hide();
          } catch (e) {
            setError(userError(e));
          } finally {
            setBusy(false);
          }
        }}
      />
      <Button label="Ahora no" variant="ghost" onPress={hide} />
    </View>
  );
}
