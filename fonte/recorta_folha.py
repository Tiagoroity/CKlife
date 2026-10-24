"""Recorta uma folha 3x3 do gerador em 9 fotos com o nome certo para o 'Enviar fotos em lote'.
Uso: python3 recorta_folha.py <imagem> <numero_da_folha 1..49> [saida]"""
import sys, re, unicodedata, os
from PIL import Image, ImageOps
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'ck-life/cabelo'))
from penteados import L
def slug(s): return re.sub(r'[^a-z0-9]+', '-', unicodedata.normalize('NFD', s.lower()).encode('ascii', 'ignore').decode()).strip('-')
PARTES = ['p1', 'p2', 'p3', 'p4', 'capa', 'esquerda', 'direita', 'cima', 'detalhe']
def cortes(px, n, eixo, W, H):
    # procura as faixas claras (separadores) perto de 1/3 e 2/3
    tam = W if eixo == 0 else H
    def clara(k):
        amost = [px[k, y] if eixo == 0 else px[y, k] for y in range(0, (H if eixo == 0 else W), 7)]
        return sum(1 for c in amost if min(c[:3]) > 232) / len(amost)
    res = []
    for alvo in (tam / 3, 2 * tam / 3):
        janela = range(int(alvo - tam * .06), int(alvo + tam * .06))
        faixas = [k for k in janela if clara(k) > .9]
        res.append((min(faixas), max(faixas)) if faixas else (int(alvo) - 2, int(alvo) + 2))
    return [(0, res[0][0]), (res[0][1] + 1, res[1][0]), (res[1][1] + 1, tam)]
def apara(im):
    # tira bordas brancas que sobraram
    g = ImageOps.invert(im.convert('L')).point(lambda v: 255 if v > 22 else 0)
    b = g.getbbox(); return im.crop(b) if b else im
def main(arq, folha, saida='entregas/fotos'):
    nome = L[folha - 1][0]; sl = slug(nome); os.makedirs(saida, exist_ok=True)
    im = Image.open(arq).convert('RGB'); W, H = im.size; px = im.load()
    cx, cy = cortes(px, 3, 0, W, H), cortes(px, 3, 1, W, H)
    k = 0; feitos = []
    for (y0, y1) in cy:
        for (x0, x1) in cx:
            c = apara(im.crop((x0, y0, x1, y1)))
            lado = min(c.size); c = ImageOps.fit(c, (lado, lado), method=Image.LANCZOS)
            if lado > 1080: c = c.resize((1080, 1080), Image.LANCZOS)
            dest = f'{saida}/{sl}--{PARTES[k]}.jpg'; c.save(dest, quality=90); feitos.append((dest, c.size)); k += 1
    return nome, feitos
if __name__ == '__main__':
    n, f = main(sys.argv[1], int(sys.argv[2]), *(sys.argv[3:4]))
    print(n); [print(' ', d, s) for d, s in f]
