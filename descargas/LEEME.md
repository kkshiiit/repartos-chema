# Descargar Chema Andamios

**[Ir a la descarga (GitHub Releases)](https://github.com/kkshiiit/repartos-chema/releases/latest)** — el repositorio es privado: iniciar sesión en GitHub.

Los APK se publican en **Releases**, no dentro del código, para que el repositorio no crezca 55 MB con cada versión.

## Versión actual: 1.1.0

| | |
|---|---|
| Archivo | `chema-andamios-1.1.0-arm64.apk` |
| Tamaño | 55735428 bytes |
| SHA-256 | `f3b356c3af5257e088654d8d1deb47289378e5931651617fc57d5b2180d19797` |
| Paquete | `com.grupochema.repartos` · versión 1.1.0 (code 19) · Android 7+ · ARM64 |
| Firma | `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c` (actualiza sin desinstalar) |

## Instalar

1. Abrir el APK en el teléfono y permitir la instalación desde esa app (navegador, WhatsApp o Archivos).
2. Si ya está instalada: **Actualizar**. No desinstalar ni borrar datos.
3. Primera persona: **Crear un equipo nuevo**. Resto: **Unirme a un equipo** con el código de Ajustes.
4. Elegir o escribir tu nombre.

## Publicar una versión nueva

1. `npm run build:android` (verifica firma, paquete y versión).
2. En GitHub: **Releases → Draft a new release** → etiqueta `v<versión>` → arrastrar el APK → **Publish release**.
3. Actualizar la tabla de arriba (tamaño y SHA-256: `sha256sum archivo.apk`).

Manual de uso: [docs/MANUAL.md](../docs/MANUAL.md).
