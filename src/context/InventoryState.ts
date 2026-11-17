import { createContext } from 'react';
import type { Action, AppState, Envelope } from '../types';
import type { ConflictArchive, ConflictArchiveSummary } from '../shared/repository';
import type { BackupDestination } from '../services/files';
import type { Rejected } from '../sync/store';
export interface InventoryValue {
  accessBlocked?: boolean;
  workspaceId?: string;
  workspaceKey?: string;
  syncSummary?: string;
  lastSyncedAt?: string;
  loadMoreHistory?: () => Promise<boolean>;
  historyHasMore?: boolean;
  proposalArchives?: ConflictArchiveSummary[];
  readProposalArchive?: (id: string) => Promise<ConflictArchive | null>;
  state: AppState;
  rejected?: Rejected[];
  dismissRejected?: (id?: string) => Promise<void>;
  /** Deja constancia en la auditoría de una acción sin efecto en el stock. */
  note?: (accion: string, obraId?: string) => Promise<void>;
  /** Reemplaza el inventario del equipo por una copia (queda auditado). */
  importSnapshot?: (snapshot: import('../types').DomainSnapshot, origen: string) => Promise<void>;
  ready: boolean;
  error: string;
  online: boolean;
  syncing: boolean;
  queue: Envelope['queue'];
  dispatch: (a: Action) => Promise<void>;
  retry: () => Promise<void>;
  discard: () => Promise<void>;
  backup: () => Promise<void>;
  backupToDestination: () => Promise<BackupDestination>;
  archives: () => Promise<{ key: string; createdAt: string; reason: string }[]>;
  recoverArchive: (key: string) => Promise<void>;
  restore: (raw: string) => Promise<void>;
  undoRestore: () => Promise<void>;
  startEmpty: () => Promise<void>;
  recoverPrevious: () => Promise<void>;
}
export const InventoryDataContext = createContext<InventoryValue | null>(null);
