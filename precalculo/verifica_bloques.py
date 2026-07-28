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

  4. Con `--prosa`, contrasta además las cifras citadas en el TEXTO (párrafos,
     cajas, listas) contra las salidas ejecutadas y el JSON del precálculo.
     Ese era el último hueco de verificación del proyecto: los bloques estaban
     cubiertos, pero la prosa que los comenta citaba números que nadie
     contrastaba —y la fase 3 ya había cazado dos casos escritos de memoria—.

Uso:
    python3 precalculo/verifica_bloques.py sitio/muestreo/capitulo-4-*.html
    python3 precalculo/verifica_bloques.py --todos
    python3 precalculo/verifica_bloques.py --todos --prosa

Se ejecuta desde la raíz del repositorio (la carpeta Muestreo/): las sesiones de
R y de Python heredan ese directorio de trabajo, así que las rutas relativas a
`CSV data sets for SDA 3e/` funcionan igual que en el material.

Sobre la línea base de la prosa
-------------------------------
Muchas cifras del texto son legítimas sin aparecer literalmente en ninguna
salida: cocientes que el autor deriva («676 veces menor»), cifras en otra unidad
(«7,1 millones» frente a 7081850), constantes de tablas (z = 1,960) y datos
bibliográficos. Verificarlas exige criterio humano, no una regla.

Por eso el modo `--prosa` funciona como REGRESIÓN: `precalculo/cifras_prosa.json`
guarda las cifras ya revisadas a mano con su justificación, y el verificador solo
protesta por las que **no** están en esa lista. Así la revisión se hace una vez y
cualquier cifra nueva que se cuele después salta sola.
"""

import argparse
import json
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


# ---------------------------------------------------------------------------
# Verificación de las cifras de la PROSA
# ---------------------------------------------------------------------------
BASE_PROSA = RAIZ / "precalculo" / "cifras_prosa.json"

# Solo texto que el estudiante lee como afirmación: párrafos, ítems y títulos de
# caja. Se excluyen los atributos de estilo (que traen colores como #012820 y
# opacidades) y el contenido de <pre>, que ya cubre la verificación de bloques.
TEXTO_RE = re.compile(r'<(p|li|h4)\b[^>]*>(.*?)</\1>', re.S)
# Cifras "con contenido": decimales, o miles separados por espacio fino. Un
# entero suelto (2, 15, 300) casi siempre es un tamaño de muestra o un número de
# capítulo, no un resultado, y llenaría el informe de ruido.
# El número se captura ENTERO en formato español —miles con espacio fino y
# decimales con coma—: partirlo en la coma convertía «528 609,8» en «528 609»,
# que no casa con el 528609.8 de la salida y producía un falso positivo.
CIFRA_PROSA_RE = re.compile(
    r'(?<![\w.,$])(\d{1,3}(?:[\u2009\u00a0 ]\d{3})+(?:,\d+)?|\d+,\d{2,})(?![\w])')


def numeros_del_universo(html):
    """Todo número que el capítulo puede justificar: salidas de sus bloques
    (incluidas las líneas `#>`, ya verificadas) y el JSON del precálculo."""
    universo = set()
    for _, cuerpo in BLOQUE_RE.findall(html):
        universo.update(NUM_RE.findall(html_mod.unescape(cuerpo)))
    m = re.search(r'const DATOS_CAP\d+ = (\{.*?\});\n', html, re.S)
    if m:
        universo.update(NUM_RE.findall(m.group(1)))
    return sorted({float(x) for x in universo if x not in ('-', '.')},)


def casa(valor, decimales, universo):
    """¿Algún número del universo redondea EXACTAMENTE a esta cifra?

    Solo redondeo, sin cambios de escala. La primera versión aceptaba también
    la misma cifra multiplicada por 100, 1000 o 10⁶ —pensando en «7,1 millones»
    frente a 7081850— y con eso casi cualquier número encontraba pareja: la
    prueba de regresión coló un `deff ≈ 47,83` inventado sin protestar. Las
    cifras en otra unidad van a la lista blanca revisada, que es donde debe
    vivir el criterio humano; la comparación automática se queda estricta.
    """
    tol = 0.5 * (10 ** -decimales) * 1.001
    return any(abs(u - valor) <= tol for u in universo)


def cifras_de_prosa(html):
    """Devuelve [(texto_cifra, contexto)] de todo lo que el estudiante lee."""
    cuerpo = re.sub(r'<script>.*?</script>', ' ', html, flags=re.S)
    # <style> también trae `p { line-height: 1.25 }`, que TEXTO_RE confundiría
    # con un párrafo lleno de cifras.
    cuerpo = re.sub(r'<style[^>]*>.*?</style>', ' ', cuerpo, flags=re.S)
    cuerpo = re.sub(r'<pre[^>]*>.*?</pre>', ' ', cuerpo, flags=re.S)
    fuera = []
    for _, trozo in TEXTO_RE.findall(cuerpo):
        texto = html_mod.unescape(re.sub(r'<[^>]+>', ' ', trozo))
        texto = re.sub(r'\s+', ' ', texto).strip()
        for m in CIFRA_PROSA_RE.finditer(texto):
            ini = max(0, m.start() - 60)
            fuera.append((m.group(1), texto[ini:m.end() + 40]))
    return fuera


def verifica_prosa(ruta, base):
    html = ruta.read_text(encoding="utf-8")
    universo = numeros_del_universo(html)
    conocidas = set(base.get("global", {})) | set(base.get(ruta.name, {}))
    sin_respaldo, respaldadas = [], 0
    vistas = set()
    for cifra, contexto in cifras_de_prosa(html):
        if cifra in vistas:
            continue
        vistas.add(cifra)
        if cifra in conocidas:
            respaldadas += 1
            continue
        n = cifra.replace(' ', '').replace(' ', '').replace(' ', '').replace(',', '.')
        try:
            valor = float(n)
        except ValueError:
            continue
        dec = len(n.split('.')[1]) if '.' in n else 0
        if casa(valor, dec, universo):
            respaldadas += 1
        else:
            sin_respaldo.append((cifra, contexto))
    return respaldadas, sin_respaldo


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
    ap.add_argument("--prosa", action="store_true",
                    help="verifica también las cifras citadas en el texto")
    ap.add_argument("--solo-prosa", action="store_true",
                    help="solo la prosa, sin ejecutar los bloques (rápido)")
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

    base = {}
    if args.prosa or args.solo_prosa:
        if BASE_PROSA.exists():
            base = json.loads(BASE_PROSA.read_text(encoding="utf-8"))
        else:
            print(f"(aviso: no existe {BASE_PROSA.name}; toda cifra no derivable "
                  f"se reportará como pendiente de revisión)")

    peor = 0
    total_sin = 0
    for p in rutas:
        print(f"\n{'=' * 70}\n{p.name}\n{'=' * 70}")
        if not args.solo_prosa:
            peor = max(peor, verifica([p]))
        if args.prosa or args.solo_prosa:
            ok, sin = verifica_prosa(p, base)
            total_sin += len(sin)
            print(f"\nPROSA: {ok} cifras respaldadas · {len(sin)} sin respaldo")
            for cifra, ctx in sin:
                print(f"    {cifra:>14}  …{ctx}…")
            if sin:
                peor = 1
    if args.prosa or args.solo_prosa:
        print(f"\n=== PROSA: {total_sin} cifras sin respaldo en total ===")
    return peor


if __name__ == "__main__":
    sys.exit(main())
