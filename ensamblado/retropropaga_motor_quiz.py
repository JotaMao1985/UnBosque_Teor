#!/usr/bin/env python3
"""Cuatro arreglos del motor de la autoevaluación, en la plantilla y en las páginas.

POR QUÉ EXISTE. La auditoría del M14 del cap. 3 (T7.87, 2026-09-25) encontró
cuatro defectos del motor, no del banco. En el M14 se esquivaron desde el
contenido; aquí se arreglan donde nacen, y alcanzan a los diez bancos:

  1. **Cinco letras.** `LETRAS` tenía cinco, y la sexta opción de una pregunta
     salía como «undefined)» en «Por qué las demás». Pasó en el M14 al fusionar
     las dos preguntas del GREG. Ahora son ocho, como las del simulacro.
  2. **«Casi» ante cualquier fallo.** La pista abría con «Casi. Una pista:», y
     la de varias respuestas con «Casi.», también para quien no había acertado
     ninguna. Ahora dice «Todavía no.», y la de varias respuestas ya no dice
     «te faltan 0» cuando lo que pasa es que sobran.
  3. **Las cifras, al leerlas y al enseñarlas.** `parseFloat("308 904")` da 308,
     así que la cifra escrita como la escribe el capítulo contaba como fallo. Y
     al revelar la respuesta se pintaba el número de JavaScript: con punto y
     sin ceros finales («0.9866», «951» cuando se pidió 951,0). Ahora
     `leeCifra()` acepta espacios de miles y el «−» tipográfico, y
     `escribeCifra()` escribe como el capítulo, con los `decimales` que declara
     la pregunta.
  4. **El eco.** El motor abre la retro del acierto con «Correcto.», y 74 retros
     de la correcta abrían a su vez con «Correcto:», «Exacto.» o «Eso es.». El
     estudiante leía «Correcto. Correcto: 5,54 millones». `sinEco()` ya existía,
     pero solo dentro de «Por qué las demás», y además se comía «Eso es » en
     «Eso es lo que hay que leer aquí» y dejaba en minúscula lo que seguía.
     Ahora pide un signo detrás de la palabra, pone la mayúscula y se aplica
     también a la retro principal del acierto.

QUÉ NO TOCA. Los bancos. Los `decimales` que faltaban van en su fuente, y la
prueba que exige que casen con el enunciado es `precalculo/pruebas/prueba_motor.py`.

    python3 ensamblado/retropropaga_motor_quiz.py --seco    # solo comprueba
    python3 ensamblado/retropropaga_motor_quiz.py

Es idempotente: si un archivo ya está parcheado, lo dice y sigue. Después,
reensamblar las páginas tiene que dar byte a byte lo mismo que este parche.
"""
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
PLANTILLA = RAIZ / "plantilla" / "plantilla-capitulo-muestreo.html"
# La del Taller 1 está retirada por D1 y en el .gitignore; se parchea igual,
# como en retropropaga_barajado.py, por si alguien la reensambla.
ARCHIVOS = [PLANTILLA] + sorted(
    (RAIZ / "sitio" / "muestreo").glob("capitulo-*.html")) + [
    RAIZ / "sitio" / "muestreo" / "preparcial-corte-1.html",
    RAIZ / "sitio" / "muestreo" / "taller-1-preparacion-parcial-1.html"]

AYUDANTES = r'''    const AUTOEVALUACIONES = {};
    // Ocho letras. Con cinco, la sexta opción de una pregunta salía como
    // «undefined)» (el M14 del cap. 3, al fusionar las dos del GREG).
    // prueba_bancos.py lee esta lista para avisar de un ítem que no quepa.
    const LETRAS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    // ================================================================
    // Las cifras de una numérica, al leerlas y al enseñarlas
    //
    // leeCifra() acepta lo que teclea el estudiante: coma o punto decimal,
    // espacios de miles y el «−» tipográfico. Antes, parseFloat se paraba en
    // el primer espacio, y la cifra escrita como la escribe el capítulo, con
    // los miles separados, contaba como fallo. Con un solo separador y sin
    // espacios, la coma o el punto es el decimal, como en el resto del curso.
    // Con los dos, el último es el decimal.
    //
    // escribeCifra() enseña la respuesta como la escribe el capítulo —coma
    // decimal, espacio de miles desde cuatro cifras, «−»— y con los
    // `decimales` que declara la pregunta. Antes se pintaba el número de
    // JavaScript, con punto y sin los ceros finales que pedía el enunciado.
    // Sin `decimales`, los del propio número.
    //
    // En los comentarios del motor no va ninguna cifra de ejemplo: el motor
    // está en todas las páginas, y verifica_bloques --prosa las leería como
    // cifras sin respaldo.
    // ================================================================
    function leeCifra(texto) {
      let s = String(texto).replace(/\s/g, '').replace(/−/g, '-');
      const comas = (s.match(/,/g) || []).length;
      const puntos = (s.match(/\./g) || []).length;
      if (comas && puntos) {
        const decimal = s.lastIndexOf(',') > s.lastIndexOf('.') ? ',' : '.';
        s = s.split(decimal === ',' ? '.' : ',').join('').replace(decimal, '.');
      } else if (comas > 1 || puntos > 1) {
        s = s.replace(/[.,]/g, '');
      } else {
        s = s.replace(',', '.');
      }
      return parseFloat(s);
    }

    function escribeCifra(valor, decimales) {
      let d = decimales;
      if (!Number.isInteger(d)) {
        const m = /\.(\d+)$/.exec(String(Math.abs(valor)));
        d = m ? m[1].length : 0;
      }
      const partes = Math.abs(valor).toFixed(d).split('.');
      const entero = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      const signo = valor < 0 && Number(partes.join('.')) !== 0 ? '−' : '';
      return signo + entero + (partes[1] ? ',' + partes[1] : '');
    }

    // ================================================================
    // El eco del acierto
    //
    // El motor abre la retro del acierto con «Correcto.», y muchas retros de
    // la correcta abren a su vez con «Exacto.», «Correcto:» o «Eso es.»: el
    // estudiante leía el juicio dos veces. En los diez bancos eran 74.
    // sinEco() quita esa palabra donde va detrás de un juicio del
    // motor —la retro del acierto, y «era la correcta» en «Por qué las
    // demás»— y pone la mayúscula a lo que queda. Solo si la sigue un signo:
    // «Eso es lo que hay que leer» o «Esa es la trampa» son frases, no ecos.
    // ================================================================
    function sinEco(texto) {
      if (!texto) return texto;
      const s = texto.replace(
        /^\s*(?:Exact[oa]|Correct[oa]|Eso es|Ésa es|Esa es|Así es|Cierto|Sí)\s*[.,:;!—–]\s*/, '');
      return s === texto ? texto : s.replace(/^[a-záéíóúüñ]/, c => c.toUpperCase());
    }
'''

# (ancla, reemplazo, marca-de-ya-parcheado, solo_en_la_plantilla)
PARCHES = [
    # 1 · el campo nuevo, en la cabecera del motor
    ("    //   'numerica' campo de entrada; se acepta |respuesta - dada| <= tolerancia\n",
     "    //   'numerica' campo de entrada; se acepta |respuesta - dada| <= tolerancia.\n"
     "    //              `decimales` (opcional) son los que pide el enunciado, y\n"
     "    //              con ellos se escribe la respuesta al revelarla\n",
     "`decimales` (opcional) son los que pide el enunciado", False),
    # 2 · ocho letras y los tres ayudantes
    ("    const AUTOEVALUACIONES = {};\n    const LETRAS = ['a', 'b', 'c', 'd', 'e'];\n",
     AYUDANTES,
     "function escribeCifra(", False),
    # 3 · la retro principal del acierto, sin eco
    ("        retro.innerHTML = encabezado + (textoRetro || '');\n",
     "        // Detrás de «Correcto.» no se repite «Exacto.»: ver sinEco().\n"
     "        retro.innerHTML = encabezado + (acierto ? sinEco(textoRetro || '') : (textoRetro || ''));\n",
     "(acierto ? sinEco(textoRetro || '')", False),
    # 4 · «Por qué las demás» usa el sinEco de arriba, no uno propio
    ("          // La retro de la correcta suele abrir con «Exacto.» o «Correcto.», que\n"
     "          // dentro de esta lista va detrás de «era la correcta» y suena a eco.\n"
     "          const sinEco = s => s.replace(/^(Exacto|Correcto|Eso es|Ésa es|Así es|Cierto)[.,:]?\\s*/, '');\n",
     "          // Aquí la retro de la correcta va detrás de «era la correcta», y\n"
     "          // su «Exacto.» sonaría a eco: se quita con sinEco(), arriba.\n",
     "su «Exacto.» sonaría a eco: se quita con sinEco(), arriba.", False),
    # 5 · la pista, sin «Casi»
    ("          pista.innerHTML = `<strong>Casi. Una pista:</strong> ${preguntas[i].pista}`;\n",
     "          // Sin «Casi»: se decía ante cualquier fallo, también el más lejano.\n"
     "          pista.innerHTML = `<strong>Todavía no. Una pista:</strong> ${preguntas[i].pista}`;\n",
     "<strong>Todavía no. Una pista:</strong>", False),
    # 6 · leer la cifra
    ("            // Se acepta coma o punto como separador decimal\n"
     "            const dada = parseFloat(String(input.value).trim().replace(',', '.'));\n",
     "            // Coma o punto decimal, y espacios de miles: ver leeCifra()\n"
     "            const dada = leeCifra(input.value);\n",
     "const dada = leeCifra(input.value);", False),
    # 7 · enseñar la cifra
    ("                `La respuesta es <strong>${p.respuesta}${p.unidad ? ' ' + p.unidad : ''}</strong>. ${p.retroFallo}`);\n",
     "                `La respuesta es <strong>${escribeCifra(p.respuesta, p.decimales)}${p.unidad ? ' ' + p.unidad : ''}</strong>. ${p.retroFallo}`);\n",
     "${escribeCifra(p.respuesta, p.decimales)}", False),
    # 8 · varias respuestas sin retroAcierto: cada trozo, sin su eco
    ("                .filter(o => o.correcta).map(o => o.retro).filter(Boolean).join(' '),\n",
     "                .filter(o => o.correcta).map(o => sinEco(o.retro)).filter(Boolean).join(' '),\n",
     ".map(o => sinEco(o.retro)).filter(Boolean)", False),
    # 9 · varias respuestas: sin «Casi», y sin «te faltan 0»
    ("              pista.innerHTML = `<strong>Casi.</strong> De las ${marcadas.size} que marcaste, ` +\n"
     "                `${bien} ${bien === 1 ? 'está' : 'están'} en la respuesta, y te ` +\n"
     "                `${correctas.size - bien === 1 ? 'falta' : 'faltan'} ${correctas.size - bien}. ` +\n"
     "                (p.pista || '');\n",
     "              // Sin «Casi», que se decía también a quien no acertaba ninguna.\n"
     "              // Y si no falta ninguna, lo que hay que decir es cuántas\n"
     "              // sobran, no «te faltan 0».\n"
     "              const faltan = correctas.size - bien;\n"
     "              const sobran = marcadas.size - bien;\n"
     "              const cuenta = marcadas.size === 1\n"
     "                ? `La que marcaste ${bien ? 'está' : 'no está'} en la respuesta`\n"
     "                : `De las ${marcadas.size} que marcaste, ` +\n"
     "                  `${bien === 0 ? 'ninguna está' : bien === 1 ? '1 está' : bien + ' están'} en la respuesta`;\n"
     "              pista.innerHTML = `<strong>Todavía no.</strong> ${cuenta}` +\n"
     "                (faltan ? `, y te ${faltan === 1 ? 'falta 1' : 'faltan ' + faltan}. `\n"
     "                        : `, pero ${sobran === 1 ? 'sobra 1' : 'sobran ' + sobran}. `) +\n"
     "                (p.pista || '');\n",
     "const cuenta = marcadas.size === 1", False),
    # 10 · la numérica de muestra de la plantilla declara sus decimales
    ("        respuesta: 0.196,\n"
     "        tolerancia: 0.0006,\n"
     "        retroAcierto: '$1.96/10 = 0.196$. Acepta coma o punto como separador decimal, y la tolerancia se declara en la propia pregunta.',\n",
     "        respuesta: 0.196,\n"
     "        tolerancia: 0.0006,\n"
     "        decimales: 3,\n"
     "        retroAcierto: '$1.96/10 = 0.196$. Acepta coma o punto decimal y espacios de miles. La tolerancia se declara en la propia pregunta, y también <code>decimales</code>: los que pide el enunciado, que son con los que se enseña la respuesta al fallar.',\n",
     "        decimales: 3,\n", True),
]


def main():
    seco = "--seco" in sys.argv
    fallos = []
    for f in ARCHIVOS:
        if not f.exists():
            if "taller-1" in f.name:
                print(f"  {f.name:<42} no esta (retirada por D1)")
                continue
            fallos.append(f"{f.name}: no existe")
            continue
        t = f.read_text(encoding="utf-8")
        hechos = pendientes = 0
        antes = len(fallos)
        for n, (ancla, nuevo, marca, solo_plantilla) in enumerate(PARCHES, start=1):
            if solo_plantilla and f != PLANTILLA:
                continue
            if marca in t:
                hechos += 1
                continue
            if t.count(ancla) != 1:
                fallos.append(f"{f.name}: el ancla {n} aparece {t.count(ancla)} veces, no 1")
                continue
            t = t.replace(ancla, nuevo, 1)
            pendientes += 1
        estado = "ya estaba" if pendientes == 0 else f"{pendientes} parches"
        print(f"  {f.name:<42} {estado}"
              + (f" ({hechos} ya hechos)" if hechos and pendientes else ""))
        # Un archivo con un ancla que no casa no se escribe a medias.
        if not seco and pendientes and len(fallos) == antes:
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
