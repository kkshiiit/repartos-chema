# Continuidad de Repartos Chema

Actualizado: 13 de octubre de 2026. Misión **en curso**, no finalizada.

## Objetivo y autorización

Completar la app interna offline-first conservando Expo 57, React Native y Firebase. Cero publicidad; temas claro, oscuro y sistema con acceso rápido; inventario íntegro; demo sin credenciales. El prompt de ejecución posterior reemplazó la auditoría de solo lectura. Se autorizaron modificaciones, instalaciones justificadas, pruebas, respaldos y commits locales. No publicar, crear repositorios remotos, gastar, migrar datos irreversiblemente ni desplegar producción sin autorización.

## Fase actual

Fases 1 y 2 completadas: respaldo original restaurado y Git local. Comienza fase 3: persistencia/conflictos. Las fases posteriores siguen pendientes.

## Evidencia comprobada

- Proyecto `/workspace/repartos-chema` disponible. Auditoría de referencia: `/workspace/informes/repartos-chema-auditoria-maestra-2026-10-13.md`.
- Respaldo `/workspace/respaldos/chema-original-20261013/repartos-chema-original.zip`: 92 archivos, CRC correcto, extracción y todos los SHA-256 coincidentes. Manifiestos y `VERIFICACION.json` junto al ZIP. Excluye dependencias, compilados regenerables, temporales y secretos.
- Git `main`, base original `5c554c4`; sin remoto. No se publicaron archivos.
- Todavía no hay pruebas nuevas de aplicación: los resultados de la auditoría son históricos.

## Plan pendiente y errores abiertos

1. Validación del sobre local, fallos de lectura/escritura, recuperación de conflictos persistidos y carga inicial.
2. Inventario: salida de taller/perdido, medidas, fechas previstas/efectivas, concurrencia, correcciones e idempotencia.
3. Eliminar totalmente publicidad y cerrar exportaciones/funciones incompletas.
4. ThemeProvider, tokens, persistencia independiente, botón inmediato y tres opciones; UI móvil/accesibilidad.
5. Seguridad, fotos, notificaciones, rendimiento medido y documentación Firebase.
6. Pruebas unitarias/integración/UI, capturas nuevas, builds, investigar APK viable sin costos.
7. Entrega ZIP, hashes, manual e informe final con límites reales.

## Decisiones y restricciones

Mantener cuatro secciones Obras/Galpón/Viaje/Historial. Retiradas agrupa estados técnicos RETIRADO/REINGRESADO, sin filtro Cerradas. Firebase/FCM productivos no configurados. Demo no sincroniza entre dispositivos. No inventar APK, URLs, credenciales ni pruebas físicas. GitHub tiene dos cuentas conocidas; no elegir destino externo automáticamente. Las herramientas de automatizaciones existen pero no está verificada su capacidad de reanudar este workspace de Codex. No hay continuidad automática configurada.

## Archivos y comandos

Base completa versionada; este documento es el primer archivo nuevo. Consultar `git status --short` y `git log --oneline` para cambios posteriores.

Comandos desde la carpeta del proyecto: `npm run check`, `npm run test:integration`, `npm run build:web`, `npm run preview` y `npm run test:ui` (preview en 8081). Emuladores con proxy local: `node -r ./scripts/emulator-local.cjs ./node_modules/firebase-tools/lib/bin/firebase.js emulators:exec --project demo-repartos-chema --only firestore,storage "npx --no-install vitest run --config vitest.integration.config.mts"`.

## Próxima acción exacta

Corregir `src/data/repository.ts`, `src/context/InventoryContext.tsx` y `src/components/ui.tsx` con pruebas de corrupción, falta de espacio y conflicto reabierto. Actualizar este documento y hacer commit al verificar la fase. Después continuar inventario; no repetir la auditoría ni sobrescribir el respaldo original.

## Punto de control — datos e inventario, 13/10 22:14 UTC

- Fases 3–4: implementadas las regresiones principales. `npm run check` terminó con código 0: typecheck, lint, 66 pruebas (incluyen aún 3 publicitarias) y build Functions. Repository: 14 pruebas aprobadas.
- Nuevos módulos: `src/data/validation.ts`. Modificados repository, InventoryContext, dominio/types/schema/rules, formularios de obra/carga/operación, Galpón, Combos, detalle y tests. Consultar commit para diff exacto.
- Conflictos reabiertos siguen recuperables; lectura/corrupción no reinicia datos; fallo de persistencia no publica cambios. Stock externo puede moverse entre depósitos y darse de baja sin consumir faltantes vinculados. Corrección ADMIN vuelve al saldo real o reclasifica faltantes. Las medidas son identidad de variante, sin conversión física ni cambio sobre materiales usados. Entrega conserva fecha prevista y registra efectiva. Versiones protegen formularios obra/material/combo; carga captura versión. Se añadieron observaciones e identidad histórica en auditoría.
- Pendientes de esta fase: validación UI nueva, backup/importación de datos de usuario, fotos/quota, servidor y escenarios de integración. No se consideran todas las fases aceptadas por las pruebas unitarias.
- Próximo paso: retirar publicidad; generación local de documentos; sistema de temas y validación UI completa.

## Punto de control — temas, documentos y UI, 13/10 22:25 UTC

- `npm run check`: 70 pruebas aprobadas, tipos/lint/build Functions con código 0, después de añadir temas y copia/restauración. Cambios posteriores (errores traducidos/compactación/SDK Android) requieren nuevo check.
- Publicidad retirada de fuente, configuración y dependencia. Falta acta final de búsqueda sobre todos los bundles regenerados.
- Temas claro/oscuro/sistema implementados, preferencia `chema:theme:v1`, detección en vivo, botón en login/cabeceras/modales, estilos dinámicos y barras del sistema. Contraste: primer test de borde oscuro falló (2.84:1), corregido; los 5 tests de paleta pasan.
- Web exportada a las ~22:20, build correcto (79 s Metro), principal 5.4 MB frente a 6.35 MB histórico; no afirmar latencia móvil medida. Documentos ahora cargan diferidos. Word y Excel descargados en Playwright satisfactoriamente.
- Playwright: 14/15 pasaron; el único fallo fue atributo de estado del selector de tema. Corregido a `aria-pressed` con rol botón; necesita nuevo build/rerun. Formularios, live system y persistencia parcial alcanzados antes del fallo. Capturas reales: 48 en `artifacts/capturas`, 390/1440 px claro/oscuro. Inspeccionadas tres; cabecera móvil todavía alta y se compactó después. Rehacer capturas finales.
- Emuladores Firestore/Storage: 6/6 pasaron. Añadida séptima prueba para documentos existentes/propietario/expirados, pendiente rerun.
- Fotos web nuevas en IndexedDB con referencias cortas; caché local de fotos remotas y borrado local. Demo: copia JSON con fotos; restauración ADMIN con validación y archivo preventivo; dos tests de restauración pasan. No borrar datos del usuario durante pruebas; solo perfiles/browser aislados.
- Functions: recibo previo a validar foto, URL de bucket exacto, DomainError separado de fallos transitorios, notificaciones agotadas salen de reintentos, bootstrap conserva fecha de alta, exportaciones agrupan Retiradas. Integración callable y FCM real aún no probadas.
- Auditoría npm detectó 34 alertas (22 altas, 12 moderadas), varias transitivas de herramientas. No usar `audit fix --force` (propone downgrades incompatibles). Aplicando override compatible @grpc/grpc-js 1.14.6. Braces 3.0.3 y node-forge 1.4.0 siguen siendo últimas versiones consultadas, con avisos abiertos; registrar límites de producción. Informe original `/workspace/informes/chema-npm-audit-app.json`.
- Android: `expo prebuild --platform android --no-install --skip-dependency-update react,react-native` exitoso. Directorio generado ignorado en Git; todavía NO APK. Descargando herramientas SDK oficiales para investigar build local gratuito. Sin claves Firebase ni publicación.
- Próximo paso exacto: terminar instalación SDK si viable; corregir checks de última fuente, build web, suite UI completa (incluida foto/backup), integración de 7 reglas, validaciones de Functions, documentación y paquetes con hashes. Actualizar este archivo y commits antes de cualquier interrupción. Misión sigue pendiente.
