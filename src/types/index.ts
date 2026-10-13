export type UserRole = 'ADMIN' | 'OPERADOR';
export interface UserProfile {
  uid: string;
  nombre: string;
  email: string;
  role: UserRole;
  createdAt: string;
}
export type CategoriaMaterial = 'ANDAMIOS' | 'TABLONES' | 'ACCESORIOS' | 'OTROS';
export interface MaterialItem {
  id: string;
  nombre: string;
  categoria: CategoriaMaterial;
  medida?: string;
  cantidadGalpon: number;
  cantidadEnObra: number;
  cantidadEnTaller: number;
  cantidadPerdido: number;
}
export interface FaltanteRegistro {
  id: string;
  itemNombre: string;
  cantidad: number;
  tipo: 'PERDIDO' | 'DANADO';
  notas?: string;
  materialId: string;
  recuperado: number;
}
export interface MaterialCargado {
  materialId: string;
  nombre: string;
  medida?: string;
  cantidad: number;
  apodo?: string;
}
export type EstadoProceso = 'PENDIENTE_ENTREGA' | 'ENTREGADO' | 'RETIRADO' | 'REINGRESADO';
export interface PhotoRef {
  id: string;
  uri: string;
  status: 'PENDING' | 'SYNCED';
  storagePath?: string;
  usuarioUid: string;
}
export interface ObraCard {
  id: string;
  clienteNombre: string;
  clienteTelefono: string;
  direccion: string;
  localidadBarrio: string;
  coordenadas?: { lat: number; lng: number };
  estadoSemaphoro: 'VERDE' | 'AMARILLO' | 'ROJO';
  materialesCargados: MaterialCargado[];
  faltantesRegistrados?: FaltanteRegistro[];
  fotosUrls?: string[];
  fotos?: PhotoRef[];
  entregadoPor?: string[];
  retiradoPor?: string[];
  fechaEntrega: string;
  fechaRetiroEstimada: string;
  fechaRetiroEfectiva?: string;
  estadoProceso: EstadoProceso;
  syncStatus: 'SYNCED' | 'PENDING';
  saldosEnObra: Record<string, number>;
  updatedAt: string;
}
export interface Movement {
  materialId: string;
  cantidad: number;
  origen: string;
  destino: string;
  motivo: string;
}
export interface ActivityLog {
  id: string;
  timestamp: string;
  usuarioUid: string;
  usuarioNombre: string;
  accion: string;
  obraId?: string;
  payloadInverso?: { snapshot: DomainSnapshot; expectedRevision: number };
  movimientos: Movement[];
  undoneBy?: string;
  operationId: string;
  requiredRole?: UserRole;
}
export interface ComboPreset {
  id: string;
  nombreCombo: string;
  items: { materialId: string; cantidad: number }[];
}
export interface NotificationEvent {
  id: string;
  obraId: string;
  message: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  error?: string;
}
export interface DomainSnapshot {
  obras: ObraCard[];
  materiales: MaterialItem[];
  combos: ComboPreset[];
  responsables: string[];
  notificaciones: NotificationEvent[];
}
export interface AppState extends DomainSnapshot {
  revision: number;
  logs: ActivityLog[];
  appliedIds: string[];
}
export type ObraInput = Pick<
  ObraCard,
  | 'id'
  | 'clienteNombre'
  | 'clienteTelefono'
  | 'direccion'
  | 'localidadBarrio'
  | 'fechaEntrega'
  | 'fechaRetiroEstimada'
  | 'coordenadas'
>;
export type IncidentInput = {
  materialId: string;
  cantidad: number;
  tipo: 'PERDIDO' | 'DANADO';
  notas?: string;
  itemNombre?: string;
};
export type StockBucket = 'cantidadGalpon' | 'cantidadEnTaller' | 'cantidadPerdido';
export type Action =
  | { type: 'CREATE_OBRA'; obra: ObraInput }
  | { type: 'UPDATE_OBRA'; obra: ObraInput }
  | { type: 'DELETE_OBRA'; obraId: string }
  | { type: 'SET_LOAD'; obraId: string; items: MaterialCargado[] }
  | {
      type: 'DELIVER';
      obraId: string;
      responsables: string[];
      origins?: { materialId: string; obraId: string; cantidad: number }[];
      motivo?: string;
    }
  | { type: 'RETIRE'; obraId: string; responsables: string[]; incidents: IncidentInput[] }
  | { type: 'REPORT'; obraId: string; incidents: IncidentInput[] }
  | { type: 'RECOVER'; obraId: string; incidentId: string; cantidad: number; motivo: string }
  | { type: 'REENTER' | 'REACTIVATE'; obraId: string }
  | {
      type: 'TRANSFER';
      obraId: string;
      targetId: string;
      materialId: string;
      cantidad: number;
      motivo: string;
      responsables: string[];
    }
  | {
      type: 'SAVE_MATERIAL';
      material: Pick<MaterialItem, 'id' | 'nombre' | 'medida' | 'categoria'>;
    }
  | {
      type: 'ADJUST';
      materialId: string;
      bucket: StockBucket;
      delta: number;
      motivo: string;
      procedencia: string;
    }
  | { type: 'SAVE_COMBO'; combo: ComboPreset }
  | { type: 'DELETE_COMBO'; comboId: string }
  | { type: 'RESPONSABLES'; nombres: string[] }
  | { type: 'PHOTO'; obraId: string; photo: PhotoRef }
  | { type: 'DELETE_PHOTO'; obraId: string; photoId: string }
  | { type: 'LOCATION'; obraId: string; coordenadas: { lat: number; lng: number } }
  | { type: 'UNDO'; logId: string };
export interface Operation {
  id: string;
  createdAt: string;
  actor: UserProfile;
  action: Action;
}
export interface QueuedOperation {
  operation: Operation;
  status: 'PENDING' | 'CONFLICT';
  error?: string;
}
export interface Envelope {
  schema: 1;
  confirmed: AppState;
  state: AppState;
  queue: QueuedOperation[];
}
