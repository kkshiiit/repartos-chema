import { emptyState } from './seed';
export function emptyLocalState() {
  return { ...emptyState(), responsables: [] };
}
