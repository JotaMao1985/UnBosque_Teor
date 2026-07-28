# UnBosque_Teor — material de las asignaturas teóricas

Material de estudio interactivo del programa de Estadística de la **Universidad El Bosque**.
Docente: Javier Mauricio Sierra.

🌐 **Sitio publicado:** https://jotamao1985.github.io/UnBosque_Teor/

| Curso | Sitio | Estado |
|---|---|---|
| Muestreo Estadístico (20939) | [`/muestreo/`](https://jotamao1985.github.io/UnBosque_Teor/muestreo/) | en producción — 4 de 8 capítulos en el formato nuevo |
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
python3 precalculo/verifica_bloques.py --todos    # cada cifra `#>` contra la salida real
chmod 644 sitio/muestreo/*.html                   # un archivo sin permiso de lectura es un 404
```

Los precálculos se ejecutan **con el R del framework 4.4**, no con el del `PATH`
(ver `precalculo/README.md`).

## Cómo está hecho

Cada capítulo es un único archivo HTML autocontenido: Tailwind, KaTeX, Chart.js y Prism desde CDN,
los datos incrustados como JSON y todo el cómputo pesado precalculado en R. Ninguna cifra de los
bloques de código se escribe a mano: sale de ejecutar los guiones de `precalculo/`, y
`verifica_bloques.py` contrasta cada una contra la salida real antes de que el capítulo se publique.

## Créditos y fuentes

- Lohr, S.L. *Sampling: Design and Analysis*, 2.ª y 3.ª ediciones (CRC Press).
- Gutiérrez, H.A. *Estrategias de muestreo: diseño de encuestas y estimación de parámetros*
  ([acceso abierto](https://psirusteam.github.io/EstrategiasDeMuestreo/)).
- Särndal, Swensson y Wretman. *Model Assisted Survey Sampling* (Springer).
- Lumley, T. Paquete [`survey`](https://cran.r-project.org/package=survey) para R.

Los libros de texto **no** se versionan en este repositorio.
