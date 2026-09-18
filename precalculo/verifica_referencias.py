#!/usr/bin/env python3
"""Comprueba que cada «capítulo C, módulo N» apunte al módulo que la frase dice.

Por qué existe
--------------
El 2026-09-18, al pasar el capítulo 3 de 12 a 14 módulos, **ocho referencias
cruzadas quedaron apuntando a otro sitio** —cuatro en el cap. 4, tres en el 7 y
una dentro del propio 3—. Las ocho sobrevivieron a `verifica_bloques.py --prosa`
antes y después del cambio, y con razón: esa herramienta comprueba que las
CIFRAS salgan de una ejecución, y «módulo 8» es una cifra respaldada tanto si el
módulo 8 trata de lo que dice la frase como si trata de otra cosa. Las ocho las
encontró una persona leyendo.

Es la peor clase de defecto del material: **no deja rastro**. El enlace existe,
el número es plausible, la página carga, la consola está limpia y el estudiante
que lo sigue acaba en un módulo que habla de otro tema. Y aparece solo, sin que
nadie toque el capítulo afectado, cada vez que el capítulo de destino se
renumera.

Qué comprueba
-------------
  1. **Que el módulo exista.** «capítulo 3, módulo 15» en un capítulo de 14 es un
     error seguro, sin criterio humano de por medio.
  2. **Que el destino no haya cambiado bajo los pies.** `referencias_cruzadas.json`
     guarda, por referencia ya revisada, el TÍTULO del módulo al que apuntaba
     cuando se revisó. Si hoy resuelve a otro título, la referencia se rompió: es
     justo lo que pasó con las ocho de aquel día, y lo que esta comprobación
     habría cazado sola.
  3. **Que el título tenga algo que ver con la frase**, para las referencias
     nuevas que aún no están en la línea base. Es una ayuda, no un veredicto: se
     informa del solapamiento de palabras y decide una persona.

El punto 2 es el que de verdad cierra el hueco. Los puntos 1 y 3 solo adelantan
trabajo.

Uso:
    python3 precalculo/verifica_referencias.py              # todas las páginas
    python3 precalculo/verifica_referencias.py --pagina capitulo-4
    python3 precalculo/verifica_referencias.py --anota      # revisadas -> línea base

`--anota` escribe en la línea base lo que hoy resuelve. **Solo se ejecuta después
de revisar la salida a ojo**: si se anota sin mirar, se graba el error y la
herramienta deja de servir para siempre.
"""

import argparse
import html as html_mod
import json
import re
import sys
import unicodedata
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SITIO = RAIZ / "sitio" / "muestreo"
BASE = RAIZ / "precalculo" / "referencias_cruzadas.json"

# Las cuatro formas que existen en el material, medidas antes de escribir esto:
# 72 «capítulo C, módulo N», 22 «cap. C … módulo N», 7 «módulo N del capítulo C»,
# más la variante con paréntesis «capítulo 3 (módulo 11)», que el cap. 7 usa dos veces.
# 3 «su módulo N» y 2 «módulo N de este capítulo».
# El singular NO admite lista. Si lo admite, «el estratificado del módulo 3,
# 16 380» —donde 16 380 es un error estándar— se lee como «módulos 3 y 16», y la
# herramienta informa de un módulo 16 inexistente que nadie escribió. Medido.
# El `(?!\d+\s\d{3})` remata lo mismo por el otro lado: descarta el número que en
# realidad es la cabeza de una cifra con separador de millares.
#
# Va DELANTE de los dígitos, no detrás. Con `(?P<modsS>\d+)(?!\s\d{3})` la
# expresión retrocede: en «módulo 16 380», `\d+` prueba «16», el guarda ve « 380»
# y falla, así que reduce a «1», y entonces lo siguiente es «6» —no un espacio—,
# el guarda pasa y la herramienta informa de una referencia al módulo 1. Como el
# módulo 1 existe en todos los capítulos, se habría resuelto como correcta y la
# línea base la habría bendecido. Hoy no ocurre —0 casos en las 10 páginas— pero
# el agujero estaba abierto; anclado al inicio del número, no hay marcha atrás.
#
# La lista PLURAL admite glosas entre paréntesis en medio, porque el material
# escribe «módulos 2 y 4 (la razón linealizada y el término que se desprecia),
# 9 (dominios) y 12 (la mediana por Woodruff)» y sin esto la expresión cortaba en
# el primer paréntesis: el 9 y el 12 eran INVISIBLES, y así se publicaron dos
# referencias rotas que ninguna comprobación veía. La glosa solo se consume
# cuando lleva a otro número, nunca al final, para no mover la clave de las
# referencias que ya estaban revisadas. Medido sobre las 10 páginas: 412
# coincidencias antes y después, y una sola difiere —la del cap. 7, que gana el
# 9 y el 12—. La rama SINGULAR se deja como estaba a propósito: «el raking en el
# 7 (módulo 6)» del cap. 8 tiene un 7 que es un CAPÍTULO, y una regla de «número
# seguido de paréntesis» se lo comería.
#
# La glosa admite UN nivel de anidamiento porque el material escribe
# «la regresión con calibrate()». Con `\([^()]*\)` a secas, «módulos 6 (la
# regresión con calibrate()), 9 (dominios) y 11 (el GREG)» se trunca en el 6 y el
# 9 y el 11 vuelven a ser invisibles. Hoy no muerde —esa glosa está al final de su
# lista, donde no se consume, y sobre las 10 páginas las dos versiones dan 412
# coincidencias y 433 números idénticos— pero bastaría con mover la frase.
# El paréntesis de una glosa, con UN nivel de anidamiento («calibrate()»).
# Vive aquí y en ningún otro sitio: la usan REF_RE para atravesarla y
# referencias() para quitarla antes de contar números. Escrita dos veces se
# desincroniza sola, y las dos mitades tienen que decir lo mismo o la expresión
# atraviesa una glosa cuyos números luego se cuentan como módulos.
GLOSA = r'\((?:[^()]|\([^()]*\))*\)'
GLOSA_RE = re.compile(GLOSA)

REF_RE = re.compile(
    # «cap. 4, módulo 8» es tan frecuente como «capítulo 4, módulo 8» (22 veces
    # en el material). Sin la abreviatura, esas 22 se resuelven contra el capítulo
    # equivocado y la herramienta da por buenas referencias que apuntan a otro sitio.
    r'(?:\bcap(?:[íi]tulo)?s?\.?\s+(?P<capA>\d+)\s*[,(]\s*)?'   # «capítulo 3, módulo 9» y «capítulo 3 (módulo 11)»
    r'(?:m[óo]dulos\s+(?P<modsP>\d+(?:\s*(?:' + GLOSA + r'\s*)?(?:,|y|a)\s*(?!\d+\s\d{3})\d+)*)'
    r'|m[óo]dulo\s+(?P<modsS>(?!\d+\s\d{3})\d+))'
    r'(?:\s+(?:de|del)\s+(?:la\s+)?cap[íi]tulo\s+(?P<capB>\d+))?',
    re.I)

# Un «módulo N» sin capítulo explícito se resuelve contra el capítulo propio.
# Pero «aquel capítulo ya mostraba en SU módulo 10» habla de otro, y si se
# resuelve contra el propio puede caer en un módulo que existe y dar «correcto»
# —fue el caso de la cuarta referencia rota del cap. 4, la única de las ocho que
# no se cazó sola—. Cuando aparece una de estas señales, la referencia no se
# resuelve: se manda a revisar.
# La señal se busca en la FRASE, no en una ventana de N caracteres. Con ventana
# fija se escapa «El capítulo 3 ya estimó … y repitió la receta con los dominios
# (módulo 8) y con la mediana (módulo 11)»: el «capítulo 3» queda a unos 130
# caracteres del primer paréntesis, y el «módulo 8» resuelve contra el capítulo
# propio —que también tiene un 8— y pasa por bueno. Es un defecto real del cap. 7
# que sobrevivió a una revisión a mano y a la primera versión de esto.
AJENA_RE = re.compile(
    r'(?:aquel|ese|dicho)\s+cap[íi]tulo'
    r'|(?:su|aquel|ese|dicho|mismo)\s+$'
    r'|cap[íi]tulos?\.?\s+(\d+)', re.I)
FIN_FRASE_RE = re.compile(r'[.;:]\s')

PALABRA_RE = re.compile(r'[a-záéíóúñü]{5,}', re.I)
VACIAS = {
    'capitulo', 'modulo', 'modulos', 'entre', 'sobre', 'donde', 'porque', 'cuando',
    'desde', 'hasta', 'tambien', 'mismo', 'misma', 'estos', 'estas', 'aquel',
    'aquella', 'todos', 'todas', 'cada', 'entonces', 'entrada', 'salida',
}


def sin_tildes(s):
    return "".join(c for c in unicodedata.normalize("NFD", s.lower())
                   if unicodedata.category(c) != "Mn")


def modulos_de(ruta):
    """{numero: titulo} del courseData de una página."""
    t = ruta.read_text(encoding="utf-8")
    pares = re.findall(r'id:\s*(\d+),\s*title:\s*["\']([^"\']+)', t)
    if not pares:
        pares = re.findall(r'"id":\s*(\d+),\s*"title":\s*"([^"]+)"', t)
    return {int(n): html_mod.unescape(tit).strip() for n, tit in pares}


def paginas(sitio=None):
    sitio = sitio or SITIO
    if not sitio.is_dir():
        raise SystemExit(f"ABORTA: no encuentro {sitio}.")
    return sorted(p for p in sitio.glob("*.html"))


def indice_por_capitulo(rutas):
    """{3: Path(capitulo-3-…)} para resolver «capítulo 3»."""
    fuera = {}
    for p in rutas:
        m = re.match(r'capitulo-(\d+)-', p.name)
        if m:
            fuera[int(m.group(1))] = p
    return fuera


def prosa(ruta):
    """El texto que el estudiante lee, sin guiones, estilos ni bloques de código."""
    t = ruta.read_text(encoding="utf-8")
    t = re.sub(r'<script.*?</script>|<style.*?</style>|<pre.*?</pre>', ' ', t, flags=re.S)
    return re.sub(r'\s+', ' ', html_mod.unescape(re.sub(r'<[^>]+>', ' ', t)))


def ajena(antes, capitulo_propio):
    """¿La frase en curso habla de OTRO capítulo?"""
    cortes = list(FIN_FRASE_RE.finditer(antes))
    frase = antes[cortes[-1].end():] if cortes else antes
    otro = None
    for m in AJENA_RE.finditer(frase):
        n = m.group(1)
        if n is None:
            otro = otro or 0            # «su», «aquel capítulo»: ajeno, sin número
        elif capitulo_propio is None or int(n) != capitulo_propio:
            otro = int(n)
    return otro


# Un rango no son dos módulos, son todos los de en medio. «Capítulo 3, módulos
# 5 a 8» comprobaba M5 y M8 y se saltaba M6 y M7: una renumeración que moviera
# solo el centro pasaba callada, que es el fallo que esta herramienta existe
# para cazar. Y el extremo tampoco protege: el M8 del cap. 3 pasó de «Estimación
# en dominios» a «Un estimador distinto en cada grupo» sin que nada chistara,
# porque el extremo seguía EXISTIENDO.
#
# El tope evita convertir un error de lectura en una avalancha: si la expresión
# capturase alguna vez «módulos 3 a 16 380», expandir daría miles de
# comprobaciones falsas. Ningún capítulo pasa de 14 módulos, así que un rango
# más ancho que 20 no es un rango: es un fallo de captura, y se deja en sus dos
# extremos para que se vea.
TOPE_RANGO = 20


def numeros_de(crudo):
    """Los módulos que nombra una referencia; «5 a 8» son cuatro, no dos."""
    # Las glosas se quitan antes de contar, con la MISMA GLOSA_RE que usa
    # REF_RE. El orden importa tanto como la expresión: el material escribe
    # «módulo 2 ($7\,124$)», y contar sin limpiar daría los módulos 7 y 124,
    # que existen en varios capítulos y resolverían como correctos.
    piezas = re.findall(r'\d+|,|y|a', GLOSA_RE.sub(' ', crudo))
    fuera, rango = [], False
    for pieza in piezas:
        if not pieza.isdigit():
            rango = pieza == 'a'
            continue
        n = int(pieza)
        if rango and fuera and fuera[-1] < n <= fuera[-1] + TOPE_RANGO:
            fuera.extend(range(fuera[-1] + 1, n + 1))
        else:
            fuera.append(n)
        rango = False
    return fuera


def referencias(ruta, mods_propios, propio=None):
    """Cada referencia con su contexto, saltándose el cromo de los encabezados."""
    texto = prosa(ruta)
    fuera = []
    for m in REF_RE.finditer(texto):
        crudo = m.group('modsP') or m.group('modsS')
        # Las glosas entre paréntesis pueden traer cifras («calibrate()» no, pero
        # nada lo impide), y esas cifras no son módulos. Se quitan antes de contar.
        numeros = numeros_de(crudo)
        cap = m.group('capA') or m.group('capB')
        cap = int(cap) if cap else None
        despues = texto[m.end():m.end() + 90].strip()
        # Cromo: el encabezado de un módulo es «Módulo N <su propio título>».
        # No es una referencia a nada; es el módulo presentándose.
        if (cap is None and len(numeros) == 1
                and numeros[0] in mods_propios
                and sin_tildes(despues).startswith(sin_tildes(mods_propios[numeros[0]])[:16])):
            continue
        ini = max(0, m.start() - 150)
        fuera.append({
            "ref": re.sub(r'\s+', ' ', m.group(0)).strip(),
            "cap": cap,
            "numeros": numeros,
            "antes": texto[ini:m.start()].strip(),
            "despues": despues,
            "otro_cap": None if cap else ajena(texto[max(0, m.start() - 420):m.start()], propio),
        })
    return fuera


def clave(pagina, r):
    """Identifica una referencia de forma estable entre ejecuciones."""
    ancla = sin_tildes(r["antes"])[-70:]
    ancla = re.sub(r'[^a-z0-9 ]', '', ancla).strip()
    return f"{pagina}|{sin_tildes(r['ref'])}|{ancla}"


def solapamiento(titulo, r):
    """Cuántas palabras del título aparecen en LA FRASE de la referencia.

    El contexto se corta en los límites de la frase, y sobre todo hacia atrás: el
    sentido de «el módulo 7 explica de dónde sale» está en lo que SIGUE, y coger
    140 caracteres hacia atrás trae la frase anterior, que habla de otra cosa.
    Midiéndolo así salían 24 sugerencias de las que casi ninguna valía.
    """
    cortes = list(FIN_FRASE_RE.finditer(r["antes"]))
    antes = r["antes"][cortes[-1].end():] if cortes else r["antes"][-100:]
    fin = FIN_FRASE_RE.search(r["despues"])
    despues = r["despues"][:fin.start()] if fin else r["despues"]
    ctx = sin_tildes(antes + " " + despues)
    pal = {sin_tildes(p) for p in PALABRA_RE.findall(titulo)} - VACIAS
    if not pal:
        return None, 0, 0
    # Comparar por raíz corta: «dominios» casa con «dominio», «estratificado»
    # con «estratificar». Sin esto, la ayuda no ayuda.
    casan = {p for p in pal if p[:6] in ctx}
    return casan, len(casan), len(pal)


def mejor_encaje(mods, r, excluir):
    """¿Hay otro módulo de ese capítulo cuyo título encaje mejor con la frase?

    Solo se usa como PISTA en la cola de ambiguas, donde quien lee ya está
    mirando una referencia sin resolver. Se probó también como comprobación por
    su cuenta, sobre las 395 referencias del sitio, y se retiró: daba 11 avisos
    de los que casi ninguno valía. Una sección que grita en falso enseña a
    saltársela, y entonces tampoco se leen las que sí importan.
    """
    mejores = []
    for n, titulo in mods.items():
        if n == excluir:
            continue
        casan, c, tot = solapamiento(titulo, r)
        if c:
            mejores.append((c, n, titulo, casan))
    mejores.sort(reverse=True)
    return mejores[0] if mejores else None


def main():
    ap = argparse.ArgumentParser(
        description="Comprueba que cada «módulo N» apunte a donde dice la frase.")
    ap.add_argument("--pagina", action="append", default=[],
                    help="solo las páginas cuyo nombre contenga esto")
    ap.add_argument("--anota", action="store_true",
                    help="graba en la línea base lo que hoy resuelve (revisar ANTES)")
    ap.add_argument("--sitio", help="otra carpeta de páginas (para probar la herramienta "
                                    "contra un estado anterior del material)")
    ap.add_argument("--base", help="otro archivo de línea base")
    args = ap.parse_args()

    global BASE
    if args.base:
        BASE = Path(args.base)
    rutas = paginas(Path(args.sitio) if args.sitio else None)
    porcap = indice_por_capitulo(rutas)
    if args.pagina:
        rutas = [p for p in rutas if any(f in p.name for f in args.pagina)]
        if not rutas:
            raise SystemExit(f"ABORTA: ninguna página casa con {args.pagina}.")

    base = json.loads(BASE.read_text(encoding="utf-8")) if BASE.exists() else {}
    nueva_base = dict(base)
    rotas, inexistentes, nuevas, ambiguas, confirmadas = [], [], [], [], 0

    for ruta in rutas:
        mods_propios = modulos_de(ruta)
        if not mods_propios:
            continue
        mcap = re.match(r'capitulo-(\d+)-', ruta.name)
        propio = int(mcap.group(1)) if mcap else None
        for r in referencias(ruta, mods_propios, propio):
            otro = r.get("otro_cap")
            if otro is not None:
                # La frase habla de otro capítulo. Si lo nombra, se resuelve allí
                # y se dice qué encaja mejor; si no, se manda a revisar a secas.
                dest = porcap.get(otro) if otro else None
                pista = ""
                if dest:
                    mods_otro = modulos_de(dest)
                    n = r["numeros"][0]
                    tit = mods_otro.get(n, "(no existe)")
                    mejor = mejor_encaje(mods_otro, r, n)
                    _, c, tot = solapamiento(tit, r) if n in mods_otro else (None, 0, 0)
                    pista = f"si es del cap. {otro}: M{n} = {tit}"
                    if mejor and not c:
                        pista += f"  ←→  encaja mejor M{mejor[1]} = {mejor[2]} ({', '.join(sorted(mejor[3]))})"
                ambiguas.append((ruta.name, r["ref"], r["antes"][-110:], pista))
                continue
            destino_ruta = porcap.get(r["cap"]) if r["cap"] else ruta
            etiqueta = f"cap. {r['cap']}" if r["cap"] else "este capítulo"
            if destino_ruta is None:
                inexistentes.append((ruta.name, r["ref"], f"no hay página del capítulo {r['cap']}"))
                continue
            mods = modulos_de(destino_ruta) if destino_ruta != ruta else mods_propios
            for n in r["numeros"]:
                if n not in mods:
                    inexistentes.append((ruta.name, r["ref"],
                                         f"{etiqueta} no tiene módulo {n} (llega a {max(mods)})"))
                    continue
                titulo = mods[n]
                k = clave(ruta.name, r) + f"#{n}"
                previo = base.get(k)
                if previo is None:
                    casan, c, tot = solapamiento(titulo, r)
                    nuevas.append((ruta.name, r["ref"], etiqueta, n, titulo, c, tot,
                                   r["antes"][-90:]))
                    nueva_base[k] = titulo
                elif previo != titulo:
                    rotas.append((ruta.name, r["ref"], etiqueta, n, previo, titulo,
                                  r["antes"][-110:]))
                    nueva_base[k] = titulo
                else:
                    confirmadas += 1

    print(f"Referencias resueltas: {confirmadas + len(nuevas) + len(rotas)} "
          f"({confirmadas} ya revisadas, {len(nuevas)} nuevas, {len(rotas)} cambiadas)")

    if inexistentes:
        print(f"\n=== {len(inexistentes)} APUNTAN A UN MÓDULO QUE NO EXISTE ===")
        for pag, ref, motivo in inexistentes:
            print(f"  {pag}: «{ref}» — {motivo}")

    if rotas:
        print(f"\n=== {len(rotas)} CAMBIARON DE DESTINO (el capítulo se renumeró) ===")
        for pag, ref, etq, n, antes, ahora, ctx in rotas:
            print(f"  {pag}: «{ref}» → {etq} M{n}")
            print(f"      apuntaba a: {antes}")
            print(f"      ahora cae en: {ahora}")
            print(f"      …{ctx}")

    if nuevas:
        print(f"\n=== {len(nuevas)} SIN REVISAR (mira el título y decide) ===")
        for pag, ref, etq, n, titulo, c, tot, ctx in nuevas:
            señal = "·" if tot and c else "?"
            print(f"  {señal} {pag}: «{ref}» → {etq} M{n} = {titulo}"
                  + (f"   [{c}/{tot} palabras del título en la frase]" if tot else ""))
            print(f"      …{ctx}")

    if ambiguas:
        print(f"\n=== {len(ambiguas)} SIN CAPÍTULO CLARO (resuélvelas a ojo) ===")
        print("  Dicen «módulo N» pero el contexto habla de otro capítulo, así que")
        print("  resolverlas contra el propio daría un falso «correcto».")
        for pag, ref, ctx, pista in ambiguas:
            print(f"  {pag}: «{ref}»")
            if pista:
                print(f"      {pista}")
            print(f"      …{ctx}")

    if args.anota:
        BASE.write_text(json.dumps(nueva_base, ensure_ascii=False, indent=1,
                                   sort_keys=True) + "\n", encoding="utf-8")
        print(f"\nAnotadas {len(nueva_base)} referencias en "
              f"{BASE.relative_to(RAIZ)}. Revisa el diff antes de commitear.")

    return 1 if (rotas or inexistentes) else 0


if __name__ == "__main__":
    sys.exit(main())
