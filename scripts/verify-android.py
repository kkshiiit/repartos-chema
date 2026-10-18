"""Verifica un APK ARM64 local sin instalarlo ni modificar la firma.

Uso: python3 scripts/verify-android.py APK ANTERIOR DIRECTORIO_SALIDA [COMMIT_RUNTIME]
Requiere Android build-tools y JDK. No acredita funcionamiento en hardware.
"""
import datetime
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import zipfile

root = Path(__file__).resolve().parents[1]
apk, previous, output = map(Path, sys.argv[1:4])
source = sys.argv[4] if len(sys.argv) > 4 else 'HEAD'
build_tools = Path(os.environ.get('ANDROID_BUILD_TOOLS', '/workspace/android-sdk/build-tools/36.0.0'))
config = json.loads((root / 'app.json').read_text())['expo']
version, code, package = config['version'], config['android']['versionCode'], config['android']['package']

def run(*args):
    return subprocess.check_output(list(map(str, args)), text=True)

signature = run(build_tools / 'apksigner', 'verify', '--verbose', '--print-certs', apk)
old_signature = run(build_tools / 'apksigner', 'verify', '--print-certs', previous)
pattern = r'Signer #1 certificate SHA-256 digest: (\w+)'
certificate = re.search(pattern, signature).group(1)
assert certificate == re.search(pattern, old_signature).group(1), 'Cambió el certificado'
assert 'Verified using v2 scheme (APK Signature Scheme v2): true' in signature
metadata = run(build_tools / 'aapt', 'dump', 'badging', apk)
assert f"name='{package}'" in metadata
assert f"versionCode='{code}'" in metadata and f"versionName='{version}'" in metadata
assert "sdkVersion:'24'" in metadata and "native-code: 'arm64-v8a'" in metadata
assert 'application-debuggable' not in metadata
assert not any(permission in metadata for permission in [
    'com.google.android.gms.permission.AD_ID', 'READ_CONTACTS', 'READ_SMS',
    'MANAGE_EXTERNAL_STORAGE', 'RECORD_AUDIO', 'SYSTEM_ALERT_WINDOW',
])
with zipfile.ZipFile(apk) as archive:
    assert archive.testzip() is None, 'CRC inválido'
    assert {name.split('/')[1] for name in archive.namelist()
            if name.startswith('lib/') and name.count('/') > 1} == {'arm64-v8a'}
    assert 'lib/arm64-v8a/libexpo-sqlite.so' in archive.namelist(), 'Falta SQLite nativo'
    sounds = ['chema_recordatorio_calido.wav', 'chema_confirmacion_sutil.wav', 'chema_atencion_suave.wav']
    assert all(any(name.endswith('/' + sound) and name.startswith('res/raw/') for name in archive.namelist()) for sound in sounds), 'Faltan tonos nativos'
    bundle = archive.read('assets/index.android.bundle')
    assert not re.search(rb'AIza[0-9A-Za-z_-]{35}', bundle), 'Clave pública Firebase/Google embebida'
    for env in root.glob('.env*'):
        if env.is_file():
            keys = re.findall(r'AIza[\w-]+', env.read_text())
            assert all(key.encode() not in bundle for key in keys), 'Configuración Firebase embebida'
    assert not any(marker in bundle for marker in [
        b'react-native-google-mobile-ads', b'ca-app-pub-', b'AdMobBanner',
    ]), 'Código publicitario detectado'

output.mkdir(parents=True, exist_ok=True)
destination = output / f'repartos-chema-local-{version}-arm64.apk'
assert not destination.exists(), 'No sobrescribir un instalador anterior'
shutil.copy2(apk, destination)
checksum = hashlib.sha256(destination.read_bytes()).hexdigest()
Path(str(destination) + '.sha256').write_text(f'{checksum}  {destination.name}\n')
report = {
    'version': version, 'versionCode': code, 'package': package,
    'codigoFuncional': run('git', '-C', root, 'rev-parse', source).strip(),
    'archivo': destination.name, 'bytes': destination.stat().st_size, 'sha256': checksum,
    'certificadoSHA256': certificate, 'firmaV2': True, 'certificadoCoincideConAnterior': True,
    'apkAnterior': previous.name,
    'CRC': 'correcto', 'ABI': 'arm64-v8a', 'minSDK': 24, 'debuggable': False,
    'sqliteNativoIncluido': True, 'tonosLocalesIncluidos': True,
    'pruebaFisica': False, 'publicidadDetectada': False, 'configFirebaseEmbebida': False,
    'generadoUTC': datetime.datetime.now(datetime.timezone.utc).isoformat(),
}
prefix = root / f'artifacts/validacion/android-{version}'
Path(str(prefix) + '-apk.json').write_text(json.dumps(report, indent=2) + '\n')
Path(str(prefix) + '-firma.txt').write_text(signature)
Path(str(prefix) + '-metadata.txt').write_text(metadata)
print(json.dumps(report, indent=2))
