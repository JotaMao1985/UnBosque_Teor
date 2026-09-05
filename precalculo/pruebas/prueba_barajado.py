#!/usr/bin/env python3
"""Prueba de regresión del barajado de opciones, sobre las nueve páginas.

Por qué existe: hasta el 2026-08-30, en los ítems de respuesta única de TODO el
material la opción correcta estaba en la primera posición. En todos. Y el motor
no barajaba, así que pulsar siempre la (a) daba el 100 % sin leer un enunciado.
El defecto no lo cazó nadie durante cinco semanas porque no rompe nada: la
página funciona, las cifras cuadran y las pruebas pasan.

Lo que comprueba, y por qué no basta con una sola cosa:

  1. **El parche está en las diez páginas.** Si la plantilla baraja y un capítulo
     no, ese capítulo vuelve al 100 % en la (a) sin avisar.
  2. **Nadie indexa ya `p.opciones` en el render.** Es el modo de fallo caro del
     arreglo: si el render usa la permutación y un callback el array original,
     el estudiante pulsa la correcta y el motor le dice que falló.
  3. **La distribución resultante es compatible con el azar.** Se mide con el
     MISMO código que se publicó —se extrae de la plantilla, no se reimplementa—
     porque una réplica del algoritmo puede diverger y entonces la prueba mide
     otra cosa.

    python3 precalculo/pruebas/prueba_barajado.py

Necesita node. No necesita R.
"""
import json
import subprocess
import sys
import tempfile
from collections import Counter
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(RAIZ / "precalculo"))
import _bancos  # noqa: E402  (el cargador compartido)

PLANTILLA = RAIZ / "plantilla" / "plantilla-capitulo-muestreo.html"
PAGINAS = sorted((RAIZ / "sitio" / "muestreo").glob("capitulo-*.html")) + [
    RAIZ / "sitio" / "muestreo" / "preparcial-corte-1.html"]
CHI2_CRITICO_3GL = 7.815      # al 5 %
MAXIMO_POR_POSICION = 0.45    # ninguna letra puede llevarse más del 45 %

fallos = []


def prueba_parche_en_todas():
    """1 · las diez páginas barajan, y ninguna quedó indexando p.opciones."""
    for f in [PLANTILLA] + PAGINAS:
        t = f.read_text(encoding="utf-8")
        if "function barajaEstable(" not in t:
            fallos.append(f"{f.name}: NO tiene el barajado")
        if "const opcs = barajaEstable(" not in t:
            fallos.append(f"{f.name}: no calcula la permutación por pregunta")
        # El render y sus callbacks tienen que indexar el mismo array.
        for resto in ("p.opciones.map((op, j)", "p.opciones[k].correcta",
                      "new Set(p.opciones.map("):
            if resto in t:
                fallos.append(f"{f.name}: el motor todavía indexa `{resto}`")


def posiciones():
    """3 · dónde cae la correcta, con el código de barajado ya publicado.

    El barajado se ejecuta DENTRO del mismo proceso de node que carga cada
    banco, así que opera sobre los objetos de verdad —con su `pregunta` tal cual
    la lee el navegador— y no sobre una copia serializada.
    """
    t = PLANTILLA.read_text(encoding="utf-8")
    funcs = "".join(_bancos.funcion(t, n) or "" for n in
                    ("semillaDeTexto", "azarEstable", "barajaEstable"))
    if "barajaEstable" not in funcs:
        fallos.append("no pude extraer las funciones de barajado de la plantilla")
        return []
    vuelca = funcs + """
process.stdout.write(JSON.stringify(BANCO.map(p => {
  if (!p.opciones || p.opciones.length < 2) return null;
  const b = barajaEstable(p.opciones, p.pregunta);
  const c = b.map((o, k) => o.correcta ? k : -1).filter(k => k >= 0);
  return { n: b.length, pos: c };
}).filter(Boolean)));
"""
    items = []
    for f in PAGINAS:
        try:
            if "preparcial" in f.name:
                # La página del preparcial lleva DOS bancos: el simulacro
                # absorbido y los 29 ítems nuevos. Cargar solo el primero dejaba
                # fuera del recuento a los 19 de respuesta única del segundo.
                items += _bancos.banco_simulacro(vuelca)
                items += _bancos.banco_preparcial(vuelca)
            else:
                items += _bancos.banco_capitulo(f"cap{f.name.split('-')[1]}", vuelca, f)
        except Exception as e:                      # noqa: BLE001
            fallos.append(f"{f.name}: no pude leer su banco ({str(e)[:120]})")
    return items


def main():
    prueba_parche_en_todas()
    res = posiciones()
    unicos = [x for x in res if len(x["pos"]) == 1]
    if len(unicos) < 40:
        fallos.append(f"solo recogí {len(unicos)} ítems de respuesta única; esperaba 60 o más")
    if unicos:
        c = Counter(x["pos"][0] for x in unicos)
        n, esperado = len(unicos), len(unicos) / 4
        chi2 = sum((c[k] - esperado) ** 2 / esperado for k in range(4))
        print(f"\n{n} ítems de respuesta única en {len(PAGINAS)} páginas")
        for k, letra in enumerate("abcd"):
            print(f"   {letra})  {c[k]:>3}   {100 * c[k] / n:>5.1f} %")
        print(f"   chi-cuadrado = {chi2:.2f} (3 gl, crítico al 5 % = {CHI2_CRITICO_3GL})")
        if max(c.values()) / n > MAXIMO_POR_POSICION:
            fallos.append(f"la posición {'abcd'[max(c, key=c.get)]}) se lleva el "
                          f"{100 * max(c.values()) / n:.0f} % de las correctas")
        if chi2 >= CHI2_CRITICO_3GL:
            fallos.append(f"la correcta sigue concentrada: chi2 = {chi2:.2f}")
        mult = [x for x in res if len(x["pos"]) > 1]
        prefijo = sum(1 for x in mult if x["pos"] == list(range(len(x["pos"]))))
        print(f"   {len(mult)} de varias respuestas · «todas menos la última»: {prefijo}")
        if mult and prefijo / len(mult) > 0.5:
            fallos.append(f"«todas menos la última» acierta {prefijo} de {len(mult)}")

    if fallos:
        print("\n" + "\n".join(f"  ✗ {x}" for x in fallos), file=sys.stderr)
        print(f"\n{len(fallos)} comprobaciones fallan.", file=sys.stderr)
        return 1
    print("\n4 de 4 comprobaciones pasan.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
