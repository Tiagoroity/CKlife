import pathlib,re
h=pathlib.Path("ck-life/site/index.html").read_text()
h=re.sub(r'SUPABASE_URL: "[^"]*"','SUPABASE_URL: "https://teste.supabase.co"',h,1)
h=re.sub(r'SUPABASE_ANON_KEY: "[^"]*"','SUPABASE_ANON_KEY: "chave-de-teste"',h,1)
h=h.replace('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.4/dist/umd/supabase.js"></script>','<script src="cabseed.js"></script><script src="mock-supabase.js"></script><script src="audit-overflow.js"></script>')
assert "mock-supabase.js" in h and "psxmyiudtuozasbqzvnu" not in h
pathlib.Path("teste-nuvem.html").write_text(h)
print("ok")
