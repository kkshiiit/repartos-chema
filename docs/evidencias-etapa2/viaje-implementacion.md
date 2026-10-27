# H2 Viaje — implementación nativa y verificaciones

Fecha: 27/10/2026 UTC. Rama feat/chema-maestro-etapa2. Cambios todavía sin commit por este agente; el coordinador integra, ejecuta suite y respalda por bloque. No se modifica inventario ni se declara probado Android físico.

## Archivos

- app/(tabs)/mapa.tsx: secuencia completa separada de filtros, filtros tarea/zona, lista virtualizada, origen explícito, ordenar cerca/material, borrador/guardado/deshacer, errores y Maps/depósito.
- src/domain/tripOrder.ts: elegibilidad por carga/saldo operativo, reconciliación, permutación visible, distancias y cantidades conocidas/desconocidas por identidad+medida, posición directa.
- src/services/tripPreferences.ts: preferencias versionadas/namespace, revisión contra escritura concurrente, readback de persistencia, fallo/corrupción conserva datos sin reset; no snapshots comerciales.
- src/services/tripLocation.ts: captura puntual inyectable del OS, permiso contextual, servicio apagado/denegación/permanente/timeout/cancelación/resultados tardíos, coordenadas/fecha/precisión y revisión explícita de captura vieja/imprecisa.
- src/components/TripOrderEditor.tsx: sesión borrador, FlatList de filas medidas, agarre Gesture/Reanimated con autoscroll y capa activa en UI, posición directa/acciones accesibles/anuncio, Cancelar/Guardar. Reconciliación se incorpora al borrador: cerrar y reabrir una tarea no recupera su posición vieja por un draft antiguo.
- src/utils/trip.ts: criterio con origen ahora estrictamente distancia; sin origen conserva prioridad inicial. Maps/tramos reales preservados.
- tests/trip-order.test.ts, trip-preferences.test.ts, trip-location.test.ts y trip.test.ts.
- tests/ui/trip.spec.ts y sólo caso Viaje de deposito-viaje-estructura.spec.ts: contratos nuevos de editor/posición/guardar-cancelar/persistencia/deshacer, no botones de subir/bajar inmediato de la interfaz anterior.

## Evidencia ejecutada

1. RED real en criterio anterior de cercanía: el test pedía entrega cercana antes que retiro vencido lejano y recibió vencido/hoy/entrega/futuro. Registro viaje-cercania-red.txt. Se corrigió prioridad antes de distancia y quedó verde.
2. Nuevos módulos tuvieron fallo de importación por ausencia antes de implementarlos; se conserva como diagnóstico inicial, no como regresión funcional observada en Android. Registros viaje-modulos-red.txt y viaje-ubicacion-red.txt.
3. `npx vitest run tests/trip.test.ts tests/trip-order.test.ts tests/trip-preferences.test.ts tests/trip-location.test.ts`: 26/26, 4 archivos. Casos literales A-X-B-Y→B-X-A-Y; cerradas/repetidas/nuevas; zonas+tareas; cercana/lejana/empates/sincoords; 3/6/cero/desconocido/medidas; rechazo posición inválida; guardar/reabrir/aislar namespace/corrupción/fallo/disputa revisión; GPS apagado/permanente/denegado/timeout/cancelación/invalidación/precisión/edad.
4. Typecheck global `npx tsc --noEmit` y ESLint focalizados: exit0 en el corte de las 02:12 UTC. Hubo un fallo transitorio de tipo unregister durante la edición del editor, corregido antes de este corte.
5. Pruebas de navegador y capturas: pendientes del build web fresco coordinado. No usar dist anterior como prueba de los cambios.

La suite completa y build APK serán ejecutados por el coordinador después de integrar los bloques. No se declaran UI general, arrastre/GPS/permisos Android ni TalkBack físicos aprobados por pruebas unitarias del adaptador.

## Límites y decisiones

- No existe equivalencia de cuerpos comprobada: se elige material/medida literal y cantidad real. No suma piezas distintas ni divide marcos; no certifica capacidad de vehículo.
- Distancia es línea recta desde un único origen. Cambiar origen/filtro/material no ordena automáticamente y no mantiene una etiqueta engañosa del criterio anterior.
- GPS sólo foreground al pulsar; sin seguimiento ni fallback silencioso. Cancelación ignora la respuesta nativa tardía; no afirma cancelar una API nativa que no ofrece esa capacidad.
- Preferencias personales usan namespace individual:userUid. Al integrar equipo, el coordinador debe incorporar workspaceId sin compartir filtros ni borrar preferencias individuales.
- La ruta publicada del equipo corresponde a H4B, no a ordenar/filtrar localmente. No hay publicación silenciosa por esta pantalla.
