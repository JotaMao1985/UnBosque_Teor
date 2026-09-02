#!/usr/bin/env python3
"""Inventario de los ítems que ya evalúan los capítulos 1 y 2.

Por qué existe: el preparcial del Corte I no se justifica por los temas que
toca —hay 52 ítems escritos sobre esos dos capítulos— sino por los huecos que
llena. Y los huecos no se ven leyendo: la cuenta a ojo de un banco de quiz
falla, porque `grep` cuenta también los selectores CSS y los ítems de tipo
`grafico` se escapan de cualquier patrón ingenuo. Aquí los bancos **se
ejecutan** y se cuentan los objetos, no las líneas.

Tres fuentes, y las tres son las publicadas o las que se van a publicar:

  * `AUTOEVALUACIONES['cap1']` del capítulo 1 del sitio
  * `AUTOEVALUACIONES['cap2']` del capítulo 2 del sitio
  * `BANCO_TALLER1` del simulacro, que el preparcial absorbe (D1)

De los dos primeros, el módulo lo lleva cada ítem en `modulo`. Del tercero
**no**: ahí `modulo` es la semana, y el módulo del capítulo está en `ancla`,
que es justamente el campo que se escribió para el mapa de repaso.

    python3 precalculo/inventario_items.py

Escribe `precalculo/salidas/inventario_items.json` e imprime la tabla de
cobertura. Necesita node; no necesita R.

LA DIMENSIÓN ES UNA APROXIMACIÓN, Y HAY QUE DECIRLO. El motor tiene cinco
tipos, no cuatro dimensiones: «interpretación» no es un tipo. Mientras un ítem
no declare `dimension`, este guion la deduce del tipo con el mapa de abajo y lo
marca como deducida. Un `opcion` que pregunta qué NO prueba un resultado cuenta
aquí como concepto, y no lo es. Los ítems nuevos del preparcial declararán su
dimensión, así que el sesgo de esta deducción se queda en los 52 previos.
"""
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _bancos as B
from _bancos import Fallo, limpia, modulos

RAIZ = B.RAIZ
SALIDA = RAIZ / "precalculo" / "salidas" / "inventario_items.json"

# Este guion mira solo el Corte I: los dos capítulos que evalúa el Parcial 1.
CAPITULOS = {c: B.CAPITULOS[c] for c in B.CORTE_I}
SIMULACRO = B.SIMULACRO
DATOS_SIMULACRO = B.DATOS_SIMULACRO

DIMENSION_POR_TIPO = {
    "opcion": "concepto",
    "multiple": "concepto",
    "numerica": "procedimiento",
    "texto": "interpretacion",
    "grafico": "grafico",
}

VUELCA = r"""
process.stdout.write(JSON.stringify(BANCO.map((p, i) => {
  const salida = { i, tipo: p.tipo, modulo: p.modulo, ancla: p.ancla || null,
                   dimension: p.dimension || null, pregunta: p.pregunta,
                   opciones: (p.opciones || []).length, respuesta: p.respuesta };
  if (typeof p.dibujar === 'function') { try { p.dibujar({}); salida.dibuja = true; }
                                         catch (e) { salida.dibuja = 'ERROR: ' + e.message; } }
  return salida;
})));
"""


def banco_capitulo(clave, ruta):
    return B.banco_capitulo(clave, VUELCA, ruta)


def banco_simulacro():
    return B.banco_simulacro(VUELCA)


def recoge():
    items, fuentes = [], {}
    for clave, ruta in CAPITULOS.items():
        crudos = banco_capitulo(clave, ruta)
        fuentes[clave] = str(ruta.relative_to(RAIZ))
        for p in crudos:
            if p["tipo"] not in DIMENSION_POR_TIPO:
                raise Fallo(f"{clave} #{p['i']}: tipo desconocido {p['tipo']!r}")
            if not isinstance(p.get("modulo"), int):
                raise Fallo(f"{clave} #{p['i']}: sin `modulo`")
            if str(p.get("dibuja", "")).startswith("ERROR"):
                raise Fallo(f"{clave} #{p['i']}: su `dibujar` lanza — {p['dibuja']}")
            items.append({
                "fuente": clave, "i": p["i"], "tipo": p["tipo"],
                "cap": int(clave[-1]), "modulo": p["modulo"],
                "dimension": p["dimension"] or DIMENSION_POR_TIPO[p["tipo"]],
                "dimension_deducida": p["dimension"] is None,
                "enunciado": limpia(p.get("pregunta")),
            })
    for p in banco_simulacro():
        if p["tipo"] not in DIMENSION_POR_TIPO:
            raise Fallo(f"simulacro #{p['i']}: tipo desconocido {p['tipo']!r}")
        a = p.get("ancla")
        if not a or "cap" not in a or "modulo" not in a:
            raise Fallo(f"simulacro #{p['i']}: sin `ancla` — el mapa de repaso no puede situarlo")
        if str(p.get("dibuja", "")).startswith("ERROR"):
            raise Fallo(f"simulacro #{p['i']}: su `dibujar` lanza — {p['dibuja']}")
        items.append({
            "fuente": "simulacro", "i": p["i"], "tipo": p["tipo"],
            "cap": a["cap"], "modulo": a["modulo"], "semana": p["modulo"],
            "dimension": p["dimension"] or DIMENSION_POR_TIPO[p["tipo"]],
            "dimension_deducida": p["dimension"] is None,
            "enunciado": limpia(p.get("pregunta")),
        })
    fuentes["simulacro"] = str(SIMULACRO.relative_to(RAIZ))
    if not items:
        raise Fallo("no se recogió ni un ítem")
    return items, fuentes


def main():
    items, fuentes = recoge()
    mods = {c: modulos(c, r) for c, r in CAPITULOS.items()}

    cobertura = defaultdict(lambda: {"quiz": 0, "simulacro": 0, "total": 0})
    for p in items:
        celda = cobertura[f"{p['cap']}.{p['modulo']}"]
        celda["simulacro" if p["fuente"] == "simulacro" else "quiz"] += 1
        celda["total"] += 1

    contenido = [f"{c}.{i}" for c, ms in ((1, mods["cap1"]), (2, mods["cap2"]))
                 for i, t in ms if "Autoevaluación" not in t]
    huerfanos = [m for m in contenido if cobertura[m]["total"] == 0]
    flacos = [m for m in contenido if cobertura[m]["total"] == 1]

    ancho = max(len(t) for ms in mods.values() for _, t in ms)
    print(f"\n{'Módulo':<{ancho + 8}} {'quiz':>5} {'simul':>6} {'total':>6}")
    print("-" * (ancho + 27))
    for cap, ms in ((1, mods["cap1"]), (2, mods["cap2"])):
        for i, t in ms:
            clave = f"{cap}.{i}"
            c = cobertura[clave]
            marca = "  ←  CERO" if clave in huerfanos else ("  ←  uno" if clave in flacos else "")
            print(f"{cap}.{i:<2} {t:<{ancho}} {c['quiz']:>5} {c['simulacro']:>6} {c['total']:>6}{marca}")

    tipos, dims, deducidas = Counter(), Counter(), 0
    for p in items:
        tipos[p["tipo"]] += 1
        dims[p["dimension"]] += 1
        deducidas += p["dimension_deducida"]
    total = len(items)
    print(f"\n{total} ítems · " + " · ".join(f"{n} {t}" for t, n in tipos.most_common()))
    print("dimensión: " + " · ".join(
        f"{d} {n} ({100 * n / total:.1f} %)" for d, n in dims.most_common()) +
        f"  [{deducidas} de {total} deducidas del tipo]")
    print(f"módulos de contenido: {len(contenido)} · sin ningún ítem: "
          f"{', '.join(huerfanos) or '—'} · con uno solo: {', '.join(flacos) or '—'}")

    SALIDA.write_text(json.dumps({
        "generado_por": "precalculo/inventario_items.py",
        "fuentes": fuentes,
        "modulos": {c: [{"id": i, "titulo": t} for i, t in ms] for c, ms in mods.items()},
        "modulos_de_contenido": contenido,
        "items": items,
        "cobertura": dict(sorted(cobertura.items(), key=lambda kv: tuple(map(int, kv[0].split("."))))),
        "por_tipo": dict(tipos), "por_dimension": dict(dims),
        "huerfanos": huerfanos, "con_un_solo_item": flacos,
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n→ {SALIDA.relative_to(RAIZ)}")


if __name__ == "__main__":
    try:
        main()
    except Fallo as e:
        print(f"FALLO · {e}", file=sys.stderr)
        sys.exit(1)
