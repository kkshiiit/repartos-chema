import { userError } from '../src/services/errors';
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Plus, Layers, MoreHorizontal } from 'lucide-react-native';
import type { ComboPreset } from '../src/types';
import { useInventory, makeId } from '../src/context/InventoryContext';
import { useAuth } from '../src/context/AuthContext';
import {
  Button,
  ConfirmButton,
  Empty,
  IconButton,
  Field,
  Notice,
  Screen,
  Select,
  Sheet,
  useUI,
} from '../src/components/ui';
import { SmartCounter } from '../src/components/SmartCounter';
export default function Combos() {
  const { C, s } = useUI();
  const { state, dispatch } = useInventory(),
    { user } = useAuth();
  const [actions, setActions] = useState<ComboPreset | null>(null);
  const [draft, setDraft] = useState<ComboPreset | null>(null),
    [selected, setSelected] = useState(state.materiales[0]?.id || ''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  return (
    <Screen
      title="Combos de carga"
      subtitle="Prepará cargas habituales en menos pasos."
      back
      footer={
        user?.role === 'ADMIN' ? (
          <Button
            label="Nuevo combo"
            icon={Plus}
            onPress={() => {
              setError('');
              setDraft({ id: makeId(), nombreCombo: '', items: [] });
            }}
          />
        ) : undefined
      }
    >
      {user?.role !== 'ADMIN' ? (
        <Notice text="Sección exclusiva de administración." />
      ) : (
        <>
          <View style={{ backgroundColor: C.panel, borderRadius: 16, paddingHorizontal: 16 }}>
            {state.combos.map((c, index) => (
              <View
                key={c.id}
                style={[
                  s.row,
                  {
                    alignItems: 'flex-start',
                    paddingVertical: 20,
                    borderBottomWidth: index < state.combos.length - 1 ? 1 : 0,
                    borderBottomColor: C.hairline,
                  },
                ]}
              >
                <View style={{ paddingTop: 4 }}>
                  <Layers size={28} color={C.muted} />
                </View>
                <View style={[s.grow, { gap: 6 }]}>
                  <Text style={s.h2}>{c.nombreCombo}</Text>
                  <Text style={s.muted}>
                    {c.items
                      .map((i) => {
                        const m = state.materiales.find((material) => material.id === i.materialId);
                        return `${i.cantidad} × ${m ? [m.nombre, m.medida].filter(Boolean).join(' ') : 'Material no disponible'}`;
                      })
                      .join(' · ') || 'Sin materiales'}
                  </Text>
                </View>
                <IconButton
                  label={`Acciones de ${c.nombreCombo}`}
                  icon={MoreHorizontal}
                  onPress={() => setActions(c)}
                />
              </View>
            ))}
          </View>
          {state.combos.length ? <Notice text="Elegí un combo al preparar la carga." /> : null}
          {!state.combos.length ? (
            <Empty title="Sin combos" detail="Crea tu primera carga frecuente." />
          ) : null}
        </>
      )}
      <Sheet
        visible={!!actions}
        title={actions?.nombreCombo || 'Acciones del combo'}
        onClose={() => setActions(null)}
      >
        {actions ? (
          <>
            <Button
              label="Editar combo"
              variant="secondary"
              onPress={() => {
                setError('');
                setDraft(JSON.parse(JSON.stringify(actions)));
                setActions(null);
              }}
            />
            <ConfirmButton
              label="Eliminar"
              title="Eliminar combo"
              confirmLabel="Eliminar combo"
              description="Las cargas ya preparadas conservarán sus materiales."
              onConfirm={async () => {
                await dispatch({ type: 'DELETE_COMBO', comboId: actions.id });
                setActions(null);
              }}
            />
          </>
        ) : null}
      </Sheet>
      <Sheet
        protectChanges
        hasChanges={
          !!draft &&
          (draft.nombreCombo !== (state.combos.find((c) => c.id === draft.id)?.nombreCombo || '') ||
            JSON.stringify(draft.items) !==
              JSON.stringify(state.combos.find((c) => c.id === draft.id)?.items || []))
        }
        busy={busy}
        visible={!!draft}
        title="Preparar combo"
        onClose={() => setDraft(null)}
      >
        {draft ? (
          <>
            <Field
              label="Nombre del combo"
              value={draft.nombreCombo}
              onChangeText={(nombreCombo) => setDraft({ ...draft, nombreCombo })}
            />
            <Select
              label="Material"
              value={selected || state.materiales[0]?.id || ''}
              options={state.materiales.map((m) => ({
                value: m.id,
                label: `${m.nombre} ${m.medida || ''}`,
              }))}
              onChange={setSelected}
            />
            <Button
              label="Agregar material"
              variant="secondary"
              onPress={() => {
                const selectedId = selected || state.materiales[0]?.id;
                if (!selectedId) return;
                const old = draft.items.find((i) => i.materialId === selectedId);
                setDraft({
                  ...draft,
                  items: old
                    ? draft.items.map((i) =>
                        i.materialId === selectedId ? { ...i, cantidad: i.cantidad + 1 } : i,
                      )
                    : [...draft.items, { materialId: selectedId, cantidad: 1 }],
                });
              }}
            />
            {draft.items.map((i) => (
              <View
                key={i.materialId}
                style={[
                  s.section,
                  { borderBottomWidth: 1, borderColor: C.hairline, paddingBottom: 16 },
                ]}
              >
                <Text style={s.body}>
                  {[
                    state.materiales.find((m) => m.id === i.materialId)?.nombre ||
                      'Material no disponible',
                    state.materiales.find((m) => m.id === i.materialId)?.medida,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                </Text>
                <SmartCounter
                  value={i.cantidad}
                  onChange={(cantidad) =>
                    setDraft({
                      ...draft,
                      items: draft.items.map((x) =>
                        x.materialId === i.materialId ? { ...x, cantidad } : x,
                      ),
                    })
                  }
                />
                <Button
                  label="Quitar"
                  variant="ghost"
                  onPress={() =>
                    setDraft({
                      ...draft,
                      items: draft.items.filter((x) => x.materialId !== i.materialId),
                    })
                  }
                />
              </View>
            ))}
            {error ? <Notice text={error} tone="error" /> : null}
            <Button
              label="Guardar combo"
              loading={busy}
              onPress={async () => {
                setBusy(true);
                try {
                  await dispatch({
                    type: 'SAVE_COMBO',
                    expectedVersion: draft.version || 0,
                    combo: { ...draft, items: draft.items.filter((i) => i.cantidad > 0) },
                  });
                  setDraft(null);
                } catch (e) {
                  setError(userError(e));
                } finally {
                  setBusy(false);
                }
              }}
            />
          </>
        ) : null}
      </Sheet>
    </Screen>
  );
}
