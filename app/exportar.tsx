import React, { useState } from 'react';
import { View, Text, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Download, FileText } from 'lucide-react-native';
import { useInventory } from '../src/context/InventoryContext';
import { useAuth } from '../src/context/AuthContext';
import { Button, Field, Notice, Screen, Select, s } from '../src/components/ui';
import { exportDocument } from '../src/services/exportService';
import { DATA_MODE } from '../src/services/firebase';
import { obraStatus, validDate } from '../src/domain/rules';
export default function Export() {
  const { obraId } = useLocalSearchParams<{ obraId?: string }>(),
    { state } = useInventory(),
    { user } = useAuth();
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
      if (from) validDate(from);
      if (to) validDate(to);
      if (from && to && from > to) throw new Error('Rango de fechas inválido.');
      const obras =
        kind === 'word'
          ? state.obras.filter((o) => o.id === selection)
          : state.obras.filter(
              (o) =>
                (!from || o.fechaEntrega >= from) &&
                (!to || o.fechaEntrega <= to) &&
                (status === 'TODAS' || obraStatus(o).key === status),
            );
      setSuccess(await exportDocument(kind, obras, user!, { from, to, status }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen title="Documentos" subtitle="Reportes y remitos con identidad Chema." back>
      <View style={[s.card, { maxWidth: 750 }]}>
        {user?.role !== 'ADMIN' ? (
          <Notice text="Solo administración puede exportar documentos." />
        ) : (
          <>
            <Notice
              text={
                DATA_MODE === 'demo'
                  ? Platform.OS === 'web'
                    ? 'Demo web: Excel y Word se generan localmente con tus datos. No se envían a la nube.'
                    : 'Demo móvil: usa la demo web para documentos locales o configura Cloud Functions.'
                  : 'Generación privada en Cloud Functions. El archivo requiere autenticación y se elimina automáticamente.'
              }
            />
            <Text style={s.h2}>Reporte logístico · Excel</Text>
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
                { value: 'PENDIENTE', label: 'Por entregar' },
                { value: 'RETIRADO', label: 'Retirado' },
                { value: 'REINGRESADO', label: 'Reingresado' },
              ]}
              onChange={setStatus}
            />
            <Button
              label="Exportar Excel"
              icon={Download}
              loading={busy}
              onPress={() => void run('excel')}
            />
            <View style={s.divider} />
            <Text style={s.h2}>Remito institucional · Word</Text>
            <Select
              label="Obra"
              value={selection}
              options={state.obras.map((o) => ({ value: o.id, label: o.clienteNombre }))}
              onChange={setSelected}
            />
            <Button
              label="Generar remito"
              icon={FileText}
              variant="secondary"
              loading={busy}
              onPress={() => void run('word')}
            />
            {error ? <Notice text={error} tone="error" /> : null}
            {success ? <Notice text={success} tone="success" /> : null}
          </>
        )}
      </View>
    </Screen>
  );
}
