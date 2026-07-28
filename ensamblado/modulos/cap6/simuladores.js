    // ================================================================
    // Simuladores del capítulo 6
    //
    // Todos leen de DATOS_CAP6, que produce precalculo/genera_cap6.R.
    // Lo pesado (10 000 réplicas de statepps, la curva de importancia
    // sobre BigLucy, la matriz pi_kl enumerada) viene resuelto; lo que
    // se computa en vivo son fórmulas cerradas: distribuciones exactas
    // con 4 tiendas, la convolución de Poisson-binomial (51 estados),
    // aportes SYG por par y pesos de dos etapas.
    // ================================================================
    const D6 = DATOS_CAP6;

    // Formato español: espacio fino como separador de miles, coma decimal.
    function fmtNum(x, d = 2) {
      if (!isFinite(x)) return '—';
      const s = Math.abs(x).toFixed(d);
      const partes = s.split('.');
      const entero = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      return (x < 0 ? '−' : '') + entero + (partes[1] ? ',' + partes[1] : '');
    }

    function fmtPct(x, d = 1) { return fmtNum(100 * x, d) + ' %'; }

    // ---------------------------------------------------------------
    // M1 · Cuatro muestras posibles, dos sorteos
    // ---------------------------------------------------------------
    SIMULADORES['psi-enumeracion'] = function (raiz) {
      const T = D6.tiendas;
      const params = { mostrar: 0 };
      const lienzo = raiz.querySelector('canvas');
      const NOMBRES = ['ψ proporcional al área', 'probabilidades iguales', 'los dos sorteos'];

      const g = crearGraficoBarras(lienzo, T.nombres, T.estPpt, {
        etiqueta: 'ψ ∝ área', color: COLORES_GRAFICO.primario, min: 0, max: 1050
      });

      function pintar() {
        const datasets = g.data.datasets;
        datasets.length = 1;
        datasets[0].label = 'ψ ∝ área';
        datasets[0].data = params.mostrar === 1 ? T.estIgual : T.estPpt;
        if (params.mostrar === 1) datasets[0].label = 'ψ iguales';
        if (params.mostrar === 2) {
          datasets.push({
            type: 'bar', label: 'ψ iguales', data: T.estIgual,
            backgroundColor: COLORES_GRAFICO.secundario, borderWidth: 0,
            barPercentage: 0.4, categoryPercentage: 0.9
          });
        }
        g.update('none');

        const V = params.mostrar === 1 ? T.vIgual : T.vPpt;
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'mostrando:', valor: NOMBRES[params.mostrar] },
          { etiqueta: 'E(t̂) en ambos sorteos:', valor: fmtNum(T.total, 0) + ' (insesgados)' },
          { etiqueta: 'V con ψ ∝ área:', valor: fmtNum(T.vPpt, 0) },
          { etiqueta: 'V con ψ iguales:', valor: fmtNum(T.vIgual, 0) },
          { etiqueta: 'razón de varianzas:', valor: fmtNum(T.vIgual / T.vPpt, 1) + ' a 1' },
          { etiqueta: 'la peor muestra (' + (params.mostrar === 1 ? 'D con ψ = 1/4' : 'A con ψ ∝ área') + '):',
            valor: 't̂ = ' + fmtNum(params.mostrar === 1 ? 980 : T.estPpt[0], 0) }
        ]);
      }

      crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'mostrar', etiqueta: 'Sorteo (0 ψ∝área · 1 iguales · 2 ambos)', min: 0, max: 2, paso: 1 }
      ], params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M2 · La distribución exacta del HH con n = 2
    // ---------------------------------------------------------------
    SIMULADORES['hh-exacto'] = function (raiz) {
      const T = D6.tiendas;
      const params = { sorteo: 0 };
      const lienzo = raiz.querySelector('canvas');

      // Distribución exacta del HH con psi iguales, enumerada aquí (16 pares).
      const igual = {};
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
        const v = (T.estIgual[i] + T.estIgual[j]) / 2;
        igual[v] = (igual[v] || 0) + 1 / 16;
      }
      const igualVals = Object.keys(igual).map(Number).sort((a, b) => a - b);

      const g = crearGraficoXY(lienzo, [], {
        tituloX: 'valor del estimador HH', tituloY: 'probabilidad exacta', xMin: 0, xMax: 1000
      });

      function stems(xs, ps, etiqueta, color) {
        return {
          type: 'bar', label: etiqueta, data: xs.map((x, i) => ({ x: x, y: ps[i] })),
          backgroundColor: color, barThickness: 7, borderWidth: 0
        };
      }

      function pintar() {
        const datasets = [];
        if (params.sorteo !== 1) {
          datasets.push(stems(D6.hh.valores, D6.hh.probs, 'ψ ∝ área', COLORES_GRAFICO.primario));
        }
        if (params.sorteo !== 0) {
          datasets.push(stems(igualVals, igualVals.map(v => igual[v]), 'ψ iguales', COLORES_GRAFICO.secundario));
        }
        datasets.push(serieVertical(T.total, 0.42, 't = 300', COLORES_GRAFICO.gris));
        g.data.datasets = datasets;
        g.update('none');

        const vIgual = igualVals.reduce((a, v) => a + igual[v] * (v - T.total) * (v - T.total), 0);
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'valores posibles:', valor: fmtNum(D6.hh.valores.length, 0) + ' (ψ∝área) · ' +
            fmtNum(igualVals.length, 0) + ' (iguales)' },
          { etiqueta: 'E exacta en ambos:', valor: fmtNum(T.total, 0) },
          { etiqueta: 'V exacta ψ ∝ área:', valor: fmtNum(D6.hh.V, 0) + ' (ee ' + fmtNum(D6.hh.se, 1) + ')' },
          { etiqueta: 'V exacta ψ iguales:', valor: fmtNum(vIgual, 0) },
          { etiqueta: 'con n = 2, V = V(n=1)/2:', valor: fmtNum(T.vPpt, 0) + ' / 2 = ' + fmtNum(T.vPpt / 2, 0) }
        ]);
      }

      crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'sorteo', etiqueta: 'Sorteo (0 ψ∝área · 1 iguales · 2 ambos)', min: 0, max: 2, paso: 1 }
      ], params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M3 · El sorteo por dentro: acumulativo y Lahiri
    // ---------------------------------------------------------------
    SIMULADORES['seleccion'] = function (raiz) {
      const T = D6.tiendas;
      const params = { metodo: 0, u: 800, candidata: 4, u2: 500 };
      const lienzo = raiz.querySelector('canvas');
      const acum = T.acumulado;                       // [100, 300, 600, 1600]

      const g = crearGraficoBarras(lienzo, T.nombres, T.m2, {
        etiqueta: 'área (m²) = longitud del tramo', color: COLORES_GRAFICO.primario, min: 0, max: 1050
      });

      function pintar() {
        let colores, lectura;
        if (params.metodo === 0) {
          const sel = acum.findIndex(a => params.u <= a);
          colores = T.nombres.map((_, i) => i === sel ? '#FF6600' : '#012820');
          const desde = sel === 0 ? 0 : acum[sel - 1];
          lectura = [
            { etiqueta: 'método:', valor: 'acumulativo' },
            { etiqueta: 'uniforme u:', valor: fmtNum(params.u, 0) + ' de 1 600' },
            { etiqueta: 'cae en el tramo:', valor: '(' + fmtNum(desde, 0) + ', ' + fmtNum(acum[sel], 0) +
              '] → sale ' + T.nombres[sel] },
            { etiqueta: 'ψ de esa tienda:', valor: fmtNum(T.psi[sel], 4) },
            { etiqueta: 'D ocupa:', valor: fmtPct(T.psi[3], 1) + ' del segmento' }
          ];
        } else {
          const i = params.candidata - 1;
          const acepta = params.u2 <= T.m2[i];
          colores = T.nombres.map((_, k) => k === i ? (acepta ? '#FF6600' : '#DC2626') : '#012820');
          lectura = [
            { etiqueta: 'método:', valor: 'Lahiri (rechazo)' },
            { etiqueta: 'candidata sorteada:', valor: T.nombres[i] + ' (área ' + fmtNum(T.m2[i], 0) + ')' },
            { etiqueta: 'uniforme contra M_max = 1000:', valor: fmtNum(params.u2, 0) },
            { etiqueta: 'decisión:', valor: acepta ? 'ACEPTADA (u ≤ área)' : 'RECHAZADA — se vuelve a sortear' },
            { etiqueta: 'P(aceptar | candidata ' + T.nombres[i] + '):', valor: fmtNum(T.m2[i] / 1000, 3) },
            { etiqueta: 'intentos promedio del método:', valor: fmtNum(D6.seleccion.intentosTeoricos, 2) }
          ];
        }
        g.data.datasets[0].backgroundColor = colores;
        g.update('none');
        actualizarLectura(raiz.querySelector('.simulador-lectura'), lectura);
      }

      crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'metodo', etiqueta: 'Método (0 acumulativo · 1 Lahiri)', min: 0, max: 1, paso: 1 },
        { clave: 'u', etiqueta: 'Uniforme del acumulativo (0–1600)', min: 1, max: 1600, paso: 1 },
        { clave: 'candidata', etiqueta: 'Lahiri: tienda candidata (1=A … 4=D)', min: 1, max: 4, paso: 1 },
        { clave: 'u2', etiqueta: 'Lahiri: uniforme contra M_max (0–1000)', min: 1, max: 1000, paso: 1 }
      ], params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M4 · Seis muestras, un espacio completo
    // ---------------------------------------------------------------
    SIMULADORES['espacio-wor'] = function (raiz) {
      const E = D6.espacioWor;
      const params = { muestra: 6 };
      const lienzo = raiz.querySelector('canvas');

      const g = crearGraficoBarras(lienzo, E.muestras, E.pS, {
        etiqueta: 'p(s)', color: COLORES_GRAFICO.primario, min: 0, max: 0.32
      });

      function pintar() {
        const i = params.muestra - 1;
        g.data.datasets[0].backgroundColor = E.muestras.map((_, k) => k === i ? '#FF6600' : '#012820');
        g.update('none');

        const aporte = E.pS[i] * Math.pow(E.ht[i] - E.total, 2);
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'muestra:', valor: E.muestras[i] + ' · p(s) = ' + fmtNum(E.pS[i], 4) },
          { etiqueta: 't̂ si sale esa muestra:', valor: fmtNum(E.ht[i], 1) },
          { etiqueta: 'desviación frente a t = 300:', valor: fmtNum(E.ht[i] - E.total, 1) },
          { etiqueta: 'aporte a la varianza:', valor: fmtNum(aporte, 0) + ' (' + fmtPct(aporte / E.V, 1) + ' de V)' },
          { etiqueta: 'V total del diseño:', valor: fmtNum(E.V, 0) + ' — frente a HH n=2: ' + fmtNum(E.vHH2, 0) },
          { etiqueta: 'E(t̂) sobre las 6 muestras:', valor: fmtNum(E.total, 0) + ' exacto (insesgadez)' }
        ]);
      }

      crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'muestra', etiqueta: 'Muestra a inspeccionar (1=AB … 6=CD)', min: 1, max: 6, paso: 1 }
      ], params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M5 · ¿Cuándo gana el πPT? 10 000 réplicas contra el MAS
    // ---------------------------------------------------------------
    SIMULADORES['ppt-mc'] = function (raiz) {
      const params = { variable: 0 };
      const lienzo = raiz.querySelector('canvas');
      const VARS = [
        { clave: 'counties', nombre: 'counties (nº de condados)' },
        { clave: 'waterarea', nombre: 'waterarea (km² de agua)' },
        { clave: 'pop', nombre: 'pop2019 (la medida de tamaño)' }
      ];

      const g = crearGraficoXY(lienzo, [], {
        tituloX: 'HT del total', tituloY: 'réplicas por caja'
      });

      function pintar() {
        const V = D6.statepps[VARS[params.variable].clave];
        const alto = Math.max(...V.pps.conteo, ...V.mas.conteo) * 1.05;
        g.data.datasets = [
          serieHistograma(V.pps, 'πPT sistemático', COLORES_GRAFICO.primario),
          serieHistograma(V.mas, 'MAS de 10 estados', COLORES_GRAFICO.secundario),
          serieVertical(V.total, alto, 'total verdadero', COLORES_GRAFICO.gris)
        ];
        g.options.scales.x.min = undefined; g.options.scales.x.max = undefined;
        g.update('none');

        const deff = V.vPps / V.vMas;
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'variable:', valor: VARS[params.variable].nombre },
          { etiqueta: 'corr(variable, tamaño):', valor: fmtNum(V.corr, 3) },
          { etiqueta: 'ee πPT (10 000 réplicas):', valor: fmtNum(Math.sqrt(V.vPps), 0) },
          { etiqueta: 'ee MAS (mismas réplicas):', valor: fmtNum(Math.sqrt(V.vMas), 0) },
          { etiqueta: 'deff del πPT frente al MAS:', valor: deff < 0.001 ? '≈ 0 (¡varianza aniquilada!)' : fmtNum(deff, 2) },
          { etiqueta: 'veredicto:', valor: deff < 1 ? 'gana πPT' : 'gana el MAS — la correlación no alcanza' }
        ]);
      }

      crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'variable', etiqueta: 'Variable (0 counties · 1 waterarea · 2 pop2019)', min: 0, max: 2, paso: 1 }
      ], params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M6 · La lotería del tamaño de muestra (Poisson-binomial exacta)
    // ---------------------------------------------------------------
    SIMULADORES['poisson-n'] = function (raiz) {
      const params = { factor: 1 };
      const lienzo = raiz.querySelector('canvas');
      const piBase = D6.statepps.pi;

      const g = crearGraficoBarras(lienzo, [], [], {
        etiqueta: 'P(n = k) exacta', color: COLORES_GRAFICO.primario, min: 0, max: 0.45
      });

      function pintar() {
        const pi = piBase.map(p => Math.min(1, p * params.factor));
        let pn = [1];
        pi.forEach(p => {
          const sig = new Array(pn.length + 1).fill(0);
          for (let k = 0; k < pn.length; k++) {
            sig[k] += pn[k] * (1 - p);
            sig[k + 1] += pn[k] * p;
          }
          pn = sig;
        });
        const En = pi.reduce((a, p) => a + p, 0);
        const Vn = pi.reduce((a, p) => a + p * (1 - p), 0);
        const kMax = Math.min(pn.length - 1, Math.ceil(En + 4 * Math.sqrt(Vn) + 2));
        g.data.labels = Array.from({ length: kMax + 1 }, (_, k) => k);
        g.data.datasets[0].data = pn.slice(0, kMax + 1);
        g.options.scales.y.max = Math.max(0.25, Math.max(...pn) * 1.15);
        g.update('none');

        const kEsp = Math.round(En);
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'factor sobre las π:', valor: fmtNum(params.factor, 2) },
          { etiqueta: 'E(n) = Σπ:', valor: fmtNum(En, 2) },
          { etiqueta: 'de(n):', valor: fmtNum(Math.sqrt(Vn), 2) },
          { etiqueta: 'P(n = ' + kEsp + '):', valor: fmtNum(pn[kEsp] || 0, 3) },
          { etiqueta: 'P(|n − E(n)| ≤ 1):', valor: fmtNum((pn[kEsp - 1] || 0) + (pn[kEsp] || 0) + (pn[kEsp + 1] || 0), 3) },
          { etiqueta: 'forzosas (π = 1):', valor: fmtNum(pi.filter(p => p === 1).length, 0) }
        ]);
      }

      crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'factor', etiqueta: 'Factor de escala de las π', min: 0.3, max: 1.5, paso: 0.05 }
      ], params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M7 · La varianza, par por par (SYG sobre el diseño pequeño)
    // ---------------------------------------------------------------
    SIMULADORES['syg-pares'] = function (raiz) {
      const E = D6.espacioWor;
      const T = D6.tiendas;
      const params = { par: 6 };
      const lienzo = raiz.querySelector('canvas');

      // Aportes SYG exactos por par: (pi_k pi_l - pi_kl) (y_k/pi_k - y_l/pi_l)^2
      const pares = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];
      const d = T.t.map((y, k) => y / E.piK[k]);
      const aportes = pares.map(([k, l]) =>
        (E.piK[k] * E.piK[l] - E.piKl[k][l]) * Math.pow(d[k] - d[l], 2));

      const g = crearGraficoBarras(lienzo, E.muestras, aportes, {
        etiqueta: 'aporte a V (SYG)', color: COLORES_GRAFICO.primario, min: 0, max: Math.max(...aportes) * 1.15
      });

      function pintar() {
        const i = params.par - 1;
        const [k, l] = pares[i];
        g.data.datasets[0].backgroundColor = pares.map((_, j) => j === i ? '#FF6600' : '#012820');
        g.update('none');

        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'par:', valor: T.nombres[k] + '–' + T.nombres[l] },
          { etiqueta: 'π_k · π_l:', valor: fmtNum(E.piK[k] * E.piK[l], 4) },
          { etiqueta: 'π_kl:', valor: fmtNum(E.piKl[k][l], 4) },
          { etiqueta: '«estorbo» π_kπ_l − π_kl:', valor: fmtNum(E.piK[k] * E.piK[l] - E.piKl[k][l], 4) },
          { etiqueta: 'discrepancia (y_k/π_k − y_l/π_l)²:', valor: fmtNum(Math.pow(d[k] - d[l], 2), 0) },
          { etiqueta: 'aporte:', valor: fmtNum(aportes[i], 0) + ' (' + fmtPct(aportes[i] / E.V, 1) + ' de V = ' +
            fmtNum(E.V, 0) + ')' }
        ]);
      }

      crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'par', etiqueta: 'Par a inspeccionar (1=AB … 6=CD)', min: 1, max: 6, paso: 1 }
      ], params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M8 · El elefante y su π (varianza explosiva, exacta)
    // ---------------------------------------------------------------
    SIMULADORES['explosiva'] = function (raiz) {
      const E = D6.elefante;
      const params = { piE: E.piElefanteX };
      const lienzo = raiz.querySelector('canvas');
      const etiquetas = E.y.map((_, i) => i + 1);

      const g = crearGraficoBarras(lienzo, etiquetas, E.y.map(() => 1), {
        etiqueta: 'aporte (1/π − 1)·y² a V', color: COLORES_GRAFICO.primario, min: 0.1, max: 1e11
      });
      g.options.scales.y.type = 'logarithmic';
      g.options.scales.y.min = 10;

      function pintar() {
        const pi = E.piBase.slice();
        pi[19] = params.piE;
        const aportes = pi.map((p, i) => (1 / p - 1) * E.y[i] * E.y[i]);
        const V = aportes.reduce((a, b) => a + b, 0);
        g.data.datasets[0].data = aportes;
        g.data.datasets[0].backgroundColor = etiquetas.map((_, i) => i === 19 ? '#FF6600' : '#012820');
        g.options.scales.y.max = Math.max(1e10, Math.max(...aportes) * 2);
        g.update('none');

        const VBase = E.piBase.map((p, i) => (1 / p - 1) * E.y[i] * E.y[i]).reduce((a, b) => a + b, 0);
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'π del elefante:', valor: fmtNum(params.piE, 3) + ' (por su área le tocaba ' +
            fmtNum(E.piElefanteX, 3) + ')' },
          { etiqueta: 'su y:', valor: fmtNum(E.yElefante, 0) + ' — el ' + fmtPct(E.yElefante / E.totalY, 0) + ' del total' },
          { etiqueta: 'V total del HT (Poisson):', valor: fmtNum(V, 0) },
          { etiqueta: 'el elefante aporta:', valor: fmtPct(aportes[19] / V, 1) },
          { etiqueta: 'frente a la V con su π de área:', valor: fmtNum(V / VBase, 2) + '×' },
          { etiqueta: 'defensa:', valor: params.piE >= 0.5 ? 'π grande: bomba desactivada' :
            (params.piE < 0.03 ? '¡π mínima con y enorme: explosión!' : 'zona de riesgo' ) }
        ]);
      }

      crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'piE', etiqueta: 'π del elefante', min: 0.005, max: 0.9, paso: 0.005 }
      ], params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M9 · La cancelación del autoponderado, en vivo
    // ---------------------------------------------------------------
    SIMULADORES['autoponderado'] = function (raiz) {
      const C = D6.classpps;
      const params = { diseno: 0, m: 4 };
      const lienzo = raiz.querySelector('canvas');
      const etiquetas = C.tamanos.map((_, i) => 'clase ' + (i + 1));

      const g = crearGraficoBarras(lienzo, etiquetas, C.tamanos, {
        etiqueta: 'peso final de un estudiante', color: COLORES_GRAFICO.primario, min: 0, max: 40
      });

      function pintar() {
        const n = 5;
        const pesos = C.tamanos.map(Mi => params.diseno === 0
          ? C.K / (n * params.m)                       // PPT: (K/(n Mi)) · (Mi/m)
          : (C.Nclases / n) * Mi / params.m);          // iguales: (N/n) · (Mi/m)
        g.data.datasets[0].data = pesos;
        g.data.datasets[0].label = params.diseno === 0 ? 'PPT + m fijo (autoponderado)' : 'iguales + m fijo';
        g.options.scales.y.max = Math.max(...pesos) * 1.2;
        g.update('none');

        const maxP = Math.max(...pesos), minP = Math.min(...pesos);
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'primera etapa:', valor: params.diseno === 0 ? 'PPT: ψ_i = M_i/' + C.K : 'probabilidades iguales (1/' + C.Nclases + ')' },
          { etiqueta: 'submuestreo:', valor: 'm = ' + params.m + ' por clase' },
          { etiqueta: 'peso mínimo / máximo:', valor: fmtNum(minP, 2) + ' / ' + fmtNum(maxP, 2) },
          { etiqueta: 'razón max/min:', valor: fmtNum(maxP / minP, 2) + (params.diseno === 0 ? ' — todos iguales' : '') },
          { etiqueta: 'fórmula del peso:', valor: params.diseno === 0 ? 'w = K/(n·m) = ' +
            fmtNum(C.K / (5 * params.m), 2) + ', el M_i se cancela' : 'w = (N/n)·M_i/m: crece con M_i' }
        ]);
      }

      crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'diseno', etiqueta: 'Primera etapa (0 PPT · 1 iguales)', min: 0, max: 1, paso: 1 },
        { clave: 'm', etiqueta: 'Estudiantes por clase m', min: 2, max: 10, paso: 1 }
      ], params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M10 · El camino hacia la propuesta perfecta (importancia)
    // ---------------------------------------------------------------
    SIMULADORES['importancia'] = function (raiz) {
      const I = D6.importancia;
      const params = { alpha: 0 };
      const lienzo = raiz.querySelector('canvas');

      const curva = {
        type: 'line', label: 'V exacta del HH', stepped: false, fill: false,
        data: I.mallaAlpha.map((a, i) => ({ x: a, y: I.curvaV[i] })),
        borderColor: COLORES_GRAFICO.primario, backgroundColor: COLORES_GRAFICO.primario,
        borderWidth: 2, pointRadius: 0, tension: 0.25
      };
      const g = crearGraficoXY(lienzo, [curva], {
        tituloX: 'α: 0 uniforme · 1 ψ∝empleados · 2 ψ∝y', tituloY: 'V exacta', xMin: 0, xMax: 2
      });

      function vDe(a) {
        // interpolación lineal sobre la malla del precálculo (paso 0.1)
        const i = Math.min(I.mallaAlpha.length - 2, Math.floor(a / 0.1));
        const f = (a - I.mallaAlpha[i]) / 0.1;
        return I.curvaV[i] * (1 - f) + I.curvaV[i + 1] * f;
      }

      function pintar() {
        const V = vDe(params.alpha);
        g.data.datasets = [curva, serieVertical(params.alpha, I.vUniforme * 1.05, 'α actual', COLORES_GRAFICO.secundario)];
        g.update('none');

        const nombre = params.alpha <= 0.05 ? 'uniforme' :
          (Math.abs(params.alpha - 1) <= 0.05 ? 'ψ ∝ empleados (lo alcanzable)' :
          (params.alpha >= 1.95 ? 'ψ ∝ y (perfecta, inalcanzable)' :
          (params.alpha < 1 ? 'mezcla uniforme → empleados' : 'mezcla empleados → perfecta')));
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'propuesta:', valor: nombre },
          { etiqueta: 'V(α):', valor: V < 1 ? '≈ 0' : fmtNum(V, 0) },
          { etiqueta: 'frente al uniforme:', valor: V < 1 ? '∞ veces mejor' : fmtNum(I.vUniforme / V, 2) + '× mejor' },
          { etiqueta: 'en α = 1 la mejora es:', valor: fmtNum(I.mejora, 2) + '× (corr = ' + fmtNum(I.corr, 3) + ')' },
          { etiqueta: 'población:', valor: fmtNum(I.K, 0) + ' empresas · n = ' + fmtNum(I.n, 0) }
        ]);
      }

      crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'alpha', etiqueta: 'α de la propuesta', min: 0, max: 2, paso: 0.05 }
      ], params, pintar);
      pintar();
      return [g];
    };

    // ================================================================
    // Tabla-ranking del módulo 5: cuatro diseños sobre statepps
    // ================================================================
    TABLAS_RANKING['disenos'] = function () {
      const S = D6.statepps;
      const P = D6.poisson;
      return {
        descripcion: 'Estimar el total de condados de EE.UU. (3 143) con n = 10 estados y cuatro ' +
          'diseños. Las varianzas del MAS y del πPT sistemático salen de 10 000 réplicas; las de ' +
          'Poisson y HH son exactas. Pulsa cualquier cabecera para reordenar.',
        columnas: [
          { clave: 'diseno', titulo: 'Diseño', tipo: 'texto' },
          { clave: 'n', titulo: 'n', tipo: 'texto' },
          { clave: 'V', titulo: 'Varianza', decimales: 0, mejor: 'menor' },
          { clave: 'deff', titulo: 'deff vs MAS', decimales: 2, mejor: 'menor' },
          { clave: 'pikl', titulo: '¿Necesita π_kl?', tipo: 'texto' }
        ],
        filas: [
          { diseno: 'MAS de 10 estados', n: 'fijo', V: S.counties.vMas, deff: 1, pikl: 'sí (triviales)' },
          { diseno: 'πPT sistemático', n: 'fijo', V: S.counties.vPps,
            deff: S.counties.vPps / S.counties.vMas, pikl: 'no existen: aproximación WR' },
          { diseno: 'Poisson (mismas π)', n: 'aleatorio', V: P.vHt, deff: P.vHt / S.counties.vMas,
            pikl: 'no: independencia' },
          { diseno: 'HH con reemplazo (ψ ∝ pop)', n: 'fijo (con repetición)', V: S.vHhCounties,
            deff: S.vHhCounties / S.counties.vMas, pikl: 'no: s²_z/n' }
        ],
        inicial: 'V',
        destacada: 'MAS de 10 estados',
        pie: 'La sorpresa honesta del módulo: para counties, el humilde MAS gana — la correlación ' +
          'de 0,46 con la población no compra la proporcionalidad que el πPT necesita. La tabla ' +
          'entera se invierte con una variable que sí acompañe al tamaño (con pop2019, la V del ' +
          'πPT es ≈ 0 y las demás quedan en ridículo). Diseñar con probabilidades desiguales es ' +
          'apostar: esta tabla muestra una apuesta perdida para que nadie crea que el πPT gana solo.'
      };
    };

    // ================================================================
    // Diagrama de diseño del módulo 9: classpps, PPT en dos etapas
    // ================================================================
    DIAGRAMAS_DISENO['ppt-dos-etapas'] = {
      titulo: 'El diseño de classpps: PPT con reemplazo × MAS',
      intro: 'Pulsa cada etapa. La primera sortea CON probabilidades desiguales; la franja final ' +
        'muestra la cancelación que deja todos los pesos iguales.',
      nota: 'Compara con el diagrama de schools del capítulo 5, módulo 2: allí la primera etapa ' +
        'era un MAS y los pesos finales dependían de M_i (40,9 a 137,6). Aquí, PPT los aplana en ' +
        'un solo número.',
      etapas: [
        {
          etiqueta: 'Marco',
          unidad: '15 clases, $K = 647$ estudiantes',
          icono: 'fa-chalkboard-user',
          resumen: 'El marco lista las 15 clases con sus tamaños M_i (de 20 a 100). A diferencia ' +
            'de schools, aquí el total K = 647 sí se conoce: lo exige el PPT para calcular las psi.',
          cifras: [{ k: 'N', v: '15 clases' }, { k: 'M_i', v: 'de 20 a 100' }]
        },
        {
          etiqueta: 'Etapa 1: clases',
          unidad: 'PPT con reemplazo, $n = 5$',
          icono: 'fa-scale-unbalanced',
          resumen: 'Cinco extracciones con psi_i = M_i/647: la clase de 100 estudiantes sale con ' +
            'probabilidad 0,155 por extracción; la de 20, con 0,031. Con reemplazo: puede repetirse.',
          pi: '\\psi_i = M_i/647',
          peso: '1/(n\\psi_i) = 647/(5 M_i)',
          cifras: [{ k: 'ψ rango', v: '0,031 a 0,155' }],
          ejemplo: 'la clase 14 (M = 100) tiene cinco veces la probabilidad de la clase 4 (M = 22).'
        },
        {
          etiqueta: 'Etapa 2: estudiantes',
          unidad: 'MAS de $m = 4$ por clase',
          icono: 'fa-user-check',
          resumen: 'En cada clase sorteada, 4 estudiantes de sus M_i. La probabilidad condicional ' +
            'baja con el tamaño de la clase — exactamente al revés que la etapa 1.',
          pi: 'm/M_i = 4/M_i',
          peso: 'M_i/4',
          cifras: [{ k: 'm/Mᵢ rango', v: '0,04 a 0,18' }],
          ejemplo: 'en la clase de 100, cada estudiante sale con 4/100 = 0,04.'
        },
        {
          etiqueta: 'Estimación',
          unidad: 'la cancelación',
          icono: 'fa-equals',
          resumen: 'El peso multiplica las dos etapas y el M_i desaparece: w = [647/(5 M_i)] × ' +
            '[M_i/4] = 647/20 = 32,35 para TODOS. La suma de pesos reconstruye K = 647 exacto.',
          peso: 'w = \\frac{647}{5 \\cdot 4} = 32{,}35',
          cifras: [{ k: 'w único', v: '32,35' }, { k: 'total horas', v: '2 232,2 (ee 311,8)' }],
          ejemplo: 'da igual de qué clase venga: cada estudiante observado habla por 32,35.'
        }
      ],
      acumulado: {
        rotulo: 'El diseño completo',
        formula: '\\psi_i = \\frac{M_i}{K} \\qquad w_k = \\frac{1}{n\\psi_i}\\cdot\\frac{M_i}{m} ' +
          '= \\frac{K}{nm} \\qquad \\widehat{V}(\\hat{t}_{HH}) = \\frac{s_z^2}{n}',
        texto: 'PPT arriba + m fijo abajo = pesos constantes (autoponderado) y varianza estimable ' +
          'con la sola dispersión entre clases. Las encuestas de hogares reales viven de esta receta.'
      }
    };

    // ================================================================
    // Glosario de notación del capítulo 6
    // ================================================================
    GLOSARIOS['ppt'] = {
      titulo: 'Notación: este material ↔ Lohr ↔ Gutiérrez',
      nota: 'La distinción vital del capítulo: $\\psi_i$ es probabilidad de UNA extracción (con ' +
        'reemplazo, suman 1); $\\pi_k$ es probabilidad de estar EN LA MUESTRA (sin reemplazo, ' +
        'suman n). Confundirlas arruina pesos y varianzas.',
      filas: [
        { concepto: 'Medida de tamaño', aqui: 'x_k', lohr: 'M_i', gutierrez: 'x_k', r: 'pop2019, sizemeas' },
        { concepto: 'Prob. de una extracción', aqui: '\\psi_i', lohr: '\\psi_i', gutierrez: 'p_k', r: 'prob = psi' },
        { concepto: 'Prob. de inclusión', aqui: '\\pi_k', lohr: '\\pi_i', gutierrez: '\\pi_k', r: 'inclusionprobabilities()' },
        { concepto: 'Conjunta de segundo orden', aqui: '\\pi_{kl}', lohr: '\\pi_{ij}', gutierrez: '\\pi_{kl}', r: 'ppsmat(Pmat)' },
        { concepto: 'Estimador con reemplazo', aqui: '\\hat{t}_{HH}', lohr: '\\hat{t}_\\psi', gutierrez: '\\hat{t}_{p}', r: 'mean(y/psi)' },
        { concepto: 'Su varianza estimada', aqui: 's_z^2/n', lohr: 's_z^2/n', gutierrez: '\\widehat{V}_{p}', r: 'var(z)/n' },
        { concepto: 'Estimador sin reemplazo', aqui: '\\hat{t}_\\pi', lohr: '\\hat{t}_{HT}', gutierrez: '\\hat{t}_\\pi', r: 'svytotal + probs' },
        { concepto: 'Varianza SYG', aqui: '\\widehat{V}_{SYG}', lohr: '\\widehat{V}_{SYG}', gutierrez: '\\widehat{V}_{SYG}', r: 'variance = "YG"' },
        { concepto: 'Diseño πPT / πps', aqui: '\\pi_k \\propto x_k', lohr: '\\pi ps', gutierrez: '\\pi PT', r: 'UPsystematic, UPbrewer' },
        { concepto: 'Diseño de Poisson', aqui: '\\text{PO}(\\pi)', lohr: '—', gutierrez: 'PO', r: 'rbinom(N, 1, pi)' },
        { concepto: 'Inclusión forzosa', aqui: '\\pi_k = 1', lohr: 'certainty psu', gutierrez: '\\text{incl. forzosa}', r: 'pik >= 1' },
        { concepto: 'Peso de diseño', aqui: 'w_k = 1/\\pi_k', lohr: 'w_i', gutierrez: 'd_k', r: 'SamplingWeight' }
      ]
    };

    // ================================================================
    // Autoevaluación del capítulo 6
    // ================================================================
    AUTOEVALUACIONES['cap6'] = [
      {
        tipo: 'opcion',
        modulo: 1,
        pregunta: 'Con las cuatro tiendas, el sorteo proporcional y el uniforme son ambos insesgados, pero uno tiene 10,8 veces menos varianza. ¿De dónde sale exactamente esa ganancia?',
        pista: '¿Qué le pasa al cociente $t_i/\\psi_i$ bajo cada sorteo?',
        opciones: [
          { texto: 'De que con ψ ∝ tamaño los cuatro valores posibles t_i/ψ_i (176, 160, 128, 392) quedan cerca de t = 300, mientras que con ψ iguales van de 44 a 980.', correcta: true,
            retro: 'Exacto: la varianza de un estimador de una extracción es la dispersión de sus valores posibles alrededor de t. Alinear ψ con el tamaño comprime esos valores — esa es TODA la idea del capítulo.' },
          { texto: 'De que el sorteo proporcional observa la tienda D más veces y D tiene más ventas.', correcta: false,
            retro: 'Observa D más A MENUDO, pero cada muestra sigue siendo UNA tienda. La ganancia no está en observar más, sino en que lo expandido (t/ψ) sea estable salga quien salga.' },
          { texto: 'De que las probabilidades desiguales eliminan el sesgo de selección.', correcta: false,
            retro: 'No había sesgo que eliminar: ambos sorteos son insesgados (la enumeración da E = 300 en los dos). Probabilidades conocidas ≠ probabilidades iguales; lo primero basta para la insesgadez.' },
          { texto: 'De la corrección por población finita, que solo aplica al sorteo proporcional.', correcta: false,
            retro: 'El fpc no pinta nada aquí: es un sorteo de una extracción en ambos casos. La ganancia viene de la geometría de los t/ψ, no de correcciones.' }
        ]
      },
      {
        tipo: 'numerica',
        modulo: 2,
        pregunta: 'La varianza del HH con $n$ extracciones es $V(n=1)/n$. Con las tiendas ($V(n=1) = 14\\,248$), ¿cuánto vale la varianza del HH con $n = 4$? Entero.',
        pista: 'Divide la varianza de una extracción entre n.',
        respuesta: 3562,
        tolerancia: 1,
        retroAcierto: '$14\\,248/4 = 3\\,562$: las extracciones independientes promedian el ruido, tal cual el capítulo 2. El «con reemplazo» compra esa fórmula limpia al precio de poder repetir tienda.',
        retroFallo: 'Es $14\\,248/4 = 3\\,562$. La varianza del HH decrece como $1/n$ — la independencia entre extracciones hace que el promedio de los $z_i$ se comporte como una media de iid.'
      },
      {
        tipo: 'opcion',
        modulo: 3,
        pregunta: 'Un marco tiene 40 millones de unidades y llega ordenado en archivos parciales que no caben juntos en memoria. ¿Qué método de selección PPT conviene y por qué?',
        pista: '¿Cuál de los dos métodos necesita acumular todo el marco antes de sortear?',
        opciones: [
          { texto: 'Lahiri: no necesita acumular el marco — solo M_max — y decide unidad por unidad, al precio de repetir intentos.', correcta: true,
            retro: 'Correcto. El acumulativo exige construir los tramos (recorrer y sumar TODO antes del primer sorteo); el rechazo de Lahiri trabaja con lo que va llegando. Es la misma razón por la que Poisson sirve para flujos.' },
          { texto: 'El acumulativo, porque es exacto y Lahiri es aproximado.', correcta: false,
            retro: 'Los dos son EXACTOS — la verificación de 100 000 sorteos lo confirmó para ambos. La diferencia es operativa (memoria y pasadas), no probabilística.' },
          { texto: 'Ninguno: con marcos grandes solo funciona el MAS.', correcta: false,
            retro: 'Al revés: los marcos gigantes son el hábitat natural del PPT (transacciones, tráfico, censos de empresas). El tamaño pide mejores algoritmos, no renunciar al diseño.' },
          { texto: 'Lahiri, porque tiene menos varianza que el acumulativo.', correcta: false,
            retro: 'Producen EXACTAMENTE la misma distribución de selección (ambos dan ψ_i), así que la varianza del estimador es idéntica. La ventaja de Lahiri es de memoria y pasadas, no de varianza.' }
        ]
      },
      {
        tipo: 'numerica',
        modulo: 4,
        pregunta: 'En el diseño sin reemplazo de las cuatro tiendas ($p(s) \\propto M_k + M_l$), las π de A, B y C son 0,375, 0,4167 y 0,4583. Sabiendo que $\\sum \\pi_k = n$, ¿cuánto vale $\\pi_D$? Dos decimales.',
        pista: 'Las cuatro π deben sumar n = 2.',
        respuesta: 0.75,
        tolerancia: 0.005,
        retroAcierto: '$2 - 0{,}375 - 0{,}4167 - 0{,}4583 = 0{,}75$. La propiedad $\\sum\\pi_k = n$ del capítulo 2 funciona con cualquier reparto de las π — es la contabilidad básica de todo diseño de tamaño fijo.',
        retroFallo: 'Las π de un diseño de tamaño fijo suman n = 2: $\\pi_D = 2 - 0{,}375 - 0{,}4167 - 0{,}4583 = 0{,}75$. Es la misma propiedad que el capítulo 2 demostró con indicadoras.'
      },
      {
        tipo: 'multiple',
        modulo: 5,
        pregunta: 'Sobre el πPT de los 51 estados ($\\pi \\propto$ población, $n = 10$), marca <strong>todo</strong> lo que sea cierto.',
        pista: 'Repasa la inclusión forzosa, el MC de las tres variables y lo que el sistemático puede y no puede estimar.',
        opciones: [
          { texto: 'California queda con π = 1: su π cruda (1,204) supera 1 y se trunca, reescalando las demás.', correcta: true },
          { texto: 'Para counties (correlación 0,46 con el tamaño), el πPT tiene MÁS varianza que un MAS de 10 estados.', correcta: true },
          { texto: 'El πPT sistemático no tiene estimador insesgado de varianza: muchas π_kl valen 0.', correcta: true },
          { texto: 'πPT garantiza menor varianza que el MAS siempre que la correlación con el tamaño sea positiva.', correcta: false }
        ],
        retroAcierto: 'Las tres primeras. La cuarta es la superstición que el módulo desmonta: correlación positiva no basta — hace falta casi-proporcionalidad, y con 0,46 el πPT pierde (deff 1,25).',
        retroFallo: 'Son las tres primeras. La cuarta es falsa y es la lección cara del módulo: el πPT es una apuesta a la proporcionalidad, y con correlación 0,46 la apuesta se pierde (deff 1,25 frente al MAS).'
      },
      {
        tipo: 'numerica',
        modulo: 6,
        pregunta: 'En el diseño de Poisson sobre los 51 estados, $V(n_s) = \\sum \\pi_k(1-\\pi_k) = 5{,}83$. ¿Cuál es la desviación estándar del tamaño de muestra? Dos decimales.',
        pista: 'Raíz cuadrada.',
        respuesta: 2.41,
        tolerancia: 0.02,
        retroAcierto: '$\\sqrt{5{,}83} = 2{,}41$: sobre un E(n) de 10, el diseño entrega entre 7 y 13 la mayoría de las veces (P(9 ≤ n ≤ 11) es solo 0,466). El n aleatorio de Poisson no es un tecnicismo — se siente.',
        retroFallo: 'Es $\\sqrt{5{,}83} = 2{,}41$. Nota el tamaño relativo: ±24 % del n esperado. La convolución exacta del módulo da P(n = 10) = 0,164 — cinco de cada seis veces, el «n = 10» nominal no se cumple.'
      },
      {
        tipo: 'opcion',
        modulo: 7,
        pregunta: 'Sobre agpps, los estimadores de varianza en forma HT y SYG usan los mismos datos y las mismas π_kl, pero dan ee de 70,5 y 11,7 millones. ¿Cuál es el diagnóstico correcto?',
        pista: '¿Cómo suma cada forma sus términos?',
        opciones: [
          { texto: 'La forma HT suma términos grandes de signos opuestos que casi se cancelan — es insesgada pero inestable (hasta puede dar negativa); la SYG suma cuadrados y es la que se usa con tamaño fijo.', correcta: true,
            retro: 'Exacto. Ambas estiman la MISMA varianza teórica; difieren como estimadores. La aritmética de cancelaciones de la forma HT amplifica cualquier desajuste; los cuadrados de SYG no pueden.' },
          { texto: 'La forma HT está mal programada: con los mismos datos deberían dar lo mismo.', correcta: false,
            retro: 'survey reproduce ambas cifras exactamente (variance = "HT" y "YG"): no hay error. Son dos ESTIMADORES distintos de una misma cantidad, y pueden diferir mucho en una muestra concreta.' },
          { texto: 'La SYG subestima: el ee verdadero es el de la forma HT.', correcta: false,
            retro: 'No hay «verdadero» entre los dos sin más información — pero la teoría y la práctica (Lohr §6.4.3) señalan a la forma HT como el estimador errático. Aquí, además, 70 millones implicaría un cv del 7,5 % para un diseño construido para ser preciso.' },
          { texto: 'Las π_kl del archivo están corruptas.', correcta: false,
            retro: 'Las mismas π_kl producen la SYG perfectamente razonable (cv 1,3 %) y reproducen los pesos del archivo. El problema es la forma del estimador, no los datos.' }
        ]
      },
      {
        tipo: 'grafico',
        modulo: 8,
        alto: 240,
        descripcionGrafico: 'Barras del aporte de cada una de las 20 unidades a la varianza del HT bajo Poisson, en escala logarítmica, con una unidad destacada',
        pregunta: 'Los aportes $(1/\\pi_k - 1)y_k^2$ de las 20 unidades del módulo 8, con la π del elefante en 0,02. ¿Qué muestra el gráfico?',
        pista: 'La escala es logarítmica: cada raya de la cuadrícula es un orden de magnitud.',
        dibujar: canvas => {
          const E = D6.elefante;
          const pi = E.piBase.slice(); pi[19] = 0.02;
          const aportes = pi.map((p, i) => (1 / p - 1) * E.y[i] * E.y[i]);
          const g = crearGraficoBarras(canvas, E.y.map((_, i) => i + 1), aportes, {
            etiqueta: 'aporte a V', color: COLORES_GRAFICO.primario, min: 10, max: Math.max(...aportes) * 2
          });
          g.options.scales.y.type = 'logarithmic';
          g.data.datasets[0].backgroundColor = E.y.map((_, i) => i === 19 ? '#FF6600' : '#012820');
          g.update('none');
          return g;
        },
        opciones: [
          { texto: 'La unidad 20 (naranja) aporta órdenes de magnitud más que el resto: y grande con π chica domina la varianza total — es la bomba del π-estimador.', correcta: true,
            retro: 'Correcto. Con π = 0,02, el término (1/0,02 − 1)·8790² aplasta a los otros 19 juntos. La insesgadez sobrevive; la utilidad, no.' },
          { texto: 'Todas las unidades aportan parecido: la escala log lo confirma.', correcta: false,
            retro: 'La escala log DISIMULA diferencias, y aun así la barra naranja sobresale por varios órdenes. En escala lineal, las demás barras ni se verían.' },
          { texto: 'La unidad 20 aporta mucho porque su y es el 82 % del total — cualquier diseño sufriría igual.', correcta: false,
            retro: 'El y grande es la mitad de la historia: con π = 1 (inclusión forzosa) su aporte sería CERO, porque (1/π − 1) se anula. La bomba es la COMBINACIÓN y grande + π chica, y la π sí la elige el diseñador.' },
          { texto: 'El gráfico muestra un error del precálculo: ninguna unidad puede aportar tanto.', correcta: false,
            retro: 'Puede, y esa es la lección: la fórmula exacta $(1/\\pi - 1)y^2$ no tiene techo cuando π → 0 con y fijo. No es un artefacto: es el modo de falla documentado del HT.' }
        ]
      },
      {
        tipo: 'opcion',
        modulo: 9,
        pregunta: 'En classpps, TODOS los estudiantes acaban con peso 32,35. ¿Qué combinación de diseño produce esa igualdad exacta?',
        pista: 'Escribe el peso como producto de las dos etapas y busca qué se cancela.',
        opciones: [
          { texto: 'PPT en la primera etapa (ψ ∝ M_i) con m fijo en la segunda: w = [K/(nM_i)]·[M_i/m] = K/(nm) — el M_i se cancela.', correcta: true,
            retro: 'Esa es la cancelación. El diseño se llama autoponderado, y es la receta de las encuestas de hogares: PPT arriba, cuota fija abajo, pesos planos.' },
          { texto: 'Sortear las clases con probabilidades iguales y compensar con m proporcional a M_i.', correcta: false,
            retro: 'Esa combinación TAMBIÉN autopondera (w = (N/n)·M_i/m_i constante si m_i ∝ M_i), pero no es la de classpps — aquí m = 4 fijo — y tiene el costo práctico de cargas de trabajo desiguales por clase.' },
          { texto: 'Es coincidencia numérica de este archivo.', correcta: false,
            retro: 'Es estructura, no suerte: 32,35 = 647/(5·4) sale de la fórmula para cualquier clase. La cadena del módulo verificó que el peso del archivo coincide con la fórmula en las 5 clases.' },
          { texto: 'survey normaliza los pesos automáticamente para que sean iguales.', correcta: false,
            retro: 'survey usa los pesos tal cual llegan — jamás los iguala. Si el archivo trae pesos dispares (como schools en el cap. 5: 40,9 a 137,6), así se quedan.' }
        ]
      },
      {
        tipo: 'multiple',
        modulo: 10,
        pregunta: 'Sobre muestreo por importancia (estimar el total de condados con propuesta ψ), marca <strong>todo</strong> lo que sea cierto.',
        pista: 'El bloque del módulo 10 calculó tres varianzas exactas: uniforme 557 287, ψ∝población 963 006, ψ∝y 0.',
        opciones: [
          { texto: 'La propuesta ψ ∝ y tiene varianza exactamente cero — pero exige conocer y, que es lo que se busca.', correcta: true },
          { texto: 'Una propuesta correlacionada con y (0,46) puede ser PEOR que el uniforme.', correcta: true },
          { texto: 'Con cualquier ψ conocida y positiva, el estimador sigue siendo insesgado.', correcta: true },
          { texto: 'Si un dataset se recolectó sin registrar las ψ, basta ponderar después para recuperar la insesgadez.', correcta: false }
        ],
        retroAcierto: 'Las tres primeras. La cuarta es el pecado original del capítulo 1: sin ψ conocida no hay pesos válidos que aplicar — la ponderación posterior (cap. 8) es una reparación aproximada, nunca una garantía.',
        retroFallo: 'Son las tres primeras. La cuarta es falsa: los pesos de importancia son 1/ψ, y una ψ que nadie anotó no se puede invertir. Esa es la frontera entre una muestra probabilística y un dataset de conveniencia.'
      },
      {
        tipo: 'grafico',
        modulo: 5,
        alto: 240,
        descripcionGrafico: 'Dos histogramas de 10 000 réplicas del HT del total de waterarea: πPT sistemático frente a MAS de 10 estados',
        pregunta: 'Las réplicas del módulo 5 para <code>waterarea</code> (correlación 0,04 con la población). ¿Cuál histograma es el πPT, y qué veredicto sale?',
        pista: 'Con correlación casi nula, ¿a quién castigan las π desiguales?',
        dibujar: canvas => {
          const V = D6.statepps.waterarea;
          const alto = Math.max(...V.pps.conteo, ...V.mas.conteo) * 1.05;
          return crearGraficoXY(canvas, [
            serieHistograma(V.mas, 'diseño A', COLORES_GRAFICO.primario),
            serieHistograma(V.pps, 'diseño B', COLORES_GRAFICO.secundario),
            serieVertical(V.total, alto, 'total verdadero', COLORES_GRAFICO.gris)
          ], { tituloX: 'HT del total de waterarea', tituloY: 'réplicas' });
        },
        opciones: [
          { texto: 'El B (naranja), el disperso: con correlación 0,04, las π desiguales solo meten ruido — deff ≈ 9 contra el MAS.', correcta: true,
            retro: 'Correcto. Alaska tiene el 40 % del agua y una π modesta; estados enormes en población apenas tienen agua. El cociente y/π queda salvaje y el πPT paga deff 9. πPT sin proporcionalidad es un mal negocio.' },
          { texto: 'El A (verde): el πPT siempre es el más concentrado.', correcta: false,
            retro: '«Siempre» es la palabra equivocada del capítulo. El concentrado aquí es el MAS; el πPT solo se concentra cuando y acompaña al tamaño, y el agua no acompaña a la población.' },
          { texto: 'Los dos están sesgados: los histogramas no se centran en el total.', correcta: false,
            retro: 'Mira la línea gris: ambos histogramas la tienen dentro — los dos HT son insesgados (el MC dio sesgo relativo < 1 %). Lo que difiere brutalmente es la dispersión.' },
          { texto: 'El B, pero el problema es el n: el sistemático usa menos estados.', correcta: false,
            retro: 'Los dos diseños usan exactamente n = 10 estados por réplica. La diferencia entera es CÓMO se reparten las π, no cuántas unidades entran.' }
        ]
      }
    ];
