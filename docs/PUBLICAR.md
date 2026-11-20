# Publicar una versión nueva

Las versiones se publican con una acción de GitHub (**Publicar versión**): compila el APK en los servidores de GitHub, verifica la firma, el paquete y la versión, y crea el Release con el APK adjunto. **Nada se publica sin la aprobación del responsable.**

## Cómo es cada publicación

1. Se prepara la versión (código, `app.json` con la versión nueva y `docs/CAMBIOS.md`) y se fusiona a `main`.
2. Se inicia **Publicar versión** (lo hace Claude, o vos desde *Actions → Publicar versión → Run workflow*).
3. GitHub te avisa por mail y en la app de GitHub: **"Review pending deployments"** → tildar **publicacion** → **Approve and deploy**.
4. En unos 20 minutos aparece el Release `vX.Y.Z` con el APK, sus notas y su SHA-256.

Si la versión de `app.json` ya está publicada, la acción se detiene sin tocar nada.

## Configuración (una sola vez)

1. **Entorno con aprobación:** *Settings → Environments → New environment* → nombre `publicacion` → **Configure environment** → tildar **Required reviewers** → agregarte → **Save protection rules**.
2. **Permisos de las acciones:** *Settings → Actions → General* → *Workflow permissions* → **Read and write permissions** → **Save**.

## Revisión automática

La acción **Revisión** corre tipos, lint y pruebas en cada pull request y en cada cambio de `main`. Si algo falla, aparece una ✗ roja en el pull request.

## Costo

Gratis dentro del plan de GitHub (2.000 minutos por mes en repositorios privados). Cada publicación usa unos 20–25 minutos y cada revisión unos 3.
