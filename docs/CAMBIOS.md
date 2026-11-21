# Registro de cambios

## 1.2.0 — 21/11/2026

- **Responsable con PIN** (Ajustes → Responsable). Con PIN, importar o restaurar copias, empezar vacío, volver a antes de un cambio, cambiar el código y sacar personas piden la autorización del responsable. Lo controla el servidor: una app vieja o modificada no puede saltearlo.
- Cinco intentos equivocados bloquean el PIN 15 minutos. El trabajo diario no pide PIN.
- La publicación de versiones es automática: GitHub compila el APK y crea el Release después de la aprobación del responsable.

## 1.1.0 — 20/11/2026

- **Copia de seguridad semanal automática** en el servidor (se conservan las últimas 8). Pantalla nueva *Copias y restauración* en Ajustes para restaurar una copia con un toque.
- **Volver a como estaba antes de un cambio** desde la Auditoría, con comparación *Ahora / Quedaría así* antes de confirmar.
- Antes de restaurar se guarda sola una copia del estado actual: restaurar también se puede deshacer. Todo queda en la Auditoría.

## 1.0.3 — 19/11/2026

- **Cambiar código del equipo** (Ajustes): el código anterior deja de funcionar al instante. Los demás teléfonos ven un aviso y vuelven a entrar con el código nuevo sin perder nada. Queda en la Auditoría.
- Los APK ya no se guardan dentro del repositorio: se publican en GitHub Releases.

## 1.0.2 — 19/11/2026

- Papelera roja en cada material del depósito para borrarlo con confirmación: da de baja su stock, lo quita de los combos y queda en la Auditoría. No deja borrar si hay piezas en obra, en una carga por entregar o faltantes sin resolver.

## 1.0.1 — 19/11/2026

- Papelera roja para borrar un alquiler entero de un toque, con confirmación (tarjeta del inicio y detalle). Ahora también se puede borrar aunque tenga fotos.

## 1.0.0 — 17/11/2026

Primera versión de **Chema Andamios**.

- Equipo sincronizado entre teléfonos con código de equipo; ingreso con el nombre de cada persona.
- Funciona sin señal y sincroniza solo; conflictos resueltos en orden y avisados.
- Auditoría completa: persona, fecha, hora y materiales movidos en cada cambio.
- Alquileres (carga, entrega, retiro con faltantes/daños, reingreso, fotos, recordatorios), depósito y viaje.
- Ticket profesional en PDF, WhatsApp, texto, Word o Excel.
- Modos Sol (alto contraste) y Noche; guía de uso por secciones exportable en PDF.
- Exportar/importar todo en JSON; si el teléfono tenía datos de la app anterior (Repartos Chema), se pasan al equipo con un toque.
- Seguridad: acceso sólo por código (hash en el servidor), límites anti-abuso, sin respaldo de Android, sin permisos innecesarios. Ver [SEGURIDAD.md](SEGURIDAD.md).
