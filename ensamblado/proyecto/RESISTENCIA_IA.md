# Resistencia a la IA de la guía del proyecto integrador — medición del 22 oct 2026

Hecha por el lector IA de la auditoría de contenido (`PLAN_Auditoria_Proyecto_Muestreo.md`), con
el mismo método que la de Diseño (`Diseno de experimentos/proyecto/RESISTENCIA_IA.md`). Se midió la
guía **anterior** a las correcciones de esa auditoría; lo que cambió después se dice al final.

## Qué se hizo

Un asistente, con la guía como única entrada, produjo dos entregas, y otro agente las calificó en
frío con la rúbrica, sin saber que eran fabricadas:

- **A · archivo público:** `apipop`, estratificado por tipo de escuela, con estimador de razón.
  Cifras reales, salidas de R.
- **B · encuesta a 88 estudiantes:** marco, piloto, respuestas, no respuesta, desviaciones y
  bitácora **inventados**; la selección con semilla corre de verdad.

Los borradores quedaron fuera del repositorio, en el scratchpad de la sesión. La entrega B es un
fraude completo: no se versiona.

## Resultado

| | A · archivo | B · fabricada |
|---|---|---|
| P1–P3 | sólido × 3 | sólido × 3 |
| A1 · A2 | sólido · sólido (con el descriptor «ajustado»: no hubo campo) | sólido · aceptable |
| I1–I6 | sólido × 5, I5 aceptable | sólido × 6 |
| **Lo escrito** | **4,89** | **4,91** |

Con E1 sólido, la nota del proyecto según las preguntas (E2):

| E2 | Nota del proyecto | De los 20 puntos del curso |
|---|---|---|
| 5,0 | 4,94 | 19,8 |
| 3,5 | 4,67 | 18,7 |
| 2,25 | 3,58 | 14,3 |
| 1,0 | 1,93 | 7,7 |

- **Quien delega y estudia** responde las cinco preguntas tipo del módulo 8 con su propio
  repositorio: con E2 de 3,5 el tope ni se activa, y la defensa le quita alrededor de 1 punto de 20.
- **Quien delega y no estudia** pierde unos 12.
- **Nada de lo que pide la guía delata datos de campo fabricados.** La comprobación de π_k, la
  semilla, la hora de la release y el `datos.csv` con su no respuesta verifican la selección, no el
  campo. Lo único que hizo sospechar al calificador fueron incoherencias del relato, y ninguna
  pregunta publicada va por ahí.
- **El archivo público vuelve irrelevante el fraude**, porque todo se re-ejecuta, pero es el camino
  de menor esfuerzo para delegar: nada impide rehacer el propio `apipop` de la guía, y con el
  parámetro conocido se pueden probar semillas (14 de 200 dan un intervalo que no lo contiene).

## Qué cambió ya con la auditoría

- La comprobación de π_k que la guía vendía como la verificación del código de IA **no podía
  fallar** (la media por estrato coincide por construcción). Ahora es unidad por unidad, en el
  protocolo, y el ejemplo muestra que rechaza un guion roto (IA-1).
- I6 tenía un nivel imposible para quien no usó IA, lo que empujaba a inventar un uso (IA-5).
- A1 y A2 dicen cómo se leen con un archivo público.

Lo demás —semilla externa, una pregunta de ejecución en la exposición, evidencia barata de campo,
la definición ampliada de fraude— son propuestas para Javier, en el informe de la auditoría.
