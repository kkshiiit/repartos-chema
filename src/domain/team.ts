export interface TeamMember {
  uid: string;
  nombre: string;
  createdAt: string;
  active: boolean;
  owner: boolean;
}
export interface TeamInvite {
  tokenHash: string;
  expiresAt: string;
  usedBy?: string;
}
export function teamName(value: string) {
  const name = value.trim().replace(/\s+/g, ' ');
  if (name.length < 2 || name.length > 60 || /[\u0000-\u001f<>]/.test(name))
    throw new Error('Escribe tu nombre, entre 2 y 60 caracteres.');
  return name;
}
export function invitationToken(input: string) {
  const value = input.trim();
  if (!value) return '';
  let token = value;
  if (value.includes('://')) {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new Error('El enlace de invitación no es válido.');
    }
    if (
      url.protocol !== 'repartoschema:' ||
      url.hostname !== 'equipo' ||
      url.pathname !== '/unirse'
    )
      throw new Error('Usa un enlace de invitación de Repartos Chema.');
    token = url.searchParams.get('token') || '';
  }
  if (!/^[a-f0-9]{64}$/.test(token))
    throw new Error('La invitación no es válida. Revisa el enlace completo.');
  return token;
}
export function invitationUrl(token: string) {
  return `repartoschema://equipo/unirse?token=${invitationToken(token)}`;
}
export function assertInvite(invite: TeamInvite | undefined, now = new Date()) {
  if (
    !invite ||
    !Number.isFinite(Date.parse(invite.expiresAt)) ||
    Date.parse(invite.expiresAt) <= now.getTime()
  )
    throw new Error('La invitación venció o no existe. Solicita otra.');
  if (invite.usedBy) throw new Error('La invitación ya fue utilizada. Solicita otra.');
}
export function assertOwner(actor: TeamMember | undefined) {
  if (!actor?.active || !actor.owner)
    throw new Error('Solo la persona que gestiona el equipo puede realizar esta acción.');
}
export function assertRemoval(actor: TeamMember | undefined, target: TeamMember | undefined) {
  assertOwner(actor);
  if (!target) throw new Error('La persona no pertenece al equipo.');
  if (target.owner) throw new Error('No se puede quitar al responsable del equipo.');
}
