# Repartos Chema 2.0 — equipo sincronizado

**Descargar APK 2.0.0 (Android 7+, ARM64):** ver la sección *Descarga* más abajo · [Novedades, instalación y funcionamiento](docs/VERSION_2_0.md)

- Todos los teléfonos con el mismo **código de equipo** ven y cargan los mismos datos; funciona sin señal y sincroniza solo.
- Cada persona **ingresa con su nombre**. Todo cambio queda en la **Auditoría** (quién, qué, cuándo y qué materiales se movieron).
- Interfaz nueva: modo **Sol** (alto contraste para la calle) y **Noche**, cuadros de resumen del día, tarjetas con color de estado.
- **Ticket** de cada alquiler en PDF, WhatsApp, texto, Word o Excel.
- **Guía de uso** por secciones (exportable en PDF) y **exportar/importar** todo en JSON.
- Se instala **encima de la 1.7 sin desinstalar** (misma firma). Si el teléfono tenía datos, el inicio ofrece pasarlos al equipo.

## Desarrollo

```bash
npm ci
npm run check          # tipos + lint + pruebas unitarias
npm run build:web && npm run preview
npm run test:ui -- --trace off   # recorrido real con dos teléfonos (crea equipos "QA …")
```

---

## Antecedente 1.6.1 / 1.7, preservado como historial

# Repartos Chema 1.6.1 — Android individual y gratuito

[**Descargar APK 1.6.1 ARM64**](https://github.com/kkshiiit/repartos-chema/raw/refs/heads/descargas/android/v1.6.1-local.1/repartos-chema-local-1.6.1-arm64.apk) · [Instalación y SHA256](https://github.com/kkshiiit/repartos-chema/blob/descargas/android/v1.6.1-local.1/LEEME.md) · [Auditoría completa](docs/AUDITORIA_MAESTRA_ACTUAL.md) · [Informe de entrega](docs/ENTREGA_LOCAL_1_6_1.md) · [Fuente ZIP y web](https://github.com/kkshiiit/repartos-chema/tree/descargas/respaldos/v1.6.1-local)

Local y offline, instalación nueva vacía, sin anuncios ni backend/servicios pagos obligatorios. Antes de actualizar: guardar JSON fuera de la app e instalar encima, sin desinstalar ni borrar datos. Mismo paquete/certificado. 444unitarias/57recorridosweb, Gradle completo y descarga recuperada verificados; **prueba físicaAndroid pendiente**. Los avisos dependen de los permisos y las restricciones del sistema, sin puntualidad exacta garantizada.

SHA256 APK: `03e42657ad62d9c39ddd3cc2060a8ebd1d11d861fd78c0da46bda2f311c578f1`. [Manual](docs/USO_LOCAL_ANDROID.md) · [Capturas claras/oscuras](docs/GALERIA_AVISOS_1_6.md) · [Continuidad](docs/CONTINUIDAD_CODEX.md).

## Desarrollo local actual

```bash
npm ci
npm --prefix functions ci
npm run check
npm run build:web
npm run preview
CHEMA_TEST_LOCAL=true npm run test:ui -- --workers=1
```

Node24 probado; Chromium para Playwright (CHROMIUM_PATH si está en otra ruta). Sin .env para individual. Android necesita JDK21/SDK36 y la clave anterior externa: [guía](docs/ANDROID.md). No correr instalaciones, Chromium y Gradle simultáneamente en un entorno con8GiB. Npm audit no está en cero; revisión y límites en la auditoría. No activar cloud ni facturación para la demo individual.

---

## Antecedente 1.4, preservado como historial

# Repartos Chema 1.4.0 — individual local

[**Descargar APK único 1.4.0 ARM64**](https://github.com/kkshiiit/repartos-chema/raw/refs/heads/descargas/android/v1.4.0-local.1/repartos-chema-local-1.4.0-arm64.apk)

[Si no descarga: abrir la ficha y tocar Download raw file](https://github.com/kkshiiit/repartos-chema/blob/descargas/android/v1.4.0-local.1/repartos-chema-local-1.4.0-arm64.apk). Repositorio privado: iniciar sesión con acceso.

Android7+, ARM64, versión1.4.0/code7,56.039.655bytes. Gradle completo10m36s; firma v2/CRC/ABI/SQLite y tonos originales comprobados. Certificado idéntico a1.3.0. Recuperado desdeGitHub y SHA coincidente. **No se probó instalación ni uso en Android físico.** Antes de actualizar: guardar JSON fuera de la app e instalar encima sin desinstalar ni borrar datos. Una instalación nueva comienza vacía; una existente conserva datos/migración.

SHA256:

```text
79ad05905267460596270333316403796465e5bc9e874d478b04ca8710ca6bb1
```

[Manual Android](docs/USO_LOCAL_ANDROID.md) · [Informe de entrega](docs/ENTREGA_COBALTO_1_4.md) · [Capturas claras/oscuras](docs/GALERIA_COBALTO.md) · [APK comprobado](artifacts/validacion/android-1.4.0-apk.json) · [Fuentes ZIP y web](https://github.com/kkshiiit/repartos-chema/tree/descargas/respaldos/v1.4.0-local)

## Novedades y funcionamiento

- Papel cálido, tinta y cobalto. Títulos serif locales, listas claras, temas claro/oscuro/sistema y cambio rápido. Fondo estático, transiciones breves y reducir movimiento. Alta/edición en Cliente/Carga/Revisar sin mover stock al avanzar. Paneles con cierre protegido.
- Alquileres, Depósito, Viaje e Historial. Búsqueda, zona y estados con texto/iconos. Retirados agrupa retirado y reingresado; no hay filtro Cerradas separado.
- Cargas, cantidades, medidas, apodos, combos, responsables configurables y recibido por. Entrega, retiro inspeccionado, reingreso, reactivación, triangulación, daños/pérdidas, recuperación, ajustes y deshacer seguro auditado.
- Inventario Android en SQLite transaccional, migración no destructiva y recuperación explícita ante errores. No se reinicia silenciosamente por corrupción.
- JSON con revisión antes de confirmar, validación de referencias/fechas/medidas, copias anteriores y catálogo de recuperación. Guardado Android en carpeta con lectura de comprobación; cancelar no cuenta como respaldo. Empezar vacío exige copia importable y confirmación.
- Fotos locales JPEG hasta1024px, permisos y compresión. Quitar una foto activa conserva bytes necesarios para copias retenidas. No se suben a nube.
- Viaje prioriza retiros, orden manual o ubicación real, Maps y regreso al depósito fijo. WhatsApp abre remito para que el usuario confirme su envío.
- Word/Excel institucionales locales. Descarga web probada; cámara, selector de carpeta y Compartir nativos pendientes de validación física. No hay PDF automático.
- Avisos por alquiler, locales y opt-in, fecha/hora elegidas, sin repetición automática. Sonidos/vibración de confirmación apagados inicialmente; web no programa avisos. No hay push remoto.
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

Resultados actuales:218/218 pruebas, tipos/lint/build Functions correctos;44/44recorridos web. npmci completo desde carpeta vacía correcto.271capturas nuevas,80superficies de contraste sin violaciones automáticas. Integraciones Firebase excluidas y no ejecutadas; compilar Functions no demuestra nube funcionando. Cámara/archivos/avisos nativos se comprobaron con adaptadores simulados, pendientes de prueba física.

APK con JDK21 completo, SDK36/build-tools36.0.0, NDK27.1.12297006 y CMake3.22.1:

```bash
CHEMA_ANDROID_KEYSTORE=/ruta/privada/firma-existente.keystore npm run build:android:demo
```

Requiere JAVA_HOME/ANDROID_HOME válidos. Genera Android y ejecuta Gradle completo ARM64; no usa EAS ni un servicio de compilación pago. Preservar certificado; nunca sustituir la firma de una instalación con datos. Detalles y proxy del entorno en [ANDROID.md](docs/ANDROID.md).

## Límites y conservación

La validación física sigue pendiente: actualizar encima, migrar datos/fotos, reiniciar, cámara/galería, GPS/Maps/WhatsApp, guardar carpeta y abrir/compartir documentos. No hay métricas físicas de FPS, RAM o batería. Las capturas son web real con contenido sintético, no Android físico.

La firma es interna de plantilla. JSON y fotos no están cifrados por usar el sandbox; guardar copias externas y proteger el dispositivo. Las recuperaciones/fotos retenidas consumen espacio: no hay limpieza destructiva automática. AutoBackup del sistema no sustituye una copia comprobada.

Quedan avisos transitivos de dependencias documentados en el informe. Se corrigió el decoder vulnerable sin degradar Expo/RN. No se declara cero vulnerabilidades ni se usó audit fix --force.

No se activó facturación, hosting ni producción. El APK opera sin infraestructura paga; las cuotas futuras de GitHub/cómputo de desarrollo o conexión móvil no se consideran ilimitadas.

[Checkpoint para continuar](docs/CONTINUIDAD_CODEX.md) · [Arquitectura](docs/ARQUITECTURA.md) · [Entrega anterior1.2.2 conservada](docs/PULIDO_1_2_2.md). Las guías cloud antiguas describen integraciones separadas, no requisitos de esta edición.
