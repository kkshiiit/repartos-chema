# Corrección JSON — edición individual 1.2.1

## Identidad y diagnóstico

El APK enviado por el usuario es exactamente la entrega 1.2.0/code3, SHA256 `063019c53294fdb6d43e3916faad7d0d0f9b03312fdabed03d47de917f589962`. Su huella coincide con descargas y permite usar la fuente publicada. No se encontró una entrega 2.0.

El usuario informó «Lo elijo y no carga». La pantalla anterior anunciaba «Configuración guardada» después de seleccionar el JSON aunque no había importado nada. Exigía después otro botón Restaurar copia y otra confirmación, sin mostrar cantidad ni revisión automática. La prueba de componente contra esa pantalla falló por ausencia de revisión/cancelación; con el cambio pasa. Esto reproduce la confusión del flujo, no acredita una prueba física del selector Android.

El JSON original `repartos-chema-5-pedidos-whatsapp.json` es válido bajo el esquema y las reglas reales: cinco alquileres, diez materiales, cola vacía. Se probó prepareRestore → Repository.restoreDemo → nueva instancia de Repository.load: recupera los cinco nombres. Los originales quedan archivados. Fechas provisorias y existencias cero se conservan; no se inventó stock ni se marcaron entregas.

## Comportamiento nuevo

1. Ajustes → Elegir copia abre el selector. Se copia a caché, sin pedir acceso general al almacenamiento. Acepta MIME heterogéneos de proveedores Android y valida el contenido después.
2. La selección válida abre automáticamente una revisión: cantidad de alquileres/materiales y aviso explícito de reemplazo, sin combinar inventarios. Todavía no modifica datos.
3. Confirmar importación archiva los originales y guarda la copia. Cancelar deja el inventario intacto. No anuncia éxito antes de guardar.
4. Deshacer última importación recupera los originales incluso después de reabrir. Antes archiva también los datos activos. Desinstalar o borrar almacenamiento elimina esas copias internas.
5. JSON truncado, BOM UTF-8, archivo vacío, proveedor sin archivo, error de lectura y tamaño excesivo tienen tratamiento explícito. Un fallo de archivo previo impide reemplazar datos.

## Evidencia de verificación

- `npm run check`: 107/107 pruebas, TypeScript correcto, ESLint cero errores/una advertencia histórica AxeBuilder, compilación auxiliar Functions correcta. No se desplegó ni se requiere Functions.
- Trece pruebas nuevas: cinco de lógica/persistencia, seis del límite nativo del selector (dependencias Android simuladas) y dos del componente usando React Test Renderer: seleccionar/revisar/confirmar y cancelar/archivo inválido posterior. El total previo era 94 y el actual 107. No interpretar esas simulaciones como hardware real.
- Se conserva el fallo previo de BOM/JSON inválido, el fallo previo de pantalla y la ejecución posterior en `artifacts/validacion/json-121/`.
- Exportación web individual y Metro Android correctas. Bytecode Hermes versión98, igual al runtime instalado.
- La prueba Playwright de navegador NO se completó: Chromium abortó antes de abrir la aplicación por `socket() failed: Operation not permitted`. Se conserva ese registro y el test listo para un entorno compatible. No se contabiliza como prueba UI aprobada.

## Construcción del APK

Corrección de JavaScript sobre el runtime nativo exacto de 1.2.0; NO es una recompilación Gradle de bibliotecas. Se ejecutaron Expo export:embed y hermesc de las dependencias bloqueadas. El script `scripts/package-json-hotfix.py` verifica SHA del APK base, dependencias/lockfile y versión de bytecode. Cambia únicamente contenido de AndroidManifest.xml, assets/app.config y assets/index.android.bundle. Las 22 bibliotecas y todos los DEX/recursos conservan sus bytes.

Se comprimieron el bundle y las bibliotecas para la distribución. El manifiesto habilita extractNativeLibs: Android extrae los mismos archivos al instalar. Se verificaron CRC, alineación, package, versionCode y firma. Firma interna de plantilla igual a la anterior; no es un keystore productivo.

APK: `repartos-chema-local-1.2.1-arm64.apk`, 30.016.589 bytes, versión1.2.1/code4, package `com.grupochema.repartos`, ARM64, Android7+. SHA256 `8135af0ed6193fd25d10b16d9dda2c13776d6b474b078106d810c9966d09f029`. APKv2/v3 verificadas; certificado SHA256 `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`.

No hay dispositivo/emulador conectado. Primera apertura, instalación encima conservando datos, lectura de un proveedor Android y tiempos de apertura del bundle comprimido siguen pendientes de prueba física. Se entrega como candidato verificable para esa prueba.

## Distribución y límite encontrado

El APK completo se entrega adjunto en el chat. El conector GitHub rechaza solicitudes superiores a16MiB: se intentó subir el APK completo y devolvió ese error explícito. Git por HTTPS no tiene credenciales locales. No se activaron Actions, facturación, Firebase ni servicios pagos.

Para conservar todos sus bytes remotamente, `descargas/android/v1.2.1-local.1/` contiene cuatro partes binarias y un script Python que reconstruye el APK y verifica su SHA256 antes de escribirlo. Esto es un respaldo completo, **no un enlace de descarga a un APK único**. La publicación de ese único archivo en descargas queda pendiente de un transporte Git autenticado sin ese límite. Las versiones previas no se modifican.

Instalar el APK adjunto encima de la versión anterior, sin desinstalar. Guardar copia JSON externa antes. Elegir el JSON de cinco pedidos, revisar5/10 y confirmar. Si falla, conservar el mensaje exacto; no borrar el almacenamiento.

Respaldo de instalador publicado y referencia verificada: `descargas/c1ffc8761e73222d830e75e57bdac2c8417b536d`. Los cuatro SHA de blob devueltos por GitHub coinciden con los calculados localmente para las partes. Reconstrucción local aprobada con SHA256 idéntico al APK entregado; no se afirma descarga binaria remota ni instalación física.
