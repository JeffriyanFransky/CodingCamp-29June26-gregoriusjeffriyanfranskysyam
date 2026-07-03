/* ─────────────────────────────────────────────
   LIFE DASHBOARD — script.js
   Vanilla JS, LocalStorage only
───────────────────────────────────────────── */

'use strict';

/* ══════════════════════════════════════════
   STATE — loaded from / saved to LocalStorage
══════════════════════════════════════════ */
const STATE_KEY = 'lifedash_v1';

function loadState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) { /* ignore */ }
  return {
    theme:       'light',
    userName:    '',
    timerMins:   25,
    tasks:       [],
    links:       [],
    sortMode:    'default',
  };
}

function saveState() {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch (_) { /* ignore */ }
}

const state = loadState();

/* ══════════════════════════════════════════
   DOM REFS
══════════════════════════════════════════ */
const $ = id => document.getElementById(id);

const elHtml         = document.documentElement;
const elBtnTheme     = $('btn-theme');
const elBtnSettings  = $('btn-settings');
const elGreetText    = $('greeting-text');
const elGreetDate    = $('greeting-date');
const elGreetTime    = $('greeting-time');
const elTimerDisplay = $('timer-display');
const elTimerProg    = $('timer-progress');
const elBtnStart     = $('timer-start');
const elBtnStop      = $('timer-stop');
const elBtnReset     = $('timer-reset');
const elLinksGrid    = $('links-grid');
const elBtnAddLink   = $('btn-add-link');
const elTodoInput    = $('todo-input');
const elBtnAddTask   = $('btn-add-task');
const elTodoList     = $('todo-list');
const elTodoEmpty    = $('todo-empty');
const elBtnSort      = $('btn-sort');
const elSortDD       = $('sort-dropdown');
const elToast        = $('toast');

// Modals
const elModalSettings  = $('modal-settings');
const elInputName      = $('input-name');
const elInputDuration  = $('input-duration');
const elSaveSettings   = $('save-settings');
const elCloseSettings  = $('close-settings');

const elModalLink    = $('modal-link');
const elLinkLabel    = $('link-label');
const elLinkUrl      = $('link-url');
const elSaveLink     = $('save-link');
const elCloseLink    = $('close-link');

const elModalEditTask  = $('modal-edit-task');
const elEditTaskInput  = $('edit-task-input');
const elSaveEditTask   = $('save-edit-task');
const elCloseEditTask  = $('close-edit-task');

/* ══════════════════════════════════════════
   THEME
══════════════════════════════════════════ */
function applyTheme(theme) {
  elHtml.setAttribute('data-theme', theme);
  state.theme = theme;
  saveState();
}

elBtnTheme.addEventListener('click', () => {
  applyTheme(state.theme === 'light' ? 'dark' : 'light');
});

// Init
applyTheme(state.theme);

/* ══════════════════════════════════════════
   CLOCK & GREETING
══════════════════════════════════════════ */
const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

function updateClock() {
  const now = new Date();
  const h = now.getHours();
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');

  elGreetTime.textContent = `${String(h).padStart(2,'0')}:${m}`;

  // Greeting
  let period = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  const name  = state.userName ? `, ${state.userName}` : '';
  elGreetText.textContent = `Good ${period}${name}`;

  // Date
  elGreetDate.textContent =
    `${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}`;
}

updateClock();
setInterval(updateClock, 1000);

/* ══════════════════════════════════════════
   FOCUS TIMER (Pomodoro)
══════════════════════════════════════════ */
let timerInterval   = null;
let timerRunning    = false;
let timerSecondsLeft = state.timerMins * 60;
let timerTotalSecs   = state.timerMins * 60;

function formatTimer(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function renderTimer() {
  elTimerDisplay.textContent = formatTimer(timerSecondsLeft);
  const pct = timerTotalSecs > 0 ? (timerSecondsLeft / timerTotalSecs) * 100 : 100;
  elTimerProg.style.width = `${pct}%`;
}

function startTimer() {
  if (timerRunning) return;
  timerRunning = true;
  elTimerDisplay.closest('.card-timer').classList.add('timer-running');
  timerInterval = setInterval(() => {
    if (timerSecondsLeft <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      elTimerDisplay.closest('.card-timer').classList.remove('timer-running');
      showToast('Focus session complete! 🎉');
      return;
    }
    timerSecondsLeft--;
    renderTimer();
  }, 1000);
}

function stopTimer() {
  if (!timerRunning) return;
  clearInterval(timerInterval);
  timerRunning = false;
  elTimerDisplay.closest('.card-timer').classList.remove('timer-running');
}

function resetTimer() {
  stopTimer();
  timerTotalSecs   = state.timerMins * 60;
  timerSecondsLeft = timerTotalSecs;
  renderTimer();
}

elBtnStart.addEventListener('click', startTimer);
elBtnStop.addEventListener('click', stopTimer);
elBtnReset.addEventListener('click', resetTimer);

// Init timer display
renderTimer();

/* ══════════════════════════════════════════
   SETTINGS MODAL
══════════════════════════════════════════ */
function openSettings() {
  elInputName.value     = state.userName;
  elInputDuration.value = state.timerMins;
  showModal(elModalSettings);
  setTimeout(() => elInputName.focus(), 80);
}

elBtnSettings.addEventListener('click', openSettings);
elCloseSettings.addEventListener('click', () => hideModal(elModalSettings));

elSaveSettings.addEventListener('click', () => {
  const name = elInputName.value.trim();
  const mins = parseInt(elInputDuration.value, 10);

  state.userName = name;
  if (!isNaN(mins) && mins >= 1 && mins <= 120) {
    state.timerMins = mins;
    resetTimer(); // apply new duration
  }
  saveState();
  updateClock();
  hideModal(elModalSettings);
  showToast('Settings saved');
});

// Enter key
elInputName.addEventListener('keydown',     e => e.key === 'Enter' && elSaveSettings.click());
elInputDuration.addEventListener('keydown', e => e.key === 'Enter' && elSaveSettings.click());

/* ══════════════════════════════════════════
   TO-DO LIST
══════════════════════════════════════════ */
let editingTaskId = null;

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function getSortedTasks() {
  const tasks = [...state.tasks];
  switch (state.sortMode) {
    case 'az':
      return tasks.sort((a, b) => a.text.localeCompare(b.text, undefined, { sensitivity: 'base' }));
    case 'za':
      return tasks.sort((a, b) => b.text.localeCompare(a.text, undefined, { sensitivity: 'base' }));
    case 'active':
      return tasks.sort((a, b) => Number(a.done) - Number(b.done));
    case 'done':
      return tasks.sort((a, b) => Number(b.done) - Number(a.done));
    default:
      return tasks; // insertion order
  }
}

function renderTasks() {
  elTodoList.innerHTML = '';
  const sorted = getSortedTasks();

  if (sorted.length === 0) {
    elTodoEmpty.classList.remove('hidden');
    return;
  }
  elTodoEmpty.classList.add('hidden');

  sorted.forEach(task => {
    const li = document.createElement('li');
    li.className = `todo-item${task.done ? ' done' : ''}`;
    li.dataset.id = task.id;

    li.innerHTML = `
      <button class="todo-check" aria-label="Toggle done">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </button>
      <span class="todo-text">${escapeHtml(task.text)}</span>
      <div class="todo-item-actions">
        <button class="task-btn edit-btn" aria-label="Edit task" title="Edit">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="task-btn danger del-btn" aria-label="Delete task" title="Delete">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/>
            <path d="M9 6V4h6v2"/>
          </svg>
        </button>
      </div>
    `;

    // Toggle done
    li.querySelector('.todo-check').addEventListener('click', () => {
      toggleTask(task.id, li.querySelector('.todo-check'));
    });

    // Edit
    li.querySelector('.edit-btn').addEventListener('click', () => {
      openEditTask(task.id, task.text);
    });

    // Delete
    li.querySelector('.del-btn').addEventListener('click', () => {
      deleteTask(task.id, li);
    });

    elTodoList.appendChild(li);
  });
}

function addTask() {
  const text = elTodoInput.value.trim();
  if (!text) return;

  // Duplicate check (case-insensitive)
  const exists = state.tasks.some(
    t => t.text.toLowerCase() === text.toLowerCase()
  );
  if (exists) {
    showToast('Task already exists');
    elTodoInput.select();
    return;
  }

  state.tasks.push({ id: generateId(), text, done: false });
  saveState();
  elTodoInput.value = '';
  renderTasks();
}

function toggleTask(id, checkEl) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;
  task.done = !task.done;
  saveState();
  // Micro-animation
  checkEl.classList.remove('check-pop');
  void checkEl.offsetWidth; // reflow
  checkEl.classList.add('check-pop');
  renderTasks();
}

function deleteTask(id, liEl) {
  liEl.style.opacity   = '0';
  liEl.style.transform = 'translateX(12px)';
  liEl.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
  setTimeout(() => {
    state.tasks = state.tasks.filter(t => t.id !== id);
    saveState();
    renderTasks();
  }, 180);
}

function openEditTask(id, currentText) {
  editingTaskId         = id;
  elEditTaskInput.value = currentText;
  showModal(elModalEditTask);
  setTimeout(() => elEditTaskInput.focus(), 80);
}

elSaveEditTask.addEventListener('click', () => {
  const newText = elEditTaskInput.value.trim();
  if (!newText) return;

  // Duplicate check (exclude current task)
  const exists = state.tasks.some(
    t => t.id !== editingTaskId && t.text.toLowerCase() === newText.toLowerCase()
  );
  if (exists) {
    showToast('Task already exists');
    elEditTaskInput.select();
    return;
  }

  const task = state.tasks.find(t => t.id === editingTaskId);
  if (task) { task.text = newText; saveState(); renderTasks(); }
  hideModal(elModalEditTask);
  editingTaskId = null;
});

elCloseEditTask.addEventListener('click', () => {
  hideModal(elModalEditTask);
  editingTaskId = null;
});

elEditTaskInput.addEventListener('keydown', e => e.key === 'Enter' && elSaveEditTask.click());

// Add task via button / Enter
elBtnAddTask.addEventListener('click', addTask);
elTodoInput.addEventListener('keydown', e => e.key === 'Enter' && addTask());

// Init
renderTasks();

/* ── Sort ── */
elBtnSort.addEventListener('click', e => {
  e.stopPropagation();
  elSortDD.classList.toggle('hidden');
});

document.addEventListener('click', e => {
  if (!elSortDD.contains(e.target) && e.target !== elBtnSort) {
    elSortDD.classList.add('hidden');
  }
});

elSortDD.querySelectorAll('.sort-opt').forEach(btn => {
  btn.addEventListener('click', () => {
    state.sortMode = btn.dataset.sort;
    saveState();
    // Update active highlight
    elSortDD.querySelectorAll('.sort-opt').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    elSortDD.classList.add('hidden');
    renderTasks();
  });
});

// Highlight current sort
(function initSortHighlight() {
  elSortDD.querySelectorAll('.sort-opt').forEach(b => {
    if (b.dataset.sort === state.sortMode) b.classList.add('active');
  });
})();

/* ══════════════════════════════════════════
   QUICK LINKS
══════════════════════════════════════════ */
function renderLinks() {
  elLinksGrid.innerHTML = '';
  state.links.forEach((link, idx) => {
    const chip = document.createElement('div');
    chip.className = 'link-chip';
    chip.title     = link.url;

    // Favicon
    let favicon = '';
    try {
      const host = new URL(link.url).hostname;
      favicon = `<img src="https://www.google.com/s2/favicons?sz=16&domain=${host}"
                      width="16" height="16"
                      style="border-radius:3px;flex-shrink:0"
                      onerror="this.style.display='none'" alt="" />`;
    } catch (_) { /* invalid url */ }

    chip.innerHTML = `
      ${favicon}
      <span>${escapeHtml(link.label)}</span>
      <button class="link-chip-del" aria-label="Remove link" title="Remove">✕</button>
    `;

    // Navigate
    chip.addEventListener('click', e => {
      if (e.target.closest('.link-chip-del')) return;
      window.open(link.url, '_blank', 'noopener,noreferrer');
    });

    // Delete
    chip.querySelector('.link-chip-del').addEventListener('click', e => {
      e.stopPropagation();
      state.links.splice(idx, 1);
      saveState();
      renderLinks();
    });

    elLinksGrid.appendChild(chip);
  });
}

elBtnAddLink.addEventListener('click', () => {
  elLinkLabel.value = '';
  elLinkUrl.value   = '';
  showModal(elModalLink);
  setTimeout(() => elLinkLabel.focus(), 80);
});

elSaveLink.addEventListener('click', () => {
  const label = elLinkLabel.value.trim();
  let   url   = elLinkUrl.value.trim();
  if (!label || !url) return;

  // Auto-add protocol
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

  state.links.push({ label, url });
  saveState();
  renderLinks();
  hideModal(elModalLink);
});

elCloseLink.addEventListener('click', () => hideModal(elModalLink));
elLinkUrl.addEventListener('keydown',   e => e.key === 'Enter' && elSaveLink.click());
elLinkLabel.addEventListener('keydown', e => e.key === 'Enter' && elLinkUrl.focus());

// Init
renderLinks();

/* ══════════════════════════════════════════
   MODAL HELPERS
══════════════════════════════════════════ */
function showModal(el) {
  el.classList.remove('hidden');
  // close on overlay click
  el.addEventListener('click', overlayClose);
}

function hideModal(el) {
  el.classList.add('hidden');
  el.removeEventListener('click', overlayClose);
}

function overlayClose(e) {
  if (e.target === e.currentTarget) hideModal(e.currentTarget);
}

// ESC closes any open modal
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  [elModalSettings, elModalLink, elModalEditTask].forEach(m => {
    if (!m.classList.contains('hidden')) hideModal(m);
  });
  elSortDD.classList.add('hidden');
});

/* ══════════════════════════════════════════
   TOAST
══════════════════════════════════════════ */
let toastTimer = null;

function showToast(msg, duration = 2400) {
  elToast.textContent = msg;
  elToast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => elToast.classList.add('hidden'), duration);
}

/* ══════════════════════════════════════════
   UTILS
══════════════════════════════════════════ */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
