import warnings; warnings.filterwarnings('ignore')
import numpy as np, pandas as pd

print("\n###BLOQUE-P1###\n")
# El sesgo del Literary Digest, partido en sus dos causas. El modelo tiene
# cuatro numeros y ninguna libreria: es aritmetica, y esa es la leccion.
#
#   p    apoyo real a Roosevelt (base de dos candidatos)
#   C    fraccion de votantes que estaba en el marco (listas de telefono,
#        registros de automovil, directorios)
#   d    cuanto MAS apoyaban a Roosevelt los que quedaron fuera del marco
#   rho  tasa de respuesta de los partidarios de Roosevelt dividida por la de
#        los de Landon
p, C, d = 0.62245, 0.55, 0.25
p_obs = 972897 / (1293669 + 972897)       # lo que publico el sondeo

p_C = p - (1 - C) * d                     # apoyo dentro del marco
rho = p_obs * (1 - p_C) / (p_C * (1 - p_obs))   # la rho que reproduce el sondeo
p_hat = p_C * rho / (p_C * rho + (1 - p_C))

print(pd.Series({"p_C": p_C, "rho": rho, "p_estimado": p_hat,
                 "p_publicado": p_obs}).round(5).to_string())
#> p_C            0.50995
#> rho            0.72270
#> p_estimado     0.42924
#> p_publicado    0.42924

print("\n###BLOQUE-P2###\n")
# Con esos cuatro numeros, el sesgo se parte en dos sumandos exactos.
sesgo_cobertura = p_C - p                 # aunque contestaran todos
sesgo_respuesta = p_hat - p_C             # aunque el marco fuera perfecto
print(pd.Series({"sesgo_cobertura": sesgo_cobertura,
                 "sesgo_no_respuesta": sesgo_respuesta,
                 "suma": sesgo_cobertura + sesgo_respuesta,
                 "sesgo_total": p_hat - p}).round(5).to_string())
#> sesgo_cobertura      -0.11250
#> sesgo_no_respuesta   -0.08071
#> suma                 -0.19321
#> sesgo_total          -0.19321

# Los dos sumandos dan el total EXACTAMENTE: no es una aproximacion.
print(round(sesgo_cobertura + sesgo_respuesta - (p_hat - p), 12))
#> 0.0

print("\n###BLOQUE-P3###\n")
# La formula del sesgo de no respuesta, termino a termino.
#   mu = r mu_R + (1 - r) mu_M     =>     mu_R - mu = (1 - r)(mu_R - mu_M)
r, mu_R, mu_M = 0.045, 0.84, 0.30
mu = r * mu_R + (1 - r) * mu_M
print(pd.Series({"tasa_respuesta": r, "media_respondientes": mu_R,
                 "media_no_respondientes": mu_M, "media_poblacional": mu,
                 "sesgo": mu_R - mu,
                 "sesgo_por_la_formula": (1 - r) * (mu_R - mu_M)}).round(5).to_string())
#> tasa_respuesta            0.0450
#> media_respondientes       0.8400
#> media_no_respondientes    0.3000
#> media_poblacional         0.3243
#> sesgo                     0.5157
#> sesgo_por_la_formula      0.5157

print("\n###BLOQUE-P4###\n")
# Error cuadratico medio = sesgo^2 + varianza. Solo el segundo sumando baja
# con n, asi que el primero pone un SUELO que ningun tamano de muestra cruza.
p_real, sesgo, n_digest = 0.62245, -0.19321, 2266566
S2 = p_real * (1 - p_real)

ecm = lambda n, b: b**2 + S2 / n
tamanos = [1000, 10000, 100000, 1000000, n_digest]
tabla = pd.DataFrame({
    "n": tamanos,
    "recm_insesgado": [np.sqrt(ecm(n, 0.0)) for n in tamanos],
    "recm_sesgado":   [np.sqrt(ecm(n, sesgo)) for n in tamanos]})
print(tabla.round(5).to_string(index=False))
#>       n  recm_insesgado  recm_sesgado
#>    1000         0.01533       0.19382
#>   10000         0.00485       0.19327
#>  100000         0.00153       0.19322
#> 1000000         0.00048       0.19321
#> 2266566         0.00032       0.19321

# Tamano efectivo del sondeo sesgado: el n de un muestreo aleatorio simple con
# el mismo error cuadratico medio.
print(round(S2 / ecm(n_digest, sesgo), 2))
#> 6.3
