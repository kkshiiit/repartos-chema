import { FeedbackSettings } from '../src/components/FeedbackSettings';
import { RetirementReminderSettings } from '../src/components/RetirementReminderSettings';
import { DepotSettings } from '../src/components/DepotSettings';
import { TeamSettings } from '../src/components/TeamSettings';
import { LocalBackupActions } from '../src/components/LocalBackupActions';
import { BackupImport } from '../src/components/BackupImport';
import { ToolGroup, ToolRow } from '../src/components/ToolsLayout';
import { useWelcome } from '../src/components/WelcomeProvider';
import { userError } from '../src/services/errors';
import { useTheme } from '../src/context/ThemeContext';
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import {
  Bell,
  BookOpen,
  FileClock,
  FileText,
  Info,
  Layers,
  MapPin,
  Move,
  Sun,
  UserRound,
  UsersRound,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useInventory } from '../src/context/InventoryContext';
import { DATA_MODE } from '../src/services/firebase';
import { LOCAL_ONLY } from '../src/services/localMode';
import {
  Button,
  Chip,
  ConfirmButton,
  Field,
  Notice,
  Screen,
  Sheet,
  useUI,
  usePanelChanges,
} from '../src/components/ui';
import { enableNotifications } from '../src/services/notifications';
import { loadDepot } from '../src/services/depotSettings';
import { DEFAULT_DEPOT } from '../src/utils/trip';

type Panel =
  | 'identity'
  | 'appearance'
  | 'motion'
  | 'feedback'
  | 'responsables'
  | 'copies'
  | 'depot'
  | 'environment';
const titles: Record<Panel, string> = {
  identity: LOCAL_ONLY ? 'Uso individual' : 'Equipo Chema',
  appearance: 'Apariencia',
  motion: 'Movimiento',
  feedback: 'Avisos y sonidos',
  responsables: 'Responsables',
  copies: 'Copias y restauración',
  depot: 'Depósito',
  environment: 'Entorno de trabajo',
};

function ResponsibleEditor({
  names,
  setNames,
  busy,
  save,
}: {
  names: string;
  setNames: (value: string) => void;
  busy: boolean;
  save: () => Promise<boolean>;
}) {
  const panel = usePanelChanges();
  return (
    <>
      <Field
        label="Responsables · uno por línea"
        value={names}
        onChangeText={setNames}
        multiline
        style={{ minHeight: 140 }}
      />
      <Button
        loading={busy}
        label="Guardar responsables"
        onPress={async () => {
          if (await save()) panel.resetDirty();
        }}
      />
    </>
  );
}

export default function Settings() {
  const { s } = useUI();
  const theme = useTheme();
  const { openWelcome } = useWelcome();
  const { user, membership } = useAuth();
  const { state, dispatch, backup, recoverPrevious, workspaceId } = useInventory();
  const [panel, setPanel] = useState<Panel | null>(null);
  const [depot, setDepot] = useState(DEFAULT_DEPOT);
  const [names, setNames] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const admin = user?.role === 'ADMIN';
  useEffect(() => {
    void loadDepot()
      .then(setDepot)
      .catch(() => undefined);
  }, [panel]);
  const open = (value: Panel) => {
    setError('');
    setSuccess('');
    setPanel(value);
  };
  const run = async (f: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await f();
      setError('');
      setSuccess('Configuración guardada.');
      return true;
    } catch (e) {
      setError(userError(e));
      return false;
    } finally {
      setBusy(false);
    }
  };
  const close = () => {
    setPanel(null);
    setNames(null);
  };
  return (
    <Screen title="Ajustes" back>
      <ToolGroup>
        <ToolRow
          label={membership?.nombre || user?.nombre || 'Identidad local'}
          detail={workspaceId ? 'Equipo compartido' : 'Uso individual · En este celular'}
          icon={UserRound}
          onPress={() => open('identity')}
          last
        />
      </ToolGroup>
      <ToolGroup title="Preferencias">
        <ToolRow
          label="Apariencia"
          value={{ light: 'Claro', dark: 'Oscuro', system: 'Sistema' }[theme.preference]}
          icon={Sun}
          onPress={() => open('appearance')}
        />
        <ToolRow
          label="Movimiento"
          value={theme.motionPreference === 'ambient' ? 'Suave' : 'Estático'}
          icon={Move}
          onPress={() => open('motion')}
        />
        <ToolRow label="Avisos y sonidos" icon={Bell} onPress={() => open('feedback')} last />
      </ToolGroup>
      <ToolGroup title="Datos y herramientas">
        {admin ? (
          <>
            <ToolRow
              label="Copias y restauración"
              icon={FileClock}
              onPress={() => open('copies')}
            />
            <ToolRow label="Documentos" icon={FileText} onPress={() => router.push('/exportar')} />
            <ToolRow label="Combos de carga" icon={Layers} onPress={() => router.push('/combos')} />
            <ToolRow
              label="Responsables"
              detail={`${state.responsables.length} configurados`}
              icon={UsersRound}
              onPress={() => open('responsables')}
            />
          </>
        ) : null}
        <ToolRow label="Entorno de trabajo" icon={Info} onPress={() => open('environment')} last />
      </ToolGroup>
      <ToolGroup title="Colaboración">
        <ToolRow
          label="Equipo compartido"
          detail={
            workspaceId
              ? 'Acceso vinculado · Cambios pendientes y miembros'
              : 'Opcional · El uso individual se conserva'
          }
          icon={UsersRound}
          onPress={() => router.push('/equipo/conectar')}
          last
        />
      </ToolGroup>
      <ToolGroup title="Depósito">
        <ToolRow
          label={depot.nombre}
          detail={depot.direccion}
          icon={MapPin}
          onPress={() => open('depot')}
          last
        />
      </ToolGroup>
      <ToolGroup>
        <ToolRow label="Ver bienvenida" icon={BookOpen} onPress={openWelcome} last />
      </ToolGroup>
      {LOCAL_ONLY && !workspaceId ? (
        <Text style={[s.muted, { textAlign: 'center' }]}>Sin cuenta ni suscripción.</Text>
      ) : null}
      <Sheet
        visible={panel !== null}
        title={panel ? titles[panel] : 'Ajustes'}
        onClose={close}
        busy={busy}
        protectChanges={panel === 'depot' || panel === 'responsables' || panel === 'feedback'}
        hasChanges={
          panel === 'responsables' && names !== null && names !== state.responsables.join('\n')
        }
      >
        {panel === 'identity' ? <TeamSettings /> : null}
        {panel === 'appearance' ? (
          <>
            <View style={s.wrap}>
              {(
                [
                  { value: 'light', label: 'Claro' },
                  { value: 'dark', label: 'Oscuro' },
                  { value: 'system', label: 'Seguir sistema' },
                ] as const
              ).map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  selected={theme.preference === option.value}
                  onPress={() => theme.setPreference(option.value)}
                />
              ))}
            </View>
            <Text style={s.muted}>
              Tu elección se guarda en este dispositivo. También podés cambiarla desde la cabecera
              principal.
            </Text>
            {theme.error ? <Notice text={theme.error} tone="error" /> : null}
          </>
        ) : null}
        {panel === 'motion' ? (
          <>
            <View style={s.wrap}>
              <Chip
                label="Transiciones suaves"
                selected={theme.motionPreference === 'ambient'}
                onPress={() => theme.setMotionPreference('ambient')}
              />
              <Chip
                label="Estático"
                selected={theme.motionPreference === 'static'}
                onPress={() => theme.setMotionPreference('static')}
              />
            </View>
            <Text style={s.muted}>
              Se respeta reducir movimiento del sistema. El fondo es estático en ambos modos.
            </Text>
            {theme.motionError ? <Notice text={theme.motionError} tone="error" /> : null}
          </>
        ) : null}
        {panel === 'feedback' ? (
          <>
            <RetirementReminderSettings />
            <FeedbackSettings showError={false} />
            {admin && !LOCAL_ONLY ? (
              <Button
                loading={busy}
                label="Activar avisos"
                variant="secondary"
                onPress={async () => {
                  await run(enableNotifications);
                }}
              />
            ) : null}
          </>
        ) : null}
        {panel === 'depot' ? <DepotSettings /> : null}
        {panel === 'responsables' && admin ? (
          <ResponsibleEditor
            names={names ?? state.responsables.join('\n')}
            setNames={setNames}
            busy={busy}
            save={async () => {
              const ok = await run(() =>
                dispatch({
                  type: 'RESPONSABLES',
                  nombres: (names ?? state.responsables.join('\n'))
                    .split('\n')
                    .map((n) => n.trim())
                    .filter(Boolean),
                }),
              );
              if (ok) setNames(null);
              return ok;
            }}
          />
        ) : null}
        {panel === 'copies' && admin ? (
          <>
            <Notice text="Guarda la copia en un lugar privado. Contiene alquileres, historial y fotos locales; no incluye contraseñas. Los archivos Excel y Word no reemplazan esta copia." />
            {LOCAL_ONLY && !workspaceId ? (
              <LocalBackupActions />
            ) : (
              <Button
                label="Descargar copia"
                variant="secondary"
                loading={busy}
                onPress={async () => {
                  await run(backup);
                }}
              />
            )}
            {DATA_MODE === 'demo' ? <BackupImport /> : null}
            {LOCAL_ONLY && !workspaceId ? (
              <ConfirmButton
                label="Recuperar anterior"
                title="Recuperar inventario anterior"
                description="Se recuperará la copia local anterior a Empezar vacío. Los datos activos también se archivarán antes del cambio."
                onConfirm={async () => {
                  await recoverPrevious();
                  setNames(null);
                  setSuccess('Inventario anterior recuperado.');
                }}
              />
            ) : null}
          </>
        ) : null}
        {panel === 'environment' ? (
          <>
            <Notice
              text={
                LOCAL_ONLY
                  ? 'Uso individual sin conexión. Los datos se guardan en este celular; no se envían a Firebase ni a otros servicios. Conserva copias JSON fuera del dispositivo.'
                  : DATA_MODE === 'demo'
                    ? 'Demostración local. Datos ficticios persistidos en este dispositivo. No hay sincronización cloud ni push enviados.'
                    : 'Firebase configurado. Las operaciones se confirman con el servidor y los conflictos requieren revisión.'
              }
            />
            <Text style={s.muted}>
              El calendario usa America/Argentina/Buenos_Aires. Los nombres del flete son
              responsables configurables, no usuarios autenticados.
            </Text>
          </>
        ) : null}
        {error ? <Notice text={error} tone="error" /> : null}
        {success ? <Notice text={success} tone="success" /> : null}
      </Sheet>
    </Screen>
  );
}
