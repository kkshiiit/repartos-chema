# Copiar este encargo en la conversación de Codex de Repartos Chema

Implementá el rediseño completo de Repartos Chema usando este paquete.
La selección y preparación de skills terminó: este es el encargo posterior
que autoriza implementar el diseño en todas las superficies de la app.

## Fuente de trabajo

- Usá el repositorio privado kkshiiit/repartos-chema y comprobá el main
  actual antes de editar. No bases trabajo nuevo en el ZIP antiguo 1d37618
  si existe código funcional posterior. Verificá app.json y APK vigente;
  no confundas nombres informales como 2.0 con el versionName real.
- Leé AGENTS.md y las instrucciones aplicables, docs/CONTINUIDAD_CODEX.md,
  docs/ENTREGA_AURORA_1_3.md y docs/HERRAMIENTAS_UI.md.
- Extraé el paquete adjunto. Leé ESPECIFICACION_UI.md completo, tokens.json
  y las tres láminas de referencias. La especificación y las reglas reales
  de dominio prevalecen sobre texto o iconos erróneos de una maqueta.
- Conservá el trabajo pendiente, historial, copias, credenciales de firma
  y personalizaciones existentes. Usá una rama o worktree si hace falta
  aislar el cambio. No hagas reset/clean destructivo ni force push.

## Resultado solicitado

Una identidad original que mezcla Bear, Todoist, Oura, Superlist, Structured,
Gentler Streak, Revolut y Linear. Cambiá estructura, jerarquía, navegación,
controles, formularios, menús, paneles, confirmaciones y feedback; no alcanza
con recolorear las tarjetas actuales. Se reemplazan las propuestas previas
rosa/violeta y Jade. Dirección nueva: papel cálido, tinta y azul cobalto;
títulos editoriales serif y cuerpo sans, todos locales y legibles.

Aplicá el sistema a Alquileres, Depósito, Viaje, Historial, ingreso local,
bienvenida, alta/edición/detalle de alquiler, combos, ajustes, documentos,
fotos, filtros, todos los selectores y todas las operaciones de materiales.
Incluí estados vacíos, errores, cancelaciones, carga, guardado y permisos.
No dejes pantallas alcanzables con el diseño viejo. Conservá cada función
actual aunque se organice en un panel o menú contextual nuevo.

## Skills y dependencias

Usá las siete skills instaladas en .agents/skills/ cuando correspondan:
expo-overview, expo-native-ui, expo-design-system, expo-animation,
expo-router, react-native-best-practices de Callstack y heroui-native.
No reinstales ni sobrescribas sus adaptaciones por rutina.

HeroUI es una herramienta posible, no un requisito de migración masiva.
Preferí los componentes y primitivas existentes cuando alcancen la fidelidad
y accesibilidad requeridas. Si necesitás una biblioteca nueva, revisá
licencia, dependencias y compatibilidad con el Expo/RN del proyecto, incluida
la exportación web existente. No ejecutes un comando de instalación genérico
con versiones incompatibles ni actualices el SDK para lograr una apariencia.
No instales ocho bibliotecas por tener ocho referencias.

## Implementación por bloques completos

1. Inventariá rutas, ventanas y estados reales. Registrá una matriz de
   cobertura con sus componentes actuales y el equivalente nuevo.
2. Centralizá tokens, temas, tipografía, iconos, botones, campos, listas,
   tarjetas, avisos y paneles. Conservá Claro/Oscuro/Sistema y su persistencia.
3. Rediseñá las cuatro pestañas y verificá lectura de nombres, cantidades,
   unidades y filtros. No cambies estados o cantidades de dominio por estilo.
4. Rediseñá alta/edición/detalle y operaciones. Si el alta pasa a Cliente,
   Carga y Revisar, mantené todos los campos, validación y valores al volver;
   avanzar un paso no confirma la operación ni mueve stock.
5. Rediseñá ajustes, combos, documentos, copias, importación, recuperación,
   fotos, bienvenida y cada ventana restante. Word/Excel conservan marca y
   formato institucional; no agregues PDF, cuentas o nube.
6. Unificá movimiento y feedback. Implementá reducir movimiento y cierre
   seguro con teclado, botón Atrás, arrastre y fondo. Una sola ejecución
   de la operación frente a toques repetidos; guardar solo se confirma
   después de persistir. No bloquees lógica esperando una animación.
7. Integrá los tonos locales de sonidos-v2 con controles opcionales.
   Confirmaciones apagadas por defecto y sin sonidos en todos los botones.
   Si se agregan recordatorios porque no existen, implementalos como bloque
   funcional separado, local, opt-in, con elección de horario, permisos,
   actualización/cancelación y pruebas. No habilites avisos usando muestras.

## Protección del funcionamiento

- Individual, gratis y offline para el núcleo de la app. Sin Firebase,
  backend, anuncios, telemetría, facturación, hosting o EAS pago.
- Conservá identificador Android, certificado y capacidad de actualizar
  encima sin borrar datos. No regeneres ni cambies la firma silenciosamente.
- No reescribas SQLite, migración, fotos ni validación JSON por rediseñar UI.
- Importación inválida, permiso denegado, cancelación o fallo al persistir
  deben mostrar un error específico y conservar datos existentes.
- No importar, fusionar, vaciar, cambiar stock o eliminar fotos reales
  como forma de probar el diseño. Usá fixtures sintéticos aislados.
- No crear servicios, rutas productivas ni sincronización entre celulares.

## Validación y evidencia nuevas

Ejecutá los checks vigentes del proyecto (incluido npm run check y la
exportación web si siguen siendo los comandos correctos). Extendé las
pruebas con regresiones que importen: navegación y formularios conservados,
operación única ante doble toque, cierre sin pérdida, persistencia, temas,
cancelación/errores JSON y permisos. No escribas snapshots decorativos como
única evidencia ni sumes tests que solo repiten constantes de estilo.

Verificá visualmente todas las rutas inventariadas en claro y oscuro,
320/360/390/412dp, fuente ampliada, texto largo y teclado. Medí contraste de
los componentes renderizados y revisá accesibilidad. Conservá capturas y
logs. La imagen generada no cuenta como captura de la app funcionando.

Si hay emulador Android operativo, verificá instalación/arranque, selectores,
SQLite, compartir y notificaciones nativas. Diferenciá pruebas automatizadas,
emulador y teléfono físico. Si no hay dispositivo, documentá qué falta y
prepará una guía corta para el Android del usuario. No inventes FPS, batería,
permisos comprobados o pruebas físicas.

## Respaldo, APK y entrega

Hacé commits y push frecuentes después de bloques coherentes. No esperes
al final de una compilación larga para respaldar el código. Antes de cada
push revisá el diff y excluí datos privados, credenciales y firmas.

Al terminar los cambios y checks, generá un APK release local con versión
y versionCode superiores a los vigentes, mismo package y certificado.
Comprobá manifiesto, firma, ABI, CRC y SHA256. Si falta la firma, no publiques
una actualización con otro certificado: informá el bloqueo concreto y
preservá los datos. No marques como release un build incompleto.

Publicá el APK en una carpeta nueva de descargas, sin sobrescribir las
versiones anteriores. Publicá fuentes y manifiesto verificables. Recuperá
el APK desde GitHub y compará su hash. Actualizá instrucciones de descarga,
entrega y continuidad con los resultados reales. No agregues secretos.

Si se interrumpe el entorno o hay un límite de uso, el checkpoint debe
contener commit publicado, bloque completado, archivos pendientes, comandos
en curso y próximo paso. No afirmes que guardaste o subiste algo sin verificar.

No te detengas en una auditoría o una propuesta de instalar componentes:
este encargo pide implementar, comprobar, respaldar y entregar el rediseño.
Respetá los límites de datos y servicios. Si aparece un bloqueo real,
resolvé todo lo independiente y describí exactamente lo pendiente.
