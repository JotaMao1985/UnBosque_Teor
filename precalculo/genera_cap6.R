# genera_cap6.R — datos precalculados del Capítulo 6 (probabilidades desiguales)
#
# Ejecutar SIEMPRE con el R del framework 4.4, desde la raíz del repositorio:
#   /Library/Frameworks/R.framework/Versions/4.4-arm64/Resources/bin/Rscript precalculo/genera_cap6.R
#
# Produce  precalculo/salidas/cap6_datos.json.  Ninguna cifra del capítulo se
# escribe a mano: o sale de aquí, o de un bloque ejecutado por verifica_bloques.py.
#
# Los chunks del Rmd viejo (material_muestreo_cap6_lohr.Rmd) se ejecutaron antes
# de reutilizar nada (16 de 22 OK; los 6 que fallan son tablas decorativas con
# encoding roto y sus cascadas). Aun así, todo se recalcula aquí.

source("precalculo/_comun.R")
suppressPackageStartupMessages({
  library(survey)
  library(sampling)
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
# 1. Las cuatro tiendas de Lohr (ej. 6.1-6.3): todo exacto, por enumeración
# =============================================================================
cat("== 1. tiendas: psi proporcional al tamaño, n = 1 ==\n")
tiendas <- data.frame(
  tienda = c("A", "B", "C", "D"),
  m2     = c(100, 200, 300, 1000),
  t      = c(11, 20, 24, 245)        # ventas en miles de USD
)
t_total <- sum(tiendas$t)
tiendas$psi <- tiendas$m2 / sum(tiendas$m2)
tiendas$est_ppt <- tiendas$t / tiendas$psi        # t-hat si sale esa tienda
tiendas$est_igual <- 4 * tiendas$t                # con psi = 1/4

E_ppt  <- sum(tiendas$psi * tiendas$est_ppt)
V_ppt  <- sum(tiendas$psi * (tiendas$est_ppt - t_total)^2)
E_ig   <- sum(0.25 * tiendas$est_igual)
V_ig   <- sum(0.25 * (tiendas$est_igual - t_total)^2)
comprueba("tiendas: E exacta PPT = t", E_ppt, t_total)
comprueba("tiendas: E exacta iguales = t", E_ig, t_total)
cat(sprintf("  t = %d | V_ppt = %.1f | V_iguales = %.1f | razón = %.1f\n",
            t_total, V_ppt, V_ig, V_ig / V_ppt))

cifras$tiendas <- list(
  nombres = tiendas$tienda, m2 = tiendas$m2, t = tiendas$t,
  psi = tiendas$psi, estPpt = tiendas$est_ppt, estIgual = tiendas$est_igual,
  total = t_total, vPpt = V_ppt, vIgual = V_ig,
  acumulado = cumsum(tiendas$m2)                  # método acumulativo (rangos)
)

# =============================================================================
# 2. Hansen-Hurwitz con n = 2: los 16 pares ordenados, exactos
# =============================================================================
cat("== 2. HH con n = 2 sobre las tiendas ==\n")
pares <- expand.grid(i = 1:4, j = 1:4)
pares$prob <- tiendas$psi[pares$i] * tiendas$psi[pares$j]
pares$hh <- (tiendas$est_ppt[pares$i] + tiendas$est_ppt[pares$j]) / 2
E_hh <- sum(pares$prob * pares$hh)
V_hh_enum <- sum(pares$prob * (pares$hh - t_total)^2)
V_hh_form <- V_ppt / 2                             # V_HH = V(n=1)/n
comprueba("HH: E por enumeración = t", E_hh, t_total)
comprueba("HH: V por enumeración <-> fórmula", V_hh_enum, V_hh_form)

# distribución exacta (valores distintos y su probabilidad)
dist_hh <- aggregate(prob ~ hh, data = pares, sum)
dist_hh <- dist_hh[order(dist_hh$hh), ]
cifras$hh <- list(
  valores = dist_hh$hh, probs = dist_hh$prob,
  E = E_hh, V = V_hh_enum, se = sqrt(V_hh_enum)
)
cat(sprintf("  E = %.0f | V = %.1f (ee %.1f) | %d valores distintos\n",
            E_hh, V_hh_enum, sqrt(V_hh_enum), nrow(dist_hh)))

# =============================================================================
# 3. Acumulativo y Lahiri: la verificación empírica de que ambos dan psi
# =============================================================================
cat("== 3. acumulativo y Lahiri ==\n")
B <- 100000
set.seed(SEMILLA)
acum <- cumsum(tiendas$m2)
sel_acum <- findInterval(runif(B) * sum(tiendas$m2), c(0, acum),
                         left.open = TRUE, rightmost.closed = TRUE)
frec_acum <- as.numeric(table(factor(sel_acum, levels = 1:4))) / B

set.seed(SEMILLA + 1)
M_max <- max(tiendas$m2)
sel_lahiri <- integer(B); intentos <- integer(B)
for (b in seq_len(B)) {
  k <- 0
  repeat {
    k <- k + 1
    i <- sample.int(4, 1)
    if (runif(1) * M_max <= tiendas$m2[i]) break
  }
  sel_lahiri[b] <- i; intentos[b] <- k
}
frec_lahiri <- as.numeric(table(factor(sel_lahiri, levels = 1:4))) / B
comprueba("acumulativo: frecuencias <-> psi", max(abs(frec_acum - tiendas$psi)), 0, 5e-3)
comprueba("Lahiri: frecuencias <-> psi", max(abs(frec_lahiri - tiendas$psi)), 0, 5e-3)
# E(intentos) teórico = M_max * N / sum(M) = 1000*4/1600 = 2.5
E_int_teo <- M_max * 4 / sum(tiendas$m2)
comprueba("Lahiri: intentos medios <-> teoría", mean(intentos), E_int_teo, 2e-2)
cat(sprintf("  intentos medios Lahiri = %.3f (teórico %.2f)\n", mean(intentos), E_int_teo))

cifras$seleccion <- list(
  B = B, frecAcum = frec_acum, frecLahiri = frec_lahiri,
  intentosMedios = mean(intentos), intentosTeoricos = E_int_teo,
  Mmax = M_max
)

# =============================================================================
# 4. Espacio de muestras N = 4, n = 2 sin reemplazo: pi_k, pi_kl, HT y SYG
#    exactos, con las mismas cuatro tiendas (continuación del cap. 2)
# =============================================================================
cat("== 4. espacio de muestras WOR: HT y SYG exactos ==\n")
muestras <- t(combn(4, 2))
p_s <- tiendas$m2[muestras[, 1]] + tiendas$m2[muestras[, 2]]
p_s <- p_s / sum(p_s)                              # p(s) proporc. a x_k + x_l
pi_k <- sapply(1:4, function(k) sum(p_s[apply(muestras == k, 1, any)]))
comprueba("WOR: suma de pi_k = n", sum(pi_k), 2)
pi_kl <- matrix(0, 4, 4)
for (s in seq_len(nrow(muestras))) {
  i <- muestras[s, 1]; j <- muestras[s, 2]
  pi_kl[i, j] <- pi_kl[i, j] + p_s[s]
  pi_kl[j, i] <- pi_kl[j, i] + p_s[s]
}
diag(pi_kl) <- pi_k

ht_s <- sapply(seq_len(nrow(muestras)), function(s) {
  ks <- muestras[s, ]; sum(tiendas$t[ks] / pi_k[ks])
})
E_ht <- sum(p_s * ht_s)
V_enum <- sum(p_s * (ht_s - t_total)^2)
comprueba("WOR: E del HT por enumeración = t", E_ht, t_total)

# doble suma (con Delta_kl) y forma SYG, ambas poblacionales exactas
Delta <- pi_kl - outer(pi_k, pi_k); diag(Delta) <- pi_k * (1 - pi_k)
y_pi <- tiendas$t / pi_k
V_doble <- sum(Delta * outer(y_pi, y_pi))
V_syg <- 0
for (k in 1:3) for (l in (k + 1):4) {
  V_syg <- V_syg + (pi_k[k] * pi_k[l] - pi_kl[k, l]) * (y_pi[k] - y_pi[l])^2
}
comprueba("WOR: enumeración <-> doble suma", V_enum, V_doble)
comprueba("WOR: enumeración <-> Sen-Yates-Grundy", V_enum, V_syg)
cat(sprintf("  V(t_HT) = %.1f (frente a HH n=2: %.1f)\n", V_enum, V_hh_enum))

cifras$espacioWor <- list(
  muestras = apply(muestras, 1, function(m) paste(tiendas$tienda[m], collapse = "")),
  pS = p_s, ht = ht_s, piK = pi_k, piKl = pi_kl,
  V = V_enum, vHH2 = V_hh_enum, total = t_total
)

# =============================================================================
# 5. statepps: pi PT real con n = 10, la inclusión forzosa y el MC
# =============================================================================
cat("== 5. statepps ==\n")
statepps <- lee_lohr("statepps")
N_st <- nrow(statepps)
t_counties <- sum(statepps$counties)
pi_st <- inclusionprobabilities(statepps$pop2019, 10)
n_forzosas <- sum(pi_st >= 1 - 1e-12)
comprueba("statepps: suma de pi = n", sum(pi_st), 10)
cat(sprintf("  %d estados | total condados = %d | pi in [%.4f, %.4f] | forzosas = %d (%s)\n",
            N_st, t_counties, min(pi_st), max(pi_st), n_forzosas,
            paste(statepps$state[pi_st >= 1 - 1e-12], collapse = ", ")))
# sin truncar, California pasaría de 1:
pi_crudo <- 10 * statepps$pop2019 / sum(statepps$pop2019)
cat(sprintf("  pi cruda de California = %.4f (por eso se trunca y se reescala)\n",
            max(pi_crudo)))

# Monte Carlo: pi PT sistemático frente a MAS de estados, mismas 10 UPM.
# (C(50,10) ~ 1e10 muestras: aquí sí se simula, no se puede enumerar.)
R_mc <- 10000
ht_sys <- matrix(NA_real_, R_mc, 3)   # counties, waterarea, pop2019
ht_mas <- matrix(NA_real_, R_mc, 3)
ys <- cbind(statepps$counties, statepps$waterarea, statepps$pop2019)
set.seed(SEMILLA)
for (r in seq_len(R_mc)) {
  s <- UPsystematic(pi_st) == 1
  ht_sys[r, ] <- colSums(ys[s, , drop = FALSE] / pi_st[s])
  m <- sample.int(N_st, 10)
  ht_mas[r, ] <- N_st / 10 * colSums(ys[m, , drop = FALSE])
}
tot_reales <- colSums(ys)
sesgo_rel <- colMeans(ht_sys) / tot_reales - 1
cat(sprintf("  sesgo relativo del HT sistemático (MC): %s\n",
            paste(sprintf("%.4f", sesgo_rel), collapse = " / ")))
if (max(abs(sesgo_rel)) > 0.01) stop("El HT sistemático muestra sesgo en el MC")

V_emp <- apply(ht_sys, 2, var); V_mas_emp <- apply(ht_mas, 2, var)
correl <- cor(statepps$pop2019, ys)
cat(sprintf("  correlación con el tamaño: counties %.3f | waterarea %.3f | pop %.3f\n",
            correl[1], correl[2], correl[3]))
cat(sprintf("  deff frente al MAS: counties %.2f | waterarea %.2f | pop %.5f\n",
            V_emp[1] / V_mas_emp[1], V_emp[2] / V_mas_emp[2], V_emp[3] / V_mas_emp[3]))

haz_hist <- function(x, brks) {
  h <- hist(x, breaks = brks, plot = FALSE)
  list(centros = h$mids, conteo = h$counts)
}
mc_var <- function(col) {
  brks <- seq(min(ht_sys[, col], ht_mas[, col]), max(ht_sys[, col], ht_mas[, col]),
              length.out = 41)
  list(pps = haz_hist(ht_sys[, col], brks), mas = haz_hist(ht_mas[, col], brks),
       vPps = V_emp[col], vMas = V_mas_emp[col], total = tot_reales[col],
       corr = correl[col])
}
# HH con reemplazo (psi prop. a pop) sobre counties: exacta, para el ranking
psi_st <- statepps$pop2019 / sum(statepps$pop2019)
V_hh_st <- sum(psi_st * (statepps$counties / psi_st - t_counties)^2) / 10

cifras$statepps <- list(
  N = N_st, n = 10, totalCounties = t_counties, replicas = R_mc,
  estados = statepps$state, pi = pi_st,
  countiesPorEstado = statepps$counties, waterPorEstado = statepps$waterarea,
  piCrudaMax = max(pi_crudo),
  forzosas = statepps$state[pi_st >= 1 - 1e-12],
  counties = mc_var(1), waterarea = mc_var(2), pop = mc_var(3),
  vHhCounties = V_hh_st
)

# =============================================================================
# 6. Poisson con las pi de statepps: n aleatorio, todo exacto
# =============================================================================
cat("== 6. Poisson ==\n")
E_n <- sum(pi_st); V_n <- sum(pi_st * (1 - pi_st))
# distribución exacta de n (Poisson-binomial) por convolución
pn <- 1
for (p in pi_st) pn <- c(pn * (1 - p), 0) + c(0, pn * p)
comprueba("Poisson: la distribución de n suma 1", sum(pn), 1)
comprueba("Poisson: E(n) por convolución", sum((seq_along(pn) - 1) * pn), E_n)
# varianza exacta del HT bajo Poisson (independencia: sin pi_kl)
V_poisson <- sum((1 - pi_st) * statepps$counties^2 / pi_st)
cat(sprintf("  E(n) = %.2f | V(n) = %.2f (de = %.2f) | V_HT(counties) = %.4g\n",
            E_n, V_n, sqrt(V_n), V_poisson))
cat(sprintf("  P(n = 10) = %.3f | P(9 <= n <= 11) = %.3f\n",
            pn[11], sum(pn[10:12])))

cifras$poisson <- list(
  En = E_n, Vn = V_n, distN = pn, vHt = V_poisson,
  vSistematico = V_emp[1],
  pn10 = pn[11], pn9a11 = sum(pn[10:12])
)

# =============================================================================
# 7. agpps: el diseño pi PT real de Lohr con matriz de conjuntas -> SYG por
#    tres vías (a mano doble suma, a mano SYG, survey con ppsmat)
# =============================================================================
cat("== 7. agpps (SYG con matriz real) ==\n")
agpps <- lee_lohr("agpps")
n_ag <- nrow(agpps)
Pmat <- as.matrix(agpps[, paste0("JtProb_", 1:15)])
diag(Pmat) <- agpps$SelectionProb
# El archivo trae los pesos redondeados (~1e-8 relativo): se compara w*pi con 1.
comprueba("agpps: peso = 1/pi", max(abs(agpps$SamplingWeight * agpps$SelectionProb - 1)) + 1,
          1, 1e-7)

t_ht_ag <- sum(agpps$acres92 / agpps$SelectionProb)
d_ag <- agpps$acres92 / agpps$SelectionProb
V_ht_ag <- 0; V_syg_ag <- 0
for (k in seq_len(n_ag)) for (l in seq_len(n_ag)) {
  if (k == l) {
    V_ht_ag <- V_ht_ag + (1 - agpps$SelectionProb[k]) * d_ag[k]^2
  } else {
    ckl <- (Pmat[k, l] - agpps$SelectionProb[k] * agpps$SelectionProb[l]) / Pmat[k, l]
    V_ht_ag <- V_ht_ag + ckl * d_ag[k] * d_ag[l]
    if (k < l) {
      V_syg_ag <- V_syg_ag +
        (agpps$SelectionProb[k] * agpps$SelectionProb[l] - Pmat[k, l]) / Pmat[k, l] *
        (d_ag[k] - d_ag[l])^2
    }
  }
}
dis_ht <- svydesign(id = ~1, fpc = ~SelectionProb, data = agpps,
                    pps = ppsmat(Pmat), variance = "HT")
dis_yg <- svydesign(id = ~1, fpc = ~SelectionProb, data = agpps,
                    pps = ppsmat(Pmat), variance = "YG")
sv_ht <- svytotal(~acres92, dis_ht); sv_yg <- svytotal(~acres92, dis_yg)
comprueba("agpps: total a mano <-> survey", t_ht_ag, coef(sv_ht)[1])
comprueba("agpps: V_HT a mano <-> survey HT", V_ht_ag, SE(sv_ht)[1]^2)
comprueba("agpps: V_SYG a mano <-> survey YG", V_syg_ag, SE(sv_yg)[1]^2)
cat(sprintf("  t_HT = %.0f | ee HT = %.0f | ee SYG = %.0f\n",
            t_ht_ag, sqrt(V_ht_ag), sqrt(V_syg_ag)))

cifras$agpps <- list(
  n = n_ag, total = t_ht_ag, seHt = sqrt(V_ht_ag), seSyg = sqrt(V_syg_ag),
  pi = agpps$SelectionProb, pesos = agpps$SamplingWeight,
  condados = paste(agpps$county, agpps$state, sep = ", ")
)

# =============================================================================
# 8. El elefante: pi_k pequeño con y_k grande, la varianza explosiva (exacta,
#    con las fórmulas de Poisson: V = sum (1/pi - 1) y^2)
# =============================================================================
cat("== 8. varianza explosiva ==\n")
set.seed(SEMILLA)
N_e <- 20
x_e <- round(exp(rnorm(N_e, 4, 0.6)))            # tamaños entre ~20 y ~200
y_e <- round(2 * x_e * exp(rnorm(N_e, 0, 0.15))) # y proporcional a x, con ruido
# el elefante: la unidad 20 tiene x chico pero y enorme
x_e[N_e] <- min(x_e[-N_e]); y_e[N_e] <- 30 * max(y_e[-N_e])
pi_e <- inclusionprobabilities(x_e, 5)
malla <- c(0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.3, 0.5)
curva <- sapply(malla, function(p) {
  pk <- pi_e; pk[N_e] <- p
  sum((1 - pk) * y_e^2 / pk)
})
aporte <- sapply(malla, function(p) {
  pk <- pi_e; pk[N_e] <- p
  (1 - p) * y_e[N_e]^2 / p / sum((1 - pk) * y_e^2 / pk)
})
cat(sprintf("  pi del elefante segun su x: %.4f | y = %d (%.0f%% del total)\n",
            pi_e[N_e], y_e[N_e], 100 * y_e[N_e] / sum(y_e)))
cat(sprintf("  V con pi_e = 0.005: %.3g | con 0.5: %.3g (razón %.0f)\n",
            curva[1], curva[length(curva)], curva[1] / curva[length(curva)]))

cifras$elefante <- list(
  N = N_e, x = x_e, y = y_e, piBase = pi_e, piElefanteX = pi_e[N_e],
  malla = malla, curva = curva, aporte = aporte,
  totalY = sum(y_e), yElefante = y_e[N_e]
)

# =============================================================================
# 9. classpps: PPT con reemplazo en dos etapas (HH a mano <-> survey),
#    y el diseño autoponderado
# =============================================================================
cat("== 9. classpps (dos etapas) ==\n")
clases <- lee_lohr("classes")            # el marco: 15 clases con su tamaño
classpps <- lee_lohr("classpps")         # la muestra: 5 clases, ~5 alumnos c/u
K_cl <- sum(clases$class_size)
psi_cl <- clases$class_size / K_cl
n_cl <- length(unique(classpps$class))
por_clase <- do.call(rbind, lapply(split(classpps, classpps$class), function(d) {
  data.frame(clase = d$class[1], mi = nrow(d), ybar = mean(d$hours),
             Mi = clases$class_size[clases$class == d$class[1]],
             w = d$finalweight[1])
}))
por_clase$psi <- por_clase$Mi / K_cl
por_clase$that_i <- por_clase$Mi * por_clase$ybar
z_i <- por_clase$that_i / por_clase$psi
t_hh <- mean(z_i)
V_hh_cl <- var(z_i) / n_cl
# survey con los pesos del archivo (aproximación WR entre UPM)
dis_cl <- svydesign(id = ~class, weights = ~finalweight, data = classpps)
sv_cl <- svytotal(~hours, dis_cl)
comprueba("classpps: HH a mano <-> survey", t_hh, coef(sv_cl)[1])
comprueba("classpps: ee HH a mano <-> survey", sqrt(V_hh_cl), SE(sv_cl)[1])
# el peso del archivo es el de HH en dos etapas: w = (1/(n psi)) * (Mi/mi)
w_teo <- (1 / (n_cl * por_clase$psi)) * (por_clase$Mi / por_clase$mi)
comprueba("classpps: peso del archivo <-> fórmula", max(abs(w_teo - por_clase$w)), 0, 1e-2)
suma_w <- sum(classpps$finalweight)
sv_media <- svymean(~hours, dis_cl)
cat(sprintf("  t_HH = %.1f (ee %.1f) | media = %.3f (ee %.3f) | sum(w) = %.1f (K = %d)\n",
            t_hh, sqrt(V_hh_cl), coef(sv_media)[1], SE(sv_media)[1], suma_w, K_cl))

cifras$classpps <- list(
  K = K_cl, Nclases = nrow(clases), n = n_cl,
  tamanos = clases$class_size, psi = psi_cl,
  clasesMuestra = por_clase$clase, mi = por_clase$mi, Mi = por_clase$Mi,
  ybar = por_clase$ybar, thatI = por_clase$that_i, zI = z_i,
  pesos = por_clase$w,
  total = t_hh, se = sqrt(V_hh_cl),
  media = as.numeric(coef(sv_media)[1]), seMedia = as.numeric(SE(sv_media)[1]),
  sumaPesos = suma_w
)

# =============================================================================
# 10. BigLucy: el muestreo por importancia como PPT con reemplazo (exacto)
# =============================================================================
cat("== 10. BigLucy: importancia ==\n")
data(BigLucy)
t_inc <- sum(BigLucy$Income)
n_bl <- 100
v_wr <- function(psi) sum(psi * (BigLucy$Income / psi - t_inc)^2) / n_bl
psi_unif <- rep(1 / nrow(BigLucy), nrow(BigLucy))
psi_emp  <- BigLucy$Employees / sum(BigLucy$Employees)
psi_prop <- BigLucy$Income / t_inc               # la propuesta "perfecta"
V_unif <- v_wr(psi_unif); V_emp_bl <- v_wr(psi_emp); V_perf <- v_wr(psi_prop)
r_ie <- cor(BigLucy$Income, BigLucy$Employees)
cat(sprintf("  corr(Income, Employees) = %.3f\n", r_ie))
cat(sprintf("  V uniforme = %.4g | V psi~Employees = %.4g (mejora %.1fx) | V psi~y = %.3g\n",
            V_unif, V_emp_bl, V_unif / V_emp_bl, V_perf))
comprueba("BigLucy: psi ~ y da varianza 0", V_perf, 0, 1e-6)

# curva exacta V(alpha): psi mezcla del uniforme (alpha=0) a psi~Employees
# (alpha=1), y de psi~Employees al psi~y perfecto (alpha de 1 a 2)
malla_a <- seq(0, 2, by = 0.1)
curva_imp <- sapply(malla_a, function(a) {
  psi <- if (a <= 1) (1 - a) * psi_unif + a * psi_emp
         else (2 - a) * psi_emp + (a - 1) * psi_prop
  v_wr(psi)
})

cifras$importancia <- list(
  K = nrow(BigLucy), n = n_bl, total = t_inc, corr = r_ie,
  vUniforme = V_unif, vEmployees = V_emp_bl, vPerfecta = V_perf,
  mejora = V_unif / V_emp_bl,
  mallaAlpha = malla_a, curvaV = curva_imp
)

# =============================================================================
# Salida
# =============================================================================
datos <- c(list(meta = list(
  generado = "precalculo/genera_cap6.R", semilla = SEMILLA,
  replicasMc = R_mc, replicasSeleccion = B,
  rVersion = as.character(getRversion())
)), cifras)

escribe_json(datos, "cap6_datos")
cat("Hecho.\n")
