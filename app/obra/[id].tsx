import { userError } from '../../src/services/errors';
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Camera,
  ImagePlus,
  MapPin,
  Navigation,
  MessageCircle,
  Pencil,
  Package,
  Truck,
  ArrowRightLeft,
  Download,
} from 'lucide-react-native';
import * as Location from 'expo-location';
import { useInventory, makeId } from '../../src/context/InventoryContext';
import { useAuth } from '../../src/context/AuthContext';
import {
  Button,
  ConfirmButton,
  Empty,
  Field,
  Notice,
  Screen,
  Sheet,
  Select,
  useUI,
} from '../../src/components/ui';
import { PhotoImage } from '../../src/components/PhotoImage';
import { deleteLocalPhoto } from '../../src/services/photoCache';
import { StatusChip } from '../../src/components/StatusChip';
import { SmartCounter } from '../../src/components/SmartCounter';
import { LoadEditor } from '../../src/components/LoadEditor';
import { OperationForm } from '../../src/components/OperationForm';
import { mapsUrl, whatsappUrl } from '../../src/utils/whatsapp';
import { openLink } from '../../src/services/links';
import { selectPhoto } from '../../src/services/storageService';
import { DATA_MODE } from '../../src/services/firebase';
export default function Detail() {
  const { C, s } = useUI();
  const { id, accion } = useLocalSearchParams<{ id: string; accion?: string }>(),
    { state, dispatch } = useInventory(),
    { user } = useAuth();
  const o = state.obras.find((o) => o.id === id);
  const [modal, setModal] = useState(accion === 'entrega' || accion === 'retiro' ? accion : ''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [recoveryDestination, setRecoveryDestination] = useState('galpon'),
    [recoverId, setRecoverId] = useState(''),
    [n, setN] = useState(1),
    [reason, setReason] = useState(''),
    [lat, setLat] = useState(''),
    [lng, setLng] = useState('');
  const run = async (f: () => Promise<unknown>) => {
    setBusy(true);
    setError('');
    try {
      await f();
    } catch (e) {
      setError(userError(e));
    } finally {
      setBusy(false);
    }
  };
  if (!o)
    return (
      <Screen title="Detalle de obra" back>
        <Empty title="Obra no encontrada" detail="Vuelve al listado de obras." />
      </Screen>
    );
  const incident = o.faltantesRegistrados?.find((i) => i.id === recoverId);
  return (
    <Screen
      title={o.clienteNombre}
      subtitle={`${o.direccion} · ${o.localidadBarrio}`}
      back
      action={<StatusChip obra={o} />}
    >
      <View style={[s.wrap, { gap: 16 }]}>
        <View
          style={{
            flexGrow: 2,
            flexBasis: 500,
            flexShrink: 1,
            minWidth: 0,
            maxWidth: '100%',
            gap: 20,
          }}
        >
          <View style={s.card}>
            <Text style={s.h2}>Operación</Text>
            <View style={s.wrap}>
              {o.estadoProceso === 'PENDIENTE_ENTREGA' ? (
                <Button label="Entregar" icon={Truck} onPress={() => setModal('entrega')} />
              ) : o.estadoProceso === 'ENTREGADO' ? (
                <>
                  <Button label="Retirar" icon={Truck} onPress={() => setModal('retiro')} />
                  <Button
                    label="Con faltante"
                    variant="secondary"
                    onPress={() => setModal('faltante')}
                  />
                  <Button
                    label="Triangular"
                    icon={ArrowRightLeft}
                    variant="secondary"
                    onPress={() => setModal('transferencia')}
                  />
                </>
              ) : (
                <>
                  {o.estadoProceso === 'RETIRADO' ? (
                    <ConfirmButton
                      label="Reingresar"
                      title="Cerrar reingreso"
                      description="El inventario ya se distribuyó al confirmar el retiro. Este paso cierra la revisión, sin volver a sumar material."
                      variant="primary"
                      onConfirm={() => dispatch({ type: 'REENTER', obraId: o.id })}
                    />
                  ) : null}
                  {user?.role === 'ADMIN' ? (
                    <ConfirmButton
                      label="Reactivar"
                      title="Preparar nueva entrega"
                      description="El alquiler volverá a pendiente. Revisa fechas y carga antes de entregar de nuevo."
                      variant="secondary"
                      onConfirm={() => dispatch({ type: 'REACTIVATE', obraId: o.id })}
                    />
                  ) : null}
                </>
              )}
            </View>
            <View style={s.divider} />
            <View style={s.wrap}>
              <Button
                label="GPS"
                icon={Navigation}
                variant="secondary"
                onPress={() => void run(() => openLink(mapsUrl(o)))}
              />
              <Button
                label="Remito WhatsApp"
                icon={MessageCircle}
                variant="secondary"
                onPress={() => void run(() => openLink(whatsappUrl(o)))}
              />
              {user?.role === 'ADMIN' ? (
                <Button
                  label="Documento"
                  icon={Download}
                  variant="secondary"
                  onPress={() => router.push(`/exportar?obraId=${o.id}`)}
                />
              ) : null}
            </View>
            {error ? <Notice text={error} tone="error" /> : null}
          </View>
          <View style={s.card}>
            <View style={[s.row, { justifyContent: 'space-between', flexWrap: 'wrap' }]}>
              <Text style={s.h2}>Materiales de la carga</Text>
              {user?.role === 'ADMIN' && o.estadoProceso === 'PENDIENTE_ENTREGA' ? (
                <Button
                  label="Preparar carga"
                  icon={Package}
                  variant="secondary"
                  onPress={() => setModal('carga')}
                />
              ) : null}
            </View>
            {o.materialesCargados.length ? (
              o.materialesCargados.map((m) => (
                <View key={m.materialId} style={{ gap: 9 }}>
                  <View style={[s.row, { justifyContent: 'space-between' }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.body}>
                        {m.nombre} {m.medida}
                      </Text>
                      {m.apodo ? <Text style={s.muted}>{m.apodo}</Text> : null}
                    </View>
                    <Text style={{ color: C.text, fontSize: 21, fontWeight: '700' }}>
                      ×{m.cantidad}
                    </Text>
                  </View>
                  <Text style={s.muted}>
                    {o.saldosEnObra[m.materialId] || 0} actualmente alquiladas
                  </Text>
                  <View style={s.divider} />
                </View>
              ))
            ) : (
              <Text style={s.muted}>Prepara una carga o recibe una triangulación.</Text>
            )}
          </View>
          <View style={s.card}>
            <Text style={s.h2}>Faltantes y recuperaciones</Text>
            {o.faltantesRegistrados?.length ? (
              o.faltantesRegistrados.map((i) => (
                <View key={i.id} style={{ gap: 8 }}>
                  <Text style={s.body}>
                    {i.itemNombre} · {i.tipo === 'DANADO' ? 'Dañado' : 'Perdido'}
                  </Text>
                  <Text style={s.muted}>
                    {i.cantidad} registrados · {i.recuperado} recuperados · {i.notas || 'Sin notas'}
                  </Text>
                  {i.recuperado < i.cantidad ? (
                    <Button
                      label="Recuperar material"
                      variant="secondary"
                      onPress={() => {
                        setRecoverId(i.id);
                        setN(1);
                        setReason('');
                        setModal('recuperar');
                      }}
                    />
                  ) : null}
                </View>
              ))
            ) : (
              <Text style={s.muted}>Sin faltantes registrados.</Text>
            )}
            {state.notificaciones
              .filter((n) => n.obraId === o.id)
              .map((n) => (
                <Notice
                  key={n.id}
                  text={`Aviso a administración: ${n.status === 'SENT' ? 'aceptado por FCM (entrega al dispositivo no garantizada)' : n.status === 'EXHAUSTED' ? 'reintentos agotados; solicita revisión administrativa' : n.status === 'FAILED' ? `fallido · ${n.error || 'reintento pendiente'}` : 'pendiente; no enviado'}`}
                />
              ))}
          </View>
          <View style={s.card}>
            <Text style={s.h2}>Registro fotográfico</Text>
            <Text style={s.muted}>
              {DATA_MODE === 'demo'
                ? 'Fotos locales; no se respaldan en nube. Al borrar datos de la app o del navegador se pierden.'
                : 'Fotos en cola hasta completar subida y registro. Mantén la app abierta para sincronizar.'}
            </Text>
            <View style={s.wrap}>
              <Button
                label="Tomar foto"
                icon={Camera}
                loading={busy}
                variant="secondary"
                onPress={() =>
                  void run(async () => {
                    const photo = await selectPhoto(makeId(), user!.uid, true);
                    if (photo) await dispatch({ type: 'PHOTO', obraId: o.id, photo });
                  })
                }
              />
              <Button
                label="Elegir foto"
                icon={ImagePlus}
                disabled={busy}
                variant="secondary"
                onPress={() =>
                  void run(async () => {
                    const photo = await selectPhoto(makeId(), user!.uid);
                    if (photo) await dispatch({ type: 'PHOTO', obraId: o.id, photo });
                  })
                }
              />
            </View>
            <View style={s.wrap}>
              {o.fotos?.map((p) => (
                <View key={p.id} style={{ width: 150, gap: 8 }}>
                  <PhotoImage photo={p} />
                  <Text style={s.muted}>
                    {p.status === 'PENDING' ? 'Subida pendiente' : 'Foto en nube'}
                  </Text>
                  {user?.role === 'ADMIN' || p.usuarioUid === user?.uid ? (
                    <ConfirmButton
                      label="Borrar foto"
                      title="Eliminar foto"
                      description="Se quitará del registro. La limpieza del archivo remoto se procesa por el servidor."
                      onConfirm={async () => {
                        await dispatch({ type: 'DELETE_PHOTO', obraId: o.id, photoId: p.id });
                        if (DATA_MODE === 'demo' || p.status === 'SYNCED')
                          await deleteLocalPhoto(p.id);
                      }}
                    />
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        </View>
        <View
          style={{
            flexGrow: 1,
            flexBasis: 270,
            flexShrink: 1,
            minWidth: 0,
            maxWidth: '100%',
            gap: 20,
          }}
        >
          <View style={s.card}>
            <Text style={s.h2}>Datos de el alquiler</Text>
            <Info label="ENTREGA PREVISTA" value={o.fechaEntrega} />
            <Info
              label="ENTREGA EFECTIVA"
              value={o.fechaEntregaEfectiva || 'Sin registro efectivo separado'}
            />
            {o.observaciones ? <Info label="OBSERVACIONES" value={o.observaciones} /> : null}
            <Info label="RETIRO ESTIMADO" value={o.fechaRetiroEstimada} />
            {o.fechaRetiroEfectiva ? (
              <Info label="RETIRO EFECTIVO" value={o.fechaRetiroEfectiva} />
            ) : null}
            <Info label="TELÉFONO" value={o.clienteTelefono || 'Sin teléfono'} />
            <Info label="RECIBIÓ" value={o.recibidoPor || 'Sin registrar'} />
            <Info label="ENTREGADO POR" value={o.entregadoPor?.join(', ') || 'Por asignar'} />
            <Info label="RETIRADO POR" value={o.retiradoPor?.join(', ') || 'Por asignar'} />
            {user?.role === 'ADMIN' ? (
              <Button
                label="Editar datos"
                icon={Pencil}
                variant="secondary"
                onPress={() => router.push(`/obra/editar?id=${o.id}`)}
              />
            ) : null}
            <Button
              label="Ubicación"
              icon={MapPin}
              variant="secondary"
              onPress={() => {
                setLat(String(o.coordenadas?.lat ?? ''));
                setLng(String(o.coordenadas?.lng ?? ''));
                setModal('ubicacion');
              }}
            />
            <Notice
              text={
                o.syncStatus === 'PENDING'
                  ? '☁️⏳ Pendiente de nube. El cambio está guardado en este dispositivo.'
                  : 'Confirmado por el servidor.'
              }
            />
          </View>
          {user?.role === 'ADMIN' ? (
            <ConfirmButton
              label="Eliminar alquiler"
              title="Eliminar este alquiler"
              description="Solo se permite sin alquiler activo, fotos ni faltantes abiertos. Se conservará la evidencia en el historial."
              onConfirm={async () => {
                await dispatch({ type: 'DELETE_OBRA', obraId: o.id });
                router.replace('/');
              }}
            />
          ) : null}
        </View>
      </View>
      <Sheet
        visible={!!modal}
        title={
          {
            carga: 'Preparar carga',
            entrega: 'Confirmar entrega',
            retiro: 'Inspección de retiro',
            faltante: 'Registrar faltante',
            transferencia: 'Triangulación directa',
            recuperar: 'Devolver al depósito',
            ubicacion: 'Ubicación de obra',
          }[modal] || 'Operación'
        }
        onClose={() => setModal('')}
      >
        {modal === 'carga' ? <LoadEditor obra={o} onDone={() => setModal('')} /> : null}
        {['entrega', 'retiro', 'faltante', 'transferencia'].includes(modal) ? (
          <OperationForm obra={o} mode={modal as 'entrega'} onDone={() => setModal('')} />
        ) : null}
        {modal === 'recuperar' && incident ? (
          <>
            <Text style={s.body}>
              {incident.itemNombre} · {incident.cantidad - incident.recuperado} pendientes
            </Text>
            <SmartCounter value={n} max={incident.cantidad - incident.recuperado} onChange={setN} />
            {user?.role === 'ADMIN' && incident.materialId ? (
              <Select
                label="Ubicación real"
                value={recoveryDestination}
                onChange={setRecoveryDestination}
                options={[
                  { value: 'galpon', label: 'Recuperado al depósito' },
                  ...(o.estadoProceso === 'ENTREGADO'
                    ? [{ value: 'obra', label: 'Sigue alquiladas · corregir error' }]
                    : []),
                  { value: 'taller', label: 'En taller · corregir tipo' },
                  { value: 'perdido', label: 'Perdido · corregir tipo' },
                ]}
              />
            ) : null}
            <Field label="Motivo de recuperación" value={reason} onChangeText={setReason} />
            <Button
              label="Confirmar devolución"
              loading={busy}
              onPress={() =>
                void run(async () => {
                  await dispatch({
                    ...(recoveryDestination === 'galpon'
                      ? { type: 'RECOVER' as const }
                      : {
                          type: 'CORRECT_INCIDENT' as const,
                          destino: recoveryDestination as 'obra' | 'taller' | 'perdido',
                        }),
                    obraId: o.id,
                    incidentId: recoverId,
                    cantidad: n,
                    motivo: reason,
                  });
                  setModal('');
                })
              }
            />
          </>
        ) : null}
        {modal === 'ubicacion' ? (
          <>
            <Button
              label="Usar mi GPS"
              loading={busy}
              variant="secondary"
              onPress={() =>
                void run(async () => {
                  const permission = await Location.requestForegroundPermissionsAsync();
                  if (!permission.granted)
                    throw new Error('Sin permiso de ubicación. Ingresa coordenadas manualmente.');
                  const p = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                  });
                  setLat(String(p.coords.latitude));
                  setLng(String(p.coords.longitude));
                })
              }
            />
            <Notice text="Usa tu GPS solo si estás físicamente en este alquiler. También puedes ingresar coordenadas manualmente." />
            <Field
              label="Latitud"
              value={lat}
              onChangeText={setLat}
              keyboardType="numbers-and-punctuation"
            />
            <Field
              label="Longitud"
              value={lng}
              onChangeText={setLng}
              keyboardType="numbers-and-punctuation"
            />
            <Button
              label="Guardar ubicación"
              loading={busy}
              onPress={() =>
                void run(async () => {
                  if (!lat.trim() || !lng.trim()) throw new Error('Completa ambas coordenadas.');
                  await dispatch({
                    type: 'LOCATION',
                    obraId: o.id,
                    coordenadas: { lat: Number(lat), lng: Number(lng) },
                  });
                  setModal('');
                })
              }
            />
          </>
        ) : null}
        {error ? <Notice text={error} tone="error" /> : null}
      </Sheet>
    </Screen>
  );
}
function Info({ label, value }: { label: string; value: string }) {
  const { s } = useUI();
  return (
    <View style={{ gap: 5 }}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.body}>{value}</Text>
    </View>
  );
}
