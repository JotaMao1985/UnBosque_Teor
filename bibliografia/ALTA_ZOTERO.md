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

## Gutiérrez, el 2026-11-10 (tarea 0.3 del plan del capítulo 1)

- **Ficha a mano** en `2 Complementaria`, clave `gutierrez2016estrategias`, con la etiqueta
  `origen: portada`. Zotero no resolvió el ISBN 978-958-762-586-8 («Lookup Failed»). Los datos
  son los de «Cómo citar este libro», en la portada del libro en línea: Gutiérrez, A. (2016),
  2.ª ed., Ediciones de la U.
- **Ejemplar:** instantánea de las 17 páginas de https://psirusteam.github.io/EstrategiasDeMuestreo/
  (`instantaneas.yml`), indexada con `indexa_web.py`: 15 capítulos y 262 secciones.
- La página no declara licencia. El texto queda en `bibliografia/_local/web/`, fuera de git.

## Las seis fichas del capítulo 1, dadas de alta el 2026-11-13 (tarea 0.4)

**Hechas.** El catálogo pasa de 29 a 35 obras. Los datos de abajo están **leídos**, no recordados;
cada uno dice dónde. Las dos primeras entraron por identificador; las otras cuatro, a mano.

| Ficha | Tipo | Subcolección | Clave | Identificador |
|---|---|---|---|---|
| Lohr, 1.ª ed. | Book | 2 Complementaria | `lohr1999sampling` | ISBN 9780534353612 ✓ |
| Hite (1987) | Book | 3 Fuentes primarias | `hite1987women` | ISBN 9780394530529 ✓ |
| *Literary Digest*, 31 oct 1936 | Magazine Article | 3 Fuentes primarias | `literarydigest1936landon` | — |
| *Literary Digest*, 14 nov 1936 | Magazine Article | 3 Fuentes primarias | `literarydigest1936polls` | — |
| TeachingSampling | Computer Program | 4 Datos y software | `gutierrez2020teachingsampling` | — |
| Blumberg y Luke (2010) | Report | 3 Fuentes primarias | `blumberg2010wireless` | — |

**Lohr, 1.ª ed.** — portada del ejemplar (`lohr1999sampling`, p. 1 del escaneo): «Sampling: Design
and Analysis. Sharon L. Lohr. Arizona State University. Duxbury Press, An Imprint of Brooks/Cole
Publishing Company». El escaneo no trae página de créditos: **ni el año ni el ISBN están en el
ejemplar**. Los da Open Library, consultada el 13 nov: edición OL7784218M, «publish_date:
December 15, 1999», «edition_name: 1 edition», «publishers: [Duxbury Press]», ISBN-10 0534353614,
ISBN-13 9780534353612; y la edición OL382186M, «1999», «Pacific Grove, CA», LCCN 98044566,
signatura HA31.2 .L64 1999, «xv, 494 p.». Las dos coinciden en el ISBN-10. La 2.ª edición es
otra (OL7651311M, 2009, ISBN 9780495105275), así que no hay confusión posible.

**Hite (1987)** — leído en la lista de referencias de Lohr 1.ª ed. (p. 483 del escaneo):
«Hite, S. 1987. Women and love: A cultural revolution in progress. New York: Knopf.» El ISBN
9780394530529 resolvió en la Biblioteca del Congreso y devolvió Knopf, Nueva York, 1987, «1st ed»,
922 pp., con la signatura HQ1206 .H54 1987: coincide con la referencia de Lohr. El catálogo la
titula «The Hite report: women and love: a cultural revolution in progress»; Lohr la cita como
«Women and love». Se deja el título del catálogo, porque no hay ejemplar propio para comprobar la
portada. Sin ejemplar, se cita de segunda mano vía Lohr 1.ª.

**Literary Digest** — leídos en la misma lista de referencias (p. 485 del escaneo):
- 1936b: «Landon, 1,293,669: Roosevelt, 972,897». *Literary Digest* 122 (October 31): 5–6.
- 1936c: «What went wrong with the polls?». *Literary Digest* 122 (November 14): 7–8.
- (la lista trae además 1932, 114 (November 5): 8–9, y 1936a, 122 (August 22): 3–4.)
El recuento que el material atribuye al ejemplo 1.1 **es el título del número del 31 de octubre**.

**TeachingSampling** — `citation("TeachingSampling")` con el R 4.4 del framework, versión 4.1.1
instalada: «Rojas HAG (2020). *TeachingSampling: Selection of Samples and Parameter Estimation in
Finite Population*. R package version 4.1.1». Autor del DESCRIPTION: Hugo Andres Gutierrez Rojas;
fecha 2020-04-21; URL https://CRAN.R-project.org/package=TeachingSampling. Es el mismo autor que
*Estrategias de muestreo*.

**Blumberg y Luke (2010)** — portada del informe (ejemplar `blumberg2010wireless`, p. 1):
«(Released 05/12/2010) Wireless Substitution: Early Release of Estimates From the National Health
Interview Survey, July–December 2009. by Stephen J. Blumberg, Ph.D., and Julian V. Luke. Division
of Health Interview Statistics, National Center for Health Statistics». Es la entrega que trae
las dos cifras del módulo 4 («homes (24.5%) had only wireless» y «Approximately 2.0% of households
had no telephone service»), no la de diciembre de 2010, que ya da 26,6 %.

## Al dar de alta, Zotero adjuntó un PDF

A la 1.ª edición de Lohr le adjuntó por su cuenta un **«Table of Contents PDF»**: cinco páginas con
el índice del libro, no la obra. Es su comportamiento por defecto; si no se quiere, se borra desde
la ficha.

## Lo que falta

- **Portela y Villeta (2007):** Zotero no resolvió el ISBN 9788496866133 («Lookup Failed»).
  Hay que crear la ficha a mano desde la página de créditos del PDF, con la etiqueta
  `origen: portada`. El ejemplar ya está registrado e indexado como `portela2007tecnicas`.
- **Thompson (2012):** Crossref dice edición 1 y el syllabus dice 3.ª. Falta evidencia para
  enmendarlo: se comprueba en la portada cuando haya ejemplar.
- **Etiqueta `rol: texto-guia`** en la ficha de Lohr 3.ª.
- **Esperan ejemplar** (el ISBN se toma de su portada): Cochran (1977), Kish (1965), Groves
  et al. (*Survey Methodology*).
- **Web o informe:** Owen, Settles, AAPOR *Standard Definitions*, Penn State STAT 506, guía de
  scikit-learn, NHANES.
- **Sin DOI:** Kohavi (1995), Schouten, Cobben y Bethlehem (2009), Schaul et al. (2016),
  Basu (1971), Hájek (1960), Lahiri (1951), Gnap (1995).
- **Paquetes de R:** rsample y SDAResources (con `citation("paquete")`).
- **Dos formas del mismo autor:** «Gutiérrez, Andrés» (el libro, por su portada) y «Gutierrez Rojas,
  Hugo Andres» (el paquete, por su DESCRIPTION). Unificarlo, si se quiere, va en `enmiendas.yml`.

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
- **Una ficha a mano no se puede rellenar en segundo plano.** `Archivo › Nuevo ítem` sí la crea,
  y los campos aceptan el texto, pero Zotero solo guarda un campo cuando su ventana está activa:
  al cambiar de ítem, lo escrito desaparece. Hace falta tomar la pantalla (con permiso), escribir
  cada campo y confirmarlo con Intro. Conviene rellenar de abajo arriba: el título, al ocupar
  varias líneas, desplaza los campos que tiene debajo.
