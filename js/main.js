/* ==========================================================================
   js/main.js — Lógica global compartida por todas las páginas
   Capítulo Estudiantil UCSP ACM
   ========================================================================== */

/**
 * ------------------------------------------------------------------
 * 1. TOGGLE DEL MENÚ MÓVIL (Header Hamburguesa)
 * ------------------------------------------------------------------
 */
(function initMobileNav() {
  const toggleBtn = document.getElementById('mobileToggle');
  const nav = document.getElementById('headerNav');

  if (!toggleBtn || !nav) return;

  toggleBtn.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('active');
    toggleBtn.setAttribute('aria-expanded', isOpen.toString());
    toggleBtn.innerHTML = isOpen
      ? /* X icon */
        `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
           <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
         </svg>`
      : /* Hamburguesa icon */
        `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
           <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/>
           <line x1="3" y1="18" x2="21" y2="18"/>
         </svg>`;
  });

  // Cierra el menú al hacer click fuera de él
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target) && !toggleBtn.contains(e.target)) {
      nav.classList.remove('active');
      toggleBtn.setAttribute('aria-expanded', 'false');
    }
  });

  // Cierra el menú al hacer click en cualquier enlace de navegación
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('active');
      toggleBtn.setAttribute('aria-expanded', 'false');
    });
  });
})();


/**
 * ------------------------------------------------------------------
 * 2. FORMULARIO DE CONTACTO / FEEDBACK (index.html)
 *    Validación básica + feedback visual al usuario.
 *    Para envío real: conectar con Formspree, Netlify Forms,
 *    EmailJS u otro servicio de terceros (sin back-end propio).
 * ------------------------------------------------------------------
 */
(function initContactForm() {
  const form = document.getElementById('contactForm');
  const toast = document.getElementById('formToast');

  if (!form || !toast) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // Validación básica
    const nombre = form.querySelector('#inputNombre')?.value.trim();
    const email  = form.querySelector('#inputEmail')?.value.trim();
    const asunto = form.querySelector('#inputAsunto')?.value.trim();
    const msg    = form.querySelector('#inputMensaje')?.value.trim();

    if (!nombre || !email || !asunto || !msg) {
      showToast('⚠️ Por favor completa todos los campos antes de enviar.', 'warning');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast('⚠️ Ingresa un correo electrónico válido.', 'warning');
      return;
    }

    /*
     * ---------------------------------------------------------------
     * AQUÍ: integrar servicio de envío de correo real.
     * Opciones sin back-end:
     *   - Formspree: fetch('https://formspree.io/f/YOUR_ID', {...})
     *   - EmailJS: emailjs.send('service_id', 'template_id', {...})
     *   - Netlify Forms: añadir atributo netlify al <form>
     * Por ahora se simula el envío exitoso.
     * ---------------------------------------------------------------
     */

    // Simulación de envío exitoso
    const submitBtn = form.querySelector('.btn-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';

    setTimeout(() => {
      showToast('✅ ¡Mensaje enviado correctamente! Nos pondremos en contacto contigo pronto.', 'success');
      form.reset();
      submitBtn.disabled = false;
      submitBtn.innerHTML = `Enviar Mensaje
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>`;
    }, 1200);
  });

  function showToast(message, type) {
    toast.textContent = message;
    toast.className = 'form-toast ' + (type === 'success' ? 'success' : '');
    toast.style.display = 'flex';
    // Auto-ocultar después de 5 segundos
    setTimeout(() => { toast.style.display = 'none'; }, 5000);
  }
})();


/**
 * ------------------------------------------------------------------
 * 3. SCROLL SUAVE A ANCLAS (complementa el CSS scroll-behavior)
 *    Compensa la altura del header fijo (sticky).
 * ------------------------------------------------------------------
 */
(function initSmoothScrollOffset() {
  const HEADER_H = 80; // px — altura aproximada del header sticky

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href').slice(1);
      const target = document.getElementById(targetId);
      if (!target) return;

      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - HEADER_H;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();


/**
 * ------------------------------------------------------------------
 * 4. ANIMACIÓN DE ENTRADA AL SCROLL (IntersectionObserver)
 *    Agrega la clase 'visible' a los elementos .reveal cuando
 *    entran al viewport. El CSS maneja la transición de opacidad.
 * ------------------------------------------------------------------
 */
(function initScrollReveal() {
  // Agrega la clase 'reveal' a todos los elementos principales de sección
  const revealSelectors = [
    '.event-card-horizontal',
    '.past-event-card',
    '.team-card',
    '.resource-section',
    '.guide-item-card',
    '.roadmap-feature-card',
    '.caratula-container'
  ];

  // Estilos base para la animación (se inyectan via JS para no bloquear el CSS crítico)
  const style = document.createElement('style');
  style.textContent = `
    .reveal { opacity: 0; transform: translateY(18px); transition: opacity 420ms ease, transform 420ms ease; }
    .reveal.visible { opacity: 1; transform: translateY(0); }
  `;
  document.head.appendChild(style);

  const elements = document.querySelectorAll(revealSelectors.join(','));
  elements.forEach(el => el.classList.add('reveal'));

  if (!('IntersectionObserver' in window)) {
    // Fallback: mostrar todo si el navegador no soporta IntersectionObserver
    elements.forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // Solo animar una vez
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  elements.forEach(el => observer.observe(el));
})();


/**
 * ------------------------------------------------------------------
 * 5. UTILITARIOS GLOBALES
 * ------------------------------------------------------------------
 */
const ACM_UCSP = {
  /** Formatea una fecha JS a "Vie, 24 Oct 2026 · 5:00 PM" en español */
  formatDate(date) {
    if (!(date instanceof Date)) date = new Date(date);
    return date.toLocaleString('es-PE', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  },

  /** Genera la URL para agregar un evento a Google Calendar */
  buildGCalURL({ title, startISO, endISO, location = '', description = '' }) {
    const fmt = (iso) => iso.replace(/[-:]/g, '').replace('.000Z', 'Z');
    const base = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
    return `${base}&text=${encodeURIComponent(title)}&dates=${fmt(startISO)}/${fmt(endISO)}&location=${encodeURIComponent(location)}&details=${encodeURIComponent(description)}`;
  }
};

// Exponer globalmente para que otros scripts puedan usarlo
window.ACM_UCSP = ACM_UCSP;
