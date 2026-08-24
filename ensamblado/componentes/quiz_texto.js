    // ================================================================
    // Autoevaluación: pregunta de respuesta abierta (tipo 'texto')
    //
    // Por qué existe: el Parcial 1 se juega buena parte de la nota en
    // preguntas abiertas —definir, clasificar, corregir a un compañero,
    // explicarle algo a un lector no estadístico—, y un simulacro que solo
    // tenga opción múltiple entrena la mitad del examen.
    //
    // Qué NO hace: corregir texto libre. No se puede, y fingir que sí sería
    // peor que no tenerlo. Lo que hace es imponer el orden honesto:
    //
    //   1. El estudiante escribe su respuesta. Hasta que no escribe algo con
    //      cuerpo, el botón no revela nada: comprometerse con una respuesta
    //      antes de ver la buena ES el ejercicio.
    //   2. Aparecen la `respuestaModelo` y la lista `comprobacion`, tres
    //      puntos concretos que la respuesta tenía que llevar.
    //   3. El estudiante marca los que cubrió y registra. Los tres marcados
    //      cuentan como acierto; con menos, la pregunta queda resuelta pero
    //      no acertada, y su módulo aparece en el resumen de "qué repasar",
    //      que es exactamente donde tiene que aparecer.
    //
    // Campos que declara la pregunta:
    //   pregunta, pista, modulo   — como cualquier otra
    //   respuestaModelo           — HTML; se revela en el paso 2
    //   comprobacion              — array de 3 frases en primera persona
    //
    // La respuesta del estudiante no se guarda ni se envía a ningún sitio:
    // vive en el DOM y se pierde al reiniciar el quiz, igual que las opciones
    // marcadas de las demás preguntas.
    // ================================================================

    // Con menos de esto en la caja, no se revela la respuesta modelo. No es
    // una medida de calidad —nada lo es aquí—: es el mínimo para que revelar
    // no sea el acto reflejo con el que se salta el ejercicio.
    const QUIZ_TEXTO_MINIMO_PALABRAS = 12;

    function contarPalabras(texto) {
      const limpio = String(texto || '').trim();
      return limpio ? limpio.split(/\s+/).length : 0;
    }

    /**
     * Dibuja una pregunta de respuesta abierta dentro de `bloque`.
     * Recibe del motor lo que vive en el cierre de renderAutoevaluacion:
     * ctx = { estado, cerrar, mostrarPista, katexEn }.
     */
    function renderPreguntaTexto(p, i, bloque, pista, ctx) {
      const caja = document.createElement('div');
      caja.className = 'quiz-abierta';

      const area = document.createElement('textarea');
      area.setAttribute('aria-label', `Tu respuesta a la pregunta ${i + 1}`);
      area.placeholder = 'Escribe aquí tu respuesta, con tus palabras…';
      caja.appendChild(area);

      const cuenta = document.createElement('p');
      cuenta.className = 'quiz-cuenta';
      cuenta.setAttribute('role', 'status');
      caja.appendChild(cuenta);

      function actualizarCuenta() {
        const n = contarPalabras(area.value);
        cuenta.textContent = n === 0
          ? `${QUIZ_TEXTO_MINIMO_PALABRAS} palabras como mínimo para poder comparar`
          : `${n} ${n === 1 ? 'palabra' : 'palabras'}`;
      }
      area.addEventListener('input', actualizarCuenta);
      actualizarCuenta();

      const verModelo = document.createElement('button');
      verModelo.type = 'button';
      verModelo.className = 'quiz-comprobar';
      verModelo.textContent = 'Comparar con la respuesta modelo';
      caja.appendChild(verModelo);

      // --- Paso 2: la respuesta modelo, oculta hasta que haya respuesta ---
      const modelo = document.createElement('div');
      modelo.className = 'quiz-modelo';
      modelo.hidden = true;
      modelo.innerHTML = '<h6>Respuesta modelo</h6>' + (p.respuestaModelo || '');

      // --- Paso 3: la lista de comprobación ---
      const comprobacion = document.createElement('div');
      comprobacion.className = 'quiz-comprobacion';
      comprobacion.hidden = true;
      const titulo = document.createElement('p');
      titulo.textContent = 'Marca lo que tu respuesta sí decía. Sé honesto: el simulacro no puntúa, el parcial sí.';
      comprobacion.appendChild(titulo);

      const puntos = p.comprobacion || [];
      const marcados = new Set();
      const lista = document.createElement('div');
      lista.className = 'quiz-opciones';
      lista.setAttribute('role', 'group');
      lista.setAttribute('aria-label', `Lista de comprobación de la pregunta ${i + 1}`);

      const botones = puntos.map((texto, j) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'quiz-opcion';
        b.setAttribute('aria-pressed', 'false');
        b.innerHTML = `<span class="quiz-casilla" aria-hidden="true"></span><span>${texto}</span>`;
        b.addEventListener('click', () => {
          if (ctx.estado[i].resuelta) return;
          const activa = marcados.has(j);
          if (activa) marcados.delete(j); else marcados.add(j);
          b.classList.toggle('marcada', !activa);
          b.setAttribute('aria-pressed', String(!activa));
        });
        lista.appendChild(b);
        return b;
      });
      comprobacion.appendChild(lista);

      const registrar = document.createElement('button');
      registrar.type = 'button';
      registrar.className = 'quiz-comprobar';
      registrar.style.marginTop = '0.6rem';
      registrar.textContent = 'Registrar';
      comprobacion.appendChild(registrar);

      caja.appendChild(modelo);
      caja.appendChild(comprobacion);
      bloque.appendChild(caja);

      verModelo.addEventListener('click', () => {
        if (ctx.estado[i].resuelta) return;
        if (contarPalabras(area.value) < QUIZ_TEXTO_MINIMO_PALABRAS) {
          pista.innerHTML = '<strong>Escribe tu respuesta primero.</strong> Comprometerse con una ' +
            'respuesta antes de ver la buena es la mitad del ejercicio: leerla sin haber escrito ' +
            'nada produce la sensación de haberla sabido. ' + (p.pista || '');
          pista.hidden = false;
          ctx.katexEn(pista);
          return;
        }
        area.disabled = true;
        verModelo.disabled = true;
        modelo.hidden = false;
        comprobacion.hidden = false;
        pista.hidden = true;
        ctx.katexEn(modelo);
        ctx.katexEn(comprobacion);
      });

      registrar.addEventListener('click', () => {
        if (ctx.estado[i].resuelta) return;
        ctx.estado[i].intentos++;
        const faltan = puntos.map((_, j) => j).filter(j => !marcados.has(j));
        botones.forEach((b, j) => {
          b.disabled = true;
          b.classList.remove('marcada');
          b.classList.add(marcados.has(j) ? 'correcta' : 'pendiente');
        });
        registrar.disabled = true;
        const completo = faltan.length === 0;
        ctx.cerrar(i, bloque, completo, completo
          ? 'En el parcial, esos tres son exactamente los que se buscan al calificar: una respuesta que los lleve está completa aunque esté escrita con otras palabras.'
          : `Te ${faltan.length === 1 ? 'faltó' : 'faltaron'} ${faltan.length} de los tres, y ${faltan.length === 1 ? 'está' : 'están'} señalado${faltan.length === 1 ? '' : 's'} en ámbar. ` +
            'Reescribe tu respuesta incluyéndolo antes de pasar a la siguiente: releer la modelo no es lo mismo que haberla escrito.');
      });
    }
