# Repartos Chema 1.4 — papel, tinta y cobalto

**APK1.4.0/code7 compilado, publicado en descargas y recuperado desdeGitHub con hash coincidente. Prueba física Android pendiente.**

## Alcance implementado

La especificación adjunta reemplaza Aurora por una interfaz de papel cálido, tinta y cobalto. Se conservaron el logo original, cuatro pestañas, funciones operativas y documentos institucionales. No se reemplazaron dominio, repositorio, SQLite, migraciones, fotos ni validación JSON para rediseñar.

- Tokens compartidos, títulos serif de sistema y cuerpo sans; no descarga de fuentes. Claro/oscuro/sistema persistentes. Fondo estático y transiciones breves, reducir movimiento.
- Alquileres con resumen compacto, búsqueda, filtros de zona desplegables, estados y tarjetas legibles sin cajas interiores repetidas. Retirados sigue agrupando los estados técnicos.
- Depósito con existencias compactas, nombres completos y menú por pieza para editar/mover/ajustar.
- Viaje conserva prioridad real, orden manual, permiso de ubicación y enlaces externos con regreso al depósito. No se inventa optimización vial.
- Historial cronológico con filtros desplegables y deshacer seguro existente.
- Alta/edición en Cliente, Carga y Revisar: avanzar/volver no persiste; guarda sin duplicar ante doble toque. Si falla guardar carga después de crear el registro, conserva identidad/revisión para reintentar sin crear otro alquiler. Se muestra el error y no se anuncia éxito hasta terminar.
- Paneles uniformes, control de cambios sin guardar, cierre compartido X/Atrás/fondo/arrastre y guardados pendientes bloqueados. Corrección de doble Escape de React Native Web; restauración de foco comprobada en navegador. Por seguridad el Modal se retira inmediatamente al cerrar: no queda una capa invisible interceptando durante una animación de salida.
- Fechas de entrada DD/MM/AAAA con serialización ISO intacta; también acepta ISO completo. Borradores incompletos se conservan para validar.
- Detalle con fechas destacadas, materiales, faltantes/recuperaciones y fotos en secciones; ajustes, combos, documentos y copias unificados. Excel/Word conservan formato institucional rojo. No hay PDF nuevo.
- Bloque funcional independiente de avisos locales: fecha/hora elegidas, sin repetición automática, permisos al activar, estados persistidos, reintentos y cancelación por cambios/retirada/eliminación. Confirmación de texto tras persistencia; tonos y vibración de confirmación apagados inicialmente. Web informa que no programa avisos. Ver [AVISOS_LOCALES.md](AVISOS_LOCALES.md).

## Dependencias y recursos

Expo 57/RN 0.86 conservados. Solo se añadieron expo-audio ~57.0.5 y expo-notifications ~57.0.23 compatibles según el SDK instalado, para audio/avisos opcionales; no biblioteca visual nueva. No se activó backend, Firebase, facturación, publicidad, EAS ni hosting.

El plugin Android rechazó nombres numéricos de los WAV originales. Se incluyeron los mismos bytes con prefijo chema_ válido; originales intactos en docs/diseno-papel-cobalto/sonidos-v2. Reproductor sin micrófono ni reproducción permanente en segundo plano. Los canales locales no habilitan push remoto. La háptica previa de contadores se conserva y no es un sonido por botón; los controles de confirmación describen específicamente esa función.

## Validación

- npm ci completo en carpeta nueva con package/lock/vendor: 1564 paquetes instalados, sin cambiar versiones (4 minutos registrados). Avisos de deprecación transitivos conservados, no se promete ausencia de vulnerabilidades.
- npm run check: 218/218 pruebas (27 archivos), TypeScript, ESLint y build de Functions correctos. Compilar el código histórico Functions no lo despliega ni demuestra nube.
- npm run build:web: exportación individual limpia; se fija LOCAL_ONLY=true y se limpia la caché Metro para no reutilizar una transformación demo anterior. FCM sin configurar. El script descarta configuración Firebase heredada al generar el worker local.
- Recorrido final Playwright: **44/44 aprobados**, 3.7 minutos, sobre dist estable. Incluye instalación vacía, stock, alquileres, entrega/retiro/reingreso, triangulación, recuperación, responsables, combos, historial/deshacer, JSON, fotos y Word/Excel descargados.
- Evidencia visual: 206 capturas en cobalto/ y 65 de rutas, 80 superficies de contraste, cero violaciones automáticas y 0 entradas incomplete para revisión visual.
- Matriz nueva: 320/360/390/412 en claro/oscuro, 9 rutas + panel de carga por combinación, contraste renderizado y texto 200%. Pantallas secundarias y formularios abiertos capturados con datos sintéticos. Evidencia bajo artifacts/capturas/cobalto/ y cobalto-rutas-*.png.
- El texto al 200% es ampliación DOM en Chromium, no fontScale Android ni teclado físico. Axe no acredita TalkBack ni todos los píxeles: los casos incomplete exigen revisión visual.

## Errores encontrados y corregidos

1. Doble Escape web escondía la confirmación de descarte: manejo único por panel superior.
2. Botones y chips excedían el ancho con texto ampliado: límites flexibles y envoltura del texto, sin ocultar botones ni relajar las pruebas.
3. Caché Metro conservaba LOCAL_ONLY=false al cambiar entorno: exportación limpia y prueba real de instalación vacía.
4. Selectores/fotos/faltantes reubicados requerían recorridos actualizados; no se eliminaron funciones para aprobarlos.
5. Nombres WAV numéricos rechazados por el plugin: aliases válidos sin cambiar audio.
6. Prebuild regenera android/: clave privada original preservada/restaurada antes de Gradle.
7. Avisos locales: permisos concurrentes, cancelación aun con almacenamiento lleno, un fallo no bloquea otras cancelaciones, avisos demorados y temporizadores de confirmaciones corregidos y probados con adaptadores simulados.

Intentos fallidos documentados en artifacts/validacion/cobalto-ui-intento*.txt. El intento2 quedó además invalidado al regenerarse dist mientras seguía la suite: no se usa como evidencia final. Solo el recorrido final sobre dist estable acredita resultados.

## Android y entrega

Versión1.4.0/code7, paquete com.grupochema.repartos. Gradle completo correcto en10m36s,658tareas(630ejecutadas/28al día). APK56.039.655bytes, firma v2 y certificado original fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c. CRC, ARM64 único, minSDK24, no debuggable, SQLite nativo, tres tonos por tabla Android y SHA correctos. AAPT compacta rutas (res/52.wav,etc.); el verificador resuelve cada recurso y compara sus bytes con el original, sin asumir nombres de archivo dentro del APK.

[Descargar APK](https://github.com/kkshiiit/repartos-chema/raw/refs/heads/descargas/android/v1.4.0-local.1/repartos-chema-local-1.4.0-arm64.apk). Publicado en descargas7c9a282 y recuperado desde un clon independiente. SHA256 **79ad05905267460596270333316403796465e5bc9e874d478b04ca8710ca6bb1**, coincide con el compilado local. Informe en artifacts/validacion/android-1.4.0-apk.json y cobalto-recuperacion-github-apk.json. Primera compilación detenida antes de Gradle por nombres WAV, corregida sin cambiar sonidos. Las versiones previas permanecen en descargas.

[FuenteZIP, manifiestos y web reproducible](https://github.com/kkshiiit/repartos-chema/tree/descargas/respaldos/v1.4.0-local). No incluyen firma privada ni credenciales. Fuente876bf4a, web y base recuperadas desdeGitHub(b38e226); CRC/hash correctos y806archivos de fuente coinciden con su manifiesto. Informe cobalto-recuperacion-github-fuentes.json. Se añade una copia de cierre posterior con este checkpoint final, sin cambiar el código del APK.

Sin dispositivo/emulador ADB conectado. Pendiente prueba física de actualización, SQLite/migración real, cámara/galería, teclado, carpeta/compartir, permisos y notificaciones. No hay métricas físicas FPS/RAM/batería. La firma sigue siendo interna de plantilla, no identidad de publicación comercial.

## Comprobación breve en tu Android

1. Antes de actualizar: Ajustes → Descargar copia. Elegir carpeta fuera de la app y conservar el JSON; no desinstalar ni borrar datos.
2. Instalar el APK nuevo encima de la versión existente. Si Android indica firma incompatible, detenerse y conservar la instalación actual; no desinstalar para forzar.
3. Abrir y comparar cantidades, alquileres, historial y fotos con la versión anterior. Si aparece recuperación/migración fallida, no vaciar: guardar el mensaje y usar las recuperaciones explícitas.
4. Cerrar completamente y reabrir en modo avión: verificar datos y tema. En instalación nueva sin datos previos, inventario vacío.
5. Crear un alquiler identificable como prueba, avanzar/volver/cambiar tema, preparar carga y revisar. No confirmar movimientos con existencias reales solo por probar. Para probar entrega/retiro, usar material de prueba y verificar las cuatro cantidades antes/después.
6. Guardar una nueva copia JSON; comprobar que existe fuera de la app. Abrir Word/Excel con las aplicaciones disponibles y probar Compartir; cancelar un selector no debe anunciar un archivo guardado.
7. Probar cámara/galería y GPS cuando estés en una ubicación conocida; denegar permiso debe dejar una explicación y permitir seguir usando el resto.
8. Si querés avisos: elegir explícitamente una fecha/hora cercana en un alquiler de prueba, autorizar, verificar silencio/No molestar y cancelar/modificar el alquiler para comprobar que el aviso obsoleto se retira. No confiar en puntualidad exacta con restricciones de batería.

No hay sincronización entre celulares ni continuidad garantizada de código en una sesión cerrada. El uso comercial permanece individual y local. Conservar copias privadas fuera del dispositivo.

## Archivos y commits

[Listado exacto de archivos de esta edición](../artifacts/validacion/cobalto-archivos.txt) comparado con1e5dcc9; las capturas y referencias son archivos de evidencia, no pantallas adicionales.

| Capa | Archivos principales | Motivo |
|---|---|---|
| Sistema visual | src/theme/tokens.ts, components/ui.tsx, MotionView, StatusChip, SmartCounter, ThemeToggle, AuroraBackground, useMotionPreferences | Paleta/escala únicas, botones y paneles seguros, fondo sin bucles; nombres antiguos conservados por compatibilidad interna |
| Navegación y pantallas | app/(tabs)/*, app/(auth)/login.tsx, app/obra/[id].tsx, configuracion, combos, exportar | Estructura, jerarquía, acciones y filtros |
| Formularios | ObraForm, LoadEditor, OperationForm, FaltantesForm, ScaffoldSelector | Wizard, borradores, revisiones y protección contra duplicados |
| Herramientas | Editorial, BackupImport, LocalBackupActions, WelcomeProvider | Secciones, revisión JSON y guía; servicios de inventario intactos |
| Avisos | FeedbackContext, FeedbackSettings, RentalReminderPanel, services/feedback/* | Preferencias independientes y recordatorios locales |
| Entrada de fecha | utils/dateInput.ts | Presentación humana sin modificar serialización/domain |
| Empaquetado | app.json, package/lock, build-web-local.mjs, build-workers.mjs, build-android-demo.mjs, verify-android.py | Versión1.4.0/code7, depscompatibles, modoindividual, firma y comprobaciones |
| Pruebas | formularios-cobalto, panels, local-reminders/notifications/feedback, date-input, tests/ui/* | Regresiones reales y evidencia renovada |

Commits publicados por bloques:1542ce4 (insumos/deps),80d4649 (primitivas),d35a01c (avisos),d7e9187 (rutas/wizard),72e6971 (cierres/texto200/buildlocal),679807b (recursosAndroid/firma),8cc746a (44recorridos/capturas). El APK entregado usa código funcional679807b; commits posteriores de documentación/evidencias no alteran el runtime.

## Rendimiento y límites

No hay animaciones de fondo, desenfoque por fila ni fuentes de red. Listas de alquileres/depósito/historial conservan FlashList; generadores pesados siguen separados en chunks web. La exportación registra entry web5.5MB sin comprimir, ExcelJS944KB y Word501KB como chunks separados (valores de Metro, no tiempo de inicio ni RAM física). No se inventa una mejora porcentual. Los reportes80/44 corresponden a navegador/fixtures, no rendimiento ni permisos de un Android real. No se prometen cuotas externas ilimitadas; el funcionamiento principal no requiere servicios pagos.

## Estado por módulo

| Apartado | Estado |
|---|---|
| UI en navegador, temas, wizard, paneles, documentos web y copia JSON | Completado y comprobado en pruebas descritas |
| Integridad comercial existente y migración | Pruebas de dominio/repositorio/adaptadores aprobadas; migración real de la instalación del usuario pendiente |
| Avisos, audio, cámara/galería, SQLite y compartir nativos | Implementados, adaptadores/pruebas simuladas; validación física pendiente |
| APK release y descarga GitHub | Completado y comprobado estructuralmente/firma/hash/recuperación; instalación física pendiente |
| Backend/multiusuario/publicación comercial | Fuera del alcance individual; no activados |

Las integraciones *.integration.test.ts están excluidas explícitamente de la suite local y no se ejecutaron; no se presentan como aprobadas. No hubo despliegues ni facturación. GitHub aceptó el APK(53.44MiB) con aviso de tamaño recomendado50MiB; no se activó LFS ni servicio pago.

## Entregables comprobados

- APK único: descargas/android/v1.4.0-local.1/repartos-chema-local-1.4.0-arm64.apk, SHA79ad05905267460596270333316403796465e5bc9e874d478b04ca8710ca6bb1,56.039.655bytes.
- Fuente876bf4a: descargas/respaldos/v1.4.0-local/repartos-chema-876bf4a.zip, SHA24fd0dc715394949ea4ab19d576cb18c15fe62236ef34fed997509b3cc6d5ee5,806archivos restaurados/verificados. La carpeta también conserva la copia de cierre con documentación final.
- Web: repartos-chema-web-1.4.0.zip, SHA3471e9a4f6124b09451699a4212c34683d5aa5939aade29e47bf44dd2ed47a88; requiere Node/servidor local, no URL pública.
- Base previa al rediseño: base-1e5dcc9-antes-cobalto.zip, SHA05ea842e7f3336cca139fc652830f07a7da454b1532bce1708c27105ac21a633.
- Evidencias:271capturas actuales, logscheck/web/44UI/Gradle, reportes de contraste/firma/metadatos/recuperación en Gitmain. Las7versionesAPK históricas siguen en el árbol de descargas.

El cierre no necesita claves Firebase ni permisos de pago. Lo pendiente requiere tu Android: actualización con datos, cámara/galería, GPS externo, guardado/compartir real, aviso local en silencio/DND, TalkBack y escala/teclado nativos. No se declara validado lo que depende de ese dispositivo.
