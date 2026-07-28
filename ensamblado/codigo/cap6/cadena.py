import warnings; warnings.filterwarnings('ignore')
import numpy as np, pandas as pd

print("\n###BLOQUE-P1###\n")
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

rng = np.random.default_rng(2026)
s = rng.choice(4, size=2, replace=True, p=psi)
z = ventas[s] / psi[s]
print(f"muestra {s + 1} -> t_hat = {z.mean():.0f}, ee = {(z.var(ddof=1) / 2)**0.5:.0f}")
#> t/psi por tienda: [176. 160. 128. 392.]
#> V(n=1) = 14248   V_HH(n=2) = V/2 = 7124
#> muestra [2 4] -> t_hat = 276, ee = 116

print("\n###BLOQUE-P2###\n")
# Los dos metodos de seleccion, en Python puro. Acumulativo: un uniforme
# contra los tramos. Lahiri: rechazo contra M_max.
acum = np.cumsum(m2)
u = rng.uniform(0, m2.sum(), size=100000)
sel = np.searchsorted(acum, u)
print("frecuencias acumulativo:", np.round(np.bincount(sel) / 100000, 4))

M_max = m2.max()
cand = rng.integers(0, 4, size=300000)
acepta = rng.uniform(0, M_max, size=300000) <= m2[cand]
sel_lahiri = cand[acepta][:100000]
print("frecuencias Lahiri:     ", np.round(np.bincount(sel_lahiri) / 100000, 4))
print("psi teoricas:           ", np.round(psi, 4))
print(f"tasa de aceptacion Lahiri = {acepta.mean():.3f} (teorica {m2.mean() / M_max:.3f})")
#> frecuencias acumulativo: [0.0633 0.1262 0.1876 0.623 ]
#> frecuencias Lahiri:      [0.0631 0.1271 0.1869 0.6229]
#> psi teoricas:            [0.0625 0.125  0.1875 0.625 ]
#> tasa de aceptacion Lahiri = 0.400 (teorica 0.400)

print("\n###BLOQUE-P3###\n")
# El espacio de muestras del modulo 4, con la matriz pi_kl y el SYG
# calculados con bucles explicitos — la version transparente del calculo
# que R hizo con survey y formulas.
from itertools import combinations
muestras = list(combinations(range(4), 2))
p_s = np.array([m2[i] + m2[j] for i, j in muestras], dtype=float)
p_s /= p_s.sum()

pi = np.zeros(4)
pi_kl = np.zeros((4, 4))
for (i, j), p in zip(muestras, p_s):
    pi[i] += p; pi[j] += p
    pi_kl[i, j] += p; pi_kl[j, i] += p
np.fill_diagonal(pi_kl, pi)
print("pi_k:", np.round(pi, 4), " suma =", pi.sum())

ht = np.array([ventas[i] / pi[i] + ventas[j] / pi[j] for i, j in muestras])
V_enum = (p_s * (ht - t)**2).sum()

d = ventas / pi
V_syg = 0.0
for k in range(4):
    for l in range(k + 1, 4):
        V_syg += (pi[k] * pi[l] - pi_kl[k, l]) * (d[k] - d[l])**2
print(f"V por enumeracion = {V_enum:.2f}   V por SYG = {V_syg:.2f}")
#> pi_k: [0.375  0.4167 0.4583 0.75  ]  suma = 2.0
#> V por enumeracion = 15025.67   V por SYG = 15025.67

print("\n###BLOQUE-P4###\n")
# La distribucion EXACTA del n aleatorio de Poisson (Poisson-binomial),
# por programacion dinamica: empezar en "0 unidades con probabilidad 1" e
# incorporar los 51 estados uno por uno.
statepps = pd.read_csv("CSV data sets for SDA 3e/statepps.csv")
x = statepps["pop2019"].to_numpy(dtype=float)
forzosa = np.zeros(51, dtype=bool)
while True:                            # California: se trunca en 1 y se reescala
    pi_st = np.ones(51)
    pi_st[~forzosa] = (10 - forzosa.sum()) * x[~forzosa] / x[~forzosa].sum()
    nuevas = (~forzosa) & (pi_st >= 1)
    if not nuevas.any():
        break
    forzosa |= nuevas
print(f"suma de pi = {pi_st.sum():.4f}   forzosas = {int(forzosa.sum())}")

pn = np.array([1.0])
for p in pi_st:
    pn = np.concatenate([pn * (1 - p), [0.0]]) + np.concatenate([[0.0], pn * p])
n_vals = np.arange(len(pn))
print(f"E(n) = {(n_vals * pn).sum():.2f}   de(n) = {((n_vals**2 * pn).sum() - 100)**0.5:.2f}")
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
