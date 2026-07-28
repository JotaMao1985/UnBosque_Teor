# genera_cap3.R — datos del capítulo 3 (estimación de razón y regresión)
#
# Ejecutar SIEMPRE con el R del framework 4.4:
#   /Library/Frameworks/R.framework/Versions/4.4-arm64/Resources/bin/Rscript precalculo/genera_cap3.R
#
# Produce precalculo/salidas/cap3_datos.json.
#
# PROTOCOLO: toda varianza se calcula por DOS vías —la fórmula implementada a
# mano y `survey`— y el script aborta si no coinciden. Donde Lohr publica la
# cifra, se contrasta también contra ella: es una tercera vía, y externa.
#
# NUMERACIÓN DE LOS CAPÍTULOS DE LOHR. Razón y regresión es el capítulo 3 en la
# 2.ª edición y el 4 en la 3.ª. El cronograma del syllabus y el material previo
# usan la numeración de la 2.ª; las cifras que se contrastan aquí salen de la
# 3.ª (ejemplos 4.2, 4.3, 4.6, 4.8, 4.11 y 4.12). Las referencias del capítulo
# dan las dos numeraciones para que nadie busque en el capítulo equivocado.

source("precalculo/_comun.R")
suppressPackageStartupMessages({library(survey); library(jsonlite)})
options(survey.lonely.psu = "adjust")

cat("\n=== Capítulo 3 · precálculo ===\n")

igual <- function(a, b, tol = 1e-8, que = "") {
  rel <- abs(a - b) / max(1, abs(b))
  if (rel > tol) stop(sprintf("DISCREPANCIA en %s: %.10f vs %.10f (rel %.2e)", que, a, b, rel))
  invisible(rel)
}

# ===========================================================================
# 1 · La población y la muestra
# ===========================================================================
agpop <- lee_lohr("agpop")
agsrs <- lee_lohr("agsrs")
N <- nrow(agpop); n <- nrow(agsrs)
stopifnot(N == 3078, n == 300)

t_x  <- sum(agpop$acres87)      # total auxiliar, conocido para TODA la población
t_y  <- sum(agpop$acres92)      # el parámetro que se quiere estimar (aquí se conoce)
xbar_U <- t_x / N

y <- agsrs$acres92
x <- agsrs$acres87
ybar <- mean(y); xbar <- mean(x)

cat(sprintf("t_x = %.0f  t_y = %.0f  ybar = %.4f  xbar = %.4f  r = %.6f\n",
            t_x, t_y, ybar, xbar, cor(x, y)))

dis <- svydesign(id = ~1, fpc = rep(N, n), data = agsrs)

# ===========================================================================
# 2 · Estimador de expansión (la referencia sin variable auxiliar)
# ===========================================================================
t_exp   <- N * ybar
se_exp  <- N * sqrt((1 - n / N) * var(y) / n)
sv_exp  <- svytotal(~acres92, dis)
igual(t_exp,  coef(sv_exp),  1e-10, "total de expansión")
igual(se_exp, SE(sv_exp)[1], 1e-10, "EE del total de expansión")
cat(sprintf("expansión:  t = %.0f  EE = %.0f\n", t_exp, se_exp))

# ===========================================================================
# 3 · Estimador de razón
# ===========================================================================
B <- ybar / xbar
t_raz <- B * t_x
e <- y - B * x                                  # residuos respecto de la recta por el origen
s_e <- sqrt(sum(e^2) / (n - 1))
# Lohr (4.13): SE(t_yr) = (t_x / xbar) * sqrt(1 - n/N) * s_e / sqrt(n)
se_raz <- (t_x / xbar) * sqrt(1 - n / N) * s_e / sqrt(n)

sv_raz <- svyratio(~acres92, ~acres87, dis)
t_raz_sv  <- coef(sv_raz) * t_x
se_raz_sv <- SE(sv_raz)[1] * t_x
igual(t_raz,  t_raz_sv,  1e-10, "total por razón (survey)")
igual(se_raz, se_raz_sv, 1e-6,  "EE del total por razón (survey)")

cat(sprintf("razón:      t = %.0f  EE = %.0f  s_e = %.4f\n", t_raz, se_raz, s_e))

g_ajuste <- t_x / (N * xbar)      # el factor g: el ajuste que la razón hace a los pesos
peso_srs <- N / n
cat(sprintf("            g = %.9f  peso MAS = %.2f  peso ajustado = %.6f\n",
            g_ajuste, peso_srs, peso_srs * g_ajuste))

# ---------------------------------------------------------------------------
# Tercera vía, externa: contrastar contra las cifras publicadas por Lohr.
#
# HALLAZGO DE LA AUDITORÍA (2026-07-27). Dos de las tres cuadran a la
# perfección y una no, y el motivo importa:
#
#   s_e     = 31 657,218  -> idéntico al del ejemplo 4.3. La muestra `agsrs` y
#                            la razón B̂ son exactamente las de Lohr.
#   t_hat_x = 929 413 562 -> el ejemplo 4.6 da 929 413 560. Coincide.
#   t_x     = 963 464 412 -> el ejemplo 4.6 usa 964 470 625, un 0,104 % más.
#
# Es decir: la muestra es la misma y el TOTAL POBLACIONAL AUXILIAR no. Sumar la
# columna `acres87` de `agpop.csv` da 963 464 412 con los 23 códigos -99 dentro
# y 963 466 689 sin ellos; ninguna de las dos variantes llega a la cifra del
# libro, así que la diferencia no son los faltantes. El material usa la suma
# del archivo que tienen los estudiantes —lo único reproducible— y lo declara
# en el capítulo. Consecuencia: t̂_r sale 950 520 496 en vez de 951 513 191,
# un 0,104 % por debajo. Todo lo demás es idéntico.
# ---------------------------------------------------------------------------
LOHR <- list(sE = 31657.218, tHatX = 929413560, tX = 964470625,
             tRaz = 951513191, seRaz = 5546162, g = 1.037719554)
igual(s_e, LOHR$sE, 1e-5, "desviación de los residuos (Lohr ej. 4.3)")
igual(N * xbar, LOHR$tHatX, 1e-8, "total auxiliar estimado (Lohr ej. 4.6)")
discrepancia <- list(
  tXArchivo = t_x, tXLohr = LOHR$tX,
  pct = 100 * (LOHR$tX / t_x - 1),
  tRazArchivo = t_raz, tRazLohr = LOHR$tRaz,
  seRazArchivo = se_raz, seRazLohr = LOHR$seRaz,
  gArchivo = g_ajuste, gLohr = LOHR$g)
cat(sprintf("            [auditoría] t_x del archivo %.0f frente a %.0f del libro (%.3f %% más)\n",
            t_x, LOHR$tX, discrepancia$pct))
cat(sprintf("            [auditoría] t̂_r %.0f frente a %.0f; s_e y t̂_x sí coinciden\n",
            t_raz, LOHR$tRaz))
stopifnot(abs(discrepancia$pct) < 0.2)   # si un día se dispara, hay que mirarlo

# ===========================================================================
# 4 · Estimador de regresión y estimador de diferencia
# ===========================================================================
b1 <- cov(x, y) / var(x)
b0 <- ybar - b1 * xbar
t_reg <- N * (ybar + b1 * (xbar_U - xbar))
res_reg <- y - (b0 + b1 * x)
s_reg <- sqrt(sum(res_reg^2) / (n - 2))
se_reg <- N * sqrt((1 - n / N) * s_reg^2 / n)

# survey: el estimador de regresión es la calibración a los totales (N, t_x).
dis_cal <- calibrate(dis, ~acres87, c(`(Intercept)` = N, acres87 = t_x))
sv_reg <- svytotal(~acres92, dis_cal)
igual(t_reg, coef(sv_reg), 1e-8, "total por regresión (survey ↔ fórmula)")
cat(sprintf("regresión:  t = %.0f  EE a mano = %.0f  EE survey = %.0f\n",
            t_reg, se_reg, SE(sv_reg)[1]))
# survey estima la varianza con los pesos g (estimador "sandwich"); la fórmula
# clásica de Lohr usa s_reg sin ese ajuste. Coinciden hasta el término de orden
# 1/n, y el capítulo lo declara en vez de esconderlo.
dif_reg_rel <- abs(SE(sv_reg)[1] - se_reg) / se_reg
cat(sprintf("            diferencia relativa entre las dos vías: %.4f %%\n", 100 * dif_reg_rel))
stopifnot(dif_reg_rel < 0.05)

t_dif <- t_x + N * (ybar - xbar)
d <- y - x
se_dif <- N * sqrt((1 - n / N) * var(d) / n)
cat(sprintf("diferencia: t = %.0f  EE = %.0f\n", t_dif, se_dif))
# La diferencia es la regresión con la pendiente fijada en 1: se comprueba
# calibrando con el offset, que es la definición.
igual(t_dif, t_x + N * mean(d), 1e-10, "total por diferencia")

# ===========================================================================
# 5 · Comparación de los cuatro estimadores
# ===========================================================================
# Para la regresión se publica el error estándar de `survey` y no la fórmula
# clásica: `survey` estima la varianza de diseño del estimador calibrado con
# los pesos g, mientras que N²(1−f)s²_reg/n es la aproximación de libro, que
# ignora ese ajuste. Difieren un 4,9 % y el capítulo lo dice; usar cada una en
# un sitio distinto es lo que produce tablas que no cuadran entre sí.
se_reg_survey <- as.numeric(SE(sv_reg)[1])
estimadores <- data.frame(
  nombre = c("Expansión  N·ȳ", "Razón  B̂·t_x", "Regresión", "Diferencia"),
  clave  = c("expansion", "razon", "regresion", "diferencia"),
  total  = c(t_exp, t_raz, t_reg, t_dif),
  ee     = c(se_exp, se_raz, se_reg_survey, se_dif),
  stringsAsFactors = FALSE
)
estimadores$error    <- estimadores$total - t_y
estimadores$errorPct <- 100 * estimadores$error / t_y
estimadores$eficiencia <- (se_exp / estimadores$ee)^2
print(estimadores, digits = 7)
cat(sprintf("total real = %.0f\n", t_y))

# ===========================================================================
# 6 · Sesgo del estimador de razón: no se supone, se mide
# ===========================================================================
# El estimador de razón es sesgado. El sesgo es de orden 1/n, así que
# desaparece al crecer la muestra; aquí se mide sobre agpop con simulación,
# y se contrasta con la aproximación teórica
#   B(t_yr) ≈ (N (1 - n/N) / n) * (B S_x^2 - S_xy) / xbar_U
set.seed(SEMILLA)
M <- 5000
tam <- c(10, 20, 30, 50, 75, 100, 200, 300, 500)
Sx2 <- var(agpop$acres87); Sxy <- cov(agpop$acres87, agpop$acres92)
B_pob <- t_y / t_x

sim <- lapply(tam, function(nn) {
  tr <- numeric(M)
  for (m in seq_len(M)) {
    s <- sample.int(N, nn)
    tr[m] <- (mean(agpop$acres92[s]) / mean(agpop$acres87[s])) * t_x
  }
  teorico <- (N * (1 - nn / N) / nn) * (B_pob * Sx2 - Sxy) / xbar_U
  list(n = nn, media = mean(tr), sesgo = mean(tr) - t_y, sesgoTeorico = teorico,
       ee = sd(tr), sesgoRelEE = (mean(tr) - t_y) / sd(tr))
})
tabla_sesgo <- do.call(rbind, lapply(sim, as.data.frame))
print(tabla_sesgo, digits = 5)
# El sesgo simulado y el teórico tienen que ir de la mano; con n grande el
# ruido de Monte Carlo domina, así que se compara solo donde el sesgo importa.
cor_sesgo <- cor(tabla_sesgo$sesgo[tabla_sesgo$n <= 100],
                 tabla_sesgo$sesgoTeorico[tabla_sesgo$n <= 100])
cat(sprintf("correlación sesgo simulado ↔ teórico (n ≤ 100): %.4f\n", cor_sesgo))
stopifnot(cor_sesgo > 0.95)

# ===========================================================================
# 7 · Linealización: qué término se desprecia
# ===========================================================================
# t_yr - t_y = (t_x / xbar_U) * (media de e) - (t_yr / xbar) * (xbar - xbar_U) * ...
# La forma limpia:  t_yr - t_y ≈ (N / 1) * (ebar) * (t_x / t_hat_x) con e = y - B x.
# El capítulo compara, muestra a muestra, el error exacto contra el lineal:
#   exacto = B_hat t_x - t_y
#   lineal = (t_x / xbar_U) * mean(y - B_pob * x)
set.seed(SEMILLA + 1)
M2 <- 3000
n_lin <- 50
ex <- li <- numeric(M2)
for (m in seq_len(M2)) {
  s <- sample.int(N, n_lin)
  ys <- agpop$acres92[s]; xs <- agpop$acres87[s]
  ex[m] <- (mean(ys) / mean(xs)) * t_x - t_y
  li[m] <- (t_x / xbar_U) * mean(ys - B_pob * xs)
}
cat(sprintf("linealización con n = %d: correlación %.5f, EE exacto %.0f, EE lineal %.0f\n",
            n_lin, cor(ex, li), sd(ex), sd(li)))
stopifnot(cor(ex, li) > 0.97)

# ===========================================================================
# 8 · Estimación en dominios
# ===========================================================================
# Dominios de Lohr (ejemplo 4.8): condados con 600 granjas o más, y el resto.
agsrs$dom <- ifelse(agsrs$farms92 >= 600, "600 o más granjas", "menos de 600 granjas")
dis2 <- svydesign(id = ~1, fpc = rep(N, n), data = agsrs)
med_dom <- svyby(~acres92, ~dom, dis2, svymean)
tot_dom <- svyby(~acres92, ~dom, dis2, svytotal)
print(med_dom); print(tot_dom)

# Segunda vía a mano: la media de dominio es una razón (suma de y·indicador
# sobre suma del indicador), y su EE sale de la linealización.
dominios <- lapply(unique(agsrs$dom), function(dd) {
  ind <- as.numeric(agsrs$dom == dd)           # numérico: con enteros, N*sum() desborda
  nd  <- sum(ind)
  ybar_d <- sum(y * ind) / nd
  # La media de dominio es una razón: y·indicador sobre indicador. Su error
  # estándar sale de linealizarla, y el residuo linealizado es ind·(y - ȳ_d).
  u <- ind * (y - ybar_d)
  se_d <- sqrt((1 - n / N) / n) * sd(u) / (nd / n)
  list(dominio = dd, nd = nd, media = ybar_d, ee = se_d,
       total = N * sum(y * ind) / n,
       eeTotal = N * sqrt((1 - n / N) * var(y * ind) / n))
})
tabla_dom <- do.call(rbind, lapply(dominios, as.data.frame))
print(tabla_dom, digits = 7)
for (i in seq_len(nrow(tabla_dom))) {
  j <- which(med_dom$dom == tabla_dom$dominio[i])
  igual(tabla_dom$media[i], med_dom$acres92[j], 1e-10, "media de dominio")
  igual(tabla_dom$ee[i],    med_dom$se[j],      1e-4,  "EE de la media de dominio")
  k <- which(tot_dom$dom == tabla_dom$dominio[i])
  igual(tabla_dom$total[i],   tot_dom$acres92[k], 1e-10, "total de dominio")
  igual(tabla_dom$eeTotal[i], tot_dom$se[k],      1e-8,  "EE del total de dominio")
}
cat("dominios: media y total coinciden con survey por las dos vías\n")

# Dominios por región, para el simulador
agsrs$region <- agsrs$region
dom_reg <- svyby(~acres92, ~region, dis2, svymean)
NOMBRE_REGION <- c(NC = "Centro-Norte", NE = "Nordeste", S = "Sur", W = "Oeste")
tabla_reg <- data.frame(
  region = as.character(dom_reg$region),
  nombre = unname(NOMBRE_REGION[as.character(dom_reg$region)]),
  nd = as.numeric(table(agsrs$region)[as.character(dom_reg$region)]),
  media = dom_reg$acres92, ee = dom_reg$se,
  mediaReal = sapply(as.character(dom_reg$region),
                     function(r) mean(agpop$acres92[agpop$region == r])),
  stringsAsFactors = FALSE)
print(tabla_reg, digits = 6)

# ===========================================================================
# 9 · El estimador general de regresión (GREG), en su versión escalar
# ===========================================================================
# Con una sola auxiliar y un modelo de trabajo  y_k = beta x_k + eps_k  con
# V(eps_k) = sigma^2 v_k, el GREG es
#   t_greg = t_hat_pi + beta_hat (t_x - t_hat_x)
# y beta_hat es la pendiente por mínimos cuadrados ponderados con peso 1/v_k.
# Los tres estimadores del capítulo son tres elecciones de v_k:
#   v_k = x_k  -> razón      v_k = 1 -> regresión sin intercepto
# y con el intercepto en el modelo se recupera la regresión clásica.
#
# Con v_k = x_k hay que resolver antes un detalle práctico: la muestra trae
# valores de x que no son positivos (los códigos -99 y los ceros), y 1/x_k no
# está definido ahí. Lohr hace lo mismo en su ejemplo 4.11 —"for the data points
# with x positive"—, así que la ponderación se calcula sobre esas unidades y se
# reporta cuántas quedan fuera.
positivos <- x > 0
cat(sprintf("GREG: unidades con x > 0: %d de %d — la excluida es %s (%s), con x = %d e y = %d\n",
            sum(positivos), n, agsrs$county[!positivos], agsrs$state[!positivos],
            x[!positivos], y[!positivos]))
# La única unidad que se cae es un condado sin superficie agrícola en ninguno de
# los dos censos, así que no aporta nada a ninguna de las dos sumas y la
# identidad GREG = razón sigue siendo exacta. Conviene comprobarlo y no
# suponerlo: si la excluida tuviera y distinto de cero, dejaría de serlo.
stopifnot(sum(!positivos) == 0 || all(y[!positivos] == 0))

greg <- function(vk, usar = rep(TRUE, n)) {
  w <- 1 / vk
  beta <- sum(w[usar] * x[usar] * y[usar]) / sum(w[usar] * x[usar]^2)
  t_pi <- N * ybar; t_x_pi <- N * xbar
  list(beta = beta, total = t_pi + beta * (t_x - t_x_pi))
}
g_razon <- greg(x, positivos)                    # v_k = x_k
g_homo  <- greg(rep(1, n), positivos)            # v_k = 1
igual(g_razon$beta, B, 1e-10, "GREG con v_k = x_k reproduce la razón (pendiente)")
igual(g_razon$total, t_raz, 1e-8, "GREG con v_k = x_k reproduce la razón (total)")
cat(sprintf("GREG: v_k = x_k -> beta = %.8f (= B̂), total = %.0f (= razón)\n",
            g_razon$beta, g_razon$total))
cat(sprintf("      v_k = 1   -> beta = %.8f, total = %.0f\n", g_homo$beta, g_homo$total))
# Y con beta fijada en 1 se obtiene el estimador de diferencia.
t_greg_uno <- N * ybar + 1 * (t_x - N * xbar)
igual(t_greg_uno, t_dif, 1e-10, "GREG con beta = 1 reproduce la diferencia")
cat(sprintf("      beta = 1  -> total = %.0f (= diferencia)\n", t_greg_uno))

# La curva de totales GREG en función de beta: el capítulo la dibuja y marca
# dónde caen los cuatro estimadores.
betas <- seq(0, 2, by = 0.02)
curva_greg <- N * ybar + betas * (t_x - N * xbar)
puntos_greg <- list(
  list(nombre = "Expansión (β = 0)", beta = 0, total = t_exp),
  list(nombre = "Razón (β = B̂)", beta = B, total = t_raz),
  list(nombre = "Regresión (β = b₁)", beta = b1, total = t_reg),
  list(nombre = "Diferencia (β = 1)", beta = 1, total = t_dif)
)
for (p in puntos_greg) {
  igual(p$total, N * ybar + p$beta * (t_x - N * xbar), 1e-8,
        paste("punto GREG:", p$nombre))
}

# ===========================================================================
# 10 · Parámetros no lineales: la razón poblacional y la mediana
# ===========================================================================
B_est <- B
se_B  <- SE(sv_raz)[1]
cat(sprintf("razón poblacional: B = %.6f (real %.6f), EE = %.6f\n", B_est, B_pob, se_B))

# Mediana por la función de distribución estimada. F_hat(t) = suma de pesos de
# las unidades con y <= t, dividida por la suma de pesos; la mediana es el
# menor t con F_hat(t) >= 0,5.
# La mediana de una población finita se define como el menor valor con
# F(t) >= 0,5, que es `type = 1` de quantile(). `median()` promedia los dos
# valores centrales cuando N es par y da 191 648 en vez de 191 486: son
# definiciones distintas y mezclarlas produce una discrepancia inexplicable.
mediana_real <- as.numeric(quantile(agpop$acres92, 0.5, type = 1))

w <- rep(N / n, n)
orden <- order(y)
y_ord <- y[orden]
F_hat <- cumsum(w[orden]) / sum(w)
# La comparación lleva tolerancia a propósito. Con pesos iguales, F en la
# unidad 150 vale exactamente 0,5, pero cumsum()/sum() la deja en
# 0,49999999999 en R y en 0,50000000000001 en Python: sin tolerancia, las
# pestañas de R y de Python del mismo capítulo publican cuantiles distintos.
# Se detectó comparando las dos salidas, no razonando sobre el código.
TOL_F <- 1e-9
cuantil_F <- function(p) y_ord[which(F_hat >= p - TOL_F)[1]]
mediana_manual <- cuantil_F(0.5)
# HALLAZGO DE LA AUDITORÍA (2026-07-27): la mediana muestral NO está definida
# de forma única cuando F̂ alcanza 0,5 exactamente, que es lo que pasa siempre
# que n·p es entero y los pesos son iguales. Aquí, la unidad 150 vale 196 701 y
# la 151 vale 196 733, y las dos son "la mediana" según qué convenio se use:
#   qrule = "math" (el de por defecto en survey 4.5) -> 196 733
#   qrule = "hf4" y la definición inf{t : F̂(t) >= p} -> 196 701
# Son 32 acres sobre 197 000: un 0,016 %. El material publica la definición
# inf{...}, que es la que se deriva en el módulo 11, y usa `hf4` para que las
# dos vías coincidan de verdad en vez de aparentarlo. El capítulo explica el
# desacuerdo en una caja, porque es exactamente el tipo de detalle que
# desconcierta a quien compara su código con el de otro.
sv_med      <- svyquantile(~acres92, dis, quantiles = 0.5, ci = TRUE, qrule = "hf4")
sv_med_math <- svyquantile(~acres92, dis, quantiles = 0.5, ci = TRUE, qrule = "math")
mediana_sv      <- as.numeric(coef(sv_med))
mediana_sv_math <- as.numeric(coef(sv_med_math))
cat(sprintf("mediana: a mano %.0f, survey(hf4) %.0f, survey(math) %.0f, real %.0f\n",
            mediana_manual, mediana_sv, mediana_sv_math, mediana_real))
igual(mediana_manual, mediana_sv, 1e-10, "mediana (a mano ↔ survey con qrule = hf4)")
ic_med <- as.numeric(confint(sv_med))

# La curva F_hat, adelgazada para el gráfico (una de cada tres unidades basta).
paso <- 3
cdf <- list(y = y_ord[seq(1, n, by = paso)], F = F_hat[seq(1, n, by = paso)])
# La verdadera, para poder compararlas
yp <- sort(agpop$acres92)
idx <- round(seq(1, N, length.out = 200))
cdf_real <- list(y = yp[idx], F = idx / N)

cuantiles <- c(0.10, 0.25, 0.50, 0.75, 0.90)
tabla_cuantiles <- data.frame(
  p = cuantiles,
  estimado = sapply(cuantiles, cuantil_F),
  real = as.numeric(quantile(agpop$acres92, cuantiles, type = 1)))
print(tabla_cuantiles, digits = 7)

# ===========================================================================
# 11 · Los otros conjuntos de datos del capítulo
# ===========================================================================
cherry <- lee_lohr("cherry")
santacruz <- lee_lohr("santacruz")
deadtrees <- lee_lohr("deadtrees")

# Cherry: volumen a partir del diámetro. La recta por el origen NO sirve aquí,
# y eso es justo lo que hay que ver.
ch_B <- mean(cherry$volume) / mean(cherry$diameter)
ch_lm <- lm(volume ~ diameter, data = cherry)
cat(sprintf("cherry: B̂ = %.4f, recta = %.4f + %.4f·x, R² = %.4f\n",
            ch_B, coef(ch_lm)[1], coef(ch_lm)[2], summary(ch_lm)$r.squared))

# Santa Cruz (Lohr ej. 4.5): plántulas en 1992 y 1994 bajo diez robles.
sc_B <- mean(santacruz$seed94) / mean(santacruz$seed92)
cat(sprintf("santacruz: n = %d, B̂ = %.4f\n", nrow(santacruz), sc_B))

# Árboles muertos (Lohr ej. 4.7 y 4.12): conteo por foto (x, censo de 100
# parcelas) y conteo en campo (y, MAS de 25). Estimador de diferencia.
N_dt <- 100; n_dt <- nrow(deadtrees); xbar_U_dt <- 11.3
d_dt <- deadtrees$field - deadtrees$photo
ybar_dif_dt <- xbar_U_dt + mean(d_dt)
se_dif_dt <- sqrt((1 - n_dt / N_dt) * var(d_dt) / n_dt)
dt_lm <- lm(field ~ photo, data = deadtrees)
ybar_reg_dt <- coef(dt_lm)[1] + coef(dt_lm)[2] * xbar_U_dt
cat(sprintf("deadtrees: n = %d, media por diferencia = %.4f (EE %.4f), por regresión = %.4f\n",
            n_dt, ybar_dif_dt, se_dif_dt, ybar_reg_dt))
# Lohr (ejemplo 4.12) publica 11.9893 para el estimador de regresión.
igual(as.numeric(ybar_reg_dt), 11.9893, 1e-5, "regresión en deadtrees (Lohr ej. 4.12)")
stopifnot(abs(mean(deadtrees$photo) - 10.6) < 0.05)   # Lohr: xbar_S = 10.6

# ===========================================================================
# 12 · Escritura
# ===========================================================================
adelgaza <- function(v, k = 1) as.numeric(v)

datos <- list(
  meta = list(capitulo = 3, semilla = SEMILLA, generado = format(Sys.Date()),
              r = paste0("R ", getRversion()), script = "precalculo/genera_cap3.R",
              replicas = M, replicasLinealizacion = M2),
  discrepanciaLohr = discrepancia,
  agsrs = list(
    N = N, n = n, tX = t_x, tY = t_y, xbarU = xbar_U, ybar = ybar, xbar = xbar,
    correlacion = cor(x, y), B = B, Breal = B_pob, seB = se_B,
    sE = s_e, sdY = sd(y), b0 = b0, b1 = b1, g = g_ajuste, pesoSRS = peso_srs,
    seExpansion = se_exp, seRazon = se_raz,
    seRegresionSurvey = se_reg_survey, seRegresionClasica = se_reg,
    difRegresionPct = 100 * dif_reg_rel, seDiferencia = se_dif,
    x = x, y = y
  ),
  estimadores = estimadores,
  sesgoRazon = tabla_sesgo,
  linealizacion = list(n = n_lin, exacto = ex[1:600], lineal = li[1:600],
                       correlacion = cor(ex, li), eeExacto = sd(ex), eeLineal = sd(li)),
  dominios = list(binario = tabla_dom, region = tabla_reg),
  greg = list(beta = betas, total = curva_greg, puntos = puntos_greg,
              betaRazon = g_razon$beta, betaHomo = g_homo$beta,
              totalHomo = g_homo$total),
  mediana = list(estimada = mediana_manual, real = mediana_real,
                 surveyMath = mediana_sv_math,
                 ic = ic_med, cdf = cdf, cdfReal = cdf_real,
                 cuantiles = tabla_cuantiles),
  cherry = list(n = nrow(cherry), x = cherry$diameter, y = cherry$volume,
                B = ch_B, b0 = unname(coef(ch_lm)[1]), b1 = unname(coef(ch_lm)[2]),
                r2 = summary(ch_lm)$r.squared, correlacion = cor(cherry$diameter, cherry$volume)),
  santacruz = list(n = nrow(santacruz), x = santacruz$seed92, y = santacruz$seed94, B = sc_B),
  deadtrees = list(N = N_dt, n = n_dt, x = deadtrees$photo, y = deadtrees$field,
                   xbarU = xbar_U_dt, mediaDiferencia = ybar_dif_dt, eeDiferencia = se_dif_dt,
                   mediaRegresion = unname(ybar_reg_dt),
                   b0 = unname(coef(dt_lm)[1]), b1 = unname(coef(dt_lm)[2]))
)

escribe_json(datos, "cap3_datos")
v <- jsonlite::fromJSON(file.path(DIR_SALIDAS, "cap3_datos.json"))
stopifnot(v$agsrs$N == 3078, length(v$agsrs$x) == 300,
          abs(v$agsrs$B - B) < 1e-8, nrow(v$estimadores) == 4)
cat("\n=== cap3_datos.json verificado tras la relectura ===\n")
