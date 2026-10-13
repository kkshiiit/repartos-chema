# Configurar Firebase para producción

No se ejecutó ningún despliegue ni se utilizaron credenciales reales. Este procedimiento lo realiza un administrador autorizado del proyecto.

## 1. Proyecto y aplicaciones

Crear/seleccionar un proyecto Firebase de Grupo Chema. Registrar una aplicación web para la configuración del SDK JS. Habilitar Authentication con correo/contraseña, Firestore y Storage. Usar plan que permita Cloud Functions/Cloud Scheduler y definir presupuesto/alertas apropiados a la empresa.

Copiar la configuración pública real a `.env`, usando los nombres de `.env.example`; establecer `EXPO_PUBLIC_DATA_MODE=firebase`. La región cliente debe coincidir con `setGlobalOptions` en `functions/src/index.ts` (actualmente `us-central1`). Reiniciar Expo al cambiar variables.

Para una app publicada, confirmar identificadores Android/iOS y propiedad del dominio; los identificadores de bundle del proyecto son una elección técnica modificable, no registro de una app publicada.

## 2. Reglas y backend

```bash
npm ci
npm --prefix functions ci
npm --prefix functions run build
npx firebase login
npx firebase use --add
npx firebase deploy --only firestore:rules,storage,functions
```

Seleccionar **tu proyecto real**; no reemplazar valores con URLs o tokens inventados. Las credenciales administrativas se obtienen por ADC/Firebase CLI o una identidad de despliegue autorizada. Nunca añadir archivos de cuentas de servicio al repositorio ni al bundle.

Las reglas bloquean toda escritura directa en inventario, auditoría, roles y documentos. Las operaciones se realizan mediante `applyMovement`. Storage consulta perfiles en Firestore; aceptar la habilitación de permisos entre servicios si Firebase la solicita al desplegar las reglas. Verificar de nuevo las reglas en el proyecto destino.

El backend tiene `applyMovement`, `exportDocument`, `registerPushToken`, `notifyAdmins`, `retryNotifications`, `cleanPhoto` y `cleanDocuments`. Node 22, transacciones, límites de volumen, 60 s por movimiento y 120 s por exportación. Los recibos idempotentes y la auditoría remota no se purgan automáticamente.

## 3. Usuarios y roles

Crear las cuentas reales por el procedimiento de la empresa. El nombre es el nombre de perfil, no una prueba de identidad. La app exige correo verificado además de correo/contraseña. Verificar el correo mediante el flujo autorizado de Firebase (por ejemplo una invitación con enlace de verificación generado por Admin SDK). No marcar correos arbitrarios como verificados para omitir la comprobación.

Con ADC del mismo proyecto y el UID real de una cuenta ya verificada:

```bash
npm --prefix functions run bootstrap -- UID_REAL ADMIN "Nombre de administración"
npm --prefix functions run bootstrap -- UID_REAL_OPERADOR OPERADOR "Nombre de operación"
```

El script verifica el usuario con Admin SDK, crea `users/{uid}` y crea inventario vacío solo si no existe. No inserta la semilla ficticia en producción. Repetir con el mismo UID actualiza el rol/perfil sin sustituir el inventario. La app nunca permite autoasignarse ADMIN.

## 4. Persistencia y prueba de sincronización

En web, IndexedDB + `persistentLocalCache` y gestor multitab. En móvil, caché Firestore en memoria + AsyncStorage propio para estado y cola. Auth nativo usa SecureStore y Auth web usa persistencia de navegador.

Antes de habilitar operaciones reales, probar con dos cuentas y dos dispositivos: entrega concurrente, cierre offline, reconexión, respuesta perdida, cambio de rol, falta de stock y corrección. Verificar que solo un movimiento se aplica y los rechazos quedan visibles. La compilación y los tests unitarios no demuestran sincronización real.

## 5. Storage y exportaciones

Las fotos son JPEG y se aceptan solo en `photos/{uid}/{obraId}/{photoId}` del autor. Los objetos no se sobrescriben; el servidor limpia los borrados autorizados. Las exportaciones se guardan en `exports/{uid}/...`, solo ADMIN propietario puede leerlas durante una hora y el trabajo programado las elimina. No se crea una URL pública por defecto.

Para descarga de documentos en web, configurar CORS del bucket para los dominios exactos de tu app. Ejemplo de archivo local a completar:

```json
[{"origin":["DOMINIO_HTTPS_REAL_DE_LA_APP"],"method":["GET","HEAD"],"responseHeader":["Content-Type"],"maxAgeSeconds":3600}]
```

Aplicarlo con Google Cloud CLI autenticado sobre tu bucket real. No usar `*` para documentos internos. Probar denegación a usuario ajeno, expiración y borrado. Word puede abrirse en Word/LibreOffice y exportarse a PDF; no se implementó un conversor PDF en servidor.

## 6. FCM web

En Firebase Cloud Messaging, configurar Web Push y copiar la **clave pública** VAPID a `EXPO_PUBLIC_FIREBASE_VAPID_KEY`. El comando `npm run build:web` genera el worker desde `src/workers/firebase-messaging-sw.ts` con la configuración pública del mismo `.env`.

Servir mediante HTTPS (localhost sirve para pruebas). En Configuración, un ADMIN pulsa **Activar avisos**, concede permiso y registra su token con `registerPushToken`. El worker de mensajería usa ámbito `/push/`; la caché offline usa otro worker en `/`.

Al registrar un faltante, la transacción crea un evento durable. El trigger consulta solo tokens de usuarios con rol ADMIN vigente y solicita el envío a FCM. Si no hay tokens/configuración, conserva error/PENDING/FAILED. El reintento programado intenta como máximo cinco veces. Un estado SENT significa aceptación por FCM, no lectura ni entrega confirmada al teléfono. La app usa eventId/tag para reducir duplicación; FCM no ofrece exactamente una entrega.

## 7. FCM nativo (integración pendiente del build)

El SDK Firebase JS usado por Expo no ofrece mensajería push nativa. Para iOS/Android productivos se necesita un development build y un puente nativo de mensajería compatible, por ejemplo `@react-native-firebase/app` + `@react-native-firebase/messaging`, con sus config plugins. No están activados en esta demo.

Pasos: verificar compatibilidad con Expo 57/RN 0.86; registrar aplicaciones reales; descargar `google-services.json`/`GoogleService-Info.plist` de tu proyecto; configurar plugins y builds; registrar APNs en Firebase para iOS; solicitar permiso solo al activar avisos; obtener/refrescar el token FCM y enviarlo a `registerPushToken`; manejar mensajes en primer plano y fondo y deduplicar por eventId. Incluir el handler de fondo antes de registrar la raíz. Usar el mismo proyecto que Auth/Functions. Probar en hardware real con app abierta, en segundo plano y cerrada.

La UI móvil explica este pendiente y no registra tokens Expo como si fueran FCM. Expo Go no valida este flujo.

## 8. Validación y operación

Las pruebas de reglas incluidas se ejecutan con emuladores, sin Firebase real. Falta validar callable functions/FCM/Storage con el proyecto elegido, IAM, CORS, despliegue y hardware. Configurar monitoreo de rechazos, errores de Functions y avisos fallidos. Antes de superar los límites del agregado, diseñar partición por material/obra y archivo auditado; no aumentar el límite de documento silenciosamente.
