"""Empaqueta la exportación web con servidor local, hashes y restauración comprobada."""
import hashlib, json, tempfile, zipfile, sys
from datetime import date
from pathlib import Path
root = Path(__file__).resolve().parents[1]
out = Path(sys.argv[1] if len(sys.argv) > 1 else f'/workspace/entregas/repartos-chema-web-{date.today():%Y%m%d}.zip')
if out.exists():
    raise RuntimeError('El paquete ya existe; no sobrescribir una entrega.')
files = {f'repartos-chema-web/dist/{p.relative_to(root / "dist")}': p.read_bytes()
         for p in (root / 'dist').rglob('*') if p.is_file()}
assert files and 'repartos-chema-web/dist/index.html' in files
files['repartos-chema-web/scripts/serve.mjs'] = (root / 'scripts/serve.mjs').read_bytes()
files['repartos-chema-web/LEEME.txt'] = (
    'Repartos Chema — demo local sin credenciales.\n'
    'Con Node 22.13+ o 24.3+: abre esta carpeta y ejecuta node scripts/serve.mjs.\n'
    'Abre http://localhost:8081 en ese mismo equipo. No se necesita npm install.\n'
    'No abrir index.html con file://: necesita un servidor con fallback SPA.\n'
    'Para Android directo se necesita APK o una publicación HTTPS autorizada.\n'
    'No hay nube, cuentas reales ni publicidad. Guarda copias de tus datos en Configuración.\n'
).encode()
manifest = {name: hashlib.sha256(data).hexdigest() for name, data in files.items()}
out.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
    for name, data in files.items():
        z.writestr(name, data)
    z.writestr('SHA256.json', json.dumps(manifest, indent=2))
with tempfile.TemporaryDirectory(prefix='chema-web-restore-') as temp:
    with zipfile.ZipFile(out) as z:
        assert z.testzip() is None
        z.extractall(temp)
    for name, checksum in manifest.items():
        assert hashlib.sha256((Path(temp) / name).read_bytes()).hexdigest() == checksum
Path(str(out) + '.sha256').write_text(hashlib.sha256(out.read_bytes()).hexdigest() + '  ' + out.name + '\n')
Path(str(out) + '.verificado.json').write_text(json.dumps({'archivos': len(files), 'bytes': out.stat().st_size, 'CRC': 'correcto', 'restauracionSHA256': 'todos coinciden'}, indent=2) + '\n')
print(out)
