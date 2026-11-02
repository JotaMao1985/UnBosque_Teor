#!/usr/bin/env python3
"""Ensambla sitio/muestreo/capitulo-7-encuestas-complejas.html desde la
plantilla, los módulos escritos aparte y las cadenas de código ya ejecutadas.

Mismo mecanismo que ensambla_cap6.py. Este capítulo es NUEVO: cubre la
semana 14, que el material viejo no tocaba. Es el primero que usa el
componente .ciclo (módulo 9), heredado de Series de Tiempo.
"""
import html as html_mod
import json
import re
import sys
from pathlib import Path

# Se ejecuta desde la raíz del repositorio (la carpeta Muestreo/).
RAIZ = Path(__file__).resolve().parent.parent
PLANTILLA = RAIZ / "plantilla" / "plantilla-capitulo-muestreo.html"
DESTINO = RAIZ / "sitio" / "muestreo" / "capitulo-7-encuestas-complejas.html"


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
         'content="Capítulo 7 del material de Muestreo Estadístico (Universidad El Bosque): '
         'encuestas complejas, pesos muestrales, efecto de diseño, linealización de Taylor, '
         'métodos de replicación (jackknife, BRR, bootstrap), calibración y raking, y el costo de '
         'ignorar el diseño, con simuladores y código en R y Python."'),
        ('<meta name="keywords" content="muestreo estadístico, muestreo probabilístico, '
         'Horvitz-Thompson, probabilidades de inclusión, estratificado, conglomerados, PPT, survey, '
         'R, Python, UnBosque">',
         '<meta name="keywords" content="encuestas complejas, pesos muestrales, efecto de diseno, '
         'deff, tamano efectivo, linealizacion de Taylor, jackknife, BRR, bootstrap, replicacion, '
         'calibracion, raking, IPFP, post-estratificacion, NHANES, SYC, survey, R, Python, Lohr, '
         'Gutiérrez, UnBosque">'),
        ('<title>Plantilla de capítulo — Muestreo Estadístico</title>',
         '<title>Capítulo 7 · Encuestas complejas — Muestreo Estadístico</title>'),
        ('<p class="text-xs text-white/70 font-medium tracking-wide" style="margin:0; text-align:left;">PLANTILLA BASE •\n'
         '              4 MÓDULOS DE DEMOSTRACIÓN • UNBOSQUE</p>',
         '<p class="text-xs text-white/70 font-medium tracking-wide" style="margin:0; text-align:left;">CAPÍTULO 7 •\n'
         '              ENCUESTAS COMPLEJAS • SEMANA 14 • UNBOSQUE</p>'),
        ('<p class="text-xs mt-1 text-white/60" style="text-align:center;">Plantilla de capítulo • UnBosque 2026\n        </p>',
         '<p class="text-xs mt-1 text-white/60" style="text-align:center;">Muestreo Estadístico • Capítulo 7 • UnBosque 2026-II\n        </p>'),
        ('<i class="fas fa-layer-group text-xl text-white" aria-hidden="true"></i>',
         '<i class="fas fa-clipboard-list text-xl text-white" aria-hidden="true"></i>'),
        # Defectos de la plantilla común que la auditoría del cap. 7 vio aquí
        # (T7.115), corregidos solo en este capítulo, como hizo el cap. 6:
        # - S11: Tailwind (CDN) inyecta su preflight después de este <style> y,
        #   con la misma especificidad, gana: `p { margin: 0 }` pega los
        #   párrafos seguidos, las listas pierden número y viñeta, y los h3
        #   quedan como texto normal. Las mismas reglas que ensambla_cap6.py; las
        #   de las cajas y las listas, con especificidad (0,0,2), que gana al
        #   preflight y pierde ante cualquier clase de la plantilla.
        # - S14: la plantilla despliega el código dentro de `.ejercicio-panel`,
        #   pero las soluciones de este capítulo son <details>, y el bloque
        #   salía plegado a 150 px dentro de la solución que el estudiante
        #   acababa de abrir. Bajo 480 px, además, tres cajas anidadas dejaban
        #   el código en una columna de 195 px.
        # - S13: a 375 px las tablas se desplazan en horizontal sin ninguna
        #   pista; se avisa encima.
        ('  </style>',
         '    .animate-fade-in > p {\n'
         '      margin-bottom: 1rem;\n'
         '    }\n\n'
         '    body :where(.definition, .note, .warning, .formula, .ejercicio-guiado, .ejercicio-solucion) p {\n'
         '      margin-bottom: 0.75rem;\n'
         '    }\n\n'
         '    body :where(.animate-fade-in) ul,\n'
         '    body :where(.animate-fade-in) ol {\n'
         '      margin-left: 1.5rem;\n'
         '      margin-bottom: 1.5rem;\n'
         '    }\n\n'
         '    body :where(.animate-fade-in) ul {\n'
         '      list-style-type: disc;\n'
         '    }\n\n'
         '    body :where(.animate-fade-in) ol {\n'
         '      list-style-type: decimal;\n'
         '    }\n\n'
         '    .animate-fade-in > h3 {\n'
         '      display: block;\n'
         '      font-size: 1.25rem;\n'
         '      font-weight: 700;\n'
         '      margin-top: 2rem;\n'
         '      margin-bottom: 1rem;\n'
         '    }\n\n'
         '    .animate-fade-in > h3::before {\n'
         '      vertical-align: -0.3rem;\n'
         '      margin-right: 0.5rem;\n'
         '    }\n\n'
         '    .ejercicio-solucion pre.collapsed {\n'
         '      max-height: none;\n'
         '      overflow-y: visible;\n'
         '    }\n\n'
         '    .ejercicio-solucion pre.collapsed::after,\n'
         '    .ejercicio-solucion .code-toggle-btn {\n'
         '      display: none;\n'
         '    }\n\n'
         '    @media (max-width: 480px) {\n'
         '      .exercise {\n'
         '        padding: 0.75rem;\n'
         '      }\n\n'
         '      .ejercicio-guiado,\n'
         '      details.ejercicio-pista,\n'
         '      details.ejercicio-solucion {\n'
         '        padding-left: 0.5rem;\n'
         '        padding-right: 0.5rem;\n'
         '      }\n'
         '    }\n\n'
         '    @media (max-width: 640px) {\n'
         '      .tabla-ranking-marco::before,\n'
         '      .glosario-marco::before {\n'
         "        content: 'Desliza la tabla hacia la izquierda para ver el resto →';\n"
         '        display: block;\n'
         '        padding: 0.35rem 0.6rem;\n'
         '        font-size: 0.75rem;\n'
         '        color: #475569;\n'
         '        background: #f8fafc;\n'
         '        position: sticky;\n'
         '        left: 0;\n'
         '      }\n'
         '    }\n'
         '  </style>'),
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
                         ("iniciarDiagramasDiseno();", "la llamada al diagrama en loadModule"),
                         (".ciclo-etapas {", "el CSS del ciclo, que estrena el módulo 9"),
                         ("iniciarCiclos();", "la llamada al ciclo en loadModule")]:
        if marca not in html:
            sys.exit(f"ABORTA: la plantilla no trae {quien}. Ejecuta antes "
                     f"ensamblado/retropropaga_diagrama_diseno.py")

    # ---------------------------------------------------------------- módulos
    modulos = "".join((RAIZ / "ensamblado" / "modulos" / "cap7" / f).read_text(encoding="utf-8")
                      for f in ["modulos_1_3.html", "modulos_4_6.html",
                                "modulos_7_10.html"])
    antes, despues = corta(
        html,
        "  <!-- ============================================================ -->\n  <!-- MÓDULO 1 · Cajas y tipografía",
        "\n  <script>\n    // ================================================================\n    // Configuración del capítulo",
        "los templates de los módulos")
    html = antes + modulos + despues

    # ---------------------------------------------------------------- courseData + datos
    datos = json.loads((RAIZ / "precalculo" / "salidas" / "cap7_datos.json").read_text(encoding="utf-8"))
    course = """    const courseData = {
      title: "Encuestas complejas",
      modules: [
        { id: 1, title: "Anatomía de una encuesta compleja", shortTitle: "Anatomía", duration: "22 min" },
        { id: 2, title: "Los pesos muestrales", shortTitle: "Pesos", duration: "20 min" },
        { id: 3, title: "DEFF y tamaño efectivo", shortTitle: "DEFF", duration: "25 min" },
        { id: 4, title: "Linealización de Taylor", shortTitle: "Linealización", duration: "25 min" },
        { id: 5, title: "Métodos de replicación", shortTitle: "Replicación", duration: "28 min" },
        { id: 6, title: "Calibración y raking", shortTitle: "Calibración", duration: "25 min" },
        { id: 7, title: "Dos encuestas reales, analizadas", shortTitle: "Dos encuestas", duration: "20 min" },
        { id: 8, title: "El error más caro", shortTitle: "El error caro", duration: "22 min" },
        { id: 9, title: "El ciclo de diseño de una encuesta", shortTitle: "El ciclo", duration: "20 min" },
        { id: 10, title: "Autoevaluación y ejercicios guiados", shortTitle: "Autoevaluación", duration: "35 min" }
      ]
    };
    // ================================================================
    // Datos del capítulo, generados por precalculo/genera_cap7.R con
    // semilla %d. Ninguna cifra se escribió a mano: si hay que cambiar
    // algo se vuelve a correr el script y se pega la salida.
    // ================================================================
    const DATOS_CAP7 = %s;
""" % (datos["meta"]["semilla"], json.dumps(datos, ensure_ascii=False, separators=(",", ":")))

    antes, despues = corta(
        html,
        "    const courseData = {",
        "    // ================================================================\n    // Estado y elementos del DOM",
        "courseData")
    html = antes + course + "\n" + despues

    # ---------------------------------------------------------------- simuladores + quiz
    sims = (RAIZ / "ensamblado" / "modulos" / "cap7" / "simuladores.js").read_text(encoding="utf-8")
    antes, despues = corta(
        html,
        "    // ================================================================\n    // Simuladores de demostración",
        "  </script>\n\n</body>",
        "los simuladores de demostración")
    html = antes + sims + "\n" + despues

    # ---------------------------------------------------------------- código
    codigo = {}
    codigo.update(bloques_de(RAIZ / "ensamblado" / "codigo" / "cap7" / "cadena.R"))
    codigo.update(bloques_de(RAIZ / "ensamblado" / "codigo" / "cap7" / "cadena.py"))
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
