#!/usr/bin/env python3
"""Ensambla sitio/muestreo/capitulo-3-razon-y-regresion.html desde la plantilla,
los módulos escritos aparte y las cadenas de código ya ejecutadas.

Mismo mecanismo que ensambla_cap2.py: sustitución de regiones delimitadas sobre
la plantilla, nunca concatenación de fragmentos sueltos. El código de los
bloques NO se escribe a mano en el HTML: se toma de cadena.R y cadena.py, que
son los archivos que se ejecutaron de verdad, así que lo que lee el estudiante
es byte a byte lo que se probó.
"""
import html as html_mod
import json
import re
import sys
from pathlib import Path

# Se ejecuta desde la raíz del repositorio (la carpeta Muestreo/).
RAIZ = Path(__file__).resolve().parent.parent
PLANTILLA = RAIZ / "plantilla" / "plantilla-capitulo-muestreo.html"
DESTINO = RAIZ / "sitio" / "muestreo" / "capitulo-3-razon-y-regresion.html"


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


# Lo único que puede traer el registro del simulacro (módulo 15). Es una lista blanca: un campo nuevo
# del generador, se llame como se llame («correctas», «solucion», «orden»…), para el ensamblado en
# vez de publicarse. La lista negra de pistas de main() queda para el texto.
CAMPOS_SIMULACRO = {"opcion": {"opciones"}, "multiple": {"opciones"}, "numero": set(),
                    "emparejar": {"filas", "elecciones"}}
OPCIONALES_SIMULACRO = {"numero": {"casillas"}}


def revisa_registro_simulacro(registro):
    """Los fallos del registro SIMULACROS['cap3-simulacro']: 70 minutos, las preguntas 1 a 18 en orden,
    y en cada una solo los campos de su tipo, con listas de textos no vacías."""
    m = re.search(r"SIMULACROS\['cap3-simulacro'\] = (\{.*\});\n", registro, re.S)
    if not m:
        return ["no encuentro el registro SIMULACROS['cap3-simulacro'] entre los marcadores"]
    try:
        sim = json.loads(m.group(1))
    except ValueError as e:
        return [f"el registro del simulacro no es JSON: {e}"]
    fallos = []
    if set(sim) != {"minutos", "variante", "preguntas"}:
        fallos.append(f"el registro del simulacro trae los campos {sorted(sim)}")
    if sim.get("minutos") != 70:
        fallos.append(f"el simulacro dura {sim.get('minutos')} minutos, no 70")
    preguntas = sim.get("preguntas") or []
    if [p.get("n") for p in preguntas] != list(range(1, 19)):
        fallos.append("las preguntas del simulacro no van de la 1 a la 18, en orden")
    for p in preguntas:
        tipo = p.get("tipo")
        if tipo not in CAMPOS_SIMULACRO:
            fallos.append(f"simulacro, pregunta {p.get('n')}: tipo desconocido {tipo!r}")
            continue
        base = {"n", "etiqueta", "tipo", "enunciado"}
        obligatorios = base | CAMPOS_SIMULACRO[tipo]
        permitidos = obligatorios | OPCIONALES_SIMULACRO.get(tipo, set())
        if set(p) - permitidos or obligatorios - set(p):
            fallos.append(f"simulacro, pregunta {p['n']}: sobran {sorted(set(p) - permitidos)} y faltan "
                          f"{sorted(obligatorios - set(p))}")
        for k in (CAMPOS_SIMULACRO[tipo] | OPCIONALES_SIMULACRO.get(tipo, set())) & set(p):
            v = p[k]
            if not (isinstance(v, list) and v and all(isinstance(t, str) and t for t in v)):
                fallos.append(f"simulacro, pregunta {p['n']}: «{k}» no es una lista de textos")
            elif k == "opciones" and len(v) > 8:
                fallos.append(f"simulacro, pregunta {p['n']}: {len(v)} opciones, y el widget tiene 8 letras")
    return fallos


def main():
    html = PLANTILLA.read_text(encoding="utf-8")

    # ---------------------------------------------------------------- cabecera
    reemplazos = [
        ('content="Plantilla base para los capítulos del material de Muestreo Estadístico '
         '(Universidad El Bosque): cajas, código R/Python en pestañas, simuladores con Chart.js, '
         'autoevaluación y ejercicios guiados."',
         'content="Capítulo 3 del material de Muestreo Estadístico (Universidad El Bosque): '
         'estimación de razón, de regresión y de diferencia, dominios, el estimador general de '
         'regresión (GREG) y la estimación de la mediana, con simuladores y código en R y Python."'),
        ('<meta name="keywords" content="muestreo estadístico, muestreo probabilístico, '
         'Horvitz-Thompson, probabilidades de inclusión, estratificado, conglomerados, PPT, survey, '
         'R, Python, UnBosque">',
         '<meta name="keywords" content="estimación de razón, estimación de regresión, estimador '
         'de diferencia, GREG, calibración, dominios, linealización de Taylor, mediana, '
         'svyratio, calibrate, svyquantile, variable auxiliar, R, Python, Lohr, Gutiérrez, '
         'UnBosque">'),
        ('<title>Plantilla de capítulo — Muestreo Estadístico</title>',
         '<title>Capítulo 3 · Estimación de razón y regresión — Muestreo Estadístico</title>'),
        ('<p class="text-xs text-white/70 font-medium tracking-wide" style="margin:0; text-align:left;">PLANTILLA BASE •\n'
         '              4 MÓDULOS DE DEMOSTRACIÓN • UNBOSQUE</p>',
         '<p class="text-xs text-white/70 font-medium tracking-wide" style="margin:0; text-align:left;">CAPÍTULO 3 •\n'
         '              ESTIMACIÓN DE RAZÓN Y REGRESIÓN • SEMANAS 5–6 • UNBOSQUE</p>'),
        ('<p class="text-xs mt-1 text-white/60" style="text-align:center;">Plantilla de capítulo • UnBosque 2026\n        </p>',
         '<p class="text-xs mt-1 text-white/60" style="text-align:center;">Muestreo Estadístico • Capítulo 3 • UnBosque 2026-II\n        </p>'),
        ('<i class="fas fa-layer-group text-xl text-white" aria-hidden="true"></i>',
         '<i class="fas fa-chart-line text-xl text-white" aria-hidden="true"></i>'),
    ]
    for viejo, nuevo in reemplazos:
        if viejo not in html:
            sys.exit(f"ABORTA: no encuentro en la plantilla el texto:\n{viejo[:110]}...")
        html = html.replace(viejo, nuevo, 1)

    # El capítulo 1 necesita el glosario y el árbol del error, que la plantilla
    # ya trae desde la fase 1 y la retropropagación de T2.0. Si faltaran, es que
    # se está partiendo de una plantilla vieja y hay que enterarse aquí.
    for marca, quien in [(".glosario-notacion {", "el CSS del glosario"),
                         (".arbol-error {", "el CSS del árbol del error"),
                         ("const GLOSARIOS", "el motor del glosario"),
                         ("const ARBOLES_ERROR", "el motor del árbol del error"),
                         ("iniciarArbolesError();", "la llamada al árbol en loadModule")]:
        if marca not in html:
            sys.exit(f"ABORTA: la plantilla no trae {quien}. Ejecuta antes "
                     f"ensamblado/retropropaga_arbol_error.py")

    # ---------------------------------------------------------------- módulos
    modulos = "".join((RAIZ / "ensamblado" / "modulos" / "cap3" / f).read_text(encoding="utf-8")
                      for f in ["modulos_1_4.html", "modulos_5_7.html",
                                "modulo_8_tomates.html", "modulo_9_dominios.html",
                                "modulos_10_12.html", "modulo_13_formulario.html",
                                "modulo_14_autoevaluacion.html", "modulo_15_simulacro.html"])
    antes, despues = corta(
        html,
        "  <!-- ============================================================ -->\n  <!-- MÓDULO 1 · Cajas y tipografía",
        "\n  <script>\n    // ================================================================\n    // Configuración del capítulo",
        "los templates de los módulos")
    html = antes + modulos + despues

    # ---------------------------------------------------------------- courseData + datos
    datos = json.loads((RAIZ / "precalculo" / "salidas" / "cap3_datos.json").read_text(encoding="utf-8"))
    course = """    const courseData = {
      title: "Estimación de razón y regresión",
      modules: [
        { id: 1, title: "Variables auxiliares", shortTitle: "Auxiliares", duration: "18 min" },
        { id: 2, title: "El estimador de razón", shortTitle: "Razón", duration: "25 min" },
        { id: 3, title: "¿Cuándo gana la razón?", shortTitle: "Cuándo gana", duration: "28 min" },
        { id: 4, title: "Sesgo y error cuadrático medio", shortTitle: "Sesgo y ECM", duration: "28 min" },
        { id: 5, title: "Razones y proporciones", shortTitle: "Proporciones", duration: "15 min" },
        { id: 6, title: "Estimación de regresión", shortTitle: "Regresión", duration: "24 min" },
        { id: 7, title: "Estimación de diferencia", shortTitle: "Diferencia", duration: "29 min" },
        { id: 8, title: "Un estimador distinto en cada grupo", shortTitle: "Por grupos", duration: "26 min" },
        { id: 9, title: "Estimación en dominios", shortTitle: "Dominios", duration: "27 min" },
        { id: 10, title: "Modelos poblacionales", shortTitle: "Modelos", duration: "18 min" },
        { id: 11, title: "El estimador general de regresión (GREG)", shortTitle: "GREG", duration: "25 min" },
        { id: 12, title: "Parámetros no lineales: la mediana", shortTitle: "Mediana", duration: "20 min" },
        { id: 13, title: "Formulario", shortTitle: "Formulario", duration: "10 min" },
        { id: 14, title: "Autoevaluación y ejercicios guiados", shortTitle: "Autoevaluación", duration: "50 min" },
        { id: 15, title: "Simulacro del quiz", shortTitle: "Simulacro", duration: "70 min" }
      ]
    };

    // ================================================================
    // Datos del capítulo, generados por precalculo/genera_cap3.R con
    // semilla %d. Ninguna cifra se escribió a mano: si hay que cambiar
    // algo se vuelve a correr el script y se pega la salida.
    // ================================================================
    const DATOS_CAP3 = %s;
""" % (datos["meta"]["semilla"], json.dumps(datos, ensure_ascii=False, separators=(",", ":")))

    antes, despues = corta(
        html,
        "    const courseData = {",
        "    // ================================================================\n    // Estado y elementos del DOM",
        "courseData")
    html = antes + course + "\n" + despues

    # ---------------------------------------------------------------- CSS del simulacro
    # El componente .simulacro (módulo 15) es de este capítulo y de nadie más, así que no vive en la
    # plantilla: se añade aquí, al final del <style>. Si la plantilla ya lo trajera, habría dos copias
    # que divergen en silencio.
    if "Componente .simulacro —" in html:
        sys.exit("ABORTA: la plantilla ya trae el CSS de .simulacro; quítalo de uno de los dos sitios")
    css_simulacro = (RAIZ / "ensamblado" / "modulos" / "cap3" / "simulacro.css").read_text(encoding="utf-8")
    if html.count("\n  </style>\n</head>") != 1:
        sys.exit("ABORTA: no encuentro el cierre del <style> de la cabecera")
    html = html.replace("\n  </style>\n</head>", "\n" + css_simulacro.rstrip("\n") + "\n  </style>\n</head>")

    # ---------------------------------------------------------------- simuladores + quiz
    # simulacro.js va detrás de simuladores.js: se engancha al registro SIMULADORES, y su registro
    # SIMULACROS['cap3-simulacro'] lo escribe, entre dos marcadores, un script que vive fuera del
    # repositorio, porque ahí vive la clave.
    sims = (RAIZ / "ensamblado" / "modulos" / "cap3" / "simuladores.js").read_text(encoding="utf-8")
    sims += "\n" + (RAIZ / "ensamblado" / "modulos" / "cap3" / "simulacro.js").read_text(encoding="utf-8")
    antes, despues = corta(
        html,
        "    // ================================================================\n    // Simuladores de demostración",
        "  </script>\n\n</body>",
        "los simuladores de demostración")
    html = antes + sims + "\n" + despues

    # ---------------------------------------------------------------- código
    codigo = {}
    codigo.update(bloques_de(RAIZ / "ensamblado" / "codigo" / "cap3" / "cadena.R"))
    codigo.update(bloques_de(RAIZ / "ensamblado" / "codigo" / "cap3" / "cadena.py"))
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

    # ---------------------------------------------------------------- el simulacro, sin clave
    # Cada pieza exactamente una vez: dos copias del registro o del componente dejan de coincidir sin
    # que nadie lo note.
    fallos = []
    for pieza in ['<div class="simulacro" data-simulador="cap3-simulacro">',
                  "SIMULACROS['cap3-simulacro']", "const SIMULACROS = {};",
                  "function pintarSimulacro(", "Componente .simulacro —", "    .simulacro-opcion {",
                  "    // [inicio · simulacro del quiz]", "    // [fin · simulacro del quiz]",
                  '<div class="simulacro-preguntas"></div>', 'class="simulacro-empezar"',
                  'class="simulacro-reloj"', 'class="simulacro-conteo"', 'class="simulacro-borrar"',
                  'class="simulacro-resumen"', '<template id="module-15">']:
        if html.count(pieza) != 1:
            fallos.append(f"simulacro del quiz: '{pieza}' aparece {html.count(pieza)} veces, no 1")
    # Y lo que NO puede llevar: la clave. El registro publica enunciados y opciones, y nada más.
    if not fallos:
        registro = html[html.index("    // [inicio · simulacro del quiz]"):
                        html.index("    // [fin · simulacro del quiz]")]
        for pista in ('"correcta"', '"retro"', '"clave"', '"por_que"', "correcta:", "retro:",
                      "Correcto.", "La respuesta es", "Errores frecuentes"):
            if pista in registro:
                fallos.append(f"el simulacro publica «{pista}»: eso es la clave")
        fallos += revisa_registro_simulacro(registro)
    if fallos:
        sys.exit("ABORTA:\n  " + "\n  ".join(fallos))

    DESTINO.write_text(html, encoding="utf-8")
    # Solo las registraciones reales: `SIMULADORES['id']` aparece también dentro
    # de un comentario de documentación, y contarlo inflaría el total.
    # El simulacro del módulo 15 se registra ahí para que loadModule() lo arranque, pero no es un
    # simulador: no entra en la cuenta (la misma regla que precalculo/cuenta_sitio.py).
    n_sim = len(re.findall(r"\n    SIMULADORES\['(?![\w-]*-simulacro')", html))
    n_cod = len(re.findall(r'class="language-', html))
    n_preg = len(re.findall(r'\n        tipo: ', html))
    print("  escrito {}: {:,} caracteres, {} módulos, {} simuladores, {} bloques de código, "
          "{} preguntas".format(DESTINO.name, len(html), html.count("<template id="),
                                n_sim, n_cod, n_preg))


if __name__ == "__main__":
    main()
