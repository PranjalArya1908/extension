/**
 * clock.js — Bold full-card clock with integrated weather system
 *
 * Left side: Time, AM/PM, Seconds, Date
 * Right side: Clean inline Weather System displaying live weather conditions,
 *            temperature, wind, humidity, and apparent feels-like temperature.
 */

const ClockComponent = (() => {
  let _intervalId = null;
  let _weatherData = null;
  let _lastFetchTime = 0;
  const FETCH_COOLDOWN = 15 * 60 * 1000; // 15 minutes cache

  function _pad(n) { return String(n).padStart(2, '0'); }

  function _parts() {
    const now  = new Date();
    const h24  = now.getHours();
    const m    = now.getMinutes();
    const s    = now.getSeconds();
    const ampm = h24 >= 12 ? 'PM' : 'AM';
    const h12  = h24 % 12 || 12;
    return { h24: _pad(h24), h12: _pad(h12), m: _pad(m), s: _pad(s), ampm };
  }

  function _dateStr() {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    }).toUpperCase();
  }

  async function _fetchWeather() {
    const now = Date.now();
    if (_weatherData && (now - _lastFetchTime < FETCH_COOLDOWN)) {
      _updateWeatherUI();
      return;
    }

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
        0: ['☀️','Clear Sky'],        1: ['🌤','Mostly Clear'],  2: ['⛅','Partly Cloudy'],
        3: ['☁️','Overcast'],        45: ['🌫','Foggy'],          51: ['🌦','Light Drizzle'],
        61: ['🌧','Light Rain'],     63: ['🌧','Rain'],           71: ['❄️','Snow'],
        80: ['🌦','Rain Showers'],   95: ['⛈','Thunderstorm'],
      };
      
      const [icon, desc] = CONDITIONS[w.weathercode] ?? ['🌡','Weather'];
      _weatherData = {
        icon,
        desc,
        temp: Math.round(w.temperature),
        wind: Math.round(w.windspeed),
        humidity: json.hourly?.relativehumidity_2m?.[0] ?? '—',
        feelsLike: Math.round(json.hourly?.apparent_temperature?.[0] ?? w.temperature - 2)
      };
      _lastFetchTime = now;
      _updateWeatherUI();
    } catch (e) {
      console.warn("Clock weather fetch failed:", e);
      _showWeatherError();
    }
  }

  function _updateWeatherUI() {
    const container = document.getElementById('clock-weather-container');
    if (!container || !_weatherData) return;

    container.innerHTML = `
      <div class="clock-weather-main">
        <div class="clock-weather-emoji">${_weatherData.icon}</div>
        <div class="clock-weather-temp">${_weatherData.temp}°C</div>
      </div>
      <div class="clock-weather-desc">${_weatherData.desc}</div>
      
      <div class="clock-weather-details">
        <div class="clock-weather-stat">
          <span class="weather-stat-label">💨 Wind</span>
          <span class="weather-stat-val">${_weatherData.wind} km/h</span>
        </div>
        <div class="clock-weather-stat">
          <span class="weather-stat-label">💧 Humidity</span>
          <span class="weather-stat-val">${_weatherData.humidity}%</span>
        </div>
        <div class="clock-weather-stat">
          <span class="weather-stat-label">🌡 Feels Like</span>
          <span class="weather-stat-val">${_weatherData.feelsLike}°C</span>
        </div>
      </div>
    `;
  }

  function _showWeatherError() {
    const container = document.getElementById('clock-weather-container');
    if (!container) return;

    container.innerHTML = `
      <div class="clock-weather-error">
        <span style="font-size:1.6rem;">📍</span>
        <span class="weather-error-text">Weather unavailable.<br>Enable location permissions.</span>
        <button class="weather-retry-btn" id="weather-retry-btn">Retry</button>
      </div>
    `;

    const retry = document.getElementById('weather-retry-btn');
    if (retry) {
      retry.addEventListener('click', () => {
        container.innerHTML = `
          <div class="clock-weather-loading">
            <span class="weather-loading-icon">🌍</span>
            <span class="weather-loading-text">Loading weather...</span>
          </div>
        `;
        _fetchWeather();
      });
    }
  }

  function render(container, opts = {}) {
    const { use24h = false } = opts;

    container.innerHTML = `
      <div class="section-clock">
        <div class="clock-content-grid">
          
          <!-- LEFT COLUMN: Time details -->
          <div class="clock-time-side">
            <div class="clock-top-row">
              <span class="clock-label">Time Clock</span>
              <span class="clock-ampm" id="clock-ampm"></span>
            </div>
            
            <div class="clock-main-time">
              <span class="clock-hhmm" id="clock-hhmm"></span>
            </div>
            
            <div>
              <div class="clock-seconds-block">
                <span class="clock-sec-label">sec</span>
                <span class="clock-sec-value" id="clock-sec"></span>
              </div>
              <div class="clock-date" id="clock-date"></div>
            </div>
          </div>
          
          <!-- RIGHT COLUMN: Weather system -->
          <div class="clock-weather-side" id="clock-weather-container">
            <div class="clock-weather-loading">
              <span class="weather-loading-icon">🌍</span>
              <span class="weather-loading-text">Loading weather...</span>
            </div>
          </div>
          
        </div>
      </div>
    `;

    function tick() {
      const t = _parts();
      const hhmm = document.getElementById('clock-hhmm');
      const ampm = document.getElementById('clock-ampm');
      const sec  = document.getElementById('clock-sec');
      const date = document.getElementById('clock-date');

      const h = use24h ? t.h24 : t.h12;

      if (hhmm) hhmm.innerHTML = `${h}<span class="clock-main-sep">:</span>${t.m}`;
      if (ampm) ampm.textContent = t.ampm;
      if (sec)  sec.textContent  = t.s;
      if (date) date.textContent = _dateStr();
    }

    _fetchWeather();

    tick();
    if (_intervalId) clearInterval(_intervalId);
    _intervalId = setInterval(tick, 1000);
  }

  function destroy() {
    if (_intervalId) { clearInterval(_intervalId); _intervalId = null; }
  }

  return { render, destroy };
})();
