# Repartos Chema 1.1 — cambios solicitados desde Android

Esta versión responde a las capturas reales aportadas por el usuario. Se conserva Expo, el repositorio persistente y los nombres técnicos de las entidades para evitar migraciones de inventario.

- Navegación: Alquileres, Depósito, Viaje e Historial. Retirados reúne los estados técnicos RETIRADO/REINGRESADO.
- Entrada: logo original de Grupo Chema y nombre grande. Se eliminaron el símbolo genérico y los lemas. Nombre de la persona; sin selector Administración/Operación ni distintivo AD.
- Bienvenida: cuatro pasos, omitir o completar, preferencia persistente y acceso desde Ajustes.
- Cabeceras y ventanas: un control de tema en las secciones principales; no aparece dentro de cada ventana ni en los detalles. Ajustes mantiene Claro/Oscuro/Sistema. Un cambio del sistema conserva formularios abiertos.
- Depósito: Agregar, Disponibles, Alquilados, A reparar y Perdido. El nombre ocupa una fila completa y las acciones otra; no se comprime entre botones. Bordes de superficies suaves, controles contrastados y áreas de44px como mínimo.
- Alquiler: entrega y retiro separados, flete y nombre de quien recibió. `recibidoPor` es opcional para compatibilidad, se conserva en datos, detalle, remito WhatsApp y Word; deshacer restaura el estado anterior.
- Viaje: vencidos primero, retiros de hoy después, entregas y alquileres aún en plazo. Orden manual o cercanía dentro de cada prioridad con coordenadas reales. Rutas divididas en tramos compatibles con Google Maps; no es una optimización vial ni considera tráfico. Último tramo termina en el depósito.
- Depósito fijo: enlace dado por usuario https://maps.app.goo.gl/ZVFoghjHrGDunK4v5. Se verificó pin Formosa y Cuba, Villa Ballester, lat -34.5530245, lng -58.5685218. No usar el centro de cámara del mapa. El destino solo cambia mediante Ajustes; es local en esta versión, no una configuración cloud compartida.
- Equipo: espacio compartido de una empresa, identidades de dispositivo y nombres para auditoría. Propietario interno puede invitar y revocar. El código está preparado y probado en emuladores; Firebase real sigue sin configurar. La demo no simula intercambio entre teléfonos.

## Recursos y límites

Logo original obtenido de https://static.wixstatic.com/media/4c5aba_c0550f66b3344c50a29fd252f71cfb2c~mv2_d_1968_1355_s_2.png y comparado visualmente con el adjunto. PNG RGBA transparente, sin redibujarlo. Se integra como imagen estática y opacidad moderada; no hay animación ni blur costoso.

Motion Sites no figura entre los MCP disponibles ni en la configuración local de este entorno. No se afirmó que se utilizó. Las guías de diseño se consultaron; las capturas nuevas se obtienen de la app real con Playwright. No se contrató ni se desplegó un servicio externo de diseño.

No se alteró brillo del dispositivo. No se añadieron librerías visuales, fuentes externas, polling de animación ni publicidad. Pruebas físicas de esta versión, sincronización productiva y recuperación del propietario ante pérdida de dispositivo siguen pendientes. Los resultados de comandos de esta ejecución están en artifacts/validacion y el punto vigente en CONTINUIDAD_CODEX.md.
