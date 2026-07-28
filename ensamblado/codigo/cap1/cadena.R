suppressMessages({library(survey); library(sampling); library(TeachingSampling); library(jsonlite)})
Sys.setlocale("LC_CTYPE", "en_US.UTF-8")
options(warn = 1, survey.lonely.psu = "adjust")

cat("\n###BLOQUE-R1###\n")
# agpop: los 3078 condados agricolas de EE.UU. (censo agricola de 1992).
# Es la POBLACION del curso, y como esta entera se puede comprobar cualquier
# estimacion contra el valor verdadero. Fuera de un aula eso no pasa nunca.
agpop <- read.csv("CSV data sets for SDA 3e/agpop.csv")

# Las cuatro piezas del marco conceptual, sobre este archivo:
#   poblacion objetivo  -> los condados agricolas de EE.UU.
#   marco muestral      -> la lista de 3078 filas de este archivo
#   unidad              -> un condado (una fila)
#   variable de interes -> acres92, la superficie sembrada en 1992
c(condados = nrow(agpop), variables = ncol(agpop),
  estados = length(unique(agpop$state)))
#>  condados variables   estados
#>      3078        15        50
head(agpop[, c("county", "state", "acres92", "region")], 3)
#>                  county state acres92 region
#> 1 ALEUTIAN ISLANDS AREA    AK  683533      W
#> 2        ANCHORAGE AREA    AK   47146      W
#> 3        FAIRBANKS AREA    AK  141338      W

cat("\n###BLOQUE-R2###\n")
# Lohr codifica el dato faltante como -99. No es un valor pequeno: es un
# NO-VALOR disfrazado de numero, y R lo promedia sin protestar.
sapply(c("acres92", "acres87", "acres82"), function(v) sum(agpop[[v]] == -99))
#> acres92 acres87 acres82
#>      19      23      17

# Que le hace a la media. La decision de este material es usar el marco
# completo de Lohr, N = 3078, sin excluir nada: es una poblacion perfectamente
# valida que contiene 19 codigos -99. Lo que NO es, es la superficie media real.
round(c(marco_completo = mean(agpop$acres92),
        solo_validos   = mean(agpop$acres92[agpop$acres92 != -99]),
        diferencia_pct = 100 * (mean(agpop$acres92[agpop$acres92 != -99]) /
                                mean(agpop$acres92) - 1)), 4)
#> marco_completo   solo_validos diferencia_pct
#>    306676.9714    308582.4122         0.6213

cat("\n###BLOQUE-R3###\n")
# Dos encuestas sobre el mismo item -"soy mas inteligente que la persona
# promedio"- en la misma poblacion. Una es telefonica por marcacion aleatoria
# (1838 entrevistas de 79014 numeros); la otra es un panel de voluntarios de
# Mechanical Turk (983 personas pagadas a 0,25 dolares).
tel    <- read.csv("CSV data sets for SDA 3e/intelltel.csv")
online <- read.csv("CSV data sets for SDA 3e/intellonline.csv")
pesos  <- read.csv("CSV data sets for SDA 3e/intellwts.csv")

# Las dos encuestas se calibraron al censo de 2010 sobre las mismas 8 celdas
# de sexo x edad x raza. Eso permite RECUPERAR el censo desde los pesos, y por
# dos caminos independientes que tienen que coincidir.
censo_tel    <- pesos$tel_n    * pesos$tel_wgt
censo_online <- pesos$online_n * pesos$online_wgt
c(suma_tel = sum(censo_tel), suma_online = sum(censo_online),
  discrepancia_maxima = max(abs(censo_tel - censo_online)))
#>            suma_tel         suma_online discrepancia_maxima
#>             750.124             749.792               0.280

cat("\n###BLOQUE-R4###\n")
# La composicion demografica de cada muestra frente a la del censo.
comp <- data.frame(
  celda  = paste(pesos$sex, pesos$agegroup, pesos$race),
  censo  = round(100 * censo_tel / sum(censo_tel), 1),
  telef  = round(100 * pesos$tel_n / sum(pesos$tel_n), 1),
  online = round(100 * pesos$online_n / sum(pesos$online_n), 1))
comp$sesgo_online <- comp$online - comp$censo
print(comp, row.names = FALSE)
#>                  celda censo telef online sesgo_online
#>  Female Young Nonwhite   7.6   2.6   11.8          4.2
#>     Female Young White  18.1   6.2   31.7         13.6
#>    Female Old Nonwhite   7.6   6.1    1.4         -6.2
#>       Female Old White  18.1  47.8   13.7         -4.4
#>    Male Young Nonwhite   7.2   1.5    8.2          1.0
#>       Male Young White  17.1   5.1   25.8          8.7
#>      Male Old Nonwhite   7.2   4.8    0.8         -6.4
#>         Male Old White  17.1  26.0    6.4        -10.7

# La edad media resume el desastre en un numero.
c(edad_telefonica = mean(tel$age), edad_online = mean(online$age))
#> edad_telefonica     edad_online
#>        60.74864        33.71414

cat("\n###BLOQUE-R5###\n")
# El estimando de Lohr: agree = 1 si elige "muy de acuerdo" (1) o "bastante de
# acuerdo" (2). El 5 es "no se", que cuenta como 0.
agree_tel    <- as.integer(tel$int    %in% c(1, 2))
agree_online <- as.integer(online$int %in% c(1, 2))

round(rbind(
  telefonica = c(sin_pesos = mean(agree_tel),
                 con_pesos = weighted.mean(agree_tel, tel$postwt)),
  online     = c(sin_pesos = mean(agree_online),
                 con_pesos = weighted.mean(agree_online, online$postwt))), 4)
#>            sin_pesos con_pesos
#> telefonica    0.6164    0.6476
#> online        0.6755    0.6563

# Los pesos no acercan las dos encuestas: las separan. Calibrar por sexo, edad
# y raza no arregla una seleccion que fallo por otras variables.
cat("\n###BLOQUE-R6###\n")
# Sesgo de no respuesta con clases de respuesta. Las cuatro regiones de agpop
# hacen de clases; r_h es la tasa de respuesta de cada una.
#
#   mu_R = suma(N_h r_h mu_h) / suma(N_h r_h)      sesgo = mu_R - mu
reg  <- split(agpop$acres92, agpop$region)
N_h  <- sapply(reg, length)
mu_h <- sapply(reg, mean)
mu   <- mean(agpop$acres92)

sesgo_no_respuesta <- function(r_h) {
  peso <- N_h * r_h
  sum(peso * mu_h) / sum(peso) - mu
}

# Tres escenarios. Los dos primeros tienen tasas IGUALES entre clases: una es
# altisima y la otra ridicula, y las dos dan sesgo cero. El tercero baja la
# tasa donde los condados son mas grandes (NC, NE, S, W en orden alfabetico).
round(c(todas_al_60 = sesgo_no_respuesta(rep(0.60, 4)),
        todas_al_10 = sesgo_no_respuesta(rep(0.10, 4)),
        desiguales  = sesgo_no_respuesta(c(0.50, 0.65, 0.35, 0.20))), 2)
#> todas_al_60 todas_al_10  desiguales
#>        0.00        0.00   -30359.12

cat("\n###BLOQUE-R7###\n")
# Error total = error de muestreo + error ajeno al muestreo. En terminos de
# error cuadratico medio,  ECM = sesgo^2 + varianza,  y solo el segundo
# sumando baja con n.
#
# El sondeo del Literary Digest de 1936, sobre la base de dos candidatos:
digest_landon    <- 1293669
digest_roosevelt <-  972897
n_digest <- digest_landon + digest_roosevelt
p_sondeo   <- digest_roosevelt / n_digest
p_real     <- 61 / (61 + 37)          # Roosevelt 61 %, Landon 37 % en la eleccion
sesgo      <- p_sondeo - p_real
S2         <- p_real * (1 - p_real)
round(c(n_digest = n_digest, p_sondeo = p_sondeo, p_real = p_real, sesgo = sesgo), 5)
#>      n_digest      p_sondeo        p_real         sesgo
#> 2266566.00000       0.42924       0.62245      -0.19321

cat("\n###BLOQUE-R8###\n")
# El sondeo de 2,3 millones frente a un muestreo aleatorio simple de 1000.
ecm_digest <- sesgo^2 + S2 / n_digest
ecm_mas    <- S2 / 1000
round(c(recm_digest = sqrt(ecm_digest), recm_mas = sqrt(ecm_mas),
        veces_peor  = sqrt(ecm_digest / ecm_mas)), 4)
#> recm_digest    recm_mas  veces_peor
#>      0.1932      0.0153     12.6035

# Tamano efectivo: el n de un muestreo aleatorio con el MISMO error cuadratico
# medio que el sondeo sesgado. Se despeja de  S2 / n = ECM.
round(S2 / ecm_digest, 2)
#> [1] 6.3

cat("\n###BLOQUE-R9###\n")
# Las dos poblaciones del curso. agpop, por region:
tabla <- data.frame(N = N_h, media = round(mu_h), sd = round(sapply(reg, sd)))
print(tabla[order(-tabla$media), ])
#>       N  media     sd
#> W   422 723344 835639
#> NC 1054 325951 271303
#> S  1382 199140 243956
#> NE  220  90619  79365

# BigLucy: 85296 empresas, la poblacion de los ejemplos de Gutierrez.
data(BigLucy, package = "TeachingSampling")
c(empresas = nrow(BigLucy), variables = ncol(BigLucy),
  ingreso_medio = mean(BigLucy$Income), pct_spam = 100 * mean(BigLucy$SPAM == "yes"))
#>      empresas     variables ingreso_medio      pct_spam
#>    85296.0000       11.0000      429.5012       60.8950

cat("\n###BLOQUE-S1###\n")
# Ejercicio 1 - La encuesta de Parade. Formula del sesgo de no respuesta:
#   mu = r mu_R + (1 - r) mu_M
# Si el 75 % de los que llamaron esta a favor y solo llamo una fraccion r,
# esto es lo que tendrian que opinar los que NO llamaron para que el
# porcentaje poblacional fuera cada valor de la primera fila.
r <- 0.01                  # una fraccion diminuta de los lectores llamo
mu_R <- 0.75
mu <- c(0.20, 0.30, 0.40, 0.50)
rbind(si_la_poblacion_fuera = mu,
      los_que_no_llamaron   = round((mu - r * mu_R) / (1 - r), 4))
#>                         [,1]   [,2]   [,3]   [,4]
#> si_la_poblacion_fuera 0.2000 0.3000 0.4000 0.5000
#> los_que_no_llamaron   0.1944 0.2955 0.3965 0.4975

cat("\n###BLOQUE-S2###\n")
# Ejercicio 2 - Fondos mutuos. El diseno (sistematico 1 en 10) es impecable:
# reparte la misma probabilidad de inclusion a todo lo que este en la lista.
N_lista <- 1250            # supongamos que el periodico publica 1250 fondos
k <- 10
c(pi_k = 1 / k, suma_pi = N_lista * (1 / k), n_esperado = N_lista / k)
#>       pi_k    suma_pi n_esperado
#>        0.1      125.0      125.0

# El defecto esta antes: si el periodico solo publica los fondos por encima de
# cierto tamano, los que faltan tienen pi_k = 0 y ningun diseno los recupera.
cat("\n###BLOQUE-S3###\n")
# Ejercicio 3 - Jurados en Maricopa. Analisis de flujo del marco a la muestra.
citaciones    <- 100300
no_entregada  <-  23000
no_calificado <-   7000
excusado      <-  22000
quedan <- citaciones - no_entregada - no_calificado - excusado
round(c(citaciones = citaciones, quedan = quedan,
        retencion_pct = 100 * quedan / citaciones,
        perdida_pct   = 100 * (citaciones - quedan) / citaciones), 2)
#>    citaciones        quedan retencion_pct   perdida_pct
#>     100300.00      48300.00         48.16         51.84

cat("\n###BLOQUE-S4###\n")
# Ejercicio 4 - Los 14 arquitectos, contactados por orden de directorio hasta
# conseguir 8 entrevistas. Si todos aceptan, las probabilidades de inclusion no
# son iguales: son 1 para los ocho primeros y 0 para los seis ultimos.
N_arq <- 14; n_arq <- 8
pi_arq <- c(rep(1, n_arq), rep(0, N_arq - n_arq))
c(suma_pi = sum(pi_arq), n = n_arq, minimo = min(pi_arq))
#> suma_pi       n  minimo
#>       8       8       0

# Suma n, como debe ser, y aun asi el diseno es inservible: seis arquitectos
# tienen probabilidad CERO de salir, asi que ningun estimador puede ser
# insesgado para la poblacion de los catorce.
cat("\n###BLOQUE-S5###\n")
# Ejercicio 5 - Libros en la biblioteca. Se muestrean UBICACIONES, no libros:
# los prestados no estan. Si una fraccion f esta prestada y su tasa de
# necesidad de reencuadernacion es la mitad de la de los que si estan:
p_estante <- 0.30                     # tasa entre los libros presentes
f <- c(0.10, 0.20, 0.30)
p_prestado <- p_estante / 2
p_real_libro <- (1 - f) * p_estante + f * p_prestado
rbind(fraccion_prestada = f,
      valor_real        = round(p_real_libro, 4),
      sesgo             = round(p_estante - p_real_libro, 4))
#>                    [,1] [,2]  [,3]
#> fraccion_prestada 0.100 0.20 0.300
#> valor_real        0.285 0.27 0.255
#> sesgo             0.015 0.03 0.045
