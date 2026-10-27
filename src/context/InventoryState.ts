import { createContext } from 'react';
import type { Action, AppState, Envelope } from '../types';
import type { BackupDestination } from '../services/files';
export interface InventoryValue {
  accessBlocked?: boolean;
  workspaceId?: string;
  workspaceKey?: string;
  syncSummary?: string;
  lastSyncedAt?: string;
  loadMoreHistory?: () => Promise<boolean>;
  state: AppState;
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
