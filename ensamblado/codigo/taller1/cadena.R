suppressMessages({library(survey)})
Sys.setlocale("LC_CTYPE", "en_US.UTF-8")
options(warn = 1, scipen = 999)

cat("\n###BLOQUE-R1###\n")
# Las dos poblaciones del modulo. htpop son 2 000 personas con su estatura: es
# la poblacion COMPLETA, asi que el parametro verdadero se conoce y cada error
# se puede medir en vez de describirse. htsrs es la MAS de n = 200 que Lohr
# extrae de ella. crimes son 5 000 delitos registrados, con una variable
# binaria (arrest) para los errores de proporcion.
ht <- read.csv("CSV data sets for SDA 3e/htpop.csv")
hs <- read.csv("CSV data sets for SDA 3e/htsrs.csv")
cr <- read.csv("CSV data sets for SDA 3e/crimes.csv")

N <- nrow(ht); n <- nrow(hs)
media_verdadera <- mean(ht$height)
total_verdadero <- sum(ht$height)
c(N = N, n = n, media_verdadera = media_verdadera, total_verdadero = total_verdadero)
#>               N               n media_verdadera total_verdadero
#>        2000.000         200.000         168.616      337232.000

cat("\n###BLOQUE-R2###\n")
# ERROR 1 - El total se expande con n en vez de con N.
# El estimador del total es N * y_barra: cada unidad de la muestra representa a
# N/n unidades de la poblacion. Multiplicar por n devuelve la suma de la propia
# muestra, que no estima nada.
ybar <- mean(hs$height)

total_mal  <- ybar * n            # <- el error
total_bien <- ybar * N

c(total_mal = total_mal, total_bien = total_bien,
  verdadero = total_verdadero, veces_menor = total_bien / total_mal)
#>   total_mal  total_bien   verdadero veces_menor
#>       33788      337880      337232          10

cat("\n###BLOQUE-R3###\n")
# ERROR 2 - El error estandar sin la correccion por poblacion finita.
# Sin reemplazo, la varianza lleva el factor (1 - n/N). Aqui n/N = 0,1, asi que
# el fpc vale 0,9 y omitirlo INFLA el error estandar: quien lo olvida se declara
# menos preciso de lo que es. Va siempre en esa direccion.
s <- sd(hs$height)

ee_mal  <- s / sqrt(n)                        # <- el error
ee_bien <- sqrt((1 - n / N) * s^2 / n)

# Segunda via: survey tiene que dar exactamente lo mismo que la formula a mano.
suppressMessages(library(survey))
ee_survey <- as.numeric(SE(svymean(~height, svydesign(id = ~1, fpc = rep(N, n), data = hs))))

c(ee_mal = ee_mal, ee_bien = ee_bien, ee_survey = ee_survey,
  inflacion_pct = (ee_mal / ee_bien - 1) * 100)
#>        ee_mal       ee_bien     ee_survey inflacion_pct
#>     0.7830696     0.7428850     0.7428850     5.4092553

cat("\n###BLOQUE-R4###\n")
# ERROR 3 - qnorm(0.95) en un intervalo bilateral del 95 %.
# Un intervalo de dos colas al 95 % deja 2,5 % en cada extremo: el cuantil es
# qnorm(0.975) = 1,96, no qnorm(0.95) = 1,645. El codigo corre y el intervalo
# sale mas estrecho, que ademas parece mejor: se lee como mas precision.
ee <- sqrt((1 - n / N) * s^2 / n)

ic_mal  <- ybar + c(-1, 1) * qnorm(0.95)  * ee    # <- el error
ic_bien <- ybar + c(-1, 1) * qnorm(0.975) * ee

# La cobertura real del intervalo estrecho se calcula, no se afirma.
cobertura_mal <- (2 * pnorm(qnorm(0.95)) - 1) * 100

c(z_mal = qnorm(0.95), z_bien = qnorm(0.975),
  ancho_mal = diff(ic_mal), ancho_bien = diff(ic_bien),
  estrechado_pct = (1 - diff(ic_mal) / diff(ic_bien)) * 100,
  cobertura_mal_pct = cobertura_mal)
#>             z_mal            z_bien         ancho_mal        ancho_bien
#>          1.644854          1.959964          2.443874          2.912056
#>    estrechado_pct cobertura_mal_pct
#>         16.077354         90.000000

cat("\n###BLOQUE-R5###\n")
# ERROR 4 - La desviacion tipica en el lugar del error estandar.
# s mide cuanto varian las PERSONAS; el error estandar, cuanto varia la MEDIA de
# muestra a muestra. Confundirlos da un intervalo para la media tan ancho como
# la poblacion entera. Ningun estudiante lo escribiria si mirara el resultado,
# y por eso el error de verdad esta en no mirarlo.
ic_s  <- ybar + c(-1, 1) * 1.96 * s     # <- el error
ic_ee <- ybar + c(-1, 1) * 1.96 * ee

c(limite_inf_mal = ic_s[1], limite_sup_mal = ic_s[2],
  limite_inf_bien = ic_ee[1], limite_sup_bien = ic_ee[2],
  veces_mas_ancho = diff(ic_s) / diff(ic_ee))
#>  limite_inf_mal  limite_sup_mal limite_inf_bien limite_sup_bien veces_mas_ancho
#>       147.23442       190.64558       167.48395       170.39605        14.90712

cat("\n###BLOQUE-R6###\n")
# ERROR 5 - La varianza de una proporcion sin fpc y con n en vez de n-1.
# Para una proporcion, Lohr escribe V(p) = (1 - n/N) * p(1-p)/(n-1). Los dos
# atajos -olvidar el fpc y dividir entre n- empujan en direcciones contrarias,
# asi que el resultado sigue pareciendo razonable y no hay nada que delate el
# fallo. Con n grande la diferencia es pequena; con n chico, no.
# En una MAS de 100 delitos del archivo salieron 22 arrestos.
N_cr <- nrow(cr); n_cr <- 100
p    <- 22 / n_cr

ee_p_mal  <- sqrt(p * (1 - p) / n_cr)                                  # <- el error
ee_p_bien <- sqrt((1 - n_cr / N_cr) * p * (1 - p) / (n_cr - 1))

# Cada atajo por separado, para ver que se compensan y por eso no se notan.
solo_sin_fpc <- sqrt(p * (1 - p) / (n_cr - 1))
solo_entre_n <- sqrt((1 - n_cr / N_cr) * p * (1 - p) / n_cr)

c(p = p, ee_mal = ee_p_mal, ee_bien = ee_p_bien,
  solo_sin_fpc_pct = (solo_sin_fpc / ee_p_bien - 1) * 100,
  solo_entre_n_pct = (solo_entre_n / ee_p_bien - 1) * 100,
  los_dos_juntos_pct = (ee_p_mal / ee_p_bien - 1) * 100)
#>                  p             ee_mal            ee_bien   solo_sin_fpc_pct
#>         0.22000000         0.04142463         0.04121488         1.01525446
#>   solo_entre_n_pct los_dos_juntos_pct
#>        -0.50125629         0.50890914

cat("\n###BLOQUE-R7###\n")
# ERROR 6 - El tamano de muestra sin corregir por N, y redondeado hacia abajo.
# n_0 es el tamano que haria falta con poblacion infinita; con N finito se
# corrige. Y el redondeo va SIEMPRE hacia arriba: quedarse corto incumple el
# margen prometido, que es justo lo que se estaba comprando.
S <- sd(ht$height); e <- 1.5
n0 <- (qnorm(0.975) * S / e)^2

n_mal  <- floor(n0)                        # <- los dos errores a la vez
n_bien <- ceiling(n0 / (1 + n0 / N))

c(n0 = n0, n_mal = n_mal, n_bien = n_bien, personas_de_mas = n_mal - n_bien)
#>              n0           n_mal          n_bien personas_de_mas
#>        212.5672        212.0000        193.0000         19.0000

cat("\n###BLOQUE-R8###\n")
# ERROR 7 - La varianza de un sistematico calculada como si fuera un MAS.
# El marco alterna mujer, hombre, mujer, hombre... y el salto k = 10 es par, asi
# que toda muestra cae sobre el mismo sexo: 5 muestras de solo mujeres y 5 de
# solo hombres. Dentro de cada una las estaturas son homogeneas, asi que la
# formula del MAS -que solo mira la dispersion INTERNA- declara una precision
# altisima. Aqui se puede comparar con la verdad porque el diseno solo tiene 10
# muestras posibles y se recorren enteras.
mujeres <- ht$height[ht$gender == "F"]
hombres <- ht$height[ht$gender == "M"]
marco   <- as.vector(rbind(mujeres, hombres))     # M, H, M, H, ...
k <- 10; n_sis <- N / k

medias <- sapply(1:k, function(a) mean(marco[seq(a, N, by = k)]))
var_real <- mean((medias - mean(marco))^2)                       # exacta

s2_dentro   <- mean(sapply(1:k, function(a) var(marco[seq(a, N, by = k)])))
var_declara <- (1 - n_sis / N) * s2_dentro / n_sis               # <- el error

c(medias_min = min(medias), medias_max = max(medias),
  ee_real = sqrt(var_real), ee_declarado = sqrt(var_declara),
  veces_optimista = var_real / var_declara)
#>      medias_min      medias_max         ee_real    ee_declarado veces_optimista
#>     161.6200000     175.7300000       6.5568711       0.6069285     116.7127189

cat("\n###BLOQUE-R9###\n")
# ERROR 8 - El promedio de los promedios.
# La proporcion de arrestos por tipo de delito, promediada sin pesos, trata
# igual al tipo mas raro del archivo que al mas frecuente. La proporcion de la
# poblacion es la media PONDERADA por el tamano de cada grupo.
tasas <- tapply(cr$arrest, cr$crimetype, mean)
tam   <- tapply(cr$arrest, cr$crimetype, length)

p_mal  <- mean(tasas)                          # <- el error
p_bien <- sum(tasas * tam) / sum(tam)

c(tipos = length(tasas), grupo_menor = min(tam), grupo_mayor = max(tam),
  p_mal = p_mal, p_bien = p_bien, puntos_de_error = (p_mal - p_bien) * 100)
#>           tipos     grupo_menor     grupo_mayor           p_mal          p_bien
#>      17.0000000       6.0000000    1016.0000000       0.2882597       0.2766000
#> puntos_de_error
#>       1.1659733

cat("\n###BLOQUE-R10###\n")
# ERROR 9 - na.rm = TRUE cambia la poblacion sin decirlo.
# El formulario tenia un minimo y no registro la estatura de quien mide menos de
# 155 cm. Con na.rm = TRUE la media sale, no hay aviso, y ya no estima la media
# de las 2 000 personas: estima la de las que miden 155 o mas. La pregunta no es
# si el codigo corre, es SOBRE QUE POBLACION queda definida la estimacion.
registrada <- ifelse(ht$height < 155, NA, ht$height)

media_mal  <- mean(registrada, na.rm = TRUE)    # <- el error
faltan     <- sum(is.na(registrada))

c(faltantes = faltan, pct_perdido = faltan / N * 100,
  media_mal = media_mal, media_verdadera = media_verdadera,
  sesgo_cm = media_mal - media_verdadera)
#>       faltantes     pct_perdido       media_mal media_verdadera        sesgo_cm
#>      178.000000        8.900000      170.397366      168.616000        1.781366

cat("\n###BLOQUE-R11###\n")
# ERROR 10 - El mismo diseno escrito en dos lenguajes NO es el mismo diseno.
# sample() de R muestrea SIN reemplazo por defecto; np.random.choice de Python,
# CON reemplazo. Quien traduce su codigo de un lenguaje al otro cambia el diseno
# sin tocar una sola idea, y no hay error ni aviso: solo unidades repetidas y una
# varianza mayor de la que declara la formula sin reemplazo.
# Se sortean POSICIONES, no estaturas: dos personas distintas pueden medir lo
# mismo, asi que contar valores repetidos no dice nada del diseno.
set.seed(2026)
pos_sin <- sample(N, 200)                    # el MAS que se queria
set.seed(2026)
pos_con <- sample(N, 200, replace = TRUE)    # <- lo que hace Python por defecto

# Cuantas personas distintas se esperan con reemplazo: N(1 - (1 - 1/N)^n). Esta
# cifra SI es la misma en los dos lenguajes; el sorteo concreto no, porque una
# semilla no es portable entre R y Python.
esperadas <- N * (1 - (1 - 1 / N)^200)

c(personas_distintas_sin = length(unique(pos_sin)),
  personas_distintas_con = length(unique(pos_con)),
  distintas_esperadas = esperadas,
  veces_repetidas = 200 - length(unique(pos_con)),
  ee_sin = sqrt((1 - 200 / N) * var(ht$height[pos_sin]) / 200),
  ee_con = sqrt(var(ht$height[pos_con]) / 200))
#> personas_distintas_sin personas_distintas_con    distintas_esperadas
#>            200.0000000            189.0000000            190.3704203
#>        veces_repetidas                 ee_sin                 ee_con
#>             11.0000000              0.7554956              0.7968846

cat("\n###BLOQUE-S1###\n")
# EJERCICIO 1 - El MAS completo, de punta a punta.
# Cada solucion carga sus propios datos: quien copie este bloque suelto tiene
# que poder ejecutarlo sin haber corrido nada antes.
hs <- read.csv("CSV data sets for SDA 3e/htsrs.csv")
N <- 2000; n <- nrow(hs)

ybar <- mean(hs$height); s <- sd(hs$height)
ee   <- sqrt((1 - n / N) * s^2 / n)          # el fpc va DENTRO de la raiz
z    <- qnorm(0.975)
ic_media <- ybar + c(-1, 1) * z * ee

t_est   <- N * ybar                          # el total: N por la media, no n
ee_t    <- N * ee                            # el error estandar se expande igual
ic_total <- t_est + c(-1, 1) * z * ee_t

round(c(media = ybar, ee = ee, ic_inf = ic_media[1], ic_sup = ic_media[2],
        total = t_est, ee_total = ee_t, ic_t_inf = ic_total[1], ic_t_sup = ic_total[2]), 3)
#>      media         ee     ic_inf     ic_sup      total   ee_total   ic_t_inf
#>    168.940      0.743    167.484    170.396 337880.000   1485.770 334967.944
#>   ic_t_sup
#> 340792.056

cat("\n###BLOQUE-S2###\n")
# EJERCICIO 2 - Una proporcion, con su correccion por poblacion finita.
# Escenario: de una MAS de 400 delitos del archivo de 5 000, en 105 hubo arresto.
N_cr <- 5000; n_cr <- 400; arrestos <- 105
p <- arrestos / n_cr

# Para una proporcion, Lohr divide entre n-1, no entre n.
ee_p <- sqrt((1 - n_cr / N_cr) * p * (1 - p) / (n_cr - 1))
ic_p <- p + c(-1, 1) * qnorm(0.975) * ee_p

# El archivo entero esta disponible, asi que se puede comprobar si cubre.
cr <- read.csv("CSV data sets for SDA 3e/crimes.csv")
p_verdadera <- mean(cr$arrest)

# El contrafactual de la parte (b): el mismo estudio sobre un archivo 100 veces
# mas grande. Se calcula, para no tener que fiarse de la intuicion.
N_grande <- 500000
f_grande  <- n_cr / N_grande
ee_grande <- sqrt((1 - f_grande) * p * (1 - p) / (n_cr - 1))

round(c(p = p, ee = ee_p, ic_inf = ic_p[1], ic_sup = ic_p[2],
        verdadera = p_verdadera,
        cubre = as.numeric(p_verdadera >= ic_p[1] && p_verdadera <= ic_p[2]),
        f_grande = f_grande, ee_grande = ee_grande,
        sube_pct = (ee_grande / ee_p - 1) * 100), 5)
#>         p        ee    ic_inf    ic_sup verdadera     cubre  f_grande ee_grande
#>   0.26250   0.02113   0.22109   0.30391   0.27660   1.00000   0.00080   0.02202
#>  sube_pct
#>   4.21550

cat("\n###BLOQUE-S3###\n")
# EJERCICIO 3 - Que compra duplicar la muestra.
# El presupuesto alcanza para 200 personas mas. La pregunta no es si mejora
# -siempre mejora- sino CUANTO, y si ese cuanto vale lo que cuesta.
hs <- read.csv("CSV data sets for SDA 3e/htsrs.csv")
N <- 2000; s2 <- var(hs$height)

margen <- function(n) qnorm(0.975) * sqrt((1 - n / N) * s2 / n)

comparacion <- data.frame(
  n      = c(200, 400, 800, 2000),
  margen = sapply(c(200, 400, 800, 2000), margen)
)
comparacion$reduccion_pct <- (1 - comparacion$margen / margen(200)) * 100
round(comparacion, 4)
#>      n margen reduccion_pct
#> 1  200 1.4560        0.0000
#> 2  400 0.9707       33.3333
#> 3  800 0.5944       59.1752
#> 4 2000 0.0000      100.0000

cat("\n###BLOQUE-S4###\n")
# EJERCICIO 4 - El tamano de muestra que se encarga, y el que cabe.
# Las dos preguntas de un estudio real: cuanto necesito para el margen que
# quiero, y que margen consigo con lo que puedo pagar.
N_cr <- 5000; p <- 0.2766; z <- qnorm(0.975)

# (a) cuanto hace falta para un margen de 3 puntos
n0 <- z^2 * p * (1 - p) / 0.03^2
n_necesario <- ceiling(n0 / (1 + n0 / N_cr))       # se redondea HACIA ARRIBA

# (b) que margen sale con 500, que es lo que hay
margen_500 <- z * sqrt((1 - 500 / N_cr) * p * (1 - p) / (500 - 1))

round(c(n0 = n0, n_necesario = n_necesario, margen_con_500_pct = margen_500 * 100,
        margen_pedido_pct = 3), 4)
#>                 n0        n_necesario margen_con_500_pct  margen_pedido_pct
#>           854.0521           730.0000             3.7234             3.0000

cat("\n###BLOQUE-S5###\n")
# EJERCICIO 5 - Sistematico sobre un marco ORDENADO: cuando conviene.
# El diseno solo tiene k = 10 muestras posibles, asi que su varianza real se
# calcula recorriendolas enteras. No hay que simular nada.
ht <- read.csv("CSV data sets for SDA 3e/htpop.csv")
N <- nrow(ht); k <- 10; n_sis <- N / k

marco <- sort(ht$height)                      # ordenado por la variable de interes
medias <- sapply(1:k, function(a) mean(marco[seq(a, N, by = k)]))
var_sis <- mean((medias - mean(marco))^2)     # exacta: el diseno es equiprobable

var_mas <- (1 - n_sis / N) * var(ht$height) / n_sis
deff <- var_sis / var_mas                     # efecto de diseno

round(c(medias_min = min(medias), medias_max = max(medias),
        media_poblacional = mean(marco),
        ee_sistematico = sqrt(var_sis), ee_mas = sqrt(var_mas), deff = deff), 4)
#>        medias_min        medias_max media_poblacional    ee_sistematico
#>          168.4500          168.7800          168.6160            0.1023
#>            ee_mas              deff
#>            0.7485            0.0187
