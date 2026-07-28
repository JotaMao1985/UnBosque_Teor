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

Las salidas **no se transcriben a mano**. En cada fase del proyecto han vuelto a fallar cifras
copiadas a ojo (una en la fase 1, dos en la 3, cinco en la 4), así que desde la fase 5 las anota
un script a partir de la ejecución real:

```bash
python3 precalculo/anota_salidas.py ensamblado/codigo/cap8/cadena.R
python3 precalculo/anota_salidas.py ensamblado/codigo/cap8/cadena.py --check   # como regresión
```

Dos trampas de las cadenas, ya pagadas:

- Una línea `print("\n...")` **dentro** de un bloque hace que el ensamblador crea que quedan
  restos del marcador y aborte. Usar `print()` y luego el texto.
- Todo lo que el bloque necesite para correr suelto tiene que estar **dentro del bloque**:
  `options(scipen=)`, `pd.set_option`, y también los `library()` que no cargue la cabecera del
  verificador. El bloque de las reglas de Rubin del capítulo 8 tuvo que cargar `mitools` él mismo.

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
python3 -c "import re,pathlib,subprocess,sys; h=pathlib.Path(sys.argv[1]).read_text(); js=re.findall(r'<script>(.*?)</script>', h, re.S)[-1]; p='/tmp/motor.js'; open(p,'w').write(js); sys.exit(subprocess.run(['node','--check',p]).returncode)" sitio/muestreo/capitulo-2-diseno-mas-sistematico.html
```

## Permisos del HTML publicado

`write_text` conserva los permisos del archivo que sustituye. El capítulo 3 los tenía en `600`
heredados, y ni el navegador local podía abrirlo; en `gh-pages` habría sido un 404. Después de
ensamblar:

```bash
chmod 644 sitio/muestreo/*.html
```

## Los data.frame de R en el JavaScript

`jsonlite::write_json` escribe un `data.frame` como **array de filas**, no como objeto de columnas.
Desde el simulador se lee `D.map(f => f.media)`, nunca `D.media`. Escribirlo por columnas no da
error de sintaxis: da `undefined`, y el módulo entero lanza una excepción mientras los demás siguen
perfectos. Pasó con tres simuladores del capítulo 3 a la vez.

## Regla de oro

Al terminar una auditoría en la que se corrigió el HTML publicado, **volver a ejecutar el script
de ensamblado y comparar byte a byte**. Si sale idéntico, las correcciones están en las fuentes y
no solo en el archivo final.

```bash
for c in 1 2 3; do
  f=$(ls sitio/muestreo/capitulo-$c-*.html); cp "$f" /tmp/antes.html
  python3 ensamblado/ensambla_cap$c.py > /dev/null
  cmp -s /tmp/antes.html "$f" && echo "cap $c ok" || echo "cap $c DIFIERE"
done
```

Plan de trabajo: `../PLAN_Material_Muestreo.md`.
