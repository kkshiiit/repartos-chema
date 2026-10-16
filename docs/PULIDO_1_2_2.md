# Pulido local 1.2.2

## Integración con cambios nuevos de main

El primer push del pulido9174621 fue rechazado porque main había avanzado hasta31cd72d con mejoras JSON y APK1.2.1/code4. No se forzó ni descartó nada. Se integraron esos commits, conservando selector Android ampliado, validación/vista previa JSON, cancelación sin cambios y Deshacer última importación. El único conflicto fue el recorrido UI: mantiene el alta de responsable dentro de entrega y usa el nuevo diálogo de importación. Se corrigió el singular «1 alquiler guardado».

La entrega combinada es **1.2.2/code5**, para no reemplazar el instalador1.2.1 existente. Check actual completo108/108 con tipos/lint/Functions build correctos, y **4/4 recorridos web en15,5s**, incluido importar cinco registros, cancelar y deshacer la importación. Evidencia pulido-122-{check,web,ui}.txt. Las cifras95/3 inferiores corresponden al bloque previo a integrar main, no a la verificación final.

Siguiente acción: terminar commit de integración y subir main, verificar que el remoto coincide, generar respaldo ZIP y compilar ARM64. No compilar antes del push. Los certificados documentados de1.2.0 y1.2.1 coinciden; comparar archivos reales al cerrar el APK nuevo. No declarar pruebas físicas.

Base estable: main327c653 y APK1.2.0/code3, conservados. El usuario pidió seguir puliendo la app individual, sin nube, servicios pagos ni rediseño. No se modificaron cantidades, estados de negocio, claves de persistencia ni formato de copias JSON.

## Cambios acotados

1. Entrega/retiro/triangulación: permite agregar un responsable desde la operación, guardarlo con auditoría y seleccionarlo. Si ya existe con otras mayúsculas, se reutiliza su nombre; no se crea otra persona. En una instalación vacía explica qué agregar. La autorización ADMIN técnica sigue validada por el dominio, sin selector de roles público.
2. Documentos: Word ya no valida los filtros de fecha exclusivos del Excel. Selector «Alquiler» y descripción local sin sugerir una nube activa.
3. Archivos Android: respaldo y documentos comparten una rutina que genera rutas distintas por archivo y usa File.create(overwrite:false). Evita reutilizar la misma ruta de caché mientras otra aplicación puede estar leyéndola. No cambia nombres de descargas web ni borra archivos/datos anteriores. API contrastada contra tipos de expo-file-system instalado.
4. Faltantes en edición individual: mensaje describe el historial local y no promete envío posterior por FCM.

## Evidencia antes y después

- UI inicial roja: el botón Agregar responsable no existía y Word no descargaba con filtro Excel inválido. `artifacts/validacion/pulido-121-ui-red.txt`.
- Prueba de archivos con adaptador de filesystem nativo simulado: dos copias del mismo nombre y milisegundo dejaban un solo archivo. Roja en pulido-121-files-red.txt, verde en pulido-121-files-green.txt. No equivale a probar filesystem/Compartir Android físico.
- `npm run check`:95/95, typecheck/lint/Functions build correctos,0errores y1warning histórico AxeBuilder. Evidencia pulido-121-check.txt.
- Recorridos web locales3/3 en19,3s: alta inicial desde vacío con responsable agregado en entrega, stock/historial/deshacer/retiro/reingreso, JSON/restauración/recuperación/offline, Word independiente del Excel y temas/formulario. Cero solicitudes Firebase/Cloudflare en recorrido completo. Evidencia pulido-121-ui-green.txt.
- Exportación web correcta, pulido-121-web.txt. Después solo se aplicó formato y versión1.2.2/code5; no se cambiaron comportamientos después de la prueba.

## Próximo paso

Guardar y subir este bloque a main antes de compilar. Generar APK ARM64 1.2.2/code5, verificar firma/certificado/CRC/versión, publicar como archivo nuevo en descargas y recuperarlo desde GitHub para comprobar SHA. Conservar el APK1.2.0. No hay Android físico conectado: siguen pendientes instalación, permisos, cámara/GPS y Compartir reales.
