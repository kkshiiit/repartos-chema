import { describe, it, expect } from 'vitest';
import { seed, demoProfile } from '../src/data/seed';
import { assertState } from '../src/domain/engine';
import { bootstrapShared, createCommand, prepareCommit } from '../src/shared/protocol';

const now = new Date('2026-10-10T12:00:00Z');
const actor = { ...demoProfile('ADMIN'), uid: 'admin_real_test' };
const other = { ...actor, uid: 'other_real_test' };

describe('protocolo compartido con el mismo dominio', () => {
  it('la misma devolución desde dos clientes no devuelve dos veces aunque tengan UUID distintos', () => {
    const base = bootstrapShared('space_test', seed(now), 'epoch_test');
    const a = createCommand(
      base,
      { type: 'RETIRE', obraId: 'obra_1', responsables: ['Fabián'], incidents: [] },
      'withdraw_a',
    );
    const b = createCommand(
      base,
      { type: 'RETIRE', obraId: 'obra_1', responsables: ['Fabián'], incidents: [] },
      'withdraw_b',
    );
    const after = prepareCommit(base, a, actor, now);
    expect(after.kind).toBe('CONFIRMED');
    if (after.kind !== 'CONFIRMED') return;
    const duplicate = prepareCommit(after.snapshot, b, other, now);
    expect(duplicate.kind).toBe('CONFLICT');
    expect(duplicate.message).toMatch(/ya|cambi/i);
    expect(after.snapshot.state.obras.find((o) => o.id === 'obra_1')?.estadoProceso).toBe(
      'RETIRADO',
    );
    expect(() => assertState(after.snapshot.state)).not.toThrow();
  });
  it('un deshacer crea tarea sucesora: una cola vieja no completa un retiro legítimo nuevo', () => {
    const base = bootstrapShared('space_test', seed(now), 'epoch_test');
    const stale = createCommand(
      base,
      { type: 'RETIRE', obraId: 'obra_1', responsables: ['Fabián'], incidents: [] },
      'stale',
    );
    const retire = prepareCommit(base, { ...stale, operationId: 'first' }, actor, now);
    if (retire.kind !== 'CONFIRMED') throw new Error(retire.message);
    const undo = prepareCommit(
      retire.snapshot,
      createCommand(retire.snapshot, { type: 'UNDO', logId: 'first' }, 'undo_first'),
      actor,
      now,
    );
    if (undo.kind !== 'CONFIRMED') throw new Error(undo.message);
    expect(undo.snapshot.tasks.obra_1?.id).not.toBe(base.tasks.obra_1?.id);
    expect(prepareCommit(undo.snapshot, stale, actor, now).kind).toBe('CONFLICT');
    expect(
      prepareCommit(undo.snapshot, createCommand(undo.snapshot, stale.action, 'second'), actor, now)
        .kind,
    ).toBe('CONFIRMED');
  });
  it('rechaza el mismo ID con otro contenido y no acepta epoch viejo', () => {
    const base = bootstrapShared('space_test', seed(now), 'epoch_test');
    const command = createCommand(base, { type: 'RESPONSABLES', nombres: ['Flete'] }, 'same_id');
    const changed = { ...command, action: { type: 'RESPONSABLES' as const, nombres: ['Otro'] } };
    expect(() => prepareCommit(base, changed, actor, now)).toThrow(/huella|contenido/i);
    expect(prepareCommit(base, { ...command, epoch: 'old' }, actor, now).kind).toBe('CONFLICT');
  });
  it('no permite que un operador ajuste inventario ni usa un actor del cliente', () => {
    const base = bootstrapShared('space_test', seed(now), 'epoch_test');
    const command = createCommand(
      base,
      {
        type: 'ADJUST',
        materialId: 'marco130',
        bucket: 'cantidadGalpon',
        delta: 1,
        motivo: 'Prueba',
        procedencia: 'Compra',
      },
      'adjust_id',
    );
    const result = prepareCommit(base, command, { ...actor, role: 'OPERADOR' }, now);
    expect(result.kind).toBe('CONFLICT');
    expect(base.state.materiales[0]?.cantidadGalpon).toBe(seed(now).materiales[0]?.cantidadGalpon);
  });
});
