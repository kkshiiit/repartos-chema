import { it, expect } from 'vitest';
import {
  teamName,
  invitationToken,
  invitationUrl,
  assertInvite,
  assertRemoval,
} from '../src/domain/team';
it('normaliza nombre sin convertirlo en una credencial', () => {
  expect(teamName('  Juan   Pérez ')).toBe('Juan Pérez');
  for (const name of ['', 'A', '<script>', 'x'.repeat(61)]) expect(() => teamName(name)).toThrow();
});
it('acepta token fuerte y enlaces de la app, rechaza URLs ajenas y tokens cortos', () => {
  const token = 'ab'.repeat(32);
  expect(invitationToken(invitationUrl(token))).toBe(token);
  for (const bad of [
    'abc',
    'https://ejemplo.com?token=' + token,
    'repartoschema://ajeno/unirse?token=' + token,
  ])
    expect(() => invitationToken(bad)).toThrow();
});
it('invitaciones vencidas, corruptas o usadas no pueden reutilizarse', () => {
  const now = new Date('2026-10-15T10:00:00Z');
  for (const invite of [
    undefined,
    { tokenHash: 'x', expiresAt: now.toISOString() },
    { tokenHash: 'x', expiresAt: 'invalida' },
    { tokenHash: 'x', expiresAt: '2026-10-16', usedBy: 'uid' },
  ])
    expect(() => assertInvite(invite, now)).toThrow();
  expect(() => assertInvite({ tokenHash: 'x', expiresAt: '2026-10-16' }, now)).not.toThrow();
});
it('solo propietario activo expulsa; no se puede expulsar al propietario', () => {
  const actor = { uid: 'a', nombre: 'A', createdAt: '2026-10-15', active: true, owner: true },
    other = { ...actor, uid: 'b', owner: false };
  expect(() => assertRemoval(actor, other)).not.toThrow();
  expect(() => assertRemoval(other, actor)).toThrow();
  expect(() => assertRemoval({ ...actor, active: false }, other)).toThrow();
  expect(() => assertRemoval(actor, actor)).toThrow();
});

it('interpreta enlaces de invitación sin depender del parser URL parcial de React Native', () => {
  const Original = globalThis.URL;
  try {
    globalThis.URL = class {
      constructor() {
        throw new Error('Parser nativo parcial');
      }
    } as unknown as typeof URL;
    expect(invitationToken('repartoschema://equipo/unirse?token=' + 'ab'.repeat(32))).toBe(
      'ab'.repeat(32),
    );
    expect(invitationToken('repartoschema:///equipo/unirse?token=' + 'ab'.repeat(32))).toBe(
      'ab'.repeat(32),
    );
  } finally {
    globalThis.URL = Original;
  }
});
