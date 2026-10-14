    // ================================================================
    // Banco del Preparcial del Corte II (módulo 14 del capítulo 4)
    //
    // 32 ítems, repartidos por la tabla de especificaciones del Parcial 2
    // (precalculo/tabla_especificaciones_corte2.json, aprobada el
    // 2026-10-07). Cuatro bloques, uno por dimensión:
    //
    //   Bloque                       ítems  opcion  multiple  numerica  grafico
    //   A · Conceptos                  10      7        3         0        0
    //   B · Procedimientos             11      0        0        11        0
    //   C · Interpretación              6      6        0         0        0
    //   D · Análisis gráfico            5      0        0         0        5
    //
    // Versión 2 (2026-10-07), tras tres auditorías: la primera la acertó entera por
    // la forma un resolutor que no sabía muestreo, y la auditoría experta encontró
    // gemelos con el corpus y con el banco de sustentación, fugas entre ítems y una
    // clave (R28) que no daba la precisión que prometía. R10 pasó a ser numérica.
    //
    // `ancla` es el módulo del material donde se enseña cada ítem, y es lo que
    // lee el diagnóstico. `modulo` vale 14 en todos: el motor lo usa para el
    // resumen del bloque y lo busca en el courseData de ESTA página, así que
    // un ítem del capítulo 3 con su número de módulo nombraría un módulo del 4.
    //
    // LAS CIFRAS. Ninguna se escribe a mano: todas se leen de
    // DATOS_PREPARCIAL2, que escribe precalculo/genera_preparcial2.R. La
    // población es construida (fincas cafeteras de un departamento) y el
    // módulo lo dice. Lo que un enunciado imprime viene ya redondeado del
    // precálculo, y la clave se calculó con eso: quien opera sobre el
    // enunciado llega a la clave.
    //
    // LAS REGLAS DE FORMA, que comprueba precalculo/pruebas/prueba_preparcial2.py:
    //   1. ninguna retro nombra posiciones: nombra el contenido de la opción;
    //   2. la correcta no es la opción más larga;
    //   3. cada distractor es un error con nombre;
    //   4. ninguna retro del acierto abre con «Correcto» o «Exacto»: el motor
    //      ya antepone el juicio.
    // ================================================================
    const DP2 = DATOS_PREPARCIAL2;
    const P2 = DP2.poblacion, I2 = DP2.items, E2 = DP2.estratos;

    // Una cifra en la prosa, con el formato del capítulo (coma decimal,
    // espacio de miles). `m2` es la misma cifra dentro de una fórmula de
    // KaTeX, donde la coma pide llaves y el espacio de miles es \,.
    const c2 = (x, d) => escribeCifra(x, d);
    // escribeCifra separa los miles con un espacio DURO (U+00A0), no con uno
    // normal: la primera versión solo cambiaba el normal y KaTeX recibía el duro.
    // Y el orden importa: primero la coma DECIMAL y después los espacios, porque
    // el espacio fino de LaTeX que dejan los espacios lleva otra coma, y el
    // reemplazo de la coma decimal la agarraba.
    const m2 = (x, d) => escribeCifra(x, d).replace(',', '{,}').replace(/[ \u00a0\u202f]/g, '\\,').replace('−', '-');
    const pct2 = (x, d = 1) => c2(100 * x, d) + ' %';
    // Las salidas de R se escapan: «< 2e-16» sin escapar se come la línea.
    const salida2 = t => '<pre><code>' + String(t).replace(/&/g, '&amp;')
      .replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</code></pre>';
    // Una tabla compacta. Estilo en línea a propósito: una clase nueva sin su
    // regla en la plantilla no da error, da una tabla sin estilo.
    // `position: relative` no es decorativo: en el teléfono la tabla se vuelve
    // desplazable (display: block; overflow-x: auto), y el MathML oculto de
    // KaTeX, que va con position: absolute, se escapaba del recorte y ensanchaba
    // la página entera hasta 488 px a 375 (visto en la tabla de R10).
    const tabla2 = (cab, filas) =>
      '<table style="margin:0.75rem 0; font-size:0.9rem; position:relative;"><thead><tr>' +
      cab.map(c => `<th style="padding:0.4rem 0.6rem;">${c}</th>`).join('') +
      '</tr></thead><tbody>' +
      filas.map(f => '<tr>' + f.map(c => `<td style="padding:0.4rem 0.6rem;">${c}</td>`).join('') + '</tr>').join('') +
      '</tbody></table>';
    const NOMBRES_TAM = E2.nombres;

    const BANCO_PREPARCIAL2 = [

      // ==============================================================
      // BLOQUE A · Conceptos (10)
      //
      // Versión 2 (2026-10-07). La primera la acertó ENTERA, 22 de 22, un
      // resolutor que solo miraba la forma: los absolutos siempre eran
      // distractores, «las dos» o «da lo mismo» nunca acertaban, la correcta era
      // la matizada y la que concedía algo. Ahora todas las opciones de un ítem
      // comparten plantilla, hay correctas con absolutos y con «las dos» o
      // «nada», y distractores matizados.
      // ==============================================================
      {
        tipo: 'opcion', id: 'R01', bloque: 'A', modulo: 14, dimension: 'concepto',
        ancla: { cap: 3, modulo: 1, titulo: 'Variables auxiliares', lohr: '3.1' },
        pregunta: 'Para estimar la producción total de este año hay dos candidatas a auxiliar: el <strong>área en café que el registro trae para todas las fincas</strong>, actualizada en 2019, y las <strong>entregas del año anterior</strong>, que la cooperativa conoce de todas las fincas. ¿Qué sirve como auxiliar del estimador de razón: el área, las entregas, las dos o ninguna?',
        pista: 'Repasa las dos condiciones que el módulo 1 del capítulo 3 le pide a una auxiliar, y comprueba cada candidata contra ellas.',
        opciones: [
          { texto: 'Las dos: se conocen para todo el marco y acompañan a la producción, aunque no sean de este año.', correcta: true,
            retro: `Una variable es auxiliar si se observa en las fincas de la muestra y su total se conoce, y las dos cumplen. Que no sean de este año no importa: el propio capítulo 3 estima la superficie de 1992 con la de 1987. Además las dos acompañan a la producción (correlación ${c2(I2.R01.rho_area, 2)} el área y ${c2(I2.R01.rho_yant, 2)} las entregas), así que ganará la más correlacionada.` },
          { texto: 'Las dos, siempre que antes se lleven al año de la encuesta con una tasa de crecimiento.', correcta: false,
            retro: 'No hace falta llevarlas a ningún año: lo que pide la razón es que el $x_k$ de la muestra y el $t_x$ sean la misma variable. Si se usa el área de 2019 en la muestra y el total de 2019, el estimador es válido; corregirlas con una tasa estimada metería un error nuevo.' },
          { texto: 'Solo el área: las entregas son de otro año, y la razón pide que $x$ e $y$ se midan el mismo año.', correcta: false,
            retro: 'La razón no pide eso: pide que $x_k$ se observe en la muestra y que $t_x$ se conozca. El capítulo 3 usa acres de 1987 para estimar los de 1992. Y las entregas acompañan a la producción todavía más de cerca que el área.' },
          { texto: 'Solo las entregas: el área de 2019 está desactualizada y sesgaría el estimador.', correcta: false,
            retro: 'Desactualizada no quiere decir inválida. Si en la muestra se usa el área que trae el registro, $x$ y $t_x$ son la misma variable y el estimador sigue siendo el de razón; lo único que pierde es correlación.' }
        ]
      },

      {
        tipo: 'opcion', id: 'R06', bloque: 'A', modulo: 14, dimension: 'concepto',
        ancla: { cap: 3, modulo: 5, titulo: 'Razones y proporciones', lohr: '3.1' },
        pregunta: 'Un agrónomo quiere el <strong>rendimiento promedio por caficultor</strong>: cuántas cargas por hectárea saca cada caficultor, contando a todos por igual, para comparar con esa cifra cada finca que asesora. Con un MAS de fincas, ¿qué parámetro es ese, y cómo se estima?',
        pista: 'El módulo 5 del capítulo 3 distingue dos parámetros que se parecen mucho. Pregúntate a cuál de los dos se refiere la pregunta del agrónomo.',
        opciones: [
          { texto: 'La media de los cocientes $y_k/x_k$, estimada con las fórmulas del capítulo 2.', correcta: true,
            retro: `Si cada caficultor cuenta lo mismo, el parámetro es $\\frac1N\\sum_U y_k/x_k$: la media de una variable nueva, $z_k = y_k/x_k$, que se estima con el capítulo 2 sin linealizar nada. En la población vale ${c2(I2.R06.media_cocientes, 2)} cargas por hectárea, frente a ${c2(I2.R06.B, 2)} de la razón: son respuestas a dos preguntas distintas.` },
          { texto: 'La razón $B = t_y/t_x$, estimada con svyratio y su error estándar linealizado.', correcta: false,
            retro: `$B$ pondera cada finca por su área: es el rendimiento de la hectárea típica del departamento, ${c2(I2.R06.B, 2)} cargas, que es lo que necesita un informe regional. El agrónomo pregunta por el caficultor, y eso es otra cosa.` },
          { texto: 'La mediana de los cocientes $y_k/x_k$, porque un caficultor promedio es el del medio.', correcta: false,
            retro: 'Contar a todos por igual y promediar es una media, no una mediana. La mediana contestaría «el caficultor del medio», que es una tercera pregunta.' },
          { texto: 'Cualquiera de las dos razones: $\\bar y/\\bar x$ y el promedio de los cocientes estiman el mismo parámetro.', correcta: false,
            retro: `No estiman lo mismo: $\\bar y/\\bar x$ estima $B$, ${c2(I2.R06.B, 2)}, y el promedio de los cocientes estima ${c2(I2.R06.media_cocientes, 2)}. Coincidirían solo si el rendimiento de cada finca no tuviera relación con su área; por ejemplo, si todas tuvieran la misma área o el mismo rendimiento.` }
        ]
      },

      {
        tipo: 'opcion', id: 'R09', bloque: 'A', modulo: 14, dimension: 'concepto',
        ancla: { cap: 3, modulo: 7, titulo: 'Estimación de diferencia', lohr: '3.2' },
        pregunta: `La cooperativa conoce las <strong>entregas del año anterior</strong> de todas las fincas. En la población, la recta de la producción de este año sobre esas entregas tiene pendiente $b_1 = ${m2(I2.R09.b1, 3)}$, con correlación $${m2(I2.R09.rho, 4)}$ y razón poblacional $B = ${m2(I2.R09.B, 3)}$. ¿Qué estimador conviene: diferencia, razón o regresión?`,
        pista: 'Los tres usan las entregas; cambian en la pendiente que se permiten: fijada en 1, estimada por el origen o estimada libre. Recuerda qué paga cada uno cuando su pendiente no es la de la población.',
        opciones: [
          { texto: 'La regresión: la diferencia impone pendiente 1, y aquí la pendiente es claramente menor.', correcta: true,
            retro: `Restando las varianzas, $V(\\hat{\\bar y}_d) - V(\\hat{\\bar y}_{\\text{reg}}) = \\frac{1-f}{n}(1-b_1)^2S_x^2$: aquí $(1-${m2(I2.R09.b1, 3)})^2 \\cdot ${m2(I2.R09.Sx, 2)}^2 = ${m2(I2.R09.paga, 2)}$ cargas² por cada $(1-f)/n$. Y la razón tampoco puede ganarle a la regresión (teorema del módulo 7 del capítulo 3): la cosecha cayó, y medir lo mismo no basta si la pendiente no es 1.` },
          { texto: 'La diferencia: es insesgada y la regresión no, y con una correlación tan alta eso es lo que decide.', correcta: false,
            retro: 'El sesgo de la regresión es de orden $1/n$ y aquí es despreciable; lo que decide es la varianza, y la diferencia paga un término en $(1-b_1)^2S_x^2$ que la regresión no paga.' },
          { texto: 'La razón: $B$ queda más cerca de $b_1$ que de 1, y eso la pone por delante de las otras dos.', correcta: false,
            retro: 'Que $B$ quede más cerca de $b_1$ que de 1 dice que la razón le gana a la diferencia, no que gane a la regresión: el teorema del módulo 7 del capítulo 3 da $V(\\hat{\\bar y}_r) \\ge V(\\hat{\\bar y}_{\\text{reg}})$.' },
          { texto: 'Da lo mismo cuál: con una correlación de 0,97 las tres varianzas son prácticamente iguales.', correcta: false,
            retro: 'La correlación es la misma, pero las pendientes que cada estimador usa no lo son, y eso es lo que separa sus varianzas: la de la diferencia queda bastante por encima de las otras dos.' }
        ]
      },

      {
        tipo: 'opcion', id: 'R12', bloque: 'A', modulo: 14, dimension: 'concepto',
        ancla: { cap: 3, modulo: 10, titulo: 'Modelos poblacionales', lohr: '3.4' },
        pregunta: 'En un grupo de fincas, las que casi no tienen área en café producen igual unas 6 cargas (tienen lotes que el registro no ve), y las fincas grandes se dispersan alrededor de la recta lo mismo que las pequeñas. ¿Qué modelo poblacional describe esa nube, y qué estimador le corresponde?',
        pista: 'El modelo tiene dos palancas independientes: qué recta y cómo crece la dispersión, $V(\\varepsilon_k) = \\sigma^2 v_k$. Lee cada una en la descripción.',
        opciones: [
          { texto: 'Recta con intercepto y dispersión constante: la regresión.', correcta: true,
            retro: 'Producir algo con área casi nula es un intercepto; dispersarse igual en todo el rango es $v_k$ constante. Las dos cosas apartan a la razón, que supone recta por el origen y dispersión que crece con $x$, y piden la regresión del módulo 6 del capítulo 3.' },
          { texto: 'Recta por el origen y dispersión proporcional a $x_k$: la razón.', correcta: false,
            retro: 'Ese es el modelo de otra nube: una que pasa por el origen y se abre al crecer el área. Aquí hay unas 6 cargas con área casi nula, y la nube no se abre.' },
          { texto: 'Recta con intercepto y dispersión proporcional a $x_k$: la razón, que admite intercepto si la dispersión crece.', correcta: false,
            retro: 'La razón es la recta por el origen con $v_k = x_k$, y no admite intercepto. Además aquí la dispersión no crece con el área.' },
          { texto: 'Recta por el origen y dispersión constante: la diferencia.', correcta: false,
            retro: 'La diferencia fija la pendiente en 1, no la dispersión, y sirve cuando $x$ e $y$ son la misma variable medida dos veces. Aquí son hectáreas y cargas, y la recta no pasa por el origen.' }
        ]
      },

      {
        tipo: 'multiple', id: 'R13', bloque: 'A', modulo: 14, dimension: 'concepto',
        ancla: { cap: 3, modulo: 11, titulo: 'El estimador general de regresión (GREG)', lohr: '' },
        pregunta: 'Con un MAS de fincas se estima la producción total con un GREG calibrado al número de fincas, al <strong>área en café</strong> y al <strong>área en levante</strong> (renovada hace menos de dos años, que todavía no produce). Marca <strong>todas las afirmaciones correctas</strong>.',
        pista: 'El GREG se escribe como un estimador de Horvitz–Thompson con los pesos retocados, $w_k = g_k/\\pi_k$. Piensa qué impone la calibración sobre esos pesos y qué no.',
        opciones: [
          { texto: 'Los totales que se usaron para calibrar se reproducen sin error con los pesos calibrados.', correcta: true,
            retro: `Es la definición: $\\sum_{k\\in s} w_k\\mathbf x_k = \\mathbf t_x$, que aquí son $N = ${m2(P2.N, 0)}$ fincas y $${m2(P2.tx, 1)}$ y $${m2(P2.tlev, 1)}$ hectáreas.` },
          { texto: 'Si una finca tiene $g_k > 1$, pesa más en el GREG que en el estimador de expansión.', correcta: true,
            retro: 'Su peso pasa de $1/\\pi_k = N/n$ a $g_k/\\pi_k$, que es mayor si $g_k > 1$: la calibración la cuenta como si representara a más fincas.' },
          { texto: 'Si la producción dependiera del área en producción, el GREG con las dos áreas tendría más varianza que la razón.', correcta: false,
            retro: `Al revés: con el área en levante el GREG descuenta el área que no produce y sus residuos son menores. Medido con ${c2(I2.R13.replicas, 0)} MAS de ${I2.R13.n} fincas: error estándar ${c2(I2.R13.ee_greg, 0)} cargas el GREG contra ${c2(I2.R13.ee_razon, 0)} la razón.` },
          { texto: 'Con más de una auxiliar, los $g_k$ salen iguales para todas las fincas de la muestra.', correcta: false,
            retro: 'Los $g_k$ salen iguales para toda la muestra en casos muy particulares, como la razón (una auxiliar, sin intercepto, $v_k = x_k$) o la calibración solo a $N$. Con intercepto y dos áreas, cada finca recibe el suyo.' },
          { texto: 'Si el área en levante se reproduce sin error, la producción de las fincas que están renovando también.', correcta: false,
            retro: 'Reproducir el total de una auxiliar no dice nada de la producción de un subgrupo: esa estimación sigue teniendo su error de muestreo.' }
        ],
        retroAcierto: 'Las dos verdaderas son lo que la calibración impone (los totales) y lo que hace con cada finca (su peso, a través de $g_k$). Las otras tres le atribuyen al GREG más varianza, pesos iguales o una precisión que no tiene.',
        retroFallo: 'Las verdaderas son dos: los totales reproducidos sin error y el peso mayor de una finca con $g_k > 1$. El GREG con las dos áreas tiene menos varianza que la razón, no más; los $g_k$ solo salen iguales en casos particulares, como la razón, y calibrar una auxiliar no vuelve exacta ninguna estimación de la producción.'
      },

      {
        tipo: 'multiple', id: 'R17', bloque: 'A', modulo: 14, dimension: 'concepto',
        ancla: { cap: 4, modulo: 1, titulo: '¿Por qué estratificar?', lohr: '4.1' },
        pregunta: '¿Cuáles de estas son <strong>razones legítimas para estratificar</strong> la encuesta de fincas cafeteras? Marca <strong>todas</strong> las que lo sean.',
        pista: 'El módulo 1 de este capítulo da las ganancias de estratificar en orden de importancia práctica. Contrasta cada opción con esa lista y con lo que un MAS ya garantiza.',
        opciones: [
          { texto: 'Bajar la varianza, si los estratos separan fincas que producen distinto.', correcta: true,
            retro: 'Precisión: la varianza del estratificado solo paga la variabilidad dentro de los estratos. Es la ganancia que el módulo 1 pone delante, y es condicional: con estratos que no separan nada no hay ganancia.' },
          { texto: 'Garantizar siempre un mínimo de fincas del Centro para publicar su cifra.', correcta: true,
            retro: 'Garantías por subgrupo: con la urna única una subregión puede salir casi vacía en una muestra concreta; estratificando, su $n_h$ lo fija el diseñador, en todas las muestras.' },
          { texto: 'Organizar el campo con un equipo de encuestadores en cada subregión.', correcta: true,
            retro: 'Logística y costo: cada estrato puede tener su propio operativo, y el módulo 5 lo convierte en fórmula con un costo por estrato.' },
          { texto: 'Medir distinto en las fincas muy grandes, donde se aforan los lotes uno por uno.', correcta: true,
            retro: 'También es logística: cada estrato se sortea y se estima por separado, así que puede tener su propio procedimiento de medición.' },
          { texto: 'Cubrir las fincas que faltan en el registro, si se estratifica por la subregión donde más faltan.', correcta: false,
            retro: 'Estratificar reparte la muestra entre las fincas del marco; las que no están en el registro no entran en ningún estrato, por fino que se parta. La cobertura se arregla en el marco, no en el diseño.' },
          { texto: 'Lograr que el estimador sea insesgado, cosa que el MAS no consigue.', correcta: false,
            retro: 'El MAS ya es insesgado respecto del diseño. Estratificar no vuelve válido algo que no lo era: lo vuelve más preciso, si los estratos separan.' }
        ],
        retroAcierto: 'Las cuatro legítimas son la precisión, las garantías por subgrupo y dos formas de logística. Las dos falsas le piden al estratificado un arreglo de la cobertura y una insesgadez que el MAS ya tiene.',
        retroFallo: 'Son legítimas cuatro: la precisión, el mínimo del Centro, el equipo por subregión y la medición distinta en las muy grandes. Las falsas son cubrir las fincas que faltan —el diseño no las añade al marco— y la insesgadez, que el MAS ya tiene.'
      },

      {
        tipo: 'opcion', id: 'R18', bloque: 'A', modulo: 14, dimension: 'concepto',
        ancla: { cap: 4, modulo: 2, titulo: 'La teoría en el marco π', lohr: '4.2' },
        pregunta: 'Con asignación proporcional exacta, $n_h/N_h = n/N$ en todos los estratos, así que <strong>cada finca tiene $\\pi_k = n/N$</strong>, igual que en un MAS del mismo tamaño. ¿Es entonces un MAS?',
        pista: 'Un diseño es una distribución $p(s)$ sobre las muestras posibles, y las $\\pi_k$ son solo una parte de lo que de ella se deduce.',
        opciones: [
          { texto: 'No: el MAS puede sacar muestras que este diseño nunca saca, aunque las $\\pi_k$ coincidan.', correcta: true,
            retro: 'Una muestra con todas las fincas de un solo estrato es posible en el MAS e imposible aquí: tienen $p(s)$ distintos. De ahí salen $\\pi_{kl}$ distintas —para dos fincas de estratos distintos, $\\pi_{kl} = \\pi_k\\pi_l$ exactamente— y una varianza distinta.' },
          { texto: 'Sí: con las mismas $\\pi_k$, dos diseños dan la misma varianza aunque sus muestras posibles cambien.', correcta: false,
            retro: 'Las $\\pi_k$ no determinan la varianza: la de Horvitz–Thompson depende también de las $\\pi_{kl}$. El capítulo 2 ya mostró diseños con las mismas $\\pi_k$ y varianzas distintas.' },
          { texto: 'Sí, aunque sus $\\pi_{kl}$ sean algo distintas dentro de cada estrato.', correcta: false,
            retro: 'Las $\\pi_{kl}$ distintas son justamente la prueba de que no es un MAS. Un diseño con otro $p(s)$ es otro diseño, aunque comparta las $\\pi_k$.' },
          { texto: 'No: con proporcional las $\\pi_k$ cambian de un estrato a otro, según su $N_h$.', correcta: false,
            retro: 'Con proporcional exacta no cambian: todas valen $n/N$. Lo que cambia respecto del MAS son las probabilidades conjuntas y las muestras posibles.' }
        ]
      },

      {
        tipo: 'multiple', id: 'R23', bloque: 'A', modulo: 14, dimension: 'concepto',
        ancla: { cap: 4, modulo: 4, titulo: 'Asignación de observaciones', lohr: '4.4' },
        pregunta: 'Sobre la asignación <strong>proporcional</strong> y la de <strong>Neyman</strong>, marca <strong>todas las afirmaciones correctas</strong>.',
        pista: 'Escribe las dos reglas de reparto, una al lado de la otra, y compáralas: qué usa cada una, de dónde sale y para qué variable se calcula.',
        opciones: [
          { texto: 'Neyman reparte en proporción a $N_hS_h$, y la proporcional en proporción a $N_h$.', correcta: true,
            retro: 'Son las dos reglas del módulo 4: la proporcional mira solo el tamaño de cada estrato; Neyman, el tamaño por la dispersión.' },
          { texto: 'Si las $S_h$ fueran iguales en todos los estratos, Neyman daría el reparto proporcional.', correcta: true,
            retro: 'Con $S_h$ constante, $N_hS_h \\propto N_h$. La ganancia de Neyman sobre la proporcional es la dispersión de las dispersiones: sin ella no hay nada que ganar.' },
          { texto: 'Si Neyman pide más fincas de las que tiene un estrato, ese estrato se censa y el resto de la muestra se vuelve a repartir.', correcta: true,
            retro: 'Es el recorte y la reoptimización del módulo 5; hecho a propósito, un estrato de certeza, con fpc 0 y sin aporte a la varianza.' },
          { texto: 'Si un estrato tiene muchas fincas pero muy parecidas, Neyman le da más muestra que la proporcional.', correcta: false,
            retro: 'Al revés: con $S_h$ pequeña, $N_hS_h$ pesa menos que $N_h$ en relación con los demás, y Neyman le quita muestra. Un estrato homogéneo casi no necesita muestra por grande que sea.' },
          { texto: 'Si las $S_h$ salen de un piloto y no de la propia encuesta, la asignación de Neyman queda sesgada.', correcta: false,
            retro: 'Las $S_h$ de la encuesta no se conocen antes de hacerla: se toman de un censo anterior, de un piloto o de una variable correlacionada. Una asignación no es un estimador y no puede estar sesgada; a lo sumo queda algo lejos del óptimo, y cerca del óptimo la varianza es plana.' },
          { texto: 'La asignación de Neyman calculada para la producción es también la mejor para las demás variables de la encuesta.', correcta: false,
            retro: 'Óptima, ¿para qué variable? El módulo 4 mide que la Neyman de una variable puede dejar a otra peor que un MAS. La proporcional, igual que la asignación igual, no depende de qué se mida.' }
        ],
        retroAcierto: 'Las tres verdaderas son las dos reglas, cuándo coinciden y qué se hace cuando el óptimo pide un imposible. Las tres falsas invierten el efecto de la dispersión, confunden de dónde salen las $S_h$ y para qué variable es óptima Neyman.',
        retroFallo: 'Son verdaderas tres: las dos reglas, la de las $S_h$ iguales y la del estrato que se censa. Un estrato homogéneo recibe menos con Neyman, no más; las $S_h$ salen de información previa sin sesgar nada; y la Neyman de una variable no es la mejor para las demás.'
      },

      {
        tipo: 'opcion', id: 'R26', bloque: 'A', modulo: 14, dimension: 'concepto',
        ancla: { cap: 4, modulo: 6, titulo: 'Definición de estratos', lohr: '4.5' },
        pregunta: 'Se estratificó por tamaño con el área del registro, pero el registro tenía el área de hace siete años y algunas fincas que crecieron quedaron en el estrato de las <strong>pequeñas</strong>. Se sorteó y se estimó con ese diseño, tal cual. ¿Qué pasa con el total estimado y con su EE?',
        pista: 'Pregúntate con qué probabilidad entró cada finca en la muestra y con qué peso se estima.',
        opciones: [
          { texto: 'El total sigue insesgado y su EE sigue bien calculado; solo se pierde precisión.', correcta: true,
            retro: 'Cada finca entró con la probabilidad del estrato donde estaba, y se pesa con el inverso de esa probabilidad. Las propiedades del diseño dependen de la estratificación que se usó, no de la que se quiso usar; lo que empeora es la separación entre estratos: menos SSB, menos ganancia.' },
          { texto: 'El total sigue insesgado, pero su EE queda mal calculado, porque la fórmula supone estratos bien formados.', correcta: false,
            retro: 'La fórmula del EE supone que dentro de cada estrato hubo un MAS y que los sorteos de los estratos son independientes, y las dos cosas se cumplen. Su valor probablemente sale más grande que con estratos limpios, pero bien calculado.' },
          { texto: 'El total queda sesgado hacia abajo, aunque su EE sigue bien calculado.', correcta: false,
            retro: 'No hay sesgo: cada finca pesa $N_h/n_h$ del estrato donde se sorteó, que es el inverso de su probabilidad de verdad. Que sean grandes las hace atípicas dentro del estrato, no mal pesadas.' },
          { texto: 'El total queda sesgado hacia abajo, y su EE también queda mal calculado.', correcta: false,
            retro: 'Ni una cosa ni la otra: los pesos corresponden a las probabilidades con que se sorteó, y la fórmula del EE solo pide MAS dentro de cada estrato e independencia entre estratos.' }
        ]
      },

      {
        tipo: 'opcion', id: 'R32', bloque: 'A', modulo: 14, dimension: 'concepto',
        ancla: { cap: 4, modulo: 10, titulo: 'Postestratificación', lohr: '4.7' },
        pregunta: `Un MAS de ${I2.R32.n} fincas se va a postestratificar por tamaño con los $N_h$ del registro. De las ${c2(P2.N, 0)} fincas, ${c2(I2.R32.Nh[2], 0)} son grandes y ${I2.R32.Nh[3]} muy grandes. ¿Qué conviene hacer con las muy grandes?`,
        pista: 'Calcula cuántas fincas de cada celda se esperan en un MAS de ese tamaño, y compáralo con lo que pide el módulo 10 de este capítulo.',
        opciones: [
          { texto: 'Fusionarlas con las grandes y postestratificar con tres celdas.', correcta: true,
            retro: `El módulo 10 pide del orden de 30 casos esperados por celda para dar por buena la varianza aproximada; las muy grandes solas esperan ${c2(I2.R32.esperadas, 1)}, y fusionadas con las grandes, ${c2(I2.R32.esperadas_fusion, 1)}. Además, solas saldrían vacías en el ${pct2(I2.R32.p_vacia)} de las muestras; con una sola finca no hay con qué estimar la varianza de la celda, y con dos o tres el módulo 10 advierte que los pesos se disparan.` },
          { texto: 'Postestratificar con las cuatro celdas: con tres fincas esperadas ya se puede calcular su media.', correcta: false,
            retro: `La media sí, casi siempre; pero con ${c2(I2.R32.esperadas, 1)} casos esperados la varianza de la celda casi no se estima y la aproximación del módulo 10 no es de fiar. Y en el ${pct2(I2.R32.p_vacia)} de las muestras la celda saldría vacía.` },
          { texto: 'Dejar fuera las muy grandes y postestratificar con las otras tres, porque son muy pocas.', correcta: false,
            retro: 'Dejarlas fuera es estimar otra población: la de las fincas que no son muy grandes. El total quedaría sesgado hacia abajo, justo en las que más producen.' },
          { texto: 'No postestratificar por tamaño: con una celda tan chica sale peor que el MAS.', correcta: false,
            retro: 'El problema es esa celda sola, no postestratificar. Fusionándola, el tamaño sigue separando fincas que producen distinto y la postestratificación gana.' }
        ]
      },

      // ==============================================================
      // BLOQUE B · Procedimientos con calculadora (11)
      // ==============================================================
      {
        tipo: 'numerica', id: 'R02', bloque: 'B', modulo: 14, dimension: 'procedimiento',
        ancla: { cap: 3, modulo: 2, titulo: 'El estimador de razón', lohr: '3.1' },
        pregunta: `Un MAS de $n = ${I2.R02.n}$ fincas da una producción media de $\\bar y = ${m2(I2.R02.ybar, 2)}$ cargas y un área media de $\\bar x = ${m2(I2.R02.xbar, 3)}$ ha. El registro da el área total, $t_x = ${m2(I2.R02.tx, 1)}$ ha, de las $N = ${m2(I2.R02.N, 0)}$ fincas. Estima la <strong>producción media por finca por razón</strong>, $\\hat{\\bar y}_r$, en cargas y con dos decimales.`,
        pista: 'El estimador de razón de la media lleva la razón muestral hasta la media poblacional de la auxiliar.',
        respuesta: Number(I2.R02.respuesta.toFixed(2)), tolerancia: 0.035, decimales: 2, unidad: 'cargas por finca',
        retroAcierto: `$\\hat B = ${m2(I2.R02.ybar, 2)}/${m2(I2.R02.xbar, 3)} = ${m2(I2.R02.Bhat, 4)}$ cargas por hectárea y $\\bar x_U = t_x/N = ${m2(I2.R02.xbarU, 4)}$ ha, así que $\\hat{\\bar y}_r = \\hat B\\,\\bar x_U = ${m2(I2.R02.respuesta, 2)}$. La media de la muestra, ${c2(I2.R02.ybar, 2)}, era más alta porque a esta muestra le tocaron fincas más grandes que la media: la razón lo corrige.`,
        retroFallo: `Es $\\hat B\\,\\bar x_U = (${m2(I2.R02.ybar, 2)}/${m2(I2.R02.xbar, 3)}) \\times (${m2(I2.R02.tx, 1)}/${m2(I2.R02.N, 0)}) = ${m2(I2.R02.respuesta, 2)}$. Si te salió ${c2(I2.R02.ybar, 2)}, diste la media muestral, la expansión, sin usar la auxiliar; si te salió una cifra de decenas de miles, calculaste el total $\\hat B\\,t_x$ y no la media.`
      },

      {
        tipo: 'numerica', id: 'R03', bloque: 'B', modulo: 14, dimension: 'procedimiento',
        ancla: { cap: 3, modulo: 2, titulo: 'El estimador de razón', lohr: '3.1' },
        pregunta: `Otra muestra, también un MAS de $n = ${I2.R03.n}$ de las $N = ${m2(I2.R03.N, 0)}$ fincas: $\\bar y = ${m2(I2.R03.ybar, 2)}$, $\\bar x = ${m2(I2.R03.xbar, 3)}$, $s_y = ${m2(I2.R03.sy, 2)}$, $s_x = ${m2(I2.R03.sx, 3)}$ y $r = ${m2(I2.R03.r, 4)}$, con $t_x = ${m2(I2.R03.tx, 1)}$ ha. Calcula el <strong>error estándar de $\\hat t_r$</strong>, en cargas, redondeado a la unidad.`,
        pista: 'La varianza de la razón no se construye con $s_y^2$ sino con la de los residuos respecto de la recta por el origen, y lleva la fpc. La covarianza sale de $r$.',
        respuesta: Math.round(I2.R03.respuesta), tolerancia: 3, decimales: 0, unidad: 'cargas',
        retroAcierto: `Con $\\hat B = ${m2(I2.R03.Bhat, 4)}$ y $s_{xy} = r\\,s_xs_y$, la varianza del residuo es $s_y^2 + \\hat B^2 s_x^2 - 2\\hat B\\,s_{xy} = ${m2(I2.R03.se2, 2)}$, y $\\mathrm{EE}(\\hat t_r) = \\frac{t_x}{\\bar x}\\sqrt{\\frac{1-f}{n}\\cdot ${m2(I2.R03.se2, 2)}} = ${m2(I2.R03.respuesta, 0)}$. Con $N$ en lugar de $t_x/\\bar x$ —la forma del libro— sale ${c2(I2.R03.texto, 0)}: en esta muestra $\\bar x$ quedó casi en $\\bar x_U$ y las dos convenciones coinciden.`,
        retroFallo: `Es $\\frac{t_x}{\\bar x}\\sqrt{\\frac{1-f}{n}\\,(s_y^2 + \\hat B^2 s_x^2 - 2\\hat B\\,r\\,s_x s_y)} = ${m2(I2.R03.respuesta, 0)}$. Si te salió ${c2(I2.R03.con_sy, 0)}, usaste $s_y$ en vez del residuo: ese es el error estándar de la expansión. Si te salió ${c2(I2.R03.sin_fpc, 0)}, olvidaste la fpc $1 - n/N$.`
      },

      {
        tipo: 'numerica', id: 'R08', bloque: 'B', modulo: 14, dimension: 'procedimiento',
        ancla: { cap: 3, modulo: 6, titulo: 'Estimación de regresión', lohr: '3.2' },
        pregunta: `En el Centro hay $N = ${I2.R08.N}$ fincas, y en la población la correlación entre producción y área es $\\rho = ${m2(I2.R08.rho, 4)}$. Con la regresión y un MAS de $n = ${I2.R08.n}$, ¿cuántas fincas necesitaría un MAS con la <strong>expansión</strong> para tener la misma varianza? Usa las varianzas de diseño, con su fpc, y redondea hacia arriba.`,
        pista: 'Escribe la varianza de diseño de cada estimador, con su propio tamaño de muestra y su fpc, e iguálalas. El formulario del capítulo 3 dice qué factor separa la de la regresión de la de la expansión.',
        respuesta: I2.R08.respuesta, tolerancia: 0.5, decimales: 0, unidad: 'fincas',
        retroAcierto: `La regresión deja la varianza del MAS multiplicada por $1-\\rho^2$, así que $\\frac{1}{n_1} - \\frac{1}{N} = (1-\\rho^2)\\left(\\frac{1}{n_2} - \\frac{1}{N}\\right)$ y $n_1 = ${m2(I2.R08.exacto, 2)}$: ${I2.R08.respuesta} fincas. La regresión con ${I2.R08.n} vale como un MAS de ${I2.R08.respuesta} con la expansión.`,
        retroFallo: `Despejando $\\frac{1}{n_1} = \\frac{1}{N} + (1-\\rho^2)\\left(\\frac{1}{n_2} - \\frac{1}{N}\\right)$ sale $n_1 = ${m2(I2.R08.exacto, 2)}$, que se redondea a ${I2.R08.respuesta}. Si te salió ${I2.R08.sin_fpc}, ignoraste la fpc: con ${I2.R08.n} sobre ${I2.R08.N} pesa poco, pero el MAS equivalente ya es un tercio de la subregión y ahí pesa mucho. Si te salió ${I2.R08.con_rho}, usaste $1 - \\rho$ en vez de $1 - \\rho^2$.`
      },

      {
        tipo: 'numerica', id: 'R10', bloque: 'B', modulo: 14, dimension: 'procedimiento',
        ancla: { cap: 3, modulo: 8, titulo: 'Un estimador distinto en cada grupo', lohr: '' },
        pregunta: 'Un estratificado por subregión estimó en cada una la producción media por finca con el estimador que le convenía. Calcula el <strong>error estándar del total del departamento</strong>, en cargas, redondeado a la unidad.' +
          tabla2(['Subregión', '$N_h$', 'Estimador', 'Media estimada', 'EE de la media'],
            ['Norte', 'Centro', 'Sur'].map(h => { const e = I2.R10.est[h];
              return [h, c2(e.N, 0), e.estimador, c2(e.media, 2), c2(e.ee, 3)]; })),
        pista: 'Cada subregión aporta su total, $N_h$ por su media, y su varianza. Recuerda qué se suma cuando los sorteos de las subregiones son independientes.',
        respuesta: Math.round(I2.R10.respuesta), tolerancia: 2, decimales: 0, unidad: 'cargas',
        retroAcierto: `$\\widehat V(\\hat t) = \\sum_h N_h^2\\,\\widehat V(\\hat{\\bar y}_h)$, sin términos cruzados porque los tres sorteos son independientes, y la raíz da ${c2(I2.R10.respuesta, 0)} cargas, sobre un total de ${c2(I2.R10.total, 0)}. Es lo que permite mezclar tres estimadores distintos en una sola cuenta: cada sumando es legítimo en su estrato.`,
        retroFallo: `Se suman las varianzas, no los errores estándar: $\\sqrt{\\sum_h N_h^2\\,\\mathrm{EE}_h^2} = ${m2(I2.R10.respuesta, 0)}$. Si te salió ${c2(I2.R10.suma_ee, 0)}, sumaste los $N_h\\,\\mathrm{EE}_h$; si te salió ${c2(I2.R10.con_N, 0)}, usaste el $N$ del departamento en vez del $N_h$ de cada subregión.`
      },

      {
        tipo: 'numerica', id: 'R11', bloque: 'B', modulo: 14, dimension: 'procedimiento',
        ancla: { cap: 3, modulo: 9, titulo: 'Estimación en dominios', lohr: '3.3' },
        pregunta: `En un MAS de $n = ${I2.R11.n}$ de las $N = ${m2(I2.R11.N, 0)}$ fincas, ${I2.R11.nd} resultaron <strong>certificadas</strong>; el registro no dice cuántas certificadas hay en el departamento. Con $u_k = y_k\\delta_k$ (la producción si la finca es certificada y 0 si no), la muestra da $\\bar u = ${m2(I2.R11.ubar, 3)}$ y $s_u = ${m2(I2.R11.su, 3)}$; entre las certificadas, $\\bar y_d = ${m2(I2.R11.ybar_d, 2)}$ y $s_{yd} = ${m2(I2.R11.sy_d, 2)}$. Calcula el <strong>error estándar del total de producción de las certificadas</strong>, en cargas, redondeado a la unidad.`,
        pista: 'Sin $N_d$ no hay con qué escalar la media del dominio. Fíjate en qué cifras del enunciado necesitas de verdad.',
        respuesta: Math.round(I2.R11.respuesta), tolerancia: 3, decimales: 0, unidad: 'cargas',
        retroAcierto: `$\\hat t_{yd} = N\\bar u = ${m2(I2.R11.total, 0)}$ cargas y $\\mathrm{EE} = N\\sqrt{\\frac{1-f}{n}}\\,s_u = ${m2(I2.R11.respuesta, 0)}$. Las cifras de dentro del dominio sobraban: sirven para la media del dominio, no para el total con $N_d$ desconocido, que paga además la incertidumbre sobre cuántas certificadas hay.`,
        retroFallo: `Con $N_d$ desconocido, $\\mathrm{EE}(\\hat t_{yd}) = N\\sqrt{(1-f)/n}\\;s_u = ${m2(I2.R11.respuesta, 0)}$. Si te salió ${c2(I2.R11.como_fijo, 0)}, trataste a las ${I2.R11.nd} certificadas como un MAS de tamaño fijo y escalaste con $\\hat N_d$: así se esconde la incertidumbre de no saber cuántas hay, que entra por $s_u$.`
      },

      {
        tipo: 'numerica', id: 'R19', bloque: 'B', modulo: 14, dimension: 'procedimiento',
        ancla: { cap: 4, modulo: 3, titulo: 'Pesos y estimación', lohr: '4.2' },
        pregunta: 'Un estratificado por tamaño con asignación proporcional de 120 fincas da esta tabla. Calcula el <strong>error estándar del total estratificado</strong> de producción, en cargas, redondeado a la unidad.' +
          tabla2(['Estrato', '$N_h$', '$n_h$', '$\\bar y_h$', '$s_h$'],
            NOMBRES_TAM.map((h, i) => [h, c2(I2.R19.Nh[i], 0), I2.R19.nh[i], c2(I2.R19.yh[i], 2), c2(I2.R19.sh[i], 2)])),
        pista: 'Cada estrato aporta su propia varianza, con su $N_h^2$ y su propia fpc. La raíz va al final.',
        respuesta: Math.round(I2.R19.respuesta), tolerancia: 2, decimales: 0, unidad: 'cargas',
        retroAcierto: `$\\sqrt{\\sum_h N_h^2\\,(1 - n_h/N_h)\\,s_h^2/n_h} = ${m2(I2.R19.respuesta, 0)}$, sobre un total estimado de ${c2(I2.R19.total, 0)} cargas. Mira de dónde sale: el estrato de las muy grandes, con ${I2.R19.nh[3]} fincas de las ${I2.R19.nh.reduce((a, b) => a + b, 0)} de la muestra, aporta el ${pct2(I2.R19.Nh[3] ** 2 * (1 - I2.R19.nh[3] / I2.R19.Nh[3]) * I2.R19.sh[3] ** 2 / I2.R19.nh[3] / I2.R19.respuesta ** 2, 0)} de la varianza.`,
        retroFallo: `Es $\\sqrt{\\sum_h N_h^2(1-n_h/N_h)s_h^2/n_h} = ${m2(I2.R19.respuesta, 0)}$. Si te salió ${c2(I2.R19.sin_fpc, 0)}, olvidaste la fpc de cada estrato; si te salió algo del orden de ${c2(I2.R19.sin_N2, 0)}, multiplicaste por $N^2$ global en vez de por cada $N_h^2$.`
      },

      {
        tipo: 'numerica', id: 'R22', bloque: 'B', modulo: 14, dimension: 'procedimiento',
        ancla: { cap: 4, modulo: 4, titulo: 'Asignación de observaciones', lohr: '4.4' },
        pregunta: `Se van a repartir $n = ${I2.R22.n}$ fincas entre los cuatro estratos de tamaño con la asignación de <strong>Neyman</strong>, usando las desviaciones del censo anterior. ¿Cuántas le tocan al estrato de las <strong>grandes</strong>? Redondea al entero más cercano.` +
          tabla2(['Estrato', '$N_h$', '$S_h$'], NOMBRES_TAM.map((h, i) => [h, c2(I2.R22.Nh[i], 0), c2(I2.R22.Sh[i], 2)])),
        pista: 'Neyman reparte en proporción al tamaño por la dispersión de cada estrato.',
        respuesta: I2.R22.respuesta, tolerancia: 0.5, decimales: 0, unidad: 'fincas',
        retroAcierto: `$n_h = n\\,N_hS_h/\\sum_g N_gS_g = ${I2.R22.n} \\times ${m2(I2.R22.NS[2], 2)}/${m2(I2.R22.NS.reduce((a, b) => a + b, 0), 2)} = ${m2(I2.R22.ney[2], 2)}$. Con la proporcional le tocarían ${Math.round(I2.R22.prop[2])}: Neyman casi duplica las grandes porque son el ${pct2(I2.R22.Nh[2] / P2.N)} de las fincas pero llevan una dispersión que dobla con creces la de las medianas.`,
        retroFallo: `Es ${I2.R22.n} por la fracción $N_hS_h/\\sum N_gS_g$ del estrato, $${m2(I2.R22.ney[2], 2)}$. Si te salió ${Math.round(I2.R22.prop[2])}, aplicaste la proporcional, que ignora las $S_h$; si te salió ${Math.round(I2.R22.NS2[2])}, usaste $N_hS_h^2$: Neyman va con la desviación, no con la varianza.`
      },

      {
        tipo: 'numerica', id: 'R24', bloque: 'B', modulo: 14, dimension: 'procedimiento',
        ancla: { cap: 4, modulo: 5, titulo: 'Asignación óptima con costos', lohr: '4.4' },
        pregunta: `Visitar una finca cuesta distinto según su tamaño, y hay un presupuesto de $C = ${m2(I2.R24.C, 0)}$ miles de pesos. Con la <strong>asignación óptima con costos</strong>, ¿cuántas fincas se visitan en total? Calcula las $n_h$ sin redondearlas, súmalas y redondea el total al entero más cercano.` +
          tabla2(['Estrato', '$N_h$', '$S_h$', '$c_h$ (miles de pesos)'],
            NOMBRES_TAM.map((h, i) => [h, c2(I2.R24.Nh[i], 0), c2(I2.R24.Sh[i], 2), I2.R24.costo[i]])),
        pista: 'La óptima con costos reparte en proporción a una cantidad por estrato, y la constante de proporcionalidad la fija el presupuesto. Aquí no se fija $n$: se obtiene.',
        respuesta: I2.R24.respuesta, tolerancia: 0.5, decimales: 0, unidad: 'fincas',
        retroAcierto: `Con $n_h = k\\,N_hS_h/\\sqrt{c_h}$ y $k = C/\\sum_h N_hS_h\\sqrt{c_h}$, las cuatro asignaciones son ${I2.R24.nh.map(v => c2(v, 1)).join(' · ')}, que suman ${c2(I2.R24.n_total, 2)}: ${I2.R24.respuesta} fincas. El costo entra con raíz: visitar una muy grande cuesta ${c2(I2.R24.costo[3] / I2.R24.costo[0], 2)} veces lo que una pequeña, pero su asignación relativa solo se divide por $\\sqrt{${m2(I2.R24.costo[3] / I2.R24.costo[0], 2)}} = ${m2(Math.sqrt(I2.R24.costo[3] / I2.R24.costo[0]), 2)}$.`,
        retroFallo: `Las $n_h$ son proporcionales a $N_hS_h/\\sqrt{c_h}$ y gastan exactamente $C$: ${I2.R24.nh.map(v => c2(v, 1)).join(' + ')} = ${c2(I2.R24.n_total, 2)}. Si te salió ${I2.R24.nh.reduce((a, v) => a + Math.round(v), 0)}, redondeaste cada $n_h$ antes de sumar. Si dividiste entre $c_h$ en vez de entre $\\sqrt{c_h}$, castigaste de más los estratos caros: el costo entra con raíz porque sale de la misma cuenta de Lagrange que Neyman.`
      },

      {
        tipo: 'numerica', id: 'R28', bloque: 'B', modulo: 14, dimension: 'procedimiento',
        ancla: { cap: 4, modulo: 8, titulo: 'El efecto de diseño', lohr: '7.5' },
        pregunta: `Con $n = ${I2.R28.n}$ fincas y sin la fpc, el error estándar del total es ${c2(I2.R28.ee_mas, 1)} cargas bajo un MAS y ${c2(I2.R28.ee_str, 1)} bajo el estratificado por tamaño con Neyman. Una encuesta necesitaría $n_0 = ${I2.R28.n0}$ fincas con un MAS para la precisión que se busca. ¿Cuántas necesita con este estratificado, con la misma asignación relativa? Ignora también aquí la fpc y redondea hacia arriba.`,
        pista: 'El deff es un cociente de varianzas. Y el tamaño efectivo dice cuántas fincas de MAS vale cada una del diseño; aquí se pide el camino inverso.',
        respuesta: I2.R28.respuesta, tolerancia: 0.5, decimales: 0, unidad: 'fincas',
        retroAcierto: `$\\text{deff} = (${m2(I2.R28.ee_str, 1)}/${m2(I2.R28.ee_mas, 1)})^2 = ${m2(I2.R28.deff, 4)}$, que sin fpc no depende de $n$, y $n = n_0\\cdot\\text{deff} = ${m2(I2.R28.n0 * I2.R28.deff, 2)}$: ${I2.R28.respuesta} fincas. Es el camino inverso de $n_{\\text{ef}} = n/\\text{deff}$, y es el $v/S^2$ con que el módulo 5 dimensiona la muestra.`,
        retroFallo: `El deff es el cuadrado del cociente de errores estándar, $${m2(I2.R28.deff, 4)}$, y $n = ${I2.R28.n0}\\times${m2(I2.R28.deff, 4)}$ redondeado hacia arriba: ${I2.R28.respuesta}. Si te salió ${I2.R28.con_ee}, usaste el cociente de errores estándar sin elevarlo; si te salió ${c2(I2.R28.dividir, 0)}, dividiste entre el deff, que es como pedirle al estratificado más fincas que al MAS.`
      },

      {
        tipo: 'numerica', id: 'R30', bloque: 'B', modulo: 14, dimension: 'procedimiento',
        ancla: { cap: 4, modulo: 9, titulo: 'Estratificado con probabilidades proporcionales', lohr: '' },
        pregunta: `En el estrato de las <strong>muy grandes</strong> ($N_h = ${I2.R30.Nh}$ fincas, $${m2(I2.R30.sum_area, 1)}$ ha en total) se hacen $m_h = ${I2.R30.m}$ extracciones <strong>con reemplazo</strong>, cada una con probabilidad proporcional al área: $\\psi_k = x_k/\\sum_{U_h} x_l$. Con lo que salió, estima por <strong>Hansen–Hurwitz</strong> la producción total del estrato, en cargas, redondeada a la unidad.` +
          tabla2(['Extracción', 'Área $x_k$ (ha)', 'Producción $y_k$ (cargas)'],
            I2.R30.area.map((a, i) => [i + 1, c2(a, 1), c2(I2.R30.y[i], 1)])),
        pista: 'Cada extracción, por sí sola, da una estimación del total del estrato. Hansen–Hurwitz las combina.',
        respuesta: Math.round(I2.R30.respuesta), tolerancia: 2, decimales: 0, unidad: 'cargas',
        retroAcierto: `$\\hat t_{y,h} = \\frac{1}{m_h}\\sum y_{k_i}/\\psi_{k_i} = \\frac{${m2(I2.R30.sum_area, 1)}}{${I2.R30.m}}\\sum y_{k_i}/x_{k_i} = ${m2(I2.R30.respuesta, 0)}$ cargas, frente a un total verdadero de ${c2(I2.R30.t_verdadero, 1)}.${I2.R30.area.some((a, i) => I2.R30.area.indexOf(a) !== i && I2.R30.y[I2.R30.area.indexOf(a)] === I2.R30.y[i]) ? ' Fíjate en que una finca salió dos veces: con reemplazo puede pasar, y se cuenta dos veces, que es el precio del atajo del módulo 9.' : ''}`,
        retroFallo: `Es el promedio de los ${I2.R30.m} cocientes $y_k/\\psi_k$, con $\\psi_k = x_k/${m2(I2.R30.sum_area, 1)}$: ${c2(I2.R30.respuesta, 0)}. Si te salió ${c2(I2.R30.expansion, 0)}, trataste las extracciones como un MAS y expandiste con $N_h\\bar y$: con probabilidades desiguales cada finca se pondera por su $1/\\psi_k$, no por $N_h/m_h$.`
      },

      {
        tipo: 'numerica', id: 'R31', bloque: 'B', modulo: 14, dimension: 'procedimiento',
        ancla: { cap: 4, modulo: 10, titulo: 'Postestratificación', lohr: '4.7' },
        pregunta: `El registro no dice si cada finca es de su dueño, arrendada o en aparcería, pero el censo agropecuario sí da cuántas hay de cada tipo. Un MAS de $n = ${I2.R31.n}$ fincas da esta tabla. Calcula la <strong>producción media por finca postestratificada</strong> por tenencia, en cargas, con dos decimales.` +
          tabla2(['Tenencia', '$N_h$ (censo)', '$n_h$', '$\\bar y_h$'],
            DP2.tenencia.nombres.map((h, i) => [h, c2(I2.R31.Nh[i], 0), I2.R31.nh[i], c2(I2.R31.yh[i], 2)])),
        pista: 'Es la fórmula del estratificado aplicada con los $n_h$ que salieron. Pregúntate con qué pesa cada media de celda.',
        respuesta: Number(I2.R31.respuesta.toFixed(2)), tolerancia: 0.015, decimales: 2, unidad: 'cargas por finca',
        retroAcierto: `$\\bar y_{\\text{post}} = \\sum_h W_h\\bar y_h = ${m2(I2.R31.respuesta, 2)}$, con $W_h = N_h/N$. La media muestral sin postestratificar era ${c2(I2.R31.bruta, 2)}: en esta muestra salieron más propietarios de la cuenta, y los propietarios producen más. Ojo con las celdas chicas: en un MAS de ${I2.R31.n}, arrendatarios y aparceros esperan ${c2(I2.R31.n * I2.R31.Nh[1] / P2.N, 1)} y ${c2(I2.R31.n * I2.R31.Nh[2] / P2.N, 1)} casos, por debajo de los 30 del módulo 10. La media se calcula igual, pero su varianza aproximada no sería de fiar.`,
        retroFallo: `Es $\\sum_h (N_h/N)\\,\\bar y_h = ${m2(I2.R31.respuesta, 2)}$. Si te salió ${c2(I2.R31.bruta, 2)}, ponderaste con los $n_h$ de la muestra, que es la media sin postestratificar; si te salió ${c2(I2.R31.iguales, 2)}, promediaste las tres medias con el mismo peso.`
      },

      // ==============================================================
      // BLOQUE C · Interpretación (6)
      // ==============================================================
      {
        tipo: 'opcion', id: 'R05', bloque: 'C', modulo: 14, dimension: 'interpretacion',
        ancla: { cap: 3, modulo: 4, titulo: 'Sesgo y error cuadrático medio', lohr: '3.1' },
        pregunta: `Un MAS de solo $n = ${I2.R05.n}$ de las $N = ${m2(I2.R05.N, 0)}$ fincas da $s_x = ${m2(I2.R05.sx, 3)}$ y $\\bar x = ${m2(I2.R05.xbar, 3)}$, y con ellas $\\widehat{\\text{CV}}(\\hat{\\bar x}) = ${m2(I2.R05.cv_xbar, 2)}$. ¿Qué dice esa cifra del sesgo del estimador de razón con esta muestra?`,
        pista: 'Recuerda qué acota exactamente la cota del módulo 4 del capítulo 3 y con qué umbral la compara la regla de Kish.',
        opciones: [
          { texto: `Que no se puede dar por despreciable: la cota pasa del ${c2(DP2.meta.kish, 1)} de Kish.`, correcta: true,
            retro: `La cota es $|\\text{Sesgo}|/\\text{EE} \\le \\text{CV}(\\hat{\\bar x})$, y aquí pasa del umbral más laxo de la regla de Kish. Se baja con más fincas, con una auxiliar de menor CV o con una relación más cercana a la proporcional. Medido con ${c2(I2.R05.replicas, 0)} réplicas, el sesgo de verdad es ${c2(I2.R05.sesgo_rel, 2)} errores estándar, por debajo de la cota; pero eso solo se sabe con el censo, y con una muestra lo que se tiene es la cota.` },
          { texto: `Que el sesgo vale ${c2(I2.R05.cv_xbar, 2)} errores estándar, que es lo que da la fórmula.`, correcta: false,
            retro: `Es una cota, no un valor: dice hasta dónde puede llegar el sesgo, y es conservadora. El medido con ${c2(I2.R05.replicas, 0)} réplicas es ${c2(I2.R05.sesgo_rel, 2)} errores estándar.` },
          { texto: `Que el estimador probablemente sobrestima el total en torno a un ${c2(100 * I2.R05.cv_xbar, 0)} %.`, correcta: false,
            retro: 'Un coeficiente de variación no es un sesgo relativo al total, y la cota no dice el signo: acota el tamaño del sesgo medido en errores estándar.' },
          { texto: 'Que es despreciable, porque el sesgo es de orden $1/n$ y el error estándar de orden $1/\\sqrt n$.', correcta: false,
            retro: `Esa comparación de órdenes dice que el sesgo pierde peso al crecer $n$, no que sea pequeño con ${I2.R05.n} fincas. Con una muestra tan chica es justo cuando hay que mirar la cota.` }
        ]
      },

      {
        tipo: 'opcion', id: 'R07', bloque: 'C', modulo: 14, dimension: 'interpretacion',
        ancla: { cap: 3, modulo: 6, titulo: 'Estimación de regresión', lohr: '3.2' },
        pregunta: `Con un MAS de solo ${I2.R07.n} fincas de una zona, la regresión de la producción sobre el área da esta salida. Para elegir entre razón y regresión en esa zona, ¿qué se concluye?` + salida2(I2.R07.salida),
        pista: 'El módulo 6 del capítulo 3 dice qué decide el contraste del intercepto, y añade tres cosas que el contraste no dice solo.',
        opciones: [
          { texto: 'Nada concluyente: no rechazar no prueba que la recta pase por el origen.', correcta: true,
            retro: `«p = ${c2(I2.R07.p0, 3)}» dice que estos datos no distinguen el intercepto de cero, no que valga cero: con ${I2.R07.n} fincas se estima con mucho ruido (mira su error estándar), y deciden la nube y lo que se sepa de la zona. Y en esta población la zona sí tiene intercepto: ${c2(I2.R07.b0_pob, 2)} cargas, los lotes que el registro no ve.` },
          { texto: 'La razón: el contraste no rechaza el intercepto nulo, luego la recta pasa por el origen.', correcta: false,
            retro: 'Es el criterio del módulo 6 del capítulo 3 leído sin su letra pequeña: no rechazar no es demostrar, y con una muestra tan chica el contraste puede no ver un intercepto que existe. Concluir que la recta pasa por el origen es leer de más.' },
          { texto: 'La expansión: si el intercepto no es significativo, el área no está ayudando.', correcta: false,
            retro: 'La que dice si el área ayuda es la pendiente, y la pendiente es claramente significativa. El intercepto solo decide qué recta se usa, no si se usa una.' },
          { texto: 'La regresión: el intercepto estimado es positivo, y eso descarta la recta por el origen.', correcta: false,
            retro: `Un intercepto positivo con p = ${c2(I2.R07.p0, 3)} es compatible con cero: el signo de una estimación tan ruidosa no decide nada. La regresión puede acabar siendo la buena aquí, pero no por esa razón.` }
        ]
      },

      {
        tipo: 'opcion', id: 'R14', bloque: 'C', modulo: 14, dimension: 'interpretacion',
        ancla: { cap: 3, modulo: 11, titulo: 'El estimador general de regresión (GREG)', lohr: '' },
        pregunta: `Un MAS de ${I2.R14.n} fincas se calibra con <code>calibrate()</code> al número de fincas, al área total y al área en levante del registro. Antes y después de calibrar, <code>svytotal</code> da esto. La producción estimada pasó de ${c2(I2.R14.y_total_antes, 0)} a ${c2(I2.R14.y_total_despues, 0)} cargas: ¿por qué subió?` +
          '<p style="margin:0.5rem 0 0;">Las dos áreas, antes de calibrar:</p>' + salida2(I2.R14.antes) +
          '<p style="margin:0.5rem 0 0;">La producción, antes y después:</p>' + salida2(I2.R14.y_antes + '\n' + I2.R14.y_despues),
        pista: 'Los pesos calibrados tienen que reproducir los totales del registro. Compara esos totales con lo que la muestra estimaba antes.',
        opciones: [
          { texto: 'Porque la muestra se había quedado corta en área, y los pesos la corrigieron hacia arriba.', correcta: true,
            retro: `La muestra estimó ${c2(I2.R14.area_antes, 1)} ha frente a las ${c2(I2.R14.tx, 1)} del registro: le tocaron pocas fincas grandes. Para cuadrar el área, los pesos de esas fincas suben, y como la producción va con el área, su estimación sube con ellos. La verdad, que aquí se conoce, es ${c2(P2.ty, 0)} cargas.` },
          { texto: 'Porque la muestra se había pasado de área en levante, y los pesos la corrigieron hacia abajo.', correcta: false,
            retro: 'La salida dice lo contrario: antes de calibrar, el área en levante estimada estaba por debajo de la del registro, no por encima. Y la que mueve la producción es el área total, que se había quedado corta.' },
          { texto: 'Porque la calibración corrigió el sesgo que el MAS tenía en esta muestra.', correcta: false,
            retro: 'El MAS es insesgado: el sesgo es una propiedad del diseño, no de una muestra. Lo que tenía esta muestra era mala suerte —pocas fincas grandes—, y eso es lo que los pesos corrigen.' },
          { texto: 'Porque al bajar el error estándar la estimación se acercó a la verdad.', correcta: false,
            retro: 'Un error estándar menor habla de la variabilidad del estimador sobre muchas muestras, no de esta estimación. El cambio de esta cifra lo explican las áreas.' }
        ]
      },

      {
        tipo: 'opcion', id: 'R20', bloque: 'C', modulo: 14, dimension: 'interpretacion',
        ancla: { cap: 4, modulo: 3, titulo: 'Pesos y estimación', lohr: '4.2' },
        pregunta: 'Sobre la <strong>misma</strong> muestra estratificada por tamaño, dos analistas declaran el diseño con los mismos pesos y con fpc; uno añade <code>strata = ~tam</code> y el otro no. Estas son sus salidas de <code>svytotal</code>, en ese orden:' +
          salida2(I2.R20.bien) + salida2(I2.R20.mal) + '¿Cuál corresponde al diseño, y qué se afirma con la otra?',
        pista: 'El total sale igual porque los pesos son los mismos. Lo que cambia es lo que <code>survey</code> cree sobre cómo se sorteó.',
        opciones: [
          { texto: 'La que declara los estratos; la que no, está mal.', correcta: true,
            retro: `Sin <code>strata=</code>, <code>survey</code> calcula la varianza como si las fincas hubieran salido de una sola urna, y mete en el error estándar la distancia entre estratos, que el diseño fijó y no sorteó. Por eso pasa de ${c2(I2.R20.ee_bien, 1)} a ${c2(I2.R20.ee_mal, 1)} sin una sola finca distinta.` },
          { texto: 'La que declara los estratos; la que no, también vale, solo que es más conservadora.', correcta: false,
            retro: 'Más grande sí sale, pero no es el error estándar de este diseño: es el de una urna única que no se usó. Que un error salga por exceso no lo vuelve válido, y aquí hace parecer inútil una estratificación que sí ganó.' },
          { texto: 'La que no los declara; la que sí, está mal.', correcta: false,
            retro: 'Declarar los estratos es decirle a <code>survey</code> cómo se sorteó, y aquí se sorteó dentro de cada estrato. La que los omite describe un sorteo que no se hizo.' },
          { texto: 'La que no los declara; la que sí, también vale, solo que es más optimista.', correcta: false,
            retro: 'No es optimista: es la del diseño que se usó. La otra le añade al error estándar una variabilidad entre estratos que el sorteo no tuvo.' }
        ]
      },

      {
        tipo: 'opcion', id: 'R25', bloque: 'C', modulo: 14, dimension: 'interpretacion',
        ancla: { cap: 4, modulo: 5, titulo: 'Asignación óptima con costos', lohr: '4.4' },
        pregunta: `Con las mismas fincas en total, se compara la proporcional por tamaño (A) con <strong>censar las ${E2.Nh[3]} muy grandes</strong> y repartir el resto proporcionalmente (B), para dos tamaños de muestra. ¿Qué lectura es la correcta?` +
          tabla2(['$n$', 'Diseño', ...NOMBRES_TAM, 'EE del total'],
            I2.R25.flatMap(r => [
              [r.n, 'A · proporcional', ...r.nA, c2(r.ee_A, 0)],
              [r.n, 'B · censa las muy grandes', ...r.nB, c2(r.ee_B, 0)]])),
        pista: 'Un estrato censado tiene fpc igual a 0. Mira también cuántas fincas le quedan a los demás estratos.',
        opciones: [
          { texto: `Censar elimina toda la varianza de las muy grandes, pero cuesta ${E2.Nh[3]} fincas: con ${I2.R25[0].n} no compensa, con ${I2.R25[1].n} sí.`, correcta: true,
            retro: `Un estrato de certeza no aporta nada a la varianza, y aquí las muy grandes son las más dispersas. Pero sus ${E2.Nh[3]} fincas salen del mismo presupuesto: con ${I2.R25[0].n} en total, a los demás estratos les quedan muy pocas y el EE sube de ${c2(I2.R25[0].ee_A, 0)} a ${c2(I2.R25[0].ee_B, 0)}; con ${I2.R25[1].n}, baja de ${c2(I2.R25[1].ee_A, 0)} a ${c2(I2.R25[1].ee_B, 0)}.` },
          { texto: `Censar gana con ${I2.R25[0].n} y con ${I2.R25[1].n}, aunque con ${I2.R25[0].n} la ventaja es pequeña.`, correcta: false,
            retro: `Con ${I2.R25[0].n} fincas no gana: el EE sube. El censo se come la muestra de los otros tres estratos.` },
          { texto: `Censar pierde con ${I2.R25[0].n} y con ${I2.R25[1].n}, porque deja menos muestra al resto.`, correcta: false,
            retro: `Con ${I2.R25[1].n} fincas gana: la muestra que le quita al resto pesa menos que la varianza que elimina.` },
          { texto: `Con ${I2.R25[0].n} pierde porque censar sesga el total hacia las grandes; con ${I2.R25[1].n} el sesgo ya pesa menos.`, correcta: false,
            retro: 'Censar no sesga nada: las muy grandes entran con probabilidad 1 y peso 1, y se representan solo a sí mismas. Lo que pasa con 100 es varianza, por la muestra que les queda a los demás.' }
        ]
      },

      {
        tipo: 'opcion', id: 'R29', bloque: 'C', modulo: 14, dimension: 'interpretacion',
        ancla: { cap: 4, modulo: 8, titulo: 'El efecto de diseño', lohr: '7.5' },
        pregunta: `El mismo estratificado proporcional por tamaño, con $n = ${I2.R29.n}$, tiene deff exacto ${c2(I2.R29.deff_y, 3)} para la producción y ${c2(I2.R29.deff_pers, 3)} para el número de personas que viven en la finca. Un informe dice: «el diseño tiene deff ${c2(I2.R29.deff_y, 2)}, así que las ${I2.R29.n} fincas valen como ${c2(I2.R29.nef_y, 0)} de un MAS». ¿Qué es lo correcto?`,
        pista: 'Repasa la definición del deff en el módulo 8 de este capítulo: qué dos varianzas compara.',
        opciones: [
          { texto: `El deff nunca es del diseño a secas: para la producción vale, y para las personas las ${I2.R29.n} valen casi como ${I2.R29.n}.`, correcta: true,
            retro: `El deff compara la varianza de un estimador con la de un MAS del mismo $n$: es de cada estimación. El tamaño separa mucho la producción y casi nada el número de personas, así que el mismo diseño rinde como ${c2(I2.R29.nef_y, 0)} fincas para una cifra y como ${c2(I2.R29.nef_pers, 0)} para la otra.` },
          { texto: 'Vale para la producción y para las personas, porque el deff es una propiedad del diseño muestral.', correcta: false,
            retro: 'El diseño es el mismo para las dos variables y sus deff son muy distintos: el deff depende del diseño y de la variable que se estima.' },
          { texto: 'Vale para la producción; para las personas el diseño pierde, porque su deff es mayor que el de la producción.', correcta: false,
            retro: 'Perder es tener un deff mayor que 1. El de las personas está justo por debajo: el diseño casi no gana, pero no pierde.' },
          { texto: 'No vale para ninguna de las dos: un deff exacto solo se calcula con un MAS real al lado.', correcta: false,
            retro: 'Con el censo, la varianza del MAS se calcula sin sortear nada, y también la del diseño: eso es un deff exacto. Lo que sí necesita una muestra es un deff estimado.' }
        ]
      },

      // ==============================================================
      // BLOQUE D · Análisis gráfico (5)
      // ==============================================================
      {
        tipo: 'grafico', id: 'R04', bloque: 'D', modulo: 14, dimension: 'grafico',
        ancla: { cap: 3, modulo: 3, titulo: '¿Cuándo gana la razón?', lohr: '3.1' },
        alto: 260,
        descripcionGrafico: `Nube de ${I2.R04.n_puntos} fincas con el área dividida por su media en el eje horizontal y, en el vertical, dos variables divididas cada una por su media: la producción, que sube a lo largo de la diagonal, y el número de personas que viven en la finca, que forma una franja horizontal alrededor de 1. Una diagonal de pendiente 1 marca la recta de la razón.`,
        pregunta: 'La misma auxiliar, el <strong>área</strong>, para dos variables distintas: la <strong>producción</strong> y el <strong>número de personas que viven en la finca</strong>. Las tres van divididas por su media, así que la recta del estimador de razón es la diagonal. ¿Qué le pasa a la razón frente a la expansión con cada variable?',
        pista: 'Recuerda contra qué compara la correlación el umbral del módulo 3 del capítulo 3, y qué papel juega en él el CV de cada variable.',
        dibujar: canvas => {
          const R = I2.R04, mx = P2.media_area, my = P2.ybarU, mp = R.pers.media;
          const xs = R.area.map(a => a / mx);
          const g = crearGraficoXY(canvas, [
            { type: 'scatter', label: 'Producción / su media', data: xs.map((x, i) => ({ x: x, y: R.y[i] / my })),
              backgroundColor: COLORES_GRAFICO.primario + 'aa', pointRadius: 2.5 },
            { type: 'scatter', label: 'Personas / su media', data: xs.map((x, i) => ({ x: x, y: R.personas[i] / mp })),
              backgroundColor: '#FF6600aa', pointRadius: 2.5 },
            { type: 'line', label: 'Recta de la razón', data: [{ x: 0, y: 0 }, { x: 6, y: 6 }],
              borderColor: '#6B7280', borderDash: [6, 4], borderWidth: 1.5, pointRadius: 0, fill: false }
          ], { tituloX: 'Área / su media', tituloY: 'Variable / su media', xMin: 0, xMax: 6 });
          g.options.scales.y.max = 6;
          g.update('none');
          return g;
        },
        opciones: [
          { texto: 'Gana con la producción y pierde con las personas.', correcta: true,
            retro: `La producción sube con el área: $\\rho = ${m2(I2.R04.prod.rho, 2)}$ contra un umbral de $${m2(I2.R04.prod.umbral, 2)}$. Las personas casi no cambian con el área ($\\rho = ${m2(I2.R04.pers.rho, 2)}$) y su CV es menos de la mitad del del área: su umbral es ${c2(I2.R04.pers.umbral, 2)}, más que 1, así que ninguna correlación alcanzaría. Con ${I2.R04.n_ee} fincas, la razón baja el EE de la producción de ${c2(I2.R04.prod.ee_exp, 0)} a ${c2(I2.R04.prod.ee_raz, 0)} y sube el de las personas de ${c2(I2.R04.pers.ee_exp, 0)} a ${c2(I2.R04.pers.ee_raz, 0)}.` },
          { texto: 'Gana con las dos, aunque con las personas gana menos.', correcta: false,
            retro: 'Una auxiliar no es buena o mala en abstracto: lo es para la variable que se mide. Con las personas la razón no gana menos: pierde, y por mucho.' },
          { texto: 'Pierde con la producción y gana con las personas.', correcta: false,
            retro: 'Que una variable varíe poco es justo lo que sube el umbral $\\tfrac12\\,\\text{CV}(x)/\\text{CV}(y)$: la expansión ya es precisa, y forzarla a seguir al área solo le mete la variabilidad del área.' },
          { texto: 'Pierde con las dos, porque ninguna nube pasa exactamente por el origen.', correcta: false,
            retro: 'No hace falta que pase exactamente: basta que la recta por el origen describa bien la nube y que la correlación pase del umbral. La producción lo cumple con holgura.' }
        ]
      },

      {
        tipo: 'grafico', id: 'R15', bloque: 'D', modulo: 14, dimension: 'grafico',
        ancla: { cap: 3, modulo: 12, titulo: 'Parámetros no lineales: la mediana', lohr: '' },
        alto: 240,
        descripcionGrafico: `Escalera de la función de distribución estimada con pesos, a partir de ${I2.R15.y.length} fincas de un estratificado por tamaño, con una línea horizontal en ${c2(I2.R15.p, 1)}. Los escalones son de alturas distintas porque las fincas pesan distinto.`,
        pregunta: `Un estratificado por tamaño con <strong>${I2.R15.por_estrato} fincas por estrato</strong> da esta $\\hat F(t)$ de la producción: cada escalón mide el peso de la finca dividido por la suma de los pesos, y por eso son de alturas distintas. Con la definición del módulo 12 del capítulo 3, $\\hat Q(${m2(I2.R15.p, 1)}) = \\inf\\{t : \\hat F(t) \\ge ${m2(I2.R15.p, 1)}\\}$, ¿cuál es la <strong>mediana estimada</strong>?`,
        pista: 'La definición pide el ínfimo de un conjunto de valores de $t$. Pregúntate cuáles son esos valores en la escalera.',
        dibujar: canvas => {
          const R = I2.R15;
          const pts = [{ x: 0, y: 0 }];
          R.y.forEach((v, i) => { pts.push({ x: v, y: i ? R.F[i - 1] : 0 }); pts.push({ x: v, y: R.F[i] }); });
          pts.push({ x: 120, y: 1 });
          const g = crearGraficoXY(canvas, [
            { type: 'line', label: 'F̂(t) con pesos', data: pts, borderColor: COLORES_GRAFICO.primario,
              borderWidth: 2, pointRadius: 0, fill: false },
            { type: 'line', label: `p = ${c2(R.p, 1)}`, data: [{ x: 0, y: R.p }, { x: 120, y: R.p }],
              borderColor: '#FF6600', borderDash: [6, 4], borderWidth: 1.5, pointRadius: 0, fill: false }
          ], { tituloX: 'Producción (cargas)', tituloY: 'F̂(t)', xMin: 0, xMax: 40 });
          g.options.scales.y.max = 1;
          g.update('none');
          return g;
        },
        opciones: [
          { texto: `${c2(I2.R15.mediana, 1)} cargas`, correcta: true,
            retro: `Es el primer valor en el que la escalera alcanza ${c2(I2.R15.p, 1)}: justo antes, $\\hat F$ vale ${c2(I2.R15.F[I2.R15.y.indexOf(I2.R15.mediana) - 1], 4)}, y en ${c2(I2.R15.mediana, 1)} salta a ${c2(I2.R15.F[I2.R15.y.indexOf(I2.R15.mediana)], 4)}. Las fincas pequeñas y medianas pesan mucho más que las muy grandes y empujan la mediana hacia abajo.` },
          { texto: `${c2(I2.R15.mediana_inf_sin_pesos, 1)} cargas`, correcta: false,
            retro: `Es la mediana de las ${I2.R15.y.length} cifras sin pesos, con la misma definición: trata la muestra como si cada finca representara a las mismas. Aquí una pequeña representa a ${c2(I2.R15.w[0], 2)} fincas y una muy grande a ${c2(I2.R15.w[I2.R15.w.length - 1], 2)}.` },
          { texto: `${c2(I2.R15.y[I2.R15.y.indexOf(I2.R15.mediana) - 1], 1)} cargas`, correcta: false,
            retro: `Es el último escalón que se queda por debajo de ${c2(I2.R15.p, 1)}. La definición pide el primero que lo alcanza: el ínfimo de los $t$ con $\\hat F(t) \\ge ${m2(I2.R15.p, 1)}$.` },
          { texto: `${c2(I2.R15.media_pond, 1)} cargas`, correcta: false,
            retro: 'Es la media ponderada, no la mediana. Que aquí quede cerca de la mediana es casualidad de esta muestra: con una variable tan asimétrica, lo habitual es que se separen.' }
        ]
      },

      {
        tipo: 'grafico', id: 'R16', bloque: 'D', modulo: 14, dimension: 'grafico',
        ancla: { cap: 4, modulo: 1, titulo: '¿Por qué estratificar?', lohr: '4.1' },
        alto: 230,
        descripcionGrafico: `Histograma del número de fincas del Sur en ${c2(I2.R16.replicas, 0)} muestras aleatorias simples de ${I2.R16.n} fincas, centrado alrededor de ${Math.round(I2.R16.esperado)}, con una cola izquierda que baja hasta ${I2.R16.min} y una derecha que llega a ${I2.R16.max}. Una línea vertical marca el valor esperado.`,
        pregunta: `En ${c2(I2.R16.replicas, 0)} MAS de ${I2.R16.n} fincas se contó cuántas caían en el <strong>Sur</strong>, donde está una de cada cuatro fincas del departamento. El histograma es el resultado. Un informe regional necesita al menos 10 fincas del Sur. ¿Qué lectura es la correcta?`,
        pista: 'Mira el ancho del histograma, no solo su centro, y piensa qué haría con esa cuenta un estratificado por subregión.',
        dibujar: canvas => {
          const R = I2.R16, ks = Object.keys(R.conteo).map(Number);
          const alto = Math.max(...Object.values(R.conteo)) * 1.08;
          return crearGraficoXY(canvas, [
            serieHistograma({ centros: ks, conteo: ks.map(k => R.conteo[String(k)]) }, 'Muestras', COLORES_GRAFICO.primario),
            serieVertical(R.esperado, alto, 'Valor esperado', '#FF6600')
          ], { tituloX: 'Fincas del Sur en la muestra', tituloY: 'Muestras', xMin: 0, xMax: 30 });
        },
        opciones: [
          { texto: `En un MAS la cuenta varía y a veces no llega a 10; estratificando por subregión con asignación proporcional, son ${I2.R16.prop[2]} siempre.`, correcta: true,
            retro: `En el ${pct2(I2.R16.frac_menos10)} de las ${c2(I2.R16.replicas, 0)} muestras quedaron menos de 10, y el informe regional no habría podido salir. Es una de las razones del módulo 1, las garantías por subgrupo: con la asignación proporcional por subregión, el Sur recibe ${I2.R16.prop[2]} fincas en cualquier muestra.` },
          { texto: `En un MAS casi siempre llega a 10; estratificando también serían unas ${I2.R16.prop[2]}, aunque podrían variar.`, correcta: false,
            retro: `Que casi siempre llegue a 10 es cierto (${pct2(1 - I2.R16.frac_menos10)} de las muestras), pero estratificando por subregión el número de fincas del Sur no varía: lo fija el diseñador antes de sortear.` },
          { texto: `En un MAS sale en promedio de menos de ${I2.R16.prop[2]}; estratificando se corrige ese sesgo y llega siempre a 10.`, correcta: false,
            retro: `El histograma está centrado en ${c2(I2.R16.esperado, 1)}, que es el valor esperado: en promedio el MAS no se queda ni corto ni largo de fincas del Sur. Es variabilidad, no sesgo.` },
          { texto: `En un MAS a veces no llega a 10; estratificando también varía, aunque bastante menos, alrededor de ${I2.R16.prop[2]}.`, correcta: false,
            retro: 'Estratificando por subregión, el número de fincas del Sur lo fija el diseñador antes de sortear: no varía en absoluto.' }
        ]
      },

      {
        tipo: 'grafico', id: 'R21', bloque: 'D', modulo: 14, dimension: 'grafico',
        ancla: { cap: 4, modulo: 7, titulo: 'Un modelo para el estratificado', lohr: '4.6' },
        alto: 230,
        descripcionGrafico: `Barras apiladas al 100 % para tres particiones del marco —por tamaño, por subregión y al azar—, con la parte de la variabilidad total de la producción que queda entre estratos y la que queda dentro. Por tamaño, el ${pct2(I2.R21['tamaño'].R2, 0)} queda entre estratos; por subregión, el ${pct2(I2.R21['subregión'].R2, 0)}; al azar, casi nada.`,
        pregunta: 'Cada barra parte la variabilidad total de la producción, SST, en la que queda <strong>entre</strong> estratos (SSB) y la que queda <strong>dentro</strong> (SSW), para tres particiones del marco. Con asignación proporcional, ¿qué partición gana más, y cuál puede perder contra un MAS del mismo tamaño?',
        pista: 'El módulo 7 de este capítulo relaciona el deff de la proporcional con SSW/SST, y da una identidad exacta para saber cuándo pierde.',
        dibujar: canvas => {
          const R = I2.R21, ks = ['tamaño', 'subregión', 'azar'];
          const g = crearGraficoBarras(canvas, ['Por tamaño', 'Por subregión', 'Al azar'],
            ks.map(k => 100 * R[k].SSB / R.SST),
            { etiqueta: 'Entre estratos (SSB)', color: '#FF6600', min: 0, max: 100,
              barrasExtra: [{ etiqueta: 'Dentro de los estratos (SSW)', color: COLORES_GRAFICO.primario,
                              valores: ks.map(k => 100 * R[k].SSW / R.SST) }] });
          g.options.scales.x.stacked = true;
          g.options.scales.y.stacked = true;
          g.options.scales.y.max = 100;
          g.data.datasets.forEach(d => { d.barPercentage = 0.6; });
          g.update('none');
          return g;
        },
        opciones: [
          { texto: 'Gana más la de tamaño; puede perder la de al azar.', correcta: true,
            retro: `Por tamaño, SSB es el ${pct2(I2.R21['tamaño'].R2)} de SST, y el deff exacto con ${I2.R21.n} fincas es ${c2(I2.R21['tamaño'].deff, 2)}, casi $1 - R^2$. Al azar, SSB es el ${pct2(I2.R21.azar.R2, 2)} y el deff sale ${c2(I2.R21.azar.deff, 4)}: pierde, por un pelo. La de subregión queda en ${c2(I2.R21['subregión'].deff, 2)}: gana poco, pero gana.` },
          { texto: 'Gana más la de tamaño; ninguna de las tres puede perder.', correcta: false,
            retro: 'Casi nunca, que no es nunca. La identidad exacta del módulo 7 dice que la proporcional pierde cuando SSB queda por debajo de $\\sum_h(1 - N_h/N)S_h^2$, y una partición que no separa nada lo consigue.' },
          { texto: 'Gana más la de subregión; puede perder la de al azar.', correcta: false,
            retro: 'La ganancia la decide cuánto de la variabilidad queda entre estratos, y por subregión es casi nada; por tamaño, la mayor parte.' },
          { texto: 'Gana más la de subregión; ninguna de las tres puede perder.', correcta: false,
            retro: 'Las dos mitades fallan: por subregión casi nada queda entre estratos, y una partición al azar sí puede perder contra el MAS.' }
        ]
      },

      {
        tipo: 'grafico', id: 'R27', bloque: 'D', modulo: 14, dimension: 'grafico',
        ancla: { cap: 4, modulo: 6, titulo: 'Definición de estratos', lohr: '4.5' },
        alto: 230,
        descripcionGrafico: `Dos curvas del deff exacto de la asignación proporcional con ${I2.R27.n} fincas, contra el número de estratos de ${I2.R27.H[0]} a ${I2.R27.H[I2.R27.H.length - 1]}, formados por cuantiles: la del área baja de ${c2(I2.R27.area[0], 2)} a ${c2(I2.R27.area[I2.R27.area.length - 1], 2)}; la de la altitud se queda plana, cerca de ${c2(I2.R27.alt[0], 2)}.`,
        pregunta: `El deff exacto de la asignación proporcional con ${I2.R27.n} fincas, al partir el marco en $H$ estratos por cuantiles del <strong>área</strong> (y, de referencia, de la altitud). Mira la curva del <strong>área</strong>: ¿qué lectura es la correcta?`,
        pista: 'El módulo 6 de este capítulo discute cuántos estratos conviene hacer y qué pasa con la ganancia al partir más fino.',
        dibujar: canvas => {
          const R = I2.R27;
          const g = crearGraficoXY(canvas, [
            { type: 'line', label: 'Estratos por área', data: R.H.map((h, i) => ({ x: h, y: R.area[i] })),
              borderColor: COLORES_GRAFICO.primario, backgroundColor: COLORES_GRAFICO.primario, pointRadius: 3, borderWidth: 2, fill: false },
            { type: 'line', label: 'Estratos por altitud', data: R.H.map((h, i) => ({ x: h, y: R.alt[i] })),
              borderColor: '#FF6600', backgroundColor: '#FF6600', pointRadius: 3, borderWidth: 2, fill: false }
          ], { tituloX: 'Número de estratos H', tituloY: 'deff', xMin: 2, xMax: 8 });
          g.options.scales.y.max = 1.05;
          g.update('none');
          return g;
        },
        opciones: [
          { texto: `Los primeros cortes ganan mucho más que los últimos, y con H = ${I2.R27.H[I2.R27.H.length - 1]} la curva todavía baja.`, correcta: true,
            retro: `De ${c2(I2.R27.area[0], 2)} a ${c2(I2.R27.area[I2.R27.area.length - 1], 2)}: rendimientos decrecientes, aunque no parejos de un corte al siguiente, y no nulos, porque el área predice la producción y cada corte separa fincas que de verdad producen distinto. Es la regla de Lohr del módulo 6: cuanta más información trae el marco, más estratos.` },
          { texto: 'La ganancia se agota hacia H = 3: de ahí en adelante el deff del área apenas se mueve.', correcta: false,
            retro: `La curva sigue bajando hasta el final: de ${c2(I2.R27.area[1], 2)} en $H = 3$ a ${c2(I2.R27.area[I2.R27.area.length - 1], 2)} en $H = ${I2.R27.H[I2.R27.H.length - 1]}$.` },
          { texto: 'Cada estrato nuevo gana más o menos lo mismo que el anterior: el deff del área baja casi en línea recta.', correcta: false,
            retro: `De H = ${I2.R27.H[0]} a H = ${I2.R27.H[1]} el deff baja ${c2(I2.R27.area[0] - I2.R27.area[1], 2)}, y de H = ${I2.R27.H[I2.R27.H.length - 2]} a H = ${I2.R27.H[I2.R27.H.length - 1]}, ${c2(I2.R27.area[I2.R27.area.length - 2] - I2.R27.area[I2.R27.area.length - 1], 2)}: la curva tiende a aplanarse, con algún vaivén de un corte al siguiente.` },
          { texto: 'Con bastantes estratos el deff del área llegaría casi a 0, porque el área predice bien la producción.', correcta: false,
            retro: 'Lo que el área no predice se queda dentro de cualquier estrato, por fino que sea: el deff no puede bajar de la parte de la variabilidad que el área no explica.' }
        ]
      }
    ];

    // Los cuatro bloques del módulo 14. El orden de cada uno es el del
    // material: capítulo 3 primero, y dentro de cada capítulo, por módulo.
    AUTOEVALUACIONES['preparcial2-a'] = BANCO_PREPARCIAL2.filter(p => p.bloque === 'A');
    AUTOEVALUACIONES['preparcial2-b'] = BANCO_PREPARCIAL2.filter(p => p.bloque === 'B');
    AUTOEVALUACIONES['preparcial2-c'] = BANCO_PREPARCIAL2.filter(p => p.bloque === 'C');
    AUTOEVALUACIONES['preparcial2-d'] = BANCO_PREPARCIAL2.filter(p => p.bloque === 'D');
