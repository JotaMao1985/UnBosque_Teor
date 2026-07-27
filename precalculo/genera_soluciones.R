# genera_soluciones.R — resuelve los ejercicios guiados del Capítulo 2
#
#   /Library/Frameworks/R.framework/Versions/4.4-arm64/Resources/bin/Rscript precalculo/genera_soluciones.R
#
# Cada cifra que aparece en la solución de un ejercicio del capítulo sale de
# aquí. El enunciado es original; los datos son los oficiales de Lohr.

source("precalculo/_comun.R")
suppressPackageStartupMessages(library(survey))

linea <- function(txt) cat("\n", strrep("=", 68), "\n", txt, "\n", strrep("=", 68), "\n", sep = "")

# ---------------------------------------------------------------------------
linea("EJERCICIO 1 — Probabilidades de inclusión en un diseño desigual")
# Población de 5 condados, diseño C: p(s) proporcional a x_k + x_l.
# (a) pi_2 y pi_24   (b) comprobar que las pi_k suman n
# (c) t_HT de la muestra {2,4}   (d) el estimador de expansión sobre la misma
y <- c(14, 18, 27, 33, 58)
x <- c(1, 1, 2, 2, 4)
N <- 5; n <- 2
muestras <- t(combn(N, n))
p_des <- apply(muestras, 1, function(s) sum(x[s]))
p_des <- p_des / sum(p_des)

pi_k <- sapply(1:N, function(k) sum(p_des[apply(muestras, 1, function(s) k %in% s)]))
fila24 <- which(muestras[, 1] == 2 & muestras[, 2] == 4)
pi_24 <- p_des[fila24]      # a n = 2 cada par ES una muestra: pi_kl = p(s)

t_ht_24 <- y[2] / pi_k[2] + y[4] / pi_k[4]
t_exp_24 <- N * mean(y[c(2, 4)])

cat(sprintf("  pi_2  = %.4f   (= 13/40)\n", pi_k[2]))
cat(sprintf("  pi_24 = %.4f   (= p({2,4}) = 3/40)\n", pi_24))
cat(sprintf("  suma de las pi_k = %.6f  (tiene que ser n = %d)\n", sum(pi_k), n))
cat(sprintf("  pesos: d_2 = %.4f, d_4 = %.4f\n", 1 / pi_k[2], 1 / pi_k[4]))
cat(sprintf("  t_HT({2,4})     = %.4f\n", t_ht_24))
cat(sprintf("  N * media({2,4}) = %.4f     total verdadero = %d\n", t_exp_24, sum(y)))
stopifnot(abs(sum(pi_k) - n) < 1e-12)

# ---------------------------------------------------------------------------
linea("EJERCICIO 2 — Estimar el total de granjas con agsrs")
agpop <- lee_lohr("agpop")
agsrs <- lee_lohr("agsrs")
cat(sprintf("  farms92 con código -99 en agpop: %d ; en agsrs: %d\n",
            sum(agpop$farms92 < 0), sum(agsrs$farms92 < 0)))

N_marco <- nrow(agpop)
n_srs <- nrow(agsrs)
dis <- svydesign(id = ~1, fpc = rep(N_marco, n_srs), data = agsrs)
tot <- svytotal(~farms92, dis)
ic <- confint(tot, df = degf(dis))
total_real <- sum(agpop$farms92)

# La misma cuenta a mano, que es la segunda vía obligatoria
media <- mean(agsrs$farms92)
ee_mano <- N_marco * sqrt((1 - n_srs / N_marco) * var(agsrs$farms92) / n_srs)

cat(sprintf("  t_hat        = %.0f\n", coef(tot)))
cat(sprintf("  EE (survey)  = %.2f\n", SE(tot)))
cat(sprintf("  EE (a mano)  = %.2f   dif. relativa = %.2e\n",
            ee_mano, abs(ee_mano - SE(tot)) / SE(tot)))
cat(sprintf("  IC 95%%       = [%.0f, %.0f]\n", ic[1], ic[2]))
cat(sprintf("  total real   = %d   -> ¿lo cubre? %s\n", total_real,
            if (ic[1] <= total_real && total_real <= ic[2]) "SÍ" else "NO"))
cat(sprintf("  error relativo de la estimación puntual = %+.2f %%\n",
            100 * (coef(tot) - total_real) / total_real))
stopifnot(abs(ee_mano - SE(tot)) / SE(tot) < 1e-10)

# ---------------------------------------------------------------------------
linea("EJERCICIO 3 — Proporción de condados grandes y tamaño de muestra")
agsrs$grande <- as.integer(agsrs$acres92 > 200000)
# El objeto de diseño guarda una COPIA de los datos: si se añade una columna
# después de crearlo, hay que volver a declararlo o svymean no la encuentra.
dis <- svydesign(id = ~1, fpc = rep(N_marco, n_srs), data = agsrs)
p_est <- svymean(~grande, dis)
ic_p <- confint(p_est, df = degf(dis))
p_hat <- as.numeric(coef(p_est))
p_real <- mean(agpop$acres92[agpop$acres92 >= 0] > 200000)

z <- qnorm(0.975)
e <- 0.03
n0_phat <- z^2 * p_hat * (1 - p_hat) / e^2
n_phat <- ceiling(n0_phat / (1 + n0_phat / N_marco))
n0_conservador <- z^2 * 0.25 / e^2
n_conservador <- ceiling(n0_conservador / (1 + n0_conservador / N_marco))

cat(sprintf("  p_hat = %.4f   EE = %.4f   IC 95%% = [%.4f, %.4f]\n",
            p_hat, SE(p_est), ic_p[1], ic_p[2]))
cat(sprintf("  proporción real en la población (3059 válidos) = %.4f\n", p_real))
cat(sprintf("  con p = p_hat:  n0 = %.2f -> n = %d\n", n0_phat, n_phat))
cat(sprintf("  con p = 0.5:    n0 = %.2f -> n = %d   (%d condados más)\n",
            n0_conservador, n_conservador, n_conservador - n_phat))
# Contraste: si la proporción fuera extrema, la cota conservadora sí costaría
n0_10 <- z^2 * 0.10 * 0.90 / e^2
cat(sprintf("  si en cambio p fuera 0.10:  n0 = %.2f -> n = %d\n",
            n0_10, ceiling(n0_10 / (1 + n0_10 / N_marco))))

# ---------------------------------------------------------------------------
linea("EJERCICIO 4 — Sistemático 1 en 6 sobre agpop")
pobdf <- agpop[agpop$acres92 >= 0, ]
pob <- pobdf$acres92
k <- 6
n_sis <- floor(length(pob) / k)

medias_arranque <- function(v, kk) sapply(seq_len(kk), function(r) mean(v[seq(r, length(v), by = kk)]))
v_sis <- function(v, kk) mean((medias_arranque(v, kk) - mean(v))^2)
v_mas <- function(v, m) (1 - m / length(v)) * var(v) / m

orden_aux <- order(replace(pobdf$acres87, pobdf$acres87 < 0, NA), na.last = TRUE)
for (etiqueta in c("orden original", "ordenado por acres87")) {
  v <- if (etiqueta == "orden original") pob else pob[orden_aux]
  vs <- v_sis(v, k); vm <- v_mas(v, n_sis)
  cat(sprintf("  %-22s n = %d  V_sis = %.4e  V_MAS = %.4e  DEFF = %.4f\n",
              etiqueta, n_sis, vs, vm, vs / vm))
}
cat(sprintf("  medias de los %d arranques (orden original, en miles):\n    %s\n", k,
            paste(round(medias_arranque(pob, k) / 1000, 1), collapse = "  ")))

cat("\nListo.\n")
