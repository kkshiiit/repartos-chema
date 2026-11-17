# Preparación maestra vigente — 26/10/2026

Etapa1 de docs/ESPECIFICACION_MAESTRA_CHEMA.md: auditoría/plan, sin implementación. Se conservan íntegros los83archivos de las7skills históricas y sus adaptaciones/licencias/skills-lock. El texto inferior sobre esperar referencias1.3 es histórico; la nueva referencia Modern Dark ya está definida, pero escribir UI requiere etapa2.

Se agregaron sólo3skills documentales completas en .agents/skills, sin bibliotecas de app ni cambios a package/lock: **impeccable**, **visual-eyes**, **ux-designer**. Copia manual desde clones públicos, no add/update ciego ni symlinks; revisión y hashes en HERRAMIENTAS_UI.preparacion_2026_10_26.json. Ninguna carpeta previa existía con esos nombres. Notas al final de cada SKILL.md adaptan ámbito, Codex y Android preservando el original completo.

|Skill|Origen/commit|Licencia|Uso|
|---|---|---|---|
|impeccable|pbakaus/impeccable@989c484c091d26f10fa102767eefc0da2e62ec67, .agents/skills/impeccable|Apache2.0 + LICENSE.upstream y NOTICE.md|Operate/Android, auditoría/shape; revisión actual distinta a3671d50 histórico, registrada y no asumida idéntica|
|visual-eyes|DeHor-Labs/visual-eyes@c2ff5067353c6dbbcd09a4f0630147a042ba51e7, skills/visual-eyes|MIT + LICENSE.upstream|Abrir PNG con view_image; no simular Android a partir de web|
|ux-designer|szilu/ux-designer-skill@c869d32fd8df7bd7fcd1db68e93bd3e89eed5161, raíz + references/README|MIT + LICENSE.upstream|Formularios/mobile, notificaciones y conflictos; ejemplos HTML/CRDT no se trasladan al inventario|

`npx --yes skills@1.7.2 list --agent codex --json` reconoce10skills con alcance proyecto. Se verificaron todos los hashes nuevos y la integridad de los7directorios previos. No se afirma recarga automática del catálogo de esta sesión: lectura explícita desde .agents/skills/<nombre>/SKILL.md es alternativa. No se instalaron HeroUI, Foonto, otra UI, polyfills, MCP, SDK Supabase o Vercel skillpack. Callstack/Expo cubren sus casos; Taste/Interface/Emil no son sistemas paralelos necesarios.

Impeccable context se ejecutó una vez con target app/(tabs)/mapa.tsx y terminó0. Detectó ausencia de PRODUCT/DESIGN y pidió capturar contexto; se usa el encargo completo como fuente de verdad, sin inventar una entrevista ni dirección alternativa y sin crear duplicados de especificación. Plataforma confirmada manualmente por Expo/RN/Android; motor devolvió platform:null, no certificación. No se activaron hooks/detect web ni corregidores; no hay UI modificada para comparar después. Launcher gratuito descargado en caché de herramienta fuera de Git. Contexto y listado guardados en docs/evidencias-etapa1.

Se conservaron también docs/ci-comparison.md y tests/compare.cjs citados por Visual Eyes, sin ejecutarlos ni instalar dependencias auxiliares. Ese test conserva rutas upstream; si se usa desde Codex debe indicar COMPARE_SCRIPT con la ruta absoluta del compare.sh local. UX Designer conserva LICENSE además de LICENSE.upstream para que el enlace del README sea válido. Sus hashes figuran en el manifiesto.

Para aplicar después: leer estos SKILL y sus referencias pertinentes, más la especificación/plan. Android conserva componentes actuales salvo necesidad demostrada. Prioridad del usuario: cuatro pestañas inferiores incluso en ancho grande, fuentes Geist locales, sin gradientes/glass generales ni pagos. No seguir la recomendación genérica de rail lateral si contradiceD1. No ejecutar bucles Fix de Visual Eyes antes de autorizar etapa2. No ejecutar APIs pagas ni fallback de OPENAI_API_KEY al analizar videos; no hubo video nuevo ni transcripción aquí.

---

## Registro histórico de instalación anterior

# Skills para el futuro rediseño

Estado: **solo preparación documental; esperar referencias y especificación visual**. Las skills no autorizan instalar bibliotecas, actualizar Expo/RN/Reanimated, migrar datos, activar servicios o iniciar el rediseño. Los comandos de implementación que contienen no se ejecutaron. La app y su APK1.3.0 permanecen intactos.

## Base e instalación

Repositorio confirmado: `kkshiiit/repartos-chema`, main `d6fc0a1ed67ddac5d3584c0eee170c4b2eda50f0`, remoto coincidente y árbol limpio al comenzar. Se leyeron continuidad y entrega Aurora1.3. No había AGENTS.md aplicable, `.agents/skills` ni skills locales previas; no se reemplazaron instrucciones o personalizaciones existentes.

Se revisaron README y licencias de los tres repositorios oficiales, la ayuda de [vercel-labs/skills](https://github.com/vercel-labs/skills) y la [documentación oficial de Codex](https://developers.openai.com/codex/skills/). Instalador npm **skills1.7.2**, MIT, ejecutado mediante npx, sin añadirlo a las dependencias del proyecto. Las fuentes Expo/Callstack recomiendan también plugins para Codex; aquí se usó expresamente la instalación local por CLI solicitada, sin instalar plugins/MCP ni EAS.

Desde la raíz, los tres comandos terminaron correctamente:

```bash
npx --yes skills@latest add expo/skills --skill expo-overview expo-native-ui expo-design-system expo-animation expo-router --agent codex --copy --yes
npx --yes skills@latest add callstackincubator/agent-skills --skill react-native-best-practices --agent codex --copy --yes
npx --yes skills@latest add heroui-inc/heroui --skill heroui-native --agent codex --copy --yes
```

Sin `--global`; copias reales, no enlaces simbólicos. `skills-lock.json` es el inventario del instalador de skills, distinto de `package-lock.json`, que no cambió.

## Skills instaladas

La versión de esta tabla es la declarada por la **skill**, no una biblioteca instalada en la app. El commit fija exactamente la revisión de origen.

| Skill | Versión declarada | Origen | SKILL.md local |
| --- | --- | --- | --- |
| expo-overview |1.1.0| Expo, commit E |[Leer](../.agents/skills/expo-overview/SKILL.md)|
| expo-native-ui |1.1.1| Expo, commit E |[Leer](../.agents/skills/expo-native-ui/SKILL.md)|
| expo-design-system |1.0.0| Expo, commit E |[Leer](../.agents/skills/expo-design-system/SKILL.md)|
| expo-animation |1.0.0| Expo, commit E |[Leer](../.agents/skills/expo-animation/SKILL.md)|
| expo-router |1.0.1| Expo, commit E |[Leer](../.agents/skills/expo-router/SKILL.md)|
| react-native-best-practices |Sin semver en SKILL.md; fijada por commit| Callstack, commit C |[Leer](../.agents/skills/react-native-best-practices/SKILL.md)|
| heroui-native |2.0.1| HeroUI, commit H |[Leer](../.agents/skills/heroui-native/SKILL.md)|

- **E:** [expo/skills@927dd7cc2088ec2f0c73589fe2e94c3c973afc45](https://github.com/expo/skills/tree/927dd7cc2088ec2f0c73589fe2e94c3c973afc45), carpeta `plugins/expo/skills/<nombre>`.
- **C:** [callstackincubator/agent-skills@59e9d17446a248b21d86f078fcd0bd2d36db1ca4](https://github.com/callstackincubator/agent-skills/tree/59e9d17446a248b21d86f078fcd0bd2d36db1ca4), carpeta `skills/react-native-best-practices`.
- **H:** [heroui-inc/heroui@ce90ea3ab49d58f6c428f71bfd6fe8ae2a87b960](https://github.com/heroui-inc/heroui/tree/ce90ea3ab49d58f6c428f71bfd6fe8ae2a87b960), carpeta `skills/heroui-native`.

[Manifiesto de procedencia y SHA256](HERRAMIENTAS_UI.origen.json): ruta fuente/local, commit, versión, hashes de todos los archivos, licencias añadidas y adaptación local. Los siete SKILL.md coinciden byte por byte con su origen verificado.

## Verificación y referencias

- `npx --yes skills@latest list --agent codex --json`: reconoce exactamente7skills, todas `scope: project`, agente Codex.
- 83archivos instalados:77copiados del origen y6licencias de repositorio añadidas. Se verificaron todos contra los clones de origen fijados por commit.
- 95enlaces Markdown relativos comprobados, ninguno roto tras la adaptación descrita debajo. Se verificaron también las referencias/scripts enumerados en cada SKILL.md y la sintaxis de4scripts `.mjs` con `node --check`, sin ejecutarlos ni instalar paquetes.
- Una referencia contextual de expo-overview a `references/native-ios.md` pertenece explícitamente a `eas-app-stores`, no a expo-overview. Existe en el origen; EAS y esa skill no se instalaron. El overview enumera otras skills como catálogo, no como dependencias activadas.
- `git diff --cached --check` señaló80líneas con espacios finales heredados de Callstack (salida2); se compararon con el origen y se conservaron para no reescribir documentación ajena. No son cambios de la app. Los documentos locales y skills-lock pasan la comprobación de espacios.
- Los enlaces web generales son documentación externa; no se afirma haber probado todos sus endpoints ni compatibilidad de sus ejemplos con nuestro SDK57.

**Adaptación local única:** `react-native-best-practices/references/native-platform-setup.md` enlazaba mediante ruta relativa a `upgrading-react-native`, una octava skill no solicitada. Se cambió únicamente el destino de ese enlace por un permalink al archivo oficial en commit C. No se instaló la skill adicional ni se alteraron instrucciones técnicas. Los hashes original/adaptado están registrados. `skills-lock.json` conserva el hash de origen del instalador; consultar el manifiesto adicional para detectar esta adaptación y conservarla al actualizar.

**Licencias:** MIT de Expo copiada como `LICENSE.expo` en sus5carpetas; expo-animation conserva además su LICENSE MIT de Emil Kowalski. MIT de Callstack conservada en su carpeta. HeroUI conserva `LICENSE.txt` Apache2.0, idéntica a la licencia del repositorio de origen. No se cambió la licencia del proyecto.

## Descubrimiento y uso posterior

Codex reconoce `$REPO_ROOT/.agents/skills/<nombre>/SKILL.md` y busca esta carpeta desde el directorio de trabajo hasta la raíz del repositorio. La documentación oficial indica detección automática de cambios; **si no aparecen, reiniciar/refrescar Codex**. El listado del instalador está verificado; no se afirma que el catálogo de herramientas de esta sesión se haya recargado.

Si no hay descubrimiento automático, indicar explícitamente:

> Leé `/workspace/repartos-chema/.agents/skills/expo-design-system/SKILL.md` y sus referencias. Aplicala solo al trabajo que esté autorizado; todavía no iniciar un rediseño.

Para otra skill, sustituir el nombre. Los scripts HeroUI se leen/usan desde su propia carpeta, no desde la raíz de la app. No ejecutar el instalador de componentes mencionado en esa skill durante esta etapa.

Antes de futuras actualizaciones: comparar hashes y modificaciones locales con este manifiesto; no ejecutar add/update a ciegas sobre las carpetas existentes. La selección visual y cualquier dependencia nativa requieren su siguiente encargo. No se instalaron HeroUI Native, Foonto ni otras bibliotecas; no cambiaron pantallas, stock, SQLite/JSON/fotos, package/certificado Android, package.json o package-lock.json. No hubo build, APK nuevo, hosting ni servicios pagos.
