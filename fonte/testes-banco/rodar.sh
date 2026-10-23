#!/bin/sh
# Sobe um Postgres local, aplica o banco do CK Life e roda os testes de segurança.
S=/private/tmp/claude-501/-Users-tiagoroity-Library-Application-Support-Claude-scratch-workspaces-509548f2-ca6a-414d-9930-504b028f9261-f595232b-a82c-461e-bbd1-7ed699c82841-scratch-2026-10-22-8fc74f/5216d9b6-8285-46a5-85aa-55c7176f5aa7/scratchpad
cd "$(dirname "$0")"
URI=$($S/pgenv/bin/python -c "import pgserver; print(pgserver.get_server('$S/pgdata', cleanup_mode=None).get_uri())")
PSQL="$S/pgenv/lib/python3.9/site-packages/pgserver/pginstall/bin/psql"
run(){ "$PSQL" "$URI" -q -v ON_ERROR_STOP=1 -X -f "$1" >/tmp/ck_psql.out 2>&1 || { echo "FALHOU em $1"; tail -20 /tmp/ck_psql.out; exit 1; }; echo "ok  $1"; }
run supabase_base.sql
for f in ../ck-life/banco-de-dados.sql ../ck-life/comunidade.sql ../ck-life/expansao.sql ../ck-life/social-partes/social-parte1.sql ../ck-life/social-partes/social-parte2.sql ../ck-life/social-partes/social-parte3.sql ../ck-life/social-partes/social-parte4.sql ../ck-life/social-partes/social-parte5.sql ../ck-life/social.sql ../ck-life/seguranca.sql ../ck-life/seguranca.sql ../ck-life/novidades.sql ../ck-life/novidades.sql; do run "$f"; done
for tf in testes.sql testes_seguranca.sql testes_novidades.sql; do [ -f $tf ] && "$PSQL" "$URI" -X -v ON_ERROR_STOP=1 -f $tf 2>&1 | grep -E "NOTICE|ERROR|FALHA" | sed 's/^psql:[^ ]* //'; done
