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

# ANOVA por estado y la ICC ajustada de Lohr (R_a^2 = 1 - MSW/S^2)
medias_est <- tapply(agpop$acres92, agpop$state, mean)
SSW <- sum(tapply(agpop$acres92, agpop$state, function(y) sum((y - mean(y))^2)))
SST <- sum((agpop$acres92 - media_U)^2)
MSW <- SSW / (N - NI)
Ra2 <- 1 - MSW / S2_U
cat(sprintf("  NI = %d estados, Mi de %d a %d, R_a^2 = %.4f\n",
            NI, min(Mi_est), max(Mi_est), Ra2))

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
  NI = NI, nI = nI, nEquiv = n_equiv, replicas = R, Ra2 = Ra2,
  media = media_U, MiMin = min(Mi_est), MiMax = max(Mi_est), Mbar = mean(Mi_est),
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
# La ICC es la R_a^2 de Lohr, 1 - MSW/S^2, con MSW = SSW/(K - n). Hasta el
# 2026-10-22 se calculaba 1 - K/(K-1) * SSW/SST, un factor sin justificación
# que daba 0,42 en lugar de 0,30 (y 0,072 en lugar de 0,040 en algebra).
msw_gpa <- sum(tapply(gpa$gpa, gpa$suite, function(y) sum((y - mean(y))^2))) / (n_su * M_su - n_su)
icc_gpa <- 1 - msw_gpa / var(gpa$gpa)
# El s^2 de los 20 estudiantes subestima S^2 cuando hay pocos conglomerados
# (Lohr, ej. 5.4). El estimador insesgado sale de la tabla ANOVA poblacional
# estimada, S2_hat = ((N-1) MSB + N(M-1) MSW) / (NM - 1). Con el, la formula de
# Kish y el deff estimado coinciden; con s^2, la formula parecia quedarse corta.
msb_gpa <- var(t_i) / M_su
s2_lohr_gpa <- ((N_su - 1) * msb_gpa + N_su * (M_su - 1) * msw_gpa) / (N_su * M_su - 1)
icc_lohr_gpa <- 1 - msw_gpa / s2_lohr_gpa
comprueba("gpa: S2 estimada <-> Lohr ej. 5.4 (0,279)", s2_lohr_gpa, 0.279, 2e-3)
comprueba("gpa: R_a^2 con S2 estimada <-> Lohr ej. 5.4 (0,337)", icc_lohr_gpa, 0.337, 2e-3)
comprueba("gpa: deff MSB/S2 <-> Lohr ej. 5.4 (2,02)", msb_gpa / s2_lohr_gpa, 2.02, 2e-3)
cifras$gpa <- list(N = N_su, n = n_su, M = M_su, ti = as.numeric(t_i),
                   ybar = ybar_cl, se = sqrt(V_cl), seNaive = se_naive,
                   s = sd(gpa$gpa), icc = icc_gpa, deff = V_cl / se_naive^2,
                   s2Lohr = s2_lohr_gpa, iccLohr = icc_lohr_gpa,
                   kishLohr = 1 + (M_su - 1) * icc_lohr_gpa,
                   deffLohr = msb_gpa / s2_lohr_gpa)
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

# La ICC muestral: la R_a^2 de Lohr, 1 - MSW/S^2, con MSW = SSW/(K - n)
Mbar_alg <- mean(M_alg)
SSW_a <- sum(tapply(algebra$score, algebra$class, function(y) sum((y - mean(y))^2)))
icc_alg <- 1 - (SSW_a / (K_alg - n_cl)) / var(algebra$score)
# Con S^2 estimada como en Lohr (ej. 5.4), y Mbar en lugar de M (Lohr 5.4.2):
msw_alg <- SSW_a / (K_alg - n_cl)
msb_alg <- sum(M_alg * (tapply(algebra$score, algebra$class, mean) - ybar_alg)^2) / (n_cl - 1)
s2_lohr_alg <- ((N_cl - 1) * msb_alg + N_cl * (Mbar_alg - 1) * msw_alg) / (N_cl * Mbar_alg - 1)
icc_lohr_alg <- 1 - msw_alg / s2_lohr_alg
# El deff empírico contra un MAS SIN reemplazo del mismo tamaño en la misma
# población: los dos lados llevan su fpc. El de antes (2,10) dividía entre
# s/sqrt(K), sin fpc, y comparaba un lado con fpc contra otro sin ella.
N_pop_alg <- sum(weights(dis_alg))
se_mas_alg <- sqrt((1 - K_alg / N_pop_alg) * var(algebra$score) / K_alg)
deff_alg <- (SE(sv_alg)[1] / se_mas_alg)^2
comprueba("algebra: deff a mano <-> svymean(deff = TRUE)", deff_alg,
          deff(svymean(~score, dis_alg, deff = TRUE)))
cat(sprintf("  ybar = %.4f, ee = %.4f | R_a^2 = %.4f | deff = %.3f | 1+(Mbar-1)R_a^2 = %.3f\n",
            ybar_alg, SE(sv_alg)[1], icc_alg, deff_alg, 1 + (Mbar_alg - 1) * icc_alg))

# lmer (módulo 10): la misma ICC vista como modelo de efectos aleatorios
m_lmer <- lmer(score ~ (1 | class), data = algebra, REML = TRUE)
vc <- as.data.frame(VarCorr(m_lmer))
icc_lmer <- vc$vcov[1] / sum(vc$vcov)
cat(sprintf("  ICC por lmer = %.4f (R_a^2: %.4f)\n", icc_lmer, icc_alg))

cifras$algebra <- list(N = N_cl, n = n_cl, K = K_alg, Mbar = Mbar_alg,
                       Mi = as.numeric(M_alg), ti = as.numeric(t_alg),
                       mediasClase = as.numeric(tapply(algebra$score, algebra$class, mean)),
                       ybar = ybar_alg, se = as.numeric(SE(sv_alg)[1]),
                       seMas = se_mas_alg, s = sd(algebra$score), NPop = N_pop_alg,
                       icc = icc_alg, iccLmer = icc_lmer,
                       iccLohr = icc_lohr_alg,
                       kishLohr = 1 + (Mbar_alg - 1) * icc_lohr_alg,
                       deff = as.numeric(deff_alg),
                       sigmaEntre = vc$vcov[1], sigmaDentro = vc$vcov[2])

# =============================================================================
# 4. coots: tamaños desiguales, razón contra media de medias
# =============================================================================
cat("== 4. coots ==\n")
coots <- lee_lohr("coots")
n_nid <- length(unique(coots$clutch))
# HALLAZGO DE AUDITORIA sobre el archivo oficial: la nidada 88 trae csize
# inconsistente entre sus dos huevos (9 y 11). El material pondera CADA huevo
# con su propio csize/2, a mano y en survey, y el capitulo lo declara en una
# nota. Es convencion del material, no de Lohr: sus cifras del ej. 5.8 (suma de
# pesos 1757) salen de tomar 9 para los dos huevos, y despues usa 1758 para Mbar.
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

# Los dos sumandos NO son el aporte de cada etapa: s_t^2 se calcula con totales
# ESTIMADOS y su esperanza incluye parte de la varianza de la etapa 2 (Lohr,
# ec. 5.28). La etapa 2 se estima con (N/n) * V_dentro; la etapa 1, el resto.
# Hasta el 2026-10-22 el capitulo leia el 99,2 % del primer sumando como el
# aporte de la etapa 1.
V_etapa2 <- N_sc / n_sc * V_dentro
V_etapa1 <- V_2e - V_etapa2
comprueba("schools: etapa 1 <-> V_entre - (N/n - 1) V_dentro", V_etapa1,
          V_entre - (N_sc / n_sc - 1) * V_dentro)
V_etapa2_m40 <- (N_sc / n_sc)^2 * sum(Mi_sc^2 * (1 - 40 / Mi_sc) * s2_sc / 40)
# El atajo del «conglomerado ultimo»: survey con solo la etapa 1 declarada.
# Con fpc devuelve exactamente sqrt(V_entre) (subestima un poco); sin fpc, la
# varianza con reemplazo N^2 s_t^2 / n (Lohr 5.29), que sobreestima.
dis_ult <- svydesign(id = ~schoolid, fpc = ~fpc1, weights = ~finalwt, data = schools)
dis_ult_cr <- svydesign(id = ~schoolid, weights = ~finalwt, data = schools)
se_ult <- SE(svytotal(~math, dis_ult))[[1]]
se_ult_cr <- SE(svytotal(~math, dis_ult_cr))[[1]]
comprueba("schools: ultimo con fpc <-> sqrt(V_entre)", se_ult, sqrt(V_entre))
comprueba("schools: ultimo sin fpc <-> N^2 s_t^2 / n", se_ult_cr^2, N_sc^2 * var(ti_sc) / n_sc)

# La media por estudiante es una razón (K desconocido): survey la da directa
sv_media <- svymean(~math, dis_sc)
cat(sprintf("  t = %.1f (ee %.1f) | sumandos %.1f%% / %.1f%% | etapas %.1f%% / %.1f%% | media = %.2f (ee %.3f)\n",
            t_2e, sqrt(V_2e), 100 * V_entre / V_2e, 100 * V_dentro / V_2e,
            100 * V_etapa1 / V_2e, 100 * V_etapa2 / V_2e,
            coef(sv_media)[1], SE(sv_media)[1]))
cat(sprintf("  conglomerado ultimo: ee %.1f con fpc, %.1f sin fpc | m = 40 recorta %.1f%%\n",
            se_ult, se_ult_cr, 100 * (V_etapa2 - V_etapa2_m40) / V_2e))

cifras$schools <- list(N = N_sc, n = n_sc, m = m_sc,
                       Mi = as.numeric(Mi_sc), ybarI = as.numeric(yb_sc),
                       s2I = as.numeric(s2_sc), ti = as.numeric(ti_sc),
                       total = t_2e, se = sqrt(V_2e),
                       vEntre = V_entre, vDentro = V_dentro,
                       vEtapa1 = V_etapa1, vEtapa2 = V_etapa2,
                       pctEtapa1 = 100 * V_etapa1 / V_2e, pctEtapa2 = 100 * V_etapa2 / V_2e,
                       pctRecorteM40 = 100 * (V_etapa2 - V_etapa2_m40) / V_2e,
                       seUltimo = se_ult, seUltimoSinFpc = se_ult_cr,
                       nAlumnos = sum(Mi_sc), factorCenso = sum(Mi_sc) / (n_sc * m_sc),
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
cat(sprintf("  %d zonas, Mi de %d a %d, ICC (R_a^2) = %.4f\n",
            NI_z, min(Mi_z), max(Mi_z), Ra_z))

cifras$zonas <- list(NI = NI_z, Mi = Mi_z, S2i = S2_z, S2t = S2t_z,
                     tIncome = sum(BigLucy$Income), K = nrow(BigLucy),
                     S2 = S2_lucy, Ra2 = Ra_z, Mbar = mean(Mi_z))

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

# El deff del combinado contra un MAS del MISMO n esperado (467 condados), no
# contra el de 369 del conglomerado puro. Hasta el 2026-10-22 la tabla dividia
# entre V_mas_eq (n = 369) y llamaba a eso deff ~ 16.
V_mas_comb <- (1 - mean(n_comb) / N) * S2_U / mean(n_comb)

# La comparacion justa del efecto del estrato: 8 estados sorteados SIN
# estratos (el conglomerado puro de la tabla tiene 6).
set.seed(SEMILLA)
rep_8 <- numeric(R2); n_8 <- numeric(R2)
for (r in seq_len(R2)) {
  filas <- unlist(idx_est[sample(NI, 8)], use.names = FALSE)
  rep_8[r] <- mean(agpop$acres92[filas])
  n_8[r] <- length(filas)
}
V_mas_8 <- (1 - mean(n_8) / N) * S2_U / mean(n_8)

# Estados distintos que toca, en promedio, un MAS de 369 condados (exacto,
# hipergeometrico). La tabla decia 50, escrito a mano.
estados_mas <- sum(1 - exp(lchoose(N - Mi_est, n_equiv) - lchoose(N, n_equiv)))
cat(sprintf("  deff combinado (MAS de %.0f) = %.2f | 8 estados sin estratos: V = %.0f (n %.0f, deff %.2f) | estratos recortan %.1f%% | MAS toca %.1f estados\n",
            mean(n_comb), var(rep_comb) / V_mas_comb, var(rep_8), mean(n_8),
            var(rep_8) / V_mas_8, 100 * (1 - var(rep_comb) / var(rep_8)), estados_mas))

cifras$combinado <- list(replicas = R2, nEstados = 8, V = var(rep_comb),
                         nMedio = mean(n_comb),
                         VclusterPuro = var(rep_cluster),
                         VmasEquivalente = V_mas_eq,
                         VmasMismoN = V_mas_comb,
                         deffMismoN = var(rep_comb) / V_mas_comb,
                         V8sinEstratos = var(rep_8), nMedio8 = mean(n_8),
                         deff8 = var(rep_8) / V_mas_8,
                         recorteEstratosPct = 100 * (1 - var(rep_comb) / var(rep_8)),
                         estadosMas = estados_mas,
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
