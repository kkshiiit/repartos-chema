# Actualización vigente: versión 1.1.0

El rediseño pedido desde Android está documentado y probado en [ENTREGA_1_1.md](ENTREGA_1_1.md). APK definitivo en rama privada descargas, candidato v1.1.0-demo.2. Este informe anterior se conserva como historia; sus referencias a selector de roles y resultados previos no describen la interfaz vigente. Para continuar leer CONTINUIDAD_REDISENO.md.

# Repartos Chema — informe de implementación y entrega

Fecha: 14 de octubre de 2026. Empresa: Grupo Chema Construcciones. Uso exclusivamente interno. Este informe diferencia demo comprobada, código implementado y dependencias productivas pendientes. La misión general no se declara finalizada mientras resten los criterios de aceptación físicos/productivos correspondientes.

## A. Estado inicial y resultado

Se retomó `/workspace/repartos-chema` y la auditoría existente del 13/10. Había una aplicación Expo con dominio, demo, rutas y backend; no se la reescribió. Se preservó primero una copia íntegra del código/configuración/lockfiles/documentación sin secretos ni dependencias regenerables, se restauró y se verificaron hashes. Se estableció Git local y una línea base.

La demo web actual inicia sin credenciales, conserva datos, permite las operaciones probadas, exporta Word y Excel, recupera una copia con fotos, tiene temas claro/oscuro/sistema y ya no incluye publicidad. El backend tiene pruebas contra emuladores, pero no está conectado ni desplegado en Firebase de la empresa. Android/iOS tienen bundles actuales; el resultado del intento de APK se detalla en la sección de compilación.

Los cambios posteriores del usuario prevalecen: cero publicidad reemplaza la solicitud antigua de anuncios pequeños. Retiradas agrupa los estados internos RETIRADO/REINGRESADO. La instrucción de ejecución reemplazó la auditoría de solo lectura. No se eligió una cuenta GitHub ni se publicó código privado.

## B. Cambios y archivos

Las diferencias exactas están en Git (`git diff 5c554c4..HEAD --name-status`) y el árbol en [ARCHIVOS.md](ARCHIVOS.md). Registro por puntos estables: [CAMBIOS.md](CAMBIOS.md).

| Módulo/ruta                                                                              | Cambio principal                                                                                                          |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `src/data/validation.ts`, `repository.ts`                                                | Sobre persistido validado, errores sin reseed silencioso, conflicto durable, archivo preventivo y restauración            |
| `src/domain/{engine,rules,schema}.ts`, `src/types/index.ts`                              | Movimientos recuperables, correcciones, variantes, fechas, revisiones, cantidades y faltantes libres                      |
| `src/context/InventoryContext.tsx`                                                       | Recuperación, error persistido, carga ligada a sesión, sincronización solo en primer plano                                |
| `src/theme/tokens.ts`, `src/context/ThemeContext.tsx`                                    | Paletas propias, preferencia persistente independiente y sistema en vivo                                                  |
| `src/components/{ui,ThemeToggle,PhotoImage,SmartCounter,...}`                            | Temas dinámicos, accesibilidad, errores, foco, contadores, fotos y formularios                                            |
| `app/(tabs)/*`, `app/obra/*`, `app/combos.tsx`, `configuracion.tsx`, `exportar.tsx`      | Operaciones y ajustes, cabeceras compactas, temas, copia de datos y estados claros                                        |
| `src/services/{photoCache*,backupService,files,localDocuments*,exportService,errors}.ts` | Blob/archivo local, backup con fotos, documentos diferidos y errores en español                                           |
| `functions/src/index.ts`                                                                 | Transacción/idempotencia, recibo previo a foto, validación JPEG/ruta, auditoría de deshacer, exportación y reintentos FCM |
| `tests/*`, `tests/ui/*`, configs Vitest                                                  | Regresiones de dominio/persistencia/temas, integración y recorridos reales de navegador                                   |
| `package.json`, lockfile, `app.json`, `.env.example`, `.gitignore`                       | Sin anuncios, dependencias justificadas, tema automático, exclusión de secretos/generados                                 |
| `scripts/package.py`, `build-workers.mjs`, `emulator-local.cjs`                          | Paquete verificable, caché por contenido y proxy limitado a emuladores locales                                            |
| `docs/*`, `README.md`, `artifacts/*`                                                     | Manual, configuración, continuidad, reportes, muestras y capturas actuales                                                |

Eliminados de la aplicación: AdsContext/AdsProvider, AdSlot, AdMobBanner y variantes, adsPolicy, adsRuntime, tests publicitarios, documento PUBLICIDAD, configuración AdMob y `app.config.ts` cuyo propósito era publicidad. La fuente original permanece en el respaldo y en el historial Git por recuperación; no es código activo ni un mecanismo de reactivación.

## C. Errores corregidos y límites

**Corregidos y con evidencia:** conflicto oculto tras reiniciar; corrupción/error de lectura tratados como reinicio; fallos de escritura sin confirmación; falta de salida de stock no vinculado en taller/perdido; medidas de carga incompatibles; entrega efectiva sobrescribiendo planificación; edición obsoleta; recuperación de fotos al restaurar; pérdida de marca de deshacer en auditoría remota; atributo accesible incorrecto del tema; borde oscuro con contraste insuficiente; descarga Word previamente fallida (ahora pasa).

**Mejoras implementadas con validación parcial:** FCM parcial conserva destinatarios aceptados y descarta tokens inválidos; comprobación de JPEG valida cabecera, no hace análisis antivirus ni decodificación completa en backend; exportación nativa JS compila, pero falta abrir/compartir en hardware; fotos pendientes eliminadas no se borran localmente antes de confirmar su alta remota, pero falta una política integral de limpieza de huérfanos.

**Pendientes reales:** FCM nativo y ciclo de cierre de sesión de tokens; transporte callable/Auth real; App Check y límites antiabuso productivos; revisión de avisos de dependencias; archivo/partición del agregado al crecer; teclado/fuentes ampliadas/lectores en Android físico; mejor selector nativo de fechas (se conserva entrada validada AAAA-MM-DD); firma y distribución de una versión móvil validada.

## D. Estado de funcionalidades

| Área                                         | Estado verificable                                                                                                                           |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Demo/sesión ADMIN y OPERADOR                 | Completada y comprobada en web; perfiles explícitamente ficticios                                                                            |
| Obras, búsqueda/filtros, semáforo, Retiradas | Implementada; creación/carga/entrega/reapertura probadas, calendario unitario, rutas visuales verificadas                                    |
| Edición y concurrencia                       | Revisiones implementadas y rechazo obsoleto probado en dominio/backend                                                                       |
| Entrega/retiro/reingreso                     | Dominio y flujo web comprobados, conservación de stock                                                                                       |
| Triangulación, daños y recuperación          | Flujo web y dominio comprobados, origen/destino auditados                                                                                    |
| Reactivación/correcciones/ajustes/medidas    | Implementados con pruebas de dominio; no todos los recorridos combinados se probaron en hardware                                             |
| Galpón y combos                              | Gestión por ADMIN, revisión y fusión implementadas; controles/roles/rutas comprobados, pruebas de dominio                                    |
| Historial/deshacer                           | Ventana 5 min y revisión segura probadas; auditoría remota original marcada al deshacer                                                      |
| Responsables                                 | Lista configurable, separada de cuentas Auth                                                                                                 |
| Fotos                                        | Selección web, compresión, IndexedDB, copia/restauración/reinicio comprobados; cámara nativa pendiente física                                |
| Viaje/GPS/WhatsApp                           | Lista y enlaces implementados, sin coordenadas inventadas; permisos/GPS real y apps externas pendientes físicos                              |
| Word/Excel                                   | Descarga web y generación privada en Storage Emulator comprobadas; móvil implementado sin validación física                                  |
| Copia/recuperación                           | Archivo con fotos, validación, IDs nuevos y copia previa; pruebas unitarias y navegador aprobadas                                            |
| Temas                                        | Claro/oscuro/sistema, acceso rápido, persistencia y borrador conservado comprobados en navegador                                             |
| Nube offline-first                           | Cola durable y conflictos probados con adaptadores; transacciones backend emuladas. Producción bloqueada por configuración y validación real |
| FCM                                          | Eventos y código web/backend; envío real no configurado ni probado. Nativo pendiente                                                         |
| PDF/firma digital/mapa nativo                | No implementados; Word con firma manuscrita prevista y lista GPS son alternativas explícitas del alcance                                     |
| Publicidad                                   | Eliminada de fuente/dependencias/configuración y bundles regenerados                                                                         |

No se calcula un porcentaje: compilar o tener una ruta no demuestra todos los escenarios operativos.

## E. Eliminación de publicidad

`npm ls react-native-google-mobile-ads --all` devuelve árbol vacío (exit 1 de npm al no encontrar el paquete). Búsqueda de identificadores publicitarios propios en app/src/backend, manifiestos, entorno y bundles nuevos: sin coincidencias. No quedan banners ni contenedores reservados en Obras/Galpón/Configuración. Se conservan avisos de faltantes y mensajes operativos.

## F. Temas y accesibilidad

Paleta clara: superficies blancas/neutras y texto oscuro; paleta oscura: fondo #0F172A y superficies oscuras. Rojo #D32F2F permanece como marca. Los estados incluyen texto: verde al día, amarillo hoy, rojo vencido, violeta pendiente, neutro retirado, azul inventario y naranja daño.

El botón de sol/luna en cabeceras y modales alterna con un toque. Si se seguía Sistema, crea una selección manual del opuesto visible. Configuración recupera Seguir sistema. `chema:theme:v1` se guarda separado del inventario; ningún movimiento ni cola cambia por tema. La lectura inicial evita montar pantallas con una preferencia conocida incorrecta. Web sigue cambios de `prefers-color-scheme`; nativo usa `useColorScheme`, StatusBar y SystemUI.

Las pruebas comprobaron cambio en vivo, persistencia tras recarga, navegación y textos de formulario/modal intactos, además del inventario sin cambios. Los tokens pasan contrastes AA indicados en VALIDACION. No se certifica accesibilidad integral ni visibilidad bajo todo brillo solar. Falta prueba física con texto grande y TalkBack/VoiceOver.

Comparativas actuales:

- [Obras móvil claro](../artifacts/capturas/390-light-obras.png) / [oscuro](../artifacts/capturas/390-dark-obras.png).
- [Obras escritorio claro](../artifacts/capturas/1440-light-obras.png) / [oscuro](../artifacts/capturas/1440-dark-obras.png).
- `artifacts/capturas/`: Login, Obras, Galpón, Viaje, Historial, Nueva obra, Detalle, Entrega, Retiro, Combos, Configuración y Exportaciones en ambas paletas y dos tamaños.

## G. UI/UX

Se compactaron cabecera, métricas y filtros móviles; se mantuvieron cuatro pestañas y acciones secundarias fuera de la navegación principal. Se reforzó texto de saldo real frente a carga histórica, confirmaciones de ajustes, mensajes de error en formularios, estados busy y etiquetas accesibles. Las listas se mantienen detrás de DataList/FlashList compatible.

Se probaron anchos 320/360/390/768/1440 sin scroll horizontal accidental del documento. Las bandas de filtros/métricas tienen desplazamiento horizontal intencional. Pantallas largas requieren desplazamiento vertical. No se rediseñó desde cero ni se añadió una capa de estilos incompatible.

## H. Rendimiento

Documentos pesados se cargan al exportar. Las fotos nuevas web son Blob en IndexedDB, no base64 dentro de cada snapshot de inventario. Se conserva un solo inverso vigente. Polling de sincronización en primer plano y reloj del historial solo con esa pantalla activa; la caché offline usa hashes del contenido. Consultas de perfiles para avisos se agrupan en backend.

Medición de archivos de la exportación web del 14/10: entry principal **5.370.584 bytes**, JS total **7.477.489 bytes**, archivos totales **7.499.124 bytes**, sin compresión de transporte. La medición anterior del entry era 6.346.672 bytes; no se atribuye toda la diferencia a una sola corrección. Bundles Hermes Android/iOS ~11 MB cada uno; no son medidas de RAM.

No se midieron FPS, batería, memoria, arranque en gama baja ni latencia de producción. La duración de suites no equivale a latencia de usuario. El agregado limita 200 obras/300 materiales/750 KB; requiere una estrategia de archivo y partición antes de crecer. No se hizo una migración riesgosa por rendimiento.

## I. Seguridad

RBAC en dominio y backend, correo verificado en producción, escrituras directas de inventario/roles bloqueadas, transacciones y recibos UID+hash, documentos privados por propietario y vencimiento, JPEG limitado y rutas exactas, secretos excluidos de Git. No se almacenan contraseñas en texto plano. El perfil demo no autentica usuarios reales.

Riesgos pendientes: avisos transitivos npm (30 app y 9 Functions, detalle en VALIDACION), tokens de acceso de fotos, dispositivos compartidos con FCM, perfil offline revocado hasta reconectar, falta de pruebas productivas multiusuario y antiabuso. No hay afirmación de seguridad absoluta ni reglas debilitadas para pasar pruebas.

## J. Pruebas y compilación

[VALIDACION.md](VALIDACION.md) contiene comandos, cobertura y límites. Últimos resultados: **74 unitarias/documentos, 14 integración y 19 Playwright aprobadas**; typecheck, lint, Functions y web correctos. Capturas regeneradas. Android/iOS exportados a Hermes. Todo ejecutado con datos semilla y emuladores.

El intento de APK usa Java21, Gradle9.3.1, SDK36, NDK27.1.12297006 y ARM64. Hubo fallo inicial del proxy Gradle y timeouts de SDK; se aplicó descarga reanudable verificada. La compilación final terminó correctamente; ver el cierre de compilación de este informe. No se ejecutó una app en dispositivo físico, ni se generó IPA en macOS.

## K. Entrega y uso

- Respaldo original: `/workspace/respaldos/chema-original-20261013/repartos-chema-original.zip`, 92 archivos, restauración y SHA correctos.
- Puntos fuente verificados: `/workspace/entregas/puntos-control/repartos-chema-c634908.zip` y `repartos-chema-1436419.zip`, con SHA y acta de restauración.
- Fuente vigente: `/workspace/repartos-chema`; paquetes finales y hashes en `/workspace/entregas/` según el cierre.
- Web: `dist/`. Capturas/muestras: `artifacts/`. Manual: MANUAL_USUARIO. Configuración productiva: FIREBASE. Estado persistente: CONTINUIDAD_CODEX.

Instalación reproducible para el entorno técnico que aloje la demo:

```bash
npm ci
npm --prefix functions ci
cp .env.example .env
npm run check
npm run build:web
npm run preview
```

Demo no necesita valores Firebase. Las variables `EXPO_PUBLIC_FIREBASE_*` se completan únicamente con la configuración real cuando se habilite producción; las credenciales administrativas nunca van en el cliente. Functions Node22; herramientas de desarrollo Node22.13+ o24.3+. Para código móvil: `npm start` con cliente Expo compatible o development build; una exportación Hermes no se instala directamente.

Desde Android puedes descargar los paquetes del chat. No necesitas mantener tu computadora encendida para conservar esta entrega, pero debes guardar una copia externa: no se ha garantizado retención indefinida del workspace. No existe URL pública verificada; localhost remoto no es accesible desde tu celular. No se publicó ningún sitio ni repositorio remoto.

## L. Estado final y próximos pasos

**Completado y comprobado en el alcance de pruebas:** respaldo recuperable, versionado local, demo web persistente, operaciones ensayadas, temas, eliminación de anuncios, recuperación con fotos, documentos web y emulados, suites y build web.

**Implementado pendiente de validación:** rutas nativas de fotos/archivos/GPS/SecureStore/háptica, generación y compartir documentos en móvil, preparación Firebase, reintentos FCM y algunas combinaciones operativas fuera de los recorridos ensayados.

**Bloqueado por configuración externa:** usuarios reales, proyecto Firebase, IAM/CORS/FCM/APNs, pruebas físicas multiusuario, firma/distribución y despliegue autorizado. No se solicitaron credenciales para completar trabajo independiente.

**Pendiente de desarrollo:** puente FCM nativo y ciclo completo de tokens/primer plano, selector nativo de fechas más cómodo, estrategia de archivo/partición cuando crezca el agregado, tratamiento de huérfanos y mejoras derivadas de pruebas físicas.

Para continuar: leer CONTINUIDAD, comprobar Git y respaldo, revisar resultado APK, completar pendientes nativos, configurar Firebase solo con autorización y datos reales, ejecutar pruebas de dos usuarios/dispositivos antes de usar datos comerciales. No rehacer la app, no añadir publicidad, no reintroducir Cerradas, no publicar ni gastar sin permiso. No hay reanudación automática del workspace verificada; el trabajo solo avanza durante ejecuciones activas.

## Validación adicional de accesibilidad (14/10, 19:30 UTC)

Se añadió @axe-core/playwright solo como dependencia de desarrollo. Detectó y se corrigieron el contenedor tablist/estado seleccionado de navegación y el foco de teclado de métricas desplazables. Los dos recorridos axe, ocho pantallas en claro y oscuro, pasaron sin infracciones detectadas en las reglas WCAG A/AA seleccionadas. La suite completa actual pasó 19/19. No sustituye prueba con lectores de pantalla o teclado en dispositivos físicos. Reportes en `artifacts/validacion/axe-*.json`.

## Corrección visual adicional

La revisión manual detectó que el detalle podía recortar controles en móvil aunque el documento no aumentara de ancho. Se corrigió flexShrink/maxWidth de ambas columnas y se añadió comprobación de los límites de Preparar carga, Documento y Ubicación en cada ancho/tema. La suite posterior aprobó 19/19 (4,6 min), con verificación de los controles a 320, 360, 390, 768 y 1440 px en ambos temas; captura de detalle móvil revisada. También se excluyeron micrófono y superposición de ventanas de los permisos Android: la aplicación solo captura fotos y no necesita esos accesos.

## Cierre de compilación y respaldo — 14/10, 22:25 Argentina

APK real generado: `instalador/repartos-chema-demo-arm64.apk`, 49.078.452 bytes, Android 7+ (SDK24), ARM64, paquete com.grupochema.repartos, versión1.0.0. Gradle terminó código0 en11m10. Firma APKv2 verificada por apksigner, CRC correcto, SHA256 c906e5646918ea3f1c12e1015c6b475fd5989d84f2fb283eb25ef39d5a2401c5. Permisos finales sin RECORD_AUDIO, SYSTEM_ALERT_WINDOW ni AD_ID. La firma utiliza clave de prueba de la plantilla: sirve para probar esta demo interna, no sustituye firma productiva administrada. No se ejecutó en dispositivo físico; instalar no acredita cámara, exportaciones nativas, GPS ni todos los procesos. No se publicó en ninguna tienda.

La hora objetivo de21:00 no se cumplió. Se entrega demo local, sin Firebase productivo y sin trabajo automático entre sesiones. Suite final web19/19 en4,6min; check74 pruebas/tipos/lint/Functions y web correctos, integración previa14/14. Captura de detalle móvil revisada sin recorte.

Usuario autorizó respaldo GitHub privado en kkshiiit. MCP GitHub accede a repositorios, pero no tiene creación disponible; CLI no tiene credencial válida. No existe Repartos Chema entre repositorios accesibles. Se solicitó crear kkshiiit/repartos-chema privado con README y compartir enlace. No se subió código ni se publicó aplicación.

Carpeta preparada en `/workspace/entregas/Repartos-Chema`; no equivale a carpeta creada en la PC del usuario. El ZIP contenedor permite extraerla en Documentos. Contiene código, historial Git bundle, copia original, web, documentación, capturas y APK. Para datos comerciales usar también copias JSON desde Configuración: la copia de código no respalda automáticamente datos guardados en cada dispositivo.

## Actualización del respaldo GitHub — 15/10

El usuario creó kkshiiit/repartos-chema privado. Se subió main con el historial completo sin force push; el commit remoto b691e525ee7f7f203ebac50ee2a787c648d589e1 coincidió con el local después del reinicio del entorno. La revisión de historial y los commits posteriores no encontró credenciales reconocibles; .env.example contiene solo campos de configuración. No se configuraron workflows ni despliegues. Los bloqueos de creación descritos antes son antecedentes resueltos mediante creación manual por el usuario. La fuente se restauró mediante clonación independiente y git fsck correcto. La subida adicional de APK/ZIP a Releases falló con HTTP401 de uploads.github.com; releases consultados después: lista vacía. Los binarios continúan disponibles en la entrega del chat, no en GitHub.

## Entrega adicional del APK en GitHub

Tras informar el usuario que no podía descargar desde el chat, se guardó el APK en la rama privada `descargas`. [Descargar APK](https://github.com/kkshiiit/repartos-chema/raw/refs/heads/descargas/android/v1.0.0-demo.1/repartos-chema-demo-arm64.apk). GitHub confirma49.078.452bytes; restauración independiente mediante Git, SHA256 y CRC coincidentes. Rama main conserva el código. Releases sigue sin activos y el ZIP completo permanece en la entrega local. No se desplegó la app ni se activaron servicios Railway/Firebase. La prueba física Android sigue pendiente.
