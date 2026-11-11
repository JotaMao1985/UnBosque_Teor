#!/usr/bin/env python3
"""
indexa_epub.py — qué localizadores existen en un EPUB estructurado, y en qué página impresa

Material de Muestreo Estadístico 2026-II (20939). Tarea GD-C2.

Una cita dice «Lohr (2022), §3.4; ejemplo 3.2». Para que un guion pueda decir si esa sección y
ese ejemplo EXISTEN en la edición citada, este guion recorre el EPUB en el orden de su lomo y
anota dónde empieza y dónde acaba cada cosa, en páginas de la edición impresa (el EPUB las trae
como <span epub:type="pagebreak" id="pN">):

  cap. N          <h1 class="chapheader" id="chapterN">        hasta el final del documento
  §N.M, §N.M.K    <h2 class="head1">, <h3 class="head2">…      el número sale del TEXTO del
                                                               encabezado, no del id (no es fiable)
  ejemplo N.M     <aside id="exampleN_M"> o "example_N_M"
  ejercicio N.M   los <li> directos de cada <ol class="order"> que cuelga de la sección
                  «Exercises»; el número es `start` + posición
  ec. N.M         <p class="equation"> cuyo texto acaba en el rótulo «(N.M)»
  tabla N.M       <table id="tN_M">          fig. N.M     <figure id="fN_M">

Escribe tres cosas (ver _fuentes.py): el texto por página impresa y el índice completo, fuera de
git; y el índice delgado —localizadores y páginas, sin títulos ni texto— en
bibliografia/indices/<clave>.json, que es lo que lee el auditor de citas.

Las fórmulas van en MathML sin texto alternativo: el texto extraído las pierde. Por eso una
ecuación se localiza por su rótulo y no se contrasta por su contenido.

Uso:  python3 precalculo/indexa_epub.py CLAVE [--sonda "LOCALIZADOR=palabra" …]

Una sonda comprueba que la palabra aparezca en las páginas de ese localizador: es la manera de
saber que la numeración no se corrió (p. ej. "ejercicio 15.13=Heck").
"""
from __future__ import annotations

import argparse
import posixpath
import re
import sys
import zipfile
from html.parser import HTMLParser

from _fuentes import (CABECERA_EJEMPLARES, EJEMPLARES, escribe_yaml, guarda_indice, guarda_paginas,
                      lee_yaml, orden_de_pagina, ruta_del_ejemplar, sha256)

EXTRACTOR = "indexa_epub@2"
NIVEL = {"h2": 1, "h3": 2, "h4": 3, "h5": 4}
BLOQUES = {"p", "li", "tr", "h1", "h2", "h3", "h4", "h5", "aside", "figcaption", "caption", "div"}
RE_NUMERO = re.compile(r"^\s*((?:\d+|[A-Z])(?:\.\d+)+)\b")
RE_ROTULO_EC = re.compile(r"\(((?:\d+|[A-Z])\.\d+)\)\s*$")
RE_EJEMPLO = re.compile(r"^example_?(\d+|[A-Z])_(\d+)$")
RE_TABLA = re.compile(r"^t(\d+|[A-Z])_(\d+)$")
RE_FIGURA = re.compile(r"^f(\d+|[A-Z])_(\d+)$")
RE_PAGINA = re.compile(r"^p(\d+|[ivxlcdm]+)$")


class Lector(HTMLParser):
    """Una pasada por todos los documentos del lomo, en orden."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.pagina = "0"                 # etiqueta de la página impresa en curso
        self.ultima_con_texto = "0"
        self.paginas: dict[str, list[str]] = {}
        self.loc: dict[str, dict] = {}
        self.repetidos: list[str] = []
        self.capitulo: str | None = None
        self.secciones: list[tuple[int, str]] = []    # (nivel, localizador) abiertas
        self.en_ejercicios = False
        self.pila: list[tuple[str, str | None]] = []  # (etiqueta, localizador que cierra o None)
        self.listas: list[dict] = []                  # <ol>/<ul> abiertas
        self.titulo: list[str] | None = None          # texto del encabezado en curso
        self.nivel_titulo = 0
        self.ecuacion: list[str] | None = None
        self.esperan_inicio: list[str] = []

    # --- localizadores -------------------------------------------------------------------
    def abre(self, clave: str, titulo: str | None = None) -> None:
        if clave in self.loc:
            self.repetidos.append(clave)
            return
        self.loc[clave] = {"p": [None, None]}
        if titulo:
            self.loc[clave]["t"] = titulo
        self.esperan_inicio.append(clave)

    def cierra(self, clave: str | None) -> None:
        if not clave or clave not in self.loc or self.loc[clave]["p"][1] is not None:
            return
        p = self.loc[clave]["p"]
        if p[0] is None:                       # no llegó a tener texto (una figura, p. ej.)
            p[0] = self.pagina
            if clave in self.esperan_inicio:
                self.esperan_inicio.remove(clave)
        p[1] = max(p[0], self.ultima_con_texto, key=orden_de_pagina)

    def cierra_secciones(self, desde_nivel: int) -> None:
        while self.secciones and self.secciones[-1][0] >= desde_nivel:
            self.cierra(self.secciones.pop()[1])

    def fin_de_documento(self) -> None:
        self.cierra_secciones(0)
        self.cierra(self.capitulo and f"cap. {self.capitulo}")
        self.capitulo, self.en_ejercicios = None, False
        self.pila.clear()
        self.listas.clear()

    # --- eventos ------------------------------------------------------------------------
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        ident, clases = a.get("id") or "", (a.get("class") or "").split()
        if a.get("epub:type") == "pagebreak" and (m := RE_PAGINA.match(ident)):
            self.pagina = m.group(1)
            self.paginas.setdefault(self.pagina, [])    # una página en blanco también existe
            return
        cierra = None
        if tag == "h1":
            self.cierra_secciones(0)
            self.en_ejercicios = False
            if m := re.match(r"^chapter(\d+)$", ident):
                self.capitulo = m.group(1)
                self.abre(f"cap. {self.capitulo}")
        elif tag in NIVEL and any(c.startswith("head") for c in clases):
            self.titulo, self.nivel_titulo = [], NIVEL[tag]
        elif tag == "aside" and (m := RE_EJEMPLO.match(ident)):
            cierra = f"ejemplo {m.group(1)}.{m.group(2)}"
            self.abre(cierra)
        elif tag in ("ol", "ul"):
            de_ejercicios = (tag == "ol" and "order" in clases and self.en_ejercicios
                             and not self.listas and self.capitulo is not None)
            self.listas.append({"ejercicios": de_ejercicios, "n": int(a.get("start") or 1) - 1})
        elif tag == "li" and self.listas and self.listas[-1]["ejercicios"]:
            self.listas[-1]["n"] += 1
            cierra = f"ejercicio {self.capitulo}.{self.listas[-1]['n']}"
            self.abre(cierra)
        elif tag == "p" and "equation" in clases:
            self.ecuacion = []
        elif tag == "table" and (m := RE_TABLA.match(ident)):
            cierra = f"tabla {m.group(1)}.{m.group(2)}"
            self.abre(cierra)
        elif tag == "figure" and (m := RE_FIGURA.match(ident)):
            cierra = f"fig. {m.group(1)}.{m.group(2)}"
            self.abre(cierra)
        if tag not in ("br", "img", "hr", "span", "col", "meta", "link", "input"):
            self.pila.append((tag, cierra))

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if self.pila and self.pila[-1][0] == tag and dict(attrs).get("epub:type") != "pagebreak":
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        if tag in NIVEL and self.titulo is not None and NIVEL[tag] == self.nivel_titulo:
            texto = re.sub(r"\s+", " ", "".join(self.titulo)).strip()
            self.titulo = None
            self.cierra_secciones(self.nivel_titulo)
            if self.nivel_titulo == 1:
                self.en_ejercicios = bool(re.search(r"\bExercises\b", texto))
            if m := RE_NUMERO.match(texto):
                clave = f"§{m.group(1)}"
                nueva = clave not in self.loc
                self.abre(clave, texto[m.end():].strip())
                if nueva:
                    self._inicio_ya(clave)
                    self.secciones.append((self.nivel_titulo, clave))
        if tag == "p" and self.ecuacion is not None:
            texto = "".join(self.ecuacion)
            self.ecuacion = None
            if m := RE_ROTULO_EC.search(texto):
                clave = f"ec. {m.group(1)}"
                if clave in self.loc:
                    self.repetidos.append(clave)
                else:
                    self.loc[clave] = {"p": [self.ultima_con_texto, self.ultima_con_texto]}
        if tag in ("ol", "ul") and self.listas:
            self.listas.pop()
        while self.pila:                      # cierra hasta la etiqueta que corresponde
            abierta, clave = self.pila.pop()
            self.cierra(clave)
            if abierta == tag:
                break
        if tag in BLOQUES:
            self.paginas.setdefault(self.pagina, []).append("\n")

    def _inicio_ya(self, clave: str) -> None:
        """El encabezado ya se leyó: la sección empieza en la página donde está su título."""
        self.loc[clave]["p"][0] = self.ultima_con_texto
        if clave in self.esperan_inicio:
            self.esperan_inicio.remove(clave)

    def handle_data(self, data):
        self.paginas.setdefault(self.pagina, []).append(data)
        if self.titulo is not None:
            self.titulo.append(data)
        if self.ecuacion is not None:
            self.ecuacion.append(data)
        if data.strip():
            self.ultima_con_texto = self.pagina
            for clave in self.esperan_inicio:
                self.loc[clave]["p"][0] = self.pagina
            self.esperan_inicio.clear()


def documentos_del_lomo(z: zipfile.ZipFile) -> list[str]:
    opf = next(n for n in z.namelist() if n.endswith(".opf"))
    texto = z.read(opf).decode("utf-8")
    hrefs = dict(re.findall(r'<item\b[^>]*\bid="([^"]+)"[^>]*\bhref="([^"]+)"', texto))
    hrefs.update({i: h for h, i in re.findall(r'<item\b[^>]*\bhref="([^"]+)"[^>]*\bid="([^"]+)"', texto)})
    base = posixpath.dirname(opf)
    return [posixpath.join(base, hrefs[i]) for i in re.findall(r'<itemref\b[^>]*\bidref="([^"]+)"', texto)]


def secciones_del_indice(z: zipfile.ZipFile) -> set[str]:
    """Los números de sección que declara la tabla de contenido (toc.ncx)."""
    ncx = next((n for n in z.namelist() if n.endswith(".ncx")), None)
    if not ncx:
        return set()
    rotulos = re.findall(r"<navLabel>\s*<text>(.*?)</text>", z.read(ncx).decode("utf-8"), re.S)
    return {f"§{m.group(1)}" for r in rotulos if (m := RE_NUMERO.match(re.sub(r"<[^>]+>", "", r)))}


def huecos(numeros: list[int]) -> list[int]:
    return sorted(set(range(1, max(numeros) + 1)) - set(numeros)) if numeros else []


def como_pagina(etiqueta: str):
    return int(etiqueta) if etiqueta.isdigit() else etiqueta


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    ap.add_argument("clave")
    ap.add_argument("--sonda", action="append", default=[], metavar="LOC=palabra")
    args = ap.parse_args()

    ruta = ruta_del_ejemplar(args.clave)
    fichas = lee_yaml(EJEMPLARES)
    if ruta is None or args.clave not in fichas:
        sys.exit(f"FALLA  «{args.clave}» no está registrado: extrae_fuente.py --registra")
    if sha256(ruta) != fichas[args.clave]["sha256"]:
        sys.exit(f"FALLA  {args.clave}: el archivo no es el ejemplar registrado")

    lector = Lector()
    with zipfile.ZipFile(ruta) as z:
        for doc in documentos_del_lomo(z):
            lector.feed(z.read(doc).decode("utf-8"))
            lector.close()
            lector.fin_de_documento()
            lector.reset()
        declaradas = secciones_del_indice(z)

    paginas = {p: re.sub(r"[ \t]+", " ", re.sub(r"\n\s*\n+", "\n", "".join(t))).strip()
               for p, t in lector.paginas.items()}
    loc = {k: {**v, "p": [como_pagina(v["p"][0]), como_pagina(v["p"][1])]} for k, v in lector.loc.items()}

    guarda_paginas(args.clave, paginas)
    numeradas = sorted(int(p) for p in paginas if p.isdigit() and p != "0")
    guarda_indice(args.clave, "estructural", EXTRACTOR, loc, paginas=[numeradas[0], numeradas[-1]])
    en_blanco = [p for p in numeradas if not paginas[str(p)]]
    fichas[args.clave]["paginas_sin_texto"] = len(en_blanco)
    escribe_yaml(EJEMPLARES, fichas, CABECERA_EJEMPLARES)

    # --- informe -------------------------------------------------------------------------
    fallas = 0
    tipos = {"cap.": 0, "§": 0, "ejemplo": 0, "ejercicio": 0, "ec.": 0, "tabla": 0, "fig.": 0}
    for k in loc:
        tipos[next(t for t in tipos if k.startswith(t))] += 1
    print(f"OK     {args.clave}: " + ", ".join(f"{n} {t}" for t, n in tipos.items()))
    faltan = huecos(numeradas)
    print(f"{'OK    ' if not faltan else 'FALLA '} páginas impresas {numeradas[0]}–{numeradas[-1]}"
          f" ({len(numeradas)}; registradas {fichas[args.clave]['paginas']})"
          + (f"; faltan {faltan[:10]}" if faltan else "")
          + (f"; sin texto: {en_blanco[:10]}" if en_blanco else ""))
    fallas += bool(faltan) + (len(numeradas) != fichas[args.clave]["paginas"])

    indexadas = {k for k in loc if k.startswith("§")}
    solo_toc, solo_texto = sorted(declaradas - indexadas), sorted(indexadas - declaradas)
    print(f"{'OK    ' if not solo_toc else 'FALLA '} secciones: {len(indexadas)} indexadas, "
          f"{len(declaradas)} en la tabla de contenido"
          + (f"; en la tabla y no en el texto: {solo_toc[:8]}" if solo_toc else "")
          + (f"; en el texto y no en la tabla: {solo_texto[:8]}" if solo_texto else ""))
    fallas += bool(solo_toc)

    for tipo in ("ejemplo", "ejercicio", "tabla", "fig."):
        por_cap: dict[str, list[int]] = {}
        for k in loc:
            if k.startswith(tipo + " "):
                cap, n = k[len(tipo) + 1:].split(".")
                por_cap.setdefault(cap, []).append(int(n))
        rotos = {c: huecos(ns) for c, ns in por_cap.items() if huecos(ns)}
        print(f"{'OK    ' if not rotos else 'AVISO '} {tipo}: numeración corrida en {len(por_cap)} capítulos"
              + (f"; huecos {dict(list(rotos.items())[:6])}" if rotos else ""))
    if lector.repetidos:
        print(f"AVISO  localizadores repetidos (se conserva el primero): {sorted(set(lector.repetidos))[:10]}")
    invertidos = [k for k, v in loc.items() if orden_de_pagina(str(v['p'][0])) > orden_de_pagina(str(v['p'][1]))]
    if invertidos:
        print(f"FALLA  intervalos de página invertidos: {invertidos[:8]}")
        fallas += 1

    for sonda in args.sonda:
        clave, palabra = sonda.split("=", 1)
        if clave not in loc:
            print(f"FALLA  sonda: «{clave}» no existe")
            fallas += 1
            continue
        desde, hasta = loc[clave]["p"]
        texto = " ".join(paginas.get(str(p), "") for p in range(int(desde), int(hasta) + 1))
        hallada = palabra.lower() in texto.lower()
        print(f"{'OK    ' if hallada else 'FALLA '} sonda: «{clave}» (pp. {desde}–{hasta}) "
              f"{'contiene' if hallada else 'NO contiene'} «{palabra}»")
        fallas += not hallada
    return 1 if fallas else 0


if __name__ == "__main__":
    sys.exit(main())
