    // ================================================================
    // Rúbrica analítica (v1, capítulo 8)
    //
    // RUBRICAS['id'] = {titulo, intro, total, criterios, anulan, nota}
    // sobre un contenedor con data-rubrica="id". Cada criterio es
    //
    //   { clave, nombre, puntos, foco, niveles: [{nombre, rango, observa}] }
    //
    // Los niveles se declaran de mayor a menor desempeño; el índice
    // decide el color de la banda lateral, así que el orden importa.
    // `foco` es la frase que dice qué mide el criterio — sin ella, una
    // rúbrica se lee como una lista de castigos.
    //
    // El texto admite LaTeX entre $…$ y marcado HTML sencillo; al
    // cambiar de criterio se vuelve a pasar KaTeX por el panel, igual
    // que hacen el árbol de error y el diagrama de diseño.
    // ================================================================
    const RUBRICAS = {};

    function iniciarRubricas() {
      mainContent.querySelectorAll('[data-rubrica]').forEach(raiz => {
        const spec = RUBRICAS[raiz.dataset.rubrica];
        if (!spec) {
          console.warn(`Rúbrica no registrada: ${raiz.dataset.rubrica}`);
          return;
        }
        pintarRubrica(raiz, spec);
      });
    }

    function pintarRubrica(raiz, spec) {
      const suma = spec.criterios.reduce((a, c) => a + (c.puntos || 0), 0);
      const total = spec.total || suma;
      if (spec.total && spec.total !== suma) {
        console.warn(`Rúbrica ${raiz.dataset.rubrica}: los criterios suman ${suma} y el total declarado es ${spec.total}`);
      }

      raiz.innerHTML = `
        <p class="rubrica-titulo"><i class="fas fa-list-check" aria-hidden="true"></i>${spec.titulo}
          <span class="rubrica-puntos-total">${total} pts</span></p>
        ${spec.intro ? `<p class="rubrica-intro">${spec.intro}</p>` : ''}
        <div class="rubrica-criterios" role="group" aria-label="${spec.titulo}"></div>
        <div class="rubrica-detalle" role="status" aria-live="polite"></div>
        ${(spec.anulan || []).length ? `<div class="rubrica-anula">
          <span class="rotulo">${spec.rotuloAnula || 'Condiciones que anulan el trabajo'}</span>
          <ul>${spec.anulan.map(a => `<li>${a}</li>`).join('')}</ul>
        </div>` : ''}
        ${spec.nota ? `<p class="rubrica-nota">${spec.nota}</p>` : ''}`;

      const lista = raiz.querySelector('.rubrica-criterios');
      const detalle = raiz.querySelector('.rubrica-detalle');

      spec.criterios.forEach((crit, i) => {
        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'rubrica-criterio';
        boton.dataset.criterio = String(i);
        boton.setAttribute('aria-pressed', 'false');
        boton.innerHTML = `
          <span class="rubrica-criterio-clave">${crit.clave}</span>
          <span class="rubrica-criterio-nombre">${crit.nombre}</span>
          <span class="rubrica-criterio-puntos">${crit.puntos} pts · ${Math.round(100 * crit.puntos / total)} % de la nota</span>`;
        boton.addEventListener('click', () => seleccionar(i));
        lista.appendChild(boton);
      });

      function seleccionar(i) {
        const crit = spec.criterios[i];
        lista.querySelectorAll('.rubrica-criterio').forEach(b => {
          const activo = b.dataset.criterio === String(i);
          b.classList.toggle('activo', activo);
          b.setAttribute('aria-pressed', String(activo));
        });

        detalle.innerHTML =
          (crit.foco ? `<p class="rubrica-foco"><strong>${crit.clave} · ${crit.nombre} (${crit.puntos} pts).</strong> ${crit.foco}</p>` : '') +
          `<div class="rubrica-niveles">${crit.niveles.map((n, g) => `
            <div class="rubrica-nivel" data-grado="${g}">
              <span class="rubrica-nivel-marca">
                <span class="rubrica-nivel-nombre">${n.nombre}</span>
                <span class="rubrica-nivel-rango">${n.rango} pts</span>
              </span>
              <p class="rubrica-nivel-observa">${n.observa}</p>
            </div>`).join('')}</div>`;

        if (typeof katexEn === 'function') katexEn(detalle);
      }

      const anula = raiz.querySelector('.rubrica-anula');
      if (anula && typeof katexEn === 'function') katexEn(anula);
      seleccionar(0);
    }

