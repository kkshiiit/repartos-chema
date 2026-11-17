import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Text, View } from 'react-native';
import type { PhotoRef } from '../types';
import { displayPhoto, releasePhoto } from '../services/photoCache';
import { useAuth } from '../context/AuthContext';
import { fetchTeamPhoto } from '../context/InventoryContext';
import { useUI } from './ui';
/** Muestra la foto local; si la sacó otra persona, la descarga una sola vez del equipo. */
export function PhotoImage({ photo }: { photo: PhotoRef }) {
  const { C, s } = useUI();
  const { session } = useAuth();
  const [uri, setUri] = useState(''),
    [error, setError] = useState('');
  useEffect(() => {
    let active = true,
      release = '';
    void (async () => {
      const bytes = session ? await fetchTeamPhoto(session.code, photo.id) : null;
      if (!bytes) throw new Error('missing');
      const source = displayPhoto(bytes, photo.id);
      if (active) {
        release = source;
        setUri(source);
        setError('');
      } else releasePhoto(source);
    })().catch(() => {
      if (active) setError('Foto todavía no disponible. Se descargará con conexión.');
    });
    return () => {
      active = false;
      if (release) releasePhoto(release);
    };
  }, [photo.id, session]);
  return (
    <View>
      {uri ? (
        <Image
          source={{ uri }}
          accessibilityLabel="Foto de materiales del alquiler"
          style={{ width: 150, height: 140, borderRadius: 12, backgroundColor: C.panel2 }}
        />
      ) : error ? (
        <Text style={s.muted}>{error}</Text>
      ) : (
        <View style={{ width: 150, height: 140, borderRadius: 12, backgroundColor: C.panel2, justifyContent: 'center' }}>
          <ActivityIndicator color={C.accent} />
        </View>
      )}
    </View>
  );
}
