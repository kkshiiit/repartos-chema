# Plan de implementación — cierre local gratuito de Repartos Chema

> **Para continuar:** usar `superpowers:executing-plans` e implementar las tareas por orden. No iniciar subagentes ni servicios externos por defecto. Este documento es un plan; las casillas no indican cambios ya ejecutados.

**Objetivo:** cerrar una edición individual Android estable, recuperable y sin costo de infraestructura, preservando datos de las versiones instaladas.

**Arquitectura:** conservar Expo Router, componentes, motor de operaciones y Repository. Reforzar validación de copias; introducir almacenamiento SQLite nativo detrás del contrato existente, con migración defensiva. Fotos y documentos permanecen locales; no activar nube.

**Stack:** Expo57/RN0.86/React19/TypeScript6, Zod, Vitest, Playwright, Expo FileSystem/Sharing/DocumentPicker y, en la tarea de persistencia, expo-sqlite en versión seleccionada por Expo57.

**Especificación y evidencia:** [auditoría 17/10/2026](../../AUDITORIA_LOCAL_2026_10_17.md), [continuidad](../../CONTINUIDAD_CODEX.md), [manual local](../../USO_LOCAL_ANDROID.md). Prevalece el alcance individual actual sobre las antiguas peticiones multiusuario.

## Restricciones globales

- Una persona/un celular; instalación nueva vacía y actualización que conserva datos.
- Cero publicidad, Firebase/Cloudflare/servicios pagos como dependencia operativa; sin activar Blaze, EAS pago, hosting ni Play Store.
- No cambiar framework ni reescribir dominio. No inventar datos, ubicaciones o credenciales.
- No borrar originales, historial, fotos o copias para resolver un error. No mezclar inventarios al importar.
- Mantener IDs/idempotencia, cantidades enteras no negativas y la clave legacy `chema:demo:v1` para migración.
- Conservar Claro/Oscuro/Sistema, control rápido solo en cabeceras principales, Retirados agrupado y ausencia de AD/anuncios.
- Commit y push main por bloque, aproximadamente cada10min de trabajo activo, siempre antes de compilar. No force push.
- Firma/package existentes no se cambian automáticamente. Nuevos APKs versionados en descargas, versiones anteriores intactas.
- Pruebas Android físicas necesarias antes de declarar terminada la edición. No confundir navegador, mocks o APK firmado con funcionamiento físico.

## Casos de revisión que deben quedar cubiertos

1. JSON con cantidades aparentemente válidas pero vínculos/fechas/faltantes inconsistentes: rechazo legible antes de cualquier escritura.
2. Cierre/fallo de escritura en migración/importación/archivo: se conserva íntegro el último inventario confirmado y una recuperación utilizable.
3. Cancelar selector o Compartir: no afirmar respaldo guardado ni proceder por ese motivo a vaciar inventario.
4. Foto borrada después de una recuperación y posterior regreso a una copia retenida: no perder los bytes que esa copia necesita.
5. Actualizar una app con datos/importados, tema manual y nombre: todo persiste sin desinstalar ni activar servicios remotos.

---

## Tarea 0 — Línea base recuperable

**Archivos:** documentación/evidencias de esta auditoría y `docs/CONTINUIDAD_CODEX.md`; no cambiar runtime.

**Interfaces:** conservar las rutas actuales de APK, SHA y ZIP; no generar otra compilación solo para documentar.

- [ ] Revisar git status/log/ls-remote, este plan y el checkpoint; integrar cambios remotos si existieran, sin reset ni force.
- [ ] Verificar respaldo fuente y APK1.2.2 (`43835da902859f6c5af77947d315fb8ec2922d9921cebe558948460b0f1ba8eb`), y preservar la firma actual fuera del código versionado.
- [ ] Generar nuevo ZIP de la base con `python3 scripts/package.py /workspace/entregas/cierre-local` si corresponde al HEAD actual; comprobar manifest/restauración. No sobrescribir ZIPs anteriores.
- [ ] Anotar commit base y pruebas actuales. Mantener los datos comerciales reales de fixture en privado; no usarlos para nuevas capturas públicas.

**Aceptación:** código limpio/base identificada, respaldo restaurable y original conservado. No requiere autorización ni gasto externo.

## Tarea 1 — Rechazar copias semánticamente inconsistentes

**Modificar:** `src/data/validation.ts`, `src/services/backupService.ts`, `src/components/BackupImport.tsx` si hace falta mostrar diagnóstico.
**Pruebas:** ampliar `tests/import-json.test.ts`, `tests/backup.test.ts`; nuevo `tests/import-integrity.test.ts` con datos sintéticos.

**Interfaz nueva:** `validateImportEnvelope(e: Envelope): void` en validation.ts, invocada por inspectBackup antes de devolver una selección válida. No renombrar `inspectBackup`, `prepareRestore` ni sus resultados actuales.

- [ ] Escribir pruebas rojas: carga con material inexistente; combo duplicado/componente inexistente; recuperado>cantidad; reservas de taller/perdido superiores al stock; medida distinta del maestro; retiro anterior a entrega; retiro efectivo anterior a entrega efectiva. Cada una debe rechazar la importación y conservar exportRaw/archivos de fotos exactamente iguales.
- [ ] Añadir casos válidos: alquiler vencido con retiro anterior a hoy, entrega efectiva distinta de la planificada, falta libre sin materialId y BOM UTF8 real. No rechazar un alquiler por estar vencido.
- [ ] Ejecutar `npx vitest run tests/import-integrity.test.ts` y verificar que los casos de defecto fallan por aceptación incorrecta, no por errores de importación del test.
- [ ] Implementar validación de IDs/referencias/fechas/medidas/recuperaciones y errores en español. No inferir equivalencias físicas ni recalcular stock para reparar una copia inválida.
- [ ] Mantener bases legacy legibles: no aplicar validación nueva al arranque sin estrategia de diagnóstico/recuperación. Si se detecta legado incompatible, conservar original y permitir exportación asistida; no reiniciar vacío.
- [ ] Repetir tests específicos y `npm run typecheck && npm test`. Commit/push de este bloque con evidencia y checkpoint.

**Aceptación:** los cuatro defectos reproducidos A1 quedan rechazados y las copias válidas anteriores siguen importándose sin perder información.

## Tarea 2 — Persistencia nativa para uso prolongado, sin el límite agregado AsyncStorage

**Crear:** `src/data/localStorage.ts` (web/default), `src/data/localStorage.native.ts`, `src/data/sqliteStorage.native.ts`, `src/data/migrateLocalStorage.native.ts`.
**Modificar:** `src/context/InventoryContext.tsx`, y `src/data/repository.ts` solo donde se necesite el catálogo/consistencia de archivos; package.json/lockfile.
**Pruebas:** `tests/storage-migration.test.ts`, `tests/repository.test.ts`, validación nativa en tarea6.

**Interfaces:** `SqliteStorage implements KeyValueStorage` conserva `getItem(key):Promise<string|null>`/`setItem(key,value):Promise<void>`. `migrateLocalInventory(legacy: KeyValueStorage & {getAllKeys(): Promise<readonly string[]>}, target: SqliteStorage): Promise<void>` copia las claves de inventario y archivos internos antes de marcar migración terminada. El proveedor debe esperar a que finalice antes de permitir operaciones.

- [ ] Escribir pruebas rojas de migración idempotente, preservación de clave original/archivos, cierre tras cada escritura y falta de espacio. La segunda ejecución debe recuperar exactamente el último estado confirmado; jamás alternar silenciosamente a vacío.
- [ ] Instalar únicamente `npx expo install expo-sqlite` para SDK57; revisar cambios de lock y compatibilidad. No cambiar de SDK para conseguir esta librería.
- [ ] Implementar tabla KV local con transacciones, parámetros SQL y marcador de migración. Copiar todas las claves `chema:demo:v1` y sus recuperaciones; comprobar lectura/contenido antes de cambiar adaptador. No eliminar las claves AsyncStorage originales en esta entrega.
- [ ] Mantener web con el adaptador actual y tema/nombre/depósito en su almacenamiento separado. Una migración fallida impide escrituras nuevas y ofrece recuperación/exportación del original, no crea bases divergentes.
- [ ] Inventariar archivos internos con IDs UUID y fecha/tamaño/origen para que el usuario pueda identificarlos. No añadir retención destructiva automática ni podar appliedIds/logs. Si se añade limpieza explícita, dejarla fuera de este bloque hasta tener exportación verificada y consentimiento concreto.
- [ ] Probar con datos sintéticos: más de6MiB de inventario+recuperaciones en SQLite, lecturas tras reinicio y fallo de commit. Son pruebas de capacidad del adaptador; medir consumo/latencia en Android, no deducirlos de Node.
- [ ] Ejecutar pruebas de repositorio/migración y suite base; commit/push antes de compilar la parte nativa.

**Aceptación:** no depende del máximo de6MB de AsyncStorage para negocio; migración no destructiva y reanudable, origen restaurable. La interfaz de operaciones e IDs sigue igual. Si la prueba física revela incompatibilidad, conservar la base anterior y no distribuir la migración.

## Tarea 3 — Respaldo externo verificable y recuperación de fotos

**Modificar:** `src/services/files.ts`, `backupService.ts`, `photoCache.ts`/`.web.ts`, `app/configuracion.tsx`, `app/obra/[id].tsx`; catálogo introducido en tarea2.
**Pruebas:** ampliar `tests/files-native.test.ts`, `backup.test.ts`, `local-start.test.ts`; nuevo `tests/photo-recovery.test.ts`.

**Interfaz nueva:** `saveBackupToDestination(bytes: Uint8Array): Promise<{saved:boolean; uri?:string}>`, nativa con destino elegido por el usuario. `saveFile` sigue sirviendo para Compartir documentos; no confundir ambos resultados. Directory.pickDirectoryAsync y creación/escritura de archivos existen en la versión instalada; confirmar soporte content-URI/readback/cancelación en Android antes de elegir esa vía definitiva.

- [ ] Pruebas rojas: cancelar destino no cambia inventario; cancelar Compartir no cuenta como copia verificada; error/escritura incompleta no permite Empezar vacío. Mantener el original ante cada fallo.
- [ ] Implementar guardado explícito fuera de caché, con lectura/comparación o hash después de escribir. Mostrar destino y resultado. El usuario puede seguir compartiendo, pero no se afirma que otra aplicación haya guardado una copia.
- [ ] Probar archivo interno con foto → recuperar → borrar foto del estado activo → recuperar archivo antiguo: la foto debe seguir disponible. Probar también importación fallida a mitad de fotos y dos importaciones con Date.now fijo.
- [ ] Usar UUID y no sobrescritura para fotos restauradas. Separar quitar referencia activa de borrar bytes: mientras una copia retenida los necesite, conservarlos. No eliminar archivos huérfanos a ciegas.
- [ ] En LOCAL_ONLY, una imagen externa sin bytes no debe provocar peticiones automáticas. Validar JPEG/tamaño real; rechazar antes de escribir o mantener referencia no disponible con explicación, sin perder el original.
- [ ] Ejecutar regresiones de copias/fotos y UI JSON; commit/push.

**Aceptación:** cancelación segura, copia externa comprobable y recuperación completa de inventario/fotos. Compartir físico sigue siendo una puerta de validación en tarea6.

## Tarea 4 — Coherencia local, errores visibles y cobertura de uso diario

**Modificar:** `app/obra/[id].tsx`, `src/components/PhotoImage.tsx`, formularios que muestren errores fuera de Sheet; docs de Android/manual.
**Pruebas:** actualizar `tests/ui/recovery.spec.ts`, `operations.spec.ts`, `themes.spec.ts`, `welcome.spec.ts`, helpers y escenarios individuales; no introducir semilla en producción.

**Interfaces:** conservar dominio/acciones. Mensajes según LOCAL_ONLY/DATA_MODE; no cambiar syncStatus del dato para lograr un texto correcto.

- [ ] Prueba roja: alquiler/foto local nunca dice Pendiente de nube/Subida pendiente/Foto en nube/Confirmado por servidor. Una foto ausente pide recuperar copia local.
- [ ] Prueba roja: denegar GPS y fallar recuperación muestra aviso dentro del modal abierto, accesible y sin borrar campos. Comprobar busy y que un toque repetido no duplique operaciones.
- [ ] Implementar solo esas correcciones visuales/funcionales. Conservar temas, logo, bienvenida, cuatro pestañas y filtro Retirados agrupado; no abrir un rediseño.
- [ ] Cambiar recorridos históricos para crear datos sintéticos por flujo/UI o importación de fixture anonimizada, y usar Confirmar importación. No contar obra no encontrada como un detalle completo validado.
- [ ] Completar recorridos locales de combos, triangulación, daños, recuperación parcial, ajustes auditados, medidas y deshacer dentro/fuera de5min. Comparar totales antes/después y origen/destino.
- [ ] Validar 320/360/390/768/1440px, claro/oscuro/sistema, fuente ampliada, teclado, menús y modales con alquileres cargados. Capturas nuevas; automatización Axe más lectura manual, sin afirmar certificación total.
- [ ] Actualizar manual/ANDROID.md para local y versión vigente; marcar instrucciones cloud antiguas como históricas. Commit/push del bloque.

**Aceptación:** ninguna función local promete nube; errores operativos visibles y suite UI actual, sin dependencias de alquileres ficticios iniciales.

## Tarea 5 — Parches compatibles, privacidad y rendimiento medido

**Modificar:** package.json/lock, configuración solo si las verificaciones lo justifican; fixtures sintéticos, scripts de versión y documentos. No cambiar certificados automáticamente.

- [ ] Actualizar los siete parches SDK57 detectados con Expo, sin migrar framework. Ejecutar install --check, typecheck, lint, unitarias y UI; conservar lockfile y registrar versiones finales.
- [ ] Analizar los cuatro avisos raíz npm, sus rutas de runtime/build y correcciones compatibles. No usar audit fix --force ni downgrades Expo44/RN0.72. Verificar también código preempaquetado de ExcelJS: un override del lock no prueba por sí solo que un bundle vendorizado cambió.
- [ ] Sustituir para pruebas futuras datos comerciales identificables por sintéticos y excluir fixtures comerciales de ZIPs distribuibles futuros. No reescribir historial ni borrar copias antiguas sin autorización; repositorio sigue privado.
- [ ] Documentar custodia de firma actual y protección del teléfono/JSON. Evaluar AutoBackup Android conscientemente; no cambiar permisos o políticas sensibles sin explicar su efecto en la recuperación. Nada se considera cifrado por usar el sandbox de la app.
- [ ] Medir inicio, operaciones/listas y exportaciones en datasets sintéticos pequeños y de1000alquileres/10000movimientos en un dispositivo de referencia disponible. Registrar tamaño y hardware. No inventar FPS o metas logradas. Si hay bloqueo real, optimizar búsquedas/cálculos y lectura de miniaturas antes de más refactorizaciones.
- [ ] No introducir polling/nube/telemetría ni recursos pesados. Mantener carga diferida de documentos y fotos fuera del JSON de negocio.
- [ ] Alinear la política de versiones app/package/scripts sin alterar el formato comercial. Commit/push, registro de avisos corregidos o excepciones justificadas por alcance.

**Aceptación:** compatibilidad Expo explicada, dependencias con alcance revisado, sin nuevos accesos externos obligatorios; optimizaciones sustentadas por una medición repetible. Alertas no corregibles de build deben estar documentadas, no ocultas.

## Tarea 6 — Puerta Android física y entrega final

**Archivos:** pruebas/evidencias, scripts de construcción/verificación, `docs/USO_LOCAL_ANDROID.md`, `docs/CONTINUIDAD_CODEX.md`, informe final y rama descargas.

- [ ] Ejecutar `npm run check`, build:web y suite UI local actualizada. No contar integraciones Firebase omitidas como aprobadas ni bloquear el cierre individual por desplegarlas.
- [ ] Push main y ZIP fuente restaurado antes de compilar. Seleccionar siguiente versión libre (seleccionada1.3.0/code6 por el bloque Aurora; comprobar main/descargas primero). Compilación Gradle ARM64 completa con el script actual y mismo package/certificado.
- [ ] Verificar firma, certificado contra1.2.2, versión, permisos, ABI, CRC/SHA y ausencia de publicidad/configuración cloud activa. Mantener versiones previas.
- [ ] En teléfono real: copia JSON previa y actualización encima; conservar alquileres/stock/fotos/tema/nombre y probar migración. Si no hay dispositivo remoto conectado, el usuario solo instala y devuelve el resultado desde Android; no pedirle terminal ni PC.
- [ ] Recorrido físico en modo avión: crear material/stock/alquiler, carga/combos, entregar/repetir toque, cerrar forzadamente/reabrir, retirar con daño/pérdida, recuperar, triangular, reingresar/reactivar, ajustar y deshacer con conteo consistente. Para GPS/Maps/WhatsApp probar permisos/apertura por separado y explicar que su contenido externo puede necesitar red.
- [ ] Probar cámara/galería/compresión, JSON con selector/cancelación/confirmación, copia externa, restauración y Word/Excel compartidos y abiertos en un lector gratuito. Usar entorno/perfil de prueba para restauración limpia, sin borrar la única instalación con datos reales.
- [ ] Publicar APK único+SHA+fuente en descargas y recuperar desde GitHub en repo independiente. Verificar hashes/CRC/restauración; documentar teléfono/Android y cualquier limitación.
- [ ] Manual corto, checklist de respaldo y resultado de cada puerta; actualizar checkpoint y push final. No declarar misión terminada si una puerta de integridad o actualización física falla.

**Aceptación final:** operaciones principales y actualización probadas en Android, inventario consistente, copias recuperables, fotos/documentos locales, temas completos, cero anuncios y cero backend facturable necesario. Toda prueba pendiente debe quedar identificada; sin porcentajes inventados ni promesas de continuidad automática.

## Dependencias, costos y decisiones excluidas

No hay pago requerido para estas tareas de software: SQLite, Expo nativo, generadores de documentos y Gradle son herramientas locales. Se aprovecha el entorno/GitHub ya disponibles, sin activar facturación. No se garantiza disponibilidad gratuita perpetua de cómputo cloud de desarrollo, almacenamiento ilimitado de GitHub ni tarifas de conexión móvil. El uso diario del APK no depende de esos servicios.

Quedan fuera del cierre individual: sincronización multiusuario, invitaciones remotas, FCM, exportación servidor, proveedor de mapas pago, PDF automático, publicación en Play Store y modificaciones de infraestructura productiva. No borrar el código histórico de esas integraciones como parte de una limpieza rutinaria; mantenerlo desacoplado/inactivo.

La tarea0 preserva; las tareas1–3 protegen datos; la4 cierra los recorridos; la5 estabiliza; la6 valida y entrega. Si no hay teléfono para la última puerta, terminar todo lo independiente y dejar esa validación pendiente con instrucciones concretas, sin gastar para simular que se hizo.


## Ejecución actualizada — cierre + Aurora 17/10/2026

El usuario autorizó explícitamente el rediseño integral después de este plan. Sustituye la restricción de no rediseñar en tarea4. [Especificación visual](../specs/2026-10-17-aurora-local.md). Se conserva el plan para trazabilidad; las casillas anteriores son la lista original, y esta tabla registra el estado real.

| Tarea | Estado comprobado | Evidencia/límite |
| --- | --- | --- |
| 0 Base | Completada | fb5ec6e, ZIP original/restaurado, firma preservada, main/descargas verificados. |
| 1 Copias | Implementada y probada | d26a9ef + defensa en datos1c7bb72,39casos. |
| 2 SQLite | Implementada y probada con SQLite Node | 636781e/deb23ce/1c7bb72; >7MiB, rollback, guard y recuperación; falta ExpoSQLite físico. |
| 3 Respaldo/fotos | Implementada y probada código/web | e9d0770/1c7bb72; destino nativo mediante dobles de prueba; falta selector/readback físico. |
| 4 Coherencia | Completada en web | 31/31, error dentro del modal, datos sintéticos, Word/Excel,320–1440px. Accesibilidad/teclado nativos pendientes. |
| 5 Compatibilidad | Parches y revisión completados | Expo check correcto; decoder corregido,27avisos transitivos restantes documentados. Sin benchmark físico ni métricas inventadas. |
| Visual Aurora | Implementado y probado en web | 3506b9e; tokens compartidos, claro/oscuro/sistema, glass ligero, movimiento adaptable; capturas reales. |
| 6 Entrega | APK y respaldos comprobados; puerta física pendiente | Gradle1.3.0 completo14m46s, firma/ABI/CRC y mismo certificado1.2.2. Descargas53b4ad9, APK y ZIP381archivos restaurados desde GitHub. Falta Android físico; no recompilar por documentación. |

Informe vivo: [ENTREGA_AURORA_1_3.md](../../ENTREGA_AURORA_1_3.md). No se marca aceptada la puerta Android física sin dispositivo.
