#!/usr/bin/env python3
"""Prueba del preparcial del Corte II (módulo 14 del capítulo 4).

Por qué existe: el banco se escribió el 2026-10-07 y su primera lectura, ya
resuelta, encontró cuatro defectos que ninguna de las pruebas del sitio mira:
un `$` de apertura que faltaba, un `${…}` dentro de una cadena con comillas
simples que se enseñaba tal cual, una clave que era falsa con la muestra que
salió (R10) y la correcta como opción más larga en 16 de 19 ítems. Todo eso se
comprueba aquí, sobre el banco EJECUTADO con sus datos —lo que ve el
estudiante—, no sobre la fuente.

  A · la tabla de especificaciones contra el banco escrito (ids, módulo,
      dimensión, tipo, objetivo), la partición de los 22 módulos del alcance,
      los pesos y la desviación entre peso y porcentaje de ítems;
  B · la forma de las opciones: una sola correcta en las de opción única, las
      de varias con al menos dos de cada, retro en todas, y la longitud de la
      correcta sin pista (ni casi siempre la más larga ni casi siempre la más
      corta);
  C · las retros: ninguna nombra posiciones (la página baraja) y ninguna del
      acierto abre con un eco («Correcto», «Exacto»…);
  D · los delimitadores: `$` emparejados, nada de LaTeX fuera de una fórmula,
      ninguna interpolación sin evaluar y ningún `undefined` o `NaN`;
  E · las numéricas, por SEGUNDA VÍA: cada clave se recalcula aquí, en Python,
      desde las cifras que imprime el enunciado, y cada error con nombre que
      calcula el precálculo queda fuera de la tolerancia;
  F · los cinco gráficos se dibujan sin lanzar;
  G · y la prueba se prueba: ocho defectos inyectados, ocho cazados.

    python3 precalculo/pruebas/prueba_preparcial2.py

Necesita node y precalculo/salidas/preparcial2_datos.json (lo escribe
precalculo/genera_preparcial2.R).
"""
import copy
import json
import math
import re
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import _bancos as B  # noqa: E402

TABLA = B.RAIZ / "precalculo" / "tabla_especificaciones_corte2.json"
ALCANCE = [f"3.{m}" for m in range(1, 13)] + [f"4.{m}" for m in range(1, 11)]
DESVIACION_MAXIMA = 3.0

VUELCA = r"""
process.stdout.write(JSON.stringify(BANCO.map((p, i) => {
  const s = { i, id: p.id, tipo: p.tipo, bloque: p.bloque, modulo: p.modulo, ancla: p.ancla,
    dimension: p.dimension, pregunta: p.pregunta, pista: p.pista, respuesta: p.respuesta,
    tolerancia: p.tolerancia, decimales: p.decimales, retroAcierto: p.retroAcierto,
    retroFallo: p.retroFallo, descripcionGrafico: p.descripcionGrafico,
    opciones: (p.opciones || []).map(o => ({ texto: o.texto, correcta: !!o.correcta, retro: o.retro })) };
  if (typeof p.dibujar === 'function') {
    try { const g = p.dibujar({}); s.series = g && g.config ? g.config.data.datasets.length : 0; }
    catch (e) { s.series = 'ERROR: ' + e.message; }
  }
  return s;
})));
"""

POSICION_RE = re.compile(
    r"(primera|segunda|tercera|cuarta|quinta|última|ultima) opción|opción \(?[a-h]\)|"
    r"\bla de (arriba|abajo)\b|\(([a-h])\)\s|\b(primera|segunda|tercera|cuarta) respuesta", re.I)
ECO_RE = re.compile(r"^\s*(Exact[oa]|Correct[oa]|Eso es|Ésa es|Esa es|Así es|Cierto|Sí)\s*[.,:;!—–]")


def limpia(s):
    return re.sub(r"<[^>]+>", "", s or "")


def textos(p):
    """Todo lo que el estudiante lee de un ítem, con su nombre."""
    out = [("pregunta", p["pregunta"]), ("pista", p["pista"]), ("retroAcierto", p.get("retroAcierto")),
           ("retroFallo", p.get("retroFallo")), ("descripcionGrafico", p.get("descripcionGrafico"))]
    for k, o in enumerate(p["opciones"]):
        out += [(f"opción {k}", o["texto"]), (f"retro {k}", o["retro"])]
    return [(n, s) for n, s in out if s]


# ----------------------------------------------------------------- A · tabla
def revisa_tabla(items, tabla):
    f = []
    obj = tabla["objetivos"]
    if sum(o["peso"] for o in obj) != 100:
        f.append(f"A: los pesos suman {sum(o['peso'] for o in obj)}, no 100")
    dueno = {}
    for o in obj:
        for m in o["modulos"]:
            if m in dueno:
                f.append(f"A: el módulo {m} está en {dueno[m]} y en {o['id']}")
            dueno[m] = o["id"]
    if sorted(dueno, key=lambda m: (int(m.split('.')[0]), int(m.split('.')[1]))) != ALCANCE:
        f.append("A: los objetivos no parten exactamente los 22 módulos del alcance")
    por_id = {p["id"]: p for p in items}
    t_ids = [x["id"] for x in tabla["items_nuevos"]]
    if sorted(por_id) != sorted(t_ids) or len(set(t_ids)) != len(t_ids):
        f.append("A: los identificadores del banco y de la tabla no coinciden")
    for x in tabla["items_nuevos"]:
        p = por_id.get(x["id"])
        if not p:
            continue
        mod = f"{p['ancla']['cap']}.{p['ancla']['modulo']}"
        if mod != x["modulo"]:
            f.append(f"A: {x['id']} está anclado en {mod} y la tabla dice {x['modulo']}")
        if dueno.get(mod) != x["objetivo"]:
            f.append(f"A: {x['id']}: el módulo {mod} es de {dueno.get(mod)}, no de {x['objetivo']}")
        if p["dimension"] != x["dimension"]:
            f.append(f"A: {x['id']} declara {p['dimension']} y la tabla {x['dimension']}")
        if p["tipo"] != x["tipo"]:
            f.append(f"A: {x['id']} es {p['tipo']} y la tabla dice {x['tipo']}")
    cuenta = Counter(f"{p['ancla']['cap']}.{p['ancla']['modulo']}" for p in items)
    vacios = [m for m in ALCANCE if not cuenta[m]]
    if vacios:
        f.append("A: módulos sin ningún ítem: " + ", ".join(vacios))
    peor = 0.0
    for o in obj:
        n = sum(cuenta[m] for m in o["modulos"])
        desv = abs(100 * n / len(items) - o["peso"])
        peor = max(peor, desv)
        if desv > DESVIACION_MAXIMA:
            f.append(f"A: {o['id']} pesa {o['peso']} % y tiene el {100 * n / len(items):.1f} % de los ítems")
    return f, peor


# ----------------------------------------------------------------- B · forma
def revisa_forma(items):
    f = []
    larga = corta = n = 0
    ratios = []
    for p in items:
        ops = p["opciones"]
        if p["tipo"] == "numerica":
            continue
        cs = [k for k, o in enumerate(ops) if o["correcta"]]
        if any(not (o["retro"] or "").strip() for o in ops):
            f.append(f"B: {p['id']}: hay opciones sin retroalimentación")
        L = [len(re.sub(r"\$", "", limpia(o["texto"]))) for o in ops]
        if p["tipo"] in ("opcion", "grafico"):
            if len(cs) != 1:
                f.append(f"B: {p['id']}: tiene {len(cs)} correctas, debería tener una")
                continue
            otros = [l for k, l in enumerate(L) if k != cs[0]]
            n += 1
            larga += L[cs[0]] > max(otros)
            corta += L[cs[0]] < min(otros)
            ratios.append(L[cs[0]] / (sum(otros) / len(otros)))
        else:
            if len(cs) < 2 or len(ops) - len(cs) < 1 or len(ops) > 8:
                f.append(f"B: {p['id']}: varias respuestas con {len(cs)} verdaderas de {len(ops)}")
            v = sum(L[k] for k in cs) / len(cs)
            fa = [L[k] for k in range(len(ops)) if k not in cs]
            if fa and not 0.75 <= v / (sum(fa) / len(fa)) <= 1.3:
                f.append(f"B: {p['id']}: las verdaderas miden {v / (sum(fa) / len(fa)):.2f} veces las falsas")
    if n:
        media = sum(ratios) / n
        if larga > 0.3 * n:
            f.append(f"B: la correcta es la opción más larga en {larga} de {n}")
        if corta > 0.3 * n:
            f.append(f"B: la correcta es la opción más corta en {corta} de {n}")
        if not 0.85 <= media <= 1.15:
            f.append(f"B: la correcta mide en promedio {media:.2f} veces lo que las demás")
    return f, (larga, corta, n, sum(ratios) / n if n else 0)


# ----------------------------------------------------------------- C · retros
def revisa_retros(items):
    f = []
    for p in items:
        for nombre, s in textos(p):
            if nombre.startswith(("retro", "pista")) and POSICION_RE.search(limpia(s)):
                f.append(f"C: {p['id']} {nombre}: nombra una posición y la página baraja")
        acierto = [p.get("retroAcierto")] + [o["retro"] for o in p["opciones"] if o["correcta"]]
        for s in filter(None, acierto):
            if ECO_RE.search(limpia(s)):
                f.append(f"C: {p['id']}: una retro del acierto abre con eco: «{limpia(s)[:30]}…»")
    return f


# ----------------------------------------------------------------- D · delimitadores
def revisa_delimitadores(items):
    f = []
    for p in items:
        for nombre, s in textos(p):
            s2 = re.sub(r"<pre>.*?</pre>", "", s, flags=re.S)
            if s2.count("$") % 2:
                f.append(f"D: {p['id']} {nombre}: número impar de `$`")
            for k, tramo in enumerate(s2.split("$")):
                if k % 2 == 0 and ("{,}" in tramo or "\\," in tramo or re.search(r"\\[A-Za-z]", tramo)):
                    f.append(f"D: {p['id']} {nombre}: LaTeX fuera de una fórmula: «{tramo.strip()[:40]}»")
                # Dentro de una fórmula, una cifra con coma decimal suelta (KaTeX
                # la espacia como puntuación), un `\{,}` (el reemplazo que agarró
                # la coma de `\,`) o un espacio duro, que KaTeX no reconoce.
                if k % 2 == 1 and (re.search(r"\d,\d", tramo) or "\\{,}" in tramo
                                   or re.search(r"[\u00a0\u202f]", tramo)):
                    f.append(f"D: {p['id']} {nombre}: cifra mal escrita dentro de una fórmula: «{tramo[:40]}»")
            if "${" in s2:
                f.append(f"D: {p['id']} {nombre}: interpolación sin evaluar")
            if re.search(r"\b(undefined|NaN|Infinity|null)\b", limpia(s2)):
                f.append(f"D: {p['id']} {nombre}: «undefined», «NaN» o «null» en el texto")
    return f


# ----------------------------------------------------------------- E · numéricas
def segunda_via(I):
    """Cada clave, recalculada desde lo que imprime el enunciado. No reutiliza
    ninguna cifra derivada del precálculo: solo las de entrada."""
    sq = math.sqrt
    r = {}
    a = I["R02"]; r["R02"] = round(a["ybar"] / a["xbar"] * a["tx"] / a["N"], 2)
    a = I["R03"]; B_ = a["ybar"] / a["xbar"]
    r["R03"] = round(a["tx"] / a["xbar"] * sq((1 - a["n"] / a["N"]) / a["n"] *
                     (a["sy"] ** 2 + B_ ** 2 * a["sx"] ** 2 - 2 * B_ * a["r"] * a["sx"] * a["sy"])))
    a = I["R08"]; r["R08"] = math.ceil(1 / (1 / a["N"] + (1 - a["rho"] ** 2) * (1 / a["n"] - 1 / a["N"])))
    e = I["R10"]["est"]; r["R10"] = round(sq(sum(e[h]["N"] ** 2 * e[h]["ee"] ** 2 for h in e)))
    a = I["R11"]; r["R11"] = round(a["N"] * sq((1 - a["n"] / a["N"]) / a["n"]) * a["su"])
    a = I["R19"]; r["R19"] = round(sq(sum(N ** 2 * (1 - n / N) * s ** 2 / n
                                          for N, n, s in zip(a["Nh"], a["nh"], a["sh"]))))
    a = I["R22"]; NS = [N * S for N, S in zip(a["Nh"], a["Sh"])]; r["R22"] = round(a["n"] * NS[2] / sum(NS))
    a = I["R24"]; NS = [N * S for N, S in zip(a["Nh"], a["Sh"])]
    r["R24"] = round(a["C"] * sum(x / sq(c) for x, c in zip(NS, a["costo"])) /
                     sum(x * sq(c) for x, c in zip(NS, a["costo"])))
    a = I["R28"]; r["R28"] = math.ceil(a["n0"] * (a["ee_str"] / a["ee_mas"]) ** 2)
    a = I["R30"]; r["R30"] = round(a["sum_area"] / a["m"] * sum(y / x for y, x in zip(a["y"], a["area"])))
    a = I["R31"]; N = sum(a["Nh"]); r["R31"] = round(sum(Nh / N * y for Nh, y in zip(a["Nh"], a["yh"])), 2)
    return r


def errores_con_nombre(I):
    """Los errores con nombre que calcula el precálculo, en la escala de la clave."""
    return {
        "R02": [I["R02"]["ybar"], I["R02"]["respuesta_total"]],
        "R10": [I["R10"]["suma_ee"], I["R10"]["con_N"]],
        "R03": [I["R03"]["con_sy"], I["R03"]["sin_fpc"]],
        "R08": [I["R08"]["sin_fpc"], I["R08"]["con_rho"]],
        "R11": [I["R11"]["como_fijo"]],
        "R19": [I["R19"]["sin_fpc"], I["R19"]["sin_N2"]],
        "R22": [round(I["R22"]["prop"][2]), round(I["R22"]["NS2"][2])],
        "R24": [round(sum(I["R24"]["con_c"])), sum(round(v) for v in I["R24"]["nh"])],
        "R28": [I["R28"]["con_ee"], I["R28"]["dividir"]],
        "R30": [I["R30"]["expansion"]],
        "R31": [I["R31"]["bruta"], I["R31"]["iguales"]],
    }


def revisa_numericas(items, I):
    f = []
    por_id = {p["id"]: p for p in items if p["tipo"] == "numerica"}
    via2, errores = segunda_via(I), errores_con_nombre(I)
    if sorted(por_id) != sorted(via2):
        f.append(f"E: las numéricas del banco ({sorted(por_id)}) no son las que la segunda vía conoce")
    for k, p in por_id.items():
        if not isinstance(p["decimales"], int):
            f.append(f"E: {k}: falta `decimales`")
            continue
        if round(p["respuesta"], p["decimales"]) != p["respuesta"]:
            f.append(f"E: {k}: la respuesta {p['respuesta']} no está redondeada a {p['decimales']} decimales")
        if k in via2 and abs(via2[k] - p["respuesta"]) > 0.5 * 10 ** -p["decimales"] + 1e-9:
            f.append(f"E: {k}: la clave es {p['respuesta']} y la segunda vía da {via2[k]}")
        for e in errores.get(k, []):
            if abs(e - p["respuesta"]) <= p["tolerancia"]:
                f.append(f"E: {k}: el error con nombre {e:.4g} cae dentro de la tolerancia de la clave")
    return f


# ----------------------------------------------------------------- F · gráficos
def revisa_graficos(items):
    f = []
    for p in items:
        if p["tipo"] == "grafico" and not (isinstance(p.get("series"), int) and p["series"] >= 2):
            f.append(f"F: {p['id']}: el gráfico no se dibuja ({p.get('series')})")
    return f


def todas(items, tabla, I):
    fa, peor = revisa_tabla(items, tabla)
    fb, forma = revisa_forma(items)
    return fa + fb + revisa_retros(items) + revisa_delimitadores(items) + \
        revisa_numericas(items, I) + revisa_graficos(items), peor, forma


# ----------------------------------------------------------------- G · inyección
def inyecciones(items, I):
    """Ocho defectos, cada uno de una familia. Cada uno tiene que hacer fallar
    la prueba; si alguno pasa, la comprobación que debía cazarlo está rota."""
    def larga(x):
        for p in x:
            if p["tipo"] in ("opcion", "grafico"):
                for o in p["opciones"]:
                    if o["correcta"]:
                        o["texto"] += " " + "y con todos los matices que hacen falta para convencer " * 2
        return x

    def eco(x):
        p = next(p for p in x if p["tipo"] == "opcion")
        next(o for o in p["opciones"] if o["correcta"])["retro"] = "Correcto. " + "lo que sigue."
        return x

    def clave(x):
        p = next(p for p in x if p["tipo"] == "numerica")
        p["respuesta"] += 3 * p["tolerancia"] + 1
        return x

    def dolar(x):
        x[0]["pista"] += " con un $ suelto"
        return x

    def ancla(x):
        x[0]["ancla"] = dict(x[0]["ancla"], modulo=12)
        return x

    def posicion(x):
        x[1]["opciones"][1]["retro"] += " Por eso es la segunda opción."
        return x

    def interpolacion(x):
        x[2]["opciones"][0]["retro"] += " con ${I2.R02.n} fincas"
        return x

    def grafico(x):
        next(p for p in x if p["tipo"] == "grafico")["series"] = "ERROR: D4 is not defined"
        return x

    def cifra_rota(x):
        x[3]["pregunta"] += " Con $t_x = 3\\{,}612,7$ ha."
        return x

    return [("una cifra rota dentro de una fórmula", cifra_rota), ("la correcta, siempre la más larga", larga), ("un eco en la retro del acierto", eco),
            ("una clave movida", clave), ("un $ suelto", dolar), ("un ancla en otro módulo", ancla),
            ("una retro que nombra una posición", posicion),
            ("una interpolación sin evaluar", interpolacion), ("un gráfico que lanza", grafico)]


def main():
    tabla = json.loads(TABLA.read_text(encoding="utf-8"))
    I = json.loads(B.DATOS_PREPARCIAL2.read_text(encoding="utf-8"))["items"]
    items = B.banco_preparcial2(VUELCA)
    fallos, peor, (larga, corta, n, media) = todas(items, tabla, I)
    print(f"{len(items)} ítems · bloques {dict(Counter(p['bloque'] for p in items))} · "
          f"dimensiones {dict(Counter(p['dimension'] for p in items))}")
    print(f"A · tabla: desviación máxima entre peso y % de ítems {peor:.2f} puntos")
    print(f"B · la correcta es la más larga en {larga} y la más corta en {corta} de {n}; "
          f"mide {media:.2f} veces el promedio de las demás")
    print(f"E · {len(segunda_via(I))} claves numéricas recalculadas por segunda vía")
    print(f"F · {sum(1 for p in items if p['tipo'] == 'grafico')} gráficos dibujados")

    cazados = 0
    for nombre, inyecta in inyecciones(items, I):
        f, _, _ = todas(inyecta(copy.deepcopy(items)), tabla, I)
        if f:
            cazados += 1
        else:
            fallos.append(f"G: la inyección «{nombre}» no hizo fallar nada")
    print(f"G · {cazados} de {len(inyecciones(items, I))} defectos inyectados, cazados")

    if fallos:
        print("\n" + "\n".join(f"FALLO · {x}" for x in fallos), file=sys.stderr)
        return 1
    print("\nprueba_preparcial2: sin fallos")
    return 0


if __name__ == "__main__":
    sys.exit(main())
