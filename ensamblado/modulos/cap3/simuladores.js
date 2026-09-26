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
    // Un tope de eje legible. Sin esto, `max(x) * 1.05` deja el ultimo tick en
    // 17.9 o en 2 380 335,3, que es ruido: el eje no dice nada mas por llegar
    // exactamente hasta el dato mayor.
    function topeBonito(v) {
      if (!(v > 0)) return v;
      const mag = Math.pow(10, Math.floor(Math.log10(v)));
      return Math.ceil(v / (mag / 2)) * (mag / 2);
    }
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
        const xMax = topeBonito(Math.max(...xs) * 1.05);
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
        // |b0| como porcentaje del rango de y. OJO: esto es una regla de
        // bolsillo para mirar la nube, NO un criterio del capítulo. El criterio
        // es el contraste del módulo 6 sobre el intercepto. Antes esta cantidad
        // dictaba un «la razón es adecuada: sí/no» con un corte del 5 % que no
        // aparece en ningún módulo, y que además se mueve con un solo atípico
        // que ensanche el rango.
        const relIntercepto = Math.abs(b0) / (Math.max(...ys) - Math.min(...ys));
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'ȳ (la recta de la expansión) =', valor: fmtNum(my, 2) },
          { etiqueta: 'B̂ = ȳ/x̄ =', valor: fmtNum(B, 4) },
          { etiqueta: 'intercepto b₀ =', valor: fmtNum(b0, 3) },
          { etiqueta: 'pendiente b₁ =', valor: fmtNum(b1, 4) },
          { etiqueta: 'correlación r =', valor: fmtNum(r, 4) },
          { etiqueta: '|b₀| como % del rango de y:',
            valor: fmtNum(100 * relIntercepto, 1) + ' %  (regla de bolsillo; ' +
                   'el criterio formal es el contraste del módulo 6)' }
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
    // M3 · La frontera del umbral, con los cuatro pares reales (D4)
    //
    //      El plan proponia dos deslizadores para mover un punto a traves de
    //      la frontera. Eso se entiende sin tocarlo. Lo que no se ve en
    //      ninguna parte es donde caen los casos REALES del capitulo, que
    //      estan repartidos por la prosa en tres parrafos distintos -y uno de
    //      ellos, cherry, esta dentro de la region ganadora y aun asi la razon
    //      es el estimador equivocado-.
    // ---------------------------------------------------------------
    SIMULADORES['frontera'] = function (raiz) {
      const F = D3.frontera;
      const params = { cual: '0' };
      const xMax = topeBonito(Math.max(...F.map(f => f.razonCV)) * 1.15);
      const g = crearGraficoXY(raiz.querySelector('canvas'), [], {
        tituloX: 'CV(x) / CV(y)', tituloY: 'correlación ρ',
        xMin: 0, xMax: xMax, yMin: 0, yMax: 1.05
      });

      function pintar() {
        const i = Number(params.cual), f = F[i];
        // La frontera y, debajo de ella, la region en la que la razon le gana
        // a la expansion. El relleno va hacia abajo: `fill: 'start'`.
        const frontera = [{ x: 0, y: 0 }, { x: Math.min(xMax, 2.1), y: Math.min(xMax, 2.1) / 2 }];
        g.data.datasets = [
          { type: 'line', label: 'ρ = ½·CV(x)/CV(y) — la frontera', data: frontera,
            borderColor: COLORES_GRAFICO.secundario, borderWidth: 2, pointRadius: 0,
            fill: 'end', backgroundColor: 'rgba(255,102,0,0.10)' },
          { type: 'scatter', label: 'la razón le gana a la expansión',
            data: F.filter(q => q.cumple).map(q => ({ x: q.razonCV, y: q.rho })),
            backgroundColor: COLORES_GRAFICO.primario, pointRadius: 6 },
          { type: 'scatter', label: 'no llega al umbral',
            data: F.filter(q => !q.cumple).map(q => ({ x: q.razonCV, y: q.rho })),
            backgroundColor: '#DC2626', pointRadius: 6 },
          { type: 'scatter', label: '', data: [{ x: f.razonCV, y: f.rho }],
            backgroundColor: 'rgba(0,0,0,0)', borderColor: '#0e7490', borderWidth: 3,
            pointRadius: 11 }
        ];
        g.update('none');
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'par:', valor: f.nombre },
          { etiqueta: 'calculado sobre:', valor: f.fuente },
          { etiqueta: 'correlación ρ:', valor: fmtNum(f.rho, 4) },
          { etiqueta: 'CV(x) / CV(y):', valor: fmtNum(f.razonCV, 4) },
          { etiqueta: 'umbral = la mitad de eso:', valor: fmtNum(f.umbral, 4) },
          { etiqueta: '¿cumple la regla del módulo 3?',
            valor: f.cumple ? 'sí, ρ está por encima del umbral' : 'NO, ρ se queda por debajo' },
          { etiqueta: 'y lo que pasa de verdad:', valor: f.nota }
        ]);
      }

      crearSelector(raiz.querySelector('.simulador-controles'), {
        clave: 'cual', etiqueta: 'Par de variables',
        opciones: F.map((f, k) => ({ valor: String(k), texto: f.nombre + ' · ' + f.fuente }))
      }, params, pintar);
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
      const params = { i: '3' };
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
        const i = Number(params.i);            // crearSelector devuelve texto
        const f = SR[i];
        const cociente = Math.abs(f.sesgo) / f.eeMC;
        // Destacar DE VERDAD el tamaño elegido: antes el control se llamaba
        // «Tamaño destacado» y el gráfico no cambiaba nunca.
        g.data.datasets[0].backgroundColor = SR.map((_, k) =>
          k === i ? COLORES_GRAFICO.secundario : 'rgba(255,102,0,0.28)');
        g.data.datasets[1].backgroundColor = SR.map((_, k) =>
          k === i ? COLORES_GRAFICO.primario : 'rgba(1,40,32,0.25)');
        g.update('none');
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

      crearSelector(raiz.querySelector('.simulador-controles'), {
        clave: 'i', etiqueta: 'Tamaño de muestra',
        opciones: SR.map((f, k) => ({ valor: String(k), texto: 'n = ' + f.n }))
      }, params, pintar);
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
        // La etiqueta dice las que se DIBUJAN y de cuántas salen: el JSON trae
        // 600 de las 3 000 para no engordar la página, pero la intro del módulo
        // y los EE de la lectura hablan de las 3 000. Decía «600 muestras» al
        // lado de una prosa que decía 3 000.
        const series = [{ type: 'scatter',
          label: `${ex.length} de las ${fmtNum(L.replicas || 3000, 0)} muestras de tamaño ${L.n}`,
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
    // M5 · La distribución de los cocientes z_k = y_k/x_k
    //
    //      El modulo entero gira en torno a que la media de los z_k apunta a
    //      otro parametro que B, y no tenia ni una imagen. Con la distribucion
    //      delante se ve de donde sale la brecha: la cola derecha arrastra la
    //      media simple y no toca a la razon de totales.
    // ---------------------------------------------------------------
    SIMULADORES['cocientes'] = function (raiz) {
      const C = D3.cocientes, H = C.histo;
      const params = { escala: 'lineal' };
      // Eje x LINEAL, no de categorias. Con tramos de 0,1 los dos numeros que
      // el modulo compara -B = 0,9797 y la media de los z = 0,9530- caen en el
      // MISMO tramo, asi que sobre un eje de categorias las dos verticales se
      // superponen y la brecha, que es todo el contenido del grafico, no se ve.
      const alto = Math.max(...H.conteo);
      const g = crearGraficoXY(raiz.querySelector('canvas'), [], {
        tituloX: 'z = acres92 / acres87  (cociente de cada condado)',
        tituloY: 'condados', xMin: H.ejeDesde, xMax: H.ejeHasta
      });

      // El contorno del histograma: un escalon por tramo, relleno hasta el eje.
      const contorno = [{ x: H.ejeDesde, y: 0 }]
        .concat(H.desde.map((d, i) => ({ x: d, y: H.conteo[i] })))
        .concat([{ x: H.ejeHasta, y: 0 }]);
      const vertical = (v, label, color, dash) => ({
        type: 'line', label: label,
        data: [{ x: v, y: 0 }, { x: v, y: alto * 1.02 }],
        borderColor: color, borderWidth: 2.5, borderDash: dash,
        pointRadius: 0, fill: false
      });

      function pintar() {
        const log = params.escala === 'log';
        g.data.datasets = [
          { type: 'line', label: `${fmtNum(H.nDentro, 0)} condados`, data: contorno,
            stepped: 'after', borderColor: COLORES_GRAFICO.primario, borderWidth: 1.5,
            backgroundColor: 'rgba(1,40,32,0.18)', pointRadius: 0, fill: 'origin' },
          vertical(C.B, `B = ${fmtNum(C.B, 4)}  (razón de los totales)`,
                   COLORES_GRAFICO.secundario, []),
          vertical(C.Bmedia, `media de los z = ${fmtNum(C.Bmedia, 4)}`, '#DC2626', [6, 4])
        ];
        g.options.scales.y.type = log ? 'logarithmic' : 'linear';
        g.options.scales.y.min = log ? 1 : 0;
        // Redondeado hacia arriba a la decena: `alto * 1.08` deja un tick como
        // 218.169800000000031 en el extremo del eje.
        g.options.scales.y.max = log ? undefined : Math.ceil(alto * 1.08 / 10) * 10;
        g.update('none');
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'condados con cociente definido:', valor: fmtNum(C.nValidosPob, 0) },
          { etiqueta: 'tramo más poblado:',
            valor: `[${fmtNum(H.modaDesde, 2)}, ${fmtNum(H.modaHasta, 2)}) con ` +
                   fmtNum(alto, 0) + ' condados' },
          { etiqueta: 'mediana de los z:', valor: fmtNum(H.medianaZ, 4) },
          { etiqueta: 'B = razón de los totales:', valor: fmtNum(C.B, 4) },
          { etiqueta: 'media de los cocientes:', valor: fmtNum(C.Bmedia, 4) },
          { etiqueta: 'brecha entre las dos:', valor: fmtNum(Math.abs(C.brechaPct), 2) + ' %' },
          { etiqueta: 'fuera del eje:',
            valor: fmtNum(H.nIzquierda, 0) + ' por la izquierda y ' + fmtNum(H.nDerecha, 0) +
                   ' por la derecha (el mayor, ' + fmtNum(C.maxZ, 2) + ')' },
          { etiqueta: 'cocientes negativos (acres92 = −99):',
            valor: fmtNum(H.nNegativos, 0) + ', y mueven la media un ' +
                   fmtNum(Math.abs(C.efectoNegPct), 2) + ' %; a B no la tocan' }
        ]);
      }

      crearSelector(raiz.querySelector('.simulador-controles'), {
        clave: 'escala', etiqueta: 'Eje vertical',
        opciones: [{ valor: 'lineal', texto: 'lineal — se ve la moda' },
                   { valor: 'log', texto: 'logarítmico — se ve la cola' }]
      }, params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M3 · Los residuos contra x: la TERCERA condicion de la razon
    //
    //      El M3 afirma que la dispersion crece con x -«que es justo el modelo
    //      de varianza que la razon supone»- y en todo el capitulo no habia
    //      manera de verlo. La linealidad y el paso por el origen se ven en la
    //      nube; esta no se veia en ninguna parte.
    // ---------------------------------------------------------------
    SIMULADORES['residuos'] = function (raiz) {
      const params = { cual: 'agsrs', respecto: 'razon' };
      const g = crearGraficoXY(raiz.querySelector('canvas'), [], { tituloX: '', tituloY: '' });
      const media = v => v.reduce((a, b) => a + b, 0) / v.length;

      function pintar() {
        const cfg = NUBES[params.cual], d = cfg.d();
        const xs = d.x, ys = d.y;
        const mx = media(xs), my = media(ys);
        const B = d.B !== undefined ? d.B : my / mx;
        let b0 = d.b0, b1 = d.b1;
        if (b0 === undefined) {
          const sxy = xs.reduce((a, v, i) => a + (v - mx) * (ys[i] - my), 0);
          const sxx = xs.reduce((a, v) => a + (v - mx) * (v - mx), 0);
          b1 = sxy / sxx; b0 = my - b1 * mx;
        }
        const porRazon = params.respecto === 'razon';
        const e = ys.map((y, i) => porRazon ? y - B * xs[i] : y - (b0 + b1 * xs[i]));
        const xMax = topeBonito(Math.max(...xs) * 1.05);
        g.data.datasets = [
          { type: 'scatter', label: porRazon ? 'e = y − B̂·x' : 'e = y − (b₀ + b₁·x)',
            data: puntosXY(xs, e), backgroundColor: 'rgba(1,40,32,0.45)', pointRadius: 3 },
          { type: 'line', label: '', data: [{ x: 0, y: 0 }, { x: xMax, y: 0 }],
            borderColor: COLORES_GRAFICO.gris, borderWidth: 1.5, borderDash: [4, 4],
            pointRadius: 0, fill: false }
        ];
        g.options.scales.x.min = 0;
        g.options.scales.x.max = xMax;
        g.options.scales.x.title.text = cfg.ejeX;
        g.options.scales.x.title.display = true;
        g.options.scales.y.title.text = 'residuo';
        g.options.scales.y.title.display = true;
        g.update('none');

        // La lectura mide lo que el ojo cree ver: se parte la muestra por la
        // mediana de x y se comparan las dos dispersiones. Si el modelo de la
        // razon es el bueno, la mitad de x grande dispersa mucho mas.
        const orden = xs.map((v, i) => i).sort((a, b) => xs[a] - xs[b]);
        const mitad = Math.floor(orden.length / 2);
        const sd = idx => {
          const v = idx.map(i => e[i]);
          const m = media(v);
          return Math.sqrt(v.reduce((a, u) => a + (u - m) * (u - m), 0) / (v.length - 1));
        };
        const sdBaja = sd(orden.slice(0, mitad)), sdAlta = sd(orden.slice(mitad));
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'unidades:', valor: fmtNum(xs.length, 0) },
          { etiqueta: 'dispersión de los residuos en la mitad de x pequeña:', valor: fmtNum(sdBaja, 2) },
          { etiqueta: 'en la mitad de x grande:', valor: fmtNum(sdAlta, 2) },
          { etiqueta: 'cociente entre las dos:', valor: fmtNum(sdAlta / sdBaja, 2) + ' veces' },
          { etiqueta: '¿la dispersión crece con x?',
            valor: sdAlta / sdBaja > 1.5 ? 'sí, y bastante — el modelo de la razón encaja'
                 : (sdAlta / sdBaja > 1 ? 'algo, pero poco' : 'no: aquí es más o menos constante') }
        ]);
      }

      crearSelector(raiz.querySelector('.simulador-controles'), {
        clave: 'cual', etiqueta: 'Conjunto de datos',
        opciones: Object.keys(NUBES).map(k => ({ valor: k, texto: NUBES[k].etiqueta }))
      }, params, pintar);
      crearSelector(raiz.querySelector('.simulador-controles'), {
        clave: 'respecto', etiqueta: 'Residuos respecto de',
        opciones: [{ valor: 'razon', texto: 'la recta por el origen (razón)' },
                   { valor: 'regresion', texto: 'la recta con intercepto (regresión)' }]
      }, params, pintar);
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
      // era lo que hacía este simulador, y publicaba 196 733 en p = 0,5 —lo que
      // da `svyquantile` por el redondeo, no la definición— porque la curva iba
      // adelgazada y se saltaba la unidad 150. El IC también es el de la
      // definición: `math` con pesos 1, contrastado con el Woodruff a mano.
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
        pista: 'Escribe el estimador de razón del total. ¿Qué hay en él, además de lo que sale de la muestra?',
        opciones: [
          { texto: 'Que $x_k$ se observe en la muestra y que se conozca el total $t_x$.', correcta: true,
            retro: 'Las dos cosas: sin $x_k$ en la muestra no hay $\\hat{B}$, y sin $t_x$ no hay a qué multiplicarla. Ese doble requisito es lo que limita en la práctica qué variables se pueden usar como auxiliares.' },
          { texto: 'Que $x_k$ se observe en la muestra y que su correlación con $y$ sea alta.', correcta: false,
            retro: 'La correlación decide si la auxiliar <em>paga</em>, que es la pregunta del módulo 3, no si se puede usar. Sin $t_x$ no hay a qué aplicar $\\hat{B}$, por alta que sea la correlación.' },
          { texto: 'Que $x_k$ se observe en la muestra y que $x$ e $y$ tengan las mismas unidades.', correcta: false,
            retro: 'Eso importa para el estimador de <em>diferencia</em>, que resta $x$ de $y$. La razón funciona con unidades distintas: la superficie por granja, por ejemplo, que el módulo 5 estima con <code>svyratio</code>.' },
          { texto: 'Que $x_k$ se observe en la muestra y que se conozca el tamaño $N$.', correcta: false,
            retro: 'No hace falta para el estimador puntual: $\\hat{t}_r = \\hat{B}\\,t_x$ no contiene $N$ por ningún lado. $\\hat{B}$ sale de la muestra y $t_x$ del censo anterior, y con eso está hecho. $N$ sí aparece en el error estándar, dentro de la corrección por población finita.' }
        ]
      },
      {
        tipo: 'numerica',
        modulo: 2,
        pregunta: 'Con $\\bar{y} = 297\\,897{,}05$ y $\\bar{x} = 301\\,953{,}72$, ¿cuánto vale $\\hat{B}$? Da cuatro decimales.',
        pista: 'Es una división y nada más. El resultado tiene que salir cerca de 1, porque las dos variables miden lo mismo con cinco años de diferencia.',
        respuesta: 0.9866,
        tolerancia: 0.00015,
        retroAcierto: '$297\\,897{,}05 / 301\\,953{,}72 = 0{,}9866$: la superficie media de la muestra en 1992 es el 98,66 % de la de 1987, y el estimador de razón traslada esa proporción al total conocido de 1987.',
        retroFallo: 'Es $\\bar{y}/\\bar{x} = 0{,}9866$. Un error típico es dividir al revés y dar 1,0136: $\\hat{B}$ estima $t_y/t_x$, así que la $y$ va arriba.'
      },
      {
        tipo: 'numerica',
        modulo: 2,
        pregunta: 'Con $t_x = 963\\,464\\,412$, $\\bar{x} = 301\\,953{,}72$, $s_e = 31\\,657{,}22$, $n = 300$ y $N = 3\\,078$, calcula $\\mathrm{EE}(\\hat{t}_r) = \\dfrac{t_x}{\\bar{x}}\\sqrt{1-n/N}\\;\\dfrac{s_e}{\\sqrt{n}}$. Da el resultado en millones de acres, con dos decimales.',
        pista: 'Son cuatro factores y ninguna sutileza. El $s_e$ es la desviación de los <em>residuos</em>, no la de $y$: por eso sale pequeño.',
        respuesta: 5.54,
        tolerancia: 0.03,
        unidad: 'millones de acres',
        retroAcierto: '<strong>5,54 millones</strong>, la cifra insignia del capítulo, y conviene haberla calculado una vez a mano: el factor $t_x/\\bar{x}$ lleva el error estándar a escala de total, la raíz es la corrección por población finita, y todo el trabajo de la variable auxiliar está metido dentro de $s_e$.',
        retroFallo: 'Es $\\dfrac{963\\,464\\,412}{301\\,953{,}72}\\sqrt{1-300/3078}\\;\\dfrac{31\\,657{,}22}{\\sqrt{300}} = 5\\,540\\,376$, es decir 5,54 millones. El fallo más común es usar la desviación de $y$ (344 552, la del módulo 3) en vez de la de los residuos: con ella sale 60,3 millones, del orden del error estándar de la expansión.'
      },
      {
        tipo: 'grafico',
        modulo: 3,
        alto: 230,
        descripcionGrafico: 'Volumen frente a diámetro en los 31 cerezos, con la recta de la razón, por el origen, y la recta libre de la regresión',
        pregunta: 'En estos 31 cerezos, ¿conviene el estimador de razón o el de regresión, y qué lo decide?',
        pista: '¿Qué tiene que cumplir la nube para que la recta por el origen la describa? Compáralo con lo que enseña el gráfico.',
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
          { texto: 'La regresión, por el intercepto: −36,9 es más de medio rango de volúmenes.', correcta: true,
            retro: 'Y se ve en la nube: la recta por el origen se aleja de ella en los dos extremos. El gráfico enseña la magnitud; el contraste del módulo 6 lo confirma sin discusión, y es lo que pide el ejercicio 2. El volumen crece con el cuadrado del diámetro, y por eso la recta que ajusta bien en el rango observado no se prolonga hasta el origen.' },
          { texto: 'La regresión, por el sesgo: con 31 árboles la razón sale demasiado sesgada.', correcta: false,
            retro: 'El sesgo no es lo que descarta la razón aquí: la cota del módulo 4, $\\mathrm{CV}(\\hat{\\bar x})$, sale pequeña con estos diámetros. La descarta que la recta no pase por el origen, y eso no lo arregla ningún tamaño de muestra.' },
          { texto: 'La razón, por la correlación: 0,9671 entre diámetro y volumen es altísima.', correcta: false,
            retro: 'La correlación alta ($R^2 = 0{,}935$) dice que hay una relación fuerte, no que pase por el origen. Son dos cosas distintas, y confundirlas es el error más común del capítulo.' },
          { texto: 'La razón, por el cruce: en el centro del rango las dos rectas casi coinciden.', correcta: false,
            retro: 'Se cruzan dentro del rango, pero la razón aplica la misma pendiente, $\\hat{B} = 2{,}2773$, a todos los árboles: sobrestima el volumen de los delgados y subestima el de los gruesos. Coincidir en un punto no es describir la nube.' }
        ]
      },
      {
        tipo: 'opcion',
        modulo: 3,
        pregunta: 'La regla del módulo 3 dice que conviene la razón si $\\rho > \\tfrac12\\,\\mathrm{CV}(x)/\\mathrm{CV}(y)$. En <code>agsrs</code> sale $0{,}9958$ contra un umbral de $0{,}4937$. ¿Qué permite concluir eso?',
        pista: 'La desigualdad salió de comparar dos varianzas. ¿De qué dos estimadores?',
        opciones: [
          { texto: 'Que la razón tiene menos varianza que la expansión.', correcta: true,
            retro: 'Y es el matiz que más se pierde. La desigualdad sale de $V(\\hat{\\bar y}_r) \\le V(\\bar y)$, con la varianza aproximada de la razón: su rival es el estimador que ignora $x$. La regresión no entró en la cuenta.' },
          { texto: 'Que la razón tiene menos varianza que la regresión.', correcta: false,
            retro: 'La regresión no entró en la cuenta, y el módulo 7 demuestra lo contrario: con la pendiente poblacional, la regresión nunca tiene más varianza que la razón. Esta desigualdad compara la razón con la expansión, y con nadie más.' },
          { texto: 'Que el sesgo de $\\hat{B}$ es despreciable en esta muestra.', correcta: false,
            retro: 'Eso lo dice otra cota, la del módulo 4, que se calcula con $\\mathrm{CV}(\\hat{\\bar x})$ y no con la correlación. Son dos criterios distintos, y ninguno implica al otro.' },
          { texto: 'Que la relación entre $x$ e $y$ es lineal.', correcta: false,
            retro: 'Tampoco: una correlación alta convive con curvatura —la de los cerezos es 0,9671, y su volumen crece con el cuadrado del diámetro—, y el umbral solo compara dos varianzas.' }
        ]
      },
      {
        tipo: 'grafico',
        modulo: 3,
        alto: 230,
        descripcionGrafico: 'Residuos de la recta libre frente al conteo por fotografía en las 25 parcelas de árboles muertos, con la línea del cero',
        pregunta: 'La nube son los residuos de la recta libre en las 25 parcelas de <code>deadtrees</code>, frente al conteo por fotografía. ¿Se cumple la condición de la dispersión que pide la razón en el módulo 3, y por qué?',
        pista: 'La condición no es sobre dónde está el centro de la nube, sino sobre su anchura. Compara la de la izquierda con la de la derecha.',
        dibujar: canvas => {
          const d = DATOS_CAP3.deadtrees;
          const res = d.x.map((v, i) => ({ x: v, y: d.y[i] - (d.b0 + d.b1 * v) }));
          const xMin = Math.min(...d.x) - 1, xMax = Math.max(...d.x) + 1;
          return crearGraficoXY(canvas, [
            { type: 'scatter', label: '25 parcelas', data: res,
              backgroundColor: 'rgba(1,40,32,0.5)', pointRadius: 4 },
            { type: 'line', label: 'cero', data: [{ x: xMin, y: 0 }, { x: xMax, y: 0 }],
              borderColor: '#FF6600', borderWidth: 2, pointRadius: 0, fill: false }
          ], { tituloX: 'árboles muertos en la foto', tituloY: 'residuo (campo − recta)', xMin: xMin, xMax: xMax });
        },
        opciones: [
          { texto: 'No: la nube tiene más o menos la misma anchura en todo el rango.', correcta: true,
            retro: 'Las parcelas con pocos árboles en la foto se desvían de la recta tanto como las que tienen muchos: la dispersión no crece con $x$. Esa condición de la razón no se cumple, y el módulo 3 cuenta la dispersión constante entre los casos que piden la regresión.' },
          { texto: 'No: los residuos no se reparten alrededor de cero, y la razón lo exige.', correcta: false,
            retro: 'Sí se reparten: los residuos de una recta con intercepto suman cero por construcción. La condición que enseña el gráfico es otra, cómo cambia la anchura de la nube con $x$.' },
          { texto: 'Sí: la nube se abre hacia la derecha, como supone la razón.', correcta: false,
            retro: 'Mira la anchura a cada lado: las parcelas con pocos árboles en la foto se desvían tanto como las que tienen muchos. Abrirse hacia la derecha es lo que pasa con las superficies de <code>agsrs</code>, donde la dispersión crece con $x$ (módulo 6).' },
          { texto: 'Sí: la correlación entre foto y campo es positiva, y con eso basta.', correcta: false,
            retro: 'La correlación es otra de las tres condiciones, y aquí es floja: 0,6242. Además no basta sola, porque las tres tienen que cumplirse a la vez; la de la dispersión es la que enseña este gráfico.' }
        ]
      },
      {
        tipo: 'opcion',
        modulo: 4,
        pregunta: 'Con $n = 300$ el sesgo de $\\hat{t}_r$ vale $-38\\,963$ acres y su error estándar 7,11 millones. ¿Qué justifica <em>aceptar</em> un estimador sesgado?',
        pista: 'Un sesgo no se juzga solo: ¿con qué otra cantidad hay que compararlo, y dónde se suman las dos?',
        opciones: [
          { texto: 'Que dentro del ECM su cuadrado pesa una fracción despreciable.', correcta: true,
            retro: '$\\text{ECM} = \\text{Sesgo}^2 + V$, y aquí el sesgo es <strong>182 veces</strong> menor que el error estándar: su cuadrado aporta tres cienmilésimas del ECM. Se cambia insesgadez por un error estándar diez veces menor, y el precio está medido.' },
          { texto: 'Que el sesgo medido salió negativo en los nueve tamaños.', correcta: false,
            retro: 'El signo es un hecho de esta población —el estimador subestima aquí—, no un argumento. Un sesgo pequeño se acepta por su tamaño relativo, nunca por su dirección.' },
          { texto: 'Que el sesgo es menor que el error de Monte Carlo de la simulación.', correcta: false,
            retro: 'Al revés: con 200 000 réplicas la incertidumbre de Monte Carlo bajó a 15 900 y el sesgo <em>por fin</em> se distinguió de cero. Que se pueda medir no dice si importa; eso lo dice su tamaño frente al error estándar.' },
          { texto: 'Que el sesgo se anula si el muestreo es aleatorio simple.', correcta: false,
            retro: 'Bajo m.a.s. no se anula: viene de que $\\hat{B}$ es un cociente de dos variables aleatorias, y la esperanza de un cociente no es el cociente de las esperanzas. Lo que lo achica son los tres factores de la cota del módulo 4, no la forma de sortear.' }
        ]
      },
      {
        tipo: 'numerica',
        modulo: 4,
        pregunta: 'En <code>agsrs</code>, $s_x = 344\\,829{,}6$, $\\bar{x} = 301\\,953{,}7$, $n = 300$ y $N = 3\\,078$. Calcula $\\widehat{\\mathrm{CV}}(\\hat{\\bar x}) = \\sqrt{(1-f)/n}\\;s_x/\\bar{x}$, la cota del sesgo relativo. Da cuatro decimales.',
        pista: 'Con $f = n/N = 300/3\\,078$. Es una sola cuenta, y el resultado tiene que quedar muy por debajo de 0,1.',
        respuesta: 0.0626,
        tolerancia: 0.0004,
        retroAcierto: '$\\widehat{\\mathrm{CV}}(\\hat{\\bar x}) = 0{,}0626$. La regla de Kish pide que esté por debajo de 0,1–0,2 para dar el sesgo por despreciable, y aquí sobra margen. Lo notable es que esta cifra sale de <strong>una sola muestra</strong>: la simulación de 200 000 réplicas confirma lo mismo, pero en la vida real no se tiene.',
        retroFallo: 'Es $\\sqrt{(1 - 300/3078)/300} \\times 344\\,829{,}6/301\\,953{,}7 = 0{,}0626$. Los dos fallos típicos: olvidar la corrección por población finita, u olvidar dividir por $\\bar{x}$ —la cota es un <em>coeficiente de variación</em>, no una desviación típica—.'
      },
      {
        tipo: 'opcion',
        modulo: 5,
        pregunta: 'Un estudiante estima $B$ con la media de los cocientes, $\\frac1n\\sum y_k/x_k$, en vez de $\\bar{y}/\\bar{x}$. Con muestra suficiente, ¿qué le pasa?',
        pista: 'Pregúntate a qué número converge cada una de las dos fórmulas cuando $n \\to N$.',
        opciones: [
          { texto: 'No converge a $B$: converge a la media poblacional de los cocientes.', correcta: true,
            retro: 'No es un estimador peor de lo mismo: es un estimador de <em>otra cosa</em>. En <code>agpop</code> esa media de cocientes vale $0{,}9530$ frente a $B = 0{,}9797$, un desvío del 2,73 %. Por eso aumentar $n$ no lo arregla: lo hace converger, con más precisión, al número equivocado.' },
          { texto: 'Converge a $B$, pero con bastante más varianza que $\\bar{y}/\\bar{x}$.', correcta: false,
            retro: 'Si solo fuera varianza, más muestra lo resolvería. El problema es que el límite es otro: $0{,}9530$ en vez de $0{,}9797$. Ningún tamaño de muestra corrige un objetivo equivocado.' },
          { texto: 'Da lo mismo: la media de los cocientes es $\\bar{y}/\\bar{x}$ reordenada.', correcta: false,
            retro: 'Coinciden solo en casos especiales —si todos los $x_k$ son iguales, o si todos los cocientes $y_k/x_k$ lo son—, no en general. Tómense dos unidades, una con $x = 1$ e $y = 2$ y otra con $x = 6$ e $y = 6$: la razón de medias vale $8/7 = 1{,}14$ y la media de cocientes $\\tfrac12(2 + 1) = 1{,}50$. Los mismos datos, dos números.' },
          { texto: 'Falla solo si la muestra trae algún valor atípico en los cocientes.', correcta: false,
            retro: 'Los atípicos lo empeoran, pero el problema es anterior: apunta a otro parámetro aunque no haya ninguno. Y hay un fallo más brusco: donde $x_k = 0$ el cociente no existe. En <code>agpop</code> hay 2 condados con cero acres en 1987 y 23 más con el código de faltante $-99$: para promediar cocientes hay que dejar fuera los 25, y con ellos se acaba describiendo otra población.' }
        ]
      },
      {
        tipo: 'numerica',
        modulo: 6,
        pregunta: 'Con $\\bar{y} = 297\\,897{,}05$, $\\hat b_1 = 0{,}995004$, $\\bar{x} = 301\\,953{,}72$ y $\\bar{x}_U = 313\\,016{,}38$, calcula la media por regresión $\\hat{\\bar y}_{\\text{reg}} = \\bar{y} + \\hat b_1(\\bar{x}_U - \\bar{x})$. Da el resultado en miles de acres, con dos decimales.',
        pista: 'La muestra se quedó corta en $x$, así que $\\bar{x}_U - \\bar{x}$ es positivo y la corrección <em>sube</em> la media.',
        respuesta: 308.9,
        tolerancia: 0.015,
        unidad: 'miles de acres',
        retroAcierto: '$297\\,897{,}05 + 0{,}995004 \\times 11\\,062{,}66 = 308\\,904$ acres, es decir 308,90 miles. Multiplicado por $N = 3\\,078$ da unos 950,8 millones: el total por regresión del módulo 6.',
        retroFallo: 'Es $297\\,897{,}05 + 0{,}995004 \\times (313\\,016{,}38 - 301\\,953{,}72) = 308\\,904$ acres, 308,90 miles. Dos fallos típicos: restar al revés dentro del paréntesis —la corrección sube, no baja, porque la muestra se quedó corta en $x$— y multiplicar por $N$, que da el total y no la media.'
      },
      {
        tipo: 'opcion',
        modulo: 6,
        pregunta: 'Para decidir entre razón y regresión se contrasta que el intercepto de la recta libre sea cero. En <code>agsrs</code> sale $p = 0{,}2942$ con <code>lm()</code>. ¿Qué conviene hacer antes de darlo por bueno?',
        pista: 'Piensa en qué supone <code>lm()</code> sobre cómo se obtuvieron las observaciones.',
        opciones: [
          { texto: 'Repetir el contraste con <code>svyglm()</code>, que usa el diseño.', correcta: true,
            retro: 'Es el aviso que el propio criterio no trae. Aquí ya se nota: el error estándar de diseño del intercepto sale 2 654 frente a los 2 425 de <code>lm()</code>, porque la dispersión crece con $x$, aunque la conclusión no cambie (0,2942 frente a 0,3378). Con estratos o conglomerados la diferencia puede ser mucho mayor, y volver significativo lo que no lo era.' },
          { texto: 'Repetir el contraste con <code>lm()</code> y pesos $N/n$, que usa los pesos.', correcta: false,
            retro: 'Con pesos iguales, como los del m.a.s., <code>lm()</code> da el mismo p-valor: los pesos no son el problema. Lo que no cambia es cómo calcula el error estándar, suponiendo observaciones independientes y de varianza constante. Aquí ya falla lo segundo, y en casi cualquier otro diseño del curso falla también lo primero.' },
          { texto: 'Comprobar antes que el $R^2$ del ajuste sea suficientemente alto.', correcta: false,
            retro: 'El $R^2$ no interviene en esta decisión. En los cerezos vale 0,9353 y aun así la razón está descartada: son preguntas distintas.' },
          { texto: 'Rechazar la razón, porque $p > 0{,}05$ no demuestra nada.', correcta: false,
            retro: 'Al revés. $p > 0{,}05$ significa que no se puede rechazar que la recta pase por el origen, y eso deja en pie la razón. Lo que la descarta es un p-valor pequeño, como el $7{,}6\\times10^{-12}$ de los cerezos.' }
        ]
      },
      {
        tipo: 'opcion',
        modulo: 6,
        pregunta: 'En los cerezos, cambiar la auxiliar por $\\text{diámetro}^2$ baja el intercepto de $-36{,}9435$ a $-3{,}3551$ —del 55,30 % al 5,02 % del rango de los volúmenes— y sube el $R^2$ a 0,9594. El contraste sobre el intercepto da $p = 0{,}0248$. ¿Queda justificado el estimador de razón con esa auxiliar?',
        pista: 'El módulo 6 da un criterio para decidir si la recta pasa por el origen. ¿Qué dice aquí ese criterio?',
        opciones: [
          { texto: 'No: el contraste sigue rechazando que pase por el origen.', correcta: true,
            retro: 'El cambio mejora mucho el problema, pero no lo cierra: con $p = 0{,}0248$ el intercepto se distingue de cero. La magnitud, un 5 % del rango, es la lectura informal; la que decide es el contraste. Para este bosque la salida sigue siendo la regresión.' },
          { texto: 'No: la relación sigue siendo curva, y la razón exige una recta.', correcta: false,
            retro: 'Con $\\text{diámetro}^2$ la nube ya es casi recta: el $R^2$ sube a 0,9594. Lo que falla es otra cosa: esa recta no pasa por el origen, y el contraste lo dice.' },
          { texto: 'Sí: un intercepto del 5 % del rango ya es despreciable.', correcta: false,
            retro: 'Ésa es la lectura informal, la de la magnitud, y aquí se queda corta: el contraste, con $p = 0{,}0248$, dice que ese 5 % no es ruido. La magnitud basta cuando la distancia al origen es enorme, como el 55,30 % con el diámetro; en los casos dudosos decide el contraste.' },
          { texto: 'Sí: con $p < 0{,}05$ no se puede rechazar que pase por el origen.', correcta: false,
            retro: 'Es al revés: un p-valor pequeño es el que <em>rechaza</em>. Con $p = 0{,}0248$, por debajo de 0,05, se rechaza que la recta pase por el origen; en <code>agsrs</code>, con $p = 0{,}2942$, no se rechazaba.' }
        ]
      },
      {
        tipo: 'numerica',
        modulo: 7,
        pregunta: 'El total auxiliar es $t_x = 963\\,464\\,412$ y la media de las diferencias $y_k - x_k$ en la muestra es $-4\\,056{,}677$. Con $N = 3\\,078$, ¿cuánto vale el estimador de diferencia? Da el resultado en millones, con un decimal.',
        pista: '$\\hat{t}_d = t_x + N\\,(\\bar{y} - \\bar{x})$, y la media de las diferencias ya es $\\bar{y} - \\bar{x}$.',
        respuesta: 951.0,
        tolerancia: 0.1,
        unidad: 'millones de acres',
        retroAcierto: '$963\\,464\\,412 + 3\\,078 \\times (-4\\,056{,}677) \\approx 951{,}0$ millones: 950 977 961 con la media sin redondear, la del bloque R6. La corrección es de −12,5 millones sobre el total de 1987.',
        retroFallo: 'Es $963\\,464\\,412 + 3\\,078 \\times (-4\\,056{,}677) \\approx 951{,}0$ millones. El error frecuente es olvidar multiplicar por $N$: la media de diferencias hay que llevarla a escala poblacional.'
      },
      {
        tipo: 'opcion',
        modulo: 7,
        pregunta: 'El teorema del módulo 7 dice $V(\\hat{\\bar y}_r) \\ge V(\\hat{\\bar y}_{\\text{reg}})$, con igualdad si y sólo si $B = b_1$. ¿Qué significa esa condición de igualdad?',
        pista: 'Escribe la recta de regresión $y = b_0 + b_1 x$ y pregúntate qué vale $b_0$ cuando $b_1$ coincide con $B = \\bar{y}_U/\\bar{x}_U$.',
        opciones: [
          { texto: 'Que la recta de regresión libre pasa por el origen.', correcta: true,
            retro: 'Es el mismo criterio del módulo 6, dicho en varianzas, y eso une los tres módulos: $b_1 = B$ equivale a $b_0 = 0$. Cuando la recta pasa por el origen, la razón no pierde nada frente a la regresión; cuando no, la regresión gana justo lo que mide el cuadrado $(B S_x - \\rho S_y)^2$.' },
          { texto: 'Que la correlación entre $x$ e $y$ es muy alta.', correcta: false,
            retro: 'La correlación no decide la igualdad. Con $\\rho = 1$, incluso, se anula la varianza de la regresión, pero la de la razón no, salvo que además la recta pase por el origen: el hueco es $\\tfrac{1-f}{n}(B S_x - \\rho S_y)^2$, y con $\\rho = 1$ solo es cero si $B = b_1$. La correlación perfecta no es ni necesaria ni suficiente.' },
          { texto: 'Que la muestra es lo bastante grande para que la aproximación valga.', correcta: false,
            retro: 'El teorema es sobre varianzas poblacionales aproximadas, y la condición de igualdad no depende de $n$. El tamaño influye en si la <em>tabla estimada</em> deja ver el orden, no en si el orden existe.' },
          { texto: 'Que la razón y la diferencia dan el mismo resultado.', correcta: false,
            retro: 'No: $B = b_1$ empata la razón con la regresión. Que la diferencia empate con la regresión exige otra cosa, $b_1 = 1$.' }
        ]
      },
      {
        tipo: 'opcion',
        modulo: 7,
        pregunta: 'En <code>agpop</code>, para <code>largef92 ~ largef87</code> salen $B = 1{,}0240$ y $b_1 = 0{,}9714$. Las dos variables son la misma cosa medida dos veces. Entre la razón y la diferencia, ¿cuál gana y qué lo decide?',
        pista: 'El cuadrado perfecto $(b\\,S_x - \\rho\\,S_y)^2$ premia al $b$ más próximo a un número concreto. ¿A cuál?',
        opciones: [
          { texto: 'La diferencia: $b_1$ queda más cerca de 1 que de $B$.', correcta: true,
            retro: '$\\lvert b_1 - 1\\rvert = 0{,}0286$ contra $\\lvert b_1 - B\\rvert = 0{,}0526$. La diferencia gana un <strong>6,82 %</strong>, y la regla acierta en las cuatro parejas de <code>agpop</code>.' },
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
        pista: 'Piensa en cómo se sortearon las tres muestras, no en qué se hizo después con ellas.',
        opciones: [
          { texto: 'Que el sorteo de cada estrato es independiente de los demás.', correcta: true,
            retro: 'Es lo que el módulo toma prestado del capítulo 4, junto con el m.a.s. dentro de cada región. Como los tres sorteos son independientes, las covarianzas entre estratos son cero y $\\hat V(\\hat t) = \\sum_h N_h^2 \\hat V(\\hat{\\bar y}_h)$. Eso es lo que hace legítimo mezclar tres estimadores distintos en una sola cuenta.' },
          { texto: 'Que los tres estimadores elegidos resultan ser insesgados.', correcta: false,
            retro: 'Ni siquiera es cierto: la razón y la regresión son sesgadas, y el módulo lo avisa. Y aunque lo fueran, el insesgamiento no dice nada sobre covarianzas.' },
          { texto: 'Que dentro de cada región el sorteo fue un m.a.s.', correcta: false,
            retro: 'Es la otra cosa que el módulo toma prestada, y autoriza las fórmulas de varianza <em>dentro</em> de cada región. Los términos cruzados son otra cuestión: desaparecen porque los tres sorteos son independientes, se haga como se haga cada uno.' },
          { texto: 'Que en cada región se eligió el estimador de menor varianza.', correcta: false,
            retro: 'Eso es lo que hace pequeña a la suma, no lo que permite sumarla. Aunque se hubiera elegido el peor estimador en cada estrato, las varianzas seguirían sumándose igual.' }
        ]
      },
      {
        tipo: 'opcion',
        modulo: 8,
        pregunta: 'En la región II de los tomates la razón pierde contra la expansión: $r = 0{,}12$ frente a un umbral de 0,2079. ¿Por qué se descarta también la regresión?',
        pista: 'El umbral del módulo 3 solo habla de la razón. ¿Qué cifras de la región II dicen algo de la regresión?',
        opciones: [
          { texto: 'Porque su varianza estimada supera a la del m.a.s.: la pendiente cuesta más de lo que aporta.', correcta: true,
            retro: 'La tabla lo dice: 717,62 frente a 667,43. Con $R^2 = 0{,}0144$ la pendiente no se distingue de cero, y estimarla con 13 plantaciones gasta varianza sin reducir nada. El teorema del módulo 7 no lo impide: habla de varianzas aproximadas, con la pendiente poblacional.' },
          { texto: 'Porque el umbral del módulo 3 la descarta también a ella, al compararla con la expansión.', correcta: false,
            retro: 'El umbral solo compara la razón con la expansión; de la regresión no dice nada. El propio módulo 3 avisa de no extender esa conclusión a los otros estimadores.' },
          { texto: 'Porque su $R^2$, 0,0144, no llega al umbral del módulo 3, que es 0,2079.', correcta: false,
            retro: 'El umbral es para $\\rho$, no para $R^2$, y compara la razón con la expansión. Lo que descarta la regresión es su propia varianza estimada.' },
          { texto: 'Porque, si la razón pierde con la expansión, el teorema del módulo 7 dice que la regresión también.', correcta: false,
            retro: 'El teorema dice lo contrario: con la pendiente poblacional, la regresión no pierde ni contra la razón ni contra la expansión. Lo que la hunde aquí es tener que estimar esa pendiente con una relación que no existe.' }
        ]
      },
      {
        tipo: 'opcion',
        modulo: 9,
        pregunta: 'La media de un dominio es $\\hat{\\bar y}_d = \\sum_{k\\in s} y_k\\delta_k \\big/ \\sum_{k\\in s}\\delta_k$. ¿Por qué el capítulo la trata como una razón y no como una media corriente?',
        pista: 'En una media del capítulo 2 el denominador es $n$, y lo fija el diseño. ¿Quién fija el de ésta?',
        opciones: [
          { texto: 'Porque su denominador, $n_d$, cambia de una muestra a otra.', correcta: true,
            retro: '$n_d = \\sum_{k\\in s}\\delta_k$ no lo fija el diseño: depende de cuántas unidades del dominio cayeron en la muestra. Un cociente con denominador aleatorio es una razón, y su varianza sale de linealizar, como la de $\\hat{B}$. Lohr añade el matiz práctico: bajo m.a.s. y con $n_d$ grande, la fórmula de siempre aplicada a las $n_d$ unidades da casi lo mismo; con estratos o conglomerados, no.' },
          { texto: 'Porque bajo m.a.s. la media de un dominio es un estimador sesgado.', correcta: false,
            retro: 'Bajo m.a.s. no lo es: dado $n_d \\ge 1$, las unidades del dominio son un m.a.s. de $U_d$, y su media es insesgada. Ser una razón pesa en la varianza, no en el sesgo.' },
          { texto: 'Porque $N_d$, el tamaño del dominio en la población, no se conoce.', correcta: false,
            retro: '$N_d$ no aparece en la fórmula de la media: el cociente solo usa lo que cayó en la muestra.' },
          { texto: 'Porque las unidades del dominio no son independientes entre sí.', correcta: false,
            retro: 'Tampoco lo son en un m.a.s. sin reposición, y eso lo recoge la corrección por población finita: no es lo que convierte la media en una razón.' }
        ]
      },
      {
        tipo: 'opcion',
        modulo: 9,
        pregunta: 'Para estimar el <strong>total</strong> de un dominio hay dos fórmulas: escalar la media del dominio, o expandir $u_k = y_k\\delta_k$, que vale cero fuera de él. ¿Qué decide cuál se usa, y qué cuesta la de $u_k$?',
        pista: 'Escribe las dos fórmulas del total: ¿qué dato necesita una y la otra no?',
        opciones: [
          { texto: 'Si se conoce $N_d$; sin él, el error estándar relativo sube.', correcta: true,
            retro: 'Con $N_d$ conocido, $\\hat t_{yd} = N_d\\,\\hat{\\bar y}_d$; sin él hay que pasar por $u_k = y_k\\delta_k$ y estimar $N\\bar u$, que arrastra la incertidumbre sobre el tamaño del dominio. En el dominio de los condados con 600 granjas o más, el error estándar relativo pasa del <strong>6,81 %</strong> al <strong>9,29 %</strong>.' },
          { texto: 'Si se conoce $N_d$; sin él, la de $u_k$ sale sesgada.', correcta: false,
            retro: 'Lo de $N_d$ es cierto, pero $N\\bar u$ es exactamente insesgado: es la expansión de $u$. Lo que cuesta es varianza, no sesgo.' },
          { texto: 'Si $n_d$ es grande; con $n_d$ pequeño, el error estándar relativo sube.', correcta: false,
            retro: 'El tamaño de $n_d$ afecta a la precisión de las dos fórmulas por igual. Lo que las separa es si $N_d$ —el tamaño <em>poblacional</em> del dominio— se conoce, no cuántas unidades cayeron en la muestra.' },
          { texto: 'Si $n_d$ es grande; con $n_d$ pequeño, la de $u_k$ sale sesgada.', correcta: false,
            retro: 'Ni lo uno ni lo otro: lo que separa las fórmulas es si se conoce $N_d$, y la de $u_k$ es la expansión de una variable más, exactamente insesgada. Lo que cuesta es varianza.' }
        ]
      },
      {
        tipo: 'opcion',
        modulo: 10,
        pregunta: 'El enfoque asistido por modelos usa un modelo para construir el estimador. ¿Qué pasa si el modelo está mal especificado?',
        pista: '¿De qué depende la insesgadez del GREG: del modelo o del diseño?',
        opciones: [
          { texto: 'Sigue aproximadamente insesgado por diseño; lo que pierde es eficiencia.', correcta: true,
            retro: 'El modelo se usa para <em>construir</em> el estimador, pero la inferencia se apoya en el diseño: un modelo malo cuesta precisión, no validez. «Aproximadamente» porque el GREG, como la razón y la regresión, lleva un sesgo de orden $1/n$ (módulo 4).' },
          { texto: 'Sigue aproximadamente insesgado, pero su error estándar ya no avisa de la pérdida.', correcta: false,
            retro: 'Sí avisa: se calcula con los residuos del modelo, y con un modelo malo los residuos crecen, y el error estándar con ellos.' },
          { texto: 'Sigue aproximadamente insesgado, pero su intervalo de confianza deja de valer.', correcta: false,
            retro: 'El intervalo se apoya en el diseño, no en el modelo, y sigue valiendo: sale más ancho, que es la forma honesta de cobrar el mal ajuste.' },
          { texto: 'Se vuelve sesgado por diseño, tanto más cuanto peor ajuste el modelo.', correcta: false,
            retro: 'Eso le pasaría al enfoque basado en el modelo, donde la inferencia depende de que el modelo sea correcto. En el asistido, la insesgadez aproximada viene del diseño, y un modelo malo no la toca.' }
        ]
      },
      {
        tipo: 'multiple',
        modulo: 11,
        pregunta: 'El GREG es $\\hat{t}_{\\text{GREG}} = \\hat{t}_\\pi + \\beta\\,(t_x - \\hat{t}_{x,\\pi})$. La pendiente $\\beta$ puede fijarse de antemano o salir del modelo $y_k = \\beta x_k + \\varepsilon_k$, con $V(\\varepsilon_k) = \\sigma^2 v_k$. Marca <strong>las afirmaciones correctas</strong>.',
        pista: 'Con $\\beta$ fijada, sustituye y mira qué queda. Con el modelo, la pendiente sale de mínimos cuadrados ponderados con peso $1/v_k$: sustituye cada $v_k$ y simplifica.',
        opciones: [
          { texto: 'Con $\\beta = 0$ queda el estimador de expansión.', correcta: true,
            retro: 'La corrección se anula y la auxiliar no se usa: es el extremo izquierdo de la curva del simulador. Es insesgado, y exactamente, igual que el de diferencia; los que llevan un sesgo pequeño son el de razón y el de regresión.' },
          { texto: 'Con $v_k = x_k$ la pendiente es $\\hat{B}$, y queda el de razón.', correcta: true,
            retro: 'Con peso $1/x_k$ la pendiente de mínimos cuadrados ponderados es $\\sum y_k / \\sum x_k = \\hat{B}$, y el GREG se reduce a $\\hat{B}\\,t_x$. En el bloque del módulo sale 0,98656524, que es $\\hat{B}$ cifra por cifra.' },
          { texto: 'Con $\\beta$ fijada en 1 queda el estimador de diferencia.', correcta: true,
            retro: 'La diferencia no estima nada: fija $\\beta = 1$ y traslada íntegro a $y$ el desvío observado en $x$.' },
          { texto: 'Con $v_k = 1$ también queda el de razón.', correcta: false,
            retro: 'Con $v_k = 1$ la pendiente es $\\sum x_k y_k / \\sum x_k^2$, que en <code>agsrs</code> vale 0,991335 frente a los 0,986565 de $\\hat{B}$: sale otro GREG, que no es ninguno de los cuatro del capítulo.' },
          { texto: 'La regresión sale de la razón cambiando solo $v_k$.', correcta: false,
            retro: 'Hacen falta las dos palancas del módulo 10: la regresión cambia la recta —le añade un intercepto— y además supone dispersión constante. Cambiar solo $v_k$ deja la recta por el origen: con $v_k = 1$ sale el GREG homocedástico, no la regresión.' }
        ],
        retroAcierto: 'Las tres verdaderas son tres puntos de la misma familia: $\\beta = 0$, $\\beta = \\hat{B}$ —que es lo que da $v_k = x_k$— y $\\beta = 1$. La regresión es el cuarto, y pide cambiar además la recta.',
        retroFallo: 'Las verdaderas son la de $\\beta = 0$ (expansión), la de $v_k = x_k$ (razón) y la de $\\beta = 1$ (diferencia). De las otras dos, una lleva la pendiente a un sitio que no es ninguno de los cuatro estimadores, y la otra pide un solo cambio donde hacen falta dos.'
      },
      {
        tipo: 'opcion',
        modulo: 12,
        pregunta: 'La mediana estimada de <code>acres92</code> sale 196 701 con la definición $\\inf\\{t: \\hat{F}(t) \\ge 0{,}5\\}$ y 196 733 con el convenio por defecto de <code>svyquantile</code>. ¿Qué está pasando?',
        pista: '¿Cuánto vale $\\hat{F}$ exactamente en la unidad 150 de 300?',
        opciones: [
          { texto: 'Que $\\hat{F}$ vale justo 0,5 en la unidad 150, y <code>svyquantile</code> la redondea por debajo.', correcta: true,
            retro: 'El convenio por defecto, <code>qrule = "math"</code>, es la misma definición $\\inf$: la diferencia está en la decimoquinta cifra decimal de $\\hat{F}$, y como <code>svyquantile</code> compara sin tolerancia, salta a la unidad 151. Con los pesos iguales a 1 no hay redondeo y da 196 701. Pasa cuando $\\hat{F}$ cae en 0,5 justo sobre un dato, que con pesos iguales es cuando $n\\,p$ es entero. Son 32 acres sobre 197 000 —un 0,016 %—, pero conviene saberlo antes de pasar media tarde buscando un error que no está.' },
          { texto: 'Que el convenio por defecto de <code>svyquantile</code> es otra definición de cuantil, distinta de la de arriba.', correcta: false,
            retro: 'No: el de por defecto, <code>qrule = "math"</code>, es justamente la definición $\\inf$, y con los pesos iguales a 1 da 196 701. Con <code>qrule = "hf4"</code> también sale 196 701, pero por casualidad: <code>hf4</code> interpola entre dos valores consecutivos de la muestra, y con otros datos da valores que la definición no da nunca.' },
          { texto: 'Que la muestra tiene valores repetidos cerca de la mediana.', correcta: false,
            retro: 'El desacuerdo aparecería igual sin ningún valor repetido: lo que lo produce es que la función escalonada alcance el nivel 0,5 justo en un escalón, y que el redondeo la deje un pelo por debajo.' },
          { texto: 'Que la mediana real es 191 486 y las dos estimaciones están mal.', correcta: false,
            retro: 'Las dos estimaciones son de la <em>muestra</em>, y las dos sobrestiman la mediana poblacional en torno a un 2,7 %. Eso es error de muestreo, y no tiene nada que ver con este desacuerdo, que es de redondeo.' }
        ]
      }
    ];
