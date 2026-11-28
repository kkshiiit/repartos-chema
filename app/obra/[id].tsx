import { Disclosure } from '../../src/components/Editorial';
import { RentalReminderPanel } from '../../src/components/RentalReminderPanel';
import { userError } from '../../src/services/errors';
import React, { useRef, useState } from 'react';
import { View, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Camera,
  ImagePlus,
  MapPin,
  Pencil,
  Package,
  Truck,
  ArrowRightLeft,
  CalendarDays,
  ArrowRight,
  MoreHorizontal,
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
import { ContactBar, NextStep } from '../../src/components/RentalHeader';
import { rentalTaskForDate } from '../../src/utils/listPresentation';
import { fonts } from '../../src/theme/tokens';
import { DeleteRentalButton } from '../../src/components/DeleteRentalButton';
import { StatusChip } from '../../src/components/StatusChip';
import { SmartCounter } from '../../src/components/SmartCounter';
import { LoadEditor } from '../../src/components/LoadEditor';
import { OperationForm } from '../../src/components/OperationForm';
import { selectPhoto } from '../../src/services/storageService';
import { businessDate } from '../../src/domain/rules';
import { useBusinessClock } from '../../src/hooks/useBusinessClock';
import { retirementCountdown } from '../../src/utils/retirementCalendar';
import { formatDate } from '../../src/utils/formatters';
export default function Detail() {
  const { C, s } = useUI();
  const now = useBusinessClock();
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
  const running = useRef(false);
  const run = async (f: () => Promise<unknown>) => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError('');
    try {
      await f();
    } catch (e) {
      setError(userError(e));
      setModal((current) => current || 'error');
    } finally {
      running.current = false;
      setBusy(false);
    }
  };
  if (!o)
    return (
      <Screen title="Detalle del alquiler" back>
        <Empty title="Alquiler no encontrado" detail="Volvé a Alquileres." />
      </Screen>
    );
  const incident = o.faltantesRegistrados?.find((i) => i.id === recoverId);
  const countdown = retirementCountdown(o, now);
  const task = rentalTaskForDate(o, businessDate(now));
  const stepColor =
    task.group === 'overdue'
      ? C.danger
      : task.group === 'today'
        ? C.warning
        : task.kind === 'DELIVER'
          ? C.purple
          : task.kind === 'RETIRE'
            ? C.success
            : C.muted;
  const stepBackground =
    task.group === 'overdue'
      ? C.dangerBackground
      : task.group === 'today'
        ? C.warningBackground
        : task.kind === 'DELIVER'
          ? C.infoBackground
          : task.kind === 'RETIRE'
            ? C.successBackground
            : C.panel2;
  const materialIds = [
    ...new Set([
      ...o.materialesCargados.map((m) => m.materialId),
      ...Object.keys(o.saldosEnObra).filter((materialId) => (o.saldosEnObra[materialId] || 0) > 0),
    ]),
  ];
  return (
    <Screen
      title="Alquiler"
      back
      footer={
        o.estadoProceso === 'PENDIENTE_ENTREGA' ? (
          <Button label="Registrar entrega" icon={Truck} onPress={() => setModal('entrega')} />
        ) : o.estadoProceso === 'ENTREGADO' ? (
          <Button label="Registrar retiro" icon={Truck} onPress={() => setModal('retiro')} />
        ) : o.estadoProceso === 'RETIRADO' ? (
          <ConfirmButton
            label="Cerrar reingreso"
            variant="primary"
            title="Cerrar revisión del retiro"
            description="El retiro ya distribuyó el inventario. Cerrar la revisión no vuelve a sumar materiales."
            onConfirm={async () => {
              await dispatch({ type: 'REENTER', obraId: o.id });
            }}
          />
        ) : undefined
      }
    >
      <View style={{ maxWidth: 760, width: '100%', alignSelf: 'center', gap: 16 }}>
        <View style={{ gap: 8 }}>
          <View style={[s.row, { alignItems: 'flex-start', gap: 4 }]}>
            <Text accessibilityRole="header" style={[s.title, s.grow]}>
              {o.clienteNombre}
            </Text>
            <DeleteRentalButton obra={o} onDeleted={() => router.replace('/alquileres')} />
          </View>
          <View style={[s.row, { gap: 8, flexWrap: 'wrap' }]}>
            <StatusChip obra={o} today={businessDate(now)} />
            <View style={[s.row, { gap: 4, flexShrink: 1 }]}>
              <MapPin size={16} color={C.muted} />
              <Text style={[s.muted, { color: C.text, flexShrink: 1 }]}>
                {o.direccion}
                <Text style={{ color: C.muted }}>{`, ${o.localidadBarrio}`}</Text>
              </Text>
            </View>
          </View>
        </View>
        <ContactBar
          obra={o}
          onError={(e) => {
            setError(userError(e));
            setModal('error');
          }}
        />
        <NextStep
          title={
            task.kind === 'FINISHED'
              ? o.estadoProceso === 'RETIRADO'
                ? 'Cerrar el reingreso'
                : 'Alquiler terminado'
              : task.kind === 'DELIVER'
                ? 'Entregar el material'
                : 'Retirar el material'
          }
          detail={
            task.kind === 'FINISHED'
              ? o.estadoProceso === 'RETIRADO'
                ? 'El material ya volvió: revisalo y cerrá el reingreso.'
                : `Retirado el ${formatDate(o.fechaRetiroEfectiva || o.fechaRetiroEstimada)}.`
              : `${task.label}${task.date ? ` (${formatDate(task.date)})` : ''}.`
          }
          color={stepColor}
          background={stepBackground}
        />
        <View style={[s.row, { backgroundColor: C.panel, borderRadius: 16, borderWidth: 1, borderColor: C.hairline, paddingVertical: 14, paddingHorizontal: 16, gap: 12 }]}>
          <CalendarDays size={22} color={C.muted} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={s.muted}>Entrega prevista</Text>
            <Text style={{ color: C.text, fontFamily: fonts.displaySemi, fontSize: 20, fontVariant: ['tabular-nums'] }}>
              {formatDate(o.fechaEntrega)}
            </Text>
          </View>
          <ArrowRight size={18} color={C.subtle} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={s.muted}>Alquilado hasta</Text>
            <Text style={{ color: C.text, fontFamily: fonts.displaySemi, fontSize: 20, fontVariant: ['tabular-nums'] }}>
              {formatDate(o.fechaRetiroEstimada, false, 'Sin fecha de retiro')}
            </Text>
            {!countdown.finished && countdown.days !== null ? (
              <Text accessibilityLiveRegion="polite" style={[s.muted, { fontSize: 14 }]}>
                {countdown.label}
              </Text>
            ) : null}
          </View>
        </View>
        {o.fechaEntregaEfectiva || o.fechaRetiroEfectiva ? (
          <Text style={[s.muted, { marginTop: -6, paddingHorizontal: 4 }]}>
            {[o.fechaEntregaEfectiva ? `Entrega efectiva: ${formatDate(o.fechaEntregaEfectiva)}` : '', o.fechaRetiroEfectiva ? `Retiro efectivo: ${formatDate(o.fechaRetiroEfectiva)}` : '']
              .filter(Boolean)
              .join('   ')}
          </Text>
        ) : null}
        <View style={{ gap: 12 }}>
          <Text accessibilityRole="header" style={s.h2}>
            {o.estadoProceso === 'PENDIENTE_ENTREGA'
              ? 'Carga preparada'
              : ['RETIRADO', 'REINGRESADO'].includes(o.estadoProceso)
                ? 'Saldo retirado'
                : 'Materiales alquilados'}
          </Text>
          {materialIds.length ? (
            materialIds.map((materialId) => {
              const load = o.materialesCargados.find((m) => m.materialId === materialId);
              const master = state.materiales.find((m) => m.id === materialId);
              const pending = o.estadoProceso === 'PENDIENTE_ENTREGA';
              return (
                <View
                  key={materialId}
                  style={[
                    s.row,
                    {
                      gap: 16,
                      paddingVertical: 10,
                      borderBottomWidth: 1,
                      borderBottomColor: C.hairline,
                    },
                  ]}
                >
                  <Package size={24} color={C.muted} />
                  <View style={[s.grow, { gap: 4 }]}>
                    <Text style={s.label}>
                      {load?.nombre || master?.nombre || 'Material sin referencia'}
                    </Text>
                    <Text style={s.muted}>
                      {load?.medida || master?.medida || 'Sin medida'}
                      {load?.apodo ? ` · ${load.apodo}` : ''}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 2, maxWidth: '40%' }}>
                    <Text style={[s.h2, { fontVariant: ['tabular-nums'] }]}>
                      {pending ? load?.cantidad || 0 : o.saldosEnObra[materialId] || 0}
                    </Text>
                    <Text style={s.muted}>
                      {pending
                        ? 'Preparadas'
                        : ['RETIRADO', 'REINGRESADO'].includes(o.estadoProceso)
                          ? 'Pendientes'
                          : 'Alquiladas'}
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={s.muted}>Prepara una carga o recibe una triangulación.</Text>
          )}
          {user?.role === 'ADMIN' && o.estadoProceso === 'PENDIENTE_ENTREGA' ? (
            <Button
              label="Preparar carga"
              icon={Package}
              variant="secondary"
              onPress={() => setModal('carga')}
            />
          ) : null}
        </View>
        <View style={{ gap: 12 }}>
          <Text accessibilityRole="header" style={s.h2}>
            Acciones
          </Text>
          <Button
            label="Más acciones"
            icon={MoreHorizontal}
            variant="secondary"
            onPress={() => setModal('acciones')}
          />
          {user?.role === 'ADMIN' ? (
            <Button
              label="Editar alquiler"
              icon={Pencil}
              variant="ghost"
              onPress={() => router.push(`/obra/editar?id=${o.id}`)}
            />
          ) : null}
        </View>
        <Disclosure
          key={o.faltantesRegistrados?.length || 0}
          title="Faltantes y recuperaciones"
          initiallyOpen={!!o.faltantesRegistrados?.some((i) => i.recuperado < i.cantidad)}
        >
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
        </Disclosure>
        <Disclosure title="Fotos">
          <Text style={s.muted}>
            Las fotos se comparten con todo el equipo al sincronizar.
          </Text>
          <View style={s.wrap}>
            <Button
              label="Tomar foto"
              icon={Camera}
              loading={busy}
              variant="secondary"
              onPress={() =>
                run(async () => {
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
                run(async () => {
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
                {user?.role === 'ADMIN' || p.usuarioUid === user?.uid ? (
                  <ConfirmButton
                    label="Borrar foto"
                    title="Eliminar foto"
                    description="Se quitará del alquiler para todo el equipo. Queda registrado en la auditoría."
                    onConfirm={async () => {
                      await dispatch({ type: 'DELETE_PHOTO', obraId: o.id, photoId: p.id });
                    }}
                  />
                ) : null}
              </View>
            ))}
          </View>
        </Disclosure>
        <Disclosure title="Datos del alquiler">
          {o.estadoProceso !== 'PENDIENTE_ENTREGA' && o.materialesCargados.length ? (
            <View style={{ gap: 8 }}>
              <Text style={s.label}>Carga original</Text>
              {o.materialesCargados.map((m) => (
                <Text key={m.materialId} style={s.body}>
                  {m.cantidad} × {m.nombre} · {m.medida || 'Sin medida'}
                  {m.apodo ? ` · ${m.apodo}` : ''}
                </Text>
              ))}
            </View>
          ) : null}
          <Info label="ENTREGA PREVISTA" value={formatDate(o.fechaEntrega)} />
          <Info
            label="ENTREGA EFECTIVA"
            value={formatDate(o.fechaEntregaEfectiva, false, 'Sin registro efectivo separado')}
          />
          {o.observaciones ? <Info label="OBSERVACIONES" value={o.observaciones} /> : null}
          <Info
            label="RETIRO ESTIMADO"
            value={formatDate(o.fechaRetiroEstimada, false, 'Sin fecha de retiro')}
          />
          {o.fechaRetiroEfectiva ? (
            <Info label="RETIRO EFECTIVO" value={formatDate(o.fechaRetiroEfectiva)} />
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
        </Disclosure>
        <Disclosure title="Recordatorios">
          <RentalReminderPanel obra={o} />
        </Disclosure>
      </View>
      <Sheet
        visible={!!modal}
        title={
          {
            acciones: 'Más acciones',
            error: 'No se pudo completar la acción',
            carga: 'Preparar carga',
            entrega: 'Confirmar entrega',
            retiro: 'Inspección de retiro',
            faltante: 'Registrar faltante',
            transferencia: 'Triangulación directa',
            recuperar: 'Devolver al depósito',
            ubicacion: 'Ubicación del alquiler',
          }[modal] || 'Operación'
        }
        protectChanges
        hasChanges={
          modal === 'ubicacion' &&
          (lat !== String(o.coordenadas?.lat ?? '') || lng !== String(o.coordenadas?.lng ?? ''))
        }
        busy={busy}
        onClose={() => setModal('')}
      >
        {error ? <Notice text={error} tone="error" /> : null}
        {modal === 'acciones' ? (
          <>
            <Text style={s.muted}>
              Gestioná este alquiler sin alterar la carga hasta confirmar cada operación.
            </Text>
            {o.estadoProceso === 'ENTREGADO' ? (
              <>
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
            ) : null}
            {o.estadoProceso === 'RETIRADO' ? (
              <ConfirmButton
                label="Reingresar"
                title="Cerrar reingreso"
                description="El inventario ya se distribuyó al confirmar el retiro. Este paso cierra la revisión, sin volver a sumar material."
                variant="secondary"
                onConfirm={async () => {
                  await dispatch({ type: 'REENTER', obraId: o.id });
                  setModal('');
                }}
              />
            ) : null}
            {user?.role === 'ADMIN' && ['RETIRADO', 'REINGRESADO'].includes(o.estadoProceso) ? (
              <ConfirmButton
                label="Reactivar"
                title="Preparar nueva entrega"
                description="El alquiler volverá a pendiente. Revisa fechas y carga antes de entregar de nuevo."
                variant="secondary"
                onConfirm={async () => {
                  await dispatch({ type: 'REACTIVATE', obraId: o.id });
                  setModal('');
                }}
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
          </>
        ) : null}
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
                run(async () => {
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
                run(async () => {
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
                run(async () => {
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
