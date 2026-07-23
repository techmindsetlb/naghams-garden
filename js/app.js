/* =============================================================
   NAGHAM'S PRODUCTIVITY GARDEN - Complete App
   Features: Trello boards, Calendar, Sunflower Focus Timer
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
const SESSIONS_KEY = 'nagham-sessions';
const FILE_DB_NAME = 'nagham-files';
const FILE_DB_VERSION = 1;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const IMG_MAX_DIM = 1920; // max image dimension for compression

// ===== INDEXEDDB FILE STORAGE =====
let fileDb = null;

function openFileDB() {
  return new Promise((resolve, reject) => {
    if (fileDb) { resolve(fileDb); return; }
    const req = indexedDB.open(FILE_DB_NAME, FILE_DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('files')) {
        const store = db.createObjectStore('files', { keyPath: 'id' });
        store.createIndex('cardId', 'cardId', { unique: false });
      }
    };
    req.onsuccess = (e) => { fileDb = e.target.result; resolve(fileDb); };
    req.onerror = (e) => { reject(e.target.error); };
  });
}

function saveFileToDB(file) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openFileDB();
      const tx = db.transaction('files', 'readwrite');
      const store = tx.objectStore('files');
      const req = store.put(file);
      req.onsuccess = () => resolve(req.result);
      req.onerror = (e) => reject(e.target.error);
    } catch(e) { reject(e); }
  });
}

function deleteFileFromDB(fileId) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openFileDB();
      const tx = db.transaction('files', 'readwrite');
      const store = tx.objectStore('files');
      const req = store.delete(fileId);
      req.onsuccess = () => resolve();
      req.onerror = (e) => reject(e.target.error);
    } catch(e) { reject(e); }
  });
}

function deleteFilesByCardId(cardId) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openFileDB();
      const tx = db.transaction('files', 'readwrite');
      const store = tx.objectStore('files');
      const index = store.index('cardId');
      const req = index.openCursor(IDBKeyRange.only(cardId));
      req.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          store.delete(cursor.primaryKey);
          cursor.continue();
        } else {
          resolve();
        }
      };
      req.onerror = (e) => reject(e.target.error);
    } catch(e) { reject(e); }
  });
}

function getFilesByCardId(cardId) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openFileDB();
      const tx = db.transaction('files', 'readonly');
      const store = tx.objectStore('files');
      const index = store.index('cardId');
      const req = index.getAll(IDBKeyRange.only(cardId));
      req.onsuccess = (e) => resolve(e.target.result || []);
      req.onerror = (e) => reject(e.target.error);
    } catch(e) { reject(e); }
  });
}

function getFileById(fileId) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openFileDB();
      const tx = db.transaction('files', 'readonly');
      const store = tx.objectStore('files');
      const req = store.get(fileId);
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror = (e) => reject(e.target.error);
    } catch(e) { reject(e); }
  });
}

// ===== IMAGE COMPRESSION =====
function compressImage(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) { resolve(file); return; }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        // Resize if larger than max dimension
        if (w > IMG_MAX_DIM || h > IMG_MAX_DIM) {
          const ratio = Math.min(IMG_MAX_DIM / w, IMG_MAX_DIM / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, w, h);
        
        // Preserve PNG format for transparency, use JPEG for other formats
        const isPng = file.type === 'image/png';
        const outType = isPng ? 'image/png' : 'image/jpeg';
        const quality = isPng ? undefined : 0.82;
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressed = new File([blob], file.name, {
              type: outType,
              lastModified: Date.now()
            });
            resolve(compressed);
          } else {
            resolve(file);
          }
        }, outType, quality);
      };
      img.onerror = () => resolve(file);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

// ===== FILE UPLOAD HANDLER =====
async function handleFileSelect(inputId, previewId) {
  const input = document.getElementById(inputId);
  if (!input || !input.files.length) return;
  
  const preview = document.getElementById(previewId);
  if (!preview) return;
  
  for (const file of input.files) {
    if (file.size > MAX_FILE_SIZE) {
      toast(`"${file.name}" exceeds 50MB limit!`, 'err');
      continue;
    }
    
    // Compress if image
    const processed = await compressImage(file);
    const finalSize = processed.size;
    
    // Read as data URL for preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const sizeLabel = finalSize > 1024 * 1024 ?
        (finalSize / 1024 / 1024).toFixed(1) + ' MB' :
        (finalSize / 1024).toFixed(0) + ' KB';
      
      preview.innerHTML += `
        <div class="file-preview-item" data-name="${esc(file.name)}" data-size="${finalSize}" data-type="${file.type}" data-dataurl="${dataUrl}">
          <div class="file-preview-icon">
            ${file.type.startsWith('image/') ? `<img src="${dataUrl}" class="file-preview-thumb">` : '📎'}
          </div>
          <div class="file-preview-info">
            <div class="file-preview-name">${esc(file.name)}</div>
            <div class="file-preview-size">${esc(sizeLabel)}</div>
          </div>
          <button class="file-preview-remove" onclick="this.parentElement.remove()" title="Remove">✕</button>
        </div>
      `;
    };
    reader.readAsDataURL(processed);
  }
  
  // Reset input so same file can be re-selected
  input.value = '';
}

function getPendingFiles(previewId) {
  const container = document.getElementById(previewId);
  if (!container) return [];
  const items = container.querySelectorAll('.file-preview-item:not([data-file-id])');
  return Array.from(items).map(el => ({
    name: el.dataset.name,
    size: parseInt(el.dataset.size),
    type: el.dataset.type,
    dataUrl: el.dataset.dataurl
  }));
}

function formatFileSize(bytes) {
  if (bytes >= 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  if (bytes >= 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return bytes + ' B';
}

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

// ===== MOTIVATIONAL QUOTES =====
const MOTIVATIONS = [
  "Grow your dreams, one task at a time ✨",
  "You're planting seeds of success today 🌱",
  "Small steps lead to big blooms 🌻",
  "You're the sun in your own garden ☀️",
  "Every moment of focus is a petal unfurling 🌸",
  "Your dedication is beautiful — keep going 💖",
  "Bloom where you're planted, Nagham 🌿",
  "You're creating something magical ✨",
  "This moment is yours — own it 🌟",
  "Like a sunflower, you turn challenges into light 🌻",
  "Breathe, focus, shine ✨",
  "You've got this — one second at a time 💪",
  "Your garden is growing beautifully 🌱",
  "Stay rooted, keep growing 🌻"
];

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
  renderSidebarHeader();
}

// ===== STATE =====
let state = loadState();
let activeBoardId = state.boards[0]?.id || null;
let currentView = 'tasks';
let confirmCb = null;
let focusHandler = null;

// ===== FOCUS TIMER STATE =====
let timerState = {
  duration: 25 * 60,       // seconds
  remaining: 25 * 60,
  total: 25 * 60,
  running: false,
  paused: false,
  interval: null,
  growth: 0,               // 0-100%
  completed: false,
  selectedDuration: 25 * 60,
  showingCustom: false,
  customMinutes: 10,
  customActive: false
};

// ===== CALENDAR STATE =====
let calendarState = {
  year: new Date().getFullYear(),
  month: new Date().getMonth(),
  selectedDate: null
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function loadState() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) { const p = JSON.parse(s); if (p?.boards?.length) return p; }
  } catch(e) {}
  return JSON.parse(JSON.stringify(DATA));
}

function save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch(e) {} }

function loadSessions() {
  try {
    const s = localStorage.getItem(SESSIONS_KEY);
    if (s) { const p = JSON.parse(s); if (Array.isArray(p)) return p; }
  } catch(e) {}
  return [];
}

function saveSessions(sessions) {
  try { localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions)); } catch(e) {}
}

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

// ===== NAVIGATION =====
function switchView(view) {
  currentView = view;
  // Update nav buttons
  document.querySelectorAll('.sidebar-nav-item').forEach(b => {
    b.classList.toggle('active', b.dataset.view === view);
  });
  // Toggle boards section visibility
  const boards = document.getElementById('sidebarBoards');
  if (boards) {
    boards.style.display = view === 'tasks' ? 'flex' : 'none';
  }
  // Render the appropriate view
  if (view === 'tasks') renderMain();
  else if (view === 'calendar') renderCalendar();
  else if (view === 'focus') renderFocus();
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

// ===== RENDER SIDEBAR BOARDS =====
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

// ===== TASKS VIEW =====
let searchQuery = '';

function renderMain() {
  if (currentView !== 'tasks') return;
  
  const board = state.boards.find(b => b.id === activeBoardId);
  if (!board) { document.getElementById('mainContent').innerHTML = '<div class="empty-state"><div class="empty-state-icon">🌻</div><div class="empty-state-text">Create a board to get started!</div></div>'; return; }

  const total = board.cards.length;
  const done = board.cards.filter(c => c.done).length;

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
        <i class="fa-solid fa-magnifying-glass" onclick="submitSearch()" style="cursor:pointer"></i>
        <input class="search-input" id="searchInput" placeholder="Search tasks... (press Enter)" value="${esc(searchQuery)}" onkeydown="if(event.key==='Enter')submitSearch()">
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

  if (!q) bindDragDrop();
}

function submitSearch() {
  const val = document.getElementById('searchInput')?.value || '';
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
  const fileCount = c.fileCount || 0;

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
        ${c.notes && c.notes !== '<br>' ? `<div class="card-notes-preview">${c.notes}</div>` : ''}
        ${c.checklist && c.checklist.length > 0 ? (() => { const done = c.checklist.filter(i => i.done).length; const total = c.checklist.length; return `<div class="card-checklist-progress"><i class="fa-regular fa-list-check"></i> ${done}/${total}</div>`; })() : ''}
        <div class="card-meta">
          ${tags}
          ${prio ? `<span class="card-priority">${prio}</span>` : ''}
          ${dueHTML}
          ${fileCount > 0 ? `<span class="card-file-badge" onclick="event.stopPropagation();viewCardFiles('${boardId}','${c.id}')"><i class="fa-solid fa-paperclip"></i> ${fileCount}</span>` : ''}
        </div>
      </div>
      <div class="card-actions">
        <button class="card-action-btn" onclick="event.stopPropagation();editCard('${boardId}','${c.id}')" title="Edit"><i class="fa-regular fa-pen-to-square"></i></button>
        <button class="card-action-btn del" onclick="event.stopPropagation();delCard('${boardId}','${c.id}')" title="Delete"><i class="fa-regular fa-trash-can"></i></button>
      </div>
    </div>
  `;
}

// ===== DRAG & DROP =====
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
  const ghost = this.cloneNode(true);
  ghost.style.opacity = '0.5';
  ghost.style.position = 'absolute';
  ghost.style.top = '-1000px';
  document.body.appendChild(ghost);
  e.dataTransfer.setDragImage(ghost, 0, 0);
  setTimeout(() => ghost.remove(), 0);
}

function dragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }

function dragEnter(e) {
  e.preventDefault();
  if (this.dataset.id !== dragSrcId) this.classList.add('drag-over');
}

function dragLeave() { this.classList.remove('drag-over'); }

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
        <label class="form-l"><i class="fa-regular fa-pen"></i> Notes</label>
        <div class="editor-toolbar" id="inpToolbar">
          <button class="editor-btn" onclick="fmtCmd('bold')" title="Bold"><i class="fa-solid fa-bold"></i></button>
          <button class="editor-btn" onclick="fmtCmd('italic')" title="Italic"><i class="fa-solid fa-italic"></i></button>
          <button class="editor-btn" onclick="fmtCmd('underline')" title="Underline"><i class="fa-solid fa-underline"></i></button>
          <button class="editor-btn" onclick="fmtCmd('strikeThrough')" title="Strikethrough"><i class="fa-solid fa-strikethrough"></i></button>
          <span class="editor-sep"></span>
          <button class="editor-btn" onclick="fmtCmd('formatBlock','h3')" title="Heading"><i class="fa-solid fa-heading"></i></button>
          <button class="editor-btn" onclick="fmtCmd('formatBlock','p')" title="Paragraph"><i class="fa-solid fa-paragraph"></i></button>
          <span class="editor-sep"></span>
          <button class="editor-btn" onclick="fmtCmd('insertUnorderedList')" title="Bullet List"><i class="fa-solid fa-list-ul"></i></button>
          <button class="editor-btn" onclick="fmtCmd('insertOrderedList')" title="Numbered List"><i class="fa-solid fa-list-ol"></i></button>
          <span class="editor-sep"></span>
          <button class="editor-btn" onclick="fmtCmd('removeFormat')" title="Clear Formatting"><i class="fa-solid fa-eraser"></i></button>
        </div>
        <div class="editor-area" id="inpNotes" contenteditable="true" data-placeholder="Write your notes here..."></div>
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
      <div class="form-g">
        <label class="form-l"><i class="fa-regular fa-list-check"></i> Checklist <span style="color:var(--plum-muted);font-weight:400">(optional)</span></label>
        <div class="cl-input-wrap">
          <input class="form-i cl-input" id="inpClInput" placeholder="Add an item..." onkeydown="if(event.key==='Enter')addChecklistItem('inpClInput','inpClList')">
          <button class="cl-add-btn" onclick="addChecklistItem('inpClInput','inpClList')">+</button>
        </div>
        <div class="cl-list" id="inpClList"></div>
      </div>
      <div class="form-g">
        <label class="form-l"><i class="fa-solid fa-paperclip"></i> Attachments <span style="color:var(--plum-muted);font-weight:400">(max 50MB each)</span></label>
        <div class="file-upload-zone" onclick="document.getElementById('inpFiles').click()" ondragover="this.classList.add('drag-over');event.preventDefault()" ondragleave="this.classList.remove('drag-over')" ondrop="event.preventDefault();this.classList.remove('drag-over');document.getElementById('inpFiles').files=event.dataTransfer.files;handleFileSelect('inpFiles','inpFilePreview')">
          <i class="fa-solid fa-cloud-arrow-up"></i>
          <span>Click or drag files here</span>
        </div>
        <input type="file" id="inpFiles" multiple style="display:none" onchange="handleFileSelect('inpFiles','inpFilePreview')" accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.mp4,.mp3">
        <div id="inpFilePreview"></div>
      </div>
    </div>
    <div class="modal-f">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-pink" onclick="saveNewCard()">✨ Add</button>
    </div>
  `);
  setTimeout(() => document.getElementById('inpTitle')?.focus(), 100);
}

async function saveNewCard() {
  const title = document.getElementById('inpTitle').value.trim();
  if (!title) { toast('Please enter a title!', 'err'); return; }
  const board = state.boards.find(b => b.id === activeBoardId);
  if (!board) return;
  const notesEl = document.getElementById('inpNotes');
  const notes = notesEl ? notesEl.innerHTML.trim() : '';
  const desc = notes ? notes.replace(/<[^>]+>/g,'').trim().substring(0,120) : '';
  const tags = [...document.querySelectorAll('.form-tag.sel')].map(el => el.dataset.t);
  const prio = document.querySelector('.form-prio.sel')?.dataset.p || 'medium';
  const due = document.getElementById('inpDate').value || null;
  
  const cardId = uid();
  const pendingFiles = getPendingFiles('inpFilePreview');
  const checklist = collectChecklist('inpClList');
  board.cards.unshift({ id: cardId, title, desc, notes, prio, tags, done: false, due, fileCount: pendingFiles.length, checklist });
  
  // Save pending files to IndexedDB
  for (const f of pendingFiles) {
    const fileRecord = {
      id: uid(),
      cardId: cardId,
      name: f.name,
      size: f.size,
      type: f.type,
      dataUrl: f.dataUrl
    };
    try {
      await saveFileToDB(fileRecord);
    } catch(e) {
      console.error('Failed to save file:', e);
    }
  }
  
  save();
  closeModal();
  renderMain();
  toast(`🌻 Added to ${board.title}!`, 'ok');
}

// ===== EDIT CARD =====
async function editCard(boardId, cardId) {
  const board = state.boards.find(b => b.id === boardId);
  if (!board) return;
  const card = board.cards.find(c => c.id === cardId);
  if (!card) return;

  const tagsHTML = Object.entries(TAG_LABELS).map(([k,v]) =>
    `<button class="form-tag${card.tags?.includes(k)?' sel':''}" data-t="${k}" onclick="togTag(this)">${v}</button>`
  ).join('');
  
  // Load existing files for this card
  const existingFiles = await getFilesByCardId(cardId);
  let existingFilesHTML = '';
  if (existingFiles.length > 0) {
    existingFilesHTML = existingFiles.map(f => `
      <div class="file-preview-item" data-file-id="${f.id}" data-name="${esc(f.name)}">
        <div class="file-preview-icon">
          ${f.type.startsWith('image/') ? `<img src="${f.dataUrl}" class="file-preview-thumb">` : '📎'}
        </div>
        <div class="file-preview-info">
          <div class="file-preview-name">${esc(f.name)}</div>
          <div class="file-preview-size">${formatFileSize(f.size)}</div>
        </div>
        <button class="file-preview-remove" onclick="removeExistingFile('${boardId}','${cardId}','${f.id}')" title="Remove">✕</button>
      </div>
    `).join('');
  }

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
        <label class="form-l"><i class="fa-regular fa-pen"></i> Notes</label>
        <div class="editor-toolbar" id="editToolbar">
          <button class="editor-btn" onclick="fmtCmd('bold')" title="Bold"><i class="fa-solid fa-bold"></i></button>
          <button class="editor-btn" onclick="fmtCmd('italic')" title="Italic"><i class="fa-solid fa-italic"></i></button>
          <button class="editor-btn" onclick="fmtCmd('underline')" title="Underline"><i class="fa-solid fa-underline"></i></button>
          <button class="editor-btn" onclick="fmtCmd('strikeThrough')" title="Strikethrough"><i class="fa-solid fa-strikethrough"></i></button>
          <span class="editor-sep"></span>
          <button class="editor-btn" onclick="fmtCmd('formatBlock','h3')" title="Heading"><i class="fa-solid fa-heading"></i></button>
          <button class="editor-btn" onclick="fmtCmd('formatBlock','p')" title="Paragraph"><i class="fa-solid fa-paragraph"></i></button>
          <span class="editor-sep"></span>
          <button class="editor-btn" onclick="fmtCmd('insertUnorderedList')" title="Bullet List"><i class="fa-solid fa-list-ul"></i></button>
          <button class="editor-btn" onclick="fmtCmd('insertOrderedList')" title="Numbered List"><i class="fa-solid fa-list-ol"></i></button>
          <span class="editor-sep"></span>
          <button class="editor-btn" onclick="fmtCmd('removeFormat')" title="Clear Formatting"><i class="fa-solid fa-eraser"></i></button>
        </div>
        <div class="editor-area" id="editNotes" contenteditable="true" data-placeholder="Write your notes here...">${card.notes||''}</div>
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
      <div class="form-g">
        <label class="form-l"><i class="fa-regular fa-list-check"></i> Checklist <span style="color:var(--plum-muted);font-weight:400">(optional)</span></label>
        <div class="cl-input-wrap">
          <input class="form-i cl-input" id="editClInput" placeholder="Add an item..." onkeydown="if(event.key==='Enter')addChecklistItem('editClInput','editClList')">
          <button class="cl-add-btn" onclick="addChecklistItem('editClInput','editClList')">+</button>
        </div>
        <div class="cl-list" id="editClList"></div>
      </div>
      <div class="form-g">
        <label class="form-l"><i class="fa-solid fa-paperclip"></i> Attachments <span style="color:var(--plum-muted);font-weight:400">(max 50MB each)</span></label>
        <div class="file-upload-zone" onclick="document.getElementById('editFiles').click()" ondragover="this.classList.add('drag-over');event.preventDefault()" ondragleave="this.classList.remove('drag-over')" ondrop="event.preventDefault();this.classList.remove('drag-over');document.getElementById('editFiles').files=event.dataTransfer.files;handleFileSelect('editFiles','editFilePreview')">
          <i class="fa-solid fa-cloud-arrow-up"></i>
          <span>Click or drag files here</span>
        </div>
        <input type="file" id="editFiles" multiple style="display:none" onchange="handleFileSelect('editFiles','editFilePreview')" accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.mp4,.mp3">
        <div id="editFilePreview">${existingFilesHTML}</div>
      </div>
    </div>
    <div class="modal-f">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-pink" onclick="saveEdit('${boardId}','${cardId}')">💾 Save</button>
    </div>
  `);
  // Load existing checklist items
  renderChecklistItems(card.checklist || [], 'editClList');
}

async function viewCardFiles(boardId, cardId) {
  const files = await getFilesByCardId(cardId);
  if (!files.length) return;
  
  showModal(`
    <div class="modal-h">
      <div class="modal-h-title">📎 Attachments</div>
      <button class="modal-close" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="modal-b">
      ${files.map(f => `
        <div class="file-viewer-item">
          <div class="file-viewer-icon" onclick="${f.type.startsWith('image/') ? `openFileViewer('${f.id}')` : `viewFile('${f.id}')`}">
            ${f.type.startsWith('image/') ? `<img src="${f.dataUrl}" class="file-viewer-thumb">` : `<span class="file-viewer-fallback">📎</span>`}
          </div>
          <div class="file-viewer-info">
            <div class="file-viewer-name" onclick="${f.type.startsWith('image/') ? `openFileViewer('${f.id}')` : `viewFile('${f.id}')`}">${esc(f.name)}</div>
            <div class="file-viewer-size">${formatFileSize(f.size)}</div>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="downloadFile('${f.id}')" title="Download">
            <i class="fa-solid fa-download"></i>
          </button>
          <button class="btn btn-pink btn-sm" onclick="${f.type.startsWith('image/') ? `openFileViewer('${f.id}')` : `viewFile('${f.id}')`}">
            <i class="fa-solid fa-eye"></i>
          </button>
        </div>
      `).join('')}
    </div>
  `);
}

async function downloadFile(fileId) {
  const file = await getFileById(fileId);
  if (!file) return;
  const a = document.createElement('a');
  a.href = file.dataUrl;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

async function viewFile(fileId) {
  const file = await getFileById(fileId);
  if (!file) return;
  // Open file in a new tab
  const win = window.open();
  if (win) {
    win.document.write(`<style>body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#1a1a1a;font-family:sans-serif}img,video,embed{max-width:100%;max-height:100vh;box-shadow:0 4px 24px rgba(0,0,0,0.3);border-radius:4px}iframe{width:100vw;height:100vh;border:none}.fallback{color:white;text-align:center}.fallback h2{margin-bottom:8px}.fallback a{color:#FF6B9D;font-size:14px}</style>`);
    if (file.type.startsWith('image/')) {
      win.document.write(`<img src="${file.dataUrl}" alt="${esc(file.name)}">`);
    } else if (file.type.startsWith('video/')) {
      win.document.write(`<video src="${file.dataUrl}" controls autoplay style="max-width:100%;max-height:100vh"></video>`);
    } else if (file.type === 'application/pdf') {
      win.document.write(`<iframe src="${file.dataUrl}"></iframe>`);
    } else {
      win.document.write(`<div class="fallback"><h2>📎 ${esc(file.name)}</h2><p>${formatFileSize(file.size)}</p><a href="${file.dataUrl}" download="${esc(file.name)}">⬇️ Click to Download</a></div>`);
    }
    win.document.title = file.name;
  } else {
    // Popup blocked, fall back to download
    downloadFile(fileId);
  }
}

async function openFileViewer(fileId) {
  const file = await getFileById(fileId);
  if (!file || !file.type.startsWith('image/')) return;
  showModal(`
    <div class="modal-h">
      <div class="modal-h-title">🖼️ ${esc(file.name)}</div>
      <button class="modal-close" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="modal-b" style="text-align:center">
      <img src="${file.dataUrl}" style="max-width:100%;max-height:60vh;border-radius:var(--radius-sm);box-shadow:var(--shadow-md)">
    </div>
    <div class="modal-f">
      <button class="btn btn-ghost" onclick="closeModal()">Close</button>
      <button class="btn btn-pink" onclick="downloadFile('${fileId}');closeModal()"><i class="fa-solid fa-download"></i> Download</button>
    </div>
  `);
}

function removeExistingFile(boardId, cardId, fileId) {
  deleteFileFromDB(fileId);
  const el = document.querySelector(`.file-preview-item[data-file-id="${fileId}"]`);
  if (el) el.remove();
}

async function saveEdit(boardId, cardId) {
  const board = state.boards.find(b => b.id === boardId);
  if (!board) return;
  const card = board.cards.find(c => c.id === cardId);
  if (!card) return;
  const title = document.getElementById('editTitle').value.trim();
  if (!title) { toast('Title cannot be empty!', 'err'); return; }
  card.title = title;
  const notesEl = document.getElementById('editNotes');
  card.notes = notesEl ? notesEl.innerHTML.trim() : '';
  card.desc = card.notes ? card.notes.replace(/<[^>]+>/g,'').trim().substring(0,120) : '';
  card.tags = [...document.querySelectorAll('#editModal .form-tag.sel')].map(el => el.dataset.t);
  card.prio = document.querySelector('.form-prio.sel')?.dataset.p || 'medium';
  card.due = document.getElementById('editDue').value || null;
  card.checklist = collectChecklist('editClList');
  
  // Save new pending files to IndexedDB
  const pendingFiles = getPendingFiles('editFilePreview');
  for (const f of pendingFiles) {
    const fileRecord = {
      id: uid(),
      cardId: cardId,
      name: f.name,
      size: f.size,
      type: f.type,
      dataUrl: f.dataUrl
    };
    try {
      await saveFileToDB(fileRecord);
    } catch(e) {
      console.error('Failed to save file:', e);
    }
  }
  
  // Update file count
  const existingFiles = await getFilesByCardId(cardId);
  const newCount = existingFiles.length + pendingFiles.length;
  card.fileCount = newCount;
  
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
  confirm('🗑️', 'Delete this task?', `"${esc(card.title)}" will be removed forever.`, async () => {
    // Delete associated files from IndexedDB
    try {
      await deleteFilesByCardId(cardId);
    } catch(e) {}
    board.cards = board.cards.filter(c => c.id !== cardId);
    save();
    closeModal();
    renderMain();
    toast('Task deleted');
  });
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
  if (currentView === 'tasks') renderMain();
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
  if (currentView === 'tasks') renderMain();
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
    if (currentView === 'tasks') renderMain();
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

// ===== RICH TEXT EDITOR =====
function fmtCmd(cmd, val) {
  document.execCommand(cmd, false, val || null);
  // Keep focus on the active editor
  const active = document.activeElement;
  if (active && active.classList.contains('editor-area')) {
    active.focus();
  }
}

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

function togTag(el) { el.classList.toggle('sel'); }

// ===== CHECKLIST HELPERS =====
function addChecklistItem(inputId, listId) {
  const input = document.getElementById(inputId);
  const text = input.value.trim();
  if (!text) return;
  const list = document.getElementById(listId);
  if (!list) return;
  const id = uid();
  list.insertAdjacentHTML('beforeend', `<div class="cl-item" data-cl-id="${id}">
    <div class="cl-check" onclick="toggleClItem(this)"></div>      <span class="cl-text" ondblclick="editClItem(this.closest('.cl-item'))">${esc(text)}</span>
    <button class="cl-remove" onclick="removeClItem(this)" title="Remove"><i class="fa-solid fa-xmark"></i></button>
  </div>`);
  input.value = '';
  input.focus();
}

function toggleClItem(el) {
  el.classList.toggle('done');
  el.closest('.cl-item').classList.toggle('done');
}

function editClItem(el) {
  const span = el.querySelector('.cl-text');
  if (!span) return;
  const old = span.textContent;
  const input = document.createElement('input');
  input.className = 'cl-edit-input';
  input.value = old;
  input.setAttribute('data-cl-original', old);
  span.replaceWith(input);
  input.focus();
  input.select();
  
  function saveEdit() {
    const val = input.value.trim();
    const newSpan = document.createElement('span');
    newSpan.className = 'cl-text';
    newSpan.textContent = val || old;
    newSpan.ondblclick = function() { editClItem(this.closest('.cl-item')); };
    input.replaceWith(newSpan);
  }
  
  input.addEventListener('blur', saveEdit);
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
    if (e.key === 'Escape') { input.value = input.getAttribute('data-cl-original'); input.blur(); }
  });
}

function removeClItem(el) {
  el.closest('.cl-item').remove();
}

function collectChecklist(listId) {
  const list = document.getElementById(listId);
  if (!list) return [];
  return Array.from(list.querySelectorAll('.cl-item')).map(el => {
    const textEl = el.querySelector('.cl-text') || el.querySelector('.cl-edit-input');
    return {
      id: el.dataset.clId,
      text: textEl ? (textEl.value || textEl.textContent || '').trim() : '',
      done: el.querySelector('.cl-check').classList.contains('done')
    };
  });
}

function renderChecklistItems(items, listId) {
  const list = document.getElementById(listId);
  if (!list) return;
  list.innerHTML = (items || []).map(item =>
    `<div class="cl-item${item.done ? ' done' : ''}" data-cl-id="${item.id}">
      <div class="cl-check${item.done ? ' done' : ''}" onclick="toggleClItem(this)"></div>
      <span class="cl-text" ondblclick="editClItem(this.closest('.cl-item'))">${esc(item.text)}</span>
      <button class="cl-remove" onclick="removeClItem(this)" title="Remove"><i class="fa-solid fa-xmark"></i></button>
    </div>`
  ).join('');
}
function togPrio(el) { el.parentElement.querySelectorAll('.form-prio').forEach(e => e.classList.remove('sel','high','medium','low')); el.classList.add('sel',el.dataset.p); }
function selCol(el) { el.parentElement.querySelectorAll('.color-opt').forEach(e => e.classList.remove('sel')); el.classList.add('sel'); }

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

// ====================================================================
// 📅 CALENDAR VIEW
// ====================================================================

function renderCalendar() {
  if (currentView !== 'calendar') return;
  
  const { year, month, selectedDate } = calendarState;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  
  // Collect all tasks with due dates
  const dateTasks = {};
  state.boards.forEach(board => {
    board.cards.forEach(card => {
      if (card.due) {
        if (!dateTasks[card.due]) dateTasks[card.due] = [];
        dateTasks[card.due].push({ ...card, boardName: board.title, boardIcon: board.icon, boardColor: board.color, boardId: board.id });
      }
    });
  });
  
  const today = new Date().toISOString().split('T')[0];
  
  // Build grid
  let dayCells = '';
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  
  for (let i = 0; i < totalCells; i++) {
    let dayNum, dateStr, isOtherMonth = false;
    
    if (i < firstDay) {
      // Previous month days
      dayNum = daysInPrevMonth - firstDay + i + 1;
      const prevMonth = month - 1;
      const prevYear = prevMonth < 0 ? year - 1 : year;
      const actualMonth = prevMonth < 0 ? 11 : prevMonth;
      dateStr = `${prevYear}-${String(actualMonth + 1).padStart(2,'0')}-${String(dayNum).padStart(2,'0')}`;
      isOtherMonth = true;
    } else if (i >= firstDay + daysInMonth) {
      // Next month days
      dayNum = i - firstDay - daysInMonth + 1;
      const nextMonth = month + 1;
      const nextYear = nextMonth > 11 ? year + 1 : year;
      const actualMonth = nextMonth > 11 ? 0 : nextMonth;
      dateStr = `${nextYear}-${String(actualMonth + 1).padStart(2,'0')}-${String(dayNum).padStart(2,'0')}`;
      isOtherMonth = true;
    } else {
      dayNum = i - firstDay + 1;
      dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(dayNum).padStart(2,'0')}`;
    }
    
    const isToday = dateStr === today;
    const isSelected = selectedDate === dateStr;
    const tasksForDate = dateTasks[dateStr] || [];
    
    // Task dots
    let dotsHTML = '';
    if (tasksForDate.length > 0) {
      const showDots = tasksForDate.slice(0, 4);
      dotsHTML = `<div class="calendar-day-tasks">${showDots.map(t => {
        let dotClass = t.prio === 'high' ? 'high' : t.prio === 'medium' ? 'medium' : 'low';
        if (t.done) dotClass = 'done';
        if (dateStr < today && !t.done) dotClass = 'overdue';
        return `<span class="calendar-day-dot ${dotClass}" title="${esc(t.title)}"></span>`;
      }).join('')}${tasksForDate.length > 4 ? '<span style="font-size:9px;color:var(--plum-muted)">+'+(tasksForDate.length-4)+'</span>' : ''}</div>`;
    }
    
    dayCells += `
      <div class="calendar-day${isOtherMonth ? ' other-month' : ''}${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}" onclick="selectDate('${dateStr}')">
        <span class="day-number">${dayNum}</span>
        ${dotsHTML}
      </div>
    `;
  }
  
  // Tasks for selected date
  let taskListHTML = '';
  if (selectedDate && dateTasks[selectedDate]) {
    const tasks = dateTasks[selectedDate];
    taskListHTML = `
      <div class="calendar-task-list">
        <div class="calendar-task-list-title">📅 Tasks for ${selectedDate}</div>
        ${tasks.length === 0 ? '<div class="empty-state" style="padding:20px"><div class="empty-state-icon" style="font-size:24px">🌻</div><div class="empty-state-text" style="font-size:13px">No tasks due this day</div></div>' : tasks.map(t => `
          <div class="calendar-task-card" onclick="switchView('tasks');switchBoard('${t.boardId}')">
            <span class="board-icon">${t.boardIcon}</span>
            <span class="task-card-title${t.done ? ' task-card-done' : ''}">${esc(t.title)}</span>
            <span class="task-card-board">${esc(t.boardName)}</span>
          </div>
        `).join('')}
      </div>
    `;
  } else if (selectedDate) {
    taskListHTML = `
      <div class="calendar-task-list">
        <div class="calendar-task-list-title">📅 Tasks for ${selectedDate}</div>
        <div class="empty-state" style="padding:20px"><div class="empty-state-icon" style="font-size:24px">🌻</div><div class="empty-state-text" style="font-size:13px">No tasks due this day</div></div>
      </div>
    `;
  }
  
  document.getElementById('mainContent').innerHTML = `
    <div class="calendar-view">
      <div class="calendar-header">
        <div class="calendar-header-left">
          <button class="calendar-nav-btn" onclick="calendarMonth(-1)"><i class="fa-solid fa-chevron-left"></i></button>
          <div class="calendar-title">${MONTHS[month]} ${year}</div>
          <button class="calendar-nav-btn" onclick="calendarMonth(1)"><i class="fa-solid fa-chevron-right"></i></button>
        </div>
        <button class="calendar-today-btn" onclick="calendarToday()">Today</button>
      </div>
      <div class="calendar-grid">
        <div class="calendar-weekdays">
          ${WEEKDAYS.map(d => `<div class="calendar-weekday">${d}</div>`).join('')}
        </div>
        <div class="calendar-days">${dayCells}</div>
      </div>
      ${taskListHTML}
    </div>
  `;
}

function calendarMonth(delta) {
  calendarState.month += delta;
  if (calendarState.month > 11) { calendarState.month = 0; calendarState.year++; }
  else if (calendarState.month < 0) { calendarState.month = 11; calendarState.year--; }
  renderCalendar();
}

function calendarToday() {
  const now = new Date();
  calendarState.year = now.getFullYear();
  calendarState.month = now.getMonth();
  calendarState.selectedDate = now.toISOString().split('T')[0];
  renderCalendar();
}

function selectDate(dateStr) {
  calendarState.selectedDate = calendarState.selectedDate === dateStr ? null : dateStr;
  renderCalendar();
}

// ====================================================================
// 🌻 FOCUS TIMER
// ====================================================================

function renderFocus() {
  if (currentView !== 'focus') return;
  
  const mins = Math.floor(timerState.remaining / 60);
  const secs = timerState.remaining % 60;
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  
  const phase = timerState.running && !timerState.paused ? 'Growing... 🌱' : 
                timerState.completed ? 'Fully Bloomed! 🌻' :
                timerState.paused ? 'Paused 🌿' : 'Ready to grow 🌻';
  
  const sessions = loadSessions();
  const sessionLog = sessions.length > 0 ? `
    <div class="focus-sessions">
      <div class="focus-sessions-title">🌻 Planted Sunflowers</div>
      ${sessions.slice().reverse().slice(0, 10).map(s => `
        <div class="focus-session-item">
          🌻 <span>${s.duration} min focus</span>
          <span class="s-date">${s.date}</span>
        </div>
      `).join('')}
    </div>
  ` : '';
  
  // Pick a motivational quote
  const quoteIndex = Math.floor(Math.random() * MOTIVATIONS.length);
  
  document.getElementById('mainContent').innerHTML = `
    <div class="focus-view">
      <div class="focus-header">
        <div class="focus-title">🌻 Focus Timer</div>
        <div class="focus-subtitle">${timerState.completed ? '✨ Another sunflower planted! ✨' : 'Plant a sunflower, one focus session at a time'}</div>
      </div>
      
      <div class="focus-canvas-wrap ${timerState.completed ? 'focus-complete' : ''}">
        <canvas class="focus-canvas" id="focusCanvas" width="320" height="320"></canvas>
        <div class="focus-timer-display">
          <div class="focus-time">${timeStr}</div>
          <div class="focus-phase">${phase}</div>
        </div>
      </div>
      
      <div class="focus-motivation" id="focusMotivation">
        ${timerState.completed ? '🌻 Fully planted! You\'re amazing Nagham! 💖' : MOTIVATIONS[quoteIndex]}
      </div>
      
      <div class="focus-controls">
        ${!timerState.running && !timerState.completed ? [15, 25, 45].map(d => `
          <button class="focus-duration-btn${timerState.selectedDuration === d * 60 && !timerState.showingCustom ? ' active' : ''}" onclick="selectDuration(${d * 60})">
            ${d === 15 ? '🌱' : d === 25 ? '🌻' : '🌿'} ${d} min
          </button>
        `).join('') : ''}
        ${!timerState.running && !timerState.completed ? `
          <span class="focus-custom-wrap" id="focusCustomWrap">
            ${timerState.showingCustom ? `
              <input class="focus-custom-input" id="focusCustomInput" type="number" min="1" max="180" value="${Math.floor(timerState.customMinutes || 10)}" placeholder="min" onkeydown="if(event.key==='Enter')applyCustomDuration()">
              <button class="focus-duration-btn active" onclick="applyCustomDuration()" title="Apply">✓</button>
            ` : `
              <button class="focus-duration-btn${timerState.customActive ? ' active' : ''}" onclick="showCustomDuration()">⏱️ Custom</button>
            `}
          </span>
        ` : ''}
      </div>
      
      <div class="focus-controls">
        ${timerState.completed ? `
          <button class="focus-action-btn focus-reset-btn" onclick="resetTimer()" title="Start new session">
            <i class="fa-solid fa-rotate"></i>
          </button>
        ` : timerState.running && timerState.paused ? `
          <button class="focus-action-btn focus-start-btn" onclick="resumeTimer()" title="Resume"><i class="fa-solid fa-play"></i></button>
          <button class="focus-action-btn focus-reset-btn" onclick="resetTimer()" title="Reset"><i class="fa-solid fa-stop"></i></button>
        ` : timerState.running ? `
          <button class="focus-action-btn focus-pause-btn" onclick="pauseTimer()" title="Pause"><i class="fa-solid fa-pause"></i></button>
          <button class="focus-action-btn focus-reset-btn" onclick="resetTimer()" title="Reset"><i class="fa-solid fa-stop"></i></button>
        ` : `
          <button class="focus-action-btn focus-start-btn" onclick="startTimer()" title="Start Focus">
            <i class="fa-solid fa-play"></i>
          </button>
        `}
      </div>
      
      ${sessionLog}
    </div>
  `;
  
  // Draw the sunflower
  drawSunflower(timerState.growth);
}

// ===== SUNFLOWER CANVAS DRAWING =====
function drawSunflower(growth) {
  const canvas = document.getElementById('focusCanvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  
  ctx.clearRect(0, 0, w, h);
  
  // Background gradient - sky
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
  skyGrad.addColorStop(0, '#FFF0F5');
  skyGrad.addColorStop(1, '#FFFBF0');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);
  
  // Ground
  ctx.fillStyle = '#8D6E63';
  ctx.fillRect(0, h - 20, w, 20);
  ctx.fillStyle = '#A1887F';
  ctx.fillRect(0, h - 20, w, 2);
  
  // Grass
  for (let i = 0; i < 20; i++) {
    const gx = Math.random() * w;
    const gh = 8 + Math.random() * 12;
    ctx.strokeStyle = '#66BB6A';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(gx, h - 20);
    ctx.quadraticCurveTo(gx + (Math.random() - 0.5) * 8, h - 20 - gh * 0.6, gx + (Math.random() - 0.5) * 4, h - 20 - gh);
    ctx.stroke();
  }
  
  if (growth < 1) {
    // Seed in soil
    ctx.fillStyle = '#5D4037';
    ctx.beginPath();
    ctx.ellipse(cx, h - 24, 6, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8D6E63';
    ctx.beginPath();
    ctx.ellipse(cx - 1, h - 26, 3, 4, 0.2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  
  // Stem height based on growth (0-100%)
  const maxStemH = h * 0.65;
  const stemH = Math.max(15, maxStemH * (growth / 100));
  const soilTop = h - 20;
  const stemEndY = soilTop - stemH;
  
  // Draw stem
  ctx.strokeStyle = '#4CAF50';
  ctx.lineWidth = 4 + (growth / 100) * 3;
  ctx.beginPath();
  ctx.moveTo(cx, soilTop);
  ctx.quadraticCurveTo(cx + 3, soilTop - stemH * 0.4, cx + 2, soilTop - stemH * 0.7);
  ctx.lineTo(cx, soilTop - stemH);
  ctx.stroke();
  
  // Draw leaves (appear at 20%+ growth)
  if (growth > 20) {
    const leafProgress = Math.min(1, (growth - 20) / 30);
    [1, -1].forEach(side => {
      const leafY = soilTop - stemH * (0.3 + Math.random() * 0.3);
      const leafSize = 8 + 12 * leafProgress;
      ctx.fillStyle = `rgba(76, 175, 80, ${0.5 + 0.5 * leafProgress})`;
      ctx.beginPath();
      ctx.ellipse(cx + side * (6 + leafSize * 0.5), leafY, leafSize, leafSize * 0.4, side * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#388E3C';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx + side * 3, leafY);
      ctx.quadraticCurveTo(cx + side * (3 + leafSize * 0.6), leafY - 1, cx + side * (3 + leafSize * 0.9), leafY);
      ctx.stroke();
    });
  }
  
  // Draw bud (appears at 30%+ growth)
  if (growth > 30) {
    const budProgress = Math.min(1, (growth - 30) / 20);
    const budY = stemEndY;
    const budSize = 5 + 10 * budProgress;
    
    // Petals
    const petalCount = Math.floor(8 + 16 * Math.min(1, (growth - 30) / 50));
    const petalProgress = Math.min(1, (growth - 30) / 60);
    
    for (let i = 0; i < petalCount; i++) {
      const angle = (i / petalCount) * Math.PI * 2;
      const petalLen = 6 + petalProgress * 14;
      const petalW = 3 + petalProgress * 6;
      const px = cx + Math.cos(angle) * budSize;
      const py = budY + Math.sin(angle) * budSize * 0.8;
      
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(angle);
      
      // Gradient petal
      const grad = ctx.createLinearGradient(0, 0, petalLen, 0);
      grad.addColorStop(0, '#FFD700');
      grad.addColorStop(0.5, '#FFC107');
      grad.addColorStop(1, '#FFB300');
      ctx.fillStyle = grad;
      
      ctx.beginPath();
      ctx.ellipse(0, 0, petalLen, petalW, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Petal vein
      ctx.strokeStyle = 'rgba(255, 160, 0, 0.3)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(petalLen * 0.8, 0);
      ctx.stroke();
      
      ctx.restore();
    }
    
    // Center disc
    const discSize = 5 + budProgress * 10;
    ctx.fillStyle = '#5D4037';
    ctx.beginPath();
    ctx.ellipse(cx, budY, discSize, discSize * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Seeds in center
    ctx.fillStyle = '#3E2723';
    for (let i = 0; i < Math.floor(10 + budProgress * 15); i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * discSize * 0.7;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * r, budY + Math.sin(a) * r * 0.85, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Sunny face when bloomed
    if (growth > 85) {
      ctx.fillStyle = '#3E2723';
      // Eyes
      ctx.beginPath();
      ctx.arc(cx - 4, budY - 2, 2, 0, Math.PI * 2);
      ctx.arc(cx + 4, budY - 2, 2, 0, Math.PI * 2);
      ctx.fill();
      // Smile
      ctx.beginPath();
      ctx.arc(cx, budY + 3, 4, 0.1, Math.PI - 0.1);
      ctx.strokeStyle = '#3E2723';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }
  
  // Sparkle effects at high growth
  if (growth > 70) {
    const sparkleCount = Math.floor((growth - 70) / 5);
    for (let i = 0; i < sparkleCount; i++) {
      const sx = cx + (Math.random() - 0.5) * 60;
      const sy = stemEndY - 20 + Math.random() * 30;
      const size = 1 + Math.random() * 2;
      ctx.fillStyle = `rgba(255, 215, 0, ${0.3 + Math.random() * 0.5})`;
      ctx.beginPath();
      // Star shape
      for (let j = 0; j < 4; j++) {
        const a = (j / 4) * Math.PI * 2;
        if (j === 0) ctx.moveTo(sx + Math.cos(a) * size, sy + Math.sin(a) * size);
        else ctx.lineTo(sx + Math.cos(a) * size, sy + Math.sin(a) * size);
        const a2 = a + Math.PI / 4;
        ctx.lineTo(sx + Math.cos(a2) * size * 0.5, sy + Math.sin(a2) * size * 0.5);
      }
      ctx.closePath();
      ctx.fill();
    }
  }
}

// ===== TIMER CONTROLS =====
function selectDuration(seconds) {
  timerState.selectedDuration = seconds;
  timerState.duration = seconds;
  timerState.total = seconds;
  timerState.remaining = seconds;
  timerState.growth = 0;
  timerState.completed = false;
  timerState.showingCustom = false;
  timerState.customActive = false;
  renderFocus();
}

function showCustomDuration() {
  timerState.showingCustom = true;
  timerState.customActive = true;
  renderFocus();
  setTimeout(() => {
    const inp = document.getElementById('focusCustomInput');
    if (inp) { inp.focus(); inp.select(); }
  }, 100);
}

function applyCustomDuration() {
  const inp = document.getElementById('focusCustomInput');
  if (!inp) return;
  const mins = parseInt(inp.value);
  if (!mins || mins < 1 || mins > 180) {
    toast('Please enter 1-180 minutes!', 'err');
    return;
  }
  timerState.customMinutes = mins;
  const secs = mins * 60;
  timerState.selectedDuration = secs;
  timerState.duration = secs;
  timerState.total = secs;
  timerState.remaining = secs;
  timerState.growth = 0;
  timerState.completed = false;
  timerState.showingCustom = false;
  timerState.customActive = true;
  renderFocus();
  toast(`⏱️ ${mins} min custom session!`, 'ok');
}

function tickTimer() {
  timerState.remaining--;
  timerState.growth = ((timerState.total - timerState.remaining) / timerState.total) * 100;
  
  if (timerState.remaining <= 0) {
    clearInterval(timerState.interval);
    timerState.interval = null;
    timerState.remaining = 0;
    timerState.growth = 100;
    timerState.running = false;
    timerState.completed = true;
    completeTimer();
    return;
  }
  
  // Lightweight update: just update time display and canvas
  updateTimerDisplay();
}

function updateTimerDisplay() {
  // Update time text
  const mins = Math.floor(timerState.remaining / 60);
  const secs = timerState.remaining % 60;
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const timeEl = document.querySelector('.focus-time');
  if (timeEl) timeEl.textContent = timeStr;
  
  // Update phase text
  const phaseEl = document.querySelector('.focus-phase');
  if (phaseEl) {
    phaseEl.textContent = timerState.paused ? 'Paused 🌿' : 'Growing... 🌱';
  }
  
  // Update motivation randomly
  if (Math.random() < 0.05) {
    const motEl = document.getElementById('focusMotivation');
    if (motEl) motEl.textContent = MOTIVATIONS[Math.floor(Math.random() * MOTIVATIONS.length)];
  }
  
  // Redraw sunflower
  drawSunflower(timerState.growth);
}

function startTimer() {
  if (timerState.running) return;
  timerState.running = true;
  timerState.paused = false;
  timerState.completed = false;
  timerState.duration = timerState.selectedDuration;
  timerState.total = timerState.selectedDuration;
  timerState.remaining = timerState.selectedDuration;
  timerState.growth = 0;
  
  // Set initial state on UI
  const timeEl = document.querySelector('.focus-time');
  const mins = Math.floor(timerState.remaining / 60);
  const secs = timerState.remaining % 60;
  if (timeEl) timeEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  
  const phaseEl = document.querySelector('.focus-phase');
  if (phaseEl) phaseEl.textContent = 'Growing... 🌱';
  
  // Update control buttons
  updateFocusControls();
  
  timerState.interval = setInterval(tickTimer, 1000);
}

function updateFocusControls() {
  const controls = document.querySelector('.focus-controls');
  if (!controls) return;
  
  // Replace the last controls group (the action buttons)
  // Find the last .focus-controls element
  const allControls = document.querySelectorAll('.focus-controls');
  const lastControls = allControls[allControls.length - 1];
  if (!lastControls) return;
  
  if (timerState.completed) {
    lastControls.innerHTML = `
      <button class="focus-action-btn focus-reset-btn" onclick="resetTimer()" title="Start new session">
        <i class="fa-solid fa-rotate"></i>
      </button>
    `;
  } else if (timerState.running && timerState.paused) {
    lastControls.innerHTML = `
      <button class="focus-action-btn focus-start-btn" onclick="resumeTimer()" title="Resume"><i class="fa-solid fa-play"></i></button>
      <button class="focus-action-btn focus-reset-btn" onclick="resetTimer()" title="Reset"><i class="fa-solid fa-stop"></i></button>
    `;
  } else if (timerState.running) {
    lastControls.innerHTML = `
      <button class="focus-action-btn focus-pause-btn" onclick="pauseTimer()" title="Pause"><i class="fa-solid fa-pause"></i></button>
      <button class="focus-action-btn focus-reset-btn" onclick="resetTimer()" title="Reset"><i class="fa-solid fa-stop"></i></button>
    `;
  } else {
    lastControls.innerHTML = `
      <button class="focus-action-btn focus-start-btn" onclick="startTimer()" title="Start Focus">
        <i class="fa-solid fa-play"></i>
      </button>
    `;
  }
}

function pauseTimer() {
  timerState.paused = true;
  if (timerState.interval) {
    clearInterval(timerState.interval);
    timerState.interval = null;
  }
  updateTimerDisplay();
  updateFocusControls();
}

function resumeTimer() {
  timerState.paused = false;
  updateFocusControls();
  timerState.interval = setInterval(tickTimer, 1000);
}

function resetTimer() {
  if (timerState.interval) {
    clearInterval(timerState.interval);
    timerState.interval = null;
  }
  timerState.running = false;
  timerState.paused = false;
  timerState.completed = false;
  timerState.remaining = timerState.selectedDuration;
  timerState.duration = timerState.selectedDuration;
  timerState.total = timerState.selectedDuration;
  timerState.growth = 0;
  timerState.showingCustom = false;
  renderFocus();
}

function completeTimer() {
  // Save session
  const sessions = loadSessions();
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  sessions.push({
    id: uid(),
    duration: Math.floor(timerState.duration / 60),
    date: dateStr,
    timestamp: now.toISOString()
  });
  saveSessions(sessions);
  
  renderFocus();
  
  // Show celebration
  toast('🌻 Sunflower planted! You did it! 💖', 'ok');
  
  // Confetti!
  launchConfetti();
  
  // Motivation message
  setTimeout(() => {
    const msg = document.getElementById('focusMotivation');
    if (msg) msg.textContent = '🌻 Fully planted! You\'re amazing Nagham! 💖';
  }, 100);
}

// ===== CONFETTI =====
function launchConfetti() {
  const container = document.createElement('div');
  container.className = 'confetti-container';
  document.body.appendChild(container);
  
  const colors = ['#FF6B9D', '#FFD93D', '#66BB6A', '#64B5F6', '#CE93D8', '#FFB74D', '#FF4757', '#FFD700'];
  
  for (let i = 0; i < 60; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.width = (5 + Math.random() * 8) + 'px';
    piece.style.height = (5 + Math.random() * 8) + 'px';
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
    piece.style.animationDuration = (2 + Math.random() * 2) + 's';
    piece.style.animationDelay = (Math.random() * 0.5) + 's';
    container.appendChild(piece);
  }
  
  setTimeout(() => container.remove(), 4000);
}

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

// ===== PIN LOCK =====
const PIN_CODE = '2002';
let pinEntry = '';

function checkAppLock() {
  const unlocked = sessionStorage.getItem('nagham-unlocked');
  if (unlocked === 'true') {
    document.getElementById('lockScreen').classList.add('hidden');
    initApp();
  } else {
    // Lock screen is visible by default
    initApp(); // Initialize app in background
  }
}

function pinKey(digit) {
  if (pinEntry.length >= 4) return;
  pinEntry += digit;
  updatePinDots();
  
  if (pinEntry.length === 4) {
    setTimeout(pinSubmit, 200);
  }
}

function pinClear() {
  pinEntry = pinEntry.slice(0, -1);
  updatePinDots();
  document.getElementById('lockError').classList.remove('show');
}

function pinSubmit() {
  if (pinEntry === PIN_CODE) {
    document.getElementById('lockError').classList.remove('show');
    sessionStorage.setItem('nagham-unlocked', 'true');
    document.getElementById('lockScreen').classList.add('hidden');
    pinEntry = '';
  } else {
    document.getElementById('lockError').classList.add('show');
    document.querySelectorAll('.lock-dot').forEach(d => d.classList.add('wrong'));
    setTimeout(() => {
      document.querySelectorAll('.lock-dot').forEach(d => {
        d.classList.remove('filled', 'wrong');
      });
    }, 400);
    pinEntry = '';
    updatePinDots();
  }
}

function updatePinDots() {
  const dots = document.querySelectorAll('.lock-dot');
  dots.forEach((d, i) => {
    d.classList.toggle('filled', i < pinEntry.length);
  });
}

// ===== LOCK APP =====
function lockApp() {
  sessionStorage.removeItem('nagham-unlocked');
  pinEntry = '';
  updatePinDots();
  document.getElementById('lockError').classList.remove('show');
  document.getElementById('lockScreen').classList.remove('hidden');
}

// ===== KEYBOARD PIN SUPPORT =====
document.addEventListener('keydown', function(e) {
  const lockScreen = document.getElementById('lockScreen');
  if (!lockScreen || lockScreen.classList.contains('hidden')) return;
  
  if (e.key >= '0' && e.key <= '9') {
    pinKey(e.key);
  } else if (e.key === 'Backspace') {
    pinClear();
  } else if (e.key === 'Enter') {
    if (pinEntry.length > 0) pinSubmit();
  } else if (e.key === 'Escape') {
    pinEntry = '';
    updatePinDots();
    document.getElementById('lockError').classList.remove('show');
  }
});

// ===== INIT =====
function initApp() {
  applyTheme(settings.theme);
  renderSidebar();
  switchView('tasks');
  toast('🌻 Welcome, Nagham!', 'ok');
}

document.addEventListener('DOMContentLoaded', checkAppLock);
