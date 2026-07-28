import warnings; warnings.filterwarnings('ignore')
import numpy as np, pandas as pd

print("\n###BLOQUE-P1###\n")
# La formula del sesgo de no respuesta, con las tres piezas a la vista. No
# hace falta ningun paquete de encuestas: es una media ponderada.
pd.set_option("display.width", 100)
te = pd.read_csv("CSV data sets for SDA 3e/teachers.csv").replace(-9, np.nan)
mi = pd.read_csv("CSV data sets for SDA 3e/teachmi.csv")
nr = pd.read_csv("CSV data sets for SDA 3e/teachnr.csv").replace(-9, np.nan)

teL = te[te.dist == "large"]; miL = mi[mi.dist == "large"]
M = miL.popteach.sum(); MR = miL.ssteach.sum(); R = MR / M
yR = teL.hrwork.mean(); yNR = nr.hrwork.mean()

sesgo = (1 - R) * (yR - yNR)
print(f"tasa de respuesta R = {MR}/{M} = {R:.6f}")
print(f"ybar_R = {yR:.6f}   ybar_NR = {yNR:.6f}   brecha = {yR - yNR:.6f}")
print(f"sesgo = (1 - R)(ybar_R - ybar_NR) = {sesgo:.6f} horas")
print(f"estimador de dos fases = {R * yR + (1 - R) * yNR:.6f}")

# El sesgo NO contiene a n. El error estandar si. Esa es toda la leccion.
sd = teL.hrwork.std(ddof=1)
print()
print("     n        ee     sesgo   raiz(ECM)")
for n in [25, 100, 400, 1600, 6400, 25600]:
    ee = sd / np.sqrt(n)
    print(f"{n:6d}  {ee:8.4f}  {abs(sesgo):8.4f}  {np.sqrt(ee**2 + sesgo**2):8.4f}")
#> tasa de respuesta R = 250/628 = 0.398089
#> ybar_R = 34.632996   ybar_NR = 36.463462   brecha = -1.830466
#> sesgo = (1 - R)(ybar_R - ybar_NR) = -1.101777 horas
#> estimador de dos fases = 35.734773
#>
#>      n        ee     sesgo   raiz(ECM)
#>     25    0.6953    1.1018    1.3028
#>    100    0.3477    1.1018    1.1553
#>    400    0.1738    1.1018    1.1154
#>   1600    0.0869    1.1018    1.1052
#>   6400    0.0435    1.1018    1.1026
#>  25600    0.0217    1.1018    1.1020

print("\n###BLOQUE-P2###\n")
# El ajuste por clases de respuesta, escrito entero: propension por clase,
# peso corregido, media ponderada. Tres lineas de aritmetica.
d0 = 245 / 23                                  # peso de diseno: 245 escuelas / 23
miL = miL.assign(clase=pd.qcut(miL.popteach, 3, labels=False))
tasa_cl = (miL.groupby("clase").ssteach.sum() / miL.groupby("clase").popteach.sum())
print("propension estimada por clase de tamano:")
print(tasa_cl.round(6).to_string())

clase = teL.school.map(miL.set_index("school").clase)
w_sin = np.full(len(teL), d0)
w_cl = d0 / clase.map(tasa_cl).to_numpy()
y = teL.hrwork.to_numpy()
ok = ~np.isnan(y)

def media(w):
    return np.sum(w[ok] * y[ok]) / np.sum(w[ok])

def kish(w):
    return len(w[ok]) * np.sum(w[ok]**2) / np.sum(w[ok])**2

print(f"\nsin ajustar        {media(w_sin):.6f}   deff de Kish {kish(w_sin):.4f}")
print(f"ajustado por clase {media(w_cl):.6f}   deff de Kish {kish(w_cl):.4f}")
print(f"dos fases (verdad) {R * yR + (1 - R) * yNR:.6f}")
# El ajuste mueve la estimacion 0,27 horas... en direccion CONTRARIA a la
# verdad conocida. Ponderar solo corrige si el mecanismo es MAR.
#> propension estimada por clase de tamano:
#> clase
#> 0    0.382353
#> 1    0.550802
#> 2    0.302583
#>
#> sin ajustar        34.632996   deff de Kish 1.0000
#> ajustado por clase 34.367738   deff de Kish 1.0654
#> dos fases (verdad) 35.734773

print("\n###BLOQUE-P3###\n")
# Hot-deck: para cada faltante se sortea un DONANTE real de su misma clase y
# se copia su valor. Nunca produce un valor que nadie tenga.
im = pd.read_csv("CSV data sets for SDA 3e/impute.csv").replace(-99, np.nan)
im["grupo"] = np.where(im.age < 35, "joven", "mayor") + "-" + im.gender
falta = im.education.isna()
print(f"faltan {falta.sum()} de {len(im)} valores de education")

rng = np.random.default_rng(2026)
imp = im.education.to_numpy(dtype=float).copy()
for i in np.where(falta)[0]:
    cand = np.where((~falta) & (im.grupo == im.grupo.iloc[i]))[0]
    if len(cand) == 0:
        cand = np.where(~falta)[0]
    j = rng.choice(cand)
    imp[i] = im.education.iloc[j]
    print(f"  persona {im.person.iloc[i]:2d} (grupo {im.grupo.iloc[i]}) "
          f"<- donante {im.person.iloc[j]:2d}, valor {imp[i]:.0f}")
# El generador de numeros aleatorios de numpy no es el de R: los donantes
# concretos difieren de los del bloque de R aunque la semilla se llame igual.
# Lo que no cambia es el procedimiento ni sus propiedades.
print(f"\nmedia con casos completos {im.education.mean():.4f}"
      f"   con hot-deck {imp.mean():.4f}")
#> faltan 3 de 20 valores de education
#>   persona  2 (grupo mayor-F) <- donante 18, valor 10
#>   persona  4 (grupo joven-F) <- donante 12, valor 12
#>   persona  6 (grupo mayor-F) <- donante  9, valor 13
#>
#> media con casos completos 12.7059   con hot-deck 12.5500

print("\n###BLOQUE-P4###\n")
# Las reglas de Rubin, con las dos varianzas separadas. U es la incertidumbre
# de siempre; B es la que existe SOLO porque hubo que imputar.
obs = ~falta
X = np.column_stack([np.ones(obs.sum()), im.age[obs], (im.gender[obs] == "M").astype(float)])
beta, *_ = np.linalg.lstsq(X, im.education[obs].to_numpy(), rcond=None)
resid = im.education[obs].to_numpy() - X @ beta
sigma = np.sqrt(np.sum(resid**2) / (obs.sum() - X.shape[1]))
Xf = np.column_stack([np.ones(falta.sum()), im.age[falta],
                      (im.gender[falta] == "M").astype(float)])

m = 5
rng = np.random.default_rng(2026)
qs, us = [], []
for b in range(m):
    y = im.education.to_numpy(dtype=float).copy()
    y[falta] = Xf @ beta + rng.normal(0, sigma, falta.sum())
    qs.append(y.mean()); us.append(y.var(ddof=1) / len(y))
qs, us = np.array(qs), np.array(us)

Q, U, B = qs.mean(), us.mean(), qs.var(ddof=1)
T = U + (1 + 1 / m) * B
print(f"sigma del modelo = {sigma:.6f}")
print(f"Q (media de las m estimaciones) = {Q:.6f}")
print(f"U (varianza DENTRO de cada imputacion) = {U:.6f}")
print(f"B (varianza ENTRE imputaciones)        = {B:.6f}")
print(f"T = U + (1 + 1/m) B = {T:.6f}   ee = {np.sqrt(T):.6f}")
print(f"ee si se ignora B   = {np.sqrt(U):.6f}   inflacion = {np.sqrt(T/U):.4f}")
print(f"fraccion de informacion perdida = {(1 + 1/m) * B / T:.6f}")
# Ignorar B es exactamente lo que hace quien imputa una vez y sigue como si
# nada: publica un intervalo mas estrecho de lo que sus datos permiten.
# Las cifras no coinciden con las del bloque de R por lo dicho en P3: son
# imputaciones distintas extraidas de la misma distribucion. La conclusion
# -que T supera a U, y por cuanto- es la misma en las dos.
#> sigma del modelo = 2.528224
#> Q (media de las m estimaciones) = 12.534491
#> U (varianza DENTRO de cada imputacion) = 0.324339
#> B (varianza ENTRE imputaciones)        = 0.040450
#> T = U + (1 + 1/m) B = 0.372879   ee = 0.610638
#> ee si se ignora B   = 0.569507   inflacion = 1.0722
#> fraccion de informacion perdida = 0.130177
