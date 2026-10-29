---
modulo: ../../capitulo-5-conglomerados.html
salida: ../capitulo-5-conglomerados_sesion2.html
agenda: si
etiqueta: Capítulo 5 · Sesión 2 de 2 · Semana 11
subtitulo: Sesión 2 — dos etapas, la varianza por etapa, cuántos conglomerados, estratos × conglomerados y datos agrupados
objetivo: Diseñar y estimar una muestra en dos etapas, decidir dónde gastar con un presupuesto fijo y reconocer la correlación intraclase fuera de las encuestas.
temas: Dos etapas, Varianza por etapa, n y m óptimos, Estratos × conglomerados, Ciencia de datos
---

<!--
  Capítulo 5, sesión 2 de 2 (semana 11 del sílabo): módulos 6 a 10, para 90 min de exposición.
  La sesión 1 (semana 10) cubre los módulos 1 a 5. Mismas convenciones que la sesión 1:
  fuente visible al pie, <mark>Dato</mark>, <kbd>Lectura</kbd> y caja «Opinión del material»;
  citas a Lohr con la numeración de la 3.ª ed. (2022).

  Verificación (2026-10-22): verifica_bloques.py --prosa del cap. 5 en verde y recálculo
  independiente en R 4.4 (schools a mano, survey y E.2SI; m óptimos; lmer; la realización del M9)
  y en Python (KFold/GroupKFold) de todas las cifras que se proyectan.

  Auditoría de contenido (2026-10-22, cinco lectores independientes): errores corregidos aquí;
  mejoras, en el informe de la tarea T7.96 del PLAN. Los errores del capítulo se corrigieron en
  T7.97, y estas diapositivas los siguen (el reparto por etapa de schools, el atajo del conglomerado
  último, la tabla del módulo 9).
-->

# Muestreo en dos etapas {seccion=modulo-6}

> Censar cada conglomerado sorteado desperdicia dinero justo donde menos rinde: mejor sortear también dentro.

???
Hoy la pregunta es de diseño: si los compañeros de grupo repiten información, ¿para qué observarlos a todos?

## Lo que traemos de la sesión 1

- El conglomerado es la unidad de muestreo: se estima con sus **totales**, y la varianza vive **entre** grupos
- Ignorar los conglomerados **estrecha** el intervalo
- \(\pi\) es un **producto** de etapas: \(\pi_k = (n/N)(m_i/M_i)\)
- La ICC fija el precio: \(\text{deff} \approx 1 + (\bar{M} - 1)\rho\)
- Con tamaños desiguales, la media es una **razón** con \(M_i\) en el denominador

Las mismas tres marcas: <mark>Dato</mark>, <kbd>Lectura</kbd> y la caja «Opinión del material». La fuente, al pie.

???
Repaso de dos minutos. Si alguien no estuvo en la sesión 1, la diapositiva 4 de esa presentación explica las marcas. Todas las cifras de hoy se contrastaron con el verificador del material y con un recálculo independiente en R y Python.

## Dos etapas: se sortean escuelas y, dentro de cada una, estudiantes

::: flujo {.paso}
1. **Etapa 1** — MAS de \(n = 10\) escuelas entre \(N = 75\)
2. **Etapa 2** — MAS de \(m_i = 20\) estudiantes de los \(M_i\) de cada escuela sorteada
3. **Resultado** — 200 entrevistas, y dos fuentes de azar en vez de una
:::

**De dónde sale:** schools, Lohr 3.ª ed., ej. 5.7: datos **ficticios** con resúmenes parecidos a los de estudios educativos. Es el diseño SI-SI de Gutiérrez.

<small>Fuente: cap. 5, módulo 6; schools.csv; Lohr 3.ª ed., ej. 5.7.</small>

???
Lohr motiva la segunda etapa igual que el material: si medir a cada estudiante es caro (entrevistas en persona), conviene submuestrear.

## El estimador expande cada escuela y luego expande las escuelas

$$\hat{t} = \frac{N}{n} \sum_{i \in s} \hat{t}_i, \quad \hat{t}_i = M_i \bar{y}_i$$

$$\widehat{V}(\hat{t}) = \underbrace{N^2\left(1 - \frac{n}{N}\right)\frac{s_t^2}{n}}_{\text{sumando 1: entre los } \hat{t}_i} + \underbrace{\frac{N}{n}\sum_{i \in s} M_i^2\left(1 - \frac{m_i}{M_i}\right)\frac{s_i^2}{m_i}}_{\text{sumando 2: dentro de cada escuela}}$$

\(s_t^2\): varianza de los totales estimados; \(s_i^2\): varianza de los \(m_i\) estudiantes de la escuela \(i\). El primer sumando incluye también parte de la varianza de la segunda etapa.

<small>Fuente: cap. 5, módulo 6; Lohr 3.ª ed., ecs. (5.21), (5.27) y (5.28).</small>

???
El primer sumando es la varianza del módulo 3, como si los \(\hat{t}_i\) fueran totales exactos. El segundo paga que no lo son: cada escuela aporta la incertidumbre de estimar su total con 20 de sus estudiantes. Si \(m_i = M_i\), el segundo sumando vale 0 y se vuelve al diseño de una etapa. Lohr, ec. (5.28): como \(s_t^2\) se calcula con totales estimados, su esperanza es \(S_t^2\) más un trozo de la varianza dentro; por eso los dos sumandos no son el aporte exacto de cada etapa (diapositiva 13).

## De dónde salen los dos sumandos

::: flujo {.paso}
1. **Condicionar** — en la primera etapa: \(V(\hat{t}) = V\big(E(\hat{t} \mid s_1)\big) + E\big(V(\hat{t} \mid s_1)\big)\)
2. **Primer sumando** — dado \(s_1\), cada \(\hat{t}_i\) es insesgado para \(t_i\): queda el estimador de una etapa
3. **Segundo sumando** — la varianza de estimar cada total con un MAS dentro, expandida y promediada sobre \(s_1\)
:::

La misma lógica se apila para tres etapas o más, condicionando etapa a etapa.

<small>Fuente: cap. 5, módulo 6 (derivación); Lohr 3.ª ed., §5.3, que remite la prueba a §6.6.</small>

???
\(s_1\) es qué conglomerados salieron. Es la estructura de las encuestas de hogares reales del capítulo 7. Lohr hace la demostración en §6.6, en el marco general de probabilidades desiguales.

## El primer sumando pesa el 99,2 % de la varianza estimada {columnas=3:2}

```r Dos etapas a mano
yb_i <- tapply(schools$math, schools$schoolid, mean)
s2_i <- tapply(schools$math, schools$schoolid, var)
t_i <- Mi * yb_i
t_2e <- 75 / 10 * sum(t_i)
V_entre  <- 75^2 * (1 - 10 / 75) * var(t_i) / 10
V_dentro <- 75 / 10 * sum(Mi^2 * (1 - 20 / Mi) * s2_i / 20)
round(c(total = t_2e, ee = sqrt(V_entre + V_dentro)), 1)
#>    total       ee
#> 572116.1  51899.8
round(c(entre_pct = 100 * V_entre / (V_entre + V_dentro),
        dentro_pct = 100 * V_dentro / (V_entre + V_dentro)), 1)
#>  entre_pct dentro_pct
#>       99.2        0.8
```

|||

- <mark>Dato</mark> total de la prueba de matemáticas: **572 116**, con ee **51 900**
- <mark>Dato</mark> primer sumando, **99,2 %**; segundo, **0,8 %**
- <kbd>Lectura</kbd> no es aún el reparto por etapa: el primer sumando incluye parte de la segunda (diapositiva 13)

<small>Fuente: cap. 5, módulo 6 (bloque «Dos etapas a mano»); schools.csv; Lohr 3.ª ed., ec. (5.28).</small>

???
`Mi` y `schools` vienen del bloque del módulo 2 (sesión 1). El módulo 7 del capítulo separa las dos etapas (diapositiva 13). Preguntar antes de pasar: con ese reparto, ¿dónde pondrían el dinero de la próxima encuesta?

## Tres vías llegan al mismo total {columnas=2:1}

```r Dos etapas con survey {resaltar=3-4,7}
schools$stu <- ave(schools$math, schools$schoolid, FUN = seq_along)
schools$fpc1 <- 75
dis_sc <- svydesign(id = ~schoolid + stu, fpc = ~fpc1 + Mi,
                    data = schools)
svytotal(~math, dis_sc)
#>       total    SE
#> math 572116 51900
```

|||

| Vía | Total | ee |
|---|---|---|
| A mano | 572 116,1 | 51 899,8 |
| `survey` | 572 116 | 51 900 |
| `E.2SI` | 572 116,13 | 51 899,80 |

<mark>Dato</mark> coinciden; `survey` imprime redondeado.

<small>Fuente: cap. 5, módulo 6 (bloques «Dos etapas con survey» y «Dos etapas con E.2SI»).</small>

???
Para correrlo en vivo: `library(survey)` (módulo 1) y `schools`, `Mi` del módulo 2. `id = ~schoolid + stu` dice «primero escuelas, luego estudiantes»; `fpc = ~fpc1 + Mi`, el tamaño del sorteo en cada etapa. `E.2SI` es la función de Gutiérrez en TeachingSampling: `E.2SI(75, 10, as.numeric(Mi), 20, schools$math, as.factor(schools$schoolid))`. Su columna DEFF (13,69) el material no la comenta. Tener tres vías sirve para encontrar una mal declarada.

## La media necesita un dato que no se tiene

\(\hat{t}\) estima el total sin pedir nada nuevo. La media por estudiante exige dividir entre \(K = \sum M_i\), y solo se conocen los \(M_i\) de las escuelas sorteadas.

- `svymean` la estima como la razón \(\hat{t}/\widehat{K}\)
- <mark>Dato</mark> media **33,12**, ee **1,66**: los mismos de Lohr con la varianza sin reemplazo
- <kbd>Lectura</kbd> la media de dos etapas es un estimador de razón, con todas las consecuencias del capítulo 3

<small>Fuente: cap. 5, módulo 6 (advertencia «La media necesita otro dato»); Lohr 3.ª ed., ej. 5.7.</small>

???
Lohr muestra también el ee «con reemplazo», 1,76, que es el que dan por defecto la mayoría de los programas: solo el primer sumando y sin fpc. Con 10 de 75 escuelas, la diferencia es pequeña. Lohr usa además una \(t\) con 9 grados de libertad para el intervalo: [29,4; 36,9].

## ¿Qué le pasa a la π de un estudiante si su escuela es el doble de grande? {.pregunta}

Diseño MAS-MAS con \(n\), \(N\) y \(m\) fijos.

- Su π no cambia: la primera etapa no mira tamaños
- Su π baja a la mitad y su peso sube al doble
- Su π sube: las escuelas grandes aportan más estudiantes

::: respuesta
Baja a la mitad: \(\pi_k = (n/N)(m/M_i)\), y hay el doble de compañeros entre quienes repartir las \(m\) plazas. Si en la primera etapa las escuelas grandes salieran con más probabilidad, los dos efectos se cancelarían: es la idea del PPT, el capítulo 6.
:::

<small>Fuente: cap. 5, módulo 11, pregunta 7 de la autoevaluación (tres de sus cuatro opciones; allí salen barajadas).</small>

???
La tercera opción es la intuición equivocada más común: las grandes aportan los mismos 20 estudiantes que las chicas. La cuarta opción del material («depende de K») también es falsa: \(K\) ni se conoce ni hace falta.

# La varianza, etapa por etapa {seccion=modulo-7}

> Saber qué piso de la varianza pesa más no es contabilidad: decide dónde gastar.

## Separadas sin sesgo, la etapa 1 pone ≈ 94 % y la etapa 2 ≈ 6 %

![Varianza estimada del total de matemáticas en schools: primero los dos sumandos del estimador; después, el aporte de cada etapa](recursos/cap5/varianza_etapas_schools.json){alto=340}

<kbd>Lectura</kbd> manda la primera etapa, pero la segunda pesa unas siete veces más de lo que decía el 0,8 %.

<small>Fuente: cap. 5, módulos 6 y 7 (bloque «Dos etapas a mano» y el de Python del módulo 7: 99,2 / 0,8 % y 93,9 / 6,1 %); Lohr 3.ª ed., ec. (5.28).</small>

???
Dos pasos. Primero, los dos sumandos del estimador (99,2 % y 0,8 %). Después, el aporte de cada etapa estimado sin sesgo, como lo hace el bloque de Python del módulo 7: la etapa 2 vale \(N/n\) veces el segundo sumando y la etapa 1 se queda con el resto. Sale 93,9 % y 6,1 %, con el mismo total y el mismo ee de 51 900. Lohr lo dice así: el primer término estima la varianza de la etapa 1 «más parte de la segunda» (ec. 5.28). El capítulo leía antes el 99,2 % como el aporte de la etapa 1; se corrigió el 22 de octubre.

## ¿Qué conviene con presupuesto para 200 entrevistas más? {.pregunta}

En schools, la primera etapa pone casi toda la varianza.

- Subir de 20 a 40 estudiantes por escuela
- Sortear más escuelas, aunque haya menos estudiantes en cada una
- Censar las 10 escuelas sorteadas
- Da igual: con el mismo total de entrevistas, la varianza es la misma

::: respuesta
Sortear más escuelas: la varianza vive sobre todo entre escuelas, y solo aumentar \(n\) la ataca. Subir \(m\) o censar solo atacan la parte de la etapa 2, ≈ 6 %. Y el módulo 1 ya enterró «da igual»: mismo \(n\), deff 30.
:::

<small>Fuente: cap. 5, módulo 11, pregunta 8 de la autoevaluación (allí las opciones salen barajadas).</small>

???
El enunciado del material es ambiguo: 200 entrevistas más no pagan desplazamientos nuevos; léelo como «con el mismo presupuesto total». El material la llama «la regla práctica más citada del muestreo multietapa»: conglomerados, cuantos más mejor; dentro de cada uno, lo justo. Es una opinión del material, bien fundada, no un teorema.

## Tres lecciones de diseño salen de ese desequilibrio

::: tarjetas {.paso}
### Más conglomerados
Si manda la etapa 1, duplicar \(m\) apenas mueve la varianza; duplicar \(n\) la parte en dos, o más.
### El atajo cambia poco
Estimar como si hubiera una sola etapa (el «conglomerado último») apenas mueve el error estándar cuando manda la etapa 1.
### Censar no compensa
Pasar de 20 estudiantes a toda la escuela solo ataca la varianza de la etapa 2: ≈ 6 % del total, y multiplica las entrevistas por 11,5.
:::

::: warn Opinión del material
Es el patrón general de las encuestas multietapa, no una rareza de estos datos.
:::

<small>Fuente: cap. 5, módulo 7; Lohr 3.ª ed., §5.3 («Simplified variance estimation»).</small>

???
Lohr §5.3 respalda la segunda lección: cuando \(N\) es grande el segundo término suele ser despreciable, y la mayoría de los programas usa solo el primero, sin fpc. El módulo 6 lo calcula al final del bloque de survey: 51 690 con fpc (un poco menos que las dos etapas) y 55 524 sin fpc (un 7 % más). La primera lección viene del deff del módulo 4, que crece con el tamaño del conglomerado; el módulo 8 le pone precios. En schools, pasar a m = 40 recorta un 3,3 % de la varianza y censar las escuelas, un 6,1 % (módulo 7); duplicar n multiplica el primer sumando por 0,42 con su fpc (cálculo propio). Censar multiplica las entrevistas por 11,5: las 10 escuelas suman 2 303 estudiantes.

# Cuántos y de qué tamaño {seccion=modulo-8}

> El dinero decide cuántos conglomerados; la ICC y los costos, cuánto excavar en cada uno.

## Con costo por conglomerado y por unidad, el m óptimo tiene fórmula

Presupuesto: \(C = c_1 n + c_2 n m\), con \(c_1\) por conglomerado (desplazamiento, permiso) y \(c_2\) por unidad.

$$m_{\text{opt}} = \sqrt{\frac{c_1}{c_2}\cdot\frac{1-\rho}{\rho}} \qquad\qquad n_{\text{opt}} = \frac{C}{c_1 + c_2\, m_{\text{opt}}}$$

- \(m_{\text{opt}}\) **no depende del presupuesto**: el dinero decide cuántos conglomerados
- Si llegar es caro, quédate más; si los vecinos se repiten, vete antes

<small>Fuente: cap. 5, módulo 8; Lohr 3.ª ed., ecs. (5.35) y (5.36), en su versión para poblaciones grandes.</small>

???
Lohr da la fórmula exacta con el factor \(M(N-1)/(NM-1)\), que en poblaciones grandes vale casi 1; la del material es esa aproximación, que Lohr también escribe. Lohr insiste en graficar la varianza proyectada en lugar de quedarse con un solo número: es lo que hace la diapositiva animada que viene.

## ¿Cuál es el m óptimo con c₁ = 50, c₂ = 2 y ρ = 0,5? {.pregunta}

Un número entero.

::: respuesta 5
\(m^* = \sqrt{\dfrac{50}{2}\cdot\dfrac{1 - 0{,}5}{0{,}5}} = \sqrt{25} = 5\). Con ICC alta, comprar más vecinos es comprar la misma información dos veces.
:::

<small>Fuente: cap. 5, módulo 11, pregunta 9 de la autoevaluación (respuesta 5 ± 0,3); la diapositiva siguiente lo confirma en su última línea.</small>

???
Pedirla de cabeza: con ρ = 0,5 el segundo factor vale 1, y queda la raíz de 25.

## Con c₁/c₂ = 25 y la ICC de BigLucy, unas 10 empresas por zona {columnas=2:1}

```r El m óptimo con la ICC de BigLucy
icc_z <- 0.2166
c1 <- 50; c2 <- 2
m_opt <- sqrt(c1 * (1 - icc_z) / (c2 * icc_z))
n_opt <- 5000 / (c1 + c2 * m_opt)    # presupuesto C = 5000
round(c(m_opt = m_opt, n_opt = n_opt, unidades = m_opt * n_opt), 1)
#>    m_opt    n_opt unidades
#>      9.5     72.4    688.9
round(sqrt(c1 * (1 - c(0.05, 0.2, 0.5, 0.8)) /
           (c2 * c(0.05, 0.2, 0.5, 0.8))), 1)
#> [1] 21.8 10.0  5.0  2.5
```

|||

- **De dónde sale:** BigLucy (TeachingSampling, de Gutiérrez): 85 296 empresas en 100 zonas; ICC del ingreso por zona, 0,2166. Los costos son valores elegidos por el material
- <mark>Dato</mark> \(m_{\text{opt}} = 9{,}5\), \(n_{\text{opt}} = 72{,}4\); con ρ de 0,05 a 0,8, \(m_{\text{opt}}\) cae de 21,8 a 2,5

<small>Fuente: cap. 5, módulo 8 (bloque «El m óptimo con la ICC de BigLucy»); precálculo cap5_datos.json (ICC de las zonas).</small>

???
Los costos \(c_1 = 50\) y \(c_2 = 2\) y el presupuesto de 5 000 son valores elegidos por el material para el ejemplo, no costos medidos. La última línea se partió en dos para que quepa. De dónde sale la ICC antes de muestrear: de un piloto, de una encuesta anterior o de la literatura del sector (módulo 8); Lohr, en el ej. 5.12, propone 0,23 para planear una encuesta como schools.

## Cerca del óptimo la curva es plana; lejos, castiga

![Varianza extra frente al óptimo según m, con c₁/c₂ = 25 y ρ = 0,2166 (los costos del ejercicio guiado 4: c₁ = 100, c₂ = 4)](recursos/cap5/presupuesto_m_optimo.json){alto=380}

<kbd>Lectura</kbd> equivocarse por poco sale gratis; enamorarse de conglomerados grandes, no.

<small>Fuente: cap. 5, módulo 8 y ejercicio guiado 4 del módulo 11 (m* = 9,5; n* = 58; +10,0 % y +48,8 %). La curva es la fórmula del ejercicio, V proporcional a (1 + (m − 1)ρ)/(nm), evaluada punto a punto.</small>

???
Cuatro pasos: la curva, el óptimo (m* = 9,5, con n* = 58 conglomerados), doblar \(m\) (+10 %) y \(m = 40\) (+48,8 %). Con los costos del ejercicio 4 (\(c_1 = 100\), \(c_2 = 4\), \(C = 8\,000\)) la proporción \(c_1/c_2\) es la misma que en el ejemplo anterior, por eso \(m^*\) vuelve a ser 9,5; \(n^*\) baja a 58. La curva en porcentaje no depende de \(C\). El simulador del módulo 8 deja mover los costos y el presupuesto en vivo.

# Estratos × conglomerados {seccion=modulo-9}

> Estratos y conglomerados no compiten: se apilan.

## Región como estrato, estado como conglomerado {columnas=3:2}

```r Región como estrato, estado como conglomerado
set.seed(2026)
regiones <- c("NC", "NE", "S", "W")
Wh <- as.numeric(table(agpop$region)[regiones]) / nrow(agpop)
medias_h <- numeric(4); n_total <- 0
for (h in 1:4) {
  candidatos <- unique(agpop$state[agpop$region == regiones[h]])
  elegidos <- sample(candidatos, 2)
  filas <- agpop$state %in% elegidos
  medias_h[h] <- mean(agpop$acres92[filas])
  n_total <- n_total + sum(filas)
}
round(c(estimacion = sum(Wh * medias_h), condados = n_total), 1)
#> estimacion   condados
#>   332542.6      495.0
```

|||

- Dos estados por región, con todos sus condados; las regiones pesan \(W_h\), como en el capítulo 4
- <mark>Dato</mark> una realización: 8 estados, **495** condados, estimación **332 542,6** acres

<small>Fuente: cap. 5, módulo 9 (bloque «Región como estrato, estado como conglomerado»); agpop.csv.</small>

???
`agpop` viene del bloque del módulo 1 (sesión 1, diapositiva 8). Es una sola muestra, con semilla fija: no dice nada de la precisión. Para eso el precálculo repitió el sorteo 5 000 veces (diapositiva siguiente). Las regiones tienen 12, 10, 15 y 13 estados. Recordar que `acres92` trae 19 condados con el código −99 de faltante, que el curso usa tal cual desde el capítulo 2.

## Repartir los 8 estados entre regiones baja el error estándar de 96 343 a 83 096 acres

![Error estándar de la media de acres92 con cuatro diseños sobre agpop](recursos/cap5/tres_disenos_agpop.json){alto=300}

<mark>Dato</mark> condados por muestra, en promedio: 369, 371, 492 y 467; estados visitados: 46, 6, 8 y 8.

<kbd>Lectura</kbd> frente a los mismos 8 estados sin estratos, los estratos recortan una cuarta parte de la varianza; frente a los 6 estados la bajada parece mayor, pero ahí cambia también el tamaño.

<small>Fuente: cap. 5, módulos 1 y 9 (tabla «Ocho estados de cualquier punta u ocho repartidos»); precálculo cap5_datos.json, 10 000 réplicas (5 000 las de 8 estados).</small>

???
Cuatro pasos: el MAS, los 6 estados enteros, 8 estados sin estratos y 8 con estratos. La comparación justa del efecto del estrato es la tercera barra contra la cuarta, con los mismos 8 estados: los estratos recortan una cuarta parte de la varianza. El deff de cada barra se calcula contra un MAS del mismo número esperado de condados. El capítulo corrigió esta tabla el 22 de octubre: antes comparaba solo con 6 estados, ponía 50 estados para el MAS (son 46 en promedio) y un deff de 16 calculado contra un MAS de 369 condados.

## Sobre el diseño combinado, ¿qué es cierto? {.pregunta}

Región = estrato, estado = UPM. Marca todo lo que sea cierto:

1. Los estratos impiden que el azar concentre los 8 estados en una sola región
2. Su varianza quedó en cerca de la mitad de la del conglomerado puro
3. El diseño combinado elimina el efecto de conglomerado por completo
4. Hacen falta al menos 2 UPM por estrato para estimar la varianza

::: respuesta 1, 2 y 4
La 3 es falsa: el error estándar del combinado sigue siendo unas cuatro veces el del MAS (83 096 frente a 20 602). La 2 es cierta en cifras, pero no todo es mérito de los estratos: el combinado sortea 8 estados y no 6.
:::

<small>Fuente: cap. 5, módulo 11, pregunta 10 de la autoevaluación (numeradas aquí; allí salen barajadas).</small>

???
Si alguien marca la 3, volver a la diapositiva animada: la barra del combinado sigue cuatro veces por encima de la del MAS.

## Juntar el azar cuesta; confinarlo con estratos lo abarata {columnas=1:1}

<kbd>Lectura</kbd> el deff venía de la varianza **entre** conglomerados; los estratos le quitan su parte entre regiones (capítulo 4, módulo 7).

::: warn Opinión del material
Un deff de 21 sigue siendo caro, pero el diseño ya es operable: 8 estados por visitar en vez de casi todos.
:::

|||

::: warn Al menos 2 UPM por estrato
Con una sola UPM sorteada en un estrato no hay con qué estimar su varianza. Para ese caso existe la opción `survey.lonely.psu`; el capítulo 7 la encontrará en encuestas reales.
:::

<small>Fuente: cap. 5, módulo 9 (notas «Por qué funciona» y «El requisito técnico»).</small>

???
Son los dos teoremas del curso trabajando en serie: el conglomerado paga por juntar el azar, el estrato cobra por confinarlo. El material fija `survey.lonely.psu` en la cabecera de sus cadenas de código, que no se publica.

# Datos agrupados en ciencia de datos {seccion=modulo-10}

> Sesiones de un usuario, pacientes de un hospital, fotogramas de un video: conglomerados con otro nombre.

## Un minibatch de un solo grupo informa como uno mucho más chico

::: definicion El minibatch como conglomerado
Si un minibatch de tamaño \(m\) se arma con ejemplos del mismo grupo, la varianza del gradiente promedio no es \(\sigma^2/m\) sino
$$V(\bar{g}) = \frac{\sigma^2}{m}\,\big(1 + (m-1)\rho\big)$$
:::

::: ejemplo Ejemplo ilustrativo del material (valores elegidos, no medidos)
Con \(\rho = 0{,}2\) y \(m = 64\), el minibatch «de 64» informa como uno de 5 (64/13,6 = 4,7).
:::

<small>Fuente: cap. 5, módulo 10 (definición y simulador «El minibatch correlacionado»).</small>

???
Es la fórmula de Kish del módulo 4 con otro disfraz. Por eso los cargadores de datos barajan globalmente, y por eso muestrear *shards* enteros sale caro en pasos de entrenamiento (lectura del material).

## Un equipo reporta métricas excelentes con validación cruzada corriente {.pregunta}

Los datos vienen de 12 aulas y se evaluó con KFold corriente, que reparte las filas sin mirar el aula. ¿Qué puede estar pasando?

- Nada: la validación cruzada es válida con cualquier partición aleatoria
- Hay fuga por conglomerado: el modelo entrena con compañeros de aula de los estudiantes de prueba
- Habría que estratificar los pliegues por aula, como en el capítulo 4

::: respuesta
La fuga por conglomerado: con ICC positiva infla las métricas. La partición correcta es por grupos (GroupKFold). Estratificar por aula haría lo contrario: repartiría cada aula entre pliegues.
:::

<small>Fuente: cap. 5, módulo 11, pregunta 11 de la autoevaluación (tres de sus cuatro opciones; allí salen barajadas).</small>

???
Es el análogo de estimar varianzas ignorando el diseño: números optimistas con aspecto impecable.

## Los pliegues tienen que respetar los grupos

```python GroupKFold contra KFold sobre las aulas de algebra {resaltar=6-7,12-13}
from sklearn.model_selection import KFold, GroupKFold
X = algebra[["Mi"]]; grupos = algebra["class"]
def clases_partidas(cv):
    partidas = 0
    for entren, prueba in cv.split(X, groups=grupos):
        partidas += len(set(grupos.iloc[prueba])
                        & set(grupos.iloc[entren]))
    return partidas
kf = KFold(n_splits=4, shuffle=True, random_state=2026)
print(f"  KFold corriente: {clases_partidas(kf)} (de 12 clases x 4 pliegues)")
print(f"  GroupKFold:      {clases_partidas(GroupKFold(n_splits=4))}")
#>   KFold corriente: 48 (de 12 clases x 4 pliegues)
#>   GroupKFold:      0
```

<mark>Dato</mark> KFold parte **las 12 aulas en los 4 pliegues**; GroupKFold, ninguna. <kbd>Lectura</kbd> con ICC positiva, se esperan métricas optimistas.

<small>Fuente: cap. 5, módulo 10 (bloque «GroupKFold contra KFold»).</small>

???
Recortado: se quitaron los comentarios y la línea que imprime el encabezado; una línea larga se partió dentro del paréntesis. Ejecutado de nuevo con scikit-learn 1.7: 48 y 0. **Para correrlo en vivo** hace falta antes la pestaña Python del módulo 4 (`import pandas as pd` y `algebra = pd.read_csv("CSV data sets for SDA 3e/algebra.csv")`); y scikit-learn avisa «The groups parameter is ignored by KFold», que es inofensivo: KFold no mira los grupos, que es justo el problema. GroupKFold es el muestreo por conglomerados aplicado a la evaluación: los grupos viajan enteros a un lado o al otro.

## La ICC del ANOVA y la del modelo mixto responden preguntas distintas {columnas=3:2}

```r La ICC como modelo mixto con lme4
suppressWarnings(suppressMessages(library(lme4)))
m <- lmer(score ~ (1 | class), data = algebra, REML = TRUE)
vc <- as.data.frame(VarCorr(m))[, c("grp", "vcov")]
vc$vcov <- round(vc$vcov, 2)
vc
#>        grp   vcov
#> 1    class  13.51
#> 2 Residual 303.68
round(vc$vcov[1] / sum(vc$vcov), 4)
#> [1] 0.0426
```

|||

- <mark>Dato</mark> `lmer`: **0,0426**; \(R_a^2\) del módulo 4: **0,0396**
- <kbd>Lectura</kbd> \(R_a^2\) estima la estructura de grupo de la población finita de aulas; `lmer`, un parámetro de un modelo de superpoblación

<small>Fuente: cap. 5, módulo 10 (bloque «La ICC como modelo mixto con lme4»); Lohr 3.ª ed., §5.6 y ej. 5.14.</small>

???
`algebra` viene del bloque del módulo 4 (sesión 1). Lohr §5.6 hace lo mismo con schools (ej. 5.14): el modelo mixto da ρ = 0,25 y un ee basado en el modelo distinto del de diseño, porque estiman variabilidades distintas. Es la distinción diseño/modelo que el material marca desde el capítulo 3. La \(R_a^2\) puede salir negativa; la de `lmer`, no. Ojo con la cifra: la distancia 0,0396 frente a 0,0426 sale sobre todo del estimador de \(S^2\); con el \(\hat{S}^2\) de Lohr, \(R_a^2 = 0{,}0427\) (cálculo de la auditoría). La distinción diseño/modelo es conceptual; aquí no explica la diferencia numérica.

# Cierre del capítulo {seccion=modulo-11}

## Lo que te llevas del capítulo 5 {.cierre}

- En dos etapas, π es un producto y la varianza tiene **dos pisos**: casi siempre manda el de **entre**
- Con presupuesto fijo: **más conglomerados** y, dentro de cada uno, lo justo (\(m_{\text{opt}}\) solo depende de la ICC y de \(c_1/c_2\))
- Estratificar las UPM recorta la varianza, pero no devuelve el deff a 1, y pide **2 UPM por estrato**
- La ICC vive fuera de las encuestas: minibatches, validación cruzada y modelos mixtos

???
Volver al gancho de la sesión 1: los 6 estados enteros con deff 30 eran el peor caso. Hoy vimos las tres armas para domarlo: submuestrear, repartir el presupuesto y estratificar. Falta la cuarta, el capítulo 6.

## Para cerrar el capítulo

::: flujo
1. **Autoevaluación** — las once preguntas del módulo 11
2. **Ejercicio guiado 3** — el total de lectura por las tres vías
3. **Ejercicio guiado 4** — la curva de hoy, en R: comprueba \(n^* = 58\) y el +48,8 % de \(m = 40\)
4. **Hacia el capítulo 6** — conglomerados con probabilidad proporcional a su tamaño (PPT)
:::

<small>Fuente: cap. 5, módulo 11 (autoevaluación, ejercicios guiados y nota «Hacia el capítulo 6»).</small>

???
El ejercicio 3 da 528 609,8 con ee 53 350,7 por las tres vías. El ejercicio 4 es el de la curva animada: \(m^* = 9{,}5\), \(n^* = 58\), y \(m = 40\) cuesta un 49 %. El capítulo 6 parte de la pregunta de la sesión 1: un estado con 254 condados no debería pesar en el sorteo lo mismo que uno con 3.
