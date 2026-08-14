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

print("\n###BLOQUE-PR1###\n")
# agpop: los 3078 condados agricolas de EE.UU. (censo agricola de 1992).
# Es la POBLACION del curso, y como esta entera se puede comprobar cualquier
# estimacion contra el valor verdadero. Fuera de un aula eso no pasa nunca.
agpop = pd.read_csv("CSV data sets for SDA 3e/agpop.csv")

# Las cuatro piezas del marco conceptual, sobre este archivo:
#   poblacion objetivo  -> los condados agricolas de EE.UU.
#   marco muestral      -> la lista de 3078 filas de este archivo
#   unidad              -> un condado (una fila)
#   variable de interes -> acres92, la superficie sembrada en 1992
print(pd.Series({"condados": len(agpop), "variables": agpop.shape[1],
                 "estados": agpop["state"].nunique()}).to_string())
#> condados     3078
#> variables      15
#> estados        50
print(agpop[["county", "state", "acres92", "region"]].head(3).to_string(index=False))
#>                county state  acres92 region
#> ALEUTIAN ISLANDS AREA    AK   683533      W
#>        ANCHORAGE AREA    AK    47146      W
#>        FAIRBANKS AREA    AK   141338      W

print("\n###BLOQUE-PR2###\n")
# Lohr codifica el dato faltante como -99. No es un valor pequeno: es un
# NO-VALOR disfrazado de numero, y pandas lo promedia sin protestar.
print(pd.Series({v: int((agpop[v] == -99).sum())
                 for v in ["acres92", "acres87", "acres82"]}).to_string())
#> acres92    19
#> acres87    23
#> acres82    17

# Que le hace a la media. La decision de este material es usar el marco
# completo de Lohr, N = 3078, sin excluir nada: es una poblacion perfectamente
# valida que contiene 19 codigos -99. Lo que NO es, es la superficie media real.
completo = agpop["acres92"].mean()
validos  = agpop.loc[agpop["acres92"] != -99, "acres92"].mean()
print(pd.Series({"marco_completo": completo, "solo_validos": validos,
                 "diferencia_pct": 100 * (validos / completo - 1)}).round(4).to_string())
#> marco_completo    306676.9714
#> solo_validos      308582.4122
#> diferencia_pct         0.6213

print("\n###BLOQUE-PR3###\n")
# Dos encuestas sobre el mismo item -"soy mas inteligente que la persona
# promedio"- en la misma poblacion. Una es telefonica por marcacion aleatoria
# (1838 entrevistas de 79014 numeros); la otra es un panel de voluntarios de
# Mechanical Turk (983 personas pagadas a 0,25 dolares).
tel    = pd.read_csv("CSV data sets for SDA 3e/intelltel.csv")
online = pd.read_csv("CSV data sets for SDA 3e/intellonline.csv")
pesos  = pd.read_csv("CSV data sets for SDA 3e/intellwts.csv")

# Las dos encuestas se calibraron al censo de 2010 sobre las mismas 8 celdas
# de sexo x edad x raza. Eso permite RECUPERAR el censo desde los pesos, y por
# dos caminos independientes que tienen que coincidir.
censo_tel    = pesos["tel_n"]    * pesos["tel_wgt"]
censo_online = pesos["online_n"] * pesos["online_wgt"]
print(pd.Series({"suma_tel": censo_tel.sum(), "suma_online": censo_online.sum(),
                 "discrepancia_maxima": (censo_tel - censo_online).abs().max()
                 }).round(3).to_string())
#> suma_tel               750.124
#> suma_online            749.792
#> discrepancia_maxima      0.280

print("\n###BLOQUE-PR4###\n")
# La composicion demografica de cada muestra frente a la del censo. Los
# porcentajes se redondean ANTES de restar, igual que en la pestana de R: si se
# restara antes de redondear, la ultima cifra de sesgo_online no coincidiria.
comp = pd.DataFrame({
    "celda":  pesos["sex"] + " " + pesos["agegroup"] + " " + pesos["race"],
    "censo":  (100 * censo_tel / censo_tel.sum()).round(1),
    "telef":  (100 * pesos["tel_n"] / pesos["tel_n"].sum()).round(1),
    "online": (100 * pesos["online_n"] / pesos["online_n"].sum()).round(1)})
comp["sesgo_online"] = comp["online"] - comp["censo"]
print(comp.to_string(index=False))
#>                 celda  censo  telef  online  sesgo_online
#> Female Young Nonwhite    7.6    2.6    11.8           4.2
#>    Female Young White   18.1    6.2    31.7          13.6
#>   Female Old Nonwhite    7.6    6.1     1.4          -6.2
#>      Female Old White   18.1   47.8    13.7          -4.4
#>   Male Young Nonwhite    7.2    1.5     8.2           1.0
#>      Male Young White   17.1    5.1    25.8           8.7
#>     Male Old Nonwhite    7.2    4.8     0.8          -6.4
#>        Male Old White   17.1   26.0     6.4         -10.7

# La edad media resume el desastre en un numero.
print(pd.Series({"edad_telefonica": tel["age"].mean(),
                 "edad_online": online["age"].mean()}).to_string())
#> edad_telefonica    60.74864
#> edad_online        33.71414

print("\n###BLOQUE-PR5###\n")
# El estimando de Lohr: agree = 1 si elige "muy de acuerdo" (1) o "bastante de
# acuerdo" (2). El 5 es "no se", que cuenta como 0.
agree_tel    = tel["int"].isin([1, 2]).astype(int)
agree_online = online["int"].isin([1, 2]).astype(int)

print(pd.DataFrame(
    {"sin_pesos": [agree_tel.mean(), agree_online.mean()],
     "con_pesos": [np.average(agree_tel,    weights=tel["postwt"]),
                   np.average(agree_online, weights=online["postwt"])]},
    index=["telefonica", "online"]).round(4).to_string())
#>             sin_pesos  con_pesos
#> telefonica     0.6164     0.6476
#> online         0.6755     0.6563

# Los pesos no acercan las dos encuestas: las separan. Calibrar por sexo, edad
# y raza no arregla una seleccion que fallo por otras variables.
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

print("\n###BLOQUE-PR6###\n")
# Sesgo de no respuesta con clases de respuesta. Las cuatro regiones de agpop
# hacen de clases; r_h es la tasa de respuesta de cada una.
#
# Ojo al reutilizar nombres: el bloque anterior deja `mu` valiendo una
# proporcion del ejemplo de juguete. Aqui se REDEFINE como la media de acres92,
# que es lo que significa en este bloque; sin esa linea, el bloque heredaria el
# valor equivocado en cuanto se ejecutara la cadena de arriba abajo.
#
#   mu_R = suma(N_h r_h mu_h) / suma(N_h r_h)      sesgo = mu_R - mu
reg  = agpop.groupby("region")["acres92"]
N_h  = reg.size()                       # el indice queda NC, NE, S, W
mu_h = reg.mean()
mu   = agpop["acres92"].mean()

def sesgo_no_respuesta(r_h):
    peso = N_h * r_h
    return (peso * mu_h).sum() / peso.sum() - mu

# Tres escenarios. Los dos primeros tienen tasas IGUALES entre clases: una es
# altisima y la otra ridicula, y las dos dan sesgo cero. El tercero baja la
# tasa donde los condados son mas grandes (NC, NE, S, W en orden alfabetico).
#
# El `+ 0.0` no cambia ninguna cifra: normaliza el CERO CON SIGNO. Con tasas
# iguales el sesgo es cero, pero en coma flotante sale -5.8e-11, y al redondear
# queda un -0.0 que pandas imprime como "-0.00" y R como "0.00". En IEEE 754,
# -0.0 + 0.0 = +0.0, asi que la suma solo hace que las dos pestanas publiquen la
# misma cifra para el mismo numero. El residuo binario sigue ahi si se mira sin
# redondear, y es la leccion de fondo: "exactamente cero" y "cero en coma
# flotante" no son lo mismo.
print((pd.Series({
    "todas_al_60": sesgo_no_respuesta(np.repeat(0.60, 4)),
    "todas_al_10": sesgo_no_respuesta(np.repeat(0.10, 4)),
    "desiguales":  sesgo_no_respuesta(np.array([0.50, 0.65, 0.35, 0.20]))
    }).round(2) + 0.0).to_string())
#> todas_al_60        0.00
#> todas_al_10        0.00
#> desiguales    -30359.12

print("\n###BLOQUE-PR7###\n")
# Error total = error de muestreo + error ajeno al muestreo. En terminos de
# error cuadratico medio,  ECM = sesgo^2 + varianza,  y solo el segundo
# sumando baja con n.
#
# El sondeo del Literary Digest de 1936, sobre la base de dos candidatos:
digest_landon    = 1293669
digest_roosevelt =  972897
n_digest = digest_landon + digest_roosevelt
p_sondeo = digest_roosevelt / n_digest
p_real   = 61 / (61 + 37)             # Roosevelt 61 %, Landon 37 % en la eleccion
sesgo    = p_sondeo - p_real
S2       = p_real * (1 - p_real)
# float_format explicito: sin el, pandas ve juntos 2,3 millones y 0,43 y pasa
# toda la serie a notacion cientifica, que aqui no se lee. Las cifras son las
# mismas; lo unico que se fija es como se imprimen.
print(pd.Series({"n_digest": n_digest, "p_sondeo": p_sondeo,
                 "p_real": p_real, "sesgo": sesgo}).round(5)
      .to_string(float_format=lambda v: f"{v:.5f}"))
#> n_digest   2266566.00000
#> p_sondeo         0.42924
#> p_real           0.62245
#> sesgo           -0.19321

print("\n###BLOQUE-P4###\n")
# El sondeo de 2,3 millones frente a un muestreo aleatorio simple de 1000.
#
# Los tres numeros se vuelven a declarar, ya redondeados, para que el bloque se
# pueda ejecutar suelto. Se comprobo que no cambia nada de lo publicado: partir
# de estos valores redondeados o de los exactos del bloque anterior da las
# mismas cifras en las dos tablas, hasta el ultimo decimal que se imprime.
p_real, sesgo, n_digest = 0.62245, -0.19321, 2266566
S2 = p_real * (1 - p_real)

ecm_digest = sesgo**2 + S2 / n_digest
ecm_mas    = S2 / 1000
print(pd.Series({"recm_digest": np.sqrt(ecm_digest),
                 "recm_mas":    np.sqrt(ecm_mas),
                 "veces_peor":  np.sqrt(ecm_digest / ecm_mas)}).round(4).to_string())
#> recm_digest     0.1932
#> recm_mas        0.0153
#> veces_peor     12.6035

# El suelo, tamano a tamano. Solo la varianza baja con n: la columna insesgada
# tiende a cero y la sesgada se para en el sesgo y ya no se mueve.
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

print("\n###BLOQUE-PR9###\n")
# Las dos poblaciones del curso. agpop, por region:
resumen = pd.DataFrame({"N": N_h,
                        "media": mu_h.round().astype(int),
                        "sd": reg.std().round().astype(int)}).rename_axis(None)
print(resumen.sort_values("media", ascending=False).to_string())
#>       N   media      sd
#> W   422  723344  835639
#> NC 1054  325951  271303
#> S  1382  199140  243956
#> NE  220   90619   79365

# BigLucy: 85296 empresas, la poblacion de los ejemplos de Gutierrez. En R llega
# dentro del paquete TeachingSampling, que no existe para Python; aqui se lee el
# CSV que exporta precalculo/exporta_biglucy.R desde ese mismo paquete. Las dos
# pestanas calculan sobre el mismo dato en vez de copiarse las cifras.
big = pd.read_csv("precalculo/salidas/BigLucy.csv.gz")
print(pd.Series({"empresas": len(big), "variables": big.shape[1],
                 "ingreso_medio": big["Income"].mean(),
                 "pct_spam": 100 * (big["SPAM"] == "yes").mean()}).round(4)
      .to_string(float_format=lambda v: f"{v:.4f}"))
#> empresas        85296.0000
#> variables          11.0000
#> ingreso_medio     429.5012
#> pct_spam           60.8950

print("\n###BLOQUE-PS1###\n")
# Ejercicio 1 - La encuesta de Parade. Formula del sesgo de no respuesta:
#   mu = r mu_R + (1 - r) mu_M
# Si el 75 % de los que llamaron esta a favor y solo llamo una fraccion r,
# esto es lo que tendrian que opinar los que NO llamaron para que el
# porcentaje poblacional fuera cada valor de la primera fila.
r, mu_R = 0.01, 0.75        # una fraccion diminuta de los lectores llamo
mu = np.array([0.20, 0.30, 0.40, 0.50])
print(pd.DataFrame([mu.round(4), ((mu - r * mu_R) / (1 - r)).round(4)],
                   index=["si_la_poblacion_fuera", "los_que_no_llamaron"]
                   ).to_string(header=False))

#> si_la_poblacion_fuera  0.2000  0.3000  0.4000  0.5000
#> los_que_no_llamaron    0.1944  0.2955  0.3965  0.4975
print("\n###BLOQUE-PS2###\n")
# Ejercicio 2 - Fondos mutuos. El diseno (sistematico 1 en 10) es impecable:
# reparte la misma probabilidad de inclusion a todo lo que este en la lista.
N_lista = 1250              # supongamos que el periodico publica 1250 fondos
k = 10
print(pd.Series({"pi_k": 1 / k, "suma_pi": N_lista * (1 / k),
                 "n_esperado": N_lista / k}).to_string())

# El defecto esta antes: si el periodico solo publica los fondos por encima de
# cierto tamano, los que faltan tienen pi_k = 0 y ningun diseno los recupera.
#> pi_k            0.1
#> suma_pi       125.0
#> n_esperado    125.0
print("\n###BLOQUE-PS3###\n")
# Ejercicio 3 - Jurados en Maricopa. Analisis de flujo del marco a la muestra.
citaciones    = 100300
no_entregada  =  23000
no_calificado =   7000
excusado      =  22000
quedan = citaciones - no_entregada - no_calificado - excusado
print(pd.Series({"citaciones": citaciones, "quedan": quedan,
                 "retencion_pct": 100 * quedan / citaciones,
                 "perdida_pct":   100 * (citaciones - quedan) / citaciones
                 }).round(2).to_string(float_format=lambda v: f"{v:.2f}"))

#> citaciones      100300.00
#> quedan           48300.00
#> retencion_pct       48.16
#> perdida_pct         51.84
print("\n###BLOQUE-PS4###\n")
# Ejercicio 4 - Los 14 arquitectos, contactados por orden de directorio hasta
# conseguir 8 entrevistas. Si todos aceptan, las probabilidades de inclusion no
# son iguales: son 1 para los ocho primeros y 0 para los seis ultimos.
N_arq, n_arq = 14, 8
pi_arq = np.concatenate([np.ones(n_arq), np.zeros(N_arq - n_arq)])
print(pd.Series({"suma_pi": int(pi_arq.sum()), "n": n_arq,
                 "minimo": int(pi_arq.min())}).to_string())

# Suma n, como debe ser, y aun asi el diseno es inservible: seis arquitectos
# tienen probabilidad CERO de salir, asi que ningun estimador puede ser
# insesgado para la poblacion de los catorce.
#> suma_pi    8
#> n          8
#> minimo     0
print("\n###BLOQUE-PS5###\n")
# Ejercicio 5 - Libros en la biblioteca. Se muestrean UBICACIONES, no libros:
# los prestados no estan. Si una fraccion f esta prestada y su tasa de
# necesidad de reencuadernacion es la mitad de la de los que si estan:
p_estante = 0.30                      # tasa entre los libros presentes
f = np.array([0.10, 0.20, 0.30])
p_prestado = p_estante / 2
p_real_libro = (1 - f) * p_estante + f * p_prestado
print(pd.DataFrame([f, p_real_libro.round(4), (p_estante - p_real_libro).round(4)],
                   index=["fraccion_prestada", "valor_real", "sesgo"]
                   ).to_string(header=False))

#> fraccion_prestada  0.100  0.20  0.300
#> valor_real         0.285  0.27  0.255
#> sesgo              0.015  0.03  0.045