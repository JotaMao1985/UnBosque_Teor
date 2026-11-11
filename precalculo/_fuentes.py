"""
_fuentes.py — lo que comparten los guiones de la capa de fuentes

Material de Muestreo Estadístico 2026-II (20939). Norma: Vault/Estandar/Capa de fuentes.md.

Dónde vive cada cosa:

  bibliografia/ejemplares.yml        en git   la HUELLA de cada ejemplar: sha256, páginas, edición
                                              comprobada contra la portada, desfase, procedencia
  bibliografia/indices/<clave>.json  en git   índice delgado: qué localizadores existen y en qué
                                              páginas. Sin títulos y sin texto
  bibliografia/_local/               fuera    todo lo que tiene derechos de autor:
      rutas.json                              clave → dónde está el ejemplar en este equipo
      texto/<clave>/p0001.txt                 el texto, una página impresa por archivo
      indices/<clave>.json                    el índice completo, con títulos

Las claves de cita siguen la regla de la norma (apellido + año + primera palabra del título).
Mientras no exista bibliografia/claves.json son provisionales: si `exporta_zotero.py` asigna
otra, se renombra aquí.
"""
from __future__ import annotations

import hashlib
import json
import pathlib
import re

import yaml

RAIZ = pathlib.Path(__file__).resolve().parent.parent
BIB = RAIZ / "bibliografia"
LOCAL = BIB / "_local"
INDICES = BIB / "indices"
EJEMPLARES = BIB / "ejemplares.yml"
RUTAS = LOCAL / "rutas.json"

# Los campos que se llenan a mano mirando la portada; ningún guion los pisa.
MANUALES = ("edicion_comprobada", "desfase", "procedencia")

CABECERA_EJEMPLARES = (
    "# Ejemplares leídos: la huella de cada archivo, nunca el archivo.\n"
    "# `archivo`, `formato`, `sha256`, `paginas` y `paginas_sin_texto` los escribe extrae_fuente.py.\n"
    "# `edicion_comprobada`, `desfase` (página del archivo − página impresa) y `procedencia`\n"
    "# se llenan a mano mirando la portada; los guiones los respetan.\n"
)

# Vocabulario cerrado de localizadores (norma, «Vocabulario de localizadores»).
RE_LOCALIZADOR = re.compile(
    r"^(?:cap\. \d+|§[\dA-Z]+(?:\.\d+)*|ejemplo [\dA-Z]+\.\d+|(?:ejercicio|problema) [\dA-Z]+\.\d+"
    r"|ec\. [\dA-Z]+\.\d+|tabla [\dA-Z]+\.\d+|fig\. [\dA-Z]+\.\d+|pp?\. \d+(?:–\d+)?|ap\. [A-Z])$"
)


def sha256(ruta: pathlib.Path) -> str:
    h = hashlib.sha256()
    with ruta.open("rb") as f:
        for bloque in iter(lambda: f.read(1 << 20), b""):
            h.update(bloque)
    return h.hexdigest()


def lee_yaml(ruta: pathlib.Path) -> dict:
    return (yaml.safe_load(ruta.read_text("utf-8")) or {}) if ruta.exists() else {}


def escribe_yaml(ruta: pathlib.Path, dato: dict, cabecera: str) -> None:
    ruta.parent.mkdir(parents=True, exist_ok=True)
    ruta.write_text(cabecera + yaml.safe_dump(dato, allow_unicode=True, sort_keys=True, width=100), "utf-8")


def lee_json(ruta: pathlib.Path) -> dict:
    return json.loads(ruta.read_text("utf-8")) if ruta.exists() else {}


def escribe_json(ruta: pathlib.Path, dato) -> None:
    ruta.parent.mkdir(parents=True, exist_ok=True)
    ruta.write_text(json.dumps(dato, ensure_ascii=False, indent=1, sort_keys=True) + "\n", "utf-8")


def ruta_del_ejemplar(clave: str) -> pathlib.Path | None:
    """Dónde está el ejemplar en este equipo, o None. Comprueba que sea el que se registró."""
    ruta = lee_json(RUTAS).get(clave)
    if not ruta or not pathlib.Path(ruta).is_file():
        return None
    return pathlib.Path(ruta)


def huella_registrada(clave: str) -> str | None:
    return (lee_yaml(EJEMPLARES).get(clave) or {}).get("sha256")


def orden_de_pagina(etiqueta: str):
    """Ordena «xv» antes que «1», y los números como números."""
    return (1, int(etiqueta)) if etiqueta.isdigit() else (0, etiqueta)


def nombre_de_pagina(etiqueta: str) -> str:
    return f"p{int(etiqueta):04d}.txt" if etiqueta.isdigit() else f"r_{etiqueta}.txt"


def guarda_paginas(clave: str, paginas: dict[str, str]) -> pathlib.Path:
    """Escribe el texto por página en _local/texto/<clave>/, borrando lo que hubiera."""
    destino = LOCAL / "texto" / clave
    destino.mkdir(parents=True, exist_ok=True)
    for viejo in destino.glob("*.txt"):
        viejo.unlink()
    for etiqueta, texto in paginas.items():
        (destino / nombre_de_pagina(etiqueta)).write_text(texto, "utf-8")
    return destino


def guarda_indice(clave: str, calidad: str, extractor: str, loc: dict[str, dict],
                  paginas: list[int] | None = None) -> dict:
    """Escribe el índice completo (fuera de git) y el delgado (en git).

    `loc` es {localizador: {"p": [desde, hasta], "t": título opcional}}. Al delgado solo van
    los localizadores y sus páginas. `paginas` es el tramo de páginas impresas del ejemplar
    ENTERO, con su lista de referencias y sus índices: una cita por página puede caer ahí.
    """
    malos = [k for k in loc if not RE_LOCALIZADOR.match(k)]
    if malos:
        raise SystemExit(f"FALLA  localizadores fuera del vocabulario de la norma: {malos[:5]}")
    numericas = [p for v in loc.values() for p in v["p"] if isinstance(p, int)]
    base = {
        "clave": clave,
        "calidad": calidad,
        "extractor": extractor,
        "ejemplar_sha256": huella_registrada(clave),
        "paginas": paginas or ([min(numericas), max(numericas)] if numericas else None),
    }
    escribe_json(LOCAL / "indices" / f"{clave}.json", {**base, "loc": loc})
    delgado = {**base, "loc": {k: v["p"] for k, v in loc.items()}}
    escribe_json(INDICES / f"{clave}.json", delgado)
    return delgado
