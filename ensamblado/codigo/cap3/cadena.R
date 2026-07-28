suppressMessages({library(survey); library(sampling); library(TeachingSampling); library(jsonlite)})
Sys.setlocale("LC_CTYPE", "en_US.UTF-8")
options(warn = 1, survey.lonely.psu = "adjust")

cat("\n###BLOQUE-R1###\n")
# La muestra del capitulo 2: 300 condados de los 3078, tomados al azar simple.
# Lo nuevo es que ahora se dispone de una variable AUXILIAR conocida para toda
# la poblacion: acres87, la superficie sembrada en el censo anterior.
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
# De donde sale la ganancia: la desviacion de los residuos frente a la de y.
round(c(sd_y = sd(agsrs$acres92), sd_residuos = s_e,
        reduccion_pct = 100 * (1 - s_e / sd(agsrs$acres92)),
        veces_mas_eficiente = (as.numeric(SE(exp_sv)[1]) / ee_razon)^2), 4)
#>                sd_y         sd_residuos       reduccion_pct veces_mas_eficiente 
#>         344551.8948          31657.2182             90.8121            110.2327 
cat("\n###BLOQUE-R5###\n")
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
cat("\n###BLOQUE-R9###\n")
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
cat("\n###BLOQUE-R10###\n")
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
dif <- deadtrees$field - deadtrees$photo
reg <- lm(field ~ photo, data = deadtrees)
round(c(media_muestral_y = mean(deadtrees$field),
        por_diferencia = xbarU + mean(dif),
        ee_diferencia = sqrt((1 - n_dt / N_dt) * var(dif) / n_dt),
        por_regresion = as.numeric(coef(reg)[1] + coef(reg)[2] * xbarU)), 4)
#> media_muestral_y   por_diferencia    ee_diferencia    por_regresion 
#>          11.5600          12.2600           0.4568          11.9893 
