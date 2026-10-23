/* ==========================================================================
   js/resources.js — Lógica interactiva de la página de Recursos
   Capítulo Estudiantil UCSP ACM
   ========================================================================== */

/**
 * ------------------------------------------------------------------
 * 1. SIDEBAR ACTIVO AL SCROLL (IntersectionObserver)
 *    Resalta el enlace del sidebar correspondiente a la sección
 *    visible en el viewport, replicando el comportamiento de UIUC.
 * ------------------------------------------------------------------
 */
(function initSidebarActiveOnScroll() {
  const sidebarLinks = document.querySelectorAll('#sidebarNavList .sidebar-nav-link[data-section]');
  const sections = Array.from(sidebarLinks)
    .map(link => document.getElementById(link.dataset.section))
    .filter(Boolean);

  if (sections.length === 0 || !('IntersectionObserver' in window)) return;

  const HEADER_OFFSET = 120; // px — compensa el header sticky

  /**
   * Actualiza el enlace activo del sidebar.
   * La sección "activa" es la más cercana al tope del viewport.
   */
  function updateActiveLink() {
    let activeId = sections[0].id; // Por defecto, la primera sección

    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= HEADER_OFFSET + 10) {
        activeId = section.id;
      }
    });

    sidebarLinks.forEach(link => {
      if (link.dataset.section === activeId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  // Escuchar el scroll con throttle para no saturar el hilo principal
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateActiveLink();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // Ejecución inicial
  updateActiveLink();
})();


/**
 * ------------------------------------------------------------------
 * 2. BOTONES DE PLANTILLA — Tracking de descargas (Analytics)
 *    Registra en la consola qué plantilla descargó el usuario.
 *    Para producción: reemplazar con Google Analytics o Plausible.
 * ------------------------------------------------------------------
 */
(function initTemplateDownloadTracking() {
  const latexBtn    = document.querySelector('.btn-template-latex');
  const wordBtn     = document.querySelector('.btn-template-word');
  const overleafBtn = document.querySelector('.btn-template-overleaf');

  function trackDownload(type) {
    console.info(`[ACM UCSP Resources] Plantilla descargada/abierta: ${type} — ${new Date().toISOString()}`);
    /*
     * Para Google Analytics 4 (cuando esté integrado):
     * gtag('event', 'download_template', {
     *   'event_category': 'resources',
     *   'event_label': type
     * });
     */
  }

  latexBtn?.addEventListener('click',    () => trackDownload('LaTeX (.zip)'));
  wordBtn?.addEventListener('click',     () => trackDownload('Word (.docx)'));
  overleafBtn?.addEventListener('click', () => trackDownload('Overleaf (external)'));
})();


/**
 * ------------------------------------------------------------------
 * 3. BOTÓN DE ROADMAP EXTERNO — Confirmación visual de apertura
 * ------------------------------------------------------------------
 */
(function initRoadmapButton() {
  const btn = document.querySelector('.btn-github-external');
  if (!btn) return;

  btn.addEventListener('click', function (e) {
    // Pequeño feedback visual
    const original = this.innerHTML;
    this.textContent = 'Abriendo GitHub Pages...';
    setTimeout(() => { this.innerHTML = original; }, 2000);
  });
})();


/**
 * ------------------------------------------------------------------
 * 4. COPY-TO-CLIPBOARD para bloques de código (instrucciones LaTeX)
 *    Al hacer click en un <code> dentro de las instrucciones,
 *    copia el contenido al portapapeles.
 * ------------------------------------------------------------------
 */
(function initCodeCopy() {
  const codeBlocks = document.querySelectorAll('ol code, li code');

  codeBlocks.forEach(code => {
    code.style.cursor = 'pointer';
    code.title = 'Click para copiar';

    code.addEventListener('click', async function () {
      const text = this.textContent;
      try {
        await navigator.clipboard.writeText(text);

        const original = this.style.backgroundColor;
        this.style.backgroundColor = '#D1FAE5'; // Verde suave de confirmación
        this.title = '¡Copiado!';
        setTimeout(() => {
          this.style.backgroundColor = original;
          this.title = 'Click para copiar';
        }, 1500);
      } catch (err) {
        console.warn('[ACM UCSP] No se pudo copiar al portapapeles:', err);
      }
    });
  });
})();
