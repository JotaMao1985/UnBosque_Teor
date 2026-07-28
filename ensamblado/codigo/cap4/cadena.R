suppressMessages({library(survey); library(sampling); library(TeachingSampling); library(jsonlite)})
Sys.setlocale("LC_CTYPE", "en_US.UTF-8")
options(warn = 1, survey.lonely.psu = "adjust")

cat("\n###BLOQUE-R1###\n")
# agpop y agstrat: la poblacion del curso y la muestra ESTRATIFICADA oficial
# de Lohr. agstrat no es agsrs: se sorteo por separado dentro de cada region.
agpop   <- read.csv("CSV data sets for SDA 3e/agpop.csv")
agstrat <- read.csv("CSV data sets for SDA 3e/agstrat.csv")
N <- nrow(agpop)

# La region parte los 3078 condados en 4 estratos. Las medias poblacionales
# estan lejisimas unas de otras: un condado del Oeste siembra en promedio
# OCHO veces mas que uno del Nordeste. Esa heterogeneidad ENTRE regiones es
# la que el estratificado va a convertir en precision.
data.frame(
  Nh    = tapply(agpop$acres92, agpop$region, length),
  media = round(tapply(agpop$acres92, agpop$region, mean), 0),
  sd    = round(tapply(agpop$acres92, agpop$region, sd), 0)
)
#>      Nh  media     sd
#> NC 1054 325951 271303
#> NE  220  90619  79365
#> S  1382 199140 243956
#> W   422 723344 835639

cat("\n###BLOQUE-R2###\n")
# El diseno se define POR ESTRATO: dentro de la region h se hace un MAS de
# n_h condados entre los N_h que hay. La probabilidad de inclusion de un
# condado depende solo de su estrato:
#   pi_k = n_h / N_h    y el peso de diseno es  w_k = 1/pi_k = N_h/n_h.
Nh <- table(agpop$region)
nh <- table(agstrat$region)
data.frame(region = names(Nh), Nh = as.numeric(Nh), nh = as.numeric(nh),
           pi = round(as.numeric(nh) / as.numeric(Nh), 5),
           peso = round(as.numeric(Nh) / as.numeric(nh), 5))
#>   region   Nh  nh      pi     peso
#> 1     NC 1054 103 0.09772 10.23301
#> 2     NE  220  21 0.09545 10.47619
#> 3      S 1382 135 0.09768 10.23704
#> 4      W  422  41 0.09716 10.29268

# agstrat ya trae ese peso en la columna strwt, y los pesos reconstruyen
# el tamano de la poblacion: la muestra "representa" a N condados.
sum(agstrat$strwt)
#> [1] 3078

cat("\n###BLOQUE-R3###\n")
# El estimador estratificado ES el pi-estimador del capitulo 2 con
# pi_k = n_h/N_h: la media estimada es la suma ponderada de las medias por
# estrato, y la varianza se suma estrato a estrato, cada uno con su fpc.
Wh     <- as.numeric(Nh) / N
ybar_h <- tapply(agstrat$acres92, agstrat$region, mean)
s2_h   <- tapply(agstrat$acres92, agstrat$region, var)
fh     <- as.numeric(nh) / as.numeric(Nh)

ybar_str <- sum(Wh * ybar_h)
V_str    <- sum(Wh^2 * (1 - fh) * s2_h / as.numeric(nh))
round(c(media = ybar_str, ee = sqrt(V_str)), 4)
#>     media        ee
#> 295560.77  16379.87

# El total se estima con N veces la media (o sumando N_h * ybar_h).
round(c(total = N * ybar_str, ee_total = N * sqrt(V_str)), 0)
#>     total  ee_total
#> 909736035  50417248

cat("\n###BLOQUE-R4###\n")
# survey necesita tres piezas del diseno: estratos, pesos y fpc por estrato.
agstrat$Nh <- as.numeric(Nh[agstrat$region])
dis <- svydesign(id = ~1, strata = ~region, weights = ~strwt,
                 fpc = ~Nh, data = agstrat)
svymean(~acres92, dis)
#>           mean    SE
#> acres92 295561 16380
confint(svymean(~acres92, dis))
#>            2.5 %   97.5 %
#> acres92 263456.8 327664.7
svytotal(~acres92, dis)
#>             total       SE
#> acres92 909736036 50417248

cat("\n###BLOQUE-R5###\n")
# Una proporcion es la media de una variable 0/1, asi que el mismo estimador
# sirve sin cambiar nada: proporcion de condados con menos de 200 000 acres.
agstrat$menor200k <- as.numeric(agstrat$acres92 < 200000)
p_h  <- tapply(agstrat$menor200k, agstrat$region, mean)
v_h  <- tapply(agstrat$menor200k, agstrat$region, var)
p_str <- sum(Wh * p_h)
V_p   <- sum(Wh^2 * (1 - fh) * v_h / as.numeric(nh))
round(c(proporcion = p_str, ee = sqrt(V_p)), 5)
#> proporcion         ee
#>    0.51391    0.02479

# Y survey da lo mismo:
dis <- update(dis, menor200k = as.numeric(acres92 < 200000))
svymean(~menor200k, dis)
#>              mean     SE
#> menor200k 0.51391 0.0248

cat("\n###BLOQUE-R6###\n")
# Como repartir n = 300 entre los estratos? Todo sale de la poblacion:
# los tamanos N_h y las desviaciones S_h.
Sh  <- tapply(agpop$acres92, agpop$region, sd)
S2h <- tapply(agpop$acres92, agpop$region, var)
S2U <- var(agpop$acres92)

V_asig <- function(nh_) sum(Wh^2 * (1 - nh_ / as.numeric(Nh)) * S2h / nh_)

n_prop   <- round(300 * as.numeric(Nh) / N)
n_igual  <- rep(75, 4)
n_neyman <- round(300 * as.numeric(Nh) * Sh / sum(as.numeric(Nh) * Sh))
rbind(proporcional = n_prop, igual = n_igual, Neyman = n_neyman)
#>               NC NE   S   W
#> proporcional 103 21 135  41
#> igual         75 75  75  75
#> Neyman        86  5 102 107

# La varianza de cada asignacion, con el MAS de referencia (deff = V/V_MAS):
V_mas <- (1 - 300 / N) * S2U / 300
tabla <- c(MAS = V_mas, proporcional = V_asig(n_prop),
           igual = V_asig(n_igual), Neyman = V_asig(n_neyman))
round(rbind(ee = sqrt(tabla), deff = tabla / V_mas), 4)
#>           MAS proporcional      igual    Neyman
#> ee   23293.77   21123.9376 20059.1292 17290.784
#> deff     1.00       0.8224     0.7416     0.551

cat("\n###BLOQUE-R7###\n")
# Asignacion optima con costos desiguales: entrevistar en el Oeste cuesta mas
# (condados enormes y dispersos) y en el Nordeste menos. Con presupuesto C y
# costo c_h por entrevista, la asignacion optima es
#   n_h proporcional a N_h S_h / sqrt(c_h),  escalada hasta agotar C.
ch <- c(NC = 10, NE = 6, S = 8, W = 18)
C  <- 3000
crudo  <- as.numeric(Nh) * Sh / sqrt(ch)
nh_opt <- C / sum(ch * crudo) * crudo
round(rbind(nh_optimo = nh_opt, costo = ch * nh_opt), 1)
#>              NC   NE     S      W
#> nh_optimo  79.9  6.3 105.3   73.4
#> costo     798.6 37.8 842.2 1321.4

# Cuantas entrevistas compra el presupuesto y que varianza consigue:
round(c(n_total = sum(nh_opt), costo_total = sum(ch * nh_opt),
        ee = sqrt(V_asig(nh_opt))), 2)
#>     n_total costo_total          ee
#>      264.85     3000.00    18916.33

cat("\n###BLOQUE-R8###\n")
# Definir los estratos: la variable de estratificacion importa mas que el
# numero de estratos. Cuatro maneras de partir agpop en 4 grupos, mismas
# n = 300 proporcionales, y la varianza que consigue cada una:
corta4 <- function(x) {
  q <- unique(quantile(x, probs = seq(0, 1, 0.25), type = 1))
  cut(x, breaks = q, include.lowest = TRUE, labels = FALSE)
}
V_con <- function(f) {
  Nh_ <- tapply(agpop$acres92, f, length)
  S2_ <- tapply(agpop$acres92, f, var)
  nh_ <- 300 * Nh_ / N
  sum((Nh_ / N)^2 * (1 - nh_ / Nh_) * S2_ / nh_)
}
set.seed(2026)
opciones <- c(
  region            = V_con(agpop$region),
  cuartiles_acres87 = V_con(corta4(agpop$acres87)),
  cuartiles_farms92 = V_con(corta4(agpop$farms92)),
  al_azar           = V_con(sample(rep(1:4, length.out = N)))
)
round(rbind(ee = sqrt(opciones), deff = opciones / V_mas), 4)
#>          region cuartiles_acres87 cuartiles_farms92    al_azar
#> ee   21109.0721        17111.7990        23144.7268 23304.8326
#> deff     0.8212            0.5396            0.9872     1.0009

cat("\n###BLOQUE-R9###\n")
# Por que gana estratificar? La descomposicion ANOVA de la poblacion:
# la variabilidad total se parte en ENTRE regiones y DENTRO de regiones.
# El estratificado elimina de la varianza el termino ENTRE: solo paga el DENTRO.
media_U <- mean(agpop$acres92)
SST <- sum((agpop$acres92 - media_U)^2)
SSB <- sum(as.numeric(Nh) * (tapply(agpop$acres92, agpop$region, mean) - media_U)^2)
SSW <- SST - SSB
round(c(R2_entre = SSB / SST, dentro = SSW / SST), 4)
#> R2_entre   dentro
#>     0.18     0.82

# Ese 18 % ENTRE es justo lo que se ahorra la asignacion proporcional
# (comparar con su deff de 0.82): estratificar renta lo que la variable
# de estratificacion explica de la variable de interes.

cat("\n###BLOQUE-R10###\n")
# El efecto de diseno (deff) con las DOS muestras reales del material:
# agsrs (MAS, capitulo 2) y agstrat (estratificada proporcional) tienen el
# mismo n = 300 sobre la misma poblacion.
agsrs <- read.csv("CSV data sets for SDA 3e/agsrs.csv")
ee_srs <- sqrt((1 - 300 / N) * var(agsrs$acres92) / 300)
ee_str <- sqrt(V_str)
round(c(ee_mas = ee_srs, ee_estratificado = ee_str,
        deff_empirico = (ee_str / ee_srs)^2), 4)
#>           ee_mas ee_estratificado    deff_empirico
#>       18898.4344       16379.8727           0.7512

# deff = 0.75: las 300 entrevistas estratificadas rinden como
# 300 / 0.75 = 400 entrevistas de un MAS. Cien entrevistas gratis.
round(300 / (ee_str / ee_srs)^2, 0)
#> [1] 399

cat("\n###BLOQUE-R11###\n")
# Estratificado con probabilidades proporcionales (Gutierrez 5.3): dentro de
# cada estrato, las unidades entran con probabilidad proporcional a su tamano.
# BigLucy: 85 296 empresas en 3 niveles; x = empleados, y = ingresos.
data(BigLucy)
table(BigLucy$Level)
#>    Big Medium  Small
#>   2905  25795  56596

mh <- c(Big = 60, Medium = 120, Small = 200)   # cuantas por estrato
set.seed(2026)
sel <- S.STPPS(BigLucy$Level, BigLucy$Employees, mh)   # sorteo PPT por estrato
sam <- sel[, 1]; psi <- sel[, 2]
est <- E.STPPS(data.frame(Income = BigLucy$Income[sam]), psi, mh,
               BigLucy$Level[sam])
round(est[, , "Income"], 2)
#>                       Big      Medium       Small  Population
#> Estimation     3518947.76 17175653.73 15192878.18 35887479.67
#> Standard Error   93910.11   542313.16   738161.38   920763.22
#> CVE                  2.67        3.16        4.86        2.57
#> DEFF                 1.46        2.58        2.41        0.33

# BigLucy es un censo: el total verdadero esta disponible para descubrir
# si el estimador acerto. (En una encuesta real, jamas.)
sum(BigLucy$Income)
#> [1] 36634733

cat("\n###BLOQUE-R12###\n")
# El motor por dentro, en el estrato Big: Hansen-Hurwitz. Cada empresa se
# sortea CON reemplazo con probabilidad psi_k proporcional a sus empleados,
# y el estimador promedia los cocientes y_k/psi_k.
big  <- BigLucy$Level[sam] == "Big"
d    <- BigLucy$Income[sam][big] / psi[big]
round(c(t_hat_Big = mean(d), ee_Big = sd(d) / sqrt(sum(big))), 0)
#> t_hat_Big    ee_Big
#>   3518948     93910

# Coincide con la columna Big del bloque anterior: E.STPPS hace esto
# mismo estrato a estrato y suma.

cat("\n###BLOQUE-R13###\n")
# Postestratificacion: agsrs se sorteo SIN mirar las regiones, asi que el
# numero de condados por region salio al azar. Pero los N_h del marco se
# conocen: se puede calibrar DESPUES de muestrear.
table(agsrs$region)
#>  NC  NE   S   W
#> 107  24 130  39

# El peso pasa de N/n (igual para todos) a N_h/n_h (el del estratificado):
w0 <- N / 300
n_obs  <- table(agsrs$region)
w_post <- as.numeric(Nh[agsrs$region]) / as.numeric(n_obs[agsrs$region])
data.frame(region = names(Nh), peso_antes = round(w0, 4),
           peso_despues = round(as.numeric(Nh) / as.numeric(n_obs), 4))
#>   region peso_antes peso_despues
#> 1     NC      10.26       9.8505
#> 2     NE      10.26       9.1667
#> 3      S      10.26      10.6308
#> 4      W      10.26      10.8205

# La suma de pesos ya no "casi" reconstruye N: lo reconstruye EXACTO.
round(c(antes = 300 * w0, despues = sum(w_post)), 2)
#>   antes despues
#>    3078    3078

cat("\n###BLOQUE-R14###\n")
# La media postestratificada, a mano y con survey::postStratify.
ybar_post <- sum(w_post * agsrs$acres92) / sum(w_post)
round(ybar_post, 4)
#> [1] 299778.1

dis0 <- svydesign(id = ~1, weights = rep(w0, 300), fpc = rep(N, 300), data = agsrs)
disP <- postStratify(dis0, ~region, data.frame(region = names(Nh), Freq = as.numeric(Nh)))
svymean(~acres92, dis0)
#>           mean    SE
#> acres92 297897 18898
svymean(~acres92, disP)
#>           mean    SE
#> acres92 299778 17513

# El ee baja de 18 898 a 17 513 sin una sola entrevista mas: la calibracion
# recupera parte de la ganancia que el estratificado habria dado desde el
# diseno. Es el puente al capitulo 7.

cat("\n###BLOQUE-R15###\n")
# La misma idea en machine learning, con rsample. Clase minoritaria: condados
# "grandes" (mas de un millon de acres sembrados). Al partir en 5 pliegues de
# validacion cruzada SIN estratificar, la proporcion de grandes baila de
# pliegue en pliegue; estratificando queda clavada.
suppressWarnings(suppressMessages(library(rsample)))
agpop$grande <- factor(ifelse(agpop$acres92 > 1e6, "grande", "normal"))
round(mean(agpop$grande == "grande"), 4)
#> [1] 0.05

prop_grande <- function(cv) sapply(cv$splits,
                                   function(s) mean(assessment(s)$grande == "grande"))

# TRAMPA REAL de rsample: strata= agrupa en silencio los estratos con menos
# del 10 % de los datos (pool = 0.1) y la estratificacion se apaga sola.
# Nuestra clase es el 5 %: hay que BAJAR pool o no estratifica nada.
set.seed(2026)
round(rbind(
  sin_estratificar = prop_grande(vfold_cv(agpop, v = 5)),
  pool_por_defecto = prop_grande(vfold_cv(agpop, v = 5, strata = grande)),
  pool_correcto    = prop_grande(vfold_cv(agpop, v = 5, strata = grande, pool = 0.02))
), 4)
#>                    [,1]   [,2]   [,3]   [,4]   [,5]
#> sin_estratificar 0.0536 0.0568 0.0422 0.0488 0.0488
#> pool_por_defecto 0.0584 0.0536 0.0422 0.0423 0.0537
#> pool_correcto    0.0503 0.0503 0.0503 0.0503 0.0489

cat("\n###BLOQUE-R16###\n")
# EJERCICIO 1. Con agstrat, estimar el total nacional de acres sembrados con
# su intervalo del 95 %, y contrastarlo con el total verdadero de agpop.
est_total <- svytotal(~acres92, dis)
est_total
#>             total       SE
#> acres92 909736036 50417248
confint(est_total)
#>             2.5 %     97.5 %
#> acres92 810920045 1008552026

# La verdad (solo posible porque agpop es un censo):
sum(agpop$acres92)
#> [1] 943951718
# 943 951 718 cae dentro del intervalo: el diseno cumplio su promesa.

cat("\n###BLOQUE-R17###\n")
# EJERCICIO 2. El presupuesto crece a n = 400. Repartir con Neyman y decir
# cuanto se gana frente a la proporcional con el mismo n.
n_prop4 <- round(400 * as.numeric(Nh) / N)
n_ney4  <- round(400 * as.numeric(Nh) * Sh / sum(as.numeric(Nh) * Sh))
rbind(proporcional = n_prop4, Neyman = n_ney4)
#>               NC NE   S   W
#> proporcional 137 29 180  55
#> Neyman       115  7 136 142

round(c(ee_prop = sqrt(V_asig(n_prop4)), ee_neyman = sqrt(V_asig(n_ney4)),
        ganancia_pct = 100 * (1 - sqrt(V_asig(n_ney4)) / sqrt(V_asig(n_prop4)))), 2)
#>      ee_prop    ee_neyman ganancia_pct
#>     17924.66     14566.48        18.74

cat("\n###BLOQUE-R18###\n")
# EJERCICIO 3. En BigLucy, estimar el total de impuestos (Taxes) con un
# estratificado CLASICO (MAS dentro de cada nivel) de n = 380, repartido
# proporcionalmente: 13 / 115 / 252.
NhL <- table(BigLucy$Level)
nhL <- round(380 * as.numeric(NhL) / nrow(BigLucy))
set.seed(2026)
idx <- unlist(mapply(function(l, n_) sample(which(BigLucy$Level == l), n_),
                     names(NhL), nhL))
mL <- BigLucy[idx, ]
mL$Nh <- as.numeric(NhL[mL$Level])
mL$w  <- mL$Nh / rep(nhL, times = nhL)
disL <- svydesign(id = ~1, strata = ~Level, weights = ~w, fpc = ~Nh, data = mL)
svytotal(~Taxes, disL)
#>         total    SE
#> Taxes 1015706 48585
confint(svytotal(~Taxes, disL))
#>          2.5 %  97.5 %
#> Taxes 920480.9 1110931
sum(BigLucy$Taxes)
#> [1] 1008426

cat("\n###BLOQUE-R19###\n")
# EJERCICIO 4. Mismo n = 380 sobre BigLucy, dos estrategias dentro de los
# estratos: MAS (ejercicio 3) o PPT por empleados (modulo 9, para Income).
# Comparar la calidad relativa con el coeficiente de variacion estimado.
cv_stsi <- SE(svytotal(~Taxes, disL)) / coef(svytotal(~Taxes, disL))
cv_ppt  <- est["Standard Error", "Population", "Income"] /
           est["Estimation", "Population", "Income"]
round(100 * c(cv_stsi_Taxes = as.numeric(cv_stsi), cv_ppt_Income = cv_ppt), 2)
#> cv_stsi_Taxes cv_ppt_Income
#>          4.78          2.57

# No son la misma variable, pero la leccion si es la misma: cuando el tamano
# de la unidad manda en la variable de interes, meter ese tamano en el diseno
# (PPT) o en los estratos (niveles de BigLucy) compra precision.
