    // ================================================================
    // Simuladores del capítulo 4
    //
    // Todos leen de DATOS_CAP4, que produce precalculo/genera_cap4.R.
    // Aquí no se calcula nada pesado: histogramas, deciles y varianzas
    // de referencia ya vienen resueltos. Lo único que se computa en
    // vivo son fórmulas cerradas (varianzas de asignaciones, óptimos
    // con costos) y los pliegues sintéticos del módulo 11.
    // ================================================================
    const D4 = DATOS_CAP4;

    // Formato español: espacio fino como separador de miles, coma decimal.
    function fmtNum(x, d = 2) {
      if (!isFinite(x)) return '—';
      const s = Math.abs(x).toFixed(d);
      const partes = s.split('.');
      const entero = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      return (x < 0 ? '−' : '') + entero + (partes[1] ? ',' + partes[1] : '');
    }

    function fmtPct(x, d = 1) { return fmtNum(100 * x, d) + ' %'; }

    // La varianza del estimador estratificado de la media con un reparto
    // cualquiera, con los datos poblacionales del precálculo. Es la fórmula
    // del módulo 2; la usan cuatro simuladores.
    function varEstratificada(nh) {
      const A = D4.asignaciones;
      let v = 0;
      for (let h = 0; h < 4; h++) {
        v += A.Wh[h] ** 2 * (1 - nh[h] / A.Nh[h]) * A.Sh[h] ** 2 / nh[h];
      }
      return v;
    }

    function varMasDe(n) {
      return (1 - n / D4.poblacion.N) * D4.poblacion.S2 / n;
    }

    // ---------------------------------------------------------------
    // M3 · El promedio bruto contra el ponderado
    // ---------------------------------------------------------------
    SIMULADORES['promedio-bruto'] = function (raiz) {
      const A = D4.asignaciones;
      const params = { nNC: A.prop[0], nNE: A.prop[1], nS: A.prop[2], nW: A.prop[3] };
      const lienzo = raiz.querySelector('canvas');

      const g = crearGraficoBarras(lienzo,
        ['Promedio bruto (esperado)', 'Estimador ponderado (esperado)'],
        [0, 0], {
          etiqueta: 'acres por condado', color: COLORES_GRAFICO.primario,
          min: 200000, max: 450000,
          lineas: [{ valor: D4.poblacion.media, etiqueta: 'media verdadera: 306 677',
                     color: COLORES_GRAFICO.secundario }]
        });

      function pintar() {
        const nh = [params.nNC, params.nNE, params.nS, params.nW];
        const n = nh.reduce((a, b) => a + b, 0);
        // Valor esperado del promedio bruto: pondera por la composicion
        // MUESTRAL. El ponderado usa los W_h poblacionales: clavado siempre.
        const bruto = nh.reduce((acc, x, h) => acc + x * A.mediaH[h], 0) / n;
        const pond = A.Wh.reduce((acc, w, h) => acc + w * A.mediaH[h], 0);
        g.data.datasets[0].data = [bruto, pond];
        g.update('none');

        const sesgo = bruto - D4.poblacion.media;
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'n total:', valor: fmtNum(n, 0) },
          { etiqueta: 'reparto (NC/NE/S/W):', valor: nh.join(' / ') },
          { etiqueta: 'sesgo del promedio bruto:', valor: fmtNum(sesgo, 0) + ' acres' },
          { etiqueta: 'sesgo del ponderado:', valor: '0 (siempre)' },
          { etiqueta: 'ee del ponderado:', valor: fmtNum(Math.sqrt(varEstratificada(nh)), 0) }
        ]);
      }

      crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'nNC', etiqueta: 'Entrevistas en NC', min: 5, max: 250, paso: 1 },
        { clave: 'nNE', etiqueta: 'Entrevistas en NE', min: 5, max: 200, paso: 1 },
        { clave: 'nS', etiqueta: 'Entrevistas en S', min: 5, max: 250, paso: 1 },
        { clave: 'nW', etiqueta: 'Entrevistas en W', min: 5, max: 250, paso: 1 }
      ], params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M4 · El asignador: reparte y mide
    // ---------------------------------------------------------------
    SIMULADORES['asignador'] = function (raiz) {
      const A = D4.asignaciones;
      const params = { nNC: A.prop[0], nNE: A.prop[1], nS: A.prop[2], nW: A.prop[3] };
      const lienzos = raiz.querySelectorAll('canvas');

      const gReparto = crearGraficoBarras(lienzos[0], A.regiones, [0, 0, 0, 0], {
        etiqueta: 'tu reparto', color: COLORES_GRAFICO.primario, min: 0, max: 160,
        barrasExtra: [{ etiqueta: 'Neyman', valores: A.neyman, color: COLORES_GRAFICO.secundario }]
      });

      const gEE = crearGraficoBarras(lienzos[1],
        ['tuyo', 'proporcional', 'igual', 'Neyman', 'MAS'],
        [0, 0, 0, 0, 0], {
          etiqueta: 'error estándar', color: COLORES_GRAFICO.primario, min: 0, max: 30000
        });

      function pintar() {
        const nh = [params.nNC, params.nNE, params.nS, params.nW];
        const n = nh.reduce((a, b) => a + b, 0);
        const eeTuyo = Math.sqrt(varEstratificada(nh));
        const eeMas = Math.sqrt(varMasDe(n));

        gReparto.data.datasets[0].data = nh;
        gReparto.update('none');
        gEE.data.datasets[0].data = [
          eeTuyo, Math.sqrt(A.V.prop), Math.sqrt(A.V.igual), Math.sqrt(A.V.neyman),
          Math.sqrt(A.V.mas)
        ];
        gEE.update('none');

        const contra = eeTuyo / Math.sqrt(A.V.neyman) - 1;
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'n total:', valor: fmtNum(n, 0) + (n === 300 ? '' : ' (las referencias usan 300)') },
          { etiqueta: 'tu error estándar:', valor: fmtNum(eeTuyo, 0) },
          { etiqueta: 'deff frente a un MAS de tu mismo n:', valor: fmtNum(varEstratificada(nh) / varMasDe(n), 4) },
          { etiqueta: 'contra Neyman (n = 300):', valor: (contra >= 0 ? '+' : '') + fmtPct(contra) }
        ]);
      }

      crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'nNC', etiqueta: 'Entrevistas en NC (N=1054)', min: 5, max: 280, paso: 1 },
        { clave: 'nNE', etiqueta: 'Entrevistas en NE (N=220)', min: 5, max: 200, paso: 1 },
        { clave: 'nS', etiqueta: 'Entrevistas en S (N=1382)', min: 5, max: 280, paso: 1 },
        { clave: 'nW', etiqueta: 'Entrevistas en W (N=422)', min: 5, max: 280, paso: 1 }
      ], params, pintar);
      pintar();
      return [gReparto, gEE];
    };

    // ---------------------------------------------------------------
    // M5 · El presupuesto manda
    // ---------------------------------------------------------------
    SIMULADORES['presupuesto'] = function (raiz) {
      const A = D4.asignaciones;
      const chBase = [D4.costos.ch.NC, D4.costos.ch.NE, D4.costos.ch.S, D4.costos.ch.W];
      const params = { C: D4.costos.C, cW: chBase[3] };
      const lienzo = raiz.querySelector('canvas');

      const g = crearGraficoBarras(lienzo, A.regiones, [0, 0, 0, 0], {
        etiqueta: 'reparto óptimo', color: COLORES_GRAFICO.primario, min: 0, max: 260
      });

      function pintar() {
        const ch = [chBase[0], chBase[1], chBase[2], params.cW];
        const crudo = A.Nh.map((Nh, h) => Nh * A.Sh[h] / Math.sqrt(ch[h]));
        const esc = params.C / crudo.reduce((acc, x, h) => acc + ch[h] * x, 0);
        const nh = crudo.map(x => esc * x);
        const n = nh.reduce((a, b) => a + b, 0);
        const ee = Math.sqrt(varEstratificada(nh));

        // La proporcional que compra el mismo presupuesto: n_h = n_p W_h con
        // n_p tal que el costo total sea C.
        const costoMedio = ch.reduce((acc, c, h) => acc + c * A.Wh[h], 0);
        const nProp = A.Wh.map(w => params.C / costoMedio * w);
        const eeProp = Math.sqrt(varEstratificada(nProp));

        g.data.datasets[0].data = nh;
        g.update('none');

        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'entrevistas que compra el óptimo:', valor: fmtNum(n, 1) },
          { etiqueta: 'reparto (NC/NE/S/W):', valor: nh.map(x => x.toFixed(1)).join(' / ') },
          { etiqueta: 'error estándar del óptimo:', valor: fmtNum(ee, 0) },
          { etiqueta: 'proporcional del mismo costo:', valor: fmtNum(nProp.reduce((a, b) => a + b, 0), 1) +
            ' entrevistas, ee ' + fmtNum(eeProp, 0) },
          { etiqueta: 'ganancia del óptimo:', valor: fmtPct(1 - ee / eeProp) }
        ]);
      }

      crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'C', etiqueta: 'Presupuesto total C', min: 1500, max: 6000, paso: 100 },
        { clave: 'cW', etiqueta: 'Costo por entrevista en el Oeste', min: 6, max: 36, paso: 1 }
      ], params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M6 · El constructor de estratos
    // ---------------------------------------------------------------
    SIMULADORES['constructor'] = function (raiz) {
      const C = D4.constructor;
      const params = { H: 4 };
      const lienzo = raiz.querySelector('canvas');
      const refRegion = C.opciones[0].deff;
      const refFarms = C.opciones[2].deff;
      const refAzar = C.opciones[4].deff;

      const g = crearGraficoXY(lienzo, [], {
        tituloX: 'número de estratos H (cuantiles de acres87)',
        tituloY: 'deff', xMin: 1.5, xMax: 10.5
      });

      function pintar() {
        const curva = C.barridoH.map(b => ({ x: b.H, y: b.deff }));
        const actual = C.barridoH.find(b => b.H === params.H);
        g.data.datasets = [
          { type: 'line', label: 'cuantiles de acres87', data: curva,
            borderColor: COLORES_GRAFICO.primario, borderWidth: 2, pointRadius: 3, fill: false },
          { type: 'scatter', label: 'tu H', data: [{ x: params.H, y: actual.deff }],
            backgroundColor: COLORES_GRAFICO.secundario, pointRadius: 7 },
          serieVertical(params.H, 1.05, '', '#cbd5e1'),
          { type: 'line', label: 'región (H=4)', data: [{ x: 1.5, y: refRegion }, { x: 10.5, y: refRegion }],
            borderColor: COLORES_GRAFICO.gris, borderDash: [6, 4], borderWidth: 1.5, pointRadius: 0, fill: false },
          { type: 'line', label: 'farms92 (H=4)', data: [{ x: 1.5, y: refFarms }, { x: 10.5, y: refFarms }],
            borderColor: '#b45309', borderDash: [2, 3], borderWidth: 1.5, pointRadius: 0, fill: false },
          { type: 'line', label: 'al azar', data: [{ x: 1.5, y: refAzar }, { x: 10.5, y: refAzar }],
            borderColor: '#dc2626', borderDash: [1, 3], borderWidth: 1.5, pointRadius: 0, fill: false }
        ];
        g.options.scales.y.max = 1.1;
        g.update('none');

        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'H elegido:', valor: String(params.H) },
          { etiqueta: 'deff:', valor: fmtNum(actual.deff, 4) },
          { etiqueta: 'error estándar:', valor: fmtNum(Math.sqrt(actual.V), 0) },
          { etiqueta: 'n efectivo (n = 300):', valor: fmtNum(300 / actual.deff, 0) },
          { etiqueta: 'ganancia extra de H=' + params.H + ' a H=10:',
            valor: fmtPct(actual.deff - C.barridoH[C.barridoH.length - 1].deff, 1) + ' de deff' }
        ]);
      }

      crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'H', etiqueta: 'Número de estratos H', min: 2, max: 10, paso: 1 }
      ], params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M7 · 10 000 muestras de cada diseño
    // ---------------------------------------------------------------
    SIMULADORES['distribucion'] = function (raiz) {
      const D = D4.distribucion;
      const A = D4.asignaciones;
      const params = { curva: 4 };
      const lienzo = raiz.querySelector('canvas');
      const NOMBRES = ['ninguna', 'MAS', 'proporcional', 'igual', 'Neyman'];
      const VARS = [NaN, A.V.mas, A.V.prop, A.V.igual, A.V.neyman];

      const g = crearGraficoXY(lienzo, [], {
        tituloX: 'media estimada (acres)', tituloY: 'réplicas por caja'
      });

      function curvaNormal(V) {
        // Curva N(media, V) escalada a la altura del histograma: el area de
        // cada caja es conteo, asi que la densidad se multiplica por
        // replicas * ancho.
        const sd = Math.sqrt(V);
        const esc = D.replicas * D.mas.ancho;
        const puntos = [];
        for (let i = 0; i <= 80; i++) {
          const x = D.media - 4 * sd + i * sd / 10;
          puntos.push({ x: x, y: esc * Math.exp(-0.5 * ((x - D.media) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI)) });
        }
        return puntos;
      }

      function pintar() {
        const alto = Math.max(...D.mas.conteo, ...D.estratificado.conteo) * 1.05;
        const datasets = [
          serieHistograma(D.mas, 'MAS (réplicas)', COLORES_GRAFICO.primario),
          serieHistograma(D.estratificado, 'estratificado prop. (réplicas)', COLORES_GRAFICO.secundario),
          serieVertical(D.media, alto, 'media verdadera', COLORES_GRAFICO.gris)
        ];
        if (params.curva > 0) {
          datasets.push({
            type: 'line', label: 'normal teórica: ' + NOMBRES[params.curva],
            data: curvaNormal(VARS[params.curva]),
            borderColor: '#7c3aed', borderWidth: 2, pointRadius: 0, fill: false
          });
        }
        g.data.datasets = datasets;
        g.update('none');

        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'réplicas por diseño:', valor: fmtNum(D.replicas, 0) },
          { etiqueta: 'V empírica / teórica (MAS):', valor: fmtNum(D.varMas / A.V.mas, 3) },
          { etiqueta: 'V empírica / teórica (estratificado):', valor: fmtNum(D.varStr / A.V.prop, 3) },
          { etiqueta: 'cobertura IC 95 % (MAS):', valor: fmtPct(D.coberturaMas) },
          { etiqueta: 'cobertura IC 95 % (estratificado):', valor: fmtPct(D.coberturaStr) },
          { etiqueta: 'curva superpuesta:', valor: NOMBRES[params.curva] +
            (params.curva > 0 ? ' (ee ' + fmtNum(Math.sqrt(VARS[params.curva]), 0) + ')' : '') }
        ]);
      }

      crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'curva', etiqueta: 'Curva teórica (0 ninguna · 1 MAS · 2 prop · 3 igual · 4 Neyman)',
          min: 0, max: 4, paso: 1 }
      ], params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M9 · La rueda de las ψ
    // ---------------------------------------------------------------
    SIMULADORES['psi-pesos'] = function (raiz) {
      const P = D4.ppt;
      const params = { estrato: 1, empleados: 120 };
      const lienzo = raiz.querySelector('canvas');
      const NIVELES = ['Big', 'Medium', 'Small'];
      const MH = [P.mh.Big, P.mh.Medium, P.mh.Small];

      const g = crearGraficoBarras(lienzo,
        ['p10', 'p20', 'p30', 'p40', 'p50', 'p60', 'p70', 'p80', 'p90', 'p100'],
        [], {
          etiqueta: 'ψ del decil (×10⁶)', color: COLORES_GRAFICO.primario, min: 0, max: 100
        });

      function pintar() {
        const h = params.estrato - 1;
        const est = P.estratos[h];
        const deciles = P.psiDeciles[h].slice(1).map(x => 1e6 * x);
        const psi = params.empleados / est.totalEmployees;
        const veces = MH[h] * psi;

        g.data.datasets[0].data = deciles;
        g.options.scales.y.max = Math.max(...deciles, 1e6 * psi) * 1.15;
        g.options.plugins.annotation = undefined;
        // La linea de "tu empresa" se dibuja como dataset extra:
        g.data.datasets = [g.data.datasets[0],
          { type: 'line', label: 'tu empresa (×10⁶)',
            data: [{ x: -0.5, y: 1e6 * psi }, { x: 9.5, y: 1e6 * psi }],
            borderColor: COLORES_GRAFICO.secundario, borderDash: [6, 4],
            borderWidth: 2, pointRadius: 0, fill: false }];
        g.update('none');

        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'estrato:', valor: NIVELES[h] + ' (' + fmtNum(est.Nh, 0) + ' empresas, m = ' + MH[h] + ')' },
          { etiqueta: 'ψ de tu empresa:', valor: psi.toExponential(3) },
          { etiqueta: 'veces que espera salir en las m extracciones:', valor: fmtNum(veces, 4) },
          { etiqueta: 'peso con el que entra si sale una vez:', valor: fmtNum(1 / (MH[h] * psi), 1) },
          { etiqueta: 'regla:', valor: 'doble de empleados → doble ψ → mitad de peso' }
        ]);
      }

      crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'estrato', etiqueta: 'Estrato (1 Big · 2 Medium · 3 Small)', min: 1, max: 3, paso: 1 },
        { clave: 'empleados', etiqueta: 'Empleados de tu empresa', min: 1, max: 600, paso: 1 }
      ], params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M10 · La calibración ancla el estimador
    // ---------------------------------------------------------------
    SIMULADORES['calibracion'] = function (raiz) {
      const PS = D4.postestratificacion;
      const params = { nNC: PS.conteos[0], nNE: PS.conteos[1], nS: PS.conteos[2], nW: PS.conteos[3] };
      const lienzo = raiz.querySelector('canvas');

      const g = crearGraficoBarras(lienzo,
        ['Promedio bruto', 'Postestratificado'],
        [0, 0], {
          etiqueta: 'media estimada', color: COLORES_GRAFICO.primario,
          min: 240000, max: 380000,
          lineas: [{ valor: PS.ybarPost, etiqueta: 'postestratificado con los n_h reales',
                     color: COLORES_GRAFICO.secundario }]
        });

      function pintar() {
        const nh = [params.nNC, params.nNE, params.nS, params.nW];
        const n = nh.reduce((a, b) => a + b, 0);
        // Medias por region del MAS agsrs, fijas: lo unico que cambia entre
        // escenarios es CUANTOS condados salieron de cada region.
        const bruto = nh.reduce((acc, x, h) => acc + x * PS.ybarH[h], 0) / n;
        const post = PS.Wh.reduce((acc, w, h) => acc + w * PS.ybarH[h], 0);
        let vCond = 0;
        for (let h = 0; h < 4; h++) {
          vCond += PS.Wh[h] ** 2 * (1 - nh[h] / PS.Nh[h]) * PS.s2H[h] / nh[h];
        }

        g.data.datasets[0].data = [bruto, post];
        g.update('none');

        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'composición (NC/NE/S/W):', valor: nh.join(' / ') + ' de n = ' + n },
          { etiqueta: 'promedio bruto:', valor: fmtNum(bruto, 0) },
          { etiqueta: 'postestratificado:', valor: fmtNum(post, 0) + ' (no depende de la composición)' },
          { etiqueta: 'pesos N_h/n_h:', valor: nh.map((x, h) => (PS.Nh[h] / x).toFixed(1)).join(' / ') },
          { etiqueta: 'ee condicional:', valor: fmtNum(Math.sqrt(vCond), 0) }
        ]);
      }

      crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'nNC', etiqueta: 'Condados que salieron de NC', min: 40, max: 180, paso: 1 },
        { clave: 'nNE', etiqueta: 'Condados que salieron de NE', min: 5, max: 70, paso: 1 },
        { clave: 'nS', etiqueta: 'Condados que salieron de S', min: 60, max: 200, paso: 1 },
        { clave: 'nW', etiqueta: 'Condados que salieron de W', min: 8, max: 90, paso: 1 }
      ], params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M11 · Pliegues estratificados contra pliegues a secas
    //
    // Unico simulador del capitulo que sortea en vivo: una poblacion
    // sintetica de 3000 puntos con PRNG de semilla fija (mulberry32),
    // para que el mismo escenario produzca siempre los mismos pliegues.
    // ---------------------------------------------------------------
    SIMULADORES['kfold'] = function (raiz) {
      const params = { prevalencia: 5, k: 5 };
      const lienzo = raiz.querySelector('canvas');
      const NPOB = 3000;

      function mulberry32(a) {
        return function () {
          a |= 0; a = a + 0x6D2B79F5 | 0;
          let t = Math.imul(a ^ a >>> 15, 1 | a);
          t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
          return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
      }

      function baraja(arr, rnd) {
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(rnd() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
      }

      const g = crearGraficoBarras(lienzo, [], [], {
        etiqueta: 'sin estratificar', color: COLORES_GRAFICO.primario, min: 0, max: 0.12
      });

      function pintar() {
        const m = Math.round(NPOB * params.prevalencia / 100);
        const k = params.k;
        const rnd = mulberry32(2026 + 1000 * params.prevalencia + k);
        const y = baraja(Array.from({ length: NPOB }, (_, i) => i < m ? 1 : 0), rnd);

        // KFold a secas: trocea la poblacion barajada en k partes seguidas.
        const simple = [];
        for (let f = 0; f < k; f++) {
          const ini = Math.floor(f * NPOB / k), fin = Math.floor((f + 1) * NPOB / k);
          const trozo = y.slice(ini, fin);
          simple.push(trozo.reduce((a, b) => a + b, 0) / trozo.length);
        }

        // Estratificado: reparte positivos y negativos por separado, en
        // ronda, como StratifiedKFold.
        const pos = [], neg = [];
        y.forEach((v, i) => (v ? pos : neg).push(i));
        baraja(pos, rnd); baraja(neg, rnd);
        const conteoPos = Array(k).fill(0), conteoTot = Array(k).fill(0);
        pos.forEach((_, i) => { conteoPos[i % k]++; conteoTot[i % k]++; });
        neg.forEach((_, i) => { conteoTot[i % k]++; });
        const estr = conteoPos.map((p, f) => p / conteoTot[f]);

        g.data.labels = Array.from({ length: k }, (_, f) => 'pliegue ' + (f + 1));
        g.data.datasets = [
          { type: 'bar', label: 'sin estratificar', data: simple,
            backgroundColor: COLORES_GRAFICO.primario, borderWidth: 0,
            barPercentage: 0.4, categoryPercentage: 0.9 },
          { type: 'bar', label: 'estratificado', data: estr,
            backgroundColor: COLORES_GRAFICO.secundario, borderWidth: 0,
            barPercentage: 0.4, categoryPercentage: 0.9 },
          { type: 'line', label: 'prevalencia real',
            data: Array(k).fill(params.prevalencia / 100),
            borderColor: COLORES_GRAFICO.gris, borderDash: [6, 4], borderWidth: 1.5,
            pointRadius: 0, fill: false }
        ];
        g.options.scales.y.max = Math.max(0.12, 2.2 * params.prevalencia / 100);
        g.update('none');

        const rango = a => Math.max(...a) - Math.min(...a);
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'positivos en la población:', valor: fmtNum(m, 0) + ' de ' + fmtNum(NPOB, 0) },
          { etiqueta: 'positivos esperados por pliegue:', valor: fmtNum(m / k, 1) },
          { etiqueta: 'rango de proporciones sin estratificar:', valor: fmtPct(rango(simple), 2) },
          { etiqueta: 'rango estratificado:', valor: fmtPct(rango(estr), 2) },
          { etiqueta: 'peor pliegue sin estratificar:', valor: fmtPct(Math.min(...simple), 2) + ' de positivos' }
        ]);
      }

      crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'prevalencia', etiqueta: 'Prevalencia de la clase minoritaria (%)', min: 1, max: 30, paso: 1 },
        { clave: 'k', etiqueta: 'Número de pliegues k', min: 2, max: 10, paso: 1 }
      ], params, pintar);
      pintar();
      return [g];
    };

    // ================================================================
    // Tabla-ranking del módulo 8: todos los diseños del capítulo
    // ================================================================
    TABLAS_RANKING['disenos'] = function () {
      const A = D4.asignaciones;
      const CO = D4.costos;
      return {
        descripcion: 'Los cinco diseños del capítulo sobre la misma población y la misma variable. ' +
          'Las varianzas son teóricas (agpop es un censo y se calculan exactas), no estimadas de ' +
          'una muestra. Pulsa cualquier cabecera para reordenar.',
        columnas: [
          { clave: 'diseno', titulo: 'Diseño', tipo: 'texto' },
          { clave: 'n', titulo: 'Entrevistas', decimales: 0 },
          { clave: 'ee', titulo: 'Error estándar', decimales: 0, mejor: 'menor' },
          { clave: 'deff', titulo: 'deff', decimales: 3, mejor: 'menor' },
          { clave: 'requisito', titulo: 'Qué exige del marco', tipo: 'texto' }
        ],
        filas: [
          { diseno: 'MAS (capítulo 2)', n: 300, ee: Math.sqrt(A.V.mas), deff: 1,
            requisito: 'solo la lista' },
          { diseno: 'Estratificado proporcional', n: 300, ee: Math.sqrt(A.V.prop),
            deff: A.deff.prop, requisito: 'estrato de cada unidad' },
          { diseno: 'Estratificado igual', n: 300, ee: Math.sqrt(A.V.igual),
            deff: A.deff.igual, requisito: 'estrato de cada unidad' },
          { diseno: 'Estratificado Neyman', n: 300, ee: Math.sqrt(A.V.neyman),
            deff: A.deff.neyman, requisito: 'estrato + S_h aproximadas' },
          { diseno: 'Óptimo con costos (mismo dinero)', n: CO.optimo.n, ee: Math.sqrt(CO.optimo.V),
            deff: CO.optimo.V / A.V.mas, requisito: 'estrato + S_h + costos c_h' }
        ],
        inicial: 'ee',
        destacada: 'Estratificado Neyman',
        pie: 'Cada fila exige saber un poco más que la anterior, y cada dato extra compra varianza: ' +
          'de la lista pelada al deff 0,55 de Neyman hay un 45 % de varianza pagado con columnas del ' +
          'marco, no con entrevistas. El óptimo con costos usa 265 entrevistas —no 300— y aun así ' +
          'le gana a la proporcional: compra información donde es barata. Fuera de esta tabla queda ' +
          'la postestratificación (módulo 10), que es la única que se puede decidir después de ' +
          'muestrear: su ee estimado con agsrs fue 17 513, entre la proporcional y Neyman.'
      };
    };

    // ================================================================
    // Diagrama de diseño del módulo 1: la tubería de agstrat
    // ================================================================
    DIAGRAMAS_DISENO['estratificado'] = {
      titulo: 'El diseño de agstrat, de la población a los pesos',
      intro: 'Pulsa cada etapa. La única con azar es la tercera — y el azar está confinado ' +
        'dentro de cada región.',
      nota: 'Compara con el diagrama de dos etapas del capítulo 5: aquí solo hay una etapa de ' +
        'sorteo, así que π y peso tienen un solo factor. En cuanto el diseño encadene sorteos, ' +
        'la franja de abajo se convertirá en un producto.',
      etapas: [
        {
          etiqueta: 'Población',
          unidad: '3 078 condados',
          icono: 'fa-globe-americas',
          resumen: 'El marco de Lohr completo, con sus 19 códigos −99 incluidos (decisión del ' +
            'capítulo 2). Todavía no hay azar: solo una lista con columnas.',
          cifras: [{ k: 'N', v: '3 078' }, { k: 'media', v: '306 677 acres' }]
        },
        {
          etiqueta: 'Estratos',
          unidad: '4 regiones del censo',
          icono: 'fa-layer-group',
          resumen: 'La columna region parte el marco en cuatro grupos disjuntos de tamaños ' +
            'conocidos. Tampoco hay azar: los estratos los fija el diseñador antes de sortear, ' +
            'y esa es la diferencia con los conglomerados del capítulo 5.',
          cifras: [{ k: 'NC', v: '1 054' }, { k: 'NE', v: '220' }, { k: 'S', v: '1 382' },
                   { k: 'W', v: '422' }]
        },
        {
          etiqueta: 'MAS por estrato',
          unidad: 'sorteos independientes',
          icono: 'fa-dice',
          resumen: 'Dentro de cada región, un MAS con cuota fijada de antemano: 103, 21, 135 y 41. ' +
            'Aquí vive todo el azar del diseño, y la independencia entre sorteos es la que anula ' +
            'la covarianza entre estratos.',
          pi: '\\pi_k = n_h/N_h \\approx 0{,}097',
          peso: 'N_h/n_h',
          cifras: [{ k: 'n', v: '300' }, { k: 'n_h', v: '103 / 21 / 135 / 41' }],
          ejemplo: 'la cuota del Nordeste (21) queda garantizada; con urna única era una lotería.'
        },
        {
          etiqueta: 'Estimación',
          unidad: 'pesos de diseño',
          icono: 'fa-calculator',
          resumen: 'Cada condado entra con su peso N_h/n_h (entre 10,23 y 10,48: casi ' +
            'autoponderada, porque la asignación es proporcional). El estimador suma estrato a ' +
            'estrato, y su varianza también.',
          peso: 'w_k = N_h/n_h \\in [10{,}23,\\; 10{,}48]',
          cifras: [{ k: 'media estimada', v: '295 561' }, { k: 'ee', v: '16 380' },
                   { k: 'deff', v: '0,75' }],
          ejemplo: 'olvidar estos pesos estima otra cosa — módulo 3.'
        }
      ],
      acumulado: {
        rotulo: 'El diseño completo',
        formula: '\\pi_k = \\frac{n_h}{N_h} \\qquad w_k = \\frac{N_h}{n_h} \\qquad ' +
          'V(\\bar{y}_{\\text{str}}) = \\sum_h W_h^2 \\left(1 - \\frac{n_h}{N_h}\\right)\\frac{S^2_{y,h}}{n_h}',
        texto: 'Una sola etapa de azar, confinada al estrato: por eso π tiene un solo factor y la ' +
          'varianza solo paga lo que pasa dentro de cada región.'
      }
    };

    // ================================================================
    // Glosario de notación del capítulo 4
    // ================================================================
    GLOSARIOS['estratificado'] = {
      titulo: 'Notación: este material ↔ Lohr ↔ Gutiérrez',
      nota: 'La tabla del capítulo 2 sigue valiendo; esta añade solo el vocabulario del ' +
        'estratificado. El choque más traicionero es $S^2_h$: Lohr y este material usan el ' +
        'divisor $N_h - 1$, y Gutiérrez escribe $S^2_{y,U_h}$ para lo mismo.',
      filas: [
        { concepto: 'Estrato h', aqui: 'U_h', lohr: 'estrato $h$', gutierrez: 'U_h', r: 'region' },
        { concepto: 'Número de estratos', aqui: 'H', lohr: 'H', gutierrez: 'H', r: 'nlevels()' },
        { concepto: 'Tamaño del estrato', aqui: 'N_h', lohr: 'N_h', gutierrez: 'N_h', r: 'table(agpop$region)' },
        { concepto: 'Muestra del estrato', aqui: 'n_h', lohr: 'n_h', gutierrez: 'n_h', r: 'table(agstrat$region)' },
        { concepto: 'Peso del estrato', aqui: 'W_h = N_h/N', lohr: 'N_h/N', gutierrez: 'W_h', r: 'Nh/N' },
        { concepto: 'Media del estrato', aqui: '\\bar{y}_h', lohr: '\\bar{y}_h', gutierrez: '\\bar{y}_{s_h}', r: 'tapply(y, region, mean)' },
        { concepto: 'Varianza del estrato', aqui: 'S^2_{y,h}', lohr: 'S_h^2', gutierrez: 'S^2_{y,U_h}', r: 'tapply(y, region, var)' },
        { concepto: 'Estimador estratificado', aqui: '\\bar{y}_{\\text{str}} = \\sum W_h \\bar{y}_h', lohr: '\\bar{y}_{\\text{str}}', gutierrez: '\\hat{t}_\\pi / N', r: 'svymean()' },
        { concepto: 'Probabilidad de inclusión', aqui: '\\pi_k = n_h/N_h', lohr: 'n_h/N_h', gutierrez: '\\pi_k', r: 'nh/Nh' },
        { concepto: 'Peso de diseño', aqui: 'w_k = N_h/n_h', lohr: 'w_i', gutierrez: '1/\\pi_k', r: 'weights=~strwt' },
        { concepto: 'Efecto de diseño', aqui: '\\text{deff}', lohr: '\\text{deff}', gutierrez: 'DEFF', r: 'deff=TRUE en svymean' },
        { concepto: 'Prob. de selección PPT', aqui: '\\psi_k = x_k/t_{x,h}', lohr: '\\psi_i', gutierrez: 'p_k', r: 'S.STPPS()' }
      ]
    };

    // ================================================================
    // Autoevaluación del capítulo 4
    // ================================================================
    AUTOEVALUACIONES['cap4'] = [
      {
        tipo: 'opcion',
        modulo: 2,
        pregunta: 'En el diseño estratificado, dos condados del mismo estrato tienen $\\pi_{kl} = \\frac{n_h}{N_h}\\frac{n_h-1}{N_h-1}$, pero dos de estratos distintos tienen $\\pi_{kl} = \\pi_k \\pi_l$ exactamente. ¿Qué consecuencia tiene eso?',
        pista: 'Mira el término $(\\pi_{kl} - \\pi_k\\pi_l)$ en la varianza de Sen–Yates–Grundy.',
        opciones: [
          { texto: 'Los pares de estratos distintos no aportan nada a la varianza: la varianza total es la suma de las varianzas por estrato.', correcta: true,
            retro: 'Exacto. $\\pi_{kl} - \\pi_k\\pi_l = 0$ mata el término cruzado, y la fórmula general del capítulo 2 se reduce a la clásica del estratificado.' },
          { texto: 'El estimador queda sesgado, porque las unidades de estratos distintos no se vigilan entre sí.', correcta: false,
            retro: 'La insesgadez solo necesita las $\\pi_k$ de primer orden, y esas están todas donde deben. Las $\\pi_{kl}$ solo gobiernan la varianza.' },
          { texto: 'Hay que usar el estimador de Hansen–Hurwitz en lugar del de Horvitz–Thompson.', correcta: false,
            retro: 'Hansen–Hurwitz es para diseños con reemplazo (módulo 9). El estratificado clásico es sin reemplazo y HT funciona perfectamente.' },
          { texto: 'La varianza no se puede estimar, como pasaba con el sistemático.', correcta: false,
            retro: 'Al revés: en el sistemático había pares con $\\pi_{kl} = 0$ dentro del soporte del diseño. Aquí todas las $\\pi_{kl}$ son positivas y la varianza se estima sin apuros.' }
        ]
      },
      {
        tipo: 'numerica',
        modulo: 2,
        pregunta: 'En agstrat, el Nordeste tiene $N_h = 220$ condados y $n_h = 21$ en la muestra. ¿Cuánto vale el peso de diseño $w_k$ de un condado del Nordeste? Usa dos decimales.',
        pista: 'El peso es el recíproco de la probabilidad de inclusión: $N_h / n_h$.',
        respuesta: 10.48,
        tolerancia: 0.011,
        retroAcierto: '$220/21 = 10{,}476$: cada condado del Nordeste habla por unos 10,5 condados de su región. La columna strwt del archivo trae exactamente esto.',
        retroFallo: 'Es $N_h/n_h = 220/21 = 10{,}48$. Cuidado con invertirlo ($21/220$ es la probabilidad, no el peso) y con usar los totales $N/n = 3078/300$, que es el peso de un MAS, no el de este estrato.'
      },
      {
        tipo: 'opcion',
        modulo: 3,
        pregunta: 'Un analista recibe agstrat, calcula <code>mean(acres92)</code> sin pesos y obtiene un número muy parecido al estimador correcto. Concluye que los pesos son un formalismo. ¿Qué le falta ver?',
        pista: '¿Qué propiedad especial tiene la asignación de agstrat que no tiene cualquier asignación?',
        opciones: [
          { texto: 'Que la asignación de agstrat es casi proporcional (autoponderada): con Neyman, que asigna 107 al Oeste en lugar de 41, el promedio bruto se va lejos.', correcta: true,
            retro: 'Eso es. Con asignación de Neyman el promedio bruto esperado sube más de 60 000 acres, porque el Oeste — la región de condados gigantes — pasa a estar sobrerrepresentado en la muestra. El simulador del módulo 3 lo muestra en vivo.' },
          { texto: 'Nada: si los números coinciden, el método da igual.', correcta: false,
            retro: 'Coinciden en ESTE diseño porque los pesos son casi iguales. Un método que funciona por casualidad es una bomba de relojería: la próxima muestra estratificada que reciba puede ser de Neyman.' },
          { texto: 'Que el promedio bruto siempre está sesgado en muestras estratificadas.', correcta: false,
            retro: '«Siempre» es demasiado: con asignación exactamente proporcional el bruto y el ponderado coinciden en esperanza. El punto es que eso es una propiedad de una asignación concreta, no del estratificado.' },
          { texto: 'Que había que usar la mediana, no la media, por la asimetría.', correcta: false,
            retro: 'La asimetría es un tema real (módulo 7), pero no es este tema: aquí la cuestión es qué población representa cada observación, y eso lo dicen los pesos.' }
        ]
      },
      {
        tipo: 'multiple',
        modulo: 4,
        pregunta: 'La asignación de Neyman le dio al Nordeste solo 5 de las 300 entrevistas. Marca <strong>todo</strong> lo que sea cierto.',
        pista: 'Neyman optimiza el agregado nacional. ¿Qué pasa con lo demás?',
        opciones: [
          { texto: 'Para estimar el total nacional, es la mejor asignación posible con estos estratos.', correcta: true },
          { texto: 'Una estimación separada para el Nordeste quedará pésima: con 5 observaciones apenas hay con qué estimar su varianza.', correcta: true },
          { texto: 'El estimador nacional queda sesgado por abandonar así una región.', correcta: false },
          { texto: 'Si el objetivo fueran comparaciones entre regiones, convendría la asignación igual.', correcta: true }
        ],
        retroAcierto: 'Las tres verdaderas dibujan el conflicto real del diseño: óptimo global, subgrupos pobres, y la asignación depende del objetivo. Sesgo no hay nunca: 5 entrevistas con peso 44 son pocas, pero son insesgadas.',
        retroFallo: 'Son la primera, la segunda y la cuarta. La tercera es falsa: ninguna asignación con $n_h \\geq 1$ y pesos correctos sesga el estimador — asignar mal cuesta varianza (global o por subgrupo), no validez.'
      },
      {
        tipo: 'opcion',
        modulo: 5,
        pregunta: 'Con costos desiguales, el costo $c_h$ entra en la asignación óptima como $1/\\sqrt{c_h}$, no como $1/c_h$. ¿Qué significa en la práctica?',
        pista: 'Duplicar el costo de un estrato, ¿cuánto reduce su muestra óptima?',
        opciones: [
          { texto: 'Que encarecer un estrato lo castiga menos que proporcionalmente: al duplicar su costo, su muestra óptima solo cae un factor $\\sqrt{2} \\approx 1{,}41$.', correcta: true,
            retro: 'Correcto. La varianza gana por unidades pero paga por pesos: el equilibrio de Lagrange reparte el castigo entre todos los estratos, y el caro conserva más muestra de lo que el instinto contable sugiere.' },
          { texto: 'Que conviene eliminar del diseño los estratos caros.', correcta: false,
            retro: 'Un estrato con $n_h = 0$ deja su parte de la población sin representar: eso sí sesga. El óptimo recorta al caro, no lo elimina — en el ejemplo, el Oeste pasa de 107 a 73, no a 0.' },
          { texto: 'Que el resultado es el mismo de Neyman, porque los costos se cancelan.', correcta: false,
            retro: 'Se cancelan solo si todos los $c_h$ son iguales — ese es exactamente el caso particular que es Neyman.' },
          { texto: 'Que con presupuesto fijo siempre conviene comprar el máximo número de entrevistas.', correcta: false,
            retro: 'El módulo mostró lo contrario: el óptimo compró 265 entrevistas pudiendo comprar ~301 baratas, y ganó. Las entrevistas no valen lo mismo: valen lo que recortan de varianza.' }
        ]
      },
      {
        tipo: 'opcion',
        modulo: 6,
        pregunta: 'Estratificar agpop por cuartiles de farms92 (número de granjas) dio deff 0,99: ganancia nula. ¿Por qué?',
        pista: 'La regla del módulo 7: estratificar renta lo que la variable de estratificación explica de $y$.',
        opciones: [
          { texto: 'Porque el número de granjas casi no está correlacionado con la superficie sembrada: las medias de sus cuartiles son casi iguales y SSB ≈ 0.', correcta: true,
            retro: 'Eso es. Muchas granjas pequeñas pueden sumar menos superficie que pocas gigantes. Sin diferencia entre las medias de los estratos, no hay nada que el diseñador pueda «pagar por adelantado».' },
          { texto: 'Porque cuatro estratos son pocos; con diez cuartiles habría funcionado.', correcta: false,
            retro: 'El barrido del simulador dice lo contrario: subir H con una variable útil da rendimientos decrecientes, y subir H con una variable inútil multiplica el papeleo de una ganancia que no existe.' },
          { texto: 'Porque los cuartiles dejan estratos de igual tamaño, y eso anula la estratificación.', correcta: false,
            retro: 'Los cuartiles de acres87 también dejan estratos de igual tamaño y su deff es 0,54, el mejor de la tabla. El tamaño de los estratos no es el problema.' },
          { texto: 'Porque farms92 tiene códigos −99.', correcta: false,
            retro: 'Los faltantes disfrazados son un problema real (la nota del módulo lo documenta), pero no explican una ganancia nula: acres87 también los tiene y es la campeona de la tabla.' }
        ]
      },
      {
        tipo: 'grafico',
        modulo: 7,
        alto: 240,
        descripcionGrafico: 'Dos histogramas de 10 000 réplicas de la media estimada con n = 300, uno por diseño, con la media verdadera marcada',
        pregunta: 'Los dos histogramas son las 10 000 réplicas del módulo 7. ¿Cuál corresponde al estratificado proporcional, y cómo lo sabes?',
        pista: 'Los dos diseños son insesgados: se distinguen por otra cosa.',
        dibujar: canvas => {
          const D = D4.distribucion;
          const alto = Math.max(...D.mas.conteo, ...D.estratificado.conteo) * 1.05;
          return crearGraficoXY(canvas, [
            serieHistograma(D.mas, 'diseño A', COLORES_GRAFICO.primario),
            serieHistograma(D.estratificado, 'diseño B', COLORES_GRAFICO.secundario),
            serieVertical(D.media, alto, 'media verdadera', COLORES_GRAFICO.gris)
          ], { tituloX: 'media estimada (acres)', tituloY: 'réplicas' });
        },
        opciones: [
          { texto: 'El B (naranja): mismo centro pero visiblemente más concentrado — la estratificación reduce varianza, no sesgo.', correcta: true,
            retro: 'Exacto: las dos campanas están centradas en 306 677 (ambos diseños son insesgados) y la naranja es más angosta (deff 0,82).' },
          { texto: 'El A (verde), porque cubre más rango y por tanto usa más información.', correcta: false,
            retro: 'Cubrir más rango es tener MÁS varianza, que es lo que el estratificado evita. «Más ancho» nunca es un elogio para un estimador.' },
          { texto: 'No se puede saber: habría que ver cuál está más cerca de la media verdadera.', correcta: false,
            retro: 'Los DOS están centrados en la media verdadera — la insesgadez no distingue estos diseños. Lo que los distingue es la dispersión, y esa se ve a simple vista.' },
          { texto: 'El B, porque el estratificado siempre produce distribuciones perfectamente normales.', correcta: false,
            retro: 'La conclusión es correcta pero la razón no: el estratificado hereda la asimetría de la población (por eso la cobertura se quedó en 93 %). Lo que delata al B es ser más angosto, no más normal.' }
        ]
      },
      {
        tipo: 'numerica',
        modulo: 8,
        pregunta: 'El deff empírico de agstrat fue 0,7512 con n = 300. ¿A cuántas entrevistas de un MAS equivalen esas 300? Redondea al entero.',
        pista: '$n_{\\text{ef}} = n / \\text{deff}$.',
        respuesta: 399,
        tolerancia: 2,
        retroAcierto: '$300 / 0{,}7512 = 399{,}4$: estratificar por región regaló el equivalente a unas 99 entrevistas. Ese es el argumento de venta del capítulo entero, en un número.',
        retroFallo: 'Es $n/\\text{deff} = 300/0{,}7512 \\approx 399$. Si te dio 225, multiplicaste en lugar de dividir: deff < 1 significa que el diseño RINDE MÁS que el MAS, así que el equivalente tiene que salir mayor que 300.'
      },
      {
        tipo: 'opcion',
        modulo: 9,
        pregunta: 'En el diseño STPPS del módulo 9, una empresa del estrato Medium tiene el doble de empleados que otra del mismo estrato. ¿Qué relación guardan sus papeletas?',
        pista: '$\\psi_k \\propto x_k$ dentro del estrato, y el estimador divide por $\\psi_k$.',
        opciones: [
          { texto: 'Sale con el doble de probabilidad en cada extracción, y si sale, entra al estimador con la mitad de peso.', correcta: true,
            retro: 'Las dos mitades de la mecánica PPT: más probable de ver, menos influyente al verla. El producto se equilibra y el estimador queda insesgado.' },
          { texto: 'Sale con el doble de probabilidad y pesa el doble: por eso el PPT favorece a las grandes.', correcta: false,
            retro: 'Si además pesara el doble, las grandes contarían cuatro veces y el estimador se dispararía. El peso es el RECÍPROCO de la probabilidad: esa es la gracia.' },
          { texto: 'La probabilidad depende de sus ingresos, no de sus empleados.', correcta: false,
            retro: 'Al revés y con razón: los ingresos son la variable de interés ($y$), que no se conoce antes de muestrear. La ψ se construye con la auxiliar $x$ (empleados), que el marco sí trae.' },
          { texto: 'Nada: dentro de un estrato todas las unidades son intercambiables.', correcta: false,
            retro: 'Eso era el estratificado clásico (MAS dentro del estrato). El módulo 9 existe precisamente porque a veces conviene romper esa simetría interna.' }
        ]
      },
      {
        tipo: 'multiple',
        modulo: 10,
        pregunta: 'Marca <strong>todo</strong> lo que la postestratificación necesita para funcionar.',
        pista: 'Repasa qué se usó de agsrs y qué del marco.',
        opciones: [
          { texto: 'Conocer los tamaños poblacionales $N_h$ de las celdas (del marco o de un censo).', correcta: true },
          { texto: 'Observar la variable de estratificación en cada unidad muestreada.', correcta: true },
          { texto: 'Haber fijado los $n_h$ antes de sortear.', correcta: false },
          { texto: 'Celdas con suficientes observaciones (la regla práctica pide $n_h \\geq 20$ o fusionar).', correcta: true }
        ],
        retroAcierto: 'Las tres verdaderas son el contrato completo. La tercera es justo lo que la postestratificación NO pide — su razón de existir es llegar tarde al diseño y aun así cobrar parte de la ganancia.',
        retroFallo: 'Son la primera, la segunda y la cuarta. Fijar los $n_h$ antes es el estratificado de diseño; la postestratificación existe para cuando eso ya no fue posible, y el precio de decidir tarde fue 17 513 contra 16 380 de ee.'
      },
      {
        tipo: 'opcion',
        modulo: 11,
        pregunta: 'Un equipo separa prueba y entrenamiento con <code>vfold_cv(datos, v = 5, strata = clase)</code> en rsample, con una clase minoritaria del 5 %, y reporta que estratificó. ¿Cuál es el problema?',
        pista: 'El módulo 11 lo llamó «una trampa de verdad». Tiene que ver con un parámetro por defecto.',
        opciones: [
          { texto: 'El parámetro pool = 0,1 fusionó en silencio la clase del 5 % con la mayoritaria: los pliegues NO quedaron estratificados, aunque el código diga strata =.', correcta: true,
            retro: 'Esa es la trampa, y el capítulo la cazó con datos: los pliegues «estratificados» por defecto bailaban igual que los simples (4,2 %–5,8 %), y con pool = 0,02 quedaron clavados en 5,0 %. Moraleja de auditoría: comprueba las proporciones por pliegue, no el nombre del argumento.' },
          { texto: 'Que rsample no implementa estratificación; había que usar scikit-learn.', correcta: false,
            retro: 'La implementa y bien — solo que con un umbral de protección (pool) pensado para variables continuas, que con clases raras hace exactamente lo contrario de lo que el usuario cree.' },
          { texto: 'Estratificar la validación cruzada sesga las métricas y no debe hacerse.', correcta: false,
            retro: 'Al contrario: Kohavi (1995) recomendó estratificar precisamente porque estabiliza las métricas sin sesgarlas. El problema del enunciado es que NO se estratificó de verdad.' },
          { texto: 'Con el 5 % de prevalencia no tiene sentido evaluar el modelo.', correcta: false,
            retro: 'Tiene todo el sentido — fraude, enfermedad rara, churn — y por eso importa tanto que cada pliegue conserve sus positivos: son las clases raras las que más necesitan la estratificación.' }
        ]
      }
    ];
