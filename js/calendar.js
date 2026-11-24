/* ==========================================================================
   js/calendar.js — Motor de la vista mensual del Calendario
   Capítulo Estudiantil UCSP ACM
   Replica la funcionalidad de la cuadrícula mensual de ACM UIUC.
   ========================================================================== */

/* ------------------------------------------------------------------
   ESTADO DEL CALENDARIO
   ------------------------------------------------------------------ */
let currentDate = new Date();      // Mes actualmente visible
let selectedEvent = null;          // Evento seleccionado para el panel de detalles
let allEvents = [];                // Todos los eventos cargados
let activeFilter = '';             // Filtro de comité activo
let activeSearch = '';

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const WEEKDAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/* ------------------------------------------------------------------
   INICIALIZACIÓN
   ------------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', async () => {
  bindCalendarControls();
  try {
    const eventsPromise = window.ACM_CALENDAR_SYNC?.eventsPromise
      || window.ACM_CALENDAR_SYNC?.fetchFromGoogleCalendar();
    allEvents = eventsPromise ? await eventsPromise : [];
    populateOrganizerFilter();
  } catch (error) {
    console.error('[ACM UCSP Calendar] No se pudo cargar la vista mensual:', error);
    allEvents = [];
  }
  renderCalendar(currentDate);
});

function populateOrganizerFilter() {
  const selector = document.getElementById('hostSelector');
  if (!selector) return;

  const hosts = [...new Set(allEvents.map(event => event.host).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
  selector.replaceChildren(new Option('Todos los comités', ''));
  hosts.forEach(host => selector.add(new Option(host, host)));
}

/* ------------------------------------------------------------------
   RENDERIZADO DEL CALENDARIO
   ------------------------------------------------------------------ */
function renderCalendar(date) {
  updateMonthIndicator(date);
  renderDaysGrid(date);
}

function updateMonthIndicator(date) {
  const indicator = document.getElementById('calMonthIndicator');
  if (indicator) {
    indicator.textContent = `${MONTHS_ES[date.getMonth()]} ${date.getFullYear()}`;
  }
}

function renderDaysGrid(date) {
  const grid = document.getElementById('calendarDaysGrid');
  if (!grid) return;

  grid.innerHTML = '';

  const year  = date.getFullYear();
  const month = date.getMonth(); // 0-based

  // Primer día del mes y cuántos días tiene
  const firstDay  = new Date(year, month, 1);
  const lastDay   = new Date(year, month + 1, 0);
  const totalDays = lastDay.getDate();

  // Día de la semana del primer día (0=Dom, adaptamos a Dom primero)
  const startDow = firstDay.getDay(); // 0 = Domingo

  // Días del mes anterior para rellenar la primera fila
  const prevMonthLastDay = new Date(year, month, 0).getDate();

  // Construir array de celdas
  const cells = [];

  // Celdas del mes anterior
  for (let i = startDow - 1; i >= 0; i--) {
    cells.push({ day: prevMonthLastDay - i, isCurrentMonth: false, dateStr: buildDateStr(year, month - 1, prevMonthLastDay - i) });
  }

  // Celdas del mes actual
  for (let d = 1; d <= totalDays; d++) {
    cells.push({ day: d, isCurrentMonth: true, dateStr: buildDateStr(year, month, d) });
  }

  // Celdas del mes siguiente para completar la cuadrícula
  const remaining = 42 - cells.length; // Siempre 6 filas × 7 cols
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, isCurrentMonth: false, dateStr: buildDateStr(year, month + 1, d) });
  }

  // Hoy para resaltarlo
  const todayStr = buildDateStr(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  // Filtro activo de comité
  const filter = activeFilter;

  // Renderizar cada celda
  cells.forEach(cell => {
    const cellEl = document.createElement('div');
    cellEl.classList.add('cal-day-cell');
    cellEl.setAttribute('role', 'gridcell');
    cellEl.setAttribute('aria-label', cell.dateStr);

    if (!cell.isCurrentMonth) cellEl.classList.add('other-month');
    if (cell.dateStr === todayStr) {
      cellEl.classList.add('today');
      cellEl.setAttribute('aria-current', 'date');
    }

    // Número del día
    const dayNum = document.createElement('span');
    dayNum.classList.add('day-number');
    dayNum.textContent = cell.day;
    cellEl.appendChild(dayNum);

    // Eventos de ese día
    const dayEvents = allEvents.filter(ev => {
      const match = ev.date === cell.dateStr;
      const hostMatch = !filter || ev.host.toLowerCase() === filter.toLowerCase();
      const query = activeSearch;
      const searchMatch = !query || [ev.title, ev.host, ev.location, ev.description, ev.category]
        .some(value => String(value || '').toLowerCase().includes(query));
      return match && hostMatch && searchMatch;
    });

    dayEvents.forEach(ev => {
      const pill = document.createElement('span');
      pill.classList.add('cal-event-pill', `pill-${ev.color}`);
      pill.textContent = ev.title;
      pill.setAttribute('role', 'button');
      pill.setAttribute('tabindex', '0');
      pill.setAttribute('aria-label', `Evento: ${ev.title} a las ${ev.startTime}`);

      pill.addEventListener('click', () => showEventDetails(ev));
      pill.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') showEventDetails(ev);
      });

      cellEl.appendChild(pill);
    });

    grid.appendChild(cellEl);
  });
}

/* ------------------------------------------------------------------
   PANEL DE DETALLES DEL EVENTO (Columna Derecha)
   ------------------------------------------------------------------ */
function showEventDetails(event) {
  selectedEvent = event;

  const emptyPanel   = document.getElementById('detailsEmpty');
  const contentPanel = document.getElementById('detailsContent');

  if (!emptyPanel || !contentPanel) return;

  emptyPanel.style.display   = 'none';
  contentPanel.style.display = 'block';

  document.getElementById('detailsBadge').textContent   = event.category || 'EVENTO';
  document.getElementById('detailsTitle').textContent   = event.title;
  document.getElementById('detailsDate').textContent    = `${formatDayForDisplay(event.date)} · ${event.startTime} – ${event.endTime}`;
  document.getElementById('detailsLocation').textContent = event.location;
  document.getElementById('detailsHost').textContent    = `Organizado por ${event.host}`;
  document.getElementById('detailsDesc').textContent    = event.description || 'Sin descripción disponible.';

  // Actualizar botón de Google Calendar
  const gcalBtn = document.getElementById('btnAddSingleEvent');
  if (gcalBtn && window.ACM_UCSP) {
    const gcalURL  = window.ACM_UCSP.buildGCalURL({
      title: event.title,
      startISO: event.startISO,
      endISO: event.endISO,
      location: event.location,
      description: event.description || ''
    });
    gcalBtn.onclick = () => window.open(gcalURL, '_blank', 'noopener,noreferrer');
  }
}

/* ------------------------------------------------------------------
   CONTROLES DEL CALENDARIO (Botones Hoy, Prev, Next, Filtros)
   ------------------------------------------------------------------ */
function bindCalendarControls() {
  // Botón "Hoy"
  document.getElementById('btnToday')?.addEventListener('click', () => {
    currentDate = new Date();
    renderCalendar(currentDate);
  });

  // Botón "Mes anterior"
  document.getElementById('btnPrev')?.addEventListener('click', () => {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    renderCalendar(currentDate);
  });

  // Botón "Mes siguiente"
  document.getElementById('btnNext')?.addEventListener('click', () => {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    renderCalendar(currentDate);
  });

  // Selector de Vista (Mensual / Semanal — por ahora solo mensual activo)
  document.getElementById('viewSelector')?.addEventListener('change', (e) => {
    if (e.target.value === 'week') {
      // Placeholder: Vista semanal no implementada en esta versión
      alert('Vista semanal próximamente. Por ahora está disponible la vista mensual.');
      e.target.value = 'month';
    }
  });

  // Selector de Comité / Host
  document.getElementById('hostSelector')?.addEventListener('change', (e) => {
    activeFilter = e.target.value;
    renderCalendar(currentDate);
  });

  // Búsqueda de eventos (filtro en tiempo real)
  const searchInput = document.getElementById('calSearchInput');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const query = e.target.value.trim().toLowerCase();
        activeSearch = query;
        renderCalendar(currentDate);
      }, 250);
    });
  }

  // Botón "Agregar todos los eventos al calendario"
  document.getElementById('btnAddAllEvents')?.addEventListener('click', () => {
    // Genera una URL de iCal o abre Google Calendar en modo de suscripción
    const calendarId = window.ACM_CALENDAR_SYNC?.calendarId;
    if (!calendarId) return;
    const calFeed = `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(calendarId)}`;
    window.open(calFeed, '_blank', 'noopener,noreferrer');
  });
}

/* ------------------------------------------------------------------
   UTILIDADES
   ------------------------------------------------------------------ */

/** Construye una cadena de fecha "YYYY-MM-DD" de forma segura */
function buildDateStr(year, month, day) {
  // month es 0-based internamente, pero necesitamos corregir overflow
  const d = new Date(year, month, day);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/** Formatea "2026-10-23" → "Vie 23 Oct 2026" en español */
function formatDayForDisplay(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('es-PE', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  });
}

