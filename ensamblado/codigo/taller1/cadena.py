import warnings; warnings.filterwarnings('ignore')
import numpy as np, pandas as pd
from scipy.stats import norm

print("\n###BLOQUE-P1###\n")
# Las dos poblaciones del modulo. htpop son 2 000 personas con su estatura: es
# la poblacion COMPLETA, asi que el parametro verdadero se conoce y cada error
# se puede medir en vez de describirse. htsrs es la MAS de n = 200 que Lohr
# extrae de ella. crimes son 5 000 delitos registrados, con una variable
# binaria (arrest) para los errores de proporcion.
ht = pd.read_csv("CSV data sets for SDA 3e/htpop.csv")
hs = pd.read_csv("CSV data sets for SDA 3e/htsrs.csv")
cr = pd.read_csv("CSV data sets for SDA 3e/crimes.csv")

N, n = len(ht), len(hs)
media_verdadera = ht.height.mean()
total_verdadero = ht.height.sum()
print(f"N={N}  n={n}  media_verdadera={media_verdadera:.4f}  total_verdadero={total_verdadero}")
#> N=2000  n=200  media_verdadera=168.6160  total_verdadero=337232

print("\n###BLOQUE-P2###\n")
# ERROR 1 - El total se expande con n en vez de con N.
# El estimador del total es N * y_barra: cada unidad de la muestra representa a
# N/n unidades de la poblacion. Multiplicar por n devuelve la suma de la propia
# muestra, que no estima nada.
ybar = hs.height.mean()

total_mal = ybar * n            # <- el error
total_bien = ybar * N

print(f"total_mal={total_mal:.0f}  total_bien={total_bien:.0f}  "
      f"verdadero={total_verdadero}  veces_menor={total_bien / total_mal:.0f}")
#> total_mal=33788  total_bien=337880  verdadero=337232  veces_menor=10

print("\n###BLOQUE-P3###\n")
# ERROR 2 - El error estandar sin la correccion por poblacion finita.
# Sin reemplazo, la varianza lleva el factor (1 - n/N). Aqui n/N = 0,1, asi que
# el fpc vale 0,9 y omitirlo INFLA el error estandar: quien lo olvida se declara
# menos preciso de lo que es. Va siempre en esa direccion.
s = hs.height.std(ddof=1)

ee_mal = s / np.sqrt(n)                          # <- el error
ee_bien = np.sqrt((1 - n / N) * s**2 / n)
# La segunda via con survey solo existe en la pestana de R: aqui no hay
# equivalente directo, asi que el contraste se hace alli.

print(f"ee_mal={ee_mal:.7f}  ee_bien={ee_bien:.7f}  "
      f"inflacion_pct={(ee_mal / ee_bien - 1) * 100:.7f}")
#> ee_mal=0.7830696  ee_bien=0.7428850  inflacion_pct=5.4092553

print("\n###BLOQUE-P4###\n")
# ERROR 3 - norm.ppf(0.95) en un intervalo bilateral del 95 %.
# Un intervalo de dos colas al 95 % deja 2,5 % en cada extremo: el cuantil es
# norm.ppf(0.975) = 1,96, no norm.ppf(0.95) = 1,645. El codigo corre y el
# intervalo sale mas estrecho, que ademas parece mejor: se lee como mas precision.
from scipy.stats import norm          # el bloque carga lo que necesita

ee = np.sqrt((1 - n / N) * s**2 / n)

ic_mal = ybar + np.array([-1, 1]) * norm.ppf(0.95) * ee     # <- el error
ic_bien = ybar + np.array([-1, 1]) * norm.ppf(0.975) * ee

# La cobertura real del intervalo estrecho se calcula, no se afirma.
cobertura_mal = (2 * norm.cdf(norm.ppf(0.95)) - 1) * 100

print(f"z_mal={norm.ppf(0.95):.6f}  z_bien={norm.ppf(0.975):.6f}  "
      f"ancho_mal={np.diff(ic_mal)[0]:.6f}  ancho_bien={np.diff(ic_bien)[0]:.6f}  "
      f"estrechado_pct={(1 - np.diff(ic_mal)[0] / np.diff(ic_bien)[0]) * 100:.6f}  "
      f"cobertura_mal_pct={cobertura_mal:.6f}")
#> z_mal=1.644854  z_bien=1.959964  ancho_mal=2.443874  ancho_bien=2.912056  estrechado_pct=16.077354  cobertura_mal_pct=90.000000

print("\n###BLOQUE-P5###\n")
# ERROR 4 - La desviacion tipica en el lugar del error estandar.
# s mide cuanto varian las PERSONAS; el error estandar, cuanto varia la MEDIA de
# muestra a muestra. Confundirlos da un intervalo para la media tan ancho como
# la poblacion entera. Ningun estudiante lo escribiria si mirara el resultado,
# y por eso el error de verdad esta en no mirarlo.
ic_s = ybar + np.array([-1, 1]) * 1.96 * s      # <- el error
ic_ee = ybar + np.array([-1, 1]) * 1.96 * ee

print(f"mal=[{ic_s[0]:.5f}, {ic_s[1]:.5f}]  bien=[{ic_ee[0]:.5f}, {ic_ee[1]:.5f}]  "
      f"veces_mas_ancho={np.diff(ic_s)[0] / np.diff(ic_ee)[0]:.5f}")
#> mal=[147.23442, 190.64558]  bien=[167.48395, 170.39605]  veces_mas_ancho=14.90712

print("\n###BLOQUE-P6###\n")
# ERROR 5 - La varianza de una proporcion sin fpc y con n en vez de n-1.
# Para una proporcion, Lohr escribe V(p) = (1 - n/N) * p(1-p)/(n-1). Los dos
# atajos -olvidar el fpc y dividir entre n- empujan en direcciones contrarias,
# asi que el resultado sigue pareciendo razonable y no hay nada que delate el
# fallo. Con n grande la diferencia es pequena; con n chico, no.
# En una MAS de 100 delitos del archivo salieron 22 arrestos.
N_cr, n_cr = len(cr), 100
p = 22 / n_cr

ee_p_mal = np.sqrt(p * (1 - p) / n_cr)                                  # <- el error
ee_p_bien = np.sqrt((1 - n_cr / N_cr) * p * (1 - p) / (n_cr - 1))

# Cada atajo por separado, para ver que se compensan y por eso no se notan.
solo_sin_fpc = np.sqrt(p * (1 - p) / (n_cr - 1))
solo_entre_n = np.sqrt((1 - n_cr / N_cr) * p * (1 - p) / n_cr)

print(f"p={p}  ee_mal={ee_p_mal:.8f}  ee_bien={ee_p_bien:.8f}\n"
      f"solo_sin_fpc_pct={(solo_sin_fpc / ee_p_bien - 1) * 100:.8f}  "
      f"solo_entre_n_pct={(solo_entre_n / ee_p_bien - 1) * 100:.8f}  "
      f"los_dos_juntos_pct={(ee_p_mal / ee_p_bien - 1) * 100:.8f}")
#> p=0.22  ee_mal=0.04142463  ee_bien=0.04121488
#> solo_sin_fpc_pct=1.01525446  solo_entre_n_pct=-0.50125629  los_dos_juntos_pct=0.50890914

print("\n###BLOQUE-P7###\n")
# ERROR 6 - El tamano de muestra sin corregir por N, y redondeado hacia abajo.
# n_0 es el tamano que haria falta con poblacion infinita; con N finito se
# corrige. Y el redondeo va SIEMPRE hacia arriba: quedarse corto incumple el
# margen prometido, que es justo lo que se estaba comprando.
from scipy.stats import norm          # el bloque carga lo que necesita

S, e = ht.height.std(ddof=1), 1.5
n0 = (norm.ppf(0.975) * S / e)**2

n_mal = int(np.floor(n0))                        # <- los dos errores a la vez
n_bien = int(np.ceil(n0 / (1 + n0 / N)))

print(f"n0={n0:.4f}  n_mal={n_mal}  n_bien={n_bien}  personas_de_mas={n_mal - n_bien}")
#> n0=212.5672  n_mal=212  n_bien=193  personas_de_mas=19

print("\n###BLOQUE-P8###\n")
# ERROR 7 - La varianza de un sistematico calculada como si fuera un MAS.
# El marco alterna mujer, hombre, mujer, hombre... y el salto k = 10 es par, asi
# que toda muestra cae sobre el mismo sexo: 5 muestras de solo mujeres y 5 de
# solo hombres. Dentro de cada una las estaturas son homogeneas, asi que la
# formula del MAS -que solo mira la dispersion INTERNA- declara una precision
# altisima. Aqui se puede comparar con la verdad porque el diseno solo tiene 10
# muestras posibles y se recorren enteras.
mujeres = ht.height[ht.gender == "F"].to_numpy()
hombres = ht.height[ht.gender == "M"].to_numpy()
marco = np.empty(N, dtype=float)
marco[0::2], marco[1::2] = mujeres, hombres      # M, H, M, H, ...
k = 10
n_sis = N // k

medias = np.array([marco[a::k].mean() for a in range(k)])
var_real = np.mean((medias - marco.mean())**2)                    # exacta

s2_dentro = np.mean([marco[a::k].var(ddof=1) for a in range(k)])
var_declara = (1 - n_sis / N) * s2_dentro / n_sis                 # <- el error

print(f"medias_min={medias.min():.4f}  medias_max={medias.max():.4f}  "
      f"ee_real={np.sqrt(var_real):.7f}  ee_declarado={np.sqrt(var_declara):.7f}  "
      f"veces_optimista={var_real / var_declara:.7f}")
#> medias_min=161.6200  medias_max=175.7300  ee_real=6.5568711  ee_declarado=0.6069285  veces_optimista=116.7127189

print("\n###BLOQUE-P9###\n")
# ERROR 8 - El promedio de los promedios.
# La proporcion de arrestos por tipo de delito, promediada sin pesos, trata
# igual al tipo mas raro del archivo que al mas frecuente. La proporcion de la
# poblacion es la media PONDERADA por el tamano de cada grupo.
g = cr.groupby("crimetype").arrest
tasas, tam = g.mean(), g.size()

p_mal = tasas.mean()                          # <- el error
p_bien = (tasas * tam).sum() / tam.sum()

print(f"tipos={len(tasas)}  grupo_menor={tam.min()}  grupo_mayor={tam.max()}  "
      f"p_mal={p_mal:.7f}  p_bien={p_bien:.4f}  "
      f"puntos_de_error={(p_mal - p_bien) * 100:.7f}")
#> tipos=17  grupo_menor=6  grupo_mayor=1016  p_mal=0.2882597  p_bien=0.2766  puntos_de_error=1.1659733

print("\n###BLOQUE-P10###\n")
# ERROR 9 - dropna() cambia la poblacion sin decirlo.
# El formulario tenia un minimo y no registro la estatura de quien mide menos de
# 155 cm. La media sale igual, no hay aviso, y ya no estima la media de las
# 2 000 personas: estima la de las que miden 155 o mas. La pregunta no es si el
# codigo corre, es SOBRE QUE POBLACION queda definida la estimacion.
registrada = ht.height.where(ht.height >= 155)

media_mal = registrada.mean()                 # <- el error: pandas ignora los NaN por defecto
faltan = int(registrada.isna().sum())

print(f"faltantes={faltan}  pct_perdido={faltan / N * 100}  "
      f"media_mal={media_mal:.6f}  media_verdadera={media_verdadera:.4f}  "
      f"sesgo_cm={media_mal - media_verdadera:.6f}")
#> faltantes=178  pct_perdido=8.9  media_mal=170.397366  media_verdadera=168.6160  sesgo_cm=1.781366

print("\n###BLOQUE-P11###\n")
# ERROR 10 - El mismo diseno escrito en dos lenguajes NO es el mismo diseno.
# np.random.choice muestrea CON reemplazo por defecto; sample() de R, SIN el.
# Quien traduce su codigo de un lenguaje al otro cambia el diseno sin tocar una
# sola idea, y no hay error ni aviso: solo unidades repetidas y una varianza
# mayor de la que declara la formula sin reemplazo.
# Se sortean POSICIONES, no estaturas: dos personas distintas pueden medir lo
# mismo, asi que contar valores repetidos no dice nada del diseno.
rng = np.random.default_rng(2026)
pos_con = rng.choice(N, 200)                      # <- por defecto, CON reemplazo
rng = np.random.default_rng(2026)
pos_sin = rng.choice(N, 200, replace=False)       # el MAS que se queria

# Cuantas personas distintas se esperan con reemplazo: N(1 - (1 - 1/N)^n). Esta
# cifra SI es la misma en los dos lenguajes; el sorteo concreto no, porque una
# semilla no es portable entre R y Python.
esperadas = N * (1 - (1 - 1 / N)**200)
y = ht.height.to_numpy()

print(f"personas_distintas_sin={len(np.unique(pos_sin))}  "
      f"personas_distintas_con={len(np.unique(pos_con))}  "
      f"distintas_esperadas={esperadas:.7f}\n"
      f"veces_repetidas={200 - len(np.unique(pos_con))}  "
      f"ee_sin={np.sqrt((1 - 200 / N) * y[pos_sin].var(ddof=1) / 200):.7f}  "
      f"ee_con={np.sqrt(y[pos_con].var(ddof=1) / 200):.7f}")
#> personas_distintas_sin=200  personas_distintas_con=191  distintas_esperadas=190.3704203
#> veces_repetidas=9  ee_sin=0.7130265  ee_con=0.8333694

print("\n###BLOQUE-PS1###\n")
# EJERCICIO 1 - El MAS completo, de punta a punta.
# Cada solucion carga sus propios datos: quien copie este bloque suelto tiene
# que poder ejecutarlo sin haber corrido nada antes.
from scipy.stats import norm

hs = pd.read_csv("CSV data sets for SDA 3e/htsrs.csv")
N, n = 2000, len(hs)

ybar, s = hs.height.mean(), hs.height.std(ddof=1)
ee = np.sqrt((1 - n / N) * s**2 / n)          # el fpc va DENTRO de la raiz
z = norm.ppf(0.975)
ic_media = ybar + np.array([-1, 1]) * z * ee

t_est = N * ybar                              # el total: N por la media, no n
ee_t = N * ee                                 # el error estandar se expande igual
ic_total = t_est + np.array([-1, 1]) * z * ee_t

print(f"media={ybar:.3f}  ee={ee:.3f}  ic=[{ic_media[0]:.3f}, {ic_media[1]:.3f}]\n"
      f"total={t_est:.3f}  ee_total={ee_t:.3f}  ic_total=[{ic_total[0]:.3f}, {ic_total[1]:.3f}]")
#> media=168.940  ee=0.743  ic=[167.484, 170.396]
#> total=337880.000  ee_total=1485.770  ic_total=[334967.944, 340792.056]

print("\n###BLOQUE-PS2###\n")
# EJERCICIO 2 - Una proporcion, con su correccion por poblacion finita.
# Escenario: de una MAS de 400 delitos del archivo de 5 000, en 105 hubo arresto.
from scipy.stats import norm

N_cr, n_cr, arrestos = 5000, 400, 105
p = arrestos / n_cr

# Para una proporcion, Lohr divide entre n-1, no entre n.
ee_p = np.sqrt((1 - n_cr / N_cr) * p * (1 - p) / (n_cr - 1))
ic_p = p + np.array([-1, 1]) * norm.ppf(0.975) * ee_p

# El archivo entero esta disponible, asi que se puede comprobar si cubre.
cr = pd.read_csv("CSV data sets for SDA 3e/crimes.csv")
p_verdadera = cr.arrest.mean()

# El contrafactual de la parte (b): el mismo estudio sobre un archivo 100 veces
# mas grande. Se calcula, para no tener que fiarse de la intuicion.
N_grande = 500000
f_grande = n_cr / N_grande
ee_grande = np.sqrt((1 - f_grande) * p * (1 - p) / (n_cr - 1))

print(f"p={p:.5f}  ee={ee_p:.5f}  ic=[{ic_p[0]:.5f}, {ic_p[1]:.5f}]  "
      f"verdadera={p_verdadera:.4f}  cubre={int(ic_p[0] <= p_verdadera <= ic_p[1])}\n"
      f"f_grande={f_grande}  ee_grande={ee_grande:.5f}  "
      f"sube_pct={(ee_grande / ee_p - 1) * 100:.5f}")
#> p=0.26250  ee=0.02113  ic=[0.22109, 0.30391]  verdadera=0.2766  cubre=1
#> f_grande=0.0008  ee_grande=0.02202  sube_pct=4.21550

print("\n###BLOQUE-PS3###\n")
# EJERCICIO 3 - Que compra duplicar la muestra.
# El presupuesto alcanza para 200 personas mas. La pregunta no es si mejora
# -siempre mejora- sino CUANTO, y si ese cuanto vale lo que cuesta.
from scipy.stats import norm

hs = pd.read_csv("CSV data sets for SDA 3e/htsrs.csv")
N, s2 = 2000, hs.height.var(ddof=1)

margen = lambda n: norm.ppf(0.975) * np.sqrt((1 - n / N) * s2 / n)

comparacion = pd.DataFrame({"n": [200, 400, 800, 2000]})
comparacion["margen"] = [margen(n) for n in comparacion.n]
comparacion["reduccion_pct"] = (1 - comparacion.margen / margen(200)) * 100
print(comparacion.round(4).to_string(index=False))
#>    n  margen  reduccion_pct
#>  200  1.4560         0.0000
#>  400  0.9707        33.3333
#>  800  0.5944        59.1752
#> 2000  0.0000       100.0000

print("\n###BLOQUE-PS4###\n")
# EJERCICIO 4 - El tamano de muestra que se encarga, y el que cabe.
# Las dos preguntas de un estudio real: cuanto necesito para el margen que
# quiero, y que margen consigo con lo que puedo pagar.
from scipy.stats import norm

N_cr, p, z = 5000, 0.2766, norm.ppf(0.975)

# (a) cuanto hace falta para un margen de 3 puntos
n0 = z**2 * p * (1 - p) / 0.03**2
n_necesario = int(np.ceil(n0 / (1 + n0 / N_cr)))       # se redondea HACIA ARRIBA

# (b) que margen sale con 500, que es lo que hay
margen_500 = z * np.sqrt((1 - 500 / N_cr) * p * (1 - p) / (500 - 1))

print(f"n0={n0:.4f}  n_necesario={n_necesario}  "
      f"margen_con_500_pct={margen_500 * 100:.4f}  margen_pedido_pct=3")
#> n0=854.0521  n_necesario=730  margen_con_500_pct=3.7234  margen_pedido_pct=3

print("\n###BLOQUE-PS5###\n")
# EJERCICIO 5 - Sistematico sobre un marco ORDENADO: cuando conviene.
# El diseno solo tiene k = 10 muestras posibles, asi que su varianza real se
# calcula recorriendolas enteras. No hay que simular nada.
ht = pd.read_csv("CSV data sets for SDA 3e/htpop.csv")
N, k = len(ht), 10
n_sis = N // k

marco = np.sort(ht.height.to_numpy())          # ordenado por la variable de interes
medias = np.array([marco[a::k].mean() for a in range(k)])
var_sis = np.mean((medias - marco.mean())**2)  # exacta: el diseno es equiprobable

var_mas = (1 - n_sis / N) * ht.height.var(ddof=1) / n_sis
deff = var_sis / var_mas                       # efecto de diseno

print(f"medias_min={medias.min():.4f}  medias_max={medias.max():.4f}  "
      f"media_poblacional={marco.mean():.4f}\n"
      f"ee_sistematico={np.sqrt(var_sis):.4f}  ee_mas={np.sqrt(var_mas):.4f}  deff={deff:.4f}")
#> medias_min=168.4500  medias_max=168.7800  media_poblacional=168.6160
#> ee_sistematico=0.1023  ee_mas=0.7485  deff=0.0187
