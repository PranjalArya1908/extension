/**
 * stickynotes.js — Interactive Sticky Notes drag-and-drop system.
 * Handles note drafting on the left and masonry representation on the right.
 */

const StickyNotesComponent = (() => {
  const STORAGE_KEY = 'sticky_notes_list';

  // Default color presets mapping class to hex/pastel color
  const COLORS = {
    yellow: '#fef08a',
    pink: '#fbcfe8',
    blue: '#bfdbfe',
    green: '#bbf7d0',
    orange: '#fed7aa'
  };

  let _activeColor = 'yellow';
  let _notes = [];

  // ── Storage Operations ──────────────────────────────────
  async function _loadNotes() {
    const data = await Storage.get([STORAGE_KEY]);
    _notes = data[STORAGE_KEY] ?? [];
  }

  async function _saveNotes() {
    await Storage.set({ [STORAGE_KEY]: _notes });
  }

  // ── Board Rendering (Masonry inside Greeting Card) ──────
  async function initBoard() {
    const board = document.getElementById('sticky-notes-board');
    if (!board) return;

    await _loadNotes();

    // ── Dropzone Event Listeners ──────────────────────────
    board.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      board.classList.add('drag-over');
    });

    board.addEventListener('dragleave', () => {
      board.classList.remove('drag-over');
    });

    board.addEventListener('drop', async (e) => {
      e.preventDefault();
      board.classList.remove('drag-over');

      // Retrieve content from drag data or fallback directly to textarea value
      let text = e.dataTransfer.getData('text/plain');
      if (!text) {
        const textarea = document.getElementById('note-draft-text');
        text = textarea ? textarea.value : '';
      }

      if (text.trim()) {
        await _addNewNote(text, _activeColor);
        // Clear creator input & reset counter
        const textarea = document.getElementById('note-draft-text');
        if (textarea) {
          textarea.value = '';
          const counter = document.getElementById('note-word-counter');
          if (counter) counter.textContent = '0 / 300 words';
        }
      }
    });

    _renderBoardContents();
  }

  function _renderBoardContents() {
    const board = document.getElementById('sticky-notes-board');
    if (!board) return;

    if (_notes.length === 0) {
      board.innerHTML = `
        <div class="sticky-board-empty">
          <span class="sticky-board-empty-icon">📝</span>
          <span>No notes here yet. Draft one on the left and drag it over!</span>
        </div>
      `;
      return;
    }

    // Masonry column wrapper
    board.innerHTML = `
      <div class="sticky-notes-masonry">
        ${_notes.map(note => `
          <div class="sticky-note-item" style="background-color: ${COLORS[note.color] || COLORS.yellow};">
            <button class="sticky-note-delete" data-id="${note.id}" title="Delete Note">×</button>
            <div class="sticky-note-text">${_escapeHTML(note.text)}</div>
          </div>
        `).join('')}
      </div>
    `;

    // Hook up delete buttons
    board.querySelectorAll('.sticky-note-delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        await _deleteNote(id);
      });
    });
  }

  // ── Creator Rendering (Left Column Card) ─────────────────
  async function renderCreator(container) {
    container.innerHTML = `
      <div class="section-note-creator">
        <div class="note-creator-header">
          <span class="note-creator-title">Draft a Sticky</span>
          <span class="note-creator-hint" id="note-word-counter">0 / 300 words</span>
        </div>

        <!-- Draggable Sticky Draft -->
        <div class="note-draft-pad" id="note-draft-pad" draggable="true" style="background-color: ${COLORS[_activeColor]};">
          <textarea
            class="note-draft-textarea"
            id="note-draft-text"
            placeholder="Write something down..."
            spellcheck="false"
          ></textarea>
        </div>

        <!-- Toolbar: Colors and Quick Add -->
        <div class="note-creator-toolbar">
          <div class="color-presets">
            ${Object.keys(COLORS).map(color => `
              <div 
                class="color-dot dot-${color} ${color === _activeColor ? 'active' : ''}" 
                data-color="${color}" 
                title="Select ${color}"
              ></div>
            `).join('')}
          </div>
          <button class="btn-add-note" id="btn-add-note">Add Note</button>
        </div>
      </div>
    `;

    const draftPad = document.getElementById('note-draft-pad');
    const textarea = document.getElementById('note-draft-text');
    const addBtn = document.getElementById('btn-add-note');

    // ── Word Counter & Enforcement ────────────────────────
    if (textarea) {
      const counter = document.getElementById('note-word-counter');
      const updateCount = () => {
        const words = textarea.value.trim().split(/\s+/).filter(Boolean);
        const count = words.length;
        if (counter) {
          counter.textContent = `${count} / 300 words`;
          if (count > 250) {
            counter.style.color = '#ef4444'; // Warning color
          } else {
            counter.style.color = '';
          }
        }
      };

      textarea.addEventListener('input', () => {
        const textValue = textarea.value;
        const words = textValue.trim().split(/\s+/).filter(Boolean);
        if (words.length > 300) {
          // Truncate to exactly 300 words
          let charIndex = 0;
          let wordCount = 0;
          for (let i = 0; i < textValue.length; i++) {
            if (/\s/.test(textValue[i])) {
              if (i > 0 && !/\s/.test(textValue[i-1])) {
                wordCount++;
                if (wordCount === 300) {
                  charIndex = i;
                  break;
                }
              }
            }
          }
          if (charIndex > 0) {
            textarea.value = textValue.slice(0, charIndex);
          } else {
            textarea.value = words.slice(0, 300).join(' ');
          }
        }
        updateCount();
      });

      // Initialize counter
      updateCount();
    }

    // ── Drag & Drop Emitters ──────────────────────────────
    if (draftPad && textarea) {
      draftPad.addEventListener('dragstart', (e) => {
        const text = textarea.value.trim();
        if (!text) {
          e.preventDefault();
          return;
        }
        e.dataTransfer.setData('text/plain', text);
        e.dataTransfer.effectAllowed = 'copyMove';
        draftPad.classList.add('dragging');
      });

      draftPad.addEventListener('dragend', () => {
        draftPad.classList.remove('dragging');
      });
    }

    // ── Color Picker Selection ─────────────────────────────
    container.querySelectorAll('.color-dot').forEach(dot => {
      dot.addEventListener('click', (e) => {
        container.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
        e.target.classList.add('active');
        _activeColor = e.target.getAttribute('data-color');
        if (draftPad) {
          draftPad.style.backgroundColor = COLORS[_activeColor];
          draftPad.style.setProperty('--draft-note-color', COLORS[_activeColor]);
        }
      });
    });

    // ── Button Click Alternative ────────────────────────────
    if (addBtn && textarea) {
      addBtn.addEventListener('click', async () => {
        const text = textarea.value.trim();
        if (text) {
          await _addNewNote(text, _activeColor);
          textarea.value = '';
          const counter = document.getElementById('note-word-counter');
          if (counter) counter.textContent = '0 / 300 words';
        }
      });
    }
  }

  // ── Helper Operations ───────────────────────────────────
  async function _addNewNote(text, color) {
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (words.length > 300) {
      text = words.slice(0, 300).join(' ');
    }
    const note = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      text,
      color
    };
    _notes.unshift(note);
    await _saveNotes();
    _renderBoardContents();
  }

  async function _deleteNote(id) {
    _notes = _notes.filter(note => note.id !== id);
    await _saveNotes();
    _renderBoardContents();
  }

  function _escapeHTML(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  return {
    renderCreator,
    initBoard
  };
})();
