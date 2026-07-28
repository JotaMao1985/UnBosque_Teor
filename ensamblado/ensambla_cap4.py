#!/usr/bin/env python3
"""Ensambla sitio/muestreo/capitulo-4-muestreo-estratificado.html desde la
plantilla, los módulos escritos aparte y las cadenas de código ya ejecutadas.

Mismo mecanismo que ensambla_cap1.py: sustitución de regiones delimitadas sobre
la plantilla, nunca concatenación de fragmentos sueltos. El código de los
bloques NO se escribe a mano en el HTML: se toma de cadena.R y cadena.py, que
son los archivos que se ejecutaron de verdad, así que lo que lee el estudiante
es byte a byte lo que se probó.

Este ensamblador SUSTITUYE al capítulo 4 del formato antiguo: el archivo de
destino existía desde marzo y aquí se reescribe entero desde la plantilla.
"""
import html as html_mod
import json
import re
import sys
from pathlib import Path

# Se ejecuta desde la raíz del repositorio (la carpeta Muestreo/).
RAIZ = Path(__file__).resolve().parent.parent
PLANTILLA = RAIZ / "plantilla" / "plantilla-capitulo-muestreo.html"
DESTINO = RAIZ / "sitio" / "muestreo" / "capitulo-4-muestreo-estratificado.html"


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
         'content="Capítulo 4 del material de Muestreo Estadístico (Universidad El Bosque): '
         'muestreo estratificado en el marco π, asignación proporcional, de Neyman y con costos, '
         'definición de estratos, estratificado PPT, postestratificación y estratificación en '
         'machine learning, con simuladores y código en R y Python."'),
        ('<meta name="keywords" content="muestreo estadístico, muestreo probabilístico, '
         'Horvitz-Thompson, probabilidades de inclusión, estratificado, conglomerados, PPT, survey, '
         'R, Python, UnBosque">',
         '<meta name="keywords" content="muestreo estratificado, asignación de Neyman, asignación '
         'proporcional, asignación óptima con costos, efecto de diseño, deff, postestratificación, '
         'calibración, StratifiedKFold, Hansen-Hurwitz, STPPS, BigLucy, survey, R, Python, Lohr, '
         'Gutiérrez, UnBosque">'),
        ('<title>Plantilla de capítulo — Muestreo Estadístico</title>',
         '<title>Capítulo 4 · Muestreo estratificado — Muestreo Estadístico</title>'),
        ('<p class="text-xs text-white/70 font-medium tracking-wide" style="margin:0; text-align:left;">PLANTILLA BASE •\n'
         '              4 MÓDULOS DE DEMOSTRACIÓN • UNBOSQUE</p>',
         '<p class="text-xs text-white/70 font-medium tracking-wide" style="margin:0; text-align:left;">CAPÍTULO 4 •\n'
         '              MUESTREO ESTRATIFICADO • SEMANAS 7–9 • UNBOSQUE</p>'),
        ('<p class="text-xs mt-1 text-white/60" style="text-align:center;">Plantilla de capítulo • UnBosque 2026\n        </p>',
         '<p class="text-xs mt-1 text-white/60" style="text-align:center;">Muestreo Estadístico • Capítulo 4 • UnBosque 2026-II\n        </p>'),
    ]
    for viejo, nuevo in reemplazos:
        if viejo not in html:
            sys.exit(f"ABORTA: no encuentro en la plantilla el texto:\n{viejo[:110]}...")
        html = html.replace(viejo, nuevo, 1)
    # El icono de la cabecera no se toca: fa-layer-group ES el icono de los
    # estratos; la plantilla lo trae por herencia feliz.

    # El capítulo 4 necesita el glosario, el árbol del error (solo CSS+motor) y
    # el diagrama de diseño con su instancia. Si faltaran, la plantilla es
    # vieja y hay que enterarse aquí, no en el navegador.
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
    modulos = "".join((RAIZ / "ensamblado" / "modulos" / "cap4" / f).read_text(encoding="utf-8")
                      for f in ["modulos_1_3.html", "modulos_4_6.html",
                                "modulos_7_9.html", "modulos_10_12.html"])
    antes, despues = corta(
        html,
        "  <!-- ============================================================ -->\n  <!-- MÓDULO 1 · Cajas y tipografía",
        "\n  <script>\n    // ================================================================\n    // Configuración del capítulo",
        "los templates de los módulos")
    html = antes + modulos + despues

    # ---------------------------------------------------------------- courseData + datos
    datos = json.loads((RAIZ / "precalculo" / "salidas" / "cap4_datos.json").read_text(encoding="utf-8"))
    course = """    const courseData = {
      title: "Muestreo estratificado",
      modules: [
        { id: 1, title: "¿Por qué estratificar?", shortTitle: "Por qué", duration: "18 min" },
        { id: 2, title: "La teoría en el marco π", shortTitle: "Teoría", duration: "25 min" },
        { id: 3, title: "Pesos y estimación", shortTitle: "Pesos", duration: "22 min" },
        { id: 4, title: "Asignación de observaciones", shortTitle: "Asignación", duration: "25 min" },
        { id: 5, title: "Asignación óptima con costos", shortTitle: "Costos", duration: "18 min" },
        { id: 6, title: "Definición de estratos", shortTitle: "Definir estratos", duration: "18 min" },
        { id: 7, title: "Un modelo para el estratificado", shortTitle: "Modelo", duration: "20 min" },
        { id: 8, title: "El efecto de diseño", shortTitle: "deff", duration: "15 min" },
        { id: 9, title: "Estratificado con probabilidades proporcionales", shortTitle: "PPT por estrato", duration: "22 min" },
        { id: 10, title: "Postestratificación", shortTitle: "Postestratificación", duration: "20 min" },
        { id: 11, title: "Estratificación en machine learning", shortTitle: "Machine learning", duration: "18 min" },
        { id: 12, title: "Autoevaluación y ejercicios guiados", shortTitle: "Autoevaluación", duration: "35 min" }
      ]
    };

    // ================================================================
    // Datos del capítulo, generados por precalculo/genera_cap4.R con
    // semilla %d. Ninguna cifra se escribió a mano: si hay que cambiar
    // algo se vuelve a correr el script y se pega la salida.
    // ================================================================
    const DATOS_CAP4 = %s;
""" % (datos["meta"]["semilla"], json.dumps(datos, ensure_ascii=False, separators=(",", ":")))

    antes, despues = corta(
        html,
        "    const courseData = {",
        "    // ================================================================\n    // Estado y elementos del DOM",
        "courseData")
    html = antes + course + "\n" + despues

    # ---------------------------------------------------------------- simuladores + quiz
    sims = (RAIZ / "ensamblado" / "modulos" / "cap4" / "simuladores.js").read_text(encoding="utf-8")
    antes, despues = corta(
        html,
        "    // ================================================================\n    // Simuladores de demostración",
        "  </script>\n\n</body>",
        "los simuladores de demostración")
    html = antes + sims + "\n" + despues

    # ---------------------------------------------------------------- código
    codigo = {}
    codigo.update(bloques_de(RAIZ / "ensamblado" / "codigo" / "cap4" / "cadena.R"))
    codigo.update(bloques_de(RAIZ / "ensamblado" / "codigo" / "cap4" / "cadena.py"))
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
