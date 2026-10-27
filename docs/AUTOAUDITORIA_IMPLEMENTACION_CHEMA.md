# Autoauditoría de implementación — corte activo 27/10/2026

No es una nueva auditoría de partida. Complementa AUDITORIA_BASE_CHEMA y EJECUCION_MAESTRA_CHEMA con defectos efectivamente encontrados durante etapa2. Los estados pendientes continúan abiertos hasta evidencia final.

|Severidad|Hallazgo, reproducción y causa|Corrección y evidencia|Estado|
|---|---|---|---|
|Crítica|Dos teléfonos registran misma devolución con UUID distintos; dos entregas piden última unidad|Tarea comercial estable, motorautoridad común, CASbajo lock y recibos. PostgreSQL+SQLite11 y Authremoto8 casos; doble aplicación rechazada|Comprobado integración; Android2dispositivos pendiente|
|Alta|Cambio de cuenta durante refresh podía enviar colaA conJWTB o revivir una sesión cerrada|expectedUserId cliente/servidor, generación/singleflight/vaultserializado; testsAuth RED→GREEN y servidor/SQL|Corregido, pruebas automatizadas|
|Alta|RPCvoid PostgREST devuelve204 y cliente intentabaJSON, bloqueando incorporación real|Aceptar204null sin debilitarautorización; shared-http y remoteAuth8/8|Corregido y desplegadoEdgev2|
|Alta|Cambio de espacio con cancelaciónOS fallida perdía el intento|Diario durable antes de cancelar, serialización por storage y drenaje al abrir/reconciliar; RED→GREEN2espacios/reinicio|Automatizado; OSreal pendiente|
|Alta|Renovación401 sinstatus se confundía con errorred; no bloqueaba outbox|ErrorSESSION_CHANGED con401, gate oculta cache/cola conservada, rutaValidarAcceso; RED→GREEN|Automatizado; revocaciónserverreal probada|
|Alta|Viaje reconciliabaIDs con inventario inicial sin hidratar, borrando orden al recargar|Guardia inventoryReady, pruebaUI sigue fallando tras corregir selectorDOM y pasa tras fix+buildestable|Corregido, UIlocal7/7|
|Alta|Referenciafoto local no es portable y subida no existía|LogicalID, queueindependiente, JPEG/hash, ACL privada, namespaceusuario/espacio;5/5Storage real sintético|Implementado y verificado remoto; nativo pendiente|
|Alta|Caché nativa creaba archivo vacío si escritura fallaba, impedía reintentar sin pisaroriginal|Archivo provisional verificado y publicación posterior; pruebaRED obtieneUint8Arrayvacío, GREEN permite recuperar|Corregido con filesystemmock; físico pendiente|
|Alta|Restauración compartida podría reemplazar datos ajenos/reproducir outbox|Restaurar en namespaceindividualnuevo, originales sinmutar, testsaislamiento2casos|Implementado/automatizado|
|Media|Dirección depósito se muestra dosveces y testgetByText era ambiguo|Acotar al panelOpciones, sin eliminar informaciónútil; UI7/7|Corregido selector, no defecto dedatos|
|Media|Buildweb duranteedición media importaba archivo aún no creado|Guardar intento fallido, esperar fuenteestable y recompilar0|Resuelto como incidencia deejecución|
|Media|Primer testgate .tsx no coincide include.test.ts|Convertir testcreateElement.ts; guardar intentoNofiles y REDreal separado|Resuelto, no se contó como prueba pasada|
|Media|Npmchecklegacy importabaFlashList nativo con sintaxisFlow enVitestNode|Mock sólofronteraUI, preservar8asercionesfechas/exportaciones y fixturescompletas|Resuelto en493general previo|
|Media|Plan de ruta puede sufrir conflicto de edición y perder asignaciones personales|CAS+versionado/historia enSQL y borradorlocal porusuario; revisión de panel en curso|Pendiente cierre integrado|
|Media|Auth por invitación no verifica propiedadcorreo ni ofreceSMTPconfigurado|UIloexplica; primerresponsable y recuperaciónoperativa requieren canalprivado/verificaciónmanual. Nopresentarcorreo comorealverificado|Limitaciónoperativa documentada|
|Media|Snapshots agregados y todoelcatálogo viajan en refresco; históriaseparadopaginado|Refrescoactivo30s/dedupe, logsseparados; no migraciónriesgosaportiminghipotético|Riesgo decapacidad, sin métricasfísicas|
|Media|Objetosfotoborrados lógicamente se retienen, no hayGC|PreservaUndo/copias yevita eliminaciónirreversible; supervisar cuotaFree/exportar anteslimpieza autorizada|Decisión conservadora; costo almacenamiento|
|Bloqueo prueba|APK instalado llamado2.0 yJSONexacto5pedidos no disponibles|No sustituirpor1.6.1/fixture sintética; documentar compatibilidadconocida y pedirinsumo cuando secertifique|Abierto insumoexterno|
|Bloqueo prueba|SinAndroidfísico/ADB/emulador validado|SepararChromium/Node/Postgres/AuthStorage remoto de nativo|Abierto; no seafirma aceptaciónfísica|

## Revisión y seguridad

Sin cambios al motor de stock por diseño. RETIRE es retiro completo del saldo restante después de incidentes; REENTER no suma por segunda vez. Deshacer conserva autor, cinco minutos y controlglobal de revisión; no se extendió silenciosamente. No equivalencias ficticiasde marcos/cuerpos. No Firebase/backend necesario enindividual; SDKlegacy aúnexisteenfuente, no afirmar eliminaciónfísicaSDK. No publicidad propia/AdMob ni cobros.

SQLRLS activado y RPCs sólo service_role. Edge usa Authreal antesde operaciones; excepción enroll exige tokenprivado64hex de unuso/48h y contraseña. verify_jwt=false deEdge no significa permisopúblico de datos; validación getUser y membresíaSQL son obligatorias. Faltacompletar recuperaciónoperativa delresponsable y estado producciónsólo tras pruebasfísicas/uso comercial.

## Decisiones durante ejecución

- Se conserva checkoutexclusivo enrama temática envezduplicarworkspace/SQLite. Riesgo: integraciónmanualextra; respaldos ymainseconservan.
- Copia compartida se abreaislada, no se fusiona ni se restaura sobre elservidor. Riesgo: correccionesdeequipo se registran expresamente.
- Cachébinaria ybinariosremotos borradoslógicamente seretienen para recuperación. Riesgo: cuotaFree requierevigilancia ylimpiezaautorizada, sin promesa infinita.
- La observacióninicial de flagsdelpanelruta alreabrir fue descartadaalcomprobarquese desmonta condicionalmente. La pérdida deasignaciones síexige corrección; no ocultarpropuestas.

Próximaacción: cerrarH4Broute y suitegeneral/UI, completar matriz ycompilación. Este documento se actualizará con resultados nuevos; no convertirpendientes enaprobadospor editartexto.
