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
  Layers,
  MapPin,
  Moon,
  Share2,
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

type Panel = 'feedback' | 'responsables' | 'copies' | 'depot' | 'members';
const titles: Record<Panel, string> = {
  feedback: 'Avisos y sonidos',
  responsables: 'Responsables de reparto',
  copies: 'Exportar e importar',
  depot: 'Depósito',
  members: 'Personas del equipo',
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
  const { user, session, members, refreshMembers, removeMember, switchUser, leaveTeam } = useAuth();
  const { state, dispatch } = useInventory();
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
  const version = Constants.expoConfig?.version || '2.0.0';
  return (
    <Screen title="Ajustes" back>
      <View style={[s.card, { gap: 14 }]}>
        <View style={[s.row, { gap: 14 }]}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: C.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: C.onPrimary, fontSize: 22, fontFamily: fonts.semibold, fontWeight: '700' }}>
              {initials(user?.nombre)}
            </Text>
          </View>
          <View style={s.grow}>
            <Text style={[s.h2]}>{user?.nombre}</Text>
            <Text style={s.muted}>Equipo: {session?.teamName}</Text>
          </View>
        </View>
        <Text style={s.muted}>
          Todo lo que hagas queda registrado con tu nombre en la Auditoría.
        </Text>
        <Button label="Cambiar de persona" icon={UserRoundCog} variant="secondary" onPress={switchUser} />
      </View>

      <View style={[s.card, { gap: 12 }]}>
        <Text style={s.h2}>Código del equipo</Text>
        <Text style={s.muted}>
          Compartilo con quienes tengan que usar la app. Con este código ven y cargan los mismos datos
          desde su teléfono.
        </Text>
        <Text
          selectable
          accessibilityLabel={`Código ${session?.code.split('').join(' ')}`}
          style={{
            color: C.text,
            fontFamily: fonts.monoMedium,
            fontSize: 26,
            letterSpacing: 2,
            textAlign: 'center',
            paddingVertical: 14,
            borderRadius: 14,
            borderWidth: 2,
            borderStyle: 'dashed',
            borderColor: C.accent,
            backgroundColor: C.selection,
          }}
        >
          {session?.code}
        </Text>
        <Button label="Compartir código" icon={Share2} onPress={shareCode} />
        <Button
          label={`Personas del equipo (${members.length})`}
          icon={UsersRound}
          variant="secondary"
          onPress={() => open('members')}
        />
      </View>

      <View style={[s.card, { gap: 12 }]}>
        <Text style={s.h2}>Apariencia</Text>
        <View accessibilityRole="radiogroup" style={[s.row, { gap: 10, alignItems: 'stretch' }]}>
          <ThemeOption
            label="Sol"
            detail="Máximo contraste de día"
            icon={SunMedium}
            selected={theme.preference === 'light'}
            onPress={() => theme.setPreference('light')}
          />
          <ThemeOption
            label="Noche"
            detail="Oscuro, no encandila"
            icon={Moon}
            selected={theme.preference === 'dark'}
            onPress={() => theme.setPreference('dark')}
          />
          <ThemeOption
            label="Auto"
            detail="Igual que el teléfono"
            icon={SmartphoneNfc}
            selected={theme.preference === 'system'}
            onPress={() => theme.setPreference('system')}
          />
        </View>
        {theme.error ? <Notice text={theme.error} tone="error" /> : null}
      </View>

      <ToolGroup title="Datos">
        <ToolRow
          label="Exportar e importar copia"
          detail="Todo el inventario en un archivo JSON"
          icon={FileDown}
          onPress={() => open('copies')}
        />
        <ToolRow
          label="Planillas Word y Excel"
          detail="Remitos y reportes"
          icon={FileText}
          onPress={() => router.push('/exportar')}
        />
        <ToolRow label="Combos de carga" icon={Layers} onPress={() => router.push('/combos')} />
        <ToolRow
          label="Responsables de reparto"
          detail={`${state.responsables.length} cargados`}
          icon={UsersRound}
          onPress={() => open('responsables')}
        />
        <ToolRow label={depot.nombre} detail={depot.direccion} icon={MapPin} onPress={() => open('depot')} last />
      </ToolGroup>
      <ToolGroup title="Ayuda">
        <ToolRow label="Avisos y sonidos" icon={Bell} onPress={() => open('feedback')} />
        <ToolRow label="Guía de uso" detail="Cada sección explicada" icon={BookOpen} onPress={() => router.push('/guia')} last />
      </ToolGroup>
      <ConfirmButton
        label="Salir del equipo en este teléfono"
        title="Salir del equipo"
        description="Este teléfono deja de ver los datos del equipo. Los datos no se borran: siguen en los demás teléfonos y podés volver a entrar con el código."
        onConfirm={leaveTeam}
      />
      <Text style={[s.muted, { textAlign: 'center' }]}>
        Chema Andamios {version} · Sincronizado en la nube
      </Text>

      <Sheet
        visible={panel !== null}
        title={panel ? titles[panel] : 'Ajustes'}
        onClose={close}
        busy={busy}
        protectChanges={panel === 'depot' || panel === 'responsables' || panel === 'feedback'}
        hasChanges={panel === 'responsables' && names !== null && names !== state.responsables.join('\n')}
      >
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
                    onPress={() => void run(() => removeMember(m.id))}
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
