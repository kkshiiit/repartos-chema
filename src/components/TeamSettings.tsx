import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, View, Share } from 'react-native';
import { Users, Link, LogOut } from 'lucide-react-native';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';
import { listTeam, createInvitation, removeMember } from '../services/teamService';
import type { TeamMember } from '../domain/team';
import { DATA_MODE } from '../services/firebase';
import { LOCAL_ONLY } from '../services/localMode';
import { userError } from '../services/errors';
import { Button, ConfirmButton, Notice, Field, useUI } from './ui';
export function TeamSettings() {
  const { s } = useUI();
  const { workspaceId } = useInventory();
  const { membership, canManageTeam, logout } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]),
    [link, setLink] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (membership && !workspaceId)
      void listTeam(membership)
        .then(setMembers)
        .catch((e) => setError(userError(e)));
  }, [membership, workspaceId]);
  async function invite() {
    if (!membership) return;
    setBusy(true);
    try {
      const i = await createInvitation(membership);
      setLink(i.url);
      setError('');
    } catch (e) {
      setError(userError(e));
    } finally {
      setBusy(false);
    }
  }
  if (workspaceId)
    return (
      <View style={s.section}>
        <Text style={s.h2}>Equipo compartido</Text>
        <Text style={s.body}>{membership?.nombre}</Text>
        <Button
          label="Gestionar equipo"
          variant="secondary"
          onPress={() => router.push('/equipo/conectar')}
        />
      </View>
    );
  if (LOCAL_ONLY)
    return (
      <View style={s.card}>
        <Text style={s.h2}>Uso individual</Text>
        <Text style={s.body}>{membership?.nombre}</Text>
        <Notice text="El nombre identifica tus movimientos en este celular. No es una cuenta en la nube ni comparte datos con otras personas." />
        <Button label="Cambiar nombre" variant="secondary" onPress={() => void logout()} />
      </View>
    );
  return (
    <View style={s.card}>
      <Text style={s.h2}>Equipo Chema</Text>
      <Button
        label="Abrir equipo compartido"
        variant="secondary"
        onPress={() => router.push('/equipo/conectar')}
      />
      <Text style={s.body}>{membership?.nombre}</Text>
      {DATA_MODE === 'demo' ? (
        <Notice text="Equipo de prueba en este dispositivo. La colaboración se gestiona desde Equipo compartido." />
      ) : null}
      {members
        .filter((m) => m.active)
        .map((m) => (
          <View key={m.uid} style={[s.row, { justifyContent: 'space-between', flexWrap: 'wrap' }]}>
            <Text style={[s.body, { flex: 1, minWidth: 110 }]}>
              {m.nombre}
              {m.uid === membership?.uid ? ' · Vos' : ''}
            </Text>
            {canManageTeam && !m.owner ? (
              <ConfirmButton
                label={`Quitar a ${m.nombre}`}
                title="Quitar del equipo"
                description="Perderá el acceso al equipo. Sus movimientos quedarán en el historial."
                onConfirm={async () => {
                  await removeMember(membership!, m.uid);
                  setMembers(await listTeam(membership!));
                }}
              />
            ) : null}
          </View>
        ))}
      {canManageTeam ? (
        <Button label="Crear invitación" icon={Link} loading={busy} onPress={() => void invite()} />
      ) : (
        <Text style={s.muted}>Las invitaciones y bajas las gestiona quien vinculó el equipo.</Text>
      )}
      {link ? (
        <>
          <Field label="Enlace de invitación" value={link} editable={false} selectTextOnFocus />
          <Text style={s.muted}>
            {DATA_MODE === 'demo'
              ? 'Invitación local de prueba; funciona solo aquí.'
              : 'Un uso · Vence en 24 horas.'}
          </Text>
          <Button
            label="Compartir enlace"
            variant="secondary"
            icon={Users}
            onPress={() => void Share.share({ message: link }).catch((e) => setError(userError(e)))}
          />
        </>
      ) : null}
      <Button
        label="Salir del equipo"
        variant="ghost"
        icon={LogOut}
        onPress={() => void logout().catch((e) => setError(userError(e)))}
      />
      {error ? <Notice text={error} tone="error" /> : null}
    </View>
  );
}
