#!/usr/bin/env python3
"""Mide si cada módulo ANCLA antes de FORMALIZAR.

Nació de la revisión del Checkpoint 1 (2026-07-28), cuando Javier señaló que el
material «a ratos es muy abstracto». La primera versión de esta medida solo
contaba código y simuladores como anclaje, y por eso no veía las mejoras hechas
con prosa: un párrafo que resuelve un caso con números concretos ancla tanto
como un bloque de R.

Anclaje = lo primero de: un bloque de código, un simulador, una tabla, una caja
.diagram, o un PÁRRAFO QUE CONTIENE CIFRAS CONCRETAS (no meros números de
capítulo o de módulo).
Formalización = lo primero de: una fórmula de bloque, una caja .definition o
una caja .formula.

Un módulo está bien si ancla antes de formalizar, o casi a la vez.
"""
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
# Una cifra "concreta": decimal, miles con espacio fino, o entero de 3+ dígitos.
CIFRA = re.compile(r'(?<![\w.,$])(\d{1,3}(?:[   ]\d{3})+(?:,\d+)?|\d+[,.]\d+|\d{3,})(?![\w])')


def posiciones(cuerpo):
    L = len(cuerpo)
    formal, ancla = [], []
    for pat in (r'\$\$', r'class="definition"', r'class="formula"'):
        formal += [m.start() for m in re.finditer(pat, cuerpo)]
    for pat in (r'class="language-', r'class="simulador"', r'class="code-tabs"',
                r'<table>', r'class="diagram"'):
        ancla += [m.start() for m in re.finditer(pat, cuerpo)]
    # párrafos con cifras concretas
    for m in re.finditer(r'<p\b[^>]*>(.*?)</p>', cuerpo, re.S):
        texto = re.sub(r'<[^>]+>', ' ', m.group(1))
        if CIFRA.search(texto):
            ancla.append(m.start())
    return (min(formal) / L if formal else None,
            min(ancla) / L if ancla else None)


def mide(ruta):
    h = ruta.read_text(encoding="utf-8")
    filas, mal = [], 0
    for m in re.finditer(r'<template id="module-(\d+)">(.*?)</template>', h, re.S):
        num, cuerpo = int(m.group(1)), m.group(2)
        f, a = posiciones(cuerpo)
        if f is None:
            continue
        t = re.search(r'<h2[^>]*>(.*?)<span', cuerpo, re.S)
        t = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', t.group(1))).strip()[:32] if t else '?'
        ok = a is not None and a < f + 0.10
        if not ok:
            mal += 1
        filas.append((num, t, f, a, ok))
    return filas, mal


def main():
    rutas = ([Path(x) for x in sys.argv[1:]] or
             sorted((RAIZ / "sitio" / "muestreo").glob("capitulo-*.html")))
    total_mal = 0
    for p in rutas:
        filas, mal = mide(p)
        total_mal += mal
        print(f"\n{p.name}  —  {mal} módulo(s) abren formalizando")
        for num, t, f, a, ok in filas:
            if not ok:
                print("   m%-2d %-32s formaliza en %.0f %%, ancla en %s" %
                      (num, t, 100 * f, ("%.0f %%" % (100 * a)) if a else "nunca"))
    print(f"\n=== {total_mal} módulos abren formalizando antes de anclar ===")
    return 1 if total_mal else 0


if __name__ == "__main__":
    sys.exit(main())
