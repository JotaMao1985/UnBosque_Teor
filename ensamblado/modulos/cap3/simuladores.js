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
    // M3 · La nube (x, y): las cuatro rectas del capítulo sobre los mismos
    //      puntos. La horizontal es la expansión, que no usa x: sin ella el
    //      simulador comparaba la razón solo contra rivales aún no vistos.
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
      const params = { cual: 'agsrs', expansion: true, razon: true, regresion: true,
                       diferencia: false };
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
        if (params.expansion) {
          series.push({ type: 'line', label: `expansión:  y = ȳ = ${fmtNum(media(ys), 2)}`,
            data: recta(media(ys), 0, 0, xMax), borderColor: COLORES_GRAFICO.primario,
            borderWidth: 2, borderDash: [10, 5], pointRadius: 0, fill: false });
        }
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
          { etiqueta: 'ȳ (la recta de la expansión) =', valor: fmtNum(my, 2) },
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
        { clave: 'expansion', etiqueta: 'Recta horizontal y = ȳ (expansión)' },
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
      // con 200 000 réplicas el sesgo se distingue de cero en los nueve tamaños;
      // con 5 000, esta misma serie salía con el signo cambiado.
      //
      // OJO con la `x` de estos puntos: el eje es de CATEGORÍAS. Un `x` numérico
      // NO se interpreta como el índice de la categoría —Chart.js coloca
      // entonces cada punto por su posición dentro del dataset, y los nueve
      // sobrantes se amontonan en la última—. La `x` tiene que ser la etiqueta,
      // que es lo único que el eje sabe emparejar.
      g.data.datasets.push({
        type: 'scatter', label: 'incertidumbre de Monte Carlo (±2 ee)',
        data: SR.flatMap((f, i) => [
          { x: etiquetas[i], y: (f.sesgo - 2 * f.eeMC) / 1e6 },
          { x: etiquetas[i], y: (f.sesgo + 2 * f.eeMC) / 1e6 }
        ]),
        backgroundColor: '#DC2626', borderColor: '#DC2626', borderWidth: 2,
        pointRadius: 7, pointStyle: 'line', showLine: false, order: 0
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
    // M9 · Dominios
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
    // M11 · GREG: los cuatro estimadores son cuatro valores de beta
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
    // M12 · La mediana por la función de distribución estimada
    // ---------------------------------------------------------------
    SIMULADORES['mediana'] = function (raiz) {
      const M = D3.mediana;
      const params = { p: 0.5 };
      // Los dos cuantiles NO se recalculan aquí: se leen de la tabla que el
      // precálculo construye sobre las curvas completas, con la definición
      // inf{t : F̂(t) >= p} y `quantile(type = 1)`. Recorrer la curva dibujada
      // era lo que hacía este simulador, y publicaba 196 733 en p = 0,5 —el
      // convenio `math` que el módulo declara que no usa— porque la curva iba
      // adelgazada y se saltaba la unidad 150.
      const CS = M.cuantilesSlider;
      const fila = p => CS.reduce((a, r) => Math.abs(r.p - p) < Math.abs(a.p - p) ? r : a, CS[0]);
      // El eje llega hasta donde llega el deslizador: con 900 000 fijos, el
      // cuantil de p = 0,95 (1 019 300) caía fuera del gráfico y la respuesta
      // no se veía justo en el último valor del control.
      const X_MAX = Math.max(...CS.map(r => Math.max(r.estimado, r.real))) * 1.05;
      const g = crearGraficoXY(raiz.querySelector('canvas'), [], {
        tituloX: 'acres92', tituloY: 'F(y)', xMin: 0, xMax: X_MAX
      });

      function pintar() {
        const f = fila(params.p);
        const q = f.estimado, qr = f.real;
        g.data.datasets = [
          { type: 'line', label: 'F̂ estimada con los 300 de la muestra', stepped: 'after',
            data: M.cdf.y.map((v, i) => ({ x: v, y: M.cdf.F[i] })),
            borderColor: COLORES_GRAFICO.primario, borderWidth: 2, pointRadius: 0, fill: false },
          { type: 'line', label: 'F real de los 3 078 condados', stepped: 'after',
            data: M.cdfReal.y.map((v, i) => ({ x: v, y: M.cdfReal.F[i] })),
            borderColor: COLORES_GRAFICO.gris, borderWidth: 1.6, borderDash: [5, 4],
            pointRadius: 0, fill: false },
          { type: 'line', label: '', data: [{ x: 0, y: params.p }, { x: X_MAX, y: params.p }],
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
    // M7 · Los cuatro estimadores, ordenables
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
        pie: 'Los tres estimadores con variable auxiliar están empatados en la práctica —entre 108 ' +
          'y 119 veces más eficientes que la expansión— y muy por delante de ella. La diferencia ' +
          'sale primera en ESTA muestra, y conviene no leer más de lo que eso dice: sobre agpop ' +
          'entero, con n = 300, el orden verdadero pone delante a la regresión y deja a la ' +
          'diferencia la última de las tres. Un hueco del 0,89 % no lo resuelve ninguna muestra. ' +
          'Y ojo con el argumento fácil: que acres92 y acres87 midan lo mismo NO es lo que decide ' +
          '—las cuatro parejas de agpop lo cumplen y en dos gana la razón—; decide si la pendiente ' +
          'está más cerca de B o de 1.'
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
        { concepto: 'Razón poblacional', aqui: 'B = t_y / t_x', lohr: 'B', gutierrez: 'B = t_y/t_z', r: 'svyratio()' },
        { concepto: 'Estimador de razón', aqui: '\\hat{B} = \\bar{y}/\\bar{x}', lohr: '\\hat{B}', gutierrez: '\\hat{B}, \\hat{B}_\\pi', r: 'coef(svyratio())' },
        { concepto: 'Total por razón', aqui: '\\hat{t}_r = \\hat{B}\\, t_x', lohr: '\\hat{t}_{yr}', gutierrez: '\\hat{t}_{y,r}', r: 'predict(svyratio(), t_x)' },
        { concepto: 'Residuo de la razón', aqui: 'e_k = y_k - \\hat{B} x_k', lohr: 'e_i', gutierrez: 'e_k', r: 'y - B*x' },
        { concepto: 'Estimador de regresión', aqui: '\\hat{t}_{\\text{reg}}', lohr: '\\hat{t}_{y\\text{reg}}', gutierrez: '\\hat{t}_{y,greg}', r: 'calibrate()' },
        { concepto: 'Estimador de diferencia', aqui: '\\hat{t}_d', lohr: '\\hat{\\bar{y}}_{\\text{diff}}', gutierrez: '—', r: 'a mano' },
        { concepto: 'Estimador GREG', aqui: '\\hat{t}_{\\text{GREG}}', lohr: '\\hat{t}_{y\\text{GREG}}', gutierrez: '\\hat{t}_{y,greg}', r: 'calibrate()' },
        { concepto: 'Factor de ajuste de pesos', aqui: 'g_k', lohr: 'g_i', gutierrez: 'g_{ks}', r: 'weights(dis_cal)/weights(dis)' },
        { concepto: 'Dominio', aqui: 'U_d', lohr: '\\mathcal{U}_d', gutierrez: 'U_d', r: 'svyby()' },
        { concepto: 'Función de distribución', aqui: '\\hat{F}(t)', lohr: '\\hat{F}(y)', gutierrez: '\\widehat{F}(y)', r: 'svyquantile()' }
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
          { texto: 'Conocer $x_k$ en la muestra y el total $t_x$ en la población.', correcta: true,
            retro: 'Exacto. Las dos cosas: sin $x_k$ en la muestra no hay $\\hat{B}$, y sin $t_x$ no hay a qué multiplicarla. Ese doble requisito es lo que limita en la práctica qué variables se pueden usar como auxiliares.' },
          { texto: 'Basta con conocer $x_k$ en las unidades sorteadas de la muestra.', correcta: false,
            retro: 'Entonces no habría nada que aportar: toda la información nueva está en $t_x$, que es justo lo que la muestra no sabe. Con solo $x_k$ se puede calcular $\\hat{B}$, pero no hay a qué aplicarla.' },
          { texto: 'Que $x$ e $y$ estén medidas en las mismas unidades físicas.', correcta: false,
            retro: 'Eso hace falta para el estimador de <em>diferencia</em>, no para el de razón. La razón funciona con unidades distintas: bushels por acre, por ejemplo, o toneladas por plantación.' },
          { texto: 'Conocer $N$, el número de unidades de la población.', correcta: false,
            retro: 'No hace falta para el estimador puntual: $\\hat{t}_r = \\hat{B}\\,t_x$ no contiene $N$ por ningún lado, y de ahí sale el camión de cestas de fresas del módulo 1, que se pesa sin saber cuántas cestas lleva. Sí aparece en el error estándar, dentro de la corrección por población finita.' }
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
        tipo: 'numerica',
        modulo: 2,
        pregunta: 'Con $t_x = 963\,464\,412$, $\bar{x} = 301\,953{,}72$, $s_e = 31\,657{,}22$, $n = 300$ y $N = 3\,078$, calcula $\mathrm{EE}(\hat{t}_r) = \dfrac{t_x}{\bar{x}}\sqrt{1-n/N}\;\dfrac{s_e}{\sqrt{n}}$. Da el resultado en millones de acres, con dos decimales.',
        pista: 'Son cuatro factores y ninguna sutileza. El $s_e$ es la desviación de los <em>residuos</em>, no la de $y$: por eso sale pequeño.',
        respuesta: 5.54,
        tolerancia: 0.03,
        unidad: 'millones de acres',
        retroAcierto: 'Correcto: <strong>5,54 millones</strong>. Es la cifra insignia del capítulo, y conviene haberla calculado una vez a mano: el factor $t_x/\bar{x}$ lleva el error estándar a escala de total, la raíz es la corrección por población finita, y todo el trabajo de la variable auxiliar está metido dentro de $s_e$.',
        retroFallo: 'Es $\dfrac{963\,464\,412}{301\,953{,}72}\sqrt{1-300/3078}\;\dfrac{31\,657{,}22}{\sqrt{300}} = 5\,540\,376$, es decir 5,54 millones. El fallo más común es usar la desviación de $y$ ($344\,829{,}6$) en vez de la de los residuos: con ella sale 60,3 millones, que es el orden de la expansión.'
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
          { texto: 'No: el intercepto ajustado está lejos de cero, en −36,9.', correcta: true,
            retro: 'Correcto, y se ve además en la forma de la nube: la recta por el origen se aleja de ella en los dos extremos. Un árbol de diámetro cero no tiene volumen cero <em>según este ajuste lineal</em>, porque la relación real entre volumen y diámetro es cuadrática. Cuando el intercepto no es despreciable, la regresión gana.' },
          { texto: 'Sí: la correlación entre diámetro y volumen es altísima.', correcta: false,
            retro: 'La correlación alta ($R^2 = 0{,}935$) dice que hay una relación fuerte, no que pase por el origen. Son dos cosas distintas y confundirlas es el error más común del capítulo.' },
          { texto: 'Sí: el volumen no puede ser negativo, así que pasa por 0.', correcta: false,
            retro: 'Que $y$ sea positiva no obliga a la recta a pasar por el origen. Aquí la recta ajustada corta el eje en −36,9, y eso no es un problema en sí: solo significa que no hay que extrapolar a diámetros pequeños.' },
          { texto: 'Da igual: con $n$ pequeño los dos estimadores coinciden.', correcta: false,
            retro: 'No coinciden nunca salvo por casualidad; y con $n$ pequeño la diferencia entre ellos es <em>mayor</em>, no menor, porque cada uno estima su recta con menos información.' }
        ]
      },
      {
        tipo: 'opcion',
        modulo: 3,
        pregunta: 'La regla del módulo 3 dice que conviene la razón si $\\rho > \\tfrac12\\,\\mathrm{CV}(x)/\\mathrm{CV}(y)$. En <code>agsrs</code> sale $0{,}9958$ contra un umbral de $0{,}4937$. ¿Qué se ha demostrado con eso?',
        pista: 'La desigualdad salió de comparar dos errores cuadráticos medios. ¿Cuáles dos?',
        opciones: [
          { texto: 'Que la razón le gana a la expansión, y a nadie más.', correcta: true,
            retro: 'Exacto, y es el matiz que más se pierde. La desigualdad se obtuvo de $\\mathrm{ECM}(\\hat{\\bar y}_r) \\le \\mathrm{ECM}(\\bar y)$: su rival es el estimador que ignora $x$. La regresión nunca entró en la cuenta, y de hecho es siempre al menos tan buena como la razón.' },
          { texto: 'Que la razón es el mejor de los cuatro estimadores.', correcta: false,
            retro: 'No. La regla solo compara con la expansión. El módulo 7 demuestra que la regresión tiene varianza menor o igual que la razón <em>siempre</em>, pase lo que pase con esta desigualdad.' },
          { texto: 'Que la recta de regresión libre pasa por el origen.', correcta: false,
            retro: 'Ésa es otra pregunta y otro criterio: el contraste sobre el intercepto del módulo 6. Una correlación altísima es perfectamente compatible con un intercepto muy distinto de cero — los cerezos del ejercicio 2 lo enseñan.' },
          { texto: 'Que el sesgo de $\\hat{B}$ es despreciable en esta muestra.', correcta: false,
            retro: 'Eso lo dice la cota del módulo 4, $\\lvert\\mathrm{Sesgo}\\rvert/\\sigma \\le \\mathrm{CV}(\\hat{\\bar x})$, que en <code>agsrs</code> vale 0,0626. Son dos criterios distintos y ninguno implica al otro.' }
        ]
      },
      {
        tipo: 'opcion',
        modulo: 4,
        pregunta: 'Con $n = 300$ el sesgo de $\\hat{t}_r$ vale $-38\\,963$ acres y su error estándar 7,11 millones. ¿Qué justifica <em>aceptar</em> un estimador sesgado?',
        pista: 'El capítulo 1 dejó la herramienta que suma las dos cosas en un solo número.',
        opciones: [
          { texto: 'Que el sesgo al cuadrado desaparece dentro del ECM.', correcta: true,
            retro: 'Exacto: $\\text{ECM} = \\text{Sesgo}^2 + V$, y aquí el sesgo es <strong>182 veces</strong> menor que el error estándar, así que su cuadrado aporta tres cienmilésimas del ECM. Se cambia insesgadez por un error estándar diez veces menor: es una ganga, y está medida.' },
          { texto: 'Que el sesgo medido salió negativo en los nueve tamaños.', correcta: false,
            retro: 'El signo es un hecho de esta población —el estimador subestima aquí—, no un argumento. Un sesgo pequeño se acepta por su tamaño relativo, nunca por su dirección.' },
          { texto: 'Que con 200 000 réplicas el sesgo deja de poder medirse.', correcta: false,
            retro: 'Al revés: con 5 000 réplicas el sesgo era ruido, y con 200 000 la incertidumbre de Monte Carlo bajó a 15 900 y el sesgo <em>por fin</em> se distinguió de cero. Más réplicas lo hacen visible, no lo eliminan.' },
          { texto: 'Que el sesgo se anula si el muestreo es aleatorio simple.', correcta: false,
            retro: 'No se anula con ningún diseño: viene de que $\\hat{B}$ es un cociente de dos variables aleatorias, y la esperanza de un cociente no es el cociente de las esperanzas. Lo que lo hace pequeño es $n$, no la forma de sortear.' }
        ]
      },
      {
        tipo: 'numerica',
        modulo: 4,
        pregunta: 'En <code>agsrs</code>, $s_x = 344\\,829{,}6$, $\\bar{x} = 301\\,953{,}7$, $n = 300$ y $N = 3\\,078$. Calcula $\\widehat{\\mathrm{CV}}(\\hat{\\bar x}) = \\sqrt{(1-f)/n}\\;s_x/\\bar{x}$, la cota del sesgo relativo. Da cuatro decimales.',
        pista: 'Con $f = n/N = 300/3\\,078$. Es una sola cuenta, y el resultado tiene que quedar muy por debajo de 0,1.',
        respuesta: 0.0626,
        tolerancia: 0.0004,
        retroAcierto: 'Correcto: $0{,}0626$. La regla de Kish pide que esté por debajo de 0,1–0,2 para dar el sesgo por despreciable, y aquí sobra margen. Lo notable es que esta cifra sale de <strong>una sola muestra</strong>: la simulación de 200 000 réplicas confirma lo mismo, pero en la vida real no se tiene.',
        retroFallo: 'Es $\\sqrt{(1 - 300/3078)/300} \\times 344\\,829{,}6/301\\,953{,}7 = 0{,}0626$. Los dos fallos típicos: olvidar la corrección por población finita, u olvidar dividir por $\\bar{x}$ —la cota es un <em>coeficiente de variación</em>, no una desviación típica—.'
      },
      {
        tipo: 'opcion',
        modulo: 5,
        pregunta: 'Un estudiante estima $B$ con la media de los cocientes, $\\frac1n\\sum y_k/x_k$, en vez de $\\bar{y}/\\bar{x}$. Con muestra suficiente, ¿qué le pasa?',
        pista: 'Pregúntate a qué número converge cada una de las dos fórmulas cuando $n \\to N$.',
        opciones: [
          { texto: 'No converge a $B$: converge a la media de los cocientes.', correcta: true,
            retro: 'Ése es el fondo del asunto. No es un estimador peor de lo mismo: es un estimador de <em>otra cosa</em>. En <code>agpop</code> esa media de cocientes vale $0{,}9530$ frente a $B = 0{,}9797$, un desvío del 2,73 %. Por eso aumentar $n$ no lo arregla: lo hace converger, con más precisión, al número equivocado.' },
          { texto: 'Converge a $B$, pero con bastante más varianza.', correcta: false,
            retro: 'Si sólo fuera varianza, más muestra lo resolvería. El problema es que el límite es otro: $0{,}9530$ en vez de $0{,}9797$. Ningún tamaño de muestra corrige un objetivo equivocado.' },
          { texto: 'Da exactamente lo mismo: es la misma cantidad reordenada.', correcta: false,
            retro: 'Sólo coinciden si todos los $x_k$ son iguales. Tómese dos unidades, la primera con $x = 1$ e $y = 2$, la segunda con $x = 6$ e $y = 6$: la razón de medias vale $8/7 = 1{,}14$ y la media de cocientes vale $\\tfrac12(2 + 1) = 1{,}50$. Los mismos datos, dos números.' },
          { texto: 'Falla sólo si la muestra trae algún valor atípico.', correcta: false,
            retro: 'Los atípicos lo empeoran, pero el problema es anterior: apunta a otro parámetro aunque no haya ninguno. Y hay un fallo más brusco: donde $x_k = 0$ el cociente no existe. En <code>agpop</code> son 2 condados con cero acres, más 23 con el código de faltante $-99$, que dan cociente negativo: 25 unidades que hay que amputar, y con ellas se acaba describiendo otra población.' }
        ]
      },
      {
        tipo: 'numerica',
        modulo: 6,
        pregunta: 'Con $\\bar{y} = 297\\,897{,}05$, $\\hat b_1 = 0{,}995004$, $\\bar{x} = 301\\,953{,}72$ y $\\bar{x}_U = 313\\,016{,}38$, calcula la media por regresión $\\hat{\\bar y}_{\\text{reg}} = \\bar{y} + \\hat b_1(\\bar{x}_U - \\bar{x})$. Da el resultado en acres, redondeado a la unidad.',
        pista: 'La muestra se quedó corta en $x$, así que $\\bar{x}_U - \\bar{x}$ es positivo y la corrección <em>sube</em> la media.',
        respuesta: 308904,
        tolerancia: 3,
        unidad: 'acres',
        retroAcierto: '$297\\,897{,}05 + 0{,}995004 \\times 11\\,062{,}66 = 308\\,904$. Multiplicado por $N = 3\\,078$ da 950 807 843, que es el total por regresión del módulo 6 hasta la última cifra.',
        retroFallo: 'Es $297\\,897{,}05 + 0{,}995004 \\times (313\\,016{,}38 - 301\\,953{,}72) = 308\\,904$. Dos fallos típicos: restar al revés dentro del paréntesis —la corrección sube, no baja, porque la muestra se quedó corta en $x$— y multiplicar por $N$, que da el total y no la media.'
      },
      {
        tipo: 'opcion',
        modulo: 6,
        pregunta: 'Para decidir entre razón y regresión se contrasta $H_0: a = 0$ en la recta libre. En <code>agsrs</code> sale $p = 0{,}2942$ por MCO. ¿Qué conviene hacer antes de darlo por bueno?',
        pista: 'Piensa en qué supone <code>lm()</code> sobre cómo se obtuvieron las observaciones.',
        opciones: [
          { texto: 'Repetir el contraste con <code>svyglm()</code>, que sí usa el diseño.', correcta: true,
            retro: 'Correcto, y es el aviso que el propio criterio no trae. Aquí da igual —bajo m.a.s. las dos estimaciones del intercepto coinciden y el p-valor pasa de 0,2942 a 0,3378, misma conclusión—, pero con estratos o conglomerados el error estándar de <code>lm()</code> puede quedarse muy corto y volver significativo lo que no lo era.' },
          { texto: 'Nada: un p-valor es un p-valor, venga del método que venga.', correcta: false,
            retro: 'El p-valor depende del error estándar, y el de <code>lm()</code> se calcula suponiendo observaciones independientes e idénticamente distribuidas. Eso es cierto bajo m.a.s. y falso en casi cualquier otro diseño del curso.' },
          { texto: 'Comprobar antes que el $R^2$ del ajuste sea suficientemente alto.', correcta: false,
            retro: 'El $R^2$ no interviene en esta decisión. En los cerezos vale 0,9353 y aun así la razón está descartada: son preguntas distintas.' },
          { texto: 'Rechazar la razón, porque $p > 0{,}05$ no demuestra nada.', correcta: false,
            retro: 'Al revés. $p > 0{,}05$ significa que no se puede rechazar que la recta pase por el origen, y entonces se prefiere la razón <em>por ser el modelo más simple</em>. Lo que descarta la razón es un p-valor pequeño, como el $7{,}6\\times10^{-12}$ de los cerezos.' }
        ]
      },
      {
        tipo: 'numerica',
        modulo: 7,
        pregunta: 'El total auxiliar es $t_x = 963\\,464\\,412$ y la media de las diferencias $y_k - x_k$ en la muestra es $-4\\,056{,}677$. Con $N = 3\\,078$, ¿cuánto vale el estimador de diferencia? Da el resultado en millones, con un decimal.',
        pista: '$\\hat{t}_d = t_x + N\\,(\\bar{y} - \\bar{x})$, y la media de las diferencias ya es $\\bar{y} - \\bar{x}$.',
        respuesta: 951.0,
        tolerancia: 0.15,
        unidad: 'millones de acres',
        retroAcierto: '$963\\,464\\,412 + 3\\,078 \\times (-4\\,056{,}677) = 950\\,977\\,961$, es decir 951,0 millones. La corrección es de −12,5 millones sobre el total de 1987.',
        retroFallo: 'Es $963\\,464\\,412 + 3\\,078 \\times (-4\\,056{,}677) = 950\\,977\\,961 \\approx 951{,}0$ millones. El error frecuente es olvidar multiplicar por $N$: la media de diferencias hay que llevarla a escala poblacional.'
      },
      {
        tipo: 'opcion',
        modulo: 7,
        pregunta: 'El teorema del módulo 7 dice $V(\\hat{\\bar y}_r) \\ge V(\\hat{\\bar y}_{\\text{reg}})$, con igualdad si y sólo si $B = b_1$. ¿Qué significa esa condición de igualdad?',
        pista: 'Escribe la recta de regresión $y = b_0 + b_1 x$ y pregúntate qué vale $b_0$ cuando $b_1$ coincide con $B = \\bar{y}_U/\\bar{x}_U$.',
        opciones: [
          { texto: 'Que la recta de regresión libre pasa por el origen.', correcta: true,
            retro: 'Exacto: es el mismo criterio del módulo 6, dicho en varianzas, y eso une los tres módulos: $b_1 = B$ equivale a $b_0 = 0$. Cuando la recta pasa por el origen, la razón no pierde nada frente a la regresión; cuando no, la regresión gana justo lo que mide el cuadrado $(B S_x - \\rho S_y)^2$.' },
          { texto: 'Que la correlación entre $x$ e $y$ vale exactamente 1.', correcta: false,
            retro: 'Con $\\rho = 1$ las dos varianzas se anulan y el empate es trivial. Pero la igualdad se da mucho antes: basta que la recta pase por el origen, con cualquier correlación.' },
          { texto: 'Que la muestra es lo bastante grande para que dé igual.', correcta: false,
            retro: 'El teorema es sobre varianzas poblacionales aproximadas; no hay ningún $n$ que lo active o lo desactive. El tamaño influye en si la <em>tabla estimada</em> deja ver el orden, no en si el orden existe.' },
          { texto: 'Que los cuatro estimadores del capítulo coinciden.', correcta: false,
            retro: 'No: $B = b_1$ empata razón y regresión, y deja fuera a la expansión y a la diferencia. Que la diferencia empate exige otra cosa, $b_1 = 1$, y la expansión $b_1 = 0$.' }
        ]
      },
      {
        tipo: 'opcion',
        modulo: 7,
        pregunta: 'En <code>agpop</code>, para <code>largef92 ~ largef87</code> salen $B = 1{,}0240$ y $b_1 = 0{,}9714$. Las dos variables son la misma cosa medida dos veces. ¿Qué estimador gana?',
        pista: 'El cuadrado perfecto $(b\,S_x - \rho\,S_y)^2$ premia al $b$ más próximo a un número concreto. ¿A cuál?',
        opciones: [
          { texto: 'La diferencia: $b_1$ queda más cerca de 1 que de $B$.', correcta: true,
            retro: 'Exacto: $\lvert b_1 - 1\rvert = 0{,}0286$ contra $\lvert b_1 - B\rvert = 0{,}0526$. La diferencia gana un <strong>6,82 %</strong>, y la regla acierta en las cuatro parejas de <code>agpop</code>.' },
          { texto: 'La razón: $B$ está más cerca de 1 que la pendiente ajustada.', correcta: false,
            retro: 'Lo que hay que comparar con $b_1$ no es 1 con $B$, sino cada candidato con $b_1$, que es donde la parábola tiene el mínimo. Y $b_1 = 0{,}9714$ dista menos de 1 que de $B = 1{,}0240$.' },
          { texto: 'La diferencia: $x$ e $y$ son la misma variable medida dos veces.', correcta: false,
            retro: 'Esa condición la cumplen las <em>cuatro</em> parejas de <code>agpop</code>, y en dos de ellas gana la razón. Una condición que dispara igual en casos con desenlaces opuestos no está decidiendo nada.' },
          { texto: 'La razón: su umbral del módulo 3 se cumple aquí de sobra.', correcta: false,
            retro: 'El umbral del módulo 3 solo dice que la razón le gana a la <strong>expansión</strong>. Aquí la comparación es contra la diferencia, y ésa es otra cuenta: la del cuadrado perfecto del módulo 7.' }
        ]
      },
      {
        tipo: 'opcion',
        modulo: 8,
        pregunta: 'En el ejemplo de los tomates se usa regresión en la región I, la media muestral en la II y razón en la III, y luego se suman los tres totales <strong>y las tres varianzas</strong>. ¿Qué permite sumar las varianzas sin términos cruzados?',
        pista: 'No es una propiedad de los estimadores elegidos. Es una propiedad del <em>diseño</em>.',
        opciones: [
          { texto: 'Que el sorteo de cada estrato es independiente de los demás.', correcta: true,
            retro: 'Exacto, y es lo único que el módulo toma prestado del capítulo 4. Como los tres sorteos son independientes, las covarianzas entre estratos son cero y $\\hat V(\\hat t) = \\sum_h N_h^2 \\hat V(\\hat{\\bar y}_h)$. Eso es lo que hace legítimo mezclar tres estimadores distintos en una sola cuenta.' },
          { texto: 'Que los tres estimadores elegidos resultan ser insesgados.', correcta: false,
            retro: 'Ni siquiera es cierto: la razón y la regresión son sesgadas, y el módulo lo avisa. Y aunque lo fueran, el insesgamiento no dice nada sobre covarianzas.' },
          { texto: 'Que las tres regiones tienen el mismo tamaño de muestra $n_h$.', correcta: false,
            retro: 'No lo tienen —20, 13 y 27, por afijación proporcional— y daría igual: la independencia no depende de que los $n_h$ coincidan.' },
          { texto: 'Que en cada región se eligió el estimador de menor varianza.', correcta: false,
            retro: 'Eso es lo que hace pequeña a la suma, no lo que permite sumarla. Aunque se hubiera elegido el peor estimador en cada estrato, las varianzas seguirían sumándose igual.' }
        ]
      },
      {
        tipo: 'opcion',
        modulo: 8,
        pregunta: 'En la región III de los tomates la constante ajustada vale 0,88 con $p = 0{,}9844$. ¿Por qué se elige ahí la razón y no la regresión?',
        pista: 'El teorema del módulo 7 dice cuándo las dos empatan. Si empatan, ¿qué desempata?',
        opciones: [
          { texto: 'Porque la recta pasa por el origen y cuesta un parámetro menos.', correcta: true,
            retro: 'Eso es. Con $p = 0{,}9844$ no hay ninguna razón para creer que la constante no sea cero, y el teorema del módulo 7 dice que ahí la razón no pierde nada frente a la regresión. Empatando, se prefiere el modelo más simple: una recta por el origen tiene un parámetro en vez de dos.' },
          { texto: 'Porque el teorema del módulo 7 prohíbe usar la regresión aquí.', correcta: false,
            retro: 'El teorema no prohíbe nada: dice que la regresión nunca tiene <em>más</em> varianza verdadera que la razón. Lo que pasa en esta región es que las iguala, y entonces el criterio pasa a ser otro.' },
          { texto: 'Porque su $R^2$, 0,6889, es el más alto de las tres regiones.', correcta: false,
            retro: 'Volver al $R^2$ es el error más frecuente del capítulo. Que la relación sea fuerte no dice nada sobre si pasa por el origen, y la región I tiene la constante más significativa de las tres con un $R^2$ de solo 0,2025.' },
          { texto: 'Porque la expansión y la razón dan la misma varianza estimada ahí.', correcta: false,
            retro: 'No la dan: en la región III la expansión sale con 940,35 y la razón con 292,59, tres veces menos. Las dos que casi coinciden son la razón y la regresión, y ése es justo el punto.' }
        ]
      },
      {
        tipo: 'opcion',
        modulo: 9,
        pregunta: 'Al estimar la media de un dominio, ¿por qué no sirve la fórmula del error estándar del MAS?',
        pista: '¿Qué cantidad de la fórmula del MAS es fija por diseño, y qué pasa con su equivalente aquí?',
        opciones: [
          { texto: 'Porque $n_d$ es aleatorio: cambia de una muestra a otra.', correcta: true,
            retro: 'Correcto: $n_d$, el número de unidades de la muestra que caen en el dominio, no lo fija el diseño. La media de dominio pasa a ser una <em>razón</em> —suma de $y$ por el indicador sobre suma del indicador—, y su varianza se obtiene linealizando, igual que la de $\\hat{B}$.' },
          { texto: 'Porque un dominio no es un estrato del diseño muestral.', correcta: false,
            retro: 'Cierto que no lo es, pero la razón de fondo es el carácter aleatorio de $n_d$: en un estrato $n_h$ lo fija el diseño, y en un dominio $n_d$ sale de la muestra. Esa es la diferencia que rompe la fórmula, no el nombre.' },
          { texto: 'Porque el tamaño poblacional del dominio $N_d$ se conoce.', correcta: false,
            retro: 'Conocer $N_d$ no cambia nada aquí: el error estándar de la <em>media</em> de dominio no lo contiene. Donde sí decide es en el <em>total</em>, que tiene una fórmula si $N_d$ se conoce y otra, más cara, si no.' },
          { texto: 'Porque la media de dominio es un estimador sesgado.', correcta: false,
            retro: 'Lo es, ligeramente, por ser una razón; pero eso no es lo que invalida la fórmula del error estándar.' }
        ]
      },
      {
        tipo: 'opcion',
        modulo: 9,
        pregunta: 'Para estimar el <strong>total</strong> de un dominio hay dos fórmulas. ¿Qué decide cuál se usa, y qué cuesta la segunda?',
        pista: 'Con la media basta una fórmula. Con el total hay un dato que el diseño no siempre tiene.',
        opciones: [
          { texto: 'Si se conoce $N_d$; no conocerlo sube el error estándar relativo.', correcta: true,
            retro: 'Correcto. Con $N_d$ conocido, $\hat t_{yd} = N_d\,\hat{\bar y}_d$; sin él hay que pasar por $u_k = y_k\delta_k$ y estimar $N\bar u$, que arrastra la incertidumbre sobre el tamaño del dominio. En el dominio de los condados con 600 granjas o más, el error estándar relativo pasa del <strong>6,81 %</strong> al <strong>9,29 %</strong>.' },
          { texto: 'Si $n_d$ es grande; con $n_d$ pequeño la segunda es más estable.', correcta: false,
            retro: 'El tamaño de $n_d$ afecta a la precisión de las dos por igual. Lo que separa las fórmulas es si $N_d$ —el tamaño <em>poblacional</em> del dominio— se conoce, no cuántas unidades cayeron en la muestra.' },
          { texto: 'Si el dominio es un estrato; la segunda vale solo para estratos.', correcta: false,
            retro: 'Al revés: si fuera un estrato, $n_h$ sería fijo y no haría falta nada de este módulo. Las dos fórmulas son para dominios, y la que se usa depende de $N_d$.' },
          { texto: 'Si la variable es continua; con indicadoras solo sirve la primera.', correcta: false,
            retro: 'La naturaleza de $y$ no interviene. De hecho la segunda fórmula funciona convirtiendo en ceros las unidades de fuera, que es exactamente trabajar con una indicadora.' }
        ]
      },
      {
        tipo: 'opcion',
        modulo: 10,
        pregunta: 'El enfoque asistido por modelos usa un modelo para construir el estimador. ¿Qué pasa si el modelo está mal especificado?',
        pista: '¿De qué depende la insesgadez del GREG: del modelo o del diseño?',
        opciones: [
          { texto: 'Sigue siendo insesgado por diseño; lo que se pierde es eficiencia.', correcta: true,
            retro: 'Exacto, y esa es toda la gracia del enfoque asistido por modelos: el modelo se usa para <em>construir</em> el estimador, pero la inferencia se apoya en el diseño. Un modelo malo cuesta precisión, no validez.' },
          { texto: 'Se vuelve sesgado y deja de servir para hacer inferencia válida.', correcta: false,
            retro: 'Eso ocurriría con un enfoque puramente basado en modelos, donde la inferencia depende de que el modelo sea correcto. El GREG no: su insesgadez asintótica es de diseño.' },
          { texto: 'El error estándar deja de poder calcularse con los residuos del modelo.', correcta: false,
            retro: 'Se calcula igual, con los residuos del modelo. Si el modelo ajusta mal, los residuos son grandes y el error estándar sale grande: el método avisa.' },
          { texto: 'No pasa nada: el modelo es del todo irrelevante para el resultado.', correcta: false,
            retro: 'Sí pasa: la eficiencia depende por completo del modelo. Con $r = 0{,}996$ se gana un factor 110; con una auxiliar sin relación con $y$, el GREG no gana nada y puede incluso perder.' }
        ]
      },
      {
        tipo: 'opcion',
        modulo: 11,
        pregunta: 'En el GREG $\\hat{t}_{\\text{GREG}} = \\hat{t}_\\pi + \\beta\\,(t_x - \\hat{t}_{x,\\pi})$, ¿qué se obtiene con $\\beta = 0$?',
        pista: 'Sustituye y mira qué queda.',
        opciones: [
          { texto: 'El de expansión: la corrección se anula y la auxiliar no se usa.', correcta: true,
            retro: 'Eso es. El GREG es una familia de estimadores indexada por $\\beta$, y el de expansión es el miembro que renuncia a la información auxiliar. El simulador del módulo lo enseña como el extremo izquierdo de la curva.' },
          { texto: 'El de razón: la corrección se aplica con la pendiente estimada $\\hat{B}$.', correcta: false,
            retro: 'La razón es otro punto de la misma curva: $\\beta = \\hat{B} = 0{,}9866$, no cero. Con $\\beta = 0$ el paréntesis entero desaparece y no queda corrección ninguna.' },
          { texto: 'El de diferencia: la corrección se aplica con la pendiente fijada en 1.', correcta: false,
            retro: 'La diferencia es $\\beta = 1$, el otro punto notable de la curva: traslada íntegro el desvío observado en $x$. Con $\\beta = 0$ no se traslada nada.' },
          { texto: 'Un estimador sesgado: se pierde la corrección que lo centraba.', correcta: false,
            retro: 'El de expansión es <em>insesgado</em>, y exactamente, igual que el de diferencia: los que llevan un sesgo pequeño son el de razón y el de regresión. Lo que le pasa es que su error estándar es diez veces mayor.' }
        ]
      },
      {
        tipo: 'multiple',
        modulo: 11,
        pregunta: 'El GREG con modelo $y_k = \\beta x_k + \\varepsilon_k$ y varianza $V(\\varepsilon_k) = \\sigma^2 v_k$. Marca <strong>las correspondencias correctas</strong>.',
        pista: 'La pendiente sale de mínimos cuadrados ponderados con peso $1/v_k$. Sustituye cada $v_k$ y simplifica.',
        opciones: [
          { texto: '$v_k = x_k$ da exactamente el estimador de razón.', correcta: true },
          { texto: '$\\beta = 1$ da el estimador de diferencia.', correcta: true },
          { texto: 'Añadir intercepto al modelo da el estimador de regresión.', correcta: true },
          { texto: '$v_k = x_k^2$ da el estimador de expansión.', correcta: false }
        ],
        retroAcierto: 'Todas menos la de $v_k = x_k^2$, y las tres verdaderas se comprueban en el bloque de R del módulo: con $v_k = x_k$ la pendiente sale 0,98656524, que es $\\hat{B}$ hasta la última cifra.',
        retroFallo: 'Son las tres que no usan $v_k = x_k^2$. Con esa elección sale la media de las razones individuales $\\frac{1}{n}\\sum y_k/x_k$, que es otro estimador —consistente, pero distinto— y desde luego no el de expansión.'
      },
      {
        tipo: 'opcion',
        modulo: 12,
        pregunta: 'La mediana estimada de <code>acres92</code> sale 196 701 con la definición $\\inf\\{t: \\hat{F}(t) \\ge 0{,}5\\}$ y 196 733 con el convenio por defecto de <code>svyquantile</code>. ¿Qué está pasando?',
        pista: '¿Cuánto vale $\\hat{F}$ exactamente en la unidad 150 de 300?',
        opciones: [
          { texto: 'Que $\\hat{F}$ vale exactamente 0,5 en una unidad: hay dos medianas.', correcta: true,
            retro: 'Correcto: ahí la mediana muestral no está definida de forma única, y los dos valores son legítimos según el convenio. Pasa siempre que $n\\,p$ es entero y los pesos son iguales. Son 32 acres sobre 197 000 —un 0,016 %—, pero conviene saber que el desacuerdo existe antes de pasar media tarde buscando un error que no está.' },
          { texto: 'Que <code>svyquantile</code> trae un error en su implementación.', correcta: false,
            retro: 'No: <code>svyquantile</code> ofrece doce convenios distintos en su argumento <code>qrule</code> —nueve de ellos los de Hyndman y Fan—, y con <code>qrule = "hf4"</code> devuelve exactamente 196 701. Es una elección documentada, no un fallo.' },
          { texto: 'Que la muestra tiene valores repetidos cerca de la mediana.', correcta: false,
            retro: 'El desacuerdo aparecería igual sin ningún valor repetido: lo que lo produce es que la función escalonada alcance el nivel 0,5 justo en un escalón.' },
          { texto: 'Que la mediana real es 191 486 y las dos estimaciones están mal.', correcta: false,
            retro: 'Las dos estimaciones son de la <em>muestra</em>, y las dos sobrestiman la mediana poblacional en torno a un 2,7 %. Eso es error de muestreo, que es otra cosa distinta del desacuerdo entre convenios.' }
        ]
      }
    ];
