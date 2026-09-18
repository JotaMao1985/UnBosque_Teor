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
#
# HALLAZGO DE LA REVISIÓN DEL CHECKPOINT 1 (2026-07-28). Con M = 5 000 réplicas,
# el "sesgo medido" a partir de n ≈ 100 era PURO RUIDO DE MONTE CARLO: salía con
# signo contrario al teórico (+97 085 frente a -123 438 en n = 100) y era menor
# que su propio error de estimación (ee/sqrt(M) ≈ 181 000). El material lo citaba
# como si fuera una medición del sesgo.
#
# La corrección tiene dos partes:
#   1. M sube a 200 000, que divide el error de Monte Carlo por 6,3 y hace el
#      sesgo medible hasta n = 100.
#   2. El error de Monte Carlo se calcula, se guarda y se publica junto a cada
#      sesgo. Una simulación sin su propia barra de error no es una medición:
#      es una anécdota con muchos decimales.
set.seed(SEMILLA)
M <- 200000
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
  sesgo <- mean(tr) - t_y
  eeMC <- sd(tr) / sqrt(M)          # incertidumbre CON LA QUE se midió el sesgo
  list(n = nn, media = mean(tr), sesgo = sesgo, sesgoTeorico = teorico,
       ee = sd(tr), eeMC = eeMC,
       # ¿el sesgo medido se distingue de cero con estas réplicas?
       medible = abs(sesgo) > 2 * eeMC,
       sesgoRelEE = sesgo / sd(tr))
})
tabla_sesgo <- do.call(rbind, lapply(sim, as.data.frame))
print(tabla_sesgo, digits = 5)
cat(sprintf("  el sesgo es medible (|sesgo| > 2 EE_MC) hasta n = %d\n",
            max(tabla_sesgo$n[tabla_sesgo$medible])))

# El sesgo simulado y el teórico tienen que ir de la mano DONDE el sesgo es
# medible; más allá, lo que se compara es ruido contra señal.
medibles <- tabla_sesgo$medible
cor_sesgo <- cor(tabla_sesgo$sesgo[medibles], tabla_sesgo$sesgoTeorico[medibles])
cat(sprintf("correlación sesgo simulado ↔ teórico (donde es medible): %.4f\n", cor_sesgo))
stopifnot(cor_sesgo > 0.95)
# Y en la zona medible, simulado y teórico deben coincidir en SIGNO. Que no lo
# hicieran era justo el síntoma que delató el problema.
stopifnot(all(sign(tabla_sesgo$sesgo[medibles]) == sign(tabla_sesgo$sesgoTeorico[medibles])))

# ---------------------------------------------------------------------------
# 6b · UN CRITERIO QUE SE PUEDE EVALUAR CON UNA SOLA MUESTRA
# ---------------------------------------------------------------------------
# La simulación de arriba es imposible en una encuesta de verdad: allí hay UNA
# muestra, no 200 000. Pero el sesgo relativo del estimador de razón tiene una
# cota que sí se calcula con lo que da esa única muestra (Portela y Villeta,
# secc. 7.1.2, p. 212; la regla práctica es de Kish, 1965):
#
#   |Sesgo(B_hat)| / sd(B_hat)  <=  CV(xbar_hat) = CV(x) * sqrt((1 - f) / n)
#
# Sale de |cov(B_hat, xbar_hat)| <= sd(B_hat) sd(xbar_hat), o sea de |rho| <= 1,
# así que es CONSERVADORA. Y es invariante de escala: vale igual para B_hat,
# para la media de razón y para el total, porque los tres se diferencian en una
# constante que se cancela entre numerador y denominador.
CVx_pob <- sd(agpop$acres87) / xbar_U
tabla_sesgo$cotaKish <- CVx_pob * sqrt((1 - tabla_sesgo$n / N) / tabla_sesgo$n)
# La cota tiene que cumplirse en TODOS los tamaños simulados. Si fallara, o está
# mal escrita o la simulación está mal hecha: es una tercera vía de control.
stopifnot(all(abs(tabla_sesgo$sesgoRelEE) <= tabla_sesgo$cotaKish))

# El n a partir del cual la regla del 0,2 declara el sesgo despreciable en esta
# población, despejando n de CV(x) * sqrt((1 - n/N) / n) = 0,2.
n_kish <- ceiling(1 / (0.04 / CVx_pob^2 + 1 / N))
CVx_muestra <- sd(agsrs$acres87) / xbar        # lo ÚNICO que se tendría en campo
kish <- list(
  CVxPob      = CVx_pob,
  cotaPob     = CVx_pob     * sqrt((1 - n / N) / n),
  cotaMuestra = CVx_muestra * sqrt((1 - n / N) / n),
  relEE       = abs(tabla_sesgo$sesgoRelEE[tabla_sesgo$n == n]),
  nMinimo     = n_kish)
cat(sprintf("Kish: cota poblacional %.4f, estimada con agsrs %.4f, |sesgo|/ee real %.4f; n minimo %d\n",
            kish$cotaPob, kish$cotaMuestra, kish$relEE, n_kish))
stopifnot(n_kish > 30, n_kish < 100)

# ---------------------------------------------------------------------------
# 6c · EL ORDEN DE LAS VARIANZAS, QUE ES UN TEOREMA
# ---------------------------------------------------------------------------
# Los cuatro estimadores del capítulo son EL MISMO con cuatro valores de b:
#   t(b) = N [ ybar + b (xbar_U - xbar) ]
#   b = 0  -> expansión            b = B  -> razón (a primer orden)
#   b = 1  -> diferencia           b = b1 -> regresión
# Su varianza aproximada es  V(b) = (1-f)/n (S_y^2 + b^2 S_x^2 - 2 b S_xy), y al
# restarle la del b óptimo b1 = S_xy/S_x^2 queda un CUADRADO PERFECTO:
#   V(b) - V(b1) = (1-f)/n (b S_x - rho S_y)^2  >= 0
# Es decir: la regresión no puede perder, y empata SOLO cuando b = b1. Para la
# razón eso es B = b1, que equivale a que la recta de regresión pase por el
# origen — el contraste del módulo 6.
#
# Se calcula sobre agpop, que es censo: son las varianzas VERDADERAS, no las
# estimaciones con agsrs que publica la tabla del módulo 7.
Sy_p  <- sd(agpop$acres92);  Sx_p <- sd(agpop$acres87)
Sxy_p <- cov(agpop$acres87, agpop$acres92)
rho_p <- cor(agpop$acres87, agpop$acres92)
b1_pob <- Sxy_p / Sx_p^2
k_var  <- (1 - n / N) / n
V_de_b <- function(b) k_var * (Sy_p^2 + b^2 * Sx_p^2 - 2 * b * Sxy_p)
V_opt  <- k_var * Sy_p^2 * (1 - rho_p^2)
bs <- c(expansion = 0, razon = B_pob, diferencia = 1, regresion = b1_pob)
orden <- data.frame(clave = names(bs), b = unname(bs),
                    ee = N * sqrt(sapply(bs, V_de_b)),
                    row.names = NULL, stringsAsFactors = FALSE)
orden$huecoPct <- 100 * (orden$ee / (N * sqrt(V_opt)) - 1)
print(orden, digits = 7)

# El cuadrado perfecto, comprobado en relativo (las varianzas son de orden 1e8).
resto <- max(abs(sapply(bs, V_de_b) - V_opt - k_var * (bs * Sx_p - rho_p * Sy_p)^2))
igual(resto / V_opt, 0, 1e-9, "cuadrado perfecto del orden de varianzas")
stopifnot(which.min(orden$ee) == which(orden$clave == "regresion"))

# Y la varianza APROXIMADA de la razón tiene que parecerse a la que midieron las
# 200 000 réplicas: es la aproximación del módulo 2 puesta a prueba contra una
# medición independiente.
ee_sim <- tabla_sesgo$ee[tabla_sesgo$n == n]
dif_aprox <- abs(orden$ee[orden$clave == "razon"] - ee_sim) / ee_sim
cat(sprintf("orden (ee del total en millones): %s\n",
            paste(sprintf("%s %.4f", orden$clave, orden$ee / 1e6), collapse = " · ")))
cat(sprintf("  razon aproximada %.0f frente a la simulada %.0f: %.2f %%\n",
            orden$ee[orden$clave == "razon"], ee_sim, 100 * dif_aprox))
stopifnot(dif_aprox < 0.01)
ordenVarianzas <- list(tabla = orden, B = B_pob, b1 = b1_pob, rho = rho_p,
                       eeOptimo = N * sqrt(V_opt), eeSimulado = ee_sim,
                       difAproxPct = 100 * dif_aprox)

# ---------------------------------------------------------------------------
# 6e · QUÉ DECIDE DE VERDAD ENTRE LA RAZÓN Y LA DIFERENCIA
# ---------------------------------------------------------------------------
# El capítulo dice que la diferencia conviene «cuando x e y son la misma
# variable medida dos veces». Esa condición NO discrimina: las cuatro parejas
# de agpop la cumplen al pie de la letra y el desenlace va de la diferencia
# perdiendo un 20 % a ganando un 16 %. Lo que decide sale del cuadrado perfecto
# de 6c: gana el b cuyo (b S_x - rho S_y)^2 sea menor, o sea aquel de los dos
# -B o 1- que se parezca más a b1. Se comprueba en las cuatro.
compara_par <- function(xn, yn) {
  xx <- agpop[[xn]]; yy <- agpop[[yn]]
  Sx <- sd(xx); Sy <- sd(yy); Sxy <- cov(xx, yy); rho <- cor(xx, yy)
  Bp <- sum(yy) / sum(xx); b1 <- Sxy / Sx^2
  Vb <- function(b) ((1 - n / N) / n) * (Sy^2 + b^2 * Sx^2 - 2 * b * Sxy)
  data.frame(par = paste0(yn, " ~ ", xn), B = Bp, b1 = b1,
             distB = abs(b1 - Bp), dist1 = abs(b1 - 1),
             predice = ifelse(abs(b1 - Bp) < abs(b1 - 1), "razon", "diferencia"),
             gana    = ifelse(Vb(Bp) < Vb(1), "razon", "diferencia"),
             ventajaPct = 100 * (max(sqrt(Vb(Bp)), sqrt(Vb(1))) /
                                 min(sqrt(Vb(Bp)), sqrt(Vb(1))) - 1),
             stringsAsFactors = FALSE)
}
regla <- do.call(rbind, lapply(
  list(c("acres87", "acres92"), c("farms87", "farms92"),
       c("largef87", "largef92"), c("smallf87", "smallf92")),
  function(p) compara_par(p[1], p[2])))
print(regla, digits = 5, row.names = FALSE)
# La regla de la pendiente tiene que acertar en TODAS. Si fallara en alguna, la
# regla que el capítulo va a enseñar no sirve y hay que volver a pensarla.
stopifnot(all(regla$predice == regla$gana))
# Y las cuatro tienen que cumplir «la misma variable medida dos veces», que es
# justo lo que hace que la condición vieja no discrimine.
stopifnot(nrow(regla) == 4, any(regla$gana == "razon"), any(regla$gana == "diferencia"))

# ---------------------------------------------------------------------------
# 6f · UNA AUXILIAR QUE NO PAGA LO QUE CUESTA
# ---------------------------------------------------------------------------
# El módulo 3 asegura que por debajo del umbral la auxiliar no compensa, y no
# lo enseña nunca. farms92 con acres87 lo enseña: misma variable de interés que
# el ejercicio 1 del módulo 12, dos auxiliares distintas, desenlaces opuestos.
xa <- agpop$acres87; yf <- agpop$farms92
Sxa <- sd(xa); Syf <- sd(yf); Sxya <- cov(xa, yf)
rho_mala <- cor(xa, yf)
umbral_mala <- 0.5 * (Sxa / mean(xa)) / (Syf / mean(yf))
Vm <- function(b) ((1 - n / N) / n) * (Syf^2 + b^2 * Sxa^2 - 2 * b * Sxya)
B_mala <- sum(yf) / sum(xa)
xb <- agpop$farms87; B_buena <- sum(yf) / sum(xb)
Vb2 <- function(b) ((1 - n / N) / n) *
  (Syf^2 + b^2 * sd(xb)^2 - 2 * b * cov(xb, yf))
noPaga <- list(
  rho = rho_mala, umbral = umbral_mala,
  eeExpansion = N * sqrt(Vm(0)),
  eeRazonMala = N * sqrt(Vm(B_mala)),
  peorPct     = 100 * (sqrt(Vm(B_mala)) / sqrt(Vm(0)) - 1),
  rhoBuena    = cor(xb, yf),
  eeRazonBuena = N * sqrt(Vb2(B_buena)),
  vecesMejor  = sqrt(Vm(0)) / sqrt(Vb2(B_buena)))
cat(sprintf("auxiliar que no paga: rho %.4f < umbral %.4f; razon %.0f contra expansion %.0f (%.1f %% peor)\n",
            noPaga$rho, noPaga$umbral, noPaga$eeRazonMala, noPaga$eeExpansion, noPaga$peorPct))
cat(sprintf("  la misma y con SU auxiliar (farms87, rho %.4f): %.0f, %.1f veces mejor que la expansion\n",
            noPaga$rhoBuena, noPaga$eeRazonBuena, noPaga$vecesMejor))
# La regla del umbral tiene que acertar el signo en los dos casos.
stopifnot(noPaga$rho < noPaga$umbral, noPaga$peorPct > 0)
stopifnot(noPaga$rhoBuena > 0.5 * (sd(xb) / mean(xb)) / (Syf / mean(yf)),
          noPaga$eeRazonBuena < noPaga$eeExpansion)

# ---------------------------------------------------------------------------
# 6d · LA RAZÓN DE MEDIAS NO ES LA MEDIA DE COCIENTES
# ---------------------------------------------------------------------------
# No son dos estimadores del mismo parámetro: son DOS PARÁMETROS distintos.
#   B       = sum(y) / sum(x)        pondera cada unidad por su x
#   Bmedia  = (1/N) sum(y_k / x_k)   da a todas el mismo peso
# Promediar cocientes no estima mal B: estima bien OTRA COSA, así que la
# discrepancia no se reduce al crecer n. Y la media de cocientes ni siquiera
# está definida donde x_k = 0 o falta, mientras que B no necesita esa cirugía.
val_pob <- agpop$acres87 > 0                   # 2 ceros y 23 con -99
B_media_pob <- mean(agpop$acres92[val_pob] / agpop$acres87[val_pob])
val_mue <- agsrs$acres87 > 0
B_media_mue <- mean(agsrs$acres92[val_mue] / agsrs$acres87[val_mue])
cocientes <- list(
  B            = B_pob,
  Bmedia       = B_media_pob,
  brechaPct    = 100 * (B_media_pob - B_pob) / B_pob,
  nValidosPob  = sum(val_pob),
  nExcluidosPob = sum(!val_pob),
  ceros        = sum(agpop$acres87 == 0),
  faltantes    = sum(agpop$acres87 == -99),
  Bhat         = B,
  BmediaMuestra = B_media_mue,
  nValidosMue  = sum(val_mue))
cat(sprintf("cocientes: B = %.7f, media de cocientes = %.7f (brecha %.2f %%; %d de %d condados)\n",
            cocientes$B, cocientes$Bmedia, cocientes$brechaPct,
            cocientes$nValidosPob, N))
cat(sprintf("           en la muestra: B_hat = %.7f, media de cocientes = %.7f\n",
            cocientes$Bhat, cocientes$BmediaMuestra))

# Y no solo es OTRO parámetro: es uno MUCHO más difícil de estimar, porque
# z_k = y_k/x_k tiene la cola pesada (un condado con poca superficie en 1987 y
# mucha en 1992 da un z enorme). Se comparan los dos errores estándar
# VERDADEROS con la misma muestra de 300, cada uno respecto de SU parámetro.
z_pob <- agpop$acres92[val_pob] / agpop$acres87[val_pob]
N_val <- sum(val_pob)
ee_B_true <- sqrt(V_de_b(B_pob)) / xbar_U              # de 6c: V(ybar_r)/xbar_U^2
ee_Z_true <- sqrt(1 - n / N_val) * sd(z_pob) / sqrt(n)
cocientes$sdZ       <- sd(z_pob)
cocientes$maxZ      <- max(z_pob)
cocientes$eeRelB    <- 100 * ee_B_true / B_pob
cocientes$eeRelMedia <- 100 * ee_Z_true / B_media_pob
cocientes$veces     <- cocientes$eeRelMedia / cocientes$eeRelB
cat(sprintf("           precision: ee relativo de B_hat %.3f %% frente a %.3f %% de la media de cocientes (%.2f veces)\n",
            cocientes$eeRelB, cocientes$eeRelMedia, cocientes$veces))

# Lo que SÍ se puede afirmar. (a) Los dos parámetros se separan de verdad.
stopifnot(abs(cocientes$brechaPct) > 2)
# (b) B_hat está más cerca de B que de la media de cocientes.
stopifnot(abs(cocientes$Bhat - cocientes$B) < abs(cocientes$Bhat - cocientes$Bmedia))
# (c) Estimar la media de cocientes es menos preciso.
stopifnot(cocientes$veces > 1.5)
# Lo que NO se puede afirmar, y conviene dejar escrito: la simétrica de (b) es
# FALSA en esta muestra —la media de cocientes muestral, 0,9677, cae más cerca
# de B que de su propio parámetro—. No es una casualidad incómoda: es (c) en
# acción. Con la cola de z, 300 condados estiman su media con un ee verdadero
# que deja los dos parámetros dentro del margen. Por eso el capítulo argumenta
# con los parámetros poblacionales y no con esta muestra.

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
# inf{...}, que es la que se deriva en el módulo 12, y usa `hf4` para que las
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

# La curva F_hat, entera. Antes iba adelgazada una de cada tres unidades para
# el gráfico; 300 pares de números no le pesan a Chart.js, y el adelgazamiento
# costaba caro: el simulador leía los cuantiles de esta misma curva y en
# p = 0,5 se saltaba la unidad 150 (ver el hallazgo de abajo).
cdf <- list(y = y_ord, F = F_hat)
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

# HALLAZGO DE LA REVISIÓN (2026-09-18). El deslizador del simulador recorre
# p = 0,05 … 0,95 de cinco en cinco, y calculaba cada cuantil recorriendo la
# curva ADELGAZADA de arriba. Al quitar dos de cada tres unidades, p = 0,5 se
# salta la unidad 150 y devuelve la 151: 196 733, que es exactamente el
# convenio `math` que el módulo 12 declara que este material NO usa —y lo
# imprimía dos renglones encima de «mediana estimada: 196 701»—. Los nueve
# cuantiles del deslizador salen ahora de la curva COMPLETA, tabulados aquí
# con la misma definición inf{...} que el resto del módulo. La curva sigue
# adelgazada, pero solo para dibujarla.
p_slider <- seq(0.05, 0.95, by = 0.05)
cuantiles_slider <- data.frame(
  p = p_slider,
  estimado = sapply(p_slider, cuantil_F),
  real = as.numeric(quantile(agpop$acres92, p_slider, type = 1)))
# `match()` compara por igualdad exacta y seq() no da 0,10 exacto: hay que
# emparejar por proximidad o la comprobación falla sin que nada esté mal.
idx_slider <- sapply(cuantiles, function(p) which.min(abs(p_slider - p)))
stopifnot(all(abs(p_slider[idx_slider] - cuantiles) < 1e-9),
          cuantiles_slider$estimado[which.min(abs(p_slider - 0.5))] == mediana_manual,
          all(cuantiles_slider$estimado[idx_slider] == tabla_cuantiles$estimado),
          all(cuantiles_slider$real[idx_slider] == tabla_cuantiles$real))
cat(sprintf("cuantiles del deslizador: 19 valores, p = 0,05 a 0,95; máximo estimado %.0f\n",
            max(cuantiles_slider$estimado)))

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
  kish = kish,
  ordenVarianzas = ordenVarianzas,
  reglaPendiente = regla,
  auxiliarQueNoPaga = noPaga,
  cocientes = cocientes,
  linealizacion = list(n = n_lin, exacto = ex[1:600], lineal = li[1:600],
                       correlacion = cor(ex, li), eeExacto = sd(ex), eeLineal = sd(li)),
  dominios = list(binario = tabla_dom, region = tabla_reg),
  greg = list(beta = betas, total = curva_greg, puntos = puntos_greg,
              betaRazon = g_razon$beta, betaHomo = g_homo$beta,
              totalHomo = g_homo$total),
  mediana = list(estimada = mediana_manual, real = mediana_real,
                 surveyMath = mediana_sv_math,
                 ic = ic_med, cdf = cdf, cdfReal = cdf_real,
                 cuantiles = tabla_cuantiles, cuantilesSlider = cuantiles_slider),
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
