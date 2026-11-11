"""
_contraste.py — el registro de contraste: qué se afirma, de qué obra, y quién lo leyó

Material de Muestreo Estadístico 2026-II (20939). Tarea GD-D3 de PLAN_Gestion_Documental.md.
Norma: Vault/Estandar/Capa de fuentes.md («Registro de contraste»).

`verifica_citas.py` comprueba que un localizador EXISTA. Que diga lo que la frase le atribuye
solo se sabe leyendo, y este registro es la constancia de esa lectura: una entrada por cada
afirmación que exige fuente, en `bibliografia/contraste/capN.yml`.

    afirmaciones:
    - id: c1-m1-03                 # c<capítulo>-m<módulo>-<nn>; no cambia nunca
      tipo: dato                   # definicion · resultado · regla · historica · atribucion · dato
      afirmacion: >-               # con palabras propias: qué dice el material
        El Digest envió diez millones de papeletas en 1936.
      ancla: envió diez millones de papeletas      # literal de la prosa del material, o bien
      hash_texto: 3f9a…            # huella de la prosa envuelta por `data-afirma="c1-m1-03"`
      veredicto: respaldada        # respaldada · con-matiz · discrepa · propia · pendiente · por-reverificar
      motivo: …                    # obligatorio en `pendiente` y `discrepa`
      matiz: …                     # obligatorio en `con-matiz`: en qué difiere la fuente
      redactado_por: material-2026-II
      verificado_por: verificador-opus-01          # nunca quien redactó
      fecha: 2026-11-10
      fuentes:
      - clave: lohr2022sampling
        loc: ejemplo 1.1           # vocabulario cerrado de la norma
        pagina: 1                  # página impresa del ejemplar donde está el pasaje
        hash_pasaje: 0c1d…         # huella del pasaje leído

El repositorio es público, así que el pasaje literal NO va aquí: vive en
`bibliografia/_local/pasajes.yml` (huella → texto), fuera de git, y en el registro queda el
puntero —obra, localizador, página— y la huella. Con el corpus delante, el auditor busca el
pasaje en esa página del ejemplar; sin él dice «no comprobable aquí», que no es aprobar.

El ancla tiene dos formas. Mientras un módulo no se migra, es un literal de su prosa (`ancla`):
no hay que tocar el HTML para empezar a registrar. Al migrarlo, la afirmación se envuelve con
`data-afirma` y manda la huella (`hash_texto`). En los dos casos, si la prosa cambia la entrada
deja de valer hasta que alguien la vuelve a leer.

En una entrada `pendiente`, `fuentes` dice dónde mirar; no respalda nada y no se valida.
"""
from __future__ import annotations

import datetime as dt
import hashlib
import pathlib
import re
import unicodedata

import _fuentes as F

TIPOS = {"definicion", "resultado", "regla", "historica", "atribucion", "dato"}
VEREDICTOS = {"respaldada", "con-matiz", "discrepa", "propia", "pendiente", "por-reverificar"}
CITABLES = {"respaldada", "con-matiz"}
ABIERTOS = {"pendiente", "por-reverificar", "discrepa"}
RE_ID = re.compile(r"^c(\d+)-m(\d+)-(\d{2,})$")
MIN_PALABRAS_PASAJE = 5

CABECERA_PASAJES = (
    "# Pasajes leídos, por su huella. Tienen derechos de autor: este archivo vive en\n"
    "# bibliografia/_local/ y no entra a git. Lo escribe `verifica_citas.py --pasaje`.\n"
)


# --------------------------------------------------------------------------- #
def normaliza(texto: str) -> str:
    """Forma canónica para comparar un pasaje con el texto de la fuente, o una prosa consigo misma."""
    t = unicodedata.normalize("NFKC", texto)
    t = re.sub(r"[‐‑‒–—−]", "-", t)
    t = re.sub(r"[“”„«»]", '"', t)
    t = re.sub(r"[‘’‚`´]", "'", t)
    t = re.sub(r"(?<=\w)-\s*\n\s*(?=\w)", "", t)      # palabra par-\ntida
    t = re.sub(r"\s+", " ", t)
    return t.strip()


def huella(texto: str) -> str:
    return hashlib.sha256(normaliza(texto).encode("utf-8")).hexdigest()[:16]


def lee_registros(dir_bib: pathlib.Path) -> dict[int, tuple[str, list[dict]]]:
    """{capítulo: (nombre del archivo, entradas)} de bibliografia/contraste/capN.yml."""
    fuera = {}
    for ruta in sorted((dir_bib / "contraste").glob("cap*.yml")):
        capitulo = int(re.search(r"cap(\d+)", ruta.name).group(1))
        fuera[capitulo] = (f"contraste/{ruta.name}", (F.lee_yaml(ruta).get("afirmaciones") or []))
    return fuera


def lee_pasajes(dir_bib: pathlib.Path) -> dict[str, str]:
    return F.lee_yaml(dir_bib / "_local" / "pasajes.yml")


def texto_del_ejemplar(dir_bib: pathlib.Path, clave: str, pagina: int, desfase: int) -> str | None:
    """El texto de una página impresa y de la siguiente (un pasaje puede cruzar el salto)."""
    base = dir_bib / "_local" / "texto" / clave
    primera = base / F.nombre_de_pagina(str(pagina + desfase))
    if not primera.is_file():
        return None
    siguiente = base / F.nombre_de_pagina(str(pagina + desfase + 1))
    return primera.read_text("utf-8") + "\n" + (siguiente.read_text("utf-8") if siguiente.is_file() else "")


def guarda_pasaje(dir_bib: pathlib.Path, clave: str, pagina: int, desfase: int, literal: str) -> str:
    """Comprueba que el pasaje está en esa página del ejemplar, lo guarda fuera de git y da su huella."""
    texto = texto_del_ejemplar(dir_bib, clave, pagina, desfase)
    if texto is None:
        raise SystemExit(f"FALLA  no hay texto de la p. {pagina} de «{clave}» en bibliografia/_local/texto/")
    if len(literal.split()) < MIN_PALABRAS_PASAJE:
        raise SystemExit(f"FALLA  el pasaje tiene menos de {MIN_PALABRAS_PASAJE} palabras: no sirve de evidencia")
    if normaliza(literal) not in normaliza(texto):
        raise SystemExit(f"FALLA  el pasaje NO está en la p. {pagina} de «{clave}» (ni a caballo de la siguiente)")
    ruta = dir_bib / "_local" / "pasajes.yml"
    pasajes = F.lee_yaml(ruta)
    pasajes[huella(literal)] = normaliza(literal)
    F.escribe_yaml(ruta, pasajes, CABECERA_PASAJES)
    return huella(literal)


# --------------------------------------------------------------------------- #
# Comprobaciones. Devuelven (código, dónde, qué).
# --------------------------------------------------------------------------- #
def esquema(entradas: list[dict], nombre: str, capitulo: int) -> list[tuple[str, str, str]]:
    h, vistos = [], set()
    for e in entradas:
        ident = str(e.get("id", "¿sin id?"))
        donde = f"{nombre} · {ident}"
        m = RE_ID.match(ident)
        if not m:
            h.append(("R1", donde, "el id no tiene la forma c<cap>-m<mod>-<nn>"))
        elif int(m.group(1)) != capitulo:
            h.append(("R1", donde, f"el id es de otro capítulo (este registro es del {capitulo})"))
        if ident in vistos:
            h.append(("R1", donde, "id repetido en el registro"))
        vistos.add(ident)
        for campo in ("afirmacion", "redactado_por"):
            if e.get(campo) in (None, ""):
                h.append(("R1", donde, f"falta `{campo}`"))
        if e.get("tipo") not in TIPOS:
            h.append(("R1", donde, f"`tipo` desconocido: {e.get('tipo')!r}"))
        veredicto = e.get("veredicto")
        if veredicto not in VEREDICTOS:
            h.append(("R1", donde, f"`veredicto` desconocido: {veredicto!r}"))
        if not isinstance(e.get("fecha"), dt.date):
            h.append(("R1", donde, "`fecha` no es una fecha AAAA-MM-DD"))
        if not e.get("ancla") and not e.get("hash_texto"):
            h.append(("R1", donde, "no tiene ancla: ni `ancla` (literal de la prosa) ni `hash_texto`"))
        if veredicto in ("pendiente", "discrepa") and not e.get("motivo"):
            h.append(("R1", donde, f"veredicto `{veredicto}` sin `motivo`"))
        if veredicto == "con-matiz" and not e.get("matiz"):
            h.append(("R1", donde, "veredicto `con-matiz` sin `matiz`: hay que decir en qué difiere la fuente"))
        if veredicto not in CITABLES:
            continue
        fuentes = e.get("fuentes") or []
        if not fuentes:
            h.append(("R1", donde, f"veredicto `{veredicto}` sin ninguna fuente"))
        for n, f in enumerate(fuentes, start=1):
            aqui = f"{donde} · fuente {n}"
            for campo in ("clave", "loc", "hash_pasaje"):
                if not f.get(campo):
                    h.append(("R1", aqui, f"falta `{campo}`"))
            if not isinstance(f.get("pagina"), int):
                h.append(("R1", aqui, "falta `pagina` (la página impresa del pasaje, un entero)"))
    return h


def _paginas_de_la_cita(cat, clave: str, loc: str) -> list[tuple[int, int]]:
    """Los tramos de páginas que nombra un localizador: los suyos, o los de su sección."""
    tramos = []
    for parte in str(loc).split("; "):
        m = re.fullmatch(r"pp?\. (\d+)(?:–(\d+))?", parte)
        if m:
            tramos.append((int(m.group(1)), int(m.group(2) or m.group(1))))
        elif (p := cat.paginas_de(clave, parte)):
            tramos.append((p[0] - 1, p[-1] + 1))     # el índice sitúa el encabezado, no el renglón
    return tramos


def evidencia(cat, dir_bib: pathlib.Path, f: dict, pasajes: dict[str, str], sin_corpus: bool,
              cuenta: dict) -> str | None:
    """None si el pasaje registrado está en esa página del ejemplar; si no, por qué no."""
    clave, pagina, sello = f.get("clave"), f.get("pagina"), f.get("hash_pasaje")
    if not (clave and isinstance(pagina, int) and sello):
        return None                                  # ya lo dijo el esquema
    tramos = _paginas_de_la_cita(cat, clave, f.get("loc") or "")
    if tramos and not any(a <= pagina <= b for a, b in tramos):
        return f"la p. {pagina} no cae en «{f.get('loc')}» de «{clave}»: el pasaje y el localizador no casan"
    literal = pasajes.get(sello)
    desfase = (cat.ejemplares.get(clave) or {}).get("desfase") or 0
    texto = texto_del_ejemplar(dir_bib, clave, pagina, desfase)
    if literal is None or texto is None:
        cuenta["sin_corpus"] += 1
        if sin_corpus:
            return None
        falta = "el pasaje" if literal is None else f"el texto de la p. {pagina}"
        return (f"falta {falta} de «{clave}» en bibliografia/_local/: no comprobable aquí "
                "(con --sin-corpus se informa y no falla)")
    if huella(literal) != sello:
        return "el pasaje guardado en _local/pasajes.yml no es el que se registró (huella distinta)"
    if len(literal.split()) < MIN_PALABRAS_PASAJE:
        return f"el pasaje tiene menos de {MIN_PALABRAS_PASAJE} palabras: no sirve de evidencia"
    if normaliza(literal) not in normaliza(texto):
        return f"el pasaje NO está en la p. {pagina} de «{clave}»"
    cuenta["comprobadas"] += 1
    return None


def comprueba(cat, dir_bib: pathlib.Path, pagina, entradas: list[dict], nombre: str, capitulo: int,
              comprueba_loc, sin_corpus: bool, cuenta: dict) -> list[tuple[str, str, str]]:
    """Todo lo del registro de un capítulo contra su página.

    `pagina` trae `afirmaciones` ({id: (línea, texto)}), `marcadas` (con `.afirma`), `textos`
    ({«M3»: prosa del módulo}) y `problemas`. `comprueba_loc(clave, loc)` son las mismas
    comprobaciones L1, L2, L4 y V1 de una cita marcada.
    """
    h = esquema(entradas, nombre, capitulo)
    por_id = {str(e.get("id")): e for e in entradas}
    archivo = pagina.ruta.name
    pasajes = lee_pasajes(dir_bib)

    for linea, que in pagina.problemas:
        h.append(("R2", f"{archivo}:{linea}", que))
    for ident, (linea, _) in pagina.afirmaciones.items():
        if ident not in por_id:
            h.append(("R2", f"{archivo}:{linea}", f"`data-afirma=\"{ident}\"` no tiene entrada en {nombre}"))

    # Cada cita marcada con localizador cuelga de una afirmación que alguien leyó.
    for c in pagina.marcadas:
        if not c.loc:
            continue                                  # lectura recomendada: no afirma nada concreto
        donde = f"{archivo}:{c.linea}"
        if not c.afirma:
            h.append(("R2", donde, f"la cita de «{c.clave}» lleva localizador y no está dentro de ninguna "
                                   "afirmación (`data-afirma`): nadie consta que la haya leído"))
            continue
        e = por_id.get(c.afirma)
        if not e:
            continue
        if e.get("veredicto") not in CITABLES:
            h.append(("L6", donde, f"cita con localizador sobre {c.afirma}, cuyo veredicto es "
                                   f"`{e.get('veredicto')}`"))
        leida = c.via or c.clave
        if not any(f.get("clave") == leida and str(f.get("loc")) == c.loc for f in e.get("fuentes") or []):
            h.append(("R2", donde, f"la cita ({leida}, «{c.loc}») no coincide con ninguna fuente de {c.afirma}"))

    for ident, e in por_id.items():
        donde = f"{nombre} · {ident}"
        veredicto = e.get("veredicto")
        cuenta["veredictos"][veredicto] = cuenta["veredictos"].get(veredicto, 0) + 1

        # El ancla: la prosa sigue siendo la que se contrastó.
        m = RE_ID.match(ident)
        if ident in pagina.afirmaciones:
            actual = huella(pagina.afirmaciones[ident][1])
            if not e.get("hash_texto"):
                h.append(("R3", donde, f"el HTML ya la envuelve con `data-afirma` y falta `hash_texto` "
                                       f"(huella actual {actual})"))
            elif veredicto != "por-reverificar" and actual != e["hash_texto"]:
                h.append(("R3", donde, f"la prosa cambió desde que se contrastó (huella actual {actual}): "
                                       "pasa a `por-reverificar`"))
        elif e.get("ancla") and m:
            prosa = normaliza(pagina.textos.get(f"M{int(m.group(2))}", ""))
            if veredicto != "por-reverificar" and normaliza(str(e["ancla"])) not in prosa:
                h.append(("R3", donde, f"el ancla «{str(e['ancla'])[:60]}» ya no está en el módulo "
                                       f"{int(m.group(2))}: la prosa cambió, pasa a `por-reverificar`"))
        elif e.get("hash_texto"):
            h.append(("R2", donde, "no hay ningún `data-afirma` con ese id en el HTML"))

        if veredicto not in CITABLES:
            continue
        # L5 — quien verifica no es quien redactó
        if not e.get("verificado_por"):
            h.append(("L5", donde, "falta `verificado_por`"))
        elif normaliza(str(e["verificado_por"])).lower() == normaliza(str(e.get("redactado_por"))).lower():
            h.append(("L5", donde, "quien verifica es quien redactó"))
        for n, f in enumerate(e.get("fuentes") or [], start=1):
            aqui = f"{donde} · fuente {n}"
            if not (f.get("clave") and f.get("loc")):
                continue
            hallados = comprueba_loc(str(f["clave"]), str(f["loc"]))
            h += [(codigo, aqui, que) for codigo, que in hallados]
            if not hallados and (motivo := evidencia(cat, dir_bib, f, pasajes, sin_corpus, cuenta)):
                h.append(("R4", aqui, motivo))
    return h
