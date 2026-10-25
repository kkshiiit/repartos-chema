# Entrega individual Android 1.6.1 — Repartos Chema

Estado de preparación del 25/10/2026 (Argentina). Este informe se actualiza al terminar; una compilación o prueba en curso no se declara aprobada. La auditoría integral y el contexto para otro asistente están en [AUDITORIA_MAESTRA_ACTUAL.md](AUDITORIA_MAESTRA_ACTUAL.md).

## Alcance y cambios

Edición gratuita, individual, local/offline. Inicio vacío, sin borrar bases existentes; SQLite, fotos locales y copias JSON conservados. Se mantienen cuatro pestañas, diseño Papel/Cobalto, temas Claro/Oscuro/Sistema, cuenta local por nombre, inventario, historial, recuperación, viaje, documentos y avisos locales. No hay publicidad ni backend obligatorio, Firebase productivo, EAS, hosting o facturación activados.

1. **Integridad de entrega anticipada:** rechaza retiro anterior a la fecha de entrega planificada antes de mover cantidades. La fecha efectiva sigue separada. Dos regresiones verifican rechazo sin persistir y copia/restauración/reapertura válida con fechas coherentes. Archivo `src/domain/engine.ts`; prueba `tests/fecha-entrega-integridad.test.ts`. No modifica fechas automáticamente.
2. **Parche de validación:** Zod exacto 4.6.6 en aplicación y Functions heredado, con locks coherentes. Una carga que excede el máximo de100 componentes se rechaza antes de validar cada elemento. Prueba `tests/zod-limits.test.ts`. Se conserva decoder0.5.0 local CommonJS y su override.
3. **Remito legacy:** fecha de retiro ausente/inválida muestra «Sin fecha de retiro». Cinco casos, sin modificar el alquiler. `src/utils/whatsapp.ts`, `tests/whatsapp-legacy.test.ts`.
4. **Manual vigente:** corrige la descripción de los avisos: general opcional08:00/3/2/1/0, herencia, personalización y manuales migrados. `docs/USO_LOCAL_ANDROID.md`.
5. **Auditoría y continuidad:** informe completo guardado y respaldado desde1ef9be4; checkpoint persistente, perfiles QA/seguridad/arquitectura/entrega aplicados a revisión real. Los282 perfiles no se ejecutan todos ni significan una automatización permanente.

## Evidencia de esta ejecución

- `npm run check`: **444/444**, 40archivos, TypeScript y Functions build aprobados; lint0errores/1advertencia de importación de Axe en un test.
- `npm run build:web`: exportación local correcta; seis fragmentos JavaScript, principal5.5MB informados por Expo, sin prometer tiempo de inicio ni memoria Android. Word/Excel se cargan de forma separada. FCM sin configurar/no activado.
- `tests/ui/fecha-entrega.spec.ts`: nuevo recorrido de error visible, formulario conservado, cantidades intactas, corrección y reapertura. La primera comprobación esperaba ISO en un campo DD/MM/AAAA: corregida sin cambiar la aplicación.
- Instalación limpia aislada y suite UI final: pendientes de cierre al escribir este apartado. Primer `npm ci` instaló1565paquetes con scripts y sin cambiar lock; su comprobación posterior buscaba el nombre de archivo equivocado. Una segunda instalación concurrente terminó por señal9 y Chromium informó Page/Target crashed; límite cgroup8GiB y eventosOOM registrados. La repetición final se realiza secuencialmente; se conservan logs de intentos fallidos, no se ocultan como éxitos.
- No se ejecuta Firebase Emulator/producción: no forman parte de esta edición. No hay dispositivo físico/emulador conectado.

## Seguridad y límites

Paquete `com.grupochema.repartos`, versión1.6.1/código10, ARM64/Android7+. Se exige certificadoSHA256 `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`, igual al1.6.0 y anteriores; clave privada fuera de Git/ZIP. Se verifica firma, metadata, ABI,CRC,SQLite, tres tonos y ausencia de marcadores publicitarios propios/configuraciónFirebase en el bundle antes de publicar.

La auditoría npm fresca del 25/10 no queda en cero: **21 entradas en raíz (12 altas, 9 moderadas, 0 críticas)** y diez en Functions histórico. El recuento de nueve del 24/10 quedó histórico. Los nuevos avisos analizados son herramientas dev bajo Firebase CLI, sin camino de ejecución en APK identificado; ver `cierre-2026-10-25-seguridad-clasificacion.md`. La aplicación usa Zod parcheado; Expo CLI conserva Zod3.x. Node-forge no tiene parche publicado confirmado; consumidores uuid revisados usan v4 sin buffer. No se demostró explotación en APK y no se aplican downgrades o actualizaciones nativas a ciegas. Las copias JSON tienen límite50MB pero arrays sin máximo individual: queda riesgo de memoria con archivos grandes/adversarios. No se debilita validación ni se reescriben datos antiguos para ocultarlo.

Los avisos se solicitan al sistema, sin permiso de alarmas exactas. Android puede retrasarlos por batería/DND/fabricante/force-stop. No se acredita recepción con app cerrada/reinicio, migración real o compartir nativo mediante pruebas de navegador.

## Instalación y pruebas desde Android

1. Antes de actualizar: Ajustes → Copias y restauración → Descargar copia. Guardar JSON fuera de la app y comprobar su archivo, preferiblemente en Descargas/RepartosChema.
2. Descargar el APK versionado con sesión GitHub de `kkshiiit`. Instalar **encima**, sin desinstalar ni borrar datos. Si Android rechaza la actualización, conservar mensaje y app actual: no reemplazar certificado ni borrar almacenamiento.
3. Abrir y comprobar cantidades de depósito/alquilados/a reparar/perdidos, alquileres, responsables, historial y fotos anteriores. Revisar fechas y temas.
4. Activar modo avión, cerrar normalmente y reabrir. Registrar un cambio controlado y verificar que persiste. No usar Empezar vacío sobre inventario de trabajo para una prueba.
5. Probar un alquiler con entrega planificada futura: un retiro anterior debe mostrar error dentro del panel y conservar valores/stock; corregir la fecha y confirmar una sola vez. Guardar otro JSON y revisar que se puede seleccionar y validar sin confirmar una restauración innecesaria.
6. Programar un aviso a unos minutos futuros, conceder permiso y comprobar estado real. Probar app abierta/segundo plano/cierre/reinicio y tocarlo; debe abrir el alquiler sin cambiar cantidades. Probar horario general, personalizado, vuelta a General y cancelación al retirar.
7. Generar Word/Excel y abrir/compartir con lector instalado; cámara/galería; GPS y Volver al depósito. Mapas/WhatsApp dependen de sus aplicaciones y conectividad/mapas descargados.

Una instalación nueva inicia vacía. Si se actualiza una base antigua, no se restablece automáticamente: se conserva y valida la migración existente. Ante un error de lectura o espacio, conservar original y mensaje, no desinstalar.

## Desarrollo reproducible

```bash
npm ci
npm run check
npm run build:web
npm run preview
CHEMA_TEST_LOCAL=true npm run test:ui -- --workers=1
```

No se necesita `.env` para el uso individual; `.env.example` no contiene secretos. Para Android usar JDK21, SDK/build-tools36, NDK27.1.12297006 y clave anterior mediante `CHEMA_ANDROID_KEYSTORE`; detalles en [ANDROID.md](ANDROID.md). No incluir la clave en respaldos compartidos. No se pide al usuario ejecutar estos comandos desde el celular.

## Instalador y respaldos

En preparación. La versión1.6.0 publicada se conserva como anterior; no incluye estos parches. El encabezado final añadirá commit fuente, ZIP restaurado, SHA256 del nuevo APK, publicación y recuperación desde clon independiente. No declarar APK nuevo a partir de un bundle Hermes.
