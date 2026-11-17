import { Platform, Share } from 'react-native';
import type { UserProfile } from '../types';
import { ticketNumber, ticketText, ticketHtml, type TicketData, type TicketFormat } from '../utils/ticketFormat';
export * from '../utils/ticketFormat';

/** Comparte el ticket en el formato elegido. Devuelve una descripción para la auditoría. */
export async function shareTicket(format: TicketFormat, t: TicketData, user: UserProfile): Promise<string> {
  const o = t.obra;
  if (format === 'texto') {
    await Share.share({ message: ticketText(t), title: `Comprobante ${ticketNumber(o)}` });
    return 'texto';
  }
  if (format === 'whatsapp') {
    const phone = o.clienteTelefono.replace(/\D/g, '');
    const url = `https://wa.me/${/^\d{8,15}$/.test(phone) ? phone : ''}?text=${encodeURIComponent(ticketText(t))}`;
    const { openLink } = await import('./links');
    await openLink(url);
    return 'WhatsApp';
  }
  if (format === 'pdf') {
    const Print = await import('expo-print');
    const html = ticketHtml(t);
    if (Platform.OS === 'web') {
      await Print.printAsync({ html });
      return 'PDF';
    }
    const { uri } = await Print.printToFileAsync({ html, width: 595, height: 842 });
    const Sharing = await import('expo-sharing');
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
      dialogTitle: `Comprobante ${ticketNumber(o)}`,
    });
    return 'PDF';
  }
  const { exportDocument } = await import('./exportService');
  await exportDocument(format, [o], user);
  return format === 'word' ? 'Word' : 'Excel';
}
