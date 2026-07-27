# verifica_paquetes.R — prueba de humo del entorno de precálculo
#
# Comprueba que el R desde el que se ejecuta tiene todo lo que necesitan los
# scripts de este directorio. Ejecutar SIEMPRE con el R del framework 4.4:
#
#   /Library/Frameworks/R.framework/Versions/4.4-arm64/Resources/bin/Rscript \
#       precalculo/verifica_paquetes.R
#
# El Rscript del PATH es Homebrew 4.6 y NO tiene survey: fallaría aquí.

source("precalculo/_comun.R")

fallos <- character(0)
ok <- function(msg) cat(sprintf("  OK    %s\n", msg))
mal <- function(msg) { cat(sprintf("  FALLA %s\n", msg)); fallos <<- c(fallos, msg) }

cat("\n== R en uso ==\n")
cat(sprintf("  %s\n", R.version.string))
cat(sprintf("  %s\n", R.home()))
if (!grepl("4\\.4", getRversion())) mal("no es R 4.4 — usa el Rscript del framework")

cat("\n== Paquetes ==\n")
requeridos <- c("survey", "sampling", "TeachingSampling", "jsonlite", "stats")
for (p in requeridos) {
  if (requireNamespace(p, quietly = TRUE)) {
    ok(sprintf("%-18s %s", p, as.character(packageVersion(p))))
  } else {
    mal(sprintf("%-18s NO INSTALADO", p))
  }
}

cat("\n== Funciones de TeachingSampling que usa el material ==\n")
for (f in c("S.SI", "E.SI", "S.BE", "E.BE", "S.STPPS", "E.STPPS", "E.2SI", "S.WR")) {
  if (exists(f, where = asNamespace("TeachingSampling"), inherits = FALSE)) ok(f) else mal(f)
}

cat("\n== Población BigLucy (los ejemplos de Gutiérrez) ==\n")
data("BigLucy", package = "TeachingSampling", envir = environment())
if (exists("BigLucy")) {
  ok(sprintf("BigLucy: %d filas x %d columnas", nrow(BigLucy), ncol(BigLucy)))
  cat(sprintf("         columnas: %s\n", paste(names(BigLucy), collapse = ", ")))
} else mal("BigLucy no carga")

cat("\n== Datos de Lohr ==\n")
csv <- list.files(DIR_DATOS, pattern = "\\.csv$")
if (length(csv) >= 80) {
  ok(sprintf("%d archivos CSV en %s", length(csv), DIR_DATOS))
} else {
  mal(sprintf("solo %d CSV en %s", length(csv), DIR_DATOS))
}

agpop <- lee_lohr("agpop")
if (nrow(agpop) == 3078) {
  ok("agpop: 3078 condados")
} else {
  mal(sprintf("agpop tiene %d filas, se esperaban 3078", nrow(agpop)))
}

cat("\n== Locale y JSON con tildes ==\n")
cat(sprintf("  LC_CTYPE = %s\n", Sys.getlocale("LC_CTYPE")))
prueba <- jsonlite::toJSON(list(texto = "estratificación, razón, ñ"), auto_unbox = TRUE)
if (grepl("estratificación", prueba, fixed = TRUE)) {
  ok("jsonlite escribe las tildes correctamente")
} else {
  mal(sprintf("jsonlite mangla las tildes: %s", prueba))
}

cat("\n")
if (length(fallos) == 0) {
  cat("== ENTORNO LISTO ==\n\n")
} else {
  cat(sprintf("== %d FALLO(S) ==\n", length(fallos)))
  for (f in fallos) cat(sprintf("   - %s\n", f))
  cat("\n")
  quit(status = 1)
}
