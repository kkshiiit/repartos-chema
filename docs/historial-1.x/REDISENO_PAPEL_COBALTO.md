# Ejecución: papel, tinta y cobalto

Base: main 1e5dcc9e56ebcfc032afa4af9c65b97e93c8480c. Encargo adjunto autorizado el 18/10/2026; reemplaza Aurora y no modifica reglas comerciales.

Paquete original SHA256: c4f14b48edeef052a0724676ddb0e65a4d3c326554759239a1c1c2559e6d40bc. Los 16 archivos declarados en su manifiesto se verificaron por tamaño y SHA256. Referencias y especificación preservadas en `docs/diseno-papel-cobalto/`. No son capturas de la app. Los tres WAV originales se incluyen localmente en assets/sounds.

Base inmutable: /workspace/respaldos/base-1e5dcc9-antes-cobalto.zip, CRC comprobado, SHA256 05ea842e7f3336cca139fc652830f07a7da454b1532bce1708c27105ac21a633.

## Cobertura de rutas y ventanas

| Superficie real | Componentes | Equivalente previsto |
|---|---|---|
| Ingreso local y bienvenida | login, WelcomeProvider | Identidad conservada, acceso individual, guía por pasos |
| Cuatro pestañas | tabs/_layout | Navegación compacta persistente |
| Alquileres / búsqueda / filtros / zona | index, CardObra, Select | Resumen compacto, filas legibles, filtros secundarios |
| Alta y edición | ObraForm, LoadDraft | Cliente / Carga / Revisar, borrador preservado |
| Detalle | obra/[id] | Fechas, materiales, acciones principales y menú secundario |
| Carga y combos aplicados | LoadEditor | Lista con contadores y revisión |
| Entrega/retiro/faltantes/triangulación | OperationForm/FaltantesForm | Panel adaptable, errores internos y cierre protegido |
| Recuperación y ubicación | obra/[id], SmartCounter | Panel protegido y confirmación explícita |
| Fotos y eliminación | PhotoImage, storageService | Registro local conservado y error contextual |
| Depósito / piezas | galpon, ScaffoldSelector | Existencias compactas, filas y menú de pieza |
| Ajuste / movimiento / pieza | galpon | Formulario con procedencia y confirmación |
| Viaje | mapa | Itinerario numerado, navegación y regreso al depósito |
| Historial / filtros / deshacer | historial | Cronología y filtros desplegables |
| Ajustes / temas / responsables / depósito | configuracion, TeamSettings, DepotSettings | Grupos de preferencias y herramientas |
| Copias / vaciado / recuperación | LocalBackupActions, BackupImport | Resumen validado y reemplazo explícito, sin alterar servicio |
| Combos / editar / eliminar | combos | Lista y editor protegido |
| Documentos Excel/Word | exportar | Selector de formato y formulario específico; documentos institucionales intactos |
| Selectores / confirmaciones / contador | ui, SmartCounter | Paneles uniformes con cierre único y teclado |
| Invitación heredada | equipo/unirse | Ruta heredada conservada; individual no ofrece vinculación |
| Avisos y sonidos (nuevo bloque independiente) | feedback/* | Recordatorios locales opt-in, horario elegido, sin nube |

## Dependencias justificadas

expo-audio ~57.0.5 y expo-notifications ~57.0.23 según bundledNativeModules del Expo 57 instalado. Necesarias para tonos originales locales y recordatorios opcionales; no se instala biblioteca visual ni se cambia SDK. Permisos solo al activar avisos. Confirmaciones inicialmente apagadas. Su instalación exige recompilación nativa completa, no un simple rebundle.

## Estado

Implementación en curso. Las pruebas históricas de Aurora no acreditan esta edición. No hay dispositivo físico disponible comprobado. No se modifican SQLite, migración, inventario ni validación de copias por estilo.
