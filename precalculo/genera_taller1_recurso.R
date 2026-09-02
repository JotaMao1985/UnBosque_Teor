# genera_taller1_recurso.R — datos del simulacro del Taller 1 (recurso de práctica)
#
# Ejecutar SIEMPRE con el R del framework 4.4, desde la raíz del repositorio:
#   /Library/Frameworks/R.framework/Versions/4.4-arm64/Resources/bin/Rscript precalculo/genera_taller1_recurso.R
#
# Produce  precalculo/salidas/taller1_recurso_datos.json,  que alimenta el banco
# de 30 items de ensamblado/modulos/taller1/simulacro.js. Ninguna cifra del banco
# se escribe a mano: toda respuesta numerica y toda cifra citada en una
# retroalimentacion sale de aqui.
#
# POBLACIONES. El simulacro NO puede usar las de la entrega calificada
# (intelltel, intellonline y agpop): regalaria respuestas. Usa dos que no
# aparecen ni en la entrega ni en ninguno de los ocho capitulos publicados:
#
#   htpop  — N = 2 000 personas con estatura y sexo. Es la POBLACION COMPLETA,
#            asi que el parametro verdadero se conoce y se puede medir de verdad
#            el sesgo, la cobertura de los intervalos y la varianza real de un
#            diseno sistematico recorriendo su espacio de muestras entero.
#   htsrs  — el MAS de n = 200 que Lohr extrae de esa poblacion.
#   crimes — N = 5 000 delitos registrados; da la variable binaria (arrest) para
#            los items de proporcion y de tamano de muestra.

source("precalculo/_comun.R")
suppressPackageStartupMessages(library(survey))

set.seed(SEMILLA)
D <- list()

# =============================================================================
# 1. La poblacion de estaturas: el marco y sus parametros verdaderos
# =============================================================================
ht <- lee_lohr("htpop")
N_ht     <- nrow(ht)
media_ht <- mean(ht$height)
S_ht     <- sd(ht$height)          # Lohr define S^2 con denominador N-1: es sd()
S2_ht    <- var(ht$height)

por_sexo <- do.call(rbind, lapply(split(ht$height, ht$gender), function(x)
  data.frame(n = length(x), media = mean(x), sd = sd(x))))
por_sexo$sexo <- rownames(por_sexo)

D$poblacion <- list(
  N = N_ht, media = media_ht, S = S_ht, S2 = S2_ht,
  min = min(ht$height), max = max(ht$height),
  mujeres = list(n = por_sexo["F", "n"], media = por_sexo["F", "media"], sd = por_sexo["F", "sd"]),
  hombres = list(n = por_sexo["M", "n"], media = por_sexo["M", "media"], sd = por_sexo["M", "sd"])
)

cat("\n1. POBLACION htpop\n")
cat(sprintf("   N = %d   media = %.4f   S = %.4f   S2 = %.4f\n", N_ht, media_ht, S_ht, S2_ht))
cat(sprintf("   mujeres: n = %d  media = %.4f  sd = %.4f\n",
            por_sexo["F", "n"], por_sexo["F", "media"], por_sexo["F", "sd"]))
cat(sprintf("   hombres: n = %d  media = %.4f  sd = %.4f\n",
            por_sexo["M", "n"], por_sexo["M", "media"], por_sexo["M", "sd"]))

# =============================================================================
# 2. El MAS de Lohr (htsrs): estimacion, fpc e intervalo — items S3-2, S3-3, S3-4
# =============================================================================
hs   <- lee_lohr("htsrs")
n_hs <- nrow(hs)
ybar <- mean(hs$height)
s_hs <- sd(hs$height)
f    <- n_hs / N_ht                       # fraccion de muestreo
fpc  <- 1 - f

se_fpc    <- sqrt(fpc * s_hs^2 / n_hs)    # error estandar correcto (sin reemplazo)
se_sinfpc <- sqrt(s_hs^2 / n_hs)          # el que sale de olvidar el fpc
inflacion <- (se_sinfpc / se_fpc - 1) * 100

# Segunda via obligatoria: survey tiene que dar exactamente lo mismo.
dis <- svydesign(id = ~1, fpc = rep(N_ht, n_hs), data = hs)
se_survey <- as.numeric(SE(svymean(~height, dis)))
stopifnot(abs(se_survey - se_fpc) < 1e-10)

z <- qnorm(0.975)
ic_lo <- ybar - z * se_fpc
ic_hi <- ybar + z * se_fpc
cubre <- (media_ht >= ic_lo) && (media_ht <= ic_hi)

t_est    <- N_ht * ybar
se_total <- N_ht * se_fpc
t_verdad <- sum(ht$height)

pi_k  <- n_hs / N_ht
pi_kl <- n_hs * (n_hs - 1) / (N_ht * (N_ht - 1))
d_k   <- 1 / pi_k

D$mas <- list(
  n = n_hs, ybar = ybar, s = s_hs, f = f, fpc = fpc,
  seFpc = se_fpc, seSinFpc = se_sinfpc, inflacion = inflacion,
  z = z, icLo = ic_lo, icHi = ic_hi, semiancho = z * se_fpc, cubre = cubre,
  total = t_est, seTotal = se_total, totalVerdadero = t_verdad,
  piK = pi_k, piKl = pi_kl, dK = d_k,
  mujeres = sum(hs$gender == "F"), hombres = sum(hs$gender == "M")
)

cat("\n2. MAS htsrs (n = 200 de N = 2 000)\n")
cat(sprintf("   ybar = %.4f   s = %.4f   f = %.4f   fpc = %.4f\n", ybar, s_hs, f, fpc))
cat(sprintf("   SE con fpc = %.6f   SE sin fpc = %.6f   inflacion = %.4f %%\n",
            se_fpc, se_sinfpc, inflacion))
cat(sprintf("   SE por survey = %.6f  (coincide)\n", se_survey))
cat(sprintf("   IC 95%%: [%.4f ; %.4f]   semiancho = %.4f   cubre %.4f: %s\n",
            ic_lo, ic_hi, z * se_fpc, media_ht, cubre))
cat(sprintf("   total estimado = %.2f   SE = %.2f   total verdadero = %d\n",
            t_est, se_total, t_verdad))
cat(sprintf("   pi_k = %.4f   pi_kl = %.8f   d_k = %.1f\n", pi_k, pi_kl, d_k))

# =============================================================================
# 3. Autoseleccion: el sesgo de no respuesta, exacto — items S2-4 y S2-6
# =============================================================================
# Mecanismo: responden los 1 000 hombres y una de cada tres mujeres, elegidas
# al azar. Es el caso de libro —quien responde difiere en y de quien no— y aqui
# se puede medir porque el marco entero esta sobre la mesa.
set.seed(SEMILLA)
mujeres   <- ht$height[ht$gender == "F"]
hombres   <- ht$height[ht$gender == "M"]
idx_resp  <- sample(seq_along(mujeres), 300)
muj_resp  <- mujeres[idx_resp]
muj_noresp <- mujeres[-idx_resp]

resp        <- c(hombres, muj_resp)
n_resp      <- length(resp)
media_resp  <- mean(resp)
media_noresp <- mean(muj_noresp)
tasa_resp   <- n_resp / N_ht
sesgo       <- media_resp - media_ht

# La identidad del capitulo 1: sesgo = (1 - tasa de respuesta) x (diferencia de medias)
sesgo_identidad <- (1 - tasa_resp) * (media_resp - media_noresp)
stopifnot(abs(sesgo - sesgo_identidad) < 1e-9)

# Lo que NO arregla n: con el mismo mecanismo, el sesgo no depende del tamano.
D$noRespuesta <- list(
  nResp = n_resp, tasaResp = tasa_resp,
  mediaResp = media_resp, mediaNoResp = media_noresp,
  mediaMujeresResp = mean(muj_resp), nMujeresResp = length(muj_resp),
  sesgo = sesgo, sesgoIdentidad = sesgo_identidad,
  mediaMarco = media_ht
)

cat("\n3. AUTOSELECCION (responden los 1 000 hombres y 300 mujeres al azar)\n")
cat(sprintf("   respondientes = %d   tasa = %.4f\n", n_resp, tasa_resp))
cat(sprintf("   media mujeres que responden = %.4f\n", mean(muj_resp)))
cat(sprintf("   media respondientes = %.4f   media no respondientes = %.4f\n",
            media_resp, media_noresp))
cat(sprintf("   sesgo = %.4f cm   (identidad: %.4f)\n", sesgo, sesgo_identidad))

# Histogramas para el grafico S2-6: mismas clases para las dos series.
clases <- seq(130, 210, by = 5)
hist_marco <- hist(ht$height, breaks = clases, plot = FALSE)
hist_resp  <- hist(resp,      breaks = clases, plot = FALSE)
D$histogramas <- list(
  centros = hist_marco$mids,
  marco   = hist_marco$counts,
  resp    = hist_resp$counts,
  # proporciones, que es como se comparan dos series de distinto tamano
  marcoProp = hist_marco$counts / N_ht,
  respProp  = hist_resp$counts / n_resp
)

# =============================================================================
# 4. Cobertura: 100 intervalos al 95 % con n = 50 — item S3-8
# =============================================================================
set.seed(SEMILLA)
n_cob <- 50
reps  <- 100
intervalos <- do.call(rbind, lapply(seq_len(reps), function(i) {
  m  <- sample(ht$height, n_cob)
  yb <- mean(m)
  se <- sqrt((1 - n_cob / N_ht) * var(m) / n_cob)
  data.frame(rep = i, media = yb, lo = yb - z * se, hi = yb + z * se)
}))
intervalos$cubre <- intervalos$lo <= media_ht & intervalos$hi >= media_ht
n_cubren <- sum(intervalos$cubre)

D$cobertura <- list(
  n = n_cob, reps = reps, cubren = n_cubren, fallan = reps - n_cubren,
  mediaPoblacional = media_ht,
  intervalos = intervalos[, c("media", "lo", "hi", "cubre")]
)

cat("\n4. COBERTURA (100 MAS de n = 50)\n")
cat(sprintf("   cubren la media poblacional: %d de %d   fallan: %d\n",
            n_cubren, reps, reps - n_cubren))

# =============================================================================
# 5. Tamano de muestra — items S4-1, S4-2, S4-3 y el grafico S4-7
# =============================================================================
# 5a. Media: margen de 1,5 cm al 95 %, con S del estudio previo.
margen  <- 1.5
n0_med  <- (z * S_ht / margen)^2
n_med   <- ceiling(n0_med / (1 + n0_med / N_ht))
n_med_sinfpc <- ceiling(n0_med)

# Robustez del redondeo. La respuesta de un item numerico es un entero, asi que
# no puede quedar a un pelo del borde: si el estudiante escribe z = 1,96 en vez
# de qnorm(0,975) tiene que salirle el MISMO entero. Se comprueba, no se supone.
n_entero <- function(z_, S_, e_, N_) {
  n0 <- (z_ * S_ / e_)^2
  ceiling(n0 / (1 + n0 / N_))
}
variantes_med <- sapply(c(1.96, qnorm(0.975)), n_entero, S_ = S_ht, e_ = margen, N_ = N_ht)
stopifnot(length(unique(variantes_med)) == 1, unique(variantes_med) == n_med)

# 5b. Proporcion sobre crimes: margen de 3 puntos al 95 %.
cr    <- lee_lohr("crimes")
N_cr  <- nrow(cr)
p_cr  <- mean(cr$arrest)
e_cr  <- 0.03
n0_pr <- z^2 * p_cr * (1 - p_cr) / e_cr^2
n_pr  <- ceiling(n0_pr / (1 + n0_pr / N_cr))
n_pr_sinfpc <- ceiling(n0_pr)
# El techo: con p = 0,5 (el peor caso) el n0 sube a esto.
# n0 con p = 0,5 (el peor caso). Se guardan las DOS cifras y no solo el techo:
# el capitulo 2 publica «el celebre n_0 = 1 067», que es el valor exacto, y la
# retro del simulacro citaba 1 068 -que es su redondeo hacia arriba, o sea n-.
# Un estudiante con los dos documentos abiertos veia una contradiccion donde
# solo habia dos cosas distintas con el mismo nombre.
n0_peor_exacto <- z^2 * 0.25 / e_cr^2
n0_peor <- ceiling(n0_peor_exacto)

n_entero_p <- function(z_, p_, e_, N_) {
  n0 <- z_^2 * p_ * (1 - p_) / e_^2
  ceiling(n0 / (1 + n0 / N_))
}
variantes_pr <- sapply(c(1.96, qnorm(0.975)), n_entero_p, p_ = p_cr, e_ = e_cr, N_ = N_cr)
stopifnot(length(unique(variantes_pr)) == 1, unique(variantes_pr) == n_pr)

# 5c. Que pasa si N se multiplica por 100 (item S4-3): n apenas se mueve.
n_pr_N100 <- ceiling(n0_pr / (1 + n0_pr / (N_cr * 100)))

D$tamano <- list(
  z = z, margenMedia = margen, S = S_ht,
  n0Media = n0_med, nMedia = n_med, nMediaSinFpc = n_med_sinfpc,
  crimes = list(N = N_cr, p = p_cr, arrestos = sum(cr$arrest), margen = e_cr,
                n0 = n0_pr, n = n_pr, nSinFpc = n_pr_sinfpc,
                n0Peor = n0_peor, n0PeorExacto = n0_peor_exacto, nN100 = n_pr_N100)
)

cat("\n5. TAMANO DE MUESTRA\n")
cat(sprintf("   media, margen 1,5 cm: n0 = %.4f  ->  n con fpc = %d   sin fpc = %d\n",
            n0_med, n_med, n_med_sinfpc))
cat(sprintf("   crimes: N = %d  p = %.4f (%d arrestos)\n", N_cr, p_cr, sum(cr$arrest)))
cat(sprintf("   proporcion, margen 3 %%: n0 = %.4f  ->  n con fpc = %d   sin fpc = %d\n",
            n0_pr, n_pr, n_pr_sinfpc))
cat(sprintf("   con p = 0,5 (peor caso): n0 = %d      con N x 100: n = %d\n",
            n0_peor, n_pr_N100))

# 5d. Curva margen de error frente a n, con y sin fpc (grafico S4-7).
ns <- c(seq(25, 200, by = 25), seq(250, 1000, by = 50), seq(1100, 2000, by = 100))
curva <- data.frame(
  n = ns,
  conFpc  = z * sqrt((1 - ns / N_ht) * S2_ht / ns),
  sinFpc  = z * sqrt(S2_ht / ns)
)
D$curvaMargen <- curva

cat(sprintf("   curva: n = 100 -> margen %.4f cm (con fpc) / %.4f (sin);  n = 2000 -> %.4f / %.4f\n",
            curva$conFpc[curva$n == 100], curva$sinFpc[curva$n == 100],
            curva$conFpc[curva$n == 2000], curva$sinFpc[curva$n == 2000]))

# Cuadruplicar n parte el margen por la mitad: se comprueba, no se afirma.
m100 <- z * sqrt(S2_ht / 100)
m400 <- z * sqrt(S2_ht / 400)
stopifnot(abs(m100 / m400 - 2) < 1e-9)

# =============================================================================
# 6. Sistematico: el marco periodico y el marco ordenado — items S4-4 a S4-8
# =============================================================================
# El espacio de muestras del sistematico con salto k tiene EXACTAMENTE k
# elementos, asi que su varianza real se calcula recorriendolo entero. Nada de
# simular: aqui se puede ser exacto.
k <- 10
n_sis <- N_ht / k
stopifnot(n_sis == floor(n_sis))

varianza_sistematica <- function(y) {
  medias <- sapply(1:k, function(inicio) mean(y[seq(inicio, length(y), by = k)]))
  # V(ybar_sis) = (1/k) * sum (ybar_i - ybar_U)^2  : el diseno es equiprobable
  list(medias = medias, var = mean((medias - mean(y))^2))
}

# 6a. Marco PERIODICO: la lista alterna mujer, hombre, mujer, hombre...
#     El salto k = 10 es par, asi que toda muestra cae siempre sobre el mismo
#     sexo: 5 muestras de solo mujeres y 5 de solo hombres.
marco_periodico <- as.vector(rbind(mujeres, hombres))
sis_per <- varianza_sistematica(marco_periodico)

# La varianza que declararia quien aplicara la formula del MAS a esas muestras.
var_mas_teorica <- (1 - n_sis / N_ht) * S2_ht / n_sis
s2_dentro <- mean(sapply(1:k, function(i)
  var(marco_periodico[seq(i, N_ht, by = k)])))
var_mas_declarada <- (1 - n_sis / N_ht) * s2_dentro / n_sis

# 6b. Marco ORDENADO por estatura: el sistematico se comporta como estratificado.
marco_ordenado <- sort(ht$height)
sis_ord <- varianza_sistematica(marco_ordenado)

D$sistematico <- list(
  k = k, n = n_sis,
  periodico = list(
    medias = sis_per$medias, var = sis_per$var, ee = sqrt(sis_per$var),
    mediasDistintas = length(unique(round(sis_per$medias, 6))),
    s2Dentro = s2_dentro,
    varDeclarada = var_mas_declarada, eeDeclarado = sqrt(var_mas_declarada),
    razon = sis_per$var / var_mas_declarada
  ),
  ordenado = list(
    medias = sis_ord$medias, var = sis_ord$var, ee = sqrt(sis_ord$var),
    razonFrenteAMas = sis_ord$var / var_mas_teorica
  ),
  mas = list(var = var_mas_teorica, ee = sqrt(var_mas_teorica))
)

cat("\n6. SISTEMATICO (k = 10, n = 200, espacio de muestras completo)\n")
cat(sprintf("   marco periodico: %d medias distintas -> %s\n",
            length(unique(round(sis_per$medias, 6))),
            paste(sprintf("%.3f", sort(unique(round(sis_per$medias, 3)))), collapse = " / ")))
cat(sprintf("   V real = %.4f (EE = %.4f cm)\n", sis_per$var, sqrt(sis_per$var)))
cat(sprintf("   V que declararia la formula del MAS = %.4f (EE = %.4f cm)  ->  la real es %.1f veces mayor\n",
            var_mas_declarada, sqrt(var_mas_declarada), sis_per$var / var_mas_declarada))
cat(sprintf("   marco ordenado por estatura: V real = %.6f (EE = %.4f cm)\n",
            sis_ord$var, sqrt(sis_ord$var)))
cat(sprintf("   MAS con el mismo n: V = %.4f (EE = %.4f cm)  ->  el ordenado es %.3f veces la del MAS\n",
            var_mas_teorica, sqrt(var_mas_teorica), sis_ord$var / var_mas_teorica))

# =============================================================================
# 7. Las cifras que CITAN las retroalimentaciones del banco
# =============================================================================
# Una retroalimentacion que dice "si te salio 0,7048 multiplicaste por 0,9 fuera
# de la raiz" esta afirmando algo verificable. Aqui se calculan esos numeros
# —incluidos los de los errores tipicos que el banco nombra— para que ninguno
# se escriba de memoria. prueba_banco_taller1.py los contrasta contra el texto.
cat("\n7. CIFRAS CITADAS EN LAS RETROALIMENTACIONES\n")

citadas <- list(
  # S2-4: los dos atajos falsos del sesgo de no respuesta
  mediaSinPonderar   = (por_sexo["M", "media"] + mean(muj_resp)) / 2,
  # S3-2: los dos errores tipicos con el fpc
  seFpcFueraDeRaiz   = se_sinfpc * fpc,          # multiplicar el EE, no la varianza
  semiAnchoConS      = z * s_hs,                 # usar s en vez del error estandar
  # S3-4: la alternativa que sale de calcular el cambio al reves
  inflacionAlReves   = (1 - sqrt(fpc)) * 100,
  # S4-1 y S4-2: cuanto ahorra la correccion por poblacion finita
  ahorroMedia        = n_med_sinfpc - n_med,
  ahorroProporcion   = n_pr_sinfpc - n_pr,
  fraccionProporcion = n_pr / N_cr,
  # S4-7: dos puntos concretos de la curva que el item nombra
  margen100ConFpc    = curva$conFpc[curva$n == 100],
  margen100SinFpc    = curva$sinFpc[curva$n == 100],
  margen500ConFpc    = curva$conFpc[curva$n == 500],
  # S2-7: la descomposicion del ECM con sesgo 3,5 y EE 0,3
  ecmSesgo2          = 3.5^2,
  ecmVar             = 0.3^2,
  ecmTotal           = 3.5^2 + 0.3^2,
  ecmVarCuadruple    = 0.3^2 / 4,
  ecmTotalCuadruple  = 3.5^2 + 0.3^2 / 4,
  ecmPesoVar         = 0.3^2 / (3.5^2 + 0.3^2) * 100,
  # S3-6: cuanto se aparta del esperado el 96 de mujeres de htsrs
  sdMujeresEnMuestra = sqrt(n_hs * 0.5 * 0.5 * (N_ht - n_hs) / (N_ht - 1)),
  # Pasos INTERMEDIOS que las retroalimentaciones muestran para que el
  # estudiante siga la cuenta. Estan aqui por la misma razon que todo lo demas:
  # una cifra intermedia escrita a mano se equivoca igual que una final, y el
  # verificador no puede respaldarla si no sale de ninguna ejecucion.
  tasaNoRespuesta     = 1 - tasa_resp,             # 0,35
  raizFpc             = sqrt(fpc),                 # 0,9487
  factorInflacion     = 1 / sqrt(fpc),             # 1,0541
  inflacionFraccion   = 1 / sqrt(fpc) - 1,         # 0,0541
  nMediaSinRedondear  = n0_med / (1 + n0_med / N_ht),
  nProporcionSinRedondear = n0_pr / (1 + n0_pr / N_cr),
  unoMenosP           = 1 - p_cr,                  # 0,7234
  # El estudiante escribe z = 1,96, no qnorm(0,975): 1,96^2 = 3,8416 y
  # qnorm(0,975)^2 = 3,84146 no redondean igual a cuatro decimales.
  zRedondo            = 1.96,
  zRedondoCuadrado    = 1.96^2,
  raizDos             = sqrt(2)
)
D$citadas <- citadas

for (nm in names(citadas)) cat(sprintf("   %-20s %s\n", nm, format(citadas[[nm]], digits = 6)))

# El banco afirma que 96 mujeres esta a menos de un error estandar de 100.
stopifnot(abs(sum(hs$gender == "F") - 100) < citadas$sdMujeresEnMuestra)
# Y que la curva del fpc llega exactamente a cero en n = N.
stopifnot(curva$conFpc[curva$n == N_ht] == 0)

# =============================================================================
# 8. Salida
# =============================================================================
escribe_json(D, "taller1_recurso_datos")
cat("\nListo.\n")
