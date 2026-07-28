#!/usr/bin/env python3
"""Ensambla sitio/muestreo/capitulo-8-no-respuesta-ponderacion.html desde la
plantilla, los módulos escritos aparte y las cadenas de código ya ejecutadas.

Mismo mecanismo que ensambla_cap7.py. Este capítulo cierra el curso: cubre las
semanas 15 y 16 y estrena el componente .rubrica (módulo 8), que
retropropaga_rubrica.py debe haber puesto antes en la plantilla.

Aviso heredado de la fase 4: al clonar un ensamblador con `sed`, el DESTINO se
queda con el nombre del capítulo anterior si ese nombre no contiene la cadena
sustituida. Comprobar SIEMPRE el nombre que imprime el script al terminar.
"""
import html as html_mod
import json
import re
import sys
from pathlib import Path

# Se ejecuta desde la raíz del repositorio (la carpeta Muestreo/).
RAIZ = Path(__file__).resolve().parent.parent
PLANTILLA = RAIZ / "plantilla" / "plantilla-capitulo-muestreo.html"
DESTINO = RAIZ / "sitio" / "muestreo" / "capitulo-8-no-respuesta-ponderacion.html"


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
         'content="Capítulo 8 del material de Muestreo Estadístico (Universidad El Bosque): '
         'no respuesta de unidad y de ítem, mecanismos MCAR/MAR/MNAR, la fórmula del sesgo de no '
         'respuesta, ajuste de pesos por clases, calibración y raking, imputación simple y '
         'múltiple con las reglas de Rubin, diagnóstico con R-indicators, taller de diseño y '
         'verificación de salidas de IA, con simuladores y código en R y Python."'),
        ('<meta name="keywords" content="muestreo estadístico, muestreo probabilístico, '
         'Horvitz-Thompson, probabilidades de inclusión, estratificado, conglomerados, PPT, survey, '
         'R, Python, UnBosque">',
         '<meta name="keywords" content="no respuesta, nonresponse, sesgo de no respuesta, MCAR, '
         'MAR, MNAR, ajuste de pesos, clases de respuesta, post-estratificacion, raking, '
         'calibracion, imputacion, hot-deck, imputacion multiple, reglas de Rubin, R-indicator, '
         'AAPOR, Literary Digest, survey, mitools, R, Python, Lohr, Gutiérrez, UnBosque">'),
        ('<title>Plantilla de capítulo — Muestreo Estadístico</title>',
         '<title>Capítulo 8 · No respuesta y ponderación — Muestreo Estadístico</title>'),
        ('<p class="text-xs text-white/70 font-medium tracking-wide" style="margin:0; text-align:left;">PLANTILLA BASE •\n'
         '              4 MÓDULOS DE DEMOSTRACIÓN • UNBOSQUE</p>',
         '<p class="text-xs text-white/70 font-medium tracking-wide" style="margin:0; text-align:left;">CAPÍTULO 8 •\n'
         '              NO RESPUESTA Y PONDERACIÓN • SEMANAS 15–16 • UNBOSQUE</p>'),
        ('<p class="text-xs mt-1 text-white/60" style="text-align:center;">Plantilla de capítulo • UnBosque 2026\n        </p>',
         '<p class="text-xs mt-1 text-white/60" style="text-align:center;">Muestreo Estadístico • Capítulo 8 • UnBosque 2026-II\n        </p>'),
        ('<i class="fas fa-layer-group text-xl text-white" aria-hidden="true"></i>',
         '<i class="fas fa-user-slash text-xl text-white" aria-hidden="true"></i>'),
    ]
    for viejo, nuevo in reemplazos:
        if viejo not in html:
            sys.exit(f"ABORTA: no encuentro en la plantilla el texto:\n{viejo[:110]}...")
        html = html.replace(viejo, nuevo, 1)

    # Componentes que este capítulo necesita de la plantilla.
    for marca, quien in [(".glosario-notacion {", "el CSS del glosario"),
                         (".arbol-error {", "el CSS del árbol del error"),
                         (".diagrama-diseno {", "el CSS del diagrama de diseño"),
                         (".rubrica {", "el CSS de la rúbrica, que estrena el módulo 8"),
                         ("const GLOSARIOS", "el motor del glosario"),
                         ("const ARBOLES_ERROR", "el motor del árbol del error"),
                         ("const DIAGRAMAS_DISENO", "el motor del diagrama de diseño"),
                         ("const RUBRICAS", "el motor de la rúbrica"),
                         ("iniciarRubricas();", "la llamada a la rúbrica en loadModule"),
                         (".ciclo-etapas {", "el CSS del ciclo, que usa el módulo 8"),
                         ("iniciarCiclos();", "la llamada al ciclo en loadModule")]:
        if marca not in html:
            sys.exit(f"ABORTA: la plantilla no trae {quien}. Ejecuta antes "
                     f"ensamblado/retropropaga_rubrica.py")

    # ---------------------------------------------------------------- módulos
    modulos = "".join((RAIZ / "ensamblado" / "modulos" / "cap8" / f).read_text(encoding="utf-8")
                      for f in ["modulos_1_4.html", "modulos_5_8.html",
                                "modulos_9_11.html"])
    antes, despues = corta(
        html,
        "  <!-- ============================================================ -->\n  <!-- MÓDULO 1 · Cajas y tipografía",
        "\n  <script>\n    // ================================================================\n    // Configuración del capítulo",
        "los templates de los módulos")
    html = antes + modulos + despues

    # ---------------------------------------------------------------- courseData + datos
    datos = json.loads((RAIZ / "precalculo" / "salidas" / "cap8_datos.json").read_text(encoding="utf-8"))
    course = """    const courseData = {
      title: "No respuesta y ponderación",
      modules: [
        { id: 1, title: "Quien no contesta también cuenta", shortTitle: "Los mecanismos", duration: "25 min" },
        { id: 2, title: "La fórmula del sesgo de no respuesta", shortTitle: "La fórmula", duration: "28 min" },
        { id: 3, title: "Ajuste de pesos por clases de respuesta", shortTitle: "Clases", duration: "25 min" },
        { id: 4, title: "Calibrar contra el mundo exterior", shortTitle: "Calibración", duration: "25 min" },
        { id: 5, title: "Rellenar la casilla: métodos de imputación", shortTitle: "Imputación", duration: "22 min" },
        { id: 6, title: "La varianza que la imputación se come", shortTitle: "Varianza", duration: "28 min" },
        { id: 7, title: "Más allá de la tasa de respuesta", shortTitle: "Diagnóstico", duration: "20 min" },
        { id: 8, title: "Taller de diseño: el proyecto integrador", shortTitle: "Taller", duration: "30 min" },
        { id: 9, title: "IA asistida en diseño muestral", shortTitle: "IA verificada", duration: "25 min" },
        { id: 10, title: "El curso entero, en un árbol", shortTitle: "Repaso", duration: "20 min" },
        { id: 11, title: "Autoevaluación y ejercicios guiados", shortTitle: "Autoevaluación", duration: "35 min" }
      ]
    };
    // ================================================================
    // Datos del capítulo, generados por precalculo/genera_cap8.R con
    // semilla %d. Ninguna cifra se escribió a mano: si hay que cambiar
    // algo se vuelve a correr el script y se pega la salida.
    // ================================================================
    const DATOS_CAP8 = %s;
""" % (datos["meta"]["semilla"], json.dumps(datos, ensure_ascii=False, separators=(",", ":")))

    antes, despues = corta(
        html,
        "    const courseData = {",
        "    // ================================================================\n    // Estado y elementos del DOM",
        "courseData")
    html = antes + course + "\n" + despues

    # ---------------------------------------------------------------- simuladores + quiz
    sims = (RAIZ / "ensamblado" / "modulos" / "cap8" / "simuladores.js").read_text(encoding="utf-8")
    antes, despues = corta(
        html,
        "    // ================================================================\n    // Simuladores de demostración",
        "  </script>\n\n</body>",
        "los simuladores de demostración")
    html = antes + sims + "\n" + despues

    # ---------------------------------------------------------------- código
    codigo = {}
    codigo.update(bloques_de(RAIZ / "ensamblado" / "codigo" / "cap8" / "cadena.R"))
    codigo.update(bloques_de(RAIZ / "ensamblado" / "codigo" / "cap8" / "cadena.py"))
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
