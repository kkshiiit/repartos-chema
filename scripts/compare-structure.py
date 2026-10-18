"""Compose captured, unmodified app pixels beside cropped design references.

Run after tests/ui/estructura.spec.ts. Coordinates identify each phone frame
in the supplied contact sheets. App viewport = exact crop size (no stretching).
The fixture reproduces the illustrated 3 rentals and 2 materials in isolation.
This artifact is visual evidence, not a functional or Android physical test.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parents[1]
references = root / 'docs/diseno-papel-cobalto/referencias'
output = root / 'artifacts/capturas/estructura-1.5'
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 16)
frames = [
    ('alquileres', '01-pantallas-principales.png', (15, 0, 459, 862), 'light'),
    ('deposito', '01-pantallas-principales.png', (474, 0, 920, 881), 'light'),
    ('viaje', '01-pantallas-principales.png', (15, 880, 460, 1692), 'light'),
    ('historial', '01-pantallas-principales.png', (474, 897, 920, 1692), 'light'),
    ('detalle', '02-formularios-y-operaciones.png', (0, 0, 413, 934), 'dark'),
    ('nuevo', '02-formularios-y-operaciones.png', (427, 0, 851, 950), 'dark'),
    ('ajustes', '03-ajustes-y-restauracion.png', (0, 0, 419, 929), 'light'),
    ('combos', '03-ajustes-y-restauracion.png', (433, 0, 853, 929), 'light'),
    ('documentos', '03-ajustes-y-restauracion.png', (0, 947, 419, 1844), 'light'),
]
for name, source, bounds, theme in frames:
    reference = Image.open(references / source).crop(bounds).convert('RGB')
    capture = Image.open(output / f'referencia-app-{name}-{theme}.png').convert('RGB')
    assert reference.size == capture.size, (name, reference.size, capture.size)
    width, height = reference.size
    board = Image.new('RGB', (width * 2 + 32, height + 64), '#D6DADE')
    draw = ImageDraw.Draw(board)
    draw.text((8, 8), f'Referencia · {name} · {theme}', font=font, fill='#18232D')
    draw.text((width + 24, 8), 'App real 1.5 · mismo tamaño y tema', font=font, fill='#18232D')
    board.paste(reference, (8, 48)); board.paste(capture, (width + 24, 48))
    board.save(output / f'comparacion-referencia-{name}.png')
for theme in ['light', 'dark']:
    for name in ['alquileres', 'deposito', 'viaje', 'historial']:
        before = Image.open(output / f'antes-{name}-{theme}.png').convert('RGB')
        after = Image.open(output / f'despues-{name}-{theme}.png').convert('RGB')
        assert before.size == after.size == (430, 840)
        board = Image.new('RGB', (892, 904), '#D6DADE')
        draw = ImageDraw.Draw(board)
        draw.text((8, 8), f'Antes 1.4 · {name}', font=font, fill='#18232D')
        draw.text((454, 8), f'Después 1.5 · {theme}', font=font, fill='#18232D')
        board.paste(before, (8, 48)); board.paste(after, (454, 48))
        board.save(output / f'comparacion-antes-despues-{name}-{theme}.png')
print('17 comparativas generadas; capturas originales intactas. Revisar visualmente antes del APK.')
