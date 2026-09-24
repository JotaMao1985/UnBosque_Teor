#!/usr/bin/env python3
"""Cuenta lo que hay de verdad en los capítulos publicados.

Los totales del `index.html` y del README se han escrito a mano en fases
anteriores y el proyecto ya sabe cómo acaba eso. Esta herramienta los cuenta
sobre los propios archivos: módulos, simuladores, tablas-ranking, preguntas de
autoevaluación, ejercicios guiados, bloques de código y componentes.

    python3 precalculo/cuenta_sitio.py
"""
import argparse
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SITIO = RAIZ / "sitio" / "muestreo"

# El simulacro de un quiz (el módulo 15 del cap. 3) se engancha al registro SIMULADORES para que
# loadModule() lo arranque, pero no es un simulador: es un examen de práctica, sin gráfico ni
# deslizadores. No entra en la cuenta, y el README y la portada no lo suman a los simuladores.
CAMPOS = [
    ("módulos",      lambda h: h.count("<template id=\"module-")),
    ("simuladores",  lambda h: len(re.findall(r"\n    SIMULADORES\['(?![\w-]*-simulacro')", h))),
    ("t-ranking",    lambda h: len(re.findall(r"\n    TABLAS_RANKING\['", h))),
    ("preguntas",    lambda h: len(re.findall(r"\n        tipo: ", h))),
    ("ejercicios",   lambda h: h.count('class="ejercicio-guiado"')),
    ("bloques R",    lambda h: len(re.findall(r'class="language-r"', h))),
    ("bloques Py",   lambda h: len(re.findall(r'class="language-python"', h))),
    ("cifras #>",    lambda h: len(re.findall(r"#&gt;", h))),
]
COMPONENTES = [
    ("glosario",  'data-glosario="'),
    ("árbol",     'data-arbol="'),
    ("diagrama",  'data-diagrama="'),
    ("ciclo",     'data-ciclo="'),
    ("rúbrica",   'data-rubrica="'),
    # La lectura guiada no lleva `data-`: es <details> nativo y no tiene motor
    # al que declararle un id, así que se cuenta por su clase.
    ("lectura",   '<details class="lectura-guiada"'),
]


def etiqueta_de(nombre):
    """cap. 3 · taller 1 · el nombre a secas si aparece algo que no es ninguno."""
    m = re.match(r"capitulo-(\d+)", nombre)
    if m:
        return f"cap. {m.group(1)}"
    m = re.match(r"taller-(\d+)", nombre)
    if m:
        return f"taller {m.group(1)}"
    m = re.match(r"preparcial-corte-(\d+)", nombre)
    if m:
        return f"preparcial {m.group(1)}"
    return nombre[:10]


# ---------------------------------------------------------------------------
# Las cifras escritas a mano, contra el recuento
# ---------------------------------------------------------------------------
# Contar no basta si nadie compara. Las cifras viven en TRES sitios y cada uno
# se ha desfasado por su cuenta: la tabla del README, las tarjetas del index y
# -el que se escapo dos veces el mismo dia- las DOS metaetiquetas del index,
# que no se ven leyendo la pagina y por eso se publicaron con «67 simuladores»
# cuando el texto visible ya decia 70.
#
# El ambito importa: el README dice «Ocho capitulos», asi que sus totales NO
# incluyen el preparcial. Comparar contra el total general daria un falso
# positivo en cada linea, y un verificador que grita siempre acaba ignorado.
ESCRITOS = ["README.md", "index.html"]
# De que pagina habla una cifra lo dice el ELEMENTO que la contiene, no el
# enlace mas cercano. Se probo primero con «el ultimo enlace anterior» y dio dos
# falsos positivos a la primera: el «91 modulos · 70 simuladores» de la cabecera
# lleva encima un «Comenzar» que apunta al capitulo 1, asi que el global se leia
# como cifra del cap. 1. La regla buena es estructural:
#   - index.html: una cifra dentro de una tarjeta `<a class="chapter-card">`
#     es de esa pagina; cualquier otra es del curso entero.
#   - README.md: las cifras por capitulo viven SOLO en la tabla, fila a fila;
#     el resto de la prosa es global.
# Si algun dia alguien escribe «el capitulo 3 tiene 14 modulos» en la prosa del
# README, saltara como desajuste. Es un falso positivo ruidoso y localizable, no
# un fallo silencioso, que es el reparto que interesa.
PAGINA_RE = re.compile(r'(capitulo-\d+|taller-\d+|preparcial-corte-\d+)[-\w]*\.html')
TARJETA_RE = re.compile(r'<a class="chapter-card" href="([^"]+)"(.*?)</a>', re.S)
CIFRA_RE = re.compile(
    r'(\d+)\s+(módulos|simuladores|preguntas|ejercicios guiados'
    r'|bloques de código|de R\b|de Python\b)')
CAMPO_DE = {
    "módulos": "módulos", "simuladores": "simuladores", "preguntas": "preguntas",
    "ejercicios guiados": "ejercicios", "de R": "bloques R",
    "de Python": "bloques Py",
    # Este no es un campo del recuento: se suma de los dos.
    "bloques de código": ("bloques R", "bloques Py"),
}
# Las filas de la tabla del README no dicen «10 modulos»: dicen `| 10 | 7 |`.
FILA_RE = re.compile(
    r'^\|[^|\n]*\|[^\n]*?\((capitulo-\d+[-\w]*\.html)\)[^\n]*?'
    r'\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*$', re.M)
# Cifras que se escriben al lado de las otras y que este guion NO sabe calcular:
# salen de verifica_bloques.py. Se nombran en vez de callarlas, que es como se
# cuela una cifra a mano en medio de las comprobadas. No cuentan como fallo:
# un rojo permanente es tan inutil como no comprobar nada.
AJENA_RE = re.compile(r'(\d[\d  ]*\d|\d+)\s+cifras')


def valor(pagina, campo, cuentas):
    """Lo contado para una página, o para los ocho capítulos si no hay página."""
    campos = campo if isinstance(campo, tuple) else (campo,)
    if pagina is not None:
        if pagina not in cuentas:
            return None
        return sum(cuentas[pagina][c] for c in campos)
    return sum(v[c] for k, v in cuentas.items() if k.startswith("capitulo-")
               for c in campos)


def coteja(cuentas, sitio):
    """Compara cada cifra escrita a mano con la contada."""
    fallos, ajenas, mirados = [], [], 0
    for ruta in [sitio / n for n in ESCRITOS]:
        if not ruta.exists():
            continue
        texto = ruta.read_text(encoding="utf-8")
        casos = []
        for m in FILA_RE.finditer(texto):
            cap = PAGINA_RE.match(m.group(1)).group(1)
            casos += [(m.start(2), cap, "módulos", int(m.group(2))),
                      (m.start(3), cap, "simuladores", int(m.group(3)))]
        tarjetas = [(m.start(), m.end(), PAGINA_RE.match(m.group(1)).group(1))
                    for m in TARJETA_RE.finditer(texto)]
        for m in CIFRA_RE.finditer(texto):
            casos.append((m.start(),
                          next((pag for ini, fin, pag in tarjetas
                                if ini <= m.start() < fin), None),
                          m.group(2), int(m.group(1))))
        for pos, pagina, nombre, escrito in casos:
            contado = valor(pagina, CAMPO_DE[nombre], cuentas)
            if contado is None:
                continue          # cifra de una página que no se publica
            mirados += 1
            if contado != escrito:
                fallos.append((ruta.name, texto.count("\n", 0, pos) + 1,
                               pagina or "los 8 capítulos", nombre,
                               escrito, contado))
        ajenas += [(ruta.name, texto.count("\n", 0, m.start()) + 1, m.group(1))
                   for m in AJENA_RE.finditer(texto)]
    return mirados, fallos, ajenas


def main():
    # `--sitio` existe para poder probar el cotejo contra un estado PASADO del
    # README o del index: sin él, la única prueba posible es «hoy da 0», que no
    # demuestra que la comprobación funcione.
    ap = argparse.ArgumentParser()
    ap.add_argument("--sitio", default=str(SITIO),
                    help="carpeta a contar y cotejar (por defecto sitio/muestreo)")
    sitio = Path(ap.parse_args().sitio)
    # El recurso de práctica del Taller 1 no es un capítulo pero sí es una
    # página publicada con módulos, preguntas y bloques de código: si no se
    # contara, el total del README volvería a ser una cifra escrita a mano.
    caps = (sorted(sitio.glob("capitulo-*.html")) + sorted(sitio.glob("taller-*.html"))
            + sorted(sitio.glob("preparcial-*.html")))
    # Solo lo que de verdad se publica. Un archivo que sigue en disco pero esta
    # en el .gitignore -como el recurso del Taller 1, absorbido por el
    # preparcial y retirado como pagina propia- no llega a gh-pages, y contarlo
    # devolveria al README las cifras a mano que este guion existe para evitar.
    import subprocess
    ignorados = subprocess.run(["git", "check-ignore"] + [str(c) for c in caps],
                               capture_output=True, text=True).stdout.splitlines()
    # splitlines(), no split(): la ruta del proyecto lleva espacios («Trabajo
    # 2026»), y partir por espacios deja fragmentos que no casan con nada.
    caps = [c for c in caps if str(c) not in ignorados]
    anchos = [10] + [len(n) for n, _ in CAMPOS] + [len(n) for n, _ in COMPONENTES]
    cab = ["página"] + [n for n, _ in CAMPOS] + [n for n, _ in COMPONENTES]
    print("  ".join(c.rjust(a) for c, a in zip(cab, anchos)))
    totales = [0] * (len(CAMPOS) + len(COMPONENTES))
    cuentas = {}
    for cap in caps:
        h = cap.read_text(encoding="utf-8")
        # Los componentes se cuentan solo DENTRO de los <template> de los
        # módulos: el comentario de documentación del motor de cada uno
        # escribe también `data-x="id"` y contarlo duplicaba el total.
        marcado = "".join(re.findall(r"<template id=\"module-.*?</template>", h, re.S))
        vals = [f(h) for _, f in CAMPOS] + [marcado.count(m) for _, m in COMPONENTES]
        totales = [t + v for t, v in zip(totales, vals)]
        cuentas[PAGINA_RE.match(cap.name).group(1)] = dict(zip(
            [n for n, _ in CAMPOS] + [n for n, _ in COMPONENTES], vals))
        print("  ".join(x.rjust(a) for x, a in
                        zip([etiqueta_de(cap.name)] + [str(v) for v in vals], anchos)))
    print("  ".join(x.rjust(a) for x, a in
                    zip(["TOTAL"] + [str(t) for t in totales], anchos)))
    print(f"\n{len(caps)} páginas · "
          f"{sum(c.stat().st_size for c in caps) / 1024:.0f} KB publicados")

    mirados, fallos, ajenas = coteja(cuentas, sitio)
    print(f"\nCotejo: {mirados} cifras escritas a mano en {len(ESCRITOS)} archivos "
          f"· {len(fallos)} desajustada{'s' if len(fallos) != 1 else ''}")
    for archivo, linea, ambito, nombre, escrito, contado in fallos:
        print(f"    {archivo}:{linea}  {ambito} · {nombre}: "
              f"dice {escrito}, hay {contado}")
    for archivo, linea, cifra in ajenas:
        print(f"    (sin cotejar) {archivo}:{linea}  «{cifra} cifras»: sale de "
              f"verifica_bloques.py, este guion no la calcula")
    return 1 if fallos else 0


if __name__ == "__main__":
    sys.exit(main())
