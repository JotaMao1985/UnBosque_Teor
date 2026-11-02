"""Genera los gráficos animados de las diapositivas del cap. 6 de Muestreo (T7.111).

Escribe los cuatro .json de sitio/muestreo/diapositivas/fuentes/recursos/cap6/, que la skill
diapositivas-clase dibuja como SVG animado. Todas las cifras salen de
precalculo/salidas/cap6_datos.json, el precálculo que alimenta los simuladores del capítulo; las
pocas cuentas que se hacen aquí son las mismas que hacen los simuladores, y se dice cuáles. Las
correcciones de la auditoría de T7.112 (rótulos, unidades y la curva del elefante) van comentadas.
Las mejoras de T7.113: lienzo de 700 × 420 en vez de 1000 × 440 (en la columna de la diapositiva el
texto sube de unos 13 px a unos 18), categorías y rótulos más cortos para que quepan.
Uso, desde la raíz del repositorio: python3 precalculo/genera_diapositivas_cap6.py
Después, reconstruir con construir.py: los .json están versionados y las fuentes los leen.
"""
import json
import sys
from pathlib import Path

raiz = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent
pre = json.loads((raiz / "precalculo/salidas/cap6_datos.json").read_text(encoding="utf-8"))
dest = raiz / "sitio/muestreo/diapositivas/fuentes/recursos/cap6"
dest.mkdir(parents=True, exist_ok=True)


def coma(v, dec):
    return f"{v:.{dec}f}".replace(".", ",")


def miles(v):
    """Como el capítulo: cuatro cifras sin separador; desde cinco, espacio no separable (U+00A0)."""
    v = round(v)
    return str(v) if abs(v) < 10000 else f"{v:,.0f}".replace(",", " ")


LIENZO = {"ancho": 700, "alto": 420}     # T7.113: con 1000 × 440 el texto salía a unos 13 px


def guarda(nombre, datos):
    (dest / nombre).write_text(json.dumps(datos, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")


# M1 · las cuatro estimaciones posibles t_i/psi_i con cada sorteo (tiendas.estPpt y estIgual,
# las del bloque del módulo 1) frente al total t = 300.
T = pre["tiendas"]
guarda("m1_tiendas.json", {
    "tipo": "animado", "titulo": "La estimación del total según qué tienda salga", **LIENZO,
    "x": {"categorias": [f"tienda {n}" for n in T["nombres"]]},
    "y": {"titulo": "estimación (miles de USD)", "min": 0, "max": 1050,   # 1050: el rótulo «980» cabe
          "marcas": [0, 250, 500, 750, 1000]},
    "base": [{"tipo": "referencia", "y": T["total"]},
             {"tipo": "texto", "x": -0.42, "y": 330, "texto": f"total verdadero: t = {T['total']}",
              "ancla": "inicio"}],
    "etapas": [
        [{"tipo": "barra", "x": f"tienda {n}", "y": v, "texto": miles(v), "serie": 1,
          "ancho": 0.34, "desplazamiento": -0.19} for n, v in zip(T["nombres"], T["estPpt"])]
        + [{"tipo": "texto", "x": -0.42, "y": 900, "serie": 1, "ancla": "inicio",
            "texto": f"ψ proporcional al área: de {miles(min(T['estPpt']))} a {miles(max(T['estPpt']))}"}],
        [{"tipo": "barra", "x": f"tienda {n}", "y": v, "texto": miles(v), "serie": 2,
          "ancho": 0.34, "desplazamiento": 0.19} for n, v in zip(T["nombres"], T["estIgual"])]
        + [{"tipo": "texto", "x": -0.42, "y": 820, "serie": 2, "ancla": "inicio",
            "texto": f"ψ = 1/4: de {miles(min(T['estIgual']))} a {miles(max(T['estIgual']))}"}],
    ],
})

# M5 · el mismo piPT de counties con n = 10, sorteado de tres maneras, frente al MAS sin
# reemplazo (disenosCounties). deff = V / V_MAS sin reemplazo, la cuenta de la tabla del módulo 6.
D = pre["disenosCounties"]
ref = D["vMasSin"]
cats = ["MAS", "alfabética", "por población", "Brewer"]   # cortas: en 700 de ancho, «sist. …» se pisaban


def barra_v(cat, v, s, aprox=False):
    """aprox: la varianza sale de réplicas (Brewer, replicasBrewer), no de una cuenta exacta."""
    ap = "≈ " if aprox else ""
    return {"tipo": "barra", "x": cat, "y": v / 1000, "serie": s, "ancho": 0.55,
            "texto": f"{ap}{miles(v)} · deff {ap}{coma(v / ref, 2)}"}


guarda("m5_disenos.json", {
    "tipo": "animado", "titulo": "Varianza del HT del total de condados, n = 10 estados", **LIENZO,
    "margen_derecho": 50,                   # 40 por omisión: el rótulo de Brewer salía 2 unidades
    "x": {"categorias": cats},
    "y": {"titulo": "varianza (miles)", "min": 0, "max": 800, "marcas": [0, 200, 400, 600, 800]},
    "base": [{"tipo": "barra", "x": cats[0], "y": ref / 1000, "serie": 5, "ancho": 0.55,
              "texto": miles(ref)},
             {"tipo": "referencia", "y": ref / 1000, "serie": 5}],
    "etapas": [
        [barra_v(cats[1], D["vSisAlf"], 2)],
        [barra_v(cats[2], D["vSisOrd"], 1)],
        [barra_v(cats[3], D["vBrewer"], 2, aprox=True)],
    ],
})

# M8 · la varianza bajo Poisson en función de la pi del elefante. La curva es la fórmula del
# bloque del módulo 8, V(p) = sum_{k != elefante} (1/pi_k - 1) y_k^2 + (1/p - 1) y_e^2, con
# elefante.y y piBase, en una malla densa (la poligonal de los 8 puntos de elefante.malla
# sobrestimaba la curva hasta un 20 % entre puntos; auditoría de T7.112). Se comprueba que pasa
# por elefante.curva y por vBase. Eje x en %, eje y en miles de millones.
E = pre["elefante"]
ie = E["y"].index(E["yElefante"])
resto = sum((1 / q - 1) * y ** 2 for k, (q, y) in enumerate(zip(E["piBase"], E["y"])) if k != ie)


def v_eleph(p):
    return resto + (1 / p - 1) * E["yElefante"] ** 2


for q, v in zip(E["malla"], E["curva"]):
    assert abs(v_eleph(q) / v - 1) < 1e-9, (q, v)
assert abs(v_eleph(E["piElefanteX"]) / E["vBase"] - 1) < 1e-6    # piElefanteX viene redondeada a 8 decimales
malla = sorted({0.005 * 100 ** (i / 79) for i in range(80)} | {E["piElefanteX"]})
c005, c05 = v_eleph(0.005), v_eleph(0.5)
guarda("m8_elefante.json", {
    "tipo": "animado", "titulo": "Varianza del HT bajo Poisson según la π del elefante", **LIENZO,
    "margen_derecho": 40,
    # el eje va en %, y los rótulos dan la π en proporción: el título dice cómo se pasa de uno a otro
    "x": {"titulo": "π del elefante, en % (0,5 % es π = 0,005)", "min": 0, "max": 50,
          "marcas": [0, 10, 20, 30, 40, 50]},
    # y desde −1: el anillo de π = 0,5 ya no tapa la marca «50» del eje x
    "y": {"titulo": "varianza (miles de millones)", "min": -1, "max": 16, "marcas": [0, 4, 8, 12, 16]},
    "etapas": [
        [{"tipo": "linea", "serie": 5, "radio": 0, "x": [round(100 * p, 4) for p in malla],
          "y": [round(v_eleph(p) / 1e9, 4) for p in malla]}],
        [{"tipo": "marca", "x": round(100 * E["piElefanteX"], 3), "y": round(E["vBase"] / 1e9, 4),
          "texto": f"su π por área, {coma(E['piElefanteX'], 4)}: {miles(E['vBase'] / 1e6)} millones",
          "lado": "derecha", "texto_dy": -70}],    # más arriba: abajo choca con el rótulo de π = 0,5
        [{"tipo": "marca", "x": 0.5, "y": round(c005 / 1e9, 4),
          "texto": f"π = 0,005: {miles(c005 / 1e6)} millones, ×{coma(E['razon005Base'], 1)}",
          "lado": "derecha"}],
        [{"tipo": "marca", "x": 50, "y": round(c05 / 1e9, 4),
          "texto": f"π = 0,5: {miles(c05 / 1e6)} millones", "lado": "arriba", "texto_dx": -65}],
    ],
})

# M9 · el peso final de un estudiante de cada clase del marco (classpps.tamanos), con m = 4:
# probabilidades iguales, w = (N/n)·M_i/m; PPT, w = K/(n·m). Son las fórmulas del simulador
# «La cancelación, en vivo».
C = pre["classpps"]
assert len(set(C["mi"])) == 1
m = C["mi"][0]                          # 4 estudiantes en cada clase
w_igual = [C["Nclases"] / C["n"] * Mi / m for Mi in C["tamanos"]]
w_ppt = C["K"] / (C["n"] * m)
clases = [str(i + 1) for i in range(len(C["tamanos"]))]
imax, imin = w_igual.index(max(w_igual)), w_igual.index(min(w_igual))
assert imin == len(clases) - 1          # la menor es la última: su rótulo va al margen derecho


def corto(v):
    return coma(v, 2).rstrip("0").rstrip(",")


derecha = len(clases) - 0.5             # el borde derecho del eje: los rótulos salen al margen
guarda("m9_pesos.json", {
    "tipo": "animado", "titulo": f"Peso final de un estudiante de cada clase del marco (m = {m})", **LIENZO,
    "margen_derecho": 170,
    "x": {"titulo": "clase del marco", "categorias": clases},
    "y": {"titulo": "peso final", "min": 0, "max": 80, "marcas": [0, 20, 40, 60, 80]},
    "etapas": [
        [{"tipo": "barra", "x": c, "y": w, "serie": 5, "ancho": 0.6,
          **({"texto": f"{corto(w)} (M = {C['tamanos'][i]})"} if i == imax else {})}
         for i, (c, w) in enumerate(zip(clases, w_igual))]
        + [{"tipo": "texto", "x": derecha, "y": w_igual[imin], "serie": 5, "ancla": "inicio",
            "texto": f"{corto(w_igual[imin])} (M = {C['tamanos'][imin]})"},
           {"tipo": "texto", "x": -0.4, "y": 72, "serie": 5, "ancla": "inicio",
            "texto": f"probabilidades iguales: de {corto(min(w_igual))} a {corto(max(w_igual))}"}],
        [{"tipo": "referencia", "y": w_ppt, "serie": 1},
         {"tipo": "texto", "x": derecha, "y": w_ppt, "serie": 1, "ancla": "inicio",
          "texto": f"PPT: {corto(w_ppt)} todas"}],
    ],
})

print(f"4 gráficos en {dest.relative_to(raiz)}")
