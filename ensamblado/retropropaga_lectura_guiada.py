#!/usr/bin/env python3
"""Retropropaga el componente .lectura-guiada, que nace en el capítulo 1.

Regla del proyecto: un componente nuevo no está terminado hasta que está en la
plantilla y en los capítulos que ya se publicaron. Los siete capítulos
posteriores no llevan todavía ninguna caja de lectura guiada —el contenido se
redacta capítulo a capítulo—, pero todos reciben el CSS para que su conjunto de
selectores siga siendo idéntico al de la plantilla, igual que se hizo con el
árbol de error, el diagrama de diseño y la rúbrica.

El capítulo 1 no está en la lista: su ensamblador parte de la plantilla, que ya
lleva el componente después de ejecutar este script. Aquí es al revés que con la
rúbrica, que nació en el 8 y se propagó hacia atrás; este nace en el 1 y se
propaga hacia adelante. El motivo es el mismo en los dos casos: el archivo que
se regenera desde la plantilla no se toca a mano.

A diferencia de los tres componentes anteriores, este NO trae motor de
JavaScript. Es <details>/<summary> nativo: abre con Enter y con Espacio, entra
en el orden de tabulación y lo anuncia el lector de pantalla sin declarar ni un
aria-expanded. Por eso este script solo estampa CSS, y por eso no hay ninguna
llamada que añadir a loadModule().

Es idempotente: si el destino ya lo tiene, lo salta en vez de duplicarlo.
"""
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
COMPONENTES = RAIZ / "ensamblado" / "componentes"

PLANTILLA = RAIZ / "plantilla" / "plantilla-capitulo-muestreo.html"
CAPITULOS = [
    RAIZ / "sitio" / "muestreo" / "capitulo-2-diseno-mas-sistematico.html",
    RAIZ / "sitio" / "muestreo" / "capitulo-3-razon-y-regresion.html",
    RAIZ / "sitio" / "muestreo" / "capitulo-4-muestreo-estratificado.html",
    RAIZ / "sitio" / "muestreo" / "capitulo-5-conglomerados.html",
    RAIZ / "sitio" / "muestreo" / "capitulo-6-probabilidades-desiguales.html",
    RAIZ / "sitio" / "muestreo" / "capitulo-7-encuestas-complejas.html",
    RAIZ / "sitio" / "muestreo" / "capitulo-8-no-respuesta-ponderacion.html",
]

ANCLA_CSS = "  </style>\n</head>"

# Demostración del componente, solo para la plantilla. Va detrás de la demo de
# la rúbrica, que es la última que había.
DEMO_MARKUP = """
      <p>Un gráfico no enseña solo: el estudiante mueve el deslizador, ve que la curva sube y sigue
        leyendo sin haber extraído la idea que el gráfico existía para dar. La <strong>lectura
        guiada</strong> cierra ese hueco. Va después del simulador, <em>cerrada</em>, y dice en prosa
        qué debía verse. Cerrada a propósito: abierta sería un pie de figura que se lee antes de
        mirar, y entonces el gráfico sobra.</p>

      <details class="lectura-guiada">
        <summary><i class="fas fa-lightbulb" aria-hidden="true"></i> ¿Qué deberías llevarte de este
          gráfico?</summary>
        <div class="lectura-guiada-cuerpo">
          <p>Primero, <strong>qué mueve el control</strong>: el deslizador cambia el tamaño de muestra
            y deja fijo el sesgo, que es justo la separación que el gráfico quiere hacer visible.</p>
          <p>Después, <strong>qué se ve</strong>: la curva baja al principio y luego se aplana. No
            tiende a cero: tiende al sesgo.</p>
          <p class="lectura-guiada-clave">
            <span class="rotulo">La idea que se lleva</span>
            Aumentar <em>n</em> compra precisión, no puntería. Es el argumento que reaparece en cada
            capítulo del curso, y el componente existe para que quede dicho una vez por gráfico.
          </p>
        </div>
      </details>
"""


def inserta(html, ancla, nuevo, que, ruta, antes=True):
    if ancla not in html:
        sys.exit(f"ABORTA [{ruta.name}]: no encuentro el ancla de {que}")
    return html.replace(ancla, (nuevo + ancla) if antes else (ancla + nuevo), 1)


def aplica(ruta, con_demo):
    html = ruta.read_text(encoding="utf-8")
    if ".lectura-guiada {" in html:
        print(f"  {ruta.name}: ya lo tiene, no toco nada")
        return
    html = inserta(html, ANCLA_CSS,
                   (COMPONENTES / "lectura_guiada.css").read_text(encoding="utf-8"),
                   "el CSS de la lectura guiada", ruta)
    if con_demo:
        html = inserta(html, '      <div class="rubrica" data-rubrica="demo"></div>\n',
                       DEMO_MARKUP, "la demostración de la lectura guiada", ruta, antes=False)
    ruta.write_text(html, encoding="utf-8")
    ruta.chmod(0o644)
    # El conteo de cajas se calcula fuera del f-string: la cadena lleva comillas
    # dobles y hasta Python 3.12 no se puede escapar dentro de una expresión de
    # f-string. Esta máquina corre 3.10.
    cajas = html.count('<details class="lectura-guiada">')
    print(f"  {ruta.name}: {len(html):,} caracteres · "
          f"{html.count('.lectura-guiada')} menciones CSS, {cajas} cajas")


def main():
    aplica(PLANTILLA, con_demo=True)
    for cap in CAPITULOS:
        aplica(cap, con_demo=False)


if __name__ == "__main__":
    main()
