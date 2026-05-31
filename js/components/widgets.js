/**
 * widgets.js — Center panel: widget tab controller
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │ IFRAME REALITY CHECK                                        │
 * │  YouTube Music / ChatGPT block ALL iframes (X-Frame-Options)│
 * │  ✅ youtube-nocookie.com/embed/{videoId} — works            │
 * │  ❌ music.youtube.com — blocked                             │
 * │  ❌ chatgpt.com — blocked                                   │
 * │  Solution:                                                  │
 * │  • Music → embed individual YT videos by ID/URL             │
 * │  • AI    → local Gemini-powered chat (Google AI free tier)  │
 * └─────────────────────────────────────────────────────────────┘
 */

const WidgetsController = (() => {
  const STORAGE_KEY    = 'active_widget';
  const SCRIBBLE_KEY   = 'scribble_content';
  const CHAT_KEY       = 'ai_chat_history';
  const GEMINI_KEY_SK  = 'gemini_api_key';
  const CANVAS_KEY     = 'scribble_canvas_data';
  const SCRIBBLE_MODE  = 'scribble_active_mode';

  // Global persistent HTML5 stream audio
  let _audioInstance = null;
  let _audioPlaying = false;
  let _activeStation = 'lofi';
  let _volume = 0.5;

  const STATIONS = {
    lofi: {
      name: 'Groove Salad',
      artist: 'SomaFM · Ambient/Electronica',
      url: 'https://ice2.somafm.com/groovesalad-128-mp3'
    },
    classic: {
      name: 'Lush',
      artist: 'SomaFM · Sensuous Chill-Out',
      url: 'https://ice2.somafm.com/lush-128-mp3'
    },
    synth: {
      name: 'Deep Space One',
      artist: 'SomaFM · Ambient / Space',
      url: 'https://ice2.somafm.com/deepspaceone-128-mp3'
    }
  };

  // ice6 mirror used as fallback if ice2 fails
  const STATION_MIRRORS = {
    lofi:    'https://ice6.somafm.com/groovesalad-128-mp3',
    classic: 'https://ice6.somafm.com/lush-128-mp3',
    synth:   'https://ice6.somafm.com/deepspaceone-128-mp3',
  };

  // Fallback Gemini models & endpoints to try if one fails
  const GEMINI_ENDPOINTS = [
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent',
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent',
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'
  ];

  let _active = 'music';

  async function _loadState() {
    const data = await Storage.get([STORAGE_KEY]);
    _active = data[STORAGE_KEY] ?? 'music';
  }

  async function _saveState() {
    await Storage.set({ [STORAGE_KEY]: _active });
  }

  // ═══════════════════════════════════════════════════════════
  //  Mini-player — persistent bar shown on non-music tabs
  // ═══════════════════════════════════════════════════════════
  function _updateMiniPlayer() {
    const mmp     = document.getElementById('music-mini-player');
    if (!mmp) return;

    const onMusicTab = (_active === 'music');

    // Hide when on music tab (full controls are visible)
    if (onMusicTab) {
      mmp.style.display = 'none';
      return;
    }

    // Show only if audio instance exists (user has interacted with music tab)
    if (!_audioInstance) {
      mmp.style.display = 'none';
      return;
    }

    mmp.style.display = 'flex';

    // Sync station info
    const station = STATIONS[_activeStation];
    const nameEl   = document.getElementById('mmp-name');
    const artistEl = document.getElementById('mmp-artist');
    const toggleEl = document.getElementById('mmp-toggle');
    if (nameEl)   nameEl.textContent   = station.name;
    if (artistEl) artistEl.textContent = station.artist;
    if (toggleEl) toggleEl.textContent = _audioPlaying ? '⏸' : '▶';

    // Animate visualizer only when playing
    mmp.classList.toggle('paused', !_audioPlaying);

    // Wire up buttons (remove old listeners by replacing with clones)
    if (toggleEl) {
      const fresh = toggleEl.cloneNode(true);
      toggleEl.replaceWith(fresh);
      fresh.addEventListener('click', () => {
        _globalTogglePlayback();
        _updateMiniPlayer();
      });
    }
    const gotoEl = document.getElementById('mmp-goto');
    if (gotoEl) {
      const fresh = gotoEl.cloneNode(true);
      gotoEl.replaceWith(fresh);
      fresh.addEventListener('click', () => {
        // Switch to music tab programmatically
        const musicBtn = document.querySelector('.widget-tab[data-widget="music"]');
        if (musicBtn) musicBtn.click();
      });
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  Shared playback toggle (used by full player + mini player)
  // ═══════════════════════════════════════════════════════════
  function _globalTogglePlayback() {
    if (!_audioInstance) return;
    if (_audioPlaying) {
      _audioInstance.pause();
      // _audioPlaying updated via 'pause' event
    } else {
      // Set src + load() each time — required for streams (they don't buffer ahead)
      _audioInstance.src = STATIONS[_activeStation].url;
      _audioInstance.load();
      _audioInstance.play().catch(err => {
        console.warn('[Music] play() rejected:', err);
        _showStreamError('Browser blocked autoplay. Click play to start.');
      });
      // _audioPlaying updated via 'playing' event
    }
  }

  // Show an error message inside the music player UI
  function _showStreamError(msg = 'Stream unavailable. Try another station.') {
    const errEl = document.getElementById('music-stream-error');
    if (errEl) { errEl.textContent = '⚠️ ' + msg; errEl.style.display = 'block'; }
  }

  function _clearStreamError() {
    const errEl = document.getElementById('music-stream-error');
    if (errEl) errEl.style.display = 'none';
  }

  // ═══════════════════════════════════════════════════════════
  //  1. MUSIC WIDGET — YouTube embed (works in extension)
  //     User pastes any YouTube URL or video ID → embed player
  // ═══════════════════════════════════════════════════════════
  function _renderMusic(display) {
    display.innerHTML = `
      <div class="widget-view widget-music">
        <!-- Station Quick row switcher -->
        <div class="music-quick-row" id="music-quick-row">
          <button class="music-quick-btn ${_activeStation === 'lofi'    ? 'active' : ''}" data-station="lofi">🎧 Groove Salad</button>
          <button class="music-quick-btn ${_activeStation === 'classic' ? 'active' : ''}" data-station="classic">🌸 Lush</button>
          <button class="music-quick-btn ${_activeStation === 'synth'   ? 'active' : ''}" data-station="synth">🌌 Deep Space</button>
        </div>

        <!-- Stream error message -->
        <div id="music-stream-error" style="display:none; font-size:0.72rem; color:#ef4444; text-align:center; padding:4px 12px; background:rgba(239,68,68,0.07); border-bottom:1px solid rgba(239,68,68,0.15);"></div>
        <div class="music-player-panel">
          <!-- Spinning vinyl record visual -->
          <div class="music-vinyl-wrapper">
            <div class="music-vinyl-needle ${_audioPlaying ? 'active' : ''}" id="music-vinyl-needle"></div>
            <div class="music-vinyl ${_audioPlaying ? 'spinning' : ''}" id="music-vinyl">
              <div class="music-vinyl-center">
                <span style="font-size:0.8rem;">🎵</span>
              </div>
            </div>
          </div>

          <!-- Title / Artist Info -->
          <div class="music-info-panel">
            <div class="music-stream-name" id="music-stream-name">Lofi Chill Beats</div>
            <div class="music-stream-artist" id="music-stream-artist">Chillsky Radio</div>
            
            <!-- Animated bouncing wave spectrum -->
            <div class="music-visualizer-bars ${_audioPlaying ? 'active' : ''}" id="music-visualizer-bars">
              <div class="music-vis-bar"></div>
              <div class="music-vis-bar"></div>
              <div class="music-vis-bar"></div>
              <div class="music-vis-bar"></div>
              <div class="music-vis-bar"></div>
              <div class="music-vis-bar"></div>
              <div class="music-vis-bar"></div>
              <div class="music-vis-bar"></div>
            </div>
          </div>

          <!-- Playback volume controls -->
          <div class="music-playback-controls">
            <button class="music-play-toggle" id="music-play-toggle">
              ${_audioPlaying ? '⏸' : '▶'}
            </button>
            
            <div class="music-volume-row">
              <span class="music-volume-icon">🔊</span>
              <input 
                type="range" 
                class="music-volume-slider" 
                id="music-volume-slider" 
                min="0" 
                max="1" 
                step="0.05" 
                value="${_volume}"
              />
            </div>
          </div>
        </div>
      </div>
    `;

    const quickRow = document.getElementById('music-quick-row');
    const playToggle = document.getElementById('music-play-toggle');
    const needle = document.getElementById('music-vinyl-needle');
    const vinyl = document.getElementById('music-vinyl');
    const visBars = document.getElementById('music-visualizer-bars');
    const streamName = document.getElementById('music-stream-name');
    const streamArtist = document.getElementById('music-stream-artist');
    const volumeSlider = document.getElementById('music-volume-slider');

    function updateTrackDetails() {
      const active = STATIONS[_activeStation];
      if (streamName) streamName.textContent = active.name;
      if (streamArtist) streamArtist.textContent = active.artist;
    }

    // Load initial names
    updateTrackDetails();

    // Init audio once — reuse across tab switches
    if (!_audioInstance) {
      _audioInstance = new Audio();
      // Do NOT set crossOrigin — most streams don't send CORS headers
      // and setting crossOrigin causes silent CORS failures
      _audioInstance.volume = _volume;
      _audioInstance.preload = 'none';

      // Detect actual playback state from browser events
      _audioInstance.addEventListener('playing', () => {
        _audioPlaying = true;
        _syncFullPlayerUI();
        _updateMiniPlayer();
        _clearStreamError();
      });
      _audioInstance.addEventListener('pause', () => {
        _audioPlaying = false;
        _syncFullPlayerUI();
        _updateMiniPlayer();
      });

      // Error / stall handling
      let _retryCount = 0;
      const _maxRetries = 2;

      function _tryMirror() {
        const mirror = STATION_MIRRORS[_activeStation];
        if (_retryCount < _maxRetries && mirror && _audioInstance.src !== mirror) {
          _retryCount++;
          console.warn(`[Music] stream error, trying mirror (attempt ${_retryCount})`);
          _audioInstance.src = mirror;
          _audioInstance.load();
          _audioInstance.play().catch(() => _showStreamError());
        } else {
          _retryCount = 0;
          _audioPlaying = false;
          _syncFullPlayerUI();
          _updateMiniPlayer();
          _showStreamError();
        }
      }

      _audioInstance.addEventListener('error', _tryMirror);
      _audioInstance.addEventListener('stalled', () => {
        setTimeout(_tryMirror, 5000); // give it 5 s before trying mirror
      });
    }

    function _syncFullPlayerUI() {
      if (playToggle) playToggle.textContent = _audioPlaying ? '⏸' : '▶';
      if (needle)    needle.classList.toggle('active', _audioPlaying);
      if (vinyl)     vinyl.classList.toggle('spinning', _audioPlaying);
      if (visBars)   visBars.classList.toggle('active', _audioPlaying);
    }

    function togglePlayback() {
      _globalTogglePlayback();
      _syncFullPlayerUI();
      _updateMiniPlayer();
    }

    playToggle?.addEventListener('click', togglePlayback);

    volumeSlider?.addEventListener('input', (e) => {
      _volume = parseFloat(e.target.value);
      if (_audioInstance) {
        _audioInstance.volume = _volume;
      }
    });

    quickRow?.addEventListener('click', (e) => {
      const btn = e.target.closest('.music-quick-btn');
      if (!btn) return;

      quickRow.querySelectorAll('.music-quick-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const targetStation = btn.dataset.station;
      if (targetStation === _activeStation) {
        togglePlayback();
      } else {
        _activeStation = targetStation;
        updateTrackDetails();
        _clearStreamError();

        // Must call load() to reset the stream before play()
        _audioInstance.src = STATIONS[_activeStation].url;
        _audioInstance.load();
        _audioInstance.play().catch(err => console.warn('[Music] station switch play failed:', err));
        // _audioPlaying updated via 'playing' event listener

        _syncFullPlayerUI();
        _updateMiniPlayer();
      }
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  2. AI WIDGET — Local chat powered by Google Gemini API
  //     ChatGPT blocks ALL iframes — this is the real solution.
  //     Free Gemini API key from: aistudio.google.com/app/apikey
  // ═══════════════════════════════════════════════════════════
  async function _renderAI(display) {
    const stored  = await Storage.get([CHAT_KEY, GEMINI_KEY_SK]);
    let history   = stored[CHAT_KEY] ?? [];
    let apiKey    = stored[GEMINI_KEY_SK] ?? '';

    function _esc(s) {
      return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
    }

    function _rebuildMessages() {
      const el = document.getElementById('ai-messages');
      if (!el) return;
      if (history.length === 0) {
        el.innerHTML = `
          <div class="ai-empty">
            <span class="ai-empty-icon">✨</span>
            <span>Ask me anything. I'm powered by Google Gemini.</span>
            ${!apiKey ? `<div class="ai-key-hint">Enter your free Gemini API key above to enable AI responses.<br><a href="https://aistudio.google.com/app/apikey" target="_blank">Get a free key →</a></div>` : ''}
          </div>
        `;
      } else {
        el.innerHTML = history.map(msg => `
          <div class="ai-bubble ${msg.role === 'user' ? 'ai-bubble-user' : 'ai-bubble-bot'}">
            <div class="ai-bubble-inner">
              <span class="ai-bubble-role">${msg.role === 'user' ? 'You' : '✨ Gemini'}</span>
              <p class="ai-bubble-text">${_esc(msg.content)}</p>
            </div>
          </div>
        `).join('');
        el.scrollTop = el.scrollHeight;
      }
    }

    display.innerHTML = `
      <div class="widget-view widget-ai" style="height:100%;">
        <div class="ai-panel-header">
          <div class="ai-header-logo">✨</div>
          <div style="flex:1;">
            <div class="ai-title">Gemini AI Chat</div>
            <div class="ai-subtitle">Powered by Google Gemini · Free tier</div>
          </div>
          <button class="ai-clear-btn" id="ai-clear-btn">✕ Clear</button>
        </div>

        <!-- API key input (collapsible) -->
        <div class="ai-key-row" id="ai-key-row" style="${apiKey ? 'display:none' : ''}">
          <input
            class="ai-key-input"
            id="ai-key-input"
            type="password"
            placeholder="Paste your free Gemini API key (aistudio.google.com)…"
            value="${_esc(apiKey)}"
            autocomplete="off"
          />
          <button class="ai-key-save-btn" id="ai-key-save">Save</button>
        </div>
        ${apiKey ? `<div class="ai-key-saved" id="ai-key-saved">✅ Gemini key saved · <button class="ai-key-reset" id="ai-key-reset">Change</button></div>` : ''}

        <div class="ai-messages" id="ai-messages"></div>

        <div class="ai-input-row">
          <textarea
            class="ai-input-textarea"
            id="ai-input"
            placeholder="Ask Gemini anything… (Enter to send, Shift+Enter for newline)"
            rows="2"
            spellcheck="false"
          ></textarea>
          <div class="ai-input-actions">
            <button class="ai-send-btn" id="ai-send-btn">Send</button>
            <span class="ai-status" id="ai-status"></span>
          </div>
        </div>
      </div>
    `;

    _rebuildMessages();

    const inputEl   = document.getElementById('ai-input');
    const sendBtn   = document.getElementById('ai-send-btn');
    const clearBtn  = document.getElementById('ai-clear-btn');
    const statusEl  = document.getElementById('ai-status');
    const keyInput  = document.getElementById('ai-key-input');
    const keySave   = document.getElementById('ai-key-save');
    const keyReset  = document.getElementById('ai-key-reset');
    const keyRow    = document.getElementById('ai-key-row');

    // Save API key
    if (keySave) {
      keySave.addEventListener('click', async () => {
        const k = keyInput?.value.trim();
        if (!k) return;
        apiKey = k;
        await Storage.set({ [GEMINI_KEY_SK]: k });
        // Re-render to show saved state
        await _renderAI(display);
      });
    }

    if (keyReset) {
      keyReset.addEventListener('click', async () => {
        apiKey = '';
        await Storage.set({ [GEMINI_KEY_SK]: '' });
        await _renderAI(display);
      });
    }

    // Clear chat
    clearBtn?.addEventListener('click', async () => {
      history = [];
      await Storage.set({ [CHAT_KEY]: [] });
      _rebuildMessages();
    });

    async function sendMessage() {
      const text = inputEl?.value.trim();
      if (!text) return;

      if (!apiKey) {
        if (keyRow) keyRow.style.display = '';
        if (statusEl) statusEl.textContent = '⚠ Add your Gemini API key first';
        return;
      }

      // Add user message
      history.push({ role: 'user', content: text });
      inputEl.value = '';
      inputEl.disabled = true;
      sendBtn.disabled = true;
      if (statusEl) statusEl.textContent = '⏳ Thinking…';
      _rebuildMessages();

      try {
        // Build Gemini API request
        const body = {
          contents: history.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }],
          })),
          generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
        };

        let resp = null;
        let lastError = null;

        // Try each endpoint sequentially until one succeeds
        for (const endpoint of GEMINI_ENDPOINTS) {
          try {
            resp = await fetch(`${endpoint}?key=${encodeURIComponent(apiKey)}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
            });

            if (resp.ok) {
              lastError = null;
              break;
            } else {
              const err = await resp.json().catch(() => ({}));
              lastError = new Error(err?.error?.message ?? `HTTP ${resp.status}`);
            }
          } catch (e) {
            lastError = e;
          }
        }

        if (lastError) {
          throw lastError;
        }

        const data = await resp.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '(No response)';
        history.push({ role: 'model', content: reply });
        await Storage.set({ [CHAT_KEY]: history });
        if (statusEl) statusEl.textContent = '';
      } catch (err) {
        history.push({ role: 'model', content: `❌ Error: ${err.message}` });
        if (statusEl) statusEl.textContent = '';
      } finally {
        // Always re-enable input regardless of success or failure
        const currentInput = document.getElementById('ai-input');
        const currentSend  = document.getElementById('ai-send-btn');
        if (currentInput) { currentInput.disabled = false; currentInput.focus(); }
        if (currentSend)  currentSend.disabled = false;
      }

      _rebuildMessages();
    }

    sendBtn?.addEventListener('click', sendMessage);
    inputEl?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  3. WEATHER WIDGET — 100% inline via Open-Meteo API
  // ═══════════════════════════════════════════════════════════
  async function _renderWeather(display) {
    display.innerHTML = `
      <div class="widget-view widget-weather">
        <div class="weather-loading">
          <span style="font-size:2.5rem">🌍</span><span>Fetching weather…</span>
        </div>
      </div>
    `;
    try {
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 })
      );
      const { latitude: lat, longitude: lon } = pos.coords;
      const resp = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m,apparent_temperature,windspeed_10m&timezone=auto`
      );
      const json = await resp.json();
      const w = json.current_weather;
      const CONDITIONS = {
        0: ['☀️','Clear sky'],  1: ['🌤','Mainly clear'],  2: ['⛅','Partly cloudy'],
        3: ['☁️','Overcast'],   45: ['🌫','Foggy'],         51: ['🌦','Light drizzle'],
        61: ['🌧','Light rain'],63: ['🌧','Moderate rain'],71: ['❄️','Light snow'],
        80: ['🌦','Rain showers'],95: ['⛈','Thunderstorm'],
      };
      const [icon, desc] = CONDITIONS[w.weathercode] ?? ['🌡','Unknown'];
      const tempC    = Math.round(w.temperature);
      const windSpd  = Math.round(w.windspeed);
      const humidity = json.hourly?.relativehumidity_2m?.[0] ?? '—';
      const feelsLike= Math.round(json.hourly?.apparent_temperature?.[0] ?? tempC - 2);
      display.innerHTML = `
        <div class="widget-view widget-weather">
          <div class="weather-main">
            <div class="weather-icon">${icon}</div>
            <div class="weather-temp">${tempC}°C</div>
            <div class="weather-desc">${desc}</div>
          </div>
          <div class="weather-details">
            <div class="weather-stat"><span class="weather-stat-label">Wind</span><span class="weather-stat-value">${windSpd} km/h</span></div>
            <div class="weather-stat"><span class="weather-stat-label">Humidity</span><span class="weather-stat-value">${humidity}%</span></div>
            <div class="weather-stat"><span class="weather-stat-label">Feels Like</span><span class="weather-stat-value">${feelsLike}°C</span></div>
          </div>
          <div style="font-size:0.62rem;color:var(--color-text-subtle);margin-top:6px;">📍 ${lat.toFixed(2)}, ${lon.toFixed(2)} · Open-Meteo</div>
        </div>
      `;
    } catch {
      display.innerHTML = `
        <div class="widget-view widget-weather">
          <div class="weather-error"><span class="weather-error-icon">📍</span><span>Location access denied.<br>Allow location in browser settings.</span></div>
        </div>
      `;
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  4. SCRIBBLE WIDGET — text notes + HTML5 whiteboard drawing
  // ═══════════════════════════════════════════════════════════
  async function _renderScribble(display) {
    const data = await Storage.get([SCRIBBLE_KEY, CANVAS_KEY, SCRIBBLE_MODE]);
    let savedText = data[SCRIBBLE_KEY] ?? '';
    let savedCanvas = data[CANVAS_KEY] ?? '';
    let currentMode = data[SCRIBBLE_MODE] ?? 'notes'; // 'notes' or 'sketch'

    display.innerHTML = `
      <div class="widget-view widget-scribble">
        <div class="scribble-header">
          <div class="scribble-title-row">
            <span class="scribble-title">Scribble Hub</span>
            <button class="scribble-mode-btn ${currentMode === 'notes' ? 'active' : ''}" id="scribble-mode-notes">📝 Notes</button>
            <button class="scribble-mode-btn ${currentMode === 'sketch' ? 'active' : ''}" id="scribble-mode-sketch">🎨 Sketch</button>
          </div>
          <span class="scribble-hint" id="scribble-hint">Auto-saved ✓</span>
        </div>

        <!-- 1. TEXT NOTES MODE -->
        <div id="scribble-notes-panel" style="${currentMode === 'notes' ? 'display:flex; flex-direction:column; flex:1; min-height:0;' : 'display:none;'}">
          <textarea 
            class="scribble-textarea" 
            id="scribble-area" 
            placeholder="Type your notes here... Auto-saves instantly." 
            spellcheck="false"
          >${savedText}</textarea>
          <div class="scribble-footer">
            <span class="scribble-wordcount" id="scribble-wc">0 words</span>
            <button class="scribble-clear-btn" id="scribble-clear">Clear Notes</button>
          </div>
        </div>

        <!-- 2. CANVAS SKETCH MODE -->
        <div id="scribble-sketch-panel" class="sketch-container" style="${currentMode === 'sketch' ? 'display:flex;' : 'display:none;'}">
          <div class="sketch-toolbar">
            <!-- Colors -->
            <div class="sketch-tool-group">
              <span style="font-size:0.68rem; color:var(--color-text-muted); margin-right:4px;">Color:</span>
              <div class="sketch-color-dot active" data-color="#10a37f" style="background:#10a37f;"></div>
              <div class="sketch-color-dot" data-color="#38bdf8" style="background:#38bdf8;"></div>
              <div class="sketch-color-dot" data-color="#f59e0b" style="background:#f59e0b;"></div>
              <div class="sketch-color-dot" data-color="#ef4444" style="background:#ef4444;"></div>
              <div class="sketch-color-dot" data-color="#ffffff" style="background:#ffffff; border:1px solid #777;"></div>
              <div class="sketch-color-dot" data-color="eraser" style="background:#444; border:1px solid #777; display:flex; align-items:center; justify-content:center; font-size:0.6rem; color:#fff;">🧹</div>
            </div>

            <!-- Sizes -->
            <div class="sketch-tool-group">
              <button class="sketch-size-btn active" data-size="3">Thin</button>
              <button class="sketch-size-btn" data-size="6">Medium</button>
              <button class="sketch-size-btn" data-size="12">Thick</button>
            </div>

            <!-- Clear -->
            <button class="scribble-clear-btn" id="sketch-clear-btn" style="color:#ef4444;">Clear Canvas</button>
          </div>
          <canvas class="sketch-canvas" id="sketch-canvas"></canvas>
        </div>
      </div>
    `;

    // Elements
    const btnNotes = document.getElementById('scribble-mode-notes');
    const btnSketch = document.getElementById('scribble-mode-sketch');
    const panelNotes = document.getElementById('scribble-notes-panel');
    const panelSketch = document.getElementById('scribble-sketch-panel');
    const hint = document.getElementById('scribble-hint');

    // Notes elements
    const notesArea = document.getElementById('scribble-area');
    const wordCount = document.getElementById('scribble-wc');
    const clearNotes = document.getElementById('scribble-clear');

    // Sketch elements
    const canvas = document.getElementById('sketch-canvas');
    const clearSketch = document.getElementById('sketch-clear-btn');

    // Mode switching
    btnNotes?.addEventListener('click', async () => {
      currentMode = 'notes';
      btnNotes.classList.add('active');
      btnSketch.classList.remove('active');
      panelNotes.style.display = 'flex';
      panelSketch.style.display = 'none';
      await Storage.set({ [SCRIBBLE_MODE]: 'notes' });
    });

    btnSketch?.addEventListener('click', async () => {
      currentMode = 'sketch';
      btnSketch.classList.add('active');
      btnNotes.classList.remove('active');
      panelNotes.style.display = 'none';
      panelSketch.style.display = 'flex';
      await Storage.set({ [SCRIBBLE_MODE]: 'sketch' });
      // Initialize canvas dimensions and restore drawing
      initCanvas();
    });

    // ── Text Notepad Logic ──
    let notesTimer;
    const updateWC = () => {
      if (!notesArea) return;
      const w = notesArea.value.trim().split(/\s+/).filter(Boolean).length;
      if (wordCount) wordCount.textContent = `${w} word${w !== 1 ? 's' : ''}`;
    };

    updateWC();

    notesArea?.addEventListener('input', () => {
      updateWC();
      if (hint) hint.textContent = 'Saving…';
      clearTimeout(notesTimer);
      notesTimer = setTimeout(async () => {
        await Storage.set({ [SCRIBBLE_KEY]: notesArea.value });
        if (hint) hint.textContent = 'Auto-saved ✓';
      }, 700);
    });

    clearNotes?.addEventListener('click', async () => {
      if (!notesArea.value.trim() || !confirm('Delete all text notes?')) return;
      notesArea.value = '';
      updateWC();
      await Storage.set({ [SCRIBBLE_KEY]: '' });
      if (hint) hint.textContent = 'Notes Cleared';
    });

    // ── Canvas whiteboard Sketchpad Logic ──
    let ctx = null;
    let drawing = false;
    let currentColor = '#10a37f';
    let currentBrushSize = 3;
    let lastX = 0;
    let lastY = 0;

    function initCanvas() {
      if (!canvas) return;
      ctx = canvas.getContext('2d');
      
      // Handle high DPI displays
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      // Draw loaded drawing
      if (savedCanvas) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
        };
        img.src = savedCanvas;
      }

      // Drawing Event Listeners
      canvas.addEventListener('mousedown', startDrawing);
      canvas.addEventListener('mousemove', draw);
      canvas.addEventListener('mouseup', stopDrawing);
      canvas.addEventListener('mouseout', stopDrawing);

      // Touch events (for tablet/stylus users)
      canvas.addEventListener('touchstart', (e) => {
        const t = e.touches[0];
        const r = canvas.getBoundingClientRect();
        startDrawing({ clientX: t.clientX, clientY: t.clientY });
        e.preventDefault();
      });
      canvas.addEventListener('touchmove', (e) => {
        const t = e.touches[0];
        draw({ clientX: t.clientX, clientY: t.clientY });
        e.preventDefault();
      });
      canvas.addEventListener('touchend', stopDrawing);
    }

    function startDrawing(e) {
      drawing = true;
      const rect = canvas.getBoundingClientRect();
      lastX = e.clientX - rect.left;
      lastY = e.clientY - rect.top;
      
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
    }

    function draw(e) {
      if (!drawing) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.strokeStyle = currentColor === 'eraser' 
        ? (document.body.getAttribute('data-dark') === 'false' ? '#fbfbfe' : '#111216') 
        : currentColor;
      ctx.lineWidth = currentBrushSize;

      ctx.lineTo(x, y);
      ctx.stroke();

      lastX = x;
      lastY = y;
    }

    async function stopDrawing() {
      if (!drawing) return;
      drawing = false;
      ctx.closePath();

      // Save canvas
      if (hint) hint.textContent = 'Saving…';
      const dataUrl = canvas.toDataURL();
      savedCanvas = dataUrl;
      await Storage.set({ [CANVAS_KEY]: dataUrl });
      if (hint) hint.textContent = 'Auto-saved ✓';
    }

    // Color buttons
    const colorDots = panelSketch?.querySelectorAll('.sketch-color-dot');
    colorDots?.forEach(dot => {
      dot.addEventListener('click', (e) => {
        colorDots.forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        currentColor = dot.dataset.color;
      });
    });

    // Brush sizes
    const sizeBtns = panelSketch?.querySelectorAll('.sketch-size-btn');
    sizeBtns?.forEach(btn => {
      btn.addEventListener('click', (e) => {
        sizeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentBrushSize = parseInt(btn.dataset.size);
      });
    });

    // Clear canvas
    clearSketch?.addEventListener('click', async () => {
      if (!confirm('Clear the canvas sketchpad?')) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      savedCanvas = '';
      await Storage.set({ [CANVAS_KEY]: '' });
      if (hint) hint.textContent = 'Canvas Cleared';
    });

    // Automatically trigger canvas load if it is active right now
    if (currentMode === 'sketch') {
      setTimeout(initCanvas, 50);
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  Public API
  // ═══════════════════════════════════════════════════════════
  async function init() {
    await _loadState();
    const tabBtns = document.querySelectorAll('.widget-tab');
    const display = document.getElementById('widget-display');
    if (!display) return;

    tabBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.widget === _active));
    _showWidget(_active, display);
    _updateMiniPlayer();

    tabBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        _active = btn.dataset.widget;
        await _saveState();
        _showWidget(_active, display);
        // After rendering new widget, sync mini-player visibility
        _updateMiniPlayer();
      });
    });
  }

  function _showWidget(name, display) {
    switch (name) {
      case 'music':    _renderMusic(display);    break;
      case 'ai':       _renderAI(display);       break;
      case 'weather':  _renderWeather(display);  break;
      case 'scribble': _renderScribble(display); break;
      default:         _renderMusic(display);
    }
  }

  return { init };
})();
