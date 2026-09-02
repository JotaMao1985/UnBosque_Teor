#!/usr/bin/env python3
"""¿Qué poblaciones de Lohr están gastadas y cuáles quedan libres?

Por qué existe: D7 del preparcial pide que los 22 ítems nuevos corran sobre una
población que el estudiante **no haya trabajado ya**. Sobre la población
conocida, reconocer sustituye a razonar, y además es la que cualquier asistente
de lenguaje ha visto mil veces. «No aparece en ningún capítulo» es una
afirmación comprobable, así que se comprueba en vez de recordarse.

Busca cada uno de los 82 nombres de `CSV data sets for SDA 3e/` en todo lo que
el estudiante puede leer —las páginas publicadas— y en todo lo que las produce
—los módulos y el código del ensamblado, y los guiones de precálculo—, con dos
patrones: el nombre como palabra suelta y el nombre con su `.csv`.

    python3 precalculo/verifica_poblacion_nueva.py            # el mapa entero
    python3 precalculo/verifica_poblacion_nueva.py --contexto otters
    python3 precalculo/verifica_poblacion_nueva.py --exige htcdf,otters

Con `--exige` devuelve 1 si alguno de los nombres pedidos aparece en cualquier
parte: es la forma de acceptación de P1.1.

CUIDADO CON LOS FALSOS POSITIVOS. Varios nombres son palabras corrientes en
inglés —`books`, `college`, `winter`, `classes`, `schools`— y el material está
en español pero cita funciones y variables en inglés. Por eso `--contexto`
imprime la línea de cada coincidencia: la decisión la toma quien la lee, no el
recuento.
"""
import argparse
import re
import sys
from collections import defaultdict
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
DATOS = RAIZ / "CSV data sets for SDA 3e"

# Tres capas, y no valen lo mismo. `sitio` es lo que el estudiante lee y
# `fuentes` es lo que lo produce —una población que ya está en el ensamblado va
# a aparecer publicada, así que cuenta como gastada—. `antiguo` es el material
# de semestres anteriores que vive en la raíz del repositorio: está en `main`,
# que es público, pero no en Pages y no es del curso en marcha. Ahí una mención
# es un AVISO para quien decide, no un veto: por eso se separa.
#
# Esta tercera capa se añadió el 2026-08-30 porque no estaba y un `grep` a mano
# encontró `baseball` en `Ejercicios_muestreo_CIII.Rmd`. El guion decía «0
# coincidencias» y era verdad dentro de su alcance, que es la peor clase de
# verdad: la que tranquiliza sin haber mirado.
CAPAS = {
    "sitio": [("sitio/muestreo", "*.html")],
    "fuentes": [("ensamblado", "**/*.html"), ("ensamblado", "**/*.js"),
                ("ensamblado", "**/*.py"), ("precalculo", "*.R"),
                ("precalculo", "pruebas/*.py")],
    "antiguo": [(".", "*.Rmd"), (".", "*.html"), (".", "*.ipynb")],
}


def documentos():
    """{documento: capa}, sin repetir."""
    docs = {}
    for capa, patrones_ in CAPAS.items():
        for carpeta, patron in patrones_:
            for d in sorted((RAIZ / carpeta).glob(patron)):
                if d.is_file():
                    docs.setdefault(d, capa)
    return docs


def patron(nombres):
    """Un solo patrón con los 82 nombres alternados.

    Con uno por nombre eran 82 barridos por línea sobre 60 MB de HTML antiguo y
    el guion dejaba de terminar. Con alternación es un barrido.

    `\\b` no basta como frontera: casaba dentro de `.fa-baseball-ball`, del CSS
    minificado de Font Awesome que pandoc incrusta en los HTML de la raíz, y
    cinco de las siete coincidencias de `baseball` eran esa única línea. Un
    nombre pegado a un punto o a un guion es parte de un identificador
    compuesto, no una cita del dataset. El sufijo `.csv` sigue casando: el punto
    va DESPUÉS del nombre, y ahí sí se admite.
    """
    alt = "|".join(sorted((re.escape(n) for n in nombres), key=len, reverse=True))
    return re.compile(rf"(?<![\w.-])({alt})(?![\w-])", re.I)


def escanea(nombres, docs):
    """Devuelve {nombre: {documento: [(nº de línea, línea)]}}."""
    rx = patron(nombres)
    hallazgos = defaultdict(lambda: defaultdict(list))
    for doc in docs:
        try:
            lineas = doc.read_text(encoding="utf-8", errors="replace").splitlines()
        except OSError:
            continue
        for n, linea in enumerate(lineas, 1):
            for m in rx.finditer(linea):
                hallazgos[m.group(1).lower()][doc].append((n, linea.strip()[:150]))
    return hallazgos


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--contexto", help="imprime dónde aparece cada nombre de esta lista")
    ap.add_argument("--exige", help="falla si alguno de estos nombres aparece en algún sitio")
    args = ap.parse_args()

    if not DATOS.is_dir():
        print(f"FALLO · no está {DATOS}", file=sys.stderr)
        return 1
    nombres = sorted(p.stem for p in DATOS.glob("*.csv"))
    docs = documentos()
    hallazgos = escanea(nombres, docs)
    capa = docs

    if args.contexto:
        for nombre in args.contexto.split(","):
            nombre = nombre.strip()
            print(f"\n=== {nombre} ===")
            if nombre not in hallazgos:
                print("  sin coincidencias")
            for doc, ls in hallazgos[nombre].items():
                for n, linea in ls[:6]:
                    print(f"  [{capa[doc]}] {doc.relative_to(RAIZ)}:{n}  {linea}")
        return 0

    if args.exige:
        pedidos = [n.strip() for n in args.exige.split(",")]
        malos = {n: hallazgos[n] for n in pedidos if n in hallazgos}
        for n in pedidos:
            if n not in nombres:
                print(f"FALLO · {n} no es un dataset de Lohr", file=sys.stderr)
                return 1
        veto, avisos = {}, {}
        for n, dd in malos.items():
            duros = {d: l for d, l in dd.items() if capa[d] != "antiguo"}
            viejos = {d: l for d, l in dd.items() if capa[d] == "antiguo"}
            if duros:
                veto[n] = duros
            if viejos:
                avisos[n] = viejos
        for n, dd in avisos.items():
            sitios = ", ".join(f"{d.name}×{len(l)}" for d, l in dd.items())
            print(f"AVISO · {n} se menciona en material antiguo de la raíz: {sitios} "
                  f"(no está en Pages; decide quien lee)")
        if veto:
            for n, dd in veto.items():
                sitios = ", ".join(f"{d.name}×{len(l)}" for d, l in dd.items())
                print(f"FALLO · {n} ya aparece en: {sitios}", file=sys.stderr)
            return 1
        cuenta = {c: sum(1 for v in capa.values() if v == c) for c in CAPAS}
        print(f"{len(pedidos)} población(es) sin gastar: {', '.join(pedidos)} · "
              f"0 coincidencias en sitio ({cuenta['sitio']}) y fuentes ({cuenta['fuentes']}) · "
              f"revisados también {cuenta['antiguo']} documentos de material antiguo")
        return 0

    gastadas = {n: v for n, v in hallazgos.items()}
    libres = [n for n in nombres if n not in gastadas]
    print(f"{len(docs)} documentos revisados · {len(nombres)} datasets de Lohr\n")
    print(f"GASTADAS ({len(gastadas)}):")
    for n in sorted(gastadas, key=lambda x: -sum(len(l) for l in gastadas[x].values())):
        total = sum(len(l) for l in gastadas[n].values())
        print(f"  {n:<16} {total:>4} menciones en {len(gastadas[n])} documentos")
    print(f"\nLIBRES ({len(libres)}):")
    for i in range(0, len(libres), 6):
        print("  " + "  ".join(f"{n:<15}" for n in libres[i:i + 6]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
