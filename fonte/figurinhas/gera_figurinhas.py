"""CK Life · catálogo único de figurinhas.
Fonte: as 5 cartelas "CK LIFE STICKERS — PACK x/5" da pasta fotos-ck-life (recortadas por corta2.py).
Este arquivo é a ÚNICA lista: gera os arquivos (master PNG, app WEBP, mini WEBP), o catalogo.json do app e o SQL do banco.
Uso: python3 gera_figurinhas.py <pasta_dos_recortes> <pasta_img_site> <pasta_master> <arquivo_sql>
"""
import sys, json, os, re, unicodedata
from PIL import Image

CATEGORIAS = [("motivacao", "Motivação"), ("treino", "Treino"), ("conquistas", "Conquistas"), ("constancia", "Constância"),
              ("humor", "Humor"), ("reacoes", "Reações"), ("comunidade", "Comunidade"), ("autocuidado", "Autocuidado"),
              ("ciclo", "Ciclo e bem-estar"), ("ck", "CK Life")]
# (recorte, frase exatamente como na arte, categoria, tags extras)
F = [
 # cartela autocuidado / bem-estar
 ("p1_01","Hoje no meu ritmo","autocuidado",["ciclo","acolhimento"]), ("p1_02","Tudo bem desacelerar","autocuidado",["ciclo","acolhimento"]),
 ("p1_03","Dia de me acolher","autocuidado",["ciclo","acolhimento"]), ("p1_04","Respeitando meu corpo","autocuidado",["ciclo"]),
 ("p1_05","Meu ritmo importa","autocuidado",["ciclo"]), ("p1_06","Autocuidado primeiro","autocuidado",[]),
 ("p1_07","Sem culpa, com amor","autocuidado",["ciclo","acolhimento"]), ("p1_08","Treino leve, coração em paz","autocuidado",["treino","ciclo"]),
 ("p1_09","Corpo pedindo carinho","ciclo",["autocuidado","acolhimento"]), ("p1_10","Tô de boas hoje","ciclo",["humor","reacoes"]),
 ("p1_11","Sua vida. Seu corpo.","ck",["autocuidado"]), ("p1_12","Seu ritmo. Sua evolução.","ck",["constancia"]),
 ("p1_13","Crie sua jornada","ck",["motivacao"]), ("p1_14","Construa constância","constancia",["motivacao"]),
 ("p1_15","Viva sua evolução","ck",["motivacao"]), ("p1_16","CK Life vibes","ck",[]),
 ("p1_17","Wellness mood","autocuidado",["ciclo"]), ("p1_18","Energia de recomeço","motivacao",["ciclo"]),
 ("p1_19","Leveza também é força","autocuidado",["motivacao","ciclo"]), ("p1_20","Você tá florescendo","autocuidado",["comunidade","apoio"]),
 # cartela conquistas / treino
 ("p2_01","Concluído","treino",["conquistas","pos-treino"]), ("p2_02","Meta do dia feita","conquistas",["pos-treino"]),
 ("p2_03","Mais um check","treino",["constancia","pos-treino"]), ("p2_04","Hoje eu venci","conquistas",["pos-treino"]),
 ("p2_05","Constância on","constancia",["pos-treino"]), ("p2_06","Missão cumprida","conquistas",["pos-treino"]),
 ("p2_07","Você apareceu por você","constancia",["motivacao","pos-treino"]), ("p2_08","Mais um passo","treino",["constancia"]),
 ("p2_09","7 dias de constância","conquistas",["constancia","dado:sequencia:7"]), ("p2_10","KEEP GOING","motivacao",["ck","pos-treino"]),
 ("p2_11","30 dias!","conquistas",["constancia","dado:sequencia:30"]), ("p2_12","Constância construída","constancia",["conquistas"]),
 ("p2_13","Progresso salvo","conquistas",["pos-treino"]), ("p2_14","Streak ativada","constancia",["dado:sequencia:2"]),
 ("p2_15","Nova meta criada","conquistas",["motivacao"]), ("p2_16","Bora pra próxima","treino",["motivacao"]),
 ("p2_17","Evolução real","conquistas",["constancia"]), ("p2_18","CK conquista","ck",["conquistas","pos-treino"]),
 ("p2_19","Treino concluído","treino",["conquistas","pos-treino"]), ("p2_20","Create. Keep. Live.","ck",["pos-treino"]),
 # cartela comunidade / reações
 ("p3_01","Tô feliz","reacoes",["humor"]), ("p3_02","Orgulho de mim","conquistas",["reacoes"]),
 ("p3_03","Tô cansada","humor",["reacoes","ciclo"]), ("p3_04","Respira e vai","motivacao",["apoio"]),
 ("p3_05","Ai amiga","reacoes",["humor","chat"]), ("p3_06","Amei!","reacoes",["rapida"]),
 ("p3_07","Que tudooo","reacoes",["rapida"]), ("p3_08","Partiu","treino",["reacoes","chat"]),
 ("p3_09","Você não tá sozinha","comunidade",["apoio","acolhimento"]), ("p3_10","Tô com você","comunidade",["apoio","rapida"]),
 ("p3_11","Bora juntas","comunidade",["apoio","rapida"]), ("p3_12","Orgulho de você","comunidade",["apoio","reacoes","rapida"]),
 ("p3_13","Uma puxa a outra","comunidade",["apoio"]), ("p3_14","Seguimos juntas","comunidade",["apoio"]),
 ("p3_15","Você inspira","comunidade",["apoio","reacoes","rapida"]), ("p3_16","Isso aí, mulher!","reacoes",["apoio","rapida"]),
 ("p3_17","Bom diaaa","reacoes",["chat"]), ("p3_18","Socorro! amiga","humor",["chat"]),
 ("p3_19","Me chama","comunidade",["chat"]), ("p3_20","Bora?","comunidade",["treino","chat"]),
 # cartela humor
 ("p4_01","Treinei por milagre","humor",["treino","pos-treino"]), ("p4_02","Quase desisti, mas fui","humor",["treino","pos-treino"]),
 ("p4_03","Fingindo equilíbrio emocional","humor",[]), ("p4_04","Treinei e agora posso reclamar","humor",["treino","pos-treino"]),
 ("p4_05","Modo sofrida fitness","humor",["treino"]), ("p4_06","Hoje foi na força do ódio","humor",["treino","pos-treino"]),
 ("p4_07","A diva venceu","humor",["conquistas"]), ("p4_08","Morri, mas passo bem","humor",["treino","pos-treino"]),
 ("p4_09","Era preguiça, agora é orgulho","humor",["conquistas","pos-treino"]), ("p4_10","Acordei sem vontade e fui assim mesmo","humor",["treino"]),
 ("p4_11","Tomei coragem","humor",["motivacao"]), ("p4_12","Suando, mas linda","humor",["treino"]),
 ("p4_13","Treino pago","treino",["humor","pos-treino"]), ("p4_14","Bora fingir naturalidade","humor",[]),
 ("p4_15","Zero vontade, cem por cento presença","humor",["constancia"]), ("p4_16","Missão sofrida","humor",["treino"]),
 ("p4_17","Sobrevivi ao treino","treino",["humor","pos-treino"]), ("p4_18","A gata foi","treino",["humor","pos-treino"]),
 ("p4_19","Cadê meu prêmio?","humor",["conquistas"]), ("p4_20","Fui sem vontade e voltei poderosa","humor",["treino","pos-treino"]),
 # cartela motivação / CK Life
 ("p5_01","Vai com tudo!","motivacao",["apoio"]), ("p5_02","Você consegue!","motivacao",["apoio"]),
 ("p5_03","Constância > perfeição","constancia",["motivacao"]), ("p5_04","Um passo de cada vez","motivacao",["constancia"]),
 ("p5_05","Hoje teve!","treino",["conquistas","pos-treino"]), ("p5_06","Feito é melhor que perfeito","motivacao",[]),
 ("p5_07","Bora manter","constancia",["treino"]), ("p5_08","Você tá indo bem","motivacao",["apoio"]),
 ("p5_09","Disciplina, gata","motivacao",["humor"]), ("p5_10","Create","ck",[]),
 ("p5_11","Keep","ck",[]), ("p5_12","Live","ck",[]),
 ("p5_13","CK girl","ck",[]), ("p5_14","CK mood","ck",["reacoes"]),
 ("p5_15","Crie. Mantenha. Viva.","ck",[]), ("p5_16","Sua vida. Seu ritmo.","ck",["autocuidado"]),
 ("p5_17","Sua evolução.","ck",["conquistas"]), ("p5_18","Keep going","motivacao",["ck","pos-treino"]),
 ("p5_19","Create. Keep. Live.","ck",["pos-treino"]), ("p5_20","Constância linda","constancia",["pos-treino"]),
]
DESTAQUE = {"Hoje teve!", "A gata foi", "Constância linda", "CK girl", "Create. Keep. Live.", "Você apareceu por você", "Bora juntas", "Treino concluído", "Orgulho de você", "Amei!"}
def slug(t):
    t = unicodedata.normalize("NFD", t).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-")[:48]

def main(rec, site_img, master, sql_out):
    os.makedirs(f"{site_img}/figurinhas/app", exist_ok=True); os.makedirs(f"{site_img}/figurinhas/mini", exist_ok=True); os.makedirs(master, exist_ok=True)
    cont, vistos, cat = {}, set(), []
    for ordem, (r, nome, c, tags) in enumerate(F):
        base = slug(nome); sid = base if base not in vistos else f"{base}-2"; vistos.add(sid)
        cont[c] = cont.get(c, 0) + 1; arq = f"ck-{c}-{cont[c]:03d}"
        im = Image.open(f"{rec}/{r}.png").convert("RGBA")
        im.save(f"{master}/{arq}.png", optimize=True)
        a = im.copy(); a.thumbnail((512, 512), Image.LANCZOS); a.save(f"{site_img}/figurinhas/app/{arq}.webp", "WEBP", quality=88, method=6)
        m = im.copy(); m.thumbnail((168, 168), Image.LANCZOS); m.save(f"{site_img}/figurinhas/mini/{arq}.webp", "WEBP", quality=80, method=6)
        rap = "rapida" in tags
        cat.append({"id": sid, "nome": nome, "categoria": c, "tags": [t for t in tags if t not in ("rapida",)],
                    "arquivo": f"img/figurinhas/app/{arq}.webp", "mini": f"img/figurinhas/mini/{arq}.webp",
                    "ativa": True, "destaque": nome in DESTAQUE, "ordem": (ordem + 1) * 10,
                    "em_stories": True, "em_chat": True, "em_comentarios": True, "em_comunidade": True, "em_reacoes": rap})
    json.dump({"versao": 1, "categorias": CATEGORIAS, "figurinhas": cat}, open(f"{site_img}/figurinhas/catalogo.json", "w"), ensure_ascii=False, separators=(",", ":"))
    q = lambda s: "'" + s.replace("'", "''") + "'"
    linhas = [f"({q(x['id'])},{q(x['nome'])},{q(x['categoria'])},array[{','.join(q(t) for t in x['tags'])}]::text[],{q(x['arquivo'])},{q(x['mini'])},{str(x['destaque']).lower()},{x['ordem']},{str(x['em_reacoes']).lower()})" for x in cat]
    open(sql_out, "w").write("insert into public.figurinhas_catalogo (id, nome, categoria, tags, arquivo, mini, destaque, ordem, em_reacoes) values\n" + ",\n".join(linhas) + "\non conflict (id) do nothing;\n")
    print(len(cat), "figurinhas ·", {c: n for c, n in cont.items()})

if __name__ == "__main__":
    main(*sys.argv[1:5])
