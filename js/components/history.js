/**
 * history.js — Left panel: recent tabs & search history
 * Uses chrome.history API when available, falls back to localStorage cache.
 */

const HistoryComponent = (() => {
  const CACHE_KEY = 'history_search_cache';

  async function _getHistory() {
    // Try Chrome extension history API first
    if (typeof chrome !== 'undefined' && chrome.history) {
      return new Promise((resolve) => {
        chrome.history.search({ text: '', maxResults: 50, startTime: 0 }, (results) => {
          const seen = new Set();
          const unique = [];
          for (const r of results) {
            try {
              const host = new URL(r.url).hostname;
              if (seen.has(host)) continue;
              seen.add(host);
              unique.push({ title: r.title || r.url, url: r.url, visitTime: r.lastVisitTime });
              if (unique.length >= 10) break;
            } catch { /* skip malformed URLs */ }
          }
          resolve(unique);
        });
      });
    }

    // Fallback: stored cache
    const data = await Storage.get([CACHE_KEY]);
    return data[CACHE_KEY] ?? [];
  }

  function _favicon(url) {
    try {
      const host = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${host}&sz=32`;
    } catch {
      return null;
    }
  }

  function _timeAgo(ms) {
    if (!ms) return '';
    const diff = Date.now() - ms;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  async function render(container) {
    const items = await _getHistory();

    container.innerHTML = `
      <div class="history-panel">
        <div class="history-header">
          <span class="history-title">Recent & History</span>
        </div>

        ${items.length === 0 ? `
          <div class="history-empty">
            <span class="history-empty-icon">🕑</span>
            <span>No recent tabs yet.<br/>Start browsing to see history here.</span>
          </div>
        ` : `
          <div class="history-list">
            ${items.map(item => {
              const favUrl = _favicon(item.url);
              const ago = _timeAgo(item.visitTime);
              return `
                <a class="history-item" href="${item.url}" title="${item.url}">
                  <div class="history-item-favicon">
                    ${favUrl
                      ? `<img src="${favUrl}" alt="" onerror="this.style.display='none'" />`
                      : '🔗'
                    }
                  </div>
                  <div class="history-item-text">
                    <span class="history-item-title">${item.title || 'Untitled'}</span>
                    <span class="history-item-url">${(item.url || '').replace(/^https?:\/\//, '')}</span>
                  </div>
                  ${ago ? `<span class="history-item-time">${ago}</span>` : ''}
                </a>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;
  }

  return { render };
})();
