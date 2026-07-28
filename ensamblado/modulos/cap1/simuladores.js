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
      return (x < 0 ? '−' : '') + entero + (partes[1] ? ',' + partes[1] : '');
    }

    function fmtPct(x, d = 1) { return fmtNum(100 * x, d) + ' %'; }

    // ---------------------------------------------------------------
    // M1 · Literary Digest: el sesgo, partido en sus dos causas
    // ---------------------------------------------------------------
    SIMULADORES['digest'] = function (raiz) {
      const DG = D1.digest;
      const params = { cobertura: DG.coberturaRef, brecha: 0.25, rho: 0.72 };
      const lienzos = raiz.querySelectorAll('canvas');

      const gBarras = crearGraficoBarras(lienzos[0],
        ['Apoyo real', 'Apoyo dentro del marco', 'Lo que ve el sondeo'],
        [DG.pEleccion, 0, 0], {
          etiqueta: 'Apoyo a Roosevelt', color: COLORES_GRAFICO.primario,
          min: 0, max: 0.8,
          lineas: [{ valor: DG.pSondeo, etiqueta: 'sondeo publicado: 42,9 %',
                     color: COLORES_GRAFICO.secundario },
                   { valor: 0.5, etiqueta: 'umbral de la victoria', color: '#94a3b8' }]
        });

      const gCurva = crearGraficoXY(lienzos[1], [], {
        tituloX: 'Brecha de cobertura  d = p_F − p_C',
        tituloY: 'Razón de respuesta  ρ', xMin: 0, xMax: 0.4
      });

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
          { type: 'line', label: 'combinaciones que reproducen el sondeo',
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
          { etiqueta: 'sesgo de no cobertura:', valor: fmtPct(sesgoCob, 2) },
          { etiqueta: 'sesgo de no respuesta:', valor: fmtPct(sesgoResp, 2) },
          { etiqueta: 'sesgo total:', valor: fmtPct(pHat - p, 2) },
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
      const params = { corte: 'celda' };
      const g = crearGraficoBarras(raiz.querySelector('canvas'), [], [], {
        etiqueta: 'Censo de 2010', color: COLORES_GRAFICO.gris,
        tituloX: 'Grupo', min: 0, max: 50,
        barrasExtra: [
          { etiqueta: 'Encuesta telefónica', valores: [], color: COLORES_GRAFICO.primario },
          { etiqueta: 'Panel online (Mechanical Turk)', valores: [], color: COLORES_GRAFICO.secundario }
        ]
      });

      // Etiquetas cortas: los nombres completos de las ocho celdas no caben.
      const CORTO = { Female: 'M', Male: 'H', Young: '<44', Old: '≥44',
                      White: 'blanca', Nonwhite: 'no blanca' };
      const celdas = IT.celdas.map(c =>
        `${CORTO[c.sexo]}·${CORTO[c.edad]}·${CORTO[c.raza]}`);

      function datos() {
        if (params.corte === 'celda') {
          return {
            etiquetas: celdas,
            censo: IT.celdas.map(c => c.pctCenso),
            tel: IT.celdas.map(c => c.pctTel),
            online: IT.celdas.map(c => c.pctOnline)
          };
        }
        const r = IT.reparto[params.corte];
        return { etiquetas: r.niveles, censo: null, tel: r.tel, online: r.online };
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
          { etiqueta: 'edad media online:', valor: fmtNum(IT.edadMedia.online, 1) + ' años' },
          { etiqueta: '% de acuerdo (telefónica, con pesos):', valor: fmtNum(IT.agree.tel.conPesos, 1) + ' %' },
          { etiqueta: '% de acuerdo (online, con pesos):', valor: fmtNum(IT.agree.online.conPesos, 1) + ' %' },
          { etiqueta: 'CV de los pesos:', valor: 'tel. ' + fmtNum(IT.cvPesos.tel, 2) +
              ' · online ' + fmtNum(IT.cvPesos.online, 2) }
        ];
        // La desviación frente al censo solo se puede calcular en las ocho
        // celdas de calibración; con los demás cortes la línea no se escribe,
        // en vez de escribirla con un guion que no significa nada.
        if (d.censo) {
          const i = d.online.map((v, j) => Math.abs(v - d.censo[j]))
            .reduce((mejor, v, j, a) => (v > a[mejor] ? j : mejor), 0);
          campos.push({ etiqueta: 'mayor desvío del panel online:',
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
          etiqueta: 'Media de acres92 en la región', color: COLORES_GRAFICO.gris,
          tituloX: 'Clase de respuesta', min: 0, max: 800000,
          lineas: [
            { valor: D1.agpop.media, etiqueta: 'media real de los 3 078 condados',
              color: COLORES_GRAFICO.primario },
            { valor: D1.agpop.media, etiqueta: 'media de los que responden',
              color: COLORES_GRAFICO.secundario }
          ]
        });

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
    // Lo que sí se puede hacer es reescribir el ítem defecto a defecto.
    // ---------------------------------------------------------------
    const ITEMS_AUDITOR = [
      {
        id: 'hite',
        titulo: 'Del cuestionario de Hite (1987)',
        original: '¿Tu amante te ve como igual? ¿O hay veces que parece tratarte como inferior? ' +
          '¿Te deja fuera de las decisiones? ¿Actúa de superior?',
        defectos: [
          { clave: 'sugestiva', etiqueta: 'Sugestiva',
            que: 'da por supuesto que el trato como inferior ocurre, y solo pregunta cuánto' },
          { clave: 'multiple', etiqueta: 'Cuatro preguntas en una',
            que: 'ser tratada como igual, quedar fuera de las decisiones y el tono son cosas distintas' },
          { clave: 'vaga', etiqueta: 'Términos sin definir',
            que: '«actuar de superior» significa algo distinto para cada persona' }
        ],
        corregida: '¿Con qué frecuencia participa usted en las decisiones importantes de su relación? ' +
          '(siempre / casi siempre / a veces / casi nunca / nunca)'
      },
      {
        id: 'ejercicio',
        titulo: 'Un ítem de hábitos de salud',
        original: '¿Hace usted ejercicio?',
        defectos: [
          { clave: 'vaga', etiqueta: 'Términos sin definir',
            que: '¿caminar al trabajo cuenta? ¿y subir escaleras?' },
          { clave: 'marco', etiqueta: 'Sin marco temporal',
            que: '¿alguna vez en la vida, este mes, esta semana?' },
          { clave: 'cerrada', etiqueta: 'Respuesta binaria a algo continuo',
            que: 'sí/no borra toda la variación que interesa medir' }
        ],
        corregida: 'En los últimos siete días, ¿cuántos días realizó al menos 30 minutos seguidos de ' +
          'actividad física que le dejara sin aliento? (0 a 7)'
      },
      {
        id: 'servicio',
        titulo: 'Una encuesta de satisfacción',
        original: '¿No está usted de acuerdo en que no deberíamos empeorar el precio y la calidad del servicio?',
        defectos: [
          { clave: 'doblenegacion', etiqueta: 'Doble negación',
            que: '«no está de acuerdo en que no» obliga a resolver una lógica antes de opinar' },
          { clave: 'multiple', etiqueta: 'Doble cañón',
            que: 'precio y calidad se pueden valorar en direcciones opuestas' },
          { clave: 'sugestiva', etiqueta: 'Sugestiva',
            que: '«no deberíamos empeorar» ya trae la respuesta puesta' }
        ],
        corregida: 'Valore por separado el precio y la calidad del servicio, de 1 (muy malo) a 5 (muy bueno).'
      }
    ];

    SIMULADORES['auditor-preguntas'] = function (raiz) {
      const params = { item: 'hite' };
      const panelMal = raiz.querySelector('[data-panel="original"]');
      const panelBien = raiz.querySelector('[data-panel="corregida"]');
      const contenedor = raiz.querySelector('.simulador-controles');

      function item() { return ITEMS_AUDITOR.find(i => i.id === params.item); }

      function pintar() {
        const it = item();
        const marcados = it.defectos.filter(d => params['d_' + d.clave]);
        panelMal.innerHTML =
          `<p><strong>${it.titulo}</strong></p><p style="font-style:italic;">«${it.original}»</p>` +
          (marcados.length
            ? '<ul style="margin-bottom:0;">' + marcados.map(d =>
                `<li><strong>${d.etiqueta}:</strong> ${d.que}</li>`).join('') + '</ul>'
            : '<p style="margin-bottom:0;">Marca abajo los defectos que creas que tiene.</p>');

        const todos = marcados.length === it.defectos.length;
        panelBien.innerHTML = todos
          ? `<p style="margin-bottom:0;"><strong>Una redacción que los evita:</strong> «${it.corregida}»</p>`
          : `<p style="margin-bottom:0;">Te faltan ${it.defectos.length - marcados.length} de ` +
            `${it.defectos.length}. La reformulación aparece cuando estén los tres.</p>`;

        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'defectos detectados:', valor: `${marcados.length} de ${it.defectos.length}` },
          { etiqueta: 'tipo de error:', valor: 'de medición (no lo arregla ningún tamaño de muestra)' }
        ]);
      }

      function montar() {
        contenedor.innerHTML = '';
        const it = item();
        it.defectos.forEach(d => { params['d_' + d.clave] = false; });
        crearSelector(contenedor, {
          clave: 'item', etiqueta: 'Ítem',
          opciones: ITEMS_AUDITOR.map(i => ({ valor: i.id, texto: i.titulo }))
        }, params, montar);
        crearInterruptores(contenedor,
          it.defectos.map(d => ({ clave: 'd_' + d.clave, etiqueta: d.etiqueta })),
          params, pintar);
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
      const params = { sesgoRel: 5, n: 3 };            // n es un índice de TAMANOS
      const lienzos = raiz.querySelectorAll('canvas');
      const etiquetas = TAMANOS.map(n => (n === N_AGPOP ? 'n = N = 3 078' : 'n = ' + fmtNum(n, 0)));

      const gRecm = crearGraficoBarras(lienzos[0], etiquetas, [], {
        etiqueta: 'Raíz del ECM (acres)', color: COLORES_GRAFICO.primario,
        tituloX: 'Tamaño de muestra', min: 0, max: 200000
      });
      const gMezcla = crearGraficoBarras(lienzos[1], etiquetas, [], {
        etiqueta: '% del ECM que es sesgo²', color: COLORES_GRAFICO.secundario,
        tituloX: 'Tamaño de muestra', min: 0, max: 100
      });

      function pintar() {
        const sesgo = params.sesgoRel / 100 * D1.agpop.media;
        const varianza = TAMANOS.map(n => (1 - n / N_AGPOP) * D1.agpop.S2 / n);
        const ecm = varianza.map(v => sesgo * sesgo + v);
        const recm = ecm.map(Math.sqrt);
        const mezcla = ecm.map(e => (e > 0 ? 100 * sesgo * sesgo / e : 0));

        gRecm.data.datasets[0].data = recm;
        gRecm.options.scales.y.suggestedMax = Math.max(...recm) * 1.2 || 1;
        gRecm.update('none');
        gMezcla.data.datasets[0].data = mezcla;
        gMezcla.update('none');

        const i = params.n;
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'tamaño destacado:', valor: 'n = ' + fmtNum(TAMANOS[i], 0) },
          { etiqueta: 'sesgo:', valor: fmtNum(sesgo, 0) + ' acres' },
          { etiqueta: 'error estándar:', valor: fmtNum(Math.sqrt(varianza[i]), 0) + ' acres' },
          { etiqueta: 'raíz del ECM:', valor: fmtNum(recm[i], 0) + ' acres' },
          { etiqueta: 'del ECM es sesgo:', valor: fmtNum(mezcla[i], 1) + ' %' },
          { etiqueta: 'con n = N (censo):', valor: fmtNum(recm[TAMANOS.length - 1], 0) + ' acres de error' }
        ]);
      }

      crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'sesgoRel', etiqueta: 'Sesgo, en % de la media poblacional', min: 0, max: 20, paso: 0.5 },
        { clave: 'n', etiqueta: 'Tamaño destacado (índice)', min: 0, max: TAMANOS.length - 1, paso: 1 }
      ], params, pintar);
      pintar();
      return [gRecm, gMezcla];
    };

    // ---------------------------------------------------------------
    // M7 · «n grande no salva»: 2 266 566 sesgados contra unos pocos al azar
    // ---------------------------------------------------------------
    SIMULADORES['n-grande-no-salva'] = function (raiz) {
      const ET = D1.errorTotal;
      const NS = [2, 3, 4, 5, 6, 7, 8, 10, 15, 20, 30, 50, 100, 300, 1000];
      const params = { i: 4 };

      const g = crearGraficoBarras(raiz.querySelector('canvas'),
        NS.map(n => String(n)), NS.map(n => Math.sqrt(ET.S2 / n)), {
          etiqueta: 'RECM de un muestreo aleatorio de n votantes',
          color: COLORES_GRAFICO.primario,
          tituloX: 'n de la muestra aleatoria', min: 0, max: 0.4,
          lineas: [{ valor: ET.recmDigest,
                     etiqueta: 'RECM del sondeo de 2 266 566 papeletas',
                     color: COLORES_GRAFICO.secundario }]
        });

      function pintar() {
        const n = NS[params.i];
        const recm = Math.sqrt(ET.S2 / n);
        actualizarLectura(raiz.querySelector('.simulador-lectura'), [
          { etiqueta: 'muestra aleatoria de:', valor: fmtNum(n, 0) + ' votantes' },
          { etiqueta: 'su RECM:', valor: fmtNum(recm, 4) },
          { etiqueta: 'RECM del sondeo (2 266 566):', valor: fmtNum(ET.recmDigest, 4) },
          { etiqueta: 'gana:', valor: recm < ET.recmDigest ? 'la muestra aleatoria' : 'el sondeo sesgado' },
          { etiqueta: 'empate exacto en:', valor: fmtNum(ET.nEfectivo, 2) + ' votantes' },
          { etiqueta: 'papeletas por votante aleatorio equivalente:',
            valor: fmtNum(ET.nDigest / ET.nEfectivo, 0) }
        ]);
      }

      crearControles(raiz.querySelector('.simulador-controles'), [
        { clave: 'i', etiqueta: 'Tamaño de la muestra aleatoria (índice)', min: 0, max: NS.length - 1, paso: 1 }
      ], params, pintar);
      pintar();
      return [g];
    };

    // ---------------------------------------------------------------
    // M8 · Las dos poblaciones del curso
    // ---------------------------------------------------------------
    SIMULADORES['poblaciones'] = function (raiz) {
      const params = { cual: 'agpop' };
      const g = crearGraficoXY(raiz.querySelector('canvas'), [], {
        tituloX: 'Valor', tituloY: 'Unidades'
      });
      const COLOR_REGION = { W: '#012820', NC: '#FF6600', S: '#0e7490', NE: '#94a3b8' };

      function pintar() {
        let series, lectura, xMax, tituloX;
        if (params.cual === 'agpop') {
          const h = D1.agpop.hist;
          const alto = Math.max(...h.conteo) * 1.05;
          series = [serieHistograma(h, 'acres92 (3 078 condados)', COLORES_GRAFICO.primario),
                    serieVertical(D1.agpop.media, alto, 'media poblacional', COLORES_GRAFICO.secundario)];
          xMax = h.tope; tituloX = 'Superficie sembrada en 1992 (acres)';
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
          series.push(serieVertical(D1.agpop.media, alto, 'media global', '#dc2626'));
          xMax = D1.agpop.hist.tope; tituloX = 'Superficie sembrada en 1992 (acres)';
          lectura = D1.agpop.regiones.map(r => ({
            etiqueta: r.nombre + ':', valor: `N = ${fmtNum(r.N, 0)}, media = ${fmtNum(r.media, 0)}`
          }));
        } else {
          const h = D1.biglucy.hist;
          const alto = Math.max(...h.conteo) * 1.05;
          series = [serieHistograma(h, 'Income (85 296 empresas)', COLORES_GRAFICO.terciario),
                    serieVertical(D1.biglucy.ingresoMedio, alto, 'media poblacional', COLORES_GRAFICO.secundario)];
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

    // ================================================================
    // Glosario de notación del capítulo 1
    // ================================================================
    GLOSARIOS['conceptos'] = {
      titulo: 'Notación: este material ↔ Lohr ↔ Gutiérrez',
      nota: 'Es la primera entrega de una tabla que crece con el curso. En el capítulo 2 se le ' +
        'añaden el diseño $p(s)$, las probabilidades de inclusión y el estimador de ' +
        'Horvitz–Thompson; aquí solo está el vocabulario que hace falta para nombrar las cosas.',
      filas: [
        { concepto: 'Población objetivo', aqui: 'U', lohr: '\\mathcal{U}', gutierrez: 'U', r: '—' },
        { concepto: 'Tamaño de la población', aqui: 'N', lohr: 'N', gutierrez: 'N', r: 'nrow(agpop)' },
        { concepto: 'Unidad de la población', aqui: 'k', lohr: 'i', gutierrez: 'k', r: 'una fila' },
        { concepto: 'Variable de interés', aqui: 'y_k', lohr: 'y_i', gutierrez: 'y_k', r: 'agpop$acres92' },
        { concepto: 'Total poblacional', aqui: 't', lohr: 't', gutierrez: 't_y', r: 'sum(y)' },
        { concepto: 'Media poblacional', aqui: '\\bar{y}_U', lohr: '\\bar{y}_{\\mathcal{U}}', gutierrez: '\\bar{y}_U', r: 'mean(y)' },
        { concepto: 'Varianza poblacional', aqui: 'S^2', lohr: 'S^2', gutierrez: 'S^2_{yU}', r: 'var(y)' },
        { concepto: 'Muestra', aqui: 's', lohr: '\\mathcal{S}', gutierrez: 's', r: 'agsrs' },
        { concepto: 'Tamaño de la muestra', aqui: 'n', lohr: 'n', gutierrez: 'n', r: 'nrow(agsrs)' },
        { concepto: 'Estimador de un parámetro', aqui: '\\hat{\\theta}', lohr: '\\hat{\\theta}', gutierrez: '\\hat{\\theta}', r: 'svymean()' },
        { concepto: 'Sesgo de un estimador', aqui: 'B(\\hat{\\theta}) = E(\\hat{\\theta}) - \\theta', lohr: '\\text{Bias}', gutierrez: 'B(\\hat{\\theta})', r: '—' },
        { concepto: 'Error cuadrático medio', aqui: '\\text{ECM} = B^2 + V', lohr: '\\text{MSE}', gutierrez: '\\text{ECM}', r: '—' }
      ]
    };

    // ================================================================
    // Árbol del error total (módulo 7)
    // ================================================================
    ARBOLES_ERROR['error-total'] = {
      titulo: 'El error total de una encuesta',
      intro: 'Pulsa cualquier nodo para ver su ficha. Lo que hay que retener de cada hoja son ' +
        'dos cosas: si desplaza la estimación o solo la dispersa, y si aumentar el tamaño de ' +
        'muestra sirve de algo.',
      nota: 'De las nueve hojas, solo mejoran al aumentar $n$ las <strong>dos</strong> que cuelgan ' +
        'del error de muestreo. Las otras siete no se mueven, y son las que hunden a las encuestas ' +
        'que salen mal. Los capítulos 2 a 6 tratan de cómo hacer pequeñas las dos primeras con el ' +
        'menor costo posible; los capítulos 7 y 8, de qué hacer con las otras siete.',
      raiz: {
        etiqueta: 'Error total de encuesta',
        resumen: 'La distancia entre lo que publica la encuesta y el valor verdadero en la ' +
          'población objetivo. Se mide con el error cuadrático medio, $\\text{ECM} = B^2 + V$, ' +
          'que junta las dos familias de abajo en un solo número.',
        efecto: 'ambos', donde: 'Todo el curso',
        ejemplo: 'el sondeo del <em>Literary Digest</em> se equivocó en 19,3 puntos, de los ' +
          'cuales prácticamente ninguno era error de muestreo.',
        hijos: [
          {
            etiqueta: 'Error de muestreo',
            resumen: 'Aparece porque se observa una parte y no el todo. Con un diseño ' +
              'probabilístico es <strong>cuantificable</strong>: se puede estimar de la propia ' +
              'muestra y se puede reducir pagando más unidades.',
            efecto: 'varianza', nAyuda: true, donde: 'Capítulos 2 a 7',
            ejemplo: 'con $n = 300$ sobre <code>agpop</code>, el error estándar de la media es ' +
              'de unos 24 000 acres; con $n = 1\\,200$ se parte por la mitad.',
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
            efecto: 'sesgo', nAyuda: false, donde: 'Capítulos 1, 7 y 8',
            ejemplo: 'los 19,3 puntos del <em>Literary Digest</em>, con 2,3 millones de papeletas.',
            hijos: [
              {
                etiqueta: 'Errores de representación',
                resumen: 'Los que hacen que la muestra represente a otra población distinta de ' +
                  'la que se quería estudiar.',
                efecto: 'sesgo', nAyuda: false, donde: 'Capítulos 1 y 8',
                ejemplo: 'la encuesta telefónica de 2009 no llamó a ningún móvil, y el 24,5 % de ' +
                  'los hogares solo tenía móvil.',
                hijos: [
                  {
                    etiqueta: 'Error de cobertura',
                    resumen: 'El marco muestral no coincide con la población objetivo: hay ' +
                      'unidades con probabilidad cero de salir, y otras que salen sin pertenecer ' +
                      'a la población.',
                    efecto: 'sesgo', nAyuda: false, donde: 'Capítulo 1, módulo 4',
                    ejemplo: 'las listas de teléfono y de automóviles de 1936 dejaban fuera a los ' +
                      'hogares más pobres, que eran los que apoyaban a Roosevelt.'
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
                    efecto: 'sesgo', nAyuda: false, donde: 'Capítulo 8',
                    ejemplo: 'Hite envió 100 000 cuestionarios y le devolvieron el 4,5 %.'
                  },
                  {
                    etiqueta: 'No respuesta de ítem',
                    resumen: 'La unidad contesta la encuesta pero deja preguntas en blanco. Se ' +
                      'trata con imputación, y la trampa está en la varianza después de imputar.',
                    efecto: 'sesgo', nAyuda: false, donde: 'Capítulo 8',
                    ejemplo: 'los 19 condados de <code>agpop</code> con <code>acres92 = −99</code>.'
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
                    ejemplo: 'promediar el −99 de Lohr como si fuera una superficie sembrada.'
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
          { texto: 'Nada de lo que tuviera que ver con el tamaño: el defecto estaba en <em>quién</em> entraba en la muestra y en <em>quién</em> devolvía la papeleta.', correcta: true,
            retro: 'Exacto. Duplicar las papeletas habría duplicado el mismo error. El tamaño reduce la varianza, y aquí el problema era todo sesgo.' },
          { texto: 'Mandar 20 millones de papeletas en vez de 10.', correcta: false,
            retro: 'Con el mismo marco y la misma respuesta diferencial, la estimación converge al mismo 42,9 % equivocado, solo que con menos ruido alrededor.' },
          { texto: 'Calcular un intervalo de confianza sobre los 2,3 millones.', correcta: false,
            retro: 'Habría dado un intervalo de ±0,06 puntos alrededor de una cifra que estaba 19 puntos fuera. Un intervalo estrecho alrededor de un número equivocado es peor que no tener nada.' },
          { texto: 'Usar la corrección por población finita.', correcta: false,
            retro: 'El fpc afecta a la varianza y aquí la varianza ya era despreciable: el error estándar del sondeo era de 0,0003.' }
        ]
      },
      {
        tipo: 'numerica',
        modulo: 1,
        pregunta: 'El sondeo estimó un 42,92 % de apoyo a Roosevelt y el resultado real fue 62,24 % (base de dos candidatos). ¿Cuánto vale el sesgo, en puntos porcentuales? Usa dos decimales y el signo.',
        pista: 'Sesgo = lo que estimó − lo que era. El signo importa: dice hacia dónde se equivocó.',
        respuesta: -19.32,
        tolerancia: 0.05,
        retroAcierto: '$42{,}92 - 62{,}24 = -19{,}32$ puntos. El signo negativo dice que el sondeo <em>infravaloró</em> a Roosevelt, que es justo lo que hacían tanto el marco como la no respuesta.',
        retroFallo: 'Es $42{,}92 - 62{,}24 = -19{,}32$. Un error frecuente es dar el valor absoluto: el sesgo tiene dirección, y saber hacia dónde apunta es la mitad del diagnóstico.'
      },
      {
        tipo: 'multiple',
        modulo: 2,
        pregunta: 'Un investigador quiere estudiar a los estudiantes de un programa y usa la lista de matrícula del semestre pasado. Marca <strong>todo</strong> lo que sea cierto.',
        pista: 'Compara la lista con el conjunto de personas sobre el que quiere concluir.',
        opciones: [
          { texto: 'La población objetivo y el marco muestral no coinciden.', correcta: true },
          { texto: 'Los que se matricularon este semestre por primera vez tienen probabilidad cero de salir.', correcta: true },
          { texto: 'La lista puede contener a personas que ya no pertenecen a la población.', correcta: true },
          { texto: 'El problema se resuelve tomando una muestra más grande de la lista.', correcta: false }
        ],
        retroAcierto: 'Las tres primeras. La cuarta es el reflejo que este capítulo existe para desactivar: un marco incompleto no mejora porque se muestree más de él.',
        retroFallo: 'Son las tres primeras. El marco puede fallar por defecto (falta gente de la población) y por exceso (sobra gente que ya no pertenece), y ninguna de las dos cosas depende de $n$.'
      },
      {
        tipo: 'opcion',
        modulo: 2,
        pregunta: 'En <code>agpop</code>, 19 condados tienen <code>acres92 = −99</code>, que es el código de faltante de Lohr. ¿Qué pasa si no se hace nada?',
        pista: 'R no sabe que −99 significa «no sé». ¿Qué hace <code>mean()</code> con ese valor?',
        opciones: [
          { texto: 'R lo promedia como si fuera una superficie de −99 acres, y la media baja: 306 677 en vez de 308 582.', correcta: true,
            retro: 'Correcto. Son 1 905 acres, un 0,6 %. Pequeño aquí, pero es un error de procesamiento: silencioso, sistemático y con la dirección siempre igual.' },
          { texto: 'R lo trata como <code>NA</code> y lo excluye del promedio.', correcta: false,
            retro: 'No: <code>−99</code> es un número perfectamente válido para R. Solo un ser humano sabe que en este archivo significa «no se midió».' },
          { texto: 'Da error al calcular la media.', correcta: false,
            retro: 'Ojalá. Los errores que dan error se arreglan; los que no, se publican.' },
          { texto: 'La media sube, porque −99 es un valor extremo.', correcta: false,
            retro: 'Es extremo por abajo: la media baja. Comprueba el signo antes de razonar sobre la magnitud.' }
        ]
      },
      {
        tipo: 'grafico',
        modulo: 4,
        alto: 220,
        descripcionGrafico: 'Composición por sexo, edad y raza de la encuesta telefónica y del panel online, frente al censo de 2010',
        pregunta: 'Las barras grises son el censo de 2010. ¿Qué se puede afirmar de las dos encuestas?',
        pista: 'Mira las cuatro celdas de la izquierda (menores de 44 años) y compáralas entre las tres series.',
        dibujar: canvas => {
          const c = DATOS_CAP1.intell.celdas;
          const CORTO = { Female: 'M', Male: 'H', Young: '<44', Old: '≥44',
                          White: 'blanca', Nonwhite: 'no blanca' };
          return crearGraficoBarras(canvas,
            c.map(x => `${CORTO[x.sexo]}·${CORTO[x.edad]}·${CORTO[x.raza]}`),
            c.map(x => x.pctCenso), {
              etiqueta: 'Censo 2010', color: COLORES_GRAFICO.gris, min: 0, max: 50,
              barrasExtra: [
                { etiqueta: 'Telefónica', valores: c.map(x => x.pctTel), color: COLORES_GRAFICO.primario },
                { etiqueta: 'Online', valores: c.map(x => x.pctOnline), color: COLORES_GRAFICO.secundario }
              ]
            });
        },
        opciones: [
          { texto: 'Las dos se alejan mucho del censo, en direcciones opuestas: la telefónica sobrerrepresenta a los mayores y el panel online a los jóvenes.', correcta: true,
            retro: 'Eso es. 60,7 años de edad media frente a 33,7. Ninguna de las dos es la población, y por eso las dos necesitan pesos.' },
          { texto: 'La telefónica es probabilística, así que reproduce el censo.', correcta: false,
            retro: 'Ser probabilística no basta: se marcaron solo líneas fijas, no se llamó a móviles y contestó el 2,3 % de los números. La celda «mujer, ≥44, blanca» es el 47,8 % de la muestra y el 18,1 % del censo.' },
          { texto: 'El panel online se parece más al censo porque es más reciente.', correcta: false,
            retro: 'Al revés: su mayor desviación es de 13,6 puntos en una sola celda, frente a los 29,7 de la telefónica en la suya. Las dos fallan, y ninguna falla por ser vieja.' },
          { texto: 'No se pueden comparar porque tienen tamaños distintos.', correcta: false,
            retro: 'Se comparan porcentajes, no conteos: para eso están en porcentaje. El tamaño no entra en esta comparación.' }
        ]
      },
      {
        tipo: 'opcion',
        modulo: 4,
        pregunta: 'En el simulador de no respuesta, poner las cuatro regiones al 10 % y ponerlas todas al 60 % dan el mismo sesgo: cero. ¿Por qué?',
        pista: 'Escribe la media de los respondientes cuando todas las tasas valen lo mismo y simplifica.',
        opciones: [
          { texto: 'Porque con tasas iguales la $r$ se cancela arriba y abajo, y la media de los respondientes vuelve a ser la media poblacional.', correcta: true,
            retro: 'Exacto. Lo que sesga no es que falte gente, sino que <em>falte de manera desigual</em>. Una tasa del 10 % pareja es inofensiva para el sesgo (aunque devastadora para la varianza).' },
          { texto: 'Porque el 10 % y el 60 % son ambos mayores que cero.', correcta: false,
            retro: 'Prueba con un 5 % pareja: también da cero. El nivel es irrelevante para el sesgo mientras sea el mismo en todas las clases.' },
          { texto: 'Porque las cuatro regiones tienen la misma media.', correcta: false,
            retro: 'No la tienen: van de 90 619 acres en el Nordeste a 723 344 en el Oeste. Precisamente por eso el sesgo aparece en cuanto las tasas dejan de ser iguales.' },
          { texto: 'Porque el sesgo solo se define cuando la tasa es menor del 50 %.', correcta: false,
            retro: 'El sesgo está definido para cualquier tasa positiva; no hay ningún umbral.' }
        ]
      },
      {
        tipo: 'numerica',
        modulo: 4,
        pregunta: 'Una encuesta obtiene respuesta del 30 % de la muestra. Entre los que responden, el 80 % declara usar el servicio; entre los que no responden, lo usa el 40 %. ¿Cuál es el porcentaje real en la población? Da un decimal.',
        pista: '$\\bar{y}_U = r\\,\\bar{y}_R + (1-r)\\,\\bar{y}_M$. Los pesos son las fracciones de cada grupo, no 50 y 50.',
        respuesta: 52.0,
        tolerancia: 0.15,
        retroAcierto: '$0{,}3 \\times 80 + 0{,}7 \\times 40 = 52{,}0$ %. Publicar el 80 % habría sido equivocarse en 28 puntos con una encuesta impecable por lo demás.',
        retroFallo: 'Es $0{,}3 \\times 80 + 0{,}7 \\times 40 = 52{,}0$ %. El error típico es promediar 80 y 40 sin pesos y dar 60: los que no responden son la mayoría y pesan más.'
      },
      {
        tipo: 'opcion',
        modulo: 6,
        pregunta: '«¿Está usted satisfecho con el precio y la calidad del servicio?» ¿Qué defecto tiene y qué error produce?',
        pista: '¿Qué contesta alguien a quien le gusta el precio y le parece mala la calidad?',
        opciones: [
          { texto: 'Es de doble cañón: pregunta dos cosas a la vez, y la respuesta no se puede interpretar. Es error de medición.', correcta: true,
            retro: 'Correcto. Y como es de medición, ni un censo lo arregla: hay que reescribir la pregunta antes de recoger un solo dato.' },
          { texto: 'Es sugestiva, porque supone que hay satisfacción.', correcta: false,
            retro: 'Sugestiva sería «¿No está de acuerdo en que el servicio es bueno?». Aquí el defecto es otro: son dos preguntas cosidas en una.' },
          { texto: 'No tiene defecto: es una pregunta cerrada y clara.', correcta: false,
            retro: 'Piensa en alguien a quien le encanta el precio y le parece pésima la calidad. Cualquier cosa que conteste será una respuesta a otra pregunta.' },
          { texto: 'Produce error de muestreo, que baja al aumentar $n$.', correcta: false,
            retro: 'Al contrario: con más respuestas se acumula el mismo defecto. El error de medición es sistemático, y ese es todo el punto del módulo 7.' }
        ]
      },
      {
        tipo: 'opcion',
        modulo: 7,
        pregunta: 'Sobre <code>agpop</code>, un procedimiento con un sesgo del 5 % de la media se aplica a un <strong>censo</strong> ($n = N = 3\\,078$). ¿Cuál es su raíz del error cuadrático medio?',
        pista: 'Con $n = N$ la corrección por población finita vale $1 - N/N$. ¿Cuánto queda de varianza?',
        opciones: [
          { texto: 'Exactamente el sesgo, unos 15 334 acres: la varianza es cero y el ECM es todo sesgo.', correcta: true,
            retro: 'Eso es. Medir a toda la población elimina el error de muestreo y deja intacto todo lo demás. Es el argumento más limpio contra «hagamos un censo y ya».' },
          { texto: 'Cero: un censo no tiene error.', correcta: false,
            retro: 'Un censo no tiene error <em>de muestreo</em>. El de cobertura, el de no respuesta y el de medición siguen ahí, y suelen ser peores en un censo que en una encuesta bien hecha.' },
          { texto: 'No se puede saber sin conocer $S^2$.', correcta: false,
            retro: '$S^2$ entra multiplicado por $1 - n/N$, que vale cero. Da igual cuánto valga.' },
          { texto: 'La mitad del sesgo, porque el ECM promedia los dos términos.', correcta: false,
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
          { texto: 'Que conteste el 4,5 % de las personas a las que se envió el cuestionario.', correcta: true },
          { texto: 'Que la pregunta tenga doble negación.', correcta: true },
          { texto: 'Que la media muestral cambie de una muestra a otra.', correcta: false }
        ],
        retroAcierto: 'Las tres primeras. La cuarta es la definición misma del error de muestreo, y es la única del curso que se estima de la propia muestra y se reduce pagando más unidades.',
        retroFallo: 'Son las tres primeras. La variación de una muestra a otra es error de muestreo: inevitable, cuantificable y controlable. Las otras tres no cumplen ninguna de las tres cosas.'
      },
      {
        tipo: 'opcion',
        modulo: 9,
        pregunta: 'Un modelo se entrena con reseñas escritas por usuarios que decidieron escribirlas y se despliega sobre todos los compradores. ¿A qué se parece eso?',
        pista: 'Piensa en quién decide entrar en la muestra y en qué correlaciona con esa decisión.',
        opciones: [
          { texto: 'A una muestra autoseleccionada: el conjunto de entrenamiento es el marco, y quien escribe una reseña no es una unidad cualquiera de la población de compradores.', correcta: true,
            retro: 'Correcto, y la fórmula del sesgo es literalmente la misma del módulo 4. Cambia el vocabulario —«datos de entrenamiento» en vez de «marco»— pero no la matemática.' },
          { texto: 'A un muestreo aleatorio simple, porque las reseñas llegan en orden aleatorio.', correcta: false,
            retro: 'El orden de llegada no tiene nada que ver con la probabilidad de inclusión. Lo que importa es <em>quién</em> decide escribir, y eso correlaciona con la satisfacción.' },
          { texto: 'A un error de medición.', correcta: false,
            retro: 'Puede haberlo además (las reseñas exageran), pero el defecto principal es de representación: la población que generó los datos no es la población sobre la que se decide.' },
          { texto: 'A nada de lo visto: el volumen de datos es demasiado grande para que aplique la teoría de muestreo.', correcta: false,
            retro: 'Es al revés. El sondeo del <em>Literary Digest</em> tenía 2,3 millones de casos y equivalía a una muestra aleatoria de 6 personas. El volumen no exime de la teoría: la hace más necesaria.' }
        ]
      }
    ];
