suppressMessages({library(survey); library(jsonlite)})
Sys.setlocale("LC_CTYPE", "en_US.UTF-8")
options(warn = 1, survey.lonely.psu = "adjust")

cat("\n###BLOQUE-R1###\n")
# Dos encuestas reales, dos anatomias. NHANES (salud, EE.UU.) y SYC (jovenes
# en custodia). Las dos son estratos x conglomerados x pesos, pero con una
# diferencia estructural que decide que se puede hacer con cada una.
options(scipen = 8, digits = 7)
nh <- read.csv("CSV data sets for SDA 3e/nhanes.csv")
sy <- read.csv("CSV data sets for SDA 3e/syc.csv")

# NHANES: -9 es codigo de faltante y wtmec2yr = 0 marca a quien no paso por
# el examen fisico. El analisis usa adultos examinados con IMC valido.
nh_ad <- subset(nh, wtmec2yr > 0 & bmxbmi > 0 & ridageyr >= 20)
anatomia <- function(d, estr, psu, w, nombre) {
  data.frame(encuesta = nombre, n = nrow(d),
             estratos = length(unique(d[[estr]])),
             psu = nrow(unique(d[, c(estr, psu)])),
             w_min = min(d[[w]]), w_max = max(d[[w]]),
             suma_w = sum(d[[w]]))
}
rbind(anatomia(nh_ad, "sdmvstra", "sdmvpsu", "wtmec2yr", "NHANES adultos"),
      anatomia(sy, "stratum", "psu", "finalwt", "SYC"))

# La diferencia que lo decide todo: cuantas PSU por estrato.
table(table(unique(nh_ad[, c("sdmvstra","sdmvpsu")])$sdmvstra))
range(table(unique(sy[, c("stratum","psu")])$stratum))
# NHANES tiene EXACTAMENTE 2 PSU en cada uno de sus 15 estratos — el minimo
# para estimar varianza, y la condicion que exige el metodo BRR (modulo 5).
# SYC tiene de 7 a 154 centros por estrato: mas holgura, mas grados de libertad.
#>         encuesta    n estratos psu    w_min    w_max    suma_w
#> 1 NHANES adultos 5406       15  30 5157.019 242386.7 231785870
#> 2            SYC 2621       16 861    5.000     50.0     25012
#>
#>  2 
#> 15 
#> [1]   7 154

cat("\n###BLOQUE-R2###\n")
# Declarar el diseno es UNA linea, y es la linea de la que depende todo lo
# demas. id = conglomerados, strata = estratos, weights = pesos finales.
dis_nh <- svydesign(id = ~sdmvpsu, strata = ~sdmvstra, weights = ~wtmec2yr,
                    data = nh_ad, nest = TRUE)
dis_sy <- svydesign(id = ~psu, strata = ~stratum, weights = ~finalwt,
                    data = sy, nest = TRUE)
c(gl_nhanes = degf(dis_nh), gl_syc = degf(dis_sy))
# Los grados de libertad NO son n - 1: son (PSU - estratos). NHANES analiza
# 5406 personas con 15 gl. Ese numero gobierna el valor t de los intervalos.
c(t_nhanes = qt(0.975, degf(dis_nh)), t_syc = qt(0.975, degf(dis_sy)),
  t_normal = qnorm(0.975))
#> gl_nhanes    gl_syc 
#>        15       845 
#> t_nhanes    t_syc t_normal 
#> 2.131450 1.962775 1.959964 

cat("\n###BLOQUE-R3###\n")
# Los pesos: cuanto varian y que reconstruyen. El peso de NHANES dice a
# cuantos estadounidenses representa cada persona examinada.
w <- nh_ad$wtmec2yr
round(quantile(w, c(0, 0.25, 0.5, 0.75, 1)))
c(suma = sum(w), razon_max_min = max(w) / min(w))
# La suma de los pesos ESTIMA la poblacion adulta de EE.UU.: 232 millones.

# El deff de Kish mide solo lo que cuesta que los pesos sean desiguales:
kish <- function(w) 1 + var(w) / mean(w)^2
c(kish_nhanes = kish(nh_ad$wtmec2yr), kish_syc = kish(sy$finalwt))
# 1.89 en NHANES: la desigualdad de pesos, por si sola, cuesta un 89 % de
# varianza extra. Es UNA de las tres fuentes; el modulo 3 mide las tres.
#>     0%    25%    50%    75%   100% 
#>   5157  18588  26217  46493 242387 
#>            suma   razon_max_min 
#> 231785869.90836        47.00131 
#> kish_nhanes    kish_syc 
#>    1.893002    1.330300 

cat("\n###BLOQUE-R4###\n")
# El efecto de diseno completo, y el error estandar "ingenuo" que reportaria
# cualquier software que ignore el diseno.
m <- svymean(~bmxbmi, dis_nh, deff = TRUE)
m
ee_ingenuo <- sd(nh_ad$bmxbmi) / sqrt(nrow(nh_ad))
c(ee_diseno = as.numeric(SE(m)), ee_ingenuo = ee_ingenuo,
  factor = as.numeric(SE(m)) / ee_ingenuo)
c(n = nrow(nh_ad), n_efectivo = nrow(nh_ad) / as.numeric(deff(m)))
# 5406 personas que rinden como 759: el deff de 7.12 se come el 86 % de la
# muestra. Y el ee honesto es 2.63 veces el ingenuo — el intervalo publicado
# por quien ignore el diseno es 2.63 veces MAS ESTRECHO de lo que debe.
#>           mean      SE   DEff
#> bmxbmi 29.3891  0.2532 7.1248
#>  ee_diseno ee_ingenuo     factor 
#> 0.25319683 0.09624652 2.63071163 
#>          n n_efectivo 
#>  5406.0000   758.7546 

cat("\n###BLOQUE-R5###\n")
# De donde sale ese 7.12? Se anade un ingrediente del diseno a la vez.
v <- c(
  MAS_ideal = (sd(nh_ad$bmxbmi) / sqrt(nrow(nh_ad)))^2,
  con_pesos = SE(svymean(~bmxbmi, svydesign(id = ~1, weights = ~wtmec2yr,
                                            data = nh_ad)))^2,
  mas_estratos = SE(svymean(~bmxbmi, svydesign(id = ~1, strata = ~sdmvstra,
                                               weights = ~wtmec2yr, data = nh_ad)))^2,
  completo = as.numeric(SE(m))^2)
round(rbind(varianza = v, deff_acumulado = v / v[1]), 4)
# Lectura: los PESOS multiplican la varianza por 1.73; los ESTRATOS la bajan
# un poco (1.73 -> 1.71, es su trabajo); y los CONGLOMERADOS la cuadruplican
# (1.71 -> 6.92). No es monotona, y esa es justo la leccion: cada componente
# empuja en su direccion. (6.92 no es exactamente el 7.12 que reporta survey
# porque survey compara contra un MAS CON estos pesos, no contra el ideal.)
#>                MAS_ideal con_pesos mas_estratos completo
#> varianza          0.0093    0.0160       0.0158   0.0641
#> deff_acumulado    1.0000    1.7306       1.7099   6.9206

cat("\n###BLOQUE-R6###\n")
# Estadisticos NO lineales: la razon peso/altura. Su varianza se obtiene por
# LINEALIZACION DE TAYLOR — se sustituye la razon por su aproximacion lineal
# y se estima la varianza del TOTAL de esa variable construida.
r <- svyratio(~bmxwt, ~bmxht, dis_nh)
r

# La misma cuenta, a mano, para ver que hace survey por dentro:
B_hat <- as.numeric(coef(r))   # la razon: B en la notacion del curso (cap. 3)
X_hat <- sum(nh_ad$wtmec2yr * nh_ad$bmxht)     # total estimado del denominador
nh_ad$u <- (nh_ad$bmxwt - B_hat * nh_ad$bmxht) / X_hat   # variable linealizada
dis_u <- svydesign(id = ~sdmvpsu, strata = ~sdmvstra, weights = ~wtmec2yr,
                   data = nh_ad, nest = TRUE)
c(ee_svyratio = as.numeric(SE(r)),
  ee_linealizado = as.numeric(SE(svytotal(~u, dis_u))))
# Identicos. La receta vale para CUALQUIER estadistico suave: escribirlo como
# funcion de totales, derivar, construir u_k, y estimar el total de u.
#> Ratio estimator: svyratio.survey.design2(~bmxwt, ~bmxht, dis_nh)
#> Ratios=
#>           bmxht
#> bmxwt 0.4954763
#> SEs=
#>             bmxht
#> bmxwt 0.004229624
#>    ee_svyratio ee_linealizado 
#>    0.004229624    0.004229624 

cat("\n###BLOQUE-R7###\n")
# La otra familia: REPLICACION. El jackknife estratificado quita una PSU,
# reponderarizando las que quedan en su estrato, y recalcula. A mano:
theta <- as.numeric(coef(m))
psus <- unique(nh_ad[, c("sdmvstra", "sdmvpsu")])
reps <- numeric(nrow(psus))
for (i in seq_len(nrow(psus))) {
  fuera <- nh_ad$sdmvstra == psus$sdmvstra[i] & nh_ad$sdmvpsu == psus$sdmvpsu[i]
  dentro <- nh_ad$sdmvstra == psus$sdmvstra[i] & !fuera
  w2 <- nh_ad$wtmec2yr
  w2[fuera] <- 0
  w2[dentro] <- w2[dentro] * 2 / (2 - 1)       # los 15 estratos tienen 2 PSU
  reps[i] <- weighted.mean(nh_ad$bmxbmi, w2)
}
v_jk <- 0
for (h in unique(psus$sdmvstra)) {
  idx <- which(psus$sdmvstra == h)
  v_jk <- v_jk + (length(idx) - 1) / length(idx) * sum((reps[idx] - theta)^2)
}
c(replicas = length(reps), ee_jackknife_a_mano = sqrt(v_jk))
#>            replicas ee_jackknife_a_mano 
#>          30.0000000           0.2532593 

cat("\n###BLOQUE-R8###\n")
# Los tres metodos de replicacion en survey, contra la linealizacion:
dis_jkn <- as.svrepdesign(dis_nh, type = "JKn")          # jackknife estratificado
dis_brr <- as.svrepdesign(dis_nh, type = "BRR")          # exige 2 PSU por estrato
set.seed(2026)
dis_boo <- as.svrepdesign(dis_nh, type = "subbootstrap", replicates = 500)
round(c(linealizacion = as.numeric(SE(m)),
        jackknife = as.numeric(SE(svymean(~bmxbmi, dis_jkn))),
        BRR = as.numeric(SE(svymean(~bmxbmi, dis_brr))),
        bootstrap = as.numeric(SE(svymean(~bmxbmi, dis_boo)))), 6)
c(replicas_JKn = ncol(dis_jkn$repweights$weights),
  replicas_BRR = ncol(dis_brr$repweights$weights))
# Los cuatro coinciden en la tercera cifra. BRR usa 16 replicas — una matriz
# de Hadamard de orden 16 para 15 estratos — frente a las 30 del jackknife.
#> linealizacion     jackknife           BRR     bootstrap 
#>      0.253197      0.253259      0.258531      0.254364 
#> replicas_JKn replicas_BRR 
#>           30           16 

cat("\n###BLOQUE-R9###\n")
# Donde la replicacion gana de verdad: la MEDIANA. La linealizacion de un
# cuantil exige la densidad; el jackknife solo recalcula el estadistico.
q_lin <- svyquantile(~bmxbmi, dis_nh, 0.5, ci = TRUE)
q_jk <- svyquantile(~bmxbmi, dis_jkn, 0.5, ci = TRUE)
round(c(mediana = as.numeric(coef(q_lin)),
        ee_linealizacion = as.numeric(SE(q_lin)),
        ee_jackknife = as.numeric(SE(q_jk))), 5)
# Esa es la ventaja practica: cambia el estadistico, no el procedimiento. Con
# un indice de Gini o una tasa de pobreza, la replicacion es la unica salida
# razonable.
#>          mediana ee_linealizacion     ee_jackknife 
#>         28.30000          0.32841          0.32841 

cat("\n###BLOQUE-R10###\n")
# CALIBRACION. Los pesos del diseno no reproducen los totales conocidos de la
# poblacion; ajustarlos para que si lo hagan reduce varianza y corrige
# desbalances. Post-estratificacion primero (una sola variable):
nh_ad$sexo <- factor(nh_ad$riagendr, levels = c(1, 2), labels = c("hombre", "mujer"))
nh_ad$edadg <- cut(nh_ad$ridageyr, c(19, 39, 59, 200),
                   labels = c("20-39", "40-59", "60+"))
dis2 <- svydesign(id = ~sdmvpsu, strata = ~sdmvstra, weights = ~wtmec2yr,
                  data = nh_ad, nest = TRUE)
round(svytable(~sexo + edadg, dis2) / 1e6, 3)
# La muestra ponderada dice 111.0 M de hombres y 120.8 M de mujeres.

# Supongamos que un marco externo da 49 % hombres y una estructura de edad
# 34/34/32. Los margenes objetivo:
total <- sum(weights(dis2))
marg_sexo <- c(hombre = 0.49, mujer = 0.51) * total
marg_edad <- c(`20-39` = 0.34, `40-59` = 0.34, `60+` = 0.32) * total
round(marg_sexo / 1e6, 2)
round(marg_edad / 1e6, 2)
#>         edadg
#> sexo      20-39  40-59    60+
#>   hombre 41.319 40.612 29.097
#>   mujer  42.493 42.831 35.434
#> hombre  mujer 
#> 113.58 118.21 
#> 20-39 40-59   60+ 
#> 78.81 78.81 74.17 

cat("\n###BLOQUE-R11###\n")
# RAKING (IPFP): ajustar filas, luego columnas, y repetir. Cada paso rompe un
# poco el anterior, pero la sucesion converge. A mano, viendo el error caer:
A <- as.matrix(svytable(~sexo + edadg, dis2))
err <- function(M) max(abs(rowSums(M) - marg_sexo) / marg_sexo,
                       abs(colSums(M) - marg_edad) / marg_edad)
traza <- err(A)
for (k in 1:5) {
  A <- A * (marg_sexo / rowSums(A))            # cuadrar filas
  A <- t(t(A) * (marg_edad / colSums(A)))      # cuadrar columnas
  traza <- c(traza, err(A))
}
signif(traza, 3)
# El error cae en cascada geometrica: 3 iteraciones bastan para la precision
# de cualquier publicacion. Con margenes compatibles, IPFP siempre converge.
#> [1] 1.30e-01 3.35e-03 4.54e-06 6.15e-09 8.33e-12 1.12e-14

cat("\n###BLOQUE-R12###\n")
# El mismo raking con survey, y su efecto sobre la estimacion:
dis_rak <- rake(dis2, list(~sexo, ~edadg),
                list(data.frame(sexo = names(marg_sexo), Freq = as.numeric(marg_sexo)),
                     data.frame(edadg = names(marg_edad), Freq = as.numeric(marg_edad))))
svymean(~bmxbmi, dis_rak)
# Diferencia RELATIVA entre la tabla de survey y el IPFP a mano de 5 iteraciones:
signif(max(abs(as.matrix(svytable(~sexo + edadg, dis_rak)) - A)) / total, 3)
# Coinciden a 1e-12 relativo: es el mismo algoritmo. El IMC apenas se mueve
# (29.389 -> 29.391): con margenes cercanos a los que la muestra ya tenia,
# calibrar corrige poco. Su valor aparece cuando la no respuesta ha
# desbalanceado la muestra de verdad — capitulo 8.
#>          mean     SE
#> bmxbmi 29.391 0.2557
#> [1] 0.00000000000139

cat("\n###BLOQUE-R13###\n")
# EL ERROR MAS CARO, cuantificado: cobertura empirica de los IC. Poblacion
# sintetica de 200 conglomerados x 40 unidades con ICC = 0.15, 2 000 replicas
# de un diseno de 20 conglomerados (datos del precalculo).
cob <- fromJSON("precalculo/salidas/cap7_datos.json")$cobertura
data.frame(metodo = c("IC ingenuo (ignora el diseno)", "IC del diseno"),
           cobertura = c(cob$cobIngenuo, cob$cobDiseno),
           ancho_medio = round(c(cob$anchoIngenuo, cob$anchoDiseno), 4))
c(deff_teorico = cob$deffTeorico)
# El intervalo "del 95 %" que ignora los conglomerados cubre el 56.3 % de las
# veces. No es un matiz academico: uno de cada dos intervalos publicados no
# contiene el valor verdadero, y nadie lo nota porque el numero sale bonito.
#>                          metodo cobertura ancho_medio
#> 1 IC ingenuo (ignora el diseno)     0.563      0.1394
#> 2                 IC del diseno     0.950      0.3800
#> deff_teorico 
#>         6.85 

cat("\n###BLOQUE-R14###\n")
# RECORTE DE PESOS: la practica habitual para domar pesos extremos. Se topa
# el peso en un cuantil y se reescala para conservar el total. Sobre NHANES:
rec <- fromJSON("precalculo/salidas/cap7_datos.json")$recorte
data.frame(cuantil = rec$q, tope = round(rec$tope), afectados = rec$afectados,
           media = round(rec$media, 4), dif = round(rec$sesgoAparente, 4),
           ee = round(rec$ee, 4), kish = round(rec$kish, 3))
# HALLAZGO INCOMODO: recortar aqui NO compensa. El Kish baja de 1.89 a 1.31
# (los pesos se aplanan mucho), pero el error estandar no mejora — hasta
# empeora un poco — y la media se desplaza 0.057. Razon: en NHANES la varianza
# la ponen los CONGLOMERADOS (modulo 3), no los pesos, asi que aplanar pesos
# ataca el ingrediente equivocado y solo aporta sesgo. Antes de recortar,
# mirar la descomposicion del deff.
#>   cuantil   tope afectados   media     dif     ee  kish
#> 1   1.000 242387         0 29.3891  0.0000 0.2532 1.893
#> 2   0.999 220465         6 29.3883 -0.0008 0.2534 1.892
#> 3   0.990 172981        55 29.3898  0.0007 0.2534 1.868
#> 4   0.975 157449       136 29.3899  0.0008 0.2525 1.843
#> 5   0.950 138859       271 29.3868 -0.0023 0.2528 1.787
#> 6   0.900 111366       541 29.3958  0.0067 0.2523 1.656
#> 7   0.800  61813      1081 29.4465  0.0574 0.2559 1.312

cat("\n###BLOQUE-R15###\n")
# EJERCICIO 1. Con SYC, estimar la proporcion de jovenes que han cometido
# un delito violento (everviol) con y sin declarar el diseno.
p_dis <- svymean(~everviol, dis_sy)
p_ing <- mean(sy$everviol)
ee_ing <- sqrt(p_ing * (1 - p_ing) / nrow(sy))
round(c(p_diseno = as.numeric(coef(p_dis)), ee_diseno = as.numeric(SE(p_dis)),
        p_ingenua = p_ing, ee_ingenuo = ee_ing,
        factor = as.numeric(SE(p_dis)) / ee_ing), 5)
# La estimacion puntual se mueve poco (0.61275 ponderada contra 0.62228 sin
# ponderar, un punto porcentual) pero el error estandar se multiplica por
# 2.4 al declarar el diseno. La estimacion puntual perdona; la incertidumbre
# no: un intervalo de +/-1.9 puntos se convierte en uno de +/-4.5.
#>   p_diseno  ee_diseno  p_ingenua ee_ingenuo     factor 
#>    0.61275    0.02274    0.62228    0.00947    2.40119 

cat("\n###BLOQUE-R16###\n")
# EJERCICIO 2. Con ipums (9 estratos, 10 PSU cada uno), estimar el ingreso
# medio de los adultos y medir el deff. Ojo con dos trampas del archivo.
ip <- read.csv("CSV data sets for SDA 3e/ipums.csv")
ip_ad <- subset(ip, inctot >= 0 & age >= 18)   # hay 110 ingresos negativos
ip_ad$peso <- 1                                # ipums viene autoponderado
dis_ip <- svydesign(id = ~psu, strata = ~stratum, weights = ~peso,
                    data = ip_ad, nest = TRUE)
m_ip <- svymean(~inctot, dis_ip, deff = TRUE)
m_ip
# TRAMPA: el DEff sale Inf. survey lo calcula contra un MAS *con fpc*, y sin
# declarar fpc no tiene el N poblacional. El deff se calcula a mano:
ee_srs <- sd(ip_ad$inctot) / sqrt(nrow(ip_ad))
round(c(n = nrow(ip_ad), gl = degf(dis_ip), ee_diseno = as.numeric(SE(m_ip)),
        ee_srs = ee_srs, deff = (as.numeric(SE(m_ip)) / ee_srs)^2,
        n_efectivo = nrow(ip_ad) / (as.numeric(SE(m_ip)) / ee_srs)^2), 2)
# 49 692 personas con 81 grados de libertad y deff 10.6: rinden como 4 695.
# El tamano nominal de una encuesta compleja dice muy poco de su precision.
#>           mean      SE DEff
#> inctot 9849.54  159.38  Inf
#>          n         gl  ee_diseno     ee_srs       deff n_efectivo 
#>   49692.00      81.00     159.38      48.99      10.58    4694.58 

cat("\n###BLOQUE-R17###\n")
# EJERCICIO 3. Con integerwt (2 000 observaciones en 4 estratos), calcular la
# media estratificada a mano y con survey. Es el capitulo 4 revisitado con el
# vocabulario de este: pesos = N_h/n_h, y el fpc por estrato.
iw <- read.csv("CSV data sets for SDA 3e/integerwt.csv")
Nh <- c(3000, 3000, 2000, 2000)                # tamanos de estrato supuestos
nh_e <- as.numeric(table(iw$stratum))
nh_e
iw$peso <- (Nh / nh_e)[iw$stratum]
iw$fpc <- Nh[iw$stratum]
dis_iw <- svydesign(id = ~1, strata = ~stratum, weights = ~peso, fpc = ~fpc,
                    data = iw)
m_iw <- svymean(~y, dis_iw)
# A mano, con la formula del capitulo 4:
medias_h <- tapply(iw$y, iw$stratum, mean)
s2_h <- tapply(iw$y, iw$stratum, var)
Wh <- Nh / sum(Nh)
round(c(a_mano = sum(Wh * medias_h),
        ee_a_mano = sqrt(sum(Wh^2 * (1 - nh_e / Nh) * s2_h / nh_e)),
        survey = as.numeric(coef(m_iw)), ee_survey = as.numeric(SE(m_iw))), 5)
# Identicos: el diseno estratificado del capitulo 4 es un caso particular del
# vocabulario de este — pesos y fpc declarados, survey hace el resto.
#> [1] 200 800 400 600
#>    a_mano ee_a_mano    survey ee_survey 
#>  20.57700   0.12853  20.57700   0.12853 

cat("\n###BLOQUE-R18###\n")
# EJERCICIO 4. Replicar el jackknife del modulo 5 sobre SYC, que tiene una
# estructura opuesta a NHANES: de 7 a 154 PSU por estrato en vez de 2 fijas.
# Sigue funcionando el mismo procedimiento?
theta_sy <- as.numeric(coef(svymean(~age, dis_sy)))
psus_sy <- unique(sy[, c("stratum", "psu")])
reps_sy <- numeric(nrow(psus_sy))
for (i in seq_len(nrow(psus_sy))) {
  h <- psus_sy$stratum[i]
  n_h <- sum(psus_sy$stratum == h)             # AQUI cambia: n_h varia por estrato
  fuera <- sy$stratum == h & sy$psu == psus_sy$psu[i]
  dentro <- sy$stratum == h & !fuera
  w2 <- sy$finalwt
  w2[fuera] <- 0
  w2[dentro] <- w2[dentro] * n_h / (n_h - 1)
  reps_sy[i] <- weighted.mean(sy$age, w2)
}
v_sy <- 0
for (h in unique(psus_sy$stratum)) {
  idx <- which(psus_sy$stratum == h)
  v_sy <- v_sy + (length(idx) - 1) / length(idx) * sum((reps_sy[idx] - theta_sy)^2)
}
dis_sy_jk <- as.svrepdesign(dis_sy, type = "JKn")
round(c(replicas = nrow(psus_sy), ee_a_mano = sqrt(v_sy),
        ee_survey_JKn = as.numeric(SE(svymean(~age, dis_sy_jk))),
        ee_linealizacion = as.numeric(SE(svymean(~age, dis_sy)))), 6)
# El mismo codigo, con n_h calculado por estrato en vez de fijo en 2, y las
# tres vias vuelven a coincidir. 861 replicas contra las 30 de NHANES: el
# jackknife escala con el numero de PSU, y ahi el BRR (que necesita 2 por
# estrato) ni siquiera es aplicable.
#>         replicas        ee_a_mano    ee_survey_JKn ee_linealizacion 
#>       861.000000         0.130106         0.130106         0.128882 

