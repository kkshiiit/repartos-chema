# Auditoría de cierre maestro — en ejecución, 27/10/2026

Contrato: ESPECIFICACION_MAESTRA_CHEMA A1–M5; autorización íntegra ENCARGO_ETAPA_3_CHEMA. Rama feat/chema-maestro-etapa2; fuente auditada1a9355a, documentos cdeaf79, correcciones posteriores identificadas porGit. APKprevio1.6.1 no contiene estas correcciones. Candidata fuente1.7.0/code11, aún sinAPK.

## Dictamen provisional

Implementación: listo con pendientes de cierre. Pruebas automatizadas:519/519 en58archivos, tipos/Functions0errores; lint0errores/1warningAxe. Integración remota nuevaAuth8/8; resto en curso. AceptaciónAndroid: NOEJECUTADO, sin dispositivo. Operación compartida: pendienteQAfinal/acceso inicial. PublicaciónAPK: pendiente. No se declara producto terminado.

## Hallazgos corregidos

|ID|Severidad/requisitos|Reproducción/esperado/causa|Corrección/evidencia|
|---|---|---|---|
|CIERRE01|Alta J9/J13|Montarprovider, revalidarmismauid, guardarresponsables: pantalla seguía convalorprevio aunque repositorioescribía. Suscripción sólo se creaba al construirrepo ycleanup laquitaba.|Efecto administra cada listener, aunrepo existente; key deproviderseparauid/espacio/rol. tests/shared-provider-recovery.test.ts RED→GREEN.|
|CIERRE02|Alta J8/J13|Rechazo inicial+dosPENDING: syncse detenía ydescartar negaba dependientes, sinsalida. Esperado conservar yrevisar, sin reenvíosautomáticos.|Archivo/index/cola/proyección enunaatomicSet; sólo dependientesPENDING attempts0sinuncertain. UIconsulta/exportapropuestaspropias. SQLiteprueba rollback/reapertura/aislamiento/noextraenvíos.|
|CIERRE03|Alta F2/J7|Leerhistoria1–200, recibirhasta500, cargarmás: faltaba201–400 porque cursormínglobal saltabaa1.|Reiniciarfrontera depaginaciónsi hay intervalo nuevo sinleer; no borrar páginasviejas. Testprovee500eventos ycompruebahistory350trasrefresh. RED→GREEN.|

Logs en evidencias-etapa3. Tipos ytests no equivalen a teléfono. Revisión independiente anteriorse interrumpióporlímite: no se declara aprobación completa deeseagente.

## Fallos de ejecución y límites

Recuperado check-final-pre-apk anterior515/515 ybuildwebfinal0; son anteriores a los fixesdeestaetapa. Ruta-remota-real anteriorFALLÓ por timeoutCONNECT antesdevalidar409: repetir deformaacotada yconservarfallo. QAprivadoanterior/tmp no sobrevivió entorno; nuevacredencialsintética fueraGit persistida en/workspace/privados-chema. Noexponer tokens ni keystore.

Pendientes: regresiónUI/visual completa, media/ruta remota actuales, backendFreefuentesoficiales/recuperación/salida, matriz94veredictos finales, ZIP/firma/Gradle/APK/descargas/recuperaciónbytes. FaltanAndroidfísico,APK exactollamado2.0yJSONexacto5pedidos; no sustituirlos porfixture.

## CIERRE04 — conflicto remoto convertido en reintentos de infraestructura

La prueba real de dos publicaciones sobre la misma revisión fallaba por timeout20s antes de recibir409. Los logs de PostgreSQL mostraron12ROUTE_CHANGED repetidos para el mismo conflicto; SQL usaba40001 (fallo de serialización/reintentable) para una revisión comercial definitivamente obsoleta. Nueva migración `20261027201000_chema_terminal_conflicts.sql` conserva funciones/ACL y cambia esos rechazos a P0001, dejando la funciónEdge traducirlos a409. No cambia stock ni elimina controles de revisión. Repetición real:4/4Auth/SQL rutas, versiones, revocación y reincorporación; PostgreSQL local14/14. El intento fallido se conserva separado. No se amplió el timeout ni se aceptó UNCERTAIN como prueba de conflicto correcto.

Revisión visual en curso encontró desborde3px en vacío Historial a320CSSpx/texto200%; se acota ancho de textos y etiquetas de pestañas sin achicar fuente. El selector viejo Confirmarimportación se actualiza al texto real Restaurarestacopia con igual función/comprobación; no se cambia requisito para aprobar.

La primera regresiónUI detectó también referencias antiguas a Confirmarimportación (renombrado a Restaurarestacopia) y posición341px de la primera fila frente al umbral340 de la comparación. Se conservan las mismas aserciones funcionales y el umbral: agrupación temporal más compacta y segmentados pasan de44a48dealtura mínima. No se reduce fuente para ocultar eldesborde ni se relajan controles de stock.
