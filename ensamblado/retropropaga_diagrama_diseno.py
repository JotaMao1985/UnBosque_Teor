#!/usr/bin/env python3
"""Retropropaga el componente .diagrama-diseno, que nace en el capítulo 4.

Regla del proyecto: un componente nuevo no está terminado hasta que está en la
plantilla y en los capítulos anteriores que lo necesiten. Los capítulos 1 a 3
no muestran ningún diagrama —sus diseños tienen una sola etapa—, pero sí
reciben el CSS y el motor, para que su conjunto de selectores siga siendo
idéntico al de la plantilla, igual que se hizo con el árbol de error.

El capítulo 4 no está en la lista: se reescribe en esta misma fase y su
ensamblador parte del 3, que ya lleva el componente.

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
]

ANCLA_CSS = "  </style>\n</head>"
ANCLA_MOTOR = "    // ================================================================\n    // Autoevaluación (v2)"
ANCLA_LLAMADA = "        iniciarArbolesError();\n"

# Demostración del componente, solo para la plantilla.
DEMO_MARKUP = """
      <p>Cuando el diseño tiene varias etapas, ni el árbol ni el ciclo lo cuentan bien: lo que hay que
        ver es la <strong>tubería</strong> — qué unidad se muestrea en cada etapa, qué probabilidad
        aporta y qué factor de peso deja. Se declara en JavaScript
        (<code>DIAGRAMAS_DISENO['id']</code>) y la franja final da la lección completa: el peso final
        es el producto de los pesos de las etapas.</p>

      <div class="diagrama-diseno" data-diagrama="demo"></div>
"""

DEMO_JS = r"""    // Demostración del componente .diagrama-diseno. En un capítulo real
    // las etapas son las del diseño de ese capítulo; aquí basta un diseño
    // de dos etapas genérico para ver la mecánica.
    DIAGRAMAS_DISENO['demo'] = {
      titulo: 'Diagrama de demostración: un diseño en dos etapas',
      intro: 'Pulsa cada etapa para leer su ficha; la franja inferior acumula el diseño completo.',
      nota: 'Los campos <code>pi</code> y <code>peso</code> son los que hacen didáctico al ' +
        'componente: cada etapa declara la probabilidad que aporta y el factor de peso que deja.',
      etapas: [
        {
          etiqueta: 'Población',
          unidad: '$N_I$ conglomerados',
          icono: 'fa-globe-americas',
          resumen: 'El marco agrupa las unidades finales en conglomerados; todavía no se muestrea nada.',
          cifras: [{ k: 'Conglomerados', v: '$N_I$' }, { k: 'Unidades', v: '$N$' }]
        },
        {
          etiqueta: 'Etapa 1: UPM',
          unidad: 'MAS de $n_I$ conglomerados',
          icono: 'fa-th-large',
          resumen: 'Se sortean conglomerados completos: son las unidades primarias de muestreo.',
          pi: '\\pi_{Ii} = n_I/N_I',
          peso: 'N_I/n_I',
          ejemplo: 'sortear escuelas antes de encuestar a nadie.'
        },
        {
          etiqueta: 'Etapa 2: USM',
          unidad: 'MAS de $m_i$ unidades',
          icono: 'fa-user-check',
          resumen: 'Dentro de cada conglomerado sorteado se muestrean las unidades finales.',
          pi: '\\pi_{k|i} = m_i/M_i',
          peso: 'M_i/m_i',
          ejemplo: 'sortear estudiantes dentro de cada escuela elegida.'
        }
      ],
      acumulado: {
        formula: '\\pi_k = \\pi_{Ii}\\,\\pi_{k|i} \\qquad w_k = \\frac{N_I}{n_I}\\cdot\\frac{M_i}{m_i}',
        texto: 'La probabilidad de inclusión final es el producto de las etapas, y el peso final ' +
          'el producto de los pesos. Ese producto es lo que el estudiante ve romperse cuando ' +
          'ignora una etapa del diseño.'
      }
    };

"""


def inserta(html, ancla, nuevo, que, ruta, antes=True):
    if ancla not in html:
        sys.exit(f"ABORTA [{ruta.name}]: no encuentro el ancla de {que}")
    return html.replace(ancla, (nuevo + ancla) if antes else (ancla + nuevo), 1)


def aplica(ruta, con_demo):
    html = ruta.read_text(encoding="utf-8")
    if ".diagrama-diseno {" in html:
        print(f"  {ruta.name}: ya lo tiene, no toco nada")
        return
    html = inserta(html, ANCLA_CSS, (COMPONENTES / "diagrama_diseno.css").read_text(encoding="utf-8"),
                   "el CSS del diagrama", ruta)
    html = inserta(html, ANCLA_MOTOR, (COMPONENTES / "diagrama_diseno.js").read_text(encoding="utf-8"),
                   "el motor del diagrama", ruta)
    html = inserta(html, ANCLA_LLAMADA, "        iniciarDiagramasDiseno();\n",
                   "la llamada a iniciarDiagramasDiseno", ruta, antes=False)
    if con_demo:
        html = inserta(html, '      <div class="arbol-error" data-arbol="demo"></div>\n',
                       DEMO_MARKUP, "la demostración del diagrama", ruta, antes=False)
        html = inserta(html, "    ARBOLES_ERROR['demo'] = {", DEMO_JS, "la demostración del diagrama en JS", ruta)
    ruta.write_text(html, encoding="utf-8")
    print(f"  {ruta.name}: {len(html):,} caracteres · "
          f"{html.count('.diagrama-diseno')} menciones CSS/JS, "
          f"{html.count('iniciarDiagramasDiseno')} llamadas al motor")


def main():
    aplica(PLANTILLA, con_demo=True)
    for cap in CAPITULOS:
        aplica(cap, con_demo=False)


if __name__ == "__main__":
    main()
