import warnings; warnings.filterwarnings('ignore')
import numpy as np, pandas as pd

print("\n###BLOQUE-P1###\n")
# Los totales son de nueve cifras: sin fijar el formato, pandas los imprime en
# notacion cientifica y no hay quien los lea.
pd.set_option("display.float_format", lambda v: f"{v:,.4f}".replace(",", " "))

# El estimador de razon y su error estandar, escritos termino a termino. No
# hay ninguna funcion de encuestas aqui: la leccion es que la formula cabe en
# seis lineas y que el error estandar sale de los RESIDUOS, no de los y.
ag = pd.read_csv("CSV data sets for SDA 3e/agpop.csv")
sr = pd.read_csv("CSV data sets for SDA 3e/agsrs.csv")
N, n = len(ag), len(sr)
tx = ag["acres87"].sum()
y, x = sr["acres92"].to_numpy(float), sr["acres87"].to_numpy(float)

B = y.mean() / x.mean()
t_razon = B * tx
e = y - B * x                                  # residuos de la recta por el origen
s_e = np.sqrt((e ** 2).sum() / (n - 1))
ee = (tx / x.mean()) * np.sqrt(1 - n / N) * s_e / np.sqrt(n)
print(pd.Series({"B": B, "t_razon": t_razon, "s_e": s_e, "ee": ee}).round(4).to_string())
#> B                   0.9866
#> t_razon   950 520 496.1040
#> s_e            31 657.2182
#> ee          5 540 375.7938

print("\n###BLOQUE-P2###\n")
# Por que gana: la razon no estima la variabilidad de y, sino la de los
# residuos. La reduccion es exactamente lo que se gana en error estandar.
print(pd.Series({
    "sd_y": y.std(ddof=1),
    "sd_residuos": s_e,
    "razon_de_desviaciones": s_e / y.std(ddof=1),
    "veces_mas_eficiente": (y.std(ddof=1) / s_e) ** 2
}).round(4).to_string())
#> sd_y                    344 551.8948
#> sd_residuos              31 657.2182
#> razon_de_desviaciones         0.0919
#> veces_mas_eficiente         118.4578

print("\n###BLOQUE-P3###\n")
# El GREG escalar. Una sola linea de aritmetica; lo unico que cambia entre los
# tres estimadores del capitulo es de donde sale beta.
t_pi   = N * y.mean()
t_x_pi = N * x.mean()
greg = lambda beta: t_pi + beta * (tx - t_x_pi)

pos = x > 0                                     # 1/x_k pide x_k positivo
beta_razon = (y[pos] / x[pos] * x[pos]).sum() / x[pos].sum()      # = ybar/xbar
beta_homo  = (x[pos] * y[pos]).sum() / (x[pos] ** 2).sum()
beta_ols   = np.cov(x, y, ddof=1)[0, 1] / x.var(ddof=1)

print(pd.DataFrame({
    "modelo": ["expansion (beta = 0)", "razon (v_k = x_k)", "homocedastico (v_k = 1)",
               "diferencia (beta = 1)", "regresion (minimos cuadrados)"],
    "beta": [0.0, beta_razon, beta_homo, 1.0, beta_ols],
    "total": [greg(0.0), greg(beta_razon), greg(beta_homo), greg(1.0), greg(beta_ols)]
}).round(6).to_string(index=False))
#>                        modelo   beta            total
#>          expansion (beta = 0) 0.0000 916 927 109.6400
#>             razon (v_k = x_k) 0.9866 950 520 496.1040
#>       homocedastico (v_k = 1) 0.9913 950 682 899.1711
#>         diferencia (beta = 1) 1.0000 950 977 961.2200
#> regresion (minimos cuadrados) 0.9950 950 807 843.3434

print("\n###BLOQUE-P4###\n")
# La mediana no es lineal en los y_k, asi que no hay formula. Se construye la
# funcion de distribucion estimada con los pesos y se le pide el cuantil.
w = np.full(n, N / n)
orden = np.argsort(y)
F = np.cumsum(w[orden]) / w.sum()
# La tolerancia no es cosmetica: F vale exactamente p en el borde y el
# redondeo de cumsum()/sum() cae a un lado en R y al otro en Python. Sin ella,
# las dos pestanas de este capitulo publican cuantiles distintos.
cuantil = lambda p: y[orden][np.argmax(F >= p - 1e-9)]

real = np.sort(ag["acres92"].to_numpy())
print(pd.DataFrame({
    "p": [0.10, 0.25, 0.50, 0.75, 0.90],
    "estimado": [cuantil(p) for p in (0.10, 0.25, 0.50, 0.75, 0.90)],
    "real": [real[int(np.ceil(p * len(real))) - 1] for p in (0.10, 0.25, 0.50, 0.75, 0.90)]
}).to_string(index=False))
#>      p     estimado   real
#> 0.1000  41 290.0000  35387
#> 0.2500  87 298.0000  80902
#> 0.5000 196 701.0000 191486
#> 0.7500 374 920.0000 366927
#> 0.9000 657 906.0000 643762

