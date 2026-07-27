    // ================================================================
    // Simuladores del capítulo 2
    //
    // Todos leen de DATOS_CAP2, que produce precalculo/genera_cap2.R.
    // Aquí no se calcula nada pesado: los diez mil remuestreos ya están
    // hechos y lo que viaja al navegador son histogramas y resúmenes.
    // ================================================================
    const D2 = DATOS_CAP2;
    const EM = D2.espacioMuestras;
    const ETIQ_MUESTRAS = EM.combos.map(c => `{${c[0]},${c[1]}}`);
    const OPCIONES_DISENO = [
      { valor: 'mas', texto: 'A · MAS sin reemplazo' },
      { valor: 'estratificado', texto: 'B · Estratificado (uno de cada estrato)' },
      { valor: 'desigual', texto: 'C · Desigual, p(s) ∝ x_k + x_l' }
    ];

    // Formato español: espacio fino como separador de miles, coma decimal.
    function fmtNum(x, d = 2) {
      if (!isFinite(x)) return '—';
      const s = Math.abs(x).toFixed(d);
      const partes = s.split('.');
      const entero = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      return (x < 0 ? '−' : '') + entero + (partes[1] ? ',' + partes[1] : '');
    }

    // crearGraficoXY, serieHistograma y serieVertical nacieron aquí y ya
    // están en la plantilla (retropropagados en la misma sesión).

    // ---------------------------------------------------------------
    // M1 · El espacio de muestras: p(s) bajo los tres diseños
    // ---------------------------------------------------------------
    SIMULADORES['espacio-muestras'] = function (raiz) {
      const params = { diseno: 'mas' };
      const g = crearGraficoBarras(raiz.querySelector('canvas'), ETIQ_MUESTRAS,
        EM.disenos.mas.ps, {
          etiqueta: 'p(s)', color: COLORES_GRAFICO.primario,
          tituloX: 'Muestra s = {k, l}', min: 0, max: 0.2
        });

      function pintar() {
        const d = EM.disenos[params.diseno];
        const suma = d.ps.reduce((a, b) => a + b, 0);
        const posibles = d.ps.filter(p => p > 0).length;
        g.data.datasets[0].data = d.ps;
        g.options.scales.y.suggestedMax = Math.max(...d.ps) * 1.2;
        g.update('none');
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'Σ p(s) =', valor: fmtNum(suma, 4) },
          { etiqueta: 'muestras posibles:', valor: `${posibles} de ${d.ps.length}` },
          { etiqueta: 'p(s) máxima =', valor: fmtNum(Math.max(...d.ps), 4) },
          { etiqueta: 'p(s) mínima positiva =', valor: fmtNum(Math.min(...d.ps.filter(p => p > 0)), 4) }
        ]);
      }

      crearSelector(raiz.querySelector('.simulador-controles'),
        { clave: 'diseno', etiqueta: 'Diseño', opciones: OPCIONES_DISENO }, params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M2 · De p(s) a las probabilidades de inclusión
    // ---------------------------------------------------------------
    SIMULADORES['matriz-pikl'] = function (raiz) {
      const params = { diseno: 'estratificado' };
      const marco = raiz.querySelector('.matriz-pikl-marco');
      const lienzos = raiz.querySelectorAll('canvas');
      const etiquetasU = EM.y.map((_, k) => 'U' + (k + 1));

      const gPi = crearGraficoBarras(lienzos[0], etiquetasU, EM.disenos.mas.pi_k, {
        etiqueta: 'π_k', color: COLORES_GRAFICO.primario, tituloX: 'Unidad',
        min: 0, max: 1, lineas: [{ valor: EM.n / EM.N, etiqueta: 'n/N' }]
      });
      const gPeso = crearGraficoBarras(lienzos[1], etiquetasU,
        EM.disenos.mas.pi_k.map(p => 1 / p), {
          etiqueta: 'd_k = 1/π_k', color: COLORES_GRAFICO.terciario, tituloX: 'Unidad', min: 0, max: 4
        });

      function tabla(d) {
        const N = EM.N;
        let html = '<table style="font-size:0.82rem; margin:0.5rem 0;"><caption class="sr-only">' +
          'Matriz de probabilidades de inclusión de segundo orden</caption><thead><tr><th scope="col">π<sub>kl</sub></th>';
        for (let l = 0; l < N; l++) html += `<th scope="col">U${l + 1}</th>`;
        html += '</tr></thead><tbody>';
        for (let k = 0; k < N; k++) {
          html += `<tr><th scope="row">U${k + 1}</th>`;
          for (let l = 0; l < N; l++) {
            const v = d.pi_kl[k][l];
            const diagonal = k === l;
            const cero = !diagonal && v === 0;
            const estilo = diagonal
              ? 'background:rgba(1,40,32,0.10); font-weight:700;'
              : cero ? 'background:rgba(220,38,38,0.14); color:#991b1b; font-weight:700;' : '';
            html += `<td style="text-align:center; ${estilo}">${fmtNum(v, 4)}</td>`;
          }
          html += '</tr>';
        }
        return html + '</tbody></table>' +
          '<p style="font-size:0.78rem; color:#475569; margin:0.25rem 0 0;">' +
          'La <strong>diagonal</strong> es π<sub>k</sub> (verde). Las casillas <strong>rojas</strong> son pares ' +
          'que no pueden salir juntos nunca: π<sub>kl</sub> = 0.</p>';
      }

      function pintar() {
        const d = EM.disenos[params.diseno];
        marco.innerHTML = tabla(d);
        gPi.data.datasets[0].data = d.pi_k;
        gPeso.data.datasets[0].data = d.pi_k.map(p => 1 / p);
        gPeso.options.scales.y.suggestedMax = Math.max(...d.pi_k.map(p => 1 / p)) * 1.2;
        gPi.update('none');
        gPeso.update('none');

        const N = EM.N;
        let ceros = 0;
        for (let k = 0; k < N; k++) {
          for (let l = 0; l < N; l++) {
            if (k !== l && d.pi_kl[k][l] === 0) ceros++;
          }
        }
        // Comprobación de la identidad: fila menos diagonal = (n-1) pi_k
        const fila0 = d.pi_kl[0].reduce((a, b) => a + b, 0) - d.pi_kl[0][0];
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'Σ π_k =', valor: fmtNum(d.sumaPi, 4) + ` (n = ${EM.n})` },
          { etiqueta: 'pares con π_kl = 0:', valor: `${ceros / 2} de ${N * (N - 1) / 2}` },
          { etiqueta: 'fila 1 sin diagonal =', valor: fmtNum(fila0, 4) },
          { etiqueta: '(n−1)·π₁ =', valor: fmtNum((EM.n - 1) * d.pi_k[0], 4) }
        ]);
      }

      crearSelector(raiz.querySelector('.simulador-controles'),
        { clave: 'diseno', etiqueta: 'Diseño', opciones: OPCIONES_DISENO }, params, pintar);
      pintar();
      return [gPi, gPeso];
    };

    // ---------------------------------------------------------------
    // M3 · Horvitz-Thompson frente al estimador de expansión
    // ---------------------------------------------------------------
    SIMULADORES['ht-vs-expansion'] = function (raiz) {
      const params = { diseno: 'desigual' };
      const g = crearGraficoBarras(raiz.querySelector('canvas'), ETIQ_MUESTRAS,
        EM.disenos.desigual.tHT, {
          etiqueta: 't̂_π (Horvitz–Thompson)', color: COLORES_GRAFICO.primario,
          tituloX: 'Muestra s', min: 0, max: 240,
          barrasExtra: [{
            etiqueta: 'N ȳ (expansión)', valores: EM.disenos.desigual.tExpansion,
            color: COLORES_GRAFICO.secundario
          }],
          lineas: [{
            valor: EM.total, etiqueta: `total verdadero t = ${EM.total}`,
            color: COLORES_GRAFICO.terciario
          }]
        });

      function pintar() {
        const d = EM.disenos[params.diseno];
        // Las muestras imposibles (p(s) = 0) no se dibujan: no existen
        const soloPosibles = v => d.ps.map((p, i) => (p > 0 ? v[i] : null));
        g.data.datasets[0].data = soloPosibles(d.tHT);
        g.data.datasets[1].data = soloPosibles(d.tExpansion);
        g.update('none');
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'E(t̂_π) =', valor: fmtNum(d.esperanzaHT, 4) },
          { etiqueta: 'E(N ȳ) =', valor: fmtNum(d.esperanzaExpansion, 4) },
          { etiqueta: 'sesgo de N ȳ =', valor: fmtNum(d.sesgoExpansion, 4) },
          { etiqueta: 'V(t̂_π) =', valor: fmtNum(d.varianzaHT, 2) }
        ]);
      }

      crearSelector(raiz.querySelector('.simulador-controles'),
        { clave: 'diseno', etiqueta: 'Diseño', opciones: OPCIONES_DISENO }, params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M4 · Los tres diseños, comparados
    // ---------------------------------------------------------------
    TABLAS_RANKING['disenos'] = function () {
      const nombres = { mas: 'A · MAS', estratificado: 'B · Estratificado', desigual: 'C · Desigual' };
      const filas = Object.keys(nombres).map(clave => {
        const d = EM.disenos[clave];
        return {
          diseno: nombres[clave],
          soporte: d.ps.filter(p => p > 0).length,
          vHT: d.varianzaHT,
          sesgoExp: Math.abs(d.sesgoExpansion),
          ceros: d.pi_kl.reduce((acc, fila, k) =>
            acc + fila.filter((v, l) => k !== l && v === 0).length, 0) / 2
        };
      });
      return {
        descripcion: 'Los tres diseños sobre la misma población de cinco condados, con el mismo ' +
          'tamaño de muestra n = 2. Pulsa cualquier cabecera para reordenar. Ninguna columna ' +
          'gana en todo: el diseño desigual es el más preciso con Horvitz–Thompson y a la vez ' +
          'el que más castiga a quien use el estimador de expansión.',
        columnas: [
          { clave: 'diseno', titulo: 'Diseño', tipo: 'texto' },
          { clave: 'soporte', titulo: 'Muestras posibles', decimales: 0, mejor: 'mayor' },
          { clave: 'vHT', titulo: 'V(t̂_π)', tituloLargo: 'varianza del estimador de Horvitz–Thompson', decimales: 1, mejor: 'menor' },
          { clave: 'sesgoExp', titulo: '|sesgo de N ȳ|', decimales: 2, mejor: 'menor' },
          { clave: 'ceros', titulo: 'Pares con π_kl = 0', decimales: 0, mejor: 'menor' }
        ],
        filas: filas,
        inicial: 'vHT',
        destacada: 'C · Desigual',
        pie: 'El diseño C gana en varianza porque sus π_k están correlacionadas con los y_k: ' +
          'los valores expandidos y_k/π_k quedan más parecidos entre sí, que es justo lo que ' +
          'reduce la varianza según Sen–Yates–Grundy. El diseño B tiene tres pares imposibles ' +
          '(los dos del mismo estrato), y ese es el precio: sin π_kl no hay estimador de varianza.'
      };
    };

    // ---------------------------------------------------------------
    // M5 · Distribución de muestreo de la media
    // ---------------------------------------------------------------
    SIMULADORES['distribucion-muestreo'] = function (raiz) {
      const params = { n: 'n100', fija: true };
      const X_MAX = 700000;   // rango común para poder comparar tamaños
      const g = crearGraficoXY(raiz.querySelector('canvas'), [], {
        tituloX: 'Media muestral de acres92', tituloY: 'Réplicas'
      });
      const opcionesN = Object.keys(D2.distribucion).map(k => ({
        valor: k, texto: 'n = ' + D2.distribucion[k].n
      }));

      function pintar() {
        const d = D2.distribucion[params.n];
        const alto = Math.max(...d.hist.conteo) * 1.05;
        g.data.datasets = [
          serieHistograma(d.hist, `10 000 medias muestrales (n = ${d.n})`, COLORES_GRAFICO.primario),
          serieVertical(D2.cifras.agpop.media, alto, 'Media poblacional', COLORES_GRAFICO.secundario)
        ];
        g.options.scales.x.min = params.fija ? 0 : undefined;
        g.options.scales.x.max = params.fija ? X_MAX : undefined;
        g.update();

        const fuera = params.fija
          ? d.hist.conteo.reduce((a, c, i) => a + (d.hist.centros[i] > X_MAX ? c : 0), 0)
          : 0;
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'media de las réplicas =', valor: fmtNum(d.media, 1) },
          { etiqueta: 'DE empírica =', valor: fmtNum(Math.sqrt(d.varEmpirica), 1) },
          { etiqueta: 'DE teórica √((1−n/N)S²/n) =', valor: fmtNum(d.eeTeorico, 1) },
          { etiqueta: 'fpc =', valor: fmtNum(d.fpc, 4) },
          { etiqueta: 'asimetría =', valor: fmtNum(d.asimetria, 3) },
          { etiqueta: 'réplicas fuera del rango dibujado:', valor: fuera }
        ]);
      }

      const controles = raiz.querySelector('.simulador-controles');
      crearSelector(controles, { clave: 'n', etiqueta: 'Tamaño de muestra', opciones: opcionesN }, params, pintar);
      crearInterruptores(controles, [{ clave: 'fija', etiqueta: 'Escala fija (para comparar tamaños)' }], params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M6 · Cobertura empírica del intervalo de confianza
    // ---------------------------------------------------------------
    SIMULADORES['cobertura-ic'] = function (raiz) {
      const params = { n: 'n100' };
      const media = D2.cifras.agpop.media;
      const etiquetas = Array.from({ length: 100 }, (_, i) => String(i + 1));
      const g = crearGraficoBarras(raiz.querySelector('canvas'), etiquetas,
        D2.cobertura.n100.primeros.li.map((li, i) => [li, D2.cobertura.n100.primeros.ls[i]]), {
          etiqueta: 'IC del 95 %', tituloX: 'Réplica',
          lineas: [{ valor: media, etiqueta: 'media poblacional', color: COLORES_GRAFICO.secundario }]
        });
      g.data.datasets[0].barPercentage = 0.95;
      g.data.datasets[0].categoryPercentage = 0.95;

      function pintar() {
        const d = D2.cobertura[params.n];
        const barras = d.primeros.li.map((li, i) => [li, d.primeros.ls[i]]);
        const aciertos = barras.filter(b => b[0] <= media && media <= b[1]).length;
        g.data.datasets[0].data = barras;
        g.data.datasets[0].backgroundColor = barras.map(b =>
          (b[0] <= media && media <= b[1]) ? '#15803d' : '#DC2626');
        g.options.scales.y.suggestedMin = Math.min(...barras.map(b => b[0]));
        g.options.scales.y.suggestedMax = Math.max(...barras.map(b => b[1]));
        g.update('none');
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'aciertos entre los 100 dibujados:', valor: aciertos },
          { etiqueta: 'cobertura real (10 000 réplicas):', valor: fmtNum(100 * d.coberturaFpc, 1) + ' %' },
          { etiqueta: 'nominal:', valor: '95,0 %' },
          { etiqueta: 'sin fpc:', valor: fmtNum(100 * d.coberturaSinFpc, 1) + ' %' },
          { etiqueta: 'ancho medio:', valor: fmtNum(d.anchoMedio, 0) }
        ]);
      }

      crearSelector(raiz.querySelector('.simulador-controles'), {
        clave: 'n', etiqueta: 'Tamaño de muestra',
        opciones: Object.keys(D2.cobertura).map(k => ({ valor: k, texto: 'n = ' + D2.cobertura[k].n }))
      }, params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M7 · Calculadora de tamaño de muestra
    // ---------------------------------------------------------------
    SIMULADORES['tamano-muestra'] = function (raiz) {
      const params = { errorPct: 10, cv: 1.38, N: '3078', conf: '95' };
      const Z = { '90': 1.6448536, '95': 1.9599640, '99': 2.5758293 };
      const g = crearGraficoXY(raiz.querySelector('canvas'), [], {
        tituloX: 'Margen de error, en % de la media', tituloY: 'Tamaño de muestra n', xMin: 1, xMax: 30
      });

      function tamano(errorRel, cv, N, z) {
        const n0 = Math.pow(z * cv / errorRel, 2);
        return { n0: n0, n: Math.ceil(n0 / (1 + n0 / N)) };
      }

      function pintar() {
        const N = Number(params.N);
        const z = Z[params.conf];
        const curva = [];
        for (let e = 1; e <= 30; e += 0.25) {
          curva.push({ x: e, y: tamano(e / 100, params.cv, N, z).n });
        }
        const punto = tamano(params.errorPct / 100, params.cv, N, z);
        g.data.datasets = [
          {
            type: 'line', label: `n necesario (N = ${fmtNum(N, 0)}, ${params.conf} %)`,
            data: curva, borderColor: COLORES_GRAFICO.primario, borderWidth: 2,
            pointRadius: 0, fill: false
          },
          {
            type: 'line', label: 'punto elegido', data: [{ x: params.errorPct, y: punto.n }],
            borderColor: COLORES_GRAFICO.secundario, backgroundColor: COLORES_GRAFICO.secundario,
            pointRadius: 7, pointStyle: 'rectRot', showLine: false
          }
        ];
        g.options.scales.y.max = Math.min(N, tamano(0.01, params.cv, N, z).n * 1.05);
        g.update();

        const mitad = tamano(params.errorPct / 200, params.cv, N, z);
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'n₀ (sin fpc) =', valor: fmtNum(punto.n0, 2) },
          { etiqueta: 'n (con fpc) =', valor: punto.n },
          { etiqueta: 'fracción de muestreo n/N =', valor: fmtNum(punto.n / N, 4) },
          { etiqueta: 'para la mitad del error haría falta:', valor: `n = ${mitad.n}` }
        ]);
      }

      const controles = raiz.querySelector('.simulador-controles');
      crearControles(controles, [
        { clave: 'errorPct', etiqueta: 'Margen de error (% de la media)', min: 1, max: 30, paso: 0.5 },
        { clave: 'cv', etiqueta: 'Coeficiente de variación S/ȳ', min: 0.2, max: 2.5, paso: 0.01 }
      ], params, pintar);
      crearSelector(controles, {
        clave: 'conf', etiqueta: 'Confianza', opciones: [
          { valor: '90', texto: '90 %' }, { valor: '95', texto: '95 %' }, { valor: '99', texto: '99 %' }]
      }, params, pintar);
      crearSelector(controles, {
        clave: 'N', etiqueta: 'Tamaño de la población', opciones: [
          { valor: '3078', texto: 'N = 3 078 (agpop)' },
          { valor: '10000', texto: 'N = 10 000' },
          { valor: '100000', texto: 'N = 100 000' },
          { valor: '50000000', texto: 'N = 50 000 000' }]
      }, params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M8 · Diseño Bernoulli
    // ---------------------------------------------------------------
    SIMULADORES['bernoulli'] = function (raiz) {
      const params = { pi: 'pi05' };
      const lienzos = raiz.querySelectorAll('canvas');
      const gTam = crearGraficoXY(lienzos[0], [], { tituloX: 'n_s obtenido', tituloY: 'Réplicas' });
      const gEst = crearGraficoXY(lienzos[1], [], { tituloX: 'Estimación del total (millones de acres)', tituloY: 'Réplicas' });
      const totalVerdadero = D2.cifras.agpop.total / 1e6;

      function pintar() {
        const b = D2.bernoulli[params.pi];
        const altoT = Math.max(...b.histTamano.conteo) * 1.05;
        gTam.data.datasets = [
          serieHistograma(b.histTamano, 'Tamaño de muestra obtenido', COLORES_GRAFICO.terciario),
          serieVertical(b.nEsperado, altoT, 'E(n_s) = Nπ', COLORES_GRAFICO.secundario)
        ];
        gTam.update();

        const altoE = Math.max(...b.histHT.conteo, ...b.histHajek.conteo) * 1.05;
        gEst.data.datasets = [
          serieHistograma(b.histHT, 'Horvitz–Thompson', COLORES_GRAFICO.primario),
          serieHistograma(b.histHajek, 'Hájek', COLORES_GRAFICO.terciario),
          serieVertical(totalVerdadero, altoE, 'total verdadero', COLORES_GRAFICO.secundario)
        ];
        gEst.update();

        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'E(n_s) =', valor: fmtNum(b.nEsperado, 1) },
          { etiqueta: 'DE(n_s) empírica / teórica =', valor: `${fmtNum(b.sdTamano, 2)} / ${fmtNum(b.sdTamanoTeorica, 2)}` },
          { etiqueta: 'CV de HT =', valor: fmtNum(b.cvHT, 4) },
          { etiqueta: 'CV de Hájek =', valor: fmtNum(b.cvHajek, 4) },
          { etiqueta: 'ventaja de Hájek =', valor: fmtNum(100 * (1 - b.cvHajek / b.cvHT), 1) + ' % menos CV' }
        ]);
      }

      crearSelector(raiz.querySelector('.simulador-controles'), {
        clave: 'pi', etiqueta: 'Probabilidad de inclusión π',
        opciones: Object.keys(D2.bernoulli).map(k => ({ valor: k, texto: 'π = ' + fmtNum(D2.bernoulli[k].pi, 2) }))
      }, params, pintar);
      pintar();
      return [gTam, gEst];
    };

    // ---------------------------------------------------------------
    // M9 · Sistemático sobre una población con periodicidad
    // ---------------------------------------------------------------
    SIMULADORES['sistematico-periodico'] = function (raiz) {
      const sis = D2.sistematico;
      const params = { n: 'n10', r: 1 };
      const g = crearGraficoXY(raiz.querySelector('canvas'), [], {
        tituloX: 'Posición en la lista (mes)', tituloY: 'Valor observado', xMin: 0, xMax: sis.poblacion.length + 1
      });
      const serieBase = sis.poblacion.map((v, i) => ({ x: i + 1, y: v }));

      function pintar() {
        const d = sis.porTamano[params.n];
        const k = d.k;
        const rEfectivo = ((Math.round(params.r) - 1) % k) + 1;
        const elegidos = [];
        for (let i = rEfectivo; i <= sis.poblacion.length; i += k) {
          elegidos.push({ x: i, y: sis.poblacion[i - 1] });
        }
        g.data.datasets = [
          {
            type: 'line', label: 'Población ordenada por mes', data: serieBase,
            borderColor: COLORES_GRAFICO.gris, borderWidth: 1.2, pointRadius: 0, fill: false
          },
          {
            type: 'line', label: `Muestra sistemática (arranque r = ${rEfectivo})`, data: elegidos,
            borderColor: COLORES_GRAFICO.secundario, backgroundColor: COLORES_GRAFICO.secundario,
            pointRadius: 4, showLine: false
          },
          {
            type: 'line', label: 'Media poblacional', data: [{ x: 1, y: sis.media }, { x: sis.poblacion.length, y: sis.media }],
            borderColor: COLORES_GRAFICO.primario, borderDash: [6, 4], borderWidth: 1.5, pointRadius: 0, fill: false
          }
        ];
        g.update();

        const mediaMuestra = elegidos.reduce((a, p) => a + p.y, 0) / elegidos.length;
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'k = N/n =', valor: k + (k % sis.periodo === 0 ? ' ← múltiplo del periodo' : '') },
          { etiqueta: 'media de esta muestra =', valor: fmtNum(mediaMuestra, 3) },
          { etiqueta: 'media poblacional =', valor: fmtNum(sis.media, 3) },
          { etiqueta: 'V sistemático =', valor: fmtNum(d.varSistematico, 3) },
          { etiqueta: 'V MAS del mismo n =', valor: fmtNum(d.varMAS, 3) },
          { etiqueta: 'DEFF =', valor: fmtNum(d.deff, 3) }
        ]);
      }

      const controles = raiz.querySelector('.simulador-controles');
      crearSelector(controles, {
        clave: 'n', etiqueta: 'Tamaño de muestra',
        opciones: Object.keys(sis.porTamano).map(key => ({
          valor: key, texto: `n = ${sis.porTamano[key].n} (k = ${sis.porTamano[key].k})`
        }))
      }, params, pintar);
      crearControles(controles, [
        { clave: 'r', etiqueta: 'Arranque aleatorio r', min: 1, max: 30, paso: 1 }
      ], params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M9 · MAS frente a sistemático sobre agpop
    // ---------------------------------------------------------------
    SIMULADORES['mas-vs-sistematico'] = function (raiz) {
      const params = { orden: 'original' };
      const g = crearGraficoXY(raiz.querySelector('canvas'), [], {
        tituloX: 'Media muestral de acres92 (miles)', tituloY: 'Réplicas'
      });
      const NOMBRE_ORDEN = {
        original: 'Orden del archivo (alfabético por estado)',
        ordenado: 'Ordenado por acres87',
        patologico: 'Orden patológico (el tamaño depende de la ranura del ciclo)'
      };

      function pintar() {
        const c = D2.comparacionAgpop[params.orden];
        const alto = Math.max(...c.histMAS.conteo) * 1.05;
        g.data.datasets = [
          serieHistograma(c.histMAS, 'MAS: 10 000 medias (n = 300)', COLORES_GRAFICO.primario),
          {
            type: 'line', label: 'Las 10 medias sistemáticas posibles',
            data: c.mediasArranque.map(m => ({ x: m / 1000, y: alto * 0.35 })),
            borderColor: COLORES_GRAFICO.secundario, backgroundColor: COLORES_GRAFICO.secundario,
            pointRadius: 6, pointStyle: 'rectRot', showLine: false
          },
          serieVertical(D2.cifras.agpop.media / 1000, alto, 'Media poblacional', COLORES_GRAFICO.terciario)
        ];
        g.update();
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'V del sistemático =', valor: c.varSistematico.toExponential(3) },
          { etiqueta: 'V del MAS (fórmula) =', valor: c.varMASexacta.toExponential(3) },
          { etiqueta: 'V del MAS (10 000 réplicas) =', valor: c.varMASempirica.toExponential(3) },
          { etiqueta: 'DEFF =', valor: fmtNum(c.deff, 3) + (c.deff < 1 ? ' · el sistemático gana' : ' · el sistemático pierde') }
        ]);
      }

      crearSelector(raiz.querySelector('.simulador-controles'), {
        clave: 'orden', etiqueta: 'Orden de la lista',
        opciones: Object.keys(D2.comparacionAgpop).map(k => ({ valor: k, texto: NOMBRE_ORDEN[k] }))
      }, params, pintar);
      pintar();
      return [g];
    };

    // ================================================================
    // Glosario de notación del capítulo
    // ================================================================
    GLOSARIOS['marco-pi'] = {
      titulo: 'Notación: este material ↔ Lohr ↔ Gutiérrez',
      nota: 'Los tres libros dicen lo mismo. Cuando una fórmula de la bibliografía no cuadre con ' +
        'la del capítulo, es casi siempre esta tabla y no un error de fondo.',
      filas: [
        { concepto: 'Población finita de N unidades', aqui: 'U = \\{1,\\dots,N\\}', lohr: '\\mathcal{U}', gutierrez: 'U', r: '—' },
        { concepto: 'Muestra seleccionada', aqui: 's', lohr: '\\mathcal{S}', gutierrez: 's', r: 'el data.frame de la muestra' },
        { concepto: 'Diseño muestral', aqui: 'p(s)', lohr: 'P(\\mathcal{S})', gutierrez: 'p(s)', r: 'svydesign(...)' },
        { concepto: 'Probabilidad de inclusión', aqui: '\\pi_k', lohr: '\\pi_i', gutierrez: '\\pi_k', r: 'probs = ~pi' },
        { concepto: 'De segundo orden', aqui: '\\pi_{kl}', lohr: '\\pi_{ij}', gutierrez: '\\pi_{kl}', r: '—' },
        { concepto: 'Peso de diseño', aqui: 'd_k = 1/\\pi_k', lohr: 'w_i', gutierrez: 'd_k', r: 'weights = ~w' },
        { concepto: 'Total poblacional', aqui: 't', lohr: 't', gutierrez: 't_y', r: 'svytotal()' },
        { concepto: 'Media poblacional', aqui: '\\bar{y}_U', lohr: '\\bar{y}_{\\mathcal{U}}', gutierrez: '\\bar{y}_U', r: 'svymean()' },
        { concepto: 'Estimador de Horvitz–Thompson', aqui: '\\hat{t}_\\pi', lohr: '\\hat{t}_{HT}', gutierrez: '\\hat{t}_{y,\\pi}', r: 'svytotal()' },
        { concepto: 'Varianza poblacional', aqui: 'S^2', lohr: 'S^2', gutierrez: 'S^2_{y U}', r: 'var()' },
        { concepto: 'Corrección por población finita', aqui: '1 - n/N', lohr: '1 - n/N', gutierrez: '1 - f', r: 'fpc = ~N' },
        { concepto: 'Efecto de diseño', aqui: '\\text{DEFF}', lohr: '\\text{deff}', gutierrez: '\\text{DEFF}', r: 'deff = TRUE' }
      ]
    };

    // ================================================================
    // Autoevaluación del capítulo
    // ================================================================
    AUTOEVALUACIONES['cap2'] = [
      {
        tipo: 'opcion',
        modulo: 1,
        pregunta: 'Un investigador entrevista a los primeros 400 clientes que entran a una tienda un martes. ¿Por qué esto <strong>no</strong> permite calcular un error estándar?',
        pista: 'Vuelve a la definición 2.2: ¿qué objeto hace falta para poder tomar esperanzas?',
        opciones: [
          { texto: 'Porque no existe una $p(s)$ conocida: no se puede decir con qué probabilidad habría salido cada muestra posible.', correcta: true,
            retro: 'Exacto. Sin $p(s)$ no hay respecto de qué tomar la esperanza, así que ni insesgadez ni varianza de diseño están definidas. Todo el capítulo cuelga de ahí.' },
          { texto: 'Porque 400 es un tamaño de muestra insuficiente.', correcta: false,
            retro: 'El tamaño no es el problema. Con 40 000 clientes el defecto sería idéntico: el capítulo 1 lo vio con los 2,4 millones del <em>Literary Digest</em>.' },
          { texto: 'Porque no se aplicó la corrección por población finita.', correcta: false,
            retro: 'El fpc es un factor que se aplica <em>después</em> de tener un diseño. Aquí el problema es anterior: no hay diseño.' },
          { texto: 'Porque la variable de interés no es normal.', correcta: false,
            retro: 'La inferencia de diseño no supone normalidad de los $y_k$; de hecho no supone nada sobre ellos, porque son constantes fijas.' }
        ]
      },
      {
        tipo: 'numerica',
        modulo: 2,
        pregunta: 'En el diseño C (probabilidades desiguales) la unidad 5 tiene $\\pi_5 = 0{,}55$. ¿Cuánto vale su peso de diseño $d_5 = 1/\\pi_5$? Da cuatro decimales.',
        pista: 'Es una división, sin más: el peso dice a cuántas unidades de la población representa la que se observó.',
        respuesta: 1.8182,
        tolerancia: 0.0006,
        retroAcierto: '$1/0{,}55 = 1{,}8182$. Como el condado 5 sale muy a menudo, cada vez que sale representa a poco más que a sí mismo.',
        retroFallo: 'Es $1/0{,}55 = 1{,}8182$. Un error frecuente es calcular $N/n = 2{,}5$, que es el peso del MAS: aquí las $\\pi_k$ no son iguales, así que los pesos tampoco.'
      },
      {
        tipo: 'multiple',
        modulo: 3,
        pregunta: 'Marca <strong>todo</strong> lo que hace falta para que $\\hat{t}_\\pi$ sea insesgado por diseño.',
        pista: 'Son dos. Repasa la demostración plegable del módulo 3 y fíjate en qué paso podría fallar.',
        opciones: [
          { texto: '$\\pi_k > 0$ para toda unidad de la población.', correcta: true },
          { texto: 'Que las $\\pi_k$ sean conocidas y se puedan calcular.', correcta: true },
          { texto: 'Que el diseño sea de tamaño de muestra fijo.', correcta: false },
          { texto: 'Que la variable $y$ tenga distribución aproximadamente normal.', correcta: false }
        ],
        retroAcierto: 'Las dos primeras. Nada más: ni tamaño fijo, ni normalidad, ni independencia. Esa generalidad es lo que convierte al HT en el estimador de referencia de todo el curso.',
        retroFallo: 'Solo hacen falta las dos primeras. El tamaño fijo se necesita para la <em>forma de Sen–Yates–Grundy de la varianza</em>, no para la insesgadez; y la normalidad no aparece por ningún lado, porque los $y_k$ son constantes.'
      },
      {
        tipo: 'opcion',
        modulo: 4,
        pregunta: 'Bajo el diseño C, $E(N\\bar{y}) = 165{,}75$ mientras que el total verdadero es 150. ¿Qué explica ese sesgo de $+15{,}75$?',
        pista: '¿Qué unidades selecciona más a menudo el diseño C, y qué peso les da $N\\bar{y}$ a todas?',
        opciones: [
          { texto: 'El diseño selecciona con más probabilidad a las unidades grandes, y $N\\bar{y}$ les da a todas el mismo peso $N/n$.', correcta: true,
            retro: 'Eso es. El estimador de expansión supone $\\pi_k$ constante; cuando no lo es, sobrerrepresenta a quien sale más y el sesgo va en esa dirección.' },
          { texto: 'La muestra es demasiado pequeña ($n = 2$).', correcta: false,
            retro: 'El sesgo no depende de $n$: es una propiedad de la esperanza, y con $n = 3$ bajo el mismo diseño seguiría habiéndolo.' },
          { texto: 'Falta aplicar la corrección por población finita.', correcta: false,
            retro: 'El fpc afecta a la varianza, nunca a la esperanza. Un estimador sesgado no se arregla corrigiendo su varianza.' },
          { texto: 'La varianza poblacional $S^2$ es demasiado grande.', correcta: false,
            retro: '$S^2$ gobierna la varianza del estimador, no su sesgo. Un estimador puede ser insesgado y malísimo, o preciso y sesgado.' }
        ]
      },
      {
        tipo: 'grafico',
        modulo: 5,
        alto: 200,
        descripcionGrafico: 'Distribución de la media muestral con n = 10 y con n = 300, sobre el mismo eje',
        pregunta: 'Las dos distribuciones vienen de la misma población. ¿Qué se puede afirmar?',
        pista: 'Fíjate en dónde está centrada cada una y en cuánto se extiende cada una.',
        dibujar: canvas => {
          const alto = Math.max(...DATOS_CAP2.distribucion.n300.hist.conteo) * 1.05;
          return crearGraficoXY(canvas, [
            serieHistograma(DATOS_CAP2.distribucion.n10.hist, 'n = 10', '#6B7280'),
            serieHistograma(DATOS_CAP2.distribucion.n300.hist, 'n = 300', '#012820'),
            serieVertical(DATOS_CAP2.cifras.agpop.media, alto, 'Media poblacional', '#FF6600')
          ], { tituloX: 'Media muestral de acres92', tituloY: 'Réplicas', xMin: 0, xMax: 900000 });
        },
        opciones: [
          { texto: 'Las dos están centradas en la media poblacional; la de $n = 300$ es mucho más estrecha y más simétrica.', correcta: true,
            retro: 'Correcto. La insesgadez no depende de $n$ —las dos aciertan en promedio—; lo que mejora con $n$ es la precisión, y de paso la aproximación normal.' },
          { texto: 'La de $n = 300$ está mejor centrada: con $n = 10$ el estimador es sesgado.', correcta: false,
            retro: '$\\bar{y}$ es insesgado para cualquier $n$. Lo que pasa con $n = 10$ es que la distribución es muy asimétrica (asimetría 1,75), y eso se confunde fácilmente con un sesgo.' },
          { texto: 'La de $n = 10$ es más precisa porque su histograma es más alto.', correcta: false,
            retro: 'La altura solo depende del ancho de las clases del histograma. La precisión se lee en la <em>dispersión</em> horizontal, y ahí $n = 300$ gana con claridad.' },
          { texto: 'No se pueden comparar porque tienen tamaños de muestra distintos.', correcta: false,
            retro: 'Al contrario: compararlas es justo el objetivo, y por eso el simulador tiene una opción de escala fija.' }
        ]
      },
      {
        tipo: 'opcion',
        modulo: 5,
        pregunta: 'En un MAS sin reemplazo con $N = 100$ y $n = 20$, ¿cuánto vale $\\pi_{kl}$ para dos unidades distintas?',
        pista: 'La fórmula es $n(n-1)/[N(N-1)]$. Y compárala con $\\pi_k \\pi_l = 0{,}04$.',
        opciones: [
          { texto: '$20 \\cdot 19 / (100 \\cdot 99) = 0{,}0384$, que es algo menor que $\\pi_k\\pi_l = 0{,}04$.', correcta: true,
            retro: 'Sí. Que sea <em>menor</em> que el producto significa $\\Delta_{kl} < 0$: seleccionar a una unidad hace algo menos probable seleccionar a la otra, porque no hay reemplazo. De ahí sale el fpc.' },
          { texto: '$0{,}04$, porque las selecciones son independientes.', correcta: false,
            retro: 'No lo son. Sin reemplazo, que $k$ entre reduce los puestos disponibles para $l$; $0{,}04$ sería el valor con reemplazo.' },
          { texto: '$0{,}2$, igual que $\\pi_k$.', correcta: false,
            retro: 'Eso sería la probabilidad de que entre <em>una</em> de las dos, no las dos a la vez. $\\pi_{kl}$ siempre es menor o igual que $\\pi_k$.' },
          { texto: 'Cero, porque dos unidades concretas casi nunca salen juntas.', correcta: false,
            retro: '«Poco probable» y «probabilidad cero» son cosas distintas, y la diferencia es enorme: con $\\pi_{kl}=0$ la varianza deja de ser estimable, como en el sistemático del módulo 9.' }
        ]
      },
      {
        tipo: 'opcion',
        modulo: 6,
        pregunta: 'Un analista calcula el intervalo del 95 % para <code>agsrs</code> y <strong>olvida</strong> declarar el <code>fpc</code>. ¿Qué le pasa a su intervalo?',
        pista: 'El fpc multiplica la varianza por $1 - n/N$, que es un número menor que 1.',
        opciones: [
          { texto: 'Le queda más <strong>ancho</strong> de lo debido: su error estándar sube de 18 898 a 19 893, un 5,3 % más.', correcta: true,
            retro: 'Correcto, y es al revés de lo que casi todos esperan. Olvidar el fpc es un error conservador. El error de publicar intervalos demasiado estrechos viene de ignorar conglomerados y estratos, que es el capítulo 7.' },
          { texto: 'Le queda más estrecho, y publicará una precisión que no tiene.', correcta: false,
            retro: 'Sería así si el fpc multiplicara por algo mayor que 1. Multiplica por $1 - 300/3078 = 0{,}9025$, así que quitarlo agranda el error estándar.' },
          { texto: 'No cambia nada, porque el fpc solo afecta a la estimación puntual.', correcta: false,
            retro: 'El fpc no toca la estimación puntual —esa es $\\bar{y}$ pase lo que pase—; toca exclusivamente la varianza.' },
          { texto: 'El intervalo deja de estar centrado en $\\bar{y}$.', correcta: false,
            retro: 'El intervalo siempre es simétrico alrededor de la estimación puntual; el fpc solo cambia su semiancho.' }
        ]
      },
      {
        tipo: 'numerica',
        modulo: 7,
        pregunta: 'Para estimar una proporción con margen de error $0{,}03$ y 95 % de confianza, sin información previa sobre $p$: ¿cuánto vale $n_0$ (antes del fpc)? Redondea al entero.',
        pista: 'Sin información previa se toma $p = 0{,}5$, que maximiza $p(1-p)$. Y $z_{0{,}975} = 1{,}96$.',
        respuesta: 1067,
        tolerancia: 2,
        retroAcierto: '$n_0 = 1{,}96^2 \\cdot 0{,}25 / 0{,}03^2 = 1\\,067$. Es el número que hay detrás de casi todas las encuestas de opinión que se publican.',
        retroFallo: 'Es $n_0 = z^2 p(1-p)/e^2 = 1{,}96^2 \\cdot 0{,}25/0{,}0009 = 1\\,067$. Los dos errores habituales: usar $e = 3$ en vez de $0{,}03$, o dividir entre $e$ en lugar de entre $e^2$.'
      },
      {
        tipo: 'opcion',
        modulo: 8,
        pregunta: 'En el diseño Bernoulli con $\\pi = 0{,}02$ sobre <code>agpop</code>, el estimador de Hájek tiene un CV de 0,170 frente a 0,208 del de Horvitz–Thompson. ¿Por qué gana Hájek si es el estimador <em>sesgado</em>?',
        pista: 'Piensa en qué hace cada uno cuando el sorteo entrega menos unidades de las esperadas.',
        opciones: [
          { texto: 'Porque divide entre el tamaño de muestra realmente obtenido, y así absorbe buena parte de la variabilidad de $n_s$.', correcta: true,
            retro: 'Eso es. HT divide siempre entre $\\pi$ fijo, así que una muestra corta produce una estimación baja; Hájek se ajusta solo. Es el primer canje sesgo–varianza del curso, y el estimador de razón del capítulo 3 es su forma general.' },
          { texto: 'Porque el sesgo de Hájek compensa exactamente el error de HT.', correcta: false,
            retro: 'No hay tal compensación: el sesgo de Hájek es pequeño y va en la dirección que toque. Lo que gana es en <em>varianza</em>, y por eso el error cuadrático medio total le sale menor.' },
          { texto: 'Porque Hájek usa las $\\pi_{kl}$ y HT no.', correcta: false,
            retro: 'Ninguno de los dos usa $\\pi_{kl}$ en su forma puntual; en Bernoulli, además, $\\pi_{kl} = \\pi^2$ y todos los términos cruzados se anulan.' },
          { texto: 'Porque el diseño Bernoulli es de tamaño fijo.', correcta: false,
            retro: 'Justo lo contrario: el diseño Bernoulli tiene tamaño <em>aleatorio</em>, $n_s \\sim \\text{Bin}(N,\\pi)$, y ese es el problema que Hájek mitiga.' }
        ]
      },
      {
        tipo: 'multiple',
        modulo: 9,
        pregunta: 'Sobre el muestreo sistemático 1 en $k$, marca <strong>todo</strong> lo que es cierto.',
        pista: 'Son tres. Piensa por separado en la estimación puntual, en la varianza y en el papel del orden de la lista.',
        opciones: [
          { texto: 'Sus $\\pi_k$ valen $n/N$, igual que en el MAS, así que $N\\bar{y}$ sigue siendo insesgado.', correcta: true },
          { texto: 'Su varianza no se puede estimar sin sesgo con una sola muestra, porque hay pares con $\\pi_{kl} = 0$.', correcta: true },
          { texto: 'Si la lista está ordenada por una variable relacionada con $y$, suele ser más preciso que el MAS.', correcta: true },
          { texto: 'Es siempre más preciso que el MAS, porque recorre toda la lista.', correcta: false }
        ],
        retroAcierto: 'Las tres primeras. El sistemático es un diseño de dos caras: sobre <code>agpop</code> ordenado por <code>acres87</code> el DEFF es 0,073, y con un orden cíclico patológico sube a 218,9.',
        retroFallo: 'Las tres primeras son ciertas; la cuarta no. Todo depende del orden del marco: el mismo diseño puede tener DEFF 0,073 o 218,9 sobre la misma población.'
      },
      {
        tipo: 'opcion',
        modulo: 10,
        pregunta: 'En una validación cruzada de $K$ partes, ¿cuánto vale $\\pi_k$ para una fila cualquiera del conjunto de datos?',
        pista: '¿Cuántas veces pasa cada fila por el conjunto de test a lo largo de los $K$ pliegues?',
        opciones: [
          { texto: '$\\pi_k = 1$: toda fila entra en test exactamente una vez. Lo aleatorio es en qué pliegue cae, no si entra.', correcta: true,
            retro: 'Exacto, y tiene una consecuencia práctica: las $K$ estimaciones no son independientes, porque comparten datos de entrenamiento. Dividir su desviación entre $\\sqrt{K}$ subestima la incertidumbre.' },
          { texto: '$\\pi_k = 1/K$.', correcta: false,
            retro: 'Ese es el $\\pi_k$ de <em>un</em> pliegue tomado por separado. Recorriendo los $K$, todas las filas acaban en test.' },
          { texto: '$\\pi_k = 1 - (1 - 1/N)^N \\approx 0{,}632$.', correcta: false,
            retro: 'Esa es la $\\pi_k$ del <strong>bootstrap</strong>, que remuestrea con reemplazo. La validación cruzada particiona, no remuestrea.' },
          { texto: 'Depende del tamaño del conjunto de datos.', correcta: false,
            retro: 'No: la partición garantiza que cada fila pase por test una vez, sea cual sea $N$.' }
        ]
      }
    ];
