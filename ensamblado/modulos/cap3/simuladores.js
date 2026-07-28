    // ================================================================
    // Simuladores del capítulo 3
    //
    // Todos leen de DATOS_CAP3, que produce precalculo/genera_cap3.R.
    // Las 5 000 réplicas del sesgo del estimador de razón y las 3 000 de
    // la linealización ya están hechas: aquí solo se dibujan.
    // ================================================================
    const D3 = DATOS_CAP3;
    const AG = D3.agsrs;

    function fmtNum(x, d = 2) {
      if (!isFinite(x)) return '—';
      const s = Math.abs(x).toFixed(d);
      const partes = s.split('.');
      const entero = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      return (x < 0 ? '−' : '') + entero + (partes[1] ? ',' + partes[1] : '');
    }
    const puntosXY = (xs, ys) => xs.map((v, i) => ({ x: v, y: ys[i] }));
    const recta = (a, b, x0, x1) => [{ x: x0, y: a + b * x0 }, { x: x1, y: a + b * x1 }];

    // ---------------------------------------------------------------
    // M3 · La nube (x, y): recta por el origen frente a recta con intercepto
    // ---------------------------------------------------------------
    const NUBES = {
      agsrs: { d: () => AG, etiqueta: 'agpop · acres92 ~ acres87 (n = 300)',
               ejeX: 'acres87 (superficie sembrada en 1987)', ejeY: 'acres92' },
      cherry: { d: () => D3.cherry, etiqueta: 'cherry · volumen ~ diámetro (n = 31)',
                ejeX: 'diámetro (pulgadas)', ejeY: 'volumen (pies cúbicos)' },
      santacruz: { d: () => D3.santacruz, etiqueta: 'santacruz · plántulas 94 ~ 92 (n = 10)',
                   ejeX: 'plántulas en 1992', ejeY: 'plántulas en 1994' },
      deadtrees: { d: () => D3.deadtrees, etiqueta: 'deadtrees · campo ~ foto (n = 25)',
                   ejeX: 'conteo por fotografía', ejeY: 'conteo en campo' }
    };

    SIMULADORES['nube-razon-regresion'] = function (raiz) {
      const params = { cual: 'agsrs', razon: true, regresion: true, diferencia: false };
      const g = crearGraficoXY(raiz.querySelector('canvas'), [], { tituloX: '', tituloY: '' });

      function pintar() {
        const cfg = NUBES[params.cual];
        const d = cfg.d();
        const xs = d.x, ys = d.y;
        const xMax = Math.max(...xs) * 1.05;
        // La razón es siempre ȳ/x̄; para agsrs viene precalculada, para el
        // resto se recalcula aquí porque son diez o treinta puntos.
        const media = v => v.reduce((a, b) => a + b, 0) / v.length;
        const B = d.B !== undefined ? d.B : media(ys) / media(xs);
        let b0 = d.b0, b1 = d.b1;
        if (b0 === undefined) {
          const mx = media(xs), my = media(ys);
          const sxy = xs.reduce((a, v, i) => a + (v - mx) * (ys[i] - my), 0);
          const sxx = xs.reduce((a, v) => a + (v - mx) * (v - mx), 0);
          b1 = sxy / sxx; b0 = my - b1 * mx;
        }
        const series = [{ type: 'scatter', label: 'unidades de la muestra',
                          data: puntosXY(xs, ys), backgroundColor: 'rgba(1,40,32,0.45)',
                          pointRadius: 3 }];
        if (params.razon) {
          series.push({ type: 'line', label: `razón:  y = ${fmtNum(B, 4)}·x`,
            data: recta(0, B, 0, xMax), borderColor: COLORES_GRAFICO.secundario,
            borderWidth: 2, pointRadius: 0, fill: false });
        }
        if (params.regresion) {
          series.push({ type: 'line', label: `regresión:  y = ${fmtNum(b0, 2)} + ${fmtNum(b1, 4)}·x`,
            data: recta(b0, b1, 0, xMax), borderColor: COLORES_GRAFICO.terciario,
            borderWidth: 2, borderDash: [6, 4], pointRadius: 0, fill: false });
        }
        if (params.diferencia) {
          series.push({ type: 'line', label: 'diferencia:  y = x',
            data: recta(0, 1, 0, xMax), borderColor: '#94a3b8',
            borderWidth: 1.5, borderDash: [2, 3], pointRadius: 0, fill: false });
        }
        g.data.datasets = series;
        g.options.scales.x.min = 0;
        g.options.scales.x.max = xMax;
        g.options.scales.x.title.text = cfg.ejeX;
        g.options.scales.x.title.display = true;
        g.options.scales.y.title.text = cfg.ejeY;
        g.options.scales.y.title.display = true;
        g.update('none');

        const mx = media(xs), my = media(ys);
        const sxy = xs.reduce((a, v, i) => a + (v - mx) * (ys[i] - my), 0);
        const sxx = xs.reduce((a, v) => a + (v - mx) * (v - mx), 0);
        const syy = ys.reduce((a, v) => a + (v - my) * (v - my), 0);
        const r = sxy / Math.sqrt(sxx * syy);
        // Cuál gana lo decide el intercepto: si b0 está lejos de cero en
        // relación con el rango de y, la recta por el origen pierde.
        const relIntercepto = Math.abs(b0) / (Math.max(...ys) - Math.min(...ys));
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'B̂ = ȳ/x̄ =', valor: fmtNum(B, 4) },
          { etiqueta: 'intercepto b₀ =', valor: fmtNum(b0, 3) },
          { etiqueta: 'pendiente b₁ =', valor: fmtNum(b1, 4) },
          { etiqueta: 'correlación r =', valor: fmtNum(r, 4) },
          { etiqueta: '|b₀| como % del rango de y:', valor: fmtNum(100 * relIntercepto, 1) + ' %' },
          { etiqueta: 'la razón es adecuada:', valor: relIntercepto < 0.05 ? 'sí' : 'no — el intercepto no es despreciable' }
        ]);
      }

      crearSelector(raiz.querySelector('.simulador-controles'), {
        clave: 'cual', etiqueta: 'Conjunto de datos',
        opciones: Object.keys(NUBES).map(k => ({ valor: k, texto: NUBES[k].etiqueta }))
      }, params, pintar);
      crearInterruptores(raiz.querySelector('.simulador-controles'), [
        { clave: 'razon', etiqueta: 'Recta por el origen (razón)' },
        { clave: 'regresion', etiqueta: 'Recta con intercepto (regresión)' },
        { clave: 'diferencia', etiqueta: 'Recta y = x (diferencia)' }
      ], params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M4 · El sesgo del estimador de razón, medido
    // ---------------------------------------------------------------
    SIMULADORES['sesgo-razon'] = function (raiz) {
      // `sesgoRazon` es un data.frame de R: jsonlite lo escribe como array de
      // filas, así que se lee fila a fila y no por columnas.
      const SR = D3.sesgoRazon;
      const params = { i: 3 };
      const etiquetas = SR.map(f => 'n = ' + f.n);
      const g = crearGraficoBarras(raiz.querySelector('canvas'), etiquetas,
        SR.map(f => f.sesgo / 1e6), {
          etiqueta: 'Sesgo simulado (millones de acres)', color: COLORES_GRAFICO.secundario,
          tituloX: 'Tamaño de muestra', min: -1.8, max: 0.3,
          barrasExtra: [{ etiqueta: 'Sesgo teórico de orden 1/n',
                          valores: SR.map(f => f.sesgoTeorico / 1e6),
                          color: COLORES_GRAFICO.primario }],
          lineas: [{ valor: 0, etiqueta: '', color: '#94a3b8' }]
        });

      // Barras de error de Monte Carlo (±2 ee_MC) sobre el sesgo simulado. Sin
      // ellas, el gráfico invita a leer como medición lo que puede ser ruido:
      // con 5 000 réplicas esta misma serie salía con el signo cambiado.
      g.data.datasets.push({
        type: 'scatter', label: 'incertidumbre de Monte Carlo (±2 ee)',
        data: SR.flatMap((f, i) => [
          { x: i, y: (f.sesgo - 2 * f.eeMC) / 1e6 },
          { x: i, y: (f.sesgo + 2 * f.eeMC) / 1e6 }
        ]),
        backgroundColor: '#DC2626', pointRadius: 2.5, pointStyle: 'line',
        showLine: false, order: 0
      });
      g.update('none');

      function pintar() {
        const f = SR[params.i];
        const cociente = Math.abs(f.sesgo) / f.eeMC;
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'tamaño destacado:', valor: 'n = ' + f.n },
          { etiqueta: 'sesgo simulado:', valor: fmtNum(f.sesgo, 0) + ' acres' },
          { etiqueta: 'sesgo teórico:', valor: fmtNum(f.sesgoTeorico, 0) + ' acres' },
          { etiqueta: 'incertidumbre de Monte Carlo (ee/√M):', valor: '± ' + fmtNum(f.eeMC, 0) + ' acres' },
          { etiqueta: '¿el sesgo se distingue de cero?',
            valor: fmtNum(cociente, 1) + ' veces su incertidumbre — ' +
                   (f.medible ? 'sí, es medible' : 'NO: haría falta más réplicas') },
          { etiqueta: 'error estándar del estimador:', valor: fmtNum(f.ee, 0) + ' acres' },
          { etiqueta: 'sesgo / EE:', valor: fmtNum(f.sesgoRelEE, 5) },
          { etiqueta: 'sesgo como % del total real:',
            valor: fmtNum(100 * f.sesgo / D3.agsrs.tY, 4) + ' %' }
        ]);
      }

      crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'i', etiqueta: 'Tamaño destacado (índice)', min: 0, max: SR.length - 1, paso: 1 }
      ], params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M4 · Linealización: el error exacto contra su aproximación lineal
    // ---------------------------------------------------------------
    SIMULADORES['linealizacion'] = function (raiz) {
      const L = D3.linealizacion;
      const params = { mostrar: 'nube' };
      const g = crearGraficoXY(raiz.querySelector('canvas'), [], {
        tituloX: 'Error exacto  t̂_r − t (millones)', tituloY: 'Aproximación lineal (millones)'
      });

      function pintar() {
        const ex = L.exacto.map(v => v / 1e6), li = L.lineal.map(v => v / 1e6);
        const lo = Math.min(...ex, ...li), hi = Math.max(...ex, ...li);
        const series = [{ type: 'scatter', label: `${ex.length} muestras de tamaño ${L.n}`,
          data: puntosXY(ex, li), backgroundColor: 'rgba(1,40,32,0.35)', pointRadius: 2.5 }];
        if (params.mostrar !== 'solo') {
          series.push({ type: 'line', label: 'si la aproximación fuera exacta',
            data: [{ x: lo, y: lo }, { x: hi, y: hi }], borderColor: COLORES_GRAFICO.secundario,
            borderWidth: 2, pointRadius: 0, fill: false });
        }
        g.data.datasets = series;
        g.options.scales.x.min = lo; g.options.scales.x.max = hi;
        g.options.scales.y.beginAtZero = false;
        g.update('none');
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'correlación exacto ↔ lineal:', valor: fmtNum(L.correlacion, 5) },
          { etiqueta: 'EE exacto:', valor: fmtNum(L.eeExacto, 0) },
          { etiqueta: 'EE de la aproximación:', valor: fmtNum(L.eeLineal, 0) },
          { etiqueta: 'diferencia relativa:', valor: fmtNum(100 * (L.eeLineal / L.eeExacto - 1), 2) + ' %' },
          { etiqueta: 'lo que se desprecia:', valor: 'el término de orden 1/n, que es el sesgo' }
        ]);
      }

      crearSelector(raiz.querySelector('.simulador-controles'), {
        clave: 'mostrar', etiqueta: 'Diagonal de referencia',
        opciones: [{ valor: 'nube', texto: 'Mostrar la diagonal' },
                   { valor: 'solo', texto: 'Solo la nube' }]
      }, params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M8 · Dominios
    // ---------------------------------------------------------------
    SIMULADORES['dominios'] = function (raiz) {
      const params = { cual: 'region' };
      const g = crearGraficoBarras(raiz.querySelector('canvas'), [], [], {
        etiqueta: 'Media estimada del dominio', color: COLORES_GRAFICO.primario,
        tituloX: 'Dominio', min: 0, max: 800000,
        barrasExtra: [{ etiqueta: 'Media real (se conoce porque agpop es un censo)',
                        valores: [], color: COLORES_GRAFICO.gris }]
      });

      function pintar() {
        const esRegion = params.cual === 'region';
        const D = esRegion ? D3.dominios.region : D3.dominios.binario;   // array de filas
        const et = D.map(f => esRegion ? f.nombre : f.dominio);
        g.data.labels = et;
        g.data.datasets[0].data = D.map(f => f.media);
        g.data.datasets[1].data = D.map(f => (esRegion ? f.mediaReal : null));
        g.data.datasets[1].label = esRegion
          ? 'Media real (se conoce porque agpop es un censo)' : '';
        g.options.scales.y.suggestedMax = Math.max(...D.map(f => f.media)) * 1.35;
        g.update('none');

        const campos = D.map((f, i) => ({
          etiqueta: (et[i] + ':'),
          valor: `n_d = ${f.nd}, media ${fmtNum(f.media, 0)}, EE ${fmtNum(f.ee, 0)} ` +
                 `(CV ${fmtNum(100 * f.ee / f.media, 1)} %)`
        }));
        campos.push({ etiqueta: 'n_d es aleatorio:',
                      valor: 'no se elige de antemano, y por eso la varianza no es la del MAS' });
        actualizarLectura(raiz.querySelector('.simulador-lectura'), campos);
      }

      crearSelector(raiz.querySelector('.simulador-controles'), {
        clave: 'cual', etiqueta: 'Partición en dominios',
        opciones: [{ valor: 'region', texto: 'Las cuatro regiones' },
                   { valor: 'binario', texto: '600 granjas o más / menos de 600' }]
      }, params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M10 · GREG: los cuatro estimadores son cuatro valores de beta
    // ---------------------------------------------------------------
    SIMULADORES['greg'] = function (raiz) {
      const G = D3.greg;
      const params = { beta: Math.round(AG.B * 100) / 100 };
      const g = crearGraficoXY(raiz.querySelector('canvas'), [], {
        tituloX: 'Pendiente del modelo de trabajo  β', tituloY: 'Total estimado (millones)'
      });

      const total = b => AG.N * AG.ybar + b * (AG.tX - AG.N * AG.xbar);

      function pintar() {
        const series = [
          { type: 'line', label: 't̂_GREG(β)',
            data: G.beta.map((b, i) => ({ x: b, y: G.total[i] / 1e6 })),
            borderColor: COLORES_GRAFICO.primario, borderWidth: 2, pointRadius: 0, fill: false },
          { type: 'line', label: 'total real',
            data: [{ x: 0, y: AG.tY / 1e6 }, { x: 2, y: AG.tY / 1e6 }],
            borderColor: '#dc2626', borderDash: [6, 4], borderWidth: 2, pointRadius: 0, fill: false },
          { type: 'scatter', label: 'los cuatro estimadores del capítulo',
            data: G.puntos.map(p => ({ x: p.beta, y: p.total / 1e6 })),
            backgroundColor: COLORES_GRAFICO.secundario, pointRadius: 6 },
          { type: 'scatter', label: 'tu β',
            data: [{ x: params.beta, y: total(params.beta) / 1e6 }],
            backgroundColor: '#0e7490', pointRadius: 7, pointStyle: 'rectRot' }
        ];
        g.data.datasets = series;
        g.options.scales.y.beginAtZero = false;
        g.update('none');

        const t = total(params.beta);
        const cerca = G.puntos.reduce((mejor, p) =>
          Math.abs(p.beta - params.beta) < Math.abs(mejor.beta - params.beta) ? p : mejor, G.puntos[0]);
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'β =', valor: fmtNum(params.beta, 3) },
          { etiqueta: 't̂_GREG =', valor: fmtNum(t, 0) },
          { etiqueta: 'error frente al total real:', valor: fmtNum(100 * (t / AG.tY - 1), 4) + ' %' },
          { etiqueta: 'estimador más cercano:', valor: cerca.nombre },
          { etiqueta: 't_x − t̂_x,π =', valor: fmtNum(AG.tX - AG.N * AG.xbar, 0) },
          { etiqueta: 'la corrección que aplica β:', valor: fmtNum(params.beta * (AG.tX - AG.N * AG.xbar), 0) }
        ]);
      }

      crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'beta', etiqueta: 'Pendiente del modelo β', min: 0, max: 2, paso: 0.005, decimales: 3 }
      ], params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M11 · La mediana por la función de distribución estimada
    // ---------------------------------------------------------------
    SIMULADORES['mediana'] = function (raiz) {
      const M = D3.mediana;
      const params = { p: 0.5 };
      const g = crearGraficoXY(raiz.querySelector('canvas'), [], {
        tituloX: 'acres92', tituloY: 'F(y)', xMin: 0, xMax: 900000
      });

      // El cuantil estimado: el menor y de la muestra con F̂(y) >= p. Es la
      // misma definición del precálculo, con la misma tolerancia.
      function cuantil(p) {
        const i = M.cdf.F.findIndex(f => f >= p - 1e-9);
        return i < 0 ? M.cdf.y[M.cdf.y.length - 1] : M.cdf.y[i];
      }
      function cuantilReal(p) {
        const i = M.cdfReal.F.findIndex(f => f >= p - 1e-9);
        return i < 0 ? M.cdfReal.y[M.cdfReal.y.length - 1] : M.cdfReal.y[i];
      }

      function pintar() {
        const q = cuantil(params.p), qr = cuantilReal(params.p);
        g.data.datasets = [
          { type: 'line', label: 'F̂ estimada con los 300 de la muestra', stepped: 'after',
            data: M.cdf.y.map((v, i) => ({ x: v, y: M.cdf.F[i] })),
            borderColor: COLORES_GRAFICO.primario, borderWidth: 2, pointRadius: 0, fill: false },
          { type: 'line', label: 'F real de los 3 078 condados', stepped: 'after',
            data: M.cdfReal.y.map((v, i) => ({ x: v, y: M.cdfReal.F[i] })),
            borderColor: COLORES_GRAFICO.gris, borderWidth: 1.6, borderDash: [5, 4],
            pointRadius: 0, fill: false },
          { type: 'line', label: '', data: [{ x: 0, y: params.p }, { x: 900000, y: params.p }],
            borderColor: COLORES_GRAFICO.secundario, borderDash: [3, 3], borderWidth: 1.5,
            pointRadius: 0, fill: false },
          { type: 'scatter', label: 'cuantil estimado', data: [{ x: q, y: params.p }],
            backgroundColor: COLORES_GRAFICO.secundario, pointRadius: 6 }
        ];
        g.options.scales.y.max = 1;
        g.update('none');
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'p =', valor: fmtNum(params.p, 2) },
          { etiqueta: 'cuantil estimado:', valor: fmtNum(q, 0) },
          { etiqueta: 'cuantil real:', valor: fmtNum(qr, 0) },
          { etiqueta: 'error:', valor: fmtNum(100 * (q / qr - 1), 2) + ' %' },
          { etiqueta: 'mediana estimada (p = 0,5):', valor: fmtNum(M.estimada, 0) },
          { etiqueta: 'IC del 95 % de la mediana:',
            valor: `[${fmtNum(M.ic[0], 0)}, ${fmtNum(M.ic[1], 0)}]` }
        ]);
      }

      crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'p', etiqueta: 'Cuantil p', min: 0.05, max: 0.95, paso: 0.05 }
      ], params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M12 · Los cuatro estimadores, ordenables
    // ---------------------------------------------------------------
    TABLAS_RANKING['estimadores'] = function () {
      return {
        descripcion: 'Los cuatro estimadores del capítulo sobre la misma muestra de 300 condados. ' +
          'Pulsa cualquier cabecera para reordenar. La columna que de verdad importa es el error ' +
          'estándar; la del error real solo se puede calcular aquí porque agpop es un censo, y en ' +
          'una encuesta de verdad no estaría disponible.',
        columnas: [
          { clave: 'nombre', titulo: 'Estimador', tipo: 'texto' },
          { clave: 'total', titulo: 'Total estimado', decimales: 0 },
          { clave: 'ee', titulo: 'Error estándar', decimales: 0, mejor: 'menor' },
          { clave: 'errorPct', titulo: 'Error real (%)', decimales: 3, mejor: 'menor' },
          { clave: 'eficiencia', titulo: 'Eficiencia frente a la expansión', decimales: 1, mejor: 'mayor' }
        ],
        filas: D3.estimadores.map(f => ({
          nombre: f.nombre,
          total: f.total,
          ee: f.ee,
          errorPct: Math.abs(f.errorPct),
          eficiencia: f.eficiencia
        })),
        inicial: 'ee',
        destacada: 'Diferencia',
        pie: 'Los tres estimadores con variable auxiliar están empatados en la práctica —entre 108 ' +
          'y 119 veces más eficientes que la expansión— y muy por delante de ella. La diferencia ' +
          'gana por poco, y solo porque acres92 y acres87 miden lo mismo con dos censos de por ' +
          'medio: en cuanto x e y estén en unidades distintas, dejará de ser una opción.'
      };
    };

    // ================================================================
    // Glosario de notación del capítulo 3
    // ================================================================
    GLOSARIOS['razon-regresion'] = {
      titulo: 'Notación: este material ↔ Lohr ↔ Gutiérrez',
      nota: 'Ojo con la numeración: razón y regresión es el <strong>capítulo 3 de la 2.ª edición ' +
        'de Lohr y el capítulo 4 de la 3.ª</strong>. Las secciones que cita este material están ' +
        'con las dos numeraciones en las referencias de cada módulo.',
      filas: [
        { concepto: 'Variable auxiliar', aqui: 'x_k', lohr: 'x_i', gutierrez: 'x_k', r: 'agsrs$acres87' },
        { concepto: 'Total auxiliar conocido', aqui: 't_x', lohr: 't_x', gutierrez: 't_x', r: 'sum(agpop$acres87)' },
        { concepto: 'Razón poblacional', aqui: 'B = t_y / t_x', lohr: 'B', gutierrez: 'R', r: 'svyratio()' },
        { concepto: 'Estimador de razón', aqui: '\\hat{B} = \\bar{y}/\\bar{x}', lohr: '\\hat{B}', gutierrez: '\\hat{R}', r: 'coef(svyratio())' },
        { concepto: 'Total por razón', aqui: '\\hat{t}_r = \\hat{B}\\, t_x', lohr: '\\hat{t}_{yr}', gutierrez: '\\hat{t}_{y,r}', r: 'predict(svyratio(), t_x)' },
        { concepto: 'Residuo de la razón', aqui: 'e_k = y_k - \\hat{B} x_k', lohr: 'e_i', gutierrez: 'e_k', r: 'y - B*x' },
        { concepto: 'Estimador de regresión', aqui: '\\hat{t}_{\\text{reg}}', lohr: '\\hat{t}_{y\\text{reg}}', gutierrez: '\\hat{t}_{y,\\text{reg}}', r: 'calibrate()' },
        { concepto: 'Estimador de diferencia', aqui: '\\hat{t}_d', lohr: '\\hat{t}_{yd}', gutierrez: '\\hat{t}_{y,d}', r: 'a mano' },
        { concepto: 'Estimador GREG', aqui: '\\hat{t}_{\\text{GREG}}', lohr: '—', gutierrez: '\\hat{t}_{y,\\text{GREG}}', r: 'calibrate()' },
        { concepto: 'Factor de ajuste de pesos', aqui: 'g_k', lohr: 'g_i', gutierrez: 'g_k', r: 'weights(dis_cal)/weights(dis)' },
        { concepto: 'Dominio', aqui: 'U_d', lohr: '\\mathcal{U}_d', gutierrez: 'U_d', r: 'svyby()' },
        { concepto: 'Función de distribución', aqui: '\\hat{F}(t)', lohr: '\\hat{F}(y)', gutierrez: '\\hat{F}_y(t)', r: 'svyquantile()' }
      ]
    };

    // ================================================================
    // Autoevaluación del capítulo
    // ================================================================
    AUTOEVALUACIONES['cap3'] = [
      {
        tipo: 'opcion',
        modulo: 1,
        pregunta: 'Para que una variable $x$ sirva como auxiliar en la estimación de razón, ¿qué hace falta?',
        pista: '¿Dónde entra $t_x$ en la fórmula $\\hat{t}_r = \\hat{B}\\,t_x$?',
        opciones: [
          { texto: 'Conocer $x_k$ en la muestra <strong>y</strong> el total $t_x$ en toda la población.', correcta: true,
            retro: 'Exacto. Las dos cosas: sin $x_k$ en la muestra no hay $\\hat{B}$, y sin $t_x$ no hay a qué multiplicarla. Ese requisito es lo que limita en la práctica qué variables se pueden usar.' },
          { texto: 'Basta con conocer $x_k$ en la muestra.', correcta: false,
            retro: 'Entonces no habría nada que aportar: la información nueva está en $t_x$, que es lo que la muestra no sabe.' },
          { texto: 'Que $x$ e $y$ estén medidas en las mismas unidades.', correcta: false,
            retro: 'Eso hace falta para el estimador de <em>diferencia</em>, no para el de razón. La razón funciona con unidades distintas: bushels por acre, por ejemplo.' },
          { texto: 'Que la correlación entre $x$ e $y$ sea negativa.', correcta: false,
            retro: 'Al revés: la ganancia viene de que sean muy correlacionadas y en el mismo sentido. Con $r = 0{,}996$ en <code>agsrs</code>, el error estándar baja un 90 %.' }
        ]
      },
      {
        tipo: 'numerica',
        modulo: 2,
        pregunta: 'Con $\\bar{y} = 297\\,897{,}05$ y $\\bar{x} = 301\\,953{,}72$, ¿cuánto vale $\\hat{B}$? Da cuatro decimales.',
        pista: 'Es una división y nada más. El resultado tiene que salir cerca de 1, porque las dos variables miden lo mismo con cinco años de diferencia.',
        respuesta: 0.9866,
        tolerancia: 0.0006,
        retroAcierto: '$297\\,897{,}05 / 301\\,953{,}72 = 0{,}9866$. La superficie sembrada cayó un 1,3 % entre 1987 y 1992, y eso es exactamente lo que el estimador de razón traslada al total conocido de 1987.',
        retroFallo: 'Es $\\bar{y}/\\bar{x} = 0{,}9866$. Un error típico es dividir al revés y dar 1,0136: $\\hat{B}$ estima $t_y/t_x$, así que la $y$ va arriba.'
      },
      {
        tipo: 'grafico',
        modulo: 3,
        alto: 230,
        descripcionGrafico: 'Volumen frente a diámetro en los 31 cerezos, con la recta por el origen y la recta con intercepto',
        pregunta: 'En estos 31 cerezos, ¿conviene el estimador de razón?',
        pista: 'Mira dónde corta cada recta al eje vertical y compáralo con el rango de los volúmenes.',
        dibujar: canvas => {
          const c = DATOS_CAP3.cherry;
          const xMax = Math.max(...c.x) * 1.05;
          return crearGraficoXY(canvas, [
            { type: 'scatter', label: '31 cerezos', data: c.x.map((v, i) => ({ x: v, y: c.y[i] })),
              backgroundColor: 'rgba(1,40,32,0.5)', pointRadius: 4 },
            { type: 'line', label: 'razón (por el origen)', data: [{ x: 0, y: 0 }, { x: xMax, y: c.B * xMax }],
              borderColor: '#FF6600', borderWidth: 2, pointRadius: 0, fill: false },
            { type: 'line', label: 'regresión', data: [{ x: 0, y: c.b0 }, { x: xMax, y: c.b0 + c.b1 * xMax }],
              borderColor: '#0e7490', borderWidth: 2, borderDash: [6, 4], pointRadius: 0, fill: false }
          ], { tituloX: 'diámetro (pulgadas)', tituloY: 'volumen (pies cúbicos)', xMin: 0, xMax: xMax });
        },
        opciones: [
          { texto: 'No: el intercepto ajustado es −36,9, muy lejos de cero, y la recta por el origen se aleja de la nube en los dos extremos.', correcta: true,
            retro: 'Correcto. Un árbol de diámetro cero no tiene volumen cero <em>según este ajuste lineal</em>, porque la relación real entre volumen y diámetro es cuadrática. Cuando el intercepto no es despreciable, la regresión gana.' },
          { texto: 'Sí, porque la correlación es alta.', correcta: false,
            retro: 'La correlación alta ($R^2 = 0{,}935$) dice que hay una relación fuerte, no que pase por el origen. Son dos cosas distintas y confundirlas es el error más común del capítulo.' },
          { texto: 'Sí, porque el volumen no puede ser negativo.', correcta: false,
            retro: 'Que $y$ sea positiva no obliga a la recta a pasar por el origen. Aquí la recta ajustada corta el eje en −36,9, y eso no es un problema: solo significa que no hay que extrapolar a diámetros pequeños.' },
          { texto: 'Da igual, los dos estimadores coinciden cuando $n$ es pequeño.', correcta: false,
            retro: 'No coinciden nunca salvo por casualidad; y con $n$ pequeño la diferencia entre ellos es <em>mayor</em>, no menor.' }
        ]
      },
      {
        tipo: 'multiple',
        modulo: 4,
        pregunta: 'Sobre el sesgo del estimador de razón, marca <strong>todo</strong> lo que sea cierto.',
        pista: 'Dos cosas distintas: cómo se comporta con $n$, y cómo se compara con el error estándar.',
        opciones: [
          { texto: 'Es de orden $1/n$: se hace despreciable al crecer la muestra.', correcta: true },
          { texto: 'Con $n = 300$ es unas mil veces menor que el error estándar.', correcta: true },
          { texto: 'Existe aunque el muestreo sea aleatorio simple y perfectamente ejecutado.', correcta: true },
          { texto: 'Se puede eliminar usando <code>survey</code> en vez de la fórmula a mano.', correcta: false }
        ],
        retroAcierto: 'Las tres primeras. El sesgo es una propiedad del <em>estimador</em>, no del software ni del diseño: viene de que $\\hat{B}$ es un cociente de dos variables aleatorias, y la esperanza de un cociente no es el cociente de las esperanzas.',
        retroFallo: 'Son las tres primeras. Lo que no es cierto es lo último: <code>survey</code> calcula el mismo estimador, con el mismo sesgo. Lo que hace pequeño al sesgo es $n$, y a cambio se acepta porque el error cuadrático medio baja muchísimo.'
      },
      {
        tipo: 'opcion',
        modulo: 6,
        pregunta: 'En <code>survey</code>, ¿cómo se calcula el estimador de regresión?',
        pista: '¿Qué información se le está imponiendo a los pesos?',
        opciones: [
          { texto: 'Con <code>calibrate()</code>, ajustando los pesos para que reproduzcan $N$ y $t_x$.', correcta: true,
            retro: 'Exacto, y ese es el puente con el capítulo 7: la regresión, la razón y la postestratificación son todas calibración, con distintos totales impuestos.' },
          { texto: 'Con <code>svyglm()</code>, tomando el coeficiente de la pendiente.', correcta: false,
            retro: '<code>svyglm()</code> da la pendiente, pero el estimador de regresión del total es otra cosa: la pendiente es un ingrediente, no el resultado.' },
          { texto: 'Con <code>svyratio()</code> y el argumento <code>intercept = TRUE</code>.', correcta: false,
            retro: 'Ese argumento no existe. <code>svyratio()</code> hace la razón, que es la recta forzada por el origen.' },
          { texto: 'No se puede: hay que programarlo a mano.', correcta: false,
            retro: 'Se puede, y conviene hacerlo de las dos maneras. En este capítulo el total coincide exactamente por las dos vías; el error estándar difiere un 4,9 %, y el módulo 6 explica por qué.' }
        ]
      },
      {
        tipo: 'numerica',
        modulo: 7,
        pregunta: 'El total auxiliar es $t_x = 963\\,464\\,412$ y la media de las diferencias $y_k - x_k$ en la muestra es $-4\\,056{,}677$. Con $N = 3\\,078$, ¿cuánto vale el estimador de diferencia? Da el resultado en millones, con un decimal.',
        pista: '$\\hat{t}_d = t_x + N\\,(\\bar{y} - \\bar{x})$, y la media de las diferencias ya es $\\bar{y} - \\bar{x}$.',
        respuesta: 951.0,
        tolerancia: 0.15,
        retroAcierto: '$963\\,464\\,412 + 3\\,078 \\times (-4\\,056{,}677) = 950\\,977\\,961$, es decir 951,0 millones. La corrección es de −12,5 millones sobre el total de 1987.',
        retroFallo: 'Es $963\\,464\\,412 + 3\\,078 \\times (-4\\,056{,}677) = 950\\,977\\,961 \\approx 951{,}0$ millones. El error frecuente es olvidar multiplicar por $N$: la media de diferencias hay que llevarla a escala poblacional.'
      },
      {
        tipo: 'opcion',
        modulo: 8,
        pregunta: 'Al estimar la media de un dominio, ¿por qué no sirve la fórmula del error estándar del MAS?',
        pista: '¿Qué cantidad de la fórmula del MAS es fija por diseño, y qué pasa con su equivalente aquí?',
        opciones: [
          { texto: 'Porque $n_d$, el número de unidades de la muestra que caen en el dominio, es aleatorio: cambia de una muestra a otra.', correcta: true,
            retro: 'Correcto. La media de dominio es una <em>razón</em> —suma de $y$ por el indicador sobre suma del indicador—, y su varianza se obtiene linealizando, igual que la de $\\hat{B}$.' },
          { texto: 'Porque los dominios no son estratos.', correcta: false,
            retro: 'Cierto que no lo son, pero la razón de fondo es la que dice la otra opción: en un estrato, $n_h$ lo fija el diseño; en un dominio, $n_d$ sale de la muestra.' },
          { texto: 'Porque el tamaño poblacional del dominio $N_d$ se conoce.', correcta: false,
            retro: 'Justo al revés: cuando $N_d$ <em>se conoce</em>, el dominio se comporta casi como un estrato y la fórmula se simplifica. El caso difícil es cuando no se conoce.' },
          { texto: 'Porque la media de dominio es sesgada.', correcta: false,
            retro: 'Lo es, ligeramente, por ser una razón; pero eso no es lo que invalida la fórmula del error estándar.' }
        ]
      },
      {
        tipo: 'opcion',
        modulo: 10,
        pregunta: 'En el GREG $\\hat{t}_{\\text{GREG}} = \\hat{t}_\\pi + \\beta\\,(t_x - \\hat{t}_{x,\\pi})$, ¿qué se obtiene con $\\beta = 0$?',
        pista: 'Sustituye y mira qué queda.',
        opciones: [
          { texto: 'El estimador de expansión: la corrección desaparece y no se usa la auxiliar.', correcta: true,
            retro: 'Eso es. El GREG es una familia de estimadores indexada por $\\beta$, y el de expansión es el miembro que renuncia a la información auxiliar. El simulador del módulo lo enseña como el extremo izquierdo de la curva.' },
          { texto: 'El estimador de razón.', correcta: false,
            retro: 'La razón se obtiene con $\\beta = \\hat{B} = 0{,}9866$, no con cero.' },
          { texto: 'El estimador de diferencia.', correcta: false,
            retro: 'La diferencia es $\\beta = 1$, que es el otro punto notable de la curva.' },
          { texto: 'Un estimador sesgado.', correcta: false,
            retro: 'El de expansión es <em>insesgado</em>: es el único de los cuatro que lo es exactamente. Lo que le pasa es que su error estándar es diez veces mayor.' }
        ]
      },
      {
        tipo: 'multiple',
        modulo: 10,
        pregunta: 'El GREG con modelo $y_k = \\beta x_k + \\varepsilon_k$ y varianza $V(\\varepsilon_k) = \\sigma^2 v_k$. Marca <strong>las correspondencias correctas</strong>.',
        pista: 'La pendiente sale de mínimos cuadrados ponderados con peso $1/v_k$. Sustituye cada $v_k$ y simplifica.',
        opciones: [
          { texto: '$v_k = x_k$ da exactamente el estimador de razón.', correcta: true },
          { texto: '$\\beta = 1$ da el estimador de diferencia.', correcta: true },
          { texto: 'Añadir intercepto al modelo da el estimador de regresión.', correcta: true },
          { texto: '$v_k = x_k^2$ da el estimador de expansión.', correcta: false }
        ],
        retroAcierto: 'Las tres primeras, y las tres se comprueban en el bloque de R del módulo: con $v_k = x_k$ la pendiente sale 0,98656524, que es $\\hat{B}$ hasta la última cifra.',
        retroFallo: 'Son las tres primeras. Con $v_k = x_k^2$ sale la media de las razones individuales $\\frac{1}{n}\\sum y_k/x_k$, que es otro estimador —consistente, pero distinto— y desde luego no el de expansión.'
      },
      {
        tipo: 'opcion',
        modulo: 11,
        pregunta: 'La mediana estimada de <code>acres92</code> sale 196 701 con la definición $\\inf\\{t: \\hat{F}(t) \\ge 0{,}5\\}$ y 196 733 con el convenio por defecto de <code>svyquantile</code>. ¿Qué está pasando?',
        pista: '¿Cuánto vale $\\hat{F}$ exactamente en la unidad 150 de 300?',
        opciones: [
          { texto: 'Que $\\hat{F}$ vale exactamente 0,5 en una unidad, y ahí la mediana muestral no está definida de forma única: los dos valores son legítimos según el convenio.', correcta: true,
            retro: 'Correcto. Pasa siempre que $n\\,p$ es entero y los pesos son iguales. Son 32 acres sobre 197 000 —un 0,016 %—, pero conviene saber que el desacuerdo existe antes de pasar media tarde buscando un error que no está.' },
          { texto: 'Que <code>survey</code> tiene un error.', correcta: false,
            retro: 'No: <code>svyquantile</code> ofrece nueve convenios distintos en su argumento <code>qrule</code>, y con <code>qrule = "hf4"</code> devuelve exactamente 196 701. Es una elección documentada, no un fallo.' },
          { texto: 'Que la muestra tiene valores repetidos.', correcta: false,
            retro: 'El desacuerdo aparecería igual sin ningún valor repetido: lo que lo produce es que la función escalonada alcance el nivel 0,5 justo en un escalón.' },
          { texto: 'Que la mediana poblacional es 191 486 y las dos estimaciones están mal.', correcta: false,
            retro: 'Las dos estimaciones son de la <em>muestra</em>, y las dos sobrestiman la mediana poblacional en torno a un 2,7 %. Eso es error de muestreo, que es otra cosa distinta del desacuerdo entre convenios.' }
        ]
      },
      {
        tipo: 'opcion',
        modulo: 9,
        pregunta: 'El enfoque asistido por modelos usa un modelo para construir el estimador. ¿Qué pasa si el modelo está mal especificado?',
        pista: '¿De qué depende la insesgadez del GREG: del modelo o del diseño?',
        opciones: [
          { texto: 'El estimador sigue siendo asintóticamente insesgado por diseño; lo que se pierde es eficiencia.', correcta: true,
            retro: 'Exacto, y esa es toda la gracia del enfoque asistido por modelos: el modelo se usa para <em>construir</em> el estimador, pero la inferencia se apoya en el diseño. Un modelo malo cuesta precisión, no validez.' },
          { texto: 'El estimador se vuelve sesgado y no se puede usar.', correcta: false,
            retro: 'Eso ocurriría con un enfoque puramente basado en modelos, donde la inferencia depende de que el modelo sea correcto. El GREG no: su insesgadez asintótica es de diseño.' },
          { texto: 'El error estándar deja de ser calculable.', correcta: false,
            retro: 'Se calcula igual, con los residuos del modelo. Si el modelo ajusta mal, los residuos son grandes y el error estándar sale grande: el método avisa.' },
          { texto: 'No pasa nada, el modelo es irrelevante.', correcta: false,
            retro: 'Sí pasa: la eficiencia depende por completo del modelo. Con $r = 0{,}996$ se gana un factor 110; con una auxiliar sin relación con $y$, el GREG no gana nada y puede incluso perder.' }
        ]
      }
    ];
