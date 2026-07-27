import warnings; warnings.filterwarnings('ignore')
import numpy as np, pandas as pd

print("\n###BLOQUE-P1###\n")
from itertools import combinations

y = np.array([14, 18, 27, 33, 58])
x = np.array([1, 1, 2, 2, 4])
N, n = 5, 2

muestras = list(combinations(range(N), n))       # las 10 muestras posibles
p_mas = np.full(len(muestras), 1 / len(muestras))
p_est = np.array([1/6 if sum(k <= 2 for k in s) == 1 else 0.0 for s in muestras])
p_des = np.array([x[list(s)].sum() for s in muestras], dtype=float)
p_des /= p_des.sum()

print(pd.DataFrame({"muestra": [f"{a+1},{b+1}" for a, b in muestras],
                    "MAS": p_mas, "Estratificado": p_est,
                    "Desigual": p_des}).round(4).to_string(index=False))
#> muestra  MAS  Estratificado  Desigual
#>     1,2  0.1         0.0000     0.050
#>     1,3  0.1         0.0000     0.075
#>     1,4  0.1         0.1667     0.075
#>     1,5  0.1         0.1667     0.125
#>     2,3  0.1         0.0000     0.075
#>     2,4  0.1         0.1667     0.075
#>     2,5  0.1         0.1667     0.125
#>     3,4  0.1         0.1667     0.100
#>     3,5  0.1         0.1667     0.150
#>     4,5  0.1         0.0000     0.150

print("\n###BLOQUE-P2###\n")
def inclusion1(ps):
    return np.array([sum(p for s, p in zip(muestras, ps) if k in s) for k in range(N)])

def inclusion2(ps):
    m = np.zeros((N, N))
    for s, p in zip(muestras, ps):
        a, b = s
        m[a, b] += p
        m[b, a] = m[a, b]
    np.fill_diagonal(m, inclusion1(ps))
    return m

pi_des = inclusion1(p_des)
print("pi_k         =", np.round(pi_des, 4))
print("suma         =", round(pi_des.sum(), 6), " (tiene que dar n =", n, ")")
print("pi_kl fila 1 =", np.round(inclusion2(p_des)[0], 4))
#> pi_k         = [0.325 0.325 0.4   0.4   0.55 ]
#> suma         = 2.0  (tiene que dar n = 2 )
#> pi_kl fila 1 = [0.325 0.05  0.075 0.075 0.125]

print("\n###BLOQUE-P3###\n")
obs = [2, 4]                              # las unidades 3 y 5 (base 0 en Python)
pesos = 1 / pi_des[obs]
print("pesos d_k =", np.round(pesos, 4))
print("t_HT      =", round((y[obs] * pesos).sum(), 4))

# Esperanza exacta: se recorren las 10 muestras, no se simula
t_ht = np.array([(y[list(s)] / pi_des[list(s)]).sum() for s in muestras])
t_exp = np.array([N * y[list(s)].mean() for s in muestras])
print("E(t_HT)        =", round(float(p_des @ t_ht), 4))
print("E(N * y_barra) =", round(float(p_des @ t_exp), 4), " frente al total", int(y.sum()))
#> pesos d_k = [2.5    1.8182]
#> t_HT      = 172.9545
#> E(t_HT)        = 150.0
#> E(N * y_barra) = 165.75  frente al total 150

print("\n###BLOQUE-P4###\n")
from scipy.stats import t as t_dist

agpop = pd.read_csv("CSV data sets for SDA 3e/agpop.csv")
agsrs = pd.read_csv("CSV data sets for SDA 3e/agsrs.csv")

N_marco = len(agpop)
n_srs = len(agsrs)
ybar = agsrs["acres92"].mean()
s2 = agsrs["acres92"].var(ddof=1)
ee = np.sqrt((1 - n_srs / N_marco) * s2 / n_srs)
tq = t_dist.ppf(0.975, n_srs - 1)         # el mismo cuantil t que usa survey
print(f"media = {ybar:.4f}")
print(f"EE    = {ee:.4f}   (fpc = {1 - n_srs/N_marco:.4f})")
print(f"IC95  = [{ybar - tq*ee:.1f}, {ybar + tq*ee:.1f}]")
#> media = 297897.0467
#> EE    = 18898.4344   (fpc = 0.9025)
#> IC95  = [260706.3, 335087.8]

print("\n###BLOQUE-P5###\n")
from scipy.stats import norm

pob = agpop["acres92"].to_numpy()      # marco completo de Lohr: los 3078
z = norm.ppf(0.975)
S, media_pob, N_pob = pob.std(ddof=1), pob.mean(), len(pob)
e = 0.10 * media_pob
n0 = z**2 * S**2 / e**2
n_final = int(np.ceil(n0 / (1 + n0 / N_pob)))
print(f"margen = {e:.2f}   n0 = {n0:.2f}   n = {n_final}")
#> margen = 30667.70   n0 = 736.67   n = 595

print("\n###BLOQUE-P6###\n")
rng = np.random.default_rng(2026)
pi0 = 0.05
dentro = rng.random(N_pob) < pi0
v_ht = (pob.astype(float)**2).sum() * (1 - pi0) / pi0   # forma cerrada del Bernoulli
print(f"n esperado = {N_pob * pi0:.1f}   n obtenido = {dentro.sum()}")
print(f"t_HT = {pob[dentro].sum() / pi0 / 1e6:.3f} millones   verdadero = {pob.sum() / 1e6:.3f}")
print(f"CV teorico de t_HT = {np.sqrt(v_ht) / pob.sum():.4f}")
# El sorteo NO coincide con el de R: los generadores son distintos. Lo que si
# coincide, porque no depende del sorteo, es el CV teorico: 0.1342 en los dos.
#> n esperado = 153.9   n obtenido = 138
#> t_HT = 850.013 millones   verdadero = 943.952
#> CV teorico de t_HT = 0.1342
