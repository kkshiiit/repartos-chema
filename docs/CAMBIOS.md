# Registro de cambios

## Base recuperable

`5c554c4`: fuente original inspeccionada y preservada. Respaldo original con SHA-256 y restauración comprobada, sin dependencias regenerables ni secretos. Git local main, sin remoto.

## Integridad

`d258544`: validación persistida, recuperación de conflicto, fallos de almacenamiento, stock no vinculado en taller/perdido, correcciones de faltantes, variantes/medidas, fechas planificadas/efectivas, revisión optimista en edición, auditoría con nombres históricos.

## Temas, fotos y publicidad

`c634908`: elimina dependencia/plugin/contextos/componentes/configuración de publicidad; implementa tokens claro/oscuro y sistema, cambio rápido, preferencia aislada, componentes dinámicos, compactación móvil; fotos web IndexedDB; copia/restauración; documentos diferidos y generador nativo; traducción de errores y mejoras de servidor. No altera datos comerciales para retirar publicidad.

## Recuperación y validación

`1436419`: faltantes libres sin inventar stock, restauración de referencias de imagen, dependencia directa buffer, pruebas de copia y backend concurrente, pruebas UI de recuperación, script de paquete con restauración verificada, punto de continuidad actualizado.

## Cierre de ejecución 14/10

Historial incorpora obras/usuarios de registros antiguos y deja de refrescarse en pestañas inactivas; deshacer marca la auditoría remota original; comprobación de cabecera JPEG; envío FCM parcial conserva destinatarios aceptados, quita tokens inválidos y usa texto sin cliente en la pantalla bloqueada (FCM real pendiente). Nuevas pruebas de transferencia/daño/recuperación, documentos en Storage Emulator y fotos. Documentación/manual/validación/entrega y regeneración de builds y capturas.

Para diferencias exactas: `git diff 5c554c4..HEAD --stat`, `git log --oneline` y `git show COMMIT`. Los archivos generados y capturas pueden cambiar entre pruebas por fechas dinámicas de la demo.
