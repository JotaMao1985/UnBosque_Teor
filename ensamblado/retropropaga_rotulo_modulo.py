#!/usr/bin/env python3
"""El contraste del rótulo «MÓDULO N», que el arreglo anterior no alcanzó.

POR QUÉ EXISTE. La auditoría del capítulo 1 (VI-22, 13 de noviembre de 2026)
midió el rótulo naranja «MÓDULO N» que encabeza cada módulo: 2,94 sobre blanco,
y el mínimo para texto de 14 px es 4,5. `retropropaga_movil_y_jerarquia.py`
quiso oscurecerlo con una regla para `.rotulo` y `.sidebar-title`, pero el
rótulo no lleva ninguna de esas dos clases: es

    <div class="flex items-center space-x-2 text-sm text-secondary
                font-semibold mb-2 uppercase tracking-wide">

y siguió en `#FF6600`. Esta regla lo alcanza por la combinación de clases que
solo él tiene (`text-secondary` + `uppercase` + `tracking-wide`: 117 rótulos en
las páginas, ningún otro elemento), con más peso que el `.text-secondary` de
Tailwind. El tono es el mismo `#C2410C` de aquel arreglo: 5,18 sobre blanco.

TAMBIÉN, visto al comprobarlo y con el visto bueno de Javier (2026-11-21): el
mismo naranja en texto de 10-11 px de dos componentes de la plantilla, las
etiquetas del ciclo (`.ciclo-numero`, `.ciclo-vuelta .ciclo-etiqueta`; caps. 7
y 8) y las claves de la rúbrica (`.rubrica-criterio-clave`; cap. 8), con 2,81 y
2,94. Pasan al mismo tono; sus variantes sobre fondo oscuro no se tocan.

QUÉ NO TOCA. El naranja de marca de los títulos grandes, los iconos y las
gráficas; los módulos, que no hay que editar uno a uno; ninguna cifra.

    python3 ensamblado/retropropaga_rotulo_modulo.py --seco
    python3 ensamblado/retropropaga_rotulo_modulo.py

Es idempotente. Después, reensamblar las páginas tiene que dar byte a byte lo
mismo que este parche. El laboratorio πPT y las dos portadas no tienen rótulo
de módulo, y no se tocan.
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

MARCA = "/* El rótulo «MÓDULO N»"
# Justo detrás de la regla de retropropaga_movil_y_jerarquia.py, y no ante el
# cierre de <style>: seis páginas añaden ahí su propia hoja al ensamblarse.
ANCLA = "    .rotulo,\n    .sidebar-title {\n      color: #C2410C;\n    }\n\n"

REGLAS = """    /* El rótulo «MÓDULO N» (2026-11-19, VI-22 de la auditoría del capítulo 1).
       En naranja de marca daba 2,94 sobre blanco; el mínimo es 4,5. La regla
       de arriba para .rotulo no lo alcanzaba: el rótulo es un div con
       text-secondary, uppercase y tracking-wide, combinación que nada más usa. */
    .text-secondary.uppercase.tracking-wide {
      color: #C2410C;
    }

    /* El mismo naranja, en texto de 10-11 px de dos componentes: las etiquetas
       del ciclo (2,94 sobre blanco; 2,81 sobre el gris del panel) y las claves
       de la rúbrica (2,94). Las variantes sobre fondo verde oscuro (etapa
       elegida, criterio activo) pesan más y conservan su tono claro. */
    .ciclo-numero,
    .ciclo-vuelta .ciclo-etiqueta,
    .rubrica-criterio-clave {
      color: #C2410C;
    }

"""


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
        if texto.count(ANCLA) != 1:
            fallos.append(f"{nombre}: la regla de .rotulo aparece {texto.count(ANCLA)} veces, no 1")
            continue
        if not seco:
            f.write_text(texto.replace(ANCLA, ANCLA + REGLAS, 1), encoding="utf-8")
            f.chmod(0o644)
        print(f"  {nombre:<48} hoja")
    if fallos:
        print("\n" + "\n".join(f"ABORTA: {x}" for x in fallos), file=sys.stderr)
        return 1
    if seco:
        print("\n(en seco: no se escribió nada)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
