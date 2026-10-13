import type { AppState, MaterialItem, ObraCard, UserProfile } from '../types';
import { businessDate, trafficLight } from '../domain/rules';
export function emptyState(): AppState {
  return {
    revision: 0,
    obras: [],
    materiales: [],
    combos: [],
    responsables: ['Fabián', 'Socio 1', 'Flete Juan'],
    notificaciones: [],
    logs: [],
    appliedIds: [],
  };
}
export function demoProfile(role: 'ADMIN' | 'OPERADOR'): UserProfile {
  return {
    uid: `demo_${role.toLowerCase()}`,
    nombre: role === 'ADMIN' ? 'Administración demo' : 'Operación demo',
    email: '',
    role,
    createdAt: '2026-01-01T12:00:00.000Z',
  };
}
export function seed(now = new Date()): AppState {
  const s = emptyState();
  const today = businessDate(now);
  const shift = (n: number) => {
    const d = new Date(`${today}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  };
  const entries: [string, string, MaterialItem['categoria'], string, number][] = [
    ['marco130', 'Marco de andamio', 'ANDAMIOS', '1.30m', 120],
    ['tablon', 'Tablón metálico', 'TABLONES', '2.00m', 84],
    ['diagonal', 'Diagonal', 'ACCESORIOS', '2.00m', 160],
    ['base', 'Base regulable', 'ACCESORIOS', '', 96],
    ['tornillos', 'Tornillos/Tuercas', 'ACCESORIOS', '', 240],
    ['pasadores', 'Pasadores', 'ACCESORIOS', '', 180],
    ['abrazaderas', 'Abrazaderas', 'ACCESORIOS', '', 120],
    ['manijas', 'Manijas', 'ACCESORIOS', '', 80],
  ];
  s.materiales = entries.map(([id, nombre, categoria, medida, n]) => ({
    id,
    nombre,
    categoria,
    medida,
    cantidadGalpon: n,
    cantidadEnObra: 0,
    cantidadEnTaller: 0,
    cantidadPerdido: 0,
  }));
  const works: [string, string, string, string, number, ObraCard['estadoProceso'], number][] = [
    ['obra_1', 'Edificio Las Heras', 'Las Heras 2840', 'San Martín', -2, 'ENTREGADO', 16],
    ['obra_2', 'Casa Los Aromos', 'Los Aromos 125', 'Ballester', 0, 'ENTREGADO', 8],
    ['obra_3', 'Local Belgrano', 'Belgrano 3920', 'San Martín', 0, 'ENTREGADO', 12],
    ['obra_4', 'Obra La Estación', 'Independencia 1840', 'Suárez', 5, 'ENTREGADO', 20],
    ['obra_5', 'Vivienda Mitre', 'Mitre 2176', 'Ballester', 7, 'PENDIENTE_ENTREGA', 10],
    ['obra_6', 'Ampliación Italia', 'Italia 730', 'Suárez', 10, 'ENTREGADO', 6],
  ];
  s.obras = works.map(([id, clienteNombre, direccion, localidadBarrio, days, estadoProceso, n]) => {
    const materialesCargados = [
      { materialId: 'marco130', nombre: 'Marco de andamio', medida: '1.30m', cantidad: n },
      {
        materialId: 'tablon',
        nombre: 'Tablón metálico',
        medida: '2.00m',
        cantidad: n / 2,
        apodo: 'Antideslizante',
      },
      { materialId: 'diagonal', nombre: 'Diagonal', medida: '2.00m', cantidad: n },
    ];
    const o: ObraCard = {
      id,
      clienteNombre,
      clienteTelefono: '',
      direccion,
      localidadBarrio,
      estadoSemaphoro: 'VERDE',
      materialesCargados,
      estadoProceso,
      fechaEntrega: shift(estadoProceso === 'ENTREGADO' ? -7 : 0),
      fechaRetiroEstimada: shift(days),
      entregadoPor: estadoProceso === 'ENTREGADO' ? ['Fabián'] : [],
      saldosEnObra: {},
      syncStatus: 'PENDING',
      updatedAt: now.toISOString(),
    };
    if (estadoProceso === 'ENTREGADO')
      for (const i of materialesCargados) {
        o.saldosEnObra[i.materialId] = i.cantidad;
        const m = s.materiales.find((m) => m.id === i.materialId)!;
        m.cantidadGalpon -= i.cantidad;
        m.cantidadEnObra += i.cantidad;
      }
    o.estadoSemaphoro = trafficLight(o, today);
    return o;
  });
  s.combos = [
    {
      id: 'torre130',
      nombreCombo: 'Combo Torre 1.30m',
      items: [
        { materialId: 'marco130', cantidad: 4 },
        { materialId: 'tablon', cantidad: 2 },
        { materialId: 'diagonal', cantidad: 4 },
        { materialId: 'base', cantidad: 4 },
      ],
    },
    {
      id: 'pasillero',
      nombreCombo: 'Combo Pasillero',
      items: [
        { materialId: 'marco130', cantidad: 8 },
        { materialId: 'tablon', cantidad: 4 },
        { materialId: 'diagonal', cantidad: 8 },
      ],
    },
  ];
  return s;
}
