"""Recorta as folhas 2x2 de exercícios (e a 8ª com 2 fotos lado a lado) em fotos 720x1280."""
import sys, glob, json, os
import numpy as np
from PIL import Image
pasta, saida = sys.argv[1], sys.argv[2]
mapa = json.load(open('entregas/exercicios-mapa.json'))
fs = sorted(glob.glob(os.path.join(pasta, '*23_46_*.png')), key=lambda f: int(f.split('-')[-1][:-4]))
def nove16(c):
    w, h = c.size; tw = int(h * 9 / 16)
    if tw <= w: x = (w - tw) // 2; c = c.crop((x, 0, x + tw, h))
    else: th = int(w * 16 / 9); y = max(0, int((h - th) * .12)); c = c.crop((0, y, w, y + th))
    return c.resize((720, 1280), Image.LANCZOS)
for f, nomes in zip(fs, mapa):
    im = Image.open(f).convert('RGB'); a = np.asarray(im).astype(int); h, w = a.shape[:2]
    branco = (a.min(axis=2) > 225)
    col = branco.mean(axis=0); lin = branco.mean(axis=1)
    def corte(v, n):
        mid = n // 2; z = [i for i in range(mid - 40, mid + 40) if v[i] > .85]
        return (min(z), max(z) + 1) if z else (mid, mid)
    cx = corte(col, w); cy = corte(lin, h) if len(nomes) == 4 else None
    m = 4
    if cy:
        caixas = [(0, 0, cx[0], cy[0]), (cx[1], 0, w, cy[0]), (0, cy[1], cx[0], h), (cx[1], cy[1], w, h)]
    else:
        caixas = [(0, 0, cx[0], h), (cx[1], 0, w, h)]
    for nome, (x0, y0, x1, y1) in zip(nomes, caixas):
        c = im.crop((x0 + m if x0 else 0, y0 + m if y0 else 0, x1 - m if x1 < w else w, y1 - m if y1 < h else h))
        out = os.path.join(saida, (nome if nome.startswith('treino-') else 'ex-' + nome) + '.jpg')
        nove16(c).save(out, 'JPEG', quality=86, optimize=True); print(out, cx, cy)
