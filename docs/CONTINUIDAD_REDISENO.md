# Estado vigente — rediseño1.1 entregado,15/10/2026

## Objetivo cumplido y alcance

Interfaz renovada según capturas reales: logo original, sin lemas/AD ni selector de roles, ingreso por nombre, bienvenida persistente, Alquileres/Depósito/Viaje/Historial, piezas sin comprimir, A reparar/Alquilados, un control de tema principal, regreso al depósito y retiros prioritarios. Se registra quién recibió. Firebase de equipo preparado y probado en emuladores, no conectado a producción; demo permanece local.

## Datos confirmados

Depósito indicado por usuario: Formosa y Cuba, Villa Ballester. Pin real -34.5530245,-58.5685218 desde su enlace maps.app.goo.gl/ZVFoghjHrGDunK4v5; no centro de cámara. Logo PNG original transparente coincide con adjunto, assets/brand/grupo-chema.png. Claves de inventario y tema conservadas, sin migración destructiva.

## Código y paquetes

Basec27ad9f. Implementación d7f1665 ya subió a main; ver git log para commit posterior del parser/documentación. GitHub kkshiiit/repartos-chema privado. Rama descargas ce93ad5: APK definitivo en android/v1.1.0-demo.2/repartos-chema-demo-arm64.apk. Mantener versiones anteriores. No fusionar historial de descargas conmain.

APK final /workspace/entregas/Repartos-Chema-1.1-final/repartos-chema-demo-arm64.apk,49.474.956 bytes, SHA2564dec382aa887c0e20a9bfead6f12d503400065a4e911cd8a714c9803aa8a13d9. versionName 1.1.0/versionCode 2, Android 7+,ARM64. Firma v2/CRC verificados y mismo certificado que1.0, permite actualización sin desinstalar; todavía no probado físicamente. Candidato anterior demo.1 conserva el parser web; usar demo.2.

## Verificación actual

- npm run check final:88/88, tipos/lint sin errores, Functions build correcto. Un warningimport axe.
- Emuladores18/18, incluidos invitación un uso/vencimiento/revocación y reglas, contextoAuth controlado.
- SuiteUI21/21 (5,5min), prueba adicional depósito1/1, luego revalidación de los3recorridos afectados por corrección nativa3/3 (10,9s).22 recorridos únicos; no inventar ejecución física.
- Primera compilación Android14 min 2 s; corrección incremental2 min 23 s, ambas código0. Webfinalexportcorrecto.
- Revisión visual de inicio oscuro, depósito claro, alquileres oscuro y viaje claro.48 capturas principales +bienvenida, más matriz320/360/768sin recortes.
- assets/validacion NO: los resultados están en artifacts/validacion/rediseno-*. La revisión de API nativa URL encontró riesgo para enlaces propios; prueba falló antes del cambio y pasó con parser cerrado independiente.
- APK definitivo recuperado desde GitHub en un repositorio independiente: SHA256 y CRC coinciden,49.474.956 bytes. Evidencia rediseno-github.json. No se probó descarga en navegador Android ni instalación física.

## Próxima acción exacta

Cierre completado: fuente y corrección nativa en main89abc6c, APK definitivo y respaldos en descargas6b7f587. ZIP fuente repartos-chema-89abc6c.zip (208 archivos) y web1.1 restaurados y comprobados, también recuperados desde GitHub con CRC/SHA iguales. La siguiente acción es probar la actualización con el usuario y continuar la configuración Firebase pendiente según su respuesta. No volver a compilar ni rediseñar esta versión sin un fallo concreto o un cambio nuevo.

Usuario recibió pregunta sobre si existe proyecto Firebase y su ID. No configurar proyectos/facturación ni desplegar sin los datos/autorización correspondientes. No pedir contraseñas/tokens por chat.

## Pendientes reales

- Configuración Firebase real: Auth anónimo, primer propietario desde bootstrapadministrativo, Functions/reglas/Storage. Implica revisar facturación/autorización, no realizada.
- Equipo productivo entre teléfonos, prueba de tokens/enlaces/instalación física, revocación online/offline y recuperación del propietario si pierde dispositivo. Nombre no autentica personas; invitación autoriza dispositivos, datos offline conocidos no se borran remotamente.
- FCM nativo y pruebas de cámara/GPS/documentos nativos siguen pendientes externos.
- Avisos transitivos npm previos; no se cambiaron dependencias ni se hizo auditforce.
- MotionSites no conectado en herramientas ni configuración local. No se utilizó; no se creó Figma externo. No hay automatización real de reanudación.

## Comandos para continuar

npm run check; npm run build:web; npm run preview; npm run test:ui -- --workers=2. Integración: seguir docs/VALIDACION.md con emuladoresdemo. Para APK JDK21 y SDK36 en workspace, scriptbuild:android:demo regenera proyecto; para cambios solo JS usar Gradle assembleRelease incremental sin prebuild para conservar cachés, mismas variables de entorno demo y proxy/TLS documentadas. Nunca cambiar HOME ni desactivar TLS.

Respaldos originales intactos en /workspace/respaldos y puntos-control. scripts/package.py y package-web.py no sobrescriben y comprueban restauración. Leer docs/ENTREGA_1_1.md para estado completo y capturas.
