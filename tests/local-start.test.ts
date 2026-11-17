import { describe,it,expect } from 'vitest';
import { Repository,type KeyValueStorage } from './helpers/legacyRepository';
import { emptyLocalState } from '../src/data/localInitialState';
import { seed,demoProfile } from '../src/data/seed';
class Storage implements KeyValueStorage {
  data=new Map<string,string>();
  failArchive=false;
  async getItem(key:string){return this.data.get(key)??null;}
  async setItem(key:string,value:string){if(this.failArchive&&key.includes('before-empty'))throw new Error('Disco lleno');this.data.set(key,value);}
}
describe('Inicio local sin pérdida de datos',()=>{
  it('instalación nueva comienza sin materiales, alquileres ni personas ficticias',async()=>{
    const repo=new Repository(new Storage(),'inventory',emptyLocalState);
    const e=await repo.load();
    expect(e.state.materiales).toEqual([]);expect(e.state.obras).toEqual([]);
    expect(e.state.responsables).toEqual([]);expect(e.queue).toEqual([]);
  });
  it('una actualización preserva datos existentes incluso si antes eran demo',async()=>{
    const storage=new Storage();const previous=new Repository(storage,'inventory',seed);
    const e=await previous.load();
    const updated=new Repository(storage,'inventory',emptyLocalState);
    expect(await updated.load()).toEqual(e);
  });
  it('empezar vacío conserva el original y permite recuperarlo después de reiniciar',async()=>{
    const storage=new Storage();const repo=new Repository(storage,'inventory',seed);
    const original=await repo.load();
    await repo.startEmpty(demoProfile('ADMIN'));
    expect((await repo.load()).state.materiales).toEqual([]);
    const reopened=new Repository(storage,'inventory',emptyLocalState);
    await reopened.load();
    expect(await reopened.recoverPrevious(demoProfile('ADMIN'))).toEqual(original);
  });
  it('si falla el archivo previo, no vacía inventario',async()=>{
    const storage=new Storage();const repo=new Repository(storage,'inventory',seed);
    const original=await repo.load();storage.failArchive=true;
    await expect(repo.startEmpty(demoProfile('ADMIN'))).rejects.toThrow('Disco lleno');
    expect(await repo.load()).toEqual(original);
  });
  it('datos corruptos no se reemplazan por inventario vacío',async()=>{
    const storage=new Storage();storage.data.set('inventory','contenido dañado');
    const repo=new Repository(storage,'inventory',emptyLocalState);
    await expect(repo.load()).rejects.toThrow();
    expect(storage.data.get('inventory')).toBe('contenido dañado');
  });
});
