import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Text, View } from 'react-native';
import { router, useRootNavigationState } from 'expo-router';
import { useAuth } from './AuthContext';
import { useInventory } from './InventoryContext';
import { useTheme } from './ThemeContext';
import { Button } from '../components/ui';
import {
  notificationAdapter,
  confirmationFeedback,
  requestFeedbackPermission,
  watchReminderOpens,
  acknowledgeReminderOpen,
  type ReminderOpen,
} from '../services/feedback/notification-adapter';
import {
  FeedbackPreferences,
  FeedbackState,
  RentalReference,
  ReminderService,
  initialFeedbackState,
  type RetirementPolicy,
  type RentalReminderPolicy,
} from '../services/feedback/reminders';
interface FeedbackValue {
  state: FeedbackState;
  ready: boolean;
  busy: boolean;
  error: string;
  supported: boolean;
  savePreferences: (patch: Partial<FeedbackPreferences>) => Promise<boolean>;
  scheduleReminder: (
    obra: RentalReference,
    at: string,
    sound: boolean,
    vibration: boolean,
  ) => Promise<boolean>;
  cancelReminder: (obraId: string) => Promise<boolean>;
  configureGeneral: (policy: RetirementPolicy) => Promise<boolean>;
  configureRental: (obraId: string, policy: RentalReminderPolicy) => Promise<boolean>;
  retry: () => Promise<boolean>;
  notifySuccess: (message: string) => void;
  notifyError: (message: string, retry?: () => void | Promise<void>) => void;
}
const Context = createContext<FeedbackValue | null>(null);
export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const { workspaceKey } = useInventory();
  const { user } = useAuth();
  const scope =
    !workspaceKey || workspaceKey === 'local'
      ? 'local'
      : `${workspaceKey}:${user?.uid || 'anonymous'}`;
  return (
    <WorkspaceFeedback key={scope} scope={scope}>
      {children}
    </WorkspaceFeedback>
  );
}
function WorkspaceFeedback({ children, scope }: { children: React.ReactNode; scope: string }) {
  const { state: inventory, ready: inventoryReady, accessBlocked } = useInventory();
  const { colors } = useTheme();
  const { user, loading: authLoading } = useAuth();
  const navigation = useRootNavigationState();
  const [pendingOpen, setPendingOpen] = useState<ReminderOpen | null>(null);
  const handledOpen = useRef<string | null>(null);
  const [service] = useState(
    () =>
      new ReminderService(
        AsyncStorage,
        notificationAdapter,
        () => Date.now(),
        scope === 'local'
          ? undefined
          : {
              storageKey: `chema:local-feedback:v1:scope:${encodeURIComponent(scope)}`,
              identifierPrefix: `chema-scoped-reminder:${encodeURIComponent(scope)}:`,
              scope,
            },
      ),
  );
  useEffect(
    () => () => {
      void service.suspend().catch(() => undefined);
    },
    [service],
  );
  const [state, setState] = useState(initialFeedbackState),
    [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [retryingOperation, setRetryingOperation] = useState(false);
  const [notice, setNotice] = useState<{
    message: string;
    error: boolean;
    retry?: () => void | Promise<void>;
  } | null>(null);
  const operationRetryLock = useRef(false);
  const count = useRef(0),
    timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const run = useCallback(
    async (operation: () => Promise<FeedbackState>) => {
      count.current += 1;
      setBusy(true);
      try {
        setState(await operation());
        setError('');
        return true;
      } catch (e) {
        setState(service.snapshot());
        setError(
          e instanceof Error ? e.message : 'No se pudo actualizar el aviso local. Reintentá.',
        );
        return false;
      } finally {
        count.current -= 1;
        setBusy(count.current > 0);
      }
    },
    [service],
  );
  const retry = useCallback(
    () =>
      run(async () => {
        if (accessBlocked) {
          await service.suspend();
          return service.snapshot();
        }
        return service.reconcile(inventory.obras);
      }),
    [run, service, inventory.obras, accessBlocked],
  );
  useEffect(() => {
    let active = true;
    void Promise.resolve()
      .then(() => run(() => service.initialize()))
      .then(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [run, service]);
  useEffect(() => {
    if (ready && inventoryReady && user) void Promise.resolve().then(retry);
  }, [ready, inventoryReady, user, retry]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active' && ready && inventoryReady && user) void retry();
    });
    return () => subscription.remove();
  }, [retry, inventoryReady, ready, user]);
  // The OS retains the launch response until navigation, session and inventory are ready.
  // The listener is installed before reading the cold-start response in the adapter.
  useEffect(
    () => watchReminderOpens(setPendingOpen, (message) => setNotice({ message, error: true })),
    [],
  );
  useEffect(() => {
    if (!pendingOpen || authLoading || !user || !inventoryReady || !navigation?.key) return;
    let active = true;
    void Promise.resolve().then(() => {
      if (!active || handledOpen.current === pendingOpen.responseKey) return;
      handledOpen.current = pendingOpen.responseKey;
      if ((pendingOpen.scope || 'local') !== scope) {
        setNotice({
          message:
            'Este aviso pertenece a otro espacio o cuenta. Abrí ese espacio para consultar el alquiler.',
          error: true,
        });
      } else if (inventory.obras.some((obra) => obra.id === pendingOpen.obraId)) {
        router.push({ pathname: '/obra/[id]', params: { id: pendingOpen.obraId } });
      } else {
        setNotice({
          message: 'El alquiler de este aviso ya no está en el inventario local.',
          error: true,
        });
      }
      void acknowledgeReminderOpen(pendingOpen.responseKey).catch(() => {
        setNotice({
          message: 'Se abrió el aviso, pero no se pudo confirmar su lectura al sistema.',
          error: true,
        });
      });
      setPendingOpen((current) =>
        current?.responseKey === pendingOpen.responseKey ? null : current,
      );
    });
    return () => {
      active = false;
    };
  }, [pendingOpen, authLoading, user, inventoryReady, inventory.obras, navigation?.key, scope]);
  useEffect(() => () => clearTimeout(timer.current), []);
  const notify = (message: string, isError: boolean, retryAction?: () => void | Promise<void>) => {
    clearTimeout(timer.current);
    setNotice({ message, error: isError, retry: retryAction });
    if (!isError) timer.current = setTimeout(() => setNotice(null), 6500);
    if (state.preferences.confirmations)
      void confirmationFeedback(
        state.preferences.sound,
        state.preferences.vibration,
        isError,
      ).catch(() =>
        setError(
          'No pudo emitirse el sonido o la vibración opcional. Revisá los permisos de avisos.',
        ),
      );
  };
  return (
    <Context.Provider
      value={{
        state,
        ready,
        busy,
        error,
        supported: notificationAdapter.supported,
        savePreferences: (patch) =>
          run(async () => {
            const next = { ...service.snapshot().preferences, ...patch };
            if (
              next.confirmations &&
              (next.sound || next.vibration) &&
              (patch.confirmations === true || patch.sound === true || patch.vibration === true) &&
              !(await requestFeedbackPermission())
            )
              throw new Error(
                'No se autorizó el permiso para los avisos opcionales. Las preferencias anteriores se conservaron.',
              );
            return service.preferences(patch);
          }),
        scheduleReminder: (obra, at, sound, vibration) =>
          run(() => service.enable(obra, at, sound, vibration)),
        cancelReminder: (id) => run(() => service.cancel(id)),
        configureGeneral: (policy) => run(() => service.configureGeneral(policy, inventory.obras)),
        configureRental: (id, policy) =>
          run(() => service.configureRental(id, policy, inventory.obras)),
        retry,
        notifySuccess: (message) => notify(message, false),
        notifyError: (message, retryAction) => notify(message, true, retryAction),
      }}
    >
      {children}
      {notice && (
        <View
          accessibilityLiveRegion={notice.error ? 'assertive' : 'polite'}
          style={{
            backgroundColor: notice.error ? colors.dangerBg : colors.panel,
            borderTopWidth: 1,
            borderColor: colors.line,
            padding: 16,
            gap: 8,
          }}
        >
          <Text
            style={{
              color: notice.error ? colors.danger : colors.text,
              fontSize: 16,
              lineHeight: 23,
            }}
          >
            {notice.message}
          </Text>
          {notice.retry && (
            <Button
              label="Reintentar operación"
              variant="secondary"
              loading={retryingOperation}
              onPress={() => {
                if (operationRetryLock.current || !notice.retry) return;
                operationRetryLock.current = true;
                setRetryingOperation(true);
                void Promise.resolve()
                  .then(notice.retry)
                  .catch((failure: unknown) => {
                    setNotice({
                      ...notice,
                      message:
                        failure instanceof Error
                          ? failure.message
                          : 'No se pudo completar la operación. Reintentá.',
                    });
                  })
                  .finally(() => {
                    operationRetryLock.current = false;
                    setRetryingOperation(false);
                  });
              }}
            />
          )}
          <Button label="Cerrar aviso" variant="ghost" onPress={() => setNotice(null)} />
        </View>
      )}
    </Context.Provider>
  );
}
export function useFeedback() {
  const context = useContext(Context);
  if (!context) throw new Error('Falta el proveedor de avisos locales.');
  return context;
}
