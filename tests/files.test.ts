import { beforeEach, expect, it, vi } from 'vitest';
const native = vi.hoisted(() => ({
  picker: vi.fn(),
  read: vi.fn(),
  os: 'android',
}));
vi.mock('react-native', () => ({
  Platform: {
    get OS() {
      return native.os;
    },
  },
}));
vi.mock('expo-document-picker', () => ({ getDocumentAsync: native.picker }));
vi.mock('expo-sharing', () => ({}));
vi.mock('expo-file-system', () => ({
  Paths: {},
  File: class {
    text = native.read;
  },
}));
import { pickBackup } from '../src/services/files';
beforeEach(() => {
  vi.clearAllMocks();
  native.picker.mockResolvedValue({
    canceled: false,
    assets: [
      {
        uri: 'file:///cache/copia.json',
        name: 'copia.json',
        size: 100,
        mimeType: 'application/json',
      },
    ],
  });
  native.read.mockResolvedValue('{"format":"chema-backup-v1"}');
});
it('lee la copia temporal del selector Android sin pedir acceso general a almacenamiento', async () => {
  expect(await pickBackup()).toContain('chema-backup-v1');
  expect(native.picker).toHaveBeenCalledWith(
    expect.objectContaining({ copyToCacheDirectory: true, multiple: false }),
  );
});
it('cancelar no lee ningún archivo', async () => {
  native.picker.mockResolvedValue({ canceled: true, assets: null });
  expect(await pickBackup()).toBeNull();
  expect(native.read).not.toHaveBeenCalled();
});
it('si el proveedor no entrega archivo devuelve un error claro', async () => {
  native.picker.mockResolvedValue({ canceled: false, assets: [] });
  await expect(pickBackup()).rejects.toThrow(/No se recibió.*archivo/);
});
it('errores de acceso del proveedor explican cómo reintentar', async () => {
  native.read.mockRejectedValue(new Error('SecurityException: permission denied'));
  await expect(pickBackup()).rejects.toThrow(/No se pudo leer.*Descargas/);
});
it('archivo vacío no habilita restauración', async () => {
  native.read.mockResolvedValue('  ');
  await expect(pickBackup()).rejects.toThrow(/vacío/);
});
it('rechaza tamaño declarado excesivo antes de leer', async () => {
  native.picker.mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'content://provider/copia', name: 'copia.json', size: 52428801 }],
  });
  await expect(pickBackup()).rejects.toThrow(/50 MB/);
  expect(native.read).not.toHaveBeenCalled();
});
