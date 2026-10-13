import { userError } from '../../src/services/errors';
import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Plus, Package, Warehouse, HardHat, Wrench, TriangleAlert } from 'lucide-react-native';
import type { MaterialItem, StockBucket, CategoriaMaterial } from '../../src/types';
import { useInventory, makeId } from '../../src/context/InventoryContext';
import { useAuth } from '../../src/context/AuthContext';
import {
  Button,
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
    { key: 'cantidadGalpon', label: 'En galpón', color: C.green, icon: Warehouse },
    { key: 'cantidadEnObra', label: 'En obra', color: C.blue, icon: HardHat },
    { key: 'cantidadEnTaller', label: 'En taller', color: C.orange, icon: Wrench },
    { key: 'cantidadPerdido', label: 'Perdido', color: C.danger, icon: TriangleAlert },
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
      title="El galpón"
      subtitle="Cada pieza tiene su lugar. Y su registro."
      scroll={false}
      action={
        user?.role === 'ADMIN' ? (
          <Button label="Nuevo material" icon={Plus} onPress={() => open(null, 'material')} />
        ) : undefined
      }
    >
      <DataList
        data={data}
        keyExtractor={(m) => m.id}
        ListHeaderComponent={
          <View style={{ gap: 20, paddingBottom: 20 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10 }}
            >
              {metrics.map((m) => (
                <View key={m.key} style={[s.card, { minWidth: 125, padding: 12, gap: 6 }]}>
                  <m.icon size={21} color={m.color} />
                  <Text style={{ color: C.text, fontSize: 28, fontWeight: '800' }}>
                    {state.materiales.reduce((n, i) => n + i[m.key], 0)}
                  </Text>
                  <Text style={s.muted}>{m.label}</Text>
                </View>
              ))}
            </ScrollView>
            <Field
              label="Buscar material"
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
          <Empty title="Sin materiales" detail="Cambia los filtros o agrega un material." />
        }
        renderItem={({ item: m }) => (
          <View style={[s.card, { marginBottom: 12 }]}>
            <View style={[s.row, { flexWrap: 'wrap' }]}>
              <Package size={22} color={C.subtle} />
              <View style={s.grow}>
                <Text style={s.h2}>
                  {m.nombre} {m.medida}
                </Text>
                <Text style={s.muted}>{labels[m.categoria]}</Text>
              </View>
              {user?.role === 'ADMIN' ? (
                <View style={s.wrap}>
                  <Button label="Editar" variant="ghost" onPress={() => open(m, 'material')} />
                  <Button
                    label="Mover stock"
                    variant="secondary"
                    onPress={() => open(m, 'movimiento')}
                  />
                  <Button label="Ajustar" variant="secondary" onPress={() => open(m, 'ajuste')} />
                </View>
              ) : null}
            </View>
            <View style={s.wrap}>
              {metrics.map((metric) => (
                <View key={metric.key} style={{ flex: 1, minWidth: 65, paddingVertical: 8 }}>
                  <Text style={{ fontSize: 22, fontWeight: '700', color: metric.color }}>
                    {m[metric.key]}
                  </Text>
                  <Text style={{ color: C.muted, fontSize: 11 }}>{metric.label}</Text>
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
                ? 'Editar material'
                : 'Nuevo material'
        }
        onClose={() => setModal('')}
      >
        {modal === 'material' ? (
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
            <Notice text="Las entregas y retiros se registran desde cada obra. Para devolver pérdidas/daños, usa Recuperar material." />
          </>
        )}
        {error ? <Notice text={error} tone="error" /> : null}
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
      </Sheet>
    </Screen>
  );
}
