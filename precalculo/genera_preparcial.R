# genera_preparcial.R — cifras de los 22 items nuevos del Preparcial del Corte I
#
# Ejecutar SIEMPRE con el R del framework 4.4, desde la raiz del repositorio:
#   /Library/Frameworks/R.framework/Versions/4.4-arm64/Resources/bin/Rscript precalculo/genera_preparcial.R
#
# Produce  precalculo/salidas/preparcial_datos.json,  que alimenta el banco de
# los 22 items nuevos. Ninguna cifra se escribe a mano: toda respuesta numerica,
# todo dato de grafico y toda cifra citada en una retroalimentacion sale de aqui.
#
# POBLACION (D15, tarea P1.1). `baseball`: los 797 jugadores de las 30
# plantillas de la MLB en 2004. Es POBLACION COMPLETA, no muestra, asi que el
# parametro verdadero se conoce y el sesgo del marco se MIDE en vez de
# describirse. No aparece en ninguna de las diez paginas del sitio ni en los 88
# documentos que las producen.
#
# LO QUE ESTE GUION NO HACE: inventar una historia. La no cobertura del marco no
# es un supuesto didactico — es el bateador designado de la Liga Americana, que
# deja sin turno al bate a 103 de sus lanzadores.
#
# DOBLE VIA. Toda varianza se calcula por dos caminos independientes y el guion
# ABORTA si no coinciden: la formula a mano contra `survey` en el MAS, y la
# varianza exacta por enumeracion contra la formula de Horvitz-Thompson en el
# diseno pequeno.

source("precalculo/_comun.R")
suppressPackageStartupMessages(library(survey))

# Comparar cifras de siete digitos con una tolerancia ABSOLUTA no comprueba
# nada: `abs(a - b) < 1e-4` sobre una varianza del orden de 1e13 exige mas
# precision de la que tiene un `double`, y el guion aborta con dos numeros que
# son el mismo. La tolerancia va relativa a la magnitud. Costo una ejecucion.
casi <- function(a, b, tol = 1e-9) all(abs(a - b) <= tol * pmax(1, abs(a), abs(b)))

# La semilla es la fecha del parcial. Declarada aqui, como manda precalculo/README.md.
SEMILLA_PREPARCIAL <- 20260903L
set.seed(SEMILLA_PREPARCIAL)

D <- list(meta = list(
  script = "precalculo/genera_preparcial.R",
  semilla = SEMILLA_PREPARCIAL,
  poblacion = "baseball",
  r = paste(R.version$major, R.version$minor, sep = "."),
  survey = as.character(packageVersion("survey"))
))

# =============================================================================
# 1. LA POBLACION Y SUS PARAMETROS VERDADEROS
# =============================================================================
bb <- lee_lohr("baseball")
N   <- nrow(bb)
y   <- bb$salary
mu  <- mean(y)
S   <- sd(y)                       # Lohr define S con denominador N-1
S2  <- var(y)
t_N <- sum(y)

equipos <- table(bb$team)
lanz    <- bb$pos == "P"

D$poblacion <- list(
  N = N, media = mu, mediana = median(y), S = S, S2 = S2, total = t_N,
  min = min(y), max = max(y),
  equipos = length(equipos), plantillaMin = min(equipos), plantillaMax = max(equipos),
  lanzadores = sum(lanz), propLanzadores = mean(lanz)
)

cat("\n1. POBLACION baseball\n")
cat(sprintf("   N = %d   media = %.4f   mediana = %.0f   S = %.4f\n", N, mu, median(y), S))
cat(sprintf("   total = %.0f   rango = [%.0f ; %.0f]\n", t_N, min(y), max(y)))
cat(sprintf("   %d equipos, plantillas de %d a %d   lanzadores = %d (%.4f)\n",
            length(equipos), min(equipos), max(equipos), sum(lanz), mean(lanz)))

# =============================================================================
# 2. EL MARCO Y LA NO COBERTURA  ->  P02, P03, P04
#
# Marco: los jugadores con al menos un turno al bate. Deja fuera a los
# lanzadores que nunca batean, sobre todo los de la Liga Americana, donde el
# bateador designado batea por ellos. Es no cobertura con causa documentada.
# =============================================================================
en_marco <- bb$atbat > 0
fuera    <- !en_marco
N_marco  <- sum(en_marco)
mu_marco <- mean(y[en_marco])
mu_fuera <- mean(y[fuera])
no_cob   <- 1 - N_marco / N
sesgo    <- mu_marco - mu

# El sesgo del marco tiene forma cerrada: (N_fuera/N) * (media_marco - media_fuera).
sesgo_identidad <- (sum(fuera) / N) * (mu_marco - mu_fuera)
stopifnot(casi(sesgo, sesgo_identidad))

fuera_lanz <- table(bb$leagueid[fuera], bb$pos[fuera] == "P")
D$marco <- list(
  N = N_marco, fuera = sum(fuera), noCobertura = no_cob,
  media = mu_marco, mediaFuera = mu_fuera, sesgo = sesgo,
  sesgoRelativo = sesgo / mu,
  fueraTodosLanzadores = all(bb$pos[fuera] == "P"),
  fueraAL = sum(fuera & bb$leagueid == "AL"),
  fueraNL = sum(fuera & bb$leagueid == "NL"),
  lanzadoresAL = sum(lanz & bb$leagueid == "AL"),
  lanzadoresNL = sum(lanz & bb$leagueid == "NL")
)

# Los dos histogramas de P04. Se construyen como LISTAS DE VECTORES, no como
# data.frame: jsonlite escribe los data.frame como array de filas y entonces
# `C.centros` es undefined en el navegador y el grafico entero revienta.
cortes  <- seq(0, 23e6, by = 1e6)
centros <- head(cortes, -1) + 5e5
h_pob   <- hist(y,           breaks = cortes, plot = FALSE)$counts
h_mar   <- hist(y[en_marco], breaks = cortes, plot = FALSE)$counts
stopifnot(sum(h_pob) == N, sum(h_mar) == N_marco)
D$histograma <- list(centros = centros, poblacion = h_pob, marco = h_mar,
                     poblacionProp = h_pob / N, marcoProp = h_mar / N_marco)

cat("\n2. MARCO (al menos un turno al bate)  ->  P02, P03, P04\n")
cat(sprintf("   N marco = %d de %d   no cobertura = %.6f\n", N_marco, N, no_cob))
cat(sprintf("   media marco = %.4f   media de los excluidos = %.4f\n", mu_marco, mu_fuera))
cat(sprintf("   sesgo = %+.4f (%.4f %% de la media)   identidad: %+.4f\n",
            sesgo, 100 * sesgo / mu, sesgo_identidad))
cat(sprintf("   los %d excluidos son todos lanzadores: %s   (AL %d, NL %d)\n",
            sum(fuera), all(bb$pos[fuera] == "P"),
            sum(fuera & bb$leagueid == "AL"), sum(fuera & bb$leagueid == "NL")))

# =============================================================================
# 3. EL DISENO PEQUENO p(s)  ->  P07, P08, P09, P10, P11, P12
#
# Cinco jugadores reales de una plantilla y un p(s) dado por ENUMERACION, que es
# exactamente como el modulo 1 del capitulo 2 presenta un diseno muestral. No
# hace falta saber PPT — que es del capitulo 6 y esta fuera del corte — para
# leer una tabla de muestras con su probabilidad.
# =============================================================================
codigos <- c("figgich0", "davanje0", "eckstda0", "anderga0", "erstada0")
idx <- match(codigos, bb$player)
stopifnot(!anyNA(idx), all(bb$team[idx] == "ANA"))
yd <- bb$salary[idx]
t_d <- sum(yd)

muestras <- list(c(1,2), c(1,3), c(1,4), c(2,3), c(2,5), c(3,4), c(4,5))
ps       <- c(0.25, 0.15, 0.10, 0.10, 0.15, 0.10, 0.15)
stopifnot(abs(sum(ps) - 1) < 1e-12, all(lengths(muestras) == 2))

pi_k <- sapply(1:5, function(k) sum(ps[sapply(muestras, function(s) k %in% s)]))
pi_kl <- matrix(0, 5, 5)
for (i in seq_along(muestras)) {
  s <- muestras[[i]]
  pi_kl[s[1], s[2]] <- pi_kl[s[2], s[1]] <- pi_kl[s[1], s[2]] + ps[i]
}
diag(pi_kl) <- pi_k
stopifnot(abs(sum(pi_k) - 2) < 1e-12)          # tamano fijo n = 2  =>  suma pi_k = E(n) = n

# Los dos estimadores sobre cada muestra: HT y la media muestral expandida.
t_ht  <- sapply(muestras, function(s) sum(yd[s] / pi_k[s]))
t_exp <- sapply(muestras, function(s) 5 * mean(yd[s]))
E_ht  <- sum(ps * t_ht)
E_exp <- sum(ps * t_exp)
stopifnot(casi(E_ht, t_d))                     # HT es insesgado por diseno
V_ht_enum <- sum(ps * (t_ht - t_d)^2)          # varianza exacta, por enumeracion

# Segunda via: la formula de Horvitz-Thompson.
delta <- pi_kl - outer(pi_k, pi_k)
diag(delta) <- pi_k * (1 - pi_k)
V_ht_formula <- sum(delta * outer(yd / pi_k, yd / pi_k))
stopifnot(casi(V_ht_enum, V_ht_formula))

D$disenoPequeno <- list(
  codigos = codigos, y = yd, total = t_d,
  muestras = lapply(muestras, function(s) s), ps = ps,
  piK = pi_k, piKl = pi_kl,
  paresConCero = unique(apply(which(pi_kl == 0, arr.ind = TRUE), 1,
                              function(v) paste(sort(v), collapse = "-"))),
  tHT = t_ht, tExp = t_exp,
  esperanzaHT = E_ht, esperanzaExp = E_exp,
  sesgoExp = E_exp - t_d,
  varHT = V_ht_enum, varHTformula = V_ht_formula,
  varExp = sum(ps * (t_exp - t_d)^2),
  # Lo que piden P08 y P10, ya despejado.
  piKl_1_3 = pi_kl[1, 3], sumaPiK = sum(pi_k),
  muestraP10 = c(1, 3), tHT_P10 = sum(yd[c(1,3)] / pi_k[c(1,3)]),
  tExp_P10 = 5 * mean(yd[c(1,3)])
)

cat("\n3. DISENO PEQUENO p(s) sobre 5 jugadores  ->  P07-P12\n")
cat(sprintf("   y = %s   t = %.0f\n", paste(format(yd, big.mark = ""), collapse = ", "), t_d))
cat(sprintf("   pi_k = %s   suma = %.4f\n", paste(sprintf("%.2f", pi_k), collapse = ", "), sum(pi_k)))
cat(sprintf("   pi_13 = %.4f   pares con pi_kl = 0: %d\n", pi_kl[1,3], sum(pi_kl == 0)))
cat(sprintf("   E(t_HT) = %.2f = t   E(t_exp) = %.2f  ->  sesgo %+.2f\n", E_ht, E_exp, E_exp - t_d))
cat(sprintf("   V(t_HT) enumerada = %.6e\n           por formula = %.6e   diferencia relativa = %.2e\n",
            V_ht_enum, V_ht_formula, abs(V_ht_enum - V_ht_formula) / V_ht_enum))
cat(sprintf("   t_HT sobre la muestra {1,3} = %.2f   (expandida: %.2f)\n",
            sum(yd[c(1,3)] / pi_k[c(1,3)]), 5 * mean(yd[c(1,3)])))

# =============================================================================
# 4. EL MAS DE n = 100  ->  P15, P16, P17
# =============================================================================
n <- 100L
sel <- sort(sample.int(N, n))
ms  <- bb[sel, ]
ybar <- mean(ms$salary)
s_m  <- sd(ms$salary)
f    <- n / N
fpc  <- 1 - f
se_fpc    <- sqrt(fpc * s_m^2 / n)
se_sinfpc <- sqrt(s_m^2 / n)

# Segunda via: survey.
ms$Npob <- N
dis <- svydesign(ids = ~1, fpc = ~Npob, data = ms)
se_survey <- as.numeric(SE(svymean(~salary, dis)))
stopifnot(casi(se_survey, se_fpc))

z <- qnorm(0.975)
ic <- ybar + c(-1, 1) * z * se_fpc
d_k <- N / n

D$mas <- list(
  n = n, ybar = ybar, s = s_m, f = f, fpc = fpc,
  seFpc = se_fpc, seSinFpc = se_sinfpc, seSurvey = se_survey,
  inflacion = 100 * (se_sinfpc / se_fpc - 1),
  z = z, icLo = ic[1], icHi = ic[2], semiancho = z * se_fpc,
  cubre = ic[1] <= mu && mu <= ic[2],
  piK = n / N, piKl = n * (n - 1) / (N * (N - 1)), dK = d_k,
  sumaPesos = d_k * n, totalEstimado = d_k * sum(ms$salary), totalVerdadero = t_N
)
stopifnot(casi(D$mas$sumaPesos, N))            # la comprobacion que pide P15

cat("\n4. MAS n = 100  ->  P15, P16, P17\n")
cat(sprintf("   ybar = %.4f   s = %.4f   f = %.4f   fpc = %.4f\n", ybar, s_m, f, fpc))
cat(sprintf("   SE con fpc = %.6f   sin fpc = %.6f   inflacion = %.4f %%\n",
            se_fpc, se_sinfpc, D$mas$inflacion))
cat(sprintf("   SE por survey = %.6f  (coincide)\n", se_survey))
cat(sprintf("   IC 95%%: [%.2f ; %.2f]   cubre %.2f: %s\n", ic[1], ic[2], mu, D$mas$cubre))
cat(sprintf("   d_k = %.2f   suma de pesos = %.2f = N\n", d_k, D$mas$sumaPesos))

# =============================================================================
# 5. LOS TRES NIVELES DE CONFIANZA  ->  P18
#
# Se BUSCA a proposito una muestra en la que el intervalo al 90 % no cubra y el
# del 95 % si. Elegir la muestra para que ilustre no es hacer trampa mientras se
# diga: el item pregunta por el precio de la confianza, y sobre una muestra en
# la que los tres cubren no hay nada que leer. Queda declarado en el JSON.
# =============================================================================
zs <- qnorm(c(0.95, 0.975, 0.995))
buscada <- NULL
for (intento in 1:5000) {
  s2 <- sort(sample.int(N, n))
  yb <- mean(bb$salary[s2]); sm <- sd(bb$salary[s2])
  ee <- sqrt(fpc * sm^2 / n)
  cubre <- sapply(zs, function(zz) abs(yb - mu) <= zz * ee)
  if (!cubre[1] && cubre[2] && cubre[3]) { buscada <- list(i = intento, sel = s2, yb = yb, sm = sm, ee = ee); break }
}
stopifnot(!is.null(buscada))
D$confianza <- list(
  intentos = buscada$i, elegidaAProposito = TRUE,
  n = n, ybar = buscada$yb, s = buscada$sm, se = buscada$ee, mu = mu,
  niveles = c(90, 95, 99), z = zs,
  lo = buscada$yb - zs * buscada$ee, hi = buscada$yb + zs * buscada$ee,
  semiancho = zs * buscada$ee,
  cubre = sapply(zs, function(zz) abs(buscada$yb - mu) <= zz * buscada$ee),
  precio = (zs[3] - zs[1]) * buscada$ee
)

# Cobertura empirica real, que con una poblacion asi de asimetrica no tiene por
# que ser el 95 % nominal. Es la cifra honesta para la retro de P17 y P18.
reps <- 2000L
cob <- replicate(reps, {
  s3 <- sample.int(N, n)
  yb <- mean(bb$salary[s3]); ee <- sqrt(fpc * var(bb$salary[s3]) / n)
  abs(yb - mu) <= z * ee
})
D$confianza$coberturaEmpirica <- mean(cob)
D$confianza$replicas <- reps

cat("\n5. TRES NIVELES DE CONFIANZA  ->  P18\n")
cat(sprintf("   muestra hallada en el intento %d   ybar = %.2f\n", buscada$i, buscada$yb))
cat(sprintf("   cubre 90/95/99: %s\n", paste(D$confianza$cubre, collapse = " / ")))
cat(sprintf("   cobertura empirica del IC 95%% con n = %d: %.4f (%d replicas)\n",
            n, mean(cob), reps))

# =============================================================================
# 6. TAMANO DE MUESTRA, EL PROBLEMA INVERSO  ->  P19
# =============================================================================
n_max <- 60L
margen_alcanzable <- z * sqrt((1 - n_max / N) * S2 / n_max)
margen_sin_fpc    <- z * sqrt(S2 / n_max)
# Ida y vuelta: el n que pide ese margen tiene que devolver n_max.
n0  <- (z * S / margen_alcanzable)^2
n_v <- n0 / (1 + n0 / N)
stopifnot(casi(n_v, n_max))

D$tamano <- list(
  nMax = n_max, S = S, S2 = S2, z = z,
  margen = margen_alcanzable, margenSinFpc = margen_sin_fpc,
  margenRelativo = margen_alcanzable / mu,
  vuelta = n_v,
  # Para la retro: cuanto habria que muestrear para la mitad de margen.
  nParaMitad = ceiling(((z * S / (margen_alcanzable / 2))^2) /
                       (1 + ((z * S / (margen_alcanzable / 2))^2) / N))
)

cat("\n6. TAMANO DE MUESTRA INVERSO  ->  P19\n")
cat(sprintf("   n maximo = %d  ->  margen al 95%% = %.4f  (sin fpc: %.4f)\n",
            n_max, margen_alcanzable, margen_sin_fpc))
cat(sprintf("   vuelta: n(margen) = %.6f = %d   para la mitad de margen harian falta %d\n",
            n_v, n_max, D$tamano$nParaMitad))

# =============================================================================
# 7. DISENO BERNOULLI  ->  P20, P21
# =============================================================================
pi_bern <- 0.125
E_n  <- N * pi_bern
V_n  <- N * pi_bern * (1 - pi_bern)
tam  <- replicate(reps, sum(runif(N) < pi_bern))
stopifnot(abs(mean(tam) - E_n) < 4 * sqrt(V_n / reps))       # empirica ~ teorica
cortes_n <- seq(floor(min(tam)) - 0.5, ceiling(max(tam)) + 0.5, by = 4)
h_n <- hist(tam, breaks = cortes_n, plot = FALSE)

D$bernoulli <- list(
  pi = pi_bern, En = E_n, Vn = V_n, sdN = sqrt(V_n),
  replicas = reps, mediaEmpirica = mean(tam), sdEmpirica = sd(tam),
  minimo = min(tam), maximo = max(tam),
  centros = h_n$mids, conteo = h_n$counts,
  # MAS con reemplazo frente a sin reemplazo, con el mismo n: la fpc es la razon.
  varConReemplazo = S2 / n, varSinReemplazo = fpc * S2 / n,
  razon = (S2 / n) / (fpc * S2 / n)
)

cat("\n7. BERNOULLI  ->  P20, P21\n")
cat(sprintf("   pi = %.4f   E(n) = %.2f   V(n) = %.2f   sd = %.4f\n", pi_bern, E_n, V_n, sqrt(V_n)))
cat(sprintf("   empirico sobre %d replicas: media %.2f   sd %.4f   rango [%d ; %d]\n",
            reps, mean(tam), sd(tam), min(tam), max(tam)))
cat(sprintf("   var con reemplazo / sin reemplazo = %.6f\n", D$bernoulli$razon))

# =============================================================================
# 8. SISTEMATICO: EL ORDEN DEL MARCO  ->  P22
#
# ATENCION - AQUI HUBO UN ERROR MIO Y ESTA CORREGIDO (auditoria del 2026-08-30).
#
# La primera version de esta seccion calculaba la razon V_real/V_MAS para k = 26
# sobre el orden del fichero, obtenia 0,605 y CONCLUIA que el sistematico sale
# mejor "porque el marco va ordenado por equipo y eso estratifica
# implicitamente". Las dos cosas son falsas:
#
#   - dentro de cada equipo el marco esta ordenado ALFABETICAMENTE por codigo de
#     jugador, no por posicion ni por nada relacionado con el salario;
#   - la varianza ENTRE equipos es solo el 10,8 % del total, asi que ninguna
#     estratificacion por equipo puede bajar la razon de ~0,89; y
#   - los saltos vecinos dan lo contrario (k=25: 1,069; k=27: 1,095), que es
#     justo lo que NO haria un efecto estructural.
#
# El 0,605 era el extremo bajo de una banda de ruido. La leccion correcta -y la
# que P22 pregunta ahora- es que UN SOLO k NO ES EVIDENCIA: lo que distingue un
# efecto real del ruido es que el efecto no depende de k. Por eso aqui ya no se
# calcula un salto: se calcula la CURVA sobre 21 saltos y bajo dos ordenes del
# mismo marco.
# =============================================================================
SALTOS <- 20:40

razon_sistematico <- function(k, orden) {
  yy <- y[orden]
  medias <- sapply(1:k, function(a) mean(yy[seq(a, N, by = k)]))
  tams   <- sapply(1:k, function(a) length(seq(a, N, by = k)))
  n_medio <- mean(tams)
  V_real <- mean((medias - mu)^2)          # las k muestras son equiprobables
  V_mas  <- (1 - n_medio / N) * S2 / n_medio
  list(Vreal = V_real, Vmas = V_mas, razon = V_real / V_mas,
       nMin = min(tams), nMax = max(tams), medias = medias)
}

orden_fichero <- seq_len(N)      # como llega: por equipo, alfabetico dentro
orden_salario <- order(y)        # ordenado por LO QUE SE MIDE

curva <- function(orden) sapply(SALTOS, function(k) razon_sistematico(k, orden)$razon)
r_fichero <- curva(orden_fichero)
r_salario <- curva(orden_salario)

# El detalle de k = 26, que es el que la retroalimentacion usa para desmontar
# la lectura ingenua: es el minimo de la banda de ruido, no un efecto.
det26 <- razon_sistematico(26L, orden_fichero)
det26s <- razon_sistematico(26L, orden_salario)

# Cuanta varianza hay ENTRE equipos: el techo de lo que una estratificacion por
# equipo podria conseguir. Es la cifra que refuta la explicacion vieja.
ss_entre <- sum(sapply(split(y, bb$team), function(g) length(g) * (mean(g) - mu)^2))
prop_entre <- ss_entre / sum((y - mu)^2)

D$sistematico <- list(
  Nprimo = TRUE, saltos = SALTOS,
  razonFichero = r_fichero, razonSalario = r_salario,
  medianaFichero = median(r_fichero), medianaSalario = median(r_salario),
  minFichero = min(r_fichero), maxFichero = max(r_fichero),
  minSalario = min(r_salario), maxSalario = max(r_salario),
  cruzaUnoFichero = sum(r_fichero > 1), cruzaUnoSalario = sum(r_salario > 1),
  k26 = list(k = 26L, razon = det26$razon, Vreal = det26$Vreal, Vmas = det26$Vmas,
             nMin = det26$nMin, nMax = det26$nMax, razonSalario = det26s$razon),
  k25 = razon_sistematico(25L, orden_fichero)$razon,
  k27 = razon_sistematico(27L, orden_fichero)$razon,
  varianzaEntreEquipos = prop_entre,
  techoEstratificacion = 1 - prop_entre
)

# Guardas: si el contraste entre los dos ordenes se deshace, el item no se
# sostiene y es mejor que el guion pare a que publique una curva sin mensaje.
stopifnot(max(r_salario) < 0.25)                    # el orden por salario, plano y lejos de 1
stopifnot(sum(r_fichero > 1) >= 7, sum(r_fichero < 1) >= 7)   # el del fichero, cruzando 1
stopifnot(min(r_fichero) < det26$razon + 1e-12)     # k=26 es el minimo de la banda

cat("\n8. SISTEMATICO: EL ORDEN DEL MARCO  ->  P22\n")
cat(sprintf("   orden del fichero: mediana %.3f  rango [%.3f ; %.3f]  cruza 1 en %d de %d saltos\n",
            median(r_fichero), min(r_fichero), max(r_fichero), sum(r_fichero > 1), length(SALTOS)))
cat(sprintf("   orden por salario: mediana %.3f  rango [%.3f ; %.3f]  cruza 1 en %d de %d saltos\n",
            median(r_salario), min(r_salario), max(r_salario), sum(r_salario > 1), length(SALTOS)))
cat(sprintf("   k=26 sobre el fichero: %.4f  (vecinos: k=25 -> %.3f, k=27 -> %.3f)\n",
            det26$razon, D$sistematico$k25, D$sistematico$k27))
cat(sprintf("   varianza entre equipos = %.1f %% del total  ->  una estratificacion por equipo\n",
            100 * prop_entre))
cat(sprintf("   perfecta no bajaria de %.3f, asi que NO explica el 0,605\n", 1 - prop_entre))

# =============================================================================
# 9. CIFRAS QUE CITAN LAS RETROALIMENTACIONES
#
# Los errores tipicos que el texto nombra ("si te salio X, hiciste Y") tambien
# se calculan: una retro que cita una cifra a mano es una cifra a mano.
# =============================================================================
D$citadas <- list(
  # P03: confundir cobertura con no cobertura, y dividir al reves.
  coberturaComplemento = N_marco / N,
  noCoberturaSobreMarco = sum(fuera) / N_marco,
  # P15: el peso mal puesto que el item planta.
  pesoMalo = N / (n - 1), sumaPesosMala = (N / (n - 1)) * n,
  # P17 y P19: olvidar la fpc, y usar z = 2 en vez de 1,96.
  semianchoSinFpc = z * se_sinfpc, semianchoConZ2 = 2 * se_fpc,
  margenConZ2 = 2 * sqrt((1 - n_max / N) * S2 / n_max),
  # P10: repartir por 1/pi_k equivocado (usar la media de los pi).
  tHTconPiMedio = sum(yd[c(1,3)]) / mean(pi_k),
  # P22: el rango de medias de las 26 muestras del orden del fichero, para que
  # la retro pueda decir cuanto se mueve una media sistematica sin que eso
  # signifique que el orden ayude.
  rangoMediasK26 = range(det26$medias)
)

cat("\n9. CIFRAS CITADAS EN LAS RETROS\n")
cat(sprintf("   peso malo N/(n-1) = %.4f  ->  suma de pesos %.2f (deberia dar %d)\n",
            D$citadas$pesoMalo, D$citadas$sumaPesosMala, N))
cat(sprintf("   semiancho sin fpc = %.4f  frente a %.4f con fpc\n",
            D$citadas$semianchoSinFpc, D$mas$semiancho))

# =============================================================================
# 10. SALIDA
# =============================================================================
cat("\n")
escribe_json(D, "preparcial_datos")
cat(sprintf("[genera_preparcial.R] listo. semilla = %d\n", SEMILLA_PREPARCIAL))
