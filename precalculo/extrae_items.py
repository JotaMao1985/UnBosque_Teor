#!/usr/bin/env python3
"""Vuelca TODOS los ítems de autoevaluación a un JSON normalizado.

Por qué existe: la auditoría del banco (mecánica y de juicio) tiene que mirar
los mismos ítems, con los mismos índices y el mismo texto. Si cada revisor
—guion o agente— extrae por su cuenta, dos informes sobre el ítem «3 del cap. 2»
pueden hablar de ítems distintos, y no habría manera de saberlo. Aquí se extrae
una vez y todo lo demás lee este JSON.

Diferencia con `inventario_items.py`: ese CUENTA (cuántos ítems por módulo, para
decidir dónde faltan). Este TRANSCRIBE (el texto de cada opción, su `correcta` y
su `retro`, para poder juzgarlos). Comparten el cargador, en `_bancos.py`.

    python3 precalculo/extrae_items.py            # los 8 capítulos + el simulacro
    python3 precalculo/extrae_items.py --corte1   # solo cap1, cap2 y el simulacro

Escribe `precalculo/salidas/items_todos.json` (o `items_corte1.json`).

DOS COMPROBACIONES QUE ABORTAN, y por qué. Un banco que carga y devuelve cero
ítems es el fallo silencioso que este proyecto ya pagó en el verificador de
bloques: el guion informa «nada que auditar» y todo el mundo se queda tranquilo.
Y un ítem con un campo que este volcado no conoce es un tipo de pregunta nuevo
—o un campo nuevo del motor— que la auditoría estaría ignorando sin decirlo; se
recoge en `_extra` y se avisa por stderr.
"""
import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _bancos as B

SALIDAS = B.RAIZ / "precalculo" / "salidas"

# Los campos que el motor entiende. Todo lo demás cae en `_extra` y se avisa.
# `semana` y `unidad` son del simulacro: la primera es la semana del taller (su
# `modulo` ya la lleva) y la segunda es la unidad que el motor pinta junto a la
# caja de respuesta de un `numerica`. Una unidad que no case con el enunciado es
# un defecto auditable, así que se transcriben las dos.
CONOCIDOS = """tipo modulo ancla dimension pregunta pista opciones respuesta
tolerancia retroAcierto retroFallo respuestaModelo comprobacion
descripcionGrafico dibujar alto semana unidad""".split()

VUELCA = """
const CONOCIDOS = new Set(%s);
process.stdout.write(JSON.stringify(BANCO.map((p, i) => {
  const o = {
    i,
    tipo: p.tipo || null,
    modulo: (p.modulo === undefined ? null : p.modulo),
    ancla: p.ancla || null,
    dimension: p.dimension || null,
    pregunta: p.pregunta || null,
    pista: p.pista || null,
    opciones: (p.opciones || []).map(x => ({
      texto: (x.texto === undefined ? null : x.texto),
      correcta: x.correcta === true,
      retro: x.retro || null
    })),
    respuesta: (p.respuesta === undefined ? null : p.respuesta),
    tolerancia: (p.tolerancia === undefined ? null : p.tolerancia),
    unidad: p.unidad || null,
    semana: (p.semana === undefined ? null : p.semana),
    retroAcierto: p.retroAcierto || null,
    retroFallo: p.retroFallo || null,
    respuestaModelo: p.respuestaModelo || null,
    comprobacion: p.comprobacion || null,
    descripcionGrafico: p.descripcionGrafico || null,
    tieneDibujar: typeof p.dibujar === 'function',
    _extra: Object.keys(p).filter(k => !CONOCIDOS.has(k))
  };
  // El `dibujar` se EJECUTA: un gráfico que lanza deja el ítem en blanco en la
  // página mientras los demás siguen perfectos, y nadie se entera hasta que un
  // estudiante lo abre.
  if (o.tieneDibujar) {
    try { p.dibujar({}); o.dibuja = 'ok'; }
    catch (e) { o.dibuja = 'ERROR: ' + e.message; }
  } else {
    o.dibuja = null;
  }
  return o;
})));
""" % json.dumps(CONOCIDOS)


def recoge(claves):
    items = []
    for clave in claves:
        crudos = B.banco_capitulo(clave, VUELCA)
        if not crudos:
            raise B.Fallo(f"{clave}: el banco carga pero devuelve 0 ítems")
        mods = dict(B.modulos(clave))
        for p in crudos:
            p["banco"] = clave
            p["fuente"] = str(B.CAPITULOS[clave].relative_to(B.RAIZ))
            p["modulo_titulo"] = mods.get(p["modulo"])
            items.append(p)
    crudos = B.banco_simulacro(VUELCA)
    if not crudos:
        raise B.Fallo("simulacro: el banco carga pero devuelve 0 ítems")
    for p in crudos:
        p["banco"] = "simulacro"
        p["fuente"] = str(B.SIMULACRO.relative_to(B.RAIZ))
        p["modulo_titulo"] = None  # en el simulacro `modulo` es la semana
        items.append(p)
    return items


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--corte1", action="store_true",
                    help="solo los bancos que evalúa el Parcial 1")
    args = ap.parse_args()

    claves = B.CORTE_I if args.corte1 else tuple(B.CAPITULOS)
    try:
        items = recoge(claves)
    except B.Fallo as e:
        print(f"FALLO: {e}", file=sys.stderr)
        return 1

    extras = {k for p in items for k in p["_extra"]}
    if extras:
        print(f"AVISO: campos que este volcado no conoce: {sorted(extras)}", file=sys.stderr)

    SALIDAS.mkdir(parents=True, exist_ok=True)
    destino = SALIDAS / ("items_corte1.json" if args.corte1 else "items_todos.json")
    destino.write_text(json.dumps(items, ensure_ascii=False, indent=1), encoding="utf-8")

    por_banco = {}
    for p in items:
        por_banco.setdefault(p["banco"], []).append(p)
    print(f"{len(items)} ítems")
    for banco, ps in por_banco.items():
        tipos = {}
        for p in ps:
            tipos[p["tipo"]] = tipos.get(p["tipo"], 0) + 1
        detalle = " · ".join(f"{n} {t}" for t, n in sorted(tipos.items()))
        print(f"  {banco:10s} {len(ps):3d}   {detalle}")
    rotos = [p for p in items if isinstance(p.get("dibuja"), str) and p["dibuja"].startswith("ERROR")]
    print(f"gráficos ejecutados: {sum(1 for p in items if p['tieneDibujar'])}"
          f" · que lanzan: {len(rotos)}")
    for p in rotos:
        print(f"  ✗ {p['banco']}[{p['i']}] {p['dibuja']}")
    print(f"\n→ {destino.relative_to(B.RAIZ)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
