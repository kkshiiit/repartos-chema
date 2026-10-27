import type { SharedRemote, SharedSnapshot, CommitResult, SyncCommand } from './protocol';
export interface SharedConfig {
  url: string;
  publicKey: string;
  spaceId: string;
  expectedUserId?: string;
}
export class SharedAccessError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'SharedAccessError';
  }
}
export function createSharedClient(
  config: SharedConfig,
  token: (expectedUserId?: string) => Promise<string>,
): SharedRemote & {
  request<T>(type: string, args?: Record<string, unknown>): Promise<T>;
} {
  const request = async <T>(type: string, args: Record<string, unknown> = {}): Promise<T> => {
    const accessToken = await token(config.expectedUserId);
    if (!accessToken)
      throw new SharedAccessError('Iniciá sesión para enviar cambios del equipo.', 401);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(`${config.url}/functions/v1/chema-api`, {
        method: 'POST',
        headers: {
          apikey: config.publicKey,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, spaceId: config.spaceId, ...args }),
        signal: controller.signal,
      });
      const value = await response.json();
      if (!response.ok)
        throw new SharedAccessError(
          value.error || 'No pudimos enviar los cambios. Reintentá.',
          response.status,
          value.code,
        );
      return value as T;
    } catch (error) {
      if (error instanceof SharedAccessError) throw error;
      throw new SharedAccessError(
        'No pudimos confirmar la respuesta del equipo. Tu cambio sigue pendiente; reintentaremos sin duplicarlo.',
        0,
        'UNCERTAIN',
      );
    } finally {
      clearTimeout(timer);
    }
  };
  return {
    request,
    snapshot: () => request<SharedSnapshot>('snapshot'),
    receipt: (operationId) => request<CommitResult | null>('receipt', { operationId }),
    commit: (command: SyncCommand) => request<CommitResult>('commit', { command }),
    pull: async (cursor) => {
      const result = await request<{ snapshot: SharedSnapshot; watermark: number; epoch: string }>(
        'pull',
        { cursor },
      );
      // Snapshot+cursor comes from one server observation. Historical records are separately paginated.
      return {
        changes: result.snapshot.cursor > cursor ? [result.snapshot] : [],
        watermark: result.watermark,
        epoch: result.epoch,
      };
    },
  };
}
