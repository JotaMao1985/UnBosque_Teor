#!/usr/bin/env python3
"""Ensambla sitio/muestreo/taller-1-preparacion-parcial-1.html: el recurso de
práctica del Taller 1, con el que los estudiantes preparan el Parcial 1.

Misma mecánica que los ocho `ensambla_capN.py`: se parte de la plantilla y se
sustituyen regiones delimitadas. El código de los bloques no se escribe a mano
en el HTML —se toma de `codigo/taller1/cadena.{R,py}`, que son los archivos que
se ejecutaron de verdad— y las cifras vienen de
`precalculo/salidas/taller1_recurso_datos.json`.

Dos cosas que no hace ningún ensamblador de capítulo:

* **Genera el mapa de repaso.** La tabla que enlaza cada ítem del simulacro con
  su módulo del capítulo 1 o 2 y su sección de Lohr sale del propio `ancla` de
  cada ítem del banco. Escribirla a mano la habría dejado desincronizada al
  primer cambio; aquí, si el banco cambia, la tabla cambia. Aborta si no
  encuentra exactamente los 30 ítems.
* **Añade la tarjeta al índice del sitio.** Con `--con-indice`, y solo con esa
  bandera: `sitio/muestreo/index.html` sí está versionado, y una tarjeta que
  apunte a una página todavía no publicada dejaría un enlace roto en gh-pages.

PARA PUBLICAR (después de la sustentación del 28 de agosto de 2026):

    1. quitar del .gitignore las líneas del bloque del Taller 1
    2. python3 ensamblado/ensambla_taller1.py --con-indice
    3. git add -A && git commit
    4. git subtree push --prefix sitio origin gh-pages   (solo con el visto bueno)
"""
import html as html_mod
import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
PLANTILLA = RAIZ / "plantilla" / "plantilla-capitulo-muestreo.html"
DESTINO = RAIZ / "sitio" / "muestreo" / "taller-1-preparacion-parcial-1.html"
INDICE = RAIZ / "sitio" / "muestreo" / "index.html"
MODULOS = RAIZ / "ensamblado" / "modulos" / "taller1"
CODIGO = RAIZ / "ensamblado" / "codigo" / "taller1"

CAPITULOS = {
    1: "capitulo-1-encuestas-sesgos.html",
    2: "capitulo-2-diseno-mas-sistematico.html",
}
SEMANAS = {
    1: "Población, marco y unidades",
    2: "Sesgos y error total",
    3: "Muestreo probabilístico, π_k y MAS",
    4: "Tamaño de muestra y sistemático",
}
NOMBRE_TIPO = {
    "opcion": "Opción múltiple", "multiple": "Varias respuestas",
    "numerica": "Numérica", "texto": "Abierta", "grafico": "Gráfico",
}

# Cada ítem del banco declara su cabecera en cuatro líneas seguidas. Si alguien
# la reordena, el número de coincidencias deja de ser 30 y esto aborta en vez de
# publicar un mapa de repaso incompleto.
ITEM_RE = re.compile(
    r"tipo: '(\w+)',\n\s*modulo: (\d+),\n\s*semana: (\d+),\n"
    r"\s*ancla: \{ cap: (\d+), modulo: (\d+), titulo: '([^']*)', lohr: '([^']*)' \}"
)


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

    Igual que en los capítulos: el marcador vive dentro de una llamada
    `cat("\\n###BLOQUE-X###\\n")`, así que hay que recortar la cola de esa
    llamada al principio de cada cuerpo y la cabeza de la siguiente al final.
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


def mapa_de_repaso(banco_js):
    """Construye la tabla del módulo 6 a partir del `ancla` de cada ítem."""
    items = ITEM_RE.findall(banco_js)
    if len(items) != 30:
        sys.exit(f"ABORTA: el mapa de repaso encontró {len(items)} ítems, esperaba 30. "
                 "Si el banco cambió de formato, arregla ITEM_RE antes de publicar: "
                 "un mapa incompleto es peor que no tenerlo.")
    filas = []
    for n, (tipo, _mod, semana, cap, cap_mod, titulo, lohr) in enumerate(items, start=1):
        archivo = CAPITULOS[int(cap)]
        filas.append(
            f'          <tr>\n'
            f'            <td>{n}</td>\n'
            f'            <td>Semana {semana}</td>\n'
            f'            <td>{NOMBRE_TIPO[tipo]}</td>\n'
            f'            <td><a href="{archivo}">Capítulo {cap}, módulo {cap_mod}</a> · {titulo}</td>\n'
            f'            <td>Lohr {lohr}</td>\n'
            f'          </tr>'
        )
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
        '      </table>'
    )


def tarjeta_en_indice():
    """Añade al índice del sitio la tarjeta del recurso. Idempotente."""
    html = INDICE.read_text(encoding="utf-8")
    if DESTINO.name in html:
        print(f"  {INDICE.name}: ya tiene la tarjeta, no toco nada")
        return
    # La tarjeta usa el mismo marcado .chapter-card que las ocho de los
    # capitulos —inventar uno propio habria dado una tarjeta sin estilo— y va
    # detras de la ultima, que cierra la rejilla.
    ancla = '        </a>\n\n      </div>\n    </section>'
    if html.count(ancla) != 1:
        sys.exit(f"ABORTA: el cierre de la rejilla de tarjetas aparece {html.count(ancla)} veces "
                 "en el indice; no puedo colocar la del Taller 1 con seguridad")
    tarjeta = f"""        </a>

        <a class="chapter-card" href="{DESTINO.name}">
          <div class="chapter-card__top">
            <span class="chapter-card__num">T1</span>
            <span class="chapter-card__icon"><i class="fas fa-list-check" aria-hidden="true"></i></span>
          </div>
          <div class="chapter-card__body">
            <p class="chapter-card__kicker">Semanas 1–4 · preparación del Parcial 1</p>
            <h3 class="chapter-card__title">Taller 1 · Simulacro y diez errores</h3>
            <p class="chapter-card__desc">Treinta preguntas autocorregidas repartidas por las cuatro semanas del
              corte, con retroalimentación en cada opción —también en las correctas— y respuestas abiertas que se
              corrigen contra una lista de comprobación. Y diez errores de cálculo que corren sin dar error, cada uno
              con su código, su salida real y cuánto cuesta exactamente: el total expandido con n, el fpc olvidado,
              la varianza de un sistemático que miente por 117 veces. Cierra con el mapa que lleva cada pregunta a su
              módulo del capítulo 1 o 2.</p>
            <div class="chapter-card__meta">
              <span class="chapter-card__modules"><i class="fas fa-list-ul" aria-hidden="true"></i> 6 módulos · 30 preguntas</span>
              <span class="chapter-card__go">Practicar <i class="fas fa-arrow-right" aria-hidden="true"></i></span>
            </div>
          </div>
        </a>

      </div>
    </section>"""
    html = html.replace(ancla, tarjeta, 1)
    INDICE.write_text(html, encoding="utf-8")
    INDICE.chmod(0o644)
    print(f"  {INDICE.name}: tarjeta añadida")


def main():
    con_indice = "--con-indice" in sys.argv
    html = PLANTILLA.read_text(encoding="utf-8")

    if "renderPreguntaTexto" not in html:
        sys.exit("ABORTA: la plantilla no trae el tipo 'texto' de la autoevaluación. "
                 "Ejecuta antes: python3 ensamblado/retropropaga_quiz_texto.py")

    # ---------------------------------------------------------------- cabecera
    reemplazos = [
        ('content="Plantilla base para los capítulos del material de Muestreo Estadístico '
         '(Universidad El Bosque): cajas, código R/Python en pestañas, simuladores con Chart.js, '
         'autoevaluación y ejercicios guiados."',
         'content="Recurso de práctica del Taller 1 de Muestreo Estadístico (Universidad El Bosque): '
         'simulacro autocorregido de 30 preguntas sobre población y marco, sesgos y error total, '
         'muestreo aleatorio simple, tamaño de muestra y muestreo sistemático, y diez errores de '
         'cálculo que no dan error."'),
        ('<meta name="keywords" content="muestreo estadístico, muestreo probabilístico, '
         'Horvitz-Thompson, probabilidades de inclusión, estratificado, conglomerados, PPT, survey, '
         'R, Python, UnBosque">',
         '<meta name="keywords" content="simulacro, parcial, muestreo aleatorio simple, marco '
         'muestral, sesgo de selección, error total, corrección por población finita, intervalo de '
         'confianza, tamaño de muestra, muestreo sistemático, R, Python, Lohr, UnBosque">'),
        ('<title>Plantilla de capítulo — Muestreo Estadístico</title>',
         '<title>Taller 1 · Preparación del Parcial 1 — Muestreo Estadístico</title>'),
        ('<p class="text-xs text-white/70 font-medium tracking-wide" style="margin:0; text-align:left;">PLANTILLA BASE •\n'
         '              4 MÓDULOS DE DEMOSTRACIÓN • UNBOSQUE</p>',
         '<p class="text-xs text-white/70 font-medium tracking-wide" style="margin:0; text-align:left;">TALLER 1 •\n'
         '              PREPARACIÓN DEL PARCIAL 1 • SEMANAS 1–4 • UNBOSQUE</p>'),
        ('<p class="text-xs mt-1 text-white/60" style="text-align:center;">Plantilla de capítulo • UnBosque 2026\n        </p>',
         '<p class="text-xs mt-1 text-white/60" style="text-align:center;">Muestreo Estadístico • Taller 1 • UnBosque 2026-II\n        </p>'),
        ('<i class="fas fa-layer-group text-xl text-white" aria-hidden="true"></i>',
         '<i class="fas fa-list-check text-xl text-white" aria-hidden="true"></i>'),
    ]
    for viejo, nuevo in reemplazos:
        if viejo not in html:
            sys.exit(f"ABORTA: no encuentro en la plantilla el texto:\n{viejo[:110]}...")
        html = html.replace(viejo, nuevo, 1)

    # ---------------------------------------------------------------- módulos
    banco_js = (MODULOS / "simulacro.js").read_text(encoding="utf-8")
    modulos = "".join((MODULOS / f).read_text(encoding="utf-8") for f in
                      ["modulos_semanas.html", "modulo_diez_errores.html", "modulo_mapa.html"])
    modulos = modulos.replace("      ⟦MAPA⟧", mapa_de_repaso(banco_js))
    if "⟦MAPA⟧" in modulos:
        sys.exit("ABORTA: el marcador del mapa de repaso quedó sin sustituir")

    antes, despues = corta(
        html,
        "  <!-- ============================================================ -->\n  <!-- MÓDULO 1 · Cajas y tipografía",
        "\n  <script>\n    // ================================================================\n    // Configuración del capítulo",
        "los templates de los módulos")
    html = antes + modulos + despues

    # ------------------------------------------------------- courseData + datos
    datos = json.loads((RAIZ / "precalculo" / "salidas" / "taller1_recurso_datos.json")
                       .read_text(encoding="utf-8"))
    course = """    const courseData = {
      title: "Taller 1 · Preparación del Parcial 1",
      modules: [
        { id: 1, title: "Semana 1 · Población, marco y unidades", shortTitle: "Semana 1", duration: "15 min" },
        { id: 2, title: "Semana 2 · Sesgos y error total", shortTitle: "Semana 2", duration: "25 min" },
        { id: 3, title: "Semana 3 · Muestreo probabilístico, π_k y MAS", shortTitle: "Semana 3", duration: "30 min" },
        { id: 4, title: "Semana 4 · Tamaño de muestra y sistemático", shortTitle: "Semana 4", duration: "25 min" },
        { id: 5, title: "Diez errores que el código no delata", shortTitle: "Diez errores", duration: "30 min" },
        { id: 6, title: "Mapa de repaso", shortTitle: "Mapa de repaso", duration: "10 min" }
      ]
    };

    // ================================================================
    // Datos del recurso, generados por precalculo/genera_taller1_recurso.R.
    // Ninguna cifra se escribió a mano: si hay que cambiar algo se vuelve
    // a correr el script y se vuelve a ensamblar.
    // ================================================================
    const DATOS_TALLER1 = %s;
""" % json.dumps(datos, ensure_ascii=False, separators=(",", ":"))

    antes, despues = corta(
        html,
        "    const courseData = {",
        "    // ================================================================\n    // Estado y elementos del DOM",
        "courseData")
    html = antes + course + "\n" + despues

    # ------------------------------------------------------------- el simulacro
    antes, despues = corta(
        html,
        "    // ================================================================\n    // Simuladores de demostración",
        "  </script>\n\n</body>",
        "los simuladores de demostración")
    html = antes + banco_js + "\n" + despues

    # ---------------------------------------------------------------- código
    codigo = {}
    codigo.update(bloques_de(CODIGO / "cadena.R"))
    codigo.update(bloques_de(CODIGO / "cadena.py"))
    faltan = [m for m in re.findall(r'⟦([A-Za-z0-9]+)⟧', html) if m not in codigo]
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
    n_preg = len(re.findall(r"\n        tipo: '", html))
    n_cod = len(re.findall(r'class="language-', html))
    print("  escrito {}: {:,} caracteres, {} módulos, {} preguntas, {} bloques de código".format(
        DESTINO.name, len(html), html.count("<template id="), n_preg, n_cod))

    if con_indice:
        tarjeta_en_indice()
    else:
        print("  (sin tocar el índice: pásale --con-indice al publicar)")


if __name__ == "__main__":
    main()
