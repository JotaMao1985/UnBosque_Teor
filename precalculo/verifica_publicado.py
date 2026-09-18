#!/usr/bin/env python3
"""Ejecuta el código TAL COMO ESTÁ PUBLICADO, sin darle nada que no traiga.

Por qué existe
--------------
Durante meses, el código publicado de diez páginas no arrancaba. Un estudiante
que copiaba el primer bloque de R se topaba con `could not find function
"svydesign"`, y el de Python con `NameError: name 'pd' is not defined`. Nadie lo
vio, y no por falta de verificación: `verifica_bloques.py` ejecuta todos los
bloques de todos los capítulos y contrasta cada cifra. Lo que pasa es que antes
de ejecutarlos les antepone CABECERA_R y CABECERA_PY —las librerías y los
imports—, porque su pregunta es «¿son ciertas las cifras?». Con ese preámbulo
puesto, el código corría y las cifras salían. El defecto vivía justo en el hueco
entre las dos herramientas: el preámbulo estaba en `cadena.R`, que es lo que se
ejecuta al precalcular, pero NO en los bloques, que es lo que se publica.

Este verificador hace la pregunta complementaria, y solo esa:

    ¿arranca lo que el estudiante se encuentra, con lo que el estudiante tiene?

De ahí su única regla de oro: **no antepone absolutamente nada**. Si el código
publicado necesita `library(survey)`, el código publicado tiene que traer
`library(survey)`. Cualquier tentación futura de añadir aquí una cabecera «para
que pase» reabre exactamente el agujero por el que se coló el defecto original;
si algo no arranca, se arregla el material, no el verificador.

Y la segunda decisión de fondo: por omisión no lee `sitio/`, sino que **descarga
la página del sitio vivo**. Lo que estaba roto no era el repositorio, era lo
servido. Un verificador que se conforma con el archivo local vuelve a dejar sin
cubrir el último tramo —el que va del commit aprobado a lo que de verdad ve el
estudiante—, que es donde viven los despistes de publicación. Con `--local` se
comprueba antes de publicar; sin `--local`, se comprueba lo publicado.

Qué comprueba, por página
-------------------------
  1. HUELLA: que lo servido coincida byte a byte con el blob de `origin/gh-pages`.
     Si no coincide, algo se publicó fuera del procedimiento o el despliegue aún
     no ha terminado, y lo que se ejecute abajo no es lo que hay en el repositorio.
  2. EJECUCIÓN: extrae los bloques `language-r` y `language-python` y los corre
     ENCADENADOS —todos los de R en una sesión, todos los de Python en otra—,
     que es como los recorre quien lee el capítulo de arriba abajo. Sin cabecera.

No mira cifras: de eso se encarga `verifica_bloques.py`. Aquí solo importa el
código de salida.

Uso:
    python3 precalculo/verifica_publicado.py                  # todo lo servido
    python3 precalculo/verifica_publicado.py --local          # antes de publicar
    python3 precalculo/verifica_publicado.py --pagina capitulo-4
    python3 precalculo/verifica_publicado.py --solo-huella    # sin ejecutar nada

Se ejecuta desde la raíz del repositorio (la carpeta Muestreo/): las sesiones de
R y de Python heredan ese directorio, así que las rutas relativas a
`CSV data sets for SDA 3e/` funcionan igual que le funcionan al estudiante que
ha descargado los datos junto al material.
"""

import argparse
import hashlib
import html as html_mod
import re
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SITIO = RAIZ / "sitio" / "muestreo"
TMP = RAIZ / "precalculo" / ".tmp_publicado"
RAMA = "gh-pages"
TIEMPO_MAX = 900  # segundos por lenguaje y página

# El Rscript del PATH es Homebrew y no tiene survey; los paquetes viven en el
# framework 4.4. Si algún día falta, se avisa en vez de dar por roto el material
# por una causa que es del entorno y no de lo publicado.
RSCRIPT_FRAMEWORK = "/Library/Frameworks/R.framework/Versions/4.4-arm64/Resources/bin/Rscript"

# Igual que en verifica_bloques.py: el <pre> y el <code> llevan atributos.
BLOQUE_RE = re.compile(
    r'<pre[^>]*>\s*<code[^>]*class="[^"]*language-(r|python)[^"]*"[^>]*>(.*?)</code>\s*</pre>',
    re.S)
# Para la guarda del bloque sin clase de lenguaje (ver extrae()).
PRE_RE = re.compile(r'<pre[^>]*>\s*<code([^>]*)>(.*?)</code>\s*</pre>', re.S)
SEP = "###BLOQUE-%d###"
SEP_RE = re.compile(r'###BLOQUE-(\d+)###')


# --------------------------------------------------------------------------
# De dónde sale lo que se verifica
# --------------------------------------------------------------------------

def base_del_sitio():
    """La URL del sitio, deducida del remoto para que no se quede obsoleta."""
    url = subprocess.run(["git", "remote", "get-url", "origin"],
                         cwd=RAIZ, capture_output=True, text=True).stdout.strip()
    m = re.search(r'github\.com[:/]([^/]+)/([^/]+?)(?:\.git)?$', url)
    if not m:
        raise SystemExit(f"ABORTA: no sé deducir la URL del sitio de «{url}».")
    usuario, repo = m.group(1), m.group(2)
    return f"https://{usuario.lower()}.github.io/{repo}/muestreo"


def paginas_locales():
    """Lo que hay en sitio/, que no es lo mismo que lo que se publica."""
    if not SITIO.is_dir():
        raise SystemExit(f"ABORTA: no encuentro {SITIO}.")
    return sorted(p.name for p in SITIO.glob("*.html"))


def paginas_de_la_rama(punta):
    """Lo que de verdad se publica. No todo lo de sitio/ se publica: el taller 1,
    por ejemplo, lo absorbió el preparcial y ya no se sirve. Si la lista saliera
    de sitio/, esas páginas darían 404 y el verificador informaría de un fallo
    que no existe —y un verificador que grita en falso deja de leerse—."""
    r = subprocess.run(["git", "ls-tree", "--name-only", punta, "muestreo/"],
                       cwd=RAIZ, capture_output=True, text=True)
    if r.returncode != 0:
        return []
    return sorted(Path(l).name for l in r.stdout.split() if l.endswith(".html"))


def descarga(url):
    with urllib.request.urlopen(url, timeout=60) as r:
        return r.read()


def blobs_de_la_rama():
    """md5 -> nombre de cada página en origin/gh-pages, o None si no se puede."""
    fetch = subprocess.run(["git", "fetch", "-q", "origin", RAMA],
                           cwd=RAIZ, capture_output=True, text=True)
    if fetch.returncode != 0:
        return None
    ref = subprocess.run(["git", "rev-parse", "FETCH_HEAD"],
                         cwd=RAIZ, capture_output=True, text=True)
    if ref.returncode != 0:
        return None
    punta = ref.stdout.strip()
    fuera = {"__punta__": punta}
    for nombre in paginas_de_la_rama(punta):
        blob = subprocess.run(["git", "cat-file", "blob", f"{punta}:muestreo/{nombre}"],
                              cwd=RAIZ, capture_output=True)
        if blob.returncode == 0:
            fuera[nombre] = hashlib.md5(blob.stdout).hexdigest()
    return fuera


def arboles_del_remoto(punta):
    """(árbol de gh-pages, árbol de main:sitio), o (None, None) si no se puede.

    La invariante: lo servido tiene que ser EXACTAMENTE el `sitio/` de un commit
    que ya está en el remoto. Es más barata y más fuerte que comparar md5 página
    a página, y caza dos cosas que ninguna otra comprobación mira: publicar
    desde un árbol local sin subir `main`, y editar `sitio/` directamente sobre
    `gh-pages`. Vale mientras el camino corto publique el árbol entero
    (`git commit-tree $(git rev-parse HEAD:sitio)`), que es lo que se hace hoy;
    el día que se publique un subconjunto a propósito, dejará de valer y habrá
    que decirlo aquí.
    """
    if subprocess.run(["git", "fetch", "-q", "origin", "main"], cwd=RAIZ,
                      capture_output=True).returncode != 0:
        return None, None
    def hash_de(ref):
        r = subprocess.run(["git", "rev-parse", ref], cwd=RAIZ,
                           capture_output=True, text=True)
        return r.stdout.strip() if r.returncode == 0 else None
    return hash_de(f"{punta}^{{tree}}"), hash_de("origin/main:sitio")


# --------------------------------------------------------------------------
# Los bloques
# --------------------------------------------------------------------------

def extrae(nombre, texto):
    hallados = BLOQUE_RE.findall(texto)
    # Guarda contra el fallo silencioso: si la página menciona bloques y la
    # expresión no encuentra ninguno, el marcado cambió y hay que arreglar
    # BLOQUE_RE, no dar la página por verificada.
    menciones = len(re.findall(r'class="[^"]*language-(?:r|python)', texto))
    if menciones and not hallados:
        raise SystemExit(
            f"ABORTA: {nombre} menciona {menciones} bloques de código y "
            f"BLOQUE_RE no encuentra ninguno. El marcado cambió: arregla la "
            f"expresión regular antes de fiarte de este verificador.")
    sin_clase = [c for atrs, c in PRE_RE.findall(re.sub(r'<script>.*?</script>', ' ',
                                                       texto, flags=re.S))
                 if "language-" not in atrs]
    if sin_clase:
        raise SystemExit(
            f"ABORTA: {nombre} tiene {len(sin_clase)} bloques <pre><code> sin "
            f"clase de lenguaje. El material los pinta como R (lo dice su propio "
            f"JS) y este verificador no los ejecutaría: quedarían publicados sin "
            f"que nadie los corra. Ponles la clase en el módulo de origen.")

    return [{"lang": lang, "codigo": html_mod.unescape(cuerpo)}
            for lang, cuerpo in hallados]


def limpia(codigo):
    """El código sin sus líneas `#>`, que es lo que el estudiante ejecuta."""
    return "\n".join(l for l in codigo.splitlines()
                     if not l.strip().startswith("#>"))


def primera_linea(codigo):
    for l in limpia(codigo).splitlines():
        if l.strip():
            return l.strip()
    return "(bloque vacío)"


def rscript():
    if Path(RSCRIPT_FRAMEWORK).exists():
        return RSCRIPT_FRAMEWORK, None
    return "Rscript", ("AVISO: no está el R del framework 4.4; uso el del PATH. "
                       "Si falla por un paquete que no encuentra, puede ser del "
                       "entorno y no de lo publicado.")


def corre(bloques, lang, nombre_pagina):
    """Ejecuta encadenados los bloques de un lenguaje. SIN CABECERA: ver arriba."""
    idx = [i for i, b in enumerate(bloques) if b["lang"] == lang]
    if not idx:
        return None

    if lang == "r":
        binario, aviso = rscript()
        comando, sufijo = [binario, "--vanilla"], ".R"
        sep_fmt = 'cat("\\n' + SEP + '\\n")'
    else:
        comando, sufijo, aviso = [sys.executable, "-u"], ".py", None
        sep_fmt = 'print("\\n' + SEP + '\\n")'

    partes = []
    for k, i in enumerate(idx):
        partes.append(sep_fmt % k)
        partes.append(limpia(bloques[i]["codigo"]))
    TMP.mkdir(parents=True, exist_ok=True)
    ruta = TMP / f"{Path(nombre_pagina).stem}{sufijo}"
    ruta.write_text("\n\n".join(partes) + "\n", encoding="utf-8")

    try:
        r = subprocess.run(comando + [str(ruta)], cwd=RAIZ,
                           capture_output=True, text=True, timeout=TIEMPO_MAX)
        codigo, salida, error = r.returncode, r.stdout, r.stderr
    except subprocess.TimeoutExpired:
        codigo, salida, error = -1, "", f"se pasó de {TIEMPO_MAX} s sin terminar"

    # El último separador emitido dice hasta dónde llegó: ese es el bloque que
    # rompió la cadena.
    vistos = SEP_RE.findall(salida)
    k = int(vistos[-1]) if vistos else None
    return {"lang": lang, "n": len(idx), "codigo": codigo, "error": error,
            "bloque": k, "llegados": len(vistos), "aviso": aviso,
            "pista": primera_linea(bloques[idx[k]]["codigo"]) if k is not None else None,
            "ruta": ruta}


# --------------------------------------------------------------------------
# Informe
# --------------------------------------------------------------------------

def plural(n):
    return "1 página" if n == 1 else f"las {n} páginas"


def informa_ejecucion(res):
    etiqueta = "R" if res["lang"] == "r" else "Python"
    if res["aviso"]:
        print(f"    {res['aviso']}")
    if res["codigo"] == 0:
        print(f"    {etiqueta}: {res['n']} bloques, arranca (salida 0)")
        return True
    donde = (f"bloque {res['bloque'] + 1} de {res['n']}"
             if res["bloque"] is not None else "antes del primer bloque")
    print(f"    {etiqueta}: FALLA en el {donde}  (salida {res['codigo']})")
    if res["pista"]:
        print(f"      el bloque empieza por: {res['pista']}")
    for linea in [l for l in res["error"].strip().splitlines() if l.strip()][-6:]:
        print(f"      | {linea}")
    print(f"      lo ejecutado quedó en {res['ruta'].relative_to(RAIZ)}")
    return False


def main():
    ap = argparse.ArgumentParser(
        description="Ejecuta el código publicado sin anteponerle nada.")
    ap.add_argument("--local", action="store_true",
                    help="lee sitio/muestreo/ en vez del sitio vivo")
    ap.add_argument("--pagina", action="append", default=[],
                    help="verifica solo las páginas cuyo nombre contenga esto")
    ap.add_argument("--solo-huella", action="store_true",
                    help="compara lo servido con la rama y no ejecuta nada")
    args = ap.parse_args()

    desajuste_arbol = False
    base = None if args.local else base_del_sitio()
    rama = None if args.local else blobs_de_la_rama()
    locales = paginas_locales()

    if args.local:
        lista = locales
        print(f"Fuente: {SITIO.relative_to(RAIZ)}  (sin publicar todavía)")
    elif rama:
        lista = [n for n in rama if n != "__punta__"]
        print(f"Fuente: {base}")
        print(f"Contrastado con origin/{RAMA} en {rama['__punta__'][:7]}")
        arbol_rama, arbol_main = arboles_del_remoto(rama["__punta__"])
        if arbol_rama and arbol_main:
            if arbol_rama == arbol_main:
                print(f"Árbol: origin/{RAMA} y origin/main:sitio coinciden "
                      f"({arbol_rama[:7]})")
            else:
                print(f"Árbol: NO COINCIDEN  origin/{RAMA} {arbol_rama[:7]} · "
                      f"origin/main:sitio {arbol_main[:7]}")
                print("    Lo servido no es el sitio/ de ningún commit subido: "
                      "o se publicó sin subir main, o se editó gh-pages a mano.")
                desajuste_arbol = True
        else:
            print("Árbol: no pude leer origin/main; me salto la invariante.")
        # Informativo, no un fallo: que una página esté en sitio/ y no se
        # publique puede ser deliberado (el taller 1 lo absorbió el preparcial).
        solo_local = sorted(set(locales) - set(lista))
        if solo_local:
            print(f"En sitio/ y sin publicar: {', '.join(solo_local)}")
    else:
        lista = locales
        print(f"Fuente: {base}")
        print(f"AVISO: no pude leer origin/{RAMA}; me salto la huella y uso la "
              f"lista de sitio/, que puede incluir páginas que no se publican.")

    if args.pagina:
        lista = [p for p in lista if any(f in p for f in args.pagina)]
        if not lista:
            raise SystemExit(f"ABORTA: ningún nombre de página casa con {args.pagina}.")

    malas, sin_huella = [], []
    for nombre in lista:
        print(f"\n{nombre}")
        if args.local:
            texto = (SITIO / nombre).read_text(encoding="utf-8")
        else:
            try:
                crudo = descarga(f"{base}/{nombre}")
            except urllib.error.HTTPError as e:
                print(f"    NO SE SIRVE: {e.code} {e.reason}")
                malas.append(nombre)
                continue
            texto = crudo.decode("utf-8")
            if rama:
                servido = hashlib.md5(crudo).hexdigest()
                esperado = rama.get(nombre)
                if esperado is None:
                    print("    huella: no está en la rama (¿página nueva sin publicar?)")
                    sin_huella.append(nombre)
                elif servido == esperado:
                    print(f"    huella: coincide con la rama ({servido[:8]}…)")
                else:
                    print(f"    huella: NO COINCIDE  servido {servido[:8]}… "
                          f"≠ rama {esperado[:8]}…")
                    sin_huella.append(nombre)

        if args.solo_huella:
            continue
        bloques = extrae(nombre, texto)
        if not bloques:
            print("    (sin bloques de código)")
            continue
        for lang in ("r", "python"):
            res = corre(bloques, lang, nombre)
            if res and not informa_ejecucion(res):
                malas.append(nombre)

    print("\n" + "=" * 60)
    if sin_huella:
        print(f"Huella distinta o ausente en {len(sin_huella)}: "
              f"{', '.join(sorted(set(sin_huella)))}")
        print("  (si acabas de publicar, puede ser el despliegue aún en curso)")
    if malas:
        print(f"NO ARRANCA en {len(set(malas))} de {len(lista)} páginas: "
              f"{', '.join(sorted(set(malas)))}")
        return 1
    if args.solo_huella:
        print(f"Huella comprobada en {plural(len(lista))}.")
    else:
        print(f"Arranca el código de {plural(len(lista))}.")
    if desajuste_arbol:
        print(f"Árbol de origin/{RAMA} distinto de origin/main:sitio.")
    return 0 if not (sin_huella or desajuste_arbol) else 1


if __name__ == "__main__":
    sys.exit(main())
