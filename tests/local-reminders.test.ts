import { describe, expect, it, vi } from 'vitest';
import {
  FEEDBACK_KEY,
  REMINDER_PREFIX,
  ReminderAdapter,
  ReminderService,
  initialFeedbackState,
  parseFeedback,
  parseReminderDate,
} from '../src/services/feedback/reminders';
const obra = {
  id: 'synthetic-1',
  clienteNombre: 'Cliente de prueba',
  fechaRetiroEstimada: '2030-02-20',
  estadoProceso: 'ENTREGADO',
};
const at = '2030-02-20T12:00:00.000Z';
function fixture() {
  const data = new Map<string, string>();
  const scheduled = new Set<string>();
  const storage = {
    getItem: vi.fn(async (key: string) => data.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      data.set(key, value);
    }),
  };
  const adapter: ReminderAdapter = {
    supported: true,
    permission: vi.fn(async () => true),
    scheduled: vi.fn(async () => [...scheduled]),
    schedule: vi.fn(async (id) => {
      scheduled.add(id);
    }),
    cancel: vi.fn(async (id) => {
      scheduled.delete(id);
    }),
  };
  const service = new ReminderService(storage, adapter, () => Date.parse('2030-01-01'));
  return { data, storage, adapter, service, scheduled };
}
describe('recordatorios locales separados del inventario', () => {
  it('arranca sin confirmaciones ni avisos y nunca pide permiso al leer', async () => {
    const f = fixture();
    expect(await f.service.initialize()).toEqual(initialFeedbackState());
    expect(f.adapter.permission).not.toHaveBeenCalled();
  });
  it('permiso denegado no guarda ni programa un aviso', async () => {
    const f = fixture();
    vi.mocked(f.adapter.permission).mockResolvedValue(false);
    await expect(f.service.enable(obra, at, true, false)).rejects.toThrow('permiso');
    expect(f.storage.setItem).not.toHaveBeenCalled();
    expect(f.adapter.schedule).not.toHaveBeenCalled();
  });
  it('doble toque concurrente programa una vez y usa un identificador estable', async () => {
    const f = fixture();
    await Promise.all([
      f.service.enable(obra, at, false, false),
      f.service.enable(obra, at, false, false),
    ]);
    expect(f.adapter.schedule).toHaveBeenCalledTimes(1);
    expect(f.scheduled).toEqual(new Set([REMINDER_PREFIX + obra.id]));
    expect([...f.data.keys()]).toEqual([FEEDBACK_KEY]);
  });
  it('reintenta fallo nativo desde la intención persistida sin duplicar', async () => {
    const f = fixture();
    vi.mocked(f.adapter.schedule).mockRejectedValueOnce(new Error('OS falló'));
    await expect(f.service.enable(obra, at, false, false)).rejects.toThrow('OS falló');
    expect(f.service.snapshot().reminders[obra.id].status).toBe('pending');
    await f.service.reconcile([obra]);
    expect(f.scheduled.size).toBe(1);
    expect(f.service.snapshot().reminders[obra.id].status).toBe('scheduled');
  });
  it('fallo de persistencia inicial conserva estado y no toca el OS', async () => {
    const f = fixture();
    f.storage.setItem.mockRejectedValueOnce(new Error('sin espacio'));
    await expect(f.service.enable(obra, at, false, false)).rejects.toThrow('sin espacio');
    expect(f.adapter.schedule).not.toHaveBeenCalled();
    expect(f.adapter.cancel).not.toHaveBeenCalled();
    expect(f.service.snapshot().reminders).toEqual({});
  });
  it('recupera después de programar y fallar guardado final sin duplicación', async () => {
    const f = fixture();
    f.storage.setItem
      .mockImplementationOnce(async (key, value) => {
        f.data.set(key, value);
      })
      .mockRejectedValueOnce(new Error('sin espacio'));
    await expect(f.service.enable(obra, at, false, false)).rejects.toThrow('sin espacio');
    const restarted = new ReminderService(f.storage, f.adapter, () => Date.parse('2030-01-01'));
    await restarted.reconcile([obra]);
    expect(f.scheduled.size).toBe(1); // replacement cancels the previous identifier before scheduling
  });
  it.each(['date', 'deleted', 'RETIRADO', 'REINGRESADO'])(
    'cancela obsoleto por %s sin inventar un nuevo horario',
    async (change) => {
      const f = fixture();
      await f.service.enable(obra, at, false, false);
      const obras =
        change === 'deleted'
          ? []
          : [
              {
                ...obra,
                ...(change === 'date'
                  ? { fechaRetiroEstimada: '2030-03-01' }
                  : { estadoProceso: change }),
              },
            ];
      await f.service.reconcile(obras);
      expect(f.scheduled.size).toBe(0);
      expect(f.service.snapshot().reminders[obra.id].status).toBe('cancelled');
      expect(f.service.snapshot().reminders[obra.id].reason).toBeTruthy();
      expect(f.adapter.schedule).toHaveBeenCalledTimes(1);
    },
  );
  it('persiste cancelación antes de OS fallido y vuelve a cancelar al reconciliar', async () => {
    const f = fixture();
    await f.service.enable(obra, at, false, false);
    vi.mocked(f.adapter.cancel).mockRejectedValueOnce(new Error('ocupado'));
    await expect(f.service.cancel(obra.id)).rejects.toThrow('ocupado');
    expect(f.service.snapshot().reminders[obra.id].status).toBe('cancelled');
    await f.service.reconcile([obra]);
    expect(f.scheduled.size).toBe(0);
  });
  it('no repite un aviso vencido ni pide permisos durante reconciliación', async () => {
    const f = fixture();
    await f.service.enable(obra, at, false, false);
    f.scheduled.clear(); // Delivered or removed by the OS; absence is not proof of delivery.
    const restarted = new ReminderService(f.storage, f.adapter, () => Date.parse('2031-01-01'));
    await restarted.reconcile([obra]);
    expect(restarted.snapshot().reminders[obra.id].status).toBe('elapsed');
    expect(f.adapter.permission).toHaveBeenLastCalledWith(false);
    expect(f.scheduled.size).toBe(0);
  });
  it('conserva aviso ya programado si el OS lo demora, sin volver a programarlo', async () => {
    const f = fixture();
    await f.service.enable(obra, at, false, false);
    const restarted = new ReminderService(f.storage, f.adapter, () => Date.parse('2031-01-01'));
    await restarted.reconcile([obra]);
    expect(restarted.snapshot().reminders[obra.id].status).toBe('scheduled');
    expect(f.adapter.schedule).toHaveBeenCalledTimes(1);
    expect(f.scheduled.size).toBe(1);
  });
  it('fecha de retiro cambiada cancela aviso nativo incluso si las preferencias no se pueden persistir', async () => {
    const f = fixture();
    await f.service.enable(obra, at, false, false);
    f.storage.setItem.mockRejectedValueOnce(new Error('sin espacio'));
    await expect(
      f.service.reconcile([{ ...obra, fechaRetiroEstimada: '2030-04-01' }]),
    ).rejects.toThrow('sin espacio');
    expect(f.scheduled.size).toBe(0);
    await f.service.reconcile([{ ...obra, fechaRetiroEstimada: '2030-04-01' }]);
    expect(f.service.snapshot().reminders[obra.id].status).toBe('cancelled');
    expect(f.adapter.schedule).toHaveBeenCalledTimes(1);
  });
  it('un fallo de cancelación no bloquea la cancelación de otros avisos obsoletos', async () => {
    const f = fixture();
    await f.service.enable(obra, at, false, false);
    await f.service.enable({ ...obra, id: 'synthetic-2' }, at, false, false);
    vi.mocked(f.adapter.cancel).mockRejectedValueOnce(new Error('ocupado'));
    await expect(f.service.reconcile([])).rejects.toThrow('ocupado');
    expect(f.scheduled).toEqual(new Set([REMINDER_PREFIX + obra.id]));
    await f.service.reconcile([]);
    expect(f.scheduled.size).toBe(0);
  });
  it('permiso revocado cancela el aviso y explica por qué sin pedirlo nuevamente', async () => {
    const f = fixture();
    await f.service.enable(obra, at, false, false);
    vi.mocked(f.adapter.permission).mockResolvedValue(false);
    await f.service.reconcile([obra]);
    expect(f.service.snapshot().reminders[obra.id]).toMatchObject({
      status: 'cancelled',
      reason: expect.stringContaining('permiso'),
    });
    expect(f.scheduled.size).toBe(0);
    expect(f.adapter.permission).toHaveBeenLastCalledWith(false);
  });
  it('activar y desactivar concurrentes conserva el último intento y no deja avisos huérfanos', async () => {
    const f = fixture();
    await Promise.all([f.service.enable(obra, at, false, false), f.service.cancel(obra.id)]);
    expect(f.service.snapshot().reminders[obra.id].status).toBe('cancelled');
    expect(f.scheduled.size).toBe(0);
  });
  it('reconciliar no cancela notificaciones de otros módulos ni reprograma avisos vigentes', async () => {
    const f = fixture();
    await f.service.enable(obra, at, false, false);
    f.scheduled.add('other-notification');
    vi.mocked(f.adapter.cancel).mockClear();
    await f.service.reconcile([obra]);
    expect(f.adapter.cancel).not.toHaveBeenCalled();
    expect(f.adapter.schedule).toHaveBeenCalledTimes(1);
  });
  it('un fallo al guardar preferencias conserva el valor persistido anterior', async () => {
    const f = fixture();
    await f.service.initialize();
    f.storage.setItem.mockRejectedValueOnce(new Error('sin espacio'));
    await expect(f.service.preferences({ confirmations: true })).rejects.toThrow('sin espacio');
    expect(f.service.snapshot().preferences.confirmations).toBe(false);
  });
  it('web falla honestamente, no solicita permisos ni programa', async () => {
    const f = fixture();
    f.adapter.supported = false;
    await expect(f.service.enable(obra, at, false, false)).rejects.toThrow('web');
    expect(f.adapter.permission).not.toHaveBeenCalled();
  });
  it('fecha y hora explícitas rechazan inválidos y no normalizan fechas', () => {
    expect(parseReminderDate('31/02/2030', '12:00')).toBeNull();
    expect(parseReminderDate('20/02/2030', '24:00')).toBeNull();
    expect(parseReminderDate('20/02/2030', '')).toBeNull();
    expect(parseReminderDate('20/02/2030', '14:30')?.getHours()).toBe(14);
  });
  it('preferencias corruptas dan error y nunca se reemplazan silenciosamente', () => {
    expect(() => parseFeedback('{"version":1}')).toThrow('formato');
    expect(() => parseFeedback('null')).toThrow('formato');
  });
});
