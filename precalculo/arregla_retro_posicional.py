#!/usr/bin/env python3
"""Quita de la retroalimentación toda referencia a la POSICIÓN de las opciones.

Por qué existe: el 2026-09-02 se retropropagó `barajaEstable` a la plantilla, los
ocho capítulos y el preparcial. Bien —desactiva la pista de que la correcta era
siempre la (a)—, pero el barajado alcanza también a los `multiple`, y 16 ítems
decían en su retro «Las tres primeras», «Son la primera, la segunda y la cuarta»
o «La tercera es falsa». Simulando `barajaEstable` con las preguntas reales, 21
de 22 referencias posicionales quedaban FALSAS: el ítem señalaba opciones que ya
no estaban ahí.

Este guion las reescribe para que nombren la opción por su CONTENIDO, que es lo
único que sobrevive a un barajado.

CADA ÍTEM VIVE EN DOS SITIOS y hay que tocar los dos: el HTML publicado
(`sitio/muestreo/capitulo-N-*.html`) y la fuente del ensamblador
(`ensamblado/modulos/capN/simuladores.js`). Tocar solo el HTML deja el arreglo a
merced del próximo `ensambla_capN.py`, que lo borraría sin avisar.

SEIS REFERENCIAS QUE NO SE TOCAN, revisadas una a una: no hablan de opciones.
  cap5[3]  «la primera unidad del conglomerado» — una unidad, no una opción.
  cap5[6]  «la PRIMERA etapa», «La primera no, pero la segunda sí» — etapas del
           diseño bietápico.
  cap6[8]  «PPT en la primera etapa» — etapa.
  cap7[1]  «la primera comprobación que se hace» — un hábito de trabajo.
  cap7[7]  «La tercera:», «La segunda:» — las BARRAS del gráfico, no las
           opciones; lo confirma su propia retro: «Mira la tercera barra».
  cap8[10] «En la segunda…» — la segunda ENCUESTA de las dos que se comparan.
  simulacro[17] «el intervalo de la primera» — la primera MUESTRA, no una opción.

    python3 precalculo/arregla_retro_posicional.py --simular   # no escribe
    python3 precalculo/arregla_retro_posicional.py

Aborta si una sustitución no aparece exactamente una vez en cada uno de sus dos
archivos: un reemplazo que no casa es un arreglo que se creyó hecho y no lo está.
"""
import argparse
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SITIO = RAIZ / "sitio" / "muestreo"
CAPS = {
    "cap1": "capitulo-1-encuestas-sesgos.html",
    "cap2": "capitulo-2-diseno-mas-sistematico.html",
    "cap3": "capitulo-3-razon-y-regresion.html",
    "cap4": "capitulo-4-muestreo-estratificado.html",
    "cap5": "capitulo-5-conglomerados.html",
    "cap6": "capitulo-6-probabilidades-desiguales.html",
    "cap7": "capitulo-7-encuestas-complejas.html",
    "cap8": "capitulo-8-no-respuesta-ponderacion.html",
}

# (banco, ítem, campo, texto viejo, texto nuevo)
CAMBIOS = [
 ("cap1", 2, "retroAcierto",
  "Las tres primeras. La cuarta es el reflejo que este capítulo existe para desactivar:",
  "Todas menos la de la muestra más grande, que es el reflejo que este capítulo existe para desactivar:"),
 ("cap1", 2, "retroFallo",
  "Son las tres primeras. El marco puede fallar por defecto",
  "Son las tres que describen un desajuste entre el marco y la población. El marco puede fallar por defecto"),
 ("cap1", 9, "retroAcierto",
  "Las tres primeras. La cuarta es la definición misma del error de muestreo,",
  "Todas menos la de la media que cambia de una muestra a otra: esa es la definición misma del error de muestreo,"),
 ("cap1", 9, "retroFallo",
  "Son las tres primeras. La variación de una muestra a otra es error de muestreo:",
  "Son las tres que no se reducen pagando más unidades. La variación de una muestra a otra es error de muestreo:"),
 ("cap2", 2, "retroAcierto",
  "Las dos primeras. Nada más: ni tamaño fijo,",
  "Solo que $\\pi_k > 0$ para toda unidad y que las $\\pi_k$ sean conocidas. Nada más: ni tamaño fijo,"),
 ("cap2", 2, "retroFallo",
  "Solo hacen falta las dos primeras. El tamaño fijo se necesita",
  "Solo hacen falta $\\pi_k > 0$ y que las $\\pi_k$ sean conocidas. El tamaño fijo se necesita"),
 ("cap2", 9, "retroAcierto",
  "Las tres primeras. El sistemático es un diseño de dos caras:",
  "Todas menos la del «siempre más preciso». El sistemático es un diseño de dos caras:"),
 ("cap2", 9, "retroFallo",
  "Las tres primeras son ciertas; la cuarta no. Todo depende del orden del marco:",
  "Las otras tres son ciertas; la del «siempre más preciso» no. Todo depende del orden del marco:"),
 ("cap3", 3, "retroAcierto",
  "Las tres primeras. El sesgo es una propiedad del",
  "Todas menos la de <code>survey</code>. El sesgo es una propiedad del"),
 ("cap3", 3, "retroFallo",
  "Son las tres primeras. Lo que no es cierto es lo último: <code>survey</code> calcula el mismo estimador,",
  "Son las tres que no mencionan el software. Lo que no es cierto es que <code>survey</code> elimine el sesgo: calcula el mismo estimador,"),
 ("cap3", 8, "retroAcierto",
  "Las tres primeras, y las tres se comprueban en el bloque de R del módulo:",
  "Todas menos la de $v_k = x_k^2$, y las tres verdaderas se comprueban en el bloque de R del módulo:"),
 ("cap3", 8, "retroFallo",
  "Son las tres primeras. Con $v_k = x_k^2$ sale la media de las razones individuales",
  "Son las tres que no usan $v_k = x_k^2$. Con esa elección sale la media de las razones individuales"),
 ("cap4", 3, "retroFallo",
  "Son la primera, la segunda y la cuarta. La tercera es falsa: ninguna asignación",
  "Son todas menos la del estimador sesgado. Esa es falsa: ninguna asignación"),
 ("cap4", 9, "retroAcierto",
  "Las tres verdaderas son el contrato completo. La tercera es justo lo que la postestratificación NO pide",
  "Las tres verdaderas son el contrato completo. Fijar los $n_h$ antes de sortear es justo lo que la postestratificación NO pide"),
 ("cap4", 9, "retroFallo",
  "Son la primera, la segunda y la cuarta. Fijar los $n_h$ antes es el estratificado de diseño;",
  "Son todas menos la de fijar los $n_h$ antes de sortear. Eso es el estratificado de diseño;"),
 ("cap5", 4, "retroAcierto",
  "y la correlación y–M como interruptor. La tercera es el espejismo del «n grande salva»,",
  "y la correlación y–M como interruptor. La de la convergencia con más nidadas es el espejismo del «n grande salva»,"),
 ("cap5", 4, "retroFallo",
  "Son la primera, la segunda y la cuarta. La tercera es exactamente lo que NO pasa:",
  "Son todas menos la de la convergencia con más nidadas. Eso es exactamente lo que NO pasa:"),
 ("cap5", 9, "retroFallo",
  "Son la primera, la segunda y la cuarta. La tercera exagera:",
  "Son todas menos la de eliminar el efecto de conglomerado. Esa exagera:"),
 ("cap6", 4, "retroAcierto",
  "Las tres primeras. La cuarta es la superstición que el módulo desmonta:",
  "Todas menos la de la garantía por correlación positiva, que es la superstición que el módulo desmonta:"),
 ("cap6", 4, "retroFallo",
  "Son las tres primeras. La cuarta es falsa y es la lección cara del módulo:",
  "Son las tres que no prometen garantías. La de la correlación positiva es falsa y es la lección cara del módulo:"),
 ("cap6", 9, "retroAcierto",
  "Las tres primeras. La cuarta es el pecado original del capítulo 1:",
  "Todas menos la del dataset sin ψ registradas, que es el pecado original del capítulo 1:"),
 ("cap6", 9, "retroFallo",
  "Son las tres primeras. La cuarta es falsa: los pesos de importancia son 1/ψ,",
  "Son las tres que hablan de una ψ conocida. La del dataset sin ψ es falsa: los pesos de importancia son 1/ψ,"),
 ("cap7", 2, "retroAcierto",
  "Las tres primeras. La cuarta es la idea que hay que desterrar:",
  "Todas menos la del deff que siempre crece, que es la idea que hay que desterrar:"),
 ("cap7", 2, "retroFallo",
  "Son las tres primeras. La cuarta es falsa y es la lección del módulo: los estratos reducen",
  "Son las tres que describen la descomposición. La del deff que siempre crece es falsa y es la lección del módulo: los estratos reducen"),
 ("cap7", 9, "retroAcierto",
  "Las tres primeras. La cuarta es la receta de cocina que el módulo desmonta:",
  "Todas menos la de la regla máx/mín > 40, que es la receta de cocina que el módulo desmonta:"),
 ("cap7", 9, "retroFallo",
  "Son las tres primeras. La cuarta convierte en regla mecánica lo que es una decisión",
  "Son las tres que describen lo que pasó al recortar. La de la regla máx/mín > 40 convierte en regla mecánica lo que es una decisión"),
 ("cap8", 2, "retroAcierto",
  "Las tres primeras. La cuarta es falsa: bajo MCAR la media de los respondientes",
  "Todas menos la de MCAR. Esa es falsa: bajo MCAR la media de los respondientes"),
 ("cap8", 2, "retroFallo",
  "Son las tres primeras. La cuarta describe justo lo contrario: MCAR es el único caso",
  "Son las tres que no hablan de MCAR. La de MCAR describe justo lo contrario: es el único caso"),
 ("cap8", 8, "retroAcierto",
  "Las tres primeras. La cuarta es falsa por la misma razón que en el ajuste de pesos:",
  "Todas menos la de MNAR. Esa es falsa por la misma razón que en el ajuste de pesos:"),
 ("cap8", 8, "retroFallo",
  "Son las tres primeras. La cuarta repite el error del módulo 3 en el terreno de la imputación:",
  "Son las tres que describen una propiedad de cada técnica. La de MNAR repite el error del módulo 3 en el terreno de la imputación:"),
]


# EL SIMULACRO NO SE TOCA DESDE AQUÍ. Sus cinco referencias posicionales se
# corrigieron el 2026-09-02 en `ensamblado/modulos/taller1/simulacro.js`, y la
# página se rehace con `ensambla_taller1.py`. Lo que había fallado no era el
# texto sino la SINCRONÍA: la fuente estaba arreglada a las 09:45 y la página
# publicada seguía siendo la de la noche anterior, con el texto viejo y sin
# barajar. Reensamblarla resolvió las dos cosas de una vez.


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--simular", action="store_true", help="comprueba sin escribir")
    args = ap.parse_args()

    destinos = {}
    for banco in sorted({c[0] for c in CAMBIOS}):
        destinos[banco] = [SITIO / CAPS[banco],
                           RAIZ / "ensamblado" / "modulos" / banco / "simuladores.js"]

    todos = [f for fs in destinos.values() for f in fs]
    textos = {f: f.read_text(encoding="utf-8") for f in todos}
    fallos, hechos = [], 0

    ya = 0
    for banco, i, campo, viejo, nuevo in CAMBIOS:
        for f in destinos[banco]:
            n, m = textos[f].count(viejo), textos[f].count(nuevo)
            if n == 0 and m >= 1:
                ya += 1           # ya aplicado: el guion se puede volver a correr
                continue
            if n != 1:
                fallos.append(f"{banco}[{i}].{campo}: aparece {n} veces en {f.name}"
                              f" y su reemplazo {m}, esperaba 1 y 0")
                continue
            textos[f] = textos[f].replace(viejo, nuevo)
            hechos += 1

    if fallos:
        print("NO SE ESCRIBE NADA. Sustituciones que no casan:", file=sys.stderr)
        for x in fallos:
            print(f"  ✗ {x}", file=sys.stderr)
        return 1

    print(f"{len(CAMBIOS)} referencias posicionales en "
          f"{len({(c[0], c[1]) for c in CAMBIOS})} ítems de capítulo · "
          f"{hechos} sustituciones nuevas, {ya} ya estaban, en {len(textos)} archivos")
    if args.simular:
        print("(--simular: no se ha escrito nada)")
        return 0
    for f, t in textos.items():
        f.write_text(t, encoding="utf-8")
    print("escrito")
    return 0


if __name__ == "__main__":
    sys.exit(main())
