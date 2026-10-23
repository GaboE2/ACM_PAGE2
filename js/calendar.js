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

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const WEEKDAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/* ------------------------------------------------------------------
   DATOS DE EVENTOS DE PRUEBA (Octubre–Noviembre 2026)
   Estilo cuadrícula UIUC: múltiples eventos por día, colores variados
   ------------------------------------------------------------------ */
const CALENDAR_EVENTS = [
  // --- OCTUBRE 2026 ---
  { id: 'c01', title: 'ACM Social Hour', date: '2026-10-02', host: 'Comité Social',        location: 'Sala Cómputo 201',         desc: 'Tarde de networking y pizza con los miembros del capítulo.', color: 'blue',    startTime: '5:00 PM', endTime: '6:30 PM' },
  { id: 'c02', title: 'Reunión General ACM', date: '2026-10-06', host: 'Directiva',       location: 'Sala de Reuniones A',      desc: 'Reunión mensual de toda la directiva del capítulo.', color: 'navy',   startTime: '6:00 PM', endTime: '7:30 PM' },
  { id: 'c03', title: 'Workshop: Python para DS', date: '2026-10-08', host: 'Comité Académico', location: 'Lab Info 2',        desc: 'Introducción a Pandas, NumPy y Matplotlib para análisis de datos.', color: 'teal',   startTime: '3:00 PM', endTime: '5:00 PM' },
  { id: 'c04', title: 'ACM Social Hour', date: '2026-10-09', host: 'Comité Social',        location: 'Sala Cómputo 201',         desc: 'Tarde de networking y pizza con los miembros del capítulo.', color: 'blue',    startTime: '5:00 PM', endTime: '6:30 PM' },
  { id: 'c05', title: 'ICPC Practice — Ronda #1', date: '2026-10-11', host: 'Competitive Prog.', location: 'Lab Cómputo 101', desc: 'Simulacro de concurso ICPC. Duración: 3 horas.', color: 'crimson', startTime: '10:00 AM', endTime: '1:00 PM' },
  { id: 'c06', title: 'ACM Social Hour', date: '2026-10-16', host: 'Comité Social',        location: 'Sala Cómputo 201',         desc: 'Tarde de networking y pizza con los miembros del capítulo.', color: 'blue',    startTime: '5:00 PM', endTime: '6:30 PM' },
  { id: 'c07', title: 'Charla: Seguridad en Apps', date: '2026-10-21', host: 'Comité Académico', location: 'Auditorio SJP II', desc: 'Fundamentos de ciberseguridad aplicada al desarrollo de software.', color: 'orange', startTime: '7:00 PM', endTime: '9:00 PM' },
  { id: 'c08', title: 'ACM Social Hour', date: '2026-10-23', host: 'Comité Social',        location: 'Sala Cómputo 201',         desc: 'Tarde de networking con los miembros.', color: 'blue',    startTime: '5:00 PM', endTime: '6:30 PM' },
  { id: 'c09', title: 'Tech Talk: IA Aplicada', date: '2026-10-29', host: 'Comité Académico', location: 'Auditorio SJP II',    desc: 'LLMs y su aplicación en el desarrollo de software moderno.', color: 'orange', startTime: '7:00 PM', endTime: '9:00 PM' },
  { id: 'c10', title: 'ICPC Practice — Ronda #2', date: '2026-10-25', host: 'Competitive Prog.', location: 'Lab Cómputo 101', desc: 'Segunda ronda de práctica con problemas de grafos y DP.', color: 'crimson', startTime: '10:00 AM', endTime: '1:00 PM' },
  { id: 'c11', title: 'ACM Social Hour', date: '2026-10-30', host: 'Comité Social',        location: 'Sala Cómputo 201',         desc: 'Última Social Hour de octubre. ¡Bienvenidos nuevos miembros!', color: 'blue',    startTime: '5:00 PM', endTime: '6:30 PM' },

  // --- NOVIEMBRE 2026 ---
  { id: 'c12', title: 'Workshop: Git & GitHub', date: '2026-11-05', host: 'Comité Académico', location: 'Lab Info 3',         desc: 'Control de versiones desde cero hasta GitHub Actions.', color: 'teal',   startTime: '4:00 PM', endTime: '6:00 PM' },
  { id: 'c13', title: 'ACM Social Hour', date: '2026-11-06', host: 'Comité Social',          location: 'Sala Cómputo 201',       desc: 'Networking semanal del capítulo.', color: 'blue',    startTime: '5:00 PM', endTime: '6:30 PM' },
  { id: 'c14', title: 'ICPC Practice — Ronda #3', date: '2026-11-08', host: 'Competitive Prog.', location: 'Lab Cómputo 101', desc: 'Tercera ronda con problemas de dificultad media-alta.', color: 'crimson', startTime: '10:00 AM', endTime: '3:00 PM' },
  { id: 'c15', title: 'Hackathon UCSP 2026', date: '2026-11-12', host: 'Comité Competencias', location: 'Lab Innovación F',   desc: '24 horas para innovar. Forma tu equipo de hasta 4 personas.', color: 'red',     startTime: '8:00 AM', endTime: '8:00 AM+1' },
  { id: 'c16', title: 'Clausura Hackathon', date: '2026-11-13', host: 'Comité Competencias', location: 'Auditorio SJP II',    desc: 'Presentación de proyectos y ceremonia de premiación.', color: 'orange', startTime: '10:00 AM', endTime: '1:00 PM' },
  { id: 'c17', title: 'ACM Social Hour', date: '2026-11-13', host: 'Comité Social',          location: 'Sala Cómputo 201',       desc: 'Social Hour post-Hackathon.', color: 'blue',    startTime: '5:00 PM', endTime: '6:30 PM' },
  { id: 'c18', title: 'Charla: Carrera en Big Tech', date: '2026-11-17', host: 'Outreach',  location: 'Auditorio SJP II',    desc: 'Invitado especial: ex-Googler comparte su experiencia profesional.', color: 'navy',   startTime: '6:00 PM', endTime: '8:00 PM' },
  { id: 'c19', title: 'ACM Social Hour', date: '2026-11-20', host: 'Comité Social',          location: 'Sala Cómputo 201',       desc: 'Networking semanal.', color: 'blue',    startTime: '5:00 PM', endTime: '6:30 PM' },
  { id: 'c20', title: 'Workshop: Docker & Devops', date: '2026-11-24', host: 'Comité Académico', location: 'Lab Info 2',      desc: 'Containerización con Docker y fundamentos de CI/CD.', color: 'teal',   startTime: '3:00 PM', endTime: '5:30 PM' },
  { id: 'c21', title: 'ACM Social Hour', date: '2026-11-27', host: 'Comité Social',          location: 'Sala Cómputo 201',       desc: 'Último evento de noviembre.', color: 'blue',    startTime: '5:00 PM', endTime: '6:30 PM' }
];

/* ------------------------------------------------------------------
   INICIALIZACIÓN
   ------------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', () => {
  allEvents = CALENDAR_EVENTS;

  // Si calendar-sync.js cargó eventos de Google Calendar, combinarlos
  if (window.ACM_CALENDAR_SYNC?.DEMO_EVENTS) {
    // Los DEMO_EVENTS de calendar-sync.js ya están incluidos en CALENDAR_EVENTS
    // Para producción: allEvents = [...CALENDAR_EVENTS, ...fetchedEvents];
  }

  renderCalendar(currentDate);
  bindCalendarControls();
});

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
      const hostMatch = !filter || ev.host.toLowerCase().includes(filter.toLowerCase());
      return match && hostMatch;
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

  document.getElementById('detailsBadge').textContent   = event.host;
  document.getElementById('detailsTitle').textContent   = event.title;
  document.getElementById('detailsDate').textContent    = `${formatDayForDisplay(event.date)} · ${event.startTime} – ${event.endTime}`;
  document.getElementById('detailsLocation').textContent = event.location;
  document.getElementById('detailsHost').textContent    = `Organizado por ${event.host}`;
  document.getElementById('detailsDesc').textContent    = event.desc;

  // Actualizar botón de Google Calendar
  const gcalBtn = document.getElementById('btnAddSingleEvent');
  if (gcalBtn && window.ACM_UCSP) {
    const startISO = `${event.date}T${convertTo24h(event.startTime)}:00-05:00`;
    const endISO   = `${event.date}T${convertTo24h(event.endTime)}:00-05:00`;
    const gcalURL  = window.ACM_UCSP.buildGCalURL({
      title: event.title,
      startISO, endISO,
      location: event.location,
      description: event.desc
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
        if (query.length === 0) {
          allEvents = CALENDAR_EVENTS;
        } else {
          allEvents = CALENDAR_EVENTS.filter(ev =>
            ev.title.toLowerCase().includes(query) ||
            ev.host.toLowerCase().includes(query) ||
            ev.location.toLowerCase().includes(query)
          );
        }
        renderCalendar(currentDate);
      }, 250);
    });
  }

  // Botón "Agregar todos los eventos al calendario"
  document.getElementById('btnAddAllEvents')?.addEventListener('click', () => {
    // Genera una URL de iCal o abre Google Calendar en modo de suscripción
    const calFeed = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent('acm.ucsp@ucsp.edu.pe')}`;
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

/** Convierte "5:00 PM" → "17:00" para construir ISO strings */
function convertTo24h(timeStr) {
  if (!timeStr || timeStr.includes('+')) return '00:00'; // manejo de +1 día
  const [time, period] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}
