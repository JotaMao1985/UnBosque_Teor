# Bibliografía — Muestreo Estadístico (20939)

Aquí vive lo que hace falta para que **ninguna cita se escriba de memoria**: el catálogo de
obras, la huella de los ejemplares leídos, el índice de lo que existe en cada uno y el registro
de quién leyó qué. La norma, común a los cursos del programa, es `Capa de fuentes` (vault de
docencia, `Estandar/`).

El repositorio es público. **Aquí no hay ningún libro, ni su texto, ni pasajes copiados.**

## Qué es cada archivo

| Archivo | Qué es | Quién lo escribe |
|---|---|---|
| `referencias.json` | El catálogo: una entrada CSL-JSON por obra; `id` es la clave de cita | `precalculo/exporta_zotero.py`, desde Zotero |
| `claves.json` | Ítem de Zotero → clave de cita. Una clave asignada no cambia nunca | ídem |
| `zotero.lock.json` | Versión de Zotero, colección, y rol y adjuntos de cada obra | ídem |
| `enmiendas.yml` | Correcciones a los metadatos que trae Zotero, cada una con su evidencia y su fecha | a mano |
| `apa-es.csl` | Estilo de cita: APA 7 con «y» en lugar de «&» | copiado de Series de Tiempo |
| `obras.tsv` | Todas las obras que el material nombra, con su identificador y su clave | a mano; el auditor la vigila |
| `inventario_citas.json` | Qué obras nombra hoy el sitio, y dónde | `precalculo/inventario_citas.py` |
| `ejemplares.yml` | La huella de cada ejemplar leído: sha256, páginas, **edición comprobada contra la portada**, procedencia | `precalculo/extrae_fuente.py`; lo de la portada, a mano |
| `instantaneas.yml` | Las obras leídas en la web: URL, fecha de consulta y huella del texto de cada página guardada | `precalculo/extrae_fuente.py --web` |
| `indices/<clave>.json` | Qué secciones, ejemplos, ejercicios, ecuaciones, tablas y páginas existen en ese ejemplar. Sin títulos y sin texto | `precalculo/indexa_epub.py`, `indexa_pdf.py`, `indexa_web.py` |
| `contraste/capN.yml` | El registro de contraste: cada afirmación que exige fuente, su veredicto y quién la leyó | a mano, con los verificadores |
| `linea_base_citas.json` | Las citas escritas a mano que el material ya traía, y sus defectos conocidos. Solo encoge | `precalculo/verifica_citas.py --anota` |
| `uso_fuentes.json` | El contrato con el vault: por obra, capítulos, citas y afirmaciones | `precalculo/verifica_citas.py --uso` |
| `ALTA_ZOTERO.md` | Qué se dio de alta en Zotero, qué falta y cómo se hizo | a mano |
| `_local/` | **Fuera de git.** Los ejemplares, su texto por página, los índices con títulos y los pasajes leídos | los mismos guiones |

## El camino de una cita

1. **La obra entra por Zotero**, por su DOI o su ISBN, en `Docencia › 20939 Muestreo
   Estadístico`. Lo que no resuelva se transcribe de la portada. Después,
   `python3 precalculo/exporta_zotero.py` trae el catálogo.
2. **El ejemplar se registra y se indexa.** `extrae_fuente.py --registra CLAVE RUTA` guarda su
   huella y su texto por página (fuera de git); `indexa_epub.py` o `indexa_pdf.py` dicen qué
   localizadores existen. La edición se comprueba mirando la portada y se anota a mano.
   Una obra que se lee en la web se registra con `extrae_fuente.py --web CLAVE URL`, una
   instantánea por página, y se indexa con `indexa_web.py CLAVE`. Se cita por sección: no tiene
   páginas.
3. **Quien redacta** envuelve la afirmación con `data-afirma="c1-m1-03"` y deja la cita vacía,
   en la fuente del módulo (`ensamblado/modulos/capN/`):

   ```html
   <span data-afirma="c1-m1-03">La revista envió diez millones de papeletas
     <cite class="cita" data-ref="lohr2022sampling" data-loc="ejemplo 1.1"></cite></span>.
   ```

   Y añade la afirmación a `contraste/capN.yml` como `pendiente`.
4. **Quien verifica no es quien redactó.** Lee el pasaje en el ejemplar y da un veredicto:
   `respaldada`, `con-matiz` (y dice el matiz), `discrepa` o `pendiente`. El pasaje se guarda
   fuera de git y devuelve su huella:

   ```bash
   python3 precalculo/verifica_citas.py --pasaje lohr2022sampling 2 "texto leído, de 5 a 25 palabras"
   python3 precalculo/verifica_citas.py --pasaje CLAVE cap1 "texto leído"   # en una instantánea web
   python3 precalculo/verifica_citas.py --huella c1-m1-03      # la huella de la prosa
   ```

   En el registro quedan la página (o el nombre de la instantánea), la huella del pasaje y la
   de la prosa. Un `discrepa` solo
   lo cierra Javier.
5. **El generador escribe el texto** y el capítulo se reensambla:

   ```bash
   python3 precalculo/genera_referencias.py
   python3 ensamblado/ensambla_capN.py
   ```

6. **El auditor lo comprueba todo**: `python3 precalculo/verifica_citas.py`. Para cerrar un
   capítulo, `--cierre N` falla si le queda algo pendiente.

## Reglas que el auditor hace cumplir

| Código | Qué exige |
|---|---|
| L1 | La obra citada está en el catálogo |
| L2 | El localizador existe en el ejemplar leído, y las páginas caen en la sección |
| L3 | Se cita la edición que se leyó |
| L4 | Una obra sin ejemplar no lleva localizador directo: va de segunda mano, con `data-via` |
| L5 | Quien verifica una afirmación no es quien la redactó |
| L6 | Ninguna cita con localizador sobre una afirmación pendiente, que discrepa o sin releer |
| L7 | El pie trae lo que la página cita; el texto de las citas y el pie generado son los del generador |
| V1 | El localizador usa el vocabulario cerrado: `cap. 3` · `§3.4` · `ejemplo 3.2` · `ejercicio 3.12` · `ec. 3.3` · `tabla 3.1` · `fig. 3.1` · `p. 15` · `pp. 15–17` · `ap. A`; varios, con `; ` |
| R1–R4 | El registro está bien formado, se corresponde con el HTML, la prosa no cambió desde que se contrastó, y el pasaje está en esa página |
| M1, B1 | Toda cita nueva entra marcada; la línea base solo encoge |
| K1 | El catálogo, los ejemplares y los índices son coherentes entre sí |

Lo que el auditor **no** hace es leer: que un localizador exista no quiere decir que diga lo que
la frase le atribuye. Eso es el registro.

## El pie de referencias

El pie de cada página sale de la plantilla y es común. Cuando un capítulo tiene **todas** sus
citas marcadas y en el catálogo, `python3 precalculo/genera_referencias.py --pie capN` le da un
pie propio, solo con lo que cita, y cada cita pasa a enlazar con su entrada. Antes de eso no:
un pie generado no puede traer una obra sin ficha.

## El lector de fuentes de la auditoría de un capítulo

La auditoría habitual de un capítulo gana un lector más, **FU**, junto a los de estadística,
claridad, pedagogía, código y el quinto de turno.

- **Qué recibe:** las afirmaciones del registro del capítulo que estén `pendiente` o
  `por-reverificar`, más las que el auditor marque con R3 (la prosa cambió) y las de obras cuyo
  ejemplar cambió. Es incremental: lo ya respaldado, con su prosa intacta, no se relee.
- **Qué no recibe:** el veredicto esperado. Solo la afirmación, tal como la lee el estudiante, y
  dónde está el texto del ejemplar.
- **Qué devuelve:** por cada una, veredicto, página, localizador y un pasaje literal de 5 a 25
  palabras que se pueda buscar tal cual en esa página.
- **Qué se hace con ello:** cada pasaje se rehace con `--pasaje` antes de registrarlo. Un lector
  no escribe en el registro.
- **Con qué modelo:** en el piloto, dos lectores independientes coincidieron en los 13 pasajes;
  desde entonces basta uno, y un segundo para lo que el primero deje dudoso.

## Lo que falta en el catálogo

Está en `ALTA_ZOTERO.md`: las obras sin identificador, las que esperan ejemplar y las fichas que
hay que hacer a mano. Una obra sin ejemplar no impide citarla, pero sí citarla con localizador.
