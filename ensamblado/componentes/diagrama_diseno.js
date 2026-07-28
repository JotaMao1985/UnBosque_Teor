    // ================================================================
    // Diagrama de diseño muestral (v1, capítulo 4)
    //
    // DIAGRAMAS_DISENO['id'] = {titulo, intro, nota, etapas, acumulado}
    // sobre un contenedor con data-diagrama="id". Cada etapa es
    //
    //   { etiqueta, unidad, icono, resumen, pi, peso, cifras, ejemplo }
    //
    // `pi` y `peso` son LaTeX (sin $): la probabilidad de inclusión que
    // la etapa aporta y el factor de peso que deja. `cifras` es una
    // lista de {k, v} con los números reales del ejemplo. La franja
    // `acumulado` = {formula, texto} cierra con la lección del
    // componente: π y peso finales son el producto de las etapas.
    //
    // El texto admite LaTeX entre $…$; al cambiar de etapa se vuelve a
    // pasar KaTeX por el panel, igual que hace el árbol de error.
    // ================================================================
    const DIAGRAMAS_DISENO = {};

    function iniciarDiagramasDiseno() {
      mainContent.querySelectorAll('[data-diagrama]').forEach(raiz => {
        const spec = DIAGRAMAS_DISENO[raiz.dataset.diagrama];
        if (!spec) {
          console.warn(`Diagrama de diseño no registrado: ${raiz.dataset.diagrama}`);
          return;
        }
        pintarDiagramaDiseno(raiz, spec);
      });
    }

    function pintarDiagramaDiseno(raiz, spec) {
      raiz.innerHTML = `
        <p class="diagrama-diseno-titulo"><i class="fas fa-project-diagram" aria-hidden="true"></i>${spec.titulo}</p>
        ${spec.intro ? `<p class="diagrama-diseno-intro">${spec.intro}</p>` : ''}
        <div class="diagrama-diseno-flujo" role="group" aria-label="${spec.titulo}"></div>
        <div class="diagrama-diseno-detalle" role="status" aria-live="polite"></div>
        ${spec.acumulado ? `<div class="diagrama-diseno-acumulado">
          <span class="rotulo">${spec.acumulado.rotulo || 'El diseño completo'}</span>
          <div class="diagrama-diseno-acumulado-formula">${'$$'}${spec.acumulado.formula}${'$$'}</div>
          ${spec.acumulado.texto ? `<p>${spec.acumulado.texto}</p>` : ''}
        </div>` : ''}
        ${spec.nota ? `<p class="diagrama-diseno-nota">${spec.nota}</p>` : ''}`;

      const flujo = raiz.querySelector('.diagrama-diseno-flujo');
      const detalle = raiz.querySelector('.diagrama-diseno-detalle');

      spec.etapas.forEach((etapa, i) => {
        if (i > 0) {
          const flecha = document.createElement('span');
          flecha.className = 'diagrama-diseno-flecha';
          flecha.setAttribute('aria-hidden', 'true');
          flecha.innerHTML = '<i class="fas fa-arrow-right"></i>';
          flujo.appendChild(flecha);
        }
        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'diagrama-diseno-etapa';
        boton.dataset.etapa = String(i);
        boton.setAttribute('aria-pressed', 'false');
        boton.innerHTML = `
          <span class="diagrama-diseno-icono"><i class="fas ${etapa.icono || 'fa-layer-group'}" aria-hidden="true"></i></span>
          <span class="diagrama-diseno-etiqueta">${etapa.etiqueta}</span>
          ${etapa.unidad ? `<span class="diagrama-diseno-unidad">${etapa.unidad}</span>` : ''}`;
        boton.addEventListener('click', () => seleccionar(i));
        flujo.appendChild(boton);
      });

      // Las etiquetas y unidades de la franja se pintan una sola vez;
      // si llevan $…$ hay que pasarles KaTeX aquí, no en seleccionar().
      if (typeof katexEn === 'function') katexEn(flujo);

      function seleccionar(i) {
        const etapa = spec.etapas[i];
        flujo.querySelectorAll('.diagrama-diseno-etapa').forEach(b => {
          const activo = b.dataset.etapa === String(i);
          b.classList.toggle('activo', activo);
          b.setAttribute('aria-pressed', String(activo));
        });

        const formulas = [];
        if (etapa.pi) {
          formulas.push(`<div class="diagrama-diseno-formula"><span class="rotulo">Probabilidad que aporta</span>$${etapa.pi}$</div>`);
        }
        if (etapa.peso) {
          formulas.push(`<div class="diagrama-diseno-formula"><span class="rotulo">Factor de peso que deja</span>$${etapa.peso}$</div>`);
        }

        detalle.innerHTML =
          `<h5>Etapa ${i + 1} de ${spec.etapas.length} · ${etapa.etiqueta}</h5>` +
          (etapa.resumen ? `<p>${etapa.resumen}</p>` : '') +
          (formulas.length ? `<div class="diagrama-diseno-formulas">${formulas.join('')}</div>` : '') +
          ((etapa.cifras || []).length ? `<div class="diagrama-diseno-cifras">${etapa.cifras.map(c =>
            `<span class="diagrama-diseno-cifra">${c.k}: <strong>${c.v}</strong></span>`).join('')}</div>` : '') +
          (etapa.ejemplo ? `<p class="diagrama-diseno-ejemplo"><strong>En el ejemplo:</strong> ${etapa.ejemplo}</p>` : '');

        if (typeof katexEn === 'function') katexEn(detalle);
      }

      const acumulado = raiz.querySelector('.diagrama-diseno-acumulado');
      if (acumulado && typeof katexEn === 'function') katexEn(acumulado);
      seleccionar(0);
    }

