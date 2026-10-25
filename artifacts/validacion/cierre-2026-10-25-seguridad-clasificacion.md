# Clasificación acotada de avisos nuevos — cierre individual 1.6.1

Fecha de revisión: 25/10/2026. Alcance: lectura del informe npm existente, árbol instalado, lockfile e importaciones propias. No se instalaron dependencias ni modificaron aplicación, lockfiles o configuración. Se aplicaron como guías los perfiles `chema_qa_evidencia` y `chema_entrega_android`.

## Resultado

`cierre-2026-10-25-audit-raiz.json` registra **21 entradas: 12 altas, 9 moderadas, 0 críticas**. Incluye propagaciones entre paquetes; no son necesariamente 21 defectos independientes. No reutilizar como resultado actual las nueve entradas registradas el 24/10.

Los avisos nuevos consultados —basic-ftp, fast-uri, ip-address, undici, body-parser y OpenTelemetry— aparecen **exclusivamente bajo `firebase-tools@15.33.0`**, declarado como dependencia de desarrollo. Todos los nodos afectados inspeccionados tienen `dev: true` en el lockfile. No se identificó una importación de esos paquetes en `app/`, `src/` o `functions/src/` ni un camino suyo de ejecución local Android.

| Paquete/versiones instaladas | Cadena observada desde firebase-tools | Alcance del aviso |
|---|---|---|
| basic-ftp 5.3.1 | proxy-agent 6.5.0 → pac-proxy-agent 7.2.0 → get-uri 6.0.5 | Complejidad cuadrática al analizar listados Unix FTP; GHSA-c475-qrg2-pj4r. Herramientas CLI/proxy, sin cliente FTP propio de la app. |
| fast-uri 3.1.8 | ajv 8.20.0, también vía ajv-formats 3.0.1, exegesis 4.3.0 y @modelcontextprotocol/sdk 1.32.1 | Normalización/confusión de esquemas, host y rutas; GHSA-w74x-v6f9-j3xg, GHSA-xhq7-xmqj-769h, GHSA-wjr9-j795-jxcr y GHSA-333x-w4r6-6crp. Validación de herramientas CLI/MCP. |
| ip-address 10.7.3 | @modelcontextprotocol/sdk → express-rate-limit 8.7.1; también proxy-agent → socks-proxy-agent 8.0.5 → socks 2.8.10 | Tiempo cuadrático en Address6/identificador de zona; GHSA-rxp7-6hxx-x8q5. Herramientas MCP/proxy. |
| undici 6.29.0 | Dependencia de firebase-tools | Parser EventSource y exceso de content-encodings; GHSA-4qv8-2p9j-2685 y GHSA-xjj6-f33q-929c. Cliente HTTP de herramientas. |
| undici 8.11.2 | superstatic 10.0.0 → re2 1.27.0 → node-gyp 13.1.0 | Los anteriores y bypass de comprobación SRI GHSA-f72v-6w45-q472; este nodo tiene además `optional: true`. Herramientas de construcción/hosting local. |
| body-parser 1.20.8 | Directo CLI, express 4.22.3 y exegesis 4.3.0 | DoS por bytes finales tras cuerpo comprimido; GHSA-27r3-jxmh-p828. Servidores de herramientas. |
| body-parser 2.3.0 | @modelcontextprotocol/sdk 1.32.1 → express 5.3.0 | Mismo aviso, otra línea de versión. Servidor MCP de herramientas. |
| @opentelemetry/core 1.30.1 | @google-cloud/pubsub 5.3.1 | Asignación sin límite al propagar W3C Baggage; GHSA-8988-4f7v-96qf. Cadena Pub/Sub de Firebase CLI. |

Por este análisis acotado **no son bloqueos del APK individual local**. Sí deben conservarse como mantenimiento pendiente del entorno de desarrollo. Evitar exponer a terceros servidores CLI, MCP o emuladores; revisar parches compatibles en una tarea separada. No se propone downgrade de Expo/Firebase CLI ni `npm audit fix --force`. El backend Functions histórico tiene su propio informe y no se incluye en el APK; este documento no sustituye su revisión.

## Evidencia y comandos ejecutados

- Informe leído: `artifacts/validacion/cierre-2026-10-25-audit-raiz.json`.
- `npm ls basic-ftp fast-uri ip-address undici body-parser @opentelemetry/core --all`: salida correcta, todas las ramas afectadas bajo Firebase CLI.
- Inspección con Python de `package-lock.json`, claves `packages[node_modules/...]`: `dev: true` para firebase-tools y todos los nodos arriba enumerados; `optional: true` adicional en `node_modules/node-gyp/node_modules/undici`.
- `rg -n 'firebase-tools|basic-ftp|fast-uri|ip-address|undici|body-parser|@opentelemetry' app src functions/src scripts package.json functions/package.json .gitignore`: coincidencias propias sólo en `package.json` (devDependency) y `scripts/emulator-local.cjs` (Agent de undici para emuladores locales). Ninguna importación en aplicación o generadores propios.

## Límites

Esto clasifica alcance y procedencia; **no demuestra ausencia total de vulnerabilidades**, no es una auditoría binaria exhaustiva ni reproduce explotación. No se ha ejecutado la aplicación en un Android físico, y el resultado no acredita permisos, rendimiento, migración o notificaciones reales. Las vulnerabilidades de herramientas siguen existiendo en el árbol instalado aunque no se haya identificado un camino en el APK local. Se mantienen los avisos previos de node-forge, uuid y Zod transitivo de Expo CLI en sus informes; Zod directo de la aplicación está parcheado a 4.6.6.
