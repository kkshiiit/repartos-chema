/** El modo equipo anterior (correo + invitaciones) fue reemplazado por equipo con código + nombre. */
import React from 'react';
export function SharedProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
export function useSharedSession(): null {
  return null;
}
