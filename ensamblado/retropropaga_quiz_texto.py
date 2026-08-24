#!/usr/bin/env python3
"""Instala el tipo 'texto' de la autoevaluación: respuesta abierta autocorregida.

Nace en el simulacro del Taller 1 (T4.1), que necesita cuatro preguntas abiertas
porque el Parcial 1 se juega buena parte de la nota en ellas. El motor heredado
de los capítulos solo entendía cuatro tipos: `opcion`, `multiple`, `numerica` y
`grafico`.

Regla del proyecto: un componente nuevo no está terminado hasta que está en la
plantilla y en los capítulos anteriores que lo necesiten. Aquí ninguno de los
ocho lo necesita —ninguno tiene preguntas abiertas—, pero **todos lo reciben**,
por dos razones que no son de estilo:

1. Cada `ensambla_capN.py` construye su capítulo **desde la plantilla**. En
   cuanto la plantilla lleva el componente, los ocho capítulos publicados dejan
   de reproducirse byte a byte si no lo llevan también. Es la deriva contra la
   que existe la regla de oro del README.
2. El protocolo de verificación compara el conjunto de selectores CSS de cada
   capítulo contra el de la plantilla. Una clase que esté en una y no en los
   otros convierte esa comprobación en ruido, y el ruido es donde se esconden
   los defectos de verdad.

Son cinco inserciones, todas sobre anclas comprobadas como únicas en los nueve
archivos: el CSS, la función del motor, la entrada de `NOMBRE_TIPO`, la rama en
`renderAutoevaluacion` y el encabezado de `cerrar()` —una pregunta que corrige
el propio estudiante no puede recibir un «No es esa» del motor—.

Es idempotente: si el destino ya lo tiene, lo salta en vez de duplicarlo.

    python3 ensamblado/retropropaga_quiz_texto.py

Después: `node --check` sobre el motor de cada archivo y reensamblar los ocho
capítulos para comprobar que siguen saliendo byte a byte de sus fuentes.
"""
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
COMPONENTES = RAIZ / "ensamblado" / "componentes"

PLANTILLA = RAIZ / "plantilla" / "plantilla-capitulo-muestreo.html"
CAPITULOS = sorted((RAIZ / "sitio" / "muestreo").glob("capitulo-*.html"))

ANCLA_CSS = "  </style>\n</head>"
ANCLA_MOTOR = "    // ================================================================\n    // Autoevaluación (v2)"

# NOMBRE_TIPO: la etiqueta que se pinta a la derecha del enunciado.
VIEJO_NOMBRE = "      grafico: 'Lectura de gráfico'\n    };"
NUEVO_NOMBRE = "      grafico: 'Lectura de gráfico',\n      texto: 'Respuesta abierta'\n    };"

# La rama, justo antes de la de 'opcion'/'grafico', que es el `else` final.
ANCLA_RAMA = (
    "        } else {\n"
    "          // ---- Una sola respuesta ('opcion' y 'grafico') ------------"
)
NUEVA_RAMA = """        } else if (tipo === 'texto') {
          // ---- Respuesta abierta con autocorrección guiada -----------
          renderPreguntaTexto(p, i, bloque, pista,
            { estado: estado, cerrar: cerrar, mostrarPista: mostrarPista, katexEn: katexEn });

"""

# El encabezado de la retroalimentación. 'Correcto' y 'No es esa' presuponen que
# el motor comprobó algo; en una pregunta abierta quien comprueba es el
# estudiante, y atribuirse esa comprobación sería justo lo que el componente
# intenta evitar.
VIEJO_ENCABEZADO = """        const encabezado = acierto
          ? (estado[i].intentos === 1 ? '<strong>Correcto.</strong> ' : '<strong>Correcto, en el segundo intento.</strong> ')
          : '<strong>No es esa.</strong> ';"""
NUEVO_ENCABEZADO = """        const encabezado = preguntas[i].tipo === 'texto'
          // La abierta la corrige el estudiante contra la lista de
          // comprobación: el motor no ha verificado nada y no puede decir
          // "Correcto" ni "No es esa" sin atribuirse un juicio que no hizo.
          ? (acierto ? '<strong>Los tres puntos.</strong> ' : '<strong>Anotado.</strong> ')
          : acierto
            ? (estado[i].intentos === 1 ? '<strong>Correcto.</strong> ' : '<strong>Correcto, en el segundo intento.</strong> ')
            : '<strong>No es esa.</strong> ';"""

# Demostración del tipo, solo para la plantilla: su quiz de demostración tiene
# un ejemplo de cada tipo, y así el conjunto de selectores queda ejercitado.
ANCLA_DEMO = """        retroFallo: 'Las correctas son las dos primeras. Ajustar un ARIMA en el navegador no es viable, y <code>fetch</code> rompe la regla del archivo autocontenido: los datos van incrustados.'
      }"""
DEMO = """,
      {
        tipo: 'texto',
        modulo: 2,
        pregunta: 'Respuesta abierta. En dos frases: ¿por qué el material incrusta los datos en el archivo en vez de descargarlos con <code>fetch</code>?',
        pista: 'Piensa en dónde acaba el archivo cuando un estudiante se lo guarda para estudiar sin conexión.',
        respuestaModelo: 'Porque el capítulo tiene que funcionar como un archivo autocontenido: descargado, copiado a un pendrive o abierto sin conexión, sigue entero. Un <code>fetch</code> lo ata a un servidor y a una ruta que pueden desaparecer, y convierte cada gráfico en un fallo silencioso el día que fallen.',
        comprobacion: [
          'Dije que el archivo tiene que funcionar solo, sin depender de un servidor.',
          'Mencioné qué se rompe si la descarga falla, no solo que «es mejor así».',
          'No confundí incrustar los datos con precalcularlos en R: son dos decisiones distintas.'
        ]
      }"""


def inserta(html, ancla, nuevo, que, ruta, antes=True):
    if ancla not in html:
        sys.exit(f"ABORTA [{ruta.name}]: no encuentro el ancla de {que}")
    if html.count(ancla) != 1:
        sys.exit(f"ABORTA [{ruta.name}]: el ancla de {que} aparece {html.count(ancla)} veces")
    return html.replace(ancla, (nuevo + ancla) if antes else (ancla + nuevo), 1)


def sustituye(html, viejo, nuevo, que, ruta):
    if html.count(viejo) != 1:
        sys.exit(f"ABORTA [{ruta.name}]: {que} aparece {html.count(viejo)} veces, esperaba 1")
    return html.replace(viejo, nuevo, 1)


def aplica(ruta, con_demo):
    html = ruta.read_text(encoding="utf-8")
    if "renderPreguntaTexto" in html:
        print(f"  {ruta.name}: ya lo tiene, no toco nada")
        return
    html = inserta(html, ANCLA_CSS, (COMPONENTES / "quiz_texto.css").read_text(encoding="utf-8"),
                   "el CSS de la respuesta abierta", ruta)
    html = inserta(html, ANCLA_MOTOR, (COMPONENTES / "quiz_texto.js").read_text(encoding="utf-8"),
                   "el motor de la respuesta abierta", ruta)
    html = sustituye(html, VIEJO_NOMBRE, NUEVO_NOMBRE, "la tabla NOMBRE_TIPO", ruta)
    html = inserta(html, ANCLA_RAMA, NUEVA_RAMA, "la rama de 'texto'", ruta)
    html = sustituye(html, VIEJO_ENCABEZADO, NUEVO_ENCABEZADO, "el encabezado de cerrar()", ruta)
    if con_demo:
        html = inserta(html, ANCLA_DEMO, DEMO, "la demostración del tipo 'texto'", ruta, antes=False)
    ruta.write_text(html, encoding="utf-8")
    ruta.chmod(0o644)
    # Ojo con contar "tipo: 'texto'" a secas: las tablas ordenables declaran
    # sus columnas igual (`{ clave: 'diseno', titulo: 'Diseño', tipo: 'texto' }`)
    # y el conteo sale inflado. Una pregunta lo declara en su propia línea.
    abiertas = html.count("\n        tipo: 'texto',")
    print(f"  {ruta.name}: {len(html):,} caracteres · "
          f"{html.count('quiz-abierta')} menciones de .quiz-abierta, "
          f"{html.count('renderPreguntaTexto')} del motor, "
          f"{abiertas} preguntas abiertas")


def main():
    print("Plantilla:")
    aplica(PLANTILLA, con_demo=True)
    print(f"Capítulos publicados ({len(CAPITULOS)}):")
    for cap in CAPITULOS:
        aplica(cap, con_demo=False)
    print("\nAhora: node --check sobre el motor de cada archivo y reensamblar "
          "los ocho capítulos (README de ensamblado, «Regla de oro»).")


if __name__ == "__main__":
    main()
