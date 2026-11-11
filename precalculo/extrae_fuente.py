#!/usr/bin/env python3
"""
extrae_fuente.py — registra los ejemplares y saca su texto, página a página, fuera de git

Material de Muestreo Estadístico 2026-II (20939). Tarea GD-C1. Portado de
`Series de tiempo/precalculo/extrae_fuente.py` (implementación de referencia de la norma), con
dos diferencias: aquí un ejemplar puede registrarse desde una ruta del equipo, sin pasar aún por
Zotero, y se admite EPUB además de PDF.

Contrastar una afirmación exige haber LEÍDO el pasaje. Para que eso lo compruebe un guion, el
texto de cada ejemplar se extrae a una caché local y los auditores buscan ahí.

  · PDF   → `pdftotext -layout`, un archivo por página del PDF: _local/texto/<clave>/p0001.txt
  · EPUB  → lo hace `indexa_epub.py`, que parte el texto por las marcas de página impresa
  · web   → instantánea en texto plano: _local/web/<clave>/<nombre>.txt

`bibliografia/_local/` está ignorado por git: el repo es público y los libros tienen derechos de
autor. Lo que se versiona es la huella (bibliografia/ejemplares.yml, instantaneas.yml).

Uso:  python3 precalculo/extrae_fuente.py --registra CLAVE RUTA   # alta de un ejemplar del equipo
      python3 precalculo/extrae_fuente.py                         # texto de todos los PDF
      python3 precalculo/extrae_fuente.py --clave portela2007tecnicas
      python3 precalculo/extrae_fuente.py --comprobar             # ¿los ejemplares son los registrados?
      python3 precalculo/extrae_fuente.py --web CLAVE URL [--desde archivo.html] [--nombre N]

Requiere `pdftotext`, `pdfinfo` (poppler) y `pandoc`.
"""
from __future__ import annotations

import argparse
import datetime as dt
import pathlib
import re
import subprocess
import sys
import urllib.request
import zipfile

from _fuentes import (BIB, CABECERA_EJEMPLARES, EJEMPLARES, LOCAL, MANUALES, RUTAS, escribe_json,
                      escribe_yaml, guarda_paginas, lee_json, lee_yaml, ruta_del_ejemplar, sha256)

AGENTE = "auditor-bibliografico/0.1"
FORMATOS = {".pdf": "pdf", ".epub": "epub"}


def paginas_de(ruta: pathlib.Path, formato: str) -> int:
    if formato == "pdf":
        info = subprocess.run(["pdfinfo", str(ruta)], capture_output=True, text=True).stdout
        return int(re.search(r"^Pages:\s+(\d+)", info, re.M).group(1))
    with zipfile.ZipFile(ruta) as z:   # EPUB: marcas de página impresa, numeradas
        marcas = set()
        for nombre in z.namelist():
            if nombre.endswith((".xhtml", ".html")):
                marcas |= set(re.findall(r'<span[^>]*epub:type="pagebreak"[^>]*\bid="p(\d+)"',
                                         z.read(nombre).decode("utf-8", "replace")))
        return len(marcas)


def registra(clave: str, ruta: pathlib.Path) -> int:
    if not ruta.is_file():
        sys.exit(f"FALLA  no existe {ruta}")
    formato = FORMATOS.get(ruta.suffix.lower())
    if not formato:
        sys.exit(f"FALLA  formato no admitido: {ruta.suffix}")
    fichas = lee_yaml(EJEMPLARES)
    previa = fichas.get(clave) or {}
    ficha = {
        "archivo": f"{clave}{ruta.suffix.lower()}",     # nombre neutro: el real no va al repo
        "formato": formato,
        "sha256": sha256(ruta),
        "paginas": paginas_de(ruta, formato),
        "paginas_sin_texto": previa.get("paginas_sin_texto"),
    }
    for campo in MANUALES:
        ficha[campo] = previa.get(campo)
    if previa.get("sha256") and previa["sha256"] != ficha["sha256"]:
        print(f"AVISO  {clave}: el ejemplar cambió; lo contrastado con el anterior hay que reverificarlo")
    fichas[clave] = ficha
    escribe_yaml(EJEMPLARES, fichas, CABECERA_EJEMPLARES)
    rutas = lee_json(RUTAS)
    rutas[clave] = str(ruta.resolve())
    escribe_json(RUTAS, rutas)
    print(f"OK     {clave}: {formato}, {ficha['paginas']} páginas, sha256 {ficha['sha256'][:12]}…")
    return 0


def extrae_pdf(clave: str, ruta: pathlib.Path) -> int:
    texto = subprocess.run(["pdftotext", "-layout", "-enc", "UTF-8", str(ruta), "-"],
                           capture_output=True, check=True).stdout.decode("utf-8", "replace")
    hojas = texto.split("\f")
    if hojas and not hojas[-1].strip():
        hojas = hojas[:-1]
    guarda_paginas(clave, {str(n): hoja for n, hoja in enumerate(hojas, start=1)})
    vacias = sum(1 for h in hojas if not h.strip())
    print(f"OK     {clave}: {len(hojas)} páginas de texto ({vacias} vacías) → _local/texto/{clave}/")
    return vacias


def extrae(solo: str | None) -> int:
    fichas = lee_yaml(EJEMPLARES)
    fallas = 0
    for clave, ficha in fichas.items():
        if solo and clave != solo:
            continue
        ruta = ruta_del_ejemplar(clave)
        if ruta is None:
            print(f"AVISO  {clave}: el ejemplar no está en este equipo (falta en _local/rutas.json)")
            continue
        if sha256(ruta) != ficha["sha256"]:
            print(f"FALLA  {clave}: el archivo no es el ejemplar registrado")
            fallas += 1
            continue
        if ficha["formato"] == "pdf":
            ficha["paginas_sin_texto"] = extrae_pdf(clave, ruta)
        else:
            print(f"       {clave}: es EPUB; su texto lo saca indexa_epub.py")
    escribe_yaml(EJEMPLARES, fichas, CABECERA_EJEMPLARES)
    return 1 if fallas else 0


def comprueba() -> int:
    fallas = 0
    for clave, ficha in lee_yaml(EJEMPLARES).items():
        ruta = ruta_del_ejemplar(clave)
        if ruta is None:
            print(f"AVISO  {clave}: no comprobable aquí (el ejemplar no está en este equipo)")
        elif sha256(ruta) != ficha["sha256"]:
            print(f"FALLA  {clave}: el archivo no es el ejemplar registrado")
            fallas += 1
        else:
            pendientes = [c for c in MANUALES if ficha.get(c) is None]
            nota = f"; faltan a mano: {', '.join(pendientes)}" if pendientes else ""
            print(f"OK     {clave}: es el ejemplar registrado{nota}")
    return 1 if fallas else 0


def nombre_de(url: str) -> str:
    cola = url.rstrip("/").rsplit("/", 1)[-1] or "indice"
    return re.sub(r"[^A-Za-z0-9_-]", "-", re.sub(r"\.html?$", "", cola))


def extrae_web(clave: str, url: str, desde: str | None, nombre: str | None) -> int:
    url_final = url
    if desde:
        crudo = pathlib.Path(desde).read_bytes()
    else:
        pedido = urllib.request.Request(url, headers={"User-Agent": AGENTE})
        with urllib.request.urlopen(pedido, timeout=30) as r:
            crudo = r.read()
            url_final = r.geturl()          # tras las redirecciones
    plano = subprocess.run(["pandoc", "-f", "html", "-t", "plain", "--wrap=none"],
                           input=crudo, capture_output=True, check=True).stdout
    nombre = nombre or nombre_de(url_final)
    destino = LOCAL / "web" / clave
    destino.mkdir(parents=True, exist_ok=True)
    (destino / f"{nombre}.txt").write_bytes(plano)

    import hashlib
    ruta = BIB / "instantaneas.yml"
    registro = lee_yaml(ruta)
    registro.setdefault(clave, {})[nombre] = {
        "url": url_final,
        "consulta": dt.date.today().isoformat(),
        "sha256": hashlib.sha256(plano).hexdigest(),
        "palabras": len(plano.split()),
    }
    escribe_yaml(ruta, registro, (
        "# Páginas web leídas: URL, fecha de consulta y huella del texto guardado.\n"
        "# El texto vive en bibliografia/_local/web/ (fuera de git).\n"
    ))
    print(f"OK     {clave}/{nombre}: {len(plano.split())} palabras → _local/web/{clave}/{nombre}.txt")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    ap.add_argument("--registra", nargs=2, metavar=("CLAVE", "RUTA"), help="da de alta un ejemplar")
    ap.add_argument("--clave", help="extrae solo el texto de esta obra")
    ap.add_argument("--comprobar", action="store_true", help="no escribe; compara sha256")
    ap.add_argument("--web", nargs=2, metavar=("CLAVE", "URL"), help="instantánea de una página web")
    ap.add_argument("--desde", help="con --web: HTML ya descargado, en vez de pedirlo")
    ap.add_argument("--nombre", help="con --web: nombre de la instantánea")
    args = ap.parse_args()
    if args.registra:
        return registra(args.registra[0], pathlib.Path(args.registra[1]).expanduser())
    if args.comprobar:
        return comprueba()
    if args.web:
        return extrae_web(args.web[0], args.web[1], args.desde, args.nombre)
    return extrae(args.clave)


if __name__ == "__main__":
    sys.exit(main())
