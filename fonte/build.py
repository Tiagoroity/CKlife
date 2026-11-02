import pathlib, shutil, time, json
VERSAO = time.strftime('%Y%m%d%H%M%S')
s = pathlib.Path("src")
base = (s/"shell.html").read_text()
data = "\n".join((s/f).read_text() for f in ["receitas1.js","receitas2.js","receitas3.js","receitas4.js","treinos.js","casa.js"])
def monta(config, supa):
    h = base.replace("/*CSS*/", (s/"app.css").read_text()).replace("/*DATA*/", data)
    h = h.replace("/*CONFIG*/", config).replace("<!--SUPABASE-->", supa)
    for k, f in [("NUVEM","nuvem.js"),("SONS","sons.js"),("BONECO","boneco.js"),("FOTOS","fotos.js"),("APP","app.js"),("ADMIN","admin.js")]:
        txt = (s/f).read_text()
        if f == "app.js": txt = txt.replace("/*EXPANSAO*/", (s/"expansao.js").read_text()).replace("/*SOCIAL*/", (s/"social.js").read_text() + "\n" + (s/"stickers.js").read_text() + "\n" + (s/"meus-dados.js").read_text() + "\n" + (s/"experiencia.js").read_text() + "\n" + (s/"figurinhas.js").read_text() + "\n" + (s/"novidades.js").read_text() + "\n" + (s/"plano.js").read_text() + "\n" + (s/"treino-voz.js").read_text() + "\n" + (s/"navegacao.js").read_text() + "\n" + (s/"notificacoes.js").read_text() + "\n" + (s/"anuncios.js").read_text() + "\n" + (s/"modulos.js").read_text() + "\n" + (s/"plano-anual.js").read_text() + "\n" + (s/"cabelo-arte.js").read_text() + "\n" + (s/"cabelo.js").read_text() + "\n" + (s/"fase1.js").read_text() + "\n" + (s/"fase2.js").read_text() + "\n" + (s/"camera.js").read_text() + "\n" + (s/"comunidade2.js").read_text() + "\n" + (s/"atualizar.js").read_text() + "\n" + (s/"entrada.js").read_text() + "\n" + (s/"coach.js").read_text() + "\n" + (s/"missoes.js").read_text() + "\n" + (s/"etapa5.js").read_text() + "\n" + (s/"inteligencia.js").read_text() + "\n" + (s/"limpeza.js").read_text() + "\n" + (s/"cidades.js").read_text() + "\n" + (s/"calendario.js").read_text() + "\n" + (s/"instalar.js").read_text() + "\n" + (s/"teste-aviso.js").read_text() + "\n" + (s/"origem.js").read_text() + "\n" + (s/"compartilhar.js").read_text() + "\n" + (s/"desafio21.js").read_text() + "\n" + (s/"passos.js").read_text() + "\n" + (s/"pixel.js").read_text())
        if f == "admin.js": txt = txt.replace("/*ADMINXP*/", (s/"admin-xp.js").read_text() + "\n" + (s/"admin-seg.js").read_text() + "\n" + (s/"admin-mon.js").read_text() + "\n" + (s/"admin-not.js").read_text() + "\n" + (s/"admin-anuncios.js").read_text() + "\n" + (s/"admin-ux.js").read_text() + "\n" + (s/"admin-mod.js").read_text() + "\n" + (s/"admin-cabelo.js").read_text() + "\n" + (s/"admin-numeros.js").read_text() + "\n" + (s/"admin-equipe.js").read_text() + "\n" + (s/"admin-coach.js").read_text() + "\n" + (s/"admin-aviso.js").read_text() + "\n" + (s/"admin-zap.js").read_text() + "\n" + (s/"admin-embaixadoras.js").read_text() + "\n" + (s/"admin-desafio21.js").read_text() + "\n" + (s/"admin-erros.js").read_text())
        h = h.replace("/*%s*/" % k, txt)
    return h.replace("__CK_VERSAO__", VERSAO)
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
# ícone e "app" certos já na primeira leitura da página: /admin instala como CK Admin, o resto como CK Life
ADM_LINKS = """<script>(function(){var a=/^\\/admin/.test(location.pathname)||location.hash.indexOf("#admin")===0;document.write('<link rel="apple-touch-icon" href="'+(a?'/img/admin/apple-touch-icon.png':'/img/apple-touch-icon.png')+'"><link rel="manifest" href="'+(a?'/manifest-admin.webmanifest':'/manifest.webmanifest')+'">');})();</script>\n"""
head = '<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<meta name="theme-color" content="#0E3D32">\n<link rel="icon" type="image/png" sizes="32x32" href="img/marca/favicon-32.png">\n<link rel="icon" type="image/png" sizes="16x16" href="img/marca/favicon-16.png">\n<link rel="icon" type="image/png" sizes="192x192" href="img/icone-192.png">\n' + ADM_LINKS + '<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-title" content="CK Life">\n<meta name="apple-mobile-web-app-status-bar-style" content="default">\n<meta name="description" content="CK Life · Create. Keep. Live. Treino, rotina, ciclo e comunidade para mulheres. Sua vida. Seu ritmo. Sua evolução.">\n<meta property="og:type" content="website">\n<meta property="og:site_name" content="CK Life">\n<meta property="og:title" content="CK Life · Create. Keep. Live.">\n<meta property="og:description" content="Sua vida. Seu ritmo. Sua evolução. Treino, rotina, ciclo e comunidade para mulheres.">\n<meta property="og:image" content="https://app.cklife.com.br/img/marca/og-ck-life.jpg">\n<meta property="og:url" content="https://app.cklife.com.br/">\n<meta property="og:image:secure_url" content="https://app.cklife.com.br/img/marca/og-ck-life.jpg">\n<meta property="og:image:type" content="image/jpeg">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n<meta property="og:image:alt" content="CK Life · Create. Keep. Live.">\n<meta property="og:locale" content="pt_BR">\n<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:image" content="https://app.cklife.com.br/img/marca/og-ck-life.jpg">\n<link rel="icon" href="/favicon.ico" sizes="any">\n<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}</style>\n</head>\n<body>\n'
# painel da equipe: ícone e nome próprios ao instalar (CK Admin)
ADM_JS = """<script>(function(){if(!/^\\/admin/.test(location.pathname)&&location.hash.indexOf("#admin")!==0)return;var q=function(s){return document.querySelector(s)};var m=q('link[rel="manifest"]');if(m)m.href="/manifest-admin.webmanifest";var t=q('link[rel="apple-touch-icon"]');if(t)t.href="/img/admin/apple-touch-icon.png";var n=q('meta[name="apple-mobile-web-app-title"]');if(n)n.content="CK Admin";var c=q('meta[name="theme-color"]');if(c)c.content="#04190F";var fav=function(){document.querySelectorAll('link[rel~="icon"]').forEach(function(l){l.remove()});[["32x32","/img/admin/favicon-32.png"],["16x16","/img/admin/favicon-16.png"],["192x192","/img/admin/icone-192.png"]].forEach(function(x){var l=document.createElement("link");l.rel="icon";l.type="image/png";l.sizes=x[0];l.href=x[1];document.head.appendChild(l)})};if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",fav);else fav();})();</script>\n"""
head = head.replace('<meta name="apple-mobile-web-app-status-bar-style" content="default">\n', '<meta name="apple-mobile-web-app-status-bar-style" content="default">\n' + ADM_JS)
out = pathlib.Path("ck-life/site"); out.mkdir(parents=True, exist_ok=True)
(out/"index.html").write_text(head + site + "\n</body>\n</html>\n")
(out/"versao.json").write_text(json.dumps({"v": VERSAO}))
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
