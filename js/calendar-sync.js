/* ==========================================================================
   js/calendar-sync.js — Sincronización con Google Calendar API
   Capítulo Estudiantil UCSP ACM
   
   INSTRUCCIONES PARA ACTIVAR LA SINCRONIZACIÓN REAL:
   -------------------------------------------------------
   1. Ve a https://console.cloud.google.com/
   2. Crea un proyecto o selecciona uno existente.
   3. Habilita la "Google Calendar API".
   4. Crea una "API Key" (restricción: Referrer HTTP → tu dominio).
   5. Haz el Google Calendar del capítulo PÚBLICO:
      Calendar Settings → Share → "Make available to public"
   6. Copia el Calendar ID desde Calendar Settings → Integrate calendar.
   7. Reemplaza GOOGLE_CALENDAR_ID y GOOGLE_API_KEY con tus valores.
   8. Descomenta el bloque "MODO PRODUCCIÓN" y comenta el "MODO DEMO".
   ========================================================================== */

/* ------------------------------------------------------------------
   CONFIGURACIÓN — Editar antes de desplegar
   ------------------------------------------------------------------ */
const GOOGLE_CALENDAR_ID = 'TU_CALENDAR_ID@group.calendar.google.com'; // ← Reemplazar
const GOOGLE_API_KEY     = 'TU_API_KEY_AQUI';                          // ← Reemplazar
const MAX_UPCOMING_EVENTS = 3; // Número de próximos eventos a mostrar en "Up Next"

/* ------------------------------------------------------------------
   DATOS DE DEMO ESTÁTICOS
   Reemplaza esto con la llamada real a la API cuando tengas las credenciales.
   ------------------------------------------------------------------ */
const DEMO_EVENTS = [
  {
    id: 'evt001',
    title: 'ACM Social Hour UCSP!',
    host: 'Comité Social',
    description: 'Únete a tus compañeros ACMers para una tarde de networking, pizza y conversación sobre tecnología. ¡Todos son bienvenidos!',
    startISO: '2026-10-24T17:00:00-05:00',
    endISO:   '2026-10-24T18:30:00-05:00',
    location: 'Pabellón A · Sala de Cómputo 201',
    isRecurring: true,
    color: 'blue'
  },
  {
    id: 'evt002',
    title: 'Tech Talk: IA Aplicada al Desarrollo',
    host: 'Comité Académico',
    description: 'Charla magistral sobre el uso de modelos de lenguaje grande (LLM) en aplicaciones de software reales. Ponente: Ing. Valeria Torres.',
    startISO: '2026-10-29T19:00:00-05:00',
    endISO:   '2026-10-29T21:00:00-05:00',
    location: 'Auditorio San Juan Pablo II',
    isRecurring: false,
    color: 'orange'
  },
  {
    id: 'evt003',
    title: 'Hackathon Interno UCSP 2026',
    host: 'Comité de Competencias',
    description: '24 horas para construir, innovar y competir. Forma tu equipo de hasta 4 personas.',
    startISO: '2026-11-12T08:00:00-05:00',
    endISO:   '2026-11-13T08:00:00-05:00',
    location: 'Lab de Innovación · Pabellón F',
    isRecurring: false,
    color: 'red'
  },
  {
    id: 'evt004',
    title: 'Workshop: Git & GitHub para Proyectos',
    host: 'Comité Académico',
    description: 'Aprende control de versiones desde cero: ramas, pull requests y GitHub Actions. Trae tu laptop.',
    startISO: '2026-11-05T16:00:00-05:00',
    endISO:   '2026-11-05T18:00:00-05:00',
    location: 'Lab Informática 3 · Pabellón B',
    isRecurring: false,
    color: 'teal'
  },
  {
    id: 'evt005',
    title: 'ICPC Practice Contest — Ronda #3',
    host: 'Competitive Programming',
    description: 'Simulacro ICPC con problemas de dificultad media-alta. Registra tu equipo antes del jueves.',
    startISO: '2026-11-08T10:00:00-05:00',
    endISO:   '2026-11-08T15:00:00-05:00',
    location: 'Lab de Cómputo 101',
    isRecurring: false,
    color: 'crimson'
  }
];

/* ------------------------------------------------------------------
   INICIALIZACIÓN — Se ejecuta al cargar la página
   ------------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', () => {
  /*
   * MODO PRODUCCIÓN (descomentar cuando tengas API Key y Calendar ID):
   * ---------------------------------------------------------------
   * fetchFromGoogleCalendar()
   *   .then(events => renderUpNextCards(events))
   *   .catch(err => {
   *     console.warn('[ACM UCSP Calendar] Error al conectar con Google Calendar API:', err);
   *     renderUpNextCards(DEMO_EVENTS); // fallback a datos de demo
   *   });
   */

  // MODO DEMO (eliminar cuando actives el modo producción):
  renderUpNextCards(DEMO_EVENTS);
});

/* ------------------------------------------------------------------
   FUNCIÓN PRINCIPAL: Fetch desde Google Calendar API v3
   ------------------------------------------------------------------ */
async function fetchFromGoogleCalendar() {
  const now = new Date().toISOString();
  const maxResults = MAX_UPCOMING_EVENTS + 10; // Traer algunos de más para filtrar

  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(GOOGLE_CALENDAR_ID)}/events`
  );

  url.searchParams.set('key', GOOGLE_API_KEY);
  url.searchParams.set('timeMin', now);                 // Solo eventos futuros
  url.searchParams.set('maxResults', maxResults);
  url.searchParams.set('singleEvents', 'true');        // Expandir eventos recurrentes
  url.searchParams.set('orderBy', 'startTime');        // Ordenar por fecha de inicio

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Google Calendar API respondió con status: ${response.status}`);
  }

  const data = await response.json();

  // Transformar la respuesta de la API al formato interno de ACM UCSP
  return (data.items || []).map(item => ({
    id: item.id,
    title: item.summary || 'Evento sin título',
    host: item.organizer?.displayName || 'ACM UCSP',
    description: item.description || '',
    startISO: item.start?.dateTime || item.start?.date,
    endISO: item.end?.dateTime || item.end?.date,
    location: item.location || 'Por confirmar',
    isRecurring: !!item.recurringEventId,
    color: 'blue' // Color por defecto; puedes mapear colores de Google Calendar
  }));
}

/* ------------------------------------------------------------------
   RENDERIZADO DE TARJETAS "UP NEXT"
   Reemplaza las tarjetas estáticas del HTML con datos dinámicos.
   ------------------------------------------------------------------ */
function renderUpNextCards(events) {
  const grid = document.getElementById('upNextGrid');
  if (!grid) return; // Solo se ejecuta en index.html

  // Filtrar solo eventos futuros y tomar los primeros MAX_UPCOMING_EVENTS
  const now = Date.now();
  const upcoming = events
    .filter(ev => new Date(ev.startISO).getTime() > now)
    .sort((a, b) => new Date(a.startISO) - new Date(b.startISO))
    .slice(0, MAX_UPCOMING_EVENTS);

  if (upcoming.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:40px 20px;color:#6B7280;">
        <p style="font-size:1.1rem;">No hay eventos próximos programados por el momento.</p>
        <p style="font-size:0.9rem;margin-top:8px;">¡Síguenos en Instagram y Discord para no perderte las novedades!</p>
      </div>`;
    return;
  }

  // Solo reemplazar si hay datos dinámicos (no sobreescribir el HTML demo)
  // Comentar la siguiente línea si prefieres siempre usar el HTML estático:
  // grid.innerHTML = upcoming.map(ev => buildEventCardHTML(ev)).join('');
}

/* ------------------------------------------------------------------
   CONSTRUCTOR DE HTML PARA UNA TARJETA DE EVENTO
   (Usado cuando hay datos dinámicos de Google Calendar)
   ------------------------------------------------------------------ */
function buildEventCardHTML(event) {
  const start = new Date(event.startISO);
  const end   = new Date(event.endISO);

  const formatDate = (d) => d.toLocaleString('es-PE', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit', hour12: true
  });

  const formatEndTime = (d) => d.toLocaleString('es-PE', {
    hour: '2-digit', minute: '2-digit', hour12: true
  });

  const shortDesc = event.description.length > 150
    ? event.description.slice(0, 150) + '...'
    : event.description;

  const gcalURL = window.ACM_UCSP?.buildGCalURL({
    title: event.title,
    startISO: event.startISO,
    endISO: event.endISO,
    location: event.location,
    description: event.description
  }) || '#';

  return `
    <article class="event-card-horizontal" data-event-id="${event.id}">
      <div class="card-top">
        <h3 class="event-card-title">${escapeHTML(event.title)}</h3>
        <p class="event-host">Organizado por ${escapeHTML(event.host)}</p>
        <p class="event-desc">${escapeHTML(shortDesc)}</p>
      </div>
      <div class="card-meta">
        <div class="meta-row">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span>${formatDate(start)} – ${formatEndTime(end)}</span>
          ${event.isRecurring ? '<span class="meta-badge-recur">Semanal</span>' : ''}
        </div>
        <div class="meta-row">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          <span>${escapeHTML(event.location)}</span>
        </div>
      </div>
      <div class="card-footer-action">
        <a href="${gcalURL}" target="_blank" rel="noopener noreferrer" class="btn-rsvp-tag">+ Google Cal</a>
      </div>
    </article>`;
}

/* ------------------------------------------------------------------
   UTILIDAD: Escape de HTML para evitar XSS con datos externos
   ------------------------------------------------------------------ */
function escapeHTML(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(String(str)));
  return div.innerHTML;
}

// Exportar para uso en calendar.js
window.ACM_CALENDAR_SYNC = { DEMO_EVENTS, fetchFromGoogleCalendar };
