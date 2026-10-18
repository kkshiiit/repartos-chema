import { userError } from '../../src/services/errors';
import React, { useState } from 'react';
import { View, Text } from 'react-native';
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
export default function WarehousePage() {
  const { C, s } = useUI();
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
      MoreHorizontal,
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
      action={
        user?.role === 'ADMIN' ? (
          <Button label="Agregar" icon={Plus} onPress={() => open(null, 'material')} />
        ) : undefined
      }
    >
      <DataList
        data={data}
        keyExtractor={(m) => m.id}
        ListHeaderComponent={
          <View style={{ gap: 20, paddingBottom: 20 }}>
            <View style={[s.row, { flexWrap: 'wrap', gap: 16 }]}>
              {metrics.map((m) => (
                <View key={m.key} style={{ minWidth: 100, flex: 1, gap: 4 }}>
                  <Text style={[s.h2, { fontVariant: ['tabular-nums'], color: m.color }]}>
                    {state.materiales.reduce((n, i) => n + i[m.key], 0)}
                  </Text>
                  <Text style={s.muted}>{m.label}</Text>
                </View>
              ))}
            </View>
            <Field
              label="Buscar pieza"
              value={query}
              onChangeText={setQuery}
              placeholder="Nombre o medida"
            />
            <View style={s.wrap}>
              {['TODAS', ...categories].map((c) => (
                <Chip
                  key={c}
                  label={labels[c]!}
                  selected={category === c}
                  onPress={() => setCategory(c)}
                />
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          <Empty title="Sin piezas" detail="Cambia los filtros o agrega una pieza." />
        }
        renderItem={({ item: m }) => (
          <View style={[s.card, { marginBottom: 12, gap: 12 }]}>
            <View style={[s.row, { alignItems: 'flex-start' }]}>
              <Package size={22} color={C.subtle} />
              <View style={s.grow}>
                <Text style={s.h2}>
                  {m.nombre} {m.medida}
                </Text>
                <Text style={s.muted}>{labels[m.categoria]}</Text>
              </View>
            </View>
            {user?.role === 'ADMIN' ? (
              <IconButton
                label={`Opciones de ${m.nombre} ${m.medida || ''}`}
                icon={MoreHorizontal}
                onPress={() => open(m, 'opciones')}
              />
            ) : null}
            <View style={s.wrap}>
              {metrics.map((metric) => (
                <View key={metric.key} style={{ flex: 1, minWidth: 65, paddingVertical: 8 }}>
                  <Text style={{ fontSize: 22, fontWeight: '700', color: metric.color }}>
                    {m[metric.key]}
                  </Text>
                  <Text style={{ color: C.muted, fontSize: 14 }}>{metric.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      />
      <Sheet
        visible={!!modal}
        title={
          modal === 'movimiento'
            ? 'Mover existencias'
            : modal === 'ajuste'
              ? 'Ajuste de inventario'
              : edit
                ? 'Editar pieza'
                : 'Agregar pieza'
        }
        protectChanges
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
