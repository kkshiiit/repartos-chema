# Evidencia visual independiente — estructura 1.5

Esta evidencia compara la composición. No reemplaza la prueba funcional y no acredita instalación, apariencia nativa o rendimiento físico de Android.

## Método reproducible

1. Baseline 1.4 desde la exportación anterior aún servida, antes de cambiar el build. Cuatro pestañas a430×840, claro/oscuro, fixture fijo del18/10/2026 con seis alquileres y ocho variantes. Se conservan las imágenes `antes-*`.
2. Nueva app real en Chromium, sin maquetas ni imágenes generadas: mismo viewport, tema y fixture para `despues-*`. El movimiento se reduce para capturar un estado estable.
3. Láminas originales recortadas por teléfono, sin estirar sus píxeles. `referencia-app-*` usa exactamente el ancho/alto de cada recorte y el tema correspondiente. Fixture separado reproduce los tres alquileres ilustrados, marcos8/6/2 y tablones4/3/1; disponibles24/16, sin modificar datos reales. Los formularios se completan sólo en memoria y nunca se confirman. El historial ilustrado también es sintético.
4. `python3 scripts/compare-structure.py` monta las dos imágenes sin recolorear, retocar ni deformar. Produce11 comparativas con referencia y8 antes/después. Las capturas originales siguen disponibles.
5. Revisión visual manual de composición y de la matriz320/360/390/412, además de tablet/escritorio. Los reportes de contraste y geometría son evidencia adicional, independiente del juicio visual.

Código del recorrido: `tests/ui/estructura.spec.ts`. Capturas: `artifacts/capturas/estructura-1.5/`. Comparativas: `comparacion-referencia-*.png` y `comparacion-antes-despues-*.png`.

## Composición comprobable

| Superficie | Composición anterior | Composición nueva |
|---|---|---|
| Alquileres | Dos acciones superiores, resumen, filtros en línea y tarjetas altas con carga/fechas/responsable/botonera | Cabecera compacta, toolbar integrada y segmentos, grupos temporales, filas96px en fixture430×840 y acción principal en pie. Tres alquileres completos visibles; las funciones secundarias están en el detalle |
| Depósito | Tarjeta por material y cuatro métricas separadas, más botones | Lista continua, nombre/medida izquierda, disponible alineado derecha, resumen de otros estados y menú por pieza. Ancho del nombre corregido a320/360 sin reducir el área táctil del menú |
| Viaje | Introducción alta, botones por tramo y por parada, tarjetas repetidas | Secuencia numerada conectada con depósito final, estado/resumen por parada y un principal Abrir recorrido; GPS/orden/tramos/regreso en paneles |
| Historial | Filtros expandidos y cards con todos los movimientos y motivos | Cronología agrupada por día con iconos direccionales, hora y autor. Panel de filtros y panel del movimiento con origen/destino/motivo/deshacer |
| Detalle | Operaciones primero, tarjetas extensas y materiales después | Identidad/estado, banda de fechas, filas de saldo real, accesos breves, Más acciones y operación principal fija. Carga histórica íntegra en Datos |
| Alta/carga | Formularios dentro de cards y metadatos extensos por carga | Cliente/Carga/Revisar, secciones sin card exterior, planificación alineada, pie persistente y metadatos plegables compactos; valores conservados |
| Ajustes | Preferencias y formularios completos apilados | Identidad y grupos de filas que abren paneles de apariencia/movimiento/avisos/responsables/copias/depósito |
| Combos | Tarjetas con componentes y botones repetidos | Lista compartida, resumen y menú contextual; alta en pie |
| Documentos | Card exterior, opciones y acción mezcladas | Excel/Word segmentado, campos por sección y exportación principal en pie; generadores institucionales conservados |
| Ventanas/selectores | Controles de tamaños distintos y contenidos extensos | Cabecera serif, cierre único sin sol/luna, filas de selección, errores dentro del panel y guardas de edición/ocupado conservadas |

## Diferencias intencionales respecto de los dibujos

- Se prioriza Vencidos antes de Hoy por la instrucción posterior del usuario. La lámina muestra Hoy antes de otros alquileres. Retirados incluye REINGRESADO; no reaparece Cerradas.
- Los títulos conservan28/34px de `tokens.json`, frente al tamaño ilustrado mayor. No se cambian cantidades, medidas ni estados para obtener parecido.
- La lista resume número de piezas/tipos; el detalle conserva nombres, medidas, apodos, carga histórica y saldo real. No se equiparan marcos con cuerpos completos.
- Viaje conserva todos los alquileres operativos y su depósito real; el dibujo abrevia paradas y muestra dos botones. La app tiene una acción principal y mantiene los tramos dentro de su panel.
- El historial ordena realmente por timestamp; no replica el orden de horas inconsistente de la ilustración.
- Los campos existentes siguen siendo texto/fecha validada, no se inventan catálogos de clientes ni proveedores de mapas. Se mantienen logo y documentos institucionales.
- Ajustes conserva Responsables y Entorno de trabajo, que no aparecen completos en la lámina. Sus datos no se sacrifican por fidelidad.

## Límites

Las imágenes son capturas web actuales. El texto200% se simula en DOM y no equivale al fontScale de Android. El brillo y el panel del dispositivo influyen en la visibilidad exterior. No se afirman FPS, memoria ni uso físico comprobado. La comparación acredita estructura y jerarquía, no igualdad de píxeles con una ilustración.
