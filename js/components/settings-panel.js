/**
 * settings-panel.js — Slide-in settings panel
 * Handles open/close and renders settings UI.
 */

const SettingsPanel = (() => {
  let _isOpen = false;

  function _buildHTML() {
    const { mode, isDark } = ThemeManager.getState();
    return `
      <button class="settings-close-btn" id="settings-close-btn" title="Close">✕</button>
      <h2>Settings</h2>

      <!-- ── Theme ──────────────────────────────────────── -->
      <div class="settings-section">
        <div class="settings-section-title">Page Mode</div>
        <div class="theme-grid">
          <div class="theme-option ${mode === 'minimalistic' ? 'selected' : ''}"
               id="sp-mode-minimalistic" data-mode="minimalistic">
            🌿 Minimalistic
          </div>
          <div class="theme-option ${mode === 'work' ? 'selected' : ''}"
               id="sp-mode-work" data-mode="work">
            💼 Work
          </div>
        </div>
      </div>

      <!-- ── Light / Dark ───────────────────────────────── -->
      <div class="settings-section">
        <div class="settings-section-title">Appearance</div>
        <div class="settings-toggle-row">
          Dark Mode
          <label class="toggle-switch">
            <input type="checkbox" id="sp-dark-toggle" ${isDark ? 'checked' : ''} />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <!-- ── Sections visibility ────────────────────────── -->
      <div class="settings-section">
        <div class="settings-section-title">Visible Sections</div>
        <div class="settings-toggle-row">
          Clock
          <label class="toggle-switch">
            <input type="checkbox" id="sp-toggle-clock" checked />
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="settings-toggle-row">
          Search Bar
          <label class="toggle-switch">
            <input type="checkbox" id="sp-toggle-search" checked />
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="settings-toggle-row">
          Quick Links
          <label class="toggle-switch">
            <input type="checkbox" id="sp-toggle-quicklinks" checked />
            <span class="toggle-slider"></span>
          </label>
        </div>
        <!-- TODO: Add more section toggles as sections are built -->
      </div>

      <!-- ── Font / Background (placeholders) ─────────── -->
      <div class="settings-section">
        <div class="settings-section-title">Customization</div>
        <p style="font-size:var(--fs-xs); color:var(--color-text-muted); line-height:1.6;">
          Background images and font selection coming soon. Drop your background image into
          <code>assets/backgrounds/{mode}/{light|dark}/bg.jpg</code>.
        </p>
      </div>
    `;
  }

  function _bindPanelEvents() {
    // Close button
    document.getElementById('settings-close-btn')?.addEventListener('click', close);

    // Mode options
    document.querySelectorAll('.theme-option[data-mode]').forEach((el) => {
      el.addEventListener('click', () => {
        ThemeManager.setMode(el.dataset.mode);
        // Re-render panel to sync selected state
        document.getElementById('settings-panel').innerHTML = _buildHTML();
        _bindPanelEvents();
      });
    });

    // Dark toggle
    document.getElementById('sp-dark-toggle')?.addEventListener('change', (e) => {
      ThemeManager.toggleDark();
    });
  }

  function open() {
    _isOpen = true;
    const panel = document.getElementById('settings-panel');
    panel.innerHTML = _buildHTML();
    panel.classList.remove('hidden');
    _bindPanelEvents();
  }

  function close() {
    _isOpen = false;
    const panel = document.getElementById('settings-panel');
    panel.classList.add('hidden');
  }

  function toggle() {
    _isOpen ? close() : open();
  }

  function init() {
    const btn = document.getElementById('btn-settings');
    if (btn) btn.addEventListener('click', toggle);
  }

  return { init, open, close, toggle };
})();
