# Validación — 14 de octubre de 2026

Resultados de esta ejecución, no recuperados de una caché de pruebas anterior. Entorno Linux remoto, Node 24.19, Java 21 y Chromium. Ningún dispositivo físico ni Firebase productivo conectado.

| Verificación                                                                             | Resultado comprobado                                                                                            |
| ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `npm run check`                                                                          | TypeScript, ESLint y build Functions correctos; 74 pruebas unitarias/documentos aprobadas                       |
| Emuladores Firestore/Storage                                                             | 14 pruebas aprobadas: 7 reglas y 7 handlers de backend                                                          |
| `npm run build:web`                                                                      | Exportación `dist/` correcta y worker offline generado                                                          |
| `npm run test:ui -- --workers=2`                                                         | 17 casos aprobados, 1.8 minutos en la última ejecución                                                          |
| `expo export --platform android --platform ios --output-dir dist-native --max-workers 2` | Dos bundles Hermes generados; no son APK/IPA                                                                    |
| Capturas                                                                                 | 48 PNG reales actuales: 12 pantallas × 2 anchos × 2 temas                                                       |
| Fuente sin anuncios                                                                      | Búsqueda de identificadores propios y dependencias; ver registro de entrega                                     |
| Android Gradle                                                                           | Intento local en curso al preparar este documento; consultar INFORME_ENTREGA y CONTINUIDAD para resultado final |

## Qué cubren las pruebas

`tests/domain.test.ts`: cantidades, calendario de Buenos Aires, semáforo, estados pendientes/retirados, entrega/retiro y distribución de depósitos, falta de stock, transferencia/procedencia, permisos, conservación, reintentos, deshacer y ventana temporal, medidas/variantes, versiones, fechas efectivas, recuperación/corrección y faltantes sin maestro. Remito WhatsApp: contenido/codificación y ausencia de envío automático.

`tests/repository.test.ts`: persistencia, relectura, cola, reconexión simulada, respuestas perdidas, conflictos que sobreviven reinicio, corrupción, errores de almacenamiento/cuota, recuperación y archivo preventivo. Son pruebas con adaptadores controlados; no demuestran multiusuario físico ni toda falla posible de un sistema de archivos.

`tests/backup.test.ts`: exportar y restaurar fotos/inventario con IDs nuevos; rechazar fotos faltantes; conservar datos corruptos para asistencia. `tests/documents.test.ts`: XLSX institucional reabierto con ExcelJS y DOCX real. Muestras en `artifacts/`.

`tests/themes.test.ts`: selección manual/sistema, contraste de texto normal y estados ≥4.5:1 en las superficies probadas, texto del botón rojo ≥4.5:1, bordes/foco ≥3:1 en fondos aplicables. No equivale a una certificación integral WCAG ni garantiza visibilidad bajo cualquier sol.

`tests/firebase.integration.test.ts`: acceso anónimo/no verificado, inventario, prohibición de escritura directa/roles, auditoría ADMIN, fotos propias/no sobrescritura/MIME, documentos privados/propietario/expiración.

`tests/backend.integration.test.ts`: ejecuta los handlers compilados con contexto Auth controlado y Firestore/Storage Emulator reales. Rechaza roles indebidos, prueba entregas concurrentes, recibos idempotentes, reutilización maliciosa de ID, revisión obsoleta, deshacer con evidencia original, Excel/Word privados y cabecera JPEG. No prueba la emisión real del token Auth ni el transporte HTTP callable. El aviso `MetadataLookupWarning` del SDK en entorno sin identidad de nube no impidió los tests; los servicios se limitaron al proyecto demo emulado.

Playwright: ADMIN crea/carga/entrega/reabre/deshace/descarga, OPERADOR carece de gestión ADMIN, retiro/reingreso, transferencia/daño/recuperación, reapertura offline con worker, foto en IndexedDB/copia/restauración/reinicio, sistema en vivo, override manual, persistencia, formulario/modal conservados y comparación de inventario sin cambios por tema. Recorre 320, 360, 390, 768 y 1440 px en ambos temas sin desbordamiento horizontal del documento ni errores JS capturados.

## Reproducir

```bash
npm ci
npm --prefix functions ci
npm run check
# Java 21 y permisos para puertos locales:
node -r ./scripts/emulator-local.cjs ./node_modules/firebase-tools/lib/bin/firebase.js emulators:exec --project demo-repartos-chema --only firestore,storage 'npx --no-install vitest run --config vitest.integration.config.mts'
npm run build:web
npm run preview
# En otra terminal del mismo entorno:
npm run test:ui -- --workers=2
```

Los tests backend importan la salida compilada de Functions: ejecutar `check` o `npm --prefix functions run build` antes. No apuntarlos a producción: contienen una guarda de ID demo y emulator host. Modifican únicamente datos del emulador.

En este sandbox se usaron `XDG_CONFIG_HOME=/tmp/chema-firebase`, `EXPO_NO_TELEMETRY=1`, `__UNSAFE_EXPO_HOME_DIRECTORY=/tmp/chema-expo` para mantener cachés en rutas permitidas. La red requiere permisos del entorno, conservando proxy/TLS. No se deshabilitaron reglas para satisfacer operaciones de cliente; la carga inicial administrativa de pruebas usa el mecanismo explícito de fixtures.

## Errores detectados y corregidos

- Selector de tema usaba `aria-selected` sobre un botón web: cambió a `aria-pressed`; suite completa pasó.
- Borde oscuro con contraste 2.84:1: token corregido y test pasó.
- ESLint rechazó un reset síncrono dentro del efecto de fotos: el estado se actualiza al resolver/capturar la lectura asíncrona; no se desactivó la regla.
- Restauración compartía URI pero no el ID remapeado en una referencia repetida: ambos se remapean juntos.
- Auditoría remota del original deshecho no se actualizaba: ahora se marca atómicamente con el nuevo movimiento; integración pasó.
- Proxy del wrapper Gradle: descarga inicial falló; `GRADLE_OPTS` permitió descargar la distribución. NDK requiere descarga grande y recuperación acotada.

## Dependencias y seguridad

`npm audit --omit=dev` del 14/10: app **30 avisos (18 altos, 12 moderados, 0 críticos)**; Functions **9 moderados, 0 altos/críticos**. Son avisos contando paquetes afectados en cadenas transitivas, no treinta fallos reproducidos en la app.

Se actualizó `@grpc/grpc-js` mediante override compatible a 1.14.6. Quedan `braces`, `node-forge`, `decode-uri-component` y `uuid` en cadenas de Expo/herramientas/ExcelJS. `npm audit` propone cambios mayores/downgrades incompatibles (incluido Expo 44), por lo que no se ejecutó `audit fix --force`. La app genera documentos y no ofrece importación arbitraria de XLSX. Eso limita superficie, pero no prueba inmunidad. Revisar versiones corregidas compatibles y los bundles vendorizados de ExcelJS antes de producción.

## Límites de validación

Pendientes: TalkBack/VoiceOver, fuente ampliada nativa y teclado físico, cámara/GPS/permisos/revocación/compartir reales, sesiones SecureStore en hardware, notificaciones FCM, transporte Auth/callable, dos usuarios reales desconectados y reconectados, batería/RAM/FPS y arranque en Android de gama baja. No hay métricas inventadas. Las 48 capturas no acreditan revisión visual manual exhaustiva de todos los estados.

No se implementó PDF automático ni firma digital. No hay una URL pública de preview verificada. La compilación web no demuestra funcionamiento de todos los procesos de negocio en Android.
