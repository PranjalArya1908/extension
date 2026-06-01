/**
 * search.js — Search bar with multi-engine support + SVG icon
 *
 * Supports multiple independent instances (minimalistic + work mode)
 * by scoping all DOM queries to the render container.
 */

const SearchComponent = (() => {
  const ENGINES = [
    { name: 'Google',     url: 'https://www.google.com/search?q=',   label: 'Google' },
    { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=',         label: 'DuckDuckGo' },
    { name: 'Bing',       url: 'https://www.bing.com/search?q=',     label: 'Bing' },
    { name: 'Brave',      url: 'https://search.brave.com/search?q=', label: 'Brave' },
  ];

  const STORAGE_KEY = 'search_engine_index';
  let _idx = 0;

  /** Track all rendered containers so we can sync engine pill across instances */
  const _instances = [];

  const SEARCH_ICON_SVG = `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="11" cy="11" r="7"/>
      <line x1="16.5" y1="16.5" x2="22" y2="22"/>
    </svg>
  `;

  async function _loadEngine() {
    const data = await Storage.get([STORAGE_KEY]);
    _idx = Number(data[STORAGE_KEY] ?? 0);
    if (_idx >= ENGINES.length) _idx = 0;
  }

  /** Update the engine pill in ALL rendered instances */
  function _syncAllPills() {
    _instances.forEach((container) => {
      const pill = container.querySelector('.search-engine-pill');
      const toggle = container.querySelector('.search-engine-toggle');
      if (pill) pill.textContent = ENGINES[_idx].label;
      if (toggle) toggle.setAttribute('data-engine', ENGINES[_idx].name.toLowerCase());
    });
  }

  function _cycleEngine() {
    _idx = (_idx + 1) % ENGINES.length;
    Storage.set({ [STORAGE_KEY]: _idx });
    _syncAllPills();
  }

  function _doSearch(query) {
    if (!query.trim()) return;
    // If looks like a URL, navigate directly
    if (/^https?:\/\//i.test(query.trim()) || /^[\w-]+\.[\w]{2,}(\/|$)/.test(query.trim())) {
      const url = /^https?:\/\//i.test(query.trim()) ? query.trim() : 'https://' + query.trim();
      window.location.href = url;
    } else {
      window.location.href = ENGINES[_idx].url + encodeURIComponent(query.trim());
    }
  }

  async function render(container) {
    await _loadEngine();

    // Register this container for cross-instance syncing
    if (!_instances.includes(container)) {
      _instances.push(container);
    }

    container.innerHTML = `
      <div class="section-search">
        <div class="search-bar">
          <span class="search-icon">${SEARCH_ICON_SVG}</span>
          <input
            type="text"
            class="search-input"
            placeholder="Search or enter URL..."
            autocomplete="off"
            spellcheck="false"
          />
          <span class="search-engine-toggle" data-engine="${ENGINES[_idx].name.toLowerCase()}" title="Click to switch search engine">
            <span class="search-engine-pill">${ENGINES[_idx].label}</span>
          </span>
        </div>
        <div class="search-hint">
          Press <kbd>Enter</kbd> to search · Click engine to switch
        </div>
      </div>
    `;

    // Scope queries to THIS container — no more global getElementById
    const input  = container.querySelector('.search-input');
    const toggle = container.querySelector('.search-engine-toggle');

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') _doSearch(input.value);
    });

    toggle.addEventListener('click', _cycleEngine);

    // Auto-focus (only if newtab context)
    input.focus();
  }

  return { render };
})();
