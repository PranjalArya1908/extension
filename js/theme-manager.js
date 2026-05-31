/**
 * theme-manager.js — Manages the 4-variant theme system
 *
 * Themes:  minimalistic | work
 * Modes:   light | dark
 *
 * Active theme stylesheet is swapped via #theme-stylesheet <link>.
 * body[data-mode] controls which layout panel is visible.
 * State is persisted to chrome.storage.local.
 */

const ThemeManager = (() => {
  const STORAGE_KEY_MODE = 'theme_mode';   // 'minimalistic' | 'work'
  const STORAGE_KEY_DARK = 'theme_dark';   // true | false
  const STYLESHEET_ID    = 'theme-stylesheet';

  // Map [mode][isDark] → CSS file path
  const THEME_MAP = {
    minimalistic: {
      true:  'css/themes/minimalistic-dark.css',
      false: 'css/themes/minimalistic-light.css',
    },
    work: {
      true:  'css/themes/work-dark.css',
      false: 'css/themes/work-light.css',
    },
  };

  let _mode   = 'minimalistic';
  let _isDark = false;

  // ── Private helpers ──────────────────────────────────────

  function _applyTheme() {
    // Swap stylesheet
    const path = THEME_MAP[_mode]?.[String(_isDark)]
               ?? THEME_MAP['minimalistic']['false'];
    const link = document.getElementById(STYLESHEET_ID);
    if (link) link.href = path;

    // body attributes — drives CSS layout switching AND component visibility
    document.body.dataset.mode = _mode;
    document.body.dataset.dark = String(_isDark);

    // Update dark toggle icon / label
    const icon  = document.getElementById('light-dark-icon');
    const label = document.getElementById('light-dark-label');
    if (icon)  icon.textContent  = _isDark ? '🌙' : '☀️';
    if (label) label.textContent = _isDark ? 'Dark' : 'Light';

    // Update active mode-btn highlight
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === _mode);
    });

    // Show / hide sidebar toggle based on mode
    const sidebarToggle = document.getElementById('btn-sidebar-toggle');
    if (sidebarToggle) {
      sidebarToggle.style.display = _mode === 'minimalistic' ? '' : 'none';
    }
  }

  async function _persist() {
    await Storage.set({
      [STORAGE_KEY_MODE]: _mode,
      [STORAGE_KEY_DARK]: _isDark,
    });
  }

  // ── Public API ───────────────────────────────────────────

  async function init() {
    const data = await Storage.get([STORAGE_KEY_MODE, STORAGE_KEY_DARK]);
    _mode   = data[STORAGE_KEY_MODE] ?? 'minimalistic';
    _isDark = data[STORAGE_KEY_DARK] ?? false;
    _applyTheme();
    _bindControls();
  }

  function setMode(mode) {
    if (!THEME_MAP[mode]) return;
    _mode = mode;
    _applyTheme();
    _persist();
  }

  function toggleDark() {
    _isDark = !_isDark;
    _applyTheme();
    _persist();
  }

  function getState() {
    return { mode: _mode, isDark: _isDark };
  }

  function _bindControls() {
    // Mode buttons (bottom-left pill)
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => setMode(btn.dataset.mode));
    });

    // Dark mode toggle (bottom-right pill)
    const ldBtn = document.getElementById('btn-light-dark');
    if (ldBtn) ldBtn.addEventListener('click', toggleDark);
  }

  return { init, setMode, toggleDark, getState };
})();
