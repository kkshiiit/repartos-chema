import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppState, Envelope, FaltanteRegistro, ObraCard } from '../src/types';
import { parseEnvelope } from '../src/data/validation';
import { Repository, type KeyValueStorage } from '../src/data/repository';
import { emptyState, demoProfile } from '../src/data/seed';
import { inspectBackup, prepareRestore } from '../src/services/backupService';

const { photos } = vi.hoisted(() => ({ photos: new Map<string, Uint8Array>() }));
vi.mock('../src/services/photoCache', () => ({
  storePhoto: async (id: string, bytes: Uint8Array) => {
    photos.set(id, bytes);
    return `chema-photo:${id}`;
  },
  photoBytes: async (id: string) => photos.get(id) ?? null,
}));
vi.mock('../src/services/files', () => ({ saveFile: vi.fn() }));

class Storage implements KeyValueStorage {
  data = new Map<string, string>();
  async getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  async setItem(key: string, value: string) {
    this.data.set(key, value);
  }
}

function work(id: string): ObraCard {
  return {
    id,
    clienteNombre: 'Cliente de prueba',
    clienteTelefono: '',
    direccion: 'Dirección de prueba',
    localidadBarrio: 'Zona de prueba',
    fechaEntrega: '2024-01-10',
    fechaRetiroEstimada: '2024-01-20',
    estadoProceso: 'PENDIENTE_ENTREGA',
    estadoSemaphoro: 'VERDE',
    syncStatus: 'PENDING',
    materialesCargados: [
      { materialId: 'material_a', nombre: 'Material de prueba', medida: '1.30m', cantidad: 5 },
    ],
    saldosEnObra: {},
    updatedAt: '2024-01-10T12:00:00.000Z',
  };
}

function state(): AppState {
  return {
    ...emptyState(),
    responsables: ['Responsable de prueba'],
    materiales: [
      {
        id: 'material_a',
        nombre: 'Material de prueba',
        categoria: 'ANDAMIOS',
        medida: '1.30m',
        cantidadGalpon: 20,
        cantidadEnObra: 0,
        cantidadEnTaller: 3,
        cantidadPerdido: 2,
      },
    ],
    obras: [work('obra_a'), work('obra_b')],
    combos: [
      {
        id: 'combo_a',
        nombreCombo: 'Combo de prueba',
        items: [{ materialId: 'material_a', cantidad: 2 }],
      },
    ],
  };
}

function envelope(): Envelope {
  return { schema: 1, state: state(), confirmed: state(), queue: [] };
}

function incident(overrides: Partial<FaltanteRegistro> = {}): FaltanteRegistro {
  return {
    id: 'incident_a',
    materialId: 'material_a',
    itemNombre: 'Material de prueba',
    tipo: 'DANADO',
    cantidad: 2,
    recuperado: 0,
    ...overrides,
  };
}

function backup(e: Envelope, includePhoto = false): string {
  if (includePhoto)
    e.state.obras[0]!.fotos = [
      {
        id: 'incoming_photo',
        uri: 'chema-photo:incoming_photo',
        status: 'PENDING',
        usuarioUid: 'local',
      },
    ];
  return JSON.stringify({
    format: 'chema-backup-v1',
    envelope: e,
    photos: includePhoto ? { incoming_photo: '/9j/4AH/2Q==' } : {},
  });
}

const invalid: { name: string; change: (s: AppState) => void; message: RegExp }[] = [
  {
    name: 'carga con material inexistente',
    change: (s) => {
      s.obras[0]!.materialesCargados[0]!.materialId = 'missing';
    },
    message: /carga.*material|material.*carga/i,
  },
  {
    name: 'material duplicado en carga',
    change: (s) => {
      s.obras[0]!.materialesCargados.push({ ...s.obras[0]!.materialesCargados[0]! });
    },
    message: /duplicad.*carga|carga.*duplicad/i,
  },
  {
    name: 'combo con ID duplicado',
    change: (s) => {
      s.combos.push({ ...s.combos[0]! });
    },
    message: /combo.*duplicad|duplicad.*combo/i,
  },
  {
    name: 'componente de combo inexistente',
    change: (s) => {
      s.combos[0]!.items[0]!.materialId = 'missing';
    },
    message: /combo.*material|material.*combo/i,
  },
  {
    name: 'componente duplicado en combo',
    change: (s) => {
      s.combos[0]!.items.push({ ...s.combos[0]!.items[0]! });
    },
    message: /combo.*duplicad|duplicad.*combo/i,
  },
  {
    name: 'faltante con material inexistente',
    change: (s) => {
      s.obras[0]!.faltantesRegistrados = [incident({ materialId: 'missing' })];
    },
    message: /faltante.*material|material.*faltante/i,
  },
  {
    name: 'faltante duplicado en una obra',
    change: (s) => {
      s.obras[0]!.faltantesRegistrados = [incident(), incident()];
    },
    message: /faltante.*duplicad|duplicad.*faltante/i,
  },
  {
    name: 'faltante duplicado entre obras',
    change: (s) => {
      for (const o of s.obras) o.faltantesRegistrados = [incident({ cantidad: 1 })];
    },
    message: /faltante.*duplicad|duplicad.*faltante/i,
  },
  {
    name: 'recuperado mayor que cantidad',
    change: (s) => {
      s.obras[0]!.faltantesRegistrados = [incident({ recuperado: 3 })];
    },
    message: /recuperad.*cantidad|cantidad.*recuperad/i,
  },
  {
    name: 'reservas de taller acumuladas mayores que stock',
    change: (s) => {
      s.obras[0]!.faltantesRegistrados = [incident()];
      s.obras[1]!.faltantesRegistrados = [incident({ id: 'incident_b' })];
    },
    message: /reserva.*taller|taller.*reserva/i,
  },
  {
    name: 'reservas de perdido acumuladas mayores que stock',
    change: (s) => {
      s.obras[0]!.faltantesRegistrados = [incident({ tipo: 'PERDIDO' })];
      s.obras[1]!.faltantesRegistrados = [
        incident({ id: 'incident_b', tipo: 'PERDIDO', cantidad: 1 }),
      ];
    },
    message: /reserva.*perdid|perdid.*reserva/i,
  },
  {
    name: 'medida incompatible con maestro',
    change: (s) => {
      s.obras[0]!.materialesCargados[0]!.medida = '70cm';
    },
    message: /medida/i,
  },
  {
    name: 'equivalencia física de medida no autorizada',
    change: (s) => {
      s.obras[0]!.materialesCargados[0]!.medida = '130cm';
    },
    message: /medida/i,
  },
  {
    name: 'retiro previsto anterior a entrega prevista',
    change: (s) => {
      s.obras[0]!.fechaRetiroEstimada = '2024-01-09';
    },
    message: /retiro.*entrega/i,
  },
  {
    name: 'retiro previsto anterior a entrega efectiva',
    change: (s) => {
      s.obras[0]!.fechaEntregaEfectiva = '2024-01-21';
    },
    message: /retiro.*entrega/i,
  },
  {
    name: 'retiro efectivo anterior a entrega efectiva',
    change: (s) => {
      Object.assign(s.obras[0]!, {
        fechaEntregaEfectiva: '2024-01-12',
        fechaRetiroEfectiva: '2024-01-11',
        estadoProceso: 'RETIRADO',
      });
    },
    message: /retiro.*entrega/i,
  },
  {
    name: 'retiro histórico anterior a entrega sin fecha efectiva',
    change: (s) => {
      Object.assign(s.obras[0]!, { fechaRetiroEfectiva: '2024-01-09', estadoProceso: 'RETIRADO' });
    },
    message: /retiro.*entrega/i,
  },
];

beforeEach(() => {
  photos.clear();
  photos.set('original_photo', new Uint8Array([1, 2, 3]));
});

describe.each(['state', 'confirmed'] as const)('integridad al importar %s', (part) => {
  it.each(invalid)(
    'rechaza $name antes de escribir inventario o fotos',
    async ({ change, message }) => {
      const storage = new Storage();
      const repo = new Repository(storage, 'inventory', state);
      await repo.load();
      const originalRaw = await repo.exportRaw();
      const originalFiles = [...photos.entries()];
      const originalStorage = [...storage.data.entries()];
      const incoming = envelope();
      change(incoming[part]);
      await expect(
        (async () =>
          repo.restoreDemo(await prepareRestore(backup(incoming, true)), demoProfile('ADMIN')))(),
      ).rejects.toThrow(message);
      expect(await repo.exportRaw()).toBe(originalRaw);
      expect([...storage.data.entries()]).toEqual(originalStorage);
      expect([...photos.entries()]).toEqual(originalFiles);
    },
  );
});

it('no aplica la validación semántica nueva al arranque legacy ni modifica el original', () => {
  for (const { change } of invalid) {
    const e = envelope();
    change(e.state);
    const raw = JSON.stringify(e);
    expect(JSON.stringify(parseEnvelope(raw))).toBe(raw);
  }
});

it('permite un alquiler vencido, fechas planificadas distintas de las efectivas y retiro anticipado', () => {
  const e = envelope();
  for (const s of [e.state, e.confirmed]) {
    Object.assign(s.obras[0]!, {
      estadoProceso: 'ENTREGADO',
      fechaEntregaEfectiva: '2024-01-12',
      estadoSemaphoro: 'ROJO',
    });
    Object.assign(s.obras[1]!, {
      estadoProceso: 'RETIRADO',
      fechaEntregaEfectiva: '2024-01-07',
      fechaRetiroEfectiva: '2024-01-08',
    });
  }
  const raw = backup(e);
  expect(inspectBackup(raw).envelope).toEqual(e);
});

it('permite faltantes libres y reserva solo cantidades vinculadas pendientes de recuperación', () => {
  const e = envelope();
  for (const s of [e.state, e.confirmed]) {
    s.obras[0]!.faltantesRegistrados = [
      incident({ cantidad: 8, recuperado: 5 }),
      incident({ id: 'free', materialId: undefined, cantidad: 100, recuperado: 2 }),
    ];
    s.obras[1]!.faltantesRegistrados = [incident({ id: 'lost', tipo: 'PERDIDO', cantidad: 2 })];
  }
  expect(inspectBackup(backup(e)).envelope).toEqual(e);
});

it('tolera escritura equivalente de medida, nombre histórico y BOM UTF8 real', async () => {
  const e = envelope();
  e.state.obras[0]!.materialesCargados[0]!.medida = ' 1,30 M ';
  e.state.obras[0]!.materialesCargados[0]!.nombre = 'Nombre anterior';
  const raw = new TextDecoder('utf-8', { ignoreBOM: true }).decode(
    new Uint8Array([0xef, 0xbb, 0xbf]),
  );
  expect(raw.charCodeAt(0)).toBe(0xfeff);
  expect(inspectBackup(raw + backup(e)).envelope).toEqual(e);
  expect(parseEnvelope(await prepareRestore(raw + backup(e))).state.obras).toHaveLength(2);
});

it('conserva registros históricos que ya no apuntan a una obra vigente', () => {
  const e = envelope();
  e.state.notificaciones.push({
    id: 'old_notice',
    obraId: 'deleted_work',
    message: 'Aviso histórico',
    status: 'SENT',
  });
  expect(inspectBackup(backup(e)).envelope).toEqual(e);
});
