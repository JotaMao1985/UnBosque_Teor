#!/usr/bin/env python3
"""
genera_referencias.py — el texto de las citas y el pie de referencias, generados

Material de Muestreo Estadístico 2026-II (20939). Tarea GD-D4 de PLAN_Gestion_Documental.md.
Portado de Series de Tiempo (20948) y adaptado a cómo se ensambla este material.

Nadie escribe a mano «(Lohr, 2022, §1.1)» ni una entrada del pie: quien redacta deja en el
HTML solo la clave de la obra y el localizador, y este guion escribe el resto con pandoc
`--citeproc` y APA 7 en español (`bibliografia/apa-es.csl`) a partir de
`bibliografia/referencias.json`, que sale de Zotero.

Lo que escribe quien redacta, en un módulo de `ensamblado/modulos/capN/`:

    <cite class="cita" data-ref="lohr2022sampling" data-loc="§1.1; ejemplo 1.1"></cite>

  · `data-ref`   clave de la obra en referencias.json
  · `data-loc`   localizador, tal como debe leerse; vacío en una lectura recomendada
  · `data-via`   solo en una cita de segunda mano: la clave de la obra que SÍ se leyó, que es
                 la dueña del localizador y la que va al pie
  · `data-modo`  `parentesis` (por defecto) → (Lohr, 2022, §1.1)
                 `narrativa`               → Lohr (2022, §1.1)
                 `suelta`                  → Lohr, 2022, §1.1

    de segunda mano → (Basu, 1971, citado en Lohr, 2022, §6.7)

El pie de referencias es por capítulo y trae solo lo que el capítulo cita. Como el pie de la
plantilla es común a todas las páginas, se activa capítulo a capítulo:

    python3 precalculo/genera_referencias.py --pie cap1

escribe `ensamblado/modulos/cap1/pie_referencias.html`, y el ensamblador de ese capítulo lo
pone en lugar de la lista de la plantilla (`ensamblado/pie_referencias.py`). Desde entonces
cada cita enlaza con su entrada del pie. Mientras un capítulo no lo tenga, conserva el pie de
la plantilla y sus citas van sin enlace. **Solo tiene sentido activarlo cuando todo lo que el
capítulo cita está marcado y en el catálogo**: el pie generado no puede traer una obra sin ficha.

Es idempotente: volver a correrlo no cambia nada. `verifica_citas.py` (L7) se apoya en eso para
comprobar que la página publicada es exactamente la que este guion escribiría.

Uso:  python3 precalculo/genera_referencias.py              # todos los capítulos
      python3 precalculo/genera_referencias.py --comprobar  # no escribe; 1 si algo cambiaría
      python3 precalculo/genera_referencias.py --pie cap1   # además, activa el pie del capítulo

Trabaja sobre las FUENTES (`ensamblado/modulos/`), nunca sobre `sitio/`: después hay que
reensamblar el capítulo (`python3 ensamblado/ensambla_capN.py`).
"""
from __future__ import annotations

import argparse
import copy
import html
import json
import pathlib
import re
import subprocess
import sys
import tempfile

RAIZ = pathlib.Path(__file__).resolve().parent.parent
BIB = RAIZ / "bibliografia"
MODULOS = RAIZ / "ensamblado" / "modulos"
NOMBRE_PIE = "pie_referencias.html"

RE_CITA = re.compile(
    r'<cite\b(?P<atributos>[^>]*\bclass="[^"]*\bcita\b[^"]*"[^>]*)>(?P<dentro>.*?)</cite>', re.S)
RE_ATRIBUTO = re.compile(r'(data-[a-z]+)="([^"]*)"')
RE_PIE = re.compile(r"<!--PIE-REFERENCIAS:inicio-->.*?<!--PIE-REFERENCIAS:fin-->", re.S)
MODOS = ("parentesis", "narrativa", "suelta")
# La cursiva con que el navegador pinta `<cite>` la quita la regla `cite.cita` de la plantilla
# (ensamblado/retropropaga_cita_y_eje_y.py, 2026-11-13). Hasta entonces la traía cada cita.


class ErrorDeCita(Exception):
    pass


# --------------------------------------------------------------------------- #
# Biblioteca y pandoc
# --------------------------------------------------------------------------- #
def carga_biblioteca(dir_bib: pathlib.Path = BIB) -> tuple[dict[str, dict], dict[str, dict]]:
    referencias = json.loads((dir_bib / "referencias.json").read_text("utf-8"))
    candado = json.loads((dir_bib / "zotero.lock.json").read_text("utf-8")).get("obras", {})
    return {r["id"]: r for r in referencias}, candado


def para_pandoc(obras: list[dict]) -> list[dict]:
    """Copia de las obras con el rango de páginas en raya corta (3–73)."""
    salida = copy.deepcopy(obras)
    for o in salida:
        if isinstance(o.get("page"), str):
            o["page"] = re.sub(r"(?<=\d)\s*-+\s*(?=\d)", "–", o["page"])
    return salida


_CACHE: dict[str, tuple[dict, dict, dict]] = {}


def pandoc(biblioteca: dict[str, dict], claves: list[str], dir_bib: pathlib.Path = BIB
           ) -> tuple[dict, dict, dict]:
    """({clave: autores}, {clave: año}, {clave: entrada HTML}) de un conjunto de obras.

    Todas las claves van en UNA pasada para que la desambiguación de citeproc (1990a, 1990b)
    sea la misma en las citas y en el pie.
    """
    if not claves:
        return {}, {}, {}
    obras = para_pandoc([biblioteca[c] for c in claves])
    estilo = dir_bib / "apa-es.csl"
    sello = json.dumps(obras, ensure_ascii=False, sort_keys=True) + str(estilo)
    if sello in _CACHE:
        return _CACHE[sello]
    cuerpo = "\n\n".join(f"@{c}\n\n[-@{c}]" for c in claves)
    documento = f'---\nlang: es\nnocite: "@*"\n---\n\n{cuerpo}\n'
    with tempfile.TemporaryDirectory() as tmp:
        ruta_json = pathlib.Path(tmp) / "obras.json"
        ruta_json.write_text(json.dumps(obras, ensure_ascii=False), "utf-8")
        try:
            proceso = subprocess.run(
                ["pandoc", "-f", "markdown", "-t", "html", "--wrap=none", "--citeproc",
                 "--bibliography", str(ruta_json), "--csl", str(estilo)],
                input=documento, capture_output=True, text=True)
        except FileNotFoundError:
            raise ErrorDeCita("no encuentro pandoc: sin él no se pueden generar ni comprobar las citas")
    if proceso.returncode != 0:
        raise ErrorDeCita(f"pandoc falló: {proceso.stderr.strip()}")
    salida = proceso.stdout
    spans = re.findall(r'<span class="citation" data-cites="([^"]+)">(.*?)</span>', salida, re.S)
    autores, anios = {}, {}
    for clave, texto in spans:
        m = re.fullmatch(r"\((.*)\)", texto.strip(), re.S)
        if m:                                   # [-@clave] → «(2022)»
            anios[clave] = m.group(1)
        else:                                   # @clave → «Lohr (2022)»
            autores[clave] = re.sub(r"\s*\([^()]*\)\s*$", "", texto.strip())
    entradas = dict(re.findall(
        r'<div id="ref-([^"]+)" class="csl-entry"[^>]*>\s*(.*?)\s*</div>', salida, re.S))
    faltan = [c for c in claves if c not in autores or c not in anios or c not in entradas]
    if faltan:
        raise ErrorDeCita(f"pandoc no devolvió cita o entrada para: {', '.join(faltan)}")
    _CACHE[sello] = (autores, anios, entradas)
    return _CACHE[sello]


# --------------------------------------------------------------------------- #
# Citas
# --------------------------------------------------------------------------- #
def atributos_de(texto: str) -> dict[str, str]:
    return {k: html.unescape(v) for k, v in RE_ATRIBUTO.findall(texto)}


def citas_de(texto: str) -> list[dict[str, str]]:
    return [atributos_de(m.group("atributos")) for m in RE_CITA.finditer(texto)]


def claves_de(texto: str) -> list[str]:
    """Todas las claves que nombran las citas (obra citada y obra leída), sin repetir."""
    vistas: list[str] = []
    for a in citas_de(texto):
        for clave in (a.get("data-ref", ""), a.get("data-via", "")):
            if clave and clave not in vistas:
                vistas.append(clave)
    return vistas


def leidas_de(texto: str) -> list[str]:
    """Las obras que van al pie: las que se leyeron (la de `data-via`, si la cita es de segunda mano)."""
    vistas: list[str] = []
    for a in citas_de(texto):
        clave = a.get("data-via") or a.get("data-ref", "")
        if clave and clave not in vistas:
            vistas.append(clave)
    return vistas


def texto_cita(autores: dict, anios: dict, clave: str, via: str, loc: str, modo: str) -> str:
    cola = f", {html.escape(loc, quote=False)}" if loc else ""
    dentro = anios[clave] + (f", citado en {autores[via]}, {anios[via]}" if via else "") + cola
    if modo == "narrativa":
        return f"{autores[clave]} ({dentro})"
    if modo == "suelta":
        return f"{autores[clave]}, {dentro}"
    return f"({autores[clave]}, {dentro})"


def plano(entrada: str) -> str:
    return html.escape(html.unescape(re.sub(r"<[^>]+>", "", entrada)).strip(), quote=True)


def rellena_citas(texto: str, biblioteca: dict[str, dict], con_pie: bool,
                  dir_bib: pathlib.Path = BIB, claves: list[str] | None = None) -> str:
    """El HTML con el texto visible de cada cita regenerado.

    `claves` es el conjunto con el que se le pide a pandoc que desambigüe: el del capítulo
    entero cuando se trabaja archivo por archivo; por defecto, el del propio texto.
    """
    claves = claves if claves is not None else claves_de(texto)
    desconocidas = [c for c in claves_de(texto) if c not in biblioteca]
    if desconocidas:
        raise ErrorDeCita(f"claves que no están en referencias.json: {', '.join(desconocidas)}")
    autores, anios, entradas = pandoc(biblioteca, [c for c in claves if c in biblioteca], dir_bib)

    def cita(m: re.Match) -> str:
        a = atributos_de(m.group("atributos"))
        clave, via = a.get("data-ref", ""), a.get("data-via", "")
        if not clave:
            raise ErrorDeCita("hay una cita sin `data-ref`")
        modo = a.get("data-modo", "parentesis")
        if modo not in MODOS:
            raise ErrorDeCita(f"`data-modo` desconocido en la cita de {clave}: «{modo}»")
        visible = texto_cita(autores, anios, clave, via, a.get("data-loc", ""), modo)
        leida = via or clave
        titulo = plano(entradas[leida])
        dentro = (f'<a class="cita-enlace" href="#pie-{leida}" title="{titulo}">{visible}</a>'
                  if con_pie else f'<span title="{titulo}">{visible}</span>')
        return f'<cite{m.group("atributos")}>{dentro}</cite>'

    return RE_CITA.sub(cita, texto)


# --------------------------------------------------------------------------- #
# Pie
# --------------------------------------------------------------------------- #
def bloque_pie(leidas: list[str], biblioteca: dict[str, dict], candado: dict[str, dict],
               dir_bib: pathlib.Path = BIB, claves: list[str] | None = None) -> str:
    """El pie de un capítulo: de marcador a marcador, con la sangría de la plantilla."""
    desconocidas = [c for c in leidas if c not in biblioteca]
    if desconocidas:
        raise ErrorDeCita(f"claves que no están en referencias.json: {', '.join(desconocidas)}")
    _, _, entradas = pandoc(biblioteca, claves if claves is not None else leidas, dir_bib)
    orden = sorted(leidas, key=lambda c: plano(entradas[c]).lower())
    filas = []
    for c in orden:
        entrada = entradas[c].replace("<em>", '<em class="text-gold">')
        # Una URL larga no tiene espacios: sin `overflow-wrap:anywhere` no se parte y, en un móvil, empuja la
        # página hacia la derecha (pasó con la de Blumberg y Luke al publicar el pie del cap. 1, 2026-11-16).
        entrada = entrada.replace('<a href="', '<a class="underline text-gold" style="overflow-wrap:anywhere" '
                                               'target="_blank" rel="noopener" href="')
        if "rol: texto-guia" in ((candado.get(c) or {}).get("etiquetas") or []):
            entrada += " <strong>Texto guía del curso.</strong>"
        filas.append(
            f'        <li id="pie-{c}" class="flex items-start gap-2">\n'
            '          <i class="fas fa-bookmark text-secondary mt-1" aria-hidden="true"></i>\n'
            f'          <span class="min-w-0">{entrada}</span>\n'
            "        </li>\n")
    return ("<!--PIE-REFERENCIAS:inicio-->\n"
            '      <ul class="space-y-3 text-white/90 text-sm">\n'
            + "".join(filas) +
            "      </ul>\n"
            "      <!--PIE-REFERENCIAS:fin-->")


def regenera_pagina(texto: str, dir_bib: pathlib.Path = BIB) -> str:
    """La página tal como la dejaría este guion: lo usa `verifica_citas.py` para L7."""
    biblioteca, candado = carga_biblioteca(dir_bib)
    con_pie = bool(RE_PIE.search(texto))
    claves = claves_de(texto)
    nuevo = rellena_citas(texto, biblioteca, con_pie, dir_bib, claves)
    if con_pie:
        pie = bloque_pie(leidas_de(nuevo), biblioteca, candado, dir_bib, claves)
        nuevo = RE_PIE.sub(lambda m: pie, nuevo)
    return nuevo


# --------------------------------------------------------------------------- #
def capitulos(modulos: pathlib.Path = MODULOS) -> list[pathlib.Path]:
    return sorted(p for p in modulos.iterdir() if p.is_dir())


def genera_capitulo(carpeta: pathlib.Path, activar_pie: bool, comprobar: bool,
                    dir_bib: pathlib.Path = BIB) -> tuple[int, list[str]]:
    """(número de citas, archivos que cambian o cambiarían) de un capítulo."""
    biblioteca, candado = carga_biblioteca(dir_bib)
    ruta_pie = carpeta / NOMBRE_PIE
    con_pie = activar_pie or ruta_pie.exists()
    fuentes = sorted(p for p in carpeta.glob("*.html") if p.name != NOMBRE_PIE)
    textos = {p: p.read_text("utf-8") for p in fuentes}
    claves: list[str] = []
    for t in textos.values():
        claves += [c for c in claves_de(t) if c not in claves]
    cambian, nuevos = [], {}
    for p, t in textos.items():
        nuevos[p] = rellena_citas(t, biblioteca, con_pie, dir_bib, claves)
        if nuevos[p] != t:
            cambian.append(p.name)
    n = sum(len(citas_de(t)) for t in nuevos.values())
    if con_pie:
        leidas: list[str] = []
        for t in nuevos.values():
            leidas += [c for c in leidas_de(t) if c not in leidas]
        nuevos[ruta_pie] = "      " + bloque_pie(leidas, biblioteca, candado, dir_bib, claves) + "\n"
        if not ruta_pie.exists() or ruta_pie.read_text("utf-8") != nuevos[ruta_pie]:
            cambian.append(ruta_pie.name)
    if not comprobar:
        for p, t in nuevos.items():
            if p.name in cambian:
                p.write_text(t, "utf-8")
    return n, cambian


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    ap.add_argument("--comprobar", action="store_true",
                    help="no escribe; sale con 1 si algún archivo quedaría distinto")
    ap.add_argument("--pie", action="append", default=[], metavar="capN",
                    help="activa el pie generado de ese capítulo (crea su pie_referencias.html)")
    args = ap.parse_args()
    nombres = [c.name for c in capitulos()]
    for pedido in args.pie:
        if pedido not in nombres:
            ap.error(f"no hay ningún capítulo «{pedido}» en ensamblado/modulos/")
    falla, tocados = False, []
    for carpeta in capitulos():
        try:
            n, cambian = genera_capitulo(carpeta, carpeta.name in args.pie, args.comprobar)
        except ErrorDeCita as e:
            print(f"FALLA  {carpeta.name}: {e}")
            falla = True
            continue
        if not n and not cambian:
            continue
        if cambian and args.comprobar:
            print(f"FALLA  {carpeta.name}: {n} citas; quedarían distintos {', '.join(cambian)}")
            falla = True
        elif cambian:
            print(f"OK     {carpeta.name}: {n} citas; regenerado {', '.join(cambian)}")
            tocados.append(carpeta.name)
        else:
            print(f"OK     {carpeta.name}: {n} citas, sin cambios")
    if tocados:
        print("       Ahora reensambla: " + " · ".join(f"python3 ensamblado/ensambla_{c}.py" for c in tocados))
    if not falla and not tocados:
        print("OK     citas y pies: nada que regenerar")
    return 1 if falla else 0


if __name__ == "__main__":
    sys.exit(main())
