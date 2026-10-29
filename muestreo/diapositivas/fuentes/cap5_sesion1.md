---
modulo: ../../capitulo-5-conglomerados.html
salida: ../capitulo-5-conglomerados_sesion1.html
agenda: si
etiqueta: Capítulo 5 · Sesión 1 de 2 · Semana 10
subtitulo: Sesión 1 — por qué conglomerar, la notación, una etapa, la ICC y los tamaños desiguales
objetivo: Medir cuánta información se pierde al muestrear grupos enteros, y estimar bien con conglomerados de una etapa, de igual o de distinto tamaño.
temas: Por qué conglomerar, Notación de dos niveles, Una etapa, ICC y deff, Tamaños desiguales
---

<!--
  Capítulo 5, sesión 1 de 2 (semana 10 del sílabo): módulos 1 a 5, para 90 min de exposición.
  La sesión 2 (semana 11) cubre los módulos 6 a 10.

  Convenciones pedidas por Javier (2026-10-22):
  - Cada diapositiva con cifras lleva su fuente visible al pie (<small>Fuente: …</small>).
  - Las afirmaciones se marcan <mark>Dato</mark> o <kbd>Lectura</kbd>; los juicios del autor van en una caja
    «Opinión del material», y los ejemplos con cifras elegidas, en una caja «Ejemplo ilustrativo».
  - Cifras del capítulo; citas a Lohr con la numeración de la 3.ª ed. (2022), contrastada en el libro.
    Donde el capítulo cita otra cosa, la nota lo dice.

  Verificación (2026-10-22): verifica_bloques.py --prosa del cap. 5 en verde (167/167 cifras de
  código, 58 de prosa) y recálculo independiente en R 4.4 desde los CSV de Lohr de todas las cifras
  que se proyectan. Los .json animados salen de precalculo/salidas/cap5_datos.json o de la fórmula
  del módulo 8 con los parámetros del ejercicio 4.

  Auditoría de contenido (2026-10-22, cinco lectores independientes: estadística, claridad,
  pedagogía, código y visual): errores corregidos aquí; mejoras y errores del capítulo, en el
  informe de la tarea T7.96 del PLAN.
-->

# ¿Por qué conglomerar? {seccion=modulo-1}

> Seis estados enteros o 369 condados sueltos: casi los mismos datos, y un error estándar 5,5 veces mayor.

???
Abrir con la pregunta del costo, no con la definición: ¿por qué alguien aceptaría un diseño que informa menos? La respuesta llega en la diapositiva 7. Las cifras del gancho salen de la diapositiva 9.

## Cada cifra trae su fuente y cada frase dice qué es

::: tarjetas {columnas=3}
### <mark>Dato</mark>
Una cifra que sale de los datos o del código del capítulo. Se puede recalcular.
### <kbd>Lectura</kbd>
Lo que el material o Lohr concluyen de esa cifra: una interpretación.
### Opinión del material
Un juicio o una regla práctica del autor. Va en una caja ámbar con ese título: es defendible, pero no se mide.
:::

Al pie va la **fuente**: el módulo del capítulo, el ejemplo de Lohr y el archivo de datos. Los ejemplos con cifras elegidas, no medidas, van en una caja «Ejemplo ilustrativo». Definiciones y fórmulas: teoría.

<small>Lohr, S. L. (2022). *Sampling: Design and Analysis* (3.ª ed.). CRC Press. · Material: capítulo 5, *Muestreo por conglomerados*.</small>

???
Explicar la convención una sola vez. Todas las cifras de estas diapositivas se contrastaron dos veces: con el verificador del material (que vuelve a ejecutar el código del capítulo) y con un recálculo independiente en R desde los CSV de Lohr. Los números de ejemplo de Lohr son los de la 3.ª edición, los mismos que cita el capítulo desde su corrección del 22 de octubre.

## Estratificar y conglomerar parten igual; cambia qué se sortea

::: tarjetas
### Estratificado (capítulo 4)
- **Todos** los grupos entran a la muestra
- Dentro de cada uno, **algunas** unidades
- El azar corre **dentro** de los grupos
### Conglomerados (capítulo 5)
- Se sortean **algunos** grupos
- Dentro de los elegidos, **todas** las unidades
- El azar corre **entre** los grupos
:::

<kbd>Lectura</kbd> La misma partición de la población juega a favor o en contra según qué nivel se sortee.

<small>Fuente: cap. 5, módulo 1, y la retroalimentación de su pregunta 1 (módulo 11); Lohr 3.ª ed., §5.2.2.</small>

???
Lohr §5.2.2 lo dice en términos de ANOVA: en el estratificado importa la varianza dentro de los estratos; en el conglomerado, la varianza entre conglomerados. Preguntar antes de seguir: si los grupos fueran muy distintos entre sí, ¿qué diseño sufre?

## Una etapa: se sortean conglomerados y se censan por dentro

::: definicion Muestreo por conglomerados (una etapa)
La población está dividida en \(N\) **conglomerados** o unidades primarias de muestreo (UPM). El conglomerado \(i\) tiene \(M_i\) unidades, y la población, \(K = \sum_{i=1}^{N} M_i\).

1. Se selecciona un MAS de \(n\) conglomerados entre los \(N\).
2. En cada conglomerado seleccionado se observan **todas** sus unidades.
:::

::: warn \(N\) y \(n\) cuentan grupos
En este capítulo \(N\) y \(n\) cuentan **conglomerados**. En los capítulos 2 a 4 contaban unidades.
:::

<small>Fuente: cap. 5, módulo 1 (definición); Lohr 3.ª ed., §5.1, usa la misma convención.</small>

???
El azar actúa solo en el primer paso: un conglomerado elegido entra completo y uno no elegido queda fuera. Lohr llama \(M_0\) a lo que el material llama \(K\), y Gutiérrez escribe \(N_I\) para el número de conglomerados.

## Se conglomera porque llegar a los grupos es caro, o porque no hay lista de unidades

::: ejemplo Ejemplo ilustrativo del material (cifras redondas, no medidas)
Entrevistar 400 hogares dispersos por el país exige **400 desplazamientos**; 400 hogares en 8 municipios, **8**.
:::

- **Qué ilustra:** el conglomerado convierte kilómetros en entrevistas
- **La otra razón:** a veces solo existe la lista de los grupos, no la de las unidades
- **El precio:** cada entrevista informa menos, porque los vecinos se parecen. Hoy lo medimos

<small>Fuente: cap. 5, módulo 1, y la retroalimentación de la pregunta 1 (módulo 11); Lohr 3.ª ed., introducción del cap. 5 («Why use cluster samples?») y §5.2.</small>

???
Lohr abre su capítulo 5 con las dos razones: construir la lista de unidades puede ser imposible o carísimo, y la población puede estar dispersa o venir en grupos naturales. En §5.2: el diseño de una etapa se usa cuando muestrear las unidades cuesta poco frente a llegar al conglomerado; su ejemplo es el aula, donde repartir el cuestionario a todos casi no cuesta más. Las cifras de los hogares son una ilustración del material, no un dato de ninguna encuesta.

## agpop: 3 078 condados agrupados en 50 estados {columnas=3:2}

```r Los estados como conglomerados de agpop
agpop <- read.csv("CSV data sets for SDA 3e/agpop.csv")
K <- nrow(agpop)
N <- length(unique(agpop$state))
c(condados = K, estados = N,
  rango_Mi = range(table(agpop$state)))
#>  condados   estados rango_Mi1 rango_Mi2
#>      3078        50         3       254
MSW <- sum(tapply(agpop$acres92, agpop$state,
                  function(y) sum((y - mean(y))^2))) / (K - N)
Ra2 <- 1 - MSW / var(agpop$acres92)
round(c(MSW = MSW, S2 = var(agpop$acres92),
        Ra2 = Ra2), 4)
#>          MSW           S2          Ra2
#> 9.464144e+10 1.803588e+11 4.753000e-01
```

|||

- **De dónde sale:** Censo Agrícola de EE. UU.; `acres92` es la superficie en granjas en 1992 (Lohr, ej. 2.6)
- <mark>Dato</mark> de 3 a 254 condados por estado; \(R_a^2 = 0{,}475\)
- <kbd>Lectura</kbd> los condados de un mismo estado se parecen, y casi la mitad de la estructura vive *entre* estados

<small>Fuente: cap. 5, módulo 1; agpop.csv; Lohr 3.ª ed., ej. 2.6.</small>

???
Es la población del curso desde el capítulo 2, reagrupada: un estado es un conglomerado natural. \(R_a^2\) se define en el módulo 4; aquí basta adelantar que cerca de 0 conglomerar sale casi gratis y cerca de 1 sale carísimo. El bloque completo, con los `library()`, está en el módulo 1.

## Con ~370 condados en promedio, seis estados enteros dan 30 veces más varianza {columnas=3:2}

![Media estimada de acres92 en 10 000 réplicas de cada diseño: primero el MAS, después los 6 estados enteros](recursos/cap5/histogramas_m1.json){alto=380}

|||

- <mark>Dato</mark> deff ≈ 30,4: ee **5,5 veces** mayor; las ~370 observaciones valen lo que **unas 12** de un MAS
- <kbd>Lectura</kbd> los dos se centran casi en la media verdadera: el conglomerado **dispersa** y apenas sesga

::: revelar
::: warn Opinión del material
Es el peor caso del material: conglomerados geográficos grandes y una variable muy territorial.
:::
:::

<small>Fuente: cap. 5, módulo 1 (simulador «Seis estados enteros contra 369 condados sueltos»); precálculo genera_cap5.R, semilla 2026, 10 000 réplicas (histogramas de cap5_datos.json, redibujados).</small>

???
Dos pasos: primero el histograma del MAS, angosto; después el de los 6 estados, que se desparrama. Es el mismo histograma del simulador del módulo 1, redibujado desde sus datos. 30,4 es la razón de varianzas de las réplicas; su raíz, 5,5, es la razón de errores estándar; y 371/30,4 ≈ 12. Los ~370 son un promedio: el diseño por estados observa de 95 a 797 condados según la réplica (cap5_datos.json). El estimador de los 6 estados es la razón (acres observados entre condados observados): sesga alrededor de un 1 %, unas 0,03 ee (cálculo de la auditoría); el material lo llama insesgado. El eje de la foto usa coma de miles (200,000 son doscientos mil acres): es el formato del simulador del material. El material concluye que por eso ninguna encuesta seria usa una sola etapa con conglomerados grandes: se combinan etapas (módulo 6), estratos (módulo 9) y submuestreo. Si hay tiempo, abrir el simulador del módulo 1 y aislar cada diseño con el deslizador.

## El conglomerado no se elige: se hereda {.idea etiqueta="Idea clave · lectura del material"}

Los estratos se diseñan; los conglomerados los impone el mundo —manzanas, escuelas, hospitales, nidadas— y suelen ser homogéneos justo en el sentido que perjudica.

???
La regla del capítulo 4 se invierte entera: el estratificado quería estratos distintos entre sí; el conglomerado querría que cada conglomerado fuera una miniatura de la población. Lohr §5.2.2 da la misma razón: los elementos de un conglomerado comparten entorno (pozos de una misma zona, vecinos de un mismo barrio).

## Estratos frente a conglomerados: ¿cuál es la diferencia de fondo? {.pregunta}

El capítulo 4 quería estratos bien distintos; este sufre cuando los conglomerados son homogéneos por dentro. ¿Cuál es la formulación correcta de esa inversión?

- Los estratos siempre reducen la varianza y los conglomerados siempre la aumentan
- En estratos el azar corre dentro de los grupos; en conglomerados corre entre ellos, y la diferencia entre grupos se vuelve varianza
- Es una convención de notación: matemáticamente son el mismo diseño

::: respuesta
La segunda. La primera falla por «siempre»: si los grupos no se parecen por dentro más que al azar, el conglomerado empata con el MAS. La tercera la desmienten las muestras posibles: el estratificado trae siempre unidades de todos los grupos; el conglomerado deja fuera grupos enteros.
:::

<small>Fuente: cap. 5, módulo 11, pregunta 1 de la autoevaluación (tres de sus cuatro opciones, sin letras: el material las baraja).</small>

???
Pedir que la escriban antes de revelar. La retroalimentación del material para la tercera opción habla de «π condicionales en cero»; no es exacto: las π de primer orden son positivas en los dos diseños (n/N en el conglomerado); cambian las muestras posibles y las \(\pi_{kl}\). La cuarta opción del material («estratos para poblaciones grandes, conglomerados para pequeñas») se puede decir en voz alta: el criterio es el costo y el marco, no el tamaño.

# La notación de dos niveles {seccion=modulo-2}

> 75, 10, 367 y 20: cuatro números de la misma encuesta, y cada uno cuenta una cosa distinta.

???
El material dice que la mitad de los errores con conglomerados son de notación (opinión del material, sin fuente). Este bloque es corto pero conviene no saltárselo.

## schools: 10 de 75 escuelas y 20 estudiantes en cada una

::: flujo {.paso}
1. **Población** — 75 escuelas, la \(i\) con \(M_i\) estudiantes (de 109 a 367 en las sorteadas)
2. **Etapa 1** — MAS de \(n = 10\) escuelas: \(\pi_1 = 10/75 = 0{,}1333\)
3. **Etapa 2** — MAS de \(m = 20\) estudiantes en cada una: \(\pi_2 = 20/M_i\)
4. **El estudiante** — su probabilidad es el producto de las dos
:::

**De dónde sale:** Lohr 3.ª ed., ej. 5.7. Los datos son **ficticios**, con resúmenes parecidos a los de estudios educativos reales (Lohr). Es el laboratorio de dos etapas del capítulo.

<small>Fuente: cap. 5, módulo 2 (diagrama «El diseño de schools»); schools.csv; Lohr 3.ª ed., ej. 5.7.</small>

???
Que los datos son ficticios lo dice Lohr al presentarlos (ej. 5.7); el capítulo no lo menciona.

## Dos niveles de unidades, dos familias de símbolos

| Símbolo | Cuenta… | En schools |
|---|---|---|
| \(N\) | conglomerados de la población | 75 escuelas |
| \(n\) | conglomerados sorteados | 10 escuelas |
| \(M_i\) | unidades del conglomerado \(i\) | de 109 a 367 (en las 10 sorteadas) |
| \(m_i\) | unidades observadas en \(i\) | 20 estudiantes |
| \(K = \sum M_i\) | unidades de la población | no se conoce |

::: warn N cambió de significado y no va a avisar
Antes de usar una fórmula: ¿esta letra cuenta **grupos** o **unidades**?
:::

<small>Fuente: cap. 5, módulo 2; Lohr 3.ª ed., §5.1 (tablas 5.1 y 5.2).</small>

???
Que \(K\) no se conoce lo dice el módulo 6: solo se conocen los \(M_i\) de las escuelas sorteadas. Para estimar totales no hace falta; para la media, sí. Lohr lo llama \(M_0\).

## Por primera vez, π es un producto: una probabilidad por etapa

$$\pi_k = \underbrace{\frac{n}{N}}_{\text{sale su conglomerado}} \times \underbrace{\frac{m_i}{M_i}}_{\text{sale él dentro}}, \qquad w_k = \frac{1}{\pi_k} = \frac{N}{n}\cdot\frac{M_i}{m_i}$$

El estimador es el de Horvitz–Thompson del capítulo 2, \(\hat{t}_\pi = \sum_{k \in s} y_k/\pi_k\). Con una etapa, \(m_i = M_i\) y el segundo factor vale 1.

<small>Fuente: cap. 5, módulo 2; Lohr 3.ª ed., ec. (5.22).</small>

???
Es la novedad estructural del capítulo: por primera vez en el curso, π es un producto de etapas. En el capítulo 7 las encuestas reales apilarán tres o cuatro factores.

## ¿Qué peso tiene un estudiante de la escuela con 367? {.pregunta}

En schools se sortean \(n = 10\) de \(N = 75\) escuelas y \(m = 20\) estudiantes en cada una. ¿Qué peso final tiene un estudiante de la escuela con \(M_i = 367\)? Un decimal.

::: respuesta 137,6
\(w = \dfrac{N}{n}\cdot\dfrac{M_i}{m} = 7{,}5 \times \dfrac{367}{20} = 137{,}6\). Ese estudiante representa a 137,6 estudiantes de la población, él incluido.
:::

<small>Fuente: cap. 5, módulo 11, pregunta 2 de la autoevaluación (respuesta 137,6 ± 0,11).</small>

???
Antes de revelar, pedir también el peso de un estudiante de la escuela con 109: 40,9. La siguiente diapositiva lo comprueba contra el archivo.

## El archivo ya trae ese peso, y la cuenta lo reconstruye exacto

```r Probabilidades y pesos de dos etapas en schools {resaltar=7-14}
schools <- read.csv("CSV data sets for SDA 3e/schools.csv")
Mi <- tapply(schools$Mi, schools$schoolid, unique)
data.frame(escuela = names(Mi)[1:5], Mi = as.numeric(Mi)[1:5],
           pi1 = round(10 / 75, 4),
           pi2 = round(20 / as.numeric(Mi)[1:5], 4),
           peso = round((75 / 10) * as.numeric(Mi)[1:5] / 20, 3))
#>   escuela  Mi    pi1    pi2    peso
#> 1       9 163 0.1333 0.1227  61.125
#> 2      17 180 0.1333 0.1111  67.500
#> 3      18 114 0.1333 0.1754  42.750
#> 4      22 367 0.1333 0.0545 137.625
#> 5      35 109 0.1333 0.1835  40.875
max(abs((75 / 10) * schools$Mi / 20 - schools$finalwt))
#> [1] 0
```

<mark>Dato</mark> la cuenta y `finalwt` difieren en **0**. <kbd>Lectura</kbd> escuela más grande: π más chica y peso más grande.

<small>Fuente: cap. 5, módulo 2 (bloque «Probabilidades y pesos de dos etapas en schools»).</small>

???
Recortado del bloque del módulo 2 (sin los comentarios ni el conteo de escuelas). El efecto cruzado de \(M_i\) es la semilla del capítulo 6: si las escuelas grandes salieran con más probabilidad en la primera etapa, los dos efectos se cancelarían. Se retoma en la sesión 2.

# Una etapa, igual tamaño {seccion=modulo-3}

> Si el azar sorteó suites, la unidad de muestreo es la suite: se trabaja con sus totales.

## gpa: 5 suites de 4 estudiantes, sorteadas entre 100

- **De dónde sale:** Lohr 3.ª ed., ej. 5.2. Un estudiante quiere el promedio académico (GPA) de su residencia, que tiene 100 suites de cuatro; sortea 5 y pregunta a todos sus ocupantes
- **Qué ilustra:** el caso más limpio, con conglomerados iguales y censados por dentro

| Suite | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| Total \(t_i\) | 12,16 | 11,36 | 8,96 | 12,96 | 11,08 |

<mark>Dato</mark> los cinco totales. <kbd>Lectura</kbd> son todo lo que necesita el estimador.

<small>Fuente: cap. 5, módulo 3; gpa.csv; Lohr 3.ª ed., ej. 5.2 (los mismos totales).</small>

???
Lohr lo subraya al cerrar el ejemplo: de la tabla solo se usa la fila de totales; las notas individuales cuentan solo por su aporte al total de su suite.

## Es el MAS del capítulo 2 aplicado a los N totales

$$\hat{\bar{y}} = \frac{\sum_{i \in s} t_i}{nM}, \qquad \widehat{V}(\hat{\bar{y}}) = \left(1 - \frac{n}{N}\right) \frac{s_t^2}{n M^2}$$

\(s_t^2\) es la varianza muestral de los cinco totales. Toda la varianza se juzga **entre** conglomerados: dentro se censa, así que dentro no hay azar.

<small>Fuente: cap. 5, módulo 3; Lohr 3.ª ed., ecs. (5.4) a (5.6).</small>

???
\(s_t^2\) es la varianza muestral de los cinco totales. Lohr añade un detalle que el material no trata: el intervalo usa una \(t\) con \(n - 1 = 4\) grados de libertad, porque la muestra son 5 suites, no 20 estudiantes; con eso le sale [2,37; 3,28].

## Con cinco totales sale la media y su error estándar {columnas=3:2}

```r El estimador de suites a mano
gpa <- read.csv("CSV data sets for SDA 3e/gpa.csv")
t_i <- tapply(gpa$gpa, gpa$suite, sum)
ybar_cl <- sum(t_i) / (5 * 4)
V_cl <- (1 - 5 / 100) * var(t_i) / (5 * 4^2)
round(c(media = ybar_cl, ee = sqrt(V_cl)), 4)
#>  media     ee
#> 2.8260 0.1637
```

|||

- <mark>Dato</mark> media **2,826** y ee **0,1637**
- <mark>Dato</mark> son las cifras que publica Lohr: 2,826 y 0,164

<small>Fuente: cap. 5, módulo 3 (bloque «El estimador de suites a mano»); Lohr 3.ª ed., ej. 5.2.</small>

???
El material trae el mismo cálculo en Python con pandas (pestaña Python del módulo 3). Recortado: se quitó la impresión de los totales, que ya están en la diapositiva anterior.

## El error real es un 46 % mayor que el que declara el MAS imaginario {columnas=3:2}

```r survey y el espejismo del MAS imaginario {resaltar=6,8}
gpa$fpc <- 100
dis_gpa <- svydesign(id = ~suite, weights = ~wt,
                     fpc = ~fpc, data = gpa)
svymean(~gpa, dis_gpa)
#>      mean     SE
#> gpa 2.826 0.1637
round(sqrt((1 - 20 / 400) * var(gpa$gpa) / 20), 4)
#> [1] 0.1122
```

|||

- <mark>Dato</mark> ee con el diseño, **0,1637**; ee de un MAS de 20 estudiantes, **0,1122**
- <kbd>Lectura</kbd> el análisis ingenuo declara intervalos **demasiado estrechos**: 0,1637 es 1,46 veces 0,1122

<small>Fuente: cap. 5, módulo 3 (bloque «survey y el espejismo del MAS imaginario»).</small>

???
`survey` reproduce la cuenta a mano porque `id = ~suite` le dice qué se sorteó. El ingenuo trata a los 20 estudiantes como si fueran un MAS de los 400 de la residencia.

## Olvidar el fpc ensanchaba; ignorar los conglomerados estrecha {.idea etiqueta="Idea clave · lectura del material"}

Olvidar el fpc (capítulo 2) es un error **conservador**. Ignorar los conglomerados **publica una precisión que no existe**: el capítulo 7 le dedica un módulo, «El error más caro».

???
Opinión del material: de los dos errores silenciosos, este es el caro, porque produce afirmaciones «significativas» que no se sostienen. El módulo citado es el 8 del capítulo 7.

## ¿Por qué el estimador usa los totales tᵢ y no las unidades? {.pregunta}

- Porque los totales son más fáciles de calcular que las medias
- Porque lo que el azar sorteó fueron conglomerados: la muestra es un MAS de la población de los \(N\) totales
- Porque así se evitan los pesos de muestreo

::: respuesta
La segunda. Dentro del conglomerado sorteado no hay azar (se censa), así que la única fuente de varianza es qué totales salieron. Los pesos siguen ahí (\(N/n\) por conglomerado): trabajar con totales no los elimina, los organiza.
:::

<small>Fuente: cap. 5, módulo 11, pregunta 3 de la autoevaluación (tres de sus cuatro opciones).</small>

???
La cuarta opción del material («porque las unidades individuales no se observan») es falsa: se observan todas, y por eso \(t_i\) se conoce exacto.

# La correlación intraclase {seccion=modulo-4}

> El módulo 3 midió el castigo; este explica su tamaño con un solo número.

## Paso 1: la ICC compara la varianza de dentro con la total

::: definicion La ICC estimada por ANOVA (la \(R_a^2\) de Lohr)
$$\rho \;\approx\; R_a^2 = 1 - \frac{\text{MSW}}{S^2}, \qquad \text{MSW} = \frac{\text{SSW}}{K - N}$$
:::

- Si los miembros de cada grupo son casi iguales, MSW es pequeña y \(R_a^2 \to 1\)
- Si no se parecen más que dos unidades al azar, \(\text{MSW} \approx S^2\) y \(R_a^2 \to 0\)
- Puede ser negativa en grupos armados adrede para ser diversos, como el sistemático del capítulo 2

<small>Fuente: cap. 5, módulo 4 (paso 1); Lohr 3.ª ed., ec. (5.13) y §5.2.2.</small>

???
\(S^2\) es la varianza de todas las unidades sin mirar los grupos; SSW es la suma de cuadrados dentro del capítulo 4, módulo 7. Con una muestra se calcula sobre los \(n\) conglomerados observados. Lohr §5.2.2 confirma lo de la ICC negativa: rara en conglomerados naturales, posible en sistemáticos o artificiales.

## Pasos 2 y 3: la ICC se traduce en costo y en observaciones

$$\text{deff} \approx 1 + (\bar{M} - 1)\,\rho \qquad\qquad n_{\text{ef}} = \frac{\text{unidades observadas}}{\text{deff}}$$

El «1» es el MAS. Cada unidad tiene \(\bar{M} - 1\) compañeros de grupo, y cada uno repite una fracción \(\rho\) de su información.

::: ejemplo Ejemplo ilustrativo del material (valores elegidos, no medidos)
Aulas de 25 con \(\rho = 0{,}05\): deff = 2,2, y 1 000 estudiantes informan como unos 450.
:::

<small>Fuente: cap. 5, módulo 4 (pasos 2 y 3); Lohr 3.ª ed., ec. (5.12): la aproximación vale cuando N es grande.</small>

???
1 + 24 × 0,05 = 2,2 y 1 000/2,2 ≈ 455. El material atribuye la fórmula a Kish (*Survey Sampling*, §5.4); esa sección no se pudo contrastar [SIN VERIFICAR], pero Lohr 3.ª la deriva en la ec. (5.12), que es lo que se cita aquí. \(n_{\text{ef}}\) se escribe con «unidades observadas» porque en este capítulo \(n\) cuenta conglomerados.

## ¿Cuánto vale el deff en aulas de 25 con ρ ≈ 0,04? {.pregunta}

Con aulas de \(\bar{M} = 25\) estudiantes y \(\rho \approx 0{,}04\), ¿cuánto vale el deff de Kish? Dos decimales.

::: respuesta 1,96
\(1 + (25 - 1)(0{,}04) = 1{,}96\). La diapositiva siguiente lo calcula con las aulas de algebra (\(\bar{M} = 24{,}92\), \(\rho = 0{,}0396\)): 1,95. La autoevaluación acepta las dos.
:::

<small>Fuente: cap. 5, módulo 11, pregunta 4 de la autoevaluación (respuesta 1,96 ± 0,02).</small>

???
Si sobra tiempo: ¿y en las suites de gpa, con M = 4 y ρ ≈ 0,30? 1 + 3 × 0,30 = 1,90. Casi lo mismo: es el punto de la diapositiva animada que viene.

## algebra: 12 aulas censadas por dentro dan una ICC de 0,04 {columnas=3:2}

```r La ICC de algebra por ANOVA
algebra <- read.csv("CSV data sets for SDA 3e/algebra.csv")
K <- nrow(algebra)
n <- length(unique(algebra$class))
SSW_a <- sum(tapply(algebra$score, algebra$class,
                    function(y) sum((y - mean(y))^2)))
MSW_a <- SSW_a / (K - n)
icc   <- 1 - MSW_a / var(algebra$score)
Mbar  <- mean(tapply(algebra$Mi, algebra$class, unique))
round(c(K = K, icc = icc, Mbar = Mbar,
        deff_teorico = 1 + (Mbar - 1) * icc), 4)
#>            K          icc         Mbar deff_teorico
#>     299.0000       0.0396      24.9167       1.9482
```

|||

- **De dónde sale:** Lohr 3.ª ed., ej. 5.6: MAS de 12 de las 187 clases de álgebra de una ciudad, con una prueba sobre funciones. Datos **hipotéticos** (Lohr)
- <mark>Dato</mark> \(R_a^2 = 0{,}0396\) y \(\bar{M} = 24{,}92\): deff de Kish **1,95**

<small>Fuente: cap. 5, módulo 4 (bloque «La ICC de algebra por ANOVA»); algebra.csv; Lohr 3.ª ed., ej. 5.6.</small>

???
Las dos líneas largas del bloque se partieron en dos para que quepan; el código es el del material. Que los datos son hipotéticos lo dice Lohr al presentarlos. Lohr no calcula la ICC de algebra: esa cuenta es del material.

## Grupos chicos muy parecidos y grupos grandes poco parecidos cuestan casi lo mismo

![deff = 1 + (M − 1)ρ para las suites de gpa (M = 4, ρ ≈ 0,30) y las aulas de algebra (M̄ ≈ 25, ρ ≈ 0,04), con las dos ρ estimadas como en el módulo 4](recursos/cap5/kish_gpa_algebra.json){alto=380}

<kbd>Lectura</kbd> lo que cuenta es el producto \((\bar{M} - 1)\rho\): 3 × 0,30 y 24 × 0,04 valen casi lo mismo.

<small>Fuente: cap. 5, módulos 3 y 4; precálculo cap5_datos.json (ρ de gpa 0,301 y de algebra 0,0396).</small>

???
Dos pasos: la recta de gpa y la de algebra. El módulo 3 compara con los datos (1,46 y 1,50 en error estándar) y explica la distancia: ρ se estimó con la varianza de los estudiantes de la muestra, que con pocos conglomerados se queda corta. Con el estimador de Lohr (ej. 5.4), en gpa \(\hat{\rho} = 0{,}337\), y la fórmula y el dato coinciden: 2,01 y 2,02. En algebra, Kish pasa de 1,95 a 2,02 (módulo 4); lo que falta hasta 2,245 son los tamaños desiguales y el ruido de 12 aulas.

## Con el diseño declarado, survey mide un deff de 2,25 {columnas=3:2}

```r algebra con survey y su deff
algebra$peso <- 187 / 12
algebra$fpc <- 187
dis_alg <- svydesign(id = ~class, weights = ~peso,
                     fpc = ~fpc, data = algebra)
svymean(~score, dis_alg, deff = TRUE)
#>          mean      SE  DEff
#> score 62.5686  1.4916 2.245
```

|||

- <mark>Dato</mark> media 62,57 y ee 1,49, como en Lohr; deff **2,245**
- <mark>Dato</mark> los 299 estudiantes rinden como **entre 133 y 153** de un MAS (299/2,245 y 299/1,948)
- <kbd>Lectura</kbd> 1,95 frente a 2,25: aulas de 17 a 34 estudiantes, solo 12 aulas, y una ρ estimada con la varianza muestral, que con pocos grupos se queda corta

<small>Fuente: cap. 5, módulo 4 (bloque «algebra con survey y su deff»); Lohr 3.ª ed., ej. 5.6.</small>

???
`deff = TRUE` compara contra un MAS sin reemplazo del mismo tamaño en la misma población: los dos lados llevan su fpc. El material lo comprueba a mano en el mismo bloque (ee del MAS 0,9955). La fórmula de Kish supone conglomerados iguales, y estos no lo son. Con el \(\hat{S}^2\) de Lohr en lugar de la varianza muestral, \(R_a^2 = 0{,}0427\) y Kish da 2,02 (lo dice el módulo 4).

# Tamaños desiguales {seccion=modulo-5}

> ¿El volumen medio de un huevo? Antes hay que responder: ¿medio entre qué?

## coots: 184 nidadas de 5 a 13 huevos, y 2 medidos en cada una

- **De dónde sale:** Arnold (1991), tamaño y volumen de huevos de focha americana en Minnedosa, Manitoba (Canadá); Lohr 3.ª ed., ej. 5.8
- **Qué ilustra:** conglomerados de tamaño desigual, \(M_i\) de 5 a 13
- Hay dos poblaciones posibles, la de los **huevos** y la de las **nidadas**, y cada una tiene su media

<mark>Dato</mark> 184 nidadas, 368 huevos medidos.

<small>Fuente: cap. 5, módulo 5; coots.csv; Lohr 3.ª ed., ej. 5.8.</small>

???
Lohr presenta este ejemplo en §5.3 (dos etapas), porque de cada nidada solo se midieron 2 huevos; en la 1.ª edición (Duxbury, 1999) era el ej. 5.6. Los tamaños desiguales como tales están en §5.2.3.

## Cada nidada pesa lo que pesa en la población de huevos

$$\hat{\bar{y}}_r = \frac{\sum_{i \in s} \hat{t}_i}{\sum_{i \in s} M_i}, \qquad e_i = \hat{t}_i - \hat{\bar{y}}_r\, M_i$$

De cada nidada se miden 2 huevos, así que su total se estima: \(\hat{t}_i = M_i \bar{y}_i\). Es el estimador de razón del capítulo 3 con \(x_i = M_i\), con denominador aleatorio. La varianza usa los residuos \(e_i\), sin fpc ni término de la segunda etapa: el número de nidadas no se conoce y es grande.

<small>Fuente: cap. 5, módulo 5; Lohr 3.ª ed., ecs. (5.30) y (5.33), y ej. 5.8.</small>

???
Lohr §5.2.3 explica por qué la razón suele ganarle al estimador insesgado cuando los \(M_i\) varían: su varianza depende de cuánto varían las medias por unidad, no de cuánto varían los totales. El caso extremo es el ejemplo 5.9 de Lohr, el «perrito de seis patas».

## La media ingenua no estima peor el mismo número: estima otro {columnas=3:2}

```r La razón de coots a mano
coots <- read.csv("CSV data sets for SDA 3e/coots.csv")
coots$w <- coots$csize / 2
nid <- data.frame(
  t_i = tapply(coots$w * coots$volume, coots$clutch, sum),
  Mi  = tapply(coots$w, coots$clutch, sum)
)
ybar_r <- sum(nid$t_i) / sum(nid$Mi)
e_i <- nid$t_i - ybar_r * nid$Mi
V_r <- var(e_i) / (nrow(nid) * mean(nid$Mi)^2)
round(c(razon = ybar_r, ee = sqrt(V_r)), 4)
#>  razon     ee
#> 2.4908 0.0610
round(c(media_por_huevo_medido = mean(coots$volume)), 4)
#> media_por_huevo_medido
#>                 2.3334
```

|||

- <mark>Dato</mark> razón **2,49** (ee 0,061), como en Lohr; ingenua **2,33**: la razón es un 6,7 % mayor
- <kbd>Lectura</kbd> el volumen crece con la nidada, y la ingenua subrepresenta a las grandes
- <kbd>Lectura</kbd> la razón responde por el **huevo típico**; la ingenua, por el de la **nidada típica**

<small>Fuente: cap. 5, módulo 5 (bloque «La razón de coots a mano»); Lohr 3.ª ed., ej. 5.8.</small>

???
`csize/2` es el peso relativo: cada huevo medido habla por la mitad de su nidada. El material deja una nota de auditoría: la nidada 88 trae `csize` distinto en sus dos huevos (9 y 11), y el material pondera cada huevo con el suyo. Es convención del material: Lohr suma los pesos como si los dos huevos fueran de una nidada de 9 y después usa el otro tamaño para \(\bar{M}\). La diferencia relativa es de 8 × 10⁻⁵, invisible a dos decimales. Con `survey` (`id = ~clutch, weights = ~w`) sale lo mismo.

## Sobre las nidadas de coots, ¿qué es cierto? {.pregunta}

Razón 2,49; media ingenua 2,33. Marca todo lo que sea cierto:

1. La razón estima el volumen del huevo típico; la ingenua, el del huevo de la nidada típica
2. La brecha entre las dos no se cierra al aumentar el número de nidadas
3. Con más nidadas, la media ingenua converge a la razón
4. Si el volumen no dependiera del tamaño de la nidada, las dos casi coincidirían

::: respuesta 1, 2 y 4
La 3 es falsa: un parámetro equivocado no se arregla con más datos. La 4 la comprobarás en el ejercicio guiado 2, con la **longitud** del huevo, que apenas depende de la nidada.
:::

<small>Fuente: cap. 5, módulo 11, pregunta 5 de la autoevaluación (allí las opciones salen barajadas).</small>

???
La 2 es lo que muestra el simulador del módulo 5: la brecha no se cierra al crecer \(n\). Es el «\(n\) grande no salva» del capítulo 1, en versión conglomerados.

# Cierre de la sesión 1 {seccion=modulo-11}

## Lo que te llevas hoy {.cierre}

- El conglomerado es la unidad de muestreo: se estima con sus **totales**, y la varianza vive **entre** grupos
- \(N\) y \(n\) cuentan grupos, y \(\pi\) es un **producto** de etapas
- Ignorar los conglomerados **estrecha** el intervalo: publica una precisión que no existe
- La ICC y \(\bar{M}\) fijan el precio: \(\text{deff} \approx 1 + (\bar{M} - 1)\rho\)
- Con tamaños desiguales, la razón responde por el **huevo típico**; la media ingenua, por otra pregunta

???
Retomar el gancho: los 6 estados enteros eran el peor caso. La sesión 2 muestra cómo se doma ese número: dos etapas, cuántos conglomerados y estratos.

## Para la semana 11

::: flujo
1. **Autoevaluación** — rehaz sin mirar las seis primeras preguntas (módulos 1 a 5)
2. **Ejercicio guiado 1** — algebra: el intervalo ingenuo y el honesto
3. **Ejercicio guiado 2** — coots: la longitud media del huevo
4. **Lectura** — módulos 6 y 7: dos etapas y dónde vive la varianza
:::

<small>Fuente: cap. 5, módulo 11 (autoevaluación y ejercicios guiados).</small>

???
Aviso para el docente sobre el ejercicio 1: construye los intervalos con ±1,96 ([59,65; 65,49]). Lohr (ej. 5.6) usa una \(t\) con 11 grados de libertad (2,20) y obtiene [59,29; 65,85]. La razón de anchos que pide el ejercicio, 1,50, no cambia: el multiplicador se cancela.
