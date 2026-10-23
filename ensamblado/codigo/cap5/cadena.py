import warnings; warnings.filterwarnings('ignore')
import numpy as np, pandas as pd

print("\n###BLOQUE-P1###\n")
import pandas as pd   # lo usan todos los bloques Python; el modulo 10, ademas, scikit-learn

# El estimador de conglomerados a mano: totales por suite, nada mas.
gpa = pd.read_csv("CSV data sets for SDA 3e/gpa.csv")
t_i = gpa.groupby("suite")["gpa"].sum()
print(t_i.round(2).to_string())

N, n, M = 100, 5, 4
ybar = t_i.sum() / (n * M)
V = (1 - n / N) * t_i.var() / (n * M**2)     # var() de pandas ya divide n-1
print(f"media = {ybar:.4f}   ee = {V**0.5:.4f}")
#> suite
#> 1    12.16
#> 2    11.36
#> 3     8.96
#> 4    12.96
#> 5    11.08
#> media = 2.8260   ee = 0.1637

print("\n###BLOQUE-P2###\n")
# La ICC por ANOVA, explicita: la varianza DENTRO de las clases contra la
# total, y el deff que implica.
algebra = pd.read_csv("CSV data sets for SDA 3e/algebra.csv")
K = len(algebra)
n = algebra["class"].nunique()
ssw = algebra.groupby("class")["score"].apply(lambda y: ((y - y.mean())**2).sum()).sum()
msw = ssw / (K - n)
icc = 1 - msw / algebra["score"].var()        # R_a^2 de Lohr; var() divide n-1
Mbar = algebra.groupby("class")["Mi"].first().mean()
print(f"R_a^2 = {icc:.4f}   Mbar = {Mbar:.2f}")
print(f"deff teorico = 1 + (Mbar-1)*R_a^2 = {1 + (Mbar - 1) * icc:.3f}")
#> R_a^2 = 0.0396   Mbar = 24.92
#> deff teorico = 1 + (Mbar-1)*R_a^2 = 1.948

print("\n###BLOQUE-P3###\n")
# La varianza de dos etapas en schools: sus dos sumandos, y el aporte de cada
# etapa, que NO es lo mismo.
schools = pd.read_csv("CSV data sets for SDA 3e/schools.csv")
g = schools.groupby("schoolid")
Mi, ybar_i, s2_i = g["Mi"].first(), g["math"].mean(), g["math"].var()
t_i = Mi * ybar_i

N, n, m = 75, 10, 20
total = N / n * t_i.sum()
V_entre = N**2 * (1 - n / N) * t_i.var() / n                 # sumando 1
V_dentro = N / n * (Mi**2 * (1 - m / Mi) * s2_i / m).sum()   # sumando 2
V = V_entre + V_dentro
print(f"total = {total:.1f}   ee = {V**0.5:.1f}")
print(f"sumandos: {100 * V_entre / V:.1f} % y {100 * V_dentro / V:.1f} %")

# El sumando 1 usa totales ESTIMADOS: su esperanza trae parte de la varianza
# de la etapa 2 (Lohr, ec. 5.28). Separadas sin sesgo, las dos etapas:
V2 = N / n * V_dentro
V1 = V - V2
print(f"etapa 1: {100 * V1 / V:.1f} %   etapa 2: {100 * V2 / V:.1f} %")

# Lo que compra cada decision: censar las escuelas quita la etapa 2 entera;
# pasar a m = 40 estudiantes, solo una parte.
V2_40 = (N / n)**2 * (Mi**2 * (1 - 40 / Mi) * s2_i / 40).sum()
print(f"censar recorta el {100 * V2 / V:.1f} %; m = 40, el {100 * (V2 - V2_40) / V:.1f} %")
#> total = 572116.1   ee = 51899.8
#> sumandos: 99.2 % y 0.8 %
#> etapa 1: 93.9 %   etapa 2: 6.1 %
#> censar recorta el 6.1 %; m = 40, el 3.3 %

print("\n###BLOQUE-P4###\n")
# La leccion de conglomerados en machine learning: si los datos vienen en
# grupos, los pliegues deben respetar los grupos. KFold corriente parte las
# clases de algebra por la mitad y el modelo "ve" en entrenamiento a los
# companeros de los estudiantes de prueba: fuga de informacion intra-grupo.
from sklearn.model_selection import KFold, GroupKFold

X = algebra[["Mi"]]; grupos = algebra["class"]
def clases_partidas(cv):
    partidas = 0
    for entren, prueba in cv.split(X, groups=grupos):
        # una clase esta "partida" si tiene filas en los dos lados a la vez
        partidas += len(set(grupos.iloc[prueba]) & set(grupos.iloc[entren]))
    return partidas

kf = KFold(n_splits=4, shuffle=True, random_state=2026)
print("clases partidas entre entrenamiento y prueba:")
print(f"  KFold corriente: {clases_partidas(kf)} (de 12 clases x 4 pliegues)")
print(f"  GroupKFold:      {clases_partidas(GroupKFold(n_splits=4))}")
#> clases partidas entre entrenamiento y prueba:
#>   KFold corriente: 48 (de 12 clases x 4 pliegues)
#>   GroupKFold:      0
