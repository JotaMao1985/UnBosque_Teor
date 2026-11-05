#!/usr/bin/env python3
"""Ensambla sitio/muestreo/laboratorio-ppt.html: el laboratorio πPT del cap. 6.

Sucede a `Simulador_IProb.html` (raíz de la copia principal, fuera de git), que
topaba las π en 0,96, no funcionaba sin internet y escribía «verificado» sin
calcular nada (T7.118). Aquí el laboratorio es un solo archivo autocontenido:
la plantilla `ensamblado/laboratorio_ppt/laboratorio.html` lleva cuatro
marcadores, y cada uno se sustituye una sola vez por su pieza.

    /* @@estilos@@ */     ← estilos.css
    // @@motor@@          ← motor.js    (el cálculo; lo prueban
                                         precalculo/pruebas/prueba_laboratorio_ppt.js
                                         y precalculo/verifica_laboratorio_ppt.R)
    // @@escenarios@@     ← escenarios.json, como `const ESCENARIOS = …`
    // @@interfaz@@       ← retos.js e interfaz.js

No carga nada de internet salvo las fuentes, que tienen respaldo del sistema:
sin red se ve y calcula igual (T7.99 enseñó que una dependencia de CDN deja la
página en blanco).

    python3 ensamblado/ensambla_laboratorio_ppt.py            # escribe
    python3 ensamblado/ensambla_laboratorio_ppt.py --revisar  # solo compara
"""
import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
FUENTE = RAIZ / "ensamblado" / "laboratorio_ppt"
DESTINO = RAIZ / "sitio" / "muestreo" / "laboratorio-ppt.html"

# Los únicos servidores remotos admitidos: las fuentes, que tienen respaldo del
# sistema. Cualquier otra dirección absoluta aborta el ensamblado.
PERMITIDOS = {"fonts.googleapis.com", "fonts.gstatic.com"}
# Lo que, dentro de un <script>, el analizador de HTML lee como etiqueta: cerraría
# el bloque o lo dejaría en el estado de «script escapado».
PELIGRO_JS = re.compile(r"<!--|<script|</script", re.IGNORECASE)
PELIGRO_CSS = re.compile(r"</style", re.IGNORECASE)


def lee(nombre):
    return (FUENTE / nombre).read_text(encoding="utf-8")


def ensambla():
    plantilla = lee("laboratorio.html")
    escenarios = json.loads(lee("escenarios.json"))
    # Con «<» escapado, ningún texto de un escenario puede abrir ni cerrar una
    # etiqueta dentro del <script>; U+2028 y U+2029, por los motores viejos.
    datos = (json.dumps(escenarios, ensure_ascii=False, indent=1)
             .replace("<", "\\u003c").replace("\u2028", "\\u2028").replace("\u2029", "\\u2029"))
    piezas = {
        "/* @@estilos@@ */": lee("estilos.css"),
        "// @@motor@@": lee("motor.js"),
        "// @@escenarios@@": f"const ESCENARIOS = {datos};\n",
        "// @@interfaz@@": lee("retos.js") + "\n" + lee("interfaz.js"),
    }
    for marca, pieza in piezas.items():
        veces = plantilla.count(marca)
        if veces != 1:
            sys.exit(f"ERROR: el marcador {marca!r} aparece {veces} veces en laboratorio.html; debe aparecer una.")
        for otra in piezas:
            if otra in pieza:
                sys.exit(f"ERROR: la pieza de {marca!r} contiene el marcador {otra!r}: se sustituiría dos veces.")
        peligro = PELIGRO_CSS if marca == "/* @@estilos@@ */" else PELIGRO_JS
        hallado = peligro.search(pieza)
        if hallado:
            linea = pieza.count("\n", 0, hallado.start()) + 1
            sys.exit(f"ERROR: la pieza de {marca!r} contiene {hallado.group(0)!r} (línea {linea}): "
                     "el HTML lo leería como etiqueta y cortaría el bloque.")
        plantilla = plantilla.replace(marca, pieza)
    # Ningún recurso remoto salvo las fuentes de Google (con respaldo).
    for anfitrion in sorted(set(re.findall(r"https?://([^/\"'\s)<>]+)", plantilla))):
        if anfitrion not in PERMITIDOS:
            sys.exit(f"ERROR: el laboratorio no puede depender de {anfitrion}: sin red se rompe.")
    return plantilla


def main():
    html = ensambla()
    if "--revisar" in sys.argv:
        actual = DESTINO.read_text(encoding="utf-8") if DESTINO.exists() else ""
        if actual == html:
            print(f"al día: {DESTINO.relative_to(RAIZ)} ({len(html.encode('utf-8')) // 1024} KB)")
            return
        sys.exit(f"DESACTUALIZADO: {DESTINO.relative_to(RAIZ)} no coincide con sus fuentes.")
    DESTINO.write_text(html, encoding="utf-8")
    print(f"escrito {DESTINO.relative_to(RAIZ)} ({len(html.encode('utf-8')) // 1024} KB)")


if __name__ == "__main__":
    main()
