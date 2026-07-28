#!/usr/bin/env python3
"""Cuenta lo que hay de verdad en los capítulos publicados.

Los totales del `index.html` y del README se han escrito a mano en fases
anteriores y el proyecto ya sabe cómo acaba eso. Esta herramienta los cuenta
sobre los propios archivos: módulos, simuladores, tablas-ranking, preguntas de
autoevaluación, ejercicios guiados, bloques de código y componentes.

    python3 precalculo/cuenta_sitio.py
"""
import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SITIO = RAIZ / "sitio" / "muestreo"

CAMPOS = [
    ("módulos",      lambda h: h.count("<template id=\"module-")),
    ("simuladores",  lambda h: len(re.findall(r"\n    SIMULADORES\['", h))),
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
]


def main():
    caps = sorted(SITIO.glob("capitulo-*.html"))
    anchos = [10] + [len(n) for n, _ in CAMPOS] + [len(n) for n, _ in COMPONENTES]
    cab = ["capítulo"] + [n for n, _ in CAMPOS] + [n for n, _ in COMPONENTES]
    print("  ".join(c.rjust(a) for c, a in zip(cab, anchos)))
    totales = [0] * (len(CAMPOS) + len(COMPONENTES))
    for cap in caps:
        h = cap.read_text(encoding="utf-8")
        # Los componentes se cuentan solo DENTRO de los <template> de los
        # módulos: el comentario de documentación del motor de cada uno
        # escribe también `data-x="id"` y contarlo duplicaba el total.
        marcado = "".join(re.findall(r"<template id=\"module-.*?</template>", h, re.S))
        vals = [f(h) for _, f in CAMPOS] + [marcado.count(m) for _, m in COMPONENTES]
        totales = [t + v for t, v in zip(totales, vals)]
        etiqueta = re.match(r"capitulo-(\d+)", cap.name).group(1)
        print("  ".join(x.rjust(a) for x, a in
                        zip([f"cap. {etiqueta}"] + [str(v) for v in vals], anchos)))
    print("  ".join(x.rjust(a) for x, a in
                    zip(["TOTAL"] + [str(t) for t in totales], anchos)))
    print(f"\n{len(caps)} capítulos · "
          f"{sum(c.stat().st_size for c in caps) / 1024:.0f} KB publicados")


if __name__ == "__main__":
    main()
