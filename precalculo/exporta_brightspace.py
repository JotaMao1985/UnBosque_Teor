#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Banco de la Biblioteca de Preguntas de Brightspace desde los bancos del preparcial.

Lee los 59 ítems del instrumento —los 29 nuevos de `banco.js` y los 30 del
simulacro absorbido— **desde sus fuentes**, con el cargador de `_bancos.py`, que
es la convención de este repositorio: el HTML ensamblado es una copia y el
ensamblador se comprueba reproducible byte a byte, así que auditar la copia
sería auditar dos veces lo mismo por el lado flojo.

Cinco tipos de ítem y cinco destinos:

    opcion    ->  Multiple Choice
    multiple  ->  Multi-Select
    grafico   ->  Multiple Choice, con el canvas rasterizado a PNG
    numerica  ->  Multiple Choice, SOLO si el propio ítem publica sus distractores
    texto     ->  fuera: la Biblioteca de Preguntas no importa respuesta abierta

DE DÓNDE SALEN LOS GRÁFICOS, y por qué no se declaran a mano. El precedente de
Estadística Espacial declaraba la presentación de cada figura —qué serie, qué
color, qué trazo— y la contrastaba contra el `dibujar` real para que no
divergieran. Aquí no hace falta ninguna de las dos cosas: el doble de Chart.js
de `_bancos.py` ya **captura la configuración** que el `dibujar` construye, así
que se rasteriza esa, la de verdad. No hay una segunda declaración que pueda
desincronizarse porque no hay segunda declaración.

DE DÓNDE SALEN LOS DISTRACTORES DE LAS NUMÉRICAS. Brightspace no importa
respuesta numérica, así que una `numerica` solo viaja convertida en opción
múltiple, y para eso hacen falta resultados equivocados. **Ninguno se teclea
aquí**, y hay dos vías según lo que el material ya publique:

  1. **Citados del propio ítem.** Ocho retroalimentaciones nombran los errores
     típicos con su cifra —«si te salió 0,7831 aplicaste s/√n y olvidaste el
     fpc»—. La tabla `DISTRACTORES` solo dice cuál de los números de esa prosa
     es un resultado equivocado y qué error lo produce, y un guarda comprueba
     que la cifra **aparece literalmente** en el ítem.
  2. **Calculados en R.** Las otras siete no nombraban dos errores con cifra,
     así que sus distractores se calculan en `D$distractores` de cada
     precálculo, como cualquier otra cifra del material (D8). El mapa
     `CLAVES_R` dice qué bloque le toca a qué ítem, y el `correcto` del bloque
     se comprueba contra la respuesta del ítem: es lo que impide pegarle a un
     ítem los distractores de otro, que es un fallo sin síntoma —el banco
     importaría igual de bien, con tres cifras plausibles y explicaciones de
     otra pregunta—.

Todas las opciones de una numérica se escriben con **los mismos decimales**.
No es cosmética: una correcta con dos decimales entre distractores enteros se
reconoce sin leer el enunciado, que es la misma familia de defecto que §A1 del
plan —la correcta siempre en la (a)— y se arregla igual, quitando la señal.

Uso:

    python3 precalculo/exporta_brightspace.py --sonda

La salida no se versiona: es regenerable, como `items_corte1.json`.
"""

from __future__ import annotations

import argparse
import hashlib
import html as _html
import io
import json
import random
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "precalculo"))

import _bancos as B  # noqa: E402

CANDIDATOS_SKILL = [
    Path.home() / ".claude/skills/brightspace-elbosque/scripts",
    Path.home() / ".claude/plugins/cache/brightspace-elbosque/scripts",
]


def carga_d2l(ruta_skill: str | None):
    rutas = [Path(ruta_skill)] if ruta_skill else CANDIDATOS_SKILL
    for r in rutas:
        if (r / "d2l_items.py").exists():
            sys.path.insert(0, str(r))
            import d2l_items  # noqa: PLC0415
            return d2l_items, r
    sys.exit(
        "PARADO: no encuentro `d2l_items.py`, que es de la skill "
        "`brightspace-elbosque` y no de este repositorio.\n        Busqué en:\n          "
        + "\n          ".join(str(r) for r in rutas)
        + "\n        Pásame su carpeta con --skill <ruta>/scripts."
    )


# =====================================================================
# EL VOLCADO
#
# Es el de `extrae_items.py` más una cosa: la configuración de Chart.js que
# construye cada `dibujar`. El doble de `_bancos.py` ya la empuja a `registro`;
# aquí solo se recoge. Se comprueba que cada `dibujar` cree EXACTAMENTE un
# gráfico: si creara dos, rasterizar el primero publicaría media figura.
# =====================================================================
VUELCA = r"""
process.stdout.write(JSON.stringify(BANCO.map((p, i) => {
  const o = {
    i, tipo: p.tipo || null,
    ancla: p.ancla || null,
    dimension: p.dimension || null,
    pregunta: p.pregunta || null,
    pista: p.pista || null,
    alto: (p.alto === undefined ? null : p.alto),
    unidad: p.unidad || null,
    opciones: (p.opciones || []).map(x => ({
      texto: (x.texto === undefined ? null : x.texto),
      correcta: x.correcta === true,
      retro: x.retro || null
    })),
    respuesta: (p.respuesta === undefined ? null : p.respuesta),
    tolerancia: (p.tolerancia === undefined ? null : p.tolerancia),
    retroAcierto: p.retroAcierto || null,
    retroFallo: p.retroFallo || null,
    descripcionGrafico: p.descripcionGrafico || null,
    cfg: null, cfg_error: null
  };
  if (typeof p.dibujar === 'function') {
    const antes = registro.length;
    try {
      p.dibujar({});
      const nuevos = registro.slice(antes);
      if (nuevos.length !== 1) o.cfg_error = 'creó ' + nuevos.length + ' gráficos, no 1';
      else o.cfg = JSON.parse(JSON.stringify(nuevos[0]));
    } catch (e) { o.cfg_error = e.message; }
  }
  return o;
})));
"""


# =====================================================================
# LA PROSA: entidades, KaTeX y números
# =====================================================================
def a_texto(s: str | None) -> str:
    """Entidades HTML a caracteres reales.

    Hace falta porque `d2l_items.escapa` escapa el `&`: dejar un `&nbsp;` del
    material lo convertiría en `&amp;nbsp;` y el estudiante leería los siete
    caracteres en vez de un espacio. Deshacer y rehacer es el viaje correcto.
    """
    return _html.unescape(s or "")


_MATE = re.compile(r"\$([^$]+)\$")


def katex_a_mathjax(s: str) -> str:
    """`$…$` a `\\(…\\)`.

    Brightspace renderiza con MathJax, que por defecto NO trata el `$` como
    delimitador: sin esta conversión el estudiante lee el código fuente de cada
    fórmula. Es seguro porque en los 59 ítems los 552 delimitadores están
    emparejados, no hay ni un `$$` y ningún `<code>` lleva un `$` literal —
    comprobado antes de escribir esto, y `comprueba_delimitadores` lo revisa en
    cada ejecución por si el material cambia.
    """
    return _MATE.sub(r"\\(\1\\)", s)


def comprueba_delimitadores(textos: list[str]) -> None:
    for t in textos:
        if t.count("$") % 2:
            sys.exit(f"PARADO: delimitador `$` sin cerrar, y convertir a MathJax "
                     f"dejaría la fórmula rota:\n  {t[:200]}")
        if "$$" in t:
            sys.exit(f"PARADO: hay un bloque `$$…$$`, que esta conversión no "
                     f"contempla:\n  {t[:200]}")


# El material escribe los números a la española y a veces dentro de KaTeX:
# `6\,782\,857{,}14`, `1 067,1`, `0{,}7429`. Se normaliza a «6 782 857,14»
# antes de buscar, para que la búsqueda no dependa de si la cifra iba en
# fórmula o en prosa.
def normaliza_cifras(s: str) -> str:
    s = a_texto(s)
    s = s.replace("\\,", " ").replace("\;", " ").replace("\\ ", " ")
    s = s.replace("{,}", ",").replace("\u00a0", " ").replace("\u202f", " ")
    return re.sub(r"\s+", " ", s)


_NUM = re.compile(r"\d{1,3}(?: \d{3})+(?:,\d+)?|\d+(?:,\d+)?")


def numeros_de(prosa: str):
    """(literal, valor) de cada número de la prosa ya normalizada."""
    for m in _NUM.finditer(prosa):
        lit = m.group(0)
        try:
            yield lit, float(lit.replace(" ", "").replace(",", "."))
        except ValueError:
            continue


def literal_de(prosa: str, valor: float, tol: float) -> str | None:
    """Cómo escribe el material ese número. El MÁS CERCANO si hay varios.

    La opción correcta de una numérica no se formatea aquí: se copia de la
    prosa del propio ítem. Elegir el formato en este guion publicaría una cifra
    con más o menos decimales de los que el estudiante vio.

    Se ordena por distancia y no por longitud, y eso lo enseñó un defecto real:
    el ítem del tamaño de muestra responde 730 y su retroalimentación dice
    «729,5 → 730». Con tolerancia 0,5 los dos literales entran, y prefiriendo
    el más largo se publicaba **729,5 como opción correcta** — el valor sin
    redondear, que es justo el error que el ítem existe para cazar. La cifra
    exacta gana; la longitud solo desempata.
    """
    cands = [(abs(v - valor), -len(lit), lit) for lit, v in numeros_de(prosa)
             if abs(v - valor) <= tol]
    return min(cands)[2] if cands else None


# =====================================================================
# LOS DISTRACTORES DE LAS NUMÉRICAS
#
# Clave: (banco, índice del ítem). Valor: los resultados EQUIVOCADOS que la
# propia retroalimentación del ítem nombra, con el error que los produce.
# Ninguna cifra se calcula aquí; `comprueba_distractor` aborta si alguna no
# aparece literalmente en la prosa del ítem.
#
# Las numéricas que no están en esta tabla es porque su material nombra menos
# de dos errores con cifra. No se les inventa una.
# =====================================================================
DISTRACTORES = {
    ("simulacro", 14): [
        ("0,7831", "aplicar $s/\\sqrt{n}$ y olvidar el factor de población finita"),
        ("0,7048", "multiplicar por 0,9 <em>fuera</em> de la raíz, sobre $s/\\sqrt{n}$, "
                   "en vez de multiplicar la varianza"),
    ],
    ("simulacro", 16): [
        ("10", "quedarse en $n/N$: el fpc entra por la raíz, no directamente"),
        ("5,13", "calcular $1 - \\sqrt{0{,}9}$, el cambio en la dirección contraria"),
    ],
    ("simulacro", 22): [
        ("213", "calcular $n_0$ y quedarse ahí, sin corregir por población finita"),
        ("192", "redondear hacia abajo: un tamaño de muestra se redondea siempre "
                "hacia arriba, porque quedarse corto incumple el margen prometido"),
    ],
    ("simulacro", 23): [
        ("855", "quedarse en $n_0 = 854{,}1$ redondeado, sin aplicar la corrección"),
        ("1 067", "usar $p = 0{,}5$ por costumbre —el peor caso— cuando ya se tiene "
                  "un piloto que dice 0,2766"),
    ],
    ("preparcial", 6): [
        ("0,8043", "dar la <em>cobertura</em>, la proporción que sí está: falta "
                   "restarla de 1"),
        ("0,2434", "dividir los 156 excluidos entre los 641 del marco; el "
                   "denominador de la no cobertura es la población objetivo"),
    ],
    ("preparcial", 8): [
        ("2 470 000", "sumar lo observado sin expandir, que solo cuenta a dos "
                      "jugadores de cinco"),
        ("6 175 000", "repartir con una probabilidad media de 0,40 para los dos "
                      "—el estimador de expansión, insesgado solo bajo el MAS—"),
    ],
    ("preparcial", 9): [
        ("8,0505", "dividir entre $n - 1$ en vez de entre $n$: la suma de pesos da "
                   "805,05 y estima 805 jugadores donde hay 797"),
        ("0,12547", "invertir el peso, $d_k = n/N$, que ni siquiera tiene las "
                    "unidades correctas: su suma da 12,55"),
    ],
    ("preparcial", 11): [
        ("894 696,02", "olvidar el factor de población finita"),
        ("877 934,26", "usar $z = 2$ en vez de 1,96"),
    ],
}


# Las numericas que NO tienen dos errores con cifra en su prosa: sus
# distractores los calcula R, en `D$distractores` de cada precalculo, porque un
# distractor tecleado aqui seria una cifra a mano (D8). El mapa dice que bloque
# le toca a que item; `correcto` lo comprueba.
CLAVES_R = {
    ("simulacro", 8):    ("taller1",    "sesgoNoRespuesta"),
    ("simulacro", 15):   ("taller1",    "icSuperiorEstatura"),
    ("preparcial", 7):   ("preparcial", "piKlPar13"),
    ("preparcial", 10):  ("preparcial", "icSuperiorSalario"),
    ("preparcial", 12):  ("preparcial", "sumaPiKBernoulli"),
    ("preparcial", 13):  ("preparcial", "icSuperiorProporcion"),
    ("preparcial", 14):  ("preparcial", "varSistematicoPequeno"),
}

DATOS = {
    "preparcial": RAIZ / "precalculo" / "salidas" / "preparcial_datos.json",
    "taller1": RAIZ / "precalculo" / "salidas" / "taller1_recurso_datos.json",
}


def carga_precalculos() -> dict:
    salida = {}
    for nombre, ruta in DATOS.items():
        if not ruta.exists():
            sys.exit(f"PARADO: falta {ruta}. Regenera los precalculos con "
                     "`Rscript precalculo/genera_preparcial.R` y "
                     "`Rscript precalculo/genera_taller1_recurso.R`.")
        salida[nombre] = json.loads(ruta.read_text(encoding="utf-8"))
    return salida


def decimales_de(literal: str) -> int:
    return len(literal.split(",")[1]) if "," in literal else 0


def formatea(v: float, dec: int) -> str:
    """A la espanola: coma decimal y espacio de millares, como el material.

    TODAS las opciones de un item se escriben con los mismos decimales, y eso
    no es cosmetica: una correcta con dos decimales entre distractores enteros
    se reconoce sin leer el enunciado. Es la misma familia de defecto que §A1
    -la correcta siempre en la (a)- y se arregla igual, quitando la senal.
    """
    entero, _, decimal = f"{abs(v):.{dec}f}".partition(".")
    grupos = []
    while len(entero) > 3:
        grupos.insert(0, entero[-3:])
        entero = entero[:-3]
    grupos.insert(0, entero)
    texto = " ".join(grupos) + (f",{decimal}" if dec else "")
    return ("-" if v < 0 else "") + texto


def comprueba_citado(literal: str, prosa: str, clave) -> float:
    """Que la cifra la publique el material. Solo para los distractores citados."""
    if literal not in prosa:
        sys.exit(f"PARADO: el distractor «{literal}» de {clave} no aparece en la "
                 "retroalimentacion del item. Un distractor que el material no "
                 "publica es un numero escrito a mano, y el estudiante leeria "
                 "una explicacion de una cifra que no ha visto nunca.")
    return float(literal.replace(" ", "").replace(",", "."))


def crudos_de(q: dict, clave, prosa: str, precalculos: dict):
    """(valor, error) de cada distractor, venga de la prosa o de R."""
    if clave in DISTRACTORES:
        return [(comprueba_citado(lit, prosa, clave), err)
                for lit, err in DISTRACTORES[clave]], "citados del propio item"

    if clave in CLAVES_R:
        fuente, nombre = CLAVES_R[clave]
        bloque = (precalculos[fuente].get("distractores") or {}).get(nombre)
        if not bloque:
            sys.exit(f"PARADO: {clave} espera el bloque «{nombre}» en "
                     f"{DATOS[fuente].name} y no esta. Regenera ese precalculo.")
        # Esto es lo que impide pegarle a un item los distractores de otro: un
        # fallo sin sintoma, porque el banco se importaria igual de bien con
        # tres cifras plausibles y explicaciones de otra pregunta.
        if abs(bloque["correcto"] - q["respuesta"]) > q["tolerancia"]:
            sys.exit(f"PARADO: el bloque «{nombre}» dice que la respuesta es "
                     f"{bloque['correcto']} y el item {clave} responde "
                     f"{q['respuesta']}: o el mapa CLAVES_R apunta mal, o el "
                     "precalculo y el banco han dejado de hablar de lo mismo.")
        opciones = bloque["opciones"]
        if isinstance(opciones, dict):          # jsonlite colapsa la lista de 1
            opciones = [opciones]
        return [(float(o["valor"]), o["error"]) for o in opciones], \
               f"calculados en R ({nombre})"

    return None, None


def numerica_a_opciones(q: dict, clave, precalculos: dict):
    """Las opciones de una numerica convertida, o None si no hay distractores."""
    prosa = normaliza_cifras((q["retroAcierto"] or "") + " || " + (q["retroFallo"] or ""))
    literal = literal_de(prosa, q["respuesta"], q["tolerancia"])
    if literal is None:
        sys.exit(f"PARADO: {clave} es una numerica cuya retroalimentacion no "
                 f"contiene su propia respuesta ({q['respuesta']}), asi que no hay "
                 "forma de saber con que formato la escribe el material.")

    crudos, origen = crudos_de(q, clave, prosa, precalculos)
    if crudos is None:
        return None, None, None

    # CUANTOS DECIMALES. Manda el material: los que el propio item usa para su
    # respuesta, que son los que le pide al estudiante. Un distractor se escribe
    # con mas solo si el material lo cita con mas -«si te salio 0,175» pide tres,
    # y redondearlo a 0,18 dejaria una opcion que no es la cifra que su propia
    # explicacion nombra-. Al final se sube lo que haga falta para que no haya
    # dos opciones con el mismo texto.
    dec = decimales_de(literal)
    for valor, _ in crudos:
        citado = literal_de(prosa, valor, 5e-4)
        if citado is not None:
            dec = max(dec, decimales_de(citado))
    while dec <= 8:
        textos = [formatea(q["respuesta"], dec)] + [formatea(v, dec) for v, _ in crudos]
        if len(set(textos)) == len(textos):
            break
        dec += 1

    vistos = {round(q["respuesta"], 9)}
    ops = [{"texto": formatea(q["respuesta"], dec), "correcta": True,
            "retro": q["retroAcierto"]}]
    for valor, error in crudos:
        if abs(valor - q["respuesta"]) <= q["tolerancia"]:
            sys.exit(f"PARADO: el distractor {valor} de {clave} cae dentro de la "
                     f"tolerancia de la respuesta ({q['respuesta']} ± "
                     f"{q['tolerancia']}): serian dos opciones correctas.")
        if round(valor, 9) in vistos:
            sys.exit(f"PARADO: {clave} repite el distractor {valor}")
        vistos.add(round(valor, 9))
        ops.append({"texto": formatea(valor, dec), "correcta": False,
                    "retro": f"Sale de {error}. La respuesta es "
                             f"{formatea(q['respuesta'], dec)}"
                             f"{unidad_de(q)}. " + (q["retroFallo"] or "")})

    textos = [o["texto"] for o in ops]
    if len(set(textos)) != len(textos):
        sys.exit(f"PARADO: {clave} tiene dos opciones con el mismo texto tras "
                 f"redondear a {dec} decimales: {textos}")

    unidad = unidad_de(q)
    if unidad:
        for o in ops:
            o["texto"] += unidad
    return ops, formatea(q["respuesta"], dec), origen


def unidad_de(q: dict) -> str:
    u = q.get("unidad")
    return f" {u}" if u and u != "None" else ""


# =====================================================================
# LOS GRÁFICOS: se rasteriza la configuración REAL que construyó `dibujar`
# =====================================================================
def _color(c, por_defecto="#012820"):
    if not isinstance(c, str) or not c.startswith("#"):
        return por_defecto
    return c


def dibuja_config(cfg: dict, alto: int | None) -> bytes:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    datos = cfg.get("data") or {}
    datasets = datos.get("datasets") or []
    etiquetas = datos.get("labels") or []
    escalas = ((cfg.get("options") or {}).get("scales") or {})
    ex, ey = escalas.get("x") or {}, escalas.get("y") or {}
    categorico = bool(etiquetas) and (ex.get("type") != "linear")

    fig, ax = plt.subplots(figsize=(7.6, (alto or 230) / 100 + 0.6), dpi=200)

    barras = [d for d in datasets if d.get("type") == "bar"]
    idx_barra = 0
    for d in datasets:
        etq = d.get("label") or ""
        rot = etq if etq.strip() else None          # el motor filtra las vacías
        color = _color(d.get("borderColor"))
        fondo = _color(d.get("backgroundColor"), color)
        ancho_linea = d.get("borderWidth", 1.5)
        radio = d.get("pointRadius", 0)
        guion = d.get("borderDash") or []
        estilo = (0, tuple(guion)) if guion else "-"

        if d.get("type") == "bar":
            n = max(len(barras), 1)
            w = (0.9 * d.get("categoryPercentage", 0.9) / n) * d.get("barPercentage", 0.4) * 1.0
            desfase = (idx_barra - (n - 1) / 2) * (0.9 * d.get("categoryPercentage", 0.9) / n)
            x = [i + desfase for i in range(len(d["data"]))]
            ax.bar(x, d["data"], width=max(w, 0.05), color=fondo, label=rot, zorder=2)
            idx_barra += 1
            continue

        # línea
        # Un `null` en los datos es un HUECO, no un cero: el motor los dibuja
        # con `spanGaps: false`, de modo que la línea se parte ahí. En
        # matplotlib eso es un NaN, que también parte el trazo. Aplanarlos a
        # cero pintaría una caída hasta el eje que el estudiante no vio.
        crudo = [p for p in (d.get("data") or [])]
        primero = next((p for p in crudo if p is not None), None)
        if isinstance(primero, dict):
            xs = [(p or {}).get("x", float("nan")) for p in crudo]
            ys = [(p or {}).get("y", float("nan")) for p in crudo]
        else:
            xs = list(range(len(crudo)))
            ys = [float("nan") if p is None else p for p in crudo]
        xs = [float("nan") if v is None else v for v in xs]
        ys = [float("nan") if v is None else v for v in ys]

        if ancho_linea == 0 and radio:
            ax.plot(xs, ys, linestyle="none", marker="o", markersize=radio * 1.15,
                    color=color, label=rot, zorder=3)
            continue

        paso = "steps-mid" if d.get("stepped") else None
        ax.plot(xs, ys, color=color, linewidth=max(ancho_linea, 0.8), linestyle=estilo,
                drawstyle=paso, label=rot, zorder=3,
                marker="o" if radio else None, markersize=(radio or 0) * 1.15)
        if d.get("fill"):
            ax.fill_between(xs, ys, step="mid" if d.get("stepped") else None,
                            color=fondo, zorder=1)

    if categorico:
        ax.set_xticks(range(len(etiquetas)))
        ax.set_xticklabels([str(e) for e in etiquetas], fontsize=7.5)
    else:
        if ex.get("min") is not None or ex.get("max") is not None:
            ax.set_xlim(ex.get("min"), ex.get("max"))
    if ey.get("beginAtZero"):
        ax.set_ylim(bottom=0)

    for eje, sc in (("x", ex), ("y", ey)):
        t = (sc.get("title") or {})
        if t.get("display") and t.get("text"):
            (ax.set_xlabel if eje == "x" else ax.set_ylabel)(t["text"], fontsize=9)
    if any((d.get("label") or "").strip() for d in datasets):
        ax.legend(fontsize=8, frameon=False)
    ax.tick_params(labelsize=8)
    ax.grid(axis="y", color="#94a3b8", alpha=0.3, linewidth=0.6)
    ax.set_axisbelow(True)
    for lado in ("top", "right"):
        ax.spines[lado].set_visible(False)
    fig.tight_layout()
    buf = io.BytesIO()
    fig.savefig(buf, format="png")
    plt.close(fig)
    return buf.getvalue()


# =====================================================================
# EL ENUNCIADO
# =====================================================================
def enunciado(q: dict, con_pista: bool, img: str | None) -> str:
    partes = [f"<p>{katex_a_mathjax(a_texto(q['pregunta']))}</p>"]
    if img:
        alt = a_texto(q.get("descripcionGrafico") or "").replace('"', "'")
        partes.append(f'<p><img src="images/{img}" alt="{alt}" '
                      'style="max-width:100%;height:auto;"></p>')
    if con_pista and q.get("pista"):
        partes.append(f"<p><em>Pista:</em> {katex_a_mathjax(a_texto(q['pista']))}</p>")
    if q["tipo"] == "multiple":
        partes.append("<p><strong>Marca todas las que apliquen.</strong></p>")
    return "\n".join(partes)


def limpia(s: str | None) -> str:
    return katex_a_mathjax(a_texto(s or ""))


def titulo_plano(s: str) -> str:
    """El nombre del ítem en la Biblioteca de Preguntas, sin fórmulas.

    El título va en un atributo XML y la Biblioteca lo lista como texto: ahí no
    corre MathJax, así que `$p(s)$` se leería con los dólares puestos. Se
    quitan los delimitadores y se conserva el contenido —«El diseño muestral
    p(s)»—, que es legible tal cual. Si algún día un módulo se llamara
    `$\\pi_k$`, quitar los dólares dejaría «\\pi_k» en la lista, así que eso
    para el guion en vez de publicarlo.
    """
    def _dentro(m):
        cuerpo = m.group(1)
        if "\\" in cuerpo:
            sys.exit(f"PARADO: el título «{s}» lleva una fórmula con comandos de "
                     "KaTeX, y el nombre del ítem en la Biblioteca es texto plano: "
                     "se publicaría el código fuente. Reescribe el título del ancla.")
        return cuerpo
    return _MATE.sub(_dentro, a_texto(s))


# =====================================================================
def main() -> int:
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--salida", default="precalculo/salidas/brightspace")
    p.add_argument("--prefijo", default="MU_C1")
    p.add_argument("--titulo", default="Muestreo Estadístico · Preparcial del Corte I")
    p.add_argument("--skill", default=None)
    p.add_argument("--sin-pista", action="store_true")
    p.add_argument("--sonda", action="store_true",
                   help="paquete extra con un ítem de cada forma, para probar la "
                        "importación antes de subir el banco entero")
    a = p.parse_args()

    d2l, ruta_skill = carga_d2l(a.skill)
    precalculos = carga_precalculos()

    bancos = [("simulacro", B.banco_simulacro), ("preparcial", B.banco_preparcial)]
    crudos, imagenes, fuera, notas = [], {}, [], []

    for nombre, carga in bancos:
        items = carga(VUELCA)
        if not items:
            sys.exit(f"PARADO: el banco {nombre} carga y devuelve 0 ítems.")
        for q in items:
            clave = (nombre, q["i"])
            qid = f"{a.prefijo}_{nombre[:3].upper()}{q['i']:02d}"
            anc = q.get("ancla") or {}
            rotulo = (f"cap. {anc.get('cap')} · mód. {anc.get('modulo')} · {anc.get('titulo')}"
                      if anc else nombre)
            titulo = titulo_plano(f"{qid.split('_')[-1]} · {rotulo}")
            tipo, img = q["tipo"], None

            textos = [q.get(c) or "" for c in
                      ("pregunta", "pista", "retroAcierto", "retroFallo")]
            textos += [o.get(c) or "" for o in q["opciones"] for c in ("texto", "retro")]
            comprueba_delimitadores([a_texto(t) for t in textos])

            if tipo == "texto":
                fuera.append((qid, titulo, "respuesta abierta: la Biblioteca de "
                                           "Preguntas no importa este tipo"))
                continue

            if tipo == "numerica":
                ops, correcto, origen = numerica_a_opciones(q, clave, precalculos)
                if ops is None:
                    fuera.append((qid, titulo,
                                  "numérica sin distractores: ni su retroalimentación "
                                  "nombra dos errores con cifra ni el precálculo trae "
                                  "su bloque en `D$distractores`"))
                    continue
                notas.append(f"{qid} · numérica → {len(ops)} opciones, "
                             f"{origen} (correcta {correcto})")
            else:
                # Las de varias respuestas no llevan retroalimentación por
                # opción: en este motor la llevan por ítem, y por eso las 23
                # opciones de las cinco `multiple` viajarían mudas. Se reparte
                # la del ítem —la de acierto a las correctas, la de fallo a las
                # incorrectas—, que es prosa del propio material y no texto
                # escrito aquí. Es el mejor reparto disponible: dice por qué el
                # conjunto correcto es ese, que es lo que la pregunta enseña.
                por_defecto = {True: q.get("retroAcierto") or "",
                               False: q.get("retroFallo") or ""}
                ops = [{"texto": o["texto"], "correcta": bool(o["correcta"]),
                        "retro": (o.get("retro") or "").strip()
                                 or por_defecto[bool(o["correcta"])]}
                       for o in q["opciones"]]
                if not ops:
                    sys.exit(f"PARADO: {qid} es «{tipo}» y no trae opciones.")
                n_ok = sum(1 for o in ops if o["correcta"])
                if n_ok == 0:
                    sys.exit(f"PARADO: {qid} no tiene ninguna opción correcta.")
                if tipo == "opcion" and n_ok != 1:
                    sys.exit(f"PARADO: {qid} es de respuesta única y tiene {n_ok} correctas.")

            if tipo == "grafico":
                if q.get("cfg_error"):
                    sys.exit(f"PARADO: el `dibujar` de {qid} {q['cfg_error']}")
                if not q.get("cfg"):
                    sys.exit(f"PARADO: {qid} es de tipo grafico y no construyó ningún "
                             "gráfico; no hay figura que rasterizar.")
                if not (q.get("descripcionGrafico") or "").strip():
                    sys.exit(f"PARADO: {qid} lleva imagen y no trae descripción "
                             "accesible: viajaría sin `alt`.")
                img = f"{qid}.png"
                imagenes[f"images/{img}"] = dibuja_config(q["cfg"], q.get("alto"))

            ops = [{"texto": limpia(o["texto"]), "correcta": o["correcta"],
                    "retro": limpia(o["retro"])} for o in ops]

            # Orden barajado con semilla derivada del qid: el mismo banco dos
            # veces da el mismo ZIP, y el orden no es el de declaración —que en
            # el material fue SIEMPRE la (a) hasta que se barajó (§A1 del plan).
            random.Random(int(hashlib.sha256(qid.encode()).hexdigest()[:8], 16)).shuffle(ops)

            crudos.append({
                "qid": qid, "titulo": titulo,
                "enunciado_html": enunciado(q, not a.sin_pista, img),
                "opciones": ops,
                "tipo": d2l.MS if tipo == "multiple" else d2l.MC,
                "_forma": (tipo, img is not None)})

    if not crudos:
        sys.exit("PARADO: cero ítems. Un banco vacío se importa sin protestar y "
                 "deja el cuestionario sin preguntas.")

    def arma(seleccion):
        return [d2l.construye_item(
            qid=c["qid"], enunciado_html=c["enunciado_html"], opciones=c["opciones"],
            titulo=c["titulo"], pagina=n, tipo=c["tipo"])
            for n, c in enumerate(seleccion, 1)]

    salida = Path(a.salida)
    salida.mkdir(parents=True, exist_ok=True)
    zip_banco = salida / "banco_brightspace.zip"
    d2l.escribe_paquete(str(zip_banco), arma(crudos), a.titulo, imagenes=imagenes)

    zip_sonda = None
    if a.sonda:
        elegidos, vistos = [], set()
        for c in crudos:
            if c["_forma"] not in vistos:
                vistos.add(c["_forma"])
                elegidos.append(c)
        armados = arma(elegidos)
        img_sonda = {r: b for r, b in imagenes.items()
                     if any(r in it for it in armados)}
        zip_sonda = salida / "sonda_brightspace.zip"
        d2l.escribe_paquete(str(zip_sonda), armados, a.titulo + " · sonda",
                            imagenes=img_sonda)

    n_ms = sum(1 for c in crudos if c["tipo"] == d2l.MS)
    print(f"\nBanco: {zip_banco}  ({zip_banco.stat().st_size / 1024:.0f} KB)")
    if zip_sonda:
        print(f"Sonda: {zip_sonda}  ({zip_sonda.stat().st_size / 1024:.0f} KB) "
              f"— {len(elegidos)} ítems, uno de cada forma")
    print(f"Ítems: {len(crudos)}   Multiple Choice: {len(crudos) - n_ms}   "
          f"Multi-Select: {n_ms}   Imágenes: {len(imagenes)}")
    for n in notas:
        print(f"  · {n}")
    if fuera:
        print(f"\nFUERA DEL BANCO — {len(fuera)}, y se nombran para que el recorte "
              "no pase por silencio:")
        for qid, titulo, motivo in fuera:
            print(f"  · {qid}  {titulo}\n      {motivo}")
    print(f"\nAudita con:\n  python3 {ruta_skill / 'audita_paquete.py'} --zip {zip_banco}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
