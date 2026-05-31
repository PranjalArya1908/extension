/**
 * quicklinks.js — Horizontal row of circles (left col, bottom)
 */

const QuickLinksComponent = (() => {
  const STORAGE_KEY = 'quicklinks';

  const DEFAULT_LINKS = [
    { label: 'Gmail',   url: 'https://mail.google.com', emoji: '📧' },
    { label: 'GitHub',  url: 'https://github.com',      emoji: '🐙' },
    { label: 'YouTube', url: 'https://youtube.com',     emoji: '▶️' },
    { label: 'Notion',  url: 'https://notion.so',       emoji: '📋' },
    { label: 'Twitter', url: 'https://x.com',           emoji: '𝕏'  },
    { label: 'Figma',   url: 'https://figma.com',       emoji: '🎨' },
  ];

  async function _loadLinks() {
    const data = await Storage.get([STORAGE_KEY]);
    return data[STORAGE_KEY] ?? DEFAULT_LINKS;
  }

  async function render(container) {
    const links = await _loadLinks();

    container.innerHTML = `
      <div class="section-quicklinks">
        ${links.slice(0, 6).map((link, i) => `
          <a
            href="${link.url}"
            class="quicklink-item"
            id="quicklink-${i}"
            title="${link.label}"
            target="_blank"
            rel="noopener noreferrer"
          >${link.emoji}</a>
        `).join('')}
        <button class="quicklink-add" id="quicklink-add" title="Add shortcut">+</button>
      </div>
    `;

    // TODO: wire up add button to a modal/settings
    document.getElementById('quicklink-add')?.addEventListener('click', () => {
      alert('Shortcut editor coming soon! Edit quicklinks via the ⚙ settings panel.');
    });
  }

  return { render };
})();
