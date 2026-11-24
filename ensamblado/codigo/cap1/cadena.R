suppressMessages({library(survey); library(sampling); library(TeachingSampling); library(jsonlite)})
Sys.setlocale("LC_CTYPE", "en_US.UTF-8")
options(warn = 1, survey.lonely.psu = "adjust")

cat("\n###BLOQUE-RP1###\n")
# El sesgo del Literary Digest, partido en sus dos causas. El modelo tiene
# cuatro numeros y ninguna libreria: es aritmetica, y esa es la leccion.
#
#   p    apoyo real a Roosevelt (base de dos candidatos)
#   C    fraccion de votantes que estaba en el marco (listas de telefono,
#        registros de automovil, directorios)
#   d    cuanto MAS apoyaban a Roosevelt los que quedaron fuera del marco
#   rho  tasa de respuesta de los partidarios de Roosevelt dividida por la de
#        los de Landon
p <- 0.62467; C <- 0.55; d <- 0.25
p_obs <- 972897 / (1293669 + 972897)              # lo que publico el sondeo

p_C   <- p - (1 - C) * d                          # apoyo dentro del marco
rho   <- p_obs * (1 - p_C) / (p_C * (1 - p_obs))  # la rho que reproduce el sondeo
p_hat <- p_C * rho / (p_C * rho + (1 - p_C))

round(c(p_C = p_C, rho = rho, p_estimado = p_hat, p_publicado = p_obs), 5)
#>         p_C         rho  p_estimado p_publicado
#>     0.51217     0.71631     0.42924     0.42924

cat("\n###BLOQUE-RP2###\n")
# Continua del bloque anterior de este mismo modulo: usa las variables que deja.
# Con esos cuatro numeros, el sesgo se parte en dos sumandos exactos.
sesgo_cobertura <- p_C - p                        # aunque contestaran todos
sesgo_respuesta <- p_hat - p_C                    # dentro de este marco       
round(c(sesgo_cobertura    = sesgo_cobertura,
        sesgo_no_respuesta = sesgo_respuesta,
        suma               = sesgo_cobertura + sesgo_respuesta,
        sesgo_total        = p_hat - p), 5)
#>    sesgo_cobertura sesgo_no_respuesta               suma        sesgo_total
#>           -0.11250           -0.08293           -0.19543           -0.19543

# Los dos sumandos dan el total EXACTAMENTE: no es una aproximacion.
round(sesgo_cobertura + sesgo_respuesta - (p_hat - p), 12)
#> [1] 0

cat("\n###BLOQUE-R1###\n")
# agpop: los 3078 condados agricolas de EE.UU. (censo agricola de 1992).
# Es la POBLACION del curso, y como esta entera se puede comprobar cualquier
# estimacion contra el valor verdadero. Fuera de un aula eso no pasa nunca.
agpop <- read.csv("CSV data sets for SDA 3e/agpop.csv")

# Cuatro de las piezas del modulo, sobre este archivo:
#   poblacion objetivo  -> los condados agricolas de EE.UU.
#   marco muestral      -> la lista de 3078 filas de este archivo
#   unidad              -> un condado (una fila)
#   variable de interes -> acres92, la superficie en explotaciones agricolas en 1992
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
# Continua del bloque anterior de este mismo modulo: usa las variables que deja.
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
# Continua del bloque anterior de este mismo modulo: usa las variables que deja.
# La composicion demografica de cada muestra frente a la del censo.
pct_censo  <- 100 * censo_tel / sum(censo_tel)
pct_online <- 100 * pesos$online_n / sum(pesos$online_n)
comp <- data.frame(
  celda  = paste(pesos$sex, pesos$agegroup, pesos$race),
  censo  = round(pct_censo, 1),
  telef  = round(100 * pesos$tel_n / sum(pesos$tel_n), 1),
  online = round(pct_online, 1))
# El sesgo se calcula con los porcentajes sin redondear y se redondea al final:
# restando los ya redondeados, una celda salia 1,0 donde el valor es 1,1.
comp$sesgo_online <- round(pct_online - pct_censo, 1)
print(comp, row.names = FALSE)
#>                  celda censo telef online sesgo_online
#>  Female Young Nonwhite   7.6   2.6   11.8          4.2
#>     Female Young White  18.1   6.2   31.7         13.6
#>    Female Old Nonwhite   7.6   6.1    1.4         -6.2
#>       Female Old White  18.1  47.8   13.7         -4.4
#>    Male Young Nonwhite   7.2   1.5    8.2          1.1
#>       Male Young White  17.1   5.1   25.8          8.7
#>      Male Old Nonwhite   7.2   4.8    0.8         -6.4
#>         Male Old White  17.1  26.0    6.4        -10.7

# La edad media resume el desastre en un numero.
c(edad_telefonica = mean(tel$age), edad_online = mean(online$age))
#> edad_telefonica     edad_online
#>        60.74864        33.71414

cat("\n###BLOQUE-R5###\n")
# Continua del bloque anterior de este mismo modulo: usa las variables que deja.
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

# Los pesos acercan las dos estimaciones (de 5,9 a 0,9 puntos), pero acercarse
# entre si no es acercarse a la poblacion: calibrar por sexo, edad y raza no
# arregla una seleccion que fallo por otras variables.
cat("\n###BLOQUE-RP3###\n")
# La formula del sesgo de no respuesta, termino a termino.
#   mu = r mu_R + (1 - r) mu_M     =>     mu_R - mu = (1 - r)(mu_R - mu_M)
r <- 0.045; mu_R <- 0.84; mu_M <- 0.30
mu <- r * mu_R + (1 - r) * mu_M
round(c(tasa_respuesta         = r,
        media_respondientes    = mu_R,
        media_no_respondientes = mu_M,
        media_poblacional      = mu,
        sesgo                  = mu_R - mu,
        sesgo_por_la_formula   = (1 - r) * (mu_R - mu_M)), 5)
#>         tasa_respuesta    media_respondientes media_no_respondientes
#>                 0.0450                 0.8400                 0.3000
#>      media_poblacional                  sesgo   sesgo_por_la_formula
#>                 0.3243                 0.5157                 0.5157

cat("\n###BLOQUE-R6###\n")
# agpop se leyo en el modulo 2; se vuelve a leer para que este bloque corra suelto.
agpop <- read.csv("CSV data sets for SDA 3e/agpop.csv")

# Sesgo de no respuesta con clases de respuesta. Las cuatro regiones de agpop
# hacen de clases; r_h es la tasa de respuesta de cada una.
#
# Ojo al reutilizar nombres: el bloque anterior deja `mu` valiendo una
# proporcion del ejemplo de juguete. Aqui se REDEFINE como la media de acres92,
# que es lo que significa en este bloque; sin esa linea, el bloque heredaria el
# valor equivocado en cuanto se ejecutara la cadena de arriba abajo.
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
# alta y la otra muy baja, y las dos dan sesgo cero. El tercero deja al Oeste,
# donde los condados son mas grandes, en 0.20, y al Nordeste, donde son mas
# pequenos, en 0.65 (el orden es NC, NE, S, W, el alfabetico).
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
p_real     <- 27.753 / (27.753 + 16.675)   # votos de 1936, en millones de votos
sesgo      <- p_sondeo - p_real
S2         <- p_real * (1 - p_real)
round(c(n_digest = n_digest, p_sondeo = p_sondeo, p_real = p_real, sesgo = sesgo), 5)
#>      n_digest      p_sondeo        p_real         sesgo
#> 2266566.00000       0.42924       0.62467      -0.19544

cat("\n###BLOQUE-R8###\n")
# Las cuatro cantidades vienen del bloque anterior; se rehacen para que este
# corra suelto, igual que en la pestana de Python:
n_digest <- 1293669 + 972897
p_real   <- 27.753 / (27.753 + 16.675)
sesgo    <- 972897 / n_digest - p_real
S2       <- p_real * (1 - p_real)

# El sondeo de 2,3 millones frente a un muestreo aleatorio simple de 1000.
ecm_digest <- sesgo^2 + S2 / n_digest
ecm_mas    <- S2 / 1000
round(c(recm_digest = sqrt(ecm_digest), recm_mas = sqrt(ecm_mas),
        veces_peor  = sqrt(ecm_digest / ecm_mas)), 4)
#> recm_digest    recm_mas  veces_peor
#>      0.1954      0.0153     12.7636

# El suelo, tamano a tamano. Solo la varianza baja con n: la columna insesgada
# tiende a cero y la sesgada se para en el sesgo y ya no se mueve.
ecm     <- function(n, b) b^2 + S2 / n
tamanos <- c(1000, 10000, 100000, 1000000, n_digest)
data.frame(n              = tamanos,
           recm_insesgado = round(sqrt(ecm(tamanos, 0)), 5),
           recm_sesgado   = round(sqrt(ecm(tamanos, sesgo)), 5))
#>         n recm_insesgado recm_sesgado
#> 1    1000        0.01531      0.19603
#> 2   10000        0.00484      0.19550
#> 3  100000        0.00153      0.19544
#> 4 1000000        0.00048      0.19544
#> 5 2266566        0.00032      0.19544

# Tamano equivalente: el n de un muestreo aleatorio con el MISMO error cuadratico
# medio que el sondeo sesgado. Se despeja de  S2 / n = ECM.
round(S2 / ecm_digest, 2)
#> [1] 6.14

cat("\n###BLOQUE-R9###\n")
# Este bloque usa agpop, que se leyo en el modulo 2, y las cuatro regiones del
# modulo 4. Se rehacen aqui para que el bloque corra suelto:
agpop <- read.csv("CSV data sets for SDA 3e/agpop.csv")
reg   <- split(agpop$acres92, agpop$region)
N_h   <- sapply(reg, length); mu_h <- sapply(reg, mean)

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
# Ejercicio 1 - Jurados en Maricopa. Analisis de flujo del marco a la muestra.
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

# Cada escalon, como porcentaje de las citaciones enviadas:
round(100 * c(no_entregada = no_entregada, no_calificado = no_calificado,
              excusado = excusado) / citaciones, 2)
#>  no_entregada no_calificado      excusado
#>         22.93          6.98         21.93

cat("\n###BLOQUE-S2###\n")
# Ejercicio 2 - Los 14 arquitectos, llamados por orden del directorio: los 8
# primeros que aceptan forman la muestra. Supuesto del enunciado: cada uno
# acepta con probabilidad 0,7, independientemente de los demas.
# El arquitecto k entra si acepta y si, cuando le toca, aun no hay 8; es decir,
# si entre los k - 1 anteriores aceptaron 7 o menos:
#   pi_k = 0,7 * P(Bin(k - 1; 0,7) <= 7)
N_arq <- 14; n_arq <- 8; p_acepta <- 0.7
k <- 1:N_arq
pi_arq <- p_acepta * pbinom(n_arq - 1, k - 1, p_acepta)
round(pi_arq, 4)
#>  [1] 0.7000 0.7000 0.7000 0.7000 0.7000 0.7000 0.7000 0.7000 0.6596 0.5628
#> [11] 0.4321 0.3013 0.1934 0.1158
round(c(pi_1 = pi_arq[1], pi_9 = pi_arq[9], pi_14 = pi_arq[14],
        suma = sum(pi_arq),
        pct_menos_de_8 = 100 * pbinom(n_arq - 1, N_arq, p_acepta)), 4)
#>           pi_1           pi_9          pi_14           suma pct_menos_de_8
#>         0.7000         0.6596         0.1158         7.8650         9.3282

# Ninguna pi_k es cero, pero la suma no llega a 8: es el tamano ESPERADO de la
# muestra, porque a veces aceptan menos de 8 de los 14. Y cada pi_k depende de
# la probabilidad de aceptar, que en la realidad nadie conoce.
cat("\n###BLOQUE-S3###\n")
# Ejercicio 3 - Fondos mutuos. El diseno (sistematico 1 en 10) es impecable:
# reparte la misma probabilidad de inclusion a todo lo que este en la lista.
N_lista <- 1250            # el supuesto del enunciado: la lista tiene 1250 fondos
k <- 10
c(pi_k = 1 / k, suma_pi = N_lista * (1 / k), n_esperado = N_lista / k)
#>       pi_k    suma_pi n_esperado
#>        0.1      125.0      125.0

# El defecto esta antes: si el periodico solo publica los fondos por encima de
# cierto tamano, los que faltan tienen pi_k = 0 y ningun diseno los recupera.
cat("\n###BLOQUE-S4###\n")
# Ejercicio 4 - Libros en la biblioteca. Se muestrean UBICACIONES, no libros:
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

cat("\n###BLOQUE-S5###\n")
# Ejercicio 5 - La encuesta de Parade. Formula del sesgo de no respuesta:
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

cat("\n###BLOQUE-S6###\n")
# Ejercicio 6 - La omision del Censo 2018 (DANE, comunicado del 17-X-2019, p. 3).
# Supuesto del enunciado: cada porcentaje es la fraccion de la poblacion real
# de la zona que el censo no conto.
om_total <- 0.085; om_cab <- 0.064; om_rur <- 0.150
# El total mezcla las dos zonas, como la formula del modulo 4:
#   om_total = w_rur * om_rur + (1 - w_rur) * om_cab
w_rur <- (om_total - om_cab) / (om_rur - om_cab)
round(c(peso_rural = w_rur, peso_cabeceras = 1 - w_rur), 4)
#>     peso_rural peso_cabeceras
#>         0.2442         0.7558

# Los porcentajes vienen redondeados a una decima. El peso mas bajo y el mas
# alto que son compatibles con ese redondeo:
round(c(minimo = (0.0845 - 0.0645) / (0.1505 - 0.0645),
        maximo = (0.0855 - 0.0635) / (0.1495 - 0.0635)), 4)
#> minimo maximo
#> 0.2326 0.2558

# Una caracteristica inventada para el ejercicio: la tiene el 60 % de la gente
# de las cabeceras y el 20 % de la del rural.
p_cab <- 0.60; p_rur <- 0.20
real <- (1 - w_rur) * p_cab + w_rur * p_rur
# El censo sin ajustar solo ve a los contados: cada zona pesa por lo que conto.
contados_cab <- (1 - w_rur) * (1 - om_cab)
contados_rur <- w_rur * (1 - om_rur)
censo <- (contados_cab * p_cab + contados_rur * p_rur) / (contados_cab + contados_rur)
round(c(real_pct = 100 * real, censo_pct = 100 * censo,
        sesgo_puntos = 100 * (censo - real)), 2)
#>     real_pct    censo_pct sesgo_puntos
#>        50.23        50.93         0.69
