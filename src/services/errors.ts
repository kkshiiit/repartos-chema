export function userError(
  error: unknown,
  fallback = 'No se pudo completar la operación. Reintenta.',
) {
  const code = String((error as { code?: unknown })?.code || '');
  if (/quota|QuotaExceeded|SQLITE_FULL/i.test(code + ' ' + String(error)))
    return 'No hay espacio para guardar. El cambio no se confirmó. Guarda una copia y libera espacio sin borrar los datos de la aplicación.';
  if (/network|unavailable|deadline|timeout|aborted|retry-limit/i.test(code))
    return 'No se pudo conectar. Tu intento se conserva para reintentar.';
  if (/permission|unauthorized|unauthenticated/i.test(code))
    return 'No tienes permiso para completar esta operación. Revisa la sesión con administración.';
  if (/auth\//.test(code))
    return 'No se pudo validar la cuenta. Revisa el correo, la contraseña y la conexión.';
  if (/storage\//.test(code))
    return 'No se pudo acceder al archivo. Conserva la copia local y reintenta.';
  if (
    error instanceof Error &&
    !/Firebase|fetch|NetworkError|TypeError|IndexedDB/i.test(error.message)
  )
    return error.message;
  return fallback;
}
