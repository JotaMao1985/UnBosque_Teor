import warnings; warnings.filterwarnings('ignore')
import numpy as np, pandas as pd

print("\n###BLOQUE-P1###\n")
# El deff, calculado con las tres piezas a la vista. Python no tiene survey:
# hay que escribir la varianza del diseno a mano, y eso es justo la leccion.
nh = pd.read_csv("CSV data sets for SDA 3e/nhanes.csv")
nh = nh[(nh.wtmec2yr > 0) & (nh.bmxbmi > 0) & (nh.ridageyr >= 20)]
w, y = nh.wtmec2yr.to_numpy(), nh.bmxbmi.to_numpy()
n = len(y)

media = np.sum(w * y) / np.sum(w)
# Varianza del diseno: "ultimate cluster" — totales por PSU dentro de estrato
tot = nh.assign(z=w * (y - media)).groupby(["sdmvstra", "sdmvpsu"])["z"].sum()
V = 0.0
for h, g in tot.groupby(level=0):
    n_h = len(g)
    V += n_h / (n_h - 1) * np.sum((g.to_numpy() - g.mean())**2)
ee = np.sqrt(V) / np.sum(w)
ee_srs = y.std(ddof=1) / np.sqrt(n)
print(f"IMC medio = {media:.4f}   ee del diseno = {ee:.6f}   ee ingenuo = {ee_srs:.6f}")
print(f"deff = {(ee/ee_srs)**2:.4f}   n efectivo = {n/(ee/ee_srs)**2:.1f} de {n}")
print(f"deff de Kish (solo pesos) = {1 + w.var(ddof=1)/w.mean()**2:.4f}")
#> IMC medio = 29.3891   ee del diseno = 0.253197   ee ingenuo = 0.096247
#> deff = 6.9206   n efectivo = 781.1 de 5406
#> deff de Kish (solo pesos) = 1.8930

print("\n###BLOQUE-P2###\n")
# El jackknife estratificado, explicito: quitar una PSU, reponderar su
# estrato, recalcular. Doce lineas, y sirve para cualquier estadistico.
psus = nh[["sdmvstra", "sdmvpsu"]].drop_duplicates().to_numpy()
reps = []
for h, p in psus:
    w2 = w.copy()
    fuera = (nh.sdmvstra == h) & (nh.sdmvpsu == p)
    dentro = (nh.sdmvstra == h) & ~fuera
    n_h = ((psus[:, 0] == h)).sum()
    w2[fuera.to_numpy()] = 0
    w2[dentro.to_numpy()] *= n_h / (n_h - 1)
    reps.append(np.sum(w2 * y) / np.sum(w2))
reps = np.array(reps)

v_jk = 0.0
for h in np.unique(psus[:, 0]):
    idx = psus[:, 0] == h
    v_jk += (idx.sum() - 1) / idx.sum() * np.sum((reps[idx] - media)**2)
print(f"{len(reps)} replicas   ee jackknife = {np.sqrt(v_jk):.6f}")
print(f"(la linealizacion de arriba daba {ee:.6f})")
#> 30 replicas   ee jackknife = 0.253259
#> (la linealizacion de arriba daba 0.253197)

print("\n###BLOQUE-P3###\n")
# El raking (IPFP) desnudo: ajustar filas, ajustar columnas, repetir. Se ve
# que cada paso rompe un poco el anterior y que aun asi converge.
A = np.array([[41.319, 40.612, 29.097],       # hombres 20-39 / 40-59 / 60+
              [42.493, 42.831, 35.434]])      # mujeres, en millones
total = A.sum()
marg_filas = np.array([0.49, 0.51]) * total   # sexo objetivo
marg_cols = np.array([0.34, 0.34, 0.32]) * total  # edad objetivo

def error(M):
    return max(np.abs(M.sum(1) - marg_filas).max() / marg_filas.max(),
               np.abs(M.sum(0) - marg_cols).max() / marg_cols.max())

print(f"iter 0: error = {error(A):.3e}")
for k in range(1, 6):
    A = A * (marg_filas / A.sum(1))[:, None]   # cuadrar filas
    A = A * (marg_cols / A.sum(0))[None, :]    # cuadrar columnas
    print(f"iter {k}: error = {error(A):.3e}")
print("tabla final (millones):"); print(np.round(A, 3))
#> iter 0: error = 1.223e-01
#> iter 1: error = 3.220e-03
#> iter 2: error = 4.360e-06
#> iter 3: error = 5.905e-09
#> iter 4: error = 7.996e-12
#> iter 5: error = 1.106e-14
#> tabla final (millones):
#> [[39.848 39.352 34.375]
#>  [38.959 39.455 39.797]]

print("\n###BLOQUE-P4###\n")
# El error mas caro, simulado desde cero: 200 conglomerados de 40 unidades
# con correlacion intraclase 0.15, y 2 000 muestras de 20 conglomerados.
rng = np.random.default_rng(2026)
NI, Mi, rho, R, n_upm = 200, 40, 0.15, 2000, 20
efecto = rng.normal(0, np.sqrt(rho), NI)
pobl = efecto[:, None] + rng.normal(0, np.sqrt(1 - rho), (NI, Mi))
mu = pobl.mean()

from scipy.stats import t as t_dist
cub_ing = cub_dis = 0
for _ in range(R):
    ups = rng.choice(NI, n_upm, replace=False)
    dat = pobl[ups]
    ybar = dat.mean()
    ee_ing = dat.std(ddof=1) / np.sqrt(dat.size)          # ignora el diseno
    medias = dat.mean(1)
    ee_dis = np.sqrt((1 - n_upm/NI) * medias.var(ddof=1) / n_upm)
    cub_ing += abs(ybar - mu) <= 1.96 * ee_ing
    cub_dis += abs(ybar - mu) <= t_dist.ppf(0.975, n_upm - 1) * ee_dis
print(f"cobertura del IC ingenuo: {cub_ing/R:.3f}   del IC del diseno: {cub_dis/R:.3f}")
print(f"deff teorico = 1 + (m-1)*rho = {1 + (Mi-1)*rho:.2f}")
#> cobertura del IC ingenuo: 0.545   del IC del diseno: 0.947
#> deff teorico = 1 + (m-1)*rho = 6.85
# El generador de Python no es el de R, asi que la simulacion da 0.545 donde
# la de R (bloque R13) daba 0.563. Las dos cuentan la misma historia: un
# intervalo "del 95 %" que ignora los conglomerados cubre poco mas de la mitad.
