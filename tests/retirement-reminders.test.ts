import { describe, expect, it, vi } from 'vitest';
import {
  FEEDBACK_KEY,
  REMINDER_PREFIX,
  ReminderAdapter,
  ReminderService,
  initialFeedbackState,
  parseFeedback,
} from '../src/services/feedback/reminders';

const obra = {
  id: 'rental-a',
  clienteNombre: 'Ana Pérez',
  direccion: 'San Martín 123',
  fechaRetiroEstimada: '2032-03-03',
  estadoProceso: 'ENTREGADO',
};
const enabled = { enabled: true, time: '08:00', offsets: [3, 2, 1, 0] };
const identifier = (id: string, offset: number) => `${REMINDER_PREFIX}${id}:d${offset}`;

function fixture(now = '2032-02-01T00:00:00.000Z') {
  const data = new Map<string, string>();
  const scheduled = new Map<string, { at: string; obraId: string; status: string }>();
  const storage = {
    getItem: vi.fn(async (key: string) => data.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      data.set(key, value);
    }),
  };
  const adapter: ReminderAdapter = {
    supported: true,
    permission: vi.fn(async () => true),
    scheduled: vi.fn(async () => [...scheduled.keys()]),
    schedule: vi.fn(async (id, reminder) => {
      scheduled.set(id, { ...reminder });
    }),
    cancel: vi.fn(async (id) => {
      scheduled.delete(id);
    }),
  };
  const service = new ReminderService(storage, adapter, () => Date.parse(now));
  return { data, storage, adapter, service, scheduled };
}

describe('políticas locales de retiro automáticas', () => {
  it('sonido y vibración de confirmación no cambian ni reprograman los avisos automáticos', async () => {
    const f = fixture();
    await f.service.configureGeneral(enabled, [obra]);
    vi.mocked(f.adapter.schedule).mockClear();
    vi.mocked(f.adapter.cancel).mockClear();
    await f.service.preferences({ confirmations: true, sound: true, vibration: true });
    await f.service.reconcile([obra]);
    expect(Object.values(f.service.snapshot().reminders)).toHaveLength(4);
    for (const reminder of f.scheduled.values())
      expect(reminder).toMatchObject({ sound: false, vibrate: false });
    expect(f.adapter.schedule).not.toHaveBeenCalled();
    expect(f.adapter.cancel).not.toHaveBeenCalled();
  });

  it('cambiar confirmaciones conserva sonido y vibración propios del manual legacy', async () => {
    const f = fixture();
    await f.service.enable(obra, '2032-03-02T15:00:00.000Z', true, false);
    vi.mocked(f.adapter.schedule).mockClear();
    await f.service.preferences({ confirmations: true, sound: false, vibration: true });
    await f.service.reconcile([obra]);
    expect(f.scheduled.get(REMINDER_PREFIX + obra.id)).toMatchObject({
      sound: true,
      vibrate: false,
    });
    expect(f.service.snapshot().rentalPolicies[obra.id]).toEqual({ mode: 'legacy' });
    expect(f.adapter.schedule).not.toHaveBeenCalled();
  });

  it('marca como pasados los avisos pendientes que vencieron con el permiso denegado', async () => {
    const f = fixture();
    let now = Date.parse('2032-02-01T00:00:00.000Z');
    const service = new ReminderService(f.storage, f.adapter, () => now);
    vi.mocked(f.adapter.permission).mockResolvedValue(false);
    await expect(service.configureGeneral(enabled, [obra])).rejects.toThrow('permiso');
    now = Date.parse('2032-03-04T12:00:00.000Z');
    await service.reconcile([obra]);
    for (const reminder of Object.values(service.snapshot().reminders))
      expect(reminder).toMatchObject({ status: 'elapsed', cancellationPending: false });
    expect(f.scheduled.size).toBe(0);
    expect(f.adapter.schedule).not.toHaveBeenCalled();
  });

  it('conserva el programado demorado por el OS hasta que se revoca el permiso y queda pasado', async () => {
    const f = fixture();
    let now = Date.parse('2032-02-01T00:00:00.000Z');
    const service = new ReminderService(f.storage, f.adapter, () => now);
    await service.configureGeneral({ ...enabled, offsets: [0] }, [obra]);
    now = Date.parse('2032-03-04T12:00:00.000Z');
    await service.reconcile([obra]);
    expect(service.snapshot().reminders[`${obra.id}:d0`]?.status).toBe('scheduled');
    expect(f.scheduled.size).toBe(1);
    vi.mocked(f.adapter.permission).mockResolvedValue(false);
    await service.reconcile([obra]);
    expect(service.snapshot().reminders[`${obra.id}:d0`]).toMatchObject({
      status: 'elapsed',
      cancellationPending: false,
    });
    expect(f.scheduled.size).toBe(0);
    expect(f.adapter.schedule).toHaveBeenCalledTimes(1);
  });

  it('extender con almacenamiento lleno cancela cuatro avisos obsoletos y conserva la intención durable', async () => {
    const f = fixture();
    await f.service.configureGeneral(enabled, [obra]);
    const previousState = structuredClone(f.service.snapshot());
    const previousRaw = f.data.get(FEEDBACK_KEY);
    f.storage.setItem.mockRejectedValueOnce(new Error('sin espacio'));
    await expect(
      f.service.reconcile([{ ...obra, fechaRetiroEstimada: '2032-03-10' }]),
    ).rejects.toThrow('sin espacio');
    expect(f.scheduled.size).toBe(0);
    expect(f.data.get(FEEDBACK_KEY)).toBe(previousRaw);
    expect(f.service.snapshot()).toEqual(previousState);
    await f.service.reconcile([{ ...obra, fechaRetiroEstimada: '2032-03-10' }]);
    expect(f.scheduled.size).toBe(4);
    expect(f.scheduled.get(identifier(obra.id, 0))?.at).toBe('2032-03-10T11:00:00.000Z');
  });

  it('persiste cancelaciones de avisos huérfanos y las reintenta aun si el OS ya no los enumera', async () => {
    const f = fixture();
    const key = 'rental-orphan:d1';
    const nativeId = REMINDER_PREFIX + key;
    f.scheduled.set(nativeId, {
      at: '2032-03-03T15:00:00.000Z',
      obraId: 'rental-orphan',
      status: 'scheduled',
    });
    vi.mocked(f.adapter.cancel).mockRejectedValueOnce(new Error('OS ocupado'));
    await expect(f.service.reconcile([])).rejects.toThrow('OS ocupado');
    expect(JSON.parse(f.data.get(FEEDBACK_KEY)!).reminders[key]).toMatchObject({
      status: 'cancelled',
      cancellationPending: true,
    });
    vi.mocked(f.adapter.scheduled).mockResolvedValue([]);
    const restarted = new ReminderService(f.storage, f.adapter);
    await restarted.reconcile([]);
    expect(f.scheduled.has(nativeId)).toBe(false);
    expect(restarted.snapshot().reminders[key]?.cancellationPending).toBe(false);
  });

  it('no agenda el manual mientras falla cancelar un automático del mismo alquiler', async () => {
    const f = fixture();
    await f.service.configureGeneral(enabled, [obra]);
    vi.mocked(f.adapter.cancel).mockImplementation(async (id) => {
      if (id === identifier(obra.id, 3)) throw new Error('automático ocupado');
      f.scheduled.delete(id);
    });
    await expect(f.service.enable(obra, '2032-03-03T15:00:00.000Z', false, false)).rejects.toThrow(
      'ocupado',
    );
    await expect(f.service.reconcile([obra])).rejects.toThrow('ocupado');
    expect(f.scheduled.has(REMINDER_PREFIX + obra.id)).toBe(false);
    expect(f.service.snapshot().reminders[obra.id]?.status).toBe('pending');
  });

  it('reconciliar vencidos sin cambios no vuelve a persistir ni cancelar sus intenciones', async () => {
    const f = fixture('2032-03-03T11:00:00.000Z');
    await f.service.configureGeneral(enabled, [obra]);
    f.storage.setItem.mockClear();
    vi.mocked(f.adapter.cancel).mockClear();
    await f.service.reconcile([obra]);
    expect(f.storage.setItem).not.toHaveBeenCalled();
    expect(f.adapter.cancel).not.toHaveBeenCalled();
  });

  it('si la hora vence durante la cancelación nativa no programa un aviso inmediato', async () => {
    const f = fixture();
    let now = Date.parse('2032-03-03T10:59:59.000Z');
    const service = new ReminderService(f.storage, f.adapter, () => now);
    vi.mocked(f.adapter.cancel).mockImplementation(async (id) => {
      f.scheduled.delete(id);
      now = Date.parse('2032-03-03T11:00:00.000Z');
    });
    await service.configureGeneral({ ...enabled, offsets: [0] }, [obra]);
    expect(f.scheduled.size).toBe(0);
    expect(service.snapshot().reminders[`${obra.id}:d0`]?.status).toBe('elapsed');
  });

  it('inicia desactivado, con cuatro días y sin solicitar permisos ni tocar inventario', async () => {
    const f = fixture();
    const state = await f.service.initialize();
    expect(state).toMatchObject({
      version: 2,
      globalPolicy: { enabled: false, time: '08:00', offsets: [3, 2, 1, 0] },
      rentalPolicies: {},
      reminders: {},
    });
    expect(f.adapter.permission).not.toHaveBeenCalled();
    expect(f.storage.setItem).not.toHaveBeenCalled();
  });

  it('programa cuatro instantes a las 08:00 de Argentina con identificadores estables', async () => {
    const f = fixture();
    await f.service.configureGeneral(enabled, [obra]);
    expect([...f.scheduled.entries()].map(([id, reminder]) => [id, reminder.at])).toEqual([
      [identifier(obra.id, 3), '2032-02-29T11:00:00.000Z'],
      [identifier(obra.id, 2), '2032-03-01T11:00:00.000Z'],
      [identifier(obra.id, 1), '2032-03-02T11:00:00.000Z'],
      [identifier(obra.id, 0), '2032-03-03T11:00:00.000Z'],
    ]);
    expect([...f.data.keys()]).toEqual([FEEDBACK_KEY]);
    expect(f.adapter.permission).toHaveBeenCalledWith(true);
  });

  it('hereda cambios generales y aplica también la política a alquileres nuevos', async () => {
    const f = fixture();
    await f.service.configureGeneral(enabled, [obra]);
    const otra = { ...obra, id: 'rental-b' };
    await f.service.configureGeneral({ ...enabled, time: '10:30' }, [obra, otra]);
    expect(f.scheduled.size).toBe(8);
    expect(f.scheduled.get(identifier(obra.id, 1))?.at).toBe('2032-03-02T13:30:00.000Z');
    expect(f.scheduled.get(identifier(otra.id, 1))?.at).toBe('2032-03-02T13:30:00.000Z');
    expect(f.service.snapshot().rentalPolicies[obra.id]?.mode ?? 'general').toBe('general');
  });

  it('cambios generales conservan horario y días personalizados de otro alquiler', async () => {
    const f = fixture();
    const otra = { ...obra, id: 'rental-b' };
    await f.service.configureGeneral(enabled, [obra, otra]);
    await f.service.configureRental(
      otra.id,
      {
        mode: 'custom',
        enabled: true,
        time: '16:45',
        offsets: [1, 0],
      },
      [obra, otra],
    );
    await f.service.configureGeneral({ ...enabled, time: '09:00', offsets: [2, 0] }, [obra, otra]);
    expect([...f.scheduled.keys()].sort()).toEqual(
      [
        identifier(obra.id, 0),
        identifier(obra.id, 2),
        identifier(otra.id, 0),
        identifier(otra.id, 1),
      ].sort(),
    );
    expect(f.scheduled.get(identifier(obra.id, 0))?.at).toBe('2032-03-03T12:00:00.000Z');
    expect(f.scheduled.get(identifier(otra.id, 0))?.at).toBe('2032-03-03T19:45:00.000Z');
  });

  it('desactivar general cancela heredados y conserva alquileres personalizados activos', async () => {
    const f = fixture();
    const otra = { ...obra, id: 'rental-b' };
    await f.service.configureGeneral(enabled, [obra, otra]);
    await f.service.configureRental(
      otra.id,
      {
        mode: 'custom',
        enabled: true,
        time: '08:00',
        offsets: [0],
      },
      [obra, otra],
    );
    await f.service.configureGeneral({ ...enabled, enabled: false }, [obra, otra]);
    expect([...f.scheduled.keys()]).toEqual([identifier(otra.id, 0)]);
  });

  it('un personalizado desactivado no se vuelve a activar al cambiar general', async () => {
    const f = fixture();
    await f.service.configureRental(
      obra.id,
      {
        mode: 'custom',
        enabled: false,
        time: '17:00',
        offsets: [0],
      },
      [obra],
    );
    await f.service.configureGeneral(enabled, [obra]);
    expect(f.scheduled.size).toBe(0);
    expect(f.service.snapshot().rentalPolicies[obra.id]).toMatchObject({
      mode: 'custom',
      enabled: false,
      time: '17:00',
      offsets: [0],
    });
  });

  it('volver explícitamente a general recupera la herencia en futuros cambios', async () => {
    const f = fixture();
    await f.service.configureGeneral(enabled, [obra]);
    await f.service.configureRental(
      obra.id,
      {
        mode: 'custom',
        enabled: true,
        time: '17:00',
        offsets: [0],
      },
      [obra],
    );
    await f.service.configureRental(obra.id, { mode: 'general' }, [obra]);
    await f.service.configureGeneral({ ...enabled, time: '09:15' }, [obra]);
    expect(f.scheduled.size).toBe(4);
    expect(f.scheduled.get(identifier(obra.id, 3))?.at).toBe('2032-02-29T12:15:00.000Z');
  });

  it('cada offset es independiente y nunca agrupa ni programa horas pasadas o iguales', async () => {
    const f = fixture('2032-03-01T11:00:00.000Z');
    await f.service.configureGeneral(enabled, [obra]);
    expect([...f.scheduled.keys()]).toEqual([identifier(obra.id, 1), identifier(obra.id, 0)]);
    expect(
      [...f.scheduled.values()].every(
        (r) => Date.parse(r.at) > Date.parse('2032-03-01T11:00:00.000Z'),
      ),
    ).toBe(true);
  });

  it('programa sólo hoy cuando faltan menos de 24 horas y la hora de hoy sigue futura', async () => {
    const f = fixture('2032-03-03T10:59:59.000Z');
    await f.service.configureGeneral(enabled, [obra]);
    expect([...f.scheduled.keys()]).toEqual([identifier(obra.id, 0)]);
  });

  it('ampliar la fecha reprograma los mismos cuatro identificadores sin duplicarlos', async () => {
    const f = fixture();
    await f.service.configureGeneral(enabled, [obra]);
    await f.service.reconcile([{ ...obra, fechaRetiroEstimada: '2032-03-06' }]);
    expect(f.scheduled.size).toBe(4);
    expect(f.scheduled.get(identifier(obra.id, 3))?.at).toBe('2032-03-03T11:00:00.000Z');
    expect(f.scheduled.get(identifier(obra.id, 0))?.at).toBe('2032-03-06T11:00:00.000Z');
    expect(f.service.snapshot().reminders[`${obra.id}:d0`]?.retirementDate).toBe('2032-03-06');
  });

  it('acortar la fecha cancela offsets vencidos y conserva los futuros para la fecha nueva', async () => {
    const f = fixture('2032-03-01T12:00:00.000Z');
    await f.service.configureGeneral(enabled, [{ ...obra, fechaRetiroEstimada: '2032-03-06' }]);
    await f.service.reconcile([{ ...obra, fechaRetiroEstimada: '2032-03-02' }]);
    expect([...f.scheduled.keys()]).toEqual([identifier(obra.id, 0)]);
    expect(f.scheduled.get(identifier(obra.id, 0))?.at).toBe('2032-03-02T11:00:00.000Z');
  });

  it.each(['RETIRADO', 'REINGRESADO'])(
    'finalizar como %s cancela todos los avisos sin cambiar el alquiler',
    async (estadoProceso) => {
      const f = fixture();
      await f.service.configureGeneral(enabled, [obra]);
      const finalizada = Object.freeze({ ...obra, estadoProceso });
      await f.service.reconcile([finalizada]);
      expect(f.scheduled.size).toBe(0);
      expect(finalizada).toEqual({ ...obra, estadoProceso });
      expect(
        Object.values(f.service.snapshot().reminders).every((r) => r.status === 'cancelled'),
      ).toBe(true);
    },
  );

  it('eliminar el alquiler cancela los cuatro avisos y deja intactas notificaciones ajenas', async () => {
    const f = fixture();
    await f.service.configureGeneral(enabled, [obra]);
    f.scheduled.set('other-module', {
      at: '2032-03-04T11:00:00.000Z',
      obraId: 'other',
      status: 'scheduled',
    });
    await f.service.reconcile([]);
    expect([...f.scheduled.keys()]).toEqual(['other-module']);
  });

  it('el aviso de mañana identifica cliente, dirección y fecha de retiro', async () => {
    const f = fixture();
    await f.service.configureGeneral(enabled, [obra]);
    const reminder = f.service.snapshot().reminders[`${obra.id}:d1`];
    expect(reminder).toMatchObject({
      offset: 1,
      notificationTitle: 'Retiro mañana · Ana Pérez',
      notificationBody: expect.stringContaining('San Martín 123'),
    });
    expect(reminder?.notificationBody).toMatch(/03[/-]03[/-]2032|2032-03-03/);
  });

  it('permiso denegado conserva configuración e intenciones pendientes y rechaza la activación', async () => {
    const f = fixture();
    vi.mocked(f.adapter.permission).mockResolvedValue(false);
    await expect(f.service.configureGeneral(enabled, [obra])).rejects.toThrow('permiso');
    expect(JSON.parse(f.data.get(FEEDBACK_KEY)!).globalPolicy).toEqual(enabled);
    expect(Object.values(f.service.snapshot().reminders)).toHaveLength(4);
    expect(Object.values(f.service.snapshot().reminders).every((r) => r.status === 'pending')).toBe(
      true,
    );
    expect(f.scheduled.size).toBe(0);
  });

  it('reintenta permiso concedido después de reiniciar sin volver a pedirlo', async () => {
    const f = fixture();
    vi.mocked(f.adapter.permission).mockResolvedValueOnce(false);
    await expect(f.service.configureGeneral(enabled, [obra])).rejects.toThrow('permiso');
    vi.mocked(f.adapter.permission).mockClear();
    const restarted = new ReminderService(f.storage, f.adapter, () => Date.parse('2032-02-01'));
    await restarted.reconcile([obra]);
    expect(f.scheduled.size).toBe(4);
    expect(f.adapter.permission).toHaveBeenCalledWith(false);
    expect(f.adapter.permission).not.toHaveBeenCalledWith(true);
  });

  it('persiste política y cuatro intenciones antes de consultar permisos o tocar el sistema', async () => {
    const f = fixture();
    vi.mocked(f.adapter.permission).mockImplementation(async () => {
      const durable = JSON.parse(f.data.get(FEEDBACK_KEY)!);
      expect(durable.globalPolicy).toEqual(enabled);
      expect(Object.keys(durable.reminders)).toHaveLength(4);
      return true;
    });
    await f.service.configureGeneral(enabled, [obra]);
    expect(f.scheduled.size).toBe(4);
  });

  it('un fallo al persistir no programa ni cambia la política anterior', async () => {
    const f = fixture();
    f.storage.setItem.mockRejectedValueOnce(new Error('sin espacio'));
    await expect(f.service.configureGeneral(enabled, [obra])).rejects.toThrow('sin espacio');
    expect(f.service.snapshot()).toEqual(initialFeedbackState());
    expect(f.scheduled.size).toBe(0);
    expect(f.adapter.permission).not.toHaveBeenCalled();
  });

  it('un fallo parcial de programación no informa éxito y recupera lo pendiente sin duplicar', async () => {
    const f = fixture();
    vi.mocked(f.adapter.schedule).mockRejectedValueOnce(new Error('OS ocupado'));
    await expect(f.service.configureGeneral(enabled, [obra])).rejects.toThrow('OS ocupado');
    expect(f.scheduled.size).toBe(3);
    expect(Object.values(f.service.snapshot().reminders).some((r) => r.status === 'pending')).toBe(
      true,
    );
    await f.service.reconcile([obra]);
    expect(f.scheduled.size).toBe(4);
    expect(
      Object.values(f.service.snapshot().reminders).every((r) => r.status === 'scheduled'),
    ).toBe(true);
  });

  it('persistir desactivación antes de un fallo de cancelación permite completarla al reiniciar', async () => {
    const f = fixture();
    await f.service.configureGeneral(enabled, [obra]);
    vi.mocked(f.adapter.cancel).mockRejectedValueOnce(new Error('OS ocupado'));
    await expect(
      f.service.configureGeneral({ ...enabled, enabled: false }, [obra]),
    ).rejects.toThrow('OS ocupado');
    expect(JSON.parse(f.data.get(FEEDBACK_KEY)!).globalPolicy.enabled).toBe(false);
    const restarted = new ReminderService(f.storage, f.adapter, () => Date.parse('2032-02-01'));
    await restarted.reconcile([obra]);
    expect(f.scheduled.size).toBe(0);
  });

  it('doble activación concurrente y reconciliaciones no duplican los cuatro avisos', async () => {
    const f = fixture();
    await Promise.all([
      f.service.configureGeneral(enabled, [obra]),
      f.service.configureGeneral(enabled, [obra]),
    ]);
    await f.service.reconcile([obra]);
    expect(f.scheduled.size).toBe(4);
    expect(f.adapter.schedule).toHaveBeenCalledTimes(4);
  });

  it('web conserva la política elegida y explica que no puede programar avisos nativos', async () => {
    const f = fixture();
    f.adapter.supported = false;
    await expect(f.service.configureGeneral(enabled, [obra])).rejects.toThrow('web');
    expect(f.service.snapshot().globalPolicy).toEqual(enabled);
    expect(f.scheduled.size).toBe(0);
    expect(f.adapter.permission).not.toHaveBeenCalled();
  });

  it('migrar v1 conserva opciones y aviso manual sin añadir cuatro automáticos por general', async () => {
    const f = fixture();
    const manual = {
      obraId: obra.id,
      title: obra.clienteNombre,
      retirementDate: obra.fechaRetiroEstimada,
      at: '2032-03-02T15:20:00.000Z',
      sound: true,
      vibrate: true,
      status: 'scheduled',
    };
    f.data.set(
      FEEDBACK_KEY,
      JSON.stringify({
        version: 1,
        preferences: { confirmations: true, sound: true, vibration: false },
        reminders: { [obra.id]: manual },
      }),
    );
    f.scheduled.set(REMINDER_PREFIX + obra.id, manual);
    const state = await f.service.initialize();
    expect(state.preferences).toEqual({ confirmations: true, sound: true, vibration: false });
    expect(state.reminders[obra.id]).toEqual(manual);
    expect(state.rentalPolicies[obra.id]?.mode).toBe('legacy');
    await f.service.configureGeneral(enabled, [obra]);
    expect([...f.scheduled.keys()]).toEqual([REMINDER_PREFIX + obra.id]);
    expect(f.service.snapshot().reminders[obra.id]).toEqual(manual);
  });

  it('volver a general cancela primero el manual migrado y habilita cuatro automáticos', async () => {
    const f = fixture();
    const manual = {
      obraId: obra.id,
      title: obra.clienteNombre,
      retirementDate: obra.fechaRetiroEstimada,
      at: '2032-03-02T15:20:00.000Z',
      sound: false,
      vibrate: false,
      status: 'scheduled',
    };
    f.data.set(
      FEEDBACK_KEY,
      JSON.stringify({
        version: 1,
        preferences: { confirmations: false, sound: false, vibration: false },
        reminders: { [obra.id]: manual },
      }),
    );
    f.scheduled.set(REMINDER_PREFIX + obra.id, manual);
    await f.service.configureGeneral(enabled, [obra]);
    vi.mocked(f.adapter.schedule).mockImplementation(async (id, reminder) => {
      expect(f.scheduled.has(REMINDER_PREFIX + obra.id)).toBe(false);
      f.scheduled.set(id, reminder);
    });
    await f.service.configureRental(obra.id, { mode: 'general' }, [obra]);
    expect(f.scheduled.size).toBe(4);
    expect(f.scheduled.has(REMINDER_PREFIX + obra.id)).toBe(false);
    expect(f.service.snapshot().reminders[obra.id]?.status).toBe('cancelled');
  });

  it('una política v2 inválida falla sin reemplazar datos guardados', async () => {
    const f = fixture();
    const raw = JSON.stringify({
      ...initialFeedbackState(),
      version: 2,
      globalPolicy: { enabled: true, time: '25:00', offsets: [3, 2, 1, 0] },
      rentalPolicies: {},
    });
    f.data.set(FEEDBACK_KEY, raw);
    expect(() => parseFeedback(raw)).toThrow();
    await expect(f.service.initialize()).rejects.toThrow();
    expect(f.data.get(FEEDBACK_KEY)).toBe(raw);
    expect(f.storage.setItem).not.toHaveBeenCalled();
  });

  it('si falla cancelar el manual al volver a general no duplica con avisos automáticos', async () => {
    const f = fixture();
    const manual = {
      obraId: obra.id,
      title: obra.clienteNombre,
      retirementDate: obra.fechaRetiroEstimada,
      at: '2032-03-02T15:20:00.000Z',
      sound: false,
      vibrate: false,
      status: 'scheduled',
    };
    f.data.set(
      FEEDBACK_KEY,
      JSON.stringify({
        version: 1,
        preferences: { confirmations: false, sound: false, vibration: false },
        reminders: { [obra.id]: manual },
      }),
    );
    f.scheduled.set(REMINDER_PREFIX + obra.id, manual);
    await f.service.configureGeneral(enabled, [obra]);
    vi.mocked(f.adapter.cancel).mockRejectedValueOnce(new Error('manual ocupado'));
    await expect(f.service.configureRental(obra.id, { mode: 'general' }, [obra])).rejects.toThrow(
      'manual ocupado',
    );
    expect([...f.scheduled.keys()]).toEqual([REMINDER_PREFIX + obra.id]);
    expect(f.service.snapshot().reminders[obra.id]?.status).toBe('cancelled');
    await f.service.reconcile([obra]);
    expect(f.scheduled.size).toBe(4);
    expect(f.scheduled.has(REMINDER_PREFIX + obra.id)).toBe(false);
  });

  it('desactivar políticas nunca solicita permisos de notificación', async () => {
    const f = fixture();
    await f.service.configureGeneral(enabled, [obra]);
    vi.mocked(f.adapter.permission).mockClear();
    await f.service.configureGeneral({ ...enabled, enabled: false }, [obra]);
    await f.service.configureRental(obra.id, { mode: 'custom', ...enabled, enabled: false }, [
      obra,
    ]);
    expect(f.adapter.permission).not.toHaveBeenCalledWith(true);
    expect(f.scheduled.size).toBe(0);
  });
});
