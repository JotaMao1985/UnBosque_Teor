#!/usr/bin/env python3
"""Retropropaga el componente .rubrica, que nace en el capítulo 8.

Regla del proyecto: un componente nuevo no está terminado hasta que está en la
plantilla y en los capítulos anteriores que lo necesiten. Ninguno de los siete
capítulos anteriores evalúa nada —la rúbrica es del proyecto integrador, que
vive en el módulo 8 del capítulo 8—, pero todos reciben el CSS y el motor para
que su conjunto de selectores siga siendo idéntico al de la plantilla, igual
que se hizo con el árbol de error y con el diagrama de diseño.

El capítulo 8 no está en la lista: su ensamblador parte de la plantilla, que ya
lleva el componente después de ejecutar este script.

Es idempotente: si el destino ya lo tiene, lo salta en vez de duplicarlo.
"""
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
COMPONENTES = RAIZ / "ensamblado" / "componentes"

PLANTILLA = RAIZ / "plantilla" / "plantilla-capitulo-muestreo.html"
CAPITULOS = [
    RAIZ / "sitio" / "muestreo" / "capitulo-1-encuestas-sesgos.html",
    RAIZ / "sitio" / "muestreo" / "capitulo-2-diseno-mas-sistematico.html",
    RAIZ / "sitio" / "muestreo" / "capitulo-3-razon-y-regresion.html",
    RAIZ / "sitio" / "muestreo" / "capitulo-4-muestreo-estratificado.html",
    RAIZ / "sitio" / "muestreo" / "capitulo-5-conglomerados.html",
    RAIZ / "sitio" / "muestreo" / "capitulo-6-probabilidades-desiguales.html",
    RAIZ / "sitio" / "muestreo" / "capitulo-7-encuestas-complejas.html",
]

ANCLA_CSS = "  </style>\n</head>"
ANCLA_MOTOR = "    // ================================================================\n    // Autoevaluación (v2)"
ANCLA_LLAMADA = "        iniciarDiagramasDiseno();\n"

# Demostración del componente, solo para la plantilla.
DEMO_MARKUP = """
      <p>Cuando lo que se evalúa es un trabajo y no una respuesta, hace falta decir <em>por
        adelantado</em> qué se va a mirar. Una <strong>rúbrica analítica</strong> lo hace con una matriz
        de criterios × niveles, pero impresa entera nadie la lee. El componente la vuelve recorrible:
        se elige un criterio y se ven sus cuatro niveles con el rango de puntos y con lo que hay que
        <em>ver</em> en el trabajo. Se declara en JavaScript (<code>RUBRICAS['id']</code>).</p>

      <div class="rubrica" data-rubrica="demo"></div>
"""

DEMO_JS = r"""    // Demostración del componente .rubrica. En un capítulo real los
    // criterios son los de la evaluación de ese capítulo; aquí bastan
    // dos para ver la mecánica y el reparto de puntos.
    RUBRICAS['demo'] = {
      titulo: 'Rúbrica de demostración: dos criterios',
      intro: 'Pulsa cada criterio para leer sus niveles; la franja inferior recoge lo que anula la entrega.',
      criterios: [
        {
          clave: 'C1',
          nombre: 'Justificación del diseño',
          puntos: 60,
          foco: 'Mide si la elección del diseño se <strong>sigue de un cálculo</strong> o solo se declara.',
          niveles: [
            { nombre: 'Sobresaliente', rango: '54–60', observa: 'Compara al menos dos diseños y <strong>cuantifica</strong> la diferencia.' },
            { nombre: 'Competente', rango: '42–53', observa: 'Justifica correctamente y menciona alternativas, sin cuantificarlas.' },
            { nombre: 'En desarrollo', rango: '30–41', observa: 'La justificación es genérica: «el estratificado es más preciso».' },
            { nombre: 'Insuficiente', rango: '0–29', observa: 'No justifica, o el diseño no corresponde a la estructura de la población.' }
          ]
        },
        {
          clave: 'C2',
          nombre: 'Reporte de incertidumbre',
          puntos: 40,
          foco: 'Mide si toda estimación viaja con su error estándar y su intervalo, y si se interpretan bien.',
          niveles: [
            { nombre: 'Sobresaliente', rango: '36–40', observa: 'Error estándar e IC correctos e interpretados <strong>en términos del problema</strong>.' },
            { nombre: 'Competente', rango: '28–35', observa: 'Error estándar e IC correctos y bien presentados.' },
            { nombre: 'En desarrollo', rango: '20–27', observa: 'Reporta incertidumbre pero la interpreta mal.' },
            { nombre: 'Insuficiente', rango: '0–19', observa: 'Presenta estimaciones puntuales sin incertidumbre.' }
          ]
        }
      ],
      anulan: [
        'El diseño no es probabilístico: no puede escribirse $\\pi_k$ para cada unidad de la población.'
      ],
      nota: 'Los niveles se declaran de mayor a menor desempeño: el orden decide el color de la banda lateral.'
    };

"""


def inserta(html, ancla, nuevo, que, ruta, antes=True):
    if ancla not in html:
        sys.exit(f"ABORTA [{ruta.name}]: no encuentro el ancla de {que}")
    return html.replace(ancla, (nuevo + ancla) if antes else (ancla + nuevo), 1)


def aplica(ruta, con_demo):
    html = ruta.read_text(encoding="utf-8")
    if ".rubrica {" in html:
        print(f"  {ruta.name}: ya lo tiene, no toco nada")
        return
    html = inserta(html, ANCLA_CSS, (COMPONENTES / "rubrica.css").read_text(encoding="utf-8"),
                   "el CSS de la rúbrica", ruta)
    html = inserta(html, ANCLA_MOTOR, (COMPONENTES / "rubrica.js").read_text(encoding="utf-8"),
                   "el motor de la rúbrica", ruta)
    html = inserta(html, ANCLA_LLAMADA, "        iniciarRubricas();\n",
                   "la llamada a iniciarRubricas", ruta, antes=False)
    if con_demo:
        html = inserta(html, '      <div class="diagrama-diseno" data-diagrama="demo"></div>\n',
                       DEMO_MARKUP, "la demostración de la rúbrica", ruta, antes=False)
        html = inserta(html, "    DIAGRAMAS_DISENO['demo'] = {", DEMO_JS,
                       "la demostración de la rúbrica en JS", ruta)
    ruta.write_text(html, encoding="utf-8")
    ruta.chmod(0o644)
    print(f"  {ruta.name}: {len(html):,} caracteres · "
          f"{html.count('.rubrica')} menciones CSS/JS, "
          f"{html.count('iniciarRubricas')} llamadas al motor")


def main():
    aplica(PLANTILLA, con_demo=True)
    for cap in CAPITULOS:
        aplica(cap, con_demo=False)


if __name__ == "__main__":
    main()
