# genera_cap7.R — datos precalculados del Capítulo 7 (encuestas complejas)
#
# Ejecutar SIEMPRE con el R del framework 4.4, desde la raíz del repositorio:
#   /Library/Frameworks/R.framework/Versions/4.4-arm64/Resources/bin/Rscript precalculo/genera_cap7.R
#
# Produce  precalculo/salidas/cap7_datos.json.  Ninguna cifra del capítulo se
# escribe a mano: o sale de aquí, o de un bloque ejecutado por verifica_bloques.py.
#
# Decisión de la fase 4 (Javier): NHANES y SYC se analizan EN PARALELO en el
# módulo 7 — dos encuestas reales con estructuras distintas (2 PSU por estrato
# frente a decenas) que ilustran cosas distintas.

source("precalculo/_comun.R")
suppressPackageStartupMessages({
  library(survey)
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
# 1. Las dos encuestas: anatomía comparada
# =============================================================================
cat("== 1. anatomía de NHANES y SYC ==\n")
nh <- lee_lohr("nhanes")
sy <- lee_lohr("syc")

# NHANES: -9 es el código de faltante de Lohr; wtmec2yr = 0 son los no
# examinados (solo entrevistados). Se trabaja con adultos examinados.
nh_ad <- subset(nh, wtmec2yr > 0 & bmxbmi > 0 & ridageyr >= 20)
nh_psu <- nrow(unique(nh_ad[, c("sdmvstra", "sdmvpsu")]))
sy_psu <- nrow(unique(sy[, c("stratum", "psu")]))

cat(sprintf("  NHANES: %d filas totales, %d adultos examinados con IMC | %d estratos, %d PSU\n",
            nrow(nh), nrow(nh_ad), length(unique(nh_ad$sdmvstra)), nh_psu))
cat(sprintf("  SYC:    %d jóvenes | %d estratos, %d PSU (centros)\n",
            nrow(sy), length(unique(sy$stratum)), sy_psu))

dis_nh <- svydesign(id = ~sdmvpsu, strata = ~sdmvstra, weights = ~wtmec2yr,
                    data = nh_ad, nest = TRUE)
dis_sy <- svydesign(id = ~psu, strata = ~stratum, weights = ~finalwt,
                    data = sy, nest = TRUE)

psu_por_estrato_nh <- as.numeric(table(unique(nh_ad[, c("sdmvstra","sdmvpsu")])$sdmvstra))
psu_por_estrato_sy <- as.numeric(table(unique(sy[, c("stratum","psu")])$stratum))
cat(sprintf("  PSU por estrato — NHANES: todos %d | SYC: de %d a %d\n",
            unique(psu_por_estrato_nh), min(psu_por_estrato_sy), max(psu_por_estrato_sy)))
comprueba("NHANES: gl = PSU - estratos", degf(dis_nh),
          nh_psu - length(unique(nh_ad$sdmvstra)))
comprueba("SYC: gl = PSU - estratos", degf(dis_sy),
          sy_psu - length(unique(sy$stratum)))

cifras$encuestas <- list(
  nhanes = list(filas = nrow(nh), analizadas = nrow(nh_ad),
                estratos = length(unique(nh_ad$sdmvstra)), psu = nh_psu,
                gl = degf(dis_nh), psuPorEstrato = psu_por_estrato_nh),
  syc = list(filas = nrow(sy), analizadas = nrow(sy),
             estratos = length(unique(sy$stratum)), psu = sy_psu,
             gl = degf(dis_sy), psuPorEstrato = psu_por_estrato_sy)
)

# =============================================================================
# 2. Los pesos: distribución, suma y variabilidad
# =============================================================================
cat("== 2. pesos ==\n")
w_nh <- nh_ad$wtmec2yr; w_sy <- sy$finalwt
kish <- function(w) 1 + var(w) / mean(w)^2
cat(sprintf("  NHANES: w de %.0f a %.0f | suma = %.0f (población adulta) | Kish = %.4f\n",
            min(w_nh), max(w_nh), sum(w_nh), kish(w_nh)))
cat(sprintf("  SYC:    w de %.0f a %.0f | suma = %.0f | Kish = %.4f\n",
            min(w_sy), max(w_sy), sum(w_sy), kish(w_sy)))

hist_pesos <- function(w, nb = 30) {
  h <- hist(w, breaks = nb, plot = FALSE)
  list(centros = h$mids, conteo = h$counts)
}
cifras$pesos <- list(
  nhanes = list(min = min(w_nh), max = max(w_nh), media = mean(w_nh),
                suma = sum(w_nh), kish = kish(w_nh), hist = hist_pesos(w_nh),
                razonMaxMin = max(w_nh) / min(w_nh)),
  syc = list(min = min(w_sy), max = max(w_sy), media = mean(w_sy),
             suma = sum(w_sy), kish = kish(w_sy), hist = hist_pesos(w_sy),
             razonMaxMin = max(w_sy) / min(w_sy))
)

# =============================================================================
# 3. DEFF: descomposición en sus dos fuentes
# =============================================================================
cat("== 3. DEFF descompuesto ==\n")
deff_de <- function(dis, formula, datos, w, y) {
  m <- svymean(formula, dis, deff = TRUE)
  ee_dis <- as.numeric(SE(m))
  ee_srs <- sd(y) / sqrt(length(y))          # el "ingenuo" que reporta cualquier software
  # el deff que devuelve survey compara contra un MAS del mismo n con pesos
  list(media = as.numeric(coef(m)), ee = ee_dis, eeIngenuo = ee_srs,
       deffSurvey = as.numeric(deff(m)), deffCrudo = (ee_dis / ee_srs)^2,
       kish = kish(w), nEfectivo = length(y) / as.numeric(deff(m)))
}
d_bmi <- deff_de(dis_nh, ~bmxbmi, nh_ad, w_nh, nh_ad$bmxbmi)
d_age <- deff_de(dis_sy, ~age, sy, w_sy, sy$age)
cat(sprintf("  NHANES IMC: media %.4f | ee %.4f (ingenuo %.4f) | deff %.3f | Kish %.3f | n_ef %.0f\n",
            d_bmi$media, d_bmi$ee, d_bmi$eeIngenuo, d_bmi$deffSurvey, d_bmi$kish, d_bmi$nEfectivo))
cat(sprintf("  SYC edad:   media %.4f | ee %.4f (ingenuo %.4f) | deff %.3f | Kish %.3f | n_ef %.0f\n",
            d_age$media, d_age$ee, d_age$eeIngenuo, d_age$deffSurvey, d_age$kish, d_age$nEfectivo))
comprueba("NHANES: factor de mentira = sqrt(deff crudo)",
          d_bmi$ee / d_bmi$eeIngenuo, sqrt(d_bmi$deffCrudo))

# Descomposición acumulada sobre NHANES: qué aporta cada componente del diseño
comp <- list()
comp$srs <- (sd(nh_ad$bmxbmi) / sqrt(nrow(nh_ad)))^2
d_solo_w <- svydesign(id = ~1, weights = ~wtmec2yr, data = nh_ad)
comp$pesos <- as.numeric(SE(svymean(~bmxbmi, d_solo_w)))^2
d_w_estr <- svydesign(id = ~1, strata = ~sdmvstra, weights = ~wtmec2yr, data = nh_ad)
comp$estratos <- as.numeric(SE(svymean(~bmxbmi, d_w_estr)))^2
comp$completo <- d_bmi$ee^2
cat(sprintf("  V acumulada: SRS %.5f -> +pesos %.5f -> +estratos %.5f -> +conglomerados %.5f\n",
            comp$srs, comp$pesos, comp$estratos, comp$completo))
cat(sprintf("  deff acumulado: 1.00 -> %.2f -> %.2f -> %.2f\n",
            comp$pesos/comp$srs, comp$estratos/comp$srs, comp$completo/comp$srs))
# HALLAZGO: la descomposición NO es monótona. Los estratos BAJAN la varianza
# (1.73 -> 1.71) y los conglomerados la cuadruplican. El deff acumulado final
# (6.92) tampoco iguala al que reporta survey (7.12): survey compara contra un
# MAS CON los mismos pesos, no contra el MAS ideal. Ambas cosas se declaran en
# el material en vez de esconderlas.
if (comp$estratos > comp$pesos) stop("Los estratos deberían no aumentar la varianza")

cifras$deff <- list(
  nhanes = d_bmi, syc = d_age,
  descomposicion = list(
    etiquetas = c("MAS ideal", "+ pesos desiguales", "+ estratos", "+ conglomerados"),
    varianzas = c(comp$srs, comp$pesos, comp$estratos, comp$completo),
    deffs = c(1, comp$pesos/comp$srs, comp$estratos/comp$srs, comp$completo/comp$srs),
    n = nrow(nh_ad))
)

# =============================================================================
# 4. Linealización de Taylor: una razón, por dos vías
# =============================================================================
cat("== 4. linealización ==\n")
# Razón sobre SYC: proporción de tiempo... usamos edad/numarr como razón
# didáctica; mejor: razón de IMC a peso corporal en NHANES (no lineal de verdad).
r_sv <- svyratio(~bmxwt, ~bmxht, dis_nh)
R_hat <- as.numeric(coef(r_sv)); ee_sv <- as.numeric(SE(r_sv))
# A mano por linealización: u_k = (y_k - R x_k)/X_hat, y V(R) = V(total de u)
X_hat <- sum(w_nh * nh_ad$bmxht)
u <- (nh_ad$bmxwt - R_hat * nh_ad$bmxht) / X_hat
nh_ad$u_lin <- u
dis_u <- svydesign(id = ~sdmvpsu, strata = ~sdmvstra, weights = ~wtmec2yr,
                   data = nh_ad, nest = TRUE)
ee_lin <- as.numeric(SE(svytotal(~u_lin, dis_u)))
comprueba("razón: ee de svyratio <-> linealización a mano", ee_sv, ee_lin, 1e-6)
cat(sprintf("  razón peso/altura = %.6f (ee %.6f) | linealizada %.6f\n", R_hat, ee_sv, ee_lin))

# El término que se desprecia: (R_hat - R)*(X_hat - X)/X — se mide su tamaño
cifras$linealizacion <- list(
  R = R_hat, ee = ee_sv, eeLineal = ee_lin, Xhat = X_hat,
  uMin = min(u), uMax = max(u), uMedia = mean(u),
  histU = hist_pesos(u * 1e6, 30)   # escalado para que el histograma se lea
)

# =============================================================================
# 5. Replicación: jackknife a mano, JKn, BRR y bootstrap
# =============================================================================
cat("== 5. replicación ==\n")
theta <- d_bmi$media
est_nh <- unique(nh_ad[, c("sdmvstra", "sdmvpsu")])
reps <- numeric(nrow(est_nh))
for (r in seq_len(nrow(est_nh))) {
  h <- est_nh$sdmvstra[r]; p <- est_nh$sdmvpsu[r]
  w2 <- w_nh
  fuera <- nh_ad$sdmvstra == h & nh_ad$sdmvpsu == p
  n_h <- sum(est_nh$sdmvstra == h)
  w2[fuera] <- 0
  w2[nh_ad$sdmvstra == h & !fuera] <- w2[nh_ad$sdmvstra == h & !fuera] * n_h / (n_h - 1)
  reps[r] <- weighted.mean(nh_ad$bmxbmi, w2)
}
v_jk <- 0
for (h in unique(est_nh$sdmvstra)) {
  idx <- which(est_nh$sdmvstra == h)
  v_jk <- v_jk + (length(idx) - 1) / length(idx) * sum((reps[idx] - theta)^2)
}
dis_jkn <- as.svrepdesign(dis_nh, type = "JKn")
ee_jkn <- as.numeric(SE(svymean(~bmxbmi, dis_jkn)))
comprueba("jackknife a mano <-> survey JKn", sqrt(v_jk), ee_jkn, 1e-6)

dis_brr <- as.svrepdesign(dis_nh, type = "BRR")
ee_brr <- as.numeric(SE(svymean(~bmxbmi, dis_brr)))
set.seed(SEMILLA)
dis_boot <- as.svrepdesign(dis_nh, type = "subbootstrap", replicates = 500)
ee_boot <- as.numeric(SE(svymean(~bmxbmi, dis_boot)))
cat(sprintf("  linealización %.6f | jackknife %.6f | BRR %.6f | bootstrap %.6f\n",
            d_bmi$ee, ee_jkn, ee_brr, ee_boot))
cat(sprintf("  réplicas: JKn %d | BRR %d | bootstrap %d\n",
            ncol(dis_jkn$repweights$weights), ncol(dis_brr$repweights$weights), 500))

# Los cuatro métodos sobre la MEDIANA, donde la linealización no aplica directo
med_lin <- svyquantile(~bmxbmi, dis_nh, 0.5, ci = TRUE)
med_jkn <- svyquantile(~bmxbmi, dis_jkn, 0.5, ci = TRUE)
cat(sprintf("  mediana del IMC: %.3f | ee linealizado %.4f | ee jackknife %.4f\n",
            as.numeric(coef(med_lin)), as.numeric(SE(med_lin)), as.numeric(SE(med_jkn))))

cifras$replicacion <- list(
  metodos = c("linealización", "jackknife (JKn)", "BRR", "bootstrap"),
  ee = c(d_bmi$ee, ee_jkn, ee_brr, ee_boot),
  replicas = c(NA, ncol(dis_jkn$repweights$weights), ncol(dis_brr$repweights$weights), 500),
  theta = theta,
  jkReplicas = reps, jkEstratos = est_nh$sdmvstra, jkPsu = est_nh$sdmvpsu,
  medianaValor = as.numeric(coef(med_lin)),
  medianaEeLin = as.numeric(SE(med_lin)), medianaEeJk = as.numeric(SE(med_jkn))
)

# =============================================================================
# 6. Calibración: post-estratificación y raking (IPFP paso a paso)
# =============================================================================
cat("== 6. calibración y raking ==\n")
nh_ad$sexo <- factor(nh_ad$riagendr, levels = c(1, 2), labels = c("hombre", "mujer"))
nh_ad$edadg <- cut(nh_ad$ridageyr, c(19, 39, 59, 200), labels = c("20-39", "40-59", "60+"))
dis_nh2 <- svydesign(id = ~sdmvpsu, strata = ~sdmvstra, weights = ~wtmec2yr,
                     data = nh_ad, nest = TRUE)

tabla_muestral <- svytable(~sexo + edadg, dis_nh2)
cat("  tabla ponderada (millones):\n")
print(round(tabla_muestral / 1e6, 3))

# Márgenes objetivo: se supone un marco externo (censo) con una estructura de
# edad algo más vieja y 51/49 en sexo. Se raking a esos márgenes.
total_pob <- sum(tabla_muestral)
marg_sexo <- c(hombre = 0.49, mujer = 0.51) * total_pob
marg_edad <- c(`20-39` = 0.34, `40-59` = 0.34, `60+` = 0.32) * total_pob

# IPFP a mano, guardando cada iteración
A <- as.matrix(tabla_muestral)
iters <- list(list(iter = 0, tabla = A,
                   errSexo = max(abs(rowSums(A) - marg_sexo) / marg_sexo),
                   errEdad = max(abs(colSums(A) - marg_edad) / marg_edad)))
for (it in 1:8) {
  A <- A * (marg_sexo / rowSums(A))            # ajustar filas (sexo)
  A <- t(t(A) * (marg_edad / colSums(A)))      # ajustar columnas (edad)
  iters[[it + 1]] <- list(iter = it, tabla = A,
                          errSexo = max(abs(rowSums(A) - marg_sexo) / marg_sexo),
                          errEdad = max(abs(colSums(A) - marg_edad) / marg_edad))
}
cat(sprintf("  IPFP: error máximo tras 1 iter = %.2e | tras 8 = %.2e\n",
            max(iters[[2]]$errSexo, iters[[2]]$errEdad),
            max(iters[[9]]$errSexo, iters[[9]]$errEdad)))

# El mismo raking con survey, y el efecto sobre la estimación
dis_raked <- rake(dis_nh2,
                  list(~sexo, ~edadg),
                  list(data.frame(sexo = names(marg_sexo), Freq = as.numeric(marg_sexo)),
                       data.frame(edadg = names(marg_edad), Freq = as.numeric(marg_edad))))
m_raked <- svymean(~bmxbmi, dis_raked)
cat(sprintf("  IMC antes del raking: %.4f (ee %.4f) | después: %.4f (ee %.4f)\n",
            d_bmi$media, d_bmi$ee, as.numeric(coef(m_raked)), as.numeric(SE(m_raked))))
comprueba("raking: la tabla de survey coincide con el IPFP a mano",
          max(abs(as.matrix(svytable(~sexo + edadg, dis_raked)) - A)) / total_pob, 0, 1e-6)

# Post-estratificación como caso particular (una sola dimensión)
dis_post <- postStratify(dis_nh2, ~sexo,
                         data.frame(sexo = names(marg_sexo), Freq = as.numeric(marg_sexo)))
m_post <- svymean(~bmxbmi, dis_post)
cat(sprintf("  post-estratificado por sexo: %.4f (ee %.4f)\n",
            as.numeric(coef(m_post)), as.numeric(SE(m_post))))

# jsonlite no serializa objetos de clase `table`, y `as.matrix()` sobre una
# tabla NO se la quita: hay que reconstruir la matriz numérica desde cero.
# (Las matrices viajan como array de FILAS, que es lo que el JS espera leer.)
plana <- function(m) matrix(as.numeric(m), nrow = nrow(m))

cifras$calibracion <- list(
  filas = rownames(A), columnas = colnames(A),
  tablaInicial = plana(tabla_muestral), tablaFinal = plana(A),
  margSexo = as.numeric(marg_sexo), margEdad = as.numeric(marg_edad),
  totalPob = total_pob,
  iteraciones = lapply(iters, function(x) list(iter = x$iter, tabla = plana(x$tabla),
                                               err = max(x$errSexo, x$errEdad))),
  imcAntes = d_bmi$media, eeAntes = d_bmi$ee,
  imcRaked = as.numeric(coef(m_raked)), eeRaked = as.numeric(SE(m_raked)),
  imcPost = as.numeric(coef(m_post)), eePost = as.numeric(SE(m_post))
)

# =============================================================================
# 7. El error más caro: cobertura empírica de los IC ingenuos
# =============================================================================
cat("== 7. cobertura empírica ==\n")
# Población sintética con estructura de conglomerados conocida: 200 UPM x 40
set.seed(SEMILLA)
NI <- 200; Mi <- 40; rho_obj <- 0.15
efecto <- rnorm(NI, 0, sqrt(rho_obj))
pobl <- data.frame(
  upm = rep(1:NI, each = Mi),
  y = rep(efecto, each = Mi) + rnorm(NI * Mi, 0, sqrt(1 - rho_obj))
)
mu <- mean(pobl$y)
R7 <- 2000; n_upm <- 20
cub_ing <- 0; cub_dis <- 0
anchos <- matrix(NA_real_, R7, 2)
idx_upm <- split(seq_len(nrow(pobl)), pobl$upm)
for (r in seq_len(R7)) {
  ups <- sample(NI, n_upm)
  filas <- unlist(idx_upm[ups], use.names = FALSE)
  y <- pobl$y[filas]
  # ingenuo: MAS de n_upm*Mi observaciones
  ee_i <- sd(y) / sqrt(length(y))
  # correcto: conglomerados, varianza entre medias de UPM
  medias <- sapply(idx_upm[ups], function(i) mean(pobl$y[i]))
  ee_d <- sqrt((1 - n_upm / NI) * var(medias) / n_upm)
  ybar <- mean(y)
  cub_ing <- cub_ing + (abs(ybar - mu) <= 1.96 * ee_i)
  cub_dis <- cub_dis + (abs(ybar - mu) <= qt(0.975, n_upm - 1) * ee_d)
  anchos[r, ] <- c(2 * 1.96 * ee_i, 2 * qt(0.975, n_upm - 1) * ee_d)
}
cat(sprintf("  cobertura: IC ingenuo %.3f | IC del diseño %.3f (nominal 0.95)\n",
            cub_ing / R7, cub_dis / R7))
cat(sprintf("  ancho medio: ingenuo %.4f | diseño %.4f (razón %.2f)\n",
            mean(anchos[, 1]), mean(anchos[, 2]), mean(anchos[, 2]) / mean(anchos[, 1])))

cifras$cobertura <- list(
  replicas = R7, NI = NI, Mi = Mi, nUpm = n_upm, rho = rho_obj,
  cobIngenuo = cub_ing / R7, cobDiseno = cub_dis / R7,
  anchoIngenuo = mean(anchos[, 1]), anchoDiseno = mean(anchos[, 2]),
  deffTeorico = 1 + (Mi - 1) * rho_obj
)

# =============================================================================
# 8. Recorte de pesos: el intercambio sesgo-varianza, exacto sobre NHANES
# =============================================================================
cat("== 8. recorte de pesos ==\n")
cuantiles <- c(1, 0.999, 0.99, 0.975, 0.95, 0.90, 0.80)
recorte <- lapply(cuantiles, function(q) {
  tope <- quantile(w_nh, q)
  w2 <- pmin(w_nh, tope)
  w2 <- w2 * sum(w_nh) / sum(w2)              # reescalar para conservar el total
  nh_ad$w_rec <- w2
  d2 <- svydesign(id = ~sdmvpsu, strata = ~sdmvstra, weights = ~w_rec,
                  data = nh_ad, nest = TRUE)
  m2 <- svymean(~bmxbmi, d2)
  list(q = q, tope = as.numeric(tope), afectados = sum(w_nh > tope),
       media = as.numeric(coef(m2)), ee = as.numeric(SE(m2)),
       kish = kish(w2), sesgoAparente = as.numeric(coef(m2)) - d_bmi$media)
})
for (x in recorte) {
  cat(sprintf("  q=%.3f tope %8.0f: %4d afectados | media %.4f (dif %+.4f) | ee %.4f | Kish %.3f\n",
              x$q, x$tope, x$afectados, x$media, x$sesgoAparente, x$ee, x$kish))
}
cifras$recorte <- recorte

# =============================================================================
# Salida
# =============================================================================
datos <- c(list(meta = list(
  generado = "precalculo/genera_cap7.R", semilla = SEMILLA,
  replicasCobertura = R7, replicasBootstrap = 500,
  rVersion = as.character(getRversion())
)), cifras)

escribe_json(datos, "cap7_datos")
cat("Hecho.\n")
