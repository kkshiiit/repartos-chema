"""Copia reproducible de archivos versionados, sin dependencias ni secretos."""
import hashlib,json,subprocess,zipfile,sys,tempfile
from pathlib import Path
root=Path(__file__).resolve().parents[1]
commit=subprocess.check_output(['git','rev-parse','--short','HEAD'],cwd=root,text=True).strip()
out=Path(sys.argv[1] if len(sys.argv)>1 else '/workspace/entregas');out.mkdir(parents=True,exist_ok=True)
files=[root/p for p in subprocess.check_output(['git','ls-files','-z'],cwd=root,text=True).split('\0') if p]
files=[p for p in files if p.is_file() and (not p.name.startswith('.env') or p.name=='.env.example') and p.suffix not in {'.key','.pem','.jks','.keystore'}]
manifest={str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in files}
archive=out/f'repartos-chema-{commit}.zip'
if archive.exists():raise RuntimeError('La copia ya existe; no sobrescribir un respaldo.')
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
 for p in files:z.write(p,Path('repartos-chema')/p.relative_to(root))
 z.writestr('SHA256.json',json.dumps(manifest,indent=2)+'\n')
with tempfile.TemporaryDirectory(prefix='chema-restore-') as d:
 with zipfile.ZipFile(archive) as z:
  assert z.testzip() is None
  z.extractall(d)
 for f,h in manifest.items():assert hashlib.sha256((Path(d)/'repartos-chema'/f).read_bytes()).hexdigest()==h,f
(out/(archive.name+'.sha256')).write_text(hashlib.sha256(archive.read_bytes()).hexdigest()+'  '+archive.name+'\n')
(out/(archive.name+'.verificado.json')).write_text(json.dumps({'commit':commit,'archivos':len(files),'bytes':archive.stat().st_size,'CRC':'correcto','restauracionSHA256':'todos coinciden'},indent=2)+'\n')
print(archive)
