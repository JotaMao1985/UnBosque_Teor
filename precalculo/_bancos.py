#!/usr/bin/env python3
"""Carga de los bancos de autoevaluación: una sola verdad para todo el que mire ítems.

Por qué existe: `inventario_items.py` había resuelto lo difícil —ejecutar un
banco que vive dentro de un HTML de 200 KB, con su JSON incrustado y los
ayudantes de gráfico del motor— y la auditoría del banco necesitaba lo mismo.
Copiar el cargador habría dejado dos verdades sobre qué es un ítem: la primera
vez que cambie el marcado de un capítulo, una de las dos se entera y la otra no.
Así que el cargador vive aquí y los dos guiones lo importan.

Lo que NO hace: decidir qué se mira de cada ítem. Eso lo pone quien llama, en el
`vuelca` —un fragmento de JavaScript que recibe `BANCO` y escribe JSON—, porque
el inventario quiere un resumen y la auditoría quiere el texto de cada opción.

Necesita node. No necesita R.
"""
import json
import re
import subprocess
import tempfile
import unicodedata
from html import unescape
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SITIO = RAIZ / "sitio" / "muestreo"

CAPITULOS = {
    "cap1": SITIO / "capitulo-1-encuestas-sesgos.html",
    "cap2": SITIO / "capitulo-2-diseno-mas-sistematico.html",
    "cap3": SITIO / "capitulo-3-razon-y-regresion.html",
    "cap4": SITIO / "capitulo-4-muestreo-estratificado.html",
    "cap5": SITIO / "capitulo-5-conglomerados.html",
    "cap6": SITIO / "capitulo-6-probabilidades-desiguales.html",
    "cap7": SITIO / "capitulo-7-encuestas-complejas.html",
    "cap8": SITIO / "capitulo-8-no-respuesta-ponderacion.html",
}
# Los dos capítulos del Corte I, que son los que evalúa el Parcial 1.
CORTE_I = ("cap1", "cap2")

SIMULACRO = RAIZ / "ensamblado" / "modulos" / "taller1" / "simulacro.js"
DATOS_SIMULACRO = RAIZ / "precalculo" / "salidas" / "taller1_recurso_datos.json"


class Fallo(Exception):
    pass


# El doble es CHART.JS, no los ayudantes.
#
# La primera versión sustituía `crearGraficoBarras` y `crearGraficoXY` por
# muñecos que solo registraban la llamada. Dos problemas, los dos pagados:
# la firma del muñeco era la del simulacro —`(canvas, datasets, o)`— y los
# capítulos llaman `(canvas, etiquetas, valores, o)`; y varios `dibujar`
# post-procesan el objeto devuelto (`g.options.scales.y.type`,
# `g.data.datasets[0].backgroundColor`, `g.update('none')`), cosa que un muñeco
# que devuelve `{destroy(){}}` no soporta. Resultado: seis gráficos sanos
# declarados rotos.
#
# Los ayudantes reales del capítulo terminan todos en `new Chart(canvas, cfg)`,
# así que basta con que `Chart` sea el doble: los ayudantes corren de verdad, con
# su firma de verdad, y el objeto devuelto tiene `data` y `options` porque los
# construyó el propio capítulo.
CHART_DOBLE = r"""
const registro = [];
class Chart {
  constructor(canvas, cfg) {
    this.canvas = canvas;
    this.config = cfg;
    this.data = cfg.data || { datasets: [] };
    this.options = cfg.options || {};
    registro.push(cfg);
  }
  update() {}
  destroy() {}
  resize() {}
}
const document = { createElement: () => ({ getContext: () => ({}) }) };
"""

# Los ayudantes que un `dibujar` puede llamar. Se extraen del propio capítulo:
# si mañana cambia su firma, cambia aquí sola.
AYUDANTES = ("crearGraficoBarras", "crearGraficoXY", "crearGraficoLineas",
             "serieHistograma", "serieVertical")


def funcion(texto, nombre):
    """`function nombre(...) { ... }` completa, casando llaves. None si no está."""
    m = re.search(rf"\n    function {nombre}\s*\(", texto)
    if not m:
        return None
    # Saltar la lista de parámetros ANTES de buscar el cuerpo: `opciones = {}`
    # es una llave que abre y cierra, y contarla como cuerpo dejaba la función
    # truncada en su propia firma.
    hondo, j = 1, m.end()
    while hondo:
        if texto[j] == "(":
            hondo += 1
        elif texto[j] == ")":
            hondo -= 1
        j += 1
    i = texto.index("{", j)
    hondo, j = 0, i
    while j < len(texto):
        c = texto[j]
        if c == "{":
            hondo += 1
        elif c == "}":
            hondo -= 1
            if hondo == 0:
                return texto[m.start():j + 1]
        j += 1
    raise Fallo(f"{nombre}: no cierra")


def ayudantes(ruta):
    """El doble de Chart más los ayudantes REALES de esa página."""
    t = ruta.read_text(encoding="utf-8")
    piezas = [CHART_DOBLE]
    for nombre in AYUDANTES:
        f = funcion(t, nombre)
        if f:
            piezas.append(f)
    return "\n".join(piezas)


def trozo(texto, inicio, fin, que):
    """El fragmento entre dos anclas, comprobando que cada una aparece una vez."""
    if texto.count(inicio) != 1:
        raise Fallo(f"{que}: el ancla de apertura aparece {texto.count(inicio)} veces, no 1")
    i = texto.index(inicio)
    j = texto.find(fin, i)
    if j < 0:
        raise Fallo(f"{que}: no se encuentra el cierre del banco")
    return texto[i:j]


def corre_node(guion, *argumentos):
    with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as f:
        f.write(guion)
        ruta = f.name
    try:
        r = subprocess.run(["node", ruta, *argumentos], capture_output=True, text=True)
        if r.returncode != 0:
            raise Fallo(f"el banco no se ejecuta:\n{r.stderr.strip()}")
        return json.loads(r.stdout)
    finally:
        Path(ruta).unlink()


# Los ítems `grafico` de los capítulos usan la paleta del motor. No se inventa
# aquí: se extrae del propio capítulo, para que si cambia no haya dos verdades.
def paleta():
    fuente = CAPITULOS["cap1"].read_text(encoding="utf-8")
    return trozo(fuente, "const COLORES_GRAFICO = {", "\n    };", "paleta") + "\n};"


def banco_capitulo(clave, vuelca, ruta=None):
    """Ejecuta AUTOEVALUACIONES['capN'] con su JSON incrustado y sus ayudantes."""
    ruta = ruta or CAPITULOS[clave]
    t = ruta.read_text(encoding="utf-8")
    const = f"DATOS_{clave.upper()}"
    m = re.search(rf"const {const}\s*=\s*(\{{.*)", t)
    if not m:
        raise Fallo(f"{clave}: no aparece `const {const} = ...`")
    datos = m.group(1).rstrip().rstrip(";")
    # Del capítulo 4 en adelante los `dibujar` no usan DATOS_CAPN sino un alias
    # corto (`const D4 = DATOS_CAP4;`) que vive en el cierre del capítulo. Sin
    # él, los seis gráficos de los caps. 4 a 8 lanzan «D4 is not defined» y el
    # volcado los da por rotos: un defecto INVENTADO, que es el peor que puede
    # producir una herramienta de auditoría.
    alias = re.search(rf"const (D\d+)\s*=\s*{const};", t)
    linea_alias = f"const {alias.group(1)} = {const};\n" if alias else ""
    banco = trozo(t, f"AUTOEVALUACIONES['{clave}'] = [", "\n    ];", clave)
    banco = banco.split("=", 1)[1].strip() + "\n]"
    guion = (f"{paleta()}\nconst {const} = {datos};\n{linea_alias}{ayudantes(ruta)}"
             f"\nconst BANCO = {banco};\n{vuelca}")
    return corre_node(guion)


def banco_simulacro(vuelca):
    """Ejecuta BANCO_TALLER1 sobre el JSON real del precálculo."""
    if not SIMULACRO.exists() or not DATOS_SIMULACRO.exists():
        raise Fallo(f"falta el simulacro o su JSON: {SIMULACRO} / {DATOS_SIMULACRO}")
    guion = (
        paleta() + "\n"
        "const fs = require('fs');\n"
        "const DATOS_TALLER1 = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));\n"
        "const AUTOEVALUACIONES = {};\n"
        + ayudantes(CAPITULOS['cap1'])
        + SIMULACRO.read_text(encoding="utf-8")
        + "\nconst BANCO = BANCO_TALLER1;\n"
        + vuelca
    )
    return corre_node(guion, str(DATOS_SIMULACRO))


def modulos(clave, ruta=None):
    """Los módulos del capítulo, leídos de courseData: (id, título)."""
    ruta = ruta or CAPITULOS[clave]
    t = ruta.read_text(encoding="utf-8")
    i = t.find("courseData")
    seg = t[i:i + 3000]
    ms = [(int(a), b) for a, b in re.findall(r'id:\s*(\d+),\s*title:\s*"([^"]+)"', seg)]
    if not ms:
        raise Fallo(f"{clave}: no se leen los módulos de courseData")
    return ms


def limpia(html):
    """El texto sin marcado, para poder comparar dos enunciados."""
    if not html:
        return ""
    t = re.sub(r"<[^>]+>", " ", unescape(html))
    t = unicodedata.normalize("NFC", t).lower()
    return re.sub(r"\s+", " ", t).strip()
