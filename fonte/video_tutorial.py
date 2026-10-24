"""Vídeo-tutorial do Cabelo para Treinar a partir das fotos de cada penteado.
Fotos esperadas em <pasta>/<slug>--p1..p4, --capa, --esquerda, --direita, --cima, --detalhe (.jpg/.png).
Saída: <saida>/<slug>.mp4 · 1080x1350 (4:5), 30 fps, ~18 s, H.264, sem som.
Uso: python video_tutorial.py <slug|todos> [pasta_fotos] [saida]"""
import sys, os, re, glob, subprocess, unicodedata, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps
AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(AQUI, 'ck-life/cabelo'))
from penteados import L, P
import imageio_ffmpeg
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
FONTES = os.environ.get('CK_FONTES', '')
W, H, FPS = 1080, 1350, 30
VERDE, VERDE2, CLARO, TINTA, SUAVE, BEGE = (14, 61, 50), (46, 125, 90), (185, 221, 178), (23, 33, 29), (101, 115, 108), (245, 248, 239)
DIF = {'facil': 'Fácil', 'media': 'Média', 'avancada': 'Avançada'}; FIX = {'leve': 'Fixação leve', 'media': 'Fixação média', 'alta': 'Fixação alta'}
ANG = [('capa', 'de costas'), ('esquerda', 'lado esquerdo'), ('direita', 'lado direito'), ('cima', 'visto de cima'), ('detalhe', 'detalhe')]
def slug(s): return re.sub(r'[^a-z0-9]+', '-', unicodedata.normalize('NFD', s.lower()).encode('ascii', 'ignore').decode()).strip('-')
_F = {}
def fonte(nome, tam, peso):
    k = (nome, tam, peso)
    if k in _F: return _F[k]
    f = ImageFont.truetype(os.path.join(FONTES, nome), tam)
    f.set_variation_by_axes([peso] if 'figtree' in nome else [min(96, max(12, tam)), peso, 100])   # Bricolage: tamanho óptico, peso, largura
    _F[k] = f; return f
def ease(t): return t * t * (3 - 2 * t)
def quebra(d, txt, f, larg):
    linhas, atual = [], ''
    for p in txt.split():
        t = (atual + ' ' + p).strip()
        if d.textlength(t, font=f) <= larg: atual = t
        else: linhas.append(atual); atual = p
    if atual: linhas.append(atual)
    return linhas
def abre(pasta, sl, parte):
    for ext in ('jpg', 'jpeg', 'png', 'webp'):
        a = os.path.join(pasta, f'{sl}--{parte}.{ext}')
        if os.path.exists(a): return ImageOps.fit(Image.open(a).convert('RGB'), (1080, 1080), Image.LANCZOS)
    return None
def kenburns(img, t, lado=1):
    z = 1.0 + 0.07 * ease(t); w = int(1080 / z); x = int((1080 - w) / 2 + lado * 18 * ease(t)); y = int((1080 - w) / 2 - 10 * ease(t))
    return img.crop((max(0, x), max(0, y), max(0, x) + w, max(0, y) + w)).resize((1080, 1080), Image.LANCZOS)
def arredonda(img, r):
    m = Image.new('L', img.size, 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, img.size[0], img.size[1]], r, fill=255); out = Image.new('RGBA', img.size); out.paste(img, (0, 0), m); return out
LOGO = None
def logo(alt, branca=False):
    global LOGO
    if LOGO is None:
        a = os.path.join(AQUI, 'ck-life/site/img/logo.png'); LOGO = Image.open(a).convert('RGBA') if os.path.exists(a) else False
    if not LOGO: return None
    r = alt / LOGO.size[1]; im = LOGO.resize((int(LOGO.size[0] * r), alt), Image.LANCZOS)
    if branca: b = Image.new('RGBA', im.size, (255, 255, 255, 255)); b.putalpha(im.getchannel('A')); im = b
    return im
def gradiente(c1, c2):
    g = Image.new('RGB', (1, 256)); [g.putpixel((0, i), tuple(int(c1[k] + (c2[k] - c1[k]) * i / 255) for k in range(3))) for i in range(256)]; return g.resize((W, H))
FUNDO = None
def quadro_intro(info, capa, t):
    base = (capa.resize((W, W)).crop((0, 0, W, W)) if capa else Image.new('RGB', (W, W), VERDE2)).resize((int(H * 1.0), H)).crop((int((H - W) / 2), 0, int((H - W) / 2) + W, H))
    base = base.filter(ImageFilter.GaussianBlur(2)); escuro = gradiente((14, 61, 50), (6, 26, 20)); base = Image.blend(base, escuro, 0.72)
    d = ImageDraw.Draw(base); a = ease(min(1, t * 1.6)); y0 = int(760 - 40 * a)
    d.text((80, y0), 'CABELO PARA TREINAR', font=fonte('bricolage.ttf', 34, 700), fill=CLARO)
    fn = fonte('bricolage.ttf', 104, 800); ys = y0 + 56
    for ln in quebra(d, info['nome'], fn, W - 160): d.text((78, ys), ln, font=fn, fill=(255, 255, 255)); ys += 112
    fm = fonte('figtree.ttf', 34, 600); x = 80; ys += 16
    camada = Image.new('RGBA', base.size, (0, 0, 0, 0)); dc = ImageDraw.Draw(camada)
    for chip in (f"{info['min']} min", DIF[info['dif']], FIX[info['fix']]):
        tw = d.textlength(chip, font=fm); dc.rounded_rectangle([x, ys, x + tw + 44, ys + 60], 30, fill=(255, 255, 255, 38), outline=(255, 255, 255, 140), width=2); dc.text((x + 22, ys + 11), chip, font=fm, fill=(255, 255, 255, 255)); x += tw + 58
    base = Image.alpha_composite(base.convert('RGBA'), camada).convert('RGB')
    lg = logo(70, True)
    if lg: base.paste(lg, (80, H - 150), lg)
    return base
def quadro_passo(info, foto, k, t, total):
    base = Image.new('RGB', (W, H), BEGE)
    if foto: base.paste(kenburns(foto, t, 1 if k % 2 else -1), (0, 0))
    painel = Image.new('RGBA', (W, 360), (0, 0, 0, 0)); dp = ImageDraw.Draw(painel); dp.rounded_rectangle([0, 0, W, 420], 44, fill=(255, 255, 255, 255))
    base.paste(painel, (0, H - 360), painel); d = ImageDraw.Draw(base)
    titulo, instr = info['passos'][k]
    d.text((70, H - 318), f'PASSO {k + 1} DE {total}', font=fonte('bricolage.ttf', 30, 700), fill=VERDE2)
    for i in range(total):
        cx = W - 70 - (total - 1 - i) * 30; d.ellipse([cx - 8, H - 306, cx + 8, H - 290], fill=VERDE2 if i <= k else (213, 231, 211))
    d.text((68, H - 272), titulo, font=fonte('bricolage.ttf', 56, 800), fill=TINTA)
    fb = fonte('figtree.ttf', 36, 500); y = H - 196
    for ln in quebra(d, instr, fb, W - 140)[:3]: d.text((70, y), ln, font=fb, fill=SUAVE); y += 48
    return base
def quadro_resultado(info, foto, rot, t):
    base = Image.new('RGB', (W, H), BEGE)
    if foto: base.paste(kenburns(foto, t, 1), (0, 0))
    painel = Image.new('RGBA', (W, 360), (0, 0, 0, 0)); ImageDraw.Draw(painel).rounded_rectangle([0, 0, W, 420], 44, fill=(255, 255, 255, 255)); base.paste(painel, (0, H - 360), painel)
    d = ImageDraw.Draw(base)
    d.text((70, H - 318), 'RESULTADO', font=fonte('bricolage.ttf', 30, 700), fill=VERDE2)
    d.text((68, H - 272), info['nome'], font=fonte('bricolage.ttf', 56, 800), fill=TINTA)
    d.text((70, H - 196), rot.capitalize(), font=fonte('figtree.ttf', 36, 500), fill=SUAVE)
    return base
def quadro_fim(info, t):
    base = gradiente(VERDE2, VERDE); d = ImageDraw.Draw(base); a = ease(min(1, t * 1.8))
    f = fonte('bricolage.ttf', 96, 800); txt = 'Pronta para treinar.'; tw = d.textlength(txt, font=f)
    d.text(((W - tw) / 2, 560 - 30 * a), txt, font=f, fill=(255, 255, 255))
    f2 = fonte('figtree.ttf', 38, 500); t2 = 'Seu cabelo. Seu treino. Seu jeito.'; tw2 = d.textlength(t2, font=f2); d.text(((W - tw2) / 2, 690 - 30 * a), t2, font=f2, fill=CLARO)
    lg = logo(110, True)
    if lg: base.paste(lg, (int((W - lg.size[0]) / 2), H - 280), lg)
    return base
def video(sl, pasta, saida):
    item = next((x for x in L if slug(x[0]) == sl), None)
    if not item: raise SystemExit(f'penteado não encontrado: {sl}')
    nome, desc, fam, tipos, comps, tr, mins, dif, fix, acs, dest, var = item
    passos = []
    for n, (t, ins, v) in enumerate(P[fam], 1):
        if n == 1 and var: ins = ins.rstrip('.') + f' ({var}).'
        passos.append((t, ins))
    info = dict(nome=nome, min=mins, dif=dif, fix=fix, passos=passos)
    fotos = {p: abre(pasta, sl, p) for p in ['p1', 'p2', 'p3', 'p4'] + [a for a, _ in ANG]}
    cenas = [(1.8, lambda t: quadro_intro(info, fotos['capa'], t))]
    for k in range(4): cenas.append((2.7, (lambda k: lambda t: quadro_passo(info, fotos[f'p{k + 1}'], k, t, 4))(k)))
    for a, rot in ANG:
        if fotos[a]: cenas.append((1.5, (lambda a, rot: lambda t: quadro_resultado(info, fotos[a], rot, t))(a, rot)))
    cenas.append((2.0, lambda t: quadro_fim(info, t)))
    os.makedirs(saida, exist_ok=True); dest = os.path.join(saida, f'{sl}.mp4')
    cmd = [FFMPEG, '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', dest]
    pr = subprocess.Popen(cmd, stdin=subprocess.PIPE); TR = 0.35; ant = None
    for dur, fn in cenas:
        n = int(dur * FPS)
        for i in range(n):
            q = fn(i / max(1, n - 1)).convert('RGB')
            if ant is not None and i < TR * FPS: q = Image.blend(ant, q, ease(i / (TR * FPS)))
            pr.stdin.write(q.tobytes()); ult = q
        ant = ult
    pr.stdin.close(); pr.wait()
    return dest, sum(c[0] for c in cenas)
if __name__ == '__main__':
    alvo = sys.argv[1]; pasta = sys.argv[2] if len(sys.argv) > 2 else 'entregas/fotos'; saida = sys.argv[3] if len(sys.argv) > 3 else 'entregas/videos'
    alvos = sorted({os.path.basename(a).split('--')[0] for a in glob.glob(os.path.join(pasta, '*--p1.*'))}) if alvo == 'todos' else [alvo]
    for sl in alvos:
        d, s = video(sl, pasta, saida); print(f'{d}  {s:.1f}s  {os.path.getsize(d) / 1e6:.1f} MB')
