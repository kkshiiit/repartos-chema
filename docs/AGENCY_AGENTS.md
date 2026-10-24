# Agency Agents para Repartos Chema

Instalación de orientación técnica, **sin cambios en la aplicación**. Base comprobada: repositorio privado `kkshiiit/repartos-chema`, main `55c0725af789bb1d0393a29569896ceb52a5ed47`, árbol limpio y remoto coincidente. App1.6.0 individual Android, Expo57/RN0.86/React19/TS6, Router/Context, SQLite/AsyncStorage, FlashList, avisos locales, Word/Excel y Vitest/Playwright. Las versiones son las observadas al instalar; cada especialista debe volver a verificarlas.

No había AGENTS.md aplicable en `/`, `/workspace`, raíz o subdirectorios del proyecto; no se creó ni reemplazó uno. Tampoco existían perfiles/configuración `.codex` del proyecto ni agentes personales TOML. Se conservaron las7skills y83archivos de `.agents/skills`, su manifiesto/licencias y `skills-lock.json`. Una skill no equivale a una biblioteca instalada ni a un agente en ejecución.

## Selección instalada

| Nombre para invocar | Alcance | Perfil original |
|---|---|---|
| [`chema_arquitectura_datos`](../.codex/agents/chema_arquitectura_datos.toml) | Arquitectura local, invariantes de inventario, persistencia y recuperación; decisiones pequeñas y compatibles. | [engineering-software-architect.md](https://github.com/msitarzewski/agency-agents/blob/4e3ac3ca6604c75113f52c695dbddcc7af928b46/engineering/engineering-software-architect.md) |
| [`chema_react_native`](../.codex/agents/chema_react_native.toml) | Especialista Expo y React Native para cambios Android locales, navegación, estado e integración nativa de Repartos Chema. | [engineering-mobile-app-builder.md](https://github.com/msitarzewski/agency-agents/blob/4e3ac3ca6604c75113f52c695dbddcc7af928b46/engineering/engineering-mobile-app-builder.md) |
| [`chema_accesibilidad`](../.codex/agents/chema_accesibilidad.toml) | Revisión móvil de accesibilidad, temas, foco, formularios y fidelidad visual con evidencia separada. | [testing-accessibility-auditor.md](https://github.com/msitarzewski/agency-agents/blob/4e3ac3ca6604c75113f52c695dbddcc7af928b46/testing/testing-accessibility-auditor.md) |
| [`chema_qa_evidencia`](../.codex/agents/chema_qa_evidencia.toml) | Contrastar requisitos con código y evidencia, regresiones de inventario y recorridos sin falsas declaraciones de Android probado. | [testing-reality-checker.md](https://github.com/msitarzewski/agency-agents/blob/4e3ac3ca6604c75113f52c695dbddcc7af928b46/testing/testing-reality-checker.md) |
| [`chema_rendimiento`](../.codex/agents/chema_rendimiento.toml) | Diagnosticar lentitud real de Android/React Native, listas, documentos y memoria; medir antes y después sin alterar integridad. | [testing-performance-benchmarker.md](https://github.com/msitarzewski/agency-agents/blob/4e3ac3ca6604c75113f52c695dbddcc7af928b46/testing/testing-performance-benchmarker.md) |
| [`chema_seguridad`](../.codex/agents/chema_seguridad.toml) | Revisor AppSec de datos locales, autorizaciones de dominio, importación, archivos y dependencias de Repartos Chema. | [security-appsec-engineer.md](https://github.com/msitarzewski/agency-agents/blob/4e3ac3ca6604c75113f52c695dbddcc7af928b46/security/security-appsec-engineer.md) |
| [`chema_entrega_android`](../.codex/agents/chema_entrega_android.toml) | Especialista en respaldo, compilación Gradle, firma y verificación de APK Android locales de Repartos Chema. | [engineering-mobile-release-engineer.md](https://github.com/msitarzewski/agency-agents/blob/4e3ac3ca6604c75113f52c695dbddcc7af928b46/engineering/engineering-mobile-release-engineer.md) |

La coordinación permanece en el agente principal. No se instaló todo el catálogo: quedan fuera marketing/redes, monetización, servidores/infraestructura cloud, stacks Laravel/Flutter y especialistas duplicados de desarrollo web o coordinación. Accesibilidad/QA/rendimiento se separan por evidencia y responsabilidad; reutilizan las skills técnicas existentes.

Cada TOML tiene únicamente `name`, `description` y `developer_instructions`. No fija modelo, esfuerzo, permisos, proveedor, MCP ni cuota/concurrencia. Hereda esas opciones de la sesión principal. Las restricciones de lectura del texto son instrucciones de trabajo, no un sandbox adicional. Instalar estos perfiles no consume inferencia; utilizarlos sí consume la cuota de Codex disponible y no concede créditos o continuidad automática.

## Procedencia y adaptación

Fuente oficial: [msitarzewski/agency-agents](https://github.com/msitarzewski/agency-agents), commit **`4e3ac3ca6604c75113f52c695dbddcc7af928b46`**, revisado el24/10/2026. Se leyeron README, integración Codex, conversor/instalador y los siete perfiles elegidos. Los tres perfiles móvil/seguridad/entrega fueron leídos por un especialista delegado; los cuatro restantes por el principal.

[ORIGEN.json](../.codex/agents/ORIGEN.json) registra rutas/permalinks, commit, hashes del original y de cada adaptación. [Licencia MIT íntegra](../.codex/agents/LICENSE.agency-agents), copyright2025AgentLandContributors, copiada byte a byte. No se cambió la licencia del proyecto.

Las adaptaciones son condensaciones en español de misión/metodología, **no copias idénticas**: se sustituyen ejemplos ajenos por dominio/logística/Expo/Android, se eliminan comandos obligatorios de plantilla, biografías o métricas pretendidas y certificaciones sin evidencia. Se exige preservar inventario/stock, idempotencia, almacenamiento/fotos/JSON/firma y diferenciar navegador/mocks/build de hardware. Siguen vigentes los límites de servicios gratuitos y autorizaciones del encargo.

El instalador upstream usa por defecto `~/.codex/agents/`. No se ejecutó ese instalador ni una conversión masiva. Se crearon sólo los siete TOML revisados en **`.codex/agents/`**, con prefijo`chema_` para no reemplazar `default`, `worker`, `explorer` u otros roles. No se creó `.codex/config.toml` ni se modificó configuración personal.

## Verificación real con Codex

Documentación vigente consultada:

- [Codex: custom agents, descubrimiento y esquema](https://developers.openai.com/codex/subagents/#custom-agents).
- [Agency Agents: integración Codex fijada al commit](https://github.com/msitarzewski/agency-agents/blob/4e3ac3ca6604c75113f52c695dbddcc7af928b46/integrations/codex/README.md).
- [Conversor oficial](https://github.com/msitarzewski/agency-agents/blob/4e3ac3ca6604c75113f52c695dbddcc7af928b46/scripts/convert.sh).
- [Loader de Codex0.159.2](https://github.com/openai/codex/blob/rust-v0.159.2/codex-rs/agent-roles/src/loader.rs), [descubrimiento](https://github.com/openai/codex/blob/rust-v0.159.2/codex-rs/agent-roles/src/discovery.rs) y [configuración del rol](https://github.com/openai/codex/blob/rust-v0.159.2/codex-rs/agent-roles/src/agent_role_config.rs).

Resultados actuales:

1. Python`tomllib`:7TOML válidos, los3campos requeridos no vacíos,7nombres únicos, nombres/archivos coincidentes, sin redefinir roles incorporados ni opciones ajenas.
2. Licencia y procedencia verificadas por SHA256; referencias locales de skills/documentos existentes. Sin dependencias de app añadidas ni scripts upstream ejecutados.
3. **CodexCLI0.159.2 real, loader de ámbito proyecto:** proceso app-server aislado con `CODEX_HOME` temporal, analytics desactivado, sin claves y proveedor de prueba en loopback sin servicio. Sólo `initialize` → `initialized` → `config/read`; **cero `turn/start` y cero inferencia**.
4. Para demostrar reconocimiento sin inventar un comando de catálogo, se añadieron duplicados de control temporales: el loader emitió exactamente7advertencias con los7nombres y la ruta real `.codex/agents`. Se retiraron todos en`finally`. Nueva carga de los7perfiles finales: **cero advertencias**, sin duplicados ni campos inválidos. [Registro nativo](AGENCY_AGENTS.verificacion.json).
5. El primer comprobador buscaba los nombres sin las comillas invertidas que usa el CLI: falló su aserción de extracción, no el loader. Se ajustó y repitió; los controles temporales se retiraron también tras ese intento.
6. La confianza necesaria para esa prueba se configuró **sólo en el CODEX_HOME temporal**. No se habilitó confianza, permisos ni servicios en la configuración real del usuario. La carga sin confianza devolvió una capa de proyecto deshabilitada; el resultado está documentado, no se presenta como catálogo activo de este chat.

`codex agents` enumera sesiones, no perfiles. `debug prompt-input` no expone los esquemas completos de herramientas y `config/read` no devuelve un catálogo resuelto. Por eso no se usaron como una falsa prueba de instalación. No se iniciaron pruebas/lint/build de la app ni otro APK: estos archivos no alteran su funcionamiento.

## Cómo invocarlos

En una **sesión nueva de Codex abierta en este repositorio**, con el proyecto considerado de confianza por tu cliente, pedí por su nombre exacto:

> Usá el agente `chema_react_native` para revisar el flujo de entrega. Sólo análisis, sin modificar archivos.

> Usá `chema_arquitectura_datos` para analizar el riesgo de este cambio de importación JSON y `chema_qa_evidencia` para definir las pruebas necesarias. No implementes todavía.

> Usá `chema_accesibilidad` para revisar estas capturas y los componentes correspondientes, respetando el diseño aprobado.

> Usá `chema_entrega_android` para verificar el APK existente, sin recompilar ni publicar.

Sólo elegí el especialista pertinente; no se exige ejecutar los siete. Para implementar, indicá tarea/archivos/resultado y autorización con claridad. La publicación, migraciones sensibles o gastos no se habilitan por invocar un perfil. No hay un flag `codex --agent` documentado por este CLI: la referencia por nombre dentro de la sesión es el método oficial. Opcionalmente se puede abrir el CLI con `codex -C /workspace/repartos-chema`.

**Límite de esta sesión:** su herramienta de delegación no expone `agent_type` y su catálogo no se recargó al escribir archivos. No afirmamos que estos siete tipos nuevos ya estén seleccionables aquí. Reabrir/refrescar Codex desde la raíz del repo permite el descubrimiento si el cliente lo admite; si pide confiar en el proyecto, esa decisión se hace en el cliente, no se automatizó para ocultar la limitación.

Si el cliente no descubre perfiles, el uso explícito alternativo es:

> Leé `.codex/agents/chema_react_native.toml` y aplicá sus `developer_instructions` al encargo autorizado. Informá si sólo estás usando el perfil como guía o si realmente se creó un subagente de ese tipo.

Esta lectura es una alternativa de contexto, no prueba de un subagente nativo ejecutándose ni de instalación global en otra PC/Work.

## Mantenimiento

Antes de actualizar: comprobar ORIGEN.json y comparar hashes con las personalizaciones actuales. Conservar diferencias locales; no sobrescribir por ejecutar install/update genérico. Revisar nuevos upstream, licencia y esquema Codex antes de adaptar. Nunca convertir toda la agencia ni reemplazar AGENTS.md por una plantilla.

El alcance de esta instalación termina en perfiles, procedencia, comprobación y documentación. La app1.6, su APK/firma, inventario, JSON/fotos/SQLite, package/lockfiles y servicios permanecen intactos. Para seguir desarrollando, leer el checkpoint y atender el nuevo encargo concreto.
