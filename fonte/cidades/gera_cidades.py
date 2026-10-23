"""CK Life · cidades de MT com mais de 20 mil habitantes, direto da API oficial do IBGE.
Fonte: IBGE · Estimativas da População · SIDRA tabela 6579, variável 9324 (População residente estimada).
URL: https://servicodados.ibge.gov.br/api/v3/agregados/6579/periodos/-1/variaveis/9324?localidades=N6[N3[51]]
Preserva as cidades já cadastradas (mesmo id) e só acrescenta os dados oficiais."""
import json, sys, unicodedata
d = json.load(open(sys.argv[1])); out = sys.argv[2]
res = d[0]["resultados"][0]["series"]; ano = list(res[0]["serie"].keys())[0]
L = [(s["localidade"]["id"], s["localidade"]["nome"].rsplit(" - ", 1)[0], int(list(s["serie"].values())[0])) for s in res if list(s["serie"].values())[0].isdigit()]
G = sorted([x for x in L if x[2] > 20000], key=lambda x: -x[2])
EXIST = {"Cuiabá": 1, "Várzea Grande": 2, "Rondonópolis": 3, "Sinop": 4, "Juara": 6, "Barra do Garças": 7}
q = lambda s: "'" + s.replace("'", "''") + "'"
lin = ["-- CK Life · cidades de Mato Grosso com mais de 20 mil habitantes (IBGE, estimativa " + ano + ", tabela SIDRA 6579)",
       "-- Preserva os ids já usados pelas alunas; não apaga nenhuma cidade (inclui 'Outra cidade' e cidades de outros estados)."]
for cod, nome, pop in G:
    extra = {"uf": "MT", "ibge": cod, "populacao": pop, "ano_estimativa": int(ano), "fonte": "IBGE · Estimativas da População (SIDRA 6579)", "status": "ativa"}
    if nome in EXIST:
        i = EXIST[nome]
        lin.append(f"update public.colecoes set dados = dados || {q(json.dumps(extra, ensure_ascii=False))}::jsonb where nome = 'cidades' and id = '{i}';")
    else:
        dd = {"id": int(cod), "nome": nome, "ativa": True, **extra}
        lin.append(f"insert into public.colecoes (nome, id, dados) values ('cidades', '{cod}', {q(json.dumps(dd, ensure_ascii=False))}::jsonb) on conflict (nome, id) do nothing;")
lin.append("select 'Cidades de MT prontas: ' || count(*) from public.colecoes where nome = 'cidades';")
open(out, "w").write("\n".join(lin) + "\n"); print(len(G), "cidades, ano", ano)
