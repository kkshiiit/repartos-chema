import React, { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { getBytes, ref } from 'firebase/storage';
import type { PhotoRef } from '../types';
import { photoBytes, storePhoto, displayPhoto, releasePhoto } from '../services/photoCache';
import { firebase, DATA_MODE } from '../services/firebase';
import { useSharedSession } from '../context/SharedContext';
import { downloadSharedPhoto, sharedPhotoCacheId } from '../shared/media';
import { useUI } from './ui';
export function PhotoImage({ photo }: { photo: PhotoRef }) {
  const { s } = useUI();
  const shared = useSharedSession();
  const remote = shared?.active ? shared.remote : null;
  const cacheId =
    remote && shared?.spaceId && shared.actor
      ? sharedPhotoCacheId(shared.spaceId, shared.actor.uid, photo.id)
      : photo.id;
  const [uri, setUri] = useState(''),
    [error, setError] = useState('');
  useEffect(() => {
    let active = true,
      release = '';
    void (async () => {
      let bytes = await photoBytes(cacheId);
      if (!bytes && remote) {
        const snapshot = await remote.snapshot();
        const obra = snapshot.state.obras.find((o) => o.fotos?.some((p) => p.id === photo.id));
        if (!obra) throw new Error('Foto pendiente de confirmar.');
        bytes = await downloadSharedPhoto(remote, obra.id, photo.id);
        await storePhoto(cacheId, bytes);
      }
      if (!bytes && !remote && photo.storagePath && DATA_MODE === 'firebase') {
        bytes = new Uint8Array(
          await getBytes(ref(firebase().storage, photo.storagePath), 2 * 1024 * 1024),
        );
        await storePhoto(photo.id, bytes);
      }
      const source = bytes
        ? displayPhoto(bytes, cacheId)
        : remote || DATA_MODE === 'demo' || photo.uri.startsWith('chema-photo:')
          ? ''
          : photo.uri;
      if (!source) throw new Error('La foto no está disponible en este dispositivo.');
      if (active) {
        release = source;
        setUri(source);
        setError('');
      } else releasePhoto(source);
    })().catch(() => {
      if (active) {
        setUri('');
        setError(
          remote
            ? 'Foto pendiente. Reintentá con conexión; el original se conserva.'
            : DATA_MODE === 'demo'
              ? 'Foto local no disponible. Recuperá una copia JSON completa.'
              : 'Foto sin copia local. Reintenta con conexión.',
        );
      }
    });
    return () => {
      active = false;
      if (release) releasePhoto(release);
    };
  }, [photo.id, photo.uri, photo.storagePath, remote, cacheId]);
  return (
    <View>
      {uri && remote ? <Text style={s.muted}>Copia disponible en este teléfono</Text> : null}
      {uri ? (
        <Image
          source={{ uri }}
          accessibilityLabel="Foto de materiales de la obra"
          style={{ width: 150, height: 140, borderRadius: 12 }}
        />
      ) : (
        <Text style={s.muted}>{error || 'Cargando foto…'}</Text>
      )}
    </View>
  );
}
