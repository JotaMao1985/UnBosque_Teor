#!/usr/bin/env python3
"""
prueba_citas.py — el auditor de citas, puesto a prueba

Material de Muestreo Estadístico 2026-II (20939). Tarea GD-D1.

Un auditor que nunca ha visto un defecto no demuestra nada al salir en verde. Este arnés
construye en una carpeta temporal un capítulo mínimo —un módulo ya migrado, con citas marcadas
y su registro de contraste, y otro heredado, con citas a mano y defectos conocidos—, su catálogo
de juguete, dos páginas de un libro inventado y su línea base;
comprueba que el auditor lo aprueba; y después le inyecta, uno por uno, los defectos que el
auditor existe para atrapar. Cada inyección debe producir EXACTAMENTE los códigos esperados: ni
se escapa el defecto, ni salta una alarma que no toca.

Además fija dos cosas que no son inyecciones: cómo se leen las citas escritas a mano (los casos
difíciles del material real, con sus ediciones cruzadas) y que el trinquete de la línea base
solo encoge.

No depende de Zotero, de los ejemplares ni de la red. Sí usa pandoc, porque el auditor compara
cada cita con lo que escribe `genera_referencias.py`:

    python3 precalculo/pruebas/prueba_citas.py

Devuelve 1 si algo no sale como se esperaba.
"""
from __future__ import annotations

import json
import pathlib
import shutil
import sys
import tempfile

RAIZ = pathlib.Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(RAIZ / "precalculo"))

import verifica_citas as V  # noqa: E402

G = V.G

# --------------------------------------------------------------------------- #
# El capítulo de juguete
# --------------------------------------------------------------------------- #
PIE_A_MANO = """  <footer>
    <ul>
      <li>Lohr, S.L. (2022). <em>Sampling: Design and Analysis</em> (3rd ed.).</li>
      <li>Särndal, C.E., Swensson, B., &amp; Wretman, J. (1992). <em>Model Assisted Survey Sampling</em>.</li>
    </ul>
  </footer>"""

PIE_GENERADO = """  <footer>
    <!--PIE-REFERENCIAS:inicio-->
    <ul class="lista-fuentes">
      <li id="pie-lohr2022sampling">Lohr, S. L. (2022). Sampling.</li>
      <li id="pie-sarndal1992model">Särndal, C.-E., Swensson, B., y Wretman, J. (1992). Model assisted.</li>
    </ul>
    <!--PIE-REFERENCIAS:fin-->
  </footer>"""

CITA_A = '<cite class="cita" data-ref="lohr2022sampling" data-loc="§1.1; ejemplo 1.1"></cite>'
CITA_B = '<cite class="cita" data-ref="meng2018statistical" data-via="lohr2022sampling" data-loc="§1.2"></cite>'
CITA_C = '<cite class="cita" data-ref="sarndal1992model"></cite>'
LI_LOHR = "<li>Lohr (2021), <strong>sección 1.2</strong> — población objetivo y marco.</li>"
LI_COCHRAN = "<li>Cochran, <em>Sampling Techniques</em> — §5.5: el tratamiento clásico.</li>"

HTML = f"""<!DOCTYPE html>
<html lang="es">
<body>
  <template id="module-1">
    <p data-afirma="c1-m1-01">La revista envió diez millones de papeletas {CITA_A}.</p>
    <p data-afirma="c1-m1-02">La identidad está en el artículo original {CITA_B}.</p>
    <div class="references">
      <ul>
        <li>{CITA_C} — la teoría general, para quien quiera seguir.</li>
      </ul>
    </div>
  </template>
  <template id="module-2">
    <p>El marco es la lista de la que se sortea (Lohr, §1.1).</p>
    <div class="references">
      <ul>
        {LI_LOHR}
        {LI_COCHRAN}
        <li>Este material — cap. 2, módulos 1 a 4: el diseño.</li>
      </ul>
    </div>
  </template>
{PIE_A_MANO}
</body>
</html>
"""

REFERENCIAS = [
    {"id": "lohr2022sampling", "type": "book", "title": "Sampling: Design and Analysis", "edition": "3",
     "DOI": "10.1/lohr", "author": [{"family": "Lohr", "given": "Sharon L."}],
     "issued": {"date-parts": [[2022]]}},
    {"id": "sarndal1992model", "type": "book", "title": "Model Assisted Survey Sampling",
     "DOI": "10.1/sarndal", "author": [{"family": "Särndal", "given": "Carl-Erik"}],
     "issued": {"date-parts": [[1992]]}},
    {"id": "meng2018statistical", "type": "article-journal", "title": "Statistical paradises",
     "DOI": "10.1/meng", "author": [{"family": "Meng", "given": "Xiao-Li"}],
     "issued": {"date-parts": [[2018]]}},
]
CANDADO = {"zotero": "0", "coleccion": "Prueba", "obras": {
    "lohr2022sampling": {"rol": "basica"}, "sarndal1992model": {"rol": "basica"},
    "meng2018statistical": {"rol": "primaria"}}}
EJEMPLARES = """lohr2022sampling:
  archivo: lohr2022sampling.epub
  desfase: 0
  edicion_comprobada: '3.ª ed. (© 2022)'
  sha256: aaa
"""
INDICE = {"clave": "lohr2022sampling", "calidad": "estructural", "extractor": "prueba",
          "ejemplar_sha256": "aaa", "paginas": [1, 591],
          "loc": {"cap. 1": [1, 29], "§1.1": [1, 5], "§1.2": [5, 8], "ejemplo 1.1": [3, 3],
                  "ejercicio 15.14": [550, 550], "ec. 3.3": [80, 80], "tabla 3.1": [81, 81],
                  "§A.1": [570, 572]}}
OBRAS = ("etiqueta\tclave\tsubcoleccion\tobra\talta\tidentificador\n"
         "lohr\tlohr2022sampling\t1 Básica\tLohr\tdoi\t10.1/lohr\n"
         "sarndal-1992\tsarndal1992model\t1 Básica\tSärndal\tdoi\t10.1/sarndal\n"
         "meng-2018\tmeng2018statistical\t3 Fuentes primarias\tMeng\tdoi\t10.1/meng\n"
         "cochran-1977\t\t1 Básica\tCochran\tejemplar\t\n")


# Dos páginas de un libro que no existe, y los pasajes «leídos» en ellas.
PAGINA_3 = "Example 1.1\n\nThe magazine mailed ten million ballots to the people on its\nlists, and about a quarter came back.\n"
PAGINA_6 = "1.2 Another section\n\nThe identity was first derived in the original article, and it is\nexact for any sample.\n"
PASAJE_1 = "The magazine mailed ten million ballots to the people on its lists"
PASAJE_2 = "The identity was first derived in the original article"

REGISTRO = """afirmaciones:
- id: c1-m1-01
  tipo: dato
  afirmacion: La revista envió diez millones de papeletas.
  hash_texto: {h1}
  veredicto: respaldada
  redactado_por: material-prueba
  verificado_por: verificador-a
  fecha: 2026-11-08
  fuentes:
  - clave: lohr2022sampling
    loc: §1.1; ejemplo 1.1
    pagina: 3
    hash_pasaje: {p1}
- id: c1-m1-02
  tipo: atribucion
  afirmacion: La identidad se dedujo en el artículo original.
  hash_texto: {h2}
  veredicto: con-matiz
  matiz: el libro lo atribuye a otro autor
  redactado_por: material-prueba
  verificado_por: verificador-b
  fecha: 2026-11-09
  fuentes:
  - clave: lohr2022sampling
    loc: §1.2
    pagina: 6
    hash_pasaje: {p2}
- id: c1-m2-01
  tipo: definicion
  afirmacion: El marco es la lista de la que se sortea la muestra.
  ancla: El marco es la lista de la que se sortea
  veredicto: pendiente
  motivo: aún no se ha leído
  redactado_por: material-prueba
  fecha: 2026-11-10
  fuentes:
  - clave: lohr2022sampling
    loc: §1.1
"""


def monta(raiz: pathlib.Path) -> tuple[pathlib.Path, pathlib.Path, pathlib.Path]:
    bib, sitio = raiz / "bibliografia", raiz / "sitio"
    (bib / "indices").mkdir(parents=True)
    (sitio / "muestreo").mkdir(parents=True)
    pagina = sitio / "muestreo" / "capitulo-1-prueba.html"
    pagina.write_text(HTML, "utf-8")
    (bib / "referencias.json").write_text(json.dumps(REFERENCIAS, ensure_ascii=False), "utf-8")
    (bib / "zotero.lock.json").write_text(json.dumps(CANDADO, ensure_ascii=False), "utf-8")
    (bib / "ejemplares.yml").write_text(EJEMPLARES, "utf-8")
    (bib / "indices" / "lohr2022sampling.json").write_text(json.dumps(INDICE, ensure_ascii=False), "utf-8")
    (bib / "obras.tsv").write_text(OBRAS, "utf-8")
    shutil.copy(RAIZ / "bibliografia" / "apa-es.csl", bib / "apa-es.csl")
    genera(bib, pagina)
    texto = bib / "_local" / "texto" / "lohr2022sampling"
    texto.mkdir(parents=True)
    (texto / "p0003.txt").write_text(PAGINA_3, "utf-8")
    (texto / "p0006.txt").write_text(PAGINA_6, "utf-8")
    (bib / "_local" / "pasajes.yml").write_text(
        f"{V.C.huella(PASAJE_1)}: {PASAJE_1}\n{V.C.huella(PASAJE_2)}: {PASAJE_2}\n", "utf-8")
    prosa = V.lee_pagina(pagina).afirmaciones
    (bib / "contraste").mkdir()
    (bib / "contraste" / "cap1.yml").write_text(REGISTRO.format(
        h1=V.C.huella(prosa["c1-m1-01"][1]), h2=V.C.huella(prosa["c1-m1-02"][1]),
        p1=V.C.huella(PASAJE_1), p2=V.C.huella(PASAJE_2)), "utf-8")
    return bib, sitio, pagina


def genera(bib: pathlib.Path, pagina: pathlib.Path) -> None:
    """Deja en la página el texto de cada cita como lo escribe el generador (el pie, no se toca)."""
    texto = pagina.read_text("utf-8")
    try:
        biblioteca, _ = G.carga_biblioteca(bib)
        pagina.write_text(G.rellena_citas(texto, biblioteca, bool(G.RE_PIE.search(texto)), bib), "utf-8")
    except G.ErrorDeCita:
        pass                    # una clave que no existe: de eso ya se queja el auditor


def audita(bib: pathlib.Path, sitio: pathlib.Path, sin_corpus: bool = False):
    """(fallas, conocidos, hoy, base) del auditor contra la línea base de esa carpeta."""
    hallazgos, paginas, _ = V.audita(bib, sitio, sin_corpus=sin_corpus)
    base = V.lee_base(bib / V.NOMBRE_BASE)
    return (*V.contrasta(hallazgos, paginas, base), base)


# --------------------------------------------------------------------------- #
# Inyecciones: (nombre, códigos esperados, mutación, texto que debe aparecer)
# --------------------------------------------------------------------------- #
def en_pagina(viejo: str, nuevo: str):
    def muta(bib, pagina):
        texto = pagina.read_text("utf-8")
        assert texto.count(viejo) == 1, f"la inyección no encuentra «{viejo[:50]}»"
        pagina.write_text(texto.replace(viejo, nuevo), "utf-8")
    return muta


def en_archivo(nombre: str, viejo: str, nuevo: str):
    def muta(bib, pagina):
        ruta = bib / nombre
        texto = ruta.read_text("utf-8")
        assert texto.count(viejo) == 1, f"la inyección no encuentra «{viejo}» en {nombre}"
        ruta.write_text(texto.replace(viejo, nuevo), "utf-8")
    return muta


def borra(nombre: str):
    return lambda bib, pagina: (bib / nombre).unlink()


def las_dos(*mutaciones):
    """Varias mutaciones a la vez: la cita y su entrada del registro cambian juntas."""
    def muta(bib, pagina):
        for una in mutaciones:
            una(bib, pagina)
    return muta


def cita_y_registro(nuevo: str):
    """Cambia el localizador de la primera cita en el HTML y en su fuente del registro."""
    return las_dos(en_pagina('data-loc="§1.1; ejemplo 1.1"', f'data-loc="{nuevo}"'),
                   en_archivo("contraste/cap1.yml", "loc: §1.1; ejemplo 1.1", f"loc: {nuevo}"))


def a_mano(muta):
    """Marca una mutación que NO debe ir seguida del generador: es justo lo que se quiere cazar."""
    def igual(bib, pagina):
        muta(bib, pagina)
    igual.a_mano = True
    return igual


def vacia_una_cita(bib, pagina):
    texto = pagina.read_text("utf-8")
    pagina.write_text(G.RE_CITA.sub(lambda m: f'<cite{m.group("atributos")}></cite>', texto, count=1), "utf-8")


def crea(nombre: str, contenido: str):
    def muta(bib, pagina):
        (bib / nombre).write_text(contenido, "utf-8")
    return muta


REG = "contraste/cap1.yml"
ENTRADA_1 = "veredicto: respaldada\n  redactado_por: material-prueba\n  verificado_por: verificador-a"


INYECCIONES = [
    # --- citas marcadas: fallan siempre -------------------------------------------------
    ("clave que no está en el catálogo", {"L1", "L7"},
     las_dos(en_pagina('data-ref="lohr2022sampling" data-loc="§1.1', 'data-ref="lohr2023sampling" data-loc="§1.1'),
             en_archivo(REG, "clave: lohr2022sampling\n    loc: §1.1; ejemplo 1.1", "clave: lohr2023sampling\n    loc: §1.1; ejemplo 1.1")),
     "no está en referencias.json"),
    ("`data-via` que no está en el catálogo", {"L1", "L7"},
     las_dos(en_pagina('data-via="lohr2022sampling"', 'data-via="lohr2023sampling"'),
             en_archivo(REG, "clave: lohr2022sampling\n    loc: §1.2", "clave: lohr2023sampling\n    loc: §1.2")), "data-via"),
    ("localizador fuera del vocabulario", {"V1"},
     cita_y_registro("sec. 1.1"), "vocabulario cerrado"),
    ("rango de páginas con guion en vez de raya", {"V1"},
     cita_y_registro("pp. 3-5"), "vocabulario cerrado"),
    ("sección que no existe", {"L2"},
     cita_y_registro("§9.9"), "no existe"),
    ("ejercicio que no existe (el 15.13 no es el 15.14)", {"L2"},
     cita_y_registro("ejercicio 15.13"), "no existe"),
    ("página fuera del libro", {"L2"},
     cita_y_registro("p. 900"), "queda fuera de las páginas"),
    ("páginas que no caen en la sección citada", {"L2"},
     cita_y_registro("§1.1; pp. 300–301"), "no cae en"),
    ("tipo de localizador que el índice no cubre", {"L2"},
     cita_y_registro("fig. 1.1"), "no cubre"),
    ("apéndice que no existe", {"L2"},
     cita_y_registro("ap. C"), "no tiene apéndice"),
    ("obra sin ejemplar con localizador directo, y sin afirmación que la respalde", {"L4", "R2"},
     en_pagina('data-ref="sarndal1992model"', 'data-ref="sarndal1992model" data-loc="§2.8"'),
     "no tiene ejemplar"),
    ("segunda mano a través de una obra sin ejemplar", {"L4"},
     las_dos(en_pagina('data-via="lohr2022sampling"', 'data-via="sarndal1992model"'),
             en_archivo(REG, "clave: lohr2022sampling\n    loc: §1.2", "clave: sarndal1992model\n    loc: §1.2")),
     "tampoco tiene ejemplar"),
    # --- el registro de contraste -------------------------------------------------------
    ("quien verifica es quien redactó", {"L5"},
     en_archivo(REG, "verificado_por: verificador-a", "verificado_por: Material-Prueba"), "quien redactó"),
    ("afirmación respaldada que nadie verificó", {"L5"},
     en_archivo(REG, "  verificado_por: verificador-b\n", ""), "falta `verificado_por`"),
    ("cita con localizador sobre una afirmación que discrepa", {"L6"},
     en_archivo(REG, ENTRADA_1, ENTRADA_1.replace("respaldada", "discrepa\n  motivo: el libro dice otra cosa")),
     "cuyo veredicto es `discrepa`"),
    ("la prosa cambió y se marcó por reverificar: la cita no puede seguir a la vista", {"L6"},
     las_dos(en_pagina("diez millones de papeletas", "once millones de papeletas"),
             en_archivo(REG, ENTRADA_1, ENTRADA_1.replace("respaldada", "por-reverificar"))),
     "por-reverificar"),
    ("la prosa de una afirmación cambió después de contrastarla", {"R3"},
     en_pagina("diez millones de papeletas", "once millones de papeletas"), "la prosa cambió"),
    ("el literal de ancla ya no está en el módulo", {"R3"},
     en_pagina("El marco es la lista de la que se sortea", "El marco es el listado del que se sortea"),
     "ya no está en el módulo 2"),
    ("`data-afirma` sin entrada en el registro", {"R2"},
     en_pagina("<p>El marco es", '<p data-afirma="c1-m2-07">Otra afirmación.</p>\n    <p>El marco es'),
     "no tiene entrada"),
    ("entrada del registro cuya afirmación ya no está envuelta", {"R2"},
     en_pagina(' data-afirma="c1-m1-02"', ""), "no hay ningún `data-afirma`"),
    ("`data-afirma` repetida", {"R2", "R3"},
     en_pagina("<p>El marco es", '<p data-afirma="c1-m1-01">Repetida.</p>\n    <p>El marco es'), "repetida"),
    ("la cita apunta a un sitio y el registro a otro", {"R2"},
     en_pagina('data-loc="§1.1; ejemplo 1.1"', 'data-loc="§1.2"'), "no coincide con ninguna fuente"),
    ("el pasaje no está en esa página del ejemplar", {"R4"},
     en_archivo("_local/texto/lohr2022sampling/p0003.txt", "ten million", "two million"), "NO está en la p. 3"),
    ("el pasaje guardado no es el que se registró", {"R4"},
     en_archivo("_local/pasajes.yml", "ten million ballots", "ten million postcards"), "huella distinta"),
    ("la página del pasaje no cae en el localizador", {"R4"},
     en_archivo(REG, "pagina: 3", "pagina: 40"), "no casan"),
    ("sin corpus: no comprobable, no aprobado", {"R4"},
     borra("_local/pasajes.yml"), "no comprobable aquí"),
    ("registro: tipo que no existe", {"R1"}, en_archivo(REG, "tipo: definicion", "tipo: cifra"), "`tipo` desconocido"),
    ("registro: veredicto que no existe", {"R1"},
     en_archivo(REG, "veredicto: pendiente", "veredicto: dudosa"), "`veredicto` desconocido"),
    ("registro: id de otro capítulo", {"R1"}, en_archivo(REG, "id: c1-m2-01", "id: c2-m2-01"), "otro capítulo"),
    ("registro: con-matiz que no dice el matiz", {"R1"},
     en_archivo(REG, "  matiz: el libro lo atribuye a otro autor\n", ""), "sin `matiz`"),
    ("registro: pendiente sin motivo", {"R1"}, en_archivo(REG, "  motivo: aún no se ha leído\n", ""), "sin `motivo`"),
    ("registro: fuente sin la página del pasaje", {"R1"}, en_archivo(REG, "    pagina: 3\n", ""), "falta `pagina`"),
    ("registro: fecha que no es una fecha", {"R1"}, en_archivo(REG, "fecha: 2026-11-09", "fecha: ayer"), "`fecha`"),
    ("registro: entrada sin ancla", {"R1"},
     en_archivo(REG, "  ancla: El marco es la lista de la que se sortea\n", ""), "no tiene ancla"),
    ("registro de un capítulo que no tiene página", {"K1"},
     crea("contraste/cap9.yml", "afirmaciones: []\n"), "no hay página"),
    # --- el ejemplar y el catálogo ------------------------------------------------------
    ("se leyó una edición y se cita otra (número)", {"L3"},
     en_archivo("ejemplares.yml", "3.ª ed. (© 2022)", "2.ª ed. (© 2022)"), "edición 3"),
    ("se leyó una edición y se cita otra (año)", {"L3"},
     en_archivo("ejemplares.yml", "3.ª ed. (© 2022)", "3.ª ed. (© 2021)"), "2022"),
    ("portada sin comprobar", {"L3"},
     en_archivo("ejemplares.yml", "'3.ª ed. (© 2022)'", "null"), "no está comprobada"),
    ("índice construido con otro ejemplar", {"K1"},
     en_archivo("ejemplares.yml", "sha256: aaa", "sha256: bbb"), "otro ejemplar"),
    ("ejemplar sin índice: no comprobable, no aprobado", {"K1", "L2"},
     borra("indices/lohr2022sampling.json"), "no comprobable aquí"),
    ("obras.tsv atribuye la clave de otra obra", {"K1"},
     en_archivo("obras.tsv", "10.1/sarndal", "10.1/otro"), "DOI"),
    # --- lo que escribe el generador ----------------------------------------------------
    ("cita marcada que nadie pasó por el generador", {"L7"}, a_mano(vacia_una_cita), "no llevan el texto"),
    ("texto de una cita retocado a mano", {"L7"},
     a_mano(en_pagina("(Lohr, 2022, §1.1; ejemplo 1.1)", "(Lohr, 2021, §1.1; ejemplo 1.1)")), "1 de 3 citas"),
    ("localizador cambiado sin volver a generar", {"L7", "R2"},
     a_mano(en_pagina('data-loc="§1.1; ejemplo 1.1"', 'data-loc="§1.2"')), "no llevan el texto"),
    # --- el pie de referencias ----------------------------------------------------------
    ("obra citada que falta en el pie a mano", {"L7"},
     en_pagina('      <li>Särndal, C.E., Swensson, B., &amp; Wretman, J. (1992). <em>Model Assisted Survey Sampling</em>.</li>\n', ""),
     "no está en el pie"),
    ("obra en el pie a mano que la página no cita", {"L7"},
     en_pagina("    </ul>\n  </footer>", "      <li>Kish, L. (1965). Survey Sampling.</li>\n    </ul>\n  </footer>"),
     "la página no la cita"),
    ("pie generado al que le falta una obra citada", {"L7", "B1"},
     en_pagina(PIE_A_MANO, PIE_GENERADO.replace(
         '      <li id="pie-sarndal1992model">Särndal, C.-E., Swensson, B., y Wretman, J. (1992). Model assisted.</li>\n', "")),
     "«sarndal1992model» se cita en la página y no está en el pie"),
    ("pie generado con una obra que nadie cita", {"L7", "B1"},
     en_pagina(PIE_A_MANO, PIE_GENERADO.replace(
         "    </ul>\n    <!--PIE", '      <li id="pie-meng2018statistical">Meng (2018).</li>\n    </ul>\n    <!--PIE')),
     "«meng2018statistical» está en el pie y la página no la cita"),
    ("página con citas marcadas y sin pie", {"L7", "B1"},
     en_pagina(PIE_A_MANO, ""), "no tiene pie de referencias"),
    # --- citas heredadas: el trinquete --------------------------------------------------
    ("entrada nueva sin marcar en «Para ampliar»", {"M1"},
     en_pagina(LI_COCHRAN, LI_COCHRAN + "\n        <li>Lohr — §1.1: otra lectura.</li>"), "entran marcadas"),
    ("cita en línea nueva en la prosa", {"M1"},
     en_pagina("<p>El marco es", "<p>El muestreo se define en Lohr (§1.2).</p>\n    <p>El marco es"),
     "entran marcadas"),
    ("entrada de una obra que nadie reconoce", {"M1", "L1"},
     en_pagina(LI_COCHRAN, LI_COCHRAN + "\n        <li>Fulano y Mengano, <em>Otro libro</em>, cap. 3.</li>"),
     "no se reconoce"),
    ("entrada heredada retocada sin migrarla", {"M1", "B1", "L3"},
     en_pagina("<strong>sección 1.2</strong>", "<strong>sección 1.1</strong>"), "ya no existe"),
    ("defecto heredado arreglado y no retirado de la línea base", {"B1"},
     en_pagina(LI_COCHRAN + "\n", ""), "retírese con --anota"),
    ("entrada migrada que además nombra otra obra sin marcarla", {"M1", "L1", "L7"},
     en_pagina("para quien quiera seguir.", "para quien quiera seguir; Kish (1965) es la fuente original."),
     "entran marcadas"),
    ("«ej.» que solo existe como ejercicio", {"M1", "V1"},
     en_pagina(LI_COCHRAN, LI_COCHRAN + "\n        <li>Lohr — ej. 15.14: el Digest.</li>"), "ambigua"),
    ("edición de la que no hay ejemplar", {"M1", "L3", "L1", "L7"},
     en_pagina(LI_COCHRAN, LI_COCHRAN + "\n        <li>Lohr, sección 3.1 (2.ª ed.) — la razón.</li>"),
     "2.ª ed. de Lohr"),
    ("localizador heredado que no existe", {"M1", "L2"},
     en_pagina(LI_COCHRAN, LI_COCHRAN + "\n        <li>Lohr — §7.7 (3.ª ed.): otra cosa.</li>"), "no existe"),
    ("localizador heredado fuera del vocabulario", {"M1", "V1"},
     en_pagina(LI_COCHRAN, LI_COCHRAN + "\n        <li>Lohr — Teorema 2.1: la insesgadez.</li>"),
     "vocabulario"),
]

# --------------------------------------------------------------------------- #
# Lectura de citas escritas a mano: (texto, en línea, [(localizador, edición)])
# --------------------------------------------------------------------------- #
LECTURAS = [
    ("Lohr — §4.4.1 (1.ª ed., ec. 4.11) / §3.4.1 (3.ª ed., ecs. 3.12–3.13): cuándo pierde.", False,
     [("§4.4.1", "1"), ("ec. 4.11", "1"), ("§3.4.1", "3"), ("ec. 3.12", "3"), ("ec. 3.13", "3")]),
    ("Lohr, secciones 3.1 y 3.1.1 (2.ª ed.) o 4.1 y 4.1.1 (3.ª ed.) — el estimador de razón.", False,
     [("§3.1", "2"), ("§3.1.1", "2"), ("§4.1", "3"), ("§4.1.1", "3")]),
    ("Lohr, ejercicio 26 del capítulo 4 (3.ª ed.) — la demostración.", False, [("ejercicio 4.26", "3")]),
    ("Lohr — §6.2 (ambas ediciones): con reemplazo, la teoría que el capítulo 6 desarrolla.", False,
     [("§6.2", "ambas")]),
    ("Lohr, sección 3.2 (2.ª ed.) o 4.2 (3.ª ed.), Ejemplo 4.7 — los árboles, que es el ejercicio 4 "
     "del módulo 14.", False, [("§3.2", "2"), ("§4.2", "3"), ("ejemplo 4.7", "3")]),
    ("Lohr — cap. 8 y §1.2: el proceso de una encuesta.", False, [("cap. 8", None), ("§1.2", None)]),
    ("Lohr — §8.5 y cap. 15 (ej. 9 y 10): post-estratificación.", False,
     [("§8.5", None), ("cap. 15", None), ("ej 15.10", None), ("ej 15.9", None)]),
    ("Portela, J. y Villeta, M. Técnicas, sección 7.1.2 (pp. 211–214) — la cota.", False,
     [("§7.1.2", None), ("pp. 211–214", None)]),
    ("Lohr (2021), sección 1.4 — la tipología; y sección 8.2, donde se demuestra.", False,
     [("§1.4", "3"), ("§8.2", "3")]),
    ("Lohr, S.L. Sampling, capítulo 3 completo en la 2.ª edición —que es el capítulo 4 en la 3.ª—.", False,
     [("cap. 3", "2"), ("cap. 4", "3")]),
    ("Gutiérrez — §4.2, Resultado 4.2.4: la varianza del PPT.", False, [("§4.2", None), (None, None)]),
    ("Lohr (2021), ejemplo 2.5 y apéndice de datos — la descripción de agpop.", False,
     [("ejemplo 2.5", "3"), (None, "3")]),
    ("como en el capítulo 2 y en la tabla del módulo 11", True, []),
    ("Lohr la analiza en el capítulo 9 (Ej. 9.4)", True, [("ej 9.4", None)]),
]

EN_LINEA = [
    ("El deff de la proporción es 5,7 (Lohr, §7.5): se nota.", ["Lohr, §7.5"]),
    ("Es la receta de §4.1.4 de Lohr, y reproduce su cifra.", ["§4.1.4 de Lohr"]),
    ("Lohr lo pide demostrar en el ejercicio 26 del capítulo 4.",
     ["Lohr lo pide demostrar en el ejercicio 26 del capítulo 4"]),
    ("El curso sigue el orden de Lohr. El aparato formal está en el capítulo 2.", []),
    ("La de Lohr (ec. 4.27 de la 3.ª ed.) es una aproximación.", ["Lohr (ec. 4.27 de la 3.ª"]),
]


# Lo que escribe el generador: (cita tal como la deja quien redacta, texto visible que debe salir)
GENERADO = [
    ('<cite class="cita" data-ref="lohr2022sampling" data-loc="§1.1; ejemplo 1.1"></cite>',
     "(Lohr, 2022, §1.1; ejemplo 1.1)"),
    ('<cite class="cita" data-ref="lohr2022sampling" data-loc="§1.1" data-modo="narrativa"></cite>',
     "Lohr (2022, §1.1)"),
    ('<cite class="cita" data-ref="lohr2022sampling" data-modo="suelta"></cite>', "Lohr, 2022"),
    ('<cite class="cita" data-ref="meng2018statistical" data-via="lohr2022sampling" data-loc="§1.2"></cite>',
     "(Meng, 2018, citado en Lohr, 2022, §1.2)"),
    ('<cite data-loc="p. 3" class="nota cita" data-ref="sarndal1992model" data-modo="narrativa">texto viejo</cite>',
     "Särndal (1992, p. 3)"),
]


# --------------------------------------------------------------------------- #
def main() -> int:
    malas = 0

    def informa(bien: bool, nombre: str, detalle: str = "") -> None:
        nonlocal malas
        malas += not bien
        print(f"{'OK    ' if bien else 'FALLA '} {nombre}" + (f" — {detalle}" if detalle and not bien else ""))

    # 1. Lectura de citas a mano
    for texto, en_linea, esperado in LECTURAS:
        leido = [(l.canon, l.edicion) for l in V.localizadores(texto, en_linea)]
        informa(leido == esperado, f"lee: {texto[:62]}…", f"leyó {leido}")
    for texto, esperado in EN_LINEA:
        leido = [u.texto for u in V.lee_en_linea("p", "M1", texto)]
        informa(leido == esperado, f"en línea: {texto[:56]}…", f"detectó {leido}")

    with tempfile.TemporaryDirectory() as tmp:
        tmp = pathlib.Path(tmp)
        limpio = tmp / "limpio"
        bib, sitio, _ = monta(limpio)

        # 1b. El generador: el texto de cada cita, el enlace al pie y la idempotencia
        biblioteca, _ = G.carga_biblioteca(bib)
        for cita, esperado in GENERADO:
            suelta = G.rellena_citas(cita, biblioteca, False, bib)
            enlazada = G.rellena_citas(cita, biblioteca, True, bib)
            visible = V.I.plano(suelta)
            leida = "lohr2022sampling" if "lohr2022sampling" in cita else "sarndal1992model"
            informa(visible == esperado and f'href="#pie-{leida}"' in enlazada and "href=" not in suelta
                    and G.rellena_citas(suelta, biblioteca, False, bib) == suelta,
                    f"genera: {esperado}", f"escribió «{visible}»")
        try:
            G.rellena_citas('<cite class="cita" data-ref="nadie2000nada"></cite>', biblioteca, False, bib)
            informa(False, "genera: una clave que no existe aborta", "no abortó")
        except G.ErrorDeCita:
            informa(True, "genera: una clave que no existe aborta")

        # 2. Sin línea base, lo heredado falla; al admitirlo, queda en verde
        fallas, _, hoy, base = audita(bib, sitio)
        codigos = sorted({x.codigo for x in fallas})
        informa(codigos == ["L1", "L3", "L4", "L7", "M1"], "sin línea base, lo heredado falla",
                f"códigos {codigos}")
        V.anota(bib / V.NOMBRE_BASE, base, hoy, admite=True)
        fallas, conocidos, hoy, base = audita(bib, sitio)
        informa(not fallas and len(base["sin_marcar"]) == 3 and len(conocidos) == 4,
                "con la línea base admitida, el capítulo limpio pasa",
                f"{[str(x) for x in fallas]} · {len(base['sin_marcar'])} sin marcar · {len(conocidos)} conocidos")

        # 3. Cada inyección, exactamente sus códigos
        for nombre, esperados, muta, debe_decir in INYECCIONES:
            caso = tmp / "caso"
            shutil.rmtree(caso, ignore_errors=True)
            shutil.copytree(limpio, caso)
            muta(caso / "bibliografia", caso / "sitio" / "muestreo" / "capitulo-1-prueba.html")
            if not getattr(muta, "a_mano", False):
                genera(caso / "bibliografia", caso / "sitio" / "muestreo" / "capitulo-1-prueba.html")
            fallas, *_ = audita(caso / "bibliografia", caso / "sitio")
            vistos = {x.codigo for x in fallas}
            dicho = any(debe_decir in str(x) for x in fallas)
            informa(vistos == esperados and dicho, f"inyección: {nombre}",
                    f"esperaba {sorted(esperados)} con «{debe_decir}»; salió {[str(x)[:110] for x in fallas]}")

        # 4. El trinquete: --anota no admite lo nuevo, y sí retira lo arreglado
        caso = tmp / "trinquete"
        shutil.copytree(limpio, caso)
        b, s, pagina = caso / "bibliografia", caso / "sitio", caso / "sitio" / "muestreo" / "capitulo-1-prueba.html"
        en_pagina(LI_COCHRAN, LI_COCHRAN + "\n        <li>Lohr — §1.1: otra lectura.</li>")(b, pagina)
        fallas, _, hoy, base = audita(b, s)
        retiradas, anadidas = V.anota(b / V.NOMBRE_BASE, base, hoy, admite=False)
        fallas, *_ = audita(b, s)
        informa((retiradas, anadidas) == (0, 0) and {x.codigo for x in fallas} == {"M1"},
                "trinquete: --anota sin --admite no graba una cita nueva",
                f"retiró {retiradas}, añadió {anadidas}, quedan {[x.codigo for x in fallas]}")
        pagina.write_text(HTML.replace(LI_COCHRAN + "\n", ""), "utf-8")
        genera(b, pagina)
        fallas, _, hoy, base = audita(b, s)
        retiradas, anadidas = V.anota(b / V.NOMBRE_BASE, base, hoy, admite=False)
        fallas, _, _, base = audita(b, s)
        informa(retiradas == 4 and anadidas == 0 and not fallas and len(base["defectos"]) == 1,
                "trinquete: --anota retira lo arreglado y la línea base encoge",
                f"retiró {retiradas}, añadió {anadidas}, quedan {[str(x) for x in fallas]}")

        # 4b. Sin corpus, con --sin-corpus: informa y no falla; y cuenta lo que no pudo comprobar
        caso = tmp / "clon"
        shutil.copytree(limpio, caso)
        shutil.rmtree(caso / "bibliografia" / "_local")
        fallas, *_ = audita(caso / "bibliografia", caso / "sitio", sin_corpus=True)
        _, _, cat = V.audita(caso / "bibliografia", caso / "sitio", sin_corpus=True)
        informa(not fallas and cat.cuenta["sin_corpus"] == 2 and cat.cuenta["comprobadas"] == 0,
                "en un clon sin corpus, --sin-corpus informa y no aprueba nada",
                f"{[str(x) for x in fallas]} · {cat.cuenta}")
        _, _, cat = V.audita(bib, sitio)
        informa(cat.cuenta["comprobadas"] == 2 and cat.cuenta["veredictos"] == {"respaldada": 1, "con-matiz": 1, "pendiente": 1},
                "con el corpus delante, los dos pasajes se encuentran en su página", str(cat.cuenta))

        # 4c. Un capítulo migrado entero, con el pie generado, pasa sin línea base
        caso = tmp / "migrado"
        shutil.copytree(limpio, caso)
        b, pagina = caso / "bibliografia", caso / "sitio" / "muestreo" / "capitulo-1-prueba.html"
        (b / V.NOMBRE_BASE).unlink()
        biblioteca, candado = G.carga_biblioteca(b)
        entero = HTML.replace(" (Lohr, §1.1)", "").replace(LI_LOHR + "\n        ", "").replace(LI_COCHRAN + "\n        ", "")
        pie = "      " + G.bloque_pie(G.leidas_de(entero), biblioteca, candado, b, G.claves_de(entero)) + "\n"
        i, j = entero.index("    <ul>\n      <li>Lohr, S.L."), entero.index("  </footer>")
        pagina.write_text(entero[:i] + pie + entero[j:], "utf-8")
        genera(b, pagina)
        fallas, *_ = audita(b, caso / "sitio")
        con_enlace = pagina.read_text("utf-8").count('href="#pie-lohr2022sampling"')
        informa(not fallas and con_enlace == 2, "un capítulo migrado entero, con pie generado, pasa sin línea base",
                f"{[str(x)[:140] for x in fallas]} · {con_enlace} enlaces al pie")
        retocado = pagina.read_text("utf-8").replace("Design and Analysis</em>", "Design and Analisis</em>")
        assert retocado != pagina.read_text("utf-8"), "la inyección no encontró la entrada del pie"
        pagina.write_text(retocado, "utf-8")
        fallas, *_ = audita(b, caso / "sitio")
        informa({x.codigo for x in fallas} == {"L7"} and any("el pie de referencias no es el que escribe" in str(x) for x in fallas),
                "inyección: entrada del pie generado retocada a mano", f"{[str(x)[:140] for x in fallas]}")

        # 5. El contrato curso → vault
        _, paginas, cat = V.audita(bib, sitio)
        uso = V.uso_de_fuentes(paginas, cat, 20939)["obras"]
        lohr = uso["lohr2022sampling"]
        informa(lohr["citas"] == 1 and lohr["sin_marcar"] == 2 and lohr["capitulos"] == [1]
                and lohr["afirmaciones"] == {"respaldada": 1, "con-matiz": 1, "pendiente": 1}
                and lohr["ejemplar"] and lohr["rol"] == "basica" and not uso["sarndal1992model"]["ejemplar"]
                and uso["meng2018statistical"]["citas"] == 1,
                "uso_fuentes: citas, capítulos, ejemplar y rol por obra", json.dumps(uso, ensure_ascii=False))

    print(f"\n{'OK    ' if not malas else 'FALLA '} prueba_citas: "
          f"{len(LECTURAS) + len(EN_LINEA)} lecturas, {len(GENERADO)} citas generadas, {len(INYECCIONES) + 1} inyecciones"
          + (f"; {malas} no salieron como se esperaba" if malas else ", todas detectadas"))
    return 1 if malas else 0


if __name__ == "__main__":
    sys.exit(main())
