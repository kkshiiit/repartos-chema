"""Tonos originales v2: instrumento cálido y breve, sin muestras externas.
Requiere Python, NumPy y ffmpeg para las versiones MP3.
"""
from pathlib import Path
import hashlib, json, subprocess, wave, zipfile
import numpy as np

ROOT=Path(__file__).resolve().parent
SR=48000

def felt_note(freq, duration, gain):
    t=np.arange(round(duration*SR))/SR
    attack=(1-np.exp(-t/.012))**2
    release=np.minimum(1,(duration-t)/.07).clip(0,1)**2
    body=np.sin(2*np.pi*freq*t)*np.exp(-t/.145)
    body+=.25*np.sin(2*np.pi*freq*.5*t)*np.exp(-t/.19)
    body+=.10*np.sin(2*np.pi*freq*2.002*t)*np.exp(-t/.06)
    return gain*attack*release*body

def make(duration, notes, peak):
    y=np.zeros(round(duration*SR))
    for start,freq,length,gain in notes:
        pos=round(start*SR)
        x=felt_note(freq,length,gain)
        n=min(len(x),len(y)-pos)
        y[pos:pos+n]+=x[:n]
    dry=y.copy()
    for delay,gain in [(.031,.055),(.067,.035),(.109,.018)]:
        k=round(delay*SR)
        y[k:]+=dry[:-k]*gain
    # Very light soft saturation; remove the high edge and retain natural decay.
    y=np.tanh(y*.8)
    y*=peak/max(abs(y).max(),1e-12)
    k=round(.06*SR)
    y[-k:]*=np.linspace(1,0,k)**2
    y[0]=y[-1]=0
    return y

def wav(name,y):
    assert np.isfinite(y).all() and abs(y).max()<.9
    pcm=np.round(y*32767).astype('<i2')
    with wave.open(str(ROOT/name),'wb') as w:
        w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    with wave.open(str(ROOT/name)) as w:
        assert (w.getnchannels(),w.getsampwidth(),w.getframerate())==(1,2,SR)
        assert w.getnframes()==len(y)
    return {'archivo':name,'segundos':round(len(y)/SR,3),
            'pico_dbfs':round(20*np.log10(max(abs(y).max(),1e-12)),2),
            'sha256':hashlib.sha256((ROOT/name).read_bytes()).hexdigest()}

sounds=[
 ('01_recordatorio_calido.wav',make(.96,[(.025,523.251,.62,1),(.215,659.255,.62,.80)],.27)),
 ('02_confirmacion_sutil.wav',make(.44,[(.015,659.255,.30,.65),(.085,783.991,.30,.38)],.20)),
 ('03_atencion_suave.wav',make(.68,[(.025,440,.44,.8),(.205,391.995,.40,.60)],.24)),
]
report=[wav(name,y) for name,y in sounds]
demo=np.concatenate([np.zeros(round(.4*SR))]+
                    [p for _,y in sounds for p in (y,np.zeros(round(.85*SR)))])
report.append(wav('Escuchar_sonidos_v2.wav',demo))
mp3=ROOT/'Escuchar_sonidos_v2.mp3'
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',
 str(ROOT/'Escuchar_sonidos_v2.wav'),'-codec:a','libmp3lame','-q:a','2',str(mp3)],check=True)
probe=json.loads(subprocess.check_output(['ffprobe','-v','quiet','-show_format',
 '-show_streams','-of','json',str(mp3)],text=True))
assert probe['streams'][0]['codec_name']=='mp3'
assert 4<float(probe['format']['duration'])<6
(ROOT/'verificacion.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
(ROOT/'LEEME.md').write_text('''# Repartos Chema: sonidos Jade v2

Muestras originales sintetizadas localmente. Reemplazo propuesto del paquete v1.
La app y sus notificaciones todavía no se modificaron.

Escuchar_sonidos_v2.mp3 reproduce, con pausas:
1. Recordatorio cálido (0.96 s): dos notas redondas, sin brillo metálico.
2. Confirmación sutil (0.44 s): dos notas muy breves; volumen menor.
3. Atención suave (0.68 s): dos notas graves descendentes, sin sirena.

Incluye WAV mono PCM 16 bits/48 kHz y el generador, sin muestras de terceros,
sin servicios pagos y sin conexión necesaria para reproducirlos. Se pueden
incorporar a Repartos Chema sin pagar por reproducción.

Propuesta: confirmaciones desactivadas por defecto; avisos con sonido y
vibración opcionales. No sonificar cada toque ni cada transición. Respetar
permisos, canales, silencio y No molestar de Android. La implementación
debe comprobarse en el teléfono; estos archivos no programan avisos.

Se verificaron formato WAV, duración, picos sin clipping, decodificación
MP3 y CRC del ZIP. No hubo escucha física en el Android del usuario.
El volumen percibido dependerá del teléfono y del volumen multimedia.
''')
pack=ROOT.parent/'Repartos_Chema_Jade_Sonidos_v2.zip'
with zipfile.ZipFile(pack,'w',zipfile.ZIP_DEFLATED) as z:
    for p in sorted(ROOT.iterdir()):
        if p.is_file():z.write(p,p.name)
with zipfile.ZipFile(pack) as z:assert z.testzip() is None
print(json.dumps({'demo':str(mp3),'zip':str(pack),'verificacion':report},ensure_ascii=False))
