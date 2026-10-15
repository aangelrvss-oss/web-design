"""Genera las bandas panorámicas (1798×410) y los recortes 2:1 (820×410) a partir
de assets-src/bandas/*-banda.png (capturas a 7680 px de la galería de
proreforma.es). Solo recorta y aplica un enfoque suave: no altera el contenido.
Uso: python3 tools/bandas.py"""
from PIL import Image, ImageFilter
import glob, os

FOCUS = {'techo-escalera': .45, 'techo-elevador': .62, 'salon-led': .5, 'pasillo-techo': .5,
         'insono-preparacion': .62, 'insono-estancia': .6, 'insono-placas': .42, 'insono-pintura': .64}
root = os.path.join(os.path.dirname(__file__), '..')
for src in sorted(glob.glob(os.path.join(root, 'assets-src/bandas/*-banda.png'))):
    n = os.path.basename(src)[:-len('-banda.png')]
    im = Image.open(src).convert('RGB').filter(ImageFilter.UnsharpMask(radius=1.4, percent=70, threshold=2))
    W, H = im.size
    im.save(os.path.join(root, f'site/assets/img/{n}-banda.webp'), 'WEBP', quality=82, method=6)
    cw = 2 * H
    x = int(max(0, min(W - cw, FOCUS.get(n, .5) * W - cw / 2)))
    im.crop((x, 0, x + cw, H)).save(os.path.join(root, f'site/assets/img/{n}-2x1.webp'), 'WEBP', quality=82, method=6)
    print(n, W, H)
