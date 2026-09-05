#!/usr/bin/env python3
"""Ensambla sitio/muestreo/preparcial-corte-1.html: el instrumento de
autodiagnóstico del Corte I, con el que el estudiante comprueba —antes del
parcial y no después— en cuál de los seis objetivos está flojo.

Misma mecánica que los ocho `ensambla_capN.py`: se parte de la plantilla y se
sustituyen regiones delimitadas. Las cifras vienen de dos precálculos
ejecutados, `preparcial_datos.json` y `taller1_recurso_datos.json`, y el código
de los bloques de `codigo/taller1/cadena.{R,py}`.

ESTE ENSAMBLADOR SUCEDE A `ensambla_taller1.py`. Por decisión de Javier del
2026-08-30 (D1 del PLAN_Preparcial_Corte1.md), el recurso del Taller 1 no se
publica como página propia: se **absorbe** aquí. Sus cuatro módulos de semana,
los diez errores y el mapa de repaso entran VERBATIM desde
`ensamblado/modulos/taller1/`, sin reescribir una línea.

LO ÚNICO QUE NO PUEDE SER VERBATIM ES EL NÚMERO DEL MÓDULO. Los ficheros
absorbidos traen su `<template id="module-N">` fijo del sitio que ocupaban en el
recurso viejo, y aquí ocupan otro. Por eso la numeración **no vive en ningún
fichero**: sale del orden de la tabla MODULOS de abajo, y el ensamblador
renumera al extraer. Insertar un bloque nuevo en medio es mover una fila de esa
tabla, no reescribir seis cabeceras — que es exactamente el error que se comete
cuando la numeración está a mano.

PARA PUBLICAR (P3.1 del plan):

    1. quitar del .gitignore el bloque del preparcial
    2. python3 ensamblado/ensambla_preparcial.py --con-indice
    3. node --check sobre el resultado, y las pruebas del banco
    4. git add -A && git commit
    5. git subtree push --prefix sitio origin gh-pages   (solo con el visto bueno)
"""
import html as html_mod
import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
PLANTILLA = RAIZ / "plantilla" / "plantilla-capitulo-muestreo.html"
DESTINO = RAIZ / "sitio" / "muestreo" / "preparcial-corte-1.html"
INDICE = RAIZ / "sitio" / "muestreo" / "index.html"
MODULOS_DIR = RAIZ / "ensamblado" / "modulos"
CODIGO = RAIZ / "ensamblado" / "codigo" / "taller1"
COMPONENTES = RAIZ / "ensamblado" / "componentes"
BANCO_NUEVO = MODULOS_DIR / "preparcial" / "banco.js"
SALIDAS = RAIZ / "precalculo" / "salidas"
TABLA = RAIZ / "precalculo" / "tabla_especificaciones.json"

CAPITULOS = {
    1: "capitulo-1-encuestas-sesgos.html",
    2: "capitulo-2-diseno-mas-sistematico.html",
}
NOMBRE_TIPO = {
    "opcion": "Opción múltiple", "multiple": "Varias respuestas",
    "numerica": "Numérica", "texto": "Abierta", "grafico": "Gráfico",
}

# El orden de esta lista ES la numeración de los módulos. `fuente` es el fichero
# y `indice` el template que se toma de él (0 = el primero), porque
# `modulos_semanas.html` trae los cuatro juntos.
MODULOS = [
    dict(fuente="preparcial/modulo_como_usar.html", indice=0,
         banner="Cómo usar esto y la tabla de especificaciones",
         title="Cómo usar esto", short="Cómo usar", dur="8 min"),
    dict(fuente="preparcial/modulos_bloques.html", indice=0, bloque=1,
         banner="Bloque A · Conceptos",
         title="Bloque A · Conceptos", short="A · Conceptos", dur="15 min"),
    dict(fuente="preparcial/modulos_bloques.html", indice=1, bloque=2,
         banner="Bloque B · Procedimientos",
         title="Bloque B · Procedimientos", short="B · Procedimientos", dur="35 min"),
    dict(fuente="preparcial/modulos_bloques.html", indice=2, bloque=3,
         banner="Bloque C · Interpretación",
         title="Bloque C · Interpretación", short="C · Interpretación", dur="20 min"),
    dict(fuente="preparcial/modulos_bloques.html", indice=3, bloque=4,
         banner="Bloque D · Análisis gráfico",
         title="Bloque D · Análisis gráfico", short="D · Análisis gráfico", dur="25 min"),
    dict(fuente="preparcial/modulo_diagnostico.html", indice=0,
         banner="Tu diagnóstico",
         title="Tu diagnóstico", short="Tu diagnóstico", dur="5 min"),
    dict(fuente="taller1/modulos_semanas.html", indice=0, semana=1,
         banner="Simulacro · Semana 1 · Población, marco y unidades",
         title="Simulacro · Semana 1 · Población, marco y unidades", short="Semana 1", dur="15 min"),
    dict(fuente="taller1/modulos_semanas.html", indice=1, semana=2,
         banner="Simulacro · Semana 2 · Sesgos y error total",
         title="Simulacro · Semana 2 · Sesgos y error total", short="Semana 2", dur="25 min"),
    dict(fuente="taller1/modulos_semanas.html", indice=2, semana=3,
         banner="Simulacro · Semana 3 · Muestreo probabilístico, π_k y MAS",
         title="Simulacro · Semana 3 · Muestreo probabilístico, π_k y MAS", short="Semana 3", dur="30 min"),
    dict(fuente="taller1/modulos_semanas.html", indice=3, semana=4,
         banner="Simulacro · Semana 4 · Tamaño de muestra y sistemático",
         title="Simulacro · Semana 4 · Tamaño de muestra y sistemático", short="Semana 4", dur="25 min"),
    dict(fuente="taller1/modulo_diez_errores.html", indice=0,
         banner="Diez errores que el código no delata",
         title="Diez errores que el código no delata", short="Diez errores", dur="30 min"),
    dict(fuente="taller1/modulo_mapa.html", indice=0,
         banner="Mapa de repaso",
         title="Mapa de repaso", short="Mapa de repaso", dur="10 min"),
    dict(fuente="preparcial/modulo_que_llevar.html", indice=0,
         banner="Qué llevar al parcial",
         title="Qué llevar al parcial", short="Qué llevar", dur="10 min"),
]

ITEM_RE = re.compile(
    r"tipo: '(\w+)',\n\s*modulo: (\d+),\n\s*semana: (\d+),\n"
    r"\s*ancla: \{ cap: (\d+), modulo: (\d+), titulo: '([^']*)', lohr: '([^']*)' \}"
)
TEMPLATE_RE = re.compile(r'  <template id="[^"]+">.*?\n  </template>\n', re.S)


def aborta(msg):
    sys.exit(f"ABORTA: {msg}")


def inserta_antes(html, ancla, nuevo, que):
    """Mete `nuevo` justo antes del ancla, comprobando que el ancla es única.

    Misma mecánica que los `retropropaga_*.py`, y por el mismo motivo: un
    `replace` sobre un ancla que aparece dos veces coloca el componente en el
    sitio equivocado sin dar error.
    """
    if html.count(ancla) != 1:
        aborta(f"el ancla de {que} aparece {html.count(ancla)} veces, esperaba 1")
    return html.replace(ancla, nuevo + ancla, 1)


def inserta_despues(html, ancla, nuevo, que):
    if html.count(ancla) != 1:
        aborta(f"el ancla de {que} aparece {html.count(ancla)} veces, esperaba 1")
    return html.replace(ancla, ancla + nuevo, 1)


def corta(texto, inicio, fin, que):
    i = texto.find(inicio)
    if i < 0:
        aborta(f"no encuentro el ancla de inicio de {que}")
    j = texto.find(fin, i)
    if j < 0:
        aborta(f"no encuentro el ancla de fin de {que}")
    return texto[:i], texto[j:]


def bloques_de(ruta):
    """Parte una cadena ejecutable en sus bloques, por los marcadores.

    Copiado de `ensambla_taller1.py`, al que este guion sucede: el marcador vive
    dentro de una llamada `cat("\\n###BLOQUE-X###\\n")`, así que hay que recortar
    la cola de esa llamada al principio de cada cuerpo y la cabeza de la
    siguiente al final.
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
            aborta(f"el bloque {partes[i]} quedó vacío al recortarlo")
        if '###BLOQUE' in cuerpo or 'cat("\\n' in cuerpo or 'print("\\n' in cuerpo:
            aborta(f"el bloque {partes[i]} conserva restos del marcador")
        out[partes[i]] = cuerpo
    return out


def templates_de(ruta):
    """Los bloques <template>…</template> de un fichero, en orden."""
    texto = ruta.read_text(encoding="utf-8")
    bloques = TEMPLATE_RE.findall(texto)
    if not bloques:
        aborta(f"{ruta.name} no tiene ningún <template>")
    # Ni uno de más ni uno de menos: si el fichero trae marcado suelto fuera de
    # sus templates, se perdería en silencio al ensamblar.
    resto = TEMPLATE_RE.sub("", texto).strip()
    for linea in resto.splitlines():
        if linea.strip() and not linea.strip().startswith("<!--"):
            aborta(f"{ruta.name} tiene contenido fuera de sus <template>: {linea.strip()[:70]}")
    return bloques


def modulos_ensamblados():
    """Concatena los templates de MODULOS, renumerados por su posición."""
    cache, trozos = {}, []
    for n, m in enumerate(MODULOS, start=1):
        ruta = MODULOS_DIR / m["fuente"]
        if not ruta.exists():
            aborta(f"falta el fichero de módulo {m['fuente']}")
        if ruta not in cache:
            cache[ruta] = templates_de(ruta)
        bloques = cache[ruta]
        if m["indice"] >= len(bloques):
            aborta(f"{m['fuente']} tiene {len(bloques)} templates y se pide el {m['indice']}")
        bloque, cuantos = re.subn(r'<template id="[^"]+">',
                                  f'<template id="module-{n}">', bloques[m["indice"]], count=1)
        if cuantos != 1:
            aborta(f"no pude renumerar el módulo {n} ({m['fuente']})")
        raya = "=" * 60
        trozos.append(
            f"  <!-- {raya} -->\n"
            f"  <!-- MÓDULO {n} · {m['banner']}"
            f"{' ' * max(1, 52 - len(m['banner']))}-->\n"
            f"  <!-- {raya} -->\n" + bloque + "\n"
        )
    return "".join(trozos)


def tabla_especificaciones():
    """La tabla de §4 del plan, renderizada desde el JSON. Se publica (D9)."""
    d = json.loads(TABLA.read_text(encoding="utf-8"))
    filas = []
    for o in d["objetivos"]:
        mods = ", ".join(
            f'<a href="{CAPITULOS[int(m.split(".")[0])]}">{m}</a>' for m in o["modulos"])
        filas.append(
            f'          <tr>\n'
            f'            <td><strong>{o["id"]}</strong></td>\n'
            f'            <td>{o["titulo"]}</td>\n'
            f'            <td>{mods}</td>\n'
            f'            <td style="text-align:right;"><strong>{o["peso"]} %</strong></td>\n'
            f'          </tr>')
    total = sum(o["peso"] for o in d["objetivos"])
    if total != 100:
        aborta(f"los pesos de la tabla de especificaciones suman {total}, no 100")
    return (
        '      <table>\n'
        '        <caption class="sr-only">Los seis objetivos del Corte I con los módulos del '
        'material donde están enseñados y su peso en el Parcial 1</caption>\n'
        '        <thead>\n'
        '          <tr>\n'
        '            <th scope="col">#</th>\n'
        '            <th scope="col">Objetivo</th>\n'
        '            <th scope="col">Módulos donde está enseñado</th>\n'
        '            <th scope="col" style="text-align:right;">Peso</th>\n'
        '          </tr>\n'
        '        </thead>\n'
        '        <tbody>\n' + "\n".join(filas) + '\n'
        '        </tbody>\n'
        '      </table>')


def mapa_de_repaso(banco_js):
    """La tabla del mapa, construida desde el `ancla` de cada ítem del banco."""
    items = ITEM_RE.findall(banco_js)
    if len(items) != 30:
        aborta(f"el mapa de repaso encontró {len(items)} ítems, esperaba 30. Si el banco cambió "
               "de formato, arregla ITEM_RE antes de publicar: un mapa incompleto es peor que "
               "no tenerlo.")
    filas = []
    for n, (tipo, _mod, semana, cap, cap_mod, titulo, lohr) in enumerate(items, start=1):
        filas.append(
            f'          <tr>\n'
            f'            <td>{n}</td>\n'
            f'            <td>Semana {semana}</td>\n'
            f'            <td>{NOMBRE_TIPO[tipo]}</td>\n'
            f'            <td><a href="{CAPITULOS[int(cap)]}">Capítulo {cap}, módulo {cap_mod}</a> '
            f'· {titulo}</td>\n'
            f'            <td>Lohr {lohr}</td>\n'
            f'          </tr>')
    return (
        '      <table>\n'
        '        <caption class="sr-only">Cada ítem del simulacro con su módulo del material y su '
        'sección de Lohr</caption>\n'
        '        <thead>\n'
        '          <tr>\n'
        '            <th scope="col">#</th>\n'
        '            <th scope="col">Semana</th>\n'
        '            <th scope="col">Tipo</th>\n'
        '            <th scope="col">Dónde está enseñado</th>\n'
        '            <th scope="col">Lohr</th>\n'
        '          </tr>\n'
        '        </thead>\n'
        '        <tbody>\n' + "\n".join(filas) + '\n'
        '        </tbody>\n'
        '      </table>')


def remapea_modulo_del_banco(banco):
    """Reescribe el `modulo` de los 30 ítems absorbidos al número que ocupan aquí.

    ESTE ES EL ARREGLO DE UN DEFECTO REAL, encontrado al recorrer la página el
    2026-08-30. El campo `modulo` de un ítem lo usa el motor en UN solo sitio:
    el resumen del quiz, que al terminar dice «te costaron preguntas de estos
    módulos» y los nombra con `courseData.modules[modulo - 1]`. El banco del
    simulacro guarda ahí **la semana**, 1 a 4, y eso era correcto en el recurso
    del Taller 1 —donde las semanas ERAN los módulos 1 a 4; su propio comentario
    lo dice—. Aquí las semanas ocupan otro sitio, así que sin remapear el
    resumen manda al estudiante al módulo equivocado: la semana 1 le decía que
    repasara «Cómo usar esto».

    Es el defecto más caro que podía tener este instrumento, porque lo único que
    produce es precisamente decirle a alguien qué repasar.

    No se toca `simulacro.js`: se absorbe verbatim (D1) y su prueba lo lee tal
    cual. El remapeo es de ensamblado, y el reparto en los cuatro quizzes no se
    entera porque va por `semana`, que es otro campo.
    """
    donde = {m["semana"]: n for n, m in enumerate(MODULOS, start=1) if "semana" in m}
    if sorted(donde) != [1, 2, 3, 4]:
        aborta(f"la tabla MODULOS declara las semanas {sorted(donde)}, esperaba 1-4")
    nuevo, cuantos = re.subn(
        r"modulo: \d+,\n        semana: (\d+),",
        lambda m: f"modulo: {donde[int(m.group(1))]},\n        semana: {m.group(1)},",
        banco)
    if cuantos != 30:
        aborta(f"el remapeo tocó {cuantos} ítems del simulacro, esperaba 30. Si el banco cambió "
               "de formato, arréglalo antes de publicar: sin remapear, el resumen de cada quiz "
               "manda al estudiante a un módulo que no es.")
    return nuevo


def objetivos_para_el_diagnostico():
    """Los seis objetivos, como dato para el termómetro del módulo de diagnóstico.

    Sale de `tabla_especificaciones.json`, que es donde ya vive el reparto: el
    diagnóstico no puede tener su propia lista de objetivos, porque el día que
    Javier mueva un peso —lo hizo el 2026-09-02— las dos dejarían de coincidir y
    la página le diría al estudiante que estudie según una tabla que no es la
    que publica dos módulos más arriba.
    """
    d = json.loads(TABLA.read_text(encoding="utf-8"))
    objetivos = [{"id": o["id"], "titulo": o["titulo"], "peso": o["peso"],
                  "modulos": o["modulos"]} for o in d["objetivos"]]
    return (
        "\n    // ================================================================\n"
        "    // Los objetivos del Corte I y los módulos que los enseñan, para el\n"
        "    // diagnóstico. Generado desde precalculo/tabla_especificaciones.json.\n"
        "    // ================================================================\n"
        "    const OBJETIVOS_CORTE1 = %s;\n\n"
        "    const CAPITULOS_HREF = %s;\n"
        % (json.dumps(objetivos, ensure_ascii=False, separators=(",", ":")),
           json.dumps({str(k): v for k, v in CAPITULOS.items()}, ensure_ascii=False))
    )


def remapea_modulo_del_banco_nuevo(banco):
    """Igual que el del simulacro, pero por `bloque` en vez de por semana.

    Los 29 ítems nuevos guardan en `modulo` el número de su bloque, 1 a 4, que
    es lo que vale mientras el fichero se mire solo. En la página los bloques
    ocupan los módulos que les toque según la tabla MODULOS, y el motor usa
    `modulo` para decir «te costaron preguntas de estos módulos». Sin remapear,
    el bloque A mandaría a repasar «Cómo usar esto».
    """
    donde = {m["bloque"]: n for n, m in enumerate(MODULOS, start=1) if "bloque" in m}
    if sorted(donde) != [1, 2, 3, 4]:
        aborta(f"la tabla MODULOS declara los bloques {sorted(donde)}, esperaba 1-4")
    nuevo, cuantos = re.subn(
        r"modulo: \d+,\n        bloque: (\d+),",
        lambda m: f"modulo: {donde[int(m.group(1))]},\n        bloque: {m.group(1)},",
        banco)
    if cuantos != 29:
        aborta(f"el remapeo tocó {cuantos} ítems del banco nuevo, esperaba 29. Si el banco "
               "cambió de formato, arréglalo antes de publicar: sin remapear, el resumen de "
               "cada bloque manda al estudiante a un módulo que no es.")
    return nuevo


def reparto_por_objetivo(bancos):
    """Cuántos ítems toca cada objetivo, contados sobre los bancos que se publican.

    Existe porque el módulo de apertura llevaba escrito a mano «O3 son 2 de 30
    (6,7 %)», y esa frase dejó de ser cierta en cuanto entraron los 29 ítems
    nuevos. Una cifra a mano sobre algo que cambia es el modo de fallo que este
    proyecto persigue, y estaba en la página que el estudiante abre primero.
    """
    d = json.loads(TABLA.read_text(encoding="utf-8"))
    de_modulo = {m: o["id"] for o in d["objetivos"] for m in o["modulos"]}
    cuenta = {o["id"]: 0 for o in d["objetivos"]}
    total = 0
    for banco in bancos:
        for cap, mod in re.findall(r"ancla: \{ cap: (\d+), modulo: (\d+),", banco):
            clave = f"{cap}.{mod}"
            if clave not in de_modulo:
                aborta(f"el módulo {clave} de un ítem no está en ningún objetivo de la tabla")
            cuenta[de_modulo[clave]] += 1
            total += 1
    # El porcentaje va REDONDEADO A ENTERO a propósito. El material escribe los
    # decimales con coma, y una cifra con coma decimal entra en el verificador de
    # prosa, que exige respaldo en el precálculo: este cociente no vive ahí —lo
    # calcula el ensamblador— así que saldría como cifra sin respaldo. Con un
    # entero la comparación con el peso sigue siendo la que el estudiante
    # necesita, y no hay que abrirle una excepción al verificador.
    filas = []
    for o in d["objetivos"]:
        n = cuenta[o["id"]]
        pct = 100 * n / total
        desvio = pct - o["peso"]
        marca = "" if abs(desvio) <= 5 else (
            " · algo por encima de su peso" if desvio > 0 else " · algo por debajo de su peso")
        filas.append(
            f'          <tr>\n'
            f'            <td><strong>{o["id"]}</strong></td>\n'
            f'            <td>{o["titulo"]}</td>\n'
            f'            <td style="text-align:right;">{o["peso"]} %</td>\n'
            f'            <td style="text-align:right;">{n} de {total}'
            f' ({pct:.0f} %){marca}</td>\n'
            f'          </tr>')
    return (
        '      <table>\n'
        '        <caption class="sr-only">Cuánto pesa cada objetivo en el Parcial 1 y cuántas '
        'preguntas de este preparcial le corresponden</caption>\n'
        '        <thead>\n'
        '          <tr>\n'
        '            <th scope="col">#</th>\n'
        '            <th scope="col">Objetivo</th>\n'
        '            <th scope="col" style="text-align:right;">Peso en el parcial</th>\n'
        '            <th scope="col" style="text-align:right;">Preguntas aquí</th>\n'
        '          </tr>\n'
        '        </thead>\n'
        '        <tbody>\n' + "\n".join(filas) + '\n'
        '        </tbody>\n'
        '      </table>')


def course_data():
    filas = ",\n".join(
        f'        {{ id: {n}, title: "{m["title"]}", shortTitle: "{m["short"]}", '
        f'duration: "{m["dur"]}" }}'
        for n, m in enumerate(MODULOS, start=1))
    return ('    const courseData = {\n'
            '      title: "Preparcial · Corte I",\n'
            '      modules: [\n' + filas + '\n'
            '      ]\n'
            '    };\n')


DESC_TARJETA = (
    "Cincuenta y nueve preguntas autocorregidas sobre los capítulos 1 y 2: cuatro bloques nuevos "
    "—conceptos, procedimientos, interpretación y análisis gráfico— sobre una población que no "
    "aparece en ningún capítulo, más el simulacro del parcial repartido por las cuatro semanas "
    "del corte. Retroalimentación en cada opción —también en las correctas— y respuestas "
    "abiertas que se corrigen contra una lista de comprobación. Trae la tabla de "
    "especificaciones del Parcial 1, con lo que pesa cada objetivo y cuántas preguntas de aquí "
    "le tocan; los diez errores de cálculo que corren sin dar error; y el mapa que lleva cada "
    "pregunta del simulacro a su módulo del capítulo y a su sección de Lohr. Sin nota y "
    "repetible.")


def tarjeta_en_indice(n_preguntas):
    """Escribe la tarjeta del índice, o REFRESCA la que ya está.

    La primera versión salía en cuanto encontraba la tarjeta, y por eso el
    índice siguió anunciando «8 módulos · 30 preguntas» después de que la página
    pasara a 12 y 59. Una cuenta escrita a mano sobre algo que cambió, otra vez,
    y en la puerta de entrada del sitio.
    """
    html = INDICE.read_text(encoding="utf-8")
    if DESTINO.name in html:
        meta = re.compile(r'(<span class="chapter-card__modules">'
                          r'<i class="fas fa-list-ul" aria-hidden="true"></i> )[^<]*(</span>)')
        desc = re.compile(r'(<p class="chapter-card__desc">)(?:(?!</p>).)*?(</p>)', re.S)
        i = html.find(f'href="{DESTINO.name}"')
        j = html.find("</a>", i)
        trozo = html[i:j]
        nuevo_trozo = meta.sub(
            rf"\g<1>{len(MODULOS)} módulos · {n_preguntas} preguntas\g<2>", trozo, count=1)
        nuevo_trozo = desc.sub(rf"\g<1>{DESC_TARJETA}\g<2>", nuevo_trozo, count=1)
        if nuevo_trozo == trozo:
            print(f"  {INDICE.name}: la tarjeta ya estaba al día")
            return
        INDICE.write_text(html[:i] + nuevo_trozo + html[j:], encoding="utf-8")
        INDICE.chmod(0o644)
        print(f"  {INDICE.name}: tarjeta refrescada "
              f"({len(MODULOS)} módulos · {n_preguntas} preguntas)")
        return
    ancla = '        </a>\n\n      </div>\n    </section>'
    if html.count(ancla) != 1:
        aborta(f"el cierre de la rejilla de tarjetas aparece {html.count(ancla)} veces en el "
               "índice; no puedo colocar la del preparcial con seguridad")
    tarjeta = f"""        </a>

        <a class="chapter-card" href="{DESTINO.name}">
          <div class="chapter-card__top">
            <span class="chapter-card__num">P1</span>
            <span class="chapter-card__icon"><i class="fas fa-stethoscope" aria-hidden="true"></i></span>
          </div>
          <div class="chapter-card__body">
            <p class="chapter-card__kicker">Corte I · autodiagnóstico sin nota</p>
            <h3 class="chapter-card__title">Preparcial del Corte I</h3>
            <p class="chapter-card__desc">{DESC_TARJETA}</p>
            <div class="chapter-card__meta">
              <span class="chapter-card__modules"><i class="fas fa-list-ul" aria-hidden="true"></i> {len(MODULOS)} módulos · {n_preguntas} preguntas</span>
              <span class="chapter-card__go">Diagnosticarme <i class="fas fa-arrow-right" aria-hidden="true"></i></span>
            </div>
          </div>
        </a>

      </div>
    </section>"""
    INDICE.write_text(html.replace(ancla, tarjeta, 1), encoding="utf-8")
    INDICE.chmod(0o644)
    print(f"  {INDICE.name}: tarjeta añadida")


def main():
    con_indice = "--con-indice" in sys.argv
    html = PLANTILLA.read_text(encoding="utf-8")

    if "renderPreguntaTexto" not in html:
        aborta("la plantilla no trae el tipo 'texto' de la autoevaluación. "
               "Ejecuta antes: python3 ensamblado/retropropaga_quiz_texto.py")

    # ---------------------------------------------------------------- cabecera
    reemplazos = [
        ('content="Plantilla base para los capítulos del material de Muestreo Estadístico '
         '(Universidad El Bosque): cajas, código R/Python en pestañas, simuladores con Chart.js, '
         'autoevaluación y ejercicios guiados."',
         'content="Preparcial del Corte I de Muestreo Estadístico (Universidad El Bosque): '
         'instrumento de autodiagnóstico sin nota sobre población y marco, sesgos y error total, '
         'probabilidades de inclusión y Horvitz-Thompson, muestreo aleatorio simple, tamaño de '
         'muestra y muestreo sistemático, con diagnóstico por objetivo."'),
        ('<meta name="keywords" content="muestreo estadístico, muestreo probabilístico, '
         'Horvitz-Thompson, probabilidades de inclusión, estratificado, conglomerados, PPT, survey, '
         'R, Python, UnBosque">',
         '<meta name="keywords" content="preparcial, autodiagnóstico, tabla de especificaciones, '
         'marco muestral, no cobertura, probabilidades de inclusión, Horvitz-Thompson, muestreo '
         'aleatorio simple, corrección por población finita, intervalo de confianza, tamaño de '
         'muestra, muestreo sistemático, R, Python, Lohr, UnBosque">'),
        ('<title>Plantilla de capítulo — Muestreo Estadístico</title>',
         '<title>Preparcial del Corte I — Muestreo Estadístico</title>'),
        ('<p class="text-xs text-white/70 font-medium tracking-wide" style="margin:0; text-align:left;">PLANTILLA BASE •\n'
         '              4 MÓDULOS DE DEMOSTRACIÓN • UNBOSQUE</p>',
         '<p class="text-xs text-white/70 font-medium tracking-wide" style="margin:0; text-align:left;">PREPARCIAL •\n'
         '              CORTE I • SIN NOTA • UNBOSQUE</p>'),
        ('<p class="text-xs mt-1 text-white/60" style="text-align:center;">Plantilla de capítulo • UnBosque 2026\n        </p>',
         '<p class="text-xs mt-1 text-white/60" style="text-align:center;">Muestreo Estadístico • Preparcial del Corte I • UnBosque 2026-II\n        </p>'),
        ('<i class="fas fa-layer-group text-xl text-white" aria-hidden="true"></i>',
         '<i class="fas fa-stethoscope text-xl text-white" aria-hidden="true"></i>'),
    ]
    for viejo, nuevo in reemplazos:
        if viejo not in html:
            aborta(f"no encuentro en la plantilla el texto:\n{viejo[:110]}...")
        html = html.replace(viejo, nuevo, 1)

    # ------------------------------------------------------------ diagnóstico
    # El componente vive SOLO aquí: ningún capítulo tiene objetivos que
    # diagnosticar, así que no hay retropropagador y no se toca la plantilla.
    html = inserta_antes(html, "  </style>\n</head>",
                         (COMPONENTES / "diagnostico.css").read_text(encoding="utf-8"),
                         "el CSS del diagnóstico")
    html = inserta_antes(html,
                         "    // ================================================================\n"
                         "    // Autoevaluación (v2)",
                         (COMPONENTES / "diagnostico.js").read_text(encoding="utf-8"),
                         "el motor del diagnóstico")
    # El orden de estas dos llamadas importa y no es cosmético: `vigilarQuizzes`
    # registra lo que haya en pantalla ANTES de que `iniciarDiagnosticos` pinte,
    # para que abrir el módulo de diagnóstico no muestre un dato viejo.
    html = inserta_despues(html, "        iniciarAutoevaluaciones();\n",
                           "        vigilarQuizzes();\n        iniciarDiagnosticos();\n",
                           "las llamadas del diagnóstico en loadModule")

    # ---------------------------------------------------------------- módulos
    banco_taller = remapea_modulo_del_banco(
        (MODULOS_DIR / "taller1" / "simulacro.js").read_text(encoding="utf-8"))
    banco_nuevo = remapea_modulo_del_banco_nuevo(BANCO_NUEVO.read_text(encoding="utf-8"))
    modulos = modulos_ensamblados()
    modulos = modulos.replace("      ⟦MAPA⟧", mapa_de_repaso(banco_taller))
    modulos = modulos.replace("      ⟦TABLA_ESPECIFICACIONES⟧", tabla_especificaciones())
    modulos = modulos.replace("      ⟦REPARTO⟧",
                              reparto_por_objetivo([banco_nuevo, banco_taller]))
    for marcador in ("⟦MAPA⟧", "⟦TABLA_ESPECIFICACIONES⟧", "⟦REPARTO⟧"):
        if marcador in modulos:
            aborta(f"el marcador {marcador} quedó sin sustituir")

    antes, despues = corta(
        html,
        "  <!-- ============================================================ -->\n  <!-- MÓDULO 1 · Cajas y tipografía",
        "\n  <script>\n    // ================================================================\n    // Configuración del capítulo",
        "los templates de los módulos")
    html = antes + modulos + despues

    # ------------------------------------------------------- courseData + datos
    def carga(nombre):
        return json.dumps(json.loads((SALIDAS / nombre).read_text(encoding="utf-8")),
                          ensure_ascii=False, separators=(",", ":"))

    course = course_data() + """
    // ================================================================
    // Datos del instrumento. Ninguna cifra se escribió a mano: si hay que
    // cambiar algo se vuelve a correr el precálculo y se vuelve a ensamblar.
    //   DATOS_PREPARCIAL — precalculo/genera_preparcial.R (los 29 ítems nuevos)
    //   DATOS_TALLER1    — precalculo/genera_taller1_recurso.R (el simulacro)
    // ================================================================
    const DATOS_PREPARCIAL = %s;

    const DATOS_TALLER1 = %s;
%s""" % (carga("preparcial_datos.json"), carga("taller1_recurso_datos.json"),
         objetivos_para_el_diagnostico())

    antes, despues = corta(
        html,
        "    const courseData = {",
        "    // ================================================================\n    // Estado y elementos del DOM",
        "courseData")
    html = antes + course + "\n" + despues

    # ------------------------------------------------------------- los bancos
    antes, despues = corta(
        html,
        "    // ================================================================\n    // Simuladores de demostración",
        "  </script>\n\n</body>",
        "los simuladores de demostración")
    html = antes + banco_nuevo + "\n" + banco_taller + "\n" + despues

    # ---------------------------------------------------------------- código
    codigo = {}
    codigo.update(bloques_de(CODIGO / "cadena.R"))
    codigo.update(bloques_de(CODIGO / "cadena.py"))
    faltan = [m for m in re.findall(r'⟦([A-Za-z0-9]+)⟧', html) if m not in codigo]
    if faltan:
        aborta(f"no tengo código para los marcadores {sorted(set(faltan))}")
    usados = set()

    def sustituye(m):
        usados.add(m.group(1))
        return html_mod.escape(codigo[m.group(1)], quote=False)
    html = re.sub(r'⟦([A-Za-z0-9]+)⟧', sustituye, html)

    sin_usar = sorted(set(codigo) - usados)
    if sin_usar:
        print(f"  aviso: bloques ejecutados que no se insertaron: {sin_usar}")

    # ------------------------------------------------------------- comprobación
    n_tpl = html.count("<template id=")
    if n_tpl != len(MODULOS):
        aborta(f"quedaron {n_tpl} templates y MODULOS declara {len(MODULOS)}")
    for n in range(1, len(MODULOS) + 1):
        if f'<template id="module-{n}">' not in html:
            aborta(f"falta el template module-{n}: la numeración quedó con huecos")

    DESTINO.write_text(html, encoding="utf-8")
    DESTINO.chmod(0o644)
    n_preg = len(re.findall(r"\n        tipo: '", html))
    n_cod = len(re.findall(r'class="language-', html))
    print("  escrito {}: {:,} caracteres, {} módulos, {} preguntas, {} bloques de código".format(
        DESTINO.name, len(html), n_tpl, n_preg, n_cod))

    if con_indice:
        tarjeta_en_indice(n_preg)
    else:
        print("  (sin tocar el índice: pásale --con-indice al publicar)")


if __name__ == "__main__":
    main()
