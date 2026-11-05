/* motor.js — el cálculo del laboratorio πPT, sin DOM.
 *
 * Lo pega dentro de la página `ensambla_laboratorio_ppt.py`, y lo prueban
 * `precalculo/pruebas/prueba_laboratorio_ppt.js` (Node, identidades) y
 * `precalculo/verifica_laboratorio_ppt.R` (contra `sampling`). Por qué existe:
 * el laboratorio original (`Simulador_IProb.html`, fuera de git) topaba las π
 * en 0,96 en lugar de la inclusión forzosa, calibraba un «Brewer» (en
 * realidad, máxima entropía) que no convergía y escribía «verificado» sin
 * calcular nada (T7.118).
 *
 * Todo es exacto, por enumeración de las muestras: N ≤ 9 en una etapa, y las
 * 15 clases de Lohr (ej. 6.11) en dos. Notación de los caps. 5 y 6: ψ_k es la
 * probabilidad de una extracción (suman 1), π_k la de inclusión (suman n),
 * π_kl la de segundo orden, t̂_π el estimador de Horvitz–Thompson. Las
 * ecuaciones citadas son las de Lohr, 3.ª ed., cap. 6.
 */
(function (raiz) {
  'use strict';

  const LIMITE_N = 9;          // una etapa: las muestras se enumeran todas
  const ESQUEMAS = ['sistematico_fijo', 'sistematico_aleatorio', 'maxima_entropia'];
  const CERO = 1e-12;

  // ---------------------------------------------------------------- utilidades

  function suma(v) {
    let s = 0;
    for (const a of v) s += a;
    return s;
  }

  // Todas las combinaciones de `r` elementos de `lista`, en orden lexicográfico.
  function combinaciones(lista, r) {
    const salida = [];
    const actual = [];
    (function paso(desde) {
      if (actual.length === r) { salida.push(actual.slice()); return; }
      for (let i = desde; i <= lista.length - (r - actual.length); i++) {
        actual.push(lista[i]);
        paso(i + 1);
        actual.pop();
      }
    })(0);
    return salida;
  }

  // Generador con semilla (mulberry32): las réplicas se repiten igual en clase.
  function generador(semilla) {
    let a = (Number(semilla) >>> 0) || 1;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Normal estándar por Box–Muller, con el generador de arriba.
  function normal(azar) {
    let u = 0;
    while (u <= 0) u = azar();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * azar());
  }

  function baraja(lista, azar) {
    const a = lista.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(azar() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ---------------------------------------------------------------- validación

  // Devuelve la lista de problemas; vacía si la población sirve. Se exige
  // x > 0 (sin tamaño no hay π) e y ≥ 0 (totales de conteos o montos).
  function validaPoblacion(unidades, n) {
    const errores = [];
    const N = unidades.length;
    if (N < 3 || N > LIMITE_N) errores.push(`N debe estar entre 3 y ${LIMITE_N}; es ${N}.`);
    unidades.forEach((u, k) => {
      const nombre = u.id || `unidad ${k + 1}`;
      if (!Number.isFinite(u.x) || u.x <= 0) errores.push(`${nombre}: el tamaño x debe ser un número positivo.`);
      if (!Number.isFinite(u.y) || u.y < 0) errores.push(`${nombre}: y debe ser un número mayor o igual que 0.`);
    });
    if (!Number.isInteger(n) || n < 1 || n > N - 1) errores.push(`n debe ser un entero entre 1 y ${N - 1}; es ${n}.`);
    return errores;
  }

  // ------------------------------------------------- probabilidades de inclusión

  // π_k ∝ x_k con inclusión forzosa, como `sampling::inclusionprobabilities`:
  // la que llega a 1 queda en 1, y el cupo que sobra se reparte en proporción a
  // x entre las demás. Se repite, porque el reparto puede empujar otra a 1.
  function probabilidadesInclusion(x, n) {
    const N = x.length;
    const tx = suma(x);
    const psi = x.map(v => v / tx);
    const crudas = x.map(v => n * v / tx);
    const pi = new Array(N).fill(0);
    const forzosa = new Array(N).fill(false);
    let cambio = true;
    while (cambio) {
      cambio = false;
      const resto = [];
      for (let k = 0; k < N; k++) if (!forzosa[k]) resto.push(k);
      const cupo = n - (N - resto.length);
      const txResto = suma(resto.map(k => x[k]));
      for (const k of resto) pi[k] = cupo * x[k] / txResto;
      for (const k of resto) {
        if (pi[k] >= 1 - CERO) { forzosa[k] = true; pi[k] = 1; cambio = true; }
      }
    }
    return { psi, crudas, pi, forzosa, tx };
  }

  // --------------------------------------------------------- diseños exactos

  // Sistemático sobre una lista ordenada con π < 1 que suman `r` (entero): u en
  // [0, 1) y los puntos u, u + 1, …, u + r − 1 sobre las π acumuladas. Cada
  // tramo de u entre dos cortes da siempre la misma muestra; su largo es su
  // probabilidad.
  function sistematicoOrden(pis, orden, r) {
    const acum = [0];
    for (const k of orden) acum.push(acum[acum.length - 1] + pis[k]);
    const cortes = [0, 1];
    for (let j = 1; j < orden.length; j++) {
      const f = acum[j] - Math.floor(acum[j] + 1e-12);
      if (f > 1e-12 && f < 1 - 1e-12) cortes.push(f);
    }
    cortes.sort((a, b) => a - b);
    const muestras = new Map();
    for (let c = 0; c + 1 < cortes.length; c++) {
      const largo = cortes[c + 1] - cortes[c];
      if (largo <= 1e-12) continue;
      const u = (cortes[c] + cortes[c + 1]) / 2;
      const s = [];
      let j = 0;
      for (let p = 0; p < r; p++) {
        const punto = u + p;
        while (j < orden.length - 1 && acum[j + 1] <= punto) j++;
        s.push(orden[j]);
      }
      s.sort((a, b) => a - b);
      const clave = s.join(',');
      muestras.set(clave, (muestras.get(clave) || 0) + largo);
    }
    return muestras;
  }

  // La regla de la pestaña 1: el sistemático con todas las unidades en el orden
  // de la tabla. Una forzosa ocupa un tramo de largo 1 y siempre le cae un
  // punto, así que da lo mismo que `distribucion(…, 'sistematico_fijo')`
  // (lo comprueba la prueba). `muestraRegla` da la muestra de un u;
  // `tramosRegla`, los tramos de u en [0, 1) y la muestra de cada uno.
  function muestraRegla(pi, n, u) {
    const s = [];
    let acum = 0;
    let k = 0;
    for (let p = 0; p < n; p++) {
      while (k < pi.length - 1 && acum + pi[k] <= u + p + 1e-12) { acum += pi[k]; k++; }
      s.push(k);
    }
    return s;
  }
  function tramosRegla(pi, n) {
    const cortes = [0, 1];
    let acum = 0;
    for (let k = 0; k < pi.length - 1; k++) {
      acum += pi[k];
      const f = Math.round((acum - Math.floor(acum + 1e-12)) * 1e12) / 1e12;
      if (f > 1e-9 && f < 1 - 1e-9) cortes.push(f);
    }
    cortes.sort((a, b) => a - b);
    const tramos = [];
    for (let c = 0; c + 1 < cortes.length; c++) {
      if (cortes[c + 1] - cortes[c] <= 1e-9) continue;
      tramos.push({ desde: cortes[c], hasta: cortes[c + 1], s: muestraRegla(pi, n, (cortes[c] + cortes[c + 1]) / 2) });
    }
    return tramos;
  }

  // Los órdenes distintos para el sistemático con la lista barajada. Girar la
  // lista o darle la vuelta no cambia el diseño (u es uniforme en el círculo),
  // así que basta fijar el primero y quedarse con una de cada pareja espejo:
  // (m − 1)!/2 órdenes en lugar de m!. Con 9 unidades son 20 160.
  function ordenesCirculares(lista) {
    if (lista.length <= 2) return [lista.slice()];
    const [primero, ...resto] = lista;
    const salida = [];
    const usado = new Array(resto.length).fill(false);
    const actual = [];
    (function paso() {
      if (actual.length === resto.length) {
        if (actual[0] < actual[actual.length - 1]) salida.push([primero, ...actual]);
        return;
      }
      for (let i = 0; i < resto.length; i++) {
        if (usado[i]) continue;
        usado[i] = true; actual.push(resto[i]);
        paso();
        actual.pop(); usado[i] = false;
      }
    })();
    return salida;
  }

  // El diseño de máxima entropía (Poisson condicionado; cap. 6, M5): entre las
  // muestras de tamaño r, P(s) ∝ Π_{k∈s} p̃_k/(1 − p̃_k). Las p̃ del Poisson no
  // son las π: se ajustan hasta que las marginales den las π, con el paso de
  // `sampling::UPMEpiktildefrompik`, p̃ ← p̃ + (π − π(p̃)). El original
  // (T7.118) daba 60 pasos amortiguados y paraba lejos. Aquí se para por error
  // RELATIVO (1e-12): con una π de 1e-5, un error absoluto de 1e-13 ya era
  // relativo 1e-8, y y/π lo agrandaba hasta marcar ✗ un diseño correcto (T7.121).
  function maximaEntropia(pis, unidades, r) {
    const m = unidades.length;
    const subs = combinaciones(Array.from({ length: m }, (_, j) => j), r);
    const objetivo = unidades.map(k => pis[k]);
    // Se itera hasta el error relativo 1e-14 o hasta que deja de bajar (el
    // redondeo de la máquina), y se queda con el mejor paso. Con 1e-12 las
    // unidades de π pequeña dejaban E(v̂_HT) a 4e-9 de V en «Barrios».
    let pt = objetivo.slice();
    let mejor = null;
    let sinMejora = 0;
    let pasos = 0;
    for (; pasos < 20000; pasos++) {
      const odds = pt.map(p => p / (1 - p));
      let probs = subs.map(s => s.reduce((a, j) => a * odds[j], 1));
      const total = suma(probs);
      probs = probs.map(p => p / total);
      const marg = new Array(m).fill(0);
      subs.forEach((s, i) => { for (const j of s) marg[j] += probs[i]; });
      const error = Math.max(...marg.map((v, j) => Math.abs(v - objetivo[j]) / objetivo[j]));
      if (!mejor || error < mejor.error) { mejor = { pt: pt.slice(), probs, error }; sinMejora = 0; } else sinMejora++;
      if (error < 1e-14 || sinMejora >= 50) break;
      pt = pt.map((p, j) => Math.min(1 - 1e-15, Math.max(1e-15, p + objetivo[j] - marg[j])));
    }
    const { probs, error } = mejor;
    pt = mejor.pt;
    const muestras = new Map();
    subs.forEach((s, i) => muestras.set(s.map(j => unidades[j]).join(','), probs[i]));
    const poisson = new Array(pis.length).fill(null);
    unidades.forEach((k, j) => { poisson[k] = pt[j]; });
    return { muestras, calibracion: { poisson, pasos, error } };
  }

  // La distribución exacta de las muestras: [{ s: [índices], p }]. Las de
  // inclusión forzosa entran en todas; el diseño se aplica al resto, con el
  // cupo que queda.
  function distribucion(pi, forzosa, n, esquema) {
    if (!ESQUEMAS.includes(esquema)) throw new Error(`Esquema desconocido: ${esquema}`);
    const fijas = [];
    const resto = [];
    pi.forEach((_, k) => (forzosa[k] ? fijas : resto).push(k));
    const r = n - fijas.length;
    let muestras;
    let calibracion = null;
    if (r === 0) {
      muestras = new Map([['', 1]]);
    } else if (esquema === 'maxima_entropia') {
      ({ muestras, calibracion } = maximaEntropia(pi, resto, r));
    } else if (esquema === 'sistematico_fijo') {
      muestras = sistematicoOrden(pi, resto, r);
    } else {
      if (resto.length > LIMITE_N) throw new Error(`El sistemático con la lista barajada se enumera hasta ${LIMITE_N} unidades.`);
      const ordenes = ordenesCirculares(resto);
      muestras = new Map();
      for (const orden of ordenes) {
        for (const [clave, p] of sistematicoOrden(pi, orden, r)) {
          muestras.set(clave, (muestras.get(clave) || 0) + p / ordenes.length);
        }
      }
    }
    const salida = [];
    for (const [clave, p] of muestras) {
      const s = (clave === '' ? [] : clave.split(',').map(Number)).concat(fijas).sort((a, b) => a - b);
      salida.push({ s, p });
    }
    salida.sort((a, b) => (a.s.join(',') < b.s.join(',') ? -1 : 1));
    salida.calibracion = calibracion;     // las p̃ del Poisson, para sortear
    return salida;
  }

  // π_k y π_kl leídas de la distribución (no de la fórmula del diseño): así
  // la comprobación Σ_{s∋k} P(s) = π_k es una cuenta de verdad.
  function segundoOrden(N, muestras) {
    const piDist = new Array(N).fill(0);
    const pikl = Array.from({ length: N }, () => new Array(N).fill(0));
    for (const { s, p } of muestras) {
      for (let a = 0; a < s.length; a++) {
        piDist[s[a]] += p;
        for (let b = a + 1; b < s.length; b++) {
          pikl[s[a]][s[b]] += p;
          pikl[s[b]][s[a]] += p;
        }
      }
    }
    for (let k = 0; k < N; k++) pikl[k][k] = piDist[k];
    return { piDist, pikl };
  }

  // -------------------------------------------------------------- estimadores

  // Las tres estimaciones de varianza para una muestra s (Lohr 6.22–6.24).
  // v̂_WR se calcula sin las unidades de inclusión forzosa: son un estrato que
  // se censa y no aportan varianza; con menos de dos unidades sorteadas no
  // existe (null).
  function estimaMuestra(y, pi, pikl, forzosa, s) {
    const t = suma(s.map(k => y[k] / pi[k]));
    let vHT = 0;
    let vSYG = 0;
    for (const k of s) vHT += (1 - pi[k]) * (y[k] / pi[k]) ** 2;
    for (let a = 0; a < s.length; a++) {
      for (let b = a + 1; b < s.length; b++) {
        const k = s[a], l = s[b];
        const d = pikl[k][l] - pi[k] * pi[l];
        vHT += 2 * (d / pikl[k][l]) * (y[k] / pi[k]) * (y[l] / pi[l]);
        vSYG += (-d / pikl[k][l]) * (y[k] / pi[k] - y[l] / pi[l]) ** 2;
      }
    }
    const sorteadas = s.filter(k => !forzosa[k]);
    let vWR = null;
    if (sorteadas.length >= 2) {
      const r = sorteadas.length;
      const tR = suma(sorteadas.map(k => y[k] / pi[k]));
      vWR = r / (r - 1) * suma(sorteadas.map(k => (y[k] / pi[k] - tR / r) ** 2));
    }
    return { t, vHT, vSYG, vWR };
  }

  // Varianza exacta de t̂_π en sus dos formas (6.20 y 6.21).
  function varianzas(y, pi, pikl) {
    const N = y.length;
    let formaHT = 0;
    let formaSYG = 0;
    for (let k = 0; k < N; k++) {
      formaHT += (1 - pi[k]) / pi[k] * y[k] ** 2;
      for (let l = 0; l < N; l++) {
        if (l === k) continue;
        formaHT += (pikl[k][l] - pi[k] * pi[l]) / (pi[k] * pi[l]) * y[k] * y[l];
        if (l > k) formaSYG += (pi[k] * pi[l] - pikl[k][l]) * (y[k] / pi[k] - y[l] / pi[l]) ** 2;
      }
    }
    return { formaHT, formaSYG };
  }

  // Los diseños de referencia con el mismo n: MAS sin y con reemplazo, y el PPT
  // con reemplazo (Hansen–Hurwitz, con ψ_k = x_k/t_x). El criterio de Raj del
  // M5 del cap. 6: V_MRAS − V_HH = (N²/n)·Cov(x, y²/x), covarianza con divisor N.
  function referencias(x, y, n) {
    const N = y.length;
    const t = suma(y);
    const tx = suma(x);
    const media = t / N;
    const ss = suma(y.map(v => (v - media) ** 2));
    const S2 = ss / (N - 1);
    const vMAS = N * N * (1 - n / N) * S2 / n;
    const vMRAS = N * N * (ss / N) / n;
    const vHH = suma(x.map((xv, k) => (xv / tx) * (y[k] / (xv / tx) - t) ** 2)) / n;
    const q = x.map((xv, k) => y[k] ** 2 / xv);
    const covRaj = suma(x.map((xv, k) => xv * q[k])) / N - (tx / N) * (suma(q) / N);
    const mx = tx / N;
    const sxx = suma(x.map(v => (v - mx) ** 2));
    const sxy = suma(x.map((v, k) => (v - mx) * (y[k] - media)));
    const pendiente = sxx > 0 ? sxy / sxx : 0;
    const corr = sxx > 0 && ss > 0 ? sxy / Math.sqrt(sxx * ss) : null;
    return {
      t, tx, S2, vMAS, vMRAS, vHH, covRaj, rajDiferencia: N * N / n * covRaj,
      corr, pendiente, corte: media - pendiente * mx,
      razon: t / tx,                       // la recta por el origen, y = (t/t_x)·x
      zHH: x.map((xv, k) => y[k] / (xv / tx)),
    };
  }

  // La recta de mínimos cuadrados de y sobre x en un subconjunto de unidades.
  // Con forzosas, la que cuenta para el πPT es la de las demás: entre ellas las
  // π son proporcionales a x, y las forzosas no aportan varianza (T7.121).
  function recta(x, y, indices) {
    if (indices.length < 2) return null;
    const xs = indices.map(k => x[k]), ys = indices.map(k => y[k]);
    const mx = suma(xs) / xs.length, my = suma(ys) / ys.length;
    const sxx = suma(xs.map(v => (v - mx) ** 2));
    const syy = suma(ys.map(v => (v - my) ** 2));
    const sxy = suma(xs.map((v, j) => (v - mx) * (ys[j] - my)));
    const pendiente = sxx > 0 ? sxy / sxx : 0;
    return { pendiente, corte: my - pendiente * mx, media: my, corr: sxx > 0 && syy > 0 ? sxy / Math.sqrt(sxx * syy) : null,
      razon: suma(ys) / suma(xs), indices };
  }

  // -------------------------------------------------------- análisis completo

  // Todo lo de una etapa para una población y un n. `unidades`: [{ id, x, y }].
  function analiza(unidades, n, esquema) {
    const errores = validaPoblacion(unidades, n);
    if (errores.length) return { errores };
    const N = unidades.length;
    const x = unidades.map(u => u.x);
    const y = unidades.map(u => u.y);
    const inc = probabilidadesInclusion(x, n);
    const muestras = distribucion(inc.pi, inc.forzosa, n, esquema);
    const { piDist, pikl } = segundoOrden(N, muestras);
    const pi = inc.pi;
    // Con una forzosa, π_kl = π_l exacto: la suma sobre las muestras deja un
    // residuo de 1e-16 que, multiplicado por (y/π)², hacía salir v̂_SYG = −6e-8.
    for (let k = 0; k < N; k++) {
      if (!inc.forzosa[k]) continue;
      for (let l = 0; l < N; l++) { pikl[k][l] = pi[l]; pikl[l][k] = pi[l]; }
    }
    const ref = referencias(x, y, n);
    const { formaHT, formaSYG } = varianzas(y, pi, pikl);

    let esperanza = 0, vEnum = 0, eHT = 0, eSYG = 0, eWR = 0, hayWR = true, pNegativa = 0;
    for (const m of muestras) {
      Object.assign(m, estimaMuestra(y, pi, pikl, inc.forzosa, m.s));
      esperanza += m.p * m.t;
      vEnum += m.p * (m.t - ref.t) ** 2;
      eHT += m.p * m.vHT;
      eSYG += m.p * m.vSYG;
      if (m.vWR === null) hayWR = false; else eWR += m.p * m.vWR;
      if (m.vSYG < -1e-12 * Math.max(1, ref.t * ref.t)) pNegativa += m.p;
    }

    // Los pares: los que nunca salen juntos (π_kl = 0: v̂ sesgado) y los que
    // incumplen Yates–Grundy (π_kπ_l − π_kl < 0: v̂_SYG puede salir negativo).
    const paresCero = [];
    const paresYG = [];
    for (let k = 0; k < N; k++) {
      for (let l = k + 1; l < N; l++) {
        if (pikl[k][l] <= 1e-12) paresCero.push([k, l]);
        if (pi[k] * pi[l] - pikl[k][l] < -1e-12) paresYG.push([k, l]);
      }
    }

    const escala = Math.max(1, Math.abs(formaSYG), ref.t * ref.t * 1e-12);
    const filas = Array.from({ length: N }, (_, k) => suma(pikl[k]) - pikl[k][k]);
    const verificaciones = [
      ['Σ π_k = n', Math.abs(suma(pi) - n), 1e-9],
      ['π_k ≤ 1', Math.max(0, ...pi.map(v => v - 1)), 1e-12],
      ['Σ P(s) = 1', Math.abs(suma(muestras.map(m => m.p)) - 1), 1e-9],
      ['Σ_{s∋k} P(s) = π_k', Math.max(...piDist.map((v, k) => Math.abs(v - pi[k]))), 1e-9],
      ['Σ_{l≠k} π_kl = (n − 1)·π_k', Math.max(...filas.map((v, k) => Math.abs(v - (n - 1) * pi[k]))), 1e-9],
      ['E(t̂_π) = t', Math.abs(esperanza - ref.t) / Math.max(1, ref.t), 1e-9],
      ['V forma 6.20 = forma 6.21', Math.abs(formaHT - formaSYG) / escala, 1e-9],
      ['V = Σ P(s)(t̂ − t)²', Math.abs(vEnum - formaSYG) / escala, 1e-9],
    ].map(([nombre, error, tol]) => ({ nombre, error, ok: error <= tol }));
    if (paresCero.length === 0) {
      verificaciones.push(
        { nombre: 'E(v̂_HT) = V', error: Math.abs(eHT - formaSYG) / escala, ok: Math.abs(eHT - formaSYG) / escala <= 1e-9 },
        { nombre: 'E(v̂_SYG) = V', error: Math.abs(eSYG - formaSYG) / escala, ok: Math.abs(eSYG - formaSYG) / escala <= 1e-9 });
    }

    const V = formaSYG;
    // Con y constante el MAS acierta siempre (V_MAS = 0) y el deff no existe.
    const deff = ref.vMAS > 1e-12 * Math.max(1, ref.t * ref.t) ? V / ref.vMAS : null;
    const libres = pi.map((_, k) => k).filter(k => !inc.forzosa[k]);
    return {
      errores: [], N, n, esquema, x, y, ids: unidades.map((u, k) => u.id || `U${k + 1}`),
      psi: inc.psi, crudas: inc.crudas, pi, forzosa: inc.forzosa, tx: inc.tx,
      muestras, pikl, calibracion: muestras.calibracion,
      V, formaHT, formaSYG, ee: Math.sqrt(Math.max(0, V)),
      esperanza, esperanzas: { vHT: eHT, vSYG: eSYG, vWR: hayWR ? eWR : null },
      paresCero, paresYG, pNegativa,
      referencias: ref, deff, rectaLibres: recta(x, y, libres),
      verificaciones, todoOk: verificaciones.every(v => v.ok),
    };
  }

  // La muestra que elige el estudiante: tiene que tener n unidades y estar en
  // el soporte del diseño (P(s) > 0); si no, se dice por qué.
  function evaluaMuestra(analisis, s) {
    const orden = s.slice().sort((a, b) => a - b);
    if (orden.length !== analisis.n) return { error: `La muestra tiene ${orden.length} unidades y el diseño sortea n = ${analisis.n}.` };
    const clave = orden.join(',');
    const m = analisis.muestras.find(mu => mu.s.join(',') === clave);
    if (!m) return { error: 'Este diseño nunca sortea esa muestra: P(s) = 0.' };
    return m;
  }

  // Desplaza todas las y en δ: la recta sube o baja sin girar, y la correlación
  // con x no cambia. Es la palanca de «correlación no es proporcionalidad».
  function desplazaY(unidades, delta) {
    return unidades.map(u => ({ ...u, y: Math.max(0, u.y + delta) }));
  }

  // --------------------------------------------------------------- réplicas

  // Una muestra con el algoritmo real del diseño, no leyendo P(s): así la
  // simulación comprueba la enumeración en lugar de copiarla.
  function sortea(analisis, azar) {
    const { pi, forzosa, n, esquema } = analisis;
    const fijas = [];
    const resto = [];
    pi.forEach((_, k) => (forzosa[k] ? fijas : resto).push(k));
    const r = n - fijas.length;
    let elegidas = [];
    if (r > 0 && esquema === 'maxima_entropia') {
      // Poisson condicionado: cada unidad entra por su cuenta con su p̃; si no
      // salen exactamente r, se descarta y se vuelve a sortear.
      const pt = analisis.calibracion.poisson;
      let intentos = 0;
      do {
        if (++intentos > 1e6) throw new Error('El Poisson condicionado no da muestras de tamaño n: revise las π.');
        elegidas = resto.filter(k => azar() < pt[k]);
      } while (elegidas.length !== r);
    } else if (r > 0) {
      const orden = esquema === 'sistematico_aleatorio' ? baraja(resto, azar) : resto;
      const u = azar();
      let acum = 0;
      let j = 0;
      for (let p = 0; p < r; p++) {
        while (j < orden.length - 1 && acum + pi[orden[j]] <= u + p) { acum += pi[orden[j]]; j++; }
        elegidas.push(orden[j]);
      }
    }
    return elegidas.concat(fijas).sort((a, b) => a - b);
  }

  // R réplicas del diseño y del MAS con el mismo n. Devuelve lo que hace falta
  // para comparar con lo exacto: la media y su error de simulación, el ee, el
  // ECM, la cobertura de t̂ ± 1,96·√v̂ y cuánto se aparta cada frecuencia de su P(s).
  function replicas(analisis, R, semilla) {
    const azar = generador(semilla);
    const { y, pi, pikl, forzosa, n, N } = analisis;
    const t = analisis.referencias.t;
    const valores = [];
    const valoresMAS = [];
    const frecuencia = new Map();
    let cubreSYG = 0, cubreWR = 0, conWR = 0, negativas = 0;
    const todas = Array.from({ length: N }, (_, k) => k);
    for (let b = 0; b < R; b++) {
      const s = sortea(analisis, azar);
      const e = estimaMuestra(y, pi, pikl, forzosa, s);
      valores.push(e.t);
      const clave = s.join(',');
      frecuencia.set(clave, (frecuencia.get(clave) || 0) + 1);
      if (e.vSYG < 0) negativas++;
      else if (Math.abs(e.t - t) <= 1.96 * Math.sqrt(e.vSYG)) cubreSYG++;
      if (e.vWR !== null) { conWR++; if (Math.abs(e.t - t) <= 1.96 * Math.sqrt(e.vWR)) cubreWR++; }
      const sm = baraja(todas, azar).slice(0, n);
      valoresMAS.push(N / n * suma(sm.map(k => y[k])));
    }
    const resumen = (v) => {
      const media = suma(v) / v.length;
      const de = Math.sqrt(suma(v.map(a => (a - media) ** 2)) / (v.length - 1));
      return { media, ee: de, eeMedia: de / Math.sqrt(v.length), sesgo: media - t, ecm: suma(v.map(a => (a - t) ** 2)) / v.length };
    };
    let apartamiento = 0;
    for (const m of analisis.muestras) {
      const f = (frecuencia.get(m.s.join(',')) || 0) / R;
      const z = Math.abs(f - m.p) / Math.sqrt(Math.max(m.p * (1 - m.p), 1e-12) / R);
      apartamiento = Math.max(apartamiento, z);
    }
    const fuera = [...frecuencia.keys()].filter(c => !analisis.muestras.some(m => m.s.join(',') === c));
    return {
      R, semilla, valores, valoresMAS,
      diseno: resumen(valores), mas: resumen(valoresMAS),
      coberturaSYG: cubreSYG / R, negativasSYG: negativas / R,
      coberturaWR: conWR > 0 ? cubreWR / conWR : null,
      apartamientoMaximo: apartamiento,   // en errores estándar binomiales
      muestrasFueraDelSoporte: fuera.length,
    };
  }

  // ------------------------------------------------------------ dos etapas

  // La población de estudiantes de las clases de Lohr: los M_i son los reales
  // (classes.csv) y las horas de estudio se inventan con semilla, con un
  // efecto de clase de varianza ρ y uno individual de varianza 1 − ρ, en una
  // escala de media 3,5 h y desviación 1,2 h, redondeadas a media hora y sin
  // negativos. Es un ejemplo ilustrativo: la ρ que se muestra es la R_a² de
  // estos datos, no la del deslizador.
  function poblacionClases(M, rho, semilla) {
    const azar = generador(semilla);
    const media = 3.5;
    const de = 1.2;
    return M.map((Mi) => {
      const efecto = Math.sqrt(rho) * normal(azar);
      const horas = [];
      for (let j = 0; j < Mi; j++) {
        const v = media + de * (efecto + Math.sqrt(1 - rho) * normal(azar));
        horas.push(Math.max(0, Math.round(v * 2) / 2));
      }
      return horas;
    });
  }

  // La R_a² del cap. 5 (M4): 1 − MSW/S², con S² de todos los estudiantes.
  function anova(yPorClase) {
    const todos = yPorClase.flat();
    const K = todos.length;
    const N = yPorClase.length;
    const media = suma(todos) / K;
    const S2 = suma(todos.map(v => (v - media) ** 2)) / (K - 1);
    let ssw = 0;
    let ssb = 0;
    for (const c of yPorClase) {
      const mi = suma(c) / c.length;
      ssw += suma(c.map(v => (v - mi) ** 2));
      ssb += c.length * (mi - media) ** 2;
    }
    const MSW = ssw / (K - N);
    const MSB = ssb / (N - 1);
    return { K, media, S2, MSW, MSB, Ra2: 1 - MSW / S2 };
  }

  // m óptimo con presupuesto (cap. 5 M8; Lohr §5.4, ec. 5.36 para N grande):
  // m* = √(c₁(1 − ρ)/(c₂ρ)) y n* = C/(c₁ + c₂m*). Con ρ ≤ 0 no hay óptimo
  // finito: conviene tomar cuantos estudiantes quepan en cada clase.
  function costoOptimo(c1, c2, rho, C) {
    if (!(c1 > 0 && c2 > 0 && C > 0)) return { error: 'c₁, c₂ y C deben ser positivos.' };
    if (!(rho > 0)) return { mOpt: Infinity, nOpt: null, nota: 'Con ρ ≤ 0 conviene tomar cuantos estudiantes quepan en cada clase.' };
    const mOpt = Math.sqrt(c1 * (1 - rho) / (c2 * rho));
    return { mOpt, nOpt: C / (c1 + c2 * mOpt) };
  }

  // Dos etapas: clases con π_i ∝ M_i (inclusión forzosa si toca) y m
  // estudiantes por MAS en cada una (todos, si la clase tiene menos de m).
  // V(t̂_π) de la ec. 6.27: la etapa 1 es la forma SYG con los totales t_i, y
  // la etapa 2 es Σ V(t̂_i)/π_i. Esta es una descomposición por etapas de
  // verdad (ley de la varianza total), no los sumandos de un estimador.
  function analizaDosEtapas(M, yPorClase, n, m, esquema) {
    if (esquema === 'sistematico_aleatorio') throw new Error('Con 15 clases, el sistemático con la lista barajada no se enumera.');
    const N = M.length;
    const K = suma(M);
    const inc = probabilidadesInclusion(M, n);
    const pi = inc.pi;
    const muestras = distribucion(pi, inc.forzosa, n, esquema);
    const { pikl } = segundoOrden(N, muestras);
    const tI = yPorClase.map(c => suma(c));
    const filas = yPorClase.map((c, i) => {
      const Mi = M[i];
      const mi = Math.min(m, Mi);
      const media = tI[i] / Mi;
      const S2i = Mi > 1 ? suma(c.map(v => (v - media) ** 2)) / (Mi - 1) : 0;
      const Vi = Mi * Mi * (1 - mi / Mi) * S2i / mi;
      return { Mi, mi, ti: tI[i], S2i, Vi, pi: pi[i], piCond: mi / Mi, piFinal: pi[i] * mi / Mi, peso: Mi / (pi[i] * mi) };
    });
    const V1 = varianzas(tI, pi, pikl).formaSYG;
    const V2 = suma(filas.map(f => f.Vi / f.pi));
    const V = V1 + V2;
    // La aproximación con reemplazo (ec. 6.30; el s_z²/n del M9 del cap. 6):
    // su esperanza exacta bajo este diseño, sumando sobre las muestras. Las
    // clases forzosas van aparte, como un estrato que se censa (igual que en
    // una etapa): aportan solo su V(t̂_i), que se estima sin sesgo dentro de
    // ellas. Meterlas en la 6.30 le cargaba a la aproximación un exceso que no
    // es suyo: +95 % en lugar de +29 % con n = 8 (T7.121).
    const libresC = M.map((_, i) => i).filter(i => !inc.forzosa[i]);
    const vForzosas = suma(libresC.length === N ? [] : filas.filter((_, i) => inc.forzosa[i]).map(f => f.Vi));
    let eWR = 0;
    for (const { s, p } of muestras) {
      const sl = s.filter(i => !inc.forzosa[i]);
      const r = sl.length;
      if (r < 2) { eWR = null; break; }
      const a = sl.map(i => tI[i] / pi[i]);
      eWR += p * (r / (r - 1) * (suma(a.map(v => v * v)) - suma(a) ** 2 / r) + suma(sl.map(i => filas[i].Vi / pi[i] ** 2)));
    }
    if (eWR !== null) eWR += vForzosas;
    const pesos = filas.map(f => f.peso);
    const autoponderado = Math.max(...pesos) - Math.min(...pesos) <= 1e-9 * Math.max(...pesos);
    // Por qué se rompe la cancelación de M_i: una clase forzosa tiene π_i = 1 y
    // no n·M_i/K, y una clase con menos de m estudiantes se censa.
    const motivos = [];
    if (inc.forzosa.some(Boolean)) motivos.push('forzosas');
    if (M.some(Mi => Mi < m)) motivos.push('clases_menores_que_m');
    const an = anova(yPorClase);
    // El deff compara con un MAS de tantos estudiantes como los que se esperan,
    // Σ π_i·m_i (= n·m si ninguna clase tiene menos de m).
    const estudiantes = suma(filas.map(f => f.pi * f.mi));
    const vMAS = K * K * (1 - estudiantes / K) * an.S2 / estudiantes;
    return {
      N, K, n, m, esquema, pi, forzosa: inc.forzosa, filas, t: suma(tI),
      V1, V2, V, ee: Math.sqrt(V), parte1: V1 / V, parte2: V2 / V,
      eWR, sesgoWR: eWR === null ? null : eWR - V,
      autoponderado, pesoComun: autoponderado ? pesos[0] : null, motivos,
      anova: an, estudiantes, vMAS, deff: V / vMAS, nEf: estudiantes / (V / vMAS),
    };
  }

  // ------------------------------------------------------------- exportación

  const Motor = {
    LIMITE_N, ESQUEMAS,
    suma, combinaciones, generador, normal, baraja,
    validaPoblacion, probabilidadesInclusion, distribucion, segundoOrden,
    sistematicoOrden, ordenesCirculares, maximaEntropia, muestraRegla, tramosRegla,
    estimaMuestra, varianzas, referencias, recta, analiza, evaluaMuestra, desplazaY,
    sortea, replicas,
    poblacionClases, anova, costoOptimo, analizaDosEtapas,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = Motor;
  else raiz.Motor = Motor;
})(typeof window !== 'undefined' ? window : this);
