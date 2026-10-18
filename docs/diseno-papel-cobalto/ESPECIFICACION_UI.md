# Repartos Chema: rediseño completo

Fecha: 18 de octubre de 2026. Estado: propuesta visual y especificación;
no implementada en el APK. Los ejemplos de las imágenes son sintéticos.

## Objetivo

Crear una interfaz propia para trabajar con alquileres y materiales desde
Android, individual y local. El cambio comprende todas las superficies
visibles, no una recoloración de las tarjetas de 1.3. El almacenamiento,
las reglas de inventario y el formato institucional de los documentos
constituyen restricciones del rediseño, no elementos para reescribir.

La inspección se basó en las rutas y capturas del snapshot 1d37618 y en
docs/HERRAMIENTAS_UI.md consultado en main. Antes de implementar, revisar
el main actual: este paquete no afirma ser su último código funcional.

## Mezcla y criterio original

| Referencia | Criterio aplicado |
| --- | --- |
| Bear | Lectura tranquila; títulos editoriales y separación por tipografía. |
| Todoist | Acción principal evidente; estado entendible sin depender del color. |
| Oura | Resumen diario enfocado y profundidad discreta. |
| Superlist | Navegación rápida, listas y acciones según el contexto. |
| Structured | Fechas y secuencia visual para viajes y pendientes. |
| Gentler Streak | Textos amables, estados vacíos y avisos sin tono punitivo. |
| Revolut | Revisión clara de una operación antes de confirmarla. |
| Linear | Controles compactos, consistencia y superficies contenidas. |

No copiar marcas, pantallas o sonidos propietarios. Se retira la restricción
rosa/violeta y se reemplaza también la propuesta Jade anterior. Nueva base:
papel cálido, tinta y cobalto. No conservar auroras o vidrio en todas las
tarjetas por inercia. El fondo debe ser estable y ayudar a leer.

## Sistema visual

Fuente de valores: tokens.json. Claro/Oscuro/Sistema en todas las rutas.
Títulos serif de sistema o fuente libre local verificada, cuerpo sans de
sistema. Dos familias como máximo; sin descargar fuentes al abrir la app.
Título principal 28/34, sección 19/25, cuerpo 16/23, auxiliar 14/20,
etiqueta mínima 12/17 solo para información no esencial. Adaptar a escala
de fuente; no fijar alturas que corten texto. Cantidades con cifras tabulares.

Márgenes 20, espaciado en múltiplos de 4, radio 12 en campos, 16 en objetos,
24 en paneles. Usar agrupación y separadores antes que recuadros por cada
elemento. Sin tarjetas anidadas para texto normal. Un objeto independiente
puede ser una tarjeta; una lista habitual debe leerse como lista.

Los botones primarios son cobalto con texto blanco. Acciones destructivas
usan terracota y texto claro, con descripción explícita de su efecto. Estados
con icono y etiqueta además del color. Iconos de trazo consistentes. Usar
archivo/dispositivo para copias locales: no usar nube. La lámina final
de Ajustes ya usa archivo con flecha de restauración.

El logo original Grupo Chema se conserva como recurso existente, sin
redibujarlo ni recolorearlo. Word/Excel conservan el encabezado institucional
rojo y su contenido. El esquema nuevo es para la aplicación.

## Estructura común

Encabezado compacto con título, una acción contextual y acceso rápido al
tema en las vistas principales. Cuatro pestañas: Alquileres, Depósito,
Viaje e Historial. Texto siempre visible y selección accesible. Respetar
safe areas, navegación de gestos y botón Atrás. No construir una barra
personalizada si las primitivas existentes permiten la fidelidad necesaria.

Pantallas de edición enfocadas: volver, título, progreso cuando corresponda
y pie de acciones compatible con teclado. No duplicar la barra de pestañas
en pasos donde distrae o deja acciones fuera de alcance. Al cambiar de tema
o abrir un selector, conservar los valores introducidos.

## Cobertura de rutas y superficies

| Ruta o superficie existente | Diseño requerido |
| --- | --- |
| app/(auth)/login.tsx | Entrada local con logo original y nombre; sin prometer cuenta, equipo o nube. |
| Bienvenida y ayuda | Cuatro pasos actuales, contenido breve, indicador de avance y volver a consultar. |
| app/(tabs)/index.tsx | Alquileres: resumen compacto, búsqueda, filtros y prioridad temporal. Todos los filtros actuales siguen accesibles. |
| app/(tabs)/galpon.tsx | Depósito: nombres completos, medida, cantidades por estado, menús claros de editar/mover/ajustar. No sumar estados incompatibles. |
| app/(tabs)/mapa.tsx | Viaje: secuencia existente, zonas, permiso GPS, regreso y apertura de tramos. Sin inventar optimización o navegación propia. |
| app/(tabs)/historial.tsx | Cronología y filtros compactos en panel. Conservar búsqueda por acción, alquiler, usuario y fecha. Orden real de eventos, no el orden ilustrativo de la imagen. |
| app/obra/[id].tsx | Detalle: identificación, estado, fechas, materiales, fotos y acciones contextuales. Con faltante, triangular y demás operaciones siguen disponibles. |
| app/obra/nueva.tsx | Cliente, carga y revisión como pasos visuales; no escribir stock por avanzar o volver. Conservar todos los campos actuales, aun si no aparecen en el primer encuadre. |
| app/obra/editar.tsx | Mismos componentes y validación que alta; no perder cambios al regresar o cambiar tema. |
| Entrega, retiro, reingreso y triangulación | Paneles con responsable, materiales, cantidades y efecto; mantener reglas de dominio exactas. |
| Daño, pérdida, reparación y recuperación | Etiquetas precisas, detalle de cantidades y confirmación; no descuentos duplicados. |
| app/combos.tsx | Listas de combinaciones, alta/editar/eliminar, elección desde carga y fusión según comportamiento actual. |
| app/configuracion.tsx | Preferencias y herramientas agrupadas; edición de nombre y depósito en paneles cortos. |
| Copias, restauración y recuperación | Selector, lectura, validación, revisión, confirmación, guardado, cancelación y errores con el mismo sistema. |
| app/exportar.tsx | Selector de formato Excel/Word, filtros correspondientes y estados de generación/compartir. Sin PDF inventado. |
| Fotos y selectores | Cámara/galería, permisos, vista previa, quitar/restaurar y archivo faltante; conservar bytes que necesitan las recuperaciones. |
| app/equipo/unirse.tsx | Revisar si es legado o alcanzable. No activar multiusuario, nube o una ruta remota para completar el rediseño. |
| Superposiciones comunes | Alertas, menús, fecha, zona, material, responsable, filtros y confirmaciones del botón Atrás. |

La lista se amplía con toda superficie alcanzable encontrada al inventariar
el código actual. No dejar una ruta con estilo viejo por no estar fotografiada.
Una imagen representa un encuadre, no una eliminación de funciones fuera de él.

## Ventanas, mensajes y notificaciones

Panel inferior para filtros y operaciones breves. Pantalla completa para
formularios largos, teclado o lector de pantalla que lo requieran. Diálogo
centrado solo para confirmación corta o advertencia importante.

Cancelar, cerrar, Atrás, tocar el fondo y arrastrar deben compartir una
misma política. Si hay cambios, ofrecer seguir editando o descartarlos
explícitamente. Nunca confirmar una operación por cerrar un panel. Al cerrar,
dejar de interceptar toques y devolver foco al disparador cuando sea posible.

Aviso de éxito compacto tras escritura confirmada; tiempo suficiente y una
sola instancia. Fallo accionable persistente con reintento, texto específico
y datos conservados. Deshacer solo donde exista soporte real de dominio.
No usar un aviso pasajero como único registro de una pérdida de datos.

Importación: distinguir cancelación, archivo ilegible, JSON inválido,
estructura incompatible, error semántico, foto ausente y fallo de persistencia.
Mostrar resumen real validado y efecto de reemplazo antes de confirmar.
Ofrecer guardar copia actual usando el servicio existente. No poner un sello
de copia verificada antes de elegir destino, escribir, releer y comprobar.
No crear rutas nuevas que salteen la restauración transaccional existente.

Recordatorios: si no existen en la app, tratarlos como una funcionalidad
nueva separada dentro de la entrega, con pruebas explícitas. Locales, opt-in,
sin backend. Pedir permisos al activar la función; manejar denegación sin
bloquear la app. No programar nada con los datos sintéticos del paquete.
No asumir hora, repetición o frecuencia: debe elegirse de forma clara.
Cancelar o actualizar avisos obsoletos al cambiar el alquiler. Android
controla el aspecto de la notificación del sistema; diseñar su contenido,
canal y acciones compatibles, no prometer la maqueta como su render exacto.

## Sonido y vibración

El subpaquete sonidos-v2 incluye tres WAV originales y una escucha MP3.
Recordatorio cálido 0.96s, confirmación 0.44s, atención 0.68s. Sonido y
vibración opcionales. Confirmaciones desactivadas por defecto. No emitir
sonidos por cada botón, transición, arrastre o render. No copiar audio de
las apps de referencia. No usar servicios de audio, red o descargas al iniciar.

Respetar canales, volumen, silencio y No molestar de Android. Verificar
compatibilidad con Expo y reglas de canales sin prometer cambios retroactivos
del sonido de un canal ya creado. Si se usa una biblioteca nueva, justificarla
y fijar una versión compatible. No declarar pruebas físicas sin un teléfono.

## Movimiento

| Acción | Propuesta |
| --- | --- |
| Presión de botón | Escala 0.98 y opacidad leve, entrada 100ms y retorno 140ms. |
| Pestaña/segmento | Indicador 180ms; contenido sin animar todas las filas. |
| Abrir panel | 240ms, desaceleración; fondo 160ms. |
| Cerrar panel | 180ms; no demorar confirmaciones de dominio. |
| Toast | Desplazamiento pequeño y opacidad 160ms; sin rebotes. |
| Expandir sección | 180ms, manteniendo posición de lectura. |
| Reducir movimiento | Sin escalas ni traslaciones; actualización directa o fundido breve. |

No obligar a esperar animaciones para guardar, retirar o navegar. No animar
fondos indefinidamente ni ejecutar movimiento de rutas ocultas. Preferir
transform/opacity y las capacidades ya instaladas; no sumar un motor gráfico
para copiar una captura. Evaluar rendimiento en release; no inferir FPS reales
a partir de Playwright o una imagen generada.

## Estados y accesibilidad

Por pantalla: vacío nuevo, vacío por filtros, cargando, contenido, error,
guardando/deshabilitado y permiso denegado cuando corresponda. Validación
inline junto al campo y foco en el primer fallo. Botones 48dp; contraste
AA medido en el resultado renderizado; etiquetas y estados TalkBack.
Compatibilidad 320/360/390/412dp, letra hasta 200% y teclado abierto.
Conservar nombres completos, medidas, unidades y cantidades sin truncarlos
de forma ambigua. No depender solo de gestos: toda acción necesita botón
o menú accesible. Una fecha debe respetar el formato humano local y la
serialización interna existente.

## Límites y evidencias

Las maquetas generadas son guía de estructura, no especificación de píxeles
infalible: contienen datos ficticios, pequeños desvíos de iconos y ejemplos
de orden que deben corregirse con esta especificación y el dominio actual.
No representan el Android físico ni prueban contraste, persistencia o permisos.

175 pruebas y el build de 1.3 son evidencia histórica de esa entrega, no
pruebas de este rediseño. La implementación deberá generar evidencia nueva.
Hasta entonces no hay un APK con estas pantallas.
