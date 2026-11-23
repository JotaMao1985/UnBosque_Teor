#!/usr/bin/env python3
"""Cinco defectos de la plantilla que encontró la auditoría de cierre del cap. 1.

POR QUÉ EXISTE. La auditoría de cierre del capítulo 1 (Fase 7, 22 de noviembre
de 2026; informe PLAN_Auditoria_Cap1_Cierre.md, B1-B5) recorrió el capítulo a
375 px reales y encontró cinco defectos que no son del capítulo sino de la
plantilla, y que por eso están en todas las páginas que la usan:

  B1  `h3 { display: flex }` convierte cada elemento en línea del título
      (<code>, <em>) en un ítem flex: a 375 px «Sesgo contra varianza, sobre
      agpop» se partía en dos columnas, con «agpop» suelto a la derecha. El
      título pasa a bloque y la barra naranja, a un `::before` en línea.
  B2  A 375 px, cuatro rellenos anidados (módulo, .exercise, .ejercicio-guiado,
      .ejercicio-panel) dejaban el código de las soluciones en 194 px, y la
      cabecera del bloque de código recortaba su botón. En el móvil se
      adelgazan los rellenos y la cabecera puede partirse en dos líneas.
  B3  La pista «Todavía no» del quiz seguía a la vista junto a «Correcto, en
      el segundo intento» o «No es esa»: al cerrar la pregunta se oculta.
  B4  El valor de los deslizadores salía con punto decimal y guion ASCII
      («0.72», «-10.0») junto a lecturas con coma y signo menos: ahora sale
      como el resto («0,72», «−10,0»).
  B5  Tres textos por debajo de 4,5 de contraste: la pestaña inactiva de los
      bloques de código (#64748b sobre #e2e8f0, 3,86), el botón de notación
      desplegado (blanco sobre #FF6600, 2,94) y el subtítulo en inglés de los
      títulos de módulo (gray-400 sobre blanco, 2,54). Pasan a #475569 (6,1),
      #C2410C (5,18) y #6b7280 (4,83).

QUÉ NO TOCA. Ninguna cifra, ningún texto, el naranja de marca de títulos,
iconos y gráficas. El laboratorio πPT y la portada no usan esta plantilla.

    python3 ensamblado/retropropaga_cierre_cap1.py --seco
    python3 ensamblado/retropropaga_cierre_cap1.py

Es idempotente. Después, reensamblar las páginas tiene que dar byte a byte lo
mismo que este parche.
"""
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
PLANTILLA = RAIZ / "plantilla" / "plantilla-capitulo-muestreo.html"
MUESTREO = RAIZ / "sitio" / "muestreo"
ARCHIVOS = [PLANTILLA] + sorted(MUESTREO.glob("capitulo-*.html")) + [
    MUESTREO / "preparcial-corte-1.html",
    MUESTREO / "proyecto-integrador-corte-iii.html",
]

MARCA = "/* Auditoría de cierre del capítulo 1 (2026-11-22)"

# Justo detrás de las reglas de retropropaga_rotulo_modulo.py, por la misma
# razón que allí: seis páginas añaden su propia hoja ante el cierre de <style>.
ANCLA_CSS = ("    .ciclo-numero,\n    .ciclo-vuelta .ciclo-etiqueta,\n"
             "    .rubrica-criterio-clave {\n      color: #C2410C;\n    }\n\n")

REGLAS = """    /* Auditoría de cierre del capítulo 1 (2026-11-22), B1, B2 y B5.
       B1: el título h3 era flex, y cada <code> o <em> se volvía un ítem
       aparte que a 375 px se iba a otra columna. Ahora es un bloque y la
       barra naranja va en línea delante del texto. */
    h3 {
      display: block;
    }

    h3::before {
      vertical-align: middle;
      margin-right: 0.5rem;
      margin-top: -0.2rem;
    }

    /* B2: en el móvil, los rellenos anidados de los ejercicios guiados
       dejaban el código en 194 px; y la cabecera de cada bloque de código
       recortaba su botón. */
    @media (max-width: 640px) {
      .exercise {
        padding: 1rem 0.6rem;
      }

      .ejercicio-guiado {
        padding: 0.75rem 0.5rem;
      }

      .ejercicio-panel {
        padding: 0.75rem 0.5rem;
      }

      .code-block-header {
        flex-wrap: wrap;
      }
    }

    /* B5: tres textos por debajo de 4,5 de contraste. */
    .code-tab-btn {
      color: #475569;
    }

    .glosario-boton[aria-expanded="true"] {
      background: #C2410C;
      border-color: #C2410C;
    }

    h2 > .text-gray-400.font-normal {
      color: #6b7280;
    }

"""

# B3: al cerrar una pregunta, la pista del intento fallido se oculta.
JS_QUIZ = ("        estado[i].acierto = acierto;\n",
           "        estado[i].acierto = acierto;\n"
           "        // La pista del intento fallido ya no aplica: quedaba a la vista\n"
           "        // junto a «Correcto» o «No es esa» (auditoría de cierre del cap. 1).\n"
           "        const pistaVieja = bloque.querySelector('.quiz-pista');\n"
           "        if (pistaVieja) pistaVieja.hidden = true;\n")

# B4: el valor de los deslizadores, con coma decimal y signo menos.
JS_DESLIZADOR = [
    ("        const output = document.createElement('output');\n"
     "        output.textContent = Number(params[def.clave]).toFixed(decimales);\n",
     "        const output = document.createElement('output');\n"
     "        // Con coma decimal y signo menos, como las lecturas y la prosa.\n"
     "        const fmtDeslizador = v => Number(v).toFixed(decimales)\n"
     "          .replace('.', ',').replace('-', '−');\n"
     "        output.textContent = fmtDeslizador(params[def.clave]);\n"),
    ("          output.textContent = params[def.clave].toFixed(decimales);\n",
     "          output.textContent = fmtDeslizador(params[def.clave]);\n"),
]


def main() -> int:
    seco = "--seco" in sys.argv
    fallos: list[str] = []
    for f in ARCHIVOS:
        if not f.exists():
            fallos.append(f"{f.name}: no existe")
            continue
        texto = f.read_text(encoding="utf-8")
        nombre = f"{f.parent.name}/{f.name}"
        if MARCA in texto:
            print(f"  {nombre:<48} ya estaba")
            continue
        cambios = [(ANCLA_CSS, ANCLA_CSS + REGLAS), JS_QUIZ] + JS_DESLIZADOR
        malos = [a for a, _ in cambios if texto.count(a) != 1]
        if malos:
            fallos.append(f"{nombre}: {len(malos)} anclas no aparecen exactamente una vez")
            continue
        for a, b in cambios:
            texto = texto.replace(a, b, 1)
        if not seco:
            f.write_text(texto, encoding="utf-8")
            f.chmod(0o644)
        print(f"  {nombre:<48} hoja y motor")
    if fallos:
        print("\n" + "\n".join(f"ABORTA: {x}" for x in fallos), file=sys.stderr)
        return 1
    if seco:
        print("\n(en seco: no se escribió nada)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
