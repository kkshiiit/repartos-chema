import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSharedSession } from '../context/SharedContext';
import type { SharedSnapshot } from '../shared/protocol';
import type { TripStop } from '../domain/tripOrder';
import {
  PublishedRouteCache,
  parsePublishedRoute,
  proposalFromSnapshot,
  loadableRouteIds,
  type PublishedRoute,
} from '../services/publishedRoute';
import { Button, Notice, Select, Sheet, useUI } from './ui';
import { userError } from '../services/errors';

export function PublishedRoutePanel({
  visible,
  stops,
  ids,
  pending,
  ready,
  onClose,
  onLoad,
}: {
  visible: boolean;
  stops: TripStop[];
  ids: string[];
  pending: boolean;
  ready: boolean;
  onClose: () => void;
  onLoad: (ids: string[]) => Promise<void>;
}) {
  const { s } = useUI(),
    shared = useSharedSession();
  const [plan, setPlan] = useState<PublishedRoute | null>(null),
    [known, setKnown] = useState(false),
    [online, setOnline] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [confirm, setConfirm] = useState(false);
  const [members, setMembers] = useState<{ uid: string; nombre: string; active: boolean }[]>([]),
    [assignments, setAssignments] = useState<Record<string, string>>({}),
    [snapshot, setSnapshot] = useState<SharedSnapshot | null>(null),
    [versions, setVersions] = useState<PublishedRoute[]>([]),
    [draftReady, setDraftReady] = useState(false);
  const cache = useMemo(
    () =>
      shared?.spaceId && shared?.actor
        ? new PublishedRouteCache(AsyncStorage, shared?.spaceId, shared?.actor.uid)
        : null,
    [shared?.spaceId, shared?.actor],
  );
  const generation = useRef(0),
    actionLock = useRef(false);
  useEffect(() => {
    const run = ++generation.current;
    if (!visible || !cache || !shared?.remote) return;
    let active = true;
    void (async () => {
      await Promise.resolve();
      if (!active || run !== generation.current) return;
      setOnline(false);
      setSnapshot(null);
      setConfirm(false);
      setKnown(false);
      setDraftReady(false);
      setVersions([]);
      setError('');
      setMessage('');
      let draft: Record<string, string> | null = null;
      try {
        draft = await cache.loadAssignments();
        if (active && run === generation.current) {
          setAssignments(draft || {});
          setDraftReady(true);
        }
      } catch (e) {
        if (active) setError(userError(e));
        return;
      }
      try {
        const saved = await cache.load();
        if (active && run === generation.current) {
          setPlan(saved);
          setKnown(true);
        }
      } catch (e) {
        if (active) setError(userError(e));
      }
      try {
        const [value, people, snap, history] = await Promise.all([
          shared?.remote!.request<unknown>('get-route'),
          shared?.remote!.request<typeof members>('members'),
          shared?.remote!.snapshot(),
          shared?.remote!.request<unknown[]>('route-history'),
        ]);
        const received = parsePublishedRoute(value);
        await cache.save(received);
        const previous = history
          .map(parsePublishedRoute)
          .filter((value): value is PublishedRoute => value !== null);
        if (draft === null) {
          draft = received?.route.assignments || {};
          await cache.saveAssignments(draft);
        }
        if (active && run === generation.current) {
          setPlan(received);
          setKnown(true);
          setOnline(true);
          setMembers(people.filter((m) => m.active));
          setSnapshot(snap);
          setAssignments(draft);
          setVersions(previous);
          setError('');
        }
      } catch (e) {
        if (active && run === generation.current)
          setError(`Consulta sin confirmar. Mostramos la copia local si existe. ${userError(e)}`);
      }
    })();
    return () => {
      active = false;
    };
    // Opening the panel captures the base revision. Publishing never refreshes it silently.
  }, [visible, cache, shared?.remote]);
  async function act(work: () => Promise<void>) {
    if (actionLock.current) return;
    actionLock.current = true;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await work();
    } catch (e) {
      setError(userError(e));
    } finally {
      actionLock.current = false;
      setBusy(false);
    }
  }
  const usable = shared?.active && !!shared?.remote && !!shared?.actor;
  return (
    <Sheet visible={visible} title="Plan publicado del equipo" busy={busy} onClose={onClose}>
      {!usable ? (
        <Notice text="El recorrido personal sigue disponible. Conectate a un equipo en Ajustes para publicar y asignar paradas." />
      ) : (
        <>
          <Text style={s.muted}>
            El orden y los filtros de este teléfono son un borrador personal. Publicar comparte
            todas sus paradas, incluso las ocultas por filtros.
          </Text>
          {plan ? (
            <>
              <Text style={s.label}>Plan guardado · versión {plan.revision}</Text>
              <Text style={s.muted}>
                Autor:{' '}
                {members.find((m) => m.uid === plan.userId)?.nombre || 'Integrante del equipo'} ·{' '}
                {new Date(plan.updatedAt).toLocaleString('es-AR')}
              </Text>
              <Text style={s.muted}>
                {online
                  ? 'Recibido del equipo'
                  : 'Copia local para consulta · sin confirmar conexión'}
              </Text>
              {plan.route.ids.map((id, index) => (
                <Text key={id} style={s.body}>
                  {index + 1}.{' '}
                  {stops.find((stop) => stop.id === id)?.obra.clienteNombre ||
                    'Parada ya no vigente'}
                  {plan.route.assignments[id]
                    ? ` · ${members.find((m) => m.uid === plan.route.assignments[id])?.nombre || 'Integrante del equipo'}`
                    : ' · Sin asignar'}
                </Text>
              ))}
              <Button
                label="Cargar plan a mi borrador"
                variant="secondary"
                disabled={!ready || !online || pending || busy}
                onPress={() => setConfirm(true)}
              />
              {confirm ? (
                <View style={{ gap: 12 }}>
                  <Notice text="Se reemplazará tu orden personal con las tareas todavía vigentes. Las paradas nuevas se agregan al final. No cambia el inventario." />
                  <Button
                    label="Confirmar carga al borrador"
                    disabled={busy}
                    onPress={() =>
                      void act(async () => {
                        const current = await shared?.remote!.snapshot();
                        const valid = loadableRouteIds(
                          plan.route,
                          stops
                            .filter((stop) => current.tasks[stop.id]?.type === stop.task)
                            .map((stop) => stop.id),
                          current,
                        );
                        await onLoad(valid);
                        const copiedAssignments = Object.fromEntries(
                          Object.entries(plan.route.assignments).filter(
                            ([id, uid]) =>
                              valid.includes(id) && members.some((member) => member.uid === uid),
                          ),
                        );
                        try {
                          await cache!.saveAssignments(copiedAssignments);
                        } catch {
                          throw Error(
                            'El orden se guardó en este teléfono, pero no pudimos confirmar la copia de sus asignaciones. Reintentá la carga.',
                          );
                        }
                        setAssignments(copiedAssignments);
                        setConfirm(false);
                        setMessage('Plan cargado y guardado en este teléfono.');
                      })
                    }
                  />
                  <Button
                    label="Conservar mi borrador"
                    variant="ghost"
                    onPress={() => setConfirm(false)}
                  />
                </View>
              ) : null}
            </>
          ) : (
            <Notice
              text={known ? 'Todavía no hay un plan publicado.' : 'Leyendo el plan del equipo…'}
            />
          )}
          {versions.length ? (
            <View style={{ gap: 8 }}>
              <Text style={s.label}>Historial de publicaciones</Text>
              {versions.map((version) => (
                <Text key={version.revision} style={s.muted}>
                  Versión {version.revision} ·{' '}
                  {members.find((member) => member.uid === version.userId)?.nombre ||
                    'Integrante del equipo'}{' '}
                  · {new Date(version.updatedAt).toLocaleString('es-AR')}
                </Text>
              ))}
            </View>
          ) : null}
          <Text style={s.label}>Asignaciones del borrador a publicar</Text>
          {ids.map((id) => (
            <Select
              key={id}
              label={
                stops.find((stop) => stop.id === id)?.obra.clienteNombre || 'Parada del borrador'
              }
              value={assignments[id] || ''}
              options={[
                { value: '', label: 'Sin asignar' },
                ...members.map((member) => ({ value: member.uid, label: member.nombre })),
              ]}
              onChange={(uid) => {
                if (busy || !draftReady) return;
                void act(async () => {
                  const next = { ...assignments };
                  if (uid) next[id] = uid;
                  else delete next[id];
                  await cache!.saveAssignments(next);
                  setAssignments(next);
                });
              }}
            />
          ))}
          {pending ? (
            <Notice text="Hay cambios de inventario pendientes. Sincronizalos antes de publicar o cargar un plan." />
          ) : null}
          <Button
            label="Publicar mi borrador para el equipo"
            loading={busy}
            disabled={!ready || !known || !draftReady || !online || !snapshot || pending || busy}
            onPress={() =>
              void act(async () => {
                const assigned = Object.fromEntries(
                  Object.entries(assignments).filter(([id]) => ids.includes(id)),
                );
                const route = proposalFromSnapshot(ids, assigned, snapshot!);
                const received = parsePublishedRoute(
                  await shared?.remote!.request('route', { expected: plan?.revision || 0, route }),
                );
                if (!received) throw Error('No pudimos confirmar el plan publicado.');
                await cache!.save(received);
                setPlan(received);
                setVersions((old) => [received, ...old].slice(0, 50));
                setMessage('Plan publicado y copia local guardada.');
              })
            }
          />
          <Text style={s.muted}>
            Si otro integrante publica primero, tu propuesta se conserva. Cerrá y abrí este panel
            para revisar la versión nueva antes de volver a publicar.
          </Text>
        </>
      )}
      {message ? (
        <Text accessibilityLiveRegion="polite" style={s.muted}>
          {message}
        </Text>
      ) : null}
      {error ? <Notice text={error} tone="error" /> : null}
    </Sheet>
  );
}
