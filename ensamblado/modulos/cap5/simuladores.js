    // ================================================================
    // Simuladores del capítulo 5
    //
    // Todos leen de DATOS_CAP5, que produce precalculo/genera_cap5.R.
    // Aquí no se calcula nada pesado: los histogramas de 10 000
    // réplicas, las submuestras de coots y las constantes por zona de
    // BigLucy ya vienen resueltos. Lo que se computa en vivo son
    // fórmulas cerradas: deff de Kish, varianza de dos etapas con los
    // arreglos por zona, y el m óptimo con costos.
    // ================================================================
    const D5 = DATOS_CAP5;

    // Formato español: espacio fino como separador de miles, coma decimal.
    function fmtNum(x, d = 2) {
      if (!isFinite(x)) return '—';
      const s = Math.abs(x).toFixed(d);
      const partes = s.split('.');
      const entero = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      return (x < 0 ? '−' : '') + entero + (partes[1] ? ',' + partes[1] : '');
    }

    function fmtPct(x, d = 1) { return fmtNum(100 * x, d) + ' %'; }

    // Los ejes en el formato del curso, sea cual sea el idioma del navegador
    // (Chart.js usa el del navegador: en inglés salían «0.2» y «200,000»), y
    // sin que Chart.js esconda rótulos de categoría en pantallas estrechas.
    // Los constructores de la plantilla no lo hacen; se arregla aquí, para
    // este capítulo, sin tocar la plantilla que comparten los demás.
    function ejesEnEspanol(g, decX, decY) {
      const x = g.options.scales.x, y = g.options.scales.y;
      if (x.type === 'linear') {
        x.ticks = Object.assign({}, x.ticks, { callback: v => fmtNum(v, decX) });
      } else {
        x.ticks = Object.assign({}, x.ticks, { autoSkip: false, maxRotation: 0 });
      }
      y.ticks = Object.assign({}, y.ticks, { callback: v => fmtNum(v, decY) });
    }

    // Un tope de eje redondo para un máximo cualquiera, con sus marcas: así el
    // eje no enseña el flotante crudo (0.016516318447999997, 7,370.9).
    function topeBonito(g, maximo) {
      const { paso, dec } = pasoBonito(maximo / 5);
      g.options.scales.y.max = multiploDe(paso, Math.ceil(maximo / paso - 1e-9));
      g.options.scales.y.ticks.stepSize = paso;
      g.options.scales.y.ticks.callback = v => fmtNum(v, dec);
    }

    // ---------------------------------------------------------------
    // M1 · Seis estados enteros contra 369 condados sueltos
    // ---------------------------------------------------------------
    SIMULADORES['estados'] = function (raiz) {
      const E = D5.estados;
      const params = { mostrar: 0 };
      const lienzo = raiz.querySelector('canvas');
      const NOMBRES = ['los dos diseños', 'solo estados enteros', 'solo MAS de condados'];

      const g = crearGraficoXY(lienzo, [], {
        tituloX: 'media estimada (miles de acres)', tituloY: 'réplicas por caja'
      });
      ejesEnEspanol(g, 0, 0);

      function pintar() {
        const alto = Math.max(...E.cluster.conteo, ...E.mas.conteo) * 1.05;
        const datasets = [];
        if (params.mostrar !== 2) {
          datasets.push(serieHistograma(E.cluster, '6 estados enteros', COLORES_GRAFICO.secundario, 1e-3));
        }
        if (params.mostrar !== 1) {
          datasets.push(serieHistograma(E.mas, 'MAS de ' + E.nEquiv + ' condados', COLORES_GRAFICO.primario, 1e-3));
        }
        datasets.push(serieVertical(E.media / 1000, alto, 'media verdadera', COLORES_GRAFICO.gris));
        g.data.datasets = datasets;
        g.update('none');

        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'mostrando:', valor: NOMBRES[params.mostrar] },
          { etiqueta: 'condados por réplica (estados):', valor: fmtNum(E.nObsMedio, 0) +
            ' en promedio (' + E.nObsMin + ' a ' + E.nObsMax + ')' },
          { etiqueta: 'ee del MAS:', valor: fmtNum(Math.sqrt(E.varMas), 0) },
          { etiqueta: 'ee por estados:', valor: fmtNum(Math.sqrt(E.varCluster), 0) },
          { etiqueta: 'deff empírico:', valor: fmtNum(E.deffEmp, 1) },
          { etiqueta: 'las ~370 observaciones rinden como:', valor: fmtNum(E.nObsMedio / E.deffEmp, 0) + ' de un MAS' }
        ]);
      }

      crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'mostrar', etiqueta: 'Qué mostrar (0 ambos · 1 estados · 2 MAS)', min: 0, max: 2, paso: 1 }
      ], params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M2 · π como producto: la calculadora de dos etapas
    // ---------------------------------------------------------------
    SIMULADORES['pi-dos-etapas'] = function (raiz) {
      const params = { n: 10, m: 20, Mi: 163 };
      const lienzo = raiz.querySelector('canvas');
      const N = 75;

      const g = crearGraficoBarras(lienzo,
        [['π₁', '(escuela)'], ['π₂', '(dentro)'], ['π', '(producto)']],
        [0, 0, 0], {
          etiqueta: 'probabilidad', color: COLORES_GRAFICO.primario, min: 0, max: 1
        });
      ejesEnEspanol(g, 0, 1);

      function pintar() {
        const pi1 = params.n / N;
        const pi2 = Math.min(1, params.m / params.Mi);
        const pi = pi1 * pi2;
        g.data.datasets[0].data = [pi1, pi2, pi];
        g.update('none');

        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'diseño:', valor: params.n + ' de ' + N + ' escuelas · ' + params.m +
            ' de ' + params.Mi + ' estudiantes' },
          { etiqueta: 'π₁ = n/N:', valor: fmtNum(pi1, 4) },
          { etiqueta: 'π₂ = m/Mᵢ:', valor: fmtNum(pi2, 4) + (params.m >= params.Mi ? ' (censo interno)' : '') },
          { etiqueta: 'π = producto:', valor: fmtNum(pi, 5) },
          { etiqueta: 'peso w = 1/π:', valor: fmtNum(1 / pi, 2) },
          { etiqueta: 'unidades que observa el diseño:', valor: fmtNum(params.n * Math.min(params.m, params.Mi), 0) }
        ]);
      }

      crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'n', etiqueta: 'Escuelas sorteadas n', min: 2, max: 75, paso: 1 },
        { clave: 'm', etiqueta: 'Estudiantes por escuela m', min: 5, max: 60, paso: 1 },
        { clave: 'Mi', etiqueta: 'Tamaño Mᵢ de la escuela del estudiante', min: 40, max: 400, paso: 1 }
      ], params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // Lo que la plantilla no trae y piden los widgets de los módulos 3 y 4:
    // la cifra del deslizador con coma decimal, rótulos en sus extremos,
    // botones de casos reales que mueven los deslizadores, y ejes con
    // marcas regulares que no enseñen el float crudo.
    // ---------------------------------------------------------------

    // La plantilla escribe la cifra con toFixed (punto decimal). Este
    // oyente se registra después del suyo, así que corre después y la
    // reescribe con coma.
    function comaEnDeslizadores(inputs, decimales) {
      Object.keys(inputs).forEach(clave => {
        const input = inputs[clave];
        const salida = input.parentElement.querySelector('output');
        const pinta = () => { salida.textContent = fmtNum(parseFloat(input.value), decimales[clave] || 0); };
        input.addEventListener('input', pinta);
        pinta();
      });
    }

    function rotulosExtremos(input, izquierda, derecha) {
      const fila = document.createElement('div');
      fila.style.cssText = 'display:flex; justify-content:space-between; gap:1rem; ' +
        'font-size:0.75rem; line-height:1.3; color:#6b7280;';
      const a = document.createElement('span');
      a.textContent = izquierda;
      const b = document.createElement('span');
      b.textContent = derecha;
      b.style.textAlign = 'right';
      fila.append(a, b);
      input.parentElement.appendChild(fila);
    }

    // Una fila de botones encima de los deslizadores. Al pulsar uno, se
    // fijan sus valores en los <input> y se dispara 'input', que es el
    // camino normal: params, la cifra con coma y el repintado.
    function botonesDeCaso(contenedor, rotulo, casos, inputs, alElegir) {
      const fila = document.createElement('div');
      fila.className = 'control-interruptores';
      fila.style.gridColumn = '1 / -1';
      fila.setAttribute('role', 'group');
      fila.setAttribute('aria-label', rotulo);
      const botones = casos.map(caso => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'control-interruptor';
        b.textContent = caso.boton;
        b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', () => {
          botones.forEach(o => {
            o.classList.toggle('activo', o === b);
            o.setAttribute('aria-pressed', String(o === b));
          });
          alElegir(caso);
          Object.keys(caso.valores).forEach(clave => {
            inputs[clave].value = caso.valores[clave];
            inputs[clave].dispatchEvent(new Event('input'));
          });
        });
        fila.appendChild(b);
        return b;
      });
      contenedor.prepend(fila);
      return botones;
    }

    // Un múltiplo del paso, sin la cola de coma flotante (11 × 0,2 da
    // 2,2000000000000002, y Chart.js se salta marcas con extremos así).
    function multiploDe(paso, k) { return Number((k * paso).toFixed(10)); }

    // Un paso «bonito» (1, 2, 2,5 o 5 por potencia de 10) y sus decimales.
    function pasoBonito(bruto) {
      const pot = Math.pow(10, Math.floor(Math.log10(bruto)));
      const paso = [1, 2, 2.5, 5, 10].map(f => f * pot).find(p => p >= bruto);
      const dec = Math.max(0, -Math.floor(Math.log10(paso) + 1e-9)) + (paso / pot === 2.5 ? 1 : 0);
      return { paso, dec };
    }

    // ---------------------------------------------------------------
    // M3 · Cuánto miente el error estándar ingenuo
    //
    // Dos intervalos del 95 % alrededor de la misma media: el ingenuo, de
    // un MAS de nM unidades con su fpc, y el honesto, el ingenuo por
    // √deff de Kish. El caso fija los datos (grupos sorteados n, grupos
    // en la población N, media y desviación estándar); los deslizadores
    // mueven M y ρ. El eje es fijo por caso: el intervalo honesto nunca
    // pasa de 1,96·s·√((1 − n/N)/n), que es el de ρ = 1.
    // ---------------------------------------------------------------
    SIMULADORES['espejismo-ee'] = function (raiz) {
      const G = D5.gpa, A = D5.algebra;
      const CASOS = [
        { boton: 'Suites (gpa)', datos: 'gpa', grupos: 'suites', n: G.n, N: G.N, media: G.ybar, s: G.s,
          observado: G.se / G.seNaive,
          valores: { rho: Math.round(G.icc * 100) / 100, M: G.M } },
        { boton: 'Aulas (algebra)', datos: 'algebra', grupos: 'aulas', n: A.n, N: A.N, media: A.ybar, s: A.s,
          observado: A.se / A.seMas,
          valores: { rho: Math.round(A.icc * 100) / 100, M: Math.round(A.Mbar) } }
      ];
      let caso = CASOS[0];
      const params = Object.assign({}, caso.valores);
      const lienzo = raiz.querySelector('canvas');

      const g = crearGraficoXY(lienzo, [], {});
      g.options.plugins.legend.display = false;
      g.options.plugins.tooltip.enabled = false;
      g.options.scales.y = {
        type: 'linear', min: 0.4, max: 2.6, grid: { display: false },
        ticks: { stepSize: 1, font: { family: 'Montserrat', size: 12 },
                 callback: v => (v === 2 ? 'ingenuo' : v === 1 ? 'honesto' : '') }
      };

      function fijaEje() {
        const tope = 1.96 * caso.s * Math.sqrt((1 - caso.n / caso.N) / caso.n);
        const { paso, dec } = pasoBonito(2 * tope / 6);
        const x = g.options.scales.x;
        x.min = multiploDe(paso, Math.floor((caso.media - tope) / paso));
        x.max = multiploDe(paso, Math.ceil((caso.media + tope) / paso));
        x.title = { display: true, text: 'media estimada (' + caso.datos + ')',
                    font: { family: 'Montserrat', size: 11 } };
        x.ticks.stepSize = paso;
        x.ticks.maxTicksLimit = 12;
        x.ticks.callback = v => fmtNum(v, dec);
      }

      function intervalo(centro, medio, y, color) {
        return { type: 'line', label: '', data: [{ x: centro - medio, y: y }, { x: centro + medio, y: y }],
                 borderColor: color, borderWidth: 14, borderCapStyle: 'butt', pointRadius: 0, fill: false };
      }

      function pintar() {
        const nObs = caso.n * params.M;
        const deff = 1 + (params.M - 1) * params.rho;
        const factor = Math.sqrt(deff);
        const eeIngenuo = Math.sqrt((1 - caso.n / caso.N) * caso.s * caso.s / nObs);
        const medioIngenuo = 1.96 * eeIngenuo;
        const medioHonesto = medioIngenuo * factor;
        g.data.datasets = [
          intervalo(caso.media, medioIngenuo, 2, COLORES_GRAFICO.secundario),
          intervalo(caso.media, medioHonesto, 1, COLORES_GRAFICO.primario),
          { type: 'line', label: '', data: [{ x: caso.media, y: 0.55 }, { x: caso.media, y: 2.45 }],
            borderColor: '#1e293b', borderDash: [4, 3], borderWidth: 1.5, pointRadius: 0, fill: false }
        ];
        g.update('none');

        const dec = caso.s < 5 ? 2 : 1;
        raiz.querySelector('.simulador-lectura').innerHTML =
          `<p style="flex-basis:100%; margin:0; font-family:Montserrat, sans-serif; font-size:0.9rem; line-height:1.5;">` +
          `Con grupos de <b>${fmtNum(params.M, 0)}</b> personas que se parecen <b>ρ = ${fmtNum(params.rho, 2)}</b>, ` +
          `tus <b>${fmtNum(nObs, 0)}</b> observaciones informan como <b>~${fmtNum(nObs / deff, 0)} independientes</b>. ` +
          `El análisis ingenuo diría <b>±${fmtNum(medioIngenuo, dec)}</b>; lo honesto es ` +
          `<b>±${fmtNum(medioHonesto, dec)}</b> (${fmtNum(100 * (factor - 1), 0)} % más ancho).</p>` +
          `<span style="font-size:0.75rem; color:#64748b;">deff = 1 + (M − 1)ρ = ${fmtNum(deff, 2)} · ` +
          `√deff = ${fmtNum(factor, 2)} · ${fmtNum(caso.n, 0)} ${caso.grupos} de ${fmtNum(caso.N, 0)} · ` +
          `en los datos de ${caso.datos}, el factor observado es ${fmtNum(caso.observado, 2)}</span>`;
      }

      const controles = raiz.querySelector('.simulador-controles');
      const inputs = crearControles(controles, [
        { clave: 'rho', etiqueta: 'Correlación intraclase ρ', min: 0, max: 1, paso: 0.01 },
        { clave: 'M', etiqueta: 'Personas por grupo M', min: 1, max: 50, paso: 1 }
      ], params, pintar);
      comaEnDeslizadores(inputs, { rho: 2, M: 0 });
      rotulosExtremos(inputs.rho, '0 = no se parecen más que dos extraños', '1 = son copias');
      rotulosExtremos(inputs.M, '1 = sin grupos', '50');
      const botones = botonesDeCaso(controles, 'Casos reales del capítulo', CASOS, inputs, c => {
        caso = c;
        fijaEje();
      });
      botones[0].classList.add('activo');
      botones[0].setAttribute('aria-pressed', 'true');
      fijaEje();
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M4 · La ICC al mando
    //
    // El eje x llega hasta el máximo del deslizador (100), para que quepa
    // el caso de los estados (M̄ ≈ 62). El eje y toma el menor tope «bonito»
    // que cubre la curva, con marcas regulares y coma decimal. La franja
    // gris va entre las curvas de ρ = 0,01 y ρ = 0,20.
    // ---------------------------------------------------------------
    SIMULADORES['icc-deff'] = function (raiz) {
      const A = D5.algebra, E = D5.estados;
      const M_MAX = 100;
      const CASOS = [
        { boton: 'Aulas (algebra)', valores: { rho: Math.round(A.icc * 100) / 100, M: Math.round(A.Mbar) } },
        { boton: 'Estados (módulo 1)', valores: { rho: Math.round(E.Ra2 * 200) / 200, M: Math.round(E.Mbar) } }
      ];
      // [tope del eje y, paso de sus marcas]
      const TOPES = [[2, 0.5], [3, 0.5], [5, 1], [10, 2], [20, 5], [30, 5], [50, 10], [100, 20]];
      const params = Object.assign({}, CASOS[0].valores);
      const lienzo = raiz.querySelector('canvas');

      const g = crearGraficoXY(lienzo, [], {
        tituloX: 'tamaño medio del conglomerado M̄', tituloY: 'deff', xMin: 0, xMax: M_MAX
      });
      Object.assign(g.options.scales.x.ticks, { stepSize: 10, maxTicksLimit: 12, callback: v => fmtNum(v, 0) });
      Object.assign(g.options.plugins.tooltip, {
        filter: item => item.datasetIndex >= 2 && item.dataset.label !== '',
        callbacks: {
          title: items => 'M̄ = ' + fmtNum(items[0].parsed.x, 0),
          label: item => item.dataset.label + ': deff ' + fmtNum(item.parsed.y, 2)
        }
      });

      function curva(rho) {
        const c = [];
        for (let m = 1; m <= M_MAX; m++) c.push({ x: m, y: 1 + (m - 1) * rho });
        return c;
      }

      function pintar() {
        const deff = 1 + (params.M - 1) * params.rho;
        g.data.datasets = [
          { type: 'line', label: 'zona habitual (ρ 0,01–0,20)', data: curva(0.20),
            borderWidth: 0, pointRadius: 0, backgroundColor: 'rgba(148, 163, 184, 0.22)', fill: '+1' },
          { type: 'line', label: '', data: curva(0.01), borderWidth: 0, pointRadius: 0, fill: false },
          { type: 'line', label: 'deff con tu ρ', data: curva(params.rho),
            borderColor: COLORES_GRAFICO.primario, borderWidth: 2, pointRadius: 0, fill: false },
          { type: 'scatter', label: 'tu diseño', data: [{ x: params.M, y: deff }],
            backgroundColor: COLORES_GRAFICO.secundario, pointRadius: 7 },
          { type: 'line', label: 'deff = 1 (MAS)', data: [{ x: 0, y: 1 }, { x: M_MAX, y: 1 }],
            borderColor: COLORES_GRAFICO.gris, borderDash: [6, 4], borderWidth: 1.5,
            pointRadius: 0, fill: false }
        ];
        const alto = 1 + (M_MAX - 1) * params.rho;
        const [tope, paso] = TOPES.find(([t]) => t >= alto) || TOPES[TOPES.length - 1];
        Object.assign(g.options.scales.y, { min: 0, max: tope });
        Object.assign(g.options.scales.y.ticks, { stepSize: paso, callback: v => fmtNum(v, paso < 1 ? 1 : 0) });
        g.update('none');

        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'deff:', valor: fmtNum(deff, 2) },
          { etiqueta: '1 000 unidades rinden como:', valor: fmtNum(1000 / deff, 0) +
            ' — pierdes el ' + fmtNum(100 * (1 - 1 / deff), 0) + ' % de la muestra' },
          { etiqueta: 'referencia algebra:', valor: 'ρ ≈ 0,040, M̄ = 24,9 → deff ≈ 1,95 (empírico: 2,25)' },
          { etiqueta: 'referencia estados (módulo 1):', valor: 'ρ = 0,475, M̄ ≈ 62 → deff ≈ 30 (empírico: 30,4); ' +
            'con tamaños de 3 a 254, que casi coincidan es en parte casual' }
        ]);
      }

      const controles = raiz.querySelector('.simulador-controles');
      const inputs = crearControles(controles, [
        { clave: 'rho', etiqueta: 'Correlación intraclase ρ', min: 0, max: 0.95, paso: 0.005 },
        { clave: 'M', etiqueta: 'Tamaño (medio) del conglomerado M̄', min: 1, max: M_MAX, paso: 1 }
      ], params, pintar);
      comaEnDeslizadores(inputs, { rho: 3, M: 0 });
      const botones = botonesDeCaso(controles, 'Casos reales del capítulo', CASOS, inputs, () => {});
      botones[0].classList.add('activo');
      botones[0].setAttribute('aria-pressed', 'true');
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M5 · Las dos medias de coots, con más o menos nidadas
    // ---------------------------------------------------------------
    SIMULADORES['coots-submuestras'] = function (raiz) {
      const C = D5.coots;
      const params = { idx: 5 };
      const lienzo = raiz.querySelector('canvas');

      const g = crearGraficoBarras(lienzo,
        [['estimador', 'de razón'], ['media', 'ingenua']],
        [0, 0], {
          etiqueta: 'volumen medio del huevo', color: COLORES_GRAFICO.primario,
          min: 2.0, max: 2.8,
          lineas: [
            { valor: C.razon, etiqueta: 'razón con las 184: 2,49', color: COLORES_GRAFICO.secundario },
            { valor: C.mediaMedias, etiqueta: 'ingenua con las 184: 2,33', color: '#94a3b8' }
          ]
        });
      ejesEnEspanol(g, 0, 1);

      function pintar() {
        const s = C.submuestras[params.idx - 1];
        g.data.datasets[0].data = [s.razon, s.mediaMedias];
        g.update('none');

        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'nidadas usadas:', valor: fmtNum(s.n, 0) + ' de ' + C.n },
          { etiqueta: 'razón:', valor: fmtNum(s.razon, 4) + ' (ee ' + fmtNum(s.ee, 4) + ')' },
          { etiqueta: 'media ingenua:', valor: fmtNum(s.mediaMedias, 4) },
          { etiqueta: 'brecha:', valor: fmtNum(s.razon - s.mediaMedias, 4) + ' — no se cierra con n' },
          { etiqueta: 'por qué:', valor: 'estiman parámetros distintos (huevo típico vs nidada típica)' }
        ]);
      }

      crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'idx', etiqueta: 'Submuestra (1: 20 nidadas … 5: las 184)', min: 1, max: 5, paso: 1 }
      ], params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M7 · Los dos pisos de la varianza (zonas de BigLucy)
    // ---------------------------------------------------------------
    SIMULADORES['dos-etapas-varianza'] = function (raiz) {
      const Z = D5.zonas;
      const params = { n: 10, m: 20 };
      const lienzo = raiz.querySelector('canvas');

      const g = crearGraficoBarras(lienzo,
        [['etapa 1', '(entre)'], ['etapa 2', '(dentro)'], ['total']],
        [0, 0, 0], {
          etiqueta: 'varianza del total (×10¹³)', color: COLORES_GRAFICO.primario, min: 0, max: 100
        });
      ejesEnEspanol(g, 0, 0);

      function calcula(n, m) {
        const N = Z.NI;
        let dentro = 0;
        for (let i = 0; i < N; i++) {
          const mi = Math.min(m, Z.Mi[i]);
          dentro += Z.Mi[i] ** 2 * (1 - mi / Z.Mi[i]) * Z.S2i[i] / mi;
        }
        return {
          entre: N ** 2 * (1 - n / N) * Z.S2t / n,
          dentro: (N / n) * dentro
        };
      }

      function pintar() {
        const v = calcula(params.n, params.m);
        const esc = 1e13;
        g.data.datasets[0].data = [v.entre / esc, v.dentro / esc, (v.entre + v.dentro) / esc];
        topeBonito(g, 1.1 * (v.entre + v.dentro) / esc);
        g.update('none');

        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'diseño:', valor: params.n + ' de 100 zonas · ' + params.m + ' empresas por zona' },
          { etiqueta: 'empresas visitadas (aprox.):', valor: fmtNum(params.n * params.m, 0) },
          { etiqueta: 'ee del total:', valor: fmtNum(Math.sqrt(v.entre + v.dentro), 0) },
          { etiqueta: 'la etapa 1 pone el:', valor: fmtPct(v.entre / (v.entre + v.dentro)) },
          { etiqueta: 'referencia schools:', valor: 'la etapa 1 pone el 93,9 % (módulo 7)' }
        ]);
      }

      crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'n', etiqueta: 'Zonas sorteadas n', min: 2, max: 100, paso: 1 },
        { clave: 'm', etiqueta: 'Empresas por zona m', min: 2, max: 150, paso: 1 }
      ], params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M8 · El presupuesto por etapas
    // ---------------------------------------------------------------
    SIMULADORES['presupuesto-mn'] = function (raiz) {
      const rho = D5.zonas.Ra2;
      const params = { C: 5000, c1: 50, c2: 2, m: 10 };
      const lienzo = raiz.querySelector('canvas');

      const g = crearGraficoXY(lienzo, [], {
        tituloX: 'unidades por conglomerado m', tituloY: 'varianza relativa', xMin: 0, xMax: 60
      });
      ejesEnEspanol(g, 0, 3);

      function Vrel(m, c1, c2, C) {
        const n = C / (c1 + c2 * m);
        return (1 + (m - 1) * rho) / (n * m);
      }

      function pintar() {
        const mOpt = Math.sqrt(params.c1 * (1 - rho) / (params.c2 * rho));
        const curva = [];
        for (let m = 1; m <= 60; m++) curva.push({ x: m, y: Vrel(m, params.c1, params.c2, params.C) });
        const vTu = Vrel(params.m, params.c1, params.c2, params.C);
        const vOpt = Vrel(mOpt, params.c1, params.c2, params.C);
        g.data.datasets = [
          { type: 'line', label: 'varianza relativa según m', data: curva,
            borderColor: COLORES_GRAFICO.primario, borderWidth: 2, pointRadius: 0, fill: false },
          { type: 'scatter', label: 'tu m', data: [{ x: params.m, y: vTu }],
            backgroundColor: COLORES_GRAFICO.secundario, pointRadius: 7 },
          { type: 'scatter', label: 'm óptimo', data: [{ x: mOpt, y: vOpt }],
            backgroundColor: '#7c3aed', pointRadius: 6 }
        ];
        topeBonito(g, Math.min(vTu, curva[curva.length - 1].y) * 4);
        g.update('none');

        const n = params.C / (params.c1 + params.c2 * params.m);
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'ICC de las zonas (fija):', valor: fmtNum(rho, 4) },
          { etiqueta: 'm óptimo:', valor: fmtNum(mOpt, 1) + ' — no depende del presupuesto' },
          { etiqueta: 'con tu m alcanzan:', valor: fmtNum(n, 1) + ' conglomerados (' +
            fmtNum(n * params.m, 0) + ' unidades)' },
          { etiqueta: 'castigo frente al óptimo:', valor: fmtPct(vTu / vOpt - 1, 1) }
        ]);
      }

      const inputs = crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'C', etiqueta: 'Presupuesto total C', min: 2000, max: 20000, paso: 500 },
        { clave: 'c1', etiqueta: 'Costo por conglomerado c₁', min: 20, max: 300, paso: 10 },
        { clave: 'c2', etiqueta: 'Costo por unidad c₂', min: 1, max: 10, paso: 1 },
        { clave: 'm', etiqueta: 'Tu m', min: 2, max: 60, paso: 1 }
      ], params, pintar);
      comaEnDeslizadores(inputs, { C: 0, c1: 0, c2: 0, m: 0 });
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M10 · El minibatch correlacionado
    // ---------------------------------------------------------------
    SIMULADORES['minibatch'] = function (raiz) {
      const params = { rho: 0.2, m: 64 };
      const lienzo = raiz.querySelector('canvas');

      const g = crearGraficoBarras(lienzo,
        [['tamaño', 'nominal'], ['tamaño', 'informativo']],
        [0, 0], {
          etiqueta: 'ejemplos', color: COLORES_GRAFICO.primario, min: 0, max: 260
        });
      ejesEnEspanol(g, 0, 0);

      function pintar() {
        const deff = 1 + (params.m - 1) * params.rho;
        const efectivo = params.m / deff;
        g.data.datasets[0].data = [params.m, efectivo];
        topeBonito(g, Math.max(80, params.m * 1.1));
        g.update('none');

        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'batch nominal:', valor: fmtNum(params.m, 0) + ' ejemplos' },
          { etiqueta: 'deff del batch:', valor: fmtNum(deff, 2) },
          { etiqueta: 'batch informativo:', valor: fmtNum(efectivo, 1) + ' ejemplos' },
          { etiqueta: 'pasos extra para la misma señal:', valor: fmtPct(deff - 1, 0) },
          { etiqueta: 'la cura:', valor: 'barajar globalmente (ρ → 0), no agrandar el batch' }
        ]);
      }

      const inputs = crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'rho', etiqueta: 'Correlación intra-grupo ρ', min: 0, max: 0.9, paso: 0.01 },
        { clave: 'm', etiqueta: 'Tamaño del minibatch', min: 1, max: 256, paso: 1 }
      ], params, pintar);
      comaEnDeslizadores(inputs, { rho: 2, m: 0 });
      pintar();
      return [g];
    };

    // ================================================================
    // Tabla-ranking del módulo 9: las estrategias comparadas
    // ================================================================
    TABLAS_RANKING['estrategias'] = function () {
      const E = D5.estados;
      const C = D5.combinado;
      return {
        descripcion: 'Cuatro maneras de gastar un presupuesto parecido sobre agpop, medidas con ' +
          '10 000 réplicas (5 000 las de 8 estados). El deff de cada fila se calcula contra un MAS ' +
          'con el mismo número esperado de condados. Pulsa cualquier cabecera para reordenar.',
        columnas: [
          { clave: 'diseno', titulo: 'Diseño', tipo: 'texto' },
          { clave: 'desplaz', titulo: 'Estados visitados (promedio)', decimales: 0, mejor: 'menor' },
          { clave: 'condados', titulo: 'Condados (promedio)', decimales: 0 },
          { clave: 'ee', titulo: 'Error estándar', decimales: 0, mejor: 'menor' },
          { clave: 'deff', titulo: 'deff', decimales: 1, mejor: 'menor' }
        ],
        filas: [
          { diseno: 'MAS de condados', desplaz: C.estadosMas, condados: E.nEquiv,
            ee: Math.sqrt(E.varMas), deff: 1 },
          { diseno: 'Conglomerados: 6 estados', desplaz: 6, condados: E.nObsMedio,
            ee: Math.sqrt(E.varCluster), deff: E.deffEmp },
          { diseno: 'Conglomerados: 8 estados, sin estratos', desplaz: 8, condados: C.nMedio8,
            ee: Math.sqrt(C.V8sinEstratos), deff: C.deff8 },
          { diseno: 'Estratos × conglomerados: 2 estados por región', desplaz: 8,
            condados: C.nMedio, ee: Math.sqrt(C.V), deff: C.deffMismoN }
        ],
        inicial: 'ee',
        destacada: 'Estratos × conglomerados: 2 estados por región',
        pie: 'El MAS gana en varianza y pierde en logística: sus ~369 condados caen, en promedio, ' +
          'en 46 de los 50 estados. El conglomerado puro reduce los estados a 6 y paga un deff de 30. ' +
          'Con 8 estados sin estratos el deff sigue en 30, aunque hay más condados. El combinado ' +
          'visita también 8 estados, pero dos por región, y frente a esos 8 sin estratos recorta una ' +
          'cuarta parte de la varianza: los estratos le quitan al azar la posibilidad de concentrar ' +
          'los estados en una sola punta. Ninguna maravilla: un deff de 21 sigue siendo caro, y por ' +
          'eso las encuestas reales añaden las armas del capítulo 6 (PPT) y del 7.'
      };
    };

    // ================================================================
    // Diagrama de diseño del módulo 2: las dos etapas de schools
    // ================================================================
    DIAGRAMAS_DISENO['dos-etapas'] = {
      titulo: 'El diseño de schools: dos etapas MAS-MAS',
      intro: 'Pulsa cada etapa. Hay DOS con azar — y la franja final multiplica sus ' +
        'probabilidades, que es la novedad estructural del capítulo.',
      nota: 'Compara con el diagrama de una etapa del capítulo 4, módulo 1: allí π tenía un ' +
        'factor; aquí dos. En el capítulo 7, las encuestas reales apilarán tres o cuatro.',
      etapas: [
        {
          etiqueta: 'Población',
          unidad: '75 escuelas, $K$ estudiantes',
          icono: 'fa-school',
          resumen: 'El marco lista las 75 escuelas. Sus tamaños M_i solo se averiguan en las ' +
            'sorteadas, así que el total de estudiantes K = ΣM_i no se conoce — y para estimar ' +
            'totales ni siquiera hace falta.',
          cifras: [{ k: 'N', v: '75 escuelas' }, { k: 'M_i (sorteadas)', v: 'de 109 a 367' }]
        },
        {
          etiqueta: 'Etapa 1: escuelas',
          unidad: 'MAS de $n = 10$',
          icono: 'fa-th-large',
          resumen: 'Se sortean 10 escuelas completas: son las unidades primarias (UPM). Aquí vive ' +
            'el primer piso del azar — y, como muestra el módulo 7, casi toda la varianza (el 94 %).',
          pi: '\\pi_{1i} = n/N = 10/75',
          peso: 'N/n = 7{,}5',
          cifras: [{ k: 'π₁', v: '0,1333' }],
          ejemplo: 'diez permisos de rectoría en lugar de setenta y cinco.'
        },
        {
          etiqueta: 'Etapa 2: estudiantes',
          unidad: 'MAS de $m = 20$ por escuela',
          icono: 'fa-user-check',
          resumen: 'Dentro de cada escuela sorteada, 20 estudiantes de sus M_i. El segundo piso ' +
            'del azar: chico, porque 20 compañeros de la misma escuela ya se parecen (ICC).',
          pi: '\\pi_{2k|i} = m/M_i = 20/M_i',
          peso: 'M_i/20',
          cifras: [{ k: 'π₂ típica', v: '0,05 a 0,18' }],
          ejemplo: 'en la escuela de 367, cada estudiante sale con π₂ = 0,0545.'
        },
        {
          etiqueta: 'Estimación',
          unidad: 'pesos multiplicados',
          icono: 'fa-calculator',
          resumen: 'El peso final multiplica los de las dos etapas: w = 7,5 · M_i/20. El archivo ' +
            'lo trae en finalwt, y la cadena del módulo 2 comprueba que la cuenta lo reconstruye ' +
            'exacto.',
          peso: 'w_k = 7{,}5 \\cdot M_i/20',
          cifras: [{ k: 'w rango', v: '40,9 a 137,6' }, { k: 'total math', v: '572 116 (ee 51 900)' }],
          ejemplo: 'un estudiante de la escuela grande habla por 137,6 estudiantes.'
        }
      ],
      acumulado: {
        rotulo: 'El diseño completo',
        formula: '\\pi_k = \\frac{n}{N}\\cdot\\frac{m}{M_i} \\qquad ' +
          'w_k = \\frac{N}{n}\\cdot\\frac{M_i}{m} \\qquad ' +
          '\\widehat{V} = \\text{entre} + \\text{dentro}',
        texto: 'Dos etapas de azar: π es un producto, el peso es un producto, y la varianza ' +
          'estimada es una suma de dos sumandos (el módulo 7 muestra que no son exactamente uno por ' +
          'etapa). Esa triple estructura es todo el capítulo.'
      }
    };

    // ================================================================
    // Glosario de notación del capítulo 5
    // ================================================================
    GLOSARIOS['conglomerados'] = {
      titulo: 'Notación: este material ↔ Lohr ↔ Gutiérrez',
      nota: 'El glosario que más confunde del curso: dos niveles de unidades, dos familias de ' +
        'letras. La traición principal: $N$ ahora cuenta CONGLOMERADOS (Gutiérrez lo hace ' +
        'explícito con el subíndice: $N_I$), y el total de unidades pasa a llamarse $K$.',
      filas: [
        { concepto: 'Conglomerado (UPM)', aqui: 'i', lohr: '\\text{psu } i', gutierrez: 'U_i', r: 'id = ~clutch' },
        { concepto: 'Unidad final (USM)', aqui: 'k', lohr: '\\text{ssu } j', gutierrez: 'k', r: 'una fila' },
        { concepto: 'Número de conglomerados', aqui: 'N', lohr: 'N', gutierrez: 'N_I', r: 'fpc = ~N (total de conglomerados; 1.ª componente si hay dos etapas)' },
        { concepto: 'Conglomerados sorteados', aqui: 'n', lohr: 'n', gutierrez: 'n_I', r: 'length(unique(id))' },
        { concepto: 'Tamaño del conglomerado', aqui: 'M_i', lohr: 'M_i', gutierrez: 'N_i', r: 'csize, Mi' },
        { concepto: 'Unidades submuestreadas', aqui: 'm_i', lohr: 'm_i', gutierrez: 'n_i', r: 'fpc = ~N + Mi (2.ª componente: los tamaños poblacionales Mᵢ)' },
        { concepto: 'Total de unidades', aqui: 'K = \\sum M_i', lohr: 'M_0', gutierrez: 'N', r: '—' },
        { concepto: 'Total del conglomerado', aqui: 't_i', lohr: 't_i', gutierrez: 't_{y,i}', r: 'tapply(y, id, sum)' },
        { concepto: 'Media por unidad (razón)', aqui: '\\hat{\\bar{y}}_r', lohr: '\\hat{\\bar{y}}_r', gutierrez: '\\hat{\\bar{y}}', r: 'svymean con pesos' },
        { concepto: 'Correlación intraclase', aqui: '\\rho,\\ R_a^2', lohr: 'ICC, R_a^2', gutierrez: '\\rho', r: '1 - MSW/S2' },
        { concepto: 'Efecto de diseño', aqui: '1 + (\\bar{M}-1)\\rho', lohr: '\\text{deff}', gutierrez: 'DEFF', r: 'deff=TRUE' },
        { concepto: 'π de dos etapas', aqui: '\\pi_k = \\frac{n}{N}\\frac{m_i}{M_i}', lohr: '\\pi_{j|i}\\,\\pi_i', gutierrez: '\\pi_k = \\pi_{Ii}\\pi_{k|i}', r: 'id=~psu+ssu' }
      ]
    };

    // ================================================================
    // Autoevaluación del capítulo 5
    // ================================================================
    AUTOEVALUACIONES['cap5'] = [
      {
        tipo: 'opcion',
        modulo: 1,
        pregunta: 'El capítulo 4 quería estratos bien distintos entre sí; este capítulo sufre cuando los conglomerados son internamente homogéneos. ¿Cuál es la formulación correcta de esa inversión?',
        pista: '¿Dónde corre el azar en cada diseño: dentro de los grupos o entre los grupos?',
        opciones: [
          { texto: 'En estratos, la varianza entre grupos la paga el diseñador y el azar solo corre dentro; en conglomerados, el azar corre entre grupos, así que la diferencia entre grupos se convierte en varianza.', correcta: true,
            retro: 'Exacto. La misma partición de la población juega a favor o en contra según qué nivel se sortee: es la lección estructural del par de capítulos.' },
          { texto: 'Los estratos siempre reducen varianza y los conglomerados siempre la aumentan, por definición.', correcta: false,
            retro: 'Casi, pero no por definición: con ICC = 0 el conglomerado empata con el MAS, y con ICC negativa (el sistemático) hasta gana. Lo que decide es dónde vive la heterogeneidad.' },
          { texto: 'Es una convención de notación: matemáticamente son el mismo diseño.', correcta: false,
            retro: 'Las π lo desmienten: en el estratificado todas las unidades tienen π > 0 en cada muestra posible; en el conglomerado, las unidades de los grupos no sorteados quedan con las π condicionales en cero.' },
          { texto: 'Los estratos son para poblaciones grandes y los conglomerados para pequeñas.', correcta: false,
            retro: 'El tamaño no es el criterio: el costo y el marco lo son. Se conglomera porque llegar a los grupos es caro o porque no existe lista de unidades finales.' }
        ]
      },
      {
        tipo: 'numerica',
        modulo: 2,
        pregunta: 'En schools (n = 10 de N = 75; m = 20), ¿qué peso final tiene un estudiante de la escuela con $M_i = 367$? Un decimal.',
        pista: 'El peso multiplica los de las dos etapas: $(N/n)\\cdot(M_i/m)$.',
        respuesta: 137.6,
        tolerancia: 0.11,
        retroAcierto: '$7{,}5 \\times 367/20 = 137{,}6$: habla por 137,6 estudiantes. La columna finalwt del archivo trae exactamente esto, y la cadena del módulo 2 lo comprueba.',
        retroFallo: 'Es $(75/10)\\cdot(367/20) = 7{,}5 \\times 18{,}35 = 137{,}6$. Si te dio un número menor que 1, calculaste π y no el peso, que es su recíproco: π aquí es chica por partida doble.'
      },
      {
        tipo: 'opcion',
        modulo: 3,
        pregunta: 'En el muestreo por conglomerados de una etapa, el estimador y su varianza se construyen sobre los totales $t_i$ de los conglomerados, no sobre las unidades. ¿Por qué?',
        pista: '¿Qué sorteó realmente el diseño?',
        opciones: [
          { texto: 'Porque lo que el azar sorteó fueron conglomerados: la muestra es un MAS de la población de los N totales, y toda la teoría del capítulo 2 aplica a esa población.', correcta: true,
            retro: 'Eso es. Dentro del conglomerado sorteado no hay azar (se censa): la única fuente de varianza es qué totales salieron. Reducción limpia al capítulo 2.' },
          { texto: 'Porque los totales son más fáciles de calcular que las medias.', correcta: false,
            retro: 'La facilidad no decide estimadores. Se usan los t_i porque son la unidad de información que el diseño realmente sorteó.' },
          { texto: 'Para evitar los pesos de muestreo.', correcta: false,
            retro: 'Los pesos siguen ahí (N/n por conglomerado); trabajar con totales no los elimina, los organiza.' },
          { texto: 'Porque las unidades individuales no se observan en este diseño.', correcta: false,
            retro: 'Se observan todas las de los conglomerados sorteados — precisamente por eso el total t_i se conoce exacto, sin estimarlo.' }
        ]
      },
      {
        tipo: 'numerica',
        modulo: 4,
        pregunta: 'Con aulas de $\\bar{M} = 25$ estudiantes y la ICC de algebra ($\\rho \\approx 0{,}04$), ¿cuánto vale el deff de Kish? Dos decimales.',
        pista: '$\\text{deff} = 1 + (\\bar{M}-1)\\rho$.',
        respuesta: 1.96,
        tolerancia: 0.02,
        retroAcierto: '$1 + 24 \\times 0{,}04 = 1{,}96$: cada aula de 25 rinde como unos 13 estudiantes independientes, y la muestra pierde casi la mitad de su información. Una ICC de «solo» 0,04 no tiene nada de inofensiva con conglomerados de ese tamaño.',
        retroFallo: 'Es $1 + (25-1)\\times 0{,}04 = 1{,}96$. El error típico es olvidar el −1: la primera unidad del conglomerado siempre informa completa; las repetidas son las que descuentan.'
      },
      {
        tipo: 'multiple',
        modulo: 5,
        pregunta: 'Sobre las nidadas de coots (volumen medio: razón 2,49; media ingenua 2,33), marca <strong>todo</strong> lo que sea cierto.',
        pista: '¿Qué población responde cada estimador, y qué papel juega la correlación entre $M_i$ y el volumen?',
        opciones: [
          { texto: 'La razón estima el volumen del huevo típico de la población de huevos; la ingenua, el del huevo de la nidada típica.', correcta: true },
          { texto: 'La brecha entre ambas no se cierra al aumentar el número de nidadas.', correcta: true },
          { texto: 'Con más nidadas, la media ingenua converge a la razón.', correcta: false },
          { texto: 'Si el volumen no dependiera del tamaño de la nidada, las dos casi coincidirían — como pasa con la longitud.', correcta: true }
        ],
        retroAcierto: 'Las tres verdaderas juntas son el módulo entero: parámetros distintos, brecha estable, y la correlación y–M como interruptor. La de la convergencia con más nidadas es el espejismo del «n grande salva», que no salva parámetros equivocados.',
        retroFallo: 'Son todas menos la de la convergencia con más nidadas. Eso es exactamente lo que NO pasa: cada estimador converge a SU parámetro, y la brecha entre parámetros no es asunto del tamaño muestral.'
      },
      {
        tipo: 'grafico',
        modulo: 1,
        alto: 240,
        descripcionGrafico: 'Dos histogramas de 10 000 réplicas de la media estimada: seis estados enteros frente a un MAS de 369 condados',
        pregunta: 'Las 10 000 réplicas del módulo 1. ¿Cuál histograma es el del diseño por estados, y qué número resume la diferencia?',
        pista: 'Los dos diseños observan ~370 condados por réplica. Solo uno deja que el azar elija DÓNDE están.',
        dibujar: canvas => {
          const E = D5.estados;
          const alto = Math.max(...E.cluster.conteo, ...E.mas.conteo) * 1.05;
          const g = crearGraficoXY(canvas, [
            serieHistograma(E.mas, 'diseño A', COLORES_GRAFICO.primario, 1e-3),
            serieHistograma(E.cluster, 'diseño B', COLORES_GRAFICO.secundario, 1e-3),
            serieVertical(E.media / 1000, alto, 'media verdadera', COLORES_GRAFICO.gris)
          ], { tituloX: 'media estimada (miles de acres)', tituloY: 'réplicas' });
          ejesEnEspanol(g, 0, 0);
          return g;
        },
        opciones: [
          { texto: 'El B (naranja), el disperso: mismo centro, treinta veces más varianza — deff ≈ 30.', correcta: true,
            retro: 'Correcto. Ambos son insesgados (mismo centro), pero 6 estados enteros dejan que el azar mueva bloques gigantes de condados parecidos: cada réplica se va con su suerte geográfica.' },
          { texto: 'El A (verde), porque los conglomerados concentran las réplicas.', correcta: false,
            retro: 'Al revés: concentran las OBSERVACIONES en pocos estados, y eso dispersa las ESTIMACIONES. El histograma angosto es el MAS.' },
          { texto: 'No se distinguen: con el mismo n, todos los diseños insesgados tienen la misma distribución.', correcta: false,
            retro: 'Ese es justo el mito que el par de capítulos 4–5 desmonta: el n no determina la varianza; el diseño sí. Aquí la razón de varianzas es 30 a 1 con el mismo n.' },
          { texto: 'El B, porque tiene el centro desplazado: el conglomerado sesga.', correcta: false,
            retro: 'Mira la línea de la media verdadera: los dos histogramas están centrados en ella. El conglomerado con pesos correctos dispersa, no sesga.' }
        ]
      },
      {
        tipo: 'opcion',
        modulo: 6,
        pregunta: 'En un diseño de dos etapas MAS-MAS, ¿qué le pasa a la π de un estudiante si su escuela es el doble de grande (con n, N y m fijos)?',
        pista: '$\\pi_k = (n/N)(m/M_i)$: ¿dónde entra $M_i$?',
        opciones: [
          { texto: 'Su π baja a la mitad — hay más compañeros entre quienes repartir las m plazas — y su peso sube al doble.', correcta: true,
            retro: 'Correcto, y es la semilla del capítulo 6: si en la PRIMERA etapa las escuelas grandes salieran con más probabilidad, los dos efectos podrían cancelarse y el diseño quedaría autoponderado. Eso es el PPT.' },
          { texto: 'Su π no cambia: la primera etapa no mira tamaños.', correcta: false,
            retro: 'La primera no, pero la segunda sí: m plazas entre M_i candidatos. El producto hereda esa dependencia.' },
          { texto: 'Su π sube: las escuelas grandes aportan más estudiantes a la muestra.', correcta: false,
            retro: 'Aportan los mismos m = 20 que las chicas — eso es lo que hace injusto al MAS de primera etapa con las grandes, y lo que el PPT del capítulo 6 corrige.' },
          { texto: 'Depende del total K de estudiantes.', correcta: false,
            retro: 'K ni se conoce ni hace falta: las π de este diseño solo usan n, N, m y el M_i de la propia escuela.' }
        ]
      },
      {
        tipo: 'opcion',
        modulo: 7,
        pregunta: 'En schools, la etapa 1 pone el 93,9 % de la varianza (módulo 7). Con presupuesto para 200 entrevistas más, ¿qué conviene?',
        pista: '¿Cuál de los dos sumandos quieres atacar?',
        opciones: [
          { texto: 'Sortear más escuelas, aunque signifique menos estudiantes por escuela.', correcta: true,
            retro: 'Sí: la varianza vive entre escuelas, y solo aumentar n la ataca. Es la regla práctica más citada del muestreo multietapa: conglomerados, cuantos más mejor; dentro de cada uno, lo justo.' },
          { texto: 'Subir de 20 a 40 estudiantes por escuela: duplica la muestra sin más desplazamientos.', correcta: false,
            retro: 'Duplica las entrevistas y solo ataca la parte de la etapa 2: el módulo 7 mide que pasar a 40 recorta un 3,3 % de la varianza. Barato y casi inútil: el clásico falso ahorro de las encuestas multietapa.' },
          { texto: 'Censar las 10 escuelas sorteadas.', correcta: false,
            retro: 'Es la versión extrema de la anterior: elimina por completo la varianza de la etapa 2, el 6,1 %. Te quedas con el 93,9 % intacto y sin presupuesto.' },
          { texto: 'Da igual: con el mismo total de entrevistas, la varianza es la misma.', correcta: false,
            retro: 'El módulo 1 enterró esa idea con deff 30: mismo n, varianzas radicalmente distintas. La composición n × m importa tanto como el producto.' }
        ]
      },
      {
        tipo: 'numerica',
        modulo: 8,
        pregunta: 'Con $c_1 = 50$, $c_2 = 2$ y una ICC de 0,5, ¿cuál es el $m$ óptimo? Entero.',
        pista: '$m^* = \\sqrt{c_1(1-\\rho)/(c_2\\rho)}$.',
        respuesta: 5,
        tolerancia: 0.3,
        retroAcierto: '$\\sqrt{50 \\times 0{,}5 / (2 \\times 0{,}5)} = \\sqrt{25} = 5$: con vecinos tan repetidos, cinco por conglomerado y a otra cosa. El bloque del módulo 8 calculó esta misma serie: 21,8 / 10,0 / 5,0 / 2,5 para ICC 0,05 / 0,2 / 0,5 / 0,8.',
        retroFallo: 'Es $\\sqrt{c_1(1-\\rho)/(c_2\\rho)} = \\sqrt{50\\cdot 0{,}5/(2\\cdot 0{,}5)} = 5$. Nota que el presupuesto C no aparece: C decide cuántos conglomerados, nunca cuánto excavar en cada uno.'
      },
      {
        tipo: 'multiple',
        modulo: 9,
        pregunta: 'Sobre el diseño combinado (región = estrato, estado = UPM), marca <strong>todo</strong> lo que sea cierto.',
        pista: 'Repasa qué aporta cada capa y el requisito técnico del módulo 9.',
        opciones: [
          { texto: 'Los estratos impiden que el azar concentre los 8 estados en una sola región.', correcta: true },
          { texto: 'Su varianza quedó en cerca de la mitad de la del conglomerado puro.', correcta: true },
          { texto: 'El diseño combinado elimina el efecto de conglomerado por completo.', correcta: false },
          { texto: 'Se necesitan al menos 2 UPM por estrato para poder estimar la varianza.', correcta: true }
        ],
        retroAcierto: 'Las tres verdaderas. La falsa es la ilusión a evitar: un deff de 21 sigue siendo caro — los estratos recortan la parte entre-regiones, pero dentro de cada región los estados siguen siendo bloques homogéneos. Y ojo con la segunda: frente a 8 estados sin estratos, el recorte de los estratos es de una cuarta parte; el resto es que se sortean 8 estados y no 6.',
        retroFallo: 'Son todas menos la de eliminar el efecto de conglomerado. Esa exagera: el combinado recorta la varianza casi a la mitad, no la elimina — la ICC dentro de las regiones sigue cobrando.'
      },
      {
        tipo: 'opcion',
        modulo: 10,
        pregunta: 'Un equipo evalúa un modelo con validación cruzada corriente sobre datos de 12 aulas y reporta métricas excelentes. El bloque del módulo 10 mostró que KFold partió las 12 aulas en los 4 pliegues. ¿Qué está pasando?',
        pista: '¿Qué «ven» los pliegues de entrenamiento sobre los estudiantes de prueba?',
        opciones: [
          { texto: 'Fuga por conglomerado: el modelo entrena con compañeros de aula de los estudiantes de prueba, y con ICC positiva eso infla las métricas. La partición correcta es por grupos (GroupKFold).', correcta: true,
            retro: 'Exacto — y es el análogo ML de estimar varianzas ignorando el diseño: números optimistas con aspecto impecable. GroupKFold es el submuestreo por conglomerados aplicado a la evaluación.' },
          { texto: 'Nada: la validación cruzada es válida con cualquier partición aleatoria.', correcta: false,
            retro: '«Aleatoria» no basta cuando los datos vienen agrupados: la independencia entre entrenamiento y prueba se rompe dentro de cada aula partida.' },
          { texto: 'El problema es el tamaño: con 299 observaciones no se puede hacer CV.', correcta: false,
            retro: 'Se puede de sobra; el problema no es cuántas observaciones sino cómo se reparten sus GRUPOS entre los pliegues.' },
          { texto: 'Habría que estratificar los pliegues por aula, como en el capítulo 4.', correcta: false,
            retro: 'Estratificar por aula REPARTIRÍA cada aula entre pliegues: es exactamente la fuga que hay que evitar. Con grupos, la herramienta es GroupKFold (grupos enteros a un lado), no StratifiedKFold.' }
        ]
      }
    ];
