suppressMessages({library(survey); library(sampling); library(TeachingSampling); library(jsonlite)})
Sys.setlocale("LC_CTYPE", "en_US.UTF-8")
options(warn = 1, survey.lonely.psu = "adjust")

cat("\n###BLOQUE-R1###\n")
# La muestra del capitulo 2: 300 condados de los 3078, tomados al azar simple.
# Lo nuevo es que ahora se dispone de una variable AUXILIAR conocida para toda
# la poblacion: acres87, la superficie sembrada en el censo anterior.
library(survey)               # todo el capitulo corre sobre este paquete: sin
                              # esta linea, svydesign() y las demas no existen
options(scipen = 999)         # los totales son de nueve cifras: sin esto R los
                              # imprime en notacion cientifica y no se leen
agpop <- read.csv("CSV data sets for SDA 3e/agpop.csv")
agsrs <- read.csv("CSV data sets for SDA 3e/agsrs.csv")
N <- nrow(agpop); n <- nrow(agsrs)

t_x <- sum(agpop$acres87)     # se conoce: es un censo anterior
t_y <- sum(agpop$acres92)     # NO se conoceria en la practica; aqui sirve de juez
round(c(N = N, n = n, t_x = t_x, t_y = t_y,
        correlacion = cor(agsrs$acres87, agsrs$acres92)), 6)
#>                N                n              t_x              t_y
#>      3078.000000       300.000000 963464412.000000 943951718.000000
#>      correlacion
#>         0.995806
cat("\n###BLOQUE-R2###\n")
# Sin la auxiliar, el estimador de expansion. Con ella, el de razon.
dis <- svydesign(id = ~1, fpc = rep(N, n), data = agsrs)
exp_sv <- svytotal(~acres92, dis)

B <- mean(agsrs$acres92) / mean(agsrs$acres87)
t_razon <- B * t_x
raz_sv <- svyratio(~acres92, ~acres87, dis)

ee_razon <- as.numeric(SE(raz_sv)[1]) * t_x
round(c(expansion = as.numeric(coef(exp_sv)), ee_expansion = as.numeric(SE(exp_sv)[1]),
        B = B, razon = t_razon, ee_razon = ee_razon), 4)
#>      expansion   ee_expansion              B          razon       ee_razon
#> 916927109.6400  58169381.1695         0.9866 950520496.1040   5540375.7938
cat("\n###BLOQUE-R3###\n")
# La misma cifra por las dos vias: survey y la formula de Lohr, que se apoya en
# la desviacion de los RESIDUOS respecto de la recta por el origen.
e <- agsrs$acres92 - B * agsrs$acres87
s_e <- sqrt(sum(e^2) / (n - 1))
ee_mano <- (t_x / mean(agsrs$acres87)) * sqrt(1 - n / N) * s_e / sqrt(n)
round(c(s_e = s_e, ee_a_mano = ee_mano, ee_survey = ee_razon), 4)
#>        s_e  ee_a_mano  ee_survey
#>   31657.22 5540375.79 5540375.79

signif(abs(ee_mano - ee_razon) / ee_mano, 3)      # discrepancia relativa
#> [1] 0.000000000000000168
cat("\n###BLOQUE-R4###\n")
# De donde sale la ganancia, sin funciones de encuestas: los dos errores
# estandar son los del MAS del capitulo 2, uno construido con s_y y el otro con
# s_e, asi que su cociente se escribe termino a termino.
sd_y <- sd(agsrs$acres92)
ee_expansion <- N * sqrt(1 - n / N) * sd_y / sqrt(n)   # = SE(exp_sv) del R2
# Y el de la razon es el ee_mano del bloque anterior. Ojo al ultimo par de
# cifras: el factor entre los dos ESTIMADORES no es el cuadrado de la reduccion
# de desviaciones, porque ee_mano lleva ademas t_x / media(x) donde este lleva N.
round(c(sd_y = sd_y, sd_residuos = s_e,
        reduccion_pct = 100 * (1 - s_e / sd_y),
        factor_desviaciones = (sd_y / s_e)^2,
        correccion_tx = (N * mean(agsrs$acres87) / t_x)^2,
        factor_estimadores = (ee_expansion / ee_mano)^2), 4)
#>                sd_y         sd_residuos       reduccion_pct factor_desviaciones
#>         344551.8948          31657.2182             90.8121            118.4578
#>       correccion_tx  factor_estimadores
#>              0.9306            110.2327

# Y si hay ganancia o no, que es otra pregunta. La razon le gana a la EXPANSION
# -a nadie mas- cuando r > (1/2) CV(x) / CV(y). Se evalua en las dos nubes que
# usa el simulador de este modulo.
cherry <- read.csv("CSV data sets for SDA 3e/cherry.csv")
umbral <- function(aux, obj) 0.5 * (sd(aux) / mean(aux)) / (sd(obj) / mean(obj))
round(rbind(
  agsrs  = c(r = cor(agsrs$acres87, agsrs$acres92),
             umbral = umbral(agsrs$acres87, agsrs$acres92)),
  cherry = c(r = cor(cherry$diameter, cherry$volume),
             umbral = umbral(cherry$diameter, cherry$volume))), 4)
#>             r umbral
#> agsrs  0.9958 0.4937
#> cherry 0.9671 0.2174
cat("\n###BLOQUE-R5###\n")
# Antes de soltar el origen conviene preguntar si hace falta. Se ajusta la recta
# libre y se CONTRASTA su intercepto: si no se distingue de cero, la recta por el
# origen -y con ella el estimador de razon- es defendible sobre estos datos.
# Dos vias, porque el contraste de lm() supone observaciones iid y aqui hay un
# diseno muestral detras: svyglm lo repite sobre el objeto de diseno.
ajuste    <- lm(acres92 ~ acres87, data = agsrs)
ajuste_sv <- svyglm(acres92 ~ acres87, design = dis)
round(rbind(mco    = summary(ajuste)$coefficients[1, ],
            diseno = summary(ajuste_sv)$coefficients[1, ]), 4)
#>         Estimate Std. Error t value Pr(>|t|)
#> mco    -2548.117   2424.954 -1.0508   0.2942
#> diseno -2548.117   2653.927 -0.9601   0.3378

# Estimador de regresion: no obliga a que la recta pase por el origen.
b1 <- cov(agsrs$acres87, agsrs$acres92) / var(agsrs$acres87)
b0 <- mean(agsrs$acres92) - b1 * mean(agsrs$acres87)
t_regresion <- N * (mean(agsrs$acres92) + b1 * (t_x / N - mean(agsrs$acres87)))

# En survey, el estimador de regresion ES la calibracion a los totales
# conocidos (N para el intercepto, t_x para la auxiliar).
dis_cal <- calibrate(dis, ~acres87, c(`(Intercept)` = N, acres87 = t_x))
reg_sv <- svytotal(~acres92, dis_cal)
round(c(b0 = b0, b1 = b1, regresion_a_mano = t_regresion,
        regresion_survey = as.numeric(coef(reg_sv)),
        ee_survey = as.numeric(SE(reg_sv)[1])), 6)
#>               b0               b1 regresion_a_mano regresion_survey
#>     -2548.117442         0.995004 950807843.343409 950807843.343408
#>        ee_survey
#>   5593972.160808
cat("\n###BLOQUE-R6###\n")
# Estimador de diferencia: la regresion con la pendiente FIJADA en 1. Se usa
# cuando x e y miden lo mismo en unidades comparables.
d <- agsrs$acres92 - agsrs$acres87
t_diferencia <- t_x + N * mean(d)
ee_diferencia <- N * sqrt((1 - n / N) * var(d) / n)
round(c(media_diferencias = mean(d), diferencia = t_diferencia, ee = ee_diferencia), 4)
#> media_diferencias        diferencia                ee
#>         -4056.677     950977961.220       5329882.042
cat("\n###BLOQUE-R7###\n")
# Los cuatro, juntos y con el total real de juez.
comparacion <- data.frame(
  estimador = c("expansion", "razon", "regresion", "diferencia"),
  total = c(as.numeric(coef(exp_sv)), t_razon, t_regresion, t_diferencia),
  ee    = c(as.numeric(SE(exp_sv)[1]), ee_razon,
            as.numeric(SE(reg_sv)[1]), ee_diferencia))
comparacion$error_pct <- 100 * (comparacion$total - t_y) / t_y
comparacion$eficiencia <- (SE(exp_sv)[1] / comparacion$ee)^2
print(comparacion, row.names = FALSE, digits = 6)
#>   estimador     total       ee error_pct eficiencia
#>   expansion 916927110 58169381 -2.862923      1.000
#>       razon 950520496  5540376  0.695881    110.233
#>   regresion 950807843  5593972  0.726322    108.131
#>  diferencia 950977961  5329882  0.744343    119.111
cat("\n###BLOQUE-R8###\n")
# Ejemplo 7.9 de Portela y Villeta (pp. 235-239): la produccion de tomates en
# tres regiones, con la cosecha de calabacin del ano anterior como auxiliar.
# El libro NO publica los datos: solo los estadisticos por region (su tabla
# 7.8). Todo lo que sigue se reconstruye a partir de ellos, que es exactamente
# lo que se puede hacer cuando la fuente da resumenes y no observaciones.
reg <- data.frame(
  region = c("I", "II", "III"),
  Nh   = c(600, 400, 800),        nh   = c(20, 13, 27),
  ybar = c(368.25, 145, 306.92),  xbar = c(17.7, 32.4, 20.7),
  sx   = c(5.4, 8.8, 9.1),        sy   = c(85.87, 94.7, 162.1),
  sxy  = c(208.66, 100, 1224.3))
reg$xbarU <- c(9120, 11200, 15280) / reg$Nh   # el total auxiliar SI se conoce
reg$R <- reg$ybar / reg$xbar                  # razon muestral del estrato
reg$b <- reg$sxy / reg$sx^2                   # pendiente de minimos cuadrados
reg$r <- reg$sxy / (reg$sx * reg$sy)          # correlacion del estrato
print(cbind(region = reg$region,
            round(reg[, c("Nh", "nh", "xbarU", "R", "b", "r")], 4)),
      row.names = FALSE)
#>  region  Nh nh xbarU       R       b    r
#>       I 600 20  15.2 20.8051  7.1557 0.45
#>      II 400 13  28.0  4.4753  1.2913 0.12
#>     III 800 27  19.1 14.8271 14.7844 0.83

# Los TRES estimadores de la media en cada estrato, cada uno con su varianza
# estimada. Son las formulas del capitulo, aplicadas por separado.
fpc <- (reg$Nh - reg$nh) / (reg$Nh * reg$nh)
est <- data.frame(
  region = reg$region,
  y_mas  = reg$ybar,                                   # expansion: ignora x
  V_mas  = fpc * reg$sy^2,
  y_R    = reg$R * reg$xbarU,                          # razon
  V_R    = fpc * (reg$sy^2 + reg$R^2 * reg$sx^2 - 2 * reg$R * reg$sxy),
  y_reg  = reg$ybar + reg$b * (reg$xbarU - reg$xbar),  # regresion
  V_reg  = fpc * (1 - reg$r^2) * reg$sy^2)
print(round(est[, -1], 2), row.names = FALSE)
#>   y_mas  V_mas    y_R    V_R  y_reg  V_reg
#>  368.25 356.39 316.24 546.81 350.36 284.23
#>  145.00 667.43 125.31 716.25 139.32 657.82
#>  306.92 940.35 283.20 292.59 283.26 292.59

# El criterio del modulo 6 -contrastar si la recta pasa por el origen- rehecho
# desde los estadisticos: b0 = ybar - b*xbar, y su error estandar sale de la
# varianza residual. No hacen falta los datos, solo sus resumenes.
s2e  <- (1 - reg$r^2) * reg$sy^2 * (reg$nh - 1) / (reg$nh - 2)
b0   <- reg$ybar - reg$b * reg$xbar
eeb0 <- sqrt(s2e) * sqrt(1 / reg$nh + reg$xbar^2 / ((reg$nh - 1) * reg$sx^2))
tpen <- reg$r * sqrt(reg$nh - 2) / sqrt(1 - reg$r^2)
print(cbind(region = reg$region, round(data.frame(
  b0 = b0, t_const = b0 / eeb0,
  p_const = 2 * pt(-abs(b0 / eeb0), reg$nh - 2),
  t_pend = tpen, p_pend = 2 * pt(-abs(tpen), reg$nh - 2), R2 = reg$r^2), 4)),
  row.names = FALSE)
#>  region       b0 t_const p_const t_pend p_pend     R2
#>       I 241.5942  3.9087  0.0010 2.1378 0.0465 0.2025
#>      II 103.1612  0.9564  0.3594 0.4009 0.6962 0.0144
#>     III   0.8820  0.0197  0.9844 7.4396 0.0000 0.6889

# Decidido el metodo en cada estrato, el total se suma. Y las varianzas TAMBIEN
# se suman, porque el muestreo es independiente entre estratos: esa es la
# propiedad que hace legitimo mezclar estimadores distintos.
elegido <- c("regresion", "expansion", "razon")
media   <- c(est$y_reg[1], est$y_mas[2], est$y_R[3])
varianza<- c(est$V_reg[1], est$V_mas[2], est$V_R[3])
total   <- reg$Nh * media
v_total <- reg$Nh^2 * varianza
print(data.frame(region = reg$region, elegido, media = round(media, 2),
                 total = round(total), ee_total = round(sqrt(v_total), 1)),
      row.names = FALSE)
#>  region   elegido  media  total ee_total
#>       I regresion 350.36 210216  10115.4
#>      II expansion 145.00  58000  10333.9
#>     III     razon 283.20 226557  13684.3
N_pob <- sum(reg$Nh)
round(c(total = sum(total), ee_total = sqrt(sum(v_total)),
        media = sum(total) / N_pob, V_media = sum(v_total) / N_pob^2,
        ee_media = sqrt(sum(v_total)) / N_pob), 2)
#>     total  ee_total     media   V_media  ee_media
#> 494773.83  19909.06    274.87    122.34     11.06

cat("\n###BLOQUE-R9###\n")
# Dominios: subpoblaciones cuyo tamano NO se conoce de antemano. El tamano de
# muestra en cada dominio es aleatorio, y eso cambia la formula de la varianza.
agsrs$dom <- ifelse(agsrs$farms92 >= 600, "600 o mas granjas", "menos de 600")
dis2 <- svydesign(id = ~1, fpc = rep(N, n), data = agsrs)
print(svyby(~acres92, ~dom, dis2, svymean), digits = 7)
#>                                 dom  acres92       se
#> 600 o mas granjas 600 o mas granjas 316565.7 21553.21
#> menos de 600           menos de 600 283813.7 28852.24

# A mano: la media de dominio es una RAZON, y su error estandar sale de
# linealizarla. El residuo linealizado es ind * (y - ybar_d).
por_mano <- sapply(unique(agsrs$dom), function(dd) {
  ind <- as.numeric(agsrs$dom == dd)
  nd <- sum(ind); ybar_d <- sum(agsrs$acres92 * ind) / nd
  u <- ind * (agsrs$acres92 - ybar_d)
  c(media = ybar_d, ee = sqrt((1 - n / N) / n) * sd(u) / (nd / n))
})
round(por_mano, 4)
#>       600 o mas granjas menos de 600
#> media         316565.65    283813.71
#> ee             21553.21     28852.24

# El TOTAL de dominio depende de si se conoce N_d. Si NO se conoce, se define
# u = y * ind y se estima su total: el tamano del dominio deja de ser un dato y
# pasa a estimarse tambien, y esa incertidumbre entra en el error estandar.
dis2    <- update(dis2, u1 = acres92 * (dom == "600 o mas granjas"))
med     <- svyby(~acres92, ~dom, dis2, svymean, covmat = TRUE)
Nd_real <- sum(agpop$farms92 >= 600)           # agpop es censo: aqui SI se sabe
tot_dom <- rbind(
  "N_d desconocido" = c(total = coef(svytotal(~u1, dis2)),
                        ee    = SE(svytotal(~u1, dis2))),
  "N_d conocido"    = c(total = Nd_real * coef(med)[1],
                        ee    = Nd_real * SE(med)[1]))
round(cbind(tot_dom, ee_rel = 100 * tot_dom[, 2] / tot_dom[, 1]), 2)
#>                  total.u1       ee ee_rel
#> N_d desconocido 418987302 38938277   9.29
#> N_d conocido    423564841 28838198   6.81

# Y la diferencia entre dos medias de dominio: survey calcula la covarianza,
# que en m.a.s. es practicamente nula porque cada condado cae en un dominio
# o en el otro, nunca en los dos.
dif <- svycontrast(med, quote(`600 o mas granjas` - `menos de 600`))
print(dif)
#>          nlcon    SE
#> contrast 32752 36014
options(scipen = 0)   # R1 fijo scipen = 999; aqui estorba para ver un cero
c(cov_estimada = vcov(med)[1, 2],
  ee_si_cov_0  = sqrt(sum(SE(med)^2)))
options(scipen = 999)
#>  cov_estimada   ee_si_cov_0
#> -1.372644e-22  3.601379e+04
cat("\n###BLOQUE-R10###\n")
# El estimador general de regresion (GREG) con una auxiliar:
#   t_greg = t_pi + beta (t_x - t_x_pi)
# Cambiar el modelo de trabajo cambia beta, y con ello el estimador. Los tres
# del capitulo son tres elecciones de la varianza del modelo, v_k.
pos <- agsrs$acres87 > 0        # 1/x_k pide x_k positivo (Lohr hace lo mismo)
greg <- function(vk) {
  w <- 1 / vk
  beta <- sum((w * agsrs$acres87 * agsrs$acres92)[pos]) / sum((w * agsrs$acres87^2)[pos])
  c(beta = beta, total = N * mean(agsrs$acres92) + beta * (t_x - N * mean(agsrs$acres87)))
}
round(rbind(
  `v_k = x_k  (razon)`      = greg(agsrs$acres87),
  `v_k = 1    (homocedastico)` = greg(rep(1, n)),
  `beta = 1   (diferencia)` = c(beta = 1, total = N * mean(agsrs$acres92) +
                                  1 * (t_x - N * mean(agsrs$acres87)))), 6)
#>                                beta     total
#> v_k = x_k  (razon)         0.986565 950520496
#> v_k = 1    (homocedastico) 0.991335 950682899
#> beta = 1   (diferencia)    1.000000 950977961
cat("\n###BLOQUE-R11###\n")
# La mediana no es una funcion lineal de los y_k: no hay formula cerrada. Se
# estima la funcion de distribucion con los pesos y se le pide el cuantil.
w <- rep(N / n, n)
orden <- order(agsrs$acres92)
F_hat <- cumsum(w[orden]) / sum(w)
# La comparacion lleva tolerancia: F vale exactamente 0.5 en la unidad 150,
# pero cumsum()/sum() la deja en 0.4999999999 y sin tolerancia se salta una
# unidad. En Python el redondeo cae al otro lado, asi que sin esto las dos
# pestanas de este capitulo publicarian cuantiles distintos.
mediana_mano <- agsrs$acres92[orden][which(F_hat >= 0.5 - 1e-9)[1]]
# La mediana muestral no es unica cuando F alcanza 0.5 EXACTAMENTE, que pasa
# siempre que n*p es entero: la unidad 150 y la 151 valen las dos de mediana
# segun el convenio. survey lo resuelve con `qrule`, y su valor por defecto
# ("math") elige la 151.
c(a_mano      = mediana_mano,
  survey_hf4  = as.numeric(coef(svyquantile(~acres92, dis, 0.5, qrule = "hf4"))),
  survey_math = as.numeric(coef(svyquantile(~acres92, dis, 0.5, qrule = "math"))),
  real        = as.numeric(quantile(agpop$acres92, 0.5, type = 1)))
#>      a_mano  survey_hf4 survey_math        real
#>      196701      196701      196733      191486
cat("\n###BLOQUE-S1###\n")
# Ejercicio 1 - El total de GRANJAS con la auxiliar farms87.
tx_f <- sum(agpop$farms87)
Bf <- mean(agsrs$farms92) / mean(agsrs$farms87)
razf_sv <- svyratio(~farms92, ~farms87, dis)
expf_sv <- svytotal(~farms92, dis)
round(c(total_real = sum(agpop$farms92),
        expansion = as.numeric(coef(expf_sv)), ee_expansion = as.numeric(SE(expf_sv)[1]),
        razon = Bf * tx_f, ee_razon = as.numeric(SE(razf_sv)[1]) * tx_f,
        correlacion = cor(agsrs$farms87, agsrs$farms92)), 4)
#>   total_real    expansion ee_expansion        razon     ee_razon  correlacion
#> 1925300.0000 1843906.6800   67908.3073 1930836.4997    8208.1013       0.9933
cat("\n###BLOQUE-S2###\n")
# Ejercicio 2 - Cerezos: volumen a partir del diametro. Aqui la recta por el
# origen NO sirve, y el intercepto dice por que.
cherry <- read.csv("CSV data sets for SDA 3e/cherry.csv")
ajuste <- lm(volume ~ diameter, data = cherry)
round(c(B_razon = mean(cherry$volume) / mean(cherry$diameter),
        intercepto = as.numeric(coef(ajuste)[1]), pendiente = as.numeric(coef(ajuste)[2]),
        r2 = summary(ajuste)$r.squared), 4)
#>    B_razon intercepto  pendiente         r2
#>     2.2773   -36.9435     5.0659     0.9353
# El contraste sobre el intercepto -el criterio del modulo 6- aqui no deja lugar
# a dudas, al reves que en agsrs: la recta NO pasa por el origen.
options(scipen = 0)    # el p-valor es tan pequeno que con el scipen del bloque
                       # R1 saldria como 0,000000000007621
signif(summary(ajuste)$coefficients, 4)
#>             Estimate Std. Error t value  Pr(>|t|)
#> (Intercept)  -36.940     3.3650  -10.98 7.621e-12
#> diameter       5.066     0.2474   20.48 8.644e-19
options(scipen = 999)  # se restaura para los totales de nueve cifras
cat("\n###BLOQUE-S3###\n")
# Ejercicio 3 - El dominio "Oeste": media, error estandar y valor real.
oeste <- as.numeric(agsrs$region == "W")
n_W <- sum(oeste)
ybar_W <- sum(agsrs$acres92 * oeste) / n_W
u_W <- oeste * (agsrs$acres92 - ybar_W)
ee_W <- sqrt((1 - n / N) / n) * sd(u_W) / (n_W / n)
round(c(n_dominio = n_W, media_estimada = ybar_W, ee = ee_W,
        media_real = mean(agpop$acres92[agpop$region == "W"]),
        cv_pct = 100 * ee_W / ybar_W), 4)
#>      n_dominio media_estimada             ee     media_real         cv_pct
#>        39.0000    598680.5897     77636.5841    723343.9645        12.9679
cat("\n###BLOQUE-S4###\n")
# Ejercicio 4 - Arboles muertos (Lohr): 100 parcelas fotografiadas (censo de x)
# y 25 verificadas en campo (y). La media por foto de las 100 es 11.3.
deadtrees <- read.csv("CSV data sets for SDA 3e/deadtrees.csv")
N_dt <- 100; n_dt <- nrow(deadtrees); xbarU <- 11.3
# Nombres propios: `reg` y `dif` ya son objetos de los bloques R8 y R9, y quien
# vuelva a ellos despues de mirar esta solucion se encontraria con otra cosa.
dif_dt <- deadtrees$field - deadtrees$photo
reg_dt <- lm(field ~ photo, data = deadtrees)
# El error estandar de la regresion, con el mismo convenio que el modulo 6: los
# residuos de una recta AJUSTADA llevan divisor n-2, no n-1.
s2_dt <- sum(residuals(reg_dt)^2) / (n_dt - 2)
round(c(media_muestral_y = mean(deadtrees$field),
        por_diferencia = xbarU + mean(dif_dt),
        ee_diferencia = sqrt((1 - n_dt / N_dt) * var(dif_dt) / n_dt),
        por_regresion = as.numeric(coef(reg_dt)[1] + coef(reg_dt)[2] * xbarU),
        ee_regresion = sqrt((1 - n_dt / N_dt) * s2_dt / n_dt),
        pendiente = as.numeric(coef(reg_dt)[2]),
        correlacion = cor(deadtrees$photo, deadtrees$field)), 4)
#> media_muestral_y   por_diferencia    ee_diferencia    por_regresion
#>          11.5600          12.2600           0.4568          11.9893
#>     ee_regresion        pendiente      correlacion
#>           0.4168           0.6133           0.6242
