# Repartos Chema 1.4 — papel, tinta y cobalto

**En validación de entrega. No acredita todavía un APK publicado.**

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

Versión prevista 1.4.0/code7, paquete com.grupochema.repartos. Gradle completo local en curso; certificado original fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c preservado. Primer intento se detuvo en prebuild por nombres WAV; no se presentó como APK.

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
