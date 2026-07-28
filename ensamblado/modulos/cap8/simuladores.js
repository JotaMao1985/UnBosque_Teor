    // ================================================================
    // Simuladores del capítulo 8
    //
    // Todos leen de DATOS_CAP8, que produce precalculo/genera_cap8.R.
    // Lo pesado —las 2 000 réplicas de los cuatro mecanismos, las 2 000
    // de cobertura con imputación múltiple, los diseños de survey sobre
    // la encuesta de Gnap y la post-estratificación del panel— viene
    // resuelto. En vivo solo se computan fórmulas cerradas: el sesgo
    // como producto de dos factores, la raíz del ECM, el R-indicator y
    // la reagrupación de escuelas en clases de ajuste.
    // ================================================================
    const D8 = DATOS_CAP8;

    // Formato español: espacio fino como separador de miles, coma decimal.
    function fmtNum(x, d = 2) {
      if (x === null || x === undefined || !isFinite(x)) return '—';
      const s = Math.abs(x).toFixed(d);
      const partes = s.split('.');
      const entero = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      return (x < 0 ? '−' : '') + entero + (partes[1] ? ',' + partes[1] : '');
    }

    function fmtPct(x, d = 1) { return fmtNum(100 * x, d) + ' %'; }

    // ---------------------------------------------------------------
    // M1 · Los cuatro mecanismos, medidos
    // ---------------------------------------------------------------
    SIMULADORES['mecanismos'] = function (raiz) {
      const M = D8.mecanismos;
      const params = { mecanismo: 1 };
      const lienzo = raiz.querySelector('canvas');

      const g = crearGraficoBarras(lienzo, M.nombres, M.sinAjuste, {
        etiqueta: 'sesgo sin ajustar', color: COLORES_GRAFICO.primario,
        barrasExtra: [{ etiqueta: 'sesgo tras ajustar por clases de x',
                        valores: M.conAjuste, color: COLORES_GRAFICO.secundario }],
        lineas: [{ etiqueta: '', valor: 0, color: COLORES_GRAFICO.gris }]
      });

      function pintar() {
        const i = params.mecanismo;
        // La barra seleccionada se destaca; las demás quedan atenuadas.
        g.data.datasets[0].backgroundColor = M.nombres.map((_, k) =>
          k === i ? '#012820' : 'rgba(1, 40, 32, 0.28)');
        g.data.datasets[1].backgroundColor = M.nombres.map((_, k) =>
          k === i ? '#FF6600' : 'rgba(255, 102, 0, 0.28)');
        g.update('none');

        const sin = M.sinAjuste[i], con = M.conAjuste[i];
        const elim = M.eliminado[i];
        const medible = Math.abs(sin) > 2 * M.eeSin[i];
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'mecanismo:', valor: M.nombres[i] },
          { etiqueta: 'sesgo sin ajustar:', valor: fmtNum(sin, 0) + ' acres (± ' +
            fmtNum(M.eeSin[i], 0) + ' de Monte Carlo)' },
          { etiqueta: 'sesgo tras ajustar:', valor: fmtNum(con, 0) + ' acres (± ' +
            fmtNum(M.eeCon[i], 0) + ')' },
          { etiqueta: '¿el sesgo es medible?:', valor: medible
            ? 'sí: supera dos veces el ruido' : 'no: está dentro del ruido de Monte Carlo' },
          { etiqueta: 'el ajuste elimina:', valor: elim === null ? '— (no había sesgo)'
            : fmtPct(elim, 1) + ' del sesgo' },
          { etiqueta: 'correlación de la propensión con y | con x:',
            valor: fmtNum(M.corPy[i], 3) + ' | ' + fmtNum(M.corPx[i], 3) }
        ]);
      }

      crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'mecanismo', etiqueta: 'Mecanismo (0 MCAR · 1 MAR · 2 MAR fino · 3 MNAR)',
          min: 0, max: 3, paso: 1 }
      ], params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M2 · Los dos factores del sesgo
    // ---------------------------------------------------------------
    SIMULADORES['sesgo'] = function (raiz) {
      const S = D8.sesgo, C = D8.nNoSalva;
      const params = { tasa: 0.4, brecha: 1.83 };
      const lienzo = raiz.querySelector('canvas');

      const g = crearGraficoXY(lienzo, [], {
        tituloX: 'tamaño de muestra n', tituloY: 'raíz del ECM (horas)'
      });

      function pintar() {
        const sesgo = (1 - params.tasa) * params.brecha;
        const sd = C.sdY;
        const ecm = C.n.map(n => ({ x: n, y: Math.sqrt(sd * sd / n + sesgo * sesgo) }));
        const soloEE = C.n.map(n => ({ x: n, y: sd / Math.sqrt(n) }));
        g.data.datasets = [
          { type: 'line', label: 'raíz del ECM (con sesgo)', data: ecm,
            borderColor: COLORES_GRAFICO.primario, borderWidth: 2, pointRadius: 0, fill: false },
          { type: 'line', label: 'error estándar solo', data: soloEE,
            borderColor: COLORES_GRAFICO.terciario, borderWidth: 1.6, borderDash: [5, 4],
            pointRadius: 0, fill: false },
          { type: 'line', label: 'el sesgo, que no depende de n',
            data: [{ x: C.n[0], y: Math.abs(sesgo) },
                   { x: C.n[C.n.length - 1], y: Math.abs(sesgo) }],
            borderColor: COLORES_GRAFICO.secundario, borderWidth: 1.6, borderDash: [2, 3],
            pointRadius: 0, fill: false }
        ];
        g.options.scales.x.type = 'logarithmic';
        g.options.scales.y.max = Math.max(1.4, Math.abs(sesgo) * 1.6);
        g.update('none');

        // n donde el error estándar iguala al sesgo: sd^2 / sesgo^2
        const nCruce = sesgo === 0 ? Infinity : Math.ceil(sd * sd / (sesgo * sesgo));
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'tasa de respuesta:', valor: fmtPct(params.tasa, 1) },
          { etiqueta: 'brecha entre grupos:', valor: fmtNum(params.brecha, 2) + ' horas' },
          { etiqueta: 'sesgo = (1 − R) × brecha:', valor: fmtNum(sesgo, 4) + ' horas' },
          { etiqueta: 'n donde el sesgo iguala al ee:', valor: isFinite(nCruce)
            ? fmtNum(nCruce, 0) + ' unidades' : 'nunca: no hay sesgo' },
          { etiqueta: 'raíz del ECM con n = 25 600:',
            valor: fmtNum(Math.sqrt(sd * sd / 25600 + sesgo * sesgo), 4) + ' horas' },
          { etiqueta: 'la encuesta de Gnap:', valor: 'R = ' + fmtPct(S.tasa, 1) +
            ', brecha ' + fmtNum(S.yR - S.yNR, 2) + ' h, sesgo ' + fmtNum(S.sesgo, 4) + ' h' }
        ]);
      }

      crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'tasa', etiqueta: 'Tasa de respuesta R', min: 0.05, max: 0.99, paso: 0.01 },
        { clave: 'brecha', etiqueta: 'Brecha ȳ_R − ȳ_NR (horas)', min: 0, max: 5, paso: 0.01 }
      ], params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M2 · El Literary Digest: correlación diminuta, desastre enorme
    // ---------------------------------------------------------------
    SIMULADORES['digest'] = function (raiz) {
      const L = D8.literary;
      const params = { rho: L.rho };
      const lienzo = raiz.querySelector('canvas');

      const g = crearGraficoXY(lienzo, [], {
        tituloX: 'tamaño n de un muestreo aleatorio simple',
        tituloY: 'raíz del ECM (proporción)'
      });

      function pintar() {
        const rho = params.rho;
        // ECM del "censo defectuoso": rho^2 (1-f)/f sigma^2, sin depender de n.
        const rmseDigest = Math.abs(rho) * Math.sqrt((1 - L.f) / L.f) * L.sigma;
        const mas = L.ns.map(n => ({ x: n, y: L.sigma / Math.sqrt(n) }));
        g.data.datasets = [
          { type: 'line', label: 'MAS de tamaño n', data: mas,
            borderColor: COLORES_GRAFICO.primario, borderWidth: 2, pointRadius: 0, fill: false },
          { type: 'line', label: 'Literary Digest (2 252 863 papeletas)',
            data: [{ x: L.ns[0], y: rmseDigest },
                   { x: L.ns[L.ns.length - 1], y: rmseDigest }],
            borderColor: COLORES_GRAFICO.secundario, borderWidth: 2, borderDash: [6, 4],
            pointRadius: 0, fill: false }
        ];
        g.options.scales.x.type = 'logarithmic';
        g.options.scales.y.type = 'logarithmic';
        g.update('none');

        const nEq = rho === 0 ? Infinity : L.f / ((1 - L.f) * rho * rho);
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'correlación entre responder y el voto:', valor: fmtNum(rho, 4) },
          { etiqueta: 'factor de cantidad √((1−f)/f):',
            valor: fmtNum(Math.sqrt((1 - L.f) / L.f), 3) + ' con f = ' + fmtPct(L.f, 2) },
          { etiqueta: 'error resultante:', valor: fmtNum(100 * rmseDigest, 2) + ' puntos porcentuales' },
          { etiqueta: 'MAS equivalente:', valor: isFinite(nEq)
            ? fmtNum(nEq, 1) + ' personas' : 'infinito: sin correlación, el censo es exacto' },
          { etiqueta: 'papeletas realmente devueltas:', valor: fmtNum(L.n, 0) },
          { etiqueta: 'lo que pasó en 1936:', valor: 'ρ = ' + fmtNum(L.rho, 4) + ' → error de ' +
            fmtNum(100 * L.sesgo, 1) + ' puntos, MAS equivalente ' + fmtNum(L.nEquivalente, 1) }
        ]);
      }

      crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'rho', etiqueta: 'Correlación ρ entre responder y la variable', min: 0, max: 0.3,
          paso: 0.002, decimales: 3 }
      ], params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M3 · Las 23 escuelas y sus clases de ajuste
    // ---------------------------------------------------------------
    SIMULADORES['clases'] = function (raiz) {
      const E = D8.clases.escuelas, OBJ = D8.clases.objetivo;
      const params = { clases: 3 };
      const lienzo = raiz.querySelector('canvas');
      // Las escuelas se ordenan por tamaño: así las clases son intervalos.
      const orden = E.school.map((_, i) => i).sort((a, b) => E.pop[a] - E.pop[b]);
      const etiquetas = orden.map(i => 'E' + E.school[i]);

      const g = crearGraficoBarras(lienzo, etiquetas, orden.map(i => E.tasa[i]), {
        etiqueta: 'tasa de respuesta', color: COLORES_GRAFICO.primario, min: 0, max: 1.05,
        lineas: [{ etiqueta: 'tasa global (0,398)', valor: D8.sesgo.tasa,
                   color: COLORES_GRAFICO.secundario }]
      });
      const PALETA = ['#012820', '#0e7490', '#FF6600', '#b45309', '#6b7280'];

      function pintar() {
        const k = params.clases;
        // Clases = k grupos consecutivos de escuelas ordenadas por tamaño.
        const asigna = orden.map((_, pos) => Math.min(k - 1, Math.floor(pos * k / orden.length)));
        g.data.datasets[0].backgroundColor = asigna.map(c => PALETA[c % PALETA.length]);
        g.update('none');

        // Estimación ajustada, reconstruida con la media y el n de cada escuela.
        const devu = new Array(k).fill(0), pop = new Array(k).fill(0);
        orden.forEach((i, pos) => { devu[asigna[pos]] += E.devu[i]; pop[asigna[pos]] += E.pop[i]; });
        const phi = devu.map((d, c) => d / pop[c]);
        let num = 0, den = 0;
        orden.forEach((i, pos) => {
          const w = 1 / phi[asigna[pos]];
          num += w * E.nObs[i] * E.media[i];
          den += w * E.nObs[i];
        });
        const est = num / den;
        const sinAjustar = D8.clases.estimaciones.valor[0];
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'clases de ajuste:', valor: k + (k === 1 ? ' (equivale a no ajustar)' : '') },
          { etiqueta: 'propensiones estimadas:', valor: phi.map(p => fmtNum(p, 3)).join(' · ') },
          { etiqueta: 'estimación ajustada:', valor: fmtNum(est, 4) + ' horas' },
          { etiqueta: 'sin ajustar:', valor: fmtNum(sinAjustar, 4) + ' horas' },
          { etiqueta: 'objetivo (dos fases):', valor: fmtNum(OBJ, 4) + ' horas' },
          { etiqueta: 'distancia al objetivo:', valor: fmtNum(Math.abs(est - OBJ), 4) +
            ' h · sin ajustar era ' + fmtNum(Math.abs(sinAjustar - OBJ), 4) + ' h' }
        ]);
      }

      crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'clases', etiqueta: 'Número de clases de ajuste por tamaño', min: 1, max: 5, paso: 1 }
      ], params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M4 · Qué corrige la calibración y qué cuesta
    // ---------------------------------------------------------------
    SIMULADORES['calibracion'] = function (raiz) {
      const C = D8.calibracion;
      const params = { margen: 2 };
      const lienzo = raiz.querySelector('canvas');
      const NOMBRES = ['Sexo', 'Edad (3 grupos)', 'Educación (3 niveles)'];
      const NIVELES = [['Hombre', 'Mujer'],
                       ['18–34', '35–64', '65+'],
                       ['Sin universidad', 'Universitaria', 'Posgrado']];

      const g = crearGraficoBarras(lienzo, NIVELES[2], C.margenes.encuesta[2], {
        etiqueta: 'panel', color: COLORES_GRAFICO.primario, min: 0, max: 0.6,
        barrasExtra: [{ etiqueta: 'población (ACS 2011)', valores: C.margenes.acs[2],
                        color: COLORES_GRAFICO.secundario }]
      });

      function pintar() {
        const m = params.margen;
        g.data.labels = NIVELES[m];
        g.data.datasets[0].data = C.margenes.encuesta[m];
        g.data.datasets[1].data = C.margenes.acs[m];
        g.options.scales.y.max = Math.max(...C.margenes.encuesta[m],
                                          ...C.margenes.acs[m]) * 1.25;
        g.update('none');

        const dif = C.margenes.encuesta[m].map((p, i) => p - C.margenes.acs[m][i]);
        const peor = dif.reduce((a, b, i) => Math.abs(b) > Math.abs(dif[a]) ? i : a, 0);
        // Efecto de la calibración sobre las cinco preguntas de frecuencia.
        const cambios = C.estimaciones.conPeso.map((v, i) =>
          Math.abs(v - C.estimaciones.sinPeso[i]));
        const iMax = cambios.indexOf(Math.max(...cambios));
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'margen de control:', valor: NOMBRES[m] },
          { etiqueta: 'desequilibrio mayor:', valor: NIVELES[m][peor] + ': panel ' +
            fmtPct(C.margenes.encuesta[m][peor], 1) + ' contra ' +
            fmtPct(C.margenes.acs[m][peor], 1) },
          { etiqueta: 'brecha máxima del margen:', valor: fmtNum(100 * Math.abs(dif[peor]), 1) +
            ' puntos porcentuales' },
          { etiqueta: 'pesos tras post-estratificar:', valor: 'razón ' + fmtNum(C.pesos.razon, 1) +
            ' a 1 · CV ' + fmtNum(C.pesos.cv, 3) },
          { etiqueta: 'precio en varianza (Kish):', valor: fmtNum(C.pesos.kish, 3) + ' = ' +
            fmtPct(C.pesos.kish - 1, 0) + ' extra' },
          { etiqueta: 'lo que más mueve la calibración:', valor: C.estimaciones.variable[iMax] +
            ': ' + fmtNum(C.estimaciones.sinPeso[iMax], 3) + ' → ' +
            fmtNum(C.estimaciones.conPeso[iMax], 3) }
        ]);
      }

      crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'margen', etiqueta: 'Margen (0 sexo · 1 edad · 2 educación)', min: 0, max: 2, paso: 1 }
      ], params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M5 · Los cuatro métodos sobre las mismas 20 filas
    // ---------------------------------------------------------------
    SIMULADORES['imputacion'] = function (raiz) {
      const I = D8.imputacion, P = I.personas;
      const params = { metodo: 2 };
      const lienzo = raiz.querySelector('canvas');
      const NOMBRES = ['Casos completos', 'Media', 'Hot-deck', 'Regresión', 'Múltiple (1.ª)'];
      const VAL = I.metodos.valoresImputados;
      const IMPUTADOS = [null, VAL.media, VAL.hotdeck, VAL.regresion, VAL.multiple[0]];
      // Índices, en el archivo, de las personas a las que les falta education.
      const falta = P.person.map((p, i) => I.metodos.quienesFaltan.includes(p) ? i : -1)
                            .filter(i => i >= 0);
      const observados = P.person.map((_, i) => i).filter(i => !falta.includes(i));
      const b = I.metodos.coefs.valor;   // (Intercepto, age, genderM)

      const g = crearGraficoXY(lienzo, [], {
        tituloX: 'edad (años)', tituloY: 'años de educación'
      });

      function pintar() {
        const m = params.metodo;
        const datasets = [
          { type: 'scatter', label: 'observados',
            data: observados.map(i => ({ x: P.age[i], y: P.education[i] })),
            backgroundColor: COLORES_GRAFICO.primario, pointRadius: 5 },
          { type: 'line', label: 'recta de regresión (hombres)',
            data: [20, 60].map(a => ({ x: a, y: b[0] + b[1] * a + b[2] })),
            borderColor: COLORES_GRAFICO.gris, borderDash: [5, 4], borderWidth: 1.4,
            pointRadius: 0, fill: false },
          { type: 'line', label: 'recta de regresión (mujeres)',
            data: [20, 60].map(a => ({ x: a, y: b[0] + b[1] * a })),
            borderColor: COLORES_GRAFICO.terciario, borderDash: [5, 4], borderWidth: 1.4,
            pointRadius: 0, fill: false }
        ];
        if (IMPUTADOS[m]) {
          datasets.push({
            type: 'scatter', label: 'imputados',
            data: falta.map((i, k) => ({ x: P.age[i], y: IMPUTADOS[m][k] })),
            backgroundColor: COLORES_GRAFICO.secundario, pointRadius: 7,
            pointStyle: 'triangle'
          });
        }
        g.data.datasets = datasets;
        g.options.scales.y.beginAtZero = false;
        g.options.scales.y.min = 8; g.options.scales.y.max = 22;
        g.update('none');

        const iMet = m === 4 ? 4 : m;
        const enteros = IMPUTADOS[m] ? IMPUTADOS[m].every(v => Math.abs(v - Math.round(v)) < 1e-9) : true;
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'método:', valor: NOMBRES[m] },
          { etiqueta: 'valores imputados:', valor: IMPUTADOS[m]
            ? IMPUTADOS[m].map(v => fmtNum(v, 2)).join(' · ') : '— (se descartan las 3 filas)' },
          { etiqueta: '¿son valores que alguien tiene?:', valor: m === 2 ? 'sí: copiados de un donante real'
            : (enteros ? 'sí, por casualidad' : 'no: son años de educación con decimales') },
          { etiqueta: 'media resultante:', valor: fmtNum(I.metodos.media[iMet], 4) + ' años' },
          { etiqueta: 'desviación típica:', valor: fmtNum(I.metodos.sd[iMet], 4) +
            ' (con casos completos: ' + fmtNum(I.metodos.sd[0], 4) + ')' },
          { etiqueta: 'ee que reportaría:', valor: fmtNum(I.eeReportado.ee[iMet], 4) +
            (iMet > 0 && iMet < 4 ? ' — menor que el de tirar las filas' : '') }
        ]);
      }

      crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'metodo', etiqueta: 'Método (0 completos · 1 media · 2 hot-deck · 3 regresión · 4 múltiple)',
          min: 0, max: 4, paso: 1 }
      ], params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M6 · Cobertura y anchura de los tres intervalos
    // ---------------------------------------------------------------
    SIMULADORES['cobertura'] = function (raiz) {
      const C = D8.cobertura;
      const params = { vista: 0 };
      const lienzo = raiz.querySelector('canvas');

      const g = crearGraficoBarras(lienzo, C.nombres, C.coberturas, {
        etiqueta: 'cobertura empírica', color: COLORES_GRAFICO.primario, min: 0.8, max: 1,
        lineas: [{ etiqueta: 'nominal 95 %', valor: 0.95, color: COLORES_GRAFICO.secundario }]
      });

      function pintar() {
        const cob = params.vista === 0;
        g.data.datasets[0].data = cob ? C.coberturas : C.anchos;
        g.data.datasets[0].label = cob ? 'cobertura empírica' : 'anchura media del intervalo';
        g.data.datasets[0].backgroundColor = C.nombres.map((_, i) =>
          i === 1 ? '#b91c1c' : COLORES_GRAFICO.primario);
        g.data.datasets[1].data = C.nombres.map(() => cob ? 0.95 : null);
        g.data.datasets[1].label = cob ? 'nominal 95 %' : '';
        g.options.scales.y.min = cob ? 0.8 : 0;
        g.options.scales.y.max = cob ? 1 : Math.max(...C.anchos) * 1.15;
        g.update('none');

        const perdida = C.coberturas[0] - C.coberturas[1];
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'vista:', valor: cob ? 'cobertura empírica' : 'anchura media del intervalo' },
          { etiqueta: 'datos completos (referencia):', valor: fmtPct(C.coberturas[0], 2) +
            ' — no es 95 % por la asimetría de acres92' },
          { etiqueta: 'imputación única:', valor: fmtPct(C.coberturas[1], 2) + ', ' +
            fmtNum(100 * perdida, 1) + ' puntos por debajo de la referencia' },
          { etiqueta: 'imputación múltiple:', valor: fmtPct(C.coberturas[2], 2) + ', recupera ' +
            fmtNum(100 * (C.coberturas[2] - C.coberturas[1]), 1) + ' puntos' },
          { etiqueta: 'anchuras (completos · única · múltiple):',
            valor: C.anchos.map(a => fmtNum(a, 0)).join(' · ') },
          { etiqueta: 'error de Monte Carlo:', valor: '± ' + fmtNum(100 * C.eeMonteCarlo, 2) +
            ' puntos con ' + fmtNum(C.M, 0) + ' réplicas' }
        ]);
      }

      crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'vista', etiqueta: 'Qué mostrar (0 cobertura · 1 anchura)', min: 0, max: 1, paso: 1 }
      ], params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M7 · La misma tasa, dos encuestas distintas
    // ---------------------------------------------------------------
    SIMULADORES['rindicator'] = function (raiz) {
      const G = D8.diagnostico, E = G.escuelas;
      const params = { homogeneidad: 0 };
      const lienzo = raiz.querySelector('canvas');
      const totalPop = E.pop.reduce((a, b) => a + b, 0);
      const orden = E.school.map((_, i) => i).sort((a, b) => E.tasa[a] - E.tasa[b]);
      const pesos = orden.map(i => E.pop[i] / totalPop);

      const g = crearGraficoBarras(lienzo, orden.map(i => 'E' + E.school[i]),
        orden.map(i => E.tasa[i]), {
          etiqueta: 'propensión a responder', color: COLORES_GRAFICO.primario, min: 0, max: 1.05,
          lineas: [{ etiqueta: 'tasa global (no se mueve)', valor: G.tasaGlobal,
                     color: COLORES_GRAFICO.secundario }]
        });

      function pintar() {
        const lam = params.homogeneidad;
        const p = orden.map(i => (1 - lam) * E.tasa[i] + lam * G.tasaGlobal);
        g.data.datasets[0].data = p;
        g.update('none');

        // R-indicator recalculado en vivo, ponderando por tamaño de escuela.
        const pbar = p.reduce((a, v, k) => a + pesos[k] * v, 0);
        const s = Math.sqrt(p.reduce((a, v, k) => a + pesos[k] * (v - pbar) * (v - pbar), 0));
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'homogeneidad aplicada:', valor: fmtPct(lam, 0) },
          { etiqueta: 'tasa global de respuesta:', valor: fmtPct(pbar, 2) +
            ' — idéntica en todo el recorrido' },
          { etiqueta: 'propensión mínima / máxima:',
            valor: fmtPct(Math.min(...p), 1) + ' / ' + fmtPct(Math.max(...p), 1) },
          { etiqueta: 'desviación típica de la propensión:', valor: fmtNum(s, 4) },
          { etiqueta: 'R-indicator = 1 − 2·S(φ):', valor: fmtNum(1 - 2 * s, 4) },
          { etiqueta: 'la encuesta real:', valor: 'R = ' + fmtNum(G.R, 4) +
            ', tasas de ' + fmtPct(G.minTasa, 1) + ' (E' + G.escuelaMin + ') a ' +
            fmtPct(G.maxTasa, 0) + ' (E' + G.escuelaMax + ')' }
        ]);
      }

      crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'homogeneidad', etiqueta: 'Homogeneizar las tasas (0 reales · 1 todas iguales)',
          min: 0, max: 1, paso: 0.05 }
      ], params, pintar);
      pintar();
      return [g];
    };

    // ================================================================
    // Tabla-ranking del módulo 6: los cinco métodos de imputación
    // ================================================================
    TABLAS_RANKING['metodos'] = function () {
      const I = D8.imputacion, R = I.rubin;
      const eeHonesto = I.eeReportado.ee[0];   // el de casos completos
      return {
        descripcion: 'Los cinco tratamientos del hueco, con lo que cada uno estima y con el error ' +
          'estándar que reportaría si se le creyera. Ordena por «ee reportado» y compara con la ' +
          'columna de la derecha: los tres métodos de imputación única declaran MENOS incertidumbre ' +
          'que tirar las filas incompletas, habiendo inventado tres valores.',
        columnas: [
          { clave: 'metodo', titulo: 'Método', tipo: 'texto' },
          { clave: 'media', titulo: 'Media estimada', decimales: 4 },
          { clave: 'sd', titulo: 'Desviación típica', decimales: 4, mejor: 'mayor' },
          { clave: 'ee', titulo: 'ee reportado', decimales: 4, mejor: 'mayor' },
          { clave: 'honesto', titulo: '¿Declara lo que no sabe?', tipo: 'texto' }
        ],
        filas: [
          { metodo: 'Casos completos (n = 17)', media: I.metodos.media[0], sd: I.metodos.sd[0],
            ee: I.eeReportado.ee[0], honesto: 'sí, pero descarta 3 filas' },
          { metodo: 'Media', media: I.metodos.media[1], sd: I.metodos.sd[1],
            ee: I.eeReportado.ee[1], honesto: 'no: aplasta la dispersión' },
          { metodo: 'Hot-deck', media: I.metodos.media[2], sd: I.metodos.sd[2],
            ee: I.eeReportado.ee[2], honesto: 'no: trata el donante como dato' },
          { metodo: 'Regresión', media: I.metodos.media[3], sd: I.metodos.sd[3],
            ee: I.eeReportado.ee[3], honesto: 'no: pone todo sobre la recta' },
          { metodo: 'Múltiple (m = 5, Rubin)', media: I.metodos.media[4], sd: I.metodos.sd[4],
            ee: R.ee, honesto: 'sí: suma la varianza entre imputaciones' }
        ],
        inicial: 'ee',
        destacada: 'Múltiple (m = 5, Rubin)',
        pie: 'La imputación múltiple es la única cuyo error estándar (' +
          R.ee.toFixed(4).replace('.', ',') + ') supera al de los casos completos (' +
          eeHonesto.toFixed(4).replace('.', ',') + '): reconoce que tres de las veinte respuestas ' +
          'son conjeturas. Los otros tres métodos reportan entre 0,54 y 0,55, es decir, MÁS ' +
          'confianza por haber tenido MENOS datos. Fíjate también en que las cinco medias ' +
          'estimadas se parecen: el problema nunca fue el punto, sino el intervalo.'
      };
    };

    // ================================================================
    // Árbol del error total del módulo 10: el curso entero
    // ================================================================
    ARBOLES_ERROR['repaso'] = {
      titulo: 'El error total de una encuesta, con los ocho capítulos dentro',
      intro: 'La misma estructura del capítulo 1, ahora con la herramienta que ataca cada rama. ' +
        'Pulsa una hoja: el campo «¿ayuda más muestra?» es el que separa las dos mitades del curso.',
      nota: 'Los capítulos 2 a 7 viven casi enteros en la rama de la izquierda. La rama de la ' +
        'derecha se gana o se pierde <strong>antes</strong> de recoger un dato — y este capítulo ' +
        'es lo único que se puede hacer después.',
      raiz: {
        etiqueta: 'Error total de encuesta',
        resumen: 'La distancia entre lo que se publica y el valor verdadero en la población objetivo. ' +
          'Se descompone en dos mitades que se combaten con herramientas distintas.',
        hijos: [
          {
            etiqueta: 'Error de muestreo (varianza)',
            resumen: 'La estimación baila de muestra en muestra alrededor del valor correcto. Es el ' +
              'error que el diseño controla y que las fórmulas del curso cuantifican.',
            hijos: [
              {
                etiqueta: 'Variabilidad del diseño',
                resumen: 'Cada diseño tiene su varianza: MAS, estratificado, conglomerados, PPT. ' +
                  'Elegir bien puede dividirla por varios factores sin gastar más.',
                efecto: 'varianza', nAyuda: true, donde: 'Capítulos 2, 4, 5 y 6',
                ejemplo: 'la asignación de Neyman sobre $agpop$ frente a la proporcional.'
              },
              {
                etiqueta: 'Pesos desiguales',
                resumen: 'Pesos muy distintos entre sí inflan la varianza aunque no sesguen nada. Lo ' +
                  'mide el deff de Kish, y aparece cada vez que se ajusta o se calibra.',
                efecto: 'varianza', nAyuda: true, donde: 'Capítulos 7 y 8',
                ejemplo: 'el panel calibrado a la ACS: Kish 1,399, un 40 % de varianza extra.'
              },
              {
                etiqueta: 'Correlación intraclase',
                resumen: 'Las unidades de un mismo conglomerado se parecen, así que aportan menos ' +
                  'información de la que su número sugiere. Es la fuente de deff más cara del curso.',
                efecto: 'varianza', nAyuda: true, donde: 'Capítulos 5 y 7',
                ejemplo: 'el deff de NHANES saltando de 1,71 a 6,92 al declarar los conglomerados.'
              },
              {
                etiqueta: 'Varianza añadida por imputar',
                resumen: 'Los valores imputados no son datos, y la incertidumbre que añaden es real. ' +
                  'Ignorarla no la elimina: solo la esconde del intervalo.',
                efecto: 'varianza', nAyuda: false, donde: 'Capítulo 8, módulo 6',
                ejemplo: 'la cobertura cayendo del 92,7 % al 87,2 % por imputar una sola vez.'
              }
            ]
          },
          {
            etiqueta: 'Error no muestral (sesgo)',
            resumen: 'La estimación está desplazada: repetir el estudio mil veces da mil respuestas ' +
              'centradas en el sitio equivocado. Aquí es donde $n$ deja de servir.',
            hijos: [
              {
                etiqueta: 'Error de cobertura',
                resumen: 'El marco no es la población: hay unidades que no pudieron ser sorteadas ' +
                  'nunca. Ningún estimador arregla lo que no estaba en la lista.',
                efecto: 'sesgo', nAyuda: false, donde: 'Capítulo 1, módulo 4',
                ejemplo: 'las listas de teléfono y automóviles del <em>Literary Digest</em> en 1936.'
              },
              {
                etiqueta: 'No respuesta de unidad',
                resumen: 'Los sorteados que no contestan. Sesga en proporción a $(1-R)$ y a la ' +
                  'brecha entre los dos grupos; se corrige ponderando solo si el mecanismo es MAR.',
                efecto: 'sesgo', nAyuda: false, donde: 'Capítulo 8, módulos 2 a 4',
                ejemplo: 'los profesores de Gnap: $-1{,}10$ horas semanales, con $R = 0{,}398$.'
              },
              {
                etiqueta: 'No respuesta de ítem',
                resumen: 'Preguntas en blanco dentro de cuestionarios devueltos. Se trata imputando, ' +
                  'y el sesgo residual depende del mismo mecanismo que la de unidad.',
                efecto: 'ambos', nAyuda: false, donde: 'Capítulo 8, módulos 5 y 6',
                ejemplo: 'los 24 profesores de 310 que no declararon minutos de preparación.'
              },
              {
                etiqueta: 'Error de medición',
                resumen: 'La respuesta registrada no es el valor verdadero: preguntas ambiguas, ' +
                  'deseabilidad social, errores de captura. No lo toca ninguna fórmula del curso.',
                efecto: 'ambos', nAyuda: false, donde: 'Capítulo 1, módulos 5 y 6',
                ejemplo: 'el efecto del enunciado en las dos versiones de la misma pregunta.'
              },
              {
                etiqueta: 'Sesgo del estimador',
                resumen: 'Algunos estimadores son sesgados por construcción, aunque el diseño sea ' +
                  'perfecto. Es el único sesgo del árbol que $n$ sí reduce.',
                efecto: 'sesgo', nAyuda: true, donde: 'Capítulo 3, módulo 3',
                ejemplo: 'el estimador de razón: $-38\\,963$ acres con $n = 300$, y menos con $n$ mayor.'
              }
            ]
          }
        ]
      }
    };

    // ================================================================
    // Rúbrica del módulo 8: el proyecto integrador
    // ================================================================
    RUBRICAS['proyecto'] = {
      titulo: 'Proyecto integrador: diseño y análisis de una encuesta por muestreo',
      intro: 'Seis criterios, cuatro niveles, 100 puntos. Cada nivel describe <strong>lo que hay que ver ' +
        'en el trabajo</strong>, no una impresión general. Pulsa un criterio para leer sus cuatro niveles.',
      criterios: [
        {
          clave: 'C1', nombre: 'Justificación del diseño', puntos: 25,
          foco: 'Mide si la elección del diseño <strong>se sigue de un cálculo</strong> o solo se declara. ' +
            'Un equipo que use MAS puede sacar la mejor nota si argumenta por qué estratificar no compensaba.',
          niveles: [
            { nombre: 'Sobresaliente', rango: '23–25', observa: 'Compara al menos dos diseños alternativos y <strong>cuantifica</strong> la diferencia (varianza esperada, costo o ambos). La elección se sigue del cálculo.' },
            { nombre: 'Competente', rango: '18–22', observa: 'Justifica el diseño elegido con un argumento correcto y menciona alternativas, pero sin cuantificarlas.' },
            { nombre: 'En desarrollo', rango: '12–17', observa: 'Elige un diseño razonable y lo describe bien, pero la justificación es genérica: «el estratificado es más preciso».' },
            { nombre: 'Insuficiente', rango: '0–11', observa: 'No justifica, o el diseño elegido no corresponde a la estructura de la población.' }
          ]
        },
        {
          clave: 'C2', nombre: 'Marco muestral y cobertura', puntos: 15,
          foco: 'Mide si el equipo distingue el <strong>marco</strong> de la <strong>población objetivo</strong> ' +
            'y razona el sesgo de la diferencia. Es el capítulo 1 aplicado al trabajo propio.',
          niveles: [
            { nombre: 'Sobresaliente', rango: '14–15', observa: 'Describe el marco, identifica qué unidades de la población objetivo quedan fuera y <strong>razona la dirección del sesgo</strong> que eso produce.' },
            { nombre: 'Competente', rango: '11–13', observa: 'Describe el marco y reconoce que no coincide con la población objetivo, sin analizar el efecto.' },
            { nombre: 'En desarrollo', rango: '7–10', observa: 'Describe el marco pero lo trata como si fuera la población.' },
            { nombre: 'Insuficiente', rango: '0–6', observa: 'No hay marco identificable, o el «marco» es quien respondió.' }
          ]
        },
        {
          clave: 'C3', nombre: 'Corrección técnica de la estimación', puntos: 25,
          foco: 'Mide si el estimador y su varianza corresponden al diseño declarado, y si los pesos son ' +
            'de verdad $1/\\pi_k$ con sus ajustes.',
          niveles: [
            { nombre: 'Sobresaliente', rango: '23–25', observa: 'Estimador y varianza coherentes con el diseño; pesos correctamente construidos; <strong>verificado por dos vías</strong> (fórmula y <code>survey</code>, o simulación).' },
            { nombre: 'Competente', rango: '18–22', observa: 'Estimador y varianza correctos para el diseño, verificados una vez.' },
            { nombre: 'En desarrollo', rango: '12–17', observa: 'El estimador puntual es correcto pero la varianza ignora algún componente del diseño.' },
            { nombre: 'Insuficiente', rango: '0–11', observa: 'Analiza la muestra como si fuera aleatoria simple sin serlo, o los pesos no corresponden a $1/\\pi_k$.' }
          ]
        },
        {
          clave: 'C4', nombre: 'Reporte de incertidumbre', puntos: 15,
          foco: 'Mide si toda estimación viaja con su error estándar y su intervalo, y si se interpretan ' +
            'en términos del problema y no de la fórmula.',
          niveles: [
            { nombre: 'Sobresaliente', rango: '14–15', observa: 'Error estándar e IC correctos, con DEFF cuando el diseño lo pide, e <strong>interpretación en términos del problema</strong>.' },
            { nombre: 'Competente', rango: '11–13', observa: 'Error estándar e IC correctos y bien presentados.' },
            { nombre: 'En desarrollo', rango: '7–10', observa: 'Reporta incertidumbre pero la interpreta mal (por ejemplo, «hay un 95 % de probabilidad de que el parámetro esté en el intervalo», sin matizar).' },
            { nombre: 'Insuficiente', rango: '0–6', observa: 'Presenta estimaciones puntuales sin incertidumbre.' }
          ]
        },
        {
          clave: 'C5', nombre: 'Limitaciones y honestidad', puntos: 10,
          foco: 'El criterio que más enseña. Mide si el equipo dice qué <strong>no</strong> puede concluirse, ' +
            'documenta su no respuesta y no extrapola fuera de la población muestreada.',
          niveles: [
            { nombre: 'Sobresaliente', rango: '9–10', observa: 'Declara qué <strong>no</strong> puede concluirse con este diseño; documenta la no respuesta y su posible efecto; no extrapola fuera de la población muestreada.' },
            { nombre: 'Competente', rango: '7–8', observa: 'Menciona limitaciones reales del estudio.' },
            { nombre: 'En desarrollo', rango: '4–6', observa: 'Limitaciones genéricas de manual, no las suyas.' },
            { nombre: 'Insuficiente', rango: '0–3', observa: 'Presenta los resultados como más concluyentes de lo que el diseño permite.' }
          ]
        },
        {
          clave: 'C6', nombre: 'Comunicación, sustentación y uso de IA', puntos: 10,
          foco: 'Mide la claridad del informe dentro del límite de páginas, la solidez al defender decisiones ' +
            'propias, y la declaración <em>con verificación</em> del uso de asistentes.',
          niveles: [
            { nombre: 'Sobresaliente', rango: '9–10', observa: 'Informe claro dentro del límite de páginas; responde con solidez a preguntas sobre decisiones de diseño; declara el uso de IA y <strong>muestra la verificación</strong> que hizo.' },
            { nombre: 'Competente', rango: '7–8', observa: 'Informe claro; responde correctamente; declara el uso de IA.' },
            { nombre: 'En desarrollo', rango: '4–6', observa: 'Informe desordenado o excedido, o el equipo no sabe defender decisiones que están en su propio trabajo.' },
            { nombre: 'Insuficiente', rango: '0–3', observa: 'No sustenta, o usó IA sin declararlo.' }
          ]
        }
      ],
      anulan: [
        'El diseño <strong>no es probabilístico</strong>: no puede escribirse $\\pi_k$ para cada unidad de la ' +
          'población. El trabajo se devuelve para rehacer y se califica sobre el máximo del nivel «En desarrollo».',
        '<strong>Datos inventados</strong>, o una muestra que no se recogió: fraude académico, con el ' +
          'procedimiento institucional que corresponda.'
      ],
      nota: 'Se entrega junto con el enunciado en la semana 9. Una rúbrica que se conoce después de trabajar ' +
        'no orienta a nadie.'
    };

    // ================================================================
    // Glosario de notación del capítulo 8
    // ================================================================
    GLOSARIOS['norespuesta'] = {
      titulo: 'Glosario de notación · no respuesta, ponderación e imputación',
      nota: 'Lohr escribe la no respuesta en términos de <em>respondientes</em> y <em>no respondientes</em>; ' +
        'Gutiérrez, en términos de la <em>propensión de respuesta</em> como segunda fase de un diseño. ' +
        'Son la misma cosa: el conjunto de respondientes es una segunda muestra, con su propio diseño ' +
        'desconocido, dentro de la muestra que sí se eligió.',
      filas: [
        { concepto: 'Indicador de respuesta', aqui: 'R_k', lohr: 'R_i', gutierrez: '\\delta_k', r: 'is.na(y)' },
        { concepto: 'Propensión a responder', aqui: '\\phi_k', lohr: '\\phi_i', gutierrez: 'q_k',
          r: 'glm(R ~ x, family = binomial)' },
        { concepto: 'Tasa de respuesta', aqui: 'R', lohr: 'M_R/M', gutierrez: '\\bar q', r: 'mean(R)' },
        { concepto: 'Media de los respondientes', aqui: '\\bar y_R', lohr: '\\bar y_R', gutierrez: '\\bar y_r',
          r: 'mean(y, na.rm = TRUE)' },
        { concepto: 'Clase de ajuste', aqui: 'c', lohr: '\\text{clase } c', gutierrez: 'U_g',
          r: 'cut(x, cortes)' },
        { concepto: 'Peso de diseño', aqui: 'd_k = 1/\\pi_k', lohr: '1/\\pi_i', gutierrez: 'd_k',
          r: 'weights(design)' },
        { concepto: 'Peso ajustado por no respuesta', aqui: 'w_k = d_k/\\hat\\phi_c', lohr: 'w_i',
          gutierrez: 'd_k/\\hat q_k', r: 'd / phi[clase]' },
        { concepto: 'Peso calibrado', aqui: 'w_k^{\\text{cal}}', lohr: 'w_i^{*}', gutierrez: 'w_k',
          r: 'postStratify(), rake(), calibrate()' },
        { concepto: 'Sesgo de no respuesta', aqui: '(1-R)(\\bar y_R - \\bar y_{NR})',
          lohr: '\\text{sesgo}(\\bar y_R)', gutierrez: '\\text{Sesgo}', r: '(1 - R) * (yR - yNR)' },
        { concepto: 'Valor imputado', aqui: '\\tilde y_k', lohr: '\\tilde y_i', gutierrez: '\\hat y_k',
          r: 'y[falta] <- ...' },
        { concepto: 'Varianza entre imputaciones', aqui: 'B', lohr: 'B', gutierrez: 'B_m',
          r: 'var(sapply(imps, mean))' },
        { concepto: 'Varianza total de Rubin', aqui: 'T = \\bar U + (1+1/m)B', lohr: 'T',
          gutierrez: 'V_{\\text{tot}}', r: 'vcov(MIcombine(...))' }
      ]
    };

    // ================================================================
    // Autoevaluación del capítulo 8
    // ================================================================
    AUTOEVALUACIONES['cap8'] = [
      {
        tipo: 'numerica',
        modulo: 1,
        pregunta: 'De los 754 profesores a los que llegó el cuestionario, 310 lo devolvieron. ¿Cuál es la tasa de respuesta, en porcentaje? Un decimal.',
        pista: 'Devueltos sobre enviados, por cien.',
        respuesta: 41.1,
        tolerancia: 0.15,
        retroAcierto: '41,1 %. En el estrato grande baja al 39,8 % y en el pequeño/mediano sube al 47,6 %. Una tasa así, hoy, haría que muchas revistas rechazaran el estudio — y el problema no es la tasa en sí, sino que nadie sabría cuánto sesga si Gnap no hubiera perseguido a los ausentes.',
        retroFallo: '$310/754 = 0{,}4111$, es decir, 41,1 %. Si te salió 39,8 usaste solo el estrato grande (250 de 628), que es el que tiene submuestra de no respondientes.'
      },
      {
        tipo: 'opcion',
        modulo: 1,
        pregunta: 'En la encuesta de profesores, 24 de los 310 cuestionarios devueltos dejaron en blanco <code>preprmin</code>. ¿Qué tipo de no respuesta es, y con qué se trata?',
        pista: '¿La unidad aportó datos o no aportó ninguno?',
        opciones: [
          { texto: 'De ítem: la unidad respondió pero dejó huecos. Se trata imputando.', correcta: true,
            retro: 'Correcto. Y la distinción no es académica: ponderar no serviría de nada aquí, porque el profesor sí está en el archivo con sus otras respuestas — lo que falta es una casilla, no una fila.' },
          { texto: 'De unidad: falta información, así que la unidad no respondió. Se trata ponderando.', correcta: false,
            retro: 'La unidad SÍ respondió: devolvió el cuestionario con las otras tres variables contestadas. Si se la tratara como no respondiente se perderían esos datos y además se contaría dos veces el mismo problema.' },
          { texto: 'De unidad, pero se trata imputando porque es un solo valor.', correcta: false,
            retro: 'El tratamiento es correcto pero la clasificación no, y eso importa: la tasa de respuesta de la encuesta es del 41,1 %, no del 33 %. Mezclar las dos no respuestas en una sola tasa es un error de reporte frecuente.' },
          { texto: 'Ninguna de las dos: 24 de 310 es un porcentaje despreciable.', correcta: false,
            retro: 'Un 7,7 % de faltantes en una variable no es despreciable, y sobre todo no se sabe si lo es hasta comprobar quiénes son los que no contestaron. El módulo 6 mide lo que cuesta rellenarlos mal.' }
        ]
      },
      {
        tipo: 'multiple',
        modulo: 1,
        pregunta: 'La simulación de los cuatro mecanismos dio: MCAR sin sesgo, MAR con el 100,4 % del sesgo eliminado por el ajuste, «MAR fino» con el 81,6 % y MNAR con el −1,1 %. Marca <strong>todo</strong> lo que sea cierto.',
        pista: 'Fíjate en de qué depende la propensión en cada caso y qué ve el ajuste.',
        opciones: [
          { texto: 'Bajo MAR con clases correctas, el ajuste por clases elimina el sesgo entero.', correcta: true },
          { texto: 'Bajo MNAR, el ajuste por clases de $x$ no sirve de nada.', correcta: true },
          { texto: 'Si la propensión varía DENTRO de las clases, el ajuste corrige solo en parte.', correcta: true },
          { texto: 'Con MCAR el ajuste es imprescindible para no sesgar.', correcta: false }
        ],
        retroAcierto: 'Las tres primeras. La cuarta es falsa: bajo MCAR la media de los respondientes ya es insesgada y el ajuste no aporta nada — solo desiguala los pesos y añade varianza. Ajustar «por si acaso» tiene precio.',
        retroFallo: 'Son las tres primeras. La cuarta describe justo lo contrario: MCAR es el único caso en que no hay nada que corregir, y ajustar solo cuesta varianza.'
      },
      {
        tipo: 'numerica',
        modulo: 2,
        pregunta: 'Con $R = 0{,}40$ y una brecha $\\bar y_R - \\bar y_{NR} = 2{,}5$ horas, ¿cuánto vale el sesgo? Dos decimales.',
        pista: 'Es un producto de dos factores: $(1-R)$ por la brecha.',
        respuesta: 1.5,
        tolerancia: 0.02,
        retroAcierto: '$(1-0{,}40)\\times 2{,}5 = 1{,}50$ horas. Nótese que $n$ no aparece por ningún lado: la fórmula es una identidad sobre la población finita, no un resultado asintótico.',
        retroFallo: 'Es $(1 - R)(\\bar y_R - \\bar y_{NR}) = 0{,}60 \\times 2{,}5 = 1{,}50$. Si te salió 1,00 multiplicaste por $R$ en vez de por $1-R$: el factor es la proporción que FALTA.'
      },
      {
        tipo: 'opcion',
        modulo: 2,
        pregunta: 'La encuesta del <em>Literary Digest</em> recibió 2 252 863 papeletas y tuvo la precisión de un muestreo aleatorio simple de unas 6 personas. ¿Qué explica esa cifra?',
        pista: 'Mira los tres factores de la identidad de Meng y cuál de ellos crece con el tamaño.',
        opciones: [
          { texto: 'Una correlación de 0,093 entre responder y el voto, multiplicada por $\\sqrt{(1-f)/f} = 4{,}33$: el factor de cantidad amplifica el defecto en vez de compensarlo.', correcta: true,
            retro: 'Exacto, y es lo contrarintuitivo: cuantas más papeletas se recogen sin controlar el mecanismo, MÁS grande es el factor que multiplica a la correlación. El tamaño no compra precisión; compra confianza injustificada.' },
          { texto: 'La muestra era pequeña en relación con los 44 millones de votantes.', correcta: false,
            retro: 'Al contrario: era el 5,07 % del electorado de los dos partidos, una fracción enorme para una encuesta. El problema no fue el tamaño sino el mecanismo de respuesta.' },
          { texto: 'Un error de cálculo de la revista al tabular las papeletas.', correcta: false,
            retro: 'No hubo error de tabulación. La revista contó correctamente papeletas que provenían de un conjunto sistemáticamente distinto del electorado, que es un problema de diseño y no de aritmética.' },
          { texto: 'La varianza de una proporción es máxima cerca de 0,5, y el resultado estaba cerca.', correcta: false,
            retro: 'Eso afecta a $\\sigma_y$, que aquí vale 0,484 y es solo uno de los tres factores. Aunque $\\sigma_y$ fuera la mitad, el error seguiría siendo de casi diez puntos.' }
        ]
      },
      {
        tipo: 'numerica',
        modulo: 3,
        pregunta: 'Una clase de ajuste tiene 200 unidades sorteadas y responden 80. ¿Por qué factor se multiplica el peso de diseño de cada respondiente de esa clase? Dos decimales.',
        pista: 'El ajuste es $1/\\hat\\phi_c$ con $\\hat\\phi_c$ la proporción que respondió en la clase.',
        respuesta: 2.5,
        tolerancia: 0.02,
        retroAcierto: '$\\hat\\phi_c = 80/200 = 0{,}40$, luego el factor es $1/0{,}40 = 2{,}50$. Cada respondiente carga con el peso de dos personas y media: el suyo y el de los que no contestaron.',
        retroFallo: 'El factor es $1/\\hat\\phi_c = 200/80 = 2{,}50$. Si respondiste 0,40 diste la propensión, que es el denominador del ajuste, no el ajuste.'
      },
      {
        tipo: 'opcion',
        modulo: 3,
        pregunta: 'Sobre la encuesta de Gnap: sin ajustar 34,63 h, ajustando por tamaño de escuela 34,37 h, con una clase por escuela 33,82 h, y la verdad aproximada 35,73 h. ¿Qué se concluye?',
        pista: 'Compara cada estimación con el objetivo y pregúntate qué supuesto necesita el ajuste.',
        opciones: [
          { texto: 'Que el mecanismo es MNAR respecto a las variables disponibles: el tamaño de la escuela no captura lo que hace que un profesor no conteste.', correcta: true,
            retro: 'Correcto. Lo que impide contestar es la carga de trabajo del propio profesor —la variable de interés—, y ninguna variable de escuela la ve. Ajustar aquí solo mueve la estimación al azar y añade varianza: el deff de Kish sube a 1,61.' },
          { texto: 'Que el ajuste está mal programado: debería acercarse siempre al valor verdadero.', correcta: false,
            retro: 'El ajuste está bien programado y la doble vía lo confirma. Un ajuste de pesos es insesgado <em>bajo MAR</em>; fuera de ese supuesto no hay ninguna garantía, ni siquiera de ir en la dirección correcta.' },
          { texto: 'Que hacen falta más clases de ajuste para capturar mejor la heterogeneidad.', correcta: false,
            retro: 'Se probó: con una clase por escuela —el máximo detalle posible— la estimación se aleja MÁS (33,82). Más clases con la variable equivocada no ayudan; solo añaden ruido a las propensiones estimadas.' },
          { texto: 'Que la submuestra de no respondientes debe de estar mal medida.', correcta: false,
            retro: 'Es la mejor información del estudio: son datos reales de 26 no respondientes, con $t = -4{,}73$ frente a los respondientes. Descartarla porque contradice al ajuste sería exactamente el razonamiento al revés.' }
        ]
      },
      {
        tipo: 'opcion',
        modulo: 4,
        pregunta: 'Tras post-estratificar el panel a las 18 celdas de la ACS, los pesos van de 54 562 a 401 464 y el deff de Kish vale 1,399. ¿Qué significa ese 1,399?',
        pista: 'Es el vocabulario del capítulo 7 aplicado a los pesos de calibración.',
        opciones: [
          { texto: 'Que la desigualdad de los pesos infla la varianza un 40 % respecto a un diseño autoponderado con el mismo $n$.', correcta: true,
            retro: 'Correcto, y es el precio del ajuste: se compra menos sesgo con más varianza. Vale la pena cuando el desequilibrio corregido es grande —y aquí lo es: 21 puntos en educación—, pero es una transacción, no un regalo.' },
          { texto: 'Que la calibración corrigió el 39,9 % del sesgo del panel.', correcta: false,
            retro: 'El deff de Kish no mide sesgo corregido: mide varianza añadida por pesos desiguales. Cuánto sesgo se corrigió es justamente lo que no se puede saber sin datos externos sobre la variable de interés.' },
          { texto: 'Que hay 1,399 personas de la población por cada persona del panel.', correcta: false,
            retro: 'Esa razón es $N/n = 237\\,681\\,218/2\\,404 \\approx 98\\,869$, el peso medio. El 1,399 es adimensional: un cociente de varianzas.' },
          { texto: 'Que el tamaño efectivo del panel es 1,399 veces mayor que el nominal.', correcta: false,
            retro: 'Va justo al revés: el tamaño efectivo es $n/\\text{deff} = 2404/1{,}399 \\approx 1719$, MENOR que el nominal. Un deff mayor que 1 siempre encoge el tamaño efectivo.' }
        ]
      },
      {
        tipo: 'multiple',
        modulo: 5,
        pregunta: 'Sobre los métodos de imputación de <code>impute.csv</code>, marca <strong>todo</strong> lo que sea cierto.',
        pista: 'Piensa en dónde cae cada valor imputado: en el centro, sobre la recta, o sobre un dato real.',
        opciones: [
          { texto: 'La imputación por la media conserva la media y reduce la desviación típica.', correcta: true },
          { texto: 'La regresión determinista pone los valores imputados exactamente sobre la recta ajustada.', correcta: true },
          { texto: 'El hot-deck no puede producir valores que ninguna unidad tenga.', correcta: true },
          { texto: 'Cualquiera de los tres corrige el sesgo si el mecanismo es MNAR.', correcta: false }
        ],
        retroAcierto: 'Las tres primeras. La cuarta es falsa por la misma razón que en el ajuste de pesos: la imputación se apoya en un modelo con las variables observadas, y si lo que falta depende del valor que falta, ningún modelo construido sobre lo observado lo ve.',
        retroFallo: 'Son las tres primeras. La cuarta repite el error del módulo 3 en el terreno de la imputación: MNAR no se arregla con técnica, se arregla con datos de los ausentes.'
      },
      {
        tipo: 'grafico',
        modulo: 6,
        pregunta: 'El gráfico muestra la cobertura empírica del intervalo nominal del 95 % en tres escenarios, con 2 000 réplicas y un error de Monte Carlo de ±0,49 puntos. ¿Cuál es la lectura correcta?',
        pista: 'La referencia no es el 95 %: es la barra de datos completos.',
        dibujar: function (canvas) {
          const C = D8.cobertura;
          return crearGraficoBarras(canvas, C.nombres, C.coberturas, {
            etiqueta: 'cobertura empírica', color: COLORES_GRAFICO.primario,
            min: 0.8, max: 1,
            lineas: [{ etiqueta: 'nominal 95 %', valor: 0.95, color: COLORES_GRAFICO.secundario }]
          });
        },
        opciones: [
          { texto: 'Imputar una vez cuesta 5,5 puntos de cobertura frente a los datos completos; Rubin recupera 4 de esos 5,5. Los 2,4 puntos que faltan hasta el 95 % son la asimetría de la variable, no la imputación.', correcta: true,
            retro: 'Exacto, y hay que leer las tres barras. La referencia correcta es 92,65 %, no 95 %: el capítulo 4 ya había medido que la asimetría de <code>acres92</code> descuenta un par de puntos con $n$ de este orden. Atribuirle a la imputación toda la distancia al 95 % sería culparla de un problema ajeno.' },
          { texto: 'Los tres intervalos son equivalentes: las diferencias caben dentro del error de Monte Carlo.', correcta: false,
            retro: 'El error de Monte Carlo es ±0,49 puntos y las diferencias son de 5,5 y 4,0 puntos: más de ocho veces el ruido. Precisamente por eso la simulación se hizo con 2 000 réplicas y publica su barra de error.' },
          { texto: 'La imputación múltiple es peor porque su intervalo es más ancho.', correcta: false,
            retro: 'Su intervalo es más ancho <em>y por eso</em> acierta más: 91,15 % contra 87,15 %. Un intervalo estrecho que no cubre no es una ventaja, es un error de reporte. Confundir precisión con exactitud es el error que este capítulo persigue de principio a fin.' },
          { texto: 'Con datos completos la cobertura debería ser exactamente 95 % y el 92,65 % indica un fallo de la simulación.', correcta: false,
            retro: 'El 95 % es exacto solo si la media muestral es normal, y con una variable tan asimétrica como <code>acres92</code> y $n = 200$ no lo es del todo. El capítulo 4 midió lo mismo (~93 % con $n = 300$) y lo declaró: es una propiedad de los datos, no un fallo del código.' }
        ]
      },
      {
        tipo: 'opcion',
        modulo: 7,
        pregunta: 'Dos encuestas tienen la misma tasa de respuesta global, 60 %. La primera tiene $R\\text{-indicator} = 0{,}95$ y la segunda, 0,45. ¿Qué se puede decir?',
        pista: 'El R-indicator mide la <em>variabilidad</em> de la propensión, no su nivel.',
        opciones: [
          { texto: 'En la segunda, la no respuesta está muy concentrada en ciertos grupos, así que el riesgo de sesgo es mucho mayor aunque falte la misma cantidad de gente.', correcta: true,
            retro: 'Correcto. $R = 0{,}95$ significa que casi todos responden con probabilidad parecida — no respuesta prácticamente MCAR, que no sesga. $R = 0{,}45$ significa que unos grupos responden y otros no, y la fórmula del módulo 2 convierte esa diferencia en sesgo si además difieren en $y$.' },
          { texto: 'Son equivalentes: lo que importa para el sesgo es cuánta gente falta, y falta la misma.', correcta: false,
            retro: 'La cantidad es solo el factor $(1-R)$ de la fórmula. El otro factor es la brecha entre respondientes y ausentes, y una no respuesta concentrada en ciertos grupos es exactamente la que produce brechas grandes.' },
          { texto: 'La segunda tiene mejor calidad porque un R más bajo indica más variabilidad y por tanto más información.', correcta: false,
            retro: 'Va al revés: el R-indicator vale 1 en el mejor caso (todos responden con la misma probabilidad) y baja hacia 0 en el peor. Más variabilidad de la propensión es más riesgo, no más información.' },
          { texto: 'No se puede decir nada sin conocer la variable de interés.', correcta: false,
            retro: 'Es cierto que el sesgo depende también de $y$ — por eso el R-indicator es un indicador de riesgo y no una medida de sesgo. Pero sí se puede decir algo: con $R = 0{,}95$ el sesgo está acotado por un número pequeño sea cual sea $y$.' }
        ]
      }
    ];
