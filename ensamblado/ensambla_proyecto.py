#!/usr/bin/env python3
"""ensambla_proyecto.py — Construye la guía del proyecto integrador del Corte III.

Calcada de `ensambla_proyecto.py` de Diseño de Experimentos: parte de
`plantilla/plantilla-capitulo-muestreo.html` y SUSTITUYE regiones concretas,
como los ensambladores de los capítulos y del preparcial. La plantilla ya lleva
el CSS y el motor de los demás documentos del sitio.

    python3 ensamblado/ensambla_proyecto.py               → escribe la guía y copia la plantilla .Rmd
    python3 ensamblado/ensambla_proyecto.py --revisar     → comprueba todo y no escribe nada
    python3 ensamblado/ensambla_proyecto.py --con-indice  → además, la tarjeta en el índice (SOLO AL PUBLICAR)

DE DÓNDE SALE CADA COSA
  · La prosa: `ensamblado/proyecto/modulos/m*.html`, con marcadores `@@CLAVE@@`.
  · Las cifras del proyecto —fechas, pesos, rúbrica, tope, extensiones—:
    `ensamblado/proyecto/datos.py`, y SOLO de ahí.
  · El código de R: `ensamblado/codigo/proyecto/cadena.R`, ejecutado de verdad
    y anotado con `precalculo/anota_salidas.py`; entra por los marcadores ⟦R1⟧…
    Las cifras del ejemplo que cita la prosa (@@EJ_*@@) se leen de las salidas
    `#>` de esa misma cadena, no se teclean.

PARA PUBLICAR (solo con el visto bueno de Javier):
    1. quitar del .gitignore las dos líneas del proyecto integrador
    2. python3 ensamblado/ensambla_proyecto.py --con-indice
    3. git add de las rutas concretas y commit
    4. publicar el commit aprobado a gh-pages (procedimiento de T7.13 del plan)

Reejecutable: dos ejecuciones producen el mismo archivo.
"""
from __future__ import annotations

import html as _html
import pathlib
import re
import shutil
import sys

AQUI = pathlib.Path(__file__).resolve().parent
RAIZ = AQUI.parent
PLANTILLA = RAIZ / "plantilla" / "plantilla-capitulo-muestreo.html"
FUENTES = AQUI / "proyecto"
CADENA = AQUI / "codigo" / "proyecto" / "cadena.R"
SITIO = RAIZ / "sitio" / "muestreo"
DESTINO = SITIO / "proyecto-integrador-corte-iii.html"
INDICE = SITIO / "index.html"
RMD_FUENTE = FUENTES / "plantilla-informe.Rmd"
RMD_DESTINO = SITIO / "proyecto-integrador-plantilla.Rmd"

sys.path.insert(0, str(FUENTES))
import datos as D  # noqa: E402

TITULO = "Proyecto integrador — Corte III · Diseñar, ejecutar y defender una encuesta"
PRESUPUESTO_KB = 800

# Los diez módulos: (n, título, título corto, duración, fuente, objetivo).
MODULOS = [
    (1, "Cómo funciona el proyecto", "Cómo funciona", "10 min", "m1-como-funciona.html",
     "Saber qué se te pide, cuándo y cuánto pesa cada cosa, antes de elegir la población."),
    (2, "Qué encuesta vale", "Qué vale", "12 min", "m2-que-encuesta-vale.html",
     "Reconocer si una población y un marco dan para un proyecto antes de escribir la ficha."),
    (3, "El repositorio en GitHub", "Repositorio", "8 min", "m3-repositorio.html",
     "Montar el repositorio donde vive todo el proyecto y saber qué cuenta como entrega."),
    (4, "Hito 1 · Ficha del tema", "Ficha", "5 min", "m4-ficha.html",
     "Proponer la población y el marco en una ficha corta, a tiempo para cambiarlos."),
    (5, "Hito 2 · Protocolo", "Protocolo", "15 min", "m5-protocolo.html",
     "Dejar escrito el diseño completo, con sus probabilidades de inclusión, antes de seleccionar."),
    (6, "Hito 3 · Avance", "Avance", "8 min", "m6-avance.html",
     "Entregar la muestra, el campo y la no respuesta cuando todavía se puede insistir."),
    (7, "Hito 4 · Informe y código", "Informe", "12 min", "m7-informe.html",
     "Estimar con el diseño que se usó y contar la encuesta entera en un informe reproducible."),
    (8, "La exposición", "Exposición", "6 min", "m8-exposicion.html",
     "Contar la encuesta en el tiempo justo y defender cada decisión de diseño."),
    (9, "La modalidad conjunta con Diseño de Experimentos", "Modalidad conjunta", "8 min",
     "m9-conjunta.html",
     "Saber si te conviene un solo proyecto para las dos materias, y qué exige."),
    (10, "La rúbrica", "Rúbrica", "10 min", "m10-rubrica.html",
     "Saber con qué se califica cada entrega, y qué separa un nivel de otro."),
]


# ---------------------------------------------------------------------------
# 1. Utilidades
# ---------------------------------------------------------------------------
def lee(ruta: pathlib.Path) -> str:
    if not ruta.exists():
        sys.exit(f"PARADO: falta {ruta}")
    return ruta.read_text(encoding="utf-8")


def sustituye(texto: str, marcador: str, nuevo: str, que: str) -> str:
    n = texto.count(marcador)
    if n != 1:
        sys.exit(f"PARADO: el marcador de «{que}» aparece {n} veces "
                 f"(se esperaba 1):\n    {marcador[:110]!r}")
    print(f"  · {que}")
    return texto.replace(marcador, nuevo)


def sustituye_region(texto: str, inicio: str, fin: str, nuevo: str, que: str) -> str:
    for d in (inicio, fin):
        if texto.count(d) != 1:
            sys.exit(f"PARADO: el delimitador de «{que}» aparece "
                     f"{texto.count(d)} veces:\n    {d[:110]!r}")
    i, j = texto.index(inicio), texto.index(fin)
    if j < i:
        sys.exit(f"PARADO: los delimitadores de «{que}» están en orden inverso")
    print(f"  · {que}")
    return texto[:i] + nuevo + texto[j + len(fin):]


def e(t: str) -> str:
    return _html.escape(t, quote=False)


def cierra(h: dict) -> str:
    return f"{D.frase_fecha(h['fecha'])} a las {D.HORA_ENTREGA}"


def coma(x: float, dec: int) -> str:
    return f"{x:.{dec}f}".replace(".", ",")


def miles(n: int) -> str:
    return f"{n:,}".replace(",", "&nbsp;")


# ---------------------------------------------------------------------------
# 2. El código de R y las cifras del ejemplo, desde la cadena ejecutada
# ---------------------------------------------------------------------------
def bloques_de(ruta: pathlib.Path) -> dict[str, str]:
    """Parte la cadena por sus marcadores, como `ensambla_taller1.py`."""
    texto = lee(ruta)
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
            sys.exit(f"PARADO: el bloque {partes[i]} quedó vacío al recortarlo")
        if '###BLOQUE' in cuerpo or 'cat("\\n' in cuerpo:
            sys.exit(f"PARADO: el bloque {partes[i]} conserva restos del marcador")
        out[partes[i]] = cuerpo
    return out


def salidas(bloque: str) -> list[str]:
    return [l[2:].strip() for l in bloque.split("\n") if l.startswith("#>")]


def cifras_ejemplo(b: dict[str, str]) -> dict:
    """Lee de las salidas anotadas las cifras que la prosa cita. Si la cadena
    cambia de forma, esto para: mejor eso que una cifra vieja en la prosa."""
    def num(patron, texto, que):
        mo = re.search(patron, texto, re.M)
        if not mo:
            sys.exit(f"PARADO: no encuentro {que} en la cadena")
        return mo
    r1, r2, r3, r4 = ("\n".join(salidas(b[k])) for k in ("R1", "R2", "R3", "R4"))
    n_mas, n = map(int, num(r"^(\d+)\s+(\d+)$", r1, "los dos tamaños").groups())
    margen = float(num(r"^e <- (\d+)", b["R1"], "el margen e").group(1))
    asig = num(r"n_h <- c\(E = (\d+), H = (\d+), M = (\d+)\)", b["R2"], "la asignación").groups()
    npob = int(num(r"\[1\] (\d+)$", r2, "la suma de los pesos").group(1))
    comp = re.findall(r"^(\d+)\s+(\d+)\s+(\d+)$", r3, re.M)
    if len(comp) != 2:
        sys.exit("PARADO: no encuentro las dos comprobaciones en el bloque R3")
    media, ee, deff = map(float, num(r"^api00\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)$", r4,
                                     "media, EE y DEff").groups())
    inf, sup = map(float, num(r"^api00\s+([\d.]+)\s+([\d.]+)$", r4, "el intervalo").groups())
    ee2 = float(num(r"^\[1\] ([\d.]+)$", r4, "el EE por la fórmula").group(1))
    param = float(re.findall(r"^\[1\] ([\d.]+)$", r4, re.M)[-1])
    cubre = num(r"^\[1\] (TRUE|FALSE)$", r4, "si el intervalo cubre").group(1) == "TRUE"
    return dict(n_mas=n_mas, n=n, margen=margen, asig=tuple(map(int, asig)), N=npob,
                fuera=int(comp[0][0]), roto_fuera=int(comp[1][0]), roto_siempre=int(comp[1][2]),
                media=media, ee=ee, ee2=ee2, deff=deff, inf=inf, sup=sup, param=param, cubre=cubre)


# ---------------------------------------------------------------------------
# 3. Las tablas, desde datos.py
# ---------------------------------------------------------------------------
def tabla_hitos() -> str:
    filas = []
    for h in D.HITOS:
        peso = "sin nota" if h["id"] == "ficha" else f"{D.puntos_de(h['id'])} %"
        filas.append(f"""          <tr>
            <td>{h['n']}</td><td><strong>{e(h['nombre'])}</strong></td>
            <td>{e(h['entrega'])}</td>
            <td>{D.frase_fecha(h['fecha'])}</td><td>{h['semana']}</td><td>{peso}</td>
          </tr>""")
        if h["id"] == "avance":
            c = D.CAMPO
            filas.append(f"""          <tr>
            <td>—</td><td><strong>{e(c['nombre'])}</strong></td>
            <td>{e(c['entrega'])}</td>
            <td>{D.frase_fecha(c['fecha'])}</td><td>{c['semana']}</td><td>sin nota</td>
          </tr>""")
    filas.append(f"""          <tr>
            <td>5</td><td><strong>Exposición</strong></td>
            <td>{D.MINUTOS_EXPOSICION} minutos por equipo y {D.MINUTOS_PREGUNTAS} de preguntas por persona, en clase</td>
            <td>se acuerda en clase</td><td>{D.SEMANA_EXPOSICION}</td><td>{D.puntos_de('exposicion')} %</td>
          </tr>""")
    return f"""      <table>
        <caption>Los hitos del proyecto. Las entregas cierran a las {D.HORA_ENTREGA} del día
          indicado; el peso es sobre la nota del proyecto.</caption>
        <thead>
          <tr><th scope="col">#</th><th scope="col">Hito</th><th scope="col">Qué entregas</th>
            <th scope="col">Cierra</th><th scope="col">Semana</th><th scope="col">Peso</th></tr>
        </thead>
        <tbody>
{chr(10).join(filas)}
        </tbody>
      </table>"""


def tabla_pesos() -> str:
    filas = []
    for b in D.RUBRICA:
        p = D.puntos_de(b["hito"])
        crit = ", ".join(c["id"] for c in b["criterios"])
        filas.append(f"""          <tr>
            <td>{e(b['titulo'])}</td><td>{crit}</td><td>{p} %</td>
            <td><strong>{D.pct(p * D.PROYECTO_DEL_CORTE / 100)} %</strong></td>
          </tr>""")
    return f"""      <table>
        <caption>Reparto de la nota del proyecto. La última columna es sobre la nota del Corte III.</caption>
        <thead>
          <tr><th scope="col">Hito</th><th scope="col">Criterios</th><th scope="col">Del proyecto</th>
            <th scope="col">Del corte</th></tr>
        </thead>
        <tbody>
{chr(10).join(filas)}
        </tbody>
      </table>"""


def tabla_tope() -> str:
    filas = [f"""          <tr>
            <td>{e(f['situacion'])}</td><td>{D.nota(f['escrito'])}</td>
            <td>{D.nota(f['exposicion'])}</td><td>{D.nota(f['preguntas'])}</td>
            <td>{D.nota(f['sin_tope'])}</td><td><strong>{D.nota(f['con_tope'])}</strong></td>
          </tr>""" for f in D.filas_tope()]
    p_esc = sum(D.puntos_de(h) for h in D.HITOS_ESCRITOS)
    p_e = {c["id"]: c["puntos"] for b in D.RUBRICA for c in b["criterios"] if c["id"] in ("E1", "E2")}
    return f"""      <table>
        <caption>Qué cambia el tope. Lo escrito vale {p_esc} puntos del proyecto, la exposición
          (E1) {p_e['E1']} y las preguntas (E2) {p_e['E2']}; todo en la escala de 5.</caption>
        <thead>
          <tr><th scope="col">Situación</th><th scope="col">Escrito</th><th scope="col">Exposición (E1)</th>
            <th scope="col">Preguntas (E2)</th><th scope="col">Sin tope</th><th scope="col">Con tope</th></tr>
        </thead>
        <tbody>
{chr(10).join(filas)}
        </tbody>
      </table>"""


def tabla_retraso() -> str:
    filas = "\n".join(f"          <tr><td>{f['sesiones']}</td><td>{f['descuento']} %</td>"
                      f"<td>{D.nota(f['nota'])}</td></tr>" for f in D.filas_retraso())
    return f"""      <table>
        <caption>El descuento por entrega tardía, sobre una entrega que a tiempo habría sacado
          {D.nota(D.EJEMPLO_RETRASO)}.</caption>
        <thead>
          <tr><th scope="col">Sesiones de retraso</th><th scope="col">Descuento</th>
            <th scope="col">La nota queda en</th></tr>
        </thead>
        <tbody>
{filas}
        </tbody>
      </table>"""


def tabla_niveles() -> str:
    filas = "\n".join(f"          <tr><td>{n.capitalize()}</td><td>{D.nota(v)}</td></tr>"
                      for n, v in D.NIVELES)
    return f"""      <table>
        <caption>Lo que vale cada nivel, en la escala de 5.</caption>
        <thead>
          <tr><th scope="col">Nivel</th><th scope="col">Vale</th></tr>
        </thead>
        <tbody>
{filas}
        </tbody>
      </table>"""


def tabla_conjunto() -> str:
    filas = "\n".join(
        f"          <tr><td><code>{h['id']}</code></td><td>{e(h['nombre'])}</td>"
        f"<td>{D.frase_fecha(h['fecha'])}</td><td>{D.semana_del_curso(h['fecha'])}</td></tr>"
        for h in D.CONJUNTO_HITOS)
    return f"""      <table>
        <caption>Los hitos de la modalidad conjunta, con la etiqueta de su release en el
          repositorio de Diseño. Todos cierran a las {D.HORA_ENTREGA}.</caption>
        <thead>
          <tr><th scope="col">Etiqueta</th><th scope="col">Hito</th><th scope="col">Cierra</th>
            <th scope="col">Semana</th></tr>
        </thead>
        <tbody>
{filas}
        </tbody>
      </table>"""


def rubrica() -> str:
    partes = []
    for b in D.RUBRICA:
        partes.append(f"      <h3>{e(b['titulo'])} · {D.puntos_de(b['hito'])} puntos</h3>")
        for c in b["criterios"]:
            quien = " Se califica persona por persona." if c.get("individual") else ""
            filas = "\n".join(
                f"          <tr><td>{n.capitalize()}</td><td>{e(c[clave])}</td></tr>"
                for n, clave in (("insuficiente", "insuficiente"), ("aceptable", "aceptable"),
                                 ("sólido", "solido")))
            partes.append(f"""      <table>
        <caption><strong>{c['id']} · {e(c['nombre'])}</strong> — {c['puntos']} puntos.{quien}</caption>
        <thead>
          <tr><th scope="col">Nivel</th><th scope="col">Qué se ve</th></tr>
        </thead>
        <tbody>
{filas}
        </tbody>
      </table>""")
    return "\n\n".join(partes)


# ---------------------------------------------------------------------------
# 4. Los marcadores de la prosa
# ---------------------------------------------------------------------------
def marcadores(ej: dict) -> dict[str, str]:
    H = D.HITO
    ej0 = D.filas_tope()[0]
    m = {
        "TABLA_HITOS": tabla_hitos(),
        "TABLA_PESOS": tabla_pesos(),
        "TABLA_TOPE": tabla_tope(),
        "TABLA_NIVELES": tabla_niveles(),
        "TABLA_RETRASO": tabla_retraso(),
        "TABLA_CONJUNTO": tabla_conjunto(),
        "RUBRICA": rubrica(),
        "DESCUENTO": str(D.DESCUENTO_POR_SESION),
        "USUARIO_DOCENTE": D.USUARIO_DOCENTE,
        "NOMBRE_REPO": D.NOMBRE_REPO,
        "ETIQUETAS": ", ".join(f"<code>{D.ETIQUETA[i]}</code>" for i in ("ficha", "protocolo", "avance", "campo"))
                     + f" e <code>{D.ETIQUETA['informe']}</code>",
        "ETIQUETA_CAMPO": D.ETIQUETA["campo"],
        "CAMPO_CIERRA": cierra(D.CAMPO),
        "HORA_SEMILLA": D.HORA_SEMILLA,
        "CANAL_SEMILLA": D.CANAL_SEMILLA,
        "CLASES": D.CLASES,
        "DIA_EXPOSICION": D.DIA_EXPOSICION,
        "HORA_ENTREGA": D.HORA_ENTREGA,
        "CANAL_ENTREGA": D.CANAL_ENTREGA,
        "DUDAS_EN": D.DUDAS_EN,
        "TUTORIAS": D.tutorias_en(),
        "SEMANA_EXPOSICION": str(D.SEMANA_EXPOSICION),
        "SEMANA_EXPOSICION_FRASE": D.frase_semana(D.SEMANA_EXPOSICION),
        "MINUTOS_EXPOSICION": str(D.MINUTOS_EXPOSICION),
        "MINUTOS_PREGUNTAS": str(D.MINUTOS_PREGUNTAS),
        "PROYECTO_DEL_CORTE": str(D.PROYECTO_DEL_CORTE),
        "QUICES_DEL_CORTE": str(D.QUICES_DEL_CORTE),
        "CORTE_III_DEL_CURSO": str(D.CORTE_III_DEL_CURSO),
        "PROYECTO_DEL_CURSO": D.pct(D.PROYECTO_DEL_CURSO),
        "NIVELES": " · ".join(f"<strong>{n}</strong>" for n, _ in D.NIVELES),
        "UMBRAL": D.nota(D.UMBRAL_TOPE),
        "UMBRAL_DIV": D.divisor(D.UMBRAL_TOPE),
        "EJ0_SIN": D.nota(ej0["sin_tope"]),
        "EJ0_CON": D.nota(ej0["con_tope"]),
        "PALABRAS_FICHA": str(D.PALABRAS_FICHA),
        "PAGINAS_PROTOCOLO": str(D.PAGINAS_PROTOCOLO),
        "PAGINAS_INFORME": str(D.PAGINAS_INFORME),
        "N_MINIMO": str(D.N_MINIMO),
        "PLANTILLA_RMD": RMD_DESTINO.name,
        "CONDICION_NO_PROB": D.CONDICION_NO_PROBABILISTICO,
        "CONJ_PAG_PRE": str(D.CONJUNTO_PAGINAS_PREREGISTRO),
        "CONJ_PAG_INF": str(D.CONJUNTO_PAGINAS_INFORME),
        "CONJ_PAG_INTEG": D.CONJUNTO_PAGINAS_INTEGRACION,
        "CONJ_REPO": D.CONJUNTO_REPO,
        "CONJ_DESISTIR": f"{D.frase_fecha(D.CONJUNTO_DESISTIR_HASTA)} a las {D.HORA_ENTREGA}",
        # Las cifras del ejemplo, leídas de las salidas de la cadena
        "EJ_N_POBLACION": miles(ej["N"]),
        "EJ_MARGEN": str(int(ej["margen"])),
        "EJ_N_MAS": str(ej["n_mas"]),
        "EJ_N": str(ej["n"]),
        "EJ_FUERA": str(ej["fuera"]),
        "EJ_ROTO_SIEMPRE": str(ej["roto_siempre"]),
        "EJ_EE": coma(ej["ee"], 2),
        "EJ_MARGEN_LOGRADO": coma(1.96 * ej["ee"], 1),
        "EJ_IC_INF": coma(ej["inf"], 1),
        "EJ_IC_SUP": coma(ej["sup"], 1),
        "EJ_PARAMETRO": coma(ej["param"], 1),
        "EJ_DEFF": coma(ej["deff"], 2),
    }
    for clave, h in (("FICHA", H["ficha"]), ("PROTOCOLO", H["protocolo"]),
                     ("AVANCE", H["avance"]), ("INFORME", H["informe"])):
        m[f"{clave}_CIERRA"] = cierra(h)
        m[f"{clave}_SEMANA"] = str(h["semana"])
        m[f"ETIQUETA_{clave}"] = D.ETIQUETA[h["id"]]
        if h["id"] != "ficha":
            m[f"PESO_{clave}"] = str(D.puntos_de(h["id"]))
    m["PESO_EXPOSICION"] = str(D.puntos_de("exposicion"))
    return m


def resuelve(texto: str, m: dict[str, str], usados: set, fuente: str) -> str:
    def rep(mo):
        clave = mo.group(1)
        if clave not in m:
            sys.exit(f"PARADO: {fuente} usa el marcador desconocido @@{clave}@@")
        usados.add(clave)
        return m[clave]
    return re.sub(r"@@([A-Z0-9_]+)@@", rep, texto)


def cabecera_modulo(n: int, titulo: str, objetivo: str) -> str:
    return f"""  <!-- ============================================================ -->
  <!-- MÓDULO {n} · {titulo}
  <!-- ============================================================ -->
  <template id="module-{n}">
    <div class="animate-fade-in">
      <div class="border-b border-gray-100 pb-6 mb-6">
        <div class="flex items-center space-x-2 text-sm text-secondary font-semibold mb-2 uppercase tracking-wide">
          <span>Módulo {n}</span>
        </div>
        <h2 class="text-3xl font-bold text-gray-900 mb-4" style="border:none; padding:0;">{titulo}</h2>
        <div class="bg-gray-50 rounded-lg p-4 border border-gray-200 flex items-start gap-3">
          <span class="text-xl">🎯</span>
          <div>
            <h3 class="font-bold text-gray-800 text-sm" style="margin:0;">Objetivo</h3>
            <p class="text-gray-600 text-sm" style="margin:0;">{objetivo}</p>
          </div>
        </div>
      </div>
"""


CIERRE_MODULO = "    </div>\n  </template>"


def selectores(t: str) -> set:
    return set(re.findall(r"^\s*(\.[a-zA-Z][\w-]*)", t[:t.index("</style>")], re.M))


# ---------------------------------------------------------------------------
# 5. El ensamblado
# ---------------------------------------------------------------------------
def main() -> int:
    revisar = "--revisar" in sys.argv
    con_indice = "--con-indice" in sys.argv
    print(f"\n=== ensambla_proyecto.py{' --revisar' if revisar else ''} ===\nbase: {PLANTILLA.name}")
    html = lee(PLANTILLA)
    sel_plantilla = selectores(html)
    codigo = bloques_de(CADENA)
    ej = cifras_ejemplo(codigo)
    print("\nsustituciones:")

    # --- 1. Metadatos y cabecera -------------------------------------------
    html = sustituye(
        html, "<title>Plantilla de capítulo — Muestreo Estadístico</title>",
        f"<title>{TITULO} — Muestreo Estadístico</title>", "título del documento")
    html = sustituye(
        html,
        'content="Plantilla base para los capítulos del material de Muestreo Estadístico (Universidad '
        'El Bosque): cajas, código R/Python en pestañas, simuladores con Chart.js, autoevaluación y '
        'ejercicios guiados."',
        'content="Guía del proyecto integrador del Corte III de Muestreo Estadístico (Universidad El '
        'Bosque): diseñar, ejecutar, estimar en R y defender una encuesta por muestreo probabilístico, '
        'con sus hitos, su protocolo, su rúbrica, una plantilla de informe y la modalidad conjunta con '
        'Diseño de Experimentos."',
        "meta description")
    html = sustituye(
        html,
        'content="muestreo estadístico, muestreo probabilístico, Horvitz-Thompson, probabilidades de '
        'inclusión, estratificado, conglomerados, PPT, survey, R, Python, UnBosque"',
        'content="muestreo estadístico, proyecto integrador, encuesta, marco muestral, probabilidades '
        'de inclusión, tamaño de muestra, no respuesta, efecto de diseño, rúbrica, exposición, uso de '
        'IA, R, survey, UnBosque"',
        "meta keywords")
    html = sustituye(
        html,
        'PLANTILLA BASE •\n              4 MÓDULOS DE DEMOSTRACIÓN • UNBOSQUE',
        'PROYECTO INTEGRADOR • CORTE III •\n              '
        f'{D.PROYECTO_DEL_CORTE}&nbsp;% DE LA NOTA DEL CORTE • UNBOSQUE 2026-II',
        "subtítulo de la cabecera")
    html = sustituye(
        html, '<i class="fas fa-layer-group text-xl text-white" aria-hidden="true"></i>',
        '<i class="fas fa-clipboard-list text-xl text-white" aria-hidden="true"></i>',
        "icono de la cabecera")
    html = sustituye(
        html, 'Plantilla de capítulo • UnBosque 2026\n        </p>',
        'Muestreo Estadístico (20939) • Proyecto integrador del Corte III • UnBosque 2026-II\n        </p>',
        "pie de página")

    # --- 2. Los diez módulos -----------------------------------------------
    m = marcadores(ej)
    usados: set = set()
    piezas = []
    for n, titulo, _corto, _dur, fuente, objetivo in MODULOS:
        cuerpo = resuelve(lee(FUENTES / "modulos" / fuente), m, usados, fuente)
        piezas.append(cabecera_modulo(n, titulo, objetivo) + cuerpo.rstrip() + "\n" + CIERRE_MODULO)
    sobran = sorted(set(m) - usados)
    if sobran:
        sys.exit(f"PARADO: marcadores que ninguna prosa usa: {sobran}")
    modulos = "\n\n".join(piezas)

    # El código: cada ⟦Rn⟧ por su bloque, escapado. Todos los bloques se usan.
    faltan = sorted(set(re.findall(r"⟦([A-Za-z0-9]+)⟧", modulos)) - set(codigo))
    if faltan:
        sys.exit(f"PARADO: no tengo código para {faltan}")
    usados_cod: set = set()

    def pon_codigo(mo):
        usados_cod.add(mo.group(1))
        return e(codigo[mo.group(1)])
    modulos = re.sub(r"⟦([A-Za-z0-9]+)⟧", pon_codigo, modulos)
    if set(codigo) - usados_cod:
        sys.exit(f"PARADO: bloques ejecutados que ninguna prosa usa: {sorted(set(codigo) - usados_cod)}")

    html = sustituye_region(
        html,
        "  <!-- ============================================================ -->\n"
        "  <!-- MÓDULO 1 · Cajas y tipografía                                 -->",
        "  </template>\n\n  <script>",
        modulos + "\n\n  <script>",
        f"los {len(MODULOS)} módulos y {len(codigo)} bloques de R")

    # --- 3. courseData ------------------------------------------------------
    html = sustituye(
        html,
        "    // PLANTILLA BASE. Punto de partida para un capítulo de un curso\n"
        "    // NUEVO. Para un capítulo más de un curso ya empezado, copia su\n"
        "    // último capítulo, que lleva los datos y el contexto ya montados.",
        "    // PROYECTO INTEGRADOR DEL CORTE III. Ensamblado por\n"
        "    // ensamblado/ensambla_proyecto.py desde plantilla/plantilla-capitulo-muestreo.html.\n"
        "    // NO SE EDITA A MANO: la prosa vive en ensamblado/proyecto/modulos/, las\n"
        "    // cifras en ensamblado/proyecto/datos.py y el código en\n"
        "    // ensamblado/codigo/proyecto/cadena.R.",
        "comentario de cabecera del script")
    filas = ",\n".join(
        f'        {{ id: {i}, title: "{t}", shortTitle: "{s}", duration: "{d}" }}'
        for i, t, s, d, *_ in MODULOS)
    html = sustituye_region(
        html, "      modules: [",
        '        { id: 4, title: "Autoevaluación y ejercicios", shortTitle: "Autoevaluación", duration: "8 min" }\n      ]',
        f"      modules: [\n{filas}\n      ]",
        "courseData")
    html = sustituye(
        html,
        "    // Los datos del capítulo se incrustan aquí, generados por\n"
        "    // precalculo/genera_*.R:  const DATOS_CAPn = { ... };\n"
        "    // Los simuladores de demostración de abajo no usan datos externos.\n",
        "    // La guía no incrusta datos: sus cifras se imprimen en el marcado\n"
        "    // desde ensamblado/proyecto/datos.py y desde la cadena de R.\n",
        "comentario de los datos")

    # --- 4. Los simuladores, el ranking y el quiz de demostración ----------
    html = sustituye_region(
        html,
        "    // ================================================================\n"
        "    // Simuladores de demostración",
        "    ];\n\n  </script>",
        "  </script>",
        "se retiran los simuladores, el ranking y el quiz de demostración")

    codigo_insertado = sum(1 for k in codigo if e(codigo[k]) in html)
    rc = comprueba_y_escribe(html, sel_plantilla, revisar, ej, len(codigo), codigo_insertado)
    if rc == 0 and con_indice and not revisar:
        tarjeta_en_indice()
    elif not revisar:
        print("  (sin tocar el índice: pásale --con-indice al publicar)")
    return rc


# ---------------------------------------------------------------------------
# 6. Las comprobaciones, sobre el artefacto
# ---------------------------------------------------------------------------
def comprueba_y_escribe(html: str, sel_plantilla: set, revisar: bool, ej: dict,
                        n_bloques: int, n_insertados: int) -> int:
    print("\ncomprobaciones sobre el resultado:")
    fallos: list[str] = []
    marcado = html[html.index('<template id="module-1">'):html.rindex("\n  <script>")]

    def exige(cond: bool, que: str) -> None:
        print(f"  {'OK ' if cond else 'MAL'}  {que}")
        if not cond:
            fallos.append(que)

    exige(len(re.findall(r'<template id="module-\d+">', marcado)) == len(MODULOS),
          f"las {len(MODULOS)} plantillas de módulo")
    exige(all(f'<template id="module-{i}">' in marcado for i, *_ in MODULOS),
          f"los identificadores de módulo van del 1 al {len(MODULOS)} sin huecos")
    exige("@@" not in html, "ningún marcador @@ sin resolver")
    exige("⟦" not in html, "ningún marcador de código sin resolver")
    exige(n_insertados == n_bloques, f"los {n_bloques} bloques de R entraron byte a byte")

    tablas = marcado.count("<table>")
    exige(tablas == marcado.count("<caption"), f"las {tablas} tablas llevan su caption")

    ids = re.findall(r' id="([^"]+)"', marcado)
    repes = sorted({i for i in ids if ids.count(i) > 1})
    exige(not repes, f"identificadores únicos{'' if not repes else ': ' + ', '.join(repes)}")
    vacias = [c for c in ("note", "warning", "definition", "tip-box", "diagram", "formula")
              if re.search(rf'<div class="{c}">\s*</div>', marcado)]
    exige(not vacias, f"ninguna caja vacía{'' if not vacias else ': ' + ', '.join(vacias)}")
    exige("undefined" not in marcado, "ningún «undefined» impreso en el marcado")

    quizzes = set(re.findall(r"AUTOEVALUACIONES\['([\w-]+)'\]\s*=", html)) - {"id"}
    sims = set(re.findall(r"SIMULADORES\['([\w-]+)'\]\s*=", html)) - {"id", "mi-id"}
    exige(not quizzes, f"no hay ningún quiz{'' if not quizzes else ': ' + ', '.join(sorted(quizzes))}")
    exige(not sims, f"no hay ningún simulador{'' if not sims else ': ' + ', '.join(sorted(sims))}")

    sel = selectores(html)
    exige(sel == sel_plantilla, f"el CSS es el de la plantilla ({len(sel)} selectores)")

    for prohibido, que in [
        ("demo-deslizadores", "simulador de demostración «demo-deslizadores»"),
        ("AUTOEVALUACIONES['demo']", "autoevaluación de demostración"),
        ("Cajas y tipografía", "módulo de demostración de cajas"),
        ("PLANTILLA BASE", "el rótulo de plantilla base"),
        ("Plantilla de capítulo", "el pie de la plantilla"),
    ]:
        exige(prohibido not in html, f"no queda: {que}")
    for imprescindible in ("renderMathInElement", "wrapCodeBlocks", "iniciarSimuladores",
                           "iniciarAutoevaluaciones", "destruirSimuladores"):
        exige(imprescindible in html, f"el motor conserva {imprescindible}()")

    # Las afirmaciones de la prosa sobre el ejemplo tienen que ser verdad en la
    # salida real de la cadena.
    # Lo que la prosa afirma del ejemplo tiene que ser verdad en su salida real.
    exige(not ej["cubre"] and not (ej["inf"] <= ej["param"] <= ej["sup"]),
          "el intervalo del ejemplo NO contiene el parámetro, como dice el módulo 7")
    exige(abs(ej["deff"] - 1) < 0.05, "el DEff del ejemplo es casi 1, como dice el módulo 7")
    exige(abs(ej["ee"] - ej["ee2"]) < 1e-4, "el EE por la fórmula es el de survey, como dice el módulo 7")
    exige(1.96 * ej["ee"] <= ej["margen"], "el margen logrado cumple el del protocolo, como dice el módulo 7")
    exige(ej["n"] < ej["n_mas"], "el estratificado pide menos que el aleatorio simple, como dice el módulo 5")
    exige(sum(ej["asig"]) == ej["n"], f"la asignación del guion suma el n del tamaño ({ej['n']})")
    exige(ej["roto_fuera"] == ej["N"] and ej["fuera"] < 0.01 * ej["N"],
          "la comprobación aprueba el guion y rechaza el roto, como dice el módulo 5")
    exige(ej["n"] >= D.N_MINIMO, f"el n del ejemplo ({ej['n']}) cumple el mínimo de {D.N_MINIMO}")

    locales = [h for h in re.findall(r'href="([^"#:]+)"', marcado)
               if not h.startswith(("http", "mailto"))]
    rotos = sorted({h for h in locales if h != RMD_DESTINO.name and not (SITIO / h).exists()})
    exige(not rotos, f"los {len(locales)} enlaces locales resuelven"
                     + ("" if not rotos else ": " + ", ".join(rotos)))
    exige(not re.search(r'href="[^"#]+\.html#', marcado), "ningún enlace con ancla profunda")
    exige(RMD_FUENTE.exists(), "la plantilla .Rmd existe en la fuente")

    kb = len(html.encode("utf-8")) / 1024
    exige(kb < PRESUPUESTO_KB, f"pesa {kb:.0f} KB (presupuesto {PRESUPUESTO_KB} KB)")

    if fallos:
        print(f"\nPARADO: {len(fallos)} comprobaciones fallidas. No se escribió nada.")
        for f in fallos:
            print(f"  · {f}")
        return 1

    if revisar:
        actual = DESTINO.read_text(encoding="utf-8") if DESTINO.exists() else None
        rmd = RMD_DESTINO.read_bytes() if RMD_DESTINO.exists() else None
        print(f"\n--revisar: no se escribe nada.\n"
              f"  {'NUEVO ' if actual is None else ('igual ' if actual == html else 'CAMBIA')} "
              f"{DESTINO.relative_to(RAIZ)}\n"
              f"  {'NUEVO ' if rmd is None else ('igual ' if rmd == RMD_FUENTE.read_bytes() else 'CAMBIA')} "
              f"{RMD_DESTINO.relative_to(RAIZ)}")
        return 0

    DESTINO.write_text(html, encoding="utf-8")
    DESTINO.chmod(0o644)
    shutil.copyfile(RMD_FUENTE, RMD_DESTINO)
    RMD_DESTINO.chmod(0o644)
    print(f"\nEscrito {DESTINO.relative_to(RAIZ)}  ({DESTINO.stat().st_size / 1024:.0f} KB)")
    print(f"Copiado {RMD_DESTINO.relative_to(RAIZ)}")
    return 0


def tarjeta_en_indice() -> None:
    """La tarjeta del índice, detrás de la última. Idempotente. SOLO al publicar:
    `sitio/muestreo/index.html` está versionado, y una tarjeta que apunte a una
    página sin publicar sería un enlace roto en gh-pages."""
    html = INDICE.read_text(encoding="utf-8")
    if DESTINO.name in html:
        print(f"  {INDICE.name}: ya tiene la tarjeta, no toco nada")
        return
    ancla = '        </a>\n\n      </div>\n    </section>'
    if html.count(ancla) != 1:
        sys.exit(f"PARADO: el cierre de la rejilla de tarjetas aparece {html.count(ancla)} veces")
    tarjeta = f"""        </a>

        <a class="chapter-card" href="{DESTINO.name}">
          <div class="chapter-card__top">
            <span class="chapter-card__num">PI</span>
            <span class="chapter-card__icon"><i class="fas fa-clipboard-list" aria-hidden="true"></i></span>
          </div>
          <div class="chapter-card__body">
            <p class="chapter-card__kicker">Corte III · {D.PROYECTO_DEL_CORTE}&nbsp;% de la nota del corte</p>
            <h3 class="chapter-card__title">Proyecto integrador</h3>
            <p class="chapter-card__desc">Diseñar, ejecutar, estimar y defender una encuesta por muestreo
              probabilístico sobre una población finita real. Los hitos con sus fechas, el repositorio de
              GitHub donde vive el proyecto, el protocolo que se escribe antes de seleccionar, la comprobación
              de las probabilidades de inclusión, la estimación con survey y la rúbrica entera. Trae una
              plantilla de informe y explica la modalidad conjunta con Diseño de Experimentos.</p>
            <div class="chapter-card__meta">
              <span class="chapter-card__modules"><i class="fas fa-list-ul" aria-hidden="true"></i> {len(MODULOS)} módulos · plantilla .Rmd</span>
              <span class="chapter-card__go">Leer la guía <i class="fas fa-arrow-right" aria-hidden="true"></i></span>
            </div>
          </div>
        </a>

      </div>
    </section>"""
    INDICE.write_text(html.replace(ancla, tarjeta, 1), encoding="utf-8")
    INDICE.chmod(0o644)
    print(f"  {INDICE.name}: tarjeta añadida")


if __name__ == "__main__":
    sys.exit(main())
