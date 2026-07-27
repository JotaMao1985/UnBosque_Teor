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

## Regla de oro

Al terminar una auditoría en la que se corrigió el HTML publicado, **volver a ejecutar el script
de ensamblado y comparar byte a byte**. Si sale idéntico, las correcciones están en las fuentes y
no solo en el archivo final.

Plan de trabajo: `../PLAN_Material_Muestreo.md`.
