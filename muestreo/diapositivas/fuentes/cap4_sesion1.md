---
modulo: ../../capitulo-4-muestreo-estratificado.html
salida: ../capitulo-4-muestreo-estratificado_sesion1.html
agenda: si
etiqueta: Sesión 1 de 2 · 90 min
subtitulo: Sesión 1 · Por qué estratificar, cómo estimar y cómo repartir la muestra (módulos 1 a 5)
objetivo: Explicar por qué estratificar reduce la varianza, estimar media, total y proporción con los pesos del diseño, y elegir la asignación —proporcional, igual, Neyman o con costos— según la pregunta y el presupuesto.
temas: Estratos, Marco π, Pesos, Proporcional, Neyman, Costos, Tamaño de muestra
---

<!--
  Capítulo 4 · Sesión 1 de 2 (90 min de exposición): módulos 1 a 5.
  La sesión 2 (cap4_sesion2.md) cubre los módulos 6 a 12.
  Convención de rótulos: ::: ejemplo Dato · ::: tip Interpretación · ::: warn Criterio.
  Verificación (2026-10-22): precalculo/verifica_bloques.py --prosa sobre el capítulo 4 dio 528/528
  cifras de código y 249/249 de prosa respaldadas por la salida real de R 4.4 y Python, el precálculo
  o la revisión manual registrada en precalculo/cifras_prosa.json. Las cifras propias de las
  diapositivas se calcularon aparte con R 4.4 y se citan en la nota de cada una. Lohr, Sampling,
  3.ª ed. (2022). Auditoría con cinco lectores (estadística, fuentes, claridad, pedagogía y código)
  el 2026-10-22; sus mejoras se aplicaron el mismo día.
  Los gráficos animados salen de recursos/cap4/*.json, generados desde las salidas de R del capítulo
  y desde precalculo/salidas/cap4_datos.json.
  Código: en todos los bloques se quitaron los comentarios del capítulo; los demás recortes se declaran
  en un comentario como este junto a su diapositiva. Cada nota de código dice «Proyectar» (mostrar sin
  correr) o «Correr en vivo» (en la consola del docente, desde la raíz del repositorio del curso).
  Minutos previstos: módulo 1 en el 3 · módulo 2 en el 19 · módulo 3 en el 31 · módulo 4 en el 49 ·
  módulo 5 en el 69 · práctica en el 85.
-->

## Cómo leer estas diapositivas

Lo que no lleva rótulo es teoría (definiciones y fórmulas) o dato. La fuente de cada cifra va en las notas.

::: ejemplo Dato
Cifras, tablas, gráficas y salidas de R, verificadas contra el código del capítulo o contra Lohr, o calculadas para la diapositiva (lo dicen las notas).
:::

::: tip Interpretación
Lo que el material concluye de los datos o de una fórmula: se discute con los datos en la mano.
:::

::: warn Criterio
Una recomendación o un juicio, del material o de Lohr: razonable, pero opinable.
:::

???
Treinta segundos, antes del primer divisor. Lo que no lleva rótulo es teoría (definiciones, fórmulas) o dato. Todas las cifras están verificadas contra el código del capítulo, el precálculo o Lohr (3.ª ed.); la fuente de cada una va al final de la nota de su diapositiva.

**Transición:** el gancho del módulo 1.

# Módulo 1 · ¿Por qué estratificar? {seccion=modulo-1}

> El MAS del capítulo 2 sorteó de una sola urna. Es insesgado y honesto, pero trata igual lo que no es igual.

???
**Minuto 3.** Pregunta de arranque: ¿qué le pasa a una urna única cuando la población tiene grupos muy distintos? Dejar que respondan antes de pasar.

## Casi todo el capítulo trabaja sobre un censo agrícola de 3 078 condados

::: tarjetas {columnas=3}
### agpop · la población
El Censo Agrícola de EE. UU.: **3 078 condados**, con datos de 1982, 1987 y 1992. Como es un censo, **la verdad se conoce**.
### agstrat · la muestra estratificada
300 condados sorteados **por separado en cada región**, cerca del 10 % de cada una.
### agsrs · el MAS del capítulo 2
300 condados de **una sola urna**. Sirve de contraste.
:::

`acres92`: acres dedicados a fincas en 1992 (el material la llama «superficie sembrada»).

???
**Qué ilustra:** es la población de todo el capítulo. **De dónde sale:** Lohr, 3.ª ed., Ej. 2.6 (`agpop.csv`: el Census of Agriculture de EE. UU., N = 3 078 condados y equivalentes, datos de 1982, 1987 y 1992), Ej. 2.6 también para `agsrs.csv` (MAS de 300) y Ej. 3.2 para `agstrat.csv` (un MAS en cada una de las cuatro regiones, cerca del 10 % de cada una). **Por qué importa:** como `agpop` es un censo, cada estimación se puede contrastar con la verdad, cosa que en una encuesta real nunca pasa. Salvedad: 19 condados traen `acres92 = −99` (código de faltante); por decisión del capítulo 2, la «verdad» del material es la del marco completo con esos códigos (media 306 677, frente a 308 582 con solo los válidos).

Sobre el nombre de la variable: Lohr define `acres92` como los acres dedicados a fincas («acres devoted to farms»); el material la llama «superficie sembrada» desde el capítulo 1. Decirlo de palabra una vez.

**Transición:** ¿qué tan distintas son las regiones? La gráfica siguiente.

## Un condado medio del Oeste tiene ocho veces los acres de uno del Nordeste {columnas=2:1}

![](recursos/cap4/m1_medias.json){alto=420}

|||

::: revelar
::: ejemplo Dato
Medias: Nordeste 90 619, Oeste 723 344.

Desviaciones: Nordeste 79 365, Oeste 835 639.
:::

::: tip Interpretación
Una urna única puede traer mucho Oeste o poco. **Toda esa lotería es varianza.**
:::
:::

???
Avanzar etapa por etapa: primero el Nordeste, luego el Oeste (723 344 / 90 619 ≈ 8 veces), luego Norte-Centro y Sur, y al final la media nacional. El último paso muestra las desviaciones. Preguntar: si la urna saca 60 condados del Oeste en vez de 41, ¿hacia dónde se va la estimación?

**Fuente:** bloque «La heterogeneidad entre regiones» del módulo 1 (salida de R verificada). Media nacional 306 676,97: capítulo 2 y `precalculo/salidas/cap4_datos.json` (`distribucion.media`).

**Transición:** ¿cómo se sacan esas cifras en R? Tres llamadas a `tapply`.

## En R: la desviación del Oeste es más de diez veces la del Nordeste

```r La heterogeneidad entre regiones {resaltar=5-9}
library(survey)
agpop   <- read.csv("CSV data sets for SDA 3e/agpop.csv")
agstrat <- read.csv("CSV data sets for SDA 3e/agstrat.csv")
N <- nrow(agpop)
data.frame(
  Nh    = tapply(agpop$acres92, agpop$region, length),
  media = round(tapply(agpop$acres92, agpop$region, mean), 0),
  sd    = round(tapply(agpop$acres92, agpop$region, sd), 0)
)
#>      Nh  media     sd
#> NC 1054 325951 271303
#> NE  220  90619  79365
#> S  1382 199140 243956
#> W   422 723344 835639
```

`tapply` agrupa por `region`: el marco trae la región de **cada** condado, y eso es lo que permite estratificar.

???
**Correr en vivo**, desde la raíz del repositorio del curso: este bloque carga `agpop` y `agstrat`, que usan todos los demás. 835 639 / 79 365 = 10,5.

**Fuente:** bloque «La heterogeneidad entre regiones», módulo 1 (verificado: la salida coincide con R 4.4).

**Transición:** con la región en el marco, ¿qué es exactamente estratificar?

## Estratificar es sortear por separado dentro de grupos fijados antes

::: definicion Muestreo estratificado
La población \(U\) se parte **antes de muestrear** en \(H\) estratos disjuntos y exhaustivos de tamaños conocidos \(N_1,\dots,N_H\). En cada estrato se sortea una muestra **independiente** de tamaño \(n_h\) (aquí, MAS sin reemplazo).
:::

Hace falta que el marco traiga la variable de estratificación **para todas las unidades**, y conocer los \(N_h\).

::: revelar
::: idea
El azar queda **confinado dentro de cada estrato**: la composición de la muestra por regiones ya no es aleatoria, la fija el diseñador.
:::
:::

???
La definición y las dos condiciones son las del módulo 1 (caja de definición y nota «Dos condiciones para poder estratificar»). Insistir en «independiente»: lo que salga en el Oeste no afecta lo que salga en el Sur. Si el marco no trae la variable pero sí los N_h, el plan B es postestratificar (módulo 10, sesión 2).

**Transición:** ¿y si el marco no trae la variable? La pregunta siguiente lo pone a prueba.

## ¿Puede estratificar este instituto? {.pregunta}

Un instituto quiere estratificar una encuesta de hogares por **nivel socioeconómico**. Su marco trae nombre, dirección y teléfono. Por el censo, sabe **cuántos hogares** hay de cada nivel.

::: respuesta
**Estratificar, no**: le falta la variable en el marco. Pero conoce los \(N_h\): puede sortear sin estratos, preguntar el nivel en la entrevista y **postestratificar** con los \(N_h\) del censo (módulo 10).
:::

???
Es la pregunta 2 de la autoevaluación del módulo 13 (módulo 1). Pedir que la escriban antes de revelar. Un distractor del material: «preguntar el nivel en la entrevista y agrupar por él». Eso es postestratificar, no estratificar: los n_h quedan al azar, y eso tiene un costo de varianza que el módulo 10 mide.

**Transición:** cuando sí se puede estratificar, ¿qué se gana? Tres cosas.

## Estratificar compra tres cosas

::: tarjetas {.paso}
### Precisión
La varianza solo paga la variabilidad **dentro** de los estratos.
### Garantías por subgrupo
El Nordeste es el 7 % de los condados. En `agstrat` tiene **21** garantizados.
### Logística y costo
Cada estrato puede tener su propio operativo, su marco y su modo de entrevista.
:::

???
El orden es el del módulo 1: de más a menos importancia práctica. Con la urna única, el Nordeste puede salir casi vacío en una muestra concreta; estratificando, sus 21 condados están garantizados.

**Fuente:** módulo 1. 7 % = 220 / 3 078 (bloque R1); n_h = 21 en el bloque «Probabilidades de inclusión y pesos de agstrat» (módulo 2).

**Transición:** ¿por qué la varianza solo paga lo de dentro? Lo dice el marco π.

# Módulo 2 · La teoría en el marco π {seccion=modulo-2}

> Nada de esto es nuevo: es el π-estimador del capítulo 2 aplicado a un diseño concreto.

???
**Minuto 19.** Pregunta de arranque: en el capítulo 2, ¿qué hacía falta para escribir la varianza de cualquier diseño? (las \(\pi_k\) y las \(\pi_{kl}\)).

## Dentro del estrato, un MAS; entre estratos, independencia

$$\pi_k = \frac{n_h}{N_h}\ \ \text{si } k \in U_h \qquad\qquad \pi_{kl} = \pi_k\,\pi_l\ \ \text{si } k \in U_h,\ l \in U_g,\ h \neq g$$

Para dos unidades del **mismo** estrato, \(\pi_{kl} = \frac{n_h}{N_h}\cdot\frac{n_h-1}{N_h-1}\), como en el MAS.

La novedad está en la segunda fórmula: para estratos distintos, \(\pi_{kl} - \pi_k\pi_l = 0\), y ese par **no aporta varianza**.

???
Fórmula del módulo 2 («Probabilidades de inclusión del diseño estratificado»), partida en dos para proyectarla. El peso de diseño es \(w_k = 1/\pi_k = N_h/n_h\).

**Transición:** el peso es el inverso de \(\pi_k\). ¿Cuánto vale en el Nordeste?

## ¿Cuánto pesa un condado del Nordeste en agstrat? {.pregunta columnas=2:3}

En `agstrat`, el Nordeste tiene \(N_h = 220\) condados y \(n_h = 21\) en la muestra.

¿Cuánto vale el peso de diseño \(w_k\) de uno de sus condados? Usa dos decimales.

::: respuesta
\(w_k = N_h/n_h = 220/21 = \) **10,48**. Los de las otras regiones también rondan 10: `agstrat` es casi **autoponderada**, y los pesos suman \(N = 3\,078\).
:::

|||

::: revelar
```r Probabilidades de inclusión y pesos {resaltar=9}
Nh <- table(agpop$region)
nh <- table(agstrat$region)
data.frame(region = names(Nh),
           Nh = as.numeric(Nh), nh = as.numeric(nh),
           pi = round(as.numeric(nh) / as.numeric(Nh), 5),
           peso = round(as.numeric(Nh) / as.numeric(nh), 5))
#>   region   Nh  nh      pi     peso
#> 1     NC 1054 103 0.09772 10.23301
#> 2     NE  220  21 0.09545 10.47619
#> 3      S 1382 135 0.09768 10.23704
#> 4      W  422  41 0.09716 10.29268
sum(agstrat$strwt)
#> [1] 3078
```
:::

???
Pregunta numérica de la autoevaluación del módulo 13 (módulo 2), con tolerancia ±0,011. Pedir la respuesta antes de revelar. Error previsible: dar \(\pi_k\) (0,095) en vez del peso. **Proyectar** el bloque, que aparece en el paso siguiente a la respuesta: los pesos son casi iguales porque `agstrat` sorteó cerca del 10 % de cada región. `strwt` es la columna de pesos que trae `agstrat.csv`; Lohr la define como 220/21, 1054/103, 1382/135 y 422/41 (3.ª ed., §3.3).

**Fuente:** bloque «Probabilidades de inclusión y pesos de agstrat», módulo 2 (verificado): peso 10,47619; suma 3 078.

**Transición:** con los pesos, el estimador es una suma ponderada.

<!-- Recorte: la primera línea del data.frame se partió en dos para que quepa. -->

## El estimador estratificado es el π-estimador agrupado por estratos

$$\hat t_{\pi} = \sum_{k \in s} \frac{y_k}{\pi_k} = \sum_{h=1}^{H} N_h\,\bar y_h \qquad\qquad \bar y_{\text{str}} = \frac{\hat t_\pi}{N} = \sum_{h=1}^{H} W_h\,\bar y_h$$

\(W_h = N_h/N\) es la fracción de la población que vive en el estrato \(h\).

La media se pondera por el tamaño **poblacional** de cada estrato, no por el muestral.

???
Fórmula del módulo 2 («El estimador estratificado es el π-estimador»). Cada unidad representa a \(N_h/n_h\) unidades de su estrato; al agrupar por estratos aparece la forma clásica.

**Transición:** ¿y su varianza? Ahí está la ganancia.

## La varianza solo paga lo que pasa dentro de cada estrato

::: flujo {.paso}
1. **Sen–Yates–Grundy** — la varianza del π-estimador suma sobre pares \((k, l)\)
2. **Estratos distintos** — \(\pi_{kl} - \pi_k\pi_l = 0\): su término desaparece
3. **Lo que queda** — \(H\) sumas independientes, la varianza de un MAS por estrato
:::

::: revelar
$$V(\bar y_{\text{str}}) = \sum_{h=1}^{H} W_h^2 \left(1 - \frac{n_h}{N_h}\right) \frac{S^2_{y,h}}{n_h}$$
:::

???
Derivación del módulo 2, pasos 1 a 3. El paso 4 se dice en voz alta al revelar la fórmula: cada estrato lleva **su propio fpc** (un estrato censado aporta varianza cero) y solo aparecen las \(S^2_{y,h}\) de **dentro**. La distancia entre las medias de los estratos no está en la fórmula: esa es la ganancia, y el módulo 7 (sesión 2) la mide.

**Transición:** una consecuencia que conviene grabar.

## Estratificar mal cuesta precisión, nunca validez {.idea}

\(E(\bar y_{\text{str}}) = \sum_h W_h\,\bar y_{U_h} = \bar y_U\), sin ninguna condición sobre cómo se construyeron los estratos. Hay una excepción: **usar los pesos equivocados**.

???
Nota «Insesgadez sin condiciones» del módulo 2. Una estratificación inútil no sesga; solo deja de ahorrar varianza.

**Transición:** la excepción, los pesos, abre el módulo 3.

# Módulo 3 · Pesos y estimación {seccion=modulo-3}

> Dos vías para la misma cifra, la fórmula a mano y `survey`. Si no coinciden, algo está mal.

???
**Minuto 31.** Pregunta de arranque: si calculan la misma media a mano y con `survey`, ¿qué tiene que pasar? (que coincidan: si no, hay un error en una de las dos).

## A mano, la media estratificada sale 295 561 acres, con ee 16 380

```r El estimador estratificado a mano {resaltar=5-6}
Wh     <- as.numeric(Nh) / N
ybar_h <- tapply(agstrat$acres92, agstrat$region, mean)
s2_h   <- tapply(agstrat$acres92, agstrat$region, var)
fh     <- as.numeric(nh) / as.numeric(Nh)
ybar_str <- sum(Wh * ybar_h)
V_str    <- sum(Wh^2 * (1 - fh) * s2_h / as.numeric(nh))
round(c(media = ybar_str, ee = sqrt(V_str)), 4)
#>     media        ee
#> 295560.77  16379.87
round(c(total = N * ybar_str, ee_total = N * sqrt(V_str)), 0)
#>     total  ee_total
#> 909736035  50417248
```

Las líneas resaltadas son las dos fórmulas del módulo 2, escritas en R.

???
**Proyectar.** El material trae el mismo cálculo en Python (pestaña del módulo 3), con la tabla de aportes \(W_h \bar y_h\) por región; aquí va el de R, que es el principal del curso.

**Fuente:** bloque «El estimador estratificado a mano», módulo 3 (verificado): media 295 560,77; ee 16 379,87; total 909 736 035; ee del total 50 417 248.

**Transición:** la misma cifra con `survey`.

## Con survey, tres argumentos definen el diseño {columnas=3:2}

```r El mismo estimador con survey {resaltar=2-3}
agstrat$Nh <- as.numeric(Nh[agstrat$region])
dis <- svydesign(id = ~1, strata = ~region, weights = ~strwt,
                 fpc = ~Nh, data = agstrat)
svymean(~acres92, dis)
#>           mean    SE
#> acres92 295561 16380
confint(svymean(~acres92, dis))
#>            2.5 %   97.5 %
#> acres92 263456.8 327664.7
svytotal(~acres92, dis)
#>             total       SE
#> acres92 909736036 50417248
```

|||

- `strata=`: dónde estaba confinado el azar
- `weights=`: los \(N_h/n_h\)
- `fpc=`: los \(N_h\), para el fpc de cada estrato

Sin `strata=`, `survey` supone una urna única y el error estándar **sale mal**.

???
**Correr en vivo**: es el patrón que se usa en el resto del curso (necesita `Nh`, del bloque de los pesos; correrlo antes en silencio). Nota «Los tres argumentos que definen el diseño» del módulo 3: si se omite `strata=`, el ee sale mal, «casi siempre más grande de lo que corresponde». El intervalo usa la normal (±1,96 ee), el convenio del material. Si alguien nota que el total termina en 6 y el de la vía a mano en 5: la columna `strwt` del CSV trae los pesos redondeados a 8 decimales (10,23300971 frente a 1054/103), así que los dos totales difieren en 0,2 acres (909 736 035,39 y 909 736 035,61) y redondean a enteros distintos.

**Fuente:** bloque «El mismo estimador con survey», módulo 3 (verificado). Este objeto `dis` se reutiliza en la sesión 2 (módulo 12).

**Transición:** ¿ayudó estratificar? Comparemos con el MAS del capítulo 2.

<!-- Recorte: solo se quitó el comentario inicial; el resto es el bloque del módulo 3, línea por línea. -->

## Con estas dos muestras, el estratificado sale con 13 % menos error estándar

| Muestra | Diseño | Media | ee |
|---|---|---|---|
| `agsrs` (capítulo 2) | MAS | 297 897 | 18 898 |
| `agstrat` (módulo 3) | Estratificado | 295 561 | 16 380 |

::: tip Interpretación
Apunta a que estratificar ayuda, pero mezcla diseño y azar: con dos muestras distintas no se pueden separar.
:::

::: warn Criterio
Son **dos muestras distintas**. Para comparar diseños se cita el deff exacto, calculado sobre la población (módulo 8, sesión 2).
:::

Recordatorio: \(\text{deff} = V(\text{diseño}) / V(\text{MAS del mismo } n)\), la Definición 2.10 del capítulo 2. Por debajo de 1, el diseño gana.

???
13 % = 1 − 16 380 / 18 898. La ganancia **exacta** del diseño, calculada sobre `agpop`, es menor: 1 − 21 123,94 / 23 293,77 = 9,3 % (deff 0,8224, módulo 4). El módulo 8 vuelve sobre estas dos cifras: su cociente al cuadrado es el deff estimado, 0,75, que no coincide con el exacto, 0,82, y explica por qué.

**Fuente:** párrafo tras el bloque «El estimador estratificado a mano» (módulo 3): «La del MAS del capítulo 2 era 297 897 con error estándar 18 898»; módulo 8 para el criterio de citar el exacto; la definición del deff, capítulo 2 (Definición 2.10) y módulo 8.

**Transición:** lo mismo vale para proporciones, porque una proporción es una media.

## Una proporción es la media de una variable 0/1

$$\hat p_{\text{str}} = \sum_{h=1}^{H} \frac{N_h}{N}\,\hat p_h \qquad \hat V(\hat p_{\text{str}}) = \sum_{h=1}^{H}\left(1 - \frac{n_h}{N_h}\right)\left(\frac{N_h}{N}\right)^{2}\frac{\hat p_h(1-\hat p_h)}{n_h - 1}$$

::: ejemplo Dato
Condados con menos de 200 000 acres: \(\hat p_{\text{str}} = 0{,}51391\) (ee 0,02479). En número: **1 581,8** condados (ee 76,318).
:::

Ojo con el denominador: \(n_h - 1\), no \(n_h\).

???
**Qué ilustra:** que una proporción no necesita teoría nueva. **De dónde sale:** módulo 3, sobre `agstrat`, con la variable 0/1 «menos de 200 000 acres». **Por qué importa:** casi todo lo que publica una encuesta es una proporción o un conteo. El \(n_h - 1\) es el que `var()` ya aplica: la varianza muestral de una 0/1 es \(\frac{n_h}{n_h-1}\hat p_h(1-\hat p_h)\). Son las ecuaciones 3.7 y 3.8 de Lohr (3.ª ed.). El total sale con decimales porque es una estimación, no un conteo.

Si hay tiempo, los grados de libertad (nota del módulo 3): un estratificado tiene \(n - H\), aquí 300 − 4 = 296, porque cada estrato gasta uno en su propia media. Con 296 gl la t y la normal casi coinciden: el intervalo de la proporción pasa de 0,46532–0,56251 (normal) a 0,46512–0,56271 (t). Con muchos estratos chicos sí importa: con 20 estratos de dos unidades hay 20 gl, \(t_{0,975} = 2{,}086\), y el intervalo sale un 6,4 % más ancho; usar la normal declararía una precisión que no se tiene. El capítulo pone el ejemplo de 150 estratos de dos unidades, pero con 150 gl el exceso es de apenas un 0,8 %. Los diseños con muchos estratos chicos son justo los que el módulo 6 recomienda (sesión 2).

**Fuente:** bloques «Proporción estratificada» y «La fórmula de la proporción, el total y los grados de libertad», módulo 3 (verificados), y la nota «Los grados de libertad de un estratificado son n − H». Los cuantiles de t (2,086 con 20 gl) y los porcentajes (6,4 % y 0,8 %) son cálculo con `qt` en R 4.4.

**Transición:** ¿y si alguien olvida los pesos? La pregunta siguiente.

## ¿Los pesos son un formalismo? {.pregunta}

Un analista recibe `agstrat`, calcula `mean(acres92)` **sin pesos** y obtiene un número muy parecido al estimador correcto. Concluye que los pesos sobran.

¿Qué le falta ver?

::: respuesta
Que `agstrat` sorteó cerca del 10 % de **cada** región: la muestra copia la composición de la población. Con un reparto que manda 107 condados al Oeste en vez de 41, el promedio bruto esperado sube unos **114 000 acres**.
:::

???
Pregunta de la autoevaluación del módulo 13 (módulo 3). El reparto de los 107 condados es el de Neyman, que llega en el módulo 4; aquí no hace falta nombrarlo. Distractores del material: «el promedio bruto siempre está sesgado» (falso: si la muestra copia exactamente la composición, coinciden en cada muestra) y «había que usar la mediana».

**Transición:** la gráfica siguiente dibuja la respuesta.

## El promedio bruto acierta con toda variable solo si la muestra copia la población {columnas=2:1}

![](recursos/cap4/m3_bruto.json){alto=420}

|||

::: tip Interpretación
`agstrat` acierta **por casualidad del diseño**, no por una propiedad del estratificado.
:::

Las barras son **valores esperados**. La línea discontinua es la media verdadera (306 677): el ponderado no se mueve de ella, sea cual sea el reparto.

???
Las dos barras del promedio bruto son **cálculos de verificación para esta diapositiva, no cifras escritas en el material**: el valor esperado del promedio bruto es \(\sum_h (n_h/n)\,\bar y_{U_h}\), con las medias por región del módulo 1. Con el reparto de `agstrat` (103/21/135/41) da 306 723; con el que manda 107 al Oeste (86/5/102/107, el de Neyman del módulo 4), 420 650, es decir, 113 973 por encima de la media verdadera (306 677). El módulo 13 dice «sube unos 114 000 acres»: cuadra. Calculado con R 4.4 sobre `agpop` el 22-oct-2026.

El simulador del módulo 3 («El promedio bruto contra el ponderado») lo muestra moviendo el reparto: abrirlo en vivo si hay tiempo.

**Transición:** de ahí la regla del módulo.

## Una muestra estratificada se analiza siempre con sus pesos {.idea}

Olvidar los pesos no da un error ni un aviso: da un número con aspecto razonable que estima **otra cosa**, la media de una población donde cada estrato pesa lo que pesó en la muestra.

???
Advertencia «La regla que no admite excepciones» del módulo 3. Es el error silencioso más común en el análisis de encuestas, y el capítulo 7 vuelve sobre él.

**Transición:** hasta aquí el reparto venía dado. ¿Quién decide cuántas entrevistas van a cada región? El módulo 4.

# Módulo 4 · Asignación de observaciones {seccion=modulo-4}

> Estratificar abre una decisión que el MAS no tenía: ¿cuántas entrevistas van a cada estrato?

???
**Minuto 49.** Pregunta de arranque: con 300 entrevistas y cuatro regiones, ¿cómo las repartirían? Anotar dos o tres propuestas en el tablero: casi siempre aparecen la proporcional y la igual.

## Cada asignación responde a una pregunta distinta

::: tarjetas {.paso}
### Proporcional · \(n_h = n\,W_h\)
Una maqueta de la población, con pesos iguales: **autoponderada**.
### Igual · \(n_h = n/H\)
El mismo tamaño de muestra en cada estrato: sirve para **comparar** estratos.
### Neyman · \(n_h \propto N_h S_{y,h}\)
La menor varianza del **agregado**: más muestra donde hay más unidades y más dispersión.
:::

???
Definición «Las tres asignaciones» del módulo 4. Ojo: el capítulo dice que la igual «reparte precisión por igual», pero reparte **tamaño**: con 75 por región, el error estándar de la media del Oeste es mucho mayor que el del Nordeste, porque su desviación es diez veces mayor. Un aparte: si lo que se pide es una precisión dada **dentro de cada** estrato (el Servicio Postal de EE. UU. pedía ±3 puntos porcentuales en cada área, Lohr 3.ª ed., Ej. 3.11), la cuenta es la del tamaño de muestra del capítulo 2 aplicada a cada estrato. Puede coincidir con la igual, pero responde a otra pregunta.

**Transición:** ¿de dónde sale la de Neyman? De minimizar la varianza.

## Neyman sale de minimizar la varianza con n fijo

$$\min_{n_1,\dots,n_H}\ \sum_h \frac{W_h^2\,S^2_{y,h}}{n_h}\quad\text{sujeto a}\quad \sum_h n_h = n \qquad\Longrightarrow\qquad n_h = n\,\frac{N_h\,S_{y,h}}{\sum_g N_g\,S_{y,g}}$$

::: revelar
::: tip Interpretación
Cuenta \(N_h S_{y,h}\): un estrato homogéneo necesita poca muestra para su tamaño; uno disperso, más de la que su tamaño sugiere.
:::
:::

???
Derivación del módulo 4 con Lagrange: el término del fpc no depende de los n_h y no juega. Con costos (módulo 5) la misma cuenta da la raíz de \(c_h\). Si hay tiempo, la expresión cerrada del módulo: la ganancia de Neyman sobre la proporcional es «la dispersión de las dispersiones», \(\frac1n\sum_h W_h(S_{y,h}-\bar S)^2\).

**Transición:** ¿qué hace esa fórmula con `agpop`?

## Neyman vacía el Nordeste y llena el Oeste

![](recursos/cap4/m4_asignaciones.json){alto=430}

::: revelar
Al Nordeste, que tiene la menor desviación, le tocan **5** entrevistas. Al Oeste, que tiene la mayor, **107**.
:::

???
Tres etapas: proporcional (gris), igual (azul), Neyman (naranja). Antes de la tercera, preguntar: «¿cuántas le tocarán al Nordeste con Neyman?». El 5 sorprende.

**Fuente:** bloque «Las tres asignaciones sobre agpop», módulo 4 (verificado): 103/21/135/41, 75×4 y 86/5/102/107.

**Transición:** ¿cuánto se gana con cada reparto? El código.

## Neyman recorta un 18 % el error estándar de la proporcional {columnas=5:3}

```r Las tres asignaciones sobre agpop {resaltar=14-16}
Sh  <- tapply(agpop$acres92, agpop$region, sd)
S2h <- tapply(agpop$acres92, agpop$region, var)
S2U <- var(agpop$acres92)
V_asig <- function(nh_)
  sum(Wh^2 * (1 - nh_ / as.numeric(Nh)) * S2h / nh_)
n_prop   <- round(300 * as.numeric(Nh) / N)
n_igual  <- rep(75, 4)
n_neyman <- round(300 * as.numeric(Nh) * Sh /
                  sum(as.numeric(Nh) * Sh))
V_mas <- (1 - 300 / N) * S2U / 300
tabla <- c(MAS = V_mas, proporcional = V_asig(n_prop),
           igual = V_asig(n_igual), Neyman = V_asig(n_neyman))
round(rbind(ee = sqrt(tabla), deff = tabla / V_mas), 4)
#>           MAS proporcional      igual    Neyman
#> ee   23293.77   21123.9376 20059.1292 17290.784
#> deff     1.00       0.8224     0.7416     0.551
```

|||

::: tip Interpretación
Aquí la igual le gana a la proporcional: **sobremuestrea el Oeste**, en la dirección de Neyman.
:::

Estos deff son **exactos**: salen de `agpop` entera.

???
**Proyectar.** 18 % = 1 − 17 291 / 21 124. Lo normal es que la proporcional le gane a la igual; aquí no, porque la proporcional ignora las \(S_{y,h}\) y los estratos son muy desiguales en dispersión. La línea que imprime los tres repartos no se proyecta: están en la gráfica anterior.

**Fuente:** bloque «Las tres asignaciones sobre agpop», módulo 4 (verificado).

**Transición:** óptima, sí; pero ¿para qué variable?

<!-- Recorte: se omitió la línea que imprime los tres repartos y se partieron en dos las líneas de V_asig y n_neyman. -->

## La asignación óptima lo es para una variable

::: ejemplo Dato
deff con `acres92`: proporcional 0,8224 · igual 0,7416 · Neyman 0,551.
:::

::: revelar
::: ejemplo Dato
deff con `farms92`, el número de granjas: proporcional 0,9723 · igual 1,1540 · Neyman de `acres92` 1,119.
:::

::: tip Interpretación
Aquí, la óptima para `acres92` deja a `farms92` **peor que un MAS**. La proporcional no es la óptima para ninguna, pero en las dos queda por debajo de 1.
:::
:::

???
**Qué ilustra:** que Neyman optimiza una sola variable. **De dónde sale:** `farms92` es otra columna de `agpop` (número de granjas en 1992), que una encuesta agrícola también preguntaría; correlaciona apenas 0,147 con `acres92`. **Por qué importa:** las encuestas son multipropósito. La proporcional no usa ninguna \(S_{y,h}\), así que no necesita saber qué se va a medir.

**Fuente:** bloque «El deff de cada asignación medido con dos variables», módulo 4 (verificado).

**Transición:** ¿hay un punto medio que sirva a las dos? Lohr sugiere uno.

## Entre la proporcional y Neyman hay asignaciones mejores para las dos variables {columnas=2:1}

![](recursos/cap4/m4_alfa.json){alto=430}

|||

::: warn Criterio
Lohr sugiere una asignación **intermedia** entre la proporcional y Neyman, o un **mínimo por estrato** y el resto proporcional.
:::

::: ejemplo Dato
Con un piso de 20 por estrato: deff 0,75 en `acres92` y 0,9491 en `farms92`.
:::

???
La familia \(n_h \propto N_h S_{y,h}^{\alpha}\) es la forma en que el material escribe la sugerencia: \(\alpha = 0\) es la proporcional y \(\alpha = 1\), Neyman. Etapas: `acres92` baja; `farms92` sube al acercarse a Neyman; en \(\alpha = 0{,}25\) las dos mejoran a la vez (0,6919 y 0,9237). El piso de 20 sirve además para que ningún estrato se quede sin poder estimar su \(s_h^2\).

**Fuente:** bloque «El deff de cada asignación medido con dos variables», módulo 4 (verificado). Lohr, 3.ª ed., §3.4.4 y Ej. 3.12: «one might want to consider an allocation that is between the proportional and Neyman […] allocations», y mezclar rasgos de varias asignaciones.

**Transición:** todo esto supone conocer las \(S_{y,h}\). ¿Y si no se conocen?

## Neyman necesita las desviaciones, y nadie las conoce

Se aproximan con un censo anterior, un piloto o una variable correlacionada (aquí serviría `acres87`).

Según el módulo 4, la varianza es **plana cerca del óptimo**: equivocarse moderadamente en las \(S_{y,h}\) cuesta poco (el ejercicio 5 lo mide).

???
Un ejemplo para contar de palabra, el conteo de caribúes (Lohr, 3.ª ed., Ej. 3.10): las desviaciones se aproximaron con el conteo previo de cada estrato. En el estrato B, de 30 unidades, Neyman pedía 4,81; se pusieron 10, porque se exigía al menos 1/3 en los estratos chicos. Planeado: 225; final: 211. **De dónde sale:** Siniff y Skoog (1964) estimaron el tamaño del rebaño Nelchina de caribúes de Alaska en febrero de 1962, con seis estratos de unidades de 4 millas cuadradas (Lohr, 3.ª ed., Ej. 3.3; Ej. 3.10 y Tabla 3.7). **Por qué importa:** muestra cómo se usa Neyman cuando las desviaciones son conjeturas: como guía, no como orden.

El ejercicio guiado 5 del módulo 13 mide cuánto cuesta usar desviaciones muestrales: dejarlo para la práctica, sin adelantar la cifra.

**Transición:** una pregunta para cerrar el módulo.

## Neyman le dio al Nordeste 5 de las 300. ¿Qué es cierto? {.pregunta}

1. Para el total nacional de `acres92`, es la mejor asignación posible con estos estratos.
2. El estimador nacional queda sesgado por abandonar así una región.
3. Una estimación separada para el Nordeste quedará pésima.
4. Si el objetivo fuera comparar regiones, convendría la asignación igual.

::: respuesta
Son ciertas la **1**, la **3** y la **4**. La 2 es falsa: el Nordeste sigue en la muestra con su peso, y el estimador sigue siendo insesgado.
:::

???
Pregunta de selección múltiple de la autoevaluación del módulo 13 (módulo 4). Con 5 observaciones apenas hay con qué estimar la varianza del Nordeste. Neyman optimiza el agregado; lo demás lo paga.

**Transición:** hasta aquí todas las entrevistas costaban lo mismo. El módulo 5 les pone precio.

# Módulo 5 · Asignación óptima con costos {seccion=modulo-5}

> El presupuesto real de una encuesta no está en entrevistas: está en dinero.

???
**Minuto 69.** Pregunta de arranque: si entrevistar en el Oeste cuesta el triple, ¿le darían un tercio de la muestra?

## El costo por entrevista entra con raíz cuadrada

$$\min \sum_h \frac{W_h^2 S^2_{y,h}}{n_h}\quad\text{sujeto a}\quad \sum_h c_h\,n_h = C \qquad\Longrightarrow\qquad n_h \;\propto\; \frac{N_h\,S_{y,h}}{\sqrt{c_h}}$$

::: tip Interpretación
Que el Oeste cueste el triple divide su muestra, **en relación con la de los demás estratos**, entre \(\sqrt{3} \approx 1{,}7\), no entre 3. Neyman es el caso en que todos los \(c_h\) son iguales.
:::

???
Fórmula del módulo 5 («Asignación óptima con costos desiguales»): la misma cuenta de Lagrange con la restricción nueva. Con el presupuesto fijo, la muestra **absoluta** del Oeste cae algo más que \(\sqrt 3\): con los costos del módulo y \(C = 3\,000\), pasar \(c_W\) de 18 a 54 la baja de 73,4 a 32,0 (factor 2,29), mientras que su cociente con el Norte-Centro cae exactamente \(\sqrt 3\) (cálculo de verificación con R; el capítulo y su autoevaluación lo dicen sin ese matiz). Advertencia del módulo: el óptimo puede pedir \(n_h > N_h\) o \(n_h < 2\); se truncan esos estratos y se reoptimiza el resto.

**Transición:** con números del módulo: un presupuesto de 3 000.

## Con 3 000 de presupuesto, el óptimo compra menos entrevistas y logra menos varianza {columnas=3:2}

```r La asignación óptima con costos {resaltar=3,12}
ch <- c(NC = 10, NE = 6, S = 8, W = 18)
C  <- 3000
crudo  <- as.numeric(Nh) * Sh / sqrt(ch)
nh_opt <- C / sum(ch * crudo) * crudo
round(rbind(nh_optimo = nh_opt, costo = ch * nh_opt), 1)
#>              NC   NE     S      W
#> nh_optimo  79.9  6.3 105.3   73.4
#> costo     798.6 37.8 842.2 1321.4
round(c(n_total = sum(nh_opt), costo_total = sum(ch * nh_opt),
        ee = sqrt(V_asig(nh_opt))), 2)
#>     n_total costo_total          ee
#>      264.85     3000.00    18916.33
```

|||

::: ejemplo Dato
Con los mismos 3 000, la proporcional compra 302,6 entrevistas y deja una varianza de 441 millones. El óptimo: 264,85 y 358 millones.
:::

::: tip Interpretación
El óptimo logra menos varianza con menos entrevistas: las compra **mejor situadas**.
:::

???
**Proyectar.** **Qué ilustra:** la asignación con costos desiguales. **De dónde sale:** los costos por entrevista (10, 6, 8 y 18) y el presupuesto de 3 000 son **supuestos ilustrativos del material** («entrevistar en el Oeste cuesta más: condados enormes y dispersos»), no datos de una encuesta real. **Por qué importa:** con costos distintos, más entrevistas no es más precisión. El Oeste pasa de 107 (Neyman) a 73: el caro se recorta, no se elimina.

**Fuente:** bloque «La asignación óptima con costos sobre agpop», módulo 5 (verificado). La proporcional con el mismo costo, del precálculo (`costos.propMismoCosto`: n = 302,64; V = 441 294 189) y del primer párrafo del módulo («compra más entrevistas y aun así se queda con más varianza»). Óptimo: V = 357 827 437.

**Transición:** ¿y de dónde salió el 300 de todo el capítulo?

## Para un 10 % de error, el MAS pide 595 condados {columnas=2:1}

```r El tamaño total que pide un margen de error dado {resaltar=12-13}
z <- qnorm(0.975)
e <- 0.10 * mean(agpop$acres92)
a_rel <- cbind(proporcional = Wh,
               igual        = rep(1 / 4, 4),
               Neyman       = Wh * Sh / sum(Wh * Sh),
               con_costos   = (Wh * Sh / sqrt(ch)) /
                              sum(Wh * Sh / sqrt(ch)))
v      <- apply(a_rel, 2, function(ah) sum(Wh^2 * S2h / ah))
n_str  <- z^2 * v / (e^2 + z^2 * sum(Wh * S2h) / N)
n_mas  <- z^2 * S2U / (e^2 + z^2 * S2U / N)
ceiling(c(MAS = n_mas, n_str))
#>          MAS proporcional        igual       Neyman   con_costos
#>          595          506          462          356          368
```

|||

Se fija el error \(e\) y se despeja \(n\) con la fórmula del capítulo 2, cambiando \(S^2\) por \(v\) en el numerador:

$$v = \sum_{h} \frac{W_h^2\, S_{y,h}^2}{a_h}$$

\(a_h = n_h/n\): \(v\) depende de **cómo** se reparte, no de **cuánto**.

???
**Proyectar.** El objetivo es el del capítulo 2: un error de como mucho el 10 % de la media de `acres92` (los 595 del MAS vienen de allí). Fórmula del módulo 5 («Tamaño total en el estratificado»), ecuaciones 3.16 a 3.18 de Lohr (3.ª ed.): \(n = z^2 v \,/\, (e^2 + z^2 \sum_h W_h S^2_{y,h}/N)\); el MAS es el caso \(H = 1\), donde \(v = S^2\). Como \(v\) no depende de \(n\), la asignación se puede elegir antes que el tamaño. La de costos (368) no se compara en entrevistas sino en dinero.

**Fuente:** bloque «El tamaño total que pide un margen de error dado», módulo 5 (verificado). Los 595 del MAS, del capítulo 2.

**Transición:** queda un truco más para bajar el tamaño: no sortear a los gigantes.

<!-- Recorte: se quitaron la línea que imprime v/S² (el deff sin fpc: 0,821, 0,749, 0,577, 0,596), la comprobación prop_ok/neyman_ok y el cálculo del tamaño para farms92 (S2h_f, e_f, n_f: 506, 214, manda 506), que usa la pregunta del final de la sección; la línea con_costos se partió en dos. -->

## A los condados gigantes no se les sortea: se censan {columnas=1:1}

::: ejemplo Dato
Los 31 condados más grandes **en `acres92`** (a propósito, para ver el mecanismo) son el **1,01 %** del marco y tienen el **9,66 %** de los acres. Sin ellos, la desviación baja de 424 687 a 309 673.
:::

Un **estrato de certeza** se censa: peso 1 y fpc 0, así que **no aporta varianza**.

|||

::: ejemplo Dato · Statistics Canada (Lohr, Ej. 3.8)
En su encuesta de empleo, nóminas y horas, unas **800 empresas** están siempre en la muestra.
:::

::: warn Criterio
El corte se hace con una variable del **marco** (`acres87`, correlación 0,9951 con `acres92`), no con la que se va a medir.
:::

???
**Qué ilustra:** los estratos de certeza (*take-all*, *certainty stratum*). **De dónde sale:** el bloque del módulo 5 ordena por `acres92` **a propósito**, para que se vea el mecanismo; es la misma trampa circular del capítulo 2 con \(S^2\). La encuesta canadiense (Lohr, 3.ª ed., Ej. 3.8) sortea unas 15 000 empresas del Business Register, estratificadas por provincia, sector y tamaño; unas 800 están siempre en la muestra. **Por qué importa:** con el mismo 10 % de error, censar a los gigantes deja el tamaño en 316 en vez de 506.

**Fuente:** bloque «Un estrato de certeza con los condados más grandes», módulo 5 (verificado: 1,01 %; 9,66 %; 424 686,68 y 309 673,43). Correlación 0,9951: módulo 6.

**Transición:** todos los tamaños, juntos en una gráfica.

## Estratificar reduce la muestra que hace falta

![](recursos/cap4/m5_tamano.json){alto=430}

::: tip Interpretación
Estratificar no solo reduce el error de una muestra dada: **reduce la muestra que hace falta** para el mismo error.
:::

???
Etapas: proporcional, igual, Neyman y, al final, el estrato de certeza de la diapositiva anterior con el resto repartido proporcionalmente. La barra de certeza se compara con la proporcional (506), que es la misma asignación sin certeza. La de costos (368) queda fuera porque se compara en dinero.

**Fuente:** bloques «El tamaño total que pide un margen de error dado» y «Un estrato de certeza con los condados más grandes», módulo 5 (verificados): 595, 506, 462, 356; certeza 31 + 285 = 316.

**Transición:** ¿y si la encuesta mide dos variables? La última pregunta.

## La encuesta mide acres92 y farms92. ¿Qué tamaño se usa? {.pregunta}

Con asignación proporcional, un error del 10 % sobre `acres92` pide **506** condados. Sobre `farms92`, **214**.

::: respuesta
**506**: el tamaño lo fija la variable más exigente, y las demás salen mejor estimadas de lo que se pidió. Lohr cierra la §3.4.5 con una regla parecida: el tamaño tiene que cubrir los requisitos de todas (o casi todas) las variables clave.
:::

???
Pregunta de la autoevaluación del módulo 13 (módulo 5). Distractores del material: 214 («cumple con menos costo»: incumple la promesa de `acres92`), el promedio 360 («repartir el incumplimiento es incumplir») y «depende de la correlación».

**Fuente:** bloque «El tamaño total que pide un margen de error dado», módulo 5 (verificado: 506 y 214, manda 506).

**Transición:** cerramos con lo que nos llevamos y la práctica.

# Módulo 13 · Práctica {seccion=modulo-13}

> Lo que nos llevamos de hoy, y cuatro ejercicios para hacer con el código del capítulo.

???
**Minuto 85.** Si el tiempo apremia, el cierre se lee en un minuto y la práctica se asigna para la casa.

## Lo que nos llevamos hoy {.cierre}

- Estratificar confina el azar **dentro** de los estratos: la varianza solo paga lo de dentro
- El estimador es el π-estimador con \(\pi_k = n_h/N_h\), y se analiza **siempre** con sus pesos
- Cada asignación responde a una pregunta: proporcional (multipropósito), igual (comparar), Neyman (el agregado)
- Con costos, \(n_h \propto N_h S_{y,h}/\sqrt{c_h}\); y el tamaño total sale del error que se pide

???
Retomar los títulos de las diapositivas de la idea, Neyman y el tamaño. La próxima sesión: definir estratos, por qué gana el estratificado (ANOVA), deff, PPT por estrato, postestratificación, ML y razón.

**Transición:** la práctica.

## Práctica: cuatro ejercicios guiados del módulo 13

::: tarjetas {columnas=2}
### Ejercicio 1
El total nacional con `agstrat` y su intervalo: ¿atrapa la verdad de `agpop`?
### Ejercicio 2
Con n = 400, Neyman contra la proporcional.
### Ejercicio 5
Neyman con las desviaciones de una muestra: ¿cuánto cuesta no conocer las \(S_{y,h}\)?
### Ejercicio 7
La encuesta del cierre navideño de Arizona State: proporciones estratificadas.
:::

Antes de la sesión 2, las tres preguntas de la autoevaluación que no hicimos en clase: las \(\pi_{kl}\) (módulo 2), qué hacer cuando Neyman perjudica a `farms92` (módulo 4) y el costo con raíz (módulo 5).

???
**Ejercicio 7, contexto:** en enero de 1995, la oficina de evaluación de Arizona State University preguntó a profesores y personal si querrían repetir el cierre de la universidad durante las vacaciones de invierno de 1994; la muestra es estratificada en cuatro tipos de empleado (`winter.csv`; Lohr, 3.ª ed., ejercicio 23 del cap. 3). Se analiza solo a quienes respondieron, con las ecuaciones 3.7 y 3.8.

Las soluciones están en el módulo 13, con el código real del capítulo: pedir que las intenten antes de abrir la pista. Las otras cinco preguntas de la autoevaluación de los módulos 1 a 5 ya se hicieron en clase.

**Aviso para el docente:** en la pregunta del módulo 4 de la autoevaluación, la opción «Calcular la Neyman de farms92 y quedarse con ella» está marcada como falsa, y con estos datos es la mejor en las dos variables (deff 0,6305 en `acres92` y 0,8992 en `farms92`). Es un error del capítulo, pendiente de corregir: avisarlo al asignar la tarea.
