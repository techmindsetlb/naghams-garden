/* =============================================================
   NAGHAM'S PRODUCTIVITY GARDEN - App Script
   Full Task Manager with Local Storage Persistence
   ============================================================= */

// ========== DATA ==========
const DEFAULT_DATA = {
  boards: [
    {
      id: 'withnagham',
      title: '✨ WithNagham',
      icon: '🎬',
      color: 'pink',
      cards: [
        { id: 'c1', title: 'Edit new reel for Instagram', description: "Finish editing the behind-the-scenes reel about today's shoot", priority: 'high', tags: ['content'], done: false, createdAt: Date.now() - 86400000 },
        { id: 'c2', title: 'Plan content calendar for next week', description: 'Outline posts, reels, and stories for the week ahead', priority: 'medium', tags: ['content'], done: false, createdAt: Date.now() - 43200000 },
        { id: 'c3', title: 'Respond to brand collaboration DMs', description: 'Check Instagram inbox and reply to partnership offers', priority: 'high', tags: ['work'], done: false, createdAt: Date.now() - 21600000 }
      ]
    },
    {
      id: 'ehsas',
      title: '🕯️ Ehsas Store',
      icon: '🕯️',
      color: 'yellow',
      cards: [
        { id: 'c4', title: 'Prepare new candle batch for restock', description: 'Vanilla & lavender scent - 20 units needed', priority: 'high', tags: ['store'], done: false, createdAt: Date.now() - 72000000 },
        { id: 'c5', title: 'Take product photos for new lotion line', description: 'Set up the photography corner with good lighting', priority: 'medium', tags: ['store', 'content'], done: false, createdAt: Date.now() - 36000000 },
        { id: 'c6', title: 'Write product descriptions for website', description: 'Describe the ingredients and benefits of each lotion', priority: 'low', tags: ['store'], done: false, createdAt: Date.now() - 18000000 },
        { id: 'c7', title: 'Order new packaging supplies', description: 'Jars, labels, and boxes for the next collection', priority: 'medium', tags: ['store'], done: false, createdAt: Date.now() - 9000000 }
      ]
    },
    {
      id: 'oreo',
      title: '☕ Oreo Cafe',
      icon: '☕',
      color: 'orange',
      cards: [
        { id: 'c8', title: 'Design new menu board', description: 'Update prices and add the new frappe flavors', priority: 'high', tags: ['work'], done: true, createdAt: Date.now() - 86400000 * 2 },
        { id: 'c9', title: 'Create Instagram post for weekend special', description: 'Promote the new Oreo cheesecake slice', priority: 'medium', tags: ['content'], done: false, createdAt: Date.now() - 43200000 },
        { id: 'c10', title: 'Check inventory - coffee beans running low', description: 'Order from the usual supplier before Thursday', priority: 'high', tags: ['work', 'urgent'], done: false, createdAt: Date.now() - 21600000 }
      ]
    },
    {
      id: 'techmindset',
      title: '💻 Tech Mindset LB',
      icon: '💻',
      color: 'blue',
      cards: [
        { id: 'c11', title: 'Schedule tech tip carousel for Tuesday', description: 'Topic: Top 5 productivity apps for entrepreneurs', priority: 'medium', tags: ['content', 'work'], done: false, createdAt: Date.now() - 86400000 },
        { id: 'c12', title: 'Edit video about AI tools for small businesses', description: 'Keep it under 60 seconds - add captions and b-roll', priority: 'high', tags: ['content'], done: false, createdAt: Date.now() - 43200000 },
        { id: 'c13', title: 'Respond to client inquiry about website', description: 'They want a full e-commerce solution', priority: 'low', tags: ['work'], done: false, createdAt: Date.now() - 21600000 }
      ]
    },
    {
      id: 'general',
      title: '📋 More Clients',
      icon: '📋',
      color: 'purple',
      cards: [
        { id: 'c14', title: 'Follow up with social media clients', description: 'Send monthly analytics reports to all managed accounts', priority: 'medium', tags: ['work', 'meeting'], done: false, createdAt: Date.now() - 86400000 },
        { id: 'c15', title: 'Creative brainstorming session', description: 'New content ideas for all client accounts this month', priority: 'low', tags: ['idea', 'meeting'], done: false, createdAt: Date.now() - 43200000 }
      ]
    }
  ]
};

const COLORS = [
  { name: 'pink', hex: '#FF6B9D' },
  { name: 'yellow', hex: '#FFD93D' },
  { name: 'green', hex: '#66BB6A' },
  { name: 'purple', hex: '#CE93D8' },
  { name: 'blue', hex: '#64B5F6' },
  { name: 'orange', hex: '#FFB74D' },
  { name: 'teal', hex: '#4DB6AC' },
  { name: 'red', hex: '#EF5350' }
];

const TAG_OPTIONS = [
  { id: 'work', label: '💼 Work' },
  { id: 'personal', label: '💖 Personal' },
  { id: 'content', label: '🎬 Content' },
  { id: 'store', label: '🛍️ Store' },
  { id: 'meeting', label: '📅 Meeting' },
  { id: 'urgent', label: '⚡ Urgent' },
  { id: 'idea', label: '💡 Idea' }
];

const PRIORITIES = [
  { id: 'low', label: '🟢 Low' },
  { id: 'medium', label: '🟡 Medium' },
  { id: 'high', label: '🔴 High' }
];

// ========== STATE ==========
let state = loadState();
let draggedCard = null;
let draggedCardElement = null;
let dragSourceBoard = null;
let confirmCallback = null;
let focusTrapHandler = null;

// ========== LOCAL STORAGE ==========
const STORAGE_KEY = 'nagham-productivity-garden';

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.boards && Array.isArray(parsed.boards)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load state, using defaults');
  }
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save state');
  }
}

// ========== ID GENERATION ==========
function generateId() {
  return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);
}

// ========== TOAST ==========
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', info: 'fa-circle-info' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fa-regular ${icons[type] || icons.info}"></i> ${message}`;
  container.appendChild(toast);
  setTimeout(() => { if (toast.parentNode) toast.remove(); }, 3000);
}

// ========== STATS ==========
function updateStats() {
  let totalTasks = 0;
  let completed = 0;
  state.boards.forEach(b => {
    totalTasks += b.cards.length;
    completed += b.cards.filter(c => c.done).length;
  });

  document.getElementById('totalBoards').textContent = state.boards.length;
  document.getElementById('totalTasks').textContent = totalTasks;
  document.getElementById('completedTasks').textContent = completed;
  document.getElementById('totalBoardsMobile').textContent = state.boards.length;
  document.getElementById('totalTasksMobile').textContent = `${completed}/${totalTasks}`;
}

// ========== UTILITY ==========
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ========== RENDER ==========
function render() {
  const container = document.getElementById('boardsContainer');
  container.innerHTML = '';

  state.boards.forEach((board, boardIndex) => {
    const boardEl = document.createElement('div');
    boardEl.className = 'board';
    boardEl.dataset.boardId = board.id;
    boardEl.dataset.color = board.color;
    boardEl.style.animationDelay = `${boardIndex * 0.08}s`;

    // Board Header
    const header = document.createElement('div');
    header.className = 'board-header';
    header.innerHTML = `
      <div class="board-header-left">
        <div class="board-icon color-${board.color}">${board.icon || '📋'}</div>
        <div class="board-title-group">
          <div class="board-title" title="${escapeHtml(board.title)}">${escapeHtml(board.title)}</div>
          <div class="board-card-count">${board.cards.length} ${board.cards.length === 1 ? 'task' : 'tasks'}</div>
        </div>
      </div>
      <div class="board-actions">
        <button class="card-action-btn" onclick="openEditBoardModal('${board.id}')" title="Edit Board">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button class="card-action-btn delete" onclick="confirmDeleteBoard('${board.id}')" title="Delete Board">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    `;
    boardEl.appendChild(header);

    // Cards List
    const cardsList = document.createElement('div');
    cardsList.className = 'cards-list';
    cardsList.dataset.boardId = board.id;

    cardsList.addEventListener('dragover', onDragOver);
    cardsList.addEventListener('dragenter', onDragEnter);
    cardsList.addEventListener('dragleave', onDragLeave);
    cardsList.addEventListener('drop', onDrop);

    if (board.cards.length === 0) {
      cardsList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🌱</div>
          <div class="empty-state-text">Your garden is growing...<br>Add your first task! 🌻</div>
        </div>
      `;
    } else {
      board.cards.forEach((card, cardIndex) => {
        const cardEl = createCardElement(card, board.id);
        cardEl.style.animationDelay = `${cardIndex * 0.06}s`;
        cardsList.appendChild(cardEl);
      });
    }

    boardEl.appendChild(cardsList);

    // Add Card Button
    const addBtn = document.createElement('button');
    addBtn.className = 'add-card-btn';
    addBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Add Task';
    addBtn.onclick = () => openAddCardModal(board.id);
    boardEl.appendChild(addBtn);

    container.appendChild(boardEl);
  });

  updateStats();
}

// ========== CREATE CARD ELEMENT ==========
function createCardElement(card, boardId) {
  const cardEl = document.createElement('div');
  cardEl.className = `card ${card.done ? 'card-completed' : ''}`;
  cardEl.dataset.cardId = card.id;
  cardEl.dataset.boardId = boardId;
  cardEl.draggable = true;

  cardEl.addEventListener('dragstart', onDragStart);
  cardEl.addEventListener('dragend', onDragEnd);

  const tagsHtml = card.tags && card.tags.length > 0
    ? `<div class="card-tags">${card.tags.map(t => `<span class="card-tag ${t}">${TAG_OPTIONS.find(o => o.id === t)?.label || t}</span>`).join('')}</div>`
    : '';

  const priorityHtml = card.priority && card.priority !== 'low'
    ? `<div class="card-priority ${card.priority}"></div>`
    : '';

  cardEl.innerHTML = `
    ${priorityHtml}
    <div class="card-top">
      <div class="card-title">${escapeHtml(card.title)}</div>
      <div class="card-checkbox ${card.done ? 'checked' : ''}" onclick="toggleCardDone('${boardId}', '${card.id}')"></div>
    </div>
    ${card.description ? `<div class="card-description">${escapeHtml(card.description)}</div>` : ''}
    ${tagsHtml}
    <div class="card-footer">
      <div class="card-actions-group">
        <button class="card-action-btn" onclick="openEditCardModal('${boardId}', '${card.id}')" title="Edit">
          <i class="fa-regular fa-pen-to-square"></i>
        </button>
        <button class="card-action-btn delete" onclick="confirmDeleteCard('${boardId}', '${card.id}')" title="Delete">
          <i class="fa-regular fa-trash-can"></i>
        </button>
      </div>
      ${card.priority && card.priority !== 'low' ? `<span style="font-size:11px;color:var(--plum-muted)">${card.priority === 'high' ? '🔴' : '🟡'} ${card.priority}</span>` : ''}
    </div>
  `;

  return cardEl;
}

// ========== DESKTOP DRAG & DROP ==========
function onDragStart(e) {
  const cardEl = e.target.closest('.card');
  if (!cardEl) return;
  draggedCard = cardEl.dataset.cardId;
  draggedCardElement = cardEl;
  dragSourceBoard = cardEl.dataset.boardId;

  cardEl.classList.add('dragging');

  const ghost = cardEl.cloneNode(true);
  ghost.className = 'card drag-ghost';
  ghost.style.width = cardEl.offsetWidth + 'px';
  document.body.appendChild(ghost);
  e.dataTransfer.setDragImage(ghost, 0, 0);
  e.dataTransfer.effectAllowed = 'move';

  setTimeout(() => { if (ghost.parentNode) ghost.remove(); }, 100);

  document.querySelectorAll('.cards-list').forEach(el => {
    if (el.dataset.boardId !== dragSourceBoard) {
      el.classList.add('drag-over');
    }
  });
}

function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function onDragEnter(e) {
  e.preventDefault();
  const list = e.target.closest('.cards-list');
  if (list) list.classList.add('drag-over-active');
}

function onDragLeave(e) {
  const list = e.target.closest('.cards-list');
  if (list) list.classList.remove('drag-over-active');
}

function onDrop(e) {
  e.preventDefault();
  const targetList = e.target.closest('.cards-list');
  if (!targetList) return;

  const targetBoardId = targetList.dataset.boardId;
  document.querySelectorAll('.cards-list').forEach(el => {
    el.classList.remove('drag-over', 'drag-over-active');
  });

  if (!draggedCard || !dragSourceBoard) return;

  if (dragSourceBoard !== targetBoardId) {
    moveCard(dragSourceBoard, draggedCard, targetBoardId);
  }

  draggedCard = null;
  draggedCardElement = null;
  dragSourceBoard = null;
}

function onDragEnd(e) {
  const cardEl = e.target.closest('.card');
  if (cardEl) cardEl.classList.remove('dragging');

  document.querySelectorAll('.cards-list').forEach(el => {
    el.classList.remove('drag-over', 'drag-over-active');
  });

  document.querySelectorAll('.drag-ghost').forEach(el => el.remove());

  draggedCard = null;
  draggedCardElement = null;
  dragSourceBoard = null;
}

function moveCard(fromBoardId, cardId, toBoardId) {
  const fromBoard = state.boards.find(b => b.id === fromBoardId);
  const toBoard = state.boards.find(b => b.id === toBoardId);
  if (!fromBoard || !toBoard) return;

  const cardIndex = fromBoard.cards.findIndex(c => c.id === cardId);
  if (cardIndex === -1) return;

  const [card] = fromBoard.cards.splice(cardIndex, 1);
  toBoard.cards.push(card);

  saveState();
  render();
  showToast(`Moved to "${toBoard.title}" 🌻`, 'success');
}

// ========== TOUCH DRAG & DROP ==========
let touchCard = null;
let touchBoard = null;
let touchTimer = null;
let isDragging = false;
let touchGhost = null;
let touchStartY = 0;
let touchStartX = 0;
let longPressTriggered = false;

document.addEventListener('touchstart', (e) => {
  const cardEl = e.target.closest('.card');
  if (!cardEl || cardEl.closest('.modal-overlay')?.classList.contains('active')) return;
  if (e.target.closest('.card-action-btn, .card-checkbox')) return;

  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
  longPressTriggered = false;

  touchCard = cardEl.dataset.cardId;
  touchBoard = cardEl.dataset.boardId;

  touchTimer = setTimeout(() => {
    longPressTriggered = true;
    isDragging = true;

    touchGhost = cardEl.cloneNode(true);
    touchGhost.className = 'card drag-ghost';
    touchGhost.style.width = cardEl.offsetWidth + 'px';
    touchGhost.style.position = 'fixed';
    touchGhost.style.left = (touch.clientX - cardEl.offsetWidth / 2) + 'px';
    touchGhost.style.top = (touch.clientY - 60) + 'px';
    touchGhost.style.pointerEvents = 'none';
    touchGhost.style.zIndex = '9999';
    document.body.appendChild(touchGhost);

    cardEl.style.opacity = '0.4';

    document.querySelectorAll('.cards-list').forEach(el => {
      if (el.dataset.boardId !== touchBoard) {
        el.classList.add('drag-over');
      }
    });
  }, 400);
}, { passive: true });

document.addEventListener('touchmove', (e) => {
  if (!isDragging || !touchGhost) return;
  e.preventDefault();

  const touch = e.touches[0];
  touchGhost.style.left = (touch.clientX - touchGhost.offsetWidth / 2) + 'px';
  touchGhost.style.top = (touch.clientY - 60) + 'px';

  const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
  const cardsList = dropTarget?.closest('.cards-list');

  document.querySelectorAll('.cards-list').forEach(el => el.classList.remove('drag-over-active'));
  if (cardsList && cardsList.dataset.boardId !== touchBoard) {
    cardsList.classList.add('drag-over-active');
  }
}, { passive: false });

document.addEventListener('touchend', (e) => {
  clearTimeout(touchTimer);

  if (isDragging && touchCard && touchBoard) {
    const touch = e.changedTouches[0];
    const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
    const targetList = dropTarget?.closest('.cards-list');

    if (targetList && targetList.dataset.boardId !== touchBoard) {
      moveCard(touchBoard, touchCard, targetList.dataset.boardId);
    } else {
      const cardEl = document.querySelector(`.card[data-card-id="${touchCard}"]`);
      if (cardEl) cardEl.style.opacity = '';
    }
  } else {
    const cardEl = touchCard ? document.querySelector(`.card[data-card-id="${touchCard}"]`) : null;
    if (cardEl) cardEl.style.opacity = '';
  }

  if (touchGhost && touchGhost.parentNode) touchGhost.remove();
  document.querySelectorAll('.cards-list').forEach(el => el.classList.remove('drag-over', 'drag-over-active'));

  isDragging = false;
  touchCard = null;
  touchBoard = null;
  touchGhost = null;
  longPressTriggered = false;
}, { passive: true });

document.addEventListener('touchcancel', () => {
  clearTimeout(touchTimer);
  if (touchGhost && touchGhost.parentNode) touchGhost.remove();
  document.querySelectorAll('.cards-list').forEach(el => el.classList.remove('drag-over', 'drag-over-active'));

  const cardEl = touchCard ? document.querySelector(`.card[data-card-id="${touchCard}"]`) : null;
  if (cardEl) cardEl.style.opacity = '';

  isDragging = false;
  touchCard = null;
  touchBoard = null;
  touchGhost = null;
  longPressTriggered = false;
}, { passive: true });

// ========== CARD OPERATIONS ==========
function toggleCardDone(boardId, cardId) {
  const board = state.boards.find(b => b.id === boardId);
  if (!board) return;
  const card = board.cards.find(c => c.id === cardId);
  if (!card) return;
  card.done = !card.done;
  saveState();
  render();
  if (card.done) showToast("✨ Task completed! You're amazing!", 'success');
}

function getActiveBoardId() {
  return state.boards.length > 0 ? state.boards[0].id : null;
}

function safeOpenAddCardModal(boardId) {
  if (!boardId) {
    showToast('Create a board first! 🌻', 'info');
    return;
  }
  openAddCardModal(boardId);
}

function openAddCardModal(boardId) {
  const tagOptionsHtml = TAG_OPTIONS.map(t =>
    `<button type="button" class="form-tag-option" data-tag="${t.id}" onclick="toggleTagOption(this)">${t.label}</button>`
  ).join('');

  const priorityOptionsHtml = PRIORITIES.map(p =>
    `<button type="button" class="form-priority-option ${p.id === 'medium' ? 'selected' : ''}" data-priority="${p.id}" onclick="togglePriorityOption(this)">${p.label}</button>`
  ).join('');

  const boardOptions = state.boards.map(b =>
    `<option value="${b.id}" ${b.id === boardId ? 'selected' : ''}>${b.title}</option>`
  ).join('');

  showModal(`
    <div class="modal-header">
      <h2 class="modal-title">🌻 New Task</h2>
      <button class="modal-close" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label class="form-label"><i class="fa-regular fa-rectangle"></i> Board</label>
        <select class="form-select" id="cardBoardSelect">${boardOptions}</select>
      </div>
      <div class="form-group">
        <label class="form-label"><i class="fa-regular fa-heading"></i> Task Title</label>
        <input class="form-input" type="text" id="cardTitleInput" placeholder="What needs to be done?">
      </div>
      <div class="form-group">
        <label class="form-label"><i class="fa-regular fa-align-left"></i> Description <span style="color:var(--plum-muted);font-weight:400;font-size:12px">(optional)</span></label>
        <textarea class="form-textarea" id="cardDescInput" placeholder="Add details, notes, or a to-do list..."></textarea>
      </div>
      <div class="form-group">
        <label class="form-label"><i class="fa-regular fa-tags"></i> Tags</label>
        <div class="form-tags-container" id="cardTagsContainer">${tagOptionsHtml}</div>
      </div>
      <div class="form-group">
        <label class="form-label"><i class="fa-regular fa-flag"></i> Priority</label>
        <div class="form-priority-group">${priorityOptionsHtml}</div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="addCardFromForm()">✨ Add Task</button>
    </div>
  `);
}

function addCardFromForm() {
  const title = document.getElementById('cardTitleInput').value.trim();
  if (!title) {
    document.getElementById('cardTitleInput').focus();
    document.getElementById('cardTitleInput').style.borderColor = '#FF4757';
    showToast('Please enter a task title!', 'error');
    return;
  }

  const boardId = document.getElementById('cardBoardSelect').value;
  const description = document.getElementById('cardDescInput').value.trim();
  const selectedTags = [...document.querySelectorAll('#cardTagsContainer .form-tag-option.selected')].map(el => el.dataset.tag);
  const selectedPriority = document.querySelector('.form-priority-option.selected')?.dataset.priority || 'medium';

  const board = state.boards.find(b => b.id === boardId);
  if (!board) return;

  const card = {
    id: generateId(),
    title,
    description,
    priority: selectedPriority,
    tags: selectedTags,
    done: false,
    createdAt: Date.now()
  };

  board.cards.push(card);
  saveState();
  render();
  closeModal();
  showToast(`🌻 Added to "${board.title}"!`, 'success');
}

function openEditCardModal(boardId, cardId) {
  const board = state.boards.find(b => b.id === boardId);
  if (!board) return;
  const card = board.cards.find(c => c.id === cardId);
  if (!card) return;

  const tagOptionsHtml = TAG_OPTIONS.map(t =>
    `<button type="button" class="form-tag-option ${card.tags?.includes(t.id) ? 'selected' : ''}" data-tag="${t.id}" onclick="toggleTagOption(this)">${t.label}</button>`
  ).join('');

  const priorityOptionsHtml = PRIORITIES.map(p =>
    `<button type="button" class="form-priority-option ${card.priority === p.id ? 'selected' : ''}" data-priority="${p.id}" onclick="togglePriorityOption(this)">${p.label}</button>`
  ).join('');

  showModal(`
    <div class="modal-header">
      <h2 class="modal-title">✏️ Edit Task</h2>
      <button class="modal-close" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="modal-body" id="editCardModal">
      <div class="form-group">
        <label class="form-label"><i class="fa-regular fa-heading"></i> Task Title</label>
        <input class="form-input" type="text" id="editCardTitle" value="${escapeHtml(card.title)}">
      </div>
      <div class="form-group">
        <label class="form-label"><i class="fa-regular fa-align-left"></i> Description</label>
        <textarea class="form-textarea" id="editCardDesc">${escapeHtml(card.description || '')}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label"><i class="fa-regular fa-tags"></i> Tags</label>
        <div class="form-tags-container" id="editCardTags">${tagOptionsHtml}</div>
      </div>
      <div class="form-group">
        <label class="form-label"><i class="fa-regular fa-flag"></i> Priority</label>
        <div class="form-priority-group">${priorityOptionsHtml}</div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveEditCard('${boardId}', '${cardId}')">💾 Save Changes</button>
    </div>
  `);
}

function saveEditCard(boardId, cardId) {
  const board = state.boards.find(b => b.id === boardId);
  if (!board) return;
  const card = board.cards.find(c => c.id === cardId);
  if (!card) return;

  const title = document.getElementById('editCardTitle').value.trim();
  if (!title) {
    showToast('Task title cannot be empty!', 'error');
    return;
  }

  card.title = title;
  card.description = document.getElementById('editCardDesc').value.trim();
  card.tags = [...document.querySelectorAll('#editCardTags .form-tag-option.selected')].map(el => el.dataset.tag);
  card.priority = document.querySelector('#editCardModal .form-priority-option.selected')?.dataset.priority || 'medium';

  saveState();
  render();
  closeModal();
  showToast('✨ Task updated!', 'success');
}

function confirmDeleteCard(boardId, cardId) {
  const board = state.boards.find(b => b.id === boardId);
  if (!board) return;
  const card = board.cards.find(c => c.id === cardId);
  if (!card) return;

  showConfirmModal(
    '🗑️',
    'Delete this task?',
    `"${escapeHtml(card.title)}" will be removed forever.`,
    () => {
      board.cards = board.cards.filter(c => c.id !== cardId);
      saveState();
      render();
      closeModal();
      showToast('Task deleted', 'info');
    }
  );
}

// ========== BOARD OPERATIONS ==========
function openAddBoardModal() {
  const colorOptionsHtml = COLORS.map(c =>
    `<div class="color-option" style="background:${c.hex}" data-color="${c.name}" onclick="selectColor(this)"></div>`
  ).join('');

  showModal(`
    <div class="modal-header">
      <h2 class="modal-title">🌻 New Board</h2>
      <button class="modal-close" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label class="form-label"><i class="fa-regular fa-heading"></i> Board Name</label>
        <input class="form-input" type="text" id="newBoardName" placeholder="e.g., New Project">
      </div>
      <div class="form-group">
        <label class="form-label"><i class="fa-regular fa-face-smile"></i> Icon <span style="color:var(--plum-muted);font-weight:400;font-size:12px">(emoji)</span></label>
        <input class="form-input" type="text" id="newBoardIcon" value="📋" placeholder="📋" maxlength="2">
      </div>
      <div class="form-group">
        <label class="form-label"><i class="fa-regular fa-palette"></i> Color</label>
        <div class="color-picker" id="colorPicker">
          ${colorOptionsHtml}
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="addBoard()">✨ Create Board</button>
    </div>
  `);

  const firstColor = document.querySelector('.color-option');
  if (firstColor) firstColor.classList.add('selected');
}

function addBoard() {
  const name = document.getElementById('newBoardName').value.trim();
  if (!name) {
    showToast('Please enter a board name!', 'error');
    return;
  }

  const icon = document.getElementById('newBoardIcon').value.trim() || '📋';
  const color = document.querySelector('.color-option.selected')?.dataset.color || 'pink';

  state.boards.push({
    id: generateId(),
    title: name,
    icon,
    color,
    cards: []
  });

  saveState();
  render();
  closeModal();
  showToast(`🌻 "${name}" board created!`, 'success');
}

function openEditBoardModal(boardId) {
  const board = state.boards.find(b => b.id === boardId);
  if (!board) return;

  const colorOptionsHtml = COLORS.map(c =>
    `<div class="color-option ${board.color === c.name ? 'selected' : ''}" style="background:${c.hex}" data-color="${c.name}" onclick="selectColor(this)"></div>`
  ).join('');

  showModal(`
    <div class="modal-header">
      <h2 class="modal-title">✏️ Edit Board</h2>
      <button class="modal-close" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label class="form-label"><i class="fa-regular fa-heading"></i> Board Name</label>
        <input class="form-input" type="text" id="editBoardName" value="${escapeHtml(board.title)}">
      </div>
      <div class="form-group">
        <label class="form-label"><i class="fa-regular fa-face-smile"></i> Icon</label>
        <input class="form-input" type="text" id="editBoardIcon" value="${board.icon || '📋'}" maxlength="2">
      </div>
      <div class="form-group">
        <label class="form-label"><i class="fa-regular fa-palette"></i> Color</label>
        <div class="color-picker" id="editColorPicker">
          ${colorOptionsHtml}
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveEditBoard('${boardId}')">💾 Save Changes</button>
    </div>
  `);
}

function saveEditBoard(boardId) {
  const board = state.boards.find(b => b.id === boardId);
  if (!board) return;

  const name = document.getElementById('editBoardName').value.trim();
  if (!name) {
    showToast('Board name cannot be empty!', 'error');
    return;
  }

  board.title = name;
  board.icon = document.getElementById('editBoardIcon').value.trim() || '📋';
  board.color = document.querySelector('#editColorPicker .color-option.selected')?.dataset.color || board.color;

  saveState();
  render();
  closeModal();
  showToast('✨ Board updated!', 'success');
}

function confirmDeleteBoard(boardId) {
  const board = state.boards.find(b => b.id === boardId);
  if (!board) return;

  showConfirmModal(
    '🗑️',
    'Delete this board?',
    `"${escapeHtml(board.title)}" and all its ${board.cards.length} tasks will be lost forever.`,
    () => {
      state.boards = state.boards.filter(b => b.id !== boardId);
      saveState();
      render();
      closeModal();
      showToast('Board deleted', 'info');
    }
  );
}

// ========== MODAL ==========
function showModal(html) {
  const overlay = document.getElementById('modalOverlay');
  const content = document.getElementById('modalContent');
  content.innerHTML = html;
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';

  trapFocus(overlay);

  setTimeout(() => {
    const firstInput = content.querySelector('input:not([type="file"]):not([type="hidden"]), textarea, select, button:not(.modal-close)');
    if (firstInput) firstInput.focus();
  }, 150);
}

function closeModal() {
  const overlay = document.getElementById('modalOverlay');
  overlay.classList.remove('active');
  document.body.style.overflow = '';
  releaseFocusTrap();
}

// ========== FOCUS TRAP ==========
function trapFocus(container) {
  if (focusTrapHandler) {
    document.removeEventListener('keydown', focusTrapHandler);
    focusTrapHandler = null;
  }

  const focusable = container.querySelectorAll('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])');
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  setTimeout(() => first.focus(), 50);

  focusTrapHandler = function(e) {
    if (e.key !== 'Tab') return;
    const modal = document.getElementById('modalOverlay');
    if (!modal.classList.contains('active')) return;

    if (e.shiftKey) {
      if (document.activeElement === first || !modal.contains(document.activeElement)) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last || !modal.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  document.addEventListener('keydown', focusTrapHandler);
}

function releaseFocusTrap() {
  if (focusTrapHandler) {
    document.removeEventListener('keydown', focusTrapHandler);
    focusTrapHandler = null;
  }
}

// ========== MODAL HELPERS ==========
function toggleTagOption(el) {
  el.classList.toggle('selected');
}

function togglePriorityOption(el) {
  const container = el.parentElement;
  container.querySelectorAll('.form-priority-option').forEach(e => e.classList.remove('selected'));
  el.classList.add('selected');
}

function selectColor(el) {
  const container = el.parentElement;
  container.querySelectorAll('.color-option').forEach(e => e.classList.remove('selected'));
  el.classList.add('selected');
}

// ========== CONFIRM DIALOG ==========
function showConfirmModal(icon, title, text, callback) {
  showModal(`
    <div class="confirm-dialog">
      <div class="modal-body">
        <div class="confirm-icon">${icon}</div>
        <div class="confirm-title">${title}</div>
        <div class="confirm-text">${text}</div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="cancelConfirm()">Cancel</button>
        <button class="btn btn-danger" onclick="executeConfirm()">Yes, Delete</button>
      </div>
    </div>
  `);
  confirmCallback = callback;
}

function executeConfirm() {
  if (confirmCallback) confirmCallback();
  confirmCallback = null;
}

function cancelConfirm() {
  confirmCallback = null;
  closeModal();
}

// ========== IMPORT/EXPORT ==========
function openImportExport() {
  const menu = document.getElementById('importExportMenu');
  menu.classList.toggle('active');
}

// Close import/export menu on outside click
document.addEventListener('click', (e) => {
  const menu = document.getElementById('importExportMenu');
  const btn = document.getElementById('importExportBtn');
  if (menu && btn && !btn.contains(e.target) && !menu.contains(e.target)) {
    menu.classList.remove('active');
  }
});

function exportData() {
  const dataStr = JSON.stringify(state, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nagham-garden-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  document.getElementById('importExportMenu').classList.remove('active');
  showToast('📦 Backup downloaded!', 'success');
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.boards || !Array.isArray(data.boards)) {
        showToast('Invalid backup file!', 'error');
        return;
      }

      showConfirmModal(
        '📥',
        'Import backup?',
        `This will replace all current boards with ${data.boards.length} boards from the backup.`,
        () => {
          state = data;
          saveState();
          render();
          closeModal();
          document.getElementById('importExportMenu').classList.remove('active');
          showToast('✅ Backup restored successfully!', 'success');
        }
      );
    } catch (err) {
      showToast('Could not read file. Make sure it\'s a valid JSON backup.', 'error');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function resetAllData() {
  document.getElementById('importExportMenu').classList.remove('active');
  showConfirmModal(
    '⚠️',
    'Reset all data?',
    'This will delete ALL boards and tasks and restore the defaults. This cannot be undone!',
    () => {
      state = JSON.parse(JSON.stringify(DEFAULT_DATA));
      saveState();
      render();
      closeModal();
      showToast('🔄 Data reset to defaults', 'info');
    }
  );
}

// ========== KEYBOARD SHORTCUTS ==========
document.addEventListener('keydown', (e) => {
  // Close modal on Escape
  if (e.key === 'Escape') {
    closeModal();
    return;
  }

  // Enter in modal form submits
  if (e.key === 'Enter') {
    const modal = document.getElementById('modalOverlay');
    if (modal.classList.contains('active')) {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT')) {
        const submitBtn = modal.querySelector('.modal-footer .btn-primary');
        if (submitBtn) submitBtn.click();
      }
    }
  }

  // Ctrl/Cmd + K = New Task
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    safeOpenAddCardModal(getActiveBoardId());
  }

  // Ctrl/Cmd + Shift + N = New Board
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'n' || e.key === 'N')) {
    e.preventDefault();
    openAddBoardModal();
  }
});

// Close modal on overlay click
document.getElementById('modalOverlay').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeModal();
});

// ========== INIT ==========
render();
showToast('🌻 Welcome, Nagham! Let\'s grow your garden!', 'success');
