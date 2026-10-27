import React, { useEffect, useState } from 'react';
import { Share, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSharedSession } from '../context/SharedContext';
import { useInventory } from '../context/InventoryContext';
import { inventoryStorage } from '../data/localStorage';
import { parseEnvelope } from '../data/validation';
import { photoBytes, storePhoto } from '../services/photoCache';
import { sharedPhotoCacheId } from '../shared/media';
import type { AppState } from '../types';
import { userError } from '../services/errors';
import { Button, ConfirmButton, Field, Notice, useUI } from './ui';
import { ProposalArchivesPanel } from './ProposalArchivesPanel';
export function SharedTeamSettings({ invitation = '' }: { invitation?: string }) {
  const shared = useSharedSession(),
    inventory = useInventory(),
    { s } = useUI();
  const [token, setToken] = useState(invitation),
    [name, setName] = useState('');
  const [email, setEmail] = useState(''),
    [password, setPassword] = useState('');
  const [reauth, setReauth] = useState(false);
  const [enrolling, setEnrolling] = useState(!!invitation),
    [busy, setBusy] = useState(false);
  const [error, setError] = useState(''),
    [success, setSuccess] = useState(''),
    [link, setLink] = useState('');
  const [members, setMembers] = useState<
    { uid: string; nombre: string; role: string; active: boolean }[]
  >([]);
  const [source, setSource] = useState<AppState | null>(null);
  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await task();
    } catch (e) {
      setError(userError(e));
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    if (!shared?.active || !shared.remote) return;
    let active = true;
    void shared.remote
      .request<typeof members>('members')
      .then((value) => {
        if (active) setMembers(value);
      })
      .catch((e) => {
        if (active) setError(userError(e));
      });
    return () => {
      active = false;
    };
  }, [shared?.active, shared?.remote]);
  if (!shared)
    return (
      <Notice text="El equipo no está disponible en este entorno. El uso individual sigue funcionando." />
    );
  const admin = shared.actor?.role === 'ADMIN';
  const parseToken = () => {
    let value = token.trim();
    if (!/^[a-f0-9]{64}$/.test(value)) {
      try {
        value = new URL(value).searchParams.get('token') || '';
      } catch {
        value = '';
      }
    }
    if (!/^[a-f0-9]{64}$/.test(value))
      throw new Error('Pegá la invitación completa que te compartió el responsable.');
    return value;
  };
  return (
    <View style={s.section}>
      <Text style={s.h2}>{shared.active ? 'Equipo Chema' : 'Conectar el equipo'}</Text>
      <Text style={s.muted}>
        {shared.active
          ? 'Los cambios se guardan primero en este teléfono y se confirman con el equipo cuando hay conexión.'
          : 'Opcional. El inventario individual se conserva y funciona sin cuenta ni Internet.'}
      </Text>
      {error || shared.error ? <Notice text={error || shared.error} tone="error" /> : null}
      {success ? <Notice text={success} tone="success" /> : null}
      {!shared.active || reauth ? (
        <>
          <View style={s.wrap}>
            <Button
              label="Ya tengo cuenta"
              variant={enrolling ? 'ghost' : 'secondary'}
              onPress={() => setEnrolling(false)}
              disabled={busy}
            />
            <Button
              label="Tengo invitación"
              variant={enrolling ? 'secondary' : 'ghost'}
              onPress={() => setEnrolling(true)}
              disabled={busy}
            />
          </View>
          {enrolling ? (
            <>
              <Field
                label="Invitación del equipo"
                value={token}
                onChangeText={setToken}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Field
                label="Tu nombre en el equipo"
                value={name}
                onChangeText={setName}
                maxLength={80}
                autoCapitalize="words"
              />
            </>
          ) : null}
          <Field
            label="Correo de acceso"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="email"
          />
          <Field
            label="Contraseña del equipo"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete={enrolling ? 'new-password' : 'current-password'}
          />
          {enrolling ? (
            <Text style={s.muted}>
              Elegí una contraseña de 12 a 128 caracteres. El responsable autoriza el acceso
              mediante la invitación; el correo no se presenta como verificado.
            </Text>
          ) : null}
          <Button
            label={enrolling ? 'Vincular equipo' : 'Entrar al equipo'}
            loading={busy}
            onPress={() =>
              run(async () => {
                if (enrolling) await shared.enroll(parseToken(), name, email, password);
                else await shared.connect(email, password);
                setPassword('');
                router.replace('/');
              })
            }
          />
        </>
      ) : (
        <>
          <Text style={s.body}>{shared.actor?.nombre}</Text>
          <Notice text={inventory.syncSummary || 'Copia local del equipo.'} />
          <Text style={s.muted}>
            La copia JSON protege los datos e historial disponibles en este teléfono y sus
            propuestas. No sustituye un respaldo completo del equipo.
          </Text>
          {inventory.lastSyncedAt ? (
            <Text style={s.muted}>
              Última sincronización:{' '}
              {new Date(inventory.lastSyncedAt).toLocaleString('es-AR', {
                timeZone: 'America/Argentina/Buenos_Aires',
              })}
            </Text>
          ) : null}
          <Button
            label="Validar acceso"
            variant="ghost"
            onPress={() => {
              setReauth(true);
              setEnrolling(false);
            }}
          />
          <Button
            label="Reintentar sincronización"
            variant="secondary"
            loading={inventory.syncing}
            onPress={inventory.retry}
          />
          {inventory.queue.map((row) => (
            <View key={row.operation.id} style={s.card}>
              <Text style={s.label}>
                {row.status === 'CONFLICT' ? 'Revisar conflicto' : 'Cambio pendiente'}
              </Text>
              <Text style={s.muted}>
                {row.error || 'Todavía no está confirmado por el equipo.'}
              </Text>
            </View>
          ))}
          {inventory.queue.some((row) => row.status === 'CONFLICT') ? (
            <>
              <ConfirmButton
                label="Archivar rechazo y dependientes sin enviar"
                title="Archivar esta rama de propuestas"
                description="Se conservan el rechazo confirmado y sus cambios dependientes que nunca se enviaron en un archivo consultable y exportable. Salen de la cola sin modificar el stock del equipo. Los envíos inciertos requieren verificar sus recibos. El archivo no se reenvía; luego podés registrar una corrección con los datos actuales."
                onConfirm={inventory.discard}
              />
            </>
          ) : null}
          {inventory.readProposalArchive ? (
            <ProposalArchivesPanel
              key={`${shared.spaceId}:${shared.actor?.uid}`}
              archives={inventory.proposalArchives || []}
              readArchive={inventory.readProposalArchive}
            />
          ) : null}
          {members
            .filter((m) => m.active)
            .map((m) => (
              <View key={m.uid} style={s.card}>
                <Text style={s.body}>
                  {m.nombre}
                  {m.uid === shared.actor?.uid ? ' · Vos' : ''}
                </Text>
                {admin && m.role !== 'ADMIN' ? (
                  <ConfirmButton
                    label={`Quitar a ${m.nombre}`}
                    title="Quitar del equipo"
                    description="Se conservará su historial. Al conectar, este acceso dejará de recibir o enviar cambios."
                    onConfirm={async () => {
                      await shared.remote!.request('revoke', { targetId: m.uid });
                      setMembers(await shared.remote!.request<typeof members>('members'));
                    }}
                  />
                ) : null}
              </View>
            ))}
          {admin ? (
            <>
              <Button
                label="Crear invitación"
                variant="secondary"
                loading={busy}
                onPress={() =>
                  run(async () => {
                    const result = await shared.remote!.request<{ token: string }>('invite');
                    setLink(
                      `repartoschema://equipo/conectar?token=${encodeURIComponent(result.token)}`,
                    );
                  })
                }
              />
              {link ? (
                <>
                  <Field
                    label="Invitación de un uso"
                    value={link}
                    editable={false}
                    selectTextOnFocus
                  />
                  <Button
                    label="Compartir invitación"
                    variant="secondary"
                    onPress={() => Share.share({ message: link }).then(() => undefined)}
                  />
                  <Text style={s.muted}>
                    Vence en 48 horas. Compartila sólo con la persona que se incorpora.
                  </Text>
                </>
              ) : null}
              <Button
                label="Revisar inventario individual"
                variant="ghost"
                loading={busy}
                onPress={() =>
                  run(async () => {
                    const raw = await inventoryStorage.getItem(shared.localKey || 'chema:demo:v1');
                    if (!raw)
                      throw new Error(
                        'No hay un inventario individual para incorporar. Podés comenzar con el equipo vacío.',
                      );
                    const envelope = parseEnvelope(raw, { allowLegacyRetirementDate: true });
                    if (envelope.queue.length)
                      throw new Error(
                        'La copia individual tiene envíos pendientes. Requiere revisión; no se incorporó al equipo.',
                      );
                    setSource(envelope.state);
                  })
                }
              />
              {source ? (
                <View style={s.card}>
                  <Text style={s.h2}>Incorporar al equipo vacío</Text>
                  <Text style={s.body}>
                    {source.obras.length} alquileres · {source.materiales.length} materiales
                  </Text>
                  <Text style={s.muted}>
                    No se suman inventarios. Sólo puede hacerse una vez en un equipo nuevo y vacío.
                    El inventario individual se conserva. Las fotos quedan pendientes hasta su
                    subida confirmada.
                  </Text>
                  {source.obras.map((o) => (
                    <Text key={o.id} style={s.muted}>
                      {o.clienteNombre} · {o.direccion}
                    </Text>
                  ))}
                  <ConfirmButton
                    label="Incorporar esta copia"
                    title="Incorporar una sola vez"
                    description="El equipo debe estar vacío. El segundo teléfono sólo se vincula y descarga; nunca vuelve a incorporar esta copia."
                    onConfirm={async () => {
                      if (!shared.spaceId || !shared.actor) throw new Error('Iniciá sesión.');
                      const portable = JSON.parse(JSON.stringify(source)) as AppState;
                      for (const obra of portable.obras) {
                        for (const photo of obra.fotos || []) {
                          const bytes = await photoBytes(photo.id);
                          if (bytes)
                            await storePhoto(
                              sharedPhotoCacheId(shared.spaceId, shared.actor.uid, photo.id),
                              bytes,
                            );
                          photo.uri = 'chema-photo:' + photo.id;
                          photo.status = 'PENDING';
                          delete photo.storagePath;
                        }
                        obra.fotosUrls = obra.fotos?.map((photo) => photo.uri) || [];
                      }
                      portable.logs.forEach((log) => {
                        delete log.payloadInverso;
                      });
                      await shared.remote!.request('bootstrap', { state: portable });
                      setSource(null);
                      await inventory.retry();
                    }}
                  />
                  <Button
                    label="Cancelar revisión"
                    variant="ghost"
                    onPress={() => setSource(null)}
                  />
                </View>
              ) : null}
            </>
          ) : null}
          <Button
            label="Volver al uso individual"
            variant="secondary"
            loading={busy}
            onPress={() =>
              run(async () => {
                await shared.useLocal();
                router.replace('/');
              })
            }
          />
        </>
      )}
    </View>
  );
}
