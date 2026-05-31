/**
 * greeting.js — Right-column greeting card
 *
 * Sections:
 *  TOP    — hello, + username (click to edit inline)
 *  MID    — Sticky Notes Board dropzone (masonry container filled by drag & drop)
 *  BOTTOM — motivational quote (rotates daily)
 */

const GreetingComponent = (() => {
  const KEY_NAME = 'user_name';

  // ── Quotes (rotates by day) ───────────────────────────────
  const QUOTES = [
    { text: "The secret of getting ahead is getting started.", attr: "Mark Twain" },
    { text: "It always seems impossible until it's done.", attr: "Nelson Mandela" },
    { text: "Don't watch the clock; do what it does. Keep going.", attr: "Sam Levenson" },
    { text: "Act as if what you do makes a difference. It does.", attr: "William James" },
    { text: "Believe you can and you're halfway there.", attr: "Theodore Roosevelt" },
    { text: "You are never too old to set another goal or to dream a new dream.", attr: "C.S. Lewis" },
    { text: "Start where you are. Use what you have. Do what you can.", attr: "Arthur Ashe" },
    { text: "Success is not final, failure is not fatal: it is the courage to continue.", attr: "Churchill" },
    { text: "The harder the conflict, the more glorious the triumph.", attr: "Thomas Paine" },
    { text: "Do one thing every day that scares you.", attr: "Eleanor Roosevelt" },
    { text: "Keep your face always toward the sunshine — shadows will fall behind you.", attr: "Whitman" },
    { text: "What you get by achieving your goals is not as important as what you become.", attr: "Zig Ziglar" },
  ];

  function _dailyQuote() {
    return QUOTES[Math.floor(Date.now() / 86400000) % QUOTES.length];
  }

  async function _loadName() {
    const data = await Storage.get([KEY_NAME]);
    return data[KEY_NAME] ?? null;
  }

  // ── Render ────────────────────────────────────────────────
  async function render(container) {
    const name = await _loadName();
    const displayName = (name && name.trim()) ? name.trim() : 'user';
    const quote = _dailyQuote();

    container.innerHTML = `
      <div class="section-greeting">

        <!-- TOP: hello + username -->
        <div class="greeting-top">
          <span class="greeting-hello">hello,</span>
          <div class="greeting-username-wrap" id="greeting-name-wrap">
            <span class="greeting-username" id="greeting-username">${displayName}</span>
            <span class="greeting-edit-hint">✎ edit</span>
          </div>
        </div>

        <!-- MID: Sticky Notes Masonry Dropzone -->
        <div class="greeting-board-block">
          <div class="greeting-board-header">
            <span class="greeting-board-label">Sticky Notes Board</span>
            <span class="greeting-board-hint">Drag & drop sticky notes here</span>
          </div>
          <div id="sticky-notes-board" class="sticky-notes-board">
            <!-- Notes are injected here dynamically by StickyNotesComponent -->
          </div>
        </div>

        <!-- BOTTOM: quote -->
        <div class="greeting-quote-block">
          <p class="greeting-quote">"${quote.text}"</p>
          <span class="greeting-quote-attr">— ${quote.attr}</span>
        </div>

      </div>
    `;

    // ── Name click-to-edit ─────────────────────────────────
    const nameSpan = document.getElementById('greeting-username');
    if (nameSpan) {
      nameSpan.addEventListener('click', () => _startNameEdit(container, nameSpan));
    }

    // Trigger StickyNotesComponent board rendering if available
    if (typeof StickyNotesComponent !== 'undefined') {
      StickyNotesComponent.initBoard();
    }
  }

  // ── Inline name edit ──────────────────────────────────────
  function _startNameEdit(container, spanEl) {
    const wrap = document.getElementById('greeting-name-wrap');
    if (!wrap) return;

    const currentValue = spanEl.textContent === 'user' ? '' : spanEl.textContent;
    const input = document.createElement('input');
    input.type        = 'text';
    input.className   = 'greeting-name-input';
    input.value       = currentValue;
    input.placeholder = 'your name';
    input.maxLength   = 24;
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('spellcheck', 'false');

    wrap.innerHTML = '';
    wrap.appendChild(input);
    input.focus();
    input.select();

    let committed = false;
    async function commit() {
      if (committed) return;
      committed = true;
      await Storage.set({ [KEY_NAME]: input.value.trim() || null });
      await render(container);
    }

    input.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter')  { e.preventDefault(); await commit(); }
      if (e.key === 'Escape') { committed = true; await render(container); }
    });
    input.addEventListener('blur', commit);
  }

  return { render };
})();
