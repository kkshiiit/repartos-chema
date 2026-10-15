# Conectar el equipo desde Android

Estado comprobado el 15/10/2026: el usuario confirmó que **no tiene un proyecto Firebase**. La demo 1.1 funciona localmente; distintos teléfonos todavía no comparten alquileres. No se creó un proyecto, no se activó facturación y no se desplegaron servicios.

## Primer paso desde el celular, sin tarjeta ni PC

1. Abrir [Firebase Console](https://console.firebase.google.com/) con la cuenta Google que deba ser propietaria de los datos de Grupo Chema. No compartir esa contraseña con el equipo ni con el asistente.
2. Elegir crear un proyecto, con nombre **Repartos Chema**. Revisar el identificador que propone Google: debe ser único y no debe inventarse en la configuración antes de crearlo. Si aparece una opción de Google Analytics, puede dejarse desactivada; no es necesaria para los alquileres.
3. Mantener el plan gratuito **Spark**. No asociar tarjeta/cuenta de facturación ni activar Blaze en este paso. Si la consola exige facturación para una operación adicional, detener esa operación.
4. En Configuración del proyecto → General, copiar únicamente el **ID del proyecto** y enviarlo en el chat. Ese ID no es una contraseña ni otorga permisos administrativos.

Crear el proyecto gratuito no conecta por sí solo la aplicación ni autoriza a Codex a administrarlo. La autorización Google debe hacerse por un flujo oficial disponible y comprobado. No enviar códigos de autorización, tokens, contraseñas ni archivos de cuentas de servicio al chat.

## Qué requiere una decisión aparte

El backend implementado usa Cloud Functions para aplicar movimientos e invitaciones de forma transaccional y proteger el inventario. No basta con habilitar Firestore: las reglas prohíben escrituras directas desde el cliente. No deben relajarse para evitar configurar el servidor.

La documentación oficial consultada el 15/10/2026 exige el plan **Blaze**, vinculado a una cuenta Cloud Billing, para Cloud Functions y Cloud Storage. Las cuotas sin cargo no garantizan una factura de cero; las alertas de presupuesto no equivalen a un límite que detenga todos los gastos.

Antes de conectar teléfonos reales se requiere autorización específica para vincular facturación y desplegar. No está concedida por la respuesta «no tengo». No se cambió de proveedor ni se rediseñó el backend para eludir este requisito.

Referencias oficiales:

- [Planes de precios Firebase](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans).
- [Requisitos de Cloud Functions](https://firebase.google.com/docs/functions/faq-and-troubleshooting).
- [Requisitos de facturación de Cloud Storage](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024).

## Acceso comprobado en esta sesión

- El catálogo de complementos confirmó Firebase instalado y habilitado.
- No se expusieron herramientas MCP Firebase en el catálogo invocable de esta sesión; tener sus skills no demuestra acceso a una cuenta Google.
- Firebase CLI local 15.33.0 disponible. `login:list`, usando el directorio temporal de configuración, devolvió **No authorized accounts**.
- El entorno cloud no declara identidades de salida ni secretos configurados. No se leyeron valores de credenciales ni se inició un flujo de autenticación para pegarlos en el chat.
- GitHub privado ya funciona y conserva código/APK. Eso no autoriza acceso a Google Cloud.

## Trabajo posterior con proyecto y permisos reales

Seguir [FIREBASE.md](FIREBASE.md), especialmente «Acceso del equipo por invitación (versión 1.1)». El ingreso vigente es por nombre más invitación y una identidad Firebase Auth anónima por dispositivo, no una contraseña compartida ni un selector público de roles.

1. Verificar el proyecto exacto y la cuenta propietaria; resolver autorización Google oficial sin exponer secretos.
2. Definir región y condiciones de facturación antes de crear bases, buckets o desplegar. No activar servicios cobrables sin autorización.
3. Habilitar Auth anónimo, registrar la configuración pública real del SDK JS y mantener secretos administrativos fuera del repositorio/bundle.
4. Desplegar backend y reglas solo con autorización. Inicializar el propietario mediante el bootstrap administrativo sobre un UID existente; no habilitar apropiación abierta del equipo.
5. Preparar una versión conectada. El APK 1.1 entregado está compilado en modo demo: crear un proyecto no cambia ese APK automáticamente.
6. Probar invitación de un uso, datos compartidos en dos teléfonos, concurrencia, cierre sin conexión, reintentos, revocación y recuperación del propietario. No marcar sincronización verificada antes de esta prueba.
7. Antes de cambiar de demo a producción, guardar el JSON local. El servidor se inicializa vacío; no se migran automáticamente ejemplos ni datos comerciales. Cualquier importación real requiere validación, respaldo y un procedimiento separado.

Mientras tanto, puede probarse la interfaz y los movimientos en la demo. Conservar copias JSON y no usar varios teléfonos demo como si fueran un inventario común.
