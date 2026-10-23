# confere a sintaxe de cada <script> do site (pega nomes repetidos e erros de digitação) com o JavaScriptCore do macOS
import re, subprocess, tempfile, sys
h = open("ck-life/site/index.html").read(); erros = 0
for k, sc in enumerate(re.findall(r"<script>([\s\S]*?)</script>", h)):
    with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False) as f: f.write("function __checa__(){\n" + sc + "\n}"); n = f.name
    r = subprocess.run(["/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc", n], capture_output=True, text=True, timeout=60)
    out = (r.stdout + r.stderr).strip()
    if out: erros += 1; print("script", k, "→", out[:300])
print("sintaxe ok" if not erros else f"{erros} script(s) com erro"); sys.exit(1 if erros else 0)
