# genera_preparcial2.R — cifras del Preparcial del Corte II (módulo 14 del capítulo 4)
#
# Ejecutar SIEMPRE con el R del framework 4.4, desde la raíz del repositorio:
#   /Library/Frameworks/R.framework/Versions/4.4-arm64/Resources/bin/Rscript precalculo/genera_preparcial2.R
#
# Produce  precalculo/salidas/preparcial2_datos.json,  que el ensamblador del
# capítulo 4 incrusta como DATOS_PREPARCIAL2 y del que el banco
# (ensamblado/modulos/cap4/preparcial2.js) lee TODAS sus cifras. Ninguna cifra
# del módulo se escribe a mano.
#
# LA POBLACIÓN ES CONSTRUIDA, y el módulo lo dice. Ninguna población libre de
# Lohr sirve para el capítulo 3 (medido el 2026-10-07: census1920 -> census2010
# da rho = 0,59 con N = 48; viusca es una muestra con pesos y su mejor auxiliar
# da 0,38), y Javier aprobó el 2026-10-07 esta: las fincas cafeteras de un
# departamento. El registro cafetero conoce para todo el marco el área en café,
# el área en levante (renovada hace menos de dos años, que aún no produce), la
# subregión, la altitud y las entregas del año anterior a la cooperativa; la
# producción del año solo se mide en la muestra.
#
# QUÉ TIENE QUE PASAR EN ELLA, Y SE COMPRUEBA (sección 1): cada fenómeno del
# corte aparece con el tamaño fijado ANTES de escribir texto, y el guion aborta
# si alguno no aparece. Es el Checkpoint B del plan.
#
# REGLAS DE LAS CIFRAS IMPRESAS (lección QC.5 del quiz del cap. 3): lo que un
# enunciado imprime se redondea AQUÍ, y la respuesta se calcula con lo impreso,
# no con el valor sin redondear. Así quien opera con la calculadora sobre el
# enunciado llega a la clave, no a una vecina.
#
# DOBLE VÍA: toda varianza por la fórmula del material y por `survey`; el guion
# aborta si difieren.

source("precalculo/_comun.R")
suppressPackageStartupMessages(library(survey))

casi <- function(a, b, tol = 1e-9) all(abs(a - b) <= tol * pmax(1, abs(a), abs(b)))
exige <- function(cond, msg) if (!isTRUE(cond)) stop("ABORTA: ", msg, call. = FALSE)
# Las muestras que necesitan una propiedad se buscan con `repeat`. Sin tope, una
# condición imposible cuelga el guion sin decir cuál: la primera versión lo hizo.
.intentos <- new.env()
intenta <- function(que, max = 5000L) {
  v <- if (is.null(.intentos[[que]])) 1L else .intentos[[que]] + 1L
  assign(que, v, envir = .intentos)
  if (v > max) stop("ABORTA: ", que, ": ninguna muestra cumple la condición en ", max, " intentos", call. = FALSE)
}

# La semilla es la fecha del Parcial 2. Declarada aquí, como manda precalculo/README.md.
SEMILLA_PREP2 <- 20261022L
set.seed(SEMILLA_PREP2)

D <- list(meta = list(
  script = "precalculo/genera_preparcial2.R",
  semilla = SEMILLA_PREP2,
  poblacion = "fincas cafeteras de un departamento (construida)",
  r = paste(R.version$major, R.version$minor, sep = "."),
  survey = as.character(packageVersion("survey")),
  # La regla de Kish (cap. 3, módulo 4): con CV(xbar) por encima de 0,1-0,2 el
  # sesgo de la razón deja de poder darse por despreciable. El banco la cita.
  kish = 0.2
))

# =============================================================================
# 1. LA POBLACIÓN
# =============================================================================
Ns  <- c(Norte = 700L, Centro = 680L, Sur = 456L)
N   <- sum(Ns)
sub <- factor(rep(names(Ns), Ns), levels = names(Ns))

area <- pmin(30, pmax(0.3, round(rlnorm(N, 0.35, 0.8), 1)))
lev  <- ifelse(runif(N) < 0.45, round(area * rbeta(N, 2, 6), 1), 0)
lev  <- pmin(lev, round(area - 0.1, 1))
xp   <- area - lev                                   # área en producción
alt  <- round(ifelse(sub == "Norte", rnorm(N, 1650, 180),
              ifelse(sub == "Centro", rnorm(N, 1550, 180), rnorm(N, 1750, 200))))
# Producción del año, en cargas de café pergamino seco (125 kg). Tres
# relaciones a propósito, una por subregión (sección 2.10):
#   Norte  recta por el origen y dispersión que crece con el área -> razón
#   Centro intercepto claro (lotes que el registro no tiene)      -> regresión
#   Sur    relación débil (roya, cafetales viejos)                -> expansión
y <- ifelse(sub == "Norte", 9.5 * xp + rnorm(N, 0, 2.2 * sqrt(xp)),
     ifelse(sub == "Centro", 6 + 8 * xp + rnorm(N, 0, 3), 10 + 2 * xp + rnorm(N, 0, 7)))
y <- round(pmax(0, y), 1)
# Entregas del año anterior a la cooperativa (las conoce el registro). Misma
# variable un año antes: pendiente cercana a 1 pero no 1 (un año de clima).
yant <- round(pmax(0, 1.12 * y + rnorm(N, 0, 1.5 + 0.12 * y)), 1)
personas <- 1L + rpois(N, 2.6 + 0.05 * area)        # personas que viven en la finca
p_prop <- plogis(-0.3 + 0.9 * log(area))
tenencia <- factor(ifelse(runif(N) < p_prop, "propietario",
                   ifelse(runif(N) < 0.6, "arrendatario", "aparcero")),
                   levels = c("propietario", "arrendatario", "aparcero"))
cert <- as.integer(runif(N) < plogis(-2.2 + 1.0 * log(area) + 0.7 * (sub == "Norte")))
tam <- cut(area, c(0, 1, 3, 8, Inf), right = FALSE,
           labels = c("pequeña", "mediana", "grande", "muy grande"))
COSTO <- c(45, 60, 95, 150)   # miles de pesos por finca visitada, por estrato de tamaño
names(COSTO) <- levels(tam)

P <- data.frame(id = seq_len(N), sub, area, lev, xp, alt, y, yant, personas, tenencia, cert, tam)

# ---- parámetros verdaderos
cv <- function(v) sd(v) / mean(v)
pob <- list(
  N = N, Nsub = as.list(Ns), tx = round(sum(area), 1), xbarU = mean(area),
  ty = sum(y), ybarU = mean(y), Sy = sd(y), Sx = sd(area), rho = cor(y, area),
  B = sum(y) / sum(area), cvx = cv(area), cvy = cv(y), tlev = round(sum(lev), 1),
  Ntam = as.list(table(tam)), Nten = as.list(table(tenencia)), Ncert = sum(cert),
  mediana_y = median(y), media_area = mean(area), mediana_area = median(area),
  max_area = max(area), rho_alt = cor(y, alt), rho_pers = cor(personas, area)
)
D$poblacion <- pob

# ---- criterios de aceptación (Checkpoint B)
porsub <- lapply(levels(sub), function(s) {
  q <- P[P$sub == s, ]; f <- summary(lm(y ~ area, q))$coefficients
  list(sub = s, N = nrow(q), rho = cor(q$y, q$area),
       umbral = 0.5 * cv(q$area) / cv(q$y), B = sum(q$y) / sum(q$area),
       b0 = f[1, 1], p0 = f[1, 4], b1 = f[2, 1], ybar = mean(q$y))
})
names(porsub) <- levels(sub)
D$porsub <- porsub
exige(pob$rho > 0.75 && pob$rho < 0.92, sprintf("rho global fuera de rango: %.3f", pob$rho))
exige(abs(porsub$Norte$b0) / porsub$Norte$ybar < 0.05, "el Norte no pasa cerca del origen")
exige(porsub$Centro$p0 < 1e-6 && porsub$Centro$b0 / porsub$Centro$ybar > 0.2,
      "el Centro no tiene un intercepto claro")
exige(porsub$Sur$rho < porsub$Sur$umbral - 0.2, "en el Sur la razón no pierde con holgura")
r2 <- function(g) 1 - sum(tapply(P$y, g, function(v) sum((v - mean(v))^2))) / sum((P$y - mean(P$y))^2)
exige(r2(P$tam) > 0.5, "estratificar por tamaño no explica la mitad de la variabilidad")
exige(r2(P$sub) < 0.05, "estratificar por subregión explica demasiado")
exige(all(table(P$tam) >= 20), "algún estrato de tamaño tiene menos de 20 fincas")

# Varianza exacta del total bajo un estratificado con asignación nh (fpc incluida)
v_str <- function(g, nh) {
  Nh <- as.numeric(table(g)); Sh2 <- as.numeric(tapply(P$y, g, var))
  sum(Nh^2 * (1 - nh / Nh) * Sh2 / nh)
}
v_mas <- function(n) N^2 * (1 - n / N) * var(P$y) / n
prop_int <- function(g, n) {   # asignación proporcional entera que suma n (mayores restos), mínimo 2
  Nh <- as.numeric(table(g)); a <- n * Nh / sum(Nh); b <- pmax(2, floor(a))
  while (sum(b) < n) { i <- which.max(a - b); b[i] <- b[i] + 1 }
  while (sum(b) > n) { i <- which.max(b - a); b[i] <- b[i] - 1 }
  b
}

# =============================================================================
# 2. LAS CIFRAS DE LOS ÍTEMS
# =============================================================================
I <- list()
mas <- function(n) sort(sample.int(N, n))
r_ <- function(v, d) round(v, d)

# ---- R01 · 3.1 · qué hace auxiliar a una variable (cifras para la retro)
# Versión 2 (auditoría del 2026-10-07): el área de 2019 del registro y las entregas del
# año anterior, las dos auxiliares; la clave es «las dos».
I$R01 <- list(rho_area = r_(pob$rho, 2), rho_yant = r_(cor(P$y, P$yant), 2), rho_alt = r_(pob$rho_alt, 2))

# ---- R02 · 3.2 · el total por razón
s <- mas(60); q <- P[s, ]
R02 <- list(n = 60, ybar = r_(mean(q$y), 2), xbar = r_(mean(q$area), 3), tx = pob$tx, N = N)
R02$Bhat <- R02$ybar / R02$xbar
R02$xbarU <- R02$tx / N
# Versión 2: se pide la MEDIA por razón, B̂·t_x/N (la del total era gemela del quiz del cap. 3).
R02$respuesta <- R02$Bhat * R02$tx / N
R02$respuesta_total <- R02$Bhat * R02$tx
R02$expansion <- N * R02$ybar                       # el error con nombre: no usar la auxiliar
R02$sin_tx <- R02$Bhat * N                          # multiplicar por N en vez de t_x
exige(abs(R02$respuesta * N - R02$expansion) > 20, "R02: razón y expansión casi coinciden")
I$R02 <- R02

# ---- R03 · 3.2 · el error estándar de la razón
# Se busca una muestra con xbar a menos del 0,15 % de xbarU: así la convención
# del capítulo (factor xbarU/xbar, la de svyratio) y la del texto (sin él) caen
# dentro de la misma tolerancia, y nadie pierde la pregunta por la convención.
repeat {
  intenta("R03")
  s <- mas(60); q <- P[s, ]
  if (abs(mean(q$area) / pob$xbarU - 1) < 0.0015) break
}
R03 <- list(n = 60, N = N, ybar = r_(mean(q$y), 2), xbar = r_(mean(q$area), 3),
            sy = r_(sd(q$y), 2), sx = r_(sd(q$area), 3), r = r_(cor(q$y, q$area), 4),
            tx = pob$tx)
with(R03, {
  B <- ybar / xbar; f <- n / N
  se2 <- sy^2 + B^2 * sx^2 - 2 * B * r * sx * sy
  R03$Bhat <<- B
  R03$se2 <<- se2
  R03$respuesta <<- (tx / xbar) * sqrt((1 - f) / n * se2)       # convención del capítulo
  R03$texto <<- N * sqrt((1 - f) / n * se2)                      # convención del texto
  R03$con_sy <<- N * sqrt((1 - f) / n) * sy                      # error: s_y en vez del residuo
  R03$sin_fpc <<- (tx / xbar) * sqrt(se2 / n)                    # error: sin la fpc
})
# doble vía: svyratio sobre la misma muestra, con los datos sin redondear
d <- svydesign(ids = ~1, data = q, fpc = rep(N, nrow(q)))
sr <- svyratio(~y, ~area, d)
ee_svy <- as.numeric(SE(sr)) * pob$tx
exige(abs(ee_svy / R03$respuesta - 1) < 0.002, sprintf("R03: svyratio %.3f contra la fórmula %.3f", ee_svy, R03$respuesta))
exige(abs(R03$texto / R03$respuesta - 1) < 0.002, "R03: las dos convenciones se separan más del 0,2 %")
exige(abs(R03$con_sy / R03$respuesta - 1) > 0.3 && abs(R03$sin_fpc / R03$respuesta - 1) > 0.01,
      "R03: algún error con nombre cae sobre la clave")
R03$ee_svyratio <- ee_svy
I$R03 <- R03

# ---- R04 · 3.3 · la misma auxiliar para dos variables (gráfico)
# Producción y personas que viven en la finca, las dos contra el área. 300
# fincas al azar para dibujar; las cifras, de la población entera.
s <- mas(300)
I$R04 <- list(
  n_puntos = 300L, n_ee = 60L,
  area = P$area[s], y = P$y[s], personas = P$personas[s],
  prod = list(rho = r_(cor(P$y, P$area), 4), cvx = r_(cv(P$area), 4), cvy = r_(cv(P$y), 4),
              umbral = r_(0.5 * cv(P$area) / cv(P$y), 4)),
  pers = list(rho = r_(cor(P$personas, P$area), 4), cvx = r_(cv(P$area), 4),
              cvy = r_(cv(P$personas), 4), umbral = r_(0.5 * cv(P$area) / cv(P$personas), 4),
              media = r_(mean(P$personas), 2))
)
exige(I$R04$prod$rho > I$R04$prod$umbral, "R04: la razón no gana con la producción")
exige(I$R04$pers$umbral > 1, "R04: con personas el umbral no pasa de 1")
# EE verdaderos a n = 60 (aproximación de primer orden) para la retro
ee_exp <- function(v) N * sqrt((1 - 60 / N) / 60) * sd(v)
ee_raz <- function(v) { B <- sum(v) / sum(P$area); N * sqrt((1 - 60 / N) / 60 * var(v - B * P$area)) }
I$R04$prod$ee_exp <- ee_exp(P$y); I$R04$prod$ee_raz <- ee_raz(P$y)
I$R04$pers$ee_exp <- ee_exp(P$personas); I$R04$pers$ee_raz <- ee_raz(P$personas)
exige(I$R04$pers$ee_raz > 1.5 * I$R04$pers$ee_exp, "R04: con personas la razón no pierde de forma visible")

# ---- R05 · 3.4 · la cota del sesgo con una muestra chica
# Una muestra de 15 cuya cota estimada caiga por encima de la regla de Kish
# (0,2), que es el caso que el ítem necesita: con una auxiliar tan asimétrica
# pasa en la mayoría de las muestras de ese tamaño.
repeat {
  intenta("R05")
  s <- mas(15); q <- P[s, ]
  R05 <- list(n = 15, N = N, sx = r_(sd(q$area), 3), xbar = r_(mean(q$area), 3))
  R05$cv_xbar <- sqrt((1 - R05$n / N) / R05$n) * R05$sx / R05$xbar
  if (R05$cv_xbar > 0.22 && R05$cv_xbar < 0.35) break
}
# el sesgo relativo de verdad, medido con 40 000 réplicas a n = 15, con su error de Monte Carlo
M <- 40000L
Bh <- replicate(M, { k <- sample.int(N, 15); sum(P$y[k]) / sum(P$area[k]) })
R05$sesgo_rel <- (mean(Bh) - pob$B) / sd(Bh)
R05$replicas <- M
R05$mc <- 1 / sqrt(M)   # error de Monte Carlo del sesgo relativo, en unidades de ee
R05$cota_verdadera <- sqrt((1 - 15 / N) / 15) * cv(P$area)
exige(R05$cv_xbar > 0.2 && R05$cv_xbar < 0.4, sprintf("R05: la cota estimada %.3f no cae entre 0,2 y 0,4", R05$cv_xbar))
exige(abs(R05$sesgo_rel) < R05$cota_verdadera, "R05: la cota no se cumple")
I$R05 <- R05

# ---- R06 · 3.5 · proporciones: cuál es una razón (cifras para la retro)
# R06 se reescribió el 2026-10-07: la versión de las dos proporciones era gemela
# del ítem 10 del quiz del cap. 3. Ahora mira el otro lado del módulo 5: la media
# de los cocientes no está mal, contesta otra pregunta (la finca típica).
I$R06 <- list(B = r_(pob$B, 2), media_cocientes = r_(mean(P$y / P$area), 2))
exige(abs(I$R06$B - I$R06$media_cocientes) > 0.3, "R06: las dos cantidades casi coinciden")

# ---- R07 · 3.6 · no rechazar no es demostrar (una zona, n = 10)
# Versión 2: la de un intercepto claramente significativo era gemela del Quiz 2 y del
# quiz del cap. 3. Ahora una muestra de 10 fincas del Centro —donde la población SÍ
# tiene intercepto— en la que el contraste no lo rechaza: el módulo 6 del cap. 3.
repeat {
  intenta("R07")
  s <- sort(sample(which(P$sub == "Centro"), 10)); q <- P[s, ]
  f <- summary(lm(y ~ area, q))$coefficients
  if (f[1, 4] > 0.15 && f[1, 4] < 0.6 && f[2, 4] < 0.001 && f[1, 1] > 0) break
}
I$R07 <- list(n = 10, salida = paste(capture.output(printCoefmat(f, digits = 4)), collapse = "\n"),
              b0 = r_(f[1, 1], 3), p0 = r_(f[1, 4], 3), b1 = r_(f[2, 1], 3),
              b0_pob = r_(porsub$Centro$b0, 2))

# ---- R08 · 3.6 · ¿cuánta expansión vale la regresión? (Centro, población)
rhoC <- r_(porsub$Centro$rho, 4); NC <- Ns[["Centro"]]; n2 <- 40
n1 <- 1 / (1 / NC + (1 - rhoC^2) * (1 / n2 - 1 / NC))
I$R08 <- list(N = NC, n = n2, rho = rhoC, respuesta = ceiling(n1), exacto = n1,
              sin_fpc = ceiling(n2 / (1 - rhoC^2)),
              con_rho = ceiling(1 / (1 / NC + (1 - rhoC) * (1 / n2 - 1 / NC))))   # 1 − ρ en vez de 1 − ρ², con la fpc
exige(I$R08$respuesta != I$R08$sin_fpc, "R08: la fpc no cambia la respuesta y el ítem pierde su error con nombre")
exige(abs(n1 - round(n1)) > 0.05, "R08: n1 cae demasiado cerca de un entero")

# ---- R09 · 3.7 · diferencia frente a regresión con las entregas del año anterior
fa <- coef(lm(y ~ yant, P))
I$R09 <- list(b1 = r_(fa[2], 3), B = r_(sum(P$y) / sum(P$yant), 3), rho = r_(cor(P$y, P$yant), 4),
              Sx = r_(sd(P$yant), 2))
I$R09$paga <- r_((1 - I$R09$b1)^2 * I$R09$Sx^2, 2)

# ---- R10 · 3.8 · un estimador en cada subregión (estratificado 20/20/15)
# El Sur tiene que ser la región II de los tomates del módulo 8: la razón pierde
# contra la expansión (r por debajo del umbral) Y la regresión tampoco paga, es
# decir (n-1)/(n-2)·(1-r²) > 1, que con n = 15 pide |r| < 0,27. La primera
# versión solo exigía lo primero, y la muestra salió con r = 0,74: con esa
# correlación la regresión deja la varianza en el 45 % y la clave «expansión»
# habría sido falsa. Se pide |r| < 0,25 y la pendiente sin significación.
nh10 <- c(Norte = 20, Centro = 20, Sur = 15)
repeat {
  intenta("R10")
  s <- unlist(lapply(names(nh10), function(h) sample(which(P$sub == h), nh10[[h]])))
  q <- P[s, ]
  tab <- lapply(names(nh10), function(h) {
    z <- q[q$sub == h, ]; f <- summary(lm(y ~ area, z))$coefficients
    list(sub = h, n = nrow(z), b0 = r_(f[1, 1], 2), p0 = r_(f[1, 4], 4), b1 = r_(f[2, 1], 3),
         p1 = r_(f[2, 4], 4), B = r_(mean(z$y) / mean(z$area), 3), r = r_(cor(z$y, z$area), 3),
         umbral = r_(0.5 * cv(z$area) / cv(z$y), 3))
  })
  names(tab) <- names(nh10)
  ok <- tab$Norte$p0 > 0.25 && tab$Norte$p1 < 0.001 && tab$Norte$r > tab$Norte$umbral &&
        tab$Centro$p0 < 0.001 && tab$Centro$r > tab$Centro$umbral &&
        abs(tab$Sur$r) < 0.25 && tab$Sur$p1 > 0.1 && tab$Sur$r < tab$Sur$umbral
  if (ok) break
}
I$R10 <- list(tabla = tab)
I$R10$factor_sur <- with(tab$Sur, (n - 1) / (n - 2) * (1 - r^2))
exige(I$R10$factor_sur > 1, "R10: en el Sur la regresión sí paga")
# Versión 2: R10 es numérica. Con el estimador que pide cada subregión —razón,
# regresión, expansión—, la media y su EE por subregión; se pide el EE del total.
# (La elección región a región era gemela del quiz del cap. 3 y del simulacro.)
est10 <- lapply(names(nh10), function(h) {
  z <- q[q$sub == h, ]; Nh_ <- Ns[[h]]; n_ <- nrow(z); f_ <- n_ / Nh_
  xU <- mean(P$area[P$sub == h])
  if (h == "Norte") {
    B <- mean(z$y) / mean(z$area); m <- B * xU
    ee <- (xU / mean(z$area)) * sqrt((1 - f_) / n_ * var(z$y - B * z$area))
    est <- "razón"
  } else if (h == "Centro") {
    b1 <- coef(lm(y ~ area, z))[2]; m <- mean(z$y) + b1 * (xU - mean(z$area))
    ee <- sqrt((1 - f_) / n_ * (n_ - 1) / (n_ - 2) * (1 - cor(z$y, z$area)^2) * var(z$y))
    est <- "regresión"
  } else {
    m <- mean(z$y); ee <- sqrt((1 - f_) / n_) * sd(z$y); est <- "expansión"
  }
  list(sub = h, N = Nh_, n = n_, estimador = est, media = r_(as.numeric(m), 2), ee = r_(as.numeric(ee), 3))
})
names(est10) <- names(nh10)
I$R10$est <- est10
NN <- sapply(est10, `[[`, "N"); EE <- sapply(est10, `[[`, "ee"); MM <- sapply(est10, `[[`, "media")
I$R10$total <- sum(NN * MM)
I$R10$respuesta <- sqrt(sum(NN^2 * EE^2))
I$R10$suma_ee <- sum(NN * EE)                     # error: sumar errores estándar
I$R10$con_N <- N * sqrt(sum(EE^2))                # error: N global en vez de cada N_h
exige(abs(I$R10$suma_ee / I$R10$respuesta - 1) > 0.2 && abs(I$R10$con_N / I$R10$respuesta - 1) > 0.2,
      "R10: un error con nombre cae cerca de la clave")

# ---- R11 · 3.9 · total de un dominio sin conocer N_d (fincas certificadas)
s <- mas(80); q <- P[s, ]
u <- q$y * q$cert
R11 <- list(n = 80, N = N, nd = sum(q$cert), ubar = r_(mean(u), 3), su = r_(sd(u), 3),
            ybar_d = r_(mean(q$y[q$cert == 1]), 2), sy_d = r_(sd(q$y[q$cert == 1]), 2))
R11$total <- N * R11$ubar
R11$respuesta <- N * sqrt((1 - R11$n / N) / R11$n) * R11$su
# error con nombre: tratar a las n_d certificadas como un MAS de tamaño fijo y escalar por N̂_d
Nd_hat <- N * R11$nd / R11$n
R11$como_fijo <- Nd_hat * sqrt((1 - R11$nd / Nd_hat) / R11$nd) * R11$sy_d
d <- svydesign(ids = ~1, data = transform(q, u = y * cert), fpc = rep(N, nrow(q)))
ee_u <- as.numeric(SE(svytotal(~u, d)))
exige(abs(ee_u / (N * sqrt((1 - 80 / N) / 80) * sd(u)) - 1) < 1e-9, "R11: svytotal no da la fórmula")
exige(abs(R11$como_fijo / R11$respuesta - 1) > 0.15, "R11: el error con nombre cae cerca de la clave")
I$R11 <- R11

# ---- R13 · 3.11 · el GREG con dos auxiliares gana a la razón con una (se mide, no se supone)
# R13 afirma como verdadero que, si la producción depende del área en
# producción, el GREG con el área y el área en levante es más preciso que la
# razón con el área sola. Se comprueba con 4 000 MAS de 50, y la diferencia
# tiene que superar con holgura su error de Monte Carlo.
greg2 <- function(k) {
  q <- P[k, ]; X <- cbind(1, q$area, q$lev); w <- rep(N / length(k), length(k))
  b <- solve(crossprod(X, w * X), crossprod(X, w * q$y))
  sum(w * q$y) + sum((c(N, pob$tx, pob$tlev) - colSums(w * X)) * b)
}
rz <- function(k) sum(P$y[k]) / sum(P$area[k]) * pob$tx
sim13 <- replicate(4000, { k <- sample.int(N, 50); c(greg2(k), rz(k)) })
I$R13 <- list(replicas = 4000L, n = 50L, ee_greg = sd(sim13[1, ]), ee_razon = sd(sim13[2, ]),
              sesgo_greg = mean(sim13[1, ]) - pob$ty)
exige(I$R13$ee_greg < 0.9 * I$R13$ee_razon, "R13: el GREG con dos auxiliares no gana con holgura")

# ---- R14 · 3.11 · leer una calibración
s <- mas(50); q <- P[s, ]
d0 <- svydesign(ids = ~1, data = q, fpc = rep(N, nrow(q)))
dc <- calibrate(d0, ~area + lev, population = c(`(Intercept)` = N, area = pob$tx, lev = pob$tlev))
fmt <- function(o) paste(capture.output(print(o)), collapse = "\n")
I$R14 <- list(
  n = 50,
  antes = fmt(svytotal(~area + lev, d0)),
  despues = fmt(svytotal(~area + lev, dc)),
  y_antes = fmt(svytotal(~y, d0)),
  y_despues = fmt(svytotal(~y, dc)),
  suma_pesos = r_(sum(weights(dc)), 4),
  tx = pob$tx, tlev = pob$tlev,
  ty = r_(pob$ty, 1)
)
exige(casi(sum(weights(dc) * q$area), pob$tx, 1e-8), "R14: la calibración no reproduce t_x")
I$R14$ee_y_antes <- as.numeric(SE(svytotal(~y, d0)))
I$R14$y_total_antes <- as.numeric(coef(svytotal(~y, d0)))
I$R14$y_total_despues <- as.numeric(coef(svytotal(~y, dc)))
I$R14$area_antes <- as.numeric(coef(svytotal(~area, d0)))
I$R14$ee_y_despues <- as.numeric(SE(svytotal(~y, dc)))

# ---- R15 · 3.12 · la mediana desde F̂ con pesos desiguales
# Estratificado por tamaño con 4 fincas por estrato: pesos muy desiguales, que
# es lo que hace que la mediana ponderada y la de la muestra no coincidan.
repeat {
  intenta("R15")
  s <- unlist(lapply(levels(tam), function(h) sample(which(P$tam == h), 4)))
  q <- P[s, ]; w <- as.numeric(table(P$tam))[as.integer(q$tam)] / 4
  o <- order(q$y); yy <- q$y[o]; ww <- w[o]; Fh <- cumsum(ww) / sum(ww)
  med_w <- yy[which(Fh >= 0.5)[1]]
  if (length(unique(yy)) == 16 && abs(med_w - median(q$y)) > 3 && all(abs(Fh - 0.5) > 0.02)) break
}
I$R15 <- list(p = 0.5, por_estrato = 4L, y = yy, w = ww, F = Fh, mediana = med_w, mediana_sin_pesos = median(q$y),
              mediana_inf_sin_pesos = yy[which(seq_along(yy) / length(yy) >= 0.5)[1]],
              media_pond = r_(sum(ww * yy) / sum(ww), 2), mediana_pob = pob$mediana_y)
d <- svydesign(ids = ~1, strata = ~tam, weights = ~w, data = transform(q, w = w))
exige(casi(as.numeric(coef(svyquantile(~y, d, 0.5, ci = FALSE))), med_w, 1e-9) ||
      abs(as.numeric(coef(svyquantile(~y, d, 0.5, ci = FALSE))) - med_w) < 1e-6,
      "R15: svyquantile no da la mediana por ínfimo")

# ---- R16 · 4.1 · cuántas del Sur caen en un MAS
n16 <- 60
nsur <- replicate(2000, sum(P$sub[sample.int(N, n16)] == "Sur"))
I$R16 <- list(n = n16, replicas = 2000L, conteo = as.list(table(factor(nsur, levels = 0:max(nsur)))),
              esperado = n16 * Ns[["Sur"]] / N, frac_menos10 = mean(nsur < 10),
              min = min(nsur), max = max(nsur), prop = prop_int(P$sub, n16))
exige(I$R16$frac_menos10 > 0.02, "R16: casi nunca caen menos de 10 del Sur")

# ---- R19 · 4.3 · total estratificado y su error estándar (proporcional, n = 120)
nh19 <- prop_int(P$tam, 120)
repeat {
  intenta("R19")
  s <- unlist(lapply(seq_along(levels(tam)), function(i) sample(which(P$tam == levels(tam)[i]), nh19[i])))
  q <- P[s, ]
  if (all(tapply(q$y, q$tam, var) > 0)) break
}
Nh <- as.numeric(table(P$tam))
R19 <- list(Nh = Nh, nh = nh19, yh = r_(as.numeric(tapply(q$y, q$tam, mean)), 2),
            sh = r_(as.numeric(tapply(q$y, q$tam, sd)), 2))
R19$total <- sum(R19$Nh * R19$yh)
R19$respuesta <- sqrt(sum(R19$Nh^2 * (1 - R19$nh / R19$Nh) * R19$sh^2 / R19$nh))
R19$sin_N2 <- sqrt(sum((1 - R19$nh / R19$Nh) * R19$sh^2 / R19$nh)) * N   # N^2 global en vez de N_h^2
R19$sin_fpc <- sqrt(sum(R19$Nh^2 * R19$sh^2 / R19$nh))
d <- svydesign(ids = ~1, strata = ~tam, fpc = ~Nh, data = transform(q, Nh = Nh[as.integer(tam)]))
ee <- as.numeric(SE(svytotal(~y, d)))
exige(abs(ee / R19$respuesta - 1) < 0.002, sprintf("R19: survey %.2f contra fórmula %.2f", ee, R19$respuesta))
exige(abs(R19$sin_fpc / R19$respuesta - 1) > 0.03, "R19: olvidar la fpc cae sobre la clave")
I$R19 <- R19

# ---- R20 · 4.3 · la misma muestra con y sin strata= (otra muestra que la de R19)
s <- unlist(lapply(seq_along(levels(tam)), function(i) sample(which(P$tam == levels(tam)[i]), nh19[i])))
q <- transform(P[s, ], Nh = Nh[as.integer(P$tam[s])])
q$w <- q$Nh / nh19[as.integer(q$tam)]
d_bien <- svydesign(ids = ~1, strata = ~tam, fpc = ~Nh, data = q)
d_mal <- svydesign(ids = ~1, weights = ~w, fpc = rep(N, nrow(q)), data = q)   # con fpc: solo faltan los estratos
I$R20 <- list(bien = fmt(svytotal(~y, d_bien)), mal = fmt(svytotal(~y, d_mal)),
              ee_bien = as.numeric(SE(svytotal(~y, d_bien))), ee_mal = as.numeric(SE(svytotal(~y, d_mal))),
              total = as.numeric(coef(svytotal(~y, d_bien))))
exige(I$R20$ee_mal > 1.2 * I$R20$ee_bien, "R20: sin strata= el EE no sube de forma visible")

# ---- R21 · 4.7 · SSB y SSW de tres particiones
set.seed(SEMILLA_PREP2 + 21)
azar <- factor(sample(rep(1:4, length.out = N)))
part <- list(tamaño = P$tam, subregión = P$sub, azar = azar)
SST <- sum((P$y - mean(P$y))^2)
I$R21 <- lapply(names(part), function(k) {
  g <- part[[k]]; SSW <- sum(tapply(P$y, g, function(v) sum((v - mean(v))^2)))
  nh <- prop_int(g, 120)
  list(particion = k, H = nlevels(g), SSB = SST - SSW, SSW = SSW, R2 = 1 - SSW / SST,
       deff = v_str(g, nh) / v_mas(120))
})
names(I$R21) <- names(part)
I$R21$n <- 120L
I$R21$SST <- SST
exige(I$R21$azar$deff > 1, "R21: la partición al azar no pierde contra el MAS")
exige(I$R21$subregión$deff < 1, "R21: la subregión pierde")

# ---- R22 · 4.4 · Neyman para un estrato (n = 150)
Sh <- r_(as.numeric(tapply(P$y, P$tam, sd)), 2)
NS <- Nh * Sh
I$R22 <- list(n = 150, Nh = Nh, Sh = Sh, NS = NS, ney = 150 * NS / sum(NS),
              prop = 150 * Nh / N, NS2 = 150 * Nh * Sh^2 / sum(Nh * Sh^2))
I$R22$respuesta <- round(I$R22$ney[3])                       # el estrato «grande»
exige(round(I$R22$prop[3]) != I$R22$respuesta && round(I$R22$NS2[3]) != I$R22$respuesta,
      "R22: un error con nombre da la misma asignación")
exige(abs(I$R22$ney[3] - round(I$R22$ney[3])) < 0.4, "R22: el redondeo de la clave es ambiguo")
exige(all(I$R22$ney <= Nh), "R22: Neyman pide más fincas que las que hay")

# ---- R24 · 4.5 · la óptima con costos a presupuesto fijo
C24 <- 9000   # miles de pesos
c_h <- as.numeric(COSTO)
k <- C24 / sum(NS * sqrt(c_h))
nh24 <- k * NS / sqrt(c_h)
I$R24 <- list(C = C24, costo = c_h, Nh = Nh, Sh = Sh, nh = nh24, n_total = sum(nh24),
              con_c = C24 * (NS / c_h) / sum(NS))  # error: dividir por c_h y no por su raíz
I$R24$respuesta <- round(sum(nh24))
exige(casi(sum(nh24 * c_h), C24, 1e-9), "R24: la óptima no gasta el presupuesto")
exige(abs(sum(nh24) - round(sum(nh24))) < 0.4, "R24: el redondeo de la clave es ambiguo")
exige(all(nh24 <= Nh), "R24: la óptima pide más fincas que las que hay")

# ---- R25 · 4.5 · el estrato de certeza (versión 2)
# La comparación «la óptima visita menos fincas y gana» era gemela de la P16 de la
# sustentación y filtraba la clave de R24. Ahora: censar las 33 muy grandes y repartir
# el resto proporcionalmente, frente a la proporcional pura, con 100 y con 250 fincas.
# Medido el 2026-10-07: con 100 censar PIERDE (le quita 33 fincas al resto) y con 250
# gana. Es la lección: un estrato censado no aporta varianza, pero cuesta muestra.
vtot <- function(nh) sum(ifelse(nh >= Nh, 0, Nh^2 * (1 - nh / Nh) * Sh^2 / nh))
I$R25 <- lapply(c(100L, 250L), function(n) {
  nA <- prop_int(P$tam, n)
  nB <- c(prop_int(droplevels(P$tam[P$tam != "muy grande"]), n - Nh[4]), Nh[4])
  list(n = n, nA = nA, nB = nB, ee_A = sqrt(vtot(nA)), ee_B = sqrt(vtot(nB)))
})
exige(I$R25[[1]]$ee_B > I$R25[[1]]$ee_A, "R25: con 100 fincas censar no pierde")
exige(I$R25[[2]]$ee_B < 0.95 * I$R25[[2]]$ee_A, "R25: con 250 fincas censar no gana con holgura")

# ---- R27 · 4.6 · deff al subir H, con dos variables del marco
qcut <- function(v, H) cut(rank(v, ties.method = "first"), H, labels = FALSE)
I$R27 <- list(n = 120L, H = 2:8,
  area = sapply(2:8, function(H) { g <- factor(qcut(P$area, H)); v_str(g, prop_int(g, 120)) / v_mas(120) }),
  alt  = sapply(2:8, function(H) { g <- factor(qcut(P$alt, H));  v_str(g, prop_int(g, 120)) / v_mas(120) }))
exige(I$R27$area[7] < I$R27$area[1] - 0.05, "R27: con el área no sigue ganando")
exige(max(I$R27$alt) - min(I$R27$alt) < 0.05, "R27: con la altitud no se aplana")

# ---- R28 · 4.8 · del deff al tamaño (problema inverso), con la asignación de Neyman
# No con la proporcional: R29 imprime el deff exacto de la proporcional, y con
# él R28 se resolvería sin hacer la cuenta.
nh28 <- 150 * NS / sum(NS)
# Versión 2 (G1 de la auditoría): los dos EE SIN fpc, que es como el material
# dimensiona la muestra (v/S² del módulo 5). Con fpc, 87 fincas no valían como 300.
I$R28 <- list(n = 150, ee_mas = r_(N * sd(P$y) / sqrt(150), 1),
              ee_str = r_(sqrt(sum(Nh^2 * as.numeric(tapply(P$y, P$tam, var)) / nh28)), 1), n0 = 300)
I$R28$deff <- (I$R28$ee_str / I$R28$ee_mas)^2
I$R28$respuesta <- ceiling(I$R28$n0 * I$R28$deff)
I$R28$con_ee <- ceiling(I$R28$n0 * I$R28$ee_str / I$R28$ee_mas)   # error: la razón de EE, no su cuadrado
I$R28$dividir <- ceiling(I$R28$n0 / I$R28$deff)                    # error: n_ef al revés
exige(abs(I$R28$n0 * I$R28$deff - round(I$R28$n0 * I$R28$deff)) > 0.05, "R28: redondeo ambiguo")
exige(all(nh28 <= Nh), "R28: Neyman pide más fincas que las que hay")

# ---- R29 · 4.8 · el deff es de cada variable (versión 2)
# La de «deff estimado frente al exacto» era gemela de la P18 de la sustentación.
# Ahora el mismo diseño (proporcional por tamaño, n = 120) y dos variables.
nh29 <- prop_int(P$tam, 120)
v_str_de <- function(v, g, nh) { Nh_ <- as.numeric(table(g)); sum(Nh_^2 * (1 - nh / Nh_) * as.numeric(tapply(v, g, var)) / nh) }
v_mas_de <- function(v, n) N^2 * (1 - n / N) * var(v) / n
I$R29 <- list(n = 120, nh = nh29,
              deff_y = v_str_de(P$y, P$tam, nh29) / v_mas_de(P$y, 120),
              deff_pers = v_str_de(P$personas, P$tam, nh29) / v_mas_de(P$personas, 120))
I$R29$nef_y <- 120 / I$R29$deff_y
I$R29$nef_pers <- 120 / I$R29$deff_pers
exige(I$R29$deff_pers > 0.95, "R29: el diseño también gana mucho con las personas")

# ---- R30 · 4.9 · Hansen–Hurwitz en el estrato de las muy grandes
G <- P[P$tam == "muy grande", ]
psi <- G$area / sum(G$area)
k30 <- sample(nrow(G), 4, replace = TRUE, prob = psi)
I$R30 <- list(Nh = nrow(G), sum_area = r_(sum(G$area), 1), m = 4,
              area = G$area[k30], y = G$y[k30])
I$R30$psi <- I$R30$area / I$R30$sum_area
I$R30$respuesta <- mean(I$R30$y / I$R30$psi)
I$R30$t_verdadero <- sum(G$y)
I$R30$expansion <- nrow(G) * mean(I$R30$y)          # error: tratarlo como MAS
exige(abs(I$R30$expansion / I$R30$respuesta - 1) > 0.05, "R30: tratarlo como MAS da casi lo mismo")

# ---- R31 · 4.10 · la media postestratificada por tenencia
repeat {
  intenta("R31")
  s <- mas(80); q <- P[s, ]
  nh <- as.numeric(table(q$tenencia))
  # que postestratificar mueva la media lo bastante para que la media bruta sea un
  # error con nombre fuera de la tolerancia (y no dependa de la suerte del sorteo)
  yh_ <- round(as.numeric(tapply(q$y, q$tenencia, mean)), 2)
  if (all(nh >= 8) && abs(sum(nh * yh_) / 80 - sum(as.numeric(table(P$tenencia)) / N * yh_)) > 0.4) break
}
Nt <- as.numeric(table(P$tenencia))
R31 <- list(n = 80, Nh = Nt, nh = nh, yh = r_(as.numeric(tapply(q$y, q$tenencia, mean)), 2))
R31$respuesta <- sum(Nt / N * R31$yh)
R31$bruta <- sum(R31$nh * R31$yh) / R31$n                         # error: pesos de la muestra
R31$iguales <- mean(R31$yh)                                        # error: promediar las medias
d <- svydesign(ids = ~1, data = q, fpc = rep(N, nrow(q)))
dp <- postStratify(d, ~tenencia, data.frame(tenencia = levels(P$tenencia), Freq = Nt))
exige(abs(as.numeric(coef(svymean(~y, dp))) - sum(Nt / N * tapply(q$y, q$tenencia, mean))) < 1e-9,
      "R31: postStratify no da la fórmula")
exige(abs(R31$bruta - R31$respuesta) > 0.3, "R31: la media sin postestratificar casi coincide")
I$R31 <- R31

# R32 (versión 2): cuántas muy grandes se esperan en un MAS de 60
# R32 (versión 3): n = 170, para que la celda fusionada (grandes + muy grandes)
# espere unas 30 fincas, que es lo que el módulo 10 pide; las muy grandes solas
# esperan 3, y la probabilidad de que salgan cero es la hipergeométrica.
I$R32 <- list(n = 170L, esperadas = 170 * Nh[4] / N, esperadas_fusion = 170 * (Nh[3] + Nh[4]) / N,
              p_vacia = dhyper(0, Nh[4], N - Nh[4], 170), Nh = Nh)
exige(I$R32$esperadas_fusion > 29, "R32: la celda fusionada no llega a 30 esperadas")
D$items <- I

# =============================================================================
# 3. LOS CUATRO PROBLEMAS TIPO PARCIAL (resueltos en el módulo, con calculadora)
# =============================================================================
# Semilla propia, para que añadir o quitar un ítem arriba no mueva estos datos.
# Ningún problema reutiliza la muestra ni la tabla de un ítem: el P3 toma las
# desviaciones de un PILOTO, no las del censo que usa R22, porque con las del
# censo su solución permitiría escalar la clave de R22.
set.seed(SEMILLA_PREP2 + 3L)
PR <- list()
f_ <- function(n, Nn) 1 - n / Nn

# ---- P1 · razón, regresión y expansión sobre el mismo MAS (cap. 3, M2-M7)
repeat {
  intenta("P1")
  s <- mas(50); q <- P[s, ]
  fl <- summary(lm(y ~ area, q))$coefficients
  if (fl[1, 4] < 0.01) break   # que el contraste del intercepto decida algo
}
P1 <- list(n = 50, N = N, tx = pob$tx, ybar = r_(mean(q$y), 2), xbar = r_(mean(q$area), 3),
           sy = r_(sd(q$y), 2), sx = r_(sd(q$area), 3), r = r_(cor(q$y, q$area), 4),
           b0 = r_(fl[1, 1], 3), p0 = signif(fl[1, 4], 2))
P1 <- within(P1, {
  xbarU <- tx / N; f <- n / N
  B <- ybar / xbar; t_r <- B * tx
  se2_r <- sy^2 + B^2 * sx^2 - 2 * B * r * sx * sy
  ee_r <- (tx / xbar) * sqrt((1 - f) / n * se2_r)
  b1 <- r * sy / sx; ybar_reg <- ybar + b1 * (xbarU - xbar); t_reg <- N * ybar_reg
  ee_reg <- N * sqrt((1 - f) / n * (n - 1) / (n - 2) * (1 - r^2) * sy^2)
  t_exp <- N * ybar; ee_exp <- N * sqrt((1 - f) / n) * sy
})
d <- svydesign(ids = ~1, data = q, fpc = rep(N, nrow(q)))
exige(abs(as.numeric(SE(svyratio(~y, ~area, d))) * pob$tx / P1$ee_r - 1) < 0.002, "P1: svyratio no da el EE de la razón")
dc1 <- calibrate(d, ~area, population = c(`(Intercept)` = N, area = pob$tx))
exige(abs(as.numeric(coef(svytotal(~y, dc1))) / P1$t_reg - 1) < 0.001, "P1: calibrate no da el total de regresión")
exige(P1$ee_reg < P1$ee_r && P1$ee_r < P1$ee_exp, "P1: el orden de los tres EE no es el esperado")
P1$ty <- pob$ty
PR$P1 <- P1

# ---- P2 · un dominio con N_d conocido y desconocido (cap. 3, M9)
s <- mas(80); q <- P[s, ]
dl <- as.integer(q$sub == "Sur")
P2d <- list(n = 80, N = N, Nd = Ns[["Sur"]], nd = sum(dl), ybar_d = r_(mean(q$y[dl == 1]), 3),
            su = r_(sd(dl * (q$y - mean(q$y[dl == 1]))), 4),
            ubar = r_(mean(q$y * dl), 4), su2 = r_(sd(q$y * dl), 4))
P2d <- within(P2d, {
  f <- n / N
  ee_media <- sqrt((1 - f) / n * su^2 / (nd / n)^2)
  t_conocido <- Nd * ybar_d; ee_conocido <- Nd * ee_media
  t_desconocido <- N * ubar; ee_desconocido <- N * sqrt((1 - f) / n) * su2
})
d <- svydesign(ids = ~1, data = transform(q, sur = factor(sub == "Sur")), fpc = rep(N, nrow(q)))
sb <- svyby(~y, ~sur, d, svymean)
exige(abs(SE(sb)[2] / P2d$ee_media - 1) < 0.002, "P2: svyby no da el EE de la media de dominio")
exige(P2d$ee_desconocido > P2d$ee_conocido, "P2: no conocer N_d no sale más caro")
P2d$ybar_d_pob <- porsub$Sur$ybar
P2d$razon_ee <- P2d$ee_desconocido / P2d$ee_conocido
P2d$li <- P2d$ybar_d - 1.96 * P2d$ee_media
P2d$ls <- P2d$ybar_d + 1.96 * P2d$ee_media
P2d$cubre <- P2d$li <= porsub$Sur$ybar && porsub$Sur$ybar <= P2d$ls
PR$P2 <- P2d

# ---- P3 · Neyman con las S_h de un piloto, y la estimación (cap. 4, M3-M4)
piloto <- unlist(lapply(levels(tam), function(h) sample(which(P$tam == h), 10)))
Sh_pil <- r_(as.numeric(tapply(P$y[piloto], P$tam[piloto], sd)), 2)
n3 <- 100
ney3 <- n3 * Nh * Sh_pil / sum(Nh * Sh_pil)
nh3 <- round(ney3); nh3 <- pmin(nh3, Nh)
exige(sum(nh3) == n3, sprintf("P3: el redondeo de Neyman no suma %d (suma %d)", n3, sum(nh3)))
s <- unlist(lapply(seq_along(levels(tam)), function(i) sample(which(P$tam == levels(tam)[i]), nh3[i])))
q <- P[s, ]
P3 <- list(n = n3, Nh = Nh, Sh_piloto = Sh_pil, ney = ney3, nh = nh3,
           prop = n3 * Nh / N,
           yh = r_(as.numeric(tapply(q$y, q$tam, mean)), 2), sh = r_(as.numeric(tapply(q$y, q$tam, sd)), 2))
P3$t <- sum(P3$Nh * P3$yh)
P3$ee <- sqrt(sum(P3$Nh^2 * (1 - P3$nh / P3$Nh) * P3$sh^2 / P3$nh))
P3$li <- P3$t - 1.96 * P3$ee; P3$ls <- P3$t + 1.96 * P3$ee
P3$pesos <- P3$Nh / P3$nh
P3$ty <- pob$ty
P3$cubre <- P3$li <= pob$ty && pob$ty <= P3$ls
d <- svydesign(ids = ~1, strata = ~tam, fpc = ~Nh, data = transform(q, Nh = Nh[as.integer(tam)]))
exige(abs(as.numeric(SE(svytotal(~y, d))) / P3$ee - 1) < 0.002, "P3: survey no da el EE estratificado")
PR$P3 <- P3

# ---- P4 · postestratificar un MAS por tenencia, y la aproximación de Lohr (cap. 4, M8 y M10)
# Versión 2: por tenencia y no por tamaño. La fusión de la celda de las muy grandes es
# ahora la pregunta R32, y un problema resuelto en el mismo módulo la regalaba.
Nc <- as.numeric(table(P$tenencia))
# La tenencia explica menos que el tamaño, y en una muestra concreta el deff estimado
# puede salir por encima de 1. El problema enseña a calcularlo, así que se toma una
# muestra en la que la aproximación de Lohr sí estima un ahorro.
repeat {
  intenta("P4")
  s <- mas(100); q <- P[s, ]
  nh_ <- as.numeric(table(q$tenencia))
  yh_ <- tapply(q$y, q$tenencia, mean); sh_ <- tapply(q$y, q$tenencia, sd)
  ah_ <- 1 - ((1 - 100 / N) * sum(Nc / N * sh_^2) / 100) / ((1 - 100 / N) / 100 * var(q$y))
  if (min(nh_) >= 10 && ah_ > 0.1) break
}
P4 <- list(n = 100, N = N, celdas = levels(P$tenencia), Nh = Nc, nh = as.numeric(table(q$tenencia)),
           esperadas = 100 * Nc / N,
           yh = r_(as.numeric(tapply(q$y, q$tenencia, mean)), 2), sh = r_(as.numeric(tapply(q$y, q$tenencia, sd)), 2),
           ybar = r_(mean(q$y), 2), sy = r_(sd(q$y), 2))
P4 <- within(P4, {
  W <- Nh / N; f <- n / N
  ybar_post <- sum(W * yh)
  ee_post <- sqrt((1 - f) * sum(W * sh^2) / n)          # la aproximación de Lohr (módulo 10)
  ee_mas <- sqrt((1 - f) / n) * sy
  deff <- (ee_post / ee_mas)^2
})
P4$ybarU <- pob$ybarU
# El ahorro VERDADERO de postestratificar por tenencia con n = 100 (aproximación de
# Lohr con las S_h del censo): la muestra se eligió para que el estimado saliera
# positivo, así que la solución tiene que decir que el de verdad es menor.
Sten <- as.numeric(tapply(P$y, P$tenencia, sd))
P4$deff_verdadero <- sum(Nc / N * Sten^2) / var(P$y)
P4$ahorro_verdadero <- 1 - P4$deff_verdadero
d <- svydesign(ids = ~1, data = q, fpc = rep(N, nrow(q)))
dp <- postStratify(d, ~tenencia, data.frame(tenencia = levels(P$tenencia), Freq = Nc))
P4$ee_survey <- as.numeric(SE(svymean(~y, dp)))
P4$deff_survey <- (P4$ee_survey / P4$ee_mas)^2
P4$ahorro <- 1 - P4$deff
P4$ahorro_survey <- 1 - P4$deff_survey
exige(abs(as.numeric(coef(svymean(~y, dp))) - sum(Nc / N * tapply(q$y, q$tenencia, mean))) < 1e-9,
      "P4: postStratify no da la media postestratificada")
exige(min(P4$nh) >= 10, "P4: alguna celda sale chica")
exige(P4$ahorro > 0, "P4: postestratificar no ahorra nada en esta muestra")
PR$P4 <- P4
D$problemas <- PR
D$costos <- as.list(COSTO)
D$estratos <- list(nombres = levels(tam), cortes = c(1, 3, 8), Nh = Nh,
                   Ybar = as.numeric(tapply(P$y, P$tam, mean)), Sh = Sh)
D$tenencia <- list(nombres = levels(tenencia), Nh = Nt)

escribe_json(D, "preparcial2_datos")
cat(sprintf("\nN = %d · t_x = %.1f ha · Ybar = %.3f · rho = %.4f · R2 tamaño = %.3f · R2 subregión = %.3f\n",
            N, pob$tx, pob$ybarU, pob$rho, r2(P$tam), r2(P$sub)))
