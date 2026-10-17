import AsyncStorage from '@react-native-async-storage/async-storage';
import { openDatabaseAsync } from 'expo-sqlite';
import { File, Paths } from 'expo-file-system';
import { randomUUID } from 'expo-crypto';
import { SqliteStorage, type SqlDatabase } from './sqliteStorage';
import { createNativeInventoryStorage } from './nativeInventoryStorage';
// Fuera de AsyncStorage: una base legacy llena no impide activar SQLite.
const flag = () => new File(Paths.document, 'chema-sqlite-activated-v1.txt');
export const inventoryStorage = createNativeInventoryStorage(
  AsyncStorage,
  async () => {
    const database = await openDatabaseAsync('chema-inventario-v1.db');
    return new SqliteStorage(database as unknown as SqlDatabase);
  },
  {
    async activated() {
      const file = flag();
      if (!file.exists) return false;
      if ((await file.text()) !== 'active-v1')
        throw new Error(
          'La marca de almacenamiento no es válida. Se conservan los originales para asistencia.',
        );
      return true;
    },
    async activate() {
      const file = flag();
      if (file.exists && (await file.text()) === 'active-v1') return;
      const temporary = new File(Paths.document, `chema-activacion-${randomUUID()}.tmp`);
      temporary.create({ overwrite: false });
      temporary.write('active-v1');
      if ((await temporary.text()) !== 'active-v1')
        throw new Error('No se pudo verificar la activación de SQLite. No se borraron datos.');
      temporary.move(file);
    },
  },
);
