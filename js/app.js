/* =============================================================
   NAGHAM'S PRODUCTIVITY GARDEN - Clean App
   Trello-style Task Manager with Local Storage
   ============================================================= */

// ===== DATA =====
const DATA = {
  boards: [
    { id: 'wn', title: 'WithNagham', icon: '🎬', color: 'pink',
      cards: [
        { id: 'c1', title: 'Edit new reel for Instagram', desc: "Finish editing the behind-the-scenes reel about today's shoot", prio: 'high', tags: ['content'], done: false },
        { id: 'c2', title: 'Plan content calendar', desc: 'Outline posts, reels, and stories for the week ahead', prio: 'medium', tags: ['content'], done: false },
        { id: 'c3', title: 'Respond to brand DMs', desc: 'Check Instagram inbox and reply to partnership offers', prio: 'high', tags: ['work'], done: false }
      ] },
    { id: 'eh', title: 'Ehsas Store', icon: '🕯️', color: 'yellow',
      cards: [
        { id: 'c4', title: 'Prepare candle batch', desc: 'Vanilla & lavender - 20 units needed', prio: 'high', tags: ['store'], done: false },
        { id: 'c5', title: 'Product photoshoot', desc: 'Set up the photography corner with good lighting', prio: 'medium', tags: ['store', 'content'], done: false },
        { id: 'c6', title: 'Write product descriptions', desc: 'Describe ingredients and benefits of each lotion', prio: 'low', tags: ['store'], done: false },
        { id: 'c7', title: 'Order packaging supplies', desc: 'Jars, labels, and boxes for next collection', prio: 'medium', tags: ['store'], done: false }
      ] },
    { id: 'oc', title: 'Oreo Cafe', icon: '☕', color: 'orange',
      cards: [
        { id: 'c8', title: 'Design new menu board', desc: 'Update prices and add new frappe flavors', prio: 'high', tags: ['work'], done: true },
        { id: 'c9', title: 'Instagram weekend special', desc: 'Promote the new Oreo cheesecake slice', prio: 'medium', tags: ['content'], done: false },
        { id: 'c10', title: 'Check coffee bean stock', desc: 'Order from supplier before Thursday', prio: 'high', tags: ['work', 'urgent'], done: false }
      ] },
    { id: 'tm', title: 'Tech Mindset LB', icon: '💻', color: 'blue',
      cards: [
        { id: 'c11', title: 'Schedule tech tip post', desc: 'Topic: Top 5 productivity apps', prio: 'medium', tags: ['content', 'work'], done: false },
        { id: 'c12', title: 'Edit AI tools video', desc: 'Keep under 60 seconds - add captions', prio: 'high', tags: ['content'], done: false },
        { id: 'c13', title: 'Client website inquiry', desc: 'They want a full e-commerce solution', prio: 'low', tags: ['work'], done: false }
      ] },
    { id: 'mc', title: 'More Clients', icon: '📋', color: 'purple',
      cards: [
        { id: 'c14', title: 'Send monthly reports', desc: 'Analytics to all managed accounts', prio: 'medium', tags: ['work', 'meeting'], done: false },
        { id: 'c15', title: 'Brainstorming session', desc: 'New content ideas for all clients', prio: 'low', tags: ['idea', 'meeting'], done: false }
      ] }
  ]
};

const TAG_LABELS = { work: '💼 Work', personal: '💖 Personal', content: '🎬 Content', store: '🛍️ Store', meeting: '📅 Meeting', urgent: '⚡ Urgent', idea: '💡 Idea' };
const COLORS = ['pink','yellow','green','purple','blue','orange','teal','red'];
const COLOR_HEX = { pink:'#FF6B9D', yellow:'#FFD93D', green:'#66BB6A', purple:'#CE93D8', blue:'#64B5F6', orange:'#FFB74D', teal:'#4DB6AC', red:'#EF5350' };

const STORAGE_KEY = 'nagham-garden';

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

// ===== RENDER SIDEBAR =====
function renderSidebar() {
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
  renderSidebar();
  renderMain();
}

// ===== RENDER MAIN =====
function renderMain() {
  const board = state.boards.find(b => b.id === activeBoardId);
  if (!board) { document.getElementById('mainContent').innerHTML = '<div class="empty-state"><div class="empty-state-icon">🌻</div><div class="empty-state-text">Create a board to get started!</div></div>'; return; }

  const total = board.cards.length;
  const done = board.cards.filter(c => c.done).length;

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
      <div class="cards-grid" id="cardsGrid">
        ${board.cards.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon">🌱</div>
            <div class="empty-state-text">No tasks yet!</div>
            <div class="empty-state-sub">Click "Add Task" to get started 🌻</div>
          </div>
        ` : board.cards.map((c, i) => cardHTML(c, board.id, i)).join('')}
      </div>
    </div>
  `;

}

function cardHTML(c, boardId, idx) {
  const tags = c.tags?.length ? c.tags.map(t => `<span class="card-tag ${t}">${TAG_LABELS[t]||t}</span>`).join('') : '';
  const prio = c.prio === 'high' ? '🔴 High' : c.prio === 'med' ? '🟡 Med' : '';
  return `
    <div class="card${c.done ? ' done' : ''}" style="animation-delay:${idx*0.05}s" onclick="editCard('${boardId}','${c.id}')">
      <div class="card-check${c.done?' done':''}" onclick="event.stopPropagation();toggleDone('${boardId}','${c.id}')"></div>
      <div class="card-body">
        <div class="card-title">${esc(c.title)}</div>
        ${c.desc ? `<div class="card-desc">${esc(c.desc)}</div>` : ''}
        <div class="card-meta">
          ${tags}
          ${prio ? `<span class="card-priority">${prio}</span>` : ''}
        </div>
      </div>
      <div class="card-actions">
        <button class="card-action-btn" onclick="event.stopPropagation();editCard('${boardId}','${c.id}')" title="Edit"><i class="fa-regular fa-pen-to-square"></i></button>
        <button class="card-action-btn del" onclick="event.stopPropagation();delCard('${boardId}','${c.id}')" title="Delete"><i class="fa-regular fa-trash-can"></i></button>
      </div>
    </div>
  `;
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

  board.cards.unshift({ id: uid(), title, desc, prio, tags, done: false });
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
renderSidebar();
renderMain();
toast('🌻 Welcome, Nagham!', 'ok');
