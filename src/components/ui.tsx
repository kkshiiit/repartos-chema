import { userError } from '../services/errors';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useId,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Easing,
  PanResponder,
  ViewStyle,
  TextInputProps,
  StyleProp,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  CloudOff,
  Settings,
  Package,
  RefreshCw,
  X,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useInventory } from '../context/InventoryContext';
import { DATA_MODE } from '../services/firebase';
import { LOCAL_ONLY } from '../services/localMode';
import { useTheme } from '../context/ThemeContext';
import { dark, light, Colors, radius, typography, motionMs, spacing } from '../theme/tokens';
import { pickBackup } from '../services/files';
import { ThemeToggle } from './ThemeToggle';
import { AuroraBackground } from './AuroraBackground';
const makeStyles = (C: Colors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    card: {
      backgroundColor: C.panel,
      borderRadius: radius.object,
      padding: spacing.lg,
      gap: spacing.md,
    },
    title: {
      color: C.text,
      ...typography.title,
      fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
      fontWeight: '700',
    },
    h2: { color: C.text, ...typography.section, fontWeight: '700' },
    body: { color: C.text, ...typography.body },
    muted: { color: C.muted, ...typography.secondary },
    label: { color: C.text, ...typography.secondary, fontWeight: '600' },
    input: {
      backgroundColor: C.panel,
      borderWidth: 1,
      borderColor: C.line,
      borderRadius: radius.input,
      color: C.text,
      paddingHorizontal: 14,
      paddingVertical: 13,
      fontSize: typography.body.fontSize,
      minHeight: 48,
    },
    divider: { height: 1, backgroundColor: C.hairline },
    grow: { flex: 1, minWidth: 0 },
    section: { gap: 14 },
    error: { color: C.danger, fontSize: 14, lineHeight: 21 },
  });
const styles = { dark: makeStyles(dark), light: makeStyles(light) };
export function useUI() {
  const { colors, mode } = useTheme();
  return { C: colors, s: styles[mode] };
}
export function Button({
  label,
  onPress,
  icon: Icon,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
}: {
  label: string;
  onPress: () => void | Promise<void>;
  icon?: React.ComponentType<{ size: number; color: string }>;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { C } = useUI();
  const { motionEnabled } = useTheme();
  const [pending, setPending] = useState(false);
  const locked = useRef(false);
  const mounted = useRef(true);
  const [pressError, setPressError] = useState('');
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const invoke = async () => {
    if (locked.current || disabled || loading) return;
    locked.current = true;
    setPressError('');
    try {
      const result = onPress();
      if (result && typeof result.then === 'function') {
        setPending(true);
        await result;
      }
    } catch (error) {
      if (mounted.current) setPressError(userError(error));
    } finally {
      locked.current = false;
      if (mounted.current) setPending(false);
    }
  };
  const isBusy = loading || pending;
  const foreground = variant === 'primary' || variant === 'danger' ? C.onPrimary : C.text;
  const [scale] = useState(() => new Animated.Value(1));
  const layout = StyleSheet.flatten(style) || {};
  const press = (value: number) => {
    scale.stopAnimation();
    if (!motionEnabled) {
      scale.setValue(1);
      return;
    }
    Animated.timing(scale, {
      toValue: value,
      duration: value === 1 ? motionMs.release : motionMs.press,
      useNativeDriver: true,
    }).start();
  };
  useEffect(() => {
    if (!motionEnabled) {
      scale.stopAnimation();
      scale.setValue(1);
    }
  }, [motionEnabled, scale]);
  return (
    <Animated.View
      style={{
        flex: layout.flex,
        flexGrow: layout.flexGrow,
        flexShrink: layout.flexShrink,
        width: layout.width,
        minWidth: layout.minWidth,
        maxWidth: layout.maxWidth,
        alignSelf: layout.alignSelf,
        transform: [{ scale }],
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: disabled || isBusy, busy: isBusy }}
        disabled={disabled || isBusy}
        onPress={() => void invoke()}
        onPressIn={() => press(0.98)}
        onPressOut={() => press(1)}
        style={({ pressed }) => [
          {
            minHeight: 48,
            borderRadius: radius.input,
            paddingHorizontal: 16,
            paddingVertical: 11,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8,
            backgroundColor:
              variant === 'primary'
                ? C.primary
                : variant === 'danger'
                  ? C.red
                  : variant === 'secondary'
                    ? C.panel2
                    : 'transparent',
            borderWidth: 0,
            borderColor: variant === 'primary' ? C.primary : C.line,
            opacity: disabled ? 0.4 : pressed ? 0.92 : 1,
          },
          style,
          { flex: undefined, flexGrow: undefined, flexShrink: undefined, width: undefined },
        ]}
      >
        {isBusy ? (
          <ActivityIndicator color={foreground} />
        ) : Icon ? (
          <Icon size={18} color={foreground} />
        ) : null}
        <Text
          style={{
            color: foreground,
            fontSize: 16,
            lineHeight: 23,
            fontWeight: '700',
            flexShrink: 1,
            textAlign: 'center',
          }}
        >
          {label}
        </Text>
      </Pressable>
      {pressError ? <Notice text={pressError} tone="error" /> : null}
    </Animated.View>
  );
}
export function IconButton({
  label,
  icon: Icon,
  onPress,
}: {
  label: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  onPress: () => void;
}) {
  const { C } = useUI();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 48,
        minWidth: 48,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pressed ? C.selection : C.glass,
        borderRadius: radius.input,
        borderWidth: 0,
        borderColor: C.hairline,
      })}
    >
      <Icon size={21} color={C.text} />
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const { C, s } = useUI();
  const { markDirty } = usePanelChanges();
  return (
    <View style={{ gap: 8 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={C.subtle}
        {...props}
        onChangeText={(value) => {
          if (value !== props.value) markDirty();
          props.onChangeText?.(value);
        }}
        style={[s.input, props.style]}
      />
    </View>
  );
}
export function Chip({
  label,
  selected,
  onPress,
  color: suppliedColor,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  color?: string;
}) {
  const { C } = useUI();
  const color = suppliedColor || C.text;
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityState={{ selected }}
      aria-pressed={onPress ? selected : undefined}
      onPress={onPress}
      style={{
        minHeight: onPress ? 48 : 28,
        paddingHorizontal: 13,
        paddingVertical: onPress ? 10 : 5,
        borderRadius: radius.input,
        borderWidth: 1,
        borderColor: selected ? color : C.hairline,
        backgroundColor: selected ? `${color}16` : C.panel,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
      }}
    >
      {selected && onPress ? <Check size={13} color={color} /> : null}
      <Text
        style={{
          color: selected ? color : C.muted,
          fontSize: 14,
          lineHeight: 20,
          fontWeight: '600',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
type PanelChanges = {
  dirty: boolean;
  markDirty: () => void;
  resetDirty: () => void;
  requestClose: () => void;
};
const noop = () => {};
const visiblePanels: string[] = [];
const PanelChangesContext = createContext<PanelChanges>({
  dirty: false,
  markDirty: noop,
  resetDirty: noop,
  requestClose: noop,
});
/** Optional outside a panel; composite inputs may mark their enclosing form dirty. */
export function usePanelChanges() {
  return useContext(PanelChangesContext);
}

export function Sheet({
  visible,
  title,
  onClose,
  children,
  protectChanges = false,
  busy = false,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  protectChanges?: boolean;
  busy?: boolean;
}) {
  const { C, s } = useUI();
  const { width, fontScale } = useWindowDimensions();
  const panelId = useId();
  const insets = useSafeAreaInsets();
  const { motionEnabled } = useTheme();
  const [dirty, setDirty] = useState(false);
  const dirtyRef = useRef(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [transition] = useState(() => new Animated.Value(1));
  const trigger = useRef<HTMLElement | null>(null);
  const opened = useRef(false);
  const closed = useRef(false);
  const markDirty = useCallback(() => {
    dirtyRef.current = true;
    setDirty(true);
  }, []);
  const resetDirty = useCallback(() => {
    dirtyRef.current = false;
    setDirty(false);
  }, []);
  const requestClose = useCallback(() => {
    if (busy || closed.current || !visible) return;
    if (confirmDiscard) {
      setConfirmDiscard(false);
      return;
    }
    if (protectChanges && dirtyRef.current) {
      setConfirmDiscard(true);
      return;
    }
    closed.current = true;
    onClose();
  }, [busy, confirmDiscard, onClose, protectChanges, visible]);
  const pan = useMemo(
    () =>
      // PanResponder stores event callbacks; it does not invoke requestClose during render.
      // eslint-disable-next-line react-hooks/refs
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          gesture.dy > 12 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy > 64) requestClose();
        },
      }),
    [requestClose],
  );
  useEffect(() => {
    if (visible) {
      closed.current = false;
      opened.current = true;
      if (Platform.OS === 'web' && typeof document !== 'undefined')
        trigger.current = document.activeElement as HTMLElement | null;
    } else if (opened.current) {
      opened.current = false;
      resetDirty();
      setConfirmDiscard(false);
      if (trigger.current?.isConnected) trigger.current.focus();
    }
  }, [visible, resetDirty]);
  useEffect(() => {
    if (!visible) return;
    visiblePanels.push(panelId);
    return () => {
      const index = visiblePanels.indexOf(panelId);
      if (index >= 0) visiblePanels.splice(index, 1);
    };
  }, [visible, panelId]);
  useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && visiblePanels[visiblePanels.length - 1] === panelId) {
        event.preventDefault();
        event.stopPropagation();
        requestClose();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [visible, requestClose, panelId]);
  useEffect(() => {
    transition.stopAnimation();
    transition.setValue(visible && motionEnabled ? 0 : 1);
    if (!visible || !motionEnabled) return;
    const animation = Animated.timing(transition, {
      toValue: 1,
      duration: motionMs.sheetEnter,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [visible, motionEnabled, transition]);
  const panel = useMemo(
    () => ({ dirty, markDirty, resetDirty, requestClose }),
    [dirty, markDirty, resetDirty, requestClose],
  );
  // Remove the native modal immediately on dismissal: even a transparent native
  // Modal intercepts the underlying screen while an exit animation is running.
  const fullHeight = fontScale >= 1.5;
  return (
    <PanelChangesContext.Provider value={panel}>
      <Modal visible={visible} transparent animationType="none" onRequestClose={requestClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{
            flex: 1,
            justifyContent: fullHeight ? 'center' : 'flex-end',
            alignItems: 'center',
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom,
            paddingHorizontal: width >= 600 ? 24 : 0,
          }}
        >
          <Pressable
            testID="panel-backdrop"
            accessibilityRole="button"
            accessibilityLabel="Cerrar panel"
            disabled={busy}
            onPress={requestClose}
            style={[StyleSheet.absoluteFill, { backgroundColor: C.overlay }]}
          />
          <Animated.View
            accessibilityViewIsModal
            accessibilityLabel={title}
            style={{
              width: '100%',
              maxWidth: 640,
              maxHeight: '100%',
              flex: fullHeight ? 1 : undefined,
              backgroundColor: C.panel,
              borderTopLeftRadius: radius.sheet,
              borderTopRightRadius: radius.sheet,
              opacity: transition,
              transform: motionEnabled
                ? [
                    {
                      translateY: transition.interpolate({
                        inputRange: [0, 1],
                        outputRange: [24, 0],
                      }),
                    },
                  ]
                : [],
            }}
          >
            <View
              {...pan.panHandlers}
              testID="panel-drag-handle"
              style={{ minHeight: 24, justifyContent: 'center', alignItems: 'center' }}
            >
              <View style={{ width: 36, height: 4, borderRadius: 4, backgroundColor: C.line }} />
            </View>
            <View
              style={[
                s.row,
                {
                  paddingHorizontal: 20,
                  paddingBottom: 12,
                  borderBottomWidth: 1,
                  borderColor: C.hairline,
                },
              ]}
            >
              <Text accessibilityRole="header" style={[s.h2, s.grow]}>
                {title}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
                accessibilityState={{ disabled: busy }}
                disabled={busy}
                onPress={requestClose}
                style={{
                  minWidth: 48,
                  minHeight: 48,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={22} color={C.text} />
              </Pressable>
            </View>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentInsetAdjustmentBehavior="automatic"
              contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 24 }}
            >
              {children}
            </ScrollView>
            {confirmDiscard ? (
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: C.overlay, justifyContent: 'center', padding: 20 },
                ]}
              >
                <View
                  accessibilityViewIsModal
                  accessibilityRole="alert"
                  style={{
                    backgroundColor: C.panel,
                    borderRadius: radius.object,
                    padding: 20,
                    gap: 16,
                  }}
                >
                  <Text accessibilityRole="header" style={s.h2}>
                    ¿Descartar los cambios?
                  </Text>
                  <Text style={s.body}>Los cambios de este panel todavía no se guardaron.</Text>
                  <Button label="Seguir editando" onPress={() => setConfirmDiscard(false)} />
                  <Button
                    label="Descartar cambios"
                    variant="danger"
                    disabled={busy}
                    onPress={() => {
                      if (busy || closed.current) return;
                      closed.current = true;
                      resetDirty();
                      setConfirmDiscard(false);
                      onClose();
                    }}
                  />
                </View>
              </View>
            ) : null}
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </PanelChangesContext.Provider>
  );
}
export function Select({
  label,
  value,
  options,
  onChange,
  compact = false,
}: {
  label: string;
  compact?: boolean;
  value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
}) {
  const { C, s } = useUI();
  const [open, setOpen] = useState(false);
  const { markDirty } = usePanelChanges();
  return (
    <View style={{ gap: 7 }}>
      {!compact ? <Text style={s.label}>{label}</Text> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => setOpen(true)}
        style={[s.input, s.row]}
      >
        <Text style={[s.body, s.grow]}>
          {options.find((o) => o.value === value)?.label || 'Seleccionar'}
        </Text>
        <ChevronDown size={18} color={C.muted} />
      </Pressable>
      <Sheet visible={open} title={label} onClose={() => setOpen(false)}>
        {options.map((o) => (
          <Pressable
            key={o.value}
            accessibilityRole="button"
            accessibilityLabel={o.label}
            accessibilityState={{ selected: o.value === value }}
            aria-pressed={o.value === value}
            onPress={() => {
              if (o.value !== value) markDirty();
              onChange(o.value);
              setOpen(false);
            }}
            style={({ pressed }) => [
              s.row,
              {
                minHeight: 48,
                padding: 12,
                borderRadius: 10,
                backgroundColor: o.value === value || pressed ? C.selection : 'transparent',
              },
            ]}
          >
            <Text style={[s.body, { flex: 1 }]}>{o.label}</Text>
            {o.value === value ? <Check size={19} color={C.text} /> : null}
          </Pressable>
        ))}
      </Sheet>
    </View>
  );
}
export function Notice({
  text,
  tone = 'info',
}: {
  text: string;
  tone?: 'info' | 'error' | 'success';
}) {
  const { C, s } = useUI();
  const color = tone === 'error' ? C.danger : tone === 'success' ? C.green : C.infoText;
  const background =
    tone === 'error'
      ? C.dangerBackground
      : tone === 'success'
        ? C.successBackground
        : C.infoBackground;
  return (
    <View
      accessibilityRole="alert"
      style={{
        backgroundColor: background,
        borderColor: `${color}44`,
        borderWidth: 0,
        borderRadius: 12,
        padding: 16,
      }}
    >
      <Text style={[s.muted, { color }]}>{text}</Text>
    </View>
  );
}
export function Empty({ title, detail }: { title: string; detail: string }) {
  const { C, s } = useUI();
  return (
    <View style={[s.card, { padding: 34, alignItems: 'center' }]}>
      <Package size={36} color={C.subtle} />
      <Text style={s.h2}>{title}</Text>
      <Text style={[s.muted, { textAlign: 'center' }]}>{detail}</Text>
    </View>
  );
}
export function Screen({
  title,
  subtitle,
  children,
  action,
  back = false,
  scroll = true,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  back?: boolean;
  scroll?: boolean;
}) {
  const { C, s } = useUI();
  const { user } = useAuth(),
    inv = useInventory(),
    { width } = useWindowDimensions();
  const [recovery, setRecovery] = useState<string | null>(null),
    [localError, setLocalError] = useState('');
  const body = (
    <View
      style={{
        padding: width > 800 ? 32 : 20,
        gap: 24,
        width: '100%',
        maxWidth: 1500,
        alignSelf: 'center',
        flex: scroll ? undefined : 1,
      }}
    >
      <View style={{ gap: 8 }}>
        <View style={[s.row, { justifyContent: 'space-between' }]}>
          {back ? (
            <IconButton
              label="Volver"
              icon={ArrowLeft}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            />
          ) : null}
          <Text accessibilityRole="header" style={[s.title, { flex: 1, minWidth: 0 }]}>
            {title}
          </Text>
          {!back ? (
            <View style={[s.row, { gap: 6 }]}>
              <ThemeToggle />
              <IconButton
                label="Abrir ajustes"
                icon={Settings}
                onPress={() => router.push('/configuracion')}
              />
            </View>
          ) : null}
        </View>
        {subtitle ? <Text style={s.muted}>{subtitle}</Text> : null}
        {!back ? (
          <View style={[s.row, { gap: 6 }]}>
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: inv.online ? C.green : C.yellow,
              }}
            />
            <Text style={{ color: C.muted, fontSize: 12 }}>
              {DATA_MODE === 'demo'
                ? LOCAL_ONLY
                  ? 'Local · En este celular'
                  : 'Demo · En este dispositivo'
                : !inv.online
                  ? 'Sin conexión'
                  : inv.syncing
                    ? 'Sincronizando…'
                    : inv.queue.length
                      ? `${inv.queue.length} pendientes`
                      : 'Guardado en el equipo'}
            </Text>
          </View>
        ) : null}
      </View>
      {action ? <View style={{ alignSelf: 'stretch' }}>{action}</View> : null}
      {inv.error || inv.queue.some((q) => q.status === 'CONFLICT') ? (
        <View style={{ gap: 8 }}>
          <Notice text={inv.error || 'Conflicto pendiente de revisión.'} tone="error" />
          <Button
            label="Reintentar"
            icon={RefreshCw}
            variant="secondary"
            loading={inv.syncing}
            onPress={() => void inv.retry()}
          />
          {user?.role === 'ADMIN' ? (
            <>
              <Button
                label="Guardar copia"
                variant="secondary"
                onPress={() => void inv.backup().catch((e) => setLocalError(userError(e)))}
              />
              {DATA_MODE === 'demo' ? (
                <Button
                  label="Elegir recuperación"
                  variant="secondary"
                  onPress={() =>
                    void pickBackup()
                      .then(setRecovery)
                      .catch((e) => setLocalError(userError(e)))
                  }
                />
              ) : null}
              {recovery !== null ? (
                <ConfirmButton
                  label="Restaurar datos"
                  title="Recuperar desde copia"
                  description="Se conservará el original antes de reemplazar los datos demo por la copia validada."
                  onConfirm={async () => {
                    await inv.restore(recovery);
                    setRecovery(null);
                    setLocalError('');
                  }}
                />
              ) : null}
            </>
          ) : null}
          {localError ? <Notice text={localError} tone="error" /> : null}
          {inv.queue.some((q) => q.status === 'CONFLICT') ? (
            <ConfirmButton
              label="Descartar rechazo"
              title="Descartar intento rechazado"
              description="Se conservará una copia local del intento. Revisa el inventario actualizado y registra una corrección con motivo."
              onConfirm={inv.discard}
            />
          ) : null}
        </View>
      ) : null}
      {!inv.ready ? <ActivityIndicator color={C.red} /> : children}
    </View>
  );
  return (
    <SafeAreaView
      edges={back ? ['top', 'bottom', 'left', 'right'] : ['top', 'left', 'right']}
      style={{ flex: 1, backgroundColor: C.bg }}
    >
      <AuroraBackground />
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 30 }}
        >
          {body}
        </ScrollView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}
export function ConfirmButton({
  label,
  title,
  description,
  onConfirm,
  variant = 'danger',
}: {
  label: string;
  title: string;
  description: string;
  onConfirm: () => Promise<void>;
  variant?: 'danger' | 'secondary' | 'primary';
}) {
  const { s } = useUI();
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  return (
    <>
      <Button label={label} variant={variant} onPress={() => setOpen(true)} />
      <Sheet visible={open} title={title} busy={busy} onClose={() => !busy && setOpen(false)}>
        <Text style={s.body}>{description}</Text>
        {error ? <Notice text={error} tone="error" /> : null}
        <Button
          label="Confirmar"
          loading={busy}
          onPress={async () => {
            setBusy(true);
            try {
              await onConfirm();
              setOpen(false);
            } catch (e) {
              setError(userError(e));
            } finally {
              setBusy(false);
            }
          }}
        />
      </Sheet>
    </>
  );
}
export function Pending() {
  const { C, s } = useUI();
  return (
    <View style={[s.row, { gap: 5 }]}>
      <CloudOff size={13} color={C.subtle} />
      <Text style={{ fontSize: 11, color: C.muted }}>
        {DATA_MODE === 'demo' ? 'Guardado local' : 'Pendiente de nube'}
      </Text>
    </View>
  );
}
