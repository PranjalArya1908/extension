/**
 * popup.js — Syncs popup controls with ThemeManager
 * Reads/writes to chrome.storage.local directly
 * (ThemeManager cannot manipulate the newtab page from popup context)
 */

const STORAGE_KEY_MODE = 'theme_mode';
const STORAGE_KEY_DARK = 'theme_dark';

async function initPopup() {
  const data = await Storage.get([STORAGE_KEY_MODE, STORAGE_KEY_DARK]);
  const mode   = data[STORAGE_KEY_MODE] ?? 'minimalistic';
  const isDark = data[STORAGE_KEY_DARK] ?? true;

  // Sync mode buttons
  document.querySelectorAll('#popup-mode-toggle .mode-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
    btn.addEventListener('click', async () => {
      await Storage.set({ [STORAGE_KEY_MODE]: btn.dataset.mode });
      document.querySelectorAll('#popup-mode-toggle .mode-btn').forEach((b) =>
        b.classList.toggle('active', b === btn)
      );
    });
  });

  // Sync dark toggle
  const darkToggle = document.getElementById('popup-dark-toggle');
  if (darkToggle) {
    darkToggle.checked = isDark;
    darkToggle.addEventListener('change', async () => {
      await Storage.set({ [STORAGE_KEY_DARK]: darkToggle.checked });
    });
  }
}

initPopup();
