# ✦ Custom New Tab — Chrome Extension

A beautiful, feature-packed Chrome New Tab replacement with **two distinct modes** — a zen **Minimalistic** mode for focus and a powerful **Work** mode for productivity — each with full **light & dark theme** support.

<p align="center">
  <img src="icons/icon128.png" alt="Custom New Tab Icon" width="96" />
</p>

---

## ✨ Features at a Glance

| Feature | Description |
|---------|-------------|
| 🎨 **Dual Layouts** | Switch between Minimalistic (zen) and Work (productivity) modes |
| 🌗 **Light & Dark Themes** | 4 hand-crafted theme variants with custom background support |
| 🎵 **SomaFM Music Player** | Stream ambient/chill music with vinyl animation & mini-player |
| 🤖 **Gemini AI Chat** | Built-in AI assistant powered by Google's free Gemini API |
| 🌤 **Live Weather** | Real-time weather using geolocation via Open-Meteo |
| ✏️ **Scribble Hub** | Text notepad + HTML5 canvas whiteboard with auto-save |
| 📝 **Sticky Notes** | Drag-and-drop sticky notes with a masonry board |
| ✅ **To-Do List** | Persistent task tracker to manage your day |
| 🕐 **Live Clock** | Beautiful clock display with bottom bar companion |
| 🔗 **Quick Links** | Collapsible sidebar with your most-used websites |
| 📜 **Browser History** | Smart history panel showing 10 recent unique domains |
| 🔍 **Web Search** | Integrated Google search bar in both modes |

---

## 🖥 Modes

### 🌿 Minimalistic Mode
A clean, distraction-free interface designed for focus:
- **Live clock** with elegant typography
- **Personalized greeting** — click your name to edit it inline
- **Sticky notes** — create, drag & drop onto a masonry board
- **Daily motivational quotes** that rotate automatically
- **Collapsible quick-links sidebar** for your favorite sites
- **Integrated search bar**

### 💼 Work Mode
A three-column productivity dashboard:
- **Left** — Smart browser history (10 most recent unique domains with time-ago badges)
- **Center** — Search bar + tabbed widget area (Music · AI · Weather · Scribble)
- **Right** — Persistent to-do list

---

## 🎵 Music Player

Stream curated internet radio directly in your new tab:

| Station | Genre |
|---------|-------|
| 🎧 Groove Salad | Ambient / Electronica |
| 🌸 Lush | Sensuous Chill-Out |
| 🌌 Deep Space One | Ambient / Space |

**Highlights:**
- 🎶 Background play — music continues when switching widget tabs
- 🎚 Volume control slider
- 💿 Animated spinning vinyl record & audio visualizer bars
- 📻 **Persistent mini-player** — appears on non-music tabs with play/pause and quick-jump
- 🔄 Auto-failover to mirror servers if a stream goes down

---

## 🤖 Gemini AI Chat

A local, privacy-friendly AI chat built into your new tab:
- Powered by **Google Gemini** (free tier — no billing required)
- API key stored **locally** via `chrome.storage.local` — never sent to third parties
- Multi-turn conversation with chat history persistence
- Automatic endpoint fallback across multiple Gemini model versions
- Robust error handling with auto-unlocking input

> **Get your free API key** → [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

---

## 🚀 Installation

### Method 1: Load from Source (Recommended)

1. **Clone this repository:**
   ```bash
   git clone https://github.com/PranjalArya1908/extension.git
   ```

2. **Open Chrome** and navigate to:
   ```
   chrome://extensions/
   ```

3. **Enable Developer Mode** — toggle the switch in the top-right corner.

4. **Click "Load unpacked"** in the top-left corner.

5. **Select the cloned `extension` folder** (the root folder containing `manifest.json`).

6. **Open a new tab** — enjoy your new custom workspace! 🎉

### Method 2: Download ZIP

1. Click the green **Code** button on GitHub → **Download ZIP**
2. Extract the ZIP to a folder on your computer
3. Follow steps 2–6 above, selecting the extracted folder

---

## ⚙️ Configuration

### 🔑 Gemini AI Setup
1. Go to Work Mode → click the **AI Mode** tab
2. Get your free API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
3. Paste the key in the input field and click **Save**
4. Start chatting! Your key is stored locally and never leaves your browser.

### 🖼 Custom Background Images
Drop your own backgrounds into the appropriate folder:

```
assets/backgrounds/
├── minimalistic/
│   ├── light/bg.jpg    ← Minimalistic Light background
│   └── dark/bg.jpg     ← Minimalistic Dark background
└── work/
    ├── light/bg.jpg    ← Work Light background
    └── dark/bg.jpg     ← Work Dark background
```

**Tips:**
- Recommended resolution: **2560×1440** or higher for retina screens
- Supported formats: JPG (photos), PNG (illustrations)
- Leave a folder empty to fall back to the solid `--color-bg` defined in the theme CSS

### 🎨 Theme Customization
Each theme is defined via CSS custom properties in `css/themes/`. You can modify colors, fonts, opacities, and more by editing these files:
- `minimalistic-light.css`
- `minimalistic-dark.css`
- `work-light.css`
- `work-dark.css`

---

## 🗂 Project Structure

```
extension/
├── manifest.json                  ← Chrome Extension manifest (Manifest V3)
├── newtab.html                    ← Main new tab page shell
├── README.md
│
├── icons/                         ← Extension icons (16/32/48/128px)
│
├── assets/
│   ├── backgrounds/               ← Theme-specific background images
│   ├── fonts/                     ← Custom font files
│   └── icons/                     ← UI icons (SVG/PNG)
│
├── css/
│   ├── base.css                   ← Layout grids, resets, base variables
│   ├── themes/                    ← 4 theme variants (light/dark × mode)
│   └── components/                ← Per-component stylesheets
│       ├── clock.css
│       ├── search.css
│       ├── greeting.css
│       ├── quicklinks.css
│       ├── stickynotes.css
│       ├── settings-panel.css
│       ├── widgets.css            ← Widget layout & music animations
│       ├── todo.css
│       └── history.css
│
├── js/
│   ├── storage.js                 ← chrome.storage.local Promise wrapper
│   ├── theme-manager.js           ← Mode & theme sync/persistence
│   ├── newtab.js                  ← Page router & layout initializer
│   └── components/
│       ├── clock.js               ← Clock rendering
│       ├── search.js              ← Google search integration
│       ├── greeting.js            ← Personalized greeting card
│       ├── quicklinks.js          ← Sidebar link manager
│       ├── stickynotes.js         ← Sticky notes with drag & drop
│       ├── settings-panel.js      ← Settings panel controller
│       ├── widgets.js             ← Music + AI + Weather + Scribble
│       ├── todo.js                ← To-do list manager
│       └── history.js             ← Unique domain history fetcher
│
└── popup/
    ├── popup.html                 ← Toolbar popup settings menu
    ├── popup.css
    └── popup.js
```

---

## 🔐 Permissions Explained

| Permission | Why it's needed |
|------------|-----------------|
| `storage` | Save preferences, notes, to-dos, chat history, and API keys locally |
| `history` | Display your 10 most recent unique sites in Work mode |
| `tabs` | Access tab info for history deduplication |
| `geolocation` | Fetch weather data based on your current location |

All data stays **100% local** on your machine. No external telemetry or analytics.

---

## 🛠 Tech Stack

- **Manifest V3** — latest Chrome extension architecture
- **Vanilla HTML / CSS / JavaScript** — zero dependencies, zero build step
- **Open-Meteo API** — free, open-source weather data (no key required)
- **Google Gemini API** — free-tier AI chat (key required, stored locally)
- **SomaFM** — free internet radio streams

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** this repository
2. **Create a feature branch:**
   ```bash
   git checkout -b feature/my-new-feature
   ```
3. **Make your changes** and test by loading the extension locally
4. **Commit** with a clear message:
   ```bash
   git commit -m "feat: add new widget for X"
   ```
5. **Push** and open a **Pull Request**

### Ideas for Contributions
- 🌐 Additional search engine options
- 🎵 More radio station presets
- 📊 New widgets (e.g., Pomodoro timer, bookmarks, stocks)
- 🌍 i18n / localization support
- 🖌 New theme variants

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).

---

## 💡 Troubleshooting

| Issue | Solution |
|-------|----------|
| Extension doesn't load | Make sure you selected the folder containing `manifest.json`, not a parent directory |
| Music won't play | Click the play button once — browsers block autoplay until user interaction |
| Weather shows "Location denied" | Allow location access when prompted, or enable it in Chrome site settings |
| AI chat says "Add API key" | Get a free key from [Google AI Studio](https://aistudio.google.com/app/apikey) and paste it in the AI widget |
| Backgrounds not showing | Ensure your image is named `bg.jpg` and placed in the correct theme subfolder |

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/PranjalArya1908">Pranjal Arya</a>
</p>
