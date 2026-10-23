import re, unicodedata, sys
sys.path.insert(0, '.')
from penteados import L, P
def slug(s): return re.sub(r'[^a-z0-9]+', '-', unicodedata.normalize('NFD', s.lower()).encode('ascii', 'ignore').decode()).strip('-')
q = lambda s: "'" + s.replace("'", "''") + "'"
arr = lambda a: "array[" + ",".join(q(x) for x in a) + "]::text[]"
cab = open('cabelo_base.sql').read()
ins = ["-- ---------- 6) Catálogo inicial (só texto; mídia pendente). Não sobrescreve o que você editar no painel. ----------"]
for i, (nome, desc, fam, tipos, comps, treinos, mins, dif, fix, acs, dest, var) in enumerate(L):
    sl = slug(nome)
    ins.append(f"insert into public.penteados (nome, slug, descricao, familia, tipos, comprimentos, treinos, minutos, dificuldade, fixacao, acessorios, destaque, ordem, status) values ({q(nome)}, {q(sl)}, {q(desc)}, {q(fam)}, {arr(tipos)}, {arr(comps)}, {arr(treinos)}, {mins}, {q(dif)}, {q(fix)}, {arr(acs)}, {str(dest).lower()}, {(i+1)*10}, 'publicado') on conflict (slug) do nothing;")
    vals = []
    for n, (t, ins_, v) in enumerate(P[fam], 1):
        if n == 1 and var: ins_ = ins_.rstrip('.') + f" ({var})."
        vals.append(f"({n},{q(t)},{q(ins_)},{q(v)})")
    ins.append(f"insert into public.penteado_passos (penteado_id, numero, titulo, instrucao, vista) select p.id, v.n, v.t, v.i, v.vi from public.penteados p, (values {','.join(vals)}) v(n,t,i,vi) where p.slug = {q(sl)} on conflict (penteado_id, numero) do nothing;")
fim = "\n\nselect 'Cabelo para Treinar pronto (DESATIVADO para as alunas)' as status, (select count(*) from public.penteados) as penteados;\n"
open('../cabelo.sql', 'w').write(cab + "\n".join(ins) + fim)
open('../cabelo-parte1.sql', 'w').write("-- CK Life · Cabelo para Treinar · PARTE 1 de 2 (estrutura)\n" + cab + "\nselect 'Parte 1 pronta' as status;\n")
open('../cabelo-parte2.sql', 'w').write("-- CK Life · Cabelo para Treinar · PARTE 2 de 2 (penteados iniciais)\n" + "\n".join(ins) + fim)
print(len(L), "penteados")
