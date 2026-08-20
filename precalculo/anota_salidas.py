#!/usr/bin/env python3
"""Anota en una cadena ejecutable la salida REAL de cada bloque, en sus
comentarios `#>`.

Por qué existe: en cada fase del proyecto han vuelto a fallar cifras
transcritas a mano a los comentarios (fase 1: una; fase 3: dos; fase 4: cinco).
`verifica_bloques.py` las caza después; esta herramienta evita escribirlas.

Uso, desde la raíz del repositorio:

    python3 precalculo/anota_salidas.py ensamblado/codigo/cap8/cadena.R
    python3 precalculo/anota_salidas.py ensamblado/codigo/cap8/cadena.py

Ejecuta la cadena entera de una vez —encadenada, como la lee el estudiante— y
reescribe cada grupo de comentarios `#>` con lo que de verdad salió. No toca ni
una línea de código: antes de escribir comprueba que el archivo, quitadas sus
líneas `#>`, es idéntico al de partida, y aborta si no lo es.

Con --check no escribe nada: informa de qué bloques quedarían distintos, para
usarlo como prueba de regresión.

Los dos estilos de anotación, y el fallo que costó la fase 6
------------------------------------------------------------
El material anota de dos maneras y la herramienta tiene que distinguirlas:

  * **un grupo por bloque**: todas las sentencias seguidas y un único grupo de
    `#>` al final (caps. 7 y 8 en R; las cadenas de Python de los caps. 2 a 8);
  * **intercalado**: un grupo de `#>` tras cada sentencia que imprime
    (caps. 1 a 6 en R; `cap1/cadena.py`).

La primera versión de esta herramienta reescribía «el grupo de comentarios `#>`
del final de cada bloque», que solo vale para el primer estilo. Sobre una cadena
intercalada añadía un grupo DUPLICADO al final y dejaba la salida de una
sentencia impresa ANTES de la sentencia que la produce: en `cap1/cadena.R` las
líneas `#>` pasaron de 53 a 89 en una sola pasada. Y lo grave es que
**`verifica_bloques.py` no lo detecta**, porque las cifras duplicadas sí
aparecen en la salida real del bloque: el archivo pasa la verificación y el
estudiante lee el código con la salida fuera de sitio.

Por eso la salida se reparte ahora POR SENTENCIA, no por bloque. La herramienta
parte la cadena en sus sentencias de primer nivel (R: `parse()` con
`keep.source`; Python: `ast`), ejecuta una copia temporal con un marcador entre
sentencia y sentencia, y da a cada grupo de `#>` la salida de las sentencias que
lo preceden y que ningún grupo anterior ha reclamado. «Un grupo por bloque» es
el caso particular en el que el único grupo, al final, recibe la salida de todas
las sentencias del bloque; así que los dos estilos salen del mismo reparto y
ninguno se convierte en el otro.

Lo que la herramienta NO hace, y aborta en vez de intentarlo
-----------------------------------------------------------
Nunca vuelve al comportamiento de «todo al final», que es el que corrompía. Si
el reparto por sentencia no se puede establecer con certeza, `sys.exit("ABORTA:
...")` sin escribir nada, nombrando los bloques:

  * la cadena no se deja parsear, o la ejecución no llega al final;
  * un grupo `#>` no tiene ninguna sentencia delante dentro de su bloque;
  * dos grupos `#>` caen tras la misma sentencia (no hay reparto posible);
  * un grupo se quedaría vacío porque sus sentencias no imprimen nada;
  * quedaría salida sin anotar detrás del último grupo del bloque;
  * una línea `#>` va indentada (el material las escribe siempre en columna 1).

Solo se lee la salida estándar. Los avisos de R van a la salida de error y no se
anotan, igual que en `verifica_bloques.py`.

Las líneas `#>` se escriben **sin espacios al final**. R los emite al imprimir un
vector con nombres, pero no se ven en el HTML y ensucian el archivo fuente; las
anotaciones escritas a mano nunca los llevan. Las cadenas anotadas con la versión
antigua sí (`cap3/cadena.R`, `cap4/cadena.py`, `cap7/cadena.R`, `cap8/cadena.R`),
así que la primera pasada sobre ellas los quita: es un cambio de solo espacios,
pero cambia el HTML, y toca volver a ejecutar su `ensambla_capN.py`.
"""
import argparse
import ast
import os
import re
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
TMP = RAIZ / "precalculo" / ".tmp_verifica"

# El Rscript del PATH es Homebrew 4.6 y NO tiene survey (ver precalculo/README).
RSCRIPT = "/Library/Frameworks/R.framework/Versions/4.4-arm64/Resources/bin/Rscript"

MARCADOR = re.compile(r"###BLOQUE-([A-Za-z0-9]+)###")
SENTENCIA = re.compile(r"###SENT-(\d+)###")

# Una línea de R que enumera las sentencias de primer nivel y sus líneas de
# inicio y fin. La ruta viaja por el entorno para no pelearse con las comillas.
R_SENTENCIAS = ('e <- parse(Sys.getenv("CADENA"), keep.source = TRUE, '
                'encoding = "UTF-8"); '
                'for (r in attr(e, "srcref")) cat(r[1], r[3], "\\n")')

# Las dos escriben EXACTAMENTE `\n###SENT-k###\n`, ni un salto más: de ahí sale
# la aritmética exacta de `salidas_por_sentencia`, y con ella las líneas en
# blanco que de verdad separan la salida de dos sentencias seguidas.
MARCA = {".R": 'cat("\\n###SENT-%d###\\n")',
         ".py": 'print("\\n###SENT-%d###")'}


def comando(ruta):
    if ruta.suffix == ".R":
        return [RSCRIPT, "--vanilla", str(ruta)]
    if ruta.suffix == ".py":
        return [sys.executable, str(ruta)]
    sys.exit(f"ABORTA: no sé ejecutar {ruta.suffix}")


def es_anotacion(linea):
    return linea.lstrip().startswith("#>")


# ---------------------------------------------------------------------------
# Las sentencias de primer nivel de la cadena
# ---------------------------------------------------------------------------
def sentencias(ruta, texto):
    """[(primera_linea, ultima_linea)] de cada sentencia, 1-indexado."""
    if ruta.suffix == ".py":
        try:
            arbol = ast.parse(texto)
        except SyntaxError as e:
            sys.exit(f"ABORTA: {ruta.name} no se deja parsear (línea {e.lineno}): "
                     f"{e.msg}. Sin las sentencias no hay reparto de la salida.")
        fuera = []
        for nodo in arbol.body:
            inicio = min([nodo.lineno] +
                         [d.lineno for d in getattr(nodo, "decorator_list", [])])
            fuera.append((inicio, nodo.end_lineno))
        return fuera

    entorno = dict(os.environ, CADENA=str(ruta.resolve()))
    r = subprocess.run([RSCRIPT, "--vanilla", "-e", R_SENTENCIAS],
                       capture_output=True, text=True, env=entorno)
    if r.returncode != 0:
        sys.stderr.write(r.stderr)
        sys.exit(f"ABORTA: {ruta.name} no se deja parsear. Sin las sentencias no "
                 f"hay reparto de la salida.")
    fuera = []
    for linea in r.stdout.split("\n"):
        if linea.strip():
            a, b = linea.split()
            fuera.append((int(a), int(b)))
    return fuera


def unidades(spans):
    """Agrupa en una sola unidad las sentencias que comparten línea.

    `print("tabla final:"); print(np.round(A, 3))` son dos sentencias en la
    misma línea (`cap7/cadena.py`), y entre ellas no cabe un grupo `#>`: una
    línea de comentario ocupa su propia línea. Anotarlas por separado sería
    además falso —el marcador de la segunda se imprimiría antes que las dos—,
    así que se tratan como una. El material tiene 42 líneas así, casi todas
    asignaciones que no imprimen.
    """
    fuera = []
    for a, b in spans:
        if fuera and a <= fuera[-1][1]:
            fuera[-1] = (fuera[-1][0], max(fuera[-1][1], b))
        else:
            fuera.append((a, b))
    return fuera


def instrumenta(lineas, spans, marca):
    """La cadena con un marcador delante de cada sentencia. Se inserta de atrás
    adelante para que los números de línea de `spans` sigan valiendo."""
    fuera = list(lineas)
    for k in range(len(spans) - 1, -1, -1):
        fuera.insert(spans[k][0] - 1, marca % k)
    return "\n".join(fuera)


def ejecuta(ruta, fuente):
    """Corre la copia instrumentada desde la raíz del repositorio, que es donde
    la cadena espera encontrar `CSV data sets for SDA 3e/`."""
    TMP.mkdir(parents=True, exist_ok=True)
    tmp = TMP / f"anota_{ruta.parent.name}{ruta.suffix}"
    tmp.write_text(fuente, encoding="utf-8")
    r = subprocess.run(comando(tmp), capture_output=True, text=True,
                       cwd=str(RAIZ), timeout=1800)
    return r.stdout, r.returncode, r.stderr


def salidas_por_sentencia(salida, total):
    """{k: [líneas que imprimió la sentencia k]}.

    Del trozo que sigue a un marcador se quitan exactamente dos saltos de línea
    que no son de la sentencia: el que cierra la línea del propio marcador y el
    que abre la del marcador siguiente. Ni uno más: una línea en blanco de
    verdad —las que separan la salida de dos sentencias seguidas en los bloques
    del cap. 8— se anota como `#>` y hay que conservarla.
    """
    partes = SENTENCIA.split(salida)
    idx = list(range(1, len(partes) - 1, 2))
    fuera = {}
    for n, i in enumerate(idx):
        trozo = partes[i + 1]
        if trozo.startswith("\n"):
            trozo = trozo[1:]
        if n + 1 < len(idx) and trozo.endswith("\n"):
            trozo = trozo[:-1]
        # Aquí `trozo` es el flujo exacto que escribió la sentencia. Al pasarlo
        # a líneas hay que distinguir el que no escribió nada ("" -> ninguna
        # línea) del que escribió una línea en blanco ("\n" -> una línea vacía):
        # un `print()` suelto separa dos salidas dentro del mismo grupo y esa
        # línea se anota como un `#>` vacío (bloque P1 del cap. 8).
        if not trozo:
            fuera[int(partes[i])] = []
        else:
            if trozo.endswith("\n"):
                trozo = trozo[:-1]      # el salto que cierra la última línea
            fuera[int(partes[i])] = trozo.split("\n")
    faltan = [k for k in range(total) if k not in fuera]
    if faltan:
        sys.exit(f"ABORTA: {len(faltan)} sentencias no imprimieron su marcador "
                 f"(la primera es la #{faltan[0]}); ¿falló la ejecución antes de "
                 f"llegar?")
    return fuera


# ---------------------------------------------------------------------------
# Bloques, grupos de `#>`, y el reparto de la salida entre ellos
# ---------------------------------------------------------------------------
def bloques(lineas, spans):
    """[(nombre, primera_sentencia, ultima_sentencia+1, desde_linea, hasta_linea)]

    Las líneas van 0-indexadas y en el rango medio abierto del cuerpo del
    bloque: lo que hay entre la llamada que imprime su marcador y la siguiente.
    """
    marcas = []
    for k, (a, b) in enumerate(spans):
        m = MARCADOR.search("\n".join(lineas[a - 1:b]))
        if m:
            marcas.append((k, m.group(1)))
    fuera = []
    for i, (k, nombre) in enumerate(marcas):
        fin = marcas[i + 1][0] if i + 1 < len(marcas) else len(spans)
        desde = spans[k][1]                     # 0-indexado: la línea siguiente
        hasta = spans[fin][0] - 1 if fin < len(spans) else len(lineas)
        fuera.append((nombre, k + 1, fin, desde, hasta))
    return fuera


def grupos(lineas, desde, hasta):
    """Rachas de líneas `#>` consecutivas dentro de [desde, hasta)."""
    fuera = []
    i = desde
    while i < hasta:
        if es_anotacion(lineas[i]):
            j = i
            while j < hasta and es_anotacion(lineas[j]):
                j += 1
            fuera.append((i, j))
            i = j
        else:
            i += 1
    return fuera


def reparte(lineas, spans, salidas):
    """{(desde, hasta): [líneas `#>` nuevas]} para cada grupo, y los bloques que
    cambian. Aborta si algún grupo no se puede casar con sus sentencias."""
    reemplazos, cambios, conteo = {}, [], {}
    for nombre, primera, ultima, desde, hasta in bloques(lineas, spans):
        gs = grupos(lineas, desde, hasta)
        conteo[nombre] = len(gs)
        consumida = primera - 1     # última sentencia ya anotada por un grupo
        for g0, g1 in gs:
            # La sentencia a la que sigue este grupo: la última que TERMINA
            # antes de que el grupo empiece.
            previas = [k for k in range(primera, ultima) if spans[k][1] < g0 + 1]
            if not previas:
                sys.exit(f"ABORTA: en el bloque {nombre}, el grupo `#>` de la "
                         f"línea {g0 + 1} no tiene ninguna sentencia delante. "
                         f"No hay salida que asignarle.")
            k = max(previas)
            if k <= consumida:
                sys.exit(f"ABORTA: en el bloque {nombre}, los grupos `#>` de las "
                         f"líneas {g0 + 1} y anterior caen tras la MISMA "
                         f"sentencia (la de la línea {spans[k][0]}). No hay "
                         f"reparto posible: junta los dos grupos en uno.")
            crudas = []
            for j in range(consumida + 1, k + 1):
                crudas.extend(salidas[j])
            # Las líneas en blanco de los BORDES son de la separación entre
            # sentencias, no del contenido; ningún grupo del material empieza ni
            # acaba con un `#>` vacío. Las de dentro sí se conservan.
            while crudas and not crudas[0].strip():
                crudas.pop(0)
            while crudas and not crudas[-1].strip():
                crudas.pop()
            if not crudas:
                sys.exit(f"ABORTA: en el bloque {nombre}, el grupo `#>` de la "
                         f"línea {g0 + 1} quedaría vacío: las sentencias que lo "
                         f"preceden no imprimen nada. Sobra el grupo, o falta "
                         f"una llamada que imprima.")
            # Sin espacios al final: R los emite al imprimir un vector con
            # nombres, no se ven en el HTML y ensucian el archivo fuente.
            nuevo = [("#> " + l).rstrip() for l in crudas]
            if nuevo != lineas[g0:g1] and nombre not in cambios:
                cambios.append(nombre)
            reemplazos[(g0, g1)] = nuevo
            consumida = k
        sobras = [j for j in range(consumida + 1, ultima) if salidas[j]]
        if sobras:
            sys.exit(f"ABORTA: en el bloque {nombre}, la sentencia de la línea "
                     f"{spans[sobras[0]][0]} imprime pero no tiene ningún grupo "
                     f"`#>` detrás: su salida se perdería. Añade el grupo "
                     f"(basta con una línea `#>`) y vuelve a ejecutar.")
    return reemplazos, cambios, conteo


def reescribe(lineas, reemplazos):
    saltos = {g0: (g1, nuevo) for (g0, g1), nuevo in reemplazos.items()}
    fuera, i = [], 0
    while i < len(lineas):
        if i in saltos:
            hasta, nuevo = saltos[i]
            fuera.extend(nuevo)
            i = hasta
        else:
            fuera.append(lineas[i])
            i += 1
    return fuera


def solo_codigo(lineas):
    return [l for l in lineas if not es_anotacion(l)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cadena")
    ap.add_argument("--check", action="store_true",
                    help="no escribe: solo informa de qué bloques cambiarían")
    args = ap.parse_args()

    ruta = Path(args.cadena)
    if not ruta.exists():
        sys.exit(f"ABORTA: no existe {ruta}")
    if ruta.suffix not in MARCA:
        sys.exit(f"ABORTA: no sé ejecutar {ruta.suffix}")

    texto = ruta.read_text(encoding="utf-8")
    lineas = texto.split("\n")
    indentadas = [i + 1 for i, l in enumerate(lineas)
                  if es_anotacion(l) and not l.startswith("#>")]
    if indentadas:
        sys.exit(f"ABORTA: hay líneas `#>` indentadas (línea {indentadas[0]}). "
                 f"El material las escribe siempre en la columna 1 y la "
                 f"herramienta las reescribiría sin su sangría.")

    spans = unidades(sentencias(ruta, texto))
    if not spans:
        sys.exit(f"ABORTA: {ruta.name} no tiene ninguna sentencia.")

    salida, codigo, err = ejecuta(ruta, instrumenta(lineas, spans, MARCA[ruta.suffix]))
    if codigo != 0:
        sys.stderr.write(err)
        sys.exit(f"ABORTA: {ruta.name} terminó con código {codigo}. "
                 f"Una cadena que no corre no se anota.")

    salidas = salidas_por_sentencia(salida, len(spans))
    reemplazos, cambios, conteo = reparte(lineas, spans, salidas)
    nuevas = reescribe(lineas, reemplazos)

    # La garantía que hace inofensiva a la herramienta: el código, línea a
    # línea, tiene que salir igual que entró. Solo cambian las anotaciones.
    if solo_codigo(nuevas) != solo_codigo(lineas):
        sys.exit(f"ABORTA: el reparto habría tocado una línea de código de "
                 f"{ruta.name}. No se escribe nada; es un fallo de la "
                 f"herramienta, no del archivo.")

    n_grupos = sum(conteo.values())
    estilo = ("intercalado" if any(n > 1 for n in conteo.values())
              else "un grupo por bloque")
    print(f"  {ruta.name}: {len(conteo)} bloques, {n_grupos} grupos `#>` "
          f"({estilo}), {len(cambios)} bloques con la salida distinta de lo "
          f"anotado")
    if cambios:
        print("    " + ", ".join(cambios))

    nuevo = "\n".join(nuevas)
    if args.check:
        sys.exit(1 if nuevo != texto else 0)
    if nuevo != texto:
        ruta.write_text(nuevo, encoding="utf-8")
        print("    reescrito")
    else:
        print("    ya estaba al día")


if __name__ == "__main__":
    main()
