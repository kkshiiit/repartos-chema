import React, { useRef, useState } from 'react';
import { LayoutAnimation, Platform, Pressable, ScrollView, Text, UIManager, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  ChevronDown,
  ClipboardList,
  CloudOff,
  FileDown,
  History,
  LayoutGrid,
  Map,
  PackageCheck,
  PackageOpen,
  Plus,
  Receipt,
  SunMoon,
  UsersRound,
  Warehouse,
} from 'lucide-react-native';
import { Button, IconButton, useUI } from '../src/components/ui';
import { useAuth } from '../src/context/AuthContext';
import { fonts } from '../src/theme/tokens';

if (Platform.OS === 'android') UIManager.setLayoutAnimationEnabledExperimental?.(true);

type Icon = React.ComponentType<{ size: number; color: string }>;
interface Section {
  id: string;
  title: string;
  where: string;
  icon: Icon;
  summary: string;
  steps: string[];
  route?: string;
}
const SECTIONS: Section[] = [
  {
    id: 'equipo',
    title: 'Equipo e ingreso',
    where: 'Primera pantalla · Ajustes',
    icon: UsersRound,
    summary: 'Todos los teléfonos con el mismo código ven y cargan los mismos datos. Cada persona entra con su nombre.',
    steps: [
      'La primera persona toca "Crear un equipo nuevo" y escribe el nombre del negocio.',
      'En Ajustes aparece el código del equipo: tocá "Compartir código" y mandalo por WhatsApp.',
      'El resto instala la app, toca "Unirme a un equipo", escribe el código y elige su nombre.',
      'Para cambiar de persona en un mismo teléfono: tocá tu inicial (arriba a la derecha) → "Cambiar de persona".',
    ],
    route: '/configuracion',
  },
  {
    id: 'inicio',
    title: 'Alquileres (inicio)',
    where: 'Pestaña 1',
    icon: LayoutGrid,
    summary: 'La lista de todos los alquileres, ordenada por lo urgente. Los cuadros de arriba muestran el día de un vistazo.',
    steps: [
      'Rojo = atrasado, amarillo = es hoy, verde = al día, violeta = falta entregar.',
      'Tocá un cuadro (Hoy, Atrasados, Por entregar, En obra) para filtrar la lista.',
      'Usá la lupa para buscar por cliente, dirección o barrio.',
      'Tocá un alquiler para ver el detalle y sus acciones.',
    ],
    route: '/',
  },
  {
    id: 'nuevo',
    title: 'Cargar un alquiler nuevo',
    where: 'Inicio → botón "Nuevo alquiler"',
    icon: Plus,
    summary: 'Tres pasos: cliente, materiales y revisar. Nada sale del depósito hasta que confirmás la entrega.',
    steps: [
      'Cliente: nombre, teléfono, dirección, barrio y fechas de entrega y retiro.',
      'Carga: sumá andamios, tablones y accesorios con + y −, o elegí un combo armado.',
      'Revisar: controlá todo y guardá.',
    ],
    route: '/obra/nueva',
  },
  {
    id: 'entregar',
    title: 'Entregar',
    where: 'Detalle del alquiler → "Entregar"',
    icon: PackageCheck,
    summary: 'Al confirmar, los materiales salen del depósito y quedan "en obra".',
    steps: [
      'Elegí quién llevó el material (responsables) y quién lo recibió.',
      'Confirmá: el stock se descuenta solo y queda registrado con tu nombre.',
    ],
  },
  {
    id: 'retirar',
    title: 'Retirar',
    where: 'Detalle del alquiler → "Retirar"',
    icon: PackageOpen,
    summary: 'Al volver con el material, separá lo que vuelve bien, lo dañado y lo perdido.',
    steps: [
      'Indicá faltantes o roturas si los hay. Lo dañado va a taller, lo perdido queda anotado.',
      'Lo demás vuelve al depósito automáticamente.',
      'Después podés marcar "Reingresado" cuando todo quedó acomodado.',
    ],
  },
  {
    id: 'ticket',
    title: 'Compartir ticket',
    where: 'Detalle del alquiler → "Compartir ticket"',
    icon: Receipt,
    summary: 'Un comprobante profesional de lo alquilado, en el formato que elijas.',
    steps: [
      'PDF: ideal para mandar por WhatsApp o mail, o imprimir.',
      'Texto: se pega directo en un chat.',
      'Word o Excel: para editar o archivar.',
      'Cada ticket compartido queda anotado en la Auditoría.',
    ],
  },
  {
    id: 'deposito',
    title: 'Depósito',
    where: 'Pestaña 2',
    icon: Warehouse,
    summary: 'Cuánto hay de cada material: en depósito, en obras, en taller y perdido.',
    steps: [
      'Agregá materiales nuevos con su medida.',
      'Usá "Ajustar" para compras, roturas o conteos (siempre con motivo).',
      'Usá "Mover" para pasar de taller a depósito cuando se reparó algo.',
    ],
    route: '/galpon',
  },
  {
    id: 'viaje',
    title: 'Viaje',
    where: 'Pestaña 3',
    icon: Map,
    summary: 'Arma el recorrido del día con entregas y retiros, y lo abre en Google Maps.',
    steps: [
      'Ordená las paradas por cercanía o a mano.',
      'Tocá "Abrir en Maps" para navegar. "Volver al depósito" te lleva de regreso.',
    ],
    route: '/mapa',
  },
  {
    id: 'auditoria',
    title: 'Auditoría',
    where: 'Pestaña 4',
    icon: History,
    summary: 'Registro de TODO lo que pasa en la app: quién, qué, cuándo y qué materiales se movieron.',
    steps: [
      'Filtrá por persona o buscá por cliente.',
      'Cada fila muestra la persona, la hora y los movimientos de stock.',
      'Nadie puede borrar el registro: queda guardado en la nube.',
    ],
    route: '/historial',
  },
  {
    id: 'copias',
    title: 'Exportar e importar',
    where: 'Ajustes → "Exportar e importar copia"',
    icon: FileDown,
    summary: 'Guardá todo en un archivo JSON o recuperá datos desde uno.',
    steps: [
      'Exportar: genera un archivo con alquileres, depósito, combos, auditoría y fotos.',
      'Importar: reemplaza los datos del equipo por los del archivo (se avisa en todos los teléfonos).',
      'Sirve también para pasar datos de la versión anterior de la app.',
    ],
    route: '/configuracion',
  },
  {
    id: 'apariencia',
    title: 'Sol y noche',
    where: 'Botón sol/luna arriba · Ajustes',
    icon: SunMoon,
    summary: 'Modo Sol con máximo contraste para la calle, y modo Noche oscuro que no encandila.',
    steps: ['Tocá el sol/luna de arriba para cambiar rápido, o elegí "Auto" en Ajustes.'],
  },
  {
    id: 'offline',
    title: 'Sin señal',
    where: 'Punto de color arriba a la izquierda',
    icon: CloudOff,
    summary: 'La app funciona sin internet. Los cambios se guardan en el teléfono y se envían solos al volver la señal.',
    steps: [
      'Verde = sincronizado. Amarillo = hay cambios por enviar o no hay conexión.',
      'Tocá ese punto para sincronizar en el momento.',
      'Si dos personas usan el mismo material a la vez, gana la primera y a la otra le aparece un aviso.',
    ],
  },
];

const esc = (v: string) => v.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!);
function guideHtml() {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Guía Repartos Chema</title><style>
@page{size:A4;margin:16mm}body{font-family:-apple-system,Roboto,Helvetica,Arial,sans-serif;color:#0A0C10;font-size:13px;line-height:1.5}
h1{font-size:24px;margin:0 0 4px}.sub{color:#3B4350;margin-bottom:18px}
.sec{border:1px solid #C9D0D9;border-left:6px solid #C2410C;border-radius:10px;padding:10px 14px;margin:0 0 12px;page-break-inside:avoid}
.n{color:#C2410C;font-weight:800;font-size:11px;letter-spacing:1px;text-transform:uppercase}h2{font-size:16px;margin:2px 0 6px}
ol{margin:6px 0 0 18px;padding:0}li{margin:2px 0}</style></head><body>
<h1>Repartos Chema · Guía de uso</h1><div class="sub">Cada sección de la app, explicada en pocas líneas.</div>
${SECTIONS.map((s, i) => `<div class="sec"><div class="n">Sección ${i + 1} · ${esc(s.where)}</div><h2>${esc(s.title)}</h2><div>${esc(s.summary)}</div><ol>${s.steps.map((t) => `<li>${esc(t)}</li>`).join('')}</ol></div>`).join('')}
</body></html>`;
}
async function exportGuide() {
  const Print = await import('expo-print');
  if (Platform.OS === 'web') return Print.printAsync({ html: guideHtml() });
  const { uri } = await Print.printToFileAsync({ html: guideHtml(), width: 595, height: 842 });
  const Sharing = await import('expo-sharing');
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Guía Repartos Chema' });
}

export default function Guia() {
  const { C, s } = useUI();
  const { user } = useAuth();
  const [open, setOpen] = useState<string | null>('equipo');
  const scroll = useRef<ScrollView>(null);
  const positions = useRef<Record<string, number>>({});
  const toggle = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.create(160, 'easeInEaseOut', 'opacity'));
    setOpen((v) => (v === id ? null : id));
  };
  const jump = (id: string) => {
    setOpen(id);
    scroll.current?.scrollTo({ y: Math.max(0, (positions.current[id] || 0) - 8), animated: true });
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView ref={scroll} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View style={{ width: '100%', maxWidth: 720, alignSelf: 'center', gap: 14 }}>
          <View style={[s.row]}>
            <IconButton
              label="Volver"
              icon={ArrowLeft}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            />
            <Text accessibilityRole="header" style={[s.title, s.grow]}>
              Guía de uso
            </Text>
          </View>
          <Text style={s.body}>Tocá una sección para ver cómo se usa. Todo se explica en pocas líneas.</Text>
          <View accessibilityRole="tablist" style={[s.wrap, { gap: 8 }]}>
            {SECTIONS.map((sec, i) => (
              <Pressable
                key={sec.id}
                accessibilityRole="button"
                accessibilityLabel={`Ir a ${sec.title}`}
                onPress={() => jump(sec.id)}
                style={({ pressed }) => ({
                  minHeight: 44,
                  paddingHorizontal: 12,
                  borderRadius: 22,
                  borderWidth: 1,
                  borderColor: open === sec.id ? C.accent : C.hairline,
                  backgroundColor: open === sec.id || pressed ? C.selection : C.panel,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                })}
              >
                <Text style={{ color: C.accent, fontFamily: fonts.monoMedium, fontSize: 13 }}>{i + 1}</Text>
                <Text style={{ color: C.text, fontFamily: fonts.medium, fontSize: 14 }}>{sec.title}</Text>
              </Pressable>
            ))}
          </View>
          {SECTIONS.map((sec, i) => {
            const expanded = open === sec.id;
            return (
              <View
                key={sec.id}
                onLayout={(e) => (positions.current[sec.id] = e.nativeEvent.layout.y)}
                style={[s.card, { padding: 0, overflow: 'hidden', borderColor: expanded ? C.accent : C.hairline, borderWidth: expanded ? 2 : 1 }]}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded }}
                  accessibilityLabel={`${i + 1}. ${sec.title}. ${sec.summary}`}
                  onPress={() => toggle(sec.id)}
                  style={({ pressed }) => [s.row, { padding: 14, gap: 12, backgroundColor: pressed ? C.selection : 'transparent' }]}
                >
                  <View
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 14,
                      backgroundColor: expanded ? C.primary : C.panel2,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <sec.icon size={24} color={expanded ? C.onPrimary : C.text} />
                  </View>
                  <View style={s.grow}>
                    <Text style={{ color: C.accent, fontFamily: fonts.monoMedium, fontSize: 12 }}>
                      SECCIÓN {i + 1} · {sec.where.toUpperCase()}
                    </Text>
                    <Text style={[s.body, { fontFamily: fonts.semibold, fontSize: 17, fontWeight: '700' }]}>{sec.title}</Text>
                  </View>
                  <ChevronDown
                    size={22}
                    color={C.muted}
                    style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}
                  />
                </Pressable>
                {expanded ? (
                  <View style={{ paddingHorizontal: 14, paddingBottom: 16, gap: 10 }}>
                    <Text style={[s.body, { fontSize: 16 }]}>{sec.summary}</Text>
                    {sec.steps.map((step, n) => (
                      <View key={n} style={[s.row, { alignItems: 'flex-start', gap: 10 }]}>
                        <View
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 13,
                            borderWidth: 1.5,
                            borderColor: C.accent,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginTop: 1,
                          }}
                        >
                          <Text style={{ color: C.accent, fontFamily: fonts.semibold, fontSize: 13 }}>{n + 1}</Text>
                        </View>
                        <Text style={[s.body, s.grow]}>{step}</Text>
                      </View>
                    ))}
                    {sec.route && user ? (
                      <Button
                        label={`Ir a ${sec.title}`}
                        icon={ClipboardList}
                        variant="secondary"
                        onPress={() => router.push(sec.route as '/')}
                      />
                    ) : null}
                  </View>
                ) : null}
              </View>
            );
          })}
          <Button label="Exportar la guía en PDF" icon={FileDown} variant="secondary" onPress={exportGuide} />
          <Button
            label={user ? 'Listo, volver a la app' : 'Volver'}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
