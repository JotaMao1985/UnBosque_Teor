#!/usr/bin/env python3
"""Ejecuta los bloques de código de un capítulo y contrasta cada cifra anunciada.

Por qué existe: en el material de Series de Tiempo, una auditoría encontró que
**11 de las 22 cifras** escritas a mano en los comentarios `#>` de los bloques
estaban mal. Son plausibles, nadie las ejecuta y acaban publicadas. Esta
herramienta las ejecuta.

Qué hace:
  1. Extrae los bloques `language-r` y `language-python` del capítulo, en orden.
  2. Los ejecuta ENCADENADOS —todos los de R en una sesión, todos los de Python
     en otra—, que es como los ejecutaría un estudiante que sigue el capítulo de
     arriba abajo. Así se detecta el bloque que usa un objeto nunca definido.
  3. Para cada bloque, extrae los números de sus líneas `#>` y comprueba que
     aparezcan en la salida real de ESE bloque.

Uso:
    python3 precalculo/verifica_bloques.py sitio/muestreo/capitulo-4-*.html
    python3 precalculo/verifica_bloques.py --todos

Se ejecuta desde la raíz del repositorio (la carpeta Muestreo/): las sesiones de
R y de Python heredan ese directorio de trabajo, así que las rutas relativas a
`CSV data sets for SDA 3e/` funcionan igual que en el material.
"""

import argparse
import html as html_mod
import re
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
TMP = RAIZ / "precalculo" / ".tmp_verifica"

# El Rscript del PATH es Homebrew 4.6 y NO tiene survey. Hay que usar el del
# framework 4.4, que es donde viven survey, sampling y TeachingSampling.
RSCRIPT = "/Library/Frameworks/R.framework/Versions/4.4-arm64/Resources/bin/Rscript"

SEP = "###BLOQUE-%d###"
# El <pre> puede llevar atributos (los capítulos usan <pre class="collapsed">) y
# el <code> también. Una expresión más estricta encuentra 0 bloques y el
# verificador informa "nada que verificar" en vez de fallar: el fallo silencioso
# que esta herramienta existe para evitar. De ahí también la comprobación de
# `extrae()`.
BLOQUE_RE = re.compile(
    r'<pre[^>]*>\s*<code[^>]*class="[^"]*language-(r|python)[^"]*"[^>]*>(.*?)</code>\s*</pre>',
    re.S)
NUM_RE = re.compile(r'-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?')

CABECERA_R = (
    'suppressMessages({library(survey); library(sampling); '
    'library(TeachingSampling); library(jsonlite)})\n'
    'Sys.setlocale("LC_CTYPE", "en_US.UTF-8")\n'
    'options(warn = 1, survey.lonely.psu = "adjust")'
)
CABECERA_PY = (
    "import warnings; warnings.filterwarnings('ignore')\n"
    "import numpy as np, pandas as pd"
)


def extrae(textos):
    bloques = []
    for nombre, texto in textos:
        hallados = BLOQUE_RE.findall(texto)
        # Guarda contra el fallo silencioso: si el archivo menciona bloques de
        # código y la expresión no encuentra ninguno, el marcado ha cambiado y
        # hay que arreglar BLOQUE_RE, no dar el capítulo por verificado.
        menciones = len(re.findall(r'class="[^"]*language-(?:r|python)', texto))
        if menciones and not hallados:
            raise SystemExit(
                f"ABORTA: {nombre} menciona {menciones} bloques de código pero "
                f"BLOQUE_RE no encuentra ninguno. El marcado cambió: arregla la "
                f"expresión regular antes de fiarte de este verificador.")
        for lang, cuerpo in hallados:
            bloques.append({"archivo": nombre, "lang": lang,
                            "codigo": html_mod.unescape(cuerpo)})
    return bloques


def esperados(codigo):
    """Números anunciados en las líneas `#>` del bloque."""
    fuera = []
    for linea in codigo.splitlines():
        s = linea.strip()
        marca = "#>" if s.startswith("#>") else ("#&gt;" if s.startswith("#&gt;") else None)
        if marca is None:
            continue
        fuera.extend(NUM_RE.findall(s[len(marca):]))
    return fuera


def limpia(codigo):
    """El código sin sus líneas `#>`, que es lo que de verdad se ejecuta."""
    return "\n".join(l for l in codigo.splitlines() if not l.strip().startswith("#>"))


def corre(bloques, lang, cabecera, comando, sufijo, sep_fmt):
    idx = [i for i, b in enumerate(bloques) if b["lang"] == lang]
    if not idx:
        return {}
    TMP.mkdir(parents=True, exist_ok=True)
    partes = [cabecera]
    for k, i in enumerate(idx):
        partes.append(sep_fmt % k)
        partes.append(limpia(bloques[i]["codigo"]))
    ruta = TMP / f"bloques{sufijo}"
    ruta.write_text("\n\n".join(partes), encoding="utf-8")

    res = subprocess.run(comando + [str(ruta)], capture_output=True, text=True,
                         cwd=str(RAIZ), timeout=1800)
    salida = res.stdout + "\n" + res.stderr
    trozos = {}
    partes_salida = re.split(r"###BLOQUE-(\d+)###", salida)
    for j in range(1, len(partes_salida) - 1, 2):
        trozos[idx[int(partes_salida[j])]] = partes_salida[j + 1]
    return {"trozos": trozos, "codigo_salida": res.returncode, "todo": salida}


def verifica(rutas):
    textos = [(p.name, p.read_text(encoding="utf-8")) for p in rutas]
    bloques = extrae(textos)
    n_r = sum(b["lang"] == "r" for b in bloques)
    n_py = sum(b["lang"] == "python" for b in bloques)
    print(f"Bloques encontrados: {n_r} de R, {n_py} de Python")
    if not bloques:
        print("(nada que verificar)")
        return 0

    resultados = {
        "r": corre(bloques, "r", CABECERA_R, [RSCRIPT, "--vanilla"], ".R",
                   'cat("\\n' + SEP + '\\n")'),
        "python": corre(bloques, "python", CABECERA_PY, ["python3"], ".py",
                        'print("\\n' + SEP + '\\n")'),
    }

    total_ok = total = 0
    fallos = []
    for i, b in enumerate(bloques):
        r = resultados[b["lang"]]
        if not r:
            continue
        salida = r["trozos"].get(i, "")
        faltan = []
        for e in esperados(b["codigo"]):
            total += 1
            if e in set(NUM_RE.findall(salida)) or e in salida:
                total_ok += 1
            else:
                faltan.append(e)
        if faltan:
            fallos.append((i, b, faltan, salida))

    for i, b, faltan, salida in fallos:
        primera = next((l for l in b["codigo"].splitlines() if l.strip()), "")
        print(f"\n--- bloque #{i} ({b['lang']}, {b['archivo']}) ---")
        print(f"    empieza por: {primera.strip()[:78]}")
        print(f"    NO aparecen en la salida: {faltan}")
        print("    salida real:")
        for l in salida.strip().splitlines()[:22]:
            print("      " + l)

    for lang in ("r", "python"):
        r = resultados[lang]
        if r and r["codigo_salida"] != 0:
            print(f"\n!! la sesión de {lang} terminó con código {r['codigo_salida']}")
            print("\n".join(r["todo"].strip().splitlines()[-25:]))

    print(f"\n=== {total_ok} de {total} cifras anunciadas aparecen en la salida real "
          f"({len(fallos)} bloques con discrepancias) ===")
    return 0 if total_ok == total and not fallos else 1


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("html", nargs="*", help="capítulos a verificar")
    ap.add_argument("--todos", action="store_true",
                    help="verifica todos los capítulos de sitio/muestreo/")
    args = ap.parse_args()

    if args.todos:
        rutas = sorted((RAIZ / "sitio" / "muestreo").glob("capitulo-*.html"))
    else:
        rutas = [Path(h) for h in args.html]
    if not rutas:
        raise SystemExit("ABORTA: indica un capítulo o usa --todos")
    for p in rutas:
        if not p.exists():
            raise SystemExit(f"ABORTA: no existe {p}")

    peor = 0
    for p in rutas:
        print(f"\n{'=' * 70}\n{p.name}\n{'=' * 70}")
        peor = max(peor, verifica([p]))
    return peor


if __name__ == "__main__":
    sys.exit(main())
