suppressMessages(library(survey))
Sys.setlocale("LC_CTYPE", "en_US.UTF-8")
options(warn = 1)
# La cadena escribe datos/marco.csv y datos/muestra.csv como lo haria el
# proyecto de un estudiante: se corre en una carpeta temporal, no en el repo.
setwd(tempdir()); unlink("datos", recursive = TRUE)

cat("\n###BLOQUE-R1###\n")
# El tamano, antes de seleccionar nada. El marco es un archivo publico: las
# escuelas de apipop, con su tipo (E primaria, M basica secundaria, H media).
# Un piloto de 10 escuelas por tipo, con su propia semilla, da la variabilidad
# de cada estrato; con ella se compara el aleatorio simple con el estratificado.
library(survey)
data(api)
marco <- data.frame(id = seq_len(nrow(apipop)), estrato = as.character(apipop$stype))
dir.create("datos", showWarnings = FALSE)
write.csv(marco, "datos/marco.csv", row.names = FALSE)   # el marco: id y estrato, nada mas
N <- nrow(marco)
N_h <- table(marco$estrato)
W_h <- N_h / N
set.seed(2026)
piloto <- unlist(lapply(names(N_h), function(h) {
  ids <- marco$id[marco$estrato == h]
  ids[sample(length(ids), 10)]
}))
y_piloto <- apipop$api00[piloto]                  # medir el piloto
h_piloto <- marco$estrato[piloto]
S2_h <- tapply(y_piloto, h_piloto, var)[names(N_h)]
m_h <- tapply(y_piloto, h_piloto, mean)[names(N_h)]
S2 <- sum(W_h * S2_h) + sum(W_h * (m_h - sum(W_h * m_h))^2)  # varianza total aproximada
e <- 15                                           # el margen que se quiere, en puntos del indice
z <- qnorm(0.975)
tamano <- function(v) { n0 <- z^2 * v / e^2; ceiling(n0 / (1 + n0 / N)) }
c(MAS = tamano(S2), estratificado_proporcional = tamano(sum(W_h * S2_h)))
#>                        MAS estratificado_proporcional
#>                        286                        266

cat("\n###BLOQUE-R2###\n")
# R/seleccion.R: la seleccion, en un R recien abierto y despues del cierre del
# protocolo. Lee el marco, sortea con la semilla que publico el docente y
# escribe la muestra con su pi_k y su peso.
marco <- read.csv("datos/marco.csv")
n_h <- c(E = 190, H = 32, M = 44)        # la asignacion del protocolo: proporcional, suma 266
stopifnot(setequal(names(n_h), unique(marco$estrato)))
seleccionar <- function(marco, n_h) unlist(lapply(names(n_h), function(h) {
  ids <- marco$id[marco$estrato == h]
  ids[sample(length(ids), n_h[[h]])]     # sample(ids, n) falla si el estrato tiene 1 unidad
}))
set.seed(2027)                  # la semilla publicada en el issue «semilla»
muestra <- marco[match(seleccionar(marco, n_h), marco$id), ]
N_h <- table(marco$estrato)
muestra$N_h <- as.numeric(N_h[muestra$estrato])
muestra$pi_k <- as.numeric(n_h[muestra$estrato]) / muestra$N_h
muestra$peso <- 1 / muestra$pi_k
write.csv(muestra, "datos/muestra.csv", row.names = FALSE)
table(muestra$estrato)
#>   E   H   M
#> 190  32  44
sum(muestra$peso)               # en este diseno los pesos suman N exactamente
#> [1] 6194

cat("\n###BLOQUE-R3###\n")
# Comprobar el guion antes de ir al campo: se repite la seleccion 2000 veces y
# se cuenta cuantas veces sale CADA escuela. Su frecuencia tiene que rondar su
# pi_k: por azar, unas 3 de cada 1000 quedan a mas de 3 errores de Monte Carlo.
comprobar <- function(sel, R = 2000) {
  veces <- integer(nrow(marco))
  for (r in 1:R) {
    i <- match(sel(marco, n_h), marco$id)
    stopifnot(!anyDuplicated(i))
    veces[i] <- veces[i] + 1
  }
  pi_teo <- as.numeric(n_h[marco$estrato]) / as.numeric(N_h[marco$estrato])
  z <- (veces / R - pi_teo) / sqrt(pi_teo * (1 - pi_teo) / R)
  c(fuera_de_3 = sum(abs(z) > 3), nunca = sum(veces == 0), siempre = sum(veces == R))
}
set.seed(1)
comprobar(seleccionar)
#> fuera_de_3      nunca    siempre
#>         15          0          0
# Un guion roto que toma siempre las primeras escuelas de cada estrato: la
# media por estrato le sale perfecta, unidad por unidad no pasa.
primeras <- function(marco, n_h) unlist(lapply(names(n_h), function(h)
  head(marco$id[marco$estrato == h], n_h[[h]])))
comprobar(primeras)
#> fuera_de_3      nunca    siempre
#>       6194       5928        266

cat("\n###BLOQUE-R4###\n")
# La estimacion, con el diseno que se uso: estratos, pesos 1/pi_k y la
# correccion por poblacion finita, leyendo la muestra que escribio el guion.
muestra <- read.csv("datos/muestra.csv")
datos <- data.frame(id = muestra$id, respondio = TRUE,         # el «campo»: aqui todas
                    api00 = apipop$api00[muestra$id])           # responden; en tu caso, datos.csv
resp <- merge(muestra, datos[datos$respondio, ], by = "id")
dis <- svydesign(ids = ~1, strata = ~estrato, weights = ~peso, fpc = ~N_h, data = resp)
est <- svymean(~api00, dis, deff = TRUE)
est
#>           mean       SE  DEff
#> api00 680.4400   7.3616 0.995
confint(est)
#>          2.5 %   97.5 %
#> api00 666.0115 694.8685
# Segunda via: la formula del estratificado, a mano, tiene que dar el mismo EE.
n_r <- table(resp$estrato)[names(N_h)]
s2 <- tapply(resp$api00, resp$estrato, var)[names(N_h)]
sqrt(sum((N_h / N)^2 * (1 - n_r / N_h) * s2 / n_r))
#> [1] 7.361597
mu <- mean(apipop$api00)        # el parametro: solo se conoce porque el marco es publico
mu
#> [1] 664.7126
ic <- confint(est)
ic[1] <= mu & mu <= ic[2]       # ¿lo contiene? en 1 de cada 20 muestras, no
#> [1] FALSE
