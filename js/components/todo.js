/**
 * todo.js — Right panel: persistent to-do list with tick & remove
 */

const TodoComponent = (() => {
  const STORAGE_KEY = 'todo_items';
  let _items = [];

  async function _load() {
    const data = await Storage.get([STORAGE_KEY]);
    _items = data[STORAGE_KEY] ?? [];
  }

  async function _save() {
    await Storage.set({ [STORAGE_KEY]: _items });
  }

  function _newId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  function _renderList(listEl, countEl, footerEl) {
    const total = _items.length;
    const done  = _items.filter(i => i.done).length;

    if (countEl) countEl.textContent = `${total} task${total !== 1 ? 's' : ''}`;

    if (total === 0) {
      listEl.innerHTML = `
        <div class="todo-empty">
          <span class="todo-empty-icon">✅</span>
          <span>All clear! Add a task to get started.</span>
        </div>
      `;
      if (footerEl) footerEl.style.display = 'none';
      return;
    }

    if (footerEl) {
      footerEl.style.display = 'flex';
      const stat = footerEl.querySelector('.todo-footer-stat');
      if (stat) stat.textContent = `${done} of ${total} done`;
    }

    listEl.innerHTML = _items.map(item => `
      <div class="todo-item ${item.done ? 'done' : ''}" data-id="${item.id}">
        <div class="todo-check" data-id="${item.id}" title="Toggle done">
          <span class="todo-check-mark">✓</span>
        </div>
        <span class="todo-text">${_escape(item.text)}</span>
        <button class="todo-remove-btn" data-id="${item.id}" title="Remove task">×</button>
      </div>
    `).join('');

    // Attach listeners to list items
    listEl.querySelectorAll('.todo-check').forEach(el => {
      el.addEventListener('click', async () => {
        const id = el.getAttribute('data-id');
        const item = _items.find(i => i.id === id);
        if (item) {
          item.done = !item.done;
          await _save();
          _renderList(listEl, countEl, footerEl);
        }
      });
    });

    listEl.querySelectorAll('.todo-remove-btn').forEach(el => {
      el.addEventListener('click', async () => {
        const id = el.getAttribute('data-id');
        _items = _items.filter(i => i.id !== id);
        await _save();
        _renderList(listEl, countEl, footerEl);
      });
    });
  }

  function _escape(str) {
    return str
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  async function render(container) {
    await _load();

    container.innerHTML = `
      <div class="todo-panel">
        <div class="todo-header">
          <span class="todo-title">To-Do List</span>
          <span class="todo-count" id="todo-count"></span>
        </div>

        <div class="todo-add-row">
          <input
            type="text"
            class="todo-input"
            id="todo-input"
            placeholder="Add a new task…"
            maxlength="120"
            autocomplete="off"
            spellcheck="false"
          />
          <button class="todo-add-btn" id="todo-add-btn" title="Add task">+</button>
        </div>

        <div class="todo-list" id="todo-list"></div>

        <div class="todo-footer" id="todo-footer" style="display:none;">
          <span class="todo-footer-stat" id="todo-stat"></span>
          <button class="todo-clear-done" id="todo-clear-done">Clear done</button>
        </div>
      </div>
    `;

    const input   = document.getElementById('todo-input');
    const addBtn  = document.getElementById('todo-add-btn');
    const listEl  = document.getElementById('todo-list');
    const countEl = document.getElementById('todo-count');
    const footerEl= document.getElementById('todo-footer');
    const clearBtn= document.getElementById('todo-clear-done');

    async function addTask() {
      const text = input.value.trim();
      if (!text) return;
      _items.push({ id: _newId(), text, done: false });
      await _save();
      input.value = '';
      _renderList(listEl, countEl, footerEl);
      input.focus();
    }

    addBtn.addEventListener('click', addTask);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addTask();
    });

    clearBtn.addEventListener('click', async () => {
      _items = _items.filter(i => !i.done);
      await _save();
      _renderList(listEl, countEl, footerEl);
    });

    _renderList(listEl, countEl, footerEl);
  }

  return { render };
})();
