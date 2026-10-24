"""Recorte de grades irregulares (linhas brancas em posições variadas). Acha as linhas de verdade em cada imagem."""
import numpy as np
from PIL import Image, ImageFilter
def grupos(v, lim, a=30, b=None):
    b = b or len(v) - 30; g = []
    for k in range(a, b):
        if v[k] > lim:
            if g and k - g[-1][1] <= 3: g[-1][1] = k
            else: g.append([k, k])
    return [(x + y) / 2 for x, y in g]
def separadores(im, ncol=4, nlin=3):
    a = np.asarray(im.convert('RGB')).astype(int); br = a.min(axis=2) > 205; H, W = br.shape
    linhas = grupos(br.mean(axis=1), .55)
    cand = []
    for y0, y1 in zip([0] + [int(l) for l in linhas], [int(l) for l in linhas] + [H]):
        if y1 - y0 > 60: cand += grupos(br[y0:y1].mean(axis=0), .6)
    cols = []
    for c in sorted(cand):
        if cols and abs(c - cols[-1][-1]) < 12: cols[-1].append(c)
        else: cols.append([c])
    cols = [sum(c) / len(c) for c in cols]
    return cols, linhas
def celulas(im, cols, linhas):
    W, H = im.size; xs = [0] + cols + [W]; ys = [0] + linhas + [H]; out = []
    for j in range(len(ys) - 1):
        out.append([(int(xs[i]) + 4, int(ys[j]) + 4, int(xs[i + 1]) - 4, int(ys[j + 1]) - 4) for i in range(len(xs) - 1)])
    return out
def quadrado(c):
    w, h = c.size; lado = max(w, h); fundo = c.resize((lado, lado)).filter(ImageFilter.GaussianBlur(18)); fundo.paste(c, ((lado - w) // 2, (lado - h) // 2)); return fundo
