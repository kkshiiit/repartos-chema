# Manual de Repartos Chema

## Antes de usar datos reales

La entrega actual es una **demostración local**. Administración y Operación son perfiles ficticios. Cada navegador o instalación tiene sus propios datos; no se comparten automáticamente entre celulares. No usarla como único registro comercial hasta validar producción y respaldos.

## Entrar y cambiar apariencia

Selecciona Administración para probar gestión completa, u Operación para tareas de campo. En la cabecera, toca el sol o la luna para cambiar tema al instante. En el botón de perfil abre Configuración: Claro, Oscuro o Seguir sistema. El cambio no borra lo que estés escribiendo. Ajusta el brillo del dispositivo según las condiciones exteriores; la aplicación no lo modifica.

## Obras

Busca cliente o dirección, filtra zona y estado. Vencido significa que pasó la fecha prevista; Retiro hoy corresponde al calendario de Buenos Aires. Pendiente de entrega se identifica aparte. Retiradas incluye retiradas y reingresadas; no existe otro filtro Cerradas.

Administración: Nueva obra → completa cliente, dirección, localidad y fechas → Guardar obra. El teléfono es opcional pero necesario para abrir WhatsApp. Abre una tarjeta para editar datos, preparar carga, registrar ubicación, fotos, observaciones y operaciones.

## Carga y entrega

En Preparar carga selecciona el material y su medida maestra, usa +/− o toca la cifra para escribir. El apodo describe esa carga. Un combo se revisa antes de guardar y fusiona cantidades por material, sin duplicar líneas. Una medida diferente requiere seleccionar o crear la variante correcta en Galpón.

Guardar una carga insuficiente no inventa stock. Al entregar, Administración debe declarar una obra de origen con saldo disponible y motivo para cubrir la diferencia. Operación no puede autorizar esa procedencia. Elige responsables y confirma entrega: recién entonces el material sale del galpón o del origen autorizado.

## Retiro, daños y faltantes

Retirar → responsables → inspección → Confirmar operación. Añade cantidades dañadas o perdidas antes de confirmar; el resto vuelve al galpón. No registres otra vez un faltante ya informado. En obra activa también puedes informar faltantes por separado.

Un ítem fuera del inventario requiere nombre específico. Se audita y queda aviso pendiente; no mueve stock ficticio. Un faltante vinculado permite recuperación al galpón; Administración puede corregir su destino con motivo. El saldo real distingue lo que permanece físicamente en obra de la carga histórica.

Reingresar cierra la revisión sin sumar material otra vez. Reactivar devuelve la tarjeta a pendiente: revisar fechas y carga antes de volver a entregar. Transferir mueve piezas directamente a otra obra, con destino, cantidad, responsables y motivo.

## Galpón y combos

Consulta disponible, alquilado, taller y perdido. Administración puede crear variantes, editar datos permitidos y ajustar existencias con procedencia y motivo. Revisa la confirmación antes de aceptar. Mover stock opera sobre piezas no reservadas por un faltante vinculado; esas se recuperan desde la obra correspondiente.

Combos permite crear, editar y eliminar con confirmación. Un combo no reserva stock por sí solo.

## Viaje y comunicación

Viaje muestra la lista por zona. Ordenar por GPS solicita permiso solo al usarlo. Obras sin coordenadas no reciben una distancia inventada; abre el buscador de mapas con su dirección. La ubicación de una obra se registra desde el detalle y solo debe usarse GPS si estás allí. La aplicación abre navegación externa, no calcula rutas viales propias.

Remito abre WhatsApp con texto preparado. Revisa destinatario y contenido: el envío lo haces tú.

## Fotos y documentos

Tomar foto o Elegir foto solicita permiso. Las imágenes se reducen a 1024 px y JPEG 0.7. La demo guarda archivos locales; borrar los datos del navegador/app sin copia los pierde. En Firebase las fotos quedan pendientes hasta confirmar subida y registro.

Administración puede exportar Excel por filtros y Word de una obra. En web se descarga el archivo. El flujo nativo de compartir está implementado y requiere validación física. No hay PDF automático ni firma digital: Word incluye espacio formal para aclaración y firma.

## Historial y errores

Filtra por texto, obra, usuario y fecha. Deshacer solo está disponible para el autor durante cinco minutos y si no hubo movimientos posteriores que invaliden la reversión. Si no es seguro, usa una corrección auditada con motivo. Nunca borres evidencia para corregir stock.

Guardado local no significa sincronizado. Un conflicto bloquea nuevos cambios y conserva la operación tras cerrar. Reintenta cuando corresponda; descartar un rechazo requiere confirmación y conserva evidencia local. Un envío incierto no puede descartarse como si hubiera fallado.

## Copias y recuperación

1. Administración → Configuración → Descargar copia.
2. Guarda el JSON en un lugar privado fuera del navegador/app. Contiene datos e imágenes, no contraseñas.
3. Para restaurar una demo: Elegir copia → Restaurar copia → revisa la advertencia → Confirmar.
4. La app valida la copia y archiva el sobre anterior localmente antes de reemplazarlo.
5. Comprueba obras, cantidades y fotos después de restaurar.

Si la persistencia está dañada, conserva el archivo original mediante el control de recuperación. No borres almacenamiento ni reinstales para “solucionarlo” antes de obtener una copia. Si aparece falta de espacio, libera espacio ajeno a los datos de la app y reintenta; no se confirma una escritura que no pudo guardarse.

## Abrir desde Android

Este código y sus ZIP se pueden descargar desde el chat sin dejar una PC encendida. Un ZIP fuente no es una app instalable y localhost del entorno remoto no es una URL para el celular. Para uso directo se necesita un APK comprobado o una URL HTTPS de una publicación autorizada. Consulta INFORME_ENTREGA para el resultado real de compilación, sin asumir que hay una URL pública.
