#!/usr/bin/env node
/* Prueba del motor del laboratorio πPT (ensamblado/laboratorio_ppt/motor.js).
 *
 * Por qué existe: el laboratorio original topaba las π en 0,96 y daba V = 1554,9
 * en las tiendas, donde el capítulo 6 dice 53; su «Brewer» no convergía y las
 * dos formas de la varianza diferían un 8,5 % bajo el rótulo «exactamente»; y
 * su «✓ Verificado» era texto fijo (revisión del 4 nov, ES-1 a ES-5). Esto
 * comprueba, con cuentas y no con rótulos:
 *
 *   1. Las cifras del curso: tiendas con n = 2 (π = 1/6, 1/3, 1/2, 1; HT de
 *      311, 305 y 293; V = 53), Hansen–Hurwitz 7124, MAS con reemplazo 77 244
 *      y la diferencia de Raj 70 120 (cap. 6, M2, M4 y M5); classes con n = 5
 *      y m = 4, peso 32,35 (M9).
 *   2. Las identidades del diseño en los seis escenarios, cada n y cada
 *      esquema, y en 300 poblaciones al azar (con inclusión forzosa a menudo).
 *   3. Máxima entropía cumple Yates–Grundy (π_kπ_l > π_kl) en todas.
 *   4. El sistemático con la lista barajada, reducido a órdenes circulares,
 *      coincide con el promedio sobre todas las permutaciones.
 *   5. Las réplicas sortean con el algoritmo real y reproducen P(s).
 *   6. Dos etapas: la ec. 6.27 coincide con la ley de la varianza total
 *      calculada sobre las muestras, y m > M_i rompe la autoponderación.
 *   7. Las validaciones dicen que no a lo que no tiene sentido.
 *   8. Cada reto sale del motor y trae las cifras del curso.
 *   9. Cuentas hechas por fuera del motor (auditoría de la Fase 4, CO-4):
 *      V̂_WR a mano, deff·V_MAS = V, la cobertura exacta del reto, semillas
 *      distintas, y dos etapas por fuerza bruta (enumerando también los
 *      estudiantes), con una clase forzosa como estrato que se censa.
 *
 *     node precalculo/pruebas/prueba_laboratorio_ppt.js
 */
'use strict';
const path = require('path');
const raiz = path.resolve(__dirname, '..', '..');
const M = require(path.join(raiz, 'ensamblado', 'laboratorio_ppt', 'motor.js'));
const E = require(path.join(raiz, 'ensamblado', 'laboratorio_ppt', 'escenarios.json'));

let fallos = 0;
let pruebas = 0;
function comprueba(nombre, condicion, detalle = '') {
  pruebas++;
  if (!condicion) { fallos++; console.log(`  ✗ ${nombre}${detalle ? ' — ' + detalle : ''}`); }
}
const cerca = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));

// ------------------------------------------------------------------ 1. curso
console.log('1. Cifras del curso');
const tiendas = E.una_etapa.find(e => e.clave === 'tiendas');
for (const esquema of M.ESQUEMAS) {
  const a = M.analiza(tiendas.unidades, 2, esquema);
  comprueba(`tiendas ${esquema}: π`, [1 / 6, 1 / 3, 1 / 2, 1].every((v, k) => cerca(a.pi[k], v)), a.pi.join(' '));
  comprueba(`tiendas ${esquema}: D de inclusión forzosa`, a.forzosa[3] && !a.forzosa.slice(0, 3).some(Boolean));
  comprueba(`tiendas ${esquema}: V = 53`, cerca(a.V, 53), String(a.V));
  comprueba(`tiendas ${esquema}: t̂ = 311, 305, 293`, a.muestras.map(m => Math.round(m.t * 1e9) / 1e9).join() === '311,305,293');
}
const t2 = M.analiza(tiendas.unidades, 2, 'maxima_entropia').referencias;
comprueba('tiendas: V_HH = 7124', cerca(t2.vHH, 7124), String(t2.vHH));
comprueba('tiendas: V_MRAS = 77 244', cerca(t2.vMRAS, 77244), String(t2.vMRAS));
comprueba('tiendas: Cov(x, y²/x) = 8765', cerca(t2.covRaj, 8765), String(t2.covRaj));
comprueba('tiendas: Raj, V_MRAS − V_HH = 70 120', cerca(t2.rajDiferencia, 70120) && cerca(t2.vMRAS - t2.vHH, t2.rajDiferencia));

const D = E.dos_etapas;
const yClases = M.poblacionClases(D.M, D.rho, D.semilla);
const clases = M.analizaDosEtapas(D.M, yClases, 5, 4, 'maxima_entropia');
comprueba('classes: K = 647', clases.K === 647);
comprueba('classes: autoponderado con peso 32,35', clases.autoponderado && cerca(clases.pesoComun, 32.35), String(clases.pesoComun));
comprueba('classes: π_i = 5·M_i/647', clases.pi.every((v, i) => cerca(v, 5 * D.M[i] / 647)));

// ------------------------------------------------------ 2. y 3. identidades
console.log('2. Identidades del diseño, y 3. Yates–Grundy en máxima entropía');
function revisa(unidades, n, esquema, etiqueta) {
  const a = M.analiza(unidades, n, esquema);
  if (a.errores.length) { comprueba(`${etiqueta}: válida`, false, a.errores.join(' ')); return null; }
  for (const v of a.verificaciones) comprueba(`${etiqueta}: ${v.nombre}`, v.ok, `error ${v.error}`);
  if (esquema === 'maxima_entropia') {
    comprueba(`${etiqueta}: máxima entropía sin pares que incumplan Yates–Grundy`, a.paresYG.length === 0);
    // Con un solo cupo sorteado (n = 1, o n − 1 forzosas) ningún par sale junto.
    const sorteadas = n - a.forzosa.filter(Boolean).length;
    if (sorteadas >= 2) comprueba(`${etiqueta}: máxima entropía con todas las π_kl > 0`, a.paresCero.length === 0);
    comprueba(`${etiqueta}: máxima entropía sin v̂_SYG negativas`, a.pNegativa === 0);
  }
  return a;
}
let casos = 0;
for (const e of E.una_etapa) {
  for (let n = 1; n < e.unidades.length; n++) {
    for (const esquema of M.ESQUEMAS) { revisa(e.unidades, n, esquema, `${e.clave} n=${n} ${esquema}`); casos++; }
  }
}
const azar = M.generador(20261104);
for (let c = 0; c < 300; c++) {
  const N = 3 + Math.floor(azar() * 7);          // 3 a 9
  const n = 1 + Math.floor(azar() * (N - 1));
  const unidades = Array.from({ length: N }, (_, k) => ({
    id: `U${k + 1}`,
    // una de cada tres poblaciones con una unidad enorme: inclusión forzosa
    x: (c % 3 === 0 && k === 0 ? 40 : 1) * Math.round(1 + azar() * 99),
    y: Math.round(azar() * 500),
  }));
  for (const esquema of M.ESQUEMAS) { revisa(unidades, n, esquema, `azar ${c} N=${N} n=${n} ${esquema}`); casos++; }
}
console.log(`   ${casos} diseños revisados`);

// La regla de la pestaña 1 (todas las unidades, forzosas incluidas, en el orden
// de la tabla) da la misma distribución que el sistemático de lista fija.
for (const e of E.una_etapa) {
  for (let n = 1; n < e.unidades.length; n++) {
    const a = M.analiza(e.unidades, n, 'sistematico_fijo');
    const deRegla = new Map();
    for (const t of M.tramosRegla(a.pi, n)) {
      const clave = t.s.slice().sort((x, y) => x - y).join(',');
      deRegla.set(clave, (deRegla.get(clave) || 0) + t.hasta - t.desde);
      comprueba(`${e.clave} n=${n}: cada tramo de la regla da n unidades distintas`, new Set(t.s).size === n);
    }
    const dif = Math.max(...a.muestras.map(m => Math.abs((deRegla.get(m.s.join(',')) || 0) - m.p)));
    comprueba(`${e.clave} n=${n}: la regla = sistemático de lista fija`, dif < 1e-9 && deRegla.size === a.muestras.length, `dif ${dif}`);
  }
}
const reglaT = M.tramosRegla(M.analiza(tiendas.unidades, 2, 'sistematico_fijo').pi, 2);
comprueba('tiendas: u ∈ [1/6, 1/2) da {B, D}', reglaT.some(t => cerca(t.desde, 1 / 6) && cerca(t.hasta, 1 / 2) && t.s.join() === '1,3'));
comprueba('tiendas: u = 0,4 da {B, D} (cap. 6, M5)', M.muestraRegla([1 / 6, 1 / 3, 1 / 2, 1], 2, 0.4).join() === '1,3');

// El sistemático de lista fija sí deja pares fuera (por eso existe la opción barajada).
const muni = E.una_etapa.find(e => e.clave === 'barrios');
const fijo = M.analiza(muni.unidades, 3, 'sistematico_fijo');
comprueba('barrios n=3 sistemático fijo: hay pares con π_kl = 0', fijo.paresCero.length > 0, String(fijo.paresCero.length));
comprueba('barrios n=3 sistemático fijo: hay pares que incumplen Yates–Grundy', fijo.paresYG.length > 0, String(fijo.paresYG.length));
comprueba('barrios n=3 sistemático fijo: V̂_SYG negativa con probabilidad positiva', fijo.pNegativa > 0, String(fijo.pNegativa));

// ------------------------------------------- 4. órdenes circulares = todas
console.log('4. Sistemático barajado: órdenes circulares frente a todas las permutaciones');
function permutaciones(lista) {
  if (lista.length <= 1) return [lista.slice()];
  const salida = [];
  lista.forEach((v, i) => {
    for (const p of permutaciones(lista.filter((_, j) => j !== i))) salida.push([v, ...p]);
  });
  return salida;
}
for (const e of E.una_etapa.filter(e => e.unidades.length <= 7)) {
  for (let n = 1; n < e.unidades.length; n++) {
    const inc = M.probabilidadesInclusion(e.unidades.map(u => u.x), n);
    const resto = inc.pi.map((_, k) => k).filter(k => !inc.forzosa[k]);
    const r = n - (e.unidades.length - resto.length);
    if (r === 0) continue;
    const todas = permutaciones(resto);
    const acum = new Map();
    for (const orden of todas) {
      for (const [clave, p] of M.sistematicoOrden(inc.pi, orden, r)) acum.set(clave, (acum.get(clave) || 0) + p / todas.length);
    }
    const reducido = new Map();
    const ordenes = M.ordenesCirculares(resto);
    for (const orden of ordenes) {
      for (const [clave, p] of M.sistematicoOrden(inc.pi, orden, r)) reducido.set(clave, (reducido.get(clave) || 0) + p / ordenes.length);
    }
    const claves = new Set([...acum.keys(), ...reducido.keys()]);
    const dif = Math.max(...[...claves].map(c => Math.abs((acum.get(c) || 0) - (reducido.get(c) || 0))));
    comprueba(`${e.clave} n=${n}: ${ordenes.length} órdenes = ${todas.length} permutaciones`, dif < 1e-12, `dif ${dif}`);
  }
}

// --------------------------------------------------------------- 5. réplicas
console.log('5. Réplicas con el algoritmo real');
for (const e of E.una_etapa) {
  for (const esquema of M.ESQUEMAS) {
    const a = M.analiza(e.unidades, e.n, esquema);
    const r = M.replicas(a, 20000, 2026);
    comprueba(`${e.clave} ${esquema}: ninguna muestra fuera del soporte`, r.muestrasFueraDelSoporte === 0);
    comprueba(`${e.clave} ${esquema}: frecuencias ≈ P(s)`, r.apartamientoMaximo < 4.5, `z máx ${r.apartamientoMaximo.toFixed(2)}`);
    comprueba(`${e.clave} ${esquema}: media ≈ t`, Math.abs(r.diseno.sesgo) <= 4.5 * r.diseno.eeMedia + 1e-9, `${r.diseno.sesgo} frente a ${r.diseno.eeMedia}`);
    comprueba(`${e.clave} ${esquema}: ee simulado ≈ √V`, Math.abs(r.diseno.ee - a.ee) <= 0.05 * a.ee + 1e-9, `${r.diseno.ee} frente a ${a.ee}`);
    const otra = M.replicas(a, 500, 2026);
    const igual = M.replicas(a, 500, 2026);
    comprueba(`${e.clave} ${esquema}: la semilla repite las réplicas`, otra.valores.join() === igual.valores.join());
  }
}

// ------------------------------------------------------------ 6. dos etapas
console.log('6. Dos etapas');
for (const esquema of ['maxima_entropia', 'sistematico_fijo']) {
  for (const [n, m] of [[5, 4], [3, 10], [7, 2]]) {
    const d = M.analizaDosEtapas(D.M, yClases, n, m, esquema);
    // La ley de la varianza total, sobre las muestras de la primera etapa.
    const inc = M.probabilidadesInclusion(D.M, n);
    const muestras = M.distribucion(inc.pi, inc.forzosa, n, esquema);
    let dentro = 0;
    let entre = 0;
    for (const { s, p } of muestras) {
      dentro += p * M.suma(s.map(i => d.filas[i].Vi / d.pi[i] ** 2));
      entre += p * (M.suma(s.map(i => d.filas[i].ti / d.pi[i])) - d.t) ** 2;
    }
    comprueba(`classes ${esquema} n=${n} m=${m}: 6.27 = varianza total`, cerca(d.V, dentro + entre, 1e-10), `${d.V} frente a ${dentro + entre}`);
    comprueba(`classes ${esquema} n=${n} m=${m}: etapa 1 = Var(E(t̂|s))`, cerca(d.V1, entre, 1e-10));
    const forzosas = d.forzosa.some(Boolean);
    comprueba(`classes ${esquema} n=${n} m=${m}: autoponderado`, d.autoponderado === (m <= Math.min(...D.M) && !forzosas));
  }
}
const grande = M.analizaDosEtapas(D.M, yClases, 5, 20, 'maxima_entropia');
comprueba('classes m = 20 > 15 (clase 15): deja de ser autoponderado', !grande.autoponderado && grande.motivos.includes('clases_menores_que_m'));
const siete = M.analizaDosEtapas(D.M, yClases, 7, 2, 'maxima_entropia');
comprueba('classes n = 7: la clase de 100 es forzosa y rompe la autoponderación', siete.forzosa[13] && !siete.autoponderado && siete.motivos.includes('forzosas'));
const r0 = M.anova(M.poblacionClases(D.M, 0, 7)).Ra2;
const r6 = M.anova(M.poblacionClases(D.M, 0.6, 7)).Ra2;
comprueba('classes: la R_a² sube con la ρ pedida', r6 > r0 + 0.3, `${r0} → ${r6}`);
const costo = M.costoOptimo(100, 4, 0.2, 8000);
comprueba('m_opt = √(c₁(1 − ρ)/(c₂ρ))', cerca(costo.mOpt, Math.sqrt(100 * 0.8 / (4 * 0.2))));
comprueba('n* = C/(c₁ + c₂m*)', cerca(costo.nOpt, 8000 / (100 + 4 * costo.mOpt)));
comprueba('m_opt sin óptimo finito con ρ ≤ 0', M.costoOptimo(100, 4, 0, 8000).mOpt === Infinity);

// ------------------------------------------------------------ 7. validación
console.log('7. Validaciones');
const base = tiendas.unidades;
comprueba('x = 0 se rechaza', M.analiza(base.map((u, k) => (k ? u : { ...u, x: 0 })), 2, 'maxima_entropia').errores.length > 0);
comprueba('y < 0 se rechaza', M.analiza(base.map((u, k) => (k ? u : { ...u, y: -5 })), 2, 'maxima_entropia').errores.length > 0);
comprueba('y vacía (NaN) se rechaza', M.analiza(base.map((u, k) => (k ? u : { ...u, y: NaN })), 2, 'maxima_entropia').errores.length > 0);
comprueba('n = N se rechaza', M.analiza(base, 4, 'maxima_entropia').errores.length > 0);
comprueba('N = 10 se rechaza', M.validaPoblacion(Array.from({ length: 10 }, () => ({ x: 1, y: 1 })), 3).length > 0);
const at = M.analiza(base, 2, 'maxima_entropia');
comprueba('una muestra de 1 unidad con n = 2 se rechaza', !!M.evaluaMuestra(at, [3]).error);
comprueba('{A, B} se rechaza: sin D, P(s) = 0', !!M.evaluaMuestra(at, [0, 1]).error);
comprueba('{B, D} se acepta con t̂ = 305', cerca(M.evaluaMuestra(at, [1, 3]).t, 305));
const constante = M.analiza(base.map(u => ({ ...u, y: 50 })), 2, 'maxima_entropia');
comprueba('y constante: el MAS acierta siempre y el deff no existe', constante.deff === null && constante.referencias.vMAS === 0);
const desplazada = M.analiza(M.desplazaY(base, 100), 2, 'maxima_entropia');
comprueba('desplazar y no cambia la correlación', cerca(desplazada.referencias.corr, at.referencias.corr, 1e-12));
comprueba('desplazar y lejos del origen hace perder al πPT', desplazada.V > at.V);

// ---------------------------------------------------------------- 8. retos
console.log('8. Retos: cada respuesta sale del motor y trae las cifras del curso');
const Retos = require(path.join(raiz, 'ensamblado', 'laboratorio_ppt', 'retos.js'));
const retos = Retos.crea(M, E);
const texto = (id) => retos.find(r => r.id === id).respuesta().replace(/<[^>]+>/g, '');
for (const r of retos) {
  const t = r.respuesta();
  comprueba(`reto ${r.id}: sin NaN, undefined ni guiones de cifra ausente`, !/NaN|undefined|Infinity|—/.test(t), t.slice(0, 80));
}
comprueba('reto regla-bd: 1/6, 1/2 y 1/3', /0,1667 \(1\/6\).*0,5000 \(1\/2\).*0,3333 = 1\/3/.test(texto('regla-bd')));
comprueba('reto psi-pi: 1 − 0,375² = 0,8594 frente a π_D = 1', texto('psi-pi').includes('1 − 0,375² = 0,8594') && texto('psi-pi').includes('πD = 1'));
comprueba('reto ia-tiendas: V = 53', texto('ia-tiendas').includes('V = 53'));
comprueba('reto raj-tiendas: 8765, 70 120, 77 244 y 7124', ['8765', '70 120', '77 244', '7124'].every(c => texto('raj-tiendas').includes(c)));
comprueba('reto recta-lejos: pierde y luego gana', /pierde/.test(texto('recta-lejos')) && /baja a 0,0/.test(texto('recta-lejos')));
comprueba('reto pares-cero: 4 pares en cero (como UPsystematicpi2 en R)', texto('pares-cero').startsWith('Dato 4 pares'));
comprueba('reto facturas-yg: L5–L6 incumple y sigue insesgada', /L5–L6 incumple/.test(texto('facturas-yg')) && /Sigue siendo insesgada/.test(texto('facturas-yg')));
comprueba('reto con-reemplazo: el exceso está en la etapa 1', /todo el exceso está en la etapa 1/.test(texto('con-reemplazo')));
comprueba('reto peso-3235: 32,35', texto('peso-3235').includes('32,35 = 647/20'));
comprueba('reto n7-forzosa: 1,082, 45,58 y 50,00', ['1,082', '45,58', '50,00'].every(c => texto('n7-forzosa').includes(c)));
comprueba('formato: 14 248, 2000, 0,05 y −3,14', Retos.numero(14248) === '14 248' && Retos.numero(2000) === '2000' &&
  Retos.numero(0.05, 2) === '0,05' && Retos.numero(-3.14159, 2) === '−3,14' && Retos.numero(-0.0001, 2) === '0,00');

// Las cifras que la plantilla escribe a mano (en los «Predice» y las lecturas)
// salen del motor; si cambia un escenario, esto avisa.
{
  const fs = require('fs');
  const plantilla = fs.readFileSync(path.join(raiz, 'ensamblado', 'laboratorio_ppt', 'laboratorio.html'), 'utf8');
  const g = (clave) => E.una_etapa.find(e => e.clave === clave).unidades;
  const f1 = (v) => v.toFixed(1).replace('.', ',');
  const sedes = M.ESQUEMAS.map(d => M.analiza(g('recta_lejos'), 3, d).deff);
  const barrios = M.ESQUEMAS.map(d => M.analiza(g('barrios'), 3, d).V);
  const citas = [
    [`deff de ${f1(sedes[2])} en el de máxima entropía (${f1(sedes[0])} y ${f1(sedes[1])}`, 'Sedes n=3: deff por diseño'],
    [`V vale ${f1(barrios[0])} con la lista fija y ${f1(barrios[2])} con máxima entropía`, 'Barrios n=3: V por diseño'],
    [`Sí: ${M.analiza(g('barrios'), 3, 'sistematico_fijo').paresCero.length} pares.`, 'Barrios n=3: pares en cero'],
    [`La etapa 2: ${Math.round(100 * clases.parte2)} % frente a ${Math.round(100 * clases.parte1)} %.`, 'clases n=5 m=4: reparto por etapas'],
  ];
  for (const [cita, nombre] of citas) comprueba(`plantilla, ${nombre}: «${cita}»`, plantilla.replace(/\s+/g, ' ').includes(cita));
  // La tarjeta de la portada escribe a mano cuántas pestañas y retos hay;
  // cuenta_sitio.py no la coteja porque el laboratorio no tiene módulos.
  const portada = fs.readFileSync(path.join(raiz, 'sitio', 'muestreo', 'index.html'), 'utf8');
  const pestanas = (plantilla.match(/role="tab"/g) || []).length;
  comprueba(`portada: «${pestanas} pestañas»`, portada.includes(`${pestanas} pestañas`));
  comprueba(`portada: «${retos.length} retos con respuesta»`, portada.includes(`${retos.length} retos con respuesta`));
  for (let p = 1; p <= pestanas; p++) comprueba(`pestaña ${p}: tiene retos`, retos.some(r => r.pestana === p));
}

// ------------------------------------------------- 9. cuentas hechas a mano
// Lo que la auditoría (CO-4) pidió comprobar por otra vía que la del motor.
console.log('9. Cuentas a mano, por fuera del motor');
const fmt = (v, d) => v.toFixed(d).replace('.', ',');
// (a) Semillas distintas dan réplicas distintas.
{
  const a = M.analiza(muni.unidades, 3, 'maxima_entropia');
  comprueba('semillas 2026 y 2027 dan réplicas distintas', M.replicas(a, 500, 2026).valores.join() !== M.replicas(a, 500, 2027).valores.join());
}
// (b) V̂_WR de una muestra, con la fórmula de Lohr 6.24 sobre las no forzosas.
for (const e of E.una_etapa) {
  for (let n = 2; n < e.unidades.length; n++) {
    const a = M.analiza(e.unidades, n, 'maxima_entropia');
    for (const m of a.muestras.slice(0, 3)) {
      const libres = m.s.filter(k => !a.forzosa[k]);
      if (libres.length < 2) { comprueba(`${e.clave} n=${n}: V̂_WR sin dos libres no existe`, m.vWR === null); continue; }
      const z = libres.map(k => a.y[k] / a.pi[k]);
      const r = z.length;
      const zm = z.reduce((p, v) => p + v, 0) / r;
      const aMano = r / (r - 1) * z.reduce((p, v) => p + (v - zm) ** 2, 0);
      comprueba(`${e.clave} n=${n} {${m.s}}: V̂_WR a mano`, cerca(m.vWR, aMano, 1e-12), `${m.vWR} frente a ${aMano}`);
    }
  }
}
// (c) deff · V_MAS = V, en una etapa.
for (const e of E.una_etapa) {
  const a = M.analiza(e.unidades, e.n, 'maxima_entropia');
  if (a.deff !== null) comprueba(`${e.clave}: deff · V_MAS = V`, cerca(a.deff * a.referencias.vMAS, a.V, 1e-12));
}
// (d) La cobertura exacta del reto, con t̂ y V̂_SYG calculados aquí.
{
  const h = E.una_etapa.find(e => e.clave === 'hospitales');
  const a = M.analiza(h.unidades, 3, 'maxima_entropia');
  const t = a.y.reduce((p, v) => p + v, 0);
  let cubre = 0;
  for (const m of a.muestras) {
    const z = m.s.map(k => a.y[k] / a.pi[k]);
    const that = z.reduce((p, v) => p + v, 0);
    let v = 0;
    for (let i = 0; i < m.s.length; i++) {
      for (let j = i + 1; j < m.s.length; j++) {
        const k = m.s[i], l = m.s[j];
        v += (a.pi[k] * a.pi[l] - a.pikl[k][l]) / a.pikl[k][l] * (z[i] - z[j]) ** 2;
      }
    }
    if (v >= 0 && Math.abs(that - t) <= 1.96 * Math.sqrt(v)) cubre += m.p;
  }
  comprueba('reto cobertura: la exacta coincide con una cuenta aparte', texto('cobertura').includes(`Cubre el ${Retos.pct(cubre)}`) && Retos.pct(cubre).startsWith(fmt(100 * cubre, 1)), fmt(100 * cubre, 1));
}
// (e) Dos etapas por fuerza bruta: se enumeran también las muestras de
// estudiantes. E(t̂) = t, V(t̂) = V1 + V2 (6.27) y E(V̂_WR) = eWR, con las
// clases forzosas como un estrato que se censa (aportan su V̂_i insesgado).
{
  const Mp = [2, 3, 3, 4, 10];
  const yp = M.poblacionClases(Mp, 0.3, 11);
  const tP = yp.flat().reduce((p, v) => p + v, 0);
  for (const [n, m] of [[2, 2], [3, 2], [2, 3]]) {
    for (const esquema of ['maxima_entropia', 'sistematico_fijo']) {
      const d = M.analizaDosEtapas(Mp, yp, n, m, esquema);
      const inc = M.probabilidadesInclusion(Mp, n);
      const muestras = M.distribucion(inc.pi, inc.forzosa, n, esquema);
      let Et = 0, Et2 = 0, Ev = 0, hayV = true;
      for (const { s, p } of muestras) {
        // las muestras de estudiantes de cada clase sorteada, equiprobables
        const opciones = s.map(i => {
          const mi = Math.min(m, Mp[i]);
          return M.combinaciones(Array.from({ length: Mp[i] }, (_, j) => j), mi).map(c => {
            const v = c.map(j => yp[i][j]);
            const media = v.reduce((q, w) => q + w, 0) / mi;
            const s2 = mi > 1 ? v.reduce((q, w) => q + (w - media) ** 2, 0) / (mi - 1) : 0;
            return { ti: Mp[i] * media, Vi: Mp[i] ** 2 * (1 - mi / Mp[i]) * s2 / mi };
          });
        });
        const libres = s.map((i, j) => [i, j]).filter(([i]) => !inc.forzosa[i]);
        if (libres.length < 2) hayV = false;
        const total = opciones.reduce((q, o) => q * o.length, 1);
        const idx = new Array(s.length).fill(0);
        for (let c = 0; c < total; c++) {
          const ele = idx.map((v, j) => opciones[j][v]);
          const z = ele.map((e, j) => e.ti / inc.pi[s[j]]);
          const that = z.reduce((q, v) => q + v, 0);
          const pc = p / total;
          Et += pc * that;
          Et2 += pc * that * that;
          if (libres.length >= 2) {
            const zl = libres.map(([, j]) => z[j]);
            const r = zl.length;
            const zm = zl.reduce((q, v) => q + v, 0) / r;
            let v = r / (r - 1) * zl.reduce((q, w) => q + (w - zm) ** 2, 0);
            s.forEach((i, j) => { if (inc.forzosa[i]) v += ele[j].Vi; });
            Ev += pc * v;
          }
          for (let j = 0; j < s.length; j++) { if (++idx[j] < opciones[j].length) break; idx[j] = 0; }
        }
      }
      const etiqueta = `dos etapas M=${Mp} n=${n} m=${m} ${esquema}`;
      comprueba(`${etiqueta}: E(t̂) = t`, cerca(Et, tP, 1e-10), `${Et} frente a ${tP}`);
      comprueba(`${etiqueta}: V por fuerza bruta = V1 + V2`, cerca(Et2 - Et * Et, d.V, 1e-8), `${Et2 - Et * Et} frente a ${d.V}`);
      if (hayV) comprueba(`${etiqueta}: E(V̂_WR) = eWR${inc.forzosa.some(Boolean) ? ' (con la forzosa aparte)' : ''}`, cerca(Ev, d.eWR, 1e-9), `${Ev} frente a ${d.eWR}`);
      else comprueba(`${etiqueta}: sin dos clases libres, eWR no existe`, d.eWR === null);
    }
  }
  comprueba('dos etapas M=2,3,3,4,10 n=3: la clase de 10 es forzosa', M.probabilidadesInclusion(Mp, 3).forzosa[4]);
}

console.log(`\n${pruebas - fallos}/${pruebas} comprobaciones bien${fallos ? `, ${fallos} FALLAN` : ''}.`);
process.exit(fallos ? 1 : 0);
