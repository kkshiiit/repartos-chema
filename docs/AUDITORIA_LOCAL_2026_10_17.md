# Auditoría de cierre gratuito — Repartos Chema

Fecha: 17/10/2026 UTC. Base inspeccionada: main `bfb894315ed828725baa98b8e2e75255d36f97d3`; descargas `bb0bfba2da69af18572d8bbd4674443f9bfeae5b`. El código estaba limpio al comenzar. Esta tarea es auditoría y planificación: no corrige los hallazgos ni cambia la versión del APK.

## Conclusión

La edición individual ya tiene una base ejecutable, persistente y probada en web. No se considera terminada para uso diario Android: faltan fortalecer la importación/recuperación, resolver límites de almacenamiento y verificar funciones nativas en un teléfono. No hay evidencia de un nuevo fallo de stock en las operaciones normales cubiertas, pero las pruebas actuales no cubren todos los datos que puede introducir una copia JSON.

El cierre sin costos de infraestructura es viable con **un celular, almacenamiento local, documentos locales y copias manuales JSON**. No requiere Firebase, Cloudflare, hosting, EAS, Play Store, anuncios ni APIs de mapas. El desarrollo usa los recursos ya disponibles en esta sesión; no se promete acceso gratuito e indefinido a plataformas externas o cómputo futuro. El APK instalado no necesita mantener esta sesión ni una computadora encendida.

## Arquitectura y alcance conservados

- Expo 57.0.27, React Native 0.86.3, React 19.2.3, TypeScript 6.0.3, Expo Router; Context y AsyncStorage. FlashList, Zod, Lucide, Expo FileSystem/Sharing/DocumentPicker/Location/ImagePicker/ImageManipulator; ExcelJS y docx.
- Dominio: `src/domain/engine.ts`, `rules.ts`, `schema.ts`. Repositorio serializado: `src/data/repository.ts`. Validación de sobres: `src/data/validation.ts`.
- `EXPO_PUBLIC_LOCAL_ONLY=true` obliga a DATA_MODE demo/local en `src/services/firebase.ts`; no inicializa el adaptador remoto. El nombre identifica movimientos locales, no autentica una identidad. Los roles técnicos internos no vuelven a ser una elección pública.
- Clave comercial existente: `chema:demo:v1`; instalación nueva vacía. Una actualización no borra ejemplos o datos previos automáticamente.
- Navegación: Alquileres, Depósito, Viaje, Historial; detalle/alta/edición, combos, ajustes y documentos como pantallas secundarias. Retirados agrupa RETIRADO/REINGRESADO; no agregar Cerradas.
- Fotos actuales: persistentes en almacenamiento local nativo o IndexedDB web, hasta 1024 px/JPEG0.7. No requieren Storage ni Blaze para conservarse en el celular.
- Compilación: `scripts/build-android-demo.mjs`, Gradle/JDK21/SDK Android; sin EAS obligatorio. `android/` se genera y está ignorado por Git.

## Verificaciones nuevas de esta auditoría

| Comando / inspección | Resultado real |
| --- | --- |
| `npm run typecheck` | Correcto |
| `npm run lint` | Correcto, sin errores ni advertencias |
| `npm test` | 108/108, 13 archivos; integración Firebase excluida por configuración |
| `CHEMA_TEST_LOCAL=true npm run test:ui -- tests/ui/local.spec.ts tests/ui/import-json.spec.ts tests/ui/accessibility.spec.ts --workers=1` | 6/6, 30,6s, contra la exportación local existente; no se generó un build nuevo |
| `npx --no-install expo install --check` | Detectó siete diferencias de parches recomendados, enumeradas abajo; no instaló nada |
| `npm audit --omit=dev --json` | Exit1: 30 entradas afectadas, 18 altas/12 moderadas/0 críticas; cuatro avisos raíz identificados, no 30 vulnerabilidades independientes |
| `apksigner verify --verbose APK1.2.2` | Correcto, APK Signature Scheme v2 |
| `sha256sum APK1.2.2` | Coincide con la entrega: `43835da902859f6c5af77947d315fb8ec2922d9921cebe558948460b0f1ba8eb` |
| `git ls-remote` | main/descargas coinciden con las bases anteriores antes de guardar este informe |
| `adb devices` | Ningún dispositivo conectado |

Los seis recorridos abarcan flujo individual desde vacío, stock, entrega/deshacer/retiro/reingreso, responsable dentro de la entrega, JSON con revisión/cancelación/importación/deshacer, persistencia, reapertura web offline, Word/Excel, filtro Excel inválido y temas. Axe cubre claro/oscuro en ocho rutas; algunas están vacías, no todos los estados/modal ni accesibilidad física. No se ejecutó toda la suite UI histórica ni se probó Android físico.

Playwright regeneró dos muestras Word/Excel versionadas; se repusieron exactamente desde HEAD después de la prueba. No se conservaron cambios accidentales en esas muestras ni se editaron datos de usuario.

## Hallazgos priorizados

### A1 — Alta: validación semántica incompleta de copias

**Reproducido en memoria con las funciones actuales**, sin restaurar datos reales: `parseEnvelope` acepta un materialId de carga inexistente, dos combos con el mismo ID, retiro previsto anterior a entrega y un faltante con recuperado mayor que cantidad. Cantidades básicas y saldos en calle sí tienen validación, pero no bastan para validar todos los vínculos.

Evidencia: `src/data/validation.ts:153`, `src/domain/engine.ts:71`, `src/services/backupService.ts:57`. Se ejecutó el TypeScript actual mediante transpilación en memoria y estados sintéticos; no es una prueba de Android. La tolerancia de BOM UTF8 real se comprobó y funciona: no es un error pendiente.

**Corrección propuesta:** validación semántica específica antes de ofrecer importar; IDs únicos/referencias, fechas relacionadas, medidas e incidentes recuperados/reservados. No modificar cantidades para hacer pasar la validación. No endurecer el arranque de forma que bloquee sin recuperación una base histórica: validar lo nuevo y ofrecer diagnóstico/recuperación del original incompatible.

### A2 — Alta: capacidad y recuperación para uso prolongado

**Límite comprobado en el build:** AsyncStorage Android configura `AsyncStorage_db_size = 6L` en su BuildConfig generado. El repositorio guarda el sobre completo (state y confirmed duplicados), logs e IDs; cada importación/vaciado/recuperación añade una copia íntegra bajo otra clave sin catálogo ni gestión de retención. Hay riesgo de agotar ese límite aunque el teléfono tenga espacio.

Evidencia: `src/data/repository.ts:51,69,89,101,120,141`; `node_modules/@react-native-async-storage/async-storage/android/build/generated/source/buildConfig/release/com/reactnativecommunity/asyncstorage/BuildConfig.java`. Los límites de lectura por fila dependen del dispositivo; no se reprodujo un fallo de CursorWindow ni disco lleno Android. Una medición sintética con 100/500/1000 materiales y sus logs produjo sobres de 111.625/562.825/1.126.839 bytes; no son datos o tiempos reales de la empresa ni umbrales garantizados.

**Corrección propuesta:** adaptador SQLite nativo local, gratuito, detrás de Repository y migración transaccional verificada que conserve originales. AsyncStorage permanece para tema/sesión y en web. Evitar reescribir el dominio o borrar auditoría/IDs para ahorrar espacio. Catálogo de recuperaciones y gestión explícita, sin eliminar copias automáticamente.

### A3 — Alta: recuperar una copia interna puede recuperar referencias a fotos ya borradas

**Deducido de una ruta concreta, pendiente de regresión automatizada:** se archiva un estado con foto; se recupera y luego se elimina esa foto; `deleteLocalPhoto` borra su archivo. Recuperar otra vez el archivo interno antiguo restaura el URI, pero no los bytes eliminados. Las copias JSON externas completas sí incluyen bytes y son un mecanismo diferente.

Evidencia: `src/data/repository.ts:108`, `app/obra/[id].tsx:278`, `src/services/photoCache.ts`, `photoCache.web.ts`. El borrado de fotos debe considerar todas las recuperaciones retenidas. Importar fotos usa Date.now para IDs, sin protección fuerte frente a reloj repetido; emplear UUID y no sobrescritura.

**Corrección propuesta:** referencias de adjuntos en estado activo y archivos internos; conservar los bytes mientras cualquiera los use. Probar copiar/recuperar/eliminar/recuperar y dos importaciones con reloj fijo. No hacer una limpieza masiva de imágenes.

### A4 — Media: compartir no demuestra un respaldo externo guardado

**Comprobado por API/flujo; cancelación nativa pendiente de teléfono:** `saveFile` escribe en caché y espera `Sharing.shareAsync`, cuyo resultado no certifica que otra app guardó el archivo. «Empezar vacío» continúa después de ese diálogo. Se archiva el original internamente, pero no hay garantía de copia externa durable si se canceló Compartir.

Evidencia: `src/services/files.ts:26`, `app/configuracion.tsx`, `src/services/backupService.ts`. Proponer un guardado Android mediante selector de destino que permita comprobar escritura, o separar explícitamente compartir de guardar copia verificada. No presentar caché como respaldo permanente. Cancelar una exportación no debe autorizar una operación destructiva.

### A5 — Media: mensajes de nube y errores en modales

**Comprobado por código:** detalle dice «Pendiente de nube», «Subida pendiente», «Foto en nube» y limpieza remota aun en LOCAL_ONLY. `PhotoImage` propone reabrir con conexión si falta una foto local. En ubicación/recuperación, algunos errores se guardan en el detalle detrás de Sheet; deben mostrarse dentro del modal correspondiente.

Evidencia: `app/obra/[id].tsx:270,277,334`, `src/components/PhotoImage.tsx:37`. No es evidencia de una conexión cloud activa. Cambiar el texto según adaptador sin migrar ni marcar falsamente SYNCED los datos comerciales. En local: «Guardado en este celular», «Foto local», recuperación desde copia.

### A6 — Media: adjuntos externos en un JSON local

**Riesgo por inspección:** la validación admite URI genérico; prepareRestore conserva referencias HTTPS sin bytes locales y PhotoImage puede usarlas como fuente. Una copia importada puede introducir una imagen remota en la edición offline. No se ejecutó una descarga de terceros para demostrarlo.

Evidencia: `src/data/validation.ts` (fotos.uri), `src/services/backupService.ts:74,87`, `src/components/PhotoImage.tsx:23`. La edición local debe importar bytes válidos, conservar referencias no disponibles con aviso o rechazar la copia antes de modificar datos; no cargar recursos externos silenciosamente. Validar tamaño y JPEG real, no solo caracteres base64.

### A7 — Media: mantenimiento de dependencias y firma

El chequeo Expo recomienda estos parches dentro de SDK57: expo~57.0.30, constants~57.0.22, crypto~57.0.4, linking~57.0.13, location~57.0.21, router~57.0.28 y sharing~57.0.23. No se instaló nada ni se concluye que el APK esté roto por estas diferencias.

Auditoría npm: avisos raíz de braces, decode-uri-component, node-forge y uuid, propagados a otras dependencias. Expo/Metro/firma incluyen herramientas de construcción aunque npm las catalogue prod; no es demostración de explotación en el APK. decode-uri-component y la cadena de documentos merecen revisar alcance en runtime. **No usar `npm audit fix --force`: propone, entre otras cosas, Expo44/RN0.72 o cambios de SDK incompatibles.** Evaluar parches/overrides compatibles y repetir comprobaciones.

La variante release usa la clave debug de plantilla (`android/app/build.gradle:115`). Funciona para actualización interna con el mismo certificado, pero no equivale a custodia de una clave privada de la empresa. No rotar la firma ni cambiar el package sobre instalaciones con datos sin diseñar/probar la transición. Los JSON no están cifrados y el nombre no protege el acceso: usar bloqueo del teléfono y copias en una carpeta privada. El manifest habilita allowBackup; documentar/decidir conscientemente el respaldo del sistema Android, no confundirlo con nube de la app ni cambiarlo sin considerar recuperaciones.

### A8 — Media: cobertura nativa e histórica incompleta

`tests/ui/recovery.spec.ts` todavía usa obra_1 y botones «Restaurar copia»/«Copia restaurada» del flujo anterior; no corresponde a la instalación local vacía ni al diálogo actual. Otros recorridos históricos esperan la semilla. No se ejecutaron para hacerlos pasar ni se cuentan como aprobados. Faltan recorridos actuales de fotos, triangulación, combos, daños/recuperación, errores dentro de modales, tamaños de fuente grandes y actualización Android con datos.

La documentación histórica también mezcla prioridades antiguas: `docs/ANDROID.md` abre con1.2.0 y contiene instrucciones de perfiles que ya no son el acceso vigente. `package.json` sigue en1.0.0 aunque app.json/APK son1.2.2. La identidad instalable real la determina app.json/Gradle, pero conviene una única política de versión para evitar entregas mal identificadas.

## Qué ya está y qué no

| Módulo | Estado comprobable |
| --- | --- |
| Inicio vacío, persistencia, JSON normal, revisión/cancelación/deshacer | Implementado, probado unitario y web; faltan casos semánticos y selector Android real |
| Stock/entrega/retiro/reingreso/deshacer | Cubierto en dominio y recorrido local; sin validación de campo Android |
| Triangulación, medidas, daños/pérdidas/recuperaciones, permisos técnicos | Código y pruebas de dominio; faltan recorridos locales ampliados y físico |
| Responsables y formularios | Alta inline probada en web; falta teclado físico/Android y repetición rápida |
| Claro/oscuro/sistema, bienvenida, navegación y logo | Implementados; tema persistente/formulario/Axe probados; no certificación integral de accesibilidad |
| Viaje, GPS/WhatsApp externos y volver al depósito | Código/pruebas de utilidades; apertura/denegación de permisos Android pendiente |
| Word/Excel | Generadores y descargas web probados; Compartir/abrir archivos reales Android pendiente |
| Fotos | Código local y pruebas parciales con mocks; recuperación histórica/borrado y uso nativo pendientes |
| Publicidad | Eliminada de código/configuración/dependencias propias; conservar ausencia |
| APK/respaldos de código | APK completo1.2.2, firma/SHA actuales comprobados; restauración desde GitHub documentada en entrega anterior |
| Firebase/FCM/Storage/Functions, invitaciones multiusuario | Históricos, fuera del cierre local; no desplegados ni necesarios |
| PDF/firma digital/ruta óptima global | No implementados ni necesarios para el cierre individual acordado; firma de recibido en Word es un espacio de firma |

## Modelo económico de cierre

| Necesidad | Solución de costo de infraestructura cero | Límite real |
| --- | --- | --- |
| Operación/datos | APK con base local | Pérdida/desinstalación del teléfono exige copia externa |
| Fotos | Archivos locales comprimidos | Espacio del dispositivo y respaldo; sin subida automática |
| Word/Excel | Generadores JS en el teléfono | Validar tamaño/Compartir y lector externo gratuito |
| Navegación | Enlaces a Google Maps y coordenadas reales | El mapa externo puede necesitar internet/mapas descargados; sin API paga propia |
| Código/instalador | Repositorio privado existente y descargas Git normales | No almacenamiento infinito; evitar LFS/Actions pagos, sin depender de cuotas para operar |
| Construcción | Gradle/JDK/SDK con herramientas locales disponibles | Recursos de construcción disponibles, sin garantía de cómputo cloud perpetuo |
| Respaldo comercial | JSON en almacenamiento externo elegido por el usuario | Guardarlo regularmente y probar restauración; nube personal opcional, no obligatoria |

No conectar un medio de pago ni activar Blaze. No usar EAS/hosting como requisito, ni GitHub Actions de pago. No eliminar fotos por un costo que no existe en almacenamiento local. Una futura sincronización multiusuario cambiaría el alcance y requiere otra evaluación; no prometer que una cuota gratuita externa durará indefinidamente.

## Criterio de terminado

Terminado significa una versión individual Android con hallazgos de integridad cerrados, datos y copias recuperables, todos los recorridos críticos locales aprobados, actualización física conservando datos y manual sin contradicciones. Debe funcionar en modo avión para lo local; GPS/WhatsApp/Maps externos se declaran aparte. Sin cargos de backend, publicidad ni cuentas cloud necesarias. El plan ejecutable está en `docs/superpowers/plans/2026-10-17-cierre-local-gratuito.md`.
