# Manual de uso — Chema Andamios

> La misma guía está dentro de la app: botón **(?)** arriba de cada pantalla, o **Más → Guía de uso**. Desde ahí también se puede exportar en PDF.

## 1. Primer uso

**Primera persona del negocio**
1. Abrir la app → **Crear un equipo nuevo** → escribir el nombre del negocio.
2. Escribir tu nombre → **Entrar con este nombre**.
3. En **Hoy** aparece *Terminá de configurar*: cargar materiales, sumar al equipo, elegir responsable con PIN y crear el primer alquiler. Tocá cada paso.
4. Para sumar gente: **Más → Compartir código del equipo** y mandarlo por WhatsApp.

**El resto del equipo**
1. Instalar el APK → **Unirme a un equipo** → pegar el código.
2. Tocar su nombre en la lista o escribirlo si es la primera vez.

**Si el teléfono tenía la versión anterior:** en **Hoy** aparece *Datos de la versión anterior* → **Pasar datos al equipo**. Hacerlo en un solo teléfono.

## 2. Pantallas

La barra de abajo tiene 5 pestañas, como Mercado Libre o WhatsApp:

| Pestaña | Para qué sirve |
|---|---|
| **Hoy** | Lo que hay que hacer hoy. Arriba dice cuántas tareas faltan. Primero lo **atrasado** (en rojo), después lo **de hoy**, y abajo lo que ya se hizo. Cada tarea tiene su botón azul **Entregar** o **Retirar**. |
| **Alquileres** | Todos los alquileres, ordenados por urgencia. Los números de arriba filtran la lista; la lupa busca por cliente, dirección o barrio. Botón azul **Nuevo** abajo a la derecha. |
| **Depósito** | Stock por pieza: disponible, en obras, a reparar y perdido. **Agregar material** y, en los tres puntos de cada pieza, **Ajustar cantidad**, **Mover stock** y **Editar pieza**. Papelera para borrar una pieza que ya no se usa. |
| **Viaje** | Paradas en orden de recorrido. **Abrir recorrido** en Google Maps. En los tres puntos: ordenar a mano, por cercanía o por material. |
| **Más** | Auditoría, copias, combos, responsables de reparto, dirección del depósito, planillas, equipo, PIN, apariencia y la guía. |

**Colores:** el **azul** es siempre un botón que hace algo. El **rojo** es urgente (atrasado) o peligroso (borrar). **Amarillo** = es hoy · **verde** = en obra o hecho · **violeta** = falta entregar.

## 3. Un alquiler de punta a punta

1. **Alquileres → Nuevo** → cliente, dirección y fechas → **Continuar a carga** → tocá **+ Agregar** en cada pieza (o **Usar combo**) y ajustá con − y + → **Revisar alquiler** → **Guardar alquiler**.
2. Cuando sale el camión: en **Hoy** tocá **Entregar** (o **Registrar entrega** en el detalle). Son tres pasos: ① qué se lleva, ② quién lo lleva, ③ quién recibe y hasta cuándo → **Confirmar entrega**. El stock pasa a "en obras".
3. **Ticket** (arriba en el detalle) → PDF, WhatsApp al cliente, texto, Word o Excel.
4. Al retirar: **Retirar** → ① qué vuelve, ② quién lo retira. Si falta algo o volvió roto, tocá **¿Falta algo o volvió roto?** y cargalo (perdido o dañado) → **Confirmar retiro**. Lo sano vuelve al depósito; lo dañado va a taller.
5. Cuando quedó todo acomodado: **Cerrar reingreso**.

En el detalle de un alquiler, arriba a la derecha: **lápiz** = editar · **tres puntos** = más acciones · **papelera** = borrar.

**Más acciones (tres puntos):**
- **Faltante o daño en obra**: algo se perdió o se rompió sin retirar todo.
- **Pasar material a otra obra**: llevarlo directo, sin pasar por el depósito.
- **Ubicación en el mapa**: con tu GPS (estando en la obra) o **pegando el enlace de Google Maps** que te mandaron por WhatsApp.
- Con el alquiler retirado: **Cerrar reingreso** o **Reactivar** (vuelve a pendiente para entregar de nuevo).

**¿Se arrepintió el cliente o lo cargaste mal?** Tocá la **papelera** (en la tarjeta o arriba en el detalle) → **Sí, borrar alquiler**. Se borra todo de una vez y queda en la Auditoría. Si ya se entregó, primero hay que registrar el retiro.

## 4. Copias

**Más → Exportar e importar copia**
- **Exportar → Descargar copia**: archivo JSON con todo (alquileres, depósito, combos, auditoría y fotos). Guardarlo fuera del teléfono (Drive, mail).
- **Importar → Elegir copia**: muestra qué trae el archivo antes de confirmar. Reemplaza los datos del equipo en todos los teléfonos y queda en la Auditoría.
- **Empezar de cero** está al final y separado: deja el inventario vacío, pero antes guarda una copia.

**Planillas Word y Excel**: Más → Planillas Word y Excel.

## 5. Copias automáticas y volver atrás

- **Copia semanal automática:** el servidor guarda sola una copia completa por semana (se conservan las últimas 8). Se ven en **Más → Copias y volver atrás**; tocar una → **Sí, restaurar**.
- **Volver a antes de un cambio:** en **Más → Auditoría**, tocá el cambio → **Volver a como estaba antes**. La app muestra *Ahora* y *Quedaría así* antes de confirmar. Se deshace ese cambio y todo lo posterior.
- Antes de cualquier restauración se guarda una copia de cómo estaba, así que **restaurar también se puede deshacer**. Todo queda en la Auditoría.

## 6. Responsable y PIN

- En **Más → Elegir responsable y PIN** se elige una persona de confianza y un PIN de 4 a 8 números.
- Con PIN, estas acciones lo piden: **importar o restaurar copias, empezar vacío, volver a antes de un cambio, cambiar el código del equipo y sacar personas**. Necesitan conexión.
- El trabajo diario no pide PIN.
- Cinco intentos equivocados lo bloquean 15 minutos. Si el responsable se olvida el PIN, se puede resetear desde el servidor (pedíselo a quien administra Supabase).

## 7. Sin señal

La app funciona igual. Arriba, al lado del nombre del equipo, un punto indica el estado: **verde** sincronizado, **amarillo** cambios por enviar o sin conexión, **rojo** error. Tocarlo sincroniza en el momento. Dentro de un alquiler, si no hay señal aparece una franja amarilla: *Sin conexión · 1 por enviar*. Se envía solo al volver la señal.

## 8. Más → ajustes útiles

- **Sol / Noche / Auto**: Sol es para leer a pleno día. También con el sol/luna de arriba.
- **Cambiar de persona**: para compartir un teléfono.
- **Personas del equipo**: ver quién usa la app y su última actividad.
- **Responsables de reparto**: nombres que aparecen al entregar y retirar (también se agregan desde el mismo formulario con **+ Agregar nombre**).
- **Salir del equipo** (al final): el teléfono deja de ver los datos (no se borran del equipo).

## 9. Preguntas frecuentes

- **¿Necesito internet?** Sólo para crear o unirte a un equipo. Después funciona sin señal.
- **Alguien borró o importó algo por error.** Más → Auditoría → tocar ese cambio → **Volver a como estaba antes**.
- **Dos personas cargaron lo mismo a la vez.** Gana la primera; a la otra le aparece un aviso para revisar.
- **Se filtró el código.** Más → **Cambiar código**. El viejo deja de funcionar al instante; compartí el nuevo con tu equipo.
- **La app no sincroniza hace días.** El plan gratuito del servidor se pausa tras 7 días sin uso. Una tarea automática de GitHub lo consulta cada 3 días para que no pase; si igual se pausó, se reactiva desde supabase.com (**Restore**).
