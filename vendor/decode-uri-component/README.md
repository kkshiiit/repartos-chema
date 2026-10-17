# Compatibilidad de seguridad para query-string7

Fuente oficial npm decode-uri-component0.5.0, licencia MIT conservada. SHA256 del upstream sin modificar: 9401353df38f8010ad7035fe8d666bce6a4902bc1cff809afc4ab23fa2e0bdaa.

La0.2.2 usada por ExpoRouter/query-string7 tiene un decodificador recursivo que bloquea con URI malformadas largas (GHSA-vcc3-ghjq-m6fr). La0.5.0 corrige el recorrido, pero es ESM. Este adaptador devuelve una función CommonJS y conserva la normalización de + a espacio de0.2.2. No cambia el router ni su API.

Reproducir decoder.cjs con la dependencia esbuild existente:

```sh
npx --no-install esbuild vendor/decode-uri-component/upstream.mjs --format=cjs --platform=neutral --target=es2020 --outfile=vendor/decode-uri-component/decoder.cjs
```

Prueba de regresión en tests/uri-decoder.test.ts, incluyendo entrada adversaria en worker con límite, caracteres españoles y API CommonJS. Conservar este paquete y el lock en el ZIP fuente. Revaluar/eliminar el override cuando ExpoRouter adopte una versión upstream compatible sin él.

El paquete local se declara como dependencia directa `file:vendor/decode-uri-component` y el override referencia `$decode-uri-component`. Así npm resuelve el enlace desde la raíz. Un override file relativo únicamente transitivo produjo en el lock un destino inexistente dentro de query-string; una instalación incremental lo ocultaba y `npm ci` limpio fallaba. La instalación limpia y la prueba del consumidor CommonJS son obligatorias al modificar este bloque.
