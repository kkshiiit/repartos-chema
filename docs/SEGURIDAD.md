# Seguridad — Chema Andamios

Revisión del 17/11/2026 (versión 1.0.0).

## Modelo de acceso

- No hay cuentas ni contraseñas. Un **código de equipo** de 12 caracteres (alfabeto de 32 símbolos, ~60 bits, generado con el generador seguro del sistema) da acceso a los datos de ese equipo. El servidor guarda sólo su **hash SHA-256**, nunca el código.
- El **nombre** identifica a la persona en la auditoría. Es un control de trazabilidad, no de autenticación: alguien con el código podría escribir otro nombre. Compartir el código sólo con el personal.
- Si el código se filtra: Ajustes → **Cambiar código**. El anterior deja de funcionar al instante y los demás teléfonos reciben un aviso para entrar con el nuevo.

## Servidor (Supabase, proyecto `repartos-chema`)

| Control | Estado |
|---|---|
| Tablas `c2_*` con RLS activado y **sin políticas** → la clave pública no puede leer ni escribir tablas | ✅ verificado (`permission denied`) |
| Todos los privilegios de tablas revocados a `anon` y `authenticated` | ✅ |
| Acceso sólo por funciones `SECURITY DEFINER` con `search_path` vacío que exigen el código | ✅ |
| Funciones ejecutables sólo por `anon` (no por `authenticated`) | ✅ |
| Límite: 30 equipos nuevos por hora en total (anti-spam) | ✅ |
| Límites por equipo: 200 personas, 150 MB de operaciones, 300 MB de fotos; 100 operaciones y 3 MB por envío | ✅ |
| Validación de identificadores y de base64 en fotos | ✅ |
| Copias de seguridad semanales (8) + copia previa a cada restauración; tabla cerrada al acceso directo y límite de 10 restauraciones por hora | ✅ |
| Registro de cuentas (Auth) desactivado; no hay usuarios | ✅ |
| Tablas, funciones y función Edge del sistema anterior eliminadas del servidor (estaban vacías) | ✅ |

Las advertencias del asesor de Supabase "función SECURITY DEFINER ejecutable por anon" son **intencionales**: es el único punto de entrada y cada función valida el código.

## App Android

- Datos locales en SQLite privado de la app (`expo-sqlite/kv-store`). **Respaldo automático de Android desactivado** (`allowBackup=false`) para que no se pueda extraer el código del equipo por USB/copias.
- Sólo HTTPS (tráfico en claro deshabilitado en release). Permisos: internet, ubicación (al ordenar el viaje), cámara/fotos (al documentar), vibración y avisos. Micrófono y superposición bloqueados.
- Tickets y guía en PDF se generan con escape de HTML; los enlaces de WhatsApp se codifican.
- Sin publicidad, analítica ni rastreadores.
- **Firma del APK:** certificado SHA-256 `fac61745…3b9c`, el mismo de la app anterior (permite actualizar sin desinstalar). Es la clave de depuración estándar de React Native. Sirve para distribución interna por APK, **no para Play Store**: si en el futuro se publica en la tienda, crear una clave de publicación propia y guardarla fuera del repositorio.

## Repositorio

- Escaneo de secretos (claves `sbp_`, `sb_secret_`, JWT, claves privadas, tokens de GitHub, `.env`, keystores) en **todos los archivos y todo el historial git**: sin hallazgos reales (sólo ejemplos de patrones en perfiles de agentes).
- `.gitignore` excluye `.env*`, `*.pem`, `*.key`, `*.jks`, `*.keystore`, cuentas de servicio y `android/`.
- La URL y la clave **publicable** de Supabase en `src/sync/config.ts` son públicas por diseño.
- El token de gestión de Supabase (`sbp_…`) nunca se guarda en el repo; los scripts lo leen de `SUPABASE_ACCESS_TOKEN`.

## Dependencias

`npm audit --omit=dev` informa 8 avisos (3 altos, 5 moderados), todos **transitivos** de herramientas de Expo o de librerías usadas de forma no vulnerable:

- `node-forge`, `glob`, `minimatch`, `xcode`: herramientas de compilación/servidor de desarrollo; no van dentro del APK.
- `zod` interno de Expo (la app usa `zod` 4.6.6, ya corregido).
- `uuid` dentro de `exceljs`: la falla requiere pasar un búfer propio, cosa que la app no hace.
- `decode-uri-component`: copia local en `vendor/` (0.5.0 con adaptador); se usa sólo para parsear rutas.

Se eliminaron Firebase, `firebase-tools`, `expo-secure-store` y ~570 paquetes que ya no se usaban. Revisar `npm audit` en cada actualización de Expo.

## Pendientes recomendados

- Probar la instalación en un Android real antes de repartir a todo el equipo.
- El plan gratuito de Supabase pausa el proyecto tras 7 días sin uso: con uso diario no ocurre.
- Revocar el token de gestión de Supabase cuando no se necesite (supabase.com → Account → Access Tokens).
