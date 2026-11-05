/* retos.js — los retos del laboratorio πPT y el formato de las cifras.
 *
 * Cada respuesta la calcula el motor en el momento, sobre el escenario, el n y
 * el diseño que nombra la pregunta: no hay cifras escritas a mano que puedan
 * quedar desfasadas. La prueba (precalculo/pruebas/prueba_laboratorio_ppt.js)
 * evalúa todas y busca en ellas las cifras del curso (1/3, 0,8594, 53, 70 120,
 * 32,35). La auditoría de T7.121 pidió que cada pregunta diga de qué diseño
 * dependen sus cifras y que la notación sea la del curso (V̂, n_opt).
 */
(function (raiz) {
  'use strict';

  // Cifras como las escribe el curso: coma decimal, y espacio de miles solo
  // desde cinco cifras (2000, 14 248; T7.110). El espacio es duro para que
  // «14 248» no se parta al final de una línea.
  function numero(v, dec = 0) {
    if (v === null || v === undefined || !Number.isFinite(v)) return '—';
    const neg = v < 0 && Math.abs(v) >= 0.5 * 10 ** -dec;
    const [ent, frac] = Math.abs(v).toFixed(dec).split('.');
    const grupos = ent.length > 4 ? ent.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : ent;
    return (neg ? '−' : '') + grupos + (frac ? ',' + frac : '');
  }
  const pct = (v, dec = 1) => (v === null || !Number.isFinite(v) ? '—' : numero(100 * v, dec) + ' %');
  const lista = (ids) => ids.length <= 1 ? ids.join('') : ids.slice(0, -1).join(', ') + ' y ' + ids[ids.length - 1];
  const V = (s) => `V̂<sub>${s}</sub>`;

  function crea(Motor, ESC) {
    const esc = (clave) => ESC.una_etapa.find(e => e.clave === clave);
    const D = ESC.dos_etapas;
    const clases = (rho) => Motor.poblacionClases(D.M, rho, D.semilla);

    return [
      // ------------------------------------------------------------ pestaña 1
      {
        id: 'regla-bd', pestana: 1,
        pregunta: 'Tiendas, n = 2: ¿qué valores de u dan la muestra {B, D}? ¿Con qué probabilidad sale esa muestra?',
        respuesta() {
          const a = Motor.analiza(esc('tiendas').unidades, 2, 'sistematico_fijo');
          const t = Motor.tramosRegla(a.pi, 2).find(tr => tr.s.join() === '1,3');
          return `<span class="marca dato">Dato</span> Los u entre ${numero(t.desde, 4)} (1/6) y ${numero(t.hasta, 4)} (1/2): ` +
            `ahí empieza el tramo de B, y u + 1 cae en el de D. La probabilidad es el largo de ese tramo, ` +
            `${numero(t.hasta - t.desde, 4)} = 1/3, que es justamente π<sub>B</sub> (cap. 6, M5).`;
        },
      },
      {
        id: 'psi-pi', pestana: 1,
        pregunta: 'Tiendas, n = 2: si se sortea con reemplazo (dos extracciones con ψ), ¿con qué probabilidad sale D al menos una vez? ¿Y con el πPT?',
        respuesta() {
          const a = Motor.analiza(esc('tiendas').unidades, 2, 'sistematico_fijo');
          const psiD = a.psi[3];
          return `<span class="marca dato">Dato</span> Con reemplazo, 1 − (1 − ψ<sub>D</sub>)² = 1 − ${numero(1 - psiD, 3)}² = ${numero(1 - (1 - psiD) ** 2, 4)}; ` +
            `con el πPT, π<sub>D</sub> = ${numero(a.pi[3], 0)}. <span class="marca lectura">Lectura</span> Con reemplazo, D falta en ` +
            `${pct((1 - psiD) ** 2)} de las muestras y sale repetida en otras; n·ψ<sub>D</sub> = ${numero(2 * psiD, 2)} no es la probabilidad ` +
            `de ninguna de las dos cosas (cap. 6, M4).`;
        },
      },
      {
        id: 'ia-tiendas', pestana: 1,
        pregunta: 'Con IA: pídele a un asistente el código R de un πPT sistemático con las tiendas y n = 2, y compruébalo con este laboratorio. ¿Le da π<sub>D</sub> = 1 y V = 53? ¿Qué pasa si el código calcula π<sub>k</sub> = 2x<sub>k</sub>/1600 sin más?',
        respuesta() {
          const a = Motor.analiza(esc('tiendas').unidades, 2, 'sistematico_fijo');
          return `<span class="marca dato">Dato</span> Con la inclusión forzosa, π<sub>D</sub> = ${numero(a.pi[3], 0)} y V = ${numero(a.V, 0)}. ` +
            `Un código que no la trata da π<sub>D</sub> = 2·1000/1600 = ${numero(1.25, 2)}, que no es una probabilidad, ` +
            `y <code>UPsystematic</code> con esas π no da error: devuelve un vector con un 1,25 donde debería haber un 1. ` +
            `Si después se filtra con <code>s == 1</code>, D no entra nunca, y el total olvida la tienda que pesa más. ` +
            `<span class="marca opinion">Opinión del material</span> Como en el resto del curso, el código de un asistente se declara ` +
            `y se verifica antes de usarlo. Aquí bastan tres comprobaciones: que las π sumen n sin pasar de 1, que D esté en todas las ` +
            `muestras y que los t̂ posibles sean 311, 305 y 293.`;
        },
      },

      // ------------------------------------------------------------ pestaña 2
      {
        id: 'raj-tiendas', pestana: 2,
        pregunta: 'Tiendas, n = 2: ¿cuánto vale Cov(x, y²/x) y qué dice el criterio de Raj?',
        respuesta() {
          const r = Motor.analiza(esc('tiendas').unidades, 2, 'maxima_entropia').referencias;
          return `<span class="marca dato">Dato</span> Cov(x, y²/x) = ${numero(r.covRaj, 0)}, con divisor N. Es positiva: el PPT con reemplazo gana. ` +
            `La diferencia es (16/2)·${numero(r.covRaj, 0)} = ${numero(r.rajDiferencia, 0)}, ` +
            `justo ${numero(r.vMRAS, 0)} (MAS con reemplazo) menos ${numero(r.vHH, 0)} (Hansen–Hurwitz), como en el M5 del cap. 6.`;
        },
      },
      {
        id: 'y-constante', pestana: 2,
        pregunta: 'Barrios, n = 3, máxima entropía: pulsa «y constante». ¿Qué le pasa al MAS? ¿Y al deff?',
        respuesta() {
          const e = esc('barrios');
          const media = Motor.suma(e.unidades.map(u => u.y)) / e.unidades.length;
          const a = Motor.analiza(e.unidades.map(u => ({ ...u, y: media })), 3, 'maxima_entropia');
          return `<span class="marca dato">Dato</span> Con todas las y iguales, el MAS acierta siempre: V<sub>MAS</sub> = ${numero(a.referencias.vMAS, 0)}, ` +
            `y el deff no existe (no se puede dividir por cero). El πPT, en cambio, deja V = ${numero(a.V, 0)}. ` +
            `<span class="marca lectura">Lectura</span> Los cocientes y<sub>k</sub>/π<sub>k</sub> son distintos porque las π lo son: ` +
            `el πPT reparte el esfuerzo según x, y aquí x no dice nada de y.`;
        },
      },
      {
        id: 'recta-lejos', pestana: 2,
        pregunta: 'Sedes, n = 3, máxima entropía: la correlación entre x e y es casi 1. ¿Gana el πPT? ¿Y si se lleva la recta al origen?',
        respuesta() {
          const e = esc('recta_lejos');
          const a = Motor.analiza(e.unidades, e.n, 'maxima_entropia');
          const b = Motor.analiza(Motor.desplazaY(e.unidades, -a.rectaLibres.corte), e.n, 'maxima_entropia');
          return `<span class="marca dato">Dato</span> Con correlación ${numero(a.referencias.corr, 3)}, el deff es ${numero(a.deff, 2)}: ` +
            `el πPT ${a.deff > 1 ? 'pierde' : 'gana'}. La recta corta el eje en ${numero(a.rectaLibres.corte, 1)}. ` +
            `Con «Llevar la recta al origen» la correlación sigue en ${numero(b.referencias.corr, 3)} y el deff baja a ${numero(b.deff, 3)}. ` +
            `<span class="marca lectura">Lectura</span> La correlación no basta: hace falta que y sea casi proporcional a x, y aquí la ` +
            `factura tiene una parte fija grande (cap. 6, M5).`;
        },
      },

      // ------------------------------------------------------------ pestaña 3
      {
        id: 'pares-cero', pestana: 3,
        pregunta: 'Barrios, n = 3, sistemático con la lista fija: ¿cuántos pares nunca salen juntos? ¿Qué les pasa a las varianzas estimadas?',
        respuesta() {
          const a = Motor.analiza(esc('barrios').unidades, 3, 'sistematico_fijo');
          const b = Motor.analiza(esc('barrios').unidades, 3, 'sistematico_aleatorio');
          const negativas = a.muestras.filter(m => m.vSYG < 0).length;
          return `<span class="marca dato">Dato</span> ${a.paresCero.length} pares tienen π<sub>kl</sub> = 0 y ${a.paresYG.length} incumplen Yates–Grundy. ` +
            `${V('SYG')} sale negativa en ${negativas} de las ${a.muestras.length} muestras posibles, con probabilidad ${pct(a.pNegativa)}, ` +
            `y promedia ${numero(a.esperanzas.vSYG, 1)} frente a una V de ${numero(a.V, 1)}: sesgada, porque nunca ve los pares que no salen juntos. ` +
            `Con la lista barajada hay ${b.paresCero.length} pares en cero, y en ese diseño E(${V('SYG')}) = V = ${numero(b.V, 1)}.`;
        },
      },
      {
        id: 'facturas-yg', pestana: 3,
        pregunta: 'Facturas, n = 2, sistemático con la lista barajada: ningún par queda en cero. ¿Puede salir negativa la varianza estimada SYG?',
        respuesta() {
          const a = Motor.analiza(esc('facturas').unidades, 2, 'sistematico_aleatorio');
          return `<span class="marca dato">Dato</span> Sí. ${a.paresCero.length ? `Hay ${a.paresCero.length} pares en cero` : 'Ningún par queda en cero'}, pero ${a.paresYG.length === 1 ? 'el par' : 'los pares'} ` +
            `${lista(a.paresYG.map(p => p.map(k => a.ids[k]).join('–')))} ${a.paresYG.length === 1 ? 'incumple' : 'incumplen'} Yates–Grundy, ` +
            `y ${V('SYG')} sale negativa con probabilidad ${pct(a.pNegativa)}. Sigue siendo insesgada: E(${V('SYG')}) = V = ${numero(a.V, 1)}. ` +
            `<span class="marca lectura">Lectura</span> π<sub>kl</sub> &gt; 0 da la insesgadez; π<sub>k</sub>π<sub>l</sub> ≥ π<sub>kl</sub> es lo que ` +
            `impide los valores negativos (cap. 6, M7).`;
        },
      },
      {
        id: 'cobertura', pestana: 3,
        pregunta: 'Hospitales, n = 3, máxima entropía: ¿cubre el intervalo t̂ ± 1,96·√V̂<sub>SYG</sub> el 95 % de las veces? Simula 20 000 réplicas con semilla 2026.',
        respuesta() {
          const e = esc('hospitales');
          const a = Motor.analiza(e.unidades, 3, 'maxima_entropia');
          const t = a.referencias.t;
          const exacta = Motor.suma(a.muestras.filter(m => m.vSYG >= 0 && Math.abs(m.t - t) <= 1.96 * Math.sqrt(m.vSYG)).map(m => m.p));
          const r = Motor.replicas(a, 20000, 2026);
          const fz = a.ids.filter((_, k) => a.forzosa[k]);
          return `<span class="marca dato">Dato</span> Cubre el ${pct(exacta)} de las veces, sumando las probabilidades de las muestras que lo ` +
            `consiguen; las 20 000 réplicas dan ${pct(r.coberturaSYG)}. <span class="marca lectura">Lectura</span> ${lista(fz)} es de inclusión ` +
            `forzosa (3·600/1800 = 1), así que solo se sortean 2 de los otros 5 y hay ${a.muestras.length} muestras posibles, no las 20 de C(6, 3). ` +
            `Con tan pocas, t̂ toma pocos valores y la aproximación normal que justifica el 1,96 no tiene de dónde salir: ` +
            `la cobertura nominal es una promesa para n grande.`;
        },
      },

      // ------------------------------------------------------------ pestaña 4
      {
        id: 'peso-3235', pestana: 4,
        pregunta: 'Clases, n = 5 y m = 4: ¿qué peso tiene cada estudiante de la muestra? ¿Por qué todos el mismo?',
        respuesta() {
          const d = Motor.analizaDosEtapas(D.M, clases(D.rho), 5, 4, 'maxima_entropia');
          return `<span class="marca dato">Dato</span> ${numero(d.pesoComun, 2)} = 647/20 (cap. 6, M9). ` +
            `La clase i sale con π<sub>i</sub> = 5M<sub>i</sub>/647, y dentro de ella cada estudiante con 4/M<sub>i</sub>: el M<sub>i</sub> se cancela ` +
            `y queda 20/647 para todos.`;
        },
      },
      {
        id: 'n7-forzosa', pestana: 4,
        pregunta: 'Clases, n = 7 y m = 2: ¿sigue siendo autoponderado?',
        respuesta() {
          const d = Motor.analizaDosEtapas(D.M, clases(D.rho), 7, 2, 'maxima_entropia');
          const pesos = d.filas.map(f => f.peso);
          const resto = 647 - 100;
          return `<span class="marca dato">Dato</span> No. La clase 14 tiene 100 estudiantes y 7·100/647 = ${numero(700 / 647, 3)} pasa de 1: ` +
            `es de inclusión forzosa, con π = 1 en lugar de 7M<sub>i</sub>/647, y la cancelación se rompe. ` +
            `Las otras 14 se reparten los 6 cupos que quedan sobre ${resto} estudiantes y pesan ${resto}/(6·2) = ${numero(Math.min(...pesos), 2)}; ` +
            `los de la clase 14 pesan 100/2 = ${numero(Math.max(...pesos), 2)}. ` +
            `<span class="marca lectura">Lectura</span> Para que pesaran igual, esa clase necesitaría 100·12/${resto} = ${numero(1200 / resto, 2)} ` +
            `estudiantes: ningún número entero lo logra.`;
        },
      },
      {
        id: 'rho-etapas', pestana: 4,
        pregunta: 'Clases, n = 5, m = 4, máxima entropía: sube la ρ pedida de 0,1 a 0,5. ¿Qué etapa gana peso en la varianza?',
        respuesta() {
          const baja = Motor.analizaDosEtapas(D.M, clases(0.1), 5, 4, 'maxima_entropia');
          const alta = Motor.analizaDosEtapas(D.M, clases(0.5), 5, 4, 'maxima_entropia');
          return `<span class="marca dato">Dato</span> La etapa 1 pasa del ${pct(baja.parte1)} al ${pct(alta.parte1)} de la varianza ` +
            `(R<sub>a</sub>² de los datos: ${numero(baja.anova.Ra2, 3)} y ${numero(alta.anova.Ra2, 3)}). ` +
            `<span class="marca lectura">Lectura</span> Con estudiantes de una misma clase parecidos, lo que más cuenta es qué clases salen.`;
        },
      },
      {
        id: 'con-reemplazo', pestana: 4,
        pregunta: 'Clases, n = 5, m = 4, máxima entropía: ¿cuánto sobrestima la varianza la aproximación con reemplazo (s<sub>z</sub>²/n, cap. 6, M9)? ¿De dónde sale el exceso?',
        respuesta() {
          const d = Motor.analizaDosEtapas(D.M, clases(D.rho), 5, 4, 'maxima_entropia');
          const exceso = d.eWR - d.V;
          return `<span class="marca dato">Dato</span> En promedio da ${numero(d.eWR, 0)} frente a una V de ${numero(d.V, 0)}: ` +
            `un ${pct(exceso / d.V)} de más. La parte de la etapa 2 sale exacta; todo el exceso está en la etapa 1: ` +
            `${numero(exceso, 0)} sobre V<sub>1</sub> = ${numero(d.V1, 0)}, un ${pct(exceso / d.V1)}. ` +
            `<span class="marca lectura">Lectura</span> Es casi exactamente lo que se pierde al ignorar el factor de corrección por población ` +
            `finita de la primera etapa: con 5 de 15 clases, 1/(1 − 5/15) − 1 = 50 %. Lohr (§6.4.1 y ej. 6.11) advierte que, con una ` +
            `fracción n/N grande, la aproximación con reemplazo puede sobrestimar.`;
        },
      },
    ];
  }

  const Retos = { crea, numero, pct, lista };
  if (typeof module !== 'undefined' && module.exports) module.exports = Retos;
  else raiz.Retos = Retos;
})(typeof window !== 'undefined' ? window : this);
