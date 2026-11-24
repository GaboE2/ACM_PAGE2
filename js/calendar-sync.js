/* ==========================================================================
   js/calendar-sync.js — Sincronización con Google Calendar API
   Capítulo Estudiantil UCSP ACM
   
   INTEGRACIÓN ACTIVA CON GOOGLE CALENDAR API V3:
   -------------------------------------------------------
   1. Ve a https://console.cloud.google.com/
   2. Crea un proyecto o selecciona uno existente.
   3. Habilita la "Google Calendar API".
   4. Crea una "API Key" (restricción: Referrer HTTP → tu dominio).
   5. Haz el Google Calendar del capítulo PÚBLICO:
      Calendar Settings → Share → "Make available to public"
   6. Copia el Calendar ID desde Calendar Settings → Integrate calendar.
   7. Restringe GOOGLE_API_KEY a los dominios donde se publica el sitio.
   ========================================================================== */

/* ------------------------------------------------------------------
   CONFIGURACIÓN — Editar antes de desplegar
   ------------------------------------------------------------------ */
const GOOGLE_CALENDAR_ID = 'c_7297f62ec1a5c0cb91116de48b2f8b9467fc52fd4f3571f0573cba287dbdf448@group.calendar.google.com';
const GOOGLE_API_KEY     = 'AIzaSyCuWImSbueWgSTlwNJ4Ku3UB7tAgsQattg';
const MAX_UPCOMING_EVENTS = 3; // Número de próximos eventos a mostrar en "Up Next"

/* ------------------------------------------------------------------
   INICIALIZACIÓN — Se ejecuta al cargar la página
   ------------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('upNextGrid')?.replaceChildren();
  document.getElementById('pastEventsGrid')?.replaceChildren();

  const eventsPromise = fetchFromGoogleCalendar();
  window.ACM_CALENDAR_SYNC.eventsPromise = eventsPromise;

  const subscriptionButton = document.getElementById('addToCalBtn');
  if (subscriptionButton) {
    subscriptionButton.href = `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(GOOGLE_CALENDAR_ID)}`;
    subscriptionButton.target = '_blank';
    subscriptionButton.rel = 'noopener noreferrer';
  }

  eventsPromise.then(events => {
    renderUpNextCards(events);
    renderPastEvents(events);
    realignHashTargetAfterCalendarRender();
  }).catch(error => {
    console.error('[ACM UCSP Calendar] No se pudieron cargar los eventos:', error);
    renderUpNextCards([]);
    renderPastEvents([]);
    realignHashTargetAfterCalendarRender();
  });
});

/**
 * Los eventos se insertan después de que el navegador procesa el fragmento
 * inicial de la URL. Ese cambio de altura puede dejar desfasada el ancla.
 * Reubica el fragmento actual una vez que el DOM terminó de actualizarse.
 */
function realignHashTargetAfterCalendarRender() {
  if (!window.location.hash) return;

  requestAnimationFrame(() => requestAnimationFrame(() => {
    const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
    if (!target) return;

    const top = target.getBoundingClientRect().top + window.scrollY - 80;
    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    window.scrollTo(0, top);
    root.style.scrollBehavior = previousScrollBehavior;
  }));
}

/* ------------------------------------------------------------------
   FUNCIÓN PRINCIPAL: Fetch desde Google Calendar API v3
   ------------------------------------------------------------------ */
async function fetchFromGoogleCalendar() {
  const endpoint = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(GOOGLE_CALENDAR_ID)}/events`;
  const items = [];
  let pageToken = '';

  do {
    const url = new URL(endpoint);
    url.searchParams.set('key', GOOGLE_API_KEY);
    url.searchParams.set('maxResults', '2500');
    url.searchParams.set('singleEvents', 'true');
    url.searchParams.set('orderBy', 'startTime');
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Google Calendar API respondió con status: ${response.status}`);
    }

    const data = await response.json();
    items.push(...(data.items || []));
    pageToken = data.nextPageToken || '';
  } while (pageToken);

  return items
    .filter(item => item.status !== 'cancelled' && (item.start?.dateTime || item.start?.date))
    .map(mapGoogleCalendarEvent);
}

function mapGoogleCalendarEvent(item) {
  const rawSummary = item.summary || 'Evento sin título';
  const categoryMatch = rawSummary.match(/^\[(Workshop|Charla|Competencia|Social|General)\]\s*/i);
  const categoryNames = {
    workshop: 'Workshop',
    charla: 'Charla',
    competencia: 'Competencia',
    social: 'Social',
    general: 'General'
  };
  const category = categoryMatch
    ? categoryNames[categoryMatch[1].toLowerCase()]
    : 'EVENTO';
  const categoryColor = {
    Competencia: 'red',
    Workshop: 'teal',
    Charla: 'blue',
    Social: 'blue',
    General: 'blue',
    EVENTO: 'blue'
  }[category];
  const startISO = item.start?.dateTime || item.start?.date;
  const endISO = item.end?.dateTime || item.end?.date || startISO;
  const startDate = parseCalendarDate(startISO);
  const endDate = parseCalendarDate(endISO);

  return {
    id: item.id || '',
    title: categoryMatch ? rawSummary.slice(categoryMatch[0].length) : rawSummary,
    category,
    host: item.organizer?.displayName || 'ACM UCSP',
    description: item.description || '',
    startISO,
    endISO,
    date: formatDateKey(startDate),
    startTime: item.start?.dateTime ? formatEventTime(startDate) : 'Todo el día',
    endTime: item.end?.dateTime ? formatEventTime(endDate) : 'Todo el día',
    location: item.location || 'Por confirmar',
    isRecurring: !!item.recurringEventId,
    color: categoryColor
  };
}

function parseCalendarDate(value) {
  return value.includes('T') ? new Date(value) : new Date(`${value}T00:00:00`);
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatEventTime(date) {
  return date.toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit', hour12: true });
}

/* ------------------------------------------------------------------
   RENDERIZADO DE TARJETAS "UP NEXT"
   Reemplaza las tarjetas estáticas del HTML con datos dinámicos.
   ------------------------------------------------------------------ */
function renderUpNextCards(events) {
  const grid = document.getElementById('upNextGrid');
  if (!grid) return; // Solo se ejecuta en index.html

  const now = new Date();
  const upcoming = events
    .filter(ev => parseCalendarDate(ev.startISO) >= now)
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

  grid.innerHTML = upcoming.map(buildEventCardHTML).join('');
}

function renderPastEvents(events) {
  const grid = document.getElementById('pastEventsGrid');
  if (!grid) return;

  const now = new Date();
  const past = events
    .filter(event => parseCalendarDate(event.startISO) < now)
    .sort((a, b) => new Date(b.startISO) - new Date(a.startISO))
    .slice(0, 8);

  if (past.length === 0) {
    grid.innerHTML = '<p class="past-events-empty" role="status">No hay eventos pasados disponibles.</p>';
    return;
  }

  grid.innerHTML = past.map(buildPastEventCardHTML).join('');
}

function buildPastEventCardHTML(event) {
  const date = parseCalendarDate(event.startISO);
  const dateLabel = date.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
  const description = event.description || 'Sin descripción disponible.';
  const categoryClass = {
    Competencia: 'competencia',
    Charla: 'charla',
    Workshop: 'workshop',
    Social: 'social',
    General: 'general',
    EVENTO: 'general'
  }[event.category] || 'general';

  return `
    <article class="past-event-card" role="listitem" aria-label="${escapeHTML(event.title)}">
      <div class="past-event-img-wrap past-event-banner past-event-banner--${categoryClass}">
        <span class="past-event-banner-tag">${escapeHTML(event.category || 'EVENTO')}</span>
        <div class="past-event-banner-copy">
          <h3 class="past-event-banner-title">${escapeHTML(event.title)}</h3>
          <p class="past-event-banner-subtitle">ACM UCSP · Next Nodo 2026</p>
        </div>
      </div>
      <div class="past-event-body">
        <p class="past-event-desc">${escapeHTML(description)}</p>
        <div class="past-event-meta">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          ${escapeHTML(dateLabel)}
        </div>
      </div>
    </article>`;
}

/* ------------------------------------------------------------------
   CONSTRUCTOR DE HTML PARA UNA TARJETA DE EVENTO
   (Usado cuando hay datos dinámicos de Google Calendar)
   ------------------------------------------------------------------ */
function buildEventCardHTML(event) {
  const start = parseCalendarDate(event.startISO);
  const end   = parseCalendarDate(event.endISO);

  const formatDate = (d) => d.toLocaleDateString('es-PE', {
    weekday: 'short', day: 'numeric', month: 'short'
  });

  const formatTime = (d) => d.toLocaleTimeString('es-PE', {
    hour: 'numeric', minute: '2-digit', hour12: true
  });
  const eventPeriod = event.startTime === 'Todo el día'
    ? `${formatDate(start)} · Todo el día`
    : `${formatDate(start)} · ${formatTime(start)} – ${formatDate(end)} · ${formatTime(end)}`;

  const description = event.description || 'Sin descripción disponible.';
  const shortDesc = description.length > 150
    ? description.slice(0, 150) + '...'
    : description;

  const gcalURL = window.ACM_UCSP?.buildGCalURL({
    title: event.title,
    startISO: event.startISO,
    endISO: event.endISO,
    location: event.location,
    description: event.description
  }) || '#';

  return `
    <article class="event-card-horizontal" data-event-id="${escapeHTML(event.id)}">
      <div class="card-top">
        <h3 class="event-card-title">${escapeHTML(event.title)}</h3>
        <p class="event-host">${escapeHTML(event.category)} · Organizado por ${escapeHTML(event.host)}</p>
        <p class="event-desc">${escapeHTML(shortDesc)}</p>
      </div>
      <div class="card-meta">
        <div class="meta-row">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span>${eventPeriod}</span>
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

// Exportar la carga compartida y el identificador para las demás vistas.
window.ACM_CALENDAR_SYNC = {
  calendarId: GOOGLE_CALENDAR_ID,
  fetchFromGoogleCalendar,
  eventsPromise: null
};
