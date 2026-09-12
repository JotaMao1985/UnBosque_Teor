# Plan de implementación: Material de estudio — Muestreo Estadístico 2026-II

Universidad El Bosque · Programa de Estadística · Asignatura 20939 (4 créditos)
Docente: Javier Mauricio Sierra · Plan creado el 2026-07-27.

---

## Resumen

Llevar el material de Muestreo Estadístico de **4 capítulos en formato antiguo** a **8 capítulos
en el formato de Series de Tiempo**, cubriendo las 16 semanas del cronograma del syllabus, con el
marco de diseño (π-estimador / Horvitz–Thompson) de Gutiérrez como columna vertebral y Lohr como
orden y fuente de ejemplos.

> [!success] Estado: **completado el 2026-07-28**. Los ocho capítulos están escritos, verificados y
> publicados: 88 módulos, 65 simuladores, 88 preguntas de autoevaluación, 33 ejercicios guiados y
> 2 399 cifras contrastadas contra la salida real (2 035 en los bloques de código y 364 en el
> texto). Queda abierta la revisión de contenido por Javier (Checkpoint 4).

El sitio se publica en **https://jotamao1985.github.io/UnBosque_Teor/muestreo/** desde el
repositorio `JotaMao1985/UnBosque_Teor` (rama `gh-pages`). Hasta el 2026-07-28 vivía en
`JotaMao1985/Muestreo-Un_Bosque_JMS`, que ahora solo conserva una página de redirección.

---

## Diagnóstico del material actual

Medido sobre los 4 archivos del sitio el 2026-07-27:

| | Muestreo (hoy) | Series de Tiempo (objetivo) |
|---|---:|---:|
| Capítulos | 4 | 6 |
| Módulos | 37 | 61 |
| Simuladores registrados en `SIMULADORES[...]` | **0** | 61 |
| Preguntas de autoevaluación (`AUTOEVALUACIONES[...]`) | **0** | 49 |
| Ejercicios guiados (`.ejercicio-guiado`) | **0** | 20 |
| Cajas `.derivacion` | **0** | sí |
| Bloques de código R | **0** | 10+ por capítulo |
| Bloques de código Python | 13 (solo cap. 4) | pestaña equivalente |
| `<canvas>` / `new Chart` | 3 / 1 (solo cap. 3) | en todos |

Lo que **sí** comparte ya con el formato objetivo: el mismo esqueleto SPA (`courseData.modules`
+ `<template id="module-N">`), la paleta institucional, KaTeX, Tailwind, Prism y las cajas
`.definition` / `.note` / `.warning` / `.exercise` / `.formula` / `.diagram`. El trasplante es
viable sin reescribir la arquitectura.

**Diferencias técnicas a corregir:**
- Chart.js se carga **sin versión fijada** (`cdn.jsdelivr.net/npm/chart.js`); Series fija `@4.4.1`.
- Falta el componente `prism-r.min.js`: hoy no se puede colorear código de R.
- El material solo tiene Python, pero el syllabus establece **R con el paquete `survey`**.

**Brecha de cobertura frente al cronograma:** los 4 capítulos llegan a la **semana 9**. No hay
material para las semanas 10–16 (conglomerados, dos etapas, PPT/Horvitz–Thompson, encuestas
complejas, no respuesta, integración) — el **44 % del curso**.

---

## Activos ya disponibles (no rehacer desde cero)

| Activo | Ubicación | Uso |
|---|---|---|
| 82 datasets oficiales de Lohr *Sampling* 3e | `Muestreo/CSV data sets for SDA 3e/` | Poblaciones de todos los capítulos |
| 132 chunks de R con `survey`/`sampling` | `material_muestreo_cap2_3_lohr.Rmd`, `cap4_5`, `cap6`, `Ejercicios_muestreo_CIII.Rmd` | Base de los precálculos, **previa ejecución y verificación** |
| Material HTML de conglomerados | `material_estudio_cluster.html` | Fuente de contenido del cap. 5 |
| Plantilla del formato objetivo | `Series de tiempo/plantilla/plantilla-capitulo.html` | Base de la plantilla de Muestreo |
| Ayudantes de ensamblado y retropropagación | `Series de tiempo/ensamblado/*.py` | Adaptar, no reescribir |
| Verificador de cifras en bloques de código | `Series de tiempo/precalculo/verifica_bloques_cap6.py` | Adaptar a R con `survey` |

Los Rmd son un punto de partida, **no una fuente de verdad**: su código no está verificado contra
salida real y ya sabemos por Series de Tiempo que las cifras escritas a mano fallan (11 de 22 en el
cap. 6). Todo se ejecuta.

---

## Decisiones de arquitectura (cerradas — no re-preguntar)

1. **8 capítulos**, alineados semana a semana con el cronograma del syllabus. Los 4 existentes se
   reescriben al formato nuevo; se añaden 4.
2. **Marco π unificado con orden de Lohr.** El cronograma del syllabus cita capítulos de Lohr
   explícitamente y manda sobre el orden. Pero el aparato formal es el de Gutiérrez: en el cap. 2
   se montan `p(s)`, `π_k`, `π_kl` y el estimador de Horvitz–Thompson, y **cada diseño posterior se
   presenta como un caso particular de ese marco**. Se incorporan de Gutiérrez los diseños que Lohr
   no trata (Bernoulli, Poisson, πPT) y la calibración.
3. **R es el lenguaje principal** (`survey` + `sampling`, ya instalados en R 4.4), con **pestaña
   Python equivalente** (`numpy`/`pandas`/`scipy` calculando explícitamente). Se instala
   `TeachingSampling` para los ejemplos de Gutiérrez con `BigLucy`.
4. **Los precálculos corren con el R del framework**, no con el de Homebrew:
   `/Library/Frameworks/R.framework/Versions/4.4-arm64/Resources/bin/Rscript`. El `Rscript` del
   `PATH` es R 4.6 de Homebrew y **no tiene `survey`**. Todos los scripts y su documentación deben
   decirlo.
5. **Datos:** los CSV oficiales de Lohr como hilo conductor + `BigLucy` para el marco π.
6. **Formato:** un HTML autocontenido por capítulo, sin build ni `fetch`; datos incrustados como
   JSON; cómputo pesado precalculado en R.
7. **Publicación — cambiada el 2026-07-28 por decisión de Javier.** El sitio se muda a
   `JotaMao1985/UnBosque_Teor`, un repositorio **paraguas** para las asignaturas teóricas, con una
   carpeta por curso dentro del sitio: `sitio/muestreo/` → `…/UnBosque_Teor/muestreo/`. Series de
   Tiempo se queda de momento en su propio repositorio y la portada lo enlaza. El repositorio
   viejo, `Muestreo-Un_Bosque_JMS`, conserva su Pages encendido con una página de redirección para
   que los enlaces ya repartidos sigan funcionando.

---

## Estructura de archivos

Réplica exacta del montaje de Series de Tiempo: **la raíz del repositorio es la carpeta del
curso**, y el sitio publicado es solo una subcarpeta que va a `gh-pages`.

La carpeta local sigue llamándose `Muestreo/`; el repositorio remoto es `UnBosque_Teor`.

```
Muestreo/                              ← RAÍZ DEL REPO GIT (rama main) = UnBosque_Teor
├── .gitignore                         ← lista blanca: ignora todo salvo lo del proyecto
├── README.md                          ← portada del repositorio
├── PLAN_Material_Muestreo.md          ← este documento (memoria entre sesiones)
├── CSV data sets for SDA 3e/          ← 82 datasets oficiales de Lohr
├── *.Rmd                              ← código R previo reutilizable (5 archivos)
├── plantilla/                         ← plantilla de capítulo (NO se publica)
│   └── plantilla-capitulo-muestreo.html
├── precalculo/                        ← scripts R + salidas JSON (NO se publica)
│   ├── README.md · _comun.R
│   ├── verifica_paquetes.R            ← prueba de humo del entorno
│   ├── verifica_bloques.py            ← contrasta cada cifra `#>` con la salida real
│   ├── genera_cap1.R … genera_cap7.R · genera_soluciones.R
│   ├── salidas/cap1_datos.json … cap7_datos.json
│   └── pruebas/fixture_verificador.html
├── ensamblado/                        ← ensamblado y retropropagación (NO se publica)
│   ├── README.md
│   ├── ensambla_cap1.py … ensambla_cap7.py
│   ├── retropropaga_glosario.py · retropropaga_arbol_error.py · retropropaga_diagrama_diseno.py
│   ├── componentes/glosario.* · arbol_error.* · diagrama_diseno.*
│   ├── modulos/cap1/ … cap7/
│   └── codigo/cap1/ … cap7/           ← las cadenas ejecutables de R y Python
└── sitio/                             ← SITIO PUBLICADO (esto y solo esto va a gh-pages)
    ├── .nojekyll · .gitignore
    ├── index.html                     ← portada del PARAGUAS: una tarjeta por curso
    └── muestreo/                      ← el sitio del curso
        ├── index.html                 ← portada del curso (actualizar a 8 tarjetas)
        ├── README.md                  ← actualizar al cierre
        ├── capitulo-1-encuestas-sesgos.html          ✅ fase 2
        ├── capitulo-2-diseno-mas-sistematico.html    ✅ fase 1
        ├── capitulo-3-razon-y-regresion.html         ✅ fase 2
        ├── capitulo-4-muestreo-estratificado.html    ✅ fase 3
        ├── capitulo-5-conglomerados.html             ✅ fase 3
        ├── capitulo-6-probabilidades-desiguales.html ✅ fase 4
        ├── capitulo-7-encuestas-complejas.html       ✅ fase 4
        └── capitulo-8-no-respuesta-ponderacion.html  ✅ fase 5
```

Cuando Series de Tiempo se mude aquí, entrará como `sitio/series-de-tiempo/` y sus fuentes tendrán
que convivir con las de Muestreo en la raíz de `main`: hoy la raíz es el proyecto de Muestreo
directamente, y ese día habrá que decidir si cada curso pasa a su propia carpeta de fuentes.

**Nombres de archivo — decisión tomada el 2026-07-27: SÍ se renombran.** Los capítulos 1 y 2
pasaron de `capitulo-1-introduccion.html` y `capitulo-2-muestreo-aleatorio-simple.html` a
`capitulo-1-encuestas-sesgos.html` y `capitulo-2-diseno-mas-sistematico.html`. Los nombres viejos
describían el contenido anterior; estos describen el contenido al que se reescriben. **Las URLs
publicadas cambian**: cualquier enlace repartido con los nombres antiguos dejará de resolver.
Si aparece la necesidad, se pueden añadir dos ficheros de redirección con `meta refresh` en los
nombres viejos.

**Publicación — se replica el montaje de Series de Tiempo.** La rama `main` contiene el proyecto
entero (plan, precálculos, ensamblado, datos y sitio) y la rama `gh-pages` contiene **solo** el
contenido de `sitio/`. Para publicar un cambio:

```bash
git push origin main
git subtree push --prefix sitio origin gh-pages
```

Es el mismo flujo que Series de Tiempo, así que no hay dos maneras de publicar que recordar.
Los precálculos y el ensamblado quedan versionados pero **fuera del sitio público**, que era el
motivo de mover la raíz del repositorio un nivel hacia arriba.

> [!note] Estado de la publicación (2026-07-28)
> `UnBosque_Teor` estaba vacío, así que no había nada que romper: se empujó `main`, se creó
> `gh-pages` por subtree y se configuró Pages a `gh-pages` / `/`. El repositorio viejo
> `Muestreo-Un_Bosque_JMS` mantiene su Pages encendido sirviendo **solo una redirección** a la URL
> nueva, para que los enlaces ya repartidos no den 404.

---

## Contenido capítulo por capítulo

Convención: **M** = módulos, **S** = simuladores. Cada capítulo cierra con autoevaluación
(4 tipos de pregunta, retroalimentación por opción, reintento con pista) y ejercicios guiados con
solución calculada en R.

### Capítulo 1 — Encuestas por muestreo, sesgos y error total
*Semanas 1–2 · Lohr cap. 1 · Gutiérrez cap. 1 · ~10 M / 6 S*

| Módulo | Estado | Contenido |
|---|---|---|
| 1 | conservar | Una controversia de muestreo: encuesta de Hite; *Literary Digest* 1936 |
| 2 | **nuevo** | Marco conceptual: población objetivo, marco muestral, unidad, variable de interés |
| 3 | conservar | Requisitos de una buena muestra |
| 4 | ampliar | Sesgo de selección (no cobertura, autoselección, no respuesta) |
| 5 | conservar | Sesgo de medición |
| 6 | conservar | Diseño de cuestionarios |
| 7 | ampliar | Error total de encuesta: descomposición muestral / no muestral |
| 8 | **nuevo** | Las poblaciones del curso: `agpop` (3 078 condados) y `BigLucy` |
| 9 | **nuevo** | Sesgo de muestreo en ciencia de datos e IA (conexión del syllabus) |
| 10 | **nuevo** | Autoevaluación y ejercicios guiados |

**Simuladores:** no cobertura del *Literary Digest*; autoselección; no respuesta diferencial;
efecto del enunciado en un cuestionario; descomposición sesgo–varianza del error total;
**«n grande no salva»** — una muestra sesgada de 2 000 000 frente a una aleatoria de 1 000.

**Código:** cargar `agpop`, contrastar población contra marco, tabular por región.

---

### Capítulo 2 — Diseño muestral, MAS y sistemático · *pivote del proyecto*
*Semanas 3–4 · Lohr cap. 2 · Gutiérrez caps. 2–3 · ~11 M / 8 S*

Es el capítulo que fija la notación de todo el material. Se produce **primero** y se somete a
revisión antes de continuar.

| Módulo | Estado | Contenido |
|---|---|---|
| 1 | **nuevo** | El diseño muestral `p(s)`: el espacio de muestras y su distribución |
| 2 | **nuevo** | Probabilidades de inclusión `π_k`, `π_kl`; propiedad `Σ π_k = E(n)` |
| 3 | **nuevo** | **Estimador de Horvitz–Thompson** y su varianza (Sen–Yates–Grundy) |
| 4 | **nuevo** | Insesgadez de diseño; qué significa «muestra representativa» |
| 5 | reescribir | MAS sin reemplazo como caso particular: `π_k = n/N`, `π_kl = n(n−1)/N(N−1)` |
| 6 | conservar | Intervalos de confianza y corrección por población finita |
| 7 | conservar | Determinación del tamaño de muestra |
| 8 | **nuevo** | Diseño Bernoulli y MAS con reemplazo (tamaño de muestra aleatorio) |
| 9 | reescribir | Muestreo sistemático: `π_kl = 0` y por qué la varianza no es estimable |
| 10 | conservar | Teoría de aleatorización |
| 11 | **nuevo** | Autoevaluación y ejercicios guiados |

**Simuladores:** espacio de muestras con `N=5, n=2` (ver `p(s)` y deducir `π_k`); HT frente a la
media muestral; distribución de muestreo del estimador con y sin fpc; cobertura empírica del IC;
calculadora de tamaño de muestra; sistemático sobre una población con periodicidad (el caso
patológico); Bernoulli con `n` aleatorio; comparador MAS ↔ sistemático sobre `agpop`.

**Datos:** `agpop` → `agsrs`; `htpop` → `htsrs`.
**R:** `survey::svydesign(fpc=)`, `svymean`, `svytotal`; `TeachingSampling::S.SI`, `E.SI`, `S.BE`, `E.BE`.

---

### Capítulo 3 — Estimación de razón y regresión
*Semanas 5–6 · Lohr cap. 3 · Gutiérrez caps. 8–9 · ~11 M / 7 S*

Se conservan los 10 módulos actuales (son buenos y están bien organizados), se reescriben con el
marco π y se añaden dos.

| Módulo | Estado | Contenido |
|---|---|---|
| 1–8 | actualizar | Variables auxiliares; razón; sesgo y ECM; razón con proporciones; regresión; diferencia; dominios |
| 9 | ampliar | Modelos poblacionales (Gutiérrez cap. 17): el enfoque asistido por modelos |
| 10 | **nuevo** | **Estimador general de regresión (GREG)**: razón y regresión como casos particulares |
| 11 | **nuevo** | Parámetros no lineales: razón poblacional y **mediana** (Gutiérrez 8.2–8.3) |
| 12 | **nuevo** | Autoevaluación y ejercicios guiados |

**Simuladores:** nube `(x, y)` con recta por el origen frente a recta con intercepto — cuándo gana
razón y cuándo regresión; sesgo del estimador de razón en función de `n`; linealización de Taylor
(ver el término que se desprecia); dominios con tamaño aleatorio; estimación de la mediana por la
función de distribución estimada.

**Datos:** `agsrs` (`acres92 ~ acres87`), `cherry`, `statepop`.

---

### Capítulo 4 — Muestreo estratificado
*Semanas 7–9 · Lohr cap. 4 · Gutiérrez cap. 5 · ~12 M / 8 S*

| Módulo | Estado | Contenido |
|---|---|---|
| 1–7 | actualizar | Qué es; teoría; pesos; asignación; definición de estratos; modelo; postestratificación |
| 8 | ampliar | Asignación óptima **con costos desiguales** |
| 9 | **nuevo** | Estratificado con probabilidades proporcionales (Gutiérrez 5.3) |
| 10 | reubicar | Postestratificación presentada como caso de calibración (puente al cap. 7) |
| 11 | conservar | Aplicación en machine learning (`StratifiedKFold`, muestreo balanceado de clases) |
| 12 | **nuevo** | Autoevaluación y ejercicios guiados |

**Simuladores:** asignación proporcional / Neyman / igual con la ganancia real medida sobre
`agpop`; constructor de estratos (elegir la variable de estratificación y ver caer la varianza);
asignación óptima bajo restricción de presupuesto; postestratificación (efecto sobre los pesos);
**tabla-ranking** comparando diseños por varianza, costo y sesgo.

**Datos:** `agstrat`, `agpop` por región, `htstrat`.

---

### Capítulo 5 — Muestreo por conglomerados (una y dos etapas) · NUEVO
*Semanas 10–11 · Lohr cap. 5 · Gutiérrez caps. 6–7 · ~11 M / 8 S*

| # | Contenido |
|---|---|
| 1 | ¿Por qué conglomerar? El intercambio costo–precisión |
| 2 | Notación de dos niveles (`N`, `M_i`, `n`, `m_i`) — el glosario que más confunde |
| 3 | Conglomerados de igual tamaño, una etapa |
| 4 | **Coeficiente de correlación intraclase (ICC)** y efecto de diseño |
| 5 | Conglomerados de tamaño desigual: estimador de razón frente al insesgado |
| 6 | Muestreo en dos etapas MAS-MAS (Gutiérrez 7.2) |
| 7 | Descomposición de la varianza entre etapas |
| 8 | Asignación de `m` y `n` bajo restricción de costo (Lohr 5.4) |
| 9 | Diseño combinado: estratos × conglomerados |
| 10 | Conexión con ciencia de datos: minibatching, datos agrupados y correlación intra-grupo |
| 11 | Autoevaluación y ejercicios guiados |

**Simuladores:** ICC deslizante → DEFF y tamaño efectivo; conglomerados frente a MAS con el mismo
`n`; presupuesto (elegir `m` y `n`, ver la varianza resultante); dos etapas con descomposición de
varianza visible; conglomerados de tamaño desigual (razón vs insesgado).

**Datos:** `coots` (368 huevos en nidadas de tamaño desigual), `classes`, `schools`, `algebra`.
**R:** `svydesign(id = ~cluster, fpc = ~...)`; `TeachingSampling::E.2SI`.

---

### Capítulo 6 — Probabilidades desiguales: PPT, Hansen–Hurwitz y Horvitz–Thompson · NUEVO
*Semanas 12–13 · Lohr cap. 6 · Gutiérrez cap. 4 · ~11 M / 8 S*

| # | Contenido |
|---|---|
| 1 | ¿Por qué probabilidades desiguales? Unidades de tamaño muy distinto |
| 2 | Con reemplazo: `ψ_i` y el **estimador de Hansen–Hurwitz** |
| 3 | Selección: método acumulativo y método de Lahiri |
| 4 | Sin reemplazo: retomar `π_k` y el **estimador de Horvitz–Thompson** del cap. 2 |
| 5 | Diseño πPT: fijar `π_k ∝ x_k` y por qué no siempre se puede (Gutiérrez 4.3–4.4) |
| 6 | Diseño de Poisson (Gutiérrez 4.1) |
| 7 | Estimación de varianza: Sen–Yates–Grundy; `π_kl` como cuello de botella |
| 8 | **Cuándo el HT se comporta mal**: `π_k` pequeño con `y_k` grande |
| 9 | PPT en dos etapas: el diseño real de las encuestas de hogares |
| 10 | Conexión: muestreo por importancia y *active learning* |
| 11 | Autoevaluación y ejercicios guiados |

**Simuladores:** rueda de probabilidades (`ψ_i` ∝ tamaño); HT frente a HH sobre la misma
población; **varianza explosiva del HT** al reducir un `π_k`; Poisson con `n` aleatorio;
πPT sistemático frente a Brewer.

**Datos:** `agpps`, `statepps`, `classpps`, `htcdf`.
**R:** `sampling::inclusionprobabilities`, `UPsystematic`, `UPbrewer`; `svydesign(probs=)`.

---

### Capítulo 7 — Encuestas complejas: pesos, DEFF y replicación · NUEVO
*Semana 14 · Lohr cap. 7 · Gutiérrez cap. 10 · ~10 M / 7 S*

| # | Contenido |
|---|---|
| 1 | Anatomía de una encuesta compleja: estratos × conglomerados × etapas × pesos |
| 2 | Pesos muestrales: de diseño, de ajuste y finales |
| 3 | **Efecto de diseño (DEFF)** y tamaño de muestra efectivo |
| 4 | Linealización de Taylor para varianzas de estadísticos no lineales |
| 5 | Métodos de replicación: jackknife, BRR y bootstrap |
| 6 | **Calibración** y post-estratificación; raking / IPFP (Gutiérrez 10.1–10.5) |
| 7 | Análisis de una encuesta real con `survey` |
| 8 | El error más caro: ignorar el diseño y publicar IC demasiado estrechos |
| 9 | Recorrido del ciclo de diseño de una encuesta (componente `.ciclo`) |
| 10 | Autoevaluación y ejercicios guiados |

**Simuladores:** DEFF acumulado componente a componente; comparador ingenuo ↔ diseño con cobertura
empírica del IC; **raking en dos dimensiones paso a paso (IPFP)**; jackknife de replicación;
recortador de pesos extremos y su efecto en sesgo/varianza.

**Datos:** `nhanes`, `syc`, `ipums`, `integerwt`, `wtshare`.

---

### Capítulo 8 — No respuesta, ponderación e imputación · NUEVO
*Semanas 15–16 · Lohr cap. 8 · ~11 M / 7 S*

| # | Contenido |
|---|---|
| 1 | No respuesta de unidad y de ítem; MCAR, MAR, MNAR |
| 2 | **La fórmula del sesgo de no respuesta** y por qué `n` grande no lo corrige |
| 3 | Ajuste de pesos por clases de respuesta |
| 4 | Post-estratificación y raking como ajuste por no respuesta |
| 5 | Imputación: media, hot-deck, regresión, imputación múltiple |
| 6 | Varianza después de imputar: por qué se subestima y cómo corregirlo |
| 7 | Diagnóstico: tasas de respuesta AAPOR, R-indicators |
| 8 | **Taller de diseño**: una encuesta de principio a fin (proyecto integrador) |
| 9 | **IA asistida en diseño muestral**: qué hay que verificar siempre (semana 15 del syllabus) |
| 10 | Repaso integrador de los tres módulos del curso |
| 11 | Autoevaluación y ejercicios guiados |

**Simuladores:** sesgo de no respuesta al deslizar la correlación entre propensión y variable de
interés; ajuste por clases de respuesta; hot-deck; imputación múltiple frente a simple (varianza);
*Literary Digest* revisitado con la fórmula del sesgo ya formalizada.

**Datos:** `teachnr`, `teachmi`, `impute`, `profresp`, `profrespacs`, `intellonline`/`intelltel`/`intellwts`.

---

## Componentes del formato

Se heredan de Series de Tiempo: `.quiz`, `.ejercicio-guiado`, `.derivacion`, `.ciclo`,
`.tabla-ranking`, `.code-tabs`, `.simulador` con `SIMULADORES['id']`.

**Componentes nuevos previstos para este curso:**

| Componente | Para qué | Aparece en |
|---|---|---|
| `.glosario-notacion` | Tabla plegable que traduce la notación de Lohr ↔ Gutiérrez (`t̂_HT` ↔ `t̂_π`, `S²` ↔ `S²_yU`, …). Es el puente que hace legible el material con dos fuentes | cap. 2 y luego todos |
| `.arbol-error` ✅ | Árbol plegable del error total: cada hoja dice si sesga o solo dispersa, si aumentar $n$ la reduce y en qué capítulo se trata. **Hecho en la fase 2**; en la plantilla y en el cap. 2, y usado en el módulo 7 del cap. 1 | cap. 1, y de nuevo en el 8 |
| `.diagrama-diseno` | Esquema recorrible de un diseño complejo (población → estratos → UPM → USM → pesos) | caps. 4, 5, 6, 7 (ampliado al 4 el 2026-07-27) |
| `.rubrica` ✅ | Rúbrica analítica recorrible por criterio: cada uno con sus cuatro niveles, su rango de puntos y lo que hay que **ver** en el trabajo, más la franja de condiciones que anulan la entrega. **Hecha en la fase 5**; en la plantilla y en los caps. 1–7 (CSS + motor), con su única instancia en el módulo 8 del cap. 8 | cap. 8 |
| `texto` en `.quiz` ✅ | Quinto tipo de pregunta de la autoevaluación: **respuesta abierta con autocorrección guiada**. El estudiante escribe, y solo entonces se le revelan la respuesta modelo y una lista de tres puntos que se marca él. No corrige texto —no se puede—: impone el orden honesto. **Hecho el 2026-08-23**; en la plantilla (con demostración) y en los ocho capítulos (CSS + motor) | su primer uso son los 4 ítems abiertos del simulacro del Taller 1 |

**Regla de retropropagación (heredada, no negociable):** un componente nuevo no está terminado
hasta que está en la plantilla **y** en todos los capítulos anteriores que lo necesiten. Si el
componente aparece en el cap. 5, en la misma sesión entra en la plantilla y se retropropaga a
los caps. 1–4.

---

## Lista de tareas

### Fase 0 — Fundación — ✅ COMPLETADA (2026-07-27)

- [x] **T0.1 — Plantilla de Muestreo.** → `plantilla/plantilla-capitulo-muestreo.html` (155 867 B),
      fuera del sitio publicado, como en Series. Ajustados título, `description`, `keywords`,
      icono e `h1` de cabecera, `courseData.title` y las **5 referencias del pie** (Lohr,
      Gutiérrez, Särndal, Cochran, paquete `survey`). El simulador de demostración pasó de
      correlograma a **probabilidades de inclusión** (MAS ↔ πPT), y se añadieron los ayudantes
      propios del curso: `probInclusionSI`, `probInclusionPPT` (con truncamiento iterativo en 1),
      `totalHT`, `deff`, `iccDesdeDeff`.
      *Verificado en navegador con `innerWidth = 1440`:* 4 módulos, 3 simuladores, 4 preguntas de
      autoevaluación, 1 ejercicio guiado; KaTeX con 0 errores; pestañas R/Python conmutan; los
      gráficos se destruyen al cambiar de módulo (0 `canvas` tras salir); consola limpia salvo el
      aviso habitual del CDN de Tailwind. El simulador se probó en sus dos ramas: con πPT,
      Σπ_k = 4 exactamente, ningún π_k > 1 (la unidad de tamaño 40 se vuelve de inclusión forzosa)
      y π_max/π_min = 17,5.

- [x] **T0.2 — Infraestructura de precálculo.** Crear `Htmls_Muestreo/precalculo/` con `README.md`,
      `_comun.R` (locale UTF-8, rutas a los CSV de Lohr, paleta, helpers de JSON) y el
      `Makefile`/script que invoque **el Rscript del framework 4.4**.
      *Criterios:* `_comun.R` fija `Sys.setlocale("LC_CTYPE", "en_US.UTF-8")`; un `agpop` cargado
      se resume correctamente; el JSON emitido tiene tildes bien.
      *Hecho:* `precalculo/README.md`, `_comun.R` (locale UTF-8, rutas, semilla 2026, paleta,
      `lee_lohr`, `escribe_json` con relectura, `fmt` y **`ht()`**) y `salidas/`.
      *Verificado:* `ht()` contrastado contra `survey::svytotal` y contra la fórmula cerrada del
      MAS sobre `agpop` con n = 300 — las tres vías dan el mismo total (837 582 559,02) y la misma
      varianza, con diferencia relativa 2,8 × 10⁻¹⁴.

- [x] **T0.3 — Instalar `TeachingSampling`** → 4.1.1 instalado en R 4.4.1.
      *Verificado* con `precalculo/verifica_paquetes.R`: `survey` 4.5, `sampling` 2.11,
      `TeachingSampling` 4.1.1, `jsonlite` 2.0.0; las ocho funciones que usa el material
      (`S.SI`, `E.SI`, `S.BE`, `E.BE`, `S.STPPS`, `E.STPPS`, `E.2SI`, `S.WR`); **`BigLucy` con
      85 296 filas × 11 columnas**; 82 CSV de Lohr y `agpop` con 3 078 condados; y `jsonlite`
      escribiendo tildes correctamente.

- [x] **T0.4 — Verificador de bloques.** Adaptar `verifica_bloques_cap6.py` a este curso: extrae los
      bloques `language-r` y `language-python` de un capítulo, los ejecuta **encadenados** (R 4.4)
      y contrasta cada cifra anunciada en los comentarios `#>` contra la salida real.
      *Hecho:* `precalculo/verifica_bloques.py`, con `--todos` y prueba de regresión en
      `precalculo/pruebas/fixture_verificador.html`.
      *Verificado:* la prueba negativa caza la cifra falsa (anunciaba 99999.99, la salida real es
      306677) y el encadenamiento funciona (un bloque usa el `pop` que definió otro).
      *Fallo encontrado y corregido durante la propia verificación:* la expresión regular heredada
      de Series exigía `<pre><code ...>` exacto y los capítulos usan `<pre class="collapsed">`, así
      que el verificador informaba «nada que verificar» sobre los 13 bloques del capítulo 4 — el
      fallo silencioso que la herramienta existe para evitar. Ahora la expresión admite atributos
      y, además, **aborta ruidosamente** si el archivo menciona bloques que no consigue extraer.
      Con eso, los 13 bloques de Python del capítulo 4 se ejecutan encadenados sin error.

- [x] **T0.5 — Arreglos técnicos en los 4 capítulos existentes.** `chart.js` pasó de sin fijar a
      `@4.4.1`, se añadió `prism-r.min.js` y se incorporaron **173 bloques CSS** de la plantilla a
      cada capítulo. Las reglas se **añadieron, no se sustituyeron**: solo entraron las que no
      tocan ninguna de las 35 clases que el capítulo ya definía, de modo que el aspecto actual no
      cambia y los componentes nuevos (quiz, ejercicio guiado, ciclo, tabla-ranking, simuladores,
      derivaciones) tendrán estilo en cuanto se inserten.
      *Verificado:* los 4 capítulos pasan de 35 a **127 clases, 0 faltantes** frente a la
      plantilla; llaves CSS balanceadas (319/319); en el navegador a 1440 px el capítulo 4
      conserva su maquetación (cabecera 1430, barra lateral 280, contenido 904), sin desbordamiento
      horizontal, KaTeX sin errores, `Chart.version` 4.4.1 y Prism con R y Python cargados; consola
      sin errores.

### Checkpoint 0 — Fundación — ✅ SUPERADO (2026-07-27)
- [x] La plantilla abre limpia y sus componentes funcionan.
- [x] `TeachingSampling` instalado y `BigLucy` disponible.
- [x] El verificador de bloques detecta una cifra falsa inyectada.
- [x] Los 4 capítulos actuales cargan las mismas versiones de CDN.

**Anotaciones de la fase, para no repetir el tropiezo:**
- La lista blanca del `.gitignore` se estaba tragando `plantilla/` en silencio. Al añadir una
  carpeta nueva al proyecto hay que añadir también su `!/carpeta/`, y comprobarlo con
  `git check-ignore -v ruta`.
- El contexto de JavaScript del navegador vuelve a reportar `innerWidth = 0` tras cambiar de
  pestaña: **medir solo después de `resize_window` y de comprobar que `innerWidth > 1024`**, o
  toda la geometría sale falsa.
- Los `if ... else` de R sin llaves y con el `else` en una línea nueva son un error de sintaxis a
  nivel superior. Pasó en `verifica_paquetes.R`.

---

### Fase 1 — Capítulo 2 (el pivote) — ✅ COMPLETADA (2026-07-27)

Se produce antes que el 1 a propósito: es el que fija el marco π para todo el material. Si la
notación no convence, se rehace **un** capítulo y no ocho.

**Decisiones tomadas al abrir la fase** (las cuatro recomendadas, aceptadas):
1. El `.glosario-notacion` entra en la **plantilla y en el cap. 2**; los caps. 1, 3 y 4 lo reciben
   al reescribirse en las fases 2–3, porque hoy todavía no usan la notación que el glosario
   traduce. **Deuda anotada**: los tres tienen 5 clases CSS menos que la plantilla, y son
   exactamente las del glosario.
2. **Python solo donde el cálculo explícito es la lección** (6 de los 17 bloques de R): espacio de
   muestras, `π_k`/`π_kl`, HT, media y EE a mano, tamaño de muestra y Bernoulli.
3. **Ejercicios originales** sobre los datos de Lohr, resueltos en `precalculo/genera_soluciones.R`.
4. La conexión con ciencia de datos va **dentro del módulo 10**, no en un módulo aparte.

- [x] **T1.1 — Precálculo del cap. 2** → `precalculo/genera_cap2.R` (semilla 2026) y
      `precalculo/salidas/cap2_datos.json` (63 KB). Espacio de muestras `N=5, n=2` con **tres**
      diseños (MAS, estratificado y desigual con `p(s) ∝ x_k + x_l`), resueltos **exactamente** por
      enumeración; distribución de muestreo sobre `agpop` (10 000 réplicas × 8 tamaños); cobertura
      empírica del IC; Bernoulli (5 000 réplicas × 4 valores de π); sistemático sobre población
      periódica y sobre `agpop` en tres órdenes.
      *Verificado:* `V(t̂_π)` coincide por espacio de muestras y por Sen–Yates–Grundy en los tres
      diseños (dif. ≤ 9·10⁻¹³), y con la fórmula cerrada del MAS; `survey::svymean` y la fórmula a
      mano dan el mismo EE sobre `agsrs` (dif. relativa 7·10⁻¹⁵); el CV teórico del HT bajo
      Bernoulli (0,1342) cuadra con el simulado (0,1332).
- [x] **T1.2 — Módulos 1–4** (diseño `p(s)`, `π_k`/`π_kl`, HT + Sen–Yates–Grundy, insesgadez de
      diseño) con tres derivaciones plegables y la `.tabla-ranking` comparando los tres diseños.
- [x] **T1.3 — Módulos 5–10** (MAS, IC y fpc, tamaño de muestra, Bernoulli y con reemplazo,
      sistemático, aleatorización + ciencia de datos).
- [x] **T1.4 — Nueve simuladores** (uno más que los ocho previstos): espacio de muestras, matriz
      `π_kl`, HT vs expansión, distribución de muestreo, cobertura del IC, calculadora de tamaño,
      Bernoulli, sistemático periódico y comparador MAS ↔ sistemático sobre `agpop`.
- [x] **T1.5 — 11 preguntas de autoevaluación** (los cuatro tipos) y **4 ejercicios guiados**
      resueltos en `precalculo/genera_soluciones.R`.
- [x] **T1.6 — Componente `.glosario-notacion`** (12 filas: este material ↔ Lohr ↔ Gutiérrez ↔ R)
      retropropagado a la plantilla en la misma sesión, junto con los ayudantes de gráficos con eje
      x numérico (`crearGraficoXY`, `serieHistograma`, `serieVertical`) que nacieron aquí.
- [x] **T1.7 — Verificación completa.** Ver «Auditoría de la fase 1» abajo.

**Resultado:** 11 módulos, 9 simuladores, 11 preguntas, 4 ejercicios, 27 bloques de código
(21 de R + 6 de Python), 345 KB.

**Ensamblado versionado.** Las fuentes están en `ensamblado/`: `ensambla_cap2.py`,
`modulos/cap2/`, `componentes/glosario.*` y `codigo/cap2/cadena.{R,py}`. Se comprobó la regla de
oro del `ensamblado/README.md`: volver a ejecutar el script produce el capítulo publicado
**byte a byte**.

**Anotaciones de la fase, para no repetir el tropiezo:**
- **Un error de sintaxis en el JS en línea no da error visible**: la página carga, los CDN cargan y
  el contenido simplemente no aparece porque el `<script>` entero no se ejecutó. Pasó al
  retropropagar el glosario (`const GLOSARIOS` declarado dos veces, una por la plantilla y otra por
  el ensamblador). Desde ahora, `node --check` sobre el motor extraído antes de dar nada por bueno;
  el comando está en `ensamblado/README.md`.
- **Un componente puede fallar silenciosamente en un solo módulo.** La `.tabla-ranking` construía
  sus filas y no las devolvía en el objeto de configuración; el módulo 4 lanzaba una excepción y
  los otros diez seguían perfectos. Recorrer **todos** los módulos con la consola instrumentada,
  no mirar dos y confiar.
- **Los datos de Lohr traen `-99` como código de faltante.** En `agpop`, 19 condados lo tienen en
  `acres92` y 23 en `acres87`. **Decisión de Javier (2026-07-27): se usa el marco completo de
  Lohr, `N = 3 078`, sin excluir nada.** La media poblacional del material es por tanto
  **306 677**, y no los 308 582 de los condados con dato válido: 1 905 acres, un 0,6 %, por
  debajo. Todo lo demás sigue siendo exacto —es una población perfectamente válida que contiene 19
  valores de `-99`—; lo único que no es, es la superficie sembrada media de verdad. El capítulo lo
  declara en su caja de advertencia del módulo 5 y lo enlaza con el capítulo 8, que es donde se
  trata la no respuesta de ítem.
- **Las cifras a mano fallan aunque estés convencido.** Al pasar a los 3 078 escribí
  `306676.9727` en un comentario `#>` y la salida real era `306676.9714`. Cuatro decimales
  inventados en una cifra que había leído dos minutos antes. Es exactamente lo que
  `verifica_bloques.py` existe para cazar.
- **Los bloques de las soluciones también tienen que anunciar sus cifras.** En la primera entrega
  los cuatro ejercicios traían código sin líneas `#>`, así que sus resultados no los verificaba
  nadie: la prosa citaba números que ninguna herramienta contrastaba. Corregido — el recuento pasó
  de 291 a 323 cifras verificadas.
- **Olvidar el fpc ensancha el intervalo, no lo estrecha** (EE 19 892,7 en vez de 18 898,4, un 5,3 %
  más). Es lo contrario de lo que uno espera, y el texto del módulo 6 lo dice explícitamente para
  que no se confunda con el error de ignorar conglomerados, que sí produce intervalos estrechos y
  es el tema del capítulo 7.
- **No simular lo que se puede enumerar.** El sistemático 1 en *k* solo tiene *k* muestras posibles:
  su varianza es exacta y simularla solo añade ruido de Monte Carlo. El primer borrador del
  precálculo lo simulaba.
- **Construir un caso patológico cuesta pensarlo.** El primer intento de orden «malo» para el
  sistemático agrupaba índices en vez de hacer que el valor dependiera de la *posición dentro del
  ciclo*, y el sistemático seguía ganando (DEFF 0,17). Bien construido, el DEFF es 219,9.
- El preview del navegador **no hace scroll** en archivos fuera de la carpeta del proyecto. Para ver
  un componente que está abajo, quitar del DOM los hermanos anteriores y recargar después.

### Auditoría de la fase 1 (2026-07-27)

| Comprobación | Resultado |
|---|---|
| Cifras `#>` contrastadas con la salida real (`verifica_bloques.py`) | **323 de 323**, 0 discrepancias |
| Sesiones de R y de Python encadenadas | terminan con código 0 |
| Regresión del propio verificador (fixture con cifra falsa) | sigue cazándola (6 de 7) |
| Caps. 1, 3 y 4 tras los cambios | sin regresión |
| Varianzas por dos vías | espacio de muestras ↔ SYG ↔ fórmula cerrada; `survey` ↔ fórmula |
| `node --check` del motor del capítulo y de la plantilla | OK los dos |
| Consola del navegador, 11 módulos | 0 errores, 0 avisos |
| KaTeX | 0 errores; 441 expresiones renderizadas |
| Gráficos por módulo | `charts` = `canvas` en los 11; al salir del módulo quedan 0 |
| Simuladores en todos sus valores y extremos | 9 de 9, **56 estados** probados, 0 fallos |
| Autoevaluación | 11 preguntas, 4 tipos, flujo fallo → pista → reintento correcto |
| Ejercicios guiados | 8 paneles abren; 4 soluciones con su bloque de R |
| CSS frente a la plantilla | 130 clases, **0 faltantes**; llaves 330/330 |
| Geometría a 1440 px | cabecera 1430, lateral 280, contenido 904; sin solapes ni desbordamiento |
| JSON incrustado | válido, y **idéntico** al de `precalculo/salidas/` |
| Enlaces de `index.html` | los 4 resuelven a archivos existentes |

### Checkpoint 1 — Revisión de Javier · **RESPONDIDO el 2026-07-28**
Javier autorizó proceder el 2026-07-27 sin revisar, y respondió al fondo el 2026-07-28:
*«si quiero que mejores la explicación, a ratos es muy abstracta, revisa también la notación y los
cálculos»*. Las tres cosas se atendieron en la **fase 4.5** (ver abajo), sobre los siete capítulos
ya escritos.
- [x] **¿El marco π funciona didácticamente?** Sí, pero **estaba mal presentado**: 22 de los 77
      módulos formalizaban antes de dar un solo número, y el cap. 2 —el pivote— era el peor con 7
      de 11. El marco no se tocó; el orden de exposición, entero. Ahora **0 módulos** abren
      formalizando, medido con `precalculo/mide_abstraccion.py`.
- [x] **¿La densidad de simuladores es la correcta?** No se tocó: Javier no la señaló, y el
      diagnóstico no encontró módulos sin interactividad donde hiciera falta. Queda como está.
- [x] **¿El glosario resuelve la convivencia Lohr ↔ Gutiérrez?** Sí, y la auditoría de notación lo
      confirmó salvo en un punto: la razón poblacional era `B` en el cap. 3 y `R` en el 7,
      contradiciendo el propio glosario. Unificado en `B`.
- [x] ~~¿`N = 3 059` o los 3 078 de Lohr?~~ → **Los 3 078, decidido el 2026-07-27.** Aplicado a
      todo el capítulo y al precálculo; la media poblacional del material es 306 677.

---

### Fase 2 — Capítulos 1 y 3 — ✅ COMPLETADA (2026-07-27)

**Decisiones tomadas al abrir la fase** (las cuatro recomendadas, aceptadas):
1. Se levanta el Checkpoint 1 y se replica en los caps. 1 y 3 el formato del cap. 2 tal cual.
2. Los tres módulos «extra» del cap. 1 antiguo (5 ejercicios resueltos y los casos de estudio)
   **se reconvierten** al formato nuevo: los ejercicios pasan a `.ejercicio-guiado` del módulo 10 y
   las preguntas conceptuales, a la autoevaluación. Nada se pierde y el capítulo queda en 10 módulos.
3. **GREG escalar** en el cap. 3, con la forma matricial general en una `.derivacion` plegable y el
   puente explícito a la calibración del cap. 7.
4. Componente nuevo **`.arbol-error`** para el módulo 7 del cap. 1, retropropagado a la plantilla.

- [x] **T2.0 — Componente `.arbol-error`.** `ensamblado/componentes/arbol_error.{css,js}` y
      `retropropaga_arbol_error.py` (idempotente). Árbol plegable del error total: 14 nodos, 9 hojas,
      cada una con su ficha, el efecto que produce (sesgo / varianza / ambos), si aumentar $n$ lo
      reduce, y el capítulo donde se trata. `role="tree"` con galones independientes del botón de
      selección. Insertado en la plantilla (CSS + motor + demostración + llamada en `loadModule`) y
      en el cap. 2 (CSS + motor, sin instancia) para que el conjunto de selectores siga siendo
      idéntico. *Verificado en navegador:* 14 fichas distintas, plegado/desplegado, KaTeX dentro del
      panel, sin solapes ni desbordamiento; y el cap. 2 sigue reproduciéndose byte a byte.
- [x] **T2.1 — Capítulo 1** → `capitulo-1-encuestas-sesgos.html`, 310 KB.
      10 módulos, **7 simuladores**, 11 preguntas (los 4 tipos), **5 ejercicios guiados**,
      18 bloques de código (14 de R + 4 de Python), `.arbol-error` y `.glosario-notacion`.
      Precálculo en `precalculo/genera_cap1.R` → `salidas/cap1_datos.json` (14 KB).
- [x] **T2.2 — Capítulo 3** → `capitulo-3-razon-y-regresion.html`, 311 KB.
      12 módulos, **6 simuladores + 1 `.tabla-ranking`**, 11 preguntas, 4 ejercicios guiados,
      18 bloques (14 R + 4 Python), 3 derivaciones plegables y `.glosario-notacion`.
      Precálculo en `precalculo/genera_cap3.R` → `salidas/cap3_datos.json` (38 KB).
- [x] **T2.3 — Retropropagación.** Hecha en la misma sesión (ver T2.0).
- [x] **T2.4 — Deuda de la fase 1 saldada en los caps. 1 y 3:** los dos llevan ya su
      `.glosario-notacion` propio —12 filas cada uno, con el vocabulario de su capítulo— y pasan de
      127 a **149 clases CSS, 0 faltantes** frente a la plantilla.

**Ensamblado versionado.** `ensambla_cap1.py` y `ensambla_cap3.py`, con `modulos/cap{1,3}/`,
`codigo/cap{1,3}/cadena.{R,py}` y `componentes/arbol_error.*`. Se comprobó la regla de oro:
**los tres ensambladores reproducen su capítulo publicado byte a byte.**

### Auditoría de la fase 2 (2026-07-27)

| Comprobación | Resultado |
|---|---|
| Cifras `#>` contrastadas con la salida real | cap. 1: **155/155** · cap. 3: **151/151** · cap. 2 (regresión): **323/323** |
| Sesiones de R y de Python encadenadas | terminan con código 0 en los tres capítulos |
| Regresión del propio verificador (cifra falsa inyectada) | sigue cazándola (6 de 7) |
| Doble vía para toda varianza | razón, regresión, diferencia, dominios y mediana: fórmula a mano ↔ `survey` |
| Tercera vía externa (cifras publicadas por Lohr) | `s_e` = 31 657,218 y `t̂_x` = 929 413 560 coinciden; `t_x` **no** (ver abajo) |
| `node --check` del motor | OK en la plantilla y en los caps. 1, 2 y 3 |
| Consola del navegador | 0 errores en los 43 módulos de los cuatro capítulos |
| KaTeX | 0 errores; 115 expresiones en el cap. 1 y 244 en el cap. 3 |
| Gráficos por módulo | se destruyen al salir (3 → 0 en el módulo 7 del cap. 1; 1 → 0 en el 11 del cap. 3) |
| Simuladores en todos sus valores y extremos | 13 de 13, **70 estados** probados, 0 lecturas vacías, 0 `NaN` |
| Componentes nuevos | `.arbol-error`: 14 nodos recorridos; `.tabla-ranking`: 4 filas ordenables; 3 derivaciones |
| Autoevaluación | 22 preguntas nuevas, los 4 tipos, flujo fallo → pista → reintento correcto |
| Ejercicios guiados | 9 nuevos; los 18 paneles abren |
| CSS frente a la plantilla | caps. 1, 2 y 3: **149 clases, 0 faltantes**; llaves 364/364 |
| Geometría a 1440 px | cabecera 1430, lateral 280, contenido 902; sin solapes ni desbordamiento |
| JSON incrustado | válido e **idéntico** al de `precalculo/salidas/` en los dos capítulos |
| Regla de oro del ensamblado | los tres capítulos se reproducen byte a byte |
| Enlaces de `index.html` | los 4 resuelven a archivos existentes |

**Tres hallazgos de la auditoría que cambiaron el material:**

1. **`t_x` no cuadra con Lohr, y no son los `-99`.** Sumar `acres87` en `agpop.csv` da
   **963 464 412**; el ejemplo 4.6 de la 3.ª edición usa 964 470 625, un **0,104 % más**. La muestra
   *sí* es la misma —`s_e` coincide hasta el tercer decimal y `t̂_x` también—, así que la diferencia
   está solo en el total poblacional del libro, y excluir los 23 códigos `-99` no la explica (daría
   963 466 689). Se usa **la suma del archivo**, que es lo único reproducible, y el capítulo lo
   declara en una caja de advertencia. Consecuencia: `t̂_r` = 950 520 496 en vez de 951 513 191.
2. **R y Python daban cuantiles distintos.** Con pesos iguales, $\hat F$ vale exactamente $p$ en el
   borde, y `cumsum()/sum()` deja 0,4999999999 en R y 0,5000000000001 en Python: sin tolerancia, las
   dos pestañas del mismo capítulo publicaban medianas distintas. Corregido con `>= p - 1e-9` en las
   tres implementaciones (precálculo, R y Python).
3. **La mediana muestral no es única**, y no era un error de nadie. Cuando $\hat F$ alcanza 0,5
   exactamente, la unidad 150 (196 701) y la 151 (196 733) son ambas legítimas.
   `svyquantile` ofrece nueve convenios en `qrule`: el de por defecto da la segunda y `hf4` da la
   primera. El material usa `hf4` para que las dos vías coincidan de verdad, y lo explica en una caja.

### Checkpoint 2 — Primer tercio — ✅ SUPERADO (2026-07-27)
- [x] Caps. 1, 2 y 3 verificados; los tres con el mismo formato, el mismo glosario y 0 clases CSS
      faltantes frente a la plantilla.
- [x] Los enlaces de `index.html` resuelven a archivos existentes (comprobado por `href`, no
      navegando). Los capítulos no enlazan entre sí: la navegación es siempre por la portada.
- [x] `index.html` actualizado: tarjetas de los caps. 1 y 3 reescritas y el total pasa de 37 a
      **43 módulos**.

**Anotaciones de la fase, para no repetir el tropiezo:**
- **`jsonlite` escribe los `data.frame` como array de FILAS, no de columnas.** Escribir
  `D3.estimadores.nombre` en vez de `D3.estimadores.map(f => f.nombre)` rompió **tres** módulos del
  cap. 3 a la vez, y cada uno lanzó su excepción en silencio dejando los otros nueve perfectos. Lo
  cazó el recorrido instrumentado de los 12 módulos, no la lectura del código.
- **Una opción de formato en la cabecera de la cadena no viaja con el bloque.** `pd.set_option` en
  la cabecera de `cadena.py` hacía que la cadena entera imprimiera bien y que el verificador —que
  ejecuta los bloques con su propia cabecera— viera notación científica: 24 cifras marcadas como
  discrepancia. Todo lo que afecte a la salida tiene que estar **dentro** del primer bloque
  publicado, que además es lo correcto para quien copie el bloque suelto.
- **El navegador tiene tope de pestañas.** El hook que abre cada archivo escrito llenó las nueve
  disponibles y `navigate` empezó a fallar con «el archivo puede faltar o ser ilegible», que apunta
  al sitio equivocado. Cerrar pestañas con `tabs_close` lo resolvió.
- **Un capítulo publicado puede quedarse con permisos `600`.** `capitulo-3-…` los tenía heredados y
  el navegador no podía abrirlo. `chmod 644` sobre los HTML publicados, y comprobarlo antes de
  empujar: en `gh-pages` un archivo sin permiso de lectura es un 404.
- **La numeración de Lohr cambió entre ediciones.** Razón y regresión es el **capítulo 3 en la 2.ª
  edición y el 4 en la 3.ª**; los caps. 5 a 8 coinciden. El syllabus y el material previo usan la
  2.ª, así que se conserva, y **todas las referencias del cap. 3 dan las dos numeraciones**.
- Las cifras del *Literary Digest* del cap. 1 antiguo estaban ligeramente mal (decía «Landon 55 %» y
  «solo el 23 % respondió»). Las de Lohr 3.ª ed. §1.1 son **Landon 54 % / Roosevelt 41 %** en la
  predicción, **Roosevelt 61 % / Landon 37 %** en la elección, diez millones enviados y más de 2,3
  millones devueltos. Corregidas y con su fuente anotada en el precálculo.

---

### Fase 3 — Capítulos 4 y 5

> [!warning] Deuda que hereda la fase 3, toda ella en el capítulo 4
> - Le faltan **24 clases CSS** frente a la plantilla: las 5 del `.glosario-notacion` y las 19 del
>   `.arbol-error`. Se saldan al reescribirlo, igual que se hizo con los caps. 1 y 3.
> - Sus 13 bloques de Python **no anuncian ninguna cifra `#>`**, así que el verificador informa
>   «0 de 0»: hoy no hay nada que contrastar en ese capítulo.
> - KaTeX emite 5 avisos por un guion largo dentro de una expresión matemática
>   (`Unrecognized Unicode character "–"`). No rompe nada, pero hay que sustituirlo por `--`.
> - No tiene simuladores, ni autoevaluación, ni ejercicios guiados.

**Decisiones tomadas al abrir la fase (2026-07-27), consultadas a Javier:**
1. **`.diagrama-diseno` con instancia en los caps. 4 y 5** (recomendado, aceptado): el cap. 4 se
   reescribe en esta misma fase y el diseño estratificado es el caso más simple para estrenar el
   componente antes del de dos etapas. Los caps. 1–3 reciben CSS + motor sin instancia, como se
   hizo con el `.arbol-error` en el cap. 2, para que el conjunto de selectores siga idéntico.
2. **Módulo ML del cap. 4 con pestaña R además de Python** (Javier amplió sobre la recomendación,
   fiel a su patrón): se instaló `rsample` 1.3.2 en el R 4.4 y el módulo muestra
   `vfold_cv(strata=)` junto a `StratifiedKFold`. Es la excepción inversa a la regla «R principal»:
   aquí la herramienta nativa es scikit-learn y la pestaña R es la equivalencia.
3. **Publicar al cierre auditado de la fase** (recomendado, aceptado): push a `main` + subtree a
   `gh-pages` tras superar el protocolo de verificación completo.

Supuestos aplicados sin re-preguntar (decisiones ya cerradas): marco completo `N = 3 078` con los
`-99` incluidos — los chunks del Rmd viejo los **filtran** (`filter(acres87 > 0)`) y eso **no** se
hereda—; Python solo donde el cálculo explícito es la lección (más la excepción del módulo ML);
ejercicios originales sobre datos de Lohr resueltos en `genera_soluciones.R`; ICC por ANOVA
(vía de Lohr) como camino principal y `lmer` (ya instalado, 1.1.37) solo en el módulo 10 del
cap. 5 como conexión con ciencia de datos.

- [x] **T3.0 — Componente `.diagrama-diseno`** → `ensamblado/componentes/diagrama_diseno.{css,js}`
      y `retropropaga_diagrama_diseno.py` (idempotente). Esquema recorrible por etapas: cada una
      declara la probabilidad que aporta y el factor de peso que deja, y la franja final da la
      lección completa (π y peso finales como producto). Insertado en la plantilla (CSS + motor +
      demostración de dos etapas) y retropropagado a los caps. 1–3 (CSS + motor sin instancia).
      *Verificado:* idempotencia, los tres ensambladores siguen reproduciendo byte a byte,
      `node --check` en los 4 motores, demo probada en navegador (3 etapas, KaTeX, responsive
      <900 px con flechas rotadas). Los 4 capítulos pasan de 149 a **165 clases CSS, 0 faltantes**.
- [x] **T3.1 — Capítulo 4** → `capitulo-4-muestreo-estratificado.html` (305 KB), reescrito entero
      desde la plantilla. **12 módulos, 8 simuladores + 1 tabla-ranking, 11 preguntas (los 4
      tipos), 4 ejercicios guiados, 23 bloques (19 R + 4 Python)**, `.glosario-notacion` propio y
      `.diagrama-diseno` con instancia (el diseño de agstrat). Módulo ML con pestañas
      Python (sklearn) **y R (`rsample`, instalado 1.3.2)**. Precálculo en `genera_cap4.R` →
      `cap4_datos.json`; ensamblado en `ensambla_cap4.py` + `modulos/cap4/` + `codigo/cap4/`.
      **Toda la deuda heredada saldada**: clases CSS al día, 246 cifras `#>` anunciadas y
      verificadas (antes: 0), sin avisos KaTeX.
- [x] **T3.2 — Capítulo 5** → `capitulo-5-conglomerados.html` (279 KB), nuevo. **11 módulos,
      8 simuladores + 1 tabla-ranking, 11 preguntas (los 4 tipos), 4 ejercicios guiados,
      22 bloques (18 R + 4 Python)**, `.glosario-notacion` propio y `.diagrama-diseno` de dos
      etapas (schools). Los chunks 5xx del Rmd viejo se ejecutaron antes de reutilizar nada, como
      manda el plan: dos hallazgos (un SE = 0 por diseño mal declarado y un chunk con encoding
      roto) confirmaron que había que recalcular todo. Precálculo en `genera_cap5.R`; ensamblado
      en `ensambla_cap5.py` + `modulos/cap5/` + `codigo/cap5/`.
- [x] **T3.3 — Auditoría, portada y publicación.** Ver «Auditoría de la fase 3» abajo.
      `index.html`: tarjeta del cap. 4 reescrita, tarjeta del cap. 5 nueva, totales a
      **5 capítulos / 56 módulos**, Gutiérrez añadido a la descripción.

### Auditoría de la fase 3 (2026-07-28)

| Comprobación | Resultado |
|---|---|
| Cifras `#>` contrastadas con la salida real | cap. 4: **246/246** · cap. 5: **163/163** · regresión caps. 1–3: **155 + 323 + 151**, 0 discrepancias |
| Sesiones de R y de Python encadenadas | terminan con código 0 en los cinco capítulos |
| Regresión del propio verificador (cifra falsa inyectada) | sigue cazándola (6 de 7) |
| Doble vía para toda varianza | cap. 4: estratificado, proporción, PPT (HH a mano ↔ E.STPPS), postestratificación (a mano ↔ postStratify); cap. 5: gpa, algebra, coots, y schools por **tres vías** (fórmula ↔ survey ↔ E.2SI, dif. ≤ 2·10⁻¹⁶) |
| Optimalidad comprobada, no asumida | la asignación con costos se perturbó conservando el presupuesto y la varianza no bajó |
| `node --check` del motor | OK en plantilla y en los caps. 1–5 |
| Consola del navegador | 0 errores y 0 avisos en los 23 módulos nuevos (12 + 11) y en los 33 de regresión |
| KaTeX | 0 errores en los cinco capítulos (los 5 avisos del guion largo del cap. 4 viejo, extintos) |
| Gráficos por módulo | `charts` = simuladores visibles en los 23 módulos; al salir quedan solo los del módulo activo |
| Simuladores en todos sus valores y extremos | 16 de 16, **143 estados** probados (76 + 67), 0 lecturas con NaN/∞ |
| Componentes nuevos | `.diagrama-diseno`: 2 instancias (4 etapas cada una) + demo; 2 tablas-ranking; 2 glosarios de 12 filas |
| Autoevaluación | 22 preguntas nuevas, los 4 tipos (incl. 2 de tipo gráfico), flujo fallo → pista → reintento correcto |
| Ejercicios guiados | 8 nuevos; los 16 paneles abren; soluciones con bloque de R verificado |
| CSS frente a la plantilla | caps. 1–5: **165 clases, 0 faltantes**; llaves 398/398 |
| Geometría a 1440 px | cabecera 1430, lateral 280, contenido 904; sin desbordes en los dos capítulos |
| JSON incrustado | válido e **idéntico** al de `precalculo/salidas/` en los dos capítulos |
| Regla de oro del ensamblado | los **cinco** capítulos se reproducen byte a byte |
| Enlaces de `index.html` | los 5 resuelven a archivos existentes |
| `.gitignore` de lista blanca | `git check-ignore` limpio sobre todas las carpetas nuevas |

**Hallazgos de la auditoría que cambiaron el material:**

1. **La nidada 88 de `coots.csv` trae `csize` inconsistente** entre sus dos huevos (9 y 11): una
   inconsistencia del archivo oficial de Lohr. La cazó la doble vía (dif. 8·10⁻⁵ entre la fórmula
   a mano y `survey`); el material adopta la convención de Lohr (cada huevo pondera con su propio
   `csize`/2), con la que ambas vías coinciden a 10⁻¹⁶, y lo declara en una nota del módulo 5.
2. **`rsample::vfold_cv(strata=)` des-estratifica en silencio las clases raras**: su `pool = 0.1`
   fusiona los estratos con menos del 10 % de los datos — exactamente las clases minoritarias que
   uno quiere proteger. Con la clase del 5 % del material, `strata=` solo no hace nada (los
   pliegues bailan igual que sin estratificar) y hay que bajar `pool` explícitamente. Documentado
   como trampa real en el módulo 11 del cap. 4, con las tres filas de evidencia en el bloque.
3. **La cobertura empírica del IC a n = 300 es ~93 %, no 95 %** (0,931 MAS, 0,933 estratificado):
   la asimetría de `acres92` pasa la factura incluso con 300 observaciones. Declarado en caja de
   advertencia del módulo 7 del cap. 4 — estratificar mejora varianza, no arregla asimetría.
4. **En `coots`, la corrección de la razón importa para el volumen (2,49 vs 2,33) y casi nada
   para la longitud (48,649 vs 48,634)**: la ponderación pesa exactamente lo que se correlacionen
   $y$ y $M_i$. Convertido en el ejercicio 2 del cap. 5.
5. **Los chunks del Rmd viejo no eran fuente de verdad**, como ya se sospechaba: su bloque de
   `coots` producía SE = 0 (diseño mal declarado en survey) y el chunk `55-plot` ni compila
   (encoding roto). Todo se recalculó de cero.

**Anotaciones de la fase, para no repetir el tropiezo:**
- **En las fórmulas de `svydesign`, todo nombre se resuelve contra el data frame.**
  `fpc = ~rep(N_su, nrow(gpa))` falla porque `gpa` dentro de la fórmula es la COLUMNA gpa, no el
  data frame. Columna explícita (`gpa$fpc <- 100`) y a otra cosa.
- **`round()` sobre un `data.frame` con columnas de texto es error**, no aviso. Construir la tabla
  con las columnas ya redondeadas.
- **Las barras de LaTeX en literales de JS van dobladas** (`'\\pi'`): JS se come la barra simple
  en cadenas y KaTeX recibe `pi_{...}` sin comando. Pasó en la demo del diagrama y se cazó antes
  de publicar releyendo el archivo generado.
- **El castigo de las cifras a ojo en los comentarios**: dos comentarios de la cadena del cap. 5
  anunciaban «44.79 contra 45.28» y «un 9 %» escritos de memoria; la salida real decía 48.634 y
  48.8 %. El mismo error que la fase 1 documentó, en su enésima forma: ningún número al texto sin
  pasar por la ejecución.
- El tipo de pregunta `grafico` reusa los ayudantes de gráficos (`serieHistograma` + `dibujar:`),
  así que una pregunta puede mostrar los datos reales del precálculo: se usó en los dos capítulos.

### Fase 4 — Capítulos 6 y 7 — ✅ COMPLETADA (2026-07-28)

**Decisiones tomadas al abrir la fase, consultadas a Javier:**
1. **Módulo 5 del cap. 7: jackknife a mano; BRR y bootstrap con `survey`** (recomendado, aceptado).
   El jackknife estratificado se implementa explícitamente en R y en Python —eliminar una PSU y
   reponderar su estrato es la lección—, y BRR y el bootstrap de Rao–Wu se calculan con
   `as.svrepdesign`. Los cuatro métodos se comparan en una `.tabla-ranking`.
2. **NHANES y SYC en paralelo en el módulo 7** (Javier amplió sobre la recomendación de usar solo
   NHANES, fiel a su patrón). Resultó la mejor decisión de la fase: las dos encuestas tienen
   estructuras **opuestas** —NHANES, 2 PSU en cada uno de sus 15 estratos; SYC, de 7 a 154 en 16—
   y esa oposición es didáctica pura: separa lo general (declarar el diseño, ponderar, replicar) de
   lo que depende del caso (grados de libertad, qué método de varianza es aplicable, deff).
   **Frontera repartida:** NHANES y SYC llevan el hilo de los módulos; `ipums`, `integerwt` y
   `wtshare` quedaban para los ejercicios. `wtshare` **se descartó** al comprobar que sus columnas
   son indicadores 0/1 y no conteos de adultos (ver hallazgo 5); el ejercicio 4 pasó a ser el
   jackknife sobre SYC, que además cierra el contraste entre las dos estructuras.
3. **Publicar al cierre auditado de la fase** (recomendado, aceptado).

Supuestos aplicados sin re-preguntar: marco completo `N = 3 078`; Python solo donde el cálculo
explícito es la lección (cap. 6: HH, acumulativo/Lahiri, π_kl+SYG, Poisson-binomial, importancia;
cap. 7: DEFF a mano, jackknife, IPFP, cobertura); ejercicios originales sobre datos de Lohr;
aproximaciones de π_kl declaradas como tales; **ningún paquete nuevo** (todo con `survey`,
`sampling` y `TeachingSampling` ya instalados).

- [x] **T4.0 — Ejecución del Rmd viejo antes de reutilizar nada.** `material_muestreo_cap6_lohr.Rmd`
      se ejecutó chunk a chunk con el R 4.4: **16 de 22 chunks OK**. Los 6 que fallan son las tres
      tablas decorativas con encoding roto (`Caracterí`, `Diseñ` como token inválido) y sus tres
      cascadas. Ningún chunk de cálculo estaba mal, pero **todo se recalculó igualmente**.
- [x] **T4.1 — Capítulo 6** → `capitulo-6-probabilidades-desiguales.html` (301 KB), nuevo.
      **11 módulos, 10 simuladores + 1 tabla-ranking, 11 preguntas (los 4 tipos), 4 ejercicios
      guiados, 24 bloques (19 R + 5 Python)**, `.glosario-notacion` propio (12 filas, con la
      distinción ψ ↔ π como nota) y `.diagrama-diseno` de PPT en dos etapas (classpps).
      Precálculo en `genera_cap6.R` → `cap6_datos.json` (11 KB); ensamblado en `ensambla_cap6.py`.
- [x] **T4.2 — Capítulo 7** → `capitulo-7-encuestas-complejas.html` (299 KB), nuevo.
      **10 módulos, 9 simuladores + 2 tablas-ranking, 11 preguntas, 4 ejercicios guiados,
      22 bloques (18 R + 4 Python)**, `.glosario-notacion` propio, `.diagrama-diseno` de NHANES
      (4 capas) y **la primera instancia del componente `.ciclo`** del curso: el ciclo de diseño
      de una encuesta, 6 etapas, cada una con su campo «qué te devuelve atrás».
      Precálculo en `genera_cap7.R` → `cap7_datos.json`; ensamblado en `ensambla_cap7.py`.
- [x] **T4.3 — Auditoría, portada y publicación.** Ver «Auditoría de la fase 4» abajo.
      `index.html`: tarjetas 6 y 7 nuevas, totales a **7 capítulos / 77 módulos** (contados por
      script sobre los propios archivos, no a ojo), hero y `keywords` al día.

**El `.ciclo` no necesitó retropropagación.** Es un componente heredado de Series de Tiempo que ya
estaba en la plantilla y, por tanto, en los CSS de los 7 capítulos: su conjunto de selectores no
cambió (168 clases, 0 faltantes, antes y después). Lo único nuevo es la primera **instancia**.

### Auditoría de la fase 4 (2026-07-28)

| Comprobación | Resultado |
|---|---|
| Cifras `#>` contrastadas con la salida real | cap. 6: **315/315** · cap. 7: **224/224** · regresión caps. 1–5: **155 + 323 + 151 + 246 + 163**, 0 discrepancias. **Total del sitio: 1 577** |
| Sesiones de R y de Python encadenadas | terminan con código 0 en los siete capítulos |
| Doble vía para toda varianza | cap. 6: HH enumerado ↔ fórmula cerrada; HT por espacio de muestras ↔ doble suma ↔ SYG; agpps por **tres vías** (a mano forma HT ↔ a mano SYG ↔ `survey` con `ppsmat`, dif. ≤ 1·10⁻¹⁴); classpps a mano ↔ `survey`. cap. 7: razón por `svyratio` ↔ linealización a mano (dif. 0); **jackknife a mano ↔ `JKn`** (2,9·10⁻⁷) en NHANES *y* en SYC; IPFP a mano ↔ `rake()` (1,4·10⁻¹²); estratificado a mano ↔ `survey` |
| Cuatro estimadores de varianza sobre el mismo dato | linealización 0,253197 · jackknife 0,253259 · BRR 0,258531 · bootstrap 0,254364 |
| `node --check` del motor | OK en la plantilla y en los caps. 1–7 |
| Consola del navegador | 0 errores y **0 avisos** en los 21 módulos nuevos y en los de regresión |
| KaTeX | 0 errores; 210 expresiones en el cap. 6 y 92 en el cap. 7 (el 7 es operativo, no algebraico: 8 fórmulas de bloque y 38 inline en sus módulos, más glosario y quiz) |
| Gráficos por módulo | se destruyen al salir (2 → 0 al pasar del módulo 8 al 9 del cap. 7) |
| Simuladores en todos sus valores y extremos | 19 de 19, **97 estados** probados (57 + 40), 0 lecturas con `NaN`/∞/vacías |
| Componentes | `.ciclo`: 6 etapas, cada una abre solo su panel y todas traen su «qué te devuelve atrás»; `.diagrama-diseno`: 2 instancias nuevas; 3 tablas-ranking nuevas; 2 glosarios de 12 filas |
| Autoevaluación | 22 preguntas nuevas, los 4 tipos, flujo fallo → pista → reintento correcto |
| Ejercicios guiados | 8 nuevos; los 16 paneles abren; las 8 soluciones con su bloque verificado |
| CSS frente a la plantilla | caps. 1–7: **168 clases, 0 faltantes**; llaves 398/398 |
| Geometría a 1440 px | cabecera 1430, lateral 280, contenido 902; sin solapes ni desbordamiento en ningún componente de los 21 módulos |
| JSON incrustado | válido e **idéntico** al de `precalculo/salidas/` en los dos capítulos |
| Regla de oro del ensamblado | los **siete** capítulos se reproducen byte a byte |
| Enlaces y permisos | los 7 `href` de `index.html` resuelven; los 8 HTML en `644` |
| `.gitignore` de lista blanca | `git check-ignore` limpio sobre los 12 archivos nuevos |

**Cinco hallazgos de la auditoría que cambiaron el material:**

1. **El πPT PIERDE frente al MAS con `counties`, y era la variable «buena».** Con 10 000 réplicas:
   deff 1,25 con `counties` (correlación 0,46 con la población), 9,17 con `waterarea` (0,04) y
   prácticamente 0 con `pop2019` (1,00). La lección que el capítulo construye sobre eso es que
   **πPT es una apuesta a la proporcionalidad, no a la correlación**, y se dejó como resultado
   destacado —tabla-ranking del módulo 5 con el MAS en primer lugar— en vez de buscar una variable
   que hiciera quedar bien al método. La misma trampa reaparece en el ejercicio 1, donde el ee
   *estimado* con n = 10 contradice a la varianza exacta.
2. **La descomposición del DEFF no es monótona.** Sobre NHANES: 1,00 → 1,73 (pesos) → **1,71
   (estratos, BAJA)** → 6,92 (conglomerados). Y el 6,92 no coincide con el 7,12 que reporta
   `svymean(deff = TRUE)` porque `survey` compara contra un MAS *con estos pesos* y la
   descomposición contra el MAS *ideal*. Las dos cosas se declaran en el material (módulo 3, caja
   de advertencia y nota) en vez de esconder la discrepancia.
3. **Recortar pesos en NHANES no compensa.** El recorte al percentil 80 baja el Kish de 1,89 a
   1,31 —los pesos se aplanan, que era el objetivo— pero el error estándar **no mejora** (0,2532 →
   0,2559) y la media se desplaza 0,057. La razón la da el hallazgo 2: la varianza la ponen los
   conglomerados, no los pesos. El módulo 8 lo convierte en regla: **antes de recortar, descomponer
   el deff**.
4. **Un intervalo «del 95 %» que cubre el 56,3 %.** La simulación de 2 000 réplicas con ICC = 0,15
   y conglomerados de 40 mide el costo real de ignorar el diseño. Traducido a contrastes: la tasa
   de falsos positivos pasa del 5 % nominal a más del 40 %.
5. **`wtshare` no es lo que el plan suponía.** Sus columnas `child`, `preschool` y `numadult` son
   **indicadores 0/1**, no conteos de adultos por hogar, así que el ejercicio de «peso compartido»
   que se había redactado sobre él era imposible. Se descartó el dataset y el ejercicio 4 pasó a
   ser el jackknife sobre SYC. Otro caso de la regla del proyecto: mirar los datos antes de
   escribir sobre ellos.

**Hallazgo de coherencia del Checkpoint 3 — corregido:** una auditoría transversal de la notación
π del cap. 2 al 7 encontró que **el capítulo 5 era el único sin `\pi` en su prosa** (lo tenía solo
en su glosario y su diagrama, que viven en JavaScript). Se añadió al módulo 2 del cap. 5 una caja
`.formula` que escribe el diseño de conglomerados en el marco π —`π_k = (n/N)(m_i/M_i)`, su peso y
el HT— y lo enlaza con el caso de una etapa. Reverificado: 163/163 cifras, 0 errores de consola,
la fórmula renderiza (5 expresiones, 822 px dentro de 902) y el capítulo sigue reproduciéndose
byte a byte.

**Anotaciones de la fase, para no repetir el tropiezo:**
- **Un ensamblador clonado con `sed` conserva el `DESTINO` viejo si el nombre del archivo no
  contiene la cadena sustituida.** `ensambla_cap7.py` nació de `sed s/cap6/cap7/` sobre el del 6,
  pero el destino era `capitulo-6-probabilidades-desiguales.html` —sin «cap6» dentro— y además el
  `.replace(..., 1)` posterior solo tocó la primera ocurrencia, la del docstring. Resultado: **el
  cap. 7 sobrescribió el archivo del cap. 6**. Se detectó al instante porque el propio script
  imprime el nombre de lo que escribe. Regla: **leer el nombre que imprime el ensamblador antes de
  seguir**, y clonar comprobando `DESTINO` explícitamente.
- **La `.tabla-ranking` necesita sus cuatro hijos en el HTML**, no solo el `div` con
  `data-ranking`: `pintarTablaRanking` busca `.tabla-ranking-marco` y **retorna en silencio** si no
  lo encuentra. El componente salió vacío en el cap. 6 y no dio ningún error. A diferencia del
  `.diagrama-diseno` y el `.glosario-notacion`, que sí se autopintan sobre un `div` vacío. Lo cazó
  el recorrido instrumentado, no la lectura del código.
- **KaTeX avisa por texto acentuado en modo matemático.** El glosario envuelve *cada* campo de
  notación en `$…$`, así que poner `'inclusión forzosa'` en la columna de Gutiérrez metía una «ó»
  en modo matemático. Se arregló con `\text{incl. forzosa}`. Los campos `concepto` no se envuelven
  y sí admiten acentos.
- **`as.matrix()` no le quita la clase `table` a una tabla de R**, y `jsonlite` no serializa
  objetos `table`: hay que reconstruir la matriz numérica (`matrix(as.numeric(m), nrow = ...)`).
  El precálculo del cap. 7 murió dos veces por esto, la segunda después de «arreglarlo».
- **`survey` devuelve `DEff = Inf` si no se declara `fpc`**, porque no tiene el N poblacional del
  MAS de referencia. Pasó con `ipums`; el deff hay que calcularlo a mano. Se convirtió en la
  segunda trampa del ejercicio 2, en vez de esconderlo.
- **`JK1` no sirve con diseños estratificados** (`survey` se niega explícitamente) y **BRR exige
  exactamente 2 PSU por estrato**. La elección del método de replicación la fija la estructura del
  diseño, no la preferencia del analista — y por eso el cap. 7 necesita dos encuestas.
- **Un bucle `while` de truncamiento de π puede no terminar en Python** si se reescala sobre el
  vector ya truncado: la primera versión de `cadena.py` se colgó. Hay que llevar una máscara de
  «forzosas» y recalcular desde el vector original en cada vuelta.
- **El generador de R y el de Python no dan la misma simulación**: la cobertura salió 0,563 en R y
  0,545 en Python con la misma semilla nominal. No es un error; se declara en el propio bloque.
- **Las cifras a ojo volvieron a fallar, cinco veces**, esta vez en los comentarios `#>` de la
  cadena de Python del cap. 7 (deff 6,9219 por 6,9206; los seis errores del IPFP; la tabla final;
  la cobertura). Para el cap. 7 se escribió un script que **anota las salidas reales
  automáticamente** a partir de la ejecución capturada, en vez de transcribirlas a mano.

### Checkpoint 3 — Segundo tercio — ✅ SUPERADO (2026-07-28)
- [x] Caps. 4–7 verificados; **el marco π se sostiene coherente desde el cap. 2 hasta el 7**,
      comprobado con una auditoría transversal de notación (ver el hallazgo de coherencia arriba):
      los 7 capítulos tienen su `.glosario-notacion` de 12 filas, ninguno usa notación rival sin
      declararla, y los dos únicos «3 059» en prosa son las cajas que **declaran** la decisión del
      marco `N = 3 078`.
- [x] Todas las varianzas de diseño reproducidas por dos vías (varias por tres).
- [x] Los caps. 7 y 8 no necesitaron partirse: el 7 cerró en 10 módulos (el riesgo anotado abajo
      preveía partirlo si pasaba de 12).

### Fase 4.5 — Revisión del Checkpoint 1 — ✅ COMPLETADA (2026-07-28)

**Javier respondió al Checkpoint 1**: «si quiero que mejores la explicación, a ratos es muy
abstracta, revisa también la notación y los cálculos». Las tres cosas se auditaron y se
corrigieron. Las cuatro decisiones de apertura (las cuatro recomendadas, aceptadas):

1. **Retropropagar el patrón «concreto → formal» a los 22 módulos** que abrían formalizando,
   empezando por el cap. 2. El patrón ya existía en los caps. 6 y 7 (cuatro tiendas con cifras
   antes de la definición); se trataba de llevarlo hacia atrás.
2. **Subir a 200 000 réplicas y declarar el error de Monte Carlo** en el sesgo del cap. 3.
3. **Ampliar `verifica_bloques.py` a las cifras de la prosa**, con línea base revisada.
4. **Unificar la razón poblacional en `B`** (la notación de Lohr, ya usada por el cap. 3).

#### El diagnóstico, medido

Se escribió `precalculo/mide_abstraccion.py`, que compara la posición de la primera
**formalización** (fórmula de bloque, caja `.definition` o `.formula`) con la del primer
**anclaje** (bloque de código, simulador, tabla, o un párrafo con cifras concretas).

| | Antes | Después |
|---|---:|---:|
| Módulos que formalizan antes de anclar | **22 de 77** | **0** |
| — de ellos, en el cap. 2 (el pivote) | 7 de 11 | 0 |

El cap. 2 era el peor con diferencia: sus módulos 1–5 soltaban la definición entre un 29 % y un
42 % del módulo antes del primer número. El módulo 3 abría con *una frase* de intuición y
encadenaba seis fórmulas —definición, indicadores, insesgadez, varianza, Sen–Yates–Grundy— sin un
solo dato.

#### Qué se cambió en el contenido

- **Cap. 2, módulo 1:** la población de cinco condados sube del 50 % al 11 % del módulo, y las
  definiciones de $p(s)$ y soporte salen *de ella* en vez de precederla.
- **Cap. 2, módulo 3:** el HT se introduce resolviendo una muestra concreta —$\{3,5\}$ bajo el
  diseño desigual, $27 \times 2{,}50 + 58 \times 1{,}82 = 172{,}95$— **que no acierta** (el total
  es 150). Esa «falla» motiva la insesgadez del módulo 4 mucho mejor que un ejemplo que cuadre.
- **Cap. 2, módulos 2, 4, 5, 7, 8 y 9:** aperturas con la cuenta hecha a mano (contar en cuántas
  de las diez parejas sale el condado 1), con los datos reales de `agsrs`, o con el resultado que
  el módulo va a explicar.
- **Los otros 15 módulos** (caps. 1, 3, 4, 5, 6 y 7) reciben un párrafo de apertura con el dato
  que motiva el módulo: el error estándar que cae de 58,2 a 5,54 millones (cap. 3, m1), el reparto
  de Neyman que asigna 5 condados al Nordeste (cap. 4, m4), el 99,2 % de varianza que viene de la
  primera etapa (cap. 5, m6), los 15 grados de libertad de NHANES (cap. 7, m1).

#### Los cálculos: un error real encontrado

**El «sesgo medido» del cap. 3 era ruido de Monte Carlo.** Con las 5 000 réplicas originales, a
partir de $n \approx 100$ el sesgo simulado salía **con signo contrario al teórico** y era **menor
que su propia incertidumbre de estimación**. El material publicaba «con $n = 300$ el sesgo vale
unos 10 500 acres» cuando el valor real es **−38 963** — un factor 4 y el signo cambiado.

| n | sesgo con M = 5 000 | sesgo con M = 200 000 | teórico | ee de Monte Carlo |
|---:|---:|---:|---:|---:|
| 100 | **+97 085** | −100 486 | −123 438 | ±28 402 |
| 300 | **+10 479** | −38 963 | −38 383 | ±15 891 |

La corrección sube $M$ a 200 000, **publica el error de Monte Carlo junto a cada sesgo**, añade
barras de error al simulador y mete dos `stopifnot` en el precálculo: que el sesgo sea medible y
que simulado y teórico **coincidan en signo**. La caja nueva del módulo 4 convierte el tropiezo en
lección: *una simulación sin barra de error no es una medición*.

Las **92 fórmulas de bloque** del material se revisaron una a una: todas correctas, incluidas las
derivaciones delicadas (sesgo de la razón por Taylor, varianza de Poisson, jackknife estratificado,
SYG). Único matiz anotado: el deff de Kish escribe $1 + s_w^2/\bar w^2 = n\sum w^2/(\sum w)^2$ como
igualdad, y solo es exacta con divisor $n$; el código usa `var()`, que divide por $n-1$ (diferencia
de orden $1/n$, irrelevante con $n = 5\,406$).

#### La notación

`B` (Lohr, y ya la del cap. 3) frente a `R` (Gutiérrez) para la razón poblacional: el cap. 7 usaba
`R` **contradiciendo el glosario del propio material**. Unificado en `B` en las 11 ocurrencias
—fórmulas, prosa, autoevaluación y `cadena.R`— y añadida la fila «Razón poblacional» al glosario
del cap. 7. El resto de la notación se auditó y es consistente: `d_k` de diseño frente a `w_k`
final está bien distinguido, y `S²` frente a `σ²` también.

#### El verificador, ampliado

`verifica_bloques.py --prosa` contrasta ahora las cifras citadas en **párrafos, cajas y listas**
—no solo las de los comentarios `#>`— contra las salidas ejecutadas y el JSON del precálculo.
Las que no se pueden derivar automáticamente (cocientes que el autor deriva, cifras en otra unidad,
constantes de tabla) viven en `precalculo/cifras_prosa.json` **con su justificación**, revisadas
una a una ejecutando. Funciona como regresión: solo protesta por cifras nuevas.

*Prueba de regresión del propio verificador:* la primera versión aceptaba cambios de escala
(×100, ×1000, ×10⁶) para casar «7,1 millones» con 7081850, y con eso **coló un `deff ≈ 47,83`
inventado**. Se endureció a comparación estricta por redondeo, y entonces cazó las tres
inyecciones de prueba.

**Resultado de la revisión completa: 1 577 cifras de bloques + 246 de prosa, 0 discrepancias.**

**Anotaciones de la fase, para no repetir el tropiezo:**
- **Escribir prosa nueva con cifras de memoria falla, y falló tres veces en esta misma sesión** —
  precisamente mientras se corregía ese problema. Se escribió «$\pi_5 = 0{,}7$» donde era 0,55,
  «96,9» donde era 98,46 y «5,53» donde era 5,59. **Regla nueva: consultar el JSON del precálculo
  ANTES de redactar el párrafo, no después.** El verificador de prosa existe justamente porque
  esta disciplina falla incluso sabiéndola.
- **Una métrica estrecha esconde el progreso.** La primera versión de `mide_abstraccion.py` solo
  contaba código y simuladores como anclaje, así que no veía las mejoras hechas con prosa y
  reportaba 5 módulos malos donde ya solo quedaba 1. Un párrafo que resuelve un caso con números
  ancla tanto como un bloque de R.
- **Un verificador permisivo da falsa calma.** Sin la prueba de inyección, la versión laxa habría
  pasado por buena y el proyecto habría creído tener cubierta la prosa.
- **El mejor ejemplo pedagógico no es el que cuadra.** El HT del módulo 3 se introduce con una
  muestra que falla por un 15 %: eso motiva la insesgadez *en promedio* mucho mejor que un ejemplo
  elegido para dar el resultado exacto, que además huele a truco.

### Fase 5 — Capítulo 8, portada y publicación — ✅ COMPLETADA (2026-07-28)

**Decisiones tomadas al abrir la fase, consultadas a Javier:**
1. **Hilo de datos: `teachers`/`teachnr` como caso central** (recomendado, aceptado). Es la encuesta
   de carga laboral docente de Gnap (1995), y es el único caso del curso en el que el sesgo de no
   respuesta se puede **medir** en vez de suponerlo, porque la autora submuestreó a los no
   respondientes. `profresp` + `profrespacs` estrenan la calibración contra totales reales de la
   ACS; `impute` lleva los métodos de imputación; `intell*` queda para el ejercicio 1; y `agpop`
   sirve para simular los mecanismos, que es la única forma de conocer la verdad.
2. **Componente nuevo `.rubrica`, retropropagado a los 7 capítulos** (Javier amplió sobre la
   recomendación de no crear componentes en la última fase, fiel a su patrón). Rúbrica recorrible
   por criterio, con sus cuatro niveles y el rango de puntos.
3. **Imputación múltiple a mano + `mitools::MIcombine`** (recomendado, aceptado): cero paquetes
   nuevos, y la mecánica de Rubin —que es el tema del módulo— queda a la vista en vez de dentro de
   una caja negra. `mice` se menciona como el paquete estándar para producción.
4. **Módulo 9 con tres afirmaciones refutadas con código + lista de verificación** (recomendado,
   aceptado), en vez de auditar un diseño de IA inventado.

Supuestos aplicados sin re-preguntar: marco completo `N = 3 078`; Python solo donde el cálculo
explícito es la lección (fórmula del sesgo, ajuste por clases, hot-deck, reglas de Rubin);
ejercicios originales sobre datos de Lohr; publicar al cierre auditado de la fase.

- [x] **T5.0 — Componente `.rubrica`** → `ensamblado/componentes/rubrica.{css,js}` y
      `retropropaga_rubrica.py` (idempotente). Rúbrica analítica recorrible: se elige un criterio y
      se ven sus cuatro niveles ordenados de mayor a menor, cada uno con su rango de puntos y con
      lo que hay que **ver** en el trabajo. Franja final con las condiciones que anulan la entrega.
      Insertado en la plantilla (CSS + motor + demostración) y en los caps. 1–7 (CSS + motor, sin
      instancia). *Verificado:* idempotencia, los 7 ensambladores siguen reproduciendo byte a byte,
      `node --check` en los 8 motores, y la demo probada en navegador (2 criterios, 4 niveles,
      KaTeX en la franja de anulación, 822 px dentro de 904). Los 8 capítulos pasan de 168 a
      **187 clases CSS, 0 faltantes**.
- [x] **T5.1 — Capítulo 8** → `capitulo-8-no-respuesta-ponderacion.html` (352 KB), nuevo.
      **11 módulos, 8 simuladores + 1 tabla-ranking, 11 preguntas (los 4 tipos), 4 ejercicios
      guiados, 29 bloques (25 R + 4 Python)**, `.glosario-notacion` propio, la **segunda instancia
      del `.arbol-error`** (el árbol del cap. 1 releído con los ocho capítulos dentro), un `.ciclo`
      con las cinco decisiones del taller y la **primera `.rubrica`** del material.
      Precálculo en `genera_cap8.R` → `cap8_datos.json`; ensamblado en `ensambla_cap8.py`.
- [x] **T5.2 — Portada del curso** con 8 tarjetas y totales recontados por `cuenta_sitio.py` sobre
      los propios archivos: **88 módulos, 65 simuladores**. Actualizada también la **portada
      paraguas** `sitio/index.html`, que se había quedado en la fase 2 («4 capítulos · 43 módulos ·
      22 simuladores»).
- [x] **T5.3 — READMEs.** El del repositorio gana la tabla de herramientas y la regla de oro del
      ensamblado; el del curso, la tabla de los 8 capítulos con sus temas y la lista de componentes
      propios; el de `ensamblado/`, el anotador de salidas y sus dos trampas.
- [x] **T5.4 — Auditoría final del sitio.** Ver abajo.
- [x] **T5.5 — Publicación.** `git push origin main` + `git subtree push --prefix sitio origin
      gh-pages`.

### Auditoría de la fase 5 (2026-07-28)

| Comprobación | Resultado |
|---|---|
| Cifras `#>` contrastadas con la salida real | cap. 8: **458/458** · regresión caps. 1–7: 155 + 323 + 151 + 246 + 163 + 315 + 224, 0 discrepancias. **Total del sitio: 2 035** |
| Cifras de la **prosa** contrastadas | **364 respaldadas, 0 sin respaldo** en los 8 capítulos (79 de ellas en el cap. 8) |
| Sesiones de R y de Python encadenadas | terminan con código 0 en los ocho capítulos |
| Doble vía para toda varianza | ee del estimador de razón sobre conglomerados: fórmula del cap. 5 a mano ↔ `survey`, **coinciden a 4·10⁻¹⁵**; post-estratificación: $N_c/n_c$ a mano ↔ `postStratify` (dif. 5·10⁻¹⁰) y los pesos suman el total de control exacto; reglas de Rubin a mano ↔ `mitools::MIcombine` (dif. 0); estimador de dos fases por tasas ↔ por conteos |
| Construcción de los mecanismos, comprobada | la propensión media de MNAR es 0,60 en las cinco clases de ajuste, así que el ajuste no puede verla; con `stopifnot` en el precálculo |
| Regresión del verificador de bloques | el fixture con la cifra falsa sigue cazándola (6 de 7) |
| Regresión del verificador de **prosa** | inyectada `$-1{,}10$ → $-7{,}31$` en modo matemático: **la caza** (antes de esta fase no la habría visto, ver hallazgo 1) |
| `node --check` del motor | OK en la plantilla y en los caps. 1–8 |
| Consola del navegador | 0 errores y **0 avisos** en los **88 módulos** de los ocho capítulos |
| KaTeX | 0 errores en los ocho; **1 652 expresiones** renderizadas (152 en el cap. 8) |
| Gráficos por módulo | `charts` = `canvas` en los 88 módulos; al salir del módulo quedan solo los del activo |
| Simuladores en todos sus valores y extremos | 8 de 8, **123 estados** probados (39 en barrido completo de los discretos + 84 en pasada densa de los tres continuos), 0 lecturas vacías, 0 `NaN`/∞ |
| Componentes | `.rubrica`: 6 criterios × 4 niveles, 100 pts, KaTeX en foco y en la franja de anulación; `.arbol-error`: 12 nodos con 12 fichas distintas; `.ciclo`: 5 etapas × 3 campos; `.tabla-ranking`: 5 filas ordenables por 3 columnas; `.glosario`: 12 filas |
| Autoevaluación | 11 preguntas nuevas, los 4 tipos (3 numéricas, 5 de opción, 2 múltiples, 1 gráfica), 7 módulos cubiertos, flujo fallo → pista → reintento correcto, y el marcador distingue primer y segundo intento |
| Ejercicios guiados | 4 nuevos; los 8 paneles abren; las 4 soluciones con su bloque verificado |
| CSS frente a la plantilla | caps. 1–8: **187 clases, 0 faltantes**; llaves 434/434 |
| Geometría a 1440 px | cabecera 1430, lateral 280, contenido 904; sin solapes ni desbordamiento en ningún módulo |
| Módulos que formalizan antes de anclar | **0 de 88** (`mide_abstraccion.py`) |
| JSON incrustado | válido e **idéntico** al de `precalculo/salidas/` |
| Regla de oro del ensamblado | los **ocho** capítulos se reproducen byte a byte |
| Enlaces y permisos | los 8 `href` de `index.html` resuelven; los 9 HTML del sitio en `644` |
| `.gitignore` de lista blanca | `git check-ignore` limpio sobre los 14 archivos y carpetas nuevos |

**Seis hallazgos de la auditoría que cambiaron el material o las herramientas:**

1. **`verifica_bloques.py --prosa` no miraba las cifras escritas en modo matemático, que son la
   mitad del material.** La expresión regular exigía `\d+,\d{2,}` en texto plano, y el material
   escribe `$-1{,}10$`, `$306\,677$`: la coma va entre llaves y el `$` estaba en el *lookbehind*.
   Se descubrió inyectando una cifra falsa y viendo que **no protestaba**. Corregido: se normaliza
   el LaTeX antes de buscar y el signo entra en la captura (sin eso, `$t = -4{,}73$` se comparaba
   como $+4{,}73$). Consecuencia inmediata: la cobertura de prosa pasa de 246 a **364 cifras**, y
   con ella salieron a la luz los hallazgos 2 y 3. **La cifra de «246 cifras de prosa verificadas»
   de la fase 4.5 solo cubría las de texto plano.**
2. **Los capítulos 1 y 8 usaban recuentos distintos del mismo sondeo de 1936.** El cap. 1 trabaja
   con las cifras del relato de Lohr §1.1 (1 293 669 y 972 897 papeletas, porcentajes redondeados
   de la elección) y da un sesgo de **−19,32 puntos**; el cap. 8 usa las del ejercicio 15.14 de la
   3.ª ed. (1 286 511 y 966 352, votos exactos) y da **−19,57**. Las dos son de la misma autora.
   Se declara en una caja de advertencia del módulo 2 con el motivo de la elección —la identidad
   de Meng necesita $\sigma_y$ y $f$ sin redondear—, en vez de quedarse con la que saliera mejor.
3. **Un redondeo mal hecho, cazado por la herramienta recién arreglada:** el texto anunciaba
   $B = 0{,}0214$ y el valor es 0,02145037, que a cuatro decimales es **0,0215**. Corregido.
4. **El `<meta name="description">` del capítulo 7 decía «Capítulo 6».** Es el residuo del clon con
   `sed` que ya había provocado que el cap. 7 sobrescribiera el archivo del 6 en la fase 4:
   la misma cadena mal sustituida, esta vez en un sitio que no se ve al abrir la página. Corregido
   en `ensambla_cap7.py` y republicado.
5. **La portada paraguas se había quedado en la fase 2** («4 capítulos · 43 módulos ·
   22 simuladores»). Las fases 3 y 4 actualizaron la del curso y olvidaron la del repositorio.
   Ahora los totales de las dos portadas y del README los produce `cuenta_sitio.py`, que los
   cuenta sobre los archivos.
6. **El simulador del R-indicator leía los campos un nivel por encima de donde están** (`G.school`
   en vez de `G.escuelas.school`) y rompía el módulo 7 entero. Lo cazó el recorrido instrumentado
   de los 11 módulos, no la lectura del código — es la tercera vez que ese recorrido caza un fallo
   que ninguna otra comprobación ve.

**Cinco resultados del capítulo que conviene recordar:**

1. **El sesgo de no respuesta, medido y no supuesto.** Los profesores que **no** devolvieron el
   cuestionario sobre carga laboral trabajan 36,46 horas semanales; los que sí, 34,63. Con una tasa
   de respuesta del 39,8 %, el sesgo vale **−1,10 horas**: la encuesta subestima la carga docente
   en más de una hora por semana, y el error estándar es 0,53, así que **el sesgo lo duplica**. A
   partir de $n = 10$ el sesgo ya domina al error estándar.
2. **El ajuste de pesos empeoró la estimación, y se puede demostrar.** Sin ajustar 34,63; por
   clases de tamaño 34,37; con una clase por escuela 33,82; la verdad aproximada, 35,73. Los tres
   ajustes se alejan, y el más fino es el que más. No es un fallo del método: es que el mecanismo
   es MNAR respecto a las variables disponibles —lo que impide contestar es la carga del propio
   profesor—, y la simulación de los cuatro mecanismos lo había anticipado con precisión: MAR 100 %
   del sesgo eliminado, «MAR fino» 82 %, **MNAR −1 %**.
3. **Dos millones de papeletas que valían por seis personas.** La correlación entre responder y
   votar a Landon fue de 0,093 y, multiplicada por $\sqrt{(1-f)/f} = 4{,}33$, produjo 19,6 puntos
   de error. El cap. 1 ya había llegado a ese número comparando ECM a mano; la identidad de Meng lo
   da en una línea y dice de qué depende.
4. **Imputar y callarse deja un error estándar MENOR que tirar las filas incompletas.** Con casos
   completos, 0,6403; imputando por regresión, 0,5520 — un 14 % más estrecho con tres valores
   inventados dentro. Medido con 2 000 réplicas: la cobertura del IC del 95 % cae de 92,65 %
   (datos completos, que ya no es 95 % por la asimetría de `acres92`) a **87,15 %**, y las reglas
   de Rubin recuperan 4 de esos 5,5 puntos.
5. **La variable con más sesgo del archivo es `assist`**: los no respondientes tienen 2,76 veces
   más minutos de auxiliar en el aula (152,3 contra 55,1). El sesgo relativo es del **−51,5 %**:
   cualquier conclusión sobre recursos de apoyo basada en esa encuesta está gravemente sesgada. Es
   el ejercicio 4.

**Anotaciones de la fase, para no repetir el tropiezo:**
- **Una herramienta de verificación también hay que verificarla, y con una inyección que no exista
  en el archivo.** El primer intento de probar el modo `--prosa` usó `-2{,}47`, que resultó ser el
  redondeo de una desviación típica real del capítulo, y el verificador la dio por buena
  legítimamente. La conclusión no es que la herramienta falle: es que comprueba que **la cifra
  exista**, no que sea **la correcta en ese sitio**. Eso último no lo puede hacer una regla.
- **El primer diseño de la simulación de mecanismos no servía.** Con `acres87` y `acres92`
  correlacionados a 0,995, «MAR sobre x» y «MNAR sobre y» eran casi el mismo mecanismo (81 464
  contra 81 476 de sesgo). Hubo que construir MNAR como dependiente de $y$ **dentro** de cada clase
  de ajuste: así la tasa de respuesta de cada clase vale 0,60 exactamente y el ajuste no tiene nada
  que ver. La definición operativa vale más que la nominal.
- **Un auxiliar demasiado bueno tampoco sirve para enseñar.** La simulación de cobertura con
  `acres87` ($R^2 = 0{,}99$) daba 0,9240 contra 0,9265: la imputación acertaba casi siempre y no
  había lección. Con `largef92` ($R^2 = 0{,}46$), que es la fuerza de un modelo real, la diferencia
  salta a 5,5 puntos.
- **El colapso de categorías de un archivo ajeno se deduce y se declara.** `profresp` codifica la
  edad en 4 grupos y `profrespacs` en 3, sin codebook. De los tres colapsos ordenados posibles solo
  uno deja los márgenes a menos de 3,4 puntos de la ACS; los otros dos se van a 22 y 31. El
  argumento es sólido porque *sabemos* que el panel se desvía —21 puntos en educación— y aun así la
  edad encaja. Va en el bloque, con la evidencia, y en una caja de advertencia.
- **Un `print("\n...")` dentro de un bloque hace abortar al ensamblador**, que lo confunde con
  restos del marcador. Usar `print()` y luego el texto.
- **Los `library()` que no cargue la cabecera del verificador tienen que ir dentro del bloque.** Es
  la misma regla que ya existía para `options(scipen=)`: el bloque publicado tiene que correr solo.
  `mitools` lo necesitaba el bloque de las reglas de Rubin.
- **El anotador de salidas es ahora una herramienta versionada** (`precalculo/anota_salidas.py`),
  no un script de usar y tirar como en la fase 4. Ejecuta la cadena y reescribe cada grupo `#>`
  con la salida de **sus** sentencias, no la del bloque entero: esa distinción, que la primera
  versión no hacía, es la que corrompió `cap1/cadena.R` en la fase 6 (ver T6.3). Con `--check`
  sirve de regresión.

### Checkpoint 4 — Cierre — ✅ SUPERADO (2026-07-28)
- [x] **Los 8 capítulos cubren las 16 semanas del cronograma**, verificado contra el syllabus
      (`Syllabus/Syllabus_Muestreo_Estadistico_2026-II.pdf`, sección 4):

  | Semanas | Syllabus | Material |
  |---|---|---|
  | 1–2 | Lohr 1.1–1.6: *Literary Digest*, sesgos, cuestionarios | cap. 1 (10 M) |
  | 3–4 | Lohr 2.1–2.6: MAS, tamaño de muestra, sistemático | cap. 2 (11 M) |
  | 5–6 | Lohr 3.1–3.3: razón, regresión, dominios | cap. 3 (12 M) |
  | 7–9 | Lohr 4.1–4.8: estratificado, asignación, post-estratificación y cuotas | cap. 4 (12 M) |
  | 10–11 | Lohr 5.1–5.5: conglomerados una y dos etapas, DEFF | cap. 5 (11 M) |
  | 12–13 | Lohr 6.1–6.5: PPT, Hansen–Hurwitz, Horvitz–Thompson | cap. 6 (11 M) |
  | 14 | Lohr 7.1–7.3: encuestas complejas, pesos y DEFF | cap. 7 (10 M) |
  | 15 | Lohr 8.1–8.6 + **AI-assisted survey design workshop** | cap. 8, módulos 1–9 |
  | 16 | Integración, revisión de los tres módulos, proyecto integrador | cap. 8, módulos 8, 10 y 11 |

  Las dos actividades que el syllabus nombra explícitamente para las semanas 15 y 16 —el taller de
  diseño con verificación crítica de IA, y la revisión integradora de los módulos I, II y III—
  tienen módulo propio (9 y 10) y no quedan como texto suelto.
- [ ] **Revisión de contenido por Javier.** Pendiente.

---

### Fase 6 — Revisión del capítulo 1: redacción, paralelismo R/Python y lectura guiada — EN CURSO (2026-08-13)

Nace de una petición de Javier: revisar ortografía y redacción del capítulo 1, dar a **cada** bloque
de código su pestaña en el otro lenguaje, y poner tras cada gráfico o simulador una caja expandible
que le diga al estudiante qué debía extraer. Con auditoría.

**Decisiones tomadas el 2026-08-13.**
1. Alcance: el capítulo 1 completo. El componente queda estampado en la plantilla y en los ocho
   publicados; el contenido de las cajas, solo en el cap. 1. Los otros siete se deciden después, con
   el piloto auditado a la vista.
2. Las 5 soluciones de los ejercicios guiados (módulo 10) pasan a pestañas R + Python.
3. La caja va **cerrada por defecto** y convive con `.simulador-lectura`, que se queda como está.
4. Auditoría en tres capas: herramientas del repo, auditor independiente y pasada de navegador.

**Suposiciones declaradas.** Los comentarios del código están sin tildes a propósito y la revisión
ortográfica no los toca. En los tres bloques hoy solo-Python, al añadir R la pestaña activa pasa a
ser R, homogéneo con la decisión de arquitectura nº 3. Las cajas van solo tras los simuladores: el
glosario no es un gráfico.

**Línea base medida antes de tocar nada (2026-08-13).** `ensambla_cap1.py` reproducía el capítulo
byte a byte; `verifica_bloques.py --todos --prosa` daba 2 035 cifras de bloques y 365 de prosa con
0 discrepancias. El cap. 1 tenía 18 bloques (14 R + 4 Python), 1 de los 12 `code-tabs` con las dos
pestañas, 5 `<pre>` sueltos fuera de pestañas y 0 cajas de lectura guiada.

**Los 16 bloques que faltan**, en orden de documento: `RP1`, `RP2` (módulo 1) · `PR1`, `PR2`
(módulo 2) · `PR3`, `PR4`, `PR5`, `RP3`, `PR6` (módulo 4) · `PR7` (módulo 7) · `PR9` (módulo 8) ·
`PS1`–`PS5` (módulo 10). Son 13 de Python y 3 de R; el capítulo pasa de 18 a 34 bloques. Ningún
bloque del cap. 1 usa `survey` ni `sampling` —es base R sobre los CSV de Lohr—, así que Python puede
reproducir cada cifra sin aproximar.

- [x] **T6.1 — Componente `.lectura-guiada`.** `ensamblado/componentes/lectura_guiada.css` y
      `ensamblado/retropropaga_lectura_guiada.py`. Es el primer componente del proyecto **sin motor
      de JavaScript**: `<details>`/`<summary>` nativo, que abre con Enter y con Espacio, entra en el
      orden de tabulación y lo anuncia el lector de pantalla sin declarar un solo `aria-expanded`.
      Por eso el retropropagador solo estampa CSS y no añade ninguna llamada a `loadModule()`.

      Nace en el cap. 1 y se propaga **hacia adelante** (caps. 2–8), al revés que la rúbrica. El
      cap. 1 queda fuera de la lista porque su ensamblador lo regenera desde la plantilla.

      Verificado: idempotente (segunda pasada = «ya lo tiene»); los ocho capítulos suman +150 líneas
      y **0 eliminadas**; el conjunto de selectores `.lectura-guiada` es idéntico en la plantilla y
      en los ocho; los ocho ensambladores vuelven a salir byte a byte; `verifica_bloques.py --todos
      --prosa` sigue en 0 discrepancias. En el navegador, sobre la demo de la plantilla: cerrada de
      origen, 45 px cerrada y 257 px abierta, el `padding: 1rem` del `details` genérico queda
      sobrescrito a 0, el galón gira de 45° a −135°, el triángulo nativo no reserva ni un píxel
      (`list-style: none` + `display: flex`), el `summary` recibe foco y conmuta, y la consola queda
      limpia. `cuenta_sitio.py` gana la columna `lectura`.

      Queda sin comprobar la regla de adyacencia `.simulador + .lectura-guiada` (margen negativo de
      −1,25 rem): en la plantilla la demo no va detrás de ningún simulador. Se verifica en T6.2.

      **Corrección aplicada durante T6.2.** La tarjeta de la idea transferible se escribió primero
      como `<div class="lectura-guiada-clave">`, y eso abría un agujero de verificación: el modo
      `--prosa` de `verifica_bloques.py` solo mira dentro de `<p>`, `<li>` y `<h4>`, así que
      cualquier cifra escrita ahí habría quedado sin contrastar —exactamente lo que esa herramienta
      existe para impedir—. Pasó a ser `<p class="lectura-guiada-clave">`, con el selector
      `.lectura-guiada-cuerpo > p.lectura-guiada-clave` para ganar la especificidad. Se revirtieron
      los nueve archivos y se volvió a estampar.
- [x] **T6.2 — Las 7 cajas del capítulo 1**, una por simulador: `digest`, `encuestas-intell`,
      `no-respuesta`, `auditor-preguntas`, `sesgo-varianza`, `n-grande-no-salva` y `poblaciones`.
      Estructura fija: qué mueves → qué se ve → por qué importa → la idea que se lleva, con el
      enganche al capítulo donde el asunto vuelve.

      Cada caja se escribió para decir algo que el simulador **no** dice ya por su cuenta, no para
      repetir la introducción: en `digest`, que la curva iso-resultado es un problema de
      identificación y no de ruido; en `encuestas-intell`, que ponderar arregla las variables por
      las que se pondera y ninguna más; en `no-respuesta`, que la tasa global que se reporta no es
      un indicador de sesgo, y que la línea de la verdad solo existe aquí porque `agpop` es una
      población completa; en `sesgo-varianza`, que el segundo gráfico marca el umbral a partir del
      cual recoger más datos no compra nada; en `n-grande-no-salva`, que el argumento entero es una
      curva que depende de $n$ contra una recta que no; en `poblaciones`, que la cola está recortada
      y la asimetría real es peor que la dibujada.

      Verificado en el navegador, recorriendo los diez módulos: las siete cajas van pegadas a su
      simulador con el margen de −17,5 px (= −1,25 rem, que **cierra el punto pendiente de T6.1**),
      cerradas de origen, 38 px cerradas y 354–415 px abiertas, la tarjeta clave es un `<p>` en las
      siete, KaTeX renderiza dentro del `<details>` cerrado —siete fórmulas, ningún `$` suelto— y la
      consola queda limpia. `verifica_bloques.py --todos --prosa` sigue en 0 cifras sin respaldo, y
      los caps. 2–8 vuelven a salir byte a byte. `cuenta_sitio.py`: 7 en la columna `lectura`.

      **Cinco errores propios cazados al releer las cajas antes de darlas por buenas**, que es la
      razón de releerlas: (1) se listaba «raza» entre las variables **no** calibradas, cuando las
      ocho celdas son precisamente sexo × edad × raza; (2) se afirmaba que la media global de
      `agpop` no describe bien a ninguna de las cuatro regiones, y Centro-Norte (325 951) está muy
      cerca de la global (306 677) —la frase se sustituyó por una comparación verdadera con las dos
      extremas—; (3) se decía que el módulo 9 lleva «este mismo gráfico» a los datos de
      entrenamiento, cuando lleva el mismo argumento y no el gráfico; (4) «qué fracción del error
      total es sesgo» cuando el gráfico reporta la fracción del error **cuadrático medio** que pone
      el sesgo²; (5) Allentown se describía como un marco «conocido por separado» cuando lo que lo
      hace concluyente es que era **completo**, lo que anula una de las dos causas.
- [x] **T6.3 — Los 3 bloques R** (`RP1`, `RP2`, `RP3`), colocados en `cadena.R` en la posición que
      les toca por orden de documento: `RP1` y `RP2` antes de `R1`, y `RP3` entre `R5` y `R6`.
      Ejecutados con el Rscript 4.4 del framework. Las tres salidas son **numéricamente idénticas**
      a las de sus gemelos `P1`, `P2` y `P3` —comprobado cifra a cifra, no de vista—, y las 155
      cifras del capítulo siguen cuadrando.

      **La colisión que anunciaba el plan era real.** `RP3` define `r`, `mu_R`, `mu_M` y `mu`, y
      `mu` es justo el nombre con el que `R6` designa la media de `acres92`. No rompe nada porque
      `R6` la redefine en su primera línea, pero se le añadió allí un comentario que lo dice: quien
      lea el capítulo de arriba abajo hereda de `RP3` un `mu` que vale una proporción de juguete, y
      es la reasignación la que lo salva. Los nombres se mantienen iguales a los de `P3` a
      propósito: las dos pestañas tienen que leerse como el mismo programa.

      **`anota_salidas.py` corrompió el archivo y hubo que revertir.** La herramienta reescribe «el
      grupo de comentarios `#>` del final de cada bloque», y eso solo vale para el estilo de un
      único grupo por bloque (cap. 8: 25 grupos / 25 bloques). Los capítulos 1 y 2 anotan de forma
      **intercalada** —un grupo tras cada sentencia— y en ellos la herramienta añade un grupo
      duplicado al final: en `cadena.R` las líneas `#>` pasaron de 53 a 89 de una sola pasada, con
      la salida impresa antes de la sentencia que la produce. Lo grave es que
      **`verifica_bloques.py` no lo detecta**: las cifras duplicadas sí están en la salida real, así
      que el archivo pasa la verificación y el estudiante lee el código descolocado. Se revirtió con
      `git checkout` y las nueve líneas nuevas se escribieron a mano desde la ejecución real,
      comprobando después que cada cifra anotada aparece en la salida de su bloque, en los 17.

      **Resuelto (2026-08-13), y el problema era más ancho de lo que decía esta nota.** No son los
      caps. 1 y 2: son **7 de las 16 cadenas**. Grupos `#>` frente a bloques, revisando los ocho
      capítulos:

      | | R | Python |
      |---|---|---|
      | cap1 | 19 / 14 — **intercalado** | 6 / 4 — **intercalado** |
      | cap2 | 31 / 21 — **intercalado** | 6 / 6 |
      | cap3 | 16 / 14 — **intercalado** | 4 / 4 |
      | cap4 | 39 / 19 — **intercalado** | 4 / 4 |
      | cap5 | 35 / 18 — **intercalado** | 4 / 4 |
      | cap6 | 49 / 19 — **intercalado** | 5 / 5 |
      | cap7 | 18 / 18 | 4 / 4 |
      | cap8 | 25 / 25 | 4 / 4 |

      El más expuesto era `cap6/cadena.R` —49 grupos en 19 bloques—, y `cap1/cadena.py` también lo
      estaba, aunque la nota solo hablaba de R.

      La herramienta ya no reparte la salida por bloque sino **por sentencia**: parte la cadena en
      sus sentencias de primer nivel (R: `parse()` con `keep.source`; Python: `ast`), ejecuta una
      copia temporal con un marcador entre sentencia y sentencia, y da a cada grupo `#>` la salida
      de las sentencias que lo preceden. «Un grupo por bloque» es el caso particular en que el
      único grupo, al final, recibe la salida de todas las sentencias del bloque; así ninguno de
      los dos estilos se convierte en el otro. Cuando no puede colocar una salida con certeza
      —un grupo sin ninguna sentencia delante, dos grupos tras la misma sentencia, un grupo que
      quedaría vacío, salida sin ningún grupo detrás, un `#>` indentado, una cadena que no se deja
      parsear— **aborta sin escribir**; nunca vuelve al «todo al final», que es el que corrompía.
      Y antes de escribir comprueba que el archivo, quitadas sus líneas `#>`, es idéntico al de
      partida: el código no lo puede tocar.

      **La prueba de que el reparto es correcto:** `--check` sobre las 16 cadenas reproduce **15
      tal cual** (salvo espacios al final de línea). La única discrepancia real es un defecto del
      material, no de la herramienta —abajo—. La regresión vive en
      `precalculo/pruebas/prueba_anotador.py`: 8 pruebas, y la primera es que una cadena
      intercalada al día no se toque ni se duplique. Contra la versión vieja, esa prueba falla.

      De paso se cerró un peligro latente: 42 líneas de las cadenas llevan dos sentencias
      (`teL = ...; miL = ...`), y en `cap7/cadena.py:70` son **dos `print()` en la misma línea**.
      Entre ellas no cabe un grupo `#>`, así que ahora se anotan como una sola unidad; anotarlas
      por separado habría atribuido toda la salida a la segunda.

      Las dos cosas que quedaban, hechas el 2026-08-13:

      - [x] **`cap2/cadena.R`, bloque `R17`: la anotación se inventó la alineación.** Decía
            `#>     pi_k    pi_kl` / `#>  0.20000  0.03984`, y R imprime `   pi_k   pi_kl` /
            `0.20000 0.03984`. Las cifras eran correctas —por eso `verifica_bloques.py` lo daba
            por bueno—, pero el espaciado no era el que sale. Corregido por la herramienta: dos
            líneas, ninguna otra del archivo.
      - [x] **Normalizados los espacios finales de línea en 4 cadenas.** `cap3/cadena.R` (22
            líneas), `cap4/cadena.py` (2), `cap7/cadena.R` (40) y `cap8/cadena.R` (62).
            Comprobado línea a línea que el cambio es **solo de espacios** y que el número de
            líneas no varía.

      Reensamblados los caps. 2, 3, 4, 7 y 8 con el plantilla de la fase 6 —el CSS de
      `lectura_guiada` de T6.1 sigue en los ocho—, y comprobado que en los cinco capítulos **todas
      las líneas que cambian son líneas `#>`**: 4, 44, 4, 80 y 124 respectivamente, ni una fuera
      de las anotaciones. `verifica_bloques.py` sobre los cinco: **1402 de 1402 cifras**, 0
      bloques con discrepancias. Y las 16 cadenas pasan ya `--check` sin diferencias, así que a
      partir de aquí esa bandera sirve de regresión de verdad.
- [x] **T6.4 — Los 8 bloques Python de la prosa** (`PR1`–`PR7`, `PR9`), en `cadena.py` en orden de
      documento. La cadena de Python queda
      `P1 → P2 → PR1 → PR2 → PR3 → PR4 → PR5 → P3 → PR6 → PR7 → P4 → PR9`.
      **Las 12 parejas R/Python publican las mismas cifras**, comprobado ejecutando las dos cadenas
      y comparando conjunto contra conjunto, no de vista.

      **Dos divergencias que resultaron ser de impresión, no de cálculo.** (1) En `PR6`, el
      escenario de tasas iguales da un cero que en coma flotante es −5,82076609134674072266e−11:
      R y Python calculan **el mismo float bit a bit**, pero al redondear queda un cero con signo
      que pandas imprime `-0.00` y R `0.00`. Se normaliza con `+ 0.0` (en IEEE 754,
      −0.0 + 0.0 = +0.0), con el comentario que lo explica: no se toca ningún valor, solo se hace
      que las dos pestañas impriman igual el mismo número. (2) En `PR7`, pandas veía juntos 2,3
      millones y 0,43 y pasaba la serie entera a notación científica; se fija con `float_format`.

      Quedan dos diferencias benignas y declaradas: R numera las filas de un `data.frame` (`1 2 3`)
      y pandas se imprime con `index=False` —poner el índice mostraría `0 1 2`, que sería peor—, y
      las series de R se imprimen en horizontal y las de pandas en vertical, como ya ocurría en el
      resto del capítulo.

      **`BigLucy`: decisión de Javier, exportar comprimido.** Es la única población del curso que no
      llega como CSV —vive dentro del paquete `TeachingSampling`, que no existe para Python—. Nuevo
      `precalculo/exporta_biglucy.R`, que la escribe en `precalculo/salidas/BigLucy.csv.gz`: 1,6 MB
      en vez de los 7,5 en claro, y tanto `read.csv()` como `pandas.read_csv()` lo leen directo sin
      opción extra. El archivo vive fuera de `sitio/`, así que la rama `gh-pages` no lo lleva y
      Pages no lo sirve. El script comprueba la ida y vuelta —filas, columnas, nombres y dos medias—
      antes de dar el export por bueno. Es el mismo recurso que usa Estadística Espacial cuando un
      dato solo existe en un paquete de R. Sirve también a los caps. 4 y 5, que usan `BigLucy`.

      **El único par que ya existía, `R8`/`P4`, no era paralelo, y se arregló.** Las dos pestañas
      del bloque «Comparación con un muestreo aleatorio de 1000» calculaban cosas distintas: R daba
      `recm_digest`, `recm_mas` y `veces_peor`; Python, una tabla del ECM por tamaño. Solo
      compartían el 6,3. Como la prosa cita **12,6 veces** dos veces y esa cifra sale únicamente de
      la pestaña de R, el estudiante que trabaja en Python no veía de dónde salía el número que el
      propio módulo destaca. Ahora las dos pestañas calculan **ambas cosas** y publican cifras
      idénticas.

      **Un fallo introducido al hacerlo, y cazado por el verificador.** Al encadenar `P4` con `PR7`
      para que las dos pestañas partieran de los mismos valores exactos, `P4` pasó a usar `sesgo` y
      `S2`, que en el HTML publicado todavía no existen: `PR7` no tiene marcador hasta T6.6. El
      capítulo pasó a 159/178 con un `NameError`. Se comprobó que partir de los valores redondeados
      da **exactamente las mismas cifras publicadas** que partir de los exactos, así que `P4` volvió
      a ser autónomo —que es lo que pide el punto 2 del protocolo— sin perder la paridad. Capítulo
      de nuevo en **178/178**.
- [x] **T6.5 — Los 5 bloques Python de las soluciones** (`PS1`–`PS5`) y sus pestañas. Los cinco son
      aritmética pura, sin datos externos, así que las cifras coinciden con `S1`–`S5` sin más. Los
      cinco `<pre>` sueltos del módulo 10 quedan envueltos en `code-tabs` con R activo y Python
      detrás, cada uno con su `aria-label` propio: ya **no queda ningún bloque de código fuera de
      pestañas** en el capítulo.

      Estos bloques viven dentro de `.ejercicio-panel.solucion`, que arranca con `hidden`, así que
      había que comprobar que el motor de pestañas los alcanza. Comprobado en el navegador, sobre
      los cinco: R activo de origen, un solo panel visible, la pulsación de Python conmuta el panel
      y el `aria-selected` de los dos botones, y Prism resalta los diez bloques —los de R y los de
      Python— pese a haberse cargado ocultos. Abriendo una solución como la abriría un estudiante y
      pulsando Python se ve el código de Python, no el de R. Consola limpia.

      El capítulo pasa a **23 bloques (14 R + 9 Python) y 205 cifras verificadas**, desde las 155
      del principio de la fase.
- [x] **T6.6 — La segunda pestaña en los 12 `code-tabs`.** Once de los doce necesitaban gemelo (el
      duodécimo, `R8`/`P4`, ya era dual). La transformación se hizo con un script sobre los tres
      archivos de módulos, no a mano: reconstruye cada grupo con los dos botones, los dos paneles y
      el marcador del gemelo, **conservando el `aria-label` que ya tenía cada bloque** y dejando
      intacto el par que ya existía.

      En los tres bloques que hasta ahora eran solo de Python (`P1`, `P2`, `P3`), la pestaña activa
      pasa a ser R, como se declaró al abrir la fase: homogéneo con el resto y con la decisión de
      arquitectura nº 3.

### Checkpoint 5 — El código del capítulo 1 · BLOQUEANTE
- [x] `ensambla_cap1.py` sin abortar, **34 bloques**, y el aviso de «bloques ejecutados que no se
      insertaron» desaparece: no queda ningún marcador suelto
- [x] `verifica_bloques.py` del cap. 1: **303 de 303 cifras, 0 discrepancias**, con las dos cadenas
      ejecutadas **encadenadas en orden de documento**, que es la prueba de que la colocación de
      `RP1`/`RP2` antes de `R1`, la de `RP3` entre `R5` y `R6`, y la redefinición de `mu` en `R6` y
      `PR6` son correctas. `--todos --prosa`: los 8 capítulos verdes, 0 cifras de prosa sin respaldo
- [x] **Los 17 pares R/Python publican las mismas cifras**, comprobado ejecutando las dos cadenas y
      comparando conjunto contra conjunto. Las únicas diferencias son de presentación y están
      declaradas: R etiqueta las filas de un `data.frame` y las columnas de una matriz (`[,1]`),
      pandas se imprime con `index=False`/`header=False`
- [x] Estructura verificada sobre el archivo publicado: 17 grupos, 34 paneles, R primero y activo en
      los 17, 17 paneles de Python con `hidden`, **0 `<pre>` fuera de pestañas**
- [x] Verificado en el navegador, recorriendo los 10 módulos: los **17 grupos conmutan** —panel
      correcto, `language-python` al pulsar Python, `aria-selected` actualizado en los dos botones y
      vuelta a R— incluidos los cinco que viven dentro de paneles de solución que arrancan ocultos.
      Consola limpia
- [ ] **Revisión de Javier antes de entrar en la redacción**

**El capítulo al cerrar el checkpoint:** 34 bloques (17 R + 17 Python) frente a los 18 del inicio
(14 + 4); 303 cifras verificadas frente a 155; 7 cajas de lectura guiada frente a 0; ningún bloque
de código fuera de pestañas.

- [x] **T6.7 — Ortografía y redacción, módulos 1–5.** Los módulos 4 y 5 no necesitaron ni una
      corrección; todo lo encontrado está en los módulos 1, 2 y 3. Siete cambios, ninguno cosmético:

      1. **`<code>−99</code>` usaba el signo menos tipográfico U+2212** en cuatro sitios (dos en la
         prosa del módulo 2, dos en el banco de preguntas), mientras el código real usa `-99` ASCII.
         Quien copiara ese texto a R obtenía un error de sintaxis. Normalizado **solo dentro de
         `<code>`**: en la prosa el U+2212 es la tipografía correcta y se queda (7 apariciones).
      2. **«por debajo» decía lo contrario de lo que dice el dato.** El aviso del marco completo
         afirmaba que la media de los 3 059 condados con dato válido, 308 582, queda «1 905 acres,
         un 0,6 %, por debajo». Está **por encima**: el bloque `R2` publica `diferencia_pct 0.6213`
         positivo. Reescrito sin ambigüedad de atribución.
      3. **«2,4 millones» donde el material dice 2,3 en los otros tres sitios.** El sondeo fueron
         2 266 566 papeletas. La cifra se le escapa a `--prosa` porque su expresión regular pide dos
         decimales o separador de miles, y «2,4» no tiene ninguno de los dos.
      4. Concordancia de género y coma que faltaba: «los 2 266 566 que devolvieron la papeleta de
         los 10 000 000 enviadas» → «las 2 266 566 papeletas devueltas de las 10 000 000 enviadas».
      5. `aria-label="El código de faltante -99"` → «El código del dato faltante -99».
      6. Una oración empezaba con cifra («4 500 es una muestra grande»), que la RAE desaconseja.
      7. «lo único que no es, es» → «lo único que no lo es, es».

      **No se tocó el espaciado antes de `%`.** La convención del material es un espacio normal, y es
      uniforme: 364 apariciones en los ocho capítulos y **cero** `&nbsp;`. Cambiarla en el capítulo 1
      habría creado la inconsistencia, no arreglado ninguna.

      Verificado: 303/303 cifras y 0 de prosa sin respaldo después de la pasada —ninguna corrección
      rozó una cifra de bloque—, y en el navegador los cinco módulos con KaTeX renderizando, ningún
      `$…$` sin resolver fuera de los bloques de código y la consola limpia.

      **Pendiente fuera de esta fase:** el capítulo 4 tiene el mismo defecto del U+2212 dentro de
      `<code>` (`ensamblado/modulos/cap4/modulos_4_6.html`, `<code>acres87 = −99</code>`). No se toca
      porque la fase 6 es del capítulo 1; va a la lista cuando se decida qué hacer con los otros
      siete.
- [x] **T6.8 — Ortografía y redacción, módulos 6–10.** Aquí lo que apareció no fue ortografía: fueron
      **defectos propios de T6.2 y T6.5**, y esta pasada es exactamente donde tenían que salir.

      **Cuatro de las siete cajas de lectura guiada repetían su entorno**, justo lo que la propia
      T6.2 se prohibió. Se midió con una comprobación de solapes de ocho palabras o más entre cada
      caja y el resto de su módulo, en vez de a ojo: `auditor-preguntas` repetía cinco tramos de la
      introducción de su simulador; `sesgo-varianza`, seis; `poblaciones`, el recorte del percentil
      99 (de la introducción) y las tres consecuencias de la asimetría (de la tarjeta de justo
      debajo); `no-respuesta`, la frase de las tasas por subgrupo (del aviso siguiente). Los cuatro
      pasajes se reescribieron para decir algo que el entorno no dice ya: la altura a la que se
      paran las barras **es** el sesgo en acres, y por tanto es comparable con lo que se estima; los
      defectos de redacción vienen en grupo y arreglar uno deja el ítem roto; un solo número no
      describe a `agpop`, y ese es el hueco por el que entra el capítulo 4; sin partir la población
      en clases no hay forma de saber si lo que falta se reparte parejo. Reverificado: **0 solapes**.

      **Dos desajustes que dejó T6.5.** El módulo 10 anunciaba que las cifras de las soluciones
      salen de `cadena.R`, cuando desde T6.5 cada solución trae también su pestaña de Python; ahora
      nombra las dos cadenas y dice que publican la misma cifra. Y el `post-estratificación` que se
      coló en la caja de `encuestas-intell` se alineó con el `postestratificación` que ya usaba el
      módulo 9 del propio capítulo.

      Correcciones de lengua propiamente dichas, tres: «libros cualquiera» → «libros cualesquiera»;
      un «también… también» en la misma oración; y el U+2212 del banco de preguntas, que se corrigió
      junto con los de T6.7.

      Verificado: 303/303 cifras y 0 de prosa sin respaldo, y en el navegador los módulos 6 a 10 sin
      ninguna fórmula sin renderizar, ningún `<code>` con menos tipográfico y la consola limpia.

      **Nota de coherencia para más adelante:** «postestratificación» aparece 11 veces sin guion y 10
      con guion **en el conjunto del material**. El capítulo 1 ya es coherente; unificar los ocho es
      una decisión aparte, del mismo lote que el U+2212 del capítulo 4.
- [x] **T6.9 — Reensamblado y verificación mecánica.** Los ocho ensambladores ejecutados: solo el
      capítulo 1 sale modificado, los otros siete **byte a byte idénticos**, que es la comprobación
      de que ninguna corrección se quedó en el archivo final en vez de en las fuentes.
      `verifica_bloques.py --todos --prosa`: los 8 capítulos en 0 discrepancias y **0 cifras de
      prosa sin respaldo**; el capítulo 1, en **303 de 303**. `mide_abstraccion.py`: 0 módulos abren
      formalizando. `cuenta_sitio.py`: cap. 1 con 17 bloques de R, 17 de Python, 154 líneas `#>`,
      7 cajas de lectura guiada. Permisos a 644.
- [x] **T6.10 — Auditoría independiente.** Un auditor que no escribió el material, con el encargo de
      buscar lo que se le escapa a las herramientas y de no aceptar este plan como verdad. Entregó
      **20 hallazgos**. Confirmó lo mecánico —303/303, las 17 parejas con las mismas cifras, el
      ensamblado byte a byte, las 7 cajas cerradas y en su sitio— y recalculó a mano una veintena de
      cifras del texto, todas correctas. Lo valioso es lo que encontró **fuera** del alcance de las
      herramientas. Verifiqué por mi cuenta los hallazgos de mayor peso antes de darlos por buenos.

      **G1 · El simulador `encuestas-intell` dibuja barras falsas en «Raza» e «Ingreso».**
      CONFIRMADO ejecutando. `reparto()` en `genera_cap1.R` une los niveles de las dos encuestas y
      rellena con **0** los ausentes, pero las dos codifican con vocabularios distintos:
      `Black`/`African American`, `Asian`/`Asian American`, `Hispanic`/`Hispanic American`,
      `Other`/`Another origin`, y `$40-$80k`/`$40-80k`. Resultado: **8 de los 9 niveles de raza
      tienen una serie en cero**, y en ingreso las dos mayores distancias (33,8 y 32,4 puntos) son
      íntegramente artefacto. El estudiante lee «la encuesta telefónica tiene 0 % de African
      American». El propio archivo ya razona en un comentario por qué un cero dibujado se lee como
      un dato («un cero dibujado se lee como “el censo dice 0 %”») y usa `null` para la serie del
      censo; ese razonamiento no se aplicó aquí. Es anterior a esta fase.

      **G2 · La caja de `encuestas-intell` manda mirar justo ahí, y afirma algo que el gráfico no
      dibuja.** CONFIRMADO: `pctTel` y `pctOnline` salen de `wt$tel_n / sum(wt$tel_n)`, conteos
      crudos, y `reparto()` usa `prop.table(table(...))`; **`postwt` no entra en ninguna vista**. La
      caja dice «ponderar no acercó las dos muestras… las acercó en las variables por las que se
      ponderó», que es cierto pero se demuestra en el bloque `R5`/`PR5`, no en ese gráfico. Y su
      «cambia a ingreso… la distancia sigue ahí» apunta al peor caso de G1. Defecto introducido en
      T6.2.

      **G3 · «2 266 566 papeletas devueltas» es incorrecto, y la pasada de redacción lo empeoró.**
      CONFIRMADO aritméticamente. 2 266 566 = 1 293 669 + 972 897 es el **subtotal de los dos
      candidatos**; la variable del precálculo se llama, literalmente, `digest_devueltas_dos`. Con
      ese total los porcentajes serían 57,1 y 42,9, no el «Landon 54 % · Roosevelt 41 %» que publica
      el propio módulo 1: el total devuelto compatible con esas cifras es ≈ 2 373 000. El capítulo
      llama «devueltas» a 2 266 566 en el módulo 2 —el que enseña a distinguir marco de muestra— y
      solo una vez usa la expresión correcta, «papeletas útiles». El precálculo arrastra la misma
      contradicción: `documental.devueltas = 2300000` junto a
      `tasaRespuesta = digest_devueltas_dos / 1e7`. **En T6.7 se cambió «2,4 millones» por «2,3»
      razonando desde 2 266 566: era el cambio equivocado, porque 2,4 era la cifra defendible.**

      **Otros hallazgos confirmados.** La caja de `digest` afirma que el punto negro «sigue encima
      de la curva» al recorrerla, y nada lo pega a ella (T6.2). `R9`/`PR9` usan `reg`, `N_h` y
      `mu_h`, definidos seis bloques y cuatro módulos antes en `R6`/`PR6`: quien copie ese bloque
      suelto obtiene `object 'N_h' not found`, justo el defecto que se corrigió en `P4` y se dejó en
      el caso peor. Los `#>` de `PS2` y `PS4` quedaron separados de su sentencia por un comentario
      de prosa, rompiendo la convención que sus gemelos de R sí respetan. Las cajas de
      `no-respuesta` y `n-grande-no-salva` siguen repitiendo su introducción pese a la pasada de
      T6.8 —la comprobación de solapes de ocho palabras no los vio porque están reformulados—. La
      autoevaluación promete cubrir «los nueve módulos» y no tiene ni una pregunta de los módulos
      3, 5 y 8.

      **Un hallazgo que NO se sostiene.** El auditor da por errónea la referencia «postestratificación
      … capítulos 7 y 8» porque contó cero apariciones en esos capítulos. Contando **las dos
      grafías**, el capítulo 7 tiene 2 y el 8 tiene 7: el término sí aparece, escrito con guion.
      El auditor cayó en la misma inconsistencia de guion que esta fase dejó anotada en T6.8. La
      referencia es imprecisa —el módulo titulado «Postestratificación» está en el capítulo 4— pero
      no falsa.

      **El auditor no abrió el capítulo en un navegador**, y lo declara: sus hallazgos sobre «qué se
      ve» los dedujo leyendo `simuladores.js`. G1, G2 y los de la caja de `digest` conviene
      confirmarlos visualmente en T6.11.
- [ ] **T6.11 — Pasada de navegador.** Pendiente; se retoma en otra sesión. Lo que hay que
      comprobar, sobre `sitio/muestreo/capitulo-1-encuestas-sesgos.html` y recorriendo los diez
      módulos: consola sin errores, KaTeX renderizado, los 17 grupos de pestañas conmutando, las 7
      cajas abriendo y cerrando, los 7 simuladores respondiendo **en valores extremos** de sus
      controles, los gráficos destruyéndose al cambiar de módulo, y el conjunto de selectores CSS
      contra la plantilla (una clase inventada no da error: da un componente sin estilo).

      **Cuatro trampas del entorno, ya pagadas en las tareas anteriores.** Anotadas para no volver a
      tropezar con ellas:

      1. El material se sirve por HTTP, no por `file://`: con `file://` la página se abre como
         instantánea estática y el JavaScript no corre, así que no hay módulos. Hay un
         `.claude/launch.json` en la raíz (nombre `raiz`, puerto 8767) que levanta
         `python3 -m http.server`. Está fuera de la lista blanca del `.gitignore`, así que no
         ensucia el repositorio.
      2. **Si la pane del navegador está oculta, el documento mide 0 de ancho.** Las capturas salen
         en blanco y `getBoundingClientRect()` devuelve geometría disparatada, porque cada línea se
         parte. Lo que NO depende de la anchura —margen calculado, estado `open`, número de nodos
         `.katex`, etiqueta del elemento, conmutación de pestañas— sí es fiable. Para medir alturas
         reales, clonar el elemento dentro de un contenedor absoluto de **812 px**, que es la
         anchura real de la columna de contenido.
      3. El contenedor del módulo visible es **`#content-area`**, no `#mainContent`.
      4. Buscar `$…$` sin renderizar sobre `textContent` da **falsos positivos**: R usa `$` para
         acceder a columnas (`agpop$acres92`), así que los bloques de código disparan la búsqueda.
         Hay que recorrer los nodos de texto excluyendo `.katex`, `pre`, `code` y `script`.

### Checkpoint 6 — Cierre de la fase 6
- [ ] Informe de auditoría escrito aquí
- [ ] README y tabla de volumen actualizados con lo que cuenta `cuenta_sitio.py`
- [ ] Revisión de Javier
- [ ] Publicación solo con su visto bueno

**Riesgos de esta fase.**

| Riesgo | Impacto | Mitigación |
|---|---|---|
| El CSS nuevo en la plantilla rompe la reproducción byte a byte de los caps. 2–8 | **Alto** | El retropropagador toca plantilla y publicados; T6.1 no cerró hasta que los ocho salieron idénticos — **ya superado** |
| Un bloque Python publica cifra distinta de su gemelo R | **Alto** | `anota_salidas.py` escribe la salida real; comparación par a par; donde el redondeo difiera, nota didáctica, nunca maquillaje |
| Una corrección de estilo cambia una cifra o el sentido de una definición | **Alto** | Ninguna cifra se edita en la pasada de redacción; `--prosa` como red |
| Un bloque nuevo pisa una variable de la cadena (`r`, `p`, `mu`) | Medio | Ejecución encadenada real, nunca el bloque suelto — **ocurrió en T6.3 con `mu`; resuelto y documentado en el propio bloque** |
| `anota_salidas.py` corrompe las cadenas de anotación intercalada, y `verifica_bloques.py` no lo ve | **Alto** | **Resuelto en T6.3.** Reparte la salida por sentencia, así que respeta los dos estilos, y aborta sin escribir cuando no puede colocarla. Eran **7 de las 16 cadenas**, no los caps. 1 y 2. Regresión: `precalculo/pruebas/prueba_anotador.py` |
| Las cajas regalan la conclusión y matan el trabajo del estudiante | Medio | Cerradas por defecto; el auditor revisa este punto explícitamente |

---

### T6.7 — Corrección del 67,6 % del capítulo 1 y el punto ciego de `--prosa` (2026-08-19)

**La cifra.** El módulo 4 del capítulo 1 decía *«Sin pesos, las dos encuestas se llevan 5,9 puntos
(61,6 % frente a 67,6 %)»*. El 67,6 % está mal. Verificado ejecutando con el Rscript del framework
4.4 sobre `intellonline.csv`: `int` toma valores 1..5 sin faltantes (185, 479, 145, 18, 156), las
categorías de acuerdo suman 185 + 479 = **664 de 983 = 0,67548321 → 67,5 %**. El precálculo ya lo
tenía bien: `cap1_datos.json` guarda `intell.agree.online.sinPesos = 67.54832146`. Era un error de
transcripción a la prosa, no de cálculo. Las otras tres cifras del párrafo son correctas: 61,64309
→ 61,6; 64,76449 → 64,8; 65,62910 → 65,6. La diferencia no cambia (67,548 − 61,643 = 5,905 → 5,9
puntos), así que el argumento del párrafo se mantiene intacto.

Corregido en la fuente, `ensamblado/modulos/cap1/modulos_4_6.html:161`, y reensamblado con
`ensambla_cap1.py`. El publicado sale **byte a byte idéntico salvo esa línea** (`diff` de una sola
línea, 4198). Aparición única: no está en ningún otro punto del capítulo ni en `cifras_prosa.json`.

**Por qué `--prosa` no lo vio — el hallazgo importante.** No es que `casa()` lo aceptara: es que la
cifra **nunca llegó a la comprobación**. `CIFRA_PROSA_RE` (`verifica_bloques.py:158`) exige
`\d+,\d{2,}` — **dos o más decimales**— para dar por «cifra con contenido» a un número decimal. El
párrafo entero (5,9 · 61,6 · 67,6 · 0,9 · 64,8 · 65,6) devuelve **cero coincidencias**. Y un decimal
es justamente como el material escribe los porcentajes en prosa.

El diagnóstico se cierra en los dos sentidos: si el regex la hubiera visto, `casa(67,6; dec = 1)`
habría dado **False** contra el universo del capítulo (|67,548 − 67,6| = 0,052 > tol = 0,050) y la
habría reportado. El único filtro que falló fue el de extracción.

**Tamaño del punto ciego, medido sobre los ocho capítulos publicados:** admitiendo un solo decimal
aparecen **126 cifras de prosa invisibles hoy**, de las cuales **47 no casan con nada del universo**
y necesitarían revisión humana (cap. 1: 8 · cap. 2: 9 · cap. 3: 4 · cap. 4: 8 · cap. 5: 1 · cap. 6:
4 · cap. 7: 2 · cap. 8: 11). La mayoría se ven legítimas —cocientes derivados, cifras en otra
unidad, «2,3 millones»— pero eso es exactamente lo que decide la lista blanca, no el silencio.

**Por qué el `{2,}` estaba ahí y qué costaría quitarlo.** Con un decimal entra ruido de LaTeX: los
conjuntos `$\{1,2,3\}$` y `$\{4,5\}$` de los caps. 2 y 4 producen «1,2» y «4,5» (3 de los 47). Y la
potencia del detector baja: con tolerancia 0,05 y universos de 500–4 400 números, la fracción de
valores arbitrarios que casan por casualidad sube del **1–4 % (dos decimales) al 8–27 % (uno)**. Es
decir, a un decimal el control deja pasar entre el 8 % y el 27 % de los errores, frente al 0 % de
detección de hoy, que es lo que hay ahora mismo.

**Cerrado en T6.8**, que admite el decimal, tría las cifras y corrige lo que estaba mal.

**Estado del verificador tras la corrección:** `verifica_bloques.py --todos --prosa` en verde —
2 183 de 2 183 cifras de bloque y 365 cifras de prosa respaldadas, 0 sin respaldo, 0 bloques con
discrepancias—. Sin publicar a gh-pages: pendiente del visto bueno de Javier.

---

### T6.8 — Cerrar el punto ciego de un decimal, y lo que apareció al abrirlo (2026-08-19)

**Lo que se cambió en el verificador.** Dos líneas de `verifica_bloques.py`:

- `CIFRA_PROSA_RE` admite ahora `\d+,\d+` en vez de `\d+,\d{2,}`. Con eso entran al control las
  cifras de un decimal, que es como el material escribe los porcentajes en prosa.
- `CONJUNTO_LATEX_RE` vacía los `$\{1,2,3\}$` antes de buscar. Al admitir un decimal, los conjuntos
  de índices de los caps. 2 y 4 se leían como los decimales «1,2» y «4,5». Repasadas las catorce
  apariciones de `\{...\}` en los ocho capítulos: todas son conjuntos, ninguna encierra un resultado.

**El triaje.** Las 44 cifras que quedaron sin respaldo se revisaron **una por una, ejecutando**
contra los JSON del precálculo y las salidas de los bloques. **43 eran correctas** y están en
`cifras_prosa.json` con la cuenta que las justifica —de `22 000/100 300 = 21,934 %` a
`(55,13374 - 113,6238)/113,6238 = -51,477 %`—. La línea base pasa de 45 a 89 entradas, y el
capítulo 5 estrena sección.

**El error que escondían.** El capítulo 2 citaba **«2,4 millones de respuestas»** del *Literary
Digest*, que son 2 266 566 → **2,3 millones**, como dice el capítulo 1. Y no estaba en un sitio:
estaba en **tres**, uno de ellos dentro de un simulador.

| Dónde | Qué decía |
|---|---|
| `modulos/cap1/modulos_1_3.html:332` | «Una muestra de 2,4 millones de personas…» |
| `modulos/cap2/modulos_9_10.html:272` | «…el *Literary Digest* y sus 2,4 millones de respuestas» |
| `modulos/cap2/simuladores.js:552` | «…el capítulo 1 lo vio con los 2,4 millones del *Literary Digest*» |

El del capítulo 1 es el caso de libro del **falso negativo por coincidencia**: el verificador sí
miraba ese «2,4» —está en un `<p>`— y lo dio por bueno porque algún número del universo del
capítulo cae a menos de 0,05 de 2,4. Con un decimal y universos de 500 a 4 400 números eso pasa
entre el 8 % y el 27 % de las veces. El control de un decimal reduce el agujero, no lo cierra: la
consistencia entre capítulos sigue siendo trabajo humano.

**Segundo punto ciego, medido y NO cerrado.** `cifras_de_prosa()` borra todo `<script>` antes de
mirar. Los enunciados, las opciones y la retroalimentación de los simuladores —texto que el
estudiante lee igual que un párrafo— nunca se han verificado: **168 cifras**, de las cuales **20**
no las respalda ni el universo ni la lista blanca. Ahí vive el tercer «2,4 millones».
**Cerrado en T6.9**, que además encontró que la medida real era mayor: 37 cifras, no 20.

**Tercer hallazgo, revertido.** Al reensamblar salió que **cuatro capítulos (3, 4, 7 y 8) no son
reproducibles byte a byte** desde sus fuentes: las cadenas ejecutables llevan el espacio final de
línea que R escribe y el publicado lo tiene recortado. Es puramente cosmético —va dentro de `<pre>`,
al final de la línea— así que los cuatro se devolvieron a HEAD para no ensuciar el diff. Los caps.
5 y 6 salen idénticos. Sí se corrigió `codigo/cap2/cadena.R`, donde el `#>` del bloque de `pi_kl`
tenía un espacio de más **respecto a la salida real de R** (comprobado ejecutándolo): ahí el
publicado tenía razón y la cadena no.

**Regresión.** `precalculo/pruebas/prueba_prosa.py`, 8 pruebas. La primera es la frase entera que
se coló. Comprobado que **falla 3 de 8 contra el verificador de antes** y pasa 8 de 8 contra el de
ahora; sin eso la prueba no guardaría nada.

**Estado:** `verifica_bloques.py --todos --prosa` en verde — 2 183 de 2 183 cifras de bloque y
**486 cifras de prosa** respaldadas (antes 365), 0 sin respaldo. Sin publicar a gh-pages: pendiente
del visto bueno de Javier.

---

### T6.9 — El texto de los simuladores entra al control (2026-08-19)

**El agujero.** `cifras_de_prosa()` empezaba borrando el `<script>` entero. Dentro viven los
enunciados de las preguntas, las opciones, la retroalimentación y los rótulos de los gráficos:
texto que el estudiante lee exactamente igual que un párrafo, y del que **nadie había contrastado
una sola cifra**. Por ahí se publicaron dos de los tres «2,4 millones» de T6.8.

**Cómo se cerró.** `textos_de_simuladores()` saca **todos** los literales de cadena del `<script>`
—`'…'`, `"…"` y plantillas con acento grave— y los mete en la misma tubería que los párrafos.

La decisión de diseño que importa: se cogen **todos** los literales, no una lista de campos
(`retro`, `pista`, `pregunta`…). Una lista se queda corta en cuanto alguien añade un campo nuevo, y
ese fallo es **silencioso**, que es justo el modo de fallo que este verificador existe para evitar.
El precio es el ruido, y medido resultó ser mínimo: de 12 773 literales, los únicos que traen algo
con forma de cifra española sin serlo son los colores CSS (`rgb(255,102,0)`). Tres normalizadores
nuevos lo dejan limpio:

| | Qué neutraliza | Por qué |
|---|---|---|
| `COLOR_CSS_RE` | `rgb(…)`, `rgba(…)`, `hsl(…)` | «255,102» no es un decimal |
| `PARTICION_RE` | `{1}{2,3}{4}` con llaves desnudas | es un conjunto; `{2,3}` no es 2,3 |
| `INTERPOLACION_RE` | `${…}` de las plantillas | lo calcula el navegador, no hay cifra literal |

`PARTICION_RE` obligó a **reordenar `normaliza_latex()`**: la coma decimal de LaTeX (`92{,}65`) tiene
que resolverse ANTES, o el `{,}` se lo lleva el filtro de particiones y queda «92 65». Y no se
pueden borrar todas las llaves: `\underbrace{27 \times 2,50}` encierra una cifra que sí hay que
contrastar. Además, los escapes del JS se deshacen antes de normalizar, o el `\\,` del espacio fino
de LaTeX no llega y «306 677» se parte en dos.

**Guarda contra el fallo silencioso**, igual que en `extrae()`: si un capítulo trae `<script>` y no
sale de él ni una cadena, el verificador **aborta** en vez de dar el capítulo por bueno.

**El triaje.** Aparecieron **37 cifras** —no las 20 que estimó T6.8, porque aquella medida usaba una
lista de seis campos y el extractor real cubre todos—. Revisadas una por una ejecutando: **36 eran
correctas**, y una era un error real.

> El capítulo 1 decía que la mayor desviación de la telefónica en una celda era de **29,7** puntos.
> Es **29,6**: `max |pctTel - pctCenso|` = 47,7693 - 18,1277 = **29,6416**. La del panel, 13,6314 →
> 13,6, sí estaba bien. Corregido en `modulos/cap1/simuladores.js:741`.

**Categoría nueva en la línea base: las cifras equivocadas a propósito.** Las preguntas citan
valores falsos por diseño —el distractor «la calibración corrigió el 39,9 % del sesgo», el «si te
dio 2,7, dividiste al revés», el «si respondiste 5 405, aplicaste $n-1$»—. Son correctas *como
texto* y jamás casarán con el universo, así que van a `cifras_prosa.json` con la justificación
diciendo explícitamente que lo son. Conviene no perder eso de vista al revisar la lista: una entrada
que dice «valor equivocado de un distractor» no es una cifra sin comprobar, es una comprobada.

**Estado:** `verifica_bloques.py --todos --prosa` en verde — 2 183 de 2 183 cifras de bloque y
**612 cifras de prosa** respaldadas, 0 sin respaldo. La línea base tiene 143 entradas (45 antes de
T6.8). `precalculo/pruebas/prueba_prosa.py` pasa **15 de 15**, y las 5 nuevas fallan contra el
verificador de antes de esta tarea. Sin publicar a gh-pages: pendiente del visto bueno de Javier.

**Lo que sigue fuera de control.** Los capítulos 3, 7 y 8 no son reproducibles byte a byte
(espacio final de línea en las cadenas; ver T6.8). **Cerrado en T6.11**, junto con el 4. Y el verificador compara cada cifra contra
el universo de **su propio capítulo**: una cifra que sea coherente ahí pero contradiga a otro
capítulo —como el «2,4 millones» frente al «2,3» del capítulo 1— sigue pasando.

---

### T6.10 — Las dos cifras flojas que destapó la revisión (2026-08-19)

De las 81 entradas nuevas de la línea base, dos eran ciertas pero flojas, y Javier pidió apretarlas.
Las dos vivían en simuladores, así que llevan reensamblado.

**`24 000` → `24 500` (cap. 1, árbol del error).** La frase dice: «con $n = 300$ sobre `agpop`, el
error estándar de la media es de unos 24 000 acres; con $n = 1\,200$ se parte por la mitad». Lo que
decide la cifra es la segunda mitad: **partirse por la mitad solo es cierto sin fpc**. Sin fpc,
$S/\sqrt{300} = 24\,519$ y $S/\sqrt{1200} = 12\,260$, la mitad exacta. Con fpc serían 23 294 y 9 576,
razón 2,43 — y la frase sería falsa. Así que la lectura correcta es la de 24 519, y el redondeo
honesto es **24 500**, no 24 000.

**`60 000` → `114 000` (cap. 4, módulo 3).** Decía «con Neyman el promedio bruto esperado sube más de
60 000 acres». Es cierto como cota, pero se queda muy corto: el simulador que la frase comenta
calcula `bruto = Σ n_h ȳ_h / n` y muestra `sesgo = bruto − media poblacional`, que bajo Neyman vale
**420 650 − 306 677 = 113 973 acres**. Ahora la frase dice el número que el estudiante ve en pantalla.

**Efecto colateral, aceptado a propósito.** Reensamblar el capítulo 4 arrastró las dos líneas de
espacio final de T6.8 (`#> region` en dos bloques). No se revirtieron: la alternativa era dejar el
publicado distinto de lo que produce `ensambla_cap4.py`, que es la deriva misma. **El capítulo 4 es
ahora reproducible byte a byte** —reensamblarlo es idempotente, comprobado—. Quedan los caps. 3, 7
y 8, que se cierran en T6.11; allí el capítulo 4 recupera además esas dos líneas recortadas, porque
el arreglo va por el otro lado: se le quita el espacio a la cadena, no se le añade al publicado.

---

### T6.11 — Los ocho capítulos vuelven a salir de sus fuentes (2026-08-19)

**La deriva.** R rellena por la derecha —los vectores con nombre y las matrices salen con espacios
al final— y `anota_salidas.py` prefijaba esas líneas con `#> ` **tal cual**, así que el espacio
acababa en la cadena y de ahí en el HTML. En algún momento algo lo recortó en los publicados (un
editor al guardar, casi seguro) y desde entonces cuatro capítulos ya no salían de sus fuentes.
Eran **126 líneas**: cap. 3 (22), cap. 4 (2, en la cadena de Python), cap. 7 (40) y cap. 8 (62).

Invisible por partida doble: dentro de un `<pre>` el espacio final no se ve, y `verifica_bloques.py`
da verde porque compara **cifras**, no espacios. Solo aparece al reensamblar y mirar el `diff` —que
es como salió, en T6.8—.

**El arreglo, en el generador y no a mano.** `anota_salidas.py` escribe ahora
`("#> " + l).rstrip()`. Recortar solo las cadenas no habría servido: la siguiente pasada del
anotador habría vuelto a meter el espacio. Con la herramienta arreglada, se recortaron además las
126 líneas que ya estaban escritas.

**Comprobado:** los ocho `ensambla_capN.py` son **idempotentes** —se ejecutaron dos veces seguidas y
los ocho ficheros salen `cmp`-idénticos— y los capítulos 3, 5, 6, 7 y 8 reproducen **byte a byte**
lo que hay en HEAD. Los caps. 1, 2 y 4 difieren solo en las siete correcciones de T6.7–T6.10, ni una
línea más. El capítulo 4 pierde con esto las dos líneas de espacio final que T6.10 había aceptado:
ahora su diff es únicamente el `114 000`.

**Regresión.** `precalculo/pruebas/prueba_cadenas.py`, 3 pruebas: que la herramienta no escribe
espacio final, que ninguna cadena lo tiene, y que el glob encuentra las cadenas —sin esa tercera, un
glob roto dejaría pasar la segunda sin comprobar nada—. Comprobado que **falla 2 de 3 contra el
estado de HEAD**.

**Estado:** `verifica_bloques.py --todos --prosa` en verde, 2 183 cifras de bloque y 612 de prosa.
`prueba_prosa.py` 15 de 15 y `prueba_cadenas.py` 3 de 3. Sin publicar a gh-pages: pendiente del
visto bueno de Javier.

**Lo que queda abierto del bloque T6.7–T6.11.** Solo una cosa: el verificador compara cada cifra
contra el universo de **su propio capítulo**, así que una cifra coherente ahí pero que contradiga a
otro capítulo sigue pasando. Es lo que dejó vivo el «2,4 millones» del cap. 2 teniendo el cap. 1 un
«2,3» a tres párrafos. Los tres errores de este bloque salieron leyendo, no ejecutando.

---

### T7.1 — Sen–Yates–Grundy: de dónde sale, cómo se lee y qué cambia (2026-08-21)

**Lo que había.** Una caja `.definition` de siete líneas en el módulo 3 del capítulo 2: la fórmula,
la palabra «tamaño fijo» como hipótesis suelta y una frase de interpretación. Javier lo señaló al
leerlo: *«no es claro de dónde proviene la fórmula ni cómo se interpreta y qué impacto tiene»*. Las
tres cosas eran ciertas.

**Lo que hay ahora**, en el mismo módulo y en este orden:

1. **De dónde sale.** Una caja `.formula` con la identidad de la que cuelga todo — a tamaño fijo
   cada fila de $\Delta$ suma cero —, derivada en dos líneas de $\sum_{l \neq k}\pi_{kl} =
   (n-1)\pi_k$, que ya estaba comprobada en el módulo 2. Se lee como **ley de conservación**: los
   puestos del acompañante son $n-1$ y no hay más, así que las unidades compiten por entrar. Detrás,
   una `.derivacion` de cuatro pasos que va de la forma SYG a la varianza (ese sentido es más
   corto). Usa dos cosas y solo dos: que $\Delta$ es simétrica y que sus filas suman cero; el paso 3
   marca dónde entra el tamaño fijo y ningún otro lo necesita.
2. **Cómo se interpreta.** La definición trae ahora **las dos formas**: el doble sumatorio con el
   $-\tfrac12$, y la suma sobre pares $k<l$ —sin medio y sin signo— con `\underbrace` separando el
   factor que pone el diseño, $\pi_k\pi_l - \pi_{kl}$, del que pone la población,
   $(y_k/\pi_k - y_l/\pi_l)^2$. Dos párrafos leen un factor cada uno, incluido el caso de aporte
   negativo y el límite $\pi_k \propto y_k$ que da varianza cero.
3. **Qué impacto tiene.** Las **dos palancas de diseño**, con las cifras de los cinco condados:
   estratificar mueve el primer factor (los pares $\{1,5\}$ y $\{2,5\}$ se llevan el **58,8 %** de
   la varianza del MAS y el estratificado los anula, pagando el encarecimiento de los pares de
   dentro del estrato: $2\,253{,}75 \to 891$); las probabilidades desiguales mueven el segundo
   (el rango de los $y_k/\pi_k$ cae de $110$ a $62{,}38$ y con él la columna entera:
   $2\,253{,}75 \to 670{,}34$). Son los capítulos 4 y 6 explicados con la misma fórmula.
4. **Cuándo miente.** Una `.warning` con el contraejemplo ejecutado: diseño Bernoulli con
   $\pi_k = 0{,}4$, donde $\Delta_{kl} = 0$ fuera de la diagonal, la expresión SYG devuelve **cero**
   y la varianza real es **8 553**. No da error: da un número, y está mal.
5. **El estimador, y el software.** Una `.note` al final del módulo con $\hat{V}_{SYG}$, la
   condición $\pi_{kl} \leq \pi_k\pi_l$ que impide que salga negativo —cosa que el estimador HT no
   garantiza— y la opción `svydesign(..., pps = ..., variance = "YG")` de `survey` 4.5, que pide
   justamente ese estimador. Enlaza con el capítulo 6.

**Piezas nuevas.** Simulador `syg-pares` (tabla de los diez pares con sus dos factores y su
porcentaje de $V$, gráfico de aportes con el par caro en naranja, y gráfico de los valores
expandidos con la línea $t/n$ = el ideal $\pi_k \propto y_k$); bloques `R6B`, `R6C` y `P3B` en las
cadenas ejecutables. El simulador **no calcula nada nuevo**: reordena `pi_k` y `pi_kl` de
`DATOS_CAP2` en la suma sobre pares, así que `genera_cap2.R` no se tocó. La duración declarada del
módulo 3 pasa de 20 a 30 min.

**El error que apareció al verificar en el navegador.** El JSON trae `pi_kl` redondeado a ocho
decimales, así que el $\Delta_{kl}$ de un par entre estratos —cero exacto— llega como $-5\cdot
10^{-9}$: la tabla pintaba «−0,00» y el conteo de pares que no aportan decía «0 de 10» en un diseño
que tiene seis. Corregido con tolerancia `1e-6`, documentada en el propio simulador; el menor freno
real de los tres diseños es 0,054, mil veces mayor. Es la misma clase de trampa que el README de
`precalculo/` ya tenía anotada para los cuantiles.

**Verificación.** `verifica_bloques.py` sobre el capítulo 2: **495 de 495** cifras `#>` contra
salida real y **109 cifras de prosa respaldadas, 0 sin respaldo**. `anota_salidas.py --check` pasa
en las dos cadenas. `node --check` sobre el motor. Reensamblado byte a byte idéntico (regla de oro):
las correcciones están en las fuentes, no solo en el publicado. En el navegador: 0 errores de
consola, 0 `.katex-error`, ningún `$…$` sin procesar, los tres diseños del simulador reproducen
exactamente la tabla de R, y ninguna caja nueva desborda más que las que ya había en el capítulo.

**Sin publicar a `gh-pages`: pendiente del visto bueno de Javier.**

**Queda abierto.** No se añadió al glosario `marco-pi` la fila de $\Delta_{kl}$: haría falta
confirmar contra los libros cómo la escriben Lohr y Gutiérrez, y no se hizo. Es una línea cuando se
tengan los dos textos delante.

---

### T7.2 — La fila de $\Delta_{kl}$ en el glosario, y el $\pi_{ij}$ que no era (2026-08-21)

**Lo pedido.** Añadir al glosario `marco-pi` del capítulo 2 la fila de $\Delta_{kl}$, que T7.1 dejó
fuera por no tener los libros verificados delante.

**Cómo se verificó, esta vez sí.** Contra las fuentes, no de memoria:

- **Lohr.** El EPUB del repositorio (`_OceanofPDF.com_Sampling_-_Lohr_Sharon_L.epub`, ISBN
  9780367279509, © 2022 — la **3.ª ed.**, la que cita la bibliografía del curso) da texto limpio,
  a diferencia del PDF, que es un escaneo de otra edición con la numeración corrida. Su ecuación
  (6.20) escribe la varianza HT con $\pi_{ik} - \pi_i\pi_k$ **escrito entero, sin símbolo**, y la
  (6.21) da la forma SYG como $\tfrac{1}{2}\sum\sum(\pi_i\pi_k - \pi_{ik})(\cdot)^2$: signo fuera y
  factores al revés. Su lista de símbolos del frontmatter **no tiene ninguna entrada** $\Delta$.
- **Gutiérrez.** El libro en línea (`psirusteam.github.io/EstrategiasDeMuestreo`, caps. 4 y 6)
  define $\Delta_{kl} = \pi_{kl} - \pi_k\pi_l$ con $\Delta_{kk} = \pi_k(1-\pi_k)$, escribe la SYG
  como $-\tfrac{1}{2}\sum\sum_U \Delta_{kl}(\cdot)^2$ y su estimador como
  $-\tfrac{1}{2}\sum\sum_S \tfrac{\Delta_{kl}}{\pi_{kl}}(\cdot)^2$ — las tres, letra por letra, las
  del material—, y enuncia la condición $\Delta_{kl} < 0\ \forall k \neq l$ «para que la estimación
  de la varianza no sea negativa», que es la que afirma la nota del módulo 3.

**Lo que se escribió.** Una fila, *Covarianza de los indicadores*: aquí
$\Delta_{kl} = \pi_{kl} - \pi_k\pi_l$, Lohr $\pi_{ik} - \pi_i\pi_k$, Gutiérrez $\Delta_{kl}$, en R
«—». Va justo después de $\pi_{kl}$. Y la `nota` del glosario avisa del cambio de signo, que es
donde de verdad tropieza quien compara el capítulo con el libro.

**El hallazgo colateral.** El glosario decía que Lohr escribe $\pi_{ij}$. No es lo que registra su
propia lista de símbolos, que da $\pi_{ik}$; en el cuerpo del capítulo 6 aparece 80 veces frente a
6 de $\pi_{ij}$, y esas 6 están todas en enunciados de ejercicios. Corregido a $\pi_{ik}$ **en los
capítulos 2 y 6**, que llevaban la misma fila: arreglar solo el 2 habría dejado los dos capítulos
contradiciéndose. Es la primera vez que la tabla de notación se contrasta contra la fuente en lugar
de contra la nota de investigación
(`ObsidianVault/research/research-marco-pi-lohr-gutierrez.md`); **los otros seis glosarios no se han
revisado así** y conviene hacerlo.

**Verificación.** `verifica_bloques.py --prosa`: cap. 2 495/495 y 109 de prosa, cap. 6 315/315 y 53
de prosa, 0 sin respaldo en ambos. `node --check` en los dos motores. Los **ocho** capítulos vuelven
a salir byte a byte idénticos de sus ensambladores. En el navegador, la fila y la nota renderizan
sin `.katex-error` y la tabla mide lo mismo con la fila nueva que sin ella (774 px en escritorio,
sin desbordar en móvil).

**Punto ciego, anotado.** El «6.21» de la nota es un número de ecuación y `--prosa` no lo captura
(su expresión de cifras no lo ve), así que ninguna herramienta lo protege: se verificó a mano contra
el EPUB y **depende de la edición** —el PDF escaneado numera esa misma fórmula como 6.13—, por eso
la nota dice «de la 3.ª ed.».

**Sin publicar a `gh-pages`: pendiente del visto bueno de Javier.**

---

### T7.3 — Auditoría de los seis glosarios restantes contra las fuentes (2026-08-22)

T7.2 encontró que la tabla de notación se había escrito de memoria. Esta tarea la contrasta entera:
**73 filas, ~150 celdas** de los capítulos 1, 3, 4, 5, 7 y 8.

**Corpus.** Se armó uno buscable de las dos fuentes, en `scratchpad/`:

- **Lohr 3.ª ed.** desde el EPUB (ISBN 9780367279509), con el MathML linealizado y las caligráficas
  marcadas. Su **lista oficial de símbolos** del frontmatter es el árbitro: lo que no está ahí, no es
  notación suya. *El PDF del repositorio es la 2.ª edición* —tiene «Ratio and Regression» como
  capítulo 3, frente al 4 de la 3.ª— y por eso no sirve para citar numeración.
- **Gutiérrez**, los 15 capítulos de `psirusteam.github.io/EstrategiasDeMuestreo`, que traen LaTeX
  crudo en el HTML.

**27 celdas corregidas.** Las de fondo:

| Cap | Fila | Columna | Decía | Dice la fuente |
|---|---|---|---|---|
| 3 | Razón poblacional | Gutiérrez | $R$ | $B=t_y/t_z$ (§8.2) |
| 3 | Estimador de razón | Gutiérrez | $\hat R$ | $\hat B$, $\hat B_\pi$ |
| 3 | Estimador GREG | Lohr | «—» | $\hat t_{y\text{GREG}}$ (ec. 11.24) |
| 3 | Est. de regresión y GREG | Gutiérrez | dos símbolos | $\hat t_{y,greg}$ para los dos |
| 3 | Estimador de diferencia | Lohr | $\hat t_{yd}$ | $\hat{\bar y}_{\text{diff}}$ ($\hat t_{yd}$ es su total de **dominio**) |
| 3 | Factor de ajuste | Gutiérrez | $g_k$ | $g_{ks}$ |
| 5 | $\pi$ de dos etapas | Lohr | $\pi_{ij}$ | $\pi_{j\mid i}\pi_i$ (ec. 6.31) |
| 5 | Correlación intraclase | Gutiérrez | $\rho_y$ | $\rho$ |
| 7 | deff solo por pesos | Lohr | $\text{deff}_{Kish}$ | $1+CV_w^2$, «weighting design effect» (ec. 7.12, Kish **1992**) |
| 7 | Grados de libertad | Gutiérrez | $n_I-H$ | $N-H$ (§5.2.3) |
| 7 | Post-estratificación | Lohr | $w_i^{post}$ | $w_i^{*}$ |
| 8 | Tasa de respuesta | Lohr | $M_R/M$ | $N_R/N$ (usa $N_R$, nunca $M_R$) |

Las tres peores no eran símbolos mal escritos sino **discrepancias inventadas**: las filas de la
razón afirmaban que Gutiérrez usa $R$ donde escribe $B$, igual que Lohr y que el material. Una tabla
cuyo trabajo es evitar confusiones estaba fabricando una.

**Nueve celdas pasan a «—» porque el libro no trata el concepto**, y eso también es información:
Gutiérrez no desarrolla no respuesta ni imputación con notación propia (sus $\delta_k$ y $q_k$ son
las dummy de post-estrato y las ponderaciones de calibración, otra cosa), no cubre el jackknife
—cero apariciones en los 15 capítulos— y no usa $n_{eff}$. **Ninguno de los dos libros da fórmula
para las reglas de Rubin**: esa notación es del material. La nota del capítulo 8 lo dice ahora en vez
de dejar los guiones sin explicar.

**Un fallo de renderizado que ningún verificador podía ver.** Tres celdas mezclaban texto y `$…$`
(`'estrato $h$'`, `'psu $i$'`, `'ssu $j$'`). El componente envuelve todo en `$…$`, así que salía
`$estrato $h$$` y el estudiante leía literalmente **«estrato h$$»** en los capítulos 4 y 5. KaTeX
no protesta —deja los `$$` como texto—, así que `--prosa` y `node --check` daban verde. Reescritas
como `\text{estrato } h`. **Regla nueva: en el glosario, las celdas van en LaTeX puro; el texto va
dentro de `\text{}`, nunca con `$` a mano.**

**Verificación.** Los ocho capítulos: `--prosa` sin discrepancias (2 355 cifras de código y 621 de
prosa), `node --check` limpio, y los ocho vuelven a salir byte a byte idénticos de sus ensambladores.
En el navegador, los ocho glosarios sin `.katex-error` y sin un solo `$` suelto.

**Sin publicar a `gh-pages`: pendiente del visto bueno de Javier.**

---

---

### T7.4 — El quinto tipo de pregunta: respuesta abierta (2026-08-23)

Sale de una necesidad del Taller 1 y se queda en el material. El simulacro del Parcial 1 (T4.1 del
`PLAN_Taller_Corte1.md`) necesita **cuatro preguntas abiertas**, porque el parcial se juega buena
parte de la nota en ellas y un simulacro de solo opción múltiple entrena la mitad del examen. El
motor entendía cuatro tipos: `opcion`, `multiple`, `numerica` y `grafico`.

**Qué NO hace: corregir texto libre.** No se puede, y fingirlo sería peor que no tenerlo. Lo que
hace es imponer el orden honesto, que es donde está el valor didáctico: el estudiante escribe su
respuesta —al menos 12 palabras, o el botón no revela nada— y **solo entonces** aparecen la
respuesta modelo y una lista de tres puntos concretos que se marca él. Marcar los tres cuenta como
acierto; con menos, la pregunta queda resuelta pero no acertada, y su módulo aparece en el resumen
de «qué repasar», que es exactamente donde tiene que aparecer.

**Un detalle que no es cosmético.** `cerrar()` encabezaba la retroalimentación con «Correcto» o
«No es esa». En una pregunta que corrige el propio estudiante, el motor no ha comprobado nada, así
que atribuirse ese juicio sería justo lo que el componente intenta evitar. Ahora dice «Los tres
puntos» o «Anotado».

**Por qué entra en los ocho capítulos si ninguno lo usa.** Por dos razones que no son de estilo:
cada `ensambla_capN.py` construye su capítulo **desde la plantilla**, así que en cuanto la
plantilla lo lleva, los ocho publicados dejan de reproducirse byte a byte si no lo llevan también;
y el protocolo de verificación compara el conjunto de selectores CSS de cada capítulo contra el de
la plantilla, y una clase que esté en una y no en los otros convierte esa comprobación en ruido.

**Piezas.** `ensamblado/componentes/quiz_texto.{css,js}` y `ensamblado/retropropaga_quiz_texto.py`,
que hace cinco inserciones sobre anclas comprobadas como **únicas en los nueve archivos**: el CSS,
la función del motor, la entrada de `NOMBRE_TIPO`, la rama en `renderAutoevaluacion` y el
encabezado de `cerrar()`. Es idempotente y aborta si un ancla no aparece exactamente una vez.

**Verificación.** Los ocho capítulos vuelven a salir **byte a byte** de sus ensambladores —se
comprobó dos veces, antes y después de reescribir un texto—; `node --check` limpio en los nueve;
`verifica_bloques.py --todos --prosa` en verde (2 355 cifras de bloque, 0 discrepancias, 0 cifras
de prosa sin respaldo) y las tres pruebas de regresión pasan. En el navegador, sobre la plantilla:
el guardia funciona —con la caja vacía o con seis palabras no revela nada y **no cuenta como
intento**—, con 28 palabras revela modelo y lista, marcar 2 de 3 deja el tercero en ámbar y el
marcador avanza, y reiniciar el quiz limpia la caja y vuelve a ocultar la modelo.

Además se montó el **banco real del simulacro** sobre el motor de la plantilla, sin esperar a que
exista la página: los 30 ítems se pintan, los cuatro abiertos funcionan, los tres gráficos traen
sus datos (16 clases el histograma, 97 + 3 intervalos la cobertura, 34 puntos cada curva de
márgenes), 47 expresiones de KaTeX renderizadas, 0 `.katex-error` y 0 errores de consola.

**Una trampa del entorno, otra vez.** La pane del navegador estaba oculta y el documento medía
**0 de ancho**: los canvas salen de 0 px y cualquier geometría directa miente. Se midió con el
truco ya anotado —clonar dentro de un contenedor absoluto de 812 px— y ahí la caja de texto ocupa
778 px, nada desborda y las tres clases nuevas dan sus colores. La primera lectura del punto en
ámbar salió con los colores base y **era un fallo de mi medición, no del CSS**: repetida sobre el
banco real, los dos puntos marcados salen verdes y el tercero ámbar, como debe.

**Sin publicar a `gh-pages`: pendiente del visto bueno de Javier.** Los ocho capítulos de `main`
llevan ahora este componente y los de `gh-pages` no; la diferencia es inerte —CSS y una función que
ningún capítulo llama— pero está ahí hasta que se publique.

---

### T7.5 — El universo de cifras del verificador incluye ahora `DATOS_TALLER1` (2026-08-23)

Una línea, pero desactivaba una comprobación entera. `verifica_bloques.py --prosa` contrasta cada
cifra que el estudiante lee contra el «universo» de números del capítulo: los de sus bloques de
código y los del JSON incrustado, que buscaba con `const DATOS_CAP\d+`. El recurso de práctica del
Taller 1 incrusta los suyos en `DATOS_TALLER1`, así que **todas las cifras de la retroalimentación
de su simulacro se habrían reportado sin respaldo** aunque salgan de un precálculo ejecutado —y el
informe con decenas de falsos positivos es indistinguible del informe que nadie mira—. La expresión
acepta ahora las dos formas. Los ocho capítulos siguen dando 0 cifras sin respaldo.

---

### T7.6 — El sitio publica una página que no es un capítulo (2026-08-23)

El recurso de práctica del Taller 1 —`sitio/muestreo/taller-1-preparacion-parcial-1.html`, seis
módulos y treinta preguntas— se ensambla desde la misma plantilla que los ocho capítulos, con
`ensamblado/ensambla_taller1.py`. Dos consecuencias para el material, y por eso está anotado aquí:

- **`cuenta_sitio.py` globaba solo `capitulo-*.html`.** Ahora incluye también `taller-*.html`, con
  su etiqueta propia. Sin eso, los totales del README volverían a ser cifras escritas a mano en
  cuanto el sitio publicara algo que no fuera un capítulo. El sitio son ahora **9 páginas: 94
  módulos, 118 preguntas, 224 bloques de código**.
- **El conjunto de selectores CSS de la página nueva es idéntico al de la plantilla, 198 contra
  198.** Es la comprobación del paso 5 del protocolo, y confirma que retropropagar el tipo `texto`
  a los ocho capítulos (T7.4) era necesario y no exceso de celo: si la plantilla hubiera quedado
  con clases que los capítulos no tienen, esta comparación habría dejado de servir para todos.

El plan operativo del recurso es `PLAN_Taller_Corte1.md`, donde está el informe completo (T4.3).

### T7.7 — La moneda del módulo 8 del cap. 2, que no era una moneda (2026-09-10)

Javier señaló que la entrada del módulo 8 del capítulo 2 —«Sobre los 3 078 condados, lanzar una
moneda con $\pi = 0{,}02$ para cada uno…»— no se entendía. Tenía razón, y el defecto es de los que
no protesta: todas las cifras estaban respaldadas y el capítulo pasaba el verificador en verde.

**Qué fallaba, que era la metáfora y no el dato.** Una moneda sale cara la mitad de las veces; decir
que se lanza «con $\pi = 0{,}02$» rompe la imagen justo donde el lector la necesita, y le deja la
tarea de reconciliar «moneda» con un 2 %. Encima el párrafo no decía **para qué** sirve la moneda
—que la decisión sea local: que no haga falta saber nada del resto de la lista—, ni **de dónde sale
el 61,6** —es $N\pi$, y sin esa multiplicación el número parece caído del cielo—, ni que 61,6 es un
tamaño que **ninguna muestra puede tener**, porque los condados entran enteros.

**Y una incoherencia interna.** El párrafo decía que «una realización cualquiera puede traer 50 o
75»; el simulador que está ocho líneas más abajo dice que los tamaños van **de 37 a 86** sobre cinco
mil réplicas. El texto de entrada estrechaba a ojo la variabilidad que el módulo entero existe para
enseñar. Ahora las dos cifras son las del simulador.

**Cómo quedó.** Tres párrafos donde había dos: el cupo que no se puede repartir sobre una lista que
todavía no existe · la moneda **cargada**, un lanzamiento por condado y cada uno ajeno a los demás ·
el tamaño que se cuenta al final, con $N\pi$ escrito, la desviación de 7,7 y el rango 37–86. El
cierre ahora nombra la moneda de cambio —las decisiones son **independientes**— que es justo lo que
la Definición 2.7 formaliza como $\Delta_{kl} = 0$ (era la 2.8 hasta la renumeración de T7.9) y lo que el párrafo siguiente usa para anular los
términos cruzados de la varianza. Antes el texto prometía «las cuentas más simples del capítulo» sin
decir a cambio de qué.

**Verificado.** Ni una cifra nueva escrita a mano: las cuatro que quedan en el texto —3 078, 0,02,
61,6 y 7,7— salen de `bernoulli.pi02` del `cap2_datos.json`, y 37 y 86 son los extremos de
`histTamano`, los mismos que ya citaba el simulador. `ensambla_cap2.py` reproduce el capítulo **byte
a byte** en la segunda pasada; `verifica_bloques.py --prosa` sigue en **495 de 495** cifras de
bloques y **109 respaldadas · 0 sin respaldo**, el mismo recuento que antes del cambio. En el
navegador, sobre HTTP: 27 fórmulas de KaTeX, **0 `.katex-error`** y consola limpia.

**Lo que este arreglo enseña sobre las herramientas.** `--prosa` comprueba que cada cifra tenga un
número detrás; no comprueba que la frase que la rodea se entienda. Una metáfora rota pasa todos los
controles del repositorio. Esta clase de defecto solo la encuentra alguien leyendo, y por eso la
revisión de contenido de Javier sigue siendo un checkpoint y no un trámite.

**Publicado el 2026-09-10** con el visto bueno de Javier: `main` en `51d0597`, `gh-pages` en
`436fbf2`. Comprobado sobre la página en vivo —no sobre el disco—: el texto viejo ya no está, el
rango 37–86 sí, 27 fórmulas de KaTeX, 0 `.katex-error` y consola limpia.

### T7.8 — El módulo 3 del cap. 3 juzgaba a la razón sin rivales en la sala (2026-09-10)

Javier señaló que el módulo 3 del capítulo 3 —«¿Cuándo gana la razón?»— pregunta y contesta por los
escenarios en los que la razón es mejor **sin haber mostrado antes las alternativas**. Es cierto y es
un defecto de orden, no de contenido: el capítulo construye la regresión en el módulo 6 y la
diferencia en el módulo 7, tres y cuatro módulos más tarde.

**Qué chirriaba, en concreto.**

- La caja «La razón conviene cuando…» daba tres condiciones y **ninguna salida**: el estudiante que
  contesta «no» a alguna se queda sin saber qué hacer.
- El simulador se titulaba «Recta por el origen frente a recta con intercepto» y traía un
  interruptor de **regresión** encendido por defecto: comparaba contra un estimador que el capítulo
  todavía no ha presentado, y otro (`y = x`, la diferencia) apagado y sin nombre.
- La caja de aviso decía que para los cerezos la razón es *mala* y ahí se detenía. La pregunta
  natural —«¿y entonces qué uso?»— quedaba sin respuesta hasta el módulo 12.
- La regla $r > \tfrac{1}{2}\,\text{CV}(x)/\text{CV}(y)$ estaba escrita sin decir **contra quién**
  se compara, que es la expansión.

**Cómo quedó.** El módulo abre ahora poniendo las **cuatro rectas sobre la mesa** en una tabla
—expansión (horizontal, no mira $x$), razón (por el origen), regresión (libre) y diferencia
(pendiente 1)— con una columna que dice dónde se construye cada una, para que el adelanto sea un
mapa y no un destripe: la tabla habla de la **forma de la recta**, no de fórmulas ni de varianzas,
que siguen viviendo en los módulos 2, 6 y 7. Detrás va una nota con el eje del capítulo entero
—*cada supuesto que se añade es un parámetro que ya no hay que estimar; uno cierto se cobra en
precisión, uno falso deja un estimador que apunta mal y cuyo error estándar no se entera*—, después
el mecanismo de la razón que ya estaba ($s_e$ frente a $s_y$, bloque R4) y, en lugar de la caja de
tres condiciones, una caja **«Cuál pide cada nube»** con las cuatro entradas y su condición. Se
añade una nota con la quinta salida, que no es un estimador: gastar la auxiliar en el **diseño**
—estratificar por $x$ (cap. 4) o PPT (cap. 6)— en vez de en la estimación. El aviso de los cerezos
termina ahora diciendo qué se usa en su lugar: la regresión del módulo 6, o cambiar la auxiliar por
$\text{diámetro}^2$; y de paso se corrige ahí «el volumen crece con el cubo del diámetro» por «con
el cuadrado del diámetro por la altura», que es lo que ya decían el módulo 12 y la retroalimentación
del quiz —el capítulo se contradecía a sí mismo en tres sitios—.

**El simulador, con la cuarta recta.** `nube-razon-regresion` tenía tres interruptores y ahora tiene
cuatro: se le añadió la **horizontal $y = \bar{y}$**, que es exactamente la recta que ajusta el
estimador de expansión. Es la que cierra el argumento visual: se ve que ignora la nube entera. La
lectura del simulador publica también $\bar{y}$, y el título pasa a «Las cuatro rectas sobre la
misma nube». El alto del lienzo sube de 290 a 330 px porque la leyenda tiene una entrada más.

**Verificado.** Ni una cifra nueva: las que cita el módulo —344 552, 31 657, 90,8 %, $-2\,548$,
$-36{,}9$, $R^2 = 0{,}935$— ya estaban y salen de los bloques R4, R5 y S2. `verifica_bloques.py
--prosa` sobre el capítulo: **151 de 151** cifras de bloques y **87 respaldadas · 0 sin respaldo**.
`ensambla_cap3.py` reproduce el archivo **byte a byte** en la segunda pasada (mismo SHA-256). En el
navegador: los doce módulos suman **274 fórmulas de KaTeX y 0 `.katex-error`**, la consola está
limpia, los cuatro interruptores encienden y apagan sus rectas, y al cambiar a `cherry` el gráfico y
la lectura pasan a $\hat{B} = 2{,}2773$, $b_0 = -36{,}943$, $b_1 = 5{,}0659$ y el veredicto «la
razón es adecuada: no».

**Lo que este arreglo enseña.** El verificador vigila las cifras y el ensamblador vigila la
estructura; **el orden de exposición no lo vigila nadie**. Un módulo puede estar en verde y aun así
pedirle al estudiante que compare contra algo que todavía no ha visto. Es el mismo tipo de defecto
que T7.7 —la metáfora rota de la moneda— y otra vez lo encontró Javier leyendo.

**Publicado el 2026-09-10** con el visto bueno de Javier: `main` en `4cc851f`, `gh-pages` en
`4d273b1`. Antes de publicar, `verifica_bloques.py --todos --prosa` sobre las nueve páginas: **0
cifras sin respaldo en total**. Comprobado sobre la página en vivo —no sobre el disco—: la tabla de
las cuatro rectas con sus 4 filas, el simulador titulado «Las cuatro rectas sobre la misma nube» con
sus **4 interruptores** y la serie de la expansión en $\bar{y} = 297\,897{,}05$, la caja «Cuál pide
cada nube», la quinta salida, «cuadrado del diámetro por la altura» donde antes decía «cubo», **274
fórmulas de KaTeX, 0 `.katex-error`** y consola limpia. El módulo 3 pasa de 18 a 22 min en
`courseData`.

---

> **Nota de numeración (2026-09-10).** T7.9, T7.10 y T7.11 se renumeraron este mismo día. Dos
> sesiones trabajaron en paralelo sobre el mismo árbol de trabajo y ninguna vio a la otra: las dos
> escribieron aquí y las dos usaron las etiquetas **T7.8 y T7.9**. Se conservó el orden del documento
> y se corrió la numeración hacia arriba; el T7.8 del capítulo 3 se quedó como estaba, así que sus
> referencias internas siguen siendo válidas. Los **mensajes de commit de esa tarde citan los números
> viejos** y no coinciden con estos encabezados.
>
> **Y la lección operativa, que es la que importa.** Un `git add -A` en un árbol compartido se lleva
> el trabajo de la otra sesión dentro del commit propio. Aquí pasó: `88c75b2` arrastró la nota de una
> tarea ajena, y el capítulo 1 entero se quedó sin commitear hasta `64fc6aa` porque su autor terminó
> después. Antes de commitear, mirar `git status` y no dar por hecho que todo lo modificado es de uno.

### T7.9 — Revisión del cap. 2 completo, y la primera parte de lo hallado (2026-09-10)

Javier pidió revisar los otros diez módulos del capítulo 2 buscando defectos de la misma familia que
el de la moneda (T7.7): los que **pasan todas las herramientas** y aun así confunden. Leídos los once
módulos y la autoevaluación entera, contrastada cada cifra contra `cap2_datos.json`. Salieron
**seis principales y tres menores**. Se arreglaron por partes: T7.9 los dos primeros, T7.10 los siete restantes.

**El inventario, para que la sesión que siga no tenga que volver a buscarlos.**

| # | Módulo | Qué pasa | Estado |
|:--:|:--:|---|:--:|
| 1 | 11 (quiz) | La pista de la pregunta 1 manda a la **definición 2.2**, que no existe | ✅ T7.9 |
| 2 | 9 | El intervalo del sistemático se llamaba $k$, y $k$ es el índice de unidad: $\pi_k = 1/k$ | ✅ T7.9 |
| 3 | 7 | «relajar el error a la mitad divide el tamaño por cuatro» sobre 1 506 / 595 / 174, cuyos factores son **2,53 y 3,42** | ✅ T7.10 |
| 4 | 3 | $27 \times 2{,}50 + 58 \times 1{,}82 = 67{,}5 + 105{,}5 = 172{,}95$ no cierra por ningún lado | ✅ T7.10 |
| 5 | 5 | «multiplicando por 3 078» da 916 926 966, no los 916 927 110 que anuncia | ✅ T7.10 |
| 6 | 11 | Promete «Diez preguntas» dos veces y la autoevaluación tiene **once** | ✅ T7.10 |
| m1 | 3 | «$\pi_3 = 0{,}40$ —sale en 4 de cada 10 muestras—»: contar muestras solo da $\pi$ si son equiprobables, y bajo el diseño C no lo son | ✅ T7.10 |
| m2 | 3 | Cita «el Bernoulli del módulo 8 —con probabilidad 0,4—» y el módulo 8 usa 0,02/0,05/0,10/0,20 | ✅ T7.10 |
| m3 | 4 | «el módulo anterior **terminó** con 172,95», que aparece al principio del 3 | ✅ T7.10 |

#### 1 · La definición 2.2 no existía, y la pista mandaba a buscarla

`git log -S` lo explica: en la **Fase 4.5** (`332b88b`) las antiguas «2.1 población y muestra» y
«2.2 diseño muestral» se fusionaron en la actual «2.1: población, muestra y diseño». La fusión no
renumeró el resto —el capítulo iba 2.1 → 2.3 → … → 2.10— y, peor, **dejó viva la pista** que citaba
la 2.2. El estudiante que falla la primera pregunta pide ayuda y la ayuda lo manda al vacío.

**Se renumeró todo** (2.3→2.2 … 2.10→2.9) en vez de solo arreglar la pista, porque el radio de
impacto resultó ser nulo: un `grep` sobre todo el repositorio —capítulos, taller, preparcial, bancos,
planes— encontró **una sola referencia por número en toda la prosa del material**, y era justo la
pista rota. Los encabezados llevan su título, así que reemplazarlos completos es inequívoco y no
depende del orden. Las secciones (2.5.1, 2.9.1…) numeran **módulos**, no definiciones, y no se
tocaron.

La pista apunta ahora a la **2.1**, que es la que define $p(s)$ —exactamente el objeto que la pista
pregunta—. Comprobado en el navegador fallando la pregunta a propósito: sale «Vuelve a la definición
2.1».

#### 2 · El intervalo del sistemático se llamaba como el índice de unidad

La Definición 2.9 (antes 2.10) importaba de Lohr la letra $k$ para el intervalo de salto, y este
material indexa unidades con $k$ en todos los capítulos. El choque no era estético; producía esto:

```
π_k = 1/k,    π_kl = 1/k  si k y l caen en el mismo arranque
```

donde el subíndice y el denominador son objetos distintos y $k$ cambia de significado a mitad de
frase. Lohr puede escribirlo así **porque indexa sus unidades con $i$**; aquí no.

El intervalo pasa a ser $a$ —la letra de Särndal, Swensson y Wretman, que es la notación que el
módulo 1 declara como la del curso— y se añadió una nota corta explicando el porqué, para quien
venga leyendo a Lohr en paralelo y se pregunte por la discrepancia. Se comprobó antes que la letra
$a$ estaba libre en todo el capítulo. Cambiado en los once sitios donde aparecía: la definición, el
bloque de $p(s_r)$ y las $\pi$, la caja de la varianza inestimable, la nota de conglomerados, los
dos textos de simulador, la fórmula de varios arranques ($a' = ma$), el ejercicio guiado 4 y el
enunciado de la pregunta 9 de la autoevaluación. Los $\pi_k$, $\pi_{kl}$, $y_k$ y $d_k$ no se
tocaron: ésos sí son índices de unidad.

**Verificado.** El capítulo vuelve a salir **byte a byte** en la segunda pasada; `verifica_bloques.py
--prosa` sigue en **495 de 495** cifras de bloques y **109 respaldadas · 0 sin respaldo**;
`extrae_items.py --corte1` sigue contando 81 ítems y `prueba_bancos.py --corte1` sale sin fallos
mecánicos. En el navegador: **45 fórmulas de KaTeX, 0 `.katex-error`**, consola limpia, y la pista
recorrida de verdad.

**Lo que esta tarea añade a lo que enseñaba T7.7.** El defecto no lo introdujo quien escribió el
módulo: lo introdujo una **refactorización incompleta** tres fases atrás. Fusionar dos definiciones
es una edición local; arreglar quien las citaba, no. Ninguna herramienta del repositorio cruza
referencias con destinos, así que una referencia rota no cuesta nada dejarla y no avisa nunca. Vale
la pena mirar si los otros siete capítulos tienen referencias por número —el cap. 2 era el único que
numeraba definiciones, así que probablemente no, pero eso hay que contarlo, no suponerlo.

---

### T7.10 — La segunda parte: las tres cadenas que no cerraban, y cuatro más (2026-09-10)

Los siete hallazgos que T7.9 dejó pendientes. Tres de ellos son **la misma enfermedad que la moneda
de T7.7**: una cuenta que se le pide seguir al estudiante y que no cierra. Ninguna la ve
`verifica_bloques.py`, porque cada cifra por separado sí tiene respaldo; lo que falla es el paso
entre ellas.

#### Las tres cadenas rotas

**Módulo 3 · $27 \times 2{,}50 + 58 \times 1{,}82 = 67{,}5 + 105{,}5 = 172{,}95$.** Ni un eslabón
aguanta: $58 \times 1{,}82 = 105{,}56$, y $67{,}5 + 105{,}5 = 173{,}0$. El 172,95 correcto sale de
dividir, no de multiplicar por los pesos redondeados. Peor: el mismo capítulo escribe **105,45** en
la caja de las dos palancas, o sea que la misma cantidad aparecía con dos valores a cuatro pantallas
de distancia. Ahora el display divide —$\frac{27}{0{,}40} + \frac{58}{0{,}55} = 67{,}50 + 105{,}45
= 172{,}95$, que cierra exacto— y una línea al pie dice por qué: los pesos son para pensar, la cuenta
se hace con las $\pi$.

**Módulo 5 · «multiplicando por 3 078».** $297\,897 \times 3\,078 = 916\,926\,966$, y el texto
anunciaba **916 927 110**. Aquí el texto *invitaba explícitamente* a multiplicar. La media pasa a
citarse como **297 897,05**, con lo que la multiplicación cierra, y se dice lo que cuesta redondear
antes: 144 acres.

**Módulo 7 · «relajar el error a la mitad divide el tamaño por cuatro».** Dicho justo después de dar
la serie **1 506 / 595 / 174**, cuyos factores reales son 2,53 y 3,42. La regla gobierna $n_0$, no el
$n$ corregido, y aquí la diferencia es enorme porque **1 506 es casi la mitad del marco**: pedir un
5 % de error obliga a visitar tanta población que deja de parecerse a una infinita. Se reescribió en
tres párrafos —la ley donde vale, el aviso de que la serie no la cumple, y el fpc como explicación—
y se corrigió también el texto del simulador, que repetía la misma afirmación.

**Y una restricción que forzó la redacción:** los $n_0$ del 5 % y del 20 % (2 946,7 y 184,2)
**no están en el universo de cifras** —`R12` solo calcula el caso del 10 %—, así que citarlos habría
metido dos cifras sin respaldo. El texto los describe sin nombrarlos («de 1 506 a 595 no hay ni un
factor tres») y cita solo el **736,67** que sí sale del bloque. Escribir «184» habría colado, porque
la expresión de prosa no mira enteros sueltos; usar ese agujero para meter una cifra a mano habría
sido justo lo que el verificador existe para impedir.

#### Los otros cuatro

- **Módulo 3 · contar muestras ya no da $\pi$.** «$\pi_3 = 0{,}40$ —sale en 4 de cada 10 muestras—»
  traslada al diseño C la receta que el módulo 2 enseñó para el MAS, y ahí solo funciona porque las
  diez son equiprobables. Se cambió por la lectura de frecuencia y se añadió un aviso con la prueba
  de que la diferencia importa: **el condado 1 también está en cuatro de las diez parejas y su
  $\pi_1$ es 0,325**, no 0,4.
- **Módulo 11 · prometía «Diez preguntas» y hay once** (el módulo 5 lleva dos). Dicho en el objetivo
  y en la caja del quiz. Corregido en los dos, y comprobado **contra el DOM**, no contra la fuente:
  la página renderiza 11 `.quiz-pregunta`.
- **Módulo 3 · el Bernoulli «del módulo 8 —con probabilidad 0,4—»**, y el módulo 8 usa 0,02, 0,05,
  0,10 y 0,20. El 0,4 es el de los cinco condados de juguete; ahora lo dice.
- **Módulo 4 · «el módulo anterior terminó con 172,95»**, que aparece al principio del módulo 3.
  Ahora «abrió».

**Verificado.** Byte a byte en la segunda pasada · **495 de 495** cifras de bloques · **108
respaldadas · 0 sin respaldo** —bajan de 109 porque la cifra que desapareció es el `105,5` que no
cuadraba— · `extrae_items.py --corte1` en 81 ítems · `prueba_bancos.py` sin fallos mecánicos ·
`prueba_barajado.py` 4 de 4. En el navegador, módulo a módulo: **0 `.katex-error`** en los cuatro
tocados (144, 51, 34 y 86 fórmulas), consola limpia, y el display del módulo 3 leído ya renderizado:
`t̂ = 27/0,40 + 58/0,55 = 67,50 + 105,45 = 172,95`.

**Lo que deja el capítulo entero.** De los nueve defectos, **cinco eran cadenas o recuentos**: una
cuenta que no cierra, una regla que su propia serie contradice, un «diez» que son once. Todos
sobrevivieron a un verificador que comprueba cifra por cifra, porque **ninguno es una cifra mal
calculada**: son el pegamento entre cifras correctas. No hay herramienta que los cace; solo alguien
que siga la cuenta con lápiz. Es el argumento más concreto que ha dado este proyecto a favor de que
la revisión de contenido siga siendo un checkpoint humano.

### T7.11 — Auditoría de orden del capítulo 1 (2026-09-10)

Después de T7.8, Javier pidió revisar si los demás capítulos tienen el mismo defecto de orden —juzgar
o comparar contra material que el lector todavía no ha visto—, empezando por el 1. Leídos los diez
módulos, los siete simuladores, las lecturas guiadas, las once preguntas y los cinco ejercicios.

**El capítulo 1 es, de hecho, el modelo de lo que faltaba en el 3.** Señaliza cada adelanto: «la
fórmula del sesgo de no respuesta —que se monta en el módulo 4 y se formaliza en el capítulo 8—», «el
módulo 7 lo cuantifica», «es el objeto que se construye en el capítulo 2». El quiz solo pregunta por
módulos ya vistos (1, 2, 4, 6, 7 y 9) y los cinco ejercicios guiados miran hacia atrás. Los módulos
1, 2, 3, 5, 6, 8 y 9 están limpios. Aparecieron tres huecos, y solo el primero es de verdad.

**1 · Los pesos y la calibración entraban sin presentarse (módulo 4).** Es el defecto de T7.8 en su
versión «herramienta». El módulo dice que las dos encuestas «se calibraron al censo de 2010 sobre
ocho celdas», enseguida «recuperar el censo desde los pesos», después una tabla titulada «la
estimación con y sin pesos» — y de ahí saca la conclusión central del módulo, que ponderar no arregla
el sesgo de selección. **El cuerpo del texto no decía en ningún punto qué es un peso.** La única
explicación vivía dentro del `<details>` de la lectura guiada —lectura opcional— y explicaba lo que un
peso *promete*, no lo que *es*. Tampoco se nombraba la alternativa. Ahora hay una caja
`.definition` antes del primer bloque —peso: a cuántas unidades de la población representa cada
unidad observada; calibrar: retocar esos pesos hasta reproducir totales conocidos; de dónde salen,
capítulo 2; cómo se calibran, capítulos 4 y 7— y la nota «Lee la tabla despacio» cierra con la salida
que sí funciona: una muestra probabilística, aunque sea pequeña, como referencia.

**2 · La varianza del MAS se usaba sin decir de dónde sale (módulo 7).** El módulo abre con «una
muestra aleatoria de 1 000 personas falla, típicamente, por 1,5» —cifra que el bloque R8 calcula
treinta líneas más abajo— y el paso 4 de la derivación escribe $V = (1-n/N)S^2/n$ sin puntero. Era el
único adelanto del capítulo sin señalizar. Añadidas las dos cláusulas.

**3 · $\pi_k$ en el enunciado del ejercicio 4 (módulo 10).** La tabla de notación del módulo 2 dice
explícitamente que las probabilidades de inclusión llegan en el capítulo 2, y el enunciado las pedía
por su símbolo; la solución sí lo señalizaba. Ahora el enunciado las nombra al usarlas.

**Y una observación de estructura, resuelta con un puntero y no moviendo módulos.** `agpop` se
presenta en el módulo 2, se usa en los simuladores del 4 y del 7 —los dos apoyados en lo asimétrica
que es— y su forma se estudia en el módulo 8, sin que el 2 lo anunciara. El módulo 2 dice ahora que
ahí se presenta «solo lo justo» y que la forma se mira en el 8, antes de elegir diseño.

**Verificado.** Ni una cifra nueva —las cuatro ediciones son prosa—. `verifica_bloques.py --prosa`
sobre el capítulo: **303 de 303** cifras de bloques y **69 respaldadas · 0 sin respaldo**.
`ensambla_cap1.py` reproduce el archivo **byte a byte** en la segunda pasada. En el navegador: los
diez módulos suman **125 fórmulas de KaTeX y 0 `.katex-error`**, la fórmula nueva del panel de
derivación renderiza, y la consola está limpia.

**Lo que enseña la auditoría.** El defecto de T7.8 tiene dos formas y conviene buscar las dos: *(a)*
comparar contra un rival que aún no se ha presentado —lo del capítulo 3— y *(b)* juzgar una
herramienta que aún no se ha explicado —lo del módulo 4 de este—. La segunda es más difícil de ver,
porque el texto suena fluido: usa la palabra con naturalidad y el lector supone que se la perdió.

**Publicado el 2026-09-11** con el visto bueno de Javier: el trabajo quedó asegurado en `64fc6aa` —la
sesión que lo hizo terminó sin commitearlo— y sale en `gh-pages` en `a60ef9a`. Comprobado sobre la
página en vivo y no sobre el disco: los diez módulos suman **125 fórmulas de KaTeX y 0
`.katex-error`**, la consola está limpia, y la caja de peso y calibración aparece **antes del primer
bloque de código** del módulo 4, que era el sentido del arreglo. El capítulo 2 no retrocedió con esta
publicación.

**La auditoría del capítulo 2** la pidió Javier el 2026-09-11: está en T7.13.

---

### T7.12 — Revisión del cap. 3, y la primera parte de lo hallado (2026-09-11)

Javier pidió pasar por el capítulo 3 la misma lectura que por el 2 (T7.9–T7.10): los defectos que
**pasan todas las herramientas** y aun así confunden. Leídos los doce módulos, la autoevaluación y los
cuatro ejercicios, con cada cifra contrastada contra `cap3_datos.json`. El orden del módulo 3 ya lo
había arreglado T7.8 y no se volvió a contar. Salieron **nueve principales y cinco menores**; se
arreglaron por partes: T7.12 los cuatro primeros y T7.14 el resto, más un décimo que apareció por el camino.

| # | Dónde | Qué pasa | Estado |
|:--:|:--:|---|:--:|
| 1 | quiz, mód. 4 | Marca como correcta «el sesgo es **unas mil veces** menor que el error estándar»; el módulo dice 182 y los datos, 182,4 | ✅ T7.12 |
| 2 | quiz, mód. 10 | La retro dice que la expansión es «el único de los cuatro» exactamente insesgado; la diferencia también lo es (mód. 7, ej. 4) | ✅ T7.12 |
| 3 | 4 | $B$ es sesgo y razón en la misma fórmula: $\text{ECM} = B^2 + V$ y $B(\hat t_r) \approx \ldots (B\,S_x^2 - S_{xy})/\bar x_U$ | ✅ T7.12 |
| 4 | 9 | «Los tres estimadores del capítulo son tres supuestos distintos sobre $v_k$, y nada más» | ✅ T7.12 |
| 5 | 3 | «en varianza es un factor de 110» tras dar 344 552 y 31 657, cuyo cociente al cuadrado es 118,5 | ✅ T7.14 |
| 6 | 8 | CV del 13 % «cuatro veces peor» que el global (6,34 %): son 2,04; 4,18 solo en varianza | ✅ T7.14 |
| 7 | 6 | «un condado con cero **granjas** en 1987»: la auxiliar es `acres87` | ✅ T7.14 |
| 8 | 2 y 4 | El EE de la razón con $n = 300$ vale 5,54 M y 7,11 M sin decir que uno es el estimado y otro el verdadero | ✅ T7.14 |
| 9 | 12 | «Once preguntas sobre los once módulos»: el 5 no tiene ninguna y el 10 tiene dos | ✅ T7.14 |
| 10 | 2 | La derivación del EE de la razón terminaba en una fórmula que da 5 344 567, y el capítulo publica 5 540 376 como si fueran «literalmente lo mismo» —hallado al arreglar el 5— | ✅ T7.14 |
| m1 | 11 / ej. 1 | «condados más grandes» frente a «más pequeños»: los dos ciertos —los cinco cuantiles sobrestiman y la media no—, sin reconciliar | ✅ T7.14 |
| m2 | 10 | «con una sola auxiliar, el factor $g$ es común»: solo en la razón; la regresión del mód. 6 tiene $g_k$ distintos | ✅ T7.14 |
| m3 | 5 | «todos… son sesgados», y el propio catálogo incluye la proporción y la media con $N$ conocido | ✅ T7.14 |
| m4 | ej. 1 | «un error estándar 68 veces menor en varianza»: 68 en varianza, 8,3 en error estándar | ✅ T7.14 |
| m5 | 2 | el 98,66 % de $t_x$ da 950 553 989, no 950 520 496 | ✅ T7.14 |

**Descartado tras comprobarlo.** La pista del ejercicio 3 manda a «la tabla del capítulo 1» a mirar
la desviación típica del Oeste. Parecía una referencia al vacío, pero la tabla existe: es la salida
por región de un bloque del capítulo 1, en R y en Python, con 835 639 y 79 365.

#### 1 y 2 · La autoevaluación contradecía al capítulo

La opción del módulo 4 pasa a «182 veces menor», la cifra del propio módulo. La retro del módulo 10
dice ahora que la expansión es exactamente insesgada **igual que la diferencia**, y que los que llevan
un sesgo pequeño son la razón y la regresión. Las dos se editaron en la fuente del banco y se
comprobaron en la página servida: la opción renderizada en el DOM y la retro en el HTML.

#### 3 · La $B$ del sesgo

El capítulo 1 escribe el sesgo como $B(\hat\theta)$, y el módulo 2 de este define $B = t_y/t_x$. En el
módulo 4 las dos convivían dentro de una fórmula: la $B$ de fuera era el sesgo y la de dentro, la
razón. Ahora el sesgo va como $\text{Sesgo}(\cdot)$ —en el ECM y en la aproximación de orden $1/n$—,
con una nota que explica por qué aquí no se puede usar la letra del capítulo 1. Solo había esos dos
usos; el glosario ya definía $B$ como la razón.

#### 4 · El módulo 9 contradecía su propia autoevaluación

La derivación sacaba razón ($v_k = x_k$), regresión **sin** intercepto ($v_k = 1$) y regresión con
intercepto, y concluía «tres supuestos distintos sobre $v_k$, y nada más». Pero la segunda no es
ningún estimador del capítulo, pasar a la tercera cambia la recta y no la dispersión, y la diferencia
no sale de ningún $v_k$. La pregunta de los $v_k$ del módulo 10 lo dice bien —la diferencia sale de
fijar $\beta = 1$ y la regresión de añadir intercepto—, así que el texto contradecía su propia
autoevaluación. Ahora el paso 3 se queda en la regresión sin intercepto, y un paso 4 nuevo explica
que el modelo $\xi$ tiene **dos palancas independientes** —qué recta y cómo crece la dispersión— y
que la razón es la única que necesita la segunda.

**Verificado.** Byte a byte en la segunda pasada · **151 de 151** cifras de bloques · **87
respaldadas · 0 sin respaldo** · `prueba_barajado.py` 4 de 4. En el navegador, sobre HTTP: **282
fórmulas de KaTeX y 0 `.katex-error`** en los doce módulos (274 antes; las ocho nuevas son las de la
nota y el paso 4), consola limpia, la autoevaluación con sus 11 preguntas.

**Dos fallos que no son de aquí.** `prueba_bancos.py` sobre **todos** los bancos —hasta ahora se
corría con `--corte1`— da dos fallos mecánicos, los dos en capítulos que esta tarea no toca:
`cap7[6]` (tolerancia 25 sobre una respuesta de 39, más del 50 %) y `cap8[9]` (un gráfico sin
`descripcionGrafico`, nada para quien no ve el canvas). Quedan anotados para cuando se revisen.

**Lo que confirma esta revisión.** Los dos defectos más graves estaban otra vez en la
autoevaluación, como la «definición 2.2» del capítulo 2: las preguntas se escriben aparte, se van
separando del texto y ninguna herramienta las contrasta con él, porque «mil» y «el único» no son
cifras con decimales. Y la $B$ es el segundo choque de notación en dos días, después de la $k$ del
sistemático: cuando un símbolo se importa de otro capítulo o de otro libro, nadie comprueba que esté
libre en el de destino.

### T7.13 — Auditoría de orden del capítulo 2 (2026-09-11)

Tras T7.11, Javier pidió seguir con el capítulo 2 y **parar ahí**. T7.9 y T7.10 ya lo habían revisado
buscando otra familia de defectos —cadenas que no cierran, referencias rotas—; esta pasada le aplica la
lente de orden: juzgar o comparar contra algo que el lector todavía no ha visto. Leídos los once
módulos, el quiz y los cuatro ejercicios, sobre las fuentes con los arreglos de T7.10 ya dentro.

**El capítulo 2 sale todavía mejor que el 1.** El módulo 1 hace exactamente lo que le faltaba al
módulo 3 del capítulo 3: pone los tres diseños A, B y C sobre la mesa desde el principio, «cada uno
germen de un capítulo posterior». HT y la expansión se comparan solo cuando los dos están presentados;
el módulo 4 nombra la inferencia basada en modelos y remite al 10; Hájek se define antes de enfrentarlo
con HT. Tres hallazgos.

**1 · El DEFF se usaba sin haberlo definido (módulo 9).** Toda la tesis del módulo —el sistemático
puede ser el mejor o el peor diseño según el orden de la lista— se argumentaba con valores de DEFF
(9,81; 4,74; 0,75; 0,073; 218,9), y el capítulo nunca decía qué es. Solo un inciso («diez veces peor
que un MAS del mismo tamaño») y una fila de notación sin definición. Lo arrastraban también el ejercicio
4 del módulo 11, la retro de la pregunta 9 y las lecturas de dos simuladores. Ahora hay una
**Definición 2.10: efecto de diseño (DEFF)** donde aparece por primera vez —el cociente frente al MAS
del mismo $n$, la lectura (menos de 1 gana, más de 1 pierde, un DEFF de 2 pide el doble de unidades) y
los punteros a los capítulos 4, 5 y 7—. Antes de numerarla se comprobó con `grep` que ninguna fuente
del repositorio citaba una «definición 2.10».

**2 · Los pesos se dibujaban en el módulo 2 y se presentaban en el 3.** El simulador `matriz-pikl`
trae un gráfico «Pesos $d_k = 1/\pi_k$» que su introducción no mencionaba, y la pregunta del quiz
asignada al módulo 2 pide «su peso de diseño $d_5$»: quien la fallaba era enviado por el resumen a
repasar un módulo que no lo explica. La introducción presenta ahora ese gráfico como adelanto del
módulo 3, con el nombre y la lectura del peso.

**3 · Un resto del cambio de letra de T7.9 (módulo 9).** T7.9 pasó el intervalo del sistemático de $k$
a $a$ «en los once sitios donde aparecía»; quedaba un duodécimo: «porque solo hay **$k$ muestras**»,
publicado. Corregido, en el mismo párrafo que abre la definición del DEFF.

**Queda para el capítulo 7, sin tocar porque Javier pidió parar en el 2:** su módulo 3 dice «el
efecto de diseño ya apareció en los capítulos 4 y 5». Ahora aparece —y se define— en el 2.

**Verificado.** Ni una cifra nueva: `verifica_bloques.py --prosa` sigue en **495 de 495** cifras de
bloques y **108 respaldadas · 0 sin respaldo**, el mismo recuento que dejó T7.10. `ensambla_cap2.py`
reproduce el archivo **byte a byte** en la segunda pasada. En el navegador: **569 fórmulas de KaTeX y 0
`.katex-error`** en los once módulos, la fórmula de la Definición 2.10 renderiza, el párrafo del
sistemático lleva ya $a$, la frase del peso de diseño sale en el módulo 2, los dos simuladores del
módulo 9 cargan y la consola está limpia.

**Convivencia.** Durante esta tarea otra sesión estuvo revisando el capítulo 3 (T7.12), con archivos
suyos sin commitear. No se tocaron: al commitear hay que añadir solo las dos fuentes del capítulo 2, su
HTML y este plan — nunca `git add -A`.

**Lo que enseña.** Dos cosas, y la segunda es un fallo propio. *(a)* Un renombrado se cierra con un
`grep` de la forma vieja, no contando los sitios que se cambiaron: «once sitios» era una cuenta a mano,
y el duodécimo sobrevivió un día publicado. *(b)* El hallazgo 5 de T7.12 —«en varianza es un factor de
110» tras dar 344 552 y 31 657, cuyo cociente al cuadrado es 118,5— está en una frase que T7.8
**conservó tal cual** al reescribir el módulo 3 del capítulo 3. Pasaba `--prosa` porque cada cifra tiene
respaldo; lo que no cierra es el paso entre ellas. Al reescribir un módulo, las frases que se dejan
intactas también hay que releerlas con lápiz, no solo las nuevas.

**Publicado el 2026-09-11** con el visto bueno de Javier: `main` en `887fb06`, `gh-pages` en `11fb05c`.
Con el mismo push salieron los dos arreglos del capítulo 3 que otra sesión había subido a `main` sin
publicar —`ca28df6` y `727e1a1`, los de T7.12 y T7.14—; Javier aprobó publicarlos juntos sabiendo que
viajaban. **No** salió `7e521dc` (T7.15), que llegó a `main` mientras se preparaba la publicación: la
guarda de antes del push lo detectó, y se publicó exactamente el árbol de `sitio/` en `887fb06` con
`git subtree split --prefix sitio 887fb06` y un `push` del commit resultante. Como el split es
determinista, el próximo `subtree push` desde `HEAD` sigue siendo un avance rápido y llevará `7e521dc`
cuando se apruebe. Comprobado sobre la página en vivo: los dos capítulos servidos son **byte a byte**
los de `887fb06` (`cmp`), la Definición 2.10 está, el «$k$ muestras» no, «182 veces menor» sale las dos
veces de `887fb06` y la frase nueva de `7e521dc` no aparece.

**Tres trampas de esta publicación, para la próxima.**

- *Publicar lo aprobado cuando `main` se ha movido.* `git subtree push` publica `sitio/` de `HEAD`, no
  lo que se revisó, y con varias sesiones en el mismo repositorio entre la aprobación y el push puede
  entrar un commit ajeno. La guarda es comparar `HEAD` con el commit aprobado justo antes de publicar.
  Si se movió: `git subtree split --prefix sitio <aprobado>`, comprobar que el árbol del resultado es
  `<aprobado>:sitio` y que `gh-pages` es su antecesor, y `git push origin <sha>:refs/heads/gh-pages`.
  Nunca un commit hecho a mano en `gh-pages`: rompería el `subtree push` siguiente.
- *El SHA del split llegó con un retorno de carro* al capturarlo con `$(…)`, y el primer push murió con
  `invalid refspec '.-pages'`, sin publicar nada. Se normaliza con `git rev-parse --verify <sha>^{commit}`.
- *En zsh, `echo "$pagina" | grep` miente.* El `echo` de zsh interpreta las barras invertidas y se corta
  en el primer `\c` del LaTeX (`\cdot`, `\check`), así que `grep` solo ve la cabecera y todo cuenta
  cero, también lo que ya estaba publicado antes. La comprobación en vivo se hace descargando a archivo,
  y la prueba fuerte es `cmp` contra `<commit>:sitio/…`.

---

### T7.14 — La segunda parte del cap. 3, y un décimo defecto debajo del quinto (2026-09-11)

> **Por qué T7.14 y no T7.13.** Mientras se hacía esta tarea, otra sesión escribió aquí su T7.13 —la
> auditoría de orden del capítulo 2— sin commitear. La comprobación que abre cada commit abortó al ver
> el plan modificado, en vez de pisarlo, y esta nota toma el número siguiente para no repetir el choque
> de T7.8 y T7.9.

Los cinco principales y los cinco menores que T7.12 dejó pendientes. Al preparar el del «factor de
110» apareció un décimo, y resultó ser su causa.

#### 10 · La derivación y el código calculaban dos cosas distintas

La derivación del error estándar de $\hat t_r$ (módulo 2) sustituye $t_x/\hat t_{x,\pi}$ por 1 en el paso
3 y termina en $\widehat V = N^2(1-f)\,s_e^2/n$, que con `agsrs` da **5 344 567**. El bloque R3 —y
`svyratio`— **conservan** ese factor al estimar, $(t_x/\hat t_{x,\pi})^2 N^2(1-f)\,s_e^2/n$, y dan
**5 540 376**, que es la cifra que publica todo el capítulo. La frase de después afirmaba que «la
fórmula de la derivación y lo que hace `svyratio` son literalmente lo mismo»: lo eran el bloque y
`svyratio`, no la derivación. El factor es $\bar x_U/\bar x = 1{,}0366$ —el $g$ del módulo 10—.

Ahora la derivación tiene un quinto paso con la forma que usa el código, y explica por qué lo que se
descartó para *derivar* se puede conservar al *estimar*: la muestra lo da. La frase de después dice
qué es exactamente lo que coincide.

#### 5 · El «factor de 110» era ese mismo factor

$(s_y/s_e)^2 = 118{,}46$ y $(\text{EE}_{\text{exp}}/\text{EE}_r)^2 = 110{,}23$, y el cociente entre los
dos es exactamente $(\bar x_U/\bar x)^2$. El texto elevaba al cuadrado las dos desviaciones y anunciaba
el número de los estimadores. Ahora dice «más de cien» para las desviaciones —el 118 no está en el
universo de cifras y no se escribe a mano— y aclara que entre los dos estimadores del total queda en
110 por el factor del módulo 2.

#### Los otros ocho

- **6 · Módulo 8.** «Cuatro veces peor» pasa a «el doble que el de la media global, y en varianza
  cuatro veces más»: 2,04 en CV, 4,18 en varianza.
- **7 · Módulo 6.** «Cero granjas en 1987» pasa a «sin un solo acre sembrado en 1987»: la auxiliar es
  `acres87`.
- **8 · Módulo 4.** Los 7,11 millones se presentan como el error estándar **verdadero** —el de las
  200 000 réplicas—, y un párrafo nuevo dice que los 5,54 del módulo 2 son su **estimación** con la
  sola muestra `agsrs`, que en esta muestra se queda corta en más de una quinta parte.
- **9 · Módulo 12.** «Once preguntas sobre diez de los once módulos». La alternativa —escribir una
  pregunta propia del módulo 5, el catálogo de razones— queda a decisión de Javier.
- **m1 · Módulo 11.** Se reconcilian media y mediana: el grueso de la muestra salió algo más arriba y
  por eso sus cuantiles sobrestiman, pero no le tocó ninguno de los condados más grandes del país
  —su máximo es 2 234 262 acres y el del censo, 7 229 585—, y por eso su media se queda por debajo.
- **m2 · Módulo 10.** El $g$ común vale solo para la razón; en la regresión del módulo 6, que calibra a
  $N$ y a $t_x$, cada unidad recibe su propio $g_k$.
- **m3 · Módulo 5.** «Todos… son sesgados» pasa a «los que de verdad son razones», y el catálogo queda
  como lo que es: la manera de separarlos de los que solo lo parecen.
- **m4 · Ejercicio 1.** «Un error estándar 68 veces menor en varianza» pasa a «una varianza 68 veces
  menor».
- **m5 · Módulo 2.** Se avisa de que la cuenta a mano con el 98,66 % redondeado sale unas decenas de
  miles de acres por encima, y de que el código usa $\hat B$ entero.

**Verificado.** Byte a byte en la segunda pasada · **151 de 151** cifras de bloques · **88
respaldadas · 0 sin respaldo** (una más que antes: el 1,0366 nuevo, que el verificador casa con el $g$
del precálculo). En el navegador, sobre HTTP: **293 fórmulas de KaTeX y 0 `.katex-error`**, la
derivación del módulo 2 con sus cinco pasos, los trece textos nuevos presentes y los nueve viejos
ausentes, y la consola limpia.

**Otra vez dos sesiones en el mismo árbol.** A las 11:38 otra sesión modificó el capítulo 2 —la
Definición 2.10 del efecto de diseño y el puntero al peso de diseño que describe su T7.13— y a las
11:40 escribió esa T7.13 aquí. Nada de eso entra en este commit. Para el capítulo 3 bastó con añadir
los archivos a mano; para el plan, que tenía los dos trabajos en el mismo archivo, la versión del
commit se construyó desde `HEAD` con solo los cambios de esta tarea y se cargó en el índice con
`git update-index`. La T7.13 ajena se queda en el árbol, sin commitear, para quien la escribió.

**Y una corrección a T7.9.** Aquella tarea dijo haber cambiado la $k$ del intervalo «en los once sitios
donde aparecía»; quedaba un duodécimo —«solo hay $k$ muestras», en el 2.9.1—, que encontró y corrigió
T7.13.

**Lo que deja el capítulo.** El defecto más hondo no estaba en la prosa sino en la frontera entre la
derivación y el código: el verificador comprueba que las cifras de la prosa salgan del código, pero no
que la fórmula que se enseña sea la que el código ejecuta. Aquí no lo era, y la prosa lo afirmaba.

**Publicado el 2026-09-11** junto con el capítulo 2 (ver T7.13), con el visto bueno de Javier:
`gh-pages` en `11fb05c`, que es exactamente `sitio/` de `887fb06` y lleva `ca28df6` y `727e1a1`.
T7.15 (`7e521dc`) quedó fuera y sigue sin publicar.

---

### T7.15 — `survey` sin presentar en el cap. 3: propósito y conclusiones del código del módulo 2 (2026-09-11)

Javier señaló que la primera ventana de código del módulo 3 del capítulo 3 «se siente fuera de lugar»:
usa `survey` sin que el capítulo lo haya contado. Validado, con un matiz y un problema más serio.

**El matiz.** `survey` no es nuevo: lo presenta el capítulo 2 en su módulo 5, con una frase. Lo que nunca
se había explicado son las piezas que usa el capítulo 3: `svyratio` no aparece en todo el capítulo 2,
`svytotal` solo dentro de la solución de un ejercicio del módulo 11, y el capítulo 3 las estrena en R2
(módulo 2) con un comentario de una línea y ninguna frase de prosa; `as.numeric(SE(obj)[1])` no lo
contaba nadie.

**El problema más serio, que queda abierto.** La ventana del módulo 3 no necesita `survey` para lo que el
texto pregunta —¿cuánto más pequeños son los residuos que los datos?—: esa respuesta son sus tres
primeras cifras. `survey` entra solo para `veces_mas_eficiente`, que ya compara los dos estimadores del
total y arrastra el factor $\bar x_U/\bar x$: por eso da **110,2327** y no el cuadrado de las dos
desviaciones que la misma ventana imprime. La pestaña Python, con la misma etiqueta, calcula ese
cuadrado y da **118,4578**; muestra además campos distintos, y su comentario («la reducción es
exactamente lo que se gana en error estándar») es falso por ese mismo factor: las desviaciones bajan
10,88 veces y el error estándar del total, 10,50. La ventana depende además de `exp_sv` y `ee_razon`
(R2) y de `s_e` (R3). El verificador no lo ve porque las dos cifras salen de verdad de la ejecución; no
comprueba que dos pestañas calculen lo mismo, y ese paralelismo solo se auditó en el capítulo 1.

**Lo decidido.** Se propusieron tres salidas: igualar las dos pestañas sin `survey` (1), sacar la ventana
del módulo 3 y llevar el cálculo al módulo 2 (2), o presentar `survey` en el módulo 2, que es donde
nace el problema (3). Javier eligió la **3**, pidiendo además aclarar el propósito del código y las
conclusiones que se sacan de ejecutarlo. **La ventana del módulo 3 no se tocó**: su desajuste entre
pestañas sigue pendiente de las opciones 1 o 2.

**Lo hecho, todo en el módulo 2.**

- **Antes de R2**, una nota «Qué hace el bloque de abajo, y con qué»: el propósito —el mismo total dos
  veces, sin y con la auxiliar— y una viñeta por pieza: `svydesign` (qué dicen `id = ~1` y `fpc`, de
  dónde salen la corrección y los pesos $N/n$, y que `dis` sirve para todo el capítulo), `svytotal` (el
  estimador de expansión), `svyratio` (la razón, no el total: el bloque multiplica a mano por $t_x$ porque
  el diseño no lo conoce) y `coef()`/`SE()`/`as.numeric()`. Cierra diciendo que la pestaña Python hace la
  parte de la razón sin funciones de encuestas.
- **Después de R2**, la nota que ya daba las cifras pasa a «Lo que dice la salida»: qué es cada uno de los
  cinco números y tres conclusiones —las dos estimaciones a los lados del total real, que solo se conoce
  porque `agpop` es un censo; el error estándar diez veces menor, que es la conclusión que sí se puede
  sacar con la muestra sola; y que la auxiliar no cambió ni un dato—.
- **Antes de R3**, su propósito: es la comprobación de la derivación, y si está bien las dos cifras tienen
  que salir iguales. **Después**, la conclusión práctica: `svyratio` no hace nada que no quepa en tres
  líneas; lo que aporta es no equivocarse con los pesos cuando el diseño deje de ser un MAS, desde el
  capítulo 4.

**Verificado.** Byte a byte en la segunda pasada · **151 de 151** cifras de bloques · **88 respaldadas ·
0 sin respaldo**. En el navegador, sobre HTTP: **300 fórmulas de KaTeX y 0 `.katex-error`**, la nota de
propósito antes de R2 y la de conclusiones después, sus 4 viñetas y sus 3 conclusiones, y la consola
limpia.

**Un aviso que dio el recuento, y que conviene conocer.** La primera versión de la nota de conclusiones
dejó fuera las cifras de los dos totales, y el recuento de cifras distintas de la prosa bajó de 88 a 87.
No es un fallo del verificador —la cifra que se pierde no puede estar sin respaldo—, pero el número de
cifras distintas funciona como alarma: si baja en una reescritura, algo concreto se ha ido del texto. Se
volvieron a poner, porque una conclusión sobre una salida tiene que citar lo que sale.

### T7.16 — Auditoría de orden del capítulo 4 (2026-09-12)

Javier pidió seguir con el capítulo 4, saltando el 3 —que llevan otras sesiones—. Leídos los doce
módulos, los ocho simuladores, las once preguntas y los cuatro ejercicios. **Seis hallazgos**: tres de
la lente de orden y tres de cifras que aparecieron de paso.

**1 · El deff se usaba desde el módulo 4 y se definía en el 8.** Es el defecto de T7.13, más marcado.
El módulo 4 compara asignaciones con «deff 0,74 contra 0,82»; el módulo 6 decide su pregunta central
—¿con qué variable estratificar?— con una tabla que **solo** tiene deff (0,54 / 0,82 / 0,99 / 1,00) y
un simulador cuyo eje vertical es el deff; el módulo 7 lo usa para la identidad ANOVA. Y el 8 lo
definía por fin abriendo con «conviene fijar ya esa vara de medir», como si fuera su estreno. Desde
T7.13 había además una segunda definición: el capítulo 2 ya lo define (Definición 2.10). Ahora el
módulo 4 presenta la vara en su primera aparición, con puntero a esa definición, y el módulo 8 deja de
fijarla para hacer lo suyo: medirla sobre las dos muestras reales y traducirla a entrevistas.

**2 · «El capítulo 10 enseña el plan B» (módulo 1).** No existe: el material tiene ocho capítulos y la
postestratificación es el **módulo 10 de este mismo capítulo**. Un `grep` sobre los ocho capítulos
confirma que era la única referencia a un capítulo inexistente en todo el material.

**3 · El puntero al simulador del capítulo 2 fallaba dos veces (módulo 2).** Mandaba «al simulador del
módulo 7 del capítulo 2», que es la calculadora de tamaño de muestra y no tiene selector de diseño; el
que lo tiene es `espacio-muestras`, del módulo 1. Y las seis muestras **no son las mismas**: este
capítulo enumera con $n_A = 2$ y $n_B = 1$ —lo confirma `genera_cap4.R`, $n = 3$—, mientras que el
diseño B del capítulo 2 toma una unidad por estrato, $n = 2$. Las dos versiones dan seis muestras, y
por eso el error era invisible. El texto lo dice ahora explícitamente en vez de mandar a ningún lado.

**4, 5 y 6 · Tres cifras de la familia de T7.10.** *(a)* «El reparto de Neyman la deja en **331**
millones»: la varianza real es **299,0** —su error estándar es 17 290,78 y su deff 0,551, cifras que el
propio capítulo publica dos módulos después—. *(b)* En la misma frase, «repartir en proporción al
tamaño **la baja** a 446» decía lo contrario de lo que pasa: 446 es más que los 402 que acababa de dar.
*(c)* El módulo 5 daba **303** y **~301** para la misma cantidad, a treinta líneas de distancia, y con
ellas «441 millones»; ninguna de las tres sale de `cadena.R` ni de `cap4_datos.json`. Se reescribió sin
inventar cifras: la comparación que queda es la que sí está calculada (18 916 frente a 21 124, con la
proporcional de $n = 300$, que cuesta casi el mismo presupuesto). *(d)* «Once preguntas sobre los once
módulos»: el módulo 1 no tiene ninguna y el 2 tiene dos.

**Por qué `--prosa` no ve ninguna de esas tres.** `CIFRA_PROSA_RE` solo mira cifras con separador de
miles o decimales; «402 millones», «331», «303» y «441» son enteros sueltos y pasan de largo. Es un
hueco real del verificador —las varianzas y los tamaños de muestra se escriben así en todo el
material—, y vale la pena decidir en otra tarea si se cierra (por ejemplo, mirando los enteros
seguidos de «millones» o de «entrevistas»).

**Y la trampa de T7.9, otra vez.** Tras cambiar los textos, el `grep` de control sobre el HTML
**publicado** —no sobre las fuentes que edité— encontró un **séptimo** sitio: la retroalimentación de
una pregunta del quiz repetía el «~301» inventado. Un arreglo se cierra con un `grep` de la forma
vieja, nunca con la cuenta de los sitios que uno tocó.

**Verificado.** `ensambla_cap4.py` reproduce el archivo **byte a byte** en la segunda pasada;
`verifica_bloques.py --prosa`: **246 de 246** cifras de bloques y **66 respaldadas · 0 sin respaldo**,
el mismo recuento que antes. En el navegador, los doce módulos suman **191 fórmulas de KaTeX y 0
`.katex-error`**, la consola está limpia y los seis textos nuevos se ven en su módulo.

**Pendiente:** el visto bueno de Javier para publicar. Sigue pendiente de T7.13 la frase del capítulo 7
(«el efecto de diseño ya apareció en los capítulos 4 y 5»), que ahora debería nombrar también al 2.

---

## Protocolo de verificación de cada capítulo

Es material que llega a estudiantes. Antes de dar un capítulo por terminado:

1. **Ejecutar todo el código**, R y Python, encadenado, y contrastar cada cifra de los comentarios
   `#>` con la salida real (`verifica_bloques.py`). No escribir cifras de memoria.
2. **Comprobar que cada bloque es autónomo o está encadenado de verdad**: un bloque que usa un
   objeto nunca definido falla en manos del estudiante aunque funcione en una sesión con variables
   ya cargadas.
3. **Doble vía para toda varianza**: la fórmula implementada a mano y `survey` deben coincidir. Si
   difieren, averiguar por qué y documentarlo como nota didáctica, no esconderlo.
4. **Abrir en el navegador**: consola sin errores, KaTeX renderiza, pestañas R/Python conmutan, cada
   simulador responde incluso en valores extremos, los gráficos se destruyen al cambiar de módulo.
5. **Comprobar el CSS, no solo el DOM**: comparar el conjunto de selectores contra la plantilla y
   medir la geometría real (`getBoundingClientRect`) entre elementos consecutivos de cada simulador.
   Una clase inventada no da error: da un componente sin estilo.
6. **Validar el JSON incrustado** y volver a leerlo después de cada regeneración.
7. **Auditoría explícita reportada**: qué se ejecutó, qué se comparó, qué se corrigió.

---

## Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| El marco π resulta demasiado abstracto para el nivel del curso | **Alto** — obligaría a rehacer 8 capítulos | Checkpoint 1 bloqueante tras el cap. 2, antes de producir nada más |
| Dos `Rscript` en el sistema: el del `PATH` (4.6, sin `survey`) y el del framework (4.4, con `survey`) | Alto | Ruta absoluta al Rscript 4.4 en todos los scripts y en el README de `precalculo/` |
| El código de los Rmd existentes no está verificado | Alto | Ejecutarlo íntegro antes de reutilizar nada; ya sabemos que las cifras a mano fallan la mitad de las veces |
| `π_kl` no tiene forma cerrada en varios diseños PPT | Medio | Usar aproximaciones documentadas (Hartley–Rao, Brewer) y decir explícitamente que son aproximaciones |
| Convivencia de notaciones Lohr ↔ Gutiérrez | Medio | Componente `.glosario-notacion` presente en todos los capítulos; una sola notación por fórmula, con la otra al lado |
| `LC_CTYPE = "C"` en R rompe las tildes del JSON | Medio | `Sys.setlocale("LC_CTYPE","en_US.UTF-8")` en `_comun.R`, heredado por todos los scripts |
| Capítulo 7 y 8 muy cargados (Lohr 7 y 8 son densos) | Medio | Si superan 12 módulos, partirlos; decisión en el Checkpoint 3 |
| Renombrar archivos rompería enlaces ya repartidos a estudiantes | Bajo | Decisión tomada: no renombrar |
| `TeachingSampling` no instala en R 4.4 | Bajo | Reconstruir `BigLucy` desde el repo del libro; los ejemplos de Gutiérrez son reproducibles sin el paquete |

---

## Estimación de volumen

| | Al empezar | Al cierre (fase 5) | Objetivo |
|---|---:|---:|---:|
| Capítulos en el formato nuevo | 0 | **8** ✅ | 8 |
| Módulos | 37 (formato viejo) | **88** ✅ | ~88 |
| Simuladores | 0 | **66** (+8 tablas-ranking) ✅ | ~59 |
| Preguntas de autoevaluación | 0 | **88** ✅ | ~64 |
| Ejercicios guiados | 0 | **33** ✅ | ~26 |
| Bloques de código verificados | 0 | **202** (2 355 cifras + 621 de prosa) | — |
| Semanas del cronograma cubiertas | 9 / 16 | **16 / 16** ✅ | 16 / 16 |

Los totales los cuenta `precalculo/cuenta_sitio.py` sobre los archivos publicados, no se escriben
a mano. Componentes: 8 glosarios, 2 árboles de error (caps. 1 y 8), 4 diagramas de diseño
(caps. 4–7), 2 ciclos (caps. 7 y 8) y 1 rúbrica (cap. 8).

Los simuladores que aparecen listados en cada capítulo son el núcleo mínimo; la cifra del
encabezado de cada capítulo (`~n S`) es el objetivo, y suele incluir alguno más de apoyo.

---

## Preguntas abiertas — RESUELTAS (2026-07-27)

- ~~**Nombres de archivo de los caps. 1 y 2.**~~ → **Se renombran.** Hecho; las URLs publicadas
  cambian. Ver «Estructura de archivos».
- ~~**`precalculo/` y `ensamblado/` dentro del repo publicado.**~~ → **Se replica el montaje de
  Series de Tiempo.** Hecho: raíz del repo en `Muestreo/`, sitio en `gh-pages` por subtree.
  Queda **pendiente el cambio manual de la fuente de Pages en GitHub**.
- ~~**Proyecto integrador: ¿enunciado completo con rúbrica?**~~ → **Sí.** Redactados el enunciado
  que reciben los estudiantes y la rúbrica analítica por criterios y niveles de desempeño, en
  `ObsidianVault/cursos/muestreo/muestreo-proyecto-integrador.md`. El módulo 8 del cap. 8 (taller
  de diseño de encuesta) es la preparación en clase de ese proyecto.

## Pendiente que no depende de este plan

- [x] ~~**Cambiar la fuente de GitHub Pages a `gh-pages` / `/`**~~ → hecho el 2026-07-28 por API con
      el token de `gh`, en `UnBosque_Teor`. El repositorio viejo `Muestreo-Un_Bosque_JMS` mantiene
      su Pages sirviendo solo redirecciones.
- [ ] Decidir si los 82 CSV de Lohr siguen versionados en el repositorio público. Están incluidos
      porque sin ellos los precálculos no son reproducibles, y **pesan 13 MB** —el grueso son
      `vius.csv` (7,8 MB), `ipums.csv` (1,9 MB) y `nhanes.csv` (1,0 MB)—. Git lo soporta sin
      problema (el `.git` comprimido queda en ~4 MB) y solo `vius.csv` no lo usa ningún capítulo
      del plan. Para excluir la carpeta entera basta quitar la línea
      `!/CSV data sets for SDA 3e/` del `.gitignore`; para excluir solo el pesado, añadir
      `CSV data sets for SDA 3e/vius.csv`.
