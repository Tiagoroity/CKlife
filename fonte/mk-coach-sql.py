# junta base + mensagens + motor em ck-life/coach.sql
import sys; sys.path.insert(0, ".")
from coach_mensagens import M
q = lambda s: "'" + s.replace("'", "''") + "'"
rows = [f"({q(c)},{q(t)},{q(x)})" for c, L in M.items() for t, x in L]
seed = "-- ---------- Mensagens iniciais (%d em %d categorias). Rodar de novo não duplica. ----------\ninsert into public.coach_mensagens (categoria, titulo, texto) values\n%s\non conflict (categoria, texto) do nothing;\n\n" % (len(rows), len(M), ",\n".join(rows))
open("ck-life/coach.sql", "w").write(open("ck-life/coach-base.sql").read() + "\n" + seed + open("ck-life/coach-motor.sql").read())
print(len(rows), "mensagens")
