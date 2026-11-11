"""El pie de referencias de un capítulo: solo lo que el capítulo cita.

El pie «Referencias Bibliográficas» sale de la plantilla y es el mismo en todas las páginas.
Cuando un capítulo ya tiene todas sus citas marcadas, `precalculo/genera_referencias.py --pie
capN` escribe `ensamblado/modulos/capN/pie_referencias.html`, y el ensamblador de ese capítulo
llama a `aplica()` para poner ese pie en lugar de la lista de la plantilla.

Mientras ese archivo no exista, `aplica()` devuelve la página tal cual: un capítulo sin migrar
se ensambla byte a byte como antes.
"""
import sys

NOMBRE = "pie_referencias.html"
ABRE = '      <ul class="space-y-3 text-white/90 text-sm">\n'
CIERRA = "      </ul>\n"


def aplica(html, carpeta_de_modulos):
    """Sustituye la lista del pie de la plantilla por la generada para este capítulo, si la hay."""
    ruta = carpeta_de_modulos / NOMBRE
    if not ruta.exists():
        return html
    pie = html.find("<footer")
    i = html.find(ABRE, pie)
    j = html.find(CIERRA, i)
    if pie < 0 or i < 0 or j < 0:
        sys.exit("ABORTA: no encuentro en la plantilla la lista del pie de referencias")
    return html[:i] + ruta.read_text(encoding="utf-8") + html[j + len(CIERRA):]
