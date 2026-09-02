#!/usr/bin/env python3
"""Comprueba la tabla de especificaciones del Parcial 1 contra el inventario.

Por qué existe: una tabla de especificaciones es una promesa —«O3 pesa el 20 %,
así que uno de cada cinco ítems es de O3»— y una promesa escrita a mano se
incumple sin que nadie lo note. Aquí las cuentas se rehacen: los ítems
absorbidos salen de `inventario_items.json`, que a su vez sale de ejecutar los
bancos, y los nuevos de `tabla_especificaciones.json`.

Las seis comprobaciones, y qué defecto caza cada una:

  1. Los pesos suman 100.
  2. Los objetivos parten los módulos de contenido: ninguno en dos objetivos,
     ninguno olvidado, ninguno inventado. Sin esto, un módulo se queda sin
     dueño y el diagnóstico no sabe a qué objetivo llevarlo.
  3. Cada módulo de contenido tiene al menos un ítem DENTRO del preparcial. Un
     instrumento que nunca pregunta por Horvitz–Thompson no puede diagnosticar
     que al estudiante le falta Horvitz–Thompson.
  4. Los módulos que hoy no tienen ni un ítem en todo el material llevan dos
     nuevos, no uno: son el hueco que justifica el instrumento.
  5. La desviación entre el peso del objetivo y su porcentaje de ítems no pasa
     de 3 puntos. Es lo que hace que el ensayo se parezca al examen.
  6. Tipos, dimensiones e identificadores válidos y sin repetir.

    python3 precalculo/verifica_tabla.py

Depende de `inventario_items.py`, que hay que haber corrido antes.
"""
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
TABLA = RAIZ / "precalculo" / "tabla_especificaciones.json"
INVENTARIO = RAIZ / "precalculo" / "salidas" / "inventario_items.json"

DIMENSIONES = {"concepto", "procedimiento", "interpretacion", "grafico"}
TIPOS = {"opcion", "multiple", "numerica", "texto", "grafico"}
DESVIACION_MAXIMA = 3.0

fallos = []


def exige(condicion, mensaje):
    if not condicion:
        fallos.append(mensaje)
    return condicion


def main():
    if not INVENTARIO.exists():
        print(f"FALLO · falta {INVENTARIO.relative_to(RAIZ)}: corre antes inventario_items.py",
              file=sys.stderr)
        return 1
    tabla = json.loads(TABLA.read_text(encoding="utf-8"))
    inv = json.loads(INVENTARIO.read_text(encoding="utf-8"))

    objetivos = tabla["objetivos"]
    nuevos = tabla["items_nuevos"]
    contenido = inv["modulos_de_contenido"]

    # El preparcial absorbe el simulacro (D1), no las autoevaluaciones de los
    # capítulos: esas se quedan en sus capítulos. La proporción se mide sobre lo
    # que el instrumento contiene de verdad.
    absorbidos = [p for p in inv["items"] if p["fuente"] == "simulacro"]
    por_modulo_absorbido = Counter(f"{p['cap']}.{p['modulo']}" for p in absorbidos)
    por_modulo_nuevo = Counter(p["modulo"] for p in nuevos)

    # 1 · pesos
    exige(sum(o["peso"] for o in objetivos) == 100,
          f"los pesos suman {sum(o['peso'] for o in objetivos)}, no 100")

    # 2 · partición de los módulos
    dueño, repetidos = {}, []
    for o in objetivos:
        for m in o["modulos"]:
            if m in dueño:
                repetidos.append(f"{m} está en {dueño[m]} y en {o['id']}")
            dueño[m] = o["id"]
    exige(not repetidos, "módulos con dos dueños: " + "; ".join(repetidos))
    huerfanos_de_objetivo = [m for m in contenido if m not in dueño]
    exige(not huerfanos_de_objetivo,
          "módulos de contenido sin objetivo: " + ", ".join(huerfanos_de_objetivo))
    inventados = [m for m in dueño if m not in contenido]
    exige(not inventados, "objetivos que citan módulos inexistentes: " + ", ".join(inventados))

    # 3 · cobertura dentro del preparcial
    sin_item = [m for m in contenido
                if por_modulo_absorbido[m] + por_modulo_nuevo[m] == 0]
    exige(not sin_item, "módulos sin ni un ítem en el preparcial: " + ", ".join(sin_item))

    # 4 · los huecos del material llevan dos
    flojos = [m for m in inv["huerfanos"] if por_modulo_nuevo[m] < 2]
    exige(not flojos, "módulos hoy en cero que no reciben dos ítems nuevos: " + ", ".join(flojos))

    # 5 · proporción
    total = len(absorbidos) + len(nuevos)
    filas, peor = [], 0.0
    for o in objetivos:
        a = sum(por_modulo_absorbido[m] for m in o["modulos"])
        n = sum(por_modulo_nuevo[m] for m in o["modulos"])
        pct = 100 * (a + n) / total
        desv = abs(pct - o["peso"])
        peor = max(peor, desv)
        filas.append((o["id"], o["peso"], n, a, a + n, pct, desv, o["titulo"]))
        exige(desv <= DESVIACION_MAXIMA,
              f"{o['id']}: pesa {o['peso']} % y se lleva el {pct:.1f} % de los ítems "
              f"(desviación {desv:.1f} > {DESVIACION_MAXIMA})")
    exige(sum(f[4] for f in filas) == total,
          "hay ítems que no caen en ningún objetivo")

    # 6 · higiene
    ids = [p["id"] for p in nuevos]
    exige(len(set(ids)) == len(ids), "identificadores repetidos en items_nuevos")
    for p in nuevos:
        exige(p["dimension"] in DIMENSIONES, f"{p['id']}: dimensión {p['dimension']!r}")
        exige(p["tipo"] in TIPOS, f"{p['id']}: tipo {p['tipo']!r}")
        exige(p["modulo"] in dueño and dueño[p["modulo"]] == p["objetivo"],
              f"{p['id']}: el módulo {p['modulo']} no pertenece a {p['objetivo']}")

    # ---- informe ----
    print(f"\n{'Obj':<4} {'peso':>5} {'nuevos':>7} {'absorb':>7} {'total':>6} {'% ítems':>8} {'desv':>6}  objetivo")
    print("-" * 108)
    for i, p, n, a, t, pct, d, titulo in filas:
        print(f"{i:<4} {p:>4} % {n:>7} {a:>7} {t:>6} {pct:>7.1f} % {d:>5.1f}  {titulo[:52]}")
    print("-" * 108)
    print(f"{'':<4} {100:>4} % {len(nuevos):>7} {len(absorbidos):>7} {total:>6} {100.0:>7.1f} % {peor:>5.1f}  (desviación máxima)")

    dims = Counter(p["dimension"] for p in nuevos)
    dims_abs = Counter(p["dimension"] for p in absorbidos)
    print("\nDimensión        nuevos  absorbidos  total   % del preparcial   (hoy en el material)")
    hoy = inv["por_dimension"]
    for d in ("concepto", "procedimiento", "interpretacion", "grafico"):
        t = dims[d] + dims_abs[d]
        print(f"  {d:<14} {dims[d]:>5} {dims_abs[d]:>11} {t:>6} {100 * t / total:>13.1f} %"
              f"        {100 * hoy.get(d, 0) / sum(hoy.values()):>5.1f} %")

    print(f"\nCobertura por módulo (absorbidos + nuevos), {len(contenido)} módulos de contenido:")
    linea = []
    for m in contenido:
        linea.append(f"{m}:{por_modulo_absorbido[m]}+{por_modulo_nuevo[m]}")
    print("  " + "  ".join(linea))

    if fallos:
        print("\n" + "\n".join(f"FALLO · {f}" for f in fallos), file=sys.stderr)
        return 1
    print(f"\n{total} ítems · 6 comprobaciones en verde · desviación máxima {peor:.1f} puntos")
    return 0


if __name__ == "__main__":
    sys.exit(main())
