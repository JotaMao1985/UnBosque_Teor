#!/usr/bin/env python3
"""prueba_audita_proyecto.py — ¿Caza el auditor lo que dice que caza?

Calcado del arnés de Diseño. Inyecta un defecto por vez en una COPIA de la guía
y exige dos cosas: que `audita_proyecto.py` falle, y que falle EN EL FRENTE al
que ese defecto pertenece. Un auditor que para por la razón equivocada solo
acierta por suerte. Antes y después corre un control limpio: si el original no
pasa, el arnés no mide nada.

    python3 ensamblado/proyecto/prueba_audita_proyecto.py

Los defectos van con PROYECTO_SIN_R=1: ninguno toca la cadena ni la plantilla,
y la parte del frente E que corre R la cubre el control limpio.
"""
from __future__ import annotations

import os
import pathlib
import re
import subprocess
import sys
import tempfile

AQUI = pathlib.Path(__file__).resolve().parent
GUIA = AQUI.parent.parent / "sitio" / "muestreo" / "proyecto-integrador-corte-iii.html"
AUDITOR = AQUI / "audita_proyecto.py"


def cambia(viejo: str, nuevo: str, todas: bool = False):
    def f(t: str) -> str:
        if viejo not in t:
            raise SystemExit(f"!! el arnés no encuentra «{viejo[:60]}»: el defecto no se inyectaría")
        return t.replace(viejo, nuevo, -1 if todas else 1)
    return f


def antes_de_style(extra: str):
    def f(t: str) -> str:
        i = t.index("</style>")
        return t[:i] + extra + t[i:]
    return f


def en_modulo(n: int, extra: str):
    def f(t: str) -> str:
        marca = f'<template id="module-{n}">'
        i = t.index(marca) + len(marca)
        return t[:i] + extra + t[i:]
    return f


# (nombre, frente esperado, transformación)
DEFECTOS = [
    # A · Calendario
    ("día de la semana equivocado", "A", cambia("martes 27 de octubre", "lunes 27 de octubre", todas=True)),
    ("una fecha que no es de ningún hito", "A", cambia("martes 27 de octubre", "martes 3 de noviembre", todas=True)),
    ("una semana mal en la tabla de hitos", "A",
     cambia("<td>martes 27 de octubre</td><td>12</td>", "<td>martes 27 de octubre</td><td>11</td>")),
    ("una hora de cierre distinta", "A", cambia("a las 11:00", "a las 12:00")),
    # B · Pesos
    ("un criterio con otros puntos", "B",
     cambia("I2 · Corrección técnica de la estimación</strong> — 12 puntos",
            "I2 · Corrección técnica de la estimación</strong> — 13 puntos")),
    ("la columna del corte mal multiplicada", "B",
     cambia("<td><strong>22.5 %</strong></td>", "<td><strong>23 %</strong></td>")),
    ("los quices con otro peso", "B",
     cambia("quices que se hacen en clase, el otro <strong>50 %</strong>",
            "quices que se hacen en clase, el otro <strong>40 %</strong>")),
    ("el descuento compuesto en la tabla", "B", cambia("<tr><td>2</td><td>30 %</td><td>2,8</td></tr>",
                                                         "<tr><td>2</td><td>30 %</td><td>2,89</td></tr>")),
    ("un porcentaje suelto en la prosa", "B",
     en_modulo(4, "\n      <p>La ficha vale el 7 % de algo.</p>\n")),
    # C · Decisiones
    ("tríos permitidos", "C", cambia("individual o en parejas", "en grupos de hasta tres", todas=True)),
    ("una de las seis condiciones desaparece", "C",
     cambia("<li><strong>La selección es reproducible</strong>", "<li><strong>La selección queda a criterio</strong>")),
    ("el descuento sobre lo que va quedando", "C", cambia("sobre la nota\n        original", "sobre lo que\n        va quedando")),
    ("vuelve el examen final", "C", en_modulo(2, "\n      <p>Además hay un examen final de todo el curso.</p>\n")),
    ("el protocolo se entrega con otra etiqueta", "C",
     cambia("release\n        <code>protocolo</code>. Hasta", "release\n        <code>preregistro</code>. Hasta")),
    ("el mínimo de unidades cambia", "C", cambia("Al menos 30 unidades finales", "Al menos 20 unidades finales")),
    # C · Decisiones del bloque A (Javier, 22 oct)
    ("la semilla vuelve a elegirla el equipo", "C", cambia("La semilla no la eliges tú", "La semilla la eliges tú")),
    ("vuelve a valer apipop", "C", cambia("no valen <code>apipop</code>", "valen <code>apipop</code>")),
    ("el descuento puede dejar la nota negativa", "C", cambia("nunca baja la nota de 0", "puede bajar la nota de 0")),
    ("el tope del diseño no probabilístico cambia", "C",
     cambia("la nota de lo escrito no pasa de 3,0", "la nota de lo escrito no pasa de 3,5")),
    ("una sola pregunta por persona", "C", cambia("Cada integrante contesta dos", "Cada integrante contesta una")),
    ("el campo cierra en otra semana", "A",
     cambia("<td>viernes 13 de noviembre</td><td>14</td>", "<td>viernes 13 de noviembre</td><td>13</td>")),
    # D · Estructura
    ("un selector de CSS nuevo", "D", antes_de_style("\n    .clase-nueva { color: red; }\n")),
    ("un identificador repetido", "D", en_modulo(3, '\n      <div id="dup"></div><div id="dup"></div>\n')),
    ("un enlace roto", "D", en_modulo(5, '\n      <p><a href="capitulo-9-no-existe.html">x</a></p>\n')),
    ("mojibake", "D", en_modulo(6, "\n      <p>DiseÃ±o</p>\n")),
    ("una tabla sin caption", "D", en_modulo(7, "\n      <table><tr><td>x</td></tr></table>\n")),
    # E · Código
    ("una salida retocada a mano en un bloque", "E", cambia("api00 680.4400   7.3616 0.995",
                                                              "api00 680.4500   7.3616 0.995")),
    ("el intervalo de la prosa no es el de la salida", "E", cambia("de 666,0 a", "de 667,0 a")),
    ("un tamaño de la prosa no es el de la salida", "E", cambia("pediría 286 escuelas", "pediría 280 escuelas")),
    # G · Contenido (auditoría del 22 oct)
    ("vuelve la comprobación por estrato", "G", cambia("no prueba nada", "lo prueba todo")),
    ("el piloto deja de ser la excepción", "G", cambia("La única excepción: el piloto", "El piloto")),
    ("I6 deja fuera a quien no usó IA", "G", cambia("; o declara que no se usó ninguna", "")),
    ("vuelve el historial inventado", "G", cambia("Poblaciones que sirven", "Poblaciones que han funcionado")),
    ("I2 vuelve a solapar los conglomerados", "G",
     cambia("aleatoria simple sin serlo —la varianza ignora los conglomerados—",
            "aleatoria simple sin serlo")),
    ("el tamaño vuelve a ser solo el del aleatorio simple", "G",
     cambia("Esa fórmula es la de un aleatorio simple.", "Esa fórmula vale para cualquier diseño.")),
    # F · Modalidad conjunta
    ("la semana de la release conjunto", "F",
     cambia("<td>viernes 23 de octubre</td><td>11</td>", "<td>viernes 23 de octubre</td><td>12</td>")),
    ("las notas se promedian", "F", cambia("ninguna nota se copia a la otra", "las dos notas se promedian")),
    ("otra extensión del informe conjunto", "F", cambia("hasta <strong>15 páginas</strong>", "hasta <strong>12 páginas</strong>")),
    ("se reparten las preguntas", "F", cambia("yo el muestreo, tú la ANOVA", "cada uno su materia")),
]


def corre(ruta: pathlib.Path, sin_r: bool) -> tuple[int, set]:
    env = dict(os.environ, PROYECTO_HTML=str(ruta))
    if sin_r:
        env["PROYECTO_SIN_R"] = "1"
    r = subprocess.run([sys.executable, str(AUDITOR)], capture_output=True, text=True, env=env)
    frentes = set(re.findall(r"MAL \[([A-G])\]", r.stdout))
    return r.returncode, frentes


def main() -> int:
    original = GUIA.read_text(encoding="utf-8")
    rc, fr = corre(GUIA, sin_r=False)
    print(f"control limpio (con R): {'pasa' if rc == 0 else 'FALLA ' + str(sorted(fr))}")
    if rc != 0:
        return 1
    cazados, fallidos = 0, []
    with tempfile.TemporaryDirectory() as tmp:
        copia = pathlib.Path(tmp) / GUIA.name
        for nombre, frente, f in DEFECTOS:
            copia.write_text(f(original), encoding="utf-8")
            rc, fr = corre(copia, sin_r=True)
            ok = rc != 0 and frente in fr
            print(f"  {'cazado ' if ok else 'ESCAPA '} [{frente}] {nombre}"
                  + ("" if ok else f"  (falló en {sorted(fr)}, código {rc})"))
            cazados += ok
            if not ok:
                fallidos.append(nombre)
    rc, fr = corre(GUIA, sin_r=True)
    print(f"control limpio al final: {'pasa' if rc == 0 else 'FALLA ' + str(sorted(fr))}")
    print(f"\n{cazados} de {len(DEFECTOS)} defectos cazados en su frente")
    return 0 if cazados == len(DEFECTOS) and rc == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
