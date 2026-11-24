    // ================================================================
    // Simuladores del capítulo 1
    //
    // Todos leen de DATOS_CAP1, que produce precalculo/genera_cap1.R.
    // Aquí no se calcula nada pesado: los histogramas, las tablas del
    // censo de 2010 y las curvas de error ya vienen resueltas.
    // ================================================================
    const D1 = DATOS_CAP1;

    // Formato español: espacio fino como separador de miles, coma decimal.
    function fmtNum(x, d = 2) {
      if (!isFinite(x)) return '—';
      const s = Math.abs(x).toFixed(d);
      const partes = s.split('.');
      const entero = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      // El signo, después de redondear: un sesgo de −6·10⁻¹¹ no es «−0» (lector visual, VI-09).
      const negativo = x < 0 && Number(s) !== 0;
      return (negativo ? '−' : '') + entero + (partes[1] ? ',' + partes[1] : '');
    }

    // Ejes de una gráfica, a la manera del capítulo (Fase 5 del plan, lector visual VI-05 a VI-14):
    //   · el eje de valores lleva título con su unidad, y sus números se escriben como en la prosa
    //     (espacio fino de miles, coma decimal), no «800,000»;
    //   · un eje de categorías no esconde rótulos cuando no caben: los inclina;
    //   · la leyenda, más compacta, para que en un teléfono no se coma el área de dibujo.
    function ejes(g, { y, x } = {}) {
      const ey = g.options.scales.y, ex = g.options.scales.x;
      if (y) {
        if (y.titulo) ey.title = { display: true, text: y.titulo, font: { family: 'Montserrat', size: 11 } };
        if (y.formato) ey.ticks.callback = y.formato;
      }
      if (x && x.formato) ex.ticks.callback = x.formato;
      if (ex.type !== 'linear') Object.assign(ex.ticks, { autoSkip: false, maxRotation: 60, minRotation: 0 });
      // En un teléfono la leyenda y los rótulos inclinados se comen el alto: el contenedor crece 100 px
      // solo allí, para que el área de dibujo no quede en una franja (lector visual, VI-16).
      const caja = g.canvas.parentNode;
      if (window.matchMedia('(max-width: 767px)').matches && caja && caja.classList.contains('grafico-wrapper')
          && !caja.dataset.crecida) {
        caja.style.height = (parseFloat(caja.style.height || caja.offsetHeight) + 100) + 'px';
        caja.dataset.crecida = '1';
        g.resize();
      }
      const ley = g.options.plugins && g.options.plugins.legend;
      if (ley && ley.labels) Object.assign(ley.labels, { boxWidth: 12, font: { family: 'Montserrat', size: 11 } });
      g.update('none');
      return g;
    }
    const ENTERO = v => fmtNum(v, 0);

    // Convención de color del capítulo (Fase 5, lector visual VI-28), la misma en todas las gráficas:
    //   verde oscuro = la verdad de la población · naranja = lo que da la encuesta o el estimador ·
    //   gris = referencias y contexto · verde azulado (#0e7490) = cualquier otra serie.
    const VERDAD = COLORES_GRAFICO.primario, ENCUESTA = COLORES_GRAFICO.secundario,
          REFERENCIA = COLORES_GRAFICO.gris, OTRA = COLORES_GRAFICO.terciario;
    // La barra que el estudiante elige se pinta más oscura que sus vecinas (lector visual, VI-10).
    const destaca = (n, i, base, oscuro) => Array.from({ length: n }, (_, k) => (k === i ? oscuro : base));
    const PCT_DE_PROPORCION = v => fmtNum(100 * v, 0) + ' %';

    function fmtPct(x, d = 1) { return fmtNum(100 * x, d) + ' %'; }

    // ---------------------------------------------------------------
    // M1 · Literary Digest: el sesgo, partido en sus dos causas
    // ---------------------------------------------------------------
    SIMULADORES['digest'] = function (raiz) {
      const DG = D1.digest;
      // Arranca SOBRE la curva: el rho exacto que reproduce el sondeo con brecha
      // 0,25 (el deslizador lo muestra redondeado a 0.72 hasta que se mueve).
      const params = { cobertura: DG.coberturaRef, brecha: 0.25,
                       rho: DG.isoResultado.rho[DG.isoResultado.brecha.indexOf(0.25)] };
      const lienzos = raiz.querySelectorAll('canvas');

      const gBarras = crearGraficoBarras(lienzos[0],
        ['Real', 'En el marco', 'Sondeo'],
        [DG.pEleccion, 0, 0], {
          etiqueta: 'Apoyo a Roosevelt', color: COLORES_GRAFICO.primario,
          min: 0, max: 0.8,
          lineas: [{ valor: DG.pSondeo, etiqueta: 'sondeo (titular de la revista): 42,9 %',
                     color: COLORES_GRAFICO.secundario },
                   { valor: 0.5, etiqueta: 'umbral de la victoria', color: '#94a3b8' }]
        });

      gBarras.data.datasets[0].backgroundColor = [VERDAD, REFERENCIA, ENCUESTA];
      gBarras.options.plugins.legend.labels.filter = it => it.datasetIndex !== 0;   // el eje ya dice qué es
      ejes(gBarras, { y: { titulo: 'Apoyo a Roosevelt', formato: PCT_DE_PROPORCION } });

      const gCurva = crearGraficoXY(lienzos[1], [], {
        tituloX: 'Brecha de cobertura  d = p_F − p_C',
        tituloY: 'Razón de respuesta  ρ', xMin: 0, xMax: 0.4
      });
      ejes(gCurva, { y: { formato: v => fmtNum(v, 2) }, x: { formato: v => fmtNum(v, 2) } });

      function pintar() {
        const p = DG.pEleccion;
        const pC = p - (1 - params.cobertura) * params.brecha;
        const pHat = pC * params.rho / (pC * params.rho + (1 - pC));
        const sesgoCob = pC - p;
        const sesgoResp = pHat - pC;

        gBarras.data.datasets[0].data = [p, pC, pHat];
        gBarras.update('none');

        // La curva iso-resultado se recalcula para la cobertura elegida: es el
        // lugar de los pares (d, ρ) que reproducen exactamente el 42,9 % que
        // se publicó. Sobre ella, los datos NO distinguen las dos causas.
        const brechas = DG.isoResultado.brecha;
        const rhos = brechas.map(d => {
          const pc = p - (1 - params.cobertura) * d;
          return DG.pSondeo * (1 - pc) / (pc * (1 - DG.pSondeo));
        });
        gCurva.data.datasets = [
          { type: 'line', label: 'reproducen el 42,9 %',
            data: brechas.map((d, i) => ({ x: d, y: rhos[i] })),
            borderColor: COLORES_GRAFICO.secundario, borderWidth: 2,
            pointRadius: 0, fill: false },
          { type: 'scatter', label: 'donde estás ahora',
            data: [{ x: params.brecha, y: params.rho }],
            backgroundColor: COLORES_GRAFICO.primario, pointRadius: 6 }
        ];
        gCurva.options.scales.y.max = 2;
        gCurva.update('none');

        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'apoyo dentro del marco:', valor: fmtPct(pC) },
          { etiqueta: 'estimación del sondeo:', valor: fmtPct(pHat) },
          { etiqueta: 'sesgo de no cobertura:', valor: fmtNum(100 * sesgoCob, 2) + ' puntos' },
          { etiqueta: 'sesgo de no respuesta:', valor: fmtNum(100 * sesgoResp, 2) + ' puntos' },
          { etiqueta: 'sesgo total:', valor: fmtNum(100 * (pHat - p), 2) + ' puntos' },
          { etiqueta: 'gana según el sondeo:', valor: pHat > 0.5 ? 'Roosevelt ✓' : 'Landon ✗' }
        ]);
      }

      crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'cobertura', etiqueta: 'Cobertura del marco C', min: 0.25, max: 1, paso: 0.05 },
        { clave: 'brecha', etiqueta: 'Cuánto más apoyaban a Roosevelt fuera del marco', min: 0, max: 0.4, paso: 0.01 },
        { clave: 'rho', etiqueta: 'Respuesta relativa de los partidarios de Roosevelt ρ', min: 0.3, max: 1.5, paso: 0.01 }
      ], params, pintar);
      pintar();
      return [gBarras, gCurva];
    };

    // ---------------------------------------------------------------
    // M4 · Autoselección: el panel de voluntarios frente a la muestra
    //      probabilística. Datos reales de Heck, Simons y Chabris (2018).
    // ---------------------------------------------------------------
    SIMULADORES['encuestas-intell'] = function (raiz) {
      const IT = D1.intell;
      const params = { corte: 'celda', pesos: 'sin' };
      const g = crearGraficoBarras(raiz.querySelector('canvas'), [], [], {
        etiqueta: 'Censo de 2010', color: VERDAD,
        tituloX: 'Grupo', tituloY: '% del grupo en cada fuente', min: 0, max: 50,
        barrasExtra: [
          { etiqueta: 'Encuesta telefónica', valores: [], color: ENCUESTA },
          { etiqueta: 'Panel en línea', valores: [], color: OTRA }
        ]
      });
      ejes(g, { y: { formato: ENTERO } });

      // Etiquetas cortas: los nombres completos de las ocho celdas no caben.
      const CORTO = { Female: 'M', Male: 'H', Young: '<44', Old: '≥44',
                      White: 'blanca', Nonwhite: 'no blanca' };
      const celdas = IT.celdas.map(c =>
        `${CORTO[c.sexo]}·${CORTO[c.edad]}·${CORTO[c.raza]}`);

      // Con pesos, los repartos son los ponderados con los pesos de calibración (genera_cap1.R): las
      // ocho celdas quedan iguales al censo, por construcción; las demás variables, como estaban.
      function datos() {
        const pond = params.pesos === 'con';
        if (params.corte === 'celda') {
          return {
            etiquetas: celdas,
            censo: IT.celdas.map(c => c.pctCenso),
            tel: IT.celdas.map(c => (pond ? c.pctTelPond : c.pctTel)),
            online: IT.celdas.map(c => (pond ? c.pctOnlinePond : c.pctOnline))
          };
        }
        const r = IT.reparto[params.corte];
        return { etiquetas: r.niveles, censo: null,
                 tel: pond ? r.telPond : r.tel, online: pond ? r.onlinePond : r.online };
      }

      function pintar() {
        const d = datos();
        g.data.labels = d.etiquetas;
        // Sin censo de referencia, la primera serie se deja vacía en vez de
        // dibujar ceros: un cero dibujado se lee como "el censo dice 0 %".
        g.data.datasets[0].data = d.censo || d.etiquetas.map(() => null);
        g.data.datasets[0].label = d.censo ? 'Censo de 2010' : '';
        g.data.datasets[1].data = d.tel;
        g.data.datasets[2].data = d.online;
        g.options.scales.y.suggestedMax =
          Math.max(...[...d.tel, ...d.online, ...(d.censo || [0])]) * 1.15;
        g.update('none');

        const campos = [
          { etiqueta: 'edad media telefónica:', valor: fmtNum(IT.edadMedia.tel, 1) + ' años' },
          { etiqueta: 'edad media en línea:', valor: fmtNum(IT.edadMedia.online, 1) + ' años' },
          { etiqueta: '% de acuerdo (telefónica, con pesos):', valor: fmtNum(IT.agree.tel.conPesos, 1) + ' %' },
          { etiqueta: '% de acuerdo (en línea, con pesos):', valor: fmtNum(IT.agree.online.conPesos, 1) + ' %' },
          { etiqueta: 'coeficiente de variación de los pesos:', valor: 'tel. ' + fmtNum(IT.cvPesos.tel, 2) +
              ' · en línea ' + fmtNum(IT.cvPesos.online, 2) }
        ];
        // La desviación frente al censo solo se puede calcular en las ocho
        // celdas de calibración; con los demás cortes la línea no se escribe,
        // en vez de escribirla con un guion que no significa nada.
        if (d.censo) {
          const i = d.online.map((v, j) => Math.abs(v - d.censo[j]))
            .reduce((mejor, v, j, a) => (v > a[mejor] ? j : mejor), 0);
          campos.push({ etiqueta: `mayor desvío del panel en línea (${params.pesos} pesos):`,
                        valor: `${d.etiquetas[i]} (${fmtNum(d.online[i] - d.censo[i], 1)} puntos)` });
        }
        actualizarLectura(raiz.querySelector('.simulador-lectura'), campos);
      }

      crearSelector(raiz.querySelector('.simulador-controles'), {
        clave: 'corte', etiqueta: 'Comparar por',
        opciones: [
          { valor: 'celda', texto: 'Sexo × edad × raza (con censo)' },
          { valor: 'raza', texto: 'Raza' },
          { valor: 'educacion', texto: 'Educación' },
          { valor: 'region', texto: 'Región' },
          { valor: 'ingreso', texto: 'Ingreso' }
        ]
      }, params, pintar);
      crearSelector(raiz.querySelector('.simulador-controles'), {
        clave: 'pesos', etiqueta: 'Pesos',
        opciones: [{ valor: 'sin', texto: 'Sin pesos: la muestra tal como llegó' },
                   { valor: 'con', texto: 'Con los pesos de calibración' }]
      }, params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M4 · No respuesta diferencial por clases (las regiones de agpop)
    // ---------------------------------------------------------------
    SIMULADORES['no-respuesta'] = function (raiz) {
      const R = D1.agpop.regiones;                     // ya viene ordenada por media
      const params = {};
      R.forEach(r => { params['r_' + r.region] = 0.40; });

      const g = crearGraficoBarras(raiz.querySelector('canvas'),
        R.map(r => r.nombre), R.map(r => r.media), {
          etiqueta: 'media de la región', color: COLORES_GRAFICO.gris,
          tituloX: 'Clase de respuesta', tituloY: 'Media de acres92 (acres)', min: 0, max: 800000,
          lineas: [
            { valor: D1.agpop.media, etiqueta: 'media real',
              color: COLORES_GRAFICO.primario },
            { valor: D1.agpop.media, etiqueta: 'media de los que responden',
              color: COLORES_GRAFICO.secundario }
          ]
        });

      ejes(g, { y: { formato: ENTERO } });

      function pintar() {
        const r = R.map(x => params['r_' + x.region]);
        const peso = R.map((x, i) => x.N * r[i]);
        const total = peso.reduce((a, b) => a + b, 0);
        const muR = peso.reduce((a, p, i) => a + p * R[i].media, 0) / total;
        const sesgo = muR - D1.agpop.media;
        const tasaGlobal = total / R.reduce((a, x) => a + x.N, 0);

        // datasets: 0 = las barras, 1 = la media real (fija), 2 = la de los
        // respondientes, que es la única que se mueve.
        g.data.datasets[2].data = g.data.datasets[2].data.map(() => muR);
        g.update('none');

        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'media real:', valor: fmtNum(D1.agpop.media, 0) + ' acres' },
          { etiqueta: 'media de los respondientes:', valor: fmtNum(muR, 0) + ' acres' },
          { etiqueta: 'sesgo:', valor: fmtNum(sesgo, 0) + ' acres' },
          { etiqueta: 'sesgo relativo:', valor: fmtPct(sesgo / D1.agpop.media, 2) },
          { etiqueta: 'tasa global de respuesta:', valor: fmtPct(tasaGlobal) },
          { etiqueta: 'condados que responden:', valor: fmtNum(total, 0) }
        ]);
      }

      crearControles(raiz.querySelector('.simulador-controles'),
        R.map(x => ({ clave: 'r_' + x.region,
                      etiqueta: `Tasa de respuesta · ${x.nombre} (media ${fmtNum(x.media, 0)})`,
                      min: 0.05, max: 1, paso: 0.05 })),
        params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M6 · Auditor de preguntas: los defectos de redacción, uno a uno
    //
    // No hay estadística aquí y es a propósito: el efecto de una redacción
    // sobre una respuesta no se puede leer de estos datos, y poner un
    // porcentaje inventado sería exactamente el error que enseña el módulo.
    // Lo que sí se puede hacer es diagnosticar el ítem defecto a defecto.
    //
    // Los tres ítems ofrecen la misma lista de seis defectos (auditoría del
    // capítulo 1, E3: antes solo se ofrecían los que el ítem tenía, y no se
    // podía fallar). Cada ítem tiene tres; de los otros tres, los que el ítem
    // claramente no tiene cuentan como error al comprobar, y los que se pueden
    // defender se aceptan con su explicación.
    // ---------------------------------------------------------------
    const DEFECTOS_AUDITOR = [
      { clave: 'sugestiva', etiqueta: 'Sugestiva' },
      { clave: 'multiple', etiqueta: 'Varias preguntas en una' },
      { clave: 'doblenegacion', etiqueta: 'Doble negación' },
      { clave: 'vaga', etiqueta: 'Términos sin definir' },
      { clave: 'marco', etiqueta: 'Sin marco temporal' },
      { clave: 'cerrada', etiqueta: 'Sí/no para algo que tiene grados' }
    ];

    const ITEMS_AUDITOR = [
      {
        id: 'hite',
        titulo: 'Del cuestionario de Hite (1987)',
        original: '¿Tu esposo o pareja te ve como igual? ¿O hay veces que parece tratarte como inferior? ' +
          '¿Te deja fuera de las decisiones? ¿Actúa de superior?',
        tiene: {
          sugestiva: '«¿o hay veces que parece tratarte como inferior?» da por supuesto que esas veces existen y empuja a encontrarlas',
          multiple: 'son cuatro preguntas: ser tratada como igual, quedar fuera de las decisiones y el tono son cosas distintas',
          vaga: '«actuar de superior» significa algo distinto para cada persona'
        },
        noTiene: {
          doblenegacion: { tipo: 'no', por: 'ninguna de las cuatro preguntas lleva una negación' },
          cerrada: { tipo: 'discutible', por: 'tal como están escritas, las cuatro se contestan con sí o no, y la reformulación añade una escala; pero en el cuestionario de Hite eran preguntas abiertas, para contestar por escrito' },
          marco: { tipo: 'discutible', por: '«hay veces» no dice en qué periodo, y se puede defender; pero el ítem pregunta por la relación, no cuenta hechos, y lo que lo inutiliza son los tres de arriba' }
        },
        corregida: '¿Con qué frecuencia participa usted en las decisiones importantes de su relación? ' +
          '(siempre / casi siempre / a veces / casi nunca / nunca)'
      },
      {
        id: 'ejercicio',
        titulo: 'Un ítem de hábitos de salud',
        original: '¿Hace usted ejercicio?',
        tiene: {
          vaga: '¿caminar al trabajo cuenta? ¿y subir escaleras?',
          marco: '¿alguna vez en la vida, este mes, esta semana?',
          cerrada: 'sí/no borra toda la variación que interesa medir'
        },
        noTiene: {
          sugestiva: { tipo: 'no', por: 'no presupone nada ni deja ver cuál es la respuesta buena' },
          multiple: { tipo: 'no', por: 'pregunta una sola cosa; el problema es que esa cosa no está definida' },
          doblenegacion: { tipo: 'no', por: 'no lleva ninguna negación' }
        },
        corregida: 'En los últimos siete días, ¿cuántos días realizó al menos 30 minutos seguidos de ' +
          'actividad física que le quitara el aliento? (0 a 7)'
      },
      {
        id: 'servicio',
        titulo: 'Una encuesta de satisfacción',
        original: '¿No está usted de acuerdo en que no deberíamos empeorar el precio y la calidad del servicio?',
        tiene: {
          doblenegacion: '«no está de acuerdo en que no» obliga a resolver una lógica antes de opinar',
          multiple: 'precio y calidad se pueden valorar en direcciones opuestas',
          sugestiva: '«no deberíamos empeorar» ya trae la respuesta puesta'
        },
        noTiene: {
          marco: { tipo: 'no', por: 'pide una opinión sobre lo que se debería hacer, no cuenta hechos; el marco temporal hace falta para las conductas que se cuentan' },
          vaga: { tipo: 'discutible', por: '«empeorar el precio» es ambiguo, y se puede defender; pero lo que lo inutiliza son los tres de arriba' },
          cerrada: { tipo: 'discutible', por: 'si se contesta con sí o no, se pierden los grados, y se puede defender; la reformulación lo arregla con una escala' }
        },
        corregida: 'Valore por separado el precio y la calidad del servicio, de 1 (muy malo) a 5 (muy bueno).'
      }
    ];

    SIMULADORES['auditor-preguntas'] = function (raiz) {
      const params = { item: 'hite' };
      let comprobado = false;
      const panelMal = raiz.querySelector('[data-panel="original"]');
      const panelBien = raiz.querySelector('[data-panel="corregida"]');
      const contenedor = raiz.querySelector('.simulador-controles');

      function item() { return ITEMS_AUDITOR.find(i => i.id === params.item); }

      function pintar() {
        const it = item();
        const marcados = DEFECTOS_AUDITOR.filter(d => params['d_' + d.clave]);
        const nTiene = Object.keys(it.tiene).length;
        const acertados = marcados.filter(d => it.tiene[d.clave]);
        const sobran = marcados.filter(d => it.noTiene[d.clave] && it.noTiene[d.clave].tipo === 'no');
        const faltan = DEFECTOS_AUDITOR.filter(d => it.tiene[d.clave] && !params['d_' + d.clave]);

        let lista;
        if (!comprobado) {
          lista = marcados.length
            ? '<p style="margin-bottom:0.25rem;">Tu diagnóstico, todavía sin comprobar:</p><ul style="margin-bottom:0;">' +
              marcados.map(d => `<li>${d.etiqueta}</li>`).join('') + '</ul>'
            : '<p style="margin-bottom:0;">Marca arriba los defectos que creas que tiene y haz clic en «Comprobar».</p>';
        } else {
          lista = '<ul style="margin-bottom:0;">' + marcados.map(d => {
            if (it.tiene[d.clave]) return `<li>✓ <strong>${d.etiqueta}:</strong> ${it.tiene[d.clave]}</li>`;
            const n = it.noTiene[d.clave];
            return n.tipo === 'no'
              ? `<li>✗ <strong>${d.etiqueta}:</strong> no lo tiene; ${n.por}</li>`
              : `<li>≈ <strong>${d.etiqueta}:</strong> ${n.por}</li>`;
          }).join('') + '</ul>';
          if (!marcados.length) lista = '<p style="margin-bottom:0;">No marcaste ninguno, y este ítem tiene tres.</p>';
        }
        panelMal.innerHTML =
          `<p><strong>${it.titulo}</strong></p><p style="font-style:italic;">«${it.original}»</p>` + lista;

        const completo = faltan.length === 0 && sobran.length === 0;
        if (!comprobado) {
          panelBien.innerHTML = '<p style="margin-bottom:0;">Seis defectos posibles; este ítem tiene tres. ' +
            'La reformulación aparece cuando el diagnóstico esté completo y sin defectos de más.</p>';
        } else if (completo) {
          panelBien.innerHTML = `<p style="margin-bottom:0;"><strong>Una redacción que los evita:</strong> «${it.corregida}»</p>`;
        } else {
          const partes = [];
          if (faltan.length) partes.push(`te ${faltan.length === 1 ? 'falta' : 'faltan'} ${faltan.length} de ${nTiene}`);
          if (sobran.length) partes.push(`${sobran.length === 1 ? 'sobra' : 'sobran'} ${sobran.length} que no tiene`);
          panelBien.innerHTML = `<p style="margin-bottom:0;">Todavía no: ${partes.join(' y ')}. ` +
            'Cambia las casillas y vuelve a comprobar.</p>';
        }

        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'defectos acertados:', valor: comprobado ? `${acertados.length} de ${nTiene}` : '—' },
          { etiqueta: 'marcados de más:', valor: comprobado ? `${sobran.length}` : '—' },
          { etiqueta: 'tipo de error:', valor: 'de medición (no lo arregla ningún tamaño de muestra)' }
        ]);
      }

      function montar() {
        contenedor.innerHTML = '';
        comprobado = false;
        DEFECTOS_AUDITOR.forEach(d => { params['d_' + d.clave] = false; });
        crearSelector(contenedor, {
          clave: 'item', etiqueta: 'Ítem',
          opciones: ITEMS_AUDITOR.map(i => ({ valor: i.id, texto: i.titulo }))
        }, params, montar);
        crearInterruptores(contenedor,
          DEFECTOS_AUDITOR.map(d => ({ clave: 'd_' + d.clave, etiqueta: d.etiqueta })),
          params, () => { comprobado = false; pintar(); });
        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'quiz-comprobar';
        boton.textContent = 'Comprobar';
        boton.addEventListener('click', () => { comprobado = true; pintar(); });
        contenedor.appendChild(boton);
        pintar();
      }

      montar();
      return [];
    };

    // ---------------------------------------------------------------
    // M7 · ECM = sesgo² + varianza, sobre agpop
    // ---------------------------------------------------------------
    const N_AGPOP = D1.agpop.N;
    const TAMANOS = [10, 30, 100, 300, 1000, N_AGPOP];

    SIMULADORES['sesgo-varianza'] = function (raiz) {
      const params = { sesgoRel: 5, n: '3' };          // n: la posición en TAMANOS, como texto del selector
      const lienzos = raiz.querySelectorAll('canvas');
      const etiquetas = TAMANOS.map(n => (n === N_AGPOP ? 'N' : fmtNum(n, 0)));

      const gRecm = crearGraficoBarras(lienzos[0], etiquetas, [], {
        etiqueta: 'Raíz del ECM (acres)', color: OTRA,
        tituloX: 'Tamaño de muestra', tituloY: 'Raíz del ECM (acres)', min: 0, max: 200000
      });
      const gMezcla = crearGraficoBarras(lienzos[1], etiquetas, [], {
        etiqueta: '% del ECM que es sesgo²', color: COLORES_GRAFICO.secundario,
        tituloX: 'Tamaño de muestra', tituloY: '% del ECM', min: 0, max: 100
      });
      ejes(gRecm, { y: { formato: ENTERO } });
      ejes(gMezcla, { y: { formato: ENTERO } });

      function pintar() {
        const sesgo = params.sesgoRel / 100 * D1.agpop.media;
        const varianza = TAMANOS.map(n => (1 - n / N_AGPOP) * D1.agpop.S2 / n);
        const ecm = varianza.map(v => sesgo * sesgo + v);
        const recm = ecm.map(Math.sqrt);
        const mezcla = ecm.map(e => (e > 0 ? 100 * sesgo * sesgo / e : 0));

        const i = Number(params.n);
        gRecm.data.datasets[0].data = recm;
        gRecm.data.datasets[0].backgroundColor = destaca(TAMANOS.length, i, OTRA, '#083344');
        gRecm.options.scales.y.suggestedMax = Math.max(...recm) * 1.2 || 1;
        gRecm.update('none');
        gMezcla.data.datasets[0].data = mezcla;
        gMezcla.data.datasets[0].backgroundColor = destaca(TAMANOS.length, i, ENCUESTA, '#9a3412');
        gMezcla.update('none');

        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'tamaño destacado:', valor: 'n = ' + fmtNum(TAMANOS[i], 0) },
          { etiqueta: 'sesgo:', valor: fmtNum(sesgo, 0) + ' acres' },
          { etiqueta: 'error estándar:', valor: fmtNum(Math.sqrt(varianza[i]), 0) + ' acres' },
          { etiqueta: 'raíz del ECM:', valor: fmtNum(recm[i], 0) + ' acres' },
          { etiqueta: 'del ECM es sesgo:', valor: fmtNum(mezcla[i], 1) + ' %' },
          { etiqueta: 'con n = N (censo):', valor: fmtNum(recm[TAMANOS.length - 1], 0) + ' acres de error' }
        ]);
      }

      const controles = raiz.querySelector('.simulador-controles');
      crearControles(controles, [
        { clave: 'sesgoRel', etiqueta: 'Sesgo, en % de la media poblacional', min: 0, max: 20, paso: 0.5 }
      ], params, pintar);
      crearSelector(controles, { clave: 'n', etiqueta: 'Tamaño que se detalla abajo (barra oscura)',
        opciones: TAMANOS.map((n, k) => ({ valor: String(k),
          texto: n === N_AGPOP ? 'N = 3 078: el censo' : 'n = ' + fmtNum(n, 0) })) }, params, pintar);
      pintar();
      return [gRecm, gMezcla];
    };

    // ---------------------------------------------------------------
    // M7 · «n grande no salva»: 2 266 566 sesgados contra unos pocos al azar
    // ---------------------------------------------------------------
    SIMULADORES['n-grande-no-salva'] = function (raiz) {
      const ET = D1.errorTotal;
      const NS = [2, 3, 4, 5, 6, 7, 8, 10, 15, 20, 30, 50, 100, 300, 1000];
      const params = { i: '4' };                     // posición en NS, como texto del selector

      const g = crearGraficoBarras(raiz.querySelector('canvas'),
        NS.map(n => String(n)), NS.map(n => Math.sqrt(ET.S2 / n)), {
          etiqueta: 'muestra aleatoria de n',
          color: OTRA,
          tituloX: 'n de la muestra aleatoria', tituloY: 'Raíz del ECM (proporción)', min: 0, max: 0.4,
          lineas: [{ valor: ET.recmDigest,
                     etiqueta: 'el sondeo del Digest',
                     color: COLORES_GRAFICO.secundario }]
        });
      ejes(g, { y: { formato: v => fmtNum(v, 2) } });

      function pintar() {
        const i = Number(params.i), n = NS[i];
        const recm = Math.sqrt(ET.S2 / n);
        g.data.datasets[0].backgroundColor = destaca(NS.length, i, OTRA, '#083344');
        g.update('none');
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'muestra aleatoria de:', valor: fmtNum(n, 0) + ' votantes' },
          { etiqueta: 'su raíz del ECM:', valor: fmtNum(recm, 4) },
          { etiqueta: 'raíz del ECM del sondeo (2 266 566):', valor: fmtNum(ET.recmDigest, 4) },
          { etiqueta: 'gana:', valor: recm < ET.recmDigest ? 'la muestra aleatoria' : 'el sondeo sesgado' },
          { etiqueta: 'empate exacto en:', valor: fmtNum(ET.nEfectivo, 2) + ' votantes' },
          { etiqueta: 'papeletas por votante aleatorio equivalente:',
            valor: fmtNum(ET.nDigest / ET.nEfectivo, 0) }
        ]);
      }

      crearSelector(raiz.querySelector('.simulador-controles'), { clave: 'i',
        etiqueta: 'Tamaño de la muestra aleatoria (barra oscura)',
        opciones: NS.map((n, k) => ({ valor: String(k), texto: fmtNum(n, 0) + ' votantes' })) }, params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M2 y M9 · Ejercicios de clasificar, sin cifras propias
    //
    // Cada pregunta es un selector con una opción vacía al principio; al
    // elegir, el panel dice si se acertó y por qué. Las situaciones repiten
    // hechos que el capítulo ya cita y verificó (módulo 1 y módulo 2): aquí no
    // entra ningún dato nuevo.
    // ---------------------------------------------------------------
    function montarClasificador(raiz, casos, textoLectura) {
      const params = { caso: casos[0].id };
      const contenedor = raiz.querySelector('.simulador-controles');
      const panel = raiz.querySelector('[data-panel="diagnostico"]');
      const elCaso = () => casos.find(c => c.id === params.caso);

      function pintar() {
        const c = elCaso();
        let bien = 0, respondidas = 0;
        const filas = c.preguntas.map(p => {
          const r = params[p.clave];
          if (!r) return `<li><strong>${p.etiqueta}</strong> <span style="color:#6b7280;">sin responder</span></li>`;
          respondidas++;
          if (r === p.correcta) { bien++; return `<li>✔ <strong>${p.etiqueta}</strong> ${p.bien}</li>`; }
          return `<li>✘ <strong>${p.etiqueta}</strong> ${p.mal}</li>`;
        });
        panel.innerHTML = (c.intro ? `<p>${c.intro}</p>` : '') +
          `<ul style="margin-bottom:0;">${filas.join('')}</ul>` +
          (bien === c.preguntas.length && c.cierre ? `<p style="margin:0.75rem 0 0;"><strong>${c.cierre}</strong></p>` : '');
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'aciertos:', valor: `${bien} de ${c.preguntas.length}` },
          { etiqueta: 'respondidas:', valor: `${respondidas}` },
          { etiqueta: textoLectura, valor: c.nombre }
        ]);
        if (window.renderMathInElement) renderMathInElement(panel, { delimiters: [{ left: '$', right: '$', display: false }] });
      }

      function montar() {
        contenedor.innerHTML = '';
        const c = elCaso();
        if (casos.length > 1) {
          crearSelector(contenedor, { clave: 'caso', etiqueta: 'Caso',
            opciones: casos.map(x => ({ valor: x.id, texto: x.nombre })) }, params, montar);
        }
        c.preguntas.forEach(p => {
          params[p.clave] = '';
          crearSelector(contenedor, { clave: p.clave, etiqueta: p.etiqueta,
            opciones: [{ valor: '', texto: '— elige —' }].concat(p.opciones) }, params, pintar);
        });
        pintar();
      }

      montar();
      return [];
    }

    SIMULADORES['diagnostico-vocabulario'] = function (raiz) {
      return montarClasificador(raiz, [
        {
          id: 'digest', nombre: 'The Literary Digest (1936)',
          intro: 'Sitúa el sondeo en las piezas del módulo y di dónde se rompió.',
          preguntas: [
            { clave: 'pob', etiqueta: 'Población objetivo', correcta: 'votantes',
              opciones: [{ valor: 'suscriptores', texto: 'los suscriptores de la revista' },
                         { valor: 'votantes', texto: 'los votantes de la elección de 1936' },
                         { valor: 'devueltas', texto: 'las personas que devolvieron la papeleta' }],
              bien: '— la revista quería anticipar el resultado de la elección.',
              mal: '— no: la pregunta era a quién elegirían los votantes, no solo los lectores o los que contestaron.' },
            { clave: 'marco', etiqueta: 'Marco muestral', correcta: 'listas',
              opciones: [{ valor: 'padron', texto: 'el padrón electoral completo del país' },
                         { valor: 'listas', texto: 'guías de teléfono, registros de automóviles y otras listas' },
                         { valor: 'votantes', texto: 'los votantes de 1936' }],
              bien: '— y en 1936 tener teléfono o carro era señal de estar por encima de la media.',
              mal: '— el marco es la lista concreta de la que salieron los nombres, no la población a la que se quería llegar.' },
            { clave: 'obs', etiqueta: 'Muestra observada', correcta: 'devueltas',
              opciones: [{ valor: 'enviadas', texto: 'los diez millones de papeletas enviadas' },
                         { valor: 'devueltas', texto: 'las más de 2,3 millones de papeletas devueltas' },
                         { valor: 'lista', texto: 'todos los nombres de las listas' }],
              bien: '— la muestra seleccionada eran las enviadas; la observada, solo las que volvieron.',
              mal: '— la observada es lo que de verdad llegó: las papeletas que volvieron.' },
            { clave: 'allentown', etiqueta: 'En Allentown, con el marco completo, ¿qué flecha falló?', correcta: 'tercera',
              opciones: [{ valor: 'primera', texto: 'la primera, de la población al marco (no cobertura)' },
                         { valor: 'tercera', texto: 'la tercera, de la muestra seleccionada a la observada (no respuesta)' },
                         { valor: 'ninguna', texto: 'ninguna: allí el sondeo acertó' }],
              bien: '— solo devolvió la papeleta un tercio, y el resultado seguía siendo erróneo.',
              mal: '— el marco era completo, así que la primera flecha no perdió a nadie; y el resultado fue erróneo.' }
          ],
          cierre: 'El Digest se rompió en las dos flechas, y Allentown muestra que la tercera basta sola.'
        },
        {
          id: 'hite', nombre: 'Shere Hite (1987)',
          intro: 'Ahora el estudio de Hite, con las mismas piezas.',
          preguntas: [
            { clave: 'pob', etiqueta: 'Población objetivo', correcta: 'mujeres',
              opciones: [{ valor: 'socias', texto: 'las socias de las organizaciones que recibieron el cuestionario' },
                         { valor: 'mujeres', texto: 'las mujeres de Estados Unidos' },
                         { valor: 'respondieron', texto: 'las mujeres que contestaron' }],
              bien: '— a ellas atribuyó el libro sus porcentajes.',
              mal: '— el libro habló de «las mujeres», no solo de las que estaban en esas listas o contestaron.' },
            { clave: 'marco', etiqueta: 'Marco muestral', correcta: 'organizaciones',
              opciones: [{ valor: 'registro', texto: 'un registro de todas las mujeres del país' },
                         { valor: 'organizaciones', texto: 'organizaciones como grupos profesionales de mujeres, centros de asesoramiento y sociedades de iglesias' },
                         { valor: 'mujeres', texto: 'las mujeres de Estados Unidos' }],
              bien: '— quien no estaba en esas organizaciones no tenía forma de entrar.',
              mal: '— el marco es por dónde llegaron los cuestionarios: las listas de organizaciones.' },
            { clave: 'obs', etiqueta: 'Muestra observada', correcta: 'devueltos',
              opciones: [{ valor: 'enviados', texto: 'los 100 000 cuestionarios enviados' },
                         { valor: 'devueltos', texto: 'unas 4 500 respuestas, el 4,5 % de lo enviado' },
                         { valor: 'socias', texto: 'todas las socias de las organizaciones' }],
              bien: '— y contestar 127 preguntas abiertas exige una motivación que no se reparte al azar.',
              mal: '— la observada es lo que volvió: unas 4 500 respuestas.' },
            { clave: 'quien', etiqueta: '¿Quién decidió entrar en la muestra observada?', correcta: 'encuestada',
              opciones: [{ valor: 'azar', texto: 'el azar, con probabilidades conocidas' },
                         { valor: 'encuestada', texto: 'la propia encuestada, al decidir contestar' },
                         { valor: 'hite', texto: 'Hite, eligiendo a quién incluir' }],
              bien: '— es autoselección: la probabilidad de entrar dependía de lo que se quería medir.',
              mal: '— nadie sorteó nada: cada mujer decidió si devolvía el cuestionario.' }
          ],
          cierre: 'Hite falló en la cobertura del marco y, sobre todo, porque entrar dependía de la encuestada.'
        }
      ], 'caso:');
    };

    SIMULADORES['emparejar-ia'] = function (raiz) {
      const TERMINOS = [
        { valor: 'objetivo', texto: 'población objetivo' },
        { valor: 'marco', texto: 'marco muestral' },
        { valor: 'cobertura', texto: 'no cobertura' },
        { valor: 'autoseleccion', texto: 'autoselección' },
        { valor: 'respuesta', texto: 'no respuesta' },
        { valor: 'medicion', texto: 'sesgo de medición' },
        { valor: 'procesamiento', texto: 'error de procesamiento' }
      ];
      const p = (clave, etiqueta, correcta, bien) => ({ clave, etiqueta, correcta, opciones: TERMINOS, bien,
        mal: '— vuelve al diccionario de arriba y pregúntate qué parte del camino de la población a los datos falla aquí.' });
      return montarClasificador(raiz, [{
        id: 'ia', nombre: 'un proyecto de aprendizaje automático',
        preguntas: [
          p('s1', 'Un modelo de crédito nunca vio a un solicitante rechazado: no hay ninguno en sus datos.', 'cobertura',
            '— no cobertura: esas unidades tenían probabilidad cero de entrar al entrenamiento.'),
          p('s2', 'La satisfacción de los compradores se aprende de las reseñas que ellos decidieron escribir.', 'autoseleccion',
            '— autoselección: escribe quien está muy satisfecho o muy molesto.'),
          p('s3', 'Un código de faltante, −99, entró al modelo como si fuera un valor de verdad.', 'procesamiento',
            '— error de procesamiento, el mismo del −99 de agpop en el módulo 2.'),
          p('s4', 'Las personas sobre las que el modelo va a decidir cuando esté en uso.', 'objetivo',
            '— es la población objetivo: a ella se quieren llevar las conclusiones.'),
          p('s5', 'Las etiquetas de un conjunto de imágenes las puso un anotador que, ante la duda, elegía siempre la misma clase.', 'medicion',
            '— sesgo de medición: el dato registrado se desvía del verdadero siempre hacia el mismo lado.'),
          p('s6', 'La tabla de la que se sacaron los registros de entrenamiento.', 'marco',
            '— el marco: la lista concreta de la que salen las unidades.'),
          p('s7', 'Muchos usuarios abandonan el formulario antes de llenar el campo de ingresos, y sus registros quedan con ese campo vacío.', 'respuesta',
            '— no respuesta, aquí de ítem: la unidad está, pero el dato falta, y falta más en unos que en otros.')
        ],
        cierre: 'Siete de siete: el vocabulario del capítulo nombra todos los problemas de un conjunto de entrenamiento.'
      }], 'situaciones de');
    };

    // ---------------------------------------------------------------
    // M8 · Las dos poblaciones del curso
    // ---------------------------------------------------------------
    SIMULADORES['poblaciones'] = function (raiz) {
      const params = { cual: 'agpop' };
      const g = crearGraficoXY(raiz.querySelector('canvas'), [], {
        tituloX: 'Valor', tituloY: 'Número de unidades'
      });
      ejes(g, { y: { formato: ENTERO }, x: { formato: ENTERO } });
      const COLOR_REGION = { W: '#0e7490', NC: '#7c3aed', S: '#a16207', NE: '#94a3b8' };

      function pintar() {
        let series, lectura, xMax, tituloX;
        if (params.cual === 'agpop') {
          const h = D1.agpop.hist;
          const alto = Math.max(...h.conteo) * 1.05;
          series = [serieHistograma(h, 'acres92 (3 078 condados)', OTRA),
                    serieVertical(D1.agpop.media, alto, 'media poblacional', VERDAD)];
          xMax = h.tope; tituloX = 'Superficie en explotaciones agrícolas, 1992 (acres)';
          lectura = [
            { etiqueta: 'N =', valor: fmtNum(D1.agpop.N, 0) + ' condados' },
            { etiqueta: 'media =', valor: fmtNum(D1.agpop.media, 0) + ' acres' },
            { etiqueta: 'S =', valor: fmtNum(D1.agpop.S, 0) },
            { etiqueta: 'CV =', valor: fmtNum(D1.agpop.cv, 2) },
            { etiqueta: 'asimetría =', valor: fmtNum(D1.agpop.asimetria, 2) },
            { etiqueta: 'códigos −99 en acres92:', valor: String(D1.agpop.faltantes.acres92) }
          ];
        } else if (params.cual === 'regiones') {
          const alto = Math.max(...Object.values(D1.agpop.histRegion)
            .map(h => Math.max(...h.conteo))) * 1.05;
          series = D1.agpop.regiones.map(r =>
            serieHistograma(D1.agpop.histRegion[r.region], r.nombre, COLOR_REGION[r.region]));
          series.push(serieVertical(D1.agpop.media, alto, 'media global', VERDAD));
          xMax = D1.agpop.hist.tope; tituloX = 'Superficie en explotaciones agrícolas, 1992 (acres)';
          lectura = D1.agpop.regiones.map(r => ({
            etiqueta: r.nombre + ':', valor: `N = ${fmtNum(r.N, 0)}, media = ${fmtNum(r.media, 0)}`
          }));
        } else {
          const h = D1.biglucy.hist;
          const alto = Math.max(...h.conteo) * 1.05;
          series = [serieHistograma(h, 'Ingreso (85 296 empresas)', COLORES_GRAFICO.terciario),
                    serieVertical(D1.biglucy.ingresoMedio, alto, 'media poblacional', VERDAD)];
          xMax = h.tope; tituloX = 'Ingreso de la empresa';
          lectura = [
            { etiqueta: 'N =', valor: fmtNum(D1.biglucy.N, 0) + ' empresas' },
            { etiqueta: 'ingreso medio =', valor: fmtNum(D1.biglucy.ingresoMedio, 2) },
            { etiqueta: 'CV =', valor: fmtNum(D1.biglucy.cv, 2) },
            { etiqueta: 'asimetría =', valor: fmtNum(D1.biglucy.asimetria, 2) },
            { etiqueta: '% con SPAM =', valor: fmtNum(D1.biglucy.spam, 1) + ' %' },
            { etiqueta: 'variables =', valor: String(D1.biglucy.columnas) }
          ];
        }
        g.data.datasets = series;
        g.options.scales.x.min = 0;
        g.options.scales.x.max = xMax;
        g.options.scales.x.title.text = tituloX;
        g.options.scales.y.title.text = params.cual === 'biglucy' ? 'Número de empresas' : 'Número de condados';
        g.update('none');
        actualizarLectura(raiz.querySelector('.simulador-lectura'), lectura);
      }

      crearSelector(raiz.querySelector('.simulador-controles'), {
        clave: 'cual', etiqueta: 'Población',
        opciones: [
          { valor: 'agpop', texto: 'agpop · 3 078 condados' },
          { valor: 'regiones', texto: 'agpop, por región' },
          { valor: 'biglucy', texto: 'BigLucy · 85 296 empresas' }
        ]
      }, params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M3 · Los 14 arquitectos del ejercicio 2 del M10: qué es «probabilística»
    //
    // Tres maneras de sacar 8 de 14, repetidas 1 000 veces con una semilla
    // fija (la misma figura en cada visita). Cada barra es la fracción de
    // repeticiones en que entró ese arquitecto: una estimación de su π_k.
    // ---------------------------------------------------------------
    SIMULADORES['arquitectos'] = function (raiz) {
      const N_ARQ = 14, N_MUESTRA = 8, REPS = 1000;
      const params = { proc: 'directorio', acepta: 0.7 };
      const etiquetas = Array.from({ length: N_ARQ }, (_, i) => String(i + 1));
      const g = crearGraficoBarras(raiz.querySelector('canvas'), etiquetas, etiquetas.map(() => 0), {
        etiqueta: 'veces que entró', color: ENCUESTA,
        tituloX: 'Posición en el directorio', tituloY: '% de repeticiones',
        min: 0, max: 100,
        lineas: [{ valor: 100 * N_MUESTRA / N_ARQ, etiqueta: 'sorteo de 8 de 14',
                   color: VERDAD }]
      });
      ejes(g, { y: { formato: ENTERO } });

      function simular() {
        const azar = azarEstable(semillaDeTexto('arquitectos-' + params.proc + '-' + params.acepta));
        const veces = new Array(N_ARQ).fill(0);
        let tamTotal = 0;
        for (let r = 0; r < REPS; r++) {
          let elegidos = [];
          if (params.proc === 'directorio') {
            elegidos = Array.from({ length: N_MUESTRA }, (_, i) => i);
          } else if (params.proc === 'mas') {
            const orden = Array.from({ length: N_ARQ }, (_, i) => i);
            for (let i = N_ARQ - 1; i > 0; i--) {            // Fisher-Yates
              const j = Math.floor(azar() * (i + 1));
              [orden[i], orden[j]] = [orden[j], orden[i]];
            }
            elegidos = orden.slice(0, N_MUESTRA);
          } else {                                         // por orden, hasta 8 que acepten
            for (let i = 0; i < N_ARQ && elegidos.length < N_MUESTRA; i++) {
              if (azar() < params.acepta) elegidos.push(i);
            }
          }
          elegidos.forEach(i => { veces[i]++; });
          tamTotal += elegidos.length;
        }
        return { pct: veces.map(v => 100 * v / REPS), tamMedio: tamTotal / REPS };
      }

      function pintar() {
        const { pct, tamMedio } = simular();
        g.data.datasets[0].data = pct;
        g.update('none');
        const ceros = pct.filter(p => p === 0).length;
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'arquitectos que nunca entran:', valor: `${ceros} de ${N_ARQ}` },
          { etiqueta: 'suma de las π estimadas:', valor: fmtNum(pct.reduce((a, b) => a + b, 0) / 100, 2) },
          { etiqueta: 'tamaño medio de la muestra:', valor: fmtNum(tamMedio, 2) },
          { etiqueta: 'repeticiones:', valor: fmtNum(REPS, 0) }
        ]);
      }

      function montar() {
        const cont = raiz.querySelector('.simulador-controles');
        cont.innerHTML = '';
        crearSelector(cont, { clave: 'proc', etiqueta: 'Procedimiento', opciones: [
          { valor: 'directorio', texto: 'Los 8 primeros del directorio' },
          { valor: 'orden', texto: 'Por orden, hasta que 8 acepten' },
          { valor: 'mas', texto: 'Sorteo al azar de 8 de los 14' }
        ] }, params, montar);
        if (params.proc === 'orden') {
          crearControles(cont, [{ clave: 'acepta', etiqueta: 'Probabilidad de que cada uno acepte',
            min: 0.3, max: 1, paso: 0.05 }], params, pintar);
        }
        pintar();
      }

      montar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M5 · La balanza descalibrada, sobre agpop
    //
    // Modelo del módulo: y_obs = y + b + ε. Con muestreo aleatorio simple, la
    // media observada tiene esperanza μ + b y varianza (1 − n/N) S²/n + σ²/n.
    // Todo se expresa como error relativo a la media verdadera de agpop, en
    // %: la verdad es el 0. No se muestrea nada: es la fórmula, tamaño a tamaño.
    // ---------------------------------------------------------------
    SIMULADORES['balanza'] = function (raiz) {
      const mu = D1.agpop.media, S2 = D1.agpop.S2, N = D1.agpop.N;
      const params = { b: 5, ruido: 50 };              // b en % de la media; ruido, σ en % de S
      const etiquetas = TAMANOS.map(n => (n === N_AGPOP ? 'N' : fmtNum(n, 0)));
      const serie = (etiqueta, color, extra) => Object.assign({ label: etiqueta, data: TAMANOS.map(() => 0),
        borderColor: color, backgroundColor: color, borderWidth: 2, pointRadius: 3 }, extra || {});
      const g = crearGraficoLinea(raiz.querySelector('canvas'), etiquetas, [
        serie('verdad (error 0)', COLORES_GRAFICO.primario, { borderDash: [6, 4], pointRadius: 0 }),
        serie('centro de la estimación', COLORES_GRAFICO.secundario),
        serie('intervalo del 95 %', COLORES_GRAFICO.gris, { borderWidth: 1, pointRadius: 0, fill: '+1',
          backgroundColor: 'rgba(148, 163, 184, 0.25)' }),
        serie('', COLORES_GRAFICO.gris, { borderWidth: 1, pointRadius: 0 })
      ]);
      // Se ajusta después de crearlo: pasar `plugins` o `scales` al crearlo borraría los estilos de la plantilla.
      g.options.plugins.legend.labels.filter = it => it.text !== '';
      // El eje se fija en ±20 %: con n = 10 el intervalo pasa del ±90 % y aplastaría lo que importa, que es
      // dónde se queda la banda cuando n crece. Lo que se sale del eje se corta.
      g.options.scales.y.min = -20; g.options.scales.y.max = 20;
      ejes(g, { y: { formato: ENTERO } });
      g.options.scales.y.title = { display: true, text: 'error en % de la media verdadera',
                                   font: { family: 'Montserrat', size: 11 } };
      g.options.scales.x.title = { display: true, text: 'tamaño de la muestra',
                                   font: { family: 'Montserrat', size: 11 } };

      function pintar() {
        const sigma = params.ruido / 100 * Math.sqrt(S2);
        const semi = TAMANOS.map(n => 1.96 * Math.sqrt((1 - n / N) * S2 / n + sigma * sigma / n) / mu * 100);
        g.data.datasets[1].data = TAMANOS.map(() => params.b);
        g.data.datasets[2].data = semi.map(h => params.b + h);
        g.data.datasets[3].data = semi.map(h => params.b - h);
        g.update('none');
        const hCenso = semi[semi.length - 1];
        const fuera = Math.abs(params.b) > hCenso;
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'desplazamiento:', valor: fmtNum(params.b * mu / 100, 0) + ' acres por condado' },
          { etiqueta: 'semiancho con n = 10:', valor: fmtNum(semi[0], 1) + ' %' },
          { etiqueta: 'semiancho midiendo los 3 078:', valor: fmtNum(hCenso, 2) + ' %' },
          { etiqueta: 'la verdad, dentro del intervalo del censo:', valor: fuera ? 'no' : 'sí' }
        ]);
      }

      crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'b', etiqueta: 'Desplazamiento b del instrumento (% de la media)', min: -10, max: 10, paso: 0.5 },
        { clave: 'ruido', etiqueta: 'Ruido ε del instrumento (σ en % de S)', min: 0, max: 200, paso: 10 }
      ], params, pintar);
      pintar();
      return [g];
    };

    // ================================================================
    // Glosario de notación del capítulo 1
    // ================================================================
    GLOSARIOS['conceptos'] = {
      titulo: 'Notación: este material ↔ Lohr ↔ Gutiérrez',
      nota: 'Es la primera entrega de una tabla que crece con el curso. En el capítulo 2 se le ' +
        'añaden el diseño $p(s)$ y el estimador de Horvitz–Thompson; aquí solo está el ' +
        'vocabulario que hace falta para nombrar las cosas, con la probabilidad de inclusión y el ' +
        'peso, que ya aparecen en los módulos 3 y 4. ' +
        'El total se escribe $t$ aquí y en el capítulo 2; desde el capítulo 3, cuando hay varias ' +
        'variables a la vez, $t_y$. Gutiérrez llama $T$ al parámetro y $\\hat{T}$ a su estimador; ' +
        'Lohr escribe $\\hat{t}$ para el estimador del total y $\\hat{\\theta}$ para un estadístico cualquiera.',
      filas: [
        { concepto: 'Población (conjunto de unidades)', aqui: 'U', lohr: '\\mathcal{U}', gutierrez: 'U', r: '—' },
        { concepto: 'Tamaño de la población', aqui: 'N', lohr: 'N', gutierrez: 'N', r: 'nrow(agpop)' },
        { concepto: 'Unidad de la población', aqui: 'k', lohr: 'i', gutierrez: 'k', r: 'una fila' },
        { concepto: 'Variable de interés', aqui: 'y_k', lohr: 'y_i', gutierrez: 'y_k', r: 'agpop$acres92' },
        { concepto: 'Total poblacional', aqui: 't', lohr: 't', gutierrez: 't_y', r: 'sum(y)' },
        { concepto: 'Media poblacional', aqui: '\\bar{y}_U', lohr: '\\bar{y}_{\\mathcal{U}}', gutierrez: '\\bar{y}_U', r: 'mean(y)' },
        { concepto: 'Varianza poblacional', aqui: 'S^2', lohr: 'S^2', gutierrez: 'S^2_{yU}', r: 'var(y)' },
        { concepto: 'Muestra', aqui: 's', lohr: '\\mathcal{S}', gutierrez: 's', r: 'agsrs' },
        { concepto: 'Tamaño de la muestra', aqui: 'n', lohr: 'n', gutierrez: 'n', r: 'nrow(agsrs)' },
        { concepto: 'Probabilidad de inclusión', aqui: '\\pi_k', lohr: '\\pi_i', gutierrez: '\\pi_k', r: '—' },
        { concepto: 'Peso de diseño', aqui: 'd_k = 1/\\pi_k', lohr: 'w_i', gutierrez: 'd_k', r: '—' },
        { concepto: 'Estimador de un parámetro', aqui: '\\hat{\\theta}', lohr: '\\hat{\\theta}', gutierrez: '\\hat{T}', r: 'svymean()' },
        { concepto: 'Sesgo de un estimador', aqui: 'B(\\hat{\\theta}) = E(\\hat{\\theta}) - \\theta', lohr: '\\text{Bias}', gutierrez: 'B(\\hat{T})', r: '—' },
        { concepto: 'Error cuadrático medio', aqui: '\\text{ECM} = B^2 + V', lohr: '\\text{MSE}', gutierrez: '\\text{ECM}(\\hat{T})', r: '—' }
      ]
    };

    // ================================================================
    // Árbol del error total (módulo 7)
    // ================================================================
    ARBOLES_ERROR['error-total'] = {
      titulo: 'El error total de una encuesta',
      intro: 'Haz clic en cualquier nodo para ver su ficha. Lo que hay que retener de cada hoja son ' +
        'dos cosas: si desplaza la estimación o solo la dispersa, y si aumentar el tamaño de ' +
        'muestra sirve de algo.',
      nota: 'De las nueve hojas, las <strong>dos</strong> que cuelgan del error de muestreo son las ' +
        'únicas que se arreglan solo con más muestra. De las otras siete, lo sistemático no se mueve ' +
        '—y es lo que hunde a las encuestas que salen mal—; la parte aleatoria del error de medición ' +
        'sí se promedia, como explica el módulo 5. Los capítulos 2 a 7 tratan de cómo hacer pequeñas ' +
        'las dos primeras con el menor costo posible y de cómo medirlas; de las otras siete, cinco se ' +
        'tratan en este mismo capítulo (módulos 2, 4, 5 y 6) y las dos de no respuesta, en el ' +
        'capítulo 8.',
      raiz: {
        etiqueta: 'Error total de encuesta',
        resumen: 'La distancia entre lo que publica la encuesta y el valor verdadero en la ' +
          'población objetivo. Se mide con el error cuadrático medio, $\\text{ECM} = B^2 + V$, ' +
          'que junta las dos familias de abajo en un solo número.',
        efecto: 'ambos', donde: 'Todo el curso',
        ejemplo: 'el sondeo del <em>Literary Digest</em> se equivocó en 19,5 puntos, de los ' +
          'cuales prácticamente ninguno era error de muestreo.',
        hijos: [
          {
            etiqueta: 'Error de muestreo',
            resumen: 'Aparece porque se observa una parte y no el todo. Con un diseño ' +
              'probabilístico es <strong>cuantificable</strong>: se puede estimar de la propia ' +
              'muestra y se puede reducir pagando más unidades.',
            efecto: 'varianza', nAyuda: true, donde: 'Capítulos 2 a 7',
            ejemplo: 'con $n = 300$ sobre <code>agpop</code>, el error estándar de la media es ' +
              'de 23 294 acres; con $n = 1\\,200$ baja a 9 576, menos de la mitad, ' +
            'porque además actúa la corrección por población finita.',
            hijos: [
              {
                etiqueta: 'Varianza de diseño',
                resumen: 'La variación de la estimación de una muestra posible a otra. Depende ' +
                  'del diseño elegido y del tamaño, y es lo único de este árbol que el ' +
                  'estadístico controla del todo.',
                efecto: 'varianza', nAyuda: true, donde: 'Capítulos 2 a 6',
                ejemplo: 'estratificar por región reduce esta varianza sin gastar un peso más.'
              },
              {
                etiqueta: 'Sesgo de estimación',
                resumen: 'Algunos estimadores útiles no son insesgados: el de razón, por ejemplo. ' +
                  'Su sesgo es de orden $1/n$, así que desaparece al crecer la muestra, y por eso ' +
                  'vive en esta rama y no en la otra.',
                efecto: 'sesgo', nAyuda: true, donde: 'Capítulo 3',
                ejemplo: 'el estimador de razón $\\hat{t}_r$ tiene sesgo, y aun así suele batir al ' +
                  'insesgado en error cuadrático medio.'
              }
            ]
          },
          {
            etiqueta: 'Error ajeno al muestreo',
            resumen: 'Todo lo demás. No lo produce el azar sino el procedimiento, no se estima ' +
              'de la muestra y <strong>no baja con $n$</strong>. Es donde se pierden casi todas ' +
              'las encuestas que salen mal.',
            efecto: 'sesgo', nAyuda: false, donde: 'Capítulos 1 y 8',
            ejemplo: 'los 19,5 puntos del <em>Literary Digest</em>, con 2,3 millones de papeletas.',
            hijos: [
              {
                etiqueta: 'Errores de representación',
                resumen: 'Los que hacen que la muestra represente a otra población distinta de ' +
                  'la que se quería estudiar.',
                efecto: 'sesgo', nAyuda: false, donde: 'Capítulos 1 y 8',
                ejemplo: 'la encuesta telefónica de 2009 no llamó a ningún celular, y el 24,5 % de ' +
                  'los hogares solo tenía celular.',
                hijos: [
                  {
                    etiqueta: 'Error de cobertura',
                    resumen: 'El marco muestral no coincide con la población objetivo: hay ' +
                      'unidades con probabilidad cero de salir, y otras que salen sin pertenecer ' +
                      'a la población.',
                    efecto: 'sesgo', nAyuda: false, donde: 'Capítulo 1, módulo 4',
                    ejemplo: 'las listas de teléfono y de automóviles de 1936 dejaban fuera a los ' +
                      'hogares con menos recursos, en general más inclinados a Roosevelt.'
                  },
                  {
                    etiqueta: 'Autoselección',
                    resumen: 'La unidad decide si entra en la muestra. La probabilidad de ' +
                      'inclusión deja de ser conocida y pasa a depender de la propia variable ' +
                      'que se quiere medir.',
                    efecto: 'sesgo', nAyuda: false, donde: 'Capítulo 1, módulo 4',
                    ejemplo: 'el panel de Mechanical Turk tiene 33,7 años de edad media frente a ' +
                      'los 60,7 de la muestra telefónica.'
                  },
                  {
                    etiqueta: 'No respuesta de unidad',
                    resumen: 'La unidad se selecciona pero no contesta. El sesgo vale ' +
                      '$(1-r)(\\bar{y}_R - \\bar{y}_M)$: es el producto de la fracción que falta ' +
                      'por lo distinta que es.',
                    efecto: 'sesgo', nAyuda: false, donde: 'Capítulo 1, módulo 4; capítulo 8',
                    ejemplo: 'en Allentown la revista escribió a todos los votantes registrados y solo devolvió la papeleta un tercio.'
                  },
                  {
                    etiqueta: 'No respuesta de ítem',
                    resumen: 'La unidad contesta la encuesta pero deja preguntas en blanco. Se ' +
                      'trata con imputación, y la trampa está en la varianza después de imputar.',
                    efecto: 'sesgo', nAyuda: false, donde: 'Capítulo 8',
                    ejemplo: 'en la encuesta telefónica del módulo 4, parte de quienes contestaron dejó en blanco su ingreso.'
                  }
                ]
              },
              {
                etiqueta: 'Errores de medición',
                resumen: 'La unidad contesta, pero lo que queda registrado no es su valor ' +
                  'verdadero. Se corrigen antes de recoger nada, no después.',
                efecto: 'ambos', nAyuda: false, donde: 'Capítulo 1, módulos 5 y 6',
                ejemplo: 'las 127 preguntas abiertas y sugestivas del cuestionario de Hite.',
                hijos: [
                  {
                    etiqueta: 'Del instrumento',
                    resumen: 'La pregunta induce la respuesta: redacción sugestiva, doble ' +
                      'negación, dos preguntas en una, términos sin definir, orden de las opciones.',
                    efecto: 'sesgo', nAyuda: false, donde: 'Capítulo 1, módulo 6',
                    ejemplo: '«¿No está de acuerdo en que no deberíamos empeorar el servicio?».'
                  },
                  {
                    etiqueta: 'Del entrevistador o del respondiente',
                    resumen: 'Deseabilidad social, memoria, prisa, o un entrevistador que ' +
                      'sugiere sin querer. Parte va en la media (sesgo) y parte en la dispersión.',
                    efecto: 'ambos', nAyuda: false, donde: 'Capítulo 1, módulo 5',
                    ejemplo: 'declarar menos consumo de alcohol del real, siempre en la misma ' +
                      'dirección.'
                  },
                  {
                    etiqueta: 'De procesamiento',
                    resumen: 'Codificación, digitación, transformaciones mal hechas y códigos ' +
                      'de faltante tratados como números. Silencioso y perfectamente evitable.',
                    efecto: 'ambos', nAyuda: false, donde: 'Capítulo 1, módulo 2',
                    ejemplo: 'promediar el −99 de Lohr como si fuera una superficie.'
                  }
                ]
              }
            ]
          }
        ]
      }
    };

    // ================================================================
    // Autoevaluación del capítulo
    // ================================================================
    AUTOEVALUACIONES['cap1'] = [
      {
        tipo: 'opcion',
        modulo: 1,
        pregunta: 'El sondeo del <em>Literary Digest</em> recogió más de 2,3 millones de papeletas y falló por 19 puntos. ¿Qué habría arreglado el problema?',
        pista: '¿Qué cambia al mandar más papeletas por el mismo procedimiento?',
        opciones: [
          { texto: 'Ningún cambio de tamaño: fallaba <em>quién</em> entraba en la muestra y <em>quién</em> devolvía la papeleta.', correcta: true,
            retro: 'Exacto. Duplicar las papeletas habría duplicado el mismo error. El tamaño reduce la varianza, y aquí el problema era todo sesgo.' },
          { texto: 'Mandar 20 millones de papeletas en vez de 10, para que la muestra fuera todavía más grande.', correcta: false,
            retro: 'Con el mismo marco y la misma respuesta diferencial, la estimación converge al mismo 42,9 % equivocado, solo que con menos ruido alrededor.' },
          { texto: 'Calcular un intervalo de confianza con las papeletas devueltas y publicar su margen de error.', correcta: false,
            retro: 'Habría dado un intervalo de ±0,06 puntos alrededor de una cifra que estaba 19 puntos fuera. Un intervalo estrecho alrededor de un número equivocado es peor que no tener nada.' },
          { texto: 'Usar la corrección por población finita, porque la muestra era una parte grande del electorado.', correcta: false,
            retro: 'La corrección por población finita afecta a la varianza y aquí la varianza ya era despreciable: el error estándar del sondeo era de 0,0003.' }
        ]
      },
      {
        tipo: 'numerica',
        modulo: 1,
        pregunta: 'El sondeo estimó un 42,92 % de apoyo a Roosevelt y el resultado real fue 62,47 % (base de dos candidatos). ¿Cuánto vale el sesgo, en puntos porcentuales? Usa dos decimales y el signo.',
        pista: 'Sesgo = lo que estimó − lo que era. El signo importa: dice hacia dónde se equivocó.',
        respuesta: -19.54,
        tolerancia: 0.05,
        retroAcierto: '$42{,}923 - 62{,}467 = -19{,}54$ puntos (restando los valores ya redondeados sale $-19{,}55$, y también vale). El signo negativo dice que el sondeo <em>subestimó</em> a Roosevelt, que es justo lo que hacían tanto el marco como la no respuesta.',
        retroFallo: 'Es $42{,}923 - 62{,}467 = -19{,}54$. Un error frecuente es dar el valor absoluto: el sesgo tiene dirección, y saber hacia dónde apunta es la mitad del diagnóstico.'
      },
      {
        tipo: 'multiple',
        modulo: 2,
        pregunta: 'Un investigador quiere estudiar a los estudiantes de un programa y usa la lista de matrícula del semestre pasado. Marca <strong>todo</strong> lo que sea cierto.',
        pista: 'Compara la lista con el conjunto de personas sobre el que quiere concluir.',
        opciones: [
          { texto: 'La población objetivo y el marco muestral no coinciden.', correcta: true },
          { texto: 'Los que se matricularon este semestre por primera vez tienen probabilidad cero de salir.', correcta: true },
          { texto: 'Como la lista es la oficial del programa, una muestra sacada de ella será representativa.', correcta: false },
          { texto: 'El problema se resuelve tomando una muestra más grande de la lista.', correcta: false }
        ],
        retroAcierto: 'Exacto: el marco no coincide con la población, y los nuevos no pueden salir. La lista deja fuera a los que llegaron este semestre, y además puede traer a quienes ya se fueron: el marco falla por defecto y por exceso. Que sea la oficial no la hace coincidir con la población, y muestrear más de ella no le añade a nadie de los que faltan.',
        retroFallo: 'Son dos: el marco no coincide con la población, y los nuevos tienen probabilidad cero. Que la lista sea oficial no arregla lo que le falta, y una muestra más grande de un marco incompleto sigue sin ver a los que no están en él: el defecto del marco no depende de $n$.'
      },
      {
        tipo: 'opcion',
        modulo: 2,
        pregunta: 'En <code>agpop</code>, 19 condados tienen <code>acres92 = -99</code>, que es el código de faltante de Lohr. ¿Qué pasa si no se hace nada?',
        pista: 'R no sabe que −99 significa «no sé». ¿Qué hace <code>mean()</code> con ese valor?',
        opciones: [
          { texto: 'R lo promedia como una superficie de −99 acres, y la media baja: 306 677 en vez de 308 582.', correcta: true,
            retro: 'Correcto. Son 1 905 acres, un 0,6 %. Pequeño aquí, pero es un error de procesamiento: silencioso, sistemático y con la dirección siempre igual.' },
          { texto: 'R lo trata como <code>NA</code> y lo excluye del promedio, porque reconoce el código de faltante.', correcta: false,
            retro: 'No: <code>-99</code> es un número perfectamente válido para R. Solo un ser humano sabe que en este archivo significa «no se midió».' },
          { texto: 'Da error al calcular la media, porque una superficie negativa no es un valor posible.', correcta: false,
            retro: 'Ojalá. Los errores que dan error se arreglan; los que no, se publican.' },
          { texto: 'La media sube, porque −99 es un valor extremo y los extremos arrastran la media.', correcta: false,
            retro: 'Es extremo por abajo: la media baja. Comprueba el signo antes de razonar sobre la magnitud.' }
        ]
      },
      {
        tipo: 'opcion',
        modulo: 3,
        pregunta: 'Un colegio tiene 30 cursos, y cada estudiante está en uno solo. Para encuestar a sus estudiantes se sortean 3 cursos y se entrevista a todos los estudiantes de esos tres. ¿Es una muestra probabilística de los estudiantes del colegio?',
        pista: 'Aplica la definición del módulo 3 a un estudiante cualquiera: ¿con qué probabilidad entra?, ¿se conoce antes de sortear?, ¿es positiva?',
        opciones: [
          { texto: 'Sí: cada estudiante entra si sale su curso, con una probabilidad conocida y positiva.', correcta: true,
            retro: 'Exacto. Cada estudiante tiene la $\\pi_k$ de su curso, 3 de 30, que se conoce antes de sortear y es positiva para todos. Que se sorteen cursos y no personas no cambia la definición: es el muestreo por conglomerados del capítulo 5.' },
          { texto: 'No: los estudiantes no se sortean uno a uno, sino por cursos enteros.', correcta: false,
            retro: 'La definición no pide sortear unidad por unidad. Pide que cada estudiante tenga una probabilidad de entrar conocida y positiva, y aquí la tiene: la de su curso.' },
          { texto: 'No: los estudiantes de un mismo curso se parecen entre sí, y la muestra no será representativa.', correcta: false,
            retro: 'Eso toca la precisión, no la definición. Si los compañeros de curso se parecen, la estimación sale menos precisa que con un sorteo de estudiantes del mismo tamaño, pero el procedimiento sigue siendo probabilístico. «Representativa» es justo la idea que el módulo 3 sustituye.' },
          { texto: 'Sí, y lo sería con cualquier procedimiento que use el azar en algún paso.', correcta: false,
            retro: 'La conclusión es buena y la razón no. Llamar por orden hasta que ocho arquitectos acepten también tiene azar, y sus $\\pi_k$ no se conocen. Lo que hace probabilística esta muestra es que cada $\\pi_k$ se conoce y es positiva.' }
        ]
      },
      {
        tipo: 'grafico',
        modulo: 4,
        alto: 260,
        descripcionGrafico: 'Composición por sexo, edad y raza de la encuesta telefónica y del panel en línea, frente al censo de 2010',
        pregunta: 'Las barras verde oscuro son el censo de 2010. ¿Qué se puede afirmar de las dos encuestas?',
        pista: 'Mira las cuatro celdas rotuladas «&lt;44» y compáralas con las cuatro «≥44» en las tres series.',
        dibujar: canvas => {
          const c = DATOS_CAP1.intell.celdas;
          const CORTO = { Female: 'M', Male: 'H', Young: '<44', Old: '≥44',
                          White: 'blanca', Nonwhite: 'no blanca' };
          // A 375 px las 24 barras verticales quedaban de 2-3 px en un trazado de 154 x 91
          // (auditoría de cierre, VI-2): en el teléfono van horizontales, en una caja más alta.
          const movil = window.matchMedia('(max-width: 767px)').matches;
          if (movil && canvas.parentNode) canvas.parentNode.style.height = '520px';
          const g = ejes(crearGraficoBarras(canvas,
            // En el teléfono, cada rótulo en dos líneas, para no comerse el ancho del trazado.
            c.map(x => (movil ? [`${CORTO[x.sexo]}·${CORTO[x.edad]}`, CORTO[x.raza]]
                              : `${CORTO[x.sexo]}·${CORTO[x.edad]}·${CORTO[x.raza]}`)),
            c.map(x => x.pctCenso), {
              etiqueta: 'Censo 2010', color: VERDAD, min: 0, max: 50,
              barrasExtra: [
                { etiqueta: 'Telefónica', valores: c.map(x => x.pctTel), color: ENCUESTA },
                { etiqueta: 'En línea', valores: c.map(x => x.pctOnline), color: OTRA }
              ]
            }), { y: { titulo: '% del grupo en cada fuente', formato: ENTERO } });
          g.data.datasets.forEach(d => { d.barPercentage = 0.8; });
          if (movil) {
            // Ejes nuevos y planos: reasignar los objetos de opciones que ya resolvió Chart.js
            // los vuelve recursivos y la pila se desborda.
            g.options.indexAxis = 'y';
            g.options.scales = {
              x: { suggestedMin: 0, suggestedMax: 50,
                   title: { display: true, text: '% del grupo en cada fuente',
                            font: { family: 'Montserrat', size: 11 } },
                   ticks: { callback: ENTERO, stepSize: 10, font: { family: 'Fira Code', size: 11 } },
                   grid: { color: 'rgba(148, 163, 184, 0.2)' } },
              y: { ticks: { autoSkip: false, font: { family: 'Fira Code', size: 10 } },
                   grid: { display: false } }
            };
          }
          g.update('none');
          return g;
        },
        opciones: [
          { texto: 'Se alejan del censo en sentidos opuestos: la telefónica tiene mayores de más; el panel, jóvenes.', correcta: true,
            retro: 'Eso es. 60,7 años de edad media frente a 33,7. Ninguna de las dos es la población, y por eso las dos necesitan pesos.' },
          { texto: 'La telefónica es probabilística, así que reproduce el censo salvo por el error de muestreo.', correcta: false,
            retro: 'Ser probabilística no basta: se marcaron solo líneas fijas, no se llamó a celulares y contestó el 2,3 % de los números. La celda «mujer, ≥44, blanca» es el 47,8 % de la muestra y el 18,1 % del censo.' },
          { texto: 'El panel en línea se parece más al censo, porque es más reciente y llega a quien no tiene línea fija.', correcta: false,
            retro: 'Al revés: su mayor desviación es de 13,6 puntos en una sola celda, frente a los 29,6 de la telefónica en la suya. Las dos fallan, y ninguna falla por ser vieja.' },
          { texto: 'No se pueden comparar con el censo: las dos encuestas tienen tamaños distintos.', correcta: false,
            retro: 'Se comparan porcentajes, no conteos: para eso están en porcentaje. El tamaño no entra en esta comparación.' }
        ]
      },
      {
        tipo: 'opcion',
        modulo: 4,
        pregunta: 'En el simulador de no respuesta, poner las cuatro regiones al 10 % y ponerlas todas al 60 % dan el mismo sesgo: cero. ¿Por qué?',
        pista: 'Escribe la media de los respondientes cuando todas las tasas valen lo mismo y simplifica.',
        opciones: [
          { texto: 'Porque con tasas iguales la $r$ se cancela, y la media de los respondientes es la poblacional.', correcta: true,
            retro: 'Exacto. Lo que sesga no es que falte gente, sino que <em>falte de manera desigual</em>. Una tasa del 10 % pareja es inofensiva para el sesgo (aunque devastadora para la varianza).' },
          { texto: 'Porque el 10 % y el 60 % son ambos mayores que cero: basta que responda alguien en cada región.', correcta: false,
            retro: 'Prueba con una tasa pareja del 5 %: también da cero. El nivel es irrelevante para el sesgo mientras sea el mismo en todas las clases.' },
          { texto: 'Porque las cuatro regiones tienen la misma media, y da igual cuáles se pierdan.', correcta: false,
            retro: 'No la tienen: van de 90 619 acres en el Nordeste a 723 344 en el Oeste. Precisamente por eso el sesgo aparece en cuanto las tasas dejan de ser iguales.' },
          { texto: 'Porque con una tasa pareja la varianza tampoco cambia: las dos tasas dan la misma precisión.', correcta: false,
            retro: 'La varianza sí cambia, y mucho: con el 10 % quedan muchos menos respondientes que con el 60 %. El sesgo es lo único que no se mueve.' }
        ]
      },
      {
        tipo: 'numerica',
        modulo: 4,
        pregunta: 'Una encuesta obtiene respuesta del 30 % de la muestra. Entre los que responden, el 80 % declara usar el servicio; entre los que no responden, lo usa el 40 %. ¿Cuál es el porcentaje real en la población? Da un decimal.',
        pista: '$\\bar{y}_U = r\\,\\bar{y}_R + (1-r)\\,\\bar{y}_M$. Los pesos son las fracciones de cada grupo, no 50 y 50.',
        respuesta: 52.0,
        tolerancia: 0.15,
        decimales: 1,
        retroAcierto: '$0{,}3 \\times 80 + 0{,}7 \\times 40 = 52{,}0$ %. Publicar el 80 % habría sido equivocarse en 28 puntos con una encuesta impecable por lo demás.',
        retroFallo: 'Es $0{,}3 \\times 80 + 0{,}7 \\times 40 = 52{,}0$ %. El error típico es promediar 80 y 40 sin pesos y dar 60: los que no responden son la mayoría y pesan más.'
      },
      {
        tipo: 'multiple',
        modulo: 5,
        pregunta: 'Una balanza suma 300 gramos en cada pesada y además tiene un ruido aleatorio. Marca <strong>todo</strong> lo que es cierto.',
        pista: 'Separa los dos términos del modelo $y_k^{\\text{obs}} = y_k + b_k + \\varepsilon_k$ y pregúntate cuál de los dos se cancela al promediar.',
        opciones: [
          { texto: 'Pesar a 50 000 personas en vez de 50 reduce el efecto del ruido sobre el promedio.', correcta: true },
          { texto: 'Pesar a 50 000 personas en vez de 50 reduce los 300 gramos del promedio.', correcta: false },
          { texto: 'Con muchas personas, el intervalo de confianza sale estrecho y centrado en el valor equivocado.', correcta: true },
          { texto: 'El desplazamiento se delata en los propios datos: las pesadas salen más dispersas de lo que saldrían con una balanza bien calibrada.', correcta: false },
          { texto: 'Si el ruido fuera cero, el promedio daría el peso verdadero.', correcta: false }
        ],
        retroAcierto: 'Exacto: el ruido y el intervalo. El ruido $\\varepsilon_k$ se cancela al promediar; el desplazamiento $b_k$ no: no baja con más pesadas, sigue ahí aunque el ruido sea cero y no deja rastro en la dispersión de los datos. Solo lo revela información de fuera de la encuesta, como una balanza de referencia.',
        retroFallo: 'Son dos: el ruido baja con $n$, y el intervalo se estrecha alrededor de un valor desplazado. Las otras tres suponen que el desplazamiento se cancela, se nota o desaparece sin ruido, y no: $b_k$ suma lo mismo a cada pesada, así que no cambia la dispersión, no baja con más pesadas y sigue ahí aunque el ruido sea cero.'
      },
      {
        tipo: 'opcion',
        modulo: 6,
        pregunta: '«¿Cree usted que la universidad debería ampliar el horario de la biblioteca y cobrar por el préstamo de computadores?» ¿Qué defecto tiene y qué error produce?',
        pista: '¿Qué contesta quien quiere la biblioteca abierta más horas y no quiere pagar por el computador?',
        opciones: [
          { texto: 'Es de doble cañón: son dos propuestas en una. Error de medición.', correcta: true,
            retro: 'Correcto. Un «sí» o un «no» no se puede repartir entre las dos propuestas. Se arregla separándolas en dos preguntas antes de recoger un solo dato; después, ni un censo lo arregla.' },
          { texto: 'Es sugestiva: «¿Cree usted que…?» empuja a contestar que sí. Error de medición.', correcta: false,
            retro: 'Sugestiva sería «¿No cree usted que…?», que lleva la respuesta puesta. «¿Cree usted que…?» pregunta sin inclinar; el defecto es otro: son dos propuestas cosidas en una.' },
          { texto: 'Le falta marco temporal, porque no dice desde cuándo regiría el cambio.', correcta: false,
            retro: 'El marco temporal hace falta cuando se pregunta por una conducta, como «¿Hace usted ejercicio?». Aquí se pide una opinión, y el problema es que se pide sobre dos cosas a la vez.' },
          { texto: 'Produce error de muestreo, que baja al aumentar $n$ porque las respuestas confusas se compensan.', correcta: false,
            retro: 'Al contrario: con más respuestas se acumula el mismo defecto. Una pregunta mal hecha desplaza todas las respuestas hacia el mismo lado, y eso es justo lo que el módulo 5 enseña que no se promedia.' }
        ]
      },
      {
        tipo: 'opcion',
        modulo: 7,
        pregunta: 'Sobre <code>agpop</code>, un procedimiento con un sesgo del 5 % de la media se aplica a un <strong>censo</strong> ($n = N = 3\\,078$). ¿Cuál es su raíz del error cuadrático medio?',
        pista: 'Con $n = N$ la corrección por población finita vale $1 - N/N$. ¿Cuánto queda de varianza?',
        opciones: [
          { texto: 'El sesgo, unos 15 334 acres: la varianza es cero y el ECM es todo sesgo.', correcta: true,
            retro: 'Eso es. Medir a toda la población elimina el error de muestreo y deja intacto todo lo demás. Es el argumento más limpio contra «hagamos un censo y ya».' },
          { texto: 'Cero: un censo mide a todas las unidades, así que no tiene error.', correcta: false,
            retro: 'Un censo no tiene error <em>de muestreo</em>. El de cobertura, el de no respuesta y el de medición siguen ahí, y suelen ser peores en un censo que en una encuesta bien hecha.' },
          { texto: 'No se puede saber sin conocer $S^2$, la varianza de la población.', correcta: false,
            retro: '$S^2$ entra multiplicado por $1 - n/N$, que vale cero. Da igual cuánto valga.' },
          { texto: 'La mitad del sesgo, porque el ECM promedia el sesgo al cuadrado y la varianza.', correcta: false,
            retro: 'El ECM <em>suma</em> $B^2$ y $V$, no los promedia. Con $V = 0$ queda $\\sqrt{B^2} = |B|$.' }
        ]
      },
      {
        tipo: 'multiple',
        modulo: 7,
        pregunta: 'Marca <strong>todo</strong> lo que sea error ajeno al muestreo.',
        pista: 'La pregunta que los separa es siempre la misma: ¿lo reduce aumentar $n$?',
        opciones: [
          { texto: 'Que el marco deje fuera al 26,5 % de los hogares.', correcta: true },
          { texto: 'Que la media muestral cambie de una muestra a otra.', correcta: false },
          { texto: 'Que la pregunta tenga doble negación.', correcta: true },
          { texto: 'Que, con una muestra de 50 hogares, el error estándar salga grande.', correcta: false },
          { texto: 'Que una muestra sorteada con todo rigor traiga, por azar, más hogares rurales que la población.', correcta: false }
        ],
        retroAcierto: 'Exacto: el marco que deja fuera hogares y la doble negación. Las otras tres son el error de muestreo visto de tres maneras: la media que cambia de una muestra a otra, el error estándar grande con pocas unidades y la muestra que por azar trae de más un grupo. Es el único error que se estima con la propia muestra y que baja pagando más unidades.',
        retroFallo: 'Son dos: el marco incompleto y la doble negación, que no bajan aunque se paguen más unidades. Las otras tres son error de muestreo, inevitable, cuantificable y controlable con $n$. Que una muestra rigurosa traiga por azar de más un grupo es eso mismo: azar, no un defecto del procedimiento.'
      },
      {
        tipo: 'opcion',
        modulo: 8,
        pregunta: 'En <code>agpop</code> la asimetría es 5,32 y la línea de la media cae bastante a la derecha del grueso de los condados. ¿Qué consecuencia tiene eso para muestrear?',
        pista: 'Piensa en una muestra pequeña que por azar recoge, o no recoge, uno de los condados enormes.',
        opciones: [
          { texto: 'Ninguna: el recorte en el percentil 99 del histograma ya resuelve la asimetría.', correcta: false,
            retro: 'El recorte es solo para que el gráfico se vea; las unidades de la cola siguen en la población. La asimetría real es <em>peor</em> que la dibujada.' },
          { texto: 'Hay que quitar de la población los condados enormes, porque son atípicos y distorsionan la media.', correcta: false,
            retro: 'Son parte de la población: un total de superficie que los quite sale mal por construcción. Lo que cambia es cómo se diseña la muestra para no depender del azar de recogerlos.' },
          { texto: 'Con $n$ pequeño, la media muestral depende de si entra un condado enorme, y no será normal.', correcta: true,
            retro: 'Eso es. Por eso el histograma se mira <em>antes</em> de elegir el diseño: esta forma anuncia el capítulo 2 (la normalidad de la media), el 4 (estratificar por tamaño) y el 6 (probabilidades proporcionales al tamaño).' },
          { texto: 'La media deja de ser un parámetro válido, y hay que estimar la mediana.', correcta: false,
            retro: 'La media sigue definida y es la que hace falta para estimar el total, que es lo que suele interesar. Lo que se complica es estimarla bien con pocas unidades, no su sentido.' }
        ]
      },
      {
        tipo: 'opcion',
        modulo: 9,
        pregunta: 'Un asistente de voz se entrena solo con grabaciones de hablantes de Bogotá y después se usa en todo el país. ¿Qué término del diccionario nombra el problema principal?',
        pista: 'Separa dos preguntas: quién decidió que existieran las grabaciones, y quién no tenía ninguna manera de aparecer en ellas.',
        opciones: [
          { texto: 'No cobertura: los hablantes de otras regiones nunca podían entrar.', correcta: true,
            retro: 'Correcto. Para el modelo, las demás regiones son unidades fuera del marco: su probabilidad de entrar era cero, y grabar más horas en Bogotá no la sube. Es la definición del módulo 3: con $\\pi_k = 0$ para una parte de la población, ningún estimador es insesgado para la población entera.' },
          { texto: 'Autoselección: las personas grabadas decidieron participar.', correcta: false,
            retro: 'Puede haberla además, si se ofrecieron. Pero aunque se las hubiera sorteado entre todos los hablantes de Bogotá, los de las demás regiones seguirían con probabilidad cero de entrar, y eso es no cobertura.' },
          { texto: 'Sesgo de medición: el asistente va a transcribir mal los acentos que no conoce.', correcta: false,
            retro: 'Eso es la consecuencia, no el defecto de los datos. Las grabaciones de Bogotá pueden estar transcritas sin un error; lo que falla es la población que representan.' },
          { texto: 'Ninguno: con miles de horas grabadas, la teoría de muestreo deja de aplicarse.', correcta: false,
            retro: 'Es al revés. El sondeo del <em>Literary Digest</em> tenía 2,3 millones de casos y equivalía a una muestra aleatoria de 6 personas. El volumen no exime de la teoría: la hace más necesaria.' }
        ]
      }
    ];
