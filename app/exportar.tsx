import { userError } from '../src/services/errors';
import React, { useState } from 'react';
import { View, Text, Platform, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Download, FileText } from 'lucide-react-native';
import { useInventory } from '../src/context/InventoryContext';
import { useAuth } from '../src/context/AuthContext';
import { Button, Field, Notice, Screen, Select, useUI } from '../src/components/ui';
import { exportDocument } from '../src/services/exportService';
import { businessDate, validDate } from '../src/domain/rules';
import { obraPresentationStatus } from '../src/utils/listPresentation';
export default function Export() {
  const { C, s } = useUI();
  const { obraId } = useLocalSearchParams<{ obraId?: string }>(),
    { state } = useInventory(),
    { user } = useAuth();
  const [format, setFormat] = useState<'excel' | 'word'>('excel');
  const [from, setFrom] = useState(''),
    [to, setTo] = useState(''),
    [status, setStatus] = useState('TODAS'),
    [selected, setSelected] = useState(obraId || state.obras[0]?.id || ''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [success, setSuccess] = useState('');
  const selection = selected || obraId || state.obras[0]?.id || '';
  const run = async (kind: 'excel' | 'word') => {
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      if (kind === 'excel') {
        if (from) validDate(from);
        if (to) validDate(to);
        if (from && to && from > to) throw new Error('Rango de fechas inválido.');
      }
      const today = businessDate();
      const obras =
        kind === 'word'
          ? state.obras.filter((o) => o.id === selection)
          : state.obras.filter(
              (o) =>
                (!from || o.fechaEntrega >= from) &&
                (!to || o.fechaEntrega <= to) &&
                (status === 'TODAS' || obraPresentationStatus(o, today).key === status),
            );
      setSuccess(await exportDocument(kind, obras, user!, { from, to, status }));
    } catch (e) {
      setError(userError(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen
      title="Documentos"
      subtitle={
        'Remitos Word y reportes Excel, generados en este teléfono.'
      }
      back
      footer={
        user?.role === 'ADMIN' ? (
          <Button
            label={format === 'excel' ? 'Exportar Excel' : 'Generar remito'}
            icon={format === 'excel' ? Download : FileText}
            loading={busy}
            onPress={() => run(format)}
          />
        ) : undefined
      }
    >
      {user?.role !== 'ADMIN' ? (
        <Notice text="Solo administración puede exportar documentos." />
      ) : (
        <>
          <View
            accessibilityRole="tablist"
            style={{
              flexDirection: 'row',
              padding: 4,
              gap: 4,
              backgroundColor: C.panel,
              borderWidth: 1,
              borderColor: C.line,
              borderRadius: 12,
            }}
          >
            {(['excel', 'word'] as const).map((kind) => (
              <Pressable
                key={kind}
                accessibilityRole="tab"
                accessibilityLabel={kind === 'excel' ? 'Excel' : 'Word'}
                accessibilityState={{ selected: format === kind, disabled: busy }}
                disabled={busy}
                onPress={() => setFormat(kind)}
                style={{
                  flex: 1,
                  minHeight: 48,
                  padding: 12,
                  borderRadius: 8,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: format === kind ? C.selection : 'transparent',
                }}
              >
                <Text style={[s.label, { color: format === kind ? C.link : C.muted }]}>
                  {kind === 'excel' ? 'Excel' : 'Word'}
                </Text>
              </Pressable>
            ))}
          </View>
          {format === 'excel' ? (
            <View style={s.section}>
              <Text accessibilityRole="header" style={s.h2}>
                Reporte logístico
              </Text>
              <Field
                label="Entrega desde · AAAA-MM-DD"
                value={from}
                onChangeText={setFrom}
                placeholder="Sin límite"
              />
              <Field
                label="Entrega hasta · AAAA-MM-DD"
                value={to}
                onChangeText={setTo}
                placeholder="Sin límite"
              />
              <Select
                label="Estado"
                value={status}
                options={[
                  { value: 'TODAS', label: 'Todos' },
                  { value: 'ROJO', label: 'Vencido' },
                  { value: 'AMARILLO', label: 'Retiro hoy' },
                  { value: 'VERDE', label: 'Al día' },
                  { value: 'SIN_FECHA', label: 'Sin fecha de retiro' },
                  { value: 'PENDIENTE', label: 'Por entregar' },
                  { value: 'RETIRADO', label: 'Retirado' },
                  { value: 'REINGRESADO', label: 'Reingresado' },
                ]}
                onChange={setStatus}
              />
            </View>
          ) : (
            <View style={s.section}>
              <Text accessibilityRole="header" style={s.h2}>
                Remito institucional
              </Text>
              <Select
                label="Alquiler"
                value={selection}
                options={state.obras.map((o) => ({ value: o.id, label: o.clienteNombre }))}
                onChange={setSelected}
              />
            </View>
          )}
          <Notice
            text={
              Platform.OS === 'web'
                ? 'Excel y Word se generan en este dispositivo.'
                : 'Excel y Word se generan en este teléfono y se comparten con las aplicaciones instaladas.'
            }
          />
          {error ? <Notice text={error} tone="error" /> : null}
          {success ? <Notice text={success} tone="success" /> : null}
          <Text
            style={[
              s.muted,
              {
                borderTopWidth: 1,
                borderTopColor: C.hairline,
                paddingTop: 20,
                textAlign: 'center',
              },
            ]}
          >
            El remito Word conserva el formato institucional.
          </Text>
        </>
      )}
    </Screen>
  );
}
