# Precálculos — Muestreo Estadístico

Scripts de R que producen los datos y las cifras que se incrustan en los capítulos. **Nada
que aparezca como número en el material se escribe a mano: sale de ejecutar estos scripts.**

## ⚠️ Usa el R correcto

En esta máquina hay dos instalaciones de R y **la del `PATH` no sirve**:

| | Ruta | `survey` |
|---|---|---|
| Homebrew 4.6.0 (el que responde a `Rscript`) | `/opt/homebrew/bin/Rscript` | ❌ no |
| Framework 4.4 (**el que hay que usar**) | `/Library/Frameworks/R.framework/Versions/4.4-arm64/Resources/bin/Rscript` | ✅ sí |

```bash
/Library/Frameworks/R.framework/Versions/4.4-arm64/Resources/bin/Rscript precalculo/genera_cap2.R
```

Paquetes disponibles en el R 4.4: `survey` 4.5, `sampling`, `TeachingSampling` 4.1.1, `srvyr`,
`lme4`, `dplyr`, `ggplot2`, `jsonlite`.

## Scripts

| Script | Produce | Notas |
|---|---|---|
| `verifica_paquetes.R` | — | prueba de humo del entorno; ejecutarlo primero al retomar |
| `genera_cap1.R` | `salidas/cap1_datos.json` | *Literary Digest*, Hite, las dos encuestas `intell`, `agpop`, `BigLucy`, error total |
| `genera_cap2.R` | `salidas/cap2_datos.json` | espacio de muestras, distribución de muestreo, cobertura, Bernoulli, sistemático |
| `genera_cap3.R` | `salidas/cap3_datos.json` | razón, regresión, diferencia, sesgo simulado, dominios, GREG, mediana |
| `genera_soluciones.R` | consola | soluciones de los ejercicios guiados del cap. 2 |
| `verifica_bloques.py` | consola | contrasta cada cifra `#>` de un capítulo con la salida real; con `--prosa`, también las del texto; y **siempre** el LaTeX con barra simple dentro de los literales de JS |
| `verifica_publicado.py` | consola | ejecuta el código **del sitio vivo**, sin anteponerle nada; comprueba además que lo servido coincida con `gh-pages` y que `origin/gh-pages^{tree}` sea `origin/main:sitio` |
| `cuenta_sitio.py` | consola | cuenta lo que hay de verdad en las páginas publicadas **y lo coteja** contra las cifras escritas a mano del README y del `index.html`, metaetiquetas incluidas |
| `verifica_referencias.py` | consola | comprueba que cada «capítulo C, módulo N» apunte al módulo que la frase dice; `referencias_cruzadas.json` es su línea base |
| `anota_salidas.py` | reescribe la cadena | anota en cada grupo `#>` la salida real de SUS sentencias; aborta si no puede colocarla (ver el docstring: los dos estilos de anotación) |
| `pruebas/prueba_anotador.py` | consola | regresión del anotador; la primera prueba es que no duplique una cadena intercalada |

## Convenciones

- Todo script empieza cargando `_comun.R`, que fija
  `Sys.setlocale("LC_CTYPE", "en_US.UTF-8")`. Sin eso, `jsonlite` escribe las tildes como bytes
  sueltos y el navegador se come la letra.
- Semilla fija en toda simulación, y declarada en el propio script.
- Las salidas JSON van a `salidas/` y se validan antes de incrustarlas.
- Datos: `../CSV data sets for SDA 3e/` (los 82 datasets oficiales de Lohr).
- **Toda varianza se calcula por dos vías** —la fórmula a mano y `survey`— y el script aborta si no
  coinciden. Donde Lohr publica la cifra, se contrasta también contra ella.
- **Los dos verificadores se reparten el trabajo y no se solapan.** `verifica_bloques.py`
  pregunta *¿son ciertas las cifras?*, y para eso antepone las librerías y los imports antes de
  ejecutar. `verifica_publicado.py` pregunta *¿arranca esto tal como se publica?*, y por eso no
  antepone nada. Entre las dos preguntas hubo meses un hueco —el preámbulo estaba en `cadena.R`,
  que se ejecuta al precalcular, pero no en los bloques, que son lo que se publica— por el que
  diez páginas se sirvieron con un `could not find function "svydesign"` en el primer bloque.
  Añadirle una cabecera a `verifica_publicado.py` «para que pase» vuelve a abrir ese hueco.
- **Renumerar un capítulo rompe las referencias de los demás, en silencio.** Al pasar el cap. 3 de
  12 a 14 módulos quedaron **8 referencias apuntando a otro módulo**, repartidas por cuatro
  capítulos, y las 8 pasaron `verifica_bloques.py --prosa` antes y después: «módulo 8» es una cifra
  respaldada tanto si el módulo 8 trata de lo que dice la frase como si no. Por eso existe
  `verifica_referencias.py`, y por eso **hay que correrlo al renumerar cualquier capítulo**, no solo
  el que se toca.
- **El LaTeX roto no se ve desde el navegador; hay que mirar la fuente.** Dentro de un literal
  de JavaScript un comando de LaTeX necesita DOS barras: con una, JS se la come antes de que KaTeX
  lea la cadena. Se publicaron así cuatro preguntas del cap. 3 —el estudiante leía `ar{x} = 301
  953,72`— y no lo cazó nadie porque **KaTeX falla sin crear un `.katex-error`**: está medido sobre
  la página viva, LaTeX roto da 0 elementos `.katex-error`, el error va a la consola y el texto se
  queda crudo. Hay dos variantes, y la segunda es peor: si la barra se pierde del todo (`pi` por
  `\pi`) el resultado es LaTeX VÁLIDO —letras en cursiva—, así que no hay ni consola ni DOM que
  avise. Y el espaciado (`\,`, `\;`) no se ve roto en absoluto: `963\,464\,412` llega como
  `963,464,412`, con el separador de millares convertido en el separador DECIMAL de este material.
  Por eso la comprobación va **en toda ejecución** de `verifica_bloques.py`, no detrás de una
  opción: una comprobación que hay que acordarse de pedir no habría servido aquella tarde. Fuera de
  `<script>`, en el texto HTML, la barra simple es la CORRECTA y no se mira; y tampoco se mira fuera
  de `<script>` **porque estos capítulos enseñan R y Python**, es decir, publican a propósito código
  lleno de barras legítimas. Esa frontera no es una limitación del detector: es lo único que separa
  el texto escrito *para KaTeX* del texto que el capítulo *muestra como código*.
- **La regla que busca el fallo no puede ser una opinión sobre cuál es el fallo.** El arreglo de
  aquellas cuatro preguntas dejó **17 barras vivas** y pasó su propia comprobación. El motivo no fue
  descuido: se definió la avería como «comandos sin doblar» y se buscó *barra seguida de letra*, así
  que `\,` y `\;` no entraban en la categoría. La búsqueda arregló todo lo que la búsqueda buscaba y
  quedó en verde. La primera versión de este detector repetía el error un piso más arriba, con una
  **lista de comandos**: igual de opinable, y ciega ante un `\Phi` que nadie hubiera listado. La
  regla de ahora no opina: (1) dentro de un `$…$`, **cualquier** barra simple está mal, por
  construcción; (2) fuera, toda barra que no sea un escape que **ECMAScript** defina. La primera
  mitad es geometría y la segunda la define el lenguaje. Hacen falta las dos: `\t` de `\tfrac` y
  `\b` de `\bar` son escapes legítimos de JS —solo la mitad geométrica los ve—, y un `\Phi` o unos
  delimitadores `\(…\)` fuera de un `$…$` solo los ve la otra.
- **Publicar y empujar `main` dejaron de ser dos acciones independientes.** Lo fueron hasta que la
  invariante ató `origin/gh-pages^{tree}` a `origin/main:sitio`: desde entonces, publicar sin subir
  `main` deja la comprobación en rojo desde el primer minuto. Es la consecuencia buscada —lo servido
  es siempre el `sitio/` de un commit que está en el remoto— pero cambia el procedimiento, y con
  varias sesiones en el mismo árbol significa que al empujar se arrastran los commits ajenos que
  estén debajo.

- **Las cifras del curso viven en tres sitios, y cada uno se desfasa por su cuenta**: la tabla del
  README, las tarjetas del `index.html` y las **dos metaetiquetas** del `index.html`. Las metas son
  las peligrosas porque no se ven leyendo la página: se publicaron con «67 simuladores» cuando el
  texto visible ya decía 70, y se escaparon **dos veces el mismo día**, una de ellas después de
  revisar la página entera. Por eso `cuenta_sitio.py` ya no solo cuenta: coteja. El ámbito importa
  —el README dice «Ocho capítulos», así que sus totales **no** incluyen el preparcial— y el ámbito
  de cada cifra se decide por el elemento que la contiene, no por el enlace más cercano: con «el
  último enlace anterior» el total de la cabecera se leía como cifra del cap. 1, porque encima lleva
  un «Comenzar» que apunta allí.
- **Lo servido tiene que ser el `sitio/` de un commit que ya está en el remoto**:
  `origin/gh-pages^{tree}` == `origin/main:sitio`. Es más barata y más fuerte que comparar md5
  página a página, y caza dos cosas que ninguna otra comprobación miraba —publicar desde un árbol
  local sin subir `main`, y editar `sitio/` a mano sobre `gh-pages`—. Vale mientras el camino corto
  publique el árbol entero; si algún día se publica un subconjunto a propósito, deja de valer.
- Cuando una comparación es sobre un borde exacto (`F̂(t) >= p` con pesos iguales), va **con
  tolerancia**: `cumsum()/sum()` redondea a un lado en R y al otro en Python, y sin tolerancia las
  dos pestañas del mismo capítulo publican cuantiles distintos.

## El fallo que hay que temer no es el ruidoso

Todo lo de arriba es la misma avería contada seis veces, y conviene verla junta, porque el reflejo
que pide es antinatural: **lo peligroso no es el error que rompe algo, es el que produce una salida
plausible.**

| lo que se vio | lo que pasaba |
|---|---|
| 0 elementos `.katex-error` | KaTeX no fallaba: hacía lo que se le pedía, y ya no era lo escrito |
| `301,953,72`, un número bien formado | el separador de millares convertido en el decimal |
| una prueba que corría y daba resultados razonables | `git show $C:…` con `:s` de zsh había dejado los ficheros **vacíos** |
| 174 barras contadas con `grep` | contaba también las dobles correctas y las del texto HTML |
| «0 pares `\\` dentro de `$…$`» | un `continue` antes del contador, que nunca se incrementaba |
| un arreglo en verde | compartía con su comprobación la definición del fallo |

Ninguno avisó: los seis los cazó alguien al volver a mirar. Y el reparto dice algo más. **Tres los
cazó la otra sesión** —los tres en los que quien los cometió estaba seguro— y **tres los cazó su
propio autor**, pero ninguno de esos tres por releer el resultado: los tres salieron de volver al
instrumento, a su código o a ejecutarlo otra vez. Releer un número plausible no lo desmiente nunca;
solo lo desmiente mirar qué lo produjo, o mirarlo alguien que no comparta el punto ciego. De ahí
tres costumbres que valen más que cualquier verificador:

1. **Probar la comprobación contra el caso roto**, recuperándolo de git si hace falta. Un verificador
   que solo se ha visto en verde no se ha visto. Por eso `cuenta_sitio.py` tiene `--sitio`, que lo
   apunta a un estado pasado: sobre `9e9ec78` saca exactamente las **dos metaetiquetas**, que es el
   fallo que se escapó dos veces. Y por eso el detector de LaTeX se mide contra `b0dfddb^`, donde
   debe dar **40**: las 23 que aquel commit documenta y las 17 que dejó vivas.
2. **Preguntarse qué cuenta exactamente el instrumento**, no si el número parece razonable. El `grep`
   de 174 y el `grep -o 'language-r'` de 32 fallaron los dos así: la expresión respondía a una
   pregunta ligeramente distinta de la que había.
3. **Que mire alguien que no hizo el diagnóstico.** No es cortesía entre sesiones: es la única
   comprobación que no comparte el punto ciego con lo comprobado.

## Qué NO cuadra con el libro, y por qué

`sum(agpop$acres87)` da **963 464 412**; el ejemplo 4.6 de Lohr 3.ª ed. usa 964 470 625, un
0,104 % más. La muestra sí es la misma (`s_e` y `t̂_x` coinciden hasta el último decimal publicado)
y los 23 códigos `-99` no explican la diferencia. El material usa la suma del archivo, que es lo
único reproducible, y lo declara en el capítulo 3.

Plan de trabajo y orden de las tareas: `../PLAN_Material_Muestreo.md`.
