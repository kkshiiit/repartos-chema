# Cierre estructural papel y cobalto 1.5

## Base y alcance

Base verificada `332e56eb2357df0a791d48c83b9f4c20f1714cd3`, main y origin/main coincidentes. Corrección solicitada tras 1.4: la validación funcional anterior no acreditaba fidelidad de composición. No se repite migración ni se cambia almacenamiento, stock, fotos, JSON, identificador o firma. Edición individual gratuita y offline.

Respaldo inmutable antes de editar: `/workspace/respaldos/estructura-1.5/base-332e56e.zip`, SHA256 `458c8dc5b6d1d730f5c0656ca0fe61b5dca589a7365adb2d51a92e210137665d`, CRC de todos los miembros correcto. Git conserva el punto base.

## Criterios visuales concretos

- Alquileres: toolbar integrada, tres segmentos principales con todos los estados disponibles en panel; grupos Vencidos, Retiros de hoy, Por entregar, Próximos retiros, Retirados. Filas compactas; sin botonera ni carga extensa por fila. Principal Nuevo alquiler en pie fijo.
- Depósito: filas continuas, cantidad disponible alineada, resto de estados en resumen y operaciones por menú.
- Viaje: secuencia conectada de paradas y depósito final; un botón principal. Reordenamiento, GPS y tramos conservados en paneles.
- Historial: fechas agrupadas y filas compactas; filtros y movimiento completo/deshacer en paneles.
- Detalle: identificación/fechas/materiales antes de acciones; operación principal abajo y extras en menú. Alta Cliente/Carga/Revisar con campos conservados y carga compacta.
- Ajustes: grupos de filas para preferencias/herramientas/copias/depósito. Combos en lista; documentos con selector segmentado y pie de exportación.

## Evidencias separadas

**Funcional:** check unitario/estático y Playwright registran conservación de datos, permisos, persistencia, cancelaciones y operaciones. No prueban semejanza visual.

**Visual:** `tests/ui/estructura.spec.ts` fija 18/10/2026, 430×840 y el mismo fixture sintético para capturas antes/después en claro y oscuro. Baseline capturado desde dist 1.4 antes de exportar la UI nueva. Referencias originales en `docs/diseno-papel-cobalto/referencias`. Comparaciones, medidas y revisión manual se incorporarán antes del APK. La referencia es una lámina ilustrada: no se exige coincidencia de píxeles ni se cambian cantidades para imitarla.

## Estado de ejecución

Implementación estructural en revisión; aún no acredita cierre visual ni APK nuevo. Historial 1.4 preservado. Próximo: suite y build web, comparación real y correcciones; después respaldo y compilación nativa completa.
