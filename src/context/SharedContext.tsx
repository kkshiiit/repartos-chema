import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SharedAuth, SharedSessionVault } from '../shared/auth';
import { sharedSessionStorage } from '../shared/session';
import { createSharedClient } from '../shared/client';
import type { SharedSnapshot } from '../shared/protocol';
import type { UserProfile } from '../types';
import { SHARED_CONFIG } from '../services/sharedConfig';
const CHOICE_KEY = 'chema:workspace-choice:v1';
interface WorkspaceChoice {
  version: 1;
  mode: 'local' | 'shared';
  spaceId?: string;
  actor?: UserProfile;
  localKey?: string;
}
interface SharedValue {
  loading: boolean;
  active: boolean;
  spaceId: string | null;
  actor: UserProfile | null;
  localKey?: string;
  initial: SharedSnapshot | null;
  error: string;
  auth: SharedAuth;
  remote: ReturnType<typeof createSharedClient> | null;
  connect: (email: string, password: string, spaceId?: string) => Promise<void>;
  enroll: (token: string, name: string, email: string, password: string) => Promise<void>;
  useLocal: () => Promise<void>;
  useRecoveredLocal: (key: string) => Promise<void>;
  reauthenticate: () => Promise<void>;
}
const Context = createContext<SharedValue | null>(null);
const sharedAuth = new SharedAuth(SHARED_CONFIG, new SharedSessionVault(sharedSessionStorage));
export function SharedProvider({ children }: { children: React.ReactNode }) {
  const [choice, setChoice] = useState<WorkspaceChoice>({ version: 1, mode: 'local' });
  const [loading, setLoading] = useState(true),
    [error, setError] = useState('');
  const [initial, setInitial] = useState<SharedSnapshot | null>(null);
  const choiceRef = useRef(choice);
  useEffect(() => {
    choiceRef.current = choice;
  }, [choice]);
  const setDurable = useCallback(async (value: WorkspaceChoice) => {
    const raw = JSON.stringify(value);
    await AsyncStorage.setItem(CHOICE_KEY, raw);
    if ((await AsyncStorage.getItem(CHOICE_KEY)) !== raw)
      throw new Error('No pudimos guardar el espacio elegido. Tus inventarios se conservan.');
    choiceRef.current = value;
    setChoice(value);
  }, []);
  const remote = useMemo(
    () =>
      choice.mode === 'shared' && choice.spaceId
        ? createSharedClient(
            { ...SHARED_CONFIG, spaceId: choice.spaceId, expectedUserId: choice.actor?.uid },
            (uid) => sharedAuth.accessToken(uid),
          )
        : null,
    [choice.mode, choice.spaceId, choice.actor?.uid],
  );
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(CHOICE_KEY);
        if (!raw) return;
        const value = JSON.parse(raw) as WorkspaceChoice;
        if (value.localKey && !/^chema:recovery:[a-zA-Z0-9_-]+:v1$/.test(value.localKey))
          throw new Error(
            'La recuperación elegida requiere revisión. No se reemplazaron inventarios.',
          );
        if (
          value.version !== 1 ||
          !['local', 'shared'].includes(value.mode) ||
          (value.mode === 'shared' && (!value.spaceId || !value.actor?.uid))
        )
          throw new Error('No pudimos leer el espacio elegido. No se reemplazó ningún inventario.');
        if (active) setChoice(value);
        // A cached identity only selects its own local queue. The server still verifies Auth/role per command.
        if (value.mode === 'shared') await sharedAuth.load();
      } catch (e) {
        if (active)
          setError(
            e instanceof SyntaxError
              ? 'No pudimos leer el espacio elegido. Conservamos el original y los inventarios.'
              : e instanceof Error
                ? e.message
                : 'No pudimos recuperar la sesión.',
          );
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);
  const activate = useCallback(
    async (spaceId: string, expectedUserId: string) => {
      const client = createSharedClient({ ...SHARED_CONFIG, spaceId, expectedUserId }, (uid) =>
        sharedAuth.accessToken(uid),
      );
      const snapshot = await client.snapshot();
      const member = snapshot.member;
      if (!member || member.uid !== expectedUserId || !['ADMIN', 'OPERADOR'].includes(member.role))
        throw new Error(
          'No pudimos confirmar tu pertenencia al equipo. El inventario local no cambió.',
        );
      const actor: UserProfile = {
        uid: member.uid,
        nombre: member.nombre,
        email: '',
        role: member.role,
        createdAt: new Date().toISOString(),
      };
      await setDurable({
        version: 1,
        mode: 'shared',
        spaceId,
        actor,
        localKey: choiceRef.current.localKey,
      });
      setInitial(snapshot);
      setError('');
    },
    [setDurable],
  );
  const value: SharedValue = {
    loading,
    active: choice.mode === 'shared',
    spaceId: choice.spaceId || null,
    actor: choice.actor || null,
    initial,
    error,
    auth: sharedAuth,
    remote,
    localKey: choice.localKey,
    connect: async (email, password, suppliedSpaceId) => {
      const session = await sharedAuth.signIn(email, password);
      let spaceId = suppliedSpaceId;
      if (!spaceId) {
        const client = createSharedClient(
          { ...SHARED_CONFIG, spaceId: '', expectedUserId: session.userId },
          (uid) => sharedAuth.accessToken(uid),
        );
        const result = await client.request<{ spaceId: string }[]>('spaces');
        if (result.length !== 1)
          throw new Error(
            result.length
              ? 'Elegí el identificador del equipo con el responsable.'
              : 'Tu cuenta todavía no está vinculada. Usá la invitación del responsable.',
          );
        spaceId = result[0]!.spaceId;
      }
      await activate(spaceId, session.userId);
    },
    enroll: async (token, name, email, password) => {
      const result = await sharedAuth.enroll(token, name, email, password);
      await activate(result.spaceId, result.session.userId);
    },
    useLocal: async () => {
      await setDurable({ version: 1, mode: 'local', localKey: choiceRef.current.localKey });
      setInitial(null);
      setError('');
      await sharedAuth.signOut();
    },
    useRecoveredLocal: async (localKey) => {
      if (!/^chema:recovery:[a-zA-Z0-9_-]+:v1$/.test(localKey))
        throw new Error('Recuperación local inválida.');
      await setDurable({ version: 1, mode: 'local', localKey });
      setInitial(null);
      setError('');
    },
    reauthenticate: async () => {
      if (choiceRef.current.spaceId && choiceRef.current.actor?.uid)
        await activate(choiceRef.current.spaceId, choiceRef.current.actor.uid);
    },
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
/** Optional in isolated component tests; the production root always installs SharedProvider. */
export function useSharedSession() {
  return useContext(Context);
}
