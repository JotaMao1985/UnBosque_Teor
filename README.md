# UnBosque_Teor — material de las asignaturas teóricas

Material de estudio interactivo del programa de Estadística de la **Universidad El Bosque**.
Docente: Javier Mauricio Sierra.

🌐 **Sitio publicado:** https://jotamao1985.github.io/UnBosque_Teor/

| Curso | Sitio | Estado |
|---|---|---|
| Muestreo Estadístico (20939) | [`/muestreo/`](https://jotamao1985.github.io/UnBosque_Teor/muestreo/) | **completo** — los 8 capítulos (88 módulos, 66 simuladores) y el preparcial del Corte I (13 módulos, 59 preguntas) |
| Series de Tiempo | [sitio propio](https://jotamao1985.github.io/Series-de-Tiempo_Un_Bosque/) | vive todavía en su repositorio; la portada lo enlaza |

## Cómo está organizado

```
UnBosque_Teor/                  ← rama main: el proyecto entero
├── PLAN_Material_Muestreo.md   ← plan operativo y memoria entre sesiones
├── CSV data sets for SDA 3e/   ← 82 datasets oficiales de Lohr
├── *.Rmd                       ← código R previo reutilizable
├── plantilla/                  ← plantilla de capítulo (no se publica)
├── precalculo/                 ← scripts de R + salidas JSON + verificador (no se publica)
├── ensamblado/                 ← ensambladores y componentes (no se publica)
└── sitio/                      ← RAMA gh-pages: esto y solo esto se publica
    ├── index.html              ← portada con la lista de cursos
    └── muestreo/               ← el sitio del curso de Muestreo
```

La rama **`main`** lleva todo el proyecto —incluidos los precálculos, que son los que hacen el
material reproducible—. La rama **`gh-pages`** lleva únicamente el contenido de `sitio/`, y es la
que GitHub Pages sirve.

## Publicar un cambio

```bash
git push origin main
git subtree push --prefix sitio origin gh-pages
```

Es el mismo flujo que el repositorio de Series de Tiempo, así que no hay dos maneras de publicar
que recordar.

## Antes de publicar

```bash
python3 precalculo/verifica_bloques.py --todos --prosa   # cada cifra, en los bloques y en el texto
python3 precalculo/cuenta_sitio.py                       # los totales, contados sobre los archivos
chmod 644 sitio/muestreo/*.html                          # un archivo sin permiso de lectura es un 404
```

Los precálculos se ejecutan **con el R del framework 4.4**, no con el del `PATH`
(ver `precalculo/README.md`).

Y después de tocar un capítulo publicado, la regla de oro del ensamblado: volver a ejecutar su
`ensamblado/ensambla_capN.py` y comprobar que el archivo sale **byte a byte idéntico**. Si sale
distinto, la corrección se quedó en el archivo final y no en las fuentes.

## Cómo está hecho

Cada capítulo es un único archivo HTML autocontenido: Tailwind, KaTeX, Chart.js y Prism desde CDN,
los datos incrustados como JSON y todo el cómputo pesado precalculado en R.

**Ninguna cifra se escribe a mano.** Las de los bloques de código salen de ejecutar
`ensamblado/codigo/capN/cadena.{R,py}` y las anota `precalculo/anota_salidas.py` a partir de la
ejecución real; las del texto se contrastan con `verifica_bloques.py --prosa` contra las salidas y
el JSON del precálculo. Las que no se pueden derivar automáticamente —cocientes que el autor
deriva, cifras en otra unidad, constantes de tabla— viven en `precalculo/cifras_prosa.json` con su
justificación, revisadas una a una ejecutando.

| Herramienta | Para qué |
|---|---|
| `precalculo/genera_capN.R` | produce los datos del capítulo N como JSON, con semilla fija |
| `precalculo/anota_salidas.py` | escribe en cada bloque su salida REAL en los comentarios `#>`, repartida por sentencia |
| `precalculo/verifica_bloques.py` | ejecuta los bloques encadenados y contrasta cada cifra, en el código y en la prosa |
| `precalculo/mide_abstraccion.py` | avisa de los módulos que formalizan antes de dar un número |
| `precalculo/cuenta_sitio.py` | cuenta módulos, simuladores, preguntas y componentes sobre los archivos |
| `ensamblado/ensambla_capN.py` | construye el capítulo desde la plantilla, los módulos y las cadenas |
| `ensamblado/retropropaga_*.py` | lleva un componente nuevo a la plantilla y a los demás capítulos ya publicados |

### Los dos estilos de anotación, y por qué le importan a `anota_salidas.py`

El material anota los bloques de dos maneras: con **un único grupo `#>` al final** (caps. 7 y 8 en
R, y las cadenas de Python de los caps. 2 a 8) o de forma **intercalada**, un grupo tras cada
sentencia que imprime (caps. 1 a 6 en R, y `cap1/cadena.py`). La herramienta reparte la salida
**por sentencia**, así que respeta los dos y no convierte uno en el otro.

Hasta la fase 6 reescribía «el grupo del final de cada bloque», que solo vale para el primer
estilo: sobre una cadena intercalada añadía un grupo **duplicado** al final y dejaba la salida de
una sentencia impresa antes de la sentencia que la produce —en `cap1/cadena.R`, de 53 a 89 líneas
`#>` en una pasada—. Lo grave es que **`verifica_bloques.py` no lo detecta**, porque las cifras
duplicadas sí aparecen en la salida real del bloque: el archivo pasa la verificación y el
estudiante lee el código descolocado. Si hoy no puede colocar una salida con certeza, la
herramienta **aborta sin escribir**. La prueba de regresión es
`precalculo/pruebas/prueba_anotador.py`.

Las líneas `#>` se escriben sin espacios al final. Las cuatro cadenas que los llevaban se
normalizaron en la fase 6 (`cap3/cadena.R`, `cap4/cadena.py`, `cap7/cadena.R`, `cap8/cadena.R`).

## Créditos y fuentes

- Lohr, S.L. *Sampling: Design and Analysis*, 2.ª y 3.ª ediciones (CRC Press).
- Gutiérrez, H.A. *Estrategias de muestreo: diseño de encuestas y estimación de parámetros*
  ([acceso abierto](https://psirusteam.github.io/EstrategiasDeMuestreo/)).
- Särndal, Swensson y Wretman. *Model Assisted Survey Sampling* (Springer).
- Lumley, T. Paquete [`survey`](https://cran.r-project.org/package=survey) para R.

Los libros de texto **no** se versionan en este repositorio.
