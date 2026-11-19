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

/** Por qué un material del depósito no se puede borrar todavía (o null si se puede). */
export function materialDeleteBlocker(
  m: { id: string; nombre: string; cantidadEnObra: number },
  obras: ObraCard[],
): string | null {
  if (m.cantidadEnObra > 0)
    return `Hay ${m.cantidadEnObra} en obras. Registrá los retiros antes de borrarlo.`;
  const loads = obras.filter(
    (o) => o.estadoProceso === 'PENDIENTE_ENTREGA' && o.materialesCargados.some((x) => x.materialId === m.id),
  );
  if (loads.length)
    return `Está en la carga de ${loads.map((o) => o.clienteNombre).join(', ')}. Quitalo de esa carga o borrá ese alquiler primero.`;
  if (obras.some((o) => o.faltantesRegistrados?.some((f) => f.materialId === m.id && f.recuperado < f.cantidad)))
    return 'Tiene faltantes o daños sin resolver en un alquiler. Recuperalos primero.';
  return null;
}
