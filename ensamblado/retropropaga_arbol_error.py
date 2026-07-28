#!/usr/bin/env python3
"""Retropropaga el componente .arbol-error, que nace en el capítulo 1.

Regla del proyecto: un componente nuevo no está terminado hasta que está en la
plantilla y en los capítulos anteriores que lo necesiten. El capítulo 2 no
muestra ningún árbol —no habla del error total—, pero sí recibe el CSS y el
motor, para que su conjunto de selectores siga siendo idéntico al de la
plantilla. Esa es exactamente la deuda que dejó el glosario en la fase 1 y que
no conviene repetir.

Es idempotente: si el destino ya lo tiene, lo salta en vez de duplicarlo.
"""
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
COMPONENTES = RAIZ / "ensamblado" / "componentes"

PLANTILLA = RAIZ / "plantilla" / "plantilla-capitulo-muestreo.html"
CAPITULOS = [RAIZ / "sitio" / "muestreo" / "capitulo-2-diseno-mas-sistematico.html"]

ANCLA_CSS = "  </style>\n</head>"
ANCLA_MOTOR = "    // ================================================================\n    // Autoevaluación (v2)"
ANCLA_LLAMADA = "        iniciarGlosarios();\n"

# Demostración del componente, solo para la plantilla.
DEMO_MARKUP = """
      <p>Una taxonomía no es una secuencia, así que el componente <code>.ciclo</code> no le sirve: para
        un desglose jerárquico está el <strong>árbol</strong> plegable. Se declara en JavaScript
        (<code>ARBOLES_ERROR['id']</code>) y cada nodo puede llevar su resumen, el efecto que produce y
        el capítulo donde se trata.</p>

      <div class="arbol-error" data-arbol="demo"></div>
"""

DEMO_JS = """    // Demostración del componente .arbol-error. En un capítulo real los nodos
    // son los de ese capítulo; aquí basta con dos niveles para ver la mecánica.
    ARBOLES_ERROR['demo'] = {
      titulo: 'Árbol de demostración',
      intro: 'Pulsa una rama para leer su ficha; el galón de la izquierda la pliega.',
      nota: 'Los campos <code>efecto</code> y <code>nAyuda</code> son los que hacen didáctico al ' +
        'componente: dicen si el error sesga o solo dispersa, y si aumentar $n$ sirve de algo.',
      raiz: {
        etiqueta: 'Nodo raíz',
        resumen: 'El nodo raíz se selecciona solo al cargar el módulo.',
        hijos: [
          {
            etiqueta: 'Rama con efecto de varianza',
            resumen: 'Un error que solo dispersa la estimación alrededor del valor correcto.',
            efecto: 'varianza', nAyuda: true, donde: 'Capítulo 2',
            ejemplo: 'la variabilidad de muestreo de $\\\\bar{y}$ bajo MAS.'
          },
          {
            etiqueta: 'Rama con efecto de sesgo',
            resumen: 'Un error que desplaza la estimación y no se corrige con más datos.',
            efecto: 'sesgo', nAyuda: false, donde: 'Capítulo 8',
            ejemplo: 'la no respuesta correlacionada con la variable de interés.'
          }
        ]
      }
    };

"""


def inserta(html, ancla, nuevo, que, ruta, antes=True):
    if ancla not in html:
        sys.exit(f"ABORTA [{ruta.name}]: no encuentro el ancla de {que}")
    return html.replace(ancla, (nuevo + ancla) if antes else (ancla + nuevo), 1)


def aplica(ruta, con_demo):
    html = ruta.read_text(encoding="utf-8")
    if ".arbol-error {" in html:
        print(f"  {ruta.name}: ya lo tiene, no toco nada")
        return
    html = inserta(html, ANCLA_CSS, (COMPONENTES / "arbol_error.css").read_text(encoding="utf-8"),
                   "el CSS del árbol", ruta)
    html = inserta(html, ANCLA_MOTOR, (COMPONENTES / "arbol_error.js").read_text(encoding="utf-8"),
                   "el motor del árbol", ruta)
    html = inserta(html, ANCLA_LLAMADA, "        iniciarArbolesError();\n",
                   "la llamada a iniciarArbolesError", ruta, antes=False)
    if con_demo:
        html = inserta(html, '      <div class="glosario-notacion" data-glosario="demo"></div>\n',
                       DEMO_MARKUP, "la demostración del árbol", ruta, antes=False)
        html = inserta(html, "    GLOSARIOS['demo'] = {", DEMO_JS, "la demostración del árbol en JS", ruta)
    ruta.write_text(html, encoding="utf-8")
    print(f"  {ruta.name}: {len(html):,} caracteres · "
          f"{html.count('.arbol-error')} menciones CSS/JS, "
          f"{html.count('iniciarArbolesError')} llamadas al motor")


def main():
    aplica(PLANTILLA, con_demo=True)
    for cap in CAPITULOS:
        aplica(cap, con_demo=False)


if __name__ == "__main__":
    main()
