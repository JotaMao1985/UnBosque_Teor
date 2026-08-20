#!/usr/bin/env python3
"""Prueba de regresión del espacio al final de línea en las cadenas ejecutables.

Por qué existe: R rellena por la derecha —los vectores con nombre y las matrices
salen con espacios al final— y `anota_salidas.py` prefijaba esas líneas con `#> `
tal cual, así que el espacio acababa en el HTML publicado. No se ve dentro de un
`<pre>`, pero **cualquier editor que recorte al guardar lo quita**, y entonces el
capítulo deja de reproducirse desde su cadena. Eso ya había pasado: los capítulos
3, 4, 7 y 8 tenían **126 líneas así** y no salían byte a byte de `ensambla_capN.py`.
La deriva es invisible —el HTML se ve igual y `verifica_bloques.py` da verde,
porque compara cifras, no espacios— y por eso hace falta fijarla aquí.

Son dos comprobaciones: que la herramienta ya no lo escribe, y que ninguna cadena
lo tiene. La segunda es la que caza el fichero que alguien edite a mano.

No ejecuta R ni lee ningún dato:

    python3 precalculo/pruebas/prueba_cadenas.py
"""
import subprocess
import sys
import tempfile
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent.parent
ANOTA = RAIZ / "precalculo" / "anota_salidas.py"
CODIGO = RAIZ / "ensamblado" / "codigo"

CASOS = []


def caso(nombre):
    def envoltorio(f):
        CASOS.append((nombre, f))
        return f
    return envoltorio


@caso("anota_salidas no escribe espacio al final")
def _():
    # Una cadena que imprime lineas rellenas por la derecha, como hace R con un
    # vector con nombre. La anotacion resultante no debe conservar el relleno.
    # Cada sentencia que imprime lleva su grupo `#>` vacio: el anotador reescrito
    # en la fase 6 rellena los grupos que existen y ABORTA si falta alguno, en vez
    # de inventarse donde colocarlos. Sin estas dos lineas la prueba comprueba el
    # aborto, no el espacio final.
    fuente = ('print("   pi_k   pi_kl ")\n#>\n'
              'print("0.20000 0.03984 ")\n#>\n')
    with tempfile.TemporaryDirectory() as tmp:
        cadena = Path(tmp) / "cadena.py"
        cadena.write_text('print("\\n###BLOQUE-P1###\\n")\n' + fuente, encoding="utf-8")
        r = subprocess.run([sys.executable, str(ANOTA), str(cadena)],
                           capture_output=True, text=True, cwd=str(RAIZ))
        escrito = cadena.read_text(encoding="utf-8")
    assert r.returncode == 0, f"la herramienta fallo: {r.stderr[:200]}"
    marcas = [l for l in escrito.splitlines() if l.startswith("#>")]
    assert marcas, f"no anoto nada; escribio:\n{escrito}"
    con_cola = [l for l in marcas if l != l.rstrip()]
    assert not con_cola, f"anoto con espacio al final: {con_cola!r}"
    # Y no se pierde el contenido por el camino.
    assert any("pi_kl" in l for l in marcas), f"anoto mal: {marcas!r}"


@caso("ninguna cadena publicada tiene espacio al final")
def _():
    sucias = []
    for cadena in sorted(CODIGO.glob("cap*/cadena.*")):
        malas = [n for n, l in enumerate(cadena.read_text(encoding="utf-8").splitlines(), 1)
                 if l != l.rstrip()]
        if malas:
            sucias.append(f"{cadena.relative_to(RAIZ)}: lineas {malas[:6]}"
                          f"{' …' if len(malas) > 6 else ''} ({len(malas)})")
    assert not sucias, "cadenas con espacio al final:\n        " + "\n        ".join(sucias)


@caso("hay cadenas que mirar")
def _():
    # Si el glob deja de encontrar nada, la prueba de arriba pasa sin comprobar
    # nada: el fallo silencioso que estas pruebas existen para evitar.
    cadenas = list(CODIGO.glob("cap*/cadena.*"))
    assert len(cadenas) >= 8, f"solo encuentro {len(cadenas)} cadenas en {CODIGO}"


def main():
    fallos = 0
    for nombre, comprueba in CASOS:
        try:
            comprueba()
            print(f"  ok    {nombre}")
        except AssertionError as e:
            fallos += 1
            print(f"  FALLA {nombre}\n        {e}")
    print(f"\n=== {len(CASOS) - fallos} de {len(CASOS)} pruebas de las cadenas ===")
    return 1 if fallos else 0


if __name__ == "__main__":
    sys.exit(main())
