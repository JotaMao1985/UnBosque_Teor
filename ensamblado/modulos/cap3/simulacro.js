    // ================================================================
    // Simulacro del quiz (Módulo 15)
    //
    // Se responde y se cronometra, pero NO se corrige: en la página no hay
    // clave, ni retroalimentación, ni nada de donde deducirlas. Es lo que
    // lo distingue de la autoevaluación del módulo 14, que sí las lleva: un
    // examen de práctica no puede publicar su clave, porque viajaría en el
    // HTML de un capítulo público.
    //
    // Injertado del Módulo 13 del capítulo 5 de Diseño de Experimentos
    // (2026-09-23), que viene del Módulo 11 del capítulo 3 de Series de
    // Tiempo. Allá bastaban dos formas de responder; el quiz de este
    // capítulo tiene siete tipos de pregunta, y el simulacro imita cada uno
    // con la forma de responder que tiene en Brightspace:
    //   · 'opcion'    una marca (selección única y verdadero o falso);
    //   · 'multiple'  varias marcas;
    //   · 'numero'    una casilla de texto, o varias si trae `casillas`
    //                 (la de rellenar espacios lleva dos);
    //   · 'emparejar' un desplegable por fila, con las `elecciones`
    //                 (emparejar, y ordenar con las elecciones 1, 2, 3…).
    //
    // Como allá, se engancha al registro SIMULADORES, que loadModule() ya
    // recorre, y lo respondido y la hora de final del reloj viven en
    // ESTADO_SIMULACRO, fuera del renderizado: salir al módulo 9 a consultar
    // algo y volver no borra el trabajo, y el reloj sigue corriendo
    // mientras tanto, como el del salón. Además se copian en sessionStorage,
    // para que tampoco los borre recargar la página o volver a ella desde
    // otro capítulo en la misma pestaña; si el navegador no deja guardar,
    // el simulacro funciona igual, solo que sin esa copia. Los enunciados
    // se pintan antes de que loadModule() llame a KaTeX, así que sus
    // fórmulas salen escritas.
    //
    // El CSS gemelo está en ensamblado/modulos/cap3/simulacro.css. Los dos
    // los inserta ensamblado/ensambla_cap3.py.
    //
    // SIMULACROS['id'] = { minutos, variante, preguntas: [{ n, etiqueta,
    // tipo, enunciado, opciones? | casillas? | filas? y elecciones? }] } lo
    // escribe un script que vive fuera del repositorio, con la clave.
    // ================================================================
    const SIMULACROS = {};
    const ESTADO_SIMULACRO = {};
    // Ocho letras: cinco preguntas de varias respuestas tienen seis opciones,
    // y el LETRAS del capítulo llega a cinco.
    const LETRAS_SIMULACRO = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    function vaciasSimulacro(sim) {
      return sim.preguntas.map(pr => {
        if (pr.tipo === 'numero') return (pr.casillas || ['']).map(() => '');
        if (pr.tipo === 'emparejar') return pr.filas.map(() => -1);
        return [];
      });
    }

    // La copia en sessionStorage. Solo se acepta si tiene la forma de ESTE
    // registro —las mismas preguntas, con las mismas casillas y filas—: una
    // copia de una versión anterior del simulacro se descarta en silencio.
    function claveSimulacro(id) {
      return `simulacro:${id}`;
    }
    function leeSimulacro(id, sim) {
      try {
        const e = JSON.parse(sessionStorage.getItem(claveSimulacro(id)) || 'null');
        const vacias = vaciasSimulacro(sim);
        const forma = e && Array.isArray(e.respuestas) && e.respuestas.length === vacias.length &&
          e.respuestas.every((r, i) => Array.isArray(r) &&
            (sim.preguntas[i].tipo === 'opcion' || sim.preguntas[i].tipo === 'multiple'
              ? r.every(j => Number.isInteger(j) && j >= 0 && j < sim.preguntas[i].opciones.length)
              : r.length === vacias[i].length)) &&
          (e.finAt === null || typeof e.finAt === 'number') && typeof e.restante === 'number';
        return forma ? { respuestas: e.respuestas, finAt: e.finAt, restante: e.restante } : null;
      } catch (err) {
        return null;
      }
    }
    function guardaSimulacro(id, estado) {
      try {
        sessionStorage.setItem(claveSimulacro(id), JSON.stringify(estado));
      } catch (err) {
        // Sin almacenamiento (ventana privada, cuota, bloqueo): queda la copia en memoria.
      }
    }

    SIMULADORES['cap3-simulacro'] = function (raiz) {
      const id = raiz.dataset.simulador;
      const sim = SIMULACROS[id];
      if (!sim) {
        console.warn(`Simulacro no registrado: ${id}`);
        return [];
      }
      if (!ESTADO_SIMULACRO[id]) {
        ESTADO_SIMULACRO[id] = leeSimulacro(id, sim) || {
          respuestas: vaciasSimulacro(sim),
          finAt: null,
          restante: sim.minutos * 60
        };
      }
      const estado = ESTADO_SIMULACRO[id];
      // Si el tiempo se acabó mientras se estaba en otro módulo (o con la
      // página cerrada), se entra con el reloj ya en cero, no corriendo.
      if (estado.finAt !== null && estado.finAt <= Date.now()) {
        estado.finAt = null;
        estado.restante = 0;
      }
      return pintarSimulacro(raiz, sim, estado, () => guardaSimulacro(id, estado));
    };

    function pintarSimulacro(raiz, sim, estado, guarda) {
      const contenedor = raiz.querySelector('.simulacro-preguntas');
      const conteo = raiz.querySelector('.simulacro-conteo');
      const resumen = raiz.querySelector('.simulacro-resumen');
      const reloj = raiz.querySelector('.simulacro-reloj');
      const empezar = raiz.querySelector('.simulacro-empezar');
      const borrar = raiz.querySelector('.simulacro-borrar');
      const listas = [];
      const campos = [];          // las casillas y los desplegables de cada pregunta
      contenedor.innerHTML = '';

      // Una pregunta cuenta como respondida cuando no le falta nada: todas
      // sus casillas escritas, o todas sus filas con algo elegido.
      function completa(pr, r) {
        if (pr.tipo === 'numero') return r.every(t => t.trim() !== '');
        if (pr.tipo === 'emparejar') return r.every(j => j >= 0);
        return r.length > 0;
      }

      sim.preguntas.forEach((pr, i) => {
        const caja = document.createElement('div');
        caja.className = 'simulacro-pregunta';
        const varias = pr.tipo === 'multiple';
        caja.innerHTML = `<span class="simulacro-etiqueta">${pr.n}. ${pr.etiqueta}` +
          `${varias ? ' · varias respuestas' : ''}</span>` +
          `<div class="simulacro-enunciado">${pr.enunciado}</div>`;

        if (pr.tipo === 'numero') {
          const bloque = document.createElement('div');
          bloque.className = 'simulacro-casillas';
          campos[i] = (pr.casillas || ['Respuesta']).map((rotulo, c) => {
            const fila = document.createElement('label');
            fila.className = 'simulacro-respuesta';
            fila.innerHTML = `<span>${rotulo}</span>`;
            const casilla = document.createElement('input');
            // Teclado de texto, no `inputMode = 'decimal'`: en un teléfono con
            // la región en español, ese teclado solo ofrece la coma, y aquí
            // se pide el punto decimal, como en Brightspace.
            casilla.type = 'text';
            casilla.autocomplete = 'off';
            casilla.spellcheck = false;
            casilla.className = 'simulacro-numero';
            // Con `casillas`, el <label> que la envuelve ya le da el nombre
            // visible («La mediana estimada»); sin ellas, el rótulo es solo
            // «Respuesta», y se dice de qué pregunta.
            if (!pr.casillas) casilla.setAttribute('aria-label', `Respuesta de la pregunta ${pr.n}`);
            casilla.value = estado.respuestas[i][c];
            casilla.oninput = () => {
              estado.respuestas[i][c] = casilla.value;
              pintaMarcador();
            };
            fila.appendChild(casilla);
            bloque.appendChild(fila);
            return casilla;
          });
          caja.appendChild(bloque);
        } else if (pr.tipo === 'emparejar') {
          const bloque = document.createElement('div');
          bloque.className = 'simulacro-filas';
          campos[i] = pr.filas.map((texto, f) => {
            const fila = document.createElement('div');
            fila.className = 'simulacro-fila';
            const lista = document.createElement('select');
            lista.className = 'simulacro-eleccion';
            lista.setAttribute('aria-label', `Pregunta ${pr.n}, fila ${f + 1}`);
            // El texto de la fila va DESPUÉS del desplegable: se enlaza para
            // que quien recorre con Tab oiga qué está ordenando o emparejando.
            const idTexto = `${raiz.dataset.simulador}-p${pr.n}-f${f + 1}`;
            lista.setAttribute('aria-describedby', idTexto);
            lista.innerHTML = '<option value="-1">—</option>' +
              pr.elecciones.map((e, j) => `<option value="${j}">${e}</option>`).join('');
            lista.value = String(estado.respuestas[i][f]);
            lista.onchange = () => {
              estado.respuestas[i][f] = Number(lista.value);
              pintaMarcador();
            };
            const rotulo = document.createElement('div');
            rotulo.className = 'simulacro-fila-texto';
            rotulo.id = idTexto;
            rotulo.innerHTML = texto;
            fila.appendChild(lista);
            fila.appendChild(rotulo);
            bloque.appendChild(fila);
            return lista;
          });
          caja.appendChild(bloque);
        } else {
          const lista = document.createElement('div');
          lista.className = 'simulacro-opciones';
          lista.setAttribute('role', 'group');
          lista.setAttribute('aria-label', `Opciones de la pregunta ${pr.n}`);
          pr.opciones.forEach((texto, j) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'simulacro-opcion';
            b.innerHTML = `<span class="simulacro-letra">${LETRAS_SIMULACRO[j]})</span><span>${texto}</span>`;
            b.onclick = () => {
              const puesta = estado.respuestas[i].includes(j);
              if (varias) {
                estado.respuestas[i] = puesta
                  ? estado.respuestas[i].filter(x => x !== j)
                  : estado.respuestas[i].concat(j).sort((a, b) => a - b);
              } else {
                estado.respuestas[i] = puesta ? [] : [j];
              }
              pintaOpciones(i);
              pintaMarcador();
            };
            lista.appendChild(b);
          });
          caja.appendChild(lista);
          listas[i] = lista;
        }
        contenedor.appendChild(caja);
        if (listas[i]) pintaOpciones(i);
      });

      function pintaOpciones(i) {
        listas[i].querySelectorAll('.simulacro-opcion').forEach((o, j) => {
          const marcada = estado.respuestas[i].includes(j);
          o.classList.toggle('marcada', marcada);
          o.setAttribute('aria-pressed', marcada ? 'true' : 'false');
        });
      }

      // Lo tecleado entra en el resumen como TEXTO, nunca como HTML: es lo
      // único de la página que escribe el estudiante.
      function enResumen(pr, r) {
        if (pr.tipo === 'numero') {
          return r.every(t => t.trim() === '') ? '—' : r.map(t => t.trim() || '—').join(' / ');
        }
        if (pr.tipo === 'emparejar') {
          return r.every(j => j < 0) ? '—'
            : r.map(j => (j < 0 ? '—' : pr.elecciones[j].slice(0, 3))).join('·');
        }
        return r.length ? r.map(j => LETRAS_SIMULACRO[j]).join('') : '—';
      }

      // Cada respuesta va en un <code>, que KaTeX no toca: si alguien teclea
      // «$3» y «$4» en dos casillas, al volver al módulo no se convierte en
      // fórmula lo que hay entre ellos.
      function pintaMarcador() {
        const hechas = sim.preguntas.filter((pr, i) => completa(pr, estado.respuestas[i])).length;
        conteo.textContent = (segundos() === 0 ? 'Se acabó el tiempo · ' : '') +
          `${hechas} de ${sim.preguntas.length} respondidas`;
        resumen.textContent = 'Tus respuestas: ';
        sim.preguntas.forEach((pr, i) => {
          const c = document.createElement('code');
          c.textContent = `${pr.n}: ${enResumen(pr, estado.respuestas[i])}`;
          if (i) resumen.appendChild(document.createTextNode(' · '));
          resumen.appendChild(c);
        });
        resumen.appendChild(document.createTextNode('. No se corrigen aquí.'));
        guarda();
      }

      // El reloj: `finAt` es la hora en que se acaba y manda mientras corre;
      // `restante` solo guarda los segundos cuando está pausado.
      let tic = null;
      function para() {
        if (tic !== null) { clearInterval(tic); tic = null; }
      }
      function segundos() {
        return estado.finAt === null
          ? estado.restante
          : Math.max(0, Math.round((estado.finAt - Date.now()) / 1000));
      }
      // A 0:00 el botón no dice «Seguir»: lo que hace es darle al reloj otros
      // setenta minutos, y lo respondido se queda.
      function pintaReloj() {
        const s = segundos();
        reloj.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
        reloj.classList.toggle('acabado', s === 0);
        empezar.textContent = estado.finAt !== null ? 'Pausar'
          : s === sim.minutos * 60 ? `Empezar los ${sim.minutos} minutos`
            : s === 0 ? `Reiniciar el reloj (${sim.minutos} min)` : 'Seguir';
      }
      function arranca() {
        para();
        tic = setInterval(() => {
          if (segundos() === 0) {
            estado.finAt = null;
            estado.restante = 0;
            para();
            pintaMarcador();                  // «Se acabó el tiempo», y se guarda
          }
          pintaReloj();
        }, 250);
      }
      empezar.onclick = () => {
        if (estado.finAt !== null) {          // corriendo: se pausa
          estado.restante = segundos();
          estado.finAt = null;
          para();
        } else {
          if (estado.restante === 0) estado.restante = sim.minutos * 60;
          estado.finAt = Date.now() + estado.restante * 1000;
          arranca();
        }
        pintaReloj();
        pintaMarcador();
      };

      // Borrar tira hasta setenta minutos de trabajo, así que con algo
      // respondido o con el reloj movido pide un segundo clic. No usa
      // confirm(): hay navegadores y marcos que lo bloquean, y entonces el
      // botón no borraría nunca.
      let armado = null;
      function desarma() {
        if (armado !== null) { clearTimeout(armado); armado = null; }
        borrar.textContent = 'Borrar';
      }
      function hayAlgo() {
        return estado.finAt !== null || estado.restante !== sim.minutos * 60 ||
          sim.preguntas.some((pr, i) => {
            const r = estado.respuestas[i];
            if (pr.tipo === 'numero') return r.some(t => t.trim() !== '');
            if (pr.tipo === 'emparejar') return r.some(j => j >= 0);
            return r.length > 0;
          });
      }
      borrar.onclick = () => {
        if (armado === null && hayAlgo()) {
          borrar.textContent = '¿Borrar todo? Pulsa otra vez';
          armado = setTimeout(desarma, 4000);
          return;
        }
        desarma();
        para();
        estado.respuestas = vaciasSimulacro(sim);
        estado.finAt = null;
        estado.restante = sim.minutos * 60;
        sim.preguntas.forEach((pr, i) => {
          if (campos[i]) {
            campos[i].forEach(c => { c.value = pr.tipo === 'emparejar' ? '-1' : ''; });
          }
          if (listas[i]) pintaOpciones(i);
        });
        pintaMarcador();
        pintaReloj();
      };

      if (estado.finAt !== null) arranca();
      pintaReloj();
      pintaMarcador();
      // Lo que devuelve un simulador son los objetos que destruirSimuladores()
      // apaga al cambiar de módulo. Aquí no hay gráficos: lo que hay que apagar
      // son el intervalo, que si no seguiría pintando sobre nodos que ya no
      // están en el documento, y la espera del segundo clic de Borrar.
      return [{ destroy: () => { para(); desarma(); } }];
    }

    // [inicio · simulacro del quiz]
    // ================================================================
    // Simulacro del quiz (Módulo 15) · variante E, SIN CLAVE
    //
    // NO SE EDITA A MANO: lo escribe un script que vive fuera del
    // repositorio, junto con la clave, que no se publica. Aquí solo
    // viajan los enunciados y las opciones, porque este capítulo es
    // público.
    //
    // La variante E no es el quiz de Brightspace: cada pregunta evalúa
    // lo mismo que la del mismo número en el quiz, con otra situación y
    // otros datos, todos construidos.
    // ================================================================
    SIMULACROS['cap3-simulacro'] = {
      "minutos": 70,
      "variante": "E",
      "preguntas": [
        {
          "n": 1,
          "etiqueta": "cap. 2 · mód. 7 · Cuántos encuestar",
          "enunciado": "<p>Una empresa de acueducto quiere estimar el consumo medio mensual de agua de los 1 850 hogares de un barrio. Un piloto por MAS de 30 hogares del mismo barrio da $\\bar y = 14{,}62$ m³ y $s = 10{,}50$ m³ (ejemplo construido). ¿A cuántos hogares, como mínimo, hay que llegar por MAS para que el consumo medio quede estimado con un error no mayor que el 10 % de la media, con un 90 % de confianza? Usa la aproximación normal y no redondees las cuentas intermedias.</p>",
          "tipo": "opcion",
          "opciones": [
            "140 hogares.",
            "179 hogares.",
            "130 hogares.",
            "429 hogares."
          ]
        },
        {
          "n": 2,
          "etiqueta": "cap. 2 · mód. 8 · Cajas abiertas al azar",
          "enunciado": "<p>Una planta embotelladora decide, caja por caja y según van saliendo de la línea, si la abre para inspeccionarla: un generador aleatorio dice «abrir» con probabilidad $\\pi = 0{,}04$, sin tener en cuenta lo que dijo con las demás cajas. En el turno salieron $N = 3\\,125$ cajas, y con las abiertas se estima el número total de botellas defectuosas del turno. Marca todas las afirmaciones correctas.</p>",
          "tipo": "multiple",
          "opciones": [
            "La probabilidad de que en el turno no se abra ninguna caja es $(1-\\pi)^N$, del orden de $10^{-56}$ con estas cifras.",
            "Si en el turno no se abriera ninguna caja, $\\hat t_\\pi = \\sum_{k \\in s} y_k/\\pi$ quedaría sin definir, igual que el estimador de Hájek.",
            "Si en el turno se abren $m \\ge 1$ cajas, todos los conjuntos de $m$ cajas tenían la misma probabilidad de ser los abiertos: dado ese número, es un MAS de tamaño $m$.",
            "Como el número de cajas abiertas varía, el estimador de Hájek, $N\\,\\hat t_\\pi/\\hat N$, queda sesgado en este diseño.",
            "Si, terminado el turno, sacara en cambio 125 cajas con reemplazo entre todas las del turno, inspeccionaría siempre 125 cajas distintas.",
            "Si, terminado el turno, sacara en cambio 125 cajas con reemplazo entre todas las del turno, la media de las 125 extracciones seguiría siendo insesgada para la media del turno."
          ]
        },
        {
          "n": 3,
          "etiqueta": "cap. 2 · mód. 9 · Sistemático sobre una lista ordenada",
          "enunciado": "<p>Un auditor tiene un archivo de 1 200 facturas ordenado de menor a mayor por el valor que declaró cada proveedor —el valor auditado suele quedar cerca del declarado—, y quiere estimar el valor auditado total, en millones de pesos, revisando solo algunas (ejemplo construido). Toma un sistemático 1 en 20: sortea un arranque entre las 20 primeras facturas y revisa una de cada 20, $n = 60$. La muestra se analiza luego con <code>svydesign(id = ~1, fpc = rep(1200, 60), data = m)</code>. ¿Qué describe mejor lo que pasa?</p>",
          "tipo": "opcion",
          "opciones": [
            "El total es insesgado, y la fórmula del MAS le atribuye más variabilidad de la que tiene: el orden de la lista estratifica implícitamente, y el análisis queda conservador.",
            "El total es insesgado, pero la fórmula del MAS le atribuye mucha menos variabilidad de la que tiene: la muestra toma siempre la misma posición dentro de cada tramo de 20 facturas.",
            "Con 60 facturas, la varianza de diseño se estima sin sesgo con la fórmula de Horvitz–Thompson, porque cada factura tiene $\\pi_k = 1/20$.",
            "El total es sesgado: como la lista está ordenada, el arranque decide si la muestra sale con facturas algo más pequeñas o algo más grandes.",
            "No hay nada que corregir: las facturas tienen aquí las mismas $\\pi_{kl}$ que en un MAS de 60, y el error estándar del MAS es exactamente el del diseño."
          ]
        },
        {
          "n": 4,
          "etiqueta": "cap. 3 · mód. 1 · Qué hace auxiliar a una variable",
          "enunciado": "<p>Para que $x$ sirva de variable auxiliar en el estimador de razón hace falta conocer $x_k$ en todas las unidades de la población, no solo su total $t_x$.</p>",
          "tipo": "opcion",
          "opciones": [
            "Verdadero",
            "Falso"
          ]
        },
        {
          "n": 5,
          "etiqueta": "cap. 3 · mód. 2 · El total por razón",
          "enunciado": "<p>En un MAS de 60 hoteles, tomado de un registro de 900 hoteles de una región, el ingreso medio del mes fue $\\bar y = 184{,}6$ millones de pesos y el número medio de habitaciones, $\\bar x = 42{,}8$ (ejemplo construido). El registro turístico da el total de habitaciones de los 900 hoteles, $t_x = 40\\,150$. Calcula $\\hat t_r$, la estimación de razón del ingreso total del mes, sin redondear las cuentas intermedias, y escríbela en millones de pesos, redondeada a la unidad y solo con cifras: sin puntos ni espacios de miles.</p>",
          "tipo": "numero"
        },
        {
          "n": 6,
          "etiqueta": "cap. 3 · mód. 2 · El error estándar de la razón, paso a paso",
          "enunciado": "<p>Pon en orden los pasos con los que el módulo 2 estima, bajo MAS, el error estándar de $\\hat t_r$: el mismo que da <code>svyratio</code> una vez multiplicado por $t_x$.</p>",
          "tipo": "emparejar",
          "filas": [
            "Calcular $N^2(1 - n/N)\\,s_e^2/n$, la varianza del MAS para un total.",
            "Multiplicar por $(t_x/\\hat t_{x,\\pi})^2$, el cuadrado del factor que la derivación había sustituido por 1, y sacar la raíz.",
            "Calcular la razón muestral $\\hat B = \\bar y/\\bar x$, con todas sus cifras.",
            "Calcular en cada unidad de la muestra $e_k = y_k - \\hat B\\,x_k$, y la varianza muestral $s_e^2$ de esos $e_k$."
          ],
          "elecciones": [
            "1",
            "2",
            "3",
            "4"
          ]
        },
        {
          "n": 7,
          "etiqueta": "cap. 3 · mód. 3 · Razón o media muestral",
          "enunciado": "<p>Una distribuidora tiene 1 500 tiendas cliente. El censo comercial da el área de cada local, $x$ (m²), para las 1 500; las ventas del mes, $y$ (millones de pesos), solo se conocen para un MAS de 50 tiendas (ejemplo construido). En esa muestra sale $r = 0{,}4111$, $\\widehat{\\mathrm{CV}}(x) = 0{,}4057$ y $\\widehat{\\mathrm{CV}}(y) = 0{,}6482$. ¿Le gana el estimador de razón a la media muestral para estimar la venta media, y por qué?</p>",
          "tipo": "opcion",
          "opciones": [
            "Sí: $r = 0{,}4111$ supera el umbral $\\tfrac12\\,\\widehat{\\mathrm{CV}}(x)/\\widehat{\\mathrm{CV}}(y) = 0{,}313$.",
            "No: $r$ no alcanza el umbral $\\tfrac12\\,\\widehat{\\mathrm{CV}}(y)/\\widehat{\\mathrm{CV}}(x) = 0{,}799$.",
            "No: $r = 0{,}4111$ no llega a 0,5.",
            "No: $r = 0{,}4111$ no alcanza $\\widehat{\\mathrm{CV}}(x)/\\widehat{\\mathrm{CV}}(y) = 0{,}626$.",
            "Sí: basta con que $x$ e $y$ crezcan juntas, $r > 0$, para que la razón le gane a la media muestral."
          ]
        },
        {
          "n": 8,
          "etiqueta": "cap. 3 · mód. 4 · Qué se hace con el sesgo",
          "enunciado": "<p>Marca todas las afirmaciones correctas sobre el sesgo de $\\hat t_r$ bajo MAS y sobre lo que se hace con él.</p>",
          "tipo": "multiple",
          "opciones": [
            "Con $n = N$ el sesgo no desaparece: $\\hat B$ sigue siendo un cociente, y el sesgo viene de serlo, no del tamaño de la muestra.",
            "Entre dos auxiliares igual de correlacionadas con $y$, la de menor $\\mathrm{CV}(x)$ deja una cota del sesgo relativo más baja.",
            "Si la correlación entre $x$ e $y$ es muy alta, $\\hat B$ apenas varía entre muestras y el estimador de razón es insesgado.",
            "La cota vale igual para $\\hat B$, para la media de razón y para $\\hat t_r$: los tres difieren en una constante que se cancela en el cociente.",
            "Si $\\mathrm{CV}(\\hat{\\bar x})$ vale 0,2, el sesgo de $\\hat t_r$ no llega a la quinta parte de su error estándar, y la regla de Kish lo da por despreciable.",
            "Como la cota se deduce de $\\lvert\\rho\\rvert \\le 1$, el sesgo relativo de verdad suele quedar muy cerca de ella."
          ]
        },
        {
          "n": 9,
          "etiqueta": "cap. 3 · mód. 4 · La cota del sesgo",
          "enunciado": "<p>Un MAS de $n = 35$ lotes, tomado de una bodega de $N = 320$, da para la variable auxiliar, el peso declarado de cada lote, $\\bar x = 5{,}6$ t y $s_x = 2{,}3$ t (ejemplo construido). Estima la cota del sesgo relativo de la razón, es decir, el coeficiente de variación estimado de $\\hat{\\bar x}$, sin redondear las cuentas intermedias. Responde con cuatro decimales y punto decimal.</p>",
          "tipo": "numero"
        },
        {
          "n": 10,
          "etiqueta": "cap. 3 · mód. 5 · Cuándo un cociente es una razón",
          "enunciado": "<p>En cada colegio de un MAS de 150, tomado de los 2 400 colegios de un departamento, se cuentan las aulas y los estudiantes, y se anota si hay biblioteca. Del departamento solo se sabe cuántos colegios tiene. ¿Cuál de estas cantidades hay que estimar como una razón, con su sesgo y su linealización?</p>",
          "tipo": "opcion",
          "opciones": [
            "El número medio de estudiantes por colegio.",
            "La proporción de colegios con biblioteca.",
            "El promedio, sobre los colegios, del número de estudiantes por aula de cada uno.",
            "El número total de aulas del departamento.",
            "El número de estudiantes por aula en el departamento."
          ]
        },
        {
          "n": 11,
          "etiqueta": "cap. 3 · mód. 8 · Qué estimador en cada región",
          "enunciado": "<p>Una cadena de ferreterías estima la venta media mensual por tienda (millones de pesos) en tres regiones. Cada región se muestreó por separado, con un MAS independiente de los de las otras dos, y la auxiliar es el área de exhibición (m²), que se conoce para todas las tiendas. Es un ejemplo construido. Para cada región, la tabla da $n_h$, la venta media de la muestra, $r$, el umbral del módulo 3 y lo que dice la recta con intercepto: la constante y el p-valor de cada coeficiente.</p><table><tr><th>Región</th><th>$n_h$</th><th>$\\bar y_h$ (millones)</th><th>$r$</th><th>$\\tfrac12\\,\\widehat{\\mathrm{CV}}(x)/\\widehat{\\mathrm{CV}}(y)$</th><th>constante</th><th>$p$ constante</th><th>$p$ pendiente</th></tr><tr><td>A</td><td>16</td><td>147,91</td><td>−0,071</td><td>0,919</td><td>153,64</td><td>&lt; 0,0001</td><td>0,7930</td></tr><tr><td>B</td><td>21</td><td>113,11</td><td>0,957</td><td>0,487</td><td>1,90</td><td>0,8234</td><td>&lt; 0,0001</td></tr><tr><td>C</td><td>12</td><td>135,93</td><td>0,817</td><td>0,978</td><td>79,14</td><td>0,0002</td><td>0,0012</td></tr></table><p>¿Qué estimador conviene en cada región?</p>",
          "tipo": "opcion",
          "opciones": [
            "A razón · B expansión · C regresión",
            "A expansión · B razón · C regresión",
            "A expansión · B razón · C expansión",
            "A regresión · B razón · C regresión",
            "A regresión · B regresión · C regresión",
            "A expansión · B regresión · C regresión",
            "A regresión · B razón · C expansión"
          ]
        },
        {
          "n": 12,
          "etiqueta": "cap. 3 · mód. 9 · Un total de dominio en R",
          "enunciado": "<p>Una cadena tiene 800 farmacias (ejemplo construido). Se toma un MAS de $n = 60$, guardado en <code>ms</code>, con sus ventas del mes (<code>ventas</code>, en millones de pesos), y <code>N</code> y <code>n</code> ya están definidos. Se quiere estimar las ventas totales de las farmacias que abren las 24 horas (<code>abre24 == 1</code>): nadie las tuvo en cuenta al diseñar la muestra, y tampoco se sabe cuántas de las 800 son. Así lo resuelven dos analistas:</p><pre>&gt; sub &lt;- subset(ms, abre24 == 1)\n&gt; dis_sub &lt;- svydesign(id = ~1, fpc = rep(N, nrow(sub)), data = sub)\n&gt; svytotal(~ventas, dis_sub)\n        total    SE\nventas 411045 71111\n&gt; ms &lt;- transform(ms, dominio = abre24 == 1)\n&gt; dis &lt;- svydesign(id = ~1, fpc = rep(N, n), data = ms)\n&gt; svyby(~ventas, ~dominio, dis, svytotal)\n      dominio   ventas       se\nFALSE   FALSE 106405.3 11120.92\nTRUE     TRUE 109612.0 29010.46</pre><p>¿Cuál de los dos totales del dominio hay que reportar, y por qué?</p>",
          "tipo": "opcion",
          "opciones": [
            "El de <code>svyby</code>, porque el filtrado se olvida de la corrección por población finita.",
            "El del filtrado: con $N_d$ desconocido, el total del dominio es $N$ por la venta media de las farmacias del dominio.",
            "El de <code>svyby</code>: sobre el diseño completo, las farmacias de fuera del dominio cuentan como ceros y cada una de las 60 sigue pesando $N/n$.",
            "El del filtrado: las farmacias que no abren las 24 horas no dicen nada del dominio, y <code>svyby</code> las mete en la cuenta."
          ]
        },
        {
          "n": 13,
          "etiqueta": "cap. 3 · mód. 6 · El error estándar de la media por regresión",
          "enunciado": "<p>Una empresa administra 180 edificios de oficinas (ejemplo construido). El área de cada uno (m²) está en su registro, y el consumo de energía del mes (MWh) solo se midió en un MAS de $n = 9$ edificios. Como un edificio gasta energía aunque esté vacío (ascensores, bombas, vigilancia), se estima con regresión. En la muestra, $\\bar y = 42{,}50$ MWh, $s_y = 9{,}11$ MWh, $\\bar x = 1\\,394{,}0$ m² y $r = 0{,}8585$; el registro da $\\bar x_U = 1\\,355{,}9$ m². Si la varianza de los residuos lleva el divisor $n - 2$, ¿qué error estándar estimado tiene $\\hat{\\bar y}_{\\text{reg}}$, el consumo medio por edificio?</p>",
          "tipo": "opcion",
          "opciones": [
            "3,16 MWh.",
            "1,52 MWh.",
            "1,62 MWh.",
            "532,76 MWh.",
            "2,96 MWh."
          ]
        },
        {
          "n": 14,
          "etiqueta": "cap. 3 · mód. 7 · El error estándar de la diferencia",
          "enunciado": "<p>Una bodega maneja 900 referencias (ejemplo construido). El sistema de inventario da las unidades de cada referencia ($x$) para todas, y el conteo físico ($y$) solo se hizo en un MAS de $n = 30$. El conteo físico mide lo mismo que el sistema y suele quedarse unas pocas unidades por debajo en cada referencia (la merma), así que el total se estima con el estimador de diferencia. En la muestra, $\\bar y = 68{,}67$, $\\bar x = 71{,}47$, $s_y = 27{,}36$, $s_x = 27{,}79$, y la covarianza muestral de los dos conteos es $s_{xy} = 753{,}51$. ¿Qué error estándar estimado tiene el total de unidades en bodega?</p>",
          "tipo": "opcion",
          "opciones": [
            "6 300 unidades.",
            "1 150 unidades.",
            "4 475 unidades.",
            "8 890 unidades.",
            "601 unidades."
          ]
        },
        {
          "n": 15,
          "etiqueta": "cap. 3 · mód. 9 · El error estándar de una media de dominio",
          "enunciado": "<p>Un municipio tiene 3 200 hogares (ejemplo construido). En un MAS de $n = 150$ se midió el consumo de agua del último mes, en m³. Que el hogar tenga o no niños menores de 12 años no entró en el diseño: de los 150 hogares de la muestra, $n_d = 44$ tienen niños, y su consumo medio es $\\hat{\\bar y}_d = 23{,}72$ m³. El residuo linealizado $u_k = \\delta_k\\,(y_k - \\hat{\\bar y}_d)$, que vale cero fuera del dominio, tiene varianza muestral $s_u^2 = 42{,}78$ sobre los 150 hogares. ¿Qué error estándar estimado tiene $\\hat{\\bar y}_d$, el consumo medio de los hogares con niños?</p>",
          "tipo": "opcion",
          "opciones": [
            "0,15 m³.",
            "0,52 m³.",
            "0,96 m³.",
            "1,78 m³.",
            "3,28 m³."
          ]
        },
        {
          "n": 16,
          "etiqueta": "cap. 3 · integradora · Leer una salida: qué estimador",
          "enunciado": "<p>Un distrito de riego tiene 2 500 parcelas. El catastro da el área de cada una (<code>area</code>, en hectáreas) para todas; el consumo de agua del trimestre (<code>consumo</code>, en miles de m³) solo se midió en un MAS de 50, guardado en <code>m</code> (ejemplo construido). El catastro da $\\bar x_U = 9{,}9684$ ha (en <code>xU</code>) y $t_x = 24\\,921{,}11$ ha (en <code>t_x</code>). Esta es la salida:</p><pre>&gt; dis &lt;- svydesign(id = ~1, fpc = rep(2500, 50), data = m)\n&gt; signif(coef(summary(svyglm(consumo ~ area, design = dis))), 4)\n            Estimate Std. Error t value  Pr(&gt;|t|)\n(Intercept)  -0.1627     1.2170 -0.1337 8.942e-01\narea          2.4810     0.1404 17.6700 1.193e-22\n&gt; cv &lt;- function(v) sd(v) / mean(v)\n&gt; round(with(m, c(r = cor(area, consumo), umbral = 0.5 * cv(area) / cv(consumo))), 4)\n     r umbral \n0.9616 0.4776 \n&gt; raz &lt;- svyratio(~consumo, ~area, dis)\n&gt; coef(raz)\nconsumo/area \n    2.463905 </pre><p>¿Qué estimador del consumo medio conviene usar?</p>",
          "tipo": "opcion",
          "opciones": [
            "El de expansión.",
            "El de diferencia.",
            "El de razón.",
            "El de regresión."
          ]
        },
        {
          "n": 17,
          "etiqueta": "cap. 3 · integradora · Leer una salida: qué respalda",
          "enunciado": "<p>Un distrito de riego tiene 2 500 parcelas. El catastro da el área de cada una (<code>area</code>, en hectáreas) para todas; el consumo de agua del trimestre (<code>consumo</code>, en miles de m³) solo se midió en un MAS de 50, guardado en <code>m</code> (ejemplo construido). El catastro da $\\bar x_U = 9{,}9684$ ha (en <code>xU</code>) y $t_x = 24\\,921{,}11$ ha (en <code>t_x</code>). Esta es la salida:</p><pre>&gt; dis &lt;- svydesign(id = ~1, fpc = rep(2500, 50), data = m)\n&gt; signif(coef(summary(svyglm(consumo ~ area, design = dis))), 4)\n            Estimate Std. Error t value  Pr(&gt;|t|)\n(Intercept)  -0.1627     1.2170 -0.1337 8.942e-01\narea          2.4810     0.1404 17.6700 1.193e-22\n&gt; cv &lt;- function(v) sd(v) / mean(v)\n&gt; round(with(m, c(r = cor(area, consumo), umbral = 0.5 * cv(area) / cv(consumo))), 4)\n     r umbral \n0.9616 0.4776 \n&gt; raz &lt;- svyratio(~consumo, ~area, dis)\n&gt; coef(raz)\nconsumo/area \n    2.463905 \n&gt; exp_m &lt;- svymean(~consumo, dis)\n&gt; cal &lt;- calibrate(dis, ~area, c(`(Intercept)` = 2500, area = t_x))\n&gt; reg_m &lt;- svymean(~consumo, cal)\n&gt; round(rbind(expansion = c(media = coef(exp_m)[[1]], ee = SE(exp_m)[[1]]),\n+             razon     = c(coef(raz)[[1]] * xU, SE(raz)[[1]] * xU),\n+             regresion = c(coef(reg_m)[[1]], SE(reg_m)[[1]])), 4)\n            media     ee\nexpansion 24.0216 2.0094\nrazon     24.5613 0.5640\nregresion 24.5650 0.5663</pre><p>Marca todas las afirmaciones que esta salida respalda.</p>",
          "tipo": "multiple",
          "opciones": [
            "$\\hat B = 2{,}464$ y $\\hat b_1 = 2{,}481$ casi coinciden: la regresión no tiene de dónde sacarle ventaja a la razón.",
            "La regresión es la que conviene: el teorema del módulo 7 dice que no puede perder frente a la razón, y en la tabla su error estándar, 0,5663, es el menor.",
            "Frente a la media muestral, la razón gana: $r = 0{,}9616$ supera el umbral $0{,}4776$, y su error estándar, 0,5640, es menos de la tercera parte del de la expansión, 2,0094.",
            "Como la constante, $-0{,}16$, no es significativa ($p = 0{,}89$), la recta pasa exactamente por el origen, y por eso el estimador de razón es insesgado.",
            "Como $\\hat B = 2{,}464$ y $\\hat b_1 = 2{,}481$ casi coinciden, el estimador de diferencia serviría igual.",
            "La constante de la recta libre, $-0{,}16$ con $p = 0{,}89$, no se distingue de cero: es defendible que la recta pase por el origen."
          ]
        },
        {
          "n": 18,
          "etiqueta": "cap. 3 · mód. 7 · Una fórmula, cuatro estimadores",
          "enunciado": "<p>Expansión, razón, regresión y diferencia son la misma fórmula, $\\hat{\\bar y}(b) = \\bar y + b\\,(\\bar x_U - \\bar x)$, con cuatro valores de $b$, y $V(b)$ es una parábola con su mínimo en $b_1$. Asigna a cada afirmación el estimador del que es cierta; alguno se repite.</p>",
          "tipo": "emparejar",
          "filas": [
            "No mira la auxiliar: su $b$ vale 0.",
            "Con la pendiente poblacional conocida, ninguno de los otros tres tiene menos varianza que él.",
            "Le gana a la diferencia si y solo si $b_1$ queda más cerca de $B$ que de 1.",
            "Supone que la recta pasa por el origen.",
            "Le gana a la razón si y solo si $b_1$ queda más cerca de 1 que de $B$."
          ],
          "elecciones": [
            "Expansión",
            "Razón",
            "Regresión",
            "Diferencia"
          ]
        }
      ]
    };
    // [fin · simulacro del quiz]
