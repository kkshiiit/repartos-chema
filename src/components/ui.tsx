import { userError } from '../services/errors';
import React, { useState } from 'react';
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
  ViewStyle,
  TextInputProps,
  StyleProp,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { useTheme } from '../context/ThemeContext';
import { dark, light, Colors } from '../theme/tokens';
import { pickBackup } from '../services/files';
import { ThemeToggle } from './ThemeToggle';
const makeStyles = (C: Colors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    card: {
      backgroundColor: C.panel,
      borderWidth: 1,
      borderColor: C.hairline,
      borderRadius: 16,
      padding: 18,
      gap: 14,
    },
    title: { color: C.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
    h2: { color: C.text, fontSize: 18, fontWeight: '700', lineHeight: 25 },
    body: { color: C.text, fontSize: 15, lineHeight: 23 },
    muted: { color: C.muted, fontSize: 13, lineHeight: 20 },
    label: { color: C.muted, fontSize: 12, fontWeight: '700', letterSpacing: 0.2 },
    input: {
      backgroundColor: C.bg,
      borderWidth: 1,
      borderColor: C.line,
      borderRadius: 11,
      color: C.text,
      paddingHorizontal: 14,
      paddingVertical: 13,
      fontSize: 15,
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
  onPress: () => void;
  icon?: React.ComponentType<{ size: number; color: string }>;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { C } = useUI();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: 46,
          borderRadius: 11,
          paddingHorizontal: 16,
          paddingVertical: 11,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 8,
          backgroundColor:
            variant === 'primary'
              ? C.red
              : variant === 'danger'
                ? C.dangerBg
                : variant === 'secondary'
                  ? C.panel2
                  : 'transparent',
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: C.line,
          opacity: disabled ? 0.4 : pressed ? 0.72 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? C.onPrimary : C.text} />
      ) : Icon ? (
        <Icon
          size={18}
          color={variant === 'primary' ? C.onPrimary : variant === 'danger' ? C.danger : C.text}
        />
      ) : null}
      <Text
        style={{
          color: variant === 'primary' ? C.onPrimary : variant === 'danger' ? C.danger : C.text,
          fontSize: 14,
          fontWeight: '700',
          flexShrink: 1,
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
    </Pressable>
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
        minHeight: 44,
        minWidth: 44,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pressed ? C.selection : C.panel,
        borderRadius: 12,
      })}
    >
      <Icon size={21} color={C.text} />
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const { C, s } = useUI();
  return (
    <View style={{ gap: 7 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={C.subtle}
        {...props}
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
        minHeight: onPress ? 44 : 28,
        paddingHorizontal: 13,
        paddingVertical: onPress ? 10 : 5,
        borderRadius: 9,
        borderWidth: 1,
        borderColor: selected ? color : C.hairline,
        backgroundColor: selected ? `${color}16` : C.panel,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
      }}
    >
      {selected && onPress ? <Check size={13} color={color} /> : null}
      <Text style={{ color: selected ? color : C.muted, fontSize: 12, fontWeight: '600' }}>
        {label}
      </Text>
    </Pressable>
  );
}
export function Sheet({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { C, s } = useUI();
  const { width } = useWindowDimensions();
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{
          flex: 1,
          backgroundColor: C.overlay,
          justifyContent: width < 600 ? 'flex-end' : 'center',
          alignItems: 'center',
          padding: 16,
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 560,
            maxHeight: '90%',
            backgroundColor: C.panel,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: C.hairline,
          }}
          accessibilityViewIsModal
        >
          <View style={[s.row, { padding: 16, borderBottomWidth: 1, borderColor: C.hairline }]}>
            <Text style={[s.h2, s.grow]}>{title}</Text>
            <IconButton label="Cerrar" icon={X} onPress={onClose} />
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 16, gap: 16 }}
          >
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
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
  const color = tone === 'error' ? C.danger : tone === 'success' ? C.green : C.muted;
  return (
    <View
      accessibilityRole="alert"
      style={{
        backgroundColor: `${color}0D`,
        borderColor: `${color}44`,
        borderWidth: 1,
        borderRadius: 12,
        padding: 13,
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
        padding: width > 800 ? 28 : 16,
        gap: width > 800 ? 24 : 18,
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
                ? 'Demo · En este dispositivo'
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
      <Sheet visible={open} title={title} onClose={() => !busy && setOpen(false)}>
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
