import type { UserProfile } from '../types';
import { Repository, type KeyValueStorage } from '../data/repository';
import { emptyLocalState } from '../data/localInitialState';
import { prepareRestore } from './backupService';
/** A team restore is always a NEW local namespace; neither team nor original local data is overwritten. */
export async function restoreSharedCopyLocally(
  storage: KeyValueStorage,
  raw: string,
  actor: UserProfile,
  key: string,
): Promise<void> {
  if (actor.role !== 'ADMIN') throw new Error('Sólo administración puede restaurar una copia.');
  if (!/^chema:recovery:[a-zA-Z0-9_-]+:v1$/.test(key))
    throw new Error('La recuperación debe abrirse en un espacio local aislado.');
  if ((await storage.getItem(key)) !== null)
    throw new Error('Este espacio de recuperación ya existe. No se reemplazaron datos.');
  const prepared = await prepareRestore(raw);
  const isolated = new Repository(storage, key, emptyLocalState);
  await isolated.load();
  await isolated.restoreDemo(prepared, actor);
}
