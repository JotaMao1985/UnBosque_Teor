#!/usr/bin/env python3
"""Prueba de regresión de `precalculo/anota_salidas.py`.

La primera es la que importa: **una cadena de anotación intercalada no se
duplica**. Ese fue el fallo de la fase 6 —la herramienta añadía al final de cada
bloque un grupo `#>` con la salida entera, dejando la salida de una sentencia
impresa antes de la sentencia que la produce— y `verifica_bloques.py` no lo ve,
porque las cifras duplicadas sí están en la salida real.

Las demás fijan los abortos: la herramienta prefiere no escribir nada antes que
colocar una salida donde no le toca.

Las cadenas de prueba son de Python y no leen ningún dato, así que esto corre en
un segundo y sin el R del framework:

    python3 precalculo/pruebas/prueba_anotador.py
"""
import subprocess
import sys
import tempfile
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent.parent
ANOTA = RAIZ / "precalculo" / "anota_salidas.py"

CABECERA = 'print("\\n###BLOQUE-P1###\\n")\n'


def corre(fuente, tmp):
    cadena = Path(tmp) / "cadena.py"
    cadena.write_text(CABECERA + fuente, encoding="utf-8")
    r = subprocess.run([sys.executable, str(ANOTA), str(cadena)],
                       capture_output=True, text=True, cwd=str(RAIZ))
    return r, cadena.read_text(encoding="utf-8")[len(CABECERA):]


CASOS = []


def caso(nombre):
    def envoltorio(f):
        CASOS.append((nombre, f))
        return f
    return envoltorio


@caso("intercalado al día: no se toca ni se duplica")
def _(r, salida, fuente):
    assert r.returncode == 0, r.stderr
    assert salida == fuente, f"la reescribió:\n{salida}"


_INTERCALADO = 'print("uno")\n#> uno\nprint("dos")\n#> dos\n'


@caso("intercalado desfasado: cada grupo recibe SU sentencia")
def _(r, salida, fuente):
    assert r.returncode == 0, r.stderr
    assert salida == _INTERCALADO, f"reparto mal hecho:\n{salida}"


@caso("un grupo por bloque: recibe la salida de todas las sentencias")
def _(r, salida, fuente):
    assert r.returncode == 0, r.stderr
    assert salida == fuente, f"la reescribió:\n{salida}"


@caso("grupo sin ninguna sentencia delante: aborta")
def _(r, salida, fuente):
    assert r.returncode != 0 and "no tiene ninguna sentencia delante" in r.stderr, r.stderr
    assert salida == fuente, "abortó pero escribió"


@caso("dos grupos tras la misma sentencia: aborta")
def _(r, salida, fuente):
    assert r.returncode != 0 and "MISMA" in r.stderr, r.stderr
    assert salida == fuente, "abortó pero escribió"


@caso("salida sin ningún grupo detrás: aborta en vez de perderla")
def _(r, salida, fuente):
    assert r.returncode != 0 and "se perdería" in r.stderr, r.stderr
    assert salida == fuente, "abortó pero escribió"


@caso("grupo cuyas sentencias no imprimen: aborta")
def _(r, salida, fuente):
    assert r.returncode != 0 and "quedaría vacío" in r.stderr, r.stderr
    assert salida == fuente, "abortó pero escribió"


@caso("línea `#>` indentada: aborta")
def _(r, salida, fuente):
    assert r.returncode != 0 and "indentadas" in r.stderr, r.stderr
    assert salida == fuente, "abortó pero escribió"


FUENTES = [
    _INTERCALADO,
    'print("uno")\n#> viejo\nprint("dos")\n#> mas viejo\n',
    'print("uno")\nprint("dos")\n#> uno\n#> dos\n',
    '#> huerfano\nprint("uno")\n#> uno\n',
    'print("uno")\n#> uno\n# un comentario cualquiera\n#> y otra vez\n',
    'print("uno")\n#> uno\nprint("dos")\n',
    'x = 1\n#> nada\nprint("uno")\n#> uno\n',
    'print("uno")\n  #> uno\n',
]


def main():
    fallos = 0
    for (nombre, comprueba), fuente in zip(CASOS, FUENTES):
        with tempfile.TemporaryDirectory() as tmp:
            r, salida = corre(fuente, tmp)
        try:
            comprueba(r, salida, fuente)
            print(f"  ok    {nombre}")
        except AssertionError as e:
            fallos += 1
            print(f"  FALLA {nombre}\n        {e}")
    print(f"\n=== {len(CASOS) - fallos} de {len(CASOS)} pruebas del anotador ===")
    return 1 if fallos else 0


if __name__ == "__main__":
    sys.exit(main())
