suppressMessages({library(survey); library(sampling); library(TeachingSampling); library(jsonlite)})
Sys.setlocale("LC_CTYPE", "en_US.UTF-8")
options(warn = 1, survey.lonely.psu = "adjust")

cat("\n###BLOQUE-R1###\n")
# Cuatro tiendas y una auditoria de ventas (el ejemplo 6.1 de Lohr): la
# tienda D tiene diez veces el area de la A. Si el sorteo las trata igual,
# el azar decide si la muestra ve el 82 % de las ventas o el 4 %.
options(scipen = 8)
tiendas <- data.frame(tienda = c("A", "B", "C", "D"),
                      m2 = c(100, 200, 300, 1000),
                      ventas = c(11, 20, 24, 245))   # miles de USD
t_total <- sum(tiendas$ventas)
tiendas$psi <- tiendas$m2 / sum(tiendas$m2)          # psi_i prop. al tamano
tiendas
#>   tienda   m2 ventas    psi
#> 1      A  100     11 0.0625
#> 2      B  200     20 0.1250
#> 3      C  300     24 0.1875
#> 4      D 1000    245 0.6250
t_total
#> [1] 300

# Con n = 1 hay solo 4 muestras posibles: el estimador t/psi se puede
# enumerar COMPLETO, con su esperanza y su varianza exactas, para el sorteo
# proporcional y para el sorteo con probabilidades iguales (psi = 1/4):
est_ppt <- tiendas$ventas / tiendas$psi
est_igual <- 4 * tiendas$ventas
rbind(ppt = est_ppt, igual = est_igual)
#>       [,1] [,2] [,3] [,4]
#> ppt    176  160  128  392
#> igual   44   80   96  980

c(E_ppt = sum(tiendas$psi * est_ppt),
  V_ppt = sum(tiendas$psi * (est_ppt - t_total)^2),
  E_igual = mean(est_igual),
  V_igual = mean((est_igual - t_total)^2))
#>   E_ppt   V_ppt E_igual V_igual
#>     300   14248     300  154488
# Los dos son insesgados; el proporcional tiene 10.8 veces menos varianza,
# porque t_i/psi_i es casi constante cuando psi_i acompana al tamano.

cat("\n###BLOQUE-R2###\n")
# Hansen-Hurwitz: n = 2 extracciones CON reemplazo, cada una con psi_i.
# El estimador promedia los t/psi de las dos extracciones:
#   t_hat_HH = (1/n) * sum(y_i / psi_i)
# Su varianza tiene formula cerrada V = (1/n) sum psi_i (t_i/psi_i - t)^2,
# y con n = 2 tambien se puede enumerar: 16 pares ordenados.
pares <- expand.grid(prima = 1:4, segunda = 1:4)
pares$prob <- tiendas$psi[pares$prima] * tiendas$psi[pares$segunda]
pares$hh <- (est_ppt[pares$prima] + est_ppt[pares$segunda]) / 2
c(E_HH = sum(pares$prob * pares$hh),
  V_enumerada = sum(pares$prob * (pares$hh - t_total)^2),
  V_formula = sum(tiendas$psi * (est_ppt - t_total)^2) / 2)
#>        E_HH V_enumerada   V_formula
#>         300        7124        7124

# En la practica no se enumera: se sortea. Una muestra HH concreta:
set.seed(2026)
s <- sample(1:4, 2, replace = TRUE, prob = tiendas$psi)
paste(tiendas$tienda[s], collapse = "")
#> [1] "CD"
z <- tiendas$ventas[s] / tiendas$psi[s]
c(t_hat = mean(z), ee_estimado = sqrt(var(z) / 2))
#>       t_hat ee_estimado
#>         260         132
# El ee estimado con n = 2 es malisimo (var con 2 datos), pero el estimador
# puntual ya usa bien los tamanos. Con n realista, ambos mejoran.

cat("\n###BLOQUE-R3###\n")
# Como se sortea con probabilidades desiguales? Metodo acumulativo: cada
# tienda ocupa un tramo de [0, 1600] proporcional a su tamano; un uniforme
# cae en un tramo y esa tienda sale.
acum <- cumsum(tiendas$m2)
data.frame(tienda = tiendas$tienda, desde = c(1, head(acum, -1) + 1), hasta = acum)
#>   tienda desde hasta
#> 1      A     1   100
#> 2      B   101   300
#> 3      C   301   600
#> 4      D   601  1600

set.seed(2026)
u <- runif(5) * 1600
sel <- findInterval(u, c(0, acum), left.open = TRUE)
data.frame(uniforme = round(u, 1), sale = tiendas$tienda[sel])
#>   uniforme sale
#> 1   1117.9    D
#> 2    890.4    D
#> 3    224.2    B
#> 4    457.2    C
#> 5    888.6    D

# La verificacion de que el metodo hace lo que promete: 100 000 sorteos y
# las frecuencias deben clavar los psi_i.
set.seed(2026)
sel <- findInterval(runif(100000) * 1600, c(0, acum), left.open = TRUE)
round(rbind(frecuencia = table(sel) / 100000, psi = tiendas$psi), 4)
#>                 1      2      3      4
#> frecuencia 0.0627 0.1248 0.1873 0.6252
#> psi        0.0625 0.1250 0.1875 0.6250

cat("\n###BLOQUE-R4###\n")
# Metodo de Lahiri (rechazo): se sortea una tienda al azar y un uniforme
# contra M_max = 1000; si u * M_max <= M_i, la tienda queda; si no, se
# repite. No necesita acumular, y acepta con probabilidad proporcional a M_i.
set.seed(2026)
B <- 100000
sorteos <- sample(1:4, B * 3, replace = TRUE)     # de sobra para B aceptados
umax <- runif(B * 3) * 1000
acepta <- umax <= tiendas$m2[sorteos]
sel_lahiri <- sorteos[acepta][1:B]
round(rbind(frecuencia = table(sel_lahiri) / B, psi = tiendas$psi), 4)
#>                 1      2      3      4
#> frecuencia 0.0622 0.1247 0.1870 0.6261
#> psi        0.0625 0.1250 0.1875 0.6250

# El precio del rechazo: cuantos intentos por seleccion?
c(intentos_promedio = round(1 / mean(acepta), 3),
  teorico = 1000 * 4 / 1600)
#> intentos_promedio           teorico
#>              2.51              2.50

cat("\n###BLOQUE-R5###\n")
# SIN reemplazo la herramienta es la del capitulo 2: un diseno p(s) sobre
# las muestras posibles, sus pi_k, y el estimador de Horvitz-Thompson.
# Con N = 4 y n = 2 hay 6 muestras; tomemos p(s) proporcional a m2_k + m2_l:
muestras <- t(combn(4, 2))
p_s <- tiendas$m2[muestras[, 1]] + tiendas$m2[muestras[, 2]]
p_s <- p_s / sum(p_s)
data.frame(muestra = apply(muestras, 1, function(m) paste(tiendas$tienda[m], collapse = "")),
           p_s = round(p_s, 4))
#>   muestra    p_s
#> 1      AB 0.0625
#> 2      AC 0.0833
#> 3      AD 0.2292
#> 4      BC 0.1042
#> 5      BD 0.2500
#> 6      CD 0.2708

# pi_k = suma de p(s) sobre las muestras que contienen a k; suman n = 2:
pi_k <- sapply(1:4, function(k) sum(p_s[apply(muestras == k, 1, any)]))
round(pi_k, 4)
#> [1] 0.3750 0.4167 0.4583 0.7500
sum(pi_k)
#> [1] 2

# El HT de cada muestra posible, y su esperanza exacta:
ht_s <- apply(muestras, 1, function(m) sum(tiendas$ventas[m] / pi_k[m]))
round(ht_s, 1)
#> [1]  77.3  81.7 356.0 100.4 374.7 379.0
c(E_HT = sum(p_s * ht_s), V_HT = sum(p_s * (ht_s - t_total)^2))
#>     E_HT     V_HT
#>   300.00 15025.67
# Insesgado sin reemplazo, para CUALQUIER p(s) con pi_k > 0. Pero ojo: esta
# V es mas alta que la del HH — este p(s) produce pi_k mas planos que los
# psi del sorteo proporcional. El HT no hace magia: hereda las pi que le den.

cat("\n###BLOQUE-R6###\n")
# La varianza del HT necesita las probabilidades CONJUNTAS pi_kl (que ambas
# unidades esten en la muestra). Aqui salen del diseno por enumeracion:
pi_kl <- matrix(0, 4, 4, dimnames = list(tiendas$tienda, tiendas$tienda))
for (s in 1:6) {
  i <- muestras[s, 1]; j <- muestras[s, 2]
  pi_kl[i, j] <- pi_kl[i, j] + p_s[s]; pi_kl[j, i] <- pi_kl[j, i] + p_s[s]
}
diag(pi_kl) <- pi_k
round(pi_kl, 4)
#>        A      B      C      D
#> A 0.3750 0.0625 0.0833 0.2292
#> B 0.0625 0.4167 0.1042 0.2500
#> C 0.0833 0.1042 0.4583 0.2708
#> D 0.2292 0.2500 0.2708 0.7500

# Forma de Sen-Yates-Grundy (disenos de tamano fijo): una suma sobre pares,
# con (pi_k pi_l - pi_kl) midiendo cuanto "se estorban" k y l:
y_pi <- tiendas$ventas / pi_k
V_syg <- 0
for (k in 1:3) for (l in (k + 1):4) {
  V_syg <- V_syg + (pi_k[k] * pi_k[l] - pi_kl[k, l]) * (y_pi[k] - y_pi[l])^2
}
c(V_SYG = V_syg, V_enumerada = sum(p_s * (ht_s - t_total)^2))
#>       V_SYG V_enumerada
#>    15025.67    15025.67
# Identicas: SYG es la misma varianza reescrita. Su ventaja practica llega
# al ESTIMARLA (bloques del modulo 7): suele ser mas estable que la forma HT.

cat("\n###BLOQUE-R7###\n")
# Un pi-PT real: los 51 estados de EE.UU. (50 + DC), tamano = poblacion 2019,
# n = 10. inclusionprobabilities calcula pi_k = n x_k / sum(x)... y avisa
# del problema: la pi cruda de California pasa de 1.
statepps <- read.csv("CSV data sets for SDA 3e/statepps.csv")
c(estados = nrow(statepps), total_condados = sum(statepps$counties))
#>        estados total_condados
#>             51           3143
round(10 * max(statepps$pop2019) / sum(statepps$pop2019), 4)   # pi cruda de CA
#> [1] 1.2038

pi_st <- inclusionprobabilities(statepps$pop2019, 10)
sum(pi_st)
#> [1] 10
statepps$state[pi_st >= 1 - 1e-12]
#> [1] "California"
# California queda de INCLUSION FORZOSA (pi = 1) y el resto se reescala para
# que la suma siga siendo n = 10. Es la regla general: pi = 1 para las
# unidades gigantes, proporcionalidad para las demas.

cat("\n###BLOQUE-R8###\n")
# Seleccion pi-PT sistematica (UPsystematic) y el HT del total de condados:
set.seed(2026)
s_sys <- UPsystematic(pi_st) == 1
statepps$state[s_sys]
#>  [1] "California"     "Connecticut"    "Georgia"        "Kansas"
#>  [5] "Michigan"       "New Jersey"     "North Carolina" "Pennsylvania"
#>  [9] "Texas"          "Washington"
c(n = sum(s_sys),
  t_HT = sum(statepps$counties[s_sys] / pi_st[s_sys]),
  total_real = sum(statepps$counties))
#>          n       t_HT total_real
#>     10.000   3028.217   3143.000

# El sistematico deja pi_kl = 0 en muchos pares (capitulo 2): no hay
# estimador insesgado de varianza. La salida practica es la aproximacion
# CON reemplazo, conservadora, que solo usa las pi de primer orden:
z <- statepps$counties[s_sys] / (pi_st[s_sys] / 10)   # z_i = y_i/psi_i aprox
c(ee_aprox_WR = sqrt(var(z[pi_st[s_sys] < 1]) / sum(pi_st[s_sys] < 1)))
#> ee_aprox_WR
#>    1116.288
# (California, con pi = 1, no aporta varianza y queda fuera de la formula.)

cat("\n###BLOQUE-R9###\n")
# Diseno de Poisson: cada estado entra con SU pi_k, con monedas
# independientes. El precio: n queda ALEATORIO.
set.seed(2026)
s_poi <- rbinom(nrow(statepps), 1, pi_st) == 1
c(n_obtenido = sum(s_poi), E_n = sum(pi_st),
  de_n = sqrt(sum(pi_st * (1 - pi_st))))
#> n_obtenido        E_n       de_n
#>   8.000000  10.000000   2.414976

c(t_HT = sum(statepps$counties[s_poi] / pi_st[s_poi]))
#>     t_HT
#> 1896.203

# A cambio, la independencia regala la varianza mas simple del capitulo
# (sin pi_kl: pi_kl = pi_k * pi_l), calculable EXACTA sobre la poblacion:
c(V_exacta = sum((1 - pi_st) * statepps$counties^2 / pi_st),
  ee = sqrt(sum((1 - pi_st) * statepps$counties^2 / pi_st)))
#>    V_exacta          ee
#> 1604348.622    1266.629

cat("\n###BLOQUE-R10###\n")
# agpps: la muestra pi-PT REAL de Lohr — 15 condados sorteados con pi
# proporcional a acres87, CON el archivo de probabilidades conjuntas
# JtProb (una matriz 15 x 15). Es el caso ideal: se puede estimar la
# varianza del HT con las formulas completas.
agpps <- read.csv("CSV data sets for SDA 3e/agpps.csv")
c(condados = nrow(agpps), rango_pi = range(agpps$SelectionProb))
#>     condados    rango_pi1    rango_pi2
#> 15.000000000  0.002864708  0.033890171
t_ht <- sum(agpps$acres92 / agpps$SelectionProb)
t_ht
#> [1] 936291173

# Estimador de varianza en forma HT (doble suma con Delta_kl/pi_kl):
Pmat <- as.matrix(agpps[, paste0("JtProb_", 1:15)])
diag(Pmat) <- agpps$SelectionProb
d <- agpps$acres92 / agpps$SelectionProb
V_ht <- sum((1 - agpps$SelectionProb) * d^2)
for (k in 1:15) for (l in (1:15)[-k]) {
  V_ht <- V_ht + (Pmat[k, l] - agpps$SelectionProb[k] * agpps$SelectionProb[l]) /
    Pmat[k, l] * d[k] * d[l]
}
# Estimador de Sen-Yates-Grundy (tamano fijo, suma sobre pares):
V_syg <- 0
for (k in 1:14) for (l in (k + 1):15) {
  V_syg <- V_syg + (agpps$SelectionProb[k] * agpps$SelectionProb[l] - Pmat[k, l]) /
    Pmat[k, l] * (d[k] - d[l])^2
}
round(c(ee_forma_HT = as.numeric(sqrt(V_ht)), ee_SYG = as.numeric(sqrt(V_syg))), 0)
#> ee_forma_HT      ee_SYG
#>    70466698    11715204
# MISMOS datos, MISMA varianza teorica... y el estimador en forma HT da un
# ee 6 veces mayor. La forma HT es notoriamente inestable (puede hasta dar
# negativa); con tamano fijo, SYG es el estimador que se usa.

cat("\n###BLOQUE-R11###\n")
# survey hace las dos cuentas con la matriz de conjuntas (pps = ppsmat):
dis_yg <- svydesign(id = ~1, fpc = ~SelectionProb, data = agpps,
                    pps = ppsmat(Pmat), variance = "YG")
svytotal(~acres92, dis_yg)
#>             total       SE
#> acres92 936291173 11715204

dis_ht <- svydesign(id = ~1, fpc = ~SelectionProb, data = agpps,
                    pps = ppsmat(Pmat), variance = "HT")
svytotal(~acres92, dis_ht)
#>             total       SE
#> acres92 936291173 70466698
# Las dos vias a mano del bloque anterior, reproducidas por survey. El
# intervalo con SYG: 936.3 +/- 23 millones de acres. El total verdadero de
# agpop (cap. 1) era 943 millones: cae dentro.

cat("\n###BLOQUE-R12###\n")
# Cuando el HT se comporta mal: pi_k chico con y_k grande. La poblacion
# del modulo 8: 20 negocios, pi proporcional al AREA... y un "elefante"
# (unidad 20) con area minuscula y ventas enormes. Bajo Poisson la varianza
# es exacta y se ve el desastre en funcion de pi_20:
datos <- fromJSON("precalculo/salidas/cap6_datos.json")$elefante
c(y_elefante = datos$yElefante, total = datos$totalY,
  aporta = round(datos$yElefante / datos$totalY, 3))
#> y_elefante      total     aporta
#>    8790.00   10726.00       0.82

V_con_pi <- function(p) {
  pk <- datos$piBase; pk[20] <- p
  sum((1 - pk) * datos$y^2 / pk)
}
round(sapply(c(pi_005 = 0.005, pi_05 = 0.05, pi_5 = 0.5), V_con_pi))
#>      pi_005       pi_05        pi_5
#> 15376068757  1468530757    77776957
# De pi = 0.5 a pi = 0.005 la varianza se multiplica por casi 200: el
# termino (1/pi - 1) y^2 del elefante domina todo. La leccion de diseno:
# si sospechas que y_k puede ser grande, NO le dejes pi_k chico — tamanos
# de referencia actualizados, o inclusion forzosa.

cat("\n###BLOQUE-R13###\n")
# PPT en dos etapas, el diseno de las encuestas reales. classpps (Lohr,
# ej. 6.11): 5 clases sorteadas con psi_i = M_i/647 CON reemplazo, 4
# estudiantes por clase. El HH de dos etapas promedia t_hat_i / psi_i:
clases <- read.csv("CSV data sets for SDA 3e/classes.csv")      # marco: 15 clases
classpps <- read.csv("CSV data sets for SDA 3e/classpps.csv")   # la muestra
K <- sum(clases$class_size)
K
#> [1] 647
por_clase <- do.call(rbind, lapply(split(classpps, classpps$class), function(d) {
  Mi <- clases$class_size[clases$class == d$class[1]]
  data.frame(clase = d$class[1], Mi = Mi, mi = nrow(d),
             ybar = mean(d$hours), t_hat = Mi * mean(d$hours),
             psi = Mi / K)
}))
round(por_clase, 3)
#>    clase  Mi mi  ybar  t_hat   psi
#> 1      1  44  4 3.500 154.00 0.068
#> 4      4  22  4 5.000 110.00 0.034
#> 9      9  54  4 3.625 195.75 0.083
#> 10    10  34  4 3.125 106.25 0.053
#> 14    14 100  4 2.000 200.00 0.155

z <- por_clase$t_hat / por_clase$psi
c(t_HH = mean(z), ee = sqrt(var(z) / 5))
#>      t_HH        ee
#> 2232.1500  311.7624
# Cada z_i = t_hat_i/psi_i es un estimador insesgado del total por si solo;
# HH los promedia. La varianza usa SOLO la dispersion de los z_i: el "con
# reemplazo" en la primera etapa hace que las dos etapas de azar queden
# empaquetadas en esa unica varianza entre clases. Ese truco es el motivo
# de que las encuestas reales declaren sus UPM "con reemplazo" (cap. 7).

cat("\n###BLOQUE-R14###\n")
# El mismo calculo en survey, con los pesos del archivo, y dos regalos del
# diseno: los pesos reconstruyen K, y son EXACTAMENTE autoponderados.
dis_cl <- svydesign(id = ~class, weights = ~finalweight, data = classpps)
svytotal(~hours, dis_cl)
#>        total     SE
#> hours 2232.2 311.76
svymean(~hours, dis_cl)
#>       mean     SE
#> hours 3.45 0.4819

c(suma_pesos = sum(classpps$finalweight), K = K)
#> suma_pesos          K
#>        647        647
unique(classpps$finalweight)
#> [1] 32.35
# UN SOLO peso: 32.35 = 647/(5 x 4). Con psi_i prop. a M_i y m_i = 4 fijo,
# los dos factores del peso se cancelan: w = (K/(n M_i)) * (M_i/m) = K/(nm).
# El diseno es EXACTAMENTE autoponderado — cada estudiante observado
# representa a 32.35 del marco — y esa es la razon de que las encuestas de
# hogares reales sorteen UPM con PPT y un numero fijo de hogares por UPM.

cat("\n###BLOQUE-R15###\n")
# La conexion con ciencia de datos: el PPT con reemplazo ES muestreo por
# importancia. Estimar el total de condados sorteando estados con una
# "propuesta" psi: cuanto mas se parezca psi a y/t, menor la varianza.
# Todo exacto (formula de HH sobre la poblacion completa):
psi_unif <- rep(1 / 51, 51)
psi_pop <- statepps$pop2019 / sum(statepps$pop2019)
psi_y <- statepps$counties / sum(statepps$counties)   # la propuesta "perfecta"
V_wr <- function(psi, n = 10) {
  sum(psi * (statepps$counties / psi - sum(statepps$counties))^2) / n
}
round(c(V_uniforme = V_wr(psi_unif), V_psi_pop = V_wr(psi_pop),
        V_psi_y = V_wr(psi_y)))
#> V_uniforme  V_psi_pop    V_psi_y
#>     557287     963006          0
# La propuesta psi ~ poblacion no solo no mejora al uniforme: lo EMPEORA
# (963 006 contra 557 287). Con correlacion tamano-condados de 0.46, el
# cociente y/psi queda MAS variable que con psi constante. La proporcional
# a y aniquila la varianza — pero exige conocer y, que es lo que se busca.
# En muestreo por importancia (integracion Monte Carlo, active learning,
# replay buffers) la mision es exactamente esa: disenar psi cerca de |y|
# usando una variable barata CONOCIDA para toda la poblacion.

cat("\n###BLOQUE-R16###\n")
# EJERCICIO 1. HH con psi ~ poblacion sobre statepps: n = 10 extracciones
# con reemplazo; estimar el total de condados y su ee, y comparar con el
# HH de probabilidades iguales.
set.seed(2026)
s1 <- sample(1:51, 10, replace = TRUE, prob = psi_pop)
z1 <- statepps$counties[s1] / psi_pop[s1]
s2 <- sample(1:51, 10, replace = TRUE)
z2 <- statepps$counties[s2] * 51
round(c(t_HH_psi = mean(z1), ee_psi = sqrt(var(z1) / 10),
        t_HH_igual = mean(z2), ee_igual = sqrt(var(z2) / 10)))
#>   t_HH_psi     ee_psi t_HH_igual   ee_igual
#>       2430        588       3886       1126
# Trampa instructiva: en ESTA realizacion el ee estimado del PPT (588) parece
# mejor que el del uniforme (1126)... y el bloque R15 demostro que la verdad
# es la contraria (V = 963 006 contra 557 287). Un ee estimado con n = 10 es
# una variable aleatoria ruidosa: una realizacion no adjudica un debate que
# las formulas exactas ya resolvieron. Confia en la V exacta, no en la
# anecdota — es el mismo mensaje del modulo 5.

cat("\n###BLOQUE-R17###\n")
# EJERCICIO 2. Sortear 5 clases de classes.csv por el metodo acumulativo,
# con reemplazo, y calcular los psi_i del marco.
acum_cl <- cumsum(clases$class_size)
set.seed(2026)
u <- runif(5) * K
sel <- findInterval(u, c(0, acum_cl), left.open = TRUE)
data.frame(uniforme = round(u, 1), clase = clases$class[sel],
           Mi = clases$class_size[sel],
           psi = round(clases$class_size[sel] / K, 4))
#>   uniforme clase Mi    psi
#> 1    452.0    11 46 0.0711
#> 2    360.1     9 54 0.0835
#> 3     90.7     3 26 0.0402
#> 4    184.9     5 76 0.1175
#> 5    359.3     9 54 0.0835
# La clase 9 salio DOS veces (u = 360.1 y u = 359.3 caen en su tramo): eso
# es el "con reemplazo" en accion, y no es un error — sus estudiantes se
# sortearian dos veces, y su t_hat/psi aportaria dos z_i al promedio HH.
# Las clases grandes acaparan tramos largos y repeticiones.

cat("\n###BLOQUE-R18###\n")
# EJERCICIO 3. Repetir el modulo 7 con acres87 — que es LA VARIABLE DE
# TAMANO con la que se construyeron las pi (sizemeas = acres87). Que le
# pasa al SYG cuando y_k es exactamente proporcional a pi_k?
d87 <- agpps$acres87 / agpps$SelectionProb
range(d87)   # y_k/pi_k es casi LA MISMA CONSTANTE en los 15 condados
#> [1] 64429949 64429951
t87 <- sum(d87)
V87 <- 0
for (k in 1:14) for (l in (k + 1):15) {
  V87 <- V87 + (agpps$SelectionProb[k] * agpps$SelectionProb[l] - Pmat[k, l]) /
    Pmat[k, l] * (d87[k] - d87[l])^2
}
c(t_87 = t87, ee_87 = as.numeric(sqrt(V87)))
#>            t_87           ee_87
#> 966449249.48019         1.23584
# Un ee de ~1 ACRE sobre un total de 966 millones: el SYG colapsa porque
# cada termino lleva (d_k - d_l)^2 y todos los d son casi iguales. Es el
# pi-PT en estado puro — para la variable de tamano, la varianza es
# (esencialmente) cero por construccion. acres92 no es acres87, y por eso
# su cv es 1.3 % y no cero: el pi-PT rinde segun lo bien que el tamano de
# ayer prediga la variable de hoy.

cat("\n###BLOQUE-R19###\n")
# EJERCICIO 4. Poisson frente a sistematico sobre statepps, con waterarea:
# V exacta de Poisson y V empirica del sistematico (10 000 replicas del
# precalculo). Cuanto cuesta el n aleatorio?
V_poi_water <- sum((1 - pi_st) * statepps$waterarea^2 / pi_st)
V_sis_water <- fromJSON("precalculo/salidas/cap6_datos.json")$statepps$waterarea$vPps
round(c(V_poisson = V_poi_water, V_sistematico = V_sis_water,
        razon = V_poi_water / V_sis_water), 2)
#>        V_poisson    V_sistematico            razon
#> 2625514850771.31 2553797234162.09             1.03
# Poisson paga solo un 3 % mas que el sistematico de tamano fijo con esta
# variable — pero cuidado con generalizar: aqui casi toda la varianza viene
# de que waterarea NO acompana a las pi (deff 9 frente al MAS, modulo 5).
# Repite la cuenta con counties y la razon sube a 2.8 (1 604 349 exacta de
# Poisson contra 571 878 del sistematico en el precalculo): cuando las pi
# trabajan bien, dejar n al azar si cuesta caro. Por eso Poisson se reserva
# para marcos que llegan en flujo (una unidad a la vez).
