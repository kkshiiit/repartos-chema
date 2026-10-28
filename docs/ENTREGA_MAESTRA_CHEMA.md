# Entrega maestra — Repartos Chema 1.7.0

Cierre del **28/10/2026**. Repositorio privado [kkshiiit/repartos-chema](https://github.com/kkshiiit/repartos-chema). La instalación y aceptación en tu Android siguen pendientes; no se presentan como realizadas.

## Estado verificado antes de Gradle

- Último cambio funcional: `5e0ba156edf68f6f5771a517c1c16495074896bd`. Conserva paquete, firma, SQLite, fotos, JSON, stock y funcionamiento individual gratuito/offline.
- **527/527 pruebas** en61archivos; TypeScript/Functions pasan; lint0errores/1advertencia histórica. **64/64 recorridos web**, sin fallos ni omisiones, incluidos Word/Excel, importación/restauración, operaciones y temas.
- **15/15** PostgreSQL17+SQLite; integración real sintética Auth8, Storage5, rutas4, delta3 y dos contextos UI2. No son teléfonos Android.
- Capturas actuales claro/oscuro y comparación con1.6.1 en `artifacts/capturas/cierre-1.7/`. Revisión y hashes: `artifacts/validacion/cierre-1.7/revision-visual.json`.
- En este corte documental la compilación APK y publicación nuevas aún no terminaron. Los metadatos de release se agregan después de verificar el artefacto; no usar unAPK anterior para acreditar las correcciones.

## Implementación y correcciones

Alquileres por urgencia con búsqueda por localidad/dirección/cliente y contexto al volver; Depósito en filas con cantidades alineadas; Viaje ordenable sin efecto de stock, GPS/Maps externos y regreso fijo al depósito; Historial paginado y deshacer seguro. Formularios, operaciones, combos, avisos, fotos, copias y documentos conservan sus funciones. Claro/Oscuro/Sistema persistentes y acceso rápido único desde cabeceras. Sin publicidad ni dependencias visuales nuevas.

Correcciones de cierre: listener al revalidar sesión, archivo atómico de propuestas dependientes, continuidad del historial y botón de continuación, conflictos de revisión sin reintentos de infraestructura, delta durable por entidad, errores en español, overflow de texto ampliado, composición compacta y carrera de restauración del scroll. [Auditoría completa](AUDITORIA_CIERRE_MAESTRO_CHEMA.md), [matriz94requisitos](MATRIZ_ACEPTACION_CHEMA.md) y [autoauditoría](AUTOAUDITORIA_IMPLEMENTACION_CHEMA.md).

## Cómo probar y actualizar

1. Exportá una copia JSON con fotos desde la app actual y guardala fuera de la aplicación. Conservá el archivo original y anotá versión/cantidades.
2. Descargá el APK nuevo desde su ficha privada, con sesión GitHub kkshiiit, usando **Download raw / Descargar archivo sin procesar**. Localhost del entorno no es una URL para tu celular.
3. Elegí **Actualizar**, sin desinstalar ni borrar almacenamiento. Si Android rechaza firma/código/paquete, detenete y compartí el mensaje exacto. La instalación llamada«2.0» no fue identificada; no se certifica su compatibilidad por memoria.
4. Compará stock por estado, alquileres, fotos e historial. Modo avión, cerrar/abrir y temas con formulario pendiente deben conservar datos.
5. Probá un recorrido sintético crear→cargar→entregar→retirarconincidencia→reingresar; reingresar no suma dos veces. ProbáJSONcancelar/restaurar, Word/Excel, cámara/galería, GPS/depósito y avisos. [Manual completo y dos teléfonos](USO_MAESTRO_ANDROID.md).

## Instalar y reproducir desde el código

Requiere Node24/npm11 y lockfiles del repositorio. No hace falta configurar un proveedor para uso individual.

```bash
npm ci
npm --prefix functions ci
npm run check
npm run build:web
npm run preview
```

Preview sirve en8081 dentro del entorno que lo ejecuta. Para automatización local: `CHEMA_TEST_LOCAL=true npm run test:ui -- --workers=2`; las comparaciones históricas necesitan además la web1.6.1 verificada en8082, según los tests. PostgreSQL de pruebas: `node scripts/backend-test.mjs`, con Docker local. Estos comandos no deben ejecutarse contra datos comerciales.

Android necesita JDK21/AndroidSDK y la **firma existente**; no se incluye la clave enZIP/Git. Definir `JAVA_HOME`, `ANDROID_HOME` y `CHEMA_ANDROID_KEYSTORE` privados antes de `npm run build:android:demo`. El script hace Expo prebuild y Gradle completo para ARM64, restaura la firma y fija LOCAL_ONLY/demo. No usar una clave nueva para eludir un problema de actualización.

## Equipo opcional y límites

Modo individual: tu nombre identifica autor local, sin autenticación ni servidor. Inicio vacío, sin alquileres ficticios. No publicar automáticamente una copia al equipo.

Equipo: SupabaseFree autorizado en kkshiiit, proyecto lttfkynkhveomntejqhc, siete migraciones. Edgev7 restaurado con los mismos archivos v5 probados. Requiere invitación privada/credenciales propias y aprovisionar primer responsable comercial. No se inventaron usuarios reales; QA sintética ya eliminada con guardas, incluidos cuatro usuarios/dos espacios/dosJPEG. Sin tarjeta/upgrade/servicio pago activado.

Free tiene cuotas/pausas; no es garantía ilimitada. DB500MB antes de lectura; egreso separado5GBcached+5GBuncached. CopiaJSONcompartida contiene historial disponible localmente, no todo el servidor. Operación de respaldo SQL+objetos privados y su restauración quedan por establecer antes del piloto comercial.

## Pendientes reales

- Aceptación física: actualización encima, migración de la instalación exacta, cámara/URIJSON/compartir/GPS/TalkBack/teclado y avisos tras reiniciar. No se probaron FPS/memoria/batería.
- Archivo original `repartos-chema-5-pedidos-whatsapp.json` ausente; las cinco entidades de fixture no equivalen a ese archivo.
- Primer responsable/recuperación del equipo, copia completa SQL+objetos y piloto en dos teléfonos. No se probó agotamiento real de cuota ni pausa del proveedor.
- `npm audit` mantiene ocho nodos alertados (cuatroaltos/cuatromoderados), principalmente herramientasCLI y uuid usado como v4; alcance y avisos están en la auditoría. No se declara cero vulnerabilidades ni se fuerza un downgrade deExpo.
- Falta recorrido visual nativo de archivo de propuestas dependientes, aunque atomicidad/reapertura/aislamiento están probados en SQLite/provider.

No hay automatización de continuidad futura confirmada. El próximo paso guardado y el estado de respaldo están en [CONTINUIDAD_CODEX.md](CONTINUIDAD_CODEX.md).
