#!/usr/bin/env python3
"""Prueba del motor de la autoevaluación: el mismo en todas las páginas, y sus cifras y ecos.

Por qué existe: la auditoría del M14 del cap. 3 (T7.87) encontró cuatro defectos
del motor que ninguna prueba miraba, porque las pruebas miraban los bancos:
cinco letras para seis opciones, «Casi» ante cualquier fallo, `parseFloat("308
904") = 308` con la respuesta pintada como «951» cuando se pedía 951,0, y el eco
«Correcto. Correcto:» en 74 retros de diez bancos. `retropropaga_motor_quiz.py`
los arregló. Esto comprueba que siguen arreglados, y en todas partes:

  1. **Un solo motor.** El de cada página es, carácter a carácter, el de la
     plantilla. Si una página se queda con el viejo, vuelve el «Casi» solo ahí.
  2. **Sin restos del viejo:** ni «Casi», ni `parseFloat` del campo, ni
     `${p.respuesta}` crudo, ni el `sinEco` local.
  3. **Las tres funciones, con casos.** `leeCifra`, `escribeCifra` y `sinEco`
     se extraen de la plantilla —el código publicado, no una réplica— y se
     prueban con las formas que teclea un estudiante.
  4. **Los diez bancos, con el código publicado.** En cada numérica, la
     respuesta que se enseña al fallar tiene los decimales que pide el
     enunciado («Da un decimal» → `decimales: 1`) y, leída de vuelta, cae dentro
     de la tolerancia. En cada retro del acierto, lo que queda tras `sinEco` no
     abre con un eco ni con minúscula, y ninguna abre con un eco que `sinEco` no
     sepa quitar («Correcto porque…»).

    python3 precalculo/pruebas/prueba_motor.py

Necesita node. No necesita R.
"""
import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(RAIZ / "precalculo"))
import _bancos as B  # noqa: E402

PLANTILLA = RAIZ / "plantilla" / "plantilla-capitulo-muestreo.html"
PAGINAS = sorted((RAIZ / "sitio" / "muestreo").glob("capitulo-*.html")) + [
    RAIZ / "sitio" / "muestreo" / "preparcial-corte-1.html"]
INICIO = "    // Autoevaluación (v2)"
FIN = "    // Ejercicios guiados: desplegables"
FUNCIONES = ("leeCifra", "escribeCifra", "sinEco")

NBSP, MENOS = " ", "−"
CASOS_LEE = [
    ("308,90", 308.9), ("308.90", 308.9), ("308 904", 308904),
    (f"308{NBSP}904,44", 308904.44), ("1.234,5", 1234.5), ("1,234.5", 1234.5),
    ("1.234.567", 1234567), ("1 234 567", 1234567), (f"{MENOS}19,32", -19.32),
    ("-19.32", -19.32), (" 0,196 ", 0.196), ("5,54 millones", 5.54),
    ("1,234", 1.234), ("abc", None), ("", None),
]
CASOS_ESCRIBE = [
    ((951, 1), "951,0"), ((308.9, 2), "308,90"), ((0.9866, None), "0,9866"),
    ((6782857.14, None), f"6{NBSP}782{NBSP}857,14"), ((-19.32, 2), f"{MENOS}19,32"),
    ((1067, 0), f"1{NBSP}067"), ((52, 1), "52,0"), ((-0.001, 2), "0,00"),
    ((0.196, 3), "0,196"), ((99.625, None), "99,625"), ((5, None), "5"),
]
CASOS_ECO = [
    ("Correcto: las dos campanas", "Las dos campanas"),
    ("Exacto. Duplicar las papeletas", "Duplicar las papeletas"),
    ("Exacto — y es el análogo ML", "Y es el análogo ML"),
    ("Correcto, y es al revés", "Y es al revés"),
    ("Sí: la varianza vive entre escuelas", "La varianza vive entre escuelas"),
    ("Eso es: $10{,}26$", "$10{,}26$"),
    ("Eso es lo que hay que leer aquí.", "Eso es lo que hay que leer aquí."),
    ("Esa es la trampa, y el capítulo", "Esa es la trampa, y el capítulo"),
    ("Cierto que no lo es", "Cierto que no lo es"),
    ("Las tres verdaderas", "Las tres verdaderas"),
    ("", ""),
]

# «Da un decimal», «Usa dos decimales», «Cuatro decimales.» · «Entero.»,
# «Redondea al entero», «Redondea hacia arriba» (un tamaño de muestra).
NUMEROS = {"un": 1, "una": 1, "dos": 2, "tres": 3, "cuatro": 4, "cinco": 5}
PIDE_DECIMALES = re.compile(r"\b(un|una|dos|tres|cuatro|cinco)\s+decimal(?:es)?\b", re.I)
PIDE_ENTERO = re.compile(r"\bentero\b|\bredondea\w*\s+hacia\s+arriba\b|\ba\s+la\s+unidad\b", re.I)
# Tras sinEco no puede quedar un eco; y uno de una palabra sin signo detrás
# («Correcto porque…») es uno que sinEco no sabe quitar. «Eso es lo que…» y
# «Esa es la trampa» son frases: no cuentan.
ECO_QUE_QUEDA = re.compile(
    r"^\s*(?:Exact[oa]|Correct[oa]|Eso es|Ésa es|Esa es|Así es|Cierto|Sí)\s*[.,:;!—–]")
ECO_SIN_SIGNO = re.compile(r"^\s*(?:Exact[oa]|Correct[oa]|Cierto|Sí)\b(?!\s*[.,:;!—–])")


def motor(texto):
    i, j = texto.find(INICIO), texto.find(FIN)
    return texto[i:j] if 0 <= i < j else None


def funciones(texto):
    piezas = [B.funcion(texto, n) for n in FUNCIONES]
    return None if None in piezas else "\n".join(piezas)


def revisa_paginas(plantilla, paginas):
    """1 y 2 · el mismo motor en todas, y sin restos del viejo."""
    f = []
    base = motor(plantilla)
    if base is None:
        return ["plantilla: no encuentro el motor de la autoevaluación"]
    for nombre, t in paginas:
        m = motor(t)
        if m is None:
            f.append(f"{nombre}: no encuentro el motor de la autoevaluación")
        elif m != base:
            f.append(f"{nombre}: su motor no es el de la plantilla "
                     "(¿falta ejecutar retropropaga_motor_quiz.py o reensamblar?)")
    for resto, por_que in [
            ("<strong>Casi", "«Casi» ante cualquier fallo"),
            ("parseFloat(String(input.value)", "parseFloat del campo: «308 904» da 308"),
            ("${p.respuesta}", "la respuesta pintada con el número de JavaScript"),
            ("const sinEco = s =>", "el sinEco local, que se comía «Eso es » de una frase")]:
        if resto in base:
            f.append(f"plantilla: queda {por_que}")
    return f


VUELCA_CASOS = """
const E = JSON.parse(process.argv[2]);
process.stdout.write(JSON.stringify({
  lee: E.lee.map(s => { const v = leeCifra(s); return Number.isFinite(v) ? v : null; }),
  escribe: E.escribe.map(([v, d]) => escribeCifra(v, d === null ? undefined : d)),
  eco: E.eco.map(s => sinEco(s))
}));
"""


def revisa_funciones(fuente):
    """3 · las tres funciones del motor publicado, con casos."""
    entrada = json.dumps({"lee": [c for c, _ in CASOS_LEE],
                          "escribe": [list(c) for c, _ in CASOS_ESCRIBE],
                          "eco": [c for c, _ in CASOS_ECO]})
    r = B.corre_node(fuente + VUELCA_CASOS, entrada)
    f = []
    for (c, esperado), obtenido in zip(CASOS_LEE, r["lee"]):
        if (esperado is None) != (obtenido is None) or (
                esperado is not None and abs(obtenido - esperado) > 1e-9):
            f.append(f"leeCifra({c!r}) = {obtenido}, y debía ser {esperado}")
    for (c, esperado), obtenido in zip(CASOS_ESCRIBE, r["escribe"]):
        if obtenido != esperado:
            f.append(f"escribeCifra{c} = {obtenido!r}, y debía ser {esperado!r}")
    for (c, esperado), obtenido in zip(CASOS_ECO, r["eco"]):
        if obtenido != esperado:
            f.append(f"sinEco({c!r}) = {obtenido!r}, y debía ser {esperado!r}")
    return f


def vuelca_bancos(fuente):
    """Los diez bancos, ejecutados con las funciones del motor publicado."""
    vuelca = fuente + """
process.stdout.write(JSON.stringify(BANCO.map((p, i) => {
  const o = { i, tipo: p.tipo || 'opcion', pregunta: p.pregunta || '' };
  if (o.tipo === 'numerica') {
    o.respuesta = p.respuesta; o.tolerancia = p.tolerancia;
    o.decimales = (p.decimales === undefined ? null : p.decimales);
    o.enseña = escribeCifra(p.respuesta, p.decimales);
    const v = leeCifra(o.enseña);
    o.releida = Number.isFinite(v) ? v : null;
  }
  const retros = [];
  if (p.retroAcierto) retros.push(['retroAcierto', p.retroAcierto]);
  (p.opciones || []).forEach((x, k) => {
    if (x.correcta && x.retro) retros.push(['opción ' + k, x.retro]);
  });
  o.retros = retros.map(([campo, v]) => ({ campo, antes: v, despues: sinEco(v) }));
  return o;
})));
"""
    items = []
    for clave in B.CAPITULOS:
        items += [dict(p, banco=clave) for p in B.banco_capitulo(clave, vuelca)]
    items += [dict(p, banco="simulacro") for p in B.banco_simulacro(vuelca)]
    items += [dict(p, banco="preparcial") for p in B.banco_preparcial(vuelca)]
    return items


def revisa_bancos(items):
    """4 · numéricas y ecos, ítem por ítem."""
    f = []
    quitados = 0
    for p in items:
        d = f"{p['banco']}[{p['i']}]"
        if p["tipo"] == "numerica":
            q = re.sub(r"<[^>]+>", "", p["pregunta"])
            m = PIDE_DECIMALES.search(q)
            pide = NUMEROS[m.group(1).lower()] if m else (0 if PIDE_ENTERO.search(q) else None)
            ense = p["enseña"]
            tiene = len(ense.split(",")[1]) if "," in ense else 0
            if p["decimales"] is not None and (not isinstance(p["decimales"], int) or p["decimales"] < 0):
                f.append(f"{d}: `decimales` tiene que ser un entero ≥ 0, y es {p['decimales']!r}")
            if pide is not None and tiene != pide:
                f.append(f"{d}: el enunciado pide {pide} decimal{'' if pide == 1 else 'es'} "
                         f"y al fallar se enseña «{ense}»: "
                         f"falta `decimales: {pide}`")
            if p["releida"] is None or abs(p["releida"] - p["respuesta"]) > p["tolerancia"]:
                f.append(f"{d}: «{ense}», leída de vuelta, da {p['releida']} y se sale de "
                         f"{p['respuesta']} ± {p['tolerancia']}")
        for r in p["retros"]:
            antes = re.sub(r"<[^>]+>", "", r["antes"])
            despues = r["despues"]
            if despues != r["antes"]:
                quitados += 1
            if ECO_QUE_QUEDA.match(re.sub(r"<[^>]+>", "", despues)):
                f.append(f"{d} {r['campo']}: tras sinEco sigue abriendo con un eco: «{despues[:40]}»")
            elif ECO_SIN_SIGNO.match(antes):
                f.append(f"{d} {r['campo']}: abre con un eco que sinEco no quita, sin signo "
                         f"detrás: «{antes[:40]}»")
            if re.match(r"[a-záéíóúüñ]", despues):
                f.append(f"{d} {r['campo']}: tras sinEco empieza en minúscula: «{despues[:40]}»")
    return f, quitados


def main():
    plantilla = PLANTILLA.read_text(encoding="utf-8")
    paginas = [(p.name, p.read_text(encoding="utf-8")) for p in PAGINAS]
    fallos = revisa_paginas(plantilla, paginas)
    fuente = funciones(plantilla)
    if fuente is None:
        fallos.append("plantilla: no encuentro leeCifra, escribeCifra y sinEco")
    else:
        fallos += revisa_funciones(fuente)
        items = vuelca_bancos(fuente)
        numericas = sum(1 for p in items if p["tipo"] == "numerica")
        if numericas < 30:
            fallos.append(f"solo recogí {numericas} numéricas; esperaba 38 o más")
        f, quitados = revisa_bancos(items)
        fallos += f
        print(f"{len(items)} ítems en {len(B.CAPITULOS) + 2} bancos · {numericas} numéricas · "
              f"{quitados} retros del acierto a las que sinEco quita el eco")
    print(f"{len(paginas)} páginas con el motor de la plantilla" if not any(
        "su motor no es" in x for x in fallos) else "")
    if fallos:
        print("\n".join(f"FALLO: {x}" for x in fallos))
        return 1
    print("prueba_motor: sin fallos")
    return 0


if __name__ == "__main__":
    sys.exit(main())
