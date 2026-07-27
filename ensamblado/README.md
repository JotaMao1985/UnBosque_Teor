# Ensamblado — Muestreo Estadístico

Scripts de Python que construyen cada capítulo **por sustitución de regiones sobre el capítulo
anterior**, nunca concatenando fragmentos sueltos.

## Por qué así

Un capítulo son ~200 KB de HTML autocontenido con estilos, plantillas de módulo, registros de
simuladores y de autoevaluación. Regenerarlo desde cero pierde arreglos ya hechos; concatenar
fragmentos produce archivos que parecen correctos y tienen el CSS a medias. Sustituir regiones
delimitadas sobre el capítulo anterior conserva todo lo demás intacto.

## Piezas

- `ensambla_capN.py` — construye el capítulo N a partir del N−1.
- `retropropaga_*.py` — lleva un componente nuevo a los capítulos ya hechos y a la plantilla.
  **Un componente no está terminado hasta que está en la plantilla y en los capítulos
  anteriores que lo necesiten.**
- `componentes/` — el marcado y el CSS de cada componente, en un solo sitio.
- `modulos/capN/` — los `<template>` de los módulos y los registros de simuladores y
  autoevaluación de ese capítulo.
- `codigo/capN/` — **las cadenas ejecutables** de R y de Python.

## Las cadenas de código

`codigo/capN/cadena.R` y `cadena.py` no son una copia de lo que hay en el capítulo: son el
original. Se escriben ahí, se **ejecutan de verdad**, se anotan sus salidas reales en las líneas
`#>` y solo entonces el ensamblador las inserta en el HTML escapando el marcado. Así el bloque
que lee el estudiante es, byte a byte, el que se probó, y no una transcripción.

Los bloques van separados por `cat("\n###BLOQUE-XX###\n")` (o `print(...)` en Python). El
ensamblador parte por esos marcadores y recorta los restos de la propia llamada; aborta si algún
bloque queda vacío o conserva restos, porque un bloque mal recortado no compilaría en manos del
estudiante.

Ejecutar la cadena entera, con la misma cabecera que usa el verificador:

```bash
/Library/Frameworks/R.framework/Versions/4.4-arm64/Resources/bin/Rscript --vanilla ensamblado/codigo/cap2/cadena.R
python3 ensamblado/codigo/cap2/cadena.py
```

## Comprobación de sintaxis antes de publicar

El motor de un capítulo son ~180 KB de JavaScript en línea. Un error de sintaxis no da un fallo
visible: la página carga, los CDN cargan y el contenido simplemente no aparece, porque el
`<script>` entero no se ejecutó. Pasó al retropropagar el glosario (quedó un `const GLOSARIOS`
declarado dos veces). Comprobarlo cuesta un segundo:

```bash
python3 -c "import re,pathlib,subprocess,sys; h=pathlib.Path(sys.argv[1]).read_text(); js=re.findall(r'<script>(.*?)</script>', h, re.S)[-1]; p='/tmp/motor.js'; open(p,'w').write(js); sys.exit(subprocess.run(['node','--check',p]).returncode)" Htmls_Muestreo/capitulo-2-diseno-mas-sistematico.html
```

## Regla de oro

Al terminar una auditoría en la que se corrigió el HTML publicado, **volver a ejecutar el script
de ensamblado y comparar byte a byte**. Si sale idéntico, las correcciones están en las fuentes y
no solo en el archivo final.

Plan de trabajo: `../PLAN_Material_Muestreo.md`.
