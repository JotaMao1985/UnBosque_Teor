    // ================================================================
    // Árbol del error total (v1, capítulo 1)
    //
    // ARBOLES_ERROR['id'] = {titulo, intro, nota, raiz} sobre un
    // contenedor con data-arbol="id". Cada nodo es
    //
    //   { etiqueta, resumen, efecto, nAyuda, donde, ejemplo, hijos }
    //
    // `efecto` vale 'sesgo', 'varianza' o 'ambos' y `nAyuda` dice si
    // aumentar el tamaño de muestra reduce ese error. Son justo las dos
    // cosas que el estudiante confunde: un error de cobertura no se
    // arregla con más encuestas y uno de muestreo sí.
    //
    // El texto admite LaTeX entre $…$: al cambiar de nodo se vuelve a
    // pasar KaTeX por el panel, porque el contenido se pinta después de
    // la pasada general de loadModule.
    // ================================================================
    const ARBOLES_ERROR = {};

    const MARCA_EFECTO = {
      sesgo: 'Sesga la estimación',
      varianza: 'Solo añade varianza',
      ambos: 'Sesga y añade varianza'
    };

    function iniciarArbolesError() {
      mainContent.querySelectorAll('[data-arbol]').forEach(raiz => {
        const spec = ARBOLES_ERROR[raiz.dataset.arbol];
        if (!spec) {
          console.warn(`Árbol de error no registrado: ${raiz.dataset.arbol}`);
          return;
        }
        pintarArbolError(raiz, spec);
      });
    }

    function pintarArbolError(raiz, spec) {
      // Los nodos se numeran al recorrer el árbol para poder referirlos
      // desde los botones sin depender de que el autor ponga ids.
      const nodos = [];
      (function numerar(nodo, profundidad) {
        nodo._i = nodos.length;
        nodo._nivel = profundidad;
        nodos.push(nodo);
        (nodo.hijos || []).forEach(h => numerar(h, profundidad + 1));
      })(spec.raiz, 0);

      raiz.innerHTML = `
        <p class="arbol-error-titulo"><i class="fas fa-sitemap" aria-hidden="true"></i>${spec.titulo}</p>
        ${spec.intro ? `<p class="arbol-error-intro">${spec.intro}</p>` : ''}
        <div class="arbol-error-marco">
          <div class="arbol-error-arbol" role="tree" aria-label="${spec.titulo}"></div>
          <div class="arbol-error-detalle" role="status" aria-live="polite"></div>
        </div>
        ${spec.nota ? `<p class="arbol-error-nota">${spec.nota}</p>` : ''}`;

      const panelArbol = raiz.querySelector('.arbol-error-arbol');
      const panelDetalle = raiz.querySelector('.arbol-error-detalle');

      function lista(hijos) {
        const ul = document.createElement('ul');
        ul.setAttribute('role', 'group');
        hijos.forEach(nodo => ul.appendChild(elemento(nodo)));
        return ul;
      }

      function elemento(nodo) {
        const li = document.createElement('li');
        li.setAttribute('role', 'treeitem');
        const tieneHijos = (nodo.hijos || []).length > 0;

        const fila = document.createElement('div');
        fila.className = 'arbol-error-nodo';

        if (tieneHijos) {
          const chevron = document.createElement('button');
          chevron.type = 'button';
          chevron.className = 'arbol-error-chevron';
          chevron.setAttribute('aria-expanded', 'true');
          chevron.setAttribute('aria-label', `Plegar o desplegar ${nodo.etiqueta}`);
          chevron.innerHTML = '<i class="fas fa-chevron-down" aria-hidden="true"></i>';
          fila.appendChild(chevron);
          chevron.addEventListener('click', () => {
            const abierto = chevron.getAttribute('aria-expanded') === 'true';
            chevron.setAttribute('aria-expanded', String(!abierto));
            li.setAttribute('aria-expanded', String(!abierto));
            const sub = li.querySelector(':scope > ul');
            if (sub) sub.hidden = abierto;
          });
          li.setAttribute('aria-expanded', 'true');
        } else {
          const hueco = document.createElement('span');
          hueco.className = 'arbol-error-hueco';
          hueco.setAttribute('aria-hidden', 'true');
          fila.appendChild(hueco);
        }

        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'arbol-error-boton' + (tieneHijos ? ' rama' : '');
        boton.dataset.nodo = String(nodo._i);
        boton.textContent = nodo.etiqueta;
        boton.addEventListener('click', () => seleccionar(nodo._i));
        fila.appendChild(boton);

        li.appendChild(fila);
        if (tieneHijos) li.appendChild(lista(nodo.hijos));
        return li;
      }

      function seleccionar(i) {
        const nodo = nodos[i];
        panelArbol.querySelectorAll('.arbol-error-boton').forEach(b => {
          b.classList.toggle('activo', b.dataset.nodo === String(i));
        });

        const marcas = [];
        if (nodo.efecto) {
          marcas.push(`<span class="arbol-error-marca ${nodo.efecto}">${MARCA_EFECTO[nodo.efecto] || nodo.efecto}</span>`);
        }
        if (nodo.nAyuda !== undefined) {
          marcas.push(`<span class="arbol-error-marca ${nodo.nAyuda ? 'varianza' : 'sesgo'}">` +
            (nodo.nAyuda ? 'Aumentar $n$ lo reduce' : 'Aumentar $n$ <strong>no</strong> lo reduce') + '</span>');
        }
        if (nodo.donde) {
          marcas.push(`<span class="arbol-error-marca donde">${nodo.donde}</span>`);
        }

        panelDetalle.innerHTML =
          `<h5>${nodo.etiqueta}</h5>` +
          (nodo.resumen ? `<p>${nodo.resumen}</p>` : '') +
          (marcas.length ? `<div class="arbol-error-marcas">${marcas.join('')}</div>` : '') +
          (nodo.ejemplo ? `<p class="arbol-error-ejemplo"><strong>Ejemplo:</strong> ${nodo.ejemplo}</p>` : '');

        if (typeof katexEn === 'function') katexEn(panelDetalle);
      }

      // El <ul> exterior es solo maquetación: sin role="none" se colaría
      // entre el role="tree" y sus treeitem, que han de ser hijos suyos.
      const raizUl = document.createElement('ul');
      raizUl.setAttribute('role', 'none');
      raizUl.appendChild(elemento(spec.raiz));
      panelArbol.appendChild(raizUl);
      seleccionar(0);
    }

