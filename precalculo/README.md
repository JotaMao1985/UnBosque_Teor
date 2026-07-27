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

Paquetes disponibles en el R 4.4: `survey`, `sampling`, `srvyr`, `lme4`, `dplyr`, `ggplot2`,
`jsonlite`. Falta `TeachingSampling` (tarea T0.3 del plan).

## Convenciones

- Todo script empieza cargando `_comun.R`, que fija
  `Sys.setlocale("LC_CTYPE", "en_US.UTF-8")`. Sin eso, `jsonlite` escribe las tildes como bytes
  sueltos y el navegador se come la letra.
- Semilla fija en toda simulación, y declarada en el propio script.
- Las salidas JSON van a `salidas/` y se validan antes de incrustarlas.
- Datos: `../CSV data sets for SDA 3e/` (los 82 datasets oficiales de Lohr).

Plan de trabajo y orden de las tareas: `../PLAN_Material_Muestreo.md`.
