/* interfaz.js — el dibujo y los eventos del laboratorio πPT.
 *
 * Todo el cálculo está en motor.js; aquí solo se lee el estado, se llama al
 * motor y se pinta. Dos reglas que corrigen al original (T7.118):
 *   · la tabla de la población no se reconstruye mientras se escribe en ella
 *     (el original la rehacía en cada tecla y solo dejaba entrar una cifra);
 *   · el estado vive en la URL (#…), con su semilla: un enlace reproduce lo que
 *     se ve, réplicas incluidas.
 */
(function () {
  'use strict';
  const { numero, pct, lista } = Retos;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const NOMBRE_DISENO = {
    sistematico_fijo: 'sistemático con la lista fija',
    sistematico_aleatorio: 'sistemático con la lista barajada',
    maxima_entropia: 'máxima entropía',
  };
  const DOS = ESCENARIOS.dos_etapas;
  const RETOS = Retos.crea(Motor, ESCENARIOS);

  // Decimales según el tamaño: 14 248 · 305,0 · 2,49 · 0,1667.
  function cifra(v, ref = v) {
    const a = Math.abs(ref);
    return numero(v, a >= 1000 ? 0 : a >= 10 ? 1 : a >= 1 ? 2 : 4);
  }
  // Una columna de datos: sin decimales si todos son enteros (100, no 100,00).
  function columna(valores) {
    if (valores.every(v => Number.isInteger(v))) return (v) => numero(v, 0);
    const ref = Motor.suma(valores.map(Math.abs)) / valores.length;
    return (v) => cifra(v, ref);
  }
  // Un sesgo grande se dice en veces, no en un porcentaje de siete cifras.
  function sesgoRelativo(x, V) {
    const r = (x - V) / (V || 1);
    if (Math.abs(r) >= 10) return `${numero(x / (V || 1), 0)} veces V`;
    return `${r >= 0 ? '+' : ''}${pct(r)}`;
  }
  // Los nombres de las verificaciones vienen del motor en texto plano: π_kl → π<sub>kl</sub>.
  const subindices = (s) => esc(s).replace(/_\{([^}]*)\}/g, '<sub>$1</sub>').replace(/_([a-zπ]+)/g, '<sub>$1</sub>');
  // 2,2·10⁻¹⁶ en lugar de 2.2e-16.
  function cientifica(v) {
    if (v === 0) return '0';
    const exp = Math.floor(Math.log10(Math.abs(v)));
    const sup = String(exp).replace('-', '⁻').replace(/\d/g, d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);
    return `${numero(v / 10 ** exp, 1)}·10${sup}`;
  }
  const sub = (s) => `<sub>${s}</sub>`;
  const conjunto = (ids) => `{${ids.map(esc).join(', ')}}`;

  // ------------------------------------------------------------------- estado
  function inicial() {
    return {
      // u empieza en 0,75 ({C, D}): con 0,25 la guía pedía «mover u hasta {B, D}» y ya estaba ahí (T7.121).
      tab: 1, esc: 'tiendas', n: 2, diseno: 'maxima_entropia', u: 0.75,
      delta: 0, constante: false, par: [0, 1], semilla: 2026, R: 5000, pagina: 0,
      dos: { n: DOS.n, m: DOS.m, rho: DOS.rho, semilla: DOS.semilla, diseno: 'maxima_entropia', c1: DOS.costos.c1, c2: DOS.costos.c2, C: DOS.costos.C },
    };
  }
  let E = inicial();
  let unidades = [];            // la población editable: [{ id, x, y }]
  let sorteos = 0;              // cuántas veces se pulsó «Sortear u»
  let simulacion = null;        // { clave, resultado }

  const escenario = () => ESCENARIOS.una_etapa.find(e => e.clave === E.esc) || ESCENARIOS.una_etapa[0];
  const copia = (us) => us.map(u => ({ id: u.id, x: u.x, y: u.y }));
  const mediaY = () => Motor.suma(unidades.map(u => u.y)) / unidades.length;
  // La población que se analiza: la editable, con el δ o la y constante de la pestaña 2.
  function enUso() {
    if (E.constante) { const m = mediaY(); return unidades.map(u => ({ ...u, y: m })); }
    return E.delta ? Motor.desplazaY(unidades, E.delta) : copia(unidades);
  }

  // Los análisis se recalculan solo si cambia algo de lo que dependen.
  const memoria = new Map();
  function analisis(diseno) {
    const us = enUso();
    const clave = JSON.stringify([us.map(u => [u.x, u.y]), E.n, diseno]);
    if (!memoria.has(clave)) {
      if (memoria.size > 40) memoria.clear();
      memoria.set(clave, Motor.analiza(us, E.n, diseno));
    }
    const a = memoria.get(clave);
    a.clave = clave;
    return a;
  }

  // ------------------------------------------------------------ estado en la URL
  function aUrl() {
    const p = new URLSearchParams();
    p.set('t', E.tab); p.set('e', E.esc); p.set('n', E.n); p.set('d', E.diseno); p.set('u', E.u);
    if (E.delta) p.set('dl', +E.delta.toFixed(4));
    if (E.constante) p.set('c', 1);
    p.set('s', E.semilla); p.set('r', E.R);
    const base = escenario().unidades;
    const editada = unidades.length !== base.length || unidades.some((u, k) => u.x !== base[k].x || u.y !== base[k].y);
    if (editada) p.set('p', unidades.map(u => `${u.id}:${u.x}:${u.y}`).join(';'));
    const d = E.dos;
    p.set('dn', d.n); p.set('dm', d.m); p.set('dr', d.rho); p.set('ds', d.semilla); p.set('dd', d.diseno);
    p.set('c1', d.c1); p.set('c2', d.c2); p.set('pr', d.C);
    history.replaceState(null, '', '#' + p.toString());
  }
  function deUrl() {
    const p = new URLSearchParams(location.hash.slice(1));
    const num = (k, def) => (p.has(k) && Number.isFinite(+p.get(k)) ? +p.get(k) : def);
    if (p.has('e') && ESCENARIOS.una_etapa.some(e => e.clave === p.get('e'))) E.esc = p.get('e');
    unidades = copia(escenario().unidades);
    if (p.has('p')) {
      const leidas = p.get('p').split(';').map(t => t.split(':')).filter(t => t.length === 3)
        .map(([id, x, y]) => ({ id: id.slice(0, 6), x: +x, y: +y }));
      // Los nombres llegan de una URL: solo letras, números, «_» y «-», para que nada de
      // lo que se pegue en ella acabe como marcado en la página.
      const valida = (u) => /^[\w-]{1,6}$/.test(u.id) && u.x > 0 && Number.isFinite(u.x) && u.y >= 0 && Number.isFinite(u.y);
      if (leidas.length >= 3 && leidas.length <= Motor.LIMITE_N && leidas.every(valida)) unidades = leidas;
    }
    E.tab = Math.min(4, Math.max(1, Math.round(num('t', 1))));
    E.n = Math.round(num('n', escenario().n));
    if (Motor.ESQUEMAS.includes(p.get('d'))) E.diseno = p.get('d');
    E.u = Math.min(0.999, Math.max(0, num('u', 0.75)));
    // δ al rango del deslizador: un dl=1e200 pegado en la URL dejaba la página en NaN.
    const ys = unidades.map(u => u.y);
    E.delta = Math.min(Math.ceil(Math.max(...ys)), Math.max(-Math.floor(Math.min(...ys)), num('dl', 0)));
    E.constante = p.get('c') === '1';
    E.semilla = Math.max(1, Math.round(num('s', 2026)));
    E.R = [1000, 5000, 20000].includes(num('r', 5000)) ? num('r', 5000) : 5000;
    const d = E.dos;
    d.n = Math.round(num('dn', d.n)); d.m = Math.round(num('dm', d.m)); d.rho = num('dr', d.rho);
    d.semilla = Math.max(1, Math.round(num('ds', d.semilla)));
    if (['maxima_entropia', 'sistematico_fijo'].includes(p.get('dd'))) d.diseno = p.get('dd');
    const positivo = (k, def) => { const v = num(k, def); return v > 0 ? v : def; };
    d.c1 = positivo('c1', d.c1); d.c2 = positivo('c2', d.c2); d.C = positivo('pr', d.C);
    acota();
  }
  function acota() {
    E.n = Math.min(unidades.length - 1, Math.max(1, E.n));
    E.dos.n = Math.min(8, Math.max(2, E.dos.n));
    E.dos.m = Math.min(20, Math.max(1, E.dos.m));
    E.dos.rho = Math.min(0.6, Math.max(0, E.dos.rho));
  }

  // --------------------------------------------------------------- utilidades SVG
  function pasoBonito(r) {
    const e = 10 ** Math.floor(Math.log10(r));
    const f = r / e;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * e;
  }
  function marcas(min, max, cuantas = 5) {
    const paso = pasoBonito((max - min) / cuantas || 1);
    const salida = [];
    for (let v = Math.ceil(min / paso) * paso; v <= max + paso * 1e-9; v += paso) salida.push(+v.toFixed(10));
    return { valores: salida, dec: Math.max(0, -Math.floor(Math.log10(paso) + 1e-9)) };
  }
  // El SVG se dibuja al ancho de su caja, dividido por la escala de la letra: en el
  // modo proyector (letra al 125 %) sale con un viewBox menor y se ve 1,25 veces más grande.
  const escalaLetra = () => parseFloat(getComputedStyle(document.documentElement).fontSize) / 16 || 1;
  const anchoDe = (id, maximo) => Math.max(300, Math.min(maximo, Math.floor(($(id).clientWidth || maximo) / escalaLetra())));
  const T = (x, y, texto, extra = '') => `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" ${extra}>${esc(texto)}</text>`;

  // ---------------------------------------------------------------- la población
  function opcionesN(sel, desde, hasta, valor) {
    sel.innerHTML = '';
    for (let v = desde; v <= hasta; v++) sel.add(new Option(String(v), String(v), false, v === valor));
  }

  function construyePoblacion() {
    const e = escenario();
    const modificada = E.delta !== 0 || E.constante;
    $('tabla-poblacion').tHead.innerHTML = `<tr><th scope="col">Unidad</th><th scope="col">x · ${esc(e.x)}</th>` +
      `<th scope="col">y · ${esc(e.y)}</th>${modificada ? '<th scope="col">y en uso</th>' : ''}` +
      `<th scope="col">ψ${sub('k')}</th><th scope="col">π${sub('k')}</th></tr>`;
    const cuerpo = $('tabla-poblacion').tBodies[0];
    cuerpo.innerHTML = '';
    unidades.forEach((u, k) => {
      const fila = cuerpo.insertRow();
      fila.innerHTML = `<th scope="row">${esc(u.id)}</th>` +
        `<td><input type="text" inputmode="decimal" data-k="${k}" data-campo="x" value="${String(u.x).replace('.', ',')}" aria-label="x de ${esc(u.id)}"></td>` +
        `<td><input type="text" inputmode="decimal" data-k="${k}" data-campo="y" value="${String(u.y).replace('.', ',')}" aria-label="y de ${esc(u.id)}"></td>` +
        (modificada ? `<td class="num" data-uso="${k}"></td>` : '') +
        `<td class="num" data-psi="${k}"></td><td class="num" data-pi="${k}"></td>`;
    });
    opcionesN($('sel-n'), 1, unidades.length - 1, E.n);
    $('boton-agregar').disabled = unidades.length >= Motor.LIMITE_N;
    $('boton-quitar').disabled = unidades.length <= 3;
    $('boton-agregar').title = unidades.length >= Motor.LIMITE_N ? `Hasta ${Motor.LIMITE_N} unidades: con más, las muestras ya no se enumeran todas.` : '';
    $('boton-quitar').title = unidades.length <= 3 ? 'Con menos de 3 unidades no hay diseño que comparar.' : '';
    const marca = e.tipo === 'dato' ? '<span class="marca dato">Dato</span>' : '<span class="marca ilustrativo">Ejemplo ilustrativo</span>';
    $('escenario-fuente').innerHTML = `${marca} ${esc(e.proposito || e.titulo)}${e.fuente ? ` Fuente: ${esc(e.fuente)}.` : ''}`;
    errores.clear();
  }

  // Los mensajes de los campos inválidos, por campo: así una edición válida en
  // otro campo no borra el aviso de uno que sigue mal.
  const errores = new Map();
  function muestraErrores(a) {
    const textos = [...errores.values()];
    if (a && a.errores.length) textos.push(...a.errores);
    $('errores-poblacion').textContent = textos.join(' ');
  }

  function actualizaPoblacion(a) {
    const us = enUso();
    const modificada = E.delta !== 0 || E.constante;
    const aviso = $('aviso-desplazada');
    aviso.classList.toggle('oculto', !modificada);
    if (modificada) {
      aviso.innerHTML = `<p>${E.constante ? 'Las y en uso son todas iguales a su media' : `Las y en uso están desplazadas δ = ${cifra(E.delta)}`}, ` +
        `desde la pestaña 2. Las pestañas 1, 2 y 3 calculan con ellas. ` +
        `<button type="button" class="boton secundario" data-accion="delta-cero">Volver a los datos</button></p>`;
    }
    muestraErrores(a);
    if (a.errores.length) return;
    // Las celdas se leen por su índice; si la tabla aún no se rehízo (por ejemplo, al
    // reiniciar desde un escenario más largo), las que sobran se saltan.
    document.querySelectorAll('#tabla-poblacion [data-psi]').forEach(td => { const k = +td.dataset.psi; if (k < a.N) td.textContent = numero(a.psi[k], 4); });
    document.querySelectorAll('#tabla-poblacion [data-pi]').forEach(td => {
      const k = +td.dataset.pi;
      if (k < a.N) td.innerHTML = numero(a.pi[k], 4) + (a.forzosa[k] ? ' <span class="forzosa-etq">forzosa</span>' : '');
    });
    const fUso = columna(us.map(u => u.y));
    document.querySelectorAll('#tabla-poblacion [data-uso]').forEach(td => { const k = +td.dataset.uso; if (k < us.length) td.textContent = fUso(us[k].y); });
    const nf = a.forzosa.filter(Boolean).length;
    const fx = columna(unidades.map(u => u.x)), fy = columna(unidades.map(u => u.y));
    $('tabla-poblacion').tFoot.innerHTML = `<tr class="total"><th scope="row">N = ${a.N}</th><td class="num">t${sub('x')} = ${fx(a.tx)}</td>` +
      `<td class="num">t = ${fy(Motor.suma(unidades.map(u => u.y)))}</td>${modificada ? `<td class="num">t = ${cifra(a.referencias.t)}</td>` : ''}` +
      `<td class="num">Σ = 1</td><td class="num">Σ = ${a.n}${nf ? ` (${nf} forzosa${nf > 1 ? 's' : ''})` : ''}</td></tr>`;
  }

  function leeCampo(input) {
    const k = +input.dataset.k;
    const campo = input.dataset.campo;
    const texto = input.value.trim().replace(/\s/g, '');
    // «1.000» es mil en Colombia, pero Number() lo lee como 1: se rechaza y se explica.
    const miles = /^\d{1,3}(\.\d{3})+$/.test(texto);
    const v = Number(texto.replace(',', '.'));
    const valido = texto !== '' && !miles && Number.isFinite(v) && (campo === 'x' ? v > 0 : v >= 0);
    input.setAttribute('aria-invalid', valido ? 'false' : 'true');
    const clave = `${k}-${campo}`;
    if (!valido) {
      const motivo = miles ? 'escribe los miles sin punto (1000) y los decimales con coma (2,5)'
        : campo === 'x' ? 'x debe ser un número positivo' : 'y debe ser un número mayor o igual que 0';
      errores.set(clave, `${unidades[k].id}: ${motivo}. Mientras tanto se calcula con el último valor válido, ${String(unidades[k][campo]).replace('.', ',')}.`);
      muestraErrores();
      return;
    }
    errores.delete(clave);
    unidades[k][campo] = v;
    pinta({ tabla: false });
  }

  // ------------------------------------------------------------------ pestaña 1
  function pintaRegla(a) {
    const n = a.n;
    const W = anchoDe('svg-regla', 900), izq = 26, der = 26, alto = 178, y0 = 64;
    const escala = (v) => izq + (W - izq - der) * v / n;
    let acum = 0;
    const s = Motor.muestraRegla(a.pi, n, E.u);
    let svg = '';
    a.pi.forEach((p, k) => {
      const x1 = escala(acum), x2 = escala(acum + p);
      const dentro = s.includes(k);
      // Los tramos de la muestra, con relleno naranja y un filete arriba: el
      // tono claro de antes no se distinguía al proyectar (1,05:1).
      svg += `<rect x="${x1.toFixed(1)}" y="${y0}" width="${Math.max(0.5, x2 - x1).toFixed(1)}" height="38" fill="${dentro ? '#FED7AA' : (k % 2 ? '#E2E8F0' : '#F1F5F9')}" stroke="#012820" stroke-width="1"/>` +
        (dentro ? `<rect x="${x1.toFixed(1)}" y="${y0 - 4}" width="${Math.max(0.5, x2 - x1).toFixed(1)}" height="4" fill="#B84A00"/>` : '');
      const medio = (x1 + x2) / 2;
      if (x2 - x1 >= 34) svg += T(medio, y0 + 17, a.ids[k], 'text-anchor="middle" font-size="14" font-weight="700" fill="#012820"');
      if (x2 - x1 >= 46) svg += T(medio, y0 + 33, numero(p, 3), 'text-anchor="middle" font-size="12" fill="#334155"');
      acum += p;
    });
    // Los tramos angostos seguidos comparten un rótulo debajo («U1–U4»): uno por
    // tramo se amontonaba en un borrón ilegible.
    acum = 0;
    let grupo = null;
    const grupos = [];
    a.pi.forEach((p, k) => {
      const x1 = escala(acum), x2 = escala(acum + p);
      if (x2 - x1 < 34) {
        if (grupo && Math.abs(grupo.x2 - x1) < 0.5) { grupo.x2 = x2; grupo.ult = k; } else { grupo = { x1, x2, pri: k, ult: k }; grupos.push(grupo); }
      } else grupo = null;
      acum += p;
    });
    for (const g of grupos) {
      const rotulo = g.pri === g.ult ? a.ids[g.pri] : `${a.ids[g.pri]}–${a.ids[g.ult]}`;
      const medio = Math.min(W - der - 22, Math.max(izq + 22, (g.x1 + g.x2) / 2));
      svg += `<line x1="${g.x1.toFixed(1)}" y1="${y0 + 43}" x2="${g.x2.toFixed(1)}" y2="${y0 + 43}" stroke="#012820" stroke-width="2"/>` +
        T(medio, y0 + 58, rotulo, 'text-anchor="middle" font-size="13" font-weight="700" fill="#012820"');
    }
    // Abajo, la escala: los enteros 0, 1, …, n, que separan los puntos u, u + 1, …,
    // y las π acumuladas en los bordes de los tramos, donde quepan (1/6 y 1/2 en las tiendas).
    for (let j = 0; j <= n; j++) {
      const x = escala(j);
      svg += `<line x1="${x}" y1="${y0 + 38}" x2="${x}" y2="${y0 + 74}" stroke="#334155" stroke-width="1.5"/>` + T(x, y0 + 90, String(j), 'text-anchor="middle" font-size="13" font-weight="700" fill="#334155"');
    }
    acum = 0;
    let ultimo = -Infinity;
    a.pi.slice(0, -1).forEach((p) => {
      acum += p;
      const x = escala(acum);
      const entero = Math.abs(acum - Math.round(acum)) < 1e-9;
      if (!entero && x - ultimo >= 44 && Math.abs(x - escala(Math.round(acum))) >= 26) {
        svg += `<line x1="${x.toFixed(1)}" y1="${y0 + 38}" x2="${x.toFixed(1)}" y2="${y0 + 66}" stroke="#64748B" stroke-dasharray="2 2"/>` +
          T(x, y0 + 80, numero(acum, 3), 'text-anchor="middle" font-size="12" fill="#475569"');
        ultimo = x;
      }
    });
    // Los puntos: la línea se detiene en el borde del tramo (antes tachaba sus
    // rótulos), y los rótulos que quedarían a menos de 56 px se escalonan.
    let previo = -Infinity, fila = 0;
    for (let j = 0; j < n; j++) {
      const x = escala(E.u + j);
      fila = x - previo < 56 ? 1 - fila : 0;
      previo = x;
      const yr = fila ? 30 : 14;
      const texto = j === 0 ? `u = ${numero(E.u, 3)}` : `u + ${j}`;
      const xr = Math.min(W - 4 - texto.length * 3.3, Math.max(4 + texto.length * 3.3, x));
      svg += `<line x1="${x.toFixed(1)}" y1="${yr + 4}" x2="${x.toFixed(1)}" y2="${y0 - 6}" stroke="#B84A00" stroke-width="2.5"/>` +
        `<polygon points="${(x - 6).toFixed(1)},${y0 - 12} ${(x + 6).toFixed(1)},${y0 - 12} ${x.toFixed(1)},${y0 - 2}" fill="#B84A00"/>` +
        T(xr, yr, texto, 'text-anchor="middle" font-size="12" fill="#B84A00" font-weight="700"');
    }
    const ids = s.map(k => esc(a.ids[k]));
    const descripcion = `Regla de 0 a ${n} con un tramo por unidad; los puntos caen en ${lista(ids)}.`;
    $('svg-regla').innerHTML = `<svg viewBox="0 0 ${W} ${alto}" role="img" aria-label="${esc(descripcion)}">${svg}</svg>`;
    $('pie-regla').innerHTML = `Con u = ${numero(E.u, 3)}, los puntos ${lista(Array.from({ length: n }, (_, j) => numero(E.u + j, 3)))} caen en ` +
      `${lista(ids)}: la muestra es ${conjunto(ids)}. Los tramos van en el orden de la tabla y cada uno lleva su π${sub('k')}. ` +
      `Debajo, la escala de 0 a n, con las π acumuladas en los bordes de los tramos donde caben.`;
    return s;
  }

  function pintaPestana1() {
    const a = analisis('sistematico_fijo');
    if (a.errores.length) return;
    $('rango-u').value = E.u;
    $('valor-u').textContent = numero(E.u, 3);
    const s = pintaRegla(a);
    const t = a.referencias.t;
    const ref = t / a.N;
    const tHat = Motor.suma(s.map(k => a.y[k] / a.pi[k]));
    const fy = columna(a.y);
    const tm = $('tabla-muestra-u');
    tm.tHead.innerHTML = `<tr><th scope="col">Unidad</th><th scope="col">y${sub('k')}</th><th scope="col">π${sub('k')}</th><th scope="col">y${sub('k')}/π${sub('k')}</th></tr>`;
    tm.tBodies[0].innerHTML = s.map(k => `<tr><th scope="row">${esc(a.ids[k])}</th><td class="num">${fy(a.y[k])}</td>` +
      `<td class="num">${numero(a.pi[k], 4)}</td><td class="num">${cifra(a.y[k] / a.pi[k], t)}</td></tr>`).join('');
    tm.tFoot.innerHTML = `<tr class="total"><th scope="row" colspan="3">t̂${sub('π')} (suma)</th><td class="num">${cifra(tHat, t)}</td></tr>` +
      `<tr><th scope="row" colspan="3">t verdadero · error</th><td class="num">${cifra(t)} · ${cifra(tHat - t, t)}</td></tr>`;

    const tramos = Motor.tramosRegla(a.pi, a.n);
    $('tabla-tramos').tHead.innerHTML = '<tr><th scope="col">u entre</th><th scope="col">Muestra</th><th scope="col">P(s)</th><th scope="col">t̂<sub>π</sub></th></tr>';
    $('tabla-tramos').tBodies[0].innerHTML = tramos.map(tr => {
      const actual = E.u >= tr.desde && E.u < tr.hasta;
      const tt = Motor.suma(tr.s.map(k => a.y[k] / a.pi[k]));
      return `<tr class="${actual ? 'en-muestra' : ''}"${actual ? ' aria-current="true"' : ''}><td class="num">${numero(tr.desde, 4)} y ${numero(tr.hasta, 4)}</td>` +
        `<td>${conjunto(tr.s.slice().sort((x, y) => x - y).map(k => a.ids[k]))}</td><td class="num">${numero(tr.hasta - tr.desde, 4)}</td><td class="num">${cifra(tt, t)}</td></tr>`;
    }).join('');

    $('tabla-psi-pi').tHead.innerHTML = `<tr><th scope="col">Unidad</th><th scope="col">ψ${sub('k')}</th><th scope="col">n·ψ${sub('k')}</th>` +
      `<th scope="col">Con reemplazo: 1 − (1 − ψ${sub('k')})<sup>n</sup></th><th scope="col">πPT: π${sub('k')}</th></tr>`;
    $('tabla-psi-pi').tBodies[0].innerHTML = a.ids.map((id, k) => `<tr><th scope="row">${esc(id)}</th><td class="num">${numero(a.psi[k], 4)}</td>` +
      `<td class="num">${numero(a.crudas[k], 4)}</td><td class="num">${numero(1 - (1 - a.psi[k]) ** a.n, 4)}</td>` +
      `<td class="num">${numero(a.pi[k], 4)}${a.forzosa[k] ? ' <span class="forzosa-etq">forzosa</span>' : ''}</td></tr>`).join('');
  }

  // ------------------------------------------------------------------ pestaña 2
  // La recta que importa para el πPT: la de las unidades no forzosas (con forzosas,
  // las π son proporcionales a x solo entre las demás). Sin forzosas, la de todas.
  const rectaQueCuenta = (a) => a.rectaLibres || { corte: a.referencias.corte, pendiente: a.referencias.pendiente, razon: a.referencias.razon, media: a.referencias.t / a.N, indices: a.ids.map((_, k) => k) };
  // La misma recta con las y de la tabla, sin δ: las forzosas dependen solo de x y n.
  function rectaBase(a) {
    const libres = a.ids.map((_, k) => k).filter(k => !a.forzosa[k]);
    return Motor.recta(unidades.map(u => u.x), unidades.map(u => u.y), libres.length >= 2 ? libres : a.ids.map((_, k) => k));
  }

  function pintaDispersion(a, e) {
    const W = anchoDe('svg-dispersion', 900), H = W < 520 ? 320 : 380, m = { i: 60, d: 16, a: 18, b: 52 };
    const xs = a.x, ys = a.y;
    const xMax = Math.max(...xs) * 1.08;
    const r = rectaQueCuenta(a);
    const yMax = Math.max(...ys, r.corte, 1e-9) * 1.12;
    const yMin = Math.min(0, r.corte * 1.12);
    const X = (v) => m.i + (W - m.i - m.d) * v / xMax;
    const Y = (v) => H - m.b - (H - m.a - m.b) * (v - yMin) / (yMax - yMin);
    let svg = '';
    const mx = marcas(0, xMax, W < 520 ? 4 : 6), my = marcas(yMin, yMax);
    for (const v of my.valores) svg += `<line x1="${m.i}" y1="${Y(v).toFixed(1)}" x2="${W - m.d}" y2="${Y(v).toFixed(1)}" stroke="#EEF2F7"/>` + T(m.i - 6, Y(v) + 4, numero(v, my.dec), 'text-anchor="end" font-size="13" fill="#475569"');
    for (const v of mx.valores) svg += `<line x1="${X(v).toFixed(1)}" y1="${H - m.b}" x2="${X(v).toFixed(1)}" y2="${H - m.b + 5}" stroke="#475569"/>` + T(X(v), H - m.b + 19, numero(v, mx.dec), 'text-anchor="middle" font-size="13" fill="#475569"');
    // Ejes en #64748B (4,8:1): el #94A3B8 de antes daba 2,6:1, y el eje y = 0 lleva el mensaje.
    svg += `<line x1="${m.i}" y1="${Y(0).toFixed(1)}" x2="${W - m.d}" y2="${Y(0).toFixed(1)}" stroke="#64748B"/><line x1="${X(0)}" y1="${m.a}" x2="${X(0)}" y2="${H - m.b}" stroke="#64748B"/>`;
    svg += T((m.i + W - m.d) / 2, H - 10, e.x, 'text-anchor="middle" font-size="13" fill="#1E293B" font-weight="600"');
    const rotuloY = e.y.length * 7 > H - m.a - m.b ? e.y.replace(/\s*\(.*\)$/, '') : e.y;
    svg += T(16, (m.a + H - m.b) / 2, rotuloY, `text-anchor="middle" font-size="13" fill="#1E293B" font-weight="600" transform="rotate(-90 16 ${((m.a + H - m.b) / 2).toFixed(1)})"`);
    const yA = (v) => r.corte + r.pendiente * v;
    svg += `<line x1="${X(0)}" y1="${Y(yA(0)).toFixed(1)}" x2="${X(xMax).toFixed(1)}" y2="${Y(Math.min(yMax, Math.max(yMin, yA(xMax)))).toFixed(1)}" stroke="#64748B" stroke-width="2.5"/>`;
    // La recta por el origen va encima: cuando coinciden, la otra la tapaba entera.
    // Se recorta donde sale del gráfico (el original la estiraba hasta la esquina).
    const xFinO = Math.min(xMax, r.razon > 0 ? yMax / r.razon : xMax);
    svg += `<line x1="${X(0)}" y1="${Y(0).toFixed(1)}" x2="${X(xFinO).toFixed(1)}" y2="${Y(r.razon * xFinO).toFixed(1)}" stroke="#B84A00" stroke-width="2.5" stroke-dasharray="8 5"/>`;
    // El rótulo del corte: debajo si es positivo (bajo la recta no hay puntos), encima si es negativo
    // (debajo quedaba en la fila de las marcas del eje x).
    svg += `<circle cx="${X(0)}" cy="${Y(r.corte).toFixed(1)}" r="5" fill="#fff" stroke="#64748B" stroke-width="2"/>` +
      T(X(0) + 10, Y(r.corte) + (r.corte >= 0 ? 20 : -10), `corta en ${cifra(r.corte, r.media)}`, 'font-size="13" fill="#1E293B" font-weight="600"');
    // Los puntos; las forzosas, con un anillo, porque no entran en la recta que cuenta. Un
    // rótulo que quedaría a menos de 14 px de otro se omite (con 9 unidades se encimaban).
    const puestos = [];
    xs.forEach((v, k) => {
      const cx = X(v), cy = Y(ys[k]);
      svg += a.forzosa[k]
        ? `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="6" fill="#fff" stroke="#B84A00" stroke-width="3"/>`
        : `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="6" fill="#012820"/>`;
      const lx = cx + 8, ly = cy - 9;
      if (puestos.every(([px, py]) => Math.hypot(px - lx, py - ly) >= 14)) {
        svg += T(lx, ly, a.ids[k] + (a.forzosa[k] ? ' (forzosa)' : ''), `font-size="13" fill="${a.forzosa[k] ? '#B84A00' : '#012820'}" font-weight="700"`);
        puestos.push([lx, ly]);
      }
    });
    const desc = `Dispersión de ${a.N} unidades; la recta ${a.rectaLibres && a.forzosa.some(Boolean) ? 'de las no forzosas ' : ''}corta el eje y en ${cifra(r.corte, r.media)}; correlación ${numero(a.referencias.corr, 3)}.`;
    $('svg-dispersion').innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(desc)}">${svg}</svg>`;
    return rotuloY !== e.y;
  }

  function ajustaRangoDelta() {
    const ys = unidades.map(u => u.y);
    const min = -Math.floor(Math.min(...ys));
    const max = Math.ceil(Math.max(...ys));
    const paso = pasoBonito((max - min) / 400);
    const rango = $('rango-delta');
    rango.min = String(min); rango.max = String(max); rango.step = String(paso);
    rango.value = String(Math.min(max, Math.max(min, E.delta)));
  }

  function tarjeta(rotulo, valor, detalle = '', clase = '') {
    return `<div class="tarjeta ${clase}"><div class="rotulo">${rotulo}</div><div class="valor">${valor}</div>${detalle ? `<div class="detalle">${detalle}</div>` : ''}</div>`;
  }

  function pintaPestana2() {
    const a = analisis(E.diseno);
    if (a.errores.length) return;
    const e = escenario();
    const r = a.referencias;
    ajustaRangoDelta();
    $('leyenda-forzosa').hidden = !a.forzosa.some(Boolean);
    $('valor-delta').textContent = E.constante ? 'y constante' : cifra(E.delta, r.t / a.N);
    $('boton-constante').setAttribute('aria-pressed', String(E.constante));
    $('rango-delta').disabled = E.constante;
    const acortado = pintaDispersion(a, e);
    const rc = rectaQueCuenta(a);
    const conForzosas = a.forzosa.some(Boolean);
    const forzosas = lista(a.ids.filter((_, k) => a.forzosa[k]).map(esc));
    $('pie-dispersion').innerHTML = `Correlación r = ${numero(r.corr, 3)}. La recta de mínimos cuadrados ` +
      `${conForzosas ? `de las unidades no forzosas (${forzosas} ${a.forzosa.filter(Boolean).length > 1 ? 'son forzosas' : 'es forzosa'} y no entra${a.forzosa.filter(Boolean).length > 1 ? 'n' : ''}) ` : ''}` +
      `corta el eje en ${cifra(rc.corte, rc.media)}, el ${pct(Math.abs(rc.corte) / rc.media, 0)} de su media de y.` +
      (acortado ? ` Eje y: ${esc(e.y)}.` : '');
    // El botón lleva al origen la recta que cuenta. Con pendiente ≤ 0 no hay δ que lo
    // logre sin y negativas, y con y ≥ 0 a veces se queda corto: se dice (T7.121).
    const rb = rectaBase(a);
    const tope = -Math.min(...unidades.map(u => u.y));
    let nota = '';
    $('boton-origen').disabled = !rb || rb.pendiente <= 0;
    if (rb && rb.pendiente <= 0) nota = 'Aquí y baja (o no sube) con x: ninguna constante lleva la recta al origen sin volver negativa alguna y.';
    else if (rb && -rb.corte < tope) nota = `Para llevar la recta al origen haría falta δ = ${cifra(-rb.corte, rb.media)}, pero la menor y ya llega a 0 con δ = ${cifra(tope, rb.media)}.`;
    if (conForzosas) nota += ` ${forzosas} ${a.forzosa.filter(Boolean).length > 1 ? 'son' : 'es'} de inclusión forzosa: la recta que cuenta es la de las demás unidades, entre las que las π sí son proporcionales a x.`;
    $('nota-origen').textContent = nota.trim();
    const media = rc.media;
    const gana = a.deff !== null && a.deff < 1;
    $('tarjetas-gana').innerHTML =
      tarjeta('Correlación r', r.corr === null ? '—' : numero(r.corr, 3), 'No cambia al mover δ.') +
      tarjeta(conForzosas ? 'Corte de la recta (sin las forzosas)' : 'Corte de la recta', cifra(rc.corte, media), `El ${pct(Math.abs(rc.corte) / media, 0)} de la media de y.`) +
      tarjeta('V del MAS, mismo n', cifra(r.vMAS, r.vMAS), 'Sin reemplazo.') +
      tarjeta(`V del πPT (${NOMBRE_DISENO[E.diseno]})`, cifra(a.V, a.V), `ee ${cifra(a.ee, a.ee)}`) +
      tarjeta('deff = V / V<sub>MAS</sub>', a.deff === null ? 'no existe' : numero(a.deff, a.deff < 0.01 ? 4 : a.deff >= 10 ? 2 : 3),
        a.deff === null ? 'Con y constante, el MAS acierta siempre: V<sub>MAS</sub> = 0.' : (gana ? 'Menor que 1: gana el πPT.' : 'Mayor que 1: gana el MAS.'),
        a.deff === null ? 'pierde' : (gana ? 'gana' : 'pierde')) +
      tarjeta('Criterio de Raj', `Cov ${r.covRaj >= 0 ? '>' : '<'} 0`, `Cov(x, y²/x) = ${cifra(r.covRaj, r.covRaj)}; V${sub('MRAS')} − V${sub('PPT')} = ${cifra(r.rajDiferencia, r.rajDiferencia)}: ` +
        `${r.covRaj >= 0 ? 'gana' : 'pierde'} el PPT con reemplazo.`, r.covRaj >= 0 ? 'gana' : 'pierde');
    const tc = $('tabla-cocientes');
    tc.tHead.innerHTML = `<tr><th scope="col">Unidad</th><th scope="col">x${sub('k')}</th><th scope="col">y${sub('k')} en uso</th><th scope="col">π${sub('k')}</th>` +
      `<th scope="col">y${sub('k')}/π${sub('k')}</th><th scope="col">ψ${sub('k')}</th><th scope="col">y${sub('k')}/ψ${sub('k')}</th></tr>`;
    const fx = columna(a.x), fy = columna(a.y);
    tc.tBodies[0].innerHTML = a.ids.map((id, k) => `<tr><th scope="row">${esc(id)}</th><td class="num">${fx(a.x[k])}</td>` +
      `<td class="num">${fy(a.y[k])}</td><td class="num">${numero(a.pi[k], 4)}${a.forzosa[k] ? ' <span class="forzosa-etq">forzosa</span>' : ''}</td>` +
      `<td class="num">${cifra(a.y[k] / a.pi[k], r.t)}</td><td class="num">${numero(a.psi[k], 4)}</td><td class="num">${cifra(r.zHH[k], r.t)}</td></tr>`).join('');
  }

  // ------------------------------------------------------------------ pestaña 3
  function pintaMatriz(a) {
    const [pk, pl] = E.par;
    const m = $('matriz-pikl');
    m.tHead.innerHTML = `<tr><th scope="col">π${sub('kl')}</th>${a.ids.map(id => `<th scope="col">${esc(id)}</th>`).join('')}</tr>`;
    const yg = new Set(a.paresYG.map(p => p.join()));
    m.tBodies[0].innerHTML = a.ids.map((id, k) => `<tr><th scope="row">${esc(id)}</th>${a.ids.map((id2, l) => {
      const v = a.pikl[k][l];
      const clases = [k === l ? 'diagonal' : '', k !== l && v <= 1e-12 ? 'cero' : '', yg.has([Math.min(k, l), Math.max(k, l)].join()) ? 'incumple' : ''].join(' ').trim();
      const elegido = (k === pk && l === pl) || (k === pl && l === pk);
      const rotulo = k === l ? `π de ${id}: ${numero(v, 4)}` : `Par ${id} y ${id2}: π${'ₖₗ'} ${numero(v, 4)}`;
      return `<td><button type="button" class="${clases}" data-par="${k},${l}" aria-pressed="${elegido}" aria-label="${esc(rotulo)}">${numero(v, 3)}</button></td>`;
    }).join('')}</tr>`).join('');
    // El inspector del par elegido.
    const k = Math.min(pk, pl), l = Math.max(pk, pl);
    if (k === l || l >= a.N) { $('inspector-par').innerHTML = '<p>Elige una celda fuera de la diagonal.</p>'; return; }
    const prod = a.pi[k] * a.pi[l];
    const pkl = a.pikl[k][l];
    const peso = prod - pkl;
    const dif = (a.y[k] / a.pi[k] - a.y[l] / a.pi[l]) ** 2;
    const idk = a.ids[k], idl = a.ids[l];
    let diagnostico;
    if (pkl <= 1e-12) diagnostico = `<span class="estado no">nunca salen juntos</span> Ninguna muestra contiene a ${esc(idk)} y ${esc(idl)}: el estimador de la varianza nunca ve este término y queda sesgado.`;
    else if (peso < -1e-12) diagnostico = `<span class="estado no">incumple Yates–Grundy</span> π${sub('kl')} supera a π${sub('k')}π${sub('l')}: en las muestras que los contienen, este término resta, y V̂${sub('SYG')} puede salir negativa.`;
    else diagnostico = `<span class="estado ok">cumple</span> π${sub('kl')} &gt; 0 y π${sub('k')}π${sub('l')} ≥ π${sub('kl')}.`;
    if (a.forzosa[k] || a.forzosa[l]) diagnostico += ` Como ${esc(a.forzosa[k] ? idk : idl)} es forzosa, π${sub('kl')} = π de la otra y el término vale 0.`;
    $('inspector-par').innerHTML = `<p class="caja-titulo">El par ${esc(idk)} y ${esc(idl)}</p>` +
      `<p>π${sub(esc(idk))} = ${numero(a.pi[k], 4)}, π${sub(esc(idl))} = ${numero(a.pi[l], 4)}, su producto ${numero(prod, 4)}, y π${sub('kl')} = ${numero(pkl, 4)}. ` +
      `Su término en V es (π${sub('k')}π${sub('l')} − π${sub('kl')})·(y${sub('k')}/π${sub('k')} − y${sub('l')}/π${sub('l')})² = ${numero(peso, 4)} · ${cifra(dif, dif)} = ${cifra(peso * dif, a.V || 1)}.</p>` +
      `<p>${diagnostico}</p>`;
  }

  function pintaPestana3() {
    const a = analisis(E.diseno);
    if (a.errores.length) return;
    if (E.par[0] >= a.N || E.par[1] >= a.N) E.par = [0, 1];
    pintaMatriz(a);
    // Las comprobaciones del cálculo van plegadas, con su recuento a la vista: ocho
    // líneas con errores de 10⁻¹⁶ antes de las tarjetas eran carga sin lección (T7.121).
    const bien = a.verificaciones.filter(v => v.ok).length;
    $('resumen-verificaciones').innerHTML = `<span class="estado ${bien === a.verificaciones.length ? 'ok' : 'no'}">${bien} de ${a.verificaciones.length} ✓</span> Comprobaciones del cálculo`;
    $('lista-verificaciones').innerHTML = a.verificaciones.map(v =>
      `<li><span class="estado ${v.ok ? 'ok' : 'no'}">${v.ok ? '✓' : '✗'}</span> ${subindices(v.nombre)} <span class="num" style="color:#475569">(error ${cientifica(v.error)})</span></li>`).join('');
    $('lista-pares').innerHTML =
      `<li>Pares que nunca salen juntos (π${sub('kl')} = 0): <strong>${a.paresCero.length}</strong>${a.paresCero.length ? ` (${a.paresCero.map(p => p.map(k => esc(a.ids[k])).join('–')).join(', ')})` : ''}.</li>` +
      `<li>Pares que incumplen Yates–Grundy: <strong>${a.paresYG.length}</strong>. Probabilidad de una V̂${sub('SYG')} negativa: <strong>${pct(a.pNegativa)}</strong>.</li>` +
      (a.n - a.forzosa.filter(Boolean).length < 2 ? `<li>Con un solo cupo sorteado (el resto son forzosas), cada muestra trae una sola unidad sorteada: no hay pares que estimen la varianza, y los tres diseños coinciden.</li>` : '');
    const V = a.V;
    const sesgo = (x) => (x === null ? '' : ` (${sesgoRelativo(x, V)})`);
    $('tarjetas-ht').innerHTML =
      tarjeta('V(t̂<sub>π</sub>)', cifra(V, V), `ee ${cifra(a.ee, a.ee)} · forma 6.20: ${cifra(a.formaHT, V)}`) +
      tarjeta('E(V̂<sub>HT</sub>)', cifra(a.esperanzas.vHT, V), a.paresCero.length ? `Sesgada${sesgo(a.esperanzas.vHT)}.` : 'Igual a V: insesgada.') +
      tarjeta('E(V̂<sub>SYG</sub>)', cifra(a.esperanzas.vSYG, V), a.paresCero.length ? `Sesgada${sesgo(a.esperanzas.vSYG)}.` : 'Igual a V: insesgada.') +
      tarjeta('E(V̂<sub>WR</sub>)', a.esperanzas.vWR === null ? '—' : cifra(a.esperanzas.vWR, V),
        a.esperanzas.vWR === null ? 'Necesita al menos dos unidades sorteadas (no forzosas).' : `Con reemplazo (6.24, sin las forzosas)${sesgo(a.esperanzas.vWR)}.`) +
      tarjeta('Muestras posibles', String(a.muestras.length), `Con P(s) > 0, de ${numero(Motor.combinaciones(Array.from({ length: a.N }, (_, k) => k), a.n).length, 0)} combinaciones.`);
    pintaEspacio(a);
    pintaReplicas(a);
  }

  const FILAS = 25;
  function pintaEspacio(a) {
    const t = a.referencias.t;
    const V = a.V || 1;
    const paginas = Math.ceil(a.muestras.length / FILAS);
    E.pagina = Math.min(E.pagina, paginas - 1);
    const vista = a.muestras.slice(E.pagina * FILAS, (E.pagina + 1) * FILAS);
    const te = $('tabla-espacio');
    te.tHead.innerHTML = `<tr><th scope="col">Muestra s</th><th scope="col">P(s)</th><th scope="col">t̂${sub('π')}</th><th scope="col">t̂ − t</th>` +
      `<th scope="col">V̂${sub('HT')} (6.22)</th><th scope="col">V̂${sub('SYG')} (6.23)</th><th scope="col">V̂${sub('WR')} (6.24, sin forzosas)</th></tr>`;
    te.tBodies[0].innerHTML = vista.map(m => `<tr><td>${conjunto(m.s.map(k => a.ids[k]))}</td><td class="num">${numero(m.p, 4)}</td>` +
      `<td class="num">${cifra(m.t, t)}</td><td class="num">${cifra(m.t - t, t)}</td><td class="num">${cifra(m.vHT, V)}</td>` +
      `<td class="num"${m.vSYG < -1e-9 * V ? ' style="color:#B91C1C;font-weight:700"' : ''}>${cifra(m.vSYG, V)}</td><td class="num">${m.vWR === null ? '—' : cifra(m.vWR, V)}</td></tr>`).join('');
    const e = a.esperanzas;
    te.tFoot.innerHTML = `<tr class="total"><th scope="row">Esperanza</th><td class="num">ΣP(s) = ${numero(Motor.suma(a.muestras.map(m => m.p)), 4)}</td>` +
      `<td class="num">${cifra(a.esperanza, t)} = t</td><td class="num">V = ${cifra(a.V, V)}</td><td class="num">${cifra(e.vHT, V)}</td>` +
      `<td class="num">${cifra(e.vSYG, V)}</td><td class="num">${e.vWR === null ? '—' : cifra(e.vWR, V)}</td></tr>`;
    const pg = $('paginas-espacio');
    pg.innerHTML = paginas > 1
      ? `<button type="button" class="boton secundario" data-pagina="-1" ${E.pagina === 0 ? 'disabled' : ''}>Anteriores</button>` +
        `<span>Muestras ${E.pagina * FILAS + 1} a ${Math.min(a.muestras.length, (E.pagina + 1) * FILAS)} de ${a.muestras.length}</span>` +
        `<button type="button" class="boton secundario" data-pagina="1" ${E.pagina >= paginas - 1 ? 'disabled' : ''}>Siguientes</button>`
      : `<span class="tabla-pie">Las ${a.muestras.length} muestras con P(s) &gt; 0. La fila de abajo promedia cada columna con P(s).</span>`;
  }

  function pintaReplicas(a) {
    const caja = $('resultado-replicas');
    const figura = $('figura-histograma');
    $('sel-replicas').value = String(E.R);
    $('campo-semilla').value = String(E.semilla);
    const clave = JSON.stringify([a.clave, E.R, E.semilla]);
    if (!simulacion) { caja.innerHTML = '<p class="tabla-pie" style="padding:0">Pulsa «Simular» para comparar las réplicas con lo exacto.</p>'; figura.classList.add('oculto'); return; }
    if (simulacion.clave !== clave) {
      caja.innerHTML = '<p class="caja nota">Los datos, el diseño o la semilla cambiaron desde la última simulación: pulsa «Simular» de nuevo.</p>';
      figura.classList.add('oculto');
      return;
    }
    const r = simulacion.resultado;
    const t = a.referencias.t;
    // La media, con los decimales de su error de simulación: 2608,24 ± 0,21, no 2608,2362.
    const err = 1.96 * r.diseno.eeMedia;
    const dec = err >= 10 ? 0 : err >= 1 ? 1 : err >= 0.1 ? 2 : 3;
    caja.innerHTML = `<div class="tarjetas">` +
      tarjeta('Media de t̂ en las réplicas', numero(r.diseno.media, dec),
        `± ${numero(err, dec)} de error de simulación (t = ${cifra(t)}).`) +
      tarjeta('ee simulado', cifra(r.diseno.ee, a.ee), `Exacto: √V = ${cifra(a.ee, a.ee)}.`) +
      tarjeta('ECM', cifra(r.diseno.ecm, a.V), `Exacto: V = ${cifra(a.V, a.V)} (es insesgado).`) +
      tarjeta('Cobertura con V̂<sub>SYG</sub>', pct(r.coberturaSYG), `De t̂ ± 1,96·√V̂; ${pct(r.negativasSYG)} de réplicas con V̂ negativa.`) +
      tarjeta('Cobertura con V̂<sub>WR</sub>', r.coberturaWR === null ? '—' : pct(r.coberturaWR), 'La aproximación con reemplazo.') +
      tarjeta('¿Reproduce P(s)?', r.muestrasFueraDelSoporte === 0 && r.apartamientoMaximo < 4.5 ? 'Sí' : 'No',
        `La frecuencia que más se aparta lo hace por ${numero(r.apartamientoMaximo, 1)} errores estándar.`) +
      `</div>`;
    figura.classList.remove('oculto');
    pintaHistograma(r, a);
  }

  function pintaHistograma(r, a) {
    const W = anchoDe('svg-histograma', 900), H = 300, m = { i: 52, d: 14, a: 14, b: 46 };
    const todos = r.valores.concat(r.valoresMAS);
    let lo = Math.min(...todos), hi = Math.max(...todos);
    if (hi - lo < 1e-9 * Math.max(1, Math.abs(hi))) { lo -= 1; hi += 1; }
    const k = 30;
    const ancho = (hi - lo) / k;
    const cuenta = (vals) => { const c = new Array(k).fill(0); for (const v of vals) c[Math.min(k - 1, Math.floor((v - lo) / ancho))]++; return c; };
    const cD = cuenta(r.valores), cM = cuenta(r.valoresMAS);
    const fMax = Math.max(...cD, ...cM) / r.R;
    const X = (v) => m.i + (W - m.i - m.d) * (v - lo) / (hi - lo);
    const Y = (f) => H - m.b - (H - m.a - m.b) * f / fMax;
    let svg = '';
    const my = marcas(0, fMax, 4);
    for (const v of my.valores) svg += `<line x1="${m.i}" y1="${Y(v).toFixed(1)}" x2="${W - m.d}" y2="${Y(v).toFixed(1)}" stroke="#EEF2F7"/>` + T(m.i - 6, Y(v) + 4, pct(v, 0), 'text-anchor="end" font-size="13" fill="#475569"');
    const mx = marcas(lo, hi, W < 520 ? 3 : 6);
    for (const v of mx.valores) svg += T(X(v), H - m.b + 18, numero(v, mx.dec), 'text-anchor="middle" font-size="13" fill="#475569"');
    const barras = (c, color, desplaza) => c.map((n, i) => n ? `<rect x="${(X(lo + i * ancho) + desplaza).toFixed(1)}" y="${Y(n / r.R).toFixed(1)}" width="${Math.max(1, (W - m.i - m.d) / k / 2 - 1).toFixed(1)}" height="${(H - m.b - Y(n / r.R)).toFixed(1)}" fill="${color}"/>` : '').join('');
    svg += barras(cM, '#B84A00', (W - m.i - m.d) / k / 2) + barras(cD, '#012820', 0);
    const t = a.referencias.t;
    // La marca de t lleva un contorno blanco: sobre las barras verdes no se veía (1,08:1).
    svg += `<line x1="${X(t).toFixed(1)}" y1="${m.a}" x2="${X(t).toFixed(1)}" y2="${H - m.b}" stroke="#fff" stroke-width="5"/>` +
      `<line x1="${X(t).toFixed(1)}" y1="${m.a}" x2="${X(t).toFixed(1)}" y2="${H - m.b}" stroke="#1E293B" stroke-width="2" stroke-dasharray="4 3"/>` +
      T(X(t) + 6, m.a + 14, 't', 'font-size="15" font-weight="700" fill="#1E293B" stroke="#fff" stroke-width="4" paint-order="stroke"');
    svg += T((m.i + W - m.d) / 2, H - 8, 'Estimación del total, t̂', 'text-anchor="middle" font-size="13" fill="#1E293B" font-weight="600"');
    const desc = `Histograma de ${r.R} réplicas: el diseño elegido tiene ee ${cifra(r.diseno.ee, a.ee)} y el MAS ${cifra(r.mas.ee, r.mas.ee)}.`;
    $('svg-histograma').innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(desc)}">${svg}</svg>`;
    $('pie-histograma').innerHTML = `${numero(r.R, 0)} réplicas con semilla ${r.semilla}. Proporción de réplicas por intervalo. ` +
      `ee del diseño elegido ${cifra(r.diseno.ee, a.ee)}; del MAS, ${cifra(r.mas.ee, r.mas.ee)}.`;
  }

  // ------------------------------------------------------------------ pestaña 4
  const poblaciones = new Map();
  function clases() {
    const clave = `${E.dos.rho}|${E.dos.semilla}`;
    if (!poblaciones.has(clave)) poblaciones.set(clave, Motor.poblacionClases(DOS.M, E.dos.rho, E.dos.semilla));
    return poblaciones.get(clave);
  }
  function pintaPestana4() {
    const d0 = E.dos;
    opcionesN($('dos-n'), 2, 8, d0.n);
    opcionesN($('dos-m'), 1, 20, d0.m);
    $('dos-diseno').value = d0.diseno;
    $('dos-rho').value = String(d0.rho);
    $('valor-rho').textContent = numero(d0.rho, 2);
    $('dos-semilla').value = String(d0.semilla);
    $('dos-c1').value = String(d0.c1); $('dos-c2').value = String(d0.c2); $('dos-C').value = String(d0.C);
    for (const id of ['dos-c1', 'dos-c2', 'dos-C']) $(id).setAttribute('aria-invalid', 'false');
    const d = Motor.analizaDosEtapas(DOS.M, clases(), d0.n, d0.m, d0.diseno);
    if (d.autoponderado) {
      $('estado-autoponderado').innerHTML = `<span class="estado ok">Autoponderado</span> Cada estudiante de la muestra pesa ${numero(d.pesoComun, 2)} = ` +
        `${d.K}/(${d0.n}·${d0.m}).`;
    } else {
      const motivos = [];
      const fz = d.forzosa.map((f, i) => (f ? `la clase ${i + 1}` : null)).filter(Boolean);
      const chicas = DOS.M.map((Mi, i) => (Mi < d0.m ? `la clase ${i + 1}, con ${Mi} estudiantes,` : null)).filter(Boolean);
      if (d.motivos.includes('forzosas')) motivos.push(`${lista(fz)} ${fz.length > 1 ? 'son' : 'es'} de inclusión forzosa (π = 1)`);
      if (d.motivos.includes('clases_menores_que_m')) motivos.push(`${lista(chicas)} ${chicas.length > 1 ? 'tienen' : 'tiene'} menos de m = ${d0.m} y se ${chicas.length > 1 ? 'censan' : 'censa'}`);
      const texto = motivos.join('; ');
      $('estado-autoponderado').innerHTML = `<span class="estado no">No es autoponderado</span> ${texto.charAt(0).toUpperCase() + texto.slice(1)}. Los pesos van de ` +
        `${numero(Math.min(...d.filas.map(f => f.peso)), 2)} a ${numero(Math.max(...d.filas.map(f => f.peso)), 2)}.`;
    }
    const tc = $('tabla-clases');
    tc.tHead.innerHTML = `<tr><th scope="col">Clase</th><th scope="col">M${sub('i')}</th><th scope="col">π${sub('i')}</th><th scope="col">m${sub('i')}</th>` +
      `<th scope="col">m${sub('i')}/M${sub('i')}</th><th scope="col">π del estudiante</th><th scope="col">Peso</th></tr>`;
    tc.tBodies[0].innerHTML = d.filas.map((f, i) => `<tr><th scope="row">${i + 1}</th><td class="num">${f.Mi}</td>` +
      `<td class="num">${numero(f.pi, 4)}${d.forzosa[i] ? ' <span class="forzosa-etq">forzosa</span>' : ''}</td><td class="num">${f.mi}</td>` +
      `<td class="num">${numero(f.piCond, 4)}</td><td class="num">${numero(f.piFinal, 5)}</td><td class="num">${numero(f.peso, 2)}</td></tr>`).join('') +
      `<tr class="total"><th scope="row">Total</th><td class="num">K = ${d.K}</td><td class="num">Σ = ${d0.n}</td><td colspan="4"></td></tr>`;
    const p1 = d.parte1;
    $('barra-etapas').innerHTML = `<div class="e1" style="width:${(100 * p1).toFixed(2)}%">${p1 > 0.12 ? `Etapa 1 · ${pct(p1, 0)}` : ''}</div>` +
      `<div class="e2" style="width:${(100 * (1 - p1)).toFixed(2)}%">${1 - p1 > 0.12 ? `Etapa 2 · ${pct(1 - p1, 0)}` : ''}</div>`;
    $('barra-etapas').setAttribute('aria-label', `La etapa 1 pone el ${pct(p1)} de la varianza y la etapa 2 el ${pct(1 - p1)}.`);
    const an = d.anova;
    $('tarjetas-dos').innerHTML =
      tarjeta('Total de horas, t', numero(d.t, 0), '<span class="marca ilustrativo">Ejemplo ilustrativo</span>') +
      tarjeta('ee de t̂', numero(d.ee, 1), `cv ${pct(d.ee / d.t)}`) +
      tarjeta('Etapa 1 · etapa 2', `${numero(d.V1, 0)} · ${numero(d.V2, 0)}`, `V = ${numero(d.V, 0)}`) +
      tarjeta('R<sub>a</sub>² de los datos', numero(an.Ra2, 3), `ρ pedida: ${numero(d0.rho, 2)}. MSW ${numero(an.MSW, 3)}, S² ${numero(an.S2, 3)}.`) +
      tarjeta('deff', numero(d.deff, 2), `Frente a un MAS de ${numero(d.estudiantes, Number.isInteger(+d.estudiantes.toFixed(9)) ? 0 : 1)} estudiantes; n${sub('ef')} = ${numero(d.nEf, 1)}.`) +
      tarjeta('Con reemplazo (s<sub>z</sub>²/n)', d.eWR === null ? '—' : numero(d.eWR, 0),
        d.eWR === null ? 'Necesita al menos dos clases sorteadas (no forzosas).'
          : `En promedio, frente a V = ${numero(d.V, 0)}: ${d.sesgoWR >= 0 ? '+' : ''}${pct(d.sesgoWR / d.V)}.${d.forzosa.some(Boolean) ? ' Las clases forzosas van aparte, como en una etapa.' : ''}`);
    // El m óptimo es una aproximación (Lohr §5.4: conglomerados de igual tamaño,
    // «solo una guía»). Por eso, además, se prueban los m enteros cercanos con el
    // presupuesto y se da el de menor V exacta; redondear m_opt no siempre lo es (T7.121).
    const costos = `<span class="marca ilustrativo">Ejemplo ilustrativo</span> Costos en ${esc(DOS.costos.unidad)}.`;
    const c = Motor.costoOptimo(d0.c1, d0.c2, an.Ra2, d0.C);
    const mMax = Math.max(...DOS.M);
    if (c.error) $('resultado-costo').innerHTML = `${costos} ${esc(c.error)}`;
    else if (c.mOpt === Infinity || c.mOpt >= mMax) {
      $('resultado-costo').innerHTML = `${costos} Con ρ = ${numero(an.Ra2, 3)}${c.mOpt === Infinity ? '' : `, m${sub('opt')} = ${numero(c.mOpt, 0)}`}: ` +
        `los estudiantes de una misma clase casi no se parecen, así que conviene encuestar clases enteras (una etapa) y gastar el resto en más clases.`;
    } else {
      const candidatos = [];
      for (let mm = Math.max(1, Math.floor(c.mOpt) - 2); mm <= Math.ceil(c.mOpt) + 2; mm++) {
        const nn = Math.floor(d0.C / (d0.c1 + d0.c2 * mm));
        if (nn >= 2 && nn <= 12) candidatos.push({ m: mm, n: nn, V: Motor.analizaDosEtapas(DOS.M, clases(), nn, mm, d0.diseno).V });
      }
      const mejor = candidatos.sort((x, y) => x.V - y.V)[0];
      $('resultado-costo').innerHTML = `${costos} <span class="marca lectura">Lectura</span> Con ρ = ${numero(an.Ra2, 3)}, la fórmula da ` +
        `m${sub('opt')} = ${numero(c.mOpt, 2)} y n${sub('opt')} = ${numero(c.nOpt, 2)}, una aproximación para clases de igual tamaño. ` +
        (mejor ? `<span class="marca dato">Dato</span> Probando los m enteros cercanos con este presupuesto, la menor V exacta la da m = ${mejor.m} con ` +
          `${mejor.n} clases: V = ${numero(mejor.V, 0)}, por ${numero(mejor.n * (d0.c1 + d0.c2 * mejor.m), 0)} de ${numero(d0.C, 0)}.` +
          (mejor.m > Math.min(...DOS.M) ? ' Con ese m, alguna clase tiene menos estudiantes: se censaría y el diseño dejaría de ser autoponderado.' : '')
          : 'Con este presupuesto no alcanza para sortear al menos 2 clases cerca de ese m.');
    }
  }

  // --------------------------------------------------------------------- retos
  function construyeRetos() {
    document.querySelectorAll('.retos').forEach(caja => {
      const pestana = +caja.dataset.pestana;
      caja.innerHTML = RETOS.filter(r => r.pestana === pestana).map(r =>
        `<details data-reto="${r.id}"><summary>${r.pregunta}</summary><div class="respuesta"><p>Ábrelo después de intentarlo.</p></div></details>`).join('');
    });
    document.querySelectorAll('details[data-reto]').forEach(det => det.addEventListener('toggle', () => {
      if (!det.open || det.dataset.hecho) return;
      const reto = RETOS.find(r => r.id === det.dataset.reto);
      det.querySelector('.respuesta').innerHTML = `<p>${reto.respuesta()}</p>`;
      det.dataset.hecho = '1';
    }));
  }

  // ------------------------------------------------------------------- pestañas
  // `subir`: al cambiar de pestaña desde abajo, se vuelve al principio del panel nuevo
  // (si no, se caía a la mitad y no se veían el objetivo ni la predicción).
  function eligePestana(t, foco, subir = false) {
    E.tab = t;
    const barra = document.querySelector('.pestanas');
    document.querySelectorAll('[role="tab"]').forEach((b, i) => {
      const activa = i + 1 === t;
      b.setAttribute('aria-selected', String(activa));
      b.tabIndex = activa ? 0 : -1;
      if (activa && foco) b.focus({ preventScroll: true });
      // En el celular la barra se desplaza: la pestaña activa se lleva a la vista.
      if (activa) barra.scrollLeft = Math.max(0, b.offsetLeft - (barra.clientWidth - b.offsetWidth) / 2);
    });
    document.querySelectorAll('[role="tabpanel"]').forEach((p, i) => { p.hidden = i + 1 !== t; });
    $('poblacion').classList.toggle('oculto', t === 4);
    pinta({ tabla: false });
    if (subir) {
      const destino = (t === 4 ? barra : $('poblacion')).getBoundingClientRect().top + scrollY - 8;
      const panel = $(`panel-${t}`).getBoundingClientRect().top + scrollY - barra.offsetHeight - 8;
      if (scrollY > Math.min(destino, panel)) window.scrollTo({ top: t === 4 ? panel : Math.min(destino, panel) });
    }
  }

  // Una sola región viva, con un resumen corto y una espera: las rejillas de tarjetas se
  // anunciaban enteras en cada paso de un deslizador.
  let esperaAnuncio = null;
  function anuncia(texto) {
    clearTimeout(esperaAnuncio);
    esperaAnuncio = setTimeout(() => { $('resumen-vivo').textContent = texto; }, 600);
  }
  function resumenPestana() {
    if (E.tab === 4) {
      const d = Motor.analizaDosEtapas(DOS.M, clases(), E.dos.n, E.dos.m, E.dos.diseno);
      return `Etapa 1: ${pct(d.parte1)} de la varianza. ${d.autoponderado ? `Autoponderado, peso ${numero(d.pesoComun, 2)}.` : 'No es autoponderado.'}`;
    }
    const a = analisis(E.tab === 1 ? 'sistematico_fijo' : E.diseno);
    if (a.errores.length) return a.errores.join(' ');
    if (E.tab === 1) return `Muestra ${Motor.muestraRegla(a.pi, a.n, E.u).map(k => a.ids[k]).join(', ')}.`;
    if (E.tab === 2) return a.deff === null ? 'El deff no existe: y constante.' : `deff ${numero(a.deff, 3)}: ${a.deff < 1 ? 'gana el πPT' : 'gana el MAS'}.`;
    return `${a.paresCero.length} pares en cero; ${a.paresYG.length} incumplen Yates–Grundy.`;
  }

  // ---------------------------------------------------------------- pintar todo
  function pinta({ tabla = true } = {}) {
    acota();
    if (tabla) construyePoblacion();
    $('sel-escenario').value = E.esc;
    $('sel-n').value = String(E.n);
    $('sel-diseno').value = E.diseno;
    const a = analisis(E.diseno);
    actualizaPoblacion(a);
    if (!a.errores.length) {
      if (E.tab === 1) pintaPestana1();
      if (E.tab === 2) pintaPestana2();
      if (E.tab === 3) pintaPestana3();
    }
    if (E.tab === 4) pintaPestana4();
    aUrl();
    anuncia(resumenPestana());
  }

  // ------------------------------------------------------------------- eventos
  function conecta() {
    const sel = $('sel-escenario');
    ESCENARIOS.una_etapa.forEach(e => sel.add(new Option(e.titulo, e.clave)));
    sel.addEventListener('change', () => {
      E.esc = sel.value; unidades = copia(escenario().unidades); E.n = escenario().n;
      E.delta = 0; E.constante = false; E.par = [0, 1]; E.pagina = 0; simulacion = null;
      pinta();
    });
    $('sel-n').addEventListener('change', () => { E.n = +$('sel-n').value; E.pagina = 0; pinta({ tabla: false }); });
    $('sel-diseno').addEventListener('change', () => { E.diseno = $('sel-diseno').value; E.pagina = 0; pinta({ tabla: false }); });
    $('tabla-poblacion').addEventListener('input', (ev) => { if (ev.target.matches('input[data-k]')) leeCampo(ev.target); });
    $('boton-agregar').addEventListener('click', () => {
      if (unidades.length >= Motor.LIMITE_N) return;
      const xs = unidades.map(u => u.x), ys = unidades.map(u => u.y);
      unidades.push({ id: `U${unidades.length + 1}`, x: Math.round(Motor.suma(xs) / xs.length), y: Math.round(Motor.suma(ys) / ys.length) });
      pinta();
    });
    $('boton-quitar').addEventListener('click', () => { if (unidades.length > 3) { unidades.pop(); pinta(); } });
    $('boton-restaurar').addEventListener('click', () => { unidades = copia(escenario().unidades); E.delta = 0; E.constante = false; pinta(); });
    $('aviso-desplazada').addEventListener('click', (ev) => { if (ev.target.dataset.accion === 'delta-cero') { E.delta = 0; E.constante = false; pinta(); } });

    document.querySelectorAll('[role="tab"]').forEach((b, i) => {
      b.addEventListener('click', () => eligePestana(i + 1, false, true));
      b.addEventListener('keydown', (ev) => {
        const destino = { ArrowRight: E.tab % 4 + 1, ArrowLeft: (E.tab + 2) % 4 + 1, Home: 1, End: 4 }[ev.key];
        if (destino) { ev.preventDefault(); eligePestana(destino, true, true); }
      });
    });

    $('rango-u').addEventListener('input', () => { E.u = +$('rango-u').value; pintaPestana1(); aUrl(); });
    $('boton-sortear-u').addEventListener('click', () => {
      sorteos++;
      E.u = Math.floor(Motor.generador(E.semilla * 1000 + sorteos)() * 1000) / 1000;
      pintaPestana1(); aUrl();
    });

    $('rango-delta').addEventListener('input', () => { E.delta = +$('rango-delta').value; E.constante = false; pinta(); });
    $('boton-origen').addEventListener('click', () => {
      const a = analisis(E.diseno);
      if (a.errores.length) return;
      const rb = rectaBase(a);
      if (!rb || rb.pendiente <= 0) return;
      E.delta = Math.max(-Math.min(...unidades.map(u => u.y)), -rb.corte);
      E.constante = false; pinta();
    });
    $('boton-constante').addEventListener('click', () => { E.constante = !E.constante; pinta(); });
    $('boton-delta-cero').addEventListener('click', () => { E.delta = 0; E.constante = false; pinta(); });

    $('matriz-pikl').addEventListener('click', (ev) => {
      const b = ev.target.closest('button[data-par]');
      if (!b) return;
      E.par = b.dataset.par.split(',').map(Number);
      pintaPestana3(); aUrl();
      // La matriz se rehízo: el foco vuelve a la celda pulsada en lugar de caer en <body>.
      const de = document.querySelector(`#matriz-pikl button[data-par="${E.par.join(',')}"]`);
      if (de) de.focus();
    });
    $('paginas-espacio').addEventListener('click', (ev) => {
      const b = ev.target.closest('button[data-pagina]');
      if (!b) return;
      const sentido = b.dataset.pagina;
      E.pagina += +sentido;
      pintaEspacio(analisis(E.diseno));
      const igual = document.querySelector(`#paginas-espacio button[data-pagina="${sentido}"]:not([disabled])`) || document.querySelector('#paginas-espacio button:not([disabled])');
      if (igual) igual.focus();
    });
    $('sel-replicas').addEventListener('change', () => { E.R = +$('sel-replicas').value; pinta({ tabla: false }); });
    $('campo-semilla').addEventListener('change', () => {
      const v = Math.round(+$('campo-semilla').value);
      if (Number.isFinite(v) && v >= 1) E.semilla = v;
      pinta({ tabla: false });
    });
    $('boton-simular').addEventListener('click', () => {
      const a = analisis(E.diseno);
      if (a.errores.length) return;
      simulacion = { clave: JSON.stringify([a.clave, E.R, E.semilla]), resultado: Motor.replicas(a, E.R, E.semilla) };
      pintaPestana3(); aUrl();
    });

    const dos = (campo, conv) => (ev) => { const v = conv(ev.target.value); if (Number.isFinite(v)) { E.dos[campo] = v; pinta({ tabla: false }); } };
    $('dos-n').addEventListener('change', dos('n', Number));
    $('dos-m').addEventListener('change', dos('m', Number));
    $('dos-diseno').addEventListener('change', (ev) => { E.dos.diseno = ev.target.value; pinta({ tabla: false }); });
    $('dos-rho').addEventListener('input', dos('rho', Number));
    $('dos-semilla').addEventListener('change', dos('semilla', (v) => (String(v).trim() === '' ? NaN : Math.max(1, Math.round(+v)))));
    for (const [id, campo] of [['dos-c1', 'c1'], ['dos-c2', 'c2'], ['dos-C', 'C']]) {
      $(id).addEventListener('change', (ev) => {
        const v = +ev.target.value;
        ev.target.setAttribute('aria-invalid', String(!(v > 0)));
        if (v > 0) { E.dos[campo] = v; pinta({ tabla: false }); }
      });
    }

    $('boton-proyector').addEventListener('click', () => {
      const activo = document.documentElement.classList.toggle('proyector');
      $('boton-proyector').setAttribute('aria-pressed', String(activo));
      // Al proyectar, «Cómo usar» se pliega: con él abierto, la primera pantalla no mostraba el laboratorio.
      $('como-usar').open = !activo;
      pinta({ tabla: false });
      try { localStorage.setItem('laboratorio-ppt-proyector', activo ? '1' : '0'); } catch (e) { /* sin almacenamiento */ }
    });
    $('boton-enlace').addEventListener('click', async () => {
      aUrl();
      const b = $('boton-enlace');
      try { await navigator.clipboard.writeText(location.href); b.textContent = 'Enlace copiado'; } catch (e) { b.textContent = 'Copia la dirección de la barra'; }
      setTimeout(() => { b.textContent = 'Copiar enlace'; }, 2500);
    });
    // Primero se rehace la tabla y después se elige la pestaña: al revés, con la tabla
    // de un escenario más largo todavía en pantalla, saltaba un TypeError (T7.121).
    $('boton-reiniciar').addEventListener('click', () => {
      E = inicial(); unidades = copia(escenario().unidades); simulacion = null; sorteos = 0;
      construyePoblacion(); eligePestana(1, false, true);
    });
    // Un enlace del laboratorio pegado en una pestaña donde ya está abierto (o los de la
    // guía de 10 minutos) solo cambia el #: se relee. `aUrl` usa replaceState, que no
    // dispara este evento, así que no hay bucle.
    window.addEventListener('hashchange', () => {
      deUrl(); simulacion = null; construyePoblacion(); eligePestana(E.tab, false, true);
      document.querySelector('.pestanas').scrollIntoView({ block: 'start' });
    });
  }

  // --------------------------------------------------------------------- inicio
  let anchoPrevio = 0;
  let espera = null;
  window.addEventListener('resize', () => {
    clearTimeout(espera);
    espera = setTimeout(() => { if (Math.abs(innerWidth - anchoPrevio) > 20) { anchoPrevio = innerWidth; pinta({ tabla: false }); } }, 150);
  });
  function inicia() {
    anchoPrevio = innerWidth;
    try {
      if (localStorage.getItem('laboratorio-ppt-proyector') === '1') {
        document.documentElement.classList.add('proyector');
        $('boton-proyector').setAttribute('aria-pressed', 'true');
        $('como-usar').open = false;
      }
    } catch (e) { /* sin almacenamiento */ }
    conecta();
    construyeRetos();
    deUrl();
    construyePoblacion();
    eligePestana(E.tab, false);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inicia);
  else inicia();
})();
