# Continuidad del rediseño 1.1

Solicitud vigente del15/10: UI más clara y espaciosa, logo real, sin lemas ni badgeAD, bienvenida, Alquileres/Depósito, Alquilados/A reparar, un control de tema principal sin repetir en ventanas, regreso al depósito y prioridad de retiros. Nombre + invitación al equipo, con bajas. Usuario autorizó ejecución y respaldo privado kkshiiit/repartos-chema.

Base previa c27ad9f, respaldada en ZIP y remoto. Se conservan claves de inventario y tema. Campos técnicos y roles internos permanecen compatibles; toda persona invitada al equipo comparte permisos operativos; propietario interno gestiona accesos. El nombre solo no autentica producción.

Trabajo implementado: navegación y estilos, logo original PNG transparente, WelcomeProvider persistente, nuevo Login por nombre, TeamSettings y servicios, backend invitaciones, reglas de revocación, receptor de entrega/remitos, depósito fijo y rutas por prioridad. Ver REDISENO_1_1.md y FIREBASE.md.

Depósito del enlace usuario: Formosa y Cuba, Villa Ballester; pin -34.5530245,-58.5685218. Ajuste local separado del inventario. No usar el centro de cámara del mapa. Logo coincide con adjunto, archivo assets/brand/grupo-chema.png.

Última ejecución:
- Check:87 pruebas unitarias aprobadas, typecheck/lint y Functionsbuild sin errores; dos warnings lint no bloqueantes.
- Emuladores Firestore/Storage:18/18 aprobadas, incluidos join, consumo único, expiración, revocación y reglas de fotos. No Firebase real/Auth público.
- Primer UI21:16pasaron,5fallaron: selectores de nombres previos/ambigüedad, y última pantalla coincidió con regeneración de dist (No encontrado). Se corrigieron selectores. Suite final21/21 aprobada en5,5min, log /workspace/informes/rediseno-ui-final.log, sesión80730 terminó código0. No repetir buildweb mientras UI está corriendo.
- Web exportada correctamente; al corregir recarga del depósito mediante useFocusEffect se inició exportación final nueva, log /workspace/informes/rediseno-web-cierre.log sesión41205. Prueba específica nueva tests/ui/trip.spec.ts pendiente tras esa exportación. Preview8081, sesión76683.
- APK1.1.0/versionCode2 en curso: /workspace/informes/rediseno-android.log, sesión7859. JDK21, SDK36, ARM64. No declarar nuevoAPK hasta final/apksigner/hashes/certificado compatible.

Próximo paso: terminar UI, inspeccionar capturas390/1440 clarooscuro y corregir fallos reales; terminar buildAPK; verificar firma v2, versión2, permisos y certificado igual a demo1.0 para actualizar sin borrar datos. Luego documentar resultados reales, commit y ZIP recuperable, pushmain. Subir APK nuevo a rama descargas en android/v1.1.0-demo.1 con SHA256, conservar el anterior, actualizar README enlaces y verificar clonación/hash remotos. Releases uploads401; la rama de descarga sí funciona.

Git local contiene cambios de esta implementación aún sin commit al escribir este documento. No reiniciar la app desde cero ni restaurar la semilla al actualizar. Directorio viejo de publicación /workspace/entregas/apk-github-20261015 contiene rama descargas, no mezclar su historial conmain.

Pendientes externos: Firebase real y despliegue autorizado (puede exigir facturación), invitaciones entre teléfonos y recuperación propietario, prueba física APK1.1/GPS/cámara/documentos. FCM nativo aún pendiente. No gastos ni producción activada. MotionSites no está conectado a este entorno ni configura MCP local; no afirmar uso. No hay trabajo automático verificado entre ejecuciones.
