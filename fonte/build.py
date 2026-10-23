import pathlib, shutil
s = pathlib.Path("src")
base = (s/"shell.html").read_text()
data = "\n".join((s/f).read_text() for f in ["receitas1.js","receitas2.js","receitas3.js","receitas4.js","treinos.js","casa.js"])
def monta(config, supa):
    h = base.replace("/*CSS*/", (s/"app.css").read_text()).replace("/*DATA*/", data)
    h = h.replace("/*CONFIG*/", config).replace("<!--SUPABASE-->", supa)
    for k, f in [("NUVEM","nuvem.js"),("SONS","sons.js"),("BONECO","boneco.js"),("FOTOS","fotos.js"),("APP","app.js"),("ADMIN","admin.js")]:
        txt = (s/f).read_text()
        if f == "app.js": txt = txt.replace("/*EXPANSAO*/", (s/"expansao.js").read_text()).replace("/*SOCIAL*/", (s/"social.js").read_text() + "\n" + (s/"stickers.js").read_text() + "\n" + (s/"meus-dados.js").read_text() + "\n" + (s/"experiencia.js").read_text() + "\n" + (s/"figurinhas.js").read_text() + "\n" + (s/"novidades.js").read_text() + "\n" + (s/"plano.js").read_text() + "\n" + (s/"treino-voz.js").read_text() + "\n" + (s/"navegacao.js").read_text())
        if f == "admin.js": txt = txt.replace("/*ADMINXP*/", (s/"admin-xp.js").read_text() + "\n" + (s/"admin-seg.js").read_text() + "\n" + (s/"admin-mon.js").read_text())
        h = h.replace("/*%s*/" % k, txt)
    return h
# 1) demonstração (Artifact): sem banco, dados no aparelho
demo = monta("window.APP_CONFIG = {};", "")
pathlib.Path("fitverde.html").write_text(demo)
pathlib.Path("teste.html").write_text('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>' + demo + '</body></html>')
# 2) site de verdade (GitHub + Vercel): com Supabase
cfg = """/* ===== PREENCHA AQUI (Passo 4 do guia) ===== */
window.APP_CONFIG = {
  SUPABASE_URL: "https://psxmyiudtuozasbqzvnu.supabase.co",  // Project URL do Supabase
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzeG15aXVkdHVvemFzYnF6dm51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3MDcxOTEsImV4cCI6MjEwODI4MzE5MX0.-uSUzK80Eh43YJzjLGh_yUN4tsw7DtejWiHqzQefPv8",  // chave anon public (pode ficar no site)
  KIWIFY_URL: "",                   // link de checkout do Premium na Kiwify (opcional)
  SUPORTE: ""                       // contato de suporte, ex.: WhatsApp (65) 99999-9999 (opcional)
};"""
site = monta(cfg, '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.4/dist/umd/supabase.js"></script>')
head = '<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<meta name="theme-color" content="#0E3D32">\n<link rel="icon" type="image/png" sizes="32x32" href="img/marca/favicon-32.png">\n<link rel="icon" type="image/png" sizes="16x16" href="img/marca/favicon-16.png">\n<link rel="icon" type="image/png" sizes="192x192" href="img/icone-192.png">\n<link rel="apple-touch-icon" href="img/apple-touch-icon.png">\n<link rel="manifest" href="manifest.webmanifest">\n<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-title" content="CK Life">\n<meta name="apple-mobile-web-app-status-bar-style" content="default">\n<meta name="description" content="CK Life · Create. Keep. Live. Treino, rotina, ciclo e comunidade para mulheres. Sua vida. Seu ritmo. Sua evolução.">\n<meta property="og:type" content="website">\n<meta property="og:site_name" content="CK Life">\n<meta property="og:title" content="CK Life · Create. Keep. Live.">\n<meta property="og:description" content="Sua vida. Seu ritmo. Sua evolução. Treino, rotina, ciclo e comunidade para mulheres.">\n<meta property="og:image" content="https://cklife.vercel.app/img/marca/og-ck-life.jpg">\n<meta property="og:url" content="https://cklife.vercel.app/">\n<meta name="twitter:card" content="summary_large_image">\n<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}</style>\n</head>\n<body>\n'
out = pathlib.Path("ck-life/site"); out.mkdir(parents=True, exist_ok=True)
(out/"index.html").write_text(head + site + "\n</body>\n</html>\n")
x = out/"xbot.json"
if x.exists(): x.unlink()
# fotos também na pasta da demonstração
import os
os.makedirs("img", exist_ok=True)
for f in (out/"img").iterdir():
    if f.suffix in (".jpg", ".png"): shutil.copy(f, pathlib.Path("img")/f.name)
print(len(demo), len(site))
# miniaturas leves (img/p) para listas e cartões
import miniaturas
miniaturas.gera(out/"img", out/"img"/"p")
os.makedirs("img/p", exist_ok=True)
for f in (out/"img"/"p").iterdir(): shutil.copy(f, pathlib.Path("img/p")/f.name)
