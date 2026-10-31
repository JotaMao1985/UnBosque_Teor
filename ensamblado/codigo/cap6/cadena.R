suppressMessages({library(survey); library(sampling); library(TeachingSampling); library(jsonlite)})
Sys.setlocale("LC_CTYPE", "en_US.UTF-8")
options(warn = 1, survey.lonely.psu = "adjust")

cat("\n###BLOQUE-R1###\n")
# Cuatro tiendas y sus ventas (Lohr, §6.1 y Tabla 6.1): la
# tienda D tiene diez veces el area de la A. Si el sorteo las trata igual,
# el azar decide si la muestra ve el 82 % de las ventas o el 4 %.
library(survey)               # el disenno y sus estimadores
library(sampling)             # inclusionprobabilities() y los algoritmos PPT

options(scipen = 8)
tiendas <- data.frame(tienda = c("A", "B", "C", "D"),
                      m2 = c(100, 200, 300, 1000),
                      ventas = c(11, 20, 24, 245))   # miles de USD
t_total <- sum(tiendas$ventas)
tiendas$psi <- tiendas$m2 / sum(tiendas$m2)          # psi_i prop. al tamano
tiendas
#>   tienda   m2 ventas    psi
#> 1      A  100     11 0.0625
#> 2      B  200     20 0.1250
#> 3      C  300     24 0.1875
#> 4      D 1000    245 0.6250
t_total
#> [1] 300

# Con n = 1 hay solo 4 muestras posibles: el estimador t/psi se puede
# enumerar COMPLETO, con su esperanza y su varianza exactas, para el sorteo
# proporcional y para el sorteo con probabilidades iguales (psi = 1/4):
est_ppt <- tiendas$ventas / tiendas$psi
est_igual <- 4 * tiendas$ventas
rbind(ppt = est_ppt, igual = est_igual)
#>       [,1] [,2] [,3] [,4]
#> ppt    176  160  128  392
#> igual   44   80   96  980

c(E_ppt = sum(tiendas$psi * est_ppt),
  V_ppt = sum(tiendas$psi * (est_ppt - t_total)^2),
  E_igual = mean(est_igual),
  V_igual = mean((est_igual - t_total)^2))
#>   E_ppt   V_ppt E_igual V_igual
#>     300   14248     300  154488

# La varianza, tienda por tienda: cada sumando psi_i * (t_i/psi_i - t)^2
# mide que tan lejos de 300 queda el t/psi de esa tienda, pesado por su
# probabilidad de salir. Los cuatro suman 14 248.
round(tiendas$psi * (est_ppt - t_total)^2)
#> [1]  961 2450 5547 5290

# Sin los pesos correctos: si se sortea con psi proporcional pero se expande
# como si las cuatro tuvieran 1/4 (4 * t_i), la esperanza ya no es 300.
sum(tiendas$psi * est_igual)
#> [1] 643.25
# Los dos son insesgados; el proporcional tiene 10.8 veces menos varianza,
# porque t_i/psi_i es casi constante cuando psi_i acompana al tamano.

cat("\n###BLOQUE-R2###\n")
# Hansen-Hurwitz: n = 2 extracciones CON reemplazo, cada una con psi_i.
# El estimador promedia los t/psi de las dos extracciones:
#   t_hat_HH = (1/n) * sum(y_i / psi_i)
# Su varianza tiene formula cerrada V = (1/n) sum psi_i (t_i/psi_i - t)^2,
# y con n = 2 tambien se puede enumerar: 16 pares ordenados.
pares <- expand.grid(prima = 1:4, segunda = 1:4)
pares$prob <- tiendas$psi[pares$prima] * tiendas$psi[pares$segunda]
pares$hh <- (est_ppt[pares$prima] + est_ppt[pares$segunda]) / 2
c(E_HH = sum(pares$prob * pares$hh),
  V_enumerada = sum(pares$prob * (pares$hh - t_total)^2),
  V_formula = sum(tiendas$psi * (est_ppt - t_total)^2) / 2)
#>        E_HH V_enumerada   V_formula
#>         300        7124        7124

# Con reemplazo la misma tienda puede salir dos veces. Con estas psi no es
# raro: D sale en las dos extracciones con probabilidad psi_D^2.
round(tiendas$psi[4]^2, 3)
#> [1] 0.391

# En la practica no se enumera: se sortea. Una muestra HH concreta:
set.seed(2026)
s <- sample(1:4, 2, replace = TRUE, prob = tiendas$psi)
paste(tiendas$tienda[s], collapse = "")
#> [1] "CD"
z <- tiendas$ventas[s] / tiendas$psi[s]
c(t_hat = mean(z), ee_estimado = sqrt(var(z) / 2))
#>       t_hat ee_estimado
#>         260         132
# El ee estimado con n = 2 es malisimo (var con 2 datos), pero el estimador
# puntual ya usa bien los tamanos. Con n realista, ambos mejoran.

cat("\n###BLOQUE-R3###\n")
# Como se sortea con probabilidades desiguales? Metodo acumulativo: cada
# tienda ocupa un tramo de [0, 1600] proporcional a su tamano; un uniforme
# cae en un tramo y esa tienda sale.
acum <- cumsum(tiendas$m2)
data.frame(tienda = tiendas$tienda, desde = c(1, head(acum, -1) + 1), hasta = acum)
#>   tienda desde hasta
#> 1      A     1   100
#> 2      B   101   300
#> 3      C   301   600
#> 4      D   601  1600

set.seed(2026)
u <- runif(5) * 1600
sel <- findInterval(u, c(0, acum), left.open = TRUE)
data.frame(uniforme = round(u, 1), sale = tiendas$tienda[sel])
#>   uniforme sale
#> 1   1117.9    D
#> 2    890.4    D
#> 3    224.2    B
#> 4    457.2    C
#> 5    888.6    D

# La verificacion de que el metodo hace lo que promete: 100 000 sorteos y
# las frecuencias deben clavar los psi_i.
set.seed(2026)
sel <- findInterval(runif(100000) * 1600, c(0, acum), left.open = TRUE)
round(rbind(frecuencia = table(sel) / 100000, psi = tiendas$psi), 4)
#>                 1      2      3      4
#> frecuencia 0.0627 0.1248 0.1873 0.6252
#> psi        0.0625 0.1250 0.1875 0.6250

cat("\n###BLOQUE-R4###\n")
# Metodo de Lahiri (rechazo): se sortea una tienda al azar y un uniforme
# contra x_max = 1000; si u * x_max <= x_i, la tienda queda; si no, se
# repite. No necesita acumular, y acepta con probabilidad proporcional a x_i.
set.seed(2026)
B <- 100000
sorteos <- sample(1:4, B * 3, replace = TRUE)     # de sobra para B aceptados
umax <- runif(B * 3) * 1000
acepta <- umax <= tiendas$m2[sorteos]
sel_lahiri <- sorteos[acepta][1:B]
round(rbind(frecuencia = table(sel_lahiri) / B, psi = tiendas$psi), 4)
#>                 1      2      3      4
#> frecuencia 0.0622 0.1247 0.1870 0.6261
#> psi        0.0625 0.1250 0.1875 0.6250

# Por que funciona: en un intento, la tienda i sale con prob. (1/4)(x_i/1000),
# proporcional al area; la suma es la prob. de aceptar a alguien. Entre las
# aceptadas, cada tienda queda con su psi_i.
p_intento <- (1 / 4) * tiendas$m2 / 1000
rbind(en_un_intento = p_intento, entre_aceptadas = p_intento / sum(p_intento))
#>                   [,1]  [,2]   [,3]  [,4]
#> en_un_intento   0.0250 0.050 0.0750 0.250
#> entre_aceptadas 0.0625 0.125 0.1875 0.625
sum(p_intento)
#> [1] 0.4

# El precio del rechazo: cuantos intentos por seleccion?
c(intentos_promedio = round(1 / mean(acepta), 3),
  teorico = 1000 * 4 / 1600)
#> intentos_promedio           teorico
#>              2.51              2.50

cat("\n###BLOQUE-R5###\n")
# SIN reemplazo la herramienta es la del capitulo 2: un diseno p(s) sobre
# las muestras posibles, sus pi_k, y el estimador de Horvitz-Thompson.
# Con N = 4 y n = 2 hay 6 muestras; tomemos p(s) proporcional a m2_k + m2_l:
muestras <- t(combn(4, 2))
p_s <- tiendas$m2[muestras[, 1]] + tiendas$m2[muestras[, 2]]
sum(p_s)            # cada tienda esta en 3 parejas: 3 x 1600
#> [1] 4800
p_s <- p_s / sum(p_s)
data.frame(muestra = apply(muestras, 1, function(m) paste(tiendas$tienda[m], collapse = "")),
           p_s = round(p_s, 4))
#>   muestra    p_s
#> 1      AB 0.0625
#> 2      AC 0.0833
#> 3      AD 0.2292
#> 4      BC 0.1042
#> 5      BD 0.2500
#> 6      CD 0.2708

# pi_k = suma de p(s) sobre las muestras que contienen a k; suman n = 2:
pi_k <- sapply(1:4, function(k) sum(p_s[apply(muestras == k, 1, any)]))
round(pi_k, 4)
#> [1] 0.3750 0.4167 0.4583 0.7500
sum(pi_k)
#> [1] 2

# El HT de cada muestra posible, y su esperanza exacta:
ht_s <- apply(muestras, 1, function(m) sum(tiendas$ventas[m] / pi_k[m]))
round(ht_s, 1)
#> [1]  77.3  81.7 356.0 100.4 374.7 379.0
c(E_HT = sum(p_s * ht_s), V_HT = sum(p_s * (ht_s - t_total)^2))
#>     E_HT     V_HT
#>   300.00 15025.67
# Insesgado sin reemplazo, para CUALQUIER p(s) con pi_k > 0. Pero esta V es
# mas alta que la del HH. La razon, en los cocientes y_k/pi_k que suma el HT:
# el de D queda lejisimo de los otros tres.
round(tiendas$ventas / pi_k, 1)
#> [1]  29.3  48.0  52.4 326.7

cat("\n###BLOQUE-R5b###\n")
# psi frente a pi, con las mismas tiendas. psi_i: probabilidad de salir en UNA
# extraccion (suman 1). Con n = 2 extracciones con reemplazo, la tienda i sale
# en promedio n psi_i veces y esta en la muestra con probabilidad
# 1 - (1 - psi_i)^2. Al lado, las pi del diseno sin reemplazo de este modulo:
rbind(psi = tiendas$psi, n_psi = 2 * tiendas$psi,
      pi_con_reemplazo = round(1 - (1 - tiendas$psi)^2, 4),
      pi_sin_reemplazo = round(pi_k, 4))
#>                    [,1]   [,2]   [,3]   [,4]
#> psi              0.0625 0.1250 0.1875 0.6250
#> n_psi            0.1250 0.2500 0.3750 1.2500
#> pi_con_reemplazo 0.1211 0.2344 0.3398 0.8594
#> pi_sin_reemplazo 0.3750 0.4167 0.4583 0.7500
# Con psi pequena, n psi y 1 - (1 - psi)^n casi coinciden (A: 0.125 y 0.121);
# con psi grande, no (D: 1.25 y 0.859). Esa aproximacion, pi = n psi, es la
# que usan los modulos 7 y 9.
# En el HH, n psi_i hace el papel de pi_i: sus cocientes t_i/(n psi_i) son
# mucho mas parecidos entre si que los y_k/pi_k del diseno de este modulo.
rbind(HH_t_entre_n_psi = tiendas$ventas / (2 * tiendas$psi),
      M4_y_entre_pi = round(tiendas$ventas / pi_k, 1))
#>                  [,1] [,2] [,3]  [,4]
#> HH_t_entre_n_psi 88.0   80 64.0 196.0
#> M4_y_entre_pi    29.3   48 52.4 326.7

cat("\n###BLOQUE-R6###\n")
# La varianza del HT necesita las probabilidades CONJUNTAS pi_kl (que ambas
# unidades esten en la muestra). Aqui salen del diseno por enumeracion:
pi_kl <- matrix(0, 4, 4, dimnames = list(tiendas$tienda, tiendas$tienda))
for (s in 1:6) {
  i <- muestras[s, 1]; j <- muestras[s, 2]
  pi_kl[i, j] <- pi_kl[i, j] + p_s[s]; pi_kl[j, i] <- pi_kl[j, i] + p_s[s]
}
diag(pi_kl) <- pi_k
round(pi_kl, 4)
#>        A      B      C      D
#> A 0.3750 0.0625 0.0833 0.2292
#> B 0.0625 0.4167 0.1042 0.2500
#> C 0.0833 0.1042 0.4583 0.2708
#> D 0.2292 0.2500 0.2708 0.7500

# Forma de Sen-Yates-Grundy (disenos de tamano fijo): una suma sobre pares,
# con (pi_k pi_l - pi_kl) midiendo cuanto "se estorban" k y l:
y_pi <- tiendas$ventas / pi_k
V_syg <- 0
for (k in 1:3) for (l in (k + 1):4) {
  V_syg <- V_syg + (pi_k[k] * pi_k[l] - pi_kl[k, l]) * (y_pi[k] - y_pi[l])^2
}
c(V_SYG = V_syg, V_enumerada = sum(p_s * (ht_s - t_total)^2))
#>       V_SYG V_enumerada
#>    15025.67    15025.67
# Identicas: SYG es la misma varianza reescrita. Su ventaja practica llega
# al ESTIMARLA (los bloques de agpps, mas abajo): suele ser mas estable que
# la forma HT.

cat("\n###BLOQUE-R6b###\n")
# De la varianza a su ESTIMADOR. Con una muestra solo se ven sus pares, y cada
# termino se divide entre pi_kl, la probabilidad de que ese par salga junto.
# Las dos formas del estimador en cada una de las 6 muestras posibles:
est_v <- t(apply(muestras, 1, function(m) {
  k <- m[1]; l <- m[2]
  c(SYG = (pi_k[k] * pi_k[l] - pi_kl[k, l]) / pi_kl[k, l] * (y_pi[k] - y_pi[l])^2,
    forma_HT = (1 - pi_k[k]) * y_pi[k]^2 + (1 - pi_k[l]) * y_pi[l]^2 +
      2 * (pi_kl[k, l] - pi_k[k] * pi_k[l]) / pi_kl[k, l] * y_pi[k] * y_pi[l])
}))
rownames(est_v) <- apply(muestras, 1, function(m) paste(tiendas$tienda[m], collapse = ""))
round(est_v)
#>      SYG forma_HT
#> AB   523    -2342
#> AC   564    -1241
#> AD 20093    22860
#> BC    16    -1360
#> BD 19414    20182
#> CD 20258    18952
# La forma HT sale NEGATIVA en tres muestras; SYG nunca. Y las dos son
# insesgadas: promediadas con p(s), dan la varianza verdadera.
round(colSums(p_s * est_v), 2)
#>      SYG forma_HT
#> 15025.67 15025.67

cat("\n###BLOQUE-R20###\n")
# El piPT con las cuatro tiendas y n = 2: pi_k = 2 x_k / 1600. La de D pasa
# de 1, asi que D entra siempre, y el otro cupo se reparte entre A, B y C en
# proporcion a su area (x_k / 600).
round(2 * tiendas$m2 / 1600, 4)
#> [1] 0.125 0.250 0.375 1.250
pi_2 <- inclusionprobabilities(tiendas$m2, 2)
round(pi_2, 4)
#> [1] 0.1667 0.3333 0.5000 1.0000
# Tres muestras posibles, {A, D}, {B, D} y {C, D}, cada una con la pi de la
# acompanante. El HT de cada una, su esperanza y su varianza exactas:
ht_2 <- tiendas$ventas[4] / pi_2[4] + tiendas$ventas[1:3] / pi_2[1:3]
ht_2
#> [1] 311 305 293
c(E_HT = sum(pi_2[1:3] * ht_2), V_HT = sum(pi_2[1:3] * (ht_2 - t_total)^2))
#> E_HT V_HT
#>  300   53
# 53, frente a 7124 del HH y 15 026 del diseno del modulo 4: ahora los
# cocientes y_k/pi_k de A, B y C (66, 60 y 48) casi no cambian.

cat("\n###BLOQUE-R7###\n")
# Un pi-PT real: los 51 estados de EE.UU. (50 + DC), tamano = poblacion 2019,
# n = 10. inclusionprobabilities calcula pi_k = n x_k / sum(x)... y trunca
# en silencio: la pi cruda de California (linea siguiente) pasa de 1.
statepps <- read.csv("CSV data sets for SDA 3e/statepps.csv")
c(estados = nrow(statepps), total_condados = sum(statepps$counties))
#>        estados total_condados
#>             51           3143
round(10 * max(statepps$pop2019) / sum(statepps$pop2019), 4)   # pi cruda de CA
#> [1] 1.2038

pi_st <- inclusionprobabilities(statepps$pop2019, 10)
sum(pi_st)
#> [1] 10
statepps$state[pi_st >= 1 - 1e-12]
#> [1] "California"
# California queda de INCLUSION FORZOSA (pi = 1) y el resto se reescala para
# que la suma siga siendo n = 10. Es la regla general: pi = 1 para las
# unidades gigantes, proporcionalidad para las demas.

cat("\n###BLOQUE-R8###\n")
# Seleccion pi-PT sistematica (UPsystematic), recorriendo la lista en el
# orden del archivo (alfabetico), y el HT del total de condados:
set.seed(2026)
s_sys <- UPsystematic(pi_st) == 1
statepps$state[s_sys]
#>  [1] "California"     "Connecticut"    "Georgia"        "Kansas"
#>  [5] "Michigan"       "New Jersey"     "North Carolina" "Pennsylvania"
#>  [9] "Texas"          "Washington"
c(n = sum(s_sys),
  t_HT = sum(statepps$counties[s_sys] / pi_st[s_sys]),
  total_real = sum(statepps$counties))
#>          n       t_HT total_real
#>     10.000   3028.217   3143.000

# El sistematico deja pi_kl = 0 en muchos pares (capitulo 2): no hay
# estimador insesgado de varianza. La salida practica es la aproximacion
# CON reemplazo, conservadora, que solo usa las pi de primer orden.
# California (pi = 1) no aporta varianza y queda fuera; las otras nueve se
# tratan como nueve extracciones con psi_i = pi_i/9, asi que
# z_i = y_i/psi_i = 9 y_i/pi_i:
nf <- s_sys & pi_st < 1
z <- sum(nf) * statepps$counties[nf] / pi_st[nf]
c(ee_aprox_WR = sqrt(var(z) / sum(nf)))
#> ee_aprox_WR
#>     1004.66

cat("\n###BLOQUE-R21###\n")
# Antes de muestrear: el criterio de Raj (Gutierrez, Resultado 4.2.7). Con
# reemplazo, la varianza del PPT y la del MAS con reemplazo, con n extracciones
# (Gutierrez las llama m), difieren en
#   V_MRAS - V_PPT = (N^2 / n) Cov(x, y^2 / x),
# con la covarianza de la poblacion (divisor N). El PPT gana si es positiva.
pop <- statepps$pop2019
cov_N <- function(a, b) mean((a - mean(a)) * (b - mean(b)))
raj <- function(y, n = 10) {
  N <- length(y); psi <- pop / sum(pop)
  c(raj = N^2 / n * cov_N(pop, y^2 / pop),
    V_MRAS_menos_V_PPT = N^2 / n * cov_N(y, y) - sum(psi * (y / psi - sum(y))^2) / n,
    cor_x_y = cor(pop, y), cor_x_y2x = cor(pop, y^2 / pop),
    intercepto = unname(coef(lm(y ~ pop))[1]))
}
round(raj(statepps$counties), 3)
#>                raj V_MRAS_menos_V_PPT            cor_x_y          cor_x_y2x
#>        -405718.893        -405718.893              0.456             -0.171
#>         intercepto
#>             43.006
signif(raj(statepps$waterarea), 4)
#>                raj V_MRAS_menos_V_PPT            cor_x_y          cor_x_y2x
#>         -2.376e+12         -2.376e+12          4.511e-02         -1.099e-01
#>         intercepto
#>          1.201e+04
# Con counties la diferencia es negativa: la correlacion con la poblacion es
# 0.46, pero la que cuenta, la de x con y^2/x, es negativa, y la recta de
# counties sobre la poblacion corta el eje en 43 condados, lejos del origen.

cat("\n###BLOQUE-R22###\n")
# El mismo piPT con distintos algoritmos: la varianza exacta del HT con las
# pi_kl de cada uno (Brewer no las trae: se sortea 4000 veces). California
# (pi = 1) entra siempre y no aporta varianza: lo que se sortea son 9 de los
# otros 50.
cond <- statepps$counties
libres <- pi_st < 1
p9 <- pi_st[libres]; c9 <- cond[libres]
# Varianza exacta del HT dadas las pi_kl del algoritmo (forma SYG):
v_syg <- function(P2, p, y) {
  d <- y / p; D <- outer(p, p) - P2; diag(D) <- 0
  sum(D * outer(d, d, "-")^2) / 2
}
# Sistematico: el arranque u decide la muestra; entre dos cortes sale siempre
# la misma. Se recorren todas, cada una con la longitud de su tramo:
arranques <- function(p) {
  acum <- c(0, cumsum(p))
  cortes <- sort(unique(round(c(0, 1, acum %% 1), 12)))
  lapply(seq_len(length(cortes) - 1), function(j) {
    u <- (cortes[j] + cortes[j + 1]) / 2
    list(s = floor(acum[-1] - u) > floor(head(acum, -1) - u),
         prob = cortes[j + 1] - cortes[j])
  })
}
v_sis <- function(y, p) sum(sapply(arranques(p), function(a)
  a$prob * (sum(y[a$s] / p[a$s]) - sum(y))^2))
orden_pob <- order(statepps$pop2019)
# La escision de soporte minimo, como la presenta Gutierrez (ej. 4.4.2): la
# lista se ordena una vez por pi creciente; en cada etapa, las primeras sin
# decidir van a 0 y las ultimas a 1, y lambda es el mayor valor con el que las
# pi siguen entre 0 y 1. Devuelve todas sus muestras y sus probabilidades.
soporte_minimo <- function(p) {
  o <- order(p); pb <- p[o]; resto <- 1; muestras <- list(); probs <- c()
  repeat {
    libres <- which(pb > 1e-9 & pb < 1 - 1e-9)
    if (length(libres) == 0) break
    faltan <- round(sum(pb[libres]))
    a_cero <- head(libres, length(libres) - faltan); a_uno <- tail(libres, faltan)
    lam <- min(1 - max(pb[a_cero]), min(pb[a_uno]))
    pa <- round(pb); pa[a_cero] <- 0; pa[a_uno] <- 1
    muestras[[length(muestras) + 1]] <- pa; probs <- c(probs, resto * lam)
    pb[a_cero] <- pb[a_cero] / (1 - lam); pb[a_uno] <- (pb[a_uno] - lam) / (1 - lam)
    pb[abs(pb) < 1e-9] <- 0; pb[abs(pb - 1) < 1e-9] <- 1
    resto <- resto * (1 - lam)
  }
  muestras[[length(muestras) + 1]] <- pb; probs <- c(probs, resto)
  list(S = sapply(muestras, function(m) { v <- numeric(length(p)); v[o] <- m; v }), p = probs)
}
sm <- soporte_minimo(p9)
ncol(sm$S)                                   # muestras posibles
#> [1] 50
round(max(abs(sm$S %*% sm$p - p9)), 12)      # respeta las pi: diferencia maxima
#> [1] 0
# Brewer no trae sus pi_kl: 4000 muestras para su varianza, y de paso para
# comprobar que respeta las pi.
set.seed(2026)
m_brewer <- replicate(4000, UPbrewer(p9))
round(c(sistematico_alfabetico = v_sis(cond, pi_st),
        sistematico_por_poblacion = v_sis(cond[orden_pob], pi_st[orden_pob]),
        eliminacion_de_Tille = v_syg(UPtillepi2(p9), p9, c9),
        maxima_entropia = v_syg(UPmaxentropypi2(p9), p9, c9),
        Brewer_4000_muestras = var(colSums(m_brewer * c9 / p9)),
        soporte_minimo = sum(sm$p * (colSums(sm$S * c9 / p9) - sum(c9))^2)))
#>    sistematico_alfabetico sistematico_por_poblacion      eliminacion_de_Tille
#>                    575401                    344951                    697273
#>           maxima_entropia      Brewer_4000_muestras            soporte_minimo
#>                    723607                    715020                   3063834
round(max(abs(rowMeans(m_brewer) - p9)), 3)       # Brewer: frecuencia frente a pi
#> [1] 0.013
# Parejas de estados que nunca salen juntos (pi_kl = 0), de las 1225 posibles:
pares_cero <- function(P2) sum(P2[upper.tri(P2)] < 1e-12)
c(sistematico = pares_cero(UPsystematicpi2(p9)), eliminacion_de_Tille = pares_cero(UPtillepi2(p9)),
  maxima_entropia = pares_cero(UPmaxentropypi2(p9)))
#>          sistematico eliminacion_de_Tille      maxima_entropia
#>                  830                    0                    0

cat("\n###BLOQUE-R9###\n")
# Antes, a mano: con dos monedas, pi = 0.3 y 0.5, el tamano de muestra vale
# 0, 1 o 2. Como son independientes, las probabilidades se multiplican:
c(P_n0 = 0.7 * 0.5, P_n1 = 0.3 * 0.5 + 0.7 * 0.5, P_n2 = 0.3 * 0.5)
#> P_n0 P_n1 P_n2
#> 0.35 0.50 0.15

# Diseno de Poisson con los estados: cada uno entra con SU pi_k, con monedas
# independientes. El precio: n queda ALEATORIO.
set.seed(2026)
s_poi <- rbinom(nrow(statepps), 1, pi_st) == 1
c(n_obtenido = sum(s_poi), E_n = sum(pi_st),
  de_n = sqrt(sum(pi_st * (1 - pi_st))))
#> n_obtenido        E_n       de_n
#>   8.000000  10.000000   2.414976

c(t_HT = sum(statepps$counties[s_poi] / pi_st[s_poi]))
#>     t_HT
#> 1896.203

# A cambio, la independencia regala la varianza mas simple del capitulo
# (sin pi_kl: pi_kl = pi_k * pi_l), calculable EXACTA sobre la poblacion:
c(V_exacta = sum((1 - pi_st) * statepps$counties^2 / pi_st),
  ee = sqrt(sum((1 - pi_st) * statepps$counties^2 / pi_st)))
#>    V_exacta          ee
#> 1604348.622    1266.629

cat("\n###BLOQUE-R24###\n")
# 1. Con y proporcional a x (aqui, y = la propia poblacion), el HT de Poisson
# solo depende de CUANTOS estados salen. California entra siempre y aporta su
# poblacion; cada uno de los otros aporta lo mismo, (t - t_California) / 9.
# Cinco muestras:
set.seed(2026)
t(replicate(5, {
  s <- runif(nrow(statepps)) < pi_st
  c(n_s = sum(s), HT_entre_t = sum(pop[s] / pi_st[s]) / sum(pop))
}))
#>      n_s HT_entre_t
#> [1,]  15   1.488680
#> [2,]   8   0.804528
#> [3,]  10   1.000000
#> [4,]  10   1.000000
#> [5,]  12   1.195472
# 2. El remedio: dividir por lo que salio. Con x conocida en todo el marco, el
# estimador de razon del capitulo 3 corrige el HT de y con el HT de x:
#   t_razon = t_x * t_HT(y) / t_HT(x).
# Gutierrez propone tambien N * t_HT(y) / N_HT. Error cuadratico medio de los
# tres sobre 20 000 muestras de Poisson, junto a la varianza exacta del HT:
set.seed(2026)
rep_poi <- replicate(20000, {
  s <- runif(nrow(statepps)) < pi_st
  c(ht = sum(cond[s] / pi_st[s]),
    razon = sum(pop) * sum(cond[s] / pi_st[s]) / sum(pop[s] / pi_st[s]),
    alternativo = nrow(statepps) * sum(cond[s] / pi_st[s]) / sum(1 / pi_st[s]))
})
round(c(V_HT_exacta = sum((1 - pi_st) * cond^2 / pi_st),
        ECM_HT = mean((rep_poi["ht", ] - sum(cond))^2),
        ECM_razon = mean((rep_poi["razon", ] - sum(cond))^2),
        ECM_alternativo = mean((rep_poi["alternativo", ] - sum(cond))^2)))
#>     V_HT_exacta          ECM_HT       ECM_razon ECM_alternativo
#>         1604349         1574244          773791          959401
# La razon parte la varianza a la mitad y queda cerca de los disenos de tamano
# fijo del modulo 5 (de 0.70 a 0.72 millones con Tille, Brewer o maxima
# entropia).

cat("\n###BLOQUE-R10###\n")
# agpps: la muestra pi-PT REAL de Lohr — 15 condados sorteados con pi
# proporcional a acres87, CON el archivo de probabilidades conjuntas
# JtProb (una matriz 15 x 15). Es el caso ideal: se puede estimar la
# varianza del HT con las formulas completas.
agpps <- read.csv("CSV data sets for SDA 3e/agpps.csv")
c(condados = nrow(agpps), rango_pi = range(agpps$SelectionProb))
#>     condados    rango_pi1    rango_pi2
#> 15.000000000  0.002864708  0.033890171
t_ht <- sum(agpps$acres92 / agpps$SelectionProb)
t_ht
#> [1] 936291173

# Estimador de varianza en forma HT (doble suma con Delta_kl/pi_kl):
Pmat <- as.matrix(agpps[, paste0("JtProb_", 1:15)])
diag(Pmat) <- agpps$SelectionProb
d <- agpps$acres92 / agpps$SelectionProb
V_ht <- sum((1 - agpps$SelectionProb) * d^2)
for (k in 1:15) for (l in (1:15)[-k]) {
  V_ht <- V_ht + (Pmat[k, l] - agpps$SelectionProb[k] * agpps$SelectionProb[l]) /
    Pmat[k, l] * d[k] * d[l]
}
# Estimador de Sen-Yates-Grundy (tamano fijo, suma sobre pares):
V_syg <- 0
for (k in 1:14) for (l in (k + 1):15) {
  V_syg <- V_syg + (agpps$SelectionProb[k] * agpps$SelectionProb[l] - Pmat[k, l]) /
    Pmat[k, l] * (d[k] - d[l])^2
}
# Y el tercero, el que Lohr recomienda en general (ec. 6.24): la
# aproximacion con reemplazo, que no usa ninguna pi_kl (psi_k = pi_k/15):
V_wr_ag <- 15 / 14 * sum((d - t_ht / 15)^2)
round(c(ee_forma_HT = as.numeric(sqrt(V_ht)), ee_SYG = as.numeric(sqrt(V_syg)),
        ee_WR = sqrt(V_wr_ag)), 0)
#> ee_forma_HT      ee_SYG       ee_WR
#>    70466698    11715204    12293010
# MISMOS datos, MISMA varianza teorica... y el estimador en forma HT da un
# ee 6 veces mayor: es notoriamente inestable (puede hasta dar negativa).
# SYG, con las pi_kl, y la aproximacion WR, sin ellas, quedan cerca: con
# n/N = 15/3078 la WR apenas sobreestima (Lohr, ej. 6.10).

cat("\n###BLOQUE-R11###\n")
# survey hace las dos cuentas con la matriz de conjuntas (pps = ppsmat):
dis_yg <- svydesign(id = ~1, fpc = ~SelectionProb, data = agpps,
                    pps = ppsmat(Pmat), variance = "YG")
svytotal(~acres92, dis_yg)
#>             total       SE
#> acres92 936291173 11715204

dis_ht <- svydesign(id = ~1, fpc = ~SelectionProb, data = agpps,
                    pps = ppsmat(Pmat), variance = "HT")
svytotal(~acres92, dis_ht)
#>             total       SE
#> acres92 936291173 70466698
# Las dos vias a mano del bloque anterior, reproducidas por survey. El
# intervalo con SYG: 936.3 +/- 23 millones de acres. El total verdadero de
# agpop (cap. 1) era 944 millones (943 951 718): cae dentro.

cat("\n###BLOQUE-R23###\n")
# Sin pi_kl: la aproximacion de Hajek de la varianza (Gutierrez, Resultado
# 4.4.4), con b_k = N pi_k (1 - pi_k) / (N - 1), y el estimador de Deville,
# con c_k = (1 - pi_k) n / (n - 1). Los dos piden solo las pi de primer orden.
hajek <- function(y, p) {
  b <- length(p) * p * (1 - p) / (length(p) - 1)
  y_aster <- p * sum(b * y / p) / sum(b)
  sum(b / p^2 * (y - y_aster)^2)
}
deville <- function(ys, ps) {
  n <- length(ps); ck <- (1 - ps) * n / (n - 1)
  y_aster <- ps * sum(ck * ys / ps) / sum(ck)
  sum(ck / ps^2 * (ys - y_aster)^2)
}
# 1. Los estados: la aproximacion frente a la varianza exacta de maxima
#    entropia (modulo 5), sin California.
round(c(hajek = hajek(c9, p9), maxima_entropia = v_syg(UPmaxentropypi2(p9), p9, c9)))
#>           hajek maxima_entropia
#>          726308          723607
# 2. El sistematico alfabetico del modulo 5: la esperanza EXACTA de los dos
#    estimadores de varianza, recorriendo todas sus muestras, frente a la
#    varianza verdadera.
esperanzas <- rowSums(sapply(arranques(pi_st), function(a) {
  sn <- a$s & libres
  z <- sum(sn) * cond[sn] / pi_st[sn]
  a$prob * c(Deville = deville(cond[sn], pi_st[sn]), con_reemplazo = var(z) / sum(sn))
}))
round(c(V_verdadera = v_sis(cond, pi_st),
        E_Deville = esperanzas[["Deville"]], E_con_reemplazo = esperanzas[["con_reemplazo"]],
        razon_Deville = esperanzas[["Deville"]] / v_sis(cond, pi_st),
        razon_con_reemplazo = esperanzas[["con_reemplazo"]] / v_sis(cond, pi_st)), 3)
#>         V_verdadera           E_Deville     E_con_reemplazo       razon_Deville
#>          575400.943          709384.794          880367.332               1.233
#> razon_con_reemplazo
#>               1.530
# 3. agpps: la funcion deville() de arriba, y dos variantes de la misma idea.
#    sampling::varest usa el factor 1 / (1 - sum(a^2)), con a = (1 - pi) / sum(1 - pi),
#    en lugar de n / (n - 1); survey con pps = "brewer" centra los y_k / pi_k
#    en su media simple. Ninguna usa la matriz JtProb, y las tres dan 12.23
#    millones.
c(ee_Deville = sqrt(deville(agpps$acres92, agpps$SelectionProb)),
  ee_varest = sqrt(varest(Ys = agpps$acres92, pik = agpps$SelectionProb)))
#> ee_Deville  ee_varest
#>   12230070   12230116
svytotal(~acres92, svydesign(id = ~1, fpc = ~SelectionProb, data = agpps, pps = "brewer"))
#>             total       SE
#> acres92 936291173 12230104

cat("\n###BLOQUE-R12###\n")
# Cuando el HT se comporta mal: pi_k chica con y_k grande. La poblacion del
# modulo 8 es SIMULADA: 20 negocios con ventas proporcionales al area y pi
# proporcional al area (n = 5)... y un "elefante" (unidad 20) con area
# minima y ventas enormes. Bajo Poisson la varianza es exacta y se ve el
# desastre en funcion de pi_20:
set.seed(2026)
x_e <- round(exp(rnorm(20, 4, 0.6)))               # areas
y_e <- round(2 * x_e * exp(rnorm(20, 0, 0.15)))    # ventas, prop. al area
x_e[20] <- min(x_e[-20]); y_e[20] <- 30 * max(y_e[-20])   # el elefante
pi_e <- inclusionprobabilities(x_e, 5)
c(y_elefante = y_e[20], total = sum(y_e), aporta = round(y_e[20] / sum(y_e), 3))
#> y_elefante      total     aporta
#>    8790.00   10726.00       0.82
round(pi_e[20], 4)                                 # la pi que le toca por su area
#> [1] 0.0649

# El HT oscila entre dos mundos. Sin el elefante (lo que pasa el 93.5 % de
# las veces) solo ve, mas o menos, el resto de las ventas; si sale, su
# termino y/pi solo ya vale mas de doce veces el total:
c(resto_de_las_ventas = sum(y_e[-20]), prob_de_que_no_salga = round(1 - pi_e[20], 3),
  termino_del_elefante = round(y_e[20] / pi_e[20]))
#>  resto_de_las_ventas prob_de_que_no_salga termino_del_elefante
#>             1936.000                0.935           135366.000

V_con_pi <- function(p) {
  pk <- pi_e; pk[20] <- p
  sum((1 - pk) * y_e^2 / pk)
}
round(sapply(c(pi_area = pi_e[20], pi_005 = 0.005, pi_05 = 0.05, pi_5 = 0.5), V_con_pi))
#>     pi_area      pi_005       pi_05        pi_5
#>  1113115897 15376068757  1468530757    77776957
# Frente a su pi de area, bajarla a 0.005 multiplica la varianza por casi
# 14; frente a pi = 0.5, por casi 200. El termino (1/pi - 1) y^2 del
# elefante domina todo: con su pi de area ya pone el 99.95 %. La leccion
# de diseno: si sospechas que y_k puede ser grande, NO le dejes pi_k chica —
# tamanos de referencia actualizados, o inclusion forzosa.

cat("\n###BLOQUE-R13###\n")
# PPT en dos etapas, el diseno de las encuestas reales. classpps (Lohr,
# ej. 6.11): 5 clases sorteadas SIN reemplazo con pi_i = 5 M_i/647 (ninguna
# se repite) y 4 estudiantes por clase. Se analiza COMO SI fuera con
# reemplazo, con psi_i = pi_i/5 = M_i/647 (Lohr, ec. 6.30): el HH de dos
# etapas promedia t_hat_i / psi_i:
clases <- read.csv("CSV data sets for SDA 3e/classes.csv")      # marco: 15 clases
classpps <- read.csv("CSV data sets for SDA 3e/classpps.csv")   # la muestra
K <- sum(clases$class_size)
K
#> [1] 647
por_clase <- do.call(rbind, lapply(split(classpps, classpps$class), function(d) {
  Mi <- clases$class_size[clases$class == d$class[1]]
  data.frame(clase = d$class[1], Mi = Mi, mi = nrow(d),
             ybar = mean(d$hours), t_hat = Mi * mean(d$hours),
             psi = Mi / K)
}))
round(por_clase, 3)
#>    clase  Mi mi  ybar  t_hat   psi
#> 1      1  44  4 3.500 154.00 0.068
#> 4      4  22  4 5.000 110.00 0.034
#> 9      9  54  4 3.625 195.75 0.083
#> 10    10  34  4 3.125 106.25 0.053
#> 14    14 100  4 2.000 200.00 0.155

z <- por_clase$t_hat / por_clase$psi
round(z, 1)                     # z_i = t_hat_i / psi_i = 647 * ybar_i
#> [1] 2264.5 3235.0 2345.4 2021.9 1294.0
c(t_HH = mean(z), ee = sqrt(var(z) / 5))
#>      t_HH        ee
#> 2232.1500  311.7624
# Cada z_i = t_hat_i/psi_i es un estimador insesgado del total por si solo;
# HH los promedia. La varianza usa SOLO la dispersion de los z_i: el "con
# reemplazo" en la primera etapa hace que las dos etapas de azar queden
# empaquetadas en esa unica varianza entre clases. Ese truco es el motivo
# de que las encuestas reales declaren sus UPM "con reemplazo" (cap. 7).
# Aqui n/N = 5/15 no es chico, y Lohr advierte que este ee probablemente
# sobreestima: la ficcion rinde con cientos de UPM, no con 5 de 15.

cat("\n###BLOQUE-R14###\n")
# El mismo calculo en survey, con los pesos del archivo, y dos regalos del
# diseno: los pesos reconstruyen K, y son EXACTAMENTE autoponderados.
dis_cl <- svydesign(id = ~class, weights = ~finalweight, data = classpps)
svytotal(~hours, dis_cl)
#>        total     SE
#> hours 2232.2 311.76
svymean(~hours, dis_cl)
#>       mean     SE
#> hours 3.45 0.4819

c(suma_pesos = sum(classpps$finalweight), K = K)
#> suma_pesos          K
#>        647        647
round(5 * 4 / K, 4)       # prob. de cada estudiante: (5 M_i/647) (4/M_i) = 20/647
#> [1] 0.0309
unique(classpps$finalweight)
#> [1] 32.35
# UN SOLO peso: 32.35 = 647/(5 x 4). Con psi_i prop. a M_i y m_i = 4 fijo,
# los dos factores del peso se cancelan: w = (K/(n M_i)) * (M_i/m) = K/(nm).
# El diseno es EXACTAMENTE autoponderado — cada estudiante observado
# representa a 32.35 del marco — y esa es la razon de que las encuestas de
# hogares reales sorteen UPM con PPT y un numero fijo de hogares por UPM.

cat("\n###BLOQUE-R15###\n")
# La conexion con ciencia de datos: el PPT con reemplazo ES muestreo por
# importancia. Estimar el total de condados sorteando estados con una
# "propuesta" psi: cuanto mas se parezca psi a y/t, menor la varianza.
# Todo exacto (formula de HH sobre la poblacion completa):
psi_unif <- rep(1 / 51, 51)
psi_pop <- statepps$pop2019 / sum(statepps$pop2019)
psi_y <- statepps$counties / sum(statepps$counties)   # la propuesta "perfecta"
V_wr <- function(psi, n = 10) {
  sum(psi * (statepps$counties / psi - sum(statepps$counties))^2) / n
}
round(c(V_uniforme = V_wr(psi_unif), V_psi_pop = V_wr(psi_pop),
        V_psi_y = V_wr(psi_y)))
#> V_uniforme  V_psi_pop    V_psi_y
#>     557287     963006          0
# La propuesta psi ~ poblacion no solo no mejora al uniforme: lo EMPEORA
# (963 006 contra 557 287). Con correlacion tamano-condados de 0.46, el
# cociente y/psi queda MAS variable que con psi constante. La proporcional
# a y aniquila la varianza — pero exige conocer y, que es lo que se busca.
# En muestreo por importancia (integracion Monte Carlo, active learning,
# replay buffers) la mision es exactamente esa: disenar psi cerca de |y|
# usando una variable barata CONOCIDA para toda la poblacion.

cat("\n###BLOQUE-R16###\n")
# EJERCICIO 1. HH con psi ~ poblacion sobre statepps: n = 10 extracciones
# con reemplazo; estimar el total de condados y su ee, y comparar con el
# HH de probabilidades iguales.
set.seed(2026)
s1 <- sample(1:51, 10, replace = TRUE, prob = psi_pop)
z1 <- statepps$counties[s1] / psi_pop[s1]
s2 <- sample(1:51, 10, replace = TRUE)
z2 <- statepps$counties[s2] * 51
round(c(t_HH_psi = mean(z1), ee_psi = sqrt(var(z1) / 10),
        t_HH_igual = mean(z2), ee_igual = sqrt(var(z2) / 10)))
#>   t_HH_psi     ee_psi t_HH_igual   ee_igual
#>       2430        588       3886       1126
# Trampa instructiva: en ESTA realizacion el ee estimado del PPT (588) parece
# mejor que el del uniforme (1126)... y el bloque del modulo 10 demostro que la verdad
# es la contraria (V = 963 006 contra 557 287). Un ee estimado con n = 10 es
# una variable aleatoria ruidosa: una realizacion no adjudica un debate que
# las formulas exactas ya resolvieron. Confia en la V exacta, no en la
# anecdota — es el mismo mensaje del modulo 5.

cat("\n###BLOQUE-R17###\n")
# EJERCICIO 2. Sortear 5 clases de classes.csv por el metodo acumulativo,
# con reemplazo, y calcular los psi_i del marco.
acum_cl <- cumsum(clases$class_size)
set.seed(2026)
u <- runif(5) * K
sel <- findInterval(u, c(0, acum_cl), left.open = TRUE)
data.frame(uniforme = round(u, 1), clase = clases$class[sel],
           Mi = clases$class_size[sel],
           psi = round(clases$class_size[sel] / K, 4))
#>   uniforme clase Mi    psi
#> 1    452.0    11 46 0.0711
#> 2    360.1     9 54 0.0835
#> 3     90.7     3 26 0.0402
#> 4    184.9     5 76 0.1175
#> 5    359.3     9 54 0.0835
# La clase 9 salio DOS veces (u = 360.1 y u = 359.3 caen en su tramo): eso
# es el "con reemplazo" en accion, y no es un error — sus estudiantes se
# sortearian dos veces, y su t_hat/psi aportaria dos z_i al promedio HH.
# Las clases grandes acaparan tramos largos y repeticiones.

cat("\n###BLOQUE-R18###\n")
# EJERCICIO 3. Repetir el modulo 7 con acres87 — que es LA VARIABLE DE
# TAMANO con la que se construyeron las pi (sizemeas = acres87). Que le
# pasa al SYG cuando y_k es exactamente proporcional a pi_k?
d87 <- agpps$acres87 / agpps$SelectionProb
range(d87)   # y_k/pi_k es casi LA MISMA CONSTANTE en los 15 condados
#> [1] 64429949 64429951
t87 <- sum(d87)
V87 <- 0
for (k in 1:14) for (l in (k + 1):15) {
  V87 <- V87 + (agpps$SelectionProb[k] * agpps$SelectionProb[l] - Pmat[k, l]) /
    Pmat[k, l] * (d87[k] - d87[l])^2
}
c(t_87 = t87, ee_87 = as.numeric(sqrt(V87)))
#>            t_87           ee_87
#> 966449249.48019         1.23584
# Un ee de ~1 ACRE sobre un total de 966 millones: el SYG colapsa porque
# cada termino lleva (d_k - d_l)^2 y todos los d son casi iguales. Es el
# pi-PT en estado puro — para la variable de tamano, la varianza es
# (esencialmente) cero por construccion. acres92 no es acres87, y por eso
# su cv es 1.3 % y no cero: el pi-PT rinde segun lo bien que el tamano de
# ayer prediga la variable de hoy.

cat("\n###BLOQUE-R19###\n")
# EJERCICIO 4. Poisson frente al sistematico sobre statepps, con las mismas
# pi: las dos varianzas EXACTAS. El sistematico tiene pocas muestras
# posibles: el arranque u ~ U(0, 1) decide la muestra, y entre dos "cortes"
# (las partes fraccionarias de las pi acumuladas) sale siempre la misma.
# Basta recorrer esos tramos y ponderar cada HT por la longitud del suyo.
v_sistematico <- function(y, pi) {
  acum <- c(0, cumsum(pi))
  cortes <- sort(unique(round(c(0, 1, acum %% 1), 12)))
  V <- 0
  for (j in seq_len(length(cortes) - 1)) {
    u <- (cortes[j] + cortes[j + 1]) / 2                   # un arranque del tramo
    s <- floor(acum[-1] - u) > floor(head(acum, -1) - u)   # lo que elige UPsystematic
    V <- V + (cortes[j + 1] - cortes[j]) * (sum(y[s] / pi[s]) - sum(y))^2
  }
  V
}
v_poisson <- function(y, pi) sum((1 - pi) * y^2 / pi)
round(sapply(statepps[c("waterarea", "counties")], function(y)
  c(V_poisson = v_poisson(y, pi_st), V_sistematico = v_sistematico(y, pi_st),
    razon = v_poisson(y, pi_st) / v_sistematico(y, pi_st))), 2)
#>                      waterarea   counties
#> V_poisson     2625514850771.31 1604348.62
#> V_sistematico 2523053241934.55  575400.94
#> razon                     1.04       2.79
# Con waterarea, Poisson paga solo un 4 % mas que el sistematico: casi toda
# la varianza viene de que waterarea NO acompana a las pi (deff 9 frente al
# MAS, modulo 5), y el n aleatorio apenas suma. Con counties la razon sube a
# 2.8, y no porque las pi trabajen bien (el modulo 5 mostro que no): lo que
# anade el n aleatorio depende sobre todo de la escala de la variable (del
# orden de V(n_s) (t/n)^2), y con counties eso es tanto como toda la varianza
# del sistematico. Por eso Poisson se reserva para marcos que llegan en flujo
# (una unidad a la vez). (Las 10 000 replicas del modulo 5 dan 571 878 para
# el sistematico con counties: la exacta difiere un 0.6 %, el error de simular.)

cat("\n###BLOQUE-R25###\n")
# EJERCICIO 5 (Gutierrez, sec. 4.5). Diez unidades con estos tamanos y n = 6:
x5 <- c(62, 151, 76, 77, 80, 60, 194, 78, 74, 61)
sum(x5)
#> [1] 913
round(6 * x5 / sum(x5), 4)            # las pi crudas: la 7 pasa de 1
#>  [1] 0.4074 0.9923 0.4995 0.5060 0.5257 0.3943 1.2749 0.5126 0.4863 0.4009
# La 7 entra siempre; quedan 5 cupos para las demas. Con ellos, la 2 pasa de
# 1 y entra siempre; quedan 4 cupos para las otras ocho, sobre 913 - 194 - 151:
p5 <- inclusionprobabilities(x5, 6)
round(p5, 4)
#>  [1] 0.4366 1.0000 0.5352 0.5423 0.5634 0.4225 1.0000 0.5493 0.5211 0.4296
# Poisson con los uniformes del enunciado: entra la unidad k si eps_k < pi_k.
eps <- c(0.858, 0.698, 0.541, 0.320, 0.965, 0.497, 0.208, 0.006, 0.340, 0.206)
which(eps < p5)
#> [1]  2  4  7  8  9 10
# Sunter: la lista de mayor a menor, y los xi en ese orden. La unidad entra si
# xi < pi_k (n - e_k) / (n - A_k), con e_k las ya elegidas y A_k la suma de las
# pi anteriores.
xi <- c(0.322, 0.542, 0.032, 0.141, 0.453, 0.668, 0.174, 0.318, 0.691, 0.006)
o5 <- order(x5, decreasing = TRUE)
elegidas <- 0; A <- 0; pasos <- NULL
for (j in 1:10) {
  k <- o5[j]
  umbral <- p5[k] * (6 - elegidas) / (6 - A)
  entra <- xi[j] < umbral
  pasos <- rbind(pasos, data.frame(paso = j, unidad = k, pi = round(p5[k], 4),
                                   umbral = round(umbral, 4), xi = xi[j], entra = entra))
  elegidas <- elegidas + entra
  A <- A + p5[k]
}
pasos
#>    paso unidad     pi umbral    xi entra
#> 1     1      7 1.0000 1.0000 0.322  TRUE
#> 2     2      2 1.0000 1.0000 0.542  TRUE
#> 3     3      5 0.5634 0.5634 0.032  TRUE
#> 4     4      8 0.5493 0.4795 0.141  TRUE
#> 5     5      4 0.5423 0.3756 0.453 FALSE
#> 6     6      3 0.5352 0.4565 0.668 FALSE
#> 7     7      9 0.5211 0.5759 0.174  TRUE
#> 8     8      1 0.4366 0.3388 0.318  TRUE
#> 9     9     10 0.4296 0.0000 0.691 FALSE
#> 10   10      6 0.4225 0.0000 0.006 FALSE
sort(pasos$unidad[pasos$entra])
#> [1] 1 2 5 7 8 9
sort(TeachingSampling::S.piPS(6, x5, e = xi)[, 1])   # lo mismo con S.piPS
#> [1] 1 2 5 7 8 9

cat("\n###BLOQUE-R26###\n")
# EJERCICIO 6 (Sarndal et al., 1992, p. 117, via Gutierrez). Poisson sobre
# N = 284 unidades con pi_k = 10 x_k / 8182: salieron 12, no 10.
xs <- c(54, 671, 28, 27, 29, 62, 42, 48, 33, 446, 12, 46)
ys <- c(5246, 59877, 2208, 2546, 2903, 6850, 3773, 4055, 4014, 38945, 1162, 4852)
ps <- 10 * xs / 8182
t_ht6 <- sum(ys / ps)
ee6 <- sqrt(sum((1 - ps) * ys^2 / ps^2))      # el estimador de varianza de Poisson
round(c(t_HT = t_ht6, ee = ee6, cv = ee6 / t_ht6,
        IC_inf = t_ht6 - 1.96 * ee6, IC_sup = t_ht6 + 1.96 * ee6), 3)
#>       t_HT         ee         cv     IC_inf     IC_sup
#>  945598.21  255586.54       0.27  444648.60 1446547.82
# Salieron 12 y no 10: el HT de x, que deberia dar 8182, da 12 x 818.2, un
# 20 % de mas. Es el t n_s / n del modulo 6:
c(t_HT_de_x = sum(xs / ps), cociente = sum(xs / ps) / 8182)
#> t_HT_de_x  cociente
#>    9818.4       1.2
# La media: dividir entre N = 284 (HT) o entre N estimado (Hajek). Y el total
# corregido con la razon del modulo 6, que usa t_x = 8182:
N_hat <- sum(1 / ps)
round(c(N_hat = N_hat, media_HT = t_ht6 / 284, media_Hajek = t_ht6 / N_hat,
        t_razon = 8182 * t_ht6 / sum(xs / ps)), 2)
#>       N_hat    media_HT media_Hajek     t_razon
#>      266.43     3329.57     3549.11   787998.51
