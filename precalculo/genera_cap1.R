# genera_cap1.R — datos del capítulo 1 (encuestas por muestreo, sesgos y error total)
#
# Ejecutar SIEMPRE con el R del framework 4.4:
#   /Library/Frameworks/R.framework/Versions/4.4-arm64/Resources/bin/Rscript precalculo/genera_cap1.R
#
# Produce precalculo/salidas/cap1_datos.json, que se incrusta en el capítulo.
# Ninguna cifra del material se escribe a mano: sale de aquí.
#
# PROCEDENCIA DE LAS CIFRAS DOCUMENTALES (las que no se calculan de un CSV):
#
#   Literary Digest 1936 — Lohr, Sampling: Design and Analysis, 3.ª ed., ejemplo 1.1:
#     diez millones de cuestionarios enviados, más de 2,3 millones devueltos
#     ("fewer than one-quarter of those solicited"); predicción del 31 de octubre
#     de 1936: Landon 54 %, Roosevelt 41 %; elección: Roosevelt 61 %, Landon 37 %.
#     El recuento del propio sondeo (Literary Digest 122, 31-X-1936, pp. 5-6, citado
#     en la bibliografía de Lohr) fue "Landon, 1,293,669: Roosevelt, 972,897".
#     El caso de Allentown (marco completo, un tercio devuelto, resultado igualmente
#     erróneo) es de Literary Digest 122, 14-XI-1936, citado en el mismo ejemplo.
#
#   Hite 1987 — Lohr, Sampling: Design and Analysis, 1.ª ed., capítulo 1:
#     100 000 cuestionarios enviados, 4,5 % devueltos; los cuatro porcentajes con
#     las páginas del libro de Hite (804, 856, 810, 809).
#
#   Encuestas intell — Heck, Simons y Chabris (2018), PLOS ONE 13(7), vía Lohr 3.ª ed.,
#     ejercicio 15.13 y la documentación del paquete SDAResources:
#     Encuesta 1 (telefónica, RDD de línea fija, junio de 2009): 79 014 números
#     marcados, 1 838 entrevistas completas; no se llamó a ningún móvil, y en 2009
#     el 24,5 % de los hogares de EE. UU. solo tenía móvil y otro 2 % no tenía
#     teléfono (Blumberg y Luke, 2010). Encuesta 2 (Mechanical Turk, julio-agosto de
#     2011): 983 respondientes reclutados con un pago de 0,25 dólares.
#     Ítem: acuerdo con "I am more intelligent than the average person",
#     1 = Strongly Agree, 2 = Mostly Agree, 3 = Mostly Disagree,
#     4 = Strongly Disagree, 5 = Don't Know or Not Sure.

source("precalculo/_comun.R")

stopifnot(requireNamespace("jsonlite", quietly = TRUE))

cat("\n=== Capítulo 1 · precálculo ===\n")

# ===========================================================================
# 1 · Literary Digest 1936: descomposición del sesgo en cobertura + no respuesta
# ===========================================================================
#
# Modelo de dos componentes. La población de votantes se parte en los que
# estaban en el marco (listas de teléfono, registros de automóvil, directorios)
# y los que no. Dentro del marco, la probabilidad de devolver la papeleta puede
# depender del candidato al que se apoya.
#
#   p        apoyo real a Roosevelt en la población
#   C        fracción de votantes cubierta por el marco
#   p_C      apoyo a Roosevelt dentro del marco
#   p_F      apoyo a Roosevelt fuera del marco
#   rho      razón entre la tasa de respuesta de los partidarios de Roosevelt
#            y la de los de Landon
#
# La estimación del sondeo es la proporción de Roosevelt ENTRE LOS QUE
# CONTESTARON, y las unidades fuera del marco no contestan nunca:
#
#   p_hat = p_C rho / [p_C rho + (1 - p_C)]
#
# El sesgo total se parte limpiamente en dos:
#   sesgo de no cobertura  = p_C - p        (aunque contestaran todos)
#   sesgo de no respuesta  = p_hat - p_C    (aunque el marco fuera perfecto)

digest_landon_sondeo    <- 1293669
digest_roosevelt_sondeo <-  972897
digest_devueltas_dos    <- digest_landon_sondeo + digest_roosevelt_sondeo

# Base de dos candidatos: es la que permite un modelo binario. Se declara en el
# capítulo, porque los porcentajes que cita Lohr (54 / 41 y 61 / 37) están sobre
# el total de papeletas y de votos, que incluye a los demás candidatos.
p_sondeo_dos   <- digest_roosevelt_sondeo / digest_devueltas_dos
p_eleccion_dos <- 61 / (61 + 37)
sesgo_digest   <- p_sondeo_dos - p_eleccion_dos

cat(sprintf("Digest: sondeo %.5f, elección %.5f, sesgo %.5f\n",
            p_sondeo_dos, p_eleccion_dos, sesgo_digest))

# --- la función del modelo, y su descomposición --------------------------
digest_phat <- function(p_C, rho) p_C * rho / (p_C * rho + (1 - p_C))

# Rejilla de combinaciones (brecha de cobertura, razón de respuesta) que
# reproducen EXACTAMENTE lo que se observó. Los datos no permiten separar las
# dos causas: es justo lo que discutieron los análisis posteriores durante
# décadas, y por eso el capítulo lo enseña como una curva y no como un número.
#
#   brecha = p_F - p_C >= 0  (fuera del marco se apoyaba MÁS a Roosevelt)
#   p_C    = p - (1 - C) * brecha
#
# Para cada brecha, se despeja la rho que hace p_hat = p_sondeo_dos:
#   rho = [p_hat (1 - p_C)] / [p_C (1 - p_hat)]
COBERTURA_REF <- 0.55            # valor de referencia del deslizador
brechas <- seq(0, 0.40, by = 0.01)
p_C_de <- function(brecha, C) p_eleccion_dos - (1 - C) * brecha
rho_que_cuadra <- function(brecha, C) {
  pc <- p_C_de(brecha, C)
  (p_sondeo_dos * (1 - pc)) / (pc * (1 - p_sondeo_dos))
}
curva_rho <- rho_que_cuadra(brechas, COBERTURA_REF)

# Verificación: la curva tiene que devolver el p_hat observado en todos sus puntos.
chequeo <- digest_phat(p_C_de(brechas, COBERTURA_REF), curva_rho)
stopifnot(max(abs(chequeo - p_sondeo_dos)) < 1e-12)
cat(sprintf("  curva iso-resultado: %d puntos, error máx %.2e\n",
            length(brechas), max(abs(chequeo - p_sondeo_dos))))

# Los dos extremos, para el texto: si TODO fuera no respuesta (brecha 0) y si
# el sondeo hubiera tenido respuesta simétrica (rho = 1).
rho_si_solo_no_respuesta <- rho_que_cuadra(0, COBERTURA_REF)
brecha_si_solo_cobertura <- (p_eleccion_dos - p_sondeo_dos) / (1 - COBERTURA_REF)
cat(sprintf("  solo no respuesta: rho = %.4f | solo cobertura: brecha = %.4f\n",
            rho_si_solo_no_respuesta, brecha_si_solo_cobertura))

digest <- list(
  documental = list(
    enviadas = 10000000, devueltas = 2300000,
    landonSondeo = digest_landon_sondeo, rooseveltSondeo = digest_roosevelt_sondeo,
    prediccionLandon = 54, prediccionRoosevelt = 41,
    eleccionRoosevelt = 61, eleccionLandon = 37,
    tasaRespuesta = digest_devueltas_dos / 10000000
  ),
  pSondeo = p_sondeo_dos, pEleccion = p_eleccion_dos, sesgo = sesgo_digest,
  coberturaRef = COBERTURA_REF,
  isoResultado = list(brecha = brechas, rho = curva_rho),
  rhoSoloNoRespuesta = rho_si_solo_no_respuesta,
  brechaSoloCobertura = brecha_si_solo_cobertura
)

# ===========================================================================
# 2 · Hite 1987: ¿cuánto tendrían que diferir las que no contestaron?
# ===========================================================================
#
# Fórmula del sesgo de no respuesta (la que se formaliza en el capítulo 8):
#   mu = r mu_R + (1 - r) mu_M   =>   mu_M = (mu - r mu_R) / (1 - r)
# Con r = 0,045 y mu_R = 0,84, se despeja qué tendrían que responder las que
# NO contestaron para que el valor poblacional fuera cada mu.
hite_r    <- 0.045
hite_muR  <- 0.84
hite_mu   <- c(0.10, 0.15, 0.20, 0.25, 0.30, 0.40, 0.50, 0.60, 0.70, 0.84)
hite_muM  <- (hite_mu - hite_r * hite_muR) / (1 - hite_r)
stopifnot(all(hite_muM > -1e-9))                       # ninguna sale imposible
# Verificación por la vía directa: recomponer mu desde mu_M.
stopifnot(max(abs(hite_r * hite_muR + (1 - hite_r) * hite_muM - hite_mu)) < 1e-12)
cat(sprintf("Hite: con mu = 0,25 bastaría mu_M = %.4f entre las que no contestaron\n",
            hite_muM[hite_mu == 0.25]))

hite <- list(
  enviados = 100000, tasa = hite_r, devueltos = 100000 * hite_r,
  muR = hite_muR,
  cifras = list(
    list(pct = 84, texto = "no están satisfechas emocionalmente con sus relaciones", pagina = 804),
    list(pct = 70, texto = "casadas cinco o más años tienen relaciones fuera del matrimonio", pagina = 856),
    list(pct = 95, texto = "reportan formas de acoso emocional y psicológico", pagina = 810),
    list(pct = 84, texto = "reportan formas de condescendencia", pagina = 809)
  ),
  inverso = list(mu = hite_mu, muM = hite_muM)
)

# ===========================================================================
# 3 · Las dos encuestas sobre "soy más inteligente que la media"
# ===========================================================================
on <- lee_lohr("intellonline")
te <- lee_lohr("intelltel")
wt <- lee_lohr("intellwts")

stopifnot(nrow(on) == 983, nrow(te) == 1838, nrow(wt) == 8)

# El censo de 2010 es recuperable de las dos calibraciones, y las dos tienen que
# coincidir: es la comprobación por dos vías de esta sección.
censo_desde_tel    <- wt$tel_n * wt$tel_wgt
censo_desde_online <- wt$online_n * wt$online_wgt
dif_censo <- max(abs(censo_desde_tel - censo_desde_online))
cat(sprintf("intell: censo recuperado por dos vías, diferencia máxima %.4f de 750\n", dif_censo))
stopifnot(dif_censo < 1.0)                    # los pesos vienen redondeados a 3 decimales
censo <- (censo_desde_tel + censo_desde_online) / 2

celdas <- data.frame(
  celda    = paste(wt$sex, wt$agegroup, wt$race, sep = " · "),
  sexo     = wt$sex, edad = wt$agegroup, raza = wt$race,
  telN     = wt$tel_n,    onlineN   = wt$online_n,
  telPeso  = wt$tel_wgt,  onlinePeso = wt$online_wgt,
  pctTel    = 100 * wt$tel_n / sum(wt$tel_n),
  pctOnline = 100 * wt$online_n / sum(wt$online_n),
  pctCenso  = 100 * censo / sum(censo),
  stringsAsFactors = FALSE
)

# El estimando de Lohr: agree = 1 si elige "Strongly Agree" o "Mostly Agree".
agree_on <- as.integer(on$int %in% c(1, 2))
agree_te <- as.integer(te$int %in% c(1, 2))

estim <- function(y, w) c(sin = mean(y), con = weighted.mean(y, w))
ag_on <- estim(agree_on, on$postwt)
ag_te <- estim(agree_te, te$postwt)
cat(sprintf("  agree telefónica: %.4f sin pesos, %.4f con pesos\n", ag_te["sin"], ag_te["con"]))
cat(sprintf("  agree online:     %.4f sin pesos, %.4f con pesos\n", ag_on["sin"], ag_on["con"]))

# Validación externa: el título del artículo de Heck, Simons y Chabris (2018) es
# "65% of Americans believe they are above average in intelligence". Si la
# estimación ponderada de la encuesta telefónica no cae cerca del 65 %, es que
# algo se calculó mal aquí.
cat(sprintf("  contraste con el título del artículo (65 %%): %.1f %%\n", 100 * ag_te["con"]))
stopifnot(abs(100 * ag_te["con"] - 65) < 3)

cv <- function(w) sd(w) / mean(w)
comp <- function(d, v) {
  tb <- prop.table(table(d[[v]]))
  setNames(as.numeric(tb), names(tb))
}
reparto <- function(v) {
  niveles <- sort(union(names(comp(on, v)), names(comp(te, v))))
  a <- comp(on, v)[niveles]; b <- comp(te, v)[niveles]
  a[is.na(a)] <- 0; b[is.na(b)] <- 0
  list(niveles = niveles, online = 100 * as.numeric(a), tel = 100 * as.numeric(b))
}

intell <- list(
  documental = list(
    telNumeros = 79014, telEntrevistas = 1838,
    telSoloMovil = 24.5, telSinTelefono = 2.0,
    onlineN = 983, onlinePago = 0.25,
    escala = c("Muy de acuerdo", "Bastante de acuerdo", "Bastante en desacuerdo",
               "Muy en desacuerdo", "No sé / no estoy seguro")
  ),
  celdas = celdas,
  agree = list(
    tel = list(sinPesos = 100 * ag_te[["sin"]], conPesos = 100 * ag_te[["con"]]),
    online = list(sinPesos = 100 * ag_on[["sin"]], conPesos = 100 * ag_on[["con"]])
  ),
  noSe = list(tel = 100 * mean(te$int == 5), online = 100 * mean(on$int == 5)),
  edadMedia = list(tel = mean(te$age), online = mean(on$age)),
  cvPesos = list(tel = cv(te$postwt), online = cv(on$postwt)),
  reparto = list(raza = reparto("race"), educacion = reparto("education"),
                 region = reparto("region"), ingreso = reparto("income")),
  escalaConteo = list(
    niveles = 1:5,
    tel = as.numeric(table(factor(te$int, levels = 1:5))),
    online = as.numeric(table(factor(on$int, levels = 1:5)))
  )
)

# ===========================================================================
# 4 · Las poblaciones del curso: agpop y BigLucy
# ===========================================================================
agpop <- lee_lohr("agpop")
stopifnot(nrow(agpop) == 3078)

# El código -99 de Lohr. Decisión del proyecto (2026-07-27): se usa el marco
# completo, N = 3078, sin excluir nada. La consecuencia se declara en el texto.
faltantes <- sapply(c("acres92", "acres87", "acres82"), function(v) sum(agpop[[v]] == -99))
media_marco  <- mean(agpop$acres92)
media_validos <- mean(agpop$acres92[agpop$acres92 != -99])
cat(sprintf("agpop: N = %d, media acres92 = %.4f (marco completo) frente a %.4f (solo válidos)\n",
            nrow(agpop), media_marco, media_validos))
cat(sprintf("  faltantes -99: %s\n", paste(names(faltantes), faltantes, sep = "=", collapse = ", ")))

NOMBRE_REGION <- c(NC = "Centro-Norte", NE = "Nordeste", S = "Sur", W = "Oeste")
reg <- split(agpop$acres92, agpop$region)
regiones <- data.frame(
  region = names(reg),
  nombre = unname(NOMBRE_REGION[names(reg)]),
  N      = sapply(reg, length),
  media  = sapply(reg, mean),
  sd     = sapply(reg, sd),
  stringsAsFactors = FALSE
)
regiones <- regiones[order(-regiones$media), ]
row.names(regiones) <- NULL
print(regiones, digits = 6)

# La media global tiene que ser la media de las medias regionales ponderada por N.
stopifnot(abs(sum(regiones$N * regiones$media) / sum(regiones$N) - media_marco) < 1e-8)

# Histograma con la cola recortada en el percentil 99: sin recorte, `acres92`
# tiene condados de 7 millones de acres y el gráfico es una barra y desierto.
# El recorte es por saturación (no por descarte): las unidades de la cola se
# acumulan en la última clase, así que el conteo total sigue siendo N.
# El extremo inferior arranca en el mínimo real y no en cero, porque `agpop`
# trae 19 condados con el código de faltante -99 y descartarlos en silencio
# sería justo el error que el capítulo enseña a no cometer.
histograma <- function(x, nclases = 40, maxi = NULL, mini = NULL) {
  if (is.null(maxi)) maxi <- as.numeric(quantile(x, 0.99))
  # `mini` se pasa explícito cuando varios histogramas tienen que compartir
  # ejes: si cada uno usa su propio mínimo, las clases no coinciden y
  # superponerlos en el simulador engaña a la vista sin dar ningún error.
  if (is.null(mini)) mini <- min(x)
  cortes <- seq(mini, maxi, length.out = nclases + 1)
  h <- hist(pmax(pmin(x, maxi), mini), breaks = cortes, plot = FALSE,
            include.lowest = TRUE)
  stopifnot(sum(h$counts) == length(x))          # nada se pierde por el camino
  list(centros = h$mids, conteo = h$counts, tope = maxi, piso = mini)
}

# Asimetría muestral (momento tercero estandarizado). Se calcula a mano porque
# no hay que arrastrar `e1071` solo para esto, y así queda a la vista qué se
# está midiendo: el capítulo 2 la usa para explicar por qué con n pequeño la
# distribución de muestreo no es normal.
asimetria <- function(x) {
  z <- (x - mean(x)) / sd(x)
  mean(z^3)
}

S2_agpop <- var(agpop$acres92)
# Un histograma por región, con el MISMO tope que el global para que las cuatro
# se puedan superponer en el simulador sin que cambien los ejes.
tope_global <- as.numeric(quantile(agpop$acres92, 0.99))
piso_global <- min(agpop$acres92)
hist_region <- lapply(regiones$region, function(rg) {
  x <- agpop$acres92[agpop$region == rg]
  histograma(x, maxi = tope_global, mini = piso_global)
})
names(hist_region) <- regiones$region
# Los cuatro histogramas regionales tienen que sumar el histograma global,
# clase a clase. Si no, es que los cortes no coincidían.
stopifnot(all(Reduce(`+`, lapply(hist_region, `[[`, "conteo")) ==
              histograma(agpop$acres92)$conteo))

agpop_json <- list(
  N = nrow(agpop), media = media_marco, mediaValidos = media_validos,
  S2 = S2_agpop, S = sqrt(S2_agpop),
  cv = sqrt(S2_agpop) / media_marco, asimetria = asimetria(agpop$acres92),
  faltantes = as.list(faltantes),
  totalReal = sum(agpop$acres92),
  regiones = regiones,
  hist = histograma(agpop$acres92),
  histRegion = hist_region
)

# --- BigLucy -------------------------------------------------------------
suppressPackageStartupMessages(library(TeachingSampling))
data(BigLucy, package = "TeachingSampling")
stopifnot(nrow(BigLucy) == 85296)
biglucy <- list(
  N = nrow(BigLucy), columnas = ncol(BigLucy), nombres = names(BigLucy),
  ingresoMedio = mean(BigLucy$Income), ingresoTotal = sum(BigLucy$Income),
  cv = sd(BigLucy$Income) / mean(BigLucy$Income),
  asimetria = asimetria(BigLucy$Income),
  empleadosMedio = mean(BigLucy$Employees),
  nivel = as.list(table(BigLucy$Level)),
  zona = as.list(table(BigLucy$Zone)),
  spam = 100 * mean(BigLucy$SPAM == "yes"),
  hist = histograma(BigLucy$Income)
)
cat(sprintf("BigLucy: N = %d, ingreso medio = %.4f, %% SPAM = %.4f\n",
            biglucy$N, biglucy$ingresoMedio, biglucy$spam))

# ===========================================================================
# 5 · Sesgo de no respuesta por clases (simulador del módulo 4)
# ===========================================================================
#
# Las cuatro regiones de agpop hacen de clases de respuesta. Con tasas r_h, el
# estimador ingenuo (media de los respondientes) tiene esperanza
#
#   mu_R = sum(N_h r_h mu_h) / sum(N_h r_h)
#
# y su sesgo es mu_R - mu. El simulador lo calcula en vivo desde estas cifras;
# aquí se dejan tres escenarios ya resueltos para verificar que coinciden.
sesgo_clases <- function(N_h, mu_h, r_h) {
  peso <- N_h * r_h
  sum(peso * mu_h) / sum(peso) - sum(N_h * mu_h) / sum(N_h)
}
# Las tasas se llevan SIEMPRE nombradas por región, nunca por posición: el
# bloque de código del capítulo las escribe en orden alfabético (NC, NE, S, W)
# y la tabla de aquí va ordenada por media descendente. Con vectores anónimos
# las dos cosas se cruzarían en silencio y darían sesgos distintos.
Nh  <- setNames(regiones$N, regiones$region)
muh <- setNames(regiones$media, regiones$region)
tasas <- function(v) v[regiones$region]

escenarios <- list(
  list(nombre = "Todas al 60 %", r = c(NC = 0.60, NE = 0.60, S = 0.60, W = 0.60)),
  list(nombre = "Todas al 10 %", r = c(NC = 0.10, NE = 0.10, S = 0.10, W = 0.10)),
  list(nombre = "Desiguales (el Oeste responde poco)",
       r = c(NC = 0.50, NE = 0.65, S = 0.35, W = 0.20))
)
escenarios_json <- lapply(escenarios, function(e) {
  s <- sesgo_clases(Nh, muh, tasas(e$r))
  cat(sprintf("  no respuesta [%s]: sesgo = %.4f\n", e$nombre, s))
  list(nombre = e$nombre, region = regiones$region, r = unname(tasas(e$r)), sesgo = s)
})
# Los dos primeros escenarios tienen que dar sesgo exactamente cero: lo que
# sesga es que las tasas DIFIERAN, no que sean bajas.
stopifnot(abs(escenarios_json[[1]]$sesgo) < 1e-9,
          abs(escenarios_json[[2]]$sesgo) < 1e-9)

# ===========================================================================
# 6 · Error total: sesgo² + varianza, y el tamaño efectivo de una muestra sesgada
# ===========================================================================
#
# Para una proporción con p = p_eleccion_dos, S² = p(1-p). El sondeo del Digest
# tenía 2 266 566 papeletas útiles y un sesgo de -0,1931. Un MAS de 1 000
# votantes no tiene sesgo y una varianza mucho mayor. La pregunta del módulo 7
# es cuál de los dos vale más, y la respuesta no admite discusión.
p        <- p_eleccion_dos
S2_prop  <- p * (1 - p)
n_digest <- digest_devueltas_dos
n_mas    <- 1000

var_digest <- S2_prop / n_digest
ecm_digest <- sesgo_digest^2 + var_digest
var_mas    <- S2_prop / n_mas
ecm_mas    <- var_mas
n_efectivo <- S2_prop / ecm_digest

cat(sprintf("Error total: RECM Digest = %.6f, RECM MAS(1000) = %.6f, razón = %.4f\n",
            sqrt(ecm_digest), sqrt(ecm_mas), sqrt(ecm_digest / ecm_mas)))
cat(sprintf("  tamaño efectivo del sondeo de 2,3 millones = %.4f votantes\n", n_efectivo))

# Verificación: n_efectivo es, por definición, el n de un MAS con el mismo ECM.
stopifnot(abs(S2_prop / n_efectivo - ecm_digest) < 1e-15)

# Curvas de RECM frente a n, para el simulador (eje logarítmico en n).
n_rejilla <- round(10^seq(1, 7, length.out = 61))
curva_recm <- list(
  n = n_rejilla,
  insesgado = sqrt(S2_prop / n_rejilla),
  sesgado   = sqrt(sesgo_digest^2 + S2_prop / n_rejilla)
)

errorTotal <- list(
  p = p, S2 = S2_prop, sesgoDigest = sesgo_digest,
  nDigest = n_digest, nMas = n_mas,
  ecmDigest = ecm_digest, ecmMas = ecm_mas,
  recmDigest = sqrt(ecm_digest), recmMas = sqrt(ecm_mas),
  razonRecm = sqrt(ecm_digest / ecm_mas),
  nEfectivo = n_efectivo,
  curva = curva_recm,
  # Para el simulador de descomposición sobre agpop: la varianza del MAS con fpc.
  agpop = list(N = nrow(agpop), S2 = S2_agpop, media = media_marco)
)

# ===========================================================================
# 7 · Escritura
# ===========================================================================
datos <- list(
  meta = list(
    capitulo = 1, semilla = SEMILLA, generado = format(Sys.Date()),
    r = paste0("R ", getRversion()),
    script = "precalculo/genera_cap1.R"
  ),
  digest = digest,
  hite = hite,
  intell = intell,
  agpop = agpop_json,
  biglucy = biglucy,
  noRespuesta = list(regiones = regiones, escenarios = escenarios_json),
  errorTotal = errorTotal
)

escribe_json(datos, "cap1_datos")

# Relectura y comprobación de que lo escrito es lo calculado.
v <- jsonlite::fromJSON(file.path(DIR_SALIDAS, "cap1_datos.json"))
stopifnot(v$agpop$N == 3078,
          abs(v$agpop$media - media_marco) < 1e-4,
          abs(v$errorTotal$nEfectivo - n_efectivo) < 1e-6,
          length(v$digest$isoResultado$brecha) == length(brechas))
cat("\n=== cap1_datos.json verificado tras la relectura ===\n")
