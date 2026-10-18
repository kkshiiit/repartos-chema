# Repartos Chema: sonidos Jade v2

Muestras originales sintetizadas localmente. Reemplazo propuesto del paquete v1.
La app y sus notificaciones todavía no se modificaron.

Escuchar_sonidos_v2.mp3 reproduce, con pausas:
1. Recordatorio cálido (0.96 s): dos notas redondas, sin brillo metálico.
2. Confirmación sutil (0.44 s): dos notas muy breves; volumen menor.
3. Atención suave (0.68 s): dos notas graves descendentes, sin sirena.

Incluye WAV mono PCM 16 bits/48 kHz y el generador, sin muestras de terceros,
sin servicios pagos y sin conexión necesaria para reproducirlos. Se pueden
incorporar a Repartos Chema sin pagar por reproducción.

Propuesta: confirmaciones desactivadas por defecto; avisos con sonido y
vibración opcionales. No sonificar cada toque ni cada transición. Respetar
permisos, canales, silencio y No molestar de Android. La implementación
debe comprobarse en el teléfono; estos archivos no programan avisos.

Se verificaron formato WAV, duración, picos sin clipping, decodificación
MP3 y CRC del ZIP. No hubo escucha física en el Android del usuario.
El volumen percibido dependerá del teléfono y del volumen multimedia.
