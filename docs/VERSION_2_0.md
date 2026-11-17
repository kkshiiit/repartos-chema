# Repartos Chema 2.0 — equipo sincronizado

## Qué cambió

- **Sincronizado entre teléfonos.** Todos los teléfonos con el mismo *código de equipo* ven y cargan los mismos datos. Funciona sin señal: los cambios quedan guardados en el teléfono y se envían solos al volver la conexión.
- **Ingreso por nombre.** Cada persona elige su nombre (o lo escribe la primera vez). No hay contraseñas.
- **Auditoría completa.** Cada cambio (alta, edición, entrega, retiro, ajuste de stock, fotos, importación, exportación, tickets compartidos, ingresos) queda registrado con persona, fecha y hora, y con los materiales que se movieron. El registro vive en el servidor y no se puede borrar desde la app.
- **Interfaz nueva.** Modo **Sol** (máximo contraste para la calle) y modo **Noche** (oscuro, no encandila), letras y botones más grandes, cuatro cuadros de resumen en el inicio (Atrasados, Para hoy, Por entregar, En obra) que filtran la lista al tocarlos, y tarjetas con color de estado.
- **Ticket profesional.** Desde cada alquiler: *Compartir ticket* en PDF, WhatsApp al cliente, texto, Word o Excel.
- **Guía de uso** con 12 secciones marcadas y explicación breve; se puede exportar en PDF.
- **Exportar / importar todo** (JSON con alquileres, depósito, combos, auditoría y fotos). Importar reemplaza los datos del equipo y queda auditado.
- **Migración automática:** si el teléfono tenía datos de la versión 1.x, el inicio ofrece *Pasar datos al equipo*.

## Instalar o actualizar

1. Descargar el APK 2.0.0 (enlace en el README).
2. Abrirlo en el teléfono y permitir la instalación.
3. **Se instala encima de la 1.7 sin desinstalar** (misma firma y mismo paquete). No borres los datos de la app.
4. Primera persona: *Crear un equipo nuevo*. En *Ajustes* aparece el código; tocar *Compartir código*.
5. Resto del equipo: *Unirme a un equipo* → código → nombre.
6. Si había datos en la versión anterior, en el inicio aparece *Datos de la versión anterior* → *Pasar datos al equipo* (hacerlo en **un solo** teléfono).

## Cómo funciona la sincronización

- Cada cambio es una operación inmutable con número de orden en el servidor (`c2_ops`). Todos los teléfonos aplican las mismas operaciones en el mismo orden con el mismo motor de reglas (`src/domain/engine.ts`), así que llegan al mismo resultado. Ese mismo registro es la auditoría.
- Si dos personas usan el mismo material a la vez, gana la que llegó primero al servidor. A la otra le aparece un aviso explicando que su cambio no se pudo aplicar.
- El teléfono sincroniza al abrir la app, al volver a la app, cada 15 segundos mientras está abierta, al recuperar la señal y después de cada cambio. Tocar el punto de color de arriba fuerza una sincronización.
- Las fotos se suben comprimidas y los demás teléfonos las descargan la primera vez que las ven.

## Servidor

- Proyecto Supabase gratuito existente (`repartos-chema`, región São Paulo). Migración: `supabase/migrations/20261117000000_c2_sync.sql`.
- Las tablas `c2_*` tienen RLS activado y **ningún acceso directo**: la clave pública sólo puede llamar funciones que exigen el código del equipo (se guarda como hash SHA-256).
- Seguridad: quien tenga el código del equipo puede entrar. Compartirlo sólo con el personal. Si se filtra, crear un equipo nuevo, exportar e importar los datos.
- Límites del plan gratuito: 500 MB de base de datos; los proyectos gratuitos se pausan tras 7 días sin uso (se reactivan desde supabase.com). Con uso diario no se pausa.

## Pruebas

- `npm test`: 528 pruebas unitarias, incluida la convergencia de dos teléfonos con conflictos (`tests/sync-store.test.ts`) y el ticket (`tests/ticket.test.ts`).
- `npm run test:ui` (con `npm run build:web` y `npm run preview` antes): recorrido completo con dos teléfonos contra el servidor real y migración de datos 1.x (`tests/ui/v2-equipo.spec.ts`). Los equipos de prueba se llaman `QA …` y se borran con `scripts/qa-cleanup.mjs`.
- Las pruebas de interfaz de la 1.7 (modo individual, sin equipo) quedaron archivadas en `tests/ui-legacy-1.7/`.
- Capturas: `artifacts/capturas/2.0/`.

## Compilar el APK

```bash
npm ci
EXPO_PUBLIC_LOCAL_ONLY=true EXPO_PUBLIC_DATA_MODE=demo npx expo prebuild --platform android --clean
cd android && ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
```

Requiere JDK 21 (y JDK 17 para los plugins de Gradle), Android SDK 36, build-tools 36.0.0, NDK 27.1.12297006 y CMake 3.22.1. La firma es la del certificado `FA:C6:17:45…3B:9C`, la misma de las versiones 1.x (por eso actualiza sin desinstalar).
