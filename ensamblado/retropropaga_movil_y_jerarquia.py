#!/usr/bin/env python3
"""Seis arreglos de la plantilla que salieron de la auditoría del capítulo 1.

POR QUÉ EXISTE. El lector visual de la auditoría (13 de noviembre de 2026)
encontró nueve defectos; seis no son del capítulo 1 sino de la plantilla, y
Javier decidió arreglarlos ahí, para los doce archivos:

  1. **En el móvil no había menú de módulos.** `.sidebar-container` tiene
     `display: none` por debajo de 768 px y solo `@media (min-width: 768px)` lo
     pone en `block`. El botón cambiaba de icono y de `aria-expanded`, pero el
     panel seguía midiendo 0 px: para ir del módulo 1 al 10 había que pasar
     nueve pantallas con «Siguiente». Ahora, en móvil, el panel se abre
     superpuesto sobre el contenido cuando pierde `sidebar-collapsed`.
  2. **Ese mismo botón tapaba el texto.** Iba fijo a media altura, de x = 14 a
     x = 49, encima de la primera letra de cada línea. Ahora, en móvil, se va
     abajo a la izquierda, fuera de la columna de lectura.
  3. **El botón «volver arriba» tapaba el final de las líneas**, en los dos
     anchos. Ahora está translúcido hasta que se le pasa por encima.
  4. **Un `h3` pesaba menos que los `h4` que cuelgan de él**: los dos a 16 px,
     el `h3` en peso 400 y el `h4` en 700. El `h3` sube de tamaño y de peso, y
     gana aire por arriba.
  5. **Contraste.** El rótulo «MÓDULO N» en naranja de marca da 2,94 sobre
     blanco, y el mínimo para texto es 4,5. Se oscurece solo donde es texto
     pequeño; la paleta de las gráficas y los títulos grandes no se tocan.
  6. **El texto justificado abre ríos** en una columna de 375 px. En móvil pasa
     a alineado a la izquierda.

QUÉ NO TOCA. El `<script>`: el botón ya alterna la clase y el `aria-expanded`,
así que basta con que la hoja haga caso. Y ninguna cifra ni ningún contenido.

    python3 ensamblado/retropropaga_movil_y_jerarquia.py --seco
    python3 ensamblado/retropropaga_movil_y_jerarquia.py

Es idempotente. Después, reensamblar las páginas tiene que dar byte a byte lo
mismo que este parche.
"""
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
PLANTILLA = RAIZ / "plantilla" / "plantilla-capitulo-muestreo.html"
MUESTREO = RAIZ / "sitio" / "muestreo"
ARCHIVOS = [PLANTILLA, RAIZ / "sitio" / "index.html"] + sorted(MUESTREO.glob("capitulo-*.html")) + [
    MUESTREO / "index.html",
    # El laboratorio πPT no sale de esta plantilla: su hoja vive aparte y hay
    # que reensamblarlo después (igual que en retropropaga_cita_y_eje_y.py).
    RAIZ / "ensamblado" / "laboratorio_ppt" / "estilos.css",
    MUESTREO / "preparcial-corte-1.html",
    MUESTREO / "proyecto-integrador-corte-iii.html",
]

MARCA = "/* Auditoría del capítulo 1"
ANCLA = "  </style>"

REGLAS = """    /* Auditoría del capítulo 1 (2026-11-14): seis arreglos de la plantilla.
       Van al final de la hoja a propósito: así pesan más que las reglas de
       arriba sin tener que editarlas una a una. */

    @media (max-width: 767px) {
      /* 1 · El menú de módulos, que en el móvil no se abría. El botón ya quita
         `sidebar-collapsed`; lo que faltaba era que la hoja hiciera caso. */
      .sidebar-container:not(.sidebar-collapsed) {
        display: block;
        position: fixed;
        top: 0;
        bottom: 0;
        left: 0;
        z-index: 60;
        width: min(86vw, 320px);
        max-width: 320px;
        overflow-y: auto;
        background: #ffffff;
        box-shadow: 0 0 24px rgba(0, 0, 0, 0.25);
      }

      /* 2 · El botón que lo abre, fuera de la columna de lectura. */
      #sidebarToggle {
        top: auto;
        bottom: 1rem;
        left: 1rem;
        z-index: 70;
      }

      /* 6 · Justificar una columna de 375 px abre ríos entre las palabras. */
      p,
      li {
        text-align: left;
      }
    }

    /* 3 · El botón «volver arriba» tapaba el final de las líneas. */
    #scrollToTopBtn {
      opacity: 0.55;
      transition: opacity 0.2s ease;
    }

    #scrollToTopBtn:hover,
    #scrollToTopBtn:focus {
      opacity: 1;
    }

    /* 4 · Un h3 de sección pesaba menos que los h4 que cuelgan de él. */
    .animate-fade-in h3:not([class]) {
      font-size: 1.15rem;
      font-weight: 700;
      margin-top: 1.75rem;
    }

    /* 5 · Contraste del texto pequeño: el naranja de marca da 2,94 sobre
       blanco y el mínimo es 4,5. Solo donde es texto, no en las gráficas. */
    .rotulo,
    .sidebar-title {
      color: #C2410C;
    }

"""


# El panel arranca abierto, que en escritorio es su columna y en movil seria una
# cortina encima del texto. Esta linea lo cierra al entrar desde un telefono.
MARCA_JS = "el panel arranca cerrado"
ANCLA_JS = "    sidebarToggle.addEventListener('click', () => {"
PARCHE_JS = """    // En el movil el panel arranca cerrado: hasta la auditoria del capitulo 1
    // (2026-11-14) no se podia abrir, y ahora se superpone al contenido.
    if (window.matchMedia('(max-width: 767px)').matches) {
      sidebar.classList.add('sidebar-collapsed');
      sidebarToggle.setAttribute('aria-expanded', 'false');
      const iconoInicial = sidebarToggle.querySelector('i');
      if (iconoInicial) {
        iconoInicial.classList.remove('fa-chevron-left');
        iconoInicial.classList.add('fa-chevron-right');
      }
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
        nombre = f"{f.parent.name}/{f.name}" if f.parent.name != "plantilla" else f.name
        nuevo, hechos = texto, []
        if MARCA in texto:
            pass
        elif f.suffix == ".css":
            nuevo = texto.rstrip("\n") + "\n\n" + "\n".join(
                l[4:] if l.startswith("    ") else l for l in REGLAS.splitlines()).strip() + "\n"
            hechos.append("hoja")
        elif texto.count(ANCLA) != 1:
            fallos.append(f"{nombre}: el cierre de <style> aparece {texto.count(ANCLA)} veces, no 1")
            continue
        else:
            nuevo = texto.replace(ANCLA, REGLAS + ANCLA, 1)
            hechos.append("hoja")
        if MARCA_JS not in nuevo and ANCLA_JS in nuevo:
            nuevo = nuevo.replace(ANCLA_JS, PARCHE_JS + ANCLA_JS, 1)
            hechos.append("arranque")
        if not seco and hechos:
            f.write_text(nuevo, encoding="utf-8")
            f.chmod(0o644)
        print(f"  {nombre:<48} {'+'.join(hechos) if hechos else 'ya estaba'}")
    if fallos:
        print("\n" + "\n".join(f"ABORTA: {x}" for x in fallos), file=sys.stderr)
        return 1
    if seco:
        print("\n(en seco: no se escribió nada)")
    else:
        print("\nAhora: python3 ensamblado/ensambla_laboratorio_ppt.py, que no sale de esta plantilla")
    return 0


if __name__ == "__main__":
    sys.exit(main())
