#!/usr/bin/env python3
"""
indexa_web.py — qué secciones existen en una obra leída en la web, y en qué instantánea

Material de Muestreo Estadístico 2026-II (20939). Tarea 0.2 del plan del capítulo 1.

Un libro en línea no tiene páginas: tiene capítulos y secciones numeradas. Este guion lee las
instantáneas que guardó `extrae_fuente.py --web` (texto plano, una por página web, en
`bibliografia/_local/web/<clave>/`) y anota qué localizadores existen y en cuál están:

    cap. 1      el encabezado «Capítulo 1 …» o «1 Título»
    §1.4        un encabezado «1.4 Título»
    ejemplo 4.3.1   un renglón que empieza por «Ejemplo 4.3.1»

Un encabezado se reconoce por su forma —número, espacio y título en un renglón corto, después de
una línea en blanco y sin punto final—, no por su tipografía: en texto plano no la hay. El
índice de la barra lateral, que repite los títulos en cada página, va como lista y no cuenta.

Escribe el índice delgado en `bibliografia/indices/<clave>.json` (localizador → instantánea, y
la huella de cada instantánea) y el completo, con títulos, fuera de git. El auditor de citas
falla si una instantánea cambia después de indexarla.

Uso:  python3 precalculo/indexa_web.py CLAVE
"""
from __future__ import annotations

import argparse
import collections
import hashlib
import pathlib
import re
import sys

import _fuentes as F

EXTRACTOR = "indexa_web@1"
RE_SECCION = re.compile(r"^(\d+(?:\.\d+)+)\s{1,4}(\S.*)$")
RE_CAPITULO = re.compile(r"^(?:(?:Capítulo|Chapter)\s+(\d{1,2})\b\s*(.*)|(\d{1,2})\s{1,4}([A-ZÁÉÍÓÚÑ¿¡].*))$")
RE_EJEMPLO = re.compile(r"^(?:Ejemplo|Example)\s+(\d+(?:\.\d+)+)\b[.:]?\s*(.*)$")
LARGO_MAXIMO = 120


def es_encabezado(lineas: list[str], i: int) -> bool:
    """Un renglón corto, sin punto final y precedido de una línea en blanco."""
    linea = lineas[i].rstrip()
    return (len(linea) <= LARGO_MAXIMO and not linea.endswith((".", ",", ";", ":"))
            and (i == 0 or not lineas[i - 1].strip()))


def localizadores(texto: str) -> dict[str, str]:
    """{localizador: título} de una instantánea."""
    lineas = texto.splitlines()
    hallados: dict[str, str] = {}
    for i, linea in enumerate(lineas):
        if (m := RE_EJEMPLO.match(linea)):
            hallados.setdefault(f"ejemplo {m.group(1)}", m.group(2).strip()[:80])
            continue
        if not es_encabezado(lineas, i):
            continue
        if (m := RE_SECCION.match(linea)):
            hallados.setdefault(f"§{m.group(1)}", m.group(2).strip())
        elif (m := RE_CAPITULO.match(linea)):
            numero, titulo = (m.group(1), m.group(2)) if m.group(1) else (m.group(3), m.group(4))
            hallados.setdefault(f"cap. {int(numero)}", (titulo or "").strip())
    return hallados


def indexa(dir_bib: pathlib.Path, clave: str) -> tuple[dict, list[str]]:
    """Escribe los dos índices de una obra leída en la web. Devuelve (índice delgado, avisos)."""
    registradas = (F.lee_yaml(dir_bib / "instantaneas.yml").get(clave) or {})
    if not registradas:
        raise SystemExit(f"FALLA  «{clave}» no tiene instantáneas en instantaneas.yml: "
                         "corre extrae_fuente.py --web")
    loc, titulos, huellas, avisos = {}, {}, {}, []
    for nombre in sorted(registradas):
        ruta = dir_bib / "_local" / "web" / clave / f"{nombre}.txt"
        if not ruta.is_file():
            raise SystemExit(f"FALLA  falta el texto de la instantánea «{nombre}» en bibliografia/_local/web/{clave}/")
        crudo = ruta.read_bytes()
        huellas[nombre] = hashlib.sha256(crudo).hexdigest()
        if huellas[nombre] != registradas[nombre].get("sha256"):
            raise SystemExit(f"FALLA  la instantánea «{nombre}» guardada no es la registrada (sha256)")
        suyos = localizadores(crudo.decode("utf-8", "replace"))
        if not suyos:
            avisos.append(f"la instantánea «{nombre}» no deja ver ningún encabezado numerado")
        for localizador, titulo in suyos.items():
            if localizador in loc and loc[localizador] != nombre:
                avisos.append(f"«{localizador}» aparece en «{loc[localizador]}» y en «{nombre}»; se queda la primera")
                continue
            loc[localizador] = nombre
            titulos[localizador] = titulo
    malos = [k for k in loc if not F.RE_LOCALIZADOR.match(k)]
    if malos:
        raise SystemExit(f"FALLA  localizadores fuera del vocabulario de la norma: {malos[:5]}")
    base = {"clave": clave, "calidad": "web", "extractor": EXTRACTOR, "instantaneas": huellas,
            "paginas": None}
    F.escribe_json(dir_bib / "_local" / "indices" / f"{clave}.json",
                   {**base, "loc": {k: {"i": loc[k], "t": titulos[k]} for k in loc}})
    delgado = {**base, "loc": loc}
    F.escribe_json(dir_bib / "indices" / f"{clave}.json", delgado)
    return delgado, avisos


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    ap.add_argument("clave")
    args = ap.parse_args()
    delgado, avisos = indexa(F.BIB, args.clave)
    cuenta = collections.Counter("§" if k.startswith("§") else k.split(" ")[0] for k in delgado["loc"])
    print(f"OK     {args.clave} (web): {len(delgado['instantaneas'])} instantáneas; "
          + ", ".join(f"{n} {t}" for t, n in cuenta.items()))
    for a in avisos:
        print(f"AVISO  {a}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
