export interface ReminderOpen {
  obraId: string;
  responseKey: string;
  scope?: string;
}

const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

/** Accept only local reminder data; arbitrary paths/URLs never become navigation targets. */
export function reminderOpenFromResponse(response: unknown): ReminderOpen | null {
  if (!record(response) || !record(response.notification)) return null;
  const notification = response.notification;
  const request = notification.request;
  if (!record(request) || !record(request.content)) return null;
  const data = request.content.data;
  if (
    !record(data) ||
    data.kind !== 'reminder' ||
    (data.scope !== undefined &&
      (typeof data.scope !== 'string' || !/^[a-zA-Z0-9:_%-]{1,250}$/.test(data.scope))) ||
    typeof data.obraId !== 'string' ||
    !/^[a-zA-Z0-9_-]{1,100}$/.test(data.obraId) ||
    typeof request.identifier !== 'string' ||
    request.identifier.length === 0 ||
    typeof notification.date !== 'number' ||
    !Number.isFinite(notification.date) ||
    notification.date < 0 ||
    typeof response.actionIdentifier !== 'string' ||
    response.actionIdentifier.length === 0
  )
    return null;
  return {
    obraId: data.obraId,
    ...(typeof data.scope === 'string' ? { scope: data.scope } : {}),
    responseKey: JSON.stringify([request.identifier, notification.date, response.actionIdentifier]),
  };
}
