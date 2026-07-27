# genera_cap2.R — datos precalculados del Capítulo 2 (diseño muestral, MAS y sistemático)
#
# Ejecutar SIEMPRE con el R del framework 4.4, desde la raíz del repositorio:
#   /Library/Frameworks/R.framework/Versions/4.4-arm64/Resources/bin/Rscript precalculo/genera_cap2.R
#
# Produce  precalculo/salidas/cap2_datos.json  (lo que se incrusta en el capítulo)
# y deja por pantalla las cifras que se citan en el texto. Ninguna cifra del
# capítulo se escribe a mano: o sale de aquí, o sale de un bloque de código
# ejecutado por verifica_bloques.py.

source("precalculo/_comun.R")
suppressPackageStartupMessages(library(survey))

set.seed(SEMILLA)
cifras <- list()   # se va llenando con todo lo que el texto cita

# =============================================================================
# 1. Población pequeña: N = 5, n = 2. El espacio de muestras completo.
# =============================================================================
# Cinco condados. y = superficie sembrada (miles de acres, la variable de
# interés, desconocida antes de muestrear); x = número de granjas del censo
# anterior (en cientos, conocida para toda la población: es la que permite
# diseñar con probabilidades desiguales).
peq_y <- c(14, 18, 27, 33, 58)
peq_x <- c(1, 1, 2, 2, 4)
N_peq <- length(peq_y)
n_peq <- 2
peq_t <- sum(peq_y)
peq_media <- mean(peq_y)
peq_S2 <- var(peq_y)

# Las 10 muestras posibles de tamaño 2
combos <- t(combn(N_peq, n_peq))
n_muestras <- nrow(combos)

#' Dado un vector p(s) sobre las filas de `combos`, devuelve las pi_k, la
#' matriz pi_kl y las propiedades del estimador HT y de N*media_muestral.
#' Todo exacto: se recorre el espacio de muestras entero, no se simula.
analiza_diseno <- function(ps, etiqueta) {
  stopifnot(abs(sum(ps) - 1) < 1e-12, all(ps >= 0))

  pi_k <- numeric(N_peq)
  for (k in seq_len(N_peq)) {
    pi_k[k] <- sum(ps[apply(combos, 1, function(s) k %in% s)])
  }
  pi_kl <- matrix(0, N_peq, N_peq)
  for (i in seq_len(n_muestras)) {
    a <- combos[i, 1]; b <- combos[i, 2]
    pi_kl[a, b] <- pi_kl[a, b] + ps[i]
    pi_kl[b, a] <- pi_kl[a, b]
  }
  diag(pi_kl) <- pi_k

  # Estimadores sobre cada muestra posible
  t_ht  <- apply(combos, 1, function(s) sum(peq_y[s] / pi_k[s]))
  t_exp <- apply(combos, 1, function(s) N_peq * mean(peq_y[s]))   # N * media muestral

  e_ht  <- sum(ps * t_ht)
  e_exp <- sum(ps * t_exp)
  v_ht  <- sum(ps * (t_ht  - e_ht)^2)
  v_exp <- sum(ps * (t_exp - e_exp)^2)

  # Varianza de HT por la forma de Sen-Yates-Grundy (solo válida a n fijo):
  #   V = -1/2 sum_k sum_{l != k} (pi_kl - pi_k pi_l) (y_k/pi_k - y_l/pi_l)^2
  d <- peq_y / pi_k
  syg <- 0
  for (k in seq_len(N_peq)) {
    for (l in seq_len(N_peq)) {
      if (k != l) syg <- syg + (pi_kl[k, l] - pi_k[k] * pi_k[l]) * (d[k] - d[l])^2
    }
  }
  syg <- -0.5 * syg

  cat(sprintf("  [%s] E(t_HT) = %.4f (t = %.0f)  V(t_HT) = %.4f  SYG = %.4f  dif = %.2e\n",
              etiqueta, e_ht, peq_t, v_ht, syg, abs(v_ht - syg)))

  list(
    etiqueta = etiqueta,
    ps = ps,
    pi_k = pi_k,
    pi_kl = pi_kl,
    sumaPi = sum(pi_k),
    tHT = t_ht,
    tExpansion = t_exp,
    esperanzaHT = e_ht,
    esperanzaExpansion = e_exp,
    varianzaHT = v_ht,
    varianzaExpansion = v_exp,
    sesgoExpansion = e_exp - peq_t,
    syg = syg
  )
}

cat("\n== Diseños sobre la población de 5 condados ==\n")

# (A) MAS sin reemplazo: las 10 muestras equiprobables
ps_mas <- rep(1 / n_muestras, n_muestras)
dis_mas <- analiza_diseno(ps_mas, "MAS")

# (B) Estratificado casero: estrato 1 = {1,2,3}, estrato 2 = {4,5}, uno de cada.
#     Solo 6 de las 10 muestras tienen probabilidad positiva; las 4 restantes
#     (dos unidades del mismo estrato) son imposibles, y ahí pi_kl = 0.
ps_est <- apply(combos, 1, function(s) {
  if (sum(s <= 3) == 1 && sum(s >= 4) == 1) 1 / 6 else 0
})
dis_est <- analiza_diseno(ps_est, "Estratificado")

# (C) Probabilidades desiguales: p(s) proporcional a la suma de tamaños de las
#     dos unidades de la muestra. A n = 2 cada par ES una muestra, así que
#     pi_kl = p(s) y se lee directo de la tabla.
ps_ppt <- apply(combos, 1, function(s) sum(peq_x[s]))
ps_ppt <- ps_ppt / sum(ps_ppt)
dis_ppt <- analiza_diseno(ps_ppt, "Desigual (p(s) ∝ x_k + x_l)")

cifras$peq <- list(
  y = peq_y, x = peq_x, N = N_peq, n = n_peq,
  total = peq_t, media = peq_media, S2 = peq_S2,
  piMAS = dis_mas$pi_k[1], piklMAS = dis_mas$pi_kl[1, 2],
  sesgoExpansionPPT = dis_ppt$sesgoExpansion,
  varHTmas = dis_mas$varianzaHT, varHTppt = dis_ppt$varianzaHT,
  varHTest = dis_est$varianzaHT
)

# Comprobaciones que el texto afirma
stopifnot(abs(dis_mas$pi_k - n_peq / N_peq) < 1e-12)
stopifnot(abs(dis_mas$pi_kl[1, 2] - n_peq * (n_peq - 1) / (N_peq * (N_peq - 1))) < 1e-12)
stopifnot(abs(dis_est$pi_kl[1, 2]) < 1e-12)          # mismo estrato => pi_kl = 0
stopifnot(abs(dis_ppt$pi_kl[1, 2] - ps_ppt[1]) < 1e-12)
cat("  comprobado: pi_k = n/N y pi_kl = n(n-1)/N(N-1) en MAS; pi_kl = 0 dentro del estrato\n")

# Varianza del MAS por la fórmula cerrada, como segunda vía
v_mas_cerrada <- N_peq^2 * (1 - n_peq / N_peq) * peq_S2 / n_peq
cat(sprintf("  V(t_HT) MAS: espacio de muestras = %.4f | fórmula cerrada = %.4f | dif = %.2e\n",
            dis_mas$varianzaHT, v_mas_cerrada, abs(dis_mas$varianzaHT - v_mas_cerrada)))
stopifnot(abs(dis_mas$varianzaHT - v_mas_cerrada) < 1e-8)

# =============================================================================
# 2. La población del curso: agpop
# =============================================================================
cat("\n== Población agpop ==\n")
agpop <- lee_lohr("agpop")
n_faltantes <- sum(agpop$acres92 < 0)
pob <- agpop[agpop$acres92 >= 0, ]     # -99 es el código de faltante de Lohr
y_pob <- pob$acres92
N <- length(y_pob)
media_pob <- mean(y_pob)
S2_pob <- var(y_pob)
S_pob <- sd(y_pob)

cat(sprintf("  condados en el marco: %d | con -99 (faltante): %d | población usable: %d\n",
            nrow(agpop), n_faltantes, N))
cat(sprintf("  media = %.2f | S = %.2f | CV = %.4f | total = %.0f\n",
            media_pob, S_pob, S_pob / media_pob, sum(y_pob)))

cifras$agpop <- list(
  filas = nrow(agpop), faltantes = n_faltantes, N = N,
  media = media_pob, S2 = S2_pob, S = S_pob, cv = S_pob / media_pob,
  total = sum(y_pob), min = min(y_pob), max = max(y_pob), mediana = median(y_pob)
)

# --- 2.1 Distribución de muestreo de la media bajo MAS ------------------------
R_REP <- 10000
tamanos <- c(10, 25, 50, 100, 200, 300, 500, 1000)

histograma <- function(x, nbins = 45) {
  x <- x[is.finite(x)]
  rango <- range(x)
  cortes <- seq(rango[1], rango[2], length.out = nbins + 1)
  conteo <- as.integer(table(cut(x, breaks = cortes, include.lowest = TRUE)))
  list(centros = (head(cortes, -1) + tail(cortes, -1)) / 2,
       conteo  = conteo,
       ancho   = diff(cortes)[1])
}

set.seed(SEMILLA)
distribucion <- lapply(tamanos, function(n) {
  medias <- replicate(R_REP, mean(y_pob[sample.int(N, n)]))
  v_teo_fpc <- (1 - n / N) * S2_pob / n
  v_teo_sin <- S2_pob / n
  list(
    n = n,
    media = mean(medias),
    sd = sd(medias),
    varEmpirica = var(medias),
    varTeoricaFpc = v_teo_fpc,
    varTeoricaSinFpc = v_teo_sin,
    eeTeorico = sqrt(v_teo_fpc),
    fpc = 1 - n / N,
    hist = histograma(medias),
    asimetria = mean((medias - mean(medias))^3) / sd(medias)^3
  )
})
names(distribucion) <- paste0("n", tamanos)

cat("\n  distribución de muestreo de la media (", R_REP, " réplicas):\n", sep = "")
for (d in distribucion) {
  cat(sprintf("   n = %4d  media = %9.1f (verdad %9.1f)  DE emp = %8.1f  DE teo = %8.1f  razón = %.4f\n",
              d$n, d$media, media_pob, sqrt(d$varEmpirica), d$eeTeorico,
              d$varEmpirica / d$varTeoricaFpc))
}

# --- 2.2 Cobertura empírica del intervalo de confianza -----------------------
# Para cada n: se construye el IC del 95 % de dos maneras, con fpc y sin fpc,
# y se cuenta cuántas veces atrapa la media poblacional verdadera.
set.seed(SEMILLA + 1)
z95 <- qnorm(0.975)
cobertura <- lapply(tamanos, function(n) {
  aciertos_fpc <- 0
  aciertos_sin <- 0
  anchos_fpc <- numeric(R_REP)
  guarda <- matrix(NA_real_, nrow = 100, ncol = 3)   # los 100 primeros IC, para dibujarlos
  for (r in seq_len(R_REP)) {
    s <- y_pob[sample.int(N, n)]
    m <- mean(s); v <- var(s)
    ee_fpc <- sqrt((1 - n / N) * v / n)
    ee_sin <- sqrt(v / n)
    li <- m - z95 * ee_fpc; ls <- m + z95 * ee_fpc
    anchos_fpc[r] <- ls - li
    if (li <= media_pob && media_pob <= ls) aciertos_fpc <- aciertos_fpc + 1
    if (m - z95 * ee_sin <= media_pob && media_pob <= m + z95 * ee_sin) aciertos_sin <- aciertos_sin + 1
    if (r <= 100) guarda[r, ] <- c(m, li, ls)
  }
  list(n = n,
       coberturaFpc = aciertos_fpc / R_REP,
       coberturaSinFpc = aciertos_sin / R_REP,
       anchoMedio = mean(anchos_fpc),
       primeros = list(media = guarda[, 1], li = guarda[, 2], ls = guarda[, 3]))
})
names(cobertura) <- paste0("n", tamanos)

cat("\n  cobertura empírica del IC del 95 % (", R_REP, " réplicas):\n", sep = "")
for (cb in cobertura) {
  cat(sprintf("   n = %4d  con fpc = %.3f  sin fpc = %.3f  ancho medio = %.0f\n",
              cb$n, cb$coberturaFpc, cb$coberturaSinFpc, cb$anchoMedio))
}

# =============================================================================
# 3. Diseño Bernoulli: el tamaño de muestra es aleatorio
# =============================================================================
cat("\n== Diseño Bernoulli sobre agpop ==\n")
pis <- c(0.02, 0.05, 0.10, 0.20)
R_BE <- 5000
set.seed(SEMILLA + 2)
bernoulli <- lapply(pis, function(pi0) {
  tam <- integer(R_BE); tht <- numeric(R_BE); thajek <- numeric(R_BE)
  for (r in seq_len(R_BE)) {
    dentro <- runif(N) < pi0
    ns <- sum(dentro)
    tam[r] <- ns
    tht[r] <- sum(y_pob[dentro]) / pi0                  # Horvitz-Thompson
    thajek[r] <- if (ns > 0) N * mean(y_pob[dentro]) else NA_real_   # Hájek
  }
  total_verdadero <- sum(y_pob)
  list(
    pi = pi0,
    nEsperado = N * pi0,
    sdTamano = sd(tam),
    sdTamanoTeorica = sqrt(N * pi0 * (1 - pi0)),
    histTamano = histograma(tam, 40),
    cvHT = sd(tht) / total_verdadero,
    cvHajek = sd(thajek, na.rm = TRUE) / total_verdadero,
    sesgoRelHT = (mean(tht) - total_verdadero) / total_verdadero,
    sesgoRelHajek = (mean(thajek, na.rm = TRUE) - total_verdadero) / total_verdadero,
    histHT = histograma(tht / 1e6, 40),
    histHajek = histograma(thajek / 1e6, 40)
  )
})
names(bernoulli) <- paste0("pi", sub("0\\.", "", format(pis)))

for (b in bernoulli) {
  cat(sprintf(paste0("   pi = %.2f  E(n) = %6.1f  DE(n) emp = %5.2f teo = %5.2f | ",
                     "CV(HT) = %.4f  CV(Hájek) = %.4f | sesgo rel. HT = %+.5f  Hájek = %+.5f\n"),
              b$pi, b$nEsperado, b$sdTamano, b$sdTamanoTeorica, b$cvHT, b$cvHajek,
              b$sesgoRelHT, b$sesgoRelHajek))
}

# =============================================================================
# 4. Muestreo sistemático sobre una población con periodicidad
# =============================================================================
cat("\n== Sistemático sobre población periódica ==\n")
# 120 registros ordenados por mes durante 10 años: la lista tiene un ciclo de 12.
set.seed(SEMILLA)   # la misma semilla que usa el bloque de código del capítulo:
                    # así la población del simulador y la del bloque son idénticas
N_per <- 120
periodo <- 12
y_per <- 100 + 25 * sin(2 * pi * seq_len(N_per) / periodo) + rnorm(N_per, 0, 6)
media_per <- mean(y_per)
S2_per <- var(y_per)

tam_per <- c(4, 5, 6, 8, 10, 12, 15, 20, 24)   # divisores de 120
sistematico <- lapply(tam_per, function(n) {
  k <- N_per / n
  # Las k muestras sistemáticas posibles, una por arranque aleatorio r = 1..k
  medias <- sapply(seq_len(k), function(r) mean(y_per[seq(r, N_per, by = k)]))
  v_sis <- mean((medias - media_per)^2)              # varianza exacta: p(s) = 1/k
  v_mas <- (1 - n / N_per) * S2_per / n
  list(n = n, k = k, mediasArranque = medias,
       varSistematico = v_sis, varMAS = v_mas,
       deff = v_sis / v_mas,
       periodicoK = (k %% periodo == 0))
})
names(sistematico) <- paste0("n", tam_per)

for (s in sistematico) {
  cat(sprintf("   n = %2d  k = %2d  V_sis = %8.3f  V_MAS = %8.3f  DEFF = %7.3f%s\n",
              s$n, s$k, s$varSistematico, s$varMAS, s$deff,
              if (s$periodicoK) "   <-- k múltiplo del periodo" else ""))
}

cifras$periodica <- list(N = N_per, periodo = periodo, media = media_per, S2 = S2_per,
                         deffPeor = max(sapply(sistematico, function(s) s$deff)),
                         deffMejor = min(sapply(sistematico, function(s) s$deff)))

# =============================================================================
# 5. MAS frente a sistemático sobre agpop, con y sin ordenar
# =============================================================================
cat("\n== MAS vs sistemático sobre agpop (n = 300) ==\n")
n_comp <- 300
k_comp <- floor(N / n_comp)     # 10: el sistemático toma 1 de cada 10

# El sistemático 1-en-k solo tiene k muestras posibles, una por arranque, todas
# con probabilidad 1/k. Su varianza NO se simula: se calcula exactamente
# recorriendo los k arranques. Simular aquí solo añadiría ruido de Monte Carlo a
# una cantidad que se conoce en forma cerrada.
medias_sistematicas <- function(y, k) {
  sapply(seq_len(k), function(r) mean(y[seq(r, length(y), by = k)]))
}

set.seed(SEMILLA + 4)
R_COMP <- 10000
y_orden_original <- y_pob                                   # como viene el archivo
# Ordenado por la auxiliar acres87 (correlación 0,996 con acres92). Los 15
# condados con acres87 = -99 son faltantes, no ceros: van al final.
y_ordenado <- y_pob[order(replace(pob$acres87, pob$acres87 < 0, NA), na.last = TRUE)]

# Orden patológico: se coloca la lista de modo que el TAMAÑO dependa de la
# posición dentro del ciclo de longitud k. La ranura 1 de cada ciclo recibe los
# condados más grandes, la ranura 2 los siguientes, y así. No es un capricho: es
# lo que pasa cuando una lista de viviendas trae la de esquina —siempre la más
# grande— cada k puestos, o cuando una nómina va ordenada por cargo dentro de
# cada departamento de k personas. El arranque aleatorio r elige la ranura, y
# con ella el tramo de la población entera que se va a observar.
idx_desc <- order(pob$acres87, decreasing = TRUE)
y_patologico <- numeric(N)
pos_rango <- 1
for (j in seq_len(k_comp)) {
  ranuras <- seq(j, N, by = k_comp)
  m <- length(ranuras)
  y_patologico[ranuras] <- y_pob[idx_desc[pos_rango:(pos_rango + m - 1)]]
  pos_rango <- pos_rango + m
}
stopifnot(pos_rango - 1 == N, sort(y_patologico) == sort(y_pob))

comparacion <- list()
for (nombre in c("original", "ordenado", "patologico")) {
  y_use <- switch(nombre, original = y_orden_original,
                  ordenado = y_ordenado, patologico = y_patologico)
  # MAS: varianza exacta por fórmula cerrada; las réplicas son solo para dibujar
  # el histograma y para comprobar que la fórmula describe lo que pasa.
  medias_mas <- replicate(R_COMP, mean(y_use[sample.int(N, n_comp)]))
  v_mas_exacta <- (1 - n_comp / N) * S2_pob / n_comp
  # Sistemático: varianza exacta sobre los k arranques posibles
  medias_sis <- medias_sistematicas(y_use, k_comp)
  v_sis_exacta <- mean((medias_sis - media_pob)^2)

  comparacion[[nombre]] <- list(
    orden = nombre,
    varMASexacta = v_mas_exacta,
    varMASempirica = var(medias_mas),
    varSistematico = v_sis_exacta,
    deff = v_sis_exacta / v_mas_exacta,
    mediasArranque = medias_sis,
    sesgoMAS = mean(medias_mas) - media_pob,
    histMAS = histograma(medias_mas / 1000, 45)
  )
  cat(sprintf("   orden %-12s V_MAS = %.4e (emp %.4e)  V_sis = %.4e  DEFF = %8.3f\n",
              nombre, v_mas_exacta, var(medias_mas), v_sis_exacta, v_sis_exacta / v_mas_exacta))
}
cat(sprintf("   (el sistemático 1-en-%d solo tiene %d muestras posibles: su varianza es exacta)\n",
            k_comp, k_comp))

# =============================================================================
# 6. La muestra agsrs de Lohr: la que se analiza en los bloques de código
# =============================================================================
cat("\n== agsrs (la muestra publicada por Lohr, n = 300) ==\n")
agsrs <- lee_lohr("agsrs")
n_srs <- nrow(agsrs)
N_marco <- nrow(agpop)          # Lohr usa el marco completo, 3078
media_srs <- mean(agsrs$acres92)
s2_srs <- var(agsrs$acres92)
ee_srs <- sqrt((1 - n_srs / N_marco) * s2_srs / n_srs)

dis <- svydesign(id = ~1, fpc = rep(N_marco, n_srs), data = agsrs)
sm <- svymean(~acres92, dis)
st <- svytotal(~acres92, dis)

cat(sprintf("  a mano:  media = %.2f  EE = %.4f\n", media_srs, ee_srs))
cat(sprintf("  survey:  media = %.2f  EE = %.4f  | dif relativa = %.2e\n",
            coef(sm), SE(sm), abs(SE(sm) - ee_srs) / ee_srs))
stopifnot(abs(SE(sm) - ee_srs) / ee_srs < 1e-10)

ic <- c(media_srs - qt(0.975, n_srs - 1) * ee_srs, media_srs + qt(0.975, n_srs - 1) * ee_srs)
cifras$agsrs <- list(
  n = n_srs, Nmarco = N_marco, media = media_srs, s = sqrt(s2_srs), s2 = s2_srs,
  ee = ee_srs, eeSurvey = as.numeric(SE(sm)),
  total = as.numeric(coef(st)), eeTotal = as.numeric(SE(st)),
  ic95li = ic[1], ic95ls = ic[2],
  eeSinFpc = sqrt(s2_srs / n_srs),
  fpc = 1 - n_srs / N_marco
)
cat(sprintf("  IC 95%% (t, %d gl) = [%.2f, %.2f]\n", n_srs - 1, ic[1], ic[2]))
cat(sprintf("  total = %.0f  EE = %.0f\n", coef(st), SE(st)))

# =============================================================================
# 7. Tamaño de muestra: la curva que dibuja la calculadora
# =============================================================================
# La calculadora del capítulo hace la cuenta en el navegador; aquí se dejan los
# valores de referencia con los que se contrasta que coincida.
tam_ref <- sapply(c(0.02, 0.05, 0.10, 0.15, 0.20), function(e_rel) {
  e <- e_rel * media_pob
  n0 <- (z95^2 * S2_pob) / e^2
  ceiling(n0 / (1 + n0 / N))
})
cifras$tamano <- list(
  errores = c(0.02, 0.05, 0.10, 0.15, 0.20),
  n = as.integer(tam_ref),
  cv = S_pob / media_pob, z = z95, N = N, S = S_pob, media = media_pob
)
cat("\n== Tamaño de muestra para agpop (95 %, error relativo) ==\n")
cat(sprintf("   e = %.0f%% -> n = %d\n", c(2, 5, 10, 15, 20), tam_ref))

# =============================================================================
# 8. Volcado
# =============================================================================
datos <- list(
  meta = list(
    generado = "precalculo/genera_cap2.R",
    semilla = SEMILLA,
    replicas = R_REP,
    replicasBernoulli = R_BE,
    replicasComparacion = R_COMP,
    rVersion = as.character(getRversion())
  ),
  cifras = cifras,
  espacioMuestras = list(
    y = peq_y, x = peq_x, N = N_peq, n = n_peq,
    total = peq_t, media = peq_media, S2 = peq_S2,
    combos = combos,
    disenos = list(mas = dis_mas, estratificado = dis_est, desigual = dis_ppt)
  ),
  distribucion = distribucion,
  cobertura = cobertura,
  bernoulli = bernoulli,
  sistematico = list(
    poblacion = y_per, media = media_per, S2 = S2_per, periodo = periodo,
    porTamano = sistematico
  ),
  comparacionAgpop = comparacion
)

cat("\n== Salidas ==\n")
escribe_json(datos, "cap2_datos", digits = 8)

vuelta <- jsonlite::fromJSON(file.path(DIR_SALIDAS, "cap2_datos.json"))
cat(sprintf("  releído: %d secciones, media agpop = %.2f, cobertura n=300 = %.3f\n",
            length(vuelta), vuelta$cifras$agpop$media, vuelta$cobertura$n300$coberturaFpc))
cat("\nListo.\n")
