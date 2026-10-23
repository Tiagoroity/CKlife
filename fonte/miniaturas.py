"""Gera miniaturas leves (pasta img/p) para listas e cartões. O recorte quadrado segue onde está a pessoa/o prato."""
import pathlib
from PIL import Image, ImageFilter, ImageOps
def energia_linhas(im):
    w, h = im.size
    g = ImageOps.grayscale(im).resize((max(1, w // 4), max(1, h // 4))).filter(ImageFilter.FIND_EDGES)
    gw, gh = g.size; px = g.load(); x0, x1 = int(gw * .2), int(gw * .8)
    # pele/tons quentes pesam mais: ajuda a achar a pessoa
    c = im.convert("RGB").resize((gw, gh)); pc = c.load()
    L = []
    for y in range(gh):
        s = 0
        for x in range(x0, x1):
            r, gg, b = pc[x, y]
            pele = 1.8 if (r > 95 and gg > 40 and b > 20 and r > gg and r > b and r - min(gg, b) > 15) else 1.0
            s += px[x, y] * pele
        L.append(s)
    return L, 4
def mascara(im):
    w, h = im.size; k = 6; c = im.resize((w // k, h // k)); cw, ch = c.size; px = c.load(); x0, x1 = int(cw * .12), int(cw * .88)
    linhas = []
    for y in range(ch):
        pele = roupa = 0
        for x in range(x0, x1):
            r, g, b = px[x, y]
            if r > 120 and g > 75 and b > 55 and r > g > b and 18 < r - g < 75 and r - b > 35: pele += 1
            elif g > r + 6 and g >= b and 25 < g < 105 and r < 70: roupa += 1
        linhas.append((pele, roupa))
    return linhas, k
# enquadramento conferido a olho (0 = topo da foto, 1 = base) para fotos onde o automático erra
AJUSTE = {"ex-abdinfra": .66, "ex-abdpe": .41, "ex-flexinc": .5, "ex-mergulho": .54, "ex-panturrilha": .18, "ex-pike": .66, "ex-ponte": .5, "ex-pranchalat": .73, "ex-toqueombro": .55, "ex-wallsit": .36, "treino-abdomen": .6}
def recorte_quadrado(im, nome=""):
    w, h = im.size
    if nome in AJUSTE and h > w: y0 = int(AJUSTE[nome] * (h - w)); return im.crop((0, y0, w, y0 + w))
    if h <= w * 1.05: s = min(w, h); return im.crop(((w - s) // 2, (h - s) // 2, (w - s) // 2 + s, (h - s) // 2 + s))
    L, k = mascara(im); jan = w // k; n = len(L)
    peso = [3 * pe + ro for pe, ro in L]
    soma = lambda y: sum(peso[max(0, y):max(0, y) + jan])
    melhor, ini = -1, 0
    for y in range(0, n - jan + 1):
        v = soma(y)
        if v > melhor * 1.02: melhor, ini = v, y
    lim = max(2, (w // k) * .02)
    topo = next((y for y, (pe, ro) in enumerate(L) if pe >= lim), None)
    if topo is not None and topo < ini:
        yt = max(0, topo - int(jan * .08))
        if soma(yt) >= melhor * .72: ini = yt
    y0 = max(0, min(h - w, ini * k - int(w * .04)))
    return im.crop((0, y0, w, y0 + w))
def gera(origem, destino):
    origem, destino = pathlib.Path(origem), pathlib.Path(destino); destino.mkdir(parents=True, exist_ok=True); n = 0
    for f in sorted(origem.glob("*.jpg")):
        out = destino / f.name
        if out.exists() and out.stat().st_mtime >= f.stat().st_mtime: continue
        im = Image.open(f).convert("RGB")
        if f.name.startswith(("ex-", "treino-")): t = recorte_quadrado(im, f.stem).resize((320, 320), Image.LANCZOS)
        elif f.name.startswith("receita-"): t = im.copy(); t.thumbnail((520, 520), Image.LANCZOS)
        else: continue
        t.save(out, "JPEG", quality=78, optimize=True, progressive=False); n += 1
    return n
if __name__ == "__main__":
    print(gera("ck-life/site/img", "ck-life/site/img/p"))
