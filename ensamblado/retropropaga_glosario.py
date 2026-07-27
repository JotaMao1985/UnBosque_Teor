#!/usr/bin/env python3
"""Retropropaga a la plantilla lo que nació en el capítulo 2.

Regla del proyecto: un componente nuevo no está terminado hasta que está en la
plantilla. Aquí entra el glosario de notación (CSS + motor + demostración) y
los tres ayudantes de gráficos con eje x numérico que hicieron falta para los
histogramas y las curvas del capítulo.
"""
import sys
from pathlib import Path

# Se ejecuta desde la raíz del repositorio (la carpeta Muestreo/).
RAIZ = Path(__file__).resolve().parent.parent
PLANTILLA = RAIZ / "plantilla" / "plantilla-capitulo-muestreo.html"

DEMO_MARKUP = """
      <p>Cuando un curso convive con dos fuentes que usan notaciones distintas, la tabla de traducción
        va en un <strong>glosario de notación</strong> plegable. Se declara en JavaScript
        (<code>GLOSARIOS['id']</code>) y se repite igual en todos los capítulos, que es lo que hace
        que el estudiante no tenga que reaprenderla.</p>

      <div class="glosario-notacion" data-glosario="demo"></div>
"""

DEMO_JS = """
    // Demostración del componente .glosario-notacion. En un capítulo real las
    // filas son las de ese capítulo, y la tabla se repite en todos.
    GLOSARIOS['demo'] = {
      titulo: 'Notación: este material ↔ Lohr ↔ Gutiérrez',
      nota: 'Los campos de notación se escriben en LaTeX sin delimitadores: el componente los ' +
        'envuelve en $…$ y KaTeX los resuelve con el resto del módulo.',
      filas: [
        { concepto: 'Probabilidad de inclusión', aqui: '\\\\pi_k', lohr: '\\\\pi_i', gutierrez: '\\\\pi_k', r: 'probs = ~pi' },
        { concepto: 'Peso de diseño', aqui: 'd_k = 1/\\\\pi_k', lohr: 'w_i', gutierrez: 'd_k', r: 'weights = ~w' },
        { concepto: 'Estimador de Horvitz–Thompson', aqui: '\\\\hat{t}_\\\\pi', lohr: '\\\\hat{t}_{HT}', gutierrez: '\\\\hat{t}_{y,\\\\pi}', r: 'svytotal()' }
      ]
    };
"""

AYUDANTES_XY = '''
    // --- Gráficos con eje x numérico (nacieron en el capítulo 2) ------
    // Los correlogramas y las barras usan un eje de categorías; para un
    // histograma con una recta vertical en un valor concreto, o para una
    // curva en la que el eje x es una cantidad, hace falta un eje lineal.
    function crearGraficoXY(canvas, datasets, opciones = {}) {
      return new Chart(canvas, {
        data: { datasets: datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          interaction: { mode: 'nearest', intersect: false },
          plugins: {
            legend: {
              labels: {
                font: { family: 'Montserrat', size: 12 }, boxWidth: 24,
                filter: item => item.text !== ''
              }
            },
            tooltip: {
              backgroundColor: '#012820',
              titleFont: { family: 'Montserrat' },
              bodyFont: { family: 'Fira Code' },
              filter: item => item.dataset.label !== ''
            }
          },
          scales: {
            x: {
              type: 'linear',
              min: opciones.xMin, max: opciones.xMax,
              title: {
                display: !!opciones.tituloX, text: opciones.tituloX,
                font: { family: 'Montserrat', size: 11 }
              },
              ticks: { font: { family: 'Fira Code', size: 10 }, maxRotation: 0, maxTicksLimit: 10 },
              grid: { display: false }
            },
            y: {
              beginAtZero: true,
              title: {
                display: !!opciones.tituloY, text: opciones.tituloY,
                font: { family: 'Montserrat', size: 11 }
              },
              ticks: { font: { family: 'Fira Code', size: 11 } },
              grid: { color: 'rgba(148, 163, 184, 0.2)' }
            }
          }
        }
      });
    }

    // Un histograma precalculado en R ({centros, conteo}), como área escalonada
    function serieHistograma(hist, etiqueta, color, escala = 1) {
      return {
        type: 'line', label: etiqueta, stepped: 'middle', fill: true,
        data: hist.centros.map((c, i) => ({ x: c * escala, y: hist.conteo[i] })),
        borderColor: color, backgroundColor: color + '2e',
        borderWidth: 1.4, pointRadius: 0
      };
    }

    // Recta vertical de referencia (media poblacional, valor verdadero…)
    function serieVertical(x, alto, etiqueta, color) {
      return {
        type: 'line', label: etiqueta,
        data: [{ x: x, y: 0 }, { x: x, y: alto }],
        borderColor: color, borderDash: [6, 4], borderWidth: 2,
        pointRadius: 0, fill: false
      };
    }

'''


def sustituir(html, ancla, nuevo, que, antes=True):
    if ancla not in html:
        sys.exit(f"ABORTA: no encuentro el ancla de {que}")
    return html.replace(ancla, (nuevo + ancla) if antes else (ancla + nuevo), 1)


def main():
    html = PLANTILLA.read_text(encoding="utf-8")
    if "glosario-notacion" in html:
        sys.exit("ABORTA: la plantilla ya tiene el glosario; no lo duplico")

    # CSS
    html = sustituir(html, "  </style>\n</head>",
                     (RAIZ / "ensamblado" / "componentes" / "glosario.css").read_text(encoding="utf-8"), "el CSS del glosario")

    # Motor del glosario + llamada en loadModule
    html = sustituir(html,
                     "    // ================================================================\n    // Autoevaluación (v2)",
                     (RAIZ / "ensamblado" / "componentes" / "glosario.js").read_text(encoding="utf-8"), "el motor del glosario")
    html = sustituir(html, "        iniciarTablasRanking();\n",
                     "        iniciarGlosarios();\n", "la llamada a iniciarGlosarios", antes=False)

    # Ayudantes de gráficos con eje x numérico
    html = sustituir(html,
                     "    // --- Ayudantes propios de MUESTREO ---",
                     AYUDANTES_XY, "los ayudantes de gráficos XY")

    # Demostración del componente, en el módulo 1 (la galería de cajas)
    html = sustituir(html, "      <table>\n        <caption class=\"sr-only\">Ejemplo de tabla</caption>",
                     DEMO_MARKUP, "la demostración del glosario en el módulo 1")
    html = sustituir(html, "    AUTOEVALUACIONES['demo'] = [",
                     DEMO_JS + "\n", "la demostración del glosario en JS")

    PLANTILLA.write_text(html, encoding="utf-8")
    print(f"  plantilla actualizada: {len(html):,} caracteres")
    for marca in ["glosario-notacion", "iniciarGlosarios", "GLOSARIOS['demo']",
                  "crearGraficoXY", "serieHistograma", "serieVertical"]:
        print(f"    {marca}: {html.count(marca)} apariciones")


if __name__ == "__main__":
    main()
