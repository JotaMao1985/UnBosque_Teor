    // ================================================================
    // Simuladores del capítulo 7
    //
    // Todos leen de DATOS_CAP7, que produce precalculo/genera_cap7.R.
    // Lo pesado (los diseños de survey sobre NHANES y SYC, las 2 000
    // réplicas de cobertura, las 7 configuraciones de recorte y las 9
    // iteraciones del IPFP) viene resuelto. En vivo solo se computan
    // fórmulas cerradas: el deff de Kish, la cobertura teórica bajo
    // normalidad y la selección de la iteración a mostrar.
    // ================================================================
    const D7 = DATOS_CAP7;

    // Formato español: espacio fino como separador de miles, coma decimal.
    function fmtNum(x, d = 2) {
      if (!isFinite(x)) return '—';
      const s = Math.abs(x).toFixed(d);
      const partes = s.split('.');
      const entero = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      return (x < 0 ? '−' : '') + entero + (partes[1] ? ',' + partes[1] : '');
    }

    function fmtPct(x, d = 1) { return fmtNum(100 * x, d) + ' %'; }

    // Función de distribución normal estándar (Abramowitz-Stegun 26.2.17),
    // suficiente para la curva de cobertura teórica del módulo 8.
    function pnorm(z) {
      const t = 1 / (1 + 0.2316419 * Math.abs(z));
      const d = 0.3989422804014327 * Math.exp(-z * z / 2);
      const p = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 +
                t * (-1.821255978 + t * 1.330274429))));
      return z > 0 ? 1 - p : p;
    }

    // ---------------------------------------------------------------
    // M1 · Las dos encuestas, lado a lado
    // ---------------------------------------------------------------
    SIMULADORES['anatomia'] = function (raiz) {
      const params = { encuesta: 0 };
      const lienzo = raiz.querySelector('canvas');
      const E = [D7.encuestas.nhanes, D7.encuestas.syc];
      const NOMBRES = ['NHANES', 'SYC'];

      const g = crearGraficoBarras(lienzo, [], [], {
        etiqueta: 'PSU en el estrato', color: COLORES_GRAFICO.primario, min: 0, max: 10
      });

      function pintar() {
        const e = E[params.encuesta];
        g.data.labels = e.psuPorEstrato.map((_, i) => 'E' + (i + 1));
        g.data.datasets[0].data = e.psuPorEstrato;
        g.data.datasets[0].label = 'PSU por estrato · ' + NOMBRES[params.encuesta];
        g.options.scales.y.max = Math.max(...e.psuPorEstrato) * 1.15;
        g.update('none');

        const minP = Math.min(...e.psuPorEstrato), maxP = Math.max(...e.psuPorEstrato);
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'encuesta:', valor: NOMBRES[params.encuesta] },
          { etiqueta: 'observaciones analizadas:', valor: fmtNum(e.analizadas, 0) },
          { etiqueta: 'estratos × PSU:', valor: e.estratos + ' × ' + e.psu + ' PSU en total' },
          { etiqueta: 'PSU por estrato:', valor: minP === maxP ? 'todos ' + minP : 'de ' + minP + ' a ' + maxP },
          { etiqueta: 'grados de libertad (PSU − estratos):', valor: fmtNum(e.gl, 0) },
          { etiqueta: 'BRR aplicable:', valor: (minP === 2 && maxP === 2) ? 'sí (exige 2 por estrato)' : 'no: hace falta 2 por estrato' }
        ]);
      }

      crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'encuesta', etiqueta: 'Encuesta (0 NHANES · 1 SYC)', min: 0, max: 1, paso: 1 }
      ], params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M2 · La distribución de los pesos
    // ---------------------------------------------------------------
    SIMULADORES['pesos'] = function (raiz) {
      const params = { encuesta: 0 };
      const lienzo = raiz.querySelector('canvas');
      const P = [D7.pesos.nhanes, D7.pesos.syc];
      const NOMBRES = ['NHANES', 'SYC'];

      const g = crearGraficoXY(lienzo, [], { tituloX: 'peso final', tituloY: 'observaciones' });

      function pintar() {
        const p = P[params.encuesta];
        const alto = Math.max(...p.hist.conteo) * 1.05;
        g.data.datasets = [
          serieHistograma(p.hist, 'pesos · ' + NOMBRES[params.encuesta], COLORES_GRAFICO.primario),
          serieVertical(p.media, alto, 'peso medio', COLORES_GRAFICO.gris)
        ];
        g.options.scales.x.min = undefined; g.options.scales.x.max = undefined;
        g.update('none');

        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'encuesta:', valor: NOMBRES[params.encuesta] },
          { etiqueta: 'peso mínimo / máximo:', valor: fmtNum(p.min, 0) + ' / ' + fmtNum(p.max, 0) },
          { etiqueta: 'razón máx/mín:', valor: fmtNum(p.razonMaxMin, 1) + ' a 1' },
          { etiqueta: 'suma de los pesos:', valor: fmtNum(p.suma, 0) +
            (params.encuesta === 0 ? ' (población adulta de EE.UU.)' : ' (jóvenes en custodia)') },
          { etiqueta: 'deff de Kish (solo pesos):', valor: fmtNum(p.kish, 4) },
          { etiqueta: 'lo que cuesta esa desigualdad:', valor: fmtPct(p.kish - 1, 0) + ' de varianza extra' }
        ]);
      }

      crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'encuesta', etiqueta: 'Encuesta (0 NHANES · 1 SYC)', min: 0, max: 1, paso: 1 }
      ], params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M3 · El deff, ingrediente a ingrediente
    // ---------------------------------------------------------------
    SIMULADORES['deff-acumulado'] = function (raiz) {
      const D = D7.deff.descomposicion;
      const params = { paso: 3 };
      const lienzo = raiz.querySelector('canvas');

      const g = crearGraficoBarras(lienzo, D.etiquetas, D.varianzas, {
        etiqueta: 'V(media del IMC)', color: COLORES_GRAFICO.primario,
        min: 0, max: Math.max(...D.varianzas) * 1.15
      });

      function pintar() {
        g.data.datasets[0].data = D.varianzas.map((v, i) => i <= params.paso ? v : null);
        g.data.datasets[0].backgroundColor = D.etiquetas.map((_, i) =>
          i === params.paso ? '#FF6600' : (i < params.paso ? '#012820' : '#e5e7eb'));
        g.update('none');

        const deff = D.deffs[params.paso];
        const anterior = params.paso > 0 ? D.deffs[params.paso - 1] : 1;
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'declarado hasta:', valor: D.etiquetas[params.paso] },
          { etiqueta: 'varianza:', valor: fmtNum(D.varianzas[params.paso], 5) },
          { etiqueta: 'deff acumulado:', valor: fmtNum(deff, 3) },
          { etiqueta: 'lo que aportó este paso:', valor: params.paso === 0 ? '—' :
            (deff > anterior ? '×' + fmtNum(deff / anterior, 2) + ' (sube)'
                             : '×' + fmtNum(deff / anterior, 3) + ' (BAJA la varianza)') },
          { etiqueta: 'tamaño efectivo:', valor: fmtNum(D.n / deff, 0) + ' de ' + fmtNum(D.n, 0) },
          { etiqueta: 'ee frente al ingenuo:', valor: fmtNum(Math.sqrt(deff), 2) + '× más ancho' }
        ]);
      }

      crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'paso', etiqueta: 'Componentes declarados (0 MAS … 3 completo)', min: 0, max: 3, paso: 1 }
      ], params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M4 · La variable linealizada
    // ---------------------------------------------------------------
    SIMULADORES['linealizacion'] = function (raiz) {
      const L = D7.linealizacion;
      const params = { zoom: 1 };
      const lienzo = raiz.querySelector('canvas');

      const g = crearGraficoXY(lienzo, [], {
        tituloX: 'û_k × 10⁶', tituloY: 'observaciones'
      });

      function pintar() {
        const alto = Math.max(...L.histU.conteo) * 1.05;
        g.data.datasets = [
          serieHistograma(L.histU, 'û_k × 10⁶', COLORES_GRAFICO.primario),
          serieVertical(0, alto, 'cero', COLORES_GRAFICO.gris)
        ];
        const rango = Math.max(Math.abs(L.uMin), Math.abs(L.uMax)) * 1e6 / params.zoom;
        g.options.scales.x.min = -rango; g.options.scales.x.max = rango;
        g.update('none');

        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'razón peso/altura:', valor: fmtNum(L.R, 6) + ' (ee ' + fmtNum(L.ee, 6) + ')' },
          { etiqueta: 'ee por linealización a mano:', valor: fmtNum(L.eeLineal, 6) + ' — idéntico' },
          { etiqueta: 'û_k mínimo / máximo (×10⁶):', valor: fmtNum(L.uMin * 1e6, 3) + ' / ' + fmtNum(L.uMax * 1e6, 3) },
          { etiqueta: 'media de û_k (×10⁶):', valor: fmtNum(L.uMedia * 1e6, 6) + ' ≈ 0 por construcción' },
          { etiqueta: 'zoom:', valor: '×' + fmtNum(params.zoom, 1) },
          { etiqueta: 'total estimado del denominador:', valor: fmtNum(L.Xhat, 0) }
        ]);
      }

      crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'zoom', etiqueta: 'Zoom sobre el centro', min: 1, max: 8, paso: 0.5 }
      ], params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M5 · Las 30 réplicas del jackknife
    // ---------------------------------------------------------------
    SIMULADORES['jackknife'] = function (raiz) {
      const R = D7.replicacion;
      const params = { replica: 1 };
      const lienzo = raiz.querySelector('canvas');
      const etiquetas = R.jkEstratos.map((h, i) => 'E' + h + '/' + R.jkPsu[i]);

      const g = crearGraficoBarras(lienzo, etiquetas, R.jkReplicas, {
        etiqueta: 'IMC medio sin esa PSU', color: COLORES_GRAFICO.primario,
        min: Math.min(...R.jkReplicas) * 0.998, max: Math.max(...R.jkReplicas) * 1.002
      });

      function pintar() {
        const i = params.replica - 1;
        g.data.datasets[0].backgroundColor = etiquetas.map((_, k) => k === i ? '#FF6600' : '#012820');
        g.update('none');

        const desv = R.jkReplicas[i] - R.theta;
        // aporte de esta réplica: (n_h-1)/n_h * (theta_i - theta)^2, con n_h = 2
        const aporte = 0.5 * desv * desv;
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'réplica:', valor: 'estrato ' + R.jkEstratos[i] + ', PSU ' + R.jkPsu[i] },
          { etiqueta: 'IMC medio sin esa PSU:', valor: fmtNum(R.jkReplicas[i], 5) },
          { etiqueta: 'estimación completa:', valor: fmtNum(R.theta, 5) },
          { etiqueta: 'desviación:', valor: fmtNum(desv, 5) },
          { etiqueta: 'aporte a la varianza:', valor: fmtNum(aporte, 6) + ' (' +
            fmtPct(aporte / (R.ee[1] * R.ee[1]), 1) + ' del total)' },
          { etiqueta: 'ee jackknife:', valor: fmtNum(R.ee[1], 6) + ' · linealización ' + fmtNum(R.ee[0], 6) }
        ]);
      }

      crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'replica', etiqueta: 'Réplica (PSU eliminada)', min: 1, max: R.jkReplicas.length, paso: 1 }
      ], params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M6 · El raking, iteración a iteración
    // ---------------------------------------------------------------
    SIMULADORES['ipfp'] = function (raiz) {
      const C = D7.calibracion;
      const params = { iter: 0 };
      const lienzo = raiz.querySelector('canvas');
      const etiquetas = [];
      C.filas.forEach(f => C.columnas.forEach(c => etiquetas.push(f + ' ' + c)));

      const g = crearGraficoBarras(lienzo, etiquetas, [], {
        etiqueta: 'millones de personas', color: COLORES_GRAFICO.primario, min: 0, max: 50
      });

      function pintar() {
        const it = C.iteraciones[params.iter];
        const plano = [];
        it.tabla.forEach(fila => fila.forEach(v => plano.push(v / 1e6)));
        g.data.datasets[0].data = plano;
        g.options.scales.y.max = Math.max(...plano) * 1.2;
        g.update('none');

        const sumaFilas = it.tabla.map(f => f.reduce((a, b) => a + b, 0));
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'iteración:', valor: params.iter + ' de ' + (C.iteraciones.length - 1) },
          { etiqueta: 'error máximo frente a los márgenes:', valor: it.err.toExponential(2) },
          { etiqueta: 'hombres (objetivo ' + fmtNum(C.margSexo[0] / 1e6, 2) + ' M):',
            valor: fmtNum(sumaFilas[0] / 1e6, 3) + ' M' },
          { etiqueta: 'mujeres (objetivo ' + fmtNum(C.margSexo[1] / 1e6, 2) + ' M):',
            valor: fmtNum(sumaFilas[1] / 1e6, 3) + ' M' },
          { etiqueta: 'IMC medio tras calibrar:', valor: fmtNum(C.imcRaked, 4) + ' (antes ' + fmtNum(C.imcAntes, 4) + ')' },
          { etiqueta: 'ee tras calibrar:', valor: fmtNum(C.eeRaked, 4) + ' (antes ' + fmtNum(C.eeAntes, 4) + ')' }
        ]);
      }

      crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'iter', etiqueta: 'Iteración del IPFP', min: 0, max: C.iteraciones.length - 1, paso: 1 }
      ], params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M7 · El precio de ignorar el diseño, en las dos encuestas
    // ---------------------------------------------------------------
    SIMULADORES['comparador'] = function (raiz) {
      const params = { encuesta: 0 };
      const lienzo = raiz.querySelector('canvas');
      const E = [
        { nombre: 'NHANES · IMC medio', d: D7.deff.nhanes, gl: D7.encuestas.nhanes.gl, unidad: 'kg/m²' },
        { nombre: 'SYC · edad media', d: D7.deff.syc, gl: D7.encuestas.syc.gl, unidad: 'años' }
      ];

      const g = crearGraficoBarras(lienzo, ['IC ingenuo (±)', 'IC del diseño (±)'], [0, 0], {
        etiqueta: 'semiamplitud del IC 95 %', color: COLORES_GRAFICO.primario, min: 0, max: 1
      });

      // valor t aproximado: normal + corrección de Cornish-Fisher de 1er orden
      function tAprox(gl) {
        const z = 1.959964;
        return z + (z * z * z + z) / (4 * gl);
      }

      function pintar() {
        const e = E[params.encuesta];
        const t = tAprox(e.gl);
        const semiIng = 1.959964 * e.d.eeIngenuo;
        const semiDis = t * e.d.ee;
        g.data.datasets[0].data = [semiIng, semiDis];
        g.data.datasets[0].backgroundColor = ['#DC2626', '#012820'];
        g.options.scales.y.max = semiDis * 1.25;
        g.update('none');

        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'estimando:', valor: e.nombre },
          { etiqueta: 'estimación:', valor: fmtNum(e.d.media, 4) + ' ' + e.unidad },
          { etiqueta: 'IC ingenuo (z = 1,96):', valor: '±' + fmtNum(semiIng, 4) },
          { etiqueta: 'IC del diseño (t con ' + e.gl + ' gl ≈ ' + fmtNum(t, 3) + '):', valor: '±' + fmtNum(semiDis, 4) },
          { etiqueta: 'el honesto es:', valor: fmtNum(semiDis / semiIng, 2) + '× más ancho' },
          { etiqueta: 'deff · tamaño efectivo:', valor: fmtNum(e.d.deffSurvey, 2) + ' · ' +
            fmtNum(e.d.nEfectivo, 0) + ' observaciones equivalentes' }
        ]);
      }

      crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'encuesta', etiqueta: 'Encuesta (0 NHANES · 1 SYC)', min: 0, max: 1, paso: 1 }
      ], params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M8 · Cobertura contra ICC
    // ---------------------------------------------------------------
    SIMULADORES['cobertura'] = function (raiz) {
      const C = D7.cobertura;
      const params = { rho: C.rho, m: C.Mi };
      const lienzo = raiz.querySelector('canvas');

      // Cobertura teórica del IC nominal 95 % que ignora el deff:
      // el intervalo real tiene semiamplitud 1.96*ee_ing = 1.96*ee_real/sqrt(deff)
      function cobTeorica(deff) {
        const z = 1.959964 / Math.sqrt(deff);
        return 2 * pnorm(z) - 1;
      }

      const malla = [];
      for (let r = 0; r <= 0.6; r += 0.01) malla.push(Math.round(r * 100) / 100);

      const g = crearGraficoXY(lienzo, [], {
        tituloX: 'correlación intraclase ρ', tituloY: 'cobertura real', xMin: 0, xMax: 0.6
      });

      function pintar() {
        const curva = malla.map(r => ({ x: r, y: cobTeorica(1 + (params.m - 1) * r) }));
        const deffAct = 1 + (params.m - 1) * params.rho;
        g.data.datasets = [
          { type: 'line', label: 'cobertura teórica (m = ' + params.m + ')', data: curva,
            borderColor: COLORES_GRAFICO.primario, borderWidth: 2, pointRadius: 0, fill: false, tension: 0.2 },
          { type: 'line', label: 'nominal 95 %', data: [{ x: 0, y: 0.95 }, { x: 0.6, y: 0.95 }],
            borderColor: COLORES_GRAFICO.gris, borderDash: [6, 4], borderWidth: 1.5, pointRadius: 0, fill: false },
          { type: 'scatter', label: 'configuración simulada',
            data: [{ x: params.rho, y: cobTeorica(deffAct) }],
            backgroundColor: '#FF6600', pointRadius: 6 }
        ];
        g.options.scales.y.min = 0; g.options.scales.y.max = 1;
        g.update('none');

        const esSimulada = Math.abs(params.rho - C.rho) < 0.005 && params.m === C.Mi;
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'ρ · tamaño del conglomerado:', valor: fmtNum(params.rho, 2) + ' · ' + params.m },
          { etiqueta: 'deff = 1 + (m−1)ρ:', valor: fmtNum(deffAct, 2) },
          { etiqueta: 'cobertura teórica del IC ingenuo:', valor: fmtPct(cobTeorica(deffAct), 1) },
          { etiqueta: 'simulación real (' + fmtNum(C.replicas, 0) + ' réplicas):',
            valor: esSimulada ? fmtPct(C.cobIngenuo, 1) + ' ingenuo · ' + fmtPct(C.cobDiseno, 1) + ' diseño'
                              : 'solo medida en ρ = 0,15 y m = 40' },
          { etiqueta: 'ancho medio simulado:', valor: 'ingenuo ' + fmtNum(C.anchoIngenuo, 4) +
            ' · diseño ' + fmtNum(C.anchoDiseno, 4) },
          { etiqueta: 'falsos positivos al 5 % nominal:', valor: fmtPct(1 - cobTeorica(deffAct), 0) }
        ]);
      }

      crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'rho', etiqueta: 'Correlación intraclase ρ', min: 0, max: 0.6, paso: 0.01 },
        { clave: 'm', etiqueta: 'Tamaño del conglomerado m', min: 2, max: 80, paso: 1 }
      ], params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M8 · Recortar pesos: qué se gana y qué se paga
    // ---------------------------------------------------------------
    SIMULADORES['recorte'] = function (raiz) {
      const R = D7.recorte;
      const params = { nivel: 0 };
      const lienzo = raiz.querySelector('canvas');

      const g = crearGraficoBarras(lienzo,
        ['error estándar', 'desplazamiento de la media (×10)'], [0, 0], {
          etiqueta: 'efecto del recorte', color: COLORES_GRAFICO.primario, min: 0, max: 0.6
        });

      function pintar() {
        const r = R[params.nivel];
        g.data.datasets[0].data = [r.ee, Math.abs(r.sesgoAparente) * 10];
        g.data.datasets[0].backgroundColor = ['#012820', '#DC2626'];
        g.update('none');

        const base = R[0];
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'recorte:', valor: r.q === 1 ? 'ninguno' : 'al percentil ' + fmtNum(r.q * 100, 1) },
          { etiqueta: 'tope del peso:', valor: fmtNum(r.tope, 0) + ' · afecta a ' + fmtNum(r.afectados, 0) + ' personas' },
          { etiqueta: 'deff de Kish:', valor: fmtNum(r.kish, 3) + ' (sin recortar ' + fmtNum(base.kish, 3) + ')' },
          { etiqueta: 'error estándar:', valor: fmtNum(r.ee, 4) + ' (sin recortar ' + fmtNum(base.ee, 4) + ')' },
          { etiqueta: 'la media se desplaza:', valor: fmtNum(r.sesgoAparente, 4) },
          { etiqueta: 'veredicto:', valor: r.ee <= base.ee && Math.abs(r.sesgoAparente) < 0.01
              ? 'ligera mejora, sesgo despreciable'
              : (r.q === 1 ? 'punto de partida' : 'el ee NO baja y el sesgo crece: no compensa') }
        ]);
      }

      crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'nivel', etiqueta: 'Nivel de recorte (0 ninguno … 6 agresivo)', min: 0, max: R.length - 1, paso: 1 }
      ], params, pintar);
      pintar();
      return [g];
    };

    // ================================================================
    // Tabla-ranking del módulo 5: los cuatro caminos a la varianza
    // ================================================================
    TABLAS_RANKING['varianzas'] = function () {
      const R = D7.replicacion;
      return {
        descripcion: 'Cuatro maneras de estimar el error estándar del IMC medio de NHANES. Los ' +
          'cuatro apuntan a la misma varianza y coinciden en la tercera cifra; se diferencian en ' +
          'cuánto cuestan y en qué estadísticos admiten. Pulsa cualquier cabecera para reordenar.',
        columnas: [
          { clave: 'metodo', titulo: 'Método', tipo: 'texto' },
          { clave: 'ee', titulo: 'Error estándar', decimales: 6 },
          { clave: 'replicas', titulo: 'Réplicas', decimales: 0, mejor: 'menor' },
          { clave: 'requisito', titulo: 'Requisito del diseño', tipo: 'texto' },
          { clave: 'noLineales', titulo: '¿Sirve para la mediana?', tipo: 'texto' }
        ],
        filas: [
          { metodo: 'Linealización de Taylor', ee: R.ee[0], replicas: 0,
            requisito: 'ninguno', noLineales: 'con dificultad (pide la densidad)' },
          { metodo: 'Jackknife (JKn)', ee: R.ee[1], replicas: R.replicas[1],
            requisito: '≥ 2 PSU por estrato', noLineales: 'sí, sin cambiar nada' },
          { metodo: 'BRR', ee: R.ee[2], replicas: R.replicas[2],
            requisito: 'exactamente 2 PSU por estrato', noLineales: 'sí' },
          { metodo: 'Bootstrap (Rao–Wu)', ee: R.ee[3], replicas: R.replicas[3],
            requisito: 'ninguno', noLineales: 'sí, y para lo más irregular' }
        ],
        inicial: 'replicas',
        destacada: 'Jackknife (JKn)',
        pie: 'La linealización no necesita réplicas y por eso es la opción por defecto de survey. ' +
          'BRR usa menos réplicas que el jackknife (16 contra 30) pero exige exactamente 2 PSU por ' +
          'estrato, condición que NHANES cumple y SYC no. El bootstrap cuesta 500 réplicas y es el ' +
          'único cómodo con estadísticos muy irregulares. La coincidencia entre los cuatro (todos ' +
          'entre 0,2532 y 0,2585) es la comprobación de que el diseño está bien declarado: si ' +
          'divergieran mucho, habría que sospechar del svydesign, no de los métodos.'
      };
    };

    // ================================================================
    // Tabla-ranking del módulo 7: las dos encuestas comparadas
    // ================================================================
    TABLAS_RANKING['encuestas'] = function () {
      const N = D7.encuestas.nhanes, S = D7.encuestas.syc;
      const dn = D7.deff.nhanes, ds = D7.deff.syc;
      return {
        descripcion: 'Todo lo que el capítulo ha calculado de cada encuesta. Las dos son ' +
          'estratos × conglomerados × pesos; sus estructuras son opuestas y eso cambia qué se ' +
          'puede hacer con cada una. Pulsa cualquier cabecera para reordenar.',
        columnas: [
          { clave: 'encuesta', titulo: 'Encuesta', tipo: 'texto' },
          { clave: 'n', titulo: 'Observaciones', decimales: 0 },
          { clave: 'gl', titulo: 'Grados de libertad', decimales: 0, mejor: 'mayor' },
          { clave: 'deff', titulo: 'deff', decimales: 2, mejor: 'menor' },
          { clave: 'nef', titulo: 'Tamaño efectivo', decimales: 0, mejor: 'mayor' },
          { clave: 'brr', titulo: '¿Admite BRR?', tipo: 'texto' }
        ],
        filas: [
          { encuesta: 'NHANES (IMC de adultos)', n: N.analizadas, gl: N.gl,
            deff: dn.deffSurvey, nef: dn.nEfectivo, brr: 'sí: 2 PSU por estrato' },
          { encuesta: 'SYC (edad)', n: S.analizadas, gl: S.gl,
            deff: ds.deffSurvey, nef: ds.nEfectivo, brr: 'no: de 7 a 154 PSU' }
        ],
        inicial: 'nef',
        destacada: 'NHANES (IMC de adultos)',
        pie: 'NHANES tiene el doble de observaciones y un deff menor, así que gana en tamaño ' +
          'efectivo (759 contra 221). Pero SYC tiene 845 grados de libertad frente a 15, lo que ' +
          'hace sus intervalos proporcionalmente más cortos y permite estadísticos más finos. No ' +
          'hay una "mejor": hay dos estructuras, y cada una condiciona qué análisis es defendible.'
      };
    };

    // ================================================================
    // Diagrama de diseño del módulo 1: la anatomía de NHANES
    // ================================================================
    DIAGRAMAS_DISENO['nhanes'] = {
      titulo: 'NHANES: cuatro capas de diseño apiladas',
      intro: 'Pulsa cada capa. Es el diseño más complejo del curso — y aun así, cada pieza ya ' +
        'apareció en un capítulo anterior.',
      nota: 'Compara con el diagrama de dos etapas del capítulo 5 y el PPT del 6: aquí están los ' +
        'dos juntos, más estratos y más ajustes de peso.',
      etapas: [
        {
          etiqueta: 'Estratos',
          unidad: '15 estratos geográficos',
          icono: 'fa-map',
          resumen: 'El territorio se parte en estratos que agrupan condados parecidos. Es el ' +
            'capítulo 4: reduce varianza y garantiza cobertura de todas las zonas.',
          cifras: [{ k: 'H', v: '15 estratos' }],
          ejemplo: 'ningún estrato puede quedarse sin representación, pase lo que pase con el azar.'
        },
        {
          etiqueta: 'Etapa 1: condados',
          unidad: '2 UPM por estrato, PPT',
          icono: 'fa-city',
          resumen: 'Dentro de cada estrato se sortean DOS condados con probabilidad proporcional ' +
            'al tamaño (capítulo 6). Dos es el mínimo para estimar varianza — y justo lo que el ' +
            'método BRR necesita.',
          pi: '\\pi_{1i} \\propto \\text{población del condado}',
          cifras: [{ k: 'PSU', v: '30 en total' }, { k: 'gl', v: '30 − 15 = 15' }],
          ejemplo: 'con 2 por estrato, cada réplica del jackknife elimina la mitad de un estrato.'
        },
        {
          etiqueta: 'Etapas 2–3: segmentos y hogares',
          unidad: 'submuestreo dentro del condado',
          icono: 'fa-house',
          resumen: 'Dentro del condado se sortean segmentos censales y dentro de ellos, hogares ' +
            '(capítulo 5). Después se seleccionan personas dentro del hogar, sobremuestreando ' +
            'grupos de interés — de ahí las π tan desiguales.',
          pi: '\\pi_k = \\pi_{1i}\\pi_{2|i}\\pi_{3|ij}\\cdots',
          peso: '\\prod (1/\\pi)',
          cifras: [{ k: 'analizados', v: '5 406 adultos' }],
          ejemplo: 'la sobremuestra de ciertos grupos es deliberada: mejora sus estimaciones y desiguala los pesos.'
        },
        {
          etiqueta: 'Pesos y examen',
          unidad: 'ajuste y calibración',
          icono: 'fa-weight-hanging',
          resumen: 'El peso de diseño se ajusta por no respuesta (quien no acudió al examen tiene ' +
            'wtmec2yr = 0) y se calibra a los totales del censo. El resultado es wtmec2yr.',
          peso: 'w_k = \\frac{1}{\\pi_k}\\cdot\\frac{1}{\\hat\\phi_k}\\cdot g_k',
          cifras: [{ k: 'w', v: '5 157 a 242 387' }, { k: 'Σw', v: '231,8 millones' }],
          ejemplo: 'una sola persona puede representar a 242 387 estadounidenses.'
        }
      ],
      acumulado: {
        rotulo: 'El diseño completo',
        formula: '\\text{deff} = 7{,}12 \\qquad n_{ef} = \\frac{5406}{7{,}12} = 759 ' +
          '\\qquad \\text{gl} = 15',
        texto: 'Cuatro capas producen tres números que gobiernan todo el análisis: el deff dice ' +
          'cuánta muestra se pierde, el tamaño efectivo la traduce, y los grados de libertad ' +
          'fijan el multiplicador del intervalo. Ninguno es n − 1.'
      }
    };

    // ================================================================
    // Glosario de notación del capítulo 7
    // ================================================================
    GLOSARIOS['complejas'] = {
      titulo: 'Notación: este material ↔ Lohr ↔ Gutiérrez ↔ survey',
      nota: 'Este capítulo mezcla el vocabulario de los cinco anteriores con el del software. La ' +
        'columna de R no es decorativa: es donde se traducen los conceptos a código que corre.',
      filas: [
        { concepto: 'Estrato', aqui: 'h', lohr: 'h', gutierrez: 'U_h', r: 'strata = ~sdmvstra' },
        { concepto: 'Conglomerado (UPM)', aqui: 'i', lohr: 'psu', gutierrez: 'U_i', r: 'id = ~sdmvpsu' },
        { concepto: 'Peso final', aqui: 'w_k', lohr: 'w_i', gutierrez: 'w_k', r: 'weights = ~wtmec2yr' },
        { concepto: 'Peso de diseño', aqui: '1/\\pi_k', lohr: '1/\\pi_i', gutierrez: 'd_k', r: '1/prob' },
        { concepto: 'Grados de libertad', aqui: '\\text{PSU} - H', lohr: 'n - H', gutierrez: 'n_I - H', r: 'degf(dis)' },
        { concepto: 'Efecto de diseño', aqui: '\\text{deff}', lohr: '\\text{deff}', gutierrez: 'DEFF', r: 'svymean(deff = TRUE)' },
        { concepto: 'deff solo por pesos', aqui: '\\text{deff}_{K}', lohr: '\\text{deff}_{Kish}', gutierrez: '1 + cv^2(w)', r: '1 + var(w)/mean(w)^2' },
        { concepto: 'Tamaño efectivo', aqui: 'n_{ef}', lohr: 'n/\\text{deff}', gutierrez: 'n_{eff}', r: 'nrow(d)/deff(m)' },
        { concepto: 'Variable linealizada', aqui: 'u_k', lohr: 'q_i', gutierrez: 'u_k', r: '(y - R*x)/Xhat' },
        { concepto: 'Réplica jackknife', aqui: '\\hat\\theta_{(hi)}', lohr: '\\hat\\theta_{(j)}', gutierrez: '\\hat\\theta_{(k)}', r: 'as.svrepdesign(type="JKn")' },
        { concepto: 'Post-estratificación', aqui: 'g_k', lohr: 'w_i^{post}', gutierrez: 'g_k', r: 'postStratify()' },
        { concepto: 'Raking / IPFP', aqui: '\\text{IPFP}', lohr: 'raking', gutierrez: '\\text{calibración}', r: 'rake()' }
      ]
    };

    // ================================================================
    // Autoevaluación del capítulo 7
    // ================================================================
    AUTOEVALUACIONES['cap7'] = [
      {
        tipo: 'numerica',
        modulo: 1,
        pregunta: 'NHANES tiene 30 conglomerados repartidos en 15 estratos. ¿Cuántos grados de libertad tiene el diseño? Entero.',
        pista: 'En una encuesta compleja, gl = PSU − estratos, no $n - 1$.',
        respuesta: 15,
        tolerancia: 0.5,
        retroAcierto: '$30 - 15 = 15$. Con 5 406 personas analizadas, el multiplicador del intervalo del 95 % es $t_{15} = 2{,}131$ y no 1,960: un 9 % más ancho antes de considerar nada más.',
        retroFallo: 'Son PSU menos estratos: $30 - 15 = 15$. Si respondiste 5 405, aplicaste $n - 1$ — el error que comete cualquier software que no sepa que los datos vienen de una encuesta compleja.'
      },
      {
        tipo: 'opcion',
        modulo: 2,
        pregunta: 'Los pesos de NHANES suman 231 785 870. ¿Qué es exactamente ese número?',
        pista: '¿Es un dato del censo o el resultado de una estimación?',
        opciones: [
          { texto: 'Una ESTIMACIÓN de la población adulta de EE.UU., con su propio error muestral.', correcta: true,
            retro: 'Correcto. La suma de pesos es el estimador de Horvitz–Thompson del total de la población: un estadístico, no un dato. Si se aleja mucho de un total conocido, hay un problema en el archivo o en el filtrado.' },
          { texto: 'El número exacto de adultos en EE.UU. según el censo, incorporado a los pesos.', correcta: false,
            retro: 'La calibración acerca los pesos a los totales del censo, pero la suma sigue siendo una estimación — y aquí ni siquiera se calibró a ese total exacto. Que un número salga creíble no lo convierte en un censo.' },
          { texto: 'El número de personas entrevistadas, multiplicado por el factor de expansión medio.', correcta: false,
            retro: 'Eso sería $n \\times \\bar w$, que da lo mismo aritméticamente pero describe mal lo que es: cada persona aporta SU peso, y son muy distintos (de 5 157 a 242 387).' },
          { texto: 'Un número de control interno de NHANES sin interpretación estadística.', correcta: false,
            retro: 'Tiene una interpretación muy concreta y muy útil: es la primera comprobación que se hace al abrir una encuesta ajena, precisamente porque debe parecerse a un total conocido.' }
        ]
      },
      {
        tipo: 'multiple',
        modulo: 3,
        pregunta: 'La descomposición del deff de NHANES da 1 → 1,73 → 1,71 → 6,92. Marca <strong>todo</strong> lo que sea cierto.',
        pista: 'Mira en qué dirección empuja cada componente y qué capítulo lo trata.',
        opciones: [
          { texto: 'Los pesos desiguales multiplican la varianza por 1,73.', correcta: true },
          { texto: 'Los estratos BAJAN la varianza (1,73 → 1,71): es exactamente su función.', correcta: true },
          { texto: 'Los conglomerados son el ingrediente caro: cuadruplican la varianza.', correcta: true },
          { texto: 'El deff siempre crece al añadir componentes del diseño.', correcta: false }
        ],
        retroAcierto: 'Las tres primeras. La cuarta es la idea que hay que desterrar: un deff de 7 no es un bloque monolítico, es una suma de fuerzas que empujan en direcciones distintas — y solo descomponiéndolo se sabe dónde intervenir (módulo 8).',
        retroFallo: 'Son las tres primeras. La cuarta es falsa y es la lección del módulo: los estratos reducen la varianza — es su trabajo desde el capítulo 4 — mientras pesos y conglomerados la aumentan.'
      },
      {
        tipo: 'opcion',
        modulo: 4,
        pregunta: 'La linealización de Taylor convierte la razón $\\hat R = \\hat t_y / \\hat t_x$ en un total. ¿Cuál es exactamente la variable cuyo total se estima?',
        pista: 'Escribe el desarrollo de primer orden y agrupa por unidad.',
        opciones: [
          { texto: '$u_k = (y_k - R\\,x_k)/t_x$: el residuo de $y$ respecto a la recta por el origen de pendiente $R$, escalado por el total del denominador.', correcta: true,
            retro: 'Exacto — y es el mismo residuo que el capítulo 3 usó para la varianza del estimador de razón. Aquel $e_k = y_k - \\hat R x_k$ es este $u_k$ sin el escalado.' },
          { texto: '$u_k = y_k / x_k$: la razón individual de cada unidad.', correcta: false,
            retro: 'Ese es el promedio de razones, un estimador DISTINTO (y sesgado para $R$). La linealización no promedia razones individuales: linealiza el cociente de totales.' },
          { texto: '$u_k = y_k - \\bar y$: el residuo respecto a la media.', correcta: false,
            retro: 'Eso linealizaría la media, no la razón. El punto de la razón es que el denominador TAMBIÉN es aleatorio, y por eso aparece $R x_k$ y no $\\bar y$.' },
          { texto: '$u_k = w_k y_k$: el valor ya ponderado.', correcta: false,
            retro: 'Los pesos entran después, al estimar el total de $u$. La variable linealizada se construye con los valores, no con los pesos.' }
        ]
      },
      {
        tipo: 'numerica',
        modulo: 5,
        pregunta: 'Con 15 estratos de 2 PSU cada uno, ¿cuántas réplicas produce el jackknife estratificado (JKn)? Entero.',
        pista: 'Una réplica por cada PSU eliminada.',
        respuesta: 30,
        tolerancia: 0.5,
        retroAcierto: '30: una por PSU. El BRR, en cambio, se apaña con 16 (la matriz de Hadamard de orden 16, la menor que cubre 15 estratos). Sobre SYC, con 861 PSU, el jackknife pide 861 réplicas — escala con el diseño.',
        retroFallo: 'El jackknife elimina UNA PSU cada vez: hay 15 × 2 = 30 PSU, luego 30 réplicas. El BRR usa 16 y el bootstrap, las que se le pidan (aquí 500).'
      },
      {
        tipo: 'opcion',
        modulo: 5,
        pregunta: 'Sobre SYC (de 7 a 154 PSU por estrato), ¿qué métodos de varianza son aplicables?',
        pista: 'Repasa el requisito estructural de cada método.',
        opciones: [
          { texto: 'Linealización, jackknife y bootstrap sí; BRR no, porque exige exactamente 2 PSU por estrato.', correcta: true,
            retro: 'Correcto. Y tampoco sirve JK1, el jackknife no estratificado: survey se niega explícitamente sobre un diseño con estratos. La estructura decide el método.' },
          { texto: 'Todos: los cuatro métodos son universales.', correcta: false,
            retro: 'BRR está construido sobre matrices de Hadamard que presuponen dos mitades por estrato. Con 7 o 154 PSU no hay tal partición y as.svrepdesign falla.' },
          { texto: 'Solo la linealización, porque hay demasiadas PSU para replicar.', correcta: false,
            retro: '861 réplicas son perfectamente manejables — el ejercicio 4 las calcula. La replicación escala bien; lo que no escala es la paciencia si el estadístico es muy costoso.' },
          { texto: 'Solo BRR, porque es el único diseñado para encuestas con estratos.', correcta: false,
            retro: 'Es justo al revés: BRR es el más restrictivo de los cuatro. El jackknife estratificado (JKn) es el que funciona con cualquier número de PSU por estrato mientras haya al menos 2.' }
        ]
      },
      {
        tipo: 'numerica',
        modulo: 6,
        pregunta: 'En el IPFP del módulo 6, el error máximo pasa de $1{,}3\\times10^{-1}$ a $3{,}35\\times10^{-3}$ en la primera iteración. ¿Aproximadamente por qué factor se divide el error en cada paso? Entero.',
        pista: 'Divide un error entre el siguiente: 0,13 / 0,00335, y comprueba con el paso siguiente (3,35e−3 / 4,54e−6).',
        respuesta: 39,
        tolerancia: 25,
        retroAcierto: 'Del orden de 40 por iteración: es convergencia geométrica. Por eso 3 iteraciones bastan para cualquier publicación y 8 llevan el error al límite de la precisión de la máquina ($10^{-16}$).',
        retroFallo: '0,13/0,00335 ≈ 39, y 3,35e−3/4,54e−6 ≈ 738 — el ritmo se acelera. Lo importante no es el número exacto sino el tipo de convergencia: geométrica, así que unas pocas iteraciones bastan siempre.'
      },
      {
        tipo: 'grafico',
        modulo: 3,
        alto: 240,
        descripcionGrafico: 'Cuatro barras con la varianza de la media del IMC según los componentes del diseño declarados: MAS ideal, más pesos, más estratos, más conglomerados',
        pregunta: 'La descomposición del módulo 3. ¿Qué barra rompe la idea de que «declarar más diseño siempre sube la varianza»?',
        pista: 'Compara la segunda con la tercera.',
        dibujar: canvas => {
          const D = D7.deff.descomposicion;
          const g = crearGraficoBarras(canvas, D.etiquetas, D.varianzas, {
            etiqueta: 'V(media del IMC)', color: COLORES_GRAFICO.primario,
            min: 0, max: Math.max(...D.varianzas) * 1.15
          });
          g.data.datasets[0].backgroundColor = ['#6B7280', '#012820', '#90FF00', '#FF6600'];
          g.update('none');
          return g;
        },
        opciones: [
          { texto: 'La tercera: al añadir los estratos la varianza BAJA respecto a la de solo pesos (deff 1,73 → 1,71), que es exactamente lo que un estratificado debe hacer.', correcta: true,
            retro: 'Correcto. Los estratos son el único componente que trabaja a favor de la precisión — lo demostró el capítulo 4 — y en la descomposición se ve en directo.' },
          { texto: 'La segunda: los pesos bajan la varianza al corregir el desbalance.', correcta: false,
            retro: 'Los pesos la SUBEN (1 → 1,73). Corregir sesgo con pesos desiguales cuesta varianza: es el intercambio del capítulo 6, y el deff de Kish lo mide.' },
          { texto: 'La cuarta: los conglomerados bajan la varianza al agrupar observaciones parecidas.', correcta: false,
            retro: 'Al revés: la cuadruplican (1,71 → 6,92). Agrupar observaciones parecidas es justamente lo que destruye información — es el ICC del capítulo 5.' },
          { texto: 'Ninguna: las cuatro barras crecen monótonamente.', correcta: false,
            retro: 'Mira la tercera barra: es más baja que la segunda. Esa pequeña bajada es el trabajo de los estratos, y verla es el objetivo del módulo.' }
        ]
      },
      {
        tipo: 'opcion',
        modulo: 8,
        pregunta: 'La simulación del módulo 8 da una cobertura del 56,3 % para un intervalo nominal del 95 % que ignora los conglomerados. ¿Cuál es la traducción correcta a contrastes de hipótesis?',
        pista: 'Cobertura del intervalo y tasa de error tipo I son dos caras de lo mismo.',
        opciones: [
          { texto: 'La tasa de falsos positivos se dispara del 5 % nominal a más del 40 %.', correcta: true,
            retro: 'Exacto: si el intervalo cubre el 56 % de las veces, el 44 % restante son casos donde se rechazaría erróneamente. Esa es una de las raíces documentadas de la crisis de replicación en estudios con datos agrupados.' },
          { texto: 'No hay traducción: la cobertura de intervalos y los contrastes son cosas distintas.', correcta: false,
            retro: 'Son estrictamente equivalentes: un intervalo del 95 % que no cubre el valor verdadero corresponde exactamente a rechazar $H_0$ cuando es cierta.' },
          { texto: 'La potencia del contraste sube, que es bueno.', correcta: false,
            retro: 'No es potencia, es error tipo I. Detectar «efectos» que no existen no es potencia: es ruido presentado como hallazgo.' },
          { texto: 'El efecto se compensa con muestras grandes.', correcta: false,
            retro: 'Es lo contrario: el deff no desaparece al crecer $n$ — depende de la ICC y del tamaño del conglomerado. Aumentar $n$ manteniendo el diseño produce intervalos aún más estrechos y aún más falsos.' }
        ]
      },
      {
        tipo: 'multiple',
        modulo: 8,
        pregunta: 'Sobre el recorte de pesos en NHANES, marca <strong>todo</strong> lo que sea cierto.',
        pista: 'Contrasta lo que el recorte consigue (Kish) con lo que se buscaba (error estándar), y recuerda la descomposición del módulo 3.',
        opciones: [
          { texto: 'El recorte agresivo baja el deff de Kish de 1,89 a 1,31: aplana los pesos, que era su objetivo.', correcta: true },
          { texto: 'Aun así, el error estándar no mejora (0,2532 → 0,2559).', correcta: true },
          { texto: 'La media se desplaza 0,057, es decir, el recorte introduce sesgo.', correcta: true },
          { texto: 'Recortar pesos es siempre recomendable cuando la razón máx/mín supera 40.', correcta: false }
        ],
        retroAcierto: 'Las tres primeras. La cuarta es la receta de cocina que el módulo desmonta: en NHANES la varianza la ponen los conglomerados, no los pesos, así que aplanar pesos ataca el ingrediente equivocado. Antes de recortar, descomponer el deff.',
        retroFallo: 'Son las tres primeras. La cuarta convierte en regla mecánica lo que es una decisión que depende de la DESCOMPOSICIÓN del deff: si el Kish es pequeño frente al deff total, el recorte no es la herramienta.'
      },
      {
        tipo: 'opcion',
        modulo: 9,
        pregunta: 'En el ciclo de diseño, ¿qué te devuelve de la etapa de pesos a la de campo?',
        pista: 'Piensa en qué hace imposible construir un buen peso.',
        opciones: [
          { texto: 'Pesos extremos o un raking que no converge: señal de que el campo dejó celdas casi vacías, y hay que intentar recuperar casos o colapsar celdas.', correcta: true,
            retro: 'Exacto. Un IPFP que no converge no es un problema numérico: es el algoritmo informando de que la muestra no tiene con qué cuadrar esos márgenes. La causa está en el campo, no en el código.' },
          { texto: 'Un deff más alto de lo previsto: hay que rehacer la ponderación.', correcta: false,
            retro: 'Un deff alto se diagnostica en el análisis y suele devolver al DISEÑO (etapa 3) o a los objetivos, no al campo. Y no se «arregla» reponderando.' },
          { texto: 'Nada: la etapa de pesos es puramente computacional y no devuelve a ninguna anterior.', correcta: false,
            retro: 'Es una de las que más devuelve. Los pesos son donde se manifiestan todos los problemas de las etapas previas — por eso el componente del módulo tiene un campo «qué te devuelve atrás» en cada etapa.' },
          { texto: 'Que el marco esté desactualizado.', correcta: false,
            retro: 'Eso también devuelve, pero a la etapa 2 (marco) y se detecta en campo, no al ponderar: son direcciones que no existen, no celdas vacías.' }
        ]
      }
    ];
