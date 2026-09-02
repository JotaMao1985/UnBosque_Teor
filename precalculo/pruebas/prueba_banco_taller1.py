#!/usr/bin/env python3
"""Prueba del banco de 30 ítems del simulacro del Taller 1.

Por qué existe: el banco es un fichero de JavaScript que no se ejecuta hasta que
alguien abre la página ensamblada. Hasta entonces, tres defectos son invisibles:

1. **Una respuesta numérica que no coincide con el precálculo.** Es el defecto
   grave: el estudiante practica, acierta, y el simulacro le dice que se
   equivocó. Aquí cada `respuesta` se contrasta con la cifra que produjo
   `genera_taller1_recurso.R`.
2. **Un `dibujar` que lee un data.frame de R como si fuera objeto de columnas.**
   `jsonlite` escribe los data.frame como ARRAY DE FILAS, así que `C.n` es
   `undefined` y el gráfico entero lanza una excepción mientras los demás
   ítems siguen perfectos. Ya pasó con tres simuladores del capítulo 3 a la vez.
   Aquí los tres `dibujar` se ejecutan de verdad, contra el JSON de verdad, con
   Chart.js sustituido por un doble que registra lo que recibe.
3. **Un ítem sin retroalimentación, o con dos opciones correctas.** El motor no
   protesta: simplemente no explica nada, o no deja acertar nunca.

Y comprueba lo que pide la matriz de contenidos (T0.1): 30 ítems en la
proporción exacta por semana y por tipo.

    python3 precalculo/pruebas/prueba_banco_taller1.py

No necesita R: lee el JSON ya generado. Necesita node (el mismo que usa
`node --check` antes de publicar un capítulo).
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent.parent
BANCO = RAIZ / "ensamblado" / "modulos" / "taller1" / "simulacro.js"
DATOS = RAIZ / "precalculo" / "salidas" / "taller1_recurso_datos.json"

# La distribución que fija la matriz de contenidos: (total, opcion, multiple,
# numerica, texto, grafico) por semana.
MATRIZ = {
    1: (5, 3, 1, 0, 1, 0),
    2: (8, 4, 1, 1, 1, 1),
    3: (9, 3, 1, 3, 1, 1),
    4: (8, 3, 1, 2, 1, 1),
}

# Cada respuesta numérica, con la ruta de la cifra que la respalda en el JSON del
# precálculo y los decimales a los que se redondeó al escribirla en el banco.
RESPUESTAS = {
    "sesgo": ("noRespuesta.sesgo", 4),
    "errorEstandar": ("mas.seFpc", 4),
    "limiteSuperior": ("mas.icHi", 2),
    "inflacionFpc": ("mas.inflacion", 2),
    "tamanoMedia": ("tamano.nMedia", 0),
    "tamanoProporcion": ("tamano.crimes.n", 0),
}

# El arnés: carga el JSON, define los ayudantes de gráfico como dobles que
# registran lo que se les pasa, ejecuta el banco y vuelca todo como JSON.
ARNES = r"""
const fs = require('fs');
const DATOS_TALLER1 = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const AUTOEVALUACIONES = {};
const registro = [];

// Dobles de los ayudantes del motor. No dibujan: anotan los puntos que reciben,
// que es lo que hay que poder revisar sin navegador.
function crearGraficoXY(canvas, datasets, opciones = {}) {
  registro.push({ datasets, opciones });
  return { destroy() {} };
}
function serieHistograma(hist, etiqueta, color, escala = 1) {
  return { label: etiqueta, data: hist.centros.map((c, i) => ({ x: c * escala, y: hist.conteo[i] })) };
}
function serieVertical(x, alto, etiqueta, color) {
  return { label: etiqueta, data: [{ x, y: 0 }, { x, y: alto }] };
}

BANCO_AQUI

// El banco vive en BANCO_TALLER1; la pagina lo reparte en cuatro quizzes por
// semana. Se comprueban las dos cosas: el banco entero y que el reparto no
// pierde ni duplica ningun item.
const reparto = [1, 2, 3, 4].map(s => (AUTOEVALUACIONES['taller1-s' + s] || []).length);
const items = BANCO_TALLER1.map((p, i) => {
  const salida = {
    i, tipo: p.tipo, modulo: p.modulo, semana: p.semana, ancla: p.ancla,
    pregunta: p.pregunta, pista: p.pista,
    opciones: p.opciones, respuesta: p.respuesta, tolerancia: p.tolerancia,
    retroAcierto: p.retroAcierto, retroFallo: p.retroFallo,
    respuestaModelo: p.respuestaModelo, comprobacion: p.comprobacion,
    alto: p.alto, descripcionGrafico: p.descripcionGrafico
  };
  if (typeof p.dibujar === 'function') {
    const antes = registro.length;
    p.dibujar({});                       // se ejecuta de verdad
    salida.grafico = registro.slice(antes);
  }
  return salida;
});
process.stdout.write(JSON.stringify({ items, reparto }));
"""


class Fallo(Exception):
    pass


REPARTO = []


def busca(datos, ruta):
    valor = datos
    for parte in ruta.split("."):
        valor = valor[parte]
    return valor


def carga_banco():
    """Ejecuta el banco con node y devuelve los 30 ítems ya evaluados."""
    guion = ARNES.replace("BANCO_AQUI", BANCO.read_text(encoding="utf-8"))
    with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as f:
        f.write(guion)
        ruta = f.name
    try:
        r = subprocess.run(["node", ruta, str(DATOS)], capture_output=True, text=True)
        if r.returncode != 0:
            raise Fallo(f"el banco no se ejecuta:\n{r.stderr.strip()}")
        datos = json.loads(r.stdout)
        return datos["items"], datos["reparto"]
    finally:
        Path(ruta).unlink()


def prueba_distribucion(items, _datos):
    """30 ítems, en la proporción por semana y tipo que fija la matriz."""
    # El reparto en los cuatro quizzes de la página no puede perder ni duplicar
    # nada: si un ítem se quedara sin `semana`, desaparecería de la página en
    # silencio y aquí seguiría contándose.
    if sum(REPARTO) != len(items):
        raise Fallo(f"los cuatro quizzes suman {sum(REPARTO)} ítems y el banco tiene {len(items)}")
    if len(items) != 30:
        raise Fallo(f"hay {len(items)} ítems, no 30")
    orden = ["opcion", "multiple", "numerica", "texto", "grafico"]
    for semana, esperado in MATRIZ.items():
        de_la_semana = [p for p in items if p["semana"] == semana]
        real = (len(de_la_semana),) + tuple(
            sum(1 for p in de_la_semana if p["tipo"] == t) for t in orden
        )
        if real != esperado:
            raise Fallo(f"semana {semana}: {real}, se esperaba {esperado}")
        for p in de_la_semana:
            if p["modulo"] != semana:
                raise Fallo(
                    f"ítem {p['i']}: modulo={p['modulo']} y semana={p['semana']}. "
                    "El resumen final del quiz nombra el módulo, así que tienen que coincidir"
                )


def prueba_respuestas(items, datos):
    """Cada respuesta numérica coincide con la cifra del precálculo."""
    numericas = [p for p in items if p["tipo"] == "numerica"]
    if len(numericas) != len(RESPUESTAS):
        raise Fallo(f"{len(numericas)} ítems numéricos y {len(RESPUESTAS)} cifras declaradas")
    pendientes = dict(RESPUESTAS)
    for p in numericas:
        for nombre, (ruta, dec) in list(pendientes.items()):
            esperado = round(float(busca(datos, ruta)), dec)
            if abs(p["respuesta"] - esperado) < 1e-9:
                del pendientes[nombre]
                break
        else:
            candidatas = {n: round(float(busca(datos, r)), d) for n, (r, d) in pendientes.items()}
            raise Fallo(
                f"la respuesta {p['respuesta']} del ítem {p['i']} no sale del precálculo. "
                f"Sin emparejar: {candidatas}"
            )
        if not p.get("tolerancia"):
            raise Fallo(f"ítem {p['i']}: respuesta numérica sin tolerancia")


def prueba_retroalimentacion(items, _datos):
    """Ninguna opción se queda sin explicar, y hay exactamente una correcta."""
    for p in items:
        if p["tipo"] in ("opcion", "grafico"):
            correctas = [o for o in p["opciones"] if o.get("correcta")]
            if len(correctas) != 1:
                raise Fallo(f"ítem {p['i']}: {len(correctas)} opciones correctas, debe haber 1")
            for j, o in enumerate(p["opciones"]):
                if not o.get("retro"):
                    raise Fallo(f"ítem {p['i']}, opción {j}: sin `retro`. "
                                "La matriz exige explicar POR QUÉ cada opción es falsa")
        elif p["tipo"] == "multiple":
            if not any(o.get("correcta") for o in p["opciones"]):
                raise Fallo(f"ítem {p['i']}: selección múltiple sin ninguna opción correcta")
            if not (p.get("retroAcierto") and p.get("retroFallo")):
                raise Fallo(f"ítem {p['i']}: selección múltiple sin retroAcierto/retroFallo")
        elif p["tipo"] == "numerica":
            if not (p.get("retroAcierto") and p.get("retroFallo")):
                raise Fallo(f"ítem {p['i']}: numérica sin retroAcierto/retroFallo")
        elif p["tipo"] == "texto":
            if not p.get("respuestaModelo"):
                raise Fallo(f"ítem {p['i']}: abierta sin respuestaModelo")
            if len(p.get("comprobacion") or []) != 3:
                raise Fallo(f"ítem {p['i']}: la lista de comprobación debe tener 3 puntos")
        if not p.get("pista"):
            raise Fallo(f"ítem {p['i']}: sin pista. El motor la muestra tras el primer fallo")


def prueba_graficos(items, _datos):
    """Los tres `dibujar` se ejecutan y producen puntos finitos de verdad.

    Es la prueba que caza el data.frame leído como objeto de columnas: si
    `C.n` es undefined, los puntos salen {x: undefined} y aquí se ve.
    """
    graficos = [p for p in items if p["tipo"] == "grafico"]
    if len(graficos) != 3:
        raise Fallo(f"{len(graficos)} ítems de gráfico, se esperaban 3")
    for p in graficos:
        llamadas = p.get("grafico") or []
        if len(llamadas) != 1:
            raise Fallo(f"ítem {p['i']}: `dibujar` hizo {len(llamadas)} gráficos, debe hacer 1")
        for ds in llamadas[0]["datasets"]:
            puntos = [q for q in ds["data"] if q is not None]
            if not puntos:
                raise Fallo(f"ítem {p['i']}, serie «{ds.get('label')}»: sin un solo punto")
            for q in puntos:
                if not isinstance(q.get("x"), (int, float)) or not isinstance(q.get("y"), (int, float)):
                    raise Fallo(
                        f"ítem {p['i']}, serie «{ds.get('label')}»: punto no numérico {q}. "
                        "Casi seguro es un data.frame de R leído como objeto de columnas: "
                        "jsonlite los escribe como array de FILAS"
                    )
        if not p.get("descripcionGrafico"):
            raise Fallo(f"ítem {p['i']}: gráfico sin descripcionGrafico (accesibilidad)")


def prueba_anclas(items, _datos):
    """Todo ítem apunta a un módulo real del capítulo 1 o 2 y a una sección de Lohr."""
    modulos = {1: 10, 2: 11}          # cuántos módulos tiene cada capítulo publicado
    for p in items:
        a = p.get("ancla") or {}
        if a.get("cap") not in modulos:
            raise Fallo(f"ítem {p['i']}: ancla en el capítulo {a.get('cap')}; solo valen el 1 y el 2")
        if not 1 <= a.get("modulo", 0) <= modulos[a["cap"]]:
            raise Fallo(f"ítem {p['i']}: el capítulo {a['cap']} no tiene módulo {a.get('modulo')}")
        if not a.get("lohr") or not a.get("titulo"):
            raise Fallo(f"ítem {p['i']}: ancla sin sección de Lohr o sin título de módulo")


PRUEBAS = [
    ("distribución por semana y tipo", prueba_distribucion),
    ("respuestas numéricas contra el precálculo", prueba_respuestas),
    ("retroalimentación de cada opción", prueba_retroalimentacion),
    ("los tres gráficos se ejecutan", prueba_graficos),
    ("anclas al material publicado", prueba_anclas),
]


def main():
    if not DATOS.exists():
        print(f"Falta {DATOS.relative_to(RAIZ)}. Ejecuta antes:")
        print("  Rscript precalculo/genera_taller1_recurso.R")
        return 1
    try:
        items, reparto = carga_banco()
    except Fallo as e:
        print(f"✗ {e}")
        return 1
    datos = json.loads(DATOS.read_text(encoding="utf-8"))

    global REPARTO
    REPARTO = reparto
    fallos = 0
    for nombre, prueba in PRUEBAS:
        try:
            prueba(items, datos)
            print(f"  ✓ {nombre}")
        except Fallo as e:
            print(f"  ✗ {nombre}: {e}")
            fallos += 1
    print(f"\n{len(PRUEBAS) - fallos} de {len(PRUEBAS)} pruebas pasan.")
    return 1 if fallos else 0


if __name__ == "__main__":
    sys.exit(main())
