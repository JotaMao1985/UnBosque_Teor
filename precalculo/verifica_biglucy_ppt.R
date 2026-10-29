# verifica_biglucy_ppt.R — ¿gana el PPT por empleados en BigLucy? (diapositivas del cap. 4, T7.94)
#
# Ejecutar con el R del framework 4.4:
#   /Library/Frameworks/R.framework/Versions/4.4-arm64/Resources/bin/Rscript precalculo/verifica_biglucy_ppt.R
#
# Produce: consola.
#
# POR QUÉ EXISTE
#
# El M9 del cap. 4 sortea BigLucy con STPPS (m_h = 60/120/200, PPT por empleados)
# y da a entender que ahí el PPT brilla. La auditoría de las diapositivas
# (2026-10-22) comprobó que no: dentro de cada nivel, Income sigue poco a los
# empleados, y el error estándar verdadero del total con Hansen–Hurwitz es mayor
# que el de un MAS sin reemplazo con los mismos tamaños por nivel. Este guion
# deja esa cuenta reproducible; sus cifras van en la diapositiva «En BigLucy, el
# PPT por empleados pierde contra un MAS en cada nivel» y en
# sitio/muestreo/diapositivas/fuentes/recursos/cap4/m9_biglucy.json.
#
# Salida esperada (R 4.4, TeachingSampling 4.1.1):
#   correlación Income–Employees por nivel: Big 0,77 · Medium 0,44 · Small 0,19
#   ee verdadero del total: STPPS 980 501 · MAS por nivel 582 346 (= ppt.seStsi del precálculo)
#   cociente de varianzas STPPS/MAS por nivel: 1,0 · 3,1 · 2,8

suppressMessages(library(TeachingSampling))
data(BigLucy)
mh <- c(Big = 60, Medium = 120, Small = 200)
lv <- as.character(BigLucy$Level)
y <- BigLucy$Income
x <- BigLucy$Employees

r <- sapply(names(mh), function(h) cor(y[lv == h], x[lv == h]))
print(round(r, 2))

# Varianza exacta de Hansen–Hurwitz: sum_k psi_k (y_k/psi_k − t_h)^2 / m_h en cada nivel
Vhh <- sapply(names(mh), function(h) {
  yy <- y[lv == h]; xx <- x[lv == h]; psi <- xx / sum(xx); t <- sum(yy)
  sum(psi * (yy / psi - t)^2) / mh[h]
})
# MAS sin reemplazo con los mismos tamaños en cada nivel
Vsi <- sapply(names(mh), function(h) {
  yy <- y[lv == h]; Nh <- length(yy); n <- mh[h]
  Nh^2 * (1 - n / Nh) * var(yy) / n
})
print(round(c(se_hh = sqrt(sum(Vhh)), se_stsi = sqrt(sum(Vsi))), 0))
print(round(Vhh / Vsi, 2))
print(table(lv))
print(sum(y))
