# Muestreo Estadístico (20939) · reglas para quien trabaje en este repo

Material HTML interactivo de un curso universitario, publicado en GitHub Pages desde `sitio/`.
Lo leen estudiantes: un error publicado es un error enseñado.

## Las dos normas duras

1. **Ninguna cifra a mano.** Toda cifra en pantalla sale de `precalculo/genera_capN.R` y se
   verifica antes de escribirla. El R que sirve es el 4.4 del framework, no el del `PATH`
   (`precalculo/README.md`).
2. **Ninguna cita de memoria.** No escribas un autor, un año, una sección, un ejemplo, una página
   ni un DOI que no hayas leído en esta sesión en el ejemplar o en `bibliografia/`.
   - Si un localizador existe se consulta en `bibliografia/indices/<clave>.json`. No se cuenta a
     mano ni se le cree a otro agente: ya pasó que uno dio por comprobado un ejercicio que no era.
   - Una cita nueva es un `<cite class="cita" data-ref data-loc></cite>` **vacío**, dentro de un
     elemento con `data-afirma`, y con su entrada en `bibliografia/contraste/capN.yml`. El texto
     visible lo escribe `precalculo/genera_referencias.py`; no se teclea.
   - Quien redacta no verifica. Sin pasaje leído y registrado, el veredicto es `pendiente`.
   - Una obra sin ejemplar registrado no lleva localizador: va como lectura recomendada o de
     segunda mano, con `data-via`.

   El procedimiento completo está en `bibliografia/README.md`.

## Antes de dar algo por hecho

```bash
python3 precalculo/genera_referencias.py --comprobar   # las citas son las que escribe el generador
python3 precalculo/verifica_citas.py                   # catálogo, localizadores, registro, pie
python3 precalculo/pruebas/prueba_citas.py             # el auditor caza los defectos inyectados
python3 precalculo/verifica_referencias.py             # «capítulo C, módulo N» apunta donde dice
```

Y, si se tocó código o cifras, `verifica_bloques.py --prosa` y `verifica_publicado.py --local`
con el R del framework. Lo visual se comprueba por HTTP (`.claude/launch.json`), no por
`file://`, y también a 375 px.

## Lo que rompe cosas

- **Los capítulos se ensamblan.** Se edita `ensamblado/modulos/capN/`, se corre
  `genera_referencias.py` y después `ensamblado/ensambla_capN.py`. Editar `sitio/` a mano se
  pierde al reensamblar, y reensamblar dos veces tiene que dar el mismo archivo.
- **El repositorio es público.** Los PDF y EPUB de los libros, su texto extraído y los pasajes
  leídos nunca van a git: viven en `bibliografia/_local/`. En el registro va el puntero y la
  huella, no la cita literal.
- **`.gitignore` es una lista blanca.** Una carpeta nueva necesita su `!/carpeta/`; compruébalo
  con `git check-ignore -v ruta`.
- **Renumerar los módulos de un capítulo** rompe en silencio las referencias de los demás.
- **La línea base de citas solo encoge.** `verifica_citas.py --anota` retira lo arreglado;
  `--anota --admite` graba como conocido lo que hoy falla, y solo se usa después de leer la salida.

## Git y publicación

- Varias sesiones comparten este repositorio. Añade al commit solo tus rutas, por su nombre:
  nunca `git add -A` ni `git push origin HEAD`.
- Commit, `push` y publicación en `gh-pages` se consultan siempre con Javier, cada paso por
  separado. Publicar es poner el material delante de los estudiantes.
- `PLAN_Material_Muestreo.md` es la memoria entre sesiones: se lee al retomar y se escribe al
  cerrar cada tarea.
