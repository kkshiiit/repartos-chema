/**
 * Servidor de sincronización (Supabase). La URL y la clave *publicable* son públicas por diseño:
 * no dan acceso a ninguna tabla. Toda lectura/escritura pasa por funciones que exigen el código
 * del equipo (ver supabase/migrations y docs/SEGURIDAD.md). Nunca agregar aquí claves secretas.
 */
export const SHARED_CONFIG = {
  url: 'https://lttfkynkhveomntejqhc.supabase.co',
  publicKey: 'sb_publishable_ks3tD0iqLwM5qhrodDxIKA_tLEbB7JN',
};
