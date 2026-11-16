const $ = (s, el = document) => el.querySelector(s);
const esc = (s = '') => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const paths = {
  heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
  home: 'm3 10 9-7 9 7v10H3Zm6 10v-7h6v7',
  check: 'm5 12 4 4L19 6',
  checklist: 'M9 5h12M9 12h12M9 19h12M3 5l1 1 2-2M3 12l1 1 2-2M3 19l1 1 2-2',
  calendar: 'M5 5h14a2 2 0 0 1 2 2v13H3V7a2 2 0 0 1 2-2ZM7 3v4m10-4v4M3 10h18m-13 4h2m4 0h2m-8 3h2',
  chat: 'M21 11a9 9 0 0 1-9 9 10 10 0 0 1-4-.9L3 21l1.9-5A9 9 0 1 1 21 11ZM8 10h8m-8 4h5',
  book: 'M12 5c-3-2-7-2-10-1v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-3-1-7-1-10 1Zm0 0v15',
  settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM9 3h6l1 3 3 1 2 5-2 4-3 1-1 4H9l-1-4-3-1-2-4 2-5 3-1Z',
  arrow: 'M5 12h14m-5-5 5 5-5 5',
  chevron: 'm9 5 7 7-7 7',
  left: 'm15 5-7 7 7 7',
  plus: 'M12 5v14M5 12h14',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.9M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8-7.9a4 4 0 0 1 0 7.8',
  wallet: 'M20 7V4H5a3 3 0 0 0 0 6h16v10H5a3 3 0 0 1-3-3V7m19 6h-6v4h6m-3-2h.01',
  building: 'M3 21h18M5 21V9l7-6 7 6v12M9 21v-6h6v6M9 10h.01M15 10h.01',
  sparkles: 'm12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4Zm8-2v4m-2-2h4',
  flower: 'M12 10C3-1 1 12 10 12 0 21 14 24 12 14c9 10 17-2 2-2 12-7-1-16-2-2ZM12 14v9m0-4c4-6 8-3 0 3',
  camera: 'M3 7h4l2-3h6l2 3h4v13H3ZM12 10a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
  clock: 'M12 8v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  link: 'm10 13 4-4m-6 6-1 1a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m0 14a4 4 0 0 0 6 0l5-5a4 4 0 0 0-6-6l-1 1',
  search: 'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
  edit: 'm15 4 5 5M4 20l5-1L21 7l-5-5L4 14Z',
  close: 'm6 6 12 12M6 18 18 6',
  send: 'm22 2-7 20-4-9-9-4Zm0 0L11 13',
  pin: 'm16 3 5 5-5 2-2 6-3-3-6 8 4-10-3-3 6-2Z',
  download: 'M12 3v12m-5-5 5 5 5-5M3 16v5h18v-5',
  menu: 'M4 6h16M4 12h16M4 18h16'
};
const icon = name => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.heart}"/></svg>`;
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
const fmt = (value, options = {}) => new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', timeZone: 'Asia/Bangkok', ...options }).format(new Date(value.length === 10 ? `${value}T12:00:00+07:00` : /Z$|\+\d\d:\d\d$/.test(value) ? value : `${value}+07:00`));
const money = v => new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 }).format(v);
const bahtFormatter = new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const baht = cents => bahtFormatter.format(cents / 100);
const pageTitles = { overview: 'ภาพรวมของเรา', checklist: 'เช็กลิสต์เตรียมงาน', calendar: 'ปฏิทิน & กำหนดการ', chat: 'ห้องคุยของเรา', finance: 'การเงินของเรา', guide: 'คู่มือเตรียมงาน' };
let expenseSearch = '', expenseFilter = 'all';
let state, demo = false, page = 'overview', topic = 'vision', filter = 'pending', owner = 'all', topicFilter = 'all', search = '', online = true;
let month = today().slice(0, 7), lastState = '', busy = false, pendingInvite = new URLSearchParams(location.hash.slice(1)).get('join');
const drafts = new Map();
const modal = $('#modal');

async function api(path, method = 'GET', data) {
  const response = await fetch(`/api/${path}`, { method, credentials: 'same-origin', ...(data !== undefined ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) } : {}) });
  const result = await response.json();
  if (!response.ok) throw Object.assign(new Error(result.error || 'เชื่อมต่อไม่สำเร็จ'), { status: response.status });
  return result;
}
let toastTimer;
function toast(text) { $('#toast').textContent = text; $('#toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 3500); }
const name = who => who === 'both' ? 'ด้วยกัน' : state.room[who];
const avatar = who => `<span class="avatar ${who}" title="${esc(name(who))}">${who === 'both' ? icon('heart') : esc(name(who).slice(0, 1))}</span>`;
const pair = () => `<div class="avatar-pair">${avatar('bride')}${avatar('groom')}</div>`;
const findTopic = id => state.topics.find(t => t.id === id);
const topicSymbol = t => `<span class="topic-symbol ${t.color}">${icon(t.icon)}</span>`;
const pending = () => state.tasks.filter(t => !t.done).sort((a, b) => a.due.localeCompare(b.due));
const overdue = t => !t.done && new Date(`${t.due}+07:00`) < new Date();

async function refresh(force = false) {
  if (demo || busy) return;
  const next = await api('state');
  const fingerprint = JSON.stringify(next);
  state = next; online = true;
  if (fingerprint !== lastState || force) { lastState = fingerprint; render(); }
  else updateSync();
}
function updateSync() {
  const el = $('.sync');
  if (el) { el.classList.toggle('offline', !online); el.innerHTML = `<span class="dot"></span>${demo ? 'พื้นที่ตัวอย่าง' : online ? 'บันทึกและซิงก์แล้ว' : 'กำลังเชื่อมต่อใหม่'}`; }
}
function render() {
  const active = document.activeElement;
  const focus = active?.closest('#app') && active.id ? { id: active.id, value: active.value, start: active.selectionStart, end: active.selectionEnd } : null;
  const scroll = $('.conversation');
  const scrollPosition = scroll && { top: scroll.scrollTop, bottom: scroll.scrollHeight - scroll.clientHeight - scroll.scrollTop < 80 };
  const navigation = [['overview', 'home'], ['checklist', 'checklist'], ['calendar', 'calendar'], ['chat', 'chat'], ['finance', 'wallet'], ['guide', 'book']];
  $('#app').innerHTML = `<div class="app-shell">
    <aside class="sidebar" aria-label="เมนูหลัก">
      <div class="brand-wrap"><div class="brand">ever after<span>.</span></div><p class="tagline">BETTER, TOGETHER.</p></div>
      <div class="side-label">OUR WEDDING SPACE</div>
      <nav class="navigation">${navigation.map(([id, glyph]) => `<button class="nav-btn ${page === id ? 'active' : ''}" data-action="nav" data-id="${id}" ${page === id ? 'aria-current="page"' : ''}>${icon(glyph)}${id === 'checklist' ? 'เช็กลิสต์ของเรา' : pageTitles[id]}${id === 'checklist' ? `<span class="nav-count">${pending().length}</span>` : ''}</button>`).join('')}</nav>
      <div class="sidebar-bottom"><div class="side-note">${icon('heart')}<p>งานแต่งที่ดีที่สุด<br>คือวันที่ <strong>เป็นเราสองคน</strong></p></div>
      <button class="nav-btn" data-action="settings">${icon('settings')}ตั้งค่าพื้นที่ของเรา</button>
      <div class="partner-card">${pair()}<div><strong>${esc(state.room.bride)} & ${esc(state.room.groom)}</strong><p class="small muted">${demo ? 'พื้นที่สำหรับเราสองคน' : `คุณคือ${state.role === 'bride' ? 'เจ้าสาว' : 'เจ้าบ่าว'} · ${esc(name(state.role))}`}</p></div></div></div>
    </aside>
    <div class="main-wrap"><header class="topbar"><div class="breadcrumb"><button class="mobile-menu" data-action="menu" aria-label="เปิดเมนู">${icon('menu')}</button><span class="home-crumb">พื้นที่ของเรา</span><span class="slash">/</span><b>${pageTitles[page]}</b></div><div class="top-actions"><span class="sync"><span class="dot"></span>${demo ? 'พื้นที่ตัวอย่าง' : online ? 'บันทึกและซิงก์แล้ว' : 'กำลังเชื่อมต่อใหม่'}</span><button class="btn" data-action="${demo ? 'start' : 'invite'}">${icon(demo ? 'plus' : 'link')}${demo ? 'เริ่มพื้นที่ของเรา' : 'ชวนคนข้าง ๆ'}</button>${pair()}</div></header>
    <main class="page" id="main-content">${demo ? `<div class="preview-notice"><span>ลองสำรวจพื้นที่ตัวอย่าง แล้วเริ่มวางแผนวันสำคัญของคุณ</span><button data-action="start">สร้างพื้นที่ฟรี ${icon('arrow')}</button></div>` : ''}
    <div class="content-fade">${({ overview, checklist, calendar, chat, finance: financePage, guide })[page]()}</div>
    <footer class="footer"><span>made for two, with ${icon('heart')} ever after.</span><span>ค่อย ๆ เตรียมทีละอย่าง ไปด้วยกัน</span></footer></main></div></div>`;
  updateSync();
  if (focus) {
    const el = document.getElementById(focus.id);
    if (el) { el.value = focus.value; el.focus({ preventScroll: true }); try { el.setSelectionRange(focus.start, focus.end); } catch {} }
  }
  const conversation = $('.conversation');
  if (conversation) conversation.scrollTop = !scrollPosition || scrollPosition.bottom ? conversation.scrollHeight : scrollPosition.top;
}
function heading(title, subtitle, action = '') {
  return `<div class="page-heading"><div><p class="eyebrow">OUR LITTLE JOURNEY</p><h1>${title}</h1><p>${subtitle}</p></div>${action || `<span class="date-chip">${icon('calendar')}${fmt(today(), { weekday: 'long', year: 'numeric' })}</span>`}</div>`;
}
function taskRow(t, detailed = false) {
  const cat = findTopic(t.topic);
  return `<div class="task-row ${t.done ? 'done' : ''}"><button class="check ${t.done ? 'checked' : ''}" data-action="toggle" data-id="${t.id}" role="checkbox" aria-checked="${t.done}" aria-label="${esc(`${t.done ? 'ยกเลิกเสร็จสิ้น' : 'ทำเสร็จแล้ว'}: ${t.title}`)}">${t.done ? icon('check') : ''}</button><div class="task-body"><button class="task-title" data-action="edit-task" data-id="${t.id}">${esc(t.title)}</button><div class="task-meta"><span class="pill ${cat.color}">${cat.name}</span><span class="${overdue(t) ? 'overdue' : ''}">${fmt(t.due)}${detailed ? ` · ${t.due.slice(11)} น.` : ''}${overdue(t) ? ' · เลยกำหนด' : ''}</span>${detailed && t.notes ? `<span title="${esc(t.notes)}">มีบันทึก</span>` : ''}</div></div>${avatar(t.owner)}${detailed ? `<button class="icon-btn" data-action="edit-task" data-id="${t.id}" aria-label="แก้ไข ${esc(t.title)}">${icon('edit')}</button>` : ''}</div>`;
}
function overview() {
  const done = state.tasks.filter(t => t.done).length;
  const percent = state.tasks.length ? Math.round(done / state.tasks.length * 100) : 0;
  const days = Math.ceil((new Date(`${state.room.weddingDate}T00:00:00+07:00`) - new Date(`${today()}T00:00:00+07:00`)) / 86400000);
  const week = pending().filter(t => new Date(`${t.due}+07:00`) <= new Date(Date.now() + 7 * 86400000)).length;
  const decisions = Object.values(state.decisions).filter(Boolean).length;
  return `${heading(`วางแผนวันของเรา ด้วยกัน <span style="color:#b996af;font-weight:400">♡</span>`, 'ทุกเรื่องเล็ก ๆ ที่เราช่วยกัน จะกลายเป็นวันสำคัญที่สวยงาม')}
    <section class="hero"><div class="hero-copy"><div class="hero-label">A LITTLE CLOSER TO FOREVER</div><h2>วันสำคัญของเรา<br>เริ่มจากการวางแผนด้วยกัน</h2><p>เก็บทุกไอเดีย คุยทุกเรื่อง แล้วค่อย ๆ ทำให้เป็นจริง</p><div class="hero-date">${icon('calendar')}${fmt(state.room.weddingDate, { year: 'numeric' })}<span>·</span><button data-action="settings" style="padding:0;color:inherit">${state.room.venue ? esc(state.room.venue) : 'เลือกสถานที่ของเรา'}</button></div></div><div class="hero-count">${days >= 0 ? `<strong>${days}</strong> DAYS TO GO` : 'HAPPILY EVER AFTER'}</div><img class="hero-art" src="/garden.svg" alt="ซุ้มแต่งงานท่ามกลางดอกไม้สีอ่อน"></section>
    <section class="stats" aria-label="ความคืบหน้า"><div class="stat"><div class="stat-title">${icon('checklist')}เตรียมพร้อมไปแล้ว</div><div class="stat-number">${percent}<small>%</small></div><div class="progress"><span style="width:${percent}%"></span></div><div class="stat-bottom">${done} จาก ${state.tasks.length} รายการ</div></div>
    <div class="stat"><div class="stat-title">${icon('clock')}โฟกัสใน 7 วันนี้</div><div class="stat-number">${week}<small>รายการ</small></div><div class="stat-bottom">${week ? 'รวมรายการที่ต้องตามต่อ' : 'มีเวลาเตรียมตัว ค่อย ๆ วางแผนได้เลย'}</div></div>
    <div class="stat"><div class="stat-title">${icon('wallet')}งบที่เราตั้งไว้</div><div class="stat-number" style="font-size:${state.room.budget > 999999 ? '22' : '27'}px">${state.room.budget ? money(state.room.budget) : '—'}<small>บาท</small></div><div class="stat-bottom"><button data-action="nav" data-id="finance" style="padding:0;color:inherit">จ่ายแล้ว ${baht(state.finance.payments.reduce((sum, p) => sum + p.amountCents, 0))} บาท · ดูการเงิน →</button></div></div>
    <div class="stat"><div class="stat-title">${icon('chat')}เรื่องที่เราตกลงกัน</div><div class="stat-number">${decisions}<small>/ ${state.topics.length} หัวข้อ</small></div><div class="stat-bottom">ทุกข้อสรุป อยู่ในห้องคุยของเรา</div></div></section>
    <div class="dashboard-grid"><section class="panel"><div class="panel-head"><div><h2>ค่อย ๆ เช็กไปด้วยกัน</h2><p>สิ่งที่เราควรเตรียมเป็นลำดับถัดไป</p></div><button class="btn text" data-action="add-task">${icon('plus')}เพิ่มรายการ</button></div><div class="task-list">${pending().slice(0, 5).map(t => taskRow(t)).join('') || '<div class="empty">เก่งมาก! เราเตรียมครบทุกอย่างแล้ว ♡</div>'}</div><div class="panel-foot"><span>เหลืออีก ${pending().length} รายการ ค่อย ๆ ไปด้วยกัน</span><button class="btn text" data-action="nav" data-id="checklist">ดูทั้งหมด ${icon('arrow')}</button></div></section>
    <section class="panel"><div class="panel-head"><div><h2>วันนี้เราคุยเรื่องอะไรดี?</h2><p>ไอเดียของเธอ + ไอเดียของฉัน = วันของเรา</p></div>${icon('chat')}</div><div class="topic-cards">${['vision', 'venue', 'budget'].map(id => { const t = findTopic(id); const messages = state.messages.filter(m => m.topic === id); return `<button class="topic-card" data-action="topic" data-id="${id}">${topicSymbol(t)}<div class="topic-info"><strong>${t.name}</strong><p>${esc(messages.at(-1)?.body || t.description)}</p></div>${icon('chevron')}</button>`; }).join('')}</div><p class="topics-hint">${icon('heart')}มีพื้นที่ให้ทุกไอเดียของเราสองคนเสมอ</p><div class="panel-foot"><span>${state.messages.length} ข้อความ · ${state.topics.length} หัวข้อ</span><button class="btn text" data-action="nav" data-id="chat">ไปห้องคุย ${icon('arrow')}</button></div></section>
    <section class="panel journey"><div class="panel-head"><div><h2>เส้นทางสู่วันสำคัญ</h2><p>แผนเริ่มต้นที่ปรับให้เข้ากับวันของเราได้</p></div><button class="btn text" data-action="nav" data-id="calendar">ดูปฏิทิน ${icon('arrow')}</button></div><div class="journey-line">${[['เริ่มจากเราสองคน', 'งบประมาณ · จำนวนแขก'], ['มองเห็นภาพงาน', 'สถานที่ · ชุด · ทีมงาน'], ['ใส่ใจรายละเอียด', 'การ์ด · อาหาร · พิธีการ'], ['เช็กให้พร้อม', 'ผังที่นั่ง · รันคิว · นัดหมาย'], ['วันของเรา ♡', fmt(state.room.weddingDate)]].map(([title, detail]) => `<div class="milestone"><h3>${title}</h3><p>${detail}</p></div>`).join('')}</div></section></div>`;
}
function checklist() {
  const tasks = state.tasks.filter(t => (filter === 'all' || (filter === 'done' ? t.done : !t.done)) && (owner === 'all' || t.owner === owner) && (topicFilter === 'all' || t.topic === topicFilter) && `${t.title} ${t.notes}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => a.due.localeCompare(b.due));
  return `${heading('ทุกเรื่องที่เราจะช่วยกัน', 'แบ่งหน้าที่ นัดเวลา แล้วเช็กสิ่งที่ทำเสร็จไปด้วยกัน', `<button class="btn primary" data-action="add-task">${icon('plus')}เพิ่มรายการ</button>`)}
    <div class="toolbar"><div class="search-field">${icon('search')}<input id="search" placeholder="ค้นหาสิ่งที่ต้องเตรียม…" value="${esc(search)}" aria-label="ค้นหารายการ"></div><select id="owner-filter" aria-label="กรองผู้รับผิดชอบ">${[['all', 'ทุกคน'], ['both', 'ทำด้วยกัน'], ['bride', `เจ้าสาว · ${state.room.bride}`], ['groom', `เจ้าบ่าว · ${state.room.groom}`]].map(([id, title]) => `<option value="${id}" ${owner === id ? 'selected' : ''}>${esc(title)}</option>`).join('')}</select><select id="topic-filter" aria-label="กรองหมวดหมู่"><option value="all">ทุกหมวดหมู่</option>${state.topics.map(t => `<option value="${t.id}" ${topicFilter === t.id ? 'selected' : ''}>${t.name}</option>`).join('')}</select></div>
    <div class="toolbar"><div class="filter-tabs">${[['pending', 'ยังต้องเตรียม'], ['done', 'ทำเรียบร้อย'], ['all', 'ทั้งหมด']].map(([id, title]) => `<button class="${filter === id ? 'selected' : ''}" data-action="filter" data-id="${id}">${title} (${state.tasks.filter(t => id === 'all' || (id === 'done' ? t.done : !t.done)).length})</button>`).join('')}</div><span class="small muted">พบ ${tasks.length} รายการ</span></div><section class="panel all-tasks"><div class="task-list">${tasks.map(t => taskRow(t, true)).join('') || '<div class="empty">ยังไม่มีรายการในหมวดนี้<br>ลองเปลี่ยนตัวกรอง หรือเพิ่มสิ่งที่เราอยากเตรียม</div>'}</div></section>`;
}
function calendar() {
  const first = new Date(`${month}-01T12:00:00Z`);
  const start = new Date(first); start.setUTCDate(1 - (first.getUTCDay() + 6) % 7);
  const end = new Date(first); end.setUTCMonth(end.getUTCMonth() + 1); end.setUTCDate(0);
  const cells = Math.ceil(((first.getUTCDay() + 6) % 7 + end.getUTCDate()) / 7) * 7;
  const monthTasks = state.tasks.filter(t => t.due.startsWith(month)).sort((a, b) => a.due.localeCompare(b.due));
  let grid = '';
  for (let i = 0; i < cells; i++) {
    const d = new Date(start); d.setUTCDate(d.getUTCDate() + i); const key = d.toISOString().slice(0, 10);
    const tasks = state.tasks.filter(t => t.due.startsWith(key)).sort((a, b) => a.due.localeCompare(b.due));
    const bills = state.finance.expenses.filter(e => e.due === key && expensePaid(e.id) < e.amountCents);
    grid += `<div class="calendar-cell ${key.startsWith(month) ? '' : 'other'}"><span class="calendar-day ${key === today() ? 'today' : ''}">${d.getUTCDate()}</span>${key === state.room.weddingDate ? '<div class="calendar-event wedding">♡ วันแต่งงานของเรา</div>' : ''}${tasks.slice(0, 3).map(t => `<button class="calendar-event ${t.done ? 'done' : ''}" title="${esc(`${t.due.slice(11)} ${t.title}`)}" data-action="edit-task" data-id="${t.id}">${t.due.slice(11)} ${esc(t.title)}</button>`).join('')}${tasks.length > 3 ? `<button class="calendar-event" data-action="day-tasks" data-id="${key}">+ อีก ${tasks.length - 3} รายการ</button>` : ''}${bills.map(e => `<button class="calendar-event bill" data-action="edit-expense" data-id="${e.id}" title="${esc(e.title)} · ค้าง ${baht(e.amountCents - expensePaid(e.id))} บาท">฿ ${esc(e.title)}</button>`).join('')}</div>`;
  }
  return `${heading('นัดหมายเล็ก ๆ ก่อนวันใหญ่', 'มองเห็นแผนเดียวกัน ไม่พลาดสิ่งสำคัญของเรา', `<button class="btn primary" data-action="add-task">${icon('plus')}เพิ่มนัดหมาย</button>`)}<section class="panel"><div class="calendar-header"><h2>${fmt(`${month}-01`, { month: 'long', year: 'numeric', day: undefined })}</h2><div class="controls"><button class="btn text" data-action="month-today">เดือนนี้</button><button class="icon-btn" data-action="month-prev" aria-label="เดือนก่อน">${icon('left')}</button><button class="icon-btn" data-action="month-next" aria-label="เดือนถัดไป">${icon('chevron')}</button></div></div><div class="calendar-grid">${['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'].map(d => `<div class="weekday">${d}</div>`).join('')}${grid}</div></section><p class="calendar-note">เวลาในตารางเป็นเวลาประเทศไทย (Asia/Bangkok) · กดที่รายการเพื่อเปลี่ยนวัน เวลา หรือผู้รับผิดชอบ</p><section class="panel agenda"><div class="panel-head"><div><h2>กำหนดการเดือนนี้</h2><p>${monthTasks.length} รายการที่เราจะเตรียมด้วยกัน</p></div><button class="btn text" data-action="export-calendar">${icon('download')}บันทึกปฏิทิน .ics</button></div>${monthTasks.length ? `<div style="overflow-x:auto"><table class="schedule-table"><thead><tr><th>วัน / เวลา</th><th>สิ่งที่ต้องเตรียม</th><th class="hide-mobile">ผู้รับผิดชอบ</th><th>เสร็จแล้ว</th></tr></thead><tbody>${monthTasks.map(t => `<tr><td class="date-cell">${fmt(t.due)}<br>${t.due.slice(11)} น.</td><td><button class="task-title" data-action="edit-task" data-id="${t.id}">${esc(t.title)}</button></td><td class="hide-mobile">${esc(name(t.owner))}</td><td><button class="check ${t.done ? 'checked' : ''}" role="checkbox" aria-checked="${t.done}" data-action="toggle" data-id="${t.id}" aria-label="${esc(`ทำเสร็จ: ${t.title}`)}">${t.done ? icon('check') : ''}</button></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">เดือนนี้ยังไม่มีนัดหมาย<br>เพิ่มเวลาที่เราจะช่วยกันเตรียมวันสำคัญได้เลย</div>'}</section>`;
}
function chat() {
  const t = findTopic(topic);
  const messages = state.messages.filter(m => m.topic === topic);
  return `${heading('ทุกไอเดียของเรา อยู่ตรงนี้', 'คุยให้ตรงเรื่อง เก็บข้อสรุป แล้วเปลี่ยนความฝันให้เป็นแผน')}
    <section class="panel chat-layout"><div class="chat-topics"><p>เรื่องที่เราอยากคุย</p>${state.topics.map(t => `<button class="chat-topic ${topic === t.id ? 'active' : ''}" data-action="topic" data-id="${t.id}">${topicSymbol(t)}<span><strong>${t.name}</strong><small>${state.messages.filter(m => m.topic === t.id).length} ข้อความ ${state.decisions[t.id] ? '· มีข้อสรุปแล้ว' : ''}</small></span></button>`).join('')}</div><div class="chat-main"><div class="chat-head">${topicSymbol(t)}<div><h2>${t.name}</h2><p>${t.description}</p></div><button class="btn text" data-action="add-topic-task" style="margin-left:auto;font-size:10px">${icon('plus')}เพิ่มงาน</button></div>
    <div class="conversation" role="log" aria-label="บทสนทนา"><div class="prompt-card"><strong>${icon('sparkles')}เริ่มคุยกันจากคำถามนี้</strong>${t.prompt}</div>${messages.length ? messages.map(m => `<div class="message ${m.role === state.role ? 'mine' : ''}">${avatar(m.role)}<div class="message-content"><div class="message-name">${esc(name(m.role))} · ${m.role === 'bride' ? 'เจ้าสาว' : 'เจ้าบ่าว'}</div><div class="message-bubble">${esc(m.body)}</div><div class="message-time">${fmt(m.created, { hour: '2-digit', minute: '2-digit' })}</div></div></div>`).join('') : '<div class="empty">เรื่องดี ๆ เริ่มจากการคุยกัน<br>ส่งไอเดียแรกของเราไว้ตรงนี้ได้เลย ♡</div>'}</div>
    <div class="decision"><div class="decision-head"><span>${icon('pin')}ข้อสรุปที่เราตกลงกัน</span><button class="btn text" data-action="decision" style="font-size:10px">${icon('edit')}${state.decisions[topic] ? 'แก้ไข' : 'จดข้อสรุป'}</button></div><p>${esc(state.decisions[topic] || 'คุยกันแล้ว จดสิ่งที่เราตกลงไว้ จะได้กลับมาอ่านได้เสมอ')}</p></div>
    <form class="composer" id="message-form"><textarea id="message-draft" aria-label="ข้อความถึงคนข้าง ๆ" placeholder="บอกไอเดียของคุณกับคนข้าง ๆ…" maxlength="4000" rows="1" required>${esc(drafts.get(topic) || '')}</textarea><button class="btn primary" type="submit" aria-label="ส่งข้อความ">${icon('send')}<span>ส่งข้อความ</span></button></form></div></section>`;
}
const expensePaid = id => state.finance.payments.filter(p => p.expense === id).reduce((sum, p) => sum + p.amountCents, 0);
const contributorName = who => ['bride', 'groom'].includes(who) ? `${state.finance.contributors.find(c => c.id === who).name} · ${name(who)}` : state.finance.contributors.find(c => c.id === who)?.name || who;
const financeActionNames = { expense_created: 'เพิ่มค่าใช้จ่าย', expense_updated: 'แก้ไขค่าใช้จ่าย', expense_deleted: 'ลบค่าใช้จ่าย', payment_recorded: 'บันทึกการจ่าย', payment_reversed: 'ยกเลิกการบันทึกจ่าย', contribution_recorded: 'เพิ่มเงินสมทบ', contribution_reversed: 'ยกเลิกเงินสมทบ' };
function financePage() {
  const f = state.finance;
  const total = f.expenses.reduce((sum, e) => sum + e.amountCents, 0), paid = f.payments.reduce((sum, p) => sum + p.amountCents, 0), funds = f.contributions.reduce((sum, p) => sum + p.amountCents, 0);
  const budget = Math.round(state.room.budget * 100);
  const expenses = f.expenses.filter(e => `${e.title} ${e.vendor} ${e.notes}`.toLowerCase().includes(expenseSearch.toLowerCase()) && (expenseFilter === 'all' || (expenseFilter === 'paid' ? expensePaid(e.id) >= e.amountCents && e.amountCents > 0 : expensePaid(e.id) < e.amountCents || !e.amountCents))).sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999'));
  const ledger = [...f.payments.map(p => ({ ...p, type: 'payments', title: f.expenses.find(e => e.id === p.expense)?.title || 'ค่าใช้จ่าย', incoming: false })), ...f.contributions.map(c => ({ ...c, type: 'contributions', title: c.notes || 'เงินเตรียมงานแต่ง', incoming: true }))].sort((a, b) => b.date.localeCompare(a.date) || b.created.localeCompare(a.created));
  return `${heading('เรื่องเงิน เราวางแผนด้วยกัน', 'เห็นยอดเดียวกัน จ่ายอะไร ใครดูแล และยังเหลือเท่าไร', `<button class="btn primary" data-action="add-expense">${icon('plus')}เพิ่มค่าใช้จ่าย</button>`)}
    <section class="stats finance-stats"><div class="stat"><div class="stat-title">${icon('wallet')}งบรวมที่ตั้งไว้</div><div class="stat-number">${budget ? baht(budget) : '—'}<small>บาท</small></div><div class="stat-bottom"><button data-action="settings">ปรับงบของเรา →</button></div></div><div class="stat"><div class="stat-title">${icon('checklist')}ค่าใช้จ่ายที่วางไว้</div><div class="stat-number">${baht(total)}<small>บาท</small></div><div class="stat-bottom">${f.expenses.length} รายการ · รวมยอดที่จ่ายแล้ว</div></div><div class="stat"><div class="stat-title">${icon('check')}จ่ายจริงแล้ว</div><div class="stat-number" id="finance-paid">${baht(paid)}<small>บาท</small></div><div class="stat-bottom">${f.payments.length} ครั้งที่บันทึกการจ่าย</div></div><div class="stat"><div class="stat-title">${icon('clock')}ยังต้องจ่าย</div><div class="stat-number">${baht(total - paid)}<small>บาท</small></div><div class="stat-bottom">ยอดรวมที่วางไว้ − จ่ายแล้ว</div></div></section>
    ${budget && total > budget ? `<div class="finance-alert">${icon('wallet')}ค่าใช้จ่ายที่วางไว้เกินงบ ${baht(total - budget)} บาท ลองทบทวนรายการด้วยกัน</div>` : budget ? `<p class="finance-note">เหลือพื้นที่ในงบ ${baht(budget - total)} บาท · คิดจากงบรวม − ค่าใช้จ่ายที่วางไว้</p>` : '<p class="finance-note">ยังไม่ได้ตั้งงบรวม ตั้งได้จากรายละเอียดวันของเรา</p>'}
    <div class="toolbar"><div class="search-field">${icon('search')}<input id="expense-search" value="${esc(expenseSearch)}" placeholder="ค้นหาค่าใช้จ่าย หรือชื่อผู้ให้บริการ…" aria-label="ค้นหาค่าใช้จ่าย"></div><select id="expense-filter" aria-label="กรองสถานะการจ่าย">${[['all', 'ทุกรายการ'], ['pending', 'ยังจ่ายไม่ครบ'], ['paid', 'จ่ายครบแล้ว']].map(([id, label]) => `<option value="${id}" ${expenseFilter === id ? 'selected' : ''}>${label}</option>`).join('')}</select><button class="btn" data-action="finance-csv">${icon('download')}CSV</button></div>
    <section class="panel expense-panel"><div class="panel-head"><div><h2>ค่าใช้จ่ายของเรา</h2><p>แยกยอดรวมกับยอดจ่ายจริง บันทึกมัดจำและงวดถัดไปในรายการเดียวกัน</p></div></div>${expenses.length ? `<div class="finance-table-wrap"><table class="schedule-table expense-table"><thead><tr><th>รายการ / กำหนดจ่าย</th><th>ยอดรวม</th><th>จ่ายแล้ว</th><th>คงค้าง</th><th>จัดการ</th></tr></thead><tbody>${expenses.map(e => { const p = expensePaid(e.id), remaining = e.amountCents - p; return `<tr><td><button class="task-title" data-action="edit-expense" data-id="${e.id}">${esc(e.title)}</button><div class="finance-meta"><span>${esc(e.vendor || f.categories.find(c => c.id === e.category).name)}</span><span class="${e.due && e.due < today() && remaining ? 'overdue' : ''}">${e.due ? `กำหนด ${fmt(e.due)}` : 'ยังไม่กำหนดวัน'}</span></div></td><td class="amount-cell">${baht(e.amountCents)}</td><td class="amount-cell paid-amount">${baht(p)}</td><td class="amount-cell">${baht(remaining)}</td><td>${remaining > 0 ? `<button class="btn text" data-action="add-payment" data-id="${e.id}">บันทึกจ่าย</button>` : `<span class="pill ${e.amountCents ? 'green' : 'orange'}">${e.amountCents ? 'จ่ายครบแล้ว' : 'รอระบุยอด'}</span>`}<button class="icon-btn" data-action="edit-expense" data-id="${e.id}" aria-label="แก้ไข ${esc(e.title)}">${icon('edit')}</button></td></tr>`; }).join('')}</tbody></table></div>` : '<div class="empty">เริ่มจากค่าใช้จ่ายก้อนแรกของเรา<br>เช่น สถานที่ ช่างภาพ ชุด หรือแหวน</div>'}</section>
    <div class="finance-grid"><section class="panel"><div class="panel-head"><div><h2>เงินที่เตรียมไว้</h2><p>บันทึกเงินที่รับเข้ามาแล้ว แยกจากงบที่ตั้งไว้</p></div><button class="btn text" data-action="add-contribution">${icon('plus')}เงินสมทบ</button></div><div class="funds-summary"><div><span>เงินสมทบที่บันทึก</span><strong>${baht(funds)} <small>บาท</small></strong></div><div><span>คงเหลือหลังหักจ่ายทั้งหมด</span><strong class="${funds - paid < 0 ? 'overdue' : ''}">${baht(funds - paid)} <small>บาท</small></strong></div><p>หากติดลบ อาจยังบันทึกเงินรับไม่ครบ ยอดนี้คำนวณจากข้อมูลในเว็บ ไม่ได้เชื่อมบัญชีธนาคาร</p></div></section><section class="panel"><div class="panel-head"><div><h2>งบไปอยู่ตรงไหนบ้าง?</h2><p>ยอดค่าใช้จ่ายที่วางไว้ แบ่งตามหมวด</p></div></div><div class="category-bars">${f.categories.map(c => { const value = f.expenses.filter(e => e.category === c.id).reduce((s, e) => s + e.amountCents, 0); return value ? `<div><p><span>${c.name}</span><b>${baht(value)} ฿</b></p><div class="progress"><span style="width:${total ? value / total * 100 : 0}%"></span></div></div>` : ''; }).join('') || '<p class="muted small">เมื่อเพิ่มค่าใช้จ่าย จะเห็นสัดส่วนแต่ละหมวดตรงนี้</p>'}</div></section></div>
    <section class="panel agenda"><div class="panel-head"><div><h2>บันทึกเงินเข้าและเงินจ่าย</h2><p>เก็บทุกงวด ใครจ่าย เมื่อไร และหมายเหตุการโอน</p></div><button class="btn text" data-action="finance-audit">ประวัติการแก้ไข ${icon('clock')}</button></div>${ledger.length ? `<div class="finance-table-wrap"><table class="schedule-table ledger-table"><thead><tr><th>วันที่ / รายการ</th><th>แหล่งเงิน / ผู้จ่าย</th><th>จำนวนเงิน</th><th></th></tr></thead><tbody>${ledger.map(p => `<tr><td><span class="pill ${p.incoming ? 'green' : 'purple'}">${p.incoming ? 'เงินสมทบเข้า' : 'จ่ายค่าใช้จ่าย'}</span><p class="ledger-title">${esc(p.title)}</p><small class="muted">${fmt(p.date)}${!p.incoming && p.notes ? ` · ${esc(p.notes)}` : ''}</small></td><td>${esc(contributorName(p.payer))}</td><td class="amount-cell ${p.incoming ? 'paid-amount' : ''}">${p.incoming ? '+' : '−'}${baht(p.amountCents)}</td><td><button class="btn text" data-action="reverse-finance" data-type="${p.type}" data-id="${p.id}">ยกเลิกบันทึก</button></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">ยังไม่มีการเคลื่อนไหว<br>เพิ่มเงินสมทบ หรือกด “บันทึกจ่าย” ที่ค่าใช้จ่ายด้านบน</div>'}</section>`;
}

function guide() {
  return `${heading('เริ่มเตรียมอย่างเข้าใจ', 'ค้นข้อมูลมาให้แล้ว เพื่อให้เรามีเวลาโฟกัสกับสิ่งที่สำคัญ')}
    <div class="source-grid">${state.sources.map((s, i) => `<article class="panel source-card"><div class="topic-symbol ${['purple', 'green', 'pink'][i]}">${icon(['checklist', 'book', 'heart'][i])}</div><h2>${esc(s.title)}</h2><p>${esc(s.detail)}</p><a href="${s.url}" target="_blank" rel="noopener noreferrer">อ่านแหล่งข้อมูลต้นฉบับ ↗</a></article>`).join('')}</div>
    <article class="panel guide"><h2>แผนที่เหมาะกับเรา คือแผนที่ปรับได้</h2><p><strong>เริ่มจากสิ่งที่ต้องตัดสินใจร่วมกัน</strong> — ภาพงาน งบ จำนวนแขก วัน และสถานที่ จากนั้นจองทีมที่ต้องใช้วันเดียวกับเรา เช่น ช่างภาพ ช่างแต่งหน้า และดนตรี</p><p><strong>ค่อยเติมรายละเอียด</strong> — ชุด แหวน การ์ด อาหาร และที่พัก ก่อนใกล้งานจึงยืนยันจำนวนแขก ผังที่นั่ง รันคิว ยอดจ่าย และแผนสำรอง</p><p><strong>พิธีไทยเลือกให้เหมาะกับครอบครัว</strong> — คุยกับผู้ใหญ่เรื่องพิธีสงฆ์ ขันหมาก สวมแหวน ไหว้ผู้ใหญ่ รดน้ำสังข์ หรือยกน้ำชา แล้วเตรียมของเฉพาะพิธีที่เลือก เวลาและลำดับขึ้นอยู่กับธรรมเนียมและฤกษ์ของแต่ละครอบครัว</p><p><strong>รายการเริ่มต้นเป็นแนวทาง</strong> — ระบบใส่ 28 งานพร้อมกำหนดเวลาโดยอิงวันแต่งงาน รายการที่ควรเริ่มไปแล้วจะเริ่มวันนี้ แก้วัน เวลา ผู้รับผิดชอบ เพิ่ม หรือลบได้ตามจริง หากเปลี่ยนวันแต่งงาน สามารถเลือกเลื่อนงานที่ยังไม่เสร็จไปพร้อมกัน</p><p><strong>เอกสารและการจดทะเบียน</strong> — หากต้องการ ให้เพิ่มเป็นงานของเราและสอบถามสำนักงานเขต/อำเภอที่จะไปโดยตรง โดยเฉพาะกรณีมีเอกสารต่างประเทศ</p><p class="small">ค้นและสรุปข้อมูล: 17 พฤศจิกายน 2569 · สรุปและจัดลำดับใหม่เพื่อใช้พูดคุยร่วมกัน แหล่งข้อมูลไม่ได้เป็นผู้ให้บริการเว็บนี้</p><button class="btn" data-action="nav" data-id="checklist">เริ่มดูเช็กลิสต์ของเรา ${icon('arrow')}</button></article>`;
}

function openModal(title, subtitle, content) {
  modal.innerHTML = `<div class="modal-head"><div><h2 id="modal-title">${title}</h2><p>${subtitle}</p></div><button type="button" class="icon-btn" data-modal-action="close" aria-label="ปิดหน้าต่าง">${icon('close')}</button></div><div class="modal-body">${content}</div>`;
  if (!modal.open) modal.showModal();
}
function errorInModal(err) { let el = $('.form-error', modal); if (!el) { el = document.createElement('p'); el.className = 'form-error'; el.setAttribute('role', 'alert'); $('.modal-body', modal).append(el); } el.textContent = err.message; }
const buttons = (save = 'บันทึก', extra = '') => `<p class="form-error" role="alert"></p><div class="modal-actions">${extra}<button type="button" class="btn" data-modal-action="close">ไว้ก่อน</button><button class="btn primary" type="submit">${save}</button></div>`;
function cents(value) {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) throw new Error('กรุณาใส่จำนวนเงินไม่เกิน 2 ตำแหน่งทศนิยม');
  const [whole, fraction = ''] = value.split('.');
  const result = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(result) || result > 1e12) throw new Error('จำนวนเงินมากเกินไป');
  return result;
}
function expenseModal(id) {
  if (demo) return startModal();
  const e = id ? state.finance.expenses.find(e => e.id === id) : { title: '', category: 'venue', vendor: '', amountCents: 0, due: '', notes: '', version: 1 };
  if (!e) return toast('รายการนี้ถูกลบแล้ว');
  openModal(id ? 'รายละเอียดค่าใช้จ่าย' : 'เพิ่มค่าใช้จ่ายของเรา', 'ใส่ยอดรวมทั้งรายการ แล้วบันทึกการจ่ายแต่ละงวดแยกกัน', `<form id="expense-form" data-id="${id || ''}"><input type="hidden" name="version" value="${e.version}"><div class="form-grid"><div class="form-group full"><label for="expense-title">รายการค่าใช้จ่าย</label><input id="expense-title" name="title" value="${esc(e.title)}" maxlength="200" placeholder="เช่น แพ็กเกจสถานที่และอาหาร" required></div><div class="form-group"><label for="expense-amount">ยอดรวม (บาท)</label><input id="expense-amount" name="amount" type="number" min="0" max="10000000000" step="0.01" value="${e.amountCents / 100}" required></div><div class="form-group"><label for="expense-due">กำหนดจ่ายถัดไป</label><input id="expense-due" name="due" type="date" value="${e.due}" max="2100-12-31"></div><div class="form-group full"><label for="expense-category">หมวดค่าใช้จ่าย</label><select id="expense-category" name="category">${state.finance.categories.map(c => `<option value="${c.id}" ${e.category === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}</select></div><div class="form-group full"><label for="expense-vendor">ผู้ให้บริการ / ร้าน</label><input id="expense-vendor" name="vendor" value="${esc(e.vendor)}" maxlength="200" placeholder="ชื่อร้านหรือคนที่เราติดต่อ"></div><div class="form-group full"><label for="expense-notes">หมายเหตุ / เงื่อนไขการจ่าย</label><textarea id="expense-notes" name="notes" maxlength="2000" placeholder="เช่น มัดจำ 30% ที่เหลือจ่ายก่อนงาน 7 วัน">${esc(e.notes)}</textarea></div></div>${id ? `<p class="finance-note">จ่ายแล้ว ${baht(expensePaid(id))} บาท · คงค้าง ${baht(e.amountCents - expensePaid(id))} บาท</p>` : ''}${buttons('บันทึกค่าใช้จ่าย', id ? `<button type="button" class="btn danger" data-modal-action="delete-expense" data-id="${id}">ลบรายการ</button>` : '')}</form>`);
}
function moneyEntryModal(expenseId) {
  if (demo) return startModal();
  const e = expenseId && state.finance.expenses.find(e => e.id === expenseId);
  if (expenseId && !e) return toast('รายการนี้ถูกลบแล้ว');
  const remaining = e ? e.amountCents - expensePaid(e.id) : 0;
  openModal(e ? 'บันทึกการจ่ายเงินจริง' : 'เพิ่มเงินที่เตรียมไว้', e ? `${esc(e.title)} · คงค้าง ${baht(remaining)} บาท` : 'ใส่เฉพาะเงินที่ได้รับหรือเตรียมเข้ากองงานแต่งแล้ว', `<form id="money-entry-form" data-type="${e ? 'payments' : 'contributions'}"><input type="hidden" name="id" value="${crypto.randomUUID()}">${e ? `<input type="hidden" name="expense" value="${e.id}">` : ''}<div class="form-grid"><div class="form-group"><label for="entry-amount">จำนวนเงิน (บาท)</label><input id="entry-amount" name="amount" type="number" min="0.01" step="0.01" max="${e ? remaining / 100 : 10000000000}" ${e ? `value="${remaining / 100}"` : ''} required></div><div class="form-group"><label for="entry-date">วันที่${e ? 'จ่ายจริง' : 'รับเงิน'}</label><input id="entry-date" name="date" type="date" value="${today()}" max="${today()}" required></div><div class="form-group full"><label for="entry-payer">${e ? 'จ่ายจากเงินของใคร' : 'แหล่งเงิน'}</label><select id="entry-payer" name="payer">${state.finance.contributors.map(c => `<option value="${c.id}">${esc(contributorName(c.id))}</option>`).join('')}</select></div><div class="form-group full"><label for="entry-notes">หมายเหตุ / เลขอ้างอิง</label><textarea id="entry-notes" name="notes" maxlength="2000" placeholder="${e ? 'เช่น มัดจำงวดแรก / เลขอ้างอิงการโอน' : 'เช่น เงินเก็บสำหรับงาน หรือเงินช่วยจากครอบครัว'}"></textarea></div></div><p class="finance-note">บันทึกข้อมูลเท่านั้น ไม่มีการโอนเงินจริง สามารถยกเลิกบันทึกที่ผิดได้ และมีประวัติการแก้ไขเก็บไว้</p>${buttons(e ? 'ยืนยันบันทึกจ่าย' : 'บันทึกเงินสมทบ')}</form>`);
}
function auditModal() {
  openModal('ประวัติการเงินของเรา', '100 การเปลี่ยนแปลงล่าสุด พร้อมคนที่บันทึกและเวลา', `<div class="audit-list">${state.finance.audit.map(a => { const data = a.data; const label = data.title || data.after?.title || state.finance.expenses.find(e => e.id === data.expense)?.title || 'รายการเงิน'; const detail = data.after ? `${baht(data.before.amountCents)} → ${baht(data.after.amountCents)} บาท` : data.amountCents !== undefined ? `${baht(data.amountCents)} บาท` : ''; return `<article><span class="pill">${financeActionNames[a.action]}</span><strong>${esc(label)}</strong><p>${esc(detail)}</p><small>${esc(name(a.role))} · ${fmt(a.created, { hour: '2-digit', minute: '2-digit' })}</small></article>`; }).join('') || '<p class="empty">ยังไม่มีการเปลี่ยนแปลง</p>'}</div>`);
}
function financeCsv() {
  const rows = [['รายการ', 'หมวด', 'ผู้ให้บริการ', 'ยอดรวม (บาท)', 'จ่ายแล้ว (บาท)', 'คงค้าง (บาท)', 'กำหนดจ่าย', 'หมายเหตุ'], ...state.finance.expenses.map(e => [e.title, state.finance.categories.find(c => c.id === e.category).name, e.vendor, (e.amountCents / 100).toFixed(2), (expensePaid(e.id) / 100).toFixed(2), ((e.amountCents - expensePaid(e.id)) / 100).toFixed(2), e.due, e.notes])];
  const quote = value => { let s = String(value); if (/^[\s]*[=+@-]/.test(s) || /^[\t\r\n]/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"`; };
  const url = URL.createObjectURL(new Blob(['\ufeff' + rows.map(row => row.map(quote).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = 'our-wedding-finance.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function startModal() {
  const d = new Date(today() + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + 180);
  openModal('พื้นที่เล็ก ๆ ของเราสองคน', 'เริ่มด้วยชื่อและวันสำคัญ แล้วชวนคนข้าง ๆ มาวางแผนด้วยกัน', `<form id="start-form"><div class="form-grid"><div class="form-group"><label for="bride">ชื่อเจ้าสาว</label><input id="bride" name="bride" placeholder="ชื่อเล่นเจ้าสาว" maxlength="60" required></div><div class="form-group"><label for="groom">ชื่อเจ้าบ่าว</label><input id="groom" name="groom" placeholder="ชื่อเล่นเจ้าบ่าว" maxlength="60" required></div><div class="form-group full"><label for="weddingDate">วันแต่งงาน (เปลี่ยนได้ภายหลัง)</label><input id="weddingDate" name="weddingDate" type="date" value="${d.toISOString().slice(0, 10)}" required min="${today()}" max="2100-12-31"></div><div class="form-group full"><label>คุณคือใคร?</label><div class="role-choices"><label class="role-choice"><input type="radio" name="role" value="bride" checked>เจ้าสาว</label><label class="role-choice"><input type="radio" name="role" value="groom">เจ้าบ่าว</label></div><p class="hint">ข้อมูลเก็บร่วมกันบนเซิร์ฟเวอร์ ไม่ต้องสมัครบัญชี<br>เก็บลิงก์เชิญไว้สำหรับเข้าจากเครื่องอื่นด้วยนะ</p></div></div>${buttons('เริ่มวางแผนด้วยกัน ♡')}</form>`);
}
function joinModal() {
  openModal('คนข้าง ๆ ชวนมาวางแผน ♡', 'เข้าร่วมแล้วจะเห็นบทสนทนา ตาราง และเช็กลิสต์เดียวกัน', `<form id="join-form"><div class="form-group"><label>เลือกตัวคุณในพื้นที่นี้</label><div class="role-choices"><label class="role-choice"><input type="radio" name="role" value="bride">เจ้าสาว</label><label class="role-choice"><input type="radio" name="role" value="groom" checked>เจ้าบ่าว</label></div><p class="hint">ลิงก์นี้เป็นกุญแจเข้าพื้นที่ร่วมกัน ควรเก็บไว้เฉพาะเราสองคน${!demo ? '<br>การเข้าร่วมจะสลับจากพื้นที่ที่คุณเปิดอยู่ตอนนี้' : ''}</p></div>${buttons('เข้าร่วมพื้นที่ของเรา')}</form>`);
}
async function inviteModal() {
  const result = await api('invite');
  const link = `${location.origin}/#join=${result.invite}`;
  openModal('ชวนคนข้าง ๆ มาด้วยกัน', 'ส่งลิงก์นี้ให้คู่ของคุณ แล้วเลือกเจ้าบ่าวหรือเจ้าสาวตอนเข้าร่วม', `<p class="invite-info">เปิดคนละเครื่องก็คุยเรื่องเดียวกันได้ ทั้งข้อความ ข้อสรุป และสิ่งที่เช็กแล้วจะอัปเดตให้กันอัตโนมัติ</p><div class="invite-link"><input id="invite-url" value="${esc(link)}" readonly aria-label="ลิงก์เชิญ"><button class="btn primary" data-modal-action="copy">${icon('link')}คัดลอก</button></div><p class="invite-info">เก็บลิงก์นี้ไว้กลับเข้าพื้นที่เมื่อเปลี่ยนเครื่องหรือ URL คนที่มีลิงก์จะอ่านและแก้ไขข้อมูลของเราได้</p><div class="modal-actions"><button class="btn text" data-modal-action="rotate">เปลี่ยนลิงก์เชิญ</button><button class="btn" data-modal-action="close">เรียบร้อย</button></div>`);
}
function settingsModal() {
  if (demo) return startModal();
  const r = state.room;
  openModal('รายละเอียดวันของเรา', 'ปรับข้อมูลให้เป็นแผนที่เหมาะกับเราสองคน', `<form id="settings-form"><div class="form-grid"><div class="form-group"><label for="bride">ชื่อเจ้าสาว</label><input id="bride" name="bride" value="${esc(r.bride)}" maxlength="60" required></div><div class="form-group"><label for="groom">ชื่อเจ้าบ่าว</label><input id="groom" name="groom" value="${esc(r.groom)}" maxlength="60" required></div><div class="form-group"><label for="weddingDate">วันแต่งงาน</label><input id="weddingDate" name="weddingDate" type="date" value="${r.weddingDate}" max="2100-12-31" required></div><div class="form-group"><label for="budget">งบรวม (บาท)</label><input id="budget" name="budget" type="number" min="0" max="10000000000" step="1" value="${r.budget}" required></div><div class="form-group full"><label for="venue">สถานที่</label><input id="venue" name="venue" maxlength="200" value="${esc(r.venue)}" placeholder="สถานที่ในฝันของเรา"></div><div class="form-group full"><label class="toggle-label"><input type="checkbox" name="reschedule" checked>เมื่อเปลี่ยนวันแต่ง ให้เลื่อนกำหนดงานที่ยังไม่เสร็จตามด้วย</label><span class="hint">งานที่เสร็จแล้วจะเก็บวันเดิม</span></div></div>${buttons('บันทึกรายละเอียด', '<a class="btn text" href="/api/export" download="our-wedding.json">ดาวน์โหลดข้อมูล</a>')}</form>`);
}
function taskModal(id, prefillTopic = topicFilter === 'all' ? 'vision' : topicFilter, prefillDate = '') {
  if (demo) return startModal();
  const t = id ? state.tasks.find(t => t.id === id) : { title: '', due: `${prefillDate || today()}T10:00`, topic: prefillTopic, owner: 'both', notes: '' };
  if (!t) return toast('ไม่พบงานนี้ อาจถูกลบแล้ว');
  openModal(id ? 'ค่อย ๆ เตรียมเรื่องนี้ด้วยกัน' : 'เพิ่มอีกหนึ่งสิ่งที่เราจะเตรียม', 'กำหนดวัน เวลา และคนดูแลให้ชัด แล้วช่วยกันไปทีละอย่าง', `<form id="task-form" data-id="${id || ''}"><div class="form-grid"><div class="form-group full"><label for="task-title">สิ่งที่ต้องเตรียม</label><input id="task-title" name="title" value="${esc(t.title)}" maxlength="200" required placeholder="เช่น นัดดูสถานที่ด้วยกัน"></div><div class="form-group full-mobile"><label for="task-due">วันและเวลา (ประเทศไทย)</label><input id="task-due" type="datetime-local" name="due" value="${t.due}" max="2100-12-31T23:59" required></div><div class="form-group full-mobile"><label for="task-owner">ใครดูแลเรื่องนี้</label><select id="task-owner" name="owner">${[['both', 'ทำด้วยกัน'], ['bride', `เจ้าสาว · ${state.room.bride}`], ['groom', `เจ้าบ่าว · ${state.room.groom}`]].map(([id, title]) => `<option value="${id}" ${t.owner === id ? 'selected' : ''}>${esc(title)}</option>`).join('')}</select></div><div class="form-group full"><label for="task-topic">หัวข้อที่เกี่ยวข้อง</label><select id="task-topic" name="topic">${state.topics.map(cat => `<option value="${cat.id}" ${t.topic === cat.id ? 'selected' : ''}>${cat.name}</option>`).join('')}</select></div><div class="form-group full"><label for="task-notes">สิ่งที่อยากจดไว้</label><textarea id="task-notes" name="notes" maxlength="3000" placeholder="รายละเอียดนัดหมาย สิ่งที่ต้องเอาไป หรือไอเดียของเรา">${esc(t.notes)}</textarea></div></div>${buttons(id ? 'บันทึกการเปลี่ยนแปลง' : 'เพิ่มในแผนของเรา', id ? `<button type="button" class="btn danger" data-modal-action="delete-task" data-id="${id}">ลบรายการ</button>` : '')}</form>`);
}
function decisionModal() {
  if (demo) return startModal();
  openModal(`ข้อสรุป · ${findTopic(topic).name}`, 'จดสิ่งที่เราตกลงกันไว้ ทั้งสองคนอ่านและแก้ไขได้', `<form id="decision-form" data-topic="${topic}"><div class="form-group"><label for="decision-body">เราเลือกแบบนี้ด้วยกัน</label><textarea id="decision-body" name="body" rows="6" maxlength="3000" placeholder="เช่น เราอยากจัดงานเล็ก ๆ ในสวน ใช้ดอกไม้สีขาวและเขียว…">${esc(state.decisions[topic] || '')}</textarea></div>${buttons('บันทึกข้อสรุป')}</form>`);
}

$('#app').addEventListener('click', async event => {
  const button = event.target.closest('[data-action]'); if (!button) return;
  const { action, id } = button.dataset;
  try {
    if (action === 'menu') return $('.sidebar').classList.toggle('open');
    if (action === 'nav' || action === 'topic') {
      page = action === 'topic' ? 'chat' : id;
      if (action === 'topic') topic = id;
      render(); window.scrollTo({ top: 0, behavior: 'instant' }); return;
    }
    if (action === 'start') return startModal();
    if (action === 'settings') return settingsModal();
    if (action === 'filter') { filter = id; return render(); }
    if (action === 'month-today') { month = today().slice(0, 7); return render(); }
    if (action === 'month-prev' || action === 'month-next') { const d = new Date(`${month}-01T12:00:00Z`); d.setUTCMonth(d.getUTCMonth() + (action === 'month-prev' ? -1 : 1)); month = d.toISOString().slice(0, 7); return render(); }
    if (action === 'day-tasks') {
      openModal(`สิ่งที่ต้องเตรียม · ${fmt(id)}`, 'ทุกรายการที่นัดกันไว้ในวันนี้', `<div class="task-list">${state.tasks.filter(t => t.due.startsWith(id)).map(t => taskRow(t, true)).join('')}</div>`); return;
    }
    if (action === 'export-calendar') return exportCalendar();
    if (action === 'finance-csv') return financeCsv();
    if (demo) return startModal();
    if (action === 'add-expense') return expenseModal();
    if (action === 'edit-expense') return expenseModal(id);
    if (action === 'add-payment') return moneyEntryModal(id);
    if (action === 'add-contribution') return moneyEntryModal();
    if (action === 'finance-audit') return auditModal();
    if (action === 'reverse-finance') {
      openModal('ยกเลิกรายการที่บันทึกผิด?', 'ใช้สำหรับแก้การลงข้อมูลผิด รายการนี้จะถูกนำออกจากยอดสรุป แต่ยังมีประวัติการยกเลิกเก็บไว้', `<p class="invite-info">หากเป็นเงินคืนจริงจากร้าน ควรเก็บรายละเอียดแยกไว้ก่อน รุ่นนี้ยังไม่มีรายการรับเงินคืนโดยเฉพาะ</p><div class="modal-actions"><button class="btn" data-modal-action="close">เก็บไว้ก่อน</button><button class="btn danger" data-modal-action="reverse-finance" data-type="${button.dataset.type}" data-id="${id}">ยืนยันยกเลิกบันทึก</button></div>`); return;
    }
    if (action === 'invite') return await inviteModal();
    if (action === 'add-task') return taskModal();
    if (action === 'add-topic-task') return taskModal(null, topic);
    if (action === 'edit-task') return taskModal(id);
    if (action === 'decision') return decisionModal();
    if (action === 'toggle') {
      const t = state.tasks.find(t => t.id === id); if (!t) return;
      button.disabled = true; busy = true;
      await api(`tasks/${id}`, 'PATCH', { done: !t.done });
      busy = false; await refresh(true); toast(t.done ? 'กลับมาเตรียมเรื่องนี้ต่อได้เลย' : 'เสร็จไปอีกหนึ่งอย่างแล้ว เก่งมาก ♡');
    }
  } catch (err) { toast(err.message); } finally { busy = false; if (button.isConnected) button.disabled = false; }
});
$('#app').addEventListener('input', e => {
  if (e.target.id === 'search') { search = e.target.value; render(); }
  if (e.target.id === 'message-draft') drafts.set(topic, e.target.value);
  if (e.target.id === 'expense-search') { expenseSearch = e.target.value; render(); }
});
$('#app').addEventListener('change', e => {
  if (e.target.id === 'owner-filter') { owner = e.target.value; render(); }
  if (e.target.id === 'topic-filter') { topicFilter = e.target.value; render(); }
  if (e.target.id === 'expense-filter') { expenseFilter = e.target.value; render(); }
});
$('#app').addEventListener('keydown', e => {
  if (e.target.id === 'message-draft' && e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('#message-form').requestSubmit(); }
});
$('#app').addEventListener('submit', async event => {
  if (event.target.id !== 'message-form') return;
  event.preventDefault();
  if (demo) return startModal();
  if (busy) return;
  const draft = $('#message-draft'); const body = draft.value.trim(); if (!body) return;
  const sendingTopic = topic;
  const button = $('button[type=submit]', event.target); button.disabled = true; busy = true;
  try { await api('messages', 'POST', { topic: sendingTopic, body }); drafts.set(sendingTopic, ''); draft.value = ''; busy = false; await refresh(true); const scroll = $('.conversation'); if (scroll) scroll.scrollTop = scroll.scrollHeight; }
  catch (err) { toast(err.message); }
  finally { busy = false; if (button.isConnected) button.disabled = false; }
});

modal.addEventListener('click', async event => {
  const button = event.target.closest('[data-modal-action], [data-action]'); if (!button) return;
  const action = button.dataset.modalAction || button.dataset.action;
  try {
    if (action === 'close') return modal.close();
    if (action === 'copy') {
      const input = $('#invite-url');
      try { await navigator.clipboard.writeText(input.value); toast('คัดลอกลิงก์แล้ว ส่งให้คนข้าง ๆ ได้เลย'); }
      catch { input.focus(); input.select(); toast('เลือกลิงก์ไว้แล้ว กด Ctrl+C หรือคัดลอกด้วยตนเอง'); }
    }
    if (action === 'rotate') {
      if (button.dataset.confirm !== 'yes') { button.dataset.confirm = 'yes'; button.textContent = 'ยืนยันเปลี่ยน? ลิงก์เดิมจะเข้าไม่ได้'; return; }
      await api('invite', 'POST', {}); await inviteModal(); toast('เปลี่ยนลิงก์แล้ว คนที่เข้าร่วมอยู่ยังใช้งานได้');
    }
    if (action === 'delete-task') {
      if (button.dataset.confirm !== 'yes') { button.dataset.confirm = 'yes'; button.textContent = 'กดอีกครั้งเพื่อยืนยันลบ'; return; }
      await api(`tasks/${button.dataset.id}`, 'DELETE', {}); modal.close(); await refresh(true); toast('ลบรายการแล้ว');
    }
    if (action === 'delete-expense') {
      if (button.dataset.confirm !== 'yes') { button.dataset.confirm = 'yes'; button.textContent = 'ยืนยันลบค่าใช้จ่ายนี้'; return; }
      button.disabled = true;
      await api(`finance/expenses/${button.dataset.id}`, 'DELETE', {}); modal.close(); await refresh(true); toast('ลบค่าใช้จ่ายแล้ว มีประวัติเก็บไว้');
    }
    if (action === 'reverse-finance') {
      button.disabled = true;
      await api(`finance/${button.dataset.type}/${button.dataset.id}`, 'DELETE', {}); modal.close(); await refresh(true); toast('ยกเลิกบันทึกและปรับยอดแล้ว');
    }
    if (action === 'edit-task') taskModal(button.dataset.id);
    if (action === 'toggle') {
      if (demo) return startModal();
      const t = state.tasks.find(t => t.id === button.dataset.id);
      button.disabled = true;
      await api(`tasks/${t.id}`, 'PATCH', { done: !t.done }); await refresh(true); modal.close(); toast('อัปเดตรายการแล้ว');
    }
  } catch (err) { if (button.isConnected) button.disabled = false; errorInModal(err); }
});
modal.addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.target;
  const formId = form.getAttribute('id');
  if (busy) return;
  const data = Object.fromEntries(new FormData(form));
  const button = $('button[type=submit]', form); button.disabled = true; busy = true;
  try {
    if (formId === 'start-form') {
      await api('start', 'POST', data); drafts.clear(); demo = false; page = 'overview'; busy = false; await refresh(true); modal.close(); toast('พื้นที่ของเราพร้อมแล้ว ♡'); await inviteModal();
    } else if (formId === 'join-form') {
      await api('join', 'POST', { invite: pendingInvite, role: data.role }); drafts.clear(); demo = false; pendingInvite = null; history.replaceState(null, '', location.pathname); page = 'overview'; busy = false; await refresh(true); modal.close(); toast('มาเตรียมวันสำคัญด้วยกันนะ ♡');
    } else {
      if (formId === 'expense-form') {
        const { amount, ...details } = data;
        await api(`finance/expenses${form.dataset.id ? '/' + form.dataset.id : ''}`, form.dataset.id ? 'PATCH' : 'POST', { ...details, version: Number(data.version), amountCents: cents(amount) });
      }
      if (formId === 'money-entry-form') {
        const { amount, ...details } = data;
        await api(`finance/${form.dataset.type}`, 'POST', { ...details, amountCents: cents(amount) });
      }
      if (formId === 'task-form') await api(form.dataset.id ? `tasks/${form.dataset.id}` : 'tasks', form.dataset.id ? 'PATCH' : 'POST', data);
      if (formId === 'settings-form') await api('room', 'PATCH', { ...data, budget: Number(data.budget), reschedule: data.reschedule === 'on' });
      if (formId === 'decision-form') await api('decisions', 'POST', { topic: form.dataset.topic, body: data.body });
      modal.close(); busy = false; await refresh(true); toast('บันทึกให้เราสองคนแล้ว');
    }
  } catch (err) { errorInModal(err); }
  finally { busy = false; if (button.isConnected) button.disabled = false; }
});

function exportCalendar() {
  const escapeIcs = value => value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  const stamp = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const events = state.tasks.map(t => {
    const start = new Date(`${t.due}+07:00`);
    return ['BEGIN:VEVENT', `UID:${t.id}@everafter.local`, `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(new Date(+start + 3600000))}`, `SUMMARY:${escapeIcs(t.title)}`, `DESCRIPTION:${escapeIcs(`ผู้ดูแล: ${name(t.owner)}\n${t.notes}`)}`, `STATUS:${t.done ? 'CONFIRMED' : 'TENTATIVE'}`, 'END:VEVENT'].join('\r\n');
  });
  const text = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Ever After//Wedding Planner//TH', 'CALSCALE:GREGORIAN', ...events, 'END:VCALENDAR', ''].join('\r\n');
  // RFC 5545 requires folding content lines at at most 75 octets.
  const folded = text.split('\r\n').map(line => { const lines = []; let part = ''; let bytes = 0; for (const char of line) { const len = new TextEncoder().encode(char).length; if (bytes + len > 74) { lines.push(part); part = ' '; bytes = 1; } part += char; bytes += len; } lines.push(part); return lines.join('\r\n'); }).join('\r\n');
  const url = URL.createObjectURL(new Blob([folded], { type: 'text/calendar;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = 'our-wedding.ics'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); toast('ดาวน์โหลดตารางแล้ว นำเข้า Google / Apple Calendar ได้เลย');
}

async function boot() {
  try {
    try { state = await api('state'); lastState = JSON.stringify(state); }
    catch (err) { if (err.status !== 401) throw err; demo = true; state = await api('preview'); }
    render(); if (pendingInvite) joinModal();
  } catch (err) { $('#app').innerHTML = `<div class="error-page"><div class="brand">ever after.</div><p>${esc(err.message)}</p><button class="btn primary" id="retry">เชื่อมต่ออีกครั้ง</button></div>`; $('#retry').addEventListener('click', boot); }
}
setInterval(async () => {
  if (document.hidden || demo || !state || busy) return;
  try { await refresh(); }
  catch (err) { online = false; updateSync(); if (err.status === 401) toast('เซสชันหมดอายุ เปิดลิงก์เชิญเพื่อกลับเข้าพื้นที่'); }
}, 3000);
document.addEventListener('visibilitychange', () => { if (!document.hidden && !demo && state) refresh().catch(() => { online = false; updateSync(); }); });
window.addEventListener('hashchange', () => { pendingInvite = new URLSearchParams(location.hash.slice(1)).get('join'); if (pendingInvite && state) joinModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') $('.sidebar')?.classList.remove('open'); });
document.addEventListener('click', e => { if (!e.target.closest('.sidebar, .mobile-menu')) $('.sidebar')?.classList.remove('open'); });
boot();
