# Registro de ejecución — plan: docs/PLAN_MAESTRO_CHEMA.md

Base e133ae45a59ef14d4301f6731765954de8eb121a; aplicación 1.6.1/code10. Etapa2 autorizada por adjunto conservado en ENCARGO_ETAPA_2_CHEMA.md. Rama feat/chema-maestro-etapa2, main conservado.

## Preflight y reglas

- H0 produce selección con metadata sin romper pickBackup ni recuperación. H1 modifica tokens/componentes, H2 los consume; conservar aliases hasta migrar callers. H3 no toca el motor de stock y usa el mismo core con ACL/CAS; H4 no puede confirmarse antes del corte concurrente real.
- Ruling: se usa una rama temática en el checkout remoto ya exclusivo, preservando main y el punto de preparación; no se duplica instalación/SQLite ni se reemplaza el workspace. Ledger persistente del proyecto sustituye scripts de proceso de skills cloud sin ruta ejecutable local. Coste si falla: integración manual adicional, nunca pérdida de datos.
- El usuario no confirmó equivalencia cuerpo/marcos: se compara material/medida literal como fallback autorizado, sin conversión. Roles iniciales de equipo siguen ADMIN/OPERADOR existentes; no elevar a todo integrante.
- Respaldo original e133ae4 en /workspace/respaldos/etapa2-base-2026-10-26: ZIP, manifiestoSHA y restauración comprobados por scripts/package.py. Clave fueraGit; no nuevos servicios/pagos.

## Estado

|Bloque|Estado|Prueba/commit|
|---|---|---|
|H0 importación/identidad|En curso|Base check444 e import1 de etapa1; nueva comprobación inicial en ejecución|
|H1 UI principal|Pendiente|No aplicado|
|H2 Viaje|Pendiente|No aplicado|
|H3 autoridad compartida|Pendiente|Acceso/stack local por comprobar|
|H4A/H4B extensión|Pendiente|Depende H3|
|H5 secundarios/avisos/accesibilidad|Pendiente|Preservar servicio existente|
|H6 regresión/APK|Pendiente|APK instalado2.0 exacto sigue faltando; no desinstalar|

Actualizar este registro y CONTINUIDAD_CODEX por bloque con comandos/resultados y próximo paso. No considerar propuestas como pruebas físicas.
