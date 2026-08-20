#!/usr/bin/env python3
"""Prueba de regresión del modo `--prosa` de `precalculo/verifica_bloques.py`.

La primera es la que importa: **un porcentaje de un solo decimal se mira**. Ese
fue el fallo de la fase 6 —`CIFRA_PROSA_RE` exigía dos decimales o más, así que
la frase «se llevan 5,9 puntos (61,6 % frente a 67,6 %)» devolvía cero cifras y
un 67,6 % que era 67,5 % se publicó con el informe en verde—. No falló la
comparación: falló la extracción, que es peor, porque no deja rastro.

La segunda tanda cubre el otro agujero de la misma fase: **el texto de los
simuladores se mira**. `cifras_de_prosa()` borraba el `<script>` entero, así que
los enunciados, las opciones y la retroalimentación —que el estudiante lee igual
que un párrafo— nunca se contrastaron, y por ahí se publicó un «2,4 millones» del
Literary Digest y una desviación de 29,7 que era 29,6.

Las demás fijan lo que el extractor NO debe mirar (conjuntos de LaTeX, etiquetas
de partición, colores CSS, enteros sueltos, código) y que `casa()` no acepta
cambios de escala, que es la puerta por la que se coló un `deff` inventado antes
de la fase 5.

No leen ningún dato ni ejecutan bloques, así que esto corre en un segundo y sin
el R del framework:

    python3 precalculo/pruebas/prueba_prosa.py
"""
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(RAIZ / "precalculo"))

import verifica_bloques as V  # noqa: E402

CASOS = []


def caso(nombre):
    def envoltorio(f):
        CASOS.append((nombre, f))
        return f
    return envoltorio


def cifras(texto):
    """Las cifras que el verificador ve en un fragmento de prosa."""
    return [c for c, _ in V.cifras_de_prosa(f"<p>{texto}</p>")]


@caso("un decimal: la frase que se coló entera")
def _():
    vistas = cifras("Sin pesos, las dos encuestas se llevan 5,9 puntos "
                    "(61,6 % frente a 67,6 %). Con pesos se llevan 0,9.")
    for esperada in ("5,9", "61,6", "67,6", "0,9"):
        assert esperada in vistas, f"no ve {esperada}; ve {vistas}"


@caso("un decimal negativo")
def _():
    assert "-51,5" in cifras("un $-51,5$ % en terminos relativos")


@caso("dos decimales y miles: no se rompió nada")
def _():
    vistas = cifras("de 528 609,8 a 1,96 y 306 677")
    for esperada in ("528 609,8", "1,96", "306 677"):
        assert esperada in vistas, f"no ve {esperada}; ve {vistas}"


@caso("los conjuntos de LaTeX no son cifras")
def _():
    vistas = cifras(r"estratos $\{1,2,3\}$ y $\{4,5\}$ con cobertura 93,1 %")
    assert vistas == ["93,1"], f"deberia ver solo 93,1; ve {vistas}"


@caso("un entero suelto no es un resultado")
def _():
    assert cifras("una muestra de 300 unidades del capitulo 2") == []


@caso("el codigo no es prosa")
def _():
    html = '<pre><code class="language-r">round(x, 2)\n#&gt; 67,6</code></pre>'
    assert [c for c, _ in V.cifras_de_prosa(html)] == []


@caso("casa() no acepta cambios de escala")
def _():
    universo = [0.675483]
    assert not V.casa(67.5, 1, universo), "67,5 no debe casar con 0,675483"
    assert V.casa(0.7, 1, universo), "0,7 si debe casar con 0,675483"


@caso("casa() habria cazado el 67,6")
def _():
    universo = [67.54832146, 61.64309032]
    assert V.casa(67.5, 1, universo), "67,5 es la cifra correcta y debe pasar"
    assert not V.casa(67.6, 1, universo), "67,6 es la equivocada y debe saltar"


@caso("el texto de un simulador se mira")
def _():
    html = ("<script>const P = [{ pregunta: 'Fallo por 19,3 puntos.',"
            " retro: 'Con 2,3 millones de papeletas.' }];</script>")
    vistas = [c for c, _ in V.cifras_de_prosa(html)]
    assert "19,3" in vistas and "2,3" in vistas, f"ve {vistas}"


@caso("los escapes del JS no rompen la cifra")
def _():
    html = "<script>const t = 'el total es $306\\,677$ acres y el cv 1,38';</script>"
    vistas = [c for c, _ in V.cifras_de_prosa(html)]
    assert "306 677" in vistas, f"no ve el 306 677 con espacio fino; ve {vistas}"


@caso("el color CSS no es una cifra")
def _():
    html = "<script>const c = 'rgb(255,102,0)', d = 'rgba(1,40,32,0.45)';</script>"
    assert [c for c, _ in V.cifras_de_prosa(html)] == []


@caso("la etiqueta de particion no es una cifra")
def _():
    # En un parrafo, no en el JS: lo que se fija aqui es el normalizador, no el
    # extractor de simuladores.
    vistas = cifras("solo {1}{2,3}{4} deja los margenes a 3,4 puntos de la ACS")
    assert vistas == ["3,4"], f"deberia ver solo 3,4; ve {vistas}"


@caso("la coma decimal de LaTeX sobrevive a las llaves")
def _():
    assert cifras("la cobertura fue del $92{,}65$ %") == ["92,65"]


@caso("lo que el JS calcula al vuelo no se inventa")
def _():
    html = "<script>const t = `media ${d.media.toFixed(1)} de 3 078`;</script>"
    vistas = [c for c, _ in V.cifras_de_prosa(html)]
    assert vistas == ["3 078"], f"deberia ver solo 3 078; ve {vistas}"


@caso("un <script> del que no sale nada aborta")
def _():
    try:
        V.cifras_de_prosa("<script>/* sin una sola cadena */</script>")
    except SystemExit:
        return
    raise AssertionError("deberia abortar en vez de dar el capitulo por bueno")


def main():
    fallos = 0
    for nombre, comprueba in CASOS:
        try:
            comprueba()
            print(f"  ok    {nombre}")
        except AssertionError as e:
            fallos += 1
            print(f"  FALLA {nombre}\n        {e}")
    print(f"\n=== {len(CASOS) - fallos} de {len(CASOS)} pruebas de la prosa ===")
    return 1 if fallos else 0


if __name__ == "__main__":
    sys.exit(main())
