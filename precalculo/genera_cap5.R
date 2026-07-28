# genera_cap5.R — datos precalculados del Capítulo 5 (muestreo por conglomerados)
#
# Ejecutar SIEMPRE con el R del framework 4.4, desde la raíz del repositorio:
#   /Library/Frameworks/R.framework/Versions/4.4-arm64/Resources/bin/Rscript precalculo/genera_cap5.R
#
# Produce  precalculo/salidas/cap5_datos.json.  Ninguna cifra del capítulo se
# escribe a mano: o sale de aquí, o de un bloque ejecutado por verifica_bloques.py.
#
# Los chunks del Rmd viejo (material_muestreo_cap4_5_lohr.Rmd) se ejecutaron
# antes de reutilizar nada, como manda el plan. Dos hallazgos que justifican
# recalcular todo: su bloque de coots declaraba el diseño de modo que survey
# devolvía SE = 0, y un chunk ni siquiera compila por encoding roto.

source("precalculo/_comun.R")
suppressPackageStartupMessages({
  library(survey)
  library(TeachingSampling)
  library(lme4)
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
# 1. Los estados como conglomerados: la población del curso, reagrupada
# =============================================================================
cat("== 1. agpop: estados como conglomerados ==\n")
agpop <- lee_lohr("agpop")
N <- nrow(agpop)
NI <- length(unique(agpop$state))          # 50 estados
Mi_est <- as.numeric(table(agpop$state))   # condados por estado
media_U <- mean(agpop$acres92)
S2_U <- var(agpop$acres92)

# ANOVA por estado y la ICC ajustada de Lohr (R_a = 1 - MSW/S^2)
medias_est <- tapply(agpop$acres92, agpop$state, mean)
SSW <- sum(tapply(agpop$acres92, agpop$state, function(y) sum((y - mean(y))^2)))
SST <- sum((agpop$acres92 - media_U)^2)
MSW <- SSW / (N - NI)
Ra <- 1 - MSW / S2_U
cat(sprintf("  NI = %d estados, Mi de %d a %d, R_a = %.4f\n",
            NI, min(Mi_est), max(Mi_est), Ra))

# Réplicas: una etapa (6 estados completos, estimador de razón) frente a un
# MAS de condados con el mismo n esperado.
R <- 10000
nI <- 6
n_equiv <- round(nI * N / NI)              # 369 condados esperados
idx_est <- split(seq_len(N), agpop$state)
rep_cluster <- numeric(R); rep_mas <- numeric(R); n_obs <- numeric(R)
set.seed(SEMILLA)
for (r in seq_len(R)) {
  estados <- sample(NI, nI)
  filas <- unlist(idx_est[estados], use.names = FALSE)
  rep_cluster[r] <- mean(agpop$acres92[filas])   # razón: total/condados
  n_obs[r] <- length(filas)
  rep_mas[r] <- mean(agpop$acres92[sample.int(N, n_equiv)])
}
V_mas_eq <- (1 - n_equiv / N) * S2_U / n_equiv
deff_emp <- var(rep_cluster) / var(rep_mas)
cat(sprintf("  V cluster / V MAS (deff empirico) = %.2f | n medio observado = %.0f\n",
            deff_emp, mean(n_obs)))
comprueba("V simulada MAS <-> teórica", var(rep_mas), V_mas_eq, 0.05)

breaks <- seq(min(rep_cluster, rep_mas), max(rep_cluster, rep_mas), length.out = 41)
hace_hist <- function(x) {
  h <- hist(x, breaks = breaks, plot = FALSE)
  list(centros = h$mids, conteo = h$counts, ancho = diff(breaks)[1])
}
cifras$estados <- list(
  NI = NI, nI = nI, nEquiv = n_equiv, replicas = R, Ra = Ra,
  media = media_U, MiMin = min(Mi_est), MiMax = max(Mi_est),
  cluster = hace_hist(rep_cluster), mas = hace_hist(rep_mas),
  varCluster = var(rep_cluster), varMas = var(rep_mas), deffEmp = deff_emp,
  nObsMedio = mean(n_obs), nObsMin = min(n_obs), nObsMax = max(n_obs)
)

# =============================================================================
# 2. gpa: una etapa, conglomerados de igual tamaño (Lohr, ejemplo clásico)
# =============================================================================
cat("== 2. gpa ==\n")
gpa <- lee_lohr("gpa")
N_su <- 100; n_su <- 5; M_su <- 4
t_i <- tapply(gpa$gpa, gpa$suite, sum)
ybar_cl <- sum(t_i) / (n_su * M_su)
V_cl <- (1 - n_su / N_su) * var(t_i) / (n_su * M_su^2)
gpa$fpc <- N_su
dis_gpa <- svydesign(id = ~suite, weights = ~wt, fpc = ~fpc, data = gpa)
sv <- svymean(~gpa, dis_gpa)
comprueba("gpa: media a mano <-> survey", ybar_cl, coef(sv)[1])
comprueba("gpa: SE a mano <-> survey", sqrt(V_cl), SE(sv)[1])

# El error de analizarla como si fuera un MAS de 20 estudiantes:
se_naive <- sqrt((1 - 20 / 400) * var(gpa$gpa) / 20)
icc_gpa <- 1 - (20 / (20 - 1)) * (sum(tapply(gpa$gpa, gpa$suite, function(y) sum((y - mean(y))^2))) /
                                    sum((gpa$gpa - mean(gpa$gpa))^2))
cifras$gpa <- list(N = N_su, n = n_su, M = M_su, ti = as.numeric(t_i),
                   ybar = ybar_cl, se = sqrt(V_cl), seNaive = se_naive,
                   icc = icc_gpa, deff = V_cl / se_naive^2)
cat(sprintf("  ybar = %.4f, ee = %.4f (naive: %.4f) | ICC = %.4f\n",
            ybar_cl, sqrt(V_cl), se_naive, icc_gpa))

# =============================================================================
# 3. algebra: ICC, ANOVA y deff con datos reales (N = 187 clases de Lohr)
# =============================================================================
cat("== 3. algebra ==\n")
algebra <- lee_lohr("algebra")
N_cl <- 187; n_cl <- length(unique(algebra$class))
K_alg <- nrow(algebra)
t_alg <- tapply(algebra$score, algebra$class, sum)
M_alg <- tapply(algebra$Mi, algebra$class, unique)
ybar_alg <- sum(t_alg) / sum(M_alg)

# survey con el diseño correcto (conglomerados en una etapa)
algebra$peso <- N_cl / n_cl
algebra$fpc <- N_cl
dis_alg <- svydesign(id = ~class, weights = ~peso, fpc = ~fpc, data = algebra)
sv_alg <- svymean(~score, dis_alg)
comprueba("algebra: razón a mano <-> survey", ybar_alg, coef(sv_alg)[1])

# La ICC muestral por ANOVA (con tamaño medio ponderado para Mi desiguales)
Mbar_alg <- mean(M_alg)
SSW_a <- sum(tapply(algebra$score, algebra$class, function(y) sum((y - mean(y))^2)))
SST_a <- sum((algebra$score - mean(algebra$score))^2)
icc_alg <- 1 - (K_alg / (K_alg - 1)) * SSW_a / SST_a
se_naive_alg <- sd(algebra$score) / sqrt(K_alg)
deff_alg <- (SE(sv_alg)[1] / se_naive_alg)^2
cat(sprintf("  ybar = %.4f, ee = %.4f | ICC = %.4f | deff = %.2f | 1+(Mbar-1)icc = %.2f\n",
            ybar_alg, SE(sv_alg)[1], icc_alg, deff_alg, 1 + (Mbar_alg - 1) * icc_alg))

# lmer (módulo 10): la misma ICC vista como modelo de efectos aleatorios
m_lmer <- lmer(score ~ (1 | class), data = algebra, REML = TRUE)
vc <- as.data.frame(VarCorr(m_lmer))
icc_lmer <- vc$vcov[1] / sum(vc$vcov)
cat(sprintf("  ICC por lmer = %.4f (ANOVA: %.4f)\n", icc_lmer, icc_alg))

cifras$algebra <- list(N = N_cl, n = n_cl, K = K_alg, Mbar = Mbar_alg,
                       Mi = as.numeric(M_alg), ti = as.numeric(t_alg),
                       mediasClase = as.numeric(tapply(algebra$score, algebra$class, mean)),
                       ybar = ybar_alg, se = as.numeric(SE(sv_alg)[1]),
                       seNaive = se_naive_alg, icc = icc_alg, iccLmer = icc_lmer,
                       deff = as.numeric(deff_alg),
                       sigmaEntre = vc$vcov[1], sigmaDentro = vc$vcov[2])

# =============================================================================
# 4. coots: tamaños desiguales, razón contra media de medias
# =============================================================================
cat("== 4. coots ==\n")
coots <- lee_lohr("coots")
n_nid <- length(unique(coots$clutch))
# HALLAZGO DE AUDITORIA sobre el archivo oficial: la nidada 88 trae csize
# inconsistente entre sus dos huevos (9 y 11). La convencion de Lohr es
# ponderar CADA huevo con su propio csize/2, y esa es la que se sigue aqui
# a mano y en survey; el capitulo lo declara en una nota.
coots$w <- coots$csize / 2
res_nid <- do.call(rbind, lapply(split(coots, coots$clutch), function(d) {
  data.frame(clutch = d$clutch[1], Mi = sum(d$w), ybar_i = mean(d$volume),
             t_i = sum(d$w * d$volume))
}))
ybar_r <- sum(res_nid$t_i) / sum(res_nid$Mi)

# Varianza del estimador de razón (Lohr 5.2.2, sin fpc: N de nidadas enorme)
e_i <- res_nid$t_i - ybar_r * res_nid$Mi
Mbar_c <- mean(res_nid$Mi)
V_r <- (1 / (n_nid * Mbar_c^2)) * var(e_i)
# survey: pesos proporcionales a csize/2 (cada huevo representa csize/2 huevos)
dis_coots <- svydesign(id = ~clutch, weights = ~w, data = coots)
sv_coots <- svymean(~volume, dis_coots)
comprueba("coots: razón a mano <-> survey", ybar_r, coef(sv_coots)[1])
comprueba("coots: SE razón a mano <-> survey", sqrt(V_r), SE(sv_coots)[1])

# Los dos espejismos: media por huevo (ignora el diseño) y media de medias
# (estima OTRO parámetro: el promedio por nidada, no por huevo)
media_huevo <- mean(coots$volume)
media_medias <- mean(res_nid$ybar_i)
cat(sprintf("  razón = %.4f (ee %.4f) | por huevo = %.4f | media de medias = %.4f\n",
            ybar_r, sqrt(V_r), media_huevo, media_medias))

# Para el simulador: submuestras de nidadas de varios tamaños, con semilla
set.seed(SEMILLA)
sub_n <- c(20, 40, 80, 120, 184)
sub_res <- lapply(sub_n, function(nn) {
  idx <- if (nn == n_nid) seq_len(n_nid) else sample(n_nid, nn)
  d <- res_nid[idx, ]
  yr <- sum(d$t_i) / sum(d$Mi)
  ee <- sqrt(var(d$t_i - yr * d$Mi) / (nn * mean(d$Mi)^2))
  list(n = nn, razon = yr, ee = ee, mediaMedias = mean(d$ybar_i))
})
cifras$coots <- list(n = n_nid, huevos = nrow(coots), MiMin = min(res_nid$Mi),
                     MiMax = max(res_nid$Mi), Mbar = Mbar_c,
                     razon = ybar_r, se = sqrt(V_r), seSurvey = as.numeric(SE(sv_coots)[1]),
                     mediaHuevo = media_huevo, mediaMedias = media_medias,
                     Mi = res_nid$Mi, ybarI = res_nid$ybar_i,
                     submuestras = sub_res)

# =============================================================================
# 5. schools: dos etapas MAS-MAS por tres vías (manual, survey, E.2SI)
# =============================================================================
cat("== 5. schools (dos etapas) ==\n")
schools <- lee_lohr("schools")
N_sc <- 75; n_sc <- 10; m_sc <- 20
Mi_sc <- tapply(schools$Mi, schools$schoolid, unique)
yb_sc <- tapply(schools$math, schools$schoolid, mean)
s2_sc <- tapply(schools$math, schools$schoolid, var)
ti_sc <- Mi_sc * yb_sc

t_2e <- N_sc / n_sc * sum(ti_sc)
V_entre <- N_sc^2 * (1 - n_sc / N_sc) * var(ti_sc) / n_sc
V_dentro <- N_sc / n_sc * sum(Mi_sc^2 * (1 - m_sc / Mi_sc) * s2_sc / m_sc)
V_2e <- V_entre + V_dentro

schools$stu <- ave(schools$math, schools$schoolid, FUN = seq_along)
schools$fpc1 <- N_sc
dis_sc <- svydesign(id = ~schoolid + stu, fpc = ~fpc1 + Mi, data = schools)
sv_sc <- svytotal(~math, dis_sc)
comprueba("schools: total a mano <-> survey", t_2e, coef(sv_sc)[1])
comprueba("schools: SE a mano <-> survey", sqrt(V_2e), SE(sv_sc)[1])

e2si <- E.2SI(N_sc, n_sc, as.numeric(Mi_sc), m_sc, schools$math,
              as.factor(schools$schoolid))
comprueba("schools: total <-> E.2SI", t_2e, e2si["Estimation", "y"])
comprueba("schools: SE <-> E.2SI", sqrt(V_2e), e2si["Standard Error", "y"])

# La media por estudiante es una razón (K desconocido): survey la da directa
sv_media <- svymean(~math, dis_sc)
cat(sprintf("  t = %.1f (ee %.1f) | entre %.0f%% / dentro %.0f%% | media = %.2f (ee %.3f)\n",
            t_2e, sqrt(V_2e), 100 * V_entre / V_2e, 100 * V_dentro / V_2e,
            coef(sv_media)[1], SE(sv_media)[1]))

cifras$schools <- list(N = N_sc, n = n_sc, m = m_sc,
                       Mi = as.numeric(Mi_sc), ybarI = as.numeric(yb_sc),
                       s2I = as.numeric(s2_sc), ti = as.numeric(ti_sc),
                       total = t_2e, se = sqrt(V_2e),
                       vEntre = V_entre, vDentro = V_dentro,
                       media = as.numeric(coef(sv_media)[1]),
                       seMedia = as.numeric(SE(sv_media)[1]))

# =============================================================================
# 6. BigLucy por zonas: constantes para los simuladores de dos etapas y costos
# =============================================================================
cat("== 6. BigLucy por zonas ==\n")
data(BigLucy)
NI_z <- length(unique(BigLucy$Zone))
Mi_z <- as.numeric(table(BigLucy$Zone))
t_z <- as.numeric(tapply(BigLucy$Income, BigLucy$Zone, sum))
S2_z <- as.numeric(tapply(BigLucy$Income, BigLucy$Zone, var))
S2t_z <- var(t_z)
S2_lucy <- var(BigLucy$Income)
MSW_z <- sum(tapply(BigLucy$Income, BigLucy$Zone, function(y) sum((y - mean(y))^2))) /
  (nrow(BigLucy) - NI_z)
Ra_z <- 1 - MSW_z / S2_lucy
cat(sprintf("  %d zonas, Mi de %d a %d, ICC (R_a) = %.4f\n",
            NI_z, min(Mi_z), max(Mi_z), Ra_z))

cifras$zonas <- list(NI = NI_z, Mi = Mi_z, S2i = S2_z, S2t = S2t_z,
                     tIncome = sum(BigLucy$Income), K = nrow(BigLucy),
                     S2 = S2_lucy, Ra = Ra_z, Mbar = mean(Mi_z))

# =============================================================================
# 7. Estratos × conglomerados sobre agpop: región = estrato, estado = PSU
# =============================================================================
cat("== 7. Estratos x conglomerados (réplicas) ==\n")
regiones <- c("NC", "NE", "S", "W")
estados_por_region <- lapply(regiones, function(r) unique(agpop$state[agpop$region == r]))
names(estados_por_region) <- regiones
n_est_reg <- sapply(estados_por_region, length)   # estados en cada región
cat(sprintf("  estados por región: %s\n", paste(n_est_reg, collapse = "/")))

# Diseño combinado: 2 estados por región (8 estados), todos sus condados.
set.seed(SEMILLA)
R2 <- 5000
rep_comb <- numeric(R2); n_comb <- numeric(R2)
Wh <- as.numeric(table(agpop$region)[regiones]) / N
for (r in seq_len(R2)) {
  medias_h <- numeric(4)
  ntot <- 0
  for (h in 1:4) {
    est <- sample(estados_por_region[[h]], 2)
    filas <- agpop$state %in% est
    medias_h[h] <- mean(agpop$acres92[filas])     # razón dentro del estrato
    ntot <- ntot + sum(filas)
  }
  rep_comb[r] <- sum(Wh * medias_h)
  n_comb[r] <- ntot
}
cat(sprintf("  combinado: V = %.0f | n medio = %.0f | vs cluster puro V = %.0f\n",
            var(rep_comb), mean(n_comb), var(rep_cluster)))

cifras$combinado <- list(replicas = R2, nEstados = 8, V = var(rep_comb),
                         nMedio = mean(n_comb),
                         VclusterPuro = var(rep_cluster),
                         VmasEquivalente = V_mas_eq,
                         estadosPorRegion = as.numeric(n_est_reg))

# =============================================================================
# Salida
# =============================================================================
datos <- c(list(meta = list(
  generado = "precalculo/genera_cap5.R", semilla = SEMILLA,
  replicas = R, replicasCombinado = R2,
  rVersion = as.character(getRversion())
)), cifras)

escribe_json(datos, "cap5_datos")
cat("Hecho.\n")
