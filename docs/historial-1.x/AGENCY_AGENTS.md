# Agency Agents para Repartos Chema

## Estado actual: catálogo completo

Por instrucción posterior del usuario se amplió la selección inicial a **282perfiles de18divisiones**:275nuevos más los7`chema_*` conservados. Se instalaron únicamente definiciones Codex dentro de `.codex/agents/`; no se modificó, compiló ni ejecutó la aplicación. Base de esta ampliación: main`21f33ba`, árbol limpio y remoto coincidente.

[**Índice de los282perfiles y nombres para invocarlos**](AGENCY_AGENTS_CATALOGO.md) · [Procedencia completa](../.codex/agents/CATALOGO.origen.json) · [Prueba de carga nativa](AGENCY_AGENTS.catalogo.verificacion.json).

La app sigue en1.6 individual Android/local/offline, con Expo57/RN0.86/TypeScript6/Router, SQLite/AsyncStorage, FlashList, avisos locales y Word/Excel. Instalar especialistas de otras plataformas no migra ese stack. Se mantienen las7skills/83archivos existentes, configuración personal, AGENTS.md, paquete/firma, fotos, JSON y datos; no se agregan dependencias, MCP, proveedores o servicios.

## Perfiles preferentes para esta app

| Perfil | Trabajo habitual |
|---|---|
| `chema_arquitectura_datos` | Invariantes, persistencia, importación y recuperación |
| `chema_react_native` | Desarrollo Expo/React Native y funciones nativas |
| `chema_accesibilidad` | Temas, contraste, teclado/TalkBack y composición |
| `chema_qa_evidencia` | Requisitos, regresiones y evidencia verificable |
| `chema_rendimiento` | Medición y cuellos de botella reales |
| `chema_seguridad` | Validación, permisos, secretos y dependencias |
| `chema_entrega_android` | Respaldo, Gradle, firma y entrega de APK |

Los275genéricos están agrupados en `.codex/agents/catalogo/<división>/agency_<nombre>.toml`. Los7adaptados permanecen donde estaban. La coordinación elige uno o pocos perfiles por necesidad, no lanza los282 ni impone fases de todas las especialidades. Algunos ejemplos:

> Usá `chema_react_native` para revisar el flujo de entrega, sin modificar archivos.

> Usá `agency_frontend_developer` como apoyo para analizar la versión web, respetando el stack y sin implementar todavía.

> Usá el perfil pertinente del catálogo para esta tarea; conservá los límites y autorizaciones de Repartos Chema.

La referencia por `name` dentro de la sesión es el método documentado. `codex --agent` no es un flag disponible en el CLI verificado. Para abrir la raíz se admite `codex -C /workspace/repartos-chema`.

## Origen y conversión

Fuente revisada: [Agency Agents](https://github.com/msitarzewski/agency-agents), commit**`4e3ac3ca6604c75113f52c695dbddcc7af928b46`**. Se volvió a consultar main al ampliar, sin cambios respecto del origen de la selección inicial. Censo completo según `divisions.json`:18divisiones/282fuentes, todas con metadata y cuerpo válidos;0colisiones de nombre/slug/cuerpo.

Conversor oficial, ejecutado sólo en un directorio temporal externo al proyecto:

```bash
bash scripts/convert.sh --tool codex --out /tmp/chema-agency-complete-converted-20261024
```

Generó282TOML. Cada uno se contrastó con nombre/descripción/cuerpo de fuente:0diferencias de conversión. No se ejecutó el instalador global `install.sh` ni se copió a `~/.codex/agents/`.

Para275nuevos, se conserva el cuerpo completo convertido y se agrega contexto de Chema: seleccionar bajo demanda, alcance delegado, no ejecución automática, protección de datos/firma, no servicios/gastos/publicaciones sin autorización, comprobar stack y herramientas, distinguir ejemplos/metas de hechos o resultados. Se renombra a`agency_*` para evitar colisiones con roles incorporados y las adaptaciones actuales. Los7orígenes ya representados se mapean a`chema_*`, sin crear otra copia ni cambiar sus bytes.

Cada TOML sólo define `name`, `description`, `developer_instructions`; no traslada metadata `tools/services` a permisos o capacidades reales. No fija modelos, esfuerzo, proveedor, tier, confianza ni concurrencia: se heredan de la sesión. MIT original íntegra en [LICENSE.agency-agents](../.codex/agents/LICENSE.agency-agents). El registro inicial [ORIGEN.json](../.codex/agents/ORIGEN.json) permanece intacto; el completo registra282orígenes, nombres, rutas y hashes. Dos cuerpos upstream contienen U+0004; las cadenas se codifican con escapes TOML válidos, sin ejecutar ni truncar ejemplos.

## Verificación real y alcance

- `tomllib`:282TOML válidos, nombres/archivos únicos y correspondencia uno a uno con las282fuentes;275cuerpos originales íntegros y7adaptaciones idénticas a la instalación previa.
- **CodexCLI0.159.2 nativo:** app-server aislado, `CODEX_HOME` temporal, proveedor loopback sin servicio, sin claves ni inferencia. Sólo `initialize`, `initialized` y `config/read`; no `turn/start`.
- Reconocimiento positivo por control de duplicación: el loader detectó los282nombres de la ruta real. Todos los duplicados temporales se retiraron en`finally`; una nueva carga de los282finales terminó con**0advertencias**. No se confunde parsear TOML con verificar carga de Codex.
- La confianza para la prueba se configura sólo en home temporal: no se cambian permisos/configuración reales. Sin confianza, Codex deshabilita la capa del proyecto. [Evidencia completa](AGENCY_AGENTS.catalogo.verificacion.json).
- Hashes de la base verifican que la aplicación, los83archivos de skills y las7adaptaciones originales siguen intactos. Sólo cambian documentación/checkpoint y se añaden catálogo/procedencia. No se ejecuta `npm`, lint, pruebas de app, build o APK por esta instalación.

**Sesión actual:** el catálogo no se recarga automáticamente en su herramienta de delegación y ésta no expone `agent_type`. No se afirma que los282tipos ya sean seleccionables aquí. Para carga nativa, abrir/refrescar una sesión Codex desde el repositorio en un cliente compatible y con el proyecto considerado confiable. No se automatizó esa confianza.

Si el cliente no descubre tipos, el uso explícito es leer el TOML y aplicar sus instrucciones al encargo; eso es usar el perfil como guía, no demostrar un nuevo tipo de subagente ejecutándose. Instalarlos no otorga modelos, herramientas, créditos ni trabajo continuo; invocarlos consume la cuota disponible de Codex.

## Mantenimiento y antecedentes

Comprobar `installedSHA256` y personalizaciones antes de actualizar; no sobrescribir archivos locales por regenerar el catálogo. El conversor se mantiene fuera del proyecto y sus salidas se revisan antes de copiarlas. No convertir integraciones/ejemplos en perfiles duplicados ni reemplazar AGENTS.md. Una ampliación del catálogo no autoriza instalar sus herramientas ni modificar la app.

Instalación inicial: commit21f33ba,7adaptaciones, pruebas y licencia preservadas; su [registro nativo inicial](AGENCY_AGENTS.verificacion.json) sigue disponible. La antigua limitación a una selección quedó sustituida por el pedido expreso de instalar todos los perfiles, manteniendo selección de uso posterior.

Documentación oficial consultada: [Codex custom agents](https://developers.openai.com/codex/subagents/#custom-agents), [integración Agency/Codex](https://github.com/msitarzewski/agency-agents/blob/4e3ac3ca6604c75113f52c695dbddcc7af928b46/integrations/codex/README.md), [loaderCodex0.159.2](https://github.com/openai/codex/blob/rust-v0.159.2/codex-rs/agent-roles/src/loader.rs).
