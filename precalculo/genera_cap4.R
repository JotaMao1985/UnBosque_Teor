# genera_cap4.R — datos precalculados del Capítulo 4 (muestreo estratificado)
#
# Ejecutar SIEMPRE con el R del framework 4.4, desde la raíz del repositorio:
#   /Library/Frameworks/R.framework/Versions/4.4-arm64/Resources/bin/Rscript precalculo/genera_cap4.R
#
# Produce  precalculo/salidas/cap4_datos.json  (lo que se incrusta en el capítulo)
# y deja por pantalla las cifras que se citan en el texto. Ninguna cifra del
# capítulo se escribe a mano: o sale de aquí, o sale de un bloque de código
# ejecutado por verifica_bloques.py.
#
# Decisión del proyecto (2026-07-27, no reabrir): el marco es el COMPLETO de
# Lohr, N = 3 078, con los 19 códigos -99 de acres92 incluidos. La muestra
# agstrat no contiene ninguno.

source("precalculo/_comun.R")
suppressPackageStartupMessages({
  library(survey)
  library(TeachingSampling)
})

set.seed(SEMILLA)
cifras <- list()

comprueba <- function(etiqueta, a, b, tol = 1e-9) {
  dif <- abs(a - b) / max(abs(a), abs(b), 1)
  cat(sprintf("  [doble vía] %-52s dif. relativa = %.2e %s\n", etiqueta, dif,
              if (dif < tol) "OK" else "*** FALLA ***"))
  if (dif >= tol) stop("Doble vía rota en: ", etiqueta)
  invisible(dif)
}

# =============================================================================
# 1. La población por estratos: agpop con el marco completo, región como estrato
# =============================================================================
cat("== 1. Población agpop por región ==\n")
agpop <- lee_lohr("agpop")
N <- nrow(agpop)
regiones <- c("NC", "NE", "S", "W")
NOMBRES_REGION <- c(NC = "Norte-Centro", NE = "Nordeste", S = "Sur", W = "Oeste")

pob_h <- do.call(rbind, lapply(regiones, function(r) {
  y <- agpop$acres92[agpop$region == r]
  data.frame(region = r, Nh = length(y), media = mean(y), S2 = var(y),
             S = sd(y), total = sum(y))
}))
S2_U   <- var(agpop$acres92)
media_U <- mean(agpop$acres92)
t_U    <- sum(agpop$acres92)
Wh     <- pob_h$Nh / N

cifras$poblacion <- list(N = N, media = media_U, S2 = S2_U, total = t_U,
                         Nh = pob_h$Nh, negativos92 = sum(agpop$acres92 == -99))
cat(sprintf("  N = %d, media = %.4f, t = %.0f, S2 = %.4f\n", N, media_U, t_U, S2_U))
print(pob_h, row.names = FALSE)

# Cuánto de la varianza vive ENTRE regiones y cuánto DENTRO (ANOVA poblacional)
SST <- sum((agpop$acres92 - media_U)^2)
SSB <- sum(pob_h$Nh * (pob_h$media - media_U)^2)
SSW <- SST - SSB
comprueba("ANOVA: SST = SSB + SSW", SST, SSB + sum((pob_h$Nh - 1) * pob_h$S2))
R2_region <- SSB / SST

# =============================================================================
# 2. La muestra agstrat: estimación por dos vías (fórmula a mano <-> survey)
# =============================================================================
cat("== 2. Estimación con agstrat ==\n")
agstrat <- lee_lohr("agstrat")
mue_h <- do.call(rbind, lapply(regiones, function(r) {
  y <- agstrat$acres92[agstrat$region == r]
  Nh <- pob_h$Nh[pob_h$region == r]
  data.frame(region = r, nh = length(y), Nh = Nh, wh = Nh / length(y),
             ybar = mean(y), s2 = var(y), s = sd(y))
}))
n_str <- sum(mue_h$nh)

# Vía 1: la fórmula clásica del estimador estratificado
ybar_str <- sum(Wh * mue_h$ybar)
V_ybar   <- sum(Wh^2 * (1 - mue_h$nh / mue_h$Nh) * mue_h$s2 / mue_h$nh)
se_ybar  <- sqrt(V_ybar)
t_str    <- sum(mue_h$Nh * mue_h$ybar)
se_t     <- sqrt(sum(mue_h$Nh^2 * (1 - mue_h$nh / mue_h$Nh) * mue_h$s2 / mue_h$nh))
comprueba("t_str = N * ybar_str", t_str, N * ybar_str)
comprueba("se(t) = N * se(ybar)", se_t, N * se_ybar)

# Vía 2: survey
dis_str <- svydesign(id = ~1, strata = ~region, weights = ~strwt,
                     fpc = ~Nh, data = transform(agstrat,
                       Nh = pob_h$Nh[match(region, pob_h$region)]))
sv_media <- svymean(~acres92, dis_str)
sv_total <- svytotal(~acres92, dis_str)
comprueba("media: fórmula <-> survey",   ybar_str, coef(sv_media)[1])
comprueba("SE media: fórmula <-> survey", se_ybar, SE(sv_media)[1])
comprueba("total: fórmula <-> survey",   t_str, coef(sv_total)[1])
comprueba("SE total: fórmula <-> survey", se_t, SE(sv_total)[1])

# El MAS de referencia con el mismo n (agsrs, capítulo 2): para el texto
agsrs <- lee_lohr("agsrs")
ybar_srs <- mean(agsrs$acres92)
se_srs   <- sqrt((1 - 300 / N) * var(agsrs$acres92) / 300)

z <- qnorm(0.975)
cifras$agstrat <- list(
  n = n_str, ybar = ybar_str, se = se_ybar, total = t_str, seTotal = se_t,
  ic = c(ybar_str - z * se_ybar, ybar_str + z * se_ybar),
  icTotal = c(t_str - z * se_t, t_str + z * se_t),
  ybarSrs = ybar_srs, seSrs = se_srs
)
cat(sprintf("  ybar_str = %.4f (SE %.4f) | t = %.0f (SE %.0f)\n",
            ybar_str, se_ybar, t_str, se_t))
cat(sprintf("  agsrs de referencia: ybar = %.4f (SE %.4f)\n", ybar_srs, se_srs))

# =============================================================================
# 3. El ejemplo pequeño exacto: 2 estratos, espacio de muestras completo
# =============================================================================
# Los mismos 5 condados del capítulo 2. Estratos: {1,2,3} con n_A = 2 y
# {4,5} con n_B = 1. Seis muestras posibles: la varianza del estimador se
# obtiene por enumeración exacta y tiene que coincidir con la fórmula clásica.
cat("== 3. Espacio de muestras estratificado (N=5) ==\n")
peq_y <- c(14, 18, 27, 33, 58)
estrA <- 1:3; estrB <- 4:5
combA <- t(combn(estrA, 2)); combB <- t(combn(estrB, 1))
muestras_peq <- list(); t_est <- c()
for (i in seq_len(nrow(combA))) for (j in seq_len(nrow(combB))) {
  s <- c(combA[i, ], combB[j, ])
  # pesos: N_A/n_A = 3/2 en A, N_B/n_B = 2/1 en B
  t_hat <- sum(peq_y[combA[i, ]]) * 3 / 2 + sum(peq_y[combB[j, ]]) * 2 / 1
  muestras_peq[[length(muestras_peq) + 1]] <- list(s = s, t = t_hat)
  t_est <- c(t_est, t_hat)
}
V_enum <- mean((t_est - sum(peq_y))^2)          # p(s) uniforme: 1/6 cada una
comprueba("E(t_str) insesgado (ejemplo pequeño)", mean(t_est), sum(peq_y))
V_form <- 3^2 * (1 - 2/3) * var(peq_y[estrA]) / 2 + 2^2 * (1 - 1/2) * var(peq_y[estrB]) / 1
comprueba("V exacta: enumeración <-> fórmula", V_enum, V_form)
cifras$peq <- list(y = peq_y, t = sum(peq_y),
                   muestras = lapply(muestras_peq, function(m) list(s = m$s, t = m$t)),
                   V = V_enum)

# =============================================================================
# 4. Asignación de observaciones: proporcional, igual, Neyman (n = 300)
# =============================================================================
cat("== 4. Asignaciones ==\n")
n_total <- 300

# Redondeo por restos mayores, para que las asignaciones sumen n exacto
reparte <- function(objetivo) {
  base <- floor(objetivo)
  resto <- n_total - sum(base)
  orden <- order(objetivo - base, decreasing = TRUE)
  base[orden[seq_len(resto)]] <- base[orden[seq_len(resto)]] + 1
  base
}

V_asignacion <- function(nh) {
  sum(Wh^2 * (1 - nh / pob_h$Nh) * pob_h$S2 / nh)
}

n_prop   <- reparte(n_total * pob_h$Nh / N)
n_igual  <- rep(n_total / length(regiones), length(regiones))
n_neyman <- reparte(n_total * (pob_h$Nh * pob_h$S) / sum(pob_h$Nh * pob_h$S))

V_mas    <- (1 - n_total / N) * S2_U / n_total
V_prop   <- V_asignacion(n_prop)
V_igual  <- V_asignacion(n_igual)
V_neyman <- V_asignacion(n_neyman)

asignaciones <- data.frame(
  metodo = c("MAS (sin estratos)", "Proporcional", "Igual", "Neyman"),
  V = c(V_mas, V_prop, V_igual, V_neyman)
)
asignaciones$deff <- asignaciones$V / V_mas
asignaciones$se <- sqrt(asignaciones$V)
print(asignaciones, row.names = FALSE)
cat(sprintf("  n_prop = %s | n_neyman = %s\n",
            paste(n_prop, collapse = "/"), paste(n_neyman, collapse = "/")))

# La asignación proporcional redondeada coincide con la de agstrat (Lohr)
stopifnot(all(as.integer(n_prop) == mue_h$nh))

cifras$asignaciones <- list(
  n = n_total, regiones = regiones, nombres = unname(NOMBRES_REGION[regiones]),
  Nh = pob_h$Nh, Sh = pob_h$S, mediaH = pob_h$media, Wh = Wh,
  prop = n_prop, igual = n_igual, neyman = n_neyman,
  V = list(mas = V_mas, prop = V_prop, igual = V_igual, neyman = V_neyman),
  deff = list(prop = V_prop / V_mas, igual = V_igual / V_mas, neyman = V_neyman / V_mas)
)

# =============================================================================
# 5. Asignación óptima con costos desiguales
# =============================================================================
# Escenario: encuestar en el Oeste cuesta más (condados enormes y dispersos) y
# en el Nordeste menos. Costo c_h por entrevista; presupuesto C sin costo fijo.
#   n_h  proporcional a  N_h S_h / sqrt(c_h),  escalado a  sum(c_h n_h) = C.
cat("== 5. Costos ==\n")
c_h  <- c(NC = 10, NE = 6, S = 8, W = 18)
C_pres <- 3000

asigna_costos <- function(C, costos) {
  crudo <- pob_h$Nh * pob_h$S / sqrt(costos)
  esc <- C / sum(costos * crudo)
  nh <- crudo * esc                  # continuo; el material lo redondea aparte
  list(nh = nh, V = V_asignacion(nh), costo = sum(costos * nh))
}

opt <- asigna_costos(C_pres, c_h)
comprueba("el óptimo agota el presupuesto", opt$costo, C_pres)

# Comprobación de optimalidad: perturbar la asignación manteniendo el costo
# no puede bajar la varianza (multiplicadores de Lagrange en acción).
perturba <- opt$nh + c(+1, 0, 0, -c_h[["NC"]] / c_h[["W"]])
stopifnot(abs(sum(c_h * perturba) - C_pres) < 1e-9, opt$V <= V_asignacion(perturba))
cat(sprintf("  óptimo con C=%d: nh = %s, V = %.2f (perturbado: %.2f)\n",
            C_pres, paste(round(opt$nh, 1), collapse = "/"), opt$V, V_asignacion(perturba)))

# Con el mismo presupuesto, ¿qué haría la proporcional? (para el comparador)
n_eq_prop <- C_pres / sum(c_h * pob_h$Nh / N) * pob_h$Nh / N
cifras$costos <- list(
  ch = as.list(c_h), C = C_pres,
  optimo = list(nh = opt$nh, V = opt$V, n = sum(opt$nh)),
  propMismoCosto = list(nh = n_eq_prop, V = V_asignacion(n_eq_prop), n = sum(n_eq_prop))
)

# =============================================================================
# 6. Definición de estratos: el constructor
# =============================================================================
# ¿Cuánto baja la varianza según la variable por la que se estratifique?
# Asignación proporcional con n = 300 en todos los casos, para comparar solo
# el efecto de la variable. Estratos por cuantiles de la auxiliar.
cat("== 6. Constructor de estratos ==\n")
estratifica <- function(factor_h, etiqueta) {
  niveles <- split(agpop$acres92, factor_h)
  Nh <- sapply(niveles, length)
  S2h <- sapply(niveles, var)
  mediah <- sapply(niveles, mean)
  nh <- n_total * Nh / N               # proporcional continua: solo comparamos V
  V <- sum((Nh / N)^2 * (1 - nh / Nh) * S2h / nh)
  list(etiqueta = etiqueta, H = length(niveles), Nh = unname(Nh),
       mediaH = unname(mediah), V = V, deff = V / V_mas)
}

corta_cuantiles <- function(x, H) {
  q <- unique(quantile(x, probs = seq(0, 1, length.out = H + 1), type = 1))
  cut(x, breaks = q, include.lowest = TRUE, labels = FALSE)
}

set.seed(SEMILLA)  # el grupo aleatorio debe ser reproducible
opciones <- list(
  estratifica(agpop$region, "Región (la de Lohr)"),
  estratifica(corta_cuantiles(agpop$acres87, 4), "Cuartiles de acres87"),
  estratifica(corta_cuantiles(agpop$farms92, 4), "Cuartiles de farms92"),
  estratifica(corta_cuantiles(agpop$largef92, 4), "Cuartiles de largef92"),
  estratifica(sample(rep(1:4, length.out = N)), "4 grupos al azar")
)
for (o in opciones) cat(sprintf("  %-22s H=%d  V=%.1f  deff=%.4f\n",
                                o$etiqueta, o$H, o$V, o$deff))

# Barrido: cuántos estratos por cuantiles de acres87 (rendimientos decrecientes)
barrido_H <- lapply(2:10, function(H) {
  o <- estratifica(corta_cuantiles(agpop$acres87, H), sprintf("H=%d", H))
  list(H = o$H, V = o$V, deff = o$deff)
})

cifras$constructor <- list(opciones = opciones, barridoH = barrido_H,
                           R2region = R2_region, SSB = SSB, SST = SST)

# =============================================================================
# 7. Distribución de muestreo: MAS frente a estratificado proporcional
# =============================================================================
cat("== 7. Distribución de muestreo (10 000 réplicas) ==\n")
R <- 10000
set.seed(SEMILLA)
idx_h <- split(seq_len(N), agpop$region)   # índices por estrato, orden NC/NE/S/W
stopifnot(identical(names(idx_h), regiones))

rep_mas <- numeric(R); rep_str <- numeric(R)
cub_mas <- logical(R); cub_str <- logical(R)
for (r in seq_len(R)) {
  s <- sample.int(N, n_total)
  y <- agpop$acres92[s]
  rep_mas[r] <- mean(y)
  se <- sqrt((1 - n_total / N) * var(y) / n_total)
  cub_mas[r] <- abs(mean(y) - media_U) <= z * se

  ybh <- numeric(4); vh <- numeric(4)
  for (h in 1:4) {
    sh <- sample(idx_h[[h]], n_prop[h])
    yh <- agpop$acres92[sh]
    ybh[h] <- mean(yh)
    vh[h] <- (1 - n_prop[h] / pob_h$Nh[h]) * var(yh) / n_prop[h]
  }
  rep_str[r] <- sum(Wh * ybh)
  se_s <- sqrt(sum(Wh^2 * vh))
  cub_str[r] <- abs(rep_str[r] - media_U) <= z * se_s
}

comprueba("V simulada MAS <-> teórica", var(rep_mas), V_mas, 0.05)
comprueba("V simulada estratificada <-> teórica", var(rep_str), V_prop, 0.05)
cat(sprintf("  cobertura IC 95%%: MAS %.3f | estratificado %.3f\n",
            mean(cub_mas), mean(cub_str)))

breaks <- seq(min(rep_mas, rep_str), max(rep_mas, rep_str), length.out = 41)
hace_hist <- function(x) {
  h <- hist(x, breaks = breaks, plot = FALSE)
  list(centros = h$mids, conteo = h$counts, ancho = diff(breaks)[1])
}
cifras$distribucion <- list(
  replicas = R,
  mas = hace_hist(rep_mas), estratificado = hace_hist(rep_str),
  varMas = var(rep_mas), varStr = var(rep_str),
  coberturaMas = mean(cub_mas), coberturaStr = mean(cub_str),
  media = media_U
)

# =============================================================================
# 8. Estratificado con probabilidades proporcionales (Gutiérrez 5.3, BigLucy)
# =============================================================================
cat("== 8. Estratificado PPT en BigLucy ==\n")
data(BigLucy)
mh <- c(Big = 60, Medium = 120, Small = 200)
niveles_lucy <- levels(BigLucy$Level)          # Big, Medium, Small
stopifnot(identical(niveles_lucy, names(mh)))

lucy_h <- do.call(rbind, lapply(niveles_lucy, function(l) {
  b <- BigLucy[BigLucy$Level == l, ]
  data.frame(nivel = l, Nh = nrow(b), totalIncome = sum(b$Income),
             totalEmployees = sum(b$Employees), mediaIncome = mean(b$Income))
}))
print(lucy_h, row.names = FALSE)

set.seed(SEMILLA)
sel <- S.STPPS(BigLucy$Level, BigLucy$Employees, mh)
sam <- sel[, 1]; psi <- sel[, 2]
est <- E.STPPS(data.frame(Income = BigLucy$Income[sam]), psi, mh, BigLucy$Level[sam])

# Doble vía: Hansen-Hurwitz a mano, estrato a estrato
niv_sam <- as.character(BigLucy$Level[sam])
t_hh_h <- sapply(niveles_lucy, function(l) {
  k <- niv_sam == l
  mean(BigLucy$Income[sam][k] / psi[k])
})
v_hh_h <- sapply(niveles_lucy, function(l) {
  k <- niv_sam == l
  d <- BigLucy$Income[sam][k] / psi[k]
  var(d) / length(d)
})
t_hh <- sum(t_hh_h)
comprueba("HH a mano <-> E.STPPS (total Income)", t_hh, est["Estimation", "Population", "Income"])
comprueba("SE HH a mano <-> E.STPPS", sqrt(sum(v_hh_h)), est["Standard Error", "Population", "Income"])
cat(sprintf("  t_HH(Income) = %.0f | real = %d | error rel = %.4f%%\n",
            t_hh, sum(BigLucy$Income), 100 * (t_hh - sum(BigLucy$Income)) / sum(BigLucy$Income)))

# El comparador: mismo n con MAS dentro de cada estrato (STSI, fórmula exacta)
V_stsi <- sum(sapply(seq_along(niveles_lucy), function(i) {
  b <- BigLucy$Income[BigLucy$Level == niveles_lucy[i]]
  length(b)^2 * (1 - mh[i] / length(b)) * var(b) / mh[i]
}))

# Distribución de las psi_k por estrato, para el simulador de la rueda
psi_por_estrato <- lapply(niveles_lucy, function(l) {
  x <- BigLucy$Employees[BigLucy$Level == l]
  p <- x / sum(x)
  as.numeric(quantile(p, probs = seq(0, 1, 0.1)))
})

cifras$ppt <- list(
  mh = as.list(mh), estratos = lucy_h,
  tIncome = sum(BigLucy$Income),
  estimacion = t_hh, se = sqrt(sum(v_hh_h)),
  porEstrato = list(t = t_hh_h, se = sqrt(v_hh_h)),
  seStsi = sqrt(V_stsi),
  psiDeciles = psi_por_estrato,
  ratioEmpleados = max(BigLucy$Employees) / min(BigLucy$Employees)
)

# =============================================================================
# 9. Postestratificación como calibración (agsrs -> totales de región)
# =============================================================================
cat("== 9. Postestratificación ==\n")
conteo_srs <- table(factor(agsrs$region, levels = regiones))
w0 <- N / 300

# Vía 1: a mano. El peso pasa de N/n a N_h/n_h dentro de cada región.
w_post <- pob_h$Nh[match(agsrs$region, pob_h$region)] / as.numeric(conteo_srs[agsrs$region])
comprueba("los pesos calibrados suman N", sum(w_post), N)
ybar_post <- sum(w_post * agsrs$acres92) / sum(w_post)

# La varianza condicional de la postestratificación (Lohr 4.4, ecuación clásica):
# misma forma que la estratificada, con los n_h observados.
V_post_cond <- sum(Wh^2 * sapply(regiones, function(r) {
  y <- agsrs$acres92[agsrs$region == r]
  (1 - length(y) / pob_h$Nh[pob_h$region == r]) * var(y) / length(y)
}))

# Vía 2: survey::postStratify
dis_srs <- svydesign(id = ~1, weights = rep(w0, 300), fpc = rep(N, 300), data = agsrs)
dis_post <- postStratify(dis_srs, ~region, data.frame(region = regiones, Freq = pob_h$Nh))
sv_post <- svymean(~acres92, dis_post)
comprueba("media postestratificada: a mano <-> survey", ybar_post, coef(sv_post)[1])
cat(sprintf("  survey SE = %.4f | condicional a mano = %.4f (difieren por diseño: nota didáctica)\n",
            SE(sv_post)[1], sqrt(V_post_cond)))

cifras$postestratificacion <- list(
  conteos = as.numeric(conteo_srs), w0 = w0,
  wPost = pob_h$Nh / as.numeric(conteo_srs),
  ybarSrs = ybar_srs, seSrs = se_srs,
  ybarPost = ybar_post, sePost = SE(sv_post)[1], sePostCond = sqrt(V_post_cond),
  Nh = pob_h$Nh, Wh = Wh,
  # medias y varianzas de agsrs POR region: el simulador recalcula en vivo
  # que pasa con la calibracion si el MAS hubiera salido con otro reparto
  ybarH = as.numeric(sapply(regiones, function(r) mean(agsrs$acres92[agsrs$region == r]))),
  s2H = as.numeric(sapply(regiones, function(r) var(agsrs$acres92[agsrs$region == r])))
)

# =============================================================================
# Salida
# =============================================================================
datos <- c(list(meta = list(
  generado = "precalculo/genera_cap4.R", semilla = SEMILLA, replicas = R,
  rVersion = as.character(getRversion())
)), cifras)

escribe_json(datos, "cap4_datos")
cat("Hecho.\n")
