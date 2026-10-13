import React, { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { getBytes, ref } from 'firebase/storage';
import type { PhotoRef } from '../types';
import { photoBytes, storePhoto, displayPhoto, releasePhoto } from '../services/photoCache';
import { firebase, DATA_MODE } from '../services/firebase';
import { useUI } from './ui';
export function PhotoImage({ photo }: { photo: PhotoRef }) {
  const { s } = useUI();
  const [uri, setUri] = useState(''),
    [error, setError] = useState('');
  useEffect(() => {
    let active = true,
      release = '';
    void (async () => {
      let bytes = await photoBytes(photo.id);
      if (!bytes && photo.storagePath && DATA_MODE === 'firebase') {
        bytes = new Uint8Array(
          await getBytes(ref(firebase().storage, photo.storagePath), 2 * 1024 * 1024),
        );
        await storePhoto(photo.id, bytes);
      }
      const source = bytes
        ? displayPhoto(bytes, photo.id)
        : photo.uri.startsWith('chema-photo:')
          ? ''
          : photo.uri;
      if (!source) throw new Error('La foto no está disponible en este dispositivo.');
      if (active) {
        release = source;
        setUri(source);
      } else releasePhoto(source);
    })().catch(() => {
      if (active) setError('Foto sin copia local. Reintenta al volver a abrir con conexión.');
    });
    return () => {
      active = false;
      if (release) releasePhoto(release);
    };
  }, [photo.id, photo.uri, photo.storagePath]);
  return (
    <View>
      {uri ? (
        <Image
          source={{ uri }}
          accessibilityLabel="Foto de materiales de la obra"
          style={{ width: 180, height: 140, borderRadius: 12 }}
        />
      ) : (
        <Text style={s.muted}>{error || 'Cargando foto…'}</Text>
      )}
    </View>
  );
}
