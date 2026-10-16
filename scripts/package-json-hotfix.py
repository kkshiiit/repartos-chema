"""Package a JS-only 1.2.1 fix on the verified 1.2.0 native runtime.

Does not compile native code. Refuses another base or Hermes bytecode version.
Run Expo export:embed and hermesc first, then align/sign with Android build-tools.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct
import zipfile

BASE_SHA = '063019c53294fdb6d43e3916faad7d0d0f9b03312fdabed03d47de917f589962'

def patch_manifest(data):
    data = bytearray(data)
    offset = 8
    names = []
    changed = False
    extract = False
    while offset < len(data):
        kind, header, size = struct.unpack_from('<HHI', data, offset)
        if kind == 1:  # Android binary XML string pool; base uses UTF-16.
            count, _, flags, start = struct.unpack_from('<IIII', data, offset + 8)
            assert not flags & 0x100, 'Unexpected UTF-8 manifest pool'
            for index in range(count):
                pos = offset + start + struct.unpack_from('<I', data, offset + header + index * 4)[0]
                length = struct.unpack_from('<H', data, pos)[0]
                assert length < 0x8000
                names.append(bytes(data[pos + 2:pos + 2 + length * 2]).decode('utf-16le'))
        if kind == 0x102:  # Start element attributes.
            name = struct.unpack_from('<I', data, offset + 20)[0]
            if names[name] in ('manifest', 'application'):
                begin, attr_size, count = struct.unpack_from('<HHH', data, offset + 24)
                for i in range(count):
                    pos = offset + 16 + begin + attr_size * i
                    key = names[struct.unpack_from('<I', data, pos + 4)[0]]
                    if key == 'versionCode':
                        assert data[pos + 15] == 0x10
                        assert struct.unpack_from('<I', data, pos + 16)[0] == 3
                        struct.pack_into('<I', data, pos + 16, 4)
                        changed = True
                    if key == 'extractNativeLibs':
                        assert data[pos + 15] == 0x12
                        assert struct.unpack_from('<I', data, pos + 16)[0] == 0
                        struct.pack_into('<I', data, pos + 16, 0xffffffff)
                        extract = True
        assert size > 0
        offset += size
    assert changed, 'Missing versionCode'
    assert extract, 'Missing native library extraction setting'
    old = '1.2.0'.encode('utf-16le')
    assert data.count(old) == 1, 'Unexpected versionName'
    return bytes(data).replace(old, '1.2.1'.encode('utf-16le'))

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('base')
    parser.add_argument('bundle')
    parser.add_argument('output')
    args = parser.parse_args()
    root = Path(__file__).resolve().parent.parent
    assert hashlib.sha256((root / 'package-lock.json').read_bytes()).hexdigest() == 'cfea5374d798d5a7cdb9103f5f8d87cc6cfb2a49d6dd9a7b89671ba9bc109b97', 'Lockfile changed: review native compatibility before packaging'
    dependencies = json.loads((root / 'package.json').read_text())['dependencies']
    fingerprint = hashlib.sha256(json.dumps(dependencies, sort_keys=True, separators=(',', ':')).encode()).hexdigest()
    assert fingerprint == '39f72b62303c3532b0056afe4120ab22d97d56a002eeed89007497e3ccb96b58', 'Native dependency changes require a full Gradle build'
    base = Path(args.base)
    assert hashlib.sha256(base.read_bytes()).hexdigest() == BASE_SHA, 'Wrong base APK'
    bundle = Path(args.bundle).read_bytes()
    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(base) as src, zipfile.ZipFile(out, 'w') as dst:
        assert src.read('assets/index.android.bundle')[:12] == bundle[:12], 'Incompatible Hermes bytecode'
        assert src.testzip() is None
        for info in src.infolist():
            if info.filename.startswith('META-INF/'):
                continue
            content = src.read(info)
            if info.filename.startswith('lib/') and info.filename.endswith('.so'):
                # Store identical native bytes compressed; PackageManager extracts them on install.
                info.compress_type = zipfile.ZIP_DEFLATED
            if info.filename == 'AndroidManifest.xml':
                content = patch_manifest(content)
            elif info.filename == 'assets/index.android.bundle':
                content = bundle
                # Android AssetManager reads compressed bundles; keep native .so files stored/aligned.
                info.compress_type = zipfile.ZIP_DEFLATED
            elif info.filename == 'assets/app.config':
                config = json.loads(content)
                assert config['version'] == '1.2.0'
                config['version'] = '1.2.1'
                config['android']['versionCode'] = 4
                content = json.dumps(config, ensure_ascii=False, separators=(',', ':')).encode()
            dst.writestr(info, content)
    with zipfile.ZipFile(out) as dst, zipfile.ZipFile(base) as src:
        assert dst.testzip() is None
        changed = {name for name in dst.namelist() if dst.read(name) != src.read(name)}
        assert changed == {'AndroidManifest.xml', 'assets/app.config', 'assets/index.android.bundle'}, changed
    print(json.dumps({'unsigned_apk': str(out), 'changed_entries': sorted(changed), 'native_runtime': 'verified 1.2.0, unchanged'}))

if __name__ == '__main__':
    main()
