# Fundamentos del Muestreo Estadístico · Universidad El Bosque

Material interactivo de la asignatura **20939 · Muestreo Estadístico** (4 créditos), programa de
Estadística. El aparato formal es el marco de diseño de Gutiérrez —el diseño muestral $p(s)$, las
probabilidades de inclusión y el estimador de Horvitz–Thompson— y el orden y los ejemplos son los
de Lohr, con los datos oficiales de *Sampling: Design and Analysis*.

🌐 **Sitio web:** https://jotamao1985.github.io/UnBosque_Teor/muestreo/

## Contenido

| # | Capítulo | Semanas | Temas | Módulos | Simuladores |
|---|---|:---:|---|:---:|:---:|
| 1 | [Encuestas, sesgos y error total](capitulo-1-encuestas-sesgos.html) | 1–2 | *Literary Digest* y Hite, marco muestral, sesgo de selección y de medición, cuestionarios, árbol del error total, sesgo en ciencia de datos | 10 | 7 |
| 2 | [Diseño muestral, MAS y sistemático](capitulo-2-diseno-mas-sistematico.html) | 3–4 | El diseño `p(s)`, probabilidades de inclusión, Horvitz–Thompson, MAS, intervalos, tamaño de muestra, Bernoulli, sistemático | 11 | 9 |
| 3 | [Estimación de razón y regresión](capitulo-3-razon-y-regresion.html) | 5–6 | Variables auxiliares, razón, sesgo y ECM, regresión, diferencia, dominios, GREG, mediana | 12 | 6 |
| 4 | [Muestreo estratificado](capitulo-4-muestreo-estratificado.html) | 7–9 | Estratos, pesos, asignación, postestratificación, ciencia de datos | 10 | — |

Los capítulos 5 a 8 —conglomerados, probabilidades desiguales, encuestas complejas y no
respuesta— están en producción. El capítulo 4 conserva todavía el formato anterior.

La portada [`index.html`](index.html) enlaza todos los capítulos.

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
