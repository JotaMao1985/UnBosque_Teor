# genera_preparcial.R — cifras de los 29 items nuevos del Preparcial del Corte I
#
# Ejecutar SIEMPRE con el R del framework 4.4, desde la raiz del repositorio:
#   /Library/Frameworks/R.framework/Versions/4.4-arm64/Resources/bin/Rscript precalculo/genera_preparcial.R
#
# Produce  precalculo/salidas/preparcial_datos.json,  que alimenta el banco de
# los 29 items nuevos. Ninguna cifra se escribe a mano: toda respuesta numerica,
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
# 9. LOS SIETE ITEMS ANADIDOS EL 2026-09-02  ->  P23, P24, P25, P26, P27, P28, P29
#
# Al mover Javier tres puntos de peso de O5 a O3 (seccion A7 del plan), la
# proporcion pidio 29 items nuevos en vez de 22. Los siete que entran necesitan
# cifras propias, y van AQUI, al final, por una razon que no es de orden: un
# `sample()` insertado mas arriba correria el flujo del generador y cambiaria
# TODAS las cifras de los 22 primeros, que ya estan escritas en el banco. Cada
# bloque aleatorio de esta seccion declara ademas su propia semilla derivada.
# =============================================================================

# --- 9.1  P23: cuatro archivos de la misma poblacion -------------------------
# El item pregunta con cual se MIDE el sesgo del marco y con cuales solo se
# estima. El cuarto archivo es un MAS tomado DEL MARCO, no de la poblacion: su
# media no estima mu, estima mu_marco, y desde dentro del archivo nada lo dice.
set.seed(SEMILLA_PREPARCIAL + 1L)
sel_marco <- sort(sample(which(en_marco), n))
ybar_marco <- mean(y[sel_marco])
se_marco   <- sqrt((1 - n / N_marco) * var(y[sel_marco]) / n)

D$masMarco <- list(
  n = n, N = N_marco, ybar = ybar_marco, se = se_marco,
  muMarco = mu_marco, mu = mu, sesgoDelMarco = sesgo,
  # Lo que el archivo alcanza a ver y lo que no.
  distanciaAlMarco = ybar_marco - mu_marco,
  distanciaAlObjetivo = ybar_marco - mu,
  # El MAS de la seccion 4 SI se tomo de la poblacion entera: ese estima mu.
  ybarPoblacion = ybar
)

cat("\n9.1 CUATRO ARCHIVOS  ->  P23\n")
cat(sprintf("   MAS del marco: ybar = %.2f   estima mu_marco = %.2f (dista %.2f)\n",
            ybar_marco, mu_marco, ybar_marco - mu_marco))
cat(sprintf("   y del objetivo mu = %.2f dista %.2f, que nadie ve desde el archivo\n",
            mu, ybar_marco - mu))

# --- 9.2  P24: otro p(s) con los MISMOS pi_k ---------------------------------
# Los mismos cinco jugadores y las mismas probabilidades de inclusion de primer
# orden, sobre otro soporte. El estimador HT es el mismo -depende solo de los
# pi_k- y su esperanza tambien; lo que cambia es la VARIANZA, que depende de
# los pi_kl. Es la razon de que el marco pi necesite dos ordenes y no uno.
muestras2 <- list(c(1,2), c(1,5), c(2,3), c(2,4), c(3,4))
ps2       <- c(0.20, 0.30, 0.15, 0.15, 0.20)
stopifnot(abs(sum(ps2) - 1) < 1e-12, all(lengths(muestras2) == 2))

pi_k2 <- sapply(1:5, function(k) sum(ps2[sapply(muestras2, function(s) k %in% s)]))
stopifnot(casi(pi_k2, pi_k))                   # mismos pi_k: es toda la gracia

pi_kl2 <- matrix(0, 5, 5)
for (i in seq_along(muestras2)) {
  s <- muestras2[[i]]
  pi_kl2[s[1], s[2]] <- pi_kl2[s[2], s[1]] <- pi_kl2[s[1], s[2]] + ps2[i]
}
diag(pi_kl2) <- pi_k2

t_ht2 <- sapply(muestras2, function(s) sum(yd[s] / pi_k2[s]))
E_ht2 <- sum(ps2 * t_ht2)
stopifnot(casi(E_ht2, t_d))                    # sigue siendo insesgado
V_ht2_enum <- sum(ps2 * (t_ht2 - t_d)^2)

delta2 <- pi_kl2 - outer(pi_k2, pi_k2)         # segunda via, como en la seccion 3
diag(delta2) <- pi_k2 * (1 - pi_k2)
V_ht2_formula <- sum(delta2 * outer(yd / pi_k2, yd / pi_k2))
stopifnot(casi(V_ht2_enum, V_ht2_formula))

D$disenoAlterno <- list(
  muestras = muestras2, ps = ps2, piK = pi_k2, piKl = pi_kl2,
  soporte = length(ps2), soporteOriginal = length(ps),
  tHT = t_ht2, esperanza = E_ht2,
  varHT = V_ht2_enum, varHTformula = V_ht2_formula,
  varOriginal = V_ht_enum, razon = V_ht2_enum / V_ht_enum,
  sd = sqrt(V_ht2_enum), sdOriginal = sqrt(V_ht_enum),
  paresConCero = unique(apply(which(pi_kl2 == 0, arr.ind = TRUE), 1,
                              function(v) paste(sort(v), collapse = "-")))
)

cat("\n9.2 OTRO p(s) CON LOS MISMOS pi_k  ->  P24\n")
cat(sprintf("   pi_k identicos: %s\n", paste(sprintf("%.2f", pi_k2), collapse = ", ")))
cat(sprintf("   E(t_HT) = %.0f = t   V = %.6e frente a %.6e   razon = %.4f\n",
            E_ht2, V_ht2_enum, V_ht_enum, V_ht2_enum / V_ht_enum))
cat(sprintf("   sd: %.0f frente a %.0f\n", sqrt(V_ht2_enum), sqrt(V_ht_enum)))

# --- 9.3  P25: la suma de los pi_k cuando n es ALEATORIO ---------------------
D$bernoulli$sumaPiK <- N * pi_bern              # = E(n), no n
D$bernoulli$N <- N

# --- 9.4  P26: el peso grande --------------------------------------------- --
# La unidad con el pi_k mas bajo es, ademas, la mejor pagada: su peso 1/pi_k la
# multiplica por mas que a nadie. HT sigue insesgado y aun asi las muestras que
# la incluyen y las que no dan estimaciones que no se parecen.
k_min <- which.min(pi_k)
con   <- sapply(muestras, function(s) k_min %in% s)

D$pesoGrande <- list(
  unidad = k_min, codigo = codigos[k_min], y = yd[k_min],
  pi = pi_k[k_min], peso = 1 / pi_k[k_min], contribucion = yd[k_min] / pi_k[k_min],
  pesoTipico = 1 / pi_k[1], total = t_d,
  probIncluida = sum(ps[con]),
  mediaCon = sum(ps[con] * t_ht[con]) / sum(ps[con]),
  mediaSin = sum(ps[!con] * t_ht[!con]) / sum(ps[!con]),
  minTHT = min(t_ht), maxTHT = max(t_ht),
  cv = sqrt(V_ht_enum) / t_d
)
stopifnot(casi(sum(ps[con]), pi_k[k_min]))      # la probabilidad de incluirla ES su pi_k

cat("\n9.4 EL PESO GRANDE  ->  P26\n")
cat(sprintf("   unidad %d (%s): y = %.0f   pi = %.2f   peso = %.4f   aporta %.0f de %.0f\n",
            k_min, codigos[k_min], yd[k_min], pi_k[k_min], 1 / pi_k[k_min],
            yd[k_min] / pi_k[k_min], t_d))
cat(sprintf("   E(t_HT | la incluye) = %.0f   E(t_HT | no la incluye) = %.0f\n",
            D$pesoGrande$mediaCon, D$pesoGrande$mediaSin))
cat(sprintf("   rango de t_HT: [%.0f ; %.0f]   cv = %.4f\n", min(t_ht), max(t_ht), D$pesoGrande$cv))

# --- 9.5  P27: estimar una PROPORCION con el MAS de n = 100 ------------------
# El valor verdadero se conoce (es poblacion completa), asi que se puede decir
# si el intervalo cubre en vez de suponerlo.
p_hat  <- mean(ms$pos == "P")
P_pob  <- mean(lanz)
se_p   <- sqrt(fpc * p_hat * (1 - p_hat) / (n - 1))
se_p_mal <- sqrt(p_hat * (1 - p_hat) / n)       # sin fpc y con n: el error tipico
# svymean sobre un logico devuelve los DOS niveles (FALSE y TRUE) con el mismo
# error estandar; sin el [1] el JSON guarda un vector de dos y la cifra que
# cita el item deja de ser un numero.
se_p_survey <- as.numeric(SE(svymean(~I(pos == "P"), dis)))[1]
stopifnot(casi(se_p, se_p_survey))              # doble via, como toda varianza aqui
ic_p <- p_hat + c(-1, 1) * z * se_p

D$proporcion <- list(
  n = n, lanzadores = sum(ms$pos == "P"), pHat = p_hat, P = P_pob,
  se = se_p, seSurvey = se_p_survey, seSinFpcConN = se_p_mal,
  z = z, icLo = ic_p[1], icHi = ic_p[2], semiancho = z * se_p,
  cubre = ic_p[1] <= P_pob && P_pob <= ic_p[2],
  holgura = ic_p[2] - P_pob, error = p_hat - P_pob
)

cat("\n9.5 PROPORCION DE LANZADORES  ->  P27\n")
cat(sprintf("   p_hat = %.4f (%d de %d)   P = %.6f\n", p_hat, sum(ms$pos == "P"), n, P_pob))
cat(sprintf("   se = %.6f (survey: %.6f)   sin fpc y con n: %.6f\n", se_p, se_p_survey, se_p_mal))
cat(sprintf("   IC 95%% = [%.4f ; %.4f]   cubre: %s   por %.4f\n",
            ic_p[1], ic_p[2], D$proporcion$cubre, ic_p[2] - P_pob))

# --- 9.6  P28: la distribucion de la media muestral con tres tamanos ---------
# La cobertura nominal es 95 % en los tres. La REAL no, y la razon es la
# asimetria de esta poblacion: el normal aproximado tarda en llegar.
set.seed(SEMILLA_PREPARCIAL + 2L)
reps_d <- 4000L
ns_d   <- c(25L, 100L, 400L)
cortes_d  <- seq(0.4e6, 5.6e6, by = 1e5)
centros_d <- head(cortes_d, -1) + 5e4

simula <- function(nn) {
  medias <- numeric(reps_d); cub <- logical(reps_d)
  for (r in seq_len(reps_d)) {
    s  <- sample.int(N, nn)
    yb <- mean(y[s]); ee <- sqrt((1 - nn / N) * var(y[s]) / nn)
    medias[r] <- yb; cub[r] <- abs(yb - mu) <= z * ee
  }
  dentro <- medias >= min(cortes_d) & medias <= max(cortes_d)
  list(n = nn, media = mean(medias), sd = sd(medias),
       sdTeorica = sqrt((1 - nn / N) * S2 / nn),
       cobertura = mean(cub), fueraDelEje = sum(!dentro),
       asimetria = mean(((medias - mean(medias)) / sd(medias))^3),
       prop = hist(pmin(pmax(medias, min(cortes_d)), max(cortes_d)),
                   breaks = cortes_d, plot = FALSE)$counts / reps_d)
}
sim <- lapply(ns_d, simula)
for (s in sim) stopifnot(abs(s$sd / s$sdTeorica - 1) < 0.06)   # empirica ~ teorica

D$distribucionMedia <- list(
  replicas = reps_d, mu = mu, centros = centros_d, tamanos = ns_d,
  prop = lapply(sim, function(s) s$prop),
  cobertura = sapply(sim, function(s) s$cobertura),
  sd = sapply(sim, function(s) s$sd),
  sdTeorica = sapply(sim, function(s) s$sdTeorica),
  asimetria = sapply(sim, function(s) s$asimetria),
  nominal = 95
)

cat("\n9.6 DISTRIBUCION DE LA MEDIA  ->  P28\n")
for (s in sim)
  cat(sprintf("   n = %3d   sd emp = %.0f (teorica %.0f)   cobertura real = %.4f   asimetria = %+.3f\n",
              s$n, s$sd, s$sdTeorica, s$cobertura, s$asimetria))

# --- 9.7  P29: la varianza REAL de un sistematico, recorriendo sus k muestras -
# Un marco pequeno y real: la plantilla mas corta de la liga. Con k = 6 hay
# exactamente 6 muestras posibles, equiprobables, y la varianza del diseno es la
# media de sus desviaciones al cuadrado. NO es var() de las seis medias: el
# denominador es k, no k - 1, porque no se esta estimando nada desde una muestra
# -se esta recorriendo la poblacion de muestras entera-.
EQUIPO <- names(sort(table(bb$team)))[1]
yl <- bb$salary[bb$team == EQUIPO]
Nl <- length(yl); k_sis <- 6L; nl <- Nl / k_sis
stopifnot(Nl %% k_sis == 0)
mu_l    <- mean(yl)
medias_l <- sapply(1:k_sis, function(a) mean(yl[seq(a, Nl, by = k_sis)]))
stopifnot(casi(mean(medias_l), mu_l))          # tamanos iguales: la media de medias es mu

V_real_l <- mean((medias_l - mu_l)^2)
V_conK1  <- var(medias_l)                      # el error que el item planta
V_mas_l  <- (1 - nl / Nl) * var(yl) / nl
stopifnot(casi(V_conK1 * (k_sis - 1) / k_sis, V_real_l))

D$sistematicoPequeno <- list(
  equipo = EQUIPO, N = Nl, k = k_sis, n = nl, mu = mu_l,
  y = yl, medias = medias_l,
  # En millones, que es como el item los presenta: una varianza de 1e12 no se
  # teclea en una calculadora sin que el estudiante pierda el hilo.
  muMillones = mu_l / 1e6, mediasMillones = medias_l / 1e6,
  varReal = V_real_l, varRealMillones = V_real_l / 1e12,
  varConK1Millones = V_conK1 / 1e12,
  varMas = V_mas_l, varMasMillones = V_mas_l / 1e12,
  razon = V_real_l / V_mas_l,
  # pi_kl = 0 entre unidades de muestras distintas: por eso no hay estimador
  # insesgado de la varianza desde una sola muestra sistematica.
  paresPosibles = choose(Nl, 2), paresConPiCero = choose(Nl, 2) - k_sis * choose(nl, 2)
)

cat("\n9.7 SISTEMATICO PEQUENO  ->  P29\n")
cat(sprintf("   %s: N = %d, k = %d, n = %d   mu = %.4f millones\n", EQUIPO, Nl, k_sis, nl, mu_l / 1e6))
cat(sprintf("   medias = %s\n", paste(sprintf("%.4f", medias_l / 1e6), collapse = ", ")))
cat(sprintf("   V_real = %.6f   con denominador k-1 seria %.6f   V_MAS = %.6f   razon = %.4f\n",
            V_real_l / 1e12, V_conK1 / 1e12, V_mas_l / 1e12, V_real_l / V_mas_l))
cat(sprintf("   pares con pi_kl = 0: %d de %d\n", D$sistematicoPequeno$paresConPiCero,
            D$sistematicoPequeno$paresPosibles))

# =============================================================================
# 10. CIFRAS QUE CITAN LAS RETROALIMENTACIONES
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
  # P08: el producto pi_1 x pi_3, que es lo que responde quien supone que las
  # inclusiones son independientes.
  piProducto_1_3 = pi_k[1] * pi_k[3],
  # P10: los dos sumandos de la cuenta y las dos trampas -sumar sin expandir, y
  # repartir por la probabilidad media en vez de por la de cada unidad-.
  aporteP10_1 = yd[1] / pi_k[1],
  aporteP10_3 = yd[3] / pi_k[3],
  sumaObservadaP10 = sum(yd[c(1, 3)]),
  piMedio = mean(pi_k),
  # P27: el limite superior que sale con el error estandar sin fpc y con n.
  icHiProporcionMal = p_hat + z * se_p_mal,
  # P16: cuanto se separan en dolares los dos semianchos, con fpc y sin ella.
  diferenciaSemianchos = z * (se_sinfpc - se_fpc),
  # P23: la resta de las dos medias MUESTRALES, que estima el sesgo del marco
  # pero no lo mide -y el item existe para separar las dos cosas-.
  diferenciaMediasMuestrales = ybar_marco - ybar,
  # P22: el rango de medias de las 26 muestras del orden del fichero, para que
  # la retro pueda decir cuanto se mueve una media sistematica sin que eso
  # signifique que el orden ayude.
  rangoMediasK26 = range(det26$medias)
)

D$pct <- list(
  noCobertura          = 100 * no_cob,
  sesgoRelativo        = 100 * sesgo / mu,
  fraccionMuestral     = 100 * f,
  inflacionSinFpc      = D$mas$inflacion,
  margenRelativo       = 100 * margen_alcanzable / mu,
  coberturaEmpirica    = 100 * D$confianza$coberturaEmpirica,
  coberturaMedia       = 100 * D$distribucionMedia$cobertura,
  propLanzadores       = 100 * mean(lanz),
  pHat                 = 100 * p_hat,
  varianzaEntreEquipos = 100 * prop_entre,
  reduccionAlterno     = 100 * (1 - V_ht2_enum / V_ht_enum),
  extraSistematico     = 100 * (D$sistematicoPequeno$razon - 1),
  masConReemplazo      = 100 * (D$bernoulli$razon - 1),
  cvHT                 = 100 * D$pesoGrande$cv
)

cat("\n10. CIFRAS CITADAS EN LAS RETROS\n")
cat(sprintf("   peso malo N/(n-1) = %.4f  ->  suma de pesos %.2f (deberia dar %d)\n",
            D$citadas$pesoMalo, D$citadas$sumaPesosMala, N))
cat(sprintf("   semiancho sin fpc = %.4f  frente a %.4f con fpc\n",
            D$citadas$semianchoSinFpc, D$mas$semiancho))

# =============================================================================
# 10b. LOS DISTRACTORES DE LAS NUMERICAS QUE VIAJAN A BRIGHTSPACE
#
# La Biblioteca de Preguntas de D2L no importa respuesta numerica: alli una
# `numerica` solo puede viajar convertida en opcion multiple, y para eso hacen
# falta resultados EQUIVOCADOS. Se calculan AQUI, como cualquier otra cifra del
# material (D8), y no en el exportador: un distractor tecleado a mano es una
# cifra a mano, y ademas es la que el estudiante compara con la suya.
#
# Cada distractor es el resultado de UN error concreto y nombrado. No se ponen
# cifras plausibles al azar: si elegir la opcion no identifica un error, el
# distractor no ensena nada y solo reparte suerte.
#
# `correcto` no es decorativo. El exportador comprueba que coincide con la
# respuesta del item del banco y aborta si no: es lo que impide que un bloque
# de distractores se pegue al item equivocado, que es un fallo que no da
# ningun sintoma -tres cifras plausibles con explicaciones de otra pregunta-.
# =============================================================================
D$distractores <- list(

  # P08 - la probabilidad conjunta pi_kl del par {1,3} en el diseno I.
  piKlPar13 = list(
    correcto = pi_kl[1, 3],
    opciones = list(
      list(valor = pi_k[1] * pi_k[3],
           error = "multiplicar $\\pi_1 \\times \\pi_3$, que valdria si las dos inclusiones fueran independientes; en un diseno de tamano fijo que entre uno le quita sitio al otro"),
      list(valor = pi_k[1] + pi_k[3] - pi_kl[1, 3],
           error = "sumar las dos inclusiones y restar la conjunta, que da la probabilidad de que entre <em>alguno</em> de los dos y no la de que entren <em>ambos</em>"),
      list(valor = pi_k[3],
           error = "dar $\\pi_3$, la probabilidad de inclusion de una sola unidad, en vez de la conjunta del par")
    )
  ),

  # P17 - el limite superior del IC al 95 % para el salario medio.
  icSuperiorSalario = list(
    correcto = ybar + z * se_fpc,
    opciones = list(
      list(valor = ybar + 2 * se_fpc,
           error = "usar $z = 2$ en vez de 1,96"),
      list(valor = ybar + z * se_sinfpc,
           error = "olvidar el factor de poblacion finita al calcular el error estandar"),
      list(valor = ybar - z * se_fpc,
           error = "dar el limite <em>inferior</em> del mismo intervalo")
    )
  ),

  # P25 - la suma de los pi_k en un diseno Bernoulli, donde n es aleatorio.
  sumaPiKBernoulli = list(
    correcto = N * pi_bern,
    opciones = list(
      list(valor = round(N * pi_bern),
           error = "redondear al entero suponiendo que el diseno tiene tamano fijo; en Bernoulli el tamano es una variable aleatoria y su esperanza no tiene por que ser entera"),
      list(valor = N * (1 - pi_bern),
           error = "usar $1 - \\pi$ en vez de $\\pi$, que cuenta las unidades que se espera dejar FUERA de la muestra")
    )
  ),

  # P27 - el limite superior del IC al 95 % para la proporcion de lanzadores.
  icSuperiorProporcion = list(
    correcto = p_hat + z * se_p,
    opciones = list(
      list(valor = p_hat + z * se_p_mal,
           error = "calcular el error estandar como $\\hat p(1-\\hat p)/n$, sin fpc y con $n$ en vez de $n-1$"),
      list(valor = p_hat,
           error = "dar $\\hat p$ a secas, sin sumarle el margen: eso es la estimacion puntual, no el limite del intervalo"),
      list(valor = p_hat - z * se_p,
           error = "dar el limite <em>inferior</em> del mismo intervalo")
    )
  ),

  # P29 - la varianza real de un sistematico recorriendo sus k muestras.
  # En millones al cuadrado, que es como el item presenta la cifra.
  varSistematicoPequeno = list(
    correcto = V_real_l / 1e12,
    opciones = list(
      list(valor = V_conK1 / 1e12,
           error = "dividir entre $k - 1$, que es lo que devuelve la funcion de varianza de cualquier programa; aqui las $k$ medias no son una muestra sino <em>todas</em> las muestras posibles, asi que el denominador es $k$"),
      list(valor = V_mas_l / 1e12,
           error = "aplicar la formula del MAS con el mismo tamano, que es justo lo que este item existe para desaconsejar"),
      list(valor = sqrt(V_real_l) / 1e6,
           error = "dar la desviacion tipica en vez de la varianza")
    )
  )
)

# Ningun distractor puede caer sobre la respuesta: serian dos opciones
# correctas en el banco, y el estudiante que acierta veria «incorrecto».
for (nm in names(D$distractores)) {
  b <- D$distractores[[nm]]
  vs <- sapply(b$opciones, function(o) o$valor)
  stopifnot(all(abs(vs - b$correcto) > 1e-9))
  stopifnot(!any(duplicated(round(vs, 9))))
  stopifnot(all(nzchar(sapply(b$opciones, function(o) o$error))))
}

cat("\n10b. DISTRACTORES DE LAS NUMERICAS\n")
for (nm in names(D$distractores)) {
  b <- D$distractores[[nm]]
  cat(sprintf("   %-22s correcto %-16s  distractores: %s\n", nm,
              format(b$correcto, digits = 8),
              paste(sapply(b$opciones, function(o) format(o$valor, digits = 8)),
                    collapse = ", ")))
}

# =============================================================================
# 11. SALIDA
# =============================================================================
cat("\n")
escribe_json(D, "preparcial_datos")
cat(sprintf("[genera_preparcial.R] listo. semilla = %d\n", SEMILLA_PREPARCIAL))
