suppressMessages({library(survey); library(sampling); library(TeachingSampling); library(jsonlite)})
Sys.setlocale("LC_CTYPE", "en_US.UTF-8")
options(warn = 1, survey.lonely.psu = "adjust")

cat("\n###BLOQUE-R1###\n")
# Cinco condados. y = superficie sembrada (miles de acres): es lo que se quiere
# estimar y no se conoce antes de muestrear. x = numero de granjas del censo
# anterior: se conoce para TODA la poblacion y por eso puede usarse al disenar.
y <- c(14, 18, 27, 33, 58)
x <- c(1, 1, 2, 2, 4)
N <- 5
n <- 2

muestras <- t(combn(N, n))          # las 10 muestras posibles de tamano 2
c(numero_de_muestras = nrow(muestras), total_poblacional = sum(y), media = mean(y))
#> numero_de_muestras  total_poblacional              media
#>                 10                150                 30

cat("\n###BLOQUE-R2###\n")
# Diseno A - MAS sin reemplazo: las 10 muestras son igual de probables
p_mas <- rep(1 / nrow(muestras), nrow(muestras))

# Diseno B - estratificado: estrato 1 = {1,2,3}, estrato 2 = {4,5}, uno de cada.
# Solo 6 de las 10 muestras son posibles; las otras 4 tienen p(s) = 0.
p_est <- apply(muestras, 1, function(s) if (sum(s <= 3) == 1) 1 / 6 else 0)

# Diseno C - probabilidades desiguales: p(s) proporcional al tamano de la muestra
p_des <- apply(muestras, 1, function(s) sum(x[s]))
p_des <- p_des / sum(p_des)

round(rbind(MAS = p_mas, Estratificado = p_est, Desigual = p_des), 4)
#>               [,1]  [,2]   [,3]   [,4]  [,5]   [,6]   [,7]   [,8]   [,9] [,10]
#> MAS           0.10 0.100 0.1000 0.1000 0.100 0.1000 0.1000 0.1000 0.1000  0.10
#> Estratificado 0.00 0.000 0.1667 0.1667 0.000 0.1667 0.1667 0.1667 0.1667  0.00
#> Desigual      0.05 0.075 0.0750 0.1250 0.075 0.0750 0.1250 0.1000 0.1500  0.15
c(suma_A = sum(p_mas), suma_B = sum(p_est), suma_C = sum(p_des))
#> suma_A suma_B suma_C
#>      1      1      1

cat("\n###BLOQUE-R3###\n")
# pi_k = suma de p(s) sobre todas las muestras que contienen a k
inclusion1 <- function(ps) {
  sapply(1:N, function(k) sum(ps[apply(muestras, 1, function(s) k %in% s)]))
}
pi_mas <- inclusion1(p_mas)
pi_est <- inclusion1(p_est)
pi_des <- inclusion1(p_des)
round(rbind(MAS = pi_mas, Estratificado = pi_est, Desigual = pi_des), 4)
#>                 [,1]   [,2]   [,3] [,4] [,5]
#> MAS           0.4000 0.4000 0.4000  0.4 0.40
#> Estratificado 0.3333 0.3333 0.3333  0.5 0.50
#> Desigual      0.3250 0.3250 0.4000  0.4 0.55
c(suma_A = sum(pi_mas), suma_B = sum(pi_est), suma_C = sum(pi_des))
#> suma_A suma_B suma_C
#>      2      2      2

cat("\n###BLOQUE-R4###\n")
# pi_kl = suma de p(s) sobre las muestras que contienen a k Y a l
inclusion2 <- function(ps) {
  m <- matrix(0, N, N)
  for (i in seq_len(nrow(muestras))) {
    a <- muestras[i, 1]
    b <- muestras[i, 2]
    m[a, b] <- m[a, b] + ps[i]
    m[b, a] <- m[a, b]
  }
  diag(m) <- inclusion1(ps)
  m
}
pikl_est <- inclusion2(p_est)
round(pikl_est, 4)
#>        [,1]   [,2]   [,3]   [,4]   [,5]
#> [1,] 0.3333 0.0000 0.0000 0.1667 0.1667
#> [2,] 0.0000 0.3333 0.0000 0.1667 0.1667
#> [3,] 0.0000 0.0000 0.3333 0.1667 0.1667
#> [4,] 0.1667 0.1667 0.1667 0.5000 0.0000
#> [5,] 0.1667 0.1667 0.1667 0.0000 0.5000

# La fila k, sin la diagonal, tiene que sumar (n-1) * pi_k
round(rbind(fila_menos_diagonal = rowSums(pikl_est) - diag(pikl_est),
            n_menos_1_por_pi    = (n - 1) * pi_est), 4)
#>                       [,1]   [,2]   [,3] [,4] [,5]
#> fila_menos_diagonal 0.3333 0.3333 0.3333  0.5  0.5
#> n_menos_1_por_pi    0.3333 0.3333 0.3333  0.5  0.5

cat("\n###BLOQUE-R5###\n")
# Se observa la muestra {3, 5} bajo el diseno C. El peso de cada unidad es 1/pi_k:
# dice a cuantas unidades de la poblacion representa la que se observo.
obs <- c(3, 5)
pesos <- 1 / pi_des[obs]
round(c(pi_3 = pi_des[3], pi_5 = pi_des[5],
        peso_3 = pesos[1], peso_5 = pesos[2],
        t_HT = sum(y[obs] * pesos)), 4)
#>     pi_3     pi_5   peso_3   peso_5     t_HT
#>   0.4000   0.5500   2.5000   1.8182 172.9545

cat("\n###BLOQUE-R6###\n")
# El estimador HT sobre CADA una de las 10 muestras, y su esperanza exacta.
ht_todas <- function(ps, pis) apply(muestras, 1, function(s) sum(y[s] / pis[s]))
exp_todas <- apply(muestras, 1, function(s) N * mean(y[s]))
esperanzas <- rbind(
  MAS           = c(sum(p_mas * ht_todas(p_mas, pi_mas)), sum(p_mas * exp_todas)),
  Estratificado = c(sum(p_est * ht_todas(p_est, pi_est)), sum(p_est * exp_todas)),
  Desigual      = c(sum(p_des * ht_todas(p_des, pi_des)), sum(p_des * exp_todas))
)
colnames(esperanzas) <- c("E_HT", "E_expansion")
round(cbind(esperanzas, t = sum(y), sesgo_expansion = esperanzas[, 2] - sum(y)), 4)
#>               E_HT E_expansion   t sesgo_expansion
#> MAS            150    150.0000 150          0.0000
#> Estratificado  150    162.9167 150         12.9167
#> Desigual       150    165.7500 150         15.7500

cat("\n###BLOQUE-R7###\n")
# Varianza de HT por dos caminos: recorriendo el espacio de muestras y por la
# forma de Sen-Yates-Grundy. Si no coinciden, una de las dos esta mal.
var_ht <- function(ps, pis) {
  t_s <- ht_todas(ps, pis)
  sum(ps * (t_s - sum(ps * t_s))^2)
}
syg <- function(ps, pis) {
  P2 <- inclusion2(ps)
  d <- y / pis
  v <- 0
  for (k in 1:N) {
    for (l in 1:N) {
      if (k != l) v <- v + (P2[k, l] - pis[k] * pis[l]) * (d[k] - d[l])^2
    }
  }
  -0.5 * v
}
round(rbind(
  espacio_de_muestras = c(MAS = var_ht(p_mas, pi_mas), Est = var_ht(p_est, pi_est), Des = var_ht(p_des, pi_des)),
  Sen_Yates_Grundy    = c(syg(p_mas, pi_mas), syg(p_est, pi_est), syg(p_des, pi_des))
), 6)
#>                         MAS Est      Des
#> espacio_de_muestras 2253.75 891 670.3369
#> Sen_Yates_Grundy    2253.75 891 670.3369

cat("\n###BLOQUE-R8###\n")
agpop <- read.csv("CSV data sets for SDA 3e/agpop.csv")
c(condados = nrow(agpop), con_codigo_menos_99 = sum(agpop$acres92 < 0))
#>            condados con_codigo_menos_99
#>                3078                  19

# -99 es el codigo de faltante de Lohr, no una superficie negativa. Promediarlo
# con los demas seria inventarse 19 condados de superficie negativa.
pobdf <- agpop[agpop$acres92 >= 0, ]
pob <- pobdf$acres92
round(c(N = length(pob), media = mean(pob), S = sd(pob), CV = sd(pob) / mean(pob)), 4)
#>           N       media           S          CV
#>   3059.0000 308582.4122 425312.8461      1.3783

cat("\n###BLOQUE-R9###\n")
agsrs <- read.csv("CSV data sets for SDA 3e/agsrs.csv")
n_srs <- nrow(agsrs)
N_marco <- nrow(agpop)          # 3078: el marco completo, como en Lohr
dis <- svydesign(id = ~1, fpc = rep(N_marco, n_srs), data = agsrs)
svymean(~acres92, dis)
#>           mean    SE
#> acres92 297897 18898

cat("\n###BLOQUE-R10###\n")
# La misma cifra a mano, desde la formula del MAS. survey no es una caja negra.
ee_mano <- sqrt((1 - n_srs / N_marco) * var(agsrs$acres92) / n_srs)
round(c(media = mean(agsrs$acres92),
        ee_a_mano = ee_mano,
        ee_survey = as.numeric(SE(svymean(~acres92, dis)))), 4)
#>     media ee_a_mano ee_survey
#> 297897.05  18898.43  18898.43

cat("\n###BLOQUE-R11###\n")
round(confint(svymean(~acres92, dis), df = degf(dis)), 2)
#>            2.5 %   97.5 %
#> acres92 260706.3 335087.8

# Que pasa si se olvida el fpc: el error estandar sale MAS GRANDE, no mas chico.
ee_sin_fpc <- sqrt(var(agsrs$acres92) / n_srs)
round(c(ee_con_fpc = ee_mano, ee_sin_fpc = ee_sin_fpc,
        razon = ee_sin_fpc / ee_mano, fpc = 1 - n_srs / N_marco), 4)
#> ee_con_fpc ee_sin_fpc      razon        fpc
#> 18898.4344 19892.7129     1.0526     0.9025

cat("\n###BLOQUE-R12###\n")
z <- qnorm(0.975)
media_pob <- mean(pob)
S_pob <- sd(pob)
N_pob <- length(pob)
e <- 0.10 * media_pob                  # margen de error: 10 % de la media
n0 <- z^2 * S_pob^2 / e^2              # tamano sin corregir por poblacion finita
n_final <- ceiling(n0 / (1 + n0 / N_pob))
round(c(margen = e, n0 = n0, n = n_final), 2)
#>   margen       n0        n
#> 30858.24   729.74   590.00

cat("\n###BLOQUE-R13###\n")
set.seed(2026)
pi0 <- 0.05
dentro <- runif(N_pob) < pi0           # cada condado entra o no, por separado
round(c(n_esperado = N_pob * pi0, n_obtenido = sum(dentro),
        t_HT_millones = sum(pob[dentro]) / pi0 / 1e6,
        t_verdadero_millones = sum(pob) / 1e6), 3)
#>           n_esperado           n_obtenido        t_HT_millones
#>              152.950              144.000              988.847
#> t_verdadero_millones
#>              943.954

cat("\n###BLOQUE-R14###\n")
# Con Bernoulli las inclusiones son independientes: pi_kl = pi^2, los terminos
# cruzados se anulan y la varianza de HT queda en forma cerrada. No hace falta
# simular nada para saber cuanto vale.
v_ht_be <- sum(pob^2) * (1 - pi0) / pi0
round(c(ee_millones = sqrt(v_ht_be) / 1e6, cv = sqrt(v_ht_be) / sum(pob)), 4)
#> ee_millones          cv
#>    126.6672      0.1342

cat("\n###BLOQUE-R15###\n")
set.seed(2026)
N_per <- 120
y_per <- 100 + 25 * sin(2 * pi * seq_len(N_per) / 12) + rnorm(N_per, 0, 6)

medias_arranque <- function(v, k) sapply(seq_len(k), function(r) mean(v[seq(r, length(v), by = k)]))
v_sis <- function(v, k) mean((medias_arranque(v, k) - mean(v))^2)
v_mas <- function(v, m) (1 - m / length(v)) * var(v) / m

round(rbind(
  "n=10, k=12 (el periodo)" = c(V_sis = v_sis(y_per, 12), V_MAS = v_mas(y_per, 10),
                                DEFF = v_sis(y_per, 12) / v_mas(y_per, 10)),
  "n=12, k=10"              = c(v_sis(y_per, 10), v_mas(y_per, 12),
                                v_sis(y_per, 10) / v_mas(y_per, 12))
), 4)
#>                            V_sis   V_MAS   DEFF
#> n=10, k=12 (el periodo) 313.3851 31.9553 9.8070
#> n=12, k=10                2.8602 26.1452 0.1094

cat("\n###BLOQUE-R16###\n")
comparar <- function(v, k, m) {
  c(V_sis = v_sis(v, k), V_MAS = v_mas(v, m), DEFF = v_sis(v, k) / v_mas(v, m))
}
# Ordenada por acres87, la auxiliar que correlaciona 0.996 con acres92.
# Los 15 condados con acres87 = -99 son faltantes: van al final, no al principio.
orden_aux <- order(replace(pobdf$acres87, pobdf$acres87 < 0, NA), na.last = TRUE)
signif(rbind(original = comparar(pob, 10, 300),
             ordenada = comparar(pob[orden_aux], 10, 300)), 4)
#>              V_sis     V_MAS    DEFF
#> original 165800000 543800000 0.30490
#> ordenada  50760000 543800000 0.09333

cat("\n###BLOQUE-R17###\n")
# Un train/test split 80/20 ES un diseno muestral: el conjunto de test es la
# muestra y p(s) es uniforme sobre los subconjuntos de tamano 200.
N_ml <- 1000
n_test <- 200
round(c(pi_k = n_test / N_ml, pi_kl = n_test * (n_test - 1) / (N_ml * (N_ml - 1))), 6)
#>     pi_k    pi_kl
#>  0.20000  0.03984

# En validacion cruzada de K partes cada fila cae en test exactamente una vez:
# pi_k = 1 para todas. Lo aleatorio no es SI entra, sino EN QUE pliegue.
set.seed(2026)
K <- 5
pliegue <- sample(rep(1:K, length.out = N_ml))
table(pliegue)
#> pliegue
#>   1   2   3   4   5
#> 200 200 200 200 200

cat("\n###BLOQUE-S1###\n")
# Todo sale del diseno C, que ya esta construido: p_des y pi_des.
fila_24 <- which(muestras[, 1] == 2 & muestras[, 2] == 4)
round(c(pi_2 = pi_des[2], pi_24 = p_des[fila_24], suma_pi = sum(pi_des),
        d_2 = 1 / pi_des[2], d_4 = 1 / pi_des[4],
        t_HT = y[2] / pi_des[2] + y[4] / pi_des[4],
        N_por_media = N * mean(y[c(2, 4)])), 4)

cat("\n###BLOQUE-S2###\n")
tot_granjas <- svytotal(~farms92, dis)
round(c(total = as.numeric(coef(tot_granjas)), ee = as.numeric(SE(tot_granjas))), 2)
round(confint(tot_granjas, df = degf(dis)), 0)
c(total_real = sum(agpop$farms92))

cat("\n###BLOQUE-S3###\n")
agsrs$grande <- as.integer(agsrs$acres92 > 200000)
# El objeto de diseno guarda una COPIA de los datos: al anadir una columna hay
# que volver a declararlo, o svymean no la encuentra.
dis2 <- svydesign(id = ~1, fpc = rep(N_marco, n_srs), data = agsrs)
p_hat <- svymean(~grande, dis2)
round(c(p = as.numeric(coef(p_hat)), ee = as.numeric(SE(p_hat))), 4)
n0_p <- z^2 * as.numeric(coef(p_hat)) * (1 - as.numeric(coef(p_hat))) / 0.03^2
round(c(n0 = n0_p, n = ceiling(n0_p / (1 + n0_p / N_marco))), 2)

cat("\n###BLOQUE-S4###\n")
n6 <- floor(length(pob) / 6)
signif(rbind(original = comparar(pob, 6, n6),
             ordenada = comparar(pob[orden_aux], 6, n6)), 4)
