import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronRight, FileSpreadsheet, FileText, FileType, MessageCircle, Receipt, Type } from 'lucide-react-native';
import type { ObraCard } from '../types';
import { useAuth } from '../context/AuthContext';
import { useInventory } from '../context/InventoryContext';
import { userError } from '../services/errors';
import { shareTicket, ticketData, ticketNumber, ticketText, TICKET_FORMATS, type TicketFormat } from '../services/ticket';
import { fonts } from '../theme/tokens';
import { Button, Notice, Sheet, useUI } from './ui';

const ICONS: Record<TicketFormat, React.ComponentType<{ size: number; color: string }>> = {
  pdf: FileType,
  whatsapp: MessageCircle,
  texto: Type,
  word: FileText,
  excel: FileSpreadsheet,
};

export function TicketShareButton({
  obra,
  style,
  trigger,
}: {
  obra: ObraCard;
  style?: object;
  /** Dibuja un disparador propio (por ejemplo, un ícono de la barra de contacto). */
  trigger?: (open: () => void) => React.ReactNode;
}) {
  const { C, s } = useUI();
  const { user, session } = useAuth();
  const inv = useInventory();
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState<TicketFormat | null>(null),
    [error, setError] = useState(''),
    [done, setDone] = useState('');
  const data = user ? ticketData(obra, inv.state, session?.teamName || 'Chema Andamios', user) : null;
  const send = async (format: TicketFormat) => {
    if (!data || !user) return;
    setBusy(format);
    setError('');
    setDone('');
    try {
      const label = await shareTicket(format, ticketData(obra, inv.state, session?.teamName || 'Chema Andamios', user, new Date()), user);
      await inv.note?.(`Compartió el ticket N° ${ticketNumber(obra)} (${label})`, obra.id);
      setDone(`Ticket ${label} listo.`);
    } catch (e) {
      setError(userError(e));
    } finally {
      setBusy(null);
    }
  };
  return (
    <>
      {trigger ? (
        trigger(() => setOpen(true))
      ) : (
        <Button label="Compartir ticket" icon={Receipt} variant="secondary" style={style} onPress={() => setOpen(true)} />
      )}
      <Sheet visible={open} title="Compartir ticket" busy={!!busy} onClose={() => setOpen(false)}>
        <Text style={s.body}>Elegí el formato. Se comparte lo alquilado por {obra.clienteNombre}.</Text>
        {data ? (
          <View style={{ borderRadius: 14, borderWidth: 1, borderColor: C.hairline, backgroundColor: C.panel2, padding: 12, maxHeight: 220, overflow: 'hidden' }}>
            <Text style={{ color: C.text, fontFamily: fonts.mono, fontSize: 12, lineHeight: 17 }}>
              {ticketText(data).replace(/\*/g, '')}
            </Text>
          </View>
        ) : null}
        {TICKET_FORMATS.map((f) => {
          const Icon = ICONS[f.value];
          return (
            <Pressable
              key={f.value}
              accessibilityRole="button"
              accessibilityLabel={`${f.label}. ${f.detail}`}
              disabled={!!busy}
              onPress={() => void send(f.value)}
              style={({ pressed }) => [
                s.row,
                {
                  minHeight: 64,
                  paddingHorizontal: 14,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: C.hairline,
                  backgroundColor: pressed ? C.selection : C.panel,
                  opacity: busy && busy !== f.value ? 0.5 : 1,
                },
              ]}
            >
              <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: C.selection, alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={22} color={C.accent} />
              </View>
              <View style={s.grow}>
                <Text style={[s.body, { fontFamily: fonts.semibold, fontWeight: '700' }]}>{f.label}</Text>
                <Text style={s.muted}>{busy === f.value ? 'Preparando…' : f.detail}</Text>
              </View>
              <ChevronRight size={20} color={C.muted} />
            </Pressable>
          );
        })}
        {error ? <Notice text={error} tone="error" /> : null}
        {done ? <Notice text={done} tone="success" /> : null}
      </Sheet>
    </>
  );
}
