"""CK Life · versões da logo OFICIAL (CK_Life_Logo_Transparente_2048_v2.png e CK_Life_App_Icon_1024.png).
Não redesenha: só recorta, redimensiona e cria a versão clara (mesma forma, cores claras) para fundos verdes."""
import sys
from PIL import Image, ImageDraw, ImageFont
ORIG = "/Users/tiagoroity/Downloads/fotos-ck-life/"; OUT = sys.argv[1]
logo = Image.open(ORIG + "CK_Life_Logo_Transparente_2048_v2.png").convert("RGBA")
icon = Image.open(ORIG + "CK_Life_App_Icon_1024.png").convert("RGBA")
bb = logo.getbbox(); logo = logo.crop(bb)
W, H = logo.size; a = logo.split()[3]
# linha vazia entre o símbolo e a palavra LIFE → símbolo isolado
rows = [sum(a.crop((0, y, W, y + 1)).getdata()) for y in range(H)]
gap = max(y for y in range(int(H * .55), H) if rows[y] == 0 and any(rows[k] > 0 for k in range(y, H)))
sim = logo.crop((0, 0, W, gap)); sim = sim.crop(sim.getbbox())
def claro(im):
    px = im.load(); o = Image.new("RGBA", im.size); op = o.load()
    for y in range(im.size[1]):
        for x in range(im.size[0]):
            r, g, b, al = px[x, y]
            if al == 0: continue
            t = min(1, max(0, (r + g + b) / 3 / 200))
            op[x, y] = (int(245 - 60 * t), int(248 - 27 * t), int(239 - 61 * t), al)
    return o
def salva(im, nome, larg):
    k = larg / im.size[0]; r = im.resize((larg, round(im.size[1] * k)), Image.LANCZOS)
    r.save(f"{OUT}/{nome}.png", optimize=True); r.save(f"{OUT}/{nome}.webp", "WEBP", quality=90, method=6)
salva(logo, "ck-logo", 720); salva(claro(logo.resize((720, round(H * 720 / W)), Image.LANCZOS)), "ck-logo-claro", 720)
salva(sim, "ck-simbolo", 256); salva(claro(sim.resize((256, round(sim.size[1] * 256 / sim.size[0])), Image.LANCZOS)), "ck-simbolo-claro", 256)
for s in (16, 32, 48): icon.resize((s, s), Image.LANCZOS).save(f"{OUT}/favicon-{s}.png")
# imagem de compartilhamento (OpenGraph): logo oficial + assinatura
og = Image.new("RGB", (1200, 630), (245, 248, 239)); d = ImageDraw.Draw(og)
lg = logo.copy(); lg.thumbnail((430, 430), Image.LANCZOS); og.paste(lg, (110, (630 - lg.size[1]) // 2), lg)
def fonte(n):
    for f in ["/System/Library/Fonts/Supplemental/Georgia Bold.ttf", "/System/Library/Fonts/Helvetica.ttc"]:
        try: return ImageFont.truetype(f, n)
        except Exception: pass
    return ImageFont.load_default()
d.text((620, 220), "Create. Keep. Live.", font=fonte(54), fill=(14, 61, 50))
d.text((620, 300), "Crie. Mantenha. Viva.", font=fonte(34), fill=(46, 125, 90))
d.text((620, 370), "Sua vida. Seu ritmo. Sua evolução.", font=fonte(28), fill=(70, 82, 76))
og.save(f"{OUT}/og-ck-life.jpg", quality=88)
print("símbolo", sim.size, "logo", logo.size, "corte em", gap)
