# Repartos Chema

Aplicación interna de Grupo Chema Construcciones para administrar alquileres de andamios, entregas, retiros e inventario. **Edición 1.3.0 individual, local/offline, sin publicidad ni backend o servicios pagos obligatorios.** No comparte datos entre celulares.

## Instalar en Android

[**Descargar APK completo 1.3.0 — Android ARM64**](https://github.com/kkshiiit/repartos-chema/raw/refs/heads/descargas/android/v1.3.0-local.1/repartos-chema-local-1.3.0-arm64.apk)

Si no descarga, abrir [la ficha del APK](https://github.com/kkshiiit/repartos-chema/blob/descargas/android/v1.3.0-local.1/repartos-chema-local-1.3.0-arm64.apk) y tocar **Download raw file**. Repositorio privado: iniciar sesión con acceso. Es un solo archivo, sin partes.

Android 7+, ARM64, versión1.3.0/code6. 51.514.361 bytes. Compilación Gradle completa, firma v2, certificado igual a1.2.2, SQLite nativo, ABI y CRC comprobados. **No se probó en un Android físico.** Antes de actualizar guardar JSON fuera de la app; instalar encima sin desinstalar ni borrar almacenamiento. La instalación nueva empieza vacía; la migración conserva el original AsyncStorage y las recuperaciones.

SHA256 del APK:

```text
5404659c3ce0dec2149508e81f85c817664be7dbe42294d344e9fb23a2c4cb8b
```

[Manual Android](docs/USO_LOCAL_ANDROID.md) · [Informe, pruebas y capturas claras/oscuras](docs/ENTREGA_AURORA_1_3.md) · [Comprobaciones del APK](artifacts/validacion/aurora-apk.json) · [Fuente y manifiestos descargables](https://github.com/kkshiiit/repartos-chema/tree/descargas/respaldos/v1.3.0-local)

## Novedades y funcionamiento

- Aurora rosa/violeta, vidrio ligero, claro/oscuro/sistema y cambio rápido sin perder formularios. Movimiento ambiental lento; opción estática, pausa en segundo plano y respeto por reducir movimiento.
- Alquileres, Depósito, Viaje e Historial. Búsqueda, zona y estados con texto/iconos. Retirados agrupa retirado y reingresado; no hay filtro Cerradas separado.
- Cargas, cantidades, medidas, apodos, combos, responsables configurables y recibido por. Entrega, retiro inspeccionado, reingreso, reactivación, triangulación, daños/pérdidas, recuperación, ajustes y deshacer seguro auditado.
- Inventario Android en SQLite transaccional, migración no destructiva y recuperación explícita ante errores. No se reinicia silenciosamente por corrupción.
- JSON con revisión antes de confirmar, validación de referencias/fechas/medidas, copias anteriores y catálogo de recuperación. Guardado Android en carpeta con lectura de comprobación; cancelar no cuenta como respaldo. Empezar vacío exige copia importable y confirmación.
- Fotos locales JPEG hasta1024px, permisos y compresión. Quitar una foto activa conserva bytes necesarios para copias retenidas. No se suben a nube.
- Viaje prioriza retiros, orden manual o ubicación real, Maps y regreso al depósito fijo. WhatsApp abre remito para que el usuario confirme su envío.
- Word/Excel institucionales locales. Descarga web probada; cámara, selector de carpeta y Compartir nativos pendientes de validación física. No hay PDF automático.
- Ingreso por nombre local: identifica movimientos, no autentica una cuenta ni crea usuarios remotos.

## Ejecutar desde el código

Expo57, React Native0.86, React19, TypeScript6, Expo Router, React Context, SQLite nativo/AsyncStorage web, Zod, FlashList, Lucide, ExcelJS/docx. No se cambió de framework.

Node22.13+ o24.3+ y npm; esta entrega se comprobó con Node24.19/npm11.9. No se necesitan credenciales:

```bash
npm ci
cp .env.example .env
npm run web
```

El ejemplo fija LOCAL_ONLY=true y DATA_MODE=demo: comienza vacío únicamente cuando no existen datos. Las variables Firebase quedan vacías; el código cloud histórico permanece inactivo. No configurar servicios para usar esta edición.

Exportación web reproducible:

```bash
npm run build:web
npm run preview
# http://localhost:8081 en ese mismo equipo
```

Localhost del entorno remoto no es una URL pública accesible desde el celular. Para Android usar el APK. No abrir index.html mediante file://. El worker web guarda estáticos, no respuestas Firebase ni documentos privados.

## Pruebas y compilación

```bash
npm --prefix functions ci
npm run check
npm run build:web
# mantener npm run preview abierto:
CHEMA_TEST_LOCAL=true npm run test:ui -- --workers=2
```

Resultados:175/175 pruebas, tipos/lint/Functions build correctos;31/31 recorridos web del sistema visual. Tras corregir el lockfile, npm ci limpio, consumidor decoder2/2,175/175 y3/3 recorridos locales nuevos correctos. Las integraciones Firebase no se ejecutaron en este cierre; compilar Functions no demuestra nube funcionando.

APK con JDK21 completo, SDK36/build-tools36.0.0, NDK27.1.12297006 y CMake3.22.1:

```bash
npm run build:android:demo
```

Requiere JAVA_HOME/ANDROID_HOME válidos. Genera Android y ejecuta Gradle completo ARM64; no usa EAS ni un servicio de compilación pago. Preservar certificado; nunca sustituir la firma de una instalación con datos. Detalles y proxy del entorno en [ANDROID.md](docs/ANDROID.md).

## Límites y conservación

La validación física sigue pendiente: actualizar encima, migrar datos/fotos, reiniciar, cámara/galería, GPS/Maps/WhatsApp, guardar carpeta y abrir/compartir documentos. No hay métricas físicas de FPS, RAM o batería. Las capturas son web real con contenido sintético, no Android físico.

La firma es interna de plantilla. JSON y fotos no están cifrados por usar el sandbox; guardar copias externas y proteger el dispositivo. Las recuperaciones/fotos retenidas consumen espacio: no hay limpieza destructiva automática. AutoBackup del sistema no sustituye una copia comprobada.

Quedan avisos transitivos de dependencias documentados en el informe. Se corrigió el decoder vulnerable sin degradar Expo/RN. No se declara cero vulnerabilidades ni se usó audit fix --force.

No se activó facturación, hosting ni producción. El APK opera sin infraestructura paga; las cuotas futuras de GitHub/cómputo de desarrollo o conexión móvil no se consideran ilimitadas.

[Checkpoint para continuar](docs/CONTINUIDAD_CODEX.md) · [Arquitectura](docs/ARQUITECTURA.md) · [Entrega anterior1.2.2 conservada](docs/PULIDO_1_2_2.md). Las guías cloud antiguas describen integraciones separadas, no requisitos de esta edición.
