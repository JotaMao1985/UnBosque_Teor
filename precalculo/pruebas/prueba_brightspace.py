#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Audita el CONTENIDO del banco QTI, que es lo que el auditor de la skill no ve.

`audita_paquete.py` comprueba que el paquete este bien HECHO —XML valido, una
sola correcta por Single, identificadores sin repetir, imagenes integras,
retros enlazadas—. Nada de eso mira si lo que dice es verdad.

Esta prueba mira lo que la exportacion ANADE sobre el material, que es
exactamente donde puede haberse inventado algo:

  B  las numericas convertidas: la correcta es la respuesta del banco, los
     distractores caen fuera de la tolerancia, ningun texto se repite y todas
     las opciones de un item llevan los mismos decimales
  C  los distractores calculados en R, recomputados por SEGUNDA VIA aqui,
     desde el JSON publicado y sin tocar el bloque `distractores`
  D  el barajado: la correcta repartida entre las posiciones, con chi-cuadrado
  E  la longitud: que la correcta no sea sistematicamente la mas larga (§A1)
  F  las formulas: delimitadores de MathJax emparejados, ni un `$` suelto y
     ningun comando fuera del vocabulario que MathJax trae de serie
  G  las imagenes: toda `<img src>` existe en el ZIP y todo PNG del ZIP se usa

    python3 precalculo/pruebas/prueba_brightspace.py
"""
import json
import math
import re
import sys
import zipfile
from collections import Counter
from html import unescape
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(RAIZ / "precalculo"))
import _bancos as B  # noqa: E402
import exporta_brightspace as X  # noqa: E402

ZIP = RAIZ / "precalculo" / "salidas" / "brightspace" / "banco_brightspace.zip"

fallos, avisos = [], []


def mal(msg):
    fallos.append(msg)


def ojo(msg):
    avisos.append(msg)


# ---------------------------------------------------------------- el paquete
def lee_paquete():
    if not ZIP.exists():
        sys.exit(f"PARADO: no existe {ZIP}. Corre primero "
                 "`python3 precalculo/exporta_brightspace.py --sonda`.")
    z = zipfile.ZipFile(ZIP)
    xml = [z.read(n).decode("utf-8") for n in z.namelist()
           if n.endswith("questiondb.xml")][0]
    imgs = {n for n in z.namelist() if n.startswith("images/")}
    items = {}
    for label, cuerpo in re.findall(r'<item [^>]*label="([^"]+)"[^>]*>(.*?)</item>',
                                    xml, re.S):
        mats = [unescape(m) for m in re.findall(r"<mattext[^>]*>(.*?)</mattext>",
                                                cuerpo, re.S)]
        ids = re.findall(r'<response_label ident="([^"]+)"', cuerpo)
        buenas = set()
        for cond in re.findall(r"<respcondition.*?</respcondition>", cuerpo, re.S):
            sv = re.search(r"<setvar[^>]*>([\d.]+)</setvar>", cond)
            if sv and float(sv.group(1)) > 0:
                buenas |= set(re.findall(r"<varequal[^>]*>([^<]+)</varequal>", cond))
        items[label] = {
            "enunciado": mats[0] if mats else "",
            "opciones": [{"texto": t, "correcta": i in buenas}
                         for i, t in zip(ids, mats[1:1 + len(ids)])],
        }
    return xml, imgs, items


# ------------------------------------------------------------- los dos bancos
def lee_bancos():
    fuente = {}
    for nombre, carga in (("simulacro", B.banco_simulacro),
                          ("preparcial", B.banco_preparcial)):
        for q in carga(X.VUELCA):
            fuente[f"MU_C1_{nombre[:3].upper()}{q['i']:02d}"] = (nombre, q)
    return fuente


def valor_de(texto):
    """El numero de una opcion, sin su unidad."""
    t = texto.strip()
    m = re.match(r"^-?\d{1,3}(?: \d{3})*(?:,\d+)?|^-?\d+(?:,\d+)?", t)
    if not m:
        return None, None
    lit = m.group(0)
    return float(lit.replace(" ", "").replace(",", ".")), lit


# =====================================================================
def main():
    xml, imgs, items = lee_paquete()
    fuente = lee_bancos()
    pre = json.loads((RAIZ / "precalculo/salidas/preparcial_datos.json").read_text("utf-8"))
    tal = json.loads((RAIZ / "precalculo/salidas/taller1_recurso_datos.json").read_text("utf-8"))

    print(f"\n  Auditando el contenido de {ZIP.name}: {len(items)} ítems\n")

    # ---- B. las numericas convertidas ------------------------------------
    numericas = 0
    for label, it in items.items():
        if label not in fuente:
            mal(f"B · {label} no corresponde a ningún ítem de los bancos")
            continue
        nombre, q = fuente[label]
        if q["tipo"] != "numerica":
            continue
        numericas += 1
        tol = q["tolerancia"]
        decs, vistos = set(), set()
        for o in it["opciones"]:
            v, lit = valor_de(o["texto"])
            if v is None:
                mal(f"B · {label}: la opción «{o['texto']}» no empieza por un número")
                continue
            decs.add(len(lit.split(",")[1]) if "," in lit else 0)
            if round(v, 9) in vistos:
                mal(f"B · {label}: dos opciones con el valor {v}")
            vistos.add(round(v, 9))
            dentro = abs(v - q["respuesta"]) <= tol
            if o["correcta"] and not dentro:
                mal(f"B · {label}: la correcta vale {v} y el banco responde "
                    f"{q['respuesta']} (tolerancia {tol})")
            if not o["correcta"] and dentro:
                mal(f"B · {label}: el distractor {v} cae dentro de la tolerancia "
                    f"de la respuesta: son dos correctas")
        if len(decs) > 1:
            mal(f"B · {label}: sus opciones llevan {sorted(decs)} decimales; "
                "el número de decimales delata cuál es cuál")
        if sum(o["correcta"] for o in it["opciones"]) != 1:
            mal(f"B · {label}: no tiene exactamente una correcta")

    # ---- C. los distractores de R, por segunda via -----------------------
    Z95, Z90 = 1.959963984540054, 1.6448536269514722
    d = pre["disenoPequeno"]
    piK, piKl = d["piK"], d["piKl"]
    mas, prop, sis, ber = pre["mas"], pre["proporcion"], pre["sistematicoPequeno"], pre["bernoulli"]
    nr, tm = tal["noRespuesta"], tal["mas"]
    m_hombres = (nr["nResp"] * nr["mediaResp"]
                 - nr["nMujeresResp"] * nr["mediaMujeresResp"]) / (
                 nr["nResp"] - nr["nMujeresResp"])

    esperado = {
        ("taller1", "sesgoNoRespuesta"): [
            (m_hombres + nr["mediaMujeresResp"]) / 2 - nr["mediaMarco"],
            -(nr["mediaResp"] - nr["mediaMarco"]),
            nr["mediaMarco"] - nr["mediaNoResp"]],
        ("taller1", "icSuperiorEstatura"): [
            tm["ybar"] + Z90 * tm["seFpc"],
            tm["ybar"] + Z95 * tm["s"],
            tm["icLo"]],
        ("preparcial", "piKlPar13"): [
            piK[0] * piK[2],
            piK[0] + piK[2] - piKl[0][2],
            piK[2]],
        ("preparcial", "icSuperiorSalario"): [
            mas["ybar"] + 2 * mas["seFpc"],
            mas["ybar"] + Z95 * mas["seSinFpc"],
            mas["icLo"]],
        ("preparcial", "sumaPiKBernoulli"): [
            round(ber["N"] * ber["pi"]),
            ber["N"] * (1 - ber["pi"])],
        ("preparcial", "icSuperiorProporcion"): [
            prop["pHat"] + Z95 * prop["seSinFpcConN"],
            prop["pHat"],
            prop["icLo"]],
        ("preparcial", "varSistematicoPequeno"): [
            sis["varConK1Millones"],
            sis["varMasMillones"],
            math.sqrt(sis["varRealMillones"])],
    }
    fuentes = {"preparcial": pre, "taller1": tal}
    for (arch, nombre), vals in esperado.items():
        bloque = (fuentes[arch].get("distractores") or {}).get(nombre)
        if not bloque:
            mal(f"C · falta el bloque «{nombre}» en {arch}_datos.json")
            continue
        ops = bloque["opciones"]
        ops = [ops] if isinstance(ops, dict) else ops
        if len(ops) != len(vals):
            mal(f"C · «{nombre}» trae {len(ops)} distractores y aquí se esperan "
                f"{len(vals)}")
            continue
        for i, (o, v) in enumerate(zip(ops, vals), 1):
            if abs(float(o["valor"]) - v) > max(abs(v) * 1e-6, 1e-9):
                mal(f"C · «{nombre}» distractor {i}: R da {o['valor']} y la "
                    f"segunda vía da {v}")

    # ---- D. el barajado ---------------------------------------------------
    # Los items no tienen todos el mismo numero de opciones -hay de 3, 4 y 5-,
    # asi que bajo la hipotesis nula la correcta NO se reparte uniformemente
    # entre las posiciones: cada item aporta 1/m a cada una de sus m casillas.
    # La esperanza se acumula asi, y los grados de libertad salen de las
    # casillas POSIBLES, no de las observadas. Calcularlos sobre las observadas
    # era un defecto de esta prueba, y del peor tipo: con todas las correctas
    # en la (a) solo se observa una casilla, los grados de libertad caen a cero
    # y el caso mas grave pasaba como bueno. Lo encontro la inyeccion.
    pos, esp = Counter(), Counter()
    for it in items.values():
        ops = it["opciones"]
        if sum(o["correcta"] for o in ops) != 1:
            continue
        m = len(ops)
        pos[next(i for i, o in enumerate(ops) if o["correcta"])] += 1
        for j in range(m):
            esp[j] += 1 / m
    k = max(esp) + 1 if esp else 0
    chi = sum((pos[i] - esp[i]) ** 2 / esp[i] for i in range(k) if esp[i] > 0)
    gl = sum(1 for i in range(k) if esp[i] > 0) - 1
    critico = {1: 3.841, 2: 5.991, 3: 7.815, 4: 9.488}.get(gl, 11.07)
    if chi > critico:
        mal(f"D · la correcta no está repartida: chi² = {chi:.2f} con {gl} gl "
            f"(crítico {critico})")

    # ---- E. la longitud ---------------------------------------------------
    mas_larga, razones = 0, []
    for it in items.values():
        ops = it["opciones"]
        if sum(o["correcta"] for o in ops) != 1 or len(ops) < 2:
            continue
        c = next(o for o in ops if o["correcta"])
        otras = [len(o["texto"]) for o in ops if not o["correcta"]]
        if len(c["texto"]) >= max(otras):
            mas_larga += 1
        razones.append(len(c["texto"]) / (sum(otras) / len(otras)))
    razon = sum(razones) / len(razones) if razones else 0
    if razon > 1.35:
        mal(f"E · la correcta es en promedio {razon:.2f} veces más larga que sus "
            "distractores: se acierta por la forma")
    elif razon > 1.15:
        ojo(f"E · la correcta es {razon:.2f} veces más larga que sus distractores")

    # ---- F. las formulas --------------------------------------------------
    if xml.count("$"):
        mal(f"F · quedan {xml.count('$')} delimitadores `$` en el XML: MathJax no "
            "los interpreta y el estudiante leería el código fuente")
    ab, ce = len(re.findall(r"\\\(", xml)), len(re.findall(r"\\\)", xml))
    if ab != ce:
        mal(f"F · {ab} aperturas `\\(` y {ce} cierres `\\)`")
    if "&amp;nbsp;" in xml:
        mal("F · hay `&amp;nbsp;` en el XML: se leería como texto")
    CONOCIDOS = {
        "sqrt", "frac", "times", "cdot", "pi", "hat", "bar", "sum", "in", "neq",
        "approx", "leq", "geq", "left", "right", "text", "mathrm", "quad", "qquad",
        "ldots", "dots", "alpha", "beta", "gamma", "sigma", "mu", "lambda", "theta",
        "rho", "chi", "infty", "pm", "to", "Rightarrow", "cup", "cap", "subset",
        "notin", "overline", "underline", "binom", "choose", "log", "exp", "min",
        "max", "displaystyle", "big", "Big", "operatorname", "hspace", ",", ";",
        " ", "!", "%", "&", "_", "{", "}", "\\", "#", "$",
    }
    usados = Counter()
    for m in re.finditer(r"\\\((.*?)\\\)", xml, re.S):
        for c in re.findall(r"\\([A-Za-z]+|.)", m.group(1)):
            usados[c] += 1
    raros = {c: n for c, n in usados.items() if c not in CONOCIDOS}
    if raros:
        ojo(f"F · comandos fuera del vocabulario habitual de MathJax: {raros}")

    # ---- G. las imagenes --------------------------------------------------
    # El `<img` viaja escapado dentro del `<mattext>` —es texto para el XML—
    # pero la ruta va literal, que es como el auditor de la skill la busca.
    citadas = set(re.findall(r'src="(images/[^"]+)"', xml))
    if citadas - imgs:
        mal(f"G · el XML cita imágenes que no están en el ZIP: {sorted(citadas - imgs)}")
    if imgs - citadas:
        mal(f"G · el ZIP lleva imágenes que nadie cita: {sorted(imgs - citadas)}")

    # ---- informe ----------------------------------------------------------
    print(f"  B  {numericas} numéricas convertidas, con su correcta y sus distractores")
    print(f"  C  {len(esperado)} bloques de R recomputados por segunda vía")
    print(f"  D  posición de la correcta: " +
          " · ".join(f"{chr(97+i)}) {pos[i]}" for i in range(k)) +
          f"   chi² = {chi:.2f} ({gl} gl, crítico {critico})")
    print(f"  E  la correcta es la más larga en {mas_larga} de {len(razones)} "
          f"ítems · razón media {razon:.2f}")
    print(f"  F  {ab} fórmulas MathJax emparejadas, 0 `$` sueltos")
    print(f"  G  {len(citadas)} imágenes citadas, {len(imgs)} en el ZIP")
    for a in avisos:
        print(f"\n  ⚠ {a}")
    if fallos:
        print(f"\n  {len(fallos)} FALLO(S):")
        for f in fallos:
            print(f"      · {f}")
        return 1
    print("\n  Sin fallos de contenido.\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
