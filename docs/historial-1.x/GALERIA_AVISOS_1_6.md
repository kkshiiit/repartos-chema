# Actualización visual 1.6.1 — 25/10/2026

Capturas regeneradas en la suite actual57/57, Chromium y datos sintéticos. El parche1.6.1 no cambia composición/estilos. Diecinueve comparativas regeneradas con rótulo1.6.1; manifiesto actual `artifacts/validacion/cierre-2026-10-25-capturas.json`. OchoAxe0violaciones/0incompletas. Revisadas manualmente principalclaro y panelpersonalizadooscuro; comparación de principal/formulario mantiene estructura de referencia. No prueba Android físico. Los enlaces inferiores siguen las carpetas históricas y apuntan a los archivos actualizados de este commit; versiones previas quedan en Git.

---

# Capturas reales 1.6 · web

Contenido sintético, reloj fijo23/10/2026 para avisos. Navegador Chromium, viewport390×844; no son maquetas ni capturas Android. Los controles fecha/hora del navegador se dibujan según su idioma/entorno; escritura alternativa DD/MM/AAAA y HH:mm disponible.

| Pantalla | Claro | Oscuro |
|---|---|---|
| Alquileres y contador | [Captura](../artifacts/capturas/avisos-1.6/390-light-principal.png) | [Captura](../artifacts/capturas/avisos-1.6/390-dark-principal.png) |
| Detalle y fecha | [Captura](../artifacts/capturas/avisos-1.6/390-light-detalle.png) | [Captura](../artifacts/capturas/avisos-1.6/390-dark-detalle.png) |
| General08:00/4avisos | [Captura](../artifacts/capturas/avisos-1.6/390-light-ajustes.png) | [Captura](../artifacts/capturas/avisos-1.6/390-dark-ajustes.png) |
| Personalización | [Captura](../artifacts/capturas/avisos-1.6/390-light-personalizado.png) | [Captura](../artifacts/capturas/avisos-1.6/390-dark-personalizado.png) |

La suite general56/56 volvió a capturar pantallas320/360/390/412/tablet/escritorio y formularios/paneles. Por compatibilidad de los recorridos, ese directorio conserva el nombre histórico `estructura-1.5`; los archivos de ESTE commit y el manifiesto avisos-capturas-manifiesto.json corresponden a1.6. Las capturas anteriores1.5 se conservan en Gitbc3068c y en su respaldo original. No interpretar el nombre de carpeta como versión del APK.

Comparación estructural independiente de las pruebas funcionales: imágenes de referencia recortadas al mismo tamaño/tema que la app, con sus3alquileres/2materiales, reloj18/10/2026. Scriptcompare-structure.py usa la versión real de app.json en el rótulo. Se generaron19tableros (11referencia/app,8antes1.4/después). Revisión manual adicional de Alquileres, Nuevo y Detalle antes del APK; el bloque1.5 ya había revisado las otras composiciones. Cambios nuevos: contador/calendario; sin volver a tarjetas altas/acciones repetidas. Se mantienen diferencias deliberadas documentadas: vencidos primero, títulos28px de tokens, saldo real, CTA fijo, campos de seguridad y revisión íntegra del retiro.

- [Alquileres · referencia/app](../artifacts/capturas/estructura-1.5/comparacion-referencia-alquileres.png)
- [Deposito · referencia/app](../artifacts/capturas/estructura-1.5/comparacion-referencia-deposito.png)
- [Viaje · referencia/app](../artifacts/capturas/estructura-1.5/comparacion-referencia-viaje.png)
- [Historial · referencia/app](../artifacts/capturas/estructura-1.5/comparacion-referencia-historial.png)
- [Nuevo · referencia/app](../artifacts/capturas/estructura-1.5/comparacion-referencia-nuevo.png)
- [Detalle · referencia/app](../artifacts/capturas/estructura-1.5/comparacion-referencia-detalle.png)
- [Carga · referencia/app](../artifacts/capturas/estructura-1.5/comparacion-referencia-carga.png)
- [Retiro · referencia/app](../artifacts/capturas/estructura-1.5/comparacion-referencia-retiro.png)
- [Ajustes · referencia/app](../artifacts/capturas/estructura-1.5/comparacion-referencia-ajustes.png)
- [Combos · referencia/app](../artifacts/capturas/estructura-1.5/comparacion-referencia-combos.png)
- [Documentos · referencia/app](../artifacts/capturas/estructura-1.5/comparacion-referencia-documentos.png)

Accesibilidad nueva:8superficies (4pantallas×2temas) analizadas con Axe WCAG2A/AA,0violaciones y0incompletas tras corregir la semántica del grupo de panel. No equivale a certificación ni prueba física de TalkBack. Ver avisos-axe-*.json. El primer análisis señaló4incompletas de aria-label sobre div sin rol; se corrigieron y reejecutaron. El análisis previo se acredita con su registro histórico, no se presenta como validación física.
