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


# ============================================================================
# El preparcial del Corte II (módulo 14)
#
# Vive dentro de este capítulo por decisión de Javier (2026-10-07), así que
# este ensamblador gana cuatro cosas que los demás capítulos no tienen: el
# banco del preparcial y sus datos, el componente de diagnóstico, la tabla de
# especificaciones y los marcadores de cifras del módulo 14.
# ============================================================================
PREP2_DATOS = RAIZ / "precalculo" / "salidas" / "preparcial2_datos.json"
PREP2_TABLA = RAIZ / "precalculo" / "tabla_especificaciones_corte2.json"
PREP2_BANCO = RAIZ / "ensamblado" / "modulos" / "cap4" / "preparcial2.js"
COMPONENTES = RAIZ / "ensamblado" / "componentes"
CAPITULOS_HREF = {3: "capitulo-3-razon-y-regresion.html", 4: "capitulo-4-muestreo-estratificado.html"}


def inserta_antes(html, ancla, nuevo, que):
    """`nuevo` justo antes de un ancla que tiene que ser única."""
    if html.count(ancla) != 1:
        sys.exit(f"ABORTA: el ancla de {que} aparece {html.count(ancla)} veces, esperaba 1")
    return html.replace(ancla, nuevo + ancla, 1)


def inserta_despues(html, ancla, nuevo, que):
    if html.count(ancla) != 1:
        sys.exit(f"ABORTA: el ancla de {que} aparece {html.count(ancla)} veces, esperaba 1")
    return html.replace(ancla, ancla + nuevo, 1)


def cifra_es(x, d):
    """La cifra como la escribe el capítulo (y escribeCifra() del motor):
    coma decimal, espacio de miles desde cuatro cifras y «−»."""
    s = f"{abs(x):,.{d}f}"
    entero, _, frac = s.partition(".")
    signo = "−" if x < 0 and float(f"{abs(x):.{d}f}") != 0 else ""
    return signo + entero.replace(",", " ") + ("," + frac if frac else "")


def cifra_mat(x, d):
    """La misma cifra dentro de una fórmula de KaTeX: {,} y \\,."""
    s = f"{abs(x):,.{d}f}"
    entero, _, frac = s.partition(".")
    signo = "-" if x < 0 and float(f"{abs(x):.{d}f}") != 0 else ""
    return signo + entero.replace(",", "\\,") + ("{,}" + frac if frac else "")


def dato(D, ruta):
    v = D
    for parte in ruta.split("."):
        if isinstance(v, list):
            if not parte.isdigit() or int(parte) >= len(v):
                sys.exit(f"ABORTA: la ruta {ruta!r} no existe en preparcial2_datos.json")
            v = v[int(parte)]
        elif isinstance(v, dict) and parte in v:
            v = v[parte]
        else:
            sys.exit(f"ABORTA: la ruta {ruta!r} no existe en preparcial2_datos.json")
    return v


MARCA_DATO_RE = re.compile(r"⟦([cmpe]):([^:⟧]+)(?::(\d+))?⟧")


def rellena_datos(html, D):
    """Sustituye ⟦c:ruta:d⟧, ⟦m:ruta:d⟧, ⟦p:ruta:d⟧ y ⟦e:ruta⟧ por la cifra del
    JSON. Así el módulo 14 no lleva una sola cifra tecleada."""
    def sustituye(m):
        clase, ruta, dec = m.group(1), m.group(2), m.group(3)
        v = dato(D, ruta)
        if clase == "e":
            if isinstance(v, float) and v.is_integer():
                v = int(v)
            return str(v)
        if dec is None:
            sys.exit(f"ABORTA: el marcador {m.group(0)} necesita sus decimales")
        d = int(dec)
        if clase == "c":
            return cifra_es(float(v), d)
        if clase == "m":
            return cifra_mat(float(v), d)
        return cifra_es(100 * float(v), d) + " %"
    html = MARCA_DATO_RE.sub(sustituye, html)
    if re.search(r"⟦[cmpe]:", html):
        sys.exit("ABORTA: quedó un marcador de dato mal formado en el módulo 14")
    return html


def tabla_corte2():
    """La tabla de especificaciones del Parcial 2, desde su JSON. Se publica."""
    d = json.loads(PREP2_TABLA.read_text(encoding="utf-8"))
    total = sum(o["peso"] for o in d["objetivos"])
    if total != 100:
        sys.exit(f"ABORTA: los pesos de la tabla del Corte II suman {total}, no 100")
    cuenta = {o["id"]: 0 for o in d["objetivos"]}
    for it in d["items_nuevos"]:
        cuenta[it["objetivo"]] += 1

    def enlace(m):
        cap, mod = (int(x) for x in m.split("."))
        if cap == 4:
            return f'<a href="#" onclick="loadModule({mod}); return false;">{m}</a>'
        return f'<a href="{CAPITULOS_HREF[cap]}" target="_blank" rel="noopener">{m}</a>'
    filas = "\n".join(
        f'          <tr>\n'
        f'            <td><strong>{o["id"]}</strong></td>\n'
        f'            <td>{o["titulo"]}</td>\n'
        f'            <td>{", ".join(enlace(m) for m in o["modulos"])}</td>\n'
        f'            <td style="text-align:right;"><strong>{o["peso"]} %</strong></td>\n'
        f'            <td style="text-align:right;">{cuenta[o["id"]]}</td>\n'
        f'          </tr>' for o in d["objetivos"])
    return (
        '<table>\n'
        '        <caption class="sr-only">Los seis objetivos del Corte II con los módulos donde están '
        'enseñados, su peso en el Parcial 2 y las preguntas de este módulo</caption>\n'
        '        <thead>\n          <tr>\n'
        '            <th scope="col">#</th>\n            <th scope="col">Objetivo</th>\n'
        '            <th scope="col">Módulos</th>\n'
        '            <th scope="col" style="text-align:right;">Peso</th>\n'
        '            <th scope="col" style="text-align:right;">Preguntas</th>\n'
        '          </tr>\n        </thead>\n        <tbody>\n' + filas + '\n'
        '        </tbody>\n      </table>')


def ficha_poblacion(D):
    """La población en una sola tabla: subregiones, estratos de tamaño y tenencia.

    Una tabla y no tres en columnas: en tres columnas, a 800 px de ancho, «muy
    grande (8 ha o más)» se partía en cuatro líneas (visto en el navegador).
    """
    p, e, ten = D["poblacion"], D["estratos"], D["tenencia"]
    cortes = e["cortes"]
    rango = [f"menos de {cifra_es(cortes[0], 0)} ha",
             f"de {cifra_es(cortes[0], 0)} a menos de {cifra_es(cortes[1], 0)} ha",
             f"de {cifra_es(cortes[1], 0)} a menos de {cifra_es(cortes[2], 0)} ha",
             f"{cifra_es(cortes[2], 0)} ha o más"]
    grupos = [
        ("Subregión", "registro", list(p["Nsub"].items())),
        ("Tamaño por área en café", "registro",
         [(f"{h} ({rango[i]})", e["Nh"][i]) for i, h in enumerate(e["nombres"])]),
        ("Tenencia", "censo agropecuario, no el registro",
         [(h, ten["Nh"][i]) for i, h in enumerate(ten["nombres"])]),
    ]
    filas = []
    for titulo, fuente, items in grupos:
        for k, (g, n) in enumerate(items):
            cab = (f'<td rowspan="{len(items)}" style="vertical-align:top;"><strong>{titulo}</strong>'
                   f'<br><span class="text-xs text-gray-500">{fuente}</span></td>') if k == 0 else ""
            filas.append(f'<tr>{cab}<td>{g}</td><td style="text-align:right;">{cifra_es(n, 0)}</td></tr>')
    return ('<table style="font-size:0.9rem;">\n'
            '        <caption class="sr-only">Las fincas del preparcial por subregión, por tamaño y por tenencia</caption>\n'
            '        <thead><tr><th scope="col">Clasificación</th><th scope="col">Grupo</th>'
            '<th scope="col" style="text-align:right;">Fincas</th></tr></thead>\n'
            '        <tbody>' + "".join(filas) + '</tbody>\n      </table>')


def objetivos_corte2():
    d = json.loads(PREP2_TABLA.read_text(encoding="utf-8"))
    objetivos = [{"id": o["id"], "titulo": o["titulo"], "peso": o["peso"], "modulos": o["modulos"]}
                 for o in d["objetivos"]]
    return (
        "\n    // ================================================================\n"
        "    // El preparcial del Corte II (módulo 14): sus datos, generados por\n"
        "    // precalculo/genera_preparcial2.R, y los objetivos del diagnóstico,\n"
        "    // desde precalculo/tabla_especificaciones_corte2.json.\n"
        "    // ================================================================\n"
        "    const DATOS_PREPARCIAL2 = %s;\n\n"
        "    const OBJETIVOS_DIAGNOSTICO = %s;\n\n"
        "    const CAPITULOS_HREF = %s;\n\n"
        "    const CAPITULO_ACTUAL = 4;\n"
        % (json.dumps(json.loads(PREP2_DATOS.read_text(encoding="utf-8")), ensure_ascii=False,
                      separators=(",", ":")),
           json.dumps(objetivos, ensure_ascii=False, separators=(",", ":")),
           json.dumps({str(k): v for k, v in CAPITULOS_HREF.items()}, ensure_ascii=False)))


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
         'machine learning, con simuladores, código en R y Python y el preparcial del Corte II."'),
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
                                "modulos_7_9.html", "modulos_10_12.html",
                                "modulo_13.html", "modulo_14_preparcial.html"])
    datos_prep2 = json.loads(PREP2_DATOS.read_text(encoding="utf-8"))
    modulos = modulos.replace("      ⟦TABLA_CORTE2⟧", "      " + tabla_corte2())
    modulos = modulos.replace("      ⟦FICHA_POBLACION⟧", "      " + ficha_poblacion(datos_prep2))
    for marcador in ("⟦TABLA_CORTE2⟧", "⟦FICHA_POBLACION⟧"):
        if marcador in modulos:
            sys.exit(f"ABORTA: el marcador {marcador} quedó sin sustituir")
    modulos = rellena_datos(modulos, datos_prep2)
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
        { id: 3, title: "Pesos y estimación", shortTitle: "Pesos", duration: "27 min" },
        { id: 4, title: "Asignación de observaciones", shortTitle: "Asignación", duration: "35 min" },
        { id: 5, title: "Asignación óptima con costos", shortTitle: "Costos", duration: "28 min" },
        { id: 6, title: "Definición de estratos", shortTitle: "Definir estratos", duration: "26 min" },
        { id: 7, title: "Un modelo para el estratificado", shortTitle: "Modelo", duration: "22 min" },
        { id: 8, title: "El efecto de diseño", shortTitle: "deff", duration: "15 min" },
        { id: 9, title: "Estratificado con probabilidades proporcionales", shortTitle: "PPT por estrato", duration: "22 min" },
        { id: 10, title: "Postestratificación", shortTitle: "Postestratificación", duration: "20 min" },
        { id: 11, title: "Estratificación en machine learning", shortTitle: "Machine learning", duration: "18 min" },
        { id: 12, title: "Razón en el estratificado", shortTitle: "Razón estratificada", duration: "24 min" },
        { id: 13, title: "Autoevaluación y ejercicios guiados", shortTitle: "Autoevaluación", duration: "50 min" },
        { id: 14, title: "Preparcial del Corte II", shortTitle: "Preparcial", duration: "120 min" }
      ]
    };

    // ================================================================
    // Datos del capítulo, generados por precalculo/genera_cap4.R con
    // semilla %d. Ninguna cifra se escribió a mano: si hay que cambiar
    // algo se vuelve a correr el script y se pega la salida.
    // ================================================================
    const DATOS_CAP4 = %s;
""" % (datos["meta"]["semilla"], json.dumps(datos, ensure_ascii=False, separators=(",", ":"))) + objetivos_corte2()

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
    banco_prep2 = PREP2_BANCO.read_text(encoding="utf-8")
    html = antes + sims + "\n" + banco_prep2 + "\n" + despues

    # ---------------------------------------------------------------- diagnóstico
    # El componente del preparcial del Corte I, el mismo archivo. El orden de
    # las dos llamadas importa: vigilarQuizzes registra lo que haya en pantalla
    # ANTES de que iniciarDiagnosticos pinte.
    html = inserta_antes(html, "  </style>\n</head>",
                         (COMPONENTES / "diagnostico.css").read_text(encoding="utf-8"),
                         "el CSS del diagnóstico")
    html = inserta_antes(html,
                         "    // ================================================================\n"
                         "    // Autoevaluación (v2)",
                         (COMPONENTES / "diagnostico.js").read_text(encoding="utf-8"),
                         "el motor del diagnóstico")
    html = inserta_despues(html, "        iniciarAutoevaluaciones();\n",
                           "        vigilarQuizzes();\n        iniciarDiagnosticos();\n",
                           "las llamadas del diagnóstico en loadModule")

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
