# Plan de implementación: Material de estudio — Muestreo Estadístico 2026-II

Universidad El Bosque · Programa de Estadística · Asignatura 20939 (4 créditos)
Docente: Javier Mauricio Sierra · Plan creado el 2026-07-27.

---

## Resumen

Llevar el material de Muestreo Estadístico de **4 capítulos en formato antiguo** a **8 capítulos
en el formato de Series de Tiempo**, cubriendo las 16 semanas del cronograma del syllabus, con el
marco de diseño (π-estimador / Horvitz–Thompson) de Gutiérrez como columna vertebral y Lohr como
orden y fuente de ejemplos.

El sitio ya existe y está publicado en https://jotamao1985.github.io/Muestreo-Un_Bosque_JMS/
desde `Htmls_Muestreo/` (rama `main`, raíz). Este plan **modifica ese sitio**, no crea uno nuevo.

---

## Diagnóstico del material actual

Medido sobre los 4 archivos de `Htmls_Muestreo/` el 2026-07-27:

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
7. **Publicación:** se conserva el repo actual `JotaMao1985/Muestreo-Un_Bosque_JMS`, que publica
   desde `main` / raíz de `Htmls_Muestreo/`.

---

## Estructura de archivos

Réplica exacta del montaje de Series de Tiempo: **la raíz del repositorio es la carpeta del
curso**, y el sitio publicado es solo una subcarpeta que va a `gh-pages`.

```
Muestreo/                              ← RAÍZ DEL REPO GIT (rama main)
├── .gitignore                         ← lista blanca: ignora todo salvo lo del proyecto
├── PLAN_Material_Muestreo.md          ← este documento (memoria entre sesiones)
├── CSV data sets for SDA 3e/          ← 82 datasets oficiales de Lohr
├── *.Rmd                              ← código R previo reutilizable (5 archivos)
├── precalculo/                        ← scripts R + salidas JSON (NO se publica)
│   └── README.md
├── ensamblado/                        ← ensamblado y retropropagación (NO se publica)
│   └── README.md
└── Htmls_Muestreo/                    ← SITIO PUBLICADO (esto y solo esto va a gh-pages)
    ├── index.html                     ← portada (actualizar a 8 tarjetas)
    ├── README.md                      ← actualizar al cierre
    ├── .nojekyll
    ├── capitulo-1-encuestas-sesgos.html          (reescritura del actual cap. 1)
    ├── capitulo-2-diseno-mas-sistematico.html    (reescritura del actual cap. 2)
    ├── capitulo-3-razon-y-regresion.html         (actualización)
    ├── capitulo-4-muestreo-estratificado.html    (actualización)
    ├── capitulo-5-conglomerados.html             (NUEVO)
    ├── capitulo-6-probabilidades-desiguales.html (NUEVO)
    ├── capitulo-7-encuestas-complejas.html       (NUEVO)
    ├── capitulo-8-no-respuesta-ponderacion.html  (NUEVO)
    └── plantilla/plantilla-capitulo-muestreo.html
```

**Nombres de archivo — decisión tomada el 2026-07-27: SÍ se renombran.** Los capítulos 1 y 2
pasaron de `capitulo-1-introduccion.html` y `capitulo-2-muestreo-aleatorio-simple.html` a
`capitulo-1-encuestas-sesgos.html` y `capitulo-2-diseno-mas-sistematico.html`. Los nombres viejos
describían el contenido anterior; estos describen el contenido al que se reescriben. **Las URLs
publicadas cambian**: cualquier enlace repartido con los nombres antiguos dejará de resolver.
Si aparece la necesidad, se pueden añadir dos ficheros de redirección con `meta refresh` en los
nombres viejos.

**Publicación — decisión tomada el 2026-07-27: se replica el montaje de Series de Tiempo.**
La rama `main` contiene el proyecto entero (plan, precálculos, ensamblado, datos y sitio) y la
rama `gh-pages` contiene **solo** el sitio. Para publicar un cambio:

```bash
git push origin main
git subtree push --prefix Htmls_Muestreo origin gh-pages
```

Es el mismo flujo que Series de Tiempo, así que no hay dos maneras de publicar que recordar.
Los precálculos y el ensamblado quedan versionados pero **fuera del sitio público**, que era el
motivo de mover la raíz del repositorio un nivel hacia arriba.

> [!warning] Un cambio manual pendiente en GitHub
> El repositorio publicaba desde `main` / raíz. Con la nueva estructura, esa configuración
> serviría un directorio sin `index.html`. **Hay que cambiar la fuente de GitHub Pages a la rama
> `gh-pages` / `/`** en Settings → Pages. Orden seguro para no dejar el sitio caído: primero
> `git subtree push` (crea `gh-pages`), después cambiar el ajuste en GitHub, y solo entonces
> `git push origin main`.

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
| `.diagrama-diseno` | Esquema recorrible de un diseño complejo (población → estratos → UPM → USM → pesos) | caps. 5, 6, 7 |

**Regla de retropropagación (heredada, no negociable):** un componente nuevo no está terminado
hasta que está en la plantilla **y** en todos los capítulos anteriores que lo necesiten. Si el
componente aparece en el cap. 5, en la misma sesión entra en la plantilla y se retropropaga a
los caps. 1–4.

---

## Lista de tareas

### Fase 0 — Fundación

- [ ] **T0.1 — Plantilla de Muestreo.** Copiar `Series de tiempo/plantilla/plantilla-capitulo.html`
      a `Htmls_Muestreo/plantilla/plantilla-capitulo-muestreo.html`; ajustar título, subtítulo,
      footer, `keywords` y Open Graph al curso de Muestreo.
      *Criterios:* abre sin errores de consola; KaTeX renderiza; los componentes de demostración
      (quiz, ejercicio guiado, simulador de ejemplo) funcionan.
      *Verificación:* abrir en navegador con `innerWidth > 1024`; consola limpia.
      *Depende de:* ninguna. *Alcance:* S (1 archivo).

- [ ] **T0.2 — Infraestructura de precálculo.** Crear `Htmls_Muestreo/precalculo/` con `README.md`,
      `_comun.R` (locale UTF-8, rutas a los CSV de Lohr, paleta, helpers de JSON) y el
      `Makefile`/script que invoque **el Rscript del framework 4.4**.
      *Criterios:* `_comun.R` fija `Sys.setlocale("LC_CTYPE", "en_US.UTF-8")`; un `agpop` cargado
      se resume correctamente; el JSON emitido tiene tildes bien.
      *Verificación:* ejecutar y validar el JSON con `python3 -m json.tool`.
      *Depende de:* ninguna. *Alcance:* S.

- [ ] **T0.3 — Instalar `TeachingSampling`** en R 4.4 y comprobar `data(BigLucy)`, `S.SI`, `E.SI`,
      `S.STPPS`, `E.2SI`.
      *Criterios:* las cinco funciones existen y `BigLucy` carga con sus dimensiones documentadas.
      *Verificación:* script de humo en `precalculo/verifica_paquetes.R`.
      *Depende de:* ninguna. *Alcance:* XS.

- [ ] **T0.4 — Verificador de bloques.** Adaptar `verifica_bloques_cap6.py` a este curso: extrae los
      bloques `language-r` y `language-python` de un capítulo, los ejecuta **encadenados** (R 4.4)
      y contrasta cada cifra anunciada en los comentarios `#>` contra la salida real.
      *Criterios:* detecta una discrepancia inyectada a propósito.
      *Verificación:* prueba negativa con una cifra alterada a mano.
      *Depende de:* T0.2. *Alcance:* S.

- [ ] **T0.5 — Arreglos técnicos en los 4 capítulos existentes:** fijar `chart.js@4.4.1`, añadir
      `prism-r.min.js`, unificar el bloque `<style>` con el de la plantilla.
      *Criterios:* los 4 capítulos cargan las mismas versiones de CDN que la plantilla; el conjunto
      de selectores CSS coincide con el de la plantilla salvo lo que un capítulo no use.
      *Verificación:* comparar conjuntos de selectores entre archivos.
      *Depende de:* T0.1. *Alcance:* S (4 archivos, cambios mecánicos).

### Checkpoint 0 — Fundación
- [ ] La plantilla abre limpia y sus componentes funcionan.
- [ ] `TeachingSampling` instalado y `BigLucy` disponible.
- [ ] El verificador de bloques detecta una cifra falsa inyectada.
- [ ] Los 4 capítulos actuales cargan las mismas versiones de CDN.

---

### Fase 1 — Capítulo 2 (el pivote)

Se produce antes que el 1 a propósito: es el que fija el marco π para todo el material. Si la
notación no convence, se rehace **un** capítulo y no ocho.

- [ ] **T1.1 — Precálculo del cap. 2** (`precalculo/genera_cap2.R`): espacio de muestras `N=5,n=2`;
      distribución de muestreo de `ȳ` sobre `agpop` (10 000 réplicas, semilla fija); cobertura
      empírica del IC; MAS ↔ sistemático sobre población con periodicidad; Bernoulli.
- [ ] **T1.2 — Módulos 1–4** (marco de diseño, `π_k`, HT, insesgadez) con derivaciones plegables.
- [ ] **T1.3 — Módulos 5–10** (MAS, IC, tamaño, Bernoulli, sistemático, aleatorización).
- [ ] **T1.4 — Los 8 simuladores** del capítulo.
- [ ] **T1.5 — Autoevaluación (≥ 8 preguntas) y ≥ 3 ejercicios guiados**, con soluciones calculadas
      en `precalculo/genera_soluciones.R`.
- [ ] **T1.6 — Componente `.glosario-notacion`** + retropropagación a la plantilla.
- [ ] **T1.7 — Verificación completa del capítulo** (protocolo de abajo).

*Criterios del capítulo:* ≥ 10 módulos, ≥ 8 simuladores, ≥ 8 preguntas, ≥ 3 ejercicios guiados,
todo bloque de R y Python ejecutado, toda cifra contrastada.
*Alcance:* L, dividido en 7 tareas S/M.

### Checkpoint 1 — Revisión de Javier · **BLOQUEANTE**
- [ ] Revisar el cap. 2 completo: ¿el marco π funciona didácticamente para el nivel del curso?
- [ ] ¿La densidad de simuladores es la correcta o sobra/falta interactividad?
- [ ] ¿El glosario de notación resuelve la convivencia Lohr ↔ Gutiérrez?
- [ ] No se produce ningún capítulo más hasta esta revisión.

---

### Fase 2 — Capítulos 1 y 3
- [ ] **T2.1** Cap. 1 — precálculo, módulos, 6 simuladores, autoevaluación, ejercicios, verificación.
- [ ] **T2.2** Cap. 3 — ídem con 7 simuladores; incorporar GREG y estimación de mediana.
- [ ] **T2.3** Retropropagar a los caps. 1–3 cualquier componente nuevo aparecido en la fase.

### Checkpoint 2 — Primer tercio
- [ ] Caps. 1, 2 y 3 verificados y navegables entre sí.
- [ ] Los enlaces entre capítulos resuelven a archivos existentes (comprobar el `href`, no navegar:
      la vista previa local sirve instantáneas estáticas y los enlaces no navegan aunque estén bien).

---

### Fase 3 — Capítulos 4 y 5
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
- [ ] **T5.2** `index.html` — portada con 8 tarjetas, totales actualizados.
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
| Preguntas de autoevaluación | 0 | ~64 |
| Ejercicios guiados | 0 | ~26 |
| Semanas del cronograma cubiertas | 9 / 16 | 16 / 16 |

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
