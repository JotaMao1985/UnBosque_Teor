# verifica_laboratorio_ppt.R — el motor del laboratorio πPT, contra `sampling` (T7.118)
#
# Ejecutar con el R del framework 4.4, desde la raíz del repositorio:
#   /Library/Frameworks/R.framework/Versions/4.4-arm64/Resources/bin/Rscript precalculo/verifica_laboratorio_ppt.R
#
# Necesita `node` en el PATH. Produce: consola; sale con error si algo no cuadra.
#
# POR QUÉ EXISTE
#
# El laboratorio original (Simulador_IProb.html, fuera de git) daba en las tiendas
# V = 1554,9 donde el capítulo 6 dice 53, porque topaba las π en 0,96 en lugar de
# la inclusión forzosa. El motor nuevo (ensamblado/laboratorio_ppt/motor.js) se
# prueba en Node con sus identidades (precalculo/pruebas/prueba_laboratorio_ppt.js);
# esta es la segunda vía, independiente: las π y las π_kl las calcula `sampling`,
# y las varianzas se rehacen aquí con ellas.
#
#   1. π_k: inclusionprobabilities (seis escenarios, cada n, y 60 poblaciones al azar).
#   2. π_kl del sistemático de lista fija: UPsystematicpi2.
#   3. π_kl de máxima entropía: el camino de UPmaxentropypi2 (UPMEpiktildefrompik y
#      UPMEpik2frompikw), con eps = 1e-13 en lugar del 1e-6 que trae por defecto.
#   4. π_kl del sistemático con la lista barajada: el promedio de UPsystematicpi2
#      sobre todas las permutaciones (hasta 7 unidades sorteadas).
#   5. V en forma SYG, Hansen–Hurwitz y MAS con las π_kl de R; las cifras del
#      curso: 53, 7124, 77 244 y 70 120.
#   6. Dos etapas con classes: V1 + V2 de la ec. 6.27, la R_a² con aov y el peso 32,35.
#   7. Las salidas #> de los paneles «En R» de la página, ejecutados en un entorno limpio.
#
# Salida esperada: «todo cuadra» y un resumen por bloque.

source("precalculo/_comun.R")
suppressMessages({ library(sampling); library(jsonlite) })

MOTOR <- normalizePath("ensamblado/laboratorio_ppt/motor.js")
ESCENARIOS <- fromJSON("ensamblado/laboratorio_ppt/escenarios.json", simplifyVector = FALSE)
fallos <- 0L
revisadas <- 0L
cuadra <- function(nombre, a, b, tol = 1e-9) {
  err <- max(abs(a - b) / pmax(1, abs(b)))
  revisadas <<- revisadas + 1L
  if (!is.finite(err) || err > tol) {
    fallos <<- fallos + 1L
    cat(sprintf("  ✗ %s: error relativo %.3g\n", nombre, err))
  }
}

# Corre el motor en Node con una lista de casos y devuelve sus resultados.
motor <- function(casos) {
  entrada <- tempfile(fileext = ".json")
  write_json(casos, entrada, auto_unbox = TRUE, digits = NA)
  codigo <- sprintf(paste0(
    "const M = require(%s); const casos = require(%s);",
    "const salida = casos.map(c => {",
    "  if (c.tipo === 'dos') { const y = M.poblacionClases(c.M, c.rho, c.semilla);",
    "    const d = M.analizaDosEtapas(c.M, y, c.n, c.m, c.esquema); return { y, V1: d.V1, V2: d.V2, Ra2: d.anova.Ra2, peso: d.pesoComun }; }",
    "  const a = M.analiza(c.unidades, c.n, c.esquema);",
    "  return { pi: a.pi, pikl: a.pikl, V: a.V, vHH: a.referencias.vHH, vMAS: a.referencias.vMAS,",
    "           vMRAS: a.referencias.vMRAS, raj: a.referencias.rajDiferencia }; });",
    "process.stdout.write(JSON.stringify(salida));"),
    toJSON(MOTOR, auto_unbox = TRUE), toJSON(entrada, auto_unbox = TRUE))
  fromJSON(paste(system2("node", c("-e", shQuote(codigo)), stdout = TRUE), collapse = ""),
           simplifyVector = TRUE, simplifyMatrix = TRUE)
}

# π_kl de cada diseño según `sampling`. Las forzosas (π = 1) salen con todas: su
# fila es π_l.
pikl_r <- function(pik, esquema) {
  N <- length(pik)
  fija <- pik >= 1 - 1e-12
  resto <- which(!fija)
  P <- matrix(0, N, N)
  if (length(resto) > 0 && sum(pik[resto]) > 1e-12) {
    sub <- pik[resto]
    P[resto, resto] <- switch(esquema,
      sistematico_fijo = UPsystematicpi2(sub),
      maxima_entropia = if (round(sum(sub)) >= 2) {
        pikt <- UPMEpiktildefrompik(sub, eps = 1e-13)
        UPMEpik2frompikw(sub, pikt / (1 - pikt))
      } else diag(sub, length(sub)),
      sistematico_aleatorio = {
        orden <- function(v) if (length(v) <= 1) list(v) else
          do.call(c, lapply(seq_along(v), function(i) lapply(orden(v[-i]), function(r) c(v[i], r))))
        perms <- orden(seq_along(sub))
        A <- matrix(0, length(sub), length(sub))
        for (p in perms) { Q <- UPsystematicpi2(sub[p]); A[p, p] <- A[p, p] + Q }
        A / length(perms)
      })
  }
  for (k in which(fija)) { P[k, ] <- pik; P[, k] <- pik }
  diag(P) <- pik
  P
}

var_syg <- function(y, pik, P) {
  N <- length(y); v <- 0
  for (k in 1:(N - 1)) for (l in (k + 1):N)
    v <- v + (pik[k] * pik[l] - P[k, l]) * (y[k] / pik[k] - y[l] / pik[l])^2
  v
}

# ------------------------------------------------------------- casos de una etapa
casos <- list()
for (e in ESCENARIOS$una_etapa) {
  u <- lapply(e$unidades, function(v) list(id = v$id, x = v$x, y = v$y))
  for (n in 1:(length(u) - 1)) for (esq in c("sistematico_fijo", "maxima_entropia", "sistematico_aleatorio"))
    casos[[length(casos) + 1]] <- list(tipo = "una", nombre = sprintf("%s n=%d %s", e$clave, n, esq),
                                       unidades = u, n = n, esquema = esq)
}
set.seed(SEMILLA)
for (caso in 1:60) {
  N <- sample(3:7, 1); n <- sample(1:(N - 1), 1)
  x <- round(runif(N, 1, 100)) * ifelse(caso %% 3 == 0 & seq_len(N) == 1, 40, 1)
  u <- lapply(1:N, function(k) list(id = paste0("U", k), x = x[k], y = round(runif(1, 0, 500))))
  for (esq in c("sistematico_fijo", "maxima_entropia", "sistematico_aleatorio"))
    casos[[length(casos) + 1]] <- list(tipo = "una", nombre = sprintf("azar %d N=%d n=%d %s", caso, N, n, esq),
                                       unidades = u, n = n, esquema = esq)
}
res <- motor(casos)

cat("1-5. Una etapa:", length(casos), "diseños\n")
for (i in seq_along(casos)) {
  cs <- casos[[i]]
  x <- sapply(cs$unidades, `[[`, "x"); y <- sapply(cs$unidades, `[[`, "y"); n <- cs$n
  pik <- inclusionprobabilities(x, n)
  cuadra(paste(cs$nombre, "π"), res$pi[[i]], pik)
  P <- pikl_r(pik, cs$esquema)
  cuadra(paste(cs$nombre, "π_kl"), as.vector(res$pikl[[i]]), as.vector(P), 1e-9)
  cuadra(paste(cs$nombre, "V (SYG)"), res$V[[i]], var_syg(y, pik, P), 1e-8)
  psi <- x / sum(x); t <- sum(y); N <- length(y)
  cuadra(paste(cs$nombre, "V_HH"), res$vHH[[i]], sum(psi * (y / psi - t)^2) / n)
  cuadra(paste(cs$nombre, "V_MAS"), res$vMAS[[i]], N^2 * (1 - n / N) * var(y) / n)
}
tiendas <- which(sapply(casos, `[[`, "nombre") == "tiendas n=2 maxima_entropia")
cuadra("tiendas: V = 53", res$V[[tiendas]], 53)
cuadra("tiendas: V_HH = 7124", res$vHH[[tiendas]], 7124)
cuadra("tiendas: V_MRAS = 77 244", res$vMRAS[[tiendas]], 77244)
cuadra("tiendas: Raj = 70 120", res$raj[[tiendas]], 70120)

# ------------------------------------------------------------------ dos etapas
D <- ESCENARIOS$dos_etapas
M <- unlist(D$M)
dos <- list()
for (esq in c("maxima_entropia", "sistematico_fijo")) for (nm in list(c(5, 4), c(3, 10)))
  dos[[length(dos) + 1]] <- list(tipo = "dos", M = M, rho = D$rho, semilla = D$semilla,
                                 n = nm[1], m = nm[2], esquema = esq)
rd <- motor(dos)
cat("6. Dos etapas:", length(dos), "diseños sobre classes\n")
for (i in seq_along(dos)) {
  cs <- dos[[i]]
  y <- rd$y[[i]]
  if (is.matrix(y)) y <- split(y, row(y))
  ti <- sapply(y, sum)
  pik <- inclusionprobabilities(M, cs$n)
  P <- pikl_r(pik, cs$esquema)
  S2i <- sapply(y, var)
  mi <- pmin(cs$m, M)
  V2 <- sum(M^2 * (1 - mi / M) * S2i / mi / pik)
  nombre <- sprintf("classes %s n=%d m=%d", cs$esquema, cs$n, cs$m)
  cuadra(paste(nombre, "V1"), rd$V1[[i]], var_syg(ti, pik, P), 1e-8)
  cuadra(paste(nombre, "V2"), rd$V2[[i]], V2, 1e-10)
  datos <- data.frame(clase = factor(rep(seq_along(M), M)), horas = unlist(y))
  tabla <- summary(aov(horas ~ clase, data = datos))[[1]]
  MSW <- tabla[["Mean Sq"]][2]
  cuadra(paste(nombre, "R_a²"), rd$Ra2[[i]], 1 - MSW / var(datos$horas), 1e-10)
}
cuadra("classes: peso 32,35 con n = 5 y m = 4", rd$peso[[1]], 647 / 20)

# ------------------------------------------- las salidas #> de los paneles «En R»
# El README promete que ningún #> se escribe a mano. Los del laboratorio no pasan
# por verifica_bloques.py (no son bloques de capítulo), así que se contrastan aquí:
# cada panel se ejecuta en un entorno limpio y su salida se compara línea a línea.
plantilla <- paste(readLines("ensamblado/laboratorio_ppt/laboratorio.html", encoding = "UTF-8"), collapse = "\n")
paneles <- regmatches(plantilla, gregexpr('<pre class="codigo">[\\s\\S]*?</pre>', plantilla, perl = TRUE))[[1]]
desentidad <- function(x) {
  x <- gsub("<[^>]+>", "", x)
  for (e in list(c("&lt;", "<"), c("&gt;", ">"), c("&quot;", "\""), c("&amp;", "&"))) x <- gsub(e[1], e[2], x, fixed = TRUE)
  x
}
cat("7. Las salidas #> de", length(paneles), "paneles «En R»\n")
for (j in seq_along(paneles)) {
  lineas <- strsplit(desentidad(paneles[[j]]), "\n")[[1]]
  esperado <- trimws(sub("^#> ?", "", lineas[grepl("^#>", lineas)]), which = "right")
  codigo <- lineas[!grepl("^#>", lineas)]
  previo <- setwd(if (any(grepl("classpps", codigo))) DIR_DATOS else DIR_RAIZ)
  entorno <- new.env(parent = globalenv())
  salida <- suppressMessages(capture.output(for (ex in parse(text = codigo)) {
    v <- withVisible(eval(ex, entorno))
    if (v$visible) print(v$value)
  }))
  setwd(previo)
  salida <- trimws(salida, which = "right")
  revisadas <- revisadas + 1L
  if (!identical(salida, esperado)) {
    fallos <- fallos + 1L
    cat(sprintf("  ✗ panel %d: la salida real no es la escrita\n    real:    %s\n    escrita: %s\n", j,
                paste(salida, collapse = " | "), paste(esperado, collapse = " | ")))
  }
}

cat(sprintf("\n%d de %d comparaciones cuadran%s.\n", revisadas - fallos, revisadas,
            if (fallos) sprintf(", %d NO", fallos) else ": todo cuadra"))
if (fallos) quit(status = 1)
