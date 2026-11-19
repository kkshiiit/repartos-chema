import type { ObraCard } from '../types';

/** Por qué no se puede borrar todavía (o null si se puede). */
export function deleteBlocker(o: ObraCard): string | null {
  if (o.estadoProceso === 'ENTREGADO')
    return 'Este alquiler tiene material en la obra. Primero registrá el retiro para que el stock vuelva al depósito.';
  if (o.estadoProceso === 'RETIRADO')
    return 'Primero cerrá el reingreso del retiro.';
  if (o.faltantesRegistrados?.some((i) => i.recuperado < i.cantidad))
    return 'Tiene faltantes o daños sin resolver. Recuperalos antes de borrar.';
  return null;
}
