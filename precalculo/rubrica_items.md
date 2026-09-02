# Rúbrica de calidad de ítem — autoevaluación de Muestreo

Escrita el 2026-09-02 para la auditoría del banco. **Se fija antes del fan-out**:
ocho agentes con ocho varas distintas producen ocho informes incomparables, y el
problema no se ve hasta que ya está el informe escrito.

Lo mecánico —una sola correcta, retro presente, tolerancia, el gráfico que corre—
lo comprueba `pruebas/prueba_bancos.py` y **no se juzga aquí**. Esta rúbrica solo
mira lo que ninguna regla puede decidir: si el ítem enseña algo cuando se falla.

## Regla dura del auditor

**Un hallazgo sin cita literal del ítem se descarta.** No «los distractores son
débiles», sino: «la opción 3 dice *"Da error al calcular la media"*, y ningún
estudiante que haya visto correr `mean()` la elegiría». Sin la cita, el hallazgo
no es verificable y no entra en el informe.

Y su simétrica: **el auditor no reescribe el ítem**. Nombra el defecto y para.
Qué se cambia lo decide Javier.

## Los siete criterios

| | Criterio | Se incumple cuando |
|---|---|---|
| **D1** | **Cada distractor es un error nombrable** | El distractor no corresponde a ningún razonamiento que un estudiante real haría. Es relleno. |
| **D2** | **La `retro` nombra el razonamiento, no el veredicto** | Dice «incorrecto» o repite la respuesta buena, en vez de explicar qué te llevó a esa opción. |
| **D3** | **Sin pistas formales** | La correcta es sistemáticamente la más larga o la más matizada; hay «todas las anteriores»; los absolutos («siempre», «nunca») aparecen solo en los distractores; una opción desentona en gramática o registro. |
| **D4** | **El enunciado plantea un problema** | Se responde reconociendo una frase del módulo, sin razonar. Pide recitar una definición. |
| **D5** | **Hay reto interpretativo** | Ningún distractor es defendible a primera vista. Si las tres incorrectas se descartan sin pensar, el ítem no distingue a quien entendió de quien casi entendió. **Este es el criterio central de la auditoría.** |
| **D6** | **Se responde con el módulo que declara** | Exige algo que ese capítulo no enseña, o su `modulo`/`ancla` apunta a otro sitio. |
| **D7** | **La dimensión real coincide con la deducida** | `inventario_items.py` deduce la dimensión del tipo (`opcion`→concepto, `numerica`→procedimiento). Un `opcion` que pide interpretar un resultado está mal contado, y la tabla de especificaciones se apoya en esa cuenta. |

## Calibración: qué es aprobar

El estándar no es abstracto, está en el capítulo 1. Estos dos ítems son la vara:

**D1 y D2 en estado puro** — cap1[0], *Literary Digest*. Los cuatro distractores
son cuatro creencias reales sobre el tamaño muestral, y cada `retro` desmonta la
suya con una cifra: «Duplicar las papeletas habría duplicado el mismo error»;
«un intervalo de ±0,06 puntos alrededor de una cifra que estaba 19 puntos fuera».

**D5 en estado puro** — cap1[3], el `-99` de `agpop`. La opción *«R lo trata como
`NA` y lo excluye»* es exactamente lo que cree quien ha usado R sin leer el
codebook: defendible a primera vista, y falsa. Ese es el reto interpretativo.

## Escala

Por criterio: **cumple · dudoso · incumple**, con cita obligatoria si no es
«cumple».

Gravedad del ítem, y solo importa esta columna para decidir qué se toca antes del
Parcial 1:

- **alta** — el ítem enseña algo FALSO, o su respuesta correcta no lo es.
- **media** — el ítem es correcto pero no mide (D5 incumple, o D1 en tres de tres).
- **baja** — mejorable: redacción, una `retro` floja, la dimensión mal contada.

## Lo que esta rúbrica NO pide

No pide que todos los ítems sean difíciles. Una autoevaluación formativa necesita
ítems de entrada, y un ítem fácil colocado al principio de un módulo hace su
trabajo. D5 se juzga **sobre el banco**, no sobre cada ítem por separado: el
problema es un banco entero sin reto, no un ítem accesible.
