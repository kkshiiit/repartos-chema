import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { MessageCircle, Navigation, Phone, Receipt } from 'lucide-react-native';
import type { ObraCard } from '../types';
import { openLink } from '../services/links';
import { mapsUrl } from '../utils/whatsapp';
import { fonts } from '../theme/tokens';
import { TicketShareButton } from './TicketShare';
import { useUI } from './ui';

type Icon = React.ComponentType<{ size: number; color: string }>;

function Tile({ label, a11y, icon: Icon, onPress, disabled }: { label: string; a11y?: string; icon: Icon; onPress: () => void; disabled?: boolean }) {
  const { C } = useUI();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y || label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minWidth: 0,
        minHeight: 72,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderRadius: 14,
        backgroundColor: pressed ? C.panel2 : 'transparent',
        opacity: disabled ? 0.4 : 1,
      })}
    >
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.selection, alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={22} color={C.accent} />
      </View>
      <Text numberOfLines={1} style={{ color: C.text, fontFamily: fonts.medium, fontSize: 13.5 }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Lo primero que se necesita al llegar a una obra: hablar con el cliente, llegar y dar el comprobante. */
export function ContactBar({ obra, onError }: { obra: ObraCard; onError: (e: unknown) => void }) {
  const { C } = useUI();
  const phone = obra.clienteTelefono.replace(/\D/g, '');
  const hasPhone = /^\d{8,15}$/.test(phone);
  const go = (url: string) => void openLink(url).catch(onError);
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: C.panel,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: C.hairline,
        padding: 4,
      }}
    >
      <Tile label="Llamar" a11y={hasPhone ? `Llamar a ${obra.clienteNombre}` : "Llamar: falta el teléfono del cliente"} icon={Phone} disabled={!hasPhone} onPress={() => go(`tel:+${phone}`)} />
      <Tile label="WhatsApp" icon={MessageCircle} disabled={!hasPhone} onPress={() => go(`https://wa.me/${phone}`)} />
      <Tile label="Cómo llegar" icon={Navigation} onPress={() => go(mapsUrl(obra))} />
      <TicketShareButton obra={obra} trigger={(open) => <Tile label="Ticket" a11y="Compartir ticket" icon={Receipt} onPress={open} />} />
    </View>
  );
}

/** Qué hay que hacer con este alquiler y para cuándo, con el color de su estado. */
export function NextStep({ title, detail, color, background }: { title: string; detail?: string; color: string; background: string }) {
  const { C } = useUI();
  return (
    <View
      accessibilityRole="summary"
      style={{ borderRadius: 16, backgroundColor: background, paddingVertical: 14, paddingHorizontal: 16, borderLeftWidth: 5, borderLeftColor: color, gap: 2 }}
    >
      <Text style={{ color: C.muted, fontFamily: fonts.medium, fontSize: 14 }}>Próximo paso</Text>
      <Text style={{ color, fontFamily: fonts.display, fontSize: 24, lineHeight: 28 }}>{title}</Text>
      {detail ? <Text style={{ color: C.text, fontFamily: fonts.regular, fontSize: 15 }}>{detail}</Text> : null}
    </View>
  );
}
