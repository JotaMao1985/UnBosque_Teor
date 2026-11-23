#!/usr/bin/env python3
"""Dos arreglos del quiz que eligió Javier en el Checkpoint final del cap. 1.

POR QUÉ EXISTE. La auditoría de cierre del capítulo 1 (22 de noviembre de 2026;
informe PLAN_Auditoria_Cap1_Cierre.md) propuso dos mejoras del quiz que no son
del capítulo sino del motor y de la hoja de la plantilla, y Javier las eligió
el 23 de noviembre:

  VI-19  El motor contestaba «No es esa.» también en las preguntas de selección
         múltiple, donde el estudiante marcó varias opciones. Ahí pasa a «No son
         esas.». Los demás tipos no cambian.
  VI-2   A 375 px, los rellenos anidados del quiz (.quiz, .quiz-pregunta,
         .quiz-grafico) se comían unos 80 px por lado, y la gráfica de una
         pregunta quedaba en un lienzo de 196 px. En el móvil se adelgazan.

QUÉ NO TOCA. Ningún texto de pregunta ni de retroalimentación, ningún color.
Las mismas páginas que retropropaga_cierre_cap1.py, cuyas reglas sirven de
ancla a las de aquí.

    python3 ensamblado/retropropaga_plural_quiz.py --seco
    python3 ensamblado/retropropaga_plural_quiz.py

Es idempotente: cada cambio lleva su marca y se salta si ya está. Después,
reensamblar las páginas tiene que dar byte a byte lo mismo que este parche.
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

# VI-19: el encabezado de la retroalimentación, en plural en la de varias respuestas.
PLURAL = (
    "// En la de varias respuestas, en plural (auditoría de cierre del cap. 1).",
    "            : '<strong>No es esa.</strong> ';\n",
    "            // En la de varias respuestas, en plural (auditoría de cierre del cap. 1).\n"
    "            : (preguntas[i].tipo === 'multiple' ? '<strong>No son esas.</strong> '\n"
    "                                                : '<strong>No es esa.</strong> ');\n",
)

# VI-2: los rellenos del quiz en el móvil. Van detrás de la última regla de
# retropropaga_cierre_cap1.py, que ya está en todas estas páginas.
ANCLA_CSS = "    h2 > .text-gray-400.font-normal {\n      color: #6b7280;\n    }\n\n"
RELLENOS = (
    "/* Checkpoint final del capítulo 1 (2026-11-23), VI-2.",
    ANCLA_CSS,
    ANCLA_CSS +
    "    /* Checkpoint final del capítulo 1 (2026-11-23), VI-2. A 375 px, los rellenos\n"
    "       anidados del quiz dejaban la gráfica de una pregunta en 196 px de lienzo. */\n"
    "    @media (max-width: 640px) {\n"
    "      .quiz {\n"
    "        padding: 1rem 0.6rem;\n"
    "      }\n"
    "\n"
    "      .quiz-pregunta {\n"
    "        padding: 0.85rem 0.6rem;\n"
    "      }\n"
    "\n"
    "      .quiz-grafico {\n"
    "        padding: 0.3rem;\n"
    "      }\n"
    "    }\n"
    "\n",
)

CAMBIOS = [("motor del quiz", PLURAL), ("rellenos del quiz", RELLENOS)]


def main() -> int:
    seco = "--seco" in sys.argv
    fallos: list[str] = []
    for f in ARCHIVOS:
        if not f.exists():
            fallos.append(f"{f.name}: no existe")
            continue
        texto = f.read_text(encoding="utf-8")
        nombre = f"{f.parent.name}/{f.name}"
        hechos = []
        for etiqueta, (marca, ancla, nuevo) in CAMBIOS:
            if marca in texto:
                continue
            if texto.count(ancla) != 1:
                fallos.append(f"{nombre}: el ancla de «{etiqueta}» aparece {texto.count(ancla)} veces")
                break
            texto = texto.replace(ancla, nuevo, 1)
            hechos.append(etiqueta)
        else:
            if hechos and not seco:
                f.write_text(texto, encoding="utf-8")
                f.chmod(0o644)
            print(f"  {nombre:<48} {', '.join(hechos) if hechos else 'ya estaba'}")
    if fallos:
        print("\n" + "\n".join(f"ABORTA: {x}" for x in fallos), file=sys.stderr)
        return 1
    if seco:
        print("\n(en seco: no se escribió nada)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
