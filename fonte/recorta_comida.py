"""Recorta uma folha 3x3 de pratos e salva como img/receita-rN.jpg (formato das fotos de receita do app)."""
import sys, json, os
from PIL import Image, ImageOps
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from recorta_irregular import separadores, celulas
def main(arq, folha, destinos=('ck-life/site/img', 'repo/img')):
    mapa = json.load(open('entregas/comida-mapa.json'))[folha - 1]
    im = Image.open(arq).convert('RGB'); c, l = separadores(im, 3, 3)
    if len(c) != 2 or len(l) != 2: W, H = im.size; c, l = [W / 3, 2 * W / 3], [H / 3, 2 * H / 3]
    cel = [b for linha in celulas(im, c, l) for b in linha]; feitos = []
    for rid, b in zip(mapa, cel):
        x = ImageOps.fit(im.crop(b), (555, 360), method=Image.LANCZOS, centering=(0.5, 0.5))
        for d in destinos: x.save(f'{d}/receita-{rid}.jpg', quality=86)
        feitos.append(rid)
    return feitos
if __name__ == '__main__': print(main(sys.argv[1], int(sys.argv[2])))
