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
| `verifica_bloques.py` | consola | contrasta cada cifra `#>` de un capítulo con la salida real |
| `verifica_publicado.py` | consola | ejecuta el código **del sitio vivo**, sin anteponerle nada; comprueba además que lo servido coincida con `gh-pages` |
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
- Cuando una comparación es sobre un borde exacto (`F̂(t) >= p` con pesos iguales), va **con
  tolerancia**: `cumsum()/sum()` redondea a un lado en R y al otro en Python, y sin tolerancia las
  dos pestañas del mismo capítulo publican cuantiles distintos.

## Qué NO cuadra con el libro, y por qué

`sum(agpop$acres87)` da **963 464 412**; el ejemplo 4.6 de Lohr 3.ª ed. usa 964 470 625, un
0,104 % más. La muestra sí es la misma (`s_e` y `t̂_x` coinciden hasta el último decimal publicado)
y los 23 códigos `-99` no explican la diferencia. El material usa la suma del archivo, que es lo
único reproducible, y lo declara en el capítulo 3.

Plan de trabajo y orden de las tareas: `../PLAN_Material_Muestreo.md`.
