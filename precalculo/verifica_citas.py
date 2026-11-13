#!/usr/bin/env python3
"""
verifica_citas.py — ninguna cita de memoria

Material de Muestreo Estadístico 2026-II (20939). Tarea GD-D1 de PLAN_Gestion_Documental.md.
Norma: Vault/Estandar/Capa de fuentes.md («Listón mínimo del auditor de citas»).

Por qué existe
--------------
El material tenía una norma dura para las cifras —ninguna se escribe a mano— y ninguna para
las fuentes: se podía escribir «Lohr, ejercicio 15.13» sin abrir el libro, y ningún verificador
lo habría notado. De hecho pasó: ese ejercicio es el 15.5. Este guion es el equivalente de
`verifica_bloques.py` para las citas.

No lee el texto de ninguna obra. Trabaja con lo que sí está en git: el catálogo
(`bibliografia/referencias.json`, que sale de Zotero), la huella de los ejemplares
(`ejemplares.yml`) y el índice delgado de localizadores de cada uno (`indices/<clave>.json`).
Por eso comprueba que una sección, un ejemplo o una página EXISTAN en la edición citada; que
digan lo que la frase les atribuye lo comprueba el registro de contraste (tarea D3), leyendo.

Dos regímenes
-------------
  · CITAS MARCADAS, las de la norma: `<cite class="cita" data-ref data-loc [data-via]>`.
    Cualquier defecto falla siempre. No tienen línea base.
  · CITAS HEREDADAS, las que el material ya traía escritas a mano: cada `<li>` de un bloque
    «Para ampliar» y cada cita en línea de la prosa o de los simuladores («(Lohr, §7.5)»).
    Se leen con heurísticas y se comparan con una LÍNEA BASE CON TRINQUETE
    (`bibliografia/linea_base_citas.json`): lo que ya estaba se cuenta y no falla; lo nuevo
    falla; lo que se arregla hay que retirarlo de la línea base, que solo puede encoger.

La lectura de lo heredado es conservadora: en la prosa solo ve una cita cuando la obra y el
localizador van pegados, y no mira las diapositivas ni los guiones de R (eso lo cuenta
`inventario_citas.py`). Lo que no ve no lo aprueba: simplemente no está en la cuenta.

Qué comprueba (los números L son los del listón de la norma)
------------------------------------------------------------
  L1  la obra citada está en el catálogo (`referencias.json`)
  L2  el localizador existe en el índice del ejemplar leído, y las páginas caen en la sección
  L3  se cita la edición que se leyó: portada comprobada, mismo año y misma edición; en lo
      heredado, además, el año de Lohr y las ediciones de las que no hay ejemplar
  L4  una obra sin ejemplar no lleva localizador directo (va de segunda mano, con `data-via`)
  L5  quien verifica una afirmación no es quien la redactó
  L6  ninguna cita con localizador sobre una afirmación pendiente, que discrepa o sin releer
  L7  el pie de referencias de la página trae lo que la página cita, y solo eso; y el texto de
      cada cita marcada y el pie generado son exactamente los que escribe `genera_referencias.py`
  V1  el localizador usa el vocabulario cerrado de la norma
  M1  cita sin marcar que no estaba en la línea base: toda cita nueva entra marcada
  B1  la línea base guarda algo que ya no existe: hay que retirarlo (`--anota`)
  K1  el catálogo es coherente: obras.tsv, referencias.json, ejemplares.yml e índices

Y del registro de contraste (`bibliografia/contraste/capN.yml`, explicado en `_contraste.py`):

  R1  esquema: campos, vocabularios, identificadores
  R2  cada `data-afirma` tiene su entrada y cada cita marcada con localizador cuelga de una
      afirmación y coincide con una de sus fuentes
  R3  la prosa no cambió desde que se contrastó (huella o literal de ancla)
  R4  el pasaje registrado está en esa página del ejemplar, y esa página, en el localizador


Uso
---
    python3 precalculo/verifica_citas.py              # todo el sitio contra la línea base
    python3 precalculo/verifica_citas.py --todo       # además lista lo ya conocido
    python3 precalculo/verifica_citas.py --lee        # cómo se leyó cada cita heredada
    python3 precalculo/verifica_citas.py --anota      # retira de la línea base lo arreglado
    python3 precalculo/verifica_citas.py --anota --admite
                                                      # además ADMITE lo nuevo (revisar ANTES)
    python3 precalculo/verifica_citas.py --uso        # escribe bibliografia/uso_fuentes.json
    python3 precalculo/verifica_citas.py --uso-comprobar
    python3 precalculo/verifica_citas.py --pasaje lohr2022sampling 1 "texto leído"
                                                      # guarda un pasaje (fuera de git) y da su huella
    python3 precalculo/verifica_citas.py --huella c1-m1-03
                                                      # la huella actual de esa afirmación
    python3 precalculo/verifica_citas.py --cierre 1   # falla si en el cap. 1 queda algo abierto
    python3 precalculo/verifica_citas.py --sin-corpus # en un clon sin ejemplares: R4 informa

`--anota --admite` graba como conocido lo que hoy falla. Solo se ejecuta después de leer la
salida: si se admite sin mirar, el defecto queda bendecido y el trinquete deja de servir.

Devuelve 1 si algo falla.
"""
from __future__ import annotations

import argparse
import csv
import dataclasses
import datetime as dt
import hashlib
import html
import html.parser
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import _contraste as C            # noqa: E402
import _fuentes as F              # noqa: E402
import genera_referencias as G    # noqa: E402
import inventario_citas as I      # noqa: E402

RAIZ = F.RAIZ
CURSO = 20939
NOMBRE_BASE = "linea_base_citas.json"

# Qué clave del catálogo es cada edición de Lohr. De la 2.ª no hay ejemplar ni ficha.
LOHR = {"3": "lohr2022sampling", "1": "lohr1999sampling", "2": None}
ANIO_DE_LOHR_EN_EL_CATALOGO = "2022"

NOMBRES = {
    "L1": "obra que no está en el catálogo",
    "L2": "localizador que no existe en el ejemplar",
    "L3": "edición citada distinta de la leída",
    "L4": "obra sin ejemplar con localizador directo",
    "L7": "pie de referencias que no coincide con lo citado",
    "L5": "verificado por quien redactó",
    "L6": "cita sobre un veredicto abierto",
    "R1": "registro de contraste mal formado",
    "R2": "registro y HTML no se corresponden",
    "R3": "la prosa cambió desde que se contrastó",
    "R4": "el pasaje registrado no está donde se dice",
    "V1": "localizador fuera del vocabulario",
    "M1": "cita sin marcar nueva",
    "B1": "línea base con entradas que ya no existen",
    "K1": "catálogo incoherente",
}


# --------------------------------------------------------------------------- #
# Hallazgos
# --------------------------------------------------------------------------- #
@dataclasses.dataclass
class Hallazgo:
    codigo: str
    donde: str
    que: str
    base: str | None = None     # clave en la línea base; None = no admisible, falla siempre

    def __str__(self) -> str:
        return f"[{self.codigo}] {self.donde}: {self.que}"


def huella(texto: str) -> str:
    return hashlib.sha256(re.sub(r"\s+", " ", texto).strip().encode("utf-8")).hexdigest()[:10]


def nombre_corto(ruta: pathlib.Path) -> str:
    """«capitulo-3», «laboratorio-ppt»… y «sitio/index» frente a «muestreo/index», que son dos."""
    m = re.match(r"(capitulo-\d+)", ruta.stem)
    if m:
        return m.group(1)
    return f"{ruta.parent.name}/index" if ruta.stem == "index" else ruta.stem


# --------------------------------------------------------------------------- #
# Catálogo: referencias, ejemplares, índices y la tabla de obras
# --------------------------------------------------------------------------- #
@dataclasses.dataclass
class Catalogo:
    dir: pathlib.Path
    referencias: dict[str, dict]
    candado: dict[str, dict]
    ejemplares: dict[str, dict]
    indices: dict[str, dict]
    claves: dict[str, str | None]          # etiqueta de inventario_citas → clave de cita
    filas: list[dict]
    instantaneas: dict[str, dict] = dataclasses.field(default_factory=dict)   # obras leídas en la web
    cuenta: dict = dataclasses.field(default_factory=lambda: {"veredictos": {}, "comprobadas": 0,
                                                              "sin_corpus": 0})

    @classmethod
    def carga(cls, directorio: pathlib.Path) -> "Catalogo":
        referencias = F.lee_json(directorio / "referencias.json") or []
        candado = (F.lee_json(directorio / "zotero.lock.json") or {}).get("obras", {})
        indices = {p.stem: json.loads(p.read_text("utf-8"))
                   for p in sorted((directorio / "indices").glob("*.json"))}
        filas = []
        tabla = directorio / "obras.tsv"
        if tabla.exists():
            with tabla.open(encoding="utf-8", newline="") as f:
                filas = list(csv.DictReader(f, delimiter="\t"))
        claves = {fila["etiqueta"]: (fila.get("clave") or "").strip() or None for fila in filas}
        return cls(directorio, {r["id"]: r for r in referencias}, candado,
                   F.lee_yaml(directorio / "ejemplares.yml"), indices, claves, filas,
                   F.lee_yaml(directorio / "instantaneas.yml"))

    def anio(self, clave: str) -> str:
        partes = (self.referencias.get(clave, {}).get("issued") or {}).get("date-parts") or [[None]]
        return str(partes[0][0]) if partes[0] and partes[0][0] else ""

    def tiene_ejemplar(self, clave: str | None) -> bool:
        """Un PDF o EPUB registrado, o una instantánea de la obra leída en la web (norma v1.1)."""
        return bool(clave) and (clave in self.ejemplares or clave in self.instantaneas)

    def paginas_de(self, clave: str, loc: str) -> list[int] | None:
        """El tramo de páginas de un localizador estructural, o None."""
        p = (self.indices.get(clave) or {}).get("loc", {}).get(loc)
        return p if p and all(isinstance(x, int) for x in p) else None

    def resuelve(self, clave: str, loc: str) -> str | None:
        """None si el localizador existe en el índice de la obra; si no, por qué no."""
        indice = self.indices.get(clave)
        if indice is None:
            return f"«{clave}» no tiene índice de localizadores: no comprobable aquí"
        tabla = indice.get("loc", {})
        m = re.fullmatch(r"pp?\. (\d+)(?:–(\d+))?", loc)
        if m and indice.get("calidad") == "web":
            return f"«{clave}» se leyó en la web y no tiene páginas: cítese por sección"
        if m:
            desde, hasta = int(m.group(1)), int(m.group(2) or m.group(1))
            tramo = indice.get("paginas")
            if hasta < desde:
                return f"el rango «{loc}» está al revés"
            if tramo and not (tramo[0] <= desde and hasta <= tramo[1]):
                return f"«{loc}» queda fuera de las páginas {tramo[0]}–{tramo[1]} de «{clave}»"
            return None
        m = re.fullmatch(r"ap\. ([A-Z])", loc)
        if m:
            letra = m.group(1)
            if any(k == f"§{letra}" or k.startswith(f"§{letra}.") for k in tabla):
                return None
            return f"«{clave}» no tiene apéndice {letra} en su índice"
        if loc in tabla:
            return None
        tipo = tipo_de(loc)
        dudoso = (" (índice de calidad «probable»: confírmese en el ejemplar)"
                  if indice.get("calidad") == "probable" else "")
        if not any(tipo_de(k) == tipo for k in tabla):
            return (f"el índice de «{clave}» no cubre localizadores de tipo «{tipo}»: "
                    "cítese por sección o por página")
        return f"«{loc}» no existe en «{clave}»{dudoso}"


def tipo_de(loc: str) -> str:
    return "§" if loc.startswith("§") else loc.split(" ")[0]


def partes_de_loc(loc: str) -> tuple[list[str], list[str]]:
    """(localizadores bien formados, trozos fuera del vocabulario) de un `data-loc`."""
    buenos, malos = [], []
    for trozo in loc.split("; "):
        formado = bool(F.RE_LOCALIZADOR.match(trozo))
        if formado and trozo.startswith("p"):
            formado = bool(re.fullmatch(r"p\. \d+|pp\. \d+–\d+", trozo))
        (buenos if formado else malos).append(trozo)
    return buenos, malos


def paginas_fuera_de_seccion(cat: Catalogo, clave: str, locs: list[str]) -> str | None:
    """Si una cita da sección y páginas, las páginas tienen que caer en la sección.

    Tolera una página por cada lado: el índice de un PDF sitúa el encabezado, no el renglón.
    """
    paginas = [l for l in locs if l.startswith("p")]
    tramos = [(l, p) for l in locs if not l.startswith("p") and (p := cat.paginas_de(clave, l))]
    if not paginas or not tramos:
        return None
    for pag in paginas:
        m = re.fullmatch(r"pp?\. (\d+)(?:–(\d+))?", pag)
        desde, hasta = int(m.group(1)), int(m.group(2) or m.group(1))
        if not any(p[0] - 1 <= hasta and desde <= p[-1] + 1 for _, p in tramos):
            donde = ", ".join(f"{l} está en pp. {p[0]}–{p[-1]}" for l, p in tramos)
            return f"«{pag}» no cae en lo que la cita nombra ({donde})"
    return None


def comprueba_catalogo(cat: Catalogo) -> list[Hallazgo]:
    h: list[Hallazgo] = []
    for fila in cat.filas:
        etiqueta, clave = fila["etiqueta"], (fila.get("clave") or "").strip()
        ident = (fila.get("identificador") or "").strip()
        if not clave:
            continue
        if clave in cat.referencias:
            doi = (cat.referencias[clave].get("DOI") or "").lower()
            if fila.get("alta") == "doi" and ident.lower() != doi:
                h.append(Hallazgo("K1", f"obras.tsv · {etiqueta}",
                                  f"dice que su clave es «{clave}», pero el DOI de esa obra en "
                                  f"referencias.json es «{doi}» y el de la fila es «{ident}»"))
        elif clave not in cat.ejemplares:
            h.append(Hallazgo("K1", f"obras.tsv · {etiqueta}",
                              f"la clave «{clave}» no está en referencias.json ni en ejemplares.yml"))
    for clave, ficha in cat.ejemplares.items():
        donde = f"ejemplares.yml · {clave}"
        indice = cat.indices.get(clave)
        if indice is None:
            h.append(Hallazgo("K1", donde, "el ejemplar no tiene índice en bibliografia/indices/"))
        elif indice.get("ejemplar_sha256") != ficha.get("sha256"):
            h.append(Hallazgo("K1", donde, "el índice se construyó con otro ejemplar (sha256): "
                                           "hay que volver a indexar"))
        edicion = str(ficha.get("edicion_comprobada") or "")
        if not edicion:
            h.append(Hallazgo("L3", donde, "la portada no está comprobada (`edicion_comprobada`)"))
            continue
        if clave not in cat.referencias:
            continue
        if cat.anio(clave) and cat.anio(clave) not in edicion:
            h.append(Hallazgo("L3", donde, f"la portada dice «{edicion}» y el catálogo cita la obra "
                                           f"como de {cat.anio(clave)}: se leyó una edición y se cita otra"))
        citada = re.match(r"\d+", str(cat.referencias[clave].get("edition") or ""))
        leida = re.search(r"(\d+)\.ª", edicion)
        if citada and leida and citada.group(0) != leida.group(1):
            h.append(Hallazgo("L3", donde, f"el catálogo dice edición {citada.group(0)} y la portada "
                                           f"del ejemplar, «{edicion}»"))
    for clave, paginas in cat.instantaneas.items():
        donde = f"instantaneas.yml · {clave}"
        indice = cat.indices.get(clave)
        if indice is None:
            h.append(Hallazgo("K1", donde, "la obra leída en la web no tiene índice en bibliografia/indices/"))
            continue
        for nombre, sha in (indice.get("instantaneas") or {}).items():
            if (paginas.get(nombre) or {}).get("sha256") != sha:
                h.append(Hallazgo("K1", donde, f"el índice se construyó con otra versión de la instantánea "
                                               f"«{nombre}» (sha256): hay que volver a indexar"))
        for nombre, ficha in paginas.items():
            if not (ficha.get("url") and ficha.get("consulta")):
                h.append(Hallazgo("K1", donde, f"la instantánea «{nombre}» no dice su URL o su fecha de consulta"))
    return h


# --------------------------------------------------------------------------- #
# Citas marcadas
# --------------------------------------------------------------------------- #
@dataclasses.dataclass
class Marcada:
    clave: str
    loc: str
    via: str
    modulo: int | None
    linea: int
    afirma: str | None = None      # el `data-afirma` que la envuelve


VACIOS = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source",
          "track", "wbr"}


class LectorDeMarcadas(html.parser.HTMLParser):
    """Las citas marcadas y las afirmaciones (`data-afirma`) con su prosa.

    La prosa de una afirmación excluye lo que hay dentro de sus <cite>: eso lo escribe el
    generador y puede cambiar si en Zotero se corrige un apellido, sin que haya cambiado lo
    que se contrastó.
    """

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.modulo: int | None = None
        self.citas: list[Marcada] = []
        self.pila: list[tuple[str, str | None, bool]] = []       # (etiqueta, id afirma, es cita)
        self.afirmaciones: dict[str, list] = {}                  # id → [línea, prosa]
        self.problemas: list[tuple[int, str]] = []

    def _afirma(self) -> str | None:
        return next((a for _, a, _ in reversed(self.pila) if a), None)

    def handle_starttag(self, etiqueta, atributos):
        a = dict(atributos)
        linea = self.getpos()[0]
        if etiqueta == "template":
            m = re.fullmatch(r"module-(\d+)", a.get("id") or "")
            self.modulo = int(m.group(1)) if m else None
        ident = a.get("data-afirma")
        es_cita = etiqueta == "cite" and "cita" in (a.get("class") or "").split()
        if ident:
            if self._afirma():
                self.problemas.append((linea, f"`data-afirma=\"{ident}\"` anidada dentro de otra"))
            if ident in self.afirmaciones:
                self.problemas.append((linea, f"`data-afirma=\"{ident}\"` repetida"))
            self.afirmaciones[ident] = [linea, ""]
        if es_cita:
            self.citas.append(Marcada(a.get("data-ref") or "", a.get("data-loc") or "",
                                      a.get("data-via") or "", self.modulo, linea,
                                      ident or self._afirma()))
        if etiqueta not in VACIOS:
            self.pila.append((etiqueta, ident, es_cita))

    def handle_endtag(self, etiqueta):
        if etiqueta == "template":
            self.modulo = None
        for i in range(len(self.pila) - 1, -1, -1):
            if self.pila[i][0] == etiqueta:
                del self.pila[i:]
                return

    def handle_data(self, dato):
        actual = self._afirma()
        if actual and not any(c for _, _, c in self.pila):
            self.afirmaciones[actual][1] += dato


def comprueba_marcada(cat: Catalogo, c: Marcada, donde: str) -> list[Hallazgo]:
    h: list[Hallazgo] = []
    for nombre, clave in (("data-ref", c.clave), ("data-via", c.via)):
        if nombre == "data-via" and not clave:
            continue
        if clave not in cat.referencias:
            h.append(Hallazgo("L1", donde, f"`{nombre}=\"{clave}\"` no está en referencias.json"))
    leida = c.via or c.clave           # la obra que se tuvo delante, dueña del localizador
    if not c.loc:
        return h                       # lectura recomendada: sin localizador no hay nada que leer
    buenos, malos = partes_de_loc(c.loc)
    for trozo in malos:
        h.append(Hallazgo("V1", donde, f"`data-loc`: «{trozo}» no usa el vocabulario cerrado "
                                       "(§3.4 · cap. 3 · ejemplo 3.2 · ejercicio 3.12 · ec. 3.3 · "
                                       "tabla 3.1 · fig. 3.1 · p. 15 · pp. 15–17 · ap. A; varios con «; »)"))
    if leida not in cat.referencias:
        return h
    if not cat.tiene_ejemplar(leida):
        como = ("la obra intermedia tampoco tiene ejemplar" if c.via else
                "cítese de segunda mano, con `data-via`, o sin localizador")
        h.append(Hallazgo("L4", donde, f"«{leida}» no tiene ejemplar registrado y la cita lleva "
                                       f"localizador («{c.loc}»): {como}"))
        return h
    for loc in buenos:
        if (motivo := cat.resuelve(leida, loc)):
            h.append(Hallazgo("L2", donde, motivo))
    if not any(x.codigo == "L2" for x in h) and (motivo := paginas_fuera_de_seccion(cat, leida, buenos)):
        h.append(Hallazgo("L2", donde, motivo))
    return h


# --------------------------------------------------------------------------- #
# Citas heredadas: lectura
# --------------------------------------------------------------------------- #
_NUM = r"\d+(?:\.\d+)*"
RE_LOC = re.compile(
    r"(?P<tipo>§|\b[Ss]ecci(?:ón|ones)|\b[Cc]ap(?:ítulos?|s?\.)|\b[Ee]jemplos?|\b[Ee]jercicios?"
    r"|\b[Pp]roblemas?|\b[Ee]js?\.|\b[Ee]c(?:uaci(?:ón|ones)|s?\.)|\b[Tt]ablas?|\b[Ff]ig(?:uras?|s?\.)"
    r"|\bpp?\.|\b[Aa]p(?:éndices?|\.)|\bResultados?|\b[Tt]eoremas?|\b[Ll]emas?)"
    r"\s*\(?(?P<lista>" + _NUM + r"(?:\s*(?:,|y|a|–|-)\s*" + _NUM + r")*|[A-Z]\b)?"
)
# «… (2.ª ed.) o 4.1 y 4.1.1 (3.ª ed.)»: números sueltos que heredan el tipo del anterior.
RE_CONTINUA = re.compile(r"\)\s+o\s+(?P<lista>" + _NUM + r"(?:\s*(?:,|y)\s*" + _NUM + r")*)(?=\s*\(\d\.ª)")
RE_EDICION = re.compile(r"\b(?P<n>[123])\.?[ªa]\b|(?P<ambas>ambas ediciones)")
RE_ARTICULO = re.compile(r"(?:\b(?:el|al|del|los|las|este|ese|aquel)\s+)$")
RE_INTERNA = re.compile(r"^(?:Este material|Capítulo \d+(?:,| de este material)|El módulo \d+|El diagrama )")
RE_GENERADO = re.compile(
    r'(?P<cita><cite\b[^>]*\bclass="[^"]*\bcita\b[^"]*"[^>]*>.*?</cite>)'
    r"|<!--(?P<zona>FUENTES-MODULO|REFERENCIAS-CAPITULO|PIE-REFERENCIAS):inicio-->.*?<!--(?P=zona):fin-->", re.S)
# Lo que queda donde había una cita marcada, para saber que una entrada ya está migrada.
MARCA = "⟦cita⟧"
RE_PIE_GENERADO = re.compile(r"<!--PIE-REFERENCIAS:inicio-->(.*?)<!--PIE-REFERENCIAS:fin-->", re.S)
RE_PLANTILLA = re.compile(r'<template id="module-(\d+)">(.*?)</template>', re.S)

TIPOS = [("§", "§"), ("secci", "§"), ("cap", "cap."), ("ejemplo", "ejemplo"), ("ejercicio", "ejercicio"),
         ("problema", "problema"), ("ej", "ej"), ("ec", "ec."), ("tabla", "tabla"), ("fig", "fig."),
         ("p", "p"), ("ap", "ap."), ("resultado", "fuera"), ("teorema", "fuera"), ("lema", "fuera")]
# Lo que puede encabezar una entrada bibliográfica. Los conjuntos de datos (NHANES, el censo)
# se nombran, no se citan: «NHANES en §7.5» es un localizador de Lohr.
CITABLES = {e for e, clase, _, _ in I.OBRAS if clase in ("obra", "software")}


@dataclasses.dataclass
class Loc:
    canon: str | None      # forma de la norma; None si no se pudo llevar al vocabulario
    crudo: str
    inicio: int
    fin: int
    tipo: str              # el de la norma, o «ej» (ambiguo), «fuera»
    edicion: str | None = None      # «1», «2», «3», «ambas» o None (sin declarar)


def _tipo(palabra: str) -> str:
    p = palabra.lower().rstrip(".")
    return next(t for prefijo, t in TIPOS if p.startswith(prefijo))


def _numeros(lista: str, tipo: str) -> tuple[list[str], bool]:
    """Los números de «3.1 y 3.1.1», «2.2 a 2.8», «211–214». (números, es un rango)."""
    piezas = re.findall(_NUM + r"|,|y|a|–|-", lista)
    numeros, rango = [piezas[0]], False
    for sep, n in zip(piezas[1::2], piezas[2::2]):
        es_rango = sep in ("a", "–", "-")
        if es_rango and n.count(".") != numeros[-1].count("."):
            break                               # «ejemplo 6.10 a 3 clases» no es un rango
        if sep == "," and "." not in n and tipo != "p":
            break                               # «capítulo 1, 2 simuladores»
        numeros.append(n)
        rango = rango or es_rango
    return numeros, rango


def localizadores(texto: str, en_linea: bool) -> list[Loc]:
    """Los localizadores de una cita escrita a mano, llevados al vocabulario de la norma.

    Deja fuera lo que remite al propio material («el capítulo 6 lo desarrolla», «ejercicio 4
    del módulo 14»), que es la confusión que el plan ya anticipaba.
    """
    marcas = [(m.start(), m.end(), m.group("n") or "ambas") for m in RE_EDICION.finditer(texto)]
    frases = [m.end() for m in re.finditer(r"\.\s+(?=[A-ZÁÉÍÓÚ])|[;:]\s", texto)]

    def misma_frase(a: int, b: int) -> bool:
        return not any(min(a, b) < corte <= max(a, b) for corte in frases)

    fuera: list[Loc] = []
    consumido: list[tuple[int, int]] = []
    for m in RE_LOC.finditer(texto):
        if any(a <= m.start() < b for a, b in consumido):
            continue
        tipo, lista = _tipo(m.group("tipo")), m.group("lista")
        crudo, fin = m.group(0).strip(), m.end()
        if lista is None:
            if tipo == "ap.":
                entero = re.match(r"\S+(?: de \w+)?", texto[m.start():]).group(0)
                fuera.append(Loc(None, entero, m.start(), m.end(), "fuera"))
            continue
        if re.search(r"^\s+del?\s+m[óo]dulo", texto[m.end():]):
            continue                                              # «ejercicio 4 del módulo 14»
        if tipo == "ap.":
            fuera.append(Loc(f"ap. {lista}", crudo, m.start(), m.end(), tipo))
            continue
        if tipo == "fuera":
            fuera.append(Loc(None, crudo, m.start(), m.end(), tipo))
            continue
        if not lista[0].isdigit():
            continue                                              # «Tabla A»: la letra es de un apéndice
        numeros, rango = _numeros(lista, tipo)
        if tipo == "p":
            canon = (f"pp. {numeros[0]}–{numeros[1]}" if rango and len(numeros) == 2
                     else f"p. {numeros[0]}")
            fuera.append(Loc(canon, crudo, m.start(), m.end(), "p"))
            continue
        if tipo == "cap.":
            antes = texto[:m.start()]
            if en_linea and not re.search(r"\bsu\s+$", antes):
                continue                                          # en la prosa, casi siempre el del curso
            if RE_ARTICULO.search(antes) and not re.search(r"[Ee]jercicios?\s+del\s+$", antes):
                cerca = any(misma_frase(m.start(), a) and (a < m.start() or a - m.end() <= 12)
                            for a, _, _ in marcas)
                if not cerca:
                    continue                                      # «el capítulo 6 lo desarrolla»
        if tipo in ("ejemplo", "ejercicio", "problema", "ej", "tabla", "fig.", "ec.") \
                and all("." not in n for n in numeros):
            # «ejercicio 26 del capítulo 4» · «cap. 15 (ej. 9 y 10)»: numeración relativa
            despues = re.match(r"\s+del?\s+[Cc]ap(?:ítulo|\.)\s+(\d+)", texto[m.end():])
            antes = re.search(r"[Cc]ap(?:ítulo|\.)\s+(\d+)\s*\($", texto[:m.start()])
            if despues:
                capitulo = despues.group(1)
                fin = m.end() + despues.end()
                consumido.append((m.end(), fin))
                crudo = texto[m.start():fin].strip()
            elif antes:
                capitulo = antes.group(1)
            else:
                continue                                          # un ejercicio del propio material
            numeros = [f"{capitulo}.{n}" for n in numeros]
        prefijo = "§" if tipo == "§" else tipo + " "
        for n in numeros:
            fuera.append(Loc(f"{prefijo}{n}", crudo, m.start(), fin, tipo))
    for m in RE_CONTINUA.finditer(texto):
        previos = [l for l in fuera if l.fin <= m.start() and l.tipo not in ("p", "fuera")]
        if previos:
            tipo = previos[-1].tipo
            prefijo = "§" if tipo == "§" else tipo + " "
            for n in re.findall(_NUM, m.group("lista")):
                fuera.append(Loc(f"{prefijo}{n}", "o " + m.group("lista"),
                                 m.start("lista"), m.end("lista"), tipo))
    fuera.sort(key=lambda l: (l.inicio, l.canon or ""))

    # La edición de cada localizador: la del paréntesis que lo envuelve, si la declara; si no,
    # la de la marca que le sigue («§4.2 (1.ª ed.)»); si no, la última que hubo antes
    # («Lohr (2021), sección 1.4 … y sección 8.2»).
    anio = I.LOHR_ANIO.search(texto)
    if anio:
        marcas.append((anio.start(), anio.end(), I.ANIO_A_EDICION[anio.group(1)]))
        marcas.sort()
    for l in fuera:
        abre, cierra = texto.rfind("(", 0, l.inicio), texto.find(")", l.fin)
        dentro = [e for a, _, e in marcas if abre != -1 and cierra != -1 and abre < a < cierra
                  and ")" not in texto[abre:l.inicio]]
        despues = [e for a, _, e in marcas if a >= l.fin]
        antes = [e for _, b, e in marcas if b <= l.inicio]
        l.edicion = (dentro or despues[:1] or antes[-1:] or [None])[0]
    return fuera


@dataclasses.dataclass
class Tramo:
    obra: str                      # etiqueta de inventario_citas
    locs: list[Loc]


@dataclasses.dataclass
class Unidad:
    """Una cita heredada: un <li> de «Para ampliar» o una cita en línea."""
    pagina: str
    zona: str                      # «M4», «js» o «pagina»
    origen: str                    # «bloque» o «linea»
    texto: str
    tramos: list[Tramo]
    anio_lohr: str | None = None
    orden: int = 1

    @property
    def base(self) -> str:
        sufijo = f"#{self.orden}" if self.orden > 1 else ""
        return f"{self.pagina}|{self.zona}|{huella(self.texto)}{sufijo}"

    @property
    def donde(self) -> str:
        corto = self.texto if len(self.texto) <= 70 else self.texto[:69] + "…"
        return f"{self.pagina} {self.zona} · «{corto}»"


def obras_citables(texto: str) -> list[tuple[int, int, str]]:
    """(inicio, fin, etiqueta) de cada mención de una obra que puede encabezar una cita."""
    vistas = [(m.start(), m.end(), e) for e, _, _, p in I.PATRONES if e in CITABLES
              for m in p.finditer(texto)]
    return sorted(vistas)


def lee_entrada(pagina: str, zona: str, texto: str) -> Unidad | None:
    """Un <li> de un bloque «Para ampliar»."""
    if RE_INTERNA.match(texto):
        return None
    migrada = MARCA in texto
    texto = re.sub(r"\s+", " ", texto.replace(MARCA, " ")).strip()
    menciones = obras_citables(texto)
    if migrada and not menciones:
        return None                                   # ya es una cita marcada, con su comentario
    locs = localizadores(texto, en_linea=False)
    tramos: dict[str, Tramo] = {}
    for _, _, etiqueta in menciones:
        tramos.setdefault(etiqueta, Tramo(etiqueta, []))
    for l in locs:
        previas = [e for a, _, e in menciones if a <= l.inicio]
        if previas:                                   # antes de la primera obra no hay cita
            tramos[previas[-1]].locs.append(l)
    if not menciones:
        tramos["?"] = Tramo("?", [])                  # un <li> que no se sabe a quién cita
    anio = I.LOHR_ANIO.search(texto)
    return Unidad(pagina, zona, "bloque", texto, list(tramos.values()),
                  anio.group(1) if anio else None)


RE_FIN_DE_FRASE = re.compile(r"[;:!?]|\.(?=\s+[A-ZÁÉÍÓÚ¿«#]|\s*$)")


def lee_en_linea(pagina: str, zona: str, texto: str) -> list[Unidad]:
    """Las citas en línea de un trozo de prosa: obra y localizador contiguos.

    Es conservador a propósito: «(Lohr, §7.5)», «Lohr (ej. 6.12)», «§4.1.4 de Lohr». Una obra
    nombrada lejos de su localizador no se detecta; para eso está la lectura de D2.
    """
    menciones = obras_citables(texto)
    locs = localizadores(texto, en_linea=True)
    tramos_vistos: list[tuple[int, int, str]] = []
    for a, b, etiqueta in menciones:
        # forma A: la obra y, a continuación, el localizador
        cerca = [l for l in locs if b <= l.inicio <= b + 45
                 and not RE_FIN_DE_FRASE.search(re.sub(r"\bed\.|et al\.|\b[A-Z]\.", "", texto[b:l.inicio]))
                 and not any(b <= a2 < l.inicio for a2, _, _ in menciones)]
        inicio = a
        # forma B: «§4.1.4 de Lohr»
        previo = [l for l in locs if l.fin <= a and re.fullmatch(r"\)?\s+del?\s+", texto[l.fin:a])]
        if previo:
            cerca = previo[-1:] + cerca
            inicio = previo[-1].inicio
        if not cerca:
            continue
        fin = max(cerca[-1].fin, b)
        while True:                                   # los localizadores que siguen pegados
            mas = [l for l in locs if fin < l.inicio <= fin + 40
                   and not RE_FIN_DE_FRASE.search(texto[fin:l.inicio])
                   and not any(fin <= a2 < l.inicio for a2, _, _ in menciones)]
            if not mas:
                break
            fin = mas[0].fin
        marca = RE_EDICION.search(texto, fin, fin + 16)
        if marca and not RE_FIN_DE_FRASE.search(texto[fin:marca.start()]):
            fin = marca.end()
        tramos_vistos.append((inicio, fin, etiqueta))
    unidades = []
    for inicio, fin, etiqueta in tramos_vistos:
        if any(i2 <= inicio and fin <= f2 and (i2, f2) != (inicio, fin) for i2, f2, _ in tramos_vistos):
            continue                                  # contenida en otra
        trozo = texto[inicio:fin]
        propios = localizadores(trozo, en_linea=True)
        if not propios:
            continue
        anio = I.LOHR_ANIO.search(trozo)
        unidades.append(Unidad(pagina, zona, "linea", trozo, [Tramo(etiqueta, propios)],
                               anio.group(1) if anio else None))
    return unidades


@dataclasses.dataclass
class Pagina:
    ruta: pathlib.Path
    nombre: str
    marcadas: list[Marcada]
    unidades: list[Unidad]
    pie_generado: set[str] | None      # claves del pie generado; None si la página no lo tiene
    pie_heredado: set[str] | None      # etiquetas del pie escrito a mano; None si no hay pie
    afirmaciones: dict[str, list] = dataclasses.field(default_factory=dict)   # id → [línea, prosa]
    problemas: list[tuple[int, str]] = dataclasses.field(default_factory=list)
    textos: dict[str, str] = dataclasses.field(default_factory=dict)          # «M3» → su prosa
    registro: list[dict] = dataclasses.field(default_factory=list)            # sus entradas de contraste


def lee_pagina(ruta: pathlib.Path) -> Pagina:
    crudo = ruta.read_text("utf-8")
    nombre = nombre_corto(ruta)
    lector = LectorDeMarcadas()
    lector.feed(crudo)
    lector.close()

    generado = RE_PIE_GENERADO.search(crudo)
    pie_generado = set(re.findall(r'id="pie-([^"]+)"', generado.group(1))) if generado else None

    resto = RE_GENERADO.sub(lambda m: f" {MARCA} " if m.group("cita") else " ", crudo)
    guiones = I.RE_SCRIPT.findall(resto)
    resto = I.RE_SCRIPT.sub(" ", resto)
    pies = I.RE_PIE.findall(resto)
    resto = I.RE_PIE.sub(" ", resto)
    pie_heredado = None
    if pies and pie_generado is None:
        pie_heredado = {e for e in I.obras_en(I.plano(" ".join(pies))) if e in CITABLES}

    unidades: list[Unidad] = []

    def de_un_trozo(zona: str, trozo: str) -> None:
        for bloque in I.RE_BLOQUE.finditer(trozo):
            for li in I.RE_LI.finditer(bloque.group(1)):
                if (u := lee_entrada(nombre, zona, I.plano(li.group(1)))):
                    unidades.append(u)
        unidades.extend(lee_en_linea(nombre, zona, I.plano(I.RE_BLOQUE.sub(" ", trozo).replace(MARCA, " "))))

    textos = {}
    for m in RE_PLANTILLA.finditer(resto):
        de_un_trozo(f"M{m.group(1)}", m.group(2))
        textos[f"M{m.group(1)}"] = I.plano(m.group(2).replace(MARCA, " "))
    de_un_trozo("pagina", RE_PLANTILLA.sub(" ", resto))
    for guion in guiones:
        unidades.extend(lee_en_linea(nombre, "js", I.plano(guion.replace(MARCA, " "))))

    vistas: dict[str, int] = {}
    for u in unidades:                                # dos citas idénticas en la misma zona
        vistas[u.base] = vistas.get(u.base, 0) + 1
        u.orden = vistas[u.base]
    return Pagina(ruta, nombre, lector.citas, unidades, pie_generado, pie_heredado,
                  lector.afirmaciones, lector.problemas, textos)


# --------------------------------------------------------------------------- #
# Citas heredadas: comprobación
# --------------------------------------------------------------------------- #
def identidad(cat: Catalogo, etiqueta: str, edicion: str | None = None) -> str:
    """La clave de cita de una obra nombrada a mano, o su etiqueta si no tiene clave."""
    if etiqueta == "lohr":
        if edicion == "2":
            return "lohr (2.ª ed.)"
        return LOHR["1"] if edicion == "1" else LOHR["3"]
    return cat.claves.get(etiqueta) or etiqueta


def comprueba_unidad(cat: Catalogo, u: Unidad) -> list[Hallazgo]:
    h: list[Hallazgo] = []

    def falla(codigo: str, obra: str, detalle: str, que: str) -> None:
        h.append(Hallazgo(codigo, u.donde, que, base=f"{u.base}|{codigo}|{obra}|{detalle}"))

    if u.anio_lohr and u.anio_lohr != ANIO_DE_LOHR_EN_EL_CATALOGO and u.anio_lohr in ("2021",):
        falla("L3", "lohr", f"año {u.anio_lohr}",
              f"cita a Lohr como de {u.anio_lohr}; en el catálogo la 3.ª ed. es de "
              f"{ANIO_DE_LOHR_EN_EL_CATALOGO}")
    for t in u.tramos:
        if t.obra == "?":
            falla("L1", "?", "sin obra", "no se reconoce a qué obra remite esta entrada")
            continue
        for l in t.locs:
            if l.canon is None:
                falla("V1", t.obra, l.crudo, f"«{l.crudo}» no se puede llevar al vocabulario de localizadores")
        locs = [l for l in t.locs if l.canon]
        if not locs:
            continue
        if t.obra != "lohr":
            clave = cat.claves.get(t.obra)
            if not cat.tiene_ejemplar(clave):
                lista = ", ".join(dict.fromkeys(l.canon for l in locs))
                falla("L4", t.obra, "localizador",
                      f"«{t.obra}» no tiene ejemplar registrado y se cita con localizador ({lista})")
                continue
            grupos = {clave: locs}
        else:
            grupos: dict[str, list[Loc]] = {}
            segunda = [l for l in locs if l.edicion == "2"]
            if segunda:
                en_la_primera = [l.canon for l in segunda if not cat.resuelve(LOHR["1"], l.canon)]
                pista = (f"; {len(en_la_primera)} de {len(segunda)} existen con ese número en la 1.ª"
                         if LOHR["1"] in cat.indices else "")
                falla("L3", "lohr", "2.ª ed.",
                      "cita la 2.ª ed. de Lohr, de la que no hay ejemplar ("
                      + ", ".join(dict.fromkeys(l.canon for l in segunda)) + ")" + pista)
            for l in locs:
                for ed in {"ambas": ("1", "3"), "2": ()}.get(l.edicion or "3", (l.edicion or "3",)):
                    grupos.setdefault(LOHR[ed], []).append(l)
        for clave, suyos in grupos.items():
            for l in suyos:
                if l.tipo == "ej":                    # «ej.» casi siempre es «ejemplo»… casi
                    numero = l.canon.split(" ")[1]
                    motivo = cat.resuelve(clave, f"ejemplo {numero}")
                    if motivo and not cat.resuelve(clave, f"ejercicio {numero}"):
                        falla("V1", t.obra, l.canon,
                              f"«{l.crudo}»: en «{clave}» no hay ejemplo {numero} y sí ejercicio {numero}; "
                              "la abreviatura «ej.» es ambigua")
                        continue
                else:
                    motivo = cat.resuelve(clave, l.canon)
                if motivo:
                    falla("L2", t.obra, f"{clave} {l.canon}", motivo)
            limpios = [l.canon for l in suyos if l.tipo != "ej"]
            if not any(x.codigo == "L2" for x in h) and (motivo := paginas_fuera_de_seccion(cat, clave, limpios)):
                falla("L2", t.obra, f"{clave} páginas", motivo)
    return h


def obras_de(cat: Catalogo, u: Unidad) -> set[str]:
    """Las obras que una cita heredada cita, como claves (o etiquetas, si no tienen clave).

    Cuenta la obra que encabeza la entrada y las que llevan localizador: un autor nombrado de
    paso dentro de la entrada de otro («los elefantes de Basu») es una cita de segunda mano, y
    en la lista de referencias va la obra que se leyó.
    """
    obras = set()
    for n, t in enumerate(u.tramos):
        if t.obra == "?" or (n > 0 and not t.locs):
            continue
        for ed in ({l.edicion for l in t.locs} or {None}):
            for una in (("1", "3") if ed == "ambas" else (ed,)):
                obras.add(identidad(cat, t.obra, una))
    return obras


def citadas_en(cat: Catalogo, p: Pagina) -> set[str]:
    citadas = {c.via or c.clave for c in p.marcadas if (c.via or c.clave)}
    for u in p.unidades:
        citadas |= obras_de(cat, u)
    return citadas


def comprueba_pie(cat: Catalogo, p: Pagina) -> list[Hallazgo]:
    citadas = citadas_en(cat, p)
    if not citadas:
        return []          # una página que no cita nada (la portada, un simulacro) no se juzga aquí
    if p.pie_generado is not None:
        pie, admisible = p.pie_generado, False
    elif p.pie_heredado is not None:
        pie, admisible = {identidad(cat, e) for e in p.pie_heredado}, True
    else:
        if p.marcadas:
            return [Hallazgo("L7", p.nombre, "la página tiene citas marcadas y no tiene pie de referencias")]
        return []
    h = []
    for obra in sorted(citadas - pie):
        h.append(Hallazgo("L7", f"{p.nombre} · pie", f"«{obra}» se cita en la página y no está en el pie",
                          base=f"{p.nombre}|pie|L7|falta|{obra}" if admisible else None))
    for obra in sorted(pie - citadas):
        h.append(Hallazgo("L7", f"{p.nombre} · pie", f"«{obra}» está en el pie y la página no la cita",
                          base=f"{p.nombre}|pie|L7|sobra|{obra}" if admisible else None))
    return h


def comprueba_generado(cat: Catalogo, p: Pagina) -> list[Hallazgo]:
    """La otra mitad de L7: nadie tecleó el texto de una cita ni una entrada del pie."""
    if not p.marcadas and p.pie_generado is None:
        return []
    crudo = p.ruta.read_text("utf-8")
    try:
        debido = G.regenera_pagina(crudo, cat.dir)
    except G.ErrorDeCita as e:
        if any(c.clave not in cat.referencias or (c.via and c.via not in cat.referencias) for c in p.marcadas):
            return []                                  # ya lo dijo L1
        return [Hallazgo("L7", p.ruta.name, f"no se puede comprobar contra el generador: {e}")]
    if debido == crudo:
        return []
    h = []
    escritas = [m.group(0) for m in G.RE_CITA.finditer(crudo)]
    debidas = [m.group(0) for m in G.RE_CITA.finditer(debido)]
    malas = sum(a != b for a, b in zip(escritas, debidas))
    if malas:
        h.append(Hallazgo("L7", p.ruta.name, f"{malas} de {len(escritas)} citas no llevan el texto que escribe "
                                             "genera_referencias.py: córrelo y reensambla"))
    if G.RE_PIE.search(crudo) and G.RE_PIE.search(crudo).group(0) != G.RE_PIE.search(debido).group(0):
        h.append(Hallazgo("L7", p.ruta.name, "el pie de referencias no es el que escribe "
                                             "genera_referencias.py: córrelo y reensambla"))
    return h


def comprueba_catalogacion(cat: Catalogo, p: Pagina) -> list[Hallazgo]:
    """L1 de lo heredado, una vez por página y obra: decirlo en cada cita sería ruido."""
    cuenta: dict[str, int] = {}
    for u in p.unidades:
        for obra in obras_de(cat, u):
            if obra not in cat.referencias:
                cuenta[obra] = cuenta.get(obra, 0) + 1
    return [Hallazgo("L1", f"{p.nombre} · catálogo",
                     f"«{obra}» se cita {n} {'vez' if n == 1 else 'veces'} y no está en referencias.json",
                     base=f"{p.nombre}|catalogo|L1|{obra}")
            for obra, n in sorted(cuenta.items())]


# --------------------------------------------------------------------------- #
# Auditoría y línea base
# --------------------------------------------------------------------------- #
def paginas_del_sitio(sitio: pathlib.Path) -> list[pathlib.Path]:
    return sorted(sitio.glob("*.html")) + sorted((sitio / "muestreo").glob("*.html"))


def audita(dir_bib: pathlib.Path, dir_sitio: pathlib.Path, sin_corpus: bool = False
           ) -> tuple[list[Hallazgo], list[Pagina], Catalogo]:
    cat = Catalogo.carga(dir_bib)
    h = comprueba_catalogo(cat)
    paginas = [lee_pagina(r) for r in paginas_del_sitio(dir_sitio)]
    registros = C.lee_registros(dir_bib)

    def comprueba_loc(clave: str, loc: str) -> list[tuple[str, str]]:
        return [(x.codigo, x.que) for x in comprueba_marcada(cat, Marcada(clave, loc, "", None, 0), "")]

    for p in paginas:
        m = re.fullmatch(r"capitulo-(\d+)", p.nombre)
        nombre, entradas = registros.pop(int(m.group(1)), ("", [])) if m else ("", [])
        if m and (entradas or p.afirmaciones or any(c.loc for c in p.marcadas)):
            p.registro = entradas
            nombre = nombre or f"contraste/cap{m.group(1)}.yml"
            h += [Hallazgo(codigo, donde, que) for codigo, donde, que in
                  C.comprueba(cat, dir_bib, p, entradas, nombre, int(m.group(1)), comprueba_loc,
                              sin_corpus, cat.cuenta)]
        for c in p.marcadas:
            zona = f"M{c.modulo}" if c.modulo else "página"
            h += comprueba_marcada(cat, c, f"{p.ruta.name}:{c.linea} ({zona})")
        for u in p.unidades:
            h += comprueba_unidad(cat, u)
        h += comprueba_catalogacion(cat, p)
        h += comprueba_pie(cat, p)
        h += comprueba_generado(cat, p)
    for capitulo, (nombre, _) in sorted(registros.items()):
        h.append(Hallazgo("K1", nombre, f"hay registro del capítulo {capitulo} y no hay página de ese capítulo"))
    return h, paginas, cat


def lee_base(ruta: pathlib.Path) -> dict:
    base = F.lee_json(ruta) or {}
    return {"sin_marcar": base.get("sin_marcar", {}), "defectos": base.get("defectos", {})}


def contrasta(hallazgos: list[Hallazgo], paginas: list[Pagina], base: dict):
    """(fallas, conocidos, base de hoy). Lo conocido no falla; lo nuevo y lo rancio, sí."""
    unidades = {u.base: u for p in paginas for u in p.unidades}
    admisibles = {x.base: x for x in hallazgos if x.base}
    fallas = [x for x in hallazgos if x.base is None]
    for clave, u in unidades.items():
        if clave not in base["sin_marcar"]:
            fallas.append(Hallazgo("M1", u.donde, "cita sin marcar que no está en la línea base: "
                                                  "las citas nuevas entran marcadas", base=clave))
    for clave, x in admisibles.items():
        if clave not in base["defectos"]:
            fallas.append(x)
    for seccion, vivos in (("sin_marcar", unidades), ("defectos", admisibles)):
        for clave, texto in base[seccion].items():
            if clave not in vivos:
                fallas.append(Hallazgo("B1", clave, f"la línea base guarda esto y ya no existe «{texto}»: "
                                                    "retírese con --anota", base=clave))
    conocidos = [x for clave, x in admisibles.items() if clave in base["defectos"]]
    hoy = {"sin_marcar": {k: u.texto[:110] for k, u in unidades.items()},
           "defectos": {k: f"[{x.codigo}] {x.que}"[:200] for k, x in admisibles.items()}}
    return fallas, conocidos, hoy


LEEME_BASE = ("Línea base con trinquete de precalculo/verifica_citas.py: las citas escritas a mano que el "
              "material ya traía y sus defectos conocidos. Solo puede encoger. No se edita a mano: "
              "`--anota` retira lo arreglado y `--anota --admite` añade lo nuevo, después de revisarlo.")


def anota(ruta: pathlib.Path, base: dict, hoy: dict, admite: bool) -> tuple[int, int]:
    """Escribe la línea base. Devuelve (entradas retiradas, entradas añadidas)."""
    retiradas = anadidas = 0
    nueva = {"_leeme": LEEME_BASE}
    for seccion in ("sin_marcar", "defectos"):
        queda = {k: v for k, v in base[seccion].items() if k in hoy[seccion]}
        retiradas += len(base[seccion]) - len(queda)
        if admite:
            for k, v in hoy[seccion].items():
                if k not in queda:
                    queda[k] = v
                    anadidas += 1
        nueva[seccion] = queda
    F.escribe_json(ruta, nueva)
    return retiradas, anadidas


# --------------------------------------------------------------------------- #
# Contrato curso → vault
# --------------------------------------------------------------------------- #
def uso_de_fuentes(paginas: list[Pagina], cat: Catalogo, curso: int) -> dict:
    """Lo único que el vault lee de este curso (norma, «Contrato curso → vault»).

    `sin_marcar` es un campo adicional: las citas heredadas de cada obra, que aún no cuentan
    como `citas` porque nadie las ha contrastado.
    """
    obras = {clave: {"rol": (cat.candado.get(clave) or {}).get("rol"),
                     "ejemplar": cat.tiene_ejemplar(clave),
                     "edicion_comprobada": (cat.ejemplares.get(clave) or {}).get("edicion_comprobada"),
                     "capitulos": set(), "citas": 0, "afirmaciones": {}, "sin_marcar": 0}
             for clave in sorted(cat.referencias)}
    for p in paginas:
        m = re.match(r"capitulo-(\d+)", p.nombre)
        capitulo = int(m.group(1)) if m else None
        for c in p.marcadas:
            if c.clave in obras:
                obras[c.clave]["citas"] += 1
                if capitulo:
                    obras[c.clave]["capitulos"].add(capitulo)
        for u in p.unidades:
            for clave in obras_de(cat, u):
                if clave in obras:
                    obras[clave]["sin_marcar"] += 1
                    if capitulo:
                        obras[clave]["capitulos"].add(capitulo)
        for e in p.registro:
            for clave in {f.get("clave") for f in e.get("fuentes") or []}:
                if clave in obras:
                    cuenta = obras[clave]["afirmaciones"]
                    cuenta[e.get("veredicto")] = cuenta.get(e.get("veredicto"), 0) + 1
                    obras[clave]["capitulos"].add(capitulo)
    for o in obras.values():
        o["capitulos"] = sorted(o["capitulos"])
    return {"norma": 1, "curso": curso, "obras": obras}


def escribe_uso(dir_bib: pathlib.Path, paginas: list[Pagina], cat: Catalogo, comprobar: bool) -> int:
    ruta = dir_bib / "uso_fuentes.json"
    nuevo = uso_de_fuentes(paginas, cat, CURSO)
    viejo = json.loads(ruta.read_text("utf-8")) if ruta.exists() else {}
    igual = {k: v for k, v in viejo.items() if k != "generado"} == nuevo
    if comprobar:
        print("OK     uso_fuentes.json está al día" if igual
              else "FALLA  uso_fuentes.json no está al día: python3 precalculo/verifica_citas.py --uso")
        return 0 if igual else 1
    if igual:
        print("OK     uso_fuentes.json: sin cambios")
        return 0
    salida = {"norma": nuevo["norma"], "curso": nuevo["curso"],
              "generado": dt.date.today().isoformat(), "obras": nuevo["obras"]}
    ruta.write_text(json.dumps(salida, ensure_ascii=False, indent=2) + "\n", "utf-8")
    usadas = sum(1 for o in nuevo["obras"].values() if o["citas"] or o["sin_marcar"])
    print(f"OK     uso_fuentes.json: {len(nuevo['obras'])} obras, {usadas} en uso")
    return 0


# --------------------------------------------------------------------------- #
def cuadro(paginas: list[Pagina], conocidos: list[Hallazgo]) -> None:
    codigos = [c for c in ("L1", "L2", "L3", "L4", "L7", "V1") if any(x.codigo == c for x in conocidos)]
    print(f"\n{'página':<34}{'marcadas':>9}{'sin marcar':>11}" + "".join(f"{c:>5}" for c in codigos))
    for p in paginas:
        if not p.marcadas and not p.unidades:
            continue
        suyos = [x for x in conocidos if x.base.startswith(p.nombre + "|")]
        fila = "".join(f"{sum(x.codigo == c for x in suyos) or '·':>5}" for c in codigos)
        print(f"{p.nombre:<34}{len(p.marcadas) or '·':>9}{len(p.unidades) or '·':>11}{fila}")
    total = "".join(f"{sum(x.codigo == c for x in conocidos):>5}" for c in codigos)
    print(f"{'total':<34}{sum(len(p.marcadas) for p in paginas):>9}"
          f"{sum(len(p.unidades) for p in paginas):>11}{total}")
    for c in codigos:
        print(f"  {c}  {NOMBRES[c]}")


def muestra_lectura(paginas: list[Pagina]) -> None:
    for p in paginas:
        for u in p.unidades:
            print(f"{u.pagina} {u.zona} [{u.origen}] {u.texto[:150]}")
            for t in u.tramos:
                locs = ", ".join(f"{l.canon or '¿' + l.crudo + '?'}"
                                 + (f" ({l.edicion})" if l.edicion else "") for l in t.locs)
                print(f"      {t.obra}: {locs or '—'}")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    ap.add_argument("--bib", type=pathlib.Path, default=F.BIB)
    ap.add_argument("--sitio", type=pathlib.Path, default=RAIZ / "sitio")
    ap.add_argument("--todo", action="store_true", help="lista también los defectos ya conocidos")
    ap.add_argument("--lee", action="store_true", help="muestra cómo se leyó cada cita heredada")
    ap.add_argument("--anota", action="store_true", help="retira de la línea base lo que ya no existe")
    ap.add_argument("--admite", action="store_true",
                    help="con --anota: añade lo nuevo a la línea base (revisar ANTES)")
    ap.add_argument("--uso", action="store_true", help="escribe bibliografia/uso_fuentes.json")
    ap.add_argument("--uso-comprobar", action="store_true",
                    help="sale con 1 si uso_fuentes.json no está al día")
    ap.add_argument("--sin-corpus", action="store_true",
                    help="en un clon sin los ejemplares: R4 informa de lo que no puede comprobar, no falla")
    ap.add_argument("--cierre", type=int, nargs="?", const=0, metavar="CAP",
                    help="falla si queda algo pendiente, por reverificar o que discrepa (en ese capítulo, o en todos)")
    ap.add_argument("--huella", metavar="ID", help="imprime la huella actual de una afirmación (`data-afirma`)")
    ap.add_argument("--pasaje", nargs=3, metavar=("CLAVE", "LUGAR", "TEXTO"),
                    help="comprueba que el pasaje está en esa página impresa (un número) o en esa instantánea "
                         "web (su nombre), lo guarda fuera de git y da su huella")
    args = ap.parse_args()
    if args.admite and not args.anota:
        ap.error("--admite solo tiene sentido con --anota")

    if args.pasaje:
        clave, lugar, literal = args.pasaje
        if not lugar.isdigit():
            sello = C.guarda_pasaje_web(args.bib, clave, lugar, literal)
            print(f"OK     el pasaje está en la instantánea «{lugar}» de «{clave}»\n"
                  f"       instantanea: {lugar}\n       hash_pasaje: {sello}")
            return 0
        desfase = (F.lee_yaml(args.bib / "ejemplares.yml").get(clave) or {}).get("desfase") or 0
        sello = C.guarda_pasaje(args.bib, clave, int(lugar), desfase, literal)
        print(f"OK     el pasaje está en la p. {lugar} de «{clave}»\n       pagina: {lugar}\n       hash_pasaje: {sello}")
        return 0

    hallazgos, paginas, cat = audita(args.bib, args.sitio, sin_corpus=args.sin_corpus)
    if args.huella:
        for p in paginas:
            if args.huella in p.afirmaciones:
                linea, prosa = p.afirmaciones[args.huella]
                print(f"{args.huella}  {C.huella(prosa)}  ({p.ruta.name}:{linea})\n  prosa: {C.normaliza(prosa)}")
                return 0
        print(f"FALLA  no hay ninguna `data-afirma=\"{args.huella}\"`")
        return 1
    if args.uso or args.uso_comprobar:
        return escribe_uso(args.bib, paginas, cat, comprobar=args.uso_comprobar)
    if args.lee:
        muestra_lectura(paginas)
        return 0

    ruta_base = args.bib / NOMBRE_BASE
    base = lee_base(ruta_base)
    fallas, conocidos, hoy = contrasta(hallazgos, paginas, base)

    if args.anota:
        retiradas, anadidas = anota(ruta_base, base, hoy, args.admite)
        print(f"Línea base: {retiradas} entradas retiradas, {anadidas} añadidas → "
              f"{ruta_base.relative_to(args.bib.parent)}. Revisa el diff antes de commitear.")
        base = lee_base(ruta_base)
        fallas, conocidos, hoy = contrasta(hallazgos, paginas, base)

    if args.todo:
        for x in conocidos:
            print(f"conocido  {x}")
    for x in fallas:
        print(f"FALLA  {x}")
    cuadro(paginas, conocidos)
    print(f"\n{len(base['sin_marcar'])} citas sin marcar y {len(base['defectos'])} defectos en la línea base"
          f" · {sum(len(p.marcadas) for p in paginas)} citas marcadas")
    v = cat.cuenta["veredictos"]
    if v:
        print(f"{sum(v.values())} afirmaciones en el registro de contraste: "
              + " · ".join(f"{k} {v[k]}" for k in sorted(v))
              + f" · pasajes comprobados en el ejemplar: {cat.cuenta['comprobadas']}"
              + (f" · sin corpus aquí: {cat.cuenta['sin_corpus']}" if cat.cuenta["sin_corpus"] else ""))
    if args.cierre is not None:
        abiertas = [e for p in paginas for e in p.registro if e.get("veredicto") in C.ABIERTOS
                    and (not args.cierre or p.nombre == f"capitulo-{args.cierre}")]
        if abiertas:
            donde = f"en el capítulo {args.cierre}" if args.cierre else "en el registro"
            print(f"FALLA  [cierre] quedan {len(abiertas)} afirmaciones pendientes, por reverificar o que "
                  f"discrepan {donde}: " + ", ".join(str(e.get("id")) for e in abiertas[:12])
                  + ("…" if len(abiertas) > 12 else ""))
            return 1
    print("OK     citas: nada nuevo respecto de la línea base" if not fallas
          else f"FALLA  {len(fallas)} hallazgos")
    return 1 if fallas else 0


if __name__ == "__main__":
    sys.exit(main())
