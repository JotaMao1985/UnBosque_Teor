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
    // Las cifras de cuatro dígitos van sin separador, como pide la RAE y como
    // las escribe la prosa del capítulo (1600, 7124; 14 248).
    function fmtNum(x, d = 2) {
      if (!isFinite(x)) return '—';
      const s = Math.abs(x).toFixed(d);
      const partes = s.split('.');
      const entero = partes[0].length > 4
        ? partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F') : partes[0];
      return (x < 0 ? '−' : '') + entero + (partes[1] ? ',' + partes[1] : '');
    }

    function fmtPct(x, d = 1) { return fmtNum(100 * x, d) + ' %'; }

    // El gris de la plantilla (#94a3b8) no llega a 3:1 de contraste sobre
    // blanco: las líneas de referencia («t = 300», «total verdadero») y la
    // serie πᵇ de la escisión no se veían proyectadas.
    COLORES_GRAFICO.gris = '#64748b';

    // La leyenda de Chart.js toma el color de la primera barra, y aquí la
    // elegida se pinta de naranja o de rojo: la muestra de la leyenda cambiaba
    // de color con el estado. Se usa el de la serie (`colorLeyenda`) o, si no lo
    // trae, el de la mayoría de las barras. Las rectas de referencia salían
    // como una caja gris pálida: van con su color.
    const etiquetasLeyenda = Chart.defaults.plugins.legend.labels.generateLabels;
    Chart.defaults.plugins.legend.labels.generateLabels = chart =>
      etiquetasLeyenda(chart).map(item => {
        const ds = chart.data.datasets[item.datasetIndex];
        if (!ds) return item;
        let color = ds.colorLeyenda || null;
        if (!color && Array.isArray(ds.backgroundColor)) {
          const veces = {};
          ds.backgroundColor.forEach(c => { veces[c] = (veces[c] || 0) + 1; });
          color = Object.keys(veces).sort((a, b) => veces[b] - veces[a])[0];
        } else if (!color && ds.type === 'line' && !ds.fill) {
          color = ds.borderColor;
        }
        if (color) { item.fillStyle = color; item.strokeStyle = color; }
        return item;
      });

    // Decimales de un tooltip según el tamaño de la cifra.
    function decimalesPara(v) {
      const a = Math.abs(v);
      return a === 0 || a >= 100 ? 0 : (a >= 1 ? 2 : 4);
    }

    // Letra de proyección y tooltips en español. La plantilla pone 10–11 px en
    // los ejes y 12 en la leyenda, que proyectados en el aula no se leen; y los
    // tooltips de Chart.js escriben en el idioma del navegador y con hasta tres
    // decimales («479.991,464»). Un simulador puede reescribir después los
    // callbacks que necesite.
    function letraYTooltips(g, decX) {
      const tam = g.canvas.parentElement.clientWidth < 500 ? 12 : 13;
      // Las familias de la plantilla, escritas aquí: leer la fuente de las
      // opciones (un proxy de Chart.js) para copiarla hacía fallar a Chart.js.
      const cifras = { family: 'Fira Code', size: tam };
      const texto = { family: 'Montserrat', size: tam };
      const sc = g.options.scales;
      ['x', 'y'].forEach(e => {
        sc[e].ticks.font = cifras;
        if (sc[e].title) sc[e].title.font = texto;
      });
      const p = g.options.plugins;
      p.legend.labels.font = texto;
      p.tooltip.titleFont = texto;
      p.tooltip.bodyFont = cifras;
      const lineal = sc.x.type === 'linear';
      p.tooltip.callbacks = {
        title: items => {
          if (!items.length) return '';
          const it = items[0];
          if (lineal) return fmtNum(it.parsed.x, decX === undefined ? decimalesPara(it.parsed.x) : decX);
          const rotulo = g.data.labels[it.dataIndex];
          return Array.isArray(rotulo) ? rotulo.join(' · ') : String(rotulo);
        },
        label: ctx => (ctx.dataset.label ? ctx.dataset.label + ': ' : '') +
          fmtNum(ctx.parsed.y, decimalesPara(ctx.parsed.y))
      };
    }

    // Los gráficos de una caja «Para profundizar» (módulo 5) se crean con la
    // caja cerrada. Chrome los mide igual, pero un navegador que no maqueta el
    // contenido cerrado los deja con ancho 0: al abrir la caja se redimensionan.
    // `toggle` no burbujea; se escucha en la fase de captura.
    document.addEventListener('toggle', e => {
      const caja = e.target;
      if (!caja.matches || !caja.matches('details.profundizar') || !caja.open) return;
      caja.querySelectorAll('canvas').forEach(c => {
        const g = Chart.getChart(c);
        if (g) g.resize();
      });
    }, true);

    // Una fórmula en bloque que no cabe en su caja (a 375 px hay varias) se
    // desplaza de lado, pero nada lo anunciaba: se cortaba en el borde. Se le
    // pone una clase según por dónde sigue, y el CSS del ensamblador la
    // desvanece por ese lado. Las fórmulas aparecen al cargar cada módulo y al
    // abrir una caja plegada: se revisan tras cada cambio del DOM.
    function marcaDesborde(k) {
      const sobra = k.scrollWidth - k.clientWidth;
      const desborda = sobra > 1;
      k.classList.toggle('desborda', desborda);
      k.classList.toggle('al-final', desborda && k.scrollLeft >= sobra - 1);
      k.classList.toggle('en-medio', desborda && k.scrollLeft > 1 && k.scrollLeft < sobra - 1);
    }
    let esperaDesbordes = null;
    function pideDesbordes() {
      clearTimeout(esperaDesbordes);
      esperaDesbordes = setTimeout(() => document.querySelectorAll('.katex-display').forEach(marcaDesborde), 150);
    }
    new MutationObserver(pideDesbordes).observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', pideDesbordes);
    document.addEventListener('toggle', pideDesbordes, true);
    document.addEventListener('scroll', e => {
      if (e.target.classList && e.target.classList.contains('katex-display')) marcaDesborde(e.target);
    }, true);

    // Los ejes en el formato del curso, sea cual sea el idioma del navegador
    // (Chart.js usa el del navegador: en inglés salían «0.05» y «1,000», y en
    // español «1.000» junto a un eje sin formato), y sin que Chart.js esconda
    // rótulos de categoría en pantallas estrechas. Los constructores de la
    // plantilla no lo hacen; se arregla aquí, como en el cap. 5, sin tocar la
    // plantilla que comparten los demás.
    function ejesEnEspanol(g, decX, decY) {
      const x = g.options.scales.x, y = g.options.scales.y;
      if (x.type === 'linear') {
        x.ticks = Object.assign({}, x.ticks, { callback: v => fmtNum(v, decX) });
      } else {
        x.ticks = Object.assign({}, x.ticks, { autoSkip: false, maxRotation: 0 });
      }
      y.ticks = Object.assign({}, y.ticks, { callback: v => fmtNum(v, decY) });
      letraYTooltips(g, decX);
    }

    // Eje logarítmico: solo las potencias de diez. Los superíndices Unicode
    // (10³, 10⁶) salían a 11 px y proyectados no se leían: se escriben con
    // palabras hasta el millón y como «10^9» desde ahí.
    function ejeLogEnEspanol(g) {
      const NOMBRES = { 0: '1', 1: '10', 2: '100', 3: 'mil', 4: '10 mil', 5: '100 mil', 6: '1 millón' };
      const y = g.options.scales.y;
      y.ticks = Object.assign({}, y.ticks, {
        callback: v => {
          const e = Math.log10(v);
          if (Math.abs(e - Math.round(e)) > 1e-9) return '';
          const k = Math.round(e);
          return NOMBRES[k] !== undefined ? NOMBRES[k] : '10^' + k;
        }
      });
      letraYTooltips(g);
    }
    function topeLog(maximo) { return Math.pow(10, Math.ceil(Math.log10(maximo) - 1e-9)); }

    function multiploDe(paso, k) { return Number((k * paso).toFixed(10)); }

    // Un paso «bonito» (1, 2, 2,5 o 5 por potencia de 10) y sus decimales.
    function pasoBonito(bruto) {
      const pot = Math.pow(10, Math.floor(Math.log10(bruto)));
      const paso = [1, 2, 2.5, 5, 10].map(f => f * pot).find(p => p >= bruto);
      const dec = Math.max(0, -Math.floor(Math.log10(paso) + 1e-9)) + (paso / pot === 2.5 ? 1 : 0);
      return { paso, dec };
    }

    // Un tope de eje redondo para un máximo cualquiera, con sus marcas: así el
    // eje no enseña el flotante crudo (38,8, 77,6, 0,28).
    function topeBonito(g, maximo) {
      const { paso, dec } = pasoBonito(maximo / 5);
      g.options.scales.y.max = multiploDe(paso, Math.ceil(maximo / paso - 1e-9));
      g.options.scales.y.ticks.stepSize = paso;
      g.options.scales.y.ticks.callback = v => fmtNum(v, dec);
    }

    // La plantilla escribe la cifra del deslizador con toFixed (punto
    // decimal). Este oyente se registra después del suyo, así que corre
    // después y la reescribe con coma.
    function comaEnDeslizadores(inputs, decimales) {
      Object.keys(decimales).forEach(clave => {
        const input = inputs[clave];
        const salida = input.parentElement.querySelector('output');
        const pinta = () => { salida.textContent = fmtNum(parseFloat(input.value), decimales[clave]); };
        input.addEventListener('input', pinta);
        pinta();
      });
    }

    // ---------------------------------------------------------------
    // M1 · Cuatro muestras posibles, dos sorteos
    // ---------------------------------------------------------------
    SIMULADORES['psi-enumeracion'] = function (raiz) {
      const T = D6.tiendas;
      const params = { mostrar: 'ppt' };
      const lienzo = raiz.querySelector('canvas');
      const SORTEOS = [
        { valor: 'ppt', texto: 'ψ proporcional al área' },
        { valor: 'igual', texto: 'probabilidades iguales' },
        { valor: 'ambos', texto: 'los dos sorteos' }
      ];

      const g = crearGraficoBarras(lienzo, T.nombres, T.estPpt, {
        etiqueta: 'ψ ∝ área', color: COLORES_GRAFICO.primario, min: 0, max: 1000,
        lineas: [{ valor: T.total, etiqueta: 't = 300', color: COLORES_GRAFICO.gris }]
      });
      ejesEnEspanol(g, 0, 0);
      topeBonito(g, 1000);
      const [principal, linea] = g.data.datasets;
      const extra = {
        type: 'bar', label: 'ψ iguales', data: T.estIgual,
        backgroundColor: COLORES_GRAFICO.secundario, borderWidth: 0,
        barPercentage: 0.4, categoryPercentage: 0.9, order: 2
      };
      // La muestra más alejada del total verdadero, en cada sorteo
      const peor = est => est.reduce((m, v, i) =>
        Math.abs(v - T.total) > Math.abs(est[m] - T.total) ? i : m, 0);
      const iP = peor(T.estPpt), iI = peor(T.estIgual);
      const textoP = T.nombres[iP] + ' (t̂ = ' + fmtNum(T.estPpt[iP], 0) + ') con ψ ∝ área';
      const textoI = T.nombres[iI] + ' (t̂ = ' + fmtNum(T.estIgual[iI], 0) + ') con ψ iguales';

      function pintar() {
        principal.label = params.mostrar === 'igual' ? 'ψ iguales' : 'ψ ∝ área';
        principal.data = params.mostrar === 'igual' ? T.estIgual : T.estPpt;
        g.data.datasets = params.mostrar === 'ambos' ? [principal, extra, linea] : [principal, linea];
        g.update('none');

        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'mostrando:', valor: SORTEOS.find(s => s.valor === params.mostrar).texto },
          { etiqueta: 'E(t̂) en ambos sorteos:', valor: fmtNum(T.total, 0) + ' (insesgados)' },
          { etiqueta: 'V con ψ ∝ área:', valor: fmtNum(T.vPpt, 0) },
          { etiqueta: 'V con ψ iguales:', valor: fmtNum(T.vIgual, 0) },
          { etiqueta: 'razón de varianzas:', valor: fmtNum(T.vIgual / T.vPpt, 1) + ' a 1' },
          { etiqueta: 'la más alejada de t = 300:',
            valor: params.mostrar === 'ppt' ? textoP : (params.mostrar === 'igual' ? textoI : textoP + '; ' + textoI) }
        ]);
      }

      crearSelector(raiz.querySelector('.simulador-controles'),
        { clave: 'mostrar', etiqueta: 'Sorteo', opciones: SORTEOS }, params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M2 · La distribución exacta del HH con n = 2
    // ---------------------------------------------------------------
    SIMULADORES['hh-exacto'] = function (raiz) {
      const T = D6.tiendas;
      const params = { sorteo: 'ppt' };
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
      ejesEnEspanol(g, 0, 2);

      function stems(xs, ps, etiqueta, color) {
        return {
          type: 'bar', label: etiqueta, data: xs.map((x, i) => ({ x: x, y: ps[i] })),
          backgroundColor: color, barThickness: 7, borderWidth: 0
        };
      }

      function pintar() {
        const datasets = [];
        if (params.sorteo !== 'igual') {
          datasets.push(stems(D6.hh.valores, D6.hh.probs, 'ψ ∝ área', COLORES_GRAFICO.primario));
        }
        if (params.sorteo !== 'ppt') {
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
          { etiqueta: 'V exacta ψ ∝ área:', valor: fmtNum(D6.hh.V, 0) + ' (error estándar ' + fmtNum(D6.hh.se, 1) + ')' },
          { etiqueta: 'V exacta ψ iguales:', valor: fmtNum(vIgual, 0) },
          { etiqueta: 'con n = 2, V = V(n=1)/2:', valor: fmtNum(T.vPpt, 0) + ' / 2 = ' + fmtNum(T.vPpt / 2, 0) }
        ]);
      }

      crearSelector(raiz.querySelector('.simulador-controles'), {
        clave: 'sorteo', etiqueta: 'Sorteo', opciones: [
          { valor: 'ppt', texto: 'ψ proporcional al área' },
          { valor: 'igual', texto: 'probabilidades iguales' },
          { valor: 'ambos', texto: 'los dos sorteos' }
        ]
      }, params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M3 · El sorteo por dentro: acumulativo y Lahiri
    // ---------------------------------------------------------------
    SIMULADORES['seleccion'] = function (raiz) {
      const T = D6.tiendas;
      const params = { metodo: 'acumulativo', u: 800, candidata: 4, u2: 500 };
      const lienzo = raiz.querySelector('canvas');
      const acum = T.acumulado;                       // [100, 300, 600, 1600]
      const xMax = Math.max(...T.m2);                 // 1000, la tienda D
      // En el acumulativo cada barra flota sobre su tramo, de T_(k-1) a T_k;
      // en Lahiri sale del 0 y mide el área. La recta es el uniforme u: sale la
      // tienda cuyo tramo corta (acumulativo), o la candidata si u no pasa de
      // su barra (Lahiri).
      const tramos = acum.map((a, i) => [i === 0 ? 0 : acum[i - 1], a]);

      const g = crearGraficoBarras(lienzo, T.nombres, tramos, {
        etiqueta: 'tramo de cada tienda', color: COLORES_GRAFICO.primario, min: 0, max: 1600,
        lineas: [{ valor: params.u, etiqueta: 'u', color: COLORES_GRAFICO.terciario }]
      });
      ejesEnEspanol(g, 0, 0);
      const [barras, recta] = g.data.datasets;
      recta.borderDash = [];
      recta.borderWidth = 2.5;
      barras.barPercentage = 0.7;
      g.options.plugins.tooltip.callbacks.label = ctx => ctx.datasetIndex === 1
        ? 'u = ' + fmtNum(ctx.parsed.y, 0)
        : (Array.isArray(ctx.raw) ? 'tramo de ' + fmtNum(ctx.raw[0], 0) + ' a ' + fmtNum(ctx.raw[1], 0)
          : 'área: ' + fmtNum(ctx.raw, 0) + ' m²');

      function pintar() {
        const acumulativo = params.metodo === 'acumulativo';
        let colores, lectura;
        if (acumulativo) {
          const sel = acum.findIndex(a => params.u <= a);
          colores = T.nombres.map((_, i) => i === sel ? '#FF6600' : '#012820');
          barras.data = tramos;
          barras.label = 'tramo de cada tienda (m² acumulados)';
          recta.data = Array(4).fill(params.u);
          recta.label = 'u, entre 0 y 1600';
          g.options.scales.y.max = 1600;
          g.options.scales.y.ticks.stepSize = 400;
          lectura = [
            { etiqueta: 'método:', valor: 'acumulativo' },
            { etiqueta: 'uniforme u:', valor: fmtNum(params.u, 0) + ' de 1600' },
            { etiqueta: 'cae en el tramo:', valor: 'de ' + fmtNum(tramos[sel][0], 0) + ' a ' +
              fmtNum(tramos[sel][1], 0) + ' → sale ' + T.nombres[sel] },
            { etiqueta: 'ψ de esa tienda:', valor: fmtNum(T.psi[sel], 4) + ', la longitud de su tramo entre 1600' },
            { etiqueta: 'D ocupa:', valor: fmtPct(T.psi[3], 1) + ' del segmento' }
          ];
        } else {
          const i = params.candidata - 1;
          const acepta = params.u2 <= T.m2[i];
          colores = T.nombres.map((_, k) => k === i ? (acepta ? '#FF6600' : '#DC2626') : '#012820');
          barras.data = T.m2;
          barras.label = 'área (m²)';
          recta.data = Array(4).fill(params.u2);
          recta.label = 'u, entre 0 y ' + fmtNum(xMax, 0);
          g.options.scales.y.max = xMax;
          g.options.scales.y.ticks.stepSize = 200;
          lectura = [
            { etiqueta: 'método:', valor: 'Lahiri (rechazo)' },
            { etiqueta: 'candidata sorteada:', valor: T.nombres[i] + ' (área ' + fmtNum(T.m2[i], 0) + ')' },
            { etiqueta: 'uniforme u entre 0 y el área máxima (' + fmtNum(xMax, 0) + '):', valor: fmtNum(params.u2, 0) },
            { etiqueta: 'decisión:', valor: acepta ? '<strong>aceptada</strong>: u no pasa del área de la candidata'
              : '<strong>rechazada</strong>: u pasa del área, y se sortea otra candidata' },
            { etiqueta: 'P(aceptar | candidata ' + T.nombres[i] + '):', valor: fmtNum(T.m2[i] / xMax, 3) },
            { etiqueta: 'intentos promedio del método:', valor: fmtNum(D6.seleccion.intentosTeoricos, 2) }
          ];
        }
        barras.backgroundColor = colores;
        // Los deslizadores del otro método no hacen nada: se esconden.
        [inputs.u].forEach(c => { c.parentElement.style.display = acumulativo ? '' : 'none'; });
        [inputs.candidata, inputs.u2].forEach(c => { c.parentElement.style.display = acumulativo ? 'none' : ''; });
        g.update('none');
        actualizarLectura(raiz.querySelector('.simulador-lectura'), lectura);
      }

      const controles = raiz.querySelector('.simulador-controles');
      crearSelector(controles, {
        clave: 'metodo', etiqueta: 'Método', opciones: [
          { valor: 'acumulativo', texto: 'acumulativo' },
          { valor: 'lahiri', texto: 'Lahiri (rechazo)' }
        ]
      }, params, pintar);
      const inputs = crearControles(controles, [
        { clave: 'u', etiqueta: 'Uniforme u del acumulativo (de 0 a 1600)', min: 1, max: 1600, paso: 1 },
        { clave: 'candidata', etiqueta: 'Lahiri: tienda candidata (1 = A … 4 = D)', min: 1, max: 4, paso: 1 },
        { clave: 'u2', etiqueta: 'Lahiri: uniforme u (de 0 a 1000)', min: 1, max: 1000, paso: 1 }
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

      // Rótulo en dos líneas: la muestra y el HT que da si sale (sin
      // decimales: a 375 px, «t̂ = 77,3» se pisaba con el vecino).
      const rotulos = E.muestras.map((m, i) => [m, fmtNum(E.ht[i], 0)]);
      const g = crearGraficoBarras(lienzo, rotulos, E.pS, {
        etiqueta: 'p(s)', color: COLORES_GRAFICO.primario, min: 0, max: 0.3,
        tituloX: 'muestra y el t̂ que da si sale'
      });
      ejesEnEspanol(g, 0, 2);
      topeBonito(g, 0.3);
      // «AC,82» se leía como un decimal: el título dice qué es cada cosa.
      g.options.plugins.tooltip.callbacks.title = items => items.length
        ? 'muestra ' + E.muestras[items[0].dataIndex] + ', t̂ = ' + fmtNum(E.ht[items[0].dataIndex], 1) : '';

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
    // ---------------------------------------------------------------
    // M5 · El criterio de Raj a la vista: la nube de los estados y la
    // recta de y sobre la población (genera_cap6.R, sección 6b)
    // ---------------------------------------------------------------
    SIMULADORES['raj-recta'] = function (raiz) {
      const R = D6.raj;
      const params = { variable: 'counties' };
      const lienzo = raiz.querySelector('canvas');
      const VARS = [
        { clave: 'counties', nombre: 'counties (nº de condados)', eje: 'condados', escala: 1 },
        { clave: 'waterarea', nombre: 'waterarea (km² de agua)', eje: 'km² de agua', escala: 1 },
        { clave: 'pop', nombre: 'pop2019 (la medida de tamaño)', eje: 'población (millones)', escala: 1e6 }
      ];
      const xM = R.x.map(v => v / 1e6);
      const xMax = Math.max(...xM);

      const g = crearGraficoXY(lienzo, [], { tituloX: 'población de 2019 (millones)', xMin: 0 });
      ejesEnEspanol(g, 0, 0);
      const laVariable = () => VARS.find(v => v.clave === params.variable);
      g.options.plugins.tooltip.callbacks = {
        title: () => '',
        label: ctx => ctx.datasetIndex === 0
          ? R.estados[ctx.dataIndex] + ': ' + fmtNum(ctx.parsed.x, 1) + ' M hab., ' +
            fmtNum(ctx.parsed.y, laVariable().escala > 1 ? 1 : 0)
          : ctx.dataset.label
      };

      function pintar() {
        const v = laVariable();
        const V = R[v.clave];
        const k = v.escala;
        g.data.datasets = [
          { type: 'scatter', label: 'estados', data: xM.map((x, i) => ({ x: x, y: V.y[i] / k })),
            backgroundColor: COLORES_GRAFICO.primario + 'b3', borderColor: COLORES_GRAFICO.primario,
            pointRadius: 3.5 },
          { type: 'line', label: 'recta de mínimos cuadrados',
            data: [{ x: 0, y: V.a / k }, { x: xMax, y: (V.a + V.b * xMax * 1e6) / k }],
            borderColor: COLORES_GRAFICO.secundario, borderWidth: 2, pointRadius: 0, fill: false },
          { type: 'scatter', label: 'corte con el eje', data: [{ x: 0, y: V.a / k }],
            backgroundColor: COLORES_GRAFICO.secundario, borderColor: COLORES_GRAFICO.secundario,
            pointStyle: 'rectRot', pointRadius: 7, clip: false }
        ];
        g.options.scales.y.title.display = true;
        g.options.scales.y.title.text = v.eje;
        g.update('none');

        const razon = V.vPpt / V.vMras;
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'variable:', valor: v.nombre },
          { etiqueta: 'la recta corta el eje en:', valor: fmtNum(V.a / k, k > 1 ? 1 : 0) +
            ' (el ' + fmtNum(100 * V.a / V.media, 0) + ' % de la media)' },
          { etiqueta: 'corr(x, y):', valor: fmtNum(V.corXY, 3) },
          { etiqueta: 'corr(x, y²/x), la que cuenta:', valor: fmtNum(V.corXY2X, 3) },
          { etiqueta: 'V del PPT / V del MAS con reemplazo (n = 10):', valor: fmtNum(razon, 2) },
          { etiqueta: 'criterio de Raj:', valor: V.dif > 0 ? 'covarianza positiva: gana el PPT'
            : 'covarianza negativa: pierde el PPT' }
        ]);
      }

      crearSelector(raiz.querySelector('.simulador-controles'), {
        clave: 'variable', etiqueta: 'Variable de interés',
        opciones: VARS.map(v => ({ valor: v.clave, texto: v.nombre }))
      }, params, pintar);
      pintar();
      return [g];
    };

    SIMULADORES['ppt-mc'] = function (raiz) {
      const params = { variable: 'counties' };
      const lienzo = raiz.querySelector('canvas');
      const VARS = [
        { clave: 'counties', nombre: 'counties (nº de condados)' },
        { clave: 'waterarea', nombre: 'waterarea (km² de agua)' },
        { clave: 'pop', nombre: 'pop2019 (la medida de tamaño)' }
      ];

      const g = crearGraficoXY(lienzo, [], {
        tituloX: 'HT del total', tituloY: 'réplicas por caja'
      });
      ejesEnEspanol(g, 0, 0);
      // Con waterarea y pop2019 los totales tienen 8 y 9 cifras: el eje va en
      // millones, y con pocas marcas a 375 px, para que los rótulos no se pisen.
      g.options.scales.x.ticks.maxTicksLimit = lienzo.parentElement.clientWidth < 500 ? 5 : 10;

      const laVariable = () => VARS.find(v => v.clave === params.variable);

      function pintar() {
        const V = D6.statepps[params.variable];
        const alto = Math.max(...V.pps.conteo, ...V.mas.conteo) * 1.05;
        g.data.datasets = [
          serieHistograma(V.pps, 'πPT sistemático', COLORES_GRAFICO.primario),
          serieHistograma(V.mas, 'MAS sin reemplazo', COLORES_GRAFICO.secundario),
          serieVertical(V.total, alto, 'total verdadero', COLORES_GRAFICO.gris)
        ];
        const maxX = Math.max(...g.data.datasets.flatMap(d => d.data.map(p => Math.abs(p.x))));
        const escala = maxX >= 1e6 ? 1e6 : 1;
        g.options.scales.x.ticks.callback = v => fmtNum(v / escala, Number.isInteger(v / escala) ? 0 : 1);
        g.options.scales.x.title.text = escala > 1 ? 'HT del total (millones)' : 'HT del total';
        g.options.scales.x.min = undefined; g.options.scales.x.max = undefined;
        g.update('none');

        const deff = V.vPps / V.vMas;
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'variable:', valor: laVariable().nombre },
          { etiqueta: 'corr(variable, tamaño):', valor: fmtNum(V.corr, 3) },
          { etiqueta: 'error estándar del πPT (10 000 réplicas):', valor: fmtNum(Math.sqrt(V.vPps), 0) },
          { etiqueta: 'error estándar del MAS sin reemplazo (mismas réplicas):', valor: fmtNum(Math.sqrt(V.vMas), 0) },
          { etiqueta: 'deff del πPT frente al MAS sin reemplazo:', valor: deff < 0.001 ? '≈ 0: la varianza se anula' : fmtNum(deff, 2) },
          { etiqueta: 'veredicto:', valor: deff < 1 ? 'gana πPT' : 'gana el MAS sin reemplazo: la correlación no alcanza' }
        ]);
      }

      crearSelector(raiz.querySelector('.simulador-controles'), {
        clave: 'variable', etiqueta: 'Variable de interés',
        opciones: VARS.map(v => ({ valor: v.clave, texto: v.nombre }))
      }, params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M5 · La escisión de soporte mínimo, etapa por etapa (Gutiérrez,
    // ej. 4.4.2; las etapas las calcula genera_cap6.R, sección 11)
    // ---------------------------------------------------------------
    SIMULADORES['escision'] = function (raiz) {
      const E = D6.escision;
      const T = E.etapas.length;
      const params = { etapa: 1 };
      const lienzo = raiz.querySelector('canvas');
      const enMuestra = v => E.nombres.filter((_, k) => v[k] === 1).join(', ');

      const g = crearGraficoBarras(lienzo, E.nombres, E.etapas[0].antes, {
        etiqueta: 'π al empezar la etapa', color: COLORES_GRAFICO.primario, min: 0, max: 1,
        barrasExtra: [{ etiqueta: 'π si no se cierra (πᵇ)', valores: E.etapas[0].pb, color: COLORES_GRAFICO.gris }]
      });
      ejesEnEspanol(g, 0, 1);
      // En la etapa 4 entran tres de cinco: las naranjas son mayoría.
      g.data.datasets[0].colorLeyenda = COLORES_GRAFICO.primario;

      // En la última etapa, las cinco muestras y la comprobación de que juntas
      // reproducen las π del principio (Σ p(s) sobre las muestras con k = π_k).
      const tabla = document.createElement('div');
      tabla.style.overflowX = 'auto';
      raiz.querySelector('.simulador-lectura').after(tabla);
      const conK = E.nombres.map(n => E.soporte.reduce((a, s) => a + (s.muestra.includes(n) ? s.prob : 0), 0));
      const htmlSoporte =
        '<p class="text-sm" style="margin:1rem 0 0.5rem;">Las cinco muestras posibles. Para cada persona, la suma ' +
        'de las probabilidades de las muestras en que está es su π del principio.</p>' +
        '<table><thead><tr><th scope="col">Muestra</th><th scope="col">p(s)</th>' +
        E.nombres.map(n => '<th scope="col">' + n + '</th>').join('') + '</tr></thead><tbody>' +
        E.soporte.map((s, j) => '<tr><td>' + (j + 1) + '</td><td>' + fmtNum(s.prob, 4) + '</td>' +
          E.nombres.map(n => '<td>' + (s.muestra.includes(n) ? '✓' : '') + '</td>').join('') + '</tr>').join('') +
        '<tr><td colspan="2"><strong>Suma de sus muestras</strong></td>' +
        conK.map(v => '<td>' + fmtNum(v, 4) + '</td>').join('') + '</tr>' +
        '<tr><td colspan="2"><strong>π al empezar</strong></td>' +
        E.pi.map(v => '<td>' + fmtNum(v, 4) + '</td>').join('') + '</tr></tbody></table>';

      function pintar() {
        const e = E.etapas[params.etapa - 1];
        g.data.datasets[0].data = e.antes;
        // las que entran en la muestra si la etapa se cierra, en naranja
        g.data.datasets[0].backgroundColor = e.pa.map(v => v === 1 ? COLORES_GRAFICO.secundario : COLORES_GRAFICO.primario);
        g.data.datasets[1].data = e.pb;
        g.update('none');

        const quedaba = e.prob / e.lambda;
        const lectura = [
          { etiqueta: 'etapa:', valor: fmtNum(params.etapa, 0) + ' de ' + fmtNum(T, 0) },
          { etiqueta: 'orden fijo, el de la etapa 1:', valor: E.nombres.join(', ') +
            ' (van a 0 las primeras sin decidir, aunque su π ya no sea la menor)' },
          { etiqueta: 'λ, probabilidad de cerrar aquí:', valor: fmtNum(e.lambda, 4) },
          { etiqueta: 'si se cierra, la muestra es:', valor: enMuestra(e.pa) + ' (en naranja)' },
          { etiqueta: 'probabilidad de esa muestra:', valor: fmtNum(e.lambda, 4) + ' × ' + fmtNum(quedaba, 4) +
            ' (lo que llegó a esta etapa) = ' + fmtNum(e.prob, 4) },
          { etiqueta: 'si no (1 − λ):', valor: 'se sigue con las barras grises' }
        ];
        if (params.etapa === T) {
          const ultima = E.soporte[T];
          lectura.push({ etiqueta: 'y la última muestra:', valor: ultima.muestra.join(', ') + ', con ' + fmtNum(ultima.prob, 4) });
          lectura.push({ etiqueta: 'muestras posibles en total:', valor: fmtNum(E.soporte.length, 0) +
            ' (sus probabilidades suman 1)' });
        }
        actualizarLectura(raiz.querySelector('.simulador-lectura'), lectura);
        tabla.innerHTML = params.etapa === T ? htmlSoporte : '';
      }

      crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'etapa', etiqueta: 'Etapa', min: 1, max: T, paso: 1 }
      ], params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M6 · La distribución del tamaño de muestra (Poisson-binomial exacta)
    // ---------------------------------------------------------------
    SIMULADORES['poisson-n'] = function (raiz) {
      const params = { factor: 1 };
      const lienzo = raiz.querySelector('canvas');
      const piBase = D6.statepps.pi;

      const g = crearGraficoBarras(lienzo, [], [], {
        etiqueta: 'P(n = k) exacta', color: COLORES_GRAFICO.primario, min: 0, max: 0.45
      });
      ejesEnEspanol(g, 0, 2);
      g.options.scales.x.ticks.autoSkip = true;     // hasta 26 valores de n: que salte rótulos

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
        topeBonito(g, Math.max(0.2, Math.max(...pn) * 1.1));
        g.update('none');

        // k = E(n) redondeado: con E(n) no entero, «a una unidad de k» no es
        // «a una unidad de E(n)», y el rótulo dice lo que de verdad se suma.
        const kEsp = Math.round(En);
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'factor sobre las π:', valor: fmtNum(params.factor, 2) +
            (params.factor > 1 ? ' (las π que pasan de 1 se truncan)' : '') },
          { etiqueta: 'E(n) = Σπ:', valor: fmtNum(En, 2) },
          { etiqueta: 'desviación de n:', valor: fmtNum(Math.sqrt(Vn), 2) },
          { etiqueta: 'cv = desviación / E(n):', valor: fmtPct(Math.sqrt(Vn) / En, 0) },
          { etiqueta: 'P(n = ' + kEsp + '):', valor: fmtNum(pn[kEsp] || 0, 3) },
          { etiqueta: 'P(' + (kEsp - 1) + ' ≤ n ≤ ' + (kEsp + 1) + '):',
            valor: fmtNum((pn[kEsp - 1] || 0) + (pn[kEsp] || 0) + (pn[kEsp + 1] || 0), 3) },
          { etiqueta: 'forzosas (π = 1):', valor: fmtNum(pi.filter(p => p === 1).length, 0) }
        ]);
      }

      const inputs = crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'factor', etiqueta: 'Factor de escala de las π', min: 0.3, max: 1.5, paso: 0.05 }
      ], params, pintar);
      comaEnDeslizadores(inputs, { factor: 2 });
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
        etiqueta: 'aporte a V (SYG)', color: COLORES_GRAFICO.primario, min: 0, max: Math.max(...aportes) * 1.1
      });
      ejesEnEspanol(g, 0, 0);
      topeBonito(g, Math.max(...aportes) * 1.1);

      function pintar() {
        const i = params.par - 1;
        const [k, l] = pares[i];
        g.data.datasets[0].backgroundColor = pares.map((_, j) => j === i ? '#FF6600' : '#012820');
        g.update('none');

        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'par:', valor: T.nombres[k] + '–' + T.nombres[l] },
          { etiqueta: 'π<sub>k</sub> · π<sub>l</sub>:', valor: fmtNum(E.piK[k] * E.piK[l], 4) },
          { etiqueta: 'π<sub>kl</sub>:', valor: fmtNum(E.piKl[k][l], 4) },
          { etiqueta: 'exclusión π<sub>k</sub>π<sub>l</sub> − π<sub>kl</sub>:', valor: fmtNum(E.piK[k] * E.piK[l] - E.piKl[k][l], 4) },
          { etiqueta: 'diferencia de cocientes (y<sub>k</sub>/π<sub>k</sub> − y<sub>l</sub>/π<sub>l</sub>)²:', valor: fmtNum(Math.pow(d[k] - d[l], 2), 0) },
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
      // El JSON guarda las π con 8 decimales, y con y²/π eso mueve V en la 7.ª
      // cifra: se recalculan desde x (π = n·x/Σx; genera_cap6.R comprueba que
      // ninguna se trunca), para que la V inicial sea la del bloque R12.
      const sumaX = E.x.reduce((a, b) => a + b, 0);
      const piBase = E.x.map(v => E.n * v / sumaX);
      const params = { piE: piBase[19] };
      const lienzo = raiz.querySelector('canvas');
      const etiquetas = E.y.map((_, i) => i + 1);

      const g = crearGraficoBarras(lienzo, etiquetas, E.y.map(() => 1), {
        etiqueta: 'aporte (1/π − 1)·y² a V', color: COLORES_GRAFICO.primario, min: 0.1, max: 1e11,
        tituloX: 'negocio (el 20 es el elefante)'
      });
      g.options.scales.y.type = 'logarithmic';
      g.options.scales.y.min = 10;
      ejeLogEnEspanol(g);
      // Rótulos 1, 5, 10, 15 y 20: caben a 375 px y el elefante queda rotulado
      g.options.scales.x.ticks = Object.assign({}, g.options.scales.x.ticks, {
        autoSkip: false, maxRotation: 0,
        callback: (v, i) => [0, 4, 9, 14, 19].includes(i) ? String(i + 1) : ''
      });

      function pintar() {
        const pi = piBase.slice();
        pi[19] = params.piE;
        const aportes = pi.map((p, i) => (1 / p - 1) * E.y[i] * E.y[i]);
        const V = aportes.reduce((a, b) => a + b, 0);
        g.data.datasets[0].data = aportes;
        g.data.datasets[0].backgroundColor = etiquetas.map((_, i) => i === 19 ? '#FF6600' : '#012820');
        g.options.scales.y.max = topeLog(Math.max(1e10, Math.max(...aportes) * 1.5));
        g.update('none');

        const VBase = piBase.map((p, i) => (1 / p - 1) * E.y[i] * E.y[i]).reduce((a, b) => a + b, 0);
        const parte = aportes[19] / V;
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'π del elefante:', valor: fmtNum(params.piE, 3) + ' (por su área le tocaba ' +
            fmtNum(piBase[19], 3) + ')' },
          { etiqueta: 'su y:', valor: fmtNum(E.yElefante, 0) + ' — el ' + fmtPct(E.yElefante / E.totalY, 0) + ' del total' },
          { etiqueta: 'V total del HT (Poisson):', valor: fmtNum(V, 0) },
          { etiqueta: 'el elefante aporta:', valor: fmtPct(aportes[19] / V, 2) },
          { etiqueta: 'frente a la V con su π de área:', valor: fmtNum(V / VBase, 2) + '×' },
          { etiqueta: 'diagnóstico:', valor: params.piE < 0.03 ? 'π mínima con y enorme: la varianza explota'
            : (parte > 0.5
              ? (params.piE >= 0.5 ? 'V baja mucho, pero el elefante aún aporta más de la mitad: solo π = 1 anula su término'
                : 'π pequeña para su y: el elefante aporta más de la mitad de V')
              : 'el elefante ya aporta menos de la mitad de V') }
        ]);
      }

      const inputs = crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'piE', etiqueta: 'π del elefante', min: 0.005, max: 0.9, paso: 0.005 }
      ], params, pintar);
      comaEnDeslizadores(inputs, { piE: 3 });
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M9 · La cancelación del autoponderado, en vivo
    // ---------------------------------------------------------------
    SIMULADORES['autoponderado'] = function (raiz) {
      const C = D6.classpps;
      const params = { diseno: 'ppt', m: 4 };
      const lienzo = raiz.querySelector('canvas');
      const etiquetas = C.tamanos.map((_, i) => String(i + 1));

      const g = crearGraficoBarras(lienzo, etiquetas, C.tamanos, {
        etiqueta: 'peso final de un estudiante', color: COLORES_GRAFICO.primario, min: 0, max: 40,
        tituloX: 'clase del marco'
      });
      ejesEnEspanol(g, 0, 0);
      g.options.scales.x.ticks.maxRotation = 90;    // a 375 px, 15 rótulos se pegaban: que giren

      function pintar() {
        const n = 5;
        const ppt = params.diseno === 'ppt';
        const pesos = C.tamanos.map(Mi => ppt
          ? C.K / (n * params.m)                       // PPT: (K/(n Mi)) · (Mi/m)
          : (C.Nclases / n) * Mi / params.m);          // iguales: (N/n) · (Mi/m)
        g.data.datasets[0].data = pesos;
        g.data.datasets[0].label = ppt ? 'PPT + m fijo (autoponderado)' : 'iguales + m fijo';
        topeBonito(g, Math.max(...pesos) * 1.1);
        g.update('none');

        const maxP = Math.max(...pesos), minP = Math.min(...pesos);
        const Mmax = Math.max(...C.tamanos), Mmin = Math.min(...C.tamanos);
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'primera etapa:', valor: ppt ? 'PPT: ψ<sub>i</sub> = M<sub>i</sub>/' + C.K : 'probabilidades iguales (1/' + C.Nclases + ')' },
          { etiqueta: 'submuestreo:', valor: 'm = ' + params.m + ' por clase' },
          { etiqueta: 'peso mínimo / máximo:', valor: fmtNum(minP, 2) + ' / ' + fmtNum(maxP, 2) },
          { etiqueta: 'peso mayor entre peso menor:', valor: fmtNum(maxP / minP, 2) + (ppt ? ': todos iguales'
            : ', la clase de ' + Mmax + ' frente a la de ' + Mmin + ', la mayor y la menor del marco') },
          { etiqueta: 'fórmula del peso:', valor: ppt ? 'w = K/(n·m) = ' +
            fmtNum(C.K / (5 * params.m), 2) + ', el M<sub>i</sub> se cancela' : 'w = (N/n)·M<sub>i</sub>/m: crece con M<sub>i</sub>' }
        ]);
      }

      const controles = raiz.querySelector('.simulador-controles');
      crearSelector(controles, {
        clave: 'diseno', etiqueta: 'Primera etapa', opciones: [
          { valor: 'ppt', texto: 'PPT + m fijo' },
          { valor: 'iguales', texto: 'probabilidades iguales + m fijo' }
        ]
      }, params, pintar);
      crearControles(controles, [
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

      // En billones (×10¹²): con la cifra entera, el eje no cabe en un teléfono.
      const ESC = 1e12;
      const curva = {
        type: 'line', label: 'V exacta del HH', stepped: false, fill: false,
        data: I.mallaAlpha.map((a, i) => ({ x: a, y: I.curvaV[i] / ESC })),
        borderColor: COLORES_GRAFICO.primario, backgroundColor: COLORES_GRAFICO.primario,
        borderWidth: 2, pointRadius: 0, tension: 0.25
      };
      const g = crearGraficoXY(lienzo, [curva], {
        tituloX: 'α: 0 uniforme · 1 ψ∝empleados · 2 ψ∝y', tituloY: 'V exacta (×10¹²)', xMin: 0, xMax: 2
      });
      ejesEnEspanol(g, 1, 0);
      topeBonito(g, I.vUniforme / ESC * 1.1);

      // El deslizador va de 0,1 en 0,1, los puntos de la malla del precálculo:
      // así V(α) es la exacta de genera_cap6.R y no una interpolación (entre dos
      // puntos de la malla, la cuerda se pasaba hasta un 2 %).
      function vDe(a) {
        return I.curvaV[Math.round(a / 0.1)];
      }

      function pintar() {
        const V = vDe(params.alpha);
        g.data.datasets = [curva, serieVertical(params.alpha, I.vUniforme / ESC * 1.05, 'α actual', COLORES_GRAFICO.secundario)];
        g.update('none');

        const nombre = params.alpha <= 0.05 ? 'uniforme' :
          (Math.abs(params.alpha - 1) <= 0.05 ? 'ψ ∝ empleados (lo alcanzable)' :
          (params.alpha >= 1.95 ? 'ψ ∝ y (perfecta, inalcanzable)' :
          (params.alpha < 1 ? 'mezcla uniforme → empleados' : 'mezcla empleados → perfecta')));
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'propuesta:', valor: nombre },
          { etiqueta: 'V(α):', valor: V < 1 ? '≈ 0' : fmtNum(V, 0) },
          { etiqueta: 'frente al uniforme:', valor: V < 1 ? 'la varianza se anula' : fmtNum(I.vUniforme / V, 2) + ' veces menos varianza' },
          { etiqueta: 'en α = 1 la mejora es:', valor: fmtNum(I.mejora, 2) + '× (corr = ' + fmtNum(I.corr, 3) + ')' },
          { etiqueta: 'población:', valor: fmtNum(I.K, 0) + ' empresas · n = ' + fmtNum(I.n, 0) }
        ]);
      }

      const inputs = crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'alpha', etiqueta: 'α de la propuesta', min: 0, max: 2, paso: 0.1 }
      ], params, pintar);
      comaEnDeslizadores(inputs, { alpha: 1 });
      pintar();
      return [g];
    };

    // ================================================================
    // Tabla-ranking del módulo 6: todos los diseños de los módulos 5 y 6
    // para counties con n = 10 (genera_cap6.R, sección 6b)
    // ================================================================
    TABLAS_RANKING['disenos'] = function () {
      const T = D6.disenosCounties;
      const ref = T.vMasSin;
      const fila = (diseno, n, V, como, pikl) => ({ diseno, n, V, como, deff: V / ref, pikl });
      return {
        descripcion: 'Estimar el total de condados de EE.UU. (3143) con n = 10 estados. El deff divide ' +
          'cada varianza entre la del MAS sin reemplazo. Pulsa la cabecera de una columna numérica para ' +
          'ordenar por ella.',
        columnas: [
          { clave: 'diseno', titulo: 'Diseño', tipo: 'texto' },
          { clave: 'n', titulo: 'Tamaño', tipo: 'texto' },
          { clave: 'V', titulo: 'Varianza', decimales: 0, mejor: 'menor' },
          { clave: 'como', titulo: 'Cómo se obtuvo', tipo: 'texto' },
          { clave: 'deff', titulo: 'deff', decimales: 2, mejor: 'menor' },
          { clave: 'pikl', titulo: '¿Sus π<sub>kl</sub> permiten estimar V sin sesgo?', tipo: 'texto' }
        ],
        filas: [
          fila('MAS sin reemplazo', 'fijo', T.vMasSin, 'exacta', 'sí: todas iguales'),
          fila('MAS con reemplazo', 'fijo, con repetición', T.vMasCon, 'exacta', 'no hacen falta: s²/n'),
          fila('Hansen–Hurwitz, ψ ∝ población', 'fijo, con repetición', T.vHh, 'exacta',
            'no hacen falta: s<sub>z</sub><sup>2</sup>/n'),
          fila('πPT sistemático, lista alfabética', 'fijo', T.vSisAlf, 'exacta (todos los arranques)',
            'no: muchas valen 0'),
          fila('πPT sistemático, lista por población', 'fijo', T.vSisOrd, 'exacta (todos los arranques)',
            'no: muchas valen 0'),
          fila('πPT por eliminación (Tillé)', 'fijo', T.vTille, 'exacta', 'sí: todas mayores que 0'),
          fila('πPT de máxima entropía', 'fijo', T.vMaxent, 'exacta', 'sí: todas mayores que 0'),
          fila('πPT de Brewer', 'fijo', T.vBrewer, fmtNum(T.replicasBrewer, 0) + ' réplicas',
            'sí, pero sampling no las calcula'),
          fila('Poisson, mismas π', 'aleatorio', T.vPoisson, 'exacta', 'no hacen falta: independencia'),
          fila('Poisson con el estimador de razón', 'aleatorio', T.ecmRazon,
            'ECM, ' + fmtNum(T.replicasRazon, 0) + ' réplicas', 'aproximación del cap. 3')
        ],
        inicial: 'V',
        destacada: 'MAS sin reemplazo',
        pie: 'Para counties solo un diseño le gana al MAS sin reemplazo: el sistemático con la lista ' +
          'ordenada por población, que reparte la muestra entre estados chicos, medianos y grandes. ' +
          'Los demás πPT tienen más varianza que él, de 575 401 a 723 607 frente a 456 975, porque los ' +
          'condados no crecen en proporción a la población (módulo 5, criterio de Raj). Entre los dos diseños con reemplazo, el ' +
          'Hansen–Hurwitz pierde frente al MAS: 963 006 frente a 557 287, el 73 % más que anticipaba Raj. ' +
          'Poisson casi triplica al sistemático por su tamaño aleatorio, y la razón le quita más de la mitad.'
      };
    };

    // ================================================================
    // Diagrama de diseño del módulo 9: classpps, PPT en dos etapas
    // ================================================================
    DIAGRAMAS_DISENO['ppt-dos-etapas'] = {
      titulo: 'El diseño de classpps: πPT sin reemplazo × MAS',
      intro: 'Pulsa cada etapa. La primera sortea <em>con</em> probabilidades desiguales; la franja final ' +
        'muestra la cancelación que deja todos los pesos iguales.',
      nota: 'Compara con el diagrama de schools del capítulo 5, módulo 2: allí la primera etapa ' +
        'era un MAS y los pesos finales dependían de M<sub>i</sub> (40,9 a 137,6). Aquí, PPT los aplana en ' +
        'un solo número.',
      etapas: [
        {
          etiqueta: 'Marco',
          unidad: '15 clases, $K = 647$ estudiantes',
          icono: 'fa-chalkboard-user',
          resumen: 'El marco lista las 15 clases con sus tamaños $M_i$ (de 15 a 100). A diferencia ' +
            'de schools, aquí el total $K = 647$ sí se conoce: lo exige el PPT para calcular las $\\psi_i$.',
          cifras: [{ k: '$N$', v: '15 clases' }, { k: '$M_i$', v: 'de 15 a 100' }]
        },
        {
          etiqueta: 'Etapa 1: clases',
          unidad: 'πPT sin reemplazo, $n = 5$',
          icono: 'fa-scale-unbalanced',
          resumen: 'Cinco clases distintas, sorteadas con $\\pi_i = 5M_i/647$ (Lohr, ej. 6.11). Para la ' +
            'varianza se analizan como si fueran cinco extracciones con reemplazo, con $\\psi_i = \\pi_i/5 = ' +
            'M_i/647$: la clase de 100 estudiantes, con 0,155 por extracción; la de 15, con 0,023.',
          pi: '\\pi_i = 5M_i/647,\\quad \\psi_i = \\pi_i/5',
          peso: '1/\\pi_i = 1/(n\\psi_i) = 647/(5 M_i)',
          cifras: [{ k: 'ψ rango', v: '0,023 a 0,155' }],
          ejemplo: 'la clase 14 (M = 100) tiene unas 4,5 veces la probabilidad de la clase 4 (M = 22).'
        },
        {
          etiqueta: 'Etapa 2: estudiantes',
          unidad: 'MAS de $m = 4$ por clase',
          icono: 'fa-user-check',
          resumen: 'En cada clase sorteada, 4 estudiantes de sus $M_i$. La probabilidad condicional ' +
            'baja con el tamaño de la clase — exactamente al revés que la etapa 1.',
          pi: 'm/M_i = 4/M_i',
          peso: 'M_i/4',
          cifras: [{ k: '$m/M_i$ (clases sorteadas)', v: '0,04 a 0,18' }],
          ejemplo: 'en la clase de 100, cada estudiante sale con 4/100 = 0,04.'
        },
        {
          etiqueta: 'Estimación',
          unidad: 'la cancelación',
          icono: 'fa-equals',
          resumen: 'El peso multiplica las dos etapas y el $M_i$ desaparece: $w = \\frac{647}{5M_i} \\times ' +
            '\\frac{M_i}{4} = \\frac{647}{20} = 32{,}35$ para todos. La suma de pesos reconstruye $K = 647$ exacto.',
          peso: 'w = \\frac{647}{5 \\cdot 4} = 32{,}35',
          cifras: [{ k: '$w$ único', v: '32,35' }, { k: 'total de horas', v: '2232,2 (error estándar 311,8)' }],
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
      nota: 'La distinción del capítulo: $\\psi_i$ es la probabilidad de <em>una</em> extracción (con ' +
        'reemplazo, suman 1); $\\pi_k$ es la probabilidad de estar <em>en la muestra</em> (sin reemplazo, ' +
        'suman $n$). El módulo 4 las pone lado a lado.',
      filas: [
        { concepto: 'Medida de tamaño', aqui: 'x_k', lohr: 'M_i', gutierrez: 'x_k', r: 'pop2019, sizemeas' },
        { concepto: 'Prob. de una extracción', aqui: '\\psi_i', lohr: '\\psi_i', gutierrez: 'p_k', r: 'prob = psi' },
        { concepto: 'Prob. de inclusión', aqui: '\\pi_k', lohr: '\\pi_i', gutierrez: '\\pi_k', r: 'inclusionprobabilities()' },
        { concepto: 'Conjunta de segundo orden', aqui: '\\pi_{kl}', lohr: '\\pi_{ik}', gutierrez: '\\pi_{kl}', r: 'ppsmat(Pmat)' },
        { concepto: 'Estimador con reemplazo', aqui: '\\hat{t}_{HH}\\ (\\hat{t}_\\psi \\text{ si } n = 1)', lohr: '\\hat{t}_\\psi', gutierrez: '\\hat{t}_{y,p}', r: 'mean(y/psi)' },
        { concepto: 'Su varianza estimada', aqui: 's_z^2/n', lohr: 's_u^2/n', gutierrez: '\\widehat{Var}_{PPT}(\\hat{t}_{y,p})', r: 'var(z)/n' },
        { concepto: 'Estimador sin reemplazo', aqui: '\\hat{t}_\\pi', lohr: '\\hat{t}_{HT}', gutierrez: '\\hat{t}_{y,\\pi}', r: 'svytotal + probs' },
        { concepto: 'Varianza SYG', aqui: '\\widehat{V}_{SYG}', lohr: '\\widehat{V}_{SYG}', gutierrez: '\\text{Res. 4.3.1, con } \\Delta_{kl}', r: 'variance = "YG"' },
        { concepto: 'Diseño πPT / πps', aqui: '\\pi_k \\propto x_k', lohr: '\\text{pps sin reemplazo}', gutierrez: '\\pi PT', r: 'UPsystematic, UPbrewer, UPtille, UPmaxentropy, S.piPS' },
        { concepto: 'Varianza sin $\\pi_{kl}$, con reemplazo', aqui: 's_z^2/n,\\ z_k = n\\,y_k/\\pi_k', lohr: '\\text{(6.24)}', gutierrez: '\\text{—}', r: 'var(z) / n' },
        { concepto: 'Varianza sin $\\pi_{kl}$, Hájek–Deville', aqui: '\\widehat{V}_{Deville}', lohr: '\\text{—}', gutierrez: '\\text{Res. 4.4.4}', r: 'varest(), pps = "brewer"' },
        { concepto: 'Diseño de Poisson', aqui: '\\text{PO}(\\pi)', lohr: '\\text{Poisson sampling}', gutierrez: 'PO', r: 'rbinom(N, 1, pi)' },
        { concepto: 'Inclusión forzosa', aqui: '\\pi_k = 1', lohr: '\\text{certainty psu}', gutierrez: '\\text{incl. forzosa}', r: 'pik >= 1' },
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
          { texto: 'De que con ψ ∝ tamaño los cocientes $t_i/\\psi_i$ (176, 160, 128, 392) quedan cerca de 300; con ψ iguales van de 44 a 980.', correcta: true,
            retro: 'Exacto: la varianza de un estimador de una extracción es la dispersión de sus valores posibles alrededor de t. Alinear ψ con el tamaño comprime esos valores, y esa es <em>toda</em> la idea del capítulo.' },
          { texto: 'De que el sorteo proporcional saca la tienda D más a menudo, y D, con 245 de las 300 ventas, es la que más informa.', correcta: false,
            retro: 'Observa D más a menudo, pero cada muestra sigue siendo <em>una</em> tienda. La ganancia no está en observar más, sino en que lo expandido (t/ψ) sea estable salga quien salga.' },
          { texto: 'De que las probabilidades desiguales eliminan el sesgo de selección que tiene el sorteo uniforme con tiendas tan distintas.', correcta: false,
            retro: 'No había sesgo que eliminar: ambos sorteos son insesgados (la enumeración da E = 300 en los dos). Probabilidades conocidas ≠ probabilidades iguales; lo primero basta para la insesgadez.' },
          { texto: 'De la corrección por población finita, que con solo cuatro tiendas pesa mucho y solo se aplica al sorteo proporcional.', correcta: false,
            retro: 'El fpc no pinta nada aquí: es un sorteo de una extracción en ambos casos. La ganancia viene de la geometría de los t/ψ, no de correcciones.' }
        ]
      },
      {
        tipo: 'numerica',
        modulo: 2,
        pregunta: 'La varianza del HH con $n$ extracciones es $V(n=1)/n$, y con las tiendas $V(n=1) = 14\\,248$. ¿Cuántas extracciones hacen falta, como mínimo, para que la varianza del HH baje de 1000? Entero.',
        pista: 'Plantea $14\\,248/n < 1000$ y despeja $n$. Recuerda que $n$ es entero.',
        respuesta: 15,
        tolerancia: 0,
        retroAcierto: 'Con 14 extracciones la varianza es $14\\,248/14 \\approx 1018$, todavía por encima de 1000; con 15, $14\\,248/15 \\approx 950$. Las extracciones independientes promedian el ruido, como en el capítulo 2, y el «con reemplazo» compra esa fórmula limpia al precio de poder repetir tienda.',
        retroFallo: 'Son 15: hay que despejar $n$ en $14\\,248/n < 1000$. Con 14 la varianza es $14\\,248/14 \\approx 1018$, que no baja de 1000; con 15 es $14\\,248/15 \\approx 950$. La varianza del HH decrece como $1/n$, porque las extracciones son independientes.'
      },
      {
        tipo: 'opcion',
        modulo: 3,
        pregunta: 'Un marco tiene 40 millones de unidades repartidas en archivos que no caben juntos en memoria. No se pueden recorrer todos antes de sortear, pero sí leer cualquier unidad por su número, y se conocen $N$ y el tamaño máximo $x_{\\max}$. ¿Qué método de selección PPT conviene y por qué?',
        pista: '¿Cuál de los dos métodos necesita la suma de todos los tamaños antes del primer sorteo?',
        opciones: [
          { texto: 'Lahiri: sortea un número entre 1 y $N$ y lo acepta o lo rechaza contra $x_{\\max}$, sin acumular tamaños.', correcta: true,
            retro: 'Correcto. El acumulativo exige construir los tramos: recorrer y sumar <em>todo</em> el marco antes del primer sorteo. Lahiri solo necesita poder leer una unidad cualquiera y conocer $N$ y $x_{\\max}$. (Si las unidades llegaran una a una y hubiera que decidir en el momento, ninguno de los dos serviría: eso lo resuelve Poisson, módulo 6.)' },
          { texto: 'El acumulativo, porque es exacto, y Lahiri solo aproxima las ψ, sobre todo con marcos muy grandes.', correcta: false,
            retro: 'Los dos son exactos: la verificación de 100 000 sorteos lo confirmó para ambos. La diferencia es operativa (memoria y pasadas), no probabilística.' },
          { texto: 'Ninguno: si el marco no cabe en memoria, no se puede sortear con probabilidades desiguales, solo con el MAS.', correcta: false,
            retro: 'Al revés: los marcos gigantes son el hábitat natural del PPT (transacciones, tráfico, censos de empresas). El tamaño pide mejores algoritmos, no renunciar al diseño.' },
          { texto: 'Lahiri, porque al rechazar las unidades pequeñas tiene menos varianza que el acumulativo.', correcta: false,
            retro: 'Producen <em>exactamente</em> la misma distribución de selección (ambos dan ψ_i), así que la varianza del estimador es idéntica. La ventaja de Lahiri es de memoria y pasadas, no de varianza.' }
        ]
      },
      {
        tipo: 'opcion',
        modulo: 4,
        pregunta: 'Se sortean dos tiendas con reemplazo, con $\\psi$ proporcional al área. La tienda D tiene $\\psi_D = 0{,}625$. ¿Cuál es la probabilidad de que D esté en la muestra?',
        pista: '¿Con qué probabilidad no sale D en ninguna de las dos extracciones?',
        opciones: [
          { texto: '0,8594, que es $1 - (1 - 0{,}625)^2$: uno menos la probabilidad de que D no salga nunca.', correcta: true,
            retro: 'Exacto. $\\psi_D$ es la probabilidad de una extracción y $\\pi_D$, la de estar en la muestra. Como $\\psi_D$ es grande, las dos extracciones repiten D a menudo, y por eso $\\pi_D$ queda lejos de $2\\psi_D$.' },
          { texto: '1,25, que es $n\\,\\psi_D = 2 \\times 0{,}625$: cada extracción suma su probabilidad.', correcta: false,
            retro: '$n\\,\\psi_D$ es el número medio de veces que sale D, no una probabilidad: por eso puede pasar de 1. Solo se parece a $\\pi_D$ cuando $\\psi_D$ es pequeña, como en la tienda A (0,125 frente a 0,1211).' },
          { texto: '0,625, que es $\\psi_D$: con reemplazo cada extracción es independiente de la otra.', correcta: false,
            retro: 'Esa es la probabilidad de salir en <em>una</em> extracción. Con dos extracciones, D tiene dos oportunidades de entrar en la muestra, así que $\\pi_D$ es mayor que $\\psi_D$.' },
          { texto: '0,75, que es la $\\pi_D$ que el módulo calculó para las mismas cuatro tiendas.', correcta: false,
            retro: 'Ese 0,75 es de otro diseño, el sin reemplazo con $p(s) \\propto x_k + x_l$. La probabilidad de inclusión depende del diseño, no solo de las tiendas: aquí el sorteo es con reemplazo.' }
        ]
      },
      {
        tipo: 'multiple',
        modulo: 5,
        pregunta: 'Sobre el πPT de los 51 estados ($\\pi \\propto$ población, $n = 10$), marca <strong>todo</strong> lo que sea cierto.',
        pista: 'Repasa la inclusión forzosa, las réplicas de las tres variables y lo que el sistemático puede y no puede estimar.',
        opciones: [
          { texto: 'California queda con π = 1: su π cruda (1,204) supera 1 y se trunca, reescalando las demás.', correcta: true,
            retro: 'Cierto: es la inclusión forzosa. California entra en todas las muestras, y los 9 cupos que quedan se reparten entre los otros 50 estados.' },
          { texto: 'Para counties (correlación 0,46 con el tamaño), el πPT sistemático con la lista en orden alfabético tiene <em>más</em> varianza que un MAS sin reemplazo de 10 estados.', correcta: true,
            retro: 'Cierto: 575 401 frente a 456 975, un deff de 1,26. La correlación de 0,46 no alcanza, porque los condados no crecen en proporción a la población.' },
          { texto: 'El πPT sistemático no tiene estimador insesgado de varianza: muchas $\\pi_{kl}$ valen 0.', correcta: true,
            retro: 'Cierto: con la lista alfabética, 830 de las 1225 parejas nunca salen juntas (828 con la ordenada por población). Por eso su error estándar se estima con una aproximación (módulo 7).' },
          { texto: 'πPT garantiza menor varianza que el MAS siempre que la correlación con el tamaño sea positiva.', correcta: false,
            retro: 'Falso: lo que cuenta no es la correlación de $x$ con $y$, sino la de $x$ con $y^2/x$ (el criterio de Raj), y con los condados es negativa.' }
        ],
        retroAcierto: 'Todas menos la de la garantía por correlación positiva, que es la superstición que el módulo desmonta: correlación positiva no basta, hace falta casi proporcionalidad, y con 0,46 el πPT pierde (deff 1,26).',
        retroFallo: 'Son las tres que no prometen garantías. La de la correlación positiva es falsa y es la lección cara del módulo: el πPT es una apuesta a la proporcionalidad, y con correlación 0,46 la apuesta se pierde (deff 1,26 frente al MAS sin reemplazo).'
      },
      {
        tipo: 'grafico',
        modulo: 5,
        alto: 300,
        descripcionGrafico: 'Dos histogramas de 10 000 réplicas del HT del total de waterarea: πPT sistemático frente a MAS sin reemplazo de 10 estados',
        pregunta: 'Las réplicas del módulo 5 para <code>waterarea</code> (correlación 0,045 con la población). Fíjate en el cuerpo de cada histograma y también en su cola derecha. ¿Cuál es el πPT, y qué veredicto sale?',
        pista: 'Con correlación casi nula, ¿a quién castigan las π desiguales? Busca qué diseño tiene réplicas lejísimos del total.',
        dibujar: canvas => {
          const V = D6.statepps.waterarea;
          const alto = Math.max(...V.pps.conteo, ...V.mas.conteo) * 1.05;
          const g = crearGraficoXY(canvas, [
            serieHistograma(V.mas, 'diseño A', COLORES_GRAFICO.primario),
            serieHistograma(V.pps, 'diseño B', COLORES_GRAFICO.secundario),
            serieVertical(V.total, alto, 'total verdadero', COLORES_GRAFICO.gris)
          ], { tituloX: 'HT del total de waterarea', tituloY: 'réplicas' });
          ejesEnEspanol(g, 0, 0);
          g.update('none');
          return g;
        },
        opciones: [
          { texto: 'El B, el de la cola larga: con correlación 0,045 las π desiguales solo meten ruido, y el deff es de 9.', correcta: true,
            retro: 'Correcto. Su cuerpo es incluso más estrecho que el del MAS, pero casi siempre se queda corto, y cuando entra Alaska (π = 0,023 y el 36 % del agua) el HT salta a unos 11 millones: esa cola, un par de réplicas de cada cien, es la que da el deff 9 frente al MAS sin reemplazo. Es el elefante del módulo 8 con datos reales. πPT sin proporcionalidad es un mal negocio.' },
          { texto: 'El A (verde), el más concentrado: el πPT aprovecha la población de cada estado y siempre reduce la dispersión.', correcta: false,
            retro: '«Siempre» es la palabra equivocada del capítulo. El cuerpo del πPT puede verse estrecho, pero su varianza la decide la cola: aquí el disperso de verdad es el πPT, porque el agua no acompaña a la población.' },
          { texto: 'Los dos están sesgados: ninguno de los histogramas se centra en el total verdadero, la línea gris.', correcta: false,
            retro: 'Mira la línea gris: ambos histogramas la tienen dentro — los dos HT son insesgados (las réplicas dieron un sesgo relativo menor del 1 %). Lo que difiere brutalmente es la dispersión.' },
          { texto: 'El B, pero por el tamaño de muestra: el sistemático termina usando menos estados que el MAS.', correcta: false,
            retro: 'Los dos diseños usan exactamente n = 10 estados por réplica. La diferencia entera es <em>cómo</em> se reparten las π, no cuántas unidades entran.' }
        ]
      },
      {
        tipo: 'opcion',
        modulo: 5,
        pregunta: 'Con los estados, la correlación entre la población y el número de condados es 0,46, positiva. Aun así, el criterio de Raj da $V_{MRAS} - V_{PPT} = \\frac{N^2}{n}\\,\\mathrm{Cov}(x,\\ y^2/x) = -405\\,719$. Con 10 extracciones con reemplazo, ¿qué conviene para estimar el total de condados?',
        pista: 'El criterio es la diferencia $V_{MRAS} - V_{PPT}$. ¿Qué dice su signo?',
        opciones: [
          { texto: 'El MAS con reemplazo: la diferencia es negativa, así que el PPT tiene más varianza.', correcta: true,
            retro: 'Correcto. Lo que cuenta no es la correlación de x con y, sino la de x con $y^2/x$, que aquí es −0,17. El PPT gana cuando la recta de y sobre x pasa cerca del origen, y la de los condados corta el eje en 43.' },
          { texto: 'El PPT, porque la correlación entre la población y los condados es positiva, de 0,46.', correcta: false,
            retro: 'La correlación positiva no basta. El criterio mide la correlación de x con $y^2/x$, y con los condados es negativa: los condados no crecen en proporción a la población.' },
          { texto: 'Da igual: con reemplazo los dos diseños son insesgados y tienen la misma varianza.', correcta: false,
            retro: 'No: la diferencia es exactamente $\\frac{N^2}{n}\\mathrm{Cov}(x,\\ y^2/x)$. Solo sería cero si esa covarianza fuera nula.' },
          { texto: 'No se puede saber: el criterio de Raj solo vale para los diseños sin reemplazo.', correcta: false,
            retro: 'Al revés: el criterio de Raj es exacto para los diseños con reemplazo, y para el πPT sin reemplazo es orientativo.' }
        ]
      },
      {
        tipo: 'numerica',
        modulo: 6,
        pregunta: 'En el diseño de Poisson sobre los 51 estados, con $\\pi \\propto$ población, $E(n_s) = 10$ y $V(n_s) = \\sum \\pi_k(1-\\pi_k) = 5{,}83$. Si las 51 π fueran iguales, $\\pi_k = 10/51$, con el mismo $E(n_s)$, ¿cuánto valdría $V(n_s)$? Dos decimales.',
        pista: 'Con todas las π iguales, la suma tiene 51 términos idénticos: $51 \\cdot \\pi(1 - \\pi)$.',
        respuesta: 8.04,
        tolerancia: 0.01,
        retroAcierto: '$51 \\times \\tfrac{10}{51} \\times \\tfrac{41}{51} = 8{,}04$, más que 5,83. Con π desiguales el tamaño varía menos: California, con π = 1, entra siempre y no aporta nada a $V(n_s)$, y los estados con π pequeña aportan poco, porque $\\pi(1-\\pi)$ es pequeño cerca de 0 y de 1. Aun así, con 5,83 el diseño da exactamente 10 estados solo el 16 % de las veces.',
        retroFallo: 'Es $51 \\times \\tfrac{10}{51} \\times \\tfrac{41}{51} = 8{,}04$. Con la misma suma de las π, $\\sum \\pi_k(1-\\pi_k)$ es máxima cuando todas son iguales; las π desiguales de los estados, con California en 1, dan menos, 5,83.'
      },
      {
        tipo: 'opcion',
        modulo: 6,
        pregunta: 'En un diseño de Poisson, alguien elige $\\pi_k = n\\,y_k/t$, proporcionales a la propia variable de interés. ¿Qué pasa con la varianza del HT?',
        pista: '¿Cuánto aporta al HT cada unidad que sale? ¿Y cuántas unidades salen?',
        opciones: [
          { texto: 'No es cero: cada unidad que sale aporta $t/n$, así que el HT vale $t\\,n_s/n$ y cambia con $n_s$.', correcta: true,
            retro: 'Exacto (Gutiérrez, §4.1.3). Con tamaño fijo esas π darían varianza cero; con Poisson, todo el error viene del tamaño aleatorio. Por eso conviene corregir con la razón, $t_x\\,\\hat{t}_{y,\\pi}/\\hat{t}_{x,\\pi}$, que cancela la fracción $n_s/n$.' },
          { texto: 'Cero, porque los cocientes $y_k/\\pi_k$ son todos iguales, como en el πPT con $y$ proporcional a $x$.', correcta: false,
            retro: 'Los cocientes sí son iguales, $t/n$, pero el HT es su suma sobre la muestra, y en Poisson el número de sumandos es aleatorio. La idea central del capítulo da varianza cero solo con tamaño fijo.' },
          { texto: 'No se puede calcular: Poisson no tiene $\\pi_{kl}$, y sin ellas la varianza del HT no está definida.', correcta: false,
            retro: 'Sí las tiene, y son las más simples: $\\pi_{kl} = \\pi_k\\pi_l$. Por eso su varianza es exacta sin matriz de conjuntas: $\\sum_U (1/\\pi_k - 1)\\,y_k^2$.' },
          { texto: 'Es igual a la del MAS con el mismo tamaño esperado, porque las monedas son independientes.', correcta: false,
            retro: 'No hay razón para eso. Con π proporcionales a y, la varianza viene solo de cuántas unidades salen, y depende de $V(n_s) = \\sum \\pi_k(1 - \\pi_k)$, no de la dispersión de y como en el MAS.' }
        ]
      },
      {
        tipo: 'opcion',
        modulo: 7,
        pregunta: 'Sobre agpps, los estimadores de varianza en forma HT y SYG usan los mismos datos y las mismas $\\pi_{kl}$, pero dan errores estándar de 70,5 y 11,7 millones. ¿Cuál es el diagnóstico correcto?',
        pista: '¿Cómo suma cada forma sus términos?',
        opciones: [
          { texto: 'La forma HT suma términos grandes de signos opuestos, que casi se cancelan; la SYG suma solo positivos.', correcta: true,
            retro: 'Exacto. Ambas estiman la <em>misma</em> varianza teórica; difieren como estimadores. La aritmética de cancelaciones de la forma HT amplifica cualquier desajuste; los cuadrados de SYG mucho menos. (Sin las $\\pi_{kl}$, Lohr recomienda en general una tercera vía: la aproximación con reemplazo, que aquí da un ee muy cercano al de SYG.)' },
          { texto: 'La forma HT está mal programada: con los mismos datos y las mismas $\\pi_{kl}$, las dos deberían dar lo mismo.', correcta: false,
            retro: 'survey reproduce ambas cifras exactamente (variance = "HT" y "YG"): no hay error. Son dos <em>estimadores</em> distintos de una misma cantidad, y pueden diferir mucho en una muestra concreta.' },
          { texto: 'La SYG subestima: el error estándar verdadero es el de la forma HT, que usa todos los términos de la matriz.', correcta: false,
            retro: 'No hay «verdadero» entre los dos sin más información — pero la teoría y la práctica (Lohr §6.4.1, ej. 6.10) señalan a la forma HT como el estimador errático. Aquí, además, 70 millones implicaría un cv del 7,5 % para un diseño construido para ser preciso.' },
          { texto: 'La SYG sale más pequeña porque deja fuera los términos de $k = l$, que la forma HT sí suma uno por uno.', correcta: false,
            retro: 'Las dos formas son insesgadas para la misma varianza: SYG no necesita los términos de $k = l$ porque los absorbe al escribir la suma con diferencias al cuadrado. La distancia entre 70,5 y 11,7 es de estabilidad, no de qué términos entran.' }
        ]
      },
      {
        tipo: 'grafico',
        modulo: 8,
        alto: 300,
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
          g.options.scales.y.max = topeLog(Math.max(...aportes) * 1.5);
          ejeLogEnEspanol(g);
          g.options.scales.x.ticks = Object.assign({}, g.options.scales.x.ticks, {
            autoSkip: false, maxRotation: 0,
            callback: (v, i) => [0, 4, 9, 14, 19].includes(i) ? String(i + 1) : ''
          });
          g.data.datasets[0].backgroundColor = E.y.map((_, i) => i === 19 ? '#FF6600' : '#012820');
          g.update('none');
          return g;
        },
        opciones: [
          { texto: 'La unidad 20, la naranja, aporta órdenes de magnitud más: su y grande con π chica domina la varianza.', correcta: true,
            retro: 'Correcto. Con π = 0,02, el término (1/0,02 − 1)·8790² aplasta a los otros 19 juntos. La insesgadez sobrevive; la utilidad, no.' },
          { texto: 'Todas las unidades aportan parecido: en escala logarítmica, las barras quedan a alturas comparables.', correcta: false,
            retro: 'La escala log <em>disimula</em> diferencias, y aun así la barra naranja sobresale por varios órdenes. En escala lineal, las demás barras ni se verían.' },
          { texto: 'La unidad 20 aporta mucho porque su y es el 82 % del total: cualquier diseño sufriría igual.', correcta: false,
            retro: 'El y grande es la mitad de la historia: con π = 1 (inclusión forzosa) su aporte sería cero, porque (1/π − 1) se anula. La bomba es la <em>combinación</em> de y grande y π chica, y la π sí la elige el diseñador.' },
          { texto: 'La unidad 20 aporta mucho por su π de 0,02: con cualquier y, una π tan pequeña daría el mismo aporte.', correcta: false,
            retro: 'La π pequeña es la otra mitad de la historia: el aporte es $(1/\\pi - 1)\\,y^2$, y con un y pequeño sería pequeño aunque π fuera 0,02. La bomba es la combinación de y grande y π pequeña.' }
        ]
      },
      {
        tipo: 'opcion',
        modulo: 9,
        pregunta: 'En classpps, <em>todos</em> los estudiantes acaban con peso 32,35. ¿Por qué el diseño de classpps produce esa igualdad exacta?',
        pista: 'Escribe el peso como producto de las dos etapas y busca qué se cancela.',
        opciones: [
          { texto: 'PPT en la primera etapa y $m$ fijo en la segunda: $w = \\frac{K}{nM_i}\\cdot\\frac{M_i}{m} = \\frac{K}{nm}$, y $M_i$ se cancela.', correcta: true,
            retro: 'Esa es la cancelación. El diseño se llama autoponderado, y es la receta de las encuestas de hogares: PPT arriba, cuota fija abajo, pesos planos.' },
          { texto: 'Sortear las clases con probabilidades iguales y compensar con $m$ proporcional a $M_i$.', correcta: false,
            retro: 'Esa combinación <em>también</em> autopondera ($w = (N/n)\\,M_i/m_i$ es constante si $m_i \\propto M_i$), pero no es la de classpps — aquí m = 4 fijo — y tiene el costo práctico de cargas de trabajo desiguales por clase.' },
          { texto: 'Es una coincidencia numérica de este archivo: con otras clases y otros tamaños, los pesos saldrían distintos.', correcta: false,
            retro: 'Es estructura, no suerte: 32,35 = 647/(5·4) sale de la fórmula para cualquier clase. El bloque del módulo lo comprueba: el archivo trae un único peso, el de la fórmula, en las 5 clases.' },
          { texto: 'survey normaliza los pesos automáticamente para que sumen el total de estudiantes y sean iguales.', correcta: false,
            retro: 'survey usa los pesos tal cual llegan — jamás los iguala. Si el archivo trae pesos dispares (como schools en el cap. 5: 40,9 a 137,6), así se quedan.' }
        ]
      },
      {
        tipo: 'multiple',
        modulo: 10,
        pregunta: 'Sobre muestreo por importancia (estimar el total de condados con propuesta ψ), marca <strong>todo</strong> lo que sea cierto.',
        pista: 'El bloque del módulo 10 calculó tres varianzas exactas: uniforme 557 287, ψ∝población 963 006, ψ∝y 0.',
        opciones: [
          { texto: 'La propuesta ψ ∝ y tiene varianza exactamente cero — pero exige conocer y, que es lo que se busca.', correcta: true,
            retro: 'Cierto: todos los $y_k/\\psi_k$ valen $t$, así que cada extracción da el total exacto. Pero para fijar esa ψ habría que conocer y.' },
          { texto: 'Una propuesta correlacionada con y (0,46) puede ser <em>peor</em> que el uniforme.', correcta: true,
            retro: 'Cierto: ψ ∝ población da 963 006, frente a 557 287 de la uniforme, aunque su correlación con los condados sea 0,46.' },
          { texto: 'Con cualquier ψ conocida y positiva, el estimador sigue siendo insesgado.', correcta: true,
            retro: 'Cierto: la insesgadez solo pide que ψ sea conocida y positiva donde y no es cero. Lo que cambia con ψ es la varianza.' },
          { texto: 'Si un conjunto de datos se recolectó sin registrar las ψ, basta ponderar después para recuperar la insesgadez.', correcta: false,
            retro: 'Falso: los pesos de importancia son $1/\\psi$, y una ψ que nadie anotó no se puede invertir. Ponderar después (cap. 8) es una reparación aproximada, no una garantía.' }
        ],
        retroAcierto: 'Todas menos la de los datos sin ψ registradas, que es el pecado original del capítulo 1: sin ψ conocida no hay pesos válidos que aplicar — la ponderación posterior (cap. 8) es una reparación aproximada, nunca una garantía.',
        retroFallo: 'Son las tres que hablan de una ψ conocida. La de los datos sin ψ es falsa: los pesos de importancia son 1/ψ, y una ψ que nadie anotó no se puede invertir. Esa es la frontera entre una muestra probabilística y un dataset de conveniencia.'
      }
    ];
