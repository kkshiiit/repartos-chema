# Fecha y avisos de retiro · edición individual 1.6

## Uso

En alta/edición, **Alquilado hasta** abre calendario (escritura alternativa disponible). Es `fechaRetiroEstimada`, fecha prevista de devolución del alquiler. El proyecto no tiene un fin comercial distinto del retiro planificado; no se inventó otro campo. Entrega planificada/efectiva y retiro efectivo siguen separados.

Las filas y el detalle calculan «Retirar en N días», «Retirar mañana», «Retirar hoy» o «Retiro vencido hace N días» por fechas civiles de America/Argentina/Buenos_Aires. No se guarda el contador. Se refresca al cambiar el día, reanudar o editar. Retirado/reingresado muestra estado final. Sin fecha válida no se programa y se muestra «Sin fecha de retiro» para completar desde Editar.

Ajustes → **Avisos de retiro**: inicialmente apagado, 08:00 visible/editable y 3/2/1/0 días seleccionados. Activar solicita permiso. Cada alquiler nuevo hereda el ajuste general sin copiarlo. Cambiar hora/días generales reprograma los heredados. En el alquiler → Recordatorios se puede personalizar y volver a la configuración general. La personalización permanece independiente.

Si se deniega permiso se guarda la intención, no se bloquea el alquiler y se explica que NO hay avisos activos. Conceder permiso en Ajustes Android y Reintentar reconcilia los futuros. «Programado» significa que el sistema aceptó la solicitud, no que el usuario la recibió puntualmente. Pendiente o cancelación pendiente nunca se presentan como éxito.

## Persistencia y seguridad

Se amplía el mismo ReminderService/AsyncStorage `chema:local-feedback:v1`: representación v2 con políticas generales y por alquiler, e intenciones. La clave existente se conserva. La lectura migra v1 en memoria sin sobreescribir; el próximo guardado correcto conserva preferencias y el aviso manual anterior como legacy protegido. No se agrega simultáneamente la serie automática. Elegir General/Personalizado cancela primero el manual; si falla, bloquea la nueva serie de ese alquiler hasta reintentar.

IDs de OS: `chema-local-reminder:<id>:d<offset>`; manual histórico conserva su identificador. Se persiste intención antes de programar/cancelar. Cancelación fallida, programación parcial y fallo al confirmar guardado son recuperables con IDs estables. Cada anticipación es independiente. Sólo se programan instantes todavía futuros; los pasados no se disparan juntos. Cambiar fecha cancela/recalcula. Finalizar retiro/reingreso cancela pendientes; eliminar también. El dominio actual RETIRE retira todo el saldo restante, no ofrece retiro parcial. REPORT/TRANSFER pueden dejar saldo y estado ENTREGADO: no se dan por finalizados automáticamente y conservan la política. Reactivar aplica la fecha vigente y sólo avisos futuros.

Tocar un aviso abre su alquiler tras esperar sesión local, inventario y navegación; respuestas duplicadas se deduplican y se confirma lectura al OS después de navegar. Una respuesta no modifica el stock ni ejecuta retiros. El inventario, SQLite, fotos y JSON comercial no almacenan el número de días ni dependen de permisos de avisos. Las preferencias de notificaciones son locales del dispositivo y no forman parte del JSON comercial existente.

## Límites de Android y plataformas

Sin servidor, Internet, facturación ni push. Expo Notifications Android declara RECEIVE_BOOT_COMPLETED y reprograma solicitudes guardadas al arrancar (código SDK instalado revisado). Android12+ sin autorización de alarmas exactas usa setAndAllowWhileIdle; con autorización del sistema puede usar exactas. No se solicitó un permiso sensible adicional de alarmas exactas. Ahorro de batería, force-stop, ajustes del fabricante, DND y permisos/canales pueden retrasar o impedir el aviso. 08:00 es horario solicitado en Argentina, nunca promesa de puntualidad exacta. Abrir la app reconcilia con el OS y reintenta lo futuro.

La versión web permite gestionar preferencias pero no programa notificaciones nativas. No se simulan notificaciones enviadas. El selector nativo 9.1.0 coincide con bundledNativeModules de Expo57; no se actualizaron Expo/RN/Reanimated. Esta entrega necesita Gradle nuevo con el mismo certificado.

## Verificación en curso

Pruebas automatizadas de calendario, hook de medianoche/reanudación, políticas, cancelaciones, permisos denegados, reintentos, migración manual, adaptador y navegación con mocks. Check inicial completo:414/414 pruebas, TypeScript, ESLint y build Functions pasan tras corregir dos infracciones de lint (efecto de navegación y Probe de test). Functions sólo se compila, no se despliega. Recorridos/capturas web y APK nuevo pendientes al escribir este bloque.

No hay dispositivo Android conectado: cierre/reapertura, reinicio real, permiso real, apertura desde notificación y precisión temporal deben validarse físicamente. Los mocks y el navegador no acreditan esas pruebas.

## Prueba física recomendada (sin borrar datos)

1. Exportar JSON antes de actualizar y guardarlo fuera de la app. Instalar encima, sin desinstalar ni borrar almacenamiento; verificar inventario/fotos/historial.
2. Crear un alquiler sintético con devolución mañana. Confirmar contador y abrir calendario. Cambiar tema sin perder borrador. Editar/extender fecha y comprobar contador.
3. En Avisos de retiro, elegir hora unos minutos futura, mantener los avisos necesarios y activar permiso. Ver estado Programado por solicitud; si se deniega, el alquiler persiste y el estado avisa que no están activos.
4. Cerrar normalmente y esperar. Tocar notificación con app abierta, en segundo plano y cerrada: debe abrir el alquiler. Comprobar que no cambió stock.
5. Cambiar hora general; personalizar otro alquiler y verificar que se conserva su hora. Volver a General. Extender/acortar/retirar: avisos viejos se cancelan, sin duplicados ni disparar pasados.
6. Reiniciar teléfono con un aviso futuro; esperar y registrar resultado/versiónAndroid/ajustes de batería. Forzar detención es distinto de cerrar y puede impedir avisos hasta reabrir. No eliminar datos para probar.

## Compatibilidad de registros antiguos

La lectura del almacenamiento existente permite `fechaRetiroEstimada` ausente, `null` o texto inválido. No reescribe ni normaliza el original: la UI muestra Sin fecha de retiro y permite Editar. Ningún otro campo de stock/ID/cantidad pierde validación. Crear/editar nuevos alquileres e importar estados activos siguen exigiendo fecha válida. Los snapshots inversos históricos conservan el dato original para auditoría; así el JSON de un alquiler ya reparado sigue siendo exportable/restaurable. Deshacer hacia un dato sin fecha puede rechazarse de forma segura por las reglas vigentes; no se finge reversión ni se modifica stock para forzarla. Se documenta completar fecha antes de operar en esos alquileres.

Treinta regresiones comprueban lectura sin escritura, reparación auditada y reapertura, cantidades/saldos, importación estricta y ciclo real backup→inspección→restauración del estado reparado. No se cambia el esquema SQLite ni el flujo de migración AsyncStorage→SQLite.
