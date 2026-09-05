    // ================================================================
    // Banco del preparcial — los 29 ítems nuevos del Corte I
    //
    // Reparto por la tabla de especificaciones del Parcial 1
    // (precalculo/tabla_especificaciones.json, aprobada el 2026-08-30 y con los
    // pesos movidos el 2026-09-02). Cuatro bloques, uno por dimensión:
    //
    //   Bloque                     ítems  opcion  multiple  numerica  grafico
    //   A · Conceptos                 6      5        1         0        0
    //   B · Procedimientos            9      0        0         9        0
    //   C · Interpretación            7      7        0         0        0
    //   D · Análisis gráfico          7      0        0         0        7
    //   TOTAL                        29     12        1         9        7
    //
    // `bloque` es el bloque y `modulo` la página; los dos coinciden EN ESTE
    // FICHERO y el ensamblador remapea `modulo` al número real del módulo, igual
    // que hace con las semanas del simulacro. La numeración no vive aquí.
    //
    // `dimension` la declara cada ítem, y no es decorativa: `inventario_items.py`
    // la deducía del tipo (`opcion` → concepto) y con eso contaba como concepto
    // los siete ítems de interpretación de este banco, que es justo lo que la
    // auditoría del 2026-09-02 señaló como dimensión subcontada (§3.4).
    //
    // LAS CIFRAS. Ninguna se escribe a mano: todas salen de
    // precalculo/genera_preparcial.R, que las deja en DATOS_PREPARCIAL. La
    // población es `baseball` —los 797 jugadores de las 30 plantillas de la MLB
    // en 2004, población COMPLETA— y no aparece en ninguna otra página del
    // sitio, así que ningún ítem se contesta reconociendo un número ya visto.
    //
    // LO QUE LA AUDITORÍA DEL 2026-09-02 DEJÓ COMO REGLA, y aquí se aplica:
    //   1. la correcta no siempre primero — la página baraja, y por eso
    //   2. ninguna retro nombra posiciones: nombra el contenido de la opción;
    //   3. la correcta no siempre la más larga — el matiz va a la retro;
    //   4. cada distractor es un error nombrable, no relleno;
    //   5. el ítem que pide leer una salida se cuenta como interpretación.
    // ================================================================
    const DP = DATOS_PREPARCIAL;

    const BANCO_PREPARCIAL = [

      // ==============================================================
      // BLOQUE A · Conceptos (6 ítems)
      // ==============================================================
      {
        tipo: 'opcion',
        modulo: 1,
        bloque: 1,
        dimension: 'concepto',
        ancla: { cap: 1, modulo: 3, titulo: 'Requisitos de una buena muestra', lohr: '1.3 · 1.6' },
        pregunta: 'Se quiere estimar el <strong>salario medio de los 797 jugadores</strong> del archivo de la MLB de 2004. Cuatro equipos de trabajo proponen cuatro procedimientos. ¿Cuál cumple <strong>los tres requisitos</strong> de una buena muestra?',
        pista: 'Los tres requisitos son, en orden: un marco que cubra la población, un mecanismo aleatorio con probabilidades conocidas y positivas, y una tasa de respuesta alta. Basta que falle uno.',
        opciones: [
          { texto: 'Sortear 100 de los 797 del archivo con la misma probabilidad y leer el salario del contrato de cada uno.', correcta: true,
            retro: 'Los tres, y por eso mismo no es el más vistoso: el marco son los 797 —cubre la población entera—, el sorteo es conocido y da $\\pi_k = 0{,}12547$ a todos, y no hay no respuesta porque el dato ya está en el archivo. Un procedimiento aburrido puede ser el único correcto.' },
          { texto: 'Escribir a los 797 pidiéndoles su salario, y promediar lo que declaren los que contesten.', correcta: false,
            retro: 'El marco es perfecto y el sorteo también —se pregunta a todos—, pero el tercer requisito lo decide quien contesta, no quien diseña. Los respondientes son una muestra autoseleccionada, y quien más cobra tiene más motivos para callarse: eso es exactamente lo que hunde a la mayoría de las encuestas reales.' },
          { texto: 'Sortear 100 con la misma probabilidad entre los 641 jugadores que tuvieron al menos un turno al bate.', correcta: false,
            retro: 'El sorteo es impecable y la tasa de respuesta también, pero el marco deja fuera a 156 jugadores con $\\pi_k = 0$. Ningún estimador puede ser insesgado para una población que incluye a unidades que el sorteo no puede alcanzar, y son 156 lanzadores que cobran 1 447 498,94 de media.' },
          { texto: 'Encargar a un periodista que elija 100 procurando que haya de los 30 equipos y de todas las posiciones.', correcta: false,
            retro: 'La muestra resultante puede parecerse mucho a la población y aun así no servir: sin un sorteo declarado no hay $\\pi_k$, y sin $\\pi_k$ las palabras «insesgado», «varianza» y «error estándar» no significan nada, porque las tres son esperanzas respecto del mecanismo de selección.' }
        ]
      },

      {
        tipo: 'opcion',
        modulo: 1,
        bloque: 1,
        dimension: 'concepto',
        ancla: { cap: 1, modulo: 1, titulo: 'Una controversia de muestreo', lohr: '1.1' },
        pregunta: 'Un club anuncia: «encuestamos a <strong>doce mil aficionados a la salida del estadio</strong> y el 78 % apoya la subida de precios». ¿Dónde está el error y qué le hace aumentar el número de encuestados?',
        pista: 'Pregúntate quién <em>podía</em> aparecer en esa encuesta, y luego qué componente del error total depende del tamaño y cuál no.',
        opciones: [
          { texto: 'Es sesgo de selección, y aumentar el número de encuestados no lo reduce: solo afina la cifra equivocada.', correcta: true,
            retro: 'El marco de hecho son los que ya compraron entrada y además se pararon a contestar: la subida les afecta menos que a quien dejó de ir por el precio. Un sesgo de selección no es un error grande que se pueda promediar hasta hacerlo pequeño; sobrevive intacto a cualquier tamaño, y esa es la lección que el módulo 1 saca del <em>Literary Digest</em>.' },
          { texto: 'Es error de muestreo, y con doce mil respuestas ya es despreciable frente a otros errores.', correcta: false,
            retro: 'El error de muestreo sí baja con el tamaño, y con doce mil respuestas sería minúsculo. Pero el error de muestreo mide la distancia a la media <em>de la población muestreada</em>, y aquí el problema es que esa población no es la que se quiere: la cifra converge, y converge al número equivocado.' },
          { texto: 'Es no respuesta, porque los aficionados que se niegan a contestar quedan fuera del resultado publicado.', correcta: false,
            retro: 'Hay algo de eso, pero se queda corto: la no respuesta actúa <em>sobre los seleccionados</em>, y aquí el filtro ya operó antes, al decidir que solo se pregunta a la salida del estadio. Quien no fue al partido nunca estuvo en la lista de los que podían negarse.' },
          { texto: 'Es sesgo de medición: preguntar por una subida de precios en la puerta del estadio induce a decir que sí.', correcta: false,
            retro: 'Es un efecto real y está en el módulo 6 —el sitio y el momento condicionan la respuesta—, pero no es el defecto dominante aquí. Aunque cada uno contestara con absoluta sinceridad, seguirían contestando solo los que estaban dentro.' }
        ]
      },

      {
        tipo: 'multiple',
        modulo: 1,
        bloque: 1,
        dimension: 'concepto',
        ancla: { cap: 2, modulo: 4, titulo: 'Insesgadez de diseño y «muestra representativa»', lohr: '2.2' },
        pregunta: 'El estimador de Horvitz–Thompson es <strong>insesgado por diseño</strong> para el total de los cinco jugadores. Marca <strong>todo</strong> lo que esa propiedad garantiza.',
        pista: 'La insesgadez es una propiedad del procedimiento, no de la muestra que salió. Lee cada afirmación preguntándote si habla del procedimiento o de una muestra concreta.',
        opciones: [
          { texto: 'Que promediando las siete estimaciones posibles, cada una por su probabilidad, sale exactamente el total verdadero.', correcta: true },
          { texto: 'Que la propiedad sigue valiendo aunque la población sea muy asimétrica y no se parezca a ninguna distribución conocida.', correcta: true },
          { texto: 'Que la esperanza se toma sobre las muestras que podrían haber salido, no sobre repeticiones de la temporada.', correcta: true },
          { texto: 'Que la estimación de la muestra que salió está cerca del total verdadero.', correcta: false },
          { texto: 'Que la muestra que salió reproduce la composición de la población por equipo y por posición.', correcta: false }
        ],
        retroAcierto: 'Las tres que hablan del procedimiento. Y conviene ver lo lejos que queda eso de «acertar»: las siete muestras de este diseño dan desde 1 390 000 hasta 43 547 619 cuando el total es 16 795 000, y aun así su promedio ponderado es 16 795 000 clavado. Insesgado no quiere decir preciso; lo preciso lo mide la varianza, y aquí la desviación típica del estimador es 14 530 239.',
        retroFallo: 'Las dos que sobran son las que hablan de <em>la muestra que salió</em>, y ninguna propiedad de diseño puede garantizar nada sobre ella: el rango de las siete estimaciones va de 1 390 000 a 43 547 619. Que una de ellas quede lejos de 16 795 000 no contradice la insesgadez, igual que sacar cara no prueba que la moneda esté cargada. Y «reproducir la composición» es la idea de muestra representativa que el módulo 4 desmonta: no es lo que se le pide a un diseño ni lo que se puede comprobar.'
      },

      {
        tipo: 'opcion',
        modulo: 1,
        bloque: 1,
        dimension: 'concepto',
        ancla: { cap: 2, modulo: 10, titulo: 'Teoría de aleatorización', lohr: '2.7' },
        pregunta: 'En la inferencia basada en el diseño sobre los 797 jugadores, ¿<strong>qué</strong> es aleatorio y <strong>sobre qué</strong> se toma la esperanza?',
        pista: 'La probabilidad de este curso no está en la naturaleza: está en un sorteo que alguien ejecutó y cuyo reparto conoce.',
        opciones: [
          { texto: 'Los indicadores de inclusión, que dicen qué jugadores se observan; la esperanza se toma sobre el diseño $p(s)$.', correcta: true,
            retro: 'Los 797 salarios son constantes desconocidas —el de un jugador es el que es, salga o no salga—, y lo único aleatorio es qué jugadores se observan. Por eso el supuesto central es verificable: o se ejecutó el sorteo declarado, o no.' },
          { texto: 'Los salarios, que se comportan como una variable aleatoria muy asimétrica; la esperanza se toma sobre esa distribución.', correcta: false,
            retro: 'Esa es la inferencia basada en modelo, y es una posición legítima: es la del capítulo 3 y la de casi toda la estadística previa. Pero entonces la validez depende de que el modelo sea cierto, mientras que aquí depende de que el sorteo se haya ejecutado, que es algo que se comprueba mirando el procedimiento.' },
          { texto: 'Los salarios y los indicadores a la vez; la esperanza se toma sobre las dos fuentes de variación combinadas.', correcta: false,
            retro: 'Combinar las dos es lo que hacen los estimadores asistidos por modelo del capítulo 3, y ahí tiene sentido. En el marco de este capítulo no hay nada que combinar: mientras los $y_k$ sean constantes, toda la aleatoriedad cabe en los indicadores.' },
          { texto: 'El salario que cada jugador tendrá la temporada siguiente; la esperanza se toma sobre repeticiones de la temporada.', correcta: false,
            retro: 'Eso sería predecir, no estimar. La inferencia de diseño solo responde preguntas sobre <em>esta</em> población finita y este año; para el jugador de la temporada que viene hace falta un modelo, y el módulo 10 lo dice con esas palabras.' }
        ]
      },

      {
        tipo: 'opcion',
        modulo: 1,
        bloque: 1,
        dimension: 'concepto',
        ancla: { cap: 2, modulo: 8, titulo: 'Diseño Bernoulli y muestreo con reemplazo', lohr: '2.2 · 2.6' },
        pregunta: 'Se toma una muestra de <strong>n = 100</strong> jugadores <strong>con reemplazo</strong> en vez de sin reemplazo, sobre la misma población de 797. ¿Qué le pasa a la varianza del estimador de la media?',
        pista: 'Escribe las dos varianzas y compáralas término a término. La única diferencia es un factor, y ese factor tiene nombre.',
        opciones: [
          { texto: 'Sube, porque al reponer cada unidad desaparece la corrección por población finita.', correcta: true,
            retro: 'Con reemplazo cada extracción se hace sobre la población entera y no se gana nada por haber mirado ya: la varianza es $S^2/n$, sin la fpc que la reduce. Con estos números la razón es exactamente 1,143472 — un 14,3 % más de varianza por el mismo trabajo de campo.' },
          { texto: 'Baja, porque permitir repeticiones amplía el conjunto de muestras posibles.', correcta: false,
            retro: 'Hay más muestras posibles, sí, pero unas cuantas de ellas repiten unidades y por tanto traen menos información que una muestra de 100 jugadores distintos. Más muestras posibles no es más información: es más dispersión.' },
          { texto: 'Es la misma: la fpc corrige el estimador puntual, no su varianza.', correcta: false,
            retro: 'La fpc no toca el estimador puntual —la media muestral es la media muestral con reemplazo y sin él—; vive entera dentro de la varianza. Cambiar el estimador y cambiar su precisión son cosas distintas, y esta es de las segundas.' },
          { texto: 'Sube solo si la fracción muestral pasa del 5 %; por debajo de ese umbral las dos varianzas coinciden.', correcta: false,
            retro: 'La regla del 5 % es una guía práctica para decidir cuándo la fpc se puede <em>despreciar</em>, no un umbral por debajo del cual desaparece. Aquí la fracción es del 12,55 % y la fpc claramente cuenta; pero incluso al 1 % las dos varianzas seguirían siendo distintas, solo que por poco.' }
        ]
      },

      {
        tipo: 'opcion',
        modulo: 1,
        bloque: 1,
        dimension: 'concepto',
        ancla: { cap: 2, modulo: 1, titulo: 'El diseño muestral $p(s)$', lohr: '2.1 · 2.8' },
        pregunta: 'Dos diseños sobre <strong>los mismos cinco jugadores</strong>, los dos de tamaño $n = 2$:<br><br><code>Diseño I&nbsp;&nbsp;  p{1,2}=0,25  p{1,3}=0,15  p{1,4}=0,10  p{2,3}=0,10  p{2,5}=0,15  p{3,4}=0,10  p{4,5}=0,15</code><br><code>Diseño II   p{1,2}=0,20  p{1,5}=0,30  p{2,3}=0,15  p{2,4}=0,15  p{3,4}=0,20</code><br><br>Los dos tienen los <strong>mismos</strong> $\\pi_k$. ¿Qué más comparten y qué no?',
        pista: 'Mira de qué depende cada cosa: el estimador de Horvitz–Thompson se escribe con unos números y su varianza necesita otros.',
        opciones: [
          { texto: 'Comparten el estimador y su esperanza; la varianza no, porque depende de los $\\pi_{kl}$.', correcta: true,
            retro: 'El estimador $\\hat t_\\pi = \\sum y_k/\\pi_k$ solo mira los $\\pi_k$, así que es literalmente el mismo, y su esperanza es el total en los dos. La varianza necesita saber además con qué frecuencia entran las unidades <em>de dos en dos</em>, y ahí los diseños difieren: desviación típica 14 530 239 en el I y 10 033 168 en el II, un 52,3 % menos de varianza con las mismas probabilidades individuales. Por eso el marco $\\pi$ necesita dos órdenes y no uno.' },
          { texto: 'Son el mismo diseño escrito de dos maneras: fijados los $\\pi_k$, el reparto $p(s)$ queda determinado.', correcta: false,
            retro: 'Es la conclusión natural y es falsa: los $\\pi_k$ son cinco números y $p(s)$ son diez, así que muchos repartos distintos dan los mismos cinco. De hecho estos dos ni siquiera tienen el mismo soporte —el II nunca saca juntos al 1 y al 3, y el I sí—, y aun así coinciden en los cinco $\\pi_k$.' },
          { texto: 'Cambia el estimador, porque cambia el conjunto de muestras que pueden salir.', correcta: false,
            retro: 'Cambia qué muestras se pueden observar, pero no la regla con la que se estima: en las dos se divide cada valor observado entre su $\\pi_k$, y esos $\\pi_k$ son los mismos. La fórmula del estimador no consulta el soporte.' },
          { texto: 'Cambia la esperanza: solo el primero es insesgado, porque su soporte tiene siete muestras y cubre mejor la población.', correcta: false,
            retro: 'Horvitz–Thompson es insesgado para <em>cualquier</em> diseño con todos los $\\pi_k$ positivos, y los dos lo son: los dos promedian 16 795 000. El tamaño del soporte no entra en la demostración, que solo usa que $E(I_k) = \\pi_k$.' }
        ]
      },

      // ==============================================================
      // BLOQUE B · Procedimientos (9 ítems)
      // ==============================================================
      {
        tipo: 'numerica',
        modulo: 2,
        bloque: 2,
        dimension: 'procedimiento',
        ancla: { cap: 1, modulo: 8, titulo: 'Las poblaciones del curso', lohr: '1.2' },
        pregunta: 'La población objetivo son los <strong>797</strong> jugadores del archivo. El marco disponible es el listado de quienes tuvieron <strong>al menos un turno al bate</strong>, y son <strong>641</strong>. ¿Qué <strong>fracción de no cobertura</strong> tiene ese marco? Da cuatro decimales.',
        pista: 'La no cobertura se mide sobre la población que se quería estudiar, no sobre la lista que quedó.',
        respuesta: 0.1957,
        tolerancia: 0.0005,
        retroAcierto: 'Correcto: $(797 - 641)/797 = 0{,}1957$, un 19,57 % de la población objetivo al que el sorteo no puede llegar. Y el dato que hace grave a ese porcentaje no es su tamaño: es que los 156 excluidos son todos lanzadores y cobran 1 447 498,94 de media frente a 2 753 248,22 los del marco.',
        retroFallo: 'La respuesta es 0,1957. Dos resultados frecuentes y lo que significan: 0,8043 es la <em>cobertura</em>, la proporción que sí está —le falta restarla de 1—; y 0,2434 sale de dividir los 156 excluidos entre los 641 del marco, que responde a otra pregunta, porque el denominador de la no cobertura es la población objetivo.'
      },

      {
        tipo: 'numerica',
        modulo: 2,
        bloque: 2,
        dimension: 'procedimiento',
        ancla: { cap: 2, modulo: 2, titulo: 'Probabilidades de inclusión', lohr: '2.8' },
        pregunta: 'Con el <strong>diseño I</strong> de los cinco jugadores —<code>p{1,2}=0,25  p{1,3}=0,15  p{1,4}=0,10  p{2,3}=0,10  p{2,5}=0,15  p{3,4}=0,10  p{4,5}=0,15</code>—, ¿cuánto vale $\\pi_{13}$, la probabilidad de que el jugador 1 y el 3 entren <strong>los dos</strong> en la muestra?',
        pista: 'La definición dice: sumar $p(s)$ sobre las muestras que contienen a los dos. Mira cuántas de las siete cumplen eso.',
        respuesta: 0.15,
        tolerancia: 0.005,
        retroAcierto: 'Correcto. Solo una de las siete muestras contiene a los dos, y su probabilidad es 0,15. Comprueba de paso la identidad que el módulo 2 propone como control: los $\\pi_k$ suman 2, que es $E(n)$, y como el diseño es de tamaño fijo, $E(n) = n = 2$.',
        retroFallo: 'Es 0,15: la probabilidad de la única muestra que los contiene a los dos. Si te salió 0,175, multiplicaste $\\pi_1 \\times \\pi_3 = 0{,}5 \\times 0{,}35$, que sería correcto si las dos inclusiones fueran independientes — y no lo son: en un diseño de tamaño fijo, que entre uno le quita sitio al otro. Ese es justo el motivo de que $\\pi_{kl}$ exista como número aparte y no se pueda deducir de los $\\pi_k$.'
      },

      {
        tipo: 'numerica',
        modulo: 2,
        bloque: 2,
        dimension: 'procedimiento',
        ancla: { cap: 2, modulo: 3, titulo: 'El estimador de Horvitz–Thompson', lohr: '2.8' },
        unidad: 'USD',
        pregunta: 'Salió la muestra <strong>{1, 3}</strong> del diseño I. Se observa <strong>320 000</strong> para el jugador 1 y <strong>2 150 000</strong> para el 3, con $\\pi_1 = 0{,}50$ y $\\pi_3 = 0{,}35$. Estima el <strong>total</strong> de los cinco con Horvitz–Thompson.',
        pista: 'Cada unidad observada habla por sí misma y por las veces que no salió: eso es $1/\\pi_k$.',
        respuesta: 6782857.14,
        tolerancia: 20,
        retroAcierto: 'Correcto: $320\\,000/0{,}50 + 2\\,150\\,000/0{,}35 = 640\\,000 + 6\\,142\\,857{,}14 = 6\\,782\\,857{,}14$. El total verdadero es 16 795 000, así que esta muestra se queda muy corta — y está bien que así sea: lo que promete el estimador es acertar en promedio sobre las siete muestras, no en cada una.',
        retroFallo: 'Son 6 782 857,14. Si te salió 2 470 000, sumaste lo observado sin expandir, y eso solo cuenta a dos jugadores de cinco. Y si te salió 6 175 000, repartiste con una probabilidad media de 0,40 para los dos —o multiplicaste la media muestral por 5—: es el estimador de expansión, que solo es insesgado bajo el MAS, y aquí las dos unidades no entran con la misma probabilidad.'
      },

      {
        tipo: 'numerica',
        modulo: 2,
        bloque: 2,
        dimension: 'procedimiento',
        ancla: { cap: 2, modulo: 5, titulo: 'El MAS como caso particular', lohr: '2.2' },
        pregunta: 'Un compañero tomó un <strong>MAS sin reemplazo de n = 100</strong> sobre los <strong>797</strong> jugadores y escribió que el peso de diseño es <strong>8,0505</strong>. Antes de creerle, haz la comprobación que delata un peso mal puesto — la suma de los pesos de la muestra tiene que devolver el tamaño de la población — y da el valor <strong>correcto</strong> de $d_k$.',
        pista: 'Súmale a la muestra su propio peso: $\\sum_{k \\in s} d_k$ son 100 sumandos iguales. Si no da 797, el peso está mal.',
        respuesta: 7.97,
        tolerancia: 0.005,
        retroAcierto: 'Correcto: $d_k = N/n = 797/100 = 7{,}97$, y $100 \\times 7{,}97 = 797$, que es la comprobación pasada. El 8,0505 de tu compañero sale de dividir entre $n - 1$ en vez de entre $n$; su suma de pesos da 805,05 y estima 805 jugadores donde hay 797.',
        retroFallo: 'Es 7,97. La comprobación es lo que hay que llevarse: $\\sum_{k \\in s} d_k = \\hat N$ tiene que devolver el tamaño de la población. Con 8,0505 da 805,05 —ocho jugadores de más— y con $d_k = n/N = 0{,}12547$ da 12,55, que ni siquiera tiene las unidades correctas. Con las fórmulas delante en el parcial, esta comprobación vale más que recordar cuál de las dos divisiones era.'
      },

      {
        tipo: 'numerica',
        modulo: 2,
        bloque: 2,
        dimension: 'procedimiento',
        ancla: { cap: 2, modulo: 6, titulo: 'Intervalos de confianza', lohr: '2.3' },
        unidad: 'USD',
        pregunta: 'Del MAS sin reemplazo de <strong>n = 100</strong> sobre <strong>N = 797</strong> salen una media de <strong>2 564 439,56</strong> y un error estándar de <strong>292 379,48</strong>, ya con la corrección por población finita. Construye el intervalo de confianza al <strong>95 %</strong> para el salario medio y da su <strong>límite superior</strong>.',
        pista: 'El error estándar ya viene calculado: lo que falta es el multiplicador del nivel de confianza, y no es 2.',
        respuesta: 3137492.82,
        tolerancia: 500,
        retroAcierto: 'Correcto: $2\\,564\\,439{,}56 + 1{,}96 \\times 292\\,379{,}48 = 3\\,137\\,492{,}82$, con un semiancho de 573 053,26. Y aquí se puede hacer lo que en el trabajo real nunca: mirar la respuesta. La media verdadera de los 797 es 2 497 668,69, que cae dentro del intervalo — junto con el límite inferior, 1 991 386,30.',
        retroFallo: 'Son 3 137 492,82. Si usaste $z = 2$ en vez de 1,96 el semiancho te salió 584 758,97 en vez de 573 053,26; y si recalculaste el error estándar olvidando la fpc, 612 784,48. Ninguno de los dos cambia la conclusión aquí —el intervalo cubre igual—, pero los dos declaran una precisión distinta de la que el diseño tiene.'
      },

      {
        tipo: 'numerica',
        modulo: 2,
        bloque: 2,
        dimension: 'procedimiento',
        ancla: { cap: 2, modulo: 7, titulo: 'Determinación del tamaño de muestra', lohr: '2.4' },
        unidad: 'USD',
        pregunta: 'El problema al revés. El presupuesto solo alcanza para <strong>n = 60</strong> jugadores y hay que anunciar de antemano qué precisión se va a poder prometer. Con $S = 3\\,535\\,924{,}97$ conocida y $N = 797$, ¿cuál es el <strong>margen de error</strong> al 95 % que se alcanza con ese tamaño?',
        pista: 'Es la fórmula del tamaño de muestra despejada al revés: en vez de dar el margen y buscar $n$, se da $n$ y se busca el margen. La fpc sigue estando.',
        respuesta: 860359.76,
        tolerancia: 500,
        retroAcierto: 'Correcto: $1{,}96\\sqrt{(1 - 60/797)\\,S^2/60} = 860\\,359{,}76$, que sobre una media de 2 497 668,69 es un margen relativo del 34,45 %. Esa es la cifra honesta para poner en la propuesta, y conviene decirla antes de gastar el presupuesto: para reducirla a la mitad harían falta 196 jugadores, más del triple.',
        retroFallo: 'Son 860 359,76. Si olvidaste la fpc te salió 894 696,02 y si usaste $z = 2$, 877 934,26. La comprobación que cierra el ejercicio es la vuelta: mete ese margen en la fórmula del tamaño de muestra y tiene que devolverte 60. Si no vuelve, el despeje está mal.'
      },

      {
        tipo: 'numerica',
        modulo: 2,
        bloque: 2,
        dimension: 'procedimiento',
        ancla: { cap: 2, modulo: 2, titulo: 'Probabilidades de inclusión', lohr: '2.8' },
        pregunta: 'En un <strong>diseño Bernoulli</strong> sobre los <strong>797</strong> jugadores, cada uno entra en la muestra de forma independiente con probabilidad <strong>0,125</strong>. ¿Cuánto vale $\\sum_{k \\in U} \\pi_k$?',
        pista: 'Aquí el tamaño de la muestra <em>no</em> está fijado de antemano. Escribe la suma antes de decidir a qué es igual.',
        respuesta: 99.625,
        tolerancia: 0.005,
        retroAcierto: 'Correcto: $797 \\times 0{,}125 = 99{,}625$. Y fíjate en lo que <em>no</em> es: no es el tamaño de la muestra, porque aquí el tamaño es aleatorio. La suma de los $\\pi_k$ es siempre $E(n_s)$; que además sea igual a $n$ es un lujo de los diseños de tamaño fijo, y este no lo es. En 2 000 réplicas simuladas los tamaños fueron de 70 a 133.',
        retroFallo: 'Son 99,625. Si respondiste 100 supusiste que el diseño tiene tamaño fijo y que la suma tenía que dar un entero: es el error que este ítem existe para provocar. En Bernoulli el tamaño es una variable aleatoria con media 99,625 y desviación típica 9,3366, y la identidad general del módulo 2 es $\\sum_U \\pi_k = E(n_s)$, no $= n$.'
      },

      {
        tipo: 'numerica',
        modulo: 2,
        bloque: 2,
        dimension: 'procedimiento',
        ancla: { cap: 2, modulo: 5, titulo: 'El MAS como caso particular', lohr: '2.3' },
        pregunta: 'En el mismo MAS de <strong>n = 100</strong> sobre <strong>N = 797</strong> hay <strong>39 lanzadores</strong>. Estima la <strong>proporción</strong> de lanzadores de la población, calcula su error estándar con la corrección por población finita y da el <strong>límite superior</strong> del intervalo al 95 %. Cuatro decimales.',
        pista: 'Para una variable que solo vale 0 o 1, la cuasivarianza muestral se simplifica y en el denominador queda $n - 1$, no $n$.',
        respuesta: 0.4798,
        tolerancia: 0.001,
        retroAcierto: 'Correcto: $\\hat p = 0{,}39$, error estándar $\\sqrt{(1-f)\\,\\hat p(1-\\hat p)/(n-1)} = 0{,}0458$ y límite superior $0{,}39 + 1{,}96 \\times 0{,}0458 = 0{,}4798$. Aquí sí se puede comprobar: la proporción verdadera es 0,4718 —376 lanzadores de 797— y el intervalo la cubre por 0,0081. Por muy poco, y eso también es información.',
        retroFallo: 'Es 0,4798. El error estándar correcto es 0,0458; si te salió 0,0488 usaste $\\hat p(1-\\hat p)/n$, sin fpc y con $n$ en vez de $n-1$. Con ese error el intervalo llega hasta 0,4856 y también cubre el 0,4718 verdadero, así que la conclusión no cambiaría — pero el ítem no pregunta por la conclusión, pregunta por el número que el diseño justifica.'
      },

      {
        tipo: 'numerica',
        modulo: 2,
        bloque: 2,
        dimension: 'procedimiento',
        ancla: { cap: 2, modulo: 9, titulo: 'Muestreo sistemático', lohr: '2.6' },
        pregunta: 'La plantilla más corta de la liga tiene <strong>24</strong> jugadores y se muestrea sistemáticamente con salto <strong>k = 6</strong>: hay exactamente <strong>seis</strong> muestras posibles, de 4 jugadores cada una y equiprobables. Sus medias, en millones de dólares, son <code>1,544792  2,926250  0,951750  7,041667  6,656250  1,300375</code> y la media de la plantilla es <strong>3,403514</strong>. ¿Cuál es la <strong>varianza real</strong> del estimador, en millones al cuadrado?',
        pista: 'No estás estimando una varianza desde una muestra: estás recorriendo entera la población de muestras posibles, y las seis son igual de probables. Piensa qué denominador corresponde a eso.',
        respuesta: 6.322236,
        tolerancia: 0.02,
        retroAcierto: 'Correcto: $\\frac{1}{6}\\sum_a (\\bar y_a - \\mu)^2 = 6{,}322236$. Compárala con lo que declararía la fórmula del MAS con el mismo tamaño, 3,630665: el sistemático sobre este orden es un 74,1 % <em>peor</em>, y quien lo analizara como si fuera un MAS publicaría un error estándar demasiado optimista.',
        retroFallo: 'Son 6,322236. Si te salió 7,586683, dividiste entre $k - 1$: es lo que devuelve la función de varianza de cualquier programa, y aquí está mal, porque las seis medias no son una muestra de nada — son <em>todas</em> las muestras posibles, con probabilidad 1/6 cada una, así que el denominador es 6. Y este cálculo, recorrer las $k$ muestras, es el único camino: con 240 de los 276 pares en $\\pi_{kl} = 0$, no existe un estimador insesgado de la varianza desde una sola muestra sistemática.'
      },

      // ==============================================================
      // BLOQUE C · Interpretación (7 ítems)
      //
      // Los siete son de tipo `opcion` y NINGUNO es de concepto: preguntan qué
      // se puede afirmar a partir de un resultado ya calculado, que es la
      // dimensión que el material tenía en el 7,7 % y el parcial evalúa.
      // ==============================================================
      {
        tipo: 'opcion',
        modulo: 3,
        bloque: 3,
        dimension: 'interpretacion',
        ancla: { cap: 1, modulo: 3, titulo: 'Requisitos de una buena muestra', lohr: '1.3' },
        pregunta: 'El marco solo tiene a los <strong>641</strong> jugadores con al menos un turno al bate; los otros <strong>156</strong> quedan con $\\pi_k = 0$. El sorteo sobre ese marco es impecable y contestan todos. ¿Qué es exactamente lo que <strong>deja de poder afirmarse</strong>?',
        pista: 'Un $\\pi_k = 0$ no es una probabilidad pequeña: es una unidad que no puede salir por más veces que se repita el sorteo. Piensa qué población está estimando ese diseño.',
        opciones: [
          { texto: 'Que la estimación sea insesgada para los 797: el diseño estima sin sesgo la media de los 641, que es otra cantidad.', correcta: true,
            retro: 'La población muestreada dejó de ser la objetivo. El diseño sigue siendo impecable <em>para el marco</em> —insesgado, con su varianza y su intervalo—, pero apunta a 2 753 248,22 en vez de a 2 497 668,69, y la diferencia, 255 579,53, no aparece en ningún error estándar. Es la parte del error total que no se ve en la salida.' },
          { texto: 'Nada grave: 156 de 797 es menos del 20 %, y por debajo de ese umbral la no cobertura se considera despreciable.', correcta: false,
            retro: 'No hay tal umbral, y aquí se ve por qué no puede haberlo: lo que decide la gravedad no es cuántos faltan sino <em>en qué se diferencian</em>. Los 156 excluidos cobran 1 447 498,94 de media, así que un 19,57 % de no cobertura mueve la media un 10,23 %.' },
          { texto: 'La precisión: con 641 unidades en el marco en vez de 797 la varianza sube, y el intervalo sale más ancho de lo necesario.', correcta: false,
            retro: 'La varianza apenas se entera —la fpc cambia poco entre 797 y 641—, y ese no es el problema. Un intervalo más ancho seguiría siendo honesto; lo que pasa aquí es que el intervalo es estrecho <em>y está centrado en el sitio equivocado</em>. Más datos lo estrecharían más alrededor del mismo número erróneo.' },
          { texto: 'Nada, si al final se pondera: dar a cada uno de los 641 un peso de 797/641 recupera el tamaño de la población.', correcta: false,
            retro: 'Ese peso reconstruye el <em>tamaño</em>, no la información. Multiplicar por 797/641 lo que se observó en el marco estima el total como si los 156 ausentes cobraran lo mismo que los presentes, que es precisamente el supuesto que aquí es falso. Ponderar arregla probabilidades desiguales; no arregla probabilidades nulas.' }
        ]
      },

      {
        tipo: 'opcion',
        modulo: 3,
        bloque: 3,
        dimension: 'interpretacion',
        ancla: { cap: 1, modulo: 6, titulo: 'Diseño de cuestionarios', lohr: '1.4' },
        pregunta: 'La misma encuesta se aplica con dos redacciones. <strong>A:</strong> «¿Está de acuerdo con limitar el salario de los jugadores?». <strong>B:</strong> «Sabiendo que varios clubes están al borde de la quiebra, ¿está de acuerdo con limitar el salario de los jugadores?». El apoyo sale claramente más alto en B. ¿Cómo se clasifica esa diferencia?',
        pista: 'Las dos preguntas quieren medir lo mismo y le llegan a la misma gente. Pregúntate si el efecto del preámbulo empuja a todos hacia el mismo lado o a unos en cada dirección.',
        opciones: [
          { texto: 'Es error de medición y sesga, porque el preámbulo empuja a todos los encuestados en la misma dirección.', correcta: true,
            retro: 'La selección es idéntica en las dos versiones y todos contestan: lo único que cambió es el instrumento. Y un empujón que va en un solo sentido no se compensa al promediar por muchos que respondan — que es lo que separa un sesgo de un ruido.' },
          { texto: 'Es error de medición, pero solo dispersa: a unos el preámbulo los convence y a otros los hace desconfiar, y en promedio se compensa.', correcta: false,
            retro: 'Sería cierto si el efecto fuera idiosincrásico, y es la lectura más razonable de las tres incorrectas. Pero un preámbulo que menciona quiebras no reparte al azar: da un argumento a favor y ninguno en contra, así que la media de las desviaciones no es cero. Ahí está la frontera entre varianza y sesgo.' },
          { texto: 'Es sesgo de selección: el preámbulo hace que abandonen la encuesta los que no están de acuerdo.', correcta: false,
            retro: 'Eso sería no respuesta diferencial, y podría ocurrir de verdad. Pero el enunciado dice que contesta la misma gente en las dos versiones: la selección no cambió, cambió lo que se les preguntó.' },
          { texto: 'No es un error de encuesta: son dos preguntas distintas y es normal que den cifras distintas.', correcta: false,
            retro: 'Formalmente son dos textos distintos, sí; pero las dos se publicarían como «el apoyo a limitar los salarios», que es una sola cantidad. En cuanto dos instrumentos que dicen medir lo mismo dan cifras distintas, al menos uno mide otra cosa: eso es error de medición, tenga o no mala intención.' }
        ]
      },

      {
        tipo: 'opcion',
        modulo: 3,
        bloque: 3,
        dimension: 'interpretacion',
        ancla: { cap: 2, modulo: 2, titulo: 'Probabilidades de inclusión', lohr: '2.8' },
        pregunta: 'En el diseño I los $\\pi_k$ son <strong>0,50 · 0,50 · 0,35 · 0,35 · 0,30</strong> y suman <strong>2</strong>, que es el tamaño de muestra. Un compañero concluye: «suman $n$, luego es un MAS, así que puedo estimar el total con $5\\bar y$». ¿Qué falla?',
        pista: 'Que la suma dé $n$ es una identidad de todos los diseños de tamaño fijo. Pregúntate qué le pide además el MAS a esos cinco números.',
        opciones: [
          { texto: 'Que sumen $n$ solo dice que el diseño es de tamaño fijo; el MAS pide además que los cinco sean iguales, y aquí no lo son.', correcta: true,
            retro: 'La identidad $\\sum_U \\pi_k = n$ vale para cualquier diseño de tamaño fijo: no distingue el MAS de nada. Bajo un MAS de $n = 2$ sobre cinco unidades los cinco $\\pi_k$ valdrían 0,40. Y la consecuencia de tratar como iguales unas probabilidades que no lo son está calculada: $5\\bar y$ promedia 13 987 500 cuando el total es 16 795 000, un sesgo de −2 807 500 que ninguna muestra grande arregla.' },
          { texto: 'Nada en el razonamiento: con $\\sum_U \\pi_k = n$ el diseño es de tamaño fijo, y todo diseño de tamaño fijo admite $5\\bar y$ como estimador insesgado.', correcta: false,
            retro: 'Que el diseño sea de tamaño fijo es cierto; que de ahí salga $5\\bar y$, no. $N\\bar y$ es insesgado solo cuando todas las unidades entran con la misma probabilidad; en cuanto los $\\pi_k$ se separan, la media muestral sobrerrepresenta a los favorecidos por el diseño y el sesgo aparece.' },
          { texto: 'Falla que la suma tendría que dar 1, no 2: los $\\pi_k$ son probabilidades y una suma mayor que 1 delata un error de cálculo.', correcta: false,
            retro: 'Lo que suma 1 es $p(s)$ sobre las muestras, no los $\\pi_k$ sobre las unidades. Son cinco probabilidades de cinco sucesos distintos —y no excluyentes—, así que su suma no tiene por qué ser 1: es $E(n)$, y con $n = 2$ tiene que dar 2 exactamente. La comprobación pasó.' },
          { texto: 'Falla que faltan los $\\pi_{kl}$: sin ellos no se puede decidir si el diseño es un MAS ni estimar con $5\\bar y$.', correcta: false,
            retro: 'Los $\\pi_{kl}$ hacen falta para la varianza, no para esta pregunta: con solo mirar que los cinco $\\pi_k$ no son iguales ya se descarta el MAS. Es una respuesta que cita el objeto correcto para el problema equivocado.' }
        ]
      },

      {
        tipo: 'opcion',
        modulo: 3,
        bloque: 3,
        dimension: 'interpretacion',
        ancla: { cap: 2, modulo: 3, titulo: 'El estimador de Horvitz–Thompson', lohr: '2.8' },
        pregunta: 'Sobre la muestra <strong>{1, 3}</strong>, Horvitz–Thompson da <strong>6 782 857,14</strong> y la media muestral expandida $5\\bar y$ da <strong>6 175 000</strong>. Los dos números salen de la misma muestra y son distintos. ¿Qué se puede afirmar?',
        pista: 'No busques cuál está «bien calculado»: los dos lo están. Busca qué promedia cada uno sobre las siete muestras posibles.',
        opciones: [
          { texto: 'Que Horvitz–Thompson es insesgado y la expandida no: la diferencia es de definición, no de cálculo.', correcta: true,
            retro: 'Sobre las siete muestras, Horvitz–Thompson promedia 16 795 000 —el total exacto— y la expandida 13 987 500. La expandida trata a las cinco unidades como si entraran por igual y aquí no entran por igual: por eso se queda sistemáticamente corta, en −2 807 500, y no por un redondeo.' },
          { texto: 'Que una de las dos tiene un error aritmético, porque dos estimadores del mismo total sobre la misma muestra deben coincidir.', correcta: false,
            retro: 'Coincidirían si fueran el mismo estimador, y no lo son: uno divide cada valor entre su propio $\\pi_k$ y el otro multiplica la media por $N$. Dos reglas distintas dan dos números distintos sobre los mismos datos, y eso es lo normal, no una señal de error.' },
          { texto: 'Que la expandida es mejor aquí, porque queda más cerca del total verdadero que Horvitz–Thompson.', correcta: false,
            retro: 'En esta muestra concreta sí queda algo más cerca, y por eso la opción es tentadora. Pero elegir estimador por lo que hizo en la muestra que salió es imposible en la práctica —el total verdadero no se conoce— y además engaña: promediando sobre las siete, la expandida se equivoca siempre en la misma dirección.' },
          { texto: 'Que los dos son insesgados y solo se diferencian en la varianza, que es menor en la expandida.', correcta: false,
            retro: 'La varianza de la expandida sí es menor, y ahí está la trampa: es menor <em>alrededor de un número que no es el total</em>. Un estimador sesgado puede ser muy estable y seguir apuntando mal; para compararlos hace falta el error cuadrático medio, no la varianza sola.' }
        ]
      },

      {
        tipo: 'opcion',
        modulo: 3,
        bloque: 3,
        dimension: 'interpretacion',
        ancla: { cap: 2, modulo: 5, titulo: 'El MAS como caso particular', lohr: '2.3' },
        pregunta: 'La misma muestra de <strong>n = 100</strong> se analiza dos veces. Una salida declara el diseño con <code>fpc</code> y da un error estándar de <strong>292 379,48</strong>; la otra lo declara sin <code>fpc</code> y da <strong>312 650,89</strong>. ¿Cuál corresponde al diseño ejecutado y qué se afirma al usar la otra?',
        pista: 'El muestreo fue sin reemplazo sobre 797 jugadores. Y antes de decidir cuál está «del lado seguro», mira cuál de los dos números es mayor.',
        opciones: [
          { texto: 'La de 292 379,48; la otra infla el error estándar un 6,93 %, así que subestima la precisión en vez de exagerarla.', correcta: true,
            retro: 'El diseño es sin reemplazo y la fracción muestral es del 12,55 %, así que la fpc corresponde y el error estándar del diseño es 292 379,48. Lo que sorprende a mucha gente es la dirección: omitir la fpc no hace parecer la estimación mejor de lo que es, la hace parecer peor. Es un error conservador, pero un error.' },
          { texto: 'La de 312 650,89: ignorar la fpc es la opción prudente, y en caso de duda se declara el error estándar mayor.', correcta: false,
            retro: 'La prudencia es un buen criterio para elegir entre supuestos que no se pueden comprobar, y aquí no hay nada que suponer: se sabe que el muestreo fue sin reemplazo y se conoce $N$. Publicar un error estándar que el diseño no tiene es tan incorrecto como publicar uno demasiado pequeño; solo se equivoca en la otra dirección.' },
          { texto: 'La de 312 650,89: el error estándar de la media siempre se calcula sin fpc, salvo en un censo.', correcta: false,
            retro: 'La fpc no espera al censo: aparece en cuanto el muestreo es sin reemplazo, y vale $1 - n/N$. Solo se desvanece cuando la fracción muestral es diminuta, que es el caso habitual en encuestas nacionales — y es de ahí de donde viene la costumbre de olvidarla.' },
          { texto: 'Da igual cuál se use: con $n = 100$ y $N = 797$ las dos coinciden en la práctica y llevan a la misma conclusión.', correcta: false,
            retro: 'Llevan a la misma conclusión en este caso, sí, pero no coinciden: se separan un 6,93 %, que sobre el semiancho del intervalo son 39 731 dólares. Y «llegan a lo mismo aquí» no es una razón para elegir: es la comprobación que se hace después.' }
        ]
      },

      {
        tipo: 'opcion',
        modulo: 3,
        bloque: 3,
        dimension: 'interpretacion',
        ancla: { cap: 1, modulo: 8, titulo: 'Las poblaciones del curso', lohr: '1.2' },
        pregunta: 'Cuatro archivos sobre los mismos jugadores. <strong>A:</strong> los 797 completos. <strong>B:</strong> los 641 del marco. <strong>C:</strong> un MAS de 100 tomado de los 797, con media 2 564 439,56. <strong>D:</strong> un MAS de 100 tomado del marco, con media 3 161 357,08. ¿Con cuáles se puede <strong>medir</strong> el sesgo del marco?',
        pista: 'Medir un sesgo es restar dos cantidades verdaderas. Pregúntate cuáles de los cuatro archivos contienen una cantidad verdadera y no una estimación.',
        opciones: [
          { texto: 'Solo con A y B juntos: los dos son archivos completos, y su resta da el sesgo exacto.', correcta: true,
            retro: 'Con los dos censos delante el sesgo del marco es una resta, no una inferencia: 2 753 248,22 − 2 497 668,69 = 255 579,53, sin error estándar porque no hay nada aleatorio. Y esa es la razón de que este curso trabaje siempre sobre poblaciones completas: fuera del aula esa resta no se puede hacer, y por eso conviene haberla visto una vez.' },
          { texto: 'Con C y D: sus dos medias se restan y la diferencia estima el sesgo del marco.', correcta: false,
            retro: 'Esa resta da 596 917,52 y estima algo real —la diferencia entre las dos medias poblacionales—, pero con dos errores estándar encima y sin saber cuánto de la diferencia es azar. Estimar no es medir, y confundirlos es justo lo que este ítem separa: una diferencia entre dos muestras podría salir del muestreo aunque el sesgo fuera cero.' },
          { texto: 'Con D solo: su media viene del marco, así que su distancia a la verdadera es el sesgo.', correcta: false,
            retro: 'Para calcular esa distancia hace falta la media verdadera, que en D no está: desde dentro de D no hay forma de saber que 3 161 357,08 se refiere a otra población. Ese es el problema entero de la no cobertura — no se manifiesta como un aviso, se manifiesta como un número que parece normal.' },
          { texto: 'Con ninguno: el sesgo del marco es un concepto teórico y solo se puede acotar, nunca calcular.', correcta: false,
            retro: 'Es lo que ocurre en el trabajo real, donde no hay censo con el que comparar, y por eso la afirmación suena sensata. Pero aquí sí hay censo: con A y B el sesgo sale exacto. Que en la práctica no se pueda medir no lo convierte en teórico; lo convierte en desconocido.' }
        ]
      },

      {
        tipo: 'opcion',
        modulo: 3,
        bloque: 3,
        dimension: 'interpretacion',
        ancla: { cap: 2, modulo: 3, titulo: 'El estimador de Horvitz–Thompson', lohr: '2.8' },
        pregunta: 'En el diseño I, el jugador <strong>5</strong> es el mejor pagado —<strong>7 750 000</strong>— y además el que menos entra: $\\pi_5 = 0{,}30$, así que su peso es <strong>3,3333</strong> y aporta él solo <strong>25 833 333</strong> cuando el total verdadero es <strong>16 795 000</strong>. ¿Qué se sigue de eso?',
        pista: 'Separa las dos preguntas: si el estimador acierta en promedio, y si acierta en cada muestra. Un peso grande no rompe lo primero.',
        opciones: [
          { texto: 'Que el estimador sigue siendo insesgado para el total y, aun así, muy inestable de una muestra a la siguiente.', correcta: true,
            retro: 'Las dos cosas conviven: las muestras que lo incluyen promedian 35 065 476 y las que no, 8 964 796, y sin embargo el promedio global es 16 795 000 exacto. La insesgadez se sostiene porque el jugador 5 entra justo con probabilidad 0,30, la misma que su peso compensa. Lo que el peso grande sí produce es varianza: la desviación típica del estimador es el 86,5 % del total.' },
          { texto: 'Que el estimador está sesgado hacia arriba, porque una sola unidad puede aportar más que el total entero.', correcta: false,
            retro: 'Aportar más que el total no es un síntoma de sesgo: pasa porque cuando el jugador 5 sale tiene que hablar también por las siete de cada diez veces que no sale. El sesgo se mide promediando sobre todas las muestras, y ahí el exceso de unas se cancela con el defecto de otras.' },
          { texto: 'Que hay que recortar ese peso a 2, como el de las demás unidades, para que la estimación no se dispare.', correcta: false,
            retro: 'Recortar pesos es una práctica real —se hace en encuestas con pesos extremos— y tiene un precio que conviene decir: rompe la insesgadez a cambio de varianza. Aplicado aquí sin más, el estimador dejaría de promediar 16 795 000, que es lo único que este diseño garantizaba.' },
          { texto: 'Que el diseño está mal construido: la unidad con el valor más alto debería tener la $\\pi_k$ más alta, no la más baja.', correcta: false,
            retro: 'Como consejo de diseño es correcto, y es exactamente la idea del muestreo con probabilidades proporcionales al tamaño del capítulo 6: dar más probabilidad a lo que más pesa reduce la varianza. Pero eso responde a «cómo lo haría mejor», no a «qué se sigue de este diseño», que es lo que se pregunta.' }
        ]
      },

      // ==============================================================
      // BLOQUE D · Análisis gráfico (7 ítems)
      //
      // La dimensión más flaca del material: 5 de 52 ítems, el 9,6 %. Los siete
      // de aquí piden LEER el gráfico —no ilustran una respuesta que ya está en
      // el enunciado—, y todos llevan `descripcionGrafico`, que es lo único que
      // tiene quien no ve el canvas.
      // ==============================================================
      {
        tipo: 'grafico',
        modulo: 4,
        bloque: 4,
        dimension: 'grafico',
        ancla: { cap: 1, modulo: 8, titulo: 'Las poblaciones del curso', lohr: '1.2' },
        alto: 230,
        descripcionGrafico: 'Distribución del salario en la población objetivo de 797 jugadores y en el marco de 641, las dos en proporción, con las dos medias marcadas con rectas verticales. Las dos distribuciones se concentran contra el eje izquierdo, por debajo del millón; el marco tiene una barra izquierda algo más baja y su media queda a la derecha de la de la población.',
        pregunta: 'Las dos curvas son el salario en la <strong>población objetivo</strong> (797) y en el <strong>marco</strong> (641), en proporción para que el tamaño no confunda. ¿Cuál de estas lecturas es la correcta?',
        pista: 'Mira primero dónde se separan las dos curvas y luego hacia qué lado se ha movido la recta de la media.',
        dibujar: canvas => {
          const H = DP.histograma;
          const alto = Math.max(...H.poblacionProp, ...H.marcoProp) * 1.08;
          return crearGraficoXY(canvas, [
            serieHistograma({ centros: H.centros, conteo: H.poblacionProp }, 'Población objetivo', '#6B7280', 1e-6),
            serieHistograma({ centros: H.centros, conteo: H.marcoProp }, 'Marco', '#012820', 1e-6),
            serieVertical(DP.poblacion.media / 1e6, alto, 'Media de la población', '#6B7280'),
            serieVertical(DP.marco.media / 1e6, alto, 'Media del marco', '#FF6600')
          ], { tituloX: 'Salario (millones de USD)', tituloY: 'Proporción', xMin: 0, xMax: 23 });
        },
        opciones: [
          { texto: 'Al marco le falta sobre todo gente de la parte baja del eje, y por eso su media queda por encima.', correcta: true,
            retro: 'Donde más se separan las dos curvas es en la clase de los salarios más bajos, contra el eje izquierdo: los excluidos son los que no batean, y son los peor pagados. Al quitarlos, la media sube de 2 497 668,69 a 2 753 248,22.' },
          { texto: 'Las dos distribuciones tienen la misma forma; solo cambia la altura porque el marco tiene menos jugadores.', correcta: false,
            retro: 'Las alturas son proporciones y las dos series suman 1 precisamente para que el tamaño no se confunda con la forma. Si solo cambiara el número de jugadores, las dos curvas se superpondrían y las dos medias caerían en el mismo sitio.' },
          { texto: 'Al marco le falta la cola derecha, y por eso su media queda por debajo de la de la población.', correcta: false,
            retro: 'La lectura es coherente consigo misma —perder los salarios más altos bajaría la media—, pero es lo contrario de lo que muestra el gráfico: la recta naranja del marco está a la <em>derecha</em>. Conviene comprobar la dirección en el dibujo antes de razonar sobre ella.' },
          { texto: 'Las dos medias caen donde está el grueso de los jugadores, así que ninguna de las dos distribuciones es asimétrica.', correcta: false,
            retro: 'Ninguna de las dos rectas cae sobre el grueso: las dos están muy a la derecha del pico, que es la firma de una distribución con cola larga. De hecho la mediana de la población es 800 000 frente a una media de 2 497 668,69, y esa distancia es la asimetría.' }
        ]
      },

      {
        tipo: 'grafico',
        modulo: 4,
        bloque: 4,
        dimension: 'grafico',
        ancla: { cap: 2, modulo: 1, titulo: 'El diseño muestral $p(s)$', lohr: '2.8' },
        alto: 230,
        descripcionGrafico: 'Diagrama de barras con las siete muestras del soporte del diseño I y su probabilidad: la pareja de los jugadores 1 y 2 tiene la barra más alta, 0,25; las parejas 1-3, 2-5 y 4-5 tienen 0,15; y las parejas 1-4, 2-3 y 3-4 tienen 0,10.',
        pregunta: 'Cada barra es una muestra que el diseño I puede sacar, con su probabilidad. ¿Cuánto vale $\\pi_4$, la probabilidad de que el jugador <strong>4</strong> entre en la muestra?',
        pista: 'La probabilidad de inclusión no es un objeto nuevo: es una suma de barras. Localiza las que contienen al 4 y súmalas.',
        dibujar: canvas => {
          const G = DP.disenoPequeno;
          return crearGraficoBarras(canvas,
            G.muestras.map(s => '{' + s.join(', ') + '}'),
            G.ps,
            { etiqueta: 'Probabilidad de la muestra', tituloX: 'Muestra posible', min: 0, max: 0.3 });
        },
        opciones: [
          { texto: '0,35', correcta: true,
            retro: 'El jugador 4 está en tres muestras del soporte, y sus barras suman 0,35. Es la definición aplicada tal cual: $\\pi_k$ es la suma de $p(s)$ sobre las muestras que contienen a $k$, y con el diseño dibujado se lee sin fórmulas.' },
          { texto: '0,15', correcta: false,
            retro: 'Es la altura de una sola de las barras que lo contienen. Quedarse con una es olvidar que el jugador entra por cualquiera de las tres vías, y las tres cuentan.' },
          { texto: '0,20', correcta: false,
            retro: 'Es lo que sale de sumar dos de las tres barras. Merece la pena repasar la lista completa: la comprobación es que los cinco $\\pi_k$ sumen 2, y con 0,20 aquí la suma no cierra.' },
          { texto: '0,40', correcta: false,
            retro: 'Es el $\\pi_k$ que tendría cualquier unidad bajo un MAS de $n = 2$ sobre cinco jugadores: cuatro parejas de diez. Pero este diseño no reparte por igual entre las diez parejas —solo siete tienen probabilidad positiva—, así que ese número no le corresponde a nadie aquí.' }
        ]
      },

      {
        tipo: 'grafico',
        modulo: 4,
        bloque: 4,
        dimension: 'grafico',
        ancla: { cap: 2, modulo: 3, titulo: 'El estimador de Horvitz–Thompson', lohr: '2.8' },
        alto: 240,
        descripcionGrafico: 'Para cada una de las siete muestras posibles del diseño I, dos barras en millones de dólares: la estimación de Horvitz-Thompson y la de la media muestral expandida, con una línea horizontal en el total verdadero, 16 795 000. Las barras de Horvitz-Thompson superan a las de la expandida en seis de las siete muestras, y en tres de ellas las dos series quedan por debajo de la línea.',
        pregunta: 'Las dos series son los dos estimadores del total, calculados sobre <strong>cada una</strong> de las siete muestras posibles, y la línea es el total verdadero. ¿Cuál de los dos está centrado en la línea?',
        pista: 'Estar centrado no es tocar la línea a menudo: es que el promedio de las barras, pesando cada una por la probabilidad de su muestra, caiga sobre ella.',
        dibujar: canvas => {
          const G = DP.disenoPequeno;
          return crearGraficoBarras(canvas,
            G.muestras.map(s => '{' + s.join(', ') + '}'),
            G.tHT.map(v => v / 1e6),
            { etiqueta: 'Horvitz–Thompson', tituloX: 'Muestra posible', min: 0, max: 46,
              barrasExtra: [{ etiqueta: 'Media muestral expandida', valores: G.tExp.map(v => v / 1e6), color: '#FF6600' }],
              lineas: [{ valor: G.total / 1e6, etiqueta: 'Total verdadero', color: '#0e7490' }] });
        },
        opciones: [
          { texto: 'El estimador de Horvitz–Thompson, aunque no toque la línea en ninguna muestra.', correcta: true,
            retro: 'Pesando cada barra por la probabilidad de su muestra, Horvitz–Thompson promedia 16 795 000 —la línea exacta— y la expandida 13 987 500, siempre por debajo. Y fíjate en lo que el gráfico deja ver: la serie centrada es también la más dispersa. Estar centrado y ser preciso son cosas distintas.' },
          { texto: 'La media muestral expandida, aunque sus barras estén más juntas entre sí.', correcta: false,
            retro: 'Sus barras están más juntas y varias caen cerca de la línea, que es lo que hace tentadora esta lectura. Pero se quedan cortas de forma sistemática: su promedio ponderado es 13 987 500, un sesgo de −2 807 500 que no se corrige con más muestras.' },
          { texto: 'Los dos, porque los dos tienen barras por encima y por debajo de la línea.', correcta: false,
            retro: 'Cruzar la línea por los dos lados es necesario pero no basta: lo que decide es el promedio <em>ponderado</em>, y las muestras no son igual de probables. Una barra muy alta con probabilidad 0,10 pesa menos que dos barras bajas con 0,25.' },
          { texto: 'Ninguno: con siete muestras posibles no hay bastantes para que un estimador esté centrado.', correcta: false,
            retro: 'La insesgadez no es un resultado asintótico y no pide muchas muestras: es una igualdad exacta sobre el soporte, sea cual sea su tamaño. Con estas siete se comprueba a mano, que es justo la ventaja de una población tan pequeña.' }
        ]
      },

      {
        tipo: 'grafico',
        modulo: 4,
        bloque: 4,
        dimension: 'grafico',
        ancla: { cap: 2, modulo: 6, titulo: 'Intervalos de confianza', lohr: '2.3' },
        alto: 230,
        descripcionGrafico: 'Tres intervalos de confianza construidos sobre la misma muestra —al 90 %, al 95 % y al 99 %—, dibujados como segmentos horizontales apilados, con una recta vertical en la media verdadera de la población. El intervalo al 90 % es el más corto y su extremo derecho queda a la izquierda de la recta; los otros dos la cruzan.',
        pregunta: 'Los tres intervalos salen de la <strong>misma muestra</strong>, con media 2 090 604,66 y error estándar 246 100,04; la vertical es la media verdadera de los 797. ¿Qué conclusión permite el gráfico?',
        pista: 'Los tres tienen el mismo centro. Lo único que cambia es cuánto se alargan, y eso se paga.',
        dibujar: canvas => {
          const C = DP.confianza;
          const colores = ['#6B7280', '#012820', '#0e7490'];
          const series = C.niveles.map((niv, j) => ({
            type: 'line', label: 'Intervalo al ' + niv + ' %',
            data: [{ x: C.lo[j] / 1e6, y: 3 - j }, { x: C.hi[j] / 1e6, y: 3 - j }],
            borderColor: colores[j], borderWidth: 7, pointRadius: 4, fill: false
          }));
          series.push(serieVertical(C.mu / 1e6, 3.6, 'Media verdadera', '#FF6600'));
          return crearGraficoXY(canvas, series,
            { tituloX: 'Salario medio (millones de USD)', tituloY: '', xMin: 1.3, xMax: 3.0 });
        },
        opciones: [
          { texto: 'Que subir la confianza se paga en anchura, y que el intervalo al 90 % es el único de los tres que no cubre.', correcta: true,
            retro: 'Los tres tienen el mismo centro y solo cambia el multiplicador: los semianchos van de 404 798,54 al 90 % a 633 911,69 al 99 %, un precio de 229 113,15 por esos nueve puntos de confianza. Y esta muestra es una de las que quedan fuera al 90 %: pasa en una de cada diez, y aquí se puede ver porque la media verdadera se conoce.' },
          { texto: 'Que la muestra está sesgada, porque su media queda a la izquierda de la verdadera en los tres intervalos.', correcta: false,
            retro: 'El centro es el mismo en los tres porque los tres salen de la misma muestra: no son tres pruebas independientes, es un único resultado dibujado tres veces. Y una muestra que cae baja no delata un sesgo del diseño; el muestreo aleatorio simple es insesgado y aun así cada muestra concreta cae donde cae.' },
          { texto: 'Que el nivel del 95 % es el correcto y los otros dos están mal construidos, porque un intervalo o cubre o no cubre.', correcta: false,
            retro: 'Los tres están bien construidos: cada uno cumple lo suyo, cubrir en el 90, el 95 o el 99 % de las muestras posibles. Que este en concreto cubra o no es un resultado del sorteo, no un defecto del intervalo — y la confianza es una propiedad del procedimiento, igual que la insesgadez.' },
          { texto: 'Que hace falta más muestra: con n = 100 los tres intervalos son demasiado anchos para decidir nada.', correcta: false,
            retro: 'Más muestra los estrecharía, sí, pero el gráfico no habla de eso: los tres tienen exactamente el mismo $n$. Lo que separa a estos tres segmentos no es información, es cuánta confianza se le exige al procedimiento.' }
        ]
      },

      {
        tipo: 'grafico',
        modulo: 4,
        bloque: 4,
        dimension: 'grafico',
        ancla: { cap: 2, modulo: 8, titulo: 'Diseño Bernoulli y muestreo con reemplazo', lohr: '2.2 · 2.6' },
        alto: 230,
        descripcionGrafico: 'Histograma del tamaño de muestra obtenido en 2 000 réplicas de un diseño Bernoulli con probabilidad 0,125 sobre 797 unidades, con una recta vertical en el tamaño esperado. La distribución es simétrica alrededor de la recta y se extiende de 70 a 133.',
        pregunta: 'Cada réplica es una ejecución del <strong>diseño Bernoulli</strong> con $\\pi_k = 0{,}125$ sobre los 797 jugadores, y el histograma cuenta el <strong>tamaño de muestra que salió</strong>. ¿Qué se lee aquí?',
        pista: 'En este diseño nadie fija el tamaño: se sortea cada unidad por separado. Piensa qué es entonces la recta vertical.',
        dibujar: canvas => {
          const B = DP.bernoulli;
          const alto = Math.max(...B.conteo) * 1.1;
          return crearGraficoXY(canvas, [
            serieHistograma({ centros: B.centros, conteo: B.conteo }, 'Réplicas', '#012820'),
            serieVertical(B.En, alto, 'Tamaño esperado', '#FF6600')
          ], { tituloX: 'Tamaño de la muestra obtenida', tituloY: 'Réplicas', xMin: 65, xMax: 140 });
        },
        opciones: [
          { texto: 'Que el tamaño es una variable aleatoria centrada en 99,625, y esa dispersión se paga en varianza.', correcta: true,
            retro: 'La recta está en $\\sum_U \\pi_k = E(n_s) = 99{,}625$, y las réplicas se reparten a su alrededor con desviación típica 9,3366 — en la simulación, 99,44 y 9,53. Un diseño de tamaño fijo no tendría este histograma sino una sola barra, y esa es exactamente la varianza extra que el diseño Bernoulli añade a cambio de su simplicidad.' },
          { texto: 'Que el diseño está mal implementado: si $\\pi_k$ es 0,125 para todos, el tamaño tendría que salir 99 o 100 siempre.', correcta: false,
            retro: 'Saldría siempre lo mismo si las inclusiones estuvieran atadas entre sí, y en Bernoulli no lo están: se lanza una moneda por jugador, de forma independiente. El histograma no delata un fallo de programación, muestra la definición del diseño.' },
          { texto: 'Que la dispersión viene de que la población es muy asimétrica en salarios.', correcta: false,
            retro: 'El eje no mide salarios: cuenta jugadores. La forma de la población no interviene aquí en absoluto — este histograma saldría idéntico si todos cobraran lo mismo, porque solo depende de $N$ y de $\\pi$.' },
          { texto: 'Que la recta marca la mediana de los tamaños observados, y el tamaño esperado sería el pico del histograma.', correcta: false,
            retro: 'La recta es $E(n_s)$, calculado antes de simular nada como $797 \\times 0{,}125$; no se leyó de las réplicas. Que además caiga muy cerca del pico y de la mediana es una consecuencia de que esta distribución sea casi simétrica, no su definición.' }
        ]
      },

      {
        tipo: 'grafico',
        modulo: 4,
        bloque: 4,
        dimension: 'grafico',
        ancla: { cap: 2, modulo: 9, titulo: 'Muestreo sistemático', lohr: '2.6' },
        alto: 240,
        descripcionGrafico: 'Dos curvas sobre 21 saltos, de k = 20 a k = 40, de la razón entre la varianza real del muestreo sistemático y la que declararía la fórmula del muestreo aleatorio simple, con una línea discontinua en 1. La curva del orden A oscila alrededor de la línea y la cruza en 11 de los 21 saltos, con un mínimo de 0,605 en k = 26; la curva del orden B se mantiene plana y muy por debajo, entre 0,066 y 0,133, sin cruzar nunca la línea.',
        pregunta: 'El <strong>mismo</strong> marco de 797 jugadores, ordenado de dos maneras, y para cada salto $k$ la razón entre la <strong>varianza real</strong> del sistemático y la que declararía la fórmula del MAS. Uno de los dos órdenes es <strong>por salario</strong> y el otro es como llega el fichero. ¿Cuál es cuál, y qué se concluye del mínimo de 0,605 que alcanza el orden A?',
        pista: 'Un efecto estructural no depende del salto que se elija. Pregúntate cuál de las dos curvas se comporta igual en los 21 saltos.',
        dibujar: canvas => {
          const S = DP.sistematico;
          const curva = (vals, etiqueta, color) => ({
            type: 'line', label: etiqueta,
            data: S.saltos.map((k, i) => ({ x: k, y: vals[i] })),
            borderColor: color, borderWidth: 2, pointRadius: 2.5, fill: false
          });
          return crearGraficoXY(canvas, [
            curva(S.razonFichero, 'Orden A', '#012820'),
            curva(S.razonSalario, 'Orden B', '#FF6600'),
            { type: 'line', label: 'Igual que el MAS',
              data: [{ x: S.saltos[0], y: 1 }, { x: S.saltos[S.saltos.length - 1], y: 1 }],
              borderColor: '#94a3b8', borderDash: [6, 4], borderWidth: 1.5, pointRadius: 0, fill: false }
          ], { tituloX: 'Salto k', tituloY: 'Varianza real / varianza del MAS', xMin: 20, xMax: 40 });
        },
        opciones: [
          { texto: 'B es el orden por salario, y el 0,605 de A es el extremo bajo de una banda de ruido, no un efecto.', correcta: true,
            retro: 'Ordenar por lo que se mide estratifica de verdad, y se nota en los 21 saltos: la curva B se queda entre 0,066 y 0,133 sin acercarse nunca a 1. La curva A oscila alrededor de 1 —mediana 1,009, y la cruza en 11 de los 21 saltos—, así que su mínimo no dice nada del orden: en $k = 25$ da 1,069 y en $k = 27$, 1,095. Un efecto real no cambia de signo con el salto de al lado.' },
          { texto: 'A es el orden por salario, porque es la única curva que baja de 1 en algunos saltos.', correcta: false,
            retro: 'Bajar de 1 en algunos saltos es lo que hace cualquier orden por azar: en unos $k$ sale mejor que el MAS y en otros peor. Lo que delata a una ordenación útil no es tocar el mínimo una vez, es no volver a subir.' },
          { texto: 'B es el orden por salario, y con él la fórmula del MAS sobrestima la varianza, así que se puede usar sin problema.', correcta: false,
            retro: 'Identificar B como el orden por salario es correcto; la conclusión que le sigue, no. Declarar una varianza siete veces mayor que la real no es prudente, es tirar la precisión que el diseño consiguió. Y en el orden A la fórmula del MAS se equivoca en la otra dirección en 11 de 21 saltos, que ahí sí es peligroso.' },
          { texto: 'Las dos curvas son el mismo orden con dos semillas distintas: la diferencia es simulación, no estructura.', correcta: false,
            retro: 'No hay simulación en este gráfico: con $N = 797$ y un salto $k$ hay exactamente $k$ muestras posibles y las dos curvas recorren todas, sin azar. La separación entre ellas es estructural — es la única explicación que queda cuando no hay semilla que culpar.' }
        ]
      },

      {
        tipo: 'grafico',
        modulo: 4,
        bloque: 4,
        dimension: 'grafico',
        ancla: { cap: 2, modulo: 6, titulo: 'Intervalos de confianza', lohr: '2.3' },
        alto: 230,
        descripcionGrafico: 'Distribución de la media muestral en 4 000 réplicas para tres tamaños de muestra —25, 100 y 400— sobre la misma población asimétrica, con una recta vertical en la media verdadera. Las tres están centradas en la recta; la de n = 25 es ancha y con una cola derecha visible, la de n = 100 es más estrecha y todavía algo asimétrica, y la de n = 400 es alta, estrecha y simétrica.',
        pregunta: 'Tres tamaños de muestra sobre la <strong>misma</strong> población, 4 000 réplicas cada uno. Las coberturas reales de los intervalos al 95 % son <strong>89,4 %</strong> con n = 25, <strong>93,8 %</strong> con n = 100 y <strong>95,3 %</strong> con n = 400. ¿Qué explica que la del 95 % nominal no se cumpla con las muestras pequeñas?',
        pista: 'Los tres intervalos usan el mismo 1,96, que sale de una aproximación normal. Mira qué forma tiene cada una de las tres distribuciones.',
        dibujar: canvas => {
          const M = DP.distribucionMedia;
          const colores = ['#94a3b8', '#012820', '#FF6600'];
          const series = M.tamanos.map((nn, j) =>
            serieHistograma({ centros: M.centros, conteo: M.prop[j] }, 'n = ' + nn, colores[j], 1e-6));
          series.push(serieVertical(M.mu / 1e6, Math.max(...M.prop[2]) * 1.08, 'Media verdadera', '#0e7490'));
          return crearGraficoXY(canvas, series,
            { tituloX: 'Media de la muestra (millones de USD)', tituloY: 'Proporción de réplicas',
              xMin: 0.4, xMax: 5.6 });
        },
        opciones: [
          { texto: 'Que con n pequeño la distribución de la media todavía es asimétrica y la aproximación normal no vale.', correcta: true,
            retro: 'El 1,96 sale de suponer que la media muestral es normal, y aquí tarda en serlo: la asimetría de las réplicas va de 0,431 con n = 25 a 0,211 con n = 100 y a −0,007 con n = 400, y la cobertura sigue ese mismo camino. Con una población así de sesgada el teorema del límite central funciona, pero funciona despacio.' },
          { texto: 'Que el estimador está sesgado con n pequeño, y el sesgo se va corrigiendo al aumentar la muestra.', correcta: false,
            retro: 'Las tres distribuciones están centradas en la misma recta: la media muestral es insesgada para cualquier $n$, y el gráfico lo confirma. Lo que cambia con $n$ no es dónde está centrada, es su forma — y la cobertura depende de la forma.' },
          { texto: 'Que el error estándar está mal calculado con n pequeño, porque la fpc no se aplica a muestras de menos de 30.', correcta: false,
            retro: 'La fpc se aplicó en las tres, y no tiene ningún umbral: vale $1 - n/N$ para cualquier tamaño. De hecho con n = 25 la fpc apenas corrige nada, así que no puede ser la causa de una cobertura ocho puntos por debajo de lo prometido.' },
          { texto: 'Que 4 000 réplicas son pocas para estimar una cobertura, y las tres cifras son la misma dentro del error de simulación.', correcta: false,
            retro: 'Con 4 000 réplicas el error de simulación de una cobertura ronda los 0,3 puntos porcentuales, y la distancia entre 89,4 % y 95,3 % es de casi seis: eso no cabe en el ruido. Es una comprobación que conviene hacer siempre antes de leer una simulación, y aquí sale a favor de que la diferencia es real.' }
        ]
      }
    ];

    // El motor pinta AUTOEVALUACIONES[id] sobre el contenedor data-quiz="id".
    // Un bloque por dimensión, en el orden en que aparecen los módulos.
    [1, 2, 3, 4].forEach(b => {
      AUTOEVALUACIONES['preparcial-b' + b] = BANCO_PREPARCIAL.filter(p => p.bloque === b);
    });
