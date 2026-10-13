# Publicidad discreta

La app sigue siendo **solo para el equipo interno de Chema**. Con pocos usuarios, los ingresos programáticos pueden ser mínimos o nulos. No se promete rentabilidad. Un patrocinador local puede ser una alternativa comercial; la app no busca anunciantes ni cobra pagos por sí sola.

## Comportamiento

Solo hay un espacio al final de Obras y Galpón, dentro del contenido desplazable, separado de acciones. No hay intersticiales, videos, recompensas, anuncios de apertura ni publicidad sobre formularios. No se fuerza un anuncio si no hay conexión, consentimiento o disponibilidad. Un fallo publicitario no bloquea inventario.

Está desactivada por defecto. ADMIN la habilita en Configuración del dispositivo. El operador no puede activarla. Todos pueden gestionar las opciones de privacidad de AdMob. Se solicitan anuncios no personalizados y no se pasan nombres de clientes, datos de obras, coordenadas ni usuarios al SDK.

## AdMob móvil

1. Crear/configurar tu cuenta AdMob y registrar aplicaciones Android/iOS reales según los requisitos de distribución del proveedor.
2. Crear una unidad **banner** por plataforma. Copiar tus App IDs y Banner IDs a `.env` sin compartir claves de cuentas.
3. Configurar el mensaje de consentimiento en AdMob Privacy & messaging. El SDK UMP se ejecuta al habilitar publicidad. Publicar una política de privacidad real que describa el uso del SDK.
4. Configurar `EXPO_PUBLIC_ADS_PROVIDER=admob` y mantener `EXPO_PUBLIC_ADS_TEST_MODE=true` durante todas las pruebas.
5. Crear development builds con `npx expo run:android` / `npx expo run:ios` (herramientas nativas requeridas), o EAS con tu propia cuenta/configuración.
6. En Configuración, activar publicidad. Probar banner de 320×50, consentimiento, rechazo, falta de red y retorno a la operación. AdMob no funciona en Expo Go ni en web.
7. Solo después de aprobación y pruebas, usar IDs reales y `EXPO_PUBLIC_ADS_TEST_MODE=false` en un build de distribución. Los builds de desarrollo siguen usando `TestIds.BANNER`.

`react-native-google-mobile-ads` 17.2.0 declara RN >=0.86 y Expo >=47; se seleccionó para RN 0.86/Expo 57. Se validan tipos y bundles, **no una impresión real ni ingresos**.

`app.config.ts` usa IDs de aplicación **públicos de prueba de Google** como fallback para que el SDK nativo no falle por falta de App ID. No son credenciales de Chema ni generan ingresos. La app no inicializa publicidad mientras esté desactivada. La configuración retrasa la medición automática hasta la inicialización.

Referencias de los IDs de prueba:
- https://developers.google.com/admob/android/quick-start
- https://developers.google.com/admob/ios/quick-start
- https://docs.page/invertase/react-native-google-mobile-ads

## Patrocinio directo (web y móvil)

```dotenv
EXPO_PUBLIC_ADS_PROVIDER=sponsor
EXPO_PUBLIC_SPONSOR_NAME=
EXPO_PUBLIC_SPONSOR_TEXT=
EXPO_PUBLIC_SPONSOR_URL=
```

Completar con un patrocinador real y URL HTTPS acordada. No poner datos de clientes ni URLs con contraseñas. Reiniciar/recompilar la app y habilitar en Configuración. Se mostrará una franja pequeña con etiqueta Publicidad, nombre, texto y enlace externo. No incluye rastreo de impresiones ni cobros. La contratación, condiciones e ingresos se gestionan fuera de la app.

## Desactivar

ADMIN puede pulsar Desactivar publicidad. `EXPO_PUBLIC_ADS_PROVIDER=none` la deshabilita por configuración de build. Si se cambia el consentimiento, la app desactiva el banner hasta volver a habilitarlo con las opciones válidas. Nada afecta la cola ni los datos operativos.
