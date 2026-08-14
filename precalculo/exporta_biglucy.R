# exporta_biglucy.R — saca BigLucy del paquete de R a un CSV que Python pueda leer
#
# Ejecutar SIEMPRE con el R del framework 4.4:
#   /Library/Frameworks/R.framework/Versions/4.4-arm64/Resources/bin/Rscript precalculo/exporta_biglucy.R
#
# Produce precalculo/salidas/BigLucy.csv.gz
#
# POR QUÉ EXISTE
#
# `agpop` y todas las poblaciones de Lohr llegan como CSV, así que las dos
# pestañas de cada bloque leen exactamente el mismo archivo. `BigLucy` no: vive
# dentro del paquete `TeachingSampling`, que solo existe para R. Sin este
# archivo, la pestaña de Python del bloque R9 tendría que fingir —copiar a mano
# unas cifras calculadas en R— y eso es justo lo que el proyecto no hace.
#
# Es el mismo recurso que usa el material de Estadística Espacial cuando un
# dato solo existe en un paquete de R: el precálculo lo exporta y la pestaña de
# Python lee el archivo exportado.
#
# POR QUÉ COMPRIMIDO
#
# En claro son 7,5 MB; comprimido, 1,6. `read.csv()` y `pandas.read_csv()` leen
# el .gz directamente, sin descomprimir y sin ninguna opción extra, así que no
# se paga nada por ello en el código que ve el estudiante. El repositorio va a
# GitHub Pages y su .gitignore declara que no quiere inflar el historial: 1,6 MB
# es un precio razonable por dejar de mentir en una pestaña; 7,5 no lo era.
#
# El archivo vive en precalculo/salidas/ y NO en sitio/, así que la rama
# gh-pages no lo lleva y Pages no lo sirve a nadie que no lo pida.

source("precalculo/_comun.R")
suppressMessages(library(TeachingSampling))

data(BigLucy)

destino <- file.path(DIR_SALIDAS, "BigLucy.csv.gz")
con <- gzfile(destino, "w", compression = 9)
write.csv(BigLucy, con, row.names = FALSE)
close(con)

# Comprobación de ida y vuelta: lo que se escribió tiene que releerse igual.
# Un export que pierde una columna o cambia un tipo no se nota hasta que la
# pestaña de Python publica una cifra distinta, y entonces ya está publicada.
releido <- read.csv(destino)
stopifnot(
  nrow(releido) == nrow(BigLucy),
  ncol(releido) == ncol(BigLucy),
  identical(names(releido), names(BigLucy)),
  all.equal(mean(releido$Income), mean(BigLucy$Income)),
  all.equal(mean(releido$SPAM == "yes"), mean(BigLucy$SPAM == "yes"))
)

cat(sprintf("escrito %s: %d filas, %d columnas, %.1f MB\n",
            basename(destino), nrow(BigLucy), ncol(BigLucy),
            file.size(destino) / 1024^2))
cat(sprintf("  ingreso medio %.4f · SPAM %.4f %%\n",
            mean(BigLucy$Income), 100 * mean(BigLucy$SPAM == "yes")))
