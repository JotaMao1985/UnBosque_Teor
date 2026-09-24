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

**Publicado el 2026-09-12** junto con el capítulo 4 (ver T7.16), con el visto bueno de Javier:
`gh-pages` en `48d2af3`, que es exactamente `sitio/` de `d88246d`.

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

**Publicado el 2026-09-12** con el visto bueno de Javier: `main` en `d88246d`, `gh-pages` en
`48d2af3`. El push arrastró `7e521dc` (T7.15) —el tercer arreglo del capítulo 3, que llevaba un día en
`main` sin publicar—, y Javier lo aprobó sabiéndolo: esta vez no se podía separar como en T7.13, porque
el trabajo del capítulo 4 va **encima** de él en la historia. Comprobado sobre la página en vivo: los
capítulos 3 y 4 servidos son **byte a byte** los de `d88246d` (`cmp` contra `HEAD:sitio`), y en el 4
están la Definición 2.10 citada, el «módulo 10 de este capítulo» y los 299 millones de Neyman, sin
rastro del «~301». El primer intento de comprobación pilló el build de Pages todavía en `building`, que
es el estado normal durante el primer medio minuto; se repitió hasta que el `cmp` cuadró.

**Pendiente:** sigue sin hacerse la frase del capítulo 7 que apuntó T7.13 —«el efecto de diseño ya
apareció en los capítulos 4 y 5»—, que ahora debería nombrar también al 2. **Hecha en T7.26.**

### T7.17 — Auditoría de orden del capítulo 5 (2026-09-12)

Leídos los once módulos, los ocho simuladores, las once preguntas y los cuatro ejercicios. **El
capítulo 5 señaliza bien**: el módulo 1 avisa de que la ICC llega en el 4, el 3 remite al 4 antes de
pedirle al lector que mueva $\rho$, el 5 se apoya en el estimador de razón del capítulo 3 y el 6 en el
99,2 % que el 7 desmenuza. El defecto de orden clásico no está. Cuatro hallazgos, y el segundo es el
que importa.

**1 · La frase que abre el capítulo mezclaba las dos escalas.** «Observar 371 condados en 6 estados
enteros produce un **error estándar treinta veces mayor —en varianza—**»: el deff es 30 en varianza, y
en error estándar son unas cinco veces y media. El propio módulo lo dice bien treinta líneas más abajo
(«varianza-a-varianza… valen lo que unas 12 de un MAS»); era el gancho el que estaba mal.

**2 · El código contradecía la notación del capítulo, en la letra que el capítulo declara como su
trampa.** El módulo 2 fija $N$ = conglomerados y $K = \sum M_i$ = unidades, con un aviso titulado «$N$
cambió de significado y no va a avisar». Y el primer bloque de código hacía `N <- nrow(agpop)` (3 078
condados) y `NI <- length(unique(agpop$state))` (50 estados): exactamente al revés. Peor: **la pestaña
de Python del mismo capítulo ya usaba la convención buena** (`N, n, M = 100, 5, 4`), así que las dos
pestañas se contradecían. Renombrado en `cadena.R` —`K` las unidades, `N` los conglomerados—, con un
comentario que lo dice, y las salidas publicadas no cambian una coma porque las etiquetas de los
`c(...)` son explícitas.

**3 · La MSW aparecía sin definir.** El módulo 4 introducía $R_a = 1 - \text{MSW}/S^2$ y del símbolo
solo decía «la variabilidad de dentro»; no estaba en el glosario. Ahora se define donde se usa: la SSW
del capítulo 4 (módulo 7) dividida entre sus grados de libertad, $K - N$ — que es justo lo que el
código enseña tras el renombrado.

**4 · Una opción que el lector no puede ver.** El módulo 9 remitía a «la opción `survey.lonely.psu` que
este material fija desde el capítulo 1»: cierto, pero vive en la cabecera de las cadenas, que no se
publica en ningún bloque. Ahora se dice de dónde sale.

**El fallo propio, que es la lección de la tarea.** Renombré a `K` **sin comprobar que la letra
estuviera libre** —justo el paso que T7.9 sí hizo antes de mover el intervalo del sistemático a la
`a`—. `K` ya estaba tomada: el bloque de `algebra` la redefine como sus 299 estudiantes, y el bloque
del módulo 9 la usaba 130 líneas después para los pesos de estrato. Resultado: una estimación de
3 423 299 donde el capítulo publica 332 542,6. **Lo cazó `verifica_bloques.py` en la primera pasada**,
que es exactamente para lo que existe. Se arregló calculando el peso con `nrow(agpop)` explícito, lo
que de paso elimina una dependencia a distancia entre bloques — algo que el protocolo ya pedía y que
nadie estaba comprobando.

**Verificado.** `ensambla_cap5.py` reproduce el archivo **byte a byte** en la segunda pasada;
`verifica_bloques.py --prosa`: **163 de 163** cifras de bloques y **55 respaldadas · 0 sin respaldo**,
los mismos recuentos que antes de tocar nada. En el navegador: **184 fórmulas de KaTeX y 0
`.katex-error`** en los once módulos, consola limpia, y los cuatro cambios visibles en su módulo.

**Comprobado y correcto, para que no se vuelva a mirar:** el 2,73 de la pregunta del módulo 4 frente al
2,72 del texto (son $\bar{M} = 24{,}92$ y $m = 25$; la tolerancia de 0,02 acepta las dos); «once
preguntas sobre los diez módulos», que aquí sí cuadra (once preguntas cubren los diez módulos, con dos
del módulo 1); los tres diseños de la tabla comparativa, los tres presentados; y las cuentas del
módulo 8 y del ejercicio 4 ($m^* = 9{,}5$, $n^* = 58$, castigo del 49 %).

**El trabajo quedó asegurado en `13fe782`** antes de escribir esta entrada, porque el primer intento de
anotarla falló: la cadena de Python del script llevaba formato y `\text{MSW}` se leyó como un hueco a
rellenar. El script escribe al final, así que el plan no se tocó; la lección es no usar cadenas con
formato para texto que lleva llaves de LaTeX.

**Publicado el 2026-09-12** con el visto bueno de Javier: `main` en `b233220`, `gh-pages` en
`4920e58`. Esta vez el push salió limpio —lo único pendiente en `sitio/` era el capítulo 5— y la guarda
previa confirmó que `main` seguía en el commit aprobado. Comprobado sobre la página en vivo: el
capítulo servido es **byte a byte** el de `b233220` (`cmp` contra `HEAD:sitio`), con el código
renombrado (`K <- nrow(agpop)`, sin rastro del `NI` viejo) y la MSW remitiendo a la SSW del capítulo 4.

**Pendiente:** sigue sin hacerse la frase del capítulo 7 que apuntó T7.13 —«el efecto de diseño ya
apareció en los capítulos 4 y 5»—, que ahora debería nombrar también al 2. **Hecha en T7.26.**

---

### T7.18 — Revisión del cap. 4: el deff medido en dos escalas, y cinco más (2026-09-12)

Javier pidió pasar por el capítulo 4 la misma lente que por el 2 y el 3. T7.16 lo había auditado esa
misma mañana y arreglado seis cosas; ésas no se recontaron. Leídos los doce módulos, la autoevaluación
y los cuatro ejercicios, con cada cifra contrastada. **Seis defectos**, arreglados de una vez a petición
de Javier —«arréglalos juntos»— porque los dos primeros son el mismo problema y separarlos dejaba la
contradicción a medias.

| # | Dónde | Qué pasa |
|:--:|:--:|---|
| 1 | 4, 6, 7 y 8 | El deff de estratificar por región vale **0,82** en tres módulos y **0,7512** en el 8, para el mismo diseño, sin reconciliar |
| 2 | tabla comparativa | Su pie mete el ee **estimado** de la postestratificación (17 513) en una tabla **exacta**, y con eso la coloca por delante del estratificado proporcional, que es imposible |
| 3 | 8 (bloque R10) | El comentario dice «300 / 0.75 = 400… Cien entrevistas gratis» y su propia salida imprime **399** |
| 4 | 5 | «El simulador de la portada del material» no existe: la portada no tiene simuladores |
| 5 | ej. 2 | El reparto proporcional suma **401** entrevistas y Neyman 400, y el texto los compara «con el mismo presupuesto» |
| 6 | 6 | «Casi duplica la ganancia de la región»: la multiplica por **2,6** |

#### 1 y 2 · Una vara, dos escalas

El capítulo mide el deff de dos maneras y nunca dice cuál está citando:

- **Exacta** (módulos 4, 6, 7 y la tabla): numerador y denominador salen de `agpop` entera. El MAS de
  300 tiene ahí un error estándar verdadero de **23 294**, y el estratificado proporcional, 21 124 →
  deff **0,8224**.
- **Estimada** (módulo 8): $16\,380^2 / 18\,898^2 =$ **0,7512**, con los dos números salidos de las dos
  muestras concretas.

La brecha está sobre todo en el denominador: `agsrs` estima el error estándar del MAS en 18 898 cuando
el verdadero es 23 294, casi un quinto por debajo, **porque no le tocó ninguno de los condados
gigantes** — exactamente el hecho que T7.14 documentó en el módulo 11 del capítulo 3. Ahora el módulo 8
lleva un aviso que nombra las dos escalas y dice cuál se cita para comparar diseños (con la exacta, las
300 entrevistas rinden como $300/0{,}8224 = 365$, no como 399), y el módulo 4 avisa de que sus deff son
exactos y de que el 8 obtendrá otro número.

**Y la mezcla invertía un orden.** La tabla comparativa declara en su descripción que sus varianzas son
exactas, y su pie metía la postestratificación con «su ee estimado con `agsrs` fue 17 513, entre la
proporcional y Neyman». Frente a los exactos —21 124 y 17 291— parecía **ganarle al estratificado
proporcional**, y no puede: la postestratificación es ese mismo estimador con los $n_h$ al azar en vez
de fijados, así que paga una prima, nunca la cobra. El pie dice ahora por qué no entra en la tabla. El
módulo 10 no tenía el problema: allí las tres cifras que compara (18 898, 17 513, 16 380) son las tres
estimadas.

#### Los otros cuatro

- **3 · El comentario contra su salida.** `cadena.R` decía «300 / 0.75 = 400 entrevistas de un MAS. Cien
  entrevistas gratis» tres líneas antes de imprimir **399**; la prosa y la autoevaluación dicen 399 y 99.
  El comentario explica ahora que redondear el deff a 0,75 antes de dividir es lo que produce el 400.
- **4 · La referencia al vacío.** El módulo 5 mandaba «al simulador de la portada del material» para ver
  el truncamiento iterativo de las $\pi$; la portada no tiene simuladores y ese truncamiento vive en el
  **capítulo 6**. Es el tercer puntero roto del capítulo —T7.16 arregló el «capítulo 10» y el del
  simulador del capítulo 2—.
- **5 · Las 401 entrevistas.** En el ejercicio 2, `round(400 * N_h / N)` da 137+29+180+55 = **401**,
  mientras Neyman suma 400 exactos. La solución concluía «un 18,7 % menos con el mismo presupuesto». Se
  dice ahora que el redondeo le regala una entrevista a la proporcional y que con 400 exactas la ventaja
  sería algo mayor.
- **6 · «Casi duplica».** Con deff 0,82 → 0,54, lo ahorrado en varianza pasa del 18 % al 46 %: por 2,6,
  no por 2.

**Una observación que no se arregló.** El **módulo 1 sigue sin ninguna pregunta** en la autoevaluación y
el 2 tiene dos, así que el resumen final nunca podrá recomendar repasar el primero. Desde T7.16 el texto
ya no promete lo contrario, de modo que es un hueco de cobertura y no una afirmación falsa.

**Descartado tras comprobarlo.** La nota del módulo 3 dice que el intervalo usa la normal ($\pm 1{,}96$)
y `survey` documenta la $t$; pero `confint.svystat` usa la normal, y la salida lo confirma:
$32\,104 = 1{,}95996 \times 16\,380$.

**Verificado.** Byte a byte en la segunda pasada · **246 de 246** cifras de bloques · **68 respaldadas ·
0 sin respaldo** (dos más que antes: el 23 294 y el 0,8224, los dos salidos del bloque R6). En el
navegador: **195 fórmulas de KaTeX y 0 `.katex-error`** en los doce módulos, los ocho textos nuevos
presentes y los cuatro viejos ausentes, la tabla comparativa con sus cinco diseños y su pie nuevo, y la
consola limpia.

#### El accidente del commit `cfc4e2d`, que hay que leer entero

El commit que cierra esta tarea **borró 161 líneas del plan**: las notas T7.16 y T7.17 de la otra
sesión. Se restauran en el commit siguiente, con esta nota dentro. Cómo pasó, paso a paso, porque el
fallo no está donde parece:

1. El guion que prepara el plan **abortó**, y abortó **bien**: la otra sesión ya había escrito una
   T7.17 (auditoría del capítulo 5) y la comprobación `assert "### T7.17" not in s` lo detectó. Por eso
   esta nota es la T7.18.
2. Pero el comando seguía con `&&` **después** del bloque de Python, y `python3 - <<'PY'` devolvió
   error… que `&&` sí respeta. El que no protestó fue el paso siguiente: `git hash-object -w` encontró
   en el scratchpad un `plan_commit.md` **de la tarea anterior** —T7.15, de ayer— y lo hasheó tan
   contento. `git update-index` lo metió al índice, y el commit salió con el plan revertido.
3. El árbol de trabajo se salvó porque el guion murió **antes** de escribirlo: por eso la versión buena
   seguía en disco y la restauración fue posible sin tocar la historia.

**Las dos lecciones.** La primera: un nombre de archivo reutilizado entre tareas en un directorio
temporal es una mina; el artefacto de una tarea vieja tiene el mismo nombre y no caduca. Se usa un
nombre único por tarea, o se borra al terminar. La segunda, más general: **cuando un paso construye un
artefacto y otro lo consume, el consumidor tiene que comprobar que el artefacto es de esta ejecución**
—que existe, que es reciente, que contiene lo que debía—; encadenar con `&&` no basta, porque protege
del comando que falla, no del que encuentra basura de ayer y la usa sin dudar. Es, en pequeño, el mismo
defecto que este proyecto lleva tres días encontrando en el material: el verificador comprueba las
cifras, no que la fórmula sea la que el código ejecuta.

**Publicado el 2026-09-12** con el visto bueno de Javier: `main` en `0464cca`, `gh-pages` en `1f38acb`.
Javier pidió publicar los capítulos 4 y 5, y el 5 **no hizo falta**: la otra sesión lo había subido a
las 09:01 y `gh-pages` ya lo servía, así que el push solo movió el 4. Antes de publicar se
reensamblaron las nueve páginas y ninguna cambió un byte —el disco era la salida real de sus fuentes—.
Comprobado sobre lo servido, no sobre el disco: los capítulos 4 y 5 en vivo son **byte a byte** los de
`HEAD` (`cmp` contra `git show HEAD:sitio/...`), y en el 4, con el navegador, **195 fórmulas de KaTeX y
0 `.katex-error`**, el aviso de las dos escalas del módulo 8, el puntero al capítulo 6 del módulo 5, el
«más que duplica» del 6, las 401 entrevistas del ejercicio 2 y el pie nuevo de la tabla, sin rastro de
los cuatro textos viejos y con la consola limpia. El primer `cmp` del capítulo 4 salió distinto porque
Pages seguía construyendo; se repitió hasta cuadrar, que es el comportamiento normal del primer medio
minuto.

### T7.20 — Auditoría de orden del capítulo 6 (2026-09-12)

Leídos los once módulos, los diez simuladores, las once preguntas y los cuatro ejercicios. **El
capítulo 6 está bien ordenado**: el módulo 4 se apoya explícitamente en el marco π del capítulo 2, el 7
remite al 2 para Sen–Yates–Grundy, el 9 junta el capítulo 5 con éste y el 10 traduce el capítulo entero
a la IA. Tres hallazgos.

**1 · Las dos familias de probabilidades no se contrastaban hasta el último módulo.** El capítulo usa
$\psi_i$ desde el módulo 1 y $\pi_k$ desde el 4, y declara que confundirlas es «el error número uno»…
en el módulo 11, que es donde vive el glosario. Entre medias, el único sitio donde aparecían juntas era
un inciso de paso del módulo 4. Lo llamativo: **la explicación ya estaba escrita** en la nota del
propio glosario —$\psi$ es de una extracción y suman 1; $\pi$ es de estar en la muestra y suman $n$—,
solo que en el sitio equivocado. Ahora hay una caja al principio del módulo 4, donde $\pi$ entra en
escena tras tres módulos de $\psi$. **El glosario no se movió**: los capítulos 7 y 8 lo colocan igual,
en su módulo de autoevaluación, así que es una convención del tramo final y no un descuido de éste.

**2 · Un puntero desviado por un módulo.** El módulo 4 decía «la demostración es la del capítulo 2,
módulo 4, con indicadoras $I_k$»; está en el **módulo 3** —el panel plegable `der-ht-insesgado`—, y el
propio capítulo 6 lo cita bien en el módulo 7.

**3 · Un ejemplo que el capítulo 4 no tiene.** El módulo 5 comparaba la inclusión forzosa con «el mismo
instinto del estrato de *grandes contribuyentes* del capítulo 4». Ese estrato no aparece en el capítulo
4; lo que sí está es el **estrato censado** ($n_h = N_h$), que no aporta varianza porque entra entero —
que es justo el paralelismo buscado.

**Verificado.** Byte a byte en la segunda pasada · **315 de 315** cifras de bloques y **53 respaldadas ·
0 sin respaldo**, los mismos recuentos que antes · en el navegador, **221 fórmulas de KaTeX y 0
`.katex-error`** en los once módulos, consola limpia y la caja nueva renderizando sus nueve fórmulas ·
y el `grep` de cierre sobre el **HTML compilado** confirma que las dos formas viejas quedaron en cero.

**Comprobado y correcto, para no volver a mirarlo:** las cifras de apertura (14 248 y las 10,8 veces
salen de R1; 7 124 de R2; los «15 026» son los 15 025,67 del bloque), el peso autoponderado
$32{,}35 = 647/(5\cdot 4)$, la desviación 2,414 del tamaño de muestra de Poisson, los 963 006 contra
557 287 **y** que estén de verdad en el módulo 10 como dice el ejercicio 1, el 62,5 % del tramo de D en
el método acumulativo, y el reparto del quiz (once preguntas, los diez módulos cubiertos).

**Un apunte de calibración, con un fallo propio.** Mientras se auditaba este capítulo, otra sesión
revisó el 4 (T7.18) y encontró seis defectos más, el primero de ellos que el deff de estratificar por
región se publica como **0,82** en tres módulos y **0,7512** en el octavo, para el mismo diseño. T7.16
—la auditoría de orden de ese capítulo, hecha esa misma mañana— tuvo las dos cifras delante al arreglar
precisamente el deff y no las reconcilió. La lección: **la lente de orden no sustituye a la de cifras**,
y conviene pasar las dos sobre el mismo capítulo antes de darlo por revisado.

**Publicado el 2026-09-12** en `gh-pages` `bfa8369`. No lo publicó esta sesión: cuando Javier
dio el visto bueno, otra sesión ya lo había sacado junto con su propio trabajo (lo registra T7.24), y
`sitio/` coincidía con lo publicado. Comprobado igualmente sobre la página en vivo: es **byte a byte** la de
`HEAD` (`cmp`), con la caja $\psi$ frente a $\pi$, el puntero al módulo 3 del capítulo 2 y el estrato
censado en su sitio. **Lección de convivencia:** con varias sesiones publicando, «pendiente de publicar» en
una entrada no significa «sin publicar» en el repositorio; antes de publicar hay que mirar `sitio/` contra
`gh-pages`, no la propia nota.

**Pendiente:** sigue sin hacerse la frase del capítulo 7 que
apuntó T7.13 —«el efecto de diseño ya apareció en los capítulos 4 y 5»—, que ahora debería nombrar
también al 2. **Hecha en T7.26.**

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

---

### T7.19 — La ventana del módulo 3 del cap. 3: dos pestañas que decían lo mismo y calculaban cosas distintas (2026-09-12)

Cerrado lo que T7.15 dejó abierto. Javier pidió empezar por aquí.

**El defecto.** La ventana llevaba una etiqueta única —«De dónde sale la ganancia»— sobre dos pestañas que
no calculaban lo mismo. El campo `veces_mas_eficiente` valía **110,2327** en R (el cociente al cuadrado de
los errores estándar de los dos estimadores, sacado de `survey`) y **118,4578** en Python (el cuadrado del
cociente de las dos desviaciones, a mano). Además la pestaña Python afirmaba que «la reduccion es
exactamente lo que se gana en error estandar», que es falso: las desviaciones bajan 10,88 veces y el error
estándar del total, 10,50. Y R necesitaba `exp_sv` y `ee_razon` del R2 —es decir, `survey`— para una
pregunta que el texto plantea sin él.

**Lo decidido.** De las dos salidas que quedaban abiertas se tomó la **1** (igualar las dos pestañas sin
`survey`), que bien hecha entrega también lo que buscaba la 2: la ventana ya no usa funciones de encuestas,
así que no hay razón para sacarla del módulo 3. La clave es que el error estándar de la expansión bajo MAS
se escribe a mano, $N\sqrt{1-n/N}\,s_y/\sqrt{n}$, y **coincide con `SE(exp_sv)` hasta el último bit**
(discrepancia relativa $1{,}28\times10^{-16}$, comprobado).

**Las dos cifras no eran un error: son dos cosas distintas, y ahora el bloque enseña las dos.** De la
identidad

$$\frac{ee_{\text{expansión}}}{ee_{\text{razón}}} = \frac{\hat{t}_{x,\pi}}{t_x}\cdot\frac{s_y}{s_e}$$

sale que el factor entre estimadores es el factor entre desviaciones multiplicado por
$(\hat{t}_{x,\pi}/t_x)^2$. Así que las dos pestañas imprimen ahora **seis** cifras iguales, en tres parejas
que se leen de izquierda a derecha: `sd_y` y `sd_residuos` (344 552 y 31 657), `reduccion_pct` y
`factor_desviaciones` (90,8121 y 118,4578), y `correccion_tx` y `factor_estimadores` (0,9306 y 110,2327).
El 0,9306 es el inverso del cuadrado del 1,0366 que el módulo 2 llama el $g$ del módulo 10, y el producto
de las dos columnas anteriores da la tercera de forma exacta. La lectura pedagógica que antes no estaba:
**anunciar el cuadrado de las desviaciones como la ganancia del estimador se pasa de optimista**, porque la
muestra subestimó el total de la auxiliar y el error estándar de la razón se corrige al alza por ello.

**Lo hecho.**

- `ensamblado/codigo/cap3/cadena.R`, bloque **R4**: fuera `SE(exp_sv)` y `ee_razon`; dentro `sd_y`,
  `ee_expansion` a mano y los seis campos. El único rastro de `survey` es un comentario que dice que la
  fórmula a mano reproduce `SE(exp_sv)` del R2 —una comprobación cruzada, no una llamada—.
- `ensamblado/codigo/cap3/cadena.py`, bloque **P2**: los mismos seis campos con los mismos nombres, y el
  comentario falso sustituido por la explicación del factor.
- `ensamblado/modulos/cap3/modulos_1_4.html`, módulo 3: una nota de **propósito** antes de la ventana
  («Qué hace el bloque de abajo, y con qué», con las dos fórmulas del MAS que compara y la advertencia de
  que las dos pestañas calculan lo mismo) y una de **conclusiones** después («Lo que dice la salida», con
  las tres parejas y tres conclusiones). Desaparece el paréntesis que antes intentaba explicar el desajuste
  con el texto solo, porque ahora el desajuste está en la salida.

**Verificado.** Byte a byte en la segunda pasada, y reensamblar las nueve páginas no movió ninguna otra ·
**155 de 155** cifras de bloques (eran 151: cuatro nuevas, dos por pestaña) · prosa **91 respaldadas · 0 sin
respaldo** (eran 88: las tres nuevas son 118,4578, 110,2327 y 0,9306, todas salidas reales) · bancos y
barajado sin cambio, con los dos fallos mecánicos de siempre (`cap7[6]`, `cap8[9]`). En el navegador, sobre
HTTP: **305 fórmulas de KaTeX y 0 `.katex-error`** en los doce módulos, las dos notas nuevas presentes, los
dos textos viejos («factor de más de cien», «queda en 110») fuera, ninguna llamada a `survey` en el bloque
de R, y la consola limpia.

**La trampa, para la próxima.** El verificador de bloques contrasta cada cifra anunciada contra la salida
real **de su propio bloque**. Dos pestañas pueden por tanto contradecirse y pasar las dos: las cifras son
verdaderas, lo falso es la etiqueta que las presenta como la misma cosa. Ese paralelismo entre pestañas solo
se ha auditado a mano, y solo en el capítulo 1 y ahora aquí. Queda como candidato a herramienta: comparar
los nombres de campo de los bloques R y Python que comparten una misma `code-tabs`.

---

### T7.21 — Los dos fallos mecánicos de los bancos, y el falso positivo que los acompañaba (2026-09-12)

Javier pidió cerrar los dos fallos que `prueba_bancos.py` llevaba tiempo señalando. Eran de naturaleza
distinta: uno era un ítem equivocado, el otro un hueco de accesibilidad.

*(Nota de orden: la otra sesión insertó su T7.20 delante de la T7.19 de esta, así que en el archivo las
dos últimas etiquetas van al revés. Se deja como está para no tocar texto ajeno.)*

**`cap7[6]` — la tolerancia ancha tapaba un ítem sencillamente mal.** Preguntaba «¿por qué factor se divide
el error en cada paso?» del IPFP, daba por buena la respuesta **39** y aceptaba cualquier cosa entre 14 y 64.
La traza real del módulo 6 es `1.30e-01 3.35e-03 4.54e-06 6.15e-09 8.33e-12 1.12e-14`, y sus cocientes son
**38,78 · 738,36 · 738,30 · 738,31 · 746,82**. Es decir: 39 es el primer paso, el transitorio de salir de
una tabla de partida cualquiera, y el ritmo propio del algoritmo es **738**, constante. De ahí salían cuatro
errores encadenados:

- la respuesta correcta no era la que el ítem pedía;
- la `pista` mandaba calcular `3,35e−3 / 4,54e−6`, que da 738 y **la tolerancia rechazaba**;
- el `retroAcierto` decía «del orden de 40 por iteración: es convergencia geométrica», dos afirmaciones que
  no encajan entre sí;
- y añadía que «8 iteraciones llevan el error a $10^{-16}$». Ejecutado con nueve iteraciones, el error toca
  el suelo de la máquina, $2{,}01\times10^{-16}$, en la **sexta**, y ahí se queda: iterar más no baja nada.
  El `retroFallo`, por su parte, decía que «el ritmo se acelera», y no se acelera: se estabiliza.

El ítem se reescribió entero: enuncia la serie, avisa de que el cociente es constante **de la segunda
iteración en adelante**, pide ese cociente (`respuesta: 738`, `tolerancia: 25`, un 3,4 %), y las dos
retroalimentaciones explican por qué 39 es la trampa y qué significa que el ritmo sea constante.

**`cap8[9]` — un gráfico sin descripción.** El ítem de cobertura del módulo 6 pintaba tres barras y no tenía
`descripcionGrafico`, que es lo que la plantilla pone como `aria-label` del `canvas` y lo que el exportador
de Brightspace usa de `alt`. Como la pregunta exige comparar las tres barras entre sí y con la recta del
95 %, quien no ve el lienzo no tenía nada. Se escribió la descripción con las tres alturas (0,9265 · 0,8715 ·
0,9115), el rango del eje y la recta rotulada, sin adelantar la lectura, que es lo que el ítem evalúa.

**Y un tercer arreglo que apareció al arreglar el primero: un falso positivo de la propia prueba.** Al
reescribir `cap7[6]`, su retro pasó a decir «aparece en la segunda iteración» y la prueba lo marcó por
«nombra posiciones y la página baraja». Pero `cap7[6]` es `numerica`: **no tiene ni una opción que barajar**,
así que un ordinal suyo no puede apuntar a un botón movido. La comprobación se restringió a los ítems que
sí tienen opciones. Con eso sobraba también la excepción de `cap5[3]` —«la primera unidad del
conglomerado», otro `numerica`—, que se quitó de `POSICIONALES_REVISADAS` con su motivo escrito. Auditado:
en todo el material solo esos dos ítems sin opciones casan con el patrón, y ninguno habla de opciones.

**Verificado.** Reensamblados los nueve, byte a byte en la segunda pasada, y solo cambian el 7 y el 8 ·
`prueba_bancos.py` **sin fallos mecánicos** por primera vez, también con `--corte1` · barajado 4 de 4 ·
Brightspace sin fallos de contenido · bloques **224 de 224** (cap. 7) y **458 de 458** (cap. 8) · prosa
**0 sin respaldo** en las nueve páginas. En el navegador: en el capítulo 7 la respuesta 738 se acepta con su
retro nueva y el 39 se rechaza con una pista que ahora **lleva a la respuesta correcta**; en el capítulo 8 la
descripción llega al `canvas` como `aria-label` con `role="img"`; 144 fórmulas de KaTeX y 0 errores en los
once módulos del 8, consola limpia en los dos.

**Tres entradas nuevas en `cifras_prosa.json`** (4,54 · 6,15 · 8,33): son las mantisas de la serie del IPFP
que el enunciado ahora cita, hermanas de la de 3,35 que ya estaba, y el verificador no las deriva solo
porque en la salida real viven dentro de `4.54e-06`.

**Pendiente que salió de paso.** `ensamblado/modulos/taller1/simulacro.js` tiene una `descripcionGrafico`
con la cola rota: «… y hay que contarlos aparecen destacados». No es del material de los capítulos y no se
tocó aquí.

### T7.22 — La descripción del gráfico de cobertura del simulacro, con la cola rota (2026-09-12)

Cierra el pendiente que T7.21 dejó anotado. El ítem de gráfico del simulacro —semana 3, anclado al módulo
6 del cap. 2, «Intervalos de confianza»— tenía la `descripcionGrafico` acabada en dos oraciones empalmadas
sin gramática: «… sin llegar a cruzarla, **y hay que contarlos aparecen destacados**». No es una errata
cosmética: esa cadena es lo que la plantilla pone como `aria-label` del `canvas` y lo que
`exporta_brightspace.py` usa de `alt`, así que quien no ve el lienzo oía exactamente eso.

Debajo del empalme había dos defectos, y el segundo es el que importa:

- **«sin llegar a cruzarla» describe el gesto equivocado.** Un intervalo que falla no es que roce la recta
  sin cruzarla: es que queda **entero a un lado**. Ahora dice «sin llegar a tocarla».
- **«unos pocos» no es una cuenta.** La `pista` manda «cuenta cuántos segmentos no tocan la línea», y quien
  ve el gráfico los cuenta: son **tres**. La descripción se los negaba, que es justo lo que el `alt` está
  para evitar.

Contrastado con `DT.cobertura` de `taller1_recurso_datos.json`: de las **100 réplicas, 97 cubren** la media
de 168,616 cm y **3 no** —las réplicas 8 y 44 enteras por encima de la recta, la 29 entera por debajo—, que
es lo que pinta el `dibujar` al partir `iv` por `d.cubre`. La cifra ya vivía en la retro del ítem («97
cubren la media y 3 no»); lo que faltaba era que también la tuviera quien no ve el gráfico. La cola quedó
así: «tres de ellos, destacados en naranja, quedan enteros por encima o por debajo de la recta sin llegar a
tocarla: dos arriba y uno abajo».

Lo que la descripción **no** dice, a propósito: que el 95 % es una propiedad del procedimiento y no de un
intervalo suelto. Esa es la lectura que el ítem evalúa —es su opción correcta— y va en la retro, no en el
`alt`. La descripción entrega lo que ve quien mira el lienzo, cuántos hay y de qué color, no la conclusión.

**Verificado.** Reensamblado `preparcial-corte-1.html` —la página que absorbió el recurso del Taller 1 (D1),
478 444 caracteres, 13 módulos, 59 preguntas—, **byte a byte idéntico en la segunda pasada** y con una sola
línea de diferencia contra el publicado · `prueba_banco_taller1.py` **5 de 5** · `prueba_bancos.py` **sin
fallos mecánicos**, también con `--corte1` · Brightspace **sin fallos de contenido** y la descripción nueva
ya como `alt` en `questiondb.xml` · y el `dibujar` ejecutado contra el JSON real devuelve **97 segmentos
verdes y 3 naranjas, 2 arriba y 1 abajo**, que es lo que la descripción promete.

### T7.23 — Los otros dos gráficos del simulacro: descripciones que no dejaban responder (2026-09-12)

Arreglada la cola rota de T7.22, Javier mandó revisar las **otras dos** `descripcionGrafico` del simulacro
—son tres en total, una por semana 2, 3 y 4—. Las dos tenían el mismo defecto de fondo, que es más grave
que el empalme de ayer: **describían el montaje del gráfico y ningún dato**, así que quien depende del
`aria-label` no podía responder. Y en los dos casos la `pista` del propio ítem pide justo lo que faltaba.

**El de la semana 2 (sesgo de selección, ancla cap. 1 mód. 4).** Decía «…en proporción, **con las dos
medias marcadas**», y ahí se cortaba. Su pista manda «compara dónde están las dos rectas verticales y qué
parte de la distribución se ha adelgazado»: ninguna de las dos cosas estaba escrita, y sin ellas la opción
correcta («desplazada a la derecha») y el distractor B («centradas en el mismo sitio») son cara o cruz.
Contra `DT.histogramas`: las **6 barras entre 140 y 170 cm** son más bajas en los respondientes —la de
157,5 cae de 0,1455 a 0,0946, la mayor diferencia— y las **8 de 170 en adelante** son más altas; la media
de respondientes (172,165) queda a la derecha de la del marco (168,616).

> **Lo que la descripción NO dice, y es deliberado: cuánto.** El ítem numérico que vive **dos posiciones
> antes** pide exactamente ese sesgo, 3,5494 cm. Escribir «3,5 cm a la derecha» en el `alt` regalaría su
> respuesta. Y tampoco haría falta: sobre un eje de 135 a 205 cm, esas dos rectas están separadas un 5 %
> del ancho, así que **quien ve el gráfico tampoco lee la cifra**. La descripción da lo que es legible,
> no lo que está en el JSON.

**El de la semana 4 (tamaño de muestra, ancla cap. 2 mód. 7).** Este era el grave: las **cuatro** opciones
se deciden mirando la curva —si son rectas, cuál va por encima, si el margen vale cero en $n = 500$— y la
descripción no daba ni un punto. Peor: las retros de los distractores refutan con cosas que el estudiante
ciego no tiene («la curva naranja va siempre por encima», «en $n = 500$ es ≈ 0,85 cm»). Verificado sobre
las 34 filas de `DT.curvaMargen`: `sinFpc ≥ conFpc` en **las 34**, y en $n = 2\,000$ vale `conFpc = 0`
exacto contra `sinFpc = 0,489`.

Se describió **por hitos y no en prosa evaluativa**, como la del cap. 8 (T7.21): las dos curvas con su
color y su trazo, y los pares (sin fpc, con fpc) en $n = 25$, 100, 500 y 2 000. Así el estudiante conserva
el trabajo que el ítem evalúa —decidir si eso «baja proporcionalmente a $n$» y si 0,85 «es cero»— en vez
de recibir la opción correcta redactada.

**Un cuarto arreglo, que salió de verificar el tercero.** La primera redacción decía «las dos arrancan en
$n = 25$ **rozando 4,4 cm**». Es falso para una de las dos: 4,3739 redondea a 4,4, pero **4,3465 redondea
a 4,3**. Quedó «casi juntas en $n = 25$, en **4,37 y 4,35 cm**», que es exacto y dice lo mismo. Lo cazó un
verificador de un solo uso que contrasta cada cifra de las tres descripciones contra el JSON; de paso
confirmó que **ninguna de las tres cita la respuesta de ninguna de las seis numéricas** (3,5494 · 0,7429 ·
170,4 · 5,41 · 193 · 730). Las tres cierran ahora con punto, como las del cap. 8 y las del preparcial.

**Queda dicho, y no se toca aquí.** Aun con la mejor descripción, el ítem de la semana 4 **sigue siendo de
puro leer el gráfico**: sus cuatro opciones son afirmaciones sobre el dibujo, así que una descripción
completa lo vuelve fácil para todos por igual. Eso es paridad de acceso, no un defecto del `alt`: si
alguna vez se quiere que discrimine más, lo que hay que mover son **las opciones** —pedir, por ejemplo, el
$n$ que parte el margen por la mitad—, no la descripción.

**Verificado.** Reensamblado `preparcial-corte-1.html` (478 969 caracteres), **byte a byte idéntico en la
segunda pasada** · `prueba_banco_taller1.py` **5 de 5** · `prueba_bancos.py` **sin fallos mecánicos**,
también con `--corte1` · Brightspace **sin fallos de contenido**, con las tres descripciones ya como `alt`
en `questiondb.xml` · y las cifras de las dos descripciones nuevas contrastadas una a una contra
`taller1_recurso_datos.json`, las 9 correctas tras el arreglo del 4,4.

---

### T7.24 — Publicado todo lo pendiente, y un gráfico en blanco que salió al comprobarlo (2026-09-12)

Javier dijo «publícalos todos». Al ir a hacerlo, el panorama había cambiado: **otra sesión ya había publicado
los capítulos 7 y 8** (`6dc077a` en `gh-pages`), y también el 6 (`bfa8369`), de modo que lo único que seguía
sin salir era el `preparcial-corte-1.html` de T7.22 y T7.23. Se publicó eso:
`gh-pages` de `b261ada` a **`72021ad`**, que es exactamente `sitio/` de `1d5380a`.

**Comprobado antes de publicar.** Reensamblados los nueve, byte a byte en la segunda pasada y sin deriva
respecto de lo commiteado · bancos sin fallos mecánicos, también con `--corte1` · taller1 5 de 5 · barajado
4 de 4 · Brightspace sin fallos de contenido · bloques y prosa **sin una sola cifra sin respaldo** en las
nueve páginas. Revisado además el cambio ajeno que iba a salir con el mío: el del capítulo 6 (la caja
$\psi$ frente a $\pi$, la referencia corregida al módulo 3 del capítulo 2 y el puntero al estrato censado)
y el del simulacro (tres `descripcionGrafico` con las cifras que el gráfico enseña).

**Comprobado después.** Las **diez** páginas servidas son byte a byte las de `HEAD` (`cmp`). En el navegador,
sobre la página en vivo: capítulo 6 con 221 fórmulas de KaTeX y 0 errores, la caja nueva presente y los dos
textos viejos fuera; preparcial con 160 fórmulas, 0 errores y las diez descripciones de gráfico en su
`canvas`, ninguna con la cola rota.

**El hallazgo: el gráfico del módulo 9 del preparcial no se dibuja.** Al recorrer los trece módulos aparece
un `Uncaught TypeError: Cannot read properties of null (reading 'x')`, siempre en el módulo 9. El `canvas`
de la pregunta «Cien intervalos de confianza al 95 %» tiene el tamaño correcto (702 × 218) y **ni un píxel
pintado**: el estudiante ve el enunciado, las cuatro opciones y un hueco. Los otros nueve gráficos del
preparcial se dibujan bien. **Es anterior a lo de hoy**: se reprodujo igual sobre la página tal como estaba
en `30f8936`, antes de los dos commits del simulacro. Queda sin arreglar, y conviene no tocarlo mientras la
otra sesión siga en `taller1/simulacro.js`.

**Una trampa de método, para la próxima.** La primera medición dijo que **los diez** gráficos tenían
`width = 0` y que ninguno se dibujaba — en el capítulo 8 también—. Era falso: el panel del navegador estaba
oculto y sin ancho de composición, así que `document.body` medía **0** y con él todo lo demás. El control que
lo delató es medir el `body`: si mide cero, ninguna medida de layout de esa pasada vale. Con
`resize_window` a 1280 × 900 el `body` pasó a 1270 y nueve de los diez gráficos resultaron correctos. La
lección: antes de declarar un defecto de dibujo, comprobar que la página tiene ancho, y contrastar contra un
elemento que se sepa sano.

---

### T7.25 — El gráfico del módulo 9 del preparcial: dos defectos, y la prueba que los dejaba pasar (2026-09-13)

El hallazgo de T7.24, arreglado. Resultó tener **dos** defectos encadenados, y descubrir el segundo solo fue
posible después de arreglar el primero.

**Defecto 1: un `null` desnudo reventaba el gráfico entero.** La serie de los cien intervalos separa un
segmento del siguiente empujando un hueco en los datos, y lo escribía como `null` a secas entre puntos
`{x, y}`. Con la escala lineal, Chart.js ordena los puntos por `.x` antes de dibujar, y un `null` no la
tiene: `Cannot read properties of null (reading 'x')`, lienzo en blanco. Reproducido en aislamiento sobre
la propia página, con las dos variantes una al lado de la otra:

| hueco | resultado |
|---|---|
| `null` | lanza `Cannot read properties of null (reading 'x')`, no pinta |
| `{ x: i + 1, y: null }` | dibuja, y los segmentos siguen separados |

Es el **único** sitio de todo el material que empujaba un `null` desnudo, y el único que usa `spanGaps`.

**Defecto 2, escondido debajo: el eje aplastaba el gráfico hasta hacerlo inútil.** Con el primero arreglado
el gráfico ya se dibujaba, pero `crearGraficoXY` pone `beginAtZero: true` en el eje y, y aquí los cien
intervalos viven entre **162,42 y 174,67 cm**: el eje iba de 0 a 180 y los datos ocupaban **9 píxeles de
139**. La pregunta pide contar cuántos segmentos no tocan la recta, y en 9 píxeles no se cuenta nada. Se
encuadra ahora en el entorno de los datos, con un 6 % de margen, calculado de los propios intervalos para
que siga siendo cierto si cambia el precálculo. Medido antes y después: los tres segmentos naranjas pasan
de **8–9 px** de alto a **102–115 px**, y los píxeles útiles del eje de **9** a **124**.

Comprobado que el arreglo no arrastra a nadie: de los diez gráficos del preparcial, **solo este** tenía el
problema del encuadre —los otros nueve grafican magnitudes que arrancan cerca de cero, así que
`beginAtZero` no les cuesta nada—. Por eso el arreglo es local al ítem y no toca la plantilla.

**Defecto 3, en la propia prueba: `prueba_banco_taller1.py` no podía ver ninguno de los dos.** Su arnés
doblaba los **ayudantes** (`crearGraficoXY` devolvía `{destroy(){}}`), que es exactamente el diseño que
`_bancos.py` abandonó y documentó en su cabecera: todo `dibujar` que post-procese el objeto devuelto se
declara roto estando sano. Al añadir el encuadre, el arnés murió con
`Cannot read properties of undefined (reading 'scales')`. Se alineó con `_bancos.py`: **el doble es
Chart.js**, y los ayudantes reales del capítulo 1 corren de verdad. Y como `prueba_graficos` filtraba los
nulos *antes* de mirarlos, el `null` desnudo le pasaba por delante sin verlo; ahora hay una regla explícita:

> en una serie de puntos `{x, y}`, un `null` desnudo es fallo; el hueco se escribe `{x, y: null}`.

**Comprobada la prueba contra el defecto que debía cazar.** Reintroducido el `null` desnudo, la prueba
falla con «ítem 20, serie «Cubren la media»: un `null` desnudo entre puntos {x, y}» y código de salida 1;
restaurado el arreglo, 5 de 5. Una prueba nueva que no se ve fallar no sirve de nada.

**Verificado.** Reensamblados los nueve, byte a byte en la segunda pasada y sin deriva · taller1 **5 de 5** ·
bancos sin fallos mecánicos, también con `--corte1` · barajado 4 de 4 · Brightspace sin fallos ·
`node --check` sobre `simulacro.js` · bloques y prosa **0 sin respaldo** en las nueve páginas. En el
navegador, con viewport de 1280 × 900: los **diez** gráficos del preparcial se dibujan, **cero errores de
consola** en un recorrido de los trece módulos, y el del módulo 9 muestra tres segmentos naranjas separados
—réplicas 8 y 44 por encima de la media, 29 por debajo—, que es exactamente lo que dice su
`descripcionGrafico`.

**Pendiente que salió de paso.** El preparcial tiene **dos cifras de prosa sin respaldo** —«la media sale
2,3» y «6 000 personas abordadas»—, las dos retóricas dentro de enunciados. Vienen de antes de hoy
(comprobado sobre la página de `39188c8`) y no se tocaron: entrar en `cifras_prosa.json` es un acto de
revisión, y esta tarea no era esa.

**Publicado el 2026-09-13** con el visto bueno de Javier: `gh-pages` de `72021ad` a **`ea90cba`**, que es
exactamente `sitio/` de `7666c9d`, y `gh-pages` vuelve a coincidir con `main` sin una diferencia. Las diez
páginas servidas son byte a byte las de `HEAD`. Comprobado sobre la página en vivo, con viewport de
1280 × 900: los **diez** gráficos se dibujan, **cero errores de consola** en los trece módulos, y el del
módulo 9 tiene el eje en [161,7 · 175,4] con sus tres segmentos naranjas de 115, 102 y 115 píxeles de alto.
Se cuentan a ojo, que es lo que la pregunta pide.

---

### T7.26 — La frase del capítulo 7 que T7.13 dejó apuntada (2026-09-13)

Javier pidió aplicar el encargo que T7.13 dejó escrito el 2026-09-11 y que T7.16, T7.17 y T7.20
arrastraron sin hacer: el módulo 3 del capítulo 7 abría con «el **efecto de diseño** ya apareció en los
capítulos 4 y 5 midiendo una cosa cada vez». Desde T7.13 el deff también aparece —y por primera vez se
**define**— en el capítulo 2, en la **Definición 2.10**. La frase mandaba al lector a buscar la vara donde
solo se usa, y callaba el sitio donde está construida.

**La frase, ahora.** «El **efecto de diseño** no es nuevo: el capítulo 2 lo definió —Definición 2.10, la
varianza del diseño dividida entre la del MAS del mismo $n$— y los capítulos 4 y 5 lo usaron midiendo una
cosa cada vez: lo que gana estratificar, lo que cuesta conglomerar. Aquí mide el diseño entero: […] con
los tres ingredientes actuando a la vez.» Los dos usos quedan nombrados por lo que miden, y el cierre
enlaza con el objetivo del módulo, que es descomponer el deff en sus tres fuentes.

**Y el mismo defecto, dos párrafos más abajo.** El «Para ampliar este módulo» remitía a «cap. 5, módulo 4
(ICC y deff) y cap. 4, módulo 3 (la ganancia del estratificado)». El capítulo 2 no estaba, y el módulo 3
del capítulo 4 es *Pesos y estimación*: el deff del estratificado vive en su módulo 8, que se titula
justamente «El efecto de diseño». Quien seguía el puntero aterrizaba donde el deff no se nombra. Ahora la
lista va en orden de capítulo y cada entrada apunta al módulo donde el deff es el asunto: cap. 2, módulo 9
(Definición 2.10), cap. 4, módulo 8, cap. 5, módulo 4.

**Una observación de notación, sin tocar nada.** El capítulo 2 escribe **DEFF** y los capítulos 4, 5 y 7
escriben **deff**; la frase nueva cruza los dos sin uniformarlos, igual que ya hacía el módulo 8 del
capítulo 4 («el **deff** de la Definición 2.10»). Unificar la grafía es una decisión de estilo de todo el
material, no de esta tarea.

**Verificado.** Ni una cifra nueva: `verifica_bloques.py --prosa` sobre el capítulo da **224 de 224**
cifras de bloques y **49 respaldadas · 0 sin respaldo**. `ensambla_cap7.py` reproduce el archivo **byte a
byte** en la segunda pasada. En el navegador, sobre el HTML compilado: el párrafo nuevo sale entero, su
`$n$` renderiza como KaTeX —**0 dólares sueltos** en el texto—, la fórmula del deff y el tamaño efectivo
sigue dibujándose y hay **0 `.katex-error`** en la página. La lista de referencias muestra las tres
entradas nuevas.

**Convivencia.** Otra sesión tenía `ensamblado/modulos/cap4/modulos_10_12.html` y su HTML modificados sin
commitear. No se tocaron: al commitear se añadieron solo las dos rutas del capítulo 7 y este plan.

**Lo que enseña.** Un puntero hacia atrás envejece cuando se añade material *antes* de él: T7.13 creó la
Definición 2.10 en el capítulo 2 y con ello dejó desactualizada una frase del 7 que nadie había tocado.
El encargo quedó escrito, se repitió en tres entradas y sobrevivió cinco tareas sin hacerse — anotarlo no
es hacerlo. Y al ir a arreglar la frase apuntada apareció, en el mismo módulo, el mismo defecto en la
lista de lecturas: cuando se corrige una referencia conviene mirar **todas** las del módulo, no solo la
señalada.

**Publicado el 2026-09-13** con el visto bueno de Javier: `gh-pages` de `ea90cba` a **`4bd7065`**, que es
exactamente `sitio/` de `65cf043` —el árbol publicado y `HEAD:sitio` no tienen una sola diferencia—. La
guarda de antes del push encontró `HEAD`, `origin/main` y el commit aprobado en el mismo sitio, así que
bastó el `subtree push` del README y nada ajeno viajó: las modificaciones sin commitear del capítulo 4 se
quedaron en el árbol de trabajo, porque `subtree` publica historia, no árbol de trabajo. Antes del push,
las ocho páginas del material pasaron `verifica_bloques.py --todos --prosa` con **2 359 de 2 359** cifras
de bloques y **632 respaldadas · 0 sin respaldo**; `cuenta_sitio.py` da **9 páginas · 3 307 KB**.
Comprobado sobre la página en vivo: es **byte a byte** la de `65cf043` (`cmp`, a los ~20 s del push), las
dos frases nuevas están, la vieja no aparece, y el build de Pages es `built` en **`4bd7065`**.

### T7.27 — La frase del M10 del capítulo 4 sobre qué varianza calcula `survey` (2026-09-14)

> **Esta entrada la escribe la sesión del Taller 2 del Corte 2**, que es donde nació el hallazgo
> (R16 de `PLAN_Taller_Corte2.md`). Queda aquí porque toca el material y porque T7.26 dejó escrito
> que «las modificaciones sin commitear del capítulo 4 se quedaron en el árbol de trabajo»: eran
> estas, y ya no están sin commitear.

**Lo que decía el módulo 10.** En la caja «Dos errores estándar para el mismo estimador»:
`survey` reporta 17 513 y la fórmula condicional del texto da 17 635, «y `survey` usa una
linealización que se acerca a la **segunda**» —la incondicional—.

**Es al revés, y se comprobó ejecutándolo.** `survey` lineariza los residuos con los $n_h$ que
**salieron**, así que su cifra es una forma de la **condicional**; la incondicional añade además un
término de segundo orden. Sobre una muestra de 150 con cuatro postestratos: `survey` 181 949,
condicional 182 852, incondicional 191 128 —a medio punto porcentual de la primera y a cinco de la
segunda—, coherente con el propio ejemplo del módulo, donde las dos cifras se llevan 0,7 %.

**La frase, ahora.** «…y `survey` lineariza los residuos con los $n_h$ que salieron, de modo que su
cifra es una forma de la *primera*, no de la segunda, que además añade un término de segundo
orden.» Al lado queda un **comentario HTML** que registra por qué, para que no vuelva.

**Lo que NO se tocó, y es deliberado:** la etiqueta que el material le da a su propia fórmula. No se
pudo verificar con qué la calculó, y con estratos grandes las dos formas quedan a menos de un punto.
Lohr 2.ª ed. §4.7 no zanja la etiqueta: solo trae la aproximación de la asignación proporcional.

**Por qué importaba tener fecha.** La **lectura señalada** del Taller 2 —que sale el viernes 25—
manda a este módulo para los ítems E1 y E2, y la regla de forma 6 de ese taller depende de esto.
Un estudiante que leyera lo publicado leería exactamente lo que su taller contradice.

**Verificado antes de publicar:** `ensambla_cap4.py` reproduce la página **byte a byte** (mismo md5
antes y después de reensamblar, así que la corrección no se pierde en el próximo ensamblado);
`verifica_bloques.py --prosa` sobre el capítulo 4 da **246 de 246** cifras de bloques y **68 de
prosa, 0 sin respaldo**; `cuenta_sitio.py` **9 páginas · 3 307 KB**; permisos `644`.

**Publicado el 2026-09-14** con el visto bueno de Javier: `main` de `4507a8b` a **`8a5cb04`** y
`gh-pages` de `4bd7065` a **`4e91972`**. Comprobado en vivo: la página servida por Pages ya trae la
frase nueva —`curl` con cache-buster hasta verla— y devuelve 200.

---

### T7.28 — Auditoría de orden del capítulo 7 (2026-09-16)

Tras T7.26, Javier pidió seguir con el capítulo 7. Se leyeron los diez módulos, el quiz, el glosario, los
simuladores y las dos cadenas, y cada puntero se contrastó con los capítulos 1 a 6 y con la documentación
instalada de `survey` 4.5. **Es el capítulo con más defectos de orden de los auditados**, y casi todos son
de la variante inversa: no juzgar contra algo aún no visto, sino presentar como nuevo lo que un capítulo
anterior ya construyó. Seis de orden y dos de cifras; Javier aprobó los ocho, y para la mediana pidió
además un bloque que la calcule de verdad sobre réplicas.

**1 · El módulo 5 enseñaba lo contrario de lo que documenta `survey` sobre la mediana** *(el más grave)*.
El módulo 4 decía que la linealización «se atasca» con la mediana y que ese hueco lo llena el 5; el 5, que
su linealización «necesita estimar la densidad», pero «recalcularla es trivial»; y la tabla de los cuatro
métodos respondía, en la **fila destacada**, que el jackknife sirve para la mediana «sí, sin cambiar nada».
Tres cosas lo desmienten: el capítulo 3 (módulo 11) ya estimó la mediana linealizando $\hat F$ e invirtiendo
el intervalo —Woodruff, sin densidad—; la documentación de `svyquantile` dice que ese es el método por
defecto en los dos tipos de diseño y que el intervalo basado en réplicas del cuantil «is not valid for
jackknife-type replicates»; y el propio bloque R9 daba **0,32841** por las dos vías, idénticas porque las
dos hacían Woodruff: la réplica solo estimaba la varianza de $\hat F$, no recalculaba nada.
*Arreglo.* R9 reescrito: el intervalo de Woodruff por linealización y por jackknife ($[27{,}6;\ 29]$ y ee
0,32841 las dos), y la mediana **recalculada** en cada réplica con `interval.type = "quantile"`: **BRR
0,32590 · bootstrap 0,32760 · jackknife 0,40415**, un 23 % por encima, con el aviso de `survey`, y la tabla
de sus 30 réplicas, que solo toman cinco valores (28,1 a 28,5). Párrafo nuevo después del bloque que lo
lee y deja la regla —para cuantiles, Woodruff con cualquier diseño, o réplicas de BRR o bootstrap; de
jackknife, nunca—. Corregidos también la nota del módulo 4, la apertura del 5 («sirve para casi cualquier
estadístico»), la definición del jackknife («solo es fiable con estadísticos suaves») y la columna de la
tabla.

**2 · El módulo 4 presentaba como nueva la linealización del capítulo 3.** Abría con que el error estándar
de la razón «no sale de ninguna fórmula vista hasta aquí» y que «toda la teoría de los capítulos 2 a 6
estima la varianza de totales». El capítulo 3 linealizó la razón en su módulo 2, le dio nombre en el 4
(«Linealización de Taylor: el término que se cae») y repitió la receta en dominios (8) y mediana (11); la
retro del quiz del propio capítulo 7 lo decía. Su referencia apuntaba a «cap. 3, módulo 3», que es *¿Cuándo
gana la razón?*. *Arreglo:* la apertura retoma el capítulo 3 y dice qué cambia —el diseño: estratos,
conglomerados y pesos a la vez—; la referencia nombra los módulos 2, 4, 8 y 11.

**3 · El «deff de Kish» del módulo 8 no era el que el capítulo definió.** El módulo 2 y el glosario llaman
así al deff solo por pesos, $1 + s_w^2/\bar w^2$; el simulador de cobertura decía usarlo, pero calcula
$1 + (m-1)\rho$ —la fórmula de conglomerados del capítulo 5, módulo 4—, con controles ρ y m y ningún peso.
*Arreglo:* la introducción del simulador lo nombra y remite al capítulo 5.

**4 · El módulo 6 presentaba la postestratificación sin nombrar el capítulo 4**, cuyo módulo 10
(«Postestratificación como calibración») la construye y anuncia que el 7 la generaliza; el GREG remitía al
capítulo 3 sin módulo. *Arreglo:* punteros al capítulo 4, módulo 10, y al capítulo 3, módulos 6
(`calibrate()`) y 10 (GREG), en la definición y en las referencias; «calibrar» se presenta como la palabra
con la que el capítulo 3 cerró el GREG.

**5 · El módulo 1 prometía explicar los 15 grados de libertad y solo enunciaba la regla.** *Arreglo:* una
frase en el aviso: la varianza se estima con los totales de las PSU dentro de su estrato, cada estrato con
$n_h$ PSU aporta $n_h - 1$, y un MAS es un estrato donde cada persona es su PSU: $n - 1$, el caso del
capítulo 2 (módulo 6).

**6 · La nota final atribuía al capítulo 8 «la fórmula del sesgo de no respuesta — que explica por fin, y
del todo» el *Literary Digest*.** Esa fórmula está en el capítulo 1, módulo 4. *Arreglo:* el 8 vuelve a
ella, la mide con datos de quienes no contestaron y la lleva al *Digest* con la identidad de Meng.

**7 · Dos costes de los pesos desiguales, sin conciliar** *(cifras)*. El módulo 2 da **1,89** (Kish) y
decía que el 3 mide las tres fuentes; el 3 da **1,73** para los pesos; la retro del quiz decía «el deff de
Kish lo mide» junto a 1 → 1,73. *Arreglo:* segundo párrafo en la nota «Dos deff que no son el mismo número»
—Kish solo mira los pesos y supone la variable igual en todos los niveles de peso; el 1,73 es la varianza
real de la media del IMC—, el módulo 2 lo anuncia, y la retro dice «lo anticipa mirando solo los pesos».
De paso: «suma de fuerzas» → «producto de factores» (módulo 3 y quiz) y «peso de Kish» / «el Kish» →
«deff de Kish» (módulo 8 y quiz).

**8 · «Coinciden en la tercera cifra»** *(cifras)*, en la tabla del módulo 5 y en el comentario de R8: los
cuatro errores estándar van de 0,2532 a 0,2585, y el BRR ya difiere en la tercera. Ahora «en las dos
primeras cifras».

**Fuera de alcance, anotado para cuando toque.** *(a)* El módulo 11 del capítulo 3 promete que «en el
capítulo 7 se le pondrá nombre —linealización de Taylor—», pero su módulo 4 ya se lo puso. *(b)* El módulo 2
del capítulo 8 se titula «La fórmula del sesgo de no respuesta» y la presenta con definición propia,
cuando es la del capítulo 1, módulo 4: es el mismo defecto que el 6 de esta lista, y conviene mirarlo en la
auditoría del capítulo 8. **Hecho en T7.29.** *(c)* `precalculo/genera_cap7.R` conserva el comentario «donde la linealización
no aplica directo» y exporta `medianaEeLin`/`medianaEeJk` al JSON, pero la página no usa esos campos; no se
tocó.

**Verificado.** `verifica_bloques.py --prosa` sobre el capítulo: **241 de 241** cifras de bloques (eran
224: salen las 3 del R9 viejo y entran 20) y **54 respaldadas · 0 sin respaldo** (eran 49: las cinco del
párrafo nuevo). `ensambla_cap7.py` reproduce el archivo **byte a byte** en la segunda pasada. En el
navegador, los diez módulos: **0 `.katex-error`**, **0 dólares sueltos**, consola sin errores, los lienzos de
los simuladores presentes (en `simuladores.js` solo cambiaron textos de la tabla y del quiz, no el código de ningún simulador) y las 11 preguntas del quiz; la tabla del módulo 5 muestra la columna nueva, el
bloque R9 sale con sus `#>` y el párrafo que lo lee; la introducción del simulador del módulo 8 renderiza
$1 + (m-1)\rho$ y $\bar M$. Una lección de T7.24 sirvió: la primera captura salió en blanco porque el panel
tenía `innerWidth` 0, no por la página.

**Lo que enseña.** *(a)* La lente de orden tiene dos caras: usar algo antes de presentarlo, y presentar como
nuevo lo que ya se presentó. Las auditorías de los capítulos 1 a 6 buscaron sobre todo la primera; en un
capítulo de síntesis como el 7 domina la segunda, y se encuentra leyendo sus frases de «esto no se ha visto»
contra el índice de los capítulos anteriores. *(b)* El defecto más grave no salía de ningún `grep`: salía de
un bloque cuya salida contradecía su propio texto. **Cuando dos vías que el texto presenta como distintas
dan exactamente la misma cifra, hay que preguntar si están calculando lo mismo** —y la respuesta estaba en la
documentación instalada, no en la memoria—.

**Publicado el 2026-09-16** con el visto bueno de Javier: `gh-pages` de `4e91972` a **`d8d7986`**, que es
exactamente `sitio/` de `3cb0860` —el árbol publicado y `HEAD:sitio` no tienen una sola diferencia—. La
guarda encontró `HEAD`, `origin/main` y el commit aprobado en el mismo sitio, y `gh-pages` solo difería en
la página del capítulo 7, así que bastó el `subtree push` del README y nada ajeno viajó. Antes del push,
las ocho páginas del material pasaron `verifica_bloques.py --todos --prosa` con **2 376 de 2 376** cifras
de bloques y **637 respaldadas · 0 sin respaldo**; `cuenta_sitio.py` da **9 páginas · 3 311 KB**; permisos
a 644. Comprobado sobre la página en vivo: es **byte a byte** la de `3cb0860` (`cmp`, a los ~20 s del
push), las frases nuevas de los módulos 3, 5, 6 y 8 están, las viejas («sí, sin cambiar nada», «no sale de
ninguna fórmula vista») no, y el build de Pages es `built` en **`d8d7986`**.

---

### T7.29 — Auditoría de orden del capítulo 8 (2026-09-17)

Tras publicar el 7, Javier pidió seguir con el 8, el último. Se leyeron los once módulos, el quiz, el
glosario, el árbol del módulo 10, los simuladores y la cadena, y cada puntero se contrastó con los capítulos
1 a 7. Diez hallazgos —ocho de orden y dos de cifras o redacción— y Javier aprobó los diez; para el choque
de la letra $R$ eligió renombrar el R-indicator y dejar la tasa como está.

**1 · El módulo 1 usaba el ajuste por clases antes de que el 3 lo construyera.** Su simulador ya dibujaba
el «sesgo tras ajustar por clases de x» y leía «el ajuste elimina X % del sesgo»; su nota decía que el
ajuste «lo corrige en parte». El módulo 3 presentaba después esas cifras como revelación («la misma
simulación traía la segunda columna»), y la pregunta del quiz sobre el 100,4 / 81,6 / −1,1 % estaba
asignada al **módulo 1**: quien la fallaba era enviado a repasar un módulo que no explica el ajuste. Es el
mismo defecto que T7.13 arregló en el capítulo 2 con los pesos. *Arreglo:* la introducción del simulador
presenta las barras naranjas como **adelanto del módulo 3**, con una línea de lo que hace el ajuste; la
nota remite al módulo 3; el 3 reconoce el adelanto; la pregunta pasa al **módulo 3**, y la afirmación 2
del módulo 9 dice «la simulación del módulo 1, leída en el módulo 3».

**2 · El módulo 2 presentaba como nueva la fórmula del sesgo de no respuesta.** Definición propia,
derivación y objetivo «escribir el sesgo como producto de dos factores», con casi las mismas palabras que
el capítulo 1, módulo 4 —«un producto de dos factores: cuánta gente falta y cuánto se diferencian»—, sin
puntero y con la notación cambiada en silencio ($r \to R$, $\bar y_M \to \bar y_{NR}$). El capítulo 1
prometía que el 8 la «formaliza»; el 8 la volvía a presentar. *Arreglo:* el objetivo dice «retomar», y la
definición abre diciendo que es la del capítulo 1 escrita con la notación de Lohr. Lo que el módulo
aporta —medirla con los no respondientes de Gnap, el estimador de dos fases, Meng— sigue intacto.

**3 · «Entonces se dijo "la muestra no era aleatoria". Ahora se puede decir cuánto».** El capítulo 1 ya
había medido el sesgo del *Digest* (−19,32 puntos, módulo 1) y su precisión equivalente (6,30 votantes,
módulo 7), y el propio módulo 2 lo admitía dos párrafos después. *Arreglo:* el título pasa a «con la
identidad de Meng», y el párrafo dice que el capítulo 1 midió cuánto y que aquí se ve de qué depende.

**4 · $R$ significaba dos cosas.** La tasa de respuesta en el módulo 2 ($R = 0{,}398$, el factor $1-R$) y
el R-indicator en el 7 ($R = 1 - 2S(\hat\phi) = 0{,}473$). La retro de la pregunta del módulo 7 usaba los
dos sentidos en la misma respuesta, y el simulador ponía «la encuesta real: R = 0,4733» junto a la tasa
global. *Arreglo:* el R-indicator se escribe $R(\hat\phi)$ —como $R(\rho)$ en Schouten et al.— en la
definición, con una frase que dice por qué, en el aviso, en el simulador (introducción y lectura) y en la
pregunta; también en un comentario de la cadena. En el capítulo, todo `R = ` que queda es la tasa.
**No se añadió** la fila del R-indicator al glosario, aunque el hallazgo la proponía: su columna de Lohr
pide saber si Lohr lo trae y con qué símbolo, y no hay copia de los capítulos 8 o 15 en el repositorio
para comprobarlo.

**5 · Dos «Hansen–Hurwitz».** El estimador de dos fases, $\hat{\bar y}_{HH}$ (1946), compartía subíndice
con el $\hat t_{HH}$ con reemplazo del capítulo 6, módulo 2. *Arreglo:* una frase que los distingue.

**6 · «Los siete capítulos anteriores suponen que quien es sorteado, responde».** El capítulo 1 trata
justamente de lo contrario. *Arreglo:* «los capítulos 2 a 7», con el capítulo 1 nombrado.

**7 · «La fracción de información perdida es 0,062» (módulo 6) sin definir**: solo existía como
`fmi = (1 + 1/m) * B / T_` en el bloque. *Arreglo:* se define en la misma frase.

**8 · Punteros.** El árbol del módulo 10 remitía el sesgo del estimador de razón (−38 963 acres) al
capítulo 3, módulo 3; está en el módulo 4 (*Sesgo y error cuadrático medio*). La definición del módulo 4
volvía a presentar post-estratificación y raking sin nombrar en el texto el capítulo 4 (módulo 10) ni el 7
(módulo 6); ahora los nombra.

**9 · «Imputar sube $n$ de 17 a 20 —eso baja el denominador—»** *(redacción)*: lo agranda, y por eso baja
el error estándar.

**10 · El signo del sesgo en el módulo 9** *(cifras)*: decía «el sesgo 1,102» donde el módulo 2 da
−1,10, porque R19 toma el valor absoluto y rotulaba la fila «sesgo». *Arreglo:* la prosa dice «cuyo sesgo
es de −1,102 horas» y «1,102 en valor absoluto»; la fila de R19 se llama `sesgo_abs`, con su salida real
pegada de nuevo (cambia la alineación, no las cifras).

**Verificado.** `verifica_bloques.py --prosa` sobre el capítulo: **458 de 458** cifras de bloques y
**140 respaldadas · 0 sin respaldo** (eran 139). `ensambla_cap8.py` reproduce el archivo **byte a byte**
en la segunda pasada. En el navegador, con el panel a 1280 × 900 —comprobado `innerWidth` antes de fiarse
de los lienzos—: los once módulos con **0 `.katex-error`** y **0 dólares sueltos**, los nueve lienzos —ocho
simuladores y el gráfico del quiz— con ancho real, consola sin errores; el adelanto del módulo 1, la definición y el párrafo del *Digest* del 2,
$R(\hat\phi)$ en la definición, el aviso y la lectura del simulador del 7, la fracción de información
perdida del 6, el signo del 9 y la hoja del árbol del 10 («Capítulo 3, módulo 4») salen como se
escribieron. El quiz queda repartido 1, 1, 3, 2, 2, 3, 3, 4, 5, 6, 7.

**Lo que enseña.** Con el 8 se cierra la auditoría de orden de los ocho capítulos, y el patrón de los dos
últimos es el mismo: **los capítulos de síntesis re-presentan lo que el curso ya construyó.** Los defectos
no estaban en usar algo antes de tiempo, sino en frases como «ahora se puede decir cuánto», «la misma
simulación traía» o una definición repetida sin puntero, que borran del mapa al capítulo donde la idea
nació. Y dos de los diez eran choques de nombre —$R$ aquí, «Hansen–Hurwitz» con el capítulo 6—, el mismo
tipo que el «deff de Kish» de T7.28: una etiqueta que el curso ya había atado a otra cosa.

**Pendiente:** el visto bueno de Javier para publicar. Antes del push, comparar `sitio/` contra
`origin/gh-pages` y `HEAD` contra el commit aprobado.

### T7.30 — La proporcional sí puede perder contra el MAS: el cap. 4 frente a Lohr 3.ª ed. (2026-09-17)

> Primera tarea del plan de mejora del capítulo 4 con Lohr 3.ª ed. Ese plan vive en
> `PLAN_Cap4_Lohr3e.md`, **fuera del control de versiones**, porque cruza el calendario del Corte 2
> con materiales de evaluación. Aquí se anota cada tarea cerrada, como siempre.

**El contexto.** Javier pidió mejorar el capítulo 4 con el `Sampling.epub` de Lohr, que es la 3.ª ed.
(2022). El material sigue la numeración de la 2.ª: en la 3.ª, el cap. 4 es razón y regresión, y lo que
corresponde a este capítulo está en el cap. 3 (estratificado) y en las §4.3–4.5 (dominios,
postestratificación, razón con muestreo estratificado). El diagnóstico encontró nueve errores ya
publicados y catorce contenidos ausentes. Se reparte en fases atadas al Corte 2: primero, antes de la
clase del 24–25 de septiembre, los errores de lo que se expone ese día. Los módulos M1–M11 no se
renumeran, porque los enlazan los caps. 5, 7 y 8.

**El defecto.** La definición de las tres asignaciones del M4 decía que la proporcional «nunca lo hace
peor que el MAS», y el M6, que unos estratos al azar «ni ganan ni pierden». Lohr (§4.4.1, ec. 4.11 de la
2.ª; §3.4.1, ecs. 3.12–3.13 de la 3.ª) da la identidad exacta y la condición para perder:
$\text{SSB} < \sum_h (1 - N_h/N)\,S_h^2$. Con estratos grandes casi nunca se cumple, pero no es imposible.

**El contraejemplo ya estaba publicado.** La partición al azar del M6 daba deff **1,0009**, y el texto la
redondeaba a «ni ganan ni pierden». *Arreglo:*
- **M4:** «con estratos grandes, casi nunca lo hace peor que el MAS; el módulo 7 da la condición exacta».
- **M6:** los estratos al azar «no ganan nada —en rigor pierden un pelo, 1,0009—».
- **M7:** una caja nueva junto a la identidad ANOVA, con la identidad, por qué casi nunca se cumple, las
  cifras y el aviso de que con una muestra concreta la varianza *estimada* sí puede salir peor. La cita se
  añade a las referencias.
- **Código:** R8 guarda la partición en `azar` (misma semilla, mismo orden de sorteo; su salida no cambió) y
  R9 calcula los dos lados de la condición. Por región, SSB vale **99 907** y la cota **689,6**; al azar,
  **14,4** y **541,6** (miles de millones). La identidad reproduce **exactamente** las diferencias de
  varianza del M6: 97 006 902,2 y −515 394,3.

**Verificado.** `ensambla_cap4.py` reproduce el archivo **byte a byte** en la segunda pasada;
`verifica_bloques.py --prosa`: **255 de 255** cifras de bloques (eran 246) y **75 respaldadas · 0 sin
respaldo** (eran 68). La primera pasada dejó una sin respaldo: la prosa decía «le añade 515 394» y la
salida es −515 394,3; el verificador captura el signo, y se reescribió con él. En el navegador, M4, M6 y
M7: **0 `.katex-error`**, **0 `$` sueltos** fuera del código y consola limpia.

**Publicado el 2026-09-17** con el visto bueno de Javier, junto con las otras dos tareas de la fase 1: ver el final de T7.32.

### T7.31 — El número de estratos y el R² que no era el de la variable (cap. 4, 2026-09-17)

Segunda tarea del plan de mejora del capítulo 4 con Lohr 3.ª ed. (`PLAN_Cap4_Lohr3e.md`, fuera del
control de versiones). **Tres defectos, los tres en la misma cadena de razonamiento**: cuánto rinde
partir en más estratos y por qué.

**1 · «La caída es casi nula después de $H \approx 6$» (M6), desmentido por su propio JSON.** El
barrido del capítulo va de deff **0,448** con seis estratos a **0,341** con diez: casi una cuarta
parte menos de varianza. *Arreglo:* rendimientos decrecientes —cada estrato nuevo gana menos que el
anterior—, pero la ganancia no se apaga.

**2 · «Por eso las encuestas reales rara vez pasan de pocos estratos por variable» (M6).** Lohr §3.5
dice lo contrario: *the more information you have, the more strata you should use… many surveys are
stratified to the point that only two sampling units are observed in each stratum*. *Arreglo:* el
texto se alinea con Lohr y explica el caso concreto —`acres87` predice `acres92` casi a la
perfección, así que cada corte más fino sigue rindiendo; con una variable peor, la curva se
aplanaría antes, porque lo que la variable no predice se queda dentro de cualquier estrato—. Se
conserva «rendimientos decrecientes», que es cierto.

**3 · «`acres87` ($R^2 \approx 0{,}46$ con la superficie del 92)» (M7).** Mezclaba dos erres
cuadradas. El 0,46 es el $R^2$ de la **partición en cuartiles**; la variable, como número, tiene
correlación **0,9951** con `acres92`. Tal como estaba, tapaba justo por qué partir más fino sigue
rindiendo (defecto 1). *Arreglo:* R9 imprime, para las cuatro particiones del M6, el $R^2$ de cada
una al lado del ahorro de varianza —46,09 contra 46,04; 18,00 contra 17,88; 1,37 contra 1,28; y
0,00 contra **−0,09**, el azar, que pierde—, y la prosa distingue los dos $R^2$. R8 calcula las dos
correlaciones (0,9951 y 0,147), que ahora citan las lecciones del módulo.

**Y un menor de paso:** «para la proporcional (ignorando los fpc), deff ≈ SSW/SST» era falso; en la
ec. 3.12 el fpc se cancela exacto y lo que hace falta es que los estratos sean **grandes**.

**Verificado.** `ensambla_cap4.py` byte a byte en la segunda pasada; `verifica_bloques.py --prosa`:
**270 de 270** cifras de bloques (eran 255) y **82 respaldadas · 0 sin respaldo** (eran 75). La
tabla nueva salía en notación científica (`-9e-04`) y se imprime en porcentajes, que es como la cita
la prosa. En el navegador, M4, M6 y M7: 0 `.katex-error`, 0 `$` sueltos fuera del código, consola
limpia y los tres textos viejos ausentes.

**Lo que enseña.** Los tres defectos se sostenían entre sí: el $R^2$ mal atribuido hacía plausible
que la ganancia se agotara pronto, y eso a su vez explicaba una supuesta práctica de las encuestas
reales. **Una cifra mal etiquetada no se queda quieta: fabrica la teoría que la justifica.** El
barrido que la desmentía llevaba publicado en el JSON del propio capítulo desde julio.

**Publicado el 2026-09-17** con el visto bueno de Javier, junto con las otras dos tareas de la fase 1: ver el final de T7.32.

### T7.32 — Las once citas a Lohr del capítulo 4, una a una (2026-09-17)

Tercera tarea del plan de mejora del capítulo 4 con Lohr 3.ª ed. Cierra su fase 1: lo que se expone
en clase el 24 y el 25 de septiembre.

**Las citas.** Se auditaron las **once** referencias a Lohr del capítulo contra los índices de las
dos ediciones. **Dos estaban mal:**
- **M7:** «§4.6 (2.ª ed.) / §3.4.3 (3.ª ed.): el modelo del muestreo estratificado». En la 3.ª,
  §3.4.3 es *Allocation for Specified Precision within Strata*; el modelo es **§3.6**.
- **M8:** «§7.5 (ambas ediciones): deff». Es §7.5 en la 2.ª y **§7.4** en la 3.ª (allí la 7.5 es
  NHANES).

Las otras nueve son correctas, incluida la «§6.2 (ambas ediciones)» del M9, que sí coincide.

**La retro del quiz del M8, que daba por mala una lectura correcta.** Decía: «Si te dio 225,
multiplicaste en lugar de dividir». Pero Lohr hace exactamente esa multiplicación al abrir su
capítulo —(300)(0,75) = 225— para responder la pregunta **inversa**: cuántas entrevistas
estratificadas igualan a un MAS de 300. El ítem pide la otra. La retro nombra ahora las dos cuentas
y dice cuál se pide, en vez de corregir a quien viene del libro.

**Dos menores más.** *(a)* El M11 atribuía a Lohr, «abriendo el capítulo», que una muestra
estratificada «bien hecha da estimaciones más precisas»: es la **cuarta razón para estratificar** de
§4.1 (2.ª) / §3.1 (3.ª), y así se cita. *(b)* El glosario daba el peso de Lohr como $w_i$; es
$w_{hj}$ (2.ª ed., ec. 4.8; 3.ª ed., §3.3).

**Y una línea de higiene del código:** `cadena.R` fijaba `survey.lonely.psu = "adjust"` sin decir
por qué. Ahora lo explica, y avisa de que en este capítulo **no se activa nunca** —el estrato más
pequeño de `agstrat` tiene 21 condados—. Esas líneas van antes del primer marcador de bloque, así
que la página no cambia por ello.

**Verificado.** Byte a byte en la segunda pasada; **270 de 270** cifras de bloques y **82 de prosa ·
0 sin respaldo**, sin cambios: esta tarea no toca ninguna cifra. En el navegador, las citas nuevas
en su módulo, el glosario del M2 renderizando $w_{hj}$, y el ítem 8 del quiz respondido con 225 dos
veces: sale la pista y después la retro nueva completa, con 0 `.katex-error` y consola limpia.

**Lo que enseña.** Una cita a un libro es una cifra más: nadie la ejecuta. De las once, las dos que
fallaban eran las de las secciones que **cambiaron de sitio entre ediciones**, que es justo donde
mirar cuando un material cita dos numeraciones a la vez.

**Publicado el 2026-09-17** con el visto bueno de Javier: la fase 1 entera (T7.30, T7.31 y T7.32),
`main` en **`1428cad`** y `gh-pages` en **`a705523`**. Comprobado sobre lo servido, no sobre el disco:
la página en vivo es **byte a byte** la de `1428cad` (`cmp` contra `git show`), con la frase «casi
nunca lo hace peor que el MAS» y sin la vieja, y con las citas §3.6 y §7.4.

**Cómo se publicó, porque no fue el `subtree push` de siempre.** En `main` había, además de la fase 1,
trabajo de **otras dos sesiones que toca el sitio** y que no tiene visto bueno para publicar: la
auditoría del capítulo 8 (`ff07796`) y una corrección del capítulo 3 (`7f9da4e`). Un
`git subtree push` de `HEAD` los habría publicado los dos, más la fase 2 del capítulo 4, que tampoco
estaba aprobada. Procedimiento usado, que deja publicado **exactamente** lo aprobado:

1. `git worktree add --detach <tmp> 1428cad` — un árbol aparte, para no mover archivos bajo las
   sesiones que trabajan en el directorio compartido;
2. en ese árbol, el capítulo 8 se devuelve a la versión **servida** hoy
   (`git show origin/gh-pages:muestreo/capitulo-8-...`), en un commit auxiliar que **no entra en
   `main`**;
3. `git subtree split --prefix sitio HEAD` → `a705523`, comprobado que `d8d7986` es su ancestro
   (avance rápido) y que su único cambio frente a `gh-pages` es el capítulo 4;
4. `git push origin a705523:gh-pages`, y el árbol temporal se retira.

Comprobado después: los capítulos 3 y 8 servidos siguen teniendo su tamaño anterior, así que no se
publicó nada ajeno.

**La fase 2 se publicó el 2026-09-17**: ver el final de T7.37.

### T7.33 — Cuánto cuesta de verdad decidir tarde: la prima de la postestratificación (2026-09-17)

Primera tarea de la fase 2 del plan de mejora del capítulo 4 con Lohr 3.ª ed.

**El defecto.** El M10 decía: «No alcanza al estratificado de diseño (16 380, porque este además
*fijó* los $n_h$ donde convenía), y esa diferencia es la prima que se paga por decidir tarde», y la
retro del quiz del M10 lo repetía. Dos cosas fallan: *(a)* 17 513 y 16 380 son errores estándar
**estimados con dos muestras distintas** —`agsrs` y `agstrat`—, así que su diferencia es sobre todo
el azar de cada sorteo; *(b)* `agstrat` es de asignación **proporcional**, no fijó nada «donde
convenía».

**La cifra que faltaba.** La prima se mide sobre la población, con la misma asignación en los dos
casos: el estratificado de diseño tiene error estándar verdadero **21 109,07** y el postestratificado
**21 272,24**, un **0,77 %**. Esa es toda la prima por tener los $n_h$ al azar en vez de fijados.
Calculada por dos vías, como manda el protocolo: el término de segundo orden, en el bloque R14; y
**200 000 muestras simuladas** en `genera_cap4.R`, que dan **21 298,8 ± 33,7** —a menos de un error
de Monte Carlo de la aproximación—, con `stop()` si las dos vías se separan más de cuatro errores.
Es la ruta que Lohr deja como ejercicio 40 de la 3.ª ed., sobre esta misma `agpop`.

**Y la mitad que sí es cara.** Quien estratifica al diseñar elige además la **asignación**: con
Neyman el error estándar verdadero baja a 17 291 frente a los 21 124 de la proporcional. Eso la
postestratificación no lo puede imitar, porque el sorteo reparte la muestra en proporción al tamaño
de cada estrato y no según su dispersión. La caja nueva del M10 separa los dos efectos; la retro del
quiz también.

**Verificado.** El JSON del precálculo ganó **seis campos** y ningún otro cambió (comparado campo a
campo contra la versión anterior); `ensambla_cap4.py` byte a byte; `verifica_bloques.py --prosa`:
**273 de 273** cifras de bloques (eran 270) y **87 de prosa · 0 sin respaldo** (eran 82). En el
navegador, el M10: la caja nueva con sus seis cifras, 0 `.katex-error`, 0 `$` sueltos, consola limpia
y la retro del quiz renderizada tras fallar el ítem. `genera_cap4.R` pasa de 1,9 s a 9,8 s.

**Lo que enseña.** Comparar dos cifras **estimadas con muestras distintas** y llamar a la diferencia
un efecto es el mismo error que T7.18 encontró en el deff medido en dos escalas, ahora en la
dirección contraria: allí se comparaban un exacto y un estimado; aquí, dos estimados de sorteos
distintos. La regla que sale de las dos: **un efecto se mide sobre la población, o con la misma
muestra; nunca cruzando muestras.**

**Publicado el 2026-09-17** con el visto bueno de Javier, junto con el resto de la fase 2: ver
el final de T7.37. **Sigue pendiente** la clave E1 (ii) y el mérito de P21 del Taller 2, que
siguen pidiendo la frase vieja y los decide Javier con esa sesión.

### T7.34 — La fórmula que Lohr sí publica para la postestratificación (2026-09-17)

Segunda tarea de la fase 2 del plan del capítulo 4 con Lohr 3.ª ed.

**El defecto.** La caja «Dos errores estándar para el mismo estimador» del M10 llamaba a la varianza
**condicional** «la recomendación clásica de Lohr». No lo es: lo que Lohr publica en §4.4 es la
**ec. 4.27**, la varianza de la asignación proporcional usada como aproximación —
$\hat V = (1 - n/N)\sum_h W_h s_h^2/n$—, que vale **solo para un MAS** y pide postestratos con unos
**30 casos esperados**. Sobre `agsrs` da **17 442,6**, que es el 17 443 de su Ejemplo 4.9, con esta
misma muestra: una cifra que el capítulo no tenía en ningún sitio.

**El arreglo.** El bloque R14 pone las tres en fila —Lohr 17 442,6 · `survey` 17 513,4 · condicional
a los $n_h$ observados 17 635,0— y la caja pasa a «**Tres** errores estándar», con la fórmula de
Lohr escrita y sus dos condiciones. De paso: el umbral «$n_h \geq 20$» de la nota y del quiz pasa a
«del orden de 30 casos esperados por celda», que es el de Lohr y ya no va sin fuente; y el comentario
de `genera_cap4.R` deja de llamar «Lohr 4.4, ecuación clásica» a la condicional.

**Verificado.** Byte a byte; **277 de 277** cifras de bloques (eran 273) y **89 de prosa · 0 sin
respaldo** (eran 87); `genera_cap4.R` reproduce su JSON. En el navegador: la caja con las tres
cifras, el bloque con su fila `lohr_4.27`, el quiz con el umbral nuevo, 0 `.katex-error`, 0 `$`
sueltos y consola limpia.

**Lo que enseña.** El material llevaba desde julio citando a Lohr para una fórmula que no es la suya,
y la pista estaba a la vista: el libro publica una cifra para este mismo ejemplo y el capítulo no la
tenía. **Cuando la fuente trae el número del caso que uno está usando, calcularlo es la manera más
barata de comprobar que se la está citando bien.**

**Publicado el 2026-09-17** con el visto bueno de Javier, junto con el resto de la fase 2: ver el final de T7.37.

---

### T7.57 — El intercepto que el capítulo 3 leía como señal y era ruido (cap. 3, 2026-09-17)

Primera tarea del plan de mejora del capítulo 3 con Portela & Villeta, cap. 7 (§7.1–§7.2), que vive
en `PLAN_Cap3_PortelaVilleta.md`, fuera del control de versiones. Cierra su fase 1 a medias: queda
la T1.2, la regla del módulo 3.

**El defecto.** El módulo 6 abría diciendo que sobre `agsrs` «el ajuste libre da una pendiente de
0,995 y un intercepto de **−2 548** acres. Ese intercepto no nulo es la **señal** de que hay un
estimador mejor esperando». No lo es: ese intercepto tiene un error estándar de **2 425**, o sea
$t = -1{,}05$ y **p = 0,294**. No se distingue de cero. La frase presentaba como evidencia lo que es
ruido, y justo donde Portela §7.2.3 pone el criterio formal para decidir entre razón y regresión.

**El capítulo ya se contradecía a sí mismo, y nadie lo había visto.** El módulo 3, hablando del mismo
simulador, dice que en `agsrs` «la recta por el origen y la de intercepto libre **se superponen**,
porque el intercepto es −2 548 sobre un rango de más de un millón de acres, **prácticamente cero**».
Y el módulo 7 concluye que «los tres estimadores con auxiliar están **empatados en la práctica**».
Los módulos 3 y 7 tenían razón; el 6 era el que iba solo.

**El arreglo.** La apertura del M6 plantea ahora la pregunta antes de contestarla —¿pide `agsrs` que
se suelte el origen?— y la contesta con el contraste: no lo pide, y **por eso** el M7 va a encontrar
a los tres empatados. La motivación del estimador de regresión pasa a ser la correcta: el origen no
siempre se puede suponer, y no hace falta salir del capítulo para verlo — en `cherry` el mismo
contraste da **p = 7,6 · 10⁻¹²**.

**El criterio, con su letra pequeña** (nota nueva). Ajustar la recta libre y mirar el p-valor del
intercepto; si no es significativo, razón (un parámetro menos); si lo es, regresión. Y tres avisos
que el contraste no da solo: *(a)* **lleva el diseño dentro** —el de `lm()` supone iid, así que el
bloque lo repite con `svyglm()`: misma conclusión (p = 0,294 y p = 0,338) pero ee de diseño **mayor**,
2 654 contra 2 425, porque la dispersión crece con $x$—; *(b)* **no rechazar no es demostrar**, y con
$n$ pequeño casi nada se rechaza; *(c)* $b_1 = s_{xy}/s_x^2$ es **sesgado** —con $S_x^2$ conocida,
$s_{xy}/S_x^2$ sería insesgado—, así que la ventaja de la regresión se cobra en un parámetro más.

**El código.** El bloque **R5** de `cap3/cadena.R` abre ahora con el contraste por las dos vías
(`lm` y `svyglm`) antes de construir el estimador. El bloque **S2** —los cerezos del ejercicio 2 del
M12— imprime además la tabla de coeficientes completa, y para ello baja el `scipen` que el R1 había
subido a 999: sin eso el p-valor salía como `0,000000000007621`. Ninguna cifra escrita a mano.

**Verificado.** `ensambla_cap3.py` reproduce el archivo **byte a byte** en la segunda pasada (mismo
SHA-256). **171 de 171** cifras de bloques y **97 de prosa · 0 sin respaldo** (el `--solo-prosa
--todos` de los ocho capítulos también queda en 0). En el navegador: 0 `.katex-error` con 22
expresiones en el M6, consola limpia, las dos notas y las tres referencias en su sitio, y el M12
mostrando la salida nueva del S2. La duración del M6 sube de 20 a 24 min en `courseData`.

**Lo que enseña.** Una cifra puede estar bien calculada y aun así sostener una afirmación falsa. El
−2 548 era correcto —lleva meses publicado y verificado— y lo que fallaba era lo que se decía de él:
nadie le había preguntado por su error estándar. Y la contradicción llevaba tres módulos en pie sin
que ninguna comprobación automática pudiera verla, porque ninguna de las tres frases es una cifra.

**Pendiente:** el visto bueno de Javier para publicar.

### T7.35 — Qué varianza calcula `survey` en la postestratificación: la etiqueta, revisada (2026-09-17)

Cierra lo que T7.34 dejó abierto, con el visto bueno de Javier. **Revisa una conclusión de T7.27
(R16 del Taller 2)**, así que conviene leer las dos seguidas.

**Qué decía el M10 desde T7.27.** Que `survey` «lineariza los residuos con los $n_h$ que salieron, de
modo que su cifra es una forma de la *condicional*, no de la incondicional».

**Qué se comprobó ahora, ejecutando.** Sobre `agsrs`, las cuatro cifras: ec. 4.27 de Lohr
(incondicional, aproximada) **17 442,6**; con su término de segundo orden, **17 538,1**; `survey`
**17 513,4478**; condicionada a los $n_h$ observados, **17 635,0**. Es decir, **`survey` cae más cerca
de la incondicional que de la condicional**, al revés de lo que decía la frase.

**Y lo que sí se sostiene, que es la mitad buena de T7.27.** La receta de §4.1.4 de Lohr —ponderar los
residuos de cada postestrato con $g_h = N_h/\hat N_h$ y aplicar la varianza del MAS— reproduce la
cifra de `survey` **al decimal**: 17 513,4478 por las dos vías. El bloque R14 lo hace ahora a la
vista. Lo que no se seguía era la **inferencia**: que usar los $n_h$ observados al calcular convierta
esa varianza en la condicional. No lo hace — los $n_h$ entran como datos; la varianza de diseño del
estimador calibrado promedia sobre todas las muestras que el MAS pudo dar, los $n_h$ incluidos.

**La frase, ahora.** «`survey` no calcula ninguna de las dos. Trata la postestratificación como lo que
es —una calibración— y estima la varianza de diseño del estimador calibrado […]. Por eso su cifra
queda del lado de la incondicional, entre la aproximación de Lohr y la forma condicional.» El
comentario HTML de al lado guarda las cuatro cifras y la historia de las dos revisiones.

**Lo que NO se ha tocado, y hay que mirar:** la **clave de E2** del Taller 2 y su informe de IA dicen
que `survey` calcula la condicional y llaman incondicional a la fórmula del texto —que es la
condicional **más** un término de segundo orden, y tampoco es la incondicional de Lohr—. El
**enunciado** no depende de la etiqueta desde R16 (b), que puso la fórmula en la regla de forma 6.
Decisión pendiente de Javier con esa sesión.

**Verificado.** Byte a byte; **281 de 281** cifras de bloques (eran 277) y **90 de prosa · 0 sin
respaldo**. En el navegador, el M10: la frase nueva, el bloque con `survey` y `receta_4.1.4` dando la
misma cifra, 0 `.katex-error`, 0 `$` sueltos y consola limpia.

**Lo que enseña.** Una etiqueta se corrige como una cifra: ejecutando. T7.27 arregló una frase falsa
con un argumento medio bueno —el mecanismo era cierto, la conclusión no— y nadie lo notó porque el
mecanismo sonaba convincente. **Cuando la justificación de una etiqueta es «porque usa X al
calcular», hay que preguntar qué promedia la fórmula, no qué usa.**

**Publicado el 2026-09-17** con el visto bueno de Javier, junto con el resto de la fase 2: ver el final de T7.37.

---

### T7.36 — La regla del módulo 3 del cap. 3: demostrada, evaluada y con su rival dicho (2026-09-17)

Segunda tarea del plan del capítulo 3 con Portela & Villeta (`PLAN_Cap3_PortelaVilleta.md`). Cierra
su fase 1.

**Lo que estaba.** El módulo 3 cerraba su caja «Cuál pide cada nube» con una frase suelta: «Frente a
la expansión, la regla es que la razón gana cuando $r > \tfrac12\text{CV}(x)/\text{CV}(y)$». La
regla es correcta —es el teorema de la p. 218 de Portela— pero llegaba **sin demostración**, **sin
evaluarse nunca sobre los datos del capítulo** y con el rival en una subordinada que es fácil no
leer. Un estudiante podía aplicarla al ejercicio 2 del módulo 12 —los cerezos— y concluir lo
contrario de lo que ese ejercicio enseña.

**Por qué importa esa subordinada.** En `cherry` el umbral vale **0,2174** y la correlación
**0,9671**: la regla **se cumple de sobra**, y aun así el estimador de razón es el equivocado. No
hay contradicción, y ese es justo el punto: la desigualdad sale de comparar la razón con la
**expansión**, así que solo dice que la razón le gana a la expansión —cierto también en los
cerezos—. Lo que no dice, porque no es su pregunta, es que no haya nada mejor que las dos.

**El arreglo, en tres piezas.**
- **La regla, con su rival en negrita y con cifras**: en `agsrs` el umbral es **0,4937** frente a
  una correlación de **0,9958**.
- **Una `.derivacion` plegable nueva** (`der-umbral`, cuatro pasos): las dos varianzas una encima de
  otra, la resta, la sustitución $B = \bar y_U/\bar x_U$ y $S_{xy} = \rho S_xS_y$, y el despeje. Con
  las tres lecturas: que si las variabilidades relativas se parecen el umbral se queda en
  $\rho > 0{,}5$; que es un umbral **poblacional** y en la práctica se evalúa con $r$ y los
  $\widehat{\text{CV}}$; y que **compara con la expansión y con nadie más**.
- **La advertencia del final del módulo** —«correlación alta no es lo mismo que recta por el
  origen»— abre ahora reconociendo que el umbral tampoco lo detecta, con las dos cifras de `cherry`.

**El código, en las dos pestañas.** Los bloques **R4** y **P2** imprimen, después de sus seis cifras
de siempre, una tabla de dos filas con $r$ y el umbral en `agsrs` y en `cherry`. Las dos pestañas
dan las mismas cuatro cifras, que es la disciplina que T7.19 impuso a este mismo par de bloques.

**Verificado.** Byte a byte en la segunda pasada. **179 de 179** cifras de bloques y **100 de prosa ·
0 sin respaldo**. En el navegador: 0 `.katex-error` con 56 expresiones en el módulo, la derivación
abre y cierra con su `aria-expanded` (18 expresiones y 4 pasos dentro), las dos pestañas muestran la
tabla nueva y la consola queda limpia. El M3 sube de 22 a 25 min en `courseData`.

**Lo que enseña.** Una regla sin su condición de aplicación es una trampa, no un atajo: el material
la llevaba publicada con el rival dicho de pasada, y el propio capítulo tenía el contraejemplo dos
cajas más abajo sin que nadie hubiera cruzado los dos. Evaluar la regla sobre los datos del
contraejemplo —y ver que la pasa— es lo que convierte la advertencia en argumento.

**Pendiente:** el visto bueno de Javier para publicar.

---

### T7.37 — La postestratificación es una razón: el M10 del cap. 4 lo dice y lo muestra (2026-09-17)

Tercera y última tarea de la fase 2 del plan del capítulo 4 con Lohr 3.ª ed. (tareas B4 y B11).

**Lo que faltaba.** El M10 enseñaba el peso postestratificado $N_h/n_h$ como una receta: aparecía
hecho, sin decir de dónde sale. Lohr lo deriva en §4.4 —ecs. 4.26 a 4.29— como **estimación por
razón dentro de cada postestrato**, con el indicador de pertenencia como variable auxiliar, y de ahí
saca los pesos generales, válidos para cualquier diseño de partida y no solo para un MAS. El
capítulo tenía además la pieza que hacía falta para verlo y no la mostraba: $\hat N_h$, el tamaño que
la propia muestra estima para cada región. Sin esa columna, «calibrar» era una palabra.

**El arreglo, en cuatro piezas.**
- **La columna que faltaba**, en el bloque **R13**: $\hat N_h$ = **1 097,82 · 246,24 · 1 333,80 ·
  400,14**, que es la Tabla 4.4 del Ejemplo 4.9 de Lohr. Los 107 condados del Norte-Centro por 10,26
  dan 1 097,82 y el marco dice 1 054; el peso nuevo es el viejo por $N_h/\hat N_h$, y así se lee.
- **Una `.derivacion` plegable nueva** (`der-post-razon`, cuatro pasos): indicador $x_k$ con
  $t_x = N_h$ conocido → $\hat N_h$ y $\hat t_{yh}$ con los pesos de partida → la razón del capítulo 3
  da $\hat t_{yh,r} = N_h\bar y_h$ → sumando sobre los $H$ sale la fórmula de la definición, y en
  pesos $w_k^* = (N_h/\hat N_h)\,w_k$ para cualquier diseño.
- **El contraste que le da nombre a «calibración»**, al final del R13 y en prosa: la razón del
  capítulo 3 calibra contra **un solo** total, su $g = 1{,}0366$ es el mismo para todos, deja el peso
  en **10,6359** —el que aquel capítulo ya mostraba en su M10— y sus pesos suman **3 190,7684**, no
  $N$. La postestratificación cuadra cada $N_h$, y por eso su suma, **3 078**, cuadra de propina.
- **Un `.note` de cierre**, «Estrato, dominio y postestrato: las mismas cuatro regiones, tres
  papeles»: en el estrato los $n_h$ se fijan antes de sortear; en el dominio son aleatorios; el
  postestrato es un dominio cuyo $N_h$ se conoce, y eso es lo **único** que lo distingue. Las
  $\bar y_h$ de este módulo son las medias de dominio que el capítulo 3 estimó con esta misma
  muestra. Referencia nueva a Lohr §3.3 (2.ª) / §4.3 (3.ª).

**Verificado.** Byte a byte. **293 de 293** cifras de bloques (eran 281) y **95 de prosa · 0 sin
respaldo**. En el navegador: la derivación abre con sus 4 pasos y 13 fórmulas, 0 `.katex-error`,
ningún `$` suelto fuera del código y consola limpia.

**Lo que enseña.** El capítulo enseñaba tres cosas —razón, dominios, postestratificación— como tres
recetas, y son la misma con distinta información sobre $N_h$. Lo que las cose no es una explicación
más, sino **la cifra intermedia que la receta escondía**: en cuanto $\hat N_h$ está impreso al lado
de $N_h$, el peso deja de ser una fórmula que memorizar y pasa a ser una corrección que se lee.

**Publicado el 2026-09-17** con el visto bueno de Javier: la fase 2 entera (T7.33, T7.34 —la del
cap. 4—, T7.35 y T7.37), commit `70169c3` de `main` → gh-pages `f122297`. Solo cambió el capítulo 4;
los capítulos 3 y 8, que `main` lleva tocados por otras sesiones sin aprobación, quedaron en la
versión servida (comprobado en vivo: sus md5 no se movieron). El procedimiento del árbol aparte de
T7.32, con un cambio: esta vez el `git subtree split` **no** daba avance rápido, porque el commit
auxiliar de la publicación anterior no es ancestro de `main`. Se conservó su árbol exacto y se
colgó de `a705523` con `git commit-tree`, así que gh-pages avanzó en línea recta sin reescribir
historia. Verificado en vivo: el capítulo 4 servido es byte a byte el del commit aprobado
(md5 `ff04601de94f3ac18e3082ed164665c1`).

---

### T7.38 — «¿Y si solo tengo una muestra?»: la cota del sesgo en el M4 del cap. 3 (2026-09-17)

Tercera tarea del plan del capítulo 3 con Portela & Villeta (`PLAN_Cap3_PortelaVilleta.md`), primera
de su fase 2.

**El hueco.** El módulo 4 mide el sesgo del estimador de razón con **200 000 réplicas por tamaño**
sobre una población que se conoce entera, y concluye —bien— que es despreciable. Pero ninguna de las
dos cosas existe en una encuesta de verdad: allí hay **una** muestra y una población que justamente
se quiere estimar. El módulo cerraba sin decir qué hacer en esa situación, que es la única que el
estudiante va a encontrarse.

**Lo que se añade.** La cota del sesgo relativo (Portela & Villeta, §7.1.2, p. 212):

$$\frac{\lvert\,\text{Sesgo}(\hat B)\,\rvert}{\sqrt{V(\hat B)}} \;\le\; \text{CV}(\hat{\bar x})
  \;=\; \text{CV}(x)\sqrt{\tfrac{1-f}{n}}$$

Sale de que el sesgo es $\lvert\operatorname{cov}(\hat B, \hat{\bar x})\rvert/\bar x_U$ y de que una
covarianza no supera el producto de las desviaciones, o sea de $\lvert\rho\rvert \le 1$. Dos
propiedades que el módulo dice explícitamente: es **conservadora** por ese mismo motivo, y es
**invariante de escala**, así que vale igual para $\hat B$, para la media de razón y para $\hat t_r$.

**Las cifras.** Sobre `agsrs`, $\widehat{\text{CV}}(\hat{\bar x}) = \mathbf{0{,}0626}$ — lo único que
se tendría en campo. La cota verdadera, calculable solo porque `agpop` es un censo, es
**0,0750**: la muestra la subestima, por la misma razón por la que se quedó corta en $t_x$. Y el
sesgo relativo que las 200 000 réplicas midieron de verdad es **0,0055**, catorce veces por debajo de
su cota.

**Una tercera vía de control sobre la simulación.** `genera_cap3.R` añade a `tabla_sesgo` la columna
`cotaKish` y **aborta si la cota falla en cualquiera de los nueve tamaños**. Se cumple en todos. Si
alguna vez fallara, o la cota está mal escrita o la simulación está mal hecha.

**La regla de Kish, con su umbral en esta población.** Si $\widehat{\text{CV}}(\hat{\bar x})$ no pasa
de 0,1–0,2, el sesgo es despreciable. Despejando $n$ de $\text{CV}(x)\sqrt{(1-n/N)/n} = 0{,}2$ sale
**n = 47**: con menos, la regla **no** lo da por despreciable — y en efecto el simulador enseña
**−1,5 millones** de acres en $n = 10$. Los 300 de `agsrs` están holgadamente al otro lado. Y como la
fórmula tiene tres factores, dice también dónde tocar cuando la cota sale grande: proporcionalidad,
$\text{CV}(x)$ bajo y $n$ grande. El primero es **la misma condición que el módulo 3 pedía por
precisión**, cobrando ahora por segunda vez.

**Y una advertencia que faltaba.** Los intervalos de este capítulo usan un estimador de varianza
deducido **suponiendo el sesgo nulo** y se centran en un estimador que no lo es. No es un descuido:
es una decisión amparada en esa cota, y cuando la cota **no** es pequeña el intervalo está mal
centrado y su cobertura real no es la nominal, sin que nada en la salida lo advierta.

**Verificado.** Byte a byte en la segunda pasada. **179 de 179** cifras de bloques y **106 de prosa ·
0 sin respaldo** (el `--solo-prosa --todos` de los ocho capítulos, también 0). En el navegador: 45
expresiones KaTeX con 0 `.katex-error`, la fórmula nueva en modo display, los **dos simuladores del
módulo siguen vivos** —el de barras con sus 4 series y el de dispersión— con sus lecturas correctas,
y la consola limpia. El M4 sube de 22 a 28 min.

**Lo que enseña.** El material tenía la medición más cara del capítulo —1,8 millones de muestras— y
le faltaba la cuenta de una línea que responde la pregunta de verdad. Medir con una población que se
conoce entera demuestra el hecho; no enseña a decidir. Las dos cosas hacen falta, y ahora la
simulación sirve además para **comprobar la cota**, que es un uso que antes no tenía.

**Pendiente:** el visto bueno de Javier para publicar.

---

### T7.39 — El $n$ que nadie había decidido: el M5 del cap. 4 lo despeja (2026-09-17)

Primera tarea de la fase 3 del plan del capítulo 4 con Lohr 3.ª ed. (tareas B1 y B5). **La fase 3
se adelantó**: el plan la ponía «después del 9 de octubre», pero la restricción R2 dice que cambiar
un módulo *antes* de su clase no confunde, y M3–M6 se dictan el **24 y el 25 de septiembre**.
Después del 9 esas clases ya habrían pasado.

**Lo que faltaba.** Los módulos 4 y 5 repartían $n = 300$ de tres maneras, discutían cuál reparte
mejor y **nunca decían de dónde salió el 300**. Era un dato caído del cielo, justo al revés de como
se trabaja: se fija la precisión y se despeja el tamaño. Lohr lo cierra en §3.4.5 (ecs. 3.16–3.18) y
el capítulo no lo tenía.

**El arreglo, en dos bloques nuevos** —`R7B` y `R7C`, con el sufijo que ya usaban `R6B`/`R6C`, para
no renumerar de R8 en adelante—.
- **El ancla es el capítulo 2**, misma población y misma variable: el 10 % de error relativo sobre
  `acres92` pedía allí **595** condados. Estratificando bajan a **506** (proporcional), **462**
  (igual), **356** (Neyman) y **368** (con costos). La cuenta es la misma con $S^2$ cambiado por
  $v = \sum_h W_h^2S_h^2/a_h$, y **el MAS sale del mismo código como el caso $H = 1$, reproduciendo
  los 595 exactos**: la mejor comprobación de que la fórmula quedó bien puesta.
- **La fila $v/S^2$** —**0,821 · 0,749 · 0,577 · 0,596**— es el deff **sin fpc**, y casi repite la
  tabla del M4. El capítulo ya tenía esas cifras; ahora se ven leídas como ahorro de muestra.
- **Dos identidades comprobadas en R** (`TRUE TRUE`): con proporcional $v = \sum W_hS_h^2$ y con
  Neyman $v = (\sum W_hS_h)^2$. Y la observación que ordena el trabajo: **$v$ depende de cómo se
  reparte, no de cuánto**, así que la asignación se elige antes que el tamaño.
- **Multivariable**, que es el cierre explícito de §3.4.5: con la misma proporcional, `farms92` se
  conforma con **214** y `acres92` exige **506**. Manda el mayor.
- **Estratos de certeza (B5)**, pegados a la advertencia del truncamiento, que hasta ahora dejaba el
  recorte como un remiendo: los **31** condados mayores son el **1,01 %** del marco y el **9,66 %**
  de lo sembrado; sin ellos la desviación cae de **424 686,68** a **309 673,43**. Censarlos deja el
  tamaño en **316** frente a 506, y 31 de esos 316 no son muestra sino censo. Con su advertencia: el
  corte se hace con `acres87` (correlación **0,9951**), no con la variable que aún no se ha medido —
  la trampa circular del cap. 2 otra vez.

**Tres correcciones propias antes de cerrar.** Había escrito «una sexta parte menos de trabajo de
campo» cuando 506 → 316 es **más de un tercio**; el nombre de la encuesta del Ej. 3.8 es Encuesta de
Empleo, **Nóminas y Horas** de Canadá; y el encabezado `<h3>` que había puesto era un patrón de una
sola vez en todo el material, así que se cambió por la apertura en negrita que el capítulo ya usa.
También se quitó un «15 000» que venía del libro y no de un bloque: registrarlo obligaba a tocar
`cifras_prosa.json`, que la sesión del cap. 3 tenía con cambios sin commitear.

**Verificado.** Byte a byte; **317 de 317** cifras de bloques (eran 293) y **102 de prosa · 0 sin
respaldo** (eran 95); `anota_salidas.py --check` sin diferencias. En el navegador: 29 expresiones
KaTeX en el M5, 0 `.katex-error`, tres bloques y consola limpia. M5 pasa de 18 a **28 min** en
`courseData`, los ~10 que preveía la sección 4 del plan.

**Lo que enseña.** El capítulo enseñaba a repartir una muestra sin haber enseñado a decidirla, y el
hueco no se veía porque el 300 venía de Lohr y **parecía un dato del problema**. La señal de que
faltaba algo estaba en el capítulo 2: tenía la pregunta resuelta para el MAS y nadie había vuelto a
ella. **Un capítulo posterior que no reusa el resultado del anterior suele estar escondiendo un
hueco, no ahorrando repetición.**

**Publicado el 2026-09-17** con el visto bueno de Javier, junto con el resto de la fase 3: ver el final de T7.45.

---

### T7.40 — El empate de los tres estimadores es un teorema: el M7 del cap. 3 (2026-09-17)

Cuarta tarea del plan del capítulo 3 con Portela & Villeta. **Cierra su fase 2**, la que había que
tener antes del repaso del Parcial 2.

**Lo que había.** El módulo 7 ponía los cuatro estimadores en una tabla y observaba que «los tres
estimadores con auxiliar están empatados en la práctica». Cierto, y sin ninguna explicación: el
lector no sabía si era una casualidad de `agsrs` o algo que tenía que pasar.

**Tiene que pasar, y la cuenta cabe en tres líneas.** Los cuatro estimadores son **uno solo con
cuatro valores de $b$** —$\hat t(b) = N[\bar y + b(\bar x_U - \bar x)]$, con $b = 0$, $B$, $1$ y
$b_1$—, su varianza aproximada es una **parábola en $b$** cuyo mínimo está en $b_1 = S_{xy}/S_x^2$, y
la distancia de cualquier otro $b$ a ese mínimo es un **cuadrado perfecto**:

$$V(b) - V(b_1) = \frac{1-f}{n}\left(b\,S_x - \rho\,S_y\right)^2 \;\ge\; 0$$

De ahí salen las dos desigualdades de Portela (§7.2.3, p. 228) de golpe, **con sus condiciones de
igualdad**: frente a la expansión el hueco se anula solo si $\rho = 0$; frente a la razón, solo si
$B = b_1$, **que es exactamente decir que la recta pasa por el origen** — el contraste que T7.57 puso
en el módulo 6. Las tres tareas de la fase quedan cosidas por esta identidad.

**Medido sobre `agpop`, que es censo.** Con $n = 300$, los errores estándar **verdaderos** del total:
expansión **71,70** millones, regresión **7,1114** (el mínimo), razón **7,1298** (un **0,26 %** por
encima) y diferencia **7,1749** (**0,89 %**). El empate no es retórico: $B = 0{,}9797$ y
$b_1 = 0{,}9868$ se parecen tanto que el cuadrado perfecto no llega a abrirse.

**Una cuarta vía de control, gratis.** El error estándar que la fórmula aproximada da para la razón,
**7 129 751**, y el que midieron las **200 000 réplicas** del módulo 4, **7 106 715**, se separan un
**0,32 %**. Son dos caminos independientes —aproximación de primer orden y simulación— y coinciden en
tres cifras: la aproximación del módulo 2 queda contrastada sin gastar nada.

**Y la trampa que había que desactivar.** En la tabla publicada la regresión sale con el **ee más
grande** de los tres (5,59 frente a 5,54 de la razón), justo lo contrario de lo que acaba de
demostrarse. Un `.warning` nuevo separa las tres cosas: *(a)* el teorema compara varianzas
**verdaderas** y la tabla enseña **estimaciones** de una sola muestra, que se quedan cortas las tres
(5,3–5,6 frente a 7,11); *(b)* la cifra de la regresión es la de `survey` con los pesos $g_k$ —con la
fórmula clásica sale **5 330 862**, por debajo de la razón, tal como predice el teorema—; y *(c)* los
huecos reales, 0,26 % y 0,89 %, son mucho menores que el error con que se estima cualquiera de los
tres, así que **ninguna muestra puede resolver ese orden**, y ésa es la conclusión.

**El reverso honesto**, en el último paso de la derivación: todo vale para el $b_1$ óptimo y
**conocido**; con $\hat b_1$ estimado la ventaja es asintótica, y si la relación lineal es débil es
preferible la expansión aunque el teorema diga que no puede perder.

**Verificado.** Byte a byte en la segunda pasada. `genera_cap3.R` comprueba el cuadrado perfecto en
relativo y **aborta** si el mínimo no cae en la regresión o si la aproximación se separa más de un
1 % de la simulación. **179 de 179** cifras de bloques y **119 de prosa · 0 sin respaldo** (los ocho
capítulos, 0). En el navegador: 0 `.katex-error` en los módulos 3, 4, 6 y 7, la derivación nueva
abre con sus 4 pasos y 17 expresiones, la tabla-ranking sigue con sus cuatro filas y la consola
limpia. El M7 sube de 18 a 24 min.

**Un defecto de maquetación encontrado de paso, y NO tocado.** La fórmula del sesgo que abre el
**módulo 4** —la que ya estaba— se sale de su caja: **632 px en una columna de 506** con la ventana a
1 000 px. Es anterior a todo este trabajo (está en `7f9da4e^`). Se detectó midiendo
`scrollWidth`/`clientWidth` de cada `.katex-display`. Queda anotado, sin tocar.
> **Corregido en T7.42:** esto no era un caso aislado ni se arregla partiendo fórmulas. El barrido a
> 375 px encontró **14 fórmulas desbordadas en 9 de los 12 módulos**, y a 1 280 px no desborda
> ninguna. Es un problema de CSS —`.katex-display` con `overflow-x: visible`— y su arreglo es una
> línea en el componente, retropropagada a los ocho capítulos.

**Lo que enseña.** «Están empatados en la práctica» era una observación; con el cuadrado perfecto es
una predicción con su condición. Y el teorema resultó valer sobre todo para explicar **por qué la
tabla no lo obedece**: cuando lo que se compara son estimaciones, un orden verdadero de dos décimas
de por ciento es sencillamente inobservable.

**Pendiente:** el visto bueno de Javier para publicar.

---

### T7.41 — «Óptima, ¿para qué variable?»: el M4 del cap. 4 lo mide (2026-09-17)

Segunda tarea de la fase 3 del plan del capítulo 4 con Lohr 3.ª ed. (tareas B2, B8, B10 y B12).

**El defecto.** El M4 ya **afirmaba**, en la última nota, que «la asignación óptima para *una*
variable no es la óptima para otra». Lo decía y no lo mostraba: ni una cifra, ni una segunda
variable, ni la salida. Una afirmación sin demostración en un módulo que por lo demás mide todo
sobre la población entera.

**El arreglo, en cinco piezas.**
- **El mismo deff con dos varas** (bloque `R6B` nuevo). Con `acres92`: **0,8224 · 0,7416 · 0,5510**.
  Con `farms92`, que correlaciona **0,147** con ella: **0,9723 · 1,1540 · 1,1190**. La proporcional
  es la única que queda bajo 1 en las dos; la igual y la Neyman de `acres92` dejan `farms92`
  **peor que un MAS del mismo tamaño**. Eso le da sentido a la proporcional, que hasta aquí parecía
  la opción tímida: es la única que no necesita saber qué se va a medir.
- **La familia de potencia** $n_h \propto N_h S_h^{\alpha}$, de proporcional ($\alpha=0$) a Neyman
  ($\alpha=1$), que **reproduce exactamente las columnas del R6 en los dos extremos** —comprobación
  cruzada que salió gratis—. En medio está lo bueno: $\alpha = 0{,}25$ da **0,6919 / 0,9237**, mejor
  que la proporcional *en las dos varas a la vez*, y $\alpha = 0{,}5$ da **0,6108 / 0,9304**.
- **El otro compromiso de Lohr**: piso de 20 por estrato y resto proporcional → **0,75 / 0,9491**,
  con el argumento que la fórmula no mira (que ningún estrato quede sin poder estimar su $s_h^2$).
- **B8 como cuarto paso de la derivación**: $V_{prop} - V_{Ney} = \frac{1}{n}\sum_h W_h(S_h-\bar
  S)^2$ — **la ganancia de Neyman es la dispersión de las dispersiones**, y vale cero si todas las
  $S_h$ coinciden. Las dos vías dan **146 643 787**. Con el corolario: si $S_h/\sqrt{c_h}$ no cambia
  entre estratos, la óptima con costos *también* es la proporcional.
- **B10 y B12 en notas**: precisión fijada *dentro de cada* estrato (Ej. 3.11) no es la asignación
  igual, sino la regla del cap. 2 aplicada estrato a estrato; y el caribú (Ej. 3.10), donde Neyman
  fue guía y no orden —menos de cinco unidades pedidas en un estrato de treinta, diez puestas, y las
  225 planeadas acabando en **211**—.

**Un arreglo que no estaba en la lista.** El quiz del M4 daba por correcta la opción «para estimar
el total nacional, es la mejor asignación posible», **sin decir de qué**. Con el módulo nuevo eso
pasa de impreciso a contradictorio, que es exactamente lo que costó T7.27. Ahora nombra `acres92` y
la retro remata con el 1,1190 de `farms92`. El ítem vive solo en el capítulo, no en el banco del
taller: se comprobó con `grep` antes de tocarlo.

**Dos correcciones propias.** Había situado el censo de caribú «en el módulo 1» —el capítulo no lo
menciona en ningún sitio, me inventé la referencia cruzada— y escrito «pusieron el triple» cuando la
Tabla 3.7 va de 4,81 a 10. También se anota que el deff de `farms92` bajo Neyman sale **1,1190** con
$n_h$ redondeados y no el 1,105 del diagnóstico, que usaba $n_h$ exactos: se publica el redondeado
porque es el único que reproduce los 0,8224 y 0,5510 que el R6 ya tenía publicados.

**Verificado.** Byte a byte; **348 de 348** cifras de bloques (eran 317) y **113 de prosa · 0 sin
respaldo** (eran 102); `anota_salidas.py --check` sin diferencias. En el navegador: 32 expresiones
KaTeX en el M4, 0 `.katex-error`, la derivación abre con **cuatro** pasos y 11 fórmulas, el quiz se
responde y devuelve su retro con `<em>` y `<code>` renderizados, consola limpia. M4 pasa de 25 a
**35 min** en `courseData`.

**Lo que enseña.** El material llevaba la conclusión correcta escrita como sobremesa —una nota al
final, sin cifras— mientras el módulo entero medía con rigor una sola variable. **Una afirmación que
el propio método del capítulo podría comprobar y no comprueba es una deuda, no un matiz**: aquí
bastaba una columna más para que la lección pasara de creída a vista, y de paso salió una asignación
de compromiso que le gana a la proporcional en las dos variables.

**Publicado el 2026-09-17** con el visto bueno de Javier, junto con el resto de la fase 3: ver el final de T7.45.


---

### T7.42 — La fase 3 del cap. 3: la media de cocientes, el total sin $N$, y un barrido en móvil (2026-09-17)

Fase 3 completa del plan del capítulo 3 con Portela & Villeta: sus dos tareas, T3.1 y T3.2.

**Primero, una corrección a mi propio diagnóstico.** El plan daba por ausente del capítulo la
distinción entre la razón de medias y la media de cocientes («`grep` de "media de razones", "media de
los cocientes", "razón de medias": cero»). **Estaba, y bien puesta**, en el módulo 5: «El error
clásico: promediar cocientes… las dos cantidades son distintas… la primera pondera cada unidad por su
tamaño». El `grep` falló porque el material lo dice con otras palabras. Lo que de verdad faltaba era
más pequeño y más útil.

**T3.1 — lo que le faltaba al argumento: el número.** El módulo afirmaba que las dos cantidades «no
se aproximan entre sí» sin decir cuánto. Sobre `agpop`, $B = 0{,}9797$ y la media de cocientes
**0,9530**: un **2,73 %**. Y como son dos números de la población entera, quien promedia cocientes no
estima mal $B$ —**estima bien otra cosa**—, así que la diferencia **no se reduce al crecer $n$**. Se
añaden dos argumentos más: que la media de cocientes **ni existe** donde $x_k = 0$ (en `agpop`, 2
condados con cero acres y 23 con el código de faltante: hay que quitar 25 y se acaba describiendo otra
población), y que además es **más difícil de estimar**, porque $z_k = y_k/x_k$ tiene la cola pesada
—llega a **9,09**— y con los mismos 300 condados su error estándar relativo es del **1,84 %** frente
al **0,76 %** de $\hat B$: **2,4 veces peor**. En el **módulo 2**, donde se define $\hat B$, queda un
aviso corto que remite al 5: la confusión empieza allí, tres módulos antes de la advertencia.

**Una aserción que me paró, y tenía razón.** Había escrito en el módulo 5 que «en la muestra se ve
apuntando cada uno a su sitio: $\hat B = 0{,}9866$ está cerca del 0,9797 y el promedio de cocientes,
0,9677, está cerca del 0,9530». **Es falso:** 0,9677 dista 0,0121 de $B$ y 0,0147 de su propio
parámetro — está más cerca del ajeno. Lo descubrió el `stopifnot` simétrico que yo mismo había puesto
en `genera_cap3.R`, que abortó el precálculo. La causa es el tercer argumento en acción: con esa cola,
300 condados estiman la media de cocientes con un error estándar verdadero que deja los dos
parámetros dentro del margen. **La frase se cayó** y el capítulo argumenta solo con los parámetros
poblacionales, que es donde el argumento es firme. La aserción se quedó, con el comentario de por qué
la simétrica **no** se puede exigir.

**T3.2 — el total que no necesita $N$.** El módulo 1 define variable auxiliar por dos condiciones y
no sacaba la consecuencia: en $\hat t_r = \hat B\,t_x$ **no aparece $N$**. Nota nueva con el camión
de cestas de fresa —se pesa el camión, se analizan unas cestas, y el total sale sin contar una sola—
y el puente al **capítulo 5**, donde no conocer el número de elementos es lo normal. El módulo 2
añade una línea bajo la fórmula, que es donde se ve.

**El barrido en móvil, que corrige lo anotado en T7.40.** Midiendo `scrollWidth`/`clientWidth` de
cada `.katex-display` a **375 px**: **14 fórmulas desbordan su caja, en 9 de los 12 módulos**; a
1 280 px no desborda ninguna, y a 1 000 px desbordan dos. Solo 4 de las 14 son de este trabajo. No es
un defecto de fórmulas concretas y **no se arregla partiéndolas**: `.katex-display` lleva
`overflow-x: visible` y el texto se sale sin que aparezca barra de desplazamiento. El arreglo es una
línea de CSS en el componente, retropropagada a los ocho capítulos — y por eso **no se hizo aquí**.
Queda como tarea propia, con el barrido ya hecho.

**Verificado.** Byte a byte en la segunda pasada. **179 de 179** cifras de bloques y **126 de prosa ·
0 sin respaldo** (los ocho capítulos, 0). En el navegador a 1 280 px: 0 `.katex-error` en los módulos
1, 2 y 5, ninguna fórmula desbordada, consola limpia. El M1 sube de 15 a 18 min y el M5 de 12 a 15.

**Lo que enseña.** Dos cosas, y las dos sobre no fiarse de uno mismo. Un `grep` que no encuentra algo
solo demuestra que no se buscaron las palabras que el autor usó: el diagnóstico decía «falta» y lo que
faltaba era otra cosa. Y una aserción escrita para adornar un cálculo acabó tumbando una frase que yo
había dado por evidente; si no la hubiera puesto, la frase se publica.

**Pendiente:** el visto bueno de Javier para publicar.

---

### T7.43 — La letra pequeña de la proporción y los grados de libertad: el M3 del cap. 4 (2026-09-17)

Tercera tarea de la fase 3 del plan del capítulo 4 con Lohr 3.ª ed. (tareas B6 y B7).

**El defecto.** El M3 estimaba una proporción y seguía: la calculaba a mano y con `survey`, comparaba
las dos cifras y pasaba de página. Nunca escribía **la fórmula** —las ecs. 3.7 y 3.8 de Lohr— ni el
**total** de unidades con la característica, y dejaba el «convenio del ±1,96» dicho sin contrapunto.

**El hallazgo que amarra el $n_h-1$.** La 3.8 lleva $\hat p_h(1-\hat p_h)/(n_h-1)$, y eso suele
enseñarse como una corrección más que memorizar. No lo es: **es la que `var()` ya venía aplicando sin
decirlo**. La varianza muestral de una 0/1 *es* exactamente $\frac{n_h}{n_h-1}\hat p_h(1-\hat p_h)$
—las cuatro regiones lo confirman al sexto decimal— y al dividirla entre $n_h$ aparece el $n_h-1$ de
la fórmula. Escrita literal, la 3.8 devuelve el mismo **0,02479456** que el bloque R5 ya imprimía. El
módulo pasa de usar la fórmula a entenderla, sin cambiar una sola cifra de lo que ya publicaba.

**El total, que no estaba en ninguna parte del capítulo.** No el 51 % de condados que siembran poco,
sino **1 581,8** condados con ee **76,318**, confirmado por `svytotal`. Los decimales recuerdan que
es una estimación y no un conteo.

**B7, en una nota nueva.** `degf()` da **296** = 300 − 4, con la explicación de por qué son $n-H$ y
no $n-1$: cada estrato gasta uno en su propia media. Con la $t$ el intervalo pasa de
0,46532–0,56251 a 0,46512–0,56271, invisible — lo que **justifica** el convenio del material en vez
de solo declararlo. Y la tabla de cuantiles dice cuándo deja de ser invisible: **1,225 %** más ancho
con 100 gl, **6,429 %** con 20, **13,683 %** con 10.

**Un enlace que apareció solo.** El M6 recomienda, citando a Lohr §3.5, «cuanta más información,
más estratos», hasta dejar dos unidades por estrato. **Ese es exactamente el diseño donde la $t$
importa**: 150 estratos de dos unidades dan 150 gl, no 299. Los dos módulos llevaban meses
publicados sin que nadie cruzara la recomendación de uno con la advertencia que le faltaba al otro.
La nota nueva lo dice con esas palabras.

**Verificado.** Byte a byte; **389 de 389** cifras de bloques (eran 348) y **123 de prosa · 0 sin
respaldo** (eran 113); `anota_salidas.py --check` sin diferencias. En el navegador: 20 expresiones
KaTeX en el M3, 0 `.katex-error`, cinco bloques, ningún `$` suelto y consola limpia. M3 pasa de 22 a
**27 min**. Comprobado antes de tocar: el quiz del M3 va de pesos y promedio bruto, así que nada de
lo nuevo lo contradice, y no hay banco del Quiz 2 en el repositorio.

**Calendario:** M3 se dicta el **24 de septiembre junto con el Quiz 2**, así que el cambio entra una
semana antes, que es lo que R2 permite. El quiz vive fuera del repositorio: si sus preguntas tocan
proporciones, ahora hay fórmula y total publicados que antes no estaban.

**Lo que enseña.** Un módulo puede tener todas las cifras correctas y aun así no enseñar la fórmula,
porque la biblioteca la aplica por dentro. **Cuando una función hace lo correcto sin que se vea,
el material hereda el resultado pero no el entendimiento**: aquí bastó imprimir la identidad que
`var()` da por supuesta para que el $n_h-1$ dejara de ser un detalle que memorizar.

**Publicado el 2026-09-17** con el visto bueno de Javier, junto con el resto de la fase 3: ver el final de T7.45.

---

### T7.44 — Las fórmulas que se salían de la pantalla: una línea de CSS y nueve páginas (2026-09-17)

Sale del hallazgo que T7.42 midió y dejó anotado. No es de ningún capítulo: es del **componente**.

**El defecto.** KaTeX no le pone desbordamiento a `.katex-display`, y la caja `.formula` solo desborda
si el **hijo** no cabe, no si se sale el **contenido** del hijo. Resultado: en pantallas estrechas la
fórmula en bloque se salía de su caja **sin barra de desplazamiento** y **sin que la página ganara
scroll horizontal** — es decir, sin ninguna señal de que faltara texto. A 1 280 px no desborda casi
nada, que es por lo que llevaba meses sin verse.

**Cuánto era, medido.** Barrido a **375 px** sobre las ocho páginas accesibles, recorriendo todos los
módulos y abriendo cada derivación plegable:

| Página | Fórmulas en bloque | Más anchas que su caja |
|---|---:|---:|
| cap. 1 | 7 | 3 |
| cap. 2 | 43 | 16 |
| cap. 3 | 29 | 15 |
| cap. 5 | 9 | 6 |
| cap. 6 | 4 | 4 |
| cap. 7 | 9 | 1 |
| cap. 8 | 10 | 4 |
| preparcial | 0 | 0 |
| **total (lo reensamblado aquí)** | **111** | **49** |
| cap. 4 — medido y reensamblado por su propia sesión (commit `9675b07`) | 20 | 18 |
| **total del sitio** | **131** | **67** |

La fila del capítulo 4 la midió esa sesión con el mismo `scrollWidth`/`clientWidth` tras reensamblar
sobre esta plantilla: **18 de 20**, y **0 recortadas** en vertical con los sumatorios del M3, M4, M5
y M7 abiertos, que eran el caso que preocupaba. Su HTML salió **+153/−7**, de las cuales 16 añadidas
son este CSS y el resto es su propia tarea: la predicción del diff sirvió para separar las dos cosas
en la revisión.

**El arreglo,** en `plantilla/plantilla-capitulo-muestreo.html`: `overflow-x: auto` en
`.katex-display`, con `-webkit-overflow-scrolling: touch` —la misma pareja que `.formula` ya usaba—,
`overflow-y: hidden` y un relleno de 0,2 rem arriba y 0,4 rem abajo para que la barra no tape los
subíndices. Nada de partir fórmulas a mano: son 49, están bien escritas, y la regla las cubre todas.

**Comprobado, no supuesto.** Tras el arreglo, las **49** desbordadas tienen `overflow-x: auto` y
**ninguna de las 111** se recorta en vertical (`scrollHeight == clientHeight` en las 111). La
advertencia de que `overflow-y` recorta raíces y fracciones altas era pertinente —la levantó la
sesión del capítulo 4— y el relleno la desactiva. Sobre la fórmula del sesgo del M4 del cap. 3, la
peor del capítulo, se comprobó además que los 134 px que antes se perdían **ahora se alcanzan**
(`scrollLeft` llega a 133,5). Y la página sigue sin ganar scroll horizontal: no se escapa nada al
documento.

**Nueve páginas reensambladas**, las diez menos el capítulo 4 —que quedó al día ese mismo día en `9675b07`—. Cada una **byte a byte** en la segunda
pasada: los once archivos del sitio con el mismo SHA-256. El diff de todo `sitio/muestreo/` es
**+16 líneas por archivo y 0 borradas**, todas del bloque de CSS — ni una cifra, ni un bloque de
código, ni una línea de texto cambió en ninguna parte. El verificador de prosa, 0 sin respaldo en los
ocho capítulos. `index.html` no lleva KaTeX y no necesita la regla.

**Lo que quedó fuera, y por qué.** El **capítulo 4** lo estaba editando otra sesión en ese momento.
Se acordó por mensaje: yo commiteo la plantilla y los otros nueve; esa sesión hace `git pull`,
reensambla el capítulo 4 con la plantilla nueva y lo commitea dentro de su propio trabajo, ya
verificado por ella. Así el arreglo llega igual al capítulo 4 sin hornear trabajo ajeno a medias.
`taller-1-preparacion-parcial-1.html` tiene la regla pero **no se pudo abrir en el navegador** para
medirlo; está fuera del control de versiones por la lista blanca.

**Lo que enseña.** El defecto no lo encontró nadie leyendo: apareció midiendo
`scrollWidth`/`clientWidth` de cada `.katex-display`, una comprobación de tres líneas que no estaba en
el protocolo. Un fallo que **no deja rastro visible** —sin barra, sin scroll, sin error en consola—
no lo encuentra la revisión humana ni el verificador de cifras; hace falta preguntarle al navegador
por una medida concreta. Conviene añadir esa medición al protocolo de publicación.

**Pendiente:** el visto bueno de Javier para publicar.

---

### T7.45 — Con qué se estratifica y qué promete el modelo: M6 y M7 del cap. 4 (2026-09-17)

Cuarta tarea y **cierre de la fase 3** del plan del capítulo 4 con Lohr 3.ª ed. (tareas B13 y B14).

**El mismo defecto que T7.41 encontró en el M4, ahora en el M6.** Su tabla ordenaba cuatro maneras
de partir `agpop` usando una sola vara, `acres92`, y sacaba de ahí un veredicto sobre cada variable.
Medidas con dos varas (bloque `R8B`), el ranking se da vuelta más fuerte todavía: los cuartiles de
`farms92`, que el módulo despachaba como «trabajar gratis» con deff **0,9872**, son **la mejor
partición de las cuatro** para estimar el número de granjas, con **0,3240** — por debajo incluso de
los cuartiles de `acres87`—. **No había particiones malas; había una pregunta mal hecha.** Se
corrigieron el bullet del módulo y la retro del quiz del M6, que afirmaban la media verdad.

**Y la receta que sale de ahí.** La única partición que aguanta las dos varas es `acres87`
(**0,5396** y **0,7925**), y no por casualidad: el censo del año anterior mide *las dos* cosas.
`cor(farms92, farms87)` = **0,9944**, al lado del 0,9951 que el módulo ya publicaba. Estratificar con
el marco del año pasado es lo que sirve a una encuesta multipropósito, que es justo lo que pedía
Lohr §3.5 y el capítulo no decía.

**Lo que faltaba de principio.** Que lo ideal sería estratificar por la propia $y$ y es imposible
por la razón más obvia —si se conociera, no haría falta encuestar—. Y su corolario, en nota nueva:
**clasificar mal no invalida nada**, porque las propiedades del diseño dependen solo de la
estratificación que se usó; lo único que se pierde es eficiencia. Por eso se puede estratificar con
información vieja o aproximada sin pedirle permiso a nadie.

**El Ej. 3.13 con datos reales** (bloque `R8C`; `pitcount.csv` entra por primera vez al capítulo):
el conteo anual de personas sin hogar de Nueva York, diseñado para dos objetivos a la vez —estimar
bien y llegar a cuanta más gente mejor—. De **1 000** áreas se visitan **100**; el conteo estimado es
**496** con ee **70,793**. El remate: las áreas de alta densidad aportan **224** al conteo y **cero**
a la varianza, porque son **estratos de certeza** —los que T7.39 acababa de introducir en el M5— y su
fpc vale 0. Toda la incertidumbre, **70,79296**, viene de las de baja densidad. Mandar a los
voluntarios donde está la gente sirve a la vez a los dos objetivos: no hubo que elegir.

**B13, quinto paso de `der-modelo` en el M7.** El error cuadrático medio bajo el modelo,
$\sum_h N_h^2(1-n_h/N_h)\sigma_h^2/n_h$, es **término a término** la varianza de diseño del M3: dos
teorías que no comparten ni el objeto aleatorio llegan al mismo error estándar. Con la asimetría que
importa y que el módulo no decía: la de diseño vale sea cual sea el modelo, porque solo promedia
sobre el sorteo; la de modelo vale solo si el modelo es cierto, y si lo que falla es la independencia
dentro del estrato se queda **corta**. Enlaza con el cap. 5, donde esa dependencia es el tema.

**Verificado.** Byte a byte; **411 de 411** cifras de bloques (eran 389) y **131 de prosa · 0 sin
respaldo** (eran 123); `anota_salidas.py --check` sin diferencias. En el navegador: 0 `.katex-error`,
la derivación del M7 abre con **cinco** pasos, ningún `$` suelto y consola limpia. M6 pasa de 18 a
**26 min** y M7 de 20 a **22 min**.

**Coordinación con la sesión del cap. 3 (T7.44).** Avisó de que iba a arreglar `.katex-display` en
la plantilla compartida. Al reensamblar me llevé su regla aún sin commitear dentro del HTML del
capítulo 4, así que se le pidió commitear la plantilla sola primero; con `ce54da0` en `main` se
reensambló el capítulo 4 y este commit ya es reproducible desde lo commiteado. **La cifra del
capítulo 4 para su tabla**, medida a 375 px recorriendo los doce módulos con las derivaciones
abiertas: **18 de 20** fórmulas en bloque necesitan la barra (9 de los 12 módulos tienen fórmulas) y
**0 quedan recortadas** en vertical, así que el `padding-top` de 0,2 rem basta también aquí. El diff
del HTML fue +153/−7, de los que 16 son su CSS.

**D5 sigue sin decidir**: la regla de la $\sqrt{f}$ acumulada (Dalenius–Hodges) no se tocó, y la
referencia del M6 queda como estaba. Decide Javier.

**Lo que enseña.** Es la segunda vez en el mismo capítulo —y en la misma tarde— que aparece el mismo
patrón: un módulo que mide con rigor **una** variable y redacta el resultado como si fuera un
veredicto sobre el mundo. En el M4 era la asignación; aquí, la partición. **Cuando un material dice
«esta opción es mala» y lo ha medido con una sola vara, la frase está midiendo la vara, no la
opción.** Vale la pena revisar el resto del material con esa pregunta.

**Publicado el 2026-09-17** con el visto bueno de Javier: la fase 3 entera (T7.39, T7.41, T7.43 y
T7.45), commit `9675b07` de `main` → gh-pages `6f41a9e`. Solo cambió el capítulo 4; las otras ocho
páginas quedaron en la versión servida (comprobado en vivo), porque lo que `main` tiene sobre ellas
—el arreglo de `.katex-display` de T7.44 y el trabajo de otras sesiones en los caps. 3 y 8— no está
aprobado. El capítulo 4 sí se lleva el CSS, así que **de momento es la única página del sitio cuyas
fórmulas en bloque no se salen en móvil**. Verificado en vivo: md5 `88244a22978265ca0fcde9185c047eda`.

---

### T7.46 — La regla que no decidía, la auxiliar que no paga, y las tablas recortadas (2026-09-17)

Sale de un aviso de la sesión del capítulo 4: *un módulo que mide con rigor **una** variable y redacta
el resultado como veredicto general*. Encontraron dos casos así en su capítulo (T7.45) y sugirieron
buscar lo mismo aquí. Había.

**A6 — la condición del estimador de diferencia no discriminaba.** El M3 decía que la diferencia
conviene «cuando $x$ e $y$ son **la misma variable medida dos veces**». Las **cuatro** parejas de
`agpop` cumplen esa condición al pie de la letra, y el desenlace va de la diferencia **perdiendo un
20,5 %** a **ganando un 16,0 %**:

| pareja | $B$ | $b_1$ | $b_1$ se parece más a | gana | por |
|---|---:|---:|---|---|---:|
| `acres92 ~ acres87` | 0,9797 | 0,9868 | $B$ | razón | 0,63 % |
| `farms92 ~ farms87` | 0,9222 | 0,9323 | $B$ | razón | 20,5 % |
| `largef92 ~ largef87` | 1,0240 | 0,9714 | **1** | **diferencia** | 6,8 % |
| `smallf92 ~ smallf87` | 0,9085 | 1,0297 | **1** | **diferencia** | 16,0 % |

**Ninguna frase publicada era falsa**, y por eso no se etiqueta como error: es una **regla de decisión
incompleta**. Una condición que dispara igual en casos con desenlaces opuestos no está decidiendo
nada. *(La sesión del cap. 4 propuso llamarlo «respuesta equivocada»; se midió la apuesta antes de
aceptarlo —en `acres` la diferencia queda a 0,63 %, del orden de lo que T7.40 declaró inobservable con
una muestra— y retiraron la etiqueta tras reproducir la tabla por su cuenta.)*

**Y la regla que sí decide no añade teoría**: sale de leer el cuadrado perfecto que el M7 publica
desde T7.40, $V(b) - V(b_1) = \frac{1-f}{n}(bS_x - \rho S_y)^2$, con $b = B$ y con $b = 1$. Gana
**aquel de los dos que se parezca más a $b_1$**, y acierta en las cuatro filas. `genera_cap3.R` aborta
si fallara en alguna: si la regla que el capítulo enseña no predice, no se enseña.

**Un detalle incómodo, dicho:** `acres92 ~ acres87` —la pareja sobre la que corre **todo** el
capítulo— es la de **menor apuesta de las cuatro**. Buena para ver el mecanismo, mala para creerse que
la elección da igual.

**A7 — la auxiliar que no paga, enseñada por fin.** El M3 asegura que bajo el umbral «la auxiliar no
paga lo que cuesta» y nunca lo mostraba. Ahora sí, y con el contraste más limpio posible: **la misma
variable de interés con dos auxiliares distintas**. `farms92` con `farms87` ($\rho = 0{,}9944$) deja
el ee del total en **8 801** frente a **82 839** de la expansión — **9,4 veces mejor**. La misma
`farms92` con `acres87` ($\rho = 0{,}1539$, umbral 0,8720) lo sube a **155 083**: un **87,2 % peor que
no usar auxiliar ninguna**. Una auxiliar no es buena o mala en abstracto; lo es *para la variable que
se está midiendo*.

**Y un segundo arreglo transversal, que esto forzó.** La tabla nueva del M7 se salía en móvil, y al
medirlo apareció que el defecto de las tablas es **peor que el de las fórmulas de T7.44**: la regla
`table` llevaba `overflow: hidden` —puesto para que el `border-radius` recortara las esquinas de la
cabecera— con `width: 100%`, así que en pantallas estrechas la tabla **recorta sus propias columnas de
la derecha y no hay forma de llegar a ellas**. No se salen: desaparecen. Medido a 375 px: **17 de las
18 tablas visibles del sitio son más anchas que su caja**. Se cambia a `overflow-x: auto` +
`overflow-y: hidden`, que conserva las esquinas redondeadas y es lo que `.tabla-ranking-marco` hacía
desde el principio. Tras el arreglo, **0 tablas con contenido inalcanzable**.

**Verificado.** Byte a byte en la segunda pasada, los once archivos. **179 de 179** cifras de bloques
y **137 de prosa · 0 sin respaldo** en el cap. 3 (los ocho capítulos, 0) — las trece cifras nuevas
salen todas del JSON, ninguna necesitó entrada en `cifras_prosa.json`. El diff del sitio es **+9/−1
por página** (la regla de `table`) salvo el capítulo 3, que lleva además A6 y A7. En el navegador: 0
`.katex-error` en el M3 y el M7, las tres tablas del capítulo alcanzables a 375 px, consola limpia.
El M3 sube de 25 a 28 min y el M7 de 24 a 29.

**El capítulo 4 queda otra vez fuera** —lo lleva su propia sesión— y por tanto **sigue con
`overflow: hidden` en sus tablas** hasta que reensamble. Se le avisa.

**Lo que enseña.** El aviso vino de otra sesión, sobre su capítulo, y aquí valió igual: **cualquier
sitio donde el material compare opciones con una sola variable de respuesta es candidato**. Y la
segunda lección se repite: el defecto de las tablas tampoco lo encuentra nadie leyendo, porque no deja
hueco ni desborde — la columna simplemente no está.

**Pendiente:** el visto bueno de Javier para publicar.

---

### T7.47 — El módulo 12 del cap. 4: la razón vuelve, por las dos vías (2026-09-17)

Fase 4 del plan del capítulo 4 con Lohr 3.ª ed. (tarea B3) y **cumplimiento de A9**: el capítulo 3
prometía desde su módulo 8 que el estimador de razón reaparecía en el capítulo 4 «dentro de cada
estrato o sobre el conjunto», y el capítulo 4 no traía ninguno de los dos. La promesa se cumple
construyendo lo prometido, no borrándola.

**El módulo nuevo.** M12 «Razón en el estratificado», con la autoevaluación renumerada a **M13** y
sacada a `modulo_13.html`, que es como la tienen los capítulos 1, 2 y 3. Comprobado con `grep` que
nadie enlazaba al `#module-12` del capítulo 4 antes de moverlo.

**Las cifras.** Sobre `agstrat` con `acres87` de auxiliar, y con `agpop` entera al lado para poder
decir la verdad:

| estimador | total (millones) | ee (millones) | error |
|---|---:|---:|---:|
| estratificado sin auxiliar (M3) | 909,736 | **50,417** | −3,625 % |
| razón **combinada** | 953,827 | **5,962** | +1,046 % |
| razón **separada** | 954,334 | **5,724** | +1,100 % |

Lo primero que enseña no es la diferencia entre las dos razones sino **lo que vale la auxiliar**: el
error estándar cae casi nueve veces. Entre las dos gana la separada, porque las razones por región
—**0,9751 · 0,8956 · 0,9935 · 1,0120**— se separan y la combinada las aplasta en una sola, 0,9900.
Pero gana por **4 %**, y ahí está la lección.

**La asimetría, medida.** El precálculo sortea 20 000 estratificados por cada $n_h$ de 3 a 20. Con
**3** por estrato la separada tiene un ECM relativo de **7,195 %** contra **3,734 %**; el cruce está
en **5**; con **20** la ventaja es **1,528 %** contra **1,554 %**. **Arriba se gana poco y abajo se
pierde mucho**, que es por qué los paquetes calculan la combinada por defecto. Y por debajo del
cruce hay un escalón que las fórmulas no anuncian: con $n_h = 2$ el **0,23 %** de las muestras deja
alguna región con $\bar x_h \leq 0$ —`acres87` arrastra 23 códigos $-99$ y dos ceros, los que el M6
ya señalaba— y **la separada no existe**. La combinada no tiene ese problema.

**El cruce se midió dos veces y salió distinto.** Comparando los dos ECM sin más, 4; exigiendo que
la **diferencia emparejada** —los dos estimadores se calculan sobre la misma muestra, así que su
diferencia se estima mucho mejor que cada uno— supere dos errores Monte Carlo, **5**: en 4 la
ventaja aparente no se distinguía del ruido. Lo mismo deja ver que ni siquiera la paliza en $n_h=3$
llega a certificarse con 20 000 réplicas, porque las colas de la separada son pesadísimas justo por
los cocientes que estallan. El simulador dice «empate» cuando toca en vez de fingir un ganador.

**La postestratificación era esto**, y el módulo lo dice: la razón separada con el indicador de
pertenencia como auxiliar da $t_{xh} = N_h$ y $\bar y_h/\bar x_h = \bar y_h$. El M10 llevaba desde
T7.37 haciendo exactamente eso sin llamarlo por su nombre.

**Lo demás.** Bloques `R15B` y `P5`, que dan las mismas cifras en los dos lenguajes (la disciplina de
T7.19), cada uno con su doble vía: `svyratio(separate = TRUE/FALSE)` contra la fórmula a mano,
idénticas al entero. Simulador `razon-estratificada`. Dos filas nuevas de glosario
($\hat t_{yrc}$, $\hat t_{yrs}$). **Ej. 4.10 de Lohr no se adaptó**, como avisaba el plan: su ee no
cuadra con la fórmula que declara y haría falta la fe de erratas.

**Verificado.** Byte a byte; **437 de 437** cifras de bloques del capítulo (458 en el sitio entero) y
**147 de prosa · 0 sin respaldo**; `--check` sin diferencias en las dos cadenas; `genera_cap4.R`
reproduce su JSON y aborta si la separada no pierde con $n_h$ chicos o no gana con grandes. En el
navegador: 13 módulos, 9 simuladores, 26 expresiones KaTeX en el M12, 0 `.katex-error`, las dos
pestañas coincidiendo, el simulador dando «empate» en 3 y 4 y «gana la separada por 4,4 %» en 5, el
glosario con sus 14 filas y el M13 con sus cuatro bloques de ejercicios. Reensamblado sobre
`650bc8c`: a 375 px, **18 de 20** fórmulas con barra, **0** recortadas, y la única tabla HTML del
capítulo ya alcanzable.

**Lo que enseña.** El capítulo llevaba meses con una promesa hecha en otro capítulo y sin cumplir, y
nadie lo habría notado nunca leyendo el capítulo 4 solo: **las deudas entre capítulos no dejan
rastro en el capítulo que las debe**. La auditoría que las encuentra hay que hacerla desde fuera, y
por eso valió la pena que el diagnóstico las buscara con `grep` en vez de releyendo.

**Publicado el 2026-09-17** con el visto bueno de Javier, junto con las fases 4 y 5: ver el final de T7.51.

### T7.58 — La fase 4 del capítulo 3: las citas a Lohr, los dominios y el quiz (2026-09-17)

Cierra la **fase 4** de `PLAN_Cap3_PortelaVilleta.md`: T4.1, T4.2, T4.3 y T4.4, las cuatro. Sin
publicar.

**T4.1 — Las doce citas a la 3.ª ed., una a una.** Auditadas contra el índice del epub
(`04chap_04.xhtml`, `07chap_07.xhtml`, `contents.xhtml`). **Diez estaban mal**, el diagnóstico las
había previsto todas:

| módulo | decía (3.ª) | qué es en realidad esa sección | pasa a decir |
|---|---|---|---|
| M2 | 4.1 y 4.2 | 4.2 es *Regression Estimation* | **4.1 y 4.1.1** |
| M3 | 4.2 | idem | **4.1.1 y 4.1.5** |
| M3 | 4.3 | *Estimation in Domains* | **4.2** |
| M4 | 4.2.2 | **no existe**: el 4.2 no tiene subsecciones | **4.1.2** |
| M5 | 4.2.3 | **no existe** | **4.1.3** |
| M6 | 4.3 | *Estimation in Domains* | **4.2** |
| M7 | 4.3.2 | **no existe** | **3.2.2 (2.ª) y ejercicio 32** |
| M8 | 4.4 | *Poststratification* | **4.3** |
| M9 | 4.5 | *Ratio Estimation with Stratified Sampling* | **4.6** |
| M11 | 7.5 | *NHANES* | **7.3** |

Las dos correctas: la «4.1» del M1 y el «capítulo 14» del M8.

**Tres hallazgos que no eran renumeración.** *(a)* En la 3.ª ed. **el estimador de diferencia deja
de ser sección**: sólo aparece como el **ejercicio 32**, planteado como la regresión con la pendiente
fijada en 1 —que es exactamente el cuadrado perfecto del M7—. Citarlo como «§4.3.2» mandaba a un
sitio que no existe a buscar algo que ya no está donde estaba. *(b)* El **ejemplo de los árboles
muertos** que el M7 asociaba a la diferencia es el **Ejemplo 4.7 de §4.2**, y Lohr lo resuelve por
**regresión**; el módulo 12 pide las dos, así que ahora la cita lo dice. *(c)* La **regla de los CV**
del M3 no está donde el material la mandaba buscar: está en «Advantages of Ratio Estimation»
(§4.1.5), con la desigualdad $R \ge \mathrm{CV}(x)/[2\,\mathrm{CV}(y)]$ escrita tal cual — la misma
que T1.2 dedujo de Portela.

**Lo que NO se tocó, y por qué.** Los números de la **2.ª ed.** El disco tiene la **1.ª** (Duxbury,
`Sampling Lohr.pdf`) y la **3.ª**, no la 2.ª. En la 1.ª, «Advantages of Ratio Estimation» es la
**§3.1.2.2**, no la 3.1.1 que cita el M3: si la 2.ª heredó esa estructura, esa cita también está mal.
No se cambia un número que no se puede comprobar, y la redacción nueva del M3 se escribió para no
afirmar nada de la 2.ª ed. **Queda para cuando aparezca la 2.ª ed.**

**T4.2 — M8: dominio y estrato, y el total cuando no se sabe $N_d$.** La definición decía que un
dominio es la subpoblación «que *no* se usó para diseñar la muestra». Lohr: *the stratum is also a
domain*. Lo que separa los casos no es ser dominio, sino de dónde sale $n_d$ —fijo si el dominio es
un estrato, aleatorio si no—, y así se redefine. Además el módulo sólo tenía la **media** de dominio;
ahora tiene el **total**, con sus dos fórmulas: $N_d\,\hat{\bar y}_d$ si $N_d$ se conoce, y
$\hat t_u = N\bar u$ si no. El bloque R8 reproduce el Ejemplo 4.8 de Lohr al dígito
(**418 987 302**, ee **38 938 277**) y pone precio a no saber $N_d$: el error estándar relativo pasa
del **6,81 %** al **9,29 %**. Y la **diferencia de dos medias de dominio** con `svycontrast`:
32 752 con ee 36 014 —mayor que la diferencia misma—, donde la covarianza estimada sale
$-1{,}37\times10^{-22}$, o sea cero, y el ee es exactamente $\sqrt{s_1^2+s_2^2}$. Es el ejercicio 26
de Lohr comprobado. El `.warning` dice cuándo eso **deja** de valer: dominios que se solapan, o
conglomerados compartidos.

**Una retro del quiz que este trabajo delató.** La pregunta del M8 decía, en un distractor, que
«cuando $N_d$ se conoce… la fórmula se simplifica». El error estándar de la **media** de dominio no
contiene $N_d$ por ningún lado: conocerlo no cambia nada ahí. Reescrita para decir dónde sí decide,
que es en el total.

**T4.3 — El ejercicio 2 cerrado, y cinco preguntas nuevas.** El ejercicio de los cerezos decidía
comparando «a ojo» el intercepto (−36,94) con el rango de volúmenes (10–77). Ahora abre con el
contraste —$t = -10{,}98$, $p = 7{,}6\times10^{-12}$— y **enseña el mismo contraste decidiendo al
revés** en `agsrs` ($p = 0{,}2942$): es lo que lo convierte en criterio. La lectura por magnitud se
queda, dicha como lo que es, informal. Y una pregunta nueva por cada contenido de prioridad 1: B8
(contra quién compara la regla), B2 (calcular la cota de Kish: 0,0626), B1 (la media de cocientes
converge a **otro parámetro**), B4 (el contraste es MCO e ignora el diseño), B5 (la condición de
igualdad $B = b_1$ **es** que la recta pase por el origen). El quiz pasa de **11 a 16** preguntas y
de **10 a los 11 módulos**: el M5 no tenía ninguna.

**T4.4 — A5 enlazada.** El M5 prometía que la razón reaparece en el cap. 4 «separada o combinada».
Era falso hasta ayer; la sesión del cap. 4 lo cerró en `ea718be`. Ahora nombra su destino: el
**módulo 12, «Razón en el estratificado»**. No se puso un `href`: **el material no enlaza entre
capítulos en ningún sitio**, y no se inventa una convención para una nota.

**Una cifra inventada, cazada antes de publicar.** Escribí en el enunciado de la pregunta de Kish
$s_x = 344\,551{,}9$. El valor real es **344 829,6**. No salía de ninguna ejecución: la puse yo. Se
detectó al comprobarla contra los datos antes de ensamblar, no después. Las dos cifras nuevas que no
puede derivar el verificador —esa $s_x$ y la covarianza en notación científica— están en
`cifras_prosa.json` con su origen.

**Verificado.** Byte a byte en la segunda pasada; **191 de 191** cifras de bloques y **154 de prosa ·
0 sin respaldo**. En el navegador: 0 `.katex-error`, consola limpia, las 16 preguntas renderizando,
la numérica nueva aceptando «0,0626» con su retro, y los dos `h3` nuevos del M8 con sus cifras. A
**375 px**, barriendo los doce módulos con `loadModule()`: **14 fórmulas en bloque, 9 desbordan, 0
recortadas**; **3 tablas, las 3 más anchas que su caja, 0 inalcanzables**. Duraciones: M8 20→27,
M12 30→40.

**Un aviso de medición.** El primer barrido móvil dio 12 fórmulas y 3 tablas porque a 375 px el
`nav` se colapsa y `nav *` ya no alcanza los botones de módulo: se estaba midiendo doce veces el
mismo módulo. Con `loadModule(m)` salen 14 y 3. **A ancho de móvil hay que navegar por la API de la
página, no por el menú.**

**Pendiente además del visto bueno:** la portada dice «65 simuladores, 88 preguntas» y ahora son
**67 y 98** —cinco preguntas suyas del cap. 4 y cinco mías—. El plan del cap. 3 asigna la portada a
su **T5.1**, así que se corrige allí, con el recuento de `cuenta_sitio.py` delante.

**Lo que enseña.** Diez citas mal de doce, y las diez se arreglan con el índice abierto en quince
minutos. Lo que no se arregla con el índice es lo otro: que en la edición nueva **un tema entero
cambió de categoría** —la diferencia pasó de sección a ejercicio— y que un ejemplo cambió de método.
Una cita corrida una sección se nota al abrirla; un tema que deja de existir, no: manda a leer una
sección que sí existe y trata de otra cosa.

**Pendiente:** el visto bueno de Javier para publicar.

---

### T7.48 — Cinco preguntas nuevas en el cap. 4, y el M1 deja de estar en cero (2026-09-17)

Primera tarea de la fase 5 del plan del capítulo 4 con Lohr 3.ª ed. (T5.1). *(Los números T7.47 y
T7.48 quedaron usados dos veces, por esta sesión y por la del cap. 3, que escribieron a la vez,
igual que el T7.34. Se deshizo después en `84003d1`, con la regla de que se queda el número quien
lo commiteó antes: las notas del cap. 3 pasaron a T7.53–T7.58 y éstas conservan el suyo.)*

**El hueco del M1.** Estaba anotado desde T7.18 y era el único módulo de contenido del capítulo sin
una sola pregunta. La nueva no pregunta la definición: pone un marco que trae nombre, dirección y
teléfono, un censo que da los $N_h$, y obliga a separar las **dos** condiciones del módulo —la
variable unidad por unidad *antes* de sortear, y los $N_h$—. Falta la primera, así que la respuesta
es postestratificar, y la pregunta enlaza el M1 con el M10. El distractor más útil es «estratificar
por dirección»: la idea es buena y el M6 la respalda, pero responde a otra pregunta.

**Una por cada contenido de prioridad 1**, todas sobre cifras que el capítulo publica:
- **B1 (M5)**: dos variables piden 506 y 214 condados; manda el mayor. El distractor del promedio,
  360, da pie a decir que repartir el incumplimiento es incumplir.
- **B2 (M4)**: la Neyman de `acres92` deja a `farms92` en deff 1,1190; marcar las salidas
  razonables. La falsa —«calcula la Neyman de `farms92`»— es el mismo error con la camiseta
  cambiada, que es justo lo que T7.41 encontró en el módulo.
- **B4 (M10)**: qué hace la postestratificación con $\hat N_h = 1\,097{,}82$ frente a 1 054. Un
  distractor sostiene que la columna es decorativa, y la retro lo desmonta mostrando que $N_h/n_h$
  **es** el peso viejo por $N_h/\hat N_h$.
- **B3 (M12)**: 40 estratos de 4 unidades con todos los $t_{xh}$ conocidos. La falsa es «más
  información, luego menos error», que la simulación del módulo desmiente con el 7,195 % contra
  3,734 %.

El capítulo pasa de **11 a 16 preguntas** y los doce módulos de contenido tienen al menos una. Se
corrigieron las dos menciones a «Once preguntas» del M13.

**Verificado.** Byte a byte; 16 preguntas registradas por el ensamblador; **437 de 437** cifras de
bloques y **149 de prosa · 0 sin respaldo**. En el navegador: 0 `.katex-error`, y se respondió una
pregunta de opción y una múltiple comprobando que devuelven su retroalimentación.

**Un efecto colateral deshecho.** Al consultar `inventario_items.py` se regeneró
`inventario_items.json`, y el diff resultó ser de un enunciado del capítulo 2 que otra sesión tiene
sin commitear. Se devolvió el archivo a como estaba: **una herramienta de diagnóstico que escribe
en disco puede ensuciar el árbol compartido, y conviene mirar el diff antes de dar por propio lo
que aparezca modificado.**

**Publicado el 2026-09-17** con el visto bueno de Javier, junto con las fases 4 y 5: ver el final de T7.51.

---

### T7.49 — La «2.ª edición» del capítulo 4 era la 1.ª: doce citas reetiquetadas (2026-09-17)

**Revisa una afirmación de T7.32, que está publicada.** Esa nota dice haber auditado las once citas
a Lohr «contra los índices de **las dos** ediciones». La frase no se sostiene: el archivo del
proyecto `Sampling Lohr.pdf`, que se venía tomando por la 2.ª edición, es la **1.ª** —portada
Duxbury Press / Brooks-Cole / ITP, 1999; la 2.ª es Brooks/Cole 2010—. Lo detectó la sesión del
cap. 3 y se comprobó abriendo la portada y el índice.

**Un error propio, de ayer, detectable sin salir del capítulo.** En las referencias del M12 nuevo se
había escrito «§4.6 (2.ª ed.) / §4.5 (3.ª ed.): razón combinada y separada». El número de 2.ª estaba
**inventado**, y además el M7 del mismo capítulo citaba «§4.6 (2.ª ed.)» para *el modelo del
estratificado*: el capítulo se contradecía consigo mismo en dos referencias separadas por dos
módulos. **La contradicción interna era visible sin consultar ninguna edición**, y aun así pasó la
revisión de T4.1.

**Lo que sí estaba bien.** Las doce citas se comprobaron una a una contra el índice y el texto de la
1.ª, y **todas coinciden**: §4.1 qué es, §4.2 teoría, §4.3 pesos, §4.4 asignación, **§4.4.1
proporcional con su ecuación (4.11)** —`SSB < Σ(1−N_h/N)S_h²`, exactamente la condición que el M7
cita—, §4.5 definir estratos, §4.6 el modelo, §4.7 postestratificación, §3.3 dominios, §7.5 deff, y
§6.2 con reemplazo, que además coincide en la 3.ª. O sea que no estaban inventadas: estaban
**verificadas contra la 1.ª y etiquetadas como 2.ª**.

**La decisión de Javier: reetiquetar.** Las doce pasan a decir «1.ª ed.», que es lo que de verdad
está comprobado, y la 3.ª queda como estaba. Sin conseguir la 2.ª no se puede afirmar nada sobre
ella, y afirmarlo era el defecto.

**De propina, tres referencias mejoradas** con lo que se leyó de la 1.ª al verificarlas: la óptima
con costos es **§4.4.2**; el tamaño total de muestra —el contenido que T7.39 acababa de añadir al
M5— es **§4.4.4 «Determining Sample Sizes»**, que la 1.ª ya traía; la precisión fijada por estrato
es **§4.4.3 con el Ej. 4.9** (el mismo Servicio Postal), y el caribú es **Ej. 4.8 con la Tabla 4.4**.
El M12 queda citando solo la 3.ª, y diciendo por qué: en la 1.ª el capítulo de razón y regresión no
tiene sección dedicada a la razón en el estratificado.

**Verificado.** Byte a byte; 437 de 437 cifras de bloques y 0 de prosa sin respaldo; ninguna mención
a «2.ª ed.» queda en el capítulo.

**Lo que enseña.** Dos cosas distintas. La primera, sobre las fuentes: **una auditoría de citas
hereda la fiabilidad del ejemplar que se abre**, y nadie había comprobado qué edición era el PDF
porque el nombre del archivo no lo dice. La segunda, sobre la propia revisión: la contradicción del
§4.6 era interna, no requería ninguna fuente, y sobrevivió a una tarea entera. **Antes de cotejar
con el libro conviene cotejar el capítulo consigo mismo**, que es más barato y encuentra otra clase
de error.

**Publicado el 2026-09-17** con el visto bueno de Javier, junto con las fases 4 y 5: ver el final de T7.51. Afecta a material ya publicado (fase 1).

### T7.53 — La auditoría del capítulo 3, y dos defectos que solo se ven ejecutando (2026-09-17)

**T5.1**, la fase 5 del plan del cap. 3: el protocolo de verificación entero, punto por punto, sobre
un capítulo ya escrito. Encontró dos cosas que ninguna lectura habría encontrado, y una tercera que
invalida una prueba que yo mismo repartí.

**1 · El código publicado no arrancaba.** Punto 2 del protocolo —«un bloque que usa un objeto nunca
definido falla en manos del estudiante aunque funcione en una sesión con variables ya cargadas»—. Se
comprobó por primera vez **ejecutándolo**: se extraen del HTML servido los bloques que ve el
estudiante, se quitan las líneas `#>`, y se corre en una sesión limpia. Resultado:

| capítulo | qué pasa al pegarlo en un R nuevo |
|---|---|
| 1 | corre |
| **2, 4, 5, 6, 7, 8** | **`no se pudo encontrar la función "svydesign"`** (o `inclusionprobabilities`) |
| 3 | corría hasta hoy **no**; ahora sí |

`library(survey)` estaba en el **preámbulo de la cadena**, que va antes del primer marcador de bloque
y por tanto **no se publica**. El taller y el preparcial sí lo muestran: la convención existía y a los
capítulos no se les aplicó. Corregido en el cap. 3 —`library(survey)` visible en el R1,
`import numpy as np, pandas as pd` en el P1— y **comprobado con ejecución**, código de salida 0 en R
y en Python. **Los otros seis capítulos siguen rotos**; es una línea en cada `cadena.R`, y ya está
medido cuál: `survey` en el 2, 4, 5 y 7; `survey` + `sampling` en el 6; `survey` + `mitools` en el 8;
el 1 no necesita ninguna. **Tarea aparte, pendiente de decisión.**

**2 · El código se recortaba en el móvil, y no había manera de alcanzarlo.** Tercer miembro de la
familia de T7.44 (fórmulas) y T7.46 (tablas), y el peor de los tres porque afecta a lo que este
material es. La regla `pre.collapsed { max-height: 150px; overflow: hidden }` pliega los bloques
largos en vertical, **y de paso recorta el eje horizontal**. A 375 px los diez bloques del cap. 3
desbordaban entre **403 y 470 px** —aproximadamente la mitad de cada línea— sin barra y sin ancestro
desplazable. Arreglado en la plantilla con el mismo patrón que la tabla: `overflow-x: auto;
overflow-y: hidden`, que conserva el plegado vertical. Retropropagado a las **nueve páginas**.
Medido después: cap. 3 a 375 px, **10 de 10 bloques con barra**; cap. 8 a 270 px, **25 de 25**.

**3 · Y la prueba que yo repartí en T7.46 no distingue.** Le di a la sesión del cap. 4 esta
comprobación de alcanzabilidad: `t.scrollLeft = 999; const alcanzable = t.scrollLeft > 0`.
**No sirve.** `overflow: hidden` **sí** crea un contenedor de scroll: `scrollLeft` se deja fijar por
JavaScript aunque el usuario no pueda desplazar nada. Comprobado con un elemento fabricado al vuelo:
`width:100px`, `scrollWidth 3740`, `overflow:hidden` → `scrollLeft` queda en 999. Da «alcanzable» en
los dos casos. **La prueba buena es el estilo calculado**: `getComputedStyle(e).overflowX` tiene que
ser `auto` o `scroll`. El arreglo de T7.46 era correcto —las tablas del cap. 3 calculan hoy
`overflow-x: auto`, verificado ya con la prueba buena—, pero **la evidencia que di para él no valía**.
Avisado al cap. 4.

**Lo que sí estaba bien.** Las nueve páginas se reensamblan **byte a byte** desde sus fuentes
commiteadas. **2 694 cifras de bloques y 805 de prosa, 0 sin respaldo** en los ocho capítulos. El
JSON incrustado del cap. 3 valida, con sus 17 claves. En el navegador: 0 `.katex-error` en los doce
módulos, cada `canvas` con su gráfico vivo y **solo uno vivo al final** (se destruyen al cambiar de
módulo), las pestañas R/Python conmutando en los tres módulos que las tienen, y los **cinco
simuladores respondiendo en los extremos de sus diez controles** sin un `NaN`. Geometría a 1 280 px:
**0 solapamientos, 0 alturas cero, 0 desbordes** entre hermanos de los doce módulos.

**Falsas alarmas, anotadas para no repetirlas.** *(a)* Cinco clases sin regla CSS —`module-content`,
`glosario-texto`, `derivacion-texto`, `quiz-preguntas`, `quiz-conteo`— son **ganchos de
`querySelector`**, no componentes sin estilo. *(b)* Un primer barrido de geometría dio 98
solapamientos: comparaba cada `<p>` **anidado dentro** de un `.note` contra el rectángulo del
`.note`. Con hermanos del mismo nivel, cero. *(c)* Y la medida se hizo a 270 px sin querer, porque el
panel se había estrechado: **el ancho hay que fijarlo, no heredarlo**.

**La portada, puesta al día con `cuenta_sitio.py`.** Decía 65 simuladores, 88 preguntas, 88 módulos;
son **67, 98 y 89**. Además la tarjeta del cap. 2 decía 9 simuladores (son 10) y la del cap. 4, 12
módulos y 8 simuladores (son 13 y 9). Seis sitios en total, incluidos el `meta description` y el
`og:description`. Acordado con la sesión del cap. 4 que la portada la llevo yo.

**Una desambiguación de notación (riesgo R7 del plan).** En la cita nueva del M3 había escrito la
desigualdad de Lohr con su `R`. En este material `R` no es la correlación, y la razón poblacional es
`B`. Pasa a `\rho`, diciendo que Lohr escribe `R` y que esa `R` es la correlación, no la razón.

**Lo que enseña.** El protocolo lleva desde el principio diciendo «comprobar que cada bloque es
autónomo». Se venía comprobando **leyendo**, y leyendo está bien: los objetos se definen todos en
bloques visibles. Lo que no se ve leyendo es lo que **no está escrito en ninguna parte visible** —un
`library()` que vive en un preámbulo que nadie publica—. La diferencia entre auditar un protocolo y
ejecutarlo son seis capítulos.

**Pendiente:** el visto bueno de Javier para publicar.

---

### T7.51 — Cuatro ejercicios más en el cap. 4, y el código publicado que no arrancaba (2026-09-17)

Segunda tarea de la fase 5 (T5.2), que la cierra, más un arreglo que no estaba en el plan y pesa
más que ella.

**Los cuatro ejercicios**, que llevan el capítulo de 4 a 8 (bloques `R20`–`R23`):
- **5 · Neyman sin conocer las $S_h$.** Se calcula el reparto con las desviaciones *muestrales* de
  `agstrat` y se mide qué consigue de verdad sobre `agpop`. Las $s_h$ se equivocan mucho (172 099
  contra 271 303 en el Norte-Centro) y el reparto sale distinto (69 en vez de 86), pero el error
  estándar solo empeora un **1,81 %**. **Es la primera vez que el capítulo comprueba con números su
  propia afirmación** de que la varianza es plana cerca del óptimo, que el M4 llevaba publicada sin
  respaldo desde julio.
- **6 · Postestratificar un MAS de 40.** Al Nordeste le tocan **4** condados. Postestratificar baja
  el ee de 41 209,38 a 30 052,12; fusionar la celda chica lo deja en **31 164,74**, o sea *peor*. Ahí
  está la trampa: **no se fusiona para bajar el error estándar, sino porque con cuatro observaciones
  la estimación de la varianza no es de fiar**. Lo que se gana fusionando es el derecho a creérsela.
- **7 · `winter.csv`.** El cierre navideño de Arizona State, cuatro estratos de empleado. Ejercita
  las ecs. 3.7 y 3.8 que T7.43 añadió al M3: **0,173778** con ee **0,012019**, y la fórmula a mano y
  `svymean` coinciden al sexto decimal.
- **8 · `mysteries.csv`.** Razón combinada sobre 60 novelas nominadas al Edgar. El enunciado obliga a
  decidir *antes* de calcular, y sus doce estratos tienen **4 o 6** libros: justo alrededor del cruce
  en 5 que midió el simulador del M12. **El ejercicio del libro se responde con una cifra que
  medimos nosotros.**

**Y lo que no estaba en el plan: el código publicado del capítulo no arrancaba.** Lo detectó la
sesión del cap. 3 y se verificó aquí extrayendo del HTML servido los treinta bloques de R que ve el
estudiante y ejecutándolos en una sesión `--vanilla`: moría en el primer `svydesign()`.
`library(survey)` vive en el **preámbulo de `cadena.R`**, que va antes del primer marcador y por eso
nunca se publica. **Cualquiera que copiara el código del capítulo recibía un error en la primera
línea útil.**

El arreglo son dos líneas, y la segunda salió de no fiarse: la sesión del cap. 3 había medido que el
capítulo 4 solo necesitaba `survey`, pero al ejecutar apareció un segundo fallo, `BigLucy` —el M9
usa `TeachingSampling`—. Se cargan `survey` en el R1 y `TeachingSampling` donde se usa, siguiendo el
precedente que el bloque de `rsample` ya tenía. `sampling` y `jsonlite` no hacen falta: no aparecen
en ningún bloque publicado. **Prueba de verdad: el capítulo entero corre con código de salida 0.**

**Una evidencia que di por buena y hubo que retirar.** El «0 tablas recortadas» de T7.46 —nota de
la sesión del cap. 3, que también repartió la prueba, y que la desmontó ella misma en T7.53—
descansaba en una comprobación de `scrollLeft` que **no distingue nada**: `overflow: hidden` también
crea contenedor de scroll, así que el valor se deja fijar por JavaScript aunque el usuario no pueda
mover el contenido. La prueba buena es el estilo calculado. Repetida a 375 px sobre el capítulo 4 ya
reensamblado: **31 de 31 bloques de código** desbordaban plegados y ahora todos tienen barra (era el
`pre.collapsed` que arregló la otra sesión), 18 de 20 fórmulas con barra, 1 tabla con barra, y
**ninguno de los tres grupos deja contenido inalcanzable**.

**Una discrepancia del plan.** T5.2 pedía las soluciones en `genera_soluciones.R`, pero ese archivo
es **solo del capítulo 2**; los ejercicios del capítulo 4 viven en `cadena.R`, que es donde estaban
los cuatro originales y donde van los nuevos.

**Verificado.** Byte a byte; **528 de 528** cifras de bloques (eran 437) y **172 de prosa · 0 sin
respaldo**; `--check` sin diferencias. En el navegador: 8 ejercicios con sus 8 pistas y 8 soluciones,
0 `.katex-error`, consola limpia. M13 pasa de 35 a **50 min**.

**El mismo defecto en Python, avisado por la sesión del cap. 3 y arreglado aquí.** Los bloques de
Python del capítulo morían en la primera línea con `NameError: name 'pd' is not defined`, por la
razón idéntica: `import numpy as np, pandas as pd` vive en el preámbulo de `cadena.py`. Una línea al
principio del P1; el `sklearn` del P4 ya se importaba dentro de su propio bloque. **Las dos cadenas
publicadas del capítulo corren ahora con código de salida 0.**

**Lo que enseña.** El capítulo llevaba meses publicando código que ningún lector podía ejecutar, y
**ninguna de las comprobaciones del proyecto lo habría encontrado nunca**: la cadena se ejecuta
entera, con su preámbulo, así que siempre funcionó; el verificador compara cifras anunciadas contra
salida real, y las cifras estaban bien. **Lo que se publica no es lo que se ejecuta**, y hasta hoy
nadie había ejecutado lo que se publica. La prueba que faltaba no era más fina: era otra.

**Publicado el 2026-09-17** con el visto bueno de Javier: las fases 4 y 5 enteras más el
reetiquetado de citas (T7.47 del cap. 4, T7.48, T7.49 y T7.51), commit `9c0d430` de `main` →
gh-pages `7913210`. Solo cambió el capítulo 4; las otras nueve páginas quedaron en la versión
servida, porque lo que `main` tiene sobre ellas es de la sesión del cap. 3 y tiene su propio visto
bueno. Verificado en vivo: md5 `f5a863ab24684a9f0a894362144b9520`. **Se publicó antes que la fase 6
a propósito**: el código que no arrancaba es lo único del capítulo que impedía *usarlo*, y esperar a
una auditoría no lo mejoraba.

### T7.54 — El código publicado de todo el sitio arranca (2026-09-17)

Continuación directa de T7.53, con el visto bueno de Javier: arreglar el `library()` de los
capítulos que quedaban, esperar al cap. 4, recontar la portada y publicar todo junto.

**El alcance real era el doble de lo anunciado.** T7.53 midió el defecto solo en R. Al repetir la
prueba sobre los bloques de **Python** apareció el mismo agujero, y en más sitios:

| cadena | páginas rotas antes | después |
|---|---|---|
| R | 7 de 10 (todas menos el cap. 1, el taller y el preparcial) | **0** |
| Python | **8 de 10** | **0** |

Añadido, en el primer bloque publicado de cada cadena y no en el preámbulo:
`library(survey)` en los caps. 2, 5, 6, 7 y 8; más `TeachingSampling` en el 5, `sampling` y
`jsonlite` en el 6, `jsonlite` en el 7 y `mitools` en el 8; e
`import numpy as np, pandas as pd` en los caps. 1, 2, 5, 6, 7, 8 y en `taller1`. El cap. 3 ya lo
tenía de T7.53 y el cap. 4 lo cerró su sesión en `0e89d64` y `9c0d430`.

**Dos trampas que el método «deducir de las funciones» no ve.** *(a)* El cap. 5 necesita
`TeachingSampling` por `BigLucy` y los `S.*`/`E.*`, que no son llamadas a funciones reconocibles por
un patrón de `svy*`; lo avisó la sesión del cap. 4 tras tropezar con lo mismo en su módulo 9. *(b)*
**El primer bloque de la cadena no es el primero de la página.** En el taller, la página publica
antes el `PS1` (las soluciones) que el `P1`, así que el `import` insertado en el P1 no servía de
nada: el estudiante se encuentra primero el otro. Solo se vio ejecutando.

**La prueba, que es la lección.** Se extraen del **HTML servido** los bloques del lenguaje que sea,
se quitan las líneas `#>` y se ejecuta en sesión limpia (`Rscript --vanilla` del R 4.4, o `python3`).
Las diez páginas dan hoy **código de salida 0 en los dos lenguajes**.

**Por qué sobrevivió meses.** Ninguna comprobación del proyecto mira lo que se publica.
`anota_salidas.py` ejecuta la cadena **entera, con su preámbulo**, y por eso siempre funcionó;
`verifica_bloques.py` compara cifras anunciadas contra salida real, y también estaban bien. Las dos
herramientas miran el archivo ejecutable; **el estudiante mira la página**, y no son el mismo
programa. *Propuesto, no hecho:* un `verifica_publicado.py` que haga esta extracción y ejecución
como parte del protocolo. Toca `precalculo/`, así que se decide aparte.

**Portada, recuento definitivo con `cuenta_sitio.py`** sobre los ocho capítulos: **89 módulos, 67
simuladores, 98 preguntas, 37 ejercicios**. Los ejercicios subieron de 33 a 37 por la T5.2 del
cap. 4, contados después de su commit.

**Verificado.** Las diez páginas byte a byte en la segunda pasada; **2 694 cifras de bloques y 805
de prosa · 0 sin respaldo** en los ocho capítulos; las dos cadenas de las diez páginas con código de
salida 0.

### T7.55 — La publicación de las fases 4 y 5 del cap. 3, preparada y detenida (2026-09-17)

El commit de `gh-pages` está **construido, comprobado y sin empujar**: el entorno bloquea el `push`
a `gh-pages` («Production Deploy») y no se busca rodeo. Falta **un comando**, que hay que dar a mano:

```bash
git push origin 3782180a2c8319627a8900425004348fd0a7de70:gh-pages
```

**Qué es `3782180`.** Su árbol es **exactamente** `HEAD:sitio` de `22e91e1`
(`dd6861e8…`, comprobado con `rev-parse`), y su único padre es `7913210`, la punta actual de
`gh-pages`: **avance rápido**, sin reescribir nada de lo que publicó la sesión del cap. 4.

**Por qué no bastó el `subtree split`.** Dio `626eb6e` y **no** era avance rápido, el mismo caso que
anotó T7.32. Se resolvió igual: `git commit-tree` del árbol de `sitio/` colgado del `gh-pages` de
hoy, así la rama avanza en línea recta.

**Y una carrera que conviene recordar.** Entre el `fetch` y el `split`, la sesión del cap. 4 publicó
`7913210`. El `split` se calculó contra un `origin/gh-pages` ya viejo, y por eso su `diff` decía que
el cap. 4 «no cambiaba» cuando sí lo había hecho. **En un directorio compartido hay que refrescar
las referencias justo antes de construir el commit de publicación, no al empezar.** Comprobado
después: el blob del cap. 4 es idéntico en `gh-pages` y en `HEAD`, así que esta publicación **no lo
toca**.

**Qué cambia al empujarlo: nueve páginas**, +994 −130.

| página | qué gana |
|---|---|
| cap. 3 | las fases 4 y 5 enteras: las diez citas a Lohr, el M8, el ejercicio 2, cinco preguntas |
| caps. 1, 2, 5, 6, 7, 8 y preparcial | el código que **arranca** y `pre.collapsed` sin recortar |
| `index.html` | 89 módulos, 67 simuladores, 98 preguntas, 37 ejercicios |
| cap. 4 | **nada**: ya al día desde `7913210` |

**Pendiente tras publicar:** comprobar sobre **lo servido**, no sobre el disco, como en T7.32.

**Dos cosas que quedan como procedimiento, acordadas con la sesión del cap. 4.**

1. **`git commit-tree` sobre la punta de `gh-pages` es lo normal aquí, no un apaño.** Mientras dos
   sesiones publiquen por separado, el `subtree split` **nunca** dará avance rápido: el commit
   auxiliar que deja fuera lo ajeno no es ancestro de `main`. Las tres publicaciones del cap. 4 y
   ésta del cap. 3 han usado lo mismo por la misma razón. Deja de tratarse como excepción.
2. **Refrescar referencias justo antes de construir el commit, y comprobar el blob después.** Lo
   primero evita la carrera; lo segundo es la red que de verdad la atrapa: comparar el blob de cada
   página publicada contra el del commit aprobado, ya construido el árbol. La otra sesión se salvó
   hoy por hacer las dos cosas, y lo dice sin adorno: *por disciplina, no por diseño*.

**Y una línea sobre permisos, porque se puso a prueba.** El entorno de esta sesión bloqueó el
`push`. Le pasé a la sesión del cap. 4 el comando por si a ella se lo aprobaba Javier, y **se negó a
darlo a petición mía**, con razón: si lo diera porque se lo pide otra sesión, el bloqueo dejaría de
existir sin que nadie lo hubiera levantado. Lo correcto era dejárselo a Javier y nada más; pasar el
comando a un par ya empuja en la dirección equivocada aunque se condicione. **Un permiso denegado no
se resuelve buscando otra sesión a la que no se lo hayan denegado.**

---

### T7.52 — El verificador de lo publicado, y el push que sí podía dar (2026-09-17)

Dos encargos de Javier en una: empujar el commit que la sesión del cap. 3 tenía detenido, y escribir
el verificador que faltaba.

**El push.** Lo pidió Javier, no la sesión del cap. 3 —que es toda la diferencia: a ella se lo negué
ayer mismo, porque un permiso denegado no se levanta buscando otra sesión—. Comprobado antes de
darlo: `3782180` es avance rápido sobre `7913210`, toca nueve páginas y el blob del cap. 4 es el
mismo byte a byte (`2509cfa`). Empujado, desplegado y contrastado.

**El verificador: `precalculo/verifica_publicado.py`.** La pregunta que nadie hacía era

> ¿arranca lo que el estudiante se encuentra, con lo que el estudiante tiene?

y la causa de que nadie la hiciera está escrita en el verificador que ya existía. `verifica_bloques.py`
antepone `CABECERA_R` (`library(survey)`, `sampling`, `TeachingSampling`, `jsonlite`) y `CABECERA_PY`
(`import numpy as np, pandas as pd`) antes de ejecutar, porque su pregunta es si las cifras son
ciertas. Con el preámbulo puesto, el código corría. El defecto vivía **en el hueco entre las dos
preguntas**: el preámbulo estaba en `cadena.R`, que es lo que se ejecuta al precalcular, y no en los
bloques, que es lo que se publica.

De ahí las dos decisiones de fondo, ambas escritas en el docstring para que no se deshagan por
comodidad:

1. **No antepone nada.** Si el código publicado necesita `library(survey)`, tiene que traerlo.
   Añadirle una cabecera «para que pase» reabre exactamente el agujero original.
2. **Lee el sitio vivo, no `sitio/`.** Lo que estaba roto no era el repositorio: era lo servido.
   Con `--local` se comprueba antes de publicar; sin `--local`, se comprueba lo publicado. Y de paso
   contrasta la huella md5 de lo servido contra el blob de `origin/gh-pages`, que cubre el último
   tramo —del commit aprobado a lo que de verdad ve el estudiante—.

**Control negativo antes de fiarme de él.** Un verificador que solo se ha visto pasar no ha
demostrado nada; es la lección de la prueba del `scrollLeft`, que no distinguía nada y hubo que
retirar. Sobre el cap. 4 en `74a5bed` —anterior al arreglo— reproduce los dos defectos exactos:
`R: FALLA en el bloque 4 de 26` con `no se pudo encontrar la función "svydesign"`, y
`Python: FALLA en el bloque 1 de 5` con `NameError: name 'pd' is not defined`. La guarda del bloque
sin clase de lenguaje se probó igual, en los dos sentidos.

**Dos defectos propios, encontrados al usarlo.**

- Daba por rota `taller-1-preparacion-parcial-1.html`, que no se publica **a propósito** (la absorbió
  el preparcial: no está en `gh-pages` ni la enlaza el índice). La lista de páginas salía de `sitio/`
  y ahora sale de la rama; lo que está en `sitio/` y no se publica se informa aparte, sin llamarlo
  fallo. Un verificador que grita en falso deja de leerse, y entonces no sirve para nada.
- El JS del material dice «si el bloque no declara lenguaje, se asume R»: un `<pre><code>` sin clase
  se le sirve al estudiante como R y `BLOQUE_RE` no lo vería. Hoy no hay ninguno en las once páginas
  —comprobado—, pero es un hueco que se abriría solo y en silencio, que es justo como se coló el
  defecto de origen. Ahora aborta si aparece uno.

**Y una medición mía que estaba mal.** Conté los bloques con `grep -o 'language-r'` y salían 32 en
el cap. 4 frente a los 30 del verificador; parecía que se le escapaban dos. No: las tres menciones
de sobra están dentro del `<script>` que envuelve los bloques. 38 − 3 = 35 = 30 de R + 5 de Python.
El instrumento malo era el `grep`.

**Resultado de la primera pasada completa** (`3782180`, sitio vivo, salida 0):

| páginas publicadas | huella contra la rama | bloques de R | bloques de Python |
|---|---|---|---|
| 10 (9 con código; el índice no lleva) | 10/10 coinciden | 180, arrancan | 66, arrancan |

Documentado en `precalculo/README.md`, con el reparto entre los dos verificadores dicho en las
convenciones para que no se vuelvan a solapar.

### T7.56 — El ejemplo 7.9 y el formulario: el cap. 3 pasa a catorce módulos (2026-09-17)

> **Nota de numeración (2026-09-17).** Las dos sesiones que escriben este archivo eligieron cinco
> veces el mismo número: **T7.34, T7.47, T7.48, T7.49 y T7.51 quedaron duplicados**. Se resolvió con
> una regla neutral y comprobable —**quien commiteó antes ese número se lo queda**—, que en las cinco
> fue la sesión del cap. 4. Las notas del cap. 3 pasaron a **T7.53, T7.54, T7.55, T7.56, T7.57 y
> T7.58**, y con ellas sus referencias cruzadas y las de `PLAN_Cap3_PortelaVilleta.md`. Comprobado
> después: **57 notas, 57 identificadores citados, ninguno huérfano y ninguno repetido**. El
> comentario entre paréntesis de T7.48 que daba la duplicación por aceptada se ha quedado viejo; es
> texto de la otra sesión y lo corrige ella.
>
> **Cómo se evita:** un número de nota es un identificador compartido, y `tail` del archivo no basta
> para reservarlo cuando otra sesión tiene el suyo sin commitear. Antes de numerar, mirar también lo
> que hay **en el árbol sin commitear**.
>
> **Y lo que hay que hacer antes de commitear este archivo, que es lo que el apunte de arriba no
> decía.** Describir el fallo no lo evita: se repitió **dos veces más** después de escribirlo, en
> `57cddc4` y `25e85e6`, los dos commits de esta sesión, que se llevaron dentro correcciones de la
> otra que esperaban visto bueno. El texto llegó íntegro y no hubo que deshacer nada, pero llegó por
> accidente. **La regla de «commitear solo lo propio» se aplica también a los párrafos, no solo a las
> rutas:**
>
> ```bash
> git diff PLAN_Material_Muestreo.md      # ¿hay párrafos que no escribí?
> git add -p PLAN_Material_Muestreo.md    # si los hay, dejarlos fuera hunk a hunk
> ```
>
> Nunca `git add` del archivo entero sin mirar el `diff` antes. Y la causa de fondo no es el
> descuido: es que **los ritmos no encajan**. Una sesión que no commitea hasta tener el visto bueno
> deja su prosa en el árbol un rato largo, y en ese rato se la lleva quien commitee. Mientras eso sea
> así, el `add -p` es lo que lo tapa **desde este lado**.
>
> **Y cómo se resuelve una disputa de autoría, que hoy hicieron falta tres veces:** `git` **no
> distingue** las dos sesiones. Las dos commitean como *Javier Mauricio Sierra
> &lt;javier37649@gmail.com&gt;*, con el mismo *committer* y el mismo `Co-Authored-By`. El único
> indicio es **qué toca el commit**: `650bc8c` toca módulos del cap. 3, `genera_cap3.R` y la
> plantilla, luego su nota es de la sesión del cap. 3. **Atribuir por metadatos aquí no funciona; hay
> que atribuir por contenido.**

Encargo nuevo de Javier, fuera del plan de `PLAN_Cap3_PortelaVilleta.md`: traer al capítulo el
**Ejemplo 7.9** de Portela y Villeta y las **dos primeras tablas de su §7.3**, que el alcance
original dejaba fuera a propósito («parando antes del formulario»).

**Tres decisiones suyas antes de escribir.** *(a)* El 7.9 va en un **módulo nuevo tras el M7**,
leyendo «después del módulo II» como «después de la sección II», §7.2, igual que en el encargo
original. Ponerlo tras el M2 literal era imposible: el ejemplo decide con la regresión, el contraste
del intercepto y la comparación de varianzas, que el estudiante aún no ha visto. *(b)* Los estratos
entran **con puente explícito**, sin revocar D2: el módulo toma prestada **una sola propiedad** del
cap. 4 —la independencia entre estratos, que es lo que permite sumar varianzas— y deja allí el resto.
*(c)* Las cifras se **reproducen desde los estadísticos** de la tabla 7.8, que es lo único que el
libro publica.

**Renumeración.** M1–M7 quedan; **M8 nuevo** (tomates), el resto corre uno: dominios 8→9, modelos
9→10, GREG 10→11, mediana 11→12; **M13 nuevo** (formulario) y la autoevaluación 12→**14**. Con ella,
los bloques `R8`→`R9`, `R9`→`R10`, `R10`→`R11`, y los archivos se parten y renombran para que el
nombre diga la verdad: `modulos_5_8.html` → `modulos_5_7.html` + `modulo_9_dominios.html`;
`modulos_9_11.html` → `modulos_10_12.html`; `modulo_12.html` → `modulo_14_autoevaluacion.html`.

**La renumeración a ciegas rompió una cosa, y era la única que podía romper.** El barrido de
«módulo N» convirtió en «módulo 14» una referencia que decía **«módulo 12 del capítulo 4»**: la que
T7.58 acababa de escribir para cerrar A5. Revertida. **Un barrido por número no distingue de qué
capítulo se habla**, y en un material con referencias cruzadas ésa es exactamente la que hay que
mirar a mano.

**Lo que el ejemplo enseña, y por qué valía la pena.** Los siete módulos anteriores contestan
«¿razón, regresión, diferencia o expansión?» **suponiendo que la respuesta es una sola para toda la
población**. El 7.9 es el caso en que no lo es: tres regiones, tres respuestas distintas, y cada una
sale de un criterio distinto del propio capítulo —el contraste del M6 en la I ($p = 0{,}0010$), la
regla del M3 en la II ($R^2 = 0{,}0144$), el teorema del M7 en la III—. La **región III es el teorema
cumpliéndose a la vista**: constante 0,88 sobre una media de 306,92, y las dos varianzas estimadas
iguales hasta el segundo decimal, **292,59 y 292,59**. Eso es la condición de igualdad $B = b_1$, no
un redondeo afortunado.

**Dos desajustes de la fuente, los dos comprobados.** *(a)* El libro **trunca** $\hat R$ y $\hat b$ a
dos decimales en la tabla 7.8 —escribe 20,80 donde la división da 20,8051— y sigue calculando con lo
truncado; de ahí que su total sea 494 670 y aquí salga **494 774**, un 0,02 %. *(b)* Más serio: sus
**salidas de SAS para las regiones I y II están calculadas sobre otra muestra**. Los grados de
libertad —«Corrected Total 59» y «39»— corresponden a $n = 60$ y $n = 40$, mientras su propia tabla
7.8 declara $n_1 = 20$ y $n_2 = 13$. La región III sí cuadra (26 para $n_3 = 27$) y es la única que
se reproduce casi exactamente: constante 0,88 contra 0,88433, $p$ 0,9844 contra 0,9843. Rehechos los
contrastes con los $n_h$ declarados, **las tres conclusiones del libro se mantienen**; cambian los
$p$. Las seis cifras del libro citadas para el contraste están en `cifras_prosa.json` con su página.

**El formulario (M13)** trae las dos tablas en la notación del material —$B$ donde Portela pone $R$,
$\bar x_U$ donde pone $\bar x$— con las expresiones alternativas, y dice **lo que no trae**: la
diferencia (que es el caso $b_1 = 1$), el GREG y la calibración, posteriores al marco del libro, y la
separada/combinada, que es del cap. 4. Con el aviso de que todo vale **solo bajo m.a.s.**

**Una pregunta nueva, porque el encabezado dejó de ser cierto.** El M8 se quedaba sin ítem y el quiz
decía «sobre los once módulos». Ahora son **17 preguntas sobre los doce módulos de contenido**, y la
nueva pregunta por lo estructural: qué permite sumar las tres varianzas (la independencia entre
estratos, no que los estimadores sean buenos).

**Verificado.** Byte a byte; **261 de 261** cifras de bloques y **173 de prosa · 0 sin respaldo**; el
código publicado sigue arrancando en sesión limpia (código de salida 0). En el navegador: los catorce
módulos en orden, 533 expresiones de KaTeX con **0 errores**, consola limpia, y el mapeo
pregunta → módulo del resumen del quiz apuntando a los títulos nuevos. A 375 px: 18 fórmulas
(13 desbordan), 6 tablas (6 desbordan) y 11 bloques de código (11 desbordan), **0 sin barra** en las
tres familias. Portada: **91 módulos, 99 preguntas**.

**Publicado lo anterior, y preparado esto.** La publicación de T7.55 (`3782180`) **sí se dio**: no
por esta sesión, sino por la del cap. 4, a la que **Javier se lo pidió directamente**. Comprobado
después: `gh-pages` está en `3782180` y su árbol coincide con el que se preparó. Ése era el camino
correcto, y no el de pedírselo a un par.

Para este trabajo el commit nuevo es **`b0c4930`**, construido tras **refrescar las referencias justo
antes** —la lección de T7.55—: cuelga de `3782180`, es avance rápido, cambia **dos páginas**
(+477 −31) y el blob del cap. 4 sigue siendo `2509cfa`, byte a byte lo servido. Falta el comando, que
este entorno bloquea:

```bash
git push origin b0c4930c7c24befcbc8399230e23c86e00b7dd53:gh-pages
```

**Y una herramienta nueva que ya paga.** `precalculo/verifica_publicado.py`, escrita por la sesión
del cap. 4 (`6912d6c`) sobre el hueco que abrió T7.54: ejecuta el código **tal como está publicado**,
sin anteponerle nada. Corrida sobre el capítulo con catorce módulos y sobre el sitio entero:
**arrancan todas**, R y Python, salida 0. Es la primera vez que eso se comprueba con una herramienta
y no a mano. *Con una precisión sobre el recuento, que apuntó la sesión del cap. 4:* en modo
`--local` son **once** páginas y contra la rama publicada son **diez**, porque `taller-1` vive en
`sitio/` pero lo ignora el `.gitignore` y no se publica.

**Pendiente:** el visto bueno de Javier.

---

### T7.59 — La fase 6 del cap. 4: el protocolo entero, y tres medidas mías que fallaron (2026-09-18)

**T6.1**, la última tarea del plan del capítulo 4: el protocolo de verificación punto por punto, el
recuento de `cuenta_sitio.py` y la portada. Primera tarea con el método nuevo —esta nota vive fuera
del repositorio hasta el visto bueno, y entra en el archivo y en el commit en el mismo paso—.

**Regla de oro.** `ensambla_cap4.py` reproduce la página publicada byte a byte: md5
`f5a863ab24684a9f0a894362144b9520` antes y después de reensamblar.

**El protocolo, punto por punto.**

| # | Qué pide | Resultado |
|:--:|---|---|
| 1 | cada cifra `#>` contra la salida real | **528 de 528**, 0 discrepancias; prosa **172 respaldadas, 0 sin respaldo** |
| 2 | bloques autónomos o encadenados de verdad | 30 de R y 5 de Python, salida 0 **sin anteponer nada** (`verifica_publicado.py`) |
| 3 | doble vía en toda varianza | **16 de 16** contrastes «a mano ↔ `survey`/teórica» pasan, más 5 `stop()` de guarda; el JSON se regenera **idéntico** |
| 4 | navegador: consola, KaTeX, pestañas, simuladores, gráficos | 0 errores de consola y de JS; **0 errores de KaTeX en 338 fórmulas**; pestañas conmutan; **21 deslizadores a mínimo y máximo + las dos esquinas de cada simulador, sin una salida no finita**; los gráficos se destruyen al cambiar de módulo (tras recorrer los 13, quedan vivos 1, no 13) |
| 5 | CSS contra la plantilla, y geometría real | **196 clases con estilo en cada uno, conjuntos idénticos en los dos sentidos**; 122 elementos de bloque en 36 contenedores: ninguno de tamaño cero, ninguno solapado, ninguno desbordando sin barra |
| 6 | JSON incrustado válido | `DATOS_CAP4` parsea y es **idéntico** al JSON del precálculo (11 secciones) |
| 7 | auditoría reportada | esta nota |

**A 375 px**, con estilo calculado —la prueba buena, no `scrollLeft`—: 35 bloques, 31 desbordan,
**0 inalcanzables**; 20 fórmulas, 11 desbordan, 0 inalcanzables; 2 tablas, 1 desborda, 0
inalcanzables; **0 px de scroll horizontal de página**.

**Recuento.** `cuenta_sitio.py`: el cap. 4 tiene **13 módulos, 9 simuladores, 1 tabla-ranking, 16
preguntas, 8 ejercicios, 30 bloques de R y 5 de Python, 222 cifras `#>`**. La portada **ya está
bien** en `b0c4930`: sus 91 módulos, 67 simuladores, 99 preguntas y 37 ejercicios son exactamente el
total sin el preparcial (104−13, 158−59, 42−5). Es tarea del T5.1 del plan del cap. 3 y cuadra.

**Tres medidas mías que fallaron, y ninguna era un defecto del capítulo.** Es lo que más enseña de
esta tarea, porque las tres tenían la misma forma: *el instrumento estaba mal, no lo medido*.

1. Conté los bloques con `grep -o 'language-r'`: 32 frente a los 30 del verificador. Las tres
   menciones de sobra están **dentro del `<script>`** que envuelve los bloques.
2. Di por «no usadas» las 11 secciones de `DATOS_CAP4` buscando `DATOS_CAP4.<clave>`. Están
   aliasadas: `const D4 = DATOS_CAP4`. Usadas 8 de 11; `meta`, `agstrat` y `peq` viajan sin que nada
   las lea —~600 bytes de 432 KB, y comprobado que **ningún simulador las recalcula a mano**—.
3. Medí la geometría en el archivo local y salió todo a cero. El viewport era **0×0**: la vista
   previa carga el archivo como instantánea estática. Repetido sobre la página servida —byte a byte
   la misma— con viewport forzado a 1280×900.

Y una cuarta, de interpretación: di por roto el «⇅» de la tabla-ranking porque el segundo clic no
invierte. No invierte **a propósito**, y el código lo dice: «toda columna ordenable ordena de *mejor*
a *peor*, así que el sentido depende de `mejor` y no del signo del número». El `⇅` es «ordenable» y
el `▲` «ordenando por esta»; `aria-sort` se mueve con ellos y una región viva anuncia el nuevo orden.
Un ranking invertido enseñaría el peor diseño primero.

**Lo que no se pudo ver.** La captura de pantalla sale en blanco porque el panel del navegador está
oculto. Todo el punto 4 está verificado **por medición del DOM y del estilo calculado**, que es más
fuerte que una imagen; pero queda dicho que nadie ha mirado el capítulo con los ojos en esta pasada.

**De paso.** `verifica_publicado.py` decía «las 1 páginas»; corregido con un `plural()`.

---

### T7.60 — Las dos decisiones que quedaban del cap. 4, y el plan cerrado (2026-09-18)

Con el visto bueno de Javier, aplicar las dos recomendaciones que quedaban abiertas. Las dos eran
«no», así que **el capítulo no cambia ni un byte**: lo que se cierra es el plan, no el material.

**D5 — la $\sqrt f$ acumulada (Dalenius–Hodges) para fijar los cortes: NO.**

La razón que tenía anotada era «Lohr 3.ª ed. no la trae», y venía de mi memoria, no de la fuente.
Comprobada contra el epub de la 3.ª edición (342 742 palabras):

| término | apariciones |
|---|---:|
| `Hodges` | **0** |
| `cumulative square root` | **0** |
| `stratum boundaries` (en el cap. del estratificado) | **0** |
| `Dalenius` | 2 — y **ninguna es ésta**: un artículo de 1977 sobre error ajeno al muestreo, citado en el cap. 16 y en la bibliografía |

Un estudiante no podría contrastar la regla con el libro del curso. Pero la razón de peso es la
segunda, y sale del propio capítulo: **la regla tiene el defecto que el capítulo ya mide**. Fija los
cortes óptimos para **una** variable, y el M4 y el M6 demuestran con `agpop` que lo óptimo para una
es malo para otra —`acres92` y `farms92` correlan 0,147, y la Neyman de la primera deja a la segunda
en **deff 1,1190**, peor que un MAS—. Enseñar una receta de cortes con ese mismo defecto
contradiría la lección que el capítulo acaba de medir. Queda anotada en «fuera de alcance» con su
fuente (Cochran §5A.7) y con su límite dicho, por si otro curso la quiere.

**D4 — `college.csv` en el material: NO.** No aparece en ninguna página ni en ninguna cadena, así
que no hay nada que deshacer. El taller puede reutilizarse otro semestre y meter su conjunto en el
material lo quema; y `agpop` ya da la misma lección, medida y publicada en el `R6B`.

**Una cifra mía que estaba vieja.** Al escribir D4 iba a citar «deff 1,105», que es lo que decía el
diagnóstico y lo que yo le había dicho a Javier hace un rato. **El plan ya lo había corregido**: con
las asignaciones redondeadas que se publican, el deff de `farms92` bajo la Neyman de `acres92` es
**1,1190**, no 1,105 (el 1,105 usaba $n_h$ exactos). Escrito el publicado, que es el que reproduce
los 0,8224 y 0,5510 del R6.

**Y dos tareas que estaban hechas y sin marcar:** T5.1 (cinco preguntas, `d95722a`, T7.48) y T5.2
(cuatro ejercicios, `0e89d64`, T7.51). Al cerrarlas quedan escritos los **dos desvíos deliberados**
del enunciado de T5.2, que hasta ahora solo vivían en su nota: la solución no fue a
`genera_soluciones.R` —que es solo del cap. 2— sino a `cadena.R`; y el Ej. 3.12 con `college.csv` no
se escribió, porque D4 lo deja fuera.

**El plan del capítulo 4 queda cerrado: 13 tareas hechas, 0 abiertas; 5 decisiones tomadas, 0
abiertas.** `PLAN_Cap4_Lohr3e.md` no está versionado, así que ese archivo no entra en el commit.

---

### T7.61 — El verificador de referencias cruzadas, y tres que siguen rotas (2026-09-18)

Encargo de Javier tras el hallazgo del día: al pasar el cap. 3 de 12 a 14 módulos, **ocho
referencias de cuatro capítulos quedaron apuntando a otro módulo**, y las ocho pasaron
`verifica_bloques.py --prosa` antes y después. Con razón: esa herramienta comprueba que las CIFRAS
salgan de una ejecución, y «módulo 8» es una cifra respaldada trate el módulo 8 de lo que dice la
frase o de otra cosa. Las ocho las encontró la sesión del cap. 3 leyendo.

**`precalculo/verifica_referencias.py`.** Resuelve cada «capítulo C, módulo N» contra el
`courseData` de la página de destino y comprueba tres cosas: que el módulo exista; que **no haya
cambiado de destino** desde que se revisó (línea base en `referencias_cruzadas.json`); y, para las
que aún no están en la línea base, cuánto se parece el título al contexto. La segunda es la que
cierra el hueco: las otras dos solo adelantan trabajo.

**Control negativo, que es lo único que demuestra que sirve.** Línea base sobre el material en
`251d1bf^` (cap. 3 con 12 módulos) y comprobación sobre `251d1bf` (con 14): **caza las 8**, con
nombre, destino viejo y destino nuevo, y sale con código 1. Y encuentra **una novena en el cap. 5**
que no había visto nadie.

**Seis defectos míos, encontrados usándola.** Van dieciséis hoy del mismo tipo, y todos los de hoy
son medidas mías, no del material:

1. El singular admitía lista, así que «el estratificado del módulo 3, **16 380**» —donde 16 380 es
   un error estándar— se leía como «módulos 3 y 16» e inventaba un módulo 16 inexistente.
2. No reconocía «capítulo 3 **(**módulo 11**)**», con paréntesis en vez de coma. Dos del cap. 7.
3. **No reconocía «cap. 4, módulo 8»**, la forma abreviada, que el material usa **22 veces**. Las
   conté en el primer barrido y no las implementé: esas 22 se resolvían contra el capítulo
   equivocado y se daban por buenas.
4. La ambigüedad se buscaba en una ventana de 120 caracteres. Con eso se escapa «El capítulo 3 ya
   estimó … y repitió la receta con los dominios (módulo 8)»: el «capítulo 3» queda a unos 130, y el
   «módulo 8» resuelve contra el capítulo propio —que también tiene un 8— y **pasa por bueno**. Se
   busca ahora en la FRASE.
5. El archivo tenía **caracteres de retroceso literales** (`\x08`) donde yo creía haber escrito
   `\b`: el heredoc se comió el escape y la expresión estaba mal sin que se notara.
6. Una comprobación heurística —«¿encaja mejor otro módulo?»— daba **24 avisos y casi ninguno
   valía**, porque medía el contexto ANTERIOR, que suele ser la frase de antes. Acotada a la frase
   bajó a 11, y **aun así se retiró del informe**: una sección que grita en falso enseña a
   saltársela, y entonces tampoco se leen las que importan. La función queda solo como pista dentro
   de la cola de ambiguas.

**Tres que siguen rotas en el árbol, y ninguna es del cap. 4.**

| dónde | dice | debería decir |
|---|---|---|
| cap. 5 | «desde el **módulo 9** del capítulo 3» | **10** — *Modelos poblacionales* |
| cap. 7 | «los dominios (**módulo 8**)» | **9** — *Estimación en dominios* |
| cap. 7 | «con la mediana (**módulo 11**)» | **12** — *Parámetros no lineales: la mediana* |

Las dos del cap. 7 están en la misma frase, y son de las que la revisión a mano arregló **alrededor**
sin verlas. No se tocan aquí: el cap. 7 está dentro de la publicación pendiente de la otra sesión y
el cap. 5 no es de este plan.

**Lo que falta.** La línea base está vacía: las 395 referencias del sitio salen como «sin revisar»
hasta que alguien las mire y ejecute `--anota`. Sembrarla sin revisar grabaría los errores de hoy y
la herramienta dejaría de servir para siempre, así que no se siembra hasta que las tres de arriba
estén arregladas.

---

### T7.62 — Las tres referencias rotas, y las 395 revisadas una a una (2026-09-18)

Encargo de Javier: arreglar las tres que encontró `verifica_referencias.py` y revisar el resto para
sembrar la línea base.

**Las tres.** Una línea en cada capítulo, las dos del cap. 7 en la misma frase:

| dónde | decía | dice |
|---|---|---|
| cap. 5 | «desde el módulo **9** del capítulo 3» | **10** — *Modelos poblacionales* |
| cap. 7 | «los dominios (módulo **8**)» | **9** — *Estimación en dominios* |
| cap. 7 | «con la mediana (módulo **11**)» | **12** — *Parámetros no lineales: la mediana* |

Las dos páginas reensamblan **byte a byte**, el diff son **2 líneas**, y verifican: **163/163** y
**241/241** cifras de bloques, 55 y 54 de prosa con 0 sin respaldo, y los cuatro encadenados de R y
Python con salida 0.

**La revisión: 395 referencias, y no todas costaban lo mismo.** La clave fue no tratarlas igual:

1. **80 traen el título al lado** —«Capítulo 1, módulo 2 · Marco conceptual», «(ICC y deff)»—, así
   que se comprueban **exactas**, sin criterio: 62 casan literalmente con el título del destino y 18
   son paréntesis descriptivos, revisados uno a uno y todos correctos.
2. **48 son cruzadas sin etiqueta**, que son las que rompe una renumeración ajena. Revisadas una a
   una contra el contenido del módulo de destino: la SSW en *Un modelo para el estratificado*, Kish
   en *La correlación intraclase*, Woodruff en *la mediana*, el IPFP en *Calibración y raking*,
   Hansen–Hurwitz en el suyo… **todas correctas**.
3. **17 sin capítulo claro.** Resueltas a mano: cinco eran del propio capítulo pese a nombrar otro
   («en el módulo 10 **de este capítulo**»), y una el verificador la atribuía al cap. 4 cuando la
   frase dice «el raking en el **7** (módulo 6)» — elipsis que ninguna expresión regular va a
   resolver. Dos hacían una afirmación comprobable y se comprobó: **−19,32 está en el M1 del cap. 1
   y 6,3 en el M7**, que es lo que el cap. 8 promete.
4. **265 del propio capítulo**, que solo rompen si su capítulo se renumera a sí mismo.

**Una sola imprecisión en todo el material**, y no es un enlace roto: el cap. 3 dice «el paquete que
el capítulo 2 presentó en su módulo 5», pero `library(survey)` está en el **M1** del cap. 2 y el
primer `svydesign` en el **M3**. El M5 usa `survey`, así que el enlace lleva a algo pertinente. Es
del cap. 3: avisada la otra sesión, no se toca desde aquí.

**Línea base sembrada**: `precalculo/referencias_cruzadas.json`, 395 referencias, 60 KB. Desde ahora
la pasada sale limpia y cualquier renumeración que mueva un destino salta sola. La regla que queda
escrita en el docstring sigue siendo la importante: **`--anota` solo después de mirar**, porque
sembrar sin revisar graba los errores y la herramienta deja de servir para siempre.

---

### T7.63 — La publicación de los capítulos 3, 4, 5 y 7 (2026-09-18)

Con el visto bueno de Javier, publicar la tanda entera. `main` en `12e2bd9`, `gh-pages` de
`3782180` a **`a550483`**.

**Qué entra.** Cinco archivos:

| página | qué lleva |
|---|---|
| cap. 3 | las contradicciones internas deshechas, el ejemplo 7.9 de Portela y el formulario: catorce módulos |
| cap. 4 | la fase 6 auditada entera, más las cuatro referencias cruzadas renumeradas |
| cap. 5 | una referencia: *Modelos poblacionales* pasó de M9 a M10 |
| cap. 7 | dos referencias en la misma frase: dominios M8→M9 y la mediana M11→M12 |
| índice | 91 módulos · 67 simuladores · 99 preguntas · 37 ejercicios |

Los otros cinco publicados se quedan **byte a byte** como estaban.

**La puerta de verificación, las cuatro comprobaciones antes de empujar.**

1. Los cuatro capítulos **reensamblan byte a byte** desde sus módulos, y el árbol queda limpio.
2. `verifica_bloques.py --todos --prosa`: sin discrepancias y **0 cifras de prosa sin respaldo**.
3. `verifica_publicado.py --local`: **las 11 páginas arrancan**, R y Python, sin anteponerles nada.
4. `verifica_referencias.py`: **406 referencias, 0 cambios de destino**. Primera publicación con esta
   comprobación puesta, y es la que faltaba: las cuatro referencias del cap. 4 y las tres de los
   caps. 5 y 7 que entran hoy llevaban rotas desde que el cap. 3 creció, y ninguna de las otras
   herramientas las veía.

**El procedimiento, más corto de lo que venía siendo.** No hizo falta ni worktree separado ni
restaurar páginas ajenas: **todo lo que había cambiado estaba aprobado**, y el árbol versionado de
`sitio/` es exactamente lo que `gh-pages` debe tener —sin `taller-1`, sin `.DS_Store`, sin
`launch.json`, que solo existen en disco—. Así que el árbol a publicar sale directo de
`git rev-parse HEAD:sitio`, sin `subtree split`, y encima de la punta con `git commit-tree`. Queda
anotado: **cuando no hay nada ajeno que excluir, la publicación son dos órdenes.**

**Coordinación.** La otra sesión iba a preparar ella el commit; se le avisó a tiempo para que no
empujáramos los dos, y **congeló el árbol** durante la verificación para no romper el «byte a byte»
a mitad. Confirmó que no tenía nada sin commitear.

**Lo que viene, anotado por ella y que afecta a las nueve páginas.** El motor del quiz vive en la
plantilla y **no enseña nunca la retroalimentación de los distractores**, aunque el material promete
que sí: al acertar solo se ve la de la correcta, y al fallar, la pista. De las 39 retros de
distractor escritas para el cap. 3, un estudiante lee cero o una. Arreglarlo toca la plantilla, así
que se retropropaga a las nueve y hay que coordinar quién reensambla y quién verifica.

---

### T7.64 — La revisión del capítulo 3: el informe, y los seis bloqueantes (2026-09-18)

Encargo de Javier: revisar el capítulo 3 entero —redacción, coherencia narrativa y explicativa,
pertinencia y calidad de gráficos y simulaciones, y si las preguntas están bien planteadas, bien
barajadas y evalúan lo que deben—. Se repartió en **cinco lecturas independientes** (M1–M4, M5–M8,
M9–M13, gráficos y simuladores, evaluación) y cada afirmación fuerte se comprobó antes de darla por
buena. El informe completo está fuera del repositorio; lo que sigue es lo que se arregló.

**Lo que las herramientas del proyecto ya daban por bueno, y seguía estándolo:** 261/261 cifras de
bloques, 173 de prosa sin una sola sin respaldo, el código publicado arrancando solo y 0 módulos
formalizando antes de anclar. **Ninguno de los defectos de abajo lo habría cazado `--prosa`.**

**Seis bloqueantes**, commit `65b5960`:

| # | dónde | qué pasaba |
|:--:|---|---|
| 1 | M13, formulario | La fila del *estimador* de la varianza dividía por $\bar x_U$ y daba 5 344 567 donde el capítulo publica **5 540 376**, un 3,66 %. La de la varianza teórica sí era correcta |
| 2 | M12, simulador de la mediana | Leía los cuantiles de una curva adelgazada 1 de cada 3, se saltaba la unidad 150 y publicaba **196 733** —el convenio `math` que el propio módulo declara que NO usa— dos renglones encima de «mediana estimada: 196 701». Y en $p = 0{,}95$ el cuantil, 1 019 300, caía fuera del eje |
| 3 | M4, simulador del sesgo | Las barras de Monte Carlo llevaban `x` numérica sobre un eje de **categorías**: nueve de los dieciocho puntos se amontonaban en la última barra |
| 4 | M8 | «Dos de sus tres sumandos son insesgados» y la propia frase nombra uno |
| 5 | banco | En los **doce** ítems de opción única la correcta era, sin excepción, la más larga: 12 de 12 sin abrir el capítulo |
| 6 | ejercicio 4 | La pista mandaba mirar si la pendiente está cerca de 1 —vale **0,6133**—, llamaba «fuertemente relacionados» a datos con $r = 0{,}6242$ y concluía diferencia cuando gana la regresión (EE 0,4168 contra 0,4568) |

**Y ocho enlaces rotos por la renumeración a catorce módulos**, que era el riesgo que la restricción
R1 del plan del capítulo nombraba por su nombre: cuatro en el cap. 4, tres en el cap. 7, uno dentro
del propio cap. 3 y cinco comentarios de código. **Las ocho pasaban `--prosa` antes y después**: el
verificador comprueba que las cifras salgan de una ejecución, no que una referencia apunte a donde
dice. De ese hueco salió `verifica_referencias.py` (T7.61), escrito por la otra sesión.

---

### T7.65 — El capítulo 3 deja de desmentirse a sí mismo (2026-09-18)

Commit `12e2bd9`. Seis autocontradicciones, las fórmulas que cambiaban de escala o de divisor sin
avisar, y cinco citas mal dirigidas.

**Las que el propio capítulo desmentía.** La nube de linealización «se desvía hacia abajo» y se
desvía **hacia arriba** —media(lineal − exacto) = +613 263 sobre los 600 puntos publicados—. Los
«intervalos del módulo 2» no existen, y `confint` no aparecía en ningún bloque. El pie de la tabla
ordenable del M7 sostenía el argumento que el propio M7 desarma. La cuarta línea de «cuál pide cada
nube» usaba el umbral contra los cuatro estimadores. `diámetro²` prometía «devolver el problema al
terreno de la razón» y el contraste **sigue** rechazando el origen, $p = 0{,}0248$. Y la región II
del M8 se etiquetaba «Regla del módulo 3» sin que el bloque la evaluara.

**El divisor, que eran tres convenios sin declarar.** $n-2$ para `agsrs`, $n-1$ en los tomates y
$n-1$ en el formulario. Unificado en **$n-2$**, que es el de Lohr y el de la cifra insignia
5 330 862. El EE del total de tomates pasa de 19 909 a **20 051**.

**Y una consecuencia que el informe no había previsto:** con $n-2$, el empate de la región III deja
de verse (292,59 contra 304,29). No es que el teorema falle, y el bloque lo descompone: sobre el
mismo divisor las dos varianzas distan **0,0054** —el cuadrado perfecto del M7, con la condición de
igualdad casi cumplida— y los **11,7035** restantes son el divisor, un factor 1,0400. El argumento
de la región II sale **reforzado**: con $n-2$ la regresión no gana un 1,4 %, pierde frente al m.a.s.

**El bloque R10 no cumplía la promesa del módulo**: imprimía tres estimadores donde el de Python
imprimía cinco, y el M11 promete «los cuatro son cuatro valores de $\beta$». Ahora trae los cinco,
en el mismo orden que Python, con `v_k = 1` marcado como lo que es: ninguno de los cuatro.

Además: $V(b)$ llevaba un $N^2$ de menos, `reg$R` reintroducía la $R$ de Portela que el material
prohíbe, el M9 nunca escribía la varianza de la media de dominio, y `qrule` tiene **doce** convenios,
no nueve. Las 22 referencias nuevas se revisaron una a una contra el título del destino antes de
sembrarlas en la línea base.

---

### T7.66 — Las 39 retros que el motor nunca enseñaba, y el banco del cap. 3 (2026-09-18)

Commit `d0437f8`. **El arreglo grande no es del capítulo 3: es del motor del quiz**, que vive en la
plantilla y afecta a las nueve páginas.

El material promete que «cada opción trae su propia retroalimentación, también las incorrectas». El
motor no lo hacía: al acertar mostraba solo la de la correcta; al primer fallo, la **pista** en lugar
de la retro de lo marcado; al segundo, la de la segunda opción. **La retro del primer distractor
elegido no se veía nunca.** Ahora `cerrar()` recibe las opciones barajadas y cuáles se han visto, y
vuelca el resto en un desplegable «Por qué las demás», con su letra y marcando la correcta si el
estudiante no dio con ella.

**El banco pasa de 17 a 21 preguntas.** Dos ítems que no medían lo suyo —el `multiple` 3-de-4 del M4,
que es un «señala la falsa» disfrazado, y el del M6, que preguntaba el *nombre* de una función— y
cuatro huecos de cobertura: el cálculo del EE del total por razón, la regla de la pendiente del M7,
la decisión por grupos del M8 y las dos fórmulas del total de dominio del M9. Los doce módulos de
contenido quedan cubiertos, el orden pasa a ser ascendente y la correcta no es la más larga en
ninguno de los 15 de opción única.

**Verificado a cuatro manos.** La otra sesión comprobó por su cuenta que las líneas añadidas y
quitadas son **idénticas en las ocho páginas ajenas** (huella `94b74c54…`), que las once reensamblan
byte a byte, y los cuatro caminos del motor en el navegador. Cazó además el riesgo real del cambio,
que aquí no se había mirado: **el panel es DOM inyectado después del render**, así que KaTeX podía no
pasar por él. Pasa.

**Pendiente:** publicar esta tanda —lo da una sola sesión, no las dos— y los bloques 4 (los dos
gráficos que faltan, en el M5 y el M3, y la decisión D4) y 5 (redacción menor y los dos README, que
siguen diciendo «88 módulos, 65 simuladores» cuando son 91 y 67).

---

### T7.67 — El README que sí se sirve, con las cifras de hace dos semanas (2026-09-18)

Lo encontró la sesión del cap. 3 mirando el árbol de `gh-pages`, y el hallazgo de fondo es de
dónde salió: **`sitio/muestreo/README.md` está entre los 14 archivos publicados**, y las dos
sesiones lo tratábamos como interno. Se sirve, y decía «88 módulos, 65 simuladores, 88 preguntas,
33 ejercicios, 183 bloques y 2 033 cifras» cuando son **91, 67, 103, 37, 215 y 2 786**.

**Era peor que lo reportado.** El aviso hablaba de una fila; eran **el total y tres filas**:

| | decía | dice |
|---|---|---|
| cap. 2 | 11 / **9** | 11 / **10** |
| cap. 3 | **12** / 6 | **14** / 6 |
| cap. 4 | **12** / **8** | **13** / **9** |

La del cap. 4 es desfase propio: el simulador de razón estratificada del M12 lo añadió esta sesión
y nadie tocó el README. Por eso lo arregla esta sesión y no la otra, aunque lo encontrara ella.

**Ninguna cifra a mano:** las ocho filas y los totales salen de `cuenta_sitio.py` restando el
preparcial —que el README no cuenta—, y las 2 786 de sumar lo que `verifica_bloques --todos`
contrasta en los ocho capítulos. Comprobado después fila a fila contra el contador: 0 discrepancias.

**El hueco que deja al descubierto.** Las tarjetas del índice estaban **todas correctas**; el README
no. La diferencia es que la portada la revisa alguien cada vez que cambia un capítulo, y el README
no lo mira nadie: ninguna de las cuatro herramientas lo toca —`verifica_bloques` y
`verifica_publicado` solo leen `.html`, `verifica_referencias` también, y `cuenta_sitio`
cuenta pero no contrasta—. **Es el único archivo publicado sin ninguna verificación encima.**

---

### T7.68 — El motor del quiz publicado, y `main` deja de vivir en un solo disco (2026-09-18)

Con el visto bueno de Javier, las dos acciones que estaban paradas y que **no son la misma**:

- **`gh-pages`: `a550483` → `f139b42`.** Once archivos.
- **`main`: `d49429c` → `354655b`** en `origin`. Diez commits que hasta ahora solo existían en este
  disco: los tres bloques de la otra sesión y los siete de ésta.

**Qué se arregla para el estudiante.** El motor cerraba cada pregunta **sin enseñar nunca la
retroalimentación de las opciones que no eligió**: al acertar veía solo la de la correcta, y al
fallar, la pista. De las 39 retros de distractor escritas para el cap. 3, un estudiante leía **cero
o una**; lo mismo en los otros ocho capítulos. Ahora se despliega «Por qué las demás» con todas, con
su letra, y marcando la correcta si no dio con ella. Es la mitad del valor didáctico del banco, que
llevaba escrita desde el principio y no se leía.

Van además el banco del cap. 3 rehecho (17 → 21 preguntas), el índice a 103, la tarjeta del cap. 3
que decía 5 000 réplicas donde son 200 000, y el README publicado puesto al día.

**El reparto que funcionó, y por qué.** Retropropagó la otra sesión, verificó ésta. La comprobación
que hace útil ese reparto no es repetir sus pruebas: es la que **solo puede hacer quien no escribió
el cambio**. Extraje las líneas añadidas y quitadas de mis siete capítulos y del preparcial y
comparé sus huellas: **las ocho idénticas** (`94b74c54…`). Eso descarta que se colara contenido en
un cambio de plantilla, y el «+76 −5 en cada una» que ella reportó no lo descarta —el recuento
coincide aunque el contenido difiera—.

**Y la que nadie había mirado.** El panel se construye con `innerHTML` **después** del render, que
es el sitio clásico donde la matemática se queda sin procesar. No se queda: 4 expresiones, 0
`.katex-error`, ningún `$…$` crudo. La otra sesión lo dijo claro: «ése era el riesgo real y yo no lo
había mirado».

Probados los cuatro caminos sobre el cap. 4 —ella probó el 3 y el 6—: acierto a la primera, fallo y
luego acierto, fallar sin acertar (marca «era la correcta») y selección múltiple, que no despliega
panel porque sus opciones no llevan retro propia.

**Anotado para la próxima: publicar y empujar `main` son dos cosas distintas.** `gh-pages` solo
lleva `sitio/` —catorce archivos—, así que el PLAN, `precalculo/`, `ensamblado/` y la plantilla no
llegan nunca al sitio; y publicar no respalda el repositorio. La otra sesión las había juntado en
una frase, y es el tipo de confusión que acaba publicando de más.

---

### T7.69 — La regresión de LaTeX que publiqué, y por qué no la vio ninguna prueba (2026-09-18)

`gh-pages` de `f139b42` a **`8b92a42`**; `main` en `9e9ec78`. Cuatro archivos.

**Lo que se quita.** La publicación anterior llevaba cuatro preguntas del cap. 3 con el LaTeX roto:
escritas con **barra simple dentro de un literal de JavaScript**, que se come la barra antes de que
KaTeX la vea. Se leía `dfrac{963,464,412}{301,953{,}72}sqrt{...}` donde va una fórmula. Lo
encontró la otra sesión y avisó antes de que lo encontrara nadie más. Y buscando si había más
apareció **el mismo defecto en el cap. 2**, en cuatro `$\pi_k$` de una retroalimentación sobre
Horvitz–Thompson, **desde que se escribió**.

**Por qué no lo vio ninguna prueba, medido.** Es lo que hay que guardar de esta tarea:

| caso | `.katex-error` | `.katex` | consola | `$…$` crudo |
|---|:--:|:--:|:--:|:--:|
| `\b` (retroceso) | **0** | 0 | error | sí |
| `\t` (tabulador) | **0** | 1 | muda | no |
| `pi`, `dfrac` sin barra | **0** | 1 | muda | no |

**`.katex-error` es 0 en todos los casos**: auto-render captura el error, lo escribe en consola y
deja el texto tal cual. Esa comprobación —que esta sesión usó y dio por buena **tres veces** hoy, una
de ellas para afirmar que el panel inyectado del motor del quiz renderizaba bien— no sirve para
nada. Y la familia que más abunda no deja **ninguna** señal: `pi_k` es LaTeX válido, son letras en
cursiva. KaTeX no falla en silencio; **no falla**. Hace lo que se le pide, y lo que se le pide ya no
es lo que se escribió.

**La frontera** no es «carácter de control o no», es si KaTeX rechaza el carácter: `\b` da U+0008,
que rechaza; `\t`, `\n` y `\r` dan blancos, que se traga, así que `\tfrac{1}{2}` queda
`frac{1}{2}` — válido, igual que `dfrac`.

**Dónde sí se ve: en la fuente.** Y acotado, porque el peligro no está en todos los `$…$`: en los
módulos `.html` la barra simple es **correcta** —hay **2 665** así y todas están bien—, porque no
hay literal que parsear. La regla es **dentro de literal JS, `\\`; en texto HTML, `\`**.

**Dos inferencias mal hechas por el camino, una de cada sesión.** La otra concluyó de la consola que
el defecto avisaba; esta concluyó del DOM que el byte de control estaba en el archivo. Comprobado a
nivel de bytes: **0 bytes de control** en los diez `.js`, en los módulos y en la página publicada;
el U+0008 solo existe en memoria. Las dos veces se dedujo algo sobre la fuente mirando lo que había
**después de parsearla**.

**El recuento estuvo a punto de salir viejo otra vez.** Los tres gráficos nuevos llevan el cap. 3 de
6 a 9 simuladores y el total de 67 a 70, y la portada seguía en 67 — el mismo defecto que T7.67
acababa de arreglar. Lo avisó la otra sesión: **el que publica ve lo que cambia, el que escribió
sabe lo que significa**, y ninguna de las tres puertas mira el recuento.

**Verificado en vivo:** 11 de 11 archivos coinciden con `8b92a42`, los 20 encadenados salen con 0,
y sobre lo servido: **0 literales con LaTeX sin barra y 0 bytes de control** en los capítulos 2 y 3.

**Pendiente:** meter esa comprobación en `verifica_bloques.py`. Existe como script suelto y se pasó
a mano antes de empujar; mientras no esté en la puerta, depende de que alguien se acuerde.

---

### T7.70 — Los gráficos que le faltaban al capítulo 3, y un LaTeX que publiqué roto (2026-09-18)

Bloques 4 y 5 de la revisión, commits `b0dfddb`, `8f1885b`/`48e2a8d` y `4f94c6b`.

> Numerada 70 y no 67: el 67 ya era de **T7.67**, de la otra sesión, commiteado dos horas antes.
> El error fue mío y de método: comprobé el último número antes de escribir T7.64–T7.66 y luego
> añadí esta nota sin volver a mirar el archivo, que entretanto había crecido tres entradas. La
> publicación de esta misma regresión está contada desde el otro lado en **T7.69**.

**Lo primero, porque fue un defecto publicado.** Los cuatro ítems que añadí al banco en el bloque 3
llevaban el LaTeX con **barras simples** —`'$\bar{x}$'` en vez de `'$\\bar{x}$'`—, y JavaScript se las
come antes de que KaTeX las vea. Cuatro preguntas del capítulo 3 estuvieron en la página viva
mostrando `ar{x} = 301 953,72`. Buscando si había más apareció **la misma rotura en el capítulo 2**,
cuatro `$\pi_k$` en la retro de la pregunta sobre Horvitz–Thompson, que llevaban ahí desde que se
escribieron.

**Por qué ninguna verificación lo veía, medido con la configuración real de la página:**

| rotura | `.katex-error` | `.katex` | `$…$` crudo | consola |
|---|:--:|:--:|:--:|:--:|
| `\b` — control **no** blanco | 0 | 0 | **sí** | **sí** |
| `\t` `\n` `\r` — control blanco | 0 | 1 | no | no |
| `\pi` `\hat` `\dfrac` — pierde la barra | 0 | 1 | no | no |

`.katex-error` **no se crea nunca**. Y la familia grande es completamente muda, porque quitarle la
barra a `\pi` deja `pi`, que es LaTeX válido: KaTeX no falla, hace exactamente lo que se le pide, y
lo que se le pide ya no es lo que se escribió. Eso descarta cualquier comprobación sobre el DOM o la
consola —las cuatro que las dos sesiones dimos por buenas—. **El único sitio donde se ve es la
fuente.** Y la regla que acota el detector: dentro de un literal de JavaScript un comando LaTeX
necesita `\\`; en texto HTML, `\` es lo correcto. Un detector que no distinga marcaría **2 665**
secuencias correctas de los módulos HTML.

**Tres simuladores nuevos, de 6 a 9.** El **M5** tenía el módulo entero girando en torno a que la
media de los $z_k$ apunta a otro parámetro que $B$ **sin una sola imagen**; ahora se ve el pico, la
cola izquierda que arrastra la media simple y las dos verticales separadas. La ventana sale de los
cuantiles: con tramos de 0,1 un tramo se llevaba el 53 % y, peor, $B$ y la media caían en el **mismo
tramo**, así que las verticales se superponían y la brecha —todo el contenido del gráfico— no se
veía. El **M3** gana los residuos contra $x$, que enseñan la tercera condición de la razón, hasta
ahora afirmada y nunca mostrada; y la **frontera del umbral (D4)** con los cuatro pares reales, donde
`cherry` cae en lo más alto de la zona ganadora y aun así la razón es el estimador equivocado.

**Hallazgo al construir el histograma:** de los 3 053 cocientes de `agpop`, **once son negativos** —
condados con `acres87 > 0` y `acres92 = −99`—, porque el filtro mira el denominador y no el numerador.
Mueven la media de cocientes un **1,11 %** (0,9530 → 0,9636) y a $B$ no la tocan. Se mantiene el
0,9530, que es la política del capítulo, y se dice: es el mejor argumento que tiene el módulo.

**Y lo que queda anotado para quien siga:** la `<meta name="description">` del índice publicado dice
«67 simuladores» donde el texto visible dice 70 — reportado a la otra sesión, es la única cifra
desfasada de las `<meta>` de las nueve páginas—; y los ejes de Chart.js siguen en inglés, que en los
gráficos con cifras de cinco dígitos se lee mal **por un factor de mil** (`100,000` leído como cien).
Eso vive en la plantilla y va en su propio commit, para que la comparación de huellas entre las ocho
páginas ajenas siga sirviendo.

### T7.71 — El detector de LaTeX mira la fuente, y encuentra 17 barras que seguían vivas (2026-09-18)

`precalculo/verifica_bloques.py` y `precalculo/README.md`. No se publica: es herramienta, no sitio.

**Qué comprueba.** Dentro de un literal de JavaScript un comando de LaTeX necesita **dos** barras;
con una, JS se la come antes de que KaTeX lea la cadena. El detector busca esa barra sola en los
literales de los `<script>`, con una lista corta de comandos que el material usa de verdad, más el
espaciado `\,` `\;` `\:` `\!`. Fuera de `<script>`, en el texto HTML, la barra simple es la
**correcta** —hay 2 665 en los módulos— y no se mira.

**Por qué a nivel de fuente y no de DOM.** T7.69 lo dejó medido: `.katex-error` da **0 en todos los
casos**, y la familia peor (`pi` por `\pi`) produce LaTeX válido, sin consola y sin DOM. Ninguna
comprobación del navegador la ve.

**Y por eso basta una sola rama, que es lo que no era obvio.** Se busca `\comando` con barra sola;
**no** se busca el comando desnudo sin barra. Parece que eso deja fuera la familia silenciosa, y no
la deja: el comando desnudo solo existe en la cadena **en memoria**. En la fuente sigue teniendo su
barra —`'$\pi$'`— y ahí es donde se le caza. Lo único que queda descubierto es que alguien escriba
`$pi$` a mano, que ya no es un fallo de escape. La rama contraria, en cambio, haría saltar cada
«bar», «times» o «mu» de la prosa, y ese ruido acaba en que nadie mire.

**Va en toda ejecución, no detrás de una opción** (hay `--solo-latex`, que es instantáneo). Es la
lección de la tarde de T7.69: una comprobación que hay que acordarse de pedir no habría servido.

**Cómo se probó, que es la mitad del trabajo.** Un detector que da 0 en ficheros limpios no prueba
nada. Se pasó por la versión **rota** recuperada de git, `b0dfddb^`, y da **40**. El mensaje de aquel
commit documenta 23. Las 23 salen todas.

**Las otras 17 seguían vivas, y ese es el hallazgo.** El arreglo de `b0dfddb` se quedó a medio
camino: puso las barras dobles en los comandos de letras y dejó el **espaciado** con barra simple
—14 `\,` y 3 `\;`—, en las mismas cuatro preguntas. Ejecutando el literal publicado en node, no
leyendo la fuente, esto es lo que recibía KaTeX:

    Con $t_x = 963,464,412$, $\bar{x} = 301,953{,}72$, $s_e = 31,657{,}22$

El separador de millares se convierte en **coma**, que en este material es el separador **decimal**:
el estudiante leía «301,953,72» donde el capítulo dice 301 953,72. Es peor que el fallo de `\bar`:
aquel se veía roto, este **parece un número bien escrito**. En `ensamblado/modulos/cap3/simuladores.js`,
líneas 713, 719, 867 y 934. Lo arregla la otra sesión; el cap. 3 es suyo.

**Alcance.** Los 8 capítulos ensamblados y los 10 ficheros de módulos con JavaScript: las 17 son
todas de `cap3/simuladores.js`, cero en el resto. La unidad natural es la **página ensamblada**,
porque `simuladores.js` acaba dentro de un `<script>`; pero el detector acepta un `.js` suelto
(`es_js`), que es donde se arregla. Sin regresión: cap. 1 completo da 303/303 y salida 0, y los ocho
en `--solo-prosa` dan 0 cifras sin respaldo.

**Para la siguiente.** La otra sesión aporta una invariante mejor que el md5 que usa hoy
`verifica_publicado.py`: `origin/gh-pages^{tree}` y `origin/main:sitio` deben ser el mismo hash. Caza
dos cosas que hoy no caza nada —publicar desde un árbol local sin subir `main`, y editar `sitio/`
directamente en `gh-pages`— y vale mientras el camino corto publique el árbol entero. Y un dato
suyo: `taller-1` no se publica porque **no está en git**, no por una exclusión; un `git add -A`
distraído lo publicaría sin que nada chistara.

### T7.72 — Contar no bastaba: `cuenta_sitio.py` ahora coteja, y el árbol publicado tiene invariante (2026-09-18)

`precalculo/cuenta_sitio.py`, `precalculo/verifica_publicado.py` y `precalculo/README.md`. Tampoco
se publica: son herramientas.

**El agujero.** `cuenta_sitio.py` contaba bien desde hacía meses y **nadie comparaba** su salida con
las cifras escritas a mano. Viven en tres sitios: la tabla del README, las tarjetas del `index.html`
y las **dos metaetiquetas** del `index.html`. Las metas son las peligrosas porque no se leen mirando
la página: se publicaron con «67 simuladores» con el texto visible ya en 70, y se escaparon **dos
veces el mismo día**, la segunda después de revisar la página entera.

**El ámbito, que es donde estaba la trampa.** El README dice «Ocho capítulos», así que sus totales
**no** incluyen el preparcial; comparar contra el total general daría un falso positivo por línea, y
un verificador que grita siempre se ignora. Y el ámbito de cada cifra se decide por el **elemento que
la contiene**, no por el enlace más cercano: con «el último enlace anterior» —que fue lo primero que
probé— el «91 módulos · 70 simuladores» de la cabecera se leía como cifra del cap. 1, porque encima
lleva un «Comenzar» que apunta allí. Dos falsos positivos a la primera. La regla buena es
estructural: dentro de un `<a class="chapter-card">` la cifra es de esa página; fuera, del curso.

**Se probó contra lo roto, no contra lo bueno.** Para eso está el nuevo `--sitio`: apunta el cotejo
a un estado pasado del README y del index, con los capítulos de hoy como verdad.

| estado | desajustes | qué encuentra |
|---|:--:|---|
| hoy | **0** de 48 cifras | — |
| `9e9ec78` | **2** | `index.html:8` y `:15`: las dos `<meta>` en 67 |
| `d0437f8` | **15** | los seis totales del README, la fila del cap. 4, las cuatro apariciones del index y la tarjeta del cap. 3 |

El caso de `9e9ec78` da **exactamente** las dos metaetiquetas: es el fallo que se escapó dos veces,
reproducido y cazado. Un verificador probado solo en verde no ha probado nada.

**Lo que NO comprueba, dicho en voz alta.** Las «2 786 cifras contrastadas» del README salen de
`verifica_bloques.py` y este guion no sabe calcularlas. En vez de callarlo, las imprime como «sin
cotejar» con su archivo y su línea: una cifra a mano en medio de las comprobadas es justo como se
cuela la siguiente. No cuenta como fallo —un rojo permanente es tan inútil como no comprobar nada—.

**La invariante del árbol**, que aporta la otra sesión y es mejor que el md5 página a página:
`origin/gh-pages^{tree}` == `origin/main:sitio`. Lo servido tiene que ser el `sitio/` de un commit
**que ya está en el remoto**. Caza dos cosas que no miraba nada: publicar desde un árbol local sin
subir `main`, y editar `sitio/` a mano sobre `gh-pages`. Hoy ambas dan `b023ea2`; con la punta
anterior de `gh-pages` la comprobación dispara, que es como se verificó. Vale mientras el camino
corto publique el árbol entero; el día que se publique un subconjunto a propósito, deja de valer.

**El tropiezo de zsh, por tercera vez en el día.** Al sacar los estados pasados con
`git show $C:sitio/muestreo/index.html` zsh leyó `:s` como modificador de historia y dio
`9e9ec78ndex.html`. Es el mismo fallo del que yo había avisado a la otra sesión veinte minutos
antes. **Siempre `${VAR}:ruta` con llaves.** Y lo que lo hizo peligroso no fue el error, que era
ruidoso: fue que el `>` dejó los archivos **vacíos** y la prueba siguió corriendo y dando resultados
con pinta de buenos. Los primeros números de la prueba A eran basura y casi los reporto.

---

### T7.73 — Las 17 barras que sobrevivieron a mi arreglo *y* a mi verificación (2026-09-18)

`ensamblado/modulos/cap3/simuladores.js` y la página reensamblada. Publicado en `gh-pages`.

**Qué estaba roto, y por qué era peor que lo de antes.** En las cuatro preguntas del banco del
cap. 3 quedaban **17 barras simples** de espaciado —15 de `\,` y 2 de `\;`— dentro de literales de
JS. JavaScript se las come antes de que KaTeX las vea, así que el separador de millares se
convertía en **coma**, que en este material es el separador **decimal**. Lo que recibía KaTeX,
ejecutado en node y no deducido leyendo:

    Con $t_x = 963,464,412$, $\bar{x} = 301,953{,}72$, $s_e = 31,657{,}22$

El estudiante leía «301,953,72» donde el capítulo dice 301 953,72. El fallo anterior (T7.70) se
**veía** roto —«ar{x}»—; éste parece un número bien escrito y no lo es, y un ejercicio calculado con
esas cifras da mal sin que nada avise.

**Por qué sobrevivió al arreglo de `b0dfddb` y a su comprobación.** No fue que faltara el caso roto
para probar: estaban delante, `\,` simple **tres veces en la misma línea** donde doblé `\bar`. Fue
que diagnostiqué la avería como «comandos de LaTeX sin doblar» y escribí la búsqueda como **barra
seguida de letra**. Con ese diagnóstico, `\,` y `\;` no son el fallo: no entran en la categoría. Y
la comprobación salió de la misma frase, así que confirmó el arreglo.

> **La regla, que es lo que hay que conservar de esto:** un arreglo que pasa su propia comprobación
> **no está verificado**, porque comparte con ella la definición del fallo. Lo que cazó las 17 fue un
> instrumento escrito por quien no había hecho ese diagnóstico.

**El criterio del detector, acordado con la otra sesión (ver T7.71).** Ni mi «barra seguida de letra»
ni una lista de comandos: las dos son categorías sobre el **carácter**, y las dos se quedan cortas
justo donde se acaba la opinión de quien las escribió. Va en dos mitades, y **ninguna es un
diagnóstico sobre cuál es la avería**:

- **Dentro de `$...$`**: cualquier barra simple es fallo, por construcción. Es geometría.
- **Fuera**: cualquier barra que no sea un escape que defina ECMAScript. La lista la pone el
  lenguaje, no nosotros.

**Y solo dentro de `<script>`**, que resultó ser lo decisivo y no una limitación: estos capítulos
**enseñan** R y Python, o sea que publican a propósito código lleno de barras legítimas. Un detector
que mire el HTML ensamblado entero no da ruido, es que no puede funcionar aquí. Medido en los ocho
capítulos: las 17 averías **todas** dentro de `$...$`; las 42 legítimas —16 `\'`, 24 `\2XXX` de CSS
en `<style>`, 2 `\n` de un `print()` de Python dentro de `<pre>`— **todas** fuera.

**Comprobado.** Detector 17 → 0; el diff son cuatro líneas y solo dobla barras ante `,` y `;`;
283/283 cifras de los bloques, 212 de prosa sin ninguna sin respaldo, 411 referencias sin cambios,
los 15 bloques de R y 4 de Python arrancan solos.

**Dos instrumentos que mintieron por el camino, los dos míos.** `grep '\\[,;]'` me dio 174 en el
cap. 3 porque cuenta también las barras **dobles** correctas y el texto HTML, donde la barra simple
sí es lo correcto. Y mi primer clasificador dio «0 pares `\\` dentro de `$...$`», un cero
perfectamente plausible que era un `continue` colocado antes de la comprobación. El reflejo bueno no
es comprobar la cifra con otra herramienta: es preguntarse qué cuenta exactamente la herramienta.

### T7.74 — La regla en dos mitades, y el párrafo que une los seis fallos del día (2026-09-18)

`precalculo/verifica_bloques.py` y `precalculo/README.md`. Cierra lo que abrieron T7.71 y T7.73.

**Por qué se cambió una regla que daba 0.** Porque daba 0 por el motivo equivocado. La lista de
comandos de T7.71 es el **mismo tipo de frase** que el «barra seguida de letra» que dejó vivas las 17
de T7.73: un diagnóstico disfrazado de instrumento. Con ella, un `\Phi` o un `\binom` que nadie
pensó en listar pasa igual. Las dos son categorías sobre el **carácter**, y se quedan cortas justo
donde se acaba la opinión de quien las escribió. Lo dijo la otra sesión y tenía razón.

**La regla, que no opina sobre cuál es la avería.**

1. Dentro de un tramo `$…$`: **cualquier** barra simple está mal. Sin excepciones, por construcción.
   Esta mitad es geometría.
2. Fuera: toda barra que no sea un escape que **ECMAScript** defina. Esta mitad la define el
   lenguaje, no yo.

Hacen falta las dos, y esto es lo que no era obvio: `\t` de `\tfrac` y `\b` de `\bar` **son escapes
legítimos de JS**, así que la mitad 2 no puede verlos —son justo la familia medida en T7.69—; y un
`\Phi` o unos delimitadores `\(…\)` fuera de un `$…$` reconocido solo los ve la mitad 2.

**Dos detalles medidos, no supuestos.** El octal heredado (`\1`–`\7`) **sí** es escape de JS; se
marca a sabiendas, porque está prohibido en modo estricto y en plantillas y aquí sería error antes
que intención. Y un tramo `$…$` **sin ninguna barra** se descarta: eso saca de en medio los precios
del cap. 1 («$40-80k», «<$40k», 252 literales con `$` desparejado) y **no puede perder un hallazgo**,
porque todo hallazgo es una barra y su tramo lleva una.

**Cómo se probó.** Igual que la anterior, contra lo roto, más una página sintética con los casos que
la lista no veía:

| caso | sale |
|---|:--:|
| los 8 capítulos de hoy | **0** |
| `b0dfddb^` (roto) | **40**, igual que la regla vieja |
| sintética: `\Phi`, `\binom`, `\(`, `\)`, `\tfrac`, `\bar` | **6 de 6** |
| sintética: `\\sqrt` correcto, precios `$40-80k`, `\n` y `\'` legítimos | **0 falsos positivos** |

**El alcance queda dicho por fin con su razón.** Solo `<script>`, y no por comodidad: los `\n` que la
otra sesión creyó falsos positivos estaban dentro de `<pre>`, en Python que el cap. 8 **enseña**.
Estos capítulos publican a propósito código lleno de barras legítimas, así que un detector que mire
el HTML ensamblado entero no es que dé ruido: no puede funcionar. `<script>` es lo único que separa
el texto escrito *para KaTeX* del texto que el capítulo *muestra como código*.

**El párrafo del README** («El fallo que hay que temer no es el ruidoso») junta los seis del día:
`.katex-error` en 0, el separador que se vuelve coma, mis ficheros vacíos por el `:s` de zsh, el
`grep` de 174, el `continue` que dejaba un contador en 0, y un arreglo en verde que compartía con su
comprobación la definición del fallo. Al escribirlo puse «cinco de los seis los cazó quien no había
hecho la comprobación» y **era falso**: son tres y tres. Corregido antes de commitear, y el reparto
real dice más que el inventado: los tres que cazó su propio autor no salieron de releer el
resultado, sino de volver al instrumento. Releer un número plausible no lo desmiente nunca.

**Lo que queda escrito además:** que publicar y empujar `main` dejaron de ser acciones
independientes desde que la invariante de T7.72 ató el árbol publicado a `origin/main:sitio`, y que
con varias sesiones en el mismo árbol empujar arrastra los commits ajenos que estén debajo —que es
lo que pasó con `af265ea` y `2be3093` en el push de T7.73—.

### T7.75 — La línea base apuntaba a una página muerta, y nadie ejecutaba la de la viva (2026-09-18)

`precalculo/cifras_prosa.json`, `precalculo/verifica_bloques.py` y `precalculo/README.md`. Salió al
pasar los cuatro verificadores por todo, que es justo para lo que servía pasarlos.

**El hueco, que no era un fallo.** `cifras_prosa.json` tenía entrada para
`taller-1-preparacion-parcial-1.html` —absorbido por el preparcial y en el `.gitignore` desde
entonces— y **ninguna** para `preparcial-corte-1.html`. Y `--todos` recorría solo `capitulo-*.html`,
así que la novena página publicada nunca entraba en la pasada de rutina. Resultado: dos cifras de
prosa del preparcial llevaban meses sin revisar. **No fallaban: nadie las había mirado.** Es la
versión de línea base del patrón del día —una comprobación que existe y no se ejecuta da el mismo
verde que una que pasa—.

**Lo que se movió, verificado ítem por ítem.** De las tres entradas del taller, `500 000` ya no hace
falta: en el preparcial esa cifra sale del JSON de salarios, no de un contrafactual. Las otras dos
siguen siendo escenario inventado y se leyeron enteras antes de reescribirlas:

| cifra | qué es |
|---|---|
| `2,3` | calificación media inventada del comedor en el ítem del QR; lo que se evalúa es la dirección del sesgo de autoselección, no la cifra |
| `6 000` | contrafactual en la retro de un distractor: «con 6 000 abordadas a criterio del encuestador seguiría sin haber $p(s)$» |

Se les quitaron los identificadores `S2-2` y `S3-1`: la renumeración del preparcial los dejó sin
existir, y **una justificación que cita un ancla muerta es peor que una que describe el ítem**.

**El arreglo de verdad no es la entrada, es el alcance.** Mover la clave sin tocar `--todos` habría
dejado la línea base igual de sin ejecutar. Ahora `--todos` cubre las **9 páginas publicadas**
—capítulos, preparcial y talleres— descartando las del `.gitignore`, que no llegan a `gh-pages`.

**Después:** 9 páginas, 224 cifras de prosa respaldadas en el preparcial y **0 sin respaldo en
total**, 0 secuencias de LaTeX con barra simple.

---

### T7.76 — «Esa tabla» apuntaba a la tabla equivocada (2026-09-18)

`ensamblado/modulos/cap3/modulos_1_4.html` y la página reensamblada. Publicado.

**El fallo.** En el módulo 3, el párrafo que enseña el umbral ocurriendo empezaba con «La última línea
de **esa tabla**». Lo que tiene justo encima no es una tabla, sino la caja `definition` «Cuál pide
cada nube», que es una **lista** y cuya última línea es la **expansión**. La `<table>` de verdad está
más arriba en el mismo módulo, y su última fila es la **diferencia**. No era solo ambiguo: en la
lectura natural mandaba a la fila equivocada, y el párrafo habla del umbral expansión-vs-razón.

**Por qué el lector iba a la tabla.** Porque en ese módulo «la tabla» estaba ya tomada, y bien: la
nota de debajo dice «la tabla no ordena por calidad», el simulador dice «las cuatro **filas** de la
tabla» y la quinta salida dice «los cuatro estimadores de la tabla». Tres usos correctos y uno
prestado. Lo detectó Javier leyendo, no una comprobación.

**El arreglo, y por qué no fue calificar la palabra.** Añadir «de la caja de arriba» habría dejado dos
tablas compitiendo en el mismo módulo. Se quitó el término y se nombró **el contenido**: «La última
de esas cuatro líneas —la expansión, cuando la correlación no llega al umbral—». La caja ya llamaba
«líneas» a sus puntos («el umbral de la primera línea»), así que la distinción líneas/filas ya
existía en el texto. Nombrar el contenido y no el contenedor sobrevive a que cambie la maquetación,
que es justo lo que aquí falló. Y cierra el circuito: esa última línea terminaba en «el párrafo de
abajo lo enseña ocurriendo», o sea que la referencia existía en un sentido y ahora en los dos.

**Lo que queda abierto.** El módulo 3 enumera los mismos cuatro estimadores en **cuatro sitios**: la
`<table>`, la caja «Cuál pide cada nube», la tabla que imprime el bloque de código y los cuatro
interruptores del simulador. La referencia era imposible de resolver por eso, no por la redacción.
Falta decidir si esa repetición es deliberada o sedimento.

### T7.77 — Tres referencias rotas del cap. 7, y por qué ninguna herramienta las veía (2026-09-18)

`ensamblado/modulos/cap7/modulos_4_6.html`, la página ensamblada y
`precalculo/referencias_cruzadas.json`. Salieron al revisar a mano las 18 ambiguas, que es lo que
Javier pidió; **ninguna de las tres estaba entre las 18**.

**Las 18 ambiguas están todas bien**: seis autorreferencias que el verificador marca porque la frase
nombra otro capítulo antes —el «de este capítulo» del cap. 2, la celda de tabla del cap. 3, el
«capítulos 10 y 17» que son de Gutiérrez y no del curso— y doce a otro capítulo que aciertan. Las
dos del cap. 8 se comprobaron contra el CONTENIDO, no contra el título: el sesgo de −19,32 está en
el M1 del cap. 1 y los 6,3 votantes en el M7. El «6,30» del cap. 8 es la misma cifra con un decimal
más.

**Las tres rotas**, todas en listas de «Para ampliar» del cap. 7 y todas cortas por uno o dos, que
es la firma de que el cap. 3 pasara de 12 a 14 módulos:

| decía | cap. 3 M_n es | debía decir |
|---|---|---|
| «8 (dominios)» | Un estimador distinto en cada grupo | **M9** Estimación en dominios |
| «11 (la mediana por Woodruff)» | GREG | **M12** Parámetros no lineales: la mediana |
| «módulos 6 y 10 … el GREG» | Modelos poblacionales | **M11** GREG |

**La prueba no fue criterio, fue contradicción interna**: el propio cap. 7 dice «los dominios
(módulo 9)», «con la mediana (módulo 12)» y «regresión general (módulo 11)» en su prosa.

**Por qué no las veía el verificador — dos fallos distintos, y el segundo importa más.**

1. Dos son **invisibles a `REF_RE`**: van en una lista continuada, `módulos 2 y 4 (…), 8 (…) y 11
   (…)`, y la expresión corta en el paréntesis. Medido: es la **única** lista así en todo el
   material, así que el agujero es estrecho, pero existe.
2. La tercera se parsea bien y **la línea base la bendecía**: guardaba `…#10 -> "Modelos
   poblacionales"`. Al construir la base se registró **lo que había, no lo que debía haber**, y
   desde entonces el verificador solo comprueba que el destino no cambie. Una referencia ya rota en
   ese momento quedó certificada para siempre. Es la misma forma que T7.73 y T7.74: una comprobación
   cuya definición de «correcto» sale de la cosa comprobada.

**El arreglo, y lo que se quitó de la base.** `--anota` **solo añade**: tras corregir el texto, la
base pasó de 423 a 425 y las dos entradas viejas se quedaron dentro como huérfanas. Se borraron a
mano, porque no estorban: **mienten**. Si algún día el texto volviera a «6 y 10», el verificador
diría «ya revisada» y callaría.

**Lo que queda anotado y no se tocó:** la base tiene **12 huérfanas más**, todas del cap. 3 y todas
con el destino CORRECTO —se quedaron sin dueño al cambiar la prosa de alrededor, que es lo que
mueve la clave—. Estorban pero no mienten, así que se dejan. La decisión de fondo es si `--anota`
debe escribir solo el conjunto vivo en vez de acumular. Y `--base` con una ruta fuera del
repositorio revienta al imprimir (`relative_to`), después de escribir el archivo.

**Después:** cap. 7 con 241/241 cifras, 54 de prosa sin ninguna sin respaldo, 0 LaTeX; referencias
411 resueltas, 0 nuevas, 0 cambiadas. El reensamblado se comprobó byte a byte **antes** de tocar
nada, y después el diff de la página es exactamente el de los módulos: tres líneas.

---

### T7.78 — La repetición del módulo 3 era deliberada; lo frágil eran los nombres (2026-09-18)

`ensamblado/modulos/cap3/modulos_1_4.html` y la página reensamblada. Viene de T7.76.

**La pregunta.** Tras arreglar «esa tabla», quedaba decidir si que el módulo 3 enumere los mismos
cuatro estimadores en varios sitios es diseño o sedimento.

**Primero, un dato mío que estaba mal.** En T7.76 escribí «cuatro sitios» contando la tabla que
imprime el bloque R4. Esa tabla tiene **dos filas** —`agsrs` y `cherry`, con `r` y `umbral`—: va de
nubes y umbrales, no de estimadores. **Son tres**, no cuatro.

**Deliberada, y la prueba es el commit.** `4cc851f` (2026-09-10) introdujo la `<table>` y la caja
«Cuál pide cada nube» **en el mismo commit**, y en ese mismo commit le añadió al simulador —que era
de julio— su cuarta recta, la horizontal de la expansión, para que los tres coincidieran. Los tres
trabajos son distintos y no se solapan:

| | qué hace |
|---|---|
| tabla | qué **es** cada una: la recta que traza, lo que supone, dónde se construye |
| caja | **cuándo** pide cada nube cuál, con el umbral |
| simulador | **verlas** las cuatro sobre datos reales |

La tabla dice qué supone cada estimador; la caja, qué aspecto deben tener los datos para que ese
supuesto se sostenga. Complemento, no copia.

**Lo que sí estaba mal era cómo se las nombra.** El módulo señalaba estas estructuras **por el
continente** cinco veces, y cuatro cruzaban material intermedio:

| línea | decía | apuntaba a | en medio |
|---|---|---|---|
| 345 | «La tabla no ordena por calidad» | tabla | nada — **la única segura** |
| 508 | «los cuatro estimadores de la tabla» | tabla | la caja, que también tiene cuatro |
| 513 | «las cuatro filas de la tabla» | tabla | la caja, que también tiene cuatro |
| 528 | «La regla de la caja de arriba» | caja | la derivación, una nota y un simulador |
| 562 | «el umbral de la caja anterior» | caja | tres simuladores |

Ninguna estaba equivocada como la 437 de T7.76 —todas se resolvían buscando—, pero las cuatro
morían con la maquetación. En la 513, además, lo único que separaba «filas» de «líneas» era una
convención que el lector no tiene por qué haber captado. Arregladas nombrando el contenido: los
cuatro estimadores por su nombre, y el umbral escrito como
$\rho > \tfrac{1}{2}\,\text{CV}(x)/\text{CV}(y)$ en vez de «la caja». Quedan en pie las dos que ya
eran sólidas: la 345 está pegada al `</table>` y la 490 va calificada, «la tabla **del bloque de
arriba**».

**Un instrumento más que mintió.** El barrido con que comprobé que no quedaban referencias era
sensible a mayúsculas y se dejó fuera «**La** tabla». Da cero por la razón equivocada. Van seis hoy.

---

### T7.79 — `REF_RE` deja de cortar en el primer paréntesis (2026-09-18)

`precalculo/verifica_referencias.py` y su línea base. No se publica: es herramienta.

**El hueco.** El cap. 7 escribe «cap. 3, módulos 2 y 4 (la razón linealizada y el término que se
desprecia), 9 (dominios) y 12 (la mediana por Woodruff)», y la expresión cortaba en el primer
paréntesis: **el 9 y el 12 eran invisibles**, y así se publicaron dos referencias rotas que ninguna
comprobación veía (T7.77). La glosa solo se consume cuando **lleva a otro número**, nunca al final,
para no mover la clave de las referencias ya revisadas. Medido: 412 coincidencias antes y después,
y **una sola difiere**.

**Dos agujeros más, encontrados midiendo y no buscándolos.**

1. **El guarda iba detrás de los dígitos.** Con `(?P<modsS>\d+)(?!\s\d{3})`, «módulo 16 380»
   retrocede: `\d+` prueba «16», el guarda ve « 380» y falla, reduce a «1», lo siguiente es «6» —no
   un espacio—, el guarda pasa, y sale una referencia al **módulo 1**. Como el módulo 1 existe en
   todos los capítulos, se habría resuelto como correcta y la base la habría bendecido. 0 casos hoy;
   latente, no vivo. Anclado al inicio, `(?!\d+\s\d{3})\d+`, no hay marcha atrás.
2. **La glosa no cruzaba paréntesis anidados**, y el material escribe `calibrate()`. «módulos 6 (la
   regresión con calibrate()), 9 (dominios) y 11 (el GREG)» daba `[6]`. Hoy no muerde porque esa
   glosa está al final de su lista; bastaba con mover la frase. Admite un nivel, y las dos versiones
   dan 412 coincidencias y 433 números idénticos.

**`GLOSA` vive en un solo sitio.** La dejé repetida en dos —la expresión y el `re.sub()` que limpia
antes de contar— y la otra sesión escribió su parche creyendo que ya estaba extraída. Extraída: si
las dos mitades dejaran de decir lo mismo, la expresión atravesaría una glosa cuyos números luego se
contarían como módulos. Que eso importa lo prueba `módulo 2 ($7\,124$)`, una glosa con una cifra
dentro: sin limpiar, de ahí salen los módulos 7 y 124, **y los dos existen**.

**Lo que sigue ignorándose a propósito.** La rama singular **no** admite glosa: «el raking en el 7
(módulo 6)» del cap. 8 tiene un 7 que es un capítulo, y una regla de «número seguido de paréntesis»
se lo comería. Medido que no pierde nada: 0 listas en singular, por dos sondas distintas.

**Instrumentos que mintieron, y son los dos peores del día.** Para comprobar si `GLOSA_RE` existía
hice `grep -n "\[^()\]"` y dio **cero** — mal escapado, el patrón estaba en dos líneas; con `grep -F`
aparecen. Y antes, el barrido de referencias de T7.78 era sensible a mayúsculas y se dejó «**La**
tabla». En los dos, **el resultado equivocado era el resultado esperado**, que es lo que hace que
nadie mire dos veces.

**Revisión cruzada.** La otra sesión verificó los cinco puntos leyendo el fichero y no mi lista, y
midió la duda del singular con una sonda distinta a la mía: 0 la mía, 2 la suya, misma conclusión —
la suya hacía la glosa opcional y pilla además «módulo 4, 7 106 715». Dos instrumentos distintos
coincidiendo vale más que uno diciendo 0.

**Estado.** 413 resueltas, 0 nuevas, 0 cambiadas, salida 0. Base en 425 claves: cuatro del cap. 7
revisadas a mano y **dos huérfanas borradas**, que `--anota` no quita porque solo añade.

### T7.80 — Un rango no son dos módulos, y el extremo no protege (2026-09-18)

`precalculo/verifica_referencias.py` y la línea base. Encima de T7.79, sobre el fichero ya
commiteado por la otra sesión: los dos cambios se coordinaron para no guardar el mismo archivo a la
vez, y el mío se preparó y probó en el scratchpad mientras el suyo estaba abierto.

**Qué hacía falta.** `«Capítulo 3, módulos 5 a 8»` comprobaba **M5 y M8** y se saltaba M6 y M7: una
renumeración que moviera solo el centro pasaba callada. Ahora `numeros_de()` expande el rango.

**El tope, que es la parte de criterio.** Un rango más ancho que **20** no se expande: se deja en
sus dos extremos. Ningún capítulo del curso pasa de 14 módulos, así que un rango más ancho no es un
rango, es un fallo de captura —`«módulos 3 a 16 380»`—, y expandirlo convertiría un error de lectura
en miles de comprobaciones falsas. Un descendente tampoco se expande.

**Lo que destapó, y que es mejor hallazgo que el arreglo.** El extremo **tampoco** protegía. El M8
del cap. 3 pasó de «Estimación en dominios» a «Un estimador distinto en cada grupo» en `251d1bf`, y
la frase del cap. 4 M12 que lo cita se escribió en `ea718be`, que es **anterior** —comprobado con
`merge-base --is-ancestor`, no por las fechas—. El extremo cambió de significado y nadie lo vio
**porque el extremo seguía existiendo**. Hoy apunta a algo *más* pertinente que cuando se escribió:
para un módulo sobre razón separada, «un estimador distinto en cada grupo» es justo lo que hace
falta. Por eso no se tocó: no es un error que corregir, es una decisión sobre qué se quiso decir, y
es de Javier.

**Decidido (2026-09-23).** Javier: «Déjalo como está, el módulo 8 sirve». La frase no se toca, y
la línea base no necesita nada: ya registra el `#8` con el título de hoy, «Un estimador distinto en
cada grupo», así que lo que queda aceptado es lo que el lector encuentra al seguir la referencia.
(Ver T7.81: la frase sí se tocó, y el M8 se quedó.)

**Las once nuevas, revisadas antes de anotar** —no después, que es de lo que va la casa—:

| dónde | qué añade | por qué es correcta |
|---|---|---|
| cap. 2 «módulos 1 a 4» | M2, M3 | la frase nombra literalmente $p(s)$, $\pi_k$, $\pi_{kl}$ y Horvitz–Thompson |
| cap. 3 «módulos 10 a 12» | M11 | «el paraguas que los contiene a todos»: es lo que queda de capítulo antes del formulario |
| cap. 4 «módulos 1 a 8» | M2–M7 | «Estrato (módulos 1 a 8, con agstrat)»: el bloque de estrato acaba en M8 porque el M9 ya es PPT |
| cap. 4 «cap. 3, módulos 5 a 8» | M6, M7 | esos dos **no** se movieron en la renumeración |

Anotadas: 425 → 436 claves, 11 añadidas, **ninguna huérfana nueva** —la base ya arrastraba 12 del
cap. 3; ver T7.81—. No las hubo porque este cambio no toca
`REF_RE`: el texto de la referencia no crece, así que ninguna clave se mueve. La otra sesión sí tuvo
dos y las borró a mano; se comprobó el delta en vez de suponerlo.

**El error propio que merece quedar.** Al informar del prototipo escribí que «reutiliza su
`GLOSA_RE`» **mientras definía la suya propia**: el patrón habría acabado en tres sitios. Las nueve
pruebas pasaban igual —una copia funciona perfectamente; solo se desincroniza cuando alguien cambia
una de las dos—, así que el verde no decía nada sobre lo que yo estaba afirmando. Lo cazó la otra
sesión yendo a comprobarlo.

**Dos sondas que no coincidieron, y por eso valen.** Sobre si la rama singular pierde listas:
la suya dio **0** y la mía **2**. La suya exigía glosa; la mía la hacía opcional y pilla además
«módulo 4, 7 106 715». Los dos casos míos son cifras, no listas, y la rama singular se para en el
primer número. Misma conclusión por caminos distintos, que es la forma fuerte de coincidir.

**Después:** 424 resueltas, 424 revisadas, 0 nuevas, 0 cambiadas, salida 0.

### T7.81 — «5 a 8» era el nombre de un archivo, no un rango de módulos (2026-09-23)

`ensamblado/modulos/cap4/modulos_10_12.html` (M12, «Para ampliar este módulo»), la página ensamblada
del cap. 4 y la línea base de referencias. Javier: «Arregla la referencia».

**Lo que T7.80 preguntó mal.** Planteé la duda como «¿qué quiso decir el M8?», y a esa pregunta
Javier contestó —vía la otra sesión, párrafo «Decidido» de T7.80— que el módulo 8 sirve. Pero la
frase era «módulos 5 a 8: **el estimador de razón** de donde sale todo esto», y el estimador de razón
del cap. 3 nunca estuvo en 5–8: ni cuando se escribió (`ea718be^`: M5 proporciones, M6 regresión, M7
diferencia, M8 dominios) ni hoy. Está en **M2–M4**: el estimador, cuándo gana, y el sesgo que el
propio M12 invoca («es el sesgo que el capítulo 3 midió para un solo estimador de razón»).

**De dónde salía el «5 a 8».** La promesa que el M12 cumple —«dentro de cada estrato o sobre el
conjunto»— vivía en `modulos_5_8.html` del cap. 3, en su M5. El rango copió **el nombre del
archivo** donde estaba la promesa, no los módulos que la glosa describe. Hoy ese archivo se llama
`modulos_5_7.html` y la promesa sigue en el M5.

**El arreglo, que respeta lo decidido.** Dos entradas en vez de una: «módulos 2 a 4» para el
estimador —con «el 4 es donde se mide su sesgo»— y «módulo 8» aparte, porque sí sirve: estima cada
región por separado y suma, y la separada es el caso en que todos los estimadores son de razón. El
M8 del cap. 3 ya apuntaba de vuelta al M12 del cap. 4; ahora la referencia va en los dos sentidos.
Lo que sale es M5–M7, que nadie había defendido.

**Lo que solo se vio en la página.** El primer texto repetía casi palabra por palabra la entrada de
Lohr §4.1.2 que tiene justo encima («que la separada comete $H$ veces»). En el diff eran dos líneas
correctas; renderizadas, eran dos viñetas seguidas diciendo lo mismo. Se reescribió antes de
commitear.

**Línea base.** `--anota` añadió las cuatro nuevas (cap. 3 M2, M3, M4, M8), revisadas antes de
anotar; las cuatro claves de «5 a 8» se quitaron a mano, y la del M8 otra vez tras la reescritura,
porque su clave lleva el texto que la precede. 436 claves; este cambio no deja ninguna huérfana, pero
la base arrastra **12**, todas del cap. 3 y ya presentes en `7cee2bd`.

**Corrección, de la otra sesión.** La primera versión de esta nota decía «436 claves, 0 huérfanas»,
y T7.80 lo mismo. Las 12 las conocía; lo que medí fue el delta —las claves antes y después de
anotar— y lo escribí como si fuera el total. La otra sesión lo midió de la única forma que da el
total: `--anota` contra una base vacía en el scratchpad y resta de conjuntos. 424 claves hoy, 436
en la base, 0 sin anotar. Lo repetí yo por el mismo camino y da lo mismo. Avisó también de una
trampa: 42 claves son de `taller-1-preparacion-parcial-1.html`, que está en `.gitignore`, así que
contra un `git archive` salen 54 huérfanas falsas; hay que medir contra el directorio de trabajo.
Limpiar las 12 es tarea aparte, de Javier.

**Después:** referencias 424 resueltas, 424 revisadas, 0 nuevas, 0 cambiadas, salida 0; LaTeX 0 en 9
páginas; cotejo de cifras 0 desajustadas; reensamblado del cap. 4 idéntico byte a byte antes de
editar; KaTeX de la lista comprobado en el navegador. Publicado como `gh-pages` `1bf6d6a`, desde
`96de42f`: lo servido coincide byte a byte en las 10 páginas y su código arranca.

### T7.82 — Hájek no es sesgado en el Bernoulli del módulo 8 (2026-09-24)

`ensamblado/modulos/cap2/modulos_5_8.html` (Definición 2.8), la pregunta del M8 en
`ensamblado/modulos/cap2/simuladores.js`, la página ensamblada del cap. 2 y una línea de
`precalculo/salidas/inventario_items.json`. Javier: la definición decía «es un cociente de dos
estimadores, así que no es exactamente insesgado» en el contexto donde no es verdad.

**El error.** Con $\pi_k = \pi$ para todas, $\hat t_{\text{Hájek}} = N\bar y$; y dado $n_s = m$
todas las muestras de tamaño $m$ tienen probabilidad $\pi^m(1-\pi)^{N-m}$, así que la muestra es
un MAS y $E(\hat t_{\text{Hájek}} \mid n_s = m) = t$ para todo $m \ge 1$. Solo falla $n_s = 0$,
que no define el estimador. «No es exactamente insesgado» vale con $\pi_k$ desiguales. Enumerado
sobre los cinco condados del M1 ($t = 150$): con $\pi = 0{,}3$ y $0{,}4$, $E(\text{Hájek} \mid
n \ge 1) = 150$ exacto; con $\pi_k = 0{,}2, \dots, 0{,}6$ (Poisson), **167,65**. De propina, la
varianza de HT con $\pi = 0{,}4$ sale 8 553, la del `.warning` del M3: la misma población.

**Qué dependía de la frase.** El simulador no: `genera_cap2.R` calcula Hájek como
`N * mean(y)` y el simulador solo pinta CV, que con los dos insesgados es la comparación justa.
Los `sesgoRelHajek` del JSON (−0,0003 a +0,0019) son ruido de Monte Carlo del mismo orden que los
de HT. Sí dependían: (1) la definición, que lo vendía como «el primer ejemplo del curso» de canje
sesgo–varianza, y (2) la pregunta del M8, cuyo enunciado preguntaba «¿por qué gana Hájek si es el
estimador *sesgado*?» y cuya retro correcta repetía «el primer canje sesgo–varianza». Ningún otro
capítulo cita ese canje ni el sesgo de Hájek (el cap. 6 menciona el Bernoulli, no Hájek); el
exportador a Brightspace solo lleva el preparcial, que no tiene ítems de Hájek. `quiz_cap3/` no se
abrió: si alguno de sus tres ítems del cap. 2 es este, hay que revisarlo a mano.

**El arreglo.** La definición dice ahora en general que es un cociente y no es exactamente
insesgado; en el Bernoulli, $N\bar y$, MAS de tamaño $m$ dado $n_s = m$, insesgado dado el tamaño
obtenido y sin definir si no sale ninguna unidad. El canje sesgo–varianza se reserva para $\pi_k$
desiguales, y se conserva el enlace con el estimador de razón del cap. 3. En la pregunta, el
enunciado pasa a «¿De dónde sale la ventaja de Hájek?», la retro correcta añade «y no lo paga en
sesgo», y el distractor «el sesgo de Hájek compensa exactamente el error de HT» —que presuponía el
sesgo— se cambia por el error que el material enseñaba: «acepta un poco de sesgo a cambio de mucha
menos varianza», con una retro que explica por qué aquí no aplica.

**El inventario.** `inventario_items.py` regenerado cambia dos líneas: la mía y la de la pregunta
del sistemático («1 en $k$» → «1 en $a$»), que la fuente ya decía antes de esta tarea. Se commitea
solo la mía; el JSON sigue desfasado en esa otra línea, y regenerarlo entero es tarea aparte.

**Verificado.** Reensamblado idéntico byte a byte **antes** de editar; después, `node --check` del
motor, 495 de 495 cifras de bloques, **108 de prosa · 0 sin respaldo**, LaTeX 0 con barra simple,
referencias 382 resueltas · 0 nuevas · 0 cambiadas, `verifica_tabla.py` 6 en verde. En el
navegador: 0 `.katex-error`, 0 errores de consola; la pregunta se contestó mal (el distractor
nuevo) y bien, y se abrió «Por qué las demás».

**Riesgo al fusionar.** Otra sesión tiene sin commitear `ensamblado/codigo/cap2/cadena.R`, que
también entra en la página del cap. 2. Quien fusione segundo debe **reensamblar** el cap. 2, no
resolver el HTML a mano.

**Publicado el 2026-09-24** con el visto bueno de Javier. `main` avanzó por avance rápido de
`a3a0e1c` a `cf42058` y se subió; `gh-pages` pasó de `1bf6d6a` a `b858ef9`, construido con
`git commit-tree` del árbol `cf42058:sitio` sobre la punta, sin `subtree split` porque no había nada
ajeno que excluir. El diff de `gh-pages` fue solo la página del cap. 2 (+15 −8); invariante
`origin/gh-pages^{tree}` = `origin/main:sitio` en verde, y `verifica_publicado.py --local` del cap. 2
arrancó antes de empujar (23 bloques de R, 7 de Python). Sobre **lo servido**, con Pages ya
construido en `b858ef9`: el cap. 2 coincide con la rama y su código arranca, y la huella coincide
en las 10 páginas.
