#!/usr/bin/env python3
"""Ensambla Htmls_Muestreo/capitulo-2-diseno-mas-sistematico.html desde la
plantilla, los módulos escritos aparte y las cadenas de código ya ejecutadas.

El código de los bloques NO se escribe a mano en el HTML: se toma de
cadena.R y cadena.py, que son los archivos que se ejecutaron de verdad. Así
lo que lee el estudiante es, byte a byte, lo que se probó.
"""
import html as html_mod
import json
import re
import sys
from pathlib import Path

# Se ejecuta desde la raíz del repositorio (la carpeta Muestreo/).
RAIZ = Path(__file__).resolve().parent.parent
PLANTILLA = RAIZ / "plantilla" / "plantilla-capitulo-muestreo.html"
DESTINO = RAIZ / "Htmls_Muestreo" / "capitulo-2-diseno-mas-sistematico.html"


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
         'content="Capítulo 2 del material de Muestreo Estadístico (Universidad El Bosque): '
         'el diseño muestral p(s), probabilidades de inclusión, el estimador de Horvitz-Thompson, '
         'muestreo aleatorio simple, Bernoulli y sistemático, con simuladores y código en R y Python."'),
        ('<meta name="keywords" content="muestreo estadístico, muestreo probabilístico, '
         'Horvitz-Thompson, probabilidades de inclusión, estratificado, conglomerados, PPT, survey, '
         'R, Python, UnBosque">',
         '<meta name="keywords" content="diseño muestral, probabilidades de inclusión, '
         'Horvitz-Thompson, Sen-Yates-Grundy, muestreo aleatorio simple, muestreo sistemático, '
         'diseño Bernoulli, corrección por población finita, tamaño de muestra, survey, R, Python, '
         'Lohr, Gutiérrez, UnBosque">'),
        ('<title>Plantilla de capítulo — Muestreo Estadístico</title>',
         '<title>Capítulo 2 · Diseño muestral, MAS y sistemático — Muestreo Estadístico</title>'),
        ('<p class="text-xs text-white/70 font-medium tracking-wide" style="margin:0; text-align:left;">PLANTILLA BASE •\n'
         '              4 MÓDULOS DE DEMOSTRACIÓN • UNBOSQUE</p>',
         '<p class="text-xs text-white/70 font-medium tracking-wide" style="margin:0; text-align:left;">CAPÍTULO 2 •\n'
         '              DISEÑO MUESTRAL, MAS Y SISTEMÁTICO • SEMANAS 3–4 • UNBOSQUE</p>'),
        ('<p class="text-xs mt-1 text-white/60" style="text-align:center;">Plantilla de capítulo • UnBosque 2026\n        </p>',
         '<p class="text-xs mt-1 text-white/60" style="text-align:center;">Muestreo Estadístico • Capítulo 2 • UnBosque 2026-II\n        </p>'),
        ('<i class="fas fa-layer-group text-xl text-white" aria-hidden="true"></i>',
         '<i class="fas fa-dice text-xl text-white" aria-hidden="true"></i>'),
    ]
    for viejo, nuevo in reemplazos:
        if viejo not in html:
            sys.exit(f"ABORTA: no encuentro en la plantilla el texto:\n{viejo[:110]}...")
        html = html.replace(viejo, nuevo, 1)

    # ------------------------------------------------- CSS y motor del glosario
    # Desde la retropropagación de T1.6 los trae ya la plantilla. Se insertan
    # solo si faltan, para que el ensamblador siga sirviendo si algún día se
    # parte de una plantilla más vieja.
    if ".glosario-notacion {" not in html:
        css = (RAIZ / "ensamblado" / "componentes" / "glosario.css").read_text(encoding="utf-8")
        html = html.replace("  </style>\n</head>", css + "  </style>\n</head>", 1)
        print("  (el CSS del glosario venía de fuera de la plantilla)")

    # ---------------------------------------------------------------- módulos
    modulos = "".join((RAIZ / "ensamblado" / "modulos" / "cap2" / f).read_text(encoding="utf-8")
                      for f in ["modulos_1_4.html", "modulos_5_8.html",
                                "modulos_9_10.html", "modulo_11.html"])
    antes, despues = corta(
        html,
        "  <!-- ============================================================ -->\n  <!-- MÓDULO 1 · Cajas y tipografía",
        "\n  <script>\n    // ================================================================\n    // Configuración del capítulo",
        "los templates de los módulos")
    html = antes + modulos + despues

    # ---------------------------------------------------------------- courseData + datos
    datos = json.loads((RAIZ / "precalculo" / "salidas" / "cap2_datos.json").read_text(encoding="utf-8"))
    course = """    const courseData = {
      title: "Diseño muestral, MAS y sistemático",
      modules: [
        { id: 1, title: "El diseño muestral p(s)", shortTitle: "Diseño p(s)", duration: "15 min" },
        { id: 2, title: "Probabilidades de inclusión", shortTitle: "π_k y π_kl", duration: "15 min" },
        { id: 3, title: "El estimador de Horvitz–Thompson", shortTitle: "Horvitz–Thompson", duration: "20 min" },
        { id: 4, title: "Insesgadez de diseño y representatividad", shortTitle: "Insesgadez", duration: "12 min" },
        { id: 5, title: "El MAS como caso particular", shortTitle: "MAS", duration: "25 min" },
        { id: 6, title: "Intervalos de confianza", shortTitle: "Intervalos", duration: "18 min" },
        { id: 7, title: "Determinación del tamaño de muestra", shortTitle: "Tamaño de muestra", duration: "15 min" },
        { id: 8, title: "Diseño Bernoulli y muestreo con reemplazo", shortTitle: "Bernoulli", duration: "15 min" },
        { id: 9, title: "Muestreo sistemático", shortTitle: "Sistemático", duration: "20 min" },
        { id: 10, title: "Teoría de aleatorización", shortTitle: "Aleatorización", duration: "15 min" },
        { id: 11, title: "Autoevaluación y ejercicios guiados", shortTitle: "Autoevaluación", duration: "30 min" }
      ]
    };

    // ================================================================
    // Datos del capítulo, generados por precalculo/genera_cap2.R con
    // semilla %d. Ninguna cifra se escribió a mano: si hay que cambiar
    // algo se vuelve a correr el script y se pega la salida.
    // ================================================================
    const DATOS_CAP2 = %s;
""" % (datos["meta"]["semilla"], json.dumps(datos, ensure_ascii=False, separators=(",", ":")))

    antes, despues = corta(
        html,
        "    const courseData = {",
        "    // ================================================================\n    // Estado y elementos del DOM",
        "courseData")
    html = antes + course + "\n" + despues

    if "const GLOSARIOS" not in html:
        glosario_js = (RAIZ / "ensamblado" / "componentes" / "glosario.js").read_text(encoding="utf-8")
        ancla = "    // ================================================================\n    // Autoevaluación (v2)"
        if ancla not in html:
            sys.exit("ABORTA: no encuentro dónde insertar el motor del glosario")
        html = html.replace(ancla, glosario_js + ancla, 1)
        print("  (el motor del glosario venía de fuera de la plantilla)")
    if "iniciarGlosarios();" not in html:
        html = html.replace("        iniciarTablasRanking();\n",
                            "        iniciarTablasRanking();\n        iniciarGlosarios();\n", 1)

    # ---------------------------------------------------------------- simuladores + quiz
    sims = (RAIZ / "ensamblado" / "modulos" / "cap2" / "simuladores.js").read_text(encoding="utf-8")
    antes, despues = corta(
        html,
        "    // ================================================================\n    // Simuladores de demostración",
        "  </script>\n\n</body>",
        "los simuladores de demostración")
    html = antes + sims + "\n" + despues

    # ---------------------------------------------------------------- código
    codigo = {}
    codigo.update(bloques_de(RAIZ / "ensamblado" / "codigo" / "cap2" / "cadena.R"))
    codigo.update(bloques_de(RAIZ / "ensamblado" / "codigo" / "cap2" / "cadena.py"))
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
    n_sim = len(re.findall(r"SIMULADORES\['", html))
    n_cod = len(re.findall(r'class="language-', html))
    print("  escrito {}: {:,} caracteres, {} módulos, {} simuladores, {} bloques de código".format(
        DESTINO.name, len(html), html.count("<template id="), n_sim, n_cod))


if __name__ == "__main__":
    main()
