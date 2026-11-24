#!/usr/bin/env python3
"""La alerta del último módulo, en el español de Colombia (Fase 8 del cap. 1, CL-15).

POR QUÉ EXISTE. La auditoría de cierre del capítulo 1 (22 de noviembre de 2026;
informe PLAN_Auditoria_Cap1_Cierre.md, CL-15) señaló que la alerta que sale al
pulsar «Siguiente» en el último módulo dice «¡Felicidades! Has completado el
capítulo.»: el pretérito perfecto compuesto no es el del resto del material
(«Acertaste», «marcaste») ni el del español de Colombia. Javier eligió hacer la
mejora el 23 de noviembre. La alerta es del motor de la plantilla, así que está
en todas las páginas que la usan.

QUÉ NO TOCA. Nada más que esa cadena. Las mismas páginas que
retropropaga_cierre_cap1.py.

    python3 ensamblado/retropropaga_alerta_final.py --seco
    python3 ensamblado/retropropaga_alerta_final.py

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

VIEJA = "alert('¡Felicidades! Has completado el capítulo.')"
NUEVA = "alert('¡Felicitaciones! Completaste el capítulo.')"


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
            fallos.append(f"{nombre}: la alerta aparece {texto.count(VIEJA)} veces")
            continue
        if not seco:
            f.write_text(texto.replace(VIEJA, NUEVA, 1), encoding="utf-8")
            f.chmod(0o644)
        print(f"  {nombre:<48} alerta final")
    if fallos:
        print("\n" + "\n".join(f"ABORTA: {x}" for x in fallos), file=sys.stderr)
        return 1
    if seco:
        print("\n(en seco: no se escribió nada)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
