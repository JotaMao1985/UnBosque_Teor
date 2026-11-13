#!/usr/bin/env python3
"""Dos reglas que faltaban en la plantilla: la cita en redonda y el título del eje vertical.

POR QUÉ EXISTE. Las dos salieron de la exploración del capítulo 1 (plan de mejora
del cap. 1, 2026-11-10) y Javier decidió arreglarlas «en la plantilla, para
todos», no página a página:

  1. **La cita, en redonda.** El navegador pone `<cite>` en cursiva, y dentro de
     un párrafo eso se lee como énfasis, no como fuente. Mientras la hoja no
     dijera otra cosa, `precalculo/genera_referencias.py` tenía que escribir
     `style="font-style:normal"` en cada cita. Ahora lo dice la hoja una vez y
     el generador deja de escribirlo.
  2. **El título del eje vertical.** `crearGraficoBarras` admitía `tituloX` y no
     su pareja, así que cuatro gráficas del capítulo 1 muestran barras sin decir
     en qué están medidas. Ahora acepta `tituloY`, con el mismo tipo de letra y
     la misma regla que el eje x: si no se pasa, no se dibuja nada.

QUÉ NO TOCA. Ninguna gráfica: que una pase a declarar su `tituloY` es trabajo de
la tanda de gráficas (fase 5 del plan), no de este guion. Aquí solo se abre la
puerta. Y ninguna cita: el texto visible lo escribe el generador.

DÓNDE. En la plantilla y en las páginas publicadas que llevan el bloque de
estilos del capítulo. Las dos portadas, que no lo llevan y se editan a mano,
reciben solo la regla de la cita, al final de su hoja: no tienen ninguna
gráfica, pero sí citarán. El laboratorio πPT no sale de esta plantilla sino de
`ensamblado/laboratorio_ppt/`, así que ahí se parchea su `estilos.css` y la
página se vuelve a ensamblar; parchear la publicada no serviría, porque el
siguiente ensamblado la devolvería a como estaba.

    python3 ensamblado/retropropaga_cita_y_eje_y.py --seco    # solo comprueba
    python3 ensamblado/retropropaga_cita_y_eje_y.py

Es idempotente: si un archivo ya está parcheado, lo dice y sigue. Después,
reensamblar las páginas tiene que dar byte a byte lo mismo que este parche.
"""
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
PLANTILLA = RAIZ / "plantilla" / "plantilla-capitulo-muestreo.html"
MUESTREO = RAIZ / "sitio" / "muestreo"
ARCHIVOS = [PLANTILLA, RAIZ / "sitio" / "index.html"] + sorted(MUESTREO.glob("capitulo-*.html")) + [
    MUESTREO / "index.html",
    RAIZ / "ensamblado" / "laboratorio_ppt" / "estilos.css",
    MUESTREO / "preparcial-corte-1.html",
    MUESTREO / "proyecto-integrador-corte-iii.html",
]

# ---------------------------------------------------------------- la cita
MARCA_CITA = "    cite.cita {"
REGLA_CITA = """    /* Una cita del texto va en redonda. El navegador pone <cite> en cursiva, y
       dentro de un párrafo eso se lee como énfasis y no como fuente. Lo dice la
       hoja una vez para que el generador de citas no lo escriba en cada una. */
    cite.cita {
      font-style: normal;
    }

"""
# En una página con el bloque de estilos del capítulo, la regla va junto a la
# otra regla de <cite>, que es donde un lector la buscará; en las demás, al
# final de la hoja.
ANCLA_CITA_A = "    blockquote cite {"
ANCLA_CITA_B = "  </style>"
# Una hoja suelta (el laboratorio) no tiene ni lo uno ni lo otro: la regla va al
# final, sin la sangría del CSS embebido en el HTML.
REGLA_CITA_SUELTA = """
/* Una cita del texto va en redonda. El navegador pone <cite> en cursiva, y
   dentro de un párrafo eso se lee como énfasis y no como fuente. */
cite.cita {
  font-style: normal;
}
"""

# ------------------------------------------------------- el eje vertical
# La marca es el comentario que se inserta, no `opciones.tituloY`: eso ya lo usa
# crearGraficoXY, que sí titulaba su eje vertical, y daría el parche por hecho.
MARCA_EJE = "// Sin título, una barra no dice en qué está medida."
ANCLA_EJE = """            y: {
              suggestedMin: opciones.min !== undefined ? opciones.min : -1,
              suggestedMax: opciones.max !== undefined ? opciones.max : 1,
              ticks: { font: { family: 'Fira Code', size: 11 } },"""
EJE_NUEVO = """            y: {
              suggestedMin: opciones.min !== undefined ? opciones.min : -1,
              suggestedMax: opciones.max !== undefined ? opciones.max : 1,
              // Sin título, una barra no dice en qué está medida. Misma regla
              // que el eje x: sin `tituloY`, no se dibuja.
              title: {
                display: !!opciones.tituloY,
                text: opciones.tituloY,
                font: { family: 'Montserrat', size: 11 }
              },
              ticks: { font: { family: 'Fira Code', size: 11 } },"""

# El eje solo se parchea donde está la función; las páginas sin gráficas no la
# llevan. Si la función está y el ancla no casa, es un error y se aborta.
REQUISITO_EJE = "function crearGraficoBarras"


def parchea(texto: str, nombre: str, fallos: list[str]) -> tuple[str, int, int]:
    """Aplica los dos parches. Devuelve (texto, aplicados, ya_estaban)."""
    aplicados = ya = 0

    if MARCA_CITA in texto or MARCA_CITA.strip() in texto:
        ya += 1
    elif nombre.endswith(".css"):
        texto = texto.rstrip("\n") + "\n" + REGLA_CITA_SUELTA
        aplicados += 1
    else:
        ancla = ANCLA_CITA_A if texto.count(ANCLA_CITA_A) == 1 else ANCLA_CITA_B
        if texto.count(ancla) != 1:
            fallos.append(f"{nombre}: el ancla de la cita aparece {texto.count(ancla)} veces, no 1")
        else:
            texto = texto.replace(ancla, REGLA_CITA + ancla, 1)
            aplicados += 1

    if MARCA_EJE in texto:
        ya += 1
    elif REQUISITO_EJE not in texto:
        pass  # una página sin gráficas no necesita el eje
    elif texto.count(ANCLA_EJE) != 1:
        fallos.append(f"{nombre}: el ancla del eje aparece {texto.count(ANCLA_EJE)} veces, no 1")
    else:
        texto = texto.replace(ANCLA_EJE, EJE_NUEVO, 1)
        aplicados += 1

    return texto, aplicados, ya


def main() -> int:
    seco = "--seco" in sys.argv
    fallos: list[str] = []
    for f in ARCHIVOS:
        if not f.exists():
            fallos.append(f"{f.name}: no existe")
            continue
        texto = f.read_text(encoding="utf-8")
        antes = len(fallos)
        nuevo, aplicados, ya = parchea(texto, f.name, fallos)
        nombre = f"{f.parent.name}/{f.name}" if f.parent.name != "plantilla" else f.name
        estado = "ya estaba" if not aplicados else f"{aplicados} parche(s)"
        print(f"  {nombre:<48} {estado}" + (f" ({ya} ya hecho[s])" if ya and aplicados else ""))
        # Un archivo con un ancla que no casa no se escribe a medias.
        if not seco and aplicados and len(fallos) == antes:
            f.write_text(nuevo, encoding="utf-8")
            f.chmod(0o644)
    if fallos:
        print("\n" + "\n".join(f"ABORTA: {x}" for x in fallos), file=sys.stderr)
        return 1
    if seco:
        print("\n(en seco: no se escribió nada)")
    else:
        print("\nAhora: python3 ensamblado/ensambla_laboratorio_ppt.py "
              "(su página sale de estilos.css, no de la plantilla)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
