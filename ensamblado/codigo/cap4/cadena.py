import warnings; warnings.filterwarnings('ignore')
import numpy as np, pandas as pd

print("\n###BLOQUE-P1###\n")
# El estimador estratificado a mano, sin ninguna funcion de encuestas:
# cuatro medias, cuatro pesos W_h = N_h/N, y una suma ponderada.
pd.set_option("display.float_format", lambda x: f"{x:.4f}")
agpop   = pd.read_csv("CSV data sets for SDA 3e/agpop.csv")
agstrat = pd.read_csv("CSV data sets for SDA 3e/agstrat.csv")

N  = len(agpop)
Nh = agpop.groupby("region").size()          # tamanos del MARCO, no de la muestra
g  = agstrat.groupby("region")["acres92"]
nh, ybar_h, s2_h = g.size(), g.mean(), g.var()

Wh = Nh / N
ybar_str = (Wh * ybar_h).sum()
V_str = (Wh**2 * (1 - nh / Nh) * s2_h / nh).sum()
print(pd.DataFrame({"Wh": Wh, "ybar_h": ybar_h, "aporte": Wh * ybar_h}))
print(f"media = {ybar_str:.4f}   ee = {V_str**0.5:.4f}")
#>            Wh      ybar_h      aporte
#> region                               
#> NC     0.3424 300504.1553 102901.6828
#> NE     0.0715  97629.8095   6978.0890
#> S      0.4490 211315.0444  94878.9446
#> W      0.1371 662295.5122  90802.0488
#> media = 295560.7652   ee = 16379.8727

print("\n###BLOQUE-P2###\n")
# La asignacion de Neyman a mano: n_h proporcional a N_h * S_h. Las S_h son
# las de la POBLACION (en la practica, de un censo previo o un piloto).
Sh = agpop.groupby("region")["acres92"].std()
neyman = 300 * (Nh * Sh) / (Nh * Sh).sum()
tabla = pd.DataFrame({"Nh_Sh": (Nh * Sh / 1e6).round(1), "n_h": neyman.round(1),
                      "redondeado": neyman.round(0).astype(int)})
print(tabla)
print("suma =", int(tabla["redondeado"].sum()))
#>           Nh_Sh      n_h  redondeado
#> region                              
#> NC     286.0000  86.4000          86
#> NE      17.5000   5.3000           5
#> S      337.1000 101.8000         102
#> W      352.6000 106.5000         107
#> suma = 300

print("\n###BLOQUE-P3###\n")
# StratifiedKFold: el muestreo estratificado dentro de scikit-learn.
# Clase minoritaria (5 %): condados con mas de un millon de acres.
from sklearn.model_selection import KFold, StratifiedKFold

y = (agpop["acres92"] > 1_000_000).astype(int)
X = agpop[["acres87", "farms92"]]
print(f"proporcion de grandes: {y.mean():.4f}")

for nombre, cv in [("KFold          ", KFold(n_splits=5, shuffle=True, random_state=2026)),
                   ("StratifiedKFold", StratifiedKFold(n_splits=5, shuffle=True, random_state=2026))]:
    props = [y.iloc[prueba].mean() for _, prueba in cv.split(X, y)]
    print(nombre, np.round(props, 4))
#> proporcion de grandes: 0.0500
#> KFold           [0.0325 0.0519 0.0373 0.0683 0.0602]
#> StratifiedKFold [0.0503 0.0503 0.0503 0.0488 0.0504]

print("\n###BLOQUE-P4###\n")
# La misma proteccion al separar entrenamiento y prueba: stratify=y le pide
# a train_test_split que preserve la mezcla de clases en los dos trozos.
from sklearn.model_selection import train_test_split

_, _, _, y_prueba = train_test_split(X, y, test_size=0.2, random_state=2026)
_, _, _, y_prueba_estr = train_test_split(X, y, test_size=0.2, random_state=2026,
                                          stratify=y)
print(f"poblacion: {y.mean():.4f}")
print(f"prueba sin estratificar: {y_prueba.mean():.4f}")
print(f"prueba estratificada:    {y_prueba_estr.mean():.4f}")
#> poblacion: 0.0500
#> prueba sin estratificar: 0.0325
#> prueba estratificada:    0.0503
