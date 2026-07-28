suppressMessages({library(survey); library(mitools)})
Sys.setlocale("LC_CTYPE", "en_US.UTF-8")
options(warn = 1)

cat("\n###BLOQUE-R1###\n")
# La encuesta de carga laboral docente de Gnap (1995), condado de Maricopa.
# Diseno previsto: conglomerados de una etapa, 23 escuelas de las 245 del
# estrato grande, y TODOS los profesores de cada escuela sorteada.
options(scipen = 8, digits = 7)
te <- read.csv("CSV data sets for SDA 3e/teachers.csv")
mi <- read.csv("CSV data sets for SDA 3e/teachmi.csv")

# Dos no respuestas distintas conviven en el mismo archivo.
# (1) De UNIDAD: profesores sorteados que nunca devolvieron el cuestionario.
tasa <- aggregate(cbind(popteach, ssteach) ~ dist, mi, sum)
tasa$tasa <- tasa$ssteach / tasa$popteach
tasa
c(profesores = sum(mi$popteach), devueltos = sum(mi$ssteach),
  tasa_global = sum(mi$ssteach) / sum(mi$popteach))

# (2) De ITEM: cuestionarios devueltos con preguntas en blanco. -9 es el
# codigo de faltante de este archivo; promediarlo es el error clasico.
sapply(c("hrwork", "size", "preprmin", "assist"), function(v) sum(te[[v]] == -9))
c(media_con_el_menos9 = mean(te$hrwork),
  media_sin_el_menos9 = mean(te$hrwork[te$hrwork != -9]))
#>    dist popteach ssteach      tasa
#> 1 large      628     250 0.3980892
#> 2 sm/me      126      60 0.4761905
#>  profesores   devueltos tasa_global 
#> 754.0000000 310.0000000   0.4111406 
#>   hrwork     size preprmin   assist 
#>        3       12       24       10 
#> media_con_el_menos9 media_sin_el_menos9 
#>            34.49968            34.92476 

cat("\n###BLOQUE-R2###\n")
# MCAR, MAR y MNAR no son tres nombres: son tres mecanismos que se pueden
# CONSTRUIR y distinguir. Sobre agpop, con y = acres92 y el auxiliar
# x = acres87, que se conoce para toda la muestra responda quien responda.
ag <- read.csv("CSV data sets for SDA 3e/agpop.csv")
N <- nrow(ag); mu <- mean(ag$acres92)

# Clases de ajuste: quintiles de x. Es lo que un analista tiene de verdad.
clase_x <- cut(ag$acres87, quantile(ag$acres87, seq(0, 1, 0.2)),
               include.lowest = TRUE, labels = FALSE)

# Los cuatro mecanismos comparten el mismo perfil de propension y solo
# cambian en QUE variable ordena las clases.
PERFIL <- c(0.85, 0.70, 0.60, 0.50, 0.35)

# MNAR: la propension depende de y DENTRO de cada clase de ajuste, es decir,
# de la parte de y que el auxiliar no ve. Esa es la definicion operativa.
clase_dentro <- integer(N)
for (cl in sort(unique(clase_x))) {
  idx <- which(clase_x == cl)
  q <- quantile(ag$acres92[idx], seq(0, 1, 0.2))
  clase_dentro[idx] <- cut(ag$acres92[idx], q, include.lowest = TRUE, labels = FALSE)
}
zx <- as.numeric(scale(rank(ag$acres87)))
a_fino <- uniroot(function(a) mean(plogis(a + 1.6 * -zx)) - 0.6, c(-8, 8))$root

props <- list(MCAR = rep(0.6, N), MAR = PERFIL[clase_x],
              `MAR fino` = plogis(a_fino + 1.6 * -zx), MNAR = PERFIL[clase_dentro])

# La prueba de que MNAR esta bien construido: su propension media es la misma
# en las cinco clases de ajuste, asi que el ajuste no puede verla.
prop_media <- sapply(props, function(p) tapply(p, clase_x, mean))
rownames(prop_media) <- paste("clase de x", 1:5)
round(prop_media, 4)
#>              MCAR  MAR MAR fino   MNAR
#> clase de x 1  0.6 0.85   0.9429 0.6004
#> clase de x 2  0.6 0.70   0.8463 0.6000
#> clase de x 3  0.6 0.60   0.6497 0.6004
#> clase de x 4  0.6 0.50   0.3861 0.6000
#> clase de x 5  0.6 0.35   0.1750 0.6004

cat("\n###BLOQUE-R3###\n")
# Que sesgo produce cada mecanismo, medido con 2000 replicas. La funcion
# devuelve las dos cosas a la vez: sin ajustar y ajustando por clases de x.
# El modulo 3 leera la segunda columna.
simula <- function(p, M = 2000, n = 300) {
  sin_aj <- con_aj <- numeric(M)
  for (m in seq_len(M)) {
    s <- sample.int(N, n); r <- runif(n) < p[s]
    y <- ag$acres92[s]; cl <- clase_x[s]
    sin_aj[m] <- mean(y[r])
    tasa_cl <- tapply(r, cl, mean)
    tasa_cl[is.na(tasa_cl) | tasa_cl == 0] <- mean(r)
    w <- 1 / tasa_cl[as.character(cl[r])]
    con_aj[m] <- sum(w * y[r]) / sum(w)
  }
  c(sesgo_sin = mean(sin_aj) - mu, ee_sin = sd(sin_aj) / sqrt(M),
    sesgo_con = mean(con_aj) - mu, ee_con = sd(con_aj) / sqrt(M))
}
set.seed(2026)
MEC <- t(sapply(props, simula))
round(MEC[, c("sesgo_sin", "ee_sin")], 1)
# Sin barra de error no hay medicion: con MCAR el "sesgo" es ruido.
round(MEC[, "sesgo_sin"] / MEC[, "ee_sin"], 1)
#>          sesgo_sin ee_sin
#> MCAR         139.8  664.6
#> MAR       -78377.9  550.4
#> MAR fino -141526.9  369.3
#> MNAR      -33435.6  575.4
#>     MCAR      MAR MAR fino     MNAR 
#>      0.2   -142.4   -383.3    -58.1 

cat("\n###BLOQUE-R4###\n")
# El caso raro y valioso: Gnap submuestreo a los NO respondientes del estrato
# grande y publico sus datos. Se puede MEDIR la diferencia, no suponerla.
nr <- read.csv("CSV data sets for SDA 3e/teachnr.csv")
te[te == -9] <- NA; nr[nr == -9] <- NA
teL <- te[te$dist == "large", ]

comp <- t(sapply(c("hrwork", "size", "preprmin", "assist"), function(v) {
  a <- teL[[v]][!is.na(teL[[v]])]; b <- nr[[v]][!is.na(nr[[v]])]
  ee <- sqrt(var(a) / length(a) + var(b) / length(b))
  c(n_R = length(a), media_R = mean(a), n_NR = length(b), media_NR = mean(b),
    dif = mean(a) - mean(b), t = (mean(a) - mean(b)) / ee)
}))
round(comp, 3)
#>          n_R media_R n_NR media_NR     dif      t
#> hrwork   247  34.633   26   36.463  -1.830 -4.734
#> size     243  26.041   25   24.920   1.121  1.000
#> preprmin 236 170.814   26  160.192  10.621  0.817
#> assist   243  55.134   26  152.308 -97.174 -2.186

cat("\n###BLOQUE-R5###\n")
# La formula del sesgo de no respuesta:
#   sesgo(ybar_R) = (1 - R) (ybar_R - ybar_NR)
# con R la tasa de respuesta. Aqui las tres piezas se conocen.
miL <- mi[mi$dist == "large", ]
M_ <- sum(miL$popteach); MR <- sum(miL$ssteach); R_ <- MR / M_
yR <- mean(teL$hrwork, na.rm = TRUE); yNR <- mean(nr$hrwork, na.rm = TRUE)
sesgo <- (1 - R_) * (yR - yNR)
c(tasa = R_, ybar_R = yR, ybar_NR = yNR, sesgo = sesgo)

# El estimador de dos fases (Hansen-Hurwitz 1946) usa las dos submuestras.
# Doble via: media ponderada por tasas y media ponderada por conteos.
dos_fases <- R_ * yR + (1 - R_) * yNR
c(dos_fases = dos_fases,
  por_conteos = (MR * yR + (M_ - MR) * yNR) / M_,
  brecha = yR - dos_fases)

# Que n haria falta para que el error estandar iguale a ese sesgo.
c(sd_y = sd(teL$hrwork, na.rm = TRUE),
  n_donde_empatan = ceiling(var(teL$hrwork, na.rm = TRUE) / sesgo^2))
#>       tasa     ybar_R    ybar_NR      sesgo 
#>  0.3980892 34.6329960 36.4634615 -1.1017771 
#>   dos_fases por_conteos      brecha 
#>   35.734773   35.734773   -1.101777 
#>            sd_y n_donde_empatan 
#>        3.476573       10.000000 

cat("\n###BLOQUE-R6###\n")
# El Literary Digest, ahora con la formula. Cifras de Lohr 3a ed., ej. 15.14:
# votos reales y papeletas devueltas a los dos candidatos principales.
votos <- c(Roosevelt = 27753000, Landon = 16675000)
papel <- c(Roosevelt = 966352,   Landon = 1286511)
Nv <- sum(votos); nv <- sum(papel)
p_pob <- unname(votos["Landon"] / Nv)  # Landon de verdad
p_mue <- unname(papel["Landon"] / nv)  # Landon entre quienes devolvieron
f <- nv / Nv
c(N = Nv, n = nv, fraccion = f, p_real = p_pob, p_encuesta = p_mue,
  error = p_mue - p_pob)

# Identidad de Meng (2018), que Lohr da como (15.12):
#   ybar_R - ybar_U = corr(R, y) * sqrt((1-f)/f) * sigma_y
sigma <- sqrt(p_pob * (1 - p_pob))
rho <- (p_mue - p_pob) / (sqrt((1 - f) / f) * sigma)
# Y el tamano de un MAS con el mismo error cuadratico medio.
c(corr_R_y = rho, mas_equivalente = f / ((1 - f) * rho^2))
#>                 N                 n          fraccion            p_real 
#> 44428000.00000000  2252863.00000000        0.05070818        0.37532637 
#>        p_encuesta             error 
#>        0.57105603        0.19572966 
#>        corr_R_y mas_equivalente 
#>      0.09342533      6.11996550 

cat("\n###BLOQUE-R7###\n")
# Ajuste por clases de respuesta sobre la encuesta real. El peso de diseno es
# el mismo para todos: 245 escuelas / 23 sorteadas.
d0 <- 245 / 23
teL$pop  <- miL$popteach[match(teL$school, miL$school)]
teL$devu <- miL$ssteach[match(teL$school, miL$school)]

# Clases por tamano de escuela (terciles), que es la variable auxiliar
# disponible para respondientes Y no respondientes.
miL$clase <- cut(miL$popteach, quantile(miL$popteach, c(0, 1/3, 2/3, 1)),
                 include.lowest = TRUE, labels = FALSE)
tasa_cl <- tapply(miL$ssteach, miL$clase, sum) / tapply(miL$popteach, miL$clase, sum)
teL$clase <- miL$clase[match(teL$school, miL$school)]

teL$w_sin   <- d0                                   # solo diseno
teL$w_clase <- d0 / tasa_cl[as.character(teL$clase)] # ajustado por clase
teL$w_esc   <- d0 / (teL$devu / teL$pop)             # clase = escuela
teL$fpc <- 245
obs <- !is.na(teL$hrwork)

est <- function(col) {
  dis <- svydesign(id = ~school, weights = as.formula(paste0("~", col)),
                   fpc = ~fpc, data = teL[obs, ])
  m <- svymean(~hrwork, dis)
  c(estimacion = as.numeric(m), ee = as.numeric(SE(m)),
    kish = sum(obs) * sum(teL[[col]][obs]^2) / sum(teL[[col]][obs])^2)
}
round(rbind(`sin ajustar` = est("w_sin"), `clases por tamano` = est("w_clase"),
            `clase = escuela` = est("w_esc"),
            `dos fases (con teachnr)` = c(dos_fases, NA, NA)), 4)
#>                         estimacion     ee   kish
#> sin ajustar                34.6330 0.5343 1.0000
#> clases por tamano          34.3677 0.5837 1.0654
#> clase = escuela            33.8206 0.7086 1.6143
#> dos fases (con teachnr)    35.7348     NA     NA

cat("\n###BLOQUE-R8###\n")
# Doble via obligatoria: el mismo error estandar por la formula del estimador
# de razon sobre conglomerados (capitulo 5) y por survey.
ee_mano <- function(col) {
  d <- teL[obs, ]
  ti <- tapply(d[[col]] * d$hrwork, d$school, sum)
  mm <- tapply(d[[col]], d$school, sum)
  yb <- sum(ti) / sum(mm); e <- ti - yb * mm; n <- length(ti)
  sqrt((1 - n / 245) * (n / (n - 1)) * sum(e^2) / sum(mm)^2)
}
c(a_mano = ee_mano("w_sin"), survey = unname(est("w_sin")["ee"]),
  diferencia = unname(abs(ee_mano("w_sin") - est("w_sin")["ee"])))
#>       a_mano       survey   diferencia 
#> 5.342515e-01 5.342515e-01 4.329870e-15 

cat("\n###BLOQUE-R9###\n")
# Y ahora la segunda columna de la simulacion del modulo 1: que pasa cuando
# se ajusta por clases de la auxiliar. La respuesta depende del mecanismo.
round(MEC[, c("sesgo_sin", "sesgo_con", "ee_con")], 1)
# Porcentaje del sesgo que el ajuste elimina (NA si no habia sesgo medible).
round(100 * ifelse(abs(MEC[, "sesgo_sin"]) < 2 * MEC[, "ee_sin"], NA,
                   1 - MEC[, "sesgo_con"] / MEC[, "sesgo_sin"]), 1)
#>          sesgo_sin sesgo_con ee_con
#> MCAR         139.8     -46.6  603.4
#> MAR       -78377.9     338.1  715.1
#> MAR fino -141526.9  -26069.8  837.2
#> MNAR      -33435.6  -33815.7  504.1
#>     MCAR      MAR MAR fino     MNAR 
#>       NA    100.4     81.6     -1.1 

cat("\n###BLOQUE-R10###\n")
# Calibrar contra totales externos: el panel de "respondientes profesionales"
# de Zhang et al. (2020) frente a los totales de la ACS de 2011.
pr  <- read.csv("CSV data sets for SDA 3e/profresp.csv")
acs <- read.csv("CSV data sets for SDA 3e/profrespacs.csv")

# Primer tropiezo real: el cuestionario codifica age4cat y el control, age3cat,
# y el codebook no viaja con los datos. Hay tres colapsos ordenados posibles.
p_acs <- prop.table(tapply(acs$count, acs$age3cat, sum))
colapsos <- list(`{1,2}{3}{4}` = c(1,1,2,3), `{1}{2,3}{4}` = c(1,2,2,3),
                 `{1}{2}{3,4}` = c(1,2,3,3))
round(t(sapply(colapsos, function(m) {
  p <- prop.table(table(m[pr$age4cat]))
  c(p, dif_max = max(abs(p - p_acs)))
})), 4)
round(p_acs, 4)
# Solo uno queda a menos de 3,5 puntos; los otros dos se van a 22 y 31.
pr$age3cat <- colapsos[["{1}{2,3}{4}"]][pr$age4cat]
#>                  1     2      3 dif_max
#> {1,2}{3}{4} 0.6152 0.245 0.1398  0.3091
#> {1}{2,3}{4} 0.3182 0.542 0.1398  0.0344
#> {1}{2}{3,4} 0.3182 0.297 0.3848  0.2228
#>      1      2      3 
#> 0.3061 0.5198 0.1741 

cat("\n###BLOQUE-R11###\n")
# Post-estratificacion a las 18 celdas genero x edad x educacion. El panel no
# tiene diseno: se arranca con peso uniforme y la calibracion hace el trabajo.
Nacs <- sum(acs$count)
pr$w0 <- Nacs / nrow(pr)
pr$celda <- with(pr, paste(gender, age3cat, edu3cat, sep = "-"))
acs$celda <- with(acs, paste(gender, age3cat, edu3cat, sep = "-"))

dis0 <- svydesign(id = ~1, weights = ~w0, data = pr)
dis_ps <- postStratify(dis0, ~celda, data.frame(celda = acs$celda, Freq = acs$count))
w <- weights(dis_ps)

# Doble via: el peso de una celda es N_c/n_c, sin mas.
a_mano <- acs$count[match(pr$celda, acs$celda)] / as.numeric(table(pr$celda)[pr$celda])
c(dif_max_vs_survey = max(abs(w - a_mano)), suma_pesos = sum(w), total_acs = Nacs)
c(peso_min = min(w), peso_max = max(w), razon = max(w) / min(w),
  cv = sd(w) / mean(w), kish = length(w) * sum(w^2) / sum(w)^2)

# Que tan lejos estaba el panel de la poblacion, margen a margen.
rbind(encuesta = prop.table(table(pr$edu3cat)),
      acs = prop.table(tapply(acs$count, acs$edu3cat, sum)))
#> dif_max_vs_survey        suma_pesos         total_acs 
#>      4.802132e-10      2.376812e+08      2.376812e+08 
#>       peso_min       peso_max          razon             cv           kish 
#>  54562.3151515 401464.0285714      7.3578994      0.6319579      1.3992046 
#>                  1         2         3
#> encuesta 0.2142263 0.4180532 0.3677205
#> acs      0.4286772 0.3115742 0.2597487

cat("\n###BLOQUE-R12###\n")
# El raking usa solo los MARGENES, que es lo que suele conocerse. Con el cruce
# completo disponible se puede comparar: cuanto se pierde por no tenerlo.
dis_rk <- rake(dis0,
  list(~gender, ~age3cat, ~edu3cat),
  list(data.frame(gender = 1:2, Freq = as.numeric(tapply(acs$count, acs$gender, sum))),
       data.frame(age3cat = 1:3, Freq = as.numeric(tapply(acs$count, acs$age3cat, sum))),
       data.frame(edu3cat = 1:3, Freq = as.numeric(tapply(acs$count, acs$edu3cat, sum)))))
wr <- weights(dis_rk)
c(cv_postestratificado = sd(w) / mean(w), cv_raking = sd(wr) / mean(wr),
  dif_maxima_entre_pesos = max(abs(wr - w)))

# Y el efecto sobre lo que se quiere estimar.
round(t(sapply(paste0("freq_q", 1:5), function(v) {
  f <- as.formula(paste0("~", v))
  c(sin_peso = mean(pr[[v]]), post = as.numeric(svymean(f, dis_ps)),
    raking = as.numeric(svymean(f, dis_rk)),
    ee_sin = sd(pr[[v]]) / sqrt(nrow(pr)), ee_post = as.numeric(SE(svymean(f, dis_ps))))
})), 4)
#>   cv_postestratificado              cv_raking dif_maxima_entre_pesos 
#>              0.6319579              0.5404357         170701.9223452 
#>         sin_peso   post raking ee_sin ee_post
#> freq_q1   3.6127 3.6396 3.6868 0.1306  0.1431
#> freq_q2   8.0017 7.8974 7.9189 0.1892  0.2222
#> freq_q3   5.6543 5.5322 5.5541 0.1330  0.1870
#> freq_q4   6.3465 6.2046 6.2568 0.1060  0.1228
#> freq_q5   5.4318 5.6670 5.5039 0.3696  0.7228

cat("\n###BLOQUE-R13###\n")
# Imputacion de item, con las 20 personas del ejemplo de Lohr a la vista.
im <- read.csv("CSV data sets for SDA 3e/impute.csv")
im[im == -99] <- NA
colSums(is.na(im))
falta <- is.na(im$education); im[falta, c("person", "age", "gender", "education")]

# (a) media de los observados y (b) regresion determinista sobre age y gender.
mod <- lm(education ~ age + factor(gender), data = im[!falta, ])
round(coef(mod), 4)
imp_media <- im$education; imp_media[falta] <- mean(im$education[!falta])
imp_reg <- im$education; imp_reg[falta] <- predict(mod, im[falta, ])
round(rbind(media = imp_media[falta], regresion = imp_reg[falta]), 4)
#>    person       age    gender education     crime violcrime 
#>         0         0         0         3         2         4 
#>   person age gender education
#> 2      2  45      F        NA
#> 4      4  21      F        NA
#> 6      6  41      F        NA
#>     (Intercept)             age factor(gender)M 
#>          9.7002          0.0521          2.0275 
#>              [,1]    [,2]    [,3]
#> media     12.7059 12.7059 12.7059
#> regresion 12.0428 10.7934 11.8346

cat("\n###BLOQUE-R14###\n")
# (c) Hot-deck: se toma prestado el valor de un DONANTE real de la misma
# clase. No inventa valores imposibles, que es su gracia frente a la regresion.
im$grupo <- paste(ifelse(im$age < 35, "joven", "mayor"), im$gender, sep = "-")
set.seed(2026)
imp_hd <- im$education; donante <- integer(0)
for (i in which(falta)) {
  cand <- which(!falta & im$grupo == im$grupo[i])
  if (!length(cand)) cand <- which(!falta)
  j <- cand[sample.int(length(cand), 1)]
  donante <- c(donante, im$person[j]); imp_hd[i] <- im$education[j]
}
data.frame(persona = im$person[falta], grupo = im$grupo[falta],
           donante = donante, valor = imp_hd[falta])
#>   persona   grupo donante valor
#> 1       2 mayor-F       9    13
#> 2       4 joven-F      12    12
#> 3       6 mayor-F       9    13

cat("\n###BLOQUE-R15###\n")
# Aqui esta el problema. Cada metodo produce una media parecida... y un error
# estandar que MIENTE, porque trata como dato lo que es una conjetura.
ee <- function(y) sd(y) / sqrt(length(y))
round(rbind(
  media_estimada = c(completos = mean(im$education[!falta]), media = mean(imp_media),
                     hotdeck = mean(imp_hd), regresion = mean(imp_reg)),
  desviacion = c(sd(im$education[!falta]), sd(imp_media), sd(imp_hd), sd(imp_reg)),
  ee_reportado = c(ee(im$education[!falta]), ee(imp_media), ee(imp_hd), ee(imp_reg))
), 4)
# Imputar y callarse deja un ee MENOR que el de tirar los incompletos, con
# tres valores inventados dentro. Ese es exactamente el fraude estadistico.
#>                completos   media hotdeck regresion
#> media_estimada   12.7059 12.7059 12.7000   12.5335
#> desviacion        2.6402  2.4228  2.4301    2.4687
#> ee_reportado      0.6403  0.5418  0.5434    0.5520

cat("\n###BLOQUE-R16###\n")
# Imputacion multiple: m conjuntos completos, cada uno con su residuo
# extraido al azar, y las reglas de Rubin para combinar.
m <- 5
set.seed(2026)
sg <- summary(mod)$sigma
imps <- lapply(seq_len(m), function(b) {
  y <- im$education
  y[falta] <- predict(mod, im[falta, ]) + rnorm(sum(falta), 0, sg)
  y
})
qs <- sapply(imps, mean); us <- sapply(imps, function(y) var(y) / length(y))
Q <- mean(qs); U <- mean(us); B <- var(qs)
T_ <- U + (1 + 1/m) * B          # varianza total de Rubin
c(Q = Q, dentro_U = U, entre_B = B, total_T = T_,
  ee_correcto = sqrt(T_), ee_si_se_ignora_B = sqrt(U),
  fmi = (1 + 1/m) * B / T_)

# Doble via: mitools::MIcombine, que es lo que usa survey por dentro.
# El paquete viene con survey, pero hay que cargarlo aparte.
suppressMessages(library(mitools))
comb <- MIcombine(as.list(qs), as.list(us))
c(coef = as.numeric(coef(comb)), var = as.numeric(vcov(comb)),
  dif = abs(as.numeric(vcov(comb)) - T_))
#>                 Q          dentro_U           entre_B           total_T 
#>       12.28234736        0.38619025        0.02145037        0.41193070 
#>       ee_correcto ee_si_se_ignora_B               fmi 
#>        0.64181828        0.62144207        0.06248733 
#>       coef        var        dif 
#> 12.2823474  0.4119307  0.0000000 

cat("\n###BLOQUE-R17###\n")
# Y la prueba de que importa: 2000 replicas midiendo si el intervalo del 95%
# contiene la media verdadera. El auxiliar es largef92 (R2 = 0,46), que es la
# fuerza que tiene un modelo de imputacion real; con acres87 (R2 = 0,99) la
# imputacion acertaria casi siempre y no habria nada que ver.
set.seed(2026)
M <- 2000; n <- 200; q <- 0.30; m <- 5
cub <- matrix(FALSE, M, 3, dimnames = list(NULL, c("completos", "unica", "multiple")))
for (b in seq_len(M)) {
  s <- sample.int(N, n); x <- ag$largef92[s]; y <- ag$acres92[s]
  fal <- runif(n) < q; fpc <- 1 - n / N
  cub[b, 1] <- abs(mean(y) - mu) < 1.96 * sqrt(var(y) / n * fpc)
  fit <- lm(y[!fal] ~ x[!fal]); pred <- coef(fit)[1] + coef(fit)[2] * x[fal]
  yi <- y; yi[fal] <- pred
  cub[b, 2] <- abs(mean(yi) - mu) < 1.96 * sqrt(var(yi) / n * fpc)
  qq <- uu <- numeric(m)
  for (j in seq_len(m)) {
    yj <- y; yj[fal] <- pred + rnorm(sum(fal), 0, summary(fit)$sigma)
    qq[j] <- mean(yj); uu[j] <- var(yj) / n * fpc
  }
  Tb <- mean(uu) + (1 + 1/m) * var(qq)
  gl <- (m - 1) * (1 + mean(uu) / ((1 + 1/m) * var(qq)))^2
  cub[b, 3] <- abs(mean(qq) - mu) < qt(0.975, gl) * sqrt(Tb)
}
round(colMeans(cub), 4)
c(ee_monte_carlo = sqrt(0.95 * 0.05 / M))
#> completos     unica  multiple 
#>    0.9265    0.8715    0.9115 
#> ee_monte_carlo 
#>    0.004873397 

cat("\n###BLOQUE-R18###\n")
# Diagnostico: no basta la tasa global. El R-indicator mide cuanto VARIA la
# propension a responder, que es lo que produce sesgo.
p_esc <- miL$ssteach / miL$popteach
wpop <- miL$popteach / sum(miL$popteach)
p_bar <- sum(wpop * p_esc); s_p <- sqrt(sum(wpop * (p_esc - p_bar)^2))
c(tasa_global = p_bar, sd_propension = s_p, R_indicator = 1 - 2 * s_p,
  tasa_min = min(p_esc), tasa_max = max(p_esc),
  correlacion_con_el_tamano = cor(miL$popteach, p_esc))
# Dos encuestas con la misma tasa global pueden tener R muy distintos: la que
# reparte la no respuesta por igual es mucho menos peligrosa.
#>               tasa_global             sd_propension               R_indicator 
#>                0.39808917                0.26334172                0.47331655 
#>                  tasa_min                  tasa_max correlacion_con_el_tamano 
#>                0.06666667                1.00000000               -0.25405547 

cat("\n###BLOQUE-R19###\n")
# IA · Afirmacion 1: "con una muestra suficientemente grande el sesgo de no
# respuesta se diluye". Se refuta con la formula, que no contiene a n.
n_seq <- c(25, 100, 400, 1600, 6400, 25600)
tab <- rbind(ee = sd(teL$hrwork, na.rm = TRUE) / sqrt(n_seq),
             sesgo = rep(abs(sesgo), length(n_seq)))
colnames(tab) <- n_seq
round(rbind(tab, raiz_ecm = sqrt(tab["ee", ]^2 + tab["sesgo", ]^2)), 4)
# El error estandar cae con la raiz de n; el sesgo no se mueve. A partir de
# n = 10 el sesgo ya domina, y de ahi en adelante mas datos solo estrechan un
# intervalo centrado en el sitio equivocado.
#>              25    100    400   1600   6400  25600
#> ee       0.6953 0.3477 0.1738 0.0869 0.0435 0.0217
#> sesgo    1.1018 1.1018 1.1018 1.1018 1.1018 1.1018
#> raiz_ecm 1.3028 1.1553 1.1154 1.1052 1.1026 1.1020

cat("\n###BLOQUE-R20###\n")
# IA · Afirmacion 2: "ponderar por las variables demograficas corrige la no
# respuesta". Solo si el mecanismo es MAR. La simulacion ya lo midio.
round(rbind(sesgo_sin_ajuste = MEC[, "sesgo_sin"],
            sesgo_con_ajuste = MEC[, "sesgo_con"]), 1)
# Y sobre la encuesta real, donde la verdad se conoce por la submuestra:
round(c(sin_ajustar = as.numeric(est("w_sin")["estimacion"]),
        ajustado = as.numeric(est("w_clase")["estimacion"]),
        verdad_aproximada = dos_fases), 4)
#>                   MCAR      MAR  MAR fino     MNAR
#> sesgo_sin_ajuste 139.8 -78377.9 -141526.9 -33435.6
#> sesgo_con_ajuste -46.6    338.1  -26069.8 -33815.7
#>       sin_ajustar          ajustado verdad_aproximada 
#>           34.6330           34.3677           35.7348 

cat("\n###BLOQUE-R21###\n")
# IA · Afirmacion 3: "con una tasa de respuesta del 80% no hay que preocuparse
# por el sesgo". La tasa es solo UNO de los dos factores del producto.
esc <- expand.grid(tasa = c(0.80, 0.40), brecha = c(0.5, 5))
esc$sesgo <- (1 - esc$tasa) * esc$brecha
esc
# Una encuesta con el 80% de respuesta y una brecha de 5 unidades sesga el
# doble que una con el 40% y una brecha de 1,5. La tasa sola no dice nada:
# hace falta una estimacion de la brecha, y eso pide datos de los ausentes.
#>   tasa brecha sesgo
#> 1  0.8    0.5   0.1
#> 2  0.4    0.5   0.3
#> 3  0.8    5.0   1.0
#> 4  0.4    5.0   3.0

cat("\n###BLOQUE-R22###\n")
# EJERCICIO 1 · La misma pregunta por telefono y por internet.
on <- read.csv("CSV data sets for SDA 3e/intellonline.csv")
tl <- read.csv("CSV data sets for SDA 3e/intelltel.csv")
c(n_online = nrow(on), n_telefono = nrow(tl))
round(rbind(online = prop.table(table(on$education)),
            telefono = prop.table(table(tl$education))), 4)
round(rbind(
  online = c(sin_peso = mean(on$int), con_peso = weighted.mean(on$int, on$postwt),
             w_min = min(on$postwt), w_max = max(on$postwt),
             razon = max(on$postwt) / min(on$postwt)),
  telefono = c(mean(tl$int), weighted.mean(tl$int, tl$postwt),
               min(tl$postwt), max(tl$postwt), max(tl$postwt) / min(tl$postwt))
), 4)
#>   n_online n_telefono 
#>        983       1838 
#>          College Grad Grad School MISSING No College Some College
#> online         0.2452      0.1699  0.0010     0.1231       0.4608
#> telefono       0.1632      0.2024  0.0082     0.2612       0.3651
#>          sin_peso con_peso  w_min  w_max   razon
#> online     2.4720   2.5262 0.4354 6.7294 15.4545
#> telefono   2.4347   2.3337 0.1547 1.9939 12.8861

cat("\n###BLOQUE-R23###\n")
# EJERCICIO 2 · No respuesta de item en preprmin: 24 de 310 en blanco.
# Casos completos frente a imputar por la media de la escuela.
te2 <- read.csv("CSV data sets for SDA 3e/teachers.csv")
te2[te2 == -9] <- NA
f2 <- is.na(te2$preprmin)
med_esc <- tapply(te2$preprmin, te2$school, mean, na.rm = TRUE)
imp <- te2$preprmin
imp[f2] <- med_esc[as.character(te2$school[f2])]
round(c(faltantes = sum(f2), completos = mean(te2$preprmin, na.rm = TRUE),
        imputado = mean(imp, na.rm = TRUE),
        ee_completos = sd(te2$preprmin, na.rm = TRUE) / sqrt(sum(!f2)),
        ee_imputado = sd(imp, na.rm = TRUE) / sqrt(sum(!is.na(imp)))), 4)
#>    faltantes    completos     imputado ee_completos  ee_imputado 
#>      24.0000     177.8916     178.1154       6.6021       6.1886 

cat("\n###BLOQUE-R24###\n")
# EJERCICIO 3 · Hot-deck sobre la Survey of Youth in Custody: la variable
# livewith (con quien vivia) trae 43 codigos 9 y 4 codigos 99.
sy <- read.csv("CSV data sets for SDA 3e/syc.csv")
sy$lw <- ifelse(sy$livewith %in% c(9, 99), NA, sy$livewith)
c(n = nrow(sy), faltantes = sum(is.na(sy$lw)))
set.seed(2026)
sy$clase <- paste(sy$gender, sy$age >= 17, sep = "-")
sy$lw_imp <- sy$lw
for (i in which(is.na(sy$lw))) {
  cand <- which(!is.na(sy$lw) & sy$clase == sy$clase[i])
  sy$lw_imp[i] <- sy$lw[cand[sample.int(length(cand), 1)]]
}
round(rbind(completos = prop.table(table(sy$lw)),
            imputado = prop.table(table(sy$lw_imp))), 4)
#>         n faltantes 
#>      2621        47 
#>                1      2      3      4      5      6      7      8
#> completos 0.4992 0.0548 0.3061 0.0936 0.0268 0.0023 0.0155 0.0016
#> imputado  0.4983 0.0542 0.3071 0.0946 0.0267 0.0023 0.0153 0.0015

cat("\n###BLOQUE-R25###\n")
# EJERCICIO 4 · La variable con la brecha mas grande del archivo: assist,
# minutos semanales de auxiliar en el aula.
aR <- teL$assist[!is.na(teL$assist)]; aNR <- nr$assist[!is.na(nr$assist)]
c(media_R = mean(aR), media_NR = mean(aNR), razon = mean(aNR) / mean(aR),
  sesgo = (1 - R_) * (mean(aR) - mean(aNR)),
  sesgo_relativo = (1 - R_) * (mean(aR) - mean(aNR)) /
                   (R_ * mean(aR) + (1 - R_) * mean(aNR)))
teL$w_a <- teL$w_clase
oa <- !is.na(teL$assist)
disa <- svydesign(id = ~school, weights = ~w_a, fpc = ~fpc, data = teL[oa, ])
round(c(ajustado = as.numeric(svymean(~assist, disa)),
        dos_fases = R_ * mean(aR) + (1 - R_) * mean(aNR)), 4)
#>        media_R       media_NR          razon          sesgo sesgo_relativo 
#>     55.1337449    152.3076923      2.7625131    -58.4900512     -0.5147694 
#>  ajustado dos_fases 
#>   51.3946  113.6238 
