import { describe, expect, it, vi } from 'vitest';
import { Repository } from '../src/data/repository';
import { parseEnvelope, validateImportEnvelope } from '../src/data/validation';
import { demoProfile, seed } from '../src/data/seed';
import { backupData, inspectBackup, prepareRestore } from '../src/services/backupService';
import type { Envelope, ObraInput, Operation } from '../src/types';

vi.mock('../src/services/files', () => ({ saveFile: vi.fn(), saveBackupToDestination: vi.fn() }));
vi.mock('../src/services/photoCache', () => ({ photoBytes: vi.fn(), storePhoto: vi.fn() }));

const key = 'chema:legacy-fixture:v1';
const actor = demoProfile('ADMIN');
const legacyDates = [undefined, null, '', '2030-02-30', 'sin fecha'];
function envelope(): Envelope {
  const state = seed(new Date('2030-02-01T12:00:00.000Z'));
  return { schema: 1, state, confirmed: structuredClone(state), queue: [] };
}
function legacyEnvelope(value: unknown): Envelope {
  const e = envelope();
  for (const state of [e.state, e.confirmed]) {
    if (value === undefined) Reflect.deleteProperty(state.obras[0]!, 'fechaRetiroEstimada');
    else Reflect.set(state.obras[0]!, 'fechaRetiroEstimada', value);
  }
  return e;
}
function fixture(e: Envelope) {
  const raw = JSON.stringify(e, null, 2) + '\n';
  const data = new Map([[key, raw]]);
  const storage = {
    getItem: vi.fn(async (name: string) => data.get(name) ?? null),
    setItem: vi.fn(async (name: string, value: string) => {
      data.set(name, value);
    }),
  };
  const initial = vi.fn(() => seed());
  const repo = new Repository(storage, key, initial);
  return { repo, storage, initial, data, raw };
}
function correctedInput(e: Envelope): ObraInput {
  const o = e.state.obras[0]!;
  return {
    id: o.id,
    clienteNombre: o.clienteNombre,
    clienteTelefono: o.clienteTelefono,
    direccion: o.direccion,
    localidadBarrio: o.localidadBarrio,
    fechaEntrega: o.fechaEntrega,
    fechaRetiroEstimada: '2030-02-15',
  };
}
function correction(e: Envelope): Operation {
  return {
    id: 'complete_retirement_date',
    createdAt: new Date().toISOString(),
    actor,
    action: { type: 'UPDATE_OBRA', obra: correctedInput(e), expectedVersion: 0 },
  };
}

describe('lectura acotada de fechas de retiro legacy', () => {
  it.each(legacyDates)(
    'abre el retiro legacy %s sin normalizar ni reescribir el original',
    async (value) => {
      const f = fixture(legacyEnvelope(value));
      const loaded = await f.repo.load();
      expect(loaded.state.obras[0]?.fechaRetiroEstimada).toBe(value);
      expect(Object.hasOwn(loaded.state.obras[0]!, 'fechaRetiroEstimada')).toBe(
        value !== undefined,
      );
      expect(loaded.confirmed.obras[0]?.fechaRetiroEstimada).toBe(value);
      expect(f.data.get(key)).toBe(f.raw);
      expect(await f.repo.exportRaw()).toBe(f.raw);
      expect(f.initial).not.toHaveBeenCalled();
      expect(f.storage.setItem).not.toHaveBeenCalled();
    },
  );

  it.each(legacyDates)('el parser por defecto conserva el rechazo estricto de %s', (value) => {
    const raw = JSON.stringify(legacyEnvelope(value));
    expect(() => parseEnvelope(raw)).toThrow('Datos locales');
    expect(() => parseEnvelope(raw, { allowLegacyRetirementDate: false })).toThrow('Datos locales');
    const parsed = parseEnvelope(raw, { allowLegacyRetirementDate: true });
    expect(JSON.stringify(parsed)).toBe(raw);
    expect(() => validateImportEnvelope(parsed)).toThrow();
  });

  it('completa la fecha con UPDATE_OBRA auditado, conserva stock y reabre el inverso legacy', async () => {
    const e = legacyEnvelope(null);
    const f = fixture(e);
    await f.repo.load();
    const next = await f.repo.dispatch(correction(e));
    expect(next.state.obras[0]?.fechaRetiroEstimada).toBe('2030-02-15');
    expect(next.confirmed.obras[0]?.fechaRetiroEstimada).toBe('2030-02-15');
    expect(next.state.materiales).toEqual(e.state.materiales);
    expect(next.state.obras.map((o) => o.saldosEnObra)).toEqual(
      e.state.obras.map((o) => o.saldosEnObra),
    );
    expect(next.state.obras[0]?.estadoProceso).toBe('ENTREGADO');
    expect(next.state.obras[0]?.version).toBe(1);
    expect(next.state.logs).toHaveLength(1);
    expect(next.state.logs[0]).toMatchObject({
      operationId: 'complete_retirement_date',
      accion: 'Editó datos de obra',
      movimientos: [],
    });
    expect(next.state.logs[0]?.payloadInverso?.snapshot.obras[0]?.fechaRetiroEstimada).toBeNull();
    const saved = f.data.get(key);
    const restarted = new Repository(f.storage, key, f.initial);
    const reloaded = await restarted.load();
    expect(reloaded).toEqual(next);
    expect(f.data.get(key)).toBe(saved);
    expect(f.storage.setItem).toHaveBeenCalledTimes(1);
  });

  it('permite fechas legacy en inversos históricos sin relajar el estado activo estricto', () => {
    const e = envelope();
    const snapshot = {
      obras: structuredClone(e.state.obras),
      materiales: structuredClone(e.state.materiales),
      combos: [],
      responsables: [],
      notificaciones: [],
    };
    Reflect.deleteProperty(snapshot.obras[0]!, 'fechaRetiroEstimada');
    e.state.logs.push({
      id: 'previous',
      operationId: 'previous',
      timestamp: '2030-01-01T12:00:00.000Z',
      usuarioUid: actor.uid,
      usuarioNombre: actor.nombre,
      accion: 'Acción anterior',
      movimientos: [],
      payloadInverso: { snapshot, expectedRevision: 0 },
    });
    const raw = JSON.stringify(e);
    expect(() => parseEnvelope(raw)).not.toThrow();
    expect(() => parseEnvelope(raw, { allowLegacyRetirementDate: true })).not.toThrow();
    expect(() => validateImportEnvelope(parseEnvelope(raw))).not.toThrow();
  });

  it('exporta una copia restaurable después de corregir la fecha, conservando el historial', async () => {
    const e = legacyEnvelope(null);
    const f = fixture(e);
    await f.repo.load();
    const corrected = await f.repo.dispatch(correction(e));
    const output = await backupData(await f.repo.exportRaw());
    expect(output.name).toBe('chema-copia.json');
    const backup = new TextDecoder().decode(output.bytes);
    const inspected = inspectBackup(backup);
    expect(inspected.envelope.state.obras[0]?.fechaRetiroEstimada).toBe('2030-02-15');
    expect(
      inspected.envelope.state.logs[0]?.payloadInverso?.snapshot.obras[0]?.fechaRetiroEstimada,
    ).toBeNull();
    const target = fixture(envelope());
    const restored = await target.repo.restoreDemo(await prepareRestore(backup), actor);
    expect(restored.state.materiales).toEqual(corrected.state.materiales);
    expect(restored.state.obras[0]?.fechaRetiroEstimada).toBe('2030-02-15');
    expect(restored.state.logs[0]?.operationId).toBe('complete_retirement_date');
  });

  it.each(['cantidad', 'id', 'fechaEntrega'])(
    'mantiene validación de %s en inversos históricos con fecha legacy',
    (kind) => {
      const e = envelope();
      const snapshot = {
        obras: structuredClone(e.state.obras),
        materiales: structuredClone(e.state.materiales),
        combos: [],
        responsables: [],
        notificaciones: [],
      };
      Reflect.set(snapshot.obras[0]!, 'fechaRetiroEstimada', null);
      if (kind === 'cantidad') snapshot.materiales[0]!.cantidadGalpon = -1;
      if (kind === 'id') snapshot.obras[0]!.id = 'invalid/id';
      if (kind === 'fechaEntrega') snapshot.obras[0]!.fechaEntrega = '2030-02-30';
      e.state.logs.push({
        id: 'previous',
        operationId: 'previous',
        timestamp: '2030-01-01T12:00:00.000Z',
        usuarioUid: actor.uid,
        usuarioNombre: actor.nombre,
        accion: 'Acción anterior',
        movimientos: [],
        payloadInverso: { snapshot, expectedRevision: 0 },
      });
      expect(() => parseEnvelope(JSON.stringify(e), { allowLegacyRetirementDate: true })).toThrow(
        'Datos locales',
      );
    },
  );

  it.each([0, false, {}, [], 20300215])(
    'no tolera otros tipos de fecha legacy: %s',
    async (value) => {
      const f = fixture(legacyEnvelope(value));
      await expect(f.repo.load()).rejects.toThrow('Datos locales');
      expect(f.data.get(key)).toBe(f.raw);
      expect(f.storage.setItem).not.toHaveBeenCalled();
    },
  );

  it.each(['cantidad', 'id', 'saldo', 'fechaEntrega', 'fechaEfectiva'])(
    'mantiene validación estricta de %s junto a la fecha legacy',
    async (kind) => {
      const e = legacyEnvelope(null);
      for (const state of [e.state, e.confirmed]) {
        if (kind === 'cantidad') state.materiales[0]!.cantidadGalpon = -1;
        if (kind === 'id') state.obras[0]!.id = 'invalid/id';
        if (kind === 'saldo') state.materiales[0]!.cantidadEnObra += 1;
        if (kind === 'fechaEntrega') state.obras[0]!.fechaEntrega = '2030-02-30';
        if (kind === 'fechaEfectiva') state.obras[0]!.fechaEntregaEfectiva = '2030-02-30';
      }
      const f = fixture(e);
      await expect(f.repo.load()).rejects.toThrow('Datos locales');
      expect(f.data.get(key)).toBe(f.raw);
      expect(f.storage.setItem).not.toHaveBeenCalled();
    },
  );

  it('rechaza importar un retiro legacy y conserva el original sin crear archivos', async () => {
    const f = fixture(envelope());
    await f.repo.load();
    await expect(
      f.repo.restoreDemo(JSON.stringify(legacyEnvelope('sin fecha')), actor),
    ).rejects.toThrow('Datos locales');
    expect(f.data.get(key)).toBe(f.raw);
    expect([...f.data.keys()]).toEqual([key]);
    expect(f.storage.setItem).not.toHaveBeenCalled();
  });

  it.each(['UPDATE_OBRA', 'CREATE_OBRA'] as const)(
    'no permite guardar una fecha inválida mediante %s',
    async (type) => {
      const e = legacyEnvelope(null);
      const f = fixture(e);
      await f.repo.load();
      const obra = {
        ...correctedInput(e),
        id: type === 'CREATE_OBRA' ? 'new_work' : e.state.obras[0]!.id,
        fechaRetiroEstimada: '2030-02-30',
      };
      const action = type === 'UPDATE_OBRA' ? { type, obra, expectedVersion: 0 } : { type, obra };
      await expect(
        f.repo.dispatch({ id: 'invalid_date', actor, createdAt: new Date().toISOString(), action }),
      ).rejects.toThrow();
      expect(f.data.get(key)).toBe(f.raw);
      expect(f.storage.setItem).not.toHaveBeenCalled();
    },
  );

  it('deshacer no restaura una fecha legacy inválida ni modifica el stock o la auditoría', async () => {
    const e = legacyEnvelope(null);
    const f = fixture(e);
    await f.repo.load();
    const corrected = await f.repo.dispatch(correction(e));
    const raw = f.data.get(key);
    await expect(
      f.repo.dispatch({
        id: 'undo_legacy_correction',
        createdAt: new Date().toISOString(),
        actor,
        action: { type: 'UNDO', logId: 'complete_retirement_date' },
      }),
    ).rejects.toThrow();
    expect(await f.repo.load()).toEqual(corrected);
    expect(f.data.get(key)).toBe(raw);
    expect(f.storage.setItem).toHaveBeenCalledTimes(1);
  });
});
