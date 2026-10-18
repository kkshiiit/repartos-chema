import { userError } from '../../src/services/errors';
import React, { useState } from 'react';
import { View, Text, ScrollView, useWindowDimensions } from 'react-native';
import {
  Plus,
  Package,
  Warehouse,
  HardHat,
  Wrench,
  TriangleAlert,
  MoreHorizontal,
} from 'lucide-react-native';
import type { MaterialItem, StockBucket, CategoriaMaterial } from '../../src/types';
import { useInventory, makeId } from '../../src/context/InventoryContext';
import { useAuth } from '../../src/context/AuthContext';
import {
  Button,
  IconButton,
  ConfirmButton,
  Chip,
  Empty,
  Field,
  Notice,
  Screen,
  Select,
  Sheet,
  useUI,
} from '../../src/components/ui';
import { DataList } from '../../src/components/DataList';
import { ScaffoldSelector } from '../../src/components/ScaffoldSelector';
import { spacing } from '../../src/theme/tokens';
export default function WarehousePage() {
  const { C, s } = useUI();
  const narrow = useWindowDimensions().width < 390;
  const { state, dispatch } = useInventory(),
    { user } = useAuth();
  const [query, setQuery] = useState(''),
    [category, setCategory] = useState('TODAS'),
    [modal, setModal] = useState(''),
    [edit, setEdit] = useState<MaterialItem | null>(null),
    [nombre, setNombre] = useState(''),
    [cat, setCat] = useState<CategoriaMaterial>('ANDAMIOS'),
    [medida, setMedida] = useState(''),
    [bucket, setBucket] = useState<StockBucket>('cantidadGalpon'),
    [destination, setDestination] = useState<StockBucket>('cantidadGalpon'),
    [delta, setDelta] = useState(''),
    [reason, setReason] = useState(''),
    [source, setSource] = useState(''),
    [error, setError] = useState('');
  const categories = ['ANDAMIOS', 'TABLONES', 'ACCESORIOS', 'OTROS'];
  const labels: Record<string, string> = {
    TODAS: 'Todos',
    ANDAMIOS: 'Andamios',
    TABLONES: 'Tablones',
    ACCESORIOS: 'Accesorios',
    OTROS: 'Otros',
  };
  const metrics = [
    { key: 'cantidadGalpon', label: 'Disponibles', color: C.green, icon: Warehouse },
    { key: 'cantidadEnObra', label: 'Alquilados', color: C.blue, icon: HardHat },
    { key: 'cantidadEnTaller', label: 'A reparar', color: C.orange, icon: Wrench },
    {
      key: 'cantidadPerdido',
      label: 'Perdido',
      color: C.danger,
      icon: TriangleAlert,
    },
  ] as const;
  const data = state.materiales.filter(
    (m) =>
      (category === 'TODAS' || category === m.categoria) &&
      `${m.nombre} ${m.medida}`.toLowerCase().includes(query.toLowerCase()),
  );
  const open = (m: MaterialItem | null, mode: string) => {
    setEdit(m);
    setNombre(m?.nombre || '');
    setCat(m?.categoria || 'ANDAMIOS');
    setMedida(m?.medida || '');
    setError('');
    setDelta('');
    setReason('');
    setSource('');
    setModal(mode);
  };
  return (
    <Screen
      title="Depósito"
      scroll={false}
      footer={
        user?.role === 'ADMIN' ? (
          <Button label="Agregar material" icon={Plus} onPress={() => open(null, 'material')} />
        ) : undefined
      }
    >
      <DataList
        data={data}
        keyExtractor={(m) => m.id}
        ListHeaderComponent={
          <View style={{ gap: spacing.md, paddingBottom: spacing.lg }}>
            <Text style={s.muted}>
              {state.materiales.length} tipos de pieza ·{' '}
              {state.materiales.filter((m) => m.cantidadGalpon > 0).length} con stock disponible
            </Text>
            <Field
              label="Buscar pieza"
              value={query}
              onChangeText={setQuery}
              placeholder="Nombre o medida"
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.sm }}
            >
              {['TODAS', ...categories].map((c) => (
                <Chip
                  key={c}
                  label={labels[c]!}
                  selected={category === c}
                  onPress={() => setCategory(c)}
                />
              ))}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <Empty title="Sin piezas" detail="Cambia los filtros o agrega una pieza." />
        }
        ItemSeparatorComponent={() => <View style={s.divider} />}
        renderItem={({ item: m }) => (
          <View
            style={{
              backgroundColor: C.panel,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.lg,
              gap: spacing.sm,
            }}
          >
            <View
              style={[
                s.row,
                {
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: narrow ? spacing.xs : spacing.sm,
                },
              ]}
            >
              {!narrow ? <Package size={24} color={C.subtle} /> : null}
              <View style={[s.grow, { gap: spacing.xs, minWidth: spacing.touch + spacing.xxl }]}>
                <Text style={[s.body, { fontWeight: '700' }]}>{m.nombre}</Text>
                {m.medida ? <Text style={s.body}>{m.medida}</Text> : null}
              </View>
              <View style={{ alignItems: 'flex-end', gap: spacing.xs, flexShrink: 1 }}>
                <Text style={[s.h2, { fontVariant: ['tabular-nums'] }]}>{m.cantidadGalpon}</Text>
                <Text style={[s.muted, narrow && { fontSize: 12, lineHeight: 17 }]}>
                  Disponibles
                </Text>
              </View>
              {user?.role === 'ADMIN' ? (
                <IconButton
                  label={`Opciones de ${m.nombre} ${m.medida || ''}`}
                  icon={MoreHorizontal}
                  onPress={() => open(m, 'opciones')}
                />
              ) : null}
            </View>
            <Text style={[s.muted, { fontVariant: ['tabular-nums'] }]}>
              {m.cantidadEnObra} alquilados · {m.cantidadEnTaller} a reparar · {m.cantidadPerdido}{' '}
              perdidos
            </Text>
          </View>
        )}
      />
      <Sheet
        visible={!!modal}
        title={
          modal === 'opciones'
            ? 'Opciones de la pieza'
            : modal === 'movimiento'
              ? 'Mover existencias'
              : modal === 'ajuste'
                ? 'Ajuste de inventario'
                : edit
                  ? 'Editar pieza'
                  : 'Agregar pieza'
        }
        protectChanges={modal !== 'opciones'}
        onClose={() => setModal('')}
      >
        {modal === 'opciones' ? (
          <View style={s.section}>
            <Text style={s.h2}>
              {edit?.nombre} {edit?.medida}
            </Text>
            <Button label="Editar" variant="secondary" onPress={() => setModal('material')} />
            <Button
              label="Mover stock"
              variant="secondary"
              onPress={() => setModal('movimiento')}
            />
            <Button label="Ajustar" variant="secondary" onPress={() => setModal('ajuste')} />
          </View>
        ) : modal === 'material' ? (
          <>
            <Field label="Nombre del material" value={nombre} onChangeText={setNombre} />
            <Select
              label="Categoría"
              value={cat}
              options={categories.map((c) => ({ label: labels[c]!, value: c }))}
              onChange={(v) => setCat(v as CategoriaMaterial)}
            />
            <ScaffoldSelector value={medida} onChange={setMedida} />
            <Notice text="El stock inicial es cero. Registra un ajuste con procedencia para dar de alta existencias." />
          </>
        ) : (
          <>
            <Text style={s.h2}>{edit?.nombre}</Text>
            <Select
              label="Existencia a ajustar"
              value={bucket}
              options={metrics
                .filter((m) => m.key !== 'cantidadEnObra')
                .map((m) => ({ value: m.key, label: m.label }))}
              onChange={(v) => setBucket(v as StockBucket)}
            />
            {modal === 'movimiento' ? (
              <Select
                label="Destino del material"
                value={destination}
                onChange={(v) => setDestination(v as StockBucket)}
                options={metrics
                  .filter((m) => m.key !== 'cantidadEnObra')
                  .map((m) => ({ value: m.key, label: m.label }))}
              />
            ) : null}
            <Field
              label={modal === 'movimiento' ? 'Cantidad a mover' : 'Diferencia entera (+ o −)'}
              value={delta}
              onChangeText={setDelta}
              keyboardType="numbers-and-punctuation"
              placeholder="Ej. 20 o -3"
            />
            {modal !== 'movimiento' ? (
              <Field
                label="Procedencia / destino"
                value={source}
                onChangeText={setSource}
                placeholder="Compra, devolución externa o baja"
              />
            ) : null}
            <Field label="Motivo y comprobante" value={reason} onChangeText={setReason} />
            <Notice text="Las entregas y retiros se registran desde cada alquiler. Para devolver pérdidas/daños, usa Recuperar material." />
          </>
        )}
        {error ? <Notice text={error} tone="error" /> : null}
        {modal !== 'opciones' ? (
          <ConfirmButton
            label="Guardar cambios"
            title="Confirmar inventario"
            description={
              modal === 'material'
                ? `Guardar ${nombre} ${medida}. Las cantidades no cambian.`
                : `${edit?.nombre}: ${delta} unidades. Origen ${bucket}; destino ${modal === 'movimiento' ? destination : source}. Motivo: ${reason}.`
            }
            variant="primary"
            onConfirm={async () => {
              try {
                if (modal === 'material')
                  await dispatch({
                    type: 'SAVE_MATERIAL',
                    expectedVersion: edit?.version || 0,
                    material: {
                      id: edit?.id || makeId(),
                      nombre: nombre.trim(),
                      categoria: cat,
                      medida: medida.trim(),
                    },
                  });
                else {
                  if (!/^[+-]?\d+$/.test(delta)) throw new Error('Usa una diferencia entera.');
                  if (modal === 'movimiento')
                    await dispatch({
                      type: 'MOVE_STOCK',
                      materialId: edit!.id,
                      origen: bucket,
                      destino: destination,
                      cantidad: Number(delta),
                      motivo: reason,
                    });
                  else
                    await dispatch({
                      type: 'ADJUST',
                      materialId: edit!.id,
                      bucket,
                      delta: Number(delta),
                      motivo: reason,
                      procedencia: source,
                    });
                }
                setModal('');
              } catch (e) {
                setError(userError(e));
                throw e;
              }
            }}
          />
        ) : null}
      </Sheet>
    </Screen>
  );
}
