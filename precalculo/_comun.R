# _comun.R — base compartida por todos los scripts de precálculo
#
# Se carga con  source("precalculo/_comun.R")  desde la raíz del repositorio.
# Ejecutar SIEMPRE con el R del framework 4.4 (ver precalculo/README.md).

# ---------------------------------------------------------------------------
# Locale. R arranca con LC_CTYPE = "C" y entonces jsonlite escribe las tildes
# como bytes sueltos (<c3><b3>), que el navegador interpreta como marcado y se
# come la letra. Esto NO es opcional: sin esta línea el material sale con
# "estratificacin" en vez de "estratificación".
# ---------------------------------------------------------------------------
invisible(Sys.setlocale("LC_CTYPE", "en_US.UTF-8"))

# ---------------------------------------------------------------------------
# Rutas. Todo se resuelve desde la raíz del repositorio (la carpeta Muestreo/).
# ---------------------------------------------------------------------------
DIR_RAIZ    <- normalizePath(".", mustWork = TRUE)
DIR_DATOS   <- file.path(DIR_RAIZ, "CSV data sets for SDA 3e")
DIR_SALIDAS <- file.path(DIR_RAIZ, "precalculo", "salidas")
DIR_SITIO   <- file.path(DIR_RAIZ, "Htmls_Muestreo")

if (!dir.exists(DIR_DATOS)) {
  stop("No encuentro los datos de Lohr en '", DIR_DATOS, "'.\n",
       "  Ejecuta los scripts desde la raíz del repositorio (la carpeta Muestreo/).")
}
dir.create(DIR_SALIDAS, showWarnings = FALSE, recursive = TRUE)

# ---------------------------------------------------------------------------
# Semilla. Fija y única para todo el material: cualquier simulación es
# reproducible y las cifras del texto no cambian entre ejecuciones.
# ---------------------------------------------------------------------------
SEMILLA <- 2026
set.seed(SEMILLA)

# ---------------------------------------------------------------------------
# Paleta institucional (la misma de los capítulos HTML)
# ---------------------------------------------------------------------------
COLORES <- c(verde = "#012820", naranja = "#FF6600", dorado = "#90FF00",
             gris = "#6B7280", rojo = "#DC2626", azul = "#2563EB")

# ---------------------------------------------------------------------------
# Ayudantes
# ---------------------------------------------------------------------------

#' Lee un dataset oficial de Lohr por su nombre, sin extensión.
#' lee_lohr("agpop") -> data.frame de 3078 condados
lee_lohr <- function(nombre) {
  ruta <- file.path(DIR_DATOS, paste0(nombre, ".csv"))
  if (!file.exists(ruta)) {
    stop("El dataset '", nombre, "' no existe. Disponibles: ",
         paste(sub("\\.csv$", "", list.files(DIR_DATOS, pattern = "\\.csv$")), collapse = ", "))
  }
  read.csv(ruta, stringsAsFactors = FALSE)
}

#' Escribe un objeto como JSON en precalculo/salidas/ y lo vuelve a leer para
#' comprobar que es válido. Devuelve la ruta.
#'
#' Se relee a propósito: en Series de Tiempo se publicaron cifras viejas por
#' trabajar con un volcado obsoleto. Escribir no es garantía de nada.
escribe_json <- function(objeto, nombre, digits = 8) {
  ruta <- file.path(DIR_SALIDAS, paste0(nombre, ".json"))
  jsonlite::write_json(objeto, ruta, auto_unbox = TRUE, digits = digits, na = "null")
  vuelta <- jsonlite::fromJSON(ruta)          # falla ruidosamente si el JSON es inválido
  cat(sprintf("  escrito %s (%s)\n", basename(ruta),
              format(structure(file.size(ruta), class = "object_size"), units = "auto")))
  invisible(ruta)
}

#' Formatea un número para incrustarlo en el texto del material.
fmt <- function(x, d = 4) formatC(x, format = "f", digits = d, big.mark = "")

#' Estimador de Horvitz-Thompson del total y su varianza estimada, calculados
#' a mano a partir de las probabilidades de inclusión. Sirve como la "segunda
#' vía" con la que contrastar lo que devuelve survey: el protocolo del proyecto
#' exige que toda varianza se verifique por dos caminos independientes.
#'
#' @param y      valores observados en la muestra
#' @param pi_k   probabilidades de inclusión de primer orden de las unidades de la muestra
#' @param pi_kl  matriz de probabilidades de segundo orden (opcional). Sin ella
#'               se devuelve solo la estimación puntual.
ht <- function(y, pi_k, pi_kl = NULL) {
  stopifnot(length(y) == length(pi_k), all(pi_k > 0), all(pi_k <= 1))
  t_ht <- sum(y / pi_k)
  if (is.null(pi_kl)) return(list(total = t_ht, var = NA_real_))
  d <- y / pi_k
  delta <- pi_kl - outer(pi_k, pi_k)          # Delta_kl = pi_kl - pi_k pi_l
  v <- sum((delta / pi_kl) * outer(d, d))     # estimador de la varianza de HT
  list(total = t_ht, var = v)
}

cat(sprintf("[_comun.R] R %s | LC_CTYPE=%s | semilla=%d | datos=%d CSV\n",
            getRversion(), Sys.getlocale("LC_CTYPE"), SEMILLA,
            length(list.files(DIR_DATOS, pattern = "\\.csv$"))))
