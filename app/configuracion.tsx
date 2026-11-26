import { FeedbackSettings } from '../src/components/FeedbackSettings';
import { RetirementReminderSettings } from '../src/components/RetirementReminderSettings';
import { DepotSettings } from '../src/components/DepotSettings';
import { LocalBackupActions } from '../src/components/LocalBackupActions';
import { BackupImport } from '../src/components/BackupImport';
import { ToolGroup, ToolRow } from '../src/components/ToolsLayout';
import { userError } from '../src/services/errors';
import { useTheme } from '../src/context/ThemeContext';
import React, { useEffect, useState } from 'react';
import { View, Text, Share, Pressable } from 'react-native';
import {
  Bell,
  BookOpen,
  FileDown,
  FileText,
  KeyRound,
  Layers,
  MapPin,
  Moon,
  Share2,
  ShieldCheck,
  SunMedium,
  SmartphoneNfc,
  UserRoundCog,
  UsersRound,
  X,
} from 'lucide-react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { useAuth } from '../src/context/AuthContext';
import { useInventory } from '../src/context/InventoryContext';
import {
  Button,
  ConfirmButton,
  Field,
  Notice,
  Screen,
  Sheet,
  useUI,
  usePanelChanges,
  initials,
} from '../src/components/ui';
import { loadDepot } from '../src/services/depotSettings';
import { DEFAULT_DEPOT } from '../src/utils/trip';
import { fonts } from '../src/theme/tokens';
import { ResponsableCard } from '../src/components/ResponsableCard';
import { usePin } from '../src/context/PinContext';
import { api } from '../src/sync/api';

type Panel = 'feedback' | 'responsables' | 'copies' | 'depot' | 'members' | 'rotate';
const titles: Record<Panel, string> = {
  feedback: 'Avisos y sonidos',
  responsables: 'Responsables de reparto',
  copies: 'Exportar e importar',
  depot: 'Depósito',
  members: 'Personas del equipo',
  rotate: 'Cambiar el código del equipo',
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
      <Text style={{ fontSize: 15 }}>
        Son los nombres que aparecen al confirmar una entrega o un retiro (fleteros, ayudantes).
      </Text>
      <Field
        label="Un nombre por línea"
        value={names}
        onChangeText={setNames}
        multiline
        style={{ minHeight: 160, textAlignVertical: 'top' }}
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

function ThemeOption({
  label,
  detail,
  icon: Icon,
  selected,
  onPress,
}: {
  label: string;
  detail: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  selected: boolean;
  onPress: () => void;
}) {
  const { C } = useUI();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${label}. ${detail}`}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minWidth: 96,
        minHeight: 96,
        borderRadius: 16,
        borderWidth: selected ? 2.5 : 1,
        borderColor: selected ? C.accent : C.hairline,
        backgroundColor: pressed || selected ? C.selection : C.panel,
        padding: 12,
        gap: 6,
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      <Icon size={26} color={selected ? C.accent : C.text} />
      <Text style={{ color: C.text, fontFamily: fonts.semibold, fontSize: 15, fontWeight: '700' }}>
        {label}
      </Text>
      <Text style={{ color: C.muted, fontSize: 12, textAlign: 'center' }}>{detail}</Text>
    </Pressable>
  );
}

export default function Settings() {
  const { C, s } = useUI();
  const theme = useTheme();
  const { user, session, members, refreshMembers, removeMember, switchUser, leaveTeam, rotateCode } = useAuth();
  const { state, dispatch, note, retry } = useInventory();
  const { withPin } = usePin();
  const [panel, setPanel] = useState<Panel | null>(null);
  const [depot, setDepot] = useState(DEFAULT_DEPOT);
  const [names, setNames] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  useEffect(() => {
    void loadDepot()
      .then(setDepot)
      .catch(() => undefined);
  }, [panel]);
  useEffect(() => {
    refreshMembers().catch(() => undefined);
  }, [refreshMembers]);
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
      setSuccess('Guardado.');
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
  const shareCode = () =>
    Share.share({
      message: `Sumate al equipo "${session?.teamName}" en Chema Andamios.\n\n1. Instalá la app.\n2. Tocá "Unirme a un equipo".\n3. Escribí este código: ${session?.code}\n4. Ingresá con tu nombre.`,
    })
      .then(() => undefined)
      .catch(() => undefined);
  const version = Constants.expoConfig?.version || '1.0.0';
  return (
    <Screen title="Ajustes" back>
      {/* Quién está usando este teléfono: lo primero que hay que confirmar. */}
      <View style={[s.row, { gap: 14, paddingVertical: 4 }]}>
        <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: C.onPrimary, fontSize: 24, fontFamily: fonts.display }}>{initials(user?.nombre)}</Text>
        </View>
        <View style={s.grow}>
          <Text style={s.h2}>{user?.nombre}</Text>
          <Text style={s.muted}>{session?.teamName} · todo queda en la Auditoría con tu nombre</Text>
        </View>
      </View>

      <ToolGroup title="Equipo">
        <ToolRow label="Compartir código del equipo" detail={session?.code} icon={Share2} onPress={shareCode} />
        <ToolRow label="Personas del equipo" value={String(members.length)} icon={UsersRound} onPress={() => open('members')} />
        <ResponsableCard />
        <ToolRow label="Cambiar código" detail="Si llegó a alguien que no debía tenerlo" icon={KeyRound} onPress={() => open('rotate')} />
        <ToolRow label="Cambiar de persona" detail="Para usar este teléfono con otro nombre" icon={UserRoundCog} onPress={switchUser} last />
      </ToolGroup>

      <View style={{ gap: 8 }}>
        <Text accessibilityRole="header" style={{ color: C.muted, fontFamily: fonts.semibold, fontSize: 15, paddingLeft: 4 }}>
          Apariencia
        </Text>
        <View accessibilityRole="radiogroup" style={[s.row, { gap: 8, alignItems: 'stretch' }]}>
          <ThemeOption label="Sol" detail="Para la calle" icon={SunMedium} selected={theme.preference === 'light'} onPress={() => theme.setPreference('light')} />
          <ThemeOption label="Noche" detail="No encandila" icon={Moon} selected={theme.preference === 'dark'} onPress={() => theme.setPreference('dark')} />
          <ThemeOption label="Auto" detail="Como el teléfono" icon={SmartphoneNfc} selected={theme.preference === 'system'} onPress={() => theme.setPreference('system')} />
        </View>
        {theme.error ? <Notice text={theme.error} tone="error" /> : null}
      </View>

      <ToolGroup title="Datos y copias">
        <ToolRow label="Copias y restauración" detail="Copia semanal y volver atrás" icon={ShieldCheck} onPress={() => router.push('/copias')} />
        <ToolRow label="Exportar e importar copia" detail="Todo en un archivo JSON" icon={FileDown} onPress={() => open('copies')} />
        <ToolRow label="Planillas Word y Excel" detail="Remitos y reportes" icon={FileText} onPress={() => router.push('/exportar')} last />
      </ToolGroup>

      <ToolGroup title="Trabajo">
        <ToolRow label="Combos de carga" icon={Layers} onPress={() => router.push('/combos')} />
        <ToolRow label="Responsables de reparto" value={String(state.responsables.length)} icon={UsersRound} onPress={() => open('responsables')} />
        <ToolRow label="Depósito" detail={depot.direccion} icon={MapPin} onPress={() => open('depot')} />
        <ToolRow label="Avisos y sonidos" icon={Bell} onPress={() => open('feedback')} last />
      </ToolGroup>

      <ToolGroup title="Ayuda">
        <ToolRow label="Guía de uso" detail="Cada parte de la app, explicada" icon={BookOpen} onPress={() => router.push('/guia')} last />
      </ToolGroup>

      <ConfirmButton
        label="Salir del equipo en este teléfono"
        variant="secondary"
        title="Salir del equipo"
        description="Este teléfono deja de ver los datos del equipo. Los datos no se borran: siguen en los demás teléfonos y podés volver a entrar con el código."
        onConfirm={leaveTeam}
      />
      <Text style={[s.muted, { textAlign: 'center', fontSize: 13 }]}>Chema Andamios {version}</Text>

      <Sheet
        visible={panel !== null}
        title={panel ? titles[panel] : 'Ajustes'}
        onClose={close}
        busy={busy}
        protectChanges={panel === 'depot' || panel === 'responsables' || panel === 'feedback'}
        hasChanges={panel === 'responsables' && names !== null && names !== state.responsables.join('\n')}
      >
        {panel === 'rotate' ? (
          <>
            <Text style={s.body}>
              Se genera un código nuevo y el anterior deja de funcionar al instante. Los demás teléfonos van a tener
              que entrar de nuevo con el código nuevo (no pierden nada). Después compartí el código nuevo.
            </Text>
            <Button
              label="Cambiar código"
              variant="danger"
              loading={busy}
              onPress={() =>
                run(() =>
                  withPin('Cambiar el código saca del equipo a todos los teléfonos hasta que usen el nuevo.', async (pin) => {
                    await api.pinVerify(session!.code, pin);
                    await note?.('Cambió el código del equipo');
                    await retry();
                    await rotateCode(pin);
                  }),
                ).then((ok) => {
                  if (ok) close();
                })
              }
            />
          </>
        ) : null}
        {panel === 'members' ? (
          <>
            {members.map((m) => (
              <View key={m.id} style={[s.row, { minHeight: 56, borderBottomWidth: 1, borderColor: C.hairline }]}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: C.panel2,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: C.text, fontFamily: fonts.semibold }}>{initials(m.name)}</Text>
                </View>
                <View style={s.grow}>
                  <Text style={s.body}>
                    {m.name}
                    {m.id === user?.uid ? ' (vos)' : ''}
                  </Text>
                  {m.lastSeen ? (
                    <Text style={s.muted}>
                      Última actividad {new Date(m.lastSeen).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
                    </Text>
                  ) : null}
                </View>
                {m.id !== user?.uid ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Quitar a ${m.name} de la lista`}
                    onPress={() =>
                      void run(() => withPin(`Sacar a ${m.name} de la lista del equipo.`, (pin) => removeMember(m.id, pin)))
                    }
                    style={{ minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <X size={20} color={C.danger} />
                  </Pressable>
                ) : null}
              </View>
            ))}
            <Text style={s.muted}>
              Quitar a alguien solo lo saca de la lista de nombres. Su historial queda en la Auditoría.
            </Text>
            <Button label="Invitar con el código" icon={Share2} onPress={shareCode} />
          </>
        ) : null}
        {panel === 'feedback' ? (
          <>
            <RetirementReminderSettings />
            <FeedbackSettings showError={false} />
          </>
        ) : null}
        {panel === 'depot' ? <DepotSettings /> : null}
        {panel === 'responsables' ? (
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
        {panel === 'copies' ? (
          <>
            <Notice text="Exportar guarda TODO (alquileres, depósito, combos, auditoría y fotos) en un archivo JSON. Importar reemplaza los datos del equipo por los del archivo, en todos los teléfonos, y queda registrado en la Auditoría." />
            <Text style={s.h2}>Exportar</Text>
            <LocalBackupActions />
            <Text style={s.h2}>Importar</Text>
            <BackupImport />
          </>
        ) : null}
        {error ? <Notice text={error} tone="error" /> : null}
        {success ? <Notice text={success} tone="success" /> : null}
      </Sheet>
    </Screen>
  );
}
