#!/usr/bin/env python3
"""Ensambla sitio/muestreo/capitulo-5-conglomerados.html desde la plantilla,
los módulos escritos aparte y las cadenas de código ya ejecutadas.

Mismo mecanismo que ensambla_cap4.py. Este capítulo es NUEVO: no sustituye a
ninguno del formato antiguo — es el primero de las semanas 10-16 que el
material viejo no cubría.
"""
import html as html_mod
import json
import re
import sys
from pathlib import Path

# Se ejecuta desde la raíz del repositorio (la carpeta Muestreo/).
RAIZ = Path(__file__).resolve().parent.parent
PLANTILLA = RAIZ / "plantilla" / "plantilla-capitulo-muestreo.html"
DESTINO = RAIZ / "sitio" / "muestreo" / "capitulo-5-conglomerados.html"


def corta(texto, inicio, fin, que):
    """Devuelve (antes, despues) partiendo por dos anclas. Aborta si no están."""
    i = texto.find(inicio)
    if i < 0:
        sys.exit(f"ABORTA: no encuentro el ancla de inicio de {que}")
    j = texto.find(fin, i)
    if j < 0:
        sys.exit(f"ABORTA: no encuentro el ancla de fin de {que}")
    return texto[:i], texto[j:]


def bloques_de(ruta):
    """Parte una cadena ejecutable en sus bloques, por los marcadores.

    El marcador vive DENTRO de una llamada `cat("\\n###BLOQUE-X###\\n")`, así que
    al partir por él cada cuerpo queda con la cola de esa llamada al principio
    (`\\n")`) y la cabeza de la siguiente al final (`cat("\\n`). Las dos se
    quitan por líneas: si quedaran, el bloque publicado no compilaría.
    """
    texto = ruta.read_text(encoding="utf-8")
    partes = re.split(r'###BLOQUE-([A-Za-z0-9]+)###', texto)
    out = {}
    cola = re.compile(r'^\\n"\)$')
    cabeza = re.compile(r'^(cat|print)\("\\n$')
    for i in range(1, len(partes) - 1, 2):
        lineas = partes[i + 1].split("\n")
        while lineas and (cola.match(lineas[0].strip()) or not lineas[0].strip()):
            lineas.pop(0)
        while lineas and (cabeza.match(lineas[-1].strip()) or not lineas[-1].strip()):
            lineas.pop()
        cuerpo = "\n".join(lineas)
        if not cuerpo.strip():
            sys.exit(f"ABORTA: el bloque {partes[i]} quedó vacío al recortarlo")
        if '###BLOQUE' in cuerpo or 'cat("\\n' in cuerpo or 'print("\\n' in cuerpo:
            sys.exit(f"ABORTA: el bloque {partes[i]} conserva restos del marcador")
        out[partes[i]] = cuerpo
    return out


def main():
    html = PLANTILLA.read_text(encoding="utf-8")

    # ---------------------------------------------------------------- cabecera
    reemplazos = [
        ('content="Plantilla base para los capítulos del material de Muestreo Estadístico '
         '(Universidad El Bosque): cajas, código R/Python en pestañas, simuladores con Chart.js, '
         'autoevaluación y ejercicios guiados."',
         'content="Capítulo 5 del material de Muestreo Estadístico (Universidad El Bosque): '
         'muestreo por conglomerados en una y dos etapas, correlación intraclase, efecto de diseño, '
         'estimadores de razón con tamaños desiguales, diseño con costos por etapas y datos '
         'agrupados en machine learning, con simuladores y código en R y Python."'),
        ('<meta name="keywords" content="muestreo estadístico, muestreo probabilístico, '
         'Horvitz-Thompson, probabilidades de inclusión, estratificado, conglomerados, PPT, survey, '
         'R, Python, UnBosque">',
         '<meta name="keywords" content="muestreo por conglomerados, dos etapas, correlación '
         'intraclase, ICC, efecto de diseño, deff, unidades primarias de muestreo, UPM, '
         'submuestreo, coots, E.2SI, GroupKFold, minibatch, survey, R, Python, Lohr, Gutiérrez, '
         'UnBosque">'),
        ('<title>Plantilla de capítulo — Muestreo Estadístico</title>',
         '<title>Capítulo 5 · Muestreo por conglomerados — Muestreo Estadístico</title>'),
        ('<p class="text-xs text-white/70 font-medium tracking-wide" style="margin:0; text-align:left;">PLANTILLA BASE •\n'
         '              4 MÓDULOS DE DEMOSTRACIÓN • UNBOSQUE</p>',
         '<p class="text-xs text-white/70 font-medium tracking-wide" style="margin:0; text-align:left;">CAPÍTULO 5 •\n'
         '              MUESTREO POR CONGLOMERADOS • SEMANAS 10–11 • UNBOSQUE</p>'),
        ('<p class="text-xs mt-1 text-white/60" style="text-align:center;">Plantilla de capítulo • UnBosque 2026\n        </p>',
         '<p class="text-xs mt-1 text-white/60" style="text-align:center;">Muestreo Estadístico • Capítulo 5 • UnBosque 2026-II\n        </p>'),
        ('<i class="fas fa-layer-group text-xl text-white" aria-hidden="true"></i>',
         '<i class="fas fa-cubes text-xl text-white" aria-hidden="true"></i>'),
    ]
    for viejo, nuevo in reemplazos:
        if viejo not in html:
            sys.exit(f"ABORTA: no encuentro en la plantilla el texto:\n{viejo[:110]}...")
        html = html.replace(viejo, nuevo, 1)

    # Componentes que este capítulo necesita de la plantilla.
    for marca, quien in [(".glosario-notacion {", "el CSS del glosario"),
                         (".arbol-error {", "el CSS del árbol del error"),
                         (".diagrama-diseno {", "el CSS del diagrama de diseño"),
                         ("const GLOSARIOS", "el motor del glosario"),
                         ("const ARBOLES_ERROR", "el motor del árbol del error"),
                         ("const DIAGRAMAS_DISENO", "el motor del diagrama de diseño"),
                         ("iniciarDiagramasDiseno();", "la llamada al diagrama en loadModule")]:
        if marca not in html:
            sys.exit(f"ABORTA: la plantilla no trae {quien}. Ejecuta antes "
                     f"ensamblado/retropropaga_diagrama_diseno.py")

    # ---------------------------------------------------------------- módulos
    modulos = "".join((RAIZ / "ensamblado" / "modulos" / "cap5" / f).read_text(encoding="utf-8")
                      for f in ["modulos_1_3.html", "modulos_4_6.html",
                                "modulos_7_9.html", "modulos_10_11.html"])
    antes, despues = corta(
        html,
        "  <!-- ============================================================ -->\n  <!-- MÓDULO 1 · Cajas y tipografía",
        "\n  <script>\n    // ================================================================\n    // Configuración del capítulo",
        "los templates de los módulos")
    html = antes + modulos + despues

    # ---------------------------------------------------------------- courseData + datos
    datos = json.loads((RAIZ / "precalculo" / "salidas" / "cap5_datos.json").read_text(encoding="utf-8"))
    course = """    const courseData = {
      title: "Muestreo por conglomerados",
      modules: [
        { id: 1, title: "¿Por qué conglomerar?", shortTitle: "Por qué", duration: "20 min" },
        { id: 2, title: "La notación de dos niveles", shortTitle: "Notación", duration: "20 min" },
        { id: 3, title: "Una etapa, igual tamaño", shortTitle: "Una etapa", duration: "22 min" },
        { id: 4, title: "La correlación intraclase", shortTitle: "ICC", duration: "22 min" },
        { id: 5, title: "Tamaños desiguales", shortTitle: "Tamaños desiguales", duration: "22 min" },
        { id: 6, title: "Muestreo en dos etapas", shortTitle: "Dos etapas", duration: "25 min" },
        { id: 7, title: "La varianza, etapa por etapa", shortTitle: "Varianza por etapa", duration: "18 min" },
        { id: 8, title: "Cuántos y de qué tamaño", shortTitle: "n y m", duration: "18 min" },
        { id: 9, title: "Estratos × conglomerados", shortTitle: "Combinados", duration: "18 min" },
        { id: 10, title: "Datos agrupados en ciencia de datos", shortTitle: "Ciencia de datos", duration: "20 min" },
        { id: 11, title: "Autoevaluación y ejercicios guiados", shortTitle: "Autoevaluación", duration: "35 min" }
      ]
    };

    // ================================================================
    // Datos del capítulo, generados por precalculo/genera_cap5.R con
    // semilla %d. Ninguna cifra se escribió a mano: si hay que cambiar
    // algo se vuelve a correr el script y se pega la salida.
    // ================================================================
    const DATOS_CAP5 = %s;
""" % (datos["meta"]["semilla"], json.dumps(datos, ensure_ascii=False, separators=(",", ":")))

    antes, despues = corta(
        html,
        "    const courseData = {",
        "    // ================================================================\n    // Estado y elementos del DOM",
        "courseData")
    html = antes + course + "\n" + despues

    # ---------------------------------------------------------------- simuladores + quiz
    sims = (RAIZ / "ensamblado" / "modulos" / "cap5" / "simuladores.js").read_text(encoding="utf-8")
    antes, despues = corta(
        html,
        "    // ================================================================\n    // Simuladores de demostración",
        "  </script>\n\n</body>",
        "los simuladores de demostración")
    html = antes + sims + "\n" + despues

    # ---------------------------------------------------------------- código
    codigo = {}
    codigo.update(bloques_de(RAIZ / "ensamblado" / "codigo" / "cap5" / "cadena.R"))
    codigo.update(bloques_de(RAIZ / "ensamblado" / "codigo" / "cap5" / "cadena.py"))
    faltan = []
    for marca in re.findall(r'⟦([A-Za-z0-9]+)⟧', html):
        if marca not in codigo:
            faltan.append(marca)
    if faltan:
        sys.exit(f"ABORTA: no tengo código para los marcadores {sorted(set(faltan))}")
    usados = set()

    def sustituye(m):
        usados.add(m.group(1))
        return html_mod.escape(codigo[m.group(1)], quote=False)

    html = re.sub(r'⟦([A-Za-z0-9]+)⟧', sustituye, html)

    sin_usar = sorted(set(codigo) - usados)
    if sin_usar:
        print(f"  aviso: bloques ejecutados que no se insertaron: {sin_usar}")

    DESTINO.write_text(html, encoding="utf-8")
    DESTINO.chmod(0o644)
    # Solo las registraciones reales: `SIMULADORES['id']` aparece también dentro
    # de un comentario de documentación, y contarlo inflaría el total.
    n_sim = len(re.findall(r"\n    SIMULADORES\['", html))
    n_cod = len(re.findall(r'class="language-', html))
    n_preg = len(re.findall(r'\n        tipo: ', html))
    print("  escrito {}: {:,} caracteres, {} módulos, {} simuladores, {} bloques de código, "
          "{} preguntas".format(DESTINO.name, len(html), html.count("<template id="),
                                n_sim, n_cod, n_preg))


if __name__ == "__main__":
    main()
