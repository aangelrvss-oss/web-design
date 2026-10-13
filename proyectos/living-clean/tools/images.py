"""Prepara las imágenes de la web a partir de los originales.

- assets-src/higgsfield/*.png (generadas, ilustrativas) -> site/assets/img/<nombre>-<ancho>.webp
- El portal del hero, además, en versión «empañada» (vaho) para la pasada de rasqueta,
  y un recorte 3:2 (ronda-portal) para la tarjeta de la ronda y las páginas de servicio.
- Iconos (favicon, 192, apple-touch) a partir del logotipo original.

Uso (desde proyectos/living-clean): python3 -I tools/images.py
"""
import sys
from pathlib import Path
from PIL import Image, ImageFilter, ImageEnhance

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'assets-src'
OUT = ROOT / 'site' / 'assets' / 'img'
BRAND = ROOT / 'site' / 'assets' / 'brand'
OUT.mkdir(parents=True, exist_ok=True)


def save(img, name, widths, q=78):
    for w in widths:
        h = round(img.height * w / img.width)
        im = img if w == img.width else img.resize((w, h), Image.LANCZOS)
        im.save(OUT / f'{name}-{w}.webp', 'WEBP', quality=q, method=6)
        print(f'  {name}-{w}.webp  {w}x{h}')


def fog(img):
    """Vaho: desenfoque fuerte, menos contraste y velo claro."""
    r = max(8, round(img.width / 90))
    f = img.filter(ImageFilter.GaussianBlur(r))
    f = ImageEnhance.Color(f).enhance(0.55)
    f = ImageEnhance.Contrast(f).enhance(0.6)
    veil = Image.new('RGB', f.size, (246, 244, 240))
    return Image.blend(f, veil, 0.42)


def generated():
    d = SRC / 'higgsfield'
    if not d.exists():
        print('Faltan las imágenes generadas: ejecuta tools/fetch-higgsfield.sh', file=sys.stderr)
        return
    hero = Image.open(d / 'hero-portal.png').convert('RGB')
    save(hero, 'hero-portal', [1200, 1800, 2688], q=76)
    save(fog(hero), 'hero-portal-niebla', [1200, 1800, 2688], q=60)
    # recorte 3:2 centrado para la tarjeta del portal
    w, h = hero.size
    cw = round(h * 1.5)
    x = (w - cw) // 2
    save(hero.crop((x, 0, x + cw, h)), 'ronda-portal', [640, 1024])
    mob = Image.open(d / 'hero-portal-movil.png').convert('RGB')
    save(mob, 'hero-portal-movil', [760, 1200], q=74)
    save(fog(mob), 'hero-portal-movil-niebla', [760, 1200], q=58)
    for n in ['escalera', 'garaje', 'jardin', 'mantenimiento', 'fachada']:
        im = Image.open(d / f'ronda-{n}.png').convert('RGB')
        save(im, f'ronda-{n}', [640, 1024])


def icons():
    logo = Image.open(SRC / 'logo-living-clean-original.jpg').convert('RGB')
    def square(size, pad=0.06):
        canvas = Image.new('RGB', (size, size), (255, 255, 255))
        inner = round(size * (1 - 2 * pad))
        im = logo.copy()
        im.thumbnail((inner, inner), Image.LANCZOS)
        canvas.paste(im, ((size - im.width) // 2, (size - im.height) // 2))
        return canvas
    square(192).save(BRAND / 'icon-192.png', optimize=True)
    square(180).save(BRAND / 'apple-touch-icon.png', optimize=True)
    # A 32 px el logotipo entero no se lee: se usa el tejado con el trazo amarillo.
    w, h = logo.size
    mark = logo.crop((round(w * 0.36), 0, w, round(h * 0.64)))
    side = max(mark.size)
    sq = Image.new('RGB', (side, side), (255, 255, 255))
    sq.paste(mark, ((side - mark.width) // 2, (side - mark.height) // 2))
    sq.resize((48, 48), Image.LANCZOS).save(ROOT / 'site' / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
    print('  iconos ok')


if __name__ == '__main__':
    icons()
    generated()
