    // ================================================================
    // Diagnóstico por objetivo — el producto del preparcial (D10)
    //
    // Un «38 de 59» no le sirve a nadie para estudiar. «O3 · Marco π:
    // 4 de 13, y fallaste las dos de Horvitz–Thompson» con el enlace al
    // módulo puesto, sí. Esto es lo segundo.
    //
    // DÓNDE VIVE EL RESULTADO, Y POR QUÉ AQUÍ. El motor del quiz guarda
    // `estado` en el cierre de `renderAutoevaluacion`, y `loadModule`
    // hace `mainContent.innerHTML = ''` cada vez que se cambia de
    // módulo: al salir del bloque A, su estado muere con el DOM. Un
    // diagnóstico que leyera solo lo que hay en pantalla marcaría
    // siempre cero, porque cuando se abre este módulo los demás ya no
    // existen. Así que lleva su propio registro, que sobrevive al cambio
    // de módulo aunque el quiz se repinte en blanco.
    //
    // CÓMO SE ENTERA. No reimplementa la corrección: OBSERVA la que hace
    // el motor. `cerrar()` escribe `class="quiz-retro bien|mal"` y quita
    // el `hidden`; un MutationObserver sobre esos dos atributos recoge
    // el veredicto sin duplicar una sola regla. Si el motor cambiara ese
    // marcado, esto dejaría de registrar — y por eso `iniciarDiagnosticos`
    // avisa por consola cuando encuentra bloques sin `.quiz-retro`.
    // ================================================================
    const RESULTADOS_QUIZ = {};
    const observadoresQuiz = [];

    function registraQuiz(raiz) {
      const clave = raiz.dataset.quiz;
      const banco = AUTOEVALUACIONES[clave];
      if (!banco) return;
      const registro = RESULTADOS_QUIZ[clave] || (RESULTADOS_QUIZ[clave] = []);
      raiz.querySelectorAll('.quiz-pregunta').forEach((bloque, i) => {
        const retro = bloque.querySelector('.quiz-retro');
        // Sin responder todavía: no se borra lo que ya estaba registrado de
        // una visita anterior a este módulo.
        if (!retro || retro.hidden) return;
        // Acertar a la segunda no es acertar. El motor lo distingue en su
        // propio resumen (`intentos > 1 || !acierto`) y aquí se recoge por
        // la vía estructural, no leyendo el texto de la retro: la pista solo
        // se destapa tras un primer fallo, así que verla visible al cerrar
        // significa que hubo uno.
        const pista = bloque.querySelector('.quiz-pista');
        registro[i] = {
          acierto: retro.classList.contains('bien'),
          dudo: !!(pista && !pista.hidden)
        };
      });
    }

    function vigilarQuizzes() {
      while (observadoresQuiz.length) observadoresQuiz.pop().disconnect();
      avisaSiCambioElMarcado();
      mainContent.querySelectorAll('[data-quiz]').forEach(raiz => {
        if (!AUTOEVALUACIONES[raiz.dataset.quiz]) return;
        registraQuiz(raiz);
        const obs = new MutationObserver(() => registraQuiz(raiz));
        obs.observe(raiz, { subtree: true, attributes: true, attributeFilter: ['class', 'hidden'] });
        observadoresQuiz.push(obs);
        // Reiniciar es «empezar de cero», y el diagnóstico tiene que
        // enterarse: si no, seguiría contando los fallos que el estudiante
        // acaba de borrar de la pantalla.
        const reiniciar = raiz.querySelector('.quiz-reiniciar');
        if (reiniciar) {
          reiniciar.addEventListener('click', () => { RESULTADOS_QUIZ[raiz.dataset.quiz] = []; });
        }
      });
    }

    // --- El cálculo -------------------------------------------------
    // Cada ítem lleva en `ancla` el módulo del capítulo donde está
    // enseñado; la tabla de especificaciones dice a qué objetivo
    // pertenece cada módulo. De ahí sale todo, sin una segunda lista que
    // mantener en paralelo.
    function calculaDiagnostico() {
      const deModulo = new Map();
      OBJETIVOS_CORTE1.forEach(o => o.modulos.forEach(m => deModulo.set(m, o.id)));

      const porObjetivo = new Map(OBJETIVOS_CORTE1.map(o => [o.id, {
        id: o.id, titulo: o.titulo, peso: o.peso,
        total: 0, respondidas: 0, aciertos: 0, fallos: new Map()
      }]));

      Object.keys(AUTOEVALUACIONES).forEach(clave => {
        AUTOEVALUACIONES[clave].forEach((p, i) => {
          if (!p.ancla) return;
          const modulo = p.ancla.cap + '.' + p.ancla.modulo;
          const objetivo = porObjetivo.get(deModulo.get(modulo));
          if (!objetivo) return;
          objetivo.total++;
          const r = (RESULTADOS_QUIZ[clave] || [])[i];
          if (!r) return;
          objetivo.respondidas++;
          if (r.acierto) objetivo.aciertos++;
          if (r.acierto && !r.dudo) return;
          const previo = objetivo.fallos.get(modulo) ||
            objetivo.fallos.set(modulo, { fallos: 0, dudas: 0, ancla: p.ancla }).get(modulo);
          if (r.acierto) previo.dudas++; else previo.fallos++;
        });
      });

      return [...porObjetivo.values()].map(o => {
        const tasa = o.respondidas ? o.aciertos / o.respondidas : null;
        return Object.assign(o, {
          tasa: tasa,
          nivel: tasa === null ? 'vacio' : tasa < 0.6 ? 'flojo' : tasa < 0.8 ? 'medio' : 'solido'
        });
      });
    }

    const TEXTO_NIVEL = {
      vacio: 'Todavía sin datos: no has respondido ninguna de sus preguntas.',
      flojo: 'Aquí es donde hay que ir. Menos de tres de cada cinco.',
      medio: 'A medio camino. Merece un repaso corto antes que un repaso entero.',
      solido: 'Sólido. No inviertas más tiempo aquí.'
    };

    function enlaceModulo(ancla) {
      const href = CAPITULOS_HREF[ancla.cap];
      const nombre = `capítulo ${ancla.cap}, módulo ${ancla.modulo} · ${ancla.titulo}`;
      return href ? `<a href="${href}">${nombre}</a>` : nombre;
    }

    function pintaDiagnostico(caja) {
      const filas = calculaDiagnostico();
      const total = filas.reduce((a, o) => a + o.total, 0);
      const respondidas = filas.reduce((a, o) => a + o.respondidas, 0);
      const aciertos = filas.reduce((a, o) => a + o.aciertos, 0);

      if (!respondidas) {
        caja.innerHTML =
          '<div class="diagnostico-vacio">' +
          '<p><strong>Todavía no hay nada que diagnosticar.</strong> Responde algunas preguntas de ' +
          'los bloques o del simulacro y vuelve aquí: esta página no puntúa, calcula qué te falta.</p>' +
          `<p>Cuando lo hagas verás, objetivo por objetivo, cuántas de sus ${total} preguntas ` +
          'acertaste y en qué módulo del material está lo que se te escapó.</p>' +
          '</div>';
        return;
      }

      const cuerpo = filas.map(o => {
        const ancho = o.tasa === null ? 0 : Math.round(o.tasa * 100);
        // «0 de 5» en un objetivo sin responder se lee como cinco fallos. Las
        // cifras son SIEMPRE aciertos sobre respondidas; cuando no hay
        // respondidas no hay cociente que enseñar, y se dice con palabras.
        const cifras = o.respondidas ? `${o.aciertos} de ${o.respondidas}` : 'sin responder';
        const repasar = [...o.fallos.values()]
          .sort((a, b) => (b.fallos * 2 + b.dudas) - (a.fallos * 2 + a.dudas))
          .map(f => {
            const partes = [];
            if (f.fallos) {
              partes.push(`Fallaste ${f.fallos} ${f.fallos === 1 ? 'pregunta' : 'preguntas'}`);
            }
            if (f.dudas) {
              partes.push(`${f.fallos ? 'a' : 'A'}certaste ${f.dudas} al segundo intento`);
            }
            return `<li>${partes.join(' y ')} del ${enlaceModulo(f.ancla)}` +
                   `${f.ancla.lohr ? ` (Lohr ${f.ancla.lohr})` : ''}.</li>`;
          })
          .join('');
        return `
          <div class="diagnostico-fila" data-nivel="${o.nivel}">
            <div class="diagnostico-cabecera">
              <span class="diagnostico-id">${o.id}</span>
              <span class="diagnostico-titulo">${o.titulo}</span>
              <span class="diagnostico-peso">${o.peso} % del parcial · ${o.total} preguntas aquí</span>
              <span class="diagnostico-cifras">${cifras}</span>
            </div>
            <div class="diagnostico-barra" role="img"
                 aria-label="${o.id}: ${o.respondidas ? `${cifras} preguntas acertadas` : 'sin responder'}">
              <div class="diagnostico-barra-relleno" style="width:${ancho}%"></div>
            </div>
            <span class="diagnostico-estado">${TEXTO_NIVEL[o.nivel]}${
              o.respondidas < o.total
                ? ` Te quedan ${o.total - o.respondidas} sin responder de este objetivo.`
                : ''}</span>
            ${repasar ? `<ul class="diagnostico-repasar">${repasar}</ul>` : ''}
          </div>`;
      }).join('');

      // Por dónde empezar: no el peor porcentaje, sino el que más caro sale
      // — lo que falla multiplicado por lo que pesa en el parcial.
      const candidatos = filas.filter(o => o.respondidas && o.tasa < 0.8)
        .sort((a, b) => b.peso * (1 - b.tasa) - a.peso * (1 - a.tasa));
      const sinTocar = filas.filter(o => !o.respondidas);

      let empezar;
      if (candidatos.length) {
        const o = candidatos[0];
        empezar = `<strong>Empieza por ${o.id}.</strong> No es el porcentaje más bajo de la tabla ` +
          `necesariamente: es el que más caro sale, porque pesa el ${o.peso} % del parcial y ahí ` +
          `llevas ${o.aciertos} de ${o.respondidas}. Los módulos están enlazados justo arriba.`;
      } else if (sinTocar.length) {
        empezar = `<strong>Lo que llevas respondido va bien.</strong> Lo que falta es cobertura: ` +
          `${sinTocar.map(o => o.id).join(', ')} ${sinTocar.length === 1 ? 'sigue' : 'siguen'} ` +
          `sin ninguna pregunta respondida, así que de ${sinTocar.length === 1 ? 'ese objetivo' : 'esos objetivos'} ` +
          `todavía no sabes nada.`;
      } else {
        empezar = '<strong>Los seis objetivos por encima del 80 %.</strong> Con la tabla de ' +
          'especificaciones delante, esto es lo más parecido a estar listo que un preparcial ' +
          'puede decir. Lo que queda es hacer las que dejaste sin responder.';
      }

      caja.innerHTML = `
        <div class="diagnostico-global">
          <strong>${aciertos} de ${respondidas}</strong>
          <span>respondidas ${respondidas} de las ${total} preguntas de la página</span>
        </div>
        ${cuerpo}
        <div class="diagnostico-empezar"><p>${empezar}</p></div>`;
    }

    function iniciarDiagnosticos() {
      mainContent.querySelectorAll('[data-diagnostico]').forEach(pintaDiagnostico);
    }

    // Guarda contra el fallo silencioso: si el motor dejara de escribir
    // `.quiz-retro`, el registro se quedaría vacío y el diagnóstico diría
    // «no has respondido nada» a alguien que respondió cincuenta. Se
    // comprueba al vigilar, que es cuando los bloques están en pantalla.
    // El `:has()` va en try/catch porque un navegador que no lo entienda
    // lanza al parsear el selector, y una comprobación no puede tumbar la
    // página que comprueba.
    function avisaSiCambioElMarcado() {
      try {
        if (mainContent.querySelectorAll('.quiz-pregunta:not(:has(.quiz-retro))').length) {
          console.warn('Diagnóstico: hay bloques de pregunta sin .quiz-retro; el marcado del ' +
                       'motor cambió y el registro del diagnóstico puede estar incompleto.');
        }
      } catch (e) { /* navegador sin :has(); no es motivo para romper nada */ }
    }

