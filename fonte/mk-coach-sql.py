# coach.sql = base + mensagens + motor + comunidade + ajuste da equipe; etapa5.sql = coach.sql + parceira.sql
import sys; sys.path.insert(0, ".")
from coach_mensagens import M
q = lambda s: "'" + s.replace("'", "''") + "'"
rows = [f"({q(c)},{q(t)},{q(x)})" for c, L in M.items() for t, x in L]
seed = "-- ---------- Mensagens iniciais (%d em %d categorias). Rodar de novo não duplica. ----------\ninsert into public.coach_mensagens (categoria, titulo, texto) values\n%s\non conflict (categoria, texto) do nothing;\n\n" % (len(rows), len(M), ",\n".join(rows))
r = lambda f: open("ck-life/" + f).read()
coach = r("coach-base.sql") + "\n" + seed + r("coach-motor.sql") + "\n" + r("coach-comunidade.sql") + "\n" + r("coach-equipe-tick.sql") + "\n"
open("ck-life/coach.sql", "w").write(coach)
open("ck-life/etapa5.sql", "w").write("-- CK Life · Etapa 5 (Coach na comunidade, \"Amiga, faltou você\", Parceira CK). Inclui a Coach completa; pode rodar mais de uma vez.\n" + coach + "\n" + r("parceira.sql"))
print(len(rows), "mensagens")
