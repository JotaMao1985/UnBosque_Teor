    // ================================================================
    // Glosario de notación (v1, capítulo 2)
    //
    // GLOSARIOS['id'] = {titulo, nota, filas: [{concepto, aqui, lohr,
    // gutierrez, r}]} sobre un contenedor con data-glosario="id".
    //
    // Los campos de notación se escriben en LaTeX SIN delimitadores: se
    // envuelven en $...$ al pintar y KaTeX los resuelve en la misma
    // pasada que el resto del módulo. Un guion largo se deja tal cual.
    // ================================================================
    const GLOSARIOS = {};

    function iniciarGlosarios() {
      mainContent.querySelectorAll('[data-glosario]').forEach(raiz => {
        const g = GLOSARIOS[raiz.dataset.glosario];
        if (!g) {
          console.warn(`Glosario no registrado: ${raiz.dataset.glosario}`);
          return;
        }
        const id = `glosario-${raiz.dataset.glosario}`;
        const mate = txt => (txt && txt !== '—') ? `$${txt}$` : (txt || '');
        raiz.innerHTML = `
          <button type="button" class="glosario-boton" aria-expanded="false" aria-controls="${id}">
            <i class="fas fa-language" aria-hidden="true"></i>
            <span class="glosario-texto">${g.titulo}</span>
            <i class="fas fa-chevron-down" aria-hidden="true"></i>
          </button>
          <div class="glosario-panel" id="${id}" hidden>
            <div class="glosario-marco">
              <table>
                <caption class="sr-only">${g.titulo}</caption>
                <thead>
                  <tr>
                    <th scope="col">Concepto</th>
                    <th scope="col">Este material</th>
                    <th scope="col">Lohr</th>
                    <th scope="col">Gutiérrez</th>
                    <th scope="col">En R</th>
                  </tr>
                </thead>
                <tbody>
                  ${g.filas.map(f => `<tr>
                    <td>${f.concepto}</td>
                    <td>${mate(f.aqui)}</td>
                    <td>${mate(f.lohr)}</td>
                    <td>${mate(f.gutierrez)}</td>
                    <td><code>${f.r}</code></td>
                  </tr>`).join('')}
                </tbody>
              </table>
            </div>
            ${g.nota ? `<p class="glosario-nota">${g.nota}</p>` : ''}
          </div>`;

        const boton = raiz.querySelector('.glosario-boton');
        const panel = raiz.querySelector('.glosario-panel');
        boton.addEventListener('click', () => {
          const abierto = boton.getAttribute('aria-expanded') === 'true';
          boton.setAttribute('aria-expanded', abierto ? 'false' : 'true');
          panel.hidden = abierto;
        });
      });
    }

