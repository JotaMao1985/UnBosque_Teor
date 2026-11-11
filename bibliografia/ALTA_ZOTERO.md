# Alta en Zotero — Muestreo Estadístico (20939)

Tarea GD-B2 de `PLAN_Gestion_Documental.md`. Norma: `Bosque 2026/Vault/Estandar/Capa de fuentes.md`.

## Hecho el 2026-11-10

Javier pidió que el alta la hiciera el agente, con control de la aplicación.

- Colección **`Docencia › 20939 Muestreo Estadístico`** con `1 Básica`, `2 Complementaria`,
  `3 Fuentes primarias` y `4 Datos y software`.
- **28 obras añadidas por DOI** con «Añadir por identificador»: 3 básicas, 5 complementarias,
  18 fuentes primarias y 2 de software. La lista con su evidencia está en `obras.tsv`.
- Congelado en el repo con `python3 precalculo/exporta_zotero.py`: `referencias.json`,
  `claves.json` y `zotero.lock.json`. `--comprobar` dice que el repo coincide con Zotero.
- Las colecciones de Series de Tiempo, LPF y Trayectorias PostTX no cambiaron.
- Respaldo previo: `~/Zotero/antes-20939-2026-11-10.zotero.sqlite*`.

Zotero **descargó por su cuenta cuatro PDF de acceso abierto** y los adjuntó a sus fichas:
Beygelzimer et al. (2009), van Buuren y Groothuis-Oudshoorn (2011), Heck et al. (2018) y
Kim y Wang (2019). Es su comportamiento por defecto; si no los quieres, se borran desde la ficha.

## Correcciones: están en `enmiendas.yml`, no en Zotero

Las fichas de Zotero quedaron como las trajo Crossref. Lo que había que corregir se dejó en
`bibliografia/enmiendas.yml`, cada cosa con su evidencia y fecha; el exportador las aplica y
avisa cuando una ya sobra porque el dato se corrigió en Zotero.

| Obra | Enmienda |
|---|---|
| Lohr, 3.ª ed. | Año 2022 (Crossref da 2021). Su clave es `lohr2022sampling` |
| Deville y Tillé (1998) | Se añade a Tillé, que Crossref omite |
| Little y Rubin | Edición 3 y título sin «, Third Edition» |
| Levy y Lemeshow | Edición 4 (Crossref dice 1) |
| van Buuren y Groothuis-Oudshoorn | Título sin marcas `<b>` e `<i>`. Su clave es `buuren2011mice` |

## Lo que falta

- **Portela y Villeta (2007):** Zotero no resolvió el ISBN 9788496866133 («Lookup Failed»).
  Hay que crear la ficha a mano desde la página de créditos del PDF, con la etiqueta
  `origen: portada`. El ejemplar ya está registrado e indexado como `portela2007tecnicas`.
- **Lohr 1.ª ed. (1999):** ficha a mano desde la portada, etiqueta `origen: portada`. El
  ejemplar ya está registrado e indexado como `lohr1999sampling`.
- **Thompson (2012):** Crossref dice edición 1 y el syllabus dice 3.ª. Falta evidencia para
  enmendarlo: se comprueba en la portada cuando haya ejemplar.
- **Etiqueta `rol: texto-guia`** en la ficha de Lohr 3.ª.
- **Esperan ejemplar** (el ISBN se toma de su portada): Cochran (1977), Kish (1965), Groves
  et al. (*Survey Methodology*), Gutiérrez (*Estrategias de muestreo*, hoy solo la web).
- **Web o informe:** Owen, Settles, AAPOR *Standard Definitions*, Penn State STAT 506, guía de
  scikit-learn, NHANES, Blumberg y Luke (2010).
- **Sin DOI:** Kohavi (1995), Schouten, Cobben y Bethlehem (2009), Schaul et al. (2016),
  Basu (1971), Hájek (1960), Lahiri (1951), Gnap (1995), Hite (1987), *Literary Digest* (1936).
- **Paquetes de R:** TeachingSampling, rsample, SDAResources (con `citation("paquete")`).

Varias de las obras sin DOI el material las cita **a través de Lohr**. Mientras no haya ejemplar
propio, van como cita de segunda mano y en la lista de referencias aparece Lohr.

## Para repetir el alta en segundo plano (lo que funcionó)

- El cuadro «Añadir por identificador» no admite clics: se abre con el botón de la varita y se
  escribe y se envía contra el elemento con foco. Un clic en su zona lo cierra.
- El campo solo muestra el final del texto cuando no cabe: no se han perdido caracteres. Se
  escribe por tandas cortas y se revisa cada una.
- En «Nueva colección», el nombre provisional se reemplaza con doble clic sobre la palabra y
  escribiendo encima.
- Tras cada envío, se comprueba por la API local que los ítems cayeron en la subcolección debida.
