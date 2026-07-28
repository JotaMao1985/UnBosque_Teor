# genera_cap8.R — datos del capítulo 8: no respuesta, ponderación e imputación
#
# Ejecutar SIEMPRE desde la raíz del repositorio y con el R del framework 4.4:
#   /Library/Frameworks/R.framework/Versions/4.4-arm64/Resources/bin/Rscript \
#       --vanilla precalculo/genera_cap8.R
# El Rscript del PATH es el 4.6 de Homebrew y NO tiene survey.
#
# Hilo del capítulo: la encuesta de carga laboral docente de Gnap (1995) en el
# condado de Maricopa, Arizona (Lohr, ejercicio 5.16 y 8.17). Es el único caso
# del curso en el que se puede MEDIR el sesgo de no respuesta en vez de
# suponerlo, porque la autora submuestreó a los no respondientes y publicó sus
# datos (teachnr.csv). Todo lo demás del capítulo cuelga de ahí.

source("precalculo/_comun.R")
suppressPackageStartupMessages({
  library(survey)
  library(mitools)
})

set.seed(SEMILLA)
D <- list(meta = list(semilla = SEMILLA, generado = "precalculo/genera_cap8.R"))

# ===========================================================================
# 1 · La encuesta: estructura, tasas de respuesta y faltantes de ítem
# ===========================================================================
te <- lee_lohr("teachers")     # 310 cuestionarios devueltos
mi <- lee_lohr("teachmi")      # 31 escuelas: profesores y cuestionarios devueltos
nr <- lee_lohr("teachnr")      # 26 no respondientes submuestreados (estrato grande)

# -9 es el código de faltante de este archivo. Se convierte a NA ANTES de
# cualquier cuenta: promediar un -9 es el error clásico de este dataset.
VARS <- c("hrwork", "size", "preprmin", "assist")
faltantes_te <- sapply(VARS, function(v) sum(te[[v]] == -9))
faltantes_nr <- sapply(VARS, function(v) sum(nr[[v]] == -9))
te[te == -9] <- NA
nr[nr == -9] <- NA

teL <- te[te$dist == "large", ]
miL <- mi[mi$dist == "large", ]

N_ESCUELAS_L <- 245            # escuelas del estrato grande (Lohr, apéndice C)
N_ESCUELAS_SM <- 66            # escuelas del estrato pequeño/mediano
n_escuelas_L <- nrow(miL)

D$encuesta <- list(
  distritos = 46, escuelasCondado = 311, profesoresCondado = 15086,
  estratos = list(
    list(nombre = "grande", escuelasN = N_ESCUELAS_L, escuelasn = nrow(miL),
         profesores = sum(miL$popteach), devueltos = sum(miL$ssteach),
         tasa = sum(miL$ssteach) / sum(miL$popteach)),
    list(nombre = "pequeño/mediano", escuelasN = N_ESCUELAS_SM,
         escuelasn = nrow(mi) - nrow(miL),
         profesores = sum(mi$popteach) - sum(miL$popteach),
         devueltos = sum(mi$ssteach) - sum(miL$ssteach),
         tasa = (sum(mi$ssteach) - sum(miL$ssteach)) / (sum(mi$popteach) - sum(miL$popteach)))
  ),
  profesoresTotal = sum(mi$popteach), devueltosTotal = sum(mi$ssteach),
  tasaGlobal = sum(mi$ssteach) / sum(mi$popteach),
  faltantesItem = list(variable = VARS, n = as.integer(faltantes_te),
                       pct = as.numeric(faltantes_te) / nrow(te)),
  filas = nrow(te)
)

# Comprobación: los cuestionarios declarados por escuela deben coincidir con las
# filas del archivo de respuestas. Si no coinciden, el archivo está mal leído.
filas_por_escuela <- as.data.frame(table(dist = te$dist, school = te$school),
                                   stringsAsFactors = FALSE)
filas_por_escuela <- filas_por_escuela[filas_por_escuela$Freq > 0, ]
filas_por_escuela$school <- as.integer(filas_por_escuela$school)
chk <- merge(mi, filas_por_escuela, by = c("dist", "school"))
stopifnot(nrow(chk) == nrow(mi), all(chk$ssteach == chk$Freq))

cat("1 · tasa global de respuesta:", fmt(D$encuesta$tasaGlobal, 4),
    "| estrato grande:", fmt(D$encuesta$estratos[[1]]$tasa, 4), "\n")

# ===========================================================================
# 2 · Respondientes contra no respondientes: el sesgo, MEDIDO
# ===========================================================================
# La submuestra de no respondientes solo existe en el estrato grande y no trae
# identificador de escuela: la comparación es a nivel de profesor y por eso no
# lleva efecto de diseño. Se declara en el material.
comparacion <- lapply(VARS, function(v) {
  a <- teL[[v]][!is.na(teL[[v]])]
  b <- nr[[v]][!is.na(nr[[v]])]
  ee <- sqrt(var(a) / length(a) + var(b) / length(b))
  list(variable = v, nR = length(a), mediaR = mean(a), sdR = sd(a),
       nNR = length(b), mediaNR = mean(b), sdNR = sd(b),
       dif = mean(a) - mean(b), eeDif = ee, t = (mean(a) - mean(b)) / ee)
})
names(comparacion) <- VARS

M_L  <- sum(miL$popteach)      # profesores en las 23 escuelas sorteadas
MR_L <- sum(miL$ssteach)       # los que respondieron
MNR_L <- M_L - MR_L            # los que no
tasa_L <- MR_L / M_L

yR  <- mean(teL$hrwork, na.rm = TRUE)
yNR <- mean(nr$hrwork,  na.rm = TRUE)
sesgo_medido <- (1 - tasa_L) * (yR - yNR)      # sesgo = (1-R)(ybar_R - ybar_NR)
y_dosfases  <- tasa_L * yR + (1 - tasa_L) * yNR

# Segunda vía: el estimador de dos fases escrito como media ponderada de las
# dos submuestras con pesos MR y MNR. Debe dar exactamente lo mismo.
y_dosfases_2 <- (MR_L * yR + MNR_L * yNR) / M_L
stopifnot(abs(y_dosfases - y_dosfases_2) < 1e-12)
stopifnot(abs((yR - y_dosfases) - sesgo_medido) < 1e-12)   # el sesgo es la brecha

# Varianza del estimador de dos fases (Hansen–Hurwitz 1946), tratando la
# submuestra como un MAS de los no respondientes con fracción 1/k.
k_sub <- MNR_L / nrow(nr)
v_dosfases <- (1 - tasa_L)^2 * var(nr$hrwork, na.rm = TRUE) / nrow(nr) +
              tasa_L^2 * var(teL$hrwork, na.rm = TRUE) / sum(!is.na(teL$hrwork))

D$sesgo <- list(
  comparacion = unname(comparacion),
  M = M_L, MR = MR_L, MNR = MNR_L, tasa = tasa_L,
  yR = yR, yNR = yNR, sesgo = sesgo_medido, relativo = sesgo_medido / y_dosfases,
  dosFases = y_dosfases, eeDosFases = sqrt(v_dosfases),
  submuestra = nrow(nr), fraccionSubmuestra = nrow(nr) / MNR_L, k = k_sub
)
cat("2 · respondientes", fmt(yR, 3), "· no respondientes", fmt(yNR, 3),
    "· sesgo", fmt(sesgo_medido, 4), "horas\n")

# --- La curva "n grande no salva" -----------------------------------------
# El sesgo no depende de n: se mantiene mientras el error estándar se encoge.
# Se dibuja para el hrwork con la tasa y la brecha medidas arriba.
sd_y <- sd(teL$hrwork, na.rm = TRUE)
n_curva <- round(exp(seq(log(25), log(20000), length.out = 40)))
D$nNoSalva <- list(
  n = n_curva,
  ee = sd_y / sqrt(n_curva),
  sesgo = rep(abs(sesgo_medido), length(n_curva)),
  ecm = sqrt(sd_y^2 / n_curva + sesgo_medido^2),
  sdY = sd_y, sesgoAbs = abs(sesgo_medido),
  nCruce = ceiling(sd_y^2 / sesgo_medido^2)   # donde el sesgo iguala al ee
)
cat("   n donde el sesgo iguala al error estándar:", D$nNoSalva$nCruce, "\n")

# ===========================================================================
# 3 · MCAR, MAR y MNAR: qué arregla el ajuste de pesos y qué no
# ===========================================================================
# Población: agpop completo (N = 3 078, con los 19 códigos -99 dentro, decisión
# del proyecto). y = acres92, auxiliar x = acres87, que SÍ se observa en todos.
ag <- lee_lohr("agpop")
N_ag <- nrow(ag)
mu_ag <- mean(ag$acres92)

# Clases de ajuste: quintiles de la auxiliar x, que es lo que un analista
# tendría de verdad (x se conoce para toda la muestra, respondiera o no).
cortes_x <- quantile(ag$acres87, probs = seq(0, 1, 0.2))
clase_x <- cut(ag$acres87, cortes_x, include.lowest = TRUE, labels = FALSE)

# Los cuatro mecanismos comparten el mismo perfil de propensión —las mismas
# cinco probabilidades— y solo cambian en QUÉ variable ordena las clases. Así
# la comparación aísla el mecanismo y no la fuerza del efecto.
TASA_OBJ <- 0.6
PERFIL <- c(0.85, 0.70, 0.60, 0.50, 0.35)      # media 0,60 con clases iguales

# MNAR: la propensión depende de y DENTRO de cada clase de ajuste. Es la
# definición operativa: la parte de y que el auxiliar no ve. Construido así, la
# tasa de respuesta de cada clase de x vale 0,60 exactamente, de modo que el
# ajuste por clases no tiene nada que corregir y el sesgo sobrevive entero.
clase_dentro <- integer(N_ag)
for (cl in sort(unique(clase_x))) {
  idx <- which(clase_x == cl)
  q <- quantile(ag$acres92[idx], probs = seq(0, 1, 0.2))
  clase_dentro[idx] <- cut(ag$acres92[idx], q, include.lowest = TRUE, labels = FALSE)
}
residuo_y <- residuals(lm(acres92 ~ acres87, data = ag))

# MAR fino: la propensión es continua en x, así que NO es constante dentro de
# las cinco clases de ajuste. El ajuste corrige, pero no del todo.
zx <- as.numeric(scale(rank(ag$acres87)))
a_fino <- uniroot(function(a) mean(plogis(a + 1.6 * -zx)) - TASA_OBJ, c(-8, 8))$root

p_mcar <- rep(TASA_OBJ, N_ag)
p_mar  <- PERFIL[clase_x]
p_fino <- plogis(a_fino + 1.6 * -zx)
p_mnar <- PERFIL[clase_dentro]
# Comprobación de la construcción: la propensión media es la misma en las cinco
# clases de ajuste, así que el ajuste por clases no puede ver nada.
stopifnot(max(abs(tapply(p_mnar, clase_x, mean) - TASA_OBJ)) < 0.02)

M_MEC <- 2000
n_mec <- 300
simula_mecanismo <- function(p) {
  sin_aj <- con_aj <- numeric(M_MEC)
  tasas <- numeric(M_MEC)
  for (m in seq_len(M_MEC)) {
    s <- sample.int(N_ag, n_mec)
    r <- runif(n_mec) < p[s]
    tasas[m] <- mean(r)
    y <- ag$acres92[s]
    cl <- clase_x[s]
    sin_aj[m] <- mean(y[r])
    # Ajuste por clases: peso = 1 / (tasa de respuesta observada en la clase).
    # Las clases sin respondientes se colapsan con la tasa global.
    tasa_cl <- tapply(r, cl, mean)
    tasa_cl[is.na(tasa_cl) | tasa_cl == 0] <- mean(r)
    w <- 1 / tasa_cl[as.character(cl[r])]
    con_aj[m] <- sum(w * y[r]) / sum(w)
  }
  list(sinAjuste = mean(sin_aj) - mu_ag, conAjuste = mean(con_aj) - mu_ag,
       eeSin = sd(sin_aj) / sqrt(M_MEC), eeCon = sd(con_aj) / sqrt(M_MEC),
       sdSin = sd(sin_aj), sdCon = sd(con_aj), tasaMedia = mean(tasas))
}
set.seed(SEMILLA)
mec <- list(MCAR = simula_mecanismo(p_mcar),
            MAR  = simula_mecanismo(p_mar),
            `MAR fino` = simula_mecanismo(p_fino),
            MNAR = simula_mecanismo(p_mnar))
props <- list(MCAR = p_mcar, MAR = p_mar, `MAR fino` = p_fino, MNAR = p_mnar)

D$mecanismos <- list(
  N = N_ag, n = n_mec, M = M_MEC, mu = mu_ag, tasaObjetivo = TASA_OBJ,
  perfil = PERFIL,
  nombres = names(mec),
  sinAjuste = unname(sapply(mec, function(x) x$sinAjuste)),
  conAjuste = unname(sapply(mec, function(x) x$conAjuste)),
  eeSin = unname(sapply(mec, function(x) x$eeSin)),
  eeCon = unname(sapply(mec, function(x) x$eeCon)),
  tasaMedia = unname(sapply(mec, function(x) x$tasaMedia)),
  # Lo que separa a los cuatro casos: de qué depende la propensión. En MNAR la
  # correlación con el residuo es alta y con x es prácticamente cero.
  # cor() avisa si la propensión es constante (MCAR): ahí la correlación es 0
  # por definición, no indefinida.
  corPy = unname(sapply(props, function(p) if (sd(p) == 0) 0 else cor(p, ag$acres92))),
  corPx = unname(sapply(props, function(p) if (sd(p) == 0) 0 else cor(p, ag$acres87))),
  corPres = unname(sapply(props, function(p) if (sd(p) == 0) 0 else cor(p, residuo_y))),
  corXY = cor(ag$acres87, ag$acres92),
  # Cuánto del sesgo elimina el ajuste, que es la lectura del módulo. Solo tiene
  # sentido si había sesgo que eliminar: con MCAR el "sesgo" es ruido de Monte
  # Carlo (|sesgo| < 2 ee) y el cociente no significa nada.
  eliminado = unname(sapply(mec, function(x)
    if (abs(x$sinAjuste) < 2 * x$eeSin) NA_real_ else 1 - x$conAjuste / x$sinAjuste))
)
for (nm in names(mec)) {
  cat(sprintf("3 · %-4s sesgo sin ajuste %+10.1f (ee %.1f) · con ajuste %+10.1f (ee %.1f)\n",
              nm, mec[[nm]]$sinAjuste, mec[[nm]]$eeSin, mec[[nm]]$conAjuste, mec[[nm]]$eeCon))
}

# ===========================================================================
# 4 · Ajuste por clases de respuesta sobre la encuesta real
# ===========================================================================
# Diseño: conglomerados de una etapa, 23 escuelas de 245, todos los profesores
# de la escuela seleccionada. Peso de diseño d_k = 245/23 para todos.
d_diseno <- N_ESCUELAS_L / n_escuelas_L

teL$pop  <- miL$popteach[match(teL$school, miL$school)]
teL$devu <- miL$ssteach[match(teL$school, miL$school)]
teL$p_escuela <- teL$devu / teL$pop
stopifnot(all(!is.na(teL$p_escuela)))

# Clases por tamaño de escuela: terciles de popteach entre las 23 escuelas.
cortes_esc <- quantile(miL$popteach, probs = c(0, 1/3, 2/3, 1))
miL$clase <- cut(miL$popteach, cortes_esc, include.lowest = TRUE, labels = FALSE)
tasa_clase <- tapply(miL$ssteach, miL$clase, sum) / tapply(miL$popteach, miL$clase, sum)
teL$clase <- miL$clase[match(teL$school, miL$school)]
teL$p_clase <- as.numeric(tasa_clase[as.character(teL$clase)])

teL$w_sin    <- d_diseno
teL$w_clase  <- d_diseno / teL$p_clase
teL$w_esc    <- d_diseno / teL$p_escuela

obs <- !is.na(teL$hrwork)
med_pond <- function(w) sum(w[obs] * teL$hrwork[obs]) / sum(w[obs])
est_sin   <- med_pond(teL$w_sin)
est_clase <- med_pond(teL$w_clase)
est_esc   <- med_pond(teL$w_esc)

# Errores estándar con el diseño declarado (conglomerados + fpc).
teL$fpc <- N_ESCUELAS_L
ee_de <- function(col) {
  dis <- svydesign(id = ~school, weights = as.formula(paste0("~", col)),
                   fpc = ~fpc, data = teL[obs, ])
  m <- svymean(~hrwork, dis)
  c(est = as.numeric(m), ee = as.numeric(SE(m)))
}
ee_sin   <- ee_de("w_sin")
ee_clase <- ee_de("w_clase")
ee_esc   <- ee_de("w_esc")

# Doble vía obligatoria del protocolo: la varianza del estimador de razón sobre
# conglomerados, implementada a mano con la fórmula del capítulo 5, debe
# reproducir el error estándar de survey.
#   V(ybar_r) = (1/Mgorro^2) (1 - n/N) [n/(n-1)] SUM_i (t_i - ybar_r m_i)^2
ee_mano <- function(col) {
  d <- teL[obs, ]
  ti <- tapply(d[[col]] * d$hrwork, d$school, sum)
  mi_ <- tapply(d[[col]], d$school, sum)
  ybar <- sum(ti) / sum(mi_)
  e <- ti - ybar * mi_
  n <- length(ti)
  v <- (1 - n / N_ESCUELAS_L) * (n / (n - 1)) * sum(e^2) / sum(mi_)^2
  c(est = ybar, ee = sqrt(v))
}
mano_sin   <- ee_mano("w_sin")
mano_clase <- ee_mano("w_clase")
mano_esc   <- ee_mano("w_esc")
stopifnot(abs(ee_sin["est"]   - est_sin)   < 1e-9,
          abs(ee_clase["est"] - est_clase) < 1e-9,
          abs(ee_esc["est"]   - est_esc)   < 1e-9,
          abs(mano_sin["ee"]   - ee_sin["ee"])   < 1e-8,
          abs(mano_clase["ee"] - ee_clase["ee"]) < 1e-8,
          abs(mano_esc["ee"]   - ee_esc["ee"])   < 1e-8)
cat("   doble vía del ee (a mano ↔ survey): ",
    sprintf("%.8f / %.8f", mano_sin["ee"], ee_sin["ee"]), "\n")

kish <- function(w) length(w) * sum(w^2) / sum(w)^2
# El simulador reagrupa las escuelas en vivo, así que necesita la media y el
# número de observaciones de cada una: con eso reconstruye cualquier ajuste
# por clases sin cargar las 250 filas.
media_esc <- tapply(teL$hrwork[obs], teL$school[obs], mean)
n_esc_obs <- tapply(teL$hrwork[obs], teL$school[obs], length)
stopifnot(all(miL$school %in% names(media_esc)))
# Prueba de que la reconstrucción funciona: la media global por escuelas debe
# reproducir la estimación sin ajustar.
stopifnot(abs(sum(n_esc_obs * media_esc) / sum(n_esc_obs) - est_sin) < 1e-9)

D$clases <- list(
  dDiseno = d_diseno,
  escuelas = list(school = miL$school, pop = miL$popteach, devu = miL$ssteach,
                  tasa = miL$ssteach / miL$popteach, clase = as.integer(miL$clase),
                  media = as.numeric(media_esc[as.character(miL$school)]),
                  nObs = as.integer(n_esc_obs[as.character(miL$school)])),
  tasaClase = as.numeric(tasa_clase),
  nClase = as.integer(table(miL$clase)),
  estimaciones = list(
    nombre = c("Sin ajustar", "Clases por tamaño", "Clase = escuela", "Dos fases (con teachnr)"),
    valor  = c(est_sin, est_clase, est_esc, y_dosfases),
    ee     = c(ee_sin["ee"], ee_clase["ee"], ee_esc["ee"], sqrt(v_dosfases)),
    kish   = c(kish(teL$w_sin[obs]), kish(teL$w_clase[obs]), kish(teL$w_esc[obs]), NA)
  ),
  objetivo = y_dosfases
)
cat("4 · sin ajustar", fmt(est_sin, 3), "· clases", fmt(est_clase, 3),
    "· por escuela", fmt(est_esc, 3), "· dos fases", fmt(y_dosfases, 3), "\n")

# ===========================================================================
# 5 · Post-estratificación y raking contra totales externos (ACS)
# ===========================================================================
pr  <- lee_lohr("profresp")
acs <- lee_lohr("profrespacs")

# El archivo de control usa age3cat y el cuestionario, age4cat. El codebook no
# viaja con los datos, así que la correspondencia se DEDUCE: de los tres
# colapsos ordenados posibles de 4 categorías en 3, solo uno da márgenes
# compatibles con la ACS. Se deja la evidencia en el JSON.
pACS_edad <- as.numeric(tapply(acs$count, acs$age3cat, sum)); pACS_edad <- pACS_edad / sum(pACS_edad)
colapsos <- list("{1,2}{3}{4}" = c(1, 1, 2, 3),
                 "{1}{2,3}{4}" = c(1, 2, 2, 3),
                 "{1}{2}{3,4}" = c(1, 2, 3, 3))
evid <- lapply(names(colapsos), function(nm) {
  g <- colapsos[[nm]][pr$age4cat]
  p <- as.numeric(table(g) / length(g))
  list(colapso = nm, p = p, difMax = max(abs(p - pACS_edad)))
})
mejor <- which.min(sapply(evid, function(e) e$difMax))
stopifnot(names(colapsos)[mejor] == "{1}{2,3}{4}")
pr$age3cat <- colapsos[["{1}{2,3}{4}"]][pr$age4cat]

# Peso base: la ACS dice cuántos adultos hay; el panel no tiene diseño, así que
# se arranca con el peso uniforme N/n y se deja que la post-estratificación
# haga todo el trabajo.
N_acs <- sum(acs$count)
pr$w0 <- N_acs / nrow(pr)
pr$celda <- with(pr, paste(gender, age3cat, edu3cat, sep = "-"))
acs$celda <- with(acs, paste(gender, age3cat, edu3cat, sep = "-"))
stopifnot(setequal(unique(pr$celda), acs$celda), nrow(acs) == 18)

n_celda <- table(pr$celda)
pr$Nc <- acs$count[match(pr$celda, acs$celda)]
pr$nc <- as.numeric(n_celda[pr$celda])
pr$wps <- pr$Nc / pr$nc                     # peso post-estratificado
# Los pesos deben sumar el total de control. La tolerancia es relativa: sumar
# 2 404 números del orden de 10^5 no da el total al microgramo.
stopifnot(abs(sum(pr$wps) - N_acs) < 1e-9 * N_acs)

# Segunda vía: survey::postStratify sobre el mismo diseño.
dis_pr <- svydesign(id = ~1, weights = ~w0, data = pr)
pob <- data.frame(celda = acs$celda, Freq = acs$count)
dis_ps <- postStratify(dis_pr, ~celda, pob)
stopifnot(max(abs(weights(dis_ps) - pr$wps)) < 1e-6)

# Raking sobre los tres márgenes, que es lo que se usa cuando el cruce completo
# no se conoce. Debe dar pesos parecidos, no iguales.
dis_rk <- rake(dis_pr,
               list(~gender, ~age3cat, ~edu3cat),
               list(data.frame(gender = 1:2, Freq = as.numeric(tapply(acs$count, acs$gender, sum))),
                    data.frame(age3cat = 1:3, Freq = as.numeric(tapply(acs$count, acs$age3cat, sum))),
                    data.frame(edu3cat = 1:3, Freq = as.numeric(tapply(acs$count, acs$edu3cat, sum)))))
w_rk <- weights(dis_rk)
stopifnot(abs(sum(w_rk) - N_acs) < 1)

FREQ <- paste0("freq_q", 1:5)
est_pr <- t(sapply(FREQ, function(v) {
  f <- as.formula(paste0("~", v))
  sin_p <- c(mean(pr[[v]]), sd(pr[[v]]) / sqrt(nrow(pr)))
  con_p <- svymean(f, dis_ps)
  con_r <- svymean(f, dis_rk)
  c(sinPeso = sin_p[1], eeSin = sin_p[2],
    conPeso = as.numeric(con_p), eeCon = as.numeric(SE(con_p)),
    raking = as.numeric(con_r), eeRak = as.numeric(SE(con_r)))
}))

D$calibracion <- list(
  n = nrow(pr), Nacs = N_acs, celdas = nrow(acs),
  evidenciaColapso = list(nombre = sapply(evid, function(e) e$colapso),
                          difMax = sapply(evid, function(e) e$difMax),
                          pACS = pACS_edad,
                          elegido = names(colapsos)[mejor]),
  margenes = list(
    variable = c("gender", "age3cat", "edu3cat"),
    encuesta = list(as.numeric(table(pr$gender) / nrow(pr)),
                    as.numeric(table(pr$age3cat) / nrow(pr)),
                    as.numeric(table(pr$edu3cat) / nrow(pr))),
    acs = list(as.numeric(tapply(acs$count, acs$gender, sum) / N_acs),
               as.numeric(tapply(acs$count, acs$age3cat, sum) / N_acs),
               as.numeric(tapply(acs$count, acs$edu3cat, sum) / N_acs))
  ),
  pesos = list(min = min(pr$wps), max = max(pr$wps), media = mean(pr$wps),
               cv = sd(pr$wps) / mean(pr$wps), kish = kish(pr$wps),
               razon = max(pr$wps) / min(pr$wps),
               cvRaking = sd(w_rk) / mean(w_rk), kishRaking = kish(w_rk),
               difMaxRaking = max(abs(w_rk - pr$wps))),
  celdasDetalle = list(celda = acs$celda, N = acs$count,
                       n = as.numeric(n_celda[acs$celda]),
                       w = acs$count / as.numeric(n_celda[acs$celda])),
  estimaciones = list(variable = FREQ,
                      sinPeso = as.numeric(est_pr[, "sinPeso"]),
                      eeSin   = as.numeric(est_pr[, "eeSin"]),
                      conPeso = as.numeric(est_pr[, "conPeso"]),
                      eeCon   = as.numeric(est_pr[, "eeCon"]),
                      raking  = as.numeric(est_pr[, "raking"]),
                      eeRak   = as.numeric(est_pr[, "eeRak"]))
)
cat("5 · post-estratificación: CV de los pesos", fmt(D$calibracion$pesos$cv, 4),
    "· razón máx/mín", fmt(D$calibracion$pesos$razon, 1), "\n")

# ===========================================================================
# 6 · Imputación: media, hot-deck, regresión e imputación múltiple
# ===========================================================================
im <- lee_lohr("impute")
im[im == -99] <- NA
D$imputacion <- list(
  n = nrow(im),
  faltantes = list(variable = c("education", "crime", "violcrime"),
                   n = c(sum(is.na(im$education)), sum(is.na(im$crime)),
                         sum(is.na(im$violcrime)))),
  personas = list(person = im$person, age = im$age, gender = im$gender,
                  education = im$education, crime = im$crime, violcrime = im$violcrime)
)

# --- Los cuatro métodos sobre education, con age y gender como auxiliares ---
falta <- is.na(im$education)
obs_e <- !falta

# (a) media
imp_media <- im$education
imp_media[falta] <- mean(im$education[obs_e])

# (b) hot-deck dentro de clases (grupo de edad × sexo), donante al azar
im$grupo <- paste(ifelse(im$age < 35, "joven", "mayor"), im$gender, sep = "-")
set.seed(SEMILLA)
imp_hd <- im$education
donantes <- integer(sum(falta))
for (i in which(falta)) {
  cand <- which(obs_e & im$grupo == im$grupo[i])
  if (!length(cand)) cand <- which(obs_e)          # clase vacía: se colapsa
  j <- cand[sample.int(length(cand), 1)]
  donantes[which(which(falta) == i)] <- im$person[j]
  imp_hd[i] <- im$education[j]
}

# (c) regresión (determinista)
mod <- lm(education ~ age + factor(gender), data = im[obs_e, ])
imp_reg <- im$education
imp_reg[falta] <- predict(mod, newdata = im[falta, ])

# (d) imputación múltiple: regresión con residuo extraído, m = 5
m_imp <- 5
set.seed(SEMILLA)
sigma_mod <- summary(mod)$sigma
imps <- lapply(seq_len(m_imp), function(b) {
  y <- im$education
  y[falta] <- predict(mod, newdata = im[falta, ]) + rnorm(sum(falta), 0, sigma_mod)
  y
})

resumen_met <- function(y) c(media = mean(y), sd = sd(y),
                             ee = sd(y) / sqrt(length(y)))
D$imputacion$metodos <- list(
  nombre = c("Solo casos completos", "Media", "Hot-deck", "Regresión", "Múltiple (m=5)"),
  media = c(mean(im$education[obs_e]), mean(imp_media), mean(imp_hd), mean(imp_reg),
            mean(sapply(imps, mean))),
  sd = c(sd(im$education[obs_e]), sd(imp_media), sd(imp_hd), sd(imp_reg),
         mean(sapply(imps, sd))),
  valoresImputados = list(media = round(imp_media[falta], 4), hotdeck = imp_hd[falta],
                          regresion = round(imp_reg[falta], 4),
                          multiple = lapply(imps, function(y) round(y[falta], 4))),
  donantes = donantes,
  quienesFaltan = im$person[falta],
  sigma = sigma_mod,
  coefs = list(nombre = names(coef(mod)), valor = as.numeric(coef(mod)))
)

# Reglas de Rubin sobre la media, a mano y con mitools.
qs <- sapply(imps, mean)
us <- sapply(imps, function(y) var(y) / length(y))
Q  <- mean(qs); U <- mean(us); B <- var(qs)
T_rubin <- U + (1 + 1 / m_imp) * B
gl_rubin <- (m_imp - 1) * (1 + U / ((1 + 1 / m_imp) * B))^2
mi_obj <- MIcombine(as.list(qs), as.list(us))
stopifnot(abs(coef(mi_obj) - Q) < 1e-10,
          abs(vcov(mi_obj)[1, 1] - T_rubin) < 1e-10)

# El error estándar que reportaría cada método si se creyera sus propios datos.
# La imputación determinista por regresión ENCOGE la dispersión: pone a los
# faltantes exactamente sobre la recta, sin el ruido que tendrían de verdad.
ee_ingenuo <- function(y) sd(y) / sqrt(length(y))
D$imputacion$eeReportado <- list(
  nombre = c("Casos completos", "Media", "Hot-deck", "Regresión", "Múltiple (Rubin)"),
  ee = c(ee_ingenuo(im$education[obs_e]), ee_ingenuo(imp_media), ee_ingenuo(imp_hd),
         ee_ingenuo(imp_reg), sqrt(T_rubin)),
  sd = c(sd(im$education[obs_e]), sd(imp_media), sd(imp_hd), sd(imp_reg),
         mean(sapply(imps, sd)))
)

D$imputacion$rubin <- list(
  m = m_imp, Q = Q, U = U, B = B, T = T_rubin,
  ee = sqrt(T_rubin), eeIngenua = sqrt(U), gl = gl_rubin,
  inflacion = sqrt(T_rubin) / sqrt(U),
  fmi = (1 + 1 / m_imp) * B / T_rubin,     # fracción de información perdida
  estimaciones = qs, varianzas = us
)
cat("6 · Rubin: ee ingenua", fmt(sqrt(U), 4), "· ee correcta", fmt(sqrt(T_rubin), 4),
    "· inflación", fmt(sqrt(T_rubin / U), 3), "\n")
cat("   ee reportado por método:",
    paste(sprintf("%s=%.4f", D$imputacion$eeReportado$nombre,
                  D$imputacion$eeReportado$ee), collapse = " · "), "\n")

# ===========================================================================
# 7 · Qué le pasa a la cobertura si se imputa una vez y se calla
# ===========================================================================
# Población agpop, MAS de n = 200, faltante MCAR en y con probabilidad q,
# imputado por regresión sobre x. Se mide la cobertura del intervalo del 95 %
# calculado (a) como si los imputados fueran datos y (b) con reglas de Rubin.
# El auxiliar aquí NO es acres87: con R² = 0,99 la imputación acierta casi
# exactamente y no habría nada que aprender. Se usa largef92 (número de granjas
# grandes), R² = 0,46, que es la fuerza que tiene un modelo de imputación real.
M_COB <- 2000
n_cob <- 200
q_falta <- 0.30
m_cob <- 5
R2_AUX <- summary(lm(acres92 ~ largef92, data = ag))$r.squared

cobertura <- function(q) {
  cub_com <- cub_ing <- cub_mi <- logical(M_COB)
  an_com <- an_ing <- an_mi <- numeric(M_COB)
  for (b in seq_len(M_COB)) {
    s <- sample.int(N_ag, n_cob)
    x <- ag$largef92[s]; y <- ag$acres92[s]
    falt <- runif(n_cob) < q
    if (sum(!falt) < 10) next
    fpc <- 1 - n_cob / N_ag
    # (0) referencia: los datos completos, sin faltantes. Mide cuánto de la
    #     descobertura es culpa de la asimetría de acres92 y no de imputar.
    e0 <- sqrt(var(y) / n_cob * fpc)
    cub_com[b] <- abs(mean(y) - mu_ag) < 1.96 * e0; an_com[b] <- 2 * 1.96 * e0
    fit <- lm(y[!falt] ~ x[!falt])
    pred <- coef(fit)[1] + coef(fit)[2] * x[falt]
    sg <- summary(fit)$sigma
    # (a) una sola imputación por regresión, tratada como dato
    yi <- y; yi[falt] <- pred
    m1 <- mean(yi); e1 <- sqrt(var(yi) / n_cob * fpc)
    cub_ing[b] <- abs(m1 - mu_ag) < 1.96 * e1; an_ing[b] <- 2 * 1.96 * e1
    # (b) m imputaciones con residuo extraído + reglas de Rubin
    qq <- uu <- numeric(m_cob)
    for (j in seq_len(m_cob)) {
      yj <- y; yj[falt] <- pred + rnorm(sum(falt), 0, sg)
      qq[j] <- mean(yj); uu[j] <- var(yj) / n_cob * fpc
    }
    Qb <- mean(qq); Tb <- mean(uu) + (1 + 1 / m_cob) * var(qq)
    glb <- (m_cob - 1) * (1 + mean(uu) / ((1 + 1 / m_cob) * var(qq)))^2
    tq <- qt(0.975, glb)
    cub_mi[b] <- abs(Qb - mu_ag) < tq * sqrt(Tb); an_mi[b] <- 2 * tq * sqrt(Tb)
  }
  list(completa = mean(cub_com), ingenua = mean(cub_ing), multiple = mean(cub_mi),
       anchoCompleta = mean(an_com), anchoIngenua = mean(an_ing),
       anchoMultiple = mean(an_mi))
}
set.seed(SEMILLA)
cob <- cobertura(q_falta)
# El error de Monte Carlo de una cobertura con M réplicas: sin él, ninguna de
# estas cifras es una medición (lección de la fase 4.5).
ee_cob <- sqrt(0.95 * 0.05 / M_COB)

D$cobertura <- list(
  M = M_COB, n = n_cob, q = q_falta, m = m_cob, N = N_ag, mu = mu_ag,
  auxiliar = "largef92", R2 = R2_AUX, eeMonteCarlo = ee_cob,
  nombres = c("Datos completos", "Imputación única", "Imputación múltiple"),
  coberturas = c(cob$completa, cob$ingenua, cob$multiple),
  anchos = c(cob$anchoCompleta, cob$anchoIngenua, cob$anchoMultiple)
)
cat("7 · cobertura del IC del 95 %: completos", fmt(cob$completa, 4),
    "· única", fmt(cob$ingenua, 4), "· múltiple", fmt(cob$multiple, 4),
    "(ee MC", fmt(ee_cob, 4), ")\n")

# ===========================================================================
# 8 · Diagnóstico: tasas AAPOR y R-indicator
# ===========================================================================
# Tasa de respuesta por escuela y R-indicator: R = 1 - 2 s(p), con s la
# desviación típica de las propensiones estimadas, ponderada por tamaño.
p_esc <- miL$ssteach / miL$popteach
w_esc_pop <- miL$popteach / sum(miL$popteach)
p_barra <- sum(w_esc_pop * p_esc)
s_p <- sqrt(sum(w_esc_pop * (p_esc - p_barra)^2))
R_ind <- 1 - 2 * s_p
stopifnot(abs(p_barra - tasa_L) < 1e-12)   # la media ponderada es la tasa global

cor_tam <- cor(miL$popteach, p_esc)
D$diagnostico <- list(
  escuelas = list(school = miL$school, pop = miL$popteach, tasa = p_esc),
  tasaGlobal = tasa_L, sdPropension = s_p, R = R_ind,
  corTamano = cor_tam,
  minTasa = min(p_esc), maxTasa = max(p_esc),
  escuelaMin = miL$school[which.min(p_esc)], escuelaMax = miL$school[which.max(p_esc)],
  # rango del R-indicator para el simulador: si todas las escuelas respondieran
  # a la misma tasa, R valdría 1
  Rmax = 1
)
cat("8 · R-indicator:", fmt(R_ind, 4), "· sd de la propensión:", fmt(s_p, 4),
    "· correlación tasa-tamaño:", fmt(cor_tam, 4), "\n")

# ===========================================================================
# 9 · El Literary Digest, con la fórmula del sesgo ya formalizada
# ===========================================================================
# Cifras de Lohr, 3.ª ed., ejercicio 15.14: votos reales y papeletas devueltas
# a los dos candidatos principales.
votos_R <- 27753000; votos_L <- 16675000
pap_R <- 966352;     pap_L <- 1286511
Nvot <- votos_R + votos_L
n_pap <- pap_R + pap_L
p_pob <- votos_L / Nvot          # proporción real de Landon
p_muestra <- pap_L / n_pap       # proporción de Landon entre los que devolvieron
f_dig <- n_pap / Nvot
sigma_y <- sqrt(p_pob * (1 - p_pob))
# Identidad de Meng (2018) / Lohr (15.12):
#   ybar_R - ybar_U = corr(R, y) * sqrt((1-f)/f) * sigma_y
rho_Ry <- (p_muestra - p_pob) / (sqrt((1 - f_dig) / f_dig) * sigma_y)
# Tamaño de un MAS con el mismo ECM: sigma^2/n = rho^2 (1-f)/f sigma^2
n_equiv <- f_dig / ((1 - f_dig) * rho_Ry^2)

# Segunda vía: el sesgo por la fórmula de siempre, con la tasa de respuesta.
# ybar_R - ybar_U = (1 - R)(ybar_R - ybar_NR), con ybar_NR deducido del resto.
p_no <- (Nvot * p_pob - n_pap * p_muestra) / (Nvot - n_pap)
sesgo_dig <- (1 - f_dig) * (p_muestra - p_no)
stopifnot(abs(sesgo_dig - (p_muestra - p_pob)) < 1e-12)

D$literary <- list(
  votosRoosevelt = votos_R, votosLandon = votos_L, N = Nvot,
  papeletasRoosevelt = pap_R, papeletasLandon = pap_L, n = n_pap,
  pPoblacion = p_pob, pMuestra = p_muestra, pNoRespondientes = p_no,
  f = f_dig, sesgo = p_muestra - p_pob, sigma = sigma_y,
  rho = rho_Ry, nEquivalente = n_equiv,
  # para el simulador: el ECM del censo defectuoso frente al de un MAS de n
  ns = round(exp(seq(log(5), log(5e6), length.out = 40)))
)
cat("9 · Literary Digest: corr(R,y) =", fmt(rho_Ry, 5),
    "· MAS equivalente: n =", fmt(n_equiv, 2), "\n")

# ===========================================================================
escribe_json(D, "cap8_datos")
cat("listo.\n")
