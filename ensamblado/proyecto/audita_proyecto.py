#!/usr/bin/env python3
"""audita_proyecto.py — Audita la guía del proyecto integrador sobre el ARTEFACTO.

Calcado del auditor de la guía de Diseño de Experimentos. No mira la intención
del ensamblador: lee `sitio/muestreo/proyecto-integrador-corte-iii.html` y
vuelve a calcular por su cuenta cada cosa que afirma. Seis frentes:

  A · Calendario   cada fecha impresa tiene su día de la semana en 2026, cae en
                   la semana del curso que se le atribuye (ancla: la semana 9
                   empieza el lunes 5 de octubre) y es la de un hito; los hitos
                   van en orden; todo cierra a la misma hora.
  B · Pesos        la rúbrica suma lo que dicen sus encabezados y el total es
                   100; la tabla de pesos y la de hitos dicen lo mismo; proyecto
                   y quices suman 100; el tope y el descuento se recalculan con
                   la regla que imprime el propio documento.
  C · Decisiones   DM1–DM11: individual o en parejas, las seis condiciones, el
                   mínimo de unidades, el consentimiento y el marco fuera del
                   repositorio, el protocolo antes de seleccionar, el repositorio
                   privado con una release por hito, el descuento, el Corte III
                   sin examen final, el guion de la exposición en sus minutos.
  D · Estructura   CSS idéntico al de la plantilla y al de los capítulos que la
                   comparten, ids únicos, tablas con caption, enlaces locales que
                   resuelven, ningún «<» suelto, sin mojibake ni restos de la
                   plantilla, courseData igual a los módulos.
  E · Código       cada bloque de R de la guía es, byte a byte, el de la cadena
                   ejecutada; las cifras del ejemplo que cita la prosa salen de
                   esas salidas; la plantilla .Rmd publicada es la de la fuente y
                   usa la misma semilla y asignación; con R, la cadena sigue
                   dando lo anotado y la plantilla se renderiza sin datos.
  F · Conjunta     la modalidad conjunta dice lo que aprobó Javier (D1–D16 de
                   PLAN_Proyecto_Conjunto.md): quién, las dos aleatorizaciones,
                   dos notas, las fechas de Diseño, las extensiones, desistir
                   hasta el avance; y las fechas coinciden con las de la guía de
                   Diseño cuando su datos.py está a mano.

    python3 ensamblado/proyecto/audita_proyecto.py

Variables de entorno (las usa el arnés `prueba_audita_proyecto.py`):
  PROYECTO_HTML    ruta del HTML a auditar (por defecto, el del sitio)
  PROYECTO_SIN_R   si vale 1, se salta la parte del frente E que corre R
"""
from __future__ import annotations

import html as _html
import os
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile
from datetime import date, timedelta
from itertools import combinations_with_replacement, product

AQUI = pathlib.Path(__file__).resolve().parent
RAIZ = AQUI.parent.parent
SITIO = RAIZ / "sitio" / "muestreo"
PUBLICADO = SITIO / "proyecto-integrador-corte-iii.html"
RUTA = pathlib.Path(os.environ.get("PROYECTO_HTML", PUBLICADO))
PLANTILLA = RAIZ / "plantilla" / "plantilla-capitulo-muestreo.html"
CADENA = RAIZ / "ensamblado" / "codigo" / "proyecto" / "cadena.R"
RMD_FUENTE = AQUI / "plantilla-informe.Rmd"
RMD_PUBLICADO = SITIO / "proyecto-integrador-plantilla.Rmd"
PLAN_CONJUNTO = RAIZ / "PLAN_Proyecto_Conjunto.md"
DATOS_DISENO = RAIZ.parent / "Diseno de experimentos" / "proyecto" / "datos.py"
RSCRIPT = "/Library/Frameworks/R.framework/Versions/4.4-arm64/Resources/bin/Rscript"

sys.path.insert(0, str(AQUI))
import datos as D  # noqa: E402

# Los módulos se buscan por el título de su h2, no por su número.
N_MODULOS = 10
T_QUE_VALE, T_REPOSITORIO = "Qué encuesta vale", "El repositorio en GitHub"
T_FICHA, T_PROTOCOLO = "Hito 1 · Ficha del tema", "Hito 2 · Protocolo"
T_AVANCE, T_INFORME = "Hito 3 · Avance", "Hito 4 · Informe y código"
T_EXPOSICION, T_RUBRICA = "La exposición", "La rúbrica"
T_CONJUNTA = "La modalidad conjunta con Diseño de Experimentos"

# El calendario, recalculado aquí y no importado de datos.py.
ANCLA_SEMANA_9 = date(2026, 10, 5)
DIAS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]
MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto",
         "septiembre", "octubre", "noviembre", "diciembre"]


class Auditoria:
    def __init__(self):
        self.ok, self.fallos = 0, []

    def check(self, frente: str, cond: bool, que: str, detalle: str = "") -> None:
        print(f"  {'OK ' if cond else 'MAL'} [{frente}] {que}"
              + ("" if cond or not detalle else f"  {detalle}"))
        if cond:
            self.ok += 1
        else:
            self.fallos.append((frente, que, detalle))


def texto_visible(t: str) -> str:
    t = re.sub(r"<(script|style)\b.*?</\1>", " ", t, flags=re.S)
    t = re.sub(r"<[^>]+>", " ", t)
    return re.sub(r"\s+", " ", _html.unescape(t)).strip()


def semana(d: date) -> int:
    return 9 + (d - ANCLA_SEMANA_9).days // 7


def frase(d: date) -> str:
    return f"{DIAS[d.weekday()]} {d.day} de {MESES[d.month - 1]}"


def selectores(t: str) -> set:
    return set(re.findall(r"^\s*(\.[a-zA-Z][\w-]*)", t[:t.index("</style>")], re.M)) \
        if "</style>" in t else set()


def numero(s: str) -> float:
    return float(s.replace(",", "."))


def bloques_cadena() -> dict[str, str]:
    """Los bloques de la cadena, recortados por su cuenta (no los del ensamblador)."""
    t = CADENA.read_text(encoding="utf-8")
    out = {}
    for mo in re.finditer(r'cat\("\\n###BLOQUE-(\w+)###\\n"\)\n(.*?)(?=\ncat\("\\n###BLOQUE|\Z)', t, re.S):
        out[mo.group(1)] = mo.group(2).strip("\n")
    return out


def main() -> int:
    A = Auditoria()
    if not RUTA.exists():
        print(f"!! no existe {RUTA}")
        return 1
    H = RUTA.read_text(encoding="utf-8")
    ini = H.index('<template id="module-1">')
    fin = H.rindex("\n  <script>")
    M = H[ini:fin]
    modulos = re.findall(r'<template id="module-(\d+)">(.*?)</template>', M, re.S)
    por_modulo = {int(n): cuerpo for n, cuerpo in modulos}
    h2 = re.findall(r'<template id="module-(\d+)">.*?<h2[^>]*>([^<]+)</h2>', M, re.S)
    numero_de = {b.strip(): int(a) for a, b in h2}

    def mod(titulo: str) -> str:
        return por_modulo.get(numero_de.get(titulo, -1), "")

    V = texto_visible(M)
    m1 = por_modulo.get(1, "")

    # ------------------------------------------------------------------ A
    print("\n=== A · Calendario ===")
    fechas = re.findall(r"\b(" + "|".join(DIAS) + r") (\d{1,2}) de (" + "|".join(MESES) + r")\b", V)
    A.check("A", len(fechas) > 0, "el documento imprime fechas", f"({len(fechas)})")
    for dia, n, mes in sorted(set(fechas)):
        d = date(2026, MESES.index(mes) + 1, int(n))
        A.check("A", DIAS[d.weekday()] == dia, f"«{dia} {n} de {mes}» es {dia} en 2026",
                f"(es {DIAS[d.weekday()]})")

    permitidas = {h["fecha"] for h in D.HITOS} | {h["fecha"] for h in D.CONJUNTO_HITOS}
    l16 = ANCLA_SEMANA_9 + timedelta(weeks=D.SEMANA_EXPOSICION - 9)
    permitidas |= {l16, l16 + timedelta(days=5), D.CONJUNTO_DESISTIR_HASTA, D.CAMPO["fecha"]}
    impresas = {date(2026, MESES.index(m) + 1, int(n)) for _d, n, m in fechas}
    sueltas = sorted(impresas - permitidas)
    A.check("A", not sueltas, "ninguna fecha suelta: todas son de un hito o de la semana de la exposición",
            f"({', '.join(map(str, sueltas))})")

    for h in D.HITOS:
        f = h["fecha"]
        A.check("A", semana(f) == h["semana"],
                f"{h['nombre']}: el {frase(f)} cae en la semana {h['semana']}", f"(cae en la {semana(f)})")
        fila = re.search(rf"<strong>{re.escape(h['nombre'])}</strong></td>.*?</tr>", M, re.S)
        A.check("A", bool(fila) and frase(f) in fila.group(0) and f"<td>{h['semana']}</td>" in fila.group(0),
                f"{h['nombre']}: su fila de la tabla dice «{frase(f)}» y la semana {h['semana']}")
    for titulo, hid in ((T_FICHA, "ficha"), (T_PROTOCOLO, "protocolo"),
                        (T_AVANCE, "avance"), (T_INFORME, "informe")):
        h = D.HITO[hid]
        cierre = f"{frase(h['fecha'])} a las {D.HORA_ENTREGA}"
        txt = texto_visible(mod(titulo))
        A.check("A", cierre in txt and f"semana {h['semana']}" in txt,
                f"«{titulo}» dice que cierra el «{cierre}», en la semana {h['semana']}")
    orden = [h["fecha"] for h in D.HITOS]
    A.check("A", orden == sorted(orden) and len(set(orden)) == len(orden), "los hitos van en orden")
    A.check("A", semana(orden[-1]) <= D.SEMANA_EXPOSICION,
            "el informe se entrega antes de la exposición o en su misma semana")
    frase16 = f"del lunes {l16.day} al sábado {(l16 + timedelta(days=5)).day} de {MESES[l16.month - 1]}"
    A.check("A", V.count(frase16) >= 2, f"la exposición: «{frase16}» en el módulo 1 y en el suyo")
    fila_expo = re.search(r"<strong>Exposición</strong></td>.*?</tr>", M, re.S)
    A.check("A", D.DIA_EXPOSICION in texto_visible(m1) and D.DIA_EXPOSICION in texto_visible(mod(T_EXPOSICION))
            and bool(fila_expo) and "<td>se acuerda en clase</td>" in fila_expo.group(0),
            "el día de la exposición se acuerda en clase (módulo 1, su módulo y la tabla)")
    # Todas las entregas cierran a la misma hora; la otra hora es la de la semilla (IA-2).
    horas = re.findall(r"a las (\d{1,2}:\d{2})", V)
    A.check("A", set(horas) - {D.HORA_SEMILLA} == {D.HORA_ENTREGA}
            and V.count(f"a las {D.HORA_SEMILLA} del cierre del protocolo") == horas.count(D.HORA_SEMILLA) == 1,
            f"todas las entregas cierran a las {D.HORA_ENTREGA}; la semilla se publica a las {D.HORA_SEMILLA}",
            f"({sorted(set(horas))})")
    c = D.CAMPO
    fila_campo = re.search(rf"<strong>{re.escape(c['nombre'])}</strong></td>.*?</tr>", M, re.S)
    A.check("A", bool(fila_campo) and frase(c["fecha"]) in fila_campo.group(0)
            and f"<td>{c['semana']}</td>" in fila_campo.group(0) and semana(c["fecha"]) == c["semana"]
            and c["fecha"] > D.HITO["avance"]["fecha"] and c["fecha"] < D.HITO["informe"]["fecha"],
            f"PE-2 · el cierre del campo, el {frase(c['fecha'])} (semana {c['semana']}), entre el avance y el informe")

    # ------------------------------------------------------------------ B
    print("\n=== B · Pesos ===")
    encabezados = dict((t, int(p)) for t, p in re.findall(r"<h3>([^<]+?) · (\d+) puntos</h3>", mod(T_RUBRICA)))
    criterios = re.findall(r"<caption><strong>([A-Z]\d) · ([^<]+)</strong> — (\d+) puntos\.", mod(T_RUBRICA))
    total_crit = sum(len(b["criterios"]) for b in D.RUBRICA)
    A.check("B", len(criterios) == total_crit, f"la rúbrica publica sus {total_crit} criterios",
            f"({len(criterios)})")
    prefijo = {"Protocolo": "P", "Avance": "A", "Informe y código": "I", "Exposición": "E"}
    sumas = {}
    for titulo, letra in prefijo.items():
        sumas[titulo] = sum(int(p) for cid, _n, p in criterios if cid.startswith(letra))
        A.check("B", encabezados.get(titulo) == sumas[titulo],
                f"{titulo}: sus criterios suman lo que dice su encabezado",
                f"(encabezado {encabezados.get(titulo)}, criterios {sumas[titulo]})")
    A.check("B", sum(sumas.values()) == 100, "la rúbrica entera suma 100", f"({sum(sumas.values())})")

    pesos = re.findall(r"<td>([^<]+)</td><td>[A-Z0-9, ]+</td><td>(\d+) %</td>\s*"
                       r"<td><strong>([\d.]+) %</strong></td>", m1)
    A.check("B", len(pesos) == 4, "la tabla de pesos tiene los cuatro hitos", f"({len(pesos)})")
    corte = re.findall(r"el <strong>(\d+) %</strong> de la nota del Corte III", m1)
    del_corte = int(corte[0]) if corte else None
    A.check("B", del_corte == D.PROYECTO_DEL_CORTE,
            f"el módulo 1 dice que el proyecto vale el {D.PROYECTO_DEL_CORTE} % del Corte III", f"({corte})")
    quices = re.findall(r"los\s+quices que se hacen en clase, el otro <strong>(\d+) %</strong>", m1)
    A.check("B", quices == [str(D.QUICES_DEL_CORTE)] and del_corte is not None
            and del_corte + int(quices[0]) == 100,
            f"D16 · los quices en clase son el otro {D.QUICES_DEL_CORTE} % y el corte suma 100", f"({quices})")
    banner = re.search(r"PROYECTO INTEGRADOR • CORTE III •(.*?)• UNBOSQUE", H, re.S)
    A.check("B", bool(banner) and f"{D.PROYECTO_DEL_CORTE}&nbsp;% DE LA NOTA DEL CORTE" in banner.group(1),
            "la cabecera dice el mismo porcentaje")
    conj = texto_visible(mod(T_CONJUNTA))
    A.check("B", f"el proyecto vale el {D.PROYECTO_DEL_CORTE} % del Corte III" in conj,
            "la modalidad conjunta dice el mismo porcentaje")
    for titulo, p_proy, p_corte in pesos:
        A.check("B", sumas.get(titulo) == int(p_proy), f"pesos · {titulo}: {p_proy} % del proyecto, como la rúbrica")
        if del_corte:
            A.check("B", abs(int(p_proy) * del_corte / 100 - float(p_corte)) < 1e-9,
                    f"pesos · {titulo}: {p_proy} % × {del_corte} % = {p_corte} % del corte")
    curso = re.search(r"es el (\d+) % del curso: en total, el proyecto es el\s+<strong>([\d.]+) %</strong>", m1)
    A.check("B", bool(curso) and del_corte is not None
            and abs(del_corte * int(curso.group(1)) / 100 - float(curso.group(2))) < 1e-9,
            "el porcentaje de la nota final es el del corte por el del Corte III")
    nombre_rub = {"protocolo": "Protocolo", "avance": "Avance", "informe": "Informe y código"}
    for h in D.HITOS:
        fila = re.search(rf"<strong>{re.escape(h['nombre'])}</strong></td>.*?</tr>", M, re.S)
        esperado = "sin nota" if h["id"] == "ficha" else f"{sumas.get(nombre_rub[h['id']])} %"
        A.check("B", bool(fila) and f"<td>{esperado}</td>" in fila.group(0), f"hitos · {h['nombre']}: peso «{esperado}»")
    A.check("B", bool(fila_expo) and f"<td>{sumas['Exposición']} %</td>" in fila_expo.group(0),
            f"hitos · Exposición: peso «{sumas['Exposición']} %»")
    for t_mod, titulo in ((T_PROTOCOLO, "Protocolo"), (T_AVANCE, "Avance"),
                          (T_INFORME, "Informe y código"), (T_EXPOSICION, "Exposición")):
        dice = re.findall(r"vale el\s+<strong>(\d+) %</strong> del proyecto", mod(t_mod))
        A.check("B", dice == [str(sumas[titulo])], f"«{t_mod}» dice que vale el {sumas[titulo]} % del proyecto",
                f"({dice})")
    regla = re.search(r"se descuenta el <strong>(\d+) %</strong> de la nota que\s+habría tenido", m1)
    tasa = int(regla.group(1)) if regla else None
    base = re.search(r"habría sacado\s+(\d,\d+)\.</caption>", m1)
    retraso = re.findall(r"<tr><td>(\d+)</td><td>(\d+) %</td><td>(\d,\d+)</td></tr>", m1)
    A.check("B", tasa is not None and bool(base) and len(retraso) >= 3,
            "el módulo 1 imprime la regla del retraso y su tabla", f"({tasa}, {len(retraso)} filas)")
    for s, desc, queda in retraso:
        s, desc, queda = int(s), int(desc), numero(queda)
        esperado = round(max(0.0, numero(base.group(1)) * (1 - s * (tasa or 0) / 100)), 2) if base else None
        A.check("B", desc == s * (tasa or 0) and esperado is not None and abs(queda - esperado) < 0.006,
                f"retraso · {s} sesión(es): {desc} % y la nota queda en {queda}",
                f"(recalculado: {s * (tasa or 0)} % y {esperado})")
    permitidos = {str(v) for v in sumas.values()} | {"100", str(D.PROYECTO_DEL_CORTE),
                                                     str(D.QUICES_DEL_CORTE), str(D.CORTE_III_DEL_CURSO),
                                                     "95"}   # el «95 %» de confianza del ejemplo
    permitidos |= {c for *_x, c in pesos} | ({curso.group(2)} if curso else set())
    p_esc = sumas["Protocolo"] + sumas["Avance"] + sumas["Informe y código"]
    permitidos |= {str(p_esc), str(tasa)} | {d for _s, d, _q in retraso}
    # La prosa, sin el código: el «2.5 %» de una salida de confint() no es un peso.
    V_prosa = texto_visible(re.sub(r"<pre>.*?</pre>", " ", M, flags=re.S))
    sueltos = sorted(set(re.findall(r"(\d+(?:\.\d+)?) %", V_prosa)) - permitidos)
    A.check("B", not sueltos, "ningún porcentaje suelto", f"({sueltos})")

    niveles = re.findall(r"<tr><td>(Insuficiente|Aceptable|Sólido)</td><td>(\d,\d)</td></tr>", mod(T_RUBRICA))
    valor = {n.lower(): numero(v) for n, v in niveles}
    A.check("B", valor == {n: v for n, v in D.NIVELES}, "la tabla de niveles dice lo que vale cada uno",
            f"({niveles})")
    umbral = re.search(r"\\frac\{\\text\{preguntas\}\}\{([\d.]+)\}", m1)
    u = float(umbral.group(1)) if umbral else None
    A.check("B", u == D.UMBRAL_TOPE, f"la fórmula del tope divide entre {D.divisor(D.UMBRAL_TOPE)}")
    filas = re.findall(r"<tr>\s*<td>([^<]+)</td><td>(\d,\d+)</td>\s*<td>(\d,\d+)</td>"
                       r"<td>(\d,\d+)</td>\s*<td>(\d,\d+)</td><td><strong>(\d,\d+)</strong></td>", m1)
    A.check("B", len(filas) == len(D.EJEMPLOS_TOPE), "la tabla del tope tiene sus filas", f"({len(filas)})")
    alcanzables = {round(sum(c) / k, 2) for k in (1, 2, 3)
                   for c in combinations_with_replacement(valor.values() or [0], k)}
    p_e1 = next((int(p) for cid, _n, p in criterios if cid == "E1"), 0)
    p_e2 = next((int(p) for cid, _n, p in criterios if cid == "E2"), 0)
    leyenda = re.search(r"<caption>Qué cambia el tope\.(.*?)</caption>", m1, re.S)
    ley = re.sub(r"\s+", " ", leyenda.group(1)) if leyenda else ""
    A.check("B", f"Lo escrito vale {p_esc} puntos" in ley and f"(E1) {p_e1}" in ley and f"(E2) {p_e2}" in ley,
            f"tope · la leyenda da los pesos con los que sale la tabla: {p_esc}, {p_e1} y {p_e2}")
    p_escritos = [int(p) for cid, _n, p in criterios if cid[0] in "PAI"]
    escritos = {round(sum(p * v for p, v in zip(p_escritos, combo)) / sum(p_escritos), 2)
                for combo in product(valor.values() or [0], repeat=len(p_escritos))}
    for sit, esc, x, q, sin, con in filas:
        A.check("B", numero(x) in set(valor.values()), f"tope · «{sit}»: la exposición (E1) vale un nivel ({x})")
        A.check("B", round(numero(esc), 2) in escritos, f"tope · «{sit}»: lo escrito ({esc}) es alcanzable")
        esc, x, q, sin, con = map(numero, (esc, x, q, sin, con))
        f = min(1.0, q / u) if u else 1.0
        sin_ok = round((p_esc * esc + p_e1 * x + p_e2 * q) / 100, 2)
        con_ok = round((p_esc * esc * f + p_e1 * x + p_e2 * q) / 100, 2)
        A.check("B", abs(sin - sin_ok) < 0.006 and abs(con - con_ok) < 0.006,
                f"tope · «{sit}»: {sin} sin tope y {con} con tope", f"(recalculado: {sin_ok} y {con_ok})")
        A.check("B", round(q, 2) in alcanzables, f"tope · «{sit}»: una nota de preguntas de {q} es alcanzable")
    if filas:
        A.check("B", f"pasa de <strong>{filas[0][4]}</strong> a <strong>{filas[0][5]}</strong>" in m1,
                "el texto bajo la tabla del tope cita la primera fila")

    # ------------------------------------------------------------------ C
    print("\n=== C · Decisiones ===")
    vale, prot, repo = (texto_visible(mod(x)) for x in (T_QUE_VALE, T_PROTOCOLO, T_REPOSITORIO))
    A.check("C", "individual o en parejas" in V, "DM1 · el proyecto es individual o en parejas")
    trios = [mo.start() for mo in re.finditer(r"tr[ií]os?", V)]
    legitimos = [mo.start() + 7 for mo in re.finditer(r"no hay tr[ií]os", V)]
    A.check("C", set(trios) <= set(legitimos), "DM1 · «tríos» solo aparece para decir que no los hay")
    vale = texto_visible(mod(T_QUE_VALE))
    for cond in ("El diseño es probabilístico.", "El marco está identificado y descrito",
                 "La selección es reproducible", f"Al menos {D.N_MINIMO} unidades finales",
                 "Toda estimación va con su error estándar y su intervalo de confianza",
                 "El análisis reconoce el diseño."):
        A.check("C", cond in vale, f"DM2 · la condición «{cond}»")
    A.check("C", len(re.findall(r"<li><strong>", re.search(r"<h3>Las seis condiciones</h3>.*?</ol>",
                                                            mod(T_QUE_VALE), re.S).group(0)
                                if "<h3>Las seis condiciones</h3>" in mod(T_QUE_VALE) else "")) == 6,
            "DM2 · son exactamente seis condiciones")
    A.check("C", "da su consentimiento" in vale and "anónimas" in vale and "que no se sube nunca" in vale,
            "DM2 · con personas: consentimiento, anonimato y el marco con nombres fuera del repositorio")
    A.check("C", "fraude académico" in vale and "fraude académico" in texto_visible(mod(T_RUBRICA)),
            "DM10 · los datos inventados son fraude (módulo 2 y rúbrica)")
    A.check("C", D.CONDICION_NO_PROBABILISTICO in texto_visible(mod(T_RUBRICA)),
            "DM10 · la condición del diseño no probabilístico, en la rúbrica")
    expo = texto_visible(mod(T_EXPOSICION))
    A.check("C", "Cada integrante contesta dos preguntas" in expo and "Una de ejecución." in expo
            and "El dado elige una fila de datos/muestra.csv" in expo and "no las únicas" in expo
            and "el dado decide quién contesta" not in V and "contesta al menos una" not in V
            and "sus dos preguntas, sin ayuda del otro" in texto_visible(m1),
            "IA-3 · dos preguntas por persona, una de ejecución sobre una fila de la muestra; las publicadas no son las únicas")
    A.check("C", f"{D.MINUTOS_PREGUNTAS} de preguntas por persona" in expo, "IA-3 · los minutos de preguntas son por persona")
    # Las decisiones del bloque A del 22 oct (Javier), cada una en su sitio.
    A.check("C", f"a las {D.HORA_SEMILLA} del cierre del protocolo, el docente publica la de cada equipo "
                 f"{D.CANAL_SEMILLA}" in prot and "La semilla no la eliges tú" in prot
            and "salvo para poner en el guion la semilla" in repo and "guarda a qué commit apunta cada etiqueta" in repo
            and "la publica el docente al cierre del preregistro conjunto" in texto_visible(mod(T_CONJUNTA)),
            "IA-2 · la semilla la publica el docente al cierre; el docente guarda las etiquetas (protocolo, repositorio, conjunta)")
    av = texto_visible(mod(T_AVANCE))
    A.check("C", bool(re.search(rf"El campo cierra el {frase(D.CAMPO['fecha'])} a las {D.HORA_ENTREGA}\s?, con la release campo", av))
            and "El avance se califica con el campo que lleves" in av
            and f"el {frase(D.CAMPO['fecha'])} a las {D.HORA_ENTREGA}" in texto_visible(mod(T_CONJUNTA))
            and "<code>campo</code>" in mod(T_REPOSITORIO),
            "PE-2 · el campo cierra con la release campo, sin nota; vale también en la conjunta")
    A.check("C", bool(re.search(r"no valen apipop\s?, que es el ejemplo de esta guía, ni los conjuntos de datos de los capítulos", vale))
            and "su URL, la fecha de descarga y la versión" in vale,
            "IA-6 · el archivo público lo consigue el equipo: no valen apipop ni los datos del curso")
    A.check("C", "la nota de lo escrito no pasa de 3,0" in texto_visible(mod(T_RUBRICA)) and D.TOPE_NO_PROBABILISTICO == 3.0,
            "PE-4 · un diseño no probabilístico que llega al informe deja lo escrito en 3,0 como máximo")
    A.check("C", f"hay clase {D.CLASES}" in texto_visible(m1) and "nunca baja la nota de 0" in texto_visible(m1)
            and "se cuentan en el calendario de clases de Diseño" in texto_visible(mod(T_CONJUNTA)),
            "PE-20 · qué es una sesión, el descuento no baja de 0, y en la conjunta cuenta el calendario de Diseño")
    A.check("C", "avance-muestreo" in texto_visible(mod(T_CONJUNTA)) and "informe-muestreo" in texto_visible(mod(T_CONJUNTA)),
            "PE-7 (confirmada) · cómo se desiste de la modalidad conjunta")
    A.check("C", f"{D.MINUTOS_EXPOSICION} minutos" in V and f"{D.MINUTOS_PREGUNTAS} de preguntas" in V,
            f"DM4 · {D.MINUTOS_EXPOSICION} minutos de exposición y {D.MINUTOS_PREGUNTAS} de preguntas")
    guion = re.search(r"<caption>Un reparto posible de los minutos de la exposición\.</caption>(.*?)</table>",
                      mod(T_EXPOSICION), re.S)
    minutos = [int(x) for x in re.findall(r"</td><td>(\d+)</td></tr>", guion.group(1))] if guion else []
    A.check("C", sum(minutos) == D.MINUTOS_EXPOSICION, f"DM4 · el guion de la exposición suma "
            f"{D.MINUTOS_EXPOSICION} minutos", f"({minutos})")
    A.check("C", "declaración de uso" in V.lower() and "Puedes usar IA" in V, "la declaración de uso de IA es obligatoria")
    prot = texto_visible(mod(T_PROTOCOLO))
    A.check("C", "antes de seleccionar una sola unidad" in prot and "planeado" in prot and "exploratorio" in prot,
            "DM3 · el protocolo se escribe antes de seleccionar y separa lo planeado de lo exploratorio")
    A.check("C", "La prueba del protocolo es escribir" in prot, "DM2 · la prueba del protocolo es escribir π_k")
    A.check("C", D.CANAL_ENTREGA in V, f"DM8 · el canal de entrega: «{D.CANAL_ENTREGA}»")
    repo = texto_visible(mod(T_REPOSITORIO))
    A.check("C", "repositorio privado de GitHub" in repo and "Créalo privado" in repo, "DM8 · el repositorio es privado")
    A.check("C", f"el usuario {D.USUARIO_DOCENTE}" in repo and "colaborador" in repo,
            f"DM8 · se invita al docente ({D.USUARIO_DOCENTE}) como colaborador")
    A.check("C", f"<code>{D.NOMBRE_REPO}</code>" in mod(T_REPOSITORIO), f"DM8 · el repositorio se llama {D.NOMBRE_REPO}")
    etiquetas = re.findall(r"con su etiqueta: (.*?)\. En GitHub", repo)
    A.check("C", bool(etiquetas) and all(D.ETIQUETA[h["id"]] in etiquetas[0] for h in D.HITOS),
            "DM8 · el módulo del repositorio da la etiqueta de la release de cada hito", f"({etiquetas})")
    for titulo, hid in ((T_FICHA, "ficha"), (T_PROTOCOLO, "protocolo"), (T_AVANCE, "avance"), (T_INFORME, "informe")):
        A.check("C", bool(re.search(rf"release\s+<code>{D.ETIQUETA[hid]}</code>", mod(titulo))),
                f"DM8 · «{titulo}» se entrega con la release «{D.ETIQUETA[hid]}»")
    A.check("C", "la hora en que GitHub publica la release" in repo and "no se vuelven a editar" in repo,
            "DM8 · cuenta la hora de la release, y el cierre congela el protocolo")
    A.check("C", tasa == D.DESCUENTO_POR_SESION and "sobre la nota original" in V
            and "La primera sesión cuenta desde el cierre" in V,
            f"DM9 · {D.DESCUENTO_POR_SESION} % por sesión, sobre la nota original, desde el cierre", f"({tasa})")
    A.check("C", "Corte III no tiene examen final" in V and V.count("examen") == V.count("no tiene examen final"),
            "D16 · el Corte III no tiene examen final, y el examen no se nombra para nada más")
    A.check("C", f"{D.PALABRAS_FICHA} palabras" in V and f"{D.PAGINAS_PROTOCOLO} páginas" in prot
            and f"{D.PAGINAS_INFORME} páginas" in texto_visible(mod(T_INFORME)),
            "las extensiones de la ficha, el protocolo y el informe")
    for cap in ("capitulo-1-encuestas-sesgos.html", "capitulo-2-diseno-mas-sistematico.html",
                "capitulo-4-muestreo-estratificado.html", "capitulo-5-conglomerados.html",
                "capitulo-6-probabilidades-desiguales.html", "capitulo-7-encuestas-complejas.html",
                "capitulo-8-no-respuesta-ponderacion.html"):
        A.check("C", f'href="{cap}"' in M, f"la guía remite al {cap.split('-')[0]} {cap.split('-')[1]}")

    # ------------------------------------------------------------------ D
    print("\n=== D · Estructura ===")
    sel = selectores(H)
    A.check("D", sel == selectores(PLANTILLA.read_text(encoding="utf-8")),
            f"el CSS es el de la plantilla ({len(sel)} selectores)")
    # Los capítulos que no añadieron componentes propios comparten ese CSS.
    iguales = [p.name for p in sorted(SITIO.glob("capitulo-*.html")) if selectores(p.read_text(encoding="utf-8")) == sel]
    A.check("D", len(iguales) >= 5, f"y el de los capítulos que no añadieron componentes ({len(iguales)})")
    ids = re.findall(r' id="([^"]+)"', H)
    repes = sorted({i for i in ids if ids.count(i) > 1})
    A.check("D", not repes, "los identificadores son únicos", f"({repes})")
    huerfanos = sorted(set(re.findall(r'aria-controls="([^"]+)"', M)) - set(ids))
    A.check("D", not huerfanos, "todo aria-controls de los módulos tiene destino", f"({huerfanos})")
    A.check("D", M.count("<table>") == M.count("<caption"), "toda tabla lleva caption",
            f"({M.count('<table>')} tablas, {M.count('<caption')} captions)")
    locales = [h for h in re.findall(r'href="([^"]+)"', M) if not h.startswith(("http", "mailto", "#"))]
    rotos = sorted({h for h in locales if h != RMD_PUBLICADO.name and not (SITIO / h.split("#")[0]).exists()})
    A.check("D", not rotos, f"los {len(locales)} enlaces locales resuelven", f"({rotos})")
    A.check("D", not any("#" in h for h in locales), "ningún enlace con ancla profunda")
    A.check("D", f'href="{RMD_PUBLICADO.name}"' in M, "la guía enlaza la plantilla .Rmd")
    sin_codigo = re.sub(r"<pre>.*?</pre>", " ", M, flags=re.S)
    sin_code = re.sub(r"<code>.*?</code>", " ", sin_codigo, flags=re.S)
    sueltos = re.findall(r"<(?![a-zA-Z/!])", sin_codigo)
    A.check("D", not sueltos, "ningún «<» sin escapar en el marcado", f"({len(sueltos)})")
    moji = [s for s in ("Ã", "Â", "â€", "\ufffd") if s in H]
    A.check("D", not moji, "sin mojibake", f"({moji})")
    sin_tilde = re.findall(r"\b(analisis|diseno|tamano|numero|modulo|pagina|metodo|estadistica|poblacion|"
                           r"seleccion|estimacion|inclusion)\b", texto_visible(sin_code), re.I)
    A.check("D", not sin_tilde, "sin palabras comunes sin tilde en la prosa", f"({sorted(set(sin_tilde))})")
    for resto in ("PLANTILLA BASE", "Cajas y tipografía", "demo-deslizadores", "AUTOEVALUACIONES['demo']",
                  "Plantilla de capítulo", "@@", "⟦"):
        A.check("D", resto not in H, f"no queda «{resto}»")
    i = H.find("const courseData")
    titulos_cd = re.findall(r'\{ id: (\d+), title: "([^"]+)"', H[i:i + 4000])
    A.check("D", [(int(a), b) for a, b in titulos_cd] == [(int(a), b.strip()) for a, b in h2]
            and len(h2) == N_MODULOS, f"courseData tiene los {N_MODULOS} módulos, con el título de su h2")
    kb = len(H.encode("utf-8")) / 1024
    A.check("D", kb < 800, f"pesa {kb:.0f} KB, dentro de los 800 KB")

    # ------------------------------------------------------------------ E
    print("\n=== E · Código ===")
    frente_codigo(A, M, V)

    # ------------------------------------------------------------------ G
    print("\n=== G · Contenido (auditoría del 22 oct 2026) ===")
    frente_contenido(A, M, mod)

    # ------------------------------------------------------------------ F
    print("\n=== F · Modalidad conjunta ===")
    frente_conjunta(A, mod(T_CONJUNTA), V)

    print("\n" + "=" * 62)
    print(f"  {A.ok + len(A.fallos)} comprobaciones · {len(A.fallos)} fallo(s)")
    print("=" * 62)
    if A.fallos:
        print("\nAbiertos:")
        for fr, que, det in A.fallos:
            print(f"  · [{fr}] {que}  {det}")
        return 1
    print("\nTodo limpio.")
    return 0


def cifras_cadena() -> dict:
    """Las salidas de la cadena, leídas aquí por su cuenta (no las del ensamblador)."""
    sal = {k: [l[2:].strip() for l in v.split("\n") if l.startswith("#>")] for k, v in bloques_cadena().items()}
    j = {k: "\n".join(v) for k, v in sal.items()}
    out = {}
    mo = re.search(r"^(\d+)\s+(\d+)$", j["R1"], re.M)
    out["n_mas"], out["n"] = (int(mo.group(1)), int(mo.group(2))) if mo else (None, None)
    mo = re.search(r"^\[1\] (\d+)$", j["R2"], re.M)
    out["N"] = int(mo.group(1)) if mo else None
    comp = re.findall(r"^(\d+)\s+(\d+)\s+(\d+)$", j["R3"], re.M)
    out["comp"] = [tuple(map(int, c)) for c in comp]
    mo = re.search(r"^api00\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)$", j["R4"], re.M)
    out["media"], out["ee"], out["deff"] = map(float, mo.groups()) if mo else (None,) * 3
    mo = re.search(r"^api00\s+([\d.]+)\s+([\d.]+)$", j["R4"], re.M)
    out["inf"], out["sup"] = map(float, mo.groups()) if mo else (None, None)
    unos = re.findall(r"^\[1\] ([\d.]+)$", j["R4"], re.M)
    out["ee2"], out["param"] = (float(unos[0]), float(unos[-1])) if len(unos) >= 2 else (None, None)
    mo = re.search(r"^\[1\] (TRUE|FALSE)$", j["R4"], re.M)
    out["cubre"] = (mo.group(1) == "TRUE") if mo else None
    return out


def frente_codigo(A: Auditoria, M: str, V: str) -> None:
    b = bloques_cadena()
    pres = [_html.unescape(x) for x in re.findall(r'<code class="language-r">(.*?)</code>', M, re.S)]
    A.check("E", len(b) == 4 and len(pres) == len(b), f"la guía tiene los {len(b)} bloques de la cadena",
            f"({len(pres)} en la guía)")
    for (k, cuerpo), p in zip(b.items(), pres):
        A.check("E", cuerpo == p, f"el bloque {k} es, byte a byte, el de la cadena ejecutada")
    c = cifras_cadena()
    A.check("E", None not in (c["n"], c["N"], c["media"], c["inf"], c["param"], c["cubre"]) and len(c["comp"]) == 2,
            "las salidas del ejemplo están en la cadena")
    if None in (c["n"], c["N"], c["media"], c["inf"], c["param"], c["cubre"]) or len(c["comp"]) != 2:
        return
    prosa = re.sub(r"<pre>.*?</pre>", " ", M, flags=re.S)
    vp = texto_visible(prosa)
    co = lambda x, d: f"{x:.{d}f}".replace(".", ",")
    A.check("E", f"pediría {c['n_mas']} escuelas" in vp and f"proporcional {c['n']}" in vp,
            f"la prosa cita los dos tamaños de la salida ({c['n_mas']} y {c['n']})")
    A.check("E", f"{c['N']:,}".replace(",", " ") in _html.unescape(prosa), f"la prosa cita las {c['N']} escuelas")
    A.check("E", f"{c['comp'][0][0]} de las" in vp and f"{c['comp'][1][2]} salen siempre" in vp,
            "la prosa cita las dos comprobaciones de la salida")
    A.check("E", f"de {co(c['inf'], 1)} a {co(c['sup'], 1)}" in vp, "la prosa cita el intervalo de la salida")
    A.check("E", co(c["param"], 1) in vp and co(c["deff"], 2) in vp and co(c["ee"], 2) in vp,
            "la prosa cita el parámetro, el DEff y el EE de la salida")
    A.check("E", co(1.96 * c["ee"], 1) in vp, "la prosa cita el margen logrado, 1,96 × EE")
    # Lo que la prosa afirma, contra la salida.
    A.check("E", c["cubre"] is False and not (c["inf"] <= c["param"] <= c["sup"]) and "no contiene" in vp,
            "el intervalo no contiene el parámetro, y la prosa lo dice")
    A.check("E", abs(c["deff"] - 1) < 0.05 and "casi 1" in vp, "el DEff es casi 1, como dice la prosa")
    A.check("E", abs(c["ee"] - c["ee2"]) < 1e-4, "el EE por la fórmula es el de survey")
    A.check("E", c["n"] < c["n_mas"] and c["n"] >= D.N_MINIMO, "el estratificado pide menos, y cumple el mínimo")
    A.check("E", c["comp"][1][0] == c["N"] and c["comp"][0][0] < 0.01 * c["N"] and c["comp"][0][1:] == (0, 0),
            "la comprobación aprueba el guion correcto y rechaza el roto")
    # La plantilla .Rmd.
    A.check("E", RMD_PUBLICADO.exists() and RMD_PUBLICADO.read_bytes() == RMD_FUENTE.read_bytes(),
            "la plantilla .Rmd del sitio es la de la fuente")
    rmd = RMD_FUENTE.read_text(encoding="utf-8")
    semilla = re.search(r"set\.seed\((\d+)\)", b["R2"])
    asig = re.search(r"n_h <- c\(E = \d+, H = \d+, M = \d+\)", b["R2"])
    A.check("E", bool(semilla) and f"set.seed({semilla.group(1)})" in rmd and bool(asig) and asig.group(0) in rmd,
            "la plantilla usa la misma semilla y la misma asignación que el guion de la guía")
    A.check("E", 'read.csv("datos/muestra.csv")' in rmd and "write.csv" not in rmd,
            "la plantilla lee la muestra escrita y no escribe nada")
    if os.environ.get("PROYECTO_SIN_R") == "1":
        print("  (la parte que corre R, saltada: PROYECTO_SIN_R=1)")
        return
    r = subprocess.run([sys.executable, str(RAIZ / "precalculo" / "anota_salidas.py"), str(CADENA), "--check"],
                       capture_output=True, text=True, cwd=RAIZ)
    A.check("E", r.returncode == 0 and "0 bloques con la salida distinta" in r.stdout,
            "la cadena, ejecutada hoy, da lo anotado", f"({r.stdout.strip()[-120:]})")
    frente_plantilla(A, c)


def render(tmp: pathlib.Path) -> tuple[int, str, str]:
    shutil.copyfile(RMD_FUENTE, tmp / "informe.Rmd")
    env = dict(os.environ, LANG="en_US.UTF-8", LC_ALL="en_US.UTF-8")
    r = subprocess.run([RSCRIPT, "--vanilla", "-e", 'rmarkdown::render("informe.Rmd", quiet = TRUE)'],
                       capture_output=True, text=True, cwd=tmp, env=env)
    out = tmp / "informe.html"
    return r.returncode, texto_visible(out.read_text(encoding="utf-8")) if out.exists() else "", r.stderr


def datos_estudiante(tmp: pathlib.Path, codifica, nadie_en: str | None = None, con_estrato=False) -> None:
    """Una muestra de estudiante: ids de texto, otros estratos, no respuesta."""
    import random
    rnd = random.Random(7)
    (tmp / "datos").mkdir()
    estratos = {"Semestre 1-3": 120, "Semestre 4-6": 100, "Semestre 7-10": 80}
    filas_m, filas_d, k = [], [], 0
    for h, Nh in estratos.items():
        for _ in range(20):
            k += 1
            idk = f"U{k:03d}"
            filas_m.append(f"{idk},{h},{Nh},{20 / Nh},{Nh / 20}")
            resp = 0 if h == nadie_en else int(rnd.random() < 0.8)
            y = f"{rnd.gauss(15, 4):.1f}" if resp else "NA"
            filas_d.append(f"{idk},{codifica(resp)},{y}" + (f",{h}" if con_estrato else ""))
    (tmp / "datos" / "muestra.csv").write_text("id,estrato,N_h,pi_k,peso\n" + "\n".join(filas_m) + "\n")
    (tmp / "datos" / "datos.csv").write_text("id,respondio,api00" + (",estrato" if con_estrato else "")
                                             + "\n" + "\n".join(filas_d) + "\n", encoding="utf-8")


def frente_plantilla(A: Auditoria, c: dict) -> None:
    with tempfile.TemporaryDirectory() as t1:
        rc, txt, err = render(pathlib.Path(t1))
        A.check("E", rc == 0 and "ESTE INFORME USA EL EJEMPLO DE LA GUÍA" in txt
                and f"La media estimada es {c['media']:.1f}".replace(".", ",") in txt
                and not (pathlib.Path(t1) / "datos").exists(),
                "la plantilla sin datos usa el ejemplo de la guía, lo avisa, da su media y no escribe en datos/",
                f"({err.strip()[-160:]})")
    for nombre, cod, estr in (("1/0", lambda r: str(r), True), ("sí/no", lambda r: "sí" if r else "no", False)):
        with tempfile.TemporaryDirectory() as t2:
            datos_estudiante(pathlib.Path(t2), cod, con_estrato=estr)
            rc, txt, err = render(pathlib.Path(t2))
            mo = re.search(r"formula\s+survey\s+##\s*([\d.]+)\s+([\d.]+)", txt)
            A.check("E", rc == 0 and bool(mo) and abs(float(mo.group(1)) - float(mo.group(2))) < 1e-6
                    and "ESTE INFORME USA" not in txt,
                    f"con datos de estudiante ({nombre}{', con estrato repetido' if estr else ''}) la plantilla "
                    "estima y las dos vías coinciden", f"({err.strip()[-160:]})")
    with tempfile.TemporaryDirectory() as t3:
        datos_estudiante(pathlib.Path(t3), lambda r: "TRUE" if r else "FALSE", nadie_en="Semestre 7-10")
        rc, txt, err = render(pathlib.Path(t3))
        A.check("E", rc != 0 and "menos de 2 respuestas" in err,
                "con un estrato sin respuestas, la plantilla para con un mensaje claro")


def frente_contenido(A: Auditoria, M: str, mod) -> None:
    """Cada corrección de la auditoría de contenido, con una comprobación que
    falla con el texto que había antes (candidata del 22 oct, sin corregir)."""
    tx = lambda t: texto_visible(mod(t))
    m1, m2, m3, m4 = tx("Cómo funciona el proyecto"), tx(T_QUE_VALE), tx(T_REPOSITORIO), tx(T_FICHA)
    m5, m6, m7, m9, m10 = tx(T_PROTOCOLO), tx(T_AVANCE), tx(T_INFORME), tx(T_CONJUNTA), tx(T_RUBRICA)
    c5 = mod(T_PROTOCOLO)
    rmd = RMD_FUENTE.read_text(encoding="utf-8")
    G = lambda cond, ids, que: A.check("G", cond, f"{ids} · {que}")
    G("abs(z) > 3" in _html.unescape(c5) and "unidad por unidad" in m5 and "no prueba nada" in m5
      and "frecuencia de cada estrato" not in m6 + m5,
      "ES-1·PE-1·CL-1·IA-1", "π_k se comprueba unidad por unidad; la media por estrato no prueba nada")
    G("antes de llevar la muestra al campo" in m5 and "<pre>" not in mod(T_AVANCE),
      "PE-1", "la comprobación va en el protocolo, antes del campo")
    G("match(" in _html.unescape(c5), "CO-3", "la comprobación cuenta por identificador, no por posición")
    G("Esa fórmula es la de un aleatorio simple" in m5 and "pediría" in m5,
      "ES-6·PE-9·CL-10", "el tamaño se calcula con la varianza del diseño que se corre, comparando dos")
    G("La única excepción: el piloto" in m5 and "no entran en la estimación" in m5, "PE-8·CL-9", "el piloto")
    G("Hasta el cierre puedes corregirlo" in m3 and "Después de publicar la release protocolo, el archivo" not in m3,
      "CL-4", "se corrige con protocolo-2 hasta el cierre; desde el cierre no se edita")
    G("salgan juntas" in m5, "ES-4", "la varianza de Horvitz–Thompson necesita las π_kl")
    G("crece en proporción" in m2, "ES-5", "el PPT conviene si la variable crece con el tamaño")
    G("no se puede estimar" in m2 and "proporcional a su área" in m2, "ES-8·CL-20", "el sistemático y la cuadrícula")
    G("conoces su total en la población" in m2 and "El estrato de cada unidad está en el marco" in m2,
      "ES-18", "razón y regresión son estimadores; el estrato tiene que estar en el marco")
    G("Poblaciones que sirven" in m2 and "han funcionado" not in m2, "CL-28", "no se inventa un historial")
    G("el módulo 10 dice qué pasa entonces" in m2 and "protocolo-2" in m10, "PE-4·CL-22",
      "la condición del diseño no probabilístico es una sola y se puede aplicar")
    G("nunca la cédula" in m2 and "privado/" in m3 and "privado/" in M[M.index("Lo que R genera"):M.index("Lo que R genera") + 400],
      "CO-10", "la carpeta privado/ en el .gitignore y un identificador creado para el proyecto")
    G("perez-gomez" in m3, "CL-19", "el nombre del repositorio no se lee como los dos apellidos de uno")
    G("R/comprobacion.R" in m3 and "su probabilidad de inclusión y su peso" in m3, "CO-2·CL-16",
      "la estructura del repositorio coincide con el guion y la plantilla")
    ficha = re.search(r"Integrantes: (.*?)Qué pasa después", m4)
    palabras = len(ficha.group(1).split()) if ficha else 0
    G(120 <= palabras <= 180, "CL-8", f"el ejemplo de ficha calibra las 150 palabras ({palabras})")
    G("dos causas" in m4, "ES-19", "el Literary Digest tuvo dos causas")
    G("como enseña el módulo 5" in m1, "CL", "la remisión del módulo 1 va al módulo de la comprobación")
    G("básica secundaria (M) y media (H)" in m5 and "sobrerrepresenta" not in m5 + m7, "ES-15·CL-24",
      "los tipos de escuela con su nombre en Colombia, y sin justificación a posteriori")
    G("exactamente el tamaño de la población" in m5 and "solo en promedio" in m5, "ES-10", "cuándo suman N los pesos")
    G("vale TRUE o FALSE" in m6 and "primera ronda de contactos" in m6, "CL-3·CL-17", "respondio y el estado del campo")
    G("Si tu marco es un archivo público" in m6, "PE-3·CL-15", "qué es bitácora y no respuesta con un archivo")
    G("segunda vía" in m7 and "una de cada veinte muestras posibles" in m7 and "Un ajuste declarado" in m7,
      "PE-10·ES-11·ES-14·ES-2", "la segunda vía, el intervalo y los ajustes declarados")
    G("los diez campos del protocolo" in m9 and "al menos dos" in m9 and "avance-muestreo" in m9,
      "PE-5·CL-5·CL-11·PE-7·CL-6", "la modalidad conjunta: el protocolo completo, la forma B y cómo desistir")
    # La rúbrica, leída de la guía impresa: criterio por criterio, sus tres niveles.
    rub = {}
    for cid, cuerpo in re.findall(r"<caption><strong>([A-Z]\d) · .*?</caption>(.*?)</table>", mod(T_RUBRICA), re.S):
        niv = dict(re.findall(r"<tr><td>(Insuficiente|Aceptable|Sólido)</td><td>(.*?)</td></tr>", cuerpo, re.S))
        rub[cid] = {"insuficiente": _html.unescape(niv.get("Insuficiente", "")),
                    "aceptable": _html.unescape(niv.get("Aceptable", "")),
                    "solido": _html.unescape(niv.get("Sólido", ""))}
    G("ignora los conglomerados" in rub["I2"]["insuficiente"] and "conglomerados" not in rub["I2"]["aceptable"]
      and "por una sola vía" in rub["I2"]["aceptable"] and "sin declarar el ajuste" in rub["I2"]["insuficiente"],
      "ES-7·CL-7·PE-10·ES-2", "I2: los niveles no se solapan y los ajustes declarados no se castigan")
    G("no se usó ninguna" in rub["I6"]["solido"], "PE-12·IA-5", "I6 califica a quien no usó IA")
    G("sin decir hacia dónde" in rub["P1"]["aceptable"], "PE-11", "P1 tiene el nivel intermedio")
    G("otra decisión" in rub["E2"]["solido"] and ", o no qué" in rub["E2"]["aceptable"]
      and " o qué no se puede" in rub["E1"]["aceptable"], "PE-14", "E1 y E2 sin casos sin nivel")
    G("modalidad conjunta" in rub["I1"]["solido"] and "modalidad conjunta" in rub["I4"]["solido"],
      "PE-6·CL-13", "I1 e I4 califican la sección de integración")
    G("datos personales" in rub["I5"]["insuficiente"] and "extensión" in rub["I5"]["aceptable"],
      "PE-13", "I5 califica los datos personales y la extensión")
    G("comprobado unidad por unidad" in rub["P2"]["solido"] and "con un archivo público" in rub["A1"]["solido"],
      "PE-1·PE-3", "P2 califica la comprobación; A1 sabe leer la opción del archivo")
    G("valores de respondio que no entiendo" in rmd and "menos de 2 respuestas" in rmd and "setdiff" in rmd
      and "peso_aj" in rmd and "AJUSTE POR NO RESPUESTA" in rmd and "warning = FALSE" not in rmd,
      "ES-2·ES-3·CO-1·CO-4·CO-5·CO-6·CO-7", "la plantilla: respondio, estratos sin respuesta, columnas y ajuste declarado")


def frente_conjunta(A: Auditoria, C: str, V: str) -> None:
    c = texto_visible(C)
    A.check("F", "todos los integrantes cursan las dos materias" in c, "D1 · solo si todos cursan las dos materias")
    A.check("F", "Tienen que estar las dos aleatorizaciones" in c, "D3 · las dos aleatorizaciones")
    A.check("F", "Forma A" in c and "Forma B" in c and "Solo vale si además" in c, "D4 · las formas A y B, con su condición")
    A.check("F", "no vale" in c and "Diseño no admite datos que ya existen" in c, "D3 · no vale el archivo público en la forma A")
    A.check("F", "dos notas" in c and "ninguna nota se copia a la otra" in c, "D2 · una entrega, dos notas")
    A.check("F", "cuatro preguntas" in c and "I1 e I4" in c, "D6 · la sección de integración, calificada en I1 e I4")
    A.check("F", f"hasta {D.CONJUNTO_PAGINAS_PREREGISTRO} páginas" in c and f"hasta {D.CONJUNTO_PAGINAS_INFORME} páginas" in c,
            f"D7 · {D.CONJUNTO_PAGINAS_PREREGISTRO} páginas de preregistro y {D.CONJUNTO_PAGINAS_INFORME} de informe")
    A.check("F", f"<code>{D.CONJUNTO_REPO}</code>" in C, "D8 · el repositorio es el de Diseño")
    A.check("F", "tarde para las dos" in c, "D10 · una release tarde es tarde para las dos materias")
    A.check("F", "por separado" in c and "yo el muestreo, tú la ANOVA" in c, "D11 · sustentación por separado, los dos responden por todo")
    A.check("F", f"Hasta el {frase(D.CONJUNTO_DESISTIR_HASTA)} a las {D.HORA_ENTREGA}" in c,
            "D15 · se puede desistir hasta el avance")
    filas = re.findall(r"<tr><td><code>(\w+)</code></td><td>[^<]+</td><td>([^<]+)</td><td>(\d+)</td></tr>", C)
    A.check("F", [f[0] for f in filas] == ["conjunto", "preregistro", "avance", "informe"],
            "D9 · la tabla de la modalidad conjunta tiene sus cuatro releases", f"({[f[0] for f in filas]})")
    for etiqueta, fr, sem in filas:
        d = next((h["fecha"] for h in D.CONJUNTO_HITOS if h["id"] == etiqueta), None)
        A.check("F", d is not None and fr == frase(d) and int(sem) == semana(d),
                f"D9 · «{etiqueta}» cierra el {fr}, semana {sem}")
    # Lo aprobado: D9 del plan conjunto, y las fechas de la guía de Diseño.
    fechas = {h["id"]: h["fecha"] for h in D.CONJUNTO_HITOS}
    A.check("F", fechas["conjunto"] == date(2026, 10, 23) and fechas["preregistro"] == date(2026, 10, 30),
            "D9 aprobada: release conjunto el viernes 23 y preregistro conjunto el viernes 30")
    A.check("F", fechas["preregistro"] == D.HITO["protocolo"]["fecha"],
            "el protocolo de esta guía cierra el mismo día que el preregistro conjunto")
    if PLAN_CONJUNTO.exists():
        p = PLAN_CONJUNTO.read_text(encoding="utf-8")
        A.check("F", "viernes 23" in p and "viernes 30" in p and "APROBADA" in p,
                "PLAN_Proyecto_Conjunto.md dice lo mismo y está aprobado")
    if DATOS_DISENO.exists():
        txt = DATOS_DISENO.read_text(encoding="utf-8")
        dd = {k: date(int(a), int(b), int(c)) for k, a, b, c in
              re.findall(r'id="(\w+)".*?fecha=date\((\d+), (\d+), (\d+)\)', txt)}
        A.check("F", dd.get("avance") == fechas["avance"] and dd.get("informe") == fechas["informe"],
                "avance e informe conjuntos en las fechas de la guía de Diseño", f"({dd})")
    else:
        print("  (la guía de Diseño no está a mano: no se cruzan sus fechas)")


if __name__ == "__main__":
    sys.exit(main())
