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
  LogOut,
  Package,
  RefreshCw,
  X,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useInventory } from '../context/InventoryContext';
import { DATA_MODE } from '../services/firebase';
export const C = {
  bg: '#0F172A',
  panel: '#172235',
  panel2: '#1C2940',
  line: '#2B3A50',
  text: '#F4F6FA',
  muted: '#A5B3C8',
  subtle: '#75869F',
  red: '#D32F2F',
  green: '#4ADE80',
  yellow: '#FACC15',
  blue: '#60A5FA',
};
export const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: {
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 18,
    padding: 20,
    gap: 14,
  },
  title: { color: C.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.7 },
  h2: { color: C.text, fontSize: 19, fontWeight: '700' },
  body: { color: C.text, fontSize: 15, lineHeight: 23 },
  muted: { color: C.muted, fontSize: 13, lineHeight: 20 },
  label: { color: C.muted, fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
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
  divider: { height: 1, backgroundColor: C.line },
  grow: { flex: 1 },
  section: { gap: 14 },
  error: { color: '#FDA4AF', fontSize: 14, lineHeight: 21 },
});
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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
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
                ? '#402333'
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
        <ActivityIndicator color="white" />
      ) : Icon ? (
        <Icon size={18} color={variant === 'danger' ? '#FDA4AF' : C.text} />
      ) : null}
      <Text
        style={{
          color: variant === 'danger' ? '#FDA4AF' : C.text,
          fontSize: 14,
          fontWeight: '700',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
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
  color = C.text,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  color?: string;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        minHeight: onPress ? 44 : 28,
        paddingHorizontal: 13,
        paddingVertical: onPress ? 11 : 5,
        borderRadius: 9,
        borderWidth: 1,
        borderColor: selected ? color : C.line,
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
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{
          flex: 1,
          backgroundColor: '#000000AA',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 16,
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 560,
            maxHeight: '92%',
            backgroundColor: C.panel,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: C.line,
          }}
        >
          <View style={[s.row, { padding: 20, borderBottomWidth: 1, borderColor: C.line }]}>
            <Text style={[s.h2, s.grow]}>{title}</Text>
            <Button label="Cerrar" icon={X} variant="ghost" onPress={onClose} />
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 20, gap: 18 }}
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
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ gap: 7 }}>
      <Text style={s.label}>{label}</Text>
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
          <Button
            key={o.value}
            label={o.label}
            variant={o.value === value ? 'primary' : 'secondary'}
            onPress={() => {
              onChange(o.value);
              setOpen(false);
            }}
          />
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
  const color = tone === 'error' ? '#FDA4AF' : tone === 'success' ? C.green : C.muted;
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
  const { user, logout } = useAuth(),
    inv = useInventory(),
    { width } = useWindowDimensions();
  const [account, setAccount] = useState(false);
  const body = (
    <View
      style={{
        padding: width > 800 ? 32 : 18,
        gap: 24,
        width: '100%',
        maxWidth: 1500,
        alignSelf: 'center',
        flex: scroll ? undefined : 1,
      }}
    >
      <View style={[s.row, { justifyContent: 'space-between' }]}>
        <View style={s.row}>
          <View
            style={{
              width: 7,
              height: 7,
              borderRadius: 5,
              backgroundColor: inv.online ? C.green : C.yellow,
            }}
          />
          <Text style={s.muted}>
            {DATA_MODE === 'demo'
              ? 'DEMO · Guardado local'
              : !inv.online
                ? 'Sin conexión'
                : inv.syncing
                  ? 'Sincronizando…'
                  : `${inv.queue.length} pendientes`}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir perfil"
          onPress={() => setAccount(true)}
          style={[s.row, { minHeight: 44 }]}
        >
          <Text style={[s.muted, { display: width < 450 ? 'none' : 'flex' }]}>{user?.nombre}</Text>
          <View
            style={{
              backgroundColor: C.panel2,
              width: 36,
              height: 36,
              borderRadius: 12,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: C.text, fontWeight: '700' }}>
              {user?.role === 'ADMIN' ? 'AD' : 'OP'}
            </Text>
          </View>
        </Pressable>
      </View>
      <View style={[s.row, { justifyContent: 'space-between', flexWrap: 'wrap' }]}>
        <View style={{ gap: 7, flexShrink: 1 }}>
          {back ? (
            <Button
              label="Volver"
              icon={ArrowLeft}
              variant="ghost"
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
              style={{ alignSelf: 'flex-start', paddingHorizontal: 0 }}
            />
          ) : null}
          <Text accessibilityRole="header" style={s.title}>
            {title}
          </Text>
          {subtitle ? <Text style={s.muted}>{subtitle}</Text> : null}
        </View>
        {action}
      </View>
      {inv.error ? (
        <View style={{ gap: 8 }}>
          <Notice text={inv.error} tone="error" />
          <Button
            label="Reintentar"
            icon={RefreshCw}
            variant="secondary"
            onPress={() => void inv.retry()}
          />
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
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: C.bg }}>
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
      <Sheet visible={account} title="Tu perfil" onClose={() => setAccount(false)}>
        <Text style={s.h2}>{user?.nombre}</Text>
        <Chip label={user?.role === 'ADMIN' ? 'Administración' : 'Operación'} selected />
        <Notice
          text={
            DATA_MODE === 'demo'
              ? 'Perfil de prueba. No equivale a una cuenta autenticada. Los datos de ejemplo se comparten entre ambos perfiles en este dispositivo.'
              : 'Cuenta verificada de Firebase. El servidor valida el rol de cada operación.'
          }
        />
        <Text style={s.muted}>
          {DATA_MODE === 'demo'
            ? 'Sin nube ni notificaciones enviadas.'
            : 'El inventario se confirma mediante transacciones del servidor.'}
        </Text>
        <Button
          label="Configuración"
          variant="secondary"
          onPress={() => {
            setAccount(false);
            router.push('/configuracion');
          }}
        />
        <Button
          label="Cambiar sesión"
          icon={LogOut}
          variant="secondary"
          onPress={() => {
            setAccount(false);
            void logout();
          }}
        />
      </Sheet>
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
              setError(e instanceof Error ? e.message : 'No se pudo completar.');
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
  return (
    <View style={[s.row, { gap: 5 }]}>
      <CloudOff size={13} color={C.subtle} />
      <Text style={{ fontSize: 11, color: C.muted }}>Pendiente de nube</Text>
    </View>
  );
}
