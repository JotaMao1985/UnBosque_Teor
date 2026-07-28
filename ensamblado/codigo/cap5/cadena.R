suppressMessages({library(survey); library(sampling); library(TeachingSampling); library(jsonlite)})
Sys.setlocale("LC_CTYPE", "en_US.UTF-8")
options(warn = 1, survey.lonely.psu = "adjust")

cat("\n###BLOQUE-R1###\n")
# La poblacion del curso, reagrupada: los 3078 condados viven en 50 estados.
# Un estado es un CONGLOMERADO natural: si el presupuesto obliga a visitar
# pocos estados, la muestra son estados enteros, no condados sueltos.
agpop <- read.csv("CSV data sets for SDA 3e/agpop.csv")
N <- nrow(agpop)
NI <- length(unique(agpop$state))
c(condados = N, estados = NI, rango_Mi = range(table(agpop$state)))
#>  condados   estados rango_Mi1 rango_Mi2
#>      3078        50         3       254

# La pregunta clave: cuanto se parecen los condados DEL MISMO estado?
# La ICC ajustada de Lohr compara la varianza dentro con la total:
#   R_a = 1 - MSW / S^2.  Cerca de 0: conglomerar casi gratis. Cerca de 1: carisimo.
MSW <- sum(tapply(agpop$acres92, agpop$state,
                  function(y) sum((y - mean(y))^2))) / (N - NI)
Ra <- 1 - MSW / var(agpop$acres92)
round(c(MSW = MSW, S2 = var(agpop$acres92), Ra = Ra), 4)
#>          MSW           S2           Ra
#> 9.464144e+10 1.803588e+11 4.753000e-01

cat("\n###BLOQUE-R2###\n")
# La notacion de dos niveles, sobre la encuesta escolar de Lohr (schools):
# N = 75 escuelas (UPM), de cada escuela sorteada se toman m_i = 20 de sus
# M_i estudiantes (USM). La probabilidad de inclusion es un PRODUCTO:
#   pi_k = (n/N) * (m_i/M_i),   y el peso, el producto de los reciprocos.
schools <- read.csv("CSV data sets for SDA 3e/schools.csv")
n_sc <- length(unique(schools$schoolid))
Mi <- tapply(schools$Mi, schools$schoolid, unique)
data.frame(escuela = names(Mi)[1:5], Mi = as.numeric(Mi)[1:5],
           pi1 = round(10 / 75, 4), pi2 = round(20 / as.numeric(Mi)[1:5], 4),
           peso = round((75 / 10) * as.numeric(Mi)[1:5] / 20, 3))
#>   escuela  Mi    pi1    pi2    peso
#> 1       9 163 0.1333 0.1227  61.125
#> 2      17 180 0.1333 0.1111  67.500
#> 3      18 114 0.1333 0.1754  42.750
#> 4      22 367 0.1333 0.0545 137.625
#> 5      35 109 0.1333 0.1835  40.875

# El archivo ya trae ese peso en finalwt; la cuenta lo reconstruye exacto:
max(abs((75 / 10) * schools$Mi / 20 - schools$finalwt))
#> [1] 0

cat("\n###BLOQUE-R3###\n")
# El caso mas simple: una etapa, conglomerados de igual tamano. gpa: 5 suites
# de 4 estudiantes, sorteadas de N = 100. La UNIDAD DE MUESTREO es la suite
# entera: el estimador trabaja con los TOTALES por suite.
gpa <- read.csv("CSV data sets for SDA 3e/gpa.csv")
t_i <- tapply(gpa$gpa, gpa$suite, sum)
round(t_i, 2)
#>     1     2     3     4     5
#> 12.16 11.36  8.96 12.96 11.08

ybar_cl <- sum(t_i) / (5 * 4)
V_cl <- (1 - 5 / 100) * var(t_i) / (5 * 4^2)
round(c(media = ybar_cl, ee = sqrt(V_cl)), 4)
#>  media     ee
#> 2.8260 0.1637

cat("\n###BLOQUE-R4###\n")
# survey, y el espejismo de tratarla como MAS de 20 estudiantes:
gpa$fpc <- 100
dis_gpa <- svydesign(id = ~suite, weights = ~wt, fpc = ~fpc, data = gpa)
svymean(~gpa, dis_gpa)
#>      mean     SE
#> gpa 2.826 0.1637

# El "ee" ingenuo del MAS imaginario:
round(sqrt((1 - 20 / 400) * var(gpa$gpa) / 20), 4)
#> [1] 0.1122
# 0.1122 contra 0.1637: el diseno real tiene un 46 % mas de error del que
# el analisis ingenuo declararia. Ese es el pecado tipico con conglomerados:
# intervalos DEMASIADO ESTRECHOS, lo contrario que olvidar el fpc.

cat("\n###BLOQUE-R5###\n")
# De donde sale ese castigo? De que los companeros de suite se parecen.
# algebra: 12 clases (de N = 187) con TODOS sus estudiantes medidos.
algebra <- read.csv("CSV data sets for SDA 3e/algebra.csv")
K <- nrow(algebra)
SSW_a <- sum(tapply(algebra$score, algebra$class, function(y) sum((y - mean(y))^2)))
SST_a <- sum((algebra$score - mean(algebra$score))^2)
icc <- 1 - (K / (K - 1)) * SSW_a / SST_a
Mbar <- mean(tapply(algebra$Mi, algebra$class, unique))
round(c(K = K, icc = icc, Mbar = Mbar, deff_teorico = 1 + (Mbar - 1) * icc), 4)
#>            K          icc         Mbar deff_teorico
#>     299.0000       0.0720      24.9167       2.7218

cat("\n###BLOQUE-R6###\n")
# Con el diseno declarado, survey hace la cuenta correcta:
algebra$peso <- 187 / 12
algebra$fpc <- 187
dis_alg <- svydesign(id = ~class, weights = ~peso, fpc = ~fpc, data = algebra)
svymean(~score, dis_alg)
#>         mean     SE
#> score 62.569 1.4916

# deff empirico: cuanto peor que un MAS imaginario de 299 estudiantes
ee_naive <- sd(algebra$score) / sqrt(K)
round(c(ee_naive = ee_naive, deff = (SE(svymean(~score, dis_alg))[1] / ee_naive)^2), 4)
#> ee_naive     deff
#>   1.0291   2.1009

cat("\n###BLOQUE-R7###\n")
# Conglomerados de tamano desigual: coots. 184 nidadas; de cada una se
# midieron 2 de sus csize huevos. El estimador de razon pondera cada nidada
# por su tamano: estima el volumen medio POR HUEVO de la poblacion de huevos.
coots <- read.csv("CSV data sets for SDA 3e/coots.csv")
coots$w <- coots$csize / 2                 # cada huevo habla por csize/2
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

# Los dos espejismos: la media por huevo medido (= media de medias, porque
# aqui todas las nidadas aportan 2) estima OTRO parametro.
round(c(media_por_huevo_medido = mean(coots$volume)), 4)
#> media_por_huevo_medido
#>                 2.3334
# 2.33 contra 2.49: los huevos de nidadas grandes son mas grandes, y la
# media ingenua les niega el peso que tienen en la poblacion.

cat("\n###BLOQUE-R8###\n")
# survey reproduce la razon exacta con pesos por huevo:
dis_coots <- svydesign(id = ~clutch, weights = ~w, data = coots)
svymean(~volume, dis_coots)
#>          mean    SE
#> volume 2.4908 0.061

# Nota de auditoria sobre el archivo oficial: la nidada 88 trae csize
# inconsistente entre sus dos huevos (9 y 11). Se pondera cada huevo con su
# propio csize, que es la convencion de Lohr con este archivo.
coots[coots$clutch == 88, c("clutch", "csize", "volume")]
#>     clutch csize   volume
#> 175     88     9 1.854996
#> 176     88    11 2.841593

cat("\n###BLOQUE-R9###\n")
# Dos etapas de verdad: schools. Etapa 1: MAS de 10 escuelas entre 75.
# Etapa 2: MAS de 20 estudiantes dentro de cada una. El estimador del total
# expande cada escuela a su total estimado y luego expande las escuelas.
yb_i <- tapply(schools$math, schools$schoolid, mean)
s2_i <- tapply(schools$math, schools$schoolid, var)
t_i <- Mi * yb_i                            # total estimado de cada escuela
t_2e <- 75 / 10 * sum(t_i)

# La varianza tiene DOS sumandos, uno por etapa:
V_entre  <- 75^2 * (1 - 10 / 75) * var(t_i) / 10
V_dentro <- 75 / 10 * sum(Mi^2 * (1 - 20 / Mi) * s2_i / 20)
round(c(total = t_2e, ee = sqrt(V_entre + V_dentro)), 1)
#>    total       ee
#> 572116.1  51899.8
round(c(entre_pct = 100 * V_entre / (V_entre + V_dentro),
        dentro_pct = 100 * V_dentro / (V_entre + V_dentro)), 1)
#>  entre_pct dentro_pct
#>       99.2        0.8

cat("\n###BLOQUE-R10###\n")
# survey con las dos etapas declaradas (id y fpc con dos terminos):
schools$stu <- ave(schools$math, schools$schoolid, FUN = seq_along)
schools$fpc1 <- 75
dis_sc <- svydesign(id = ~schoolid + stu, fpc = ~fpc1 + Mi, data = schools)
svytotal(~math, dis_sc)
#>       total    SE
#> math 572116 51900
svymean(~math, dis_sc)
#>        mean     SE
#> math 33.123 1.6605

cat("\n###BLOQUE-R11###\n")
# La tercera via, de Gutierrez: E.2SI hace el mismo estimador SI-SI.
res <- E.2SI(75, 10, as.numeric(Mi), 20, schools$math,
             as.factor(schools$schoolid))
round(res[, "y"], 2)
#>     Estimation Standard Error            CVE           DEFF
#>      572116.13       51899.80           9.07          13.69
# Identico al calculo a mano y a survey: 572116.12 con ee 51899.80.

cat("\n###BLOQUE-R12###\n")
# El costo optimo por etapas (Lohr 5.4): con costo c1 por conglomerado y c2
# por unidad, el m optimo solo depende de la ICC y del cociente de costos:
#   m_opt = sqrt( c1 (1 - icc) / (c2 icc) )
# Con la ICC de las zonas de BigLucy (0.2166) y c1 = 50, c2 = 2:
icc_z <- 0.2166
c1 <- 50; c2 <- 2
m_opt <- sqrt(c1 * (1 - icc_z) / (c2 * icc_z))
n_opt <- 5000 / (c1 + c2 * m_opt)           # presupuesto C = 5000
round(c(m_opt = m_opt, n_opt = n_opt, unidades = m_opt * n_opt), 1)
#>    m_opt    n_opt unidades
#>      9.5     72.4    688.9

# Con ICC alta el m optimo cae: si los vecinos se repiten, comprar mas
# vecinos es comprar la misma informacion dos veces.
round(sqrt(c1 * (1 - c(0.05, 0.2, 0.5, 0.8)) / (c2 * c(0.05, 0.2, 0.5, 0.8))), 1)
#> [1] 21.8 10.0  5.0  2.5

cat("\n###BLOQUE-R13###\n")
# Estratos Y conglomerados a la vez: region como estrato, estado como UPM.
# Dos estados por region, todos sus condados; el estimador estratifica las
# razones por region con los pesos W_h del capitulo 4.
set.seed(2026)
regiones <- c("NC", "NE", "S", "W")
Wh <- as.numeric(table(agpop$region)[regiones]) / N
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

# El precalculo repitio esto 5000 veces: la varianza del combinado es casi
# la MITAD de la del conglomerado puro (6.9e9 contra 12.9e9). Los estratos
# no dejan que el azar concentre los 8 estados en una sola punta del pais.

cat("\n###BLOQUE-R14###\n")
# La misma ICC del modulo 4, vista como modelo mixto (conexion con ciencia
# de datos): un intercepto aleatorio por clase parte la varianza en dos.
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
# 0.0426 contra 0.0720 del ANOVA: no es un error. lmer estima la ICC de un
# MODELO de superpoblacion (REML, encogimiento incluido) y el ANOVA describe
# esta poblacion finita. Dos preguntas distintas, dos numeros distintos.

cat("\n###BLOQUE-R15###\n")
# EJERCICIO 1. algebra con el diseno ignorado y con el diseno declarado:
# cuantifica el optimismo del intervalo ingenuo.
ic_naive <- mean(algebra$score) + c(-1.96, 1.96) * sd(algebra$score) / sqrt(299)
ic_bueno <- coef(svymean(~score, dis_alg))[1] +
  c(-1.96, 1.96) * SE(svymean(~score, dis_alg))[1]
round(rbind(ingenuo = ic_naive, con_diseno = ic_bueno), 2)
#>             [,1]  [,2]
#> ingenuo    60.55 64.59
#> con_diseno 59.65 65.49
round((ic_bueno[2] - ic_bueno[1]) / (ic_naive[2] - ic_naive[1]), 2)
#> [1] 1.45
# El intervalo honesto es un 45 % mas ancho: la raiz del deff 2.10.

cat("\n###BLOQUE-R16###\n")
# EJERCICIO 2. La longitud media del huevo de focha, con el mismo diseno de
# razon de coots. (La variable cambia; el diseno y el codigo, no.)
sv_len <- svymean(~length, dis_coots)
sv_len
#>          mean     SE
#> length 48.649 0.1293
confint(sv_len)
#>           2.5 %   97.5 %
#> length 48.39558 48.90234
round(mean(coots$length), 3)
#> [1] 48.634
# Sorpresa instructiva: 48.634 contra 48.649 — aqui la razon y la ingenua
# casi coinciden. La correccion del volumen era grande porque el volumen
# crece con el tamano de la nidada; la longitud apenas. La ponderacion
# importa exactamente cuanto se correlacionen y_k y M_i, ni mas ni menos.

cat("\n###BLOQUE-R17###\n")
# EJERCICIO 3. El total de la prueba de LECTURA en las 75 escuelas, por las
# tres vias del modulo 6. Deben coincidir hasta el ultimo decimal.
t_lec <- 75 / 10 * sum(Mi * tapply(schools$reading, schools$schoolid, mean))
s2_lec <- tapply(schools$reading, schools$schoolid, var)
V_lec <- 75^2 * (1 - 10 / 75) * var(Mi * tapply(schools$reading, schools$schoolid, mean)) / 10 +
  75 / 10 * sum(Mi^2 * (1 - 20 / Mi) * s2_lec / 20)
round(c(a_mano = t_lec, ee = sqrt(V_lec)), 1)
#>   a_mano       ee
#> 528609.8  53350.7
svytotal(~reading, dis_sc)
#>          total    SE
#> reading 528610 53351
res_lec <- E.2SI(75, 10, as.numeric(Mi), 20, schools$reading,
                 as.factor(schools$schoolid))
round(res_lec[, "y"], 1)
#>     Estimation Standard Error            CVE           DEFF
#>       528609.8        53350.7           10.1           25.5

cat("\n###BLOQUE-R18###\n")
# EJERCICIO 4. Disena la segunda etapa: con c1 = 100, c2 = 4 y C = 8000,
# cuantos conglomerados y de que tamano? Compara el m optimo con m = 40
# usando la varianza aproximada V proporcional a (1 + (m-1) icc) / (n m).
icc_z <- 0.2166; c1 <- 100; c2 <- 4; C <- 8000
m_star <- sqrt(c1 * (1 - icc_z) / (c2 * icc_z))
V_rel <- function(m) {
  n <- C / (c1 + c2 * m)
  (1 + (m - 1) * icc_z) / (n * m)
}
round(c(m_opt = m_star, n_opt = C / (c1 + c2 * m_star)), 1)
#> m_opt n_opt
#>   9.5  58.0
round(c(doblar_pct = 100 * (V_rel(2 * m_star) / V_rel(m_star) - 1),
        m40_pct = 100 * (V_rel(40) / V_rel(m_star) - 1)), 1)
#> doblar_pct    m40_pct
#>       10.0       48.8
# La curva es plana CERCA del optimo (doblar m cuesta un 10 %) pero castiga
# lejos de el (m = 40 cuesta un 49 %): con ICC = 0.22, comprar 40 vecinos
# por conglomerado es comprar la misma informacion muchas veces.
