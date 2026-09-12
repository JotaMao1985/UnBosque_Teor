    // ================================================================
    // Simulacro del Parcial 1 — Taller 1 (recurso de práctica)
    //
    // 30 ítems repartidos por semanas, en la proporción de la matriz de
    // contenidos (T0.1):
    //
    //   Semana                      total  opcion  multiple  numerica  texto  grafico
    //   1 · población y marco          5      3        1         0       1       0
    //   2 · sesgos y error total       8      4        1         1       1       1
    //   3 · probabilístico, π_k, MAS   9      3        1         3       1       1
    //   4 · tamaño y sistemático       8      3        1         2       1       1
    //   TOTAL                         30     13        4         6       4       3
    //
    // `modulo` es la semana, y los cuatro primeros módulos de esta página SON
    // las cuatro semanas: así el resumen final del quiz («te costaron preguntas
    // de estos módulos») nombra la semana que hay que repasar.
    //
    // `ancla` no la usa el motor del quiz: la lee el mapa de repaso, que
    // enlaza cada ítem con su módulo del capítulo 1 o 2 y con su sección de
    // Lohr. Ningún ítem exige nada que no esté enseñado en esos dos capítulos.
    //
    // LAS CIFRAS. Ninguna se escribe a mano: todas salen de
    // precalculo/genera_taller1_recurso.R, que las deja en DATOS_TALLER1. Las
    // poblaciones son htpop (N = 2 000 estaturas, la población completa),
    // htsrs (el MAS de n = 200 que Lohr extrae de ella) y crimes (5 000
    // registros). Ninguna aparece en la entrega calificada —que usa intelltel,
    // intellonline y agpop—, así que el simulacro no regala sus respuestas.
    //
    // PENDIENTE PARA T4.3: el motor heredado de los capítulos entiende cuatro
    // tipos —opcion, multiple, numerica y grafico—. Los cuatro ítems de tipo
    // 'texto' que pide la matriz necesitan un tipo nuevo: respuesta abierta con
    // autocorrección guiada (área de texto, botón que revela `respuestaModelo`
    // y una lista `comprobacion` de tres puntos que el estudiante se marca).
    // Se declaran aquí con esa forma; el tipo se implementa al ensamblar.
    // ================================================================
    // Un solo nombre nuevo en el espacio global de la página. El motor de un
    // capítulo son ~180 KB de JavaScript compartido, y un `const` repetido no
    // da un fallo visible: mata el <script> entero y la página se queda en
    // blanco. Lo demás se lee por su ruta: DT.poblacion, DT.cobertura…
    const DT = DATOS_TALLER1;

    const BANCO_TALLER1 = [

      // ==============================================================
      // SEMANA 1 · Población, marco y unidades (5 ítems)
      // ==============================================================
      {
        tipo: 'opcion',
        modulo: 1,
        semana: 1,
        ancla: { cap: 1, modulo: 2, titulo: 'Marco conceptual', lohr: '1.1–1.2' },
        pregunta: 'La universidad quiere estimar <strong>cuántas horas a la semana estudia fuera de clase un estudiante de pregrado</strong>. Envía el cuestionario a los correos institucionales de los matriculados en el semestre en curso. ¿Cuál es la <strong>población muestreada</strong>?',
        pista: 'La población muestreada es la que el marco permite alcanzar, no la que se quería estudiar ni la que acabó contestando.',
        opciones: [
          { texto: 'Los matriculados en el semestre en curso que tienen un correo institucional activo.', correcta: true,
            retro: 'Eso es. La población muestreada es la que el <em>marco</em> alcanza: si el marco es la lista de correos institucionales, quien no tenga uno activo no puede salir en la muestra por más veces que se repita el sorteo.' },
          { texto: 'Todos los estudiantes de pregrado del país.', correcta: false,
            retro: 'Esa ni siquiera es la población objetivo del estudio, que se limita a la universidad. Confundir el alcance del estudio con el de la disciplina es el error que la definición de población objetivo evita.' },
          { texto: 'Los estudiantes que contestaron el cuestionario.', correcta: false,
            retro: 'Esos son los <em>respondientes</em>, que salen después de muestrear y después de la no respuesta. La población muestreada existe antes de enviar nada: la define el marco.' },
          { texto: 'Los estudiantes de pregrado que la universidad quiere estudiar, sin más.', correcta: false,
            retro: 'Esa es la población <strong>objetivo</strong>. La gracia del par objetivo/muestreada es precisamente que no coinciden, y el hueco entre las dos es donde vive el sesgo de cobertura.' }
        ]
      },

      {
        tipo: 'opcion',
        modulo: 1,
        semana: 1,
        ancla: { cap: 1, modulo: 2, titulo: 'Marco conceptual', lohr: '1.2' },
        pregunta: 'Una encuesta de salud selecciona <strong>hogares</strong> de un listado catastral y mide la estatura de <strong>cada persona</strong> que vive en el hogar seleccionado. ¿Cuál es la unidad de muestreo y cuál la de observación?',
        pista: 'La unidad de muestreo es la que aparece listada en el marco y sobre la que se sortea; la de observación es sobre la que se mide $y$.',
        opciones: [
          { texto: 'Unidad de muestreo: el hogar. Unidad de observación: la persona.', correcta: true,
            retro: 'Correcto. Lo que se sortea es lo que está listado en el marco —los hogares—, y lo que se mide es la persona. Que las dos no coincidan es lo normal, y obliga a llevar la cuenta de cuál es cuál al calcular pesos y errores estándar.' },
          { texto: 'Las dos son la persona: al final la estatura se le mide a personas.', correcta: false,
            retro: 'La persona no estaba en el marco: no se le podía sortear. Si las unidades de muestreo fueran personas, dos personas del mismo hogar habrían tenido que poder entrar por separado, y aquí entran o salen juntas.' },
          { texto: 'Las dos son el hogar: se sortearon hogares.', correcta: false,
            retro: 'El hogar no tiene estatura. La variable $y$ se define sobre personas, así que la unidad de observación es la persona aunque el sorteo haya sido de hogares.' },
          { texto: 'Unidad de muestreo: la persona. Unidad de observación: el hogar.', correcta: false,
            retro: 'Al revés. Se sortea lo que el marco lista (hogares) y se observa lo que se mide (personas).' }
        ]
      },

      {
        tipo: 'opcion',
        modulo: 1,
        semana: 1,
        ancla: { cap: 1, modulo: 4, titulo: 'Sesgo de selección', lohr: '1.2–1.3' },
        pregunta: 'La oficina de análisis tiene el archivo de los <strong>5 000 delitos registrados</strong> por la policía el año pasado y quiere estimar qué proporción de los delitos <strong>cometidos</strong> en la ciudad terminó en arresto. ¿Qué separa aquí el marco de la población objetivo?',
        pista: '¿Qué hace falta para que un delito llegue a estar en ese archivo?',
        opciones: [
          { texto: 'Un delito solo entra al archivo si alguien lo denuncia y la policía lo registra.', correcta: true,
            retro: 'Exacto. El marco cubre los delitos <em>registrados</em>, no los cometidos, y la diferencia no es aleatoria: los tipos de delito que menos se denuncian quedan sistemáticamente fuera. Es un problema de cobertura, y ningún tamaño de muestra lo arregla.' },
          { texto: 'Nada: 5 000 delitos son suficientes para representar a todos los delitos de la ciudad.', correcta: false,
            retro: 'El número de registros no dice nada sobre qué población representan. Un marco incompleto con 5 000 registros sigue siendo un marco incompleto con 500 000.' },
          { texto: 'Que el archivo es del año pasado y las proporciones cambian con el tiempo.', correcta: false,
            retro: 'Eso sería un problema si la población objetivo fuera «los delitos de este año». Tal como está planteado el estudio, el desfase temporal no es lo que separa el marco de la población: lo que la separa es que un delito no denunciado nunca llega al archivo.' },
          { texto: 'Que la variable «arresto» se mide con error.', correcta: false,
            retro: 'Eso sería sesgo de medición, y es otro problema. Aquí la pregunta es quién <em>puede</em> entrar en la muestra, que es cuestión de marco.' }
        ]
      },

      {
        tipo: 'multiple',
        modulo: 1,
        semana: 1,
        ancla: { cap: 1, modulo: 2, titulo: 'Marco conceptual', lohr: '1.2–1.3' },
        pregunta: 'Marca <strong>todos</strong> los problemas que son <em>de marco</em> —de quién puede llegar a estar en la muestra— y no de medición ni de no respuesta.',
        pista: 'Pregúntate en cada caso: ¿esta unidad podía haber salido sorteada, sí o no?',
        opciones: [
          { texto: 'La lista de correos no incluye a quienes se matricularon después de la fecha de corte.', correcta: true },
          { texto: 'El directorio telefónico solo tiene líneas fijas y una parte de la población ya solo usa celular.', correcta: true },
          { texto: 'Un 20 % de los seleccionados no contesta el cuestionario.', correcta: false },
          { texto: 'La pregunta sobre horas de estudio induce a exagerar.', correcta: false },
          { texto: 'La misma persona aparece dos veces en el listado, con dos correos.', correcta: true }
        ],
        retroAcierto: 'Las tres de marco: la lista que llega tarde, el directorio que solo cubre las líneas fijas y el listado con duplicados son los tres defectos clásicos del marco —subcobertura, subcobertura y duplicación —que le da a esa persona el doble de probabilidad de entrar——. El 20 % que no contesta sí estaba en el marco (es no respuesta) y la pregunta mal redactada mide mal a quien sí llegó (es medición).',
        retroFallo: 'Un defecto es de marco cuando decide <em>quién puede salir sorteado</em>. Con ese criterio: la fecha de corte y el directorio de fijos dejan gente fuera, y el duplicado le da a alguien dos oportunidades. En cambio, quien no contesta ya había sido seleccionado, y la pregunta que induce a exagerar afecta a la respuesta, no a la selección.'
      },

      {
        tipo: 'texto',
        modulo: 1,
        semana: 1,
        ancla: { cap: 1, modulo: 2, titulo: 'Marco conceptual', lohr: '1.1–1.2' },
        pregunta: 'En tres frases, para la encuesta de horas de estudio de la pregunta 1: define la <strong>población objetivo</strong>, el <strong>marco</strong> y la <strong>unidad</strong>, y nombra una unidad que esté en el marco pero <strong>no</strong> en la población objetivo.',
        pista: 'El caso que se busca es alguien que la lista alcanza pero que el estudio no quería estudiar: sobrecobertura.',
        respuestaModelo: 'Población objetivo: los estudiantes de pregrado matriculados en la universidad en el semestre en curso. Marco: la lista de correos institucionales activos de esa matrícula. Unidad de muestreo y de observación: el estudiante. Una unidad que está en el marco pero no en la población objetivo es un estudiante de <strong>posgrado</strong> con correo institucional, o alguien que canceló la matrícula y conserva el correo activo: la lista lo alcanza, pero el estudio no lo quiere. Es sobrecobertura, y se detecta y se depura en el propio marco.',
        comprobacion: [
          'Nombré la población objetivo delimitando quién sí y quién no (pregrado, esta universidad, este semestre), no como una etiqueta vaga.',
          'Distinguí el marco de la población: el marco es la lista concreta, y dije cuál es.',
          'Mi ejemplo está en el marco y fuera de la población objetivo (sobrecobertura), no al revés.'
        ]
      },

      // ==============================================================
      // SEMANA 2 · Sesgos y error total (8 ítems)
      // ==============================================================
      {
        tipo: 'opcion',
        modulo: 2,
        semana: 2,
        ancla: { cap: 1, modulo: 5, titulo: 'Sesgo de medición', lohr: '1.3' },
        pregunta: 'El cuestionario pregunta «¿cuántas horas a la semana estudias fuera de clase?» y los estudiantes tienden a redondear hacia arriba. ¿Cómo se clasifica esto y en qué dirección va?',
        pista: 'La persona correcta fue seleccionada y sí contestó. El problema está en el valor que quedó registrado.',
        opciones: [
          { texto: 'Sesgo de medición, y la estimación queda por <strong>encima</strong> del valor verdadero.', correcta: true,
            retro: 'Sí. La unidad correcta entró en la muestra y contestó; lo que falla es el valor registrado, que difiere sistemáticamente del verdadero. Como el redondeo va en un solo sentido, el sesgo es positivo y no se cancela al promediar.' },
          { texto: 'Sesgo de selección, porque responden los que más estudian.', correcta: false,
            retro: 'El enunciado no dice nada sobre quién responde: dice que quienes responden declaran de más. Selección es <em>quién entra</em>; medición es <em>qué se registra</em> de quien ya entró.' },
          { texto: 'Error muestral, que se reduce aumentando $n$.', correcta: false,
            retro: 'El error muestral es la variabilidad de muestra a muestra y tiene esperanza cero. Aquí todas las muestras exageran en el mismo sentido, así que no es error muestral: es sesgo, y $n$ no lo toca.' },
          { texto: 'No respuesta, porque la pregunta es incómoda.', correcta: false,
            retro: 'La no respuesta es no contestar. Aquí sí contestan, y contestan mal, que es un problema distinto y se ataca de otra manera: rediseñando la pregunta, no insistiendo para que respondan.' }
        ]
      },

      {
        tipo: 'opcion',
        modulo: 2,
        semana: 2,
        ancla: { cap: 1, modulo: 4, titulo: 'Sesgo de selección', lohr: '1.3–1.4' },
        pregunta: 'Se deja un código QR en la salida del comedor universitario para calificar el servicio de 1 a 5. Contestan 640 personas y la media sale 2,3. ¿Qué se puede decir de esa cifra como estimación de la satisfacción media de quien come allí?',
        pista: '¿Quién se toma la molestia de sacar el celular y escanear un código para calificar un almuerzo?',
        opciones: [
          { texto: 'Es una muestra autoseleccionada, y lo más probable es que <strong>subestime</strong> la satisfacción media.', correcta: true,
            retro: 'Correcto, y fíjate en que la respuesta tiene dos partes: nombrar el mecanismo (autoselección) y <em>dar la dirección</em>. La dirección es la mitad que casi nadie escribe y la que el parcial pregunta.' },
          { texto: 'Con 640 respuestas la muestra ya es grande, así que la estimación es fiable.', correcta: false,
            retro: 'El tamaño no compra insesgadez. Si el mecanismo de respuesta favorece a los descontentos, 640 respuestas dan una estimación mala con un error estándar pequeño: precisión alrededor del número equivocado.' },
          { texto: 'Es válida porque cualquiera que salga del comedor podía escanear el código.', correcta: false,
            retro: '«Podía» no basta: en un diseño probabilístico la probabilidad de entrar la fija el investigador y se conoce. Aquí la fija cada comensal con su decisión de escanear, y nadie sabe cuánto vale.' },
          { texto: 'Sobrestima la satisfacción, porque quien está enfadado se va sin calificar.', correcta: false,
            retro: 'Es la dirección contraria a la que se observa en este tipo de encuestas voluntarias: responder cuesta poco y el descontento es el motivo más habitual para hacerlo. En todo caso, lo que hay que poder defender es <em>por qué</em> se elige una dirección u otra.' }
        ]
      },

      {
        tipo: 'opcion',
        modulo: 2,
        semana: 2,
        ancla: { cap: 1, modulo: 7, titulo: 'El error total de encuesta', lohr: '1.3–1.6' },
        pregunta: 'Para estimar la estatura media de los adultos de una ciudad, el marco se arma con las fichas de los socios de un gimnasio. ¿Cuál es el problema y en qué se diferencia de la no respuesta?',
        pista: 'Pregúntate quién <em>no podía</em> salir en la muestra, hiciera lo que hiciera.',
        opciones: [
          { texto: 'Es <strong>no cobertura</strong>: quien no es socio tiene probabilidad cero de entrar.', correcta: true,
            retro: 'Eso es. La distinción operativa es esa: en la no cobertura la unidad nunca pudo ser sorteada ($\\pi_k = 0$); en la no respuesta fue sorteada y no contestó. Se diagnostican distinto y se corrigen distinto.' },
          { texto: 'Es no respuesta, porque falta la mayor parte de la ciudad.', correcta: false,
            retro: 'Faltar no es lo mismo que no responder. A quien no es socio nunca se le preguntó nada, porque nunca estuvo en la lista de la que se sorteó.' },
          { texto: 'No hay problema si la muestra dentro del gimnasio se toma aleatoriamente.', correcta: false,
            retro: 'La aleatorización dentro de un marco malo da estimaciones insesgadas… de la población del marco, que son los socios. Sobre los adultos de la ciudad no dice nada.' },
          { texto: 'Es sesgo de medición, porque en un gimnasio se mide la estatura con más cuidado.', correcta: false,
            retro: 'Medir con más cuidado mejoraría la medición, no la empeoraría. El defecto está antes: en quién puede entrar en la muestra.' }
        ]
      },

      {
        tipo: 'numerica',
        modulo: 2,
        semana: 2,
        ancla: { cap: 1, modulo: 7, titulo: 'El error total de encuesta', lohr: '1.3–1.4' },
        unidad: 'cm',
        pregunta: 'Un marco de <strong>2 000</strong> personas tiene estatura media <strong>168,616 cm</strong>. Se envía el cuestionario a todas y contestan 1 300: los 1 000 hombres, con media <strong>175,153 cm</strong>, y 300 mujeres, con media <strong>162,207 cm</strong>. Si se estima la media del marco con la media de los respondientes, ¿cuánto vale el <strong>sesgo</strong>, en cm?',
        pista: 'Calcula primero la media de los 1 300 respondientes —es una media ponderada, no el promedio de las dos medias— y réstale la del marco.',
        respuesta: 3.5494,
        tolerancia: 0.01,
        retroAcierto: 'Correcto: la media de los respondientes es $(1000 \\times 175{,}153 + 300 \\times 162{,}207)/1300 = 172{,}165$ cm, y $172{,}165 - 168{,}616 = 3{,}55$ cm. Con una tasa de respuesta del 65 % el sesgo se come tres centímetros y medio, y ninguna fórmula de error estándar lo menciona.',
        retroFallo: 'El sesgo es 3,5494 cm. Dos errores frecuentes: promediar las dos medias sin ponderar por 1 000 y 300, que da 168,68 y un sesgo casi nulo; y restar al revés. Comprueba de paso la identidad del capítulo 1: sesgo = (1 − tasa de respuesta) × (media de respondientes − media de no respondientes) = $0{,}35 \\times (172{,}165 - 162{,}024) = 3{,}55$ cm.'
      },

      {
        tipo: 'multiple',
        modulo: 2,
        semana: 2,
        ancla: { cap: 1, modulo: 9, titulo: 'Sesgo de muestreo en ciencia de datos e IA', lohr: '1.4' },
        pregunta: 'Marca <strong>todo</strong> lo que <em>no</em> se arregla aumentando el tamaño de la muestra.',
        pista: 'Aumentar $n$ reduce lo que varía de muestra a muestra. ¿Cuáles de estos varían de muestra a muestra?',
        opciones: [
          { texto: 'El sesgo de selección de una muestra autoseleccionada.', correcta: true },
          { texto: 'La no cobertura de un marco incompleto.', correcta: true },
          { texto: 'El sesgo de medición de una pregunta mal redactada.', correcta: true },
          { texto: 'El error estándar de la media muestral.', correcta: false }
        ],
        retroAcierto: 'Los tres sesgos: selección, no cobertura y medición. $n$ solo compra precisión: reduce lo que cambia de una muestra a otra. Los tres sesgos están presentes por igual en cada muestra posible, así que promediar más observaciones los deja intactos —esa es toda la lección del «$n$ grande no salva»—.',
        retroFallo: 'El único que $n$ arregla es el error estándar: es lo único de la lista que varía de muestra a muestra. Los tres sesgos apuntan en el mismo sentido en <em>todas</em> las muestras, y por eso crecer solo consigue estimar con más precisión el número equivocado.'
      },

      {
        tipo: 'grafico',
        modulo: 2,
        semana: 2,
        ancla: { cap: 1, modulo: 4, titulo: 'Sesgo de selección', lohr: '1.3–1.4' },
        alto: 220,
        descripcionGrafico: 'Distribución de la estatura en el marco completo de 2 000 personas y en el conjunto de 1 300 respondientes, en proporción, con las dos medias marcadas',
        pregunta: 'Las dos curvas son la distribución de la estatura en el <strong>marco completo</strong> y en el conjunto de <strong>respondientes</strong> del mecanismo de la pregunta anterior. ¿Qué se puede afirmar?',
        pista: 'Compara dónde están las dos rectas verticales y qué parte de la distribución se ha adelgazado.',
        dibujar: canvas => {
          const H = DT.histogramas;
          const alto = Math.max(...H.marcoProp, ...H.respProp) * 1.08;
          return crearGraficoXY(canvas, [
            serieHistograma({ centros: H.centros, conteo: H.marcoProp }, 'Marco (2 000)', '#6B7280'),
            serieHistograma({ centros: H.centros, conteo: H.respProp }, 'Respondientes (1 300)', '#012820'),
            serieVertical(DT.poblacion.media, alto, 'Media del marco', '#6B7280'),
            serieVertical(DT.noRespuesta.mediaResp, alto, 'Media de los respondientes', '#FF6600')
          ], { tituloX: 'Estatura (cm)', tituloY: 'Proporción', xMin: 135, xMax: 205 });
        },
        opciones: [
          { texto: 'La distribución de los respondientes está desplazada a la derecha, y la media seguiría subiendo aunque respondieran más.', correcta: true,
            retro: 'Exacto. El mecanismo no elimina a nadie al azar: se lleva por delante a dos de cada tres mujeres, que son las que ocupan la parte baja del eje. El desplazamiento de la media es el sesgo, y depende del mecanismo, no del número de respuestas.' },
          { texto: 'Las dos distribuciones están centradas en el mismo sitio; solo cambia la altura porque hay menos respondientes.', correcta: false,
            retro: 'Las alturas son proporciones, precisamente para que el tamaño no confunda: las dos series suman 1. Lo que cambia es la <em>forma</em>, y con ella la posición de la media.' },
          { texto: 'Los respondientes son más altos, así que hay un sesgo de medición en la estatura declarada.', correcta: false,
            retro: 'Nadie ha medido mal: a cada persona se le registró su estatura correcta. Lo que está sesgado es <em>quién</em> aparece, no <em>qué</em> se le midió. Es selección, no medición.' },
          { texto: 'El problema se corregiría aumentando la muestra hasta que respondan las 2 000 personas.', correcta: false,
            retro: 'Si respondieran las 2 000 no habría muestra ni no respuesta: sería un censo. La pregunta interesante es qué pasa mientras el mecanismo siga funcionando, y la respuesta es que el desplazamiento se mantiene.' }
        ]
      },

      {
        tipo: 'opcion',
        modulo: 2,
        semana: 2,
        ancla: { cap: 1, modulo: 7, titulo: 'El error total de encuesta', lohr: '1.4–1.6' },
        pregunta: 'Una estimación tiene un sesgo de 3,5 cm y un error estándar de 0,3 cm. El error cuadrático medio es $\\text{ECM} = \\text{sesgo}^2 + V$. ¿Qué implica eso para la estrategia de mejora?',
        pista: 'Compara $3{,}5^2$ con $0{,}3^2$ antes de decidir dónde conviene gastar el presupuesto.',
        opciones: [
          { texto: 'Casi todo el error es sesgo: hay que arreglar la selección, no aumentar $n$.', correcta: true,
            retro: 'Correcto: el sesgo aporta $3{,}5^2 = 12{,}25$ al ECM y la varianza $0{,}3^2 = 0{,}09$, así que el 99 % del error es sesgo. Es el cálculo que ordena las prioridades de una encuesta real. Multiplicar $n$ por cuatro bajaría la varianza a $0{,}0225$ y el ECM pasaría de 12,34 a 12,27: dinero tirado.' },
          { texto: 'Como el error estándar es pequeño, la estimación es buena.', correcta: false,
            retro: 'Un error estándar pequeño solo dice que las muestras se parecen entre sí. Si todas se parecen alrededor de un número equivocado, la estimación es precisa y falsa a la vez.' },
          { texto: 'Hay que aumentar $n$ hasta que el error estándar baje por debajo del sesgo.', correcta: false,
            retro: 'Ya está por debajo, y no ha servido de nada. Bajarlo más reduce un término que ya es el 0,7 % del ECM.' },
          { texto: 'No se puede decir nada sin conocer el tamaño de la población.', correcta: false,
            retro: '$N$ interviene en el fpc y por tanto en $V$, pero la comparación entre 12,25 y 0,09 no cambia de signo por ahí: el fpc solo puede hacer $V$ todavía más pequeña.' }
        ]
      },

      {
        tipo: 'texto',
        modulo: 2,
        semana: 2,
        ancla: { cap: 1, modulo: 9, titulo: 'Sesgo de muestreo en ciencia de datos e IA', lohr: '1.4' },
        pregunta: 'Explícale a alguien sin formación estadística, en 60–80 palabras, por qué una encuesta con <strong>50 000 respuestas voluntarias</strong> puede ser peor que una aleatoria de <strong>500</strong>.',
        pista: 'Tienes que separar dos ideas que en el lenguaje común van juntas: «muchos datos» y «datos que representan».',
        respuestaModelo: 'Las 50 000 respuestas dicen mucho sobre quienes decidieron responder, y muy poco sobre los demás. Si quien responde se parece entre sí y se distingue del resto, la respuesta media se aleja del valor real siempre en el mismo sentido, y ese desvío no baja aunque lleguen más respuestas. En la encuesta aleatoria de 500 cada persona entra por sorteo, así que las diferencias son de azar: se reflejan en un margen de error que sí sabemos calcular, y que se estrecha al crecer la muestra.',
        comprobacion: [
          'Distinguí dos cosas: un error que se corrige con más datos y otro que no.',
          'Dije por qué el sorteo cambia las cosas, sin usar jerga («insesgado», «$\\pi_k$») ni fórmulas.',
          'No afirmé que 500 sea siempre mejor que 50 000: dije de qué depende.'
        ]
      },

      // ==============================================================
      // SEMANA 3 · Muestreo probabilístico, π_k y MAS (9 ítems)
      // ==============================================================
      {
        tipo: 'opcion',
        modulo: 3,
        semana: 3,
        ancla: { cap: 2, modulo: 1, titulo: 'El diseño muestral $p(s)$', lohr: '1.5 · 2.1' },
        pregunta: 'A un encuestador se le pide que consiga 30 hombres y 30 mujeres en la calle, eligiendo él a quién abordar hasta completar las cuotas. ¿Por qué este diseño <strong>no</strong> permite calcular un error estándar?',
        pista: '¿Se puede escribir, para cada muestra posible, con qué probabilidad habría salido?',
        opciones: [
          { texto: 'Porque no existe una $p(s)$ conocida: la fija el encuestador sobre la marcha.', correcta: true,
            retro: 'Eso es. El error estándar es una esperanza <em>respecto de $p(s)$</em>: sin $p(s)$ no hay nada respecto de lo cual tomar esperanzas. Las cuotas garantizan la composición por sexo, no la probabilidad de selección.' },
          { texto: 'Porque 60 personas son pocas.', correcta: false,
            retro: 'El tamaño no es el defecto. Con 6 000 personas abordadas a criterio del encuestador seguiría sin haber $p(s)$, y seguiría sin poder calcularse un error estándar.' },
          { texto: 'Porque las cuotas por sexo introducen un sesgo de medición.', correcta: false,
            retro: 'Las cuotas no tocan la medición. De hecho fijar la composición por sexo puede mejorar la representatividad en esa variable; el problema es todo lo demás, que queda a criterio del encuestador.' },
          { texto: 'Porque no se aplicó la corrección por población finita.', correcta: false,
            retro: 'El fpc es un factor que se aplica a la varianza de un diseño ya definido. Aquí el problema es anterior: no hay diseño.' }
        ]
      },

      {
        tipo: 'numerica',
        modulo: 3,
        semana: 3,
        ancla: { cap: 2, modulo: 5, titulo: 'El MAS como caso particular', lohr: '2.2–2.3' },
        unidad: 'cm',
        pregunta: 'De una población de <strong>N = 2 000</strong> personas se toma un MAS <strong>sin reemplazo</strong> de <strong>n = 200</strong>. En la muestra, la estatura media es 168,94 cm y la desviación típica muestral es $s = 11{,}0743$ cm. ¿Cuál es el <strong>error estándar</strong> de la media muestral? Da cuatro decimales.',
        pista: 'Es $\\sqrt{(1 - n/N)\\,s^2/n}$. Aquí $n/N = 0{,}1$, así que el fpc vale 0,9 y <strong>no</strong> se puede omitir.',
        respuesta: 0.7429,
        tolerancia: 0.0006,
        retroAcierto: 'Correcto: $\\sqrt{0{,}9 \\times 11{,}0743^2/200} = 0{,}7429$ cm. Fíjate en que el fpc entra <em>dentro</em> de la raíz y multiplica a la varianza, no al error estándar.',
        retroFallo: 'Es 0,7429 cm. Si te salió 0,7831 aplicaste $s/\\sqrt{n}$ y olvidaste el fpc; si te salió 0,7048 multiplicaste por 0,9 <em>fuera</em> de la raíz, sobre $s/\\sqrt{n}$, en vez de multiplicar la varianza. El fpc va dentro de la raíz: $\\sqrt{0{,}9} = 0{,}9487$.'
      },

      {
        tipo: 'numerica',
        modulo: 3,
        semana: 3,
        ancla: { cap: 2, modulo: 6, titulo: 'Intervalos de confianza', lohr: '2.3' },
        unidad: 'cm',
        pregunta: 'Con esa misma muestra ($\\bar{y} = 168{,}94$ cm, error estándar 0,7429 cm), construye el intervalo de confianza al <strong>95 %</strong> para la estatura media de la población. ¿Cuál es su <strong>límite superior</strong>? Da dos decimales.',
        pista: 'Semiancho $= 1{,}96 \\times \\text{EE}$. Súmaselo a la media muestral.',
        respuesta: 170.40,
        tolerancia: 0.02,
        retroAcierto: 'Correcto: $168{,}94 + 1{,}96 \\times 0{,}7429 = 170{,}40$ cm, y el intervalo completo es $[167{,}48;\\ 170{,}40]$. La media poblacional verdadera es 168,616 cm, así que este intervalo sí la cubre — pero eso solo se sabe aquí, donde la población entera está sobre la mesa.',
        retroFallo: 'Es 170,40 cm. El semiancho es $1{,}96 \\times 0{,}7429 = 1{,}46$ cm. Los dos errores típicos son usar $1{,}64$ (que es el 90 %) y multiplicar por $s$ en vez de por el error estándar, que da un intervalo absurdamente ancho: $\\pm 21{,}7$ cm.'
      },

      {
        tipo: 'numerica',
        modulo: 3,
        semana: 3,
        ancla: { cap: 2, modulo: 5, titulo: 'El MAS como caso particular', lohr: '2.2–2.3' },
        unidad: '%',
        pregunta: 'Con los mismos datos ($n = 200$, $N = 2\\,000$): ¿en qué <strong>porcentaje</strong> se equivoca el error estándar de quien olvida la corrección por población finita? Da dos decimales.',
        pista: 'No hace falta $s$: el cociente entre los dos errores estándar es $1/\\sqrt{1 - n/N}$, y el resto se cancela.',
        respuesta: 5.41,
        tolerancia: 0.05,
        retroAcierto: 'Correcto: $1/\\sqrt{0{,}9} = 1{,}0541$, así que olvidar el fpc <strong>infla</strong> el error estándar un 5,41 %. Va siempre en esa dirección —el fpc solo puede reducir la varianza—, de modo que quien lo olvida es conservador, no optimista.',
        retroFallo: 'Es 5,41 %. Sale de $1/\\sqrt{0{,}9} - 1 = 0{,}0541$. Ojo con dos atajos falsos: el error no es del 10 % (esa es $n/N$, y el fpc entra por la raíz) ni del 5,13 % (que sería $1 - \\sqrt{0{,}9}$, el cambio calculado en la dirección contraria).'
      },

      {
        tipo: 'opcion',
        modulo: 3,
        semana: 3,
        ancla: { cap: 2, modulo: 6, titulo: 'Intervalos de confianza', lohr: '2.3' },
        pregunta: 'Tu intervalo al 95 % para la estatura media es $[167{,}48;\\ 170{,}40]$. ¿Cuál de estas afirmaciones es correcta?',
        pista: '¿Qué es aleatorio en el problema: la media poblacional o el intervalo?',
        opciones: [
          { texto: 'Si se repitiera el muestreo muchas veces, el 95 % de los intervalos contendría la media.', correcta: true,
            retro: 'Esa es la afirmación correcta, y fíjate en dónde está el 95 %: en el <em>procedimiento</em>, no en este intervalo. Este ya salió; contiene la media o no la contiene, y aquí no hay probabilidad que valga.' },
          { texto: 'Hay un 95 % de probabilidad de que la media poblacional esté entre 167,48 y 170,40.', correcta: false,
            retro: 'Esta es la trampa clásica, y es la respuesta que da casi todo el mundo. La media poblacional es una constante fija, no una variable aleatoria: no tiene una probabilidad de estar en ningún sitio. Lo aleatorio es el intervalo, que cambia con cada muestra.' },
          { texto: 'El 95 % de las personas de la población mide entre 167,48 y 170,40 cm.', correcta: false,
            retro: 'Eso sería un intervalo de <em>predicción</em> sobre individuos, y sería mucho más ancho: la desviación típica de las estaturas es 11,16 cm, no 0,74. Este intervalo es sobre la <strong>media</strong>.' },
          { texto: 'Si se toma otra muestra, su media caerá dentro de este intervalo con probabilidad 0,95.', correcta: false,
            retro: 'Tampoco: eso es una afirmación sobre la próxima $\\bar{y}$, no sobre el parámetro, y ni siquiera es cierta —la probabilidad de que la media de una segunda muestra caiga en el intervalo de la primera es menor que 0,95, porque las dos varían—.' }
        ]
      },

      {
        tipo: 'opcion',
        modulo: 3,
        semana: 3,
        ancla: { cap: 2, modulo: 4, titulo: 'Insesgadez de diseño y «muestra representativa»', lohr: '2.2' },
        pregunta: 'Tu muestra de 200 personas trajo 96 mujeres y 104 hombres, cuando la población tiene exactamente 1 000 de cada. ¿Qué significa que $\\bar{y}$ sea <strong>insesgado</strong> pese a ese desajuste?',
        pista: 'La insesgadez es una propiedad de la esperanza sobre todas las muestras posibles, no de la muestra que salió.',
        opciones: [
          { texto: 'Que el promedio de $\\bar{y}$ sobre todas las muestras posibles es la media poblacional.', correcta: true,
            retro: 'Correcto. La insesgadez no promete que tu muestra se parezca a la población: promete que el procedimiento no se desvía sistemáticamente. Las muestras con 96 mujeres se compensan con las que traen 104.' },
          { texto: 'Que la muestra reproduce la composición de la población, con una diferencia despreciable.', correcta: false,
            retro: 'Esa es la idea de «muestra representativa», y es justo la que el capítulo 2 desmonta. La insesgadez no dice nada sobre el parecido entre muestra y población; de hecho vale también para muestras muy desequilibradas.' },
          { texto: 'Que si repites el muestreo obtendrás una composición más equilibrada.', correcta: false,
            retro: 'La siguiente muestra puede salir más desequilibrada. Lo que se equilibra es el <em>promedio</em> a lo largo de todas las muestras posibles, no cada muestra por separado.' },
          { texto: 'Que el desajuste 96/104 es prueba de un error en el sorteo.', correcta: false,
            retro: 'Al contrario: sería sospechoso que saliera 100/100 exacto. Bajo MAS el número de mujeres en la muestra es aleatorio, y 96 está a menos de un error estándar de 100.' }
        ]
      },

      {
        tipo: 'multiple',
        modulo: 3,
        semana: 3,
        ancla: { cap: 2, modulo: 8, titulo: 'Diseño Bernoulli y muestreo con reemplazo', lohr: '2.2 · 2.6' },
        pregunta: 'Se mantiene $n = 200$ y $N = 2\\,000$, pero se pasa de MAS <strong>sin</strong> reemplazo a MAS <strong>con</strong> reemplazo. Marca <strong>todo</strong> lo que cambia.',
        pista: 'Piensa qué se le permite ahora a una unidad que antes no podía pasarle, y qué le ocurre a la varianza cuando desaparece el fpc.',
        opciones: [
          { texto: 'Una misma persona puede salir seleccionada más de una vez.', correcta: true },
          { texto: 'La varianza del estimador de la media aumenta, porque desaparece el factor $(1 - n/N)$.', correcta: true },
          { texto: 'El número de personas <em>distintas</em> observadas deja de ser exactamente 200.', correcta: true },
          { texto: 'El estimador $\\bar{y}$ deja de ser insesgado.', correcta: false }
        ],
        retroAcierto: 'Todas menos la insesgadez. Con reemplazo se pierde el fpc —la varianza pasa de $0{,}9\\,S^2/n$ a $S^2/n$—, se admiten repeticiones y el número de unidades distintas cae por debajo de $n$. Lo que no cambia es la insesgadez: la media muestral sigue estimando bien, solo que con más varianza.',
        retroFallo: 'Todo menos la insesgadez. Con reemplazo cada extracción es independiente y equiprobable, así que $E(\\bar{y}) = \\bar{y}_U$ igual que antes. Lo que se pierde es precisión: sin fpc la varianza sube, y parte de la muestra se «gasta» observando dos veces a la misma persona.'
      },

      {
        tipo: 'grafico',
        modulo: 3,
        semana: 3,
        ancla: { cap: 2, modulo: 6, titulo: 'Intervalos de confianza', lohr: '2.3' },
        alto: 240,
        descripcionGrafico: 'Cien intervalos de confianza al 95 % construidos con cien muestras aleatorias simples de n = 50, y la recta horizontal de la media poblacional; tres de ellos, destacados en naranja, quedan enteros por encima o por debajo de la recta sin llegar a tocarla: dos arriba y uno abajo',
        pregunta: 'Cada segmento vertical es un intervalo al 95 % construido con una muestra distinta de $n = 50$; la línea horizontal es la media poblacional verdadera. ¿Qué muestra el gráfico?',
        pista: 'Cuenta cuántos segmentos no tocan la línea, y pregúntate de qué es propiedad el «95 %».',
        dibujar: canvas => {
          const COB = DT.cobertura;
          const iv = COB.intervalos;
          const seg = (filtro, etiqueta, color) => {
            const datos = [];
            iv.forEach((d, i) => {
              if (filtro(d)) datos.push({ x: i + 1, y: d.lo }, { x: i + 1, y: d.hi }, null);
            });
            return {
              type: 'line', label: etiqueta, data: datos, spanGaps: false,
              borderColor: color, borderWidth: 1.6, pointRadius: 0, fill: false
            };
          };
          return crearGraficoXY(canvas, [
            seg(d => d.cubre, 'Cubren la media', '#012820'),
            seg(d => !d.cubre, 'No la cubren', '#FF6600'),
            { type: 'line', label: 'Media poblacional', borderColor: '#6B7280',
              borderDash: [6, 4], borderWidth: 2, pointRadius: 0, fill: false,
              data: [{ x: 1, y: COB.mediaPoblacional }, { x: COB.reps, y: COB.mediaPoblacional }] }
          ], { tituloX: 'Réplica', tituloY: 'Estatura media (cm)', xMin: 0, xMax: COB.reps + 1 });
        },
        opciones: [
          { texto: 'Que el 95 % es una propiedad del procedimiento, no de un intervalo suelto.', correcta: true,
            retro: 'Eso es lo que hay que leer aquí. De estas cien réplicas, ' + DT.cobertura.cubren + ' cubren la media y ' + DT.cobertura.fallan + ' no; con el nivel al 95 % se esperaban unas cinco fallas y salieron ' + DT.cobertura.fallan + ', que es la variación normal de contar cien veces. Cuando trabajas con datos reales solo tienes <em>uno</em> de estos segmentos y no sabes cuál.' },
          { texto: 'Que los intervalos que fallan están mal calculados.', correcta: false,
            retro: 'Están calculados exactamente igual que los demás, con la misma fórmula y el mismo nivel. Fallan porque su muestra salió lejos por azar: que un 5 % falle no es un defecto del método, es su definición.' },
          { texto: 'Que los intervalos más anchos son los que fallan.', correcta: false,
            retro: 'Es al revés de lo que sugiere la intuición: un intervalo ancho tiene <em>más</em> facilidad para cubrir la media. Los que fallan suelen ser los que están mal centrados, no los estrechos.' },
          { texto: 'Que con $n = 50$ el estimador está sesgado, porque no todos los intervalos contienen la media.', correcta: false,
            retro: 'La media muestral es insesgada para cualquier $n$, y se ve en el gráfico: los centros de los segmentos se reparten alrededor de la línea, no por encima ni por debajo. Que un intervalo no cubra es cuestión de varianza, no de sesgo.' }
        ]
      },

      {
        tipo: 'texto',
        modulo: 3,
        semana: 3,
        ancla: { cap: 2, modulo: 6, titulo: 'Intervalos de confianza', lohr: '2.3' },
        pregunta: 'Un compañero escribe en su informe: «mi intervalo es $[167{,}48;\\ 170{,}40]$, así que hay un 95 % de probabilidad de que la media de la población esté ahí dentro». Corrígelo en dos frases: qué está mal y cómo se dice bien.',
        pista: 'Señala qué objeto es el aleatorio. Y evita el otro extremo: el intervalo tampoco es «cualquier cosa».',
        respuestaModelo: 'La media poblacional es una constante desconocida, no una variable aleatoria: no tiene una probabilidad de caer en ningún intervalo, y este intervalo concreto la contiene o no la contiene. Lo aleatorio es el intervalo, que cambia con cada muestra, y el 95 % califica al procedimiento: si repitiéramos el muestreo muchas veces, el 95 % de los intervalos construidos así contendría la media poblacional.',
        comprobacion: [
          'Dije explícitamente que el parámetro es fijo y que lo aleatorio es el intervalo.',
          'Reformulé el 95 % como una propiedad de la repetición del procedimiento, no de este intervalo.',
          'No caí en el otro extremo: el intervalo sigue siendo informativo, no «no dice nada».'
        ]
      },

      // ==============================================================
      // SEMANA 4 · Tamaño de muestra y muestreo sistemático (8 ítems)
      // ==============================================================
      {
        tipo: 'numerica',
        modulo: 4,
        semana: 4,
        ancla: { cap: 2, modulo: 7, titulo: 'Determinación del tamaño de muestra', lohr: '2.4–2.5' },
        unidad: 'personas',
        pregunta: 'Se quiere estimar la estatura media de una población de <strong>N = 2 000</strong> personas con un margen de error de <strong>1,5 cm</strong> al 95 %. Un estudio previo da $S = 11{,}1581$ cm. ¿Qué tamaño de muestra hace falta, aplicando la corrección por población finita? Redondea hacia arriba.',
        pista: 'Primero $n_0 = (1{,}96\\,S/e)^2$, y luego corrige: $n = n_0/(1 + n_0/N)$.',
        respuesta: 193,
        tolerancia: 0.5,
        retroAcierto: 'Correcto: $n_0 = (1{,}96 \\times 11{,}1581/1{,}5)^2 = 212{,}57$ y $n = 212{,}57/(1 + 212{,}57/2000) = 192{,}1 \\to 193$. La corrección ahorra veinte personas, un 9 % del trabajo de campo, porque la muestra es una décima parte de la población.',
        retroFallo: 'Son 193 personas. Si te salió 213 calculaste $n_0$ y te quedaste ahí, sin corregir por población finita. Si te salió 192 redondeaste hacia abajo: un tamaño de muestra siempre se redondea <strong>hacia arriba</strong>, porque quedarse corto incumple el margen prometido.'
      },

      {
        tipo: 'numerica',
        modulo: 4,
        semana: 4,
        ancla: { cap: 2, modulo: 7, titulo: 'Determinación del tamaño de muestra', lohr: '2.4–2.5' },
        unidad: 'delitos',
        pregunta: 'De los <strong>5 000</strong> delitos del archivo, un piloto estima que la proporción con arresto ronda $p = 0{,}2766$. Se quiere estimar esa proporción con un margen de <strong>3 puntos porcentuales</strong> al 95 %. ¿Qué tamaño de muestra hace falta, con corrección por población finita? Redondea hacia arriba.',
        pista: 'Es la misma fórmula, con $p(1-p)$ en el lugar de $S^2$: $n_0 = 1{,}96^2\\,p(1-p)/e^2$, y después la corrección.',
        respuesta: 730,
        tolerancia: 0.5,
        retroAcierto: 'Correcto: $n_0 = 3{,}8416 \\times 0{,}2766 \\times 0{,}7234/0{,}03^2 = 854{,}1$, y corrigiendo, $854{,}1/(1 + 854{,}1/5000) = 729{,}5 \\to 730$. Aquí la muestra es casi el 15 % del archivo, así que el fpc se nota: ahorra 125 casos.',
        retroFallo: 'Son 730 delitos. Los tres tropiezos habituales: quedarse en $n = 855$ —el $n_0 = 854{,}1$ redondeado— sin aplicar la corrección; escribir el margen como 3 en vez de 0,03, lo que da un $n$ ridículo; y usar $p = 0{,}5$ por costumbre —el peor caso—, que da $n_0 = 1\\,067{,}1$ —el célebre 1 067 del capítulo 2— y una muestra innecesariamente grande cuando ya se tiene un piloto.'
      },

      {
        tipo: 'opcion',
        modulo: 4,
        semana: 4,
        ancla: { cap: 2, modulo: 7, titulo: 'Determinación del tamaño de muestra', lohr: '2.4–2.5' },
        pregunta: 'Ese mismo cálculo, pero sobre un archivo <strong>100 veces más grande</strong> (500 000 delitos en vez de 5 000), con el mismo margen y el mismo $p$. ¿Qué le pasa al tamaño de muestra necesario?',
        pista: 'Mira la fórmula corregida: $n = n_0/(1 + n_0/N)$. ¿Qué le pasa a $n_0/N$ cuando $N$ se dispara?',
        opciones: [
          { texto: 'Sube muy poco, porque $n$ se acerca a su techo y ya no puede crecer más.', correcta: true,
            retro: 'Correcto: sube de 730 a 853, nada más, con una población cien veces mayor. Es de los resultados más contraintuitivos del curso: lo que fija el tamaño de muestra es la <em>precisión</em> que se quiere, no el tamaño de la población. Con $N$ enorme, $n_0/N \\to 0$ y $n \\to n_0$.' },
          { texto: 'Se multiplica por 100, igual que la población.', correcta: false,
            retro: 'Esa es la intuición del «hay que encuestar al 1 %», y es falsa. Si fuera cierta, una encuesta nacional necesitaría muestras de cientos de miles: en la práctica se hacen con 1 000 o 2 000 personas.' },
          { texto: 'Se multiplica por 10, que es $\\sqrt{100}$.', correcta: false,
            retro: 'La raíz aparece en la relación entre $n$ y el margen de error, no entre $n$ y $N$. En la fórmula corregida $N$ solo entra por el denominador $1 + n_0/N$, que tiende a 1.' },
          { texto: 'Baja, porque con más población hay más información disponible.', correcta: false,
            retro: 'No baja: la corrección por población finita solo puede <em>reducir</em> $n$ respecto de $n_0$, y esa reducción es cada vez menor a medida que $N$ crece. El límite superior es $n_0$, y se llega a él por debajo.' }
        ]
      },

      {
        tipo: 'opcion',
        modulo: 4,
        semana: 4,
        ancla: { cap: 2, modulo: 9, titulo: 'Muestreo sistemático', lohr: '2.6' },
        pregunta: 'En un muestreo sistemático con salto $k$ sobre un marco de $N = nk$ unidades, ¿por qué no existe un estimador insesgado de la varianza?',
        pista: '¿Cuántas muestras distintas puede producir el diseño? ¿Y cuántas parejas de unidades pueden coincidir en una de ellas?',
        opciones: [
          { texto: 'Porque dos unidades que no estén separadas por un múltiplo de $k$ tienen $\\pi_{kl} = 0$.', correcta: true,
            retro: 'Exacto. Todas las fórmulas de varianza de diseño se apoyan en las probabilidades de segundo orden, y cuando algunas valen cero no hay forma de estimar los términos que les corresponden. Se estima <em>como si</em> fuera MAS, y eso es un supuesto, no un resultado.' },
          { texto: 'Porque el estimador de la media es sesgado en el sistemático.', correcta: false,
            retro: 'No lo es: con $N = nk$ todas las unidades tienen $\\pi_k = 1/k$, así que la media muestral es insesgada. Lo que falla es la <em>varianza</em>, no la esperanza.' },
          { texto: 'Porque el arranque aleatorio hace que el tamaño de muestra sea variable.', correcta: false,
            retro: 'Con $N = nk$ el tamaño es exactamente $n$ en las $k$ muestras. El tamaño variable aparece cuando $N$ no es múltiplo de $k$, y es otro problema.' },
          { texto: 'Porque el sistemático no es un diseño probabilístico.', correcta: false,
            retro: 'Sí lo es: el arranque se sortea, $p(s)$ está perfectamente definida —$1/k$ para cada una de las $k$ muestras— y las $\\pi_k$ son conocidas. Es probabilístico y aun así su varianza no es estimable sin supuestos.' }
        ]
      },

      {
        tipo: 'opcion',
        modulo: 4,
        semana: 4,
        ancla: { cap: 2, modulo: 9, titulo: 'Muestreo sistemático', lohr: '2.6' },
        pregunta: 'El marco de las 2 000 personas se <strong>ordena por estatura</strong> y se toma un sistemático con $k = 10$ ($n = 200$). Comparado con un MAS del mismo tamaño, ¿qué ocurre con la varianza de la media muestral?',
        pista: 'Si la lista está ordenada por la variable de interés, ¿en qué se parece cada muestra sistemática a la población?',
        opciones: [
          { texto: 'Baja muchísimo: cada muestra recorre todo el rango de estaturas.', correcta: true,
            retro: 'Correcto. Recorriendo el espacio de muestras entero —solo hay 10— la varianza real del sistemático ordenado resulta ser el 1,9 % de la del MAS. Ordenar el marco por algo relacionado con $y$ es lo mejor que le puede pasar a un sistemático: cada muestra queda repartida por todo el rango, que es lo que hace un estratificado, y por eso se habla de <em>estratificación implícita</em>.' },
          { texto: 'Es exactamente igual a la del MAS: en los dos casos $\\pi_k = 0{,}1$.', correcta: false,
            retro: 'Que las $\\pi_k$ coincidan no obliga a que las varianzas coincidan: la varianza depende también de las de segundo orden, y ahí los dos diseños no se parecen en nada. Es el error de tratar el sistemático como si fuera MAS.' },
          { texto: 'Sube, porque el sistemático siempre es peor que el MAS.', correcta: false,
            retro: 'El sistemático no es «siempre peor»: depende por completo del orden del marco. Es catastrófico si el orden tiene un ciclo que coincide con $k$, y es excelente si está ordenado por la variable de interés.' },
          { texto: 'No se puede saber, porque la varianza del sistemático no es estimable.', correcta: false,
            retro: 'No es estimable <em>a partir de una sola muestra</em>, que es lo que le pasa al investigador. Pero aquí tenemos la población entera, así que se puede calcular la varianza real recorriendo las 10 muestras posibles: es lo que hace este material.' }
        ]
      },

      {
        tipo: 'multiple',
        modulo: 4,
        semana: 4,
        ancla: { cap: 2, modulo: 9, titulo: 'Muestreo sistemático', lohr: '2.6' },
        pregunta: 'Muestreo sistemático con arranque aleatorio, $N = 2\\,000$, $k = 10$, $n = 200$. Marca <strong>todo</strong> lo que es cierto.',
        pista: 'Empieza por contar cuántas muestras distintas puede llegar a producir el sorteo del arranque.',
        opciones: [
          { texto: 'El diseño solo puede producir 10 muestras distintas.', correcta: true },
          { texto: '$\\pi_k = 1/10$ para toda unidad de la población.', correcta: true },
          { texto: 'Dos unidades separadas por 7 posiciones tienen $\\pi_{kl} = 0$.', correcta: true },
          { texto: 'La muestra queda repartida por todo el marco, sin dejar tramos largos sin visitar.', correcta: true },
          { texto: 'Como hay 10 muestras posibles, el error estándar se puede estimar con la varianza entre esas 10 muestras a partir de la muestra observada.', correcta: false }
        ],
        retroAcierto: 'Todas menos la del error estándar. Ésa es la trampa: la varianza <em>entre</em> las 10 muestras existe y es un número perfectamente definido, pero para calcularla harían falta las 10, y el investigador solo tiene una. Por eso la varianza no es estimable sin supuestos.',
        retroFallo: 'Todo menos lo del error estándar. El arranque se sortea entre 1 y 10, así que hay 10 muestras equiprobables, cada unidad entra en exactamente una ($\\pi_k = 1/10$) y dos unidades coinciden solo si su distancia es múltiplo de 10 —7 no lo es, luego $\\pi_{kl} = 0$—. Lo que no se puede es estimar la varianza entre muestras teniendo una sola muestra.'
      },

      {
        tipo: 'grafico',
        modulo: 4,
        semana: 4,
        ancla: { cap: 2, modulo: 7, titulo: 'Determinación del tamaño de muestra', lohr: '2.4–2.5' },
        alto: 220,
        descripcionGrafico: 'Margen de error al 95 % para la estatura media en función del tamaño de muestra, con y sin corrección por población finita, sobre una población de 2 000 personas',
        pregunta: 'Las dos curvas dan el margen de error al 95 % en función de $n$, sobre la misma población de $N = 2\\,000$: una con corrección por población finita y otra sin ella. ¿Qué se puede afirmar?',
        pista: 'Fíjate en los extremos: qué pasa en $n$ pequeño, y qué pasa cuando $n$ se acerca a 2 000.',
        dibujar: canvas => {
          // curvaMargen es un data.frame de R, así que llega como ARRAY DE FILAS
          // (C.map(f => f.n)), nunca como objeto de columnas (C.n).
          const C = DT.curvaMargen;
          const linea = (clave, etiqueta, color, guion) => ({
            type: 'line', label: etiqueta,
            data: C.map(f => ({ x: f.n, y: f[clave] })),
            borderColor: color, borderWidth: 2, pointRadius: 0, fill: false,
            borderDash: guion || []
          });
          return crearGraficoXY(canvas, [
            linea('sinFpc', 'Sin fpc', '#FF6600', [6, 4]),
            linea('conFpc', 'Con fpc', '#012820')
          ], { tituloX: 'Tamaño de muestra n', tituloY: 'Margen de error (cm)', xMin: 0, xMax: 2000 });
        },
        opciones: [
          { texto: 'Las dos caen deprisa al principio y despacio después, pero solo la del fpc llega a cero en $n = N$.', correcta: true,
            retro: 'Correcto, y las dos lecturas importan. La caída con forma de $1/\\sqrt{n}$ significa que para partir el margen por la mitad hay que <em>cuadruplicar</em> la muestra: de $n = 100$ a $n = 400$ —exacto sin corrección; con fpc la mejora es algo mayor—. Y la curva con fpc llega a <strong>cero</strong> en $n = N$, porque ahí ya no se estima nada: se ha censado. El fpc solo se nota cuando la fracción de muestreo es apreciable: en $n = 100$ las dos curvas casi coinciden (2,13 frente a 2,19 cm).' },
          { texto: 'El margen baja proporcionalmente a $n$: con el doble de muestra, la mitad de margen.', correcta: false,
            retro: 'Si fuera así las curvas serían rectas. Bajan como $1/\\sqrt{n}$: duplicar $n$ divide el margen por $\\sqrt{2} = 1{,}41$, no por 2.' },
          { texto: 'Ignorar el fpc hace que el margen parezca más pequeño de lo que es.', correcta: false,
            retro: 'Es al revés, y el gráfico lo enseña: la curva naranja va siempre por <em>encima</em>. El fpc solo puede reducir la varianza, así que quien lo ignora declara un margen más grande del real —es conservador, no optimista—.' },
          { texto: 'A partir de $n = 500$ ya no vale la pena seguir muestreando, porque el margen es cero.', correcta: false,
            retro: 'En $n = 500$ el margen no es cero: es de aproximadamente 0,85 cm. Que la curva parezca plana no significa que valga cero, significa que cada persona añadida aporta cada vez menos.' }
        ]
      },

      {
        tipo: 'texto',
        modulo: 4,
        semana: 4,
        ancla: { cap: 2, modulo: 9, titulo: 'Muestreo sistemático', lohr: '2.6' },
        pregunta: 'El marco de las 2 000 personas está ordenado alternando mujer, hombre, mujer, hombre… y se toma un sistemático con salto $k = 10$. Explica en 4–6 frases qué les pasa a las 10 muestras posibles, y por qué el error estándar calculado con la fórmula del MAS <strong>mentiría</strong>.',
        pista: '10 es par. ¿Sobre qué posiciones cae cada muestra si el arranque es impar? ¿Y si es par?',
        respuestaModelo: 'Como el salto es par y la lista alterna, cada muestra cae siempre sobre posiciones de la misma paridad: los cinco arranques impares dan muestras de <strong>solo mujeres</strong> y los cinco pares, de <strong>solo hombres</strong>. Las medias de las 10 muestras posibles se reparten en dos grupos —cinco alrededor de 162 cm y cinco alrededor de 175 cm— y <em>ninguna</em> se acerca a los 168,6 cm de la población. La varianza real entre esas 10 muestras es 42,99, es decir un error estándar de 6,56 cm. Pero dentro de cada muestra las estaturas son muy homogéneas (todas del mismo sexo), así que la fórmula del MAS, que solo mira la dispersión interna, declara un error estándar de 0,61 cm: <strong>117 veces menos varianza de la real</strong>. El investigador vería un intervalo estrechísimo alrededor de un número equivocado, y nada en su salida se lo advertiría.',
        comprobacion: [
          'Dije que las 10 muestras se parten en dos grupos —solo mujeres y solo hombres— porque el salto y el ciclo del marco coinciden.',
          'Expliqué que el error estándar del MAS mide la dispersión <em>dentro</em> de la muestra, que aquí es artificialmente pequeña.',
          'Señalé la consecuencia práctica: intervalo demasiado estrecho, centrado en el sitio equivocado, y sin ninguna señal de alarma.'
        ]
      }
    ];

    // Un quiz por semana, no uno de 30. Los cuatro primeros modulos de esta
    // pagina SON las cuatro semanas, asi que el resumen final de cada uno
    // ("te costaron preguntas de estos modulos") nombra la semana que hay que
    // repasar en vez de un numero suelto. El reparto sale del propio `semana`
    // de cada item: no hay cuatro listas que mantener sincronizadas.
    [1, 2, 3, 4].forEach(sem => {
      AUTOEVALUACIONES['taller1-s' + sem] = BANCO_TALLER1.filter(p => p.semana === sem);
    });
