#!/usr/bin/env python3
"""
indexa_pdf.py — qué localizadores existen en un PDF, y en qué página impresa

Material de Muestreo Estadístico 2026-II (20939). Tarea GD-C3.

Un PDF no trae estructura: solo texto por página. Lo que se puede saber de él depende del
ejemplar, y por eso cada índice declara su `calidad`:

  paginas   PDF con texto nativo. Las secciones salen de su tabla de contenido (líneas con
            puntos conductores) y son fiables; ejemplos y tablas, de su rótulo en el cuerpo.
  probable  PDF escaneado con OCR. Las secciones salen de las cabeceras de página y de los
            encabezados que el OCR dejó legibles, juntos o partidos en dos renglones. Sirve
            para descartar un localizador imposible, no para dar por bueno uno dudoso: cuando
            uno falta, el auditor de citas lo dice y pide confirmarlo en el ejemplar.

En los dos casos el intervalo de páginas de una sección es GENEROSO: va desde donde empieza
hasta donde empieza la siguiente, inclusive, porque dos secciones pueden compartir página. Sirve
para comprobar que la página citada cae dentro de la sección citada.

La página impresa se deduce de la cabecera de cada página (un número al principio o al final de
su primera línea); el desfase con la página del archivo es el más votado. Si
bibliografia/ejemplares.yml trae `desfase` puesto a mano, manda ese y se compara.

No se indexan ecuaciones: en un PDF no hay manera fiable (norma, «Vocabulario de localizadores»).

Requiere haber corrido antes `extrae_fuente.py` (lee _local/texto/<clave>/pNNNN.txt).

Uso:  python3 precalculo/indexa_pdf.py CLAVE [--sonda "LOCALIZADOR=palabra" …]
"""
from __future__ import annotations

import argparse
import collections
import re
import sys

from _fuentes import EJEMPLARES, LOCAL, guarda_indice, lee_yaml

EXTRACTOR = "indexa_pdf@3"

# Cómo se reconoce cada cosa en cada ejemplar. Añadir un PDF es añadir una entrada aquí.
PERFILES = {
    "lohr1999sampling": {
        "calidad": "probable",
        "secciones": "cabeceras",
        "capitulo_en_cabecera": re.compile(r"Chapter\s+(\d+)\s*:"),
        "seccion_en_cabecera": re.compile(r"^(\d{1,2}\.\d{1,2})\s+[A-Z]"),
        "encabezado": re.compile(r"^\s{0,8}(\d{1,2}\.\d{1,2}(?:\.\d{1,2})?)\s{1,6}[A-Z][A-Za-z]"),
        "ejemplo": re.compile(r"^\s*EXAMPLE\s+(\d+)\s*\.\s*(\d+)\b"),
        "tabla": re.compile(r"^\s*TABLE\s+(\d+)\s*\.\s*(\d+)\b"),
    },
    # Un informe o un artículo no tienen secciones numeradas: se citan por página.
    "blumberg2010wireless": {
        "calidad": "paginas",
        "secciones": "ninguna",
    },
    "heck201865": {
        "calidad": "paginas",
        "secciones": "ninguna",
    },
    "dane2019omision": {
        "calidad": "paginas",
        "secciones": "ninguna",
    },
    "portela2007tecnicas": {
        "calidad": "paginas",
        "secciones": "indice",
        "ejemplo": re.compile(r"^\s*Ejemplo\s+(\d+)\.(\d+)\b"),
        "tabla": re.compile(r"^\s*Tabla\s+(\d+)\.(\d+)\b"),
    },
}

RE_NUM_INICIO = re.compile(r"^\s*(\d{1,3})\s{2,}\S")
RE_NUM_FINAL = re.compile(r"\S\s{2,}(\d{1,3})\s*$")
RE_INDICE = re.compile(r"^\s*(\d{1,2}(?:\.\d{1,2}){1,2})\.?\s+\S")
RE_CONDUCTOR = re.compile(r"(?:\.\s*){4,}(\d{1,3})\s*$")
# Un título que llena el renglón no deja sitio a los puntos: «7.2.3 Comparaciones con … m.a.s. 228».
RE_SIN_CONDUCTOR = re.compile(r"[^\d\s]\s+(\d{1,3})\s*$")
RE_NUMERO_SOLO = re.compile(r"^\s{0,12}(\d{1,2}\.\d{1,2}(?:\.\d{1,2})?)\s*$")


def lee_paginas(clave: str) -> dict[int, list[str]]:
    carpeta = LOCAL / "texto" / clave
    hojas = {int(f.stem[1:]): f.read_text("utf-8").splitlines() for f in sorted(carpeta.glob("p*.txt"))}
    if not hojas:
        sys.exit(f"FALLA  no hay texto de «{clave}»: corre extrae_fuente.py")
    return hojas


def primera_linea(lineas: list[str]) -> str:
    return next((l for l in lineas if l.strip()), "")


def desfase_votado(hojas: dict[int, list[str]]) -> tuple[int, float]:
    votos = collections.Counter()
    for n, lineas in hojas.items():
        cab = primera_linea(lineas)
        for patron in (RE_NUM_INICIO, RE_NUM_FINAL):
            if m := patron.search(cab):
                votos[n - int(m.group(1))] += 1
                break
    if not votos:
        return 0, 0.0
    desfase, a_favor = votos.most_common(1)[0]
    return desfase, a_favor / sum(votos.values())


def intervalos(inicios: dict[str, int], ultima: int) -> dict[str, list[int]]:
    """De {sección: página donde empieza} a {sección: [desde, hasta]}, hasta generoso."""
    def orden(clave):
        return [int(x) for x in clave.split(".")]
    claves = sorted(inicios, key=orden)
    salida = {}
    for i, clave in enumerate(claves):
        nivel = clave.count(".")
        siguiente = next((inicios[c] for c in claves[i + 1:] if c.count(".") <= nivel), ultima)
        salida[clave] = [inicios[clave], max(inicios[clave], siguiente)]
    return salida


def secciones_por_indice(hojas, desfase) -> dict[str, int]:
    """Tabla de contenido con puntos conductores: «7.1.2 Título . . . . . 211»."""
    inicios, pendiente = {}, None
    for n in sorted(hojas):
        for linea in hojas[n]:
            numero = RE_INDICE.match(linea)
            pagina = RE_CONDUCTOR.search(linea)
            if numero:
                pendiente = numero.group(1)
                ultima = max(inicios.values(), default=0)
                sin = RE_SIN_CONDUCTOR.search(linea)
                if not pagina and inicios and sin and ultima <= int(sin.group(1)) <= ultima + 40:
                    pagina = sin
            if pagina and pendiente:
                inicios.setdefault(pendiente, int(pagina.group(1)))
                pendiente = None
        if inicios and not any(RE_CONDUCTOR.search(l) for l in hojas[n]):
            if n > max(inicios.values(), default=0) + desfase or len(inicios) > 20:
                break                      # se acabó la tabla de contenido
    return inicios


def secciones_por_cabecera(hojas, desfase, perfil) -> tuple[dict[str, int], dict[str, list[int]]]:
    """OCR: la cabecera de las impares dice «N.M Título», la de las pares «Chapter N: …»."""
    capitulos: dict[str, list[int]] = {}
    en_cabecera: dict[str, int] = {}
    capitulo_de: dict[int, str] = {}
    for n in sorted(hojas):
        cab, impresa = primera_linea(hojas[n]).strip(), n - desfase
        if m := perfil["capitulo_en_cabecera"].search(cab):
            capitulos.setdefault(m.group(1), []).append(impresa)
            capitulo_de[impresa] = m.group(1)
        if m := perfil["seccion_en_cabecera"].match(cab):
            en_cabecera.setdefault(m.group(1), impresa)
            capitulo_de[impresa] = m.group(1).split(".")[0]
    # Encabezados en el cuerpo, aceptados solo si su capítulo es el de la página (o el de la
    # siguiente: la primera página de un capítulo no lleva cabecera).
    inicios: dict[str, int] = {}
    primera_del_libro = min(min(v) for v in capitulos.values()) - 2 if capitulos else 1
    for n in sorted(hojas):
        impresa = n - desfase
        if impresa < primera_del_libro:
            continue
        cercanos = {capitulo_de.get(impresa + d) for d in (-1, 0, 1, 2)}
        for linea in hojas[n][1:]:
            if (m := perfil["encabezado"].match(linea)) and not re.search(r"\d\s*$", linea):
                numero = m.group(1)
                if numero.split(".")[0] in cercanos:
                    inicios.setdefault(numero, impresa)
    for numero, impresa in en_cabecera.items():      # lo que el OCR no dejó ver en el cuerpo
        if numero not in inicios or inicios[numero] > impresa:
            inicios[numero] = impresa
    # Encabezados partidos por el OCR: el número en un renglón y el título en el siguiente.
    # Un número suelto también puede ser un dato de una tabla, así que solo se acepta el que
    # llena un hueco: su anterior ya está, en esa página o antes, y su siguiente no queda atrás.
    def vecino(numero: str, paso: int) -> str:
        partes = numero.split(".")
        return ".".join(partes[:-1] + [str(int(partes[-1]) + paso)])
    for n in sorted(hojas):
        impresa, lineas = n - desfase, hojas[n]
        for i, linea in enumerate(lineas[1:-1], start=1):
            m = RE_NUMERO_SOLO.match(linea)
            if not m or m.group(1) in inicios:
                continue
            numero = m.group(1)
            titulo = next((l.strip() for l in lineas[i + 1:i + 3] if l.strip()), "")
            antes, despues = inicios.get(vecino(numero, -1)), inicios.get(vecino(numero, 1))
            if (re.match(r"[A-Z][a-z]", titulo) and antes is not None and antes <= impresa
                    and (despues is None or impresa <= despues)):
                inicios[numero] = impresa
    rangos = {c: [min(p) - 1, max(p) + 1] for c, p in capitulos.items()}
    return inicios, rangos


def rotulos(hojas, desfase, patron) -> dict[str, int]:
    """Primera aparición de «Ejemplo N.M» o «Tabla N.M» al principio de una línea."""
    hallados = {}
    for n in sorted(hojas):
        for linea in hojas[n]:
            if m := patron.match(linea):
                hallados.setdefault(f"{int(m.group(1))}.{int(m.group(2))}", n - desfase)
    return hallados


def huecos(numeros: list[int]) -> list[int]:
    return sorted(set(range(1, max(numeros) + 1)) - set(numeros)) if numeros else []


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    ap.add_argument("clave")
    ap.add_argument("--sonda", action="append", default=[], metavar="LOC=palabra")
    args = ap.parse_args()
    if args.clave not in PERFILES:
        sys.exit(f"FALLA  no hay perfil para «{args.clave}» en PERFILES")
    perfil = PERFILES[args.clave]
    hojas = lee_paginas(args.clave)

    desfase, acuerdo = desfase_votado(hojas)
    manual = (lee_yaml(EJEMPLARES).get(args.clave) or {}).get("desfase")
    fallas = 0
    if manual is not None and manual != desfase:
        print(f"FALLA  desfase: ejemplares.yml dice {manual} y las cabeceras votan {desfase}")
        fallas += 1
    desfase = manual if manual is not None else desfase
    ultima = max(hojas) - desfase
    print(f"OK     desfase {desfase} (página del archivo − página impresa); "
          f"{acuerdo:.0%} de las cabeceras con número lo confirman"
          + ("" if manual is not None else "; falta fijarlo a mano en ejemplares.yml"))

    loc: dict[str, dict] = {}
    if perfil["secciones"] == "ninguna":
        inicios, rangos = {}, {}
    elif perfil["secciones"] == "indice":
        inicios = secciones_por_indice(hojas, desfase)
        capitulos = {}
        for numero, pagina in inicios.items():
            c = numero.split(".")[0]
            capitulos[c] = min(capitulos.get(c, pagina), pagina)
        orden = sorted(capitulos, key=int)
        rangos = {c: [capitulos[c], capitulos[orden[i + 1]] if i + 1 < len(orden) else ultima]
                  for i, c in enumerate(orden)}
    else:
        inicios, rangos = secciones_por_cabecera(hojas, desfase, perfil)
    for numero, p in intervalos(inicios, ultima).items():
        loc[f"§{numero}"] = {"p": p}
    for c, p in rangos.items():
        loc[f"cap. {c}"] = {"p": p}
    for tipo in ("ejemplo", "tabla"):
        if tipo not in perfil:
            continue
        for numero, pagina in rotulos(hojas, desfase, perfil[tipo]).items():
            loc[f"{tipo} {numero}"] = {"p": [pagina, pagina]}

    guarda_indice(args.clave, perfil["calidad"], EXTRACTOR, loc, paginas=[1, ultima])

    cuenta = collections.Counter(k.split(" ")[0] if not k.startswith("§") else "§" for k in loc)
    print(f"OK     {args.clave} ({perfil['calidad']}): " + ", ".join(f"{n} {t}" for t, n in cuenta.items()))
    for tipo in ("ejemplo", "tabla"):
        if tipo not in perfil:
            continue
        por_cap = collections.defaultdict(list)
        for k in loc:
            if k.startswith(tipo + " "):
                c, n = k.split(" ")[1].split(".")
                por_cap[c].append(int(n))
        rotos = {c: huecos(ns) for c, ns in por_cap.items() if huecos(ns)}
        print(f"{'OK    ' if not rotos else 'AVISO '} {tipo}: {sum(map(len, por_cap.values()))} en "
              f"{len(por_cap)} capítulos" + (f"; huecos {dict(sorted(rotos.items(), key=lambda x: int(x[0])))}" if rotos else ""))
    por_cap = collections.defaultdict(list)
    for k in loc:
        if k.startswith("§") and k.count(".") == 1:
            c, n = k[1:].split(".")
            por_cap[c].append(int(n))
    rotos = {c: huecos(ns) for c, ns in por_cap.items() if huecos(ns)}
    print(f"{'OK    ' if not rotos else 'AVISO '} secciones de primer nivel en {len(por_cap)} capítulos"
          + (f"; huecos {dict(sorted(rotos.items(), key=lambda x: int(x[0])))}" if rotos else ""))
    invertidos = [k for k, v in loc.items() if v["p"][0] > v["p"][1]]
    if invertidos:
        print(f"FALLA  intervalos invertidos: {invertidos[:8]}")
        fallas += 1

    for sonda in args.sonda:
        clave, palabra = sonda.split("=", 1)
        if clave not in loc:
            print(f"FALLA  sonda: «{clave}» no existe")
            fallas += 1
            continue
        desde, hasta = loc[clave]["p"]
        texto = " ".join(" ".join(hojas.get(p + desfase, [])) for p in range(desde, hasta + 1))
        hallada = palabra.lower() in texto.lower()
        print(f"{'OK    ' if hallada else 'FALLA '} sonda: «{clave}» (pp. {desde}–{hasta}) "
              f"{'contiene' if hallada else 'NO contiene'} «{palabra}»")
        fallas += not hallada
    return 1 if fallas else 0


if __name__ == "__main__":
    sys.exit(main())
