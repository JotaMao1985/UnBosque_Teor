# Fundamentos del Muestreo Estadístico · Universidad El Bosque

Material interactivo de la asignatura **20939 · Muestreo Estadístico** (4 créditos), programa de
Estadística. El aparato formal es el marco de diseño de Gutiérrez —el diseño muestral $p(s)$, las
probabilidades de inclusión y el estimador de Horvitz–Thompson— y el orden y los ejemplos son los
de Lohr, con los datos oficiales de *Sampling: Design and Analysis*.

🌐 **Sitio web:** https://jotamao1985.github.io/UnBosque_Teor/muestreo/

## Contenido

Ocho capítulos que cubren las 16 semanas del cronograma. **88 módulos, 65 simuladores,
88 preguntas de autoevaluación, 33 ejercicios guiados y 183 bloques de código** (148 de R,
35 de Python) con **2 033 cifras contrastadas contra la salida real**.

| # | Capítulo | Semanas | Temas | Módulos | Simuladores |
|---|---|:---:|---|:---:|:---:|
| 1 | [Encuestas, sesgos y error total](capitulo-1-encuestas-sesgos.html) | 1–2 | *Literary Digest* y Hite, marco muestral, sesgo de selección y de medición, cuestionarios, árbol del error total, sesgo en ciencia de datos | 10 | 7 |
| 2 | [Diseño muestral, MAS y sistemático](capitulo-2-diseno-mas-sistematico.html) | 3–4 | El diseño `p(s)`, probabilidades de inclusión, Horvitz–Thompson, MAS, intervalos, tamaño de muestra, Bernoulli, sistemático | 11 | 9 |
| 3 | [Estimación de razón y regresión](capitulo-3-razon-y-regresion.html) | 5–6 | Variables auxiliares, razón, sesgo y ECM, regresión, diferencia, dominios, GREG, mediana | 12 | 6 |
| 4 | [Muestreo estratificado](capitulo-4-muestreo-estratificado.html) | 7–9 | Estratos y pesos, asignación proporcional, de Neyman y con costos, construcción de estratos, postestratificación, PPT estratificado, muestreo estratificado en machine learning | 12 | 8 |
| 5 | [Muestreo por conglomerados](capitulo-5-conglomerados.html) | 10–11 | Conglomerados de igual y distinto tamaño, ICC y efecto de diseño, dos etapas, descomposición de la varianza, asignación bajo presupuesto, datos agrupados en ciencia de datos | 11 | 8 |
| 6 | [Probabilidades desiguales](capitulo-6-probabilidades-desiguales.html) | 12–13 | Hansen–Hurwitz, métodos acumulativo y de Lahiri, Horvitz–Thompson sin reemplazo, πPT, Poisson, Sen–Yates–Grundy, PPT en dos etapas, muestreo por importancia | 11 | 10 |
| 7 | [Encuestas complejas](capitulo-7-encuestas-complejas.html) | 14 | NHANES y SYC en paralelo, los tres factores del peso, DEFF descompuesto, linealización de Taylor, jackknife, BRR y bootstrap, calibración y raking, el ciclo de diseño | 10 | 9 |
| 8 | [No respuesta, ponderación e imputación](capitulo-8-no-respuesta-ponderacion.html) | 15–16 | MCAR/MAR/MNAR medidos, la fórmula del sesgo, ajuste por clases de respuesta, calibración contra la ACS, imputación simple y múltiple con reglas de Rubin, R-indicators, taller del proyecto integrador, verificación de salidas de IA | 11 | 8 |

La portada [`index.html`](index.html) enlaza todos los capítulos. La navegación es siempre por la
portada: los capítulos no enlazan entre sí, aunque sí se citan («esto se trata en el capítulo 5»).

## Qué trae cada capítulo

- **Simuladores** con Chart.js: mueve un parámetro y mira cómo cambia el resultado. El cómputo
  pesado —remuestreos, espacios de muestras, curvas de error— está precalculado en R.
- **Código en R y Python**, en pestañas. R con `survey`, `sampling` y `TeachingSampling`; Python
  donde el cálculo explícito es la lección. **Ninguna cifra de los comentarios `#>` se escribe a
  mano:** salen de ejecutar el código, y una herramienta contrasta cada una contra la salida real
  antes de publicar.
- **Derivaciones plegables**, para quien quiera el desarrollo paso a paso sin que estorbe a quien no.
- **Autoevaluación** con cuatro tipos de pregunta, retroalimentación por opción —también en las
  incorrectas— y pista con segundo intento.
- **Ejercicios guiados** con pista y solución resuelta en R.
- **Glosario de notación** que traduce entre este material, Lohr y Gutiérrez, porque el curso
  convive con dos fuentes que escriben lo mismo de maneras distintas.
- **Componentes propios del curso**: el árbol del error total (caps. 1 y 8), el diagrama de un
  diseño complejo etapa por etapa (caps. 4 a 7), el ciclo de diseño de una encuesta (caps. 7 y 8)
  y la rúbrica recorrible del proyecto integrador (cap. 8).

## Tecnología

Un único archivo HTML por capítulo, sin build ni dependencias locales: [Tailwind CSS](https://tailwindcss.com/),
[Font Awesome](https://fontawesome.com/), [KaTeX](https://katex.org/),
[Chart.js](https://www.chartjs.org/) 4.4.1 y [Prism](https://prismjs.com/) desde CDN, y los datos
incrustados como JSON. Diseño responsive y accesible (navegación por teclado, `aria-label`,
contraste cuidado).

## Despliegue

Se publica con **GitHub Pages** desde la rama `gh-pages` del repositorio
[`UnBosque_Teor`](https://github.com/JotaMao1985/UnBosque_Teor), que recibe el contenido de la
carpeta `sitio/` por `git subtree push`. El archivo `.nojekyll` desactiva el procesamiento Jekyll
para servir el HTML tal cual.

## Créditos

Diseñado por **Javier Mauricio Sierra** · Universidad El Bosque · 2026.

- Lohr, S.L. *Sampling: Design and Analysis* (2.ª y 3.ª ed.). CRC Press.
- Gutiérrez, H.A. *Estrategias de muestreo: diseño de encuestas y estimación de parámetros*
  ([acceso abierto](https://psirusteam.github.io/EstrategiasDeMuestreo/)).
- Särndal, C.-E., Swensson, B. y Wretman, J. *Model Assisted Survey Sampling*. Springer.
- Lumley, T. Paquete [`survey`](https://cran.r-project.org/package=survey) para R.
