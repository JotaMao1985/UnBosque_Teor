"""Genera los gráficos animados de las diapositivas del cap. 4 de Muestreo (T7.94).

Escribe los trece .json de sitio/muestreo/diapositivas/fuentes/recursos/cap4/, que la skill
diapositivas-clase dibuja como SVG animado. Cada cifra sale de una de tres fuentes, y se dice cuál:
  · las salidas de R del capítulo (bloques verificados con precalculo/verifica_bloques.py), copiadas literal;
  · precalculo/salidas/cap4_datos.json (el precálculo que alimenta los simuladores), leído aquí;
  · dos cálculos de verificación propios, anotados en su bloque (el promedio bruto esperado y el
    error estándar verdadero del STPPS de BigLucy, este con precalculo/verifica_biglucy_ppt.R).
Uso, desde la raíz del repositorio: python3 precalculo/genera_diapositivas_cap4.py
Después, reconstruir con construir.py: los .json están versionados y las fuentes los leen.
"""
import json
import sys
from pathlib import Path

raiz = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent
pre = json.loads((raiz / "precalculo/salidas/cap4_datos.json").read_text())
dest = raiz / "sitio/muestreo/diapositivas/fuentes/recursos/cap4"
dest.mkdir(parents=True, exist_ok=True)


def coma(v, dec):
    return f"{v:.{dec}f}".replace(".", ",")


def miles(v):
    """Miles separados por espacio no separable (U+00A0), como el resto de las diapositivas."""
    return f"{v:,.0f}".replace(",", "\u00a0")


def guarda(nombre, datos):
    (dest / nombre).write_text(json.dumps(datos, ensure_ascii=False, indent=1) + "\n")


REG = ["Norte-Centro", "Nordeste", "Sur", "Oeste"]

# M1 · medias por región (bloque R1 del cap. 4) y media nacional (precálculo: distribucion.media)
medias = {"Norte-Centro": 325951, "Nordeste": 90619, "Sur": 199140, "Oeste": 723344}
mu = pre["distribucion"]["media"]
guarda("m1_medias.json", {
    "tipo": "animado", "titulo": "Media de acres92 por condado en cada región (agpop, censo)",
    "x": {"categorias": REG},
    "y": {"titulo": "miles de acres", "min": 0, "max": 800, "marcas": [0, 200, 400, 600, 800]},
    "etapas": [
        [{"tipo": "barra", "x": "Nordeste", "y": medias["Nordeste"] / 1000, "texto": miles(medias["Nordeste"]), "serie": 3}],
        [{"tipo": "barra", "x": "Oeste", "y": medias["Oeste"] / 1000, "texto": miles(medias["Oeste"]), "serie": 2}],
        [{"tipo": "barra", "x": "Norte-Centro", "y": medias["Norte-Centro"] / 1000, "texto": miles(medias["Norte-Centro"]), "serie": 1},
         {"tipo": "barra", "x": "Sur", "y": medias["Sur"] / 1000, "texto": miles(medias["Sur"]), "serie": 1}],
        [{"tipo": "referencia", "y": mu / 1000},
         {"tipo": "texto", "x": 2, "y": 345, "texto": f"media nacional: {miles(mu)}"}],
    ],
})

# M3 · valor esperado del promedio bruto frente al ponderado.
# 306 723 y 420 650 son cálculo de verificación con agpop (R 4.4): sum(n_h * media_h) / 300
# con el reparto de agstrat (103/21/135/41) y con el de Neyman (86/5/102/107); no están escritos en el material.
# El rótulo no nombra a Neyman: la sección 3 va antes de que se defina (PE-8).
# (el M13 dice «sube unos 114 000 acres»: 420 650 − 306 677 = 113 973).
guarda("m3_bruto.json", {
    "tipo": "animado", "titulo": "Valor esperado del promedio bruto y del ponderado",
    "x": {"categorias": ["Ponderado", "Bruto · 41 al Oeste", "Bruto · 107 al Oeste"]},
    "y": {"titulo": "miles de acres", "min": 0, "max": 450, "marcas": [0, 100, 200, 300, 400]},
    "base": [{"tipo": "referencia", "y": mu / 1000}],
    "etapas": [
        [{"tipo": "barra", "x": "Ponderado", "y": mu / 1000, "texto": miles(mu), "serie": 1, "ancho": 0.45}],
        [{"tipo": "barra", "x": "Bruto · 41 al Oeste", "y": 306.7234, "texto": "306\u00a0723", "serie": 5, "ancho": 0.45}],
        [{"tipo": "barra", "x": "Bruto · 107 al Oeste", "y": 420.650, "texto": "420\u00a0650", "serie": 6, "ancho": 0.45}],
    ],
})

# M4 · las tres asignaciones (bloque «Las tres asignaciones sobre agpop»)
asig = [("Proporcional", [103, 21, 135, 41], 5, -0.28),
        ("Igual", [75, 75, 75, 75], 3, 0.0),
        ("Neyman", [86, 5, 102, 107], 2, 0.28)]
etapas = []
for k, (nombre, vals, s, d) in enumerate(asig):
    et = [{"tipo": "barra", "x": REG[i], "y": v, "texto": str(v), "serie": s, "ancho": 0.26, "desplazamiento": d}
          for i, v in enumerate(vals)]
    et.append({"tipo": "texto", "x": -0.42, "y": 150 - 12 * k, "texto": nombre, "ancla": "inicio", "serie": s})
    etapas.append(et)
guarda("m4_asignaciones.json", {
    "tipo": "animado", "titulo": "Tres repartos de n = 300 entre las regiones",
    "x": {"categorias": REG},
    "y": {"titulo": "entrevistas (n_{h})", "min": 0, "max": 155, "marcas": [0, 50, 100, 150]},
    "etapas": etapas,
})

# M4 · interpolar con alfa (bloque «El deff de cada asignación medido con dos variables»).
# Los rótulos de α = 0,25 se apartan de la línea vertical (PE-17).
alfa_cat = ["0 · proporcional", "0,25", "0,5", "0,75", "1 · Neyman"]
acres = [0.8224, 0.6919, 0.6108, 0.5667, 0.551]
farms = [0.9723, 0.9237, 0.9304, 0.9802, 1.119]
guarda("m4_alfa.json", {
    "tipo": "animado", "titulo": "deff de n_h ∝ N_h S_h^α con dos variables",
    "margen_derecho": 120,
    "x": {"titulo": "α", "categorias": alfa_cat},
    "y": {"titulo": "deff", "min": 0.45, "max": 1.2, "marcas": [1]},
    "base": [{"tipo": "referencia", "y": 1, "texto": "MAS (deff = 1)"}],
    "etapas": [
        [{"tipo": "linea", "x": [0, 1, 2, 3, 4], "y": acres, "serie": 1, "nombre": "acres92",
          "etiquetas": ["" if k == 1 else coma(v, 4) if v != 0.551 else "0,551" for k, v in enumerate(acres)],
          "etiquetas_dy": 30},
         {"tipo": "texto", "x": 0.93, "y": acres[1] - 0.06, "texto": coma(acres[1], 4), "ancla": "fin", "serie": 1}],
        [{"tipo": "linea", "x": [0, 1, 2, 3, 4], "y": farms, "serie": 2, "nombre": "farms92",
          "etiquetas": ["" if k == 1 else coma(v, 4) if v != 1.119 else "1,119" for k, v in enumerate(farms)]},
         {"tipo": "texto", "x": 1.07, "y": farms[1] + 0.035, "texto": coma(farms[1], 4), "ancla": "inicio", "serie": 2}],
        [{"tipo": "referencia", "x": 1, "texto": "α = 0,25", "serie": 4}],
    ],
})

# M5 · tamaño total para un 10 % de error relativo (bloques «El tamaño total…» y «Un estrato de certeza…»)
cats5 = ["MAS", "Proporcional", "Igual", "Neyman", "Certeza + proporcional"]
vals5 = [595, 506, 462, 356, 316]
ser5 = [5, 1, 1, 1, 2]
et5 = [[{"tipo": "barra", "x": c, "y": v, "texto": str(v), "serie": s, "ancho": 0.5}] for c, v, s in zip(cats5, vals5, ser5)]
et5[-1].append({"tipo": "texto", "x": 4.45, "y": 450, "texto": "31 censados + 285 sorteados", "ancla": "fin", "serie": 2})
guarda("m5_tamano.json", {
    "tipo": "animado", "titulo": "Condados necesarios para un error del 10 % sobre acres92",
    "x": {"categorias": cats5},
    "y": {"titulo": "condados (n)", "min": 0, "max": 700, "marcas": [0, 200, 400, 600]},
    "base": et5[0],
    "etapas": et5[1:],
})

# M6 · deff de cuatro particiones (bloque «Cuatro maneras de partir agpop»; precálculo constructor.opciones)
ops = {o["etiqueta"]: o["deff"] for o in pre["constructor"]["opciones"]}
part = [("Al azar", ops["4 grupos al azar"]), ("Cuartiles farms92", ops["Cuartiles de farms92"]),
        ("Región", ops["Región (la de Lohr)"]), ("Cuartiles acres87", ops["Cuartiles de acres87"])]
guarda("m6_particiones.json", {
    "tipo": "animado", "titulo": "deff de la asignación proporcional según cómo se parte agpop",
    "x": {"categorias": [p for p, _ in part]},
    "y": {"titulo": "deff", "min": 0, "max": 1.2, "marcas": [0, 1]},
    "base": [{"tipo": "referencia", "y": 1, "texto": "MAS"}],
    "etapas": [[{"tipo": "barra", "x": p, "y": round(v, 4), "texto": coma(round(v, 4), 4), "serie": s, "ancho": 0.5}]
               for (p, v), s in zip(part, [5, 5, 1, 2])],
})

# M6 · deff al aumentar H por cuantiles de acres87 (precálculo constructor.barridoH).
# Rótulos bajo la curva (la línea de región tachaba 0,731) y la flecha con la curva, sin etapa propia (PE-16, PE-17).
bar = pre["constructor"]["barridoH"]
Hs = [b["H"] for b in bar]
ds = [round(b["deff"], 3) for b in bar]
etq = [coma(d, 3) if h in (2, 4, 6, 10) else "" for h, d in zip(Hs, ds)]
i6, i10 = Hs.index(6), Hs.index(10)
guarda("m6_barrido.json", {
    "tipo": "animado", "titulo": "deff al partir agpop en H estratos por cuantiles de acres87",
    "x": {"titulo": "número de estratos H", "min": 1.5, "max": 10.5, "marcas": Hs},
    "y": {"titulo": "deff", "min": 0, "max": 1.1, "marcas": [0, 1]},
    "base": [{"tipo": "referencia", "y": 1, "texto": "MAS"},
             {"tipo": "referencia", "y": round(ops["Región (la de Lohr)"], 4), "texto": "región (H = 4): 0,8212"}],
    "etapas": [
        [{"tipo": "linea", "x": Hs, "y": ds, "serie": 2, "etiquetas": etq, "etiquetas_dy": 30},
         {"tipo": "flecha", "desde": [6, ds[i6] + 0.12], "hasta": [10, ds[i10] + 0.12],
          "texto": "de H = 6 a 10: casi ¼ menos de varianza", "serie": 4}],
    ],
})

# M7 · R² entre estratos frente al ahorro de varianza (bloque «La descomposición ANOVA de agpop por región»)
cats7 = ["Región", "Cuartiles acres87", "Cuartiles farms92", "Al azar"]
r2 = [18.00, 46.09, 1.37, 0.00]
ah = [17.88, 46.04, 1.28, -0.09]
guarda("m7_r2.json", {
    "tipo": "animado", "titulo": "Lo que explica la partición frente a lo que se ahorra",
    "x": {"categorias": cats7},
    "y": {"titulo": "% de la variabilidad", "min": -3, "max": 60, "marcas": [0, 20, 40, 60]},
    "etapas": [
        [{"tipo": "barra", "x": c, "y": v, "texto": coma(v, 2), "serie": 1, "ancho": 0.32, "desplazamiento": -0.17}
         for c, v in zip(cats7, r2)]
        + [{"tipo": "texto", "x": 1.9, "y": 55, "texto": "R^{2} entre estratos = SSB/SST", "ancla": "inicio", "serie": 1}],
        [{"tipo": "barra", "x": c, "y": v, "texto": coma(v, 2).replace("-", "−"), "serie": 2, "ancho": 0.32, "desplazamiento": 0.17}
         for c, v in zip(cats7, ah)]
        + [{"tipo": "texto", "x": 1.9, "y": 47, "texto": "ahorro de varianza = 1 − deff", "ancla": "inicio", "serie": 2}],
    ],
})


# M7 · las 10 000 réplicas de cada diseño (precálculo distribucion), como contorno de histograma
def escalera(h):
    c, n, w = h["centros"], h["conteo"], h["ancho"]
    xs, ys = [c[0] / 1000 - w / 2000], [0]
    for ci, ni in zip(c, n):
        xs += [ci / 1000 - w / 2000, ci / 1000 + w / 2000]
        ys += [ni, ni]
    xs.append(c[-1] / 1000 + w / 2000)
    ys.append(0)
    return [round(x, 3) for x in xs], ys


dist = pre["distribucion"]
xa, ya = escalera(dist["mas"])
xb, yb = escalera(dist["estratificado"])
guarda("m7_histogramas.json", {
    "tipo": "animado", "titulo": "Media estimada en 10 000 réplicas de dos diseños, n = 300",
    "x": {"titulo": "media estimada (miles de acres)", "min": 230, "max": 410, "marcas": [250, 300, 350, 400]},
    "y": {"titulo": "réplicas por caja", "min": 0, "max": 900, "marcas": [0, 300, 600, 900]},
    "base": [{"tipo": "referencia", "x": round(dist["media"] / 1000, 3), "texto": "media verdadera"}],
    "etapas": [
        [{"tipo": "linea", "x": xa, "y": ya, "serie": 1, "radio": 0},
         {"tipo": "texto", "x": 262, "y": 300, "texto": "A", "serie": 1}],
        [{"tipo": "linea", "x": xb, "y": yb, "serie": 2, "radio": 0},
         {"tipo": "texto", "x": 290, "y": 840, "texto": "B", "serie": 2}],
    ],
})

# M9 · BigLucy: error estándar verdadero del total de Income con m_h = 60/120/200 (ES-6, mejora 19).
# 582 346 es ppt.seStsi del precálculo (MAS sin reemplazo en cada nivel). 980 501 es cálculo de verificación
# con R 4.4 (precalculo/verifica_biglucy_ppt.R): varianza exacta de Hansen–Hurwitz,
# sum_h (1/m_h) sum_k psi_k (y_k/psi_k − t_h)^2.
ppt = pre["ppt"]
pe_ = pre["postestratificacion"]
se_hh = 980501
guarda("m9_biglucy.json", {
    "tipo": "animado", "titulo": "Error estándar verdadero del total de Income en BigLucy (m_{h} = 60/120/200)",
    "x": {"categorias": ["MAS en cada nivel", "PPT por empleados (STPPS)"]},
    "y": {"titulo": "miles", "min": 0, "max": 1200, "marcas": [0, 400, 800, 1200]},
    "etapas": [
        [{"tipo": "barra", "x": "MAS en cada nivel", "y": round(ppt["seStsi"] / 1000, 3), "texto": miles(ppt["seStsi"]),
          "serie": 1, "ancho": 0.45}],
        [{"tipo": "barra", "x": "PPT por empleados (STPPS)", "y": se_hh / 1000, "texto": miles(se_hh),
          "serie": 6, "ancho": 0.45}],
    ],
})

# M10 · decidir tarde frente a elegir la asignación (PE-16): ee verdaderos de la media con n = 300.
# 21 109,07 y 21 272,24: precálculo postestratificacion.primaEeProp y .primaEePost (iguales a la salida del módulo 10);
# 17 290,784: salida del bloque «Las tres asignaciones sobre agpop» (módulo 4).
neyman_ee = 17290.784
guarda("m10_prima.json", {
    "tipo": "animado", "titulo": "Error estándar verdadero de la media de acres92 con n = 300",
    "x": {"categorias": ["Estratificado · proporcional", "Postestratificado", "Estratificado · Neyman"]},
    "y": {"titulo": "miles de acres", "min": 0, "max": 25, "marcas": [0, 5, 10, 15, 20, 25]},
    "etapas": [
        [{"tipo": "barra", "x": "Estratificado · proporcional", "y": round(pe_["primaEeProp"] / 1000, 3),
          "texto": miles(pe_["primaEeProp"]), "serie": 1, "ancho": 0.45}],
        [{"tipo": "barra", "x": "Postestratificado", "y": round(pe_["primaEePost"] / 1000, 3),
          "texto": "≈ " + miles(pe_["primaEePost"]), "serie": 2, "ancho": 0.45}],
        [{"tipo": "barra", "x": "Estratificado · Neyman", "y": round(neyman_ee / 1000, 3),
          "texto": miles(neyman_ee), "serie": 3, "ancho": 0.45}],
    ],
})

# M10 · el peso antes y después de postestratificar (precálculo postestratificacion.w0 y .wPost)
pe = pre["postestratificacion"]
guarda("m10_pesos.json", {
    "tipo": "animado", "titulo": "Peso de un condado de agsrs por región",
    "x": {"categorias": REG},
    "y": {"titulo": "peso (condados que representa)", "min": 0, "max": 12, "marcas": [0, 3, 6, 9, 12]},
    "base": [{"tipo": "barra", "x": REG[i], "y": pe["w0"], "texto": coma(pe["w0"], 2), "serie": 5,
              "ancho": 0.36, "desplazamiento": -0.2} for i in range(4)],
    "etapas": [[{"tipo": "barra", "x": REG[i], "y": round(w, 4), "texto": coma(w, 2), "serie": 2,
                 "ancho": 0.36, "desplazamiento": 0.2} for i, w in enumerate(pe["wPost"])]],
})

# M12 · raíz del ECM relativo de la razón combinada y la separada según n_h (precálculo razonEstratificada).
# Los rótulos de n_h = 3 van a la izquierda, lejos de la línea del cruce y de las curvas (PE-17).
re_ = pre["razonEstratificada"]
nh = re_["nh"]
guarda("m12_recm.json", {
    "tipo": "animado", "titulo": "Raíz del error cuadrático medio relativo (%) según n_h",
    "margen_derecho": 140,
    "x": {"titulo": "unidades por estrato (n_{h})", "min": -0.6, "max": 20.5, "marcas": [3, 5, 10, 15, 20]},
    "y": {"titulo": "raíz del ECM relativo (%)", "min": 0, "max": 8, "marcas": [0, 2, 4, 6, 8]},
    "etapas": [
        [{"tipo": "linea", "x": nh, "y": [round(v, 3) for v in re_["ecmComb"]], "serie": 1, "radio": 5,
          "nombre": "combinada", "nombre_dy": -14}],
        [{"tipo": "linea", "x": nh, "y": [round(v, 3) for v in re_["ecmSep"]], "serie": 2, "radio": 5,
          "nombre": "separada", "nombre_dy": 14}],
        [{"tipo": "referencia", "x": re_["cruce"], "texto": f"cruce: n_{{h}} = {re_['cruce']}", "serie": 4},
         {"tipo": "marca", "x": nh[0], "y": round(re_["ecmSep"][0], 3), "texto": coma(re_["ecmSep"][0], 3) + " %", "lado": "izquierda"},
         {"tipo": "marca", "x": nh[0], "y": round(re_["ecmComb"][0], 3), "texto": coma(re_["ecmComb"][0], 3) + " %", "lado": "izquierda", "serie": 1}],
    ],
})

print("escritos:", sorted(p.name for p in dest.glob("*.json")))
