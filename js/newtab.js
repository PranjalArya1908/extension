/**
 * newtab.js — Main entry point
 *
 * Manages two simultaneous layouts in the DOM:
 *   - Minimalistic (clock + greeting + sticky notes)
 *   - Work         (history + widgets + todo)
 *
 * Both share the same bottom bar. Mode switching is instant —
 * the layouts are pre-rendered in HTML, CSS shows only one.
 */

(async () => {
  // 1. Apply saved theme (sets data-mode and data-dark on body)
  await ThemeManager.init();

  // 2. Initial render for both layouts in parallel
  await Promise.all([
    _renderMinimalistic(),
    _renderWork(),
  ]);

  // 3. Sidebar collapse (minimalistic only)
  _initSidebarToggle();

  // 4. Bottom clock (shared)
  _startBottomClock();
})();

// ── Minimalistic layout renderer ─────────────────────────────
async function _renderMinimalistic() {
  if (typeof ClockComponent !== 'undefined') ClockComponent.destroy();

  // Clock
  const clockSlot = document.getElementById('slot-clock');
  if (clockSlot && typeof ClockComponent !== 'undefined') {
    ClockComponent.render(clockSlot, { use24h: false });
  }

  // Search bar (minimalistic slot)
  const searchMin = document.getElementById('slot-search-min');
  if (searchMin && typeof SearchComponent !== 'undefined') {
    await SearchComponent.render(searchMin);
  }

  // Sticky note creator
  const creatorSlot = document.getElementById('slot-note-creator');
  if (creatorSlot && typeof StickyNotesComponent !== 'undefined') {
    await StickyNotesComponent.renderCreator(creatorSlot);
  }

  // Greeting card (includes sticky board)
  const greetSlot = document.getElementById('slot-greeting');
  if (greetSlot && typeof GreetingComponent !== 'undefined') {
    await GreetingComponent.render(greetSlot);
  }

  // Quicklinks sidebar
  const linksSlot = document.getElementById('slot-quicklinks');
  if (linksSlot && typeof QuickLinksComponent !== 'undefined') {
    await QuickLinksComponent.render(linksSlot);
  }
}

// ── Work layout renderer ──────────────────────────────────────
async function _renderWork() {
  // History panel (left)
  const histSlot = document.getElementById('slot-history');
  if (histSlot && typeof HistoryComponent !== 'undefined') {
    await HistoryComponent.render(histSlot);
  }

  // Search bar (work slot)
  const searchWork = document.getElementById('slot-search-work');
  if (searchWork && typeof SearchComponent !== 'undefined') {
    await SearchComponent.render(searchWork);
  }

  // Widget tabs + display
  if (typeof WidgetsController !== 'undefined') {
    await WidgetsController.init();
  }

  // Todo list (right)
  const todoSlot = document.getElementById('slot-todo');
  if (todoSlot && typeof TodoComponent !== 'undefined') {
    await TodoComponent.render(todoSlot);
  }
}

// ── Sidebar toggle (minimalistic only) ───────────────────────
async function _initSidebarToggle() {
  const toggleBtn = document.getElementById('btn-sidebar-toggle');
  if (!toggleBtn) return;

  const data = await Storage.get(['sidebar_collapsed']);
  const isCollapsed = data['sidebar_collapsed'] === true;
  document.body.classList.toggle('sidebar-collapsed', isCollapsed);
  _updateSidebarIcon(isCollapsed);

  toggleBtn.addEventListener('click', async () => {
    const nowCollapsed = document.body.classList.contains('sidebar-collapsed');
    const newState = !nowCollapsed;
    document.body.classList.toggle('sidebar-collapsed', newState);
    _updateSidebarIcon(newState);
    await Storage.set({ sidebar_collapsed: newState });
  });
}

function _updateSidebarIcon(isCollapsed) {
  const btn = document.getElementById('btn-sidebar-toggle');
  if (!btn) return;
  const icon = btn.querySelector('.toggle-icon');
  if (icon) icon.textContent = isCollapsed ? '▶' : '◀';
  btn.title = isCollapsed ? 'Show Sidebar' : 'Hide Sidebar';
}

// ── Bottom bar live clock ─────────────────────────────────────
let _clockInterval = null;
function _startBottomClock() {
  const el = document.getElementById('bottom-clock');
  if (!el) return;
  const tick = () => {
    const n = new Date();
    const h = String(n.getHours()).padStart(2, '0');
    const m = String(n.getMinutes()).padStart(2, '0');
    const s = String(n.getSeconds()).padStart(2, '0');
    el.textContent = `${h}:${m}:${s}`;
  };
  tick();
  if (_clockInterval) clearInterval(_clockInterval);
  _clockInterval = setInterval(tick, 1000);
}
