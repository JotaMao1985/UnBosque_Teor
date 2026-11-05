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


# Lo único que puede traer el registro del simulacro (módulo 12). Es una lista blanca: un campo nuevo del
# generador, se llame como se llame («auditoria», «rol», «semillas»…), para el ensamblado en vez de
# publicarse. Este simulacro SÍ lleva su clave (se corrige al entregar, D4 de quiz_cap5/PLAN_Quiz_Cap5.md):
# lo que no puede viajar es lo privado del generador.
CAMPOS_SIMULACRO = {"numero": {"clave", "cuenta", "rutas"}, "opcion": {"opciones", "correcta"}}
MINUTOS_SIMULACRO, PREGUNTAS_SIMULACRO = 50, 12


def revisa_registro_simulacro(registro):
    """Los fallos del registro SIMULACROS['cap5-simulacro']: 50 minutos, una versión, las preguntas 1 a 12
    en orden, y en cada una solo los campos de su tipo."""
    m = re.search(r"SIMULACROS\['cap5-simulacro'\] = (\{.*\});\n", registro, re.S)
    if not m:
        return ["no encuentro el registro SIMULACROS['cap5-simulacro'] entre los marcadores"]
    try:
        sim = json.loads(m.group(1))
    except ValueError as e:
        return [f"el registro del simulacro no es JSON: {e}"]
    fallos = []
    if set(sim) != {"minutos", "titulo", "etapas", "versiones"}:
        fallos.append(f"el registro del simulacro trae los campos {sorted(sim)}")
    if sim.get("minutos") != MINUTOS_SIMULACRO:
        fallos.append(f"el simulacro dura {sim.get('minutos')} minutos, no {MINUTOS_SIMULACRO}")
    versiones = sim.get("versiones") or []
    if len(versiones) != 1 or set(versiones[0]) != {"numero", "caso", "preguntas"}:
        fallos.append("el simulacro no trae exactamente una versión con numero, caso y preguntas")
        return fallos
    preguntas = versiones[0]["preguntas"]
    if [p.get("n") for p in preguntas] != list(range(1, PREGUNTAS_SIMULACRO + 1)):
        fallos.append(f"las preguntas del simulacro no van de la 1 a la {PREGUNTAS_SIMULACRO}, en orden")
    for p in preguntas:
        tipo = p.get("tipo")
        if tipo not in CAMPOS_SIMULACRO:
            fallos.append(f"simulacro, pregunta {p.get('n')}: tipo desconocido {tipo!r}")
            continue
        esperados = {"n", "etapa", "etiqueta", "tipo", "enunciado"} | CAMPOS_SIMULACRO[tipo]
        if set(p) != esperados:
            fallos.append(f"simulacro, pregunta {p['n']}: sobran {sorted(set(p) - esperados)} y faltan "
                          f"{sorted(esperados - set(p))}")
            continue
        # Con los tipos: «"correcta": true» y «"valor": "51"» pasaban y se publicaban (CO-9 de la ronda 1).
        es_cifra = lambda x: type(x) in (int, float) and x == x and abs(x) != float("inf")
        if p["etapa"] not in sim.get("etapas", {}):
            fallos.append(f"simulacro, pregunta {p['n']}: la etapa {p['etapa']!r} no está en «etapas»")
        if tipo == "numero":
            if set(p["clave"]) != {"valor", "tol", "texto"} or any(set(r) != {"valor", "cifra", "texto"}
                                                                   for r in p["rutas"]):
                fallos.append(f"simulacro, pregunta {p['n']}: la clave o las rutas traen otros campos")
            elif not (es_cifra(p["clave"]["valor"]) and es_cifra(p["clave"]["tol"]) and p["clave"]["tol"] > 0
                      and all(es_cifra(r["valor"]) for r in p["rutas"])):
                fallos.append(f"simulacro, pregunta {p['n']}: una clave, una tolerancia o una ruta no es una cifra")
        else:
            ops = p["opciones"]
            if not (2 <= len(ops) <= 8) or any(set(o) != {"texto", "retro"} for o in ops):
                fallos.append(f"simulacro, pregunta {p['n']}: las opciones traen otros campos")
            if not (type(p["correcta"]) is int and 0 <= p["correcta"] < len(ops)):
                fallos.append(f"simulacro, pregunta {p['n']}: «correcta» no es un índice de sus opciones")
    return fallos


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
                                "modulos_7_9.html", "modulos_10_11.html", "modulo_12_simulacro.html"])
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
        { id: 11, title: "Autoevaluación y ejercicios guiados", shortTitle: "Autoevaluación", duration: "35 min" },
        { id: 12, title: "Simulacro del quiz", shortTitle: "Simulacro", duration: "50 min" }
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

    # ---------------------------------------------------------------- CSS del simulacro
    # El componente .simulacro (módulo 12) es de este capítulo y del 3, cada uno con el suyo, así que no
    # vive en la plantilla: se añade aquí, al final del <style>. Si la plantilla ya lo trajera, habría dos
    # copias que divergen en silencio.
    if "Componente .simulacro —" in html:
        sys.exit("ABORTA: la plantilla ya trae el CSS de .simulacro; quítalo de uno de los dos sitios")
    css_simulacro = (RAIZ / "ensamblado" / "modulos" / "cap5" / "simulacro.css").read_text(encoding="utf-8")
    if html.count("\n  </style>\n</head>") != 1:
        sys.exit("ABORTA: no encuentro el cierre del <style> de la cabecera")
    html = html.replace("\n  </style>\n</head>", "\n" + css_simulacro.rstrip("\n") + "\n  </style>\n</head>")

    # ---------------------------------------------------------------- simuladores + quiz
    # simulacro.js va detrás de simuladores.js: se engancha al registro SIMULADORES, y su registro
    # SIMULACROS['cap5-simulacro'] lo escribe, entre dos marcadores, quiz_cap5/codigo/exporta_simulacro.py,
    # que vive fuera del repositorio con las tres versiones del quiz.
    sims = (RAIZ / "ensamblado" / "modulos" / "cap5" / "simuladores.js").read_text(encoding="utf-8")
    sims += "\n" + (RAIZ / "ensamblado" / "modulos" / "cap5" / "simulacro.js").read_text(encoding="utf-8")
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

    # ---------------------------------------------------------------- el simulacro
    # Cada pieza exactamente una vez: dos copias del registro o del componente dejan de coincidir sin que
    # nadie lo note.
    fallos = []
    for pieza in ['<div class="simulacro" data-simulador="cap5-simulacro">',
                  "SIMULACROS['cap5-simulacro'] = ", "const SIMULACROS = {};",
                  "function pintarSimulacro(", "Componente .simulacro —", "    .simulacro-opcion {",
                  "    // [inicio · simulacro del quiz]", "    // [fin · simulacro del quiz]",
                  '<div class="simulacro-preguntas"></div>', '<div class="simulacro-caso"></div>',
                  'class="simulacro-empezar"', 'class="simulacro-reloj"', 'class="simulacro-conteo"',
                  'class="simulacro-entregar"', 'class="simulacro-borrar"', 'class="simulacro-resumen"',
                  'class="simulacro-nota"', 'class="simulacro-entregar-final"', 'class="simulacro-reloj-final"',
                  '<template id="module-12">']:
        if html.count(pieza) != 1:
            fallos.append(f"simulacro del quiz: '{pieza}' aparece {html.count(pieza)} veces, no 1")
    # Y lo que NO puede llevar: lo privado del generador, que vive con las tres versiones del quiz.
    if not fallos:
        registro = html[html.index("    // [inicio · simulacro del quiz]"):
                        html.index("    // [fin · simulacro del quiz]")]
        for pista in ('"auditoria"', '"rol"', '"semillas"', "version_1", "</script", "quiz_cap5/salidas"):
            if pista in registro:
                fallos.append(f"el simulacro publica «{pista}»: eso es del generador, no de la página")
        fallos += revisa_registro_simulacro(registro)
    if fallos:
        sys.exit("ABORTA:\n  " + "\n  ".join(fallos))

    DESTINO.write_text(html, encoding="utf-8")
    DESTINO.chmod(0o644)
    # Solo las registraciones reales: `SIMULADORES['id']` aparece también dentro
    # de un comentario de documentación, y contarlo inflaría el total. El
    # simulacro del módulo 12 se registra ahí para que loadModule() lo arranque,
    # pero no es un simulador: no entra en la cuenta (la misma regla que
    # precalculo/cuenta_sitio.py).
    n_sim = len(re.findall(r"\n    SIMULADORES\['(?![\w-]*-simulacro')", html))
    n_cod = len(re.findall(r'class="language-', html))
    n_preg = len(re.findall(r'\n        tipo: ', html))
    print("  escrito {}: {:,} caracteres, {} módulos, {} simuladores, {} bloques de código, "
          "{} preguntas".format(DESTINO.name, len(html), html.count("<template id="),
                                n_sim, n_cod, n_preg))


if __name__ == "__main__":
    main()
