#!/usr/bin/env python3
"""Baraja las opciones de la autoevaluación, en la plantilla y en las nueve páginas.

POR QUÉ EXISTE. La auditoría del 2026-08-30 midió que en **los 72 ítems de
respuesta única de todo el material** la opción correcta está en la primera
posición del array. Las 72. Y el motor renderiza `p.opciones.map((op, j) => …)`
en orden de declaración, asignando la letra por índice: no baraja en ninguna
parte. Pulsar siempre la (a) daba 72 de 72 sin leer un enunciado.

QUÉ HACE. Introduce una permutación **estable por ítem**: el orden sale de un
hash del enunciado, así que es el mismo en cada carga y en cada navegador. Eso
importa por dos razones. Si el orden fuera aleatorio en cada carga, un
estudiante podría recargar hasta que le saliera cómodo, y sobre todo la
retroalimentación por opción —que este material tiene escrita en las 64
opciones— dejaría de poder citarse por letra. Estable no significa predecible:
significa que no es siempre la (a).

QUÉ NO ARREGLA. La segunda vía de acierto, que es la longitud: la correcta es la
más larga en el 94 % de los ítems, con el doble de caracteres que sus
distractores. Eso se arregla reescribiendo texto, no barajando. Barajar sin
recortar deja el atajo intacto — son dos arreglos, no uno.

QUÉ NO TOCA. Los puntos de `comprobacion` de las preguntas abiertas: son una
lista de verificación que el estudiante se marca, no opciones, y los pinta
`renderPreguntaTexto`, que este guion no roza.

    python3 ensamblado/retropropaga_barajado.py --seco    # solo comprueba
    python3 ensamblado/retropropaga_barajado.py

Es idempotente: si un archivo ya está parcheado, lo dice y sigue.
"""
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
ARCHIVOS = [RAIZ / "plantilla" / "plantilla-capitulo-muestreo.html"] + sorted(
    (RAIZ / "sitio" / "muestreo").glob("capitulo-*.html")) + [
    RAIZ / "sitio" / "muestreo" / "preparcial-corte-1.html"]

AYUDANTES = '''    // ================================================================
    // Barajado estable de las opciones de la autoevaluación
    //
    // El orden sale de un hash del enunciado, no del reloj: la misma pregunta
    // da siempre el mismo orden. Recargar no reordena —así nadie puede tirar de
    // nuevo hasta que le salga fácil— y la retroalimentación por opción sigue
    // pudiendo citarse por su letra. Lo que deja de ocurrir es que la correcta
    // sea siempre la (a), que era el caso en los 72 ítems del material.
    // ================================================================
    function semillaDeTexto(texto) {           // FNV-1a de 32 bits
      let h = 2166136261;
      for (let i = 0; i < texto.length; i++) {
        h ^= texto.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return h >>> 0;
    }

    function azarEstable(semilla) {            // mulberry32
      let a = semilla >>> 0;
      return function () {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    function barajaEstable(opciones, clave) {  // Fisher-Yates con semilla fija
      if (!Array.isArray(opciones) || opciones.length < 2) return opciones || [];
      const r = azarEstable(semillaDeTexto(clave || ''));
      const out = opciones.slice();
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(r() * (i + 1));
        const tmp = out[i]; out[i] = out[j]; out[j] = tmp;
      }
      return out;
    }

'''

# (ancla, reemplazo, marca-de-ya-parcheado)
PARCHES = [
    # 1 · los ayudantes, delante del contador de tipos del motor
    ("    const NOMBRE_TIPO = {",
     AYUDANTES + "    const NOMBRE_TIPO = {",
     "function barajaEstable("),
    # 2 · una sola permutación por pregunta, reutilizada por los tres tipos
    #     que pintan opciones (opcion, multiple y grafico)
    ("""      preguntas.forEach((p, i) => {
        const tipo = p.tipo || 'opcion';""",
     """      preguntas.forEach((p, i) => {
        const tipo = p.tipo || 'opcion';
        // Se baraja UNA vez y se usa en todas partes: el render y sus
        // callbacks tienen que indexar el mismo array o `correcta` apuntaría
        // a otro botón.
        const opcs = barajaEstable(p.opciones, p.pregunta);""",
     "const opcs = barajaEstable("),
    # 3-8 · el motor deja de indexar p.opciones y pasa a indexar la permutación
    ("          const botones = p.opciones.map((op, j) => {\n            const b = document.createElement('button');\n            b.type = 'button';\n            b.className = 'quiz-opcion';\n            b.setAttribute('aria-pressed', 'false');",
     "          const botones = opcs.map((op, j) => {\n            const b = document.createElement('button');\n            b.type = 'button';\n            b.className = 'quiz-opcion';\n            b.setAttribute('aria-pressed', 'false');",
     "const botones = opcs.map((op, j) => {\n            const b = document.createElement('button');\n            b.type = 'button';\n            b.className = 'quiz-opcion';\n            b.setAttribute('aria-pressed', 'false');"),
    ("            const correctas = new Set(p.opciones.map((o, j) => o.correcta ? j : -1).filter(j => j >= 0));",
     "            const correctas = new Set(opcs.map((o, j) => o.correcta ? j : -1).filter(j => j >= 0));",
     "new Set(opcs.map((o, j) =>"),
    ("              cerrar(i, bloque, true, p.retroAcierto || p.opciones\n                .filter(o => o.correcta)",
     "              cerrar(i, bloque, true, p.retroAcierto || opcs\n                .filter(o => o.correcta)",
     "p.retroAcierto || opcs\n                .filter"),
    ("          const botones = p.opciones.map((op, j) => {\n            const b = document.createElement('button');\n            b.type = 'button';\n            b.className = 'quiz-opcion';\n            b.innerHTML = `<span class=\"quiz-letra\">",
     "          const botones = opcs.map((op, j) => {\n            const b = document.createElement('button');\n            b.type = 'button';\n            b.className = 'quiz-opcion';\n            b.innerHTML = `<span class=\"quiz-letra\">",
     "const botones = opcs.map((op, j) => {\n            const b = document.createElement('button');\n            b.type = 'button';\n            b.className = 'quiz-opcion';\n            b.innerHTML = `<span class=\"quiz-letra\">"),
    ("                botones.forEach((x, k) => { x.disabled = true; if (p.opciones[k].correcta) x.classList.add('correcta'); });\n                cerrar(i, bloque, true, op.retro);",
     "                botones.forEach((x, k) => { x.disabled = true; if (opcs[k].correcta) x.classList.add('correcta'); });\n                cerrar(i, bloque, true, op.retro);",
     "if (opcs[k].correcta) x.classList.add('correcta'); });\n                cerrar(i, bloque, true, op.retro);"),
    ("                botones.forEach((x, k) => { x.disabled = true; if (p.opciones[k].correcta) x.classList.add('correcta'); });\n                b.classList.add('incorrecta');",
     "                botones.forEach((x, k) => { x.disabled = true; if (opcs[k].correcta) x.classList.add('correcta'); });\n                b.classList.add('incorrecta');",
     "if (opcs[k].correcta) x.classList.add('correcta'); });\n                b.classList.add('incorrecta');"),
]


def main():
    seco = "--seco" in sys.argv
    fallos = []
    for f in ARCHIVOS:
        if not f.exists():
            fallos.append(f"{f.name}: no existe")
            continue
        t = f.read_text(encoding="utf-8")
        hechos = pendientes = 0
        for n, (ancla, nuevo, marca) in enumerate(PARCHES, start=1):
            if marca in t:
                hechos += 1
                continue
            if t.count(ancla) != 1:
                fallos.append(f"{f.name}: el ancla {n} aparece {t.count(ancla)} veces, no 1")
                continue
            t = t.replace(ancla, nuevo, 1)
            pendientes += 1
        estado = "ya estaba" if pendientes == 0 else f"{pendientes} inserciones"
        print(f"  {f.name:<42} {estado}"
              + (f" ({hechos} ya hechas)" if hechos and pendientes else ""))
        if not seco and pendientes:
            f.write_text(t, encoding="utf-8")
            f.chmod(0o644)
    if fallos:
        print("\n" + "\n".join(f"ABORTA: {x}" for x in fallos), file=sys.stderr)
        return 1
    if seco:
        print("\n(en seco: no se escribió nada)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
