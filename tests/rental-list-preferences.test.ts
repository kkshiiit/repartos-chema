import { describe, expect, it } from 'vitest';
import { createRentalListPreferences } from '../src/services/rentalListPreferences';

function storage() {
  const data = new Map<string, string>();
  return {
    data,
    getItem: async (key: string) => data.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      data.set(key, value);
    },
  };
}
const preferences = {
  schema: 1 as const,
  query: 'Ballester',
  status: 'HOY',
  zone: 'Norte',
  scroll: 370,
};
describe('preferencias personales de alquileres', () => {
  it('reabre búsqueda, filtros y desplazamiento sin usar la clave comercial', async () => {
    const disk = storage();
    await createRentalListPreferences(disk, 'local:juan').save(preferences);
    expect(await createRentalListPreferences(disk, 'local:juan').load()).toEqual(preferences);
    expect([...disk.data.keys()]).toEqual(['chema:rental-list:v1:local%3Ajuan']);
  });
  it('aísla usuarios y espacios; una instalación nueva conserva valores vacíos', async () => {
    const disk = storage();
    await createRentalListPreferences(disk, 'equipoA:juan').save(preferences);
    expect(await createRentalListPreferences(disk, 'equipoB:juan').load()).toEqual({
      schema: 1,
      query: '',
      status: 'TODAS',
      zone: 'TODAS',
      scroll: 0,
    });
    expect(await createRentalListPreferences(disk, 'equipoA:ana').load()).toMatchObject({
      query: '',
      scroll: 0,
    });
  });
  it('un dato dañado o una versión no compatible no se reemplaza al intentar leer', async () => {
    const disk = storage();
    const key = 'chema:rental-list:v1:local';
    for (const raw of [
      '{',
      JSON.stringify({ ...preferences, schema: 9 }),
      JSON.stringify({ ...preferences, scroll: -1 }),
    ]) {
      disk.data.set(key, raw);
      await expect(createRentalListPreferences(disk, 'local').load()).rejects.toThrow(
        /vista|versión/i,
      );
      expect(disk.data.get(key)).toBe(raw);
    }
  });
  it('propaga fallo de escritura y no convierte NaN o cantidades inválidas en estado guardado', async () => {
    const disk = storage();
    await expect(
      createRentalListPreferences(disk, 'local').save({ ...preferences, scroll: NaN }),
    ).rejects.toThrow();
    expect(disk.data.size).toBe(0);
    const fail = {
      ...disk,
      setItem: async () => {
        throw new Error('Sin espacio');
      },
    };
    await expect(createRentalListPreferences(fail, 'local').save(preferences)).rejects.toThrow(
      'Sin espacio',
    );
  });
  it('serializa escrituras para que una respuesta tardía no restaure un filtro anterior', async () => {
    const disk = storage();
    const store = createRentalListPreferences(disk, 'local');
    await Promise.all([
      store.save(preferences),
      store.save({ ...preferences, query: 'Última consulta', scroll: 0 }),
    ]);
    expect(await store.load()).toMatchObject({ query: 'Última consulta', scroll: 0 });
  });
});
