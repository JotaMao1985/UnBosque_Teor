---
modulo: ../../capitulo-4-muestreo-estratificado.html
salida: ../capitulo-4-muestreo-estratificado_sesion2.html
agenda: si
etiqueta: Sesión 2 de 2 · 90 min
subtitulo: Sesión 2 · Definir estratos, medir la ganancia y corregir después del sorteo (módulos 6 a 12)
objetivo: Elegir con qué variable y en cuántos estratos partir, explicar con el ANOVA de dónde sale la ganancia, medirla con el deff, y usar el PPT por estrato, la postestratificación y la razón en el estratificado.
temas: Definición de estratos, ANOVA, deff, STPPS, Postestratificación, Machine learning, Razón combinada y separada
---

<!--
  Capítulo 4 · Sesión 2 de 2 (90 min de exposición): módulos 6 a 12.
  La sesión 1 (cap4_sesion1.md) cubre los módulos 1 a 5. El código R continúa la sesión
  del capítulo: usa objetos definidos en los módulos 1 a 5: N, Nh, V_str, V_mas, dis y agpop
  (y corta4, del módulo 6, que no se proyecta). El bloque Python usa agpop y np del
  bloque Python del módulo 3.
  Convención de rótulos: ::: ejemplo Dato · ::: tip Interpretación · ::: warn Criterio (la leyenda
  está en la sesión 1).
  Verificación (2026-10-22): precalculo/verifica_bloques.py --prosa sobre el capítulo 4 dio 528/528
  cifras de código y 249/249 de prosa respaldadas por la salida real de R 4.4 y Python, el precálculo
  o la revisión manual registrada en precalculo/cifras_prosa.json. Las cifras propias de las
  diapositivas se calcularon aparte con R 4.4 y se citan en la nota de cada una. Lohr, Sampling,
  3.ª ed. (2022). Auditoría con cinco lectores el 2026-10-22; sus mejoras se aplicaron el mismo día.
  Código: en todos los bloques se quitaron los comentarios del capítulo; los demás recortes se declaran
  en un comentario como este junto a su diapositiva. Cada nota de código dice «Proyectar» (mostrar sin
  correr) o «Correr en vivo» (en la consola del docente, con la cadena del capítulo cargada).
  Minutos previstos: módulo 6 en el 2 · módulo 7 en el 16 · módulo 8 en el 30 · módulo 9 en el 39 ·
  módulo 10 en el 50 · módulo 11 en el 67 · módulo 12 en el 74 · práctica en el 85.
-->

# Módulo 6 · Definición de estratos {seccion=modulo-6}

> La región no era la única opción: cualquier columna del marco puede partir la población. ¿Cuál conviene, y en cuántos estratos?

???
**Minuto 2.** Recordar de la sesión 1: la varianza del estratificado solo paga lo de dentro de los estratos. Pregunta de arranque: si pudieran partir `agpop` con cualquier columna del marco, ¿cuál elegirían para estimar `acres92`? Los rótulos Dato, Interpretación y Criterio son los de la sesión 1; lo que no lleva rótulo es teoría o dato.

## Partir agpop de cuatro maneras lleva el deff de 0,54 a 1,00

```r Cuatro maneras de partir agpop {resaltar=16}
V_con <- function(f) {
  Nh_ <- tapply(agpop$acres92, f, length)
  S2_ <- tapply(agpop$acres92, f, var)
  nh_ <- 300 * Nh_ / N
  sum((Nh_ / N)^2 * (1 - nh_ / Nh_) * S2_ / nh_)
}
set.seed(2026)
azar <- sample(rep(1:4, length.out = N))
opciones <- c(region = V_con(agpop$region),
  cuartiles_acres87 = V_con(corta4(agpop$acres87)),
  cuartiles_farms92 = V_con(corta4(agpop$farms92)),
  al_azar           = V_con(azar))
round(rbind(ee = sqrt(opciones), deff = opciones / V_mas), 4)
#>          region cuartiles_acres87 cuartiles_farms92    al_azar
#> ee   21109.0721        17111.7990        23144.7268 23304.8326
#> deff     0.8212            0.5396            0.9872     1.0009
```

???
**Proyectar.** Las cuatro particiones, con la misma asignación proporcional de 300. `acres87` son los acres del censo de 1987. Como `agpop` está entera, cada deff es **exacto**: no se estima nada. El bloque completo del módulo 6 trae además la función `corta4`, que parte una variable en cuartiles, y las correlaciones de la diapositiva siguiente.

**Fuente:** bloque «Cuatro maneras de partir agpop en cuatro estratos», módulo 6 (verificado).

**Transición:** ¿por qué los cuartiles de `farms92` no ganan nada?

<!-- Recorte: se omitieron la función corta4 (al principio del bloque), los comentarios y las dos líneas finales que calculan las correlaciones (0,9951 y 0,1470); la llamada opciones <- c(…) se reacomodó en menos líneas. Usa N y V_mas de la sesión 1 (módulo 4). -->

## ¿Por qué los cuartiles de farms92 no ganan nada? {.pregunta}

Estratificar `agpop` por cuartiles de `farms92` (el número de granjas) dio deff **0,99** al estimar la media de `acres92`.

1. Cuatro estratos son pocos.
2. Los cuartiles dejan estratos de igual tamaño.
3. El número de granjas casi no se relaciona con la superficie: los cuartiles apenas separan los acres.
4. `farms92` tiene códigos −99.

::: respuesta
La **3**: la partición explica solo el 1,37 % de la variabilidad de `acres92` (el módulo 7 lo llamará SSB/SST). Los cuartiles de `acres87` también son de igual tamaño, y dan 0,54.
:::

???
Pregunta de la autoevaluación del módulo 13 (módulo 6), con las opciones reordenadas. Las medias de `acres92` por cuartil (226 181, 316 004, 323 880 y 361 340) no coinciden: lo pequeño es lo que separan frente a la dispersión de dentro. La opción 4 es falsa de todos modos: `farms92` no tiene ningún −99 (su mínimo es 0), aunque la retroalimentación del capítulo lo insinúa. Matiz del material: esa misma partición es la mejor de las cuatro si lo que se estima es el número de granjas (lo muestra «Con farms92 como vara…», tres diapositivas más adelante).

**Transición:** las cuatro particiones, en una gráfica.

## Cortar por acres87 rinde más que por región; por farms92, casi nada {columnas=2:1}

![](recursos/cap4/m6_particiones.json){alto=430}

|||

::: ejemplo Dato
Correlación con `acres92`: `acres87` 0,9951; `farms92` 0,1470.
:::

::: tip Interpretación
Estratificar rinde lo que la **partición** explica de \(y\). Con los cuartiles de `acres87`, el ahorro de varianza sube del 18 % al 46 %.
:::

???
Etapas: al azar (1,0009: pierde un pelo, el módulo 7 explica por qué), `farms92` (0,9872), región (0,8212) y cuartiles de `acres87` (0,5396). La región no es la óptima en varianza, pero trae garantías por subgrupo y logística: los estratos también se eligen por lo que hay que publicar.

**Fuente:** bloque «Cuatro maneras de partir agpop en cuatro estratos», módulo 6 (verificado); los deff coinciden con `constructor.opciones` del precálculo.

**Transición:** con la mejor variable, ¿cuántos estratos?

## Con acres87, cada estrato de más sigue ganando, aunque cada vez menos {columnas=2:1}

![](recursos/cap4/m6_barrido.json){alto=430}

|||

::: ejemplo Dato
De \(H = 6\) a \(H = 10\), el deff baja de 0,448 a 0,341.
:::

::: warn Criterio
Lohr: cuanta más información tenga el marco, **más estratos**. Muchas encuestas estratifican hasta dejar solo dos unidades por estrato.
:::

???
Una sola etapa: la curva con su flecha. La ganancia no se apaga porque `acres87` predice `acres92` casi a la perfección: cada corte más fino separa condados de superficies de verdad distintas. Con una variable que predijera peor, la curva se aplanaría antes. Dos unidades por estrato es el mínimo para estimar su varianza, y con muchos estratos chicos importan los grados de libertad (lo dijimos en la sesión 1, en el módulo 3). 0,341 / 0,448 = 0,76: casi un cuarto menos de varianza.

**Fuente:** precálculo `constructor.barridoH` (deff exactos para H = 2 a 10), que alimenta el simulador «El constructor de estratos» del módulo 6; 0,448 y 0,341 citados en el módulo. Lohr, 3.ª ed., §3.5: «The more information you have, the more strata you should use» y «many surveys are stratified to the point that only two sampling units are observed in each stratum».

**Transición:** hasta aquí medimos con `acres92`. ¿Y si la vara es otra variable?

## Con farms92 como vara, la mejor partición pasa a ser la de farms92

::: ejemplo Dato
deff al medir `acres92`: región 0,8212 · cuartiles de `acres87` 0,5396 · cuartiles de `farms92` 0,9872 · azar 1,0009.
:::

::: revelar
::: ejemplo Dato
deff al medir `farms92`: región 0,9713 · cuartiles de `acres87` 0,7925 · cuartiles de `farms92` **0,3240** · azar 0,9997.
:::

::: tip Interpretación
Cada partición gana con la variable que más se le parece, y los estratos se construyen **una vez para toda la encuesta**.
:::

::: warn Criterio
Estratificar con el **censo anterior**, que trae las dos variables: `acres87` predice `acres92` (0,9951) y `farms87` predice `farms92` (0,9944). Aquí, los cuartiles de `acres87` aguantan las dos varas.
:::
:::

???
`acres87` es la que aguanta las dos varas (0,5396 y 0,7925).

**Fuente:** bloque «Las cuatro particiones medidas con dos variables», módulo 6 (verificado).

**Transición:** y si un condado quedó en el estrato equivocado, ¿se cae todo?

## Clasificar mal no invalida nada {.idea}

Si un condado cae en el estrato equivocado, las estimaciones siguen siendo válidas: sus propiedades dependen solo de la estratificación que se usó. Se pierde precisión, no validez.

???
Nota del módulo 6 y Lohr, 3.ª ed., §3.5: «the misclassification does not affect the validity of estimates from the survey, whose properties depend only on the stratification that was used». Es pariente de la idea de la sesión 1: estratificar mal cuesta precisión, nunca validez.

Si sobra tiempo, otro ejemplo del módulo 6: **estratos con dos metas**, contar a las personas sin hogar. **Qué ilustra:** estratos que sirven a la vez para estimar bien y para llegar a cuanta más gente, porque esa noche también se informa sobre servicios sociales. **De dónde sale:** el diseño es el de Nueva York (Lohr, 3.ª ed., Ej. 3.13: unas 7 000 áreas en 12 estratos, alta y baja densidad por distrito y metro, clasificadas con los conteos de años anteriores; las de alta densidad se recorren todas). Los datos de `pitcount.csv` no son de Nueva York: Lohr los presenta en el ejercicio 29 del cap. 3 (Tabla 3.9) como «una encuesta ficticia de una ciudad ficticia con 4 divisiones que usa el mismo tipo de diseño». Censa sus 40 áreas de alta densidad y visita 60 de las 960 de baja (1 de cada 16). Total estimado: 496 personas (ee 70,793); las de alta densidad aportan 224 con ee 0: son estratos de certeza. **Aviso para el docente:** el módulo 6 presenta el bloque como «El conteo de personas sin hogar de Nueva York», y sus cifras como si fueran de esa ciudad; hasta que se corrija, conviene decirlo en clase.

**Fuente** del ejemplo: bloque «El conteo de personas sin hogar de Nueva York», módulo 6 (verificado: 496; 70,793; 224; 272). Lohr, 3.ª ed., Ej. 3.13 y ejercicio 29 del cap. 3.

**Transición:** ¿por qué gana una partición y otra no? El módulo 7 lo escribe como una identidad.

# Módulo 7 · Un modelo para el estratificado {seccion=modulo-7}

> «La varianza entre estratos desaparece» se puede escribir como una identidad contable.

???
**Minuto 16.** Pregunta de arranque: la partición al azar no ganó nada, y hasta perdió un pelo. ¿Por qué?

## La variabilidad total se parte en lo que hay entre estratos y lo que hay dentro

$$\underbrace{\sum_{k \in U} (y_k - \bar y_U)^2}_{\text{SST: total}} = \underbrace{\sum_h N_h (\bar y_{U_h} - \bar y_U)^2}_{\text{SSB: entre estratos}} + \underbrace{\sum_h \sum_{k \in U_h} (y_k - \bar y_{U_h})^2}_{\text{SSW: dentro}}$$

El MAS carga con SST entera. El estratificado solo con SSW: SSB lo paga el **diseñador** al fijar las cuotas, no el azar.

???
Fórmula del módulo 7 («La descomposición ANOVA de la población»). Preguntar: si las cuatro regiones tuvieran la misma media, ¿cuánto valdría SSB? (cero: no habría nada que ganar, como con la partición al azar).

**Transición:** ¿cuánto vale cada parte con las regiones?

## Por región, el 18 % de la variabilidad está entre estratos {columnas=3:2}

```r La descomposición ANOVA de agpop por región {resaltar=7-8}
media_U <- mean(agpop$acres92)
SST <- sum((agpop$acres92 - media_U)^2)
SSB <- sum(as.numeric(Nh) *
  (tapply(agpop$acres92, agpop$region, mean) - media_U)^2)
SSW <- SST - SSB
round(c(R2_entre = SSB / SST, dentro = SSW / SST), 4)
#> R2_entre   dentro
#>     0.18     0.82
```

|||

::: tip Interpretación
Ese 18 % es casi exactamente lo que ahorra la asignación proporcional (17,88 %): su deff era **0,82**.
:::

???
**Proyectar.** El bloque del módulo 7 sigue con la misma cuenta para las cuatro particiones del módulo 6: la diapositiva siguiente la dibuja.

**Fuente:** bloque «La descomposición ANOVA de agpop por región», módulo 7 (verificado).

**Transición:** la misma cuenta para las cuatro particiones.

<!-- Recorte: la línea de SSB se partió en dos; se omitió el resto del bloque (las cuatro particiones, cond_prop con SSB contra la cota y la identidad dif), cuyas cifras van en la gráfica y en las notas siguientes. -->

## Estratificar rinde lo que la partición explica de y {columnas=2:1}

![](recursos/cap4/m7_r2.json){alto=430}

|||

Con la proporcional y estratos grandes, \(\text{deff} \approx 1 - R^2\), donde \(R^2 = \text{SSB}/\text{SST}\).

::: tip Interpretación
Es el \(R^2\) **de la partición**, no el de la variable: `acres87` correlaciona 0,9951 con `acres92`, pero sus cuartiles explican el 46,09 %.
:::

???
Primera etapa: \(R^2\) entre estratos de cada partición. Segunda: el ahorro de varianza (1 − deff, en %). Cuadran casi exacto: 18,00 y 17,88; 46,09 y 46,04; 1,37 y 1,28; 0,00 y −0,09 (el azar pierde). Lo que no explican los cuartiles se queda dentro de cada uno: por eso partir más fino seguía rindiendo.

Si preguntan si la proporcional puede perder contra el MAS: solo si SSB es diminuta. La identidad exacta (Lohr, 3.ª ed., ecs. 3.12–3.13) es \(V_{\text{MAS}} - V_{\text{prop}} = \frac{1 - n/N}{n(N-1)}\big[\text{SSB} - \sum_h (1 - N_h/N) S^2_{y,h}\big]\). En miles de millones, la región tiene SSB 99 907,0 frente a una cota de 689,6 (la supera unas 145 veces); el azar, 14,4 frente a 541,6: por eso su deff fue 1,0009 y no 1. La cota es menor que la suma de las H varianzas de los estratos, mientras que SSB multiplica cada distancia entre medias por \(N_h\): con estratos grandes es difícil perder. Con una muestra concreta, en cambio, la varianza **estimada** del estratificado puede salir mayor que la del MAS por puro azar.

**Fuente:** bloque «La descomposición ANOVA de agpop por región», módulo 7 (verificado: también 99 907,0 y 689,6; 14,4 y 541,6).

**Transición:** detrás de esta cuenta hay un modelo.

## El modelo implícito del estratificado es un ANOVA de un factor

$$Y_k = \mu_h + \varepsilon_k \quad\text{si } k \in U_h, \qquad E_M(\varepsilon_k) = 0, \qquad V_M(\varepsilon_k) = \sigma_h^2$$

Bajo este modelo, el error cuadrático medio del total es **la misma fórmula** que la varianza de diseño, con \(\sigma_h^2\) en lugar de \(S^2_{y,h}\): al estimarla con \(s_h^2\) sale el mismo error estándar.

::: warn Criterio
Trabajar con el **diseño** y usar el modelo como guía: la varianza de diseño vale aunque el modelo falle; la del modelo, solo si es cierto.
:::

???
Derivación del módulo 7 (pasos 1 a 4). El estratificado es al ANOVA lo que la razón era a la recta por el origen (capítulo 3). Si las \(\mu_h\) son iguales, el estimador no se sesga: solo deja de ganar. Si falla la independencia dentro del estrato (vecinos que se parecen), la varianza del modelo se queda corta: es el tema del capítulo 5.

**Fuente:** módulo 7, derivación y Lohr, 3.ª ed., §3.6.

**Transición:** una pregunta gráfica para cerrar el módulo.

## ¿Cuál de los dos es el estratificado? {.pregunta}

![](recursos/cap4/m7_histogramas.json){alto=380}

Las 10 000 réplicas de la media estimada con \(n = 300\): un MAS y un estratificado proporcional.

::: respuesta
El **B**: mismo centro, más concentrado. Los dos son insesgados; el estratificado reduce **varianza**, no sesgo.
:::

???
Pregunta gráfica de la autoevaluación del módulo 13 (módulo 7), redibujada con los datos del precálculo para que la leyenda no delate la respuesta (la foto del simulador sí la delata). Etapas: A (verde, MAS), B (naranja, estratificado), y la respuesta.

Dato para después de revelar: el intervalo normal cubrió la media verdadera el **93,1 %** de las veces con el MAS y el **93,4 %** con el estratificado, no el 95 %. `acres92` es muy asimétrica: estratificar mejora la varianza, pero no arregla la asimetría.

**Fuente:** precálculo `distribucion` (10 000 réplicas por diseño, semilla 2026; cobertura 0,9313 y 0,9335) y advertencia «La cobertura empírica no llegó al 95 %» del módulo 7.

**Transición:** ¿cómo resumir en un número cuánto gana un diseño? El módulo 8.

# Módulo 8 · El efecto de diseño {seccion=modulo-8}

> Un solo número para comparar diseños, y su traducción a entrevistas.

???
**Minuto 30.** Pregunta de arranque: en la sesión 1 comparamos asignaciones con el deff; ¿contra qué compara exactamente?

## El deff compara cualquier diseño con un MAS del mismo tamaño

::: definicion Efecto de diseño (Kish) y tamaño de muestra efectivo
$$\text{deff} = \frac{V(\hat\theta \mid \text{diseño})}{V(\hat\theta \mid \text{MAS con el mismo } n)} \qquad\qquad n_{\text{ef}} = \frac{n}{\text{deff}}$$
:::

- **deff < 1**: el diseño le gana al MAS. Aquí suele vivir el estratificado.
- **deff > 1**: pierde. Ahí suelen vivir los conglomerados del capítulo 5.

\(n_{\text{ef}}\) responde: «estas \(n\) entrevistas valen como \(n_{\text{ef}}\) de un MAS».

???
Definición del módulo 8; la vara ya está fijada desde la Definición 2.10 del capítulo 2. Kish (1965) le dio el nombre de *design effect* (Lohr, 3.ª ed., §7.4). La cita precisa del capítulo, «Kish, *Survey Sampling* (1965), §8.2», sale de su bibliografía y no se contrastó con la obra [SIN VERIFICAR].

**Transición:** ¿cuánto valen las 300 entrevistas de `agstrat`?

## ¿A cuántas entrevistas de un MAS equivalen las 300 de agstrat? {.pregunta}

Mismo \(n = 300\), misma población. Error estándar de la media con `agsrs` (MAS): **18 898,43**. Con `agstrat` (estratificado): **16 379,87**.

::: respuesta
```r El deff empírico con agsrs y agstrat
agsrs <- read.csv("CSV data sets for SDA 3e/agsrs.csv")
ee_srs <- sqrt((1 - 300 / N) * var(agsrs$acres92) / 300)
ee_str <- sqrt(V_str)
round(c(ee_mas = ee_srs, ee_estratificado = ee_str,
        deff_empirico = (ee_str / ee_srs)^2), 4)
#>           ee_mas ee_estratificado    deff_empirico
#>       18898.4344       16379.8727           0.7512
round(300 / (ee_str / ee_srs)^2, 0)
#> [1] 399
```
:::

???
Pregunta numérica de la autoevaluación del módulo 13 (módulo 8), tolerancia ±2. Pedir el cálculo con calculadora antes de revelar; **proyectar** el bloque al revelar. Trampa del material: redondear el deff a 0,75 antes de dividir da 400; la buena es 399. Con estas dos muestras parece que el estratificado vale 99 entrevistas más; la diapositiva siguiente explica por qué el valor exacto es 65 (300 / 0,8224 = 365).

**Fuente:** bloque «El deff empírico con agsrs y agstrat», módulo 8 (verificado).

**Transición:** ¿por qué 399 y no 365?

<!-- Dependencias: usa N y V_str del bloque «El estimador estratificado a mano» (sesión 1) y lee agsrs, que usan después los dos bloques del módulo 10. -->

## El 0,75 es una estimación; el 0,82 es el valor exacto {columnas=1:1}

::: ejemplo Dato
**Exacto** (de `agpop` entera): deff 0,8224, así que las 300 valen como **365** de un MAS.

**Estimado** (de las dos muestras): 0,7512, así que valen como **399**.
:::

|||

::: tip Interpretación
Las dos muestras subestiman su error estándar: `agstrat` un 22 % y `agsrs` un 19 %. Les tocaron menos condados gigantes de los esperados (2 y 1 de los 31, frente a unos 3). Como `agstrat` subestima más, el deff estimado queda por debajo del exacto.
:::

::: warn Criterio
Para comparar diseños se cita el **exacto**. El estimado es lo único que hay cuando solo se tiene la muestra.
:::

???
Son el mismo diseño (la asignación de `agstrat`, 103/21/135/41, es la proporcional) y la misma cantidad, pero no los mismos datos. Cuentas: 16 380 / 21 124 = 0,775 y 18 898 / 23 294 = 0,811; 0,8224 × (0,775 / 0,811)² = 0,7512. «Gigantes» = los 31 mayores de `agpop` (módulo 5): en `agsrs` está 1 (Hudspeth County, TX) y en `agstrat` 2; un MAS de 300 esperaría 31 × 300 / 3 078 ≈ 3 (verificado con R). **Aviso para el docente:** el módulo 8 dice que a `agsrs` «no le tocó ninguno» y explica la diferencia solo por el denominador, que la movería en la dirección contraria. Además, el deff viaja mal entre variables: el 0,75 vale para `acres92`, y para otra variable el de esta misma muestra es otro (el capítulo 7 lo usa como diagnóstico).

**Fuente:** advertencia «Este 0,75 no es el 0,82…» del módulo 8 (300 / 0,8224 = 365; ee verdaderos del MAS 23 294 y de la proporcional 21 124, del bloque de las tres asignaciones del módulo 4).

**Transición:** hasta aquí, dentro de cada estrato se sorteaba con probabilidades iguales. No tiene por qué ser así.

# Módulo 9 · Estratificado con probabilidades proporcionales {seccion=modulo-9}

> Dentro de un estrato, nada obliga a sortear con probabilidades iguales.

???
**Minuto 39.** Pregunta de arranque: en una ciudad con empresas de 3 y de 3 000 empleados, ¿tiene sentido darles a todas la misma probabilidad?

## En cada estrato, las unidades grandes entran con más probabilidad

::: definicion Diseño STPPS y estimador de Hansen–Hurwitz
En el estrato \(h\) se hacen \(m_h\) extracciones **con reemplazo**; en cada una, la unidad \(k\) sale con probabilidad \(\psi_k = x_k / \sum_{l \in U_h} x_l\).

$$\hat t_{y,h} = \frac{1}{m_h} \sum_{i=1}^{m_h} \frac{y_{k_i}}{\psi_{k_i}} \qquad\qquad \widehat V(\hat t_{y,h}) = \frac{1}{m_h}\, s^2_{\{y_{k_i}/\psi_{k_i}\}}$$
:::

Si \(y_k\) es casi proporcional a \(x_k\), los cocientes casi no varían y la varianza **se desploma**.

???
Definición del módulo 9. Cada cociente \(y_{k_i}/\psi_{k_i}\) es por sí solo un estimador insesgado del total del estrato; Hansen–Hurwitz promedia \(m_h\) de ellos. Es la puerta al capítulo 6. ¿Por qué con reemplazo? Porque sin reemplazo hacen falta las \(\pi_{kl}\), que en general no tienen forma cerrada; con el 0,4 % de la población, repetir una empresa es un precio despreciable. El capítulo cita Gutiérrez, §5.3, para esta definición; la cita sale de su bibliografía y no se contrastó con la obra [SIN VERIFICAR].

**Transición:** ¿se cumple esa condición en BigLucy?

## BigLucy: el total queda a un 2 % de la verdad

```r STPPS sobre BigLucy con TeachingSampling {resaltar=11,13,16}
suppressMessages(library(TeachingSampling))
data(BigLucy)
mh <- c(Big = 60, Medium = 120, Small = 200)
set.seed(2026)
sel <- S.STPPS(BigLucy$Level, BigLucy$Employees, mh)
sam <- sel[, 1]; psi <- sel[, 2]
est <- E.STPPS(data.frame(Income = BigLucy$Income[sam]), psi, mh,
               BigLucy$Level[sam])
round(est[, , "Income"], 2)
#>                       Big      Medium       Small  Population
#> Estimation     3518947.76 17175653.73 15192878.18 35887479.67
#> Standard Error   93910.11   542313.16   738161.38   920763.22
#> CVE                  2.67        3.16        4.86        2.57
#> DEFF                 1.46        2.58        2.41        0.33
sum(BigLucy$Income)
#> [1] 36634733
```

**BigLucy**: 85 296 empresas de una ciudad, en tres niveles; \(y\) = `Income`, \(x\) = empleados.

???
**Proyectar.** **Qué ilustra:** el STPPS con su estimador. **De dónde sale:** `BigLucy` es la base de datos del paquete `TeachingSampling` de Gutiérrez: variables financieras de las empresas industriales de una ciudad en un año fiscal (la documentación del paquete dice 85 396, pero la tabla del módulo cuenta 2 905 + 25 795 + 56 596 = 85 296). Los niveles Big, Medium y Small los define la documentación por los impuestos declarados. **Por qué importa:** es un censo, así que se ve si el estimador acertó: 35 887 480 contra 36 634 733, un 2 % por debajo, con CV del 2,57 %, usando 380 extracciones (0,4 %).

`Income` es lo que el capítulo llama «ingresos»; la documentación del paquete la define como utilidades («earnings (or profit)… revenues adjusted for the cost of doing business»). La fila DEFF la retoma la diapositiva siguiente. El material reproduce además Hansen–Hurwitz a mano en el estrato Big (3 518 948; ee 93 910).

**Fuente:** bloque «STPPS sobre BigLucy con TeachingSampling», módulo 9 (verificado).

**Transición:** el estimador acertó; pero ¿ganó algo el PPT?

<!-- Recorte: se quitaron table(BigLucy$Level) y los comentarios; el resto es el bloque del módulo 9. -->

## En BigLucy, el PPT por empleados pierde contra un MAS en cada nivel {columnas=2:1}

![](recursos/cap4/m9_biglucy.json){alto=420}

|||

::: ejemplo Dato
Correlación de `Income` con los empleados, dentro de cada nivel: Big 0,77 · Medium 0,44 · Small 0,19.
:::

::: tip Interpretación
Aquí no se cumple la condición: `Income` sigue poco a los empleados, los cocientes \(y_k/\psi_k\) varían mucho y el PPT sale peor que sortear con probabilidades iguales.
:::

???
**Qué ilustra:** que la condición de la definición es la que manda: el PPT solo gana si \(y\) sigue de cerca a \(x\) dentro de cada estrato. **De dónde sale:** cálculo de verificación con R 4.4 sobre `BigLucy` (22-oct-2026), con los mismos \(m_h\) = 60/120/200. Error estándar verdadero del total con Hansen–Hurwitz, \(\sqrt{\sum_h \frac{1}{m_h}\sum_{k \in U_h} \psi_k (y_k/\psi_k - t_h)^2}\): 980 501. Con un MAS sin reemplazo de los mismos tamaños en cada nivel: 582 346 (es `ppt.seStsi` del precálculo; su fpc es despreciable, a lo sumo un 2 %). Por nivel, la varianza del PPT es 1,0, 3,1 y 2,8 veces la del MAS. La fila DEFF de la salida apunta en la misma dirección (1,46, 2,58 y 2,41), aunque `E.STPPS` la estima con la varianza sin ponderar de la muestra PPT; el 0,33 de «Population» compara con un MAS sin estratos.

**Por qué importa:** el capítulo da a entender lo contrario. El módulo 9 dice que los ingresos siguen de cerca al número de empleados, y el ejercicio guiado 4 concluye que el PPT gana porque compara el CV de `Income` (PPT) con el de `Taxes` (MAS), dos variables distintas. **Aviso para el docente:** hasta que se corrija el capítulo, decirlo en clase.

**Transición:** una pregunta sobre cómo pesa cada empresa.

## Una empresa tiene el doble de empleados que otra de su estrato {.pregunta}

En el diseño STPPS del módulo 9, dentro del estrato Medium, una empresa tiene **el doble de empleados** que otra.

¿Qué relación guardan sus papeletas?

::: respuesta
Sale con **el doble de probabilidad** en cada extracción y, si sale, entra al estimador con **la mitad de peso**. Más probable de ver, menos influyente al verla: así queda insesgado.
:::

???
Pregunta de la autoevaluación del módulo 13 (módulo 9). Distractor del material: «pesa el doble» (las grandes contarían cuatro veces). Otro: «la probabilidad depende de los ingresos» (no: los ingresos son \(y\), desconocidos antes de muestrear; la ψ usa la auxiliar \(x\)).

**Transición:** volvemos a `agsrs`, que se sorteó sin estratos. ¿Se puede estratificar después?

# Módulo 10 · Postestratificación {seccion=modulo-10}

> Si los tamaños \(N_h\) se conocen, aunque el sorteo los haya ignorado, se pueden imponer después.

???
**Minuto 50.** Pregunta de arranque: `agsrs` es un MAS de una sola urna, pero conocemos los N_h por región. ¿Sirve de algo saberlo después del sorteo?

## agsrs no miró las regiones al sortear

```r Los pesos antes y después de postestratificar {resaltar=13-16}
table(agsrs$region)
#>  NC  NE   S   W
#> 107  24 130  39
w0 <- N / 300
n_obs  <- table(agsrs$region)
w_post <- as.numeric(Nh[agsrs$region]) /
          as.numeric(n_obs[agsrs$region])
data.frame(region = names(Nh), peso_antes = round(w0, 4),
           Nh = as.numeric(Nh),
           Nh_est = round(w0 * as.numeric(n_obs), 2),
           peso_despues = round(as.numeric(Nh) / as.numeric(n_obs), 4))
#>   region peso_antes   Nh  Nh_est peso_despues
#> 1     NC      10.26 1054 1097.82       9.8505
#> 2     NE      10.26  220  246.24       9.1667
#> 3      S      10.26 1382 1333.80      10.6308
#> 4      W      10.26  422  400.14      10.8205
```

`Nh_est` es el tamaño que la muestra **estima** para cada región con el peso de partida.

???
**Proyectar.** Los 107 condados del Norte-Centro por 10,26 dan 1 097,82, cuando el marco dice 1 054: el sorteo trajo esa región de más. El bloque completo del módulo 10 suma además los pesos antes y después (3 078 en los dos casos) y contrasta con la razón del capítulo 3 (factor \(g = 1{,}0366\), pesos que suman 3 190,7684 y no \(N\)).

**Fuente:** bloque «Los pesos antes y después de postestratificar», módulo 10 (verificado).

**Transición:** ¿qué pasa con los pesos?

<!-- Recorte: se partieron dos líneas largas y se quitaron los comentarios, la línea que suma los pesos antes y después y el contraste final con la razón del capítulo 3. Usa N y Nh de la sesión 1 y agsrs, leído en la respuesta de la pregunta del módulo 8. -->

## El peso pasa de N/n a Nₕ/nₕ {columnas=3:2}

![](recursos/cap4/m10_pesos.json){alto=420}

|||

Gris: el peso de antes, \(N/n\), igual para todos. Naranja: el de después, \(N_h/n_h\).

Postestratificar es **calibrar**: retocar los pesos para que la muestra reproduzca los \(N_h\) conocidos (del marco o de un censo).

$$w_k^{*} = \frac{N_h}{\hat N_h}\, w_k$$

Los pesos nuevos suman \(N = 3\,078\) **exacto**.

???
Una sola etapa: aparecen los pesos de después junto a los de antes. Las regiones que llegaron de más (Norte-Centro, Nordeste) bajan su peso; las que llegaron de menos (Sur, Oeste) lo suben. El capítulo 7 generaliza la calibración a varios márgenes a la vez (*raking*) y a totales continuos (GREG).

**Fuente:** precálculo `postestratificacion.w0` y `.wPost` (10,26; 9,8505; 9,1667; 10,6308; 10,8205), iguales a la salida del bloque del módulo 10.

**Transición:** ¿de dónde sale esa fórmula? Es una razón.

## La postestratificación es una razón dentro de cada postestrato

::: flujo {.paso}
1. **La auxiliar** — el indicador \(x_k = 1\) si \(k \in U_h\); su total es \(t_x = N_h\)
2. **La razón del capítulo 3** — \(\hat t_{yh,r} = \dfrac{\hat t_{yh}}{\hat N_h}\, N_h = N_h\,\bar y_h\)
3. **Sumando los postestratos** — la fórmula del estratificado, con los \(n_h\) que salieron
:::

::: revelar
$$\bar y_{\text{post}} = \sum_{h=1}^{H} W_h\,\bar y_h$$
:::

???
Derivación del módulo 10. En pesos vale para **cualquier** diseño de partida: \(w_k^* = (N_h/\hat N_h)\,w_k\); con un MAS, \(w_k = N/n\) y sale \(N_h/n_h\). El módulo 12 vuelve sobre esto: es la razón **separada** con \(x_k = 1\).

**Transición:** con `survey`, ¿cuánto baja el error?

## Sin una sola entrevista más, el error estándar baja un 7 %

```r La media postestratificada con survey
dis0 <- svydesign(id = ~1, weights = rep(w0, 300),
                  fpc = rep(N, 300), data = agsrs)
disP <- postStratify(dis0, ~region,
  data.frame(region = names(Nh), Freq = as.numeric(Nh)))
svymean(~acres92, dis0)
#>           mean    SE
#> acres92 297897 18898
svymean(~acres92, disP)
#>           mean    SE
#> acres92 299778 17513
```

::: tip Interpretación
Basta con confesarle al estimador algo que el marco sabía desde el principio.
:::

???
**Correr en vivo**: `postStratify` es una línea, y verla cambiar el error estándar convence (necesita `w0`, del bloque anterior). 7 % = 1 − 17 513 / 18 898. El bloque del material calcula antes la misma media a mano (299 778,1).

Si preguntan por el error estándar: hay tres maneras de calcularlo, y ninguna está mal.

| Cálculo | Tipo | Error estándar |
|---|---|---|
| Lohr, ec. 4.27 (varianza de la proporcional) | Incondicional, aproximada | 17 442,6 |
| `survey` (la trata como calibración) | De diseño, linealizada | 17 513,4 |
| Con los \(n_h\) que salieron | Condicional a los \(n_h\) | 17 635,0 |

Con \(n_h\) grandes la diferencia es cosmética: aquí, a lo sumo un 1,1 %. `survey` reproduce al decimal la receta de §4.1.4 de Lohr (17 513,4478). Lohr da por buena su aproximación con \(n_h\) de unos 30 o más; con celdas más chicas, fusionarlas.

**Fuente:** bloque «La media postestratificada a mano y con survey», módulo 10 (verificado: también 17 442,6; 17 513,4; 17 635,0). Lohr, 3.ª ed., §4.4: la aproximación de la ec. 4.27 vale «if N_h/N is known, n_h is reasonably large (≥ 30 or so), and n is large». El material lo escribe como «30 casos esperados por celda».

**Transición:** ¿cuánto se pierde por decidir después del sorteo?

<!-- Recorte: se partieron las líneas de svydesign y postStratify y se quitaron los comentarios; el bloque del módulo sigue con la media a mano, la prima de decidir tarde (21 109,07; 21 272,24; 0,77 %) y los tres errores estándar con la receta de §4.1.4, cifras que usan la diapositiva siguiente y estas notas. -->

## Decidir tarde cuesta poco; renunciar a elegir la asignación cuesta más {columnas=2:1}

![](recursos/cap4/m10_prima.json){alto=420}

|||

::: ejemplo Dato
Sobre la población, con \(n = 300\): postestratificar en lugar de estratificar sube el error estándar un **0,77 %**; estratificar con Neyman en lugar de la proporcional lo baja un **18 %**.
:::

La postestratificación no puede imitar a Neyman: el sorteo reparte la muestra en proporción al tamaño, no a la dispersión.

???
Tres etapas: el estratificado proporcional (21 109,07), el postestratificado (unos 21 272: aproximación de segundo orden; el precálculo la comprueba por simulación con 200 000 muestras, 21 298,8 con error Monte Carlo de 33,7) y Neyman (17 291). No sirve comparar 17 513 (postestratificado, con `agsrs`) con 16 380 (estratificado, con `agstrat`): son dos muestras distintas; por eso la prima se mide sobre la población. 18 % = 1 − 17 291 / 21 109.

**Fuente:** bloque «La media postestratificada a mano y con survey» (módulo 10, verificado: 21 109,07; 21 272,24; 0,77) y nota «¿Y cuánto cuesta haber decidido tarde?»; precálculo `postestratificacion.primaEeProp`, `.primaEePost`, `.primaEeSim` y `.primaEeSimMc`. Neyman: bloque «Las tres asignaciones sobre agpop» (módulo 4).

**Transición:** las mismas regiones han jugado ya tres papeles distintos.

## Estrato, dominio y postestrato: tres papeles para las mismas regiones {.idea}

- **Estrato**: los \(n_h\) se fijan antes de sortear (`agstrat`).
- **Dominio** (capítulo 3): los \(n_d\) salen al azar y \(N_d\) se desconoce.
- **Postestrato**: un dominio cuyo \(N_h\) se conoce y se impone después (`agsrs`, módulo 10).

???
Repaso de papeles de las notas del módulo 10. Cuándo postestratificar (nota del módulo): el marco no traía la variable pero sus totales se conocen por otra fuente; como ajuste de no respuesta (capítulo 8); nunca con celdas casi vacías.

**Transición:** una pregunta para fijar qué necesita.

## ¿Qué necesita la postestratificación? {.pregunta}

Marca todo lo que hace falta:

1. Conocer los tamaños poblacionales \(N_h\) de las celdas.
2. Observar la variable de estratificación en cada unidad de la muestra.
3. Haber fijado los \(n_h\) antes de sortear.
4. Celdas con suficientes observaciones.

::: respuesta
La **1**, la **2** y la **4**. La 3 es justo lo que **no** necesita: es lo que la distingue de estratificar.
:::

???
Pregunta de selección múltiple de la autoevaluación del módulo 13 (módulo 10).

**Transición:** la misma idea vive en el aprendizaje automático, con otro nombre.

# Módulo 11 · Estratificación en machine learning {seccion=modulo-11}

> Evaluar un modelo predictivo es estimar un parámetro con una muestra: el conjunto de prueba es una encuesta.

???
**Minuto 67.** Pregunta de arranque: cuando parten los datos en entrenamiento y prueba, ¿qué garantiza que la prueba se parezca al conjunto completo?

## StratifiedKFold es una asignación proporcional con la clase como estrato

```python KFold contra StratifiedKFold sobre agpop {resaltar=12-13}
from sklearn.model_selection import KFold, StratifiedKFold
y = (agpop["acres92"] > 1_000_000).astype(int)
X = agpop[["acres87", "farms92"]]
for nombre, cv in [
        ("KFold          ",
         KFold(n_splits=5, shuffle=True, random_state=2026)),
        ("StratifiedKFold",
         StratifiedKFold(n_splits=5, shuffle=True,
                         random_state=2026))]:
    props = [y.iloc[prueba].mean() for _, prueba in cv.split(X, y)]
    print(nombre, np.round(props, 4))
#> KFold           [0.0325 0.0519 0.0373 0.0683 0.0602]
#> StratifiedKFold [0.0503 0.0503 0.0503 0.0488 0.0504]
```

Clase minoritaria: los condados de más de un millón de acres, el **5 %**.

???
**Proyectar.** **Qué ilustra:** el estratificado dentro de scikit-learn. **De dónde sale:** módulo 11, sobre `agpop`, con una clase rara construida a propósito. **Por qué importa:** es la situación del fraude en transacciones o de una enfermedad rara en un tamizaje; con `KFold` a secas hay pliegues con el 3,3 % de grandes y otros con el 6,8 %, y la métrica de un clasificador de minorías cambia por completo entre ellos. El material trae la misma idea con `train_test_split(stratify=y)` (prueba: 3,25 % sin estratificar, 5,03 % estratificada).

**Fuente:** bloque «KFold contra StratifiedKFold sobre agpop», módulo 11 (verificado).

**Transición:** en R, `strata=` promete lo mismo. ¿Lo cumple?

<!-- Recorte: se quitó la línea que imprime la proporción global (0,0500) y se partió la lista del for. Usa agpop (pandas) y np del bloque Python del módulo 3: para correrlo suelto, anteponer import numpy as np, pandas as pd y agpop = pd.read_csv("CSV data sets for SDA 3e/agpop.csv"). -->

## ¿Estratificó este equipo? {.pregunta}

Un equipo parte `agpop` con `vfold_cv(agpop, v = 5, strata = grande)` de `rsample`; la clase `grande` (más de un millón de acres) es el 5 %. Sus pliegues de prueba traen:

**5,84 % · 5,36 % · 4,22 % · 4,23 % · 5,37 %** de grandes.

¿Estratificó?

::: respuesta
**No**: bailan como sin estratificar. Con `pool = 0.1`, el valor por defecto, `rsample` fusiona **sin avisar** los estratos con menos del 10 % de los datos. Con `pool = 0.02` quedan entre 4,89 % y 5,03 %.

::: warn Criterio
Comprobar **siempre** las proporciones por pliegue después de partir: es una línea de código.
:::
:::

???
Pregunta de la autoevaluación del módulo 13 (módulo 11), con los pliegues en el enunciado para que se pueda responder con lo visto: se comparan con los de `StratifiedKFold` de la diapositiva anterior (4,88 % a 5,04 %). Sin `strata`, los pliegues fueron 5,36 · 5,68 · 4,22 · 4,88 · 4,88 %.

Al bajar `pool` a 0,02, `rsample` avisa que estratificar grupos del 2 % «puede ser estadísticamente arriesgado» y sugiere subirlo, y su documentación desaconseja bajarlo de 0,1. Es un compromiso: aquí la clase tiene 154 condados, unos 31 por pliegue. Lo que no admite discusión es comprobar las proporciones. Hasta dónde llega el paralelismo (nota del módulo): el *split* estratificado es asignación proporcional, no Neyman; iguala composición, no varianzas.

El código está en la pestaña R del bloque «KFold contra StratifiedKFold sobre agpop» (módulo 11): **proyectarlo** desde el material solo si lo piden.

**Fuente:** pestaña R del bloque «KFold contra StratifiedKFold sobre agpop», módulo 11 (verificado: pliegues 0,0584 0,0536 0,0422 0,0423 0,0537 con el `pool` por defecto; 0,0503 0,0503 0,0503 0,0503 0,0489 con `pool = 0.02`; 0,0536 0,0568 0,0422 0,0488 0,0488 sin estratificar). Kohavi (1995) recomendó estratificar la validación cruzada; la cita sale de la bibliografía del capítulo y no se contrastó con la obra [SIN VERIFICAR].

**Transición:** último módulo: la razón del capítulo 3, ahora con estratos.

# Módulo 12 · Razón en el estratificado {seccion=modulo-12}

> La variable auxiliar del capítulo 3, ahora dentro de los estratos: dos maneras de juntarlas.

???
**Minuto 74.** Pregunta de arranque: en el capítulo 3, la razón con `acres87` bajó mucho el error. ¿Se puede sumar ese ahorro al de estratificar?

## Combinada y separada difieren en el orden de las operaciones

::: definicion Combinada y separada
- **Combinada**: se suman los estratos y luego **una** razón: \(\hat t_{yrc} = \hat B\, t_x\), con \(\hat B = \hat t_{y,\text{str}} / \hat t_{x,\text{str}}\). Pide solo \(t_x\).
- **Separada**: una razón **por estrato** y luego se suman: \(\hat t_{yrs} = \sum_h t_{xh}\, \bar y_h / \bar x_h\). Pide **cada** \(t_{xh}\).
:::

::: ejemplo Dato
En `agstrat`, las razones `acres92`/`acres87` por región son NC 0,9751 · NE 0,8956 · S 0,9935 · W 1,0120. La combinada las resume en **0,9900**.
:::

???
Definición del módulo 12. Si las razones de todos los estratos fueran iguales, los dos estimadores serían el mismo: toda la diferencia vive en cuánto se separan. La postestratificación del módulo 10 es la razón **separada** con \(x_k = 1\): entonces \(t_{xh} = N_h\) y \(\bar y_h/\bar x_h = \bar y_h\). Lohr, 3.ª ed., §4.5, lo señala así.

**Fuente** de las razones por región: primera salida del bloque «Razón combinada y separada sobre agstrat» (módulo 12) y precálculo `razonEstratificada.Bh`.

**Transición:** ¿cuánto bajan el error?

## Con acres87, el error estándar del total baja más de ocho veces

```r Razón combinada y separada sobre agstrat {resaltar=15-17}
tx  <- sum(agpop$acres87)
txh <- tapply(agpop$acres87, agpop$region, sum)
rc <- predict(svyratio(~acres92, ~acres87, dis), total = tx)
rs <- predict(svyratio(~acres92, ~acres87, dis, separate = TRUE),
              total = txh)
sa <- svytotal(~acres92, dis)
comp <- rbind(
  sin_auxiliar = c(as.numeric(coef(sa)), as.numeric(SE(sa))),
  combinada    = c(as.numeric(rc$total), as.numeric(rc$se)),
  separada     = c(as.numeric(rs$total), as.numeric(rs$se)))
colnames(comp) <- c("total", "ee")
round(cbind(comp / 1e6,
  error_pct = 100 * (comp[, 1] / sum(agpop$acres92) - 1)), 3)
#>                total     ee error_pct
#> sin_auxiliar 909.736 50.417    -3.625
#> combinada    953.827  5.962     1.046
#> separada     954.334  5.724     1.100
```

???
**Proyectar.** Millones de acres. Sin auxiliar (el estratificado del módulo 3), ee 50,417; con `acres87`, 5,962 la combinada y 5,724 la separada. Como `agpop` está entera, se ve el acierto: −3,625 % contra 1,046 % y 1,100 %. La separada gana aquí un 4 % (de 5,962 a 5,724): real y pequeño. El bloque completo del módulo 12 calcula además las razones por región (las de la diapositiva anterior) y verifica a mano los dos estimadores.

**Fuente:** bloque «Razón combinada y separada sobre agstrat», módulo 12 (verificado). Usa el diseño `dis` del módulo 3 (sesión 1).

**Transición:** aquí ganó la separada. ¿La usarías siempre?

<!-- Recorte: se omitieron el cálculo de las razones por región y la verificación a mano; se partieron líneas largas. -->

## 40 estratos de unas 4 unidades: ¿usarías la separada? {.pregunta}

Una encuesta estratificada tiene **40 estratos** y unas **4 unidades** en cada uno. Conoces los \(t_{xh}\) de todos.

La separada aprovecha más información. ¿La usarías?

::: respuesta
**No: la combinada.** Cada razón de estrato es un cociente, y un cociente es sesgado: la separada sumaría 40 sesgos. Con 4 por estrato no gana nada que se distinga del ruido, y con 3 pierde con claridad. La diapositiva siguiente lo mide.
:::

???
Pregunta de selección múltiple de la autoevaluación del módulo 13 (módulo 12), planteada abierta y **antes** del gráfico, como predicción: el distractor natural es «sí, porque usa más información». El material sitúa el cruce en 5; en 4 la separada sale un pelo por debajo (3,276 % contra 3,292 % en el precálculo), pero esa ventaja no se distingue del ruido de la simulación, y por eso la respuesta no dice «por debajo del cruce». El cruce se midió con 4 estratos; con 40, el sesgo acumulado de la separada pesa todavía más frente a su error estándar, así que la respuesta vale con más razón. Regla del material («Cómo elegir, en una línea»): la separada solo si se tienen los \(t_{xh}\), los \(n_h\) son holgados **y** hay razones para creer que las razones cambian entre estratos; si falla cualquiera de las tres, la combinada.

**Transición:** la simulación del módulo 12 lo mide.

## Con estratos chicos la separada se dispara; con estratos grandes gana poco {columnas=2:1}

![](recursos/cap4/m12_recm.json){alto=430}

|||

::: ejemplo Dato
Raíz del ECM relativo con 3 por estrato: 7,195 % la separada (cifra inestable), 3,734 % la combinada. Con 20: 1,528 % y 1,554 %.
:::

::: tip Interpretación
Con \(n_h\) grandes se gana poco y con \(n_h\) chicos se pierde mucho: por eso muchos paquetes (SAS, y `svyratio` de R) calculan la **combinada** por defecto.
:::

???
Es la respuesta a la pregunta anterior. La cifra de la separada con 3 por estrato es **inestable**: el capítulo advierte que ni con 20 000 réplicas llega a certificarse, por los cocientes que estallan, y una simulación independiente de la auditoría dio 4,78 % frente a 3,69 %. Lo robusto es el sentido: con 3 por estrato la separada pierde. La separada comete el sesgo del cociente H veces y los suma. El cruce en 5 se midió exigiendo que la **diferencia** entre los dos estimadores (que se calculan sobre la misma muestra) supere dos errores Monte Carlo; sin esa exigencia salía en 4. Con 2 por estrato, el 0,23 % de las muestras deja alguna región con \(\bar x_h \le 0\) (por los −99 de `acres87`) y la separada ni existe.

**Fuente:** precálculo `razonEstratificada` (20 000 réplicas por tamaño: ecmComb, ecmSep, cruce = 5, pctIndefinida = 0,23), que alimenta el simulador «¿Combinada o separada?» del módulo 12.

**Transición:** cerramos con lo que nos llevamos y la práctica.

# Módulo 13 · Práctica {seccion=modulo-13}

> Lo que nos llevamos del capítulo, y cuatro ejercicios para hacer con su código.

???
**Minuto 85.** Si el tiempo apremia, la idea y el cierre se leen en dos minutos y la práctica se asigna para la casa.

## Estratos y conglomerados son la misma cuchilla con el filo al revés {.idea}

El estratificado parte la población en grupos y los mete **todos** en la muestra. El capítulo 5 parte la población en grupos y sortea **cuáles** entran completos.

???
Nota «Hacia el capítulo 5» del módulo 13. Las consecuencias sobre la varianza tienen el signo opuesto: el deff de los conglomerados suele ser mayor que 1.

**Transición:** lo que nos llevamos.

## Lo que nos llevamos hoy {.cierre}

- Se estratifica con la partición que más **explica** de \(y\): con la proporcional y estratos grandes, \(\text{deff} \approx 1 - R^2\); para comparar diseños, el deff **exacto**
- El PPT dentro de cada estrato solo gana si \(y\) sigue de cerca a \(x\); en BigLucy, no
- Postestratificar recupera casi todo sin entrevistas nuevas, pero no la elección de la asignación
- En *machine learning*, estratificar el *split* es la proporcional: comprueba las proporciones por pliegue
- Razón en el estratificado: la **combinada** por defecto; la separada, solo con \(n_h\) holgados

???
Retomar los títulos de las diapositivas de la variable de estratificación, el ANOVA, BigLucy, la prima de decidir tarde, `rsample` y el cruce.

**Transición:** la práctica.

## Práctica: cuatro ejercicios guiados del módulo 13

::: tarjetas {columnas=2}
### Ejercicio 3
BigLucy con MAS en cada nivel: el total de impuestos y su intervalo.
### Ejercicio 4
PPT contra MAS por estrato, comparados por su coeficiente de variación.
### Ejercicio 6
Postestratificar un MAS de 40 y fusionar la celda chica.
### Ejercicio 8
Las novelas nominadas al premio Edgar: ¿combinada o separada?
:::

Y de la autoevaluación, la que no hicimos en clase: qué hace la postestratificación con \(\hat N_h = 1\,097{,}82\) (módulo 10).

???
**Ejercicio 8, contexto:** una lectora sorteó 60 de los 655 libros nominados hasta 2020 al premio Edgar de los Mystery Writers of America, en 12 estratos (época, tipo de nominación y si ganó), con 4 o 6 libros por estrato (`mysteries.csv`; Lohr, 3.ª ed., ejercicio 13 del cap. 3 y ejercicio de razón del cap. 4). La pregunta de diseño es la misma de «40 estratos de unas 4 unidades: ¿usarías la separada?».

**Aviso para el docente sobre el ejercicio 4:** concluye que el PPT gana, pero compara el CV de `Income` (PPT) con el de `Taxes` (MAS), dos variables distintas. Con la misma variable, el PPT pierde (diapositiva «En BigLucy, el PPT por empleados pierde…»). Sobre el ejercicio 3: los niveles de BigLucy se definen por los impuestos declarados, justo la variable que el ejercicio estima.

Las soluciones están en el módulo 13 con el código real del capítulo: pedir que las intenten antes de abrir la pista. Las otras siete preguntas de la autoevaluación de los módulos 6 a 12 ya se hicieron en clase.
