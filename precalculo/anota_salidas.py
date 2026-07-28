#!/usr/bin/env python3
"""Anota en una cadena ejecutable la salida REAL de cada bloque, en sus
comentarios `#>`.

Por qué existe: en cada fase del proyecto han vuelto a fallar cifras
transcritas a mano a los comentarios (fase 1: una; fase 3: dos; fase 4: cinco).
`verifica_bloques.py` las caza después; esta herramienta evita escribirlas.

Uso, desde la raíz del repositorio:

    python3 precalculo/anota_salidas.py ensamblado/codigo/cap8/cadena.R
    python3 precalculo/anota_salidas.py ensamblado/codigo/cap8/cadena.py

Ejecuta la cadena entera de una vez —encadenada, como la lee el estudiante—,
parte la salida por los marcadores `###BLOQUE-X###` que la propia cadena
imprime, y reescribe el bloque de comentarios `#>` del final de cada bloque con
lo que de verdad salió. No toca ni una línea de código.

Con --check no escribe nada: informa de qué bloques quedarían distintos, para
usarlo como prueba de regresión.
"""
import argparse
import re
import subprocess
import sys
from pathlib import Path

RSCRIPT = "/Library/Frameworks/R.framework/Versions/4.4-arm64/Resources/bin/Rscript"
MARCADOR = re.compile(r"###BLOQUE-([A-Za-z0-9]+)###")


def ejecuta(ruta):
    """Corre la cadena entera y devuelve (salida, codigo)."""
    if ruta.suffix == ".R":
        cmd = [RSCRIPT, "--vanilla", str(ruta)]
    elif ruta.suffix == ".py":
        cmd = [sys.executable, str(ruta)]
    else:
        sys.exit(f"ABORTA: no sé ejecutar {ruta.suffix}")
    r = subprocess.run(cmd, capture_output=True, text=True)
    return r.stdout, r.returncode, r.stderr


def salidas_por_bloque(salida):
    """Parte la salida capturada por los marcadores que imprime la cadena."""
    partes = MARCADOR.split(salida)
    out = {}
    for i in range(1, len(partes) - 1, 2):
        cuerpo = partes[i + 1].strip("\n")
        # La línea en blanco que el propio cat("\n...\n") deja alrededor.
        out[partes[i]] = cuerpo.strip("\n")
    return out


def reescribe(texto, salidas):
    """Sustituye el bloque final de comentarios `#>` de cada bloque."""
    partes = MARCADOR.split(texto)
    cambios = []
    for i in range(1, len(partes) - 1, 2):
        nombre = partes[i]
        cuerpo = partes[i + 1]
        if nombre not in salidas:
            sys.exit(f"ABORTA: el bloque {nombre} no imprimió su marcador; "
                     f"¿falló la ejecución antes de llegar?")
        lineas = cuerpo.split("\n")
        # La cola es la llamada al marcador siguiente: se conserva intacta.
        cola = []
        while lineas and (lineas[-1].strip() == "" or
                          re.match(r'^(cat|print)\("\\n$', lineas[-1].strip()) or
                          lineas[-1].strip() in ('\\n")', ')')):
            cola.insert(0, lineas.pop())
        # Se quitan los `#>` que hubiera al final del cuerpo.
        viejo = []
        while lineas and lineas[-1].startswith("#>"):
            viejo.insert(0, lineas.pop())
        while lineas and lineas[-1].strip() == "":
            lineas.pop()
        nuevo = ["#> " + l if l else "#>" for l in salidas[nombre].split("\n")]
        if viejo != nuevo:
            cambios.append(nombre)
        partes[i + 1] = "\n".join(lineas + nuevo + cola)
    # Se rearma con los marcadores en su sitio.
    fuera = partes[0]
    for i in range(1, len(partes) - 1, 2):
        fuera += f"###BLOQUE-{partes[i]}###" + partes[i + 1]
    return fuera, cambios


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cadena")
    ap.add_argument("--check", action="store_true",
                    help="no escribe: solo informa de qué bloques cambiarían")
    args = ap.parse_args()

    ruta = Path(args.cadena)
    if not ruta.exists():
        sys.exit(f"ABORTA: no existe {ruta}")

    salida, codigo, err = ejecuta(ruta)
    if codigo != 0:
        sys.stderr.write(err)
        sys.exit(f"ABORTA: {ruta.name} terminó con código {codigo}. "
                 f"Una cadena que no corre no se anota.")

    salidas = salidas_por_bloque(salida)
    texto = ruta.read_text(encoding="utf-8")
    nuevo, cambios = reescribe(texto, salidas)

    print(f"  {ruta.name}: {len(salidas)} bloques ejecutados, "
          f"{len(cambios)} con la salida distinta de lo anotado")
    if cambios:
        print("    " + ", ".join(cambios))
    if args.check:
        sys.exit(1 if cambios else 0)
    if nuevo != texto:
        ruta.write_text(nuevo, encoding="utf-8")
        print("    reescrito")
    else:
        print("    ya estaba al día")


if __name__ == "__main__":
    main()
