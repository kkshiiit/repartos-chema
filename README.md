# Repartos Chema

Aplicación interna de Grupo Chema Construcciones, construida con Expo 57, React Native 0.86, React 19 y TypeScript 6. Incluye una demo persistente sin credenciales y una integración Firebase separada. **No está desplegada ni conectada a un proyecto de producción.**

## Ejecutar la demo

Requisitos: Node 22.13+ o Node 24.3+, npm. El entorno de trabajo usó Node 24.19. Para desplegar Functions se selecciona Node 22.

```bash
cd /workspace/repartos-chema
npm ci
cp .env.example .env
npm run web
```

Abrir la URL que indique Expo. Elegir **Administración** u **Operación**; son perfiles ficticios, no cuentas reales. Las fechas de la semilla se calculan al iniciar por primera vez. No se inventaron teléfonos, coordenadas ni credenciales.

Para móvil, instalar Expo Go compatible con SDK 57, ejecutar `npm start` y abrir el QR en la misma red. Si la tienda aún no ofrece esa versión de Expo Go, usar un development build compatible.

```bash
npm start
# Con Android SDK o Xcode configurados:
npx expo run:android
npx expo run:ios
```

Para probar la versión web exportada, incluida la reapertura offline después de la primera carga:

```bash
npm run build:web
npm run preview
# http://localhost:8081
```

El service worker almacena los archivos estáticos de la aplicación, nunca respuestas de Firebase, fotos remotas ni exportaciones privadas. En desarrollo (`npm run web`) no se instala ese worker.

## Funcionalidad

- Obras con búsqueda, zona, prioridad de retiro y semáforo calculado con el calendario de Buenos Aires. **Retiradas agrupa RETIRADO y REINGRESADO; se quitó el filtro Cerradas.**
- Alta/edición de obras, cargas con contadores, medidas personalizadas, apodos y combos con revisión.
- Entregas, retiros inspeccionados, triangulación directa, daños, pérdidas y recuperaciones con auditoría.
- Stock por galpón, obra, taller y perdido; ajustes administrativos con origen/destino y motivo.
- Responsables configurables; selección de perfil demo o autenticación Firebase con correo verificado.
- Fotos con permisos, JPEG a calidad 0.7 y lado máximo 1024 px, persistencia local y cola de subida.
- Lista de viaje por zona, orden manual o distancia real desde GPS, enlaces a Google Maps y remito WhatsApp. El usuario confirma el envío en WhatsApp.
- Historial con filtros, reversión segura de la última acción dentro de cinco minutos y correcciones compensatorias. Administración puede paginar auditoría remota.
- Excel y Word institucionales: generación local en demo web, probada en Chromium; generador local móvil implementado, pendiente de ejecución en hardware. Backend privado separado para producción. Se incluyen muestras reales en `artifacts/`.

## Apariencia y recuperación

Al iniciar se sigue el tema del sistema. El botón de sol/luna cambia inmediatamente a una elección manual sin perder formularios. En Configuración están Claro, Oscuro y Seguir sistema. La preferencia se conserva separada del inventario.

En Configuración, Administración puede **Descargar copia** con inventario e imágenes. **Elegir copia → Restaurar copia** valida el archivo y guarda preventivamente el estado anterior antes de reemplazar la demo. Protege estas copias como información interna. Un error de lectura no reinicia la aplicación con otra semilla ni borra silenciosamente el inventario.

Manual: [MANUAL_USUARIO.md](docs/MANUAL_USUARIO.md). Estado para continuar: [CONTINUIDAD_CODEX.md](docs/CONTINUIDAD_CODEX.md). Resultados y límites: [INFORME_ENTREGA.md](docs/INFORME_ENTREGA.md).

## Decisiones técnicas

La lógica de dominio es compartida entre app y Functions. Cada comando valida esquema, permisos, transición y cantidades antes de producir un nuevo estado. Los movimientos nunca asignan stock negativo. La carga puede guardarse con stock insuficiente; entregar exige existencias o una procedencia de otra obra autorizada por ADMIN.

La persistencia usa AsyncStorage con una escritura del estado completo y la cola en un único sobre. La UI solo confirma después de guardar. En web, Web Locks serializa pestañas cuando está disponible; evitar múltiples pestañas de edición en navegadores sin esa API. Firebase web usa `persistentLocalCache` y `persistentMultipleTabManager`; React Native usa caché Firestore en memoria más el repositorio durable propio. No se atribuye persistencia nativa al SDK JS de Firestore.

Estilos centralizados con `StyleSheet`: no se añadió NativeWind para evitar otra capa de configuración. FlashList 2.0.2 está dentro de las versiones seleccionadas por Expo 57 y aislada en `DataList`. Iconos Lucide y háptica con fallback seguro.

Más detalles: [ARQUITECTURA.md](docs/ARQUITECTURA.md), [FIREBASE.md](docs/FIREBASE.md), [VALIDACION.md](docs/VALIDACION.md).

## Verificaciones

```bash
npm ci
npm --prefix functions ci
npm run check
npm run test:integration
npm run build:web
# Dejar npm run preview abierto en otra terminal:
npm run test:ui
```

Las pruebas de reglas usan Java 21 y Firebase Emulator Suite, con el proyecto local `demo-repartos-chema`. No usan credenciales de producción. Para Playwright, ajustar `CHROMIUM_PATH` al ejecutable de Chromium; en este entorno es `/usr/bin/chromium`. En un entorno sin Chromium, instalarlo o ejecutar `npx playwright install chromium` y ajustar la configuración.

Si Firebase CLI fuerza un proxy para peticiones entre emuladores, usar el adaptador **solo de loopback** incluido:

```bash
node -r ./scripts/emulator-local.cjs ./node_modules/firebase-tools/lib/bin/firebase.js emulators:exec --project demo-repartos-chema --only firestore,storage "npx vitest run --config vitest.integration.config.mts"
```

Para exportar bundles nativos (no equivale a compilar APK/IPA):

```bash
npx expo export --platform android --platform ios --output-dir dist-native
```

## Variables y configuración

Copiar [.env.example](.env.example). `EXPO_PUBLIC_DATA_MODE=demo` es suficiente para la demo. Las variables `EXPO_PUBLIC_FIREBASE_*` son configuración pública de cliente, no claves privadas de cuenta de servicio. El backend obtiene credenciales mediante el entorno de Firebase/ADC; ninguna clave privada debe colocarse en la app.

La configuración completa de Authentication, Firestore, Storage, Functions, FCM, CORS y roles está en [FIREBASE.md](docs/FIREBASE.md). No se configuró ningún mapa nativo: la lista de viaje es una alternativa funcional sin claves ni coordenadas inventadas.

## Límites actuales

- Firebase, push y exportación cloud **implementados pero no desplegados ni verificados con una cuenta real**. FCM nativo requiere el puente adicional descrito en la guía.
- Cámara, GPS, compartir, SecureStore y háptica requieren validación en iOS/Android físicos. Los bundles JS nativos no demuestran esas funciones del dispositivo.
- La demo no convierte cambios a `SYNCED`: muestra guardado local y pendiente de nube. Configuración permite descargar una copia con fotos y restaurarla. Sin esa copia externa, borrar el almacenamiento pierde los datos locales.
- Los documentos locales están probados en web; la ruta nativa JS + archivos/compartir requiere prueba en Android/iOS. No hay PDF automático.
- El backend usa un agregado transaccional para una sola empresa: hasta 200 obras, 300 materiales y 750 KB serializados. Rechaza crecimiento excesivo; requiere particionar/archivar antes de escalar. No elimina evidencia remota para ganar espacio.
- FCM acepta mensajes, no garantiza que el teléfono los muestre. Los reintentos pueden duplicar avisos; se incluye `eventId`/tag de colapso.

El árbol de archivos está en [ARCHIVOS.md](docs/ARCHIVOS.md).
