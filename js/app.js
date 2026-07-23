/* =============================================================
   NAGHAM'S PRODUCTIVITY GARDEN - Clean App
   Trello-style Task Manager with Local Storage
   ============================================================= */

// ===== DATA =====
const DATA = {
  boards: [
    { id: 'wn', title: 'WithNagham', icon: '🎬', color: 'pink',
      cards: [
        { id: 'c1', title: 'Edit new reel for Instagram', desc: "Finish editing the behind-the-scenes reel about today's shoot", prio: 'high', tags: ['content'], done: false, due: '2026-07-25' },
        { id: 'c2', title: 'Plan content calendar', desc: 'Outline posts, reels, and stories for the week ahead', prio: 'medium', tags: ['content'], done: false, due: '2026-07-28' },
        { id: 'c3', title: 'Respond to brand DMs', desc: 'Check Instagram inbox and reply to partnership offers', prio: 'high', tags: ['work'], done: false, due: null }
      ] },
    { id: 'eh', title: 'Ehsas Store', icon: '🕯️', color: 'yellow',
      cards: [
        { id: 'c4', title: 'Prepare candle batch', desc: 'Vanilla & lavender - 20 units needed', prio: 'high', tags: ['store'], done: false, due: '2026-07-24' },
        { id: 'c5', title: 'Product photoshoot', desc: 'Set up the photography corner with good lighting', prio: 'medium', tags: ['store', 'content'], done: false, due: '2026-07-30' },
        { id: 'c6', title: 'Write product descriptions', desc: 'Describe ingredients and benefits of each lotion', prio: 'low', tags: ['store'], done: false, due: null },
        { id: 'c7', title: 'Order packaging supplies', desc: 'Jars, labels, and boxes for next collection', prio: 'medium', tags: ['store'], done: false, due: '2026-08-05' }
      ] },
    { id: 'oc', title: 'Oreo Cafe', icon: '☕', color: 'orange',
      cards: [
        { id: 'c8', title: 'Design new menu board', desc: 'Update prices and add new frappe flavors', prio: 'high', tags: ['work'], done: true, due: null },
        { id: 'c9', title: 'Instagram weekend special', desc: 'Promote the new Oreo cheesecake slice', prio: 'medium', tags: ['content'], done: false, due: '2026-07-26' },
        { id: 'c10', title: 'Check coffee bean stock', desc: 'Order from supplier before Thursday', prio: 'high', tags: ['work', 'urgent'], done: false, due: '2026-07-23' }
      ] },
    { id: 'tm', title: 'Tech Mindset LB', icon: '💻', color: 'blue',
      cards: [
        { id: 'c11', title: 'Schedule tech tip post', desc: 'Topic: Top 5 productivity apps', prio: 'medium', tags: ['content', 'work'], done: false, due: '2026-07-29' },
        { id: 'c12', title: 'Edit AI tools video', desc: 'Keep under 60 seconds - add captions', prio: 'high', tags: ['content'], done: false, due: '2026-07-25' },
        { id: 'c13', title: 'Client website inquiry', desc: 'They want a full e-commerce solution', prio: 'low', tags: ['work'], done: false, due: null }
      ] },
    { id: 'mc', title: 'More Clients', icon: '📋', color: 'purple',
      cards: [
        { id: 'c14', title: 'Send monthly reports', desc: 'Analytics to all managed accounts', prio: 'medium', tags: ['work', 'meeting'], done: false, due: '2026-07-31' },
        { id: 'c15', title: 'Brainstorming session', desc: 'New content ideas for all clients', prio: 'low', tags: ['idea', 'meeting'], done: false, due: null }
      ] }
  ]
};

const TAG_LABELS = { work: '💼 Work', personal: '💖 Personal', content: '🎬 Content', store: '🛍️ Store', meeting: '📅 Meeting', urgent: '⚡ Urgent', idea: '💡 Idea' };
const COLORS = ['pink','yellow','green','purple','blue','orange','teal','red'];
const COLOR_HEX = { pink:'#FF6B9D', yellow:'#FFD93D', green:'#66BB6A', purple:'#CE93D8', blue:'#64B5F6', orange:'#FFB74D', teal:'#4DB6AC', red:'#EF5350' };

const STORAGE_KEY = 'nagham-garden';
const SETTINGS_KEY = 'nagham-settings';

// ===== THEMES =====
const THEMES = {
  sunset: { name: 'Warm Sunset', emoji: '🌅', icon: '🌻',
    swatches: ['#FF6B9D','#FFD93D','#FFFBF0','#4A2B4D'] },
  pastel: { name: 'Soft Pastel', emoji: '🌸', icon: '🌸',
    swatches: ['#F8BBD0','#FFF9C4','#F3E5F5','#7B1FA2'] },
  bold: { name: 'Bold & Modern', emoji: '✨', icon: '⭐',
    swatches: ['#FF1493','#FFD700','#1A1A1A','#FFFFFF'] },
  boho: { name: 'Boho Earth', emoji: '🌿', icon: '🌿',
    swatches: ['#E07A5F','#D4A017','#F5F0E8','#5D4037'] }
};

// ===== SETTINGS =====
let settings = loadSettings();

function loadSettings() {
  try {
    const s = localStorage.getItem(SETTINGS_KEY);
    if (s) { const p = JSON.parse(s); if (p.theme) return p; }
  } catch(e) {}
  return { theme: 'sunset', logoStyle: 'emoji-name', quote: 'grow your dreams, one task at a time ✨' };
}

function saveSettings() {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch(e) {}
}

function applyTheme(themeId) {
  document.documentElement.setAttribute('data-theme', themeId);
  settings.theme = themeId;
  saveSettings();
  // Refresh sidebar header to update icon
  renderSidebarHeader();
}

// ===== STATE =====
let state = loadState();
let activeBoardId = state.boards[0]?.id || null;
let confirmCb = null;
let focusHandler = null;

function loadState() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) { const p = JSON.parse(s); if (p?.boards?.length) return p; }
  } catch(e) {}
  return JSON.parse(JSON.stringify(DATA));
}

function save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch(e) {} }

function uid() { return '_' + Date.now().toString(36) + Math.random().toString(36).slice(2,7); }

function esc(t) { if(!t)return ''; const d=document.createElement('div'); d.textContent=t; return d.innerHTML; }

// ===== TOAST =====
function toast(msg, type='') {
  const c = document.getElementById('toastC');
  const t = document.createElement('div');
  t.className = 'toast' + (type ? ' '+type : '');
  t.innerHTML = '<i class="fa-regular fa-circle-'+ (type==='ok'?'check':type==='err'?'xmark':'info') +'"></i> ' + msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// ===== RENDER SIDEBAR HEADER =====
function renderSidebarHeader() {
  const h = document.getElementById('sidebarHeader');
  const theme = THEMES[settings.theme] || THEMES.sunset;
  let iconHtml = '';
  if (settings.logoStyle === 'emoji-name') iconHtml = theme.icon;
  else if (settings.logoStyle === 'both') iconHtml = '🌻✨';
  
  h.innerHTML = `
    <div class="sidebar-title">
      ${iconHtml ? `<span>${iconHtml}</span>` : ''}
      <span class="sidebar-title-text">Nagham's Garden</span>
    </div>
    <div class="sidebar-sub">${esc(settings.quote)}</div>
  `;
}

// ===== RENDER SIDEBAR =====
function renderSidebar() {
  renderSidebarHeader();
  const list = document.getElementById('boardList');
  list.innerHTML = state.boards.map(b => `
    <button class="board-item${b.id === activeBoardId ? ' active' : ''}" onclick="switchBoard('${b.id}')">
      <span class="board-item-icon" style="background:${COLOR_HEX[b.color]}22">${b.icon}</span>
      <span class="board-item-text">${esc(b.title)}</span>
      <span class="board-item-count">${b.cards.length}</span>
    </button>
  `).join('');
}

// ===== SWITCH BOARD =====
function switchBoard(id) {
  activeBoardId = id;
  searchQuery = '';
  renderSidebar();
  renderMain();
}

// ===== RENDER MAIN =====
let searchQuery = '';

function renderMain() {
  const board = state.boards.find(b => b.id === activeBoardId);
  if (!board) { document.getElementById('mainContent').innerHTML = '<div class="empty-state"><div class="empty-state-icon">🌻</div><div class="empty-state-text">Create a board to get started!</div></div>'; return; }

  const total = board.cards.length;
  const done = board.cards.filter(c => c.done).length;

  // Filter cards by search query
  const q = searchQuery.toLowerCase().trim();
  let filteredCards = board.cards;
  if (q) {
    filteredCards = board.cards.filter(c =>
      c.title.toLowerCase().includes(q) ||
      (c.desc || '').toLowerCase().includes(q) ||
      (c.tags || []).some(t => t.toLowerCase().includes(q))
    );
  }

  document.getElementById('mainContent').innerHTML = `
    <div class="main-header">
      <div class="main-header-left">
        <div class="main-board-icon" style="background:${COLOR_HEX[board.color]}22">${board.icon}</div>
        <div>
          <div class="main-board-name">${esc(board.title)}</div>
          <div class="main-board-stats">${total} tasks · ${done} done</div>
        </div>
      </div>
      <div class="main-header-actions">
        <button class="btn btn-pink btn-sm" onclick="addCard()"><i class="fa-solid fa-plus"></i> Add Task</button>
        <button class="btn btn-ghost btn-sm" onclick="editBoard()"><i class="fa-solid fa-pen"></i></button>
        <button class="btn btn-ghost btn-sm" onclick="delBoard()"><i class="fa-solid fa-trash-can"></i></button>
      </div>
    </div>
    <div class="cards-area">
      <div class="search-bar">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input class="search-input" id="searchInput" placeholder="Search tasks..." value="${esc(searchQuery)}" oninput="doSearch(this.value)">
        ${q ? '<button class="search-clear" onclick="clearSearch()"><i class="fa-solid fa-xmark"></i></button>' : ''}
      </div>
      <div class="cards-grid" id="cardsGrid">
        ${filteredCards.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon">${q ? '🔍' : '🌱'}</div>
            <div class="empty-state-text">${q ? 'No tasks match your search' : 'No tasks yet!'}</div>
            <div class="empty-state-sub">${q ? 'Try different keywords' : 'Click "Add Task" to get started 🌻'}</div>
          </div>
        ` : filteredCards.map((c, i) => cardHTML(c, board.id, i)).join('')}
      </div>
    </div>
  `;

  // Re-bind drag events after rendering
  if (!q) bindDragDrop();
}

function doSearch(val) {
  searchQuery = val;
  renderMain();
}

function clearSearch() {
  searchQuery = '';
  renderMain();
}

function cardHTML(c, boardId, idx) {
  const tags = c.tags?.length ? c.tags.map(t => `<span class="card-tag ${t}">${TAG_LABELS[t]||t}</span>`).join('') : '';
  const prio = c.prio === 'high' ? '🔴 High' : c.prio === 'medium' ? '🟡 Med' : '';
  
  // Due date display (timezone-safe string comparison)
  let dueHTML = '';
  if (c.due) {
    const today = new Date().toISOString().split('T')[0];
    let dueClass = '';
    let dueLabel = '';
    if (c.due < today) {
      const diff = Math.ceil((new Date(today) - new Date(c.due)) / (1000*60*60*24));
      dueClass = 'overdue';
      dueLabel = diff === 1 ? '⚠️ Due yesterday' : '⚠️ ' + diff + ' days overdue';
    } else if (c.due === today) {
      dueClass = 'due-today';
      dueLabel = '🔔 Due today';
    } else {
      const diff = Math.ceil((new Date(c.due) - new Date(today)) / (1000*60*60*24));
      if (diff === 1) { dueClass = 'due-soon'; dueLabel = '📅 Due tomorrow'; }
      else if (diff <= 3) { dueClass = 'due-soon'; dueLabel = '📅 Due in ' + diff + ' days'; }
      else { dueLabel = '📅 ' + c.due; }
    }
    dueHTML = `<span class="card-due ${dueClass}">${dueLabel}</span>`;
  }

  return `
    <div class="card${c.done ? ' done' : ''}" draggable="true" data-id="${c.id}" style="animation-delay:${idx*0.05}s" onclick="editCard('${boardId}','${c.id}')">
      <div class="card-check${c.done?' done':''}" onclick="event.stopPropagation();toggleDone('${boardId}','${c.id}')"></div>
      <div class="card-body">
        <div class="card-title">${esc(c.title)}</div>
        ${c.desc ? `<div class="card-desc">${esc(c.desc)}</div>` : ''}
        <div class="card-meta">
          ${tags}
          ${prio ? `<span class="card-priority">${prio}</span>` : ''}
          ${dueHTML}
        </div>
      </div>
      <div class="card-actions">
        <button class="card-action-btn" onclick="event.stopPropagation();editCard('${boardId}','${c.id}')" title="Edit"><i class="fa-regular fa-pen-to-square"></i></button>
        <button class="card-action-btn del" onclick="event.stopPropagation();delCard('${boardId}','${c.id}')" title="Delete"><i class="fa-regular fa-trash-can"></i></button>
      </div>
    </div>
  `;
}

// ===== DRAG & DROP REORDERING =====
let dragSrcId = null;

function bindDragDrop() {
  const grid = document.getElementById('cardsGrid');
  if (!grid) return;
  
  const cards = grid.querySelectorAll('.card[draggable]');
  cards.forEach(card => {
    card.addEventListener('dragstart', dragStart);
    card.addEventListener('dragend', dragEnd);
    card.addEventListener('dragover', dragOver);
    card.addEventListener('dragenter', dragEnter);
    card.addEventListener('dragleave', dragLeave);
    card.addEventListener('drop', dragDrop);
  });
}

function dragStart(e) {
  dragSrcId = this.dataset.id;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', this.dataset.id);
  // Don't show drag ghost image - use our own styling
  const ghost = this.cloneNode(true);
  ghost.style.opacity = '0.5';
  ghost.style.position = 'absolute';
  ghost.style.top = '-1000px';
  document.body.appendChild(ghost);
  e.dataTransfer.setDragImage(ghost, 0, 0);
  setTimeout(() => ghost.remove(), 0);
}

function dragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function dragEnter(e) {
  e.preventDefault();
  if (this.dataset.id !== dragSrcId) {
    this.classList.add('drag-over');
  }
}

function dragLeave() {
  this.classList.remove('drag-over');
}

function dragDrop(e) {
  e.stopPropagation();
  this.classList.remove('drag-over');
  
  const fromId = dragSrcId;
  const toId = this.dataset.id;
  if (!fromId || fromId === toId) return;
  
  const board = state.boards.find(b => b.id === activeBoardId);
  if (!board) return;
  
  const fromIdx = board.cards.findIndex(c => c.id === fromId);
  const toIdx = board.cards.findIndex(c => c.id === toId);
  if (fromIdx === -1 || toIdx === -1) return;
  
  // Reorder
  const [moved] = board.cards.splice(fromIdx, 1);
  board.cards.splice(toIdx, 0, moved);
  
  save();
  renderMain();
  toast('✨ Task reordered!', 'ok');
}

function dragEnd() {
  this.classList.remove('dragging');
  document.querySelectorAll('.card.drag-over').forEach(el => el.classList.remove('drag-over'));
  dragSrcId = null;
}

// ===== TOGGLE DONE =====
function toggleDone(boardId, cardId) {
  const b = state.boards.find(x => x.id === boardId);
  if (!b) return;
  const c = b.cards.find(x => x.id === cardId);
  if (!c) return;
  c.done = !c.done;
  save();
  renderMain();
  if (c.done) toast("✨ Task done!", 'ok');
}

// ===== ADD CARD =====
function addCard() {
  const board = state.boards.find(b => b.id === activeBoardId);
  if (!board) return;

  const tagsHTML = Object.entries(TAG_LABELS).map(([k,v]) =>
    `<button class="form-tag" data-t="${k}" onclick="togTag(this)">${v}</button>`
  ).join('');

  showModal(`
    <div class="modal-h">
      <div class="modal-h-title">🌻 New Task</div>
      <button class="modal-close" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="modal-b">
      <div class="form-g">
        <label class="form-l"><i class="fa-regular fa-heading"></i> Title</label>
        <input class="form-i" id="inpTitle" placeholder="What needs to be done?">
      </div>
      <div class="form-g">
        <label class="form-l"><i class="fa-regular fa-align-left"></i> Description</label>
        <textarea class="form-t" id="inpDesc" placeholder="Add details..."></textarea>
      </div>
      <div class="form-g">
        <label class="form-l"><i class="fa-regular fa-tags"></i> Tags</label>
        <div class="form-tags">${tagsHTML}</div>
      </div>
      <div class="form-g">
        <label class="form-l"><i class="fa-regular fa-flag"></i> Priority</label>
        <div class="form-prios">
          <button class="form-prio" data-p="low" onclick="togPrio(this)">🟢 Low</button>
          <button class="form-prio sel medium" data-p="medium" onclick="togPrio(this)">🟡 Medium</button>
          <button class="form-prio" data-p="high" onclick="togPrio(this)">🔴 High</button>
        </div>
      </div>
      <div class="form-g">
        <label class="form-l"><i class="fa-regular fa-calendar"></i> Due Date <span style="color:var(--plum-muted);font-weight:400">(optional)</span></label>
        <input class="form-i" type="date" id="inpDate">
      </div>
    </div>
    <div class="modal-f">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-pink" onclick="saveNewCard()">✨ Add</button>
    </div>
  `);
  setTimeout(() => document.getElementById('inpTitle')?.focus(), 100);
}

function saveNewCard() {
  const title = document.getElementById('inpTitle').value.trim();
  if (!title) { toast('Please enter a title!', 'err'); return; }

  const board = state.boards.find(b => b.id === activeBoardId);
  if (!board) return;

  const desc = document.getElementById('inpDesc').value.trim();
  const tags = [...document.querySelectorAll('.form-tag.sel')].map(el => el.dataset.t);
  const prio = document.querySelector('.form-prio.sel')?.dataset.p || 'medium';
  const due = document.getElementById('inpDate').value || null;

  board.cards.unshift({ id: uid(), title, desc, prio, tags, done: false, due });
  save();
  closeModal();
  renderMain();
  toast(`🌻 Added to ${board.title}!`, 'ok');
}

// ===== EDIT CARD =====
function editCard(boardId, cardId) {
  const board = state.boards.find(b => b.id === boardId);
  if (!board) return;
  const card = board.cards.find(c => c.id === cardId);
  if (!card) return;

  const tagsHTML = Object.entries(TAG_LABELS).map(([k,v]) =>
    `<button class="form-tag${card.tags?.includes(k)?' sel':''}" data-t="${k}" onclick="togTag(this)">${v}</button>`
  ).join('');

  showModal(`
    <div class="modal-h">
      <div class="modal-h-title">✏️ Edit Task</div>
      <button class="modal-close" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="modal-b" id="editModal">
      <div class="form-g">
        <label class="form-l"><i class="fa-regular fa-heading"></i> Title</label>
        <input class="form-i" id="editTitle" value="${esc(card.title)}">
      </div>
      <div class="form-g">
        <label class="form-l"><i class="fa-regular fa-align-left"></i> Description</label>
        <textarea class="form-t" id="editDesc">${esc(card.desc||'')}</textarea>
      </div>
      <div class="form-g">
        <label class="form-l"><i class="fa-regular fa-tags"></i> Tags</label>
        <div class="form-tags">${tagsHTML}</div>
      </div>
      <div class="form-g">
        <label class="form-l"><i class="fa-regular fa-flag"></i> Priority</label>
        <div class="form-prios">
          <button class="form-prio${card.prio==='low'?' sel low':''}" data-p="low" onclick="togPrio(this)">🟢 Low</button>
          <button class="form-prio${card.prio==='medium'?' sel medium':''}" data-p="medium" onclick="togPrio(this)">🟡 Medium</button>
          <button class="form-prio${card.prio==='high'?' sel high':''}" data-p="high" onclick="togPrio(this)">🔴 High</button>
        </div>
      </div>
      <div class="form-g">
        <label class="form-l"><i class="fa-regular fa-calendar"></i> Due Date <span style="color:var(--plum-muted);font-weight:400">(optional)</span></label>
        <input class="form-i" type="date" id="editDue" value="${card.due||''}">
      </div>
    </div>
    <div class="modal-f">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-pink" onclick="saveEdit('${boardId}','${cardId}')">💾 Save</button>
    </div>
  `);
}

function saveEdit(boardId, cardId) {
  const board = state.boards.find(b => b.id === boardId);
  if (!board) return;
  const card = board.cards.find(c => c.id === cardId);
  if (!card) return;

  const title = document.getElementById('editTitle').value.trim();
  if (!title) { toast('Title cannot be empty!', 'err'); return; }

  card.title = title;
  card.desc = document.getElementById('editDesc').value.trim();
  card.tags = [...document.querySelectorAll('#editModal .form-tag.sel')].map(el => el.dataset.t);
  card.prio = document.querySelector('.form-prio.sel')?.dataset.p || 'medium';
  card.due = document.getElementById('editDue').value || null;

  save();
  closeModal();
  renderMain();
  toast('✨ Task updated!', 'ok');
}

// ===== DELETE CARD =====
function delCard(boardId, cardId) {
  const board = state.boards.find(b => b.id === boardId);
  if (!board) return;
  const card = board.cards.find(c => c.id === cardId);
  if (!card) return;

  confirm(
    '🗑️',
    'Delete this task?',
    `"${esc(card.title)}" will be removed forever.`,
    () => {
      board.cards = board.cards.filter(c => c.id !== cardId);
      save();
      closeModal();
      renderMain();
      toast('Task deleted');
    }
  );
}

// ===== SETTINGS =====
function openSettings() {
  const themeCards = Object.entries(THEMES).map(([id, t]) => `
    <div class="theme-card${settings.theme === id ? ' active' : ''}" data-theme-id="${id}" onclick="selectTheme('${id}')">
      <div class="theme-card-emoji">${t.emoji}</div>
      <div class="theme-card-swatches">
        ${t.swatches.map(s => `<div class="theme-card-swatch" style="background:${s}"></div>`).join('')}
      </div>
      <div class="theme-card-name">${t.name}</div>
    </div>
  `).join('');

  showModal(`
    <div class="modal-h">
      <div class="modal-h-title">🎨 Customize</div>
      <button class="modal-close" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="modal-b">
      <div class="form-g">
        <label class="form-l"><i class="fa-regular fa-palette"></i> Theme</label>
        <div class="theme-grid">${themeCards}</div>
      </div>
      <div class="form-g">
        <label class="form-l"><i class="fa-regular fa-face-smile"></i> Logo Style</label>
        <div class="logo-style-grid">
          <div class="logo-opt${settings.logoStyle==='emoji-name'?' sel':''}" onclick="selLogo(this,'emoji-name')">
            ${THEMES[settings.theme]?.icon || '🌻'} Nagham<span class="logo-opt-label">Icon + Name</span>
          </div>
          <div class="logo-opt${settings.logoStyle==='text'?' sel':''}" onclick="selLogo(this,'text')">
            📝<span class="logo-opt-label">Text Only</span>
          </div>
          <div class="logo-opt${settings.logoStyle==='both'?' sel':''}" onclick="selLogo(this,'both')">
            🌻✨<span class="logo-opt-label">Both Emojis</span>
          </div>
        </div>
      </div>
      <div class="form-g">
        <label class="form-l"><i class="fa-regular fa-quote-right"></i> Personal Quote</label>
        <input class="form-i" id="editQuote" value="${esc(settings.quote)}" placeholder="A special message for you...">
      </div>
    </div>
    <div class="modal-f">
      <button class="btn btn-ghost" onclick="closeModal()">Close</button>
      <button class="btn btn-pink" onclick="saveSettingsModal()">💖 Save</button>
    </div>
  `);
}

function selectTheme(id) {
  document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
  document.querySelector(`.theme-card[data-theme-id="${id}"]`)?.classList.add('active');
  // Apply theme immediately for preview
  applyTheme(id);
}

function selLogo(el, style) {
  document.querySelectorAll('.logo-opt').forEach(e => e.classList.remove('sel'));
  el.classList.add('sel');
  settings.logoStyle = style;
  renderSidebarHeader();
}

function saveSettingsModal() {
  const q = document.getElementById('editQuote').value.trim();
  if (q) settings.quote = q;
  saveSettings();
  renderSidebarHeader();
  closeModal();
  toast('💖 Settings saved!', 'ok');
}

// ===== BOARD CRUD =====
function addBoard() {
  const colorsHTML = COLORS.map(c =>
    `<div class="color-opt" style="background:${COLOR_HEX[c]}" data-c="${c}" onclick="selCol(this)"></div>`
  ).join('');

  showModal(`
    <div class="modal-h">
      <div class="modal-h-title">🌻 New Board</div>
      <button class="modal-close" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="modal-b">
      <div class="form-g">
        <label class="form-l"><i class="fa-regular fa-heading"></i> Name</label>
        <input class="form-i" id="newBoardName" placeholder="e.g., New Project">
      </div>
      <div class="form-g">
        <label class="form-l"><i class="fa-regular fa-face-smile"></i> Icon</label>
        <input class="form-i" id="newBoardIcon" value="📋" maxlength="2">
      </div>
      <div class="form-g">
        <label class="form-l"><i class="fa-regular fa-palette"></i> Color</label>
        <div class="color-picker">${colorsHTML}</div>
      </div>
    </div>
    <div class="modal-f">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-pink" onclick="saveNewBoard()">✨ Create</button>
    </div>
  `);
  document.querySelector('.color-opt')?.classList.add('sel');
}

function saveNewBoard() {
  const name = document.getElementById('newBoardName').value.trim();
  if (!name) { toast('Please enter a name!', 'err'); return; }
  const icon = document.getElementById('newBoardIcon').value.trim() || '📋';
  const color = document.querySelector('.color-opt.sel')?.dataset.c || 'pink';

  const b = { id: uid(), title: name, icon, color, cards: [] };
  state.boards.push(b);
  save();
  closeModal();
  activeBoardId = b.id;
  renderSidebar();
  renderMain();
  toast(`🌻 "${name}" board created!`, 'ok');
}

function editBoard() {
  const board = state.boards.find(b => b.id === activeBoardId);
  if (!board) return;

  const colorsHTML = COLORS.map(c =>
    `<div class="color-opt${board.color===c?' sel':''}" style="background:${COLOR_HEX[c]}" data-c="${c}" onclick="selCol(this)"></div>`
  ).join('');

  showModal(`
    <div class="modal-h">
      <div class="modal-h-title">✏️ Edit Board</div>
      <button class="modal-close" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="modal-b">
      <div class="form-g">
        <label class="form-l"><i class="fa-regular fa-heading"></i> Name</label>
        <input class="form-i" id="editBoardName" value="${esc(board.title)}">
      </div>
      <div class="form-g">
        <label class="form-l"><i class="fa-regular fa-face-smile"></i> Icon</label>
        <input class="form-i" id="editBoardIcon" value="${board.icon}" maxlength="2">
      </div>
      <div class="form-g">
        <label class="form-l"><i class="fa-regular fa-palette"></i> Color</label>
        <div class="color-picker">${colorsHTML}</div>
      </div>
    </div>
    <div class="modal-f">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-pink" onclick="saveEditBoard()">💾 Save</button>
    </div>
  `);
}

function saveEditBoard() {
  const board = state.boards.find(b => b.id === activeBoardId);
  if (!board) return;
  const name = document.getElementById('editBoardName').value.trim();
  if (!name) { toast('Name cannot be empty!', 'err'); return; }
  board.title = name;
  board.icon = document.getElementById('editBoardIcon').value.trim() || '📋';
  board.color = document.querySelector('.color-picker .color-opt.sel')?.dataset.c || board.color;
  save();
  closeModal();
  renderSidebar();
  renderMain();
  toast('✨ Board updated!', 'ok');
}

function delBoard() {
  const board = state.boards.find(b => b.id === activeBoardId);
  if (!board) return;
  confirm('🗑️', 'Delete this board?', `"${esc(board.title)}" and its ${board.cards.length} tasks will be lost.`, () => {
    state.boards = state.boards.filter(b => b.id !== activeBoardId);
    activeBoardId = state.boards[0]?.id || null;
    save();
    closeModal();
    renderSidebar();
    renderMain();
    toast('Board deleted');
  });
}

// ===== MODAL =====
function showModal(html) {
  const o = document.getElementById('modalOverlay');
  document.getElementById('modalContent').innerHTML = html;
  o.classList.add('active');
  document.body.style.overflow = 'hidden';
  trapFocus(o);
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
  document.body.style.overflow = '';
  releaseFocus();
}

// ===== FOCUS TRAP =====
function trapFocus(c) {
  if (focusHandler) { document.removeEventListener('keydown', focusHandler); focusHandler = null; }
  const f = c.querySelectorAll('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])');
  if (!f.length) return;
  const first = f[0], last = f[f.length-1];
  setTimeout(() => first.focus(), 50);
  focusHandler = function(e) {
    if (e.key !== 'Tab') return;
    if (!document.getElementById('modalOverlay').classList.contains('active')) return;
    if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
    else { if (document.activeElement === last) { e.preventDefault(); first.focus(); } }
  };
  document.addEventListener('keydown', focusHandler);
}

function releaseFocus() {
  if (focusHandler) { document.removeEventListener('keydown', focusHandler); focusHandler = null; }
}

// ===== MODAL HELPERS =====
function togTag(el) { el.classList.toggle('sel'); }
function togPrio(el) { el.parentElement.querySelectorAll('.form-prio').forEach(e => e.classList.remove('sel','high','medium','low')); el.classList.add('sel',el.dataset.p); }
function selCol(el) { el.parentElement.querySelectorAll('.color-opt').forEach(e => e.classList.remove('sel')); el.classList.add('sel'); }

// ===== CONFIRM =====
function confirm(icon, title, text, cb) {
  showModal(`
    <div class="confirm">
      <div class="modal-b">
        <div class="confirm-icon">${icon}</div>
        <div class="confirm-title">${title}</div>
        <div class="confirm-text">${text}</div>
      </div>
      <div class="modal-f">
        <button class="btn btn-ghost" onclick="cancelConfirm()">Cancel</button>
        <button class="btn btn-danger" onclick="execConfirm()">Delete</button>
      </div>
    </div>
  `);
  confirmCb = cb;
}
function execConfirm() { if (confirmCb) confirmCb(); confirmCb = null; }
function cancelConfirm() { confirmCb = null; closeModal(); }

// ===== KEYBOARD =====
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
  if (e.key === 'Enter') {
    const o = document.getElementById('modalOverlay');
    if (o.classList.contains('active')) {
      const a = document.activeElement;
      if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT')) {
        const btn = o.querySelector('.modal-f .btn-pink');
        if (btn) btn.click();
      }
    }
  }
  if ((e.ctrlKey||e.metaKey) && e.key === 'k') { e.preventDefault(); addCard(); }
});

document.getElementById('modalOverlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeModal();
});

// ===== INIT =====
applyTheme(settings.theme);
renderSidebar();
renderMain();
toast('🌻 Welcome, Nagham!', 'ok');
