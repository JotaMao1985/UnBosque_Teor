#!/usr/bin/env python3
"""El año de Lohr en el pie común de la plantilla: 2022, no 2021.

POR QUÉ EXISTE. La auditoría de cierre del capítulo 1 (22 de noviembre de 2026;
informe PLAN_Auditoria_Cap1_Cierre.md, NA-8) vio que el pie común de las páginas
cita «Lohr, S.L. (2021)». La 3.ª edición es de 2022, como dicen el catálogo
(bibliografia/) y la decisión del 10 de noviembre. Javier pidió corregir las
erratas de los capítulos 2 a 8 el 25 de noviembre. El pie es de la plantilla,
así que está en todas las páginas que la usan; el capítulo 1 ya no lo lleva,
porque su pie lo genera precalculo/genera_referencias.py.

QUÉ NO TOCA. Nada más que esa cadena.

    python3 ensamblado/retropropaga_pie_lohr2022.py --seco
    python3 ensamblado/retropropaga_pie_lohr2022.py

Es idempotente. Después, reensamblar las páginas tiene que dar byte a byte lo
mismo que este parche.
"""
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
PLANTILLA = RAIZ / "plantilla" / "plantilla-capitulo-muestreo.html"
MUESTREO = RAIZ / "sitio" / "muestreo"
ARCHIVOS = [PLANTILLA] + sorted(p for p in MUESTREO.glob("capitulo-*.html")
                                if not p.name.startswith("capitulo-1-")) + [
    MUESTREO / "index.html",
    MUESTREO / "preparcial-corte-1.html",
    MUESTREO / "proyecto-integrador-corte-iii.html",
]
# El taller 1 también lleva el pie, pero está fuera de git (.gitignore) y se
# regenera con ensambla_taller1.py desde la plantilla ya corregida.

VIEJA = 'Lohr, S.L. (2021). <em class="text-gold">Sampling: Design and Analysis</em>'
NUEVA = 'Lohr, S.L. (2022). <em class="text-gold">Sampling: Design and Analysis</em>'


def main() -> int:
    seco = "--seco" in sys.argv
    fallos: list[str] = []
    for f in ARCHIVOS:
        if not f.exists():
            fallos.append(f"{f.name}: no existe")
            continue
        texto = f.read_text(encoding="utf-8")
        nombre = f"{f.parent.name}/{f.name}"
        if NUEVA in texto and VIEJA not in texto:
            print(f"  {nombre:<48} ya estaba")
            continue
        if texto.count(VIEJA) != 1:
            fallos.append(f"{nombre}: el pie aparece {texto.count(VIEJA)} veces")
            continue
        if not seco:
            f.write_text(texto.replace(VIEJA, NUEVA, 1), encoding="utf-8")
            f.chmod(0o644)
        print(f"  {nombre:<48} pie con 2022")
    if fallos:
        print("\n" + "\n".join(f"ABORTA: {x}" for x in fallos), file=sys.stderr)
        return 1
    if seco:
        print("\n(en seco: no se escribió nada)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
