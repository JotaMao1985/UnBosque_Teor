# Plan de implementación: Material de estudio — Muestreo Estadístico 2026-II

Universidad El Bosque · Programa de Estadística · Asignatura 20939 (4 créditos)
Docente: Javier Mauricio Sierra · Plan creado el 2026-07-27.

---

## Resumen

Llevar el material de Muestreo Estadístico de **4 capítulos en formato antiguo** a **8 capítulos
en el formato de Series de Tiempo**, cubriendo las 16 semanas del cronograma del syllabus, con el
marco de diseño (π-estimador / Horvitz–Thompson) de Gutiérrez como columna vertebral y Lohr como
orden y fuente de ejemplos.

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
│   ├── genera_cap1.R · genera_cap2.R · genera_cap3.R · genera_soluciones.R
│   ├── salidas/cap1_datos.json · cap2_datos.json · cap3_datos.json
│   └── pruebas/fixture_verificador.html
├── ensamblado/                        ← ensamblado y retropropagación (NO se publica)
│   ├── README.md
│   ├── ensambla_cap1.py · ensambla_cap2.py · ensambla_cap3.py
│   ├── retropropaga_glosario.py · retropropaga_arbol_error.py
│   ├── componentes/glosario.* · arbol_error.*
│   ├── modulos/cap1/ · cap2/ · cap3/
│   └── codigo/cap1/ · cap2/ · cap3/   ← las cadenas ejecutables de R y Python
└── sitio/                             ← SITIO PUBLICADO (esto y solo esto va a gh-pages)
    ├── .nojekyll · .gitignore
    ├── index.html                     ← portada del PARAGUAS: una tarjeta por curso
    └── muestreo/                      ← el sitio del curso
        ├── index.html                 ← portada del curso (actualizar a 8 tarjetas)
        ├── README.md                  ← actualizar al cierre
        ├── capitulo-1-encuestas-sesgos.html          ✅ fase 2
        ├── capitulo-2-diseno-mas-sistematico.html    ✅ fase 1
        ├── capitulo-3-razon-y-regresion.html         ✅ fase 2
        ├── capitulo-4-muestreo-estratificado.html    (formato antiguo — fase 3)
        ├── capitulo-5-conglomerados.html             (NUEVO)
        ├── capitulo-6-probabilidades-desiguales.html (NUEVO)
        ├── capitulo-7-encuestas-complejas.html       (NUEVO)
        └── capitulo-8-no-respuesta-ponderacion.html  (NUEVO)
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
| `.diagrama-diseno` | Esquema recorrible de un diseño complejo (población → estratos → UPM → USM → pesos) | caps. 5, 6, 7 |

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

### Checkpoint 1 — Revisión de Javier · **LEVANTADO el 2026-07-27**
Javier autorizó proceder con la fase 2 y aceptó tratar esa instrucción como aprobación del
checkpoint. Las tres preguntas de fondo **siguen abiertas** y su respuesta se retropropagaría a los
tres capítulos ya escritos, no solo al 2:
- [ ] ¿El marco π funciona didácticamente para el nivel del curso?
- [ ] ¿La densidad de simuladores es la correcta o sobra/falta interactividad?
- [ ] ¿El glosario de notación resuelve la convivencia Lohr ↔ Gutiérrez?
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

- [ ] **T3.1** Cap. 4 — actualización + asignación con costos + estratificado PPT + `.tabla-ranking`.
- [ ] **T3.2** Cap. 5 — conglomerados, nuevo desde cero; reutilizar `material_estudio_cluster.html`
      y los chunks de `material_muestreo_cap4_5_lohr.Rmd` **tras ejecutarlos**.
- [ ] **T3.3** Componente `.diagrama-diseno` + retropropagación.

### Fase 4 — Capítulos 6 y 7
- [ ] **T4.1** Cap. 6 — PPT/HH/HT; reutilizar `material_muestreo_cap6_lohr.Rmd` tras ejecutarlo.
- [ ] **T4.2** Cap. 7 — encuestas complejas, DEFF, replicación, calibración.

### Checkpoint 3 — Segundo tercio
- [ ] Caps. 4–7 verificados; el marco π se sostiene coherente desde el cap. 2 hasta el 7.
- [ ] Todas las varianzas de diseño reproducidas por dos vías (fórmula a mano ↔ `survey`).

### Fase 5 — Capítulo 8, portada y publicación
- [ ] **T5.1** Cap. 8 — no respuesta, ponderación, imputación, taller de diseño y auditoría de IA.
- [ ] **T5.2** `index.html` — portada con 8 tarjetas, totales actualizados. *La tarjeta del cap. 2
      ya se corrigió en la fase 1* (decía «Muestreo Aleatorio Simple · 8 módulos», que dejó de ser
      cierto en cuanto se publicó el capítulo nuevo); las otras siguen describiendo el material
      viejo hasta que se reescriban.
- [ ] **T5.3** `README.md` — tabla de contenido, tecnología, cómo está construido, créditos.
- [ ] **T5.4** Auditoría final de sitio: recuento de módulos/simuladores/preguntas/ejercicios;
      selectores CSS homogéneos entre los 8 capítulos; consola limpia en los 8.
- [ ] **T5.5** Publicar: `git commit` + `git push origin main`; verificar el sitio en vivo.

### Checkpoint 4 — Cierre
- [ ] Los 8 capítulos cubren las 16 semanas del cronograma, verificado contra el syllabus.
- [ ] Revisión de contenido por Javier.

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

| | Actual | Objetivo |
|---|---:|---:|
| Capítulos | 4 | 8 |
| Módulos | 37 | 88 |
| Simuladores | 0 | ~59 |

Los simuladores que aparecen listados en cada capítulo son el núcleo mínimo; la cifra del
encabezado de cada capítulo (`~n S`) es el objetivo, y suele incluir alguno más de apoyo.
| Preguntas de autoevaluación | 0 | **33** | ~64 |
| Ejercicios guiados | 0 | **13** | ~26 |
| Bloques de código verificados | 0 | **63** (629 cifras) | — |
| Semanas del cronograma cubiertas | 9 / 16 | 9 / 16 | 16 / 16 |

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

- [ ] **Cambiar la fuente de GitHub Pages a `gh-pages` / `/`** en Settings → Pages del repositorio
      `JotaMao1985/Muestreo-Un_Bosque_JMS`. Es un ajuste en la web de GitHub; hasta hacerlo, el
      sitio publicado no refleja la nueva estructura.
- [ ] Decidir si los 82 CSV de Lohr siguen versionados en el repositorio público. Están incluidos
      porque sin ellos los precálculos no son reproducibles, y **pesan 13 MB** —el grueso son
      `vius.csv` (7,8 MB), `ipums.csv` (1,9 MB) y `nhanes.csv` (1,0 MB)—. Git lo soporta sin
      problema (el `.git` comprimido queda en ~4 MB) y solo `vius.csv` no lo usa ningún capítulo
      del plan. Para excluir la carpeta entera basta quitar la línea
      `!/CSV data sets for SDA 3e/` del `.gitignore`; para excluir solo el pesado, añadir
      `CSV data sets for SDA 3e/vius.csv`.
