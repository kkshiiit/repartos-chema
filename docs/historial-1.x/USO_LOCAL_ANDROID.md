# Uso individual Android — edición Cobalto 1.6.1

Esta edición no necesita Firebase, Cloudflare, suscripción ni una PC encendida. Los datos no se sincronizan con otros celulares. El nombre identifica movimientos locales; no crea una cuenta ni autentica a una persona.

## Actualizar sin perder datos

1. En la app instalada, guardá un JSON fuera de la app y comprobá dónde quedó.
2. Instalá el APK nuevo encima, con el mismo package/certificado. **No desinstales ni borres almacenamiento.**
3. Si todavía no se realizó la migración anterior, el primer inicio copia el inventario y las recuperaciones de AsyncStorage a SQLite. Una base SQLite existente conserva sus datos. Conserva íntegro el original y no lo usa como fallback antiguo si SQLite falta. Una instalación nueva inicia vacía.
4. Si hay error, conservá el mensaje y los archivos; no reinicies datos para arreglarlo. Desde el aviso se puede guardar un original de asistencia o recuperar un JSON reciente confirmado. El archivo de asistencia de migración puede ser anterior al último trabajo y no se presenta como copia actual.

## Guardar y recuperar

En Ajustes → Copias y restauración → Descargar copia, Android pide una carpeta. Recomendación: una carpeta propia en almacenamiento local, por ejemplo Descargas/RepartosChema. Se crea un JSON nuevo y se comparan sus bytes antes de confirmar. Cancelar no cambia inventario. Compartir un Word/Excel es otro flujo: no equivale a guardar un respaldo.

En web se prepara una descarga; el navegador no certifica que quedó guardada. Para Empezar vacío, hay que descargarla y reconocer explícitamente que el JSON se guardó fuera de la aplicación. Android exige guardado verificado. Además se conserva recuperación interna; una copia interna no protege contra pérdida o desinstalación del teléfono.

Elegir copia → revisar cantidades → Confirmar importación. Reemplaza el inventario, no lo mezcla. Rechaza copias incoherentes o fotos incompletas. Cancelar no cambia datos. Deshacer última importación, Recuperar anterior y Ver recuperaciones permiten volver a copias internas, archivando lo activo antes del cambio. No se elimina auditoría ni recuperaciones automáticamente.

Las fotos se guardan comprimidas localmente. Al quitarlas de un alquiler, sus archivos se retienen para no romper recuperaciones anteriores. No se envían a un servidor. Las copias contienen bytes de fotos y datos comerciales: conservar en privado. Guardar una copia al final de cada jornada y antes de actualizar, importar o vaciar.

## Temas y navegación

Claro/Oscuro/Seguir sistema en Ajustes → Apariencia; sol/luna solo en las cabeceras principales. Cambia inmediatamente sin perder formularios. Papel cálido y cobalto en claro, tinta en oscuro. Transiciones suaves/Estático se guarda aparte del inventario; siempre se respeta Reducir movimiento y no hay fondo animado. Al sol elegir Claro y ajustar brillo manualmente: la visibilidad depende también del dispositivo.

Alquileres agrupa Vencidos, Retiros de hoy, Por entregar, Próximos retiros y Retirados. La búsqueda y Filtros están juntos: Filtros abre Zona y todos los estados. Tocar una fila abre su detalle. Nuevo alquiler abre Cliente → Carga → Revisar; avanzar no guarda ni mueve stock. Guardar alquiler conserva el borrador y recién Registrar entrega → Confirmar entrega mueve existencias. En Depósito usar los tres puntos de cada pieza para Editar, Mover stock o Ajustar. Faltantes/fotos se abren desde sus secciones del detalle. Los cambios de panel piden seguir editando o descartar; cerrar no confirma una operación. Documentos permite elegir Excel o Word antes de generar. Más acciones del alquiler conserva triangulación, ubicación, reactivación/reingreso y demás operaciones según estado. En Viaje, tocar una parada permite ordenar o abrir Cómo llegar; Opciones del viaje incluye Volver al depósito. Historial → tocar un movimiento → Deshacer ofrece la reversión segura durante cinco minutos, si corresponde. Para cambiar el nombre, Ajustes → fila de identidad → Cambiar nombre.

## Avisos de retiro

Los avisos son locales y opcionales. En Ajustes → Avisos de retiro, la función comienza desactivada; muestra las **08:00** como horario sugerido editable y selecciona los cuatro avisos: **3, 2 y 1 día antes, y el mismo día**. Al activarla se solicita permiso de notificaciones. Si se deniega, el alquiler se guarda normalmente y sus avisos no se presentan como activos.

Cada alquiler usa inicialmente la configuración general. En su sección Recordatorios se puede personalizar horario y anticipaciones, desactivar sus avisos o volver a Usar configuración general. Cambiar los ajustes generales reprograma los avisos futuros de los alquileres que los heredan; conserva las preferencias personalizadas. Cambiar «Alquilado hasta» recalcula las fechas y completar el retiro cancela los avisos pendientes. Sólo se programan horarios futuros: los ya pasados no se disparan juntos. Una notificación nunca modifica el inventario.

Los recordatorios manuales anteriores conservan sus datos y opciones durante la migración; no se duplican al incorporar la nueva programación. La aplicación conserva las intenciones y los errores recuperables para reintentar y reconciliar con Android. Un fallo parcial no equivale a una programación completa. Los sonidos y la vibración de confirmación siguen siendo una preferencia independiente, apagada inicialmente; los avisos automáticos de retiro se programan silenciosos.

Web no programa notificaciones. En Android, el horario es el solicitado al sistema: batería, permisos, silencio o No molestar pueden retrasar u ocultar un aviso. No se promete puntualidad exacta ni se considera probada la entrega tras cerrar la app o reiniciar el teléfono sin una comprobación física. La guía [AVISOS_RETIRO_1_6.md](AVISOS_RETIRO_1_6.md) explica configuración, herencia, permisos, migración y pruebas pendientes. No se envían push ni se requieren conexión o servicios pagos para estos avisos.

## Comprobación breve después de instalar

- Abrir alquileres, depósito e historial; verificar cantidades existentes y tema.
- Cerrar completamente y reabrir sin conexión; confirmar los mismos datos.
- Guardar un JSON; cancelar otra selección y comprobar que nada cambió.
- Crear un alquiler de prueba, entregar y retirar con responsables; comprobar stock y deshacer seguro.
- Elegir foto y abrir/compartir Word/Excel en un lector disponible. Mapas/WhatsApp se abren por intervención del usuario y pueden necesitar internet/mapas externos.

La actualización y estas funciones nativas aún requieren confirmación en un Android físico. El informe de entrega distingue navegador, SQLite de Node, mocks y hardware.

---

## Antecedente de uso1.2 (histórico)

# Repartos Chema 1.2 — uso individual en Android

La versión1.2.2 conserva las funciones de1.2.0 y las mejoras de importación JSON de1.2.1. Además permite agregar al responsable desde una entrega/retiro, genera Word aunque el filtro Excel tenga un error y guarda documentos/copias nativas con rutas distintas. Consultar PULIDO_1_2_2.md para el estado real de compilación/publicación.

Esta edición guarda datos en un solo celular. No requiere Firebase, Cloudflare, cuenta paga ni conexión para registrar movimientos. WhatsApp y mapas externos sí necesitan las aplicaciones/conectividad correspondientes. No comparte inventario con otros celulares.

## Instalar o actualizar

Antes de actualizar, abrir la app anterior → Ajustes → Descargar copia y guardar el JSON fuera de la app, por ejemplo en Archivos. Instalar el APK nuevo **encima**, sin desinstalar. Se conservan los datos anteriores; nunca se vacían al actualizar. Si Android informa un error, conservar el mensaje y no desinstalar para intentar solucionarlo sin respaldo.

Una instalación nueva comienza sin materiales, alquileres ni responsables ficticios. Escribir un nombre para identificar los movimientos locales; no es una cuenta autenticada en la nube.

## Primera carga

1. Agregar al chofer/responsable desde la propia entrega o retiro mediante Agregar responsable. Se guarda y selecciona para esa operación. También se puede preparar la lista en Ajustes → Responsables, uno por línea. Los nombres no son cuentas autenticadas.
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

Para importar: Ajustes → Elegir copia → seleccionar JSON completo de Repartos Chema → revisar cantidades de alquileres/materiales → Confirmar importación. Elegir el archivo no cambia datos; Cancelar importación conserva el inventario activo. Los inventarios se reemplazan, no se suman. Se valida el formato y se archiva el estado anterior antes del cambio. Deshacer última importación recupera ese estado. Un archivo corrupto no inicia una base vacía ni borra lo existente. Las copias antiguas de nube con operaciones pendientes requieren revisión; no se descartan sus movimientos para importarlas.

Recuperar anterior corresponde a Empezar vacío. Deshacer última importación corresponde a la importación JSON. Ambas conservan el estado activo antes de recuperar. Guardar también copias fuera de la app; los archivos internos no sobreviven a una desinstalación o borrado del almacenamiento.

## Documentos, fotos y navegación

Documentos genera Excel y Word localmente. Android abre Compartir para guardarlos o abrirlos con una aplicación compatible instalada. Sin una aplicación/hoja de compartir disponible, puede fallar la entrega del archivo y debe conservarse el error. No hay PDF automático implementado.

Las fotos disponibles en esta edición son locales. Se solicitan permisos al elegir o capturar, no para iniciar la app. No se suben a Storage ni se envía push. Las copias JSON completas incluyen las fotos locales disponibles y avisan si falta alguna.

GPS abre una aplicación de mapas externa. Viaje incluye Volver al depósito configurado. Si no hay internet, el funcionamiento del mapa depende de la aplicación externa y de mapas descargados; no se inventa navegación offline.

Claro/Oscuro/Sistema se configuran en Ajustes y se guardan. El botón de la cabecera principal alterna claro/oscuro; no modifica inventario.

## Qué está comprobado

Recorrido automatizado web de esta edición: inicio vacío, depósito/ajuste, alquiler/entrega/retiro/reingreso/deshacer, historial, persistencia/reapertura offline, JSON/exportación/restauración/recuperación, temas y documentos. Generadores de archivos móviles probados en Node. La firma/metadata del APK deben verificarse antes de publicarlo.

No hay Android físico conectado al entorno: cámara, permisos, GPS externo, selector de archivos, instalación sobre versión anterior y Compartir requieren prueba en el celular. No se confunden estas limitaciones con pruebas aprobadas de hardware.
