import warnings; warnings.filterwarnings('ignore')
import numpy as np, pandas as pd

print("\n###BLOQUE-P1###\n")
import numpy as np, pandas as pd   # las dos unicas dependencias del capitulo
# (Las salidas de cada bloque van juntas al final, en el orden de sus print.)

# Hansen-Hurwitz a mano: el estimador es un promedio de y/psi, y su varianza
# exacta sale de recorrer las 4 tiendas con sus probabilidades.
m2 = np.array([100, 200, 300, 1000])
ventas = np.array([11, 20, 24, 245])
psi = m2 / m2.sum()
t = ventas.sum()

est = ventas / psi                    # t_hat si la extraccion cae en cada tienda
V1 = (psi * (est - t)**2).sum()       # varianza exacta con n = 1
print("t/psi por tienda:", np.round(est, 1))
print(f"V(n=1) = {V1:.0f}   V_HH(n=2) = V/2 = {V1 / 2:.0f}")

# numpy usa otro generador que R: con la misma semilla sale OTRA muestra
# (en R, CD). Lo que coincide son las cifras exactas, 14 248 y 7 124.
rng = np.random.default_rng(2026)
s = rng.choice(4, size=2, replace=True, p=psi)
z = ventas[s] / psi[s]
print(f"muestra {s + 1} -> t_hat = {z.mean():.0f}, ee = {(z.var(ddof=1) / 2)**0.5:.0f}")
#> t/psi por tienda: [176. 160. 128. 392.]
#> V(n=1) = 14248   V_HH(n=2) = V/2 = 7124
#> muestra [2 4] -> t_hat = 276, ee = 116

print("\n###BLOQUE-P2###\n")
# Los dos metodos de seleccion, en Python puro. Acumulativo: un uniforme
# contra los tramos. Lahiri: rechazo contra x_max. (Otro generador que R:
# las frecuencias no son las de R, pero clavan las mismas psi.)
rng = np.random.default_rng(2026)     # su propia semilla: el bloque se repite igual
acum = np.cumsum(m2)
u = rng.uniform(0, m2.sum(), size=100000)
sel = np.searchsorted(acum, u)
print("frecuencias acumulativo:", np.round(np.bincount(sel) / 100000, 4))

x_max = m2.max()
cand = rng.integers(0, 4, size=300000)
acepta = rng.uniform(0, x_max, size=300000) <= m2[cand]
sel_lahiri = cand[acepta][:100000]
print("frecuencias Lahiri:     ", np.round(np.bincount(sel_lahiri) / 100000, 4))
print("psi teoricas:           ", np.round(psi, 4))
print(f"tasa de aceptacion Lahiri = {acepta.mean():.3f} (teorica {m2.mean() / x_max:.3f})")
#> frecuencias acumulativo: [0.0633 0.1262 0.1876 0.623 ]
#> frecuencias Lahiri:      [0.0634 0.1258 0.1896 0.6212]
#> psi teoricas:            [0.0625 0.125  0.1875 0.625 ]
#> tasa de aceptacion Lahiri = 0.400 (teorica 0.400)

print("\n###BLOQUE-P3###\n")
# El espacio de muestras del modulo 4 con bucles explicitos: las 6 parejas,
# su p(s) proporcional a m2_k + m2_l, las pi_k y el HT de cada pareja.
from itertools import combinations
muestras = list(combinations(range(4), 2))
p_s = np.array([m2[k] + m2[l] for k, l in muestras], dtype=float)
p_s /= p_s.sum()

pi_k = np.zeros(4)                    # suma de p(s) sobre las parejas con k
for (k, l), p in zip(muestras, p_s):
    pi_k[k] += p; pi_k[l] += p
print("pi_k:", np.round(pi_k, 4), " suma =", round(pi_k.sum(), 4))

ht = np.array([ventas[k] / pi_k[k] + ventas[l] / pi_k[l] for k, l in muestras])
print("HT de cada pareja:", np.round(ht, 1))
print(f"E(HT) = {(p_s * ht).sum():.2f}   V(HT) = {(p_s * (ht - t)**2).sum():.2f}")
print("cocientes y/pi:", np.round(ventas / pi_k, 1))
#> pi_k: [0.375  0.4167 0.4583 0.75  ]  suma = 2.0
#> HT de cada pareja: [ 77.3  81.7 356.  100.4 374.7 379. ]
#> E(HT) = 300.00   V(HT) = 15025.67
#> cocientes y/pi: [ 29.3  48.   52.4 326.7]

print("\n###BLOQUE-P3b###\n")
# La matriz pi_kl del modulo 4 y la varianza en forma SYG, con bucles
# explicitos. Usa muestras, p_s, pi_k y ht del bloque del modulo 4.
pi_kl = np.zeros((4, 4))
for (k, l), p in zip(muestras, p_s):
    pi_kl[k, l] += p; pi_kl[l, k] += p
np.fill_diagonal(pi_kl, pi_k)
print(np.round(pi_kl, 4))

d = ventas / pi_k
V_syg = 0.0
for k in range(4):
    for l in range(k + 1, 4):
        V_syg += (pi_k[k] * pi_k[l] - pi_kl[k, l]) * (d[k] - d[l])**2
print(f"V por SYG = {V_syg:.2f}   V enumerada = {(p_s * (ht - t)**2).sum():.2f}")
#> [[0.375  0.0625 0.0833 0.2292]
#>  [0.0625 0.4167 0.1042 0.25  ]
#>  [0.0833 0.1042 0.4583 0.2708]
#>  [0.2292 0.25   0.2708 0.75  ]]
#> V por SYG = 15025.67   V enumerada = 15025.67

print("\n###BLOQUE-P6###\n")
# El metodo de Sunter (Gutierrez, sec. 4.4.1), programado a mano: se recorre la
# lista de mayor a menor y se decide unidad por unidad. Si ya van e_k elegidas
# y las pi de las anteriores suman A_k, la unidad k entra con probabilidad
#   pi_k * (n - e_k) / (n - A_k).
# Es el algoritmo de TeachingSampling::S.piPS.
# Primero las cuatro tiendas, con n = 2. De mayor a menor pi van D, C, B y A.
# D entra seguro (umbral 1 * 2 / 2). Si despues no ha salido ninguna otra, ya
# va una elegida, e_k = 1, y el umbral de cada una es pi_k (2 - 1) / (2 - A_k):
pi_t = np.array([1, 1/2, 1/3, 1/6])                 # D, C, B, A
A_t = np.concatenate([[0], np.cumsum(pi_t)[:-1]])   # suma de las pi anteriores
print("umbrales de C, B y A:", np.round(pi_t[1:] * (2 - 1) / (2 - A_t[1:]), 4))

statepps = pd.read_csv("CSV data sets for SDA 3e/statepps.csv")
pob = statepps["pop2019"].to_numpy(dtype=float)
pi_s = 10 * pob / pob.sum()
while (pi_s > 1).any():                # California: se trunca en 1 y se reescala
    forzosa = pi_s >= 1
    pi_s[~forzosa] = (10 - forzosa.sum()) * pob[~forzosa] / pob[~forzosa].sum()
    pi_s[forzosa] = 1

def sunter(p, u):
    """Una muestra de Sunter con las pi p; u trae un uniforme por unidad."""
    n = round(p.sum())
    elegidas, acumulada, muestra = 0, 0.0, []
    for k in np.argsort(-p):           # de mayor a menor
        if u[k] < p[k] * (n - elegidas) / (n - acumulada):
            muestra.append(k)
            elegidas += 1
        acumulada += p[k]
    return muestra

rng = np.random.default_rng(2026)
s = sunter(pi_s, rng.uniform(size=51))
print("muestra:", ", ".join(statepps["state"].iloc[sorted(s)]))

# 20 000 muestras a la vez: se recorre la lista una sola vez con un vector.
B = 20000
elegidas, acumulada = np.zeros(B), 0.0
dentro = np.zeros((B, 51), dtype=bool)
for k in np.argsort(-pi_s):
    entra = rng.uniform(size=B) < pi_s[k] * (10 - elegidas) / (10 - acumulada)
    dentro[:, k] = entra
    elegidas += entra
    acumulada += pi_s[k]
print("tamanos de muestra que salen:", np.unique(dentro.sum(axis=1)))
print(f"max |frecuencia - pi| = {np.abs(dentro.mean(axis=0) - pi_s).max():.4f}")
#> umbrales de C, B y A: [0.5    0.6667 1.    ]
#> muestra: Alabama, California, Delaware, Florida, Maine, Minnesota, New Jersey, Tennessee, Texas, Washington
#> tamanos de muestra que salen: [10]
#> max |frecuencia - pi| = 0.0065

print("\n###BLOQUE-P4###\n")
# La distribucion EXACTA del n aleatorio de Poisson (Poisson-binomial),
# por programacion dinamica: empezar en "0 unidades con probabilidad 1" e
# incorporar los 51 estados uno por uno. Las pi son las del bloque de Sunter
# (modulo 5), con California forzosa. Este bloque no sortea: el sorteo de una
# muestra de Poisson esta en la pestana R.
x = statepps["pop2019"].to_numpy(dtype=float)
pi_st = pi_s
print(f"suma de pi = {pi_st.sum():.4f}   forzosas = {int((pi_st == 1).sum())}")

pn = np.array([1.0])
for p in pi_st:
    pn = np.concatenate([pn * (1 - p), [0.0]]) + np.concatenate([[0.0], pn * p])
n_vals = np.arange(len(pn))
E_n = (n_vals * pn).sum()
print(f"E(n) = {E_n:.2f}   de(n) = {((n_vals**2 * pn).sum() - E_n**2)**0.5:.2f}")
print(f"P(n = 10) = {pn[10]:.3f}   P(9 <= n <= 11) = {pn[9:12].sum():.3f}")
#> suma de pi = 10.0000   forzosas = 1
#> E(n) = 10.00   de(n) = 2.41
#> P(n = 10) = 0.164   P(9 <= n <= 11) = 0.466

print("\n###BLOQUE-P5###\n")
# Muestreo por importancia: la varianza exacta de HH para tres propuestas.
# La mision es que psi acompane a |y| — con una variable conocida de antemano.
y = statepps["counties"].to_numpy(dtype=float)
t_y = y.sum()
def V_wr(psi, n=10):
    return (psi * (y / psi - t_y)**2).sum() / n

psi_unif = np.full(51, 1 / 51)
psi_pop = x / x.sum()
psi_y = y / t_y
print(f"V uniforme    = {V_wr(psi_unif):.0f}")
print(f"V psi ~ pop   = {V_wr(psi_pop):.0f}   (corr(pop, counties) = {np.corrcoef(x, y)[0, 1]:.3f})")
print(f"V psi ~ y     = {V_wr(psi_y):.0f}")
#> V uniforme    = 557287
#> V psi ~ pop   = 963006   (corr(pop, counties) = 0.456)
#> V psi ~ y     = 0

print("\n###BLOQUE-P7###\n")
# EJERCICIO 5 en Python: las pi con inclusion forzosa, Poisson y Sunter.
import numpy as np                     # la solucion corre sola
x5 = np.array([62, 151, 76, 77, 80, 60, 194, 78, 74, 61], dtype=float)
p5 = 6 * x5 / x5.sum()
while (p5 > 1 + 1e-12).any():          # forzar las que pasan de 1 y repartir el resto
    forzosa = p5 >= 1 - 1e-12
    p5[forzosa] = 1
    p5[~forzosa] = (6 - forzosa.sum()) * x5[~forzosa] / x5[~forzosa].sum()
print("pi:", np.round(p5, 4))

eps = np.array([0.858, 0.698, 0.541, 0.320, 0.965, 0.497, 0.208, 0.006, 0.340, 0.206])
print("Poisson:", np.flatnonzero(eps < p5) + 1)

xi = np.array([0.322, 0.542, 0.032, 0.141, 0.453, 0.668, 0.174, 0.318, 0.691, 0.006])
elegidas, acumulada, muestra = 0, 0.0, []
for j, k in enumerate(np.argsort(-x5, kind="stable")):
    if xi[j] < p5[k] * (6 - elegidas) / (6 - acumulada):
        muestra.append(int(k) + 1)
        elegidas += 1
    acumulada += p5[k]
print("Sunter:", sorted(muestra))
#> pi: [0.4366 1.     0.5352 0.5423 0.5634 0.4225 1.     0.5493 0.5211 0.4296]
#> Poisson: [ 2  4  7  8  9 10]
#> Sunter: [1, 2, 5, 7, 8, 9]

print("\n###BLOQUE-P8###\n")
# EJERCICIO 6 en Python: el Poisson de Sarndal et al. (p. 117).
import numpy as np                     # la solucion corre sola
xs = np.array([54, 671, 28, 27, 29, 62, 42, 48, 33, 446, 12, 46], dtype=float)
ys = np.array([5246, 59877, 2208, 2546, 2903, 6850, 3773, 4055, 4014, 38945, 1162, 4852], dtype=float)
ps = 10 * xs / 8182
t_ht6 = (ys / ps).sum()
ee6 = np.sqrt(((1 - ps) * ys**2 / ps**2).sum())
print(f"t_HT = {t_ht6:.0f}, ee = {ee6:.0f}, cv = {ee6 / t_ht6:.3f}")
print(f"IC 95 %: [{t_ht6 - 1.96 * ee6:.0f}, {t_ht6 + 1.96 * ee6:.0f}]")
N_hat = (1 / ps).sum()
print(f"N_hat = {N_hat:.1f}, media HT = {t_ht6 / 284:.1f}, media Hajek = {t_ht6 / N_hat:.1f}")
print(f"total con la razon = {8182 * t_ht6 / (xs / ps).sum():.0f}")
#> t_HT = 945598, ee = 255587, cv = 0.270
#> IC 95 %: [444649, 1446548]
#> N_hat = 266.4, media HT = 3329.6, media Hajek = 3549.1
#> total con la razon = 787999

