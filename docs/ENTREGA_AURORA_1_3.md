# Repartos Chema 1.3.0 — cierre individual y Aurora

Fecha: 17/10/2026. Alcance vigente: una persona y un dispositivo, inventario local/offline, sin anuncios, servicios facturables ni sincronización entre celulares. Este informe distingue las verificaciones de código/navegador de las pruebas físicas pendientes.

## Base y trabajo preservado

Se partió de `fb5ec6e`, después de leer la auditoría del 17/10, el plan de cierre y el checkpoint. No se encontró AGENTS.md aplicable. Se conservaron Expo Router, dominio, repositorio, logo, cuatro pestañas y generadores institucionales. No se reescribió la aplicación ni se activó Firebase/Cloudflare/hosting.

La base original, el candidato anterior y el código previo a Gradle se empaquetaron fuera del proyecto. Cada ZIP incluye manifiesto SHA256, comprobación CRC y extracción temporal comparando todos los archivos. La firma se preservó fuera del repositorio. El historial y los APK anteriores se mantienen en el repositorio privado.

## Cambios y commits respaldados

| Commit | Bloque | Resultado |
| --- | --- | --- |
| `d26a9ef` | Integridad de importación | Rechaza vínculos, fechas, cantidades recuperadas, reservas y medidas inconsistentes antes de escribir. Conserva lectura del legado. |
| `636781e` | SQLite nativo | Migración no destructiva desde AsyncStorage; transacciones para inventario, recuperaciones y punteros. |
| `deb23ce` | Base ausente | Detecta una SQLite desaparecida; impide volver silenciosamente a un inventario antiguo. |
| `3506b9e` | Aurora y glass | Tokens, componentes y animación compartidos; commit separado de la migración. |
| `e9d0770` | Copias y fotos | Destino externo con lectura de comprobación, cancelación segura, UUID y conservación de fotos para recuperaciones. |
| `6c90f2e` | Compatibilidad y privacidad | Parches compatibles SDK57, versión 1.3.0/code6 y pruebas con datos sintéticos. |
| `1c7bb72` | Revisión de integridad | Recuperación JSON explícita con SQLite bloqueada/ausente, activación fuera de la cuota AsyncStorage y copias realmente importables antes de vaciar. |
| `62e04a4` | Seguridad de URI | Decoder upstream 0.5.0 adaptado a CommonJS, con regresión de entrada malformada que bloqueaba el decoder anterior. |
| `4a82322` | QA y avisos | Amplía recorridos, documentación y elimina el error GPS duplicado dentro de ventanas. Último cambio de runtime del APK. |
| `cd6013a` | Evidencia previa al build | Capturas y pruebas guardadas en main antes de compilar. |

La lista de archivos por bloque está en Git y [aurora-cambios.txt](../artifacts/validacion/aurora-cambios.txt). No se mezclaron cambios de reglas de stock con el rediseño. Los commits documentales posteriores no cambian el runtime de este APK.

Archivos principales: `src/data/{validation,repository,sqliteStorage,migrateLocalStorage,nativeInventoryStorage,localStorage.native}.ts`, `src/services/{files,backupService,photoCache,jpegValidation}.ts` y sus variantes de plataforma; `src/theme/tokens.ts`, `src/components/{AuroraBackground,ui,CardObra,StatusChip,SmartCounter}.tsx`, ThemeContext y hooks de movimiento. Las rutas de alquiler, Ajustes e InventoryContext conectan los flujos. Consultar el manifiesto para los nombres exactos y los tests asociados.

## Integridad, recuperación y fotos

- Las importaciones nuevas pasan validación estructural y semántica antes de guardar. No se intenta reparar stock por inferencia ni mezclar dos inventarios. Cancelar no cambia la base.
- Android individual usa SQLite KV con WAL, sincronización FULL, parámetros y transacciones. Se copian el inventario y las recuperaciones antiguas; AsyncStorage y los archivos originales se conservan. Tema, nombre y preferencias siguen separados.
- El marcador de activación nativo se verifica en archivo temporal y se mueve al destino fuera de la cuota AsyncStorage. Si SQLite falta o falla una migración, no se confirma una base vacía ni se recupera automáticamente una copia vieja.
- La recuperación de una base ausente exige JSON válido y una acción explícita. La exportación asistida del original legacy está rotulada como evidencia antigua, no como copia actual lista para restaurar.
- Android permite elegir carpeta para guardar JSON; solo informa guardado verificado después de releer y comparar bytes. Antes de Empezar vacío también valida que esa copia sea importable. Cancelar, lectura incompleta o fotos faltantes bloquean el vaciado.
- En web el navegador descarga el archivo, pero la aplicación no puede probar que se guardó. Se exige reconocimiento explícito del usuario; no se presenta como verificación de almacenamiento externo.
- Las fotos restauradas usan UUID y no sobrescritura. Quitar una foto del estado activo no elimina bytes que necesita una recuperación retenida. No hay recolección destructiva automática; aumenta el espacio usado con el historial.
- Las copias locales requieren los JPEG completos, válidos, hasta 1024px y 2MB por imagen. Una URI externa no provoca descarga automática en esta edición. Foto ausente muestra instrucciones de recuperación local, no mensajes de nube.

## Aurora, temas y accesibilidad

Identidad rosa `#FF2BD6`, rojo `#FF304F`, violeta `#A100FF`, púrpura `#6E18D9`; base oscura `#08070D`, clara blanca teñida. Los estados comerciales conservan colores semánticos, texto e iconos. Word/Excel conservan el encabezado institucional rojo Chema.

Tokens centralizados de superficies, texto, bordes, estados, tipografía, espaciado, radios, elevación y movimiento. Paneles con alta opacidad, borde delicado, reflejos y profundidad. **El efecto glass usa la alternativa ligera de superficies y reflejos; no incorpora un blur nativo pesado por tarjeta.** No se añadió una biblioteca llamada Aurora.

Dos capas SVG radiales animan transformaciones/opacidad con Animated, ciclo lento de 28s. Se detienen por segundo plano, ruta oculta, preferencia de reducir movimiento o elección estática en Ajustes. Botones tienen respuesta de escala, pestañas indicador animado, tarjetas entrada discreta y ventanas apertura/cierre breve de 160ms. Una ventana en cierre deja de recibir toques inmediatamente. No se retrasa la confirmación comercial para esperar una animación.

Claro/Oscuro/Sistema y la preferencia local se conservan. El botón rápido solo aparece en cabeceras principales. La elección estática se guarda separada del inventario. El cambio de tema conserva formularios abiertos y no crea movimientos de stock.

Se probaron contraste compuesto sobre las auroras de marca, estados, controles y texto, además de Axe en las rutas principales. Los objetivos AA no equivalen a una certificación exhaustiva de accesibilidad ni garantizan lectura bajo cualquier sol. Falta comprobar lector de pantalla, teclado y escala de fuente reales de Android.

## Capturas reales con contenido sintético

Imágenes de la web exportada funcionando, no maquetas. Los datos de prueba se cargan solo en el navegador aislado de Playwright; la instalación nueva del APK continúa vacía.

| Pantalla móvil 390px | Claro | Oscuro |
| --- | --- | --- |
| Ingreso | [Ver](../artifacts/capturas/aurora-390-light-login.png) | [Ver](../artifacts/capturas/aurora-390-dark-login.png) |
| Alquileres | [Ver](../artifacts/capturas/aurora-390-light-alquileres.png) | [Ver](../artifacts/capturas/aurora-390-dark-alquileres.png) |
| Depósito | [Ver](../artifacts/capturas/aurora-390-light-deposito.png) | [Ver](../artifacts/capturas/aurora-390-dark-deposito.png) |
| Viaje | [Ver](../artifacts/capturas/aurora-390-light-viaje.png) | [Ver](../artifacts/capturas/aurora-390-dark-viaje.png) |
| Historial | [Ver](../artifacts/capturas/aurora-390-light-historial.png) | [Ver](../artifacts/capturas/aurora-390-dark-historial.png) |
| Alta | [Ver](../artifacts/capturas/aurora-390-light-nuevo.png) | [Ver](../artifacts/capturas/aurora-390-dark-nuevo.png) |
| Detalle | [Ver](../artifacts/capturas/aurora-390-light-detalle.png) | [Ver](../artifacts/capturas/aurora-390-dark-detalle.png) |
| Combos | [Ver](../artifacts/capturas/aurora-390-light-combos.png) | [Ver](../artifacts/capturas/aurora-390-dark-combos.png) |
| Ajustes | [Ver](../artifacts/capturas/aurora-390-light-ajustes.png) | [Ver](../artifacts/capturas/aurora-390-dark-ajustes.png) |
| Documentos | [Ver](../artifacts/capturas/aurora-390-light-documentos.png) | [Ver](../artifacts/capturas/aurora-390-dark-documentos.png) |
| Entrega abierta | [Ver](../artifacts/capturas/aurora-390-light-entrega.png) | [Ver](../artifacts/capturas/aurora-390-dark-entrega.png) |
| Retiro abierto | [Ver](../artifacts/capturas/aurora-390-light-retiro.png) | [Ver](../artifacts/capturas/aurora-390-dark-retiro.png) |

Escritorio 1440px: [claro](../artifacts/capturas/aurora-1440-light-alquileres.png), [oscuro](../artifacts/capturas/aurora-1440-dark-alquileres.png). [Error GPS dentro de la ventana con campos conservados](../artifacts/capturas/aurora-390-error-gps.png). Hay capturas adicionales de rutas a 390/1440px y verificaciones de desbordamiento a 320/360/768px.

## Pruebas y errores encontrados

Las pruebas de entrega y compilación se registran en `artifacts/validacion/aurora-*.txt`. Los resultados de navegador y análisis son nuevos, sobre la exportación final; Gradle continúa en ejecución.

| Verificación | Evidencia y estado |
| --- | --- |
| Integridad de importaciones | 39 casos: 34 defectos rechazados y 5 copias válidas. Rojo/verde en `cierre-import-*.txt`. |
| Migración/recuperación | SQLite real de Node, más de 7MiB, rollback, idempotencia, fallos de almacenamiento y restauración explícita. No es ejecución de Expo SQLite en teléfono. |
| Revisión independiente | 3 fallos importantes corregidos con regresión; ninguno crítico en esa revisión. `cierre-revision-*.txt`. |
| Decoder URI | Defecto reproducido con worker acotado; 2/2 regresiones verdes. `cierre-uri-decoder-*.txt`. |
| Compatibilidad Expo | `npx expo install --check`: dependencias al día dentro de SDK57. No hubo actualización ciega de Reanimated. |
| Pruebas generales finales | `npm run check`: 175/175 en 21 archivos; tipos, lint y Functions build correctos. Tests: 27.22s bajo compilación concurrente. `aurora-check-entrega.txt`. |
| Web final | `npm run build:web`: correcto, `aurora-web-entrega.txt`. Entry JS de 5.4MB sin comprimir. |
| Recorridos UI finales | `CHEMA_TEST_LOCAL=true npm run test:ui -- --workers=2`: 31/31 en 5.6min. `aurora-ui-entrega.txt`. |
| Gradle ARM64 completo | En ejecución; consultar `aurora-android.txt`. |
| Integración Firebase | No ejecutada en este bloque local. Functions compila, pero no se desplegó ni se considera prueba productiva. |
| Hardware Android | No hay dispositivo ADB ni emulador operativo. Instalación, actualización, permisos y selectores físicos pendientes. |

Primer recorrido Aurora: 11/12, falló un selector con el antiguo nombre del fixture; se actualizó al cliente sintético. Suite amplia anterior: 29/30, detectó el aviso GPS duplicado; se corrigió el componente. El escenario de combos leía antes de que terminara la persistencia: ahora espera el valor confirmado, sin modificar el motor. Aurora/GPS/combos pasaron luego 4/4 en 21.9s. No se ocultan esos fallos iniciales ni se confunden con el resultado final.

Cobertura: inicio vacío, nombre local, material/stock, alta/edición/carga, combos CRUD/fusión, entrega/retiro/reingreso, triangulación, daño/pérdida/recuperación, ajustes, deshacer y permisos de dominio; JSON/cancelación/confirmación, fotos/restauración/reinicio, offline, Word/Excel descargados, temas/sistema/persistencia/formularios, bienvenida, Viaje/GPS y accesibilidad. WhatsApp/Maps, cámara y Compartir requieren además aplicaciones/permisos nativos.

## Seguridad, rendimiento y costo

`npm audit` pasó de 30 a 27 entradas afectadas, 18 altas y 9 moderadas, con 3 avisos raíz. Se corrigió el decoder de URI mediante upstream 0.5.0 MIT y un adaptador CommonJS compatible con query-string7. La procedencia y licencia están en `vendor/decode-uri-component/`.

Quedan avisos transitivos de braces/node-forge en las rutas de herramientas CLI/Metro/build y uuid en consumidores antiguos; las versiones publicadas compatibles no eliminan todos los avisos. ExcelJS usa v4 en el flujo inspeccionado; la alerta uuid trata determinadas APIs de buffer v3/v5/v6. No se declara que todo el paquete sea seguro ni se aplicó `audit fix --force` con degradaciones de Expo/RN. Evidencia: `cierre-dependencias-final.json`. La firma sigue siendo interna de plantilla, no una identidad productiva de la empresa. Custodiar el teléfono y los JSON; no se cifran por usar SQLite o el sandbox.

La configuración Android conserva AutoBackup del proyecto; el sistema puede incluir inventario/fotos conforme a sus reglas y cuenta del dispositivo, excluyendo SecureStore según Expo. No se lo considera un respaldo operativo verificado. No se cambió esa política sensible silenciosamente.

No se añadieron polling, backend, telemetría, fuentes remotas ni desenfoques por fila. Se conserva FlashList y la carga diferida de documentos. El movimiento usa pocas capas y transformaciones/opacidad; son decisiones de implementación, no métricas físicas de mejora. No hay medición fiable de FPS, RAM, batería ni tiempo de inicio en Android. Tampoco se ejecutó un benchmark físico de 1000 alquileres/10000 movimientos.

La operación del APK no requiere cuentas ni infraestructura paga. Fotos, SQLite, Word y Excel son locales. Maps/WhatsApp pueden requerir internet para sus propios contenidos. No se activó facturación, Firebase Blaze, hosting, distribución comercial ni servicios externos. El entorno de desarrollo y GitHub tienen sus propias cuotas; no se promete capacidad gratuita ilimitada o perpetua.

## Entrega y puerta física

El APK, SHA256, comprobaciones y ZIP se incorporarán aquí tras finalizar y verificar el build. Hasta ese momento la versión descargable anterior es 1.2.2; no se presenta el candidato en proceso como archivo listo.

Para validar desde Android, sin PC:

1. En la versión anterior guardar JSON fuera de la app. Descargar el nuevo APK e instalar encima, sin desinstalar ni borrar datos. Verificar nombre, tema, alquileres, cantidades y fotos.
2. Activar modo avión. Crear un alquiler pequeño de prueba, entregar, cerrar y reabrir; retirar y comprobar stock e historial. Cambiar tema con un formulario abierto. No duplicar toques intencionalmente sobre datos reales.
3. Guardar una copia en una carpeta accesible y comprobar que aparece. Cancelar otro guardado: no debe vaciar ni alterar inventario. Probar la restauración solo con una copia conocida y conservación del estado previo.
4. Compartir/abrir Word y Excel en un lector gratuito; probar cámara/galería y permisos, GPS/Maps/WhatsApp por separado. Informar modelo, Android y mensaje exacto si falla, sin desinstalar.

## Estado de finalización

Implementado y probado en código/web: integridad de copias, operaciones cubiertas, temas/Aurora, recuperación de fotos, formularios y documentos web. Implementado pendiente de validación física: migración ExpoSQLite, selector de carpeta/readback, cámara, compartir, actualización sin pérdida, accesibilidad y rendimiento Android. Build/publicación: en ejecución. No se considera cerrada la puerta Android hasta recibir una prueba física satisfactoria. Nube/multiusuario/PDF/Play Store están fuera del alcance individual vigente.


## Recuperación después de la interrupción

El entorno se reinició entre03:42 y03:44UTC; se perdió el workspace previo y no quedó APK1.3 verificable ni log Gradle completo. Se clonó main ce43195 desde GitHub y se recuperaron pruebas/capturas/código sin rehacer el desarrollo. No se conoce la causa del reinicio. No se afirma OOM ni fallo del compilador.

La instalación limpia descubrió un defecto del lock del decoder: un override file solo transitivo dejó un destino relativo dentro de query-string que no existía. Npm ci lo rechazó (EUSAGE); al reconciliar el lock roto también aparecía Invalid Version. Un repro mínimo confirmó la solución: dependencia local directa y override `$decode-uri-component`, con enlace raíz y metadatos reales del paquete local. El decoder y sus APIs no cambian. `npm ci` limpio instaló1560paquetes en2min; regresión consumidor2/2 y check175/175 nuevos correctos. Evidencias aurora-npm-ci-{red,green}.txt, aurora-decoder-ci.txt y aurora-check-restaurado.txt. La reparación se respalda antes de reintentar Gradle.

Los ZIP y el respaldo de firma anteriores eran locales y se perdieron con el entorno; no se presentan como descargas disponibles. GitHub preserva el código y los APK anteriores. Se genera un nuevo ZIP verificado y se comprueba el certificado de la plantilla contra el APK1.2.2 recuperado antes de construir/publicar. JDK21 y SDK/NDK36/27.1 fueron restaurados desde sus distribuciones oficiales, sin servicios pagos.
