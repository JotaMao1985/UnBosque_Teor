#!/usr/bin/env python3
"""Validación mecánica de TODOS los bancos de autoevaluación.

Por qué existe: `prueba_banco_taller1.py` protege 30 ítems —los del simulacro— y
lo hace bien. Los otros 88, los de los ocho capítulos, no tenían nada: son
JavaScript dentro de un HTML que nadie ejecuta hasta que un estudiante abre la
página, y para entonces el defecto ya está publicado. Esta prueba generaliza
aquella idea a los 118.

Lo que comprueba es lo que el motor NO protesta pero el estudiante sufre:

  * un `opcion` con dos correctas (no se puede acertar nunca) o con ninguna;
  * una opción sin `retro` (el estudiante falla y no se le explica por qué,
    que es justo el momento en que la autoevaluación tenía que enseñar algo);
  * un `numerica` sin `tolerancia`, o con una tan ancha que acierta quien se
    equivoca;
  * un `texto` sin respuesta modelo o sin sus tres puntos de comprobación:
    el tipo entero deja de funcionar, porque su corrección es esa lista;
  * un `grafico` cuyo `dibujar` lanza —el ítem sale en blanco y los demás
    siguen perfectos— o sin `descripcionGrafico`, que es lo único que tiene
    quien no ve el canvas;
  * un `$` sin cerrar, que deja KaTeX a medias en mitad de un enunciado;
  * un `modulo` que no existe en el capítulo: el resumen final del quiz
    manda al estudiante a repasar un módulo inexistente;
  * dos ítems con el mismo enunciado dentro de un banco;
  * y el defecto de BANCO que encontró la auditoría del 2026-09-02: que la
    opción correcta sea sistemáticamente la más larga. Ítem por ítem no es
    nada —la correcta suele necesitar el matiz—, pero repetido en todo un
    banco es una heurística de examen que permite acertar sin leer el
    contenido, y solo se ve contando.

Lo que NO comprueba, a propósito: si el ítem es BUENO. Si sus distractores son
plausibles, si el enunciado plantea un problema o pide recitar, si hay reto
interpretativo. Eso no lo decide una regla, y fingir que sí sería peor que no
tenerlo: va en la auditoría de juicio, con `rubrica_items.md`.

    python3 precalculo/pruebas/prueba_bancos.py
    python3 precalculo/pruebas/prueba_bancos.py --corte1

Necesita node. No necesita R.
"""
import argparse
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import _bancos as B
from extrae_items import recoge

TIPOS = {"opcion", "multiple", "numerica", "texto", "grafico"}
# Los tipos de una sola respuesta correcta entre opciones.
UNICA = {"opcion", "grafico"}
ETIQUETAS = ("strong", "em", "code", "sub", "sup")


def campos_texto(p):
    """Todo lo que el estudiante llega a leer, con su nombre para el informe."""
    c = {"pregunta": p["pregunta"], "pista": p["pista"],
         "retroAcierto": p["retroAcierto"], "retroFallo": p["retroFallo"],
         "respuestaModelo": p["respuestaModelo"]}
    for i, o in enumerate(p["opciones"]):
        c[f"opciones[{i}].texto"] = o["texto"]
        c[f"opciones[{i}].retro"] = o["retro"]
    for i, f in enumerate(p["comprobacion"] or []):
        c[f"comprobacion[{i}]"] = f
    return {k: v for k, v in c.items() if v}


def revisa(p, ids_modulo):
    """Los fallos de un ítem. Lista vacía = el ítem está mecánicamente sano."""
    f = []
    d = f"{p['banco']}[{p['i']}]"

    if p["tipo"] not in TIPOS:
        f.append(f"{d}: tipo desconocido {p['tipo']!r}")
        return f
    if not p["pregunta"]:
        f.append(f"{d}: sin enunciado")
    if not p["pista"]:
        f.append(f"{d}: sin pista")

    n_correctas = sum(1 for o in p["opciones"] if o["correcta"])

    if p["tipo"] in UNICA:
        if len(p["opciones"]) < 3:
            f.append(f"{d}: solo {len(p['opciones'])} opciones")
        if n_correctas != 1:
            f.append(f"{d}: {n_correctas} opciones correctas, debe haber 1")
        for i, o in enumerate(p["opciones"]):
            if not o["retro"]:
                f.append(f"{d}: opciones[{i}] sin retro — el estudiante falla sin saber por qué")

    if p["tipo"] == "multiple":
        if n_correctas == 0:
            f.append(f"{d}: ninguna opción correcta")
        if n_correctas == len(p["opciones"]):
            f.append(f"{d}: TODAS las opciones son correctas — no hay distractor")
        if not (p["retroAcierto"] and p["retroFallo"]):
            f.append(f"{d}: multiple sin retroAcierto/retroFallo")

    if p["tipo"] == "numerica":
        if not isinstance(p["respuesta"], (int, float)):
            f.append(f"{d}: respuesta no numérica ({p['respuesta']!r})")
        elif not isinstance(p["tolerancia"], (int, float)) or p["tolerancia"] <= 0:
            f.append(f"{d}: tolerancia ausente o no positiva ({p['tolerancia']!r})")
        elif p["respuesta"] and abs(p["tolerancia"] / p["respuesta"]) > 0.5:
            # Umbral heurístico, no ley: un enunciado que pide un orden de
            # magnitud («aproximadamente», «del orden de») justifica una
            # tolerancia ancha. Por eso el mensaje pide revisión, no declara
            # el defecto: la herramienta señala, la persona decide.
            f.append(f"{d}: tolerancia {p['tolerancia']} sobre respuesta {p['respuesta']}"
                     f" (>50 %) — revisar a mano si es deliberado")
        if not (p["retroAcierto"] and p["retroFallo"]):
            f.append(f"{d}: numerica sin retroAcierto/retroFallo")

    if p["tipo"] == "texto":
        if not p["respuestaModelo"]:
            f.append(f"{d}: texto sin respuestaModelo — el tipo no funciona sin ella")
        if len(p["comprobacion"] or []) != 3:
            f.append(f"{d}: comprobacion con {len(p['comprobacion'] or [])} puntos, deben ser 3")

    if p["tipo"] == "grafico":
        if p["dibuja"] != "ok":
            f.append(f"{d}: el gráfico lanza — {p['dibuja']}")
        if not p["descripcionGrafico"]:
            f.append(f"{d}: sin descripcionGrafico — nada para quien no ve el canvas")

    for nombre, v in campos_texto(p).items():
        v = str(v)
        if v.count("$") % 2:
            f.append(f"{d}: {nombre} deja un $ sin cerrar (KaTeX a medias)")
        for et in ETIQUETAS:
            if len(re.findall(rf"<{et}[ >]", v)) != len(re.findall(rf"</{et}>", v)):
                f.append(f"{d}: {nombre} desbalancea <{et}>")

    # Con `barajaEstable` en la plantilla y los ocho capítulos, una retro que
    # nombra posiciones no es un detalle de estilo: señala una opción que ya no
    # está donde dice. Es fallo, no aviso.
    if baraja(p["banco"]) and nombra_posiciones(p) \
            and (p["banco"], p["i"]) not in POSICIONALES_REVISADAS:
        f.append(f"{d}: la retroalimentación nombra posiciones y la página baraja"
                 f" — señalaría una opción que no está ahí")

    if ids_modulo is not None and p["modulo"] not in ids_modulo:
        f.append(f"{d}: modulo {p['modulo']} no existe en el capítulo "
                 f"— el resumen manda a repasar algo que no está")
    return f


ORDINAL = re.compile(
    r"\b(?:la|las|el|los|esa|esas|ese|esos)\s+(?:primera|segunda|tercera|cuarta|quinta|"
    r"dos primeras|tres primeras|dos últimas|última)\b", re.I)

# Referencias posicionales revisadas a mano el 2026-09-02 que NO hablan de
# opciones y por eso sobreviven al barajado. Se listan una a una, con lo que
# nombran, porque una lista de excepciones sin motivo se convierte en el sitio
# donde se esconden los defectos de verdad.
POSICIONALES_REVISADAS = {
    ("cap3", 8): "«hasta la última cifra» — un dígito",
    ("cap5", 3): "«la primera unidad del conglomerado» — una unidad",
    ("cap5", 6): "«la PRIMERA etapa» — una etapa del diseño",
    ("cap6", 8): "«PPT en la primera etapa» — una etapa",
    ("cap7", 1): "«la primera comprobación que se hace» — un hábito",
    ("cap7", 7): "«La tercera:», «La segunda:» — las BARRAS del gráfico",
    ("cap8", 10): "«En la segunda…» — la segunda encuesta comparada",
    ("simulacro", 17): "«el intervalo de la primera» — la primera muestra",
}


def baraja(banco):
    """¿La página de ese banco baraja las opciones al pintarlas?

    Importa para leer la posición: en una página con `barajaEstable` el orden de
    la fuente no es el que ve el estudiante, y avisar de que «la correcta es
    siempre la primera» sería una falsa alarma. En una que no baraja, ese orden
    ES el que ve, y entonces sí es un defecto.
    """
    if banco == "simulacro":
        ruta = B.SITIO / "taller-1-preparacion-parcial-1.html"
    elif banco == "preparcial":
        ruta = B.SITIO / "preparcial-corte-1.html"
    else:
        ruta = B.CAPITULOS.get(banco)
    return bool(ruta and ruta.exists() and "barajaEstable" in ruta.read_text(encoding="utf-8"))


def posicion_de_la_correcta(items, banco):
    """¿En qué posición cae la correcta? Contado sobre el banco.

    El motor pinta `p.opciones` en orden de fuente —`p.opciones.map((op, j) …)`,
    sin barajar, comprobado en `renderAutoevaluacion`—, así que la posición del
    banco ES la que ve el estudiante. La auditoría del 2026-09-02 la midió en
    los 68 ítems de respuesta única del material: la correcta era la primera en
    los 68. Quien pulse siempre el primer botón acierta todo sin leer.
    """
    ps = [p for p in items if p["banco"] == banco and p["tipo"] in UNICA]
    cuenta = {}
    for p in ps:
        for j, o in enumerate(p["opciones"]):
            if o["correcta"]:
                cuenta[j] = cuenta.get(j, 0) + 1
                break
    return len(ps), cuenta


def nombra_posiciones(p):
    """¿La retroalimentación de este ítem nombra posiciones ('Las tres primeras')?

    Importa para el arreglo, no para el defecto: barajar las opciones es la
    respuesta natural a la pista de posición, pero rompe estos ítems, cuya
    retro dejaría de describir lo que el estudiante tiene delante. Hay que
    reescribirlos ANTES de barajar, no después.
    """
    campos = [p["retroAcierto"], p["retroFallo"]]
    campos += [o["texto"] for o in p["opciones"]] + [o["retro"] for o in p["opciones"]]
    return any(v and ORDINAL.search(re.sub(r"<[^>]+>", "", v)) for v in campos)


def pista_de_longitud(items, banco):
    """La correcta, ¿es la opción más larga? Contado sobre el banco entero.

    Un solo ítem así no dice nada. Un banco donde pasa en más de dos tercios de
    los ítems regala la respuesta a quien conozca la heurística: la auditoría
    lo midió en 62 de 68 ítems (91 %) del material de Muestreo.
    """
    ps = [p for p in items if p["banco"] == banco and p["tipo"] in UNICA]
    largos = lambda h: len(re.sub(r"<[^>]+>", "", h or ""))
    n, mas_larga, ratios = 0, 0, []
    for p in ps:
        cor = [largos(o["texto"]) for o in p["opciones"] if o["correcta"]]
        inc = [largos(o["texto"]) for o in p["opciones"] if not o["correcta"]]
        if not cor or not inc:
            continue
        n += 1
        ratios.append(cor[0] / max(inc))
        mas_larga += cor[0] > max(inc)
    if not n:
        return None
    return n, mas_larga, sum(ratios) / len(ratios)


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--corte1", action="store_true", help="solo cap1, cap2 y el simulacro")
    args = ap.parse_args()

    claves = B.CORTE_I if args.corte1 else tuple(B.CAPITULOS)
    try:
        items = recoge(claves)
    except B.Fallo as e:
        print(f"FALLO cargando los bancos: {e}", file=sys.stderr)
        return 1

    # En el simulacro `modulo` es la semana, no un módulo del capítulo.
    ids = {c: {i for i, _ in B.modulos(c)} for c in claves}
    fallos = []
    for p in items:
        fallos += revisa(p, ids.get(p["banco"]))

    # Enunciados repetidos dentro de un mismo banco.
    vistos = {}
    for p in items:
        clave = (p["banco"], B.limpia(p["pregunta"]))
        if clave in vistos:
            fallos.append(f"{p['banco']}[{p['i']}]: mismo enunciado que [{vistos[clave]}]")
        vistos[clave] = p["i"]

    print(f"{len(items)} ítems revisados en {len(claves) + 2} bancos.\n")

    print("¿En qué POSICIÓN cae la opción correcta, en la fuente?")
    tot = {}
    tot_n = 0
    for banco in list(claves) + ["simulacro", "preparcial"]:
        n, cuenta = posicion_de_la_correcta(items, banco)
        if not n:
            continue
        tot_n += n
        for k, v in cuenta.items():
            tot[k] = tot.get(k, 0) + v
        detalle = "  ".join(f"pos{k + 1}: {cuenta.get(k, 0):2d}" for k in range(4))
        if baraja(banco):
            aviso = "  · la página baraja: el estudiante no ve este orden"
        elif cuenta.get(0, 0) == n:
            aviso = "  ← SIEMPRE LA PRIMERA, y la página NO baraja"
        else:
            aviso = "  ← la página no baraja"
        print(f"  {banco:10s} n={n:2d}   {detalle}{aviso}")
    if tot_n:
        sin_barajar = [b for b in list(claves) + ["simulacro", "preparcial"] if not baraja(b)]
        print(f"  (orden de la fuente; al azar serían {tot_n / 4:.1f} en cada posición)")
        if sin_barajar:
            pendientes = [f"{p['banco']}[{p['i']}]" for p in items
                          if p["banco"] in sin_barajar and nombra_posiciones(p)]
            print(f"  Páginas que NO barajan: {', '.join(sin_barajar)}."
                  f" Antes de barajarlas hay que reescribir {len(pendientes)} ítems"
                  f" que nombran posiciones: {', '.join(pendientes)}")
        print()

    print("La correcta, ¿es la opción más larga? (defecto de banco, no de ítem)")
    tot_n = tot_larga = 0
    for banco in list(claves) + ["simulacro", "preparcial"]:
        r = pista_de_longitud(items, banco)
        if not r:
            continue
        n, larga, ratio = r
        tot_n += n
        tot_larga += larga
        aviso = "  ← regala la respuesta" if larga / n > 0.7 else ""
        print(f"  {banco:10s} {larga:2d} de {n:2d}   ratio medio {ratio:.2f}{aviso}")
    if tot_n:
        print(f"  {'TOTAL':10s} {tot_larga:2d} de {tot_n:2d}   "
              f"({100 * tot_larga / tot_n:.0f} % de los ítems de respuesta única)\n")
    if fallos:
        for x in fallos:
            print(f"  ✗ {x}")
        print(f"\n{len(fallos)} fallo(s) mecánico(s).")
        return 1
    print("Sin fallos mecánicos.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
