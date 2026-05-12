// ═══════════════════════════════════════════════════════════════════════
// ZENITH 2026 — IMPROVED UI LOGIC
// ═══════════════════════════════════════════════════════════════════════

// Subject metadata: { color class, accent hex (for left-bar), initial }
const SUBJECTS = {
  'Mathematics':    { cls: 'c-math',    bar: '#FBBF24', i: 'M' },
  'E Math':         { cls: 'c-emath',   bar: '#FBBF24', i: 'M' },
  'A Math':         { cls: 'c-amath',   bar: '#3B82F6', i: 'A' },
  'Pure Physics':   { cls: 'c-physics', bar: '#F43F5E', i: 'P' },
  'Physics':        { cls: 'c-physics', bar: '#F43F5E', i: 'P' },
  'Pure Chemistry': { cls: 'c-chem',    bar: '#10B981', i: 'C' },
  'Chemistry':      { cls: 'c-chem',    bar: '#10B981', i: 'C' },
  'Biology':        { cls: 'c-bio',     bar: '#22C55E', i: 'B' },
  'English':        { cls: 'c-english', bar: '#38BDF8', i: 'E' },
  'General Paper':  { cls: 'c-gp',      bar: '#FB923C', i: 'G' },
  'Economics':      { cls: 'c-econ',    bar: '#6366F1', i: 'E' },
};

const TUTORS = [
  { name: 'Mr Marcus Tan',     credentials: 'NUS 1st-Class Hons · 12 yrs · 95% A/B',   color: '#7C3AED' },
  { name: 'Ms Priya Raj',      credentials: 'NTU MSc · MOE-trained · 9 yrs',           color: '#0891B2' },
  { name: 'Dr Wei Lin Chen',   credentials: 'PhD Physics NUS · 14 yrs',                color: '#BE123C' },
  { name: 'Ms Sarah Lim',      credentials: 'Cambridge BA · IB Examiner · 11 yrs',     color: '#059669' },
  { name: 'Mr Daniel Foo',     credentials: 'NTU 1st-Class Hons · 8 yrs',              color: '#D97706' },
  { name: 'Ms Joanne Koh',     credentials: 'NUS Hons · Ex-MOE HoD · 15 yrs',          color: '#DB2777' },
];

// Mock classes — each is a real schedule slot
// fields: day (0=Mon), start (24h hour), duration, subject, level, centre, tutorIdx, capacity, booked
const CLASSES = [
  { id:'c01', day:0, start:10, dur:2, subject:'Mathematics',    level:'S3', stream:'Sec Express', centre:'Bishan',      tutor:0, cap:14, booked:9 },
  { id:'c02', day:0, start:14, dur:2, subject:'Mathematics',    level:'S3', stream:'Sec Express', centre:'Tampines',    tutor:1, cap:14, booked:14 },
  { id:'c03', day:1, start:9,  dur:2, subject:'A Math',         level:'S3', stream:'Sec Express', centre:'Clementi',    tutor:4, cap:12, booked:7 },
  { id:'c04', day:1, start:16, dur:2, subject:'Pure Physics',   level:'S3', stream:'Sec Express', centre:'Bishan',      tutor:2, cap:12, booked:11 },
  { id:'c05', day:2, start:9,  dur:2, subject:'Mathematics',    level:'S3', stream:'Sec Express', centre:'Clementi',    tutor:0, cap:14, booked:5 },
  { id:'c06', day:2, start:15, dur:2, subject:'Mathematics',    level:'S3', stream:'Sec Express', centre:'Online',      tutor:1, cap:18, booked:13 },
  { id:'c07', day:2, start:18, dur:2, subject:'A Math',         level:'S3', stream:'Sec Express', centre:'Bishan',      tutor:4, cap:12, booked:10 },
  { id:'c08', day:3, start:10, dur:2, subject:'Pure Physics',   level:'S3', stream:'Sec Express', centre:'Tampines',    tutor:2, cap:12, booked:6 },
  { id:'c09', day:3, start:15, dur:2, subject:'Pure Chemistry', level:'S3', stream:'Sec Express', centre:'Clementi',    tutor:3, cap:12, booked:8 },
  { id:'c10', day:4, start:10, dur:2, subject:'Mathematics',    level:'S3', stream:'Sec Express', centre:'Tampines',    tutor:0, cap:14, booked:12 },
  { id:'c11', day:4, start:16, dur:2, subject:'Pure Chemistry', level:'S3', stream:'Sec Express', centre:'Bishan',      tutor:3, cap:12, booked:4 },
  { id:'c12', day:5, start:10, dur:2, subject:'Pure Physics',   level:'S3', stream:'Sec Express', centre:'Tan Kah Kee', tutor:2, cap:12, booked:6 },
  { id:'c13', day:5, start:14, dur:2, subject:'Mathematics',    level:'S3', stream:'Sec Express', centre:'Bishan',      tutor:0, cap:14, booked:9 },
  { id:'c14', day:5, start:18, dur:2, subject:'Pure Chemistry', level:'S3', stream:'Sec Express', centre:'Clementi',    tutor:3, cap:12, booked:11 },
  { id:'c15', day:6, start:11, dur:2, subject:'A Math',         level:'S3', stream:'Sec Express', centre:'Online',      tutor:4, cap:18, booked:14 },
  { id:'c16', day:6, start:14, dur:2, subject:'English',        level:'S3', stream:'Sec Express', centre:'Bishan',      tutor:5, cap:14, booked:3 },
];

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const DAYS_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const DAY_DATES = ['Mon 6 Jan','Tue 7 Jan','Wed 8 Jan','Thu 9 Jan','Fri 10 Jan','Sat 11 Jan','Sun 12 Jan'];
const HOURS = [9,10,11,12,13,14,15,16,17,18,19,20];

// ─── State ───────────────────────────────────────────────────
const state = {
  stream: 'Sec Express',
  level: '',
  subject: '',
  centre: '',
  timeOfDay: '',
  query: '',
  view: 'calendar',
  shortlist: new Set(),
};

// ─── Helpers ─────────────────────────────────────────────────
function seatStatus(c) {
  const remaining = c.cap - c.booked;
  if (remaining <= 0) return { status:'full', remaining:0, pct:100 };
  if (remaining <= 3) return { status:'few', remaining, pct: c.booked/c.cap*100 };
  return { status:'ok', remaining, pct: c.booked/c.cap*100 };
}

function hourLabel(h) {
  const ap = h >= 12 ? 'PM' : 'AM';
  const hh = h > 12 ? h - 12 : (h === 0 ? 12 : h);
  return hh + ' ' + ap;
}
function timeRange(start, dur) {
  const fmt = h => String(h).padStart(2,'0') + ':00';
  return fmt(start) + ' – ' + fmt(start + dur);
}

function matchesFilters(c) {
  if (state.stream && c.stream !== state.stream) return false;
  if (state.level && c.level !== state.level) return false;
  if (state.subject && c.subject !== state.subject) return false;
  if (state.centre && c.centre !== state.centre) return false;
  if (state.timeOfDay) {
    // (time-of-day filter removed)
  }
  if (state.query) {
    const q = state.query.toLowerCase();
    const hay = (c.subject + ' ' + c.level + ' ' + c.centre).toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function filtered() { return CLASSES.filter(matchesFilters); }

// ─── Render: filter bar summary chips + counts ──────────────
function renderSummary() {
  const result = filtered();
  document.getElementById('summary-count').innerHTML =
    `<b>${result.length}</b> ${result.length === 1 ? 'class' : 'classes'} <span class="muted">this week</span>`;

  const chips = document.getElementById('summary-chips');
  chips.innerHTML = '';
  const xSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  const addChip = (key, label) => {
    const el = document.createElement('div');
    el.className = 'summary-chip';
    el.innerHTML = `${label}<button data-key="${key}" aria-label="Remove ${label}">${xSvg}</button>`;
    el.querySelector('button').onclick = () => { state[key] = ''; rerender(); };
    chips.appendChild(el);
  };
  if (state.level)   addChip('level',   state.level);
  if (state.subject) addChip('subject', state.subject);
  if (state.centre)  addChip('centre',  state.centre);
  if (state.timeOfDay) addChip('timeOfDay', state.timeOfDay[0].toUpperCase() + state.timeOfDay.slice(1));
  if (state.query)   addChip('query',   '"' + state.query + '"');

  const hasFilters = state.level || state.subject || state.centre || state.timeOfDay || state.query;
  document.getElementById('summary-clear').style.display = hasFilters ? '' : 'none';

  // Update mobile filter button badge
  const count = (state.level?1:0) + (state.subject?1:0) + (state.centre?1:0) + (state.timeOfDay?1:0);
  const badge = document.getElementById('mob-filter-badge');
  if (count > 0) { badge.style.display = ''; badge.textContent = count; }
  else { badge.style.display = 'none'; }

  // Stream counts
  document.querySelectorAll('[data-stream]').forEach(btn => {
    const s = btn.dataset.stream;
    const n = CLASSES.filter(c => c.stream === s).length;
    btn.querySelector('.count').textContent = n;
    btn.classList.toggle('active', state.stream === s);
  });

  // Shortlist count
  const sc = document.getElementById('shortlist-count');
  const sb = document.getElementById('shortlist-btn');
  if (state.shortlist.size > 0) {
    sc.textContent = state.shortlist.size;
    sb.style.display = '';
    document.getElementById('bnav-shortlist-badge').style.display = '';
    document.getElementById('bnav-shortlist-badge').textContent = state.shortlist.size;
  } else {
    sb.style.display = 'none';
    document.getElementById('bnav-shortlist-badge').style.display = 'none';
  }

  // Select "has-value" highlighting
  ['level','subject','centre'].forEach(k => {
    const el = document.getElementById('sel-' + k);
    if (el) el.classList.toggle('has-value', !!state[k]);
  });
}

// ─── Render: calendar ───────────────────────────────────────
function renderCalendar() {
  const head = document.getElementById('cal-head');
  head.innerHTML = '<div></div>' + DAYS_SHORT.map((d,i) => {
    const dayClasses = filtered().filter(c => c.day === i).length;
    return `<div class="day">${d}<span class="count">${dayClasses ? dayClasses + ' classes' : '—'}</span></div>`;
  }).join('');

  const grid = document.getElementById('cal-grid');
  grid.innerHTML = '';
  // Render time slots + cells
  for (let r = 0; r < HOURS.length; r++) {
    const t = document.createElement('div');
    t.className = 'cal-time';
    t.textContent = hourLabel(HOURS[r]);
    grid.appendChild(t);
    for (let d = 0; d < 7; d++) {
      const cell = document.createElement('div');
      cell.className = 'cal-cell';
      grid.appendChild(cell);
    }
  }

  // Now overlay (Wednesday 11:30am as decorative marker)
  const nowH = 11.5, nowD = 2;
  const nowY = (nowH - HOURS[0]) * 64;
  const now = document.createElement('div');
  now.className = 'cal-now';
  now.style.top = nowY + 'px';
  // start at day col
  now.style.left = `calc(60px + ${nowD} * ((100% - 60px) / 7))`;
  now.style.width = `calc((100% - 60px) / 7)`;
  grid.appendChild(now);

  // Events
  filtered().forEach(c => {
    const meta = SUBJECTS[c.subject];
    const seat = seatStatus(c);
    const isFullEv = seat.status === 'full';
    const top = (c.start - HOURS[0]) * 64 + 2;
    const height = c.dur * 64 - 4;
    // Position over the appropriate cell using grid math
    const ev = document.createElement('div');
    ev.className = 'cal-event ' + meta.cls + (isFullEv ? ' full' : '');
    ev.style.position = 'absolute';
    ev.style.top = top + 'px';
    ev.style.height = height + 'px';
    ev.style.left = `calc(60px + ${c.day} * ((100% - 60px) / 7) + 3px)`;
    ev.style.width = `calc((100% - 60px) / 7 - 6px)`;
    const isSaved = state.shortlist.has(c.id);
    ev.innerHTML = `
      <div class="cal-event-title">${c.level} ${c.subject}</div>
      <div class="cal-event-sub">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
        ${c.centre}
      </div>
      <button class="cal-event-bookmark ${isSaved ? 'saved' : ''}" data-id="${c.id}" aria-label="Save">
        <svg viewBox="0 0 24 24" fill="${isSaved?'currentColor':'none'}" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
      </button>
    `;
    ev.onclick = (e) => {
      if (e.target.closest('.cal-event-bookmark')) {
        e.stopPropagation();
        toggleShortlist(c.id);
        return;
      }
      openModal(c);
    };
    grid.appendChild(ev);
  });
}

// ─── Render: list ──────────────────────────────────────────
function renderList() {
  const wrap = document.getElementById('list-wrap');
  wrap.innerHTML = '';
  const all = filtered();
  if (all.length === 0) {
    wrap.innerHTML = renderEmpty('No classes match your filters.', 'Try removing a filter or clearing them all.');
    return;
  }

  for (let d = 0; d < 7; d++) {
    const dayClasses = all.filter(c => c.day === d).sort((a,b) => a.start - b.start);
    if (dayClasses.length === 0) continue;
    const block = document.createElement('div');
    block.className = 'day-block';
    block.innerHTML = `
      <div class="day-h">
        <span class="name">${DAYS[d]}</span>
        <span class="date">${DAY_DATES[d]}</span>
        <span class="pill">${dayClasses.length} ${dayClasses.length === 1 ? 'class' : 'classes'}</span>
      </div>
      <div class="cards"></div>
    `;
    const cards = block.querySelector('.cards');
    dayClasses.forEach(c => cards.appendChild(renderCard(c)));
    wrap.appendChild(block);
  }
}

function renderEmpty(h, p) {
  return `
    <div class="empty-state">
      <div class="illus">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
          <circle cx="12" cy="16" r="2"/>
        </svg>
      </div>
      <h3>${h}</h3>
      <p>${p}</p>
      <div class="empty-cta">
        <button class="btn btn-secondary" onclick="clearFilters()">Clear filters</button>
      </div>
    </div>`;
}

function renderCard(c) {
  const meta = SUBJECTS[c.subject];
  const tutor = TUTORS[c.tutor];
  const seat = seatStatus(c);
  const isFull = seat.status === 'full';
  const isSaved = state.shortlist.has(c.id);

  const el = document.createElement('div');
  el.className = 'card ' + meta.cls + (isFull ? ' is-full' : '');

  el.innerHTML = `
    <div class="accent"></div>
    <div class="card-body">
      <div class="card-top">
        <div class="card-subject">
          <span class="level">${c.level}</span>${c.subject}
          ${isFull ? '<span class="full-tag" style="margin-left:6px;vertical-align:2px;">Full</span>' : ''}
        </div>
        <button class="bookmark ${isSaved ? 'saved' : ''}" data-bookmark="${c.id}" aria-label="${isSaved ? 'Remove from shortlist' : 'Add to shortlist'}">
          <svg viewBox="0 0 24 24" fill="${isSaved?'currentColor':'none'}" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
        </button>
      </div>
      <div class="card-meta">
        <div class="card-meta-row">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <b>${timeRange(c.start, c.dur)}</b>
        </div>
        <div class="card-meta-row">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          ${c.centre}
        </div>
      </div>
    </div>
    <div class="card-actions">
      ${isFull ? `
        <button class="btn btn-full-state" disabled>This class is currently full</button>
      ` : `
        <button class="btn btn-primary" data-action="trial" data-id="${c.id}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          Free Trial
        </button>
        <button class="btn btn-secondary" data-action="register" data-id="${c.id}">Register</button>
      `}
    </div>
  `;
  el.querySelector('[data-bookmark]').onclick = e => { e.stopPropagation(); toggleShortlist(c.id); };
  el.onclick = (e) => {
    if (e.target.closest('button')) return;
    openModal(c);
  };
  return el;
}

// ─── Shortlist ─────────────────────────────────────────────
function toggleShortlist(id) {
  if (state.shortlist.has(id)) state.shortlist.delete(id);
  else state.shortlist.add(id);
  rerender();
}

function renderDrawer() {
  const body = document.getElementById('drawer-body');
  if (state.shortlist.size === 0) {
    body.innerHTML = `
      <div class="drawer-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
        Nothing saved yet.<br/>Tap the bookmark icon on any class to shortlist it for comparison.
      </div>`;
    document.getElementById('drawer-foot').style.display = 'none';
    return;
  }
  document.getElementById('drawer-foot').style.display = '';
  body.innerHTML = '';
  [...state.shortlist].forEach(id => {
    const c = CLASSES.find(x => x.id === id);
    if (!c) return;
    const meta = SUBJECTS[c.subject];
    const seat = seatStatus(c);
    const row = document.createElement('div');
    row.className = 'shortlist-row ' + meta.cls;
    row.innerHTML = `
      <div class="info">
        <div class="title">${c.level} ${c.subject}</div>
        <div class="sub">${DAYS_SHORT[c.day]} · ${timeRange(c.start,c.dur)} · ${c.centre}</div>
      </div>
      <button class="remove" aria-label="Remove">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    `;
    row.querySelector('.remove').onclick = () => toggleShortlist(id);
    row.onclick = (e) => { if (!e.target.closest('.remove')) { closeDrawer(); openModal(c); }};
    body.appendChild(row);
  });
}

function openDrawer() {
  document.getElementById('drawer').classList.add('open');
  document.getElementById('drawer-backdrop').classList.add('open');
  renderDrawer();
}
function closeDrawer() {
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('drawer-backdrop').classList.remove('open');
}

// ─── Modal ─────────────────────────────────────────────────
function openModal(c) {
  const meta = SUBJECTS[c.subject];
  const tutor = TUTORS[c.tutor];
  const seat = seatStatus(c);
  const isFull = seat.status === 'full';

  const hero = document.getElementById('modal-hero');
  hero.className = 'modal-hero ' + meta.cls;
  document.getElementById('modal-eyebrow').textContent = c.stream + ' · ' + c.level;
  document.getElementById('modal-title').textContent = c.subject;
  document.getElementById('modal-sub').textContent = `${DAYS[c.day]} ${DAY_DATES[c.day].split(' ').slice(1).join(' ')} · ${timeRange(c.start,c.dur)} · ${c.centre}`;

  // Tile values
  document.getElementById('m-time').textContent = timeRange(c.start, c.dur);
  document.getElementById('m-venue').textContent = c.centre;

  // Actions
  document.getElementById('modal-actions').innerHTML = isFull ? `
    <button class="btn btn-full-state" disabled style="flex:1">This class is currently full</button>
  ` : `
    <button class="btn btn-primary" style="flex:1.4">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
      Sign up for Free Trial
    </button>
    <button class="btn btn-secondary">Register Now</button>
  `;

  document.getElementById('modal').classList.add('open');
}
function closeModal() { document.getElementById('modal').classList.remove('open'); }

// ─── Filter UI handlers ────────────────────────────────────
function clearFilters() {
  state.level = ''; state.subject = ''; state.centre = '';
  state.timeOfDay = ''; state.query = '';
  document.getElementById('search-input').value = '';
  ['sel-level','sel-subject','sel-centre'].forEach(id => { document.getElementById(id).value = ''; });
  document.querySelectorAll('[data-tod]').forEach(b => b.classList.remove('active'));
  rerender();
}

function selectStream(s) {
  state.stream = s;
  // Reset other filters per spec
  state.level = ''; state.subject = ''; state.centre = '';
  document.getElementById('search-input').value = ''; state.query = '';
  ['sel-level','sel-subject','sel-centre'].forEach(id => { document.getElementById(id).value = ''; });
  document.querySelectorAll('[data-tod]').forEach(b => b.classList.remove('active'));
  rerender();
}

function switchView(v) {
  state.view = v;
  document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('panel-' + v).classList.add('active');
  document.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === v));
  document.querySelectorAll('[data-bnav]').forEach(b => {
    if (b.dataset.bnav === 'calendar' || b.dataset.bnav === 'list')
      b.classList.toggle('active', b.dataset.bnav === v);
  });
}

// ─── Bottom sheet (mobile) ────────────────────────────────
function openSheet() {
  // Sync chip states from current filters
  document.querySelectorAll('.sheet-chip').forEach(c => {
    const g = c.dataset.group, v = c.dataset.value;
    c.classList.toggle('active', state[g] === v);
  });
  document.getElementById('sheet-backdrop').classList.add('open');
}
function closeSheet() { document.getElementById('sheet-backdrop').classList.remove('open'); }

// ─── Tweaks ───────────────────────────────────────────────
function setTweak(group, value) {
  document.body.classList.remove(...['density-comfortable','density-normal','density-compact','accent-amber','accent-emerald','accent-rose','theme-indigo','theme-slate','theme-teal'].filter(c => c.startsWith(group + '-')));
  document.body.classList.add(group + '-' + value);
  document.querySelectorAll(`[data-tweak="${group}"]`).forEach(b => b.classList.toggle('active', b.dataset.value === value));
}

// ─── Boot ─────────────────────────────────────────────────
function rerender() {
  renderSummary();
  renderCalendar();
  renderList();
}

function toggleBanner() {
  const banner = document.getElementById('banner');
  // Desktop: toggle collapsed state
  if (window.matchMedia('(min-width: 1024px)').matches) {
    banner.classList.toggle('collapsed');
    try { localStorage.setItem('banner-collapsed', banner.classList.contains('collapsed') ? '1' : '0'); } catch (e) {}
    return;
  }
  // Mobile: toggle body
  const body = document.getElementById('banner-mob-body');
  const chev = document.getElementById('banner-mob-chev');
  body.classList.toggle('open');
  chev.classList.toggle('open');
}

function collapseBanner() {
  const banner = document.getElementById('banner');
  banner.classList.add('collapsed');
  try { localStorage.setItem('banner-collapsed', '1'); } catch (e) {}
}

document.addEventListener('DOMContentLoaded', () => {
  // Set default density tweak
  setTweak('density', 'normal');
  setTweak('accent', 'amber');
  setTweak('theme', 'indigo');

  // Stream buttons
  document.querySelectorAll('[data-stream]').forEach(btn => {
    btn.onclick = () => selectStream(btn.dataset.stream);
  });

  // Selects
  ['level','subject','centre'].forEach(k => {
    document.getElementById('sel-' + k).onchange = (e) => { state[k] = e.target.value; rerender(); };
  });

  // Time of day
  document.querySelectorAll('[data-tod]').forEach(b => {
    b.onclick = () => {
      const v = b.dataset.tod;
      state.timeOfDay = state.timeOfDay === v ? '' : v;
      document.querySelectorAll('[data-tod]').forEach(x => x.classList.toggle('active', x.dataset.tod === state.timeOfDay));
      rerender();
    };
  });

  // Search
  document.getElementById('search-input').addEventListener('input', (e) => {
    state.query = e.target.value.trim();
    rerender();
  });

  // View toggle
  document.querySelectorAll('[data-view]').forEach(b => { b.onclick = () => switchView(b.dataset.view); });

  // Bottom nav
  document.querySelectorAll('[data-bnav]').forEach(b => {
    b.onclick = () => {
      const v = b.dataset.bnav;
      if (v === 'filter') openSheet();
      else if (v === 'shortlist') openDrawer();
      else switchView(v);
    };
  });

  // Sheet chips
  document.querySelectorAll('.sheet-chip').forEach(c => {
    c.onclick = () => {
      const g = c.dataset.group, v = c.dataset.value;
      // Toggle behaviour: clicking active deselects
      state[g] = state[g] === v ? '' : v;
      document.querySelectorAll(`.sheet-chip[data-group="${g}"]`).forEach(x => x.classList.toggle('active', state[g] === x.dataset.value));
      // Reflect into selects on desktop
      if (g === 'level' || g === 'subject' || g === 'centre') {
        const sel = document.getElementById('sel-' + g);
        if (sel) sel.value = state[g] || '';
      }
      rerender();
    };
  });

  // Summary actions
  document.getElementById('summary-clear').onclick = clearFilters;
  document.getElementById('shortlist-btn').onclick = openDrawer;

  // Drawer
  document.getElementById('drawer-close').onclick = closeDrawer;
  document.getElementById('drawer-backdrop').onclick = closeDrawer;
  document.getElementById('drawer-clear').onclick = () => { state.shortlist.clear(); rerender(); renderDrawer(); };

  // Sheet
  document.getElementById('sheet-backdrop').onclick = (e) => { if (e.target.id === 'sheet-backdrop') closeSheet(); };
  document.getElementById('sheet-apply').onclick = closeSheet;
  document.getElementById('sheet-clear').onclick = () => { clearFilters(); };

  // Modal
  document.getElementById('modal').addEventListener('click', (e) => {
    if (e.target.id === 'modal') closeModal();
  });
  document.getElementById('modal-close').onclick = closeModal;
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeModal(); closeDrawer(); closeSheet(); }
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      document.getElementById('search-input').focus();
    }
  });

  // Tweaks
  document.querySelectorAll('[data-tweak]').forEach(b => {
    b.onclick = () => setTweak(b.dataset.tweak, b.dataset.value);
  });
  document.getElementById('tweaks-toggle').onclick = () => document.getElementById('tweaks').classList.toggle('open');
  document.getElementById('tweaks-close').onclick = () => document.getElementById('tweaks').classList.remove('open');

  // Banner toggle
  document.getElementById('banner-toggle').onclick = toggleBanner;
  const dCollapse = document.getElementById('banner-collapse-desktop');
  if (dCollapse) dCollapse.onclick = collapseBanner;
  try {
    if (localStorage.getItem('banner-collapsed') === '1') {
      document.getElementById('banner').classList.add('collapsed');
    }
  } catch (e) {}

  rerender();
});
