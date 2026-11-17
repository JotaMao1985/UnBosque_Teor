#!/usr/bin/env python3
"""
inventario_citas.py — qué obras nombra hoy el material, y dónde (solo lee)

Material de Muestreo Estadístico 2026-II (20939). Tarea GD-B1 de PLAN_Gestion_Documental.md.

Antes de montar el catálogo en Zotero hay que saber qué obras cita el material tal como está
publicado. Este guion NO juzga si una cita es correcta: solo cuenta. Recorre

  · sitio/**/*.html           cuatro zonas por página: `bloque` (los <div class="references">
                              «Para ampliar»), `pie` (el <footer>), `js` (los <script>: glosarios,
                              bancos, simuladores) y `prosa` (todo lo demás)
  · diapositivas/fuentes/*.md zona `diapositivas`
  · precalculo/genera_*.R     zona `guiones` (las cabeceras PROCEDENCIA) y cifras_prosa.json

y atribuye cada mención a una obra con la tabla OBRAS de abajo. La etiqueta de esa tabla es
PROVISIONAL: la clave de cita definitiva la asigna `exporta_zotero.py` a partir de los metadatos
de Zotero, nunca este guion ni la memoria de nadie. Por eso las obras que el material nombra sin
año van aquí sin año.

De cada <li> de un bloque guarda además el módulo, las ediciones que declara y los localizadores
tal como están escritos. Lo que no sabe atribuir lo dice: un <li> sin obra, o un «Autor (año)»
que ninguna fila de OBRAS reconoce, hacen que salga con 1.

Uso:  python3 precalculo/inventario_citas.py              # escribe bibliografia/inventario_citas.json
      python3 precalculo/inventario_citas.py --comprobar  # no escribe; 1 si el archivo quedó viejo
"""
from __future__ import annotations

import argparse
import html
import json
import pathlib
import re
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
SITIO = RAIZ / "sitio"
SALIDA = RAIZ / "bibliografia" / "inventario_citas.json"

# (etiqueta provisional, clase, cómo la nombra el material, patrón). El orden importa: lo
# específico va antes que lo general. `clase`: obra · software · datos · heredado.
OBRAS = [
    ("deville-sarndal-1992", "obra", "Deville y Särndal (1992), estimadores de calibración",
     r"Deville,? (?:J\.-C\. )?y Särndal"),
    ("deville-tille-1998", "obra", "Deville y Tillé (1998)", r"Deville y Tillé"),
    ("sarndal-1992", "obra", "Särndal, Swensson y Wretman (1992), Model Assisted Survey Sampling",
     r"Särndal(?:, C\.-?E\.)?,? (?:Swensson|et al)|Model Assisted"),
    ("lohr", "obra", "Lohr, Sampling: Design and Analysis (la edición va aparte)", r"\bLohr\b"),
    ("teachingsampling", "software", "Gutiérrez, paquete TeachingSampling", r"TeachingSampling|Gutiérrez \(2020"),
    # «Gutiérrez (2020)» es como la cita el texto generado desde el catálogo (cap. 1, 2026-11-16).
    ("gutierrez-estrategias", "obra", "Gutiérrez, Estrategias de muestreo (sin año en el material)",
     r"Estrategias de [Mm]uestreo|Gutiérrez(?!,? H\.A\. TeachingSampling| \(2020)"),
    ("portela-villeta", "obra", "Portela y Villeta, Técnicas básicas de muestreo con SAS", r"\bPortela\b"),
    ("lumley-complex", "obra", "Lumley, Complex Surveys", r"Complex Surveys"),
    ("lumley-survey", "software", "Lumley, paquete survey", r"Lumley(?!(?:,| —)? (?:T\.? )?Complex)"),
    ("cochran-1977", "obra", "Cochran (1977), Sampling Techniques", r"\bCochran\b"),
    ("kish-1965", "obra", "Kish (1965), Survey Sampling", r"\bKish\b"),
    ("groves-2006", "obra", "Groves (2006)", r"Groves \(2006\)"),
    ("groves-et-al", "obra", "Groves et al. (sin año en el material)", r"Groves et al"),
    ("heck-2018", "obra", "Heck, Simons y Chabris (2018), PLOS ONE", r"\bHeck\b"),
    ("meng-2018", "obra", "Meng (2018), Annals of Applied Statistics", r"\bMeng\b"),
    ("little-rubin", "obra", "Little y Rubin (sin año en el material)", r"Little y Rubin"),
    ("rubin-1987", "obra", "Rubin (1987)", r"Rubin \(1987\)"),
    ("rubin-1976", "obra", "Rubin (1976)", r"Rubin \(1976\)"),
    ("dalenius-hodges-1959", "obra", "Dalenius y Hodges (1959)", r"\bDalenius\b"),
    ("holt-smith-1979", "obra", "Holt y Smith (1979)", r"Holt y Smith"),
    ("kohavi-1995", "obra", "Kohavi (1995)", r"\bKohavi\b"),
    ("neyman-1934", "obra", "Neyman (1934)", r"Neyman \(1934\)"),
    ("hansen-hurwitz-1946", "obra", "Hansen y Hurwitz (1946)", r"Hansen y Hurwitz \(1946\)"),
    ("kim-wang-2019", "obra", "Kim y Wang (2019)", r"Kim y Wang"),
    ("schouten-2009", "obra", "Schouten, Cobben y Bethlehem (2009)", r"\bSchouten\b"),
    ("zhang-2020", "obra", "Zhang et al. (2020)", r"Zhang et al"),
    ("rao-wu-1988", "obra", "Rao y Wu (1988)", r"Rao y Wu"),
    ("gelman-hill", "obra", "Gelman y Hill (sin año en el material)", r"Gelman y Hill"),
    ("owen", "obra", "Owen (sin año en el material)", r"\bOwen\b"),
    ("settles", "obra", "Settles (sin año en el material)", r"\bSettles\b"),
    ("aapor", "obra", "AAPOR, Standard Definitions (sin edición en el material)", r"\bAAPOR\b"),
    ("basu-1971", "obra", "Basu (1971)", r"\bBasu\b"),
    ("beygelzimer-2009", "obra", "Beygelzimer, Dasgupta y Langford (2009)", r"\bBeygelzimer\b"),
    ("schaul-2016", "obra", "Schaul, Quan, Antonoglou y Silver (2016)", r"\bSchaul\b"),
    ("arnold-1991", "obra", "Arnold (1991)", r"Arnold \(1991\)"),
    ("gnap-1995", "obra", "Gnap (1995)", r"\bGnap\b"),
    ("hajek-1960", "obra", "Hájek (1960)", r"Hájek \(1960\)"),
    ("lahiri-1951", "obra", "Lahiri (1951)", r"Lahiri \(1951\)"),
    ("yates-grundy-1953", "obra", "Yates y Grundy (1953)", r"Yates y Grundy \(1953\)"),
    ("siniff-skoog-1964", "obra", "Siniff y Skoog (1964)", r"\bSiniff\b"),
    ("hite-1987", "obra", "Hite (1987), Women and Love", r"\bHite\b"),
    ("literary-digest-1936", "obra", "Literary Digest, números de 1936",
     r"Literary Digest 122|Digest \(1936\)"),
    ("blumberg-luke-2010", "obra", "Blumberg y Luke (2010)", r"\bBlumberg\b"),
    ("scikit-learn-guia", "software", "scikit-learn, User Guide", r"scikit-learn,? User Guide"),
    ("rsample", "software", "paquete rsample", r"\brsample\b"),
    ("mice", "software", "paquete mice", r"\bmice\b"),
    ("sdaresources", "datos", "paquete SDAResources (datos de Lohr)", r"\bSDAResources\b"),
    ("nhanes", "datos", "NHANES", r"\bNHANES\b"),
    ("censo-agricola-1992", "datos", "Censo Agrícola de EE. UU. de 1992",
     r"[Cc]enso [Aa]grícola|Census of Agriculture"),
    ("guerrero-1993", "heredado", "Guerrero (1993): código heredado del motor de Series de Tiempo",
     r"Guerrero \(1993\)"),
]
PATRONES = [(e, c, d, re.compile(p)) for e, c, d, p in OBRAS]

# Un <li> de bloque que remite al propio material no cita ninguna obra.
INTERNA = re.compile(r"^(Este material|Capítulo \d+(?:,| de este material)|El módulo \d+|El diagrama )")

EDICION = re.compile(r"(\d)\.ª ed")
LOHR_ANIO = re.compile(r"Lohr(?:, S\.L\.)? \((1999|2010|2021|2022)\)")
ANIO_A_EDICION = {"1999": "1", "2010": "2", "2021": "3", "2022": "3"}

LOCALIZADOR = re.compile(
    r"§ ?\d[\d.]*|secci(?:ón|ones) \d[\d.]*(?: [ya] \d[\d.]*)*|cap(?:ítulos?|s?\.) \d+(?: [ya] \d+)*"
    r"|[Ee]j(?:emplos?|ercicios?|s?\.) \d[\d.]*|ec(?:uaci(?:ón|ones)|s?\.) \(?\d[\d.]*\)?"
    r"|[Tt]ablas? \d[\d.]*|pp?\. ?\d+(?:[–-]\d+)?|Resultado \d[\d.]*|apéndice [A-Z]?"
)

AUTOR_ANIO = re.compile(
    r"((?:[A-ZÁÉÍÓÚÑ][\w\-’'áéíóúñüäö]+(?:,? (?:y|and|&|et al\.?) ?)?(?:, )?){1,4}) ?"
    r"\(((?:1[89]|20)\d\d)[a-z]?\)"
)

RE_SCRIPT = re.compile(r"<script\b[^>]*>(.*?)</script>", re.S)
RE_PIE = re.compile(r"<footer\b[^>]*>(.*?)</footer>", re.S)
RE_BLOQUE = re.compile(r'<div class="references">(.*?)</div>', re.S)
RE_LI = re.compile(r"<li\b[^>]*>(.*?)</li>", re.S)
RE_MODULO = re.compile(r'<template id="module-(\d+)">')


def plano(trozo: str) -> str:
    """HTML o texto → texto corrido, sin etiquetas ni entidades."""
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html.unescape(trozo))).strip()


def obras_en(texto: str) -> dict[str, int]:
    return {e: n for e, _, _, p in PATRONES if (n := len(p.findall(texto)))}


def sin_reconocer(texto: str) -> list[str]:
    """Los «Autor (año)» que ninguna fila de OBRAS explica, mirando 60 caracteres atrás."""
    sueltos = []
    for m in AUTOR_ANIO.finditer(texto):
        ventana = texto[max(0, m.start() - 60):m.end()]
        if not any(p.search(ventana) for _, _, _, p in PATRONES):
            sueltos.append(re.sub(r"\s+", " ", m.group(0)))
    return sueltos


def ediciones_de(texto: str) -> list[str]:
    eds = set(EDICION.findall(texto)) | {ANIO_A_EDICION[a] for a in LOHR_ANIO.findall(texto)}
    return sorted(eds)


def pagina(ruta: pathlib.Path) -> dict:
    crudo = ruta.read_text("utf-8")
    modulos = [(m.start(), int(m.group(1))) for m in RE_MODULO.finditer(crudo)]

    def modulo_de(pos: int):
        previos = [n for inicio, n in modulos if inicio <= pos]
        return previos[-1] if previos else None

    entradas = []
    for bloque in RE_BLOQUE.finditer(crudo):
        for li in RE_LI.finditer(bloque.group(1)):
            texto = plano(li.group(1))
            obras = sorted(obras_en(texto))
            entradas.append({
                "modulo": modulo_de(bloque.start()),
                "texto": texto,
                "obras": obras,
                "interna": bool(INTERNA.match(texto)) and not obras,
                "ediciones": ediciones_de(texto) if "lohr" in obras else [],
                "localizadores": LOCALIZADOR.findall(texto),
            })

    zonas, resto = {}, crudo
    for nombre, patron in (("js", RE_SCRIPT), ("pie", RE_PIE), ("bloque", RE_BLOQUE)):
        zonas[nombre] = plano(" ".join(patron.findall(resto)))
        resto = patron.sub(" ", resto)
    zonas["prosa"] = plano(resto)

    menciones: dict[str, dict[str, int]] = {}
    for zona, texto in zonas.items():
        for etiqueta, n in obras_en(texto).items():
            menciones.setdefault(etiqueta, {})[zona] = n
    sueltos = sorted({s for texto in zonas.values() for s in sin_reconocer(texto)})
    return {"li": len(entradas), "entradas": entradas, "menciones": menciones, "sin_reconocer": sueltos}


def archivo_plano(ruta: pathlib.Path) -> dict:
    texto = plano(ruta.read_text("utf-8", "replace"))
    return {"menciones": obras_en(texto), "sin_reconocer": sorted(set(sin_reconocer(texto)))}


def construye() -> dict:
    paginas = sorted(SITIO.glob("*.html")) + sorted((SITIO / "muestreo").glob("*.html"))
    diapositivas = sorted((SITIO / "muestreo" / "diapositivas" / "fuentes").glob("*.md"))
    guiones = sorted((RAIZ / "precalculo").glob("genera_*.R")) + [RAIZ / "precalculo" / "cifras_prosa.json"]
    return {
        "_leeme": "Lo escribe precalculo/inventario_citas.py. No se edita a mano. Las etiquetas de "
                  "obra son provisionales: la clave de cita la asigna exporta_zotero.py.",
        "obras": {e: {"clase": c, "como_la_nombra_el_material": d} for e, c, d, _ in OBRAS},
        "paginas": {str(r.relative_to(SITIO)): pagina(r) for r in paginas},
        "diapositivas": {r.name: archivo_plano(r) for r in diapositivas},
        "guiones": {r.name: archivo_plano(r) for r in guiones},
    }


def resumen(inv: dict) -> int:
    """Imprime el cuadro por obra y devuelve cuántas cosas quedaron sin atribuir."""
    total: dict[str, dict[str, int]] = {e: {} for e in inv["obras"]}
    donde: dict[str, set[str]] = {e: set() for e in inv["obras"]}
    huerfanos, sueltos = [], []
    for nombre, p in inv["paginas"].items():
        corto = re.sub(r"^muestreo/|\.html$", "", nombre)
        corto = re.sub(r"^capitulo-(\d).*", r"c\1", corto)
        for etiqueta, zonas in p["menciones"].items():
            for zona, n in zonas.items():
                total[etiqueta][zona] = total[etiqueta].get(zona, 0) + n
            donde[etiqueta].add(corto)
        huerfanos += [(corto, e["modulo"], e["texto"]) for e in p["entradas"]
                      if not e["obras"] and not e["interna"]]
        sueltos += [(corto, s) for s in p["sin_reconocer"]]
    for grupo in ("diapositivas", "guiones"):
        for nombre, a in inv[grupo].items():
            for etiqueta, n in a["menciones"].items():
                total[etiqueta][grupo] = total[etiqueta].get(grupo, 0) + n
            sueltos += [(nombre, s) for s in a["sin_reconocer"]]

    zonas = ("bloque", "prosa", "js", "pie", "diapositivas", "guiones")
    print(f"{'obra':<24}{'clase':<10}" + "".join(f"{z[:6]:>7}" for z in zonas) + "  páginas")
    for etiqueta, meta in inv["obras"].items():
        if not total[etiqueta]:
            continue
        fila = "".join(f"{total[etiqueta].get(z, 0) or '·':>7}" for z in zonas)
        print(f"{etiqueta:<24}{meta['clase']:<10}{fila}  {' '.join(sorted(donde[etiqueta]))}")

    lis = {n: p["li"] for n, p in inv["paginas"].items() if p["li"]}
    internas = sum(e["interna"] for p in inv["paginas"].values() for e in p["entradas"])
    print(f"\n<li> en bloques «Para ampliar»: {sum(lis.values())} "
          f"({' / '.join(str(v) for v in lis.values())}); {internas} remiten al propio material")
    for corto, modulo, texto in huerfanos:
        print(f"FALLA  {corto} M{modulo}: <li> sin obra reconocida: {texto[:90]}")
    for origen, s in sorted(set(sueltos)):
        print(f"FALLA  {origen}: «{s}» no corresponde a ninguna fila de OBRAS")
    return len(huerfanos) + len(set(sueltos))


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    ap.add_argument("--comprobar", action="store_true",
                    help="no escribe; sale con 1 si el inventario del repo quedó viejo")
    args = ap.parse_args()

    inv = construye()
    texto = json.dumps(inv, ensure_ascii=False, indent=1, sort_keys=True) + "\n"
    pendientes = resumen(inv)

    if args.comprobar:
        al_dia = SALIDA.exists() and SALIDA.read_text("utf-8") == texto
        print("OK     el inventario del repo está al día" if al_dia
              else "FALLA  bibliografia/inventario_citas.json no coincide con el sitio")
        return 0 if al_dia and not pendientes else 1

    SALIDA.parent.mkdir(exist_ok=True)
    SALIDA.write_text(texto, "utf-8")
    print(f"{'OK    ' if not pendientes else 'AVISO '} escrito {SALIDA.relative_to(RAIZ)}"
          + (f"; {pendientes} sin atribuir" if pendientes else ""))
    return 1 if pendientes else 0


if __name__ == "__main__":
    sys.exit(main())
