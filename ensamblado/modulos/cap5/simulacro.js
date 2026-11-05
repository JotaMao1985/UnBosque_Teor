    // ================================================================
    // Simulacro del quiz (Módulo 12)
    //
    // Un ensayo del quiz del capítulo 5: un caso de dos etapas, doce
    // preguntas y cincuenta minutos. SE CORRIGE AL ENTREGAR (D4 de
    // quiz_cap5/PLAN_Quiz_Cap5.md): cada cifra se compara con su banda de
    // tolerancia y, si cae en un error frecuente conocido, lo nombra; cada
    // opción trae su retroalimentación. La clave viaja en la página a
    // propósito: el simulacro no es ninguna de las tres versiones del quiz,
    // tiene otro contexto y ninguna de sus claves cae en la banda de las de
    // ellas.
    //
    // Es el motor del módulo 7.13 de Diseño de Experimentos
    // (ensamblado/cap7/simulacro.js, que viene del preparcial del 6.13) con
    // una sola versión y la copia en sessionStorage del simulacro del
    // capítulo 3: lo respondido, el reloj y si ya se corrigió viven en
    // ESTADO_SIMULACRO, fuera del renderizado, así que salir a otro módulo a
    // consultar algo y volver no borra nada y el reloj sigue corriendo, como
    // el del salón; recargar la página en la misma pestaña tampoco.
    //
    // Se engancha al registro SIMULADORES, que loadModule() ya recorre. El
    // CSS gemelo está en ensamblado/modulos/cap5/simulacro.css; los dos los
    // inserta ensamblado/ensambla_cap5.py.
    //
    // SIMULACROS['id'] = { minutos, titulo, etapas, versiones: [{ numero,
    // caso, preguntas: [{ n, etapa, etiqueta, tipo, enunciado, ... }] }] } lo
    // escribe quiz_cap5/codigo/exporta_simulacro.py, fuera del repositorio.
    // Una pregunta 'numero' trae { clave: { valor, tol, texto }, cuenta,
    // rutas: [{ valor, cifra, texto }] }; una 'opcion', { opciones: [{ texto,
    // retro }], correcta }.
    // ================================================================
    const SIMULACROS = {};
    const ESTADO_SIMULACRO = {};
    const LETRAS_SIMULACRO = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    function estadoNuevoSimulacro(prep, version) {
      return {
        respuestas: version.preguntas.map(pr => pr.tipo === 'numero' ? '' : []),
        finAt: null,
        restante: prep.minutos * 60,
        corregido: false,
        usados: 0
      };
    }

    // La copia en sessionStorage. Solo se acepta si tiene la forma de ESTE
    // registro: una copia de una versión anterior del simulacro se descarta en
    // silencio. Si el navegador no deja guardar, todo funciona igual, sin copia.
    function leeSimulacro(id, prep) {
      try {
        const e = JSON.parse(sessionStorage.getItem(`simulacro:${id}`) || 'null');
        const pr = prep.versiones[0].preguntas;
        const forma = e && Array.isArray(e.respuestas) && e.respuestas.length === pr.length &&
          e.respuestas.every((r, i) => (pr[i].tipo === 'numero'
            ? typeof r === 'string'
            : Array.isArray(r) && r.every(j => Number.isInteger(j) && j >= 0 && j < pr[i].opciones.length))) &&
          (e.finAt === null || typeof e.finAt === 'number') && typeof e.restante === 'number' &&
          e.restante >= 0 && e.restante <= prep.minutos * 60 && Number.isInteger(e.restante) &&
          typeof e.corregido === 'boolean' && Number.isInteger(e.usados) &&
          e.usados >= 0 && e.usados <= prep.minutos * 60 &&
          e.respuestas.every((r, i) => pr[i].tipo === 'numero' || r.length <= 1);
        return forma ? e : null;
      } catch (err) {
        return null;
      }
    }
    function guardaSimulacro(id, estado) {
      try {
        sessionStorage.setItem(`simulacro:${id}`, JSON.stringify(estado));
      } catch (err) {
        // Sin almacenamiento (ventana privada, cuota, bloqueo): queda la copia en memoria.
      }
    }

    SIMULADORES['cap5-simulacro'] = function (raiz) {
      const id = raiz.dataset.simulador;
      const prep = SIMULACROS[id];
      if (!prep) {
        console.warn(`Simulacro no registrado: ${id}`);
        return [];
      }
      if (!ESTADO_SIMULACRO[id]) {
        ESTADO_SIMULACRO[id] = leeSimulacro(id, prep) || estadoNuevoSimulacro(prep, prep.versiones[0]);
      }
      const estado = ESTADO_SIMULACRO[id];
      // Si el tiempo se acabó mientras se estaba en otro módulo (o con la
      // página cerrada), se entra con el reloj ya en cero, no corriendo.
      if (estado.finAt !== null && estado.finAt <= Date.now()) {
        estado.finAt = null;
        estado.restante = 0;
      }
      return pintarSimulacro(raiz, prep, prep.versiones[0], estado, () => guardaSimulacro(id, estado));
    };

    // Lo que teclea el estudiante: punto o coma decimal y signo «-» o «−». Un
    // espacio DENTRO de la cifra es un separador de miles, y en el quiz no se
    // acepta: aquí tampoco. Con punto Y coma a la vez no se adivina cuál es el
    // de miles. En los dos casos se devuelve NaN y la corrección lo dice. Lo
    // demás, como la expresión regular de Brightspace (regex_numerico.banda,
    // hasta 4 decimales): sin punto final ni más decimales, que el quiz rechaza
    // y aquí se aceptaban (CO-4 de la ronda 1).
    const DECIMALES_SIMULACRO = 4;
    function leeCifraSimulacro(s) {
      let t = String(s).trim().replace(/^[−–]\s*/, '-').replace(/^\+\s*/, '');
      if (t === '') return null;
      if (t.includes('.') && t.includes(',')) return NaN;
      t = t.replace(',', '.');
      if (!/^-?(\d+(\.\d+)?|\.\d+)$/.test(t)) return NaN;
      if (/^-?0\d/.test(t)) return NaN;           // un cero a la izquierda («07»): la regex de Brightspace lo rechaza (R2CV-4)
      if ((t.split('.')[1] || '').length > DECIMALES_SIMULACRO) return NaN;
      return parseFloat(t);
    }
    // La holgura del binario, como la de la regex: |51,408 − 51| = 0,40799999… quedaba fuera de 0,408.
    const dentroDeBanda = (x, clave) => Math.abs(x - clave.valor) <= clave.tol + 1e-9;

    function pintarSimulacro(raiz, prep, v, est, guarda) {
      const caso = raiz.querySelector('.simulacro-caso');
      const contenedor = raiz.querySelector('.simulacro-preguntas');
      const conteo = raiz.querySelector('.simulacro-conteo');
      const resumen = raiz.querySelector('.simulacro-resumen');
      const nota = raiz.querySelector('.simulacro-nota');
      const reloj = raiz.querySelector('.simulacro-reloj');
      const empezar = raiz.querySelector('.simulacro-empezar');
      const entregar = raiz.querySelector('.simulacro-entregar');
      const borrar = raiz.querySelector('.simulacro-borrar');
      // Al final de las doce, otro «Entregar» con el reloj: los de arriba quedaban a 8 700 px (VI-1).
      const entregarFinal = raiz.querySelector('.simulacro-entregar-final');
      const relojFinal = raiz.querySelector('.simulacro-reloj-final');
      const L = LETRAS_SIMULACRO;
      let listas = [];
      let casillas = [];
      let cajas = [];
      let tic = null;

      const vacia = r => (Array.isArray(r) ? r.length === 0 : r.trim() === '');

      // --- Las preguntas ------------------------------------------------
      function pinta() {
        caso.innerHTML = v.caso;
        contenedor.innerHTML = '';
        listas = []; casillas = []; cajas = [];

        v.preguntas.forEach((pr, i) => {
          const caja = document.createElement('div');
          caja.className = 'simulacro-pregunta';
          caja.innerHTML = `<span class="simulacro-etiqueta">${pr.n}. ${pr.etiqueta}</span>` +
            `<div class="simulacro-enunciado">${pr.enunciado}</div>`;
          if (pr.tipo === 'numero') {
            const fila = document.createElement('label');
            fila.className = 'simulacro-respuesta';
            fila.innerHTML = '<span>Respuesta</span>';
            const casilla = document.createElement('input');
            // Teclado de texto, no `inputMode = 'decimal'`: en un teléfono con
            // la región en inglés ese teclado no trae la coma, y aquí valen las
            // dos, como en Brightspace.
            casilla.type = 'text';
            casilla.autocomplete = 'off';
            casilla.spellcheck = false;
            casilla.className = 'simulacro-numero';
            casilla.setAttribute('aria-label', `Respuesta de la pregunta ${pr.n}`);
            casilla.value = est.respuestas[i];
            casilla.oninput = () => {
              est.respuestas[i] = casilla.value;
              pintaConteo();
            };
            fila.appendChild(casilla);
            caja.appendChild(fila);
            casillas[i] = casilla;
          } else {
            const lista = document.createElement('div');
            lista.className = 'simulacro-opciones';
            lista.setAttribute('role', 'group');
            lista.setAttribute('aria-label', `Opciones de la pregunta ${pr.n}`);
            pr.opciones.forEach((op, j) => {
              const b = document.createElement('button');
              b.type = 'button';
              b.className = 'simulacro-opcion';
              b.innerHTML = `<span class="simulacro-letra">${L[j]})</span><span>${op.texto}</span>`;
              b.onclick = () => {
                if (est.corregido) return;
                est.respuestas[i] = est.respuestas[i].includes(j) ? [] : [j];
                pintaOpciones(i);
                pintaConteo();
              };
              lista.appendChild(b);
            });
            caja.appendChild(lista);
            listas[i] = lista;
          }
          contenedor.appendChild(caja);
          cajas[i] = caja;
          if (listas[i]) pintaOpciones(i);
        });

        if (est.corregido) corrige();
        else nota.textContent = '';
        if (est.finAt !== null) arranca();
        pintaReloj();
        pintaConteo();
      }

      function pintaOpciones(i) {
        listas[i].querySelectorAll('.simulacro-opcion').forEach((o, j) => {
          const marcada = est.respuestas[i].includes(j);
          o.classList.toggle('marcada', marcada);
          o.setAttribute('aria-pressed', marcada ? 'true' : 'false');
        });
      }

      // Lo tecleado entra en el resumen como TEXTO, nunca como HTML: es lo
      // único de la página que escribe el estudiante. Va en <code>, que KaTeX
      // no toca.
      function pintaConteo() {
        const hechas = est.respuestas.filter(r => !vacia(r)).length;
        conteo.textContent = (segundos() === 0 && !est.corregido ? 'Se acabó el tiempo · ' : '') +
          `${hechas} de ${v.preguntas.length} respondidas`;
        resumen.textContent = 'Tus respuestas: ';
        v.preguntas.forEach((pr, i) => {
          const r = est.respuestas[i];
          const c = document.createElement('code');
          c.textContent = `${pr.n}: ` + (vacia(r) ? '—'
            : Array.isArray(r) ? r.map(j => L[j]).join('') : r.trim());
          if (i) resumen.appendChild(document.createTextNode(' · '));
          resumen.appendChild(c);
        });
        resumen.appendChild(document.createTextNode('.'));
        [entregar, entregarFinal].forEach(b => {
          b.disabled = est.corregido;
          b.textContent = est.corregido ? 'Corregido' : 'Entregar y corregir';
        });
        guarda();
      }

      // --- La corrección -------------------------------------------------
      // Devuelve 'acierto', 'fallo' o 'vacia', y escribe la retroalimentación
      // debajo de la pregunta. Lo que tecleó el estudiante entra como texto.
      // Lo que tecleó el estudiante va en un <code>: KaTeX no lo toca al volver al módulo («$x$» se
      // volvía una fórmula dentro de la corrección, CO-12 de la ronda 1).
      function suyo(texto) {
        const c = document.createElement('code');
        c.textContent = texto;
        return c;
      }
      function veredicto(pr, r, caja) {
        const retro = document.createElement('div');
        retro.className = 'simulacro-retro';
        const cabeza = document.createElement('p');
        cabeza.className = 'simulacro-veredicto';
        retro.appendChild(cabeza);
        let resultado;

        if (pr.tipo === 'numero') {
          const x = leeCifraSimulacro(r);
          if (x === null) {
            resultado = 'vacia';
            cabeza.textContent = `Sin responder. La respuesta es ${pr.clave.texto}.`;
          } else if (Number.isNaN(x)) {
            resultado = 'fallo';
            const crudo = String(r).trim();
            const miles = /^[−–-]?\d{1,3}([.,\s  ]\d{3})+$/.test(crudo);
            const seguido = leeCifraSimulacro(crudo.replace(/[.,\s  ]/g, ''));
            const decimales = /^[−–-]?\d*[.,]\d{5,}$/.test(crudo);
            const motivo = miles
              ? ' lleva separador de miles, y en el quiz no se acepta: escribe la cifra seguida. ' +
                (seguido !== null && dentroDeBanda(seguido, pr.clave) ? 'Sin el separador, sería la correcta. ' : '')
              : decimales
                ? ` lleva más de ${DECIMALES_SIMULACRO} decimales, y en el quiz no se acepta: escribe los que pide la pregunta. `
                : ' no se lee como una cifra. ';
            cabeza.append('«', suyo(crudo), '»' + motivo + `La respuesta es ${pr.clave.texto}.`);
          } else if (dentroDeBanda(x, pr.clave)) {
            resultado = 'acierto';
            cabeza.append('Correcto: ', suyo(String(r).trim()), `. La respuesta es ${pr.clave.texto}.`);
          } else {
            resultado = 'fallo';
            cabeza.append('Tu respuesta, ', suyo(String(r).trim()),
              `, no es la correcta. La respuesta es ${pr.clave.texto}.`);
            const ruta = pr.rutas.find(rt => dentroDeBanda(x, { valor: rt.valor, tol: pr.clave.tol }));
            // El separador de miles solo se confunde en claves de miles (CO-12: en claves pequeñas avisaba sin sentido).
            const miles = pr.clave.valor >= 1000 && Math.abs(x * 1000 - pr.clave.valor) <= pr.clave.tol;
            if (ruta || miles) {
              // El texto de la ruta es del registro, no del estudiante: lleva
              // subíndices y entra como HTML.
              const aviso = document.createElement('p');
              aviso.className = 'simulacro-aviso';
              aviso.innerHTML = ruta
                ? `Esa cifra coincide con un error frecuente: ${ruta.texto}.`
                : 'Tu cifra es la clave dividida entre mil: parece que usaste un separador de miles.';
              retro.appendChild(aviso);
            }
          }
          const cuenta = document.createElement('p');
          cuenta.innerHTML = pr.cuenta;
          retro.appendChild(cuenta);
          if (pr.rutas.length) {
            const errores = document.createElement('p');
            errores.className = 'simulacro-errores';
            errores.innerHTML = 'Errores frecuentes: ' +
              pr.rutas.map(rt => `si obtuvo ${rt.cifra}, ${rt.texto}`).join('; ') + '.';
            retro.appendChild(errores);
          }
        } else {
          const elegida = r.length ? r[0] : null;
          if (elegida === null) {
            resultado = 'vacia';
            cabeza.textContent = `Sin responder. La correcta es la ${L[pr.correcta]}).`;
          } else if (elegida === pr.correcta) {
            resultado = 'acierto';
            cabeza.textContent = `Correcto: la ${L[pr.correcta]}).`;
          } else {
            resultado = 'fallo';
            cabeza.textContent = `Marcaste la ${L[elegida]}); la correcta es la ${L[pr.correcta]}).`;
            const suya = document.createElement('p');
            suya.innerHTML = `<b>${L[elegida]})</b> ${pr.opciones[elegida].retro}`;
            retro.appendChild(suya);
          }
          const buena = document.createElement('p');
          buena.innerHTML = `<b>${L[pr.correcta]})</b> ${pr.opciones[pr.correcta].retro}`;
          retro.appendChild(buena);
        }
        caja.appendChild(retro);
        return resultado;
      }

      function corrige() {
        const cuenta = { acierto: 0, fallo: 0, vacia: 0 };
        const porEtapa = {};
        v.preguntas.forEach((pr, i) => {
          const caja = cajas[i];
          caja.querySelectorAll('.simulacro-retro').forEach(n => n.remove());
          const res = veredicto(pr, est.respuestas[i], caja);
          cuenta[res] += 1;
          caja.classList.remove('acierto', 'fallo', 'vacia');
          caja.classList.add(res);
          porEtapa[pr.etapa] = porEtapa[pr.etapa] || [0, 0];
          porEtapa[pr.etapa][1] += 1;
          if (res === 'acierto') porEtapa[pr.etapa][0] += 1;
          if (casillas[i]) casillas[i].disabled = true;
          if (listas[i]) {
            listas[i].querySelectorAll('.simulacro-opcion').forEach((o, j) => {
              o.disabled = true;
              o.classList.toggle('correcta', j === pr.correcta);
              o.classList.toggle('equivocada', est.respuestas[i].includes(j) && j !== pr.correcta);
            });
          }
        });
        const usados = est.usados;
        const nombreEtapa = e => (prep.etapas && prep.etapas[e]) || `etapa ${e}`;
        const etapas = Object.keys(porEtapa).sort()
          .map(e => `${nombreEtapa(e)}: ${porEtapa[e][0]} de ${porEtapa[e][1]}`).join(' · ');
        // Sin el reloj en marcha no hay tiempo que contar: «0 min 00 s» confundía (R2CV-10).
        nota.textContent = `Simulacro: ${cuenta.acierto} de ${v.preguntas.length} correctas ` +
          `(${etapas})` + (cuenta.vacia ? `, ${cuenta.vacia} sin responder` : '') + '.' +
          (usados > 0 ? ` Tiempo usado: ${Math.floor(usados / 60)} min ${String(usados % 60).padStart(2, '0')} s.` : '');
      }

      entregar.onclick = entregarFinal.onclick = () => {
        if (est.corregido) return;
        if (est.finAt !== null) {
          est.restante = segundos();
          est.finAt = null;
        }
        para();
        est.usados = prep.minutos * 60 - est.restante;
        est.corregido = true;
        corrige();
        pintaReloj();
        pintaConteo();
        nota.scrollIntoView({ block: 'nearest' });
      };

      // --- El reloj ------------------------------------------------------
      // `finAt` es la hora en que se acaba y manda mientras corre;
      // `restante` solo guarda los segundos cuando está pausado.
      function para() {
        if (tic !== null) { clearInterval(tic); tic = null; }
      }
      function segundos() {
        return est.finAt === null
          ? est.restante
          : Math.max(0, Math.round((est.finAt - Date.now()) / 1000));
      }
      // A 0:00 el botón no dice «Seguir»: lo que hace es darle al reloj otros
      // cincuenta minutos, y lo respondido se queda.
      function pintaReloj() {
        const s = segundos();
        [reloj, relojFinal].forEach(r => {
          r.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
          r.classList.toggle('acabado', s === 0);
        });
        empezar.disabled = est.corregido;
        empezar.textContent = est.corregido ? 'Reloj detenido'
          : est.finAt !== null ? 'Pausar'
          : s === prep.minutos * 60 ? `Empezar los ${prep.minutos} minutos`
          : s === 0 ? `Reiniciar el reloj (${prep.minutos} min)` : 'Seguir';
      }
      function arranca() {
        para();
        tic = setInterval(() => {
          if (segundos() === 0) {
            est.finAt = null;
            est.restante = 0;
            para();
            pintaConteo();                    // «Se acabó el tiempo», y se guarda
          }
          pintaReloj();
        }, 250);
      }
      empezar.onclick = () => {
        if (est.corregido) return;
        if (est.finAt !== null) {          // corriendo: se pausa
          est.restante = segundos();
          est.finAt = null;
          para();
        } else {
          if (est.restante === 0) est.restante = prep.minutos * 60;
          est.finAt = Date.now() + est.restante * 1000;
          arranca();
        }
        pintaReloj();
        pintaConteo();
      };

      // Borrar tira hasta cincuenta minutos de trabajo, así que con algo
      // respondido, con el reloj movido o ya corregido pide un segundo clic. No
      // usa confirm(): hay navegadores y marcos que lo bloquean, y entonces el
      // botón no borraría nunca.
      // Un doble clic son dos clics en unos cientos de milisegundos: el segundo no puede confirmar, o el
      // doble clic borraba todo sin dejar leer «¿Borrar todo?» (CO-1 de la ronda 1).
      let armado = null;
      let armadoEn = 0;
      function desarma() {
        if (armado !== null) { clearTimeout(armado); armado = null; }
        borrar.textContent = 'Borrar';
      }
      function hayAlgo() {
        return est.corregido || est.finAt !== null || est.restante !== prep.minutos * 60 ||
          est.respuestas.some(r => !vacia(r));
      }
      borrar.onclick = () => {
        if (armado === null && hayAlgo()) {
          borrar.textContent = '¿Borrar todo? Pulsa otra vez';
          armado = setTimeout(desarma, 4000);
          armadoEn = Date.now();
          return;
        }
        if (armado !== null && Date.now() - armadoEn < 600) return;
        desarma();
        para();
        Object.assign(est, estadoNuevoSimulacro(prep, v));
        v.preguntas.forEach((pr, i) => cajas[i].classList.remove('acierto', 'fallo', 'vacia'));
        pinta();
      };

      pinta();
      // Lo que devuelve un simulador son los objetos que destruirSimuladores()
      // apaga al cambiar de módulo. Aquí no hay gráficos: lo que hay que apagar
      // son el intervalo del reloj y la espera del segundo clic de Borrar.
      return [{ destroy: () => { para(); desarma(); } }];
    }

    // [inicio · simulacro del quiz]
    // ================================================================
    // Simulacro del quiz (Módulo 12) · CON clave: se corrige al entregar
    //
    // NO SE EDITA A MANO: lo escribe quiz_cap5/codigo/exporta_simulacro.py,
    // fuera del repositorio, con el mismo generador que arma las tres
    // versiones del quiz. La clave viaja aquí a propósito (D4 de
    // PLAN_Quiz_Cap5.md): el simulacro no es ninguna de esas versiones, tiene
    // otro contexto, y ninguna de sus claves cae en la banda de las de ellas.
    // ================================================================
    SIMULACROS['cap5-simulacro'] = {
     "minutos": 50,
     "titulo": "Simulacro del quiz · capítulo 5",
     "etapas": {
      "1": "la encuesta de las veredas, 1 a 7",
      "2": "otras situaciones, 8 a 12"
     },
     "versiones": [
      {
       "numero": 0,
       "caso": "<h3>Leche por veredas — Simulacro</h3>\n<p>Una cooperativa lechera quiere estimar la <b>producción de leche de los predios</b> de una zona rural, en litros al\ndía. La zona tiene <b>N = 36 veredas</b>. Se sortearon <b>n = 6 veredas por MAS</b> y, dentro de cada una,\nm<sub>i</sub> de sus M<sub>i</sub> predios, también por MAS. La tabla da, para cada vereda sorteada, cuántos predios tiene\n(M<sub>i</sub>), cuántos se encuestaron (m<sub>i</sub>) y la producción media de los encuestados (ȳ<sub>i</sub>), en\nlitros al día.</p>\n<table style=\"border-collapse:collapse;margin:6px 0 12px 0;font-size:95%\"><thead><tr><th style=\"border:1px solid #999;padding:3px 8px;background:#eef\">Vereda</th><th style=\"border:1px solid #999;padding:3px 8px;background:#eef\">M<sub>i</sub></th><th style=\"border:1px solid #999;padding:3px 8px;background:#eef\">m<sub>i</sub></th><th style=\"border:1px solid #999;padding:3px 8px;background:#eef\">ȳ<sub>i</sub> (L/día)</th></tr></thead><tbody><tr><td style=\"border:1px solid #999;padding:3px 8px;text-align:right\">3</td><td style=\"border:1px solid #999;padding:3px 8px;text-align:right\">40</td><td style=\"border:1px solid #999;padding:3px 8px;text-align:right\">6</td><td style=\"border:1px solid #999;padding:3px 8px;text-align:right\">36,3</td></tr><tr><td style=\"border:1px solid #999;padding:3px 8px;text-align:right\">14</td><td style=\"border:1px solid #999;padding:3px 8px;text-align:right\">15</td><td style=\"border:1px solid #999;padding:3px 8px;text-align:right\">5</td><td style=\"border:1px solid #999;padding:3px 8px;text-align:right\">74,8</td></tr><tr><td style=\"border:1px solid #999;padding:3px 8px;text-align:right\">20</td><td style=\"border:1px solid #999;padding:3px 8px;text-align:right\">13</td><td style=\"border:1px solid #999;padding:3px 8px;text-align:right\">6</td><td style=\"border:1px solid #999;padding:3px 8px;text-align:right\">81,2</td></tr><tr><td style=\"border:1px solid #999;padding:3px 8px;text-align:right\">28</td><td style=\"border:1px solid #999;padding:3px 8px;text-align:right\">34</td><td style=\"border:1px solid #999;padding:3px 8px;text-align:right\">4</td><td style=\"border:1px solid #999;padding:3px 8px;text-align:right\">37,7</td></tr><tr><td style=\"border:1px solid #999;padding:3px 8px;text-align:right\">31</td><td style=\"border:1px solid #999;padding:3px 8px;text-align:right\">16</td><td style=\"border:1px solid #999;padding:3px 8px;text-align:right\">6</td><td style=\"border:1px solid #999;padding:3px 8px;text-align:right\">92,9</td></tr><tr><td style=\"border:1px solid #999;padding:3px 8px;text-align:right\">35</td><td style=\"border:1px solid #999;padding:3px 8px;text-align:right\">26</td><td style=\"border:1px solid #999;padding:3px 8px;text-align:right\">5</td><td style=\"border:1px solid #999;padding:3px 8px;text-align:right\">47,0</td></tr></tbody></table>\n<p>Las preguntas 1 a 5 usan esta tabla; la 6 y la 7, el plan de la encuesta del año siguiente; de la 8 a la 12, otras\nsituaciones. La 3 y la 4 usan los totales de vereda t̂<sub>i</sub> = M<sub>i</sub>ȳ<sub>i</sub> que salen de la tabla, los\nmismos de la 2. En las de cifra, escriba <b>solo el número</b>, sin unidades, con los decimales que pida su pregunta,\ncon punto o con coma como separador decimal y <b>sin separar los miles</b>. En el quiz de Brightspace se ve una pregunta por página, no se\npuede volver a la anterior y cada pregunta trae las cifras que necesita.</p>",
       "preguntas": [
        {
         "n": 1,
         "etapa": "1",
         "etiqueta": "cap. 5 · mód. 2 · El peso de un predio",
         "tipo": "numero",
         "enunciado": "<p>En la zona de N = 36 veredas se sortearon n = 6 por MAS. En la vereda 28, que tiene M<sub>i</sub> = 34 predios, se encuestaron m<sub>i</sub> = 4, también por MAS. ¿Qué peso de muestreo w<sub>k</sub> lleva cada predio encuestado en esa vereda? Responda con dos decimales.</p>",
         "clave": {
          "valor": 51.0,
          "tol": 0.408,
          "texto": "51,00"
         },
         "cuenta": "El peso es el inverso de π<sub>k</sub> = (n/N)·(m<sub>i</sub>/M<sub>i</sub>) = (6/36)·(4/34): w<sub>k</sub> = (N/n)·(M<sub>i</sub>/m<sub>i</sub>) = 6·8,50 = 51,00. Cada predio encuestado de la vereda 28 representa a 51,00 predios de la zona (módulo 2).",
         "rutas": [
          {
           "valor": 6.0,
           "cifra": "6,00",
           "texto": "usó solo N/n, el factor de expansión de la primera etapa"
          },
          {
           "valor": 8.5,
           "cifra": "8,50",
           "texto": "usó solo M<sub>i</sub>/m<sub>i</sub>, el de la segunda"
          },
          {
           "valor": 0.705882,
           "cifra": "0,71",
           "texto": "invirtió el cociente de la segunda etapa"
          },
          {
           "valor": 14.5,
           "cifra": "14,50",
           "texto": "sumó los dos factores en vez de multiplicarlos"
          },
          {
           "valor": 306.0,
           "cifra": "306,00",
           "texto": "multiplicó por N sin dividir entre n"
          }
         ]
        },
        {
         "n": 2,
         "etapa": "1",
         "etiqueta": "cap. 5 · mód. 6 · El total en dos etapas",
         "tipo": "numero",
         "enunciado": "<p>Con los datos de la tabla del encabezado, estime la producción total de leche de la zona, t̂, con el estimador insesgado de dos etapas. La respuesta va en litros al día: escriba solo el número, redondeado al entero.</p>",
         "clave": {
          "valor": 45718.8,
          "tol": 365.7504,
          "texto": "45719"
         },
         "cuenta": "Cada vereda se expande a su total, t̂<sub>i</sub> = M<sub>i</sub>ȳ<sub>i</sub>: 40·36,3 = 1452,0; 15·74,8 = 1122,0; 13·81,2 = 1055,6; 34·37,7 = 1281,8; 16·92,9 = 1486,4; 26·47,0 = 1222,0. Su suma es 7619,8, y la primera etapa expande por N/n = 36/6 = 6: t̂ = 6·7619,8 = 45 718,8 litros al día (módulo 6).",
         "rutas": [
          {
           "valor": 7619.8,
           "cifra": "7620",
           "texto": "olvidó expandir por N/n"
          },
          {
           "valor": 12133.2,
           "cifra": "12 133",
           "texto": "multiplicó por los predios encuestados m<sub>i</sub> en vez de por los M<sub>i</sub>"
          },
          {
           "valor": 274312.8,
           "cifra": "274 313",
           "texto": "expandió por N en vez de por N/n"
          },
          {
           "valor": 53265.6,
           "cifra": "53 266",
           "texto": "multiplicó el promedio simple de las ȳ<sub>i</sub> por el total estimado de predios"
          }
         ]
        },
        {
         "n": 3,
         "etapa": "1",
         "etiqueta": "cap. 5 · mód. 5 · La media por predio con la razón",
         "tipo": "numero",
         "enunciado": "<p>Con los t̂<sub>i</sub> = M<sub>i</sub>ȳ<sub>i</sub> de la tabla del encabezado, estime la producción media <b>por predio</b> de la zona con el estimador de razón, con los M<sub>i</sub> como variable auxiliar. Responda con dos decimales.</p>",
         "clave": {
          "valor": 52.915278,
          "tol": 0.423322,
          "texto": "52,92"
         },
         "cuenta": "ȳ̂<sub>r</sub> = Σt̂<sub>i</sub> / ΣM<sub>i</sub> = 7619,8 / 144 = 52,92 litros por predio: cada vereda pesa por los predios que tiene (módulo 5).",
         "rutas": [
          {
           "valor": 61.65,
           "cifra": "61,65",
           "texto": "promedió las seis ȳ<sub>i</sub> sin ponderar"
          },
          {
           "valor": 63.19375,
           "cifra": "63,19",
           "texto": "ponderó cada vereda por sus predios encuestados m<sub>i</sub>"
          },
          {
           "valor": 238.11875,
           "cifra": "238,12",
           "texto": "dividió Σt̂<sub>i</sub> entre los predios encuestados, no entre los M<sub>i</sub>"
          }
         ]
        },
        {
         "n": 4,
         "etapa": "1",
         "etiqueta": "cap. 5 · mód. 7 · El atajo del conglomerado último",
         "tipo": "numero",
         "enunciado": "<p>Con los t̂<sub>i</sub> = M<sub>i</sub>ȳ<sub>i</sub> de la tabla del encabezado, estime el error estándar de t̂ con el atajo del conglomerado último: los t̂<sub>i</sub> como una sola etapa, con la corrección por población finita de la primera (n = 6 de N = 36 veredas). La respuesta va en litros al día: escriba solo el número, redondeado al entero.</p>",
         "clave": {
          "valor": 2325.861544,
          "tol": 18.606892,
          "texto": "2326"
         },
         "cuenta": "La media de los t̂<sub>i</sub> es 1269,97 y s<sub>t</sub>² = Σ(t̂<sub>i</sub> − t̄)²/(n − 1) = 30 053,5. El atajo es la raíz del primer sumando: N²(1 − n/N)s<sub>t</sub>²/n = 36²·(1 − 6/36)·30 053,5/6 = 5 409 632, cuya raíz es 2325,9 litros. Con las dos etapas completas sería 2431: el primer sumando ya recoge buena parte de la segunda etapa (módulos 6 y 7).",
         "rutas": [
          {
           "valor": 2547.853666,
           "cifra": "2548",
           "texto": "omitió la corrección por población finita, como hacen casi todos los programas (Lohr, ec. 5.29), y la pregunta la pedía"
          },
          {
           "valor": 2123.211388,
           "cifra": "2123",
           "texto": "calculó la desviación de los t̂<sub>i</sub> con divisor n"
          },
          {
           "valor": 387.643591,
           "cifra": "388",
           "texto": "expandió por N/n en vez de por N"
          },
          {
           "valor": 5409631.92,
           "cifra": "5 409 632",
           "texto": "entregó la varianza, sin la raíz"
          }
         ]
        },
        {
         "n": 5,
         "etapa": "1",
         "etiqueta": "cap. 5 · mód. 5 · Cuándo coinciden la razón y la media ingenua",
         "tipo": "opcion",
         "enunciado": "<p>Con los datos de la tabla del encabezado, la razón y el promedio simple de las seis ȳ<sub>i</sub> dan cifras distintas. ¿En cuál de estas situaciones estimarían los dos el mismo parámetro?</p>",
         "opciones": [
          {
           "texto": "Si se encuestara el mismo número m<sub>i</sub> de predios en cada vereda, sean grandes o chicas.",
           "retro": "Lo que pesa en la razón son los M<sub>i</sub> predios de cada vereda, no los m<sub>i</sub> encuestados: con el mismo m<sub>i</sub> en todas, la razón y el promedio simple seguirían estimando cosas distintas (módulo 5)."
          },
          {
           "texto": "Si se sortearan muchas más veredas: con más datos, la diferencia se achica.",
           "retro": "La diferencia no es azar: son dos parámetros distintos, y con más veredas cada estimador se acerca al suyo. Es el «n grande no salva» del capítulo 1, en versión conglomerados (módulo 5)."
          },
          {
           "texto": "Si la producción media por predio no cambiara con el tamaño de la vereda.",
           "retro": "La razón pesa cada vereda por sus M<sub>i</sub> predios y el promedio simple pesa igual a todas. Si la producción por predio no dependiera del tamaño de la vereda (o si todas tuvieran los mismos predios), los dos parámetros serían el mismo. Aquí las veredas grandes producen menos por predio, y por eso difieren: 52,92 frente a 61,65 litros (módulo 5)."
          },
          {
           "texto": "En ninguna: los dos estiman parámetros distintos sean cuales sean los datos.",
           "retro": "Si la producción por predio no dependiera del tamaño de la vereda, o si todas tuvieran los mismos predios, la media de las medias de vereda y la media por predio serían el mismo número (módulo 5)."
          }
         ],
         "correcta": 2
        },
        {
         "n": 6,
         "etapa": "1",
         "etiqueta": "cap. 5 · mód. 4 · El efecto de diseño de veredas enteras",
         "tipo": "numero",
         "enunciado": "<p>Para el año siguiente, la cooperativa evalúa encuestar <b>todos</b> los predios de cada vereda sorteada. Las veredas de la zona tienen en promedio M̄ = 18 predios, y un estudio anterior da ρ = 0,15 para la producción de leche. Con la aproximación de Kish, ¿qué efecto de diseño (deff) tendría frente a un MAS del mismo número de predios? Responda con dos decimales.</p>",
         "clave": {
          "valor": 3.55,
          "tol": 0.0284,
          "texto": "3,55"
         },
         "cuenta": "deff ≈ 1 + (M̄ − 1)ρ = 1 + 17·0,15 = 3,55: con veredas enteras, cada predio encuestado vale lo que 0,28 predios de un MAS (módulo 4).",
         "rutas": [
          {
           "valor": 3.7,
           "cifra": "3,70",
           "texto": "usó M̄ en vez de M̄ − 1"
          },
          {
           "valor": 2.55,
           "cifra": "2,55",
           "texto": "olvidó sumar el 1"
          },
          {
           "valor": 1.3825,
           "cifra": "1,38",
           "texto": "elevó ρ al cuadrado"
          },
          {
           "valor": 0.28169,
           "cifra": "0,28",
           "texto": "invirtió la fórmula"
          }
         ]
        },
        {
         "n": 7,
         "etapa": "1",
         "etiqueta": "cap. 5 · mód. 8 · El tamaño de submuestra óptimo",
         "tipo": "numero",
         "enunciado": "<p>Si en cambio se encuestan m predios por vereda, llegar a una vereda cuesta c<sub>1</sub> = $120 000 (transporte y guía) y encuestar cada predio, c<sub>2</sub> = $5000. Con la misma ρ = 0,15, ¿cuántos predios por vereda minimizan la varianza con un presupuesto fijo (m<sub>opt</sub>)? Responda con un decimal.</p>",
         "clave": {
          "valor": 11.661904,
          "tol": 0.093295,
          "texto": "11,7"
         },
         "cuenta": "m<sub>opt</sub> = √[(c<sub>1</sub>/c<sub>2</sub>)·(1 − ρ)/ρ] = √[(120/5)·(0,85/0,15)] = √136,00 = 11,66, unos 11,7 predios. El presupuesto decide cuántas veredas, no cuántos predios en cada una (módulo 8).",
         "rutas": [
          {
           "valor": 12.649111,
           "cifra": "12,6",
           "texto": "olvidó el factor 1 − ρ"
          },
          {
           "valor": 136.0,
           "cifra": "136,0",
           "texto": "olvidó la raíz"
          },
          {
           "valor": 0.485913,
           "cifra": "0,5",
           "texto": "invirtió el cociente de costos"
          },
          {
           "valor": 2.057983,
           "cifra": "2,1",
           "texto": "invirtió (1 − ρ)/ρ"
          },
          {
           "valor": 27.760884,
           "cifra": "27,8",
           "texto": "sacó la raíz solo del cociente de costos"
          }
         ]
        },
        {
         "n": 8,
         "etapa": "2",
         "etiqueta": "cap. 5 · mód. 4 · El deff de veredas enteras",
         "tipo": "opcion",
         "enunciado": "<p>Un sondeo previo visitó 8 veredas de otro municipio y, en cada una, 6 predios; registró tres variables por predio. Cada punto de la figura es un predio, en la columna de su vereda; la raya naranja marca el promedio de la vereda y la discontinua, el del sondeo. Si se encuestaran veredas enteras, todas del mismo tamaño, ¿con cuál variable sería mayor el efecto de diseño frente a un MAS de predios?</p><figure class='simulacro-figura'><svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 236 236' role='img' aria-label='Panel del sondeo: Área del predio' data-panel='0' font-family='Montserrat, system-ui, sans-serif' font-size='12'><text x='118' y='16' text-anchor='middle' font-size='13.5' fill='#012820' font-weight='600'>Área del predio</text><rect x='46' y='30' width='182' height='160' fill='none' stroke='#cbd5e1'/><g stroke='#e2e8f0'><line class='grid-y' data-v='5' x1='46' x2='228' y1='176.7' y2='176.7'/><line class='grid-y' data-v='10' x1='46' x2='228' y1='137.5' y2='137.5'/><line class='grid-y' data-v='15' x1='46' x2='228' y1='98.2' y2='98.2'/><line class='grid-y' data-v='20' x1='46' x2='228' y1='59' y2='59'/></g><g fill='#475569' text-anchor='end'><text class='tick-y' data-v='5' x='40' y='180.7'>5</text><text class='tick-y' data-v='10' x='40' y='141.5'>10</text><text class='tick-y' data-v='15' x='40' y='102.2'>15</text><text class='tick-y' data-v='20' x='40' y='63'>20</text></g><text x='14' y='110' text-anchor='middle' fill='#475569' transform='rotate(-90 14 110)'>ha</text><g fill='#475569' text-anchor='middle'><text class='tick-x' data-v='1' x='59.3' y='205'>1</text><text class='tick-x' data-v='2' x='81.5' y='205'>2</text><text class='tick-x' data-v='3' x='103.7' y='205'>3</text><text class='tick-x' data-v='4' x='125.9' y='205'>4</text><text class='tick-x' data-v='5' x='148.1' y='205'>5</text><text class='tick-x' data-v='6' x='170.3' y='205'>6</text><text class='tick-x' data-v='7' x='192.5' y='205'>7</text><text class='tick-x' data-v='8' x='214.7' y='205'>8</text></g><text x='137' y='224' text-anchor='middle' fill='#475569'>Vereda</text><line class='media-general' x1='46' x2='228' y1='111.6' y2='111.6' stroke='#64748b' stroke-width='1.2' stroke-dasharray='5 4'/><g stroke='#EA580C' stroke-width='2.4'><line class='media' data-i='0' x1='52.2' x2='66.4' y1='103.5' y2='103.5'/><line class='media' data-i='1' x1='74.4' x2='88.6' y1='132.2' y2='132.2'/><line class='media' data-i='2' x1='96.6' x2='110.8' y1='124.4' y2='124.4'/><line class='media' data-i='3' x1='118.8' x2='133' y1='119.2' y2='119.2'/><line class='media' data-i='4' x1='141' x2='155.2' y1='107.4' y2='107.4'/><line class='media' data-i='5' x1='163.2' x2='177.4' y1='96.9' y2='96.9'/><line class='media' data-i='6' x1='185.4' x2='199.6' y1='119.2' y2='119.2'/><line class='media' data-i='7' x1='207.6' x2='221.8' y1='90.4' y2='90.4'/></g><g fill-opacity='0.75'><circle class='pt' data-i='0' data-h='0' data-y='12' cx='55.2' cy='121.8' r='3.2' fill='#012820'/><circle class='pt' data-i='0' data-h='1' data-y='11' cx='56.8' cy='129.6' r='3.2' fill='#012820'/><circle class='pt' data-i='0' data-h='2' data-y='15' cx='58.5' cy='98.2' r='3.2' fill='#012820'/><circle class='pt' data-i='0' data-h='3' data-y='16' cx='60.1' cy='90.4' r='3.2' fill='#012820'/><circle class='pt' data-i='0' data-h='4' data-y='18' cx='61.8' cy='74.7' r='3.2' fill='#012820'/><circle class='pt' data-i='0' data-h='5' data-y='14' cx='63.5' cy='106.1' r='3.2' fill='#012820'/><circle class='pt' data-i='1' data-h='0' data-y='5' cx='77.4' cy='176.7' r='3.2' fill='#012820'/><circle class='pt' data-i='1' data-h='1' data-y='7' cx='79' cy='161' r='3.2' fill='#012820'/><circle class='pt' data-i='1' data-h='2' data-y='15' cx='80.7' cy='98.2' r='3.2' fill='#012820'/><circle class='pt' data-i='1' data-h='3' data-y='10' cx='82.3' cy='137.5' r='3.2' fill='#012820'/><circle class='pt' data-i='1' data-h='4' data-y='13' cx='84' cy='113.9' r='3.2' fill='#012820'/><circle class='pt' data-i='1' data-h='5' data-y='14' cx='85.7' cy='106.1' r='3.2' fill='#012820'/><circle class='pt' data-i='2' data-h='0' data-y='17' cx='99.5' cy='82.5' r='3.2' fill='#012820'/><circle class='pt' data-i='2' data-h='1' data-y='6' cx='101.2' cy='168.8' r='3.2' fill='#012820'/><circle class='pt' data-i='2' data-h='2' data-y='18' cx='102.9' cy='74.7' r='3.2' fill='#012820'/><circle class='pt' data-i='2' data-h='3' data-y='9' cx='104.5' cy='145.3' r='3.2' fill='#012820'/><circle class='pt' data-i='2' data-h='4' data-y='13' cx='106.2' cy='113.9' r='3.2' fill='#012820'/><circle class='pt' data-i='2' data-h='5' data-y='7' cx='107.9' cy='161' r='3.2' fill='#012820'/><circle class='pt' data-i='3' data-h='0' data-y='14' cx='121.7' cy='106.1' r='3.2' fill='#012820'/><circle class='pt' data-i='3' data-h='1' data-y='9' cx='123.4' cy='145.3' r='3.2' fill='#012820'/><circle class='pt' data-i='3' data-h='2' data-y='12' cx='125.1' cy='121.8' r='3.2' fill='#012820'/><circle class='pt' data-i='3' data-h='3' data-y='17' cx='126.7' cy='82.5' r='3.2' fill='#012820'/><circle class='pt' data-i='3' data-h='4' data-y='7' cx='128.4' cy='161' r='3.2' fill='#012820'/><circle class='pt' data-i='3' data-h='5' data-y='15' cx='130.1' cy='98.2' r='3.2' fill='#012820'/><circle class='pt' data-i='4' data-h='0' data-y='9' cx='143.9' cy='145.3' r='3.2' fill='#012820'/><circle class='pt' data-i='4' data-h='1' data-y='17' cx='145.6' cy='82.5' r='3.2' fill='#012820'/><circle class='pt' data-i='4' data-h='2' data-y='19' cx='147.3' cy='66.9' r='3.2' fill='#012820'/><circle class='pt' data-i='4' data-h='3' data-y='16' cx='148.9' cy='90.4' r='3.2' fill='#012820'/><circle class='pt' data-i='4' data-h='4' data-y='9' cx='150.6' cy='145.3' r='3.2' fill='#012820'/><circle class='pt' data-i='4' data-h='5' data-y='13' cx='152.3' cy='113.9' r='3.2' fill='#012820'/><circle class='pt' data-i='5' data-h='0' data-y='15' cx='166.1' cy='98.2' r='3.2' fill='#012820'/><circle class='pt' data-i='5' data-h='1' data-y='17' cx='167.8' cy='82.5' r='3.2' fill='#012820'/><circle class='pt' data-i='5' data-h='2' data-y='17' cx='169.5' cy='82.5' r='3.2' fill='#012820'/><circle class='pt' data-i='5' data-h='3' data-y='9' cx='171.1' cy='145.3' r='3.2' fill='#012820'/><circle class='pt' data-i='5' data-h='4' data-y='16' cx='172.8' cy='90.4' r='3.2' fill='#012820'/><circle class='pt' data-i='5' data-h='5' data-y='17' cx='174.5' cy='82.5' r='3.2' fill='#012820'/><circle class='pt' data-i='6' data-h='0' data-y='15' cx='188.3' cy='98.2' r='3.2' fill='#012820'/><circle class='pt' data-i='6' data-h='1' data-y='9' cx='190' cy='145.3' r='3.2' fill='#012820'/><circle class='pt' data-i='6' data-h='2' data-y='8' cx='191.7' cy='153.1' r='3.2' fill='#012820'/><circle class='pt' data-i='6' data-h='3' data-y='12' cx='193.3' cy='121.8' r='3.2' fill='#012820'/><circle class='pt' data-i='6' data-h='4' data-y='16' cx='195' cy='90.4' r='3.2' fill='#012820'/><circle class='pt' data-i='6' data-h='5' data-y='14' cx='196.6' cy='106.1' r='3.2' fill='#012820'/><circle class='pt' data-i='7' data-h='0' data-y='14' cx='210.5' cy='106.1' r='3.2' fill='#012820'/><circle class='pt' data-i='7' data-h='1' data-y='20' cx='212.2' cy='59' r='3.2' fill='#012820'/><circle class='pt' data-i='7' data-h='2' data-y='11' cx='213.9' cy='129.6' r='3.2' fill='#012820'/><circle class='pt' data-i='7' data-h='3' data-y='17' cx='215.5' cy='82.5' r='3.2' fill='#012820'/><circle class='pt' data-i='7' data-h='4' data-y='12' cx='217.2' cy='121.8' r='3.2' fill='#012820'/><circle class='pt' data-i='7' data-h='5' data-y='22' cx='218.8' cy='43.3' r='3.2' fill='#012820'/></g></svg><svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 236 236' role='img' aria-label='Panel del sondeo: Distancia al acopio' data-panel='1' font-family='Montserrat, system-ui, sans-serif' font-size='12'><text x='118' y='16' text-anchor='middle' font-size='13.5' fill='#012820' font-weight='600'>Distancia al acopio</text><rect x='46' y='30' width='182' height='160' fill='none' stroke='#cbd5e1'/><g stroke='#e2e8f0'><line class='grid-y' data-v='10' x1='46' x2='228' y1='162.6' y2='162.6'/><line class='grid-y' data-v='15' x1='46' x2='228' y1='127.5' y2='127.5'/><line class='grid-y' data-v='20' x1='46' x2='228' y1='92.5' y2='92.5'/><line class='grid-y' data-v='25' x1='46' x2='228' y1='57.4' y2='57.4'/></g><g fill='#475569' text-anchor='end'><text class='tick-y' data-v='10' x='40' y='166.6'>10</text><text class='tick-y' data-v='15' x='40' y='131.5'>15</text><text class='tick-y' data-v='20' x='40' y='96.5'>20</text><text class='tick-y' data-v='25' x='40' y='61.4'>25</text></g><text x='14' y='110' text-anchor='middle' fill='#475569' transform='rotate(-90 14 110)'>km</text><g fill='#475569' text-anchor='middle'><text class='tick-x' data-v='1' x='59.3' y='205'>1</text><text class='tick-x' data-v='2' x='81.5' y='205'>2</text><text class='tick-x' data-v='3' x='103.7' y='205'>3</text><text class='tick-x' data-v='4' x='125.9' y='205'>4</text><text class='tick-x' data-v='5' x='148.1' y='205'>5</text><text class='tick-x' data-v='6' x='170.3' y='205'>6</text><text class='tick-x' data-v='7' x='192.5' y='205'>7</text><text class='tick-x' data-v='8' x='214.7' y='205'>8</text></g><text x='137' y='224' text-anchor='middle' fill='#475569'>Vereda</text><line class='media-general' x1='46' x2='228' y1='110.7' y2='110.7' stroke='#64748b' stroke-width='1.2' stroke-dasharray='5 4'/><g stroke='#EA580C' stroke-width='2.4'><line class='media' data-i='0' x1='52.2' x2='66.4' y1='148.6' y2='148.6'/><line class='media' data-i='1' x1='74.4' x2='88.6' y1='131.1' y2='131.1'/><line class='media' data-i='2' x1='96.6' x2='110.8' y1='60.9' y2='60.9'/><line class='media' data-i='3' x1='118.8' x2='133' y1='145.1' y2='145.1'/><line class='media' data-i='4' x1='141' x2='155.2' y1='149.8' y2='149.8'/><line class='media' data-i='5' x1='163.2' x2='177.4' y1='97.1' y2='97.1'/><line class='media' data-i='6' x1='185.4' x2='199.6' y1='62' y2='62'/><line class='media' data-i='7' x1='207.6' x2='221.8' y1='91.3' y2='91.3'/></g><g fill-opacity='0.75'><circle class='pt' data-i='0' data-h='0' data-y='9' cx='55.2' cy='169.6' r='3.2' fill='#012820'/><circle class='pt' data-i='0' data-h='1' data-y='11' cx='56.8' cy='155.6' r='3.2' fill='#012820'/><circle class='pt' data-i='0' data-h='2' data-y='14' cx='58.5' cy='134.6' r='3.2' fill='#012820'/><circle class='pt' data-i='0' data-h='3' data-y='11' cx='60.1' cy='155.6' r='3.2' fill='#012820'/><circle class='pt' data-i='0' data-h='4' data-y='13' cx='61.8' cy='141.6' r='3.2' fill='#012820'/><circle class='pt' data-i='0' data-h='5' data-y='14' cx='63.5' cy='134.6' r='3.2' fill='#012820'/><circle class='pt' data-i='1' data-h='0' data-y='12' cx='77.4' cy='148.6' r='3.2' fill='#012820'/><circle class='pt' data-i='1' data-h='1' data-y='14' cx='79' cy='134.6' r='3.2' fill='#012820'/><circle class='pt' data-i='1' data-h='2' data-y='18' cx='80.7' cy='106.5' r='3.2' fill='#012820'/><circle class='pt' data-i='1' data-h='3' data-y='13' cx='82.3' cy='141.6' r='3.2' fill='#012820'/><circle class='pt' data-i='1' data-h='4' data-y='16' cx='84' cy='120.5' r='3.2' fill='#012820'/><circle class='pt' data-i='1' data-h='5' data-y='14' cx='85.7' cy='134.6' r='3.2' fill='#012820'/><circle class='pt' data-i='2' data-h='0' data-y='22' cx='99.5' cy='78.4' r='3.2' fill='#012820'/><circle class='pt' data-i='2' data-h='1' data-y='25' cx='101.2' cy='57.4' r='3.2' fill='#012820'/><circle class='pt' data-i='2' data-h='2' data-y='22' cx='102.9' cy='78.4' r='3.2' fill='#012820'/><circle class='pt' data-i='2' data-h='3' data-y='26' cx='104.5' cy='50.4' r='3.2' fill='#012820'/><circle class='pt' data-i='2' data-h='4' data-y='26' cx='106.2' cy='50.4' r='3.2' fill='#012820'/><circle class='pt' data-i='2' data-h='5' data-y='26' cx='107.9' cy='50.4' r='3.2' fill='#012820'/><circle class='pt' data-i='3' data-h='0' data-y='13' cx='121.7' cy='141.6' r='3.2' fill='#012820'/><circle class='pt' data-i='3' data-h='1' data-y='10' cx='123.4' cy='162.6' r='3.2' fill='#012820'/><circle class='pt' data-i='3' data-h='2' data-y='17' cx='125.1' cy='113.5' r='3.2' fill='#012820'/><circle class='pt' data-i='3' data-h='3' data-y='10' cx='126.7' cy='162.6' r='3.2' fill='#012820'/><circle class='pt' data-i='3' data-h='4' data-y='13' cx='128.4' cy='141.6' r='3.2' fill='#012820'/><circle class='pt' data-i='3' data-h='5' data-y='12' cx='130.1' cy='148.6' r='3.2' fill='#012820'/><circle class='pt' data-i='4' data-h='0' data-y='14' cx='143.9' cy='134.6' r='3.2' fill='#012820'/><circle class='pt' data-i='4' data-h='1' data-y='10' cx='145.6' cy='162.6' r='3.2' fill='#012820'/><circle class='pt' data-i='4' data-h='2' data-y='16' cx='147.3' cy='120.5' r='3.2' fill='#012820'/><circle class='pt' data-i='4' data-h='3' data-y='8' cx='148.9' cy='176.7' r='3.2' fill='#012820'/><circle class='pt' data-i='4' data-h='4' data-y='12' cx='150.6' cy='148.6' r='3.2' fill='#012820'/><circle class='pt' data-i='4' data-h='5' data-y='11' cx='152.3' cy='155.6' r='3.2' fill='#012820'/><circle class='pt' data-i='5' data-h='0' data-y='15' cx='166.1' cy='127.5' r='3.2' fill='#012820'/><circle class='pt' data-i='5' data-h='1' data-y='21' cx='167.8' cy='85.4' r='3.2' fill='#012820'/><circle class='pt' data-i='5' data-h='2' data-y='19' cx='169.5' cy='99.5' r='3.2' fill='#012820'/><circle class='pt' data-i='5' data-h='3' data-y='23' cx='171.1' cy='71.4' r='3.2' fill='#012820'/><circle class='pt' data-i='5' data-h='4' data-y='19' cx='172.8' cy='99.5' r='3.2' fill='#012820'/><circle class='pt' data-i='5' data-h='5' data-y='19' cx='174.5' cy='99.5' r='3.2' fill='#012820'/><circle class='pt' data-i='6' data-h='0' data-y='27' cx='188.3' cy='43.3' r='3.2' fill='#012820'/><circle class='pt' data-i='6' data-h='1' data-y='21' cx='190' cy='85.4' r='3.2' fill='#012820'/><circle class='pt' data-i='6' data-h='2' data-y='24' cx='191.7' cy='64.4' r='3.2' fill='#012820'/><circle class='pt' data-i='6' data-h='3' data-y='27' cx='193.3' cy='43.3' r='3.2' fill='#012820'/><circle class='pt' data-i='6' data-h='4' data-y='24' cx='195' cy='64.4' r='3.2' fill='#012820'/><circle class='pt' data-i='6' data-h='5' data-y='23' cx='196.6' cy='71.4' r='3.2' fill='#012820'/><circle class='pt' data-i='7' data-h='0' data-y='23' cx='210.5' cy='71.4' r='3.2' fill='#012820'/><circle class='pt' data-i='7' data-h='1' data-y='17' cx='212.2' cy='113.5' r='3.2' fill='#012820'/><circle class='pt' data-i='7' data-h='2' data-y='18' cx='213.9' cy='106.5' r='3.2' fill='#012820'/><circle class='pt' data-i='7' data-h='3' data-y='23' cx='215.5' cy='71.4' r='3.2' fill='#012820'/><circle class='pt' data-i='7' data-h='4' data-y='18' cx='217.2' cy='106.5' r='3.2' fill='#012820'/><circle class='pt' data-i='7' data-h='5' data-y='22' cx='218.8' cy='78.4' r='3.2' fill='#012820'/></g></svg><svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 236 236' role='img' aria-label='Panel del sondeo: Vacas en ordeño' data-panel='2' font-family='Montserrat, system-ui, sans-serif' font-size='12'><text x='118' y='16' text-anchor='middle' font-size='13.5' fill='#012820' font-weight='600'>Vacas en ordeño</text><rect x='46' y='30' width='182' height='160' fill='none' stroke='#cbd5e1'/><g stroke='#e2e8f0'><line class='grid-y' data-v='10' x1='46' x2='228' y1='143.3' y2='143.3'/><line class='grid-y' data-v='20' x1='46' x2='228' y1='87.8' y2='87.8'/><line class='grid-y' data-v='30' x1='46' x2='228' y1='32.2' y2='32.2'/></g><g fill='#475569' text-anchor='end'><text class='tick-y' data-v='10' x='40' y='147.3'>10</text><text class='tick-y' data-v='20' x='40' y='91.8'>20</text><text class='tick-y' data-v='30' x='40' y='36.2'>30</text></g><text x='14' y='110' text-anchor='middle' fill='#475569' transform='rotate(-90 14 110)'>vacas</text><g fill='#475569' text-anchor='middle'><text class='tick-x' data-v='1' x='59.3' y='205'>1</text><text class='tick-x' data-v='2' x='81.5' y='205'>2</text><text class='tick-x' data-v='3' x='103.7' y='205'>3</text><text class='tick-x' data-v='4' x='125.9' y='205'>4</text><text class='tick-x' data-v='5' x='148.1' y='205'>5</text><text class='tick-x' data-v='6' x='170.3' y='205'>6</text><text class='tick-x' data-v='7' x='192.5' y='205'>7</text><text class='tick-x' data-v='8' x='214.7' y='205'>8</text></g><text x='137' y='224' text-anchor='middle' fill='#475569'>Vereda</text><line class='media-general' x1='46' x2='228' y1='113' y2='113' stroke='#64748b' stroke-width='1.2' stroke-dasharray='5 4'/><g stroke='#EA580C' stroke-width='2.4'><line class='media' data-i='0' x1='52.2' x2='66.4' y1='99.8' y2='99.8'/><line class='media' data-i='1' x1='74.4' x2='88.6' y1='108.1' y2='108.1'/><line class='media' data-i='2' x1='96.6' x2='110.8' y1='116.5' y2='116.5'/><line class='media' data-i='3' x1='118.8' x2='133' y1='118.3' y2='118.3'/><line class='media' data-i='4' x1='141' x2='155.2' y1='131.3' y2='131.3'/><line class='media' data-i='5' x1='163.2' x2='177.4' y1='101.7' y2='101.7'/><line class='media' data-i='6' x1='185.4' x2='199.6' y1='111.9' y2='111.9'/><line class='media' data-i='7' x1='207.6' x2='221.8' y1='116.5' y2='116.5'/></g><g fill-opacity='0.75'><circle class='pt' data-i='0' data-h='0' data-y='17' cx='55.2' cy='104.4' r='3.2' fill='#012820'/><circle class='pt' data-i='0' data-h='1' data-y='12' cx='56.8' cy='132.2' r='3.2' fill='#012820'/><circle class='pt' data-i='0' data-h='2' data-y='19' cx='58.5' cy='93.3' r='3.2' fill='#012820'/><circle class='pt' data-i='0' data-h='3' data-y='18' cx='60.1' cy='98.9' r='3.2' fill='#012820'/><circle class='pt' data-i='0' data-h='4' data-y='24' cx='61.8' cy='65.6' r='3.2' fill='#012820'/><circle class='pt' data-i='0' data-h='5' data-y='17' cx='63.5' cy='104.4' r='3.2' fill='#012820'/><circle class='pt' data-i='1' data-h='0' data-y='20' cx='77.4' cy='87.8' r='3.2' fill='#012820'/><circle class='pt' data-i='1' data-h='1' data-y='9' cx='79' cy='148.9' r='3.2' fill='#012820'/><circle class='pt' data-i='1' data-h='2' data-y='20' cx='80.7' cy='87.8' r='3.2' fill='#012820'/><circle class='pt' data-i='1' data-h='3' data-y='18' cx='82.3' cy='98.9' r='3.2' fill='#012820'/><circle class='pt' data-i='1' data-h='4' data-y='19' cx='84' cy='93.3' r='3.2' fill='#012820'/><circle class='pt' data-i='1' data-h='5' data-y='12' cx='85.7' cy='132.2' r='3.2' fill='#012820'/><circle class='pt' data-i='2' data-h='0' data-y='16' cx='99.5' cy='110' r='3.2' fill='#012820'/><circle class='pt' data-i='2' data-h='1' data-y='15' cx='101.2' cy='115.6' r='3.2' fill='#012820'/><circle class='pt' data-i='2' data-h='2' data-y='11' cx='102.9' cy='137.8' r='3.2' fill='#012820'/><circle class='pt' data-i='2' data-h='3' data-y='18' cx='104.5' cy='98.9' r='3.2' fill='#012820'/><circle class='pt' data-i='2' data-h='4' data-y='11' cx='106.2' cy='137.8' r='3.2' fill='#012820'/><circle class='pt' data-i='2' data-h='5' data-y='18' cx='107.9' cy='98.9' r='3.2' fill='#012820'/><circle class='pt' data-i='3' data-h='0' data-y='17' cx='121.7' cy='104.4' r='3.2' fill='#012820'/><circle class='pt' data-i='3' data-h='1' data-y='15' cx='123.4' cy='115.6' r='3.2' fill='#012820'/><circle class='pt' data-i='3' data-h='2' data-y='4' cx='125.1' cy='176.7' r='3.2' fill='#012820'/><circle class='pt' data-i='3' data-h='3' data-y='11' cx='126.7' cy='137.8' r='3.2' fill='#012820'/><circle class='pt' data-i='3' data-h='4' data-y='12' cx='128.4' cy='132.2' r='3.2' fill='#012820'/><circle class='pt' data-i='3' data-h='5' data-y='28' cx='130.1' cy='43.3' r='3.2' fill='#012820'/><circle class='pt' data-i='4' data-h='0' data-y='9' cx='143.9' cy='148.9' r='3.2' fill='#012820'/><circle class='pt' data-i='4' data-h='1' data-y='13' cx='145.6' cy='126.7' r='3.2' fill='#012820'/><circle class='pt' data-i='4' data-h='2' data-y='16' cx='147.3' cy='110' r='3.2' fill='#012820'/><circle class='pt' data-i='4' data-h='3' data-y='14' cx='148.9' cy='121.1' r='3.2' fill='#012820'/><circle class='pt' data-i='4' data-h='4' data-y='12' cx='150.6' cy='132.2' r='3.2' fill='#012820'/><circle class='pt' data-i='4' data-h='5' data-y='9' cx='152.3' cy='148.9' r='3.2' fill='#012820'/><circle class='pt' data-i='5' data-h='0' data-y='21' cx='166.1' cy='82.2' r='3.2' fill='#012820'/><circle class='pt' data-i='5' data-h='1' data-y='22' cx='167.8' cy='76.7' r='3.2' fill='#012820'/><circle class='pt' data-i='5' data-h='2' data-y='16' cx='169.5' cy='110' r='3.2' fill='#012820'/><circle class='pt' data-i='5' data-h='3' data-y='11' cx='171.1' cy='137.8' r='3.2' fill='#012820'/><circle class='pt' data-i='5' data-h='4' data-y='24' cx='172.8' cy='65.6' r='3.2' fill='#012820'/><circle class='pt' data-i='5' data-h='5' data-y='11' cx='174.5' cy='137.8' r='3.2' fill='#012820'/><circle class='pt' data-i='6' data-h='0' data-y='15' cx='188.3' cy='115.6' r='3.2' fill='#012820'/><circle class='pt' data-i='6' data-h='1' data-y='14' cx='190' cy='121.1' r='3.2' fill='#012820'/><circle class='pt' data-i='6' data-h='2' data-y='15' cx='191.7' cy='115.6' r='3.2' fill='#012820'/><circle class='pt' data-i='6' data-h='3' data-y='14' cx='193.3' cy='121.1' r='3.2' fill='#012820'/><circle class='pt' data-i='6' data-h='4' data-y='14' cx='195' cy='121.1' r='3.2' fill='#012820'/><circle class='pt' data-i='6' data-h='5' data-y='22' cx='196.6' cy='76.7' r='3.2' fill='#012820'/><circle class='pt' data-i='7' data-h='0' data-y='20' cx='210.5' cy='87.8' r='3.2' fill='#012820'/><circle class='pt' data-i='7' data-h='1' data-y='18' cx='212.2' cy='98.9' r='3.2' fill='#012820'/><circle class='pt' data-i='7' data-h='2' data-y='10' cx='213.9' cy='143.3' r='3.2' fill='#012820'/><circle class='pt' data-i='7' data-h='3' data-y='9' cx='215.5' cy='148.9' r='3.2' fill='#012820'/><circle class='pt' data-i='7' data-h='4' data-y='17' cx='217.2' cy='104.4' r='3.2' fill='#012820'/><circle class='pt' data-i='7' data-h='5' data-y='15' cx='218.8' cy='115.6' r='3.2' fill='#012820'/></g></svg><figcaption>Tres paneles, uno por variable, con las mismas ocho veredas en el eje horizontal.</figcaption></figure>",
         "opciones": [
          {
           "texto": "Con el área del predio.",
           "retro": "Con el área del predio, la correlación intraclase del sondeo es 0,05, mucho menor que la de la variable de la clave (0,81): con veredas del mismo tamaño, su deff crecería mucho menos (módulo 4)."
          },
          {
           "texto": "Con la distancia al acopio.",
           "retro": "deff ≈ 1 + (M̄ − 1)ρ: con veredas del mismo tamaño, manda ρ. Con la distancia al acopio, los predios de una vereda se parecen entre sí y las veredas difieren: su R²<sub>a</sub> en el sondeo es 0,81, frente a casi cero en las otras dos (área del predio, 0,05; vacas en ordeño, −0,02). Encuestar veredas enteras rinde mucho menos para esa variable que para las otras (módulo 4)."
          },
          {
           "texto": "Con las vacas en ordeño.",
           "retro": "Con las vacas en ordeño, la correlación intraclase del sondeo es −0,02, mucho menor que la de la variable de la clave (0,81): con veredas del mismo tamaño, su deff crecería mucho menos (módulo 4)."
          },
          {
           "texto": "Con las tres por igual.",
           "retro": "Con el mismo tamaño de vereda, el deff depende de ρ, y ρ no es de la vereda sino de cada variable medida en ella (área del predio, 0,05; distancia al acopio, 0,81; vacas en ordeño, −0,02) (módulo 4)."
          }
         ],
         "correcta": 1
        },
        {
         "n": 9,
         "etapa": "2",
         "etiqueta": "cap. 5 · mód. 3 y 5 · Qué arregla los intervalos",
         "tipo": "opcion",
         "enunciado": "<p>Para poner a prueba la fórmula de MAS, un técnico generó 40 muestras de una zona simulada que conoce entera: cada muestra toma 8 veredas y 5 predios de cada una, y su intervalo del 95 % se calcula como si los 40 predios fueran un MAS. La línea naranja marca la producción media por predio de toda la zona. ¿Qué cambio llevaría el centro de los intervalos al valor de la zona?</p><figure class='simulacro-figura'><svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 460 445' role='img' aria-label='40 intervalos horizontales, uno por muestra, y una línea vertical' font-family='Montserrat, system-ui, sans-serif' font-size='12'><rect x='40' y='30' width='404' height='369' fill='none' stroke='#cbd5e1'/><g stroke='#e2e8f0'><line class='grid-x' data-v='65' x1='83.5' x2='83.5' y1='30' y2='399'/><line class='grid-x' data-v='70' x1='156.2' x2='156.2' y1='30' y2='399'/><line class='grid-x' data-v='75' x1='228.9' x2='228.9' y1='30' y2='399'/><line class='grid-x' data-v='80' x1='301.6' x2='301.6' y1='30' y2='399'/><line class='grid-x' data-v='85' x1='374.2' x2='374.2' y1='30' y2='399'/></g><g fill='#475569' text-anchor='middle'><text class='tick-x' data-v='65' x='83.5' y='414'>65</text><text class='tick-x' data-v='70' x='156.2' y='414'>70</text><text class='tick-x' data-v='75' x='228.9' y='414'>75</text><text class='tick-x' data-v='80' x='301.6' y='414'>80</text><text class='tick-x' data-v='85' x='374.2' y='414'>85</text></g><text x='242' y='433' text-anchor='middle' fill='#475569'>Producción media por predio (L/día)</text><g><line class='intervalo' data-k='0' x1='93.2' x2='289.2' y1='39' y2='39' stroke='#012820' stroke-width='1.8'/><circle class='centro' data-k='0' cx='191.2' cy='39' r='2.2' fill='#012820'/><line class='intervalo' data-k='1' x1='97.3' x2='282.9' y1='48' y2='48' stroke='#012820' stroke-width='1.8'/><circle class='centro' data-k='1' cx='190.1' cy='48' r='2.2' fill='#012820'/><line class='intervalo' data-k='2' x1='170.8' x2='347.7' y1='57' y2='57' stroke='#012820' stroke-width='1.8'/><circle class='centro' data-k='2' cx='259.2' cy='57' r='2.2' fill='#012820'/><line class='intervalo' data-k='3' x1='78.1' x2='282.5' y1='66' y2='66' stroke='#012820' stroke-width='1.8'/><circle class='centro' data-k='3' cx='180.3' cy='66' r='2.2' fill='#012820'/><line class='intervalo' data-k='4' x1='109.2' x2='255.4' y1='75' y2='75' stroke='#012820' stroke-width='1.8'/><circle class='centro' data-k='4' cx='182.3' cy='75' r='2.2' fill='#012820'/><line class='intervalo' data-k='5' x1='116.6' x2='295.9' y1='84' y2='84' stroke='#012820' stroke-width='1.8'/><circle class='centro' data-k='5' cx='206.2' cy='84' r='2.2' fill='#012820'/><line class='intervalo' data-k='6' x1='97.6' x2='271.2' y1='93' y2='93' stroke='#012820' stroke-width='1.8'/><circle class='centro' data-k='6' cx='184.4' cy='93' r='2.2' fill='#012820'/><line class='intervalo' data-k='7' x1='208.4' x2='385.7' y1='102' y2='102' stroke='#012820' stroke-width='1.8'/><circle class='centro' data-k='7' cx='297' cy='102' r='2.2' fill='#012820'/><line class='intervalo' data-k='8' x1='188.4' x2='326.4' y1='111' y2='111' stroke='#012820' stroke-width='1.8'/><circle class='centro' data-k='8' cx='257.4' cy='111' r='2.2' fill='#012820'/><line class='intervalo' data-k='9' x1='61.6' x2='244.6' y1='120' y2='120' stroke='#012820' stroke-width='1.8'/><circle class='centro' data-k='9' cx='153.1' cy='120' r='2.2' fill='#012820'/><line class='intervalo' data-k='10' x1='120.8' x2='274.8' y1='129' y2='129' stroke='#012820' stroke-width='1.8'/><circle class='centro' data-k='10' cx='197.8' cy='129' r='2.2' fill='#012820'/><line class='intervalo' data-k='11' x1='82.8' x2='237.4' y1='138' y2='138' stroke='#012820' stroke-width='1.8'/><circle class='centro' data-k='11' cx='160.1' cy='138' r='2.2' fill='#012820'/><line class='intervalo' data-k='12' x1='88' x2='269.7' y1='147' y2='147' stroke='#012820' stroke-width='1.8'/><circle class='centro' data-k='12' cx='178.8' cy='147' r='2.2' fill='#012820'/><line class='intervalo' data-k='13' x1='136' x2='302.7' y1='156' y2='156' stroke='#012820' stroke-width='1.8'/><circle class='centro' data-k='13' cx='219.4' cy='156' r='2.2' fill='#012820'/><line class='intervalo' data-k='14' x1='202.3' x2='348.9' y1='165' y2='165' stroke='#012820' stroke-width='1.8'/><circle class='centro' data-k='14' cx='275.6' cy='165' r='2.2' fill='#012820'/><line class='intervalo' data-k='15' x1='205.7' x2='360.8' y1='174' y2='174' stroke='#012820' stroke-width='1.8'/><circle class='centro' data-k='15' cx='283.2' cy='174' r='2.2' fill='#012820'/><line class='intervalo' data-k='16' x1='181.7' x2='330.3' y1='183' y2='183' stroke='#012820' stroke-width='1.8'/><circle class='centro' data-k='16' cx='256' cy='183' r='2.2' fill='#012820'/><line class='intervalo' data-k='17' x1='105.1' x2='266.9' y1='192' y2='192' stroke='#012820' stroke-width='1.8'/><circle class='centro' data-k='17' cx='186' cy='192' r='2.2' fill='#012820'/><line class='intervalo' data-k='18' x1='224.1' x2='375.8' y1='201' y2='201' stroke='#012820' stroke-width='1.8'/><circle class='centro' data-k='18' cx='299.9' cy='201' r='2.2' fill='#012820'/><line class='intervalo' data-k='19' x1='63.1' x2='223.7' y1='210' y2='210' stroke='#012820' stroke-width='1.8'/><circle class='centro' data-k='19' cx='143.4' cy='210' r='2.2' fill='#012820'/><line class='intervalo' data-k='20' x1='255.5' x2='422.4' y1='219' y2='219' stroke='#012820' stroke-width='1.8'/><circle class='centro' data-k='20' cx='338.9' cy='219' r='2.2' fill='#012820'/><line class='intervalo' data-k='21' x1='230.5' x2='387.1' y1='228' y2='228' stroke='#012820' stroke-width='1.8'/><circle class='centro' data-k='21' cx='308.8' cy='228' r='2.2' fill='#012820'/><line class='intervalo' data-k='22' x1='148.3' x2='294.4' y1='237' y2='237' stroke='#012820' stroke-width='1.8'/><circle class='centro' data-k='22' cx='221.4' cy='237' r='2.2' fill='#012820'/><line class='intervalo' data-k='23' x1='236.8' x2='366.7' y1='246' y2='246' stroke='#012820' stroke-width='1.8'/><circle class='centro' data-k='23' cx='301.8' cy='246' r='2.2' fill='#012820'/><line class='intervalo' data-k='24' x1='254.3' x2='410.3' y1='255' y2='255' stroke='#012820' stroke-width='1.8'/><circle class='centro' data-k='24' cx='332.3' cy='255' r='2.2' fill='#012820'/><line class='intervalo' data-k='25' x1='128.5' x2='262.3' y1='264' y2='264' stroke='#012820' stroke-width='1.8'/><circle class='centro' data-k='25' cx='195.4' cy='264' r='2.2' fill='#012820'/><line class='intervalo' data-k='26' x1='214.2' x2='348.8' y1='273' y2='273' stroke='#012820' stroke-width='1.8'/><circle class='centro' data-k='26' cx='281.5' cy='273' r='2.2' fill='#012820'/><line class='intervalo' data-k='27' x1='183.3' x2='343.2' y1='282' y2='282' stroke='#012820' stroke-width='1.8'/><circle class='centro' data-k='27' cx='263.3' cy='282' r='2.2' fill='#012820'/><line class='intervalo' data-k='28' x1='88.9' x2='237.8' y1='291' y2='291' stroke='#012820' stroke-width='1.8'/><circle class='centro' data-k='28' cx='163.3' cy='291' r='2.2' fill='#012820'/><line class='intervalo' data-k='29' x1='180.5' x2='348.2' y1='300' y2='300' stroke='#012820' stroke-width='1.8'/><circle class='centro' data-k='29' cx='264.4' cy='300' r='2.2' fill='#012820'/><line class='intervalo' data-k='30' x1='129.4' x2='262.1' y1='309' y2='309' stroke='#012820' stroke-width='1.8'/><circle class='centro' data-k='30' cx='195.7' cy='309' r='2.2' fill='#012820'/><line class='intervalo' data-k='31' x1='255.7' x2='403.5' y1='318' y2='318' stroke='#012820' stroke-width='1.8'/><circle class='centro' data-k='31' cx='329.6' cy='318' r='2.2' fill='#012820'/><line class='intervalo' data-k='32' x1='91.4' x2='246.3' y1='327' y2='327' stroke='#012820' stroke-width='1.8'/><circle class='centro' data-k='32' cx='168.8' cy='327' r='2.2' fill='#012820'/><line class='intervalo' data-k='33' x1='151.3' x2='288.2' y1='336' y2='336' stroke='#012820' stroke-width='1.8'/><circle class='centro' data-k='33' cx='219.7' cy='336' r='2.2' fill='#012820'/><line class='intervalo' data-k='34' x1='100' x2='257.2' y1='345' y2='345' stroke='#012820' stroke-width='1.8'/><circle class='centro' data-k='34' cx='178.6' cy='345' r='2.2' fill='#012820'/><line class='intervalo' data-k='35' x1='97.5' x2='234.1' y1='354' y2='354' stroke='#012820' stroke-width='1.8'/><circle class='centro' data-k='35' cx='165.8' cy='354' r='2.2' fill='#012820'/><line class='intervalo' data-k='36' x1='198.8' x2='383.7' y1='363' y2='363' stroke='#012820' stroke-width='1.8'/><circle class='centro' data-k='36' cx='291.2' cy='363' r='2.2' fill='#012820'/><line class='intervalo' data-k='37' x1='140.9' x2='326.7' y1='372' y2='372' stroke='#012820' stroke-width='1.8'/><circle class='centro' data-k='37' cx='233.8' cy='372' r='2.2' fill='#012820'/><line class='intervalo' data-k='38' x1='122.4' x2='293.7' y1='381' y2='381' stroke='#012820' stroke-width='1.8'/><circle class='centro' data-k='38' cx='208.1' cy='381' r='2.2' fill='#012820'/><line class='intervalo' data-k='39' x1='108.7' x2='245' y1='390' y2='390' stroke='#012820' stroke-width='1.8'/><circle class='centro' data-k='39' cx='176.8' cy='390' r='2.2' fill='#012820'/></g><line class='verdad' data-v='70.2678' x1='160.1' x2='160.1' y1='24' y2='399' stroke='#EA580C' stroke-width='2'/><text x='160.1' y='20' text-anchor='middle' font-size='11.5' fill='#C2410C' font-weight='600'>valor de la zona</text></svg><figcaption>Cada línea horizontal es el intervalo de una muestra, con su promedio en el punto.</figcaption></figure>",
         "opciones": [
          {
           "texto": "Multiplicar el error estándar por la raíz del deff, para ensanchar los intervalos.",
           "retro": "Ensanchar arregla un error estándar corto, que falla hacia los dos lados. Aquí 16 fallan, los 16 a la derecha del valor: el centro está corrido, y con intervalos más anchos seguiría corrido (módulos 3 y 5)."
          },
          {
           "texto": "Encuestar más predios en cada vereda, para que el promedio se estabilice.",
           "retro": "Más predios por vereda estabilizan cada ȳ<sub>i</sub>, pero el promedio seguiría pesando igual a todas las veredas y apuntando al mismo valor corrido (módulo 5)."
          },
          {
           "texto": "Ninguno: con 40 muestras no se puede juzgar la cobertura.",
           "retro": "Con 40 muestras sobra para verlo: atrapan el valor 24 de los 40, y 16 fallan, los 16 a la derecha del valor (módulo 3)."
          },
          {
           "texto": "Pesar cada predio por el tamaño de su vereda, como hace la razón.",
           "retro": "Atrapan el valor 24 de los 40 (60,0 %), y 16 fallan, los 16 a la derecha del valor: el centro está corrido, no solo el ancho. Con 5 predios por vereda, el promedio de la muestra pesa igual a cada vereda, y aquí las veredas con más predios producen menos por predio: apunta a la vereda típica. Pesar cada predio por M<sub>i</sub>/m<sub>i</sub>, o usar la razón, apunta al predio típico (módulos 3 y 5)."
          }
         ],
         "correcta": 3
        },
        {
         "n": 10,
         "etapa": "2",
         "etiqueta": "cap. 5 · mód. 6 y 7 · El atajo del conglomerado último en survey",
         "tipo": "opcion",
         "enunciado": "<p>El archivo <code>sondeo</code> trae un registro por predio encuestado: <code>vereda</code>, <code>predio</code>, <code>leche</code> y <code>w</code>, su peso de muestreo. Un analista declara <code>svydesign(id = ~vereda, weights = ~w, data = sondeo)</code> y pide <code>svytotal(~leche, …)</code>. ¿Qué obtiene?</p>",
         "opciones": [
          {
           "texto": "El total bien estimado, con el error estándar del conglomerado último sin fpc.",
           "retro": "Con las veredas como conglomerados y el peso de cada predio, <code>survey</code> estima bien el total, y su varianza con los totales de vereda como si fueran una etapa con reemplazo: N²s<sub>t</sub>²/n, sin corrección por población finita. Aquí da 2548 litros, algo más que los 2431 de las dos etapas completas: es el atajo de Lohr (ec. 5.29), que suele bastar (módulos 6 y 7)."
          },
          {
           "texto": "El total y el error estándar de un MAS de predios, porque solo declara pesos.",
           "retro": "<code>id = ~vereda</code> declara las veredas como conglomerados: la varianza sale de cuánto difieren los totales de vereda, no los predios uno a uno, como haría un MAS (módulo 6)."
          },
          {
           "texto": "Un error: <code>survey</code> no corre si falta declarar la segunda etapa del diseño.",
           "retro": "<code>survey</code> corre con una sola etapa declarada: es justo el atajo del conglomerado último, que trata a cada vereda como una unidad con su total (módulo 7)."
          },
          {
           "texto": "El mismo error estándar que con las dos etapas y sus dos correcciones.",
           "retro": "No es el mismo: el atajo usa solo los totales de vereda, sin fpc, y da 2548 litros; con las dos etapas y sus correcciones da 2431 (módulo 7)."
          }
         ],
         "correcta": 0
        },
        {
         "n": 11,
         "etapa": "2",
         "etiqueta": "cap. 5 · mód. 9 · Estratificar las veredas",
         "tipo": "opcion",
         "enunciado": "<p>En otra zona, la cooperativa agrupa las veredas por piso térmico (cálido, templado y frío) y sortea 2 veredas en cada piso, con predios dentro de cada vereda. Las veredas de un mismo piso producen parecido, y las de pisos distintos, muy distinto. ¿Qué gana frente a sortear 6 veredas sin estratos?</p>",
         "opciones": [
          {
           "texto": "La variación entre pisos deja de contar: solo entra la que hay dentro de cada piso.",
           "retro": "Con estratos, la varianza del total suma la de cada piso, calculada entre las veredas de ese piso. La diferencia entre pisos, que aquí es la grande, ya no entra: es lo que hizo el diseño combinado del módulo 9 al repartir los estados entre regiones (módulo 9)."
          },
          {
           "texto": "Desaparece la variación entre los predios de una misma vereda, la de la segunda etapa.",
           "retro": "Los predios de una vereda varían igual que antes: estratificar agrupa las veredas, no toca lo que pasa dentro de ellas. Lo que quita es la variación entre pisos (módulos 7 y 9)."
          },
          {
           "texto": "Obliga a sortear más predios en cada vereda para compensar los estratos.",
           "retro": "Cuántos predios encuestar por vereda lo deciden los costos y la correlación intraclase (módulo 8), no los estratos. Estratificar cambia qué variación entra en la varianza: la de entre pisos deja de contar (módulo 9)."
          },
          {
           "texto": "Nada: con conglomerados, estratificar cambia el orden del sorteo, no la varianza.",
           "retro": "Cambia la varianza: el sorteo ya no puede traer, por azar, solo veredas de un piso, y la diferencia entre pisos sale de la varianza del total (módulo 9)."
          }
         ],
         "correcta": 0
        },
        {
         "n": 12,
         "etapa": "2",
         "etiqueta": "cap. 5 · mód. 10 · El minibatch de una sola finca",
         "tipo": "opcion",
         "enunciado": "<p>Un grupo entrena un detector de mastitis con minibatches de 32 vacas, todas de una misma finca. La correlación intraclase de la señal dentro de una finca es ρ = 0,3. ¿A cuántas vacas independientes equivale, en información, cada minibatch?</p>",
         "opciones": [
          {
           "texto": "A 32 vacas.",
           "retro": "Con ρ = 0,3, cada vaca de la misma finca repite parte de lo que dicen sus compañeras: las 32 informan como 3,1 independientes (módulos 4 y 10)."
          },
          {
           "texto": "A unas 10 vacas.",
           "retro": "El tamaño informativo divide m entre el deff, 1 + (m − 1)ρ = 10,3; no multiplica m por ρ (módulo 10)."
          },
          {
           "texto": "A unas 3 vacas.",
           "retro": "La varianza del gradiente promedio es σ²/m·[1 + (m − 1)ρ] = σ²/32·10,3: el minibatch informa como uno de 32/10,3 ≈ 3,1 vacas independientes. Es la fórmula de Kish del módulo 4 con otro disfraz, y por eso los cargadores de datos barajan entre fincas (módulo 10)."
          },
          {
           "texto": "A unas 107 vacas.",
           "retro": "Dividir entre ρ daría más vacas de las que hay. Se divide entre el deff, 1 + (m − 1)ρ = 10,3 (módulo 10)."
          }
         ],
         "correcta": 2
        }
       ]
      }
     ]
    };
    // [fin · simulacro del quiz]
