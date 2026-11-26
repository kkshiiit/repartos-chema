import { displayDate, serializeDateInput } from '../utils/dateInput';
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
  HelpCircle,
  Package,
  RefreshCw,
  X,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useInventory } from '../context/InventoryContext';
import { useTheme } from '../context/ThemeContext';
import { dark, light, Colors, radius, typography, motionMs, spacing, fonts } from '../theme/tokens';
import { ThemeToggle } from './ThemeToggle';
const makeStyles = (C: Colors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    card: {
      backgroundColor: C.panel,
      borderRadius: radius.object,
      borderWidth: 1,
      borderColor: C.hairline,
      padding: spacing.lg,
      gap: spacing.md,
    },
    title: { color: C.text, ...typography.title, letterSpacing: 0.2 },
    h2: { color: C.text, ...typography.section, letterSpacing: 0.2 },
    body: { color: C.text, ...typography.body },
    muted: { color: C.muted, ...typography.secondary },
    label: { color: C.text, ...typography.secondary, fontFamily: fonts.semibold },
    input: {
      backgroundColor: C.panel,
      borderWidth: 1,
      borderColor: C.controlBorder,
      borderRadius: radius.input,
      color: C.text,
      paddingHorizontal: 14,
      paddingVertical: 13,
      fontSize: typography.body.fontSize,
      fontFamily: fonts.regular,
      minHeight: 52,
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
  const { setBusy: setPanelBusy } = usePanelChanges();
  useEffect(() => {
    setPanelBusy(isBusy);
    return () => setPanelBusy(false);
  }, [isBusy, setPanelBusy]);
  const foreground =
    variant === 'danger' ? C.onDanger : variant === 'primary' ? C.onPrimary : C.text;
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
        flexShrink: layout.flexShrink ?? 1,
        width: layout.width,
        minWidth: layout.minWidth ?? 0,
        maxWidth: layout.maxWidth ?? '100%',
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
            minHeight: variant === 'primary' ? 54 : 50,
            borderRadius: radius.input,
            paddingHorizontal: 18,
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
                    ? pressed
                      ? C.panel2
                      : C.panel
                    : pressed
                      ? C.panel2
                      : 'transparent',
            borderWidth: variant === 'secondary' ? 1 : 0,
            borderColor: C.controlBorder,
            opacity: disabled ? 0.45 : pressed && (variant === 'primary' || variant === 'danger') ? 0.88 : 1,
          },
          style,
          { flex: undefined, flexGrow: undefined, flexShrink: undefined, width: undefined },
        ]}
      >
        {isBusy ? (
          <ActivityIndicator color={foreground} />
        ) : Icon ? (
          <Icon size={20} color={foreground} />
        ) : null}
        <Text
          style={{
            color: foreground,
            fontFamily: fonts.semibold,
            fontSize: 17,
            lineHeight: 22,
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
        backgroundColor: pressed ? C.panel2 : 'transparent',
        borderRadius: radius.pill,
        borderWidth: 0,
        borderColor: C.hairline,
      })}
    >
      <Icon size={24} color={C.text} />
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const { C, s } = useUI();
  const { markDirty } = usePanelChanges();
  const date = label.includes('AAAA-MM-DD');
  return (
    <View style={{ gap: 8 }}>
      <Text style={s.label}>{date ? label.replace('AAAA-MM-DD', 'DD/MM/AAAA') : label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={C.subtle}
        {...props}
        value={date && props.value ? displayDate(props.value) : props.value}
        onChangeText={(value) => {
          if (value !== props.value) markDirty();
          props.onChangeText?.(date ? serializeDateInput(value) : value);
        }}
        style={[s.input, props.style]}
      />
    </View>
  );
}
/** Filtro o etiqueta en forma de píldora. Seleccionado = tinta llena (alto contraste al sol). */
export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  color?: string;
}) {
  const { C } = useUI();
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityState={{ selected }}
      aria-pressed={onPress ? selected : undefined}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: onPress ? 44 : 28,
        maxWidth: '100%',
        flexShrink: 1,
        paddingHorizontal: onPress ? 16 : 10,
        paddingVertical: onPress ? 9 : 4,
        borderRadius: radius.pill,
        borderWidth: selected ? 0 : 1,
        borderColor: C.controlBorder,
        backgroundColor: selected ? C.text : pressed ? C.panel2 : C.panel,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
      })}
    >
      {selected && onPress ? <Check size={15} color={C.bg} strokeWidth={3} /> : null}
      <Text
        style={{
          color: selected ? C.bg : C.text,
          fontFamily: selected ? fonts.semibold : fonts.medium,
          flexShrink: 1,
          fontSize: 15,
          lineHeight: 20,
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
  setBusy: (busy: boolean, owner?: string) => void;
};
const noop = () => {};
const visiblePanels: string[] = [];
const PanelChangesContext = createContext<PanelChanges>({
  dirty: false,
  markDirty: noop,
  resetDirty: noop,
  requestClose: noop,
  setBusy: noop,
});
/** Optional outside a panel; composite inputs may mark their enclosing form dirty. */
export function usePanelChanges() {
  const panel = useContext(PanelChangesContext);
  const owner = useId();
  const panelSetBusy = panel.setBusy;
  const setBusy = useCallback(
    (value: boolean) => panelSetBusy(value, owner),
    [panelSetBusy, owner],
  );
  return { ...panel, setBusy };
}

export function Sheet({
  visible,
  title,
  onClose,
  children,
  protectChanges = false,
  hasChanges = false,
  busy: externalBusy = false,
  scroll = true,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  protectChanges?: boolean;
  hasChanges?: boolean;
  busy?: boolean;
  scroll?: boolean;
}) {
  const { C, s } = useUI();
  const { width, fontScale } = useWindowDimensions();
  const panelId = useId();
  const insets = useSafeAreaInsets();
  const { motionEnabled } = useTheme();
  const [childBusy, setChildBusy] = useState(false);
  const busyOwners = useRef(new Set<string>());
  const updateChildBusy = useCallback((value: boolean, owner = 'direct') => {
    if (value) busyOwners.current.add(owner);
    else busyOwners.current.delete(owner);
    setChildBusy(busyOwners.current.size > 0);
  }, []);
  const busy = externalBusy || childBusy;
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
    if (protectChanges && (dirtyRef.current || hasChanges)) {
      setConfirmDiscard(true);
      return;
    }
    closed.current = true;
    onClose();
  }, [busy, confirmDiscard, onClose, protectChanges, hasChanges, visible]);
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
    () => ({ dirty, markDirty, resetDirty, requestClose, setBusy: updateChildBusy }),
    [dirty, markDirty, resetDirty, requestClose, updateChildBusy],
  );
  // Remove the native modal immediately on dismissal: even a transparent native
  // Modal intercepts the underlying screen while an exit animation is running.
  const fullHeight = fontScale >= 1.5;
  return (
    <PanelChangesContext.Provider value={panel}>
      {/* RNWeb emits onRequestClose on keyup; our topmost-panel keydown already handled Escape. */}
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={Platform.OS === 'web' ? noop : requestClose}
      >
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
            role={Platform.OS === 'web' ? 'group' : undefined}
            accessibilityLabel={title}
            style={{
              width: '100%',
              maxWidth: 640,
              maxHeight: '100%',
              flex: fullHeight ? 1 : undefined,
              height: !scroll && !fullHeight ? '90%' : undefined,
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
              <Text
                accessibilityRole="header"
                style={[s.title, s.grow, { fontSize: 24, lineHeight: 30 }]}
              >
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
            {scroll ? (
              <ScrollView
                keyboardShouldPersistTaps="handled"
                contentInsetAdjustmentBehavior="automatic"
                contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 24 }}
              >
                {children}
              </ScrollView>
            ) : (
              <View style={{ flex: 1, minHeight: 0, padding: 20, gap: 16 }}>{children}</View>
            )}
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
      <Text style={[s.h2, { maxWidth: '100%', alignSelf: 'stretch', textAlign: 'center' }]}>
        {title}
      </Text>
      <Text style={[s.muted, { maxWidth: '100%', alignSelf: 'stretch', textAlign: 'center' }]}>
        {detail}
      </Text>
    </View>
  );
}
export function Screen({
  title,
  subtitle,
  children,
  action,
  footer,
  back = false,
  scroll = true,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  back?: boolean;
  scroll?: boolean;
}) {
  const { C, s } = useUI();
  const { user, session, error: authError } = useAuth(),
    inv = useInventory(),
    { width } = useWindowDimensions(),
    insets = useSafeAreaInsets();
  const pending = inv.queue.length;
  const syncTone = !inv.online ? C.warning : inv.error ? C.danger : pending ? C.warning : C.success;
  const syncText = !inv.online
    ? `Sin conexión${pending ? ` · ${pending} por enviar` : ' · guardado aquí'}`
    : inv.syncing
      ? 'Sincronizando…'
      : inv.error
        ? 'Error al sincronizar · tocá para reintentar'
        : pending
          ? `${pending} por enviar`
          : 'Sincronizado';
  const band = !back ? (
    <View style={{ backgroundColor: C.band, paddingTop: insets.top, borderBottomWidth: C.band === C.red ? 0 : 3, borderBottomColor: C.red }}>
      <View
        style={[
          s.row,
          {
            gap: 4,
            paddingLeft: width > 800 ? 24 : 16,
            paddingRight: width > 800 ? 16 : 8,
            minHeight: 60,
            width: '100%',
            maxWidth: 1100,
            alignSelf: 'center',
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${session?.teamName || 'Chema Andamios'}. ${syncText}. Tocar para sincronizar ahora.`}
          onPress={() => void inv.retry()}
          style={({ pressed }) => [s.grow, { opacity: pressed ? 0.75 : 1, minHeight: 52, justifyContent: 'center' }]}
        >
          <Text
            numberOfLines={1}
            style={{ color: C.onBand, fontFamily: fonts.display, fontSize: 20, lineHeight: 24, letterSpacing: 0.3 }}
          >
            {session?.teamName || 'Chema Andamios'}
          </Text>
          <View style={[s.row, { gap: 6 }]}>
            {inv.syncing ? (
              <ActivityIndicator size="small" color={C.onBand} />
            ) : (
              <View
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: 5,
                  backgroundColor: syncTone,
                  borderWidth: 1.5,
                  borderColor: C.onBand,
                }}
              />
            )}
            <Text numberOfLines={1} style={{ color: C.onBandMuted, fontFamily: fonts.medium, fontSize: 14 }}>
              {syncText}
            </Text>
          </View>
        </Pressable>
        <BandIcon label="Guía de uso" icon={HelpCircle} onPress={() => router.push('/guia')} />
        <ThemeToggle tone="band" />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Sesión de ${user?.nombre || ''}. Abrir ajustes`}
          onPress={() => router.push('/configuracion')}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            marginLeft: 4,
            borderRadius: 22,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: C.onBand,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text style={{ color: C.band === C.onBand ? C.text : C.band, fontFamily: fonts.display, fontSize: 18 }}>
            {initials(user?.nombre)}
          </Text>
        </Pressable>
      </View>
    </View>
  ) : null;
  const body = (
    <View
      style={{
        paddingHorizontal: width > 800 ? 24 : 16,
        paddingTop: back ? 8 : 18,
        paddingBottom: 16,
        gap: 16,
        width: '100%',
        maxWidth: 1100,
        alignSelf: 'center',
        flex: scroll ? undefined : 1,
      }}
    >
      <View style={{ gap: 4 }}>
        <View style={[s.row, { justifyContent: 'space-between', gap: 4 }]}>
          {back ? (
            <IconButton
              label="Volver"
              icon={ArrowLeft}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            />
          ) : null}
          <Text
            accessibilityRole="header"
            style={[s.title, { flex: 1, minWidth: 0 }, back && { fontSize: 24, lineHeight: 28 }]}
          >
            {title}
          </Text>
          {action ? <View style={{ flexShrink: 0 }}>{action}</View> : null}
        </View>
        {subtitle ? <Text style={s.muted}>{subtitle}</Text> : null}
      </View>
      {authError ? <Notice text={authError} tone="error" /> : null}
      {inv.error ? (
        <View style={{ gap: 8 }}>
          <Notice text={inv.error} tone="error" />
          <Button
            label="Reintentar"
            icon={RefreshCw}
            variant="secondary"
            loading={inv.syncing}
            onPress={() => void inv.retry()}
          />
        </View>
      ) : null}
      {inv.rejected?.length ? <RejectedNotice /> : null}
      {!inv.ready ? <ActivityIndicator color={C.red} /> : children}
    </View>
  );
  return (
    <SafeAreaView
      edges={back ? ['top', 'bottom', 'left', 'right'] : ['left', 'right']}
      style={{ flex: 1, backgroundColor: C.bg }}
    >
      {band}
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
      {footer ? (
        <View
          style={{
            backgroundColor: C.panel,
            borderTopWidth: 1,
            borderColor: C.hairline,
            paddingHorizontal: width > 800 ? 24 : 16,
            paddingVertical: 10,
          }}
        >
          <View style={{ width: '100%', maxWidth: 1052, alignSelf: 'center' }}>{footer}</View>
        </View>
      ) : null}
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
        Por enviar
      </Text>
    </View>
  );
}

export function initials(name?: string) {
  const parts = (name || '?').trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || '?') + (parts[1]?.[0] || '')).toUpperCase();
}
/** Cambios propios que el equipo no pudo aplicar (por ejemplo, stock ya usado por otra persona). */
function RejectedNotice() {
  const { s } = useUI();
  const inv = useInventory();
  const list = inv.rejected || [];
  return (
    <View style={{ gap: 8 }}>
      <Notice
        tone="error"
        text={`${list.length === 1 ? 'Un cambio tuyo no se pudo aplicar' : `${list.length} cambios tuyos no se pudieron aplicar`} porque otra persona modificó lo mismo antes. ${list[0]?.error || ''}`}
      />
      <Text style={s.muted}>Revisá los datos actualizados y, si hace falta, cargá el cambio de nuevo.</Text>
      <Button label="Entendido" variant="secondary" onPress={() => inv.dismissRejected?.()} />
    </View>
  );
}

/** Ícono sobre la franja de marca: sin caja, blanco, círculo al tocar. */
function BandIcon({
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
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pressed ? '#FFFFFF2E' : 'transparent',
      })}
    >
      <Icon size={24} color={C.onBand} />
    </Pressable>
  );
}
