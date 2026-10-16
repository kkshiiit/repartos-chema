# Repartos Chema 1.2 — uso individual en Android

Esta edición guarda datos en un solo celular. No requiere Firebase, Cloudflare, cuenta paga ni conexión para registrar movimientos. WhatsApp y mapas externos sí necesitan las aplicaciones/conectividad correspondientes. No comparte inventario con otros celulares.

## Instalar o actualizar

Antes de actualizar, abrir la app anterior → Ajustes → Descargar copia y guardar el JSON fuera de la app, por ejemplo en Archivos. Instalar el APK nuevo **encima**, sin desinstalar. Se conservan los datos anteriores; nunca se vacían al actualizar. Si Android informa un error, conservar el mensaje y no desinstalar para intentar solucionarlo sin respaldo.

Una instalación nueva comienza sin materiales, alquileres ni responsables ficticios. Escribir un nombre para identificar los movimientos locales; no es una cuenta autenticada en la nube.

## Primera carga

1. Ajustes → Responsables: escribir el nombre del chofer/responsable, uno por línea, y guardar.
2. Depósito → Agregar: crear cada pieza y su medida. El stock comienza en cero.
3. En la pieza, Ajustar: registrar cantidad inicial positiva, procedencia «Inventario inicial» y motivo del recuento. Confirmar. No inventar stock ni usar cantidades negativas como cantidad inicial.
4. Alquileres → Nuevo alquiler: cliente, dirección, zona y fechas. Preparar carga, revisar cantidades y guardar.
5. Entregar: elegir responsable y registrar quién recibió. Recién al confirmar se mueve stock de depósito a alquilado.
6. Retirar: elegir responsable e inspeccionar faltantes/daños antes de confirmar. Revisar stock y luego Reingresar. Historial conserva movimientos y permite Deshacer durante cinco minutos cuando es seguro.

## Datos anteriores y ejemplos

Si se actualizó una versión con ejemplos, se conservan junto con cualquier dato cargado por el usuario. Para empezar limpio: Ajustes → Empezar vacío. La app solicita confirmación, exporta JSON y archiva el estado previo en el dispositivo. Recuperar anterior permite volver a ese estado, incluso después de cerrar la app. Antes de recuperar también conserva el estado activo.

Empezar vacío no es una limpieza automática. Guardar el JSON en Archivos: una copia dentro del celular se pierde si se desinstala o borra el almacenamiento de la app, se pierde el teléfono o falla el dispositivo.

## Copias JSON

Ajustes → Descargar copia → elegir una app o ubicación de guardado disponible. Conviene guardar una copia al terminar cada jornada y copiarla a otro lugar privado cuando sea posible. Excel/Word no sustituyen esta copia.

Para restaurar: Ajustes → Elegir copia → seleccionar JSON completo de Repartos Chema → Restaurar copia → confirmar. Se valida el formato y se conserva el estado anterior antes de reemplazarlo. Un archivo corrupto no debe iniciar una base vacía ni borrar lo existente. Las copias antiguas de nube con operaciones pendientes requieren revisión; no se descartan sus movimientos para importarlas.

## Documentos, fotos y navegación

Documentos genera Excel y Word localmente. Android abre Compartir para guardarlos o abrirlos con una aplicación compatible instalada. Sin una aplicación/hoja de compartir disponible, puede fallar la entrega del archivo y debe conservarse el error. No hay PDF automático implementado.

Las fotos disponibles en esta edición son locales. Se solicitan permisos al elegir o capturar, no para iniciar la app. No se suben a Storage ni se envía push. Las copias JSON completas incluyen las fotos locales disponibles y avisan si falta alguna.

GPS abre una aplicación de mapas externa. Viaje incluye Volver al depósito configurado. Si no hay internet, el funcionamiento del mapa depende de la aplicación externa y de mapas descargados; no se inventa navegación offline.

Claro/Oscuro/Sistema se configuran en Ajustes y se guardan. El botón de la cabecera principal alterna claro/oscuro; no modifica inventario.

## Qué está comprobado

Recorrido automatizado web de esta edición: inicio vacío, depósito/ajuste, alquiler/entrega/retiro/reingreso/deshacer, historial, persistencia/reapertura offline, JSON/exportación/restauración/recuperación, temas y documentos. Generadores de archivos móviles probados en Node. La firma/metadata del APK deben verificarse antes de publicarlo.

No hay Android físico conectado al entorno: cámara, permisos, GPS externo, selector de archivos, instalación sobre versión anterior y Compartir requieren prueba en el celular. No se confunden estas limitaciones con pruebas aprobadas de hardware.
