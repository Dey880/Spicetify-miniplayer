// Prettier Miniplayer
// Made by Dey <3

(async function Miniplayer() {
  // Wait for spicetify to load
  while (
    !Spicetify?.Player?.data ||
    !Spicetify?.Platform ||
    !Spicetify?.CosmosAsync
  ) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Config
  const CONFIG = {
    pipWidth: 280,
    pipHeight: 360,
    updateInterval: 100,
  };

  // Themes
  const THEMES = {
    spotify: {
      name: "Spotify",
      emoji: "🟢",
      bg: "linear-gradient(160deg, #0a0a0a 0%, #1a1a2e 40%, #0f0f23 100%)",
      accent: "#1ed760",
      accentHover: "#1fdf64",
      headerBg: "rgba(0, 0, 0, 0.5)",
      controlsBg: "rgba(0, 0, 0, 0.35)",
      footerBg: "rgba(0, 0, 0, 0.45)",
      textGlow: "rgba(30, 215, 96, 0.3)",
    },
    forest: {
      //          [Forest]
      // main-elevated / card    = #011502
      // sidebar                 = #14442b ; bottom part of sky
      // sidebar-alt             = #000000 ; top part of sky

      // text                    = #FFFFFF
      // subtext                 = #ADB5BD

      // button-active           = #9893DA
      // button                  = #c4c6ff
      // button-disabled         = #000000

      // highlight               = #191919
      // highlight-elevated      = #011502

      // shadow                  = #000000
      // selected-row            = #FFFFFF
      // misc                    = #DBF9F4
      // notification-error      = #E22134
      // notification            = #77be80
      // tab-active              = #333333
      // player                  = #181818
      name: "Forest",
      emoji: "🌲",
      bg: "linear-gradient(0deg,rgba(20, 68, 43, 1) 0%, rgba(0, 0, 0, 1) 100%);",
      accent: "#938ece",
      accentHover: "#9893DA",
      headerBg: "rgba(0, 0, 0, 0)",
      controlsBg: "rgba(0, 0, 0, 0)",
      footerBg: "rgba(0, 0, 0, 0)",
      textGlow: "rgba(147, 142 ,206, 0.3)",
    },
  };

  // State
  let pipWindow = null;
  let currentTrackUri = null;
  let updateIntervalId = null;
  let fontSize = 14; // Prob check ???
  let currentTheme = "forest";

  // Load saved settings
  try {
    const savedTheme = localStorage.getItem("miniplayer-theme");
    if (savedTheme && THEMES[savedTheme]) currentTheme = savedTheme;
  } catch (e) {}

  //
  //                   NEED DOING !!! ???
  //
  // Generate CSS with theme
  function generateStyles(theme) {
    const t = THEMES[theme] || THEMES.spotify;
    return `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');
        
        :root {
            --accent: ${t.accent};
            --accent-hover: ${t.accentHover};
            --text-glow: ${t.textGlow};
        }
        
        *, *::before, *::after {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        html, body {
            height: 100%;
            overflow: hidden;
        }

        body {
            font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: ${t.bg};
            color: #ffffff;
            display: flex;
            flex-direction: column;
        }

        /* Resize Handle at Top - Subtle */
        .resize-handle {
            height: 4px;
            cursor: ns-resize;
            flex-shrink: 0;
        }

        .resize-handle:hover {
            background: rgba(255, 255, 255, 0.05);
        }

        /* Header - Draggable */
        .header {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 12px;
            background: ${t.headerBg};
            backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
            flex-shrink: 0;
            cursor: grab;
            user-select: none;
            -webkit-app-region: drag;
            app-region: drag;
        }

        .header:active {
            cursor: grabbing;
        }

        .album-art {
            width: 40px;
            height: 40px;
            border-radius: 6px;
            object-fit: cover;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.5);
            flex-shrink: 0;
            -webkit-app-region: no-drag;
            app-region: no-drag;
        }

        .track-info {
            flex: 1;
            min-width: 0;
        }

        .track-title {
            font-size: 12px;
            font-weight: 600;
            color: #fff;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-bottom: 1px;
        }

        .track-artist {
            font-size: 10px;
            font-weight: 400;
            color: rgba(255, 255, 255, 0.55);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        /* Header Buttons */
        .header-btns {
            display: flex;
            align-items: center;
            gap: 2px;
            -webkit-app-region: no-drag;
            app-region: no-drag;
        }

        .menu-btn {
            display: flex;
            flex-direction: column;
            gap: 2px;
            padding: 6px 4px;
            cursor: pointer;
            opacity: 0.4;
            transition: opacity 0.15s;
            background: none;
            border: none;
        }

        .menu-btn:hover {
            opacity: 0.8;
        }

        .menu-row {
            display: flex;
            gap: 2px;
        }

        .menu-dot {
            width: 2px;
            height: 2px;
            background: #fff;
            border-radius: 50%;
        }

        .close-btn {
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.4);
            font-size: 18px;
            cursor: pointer;
            padding: 4px 6px;
            transition: all 0.15s;
            line-height: 1;
        }

        .close-btn:hover {
            color: #ff5f5f;
        }

        .close-btn.hidden {
            display: none;
        }

        /* Settings Panel - Full Overlay */
        .settings-panel {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(10, 10, 15, 0.98);
            z-index: 1000;
            display: none;
            flex-direction: column;
            -webkit-app-region: no-drag;
            app-region: no-drag;
            overflow-y: auto;
        }

        .settings-panel.open {
            display: flex;
            animation: panelSlide 0.2s ease;
        }

        @keyframes panelSlide {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .settings-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            flex-shrink: 0;
        }

        .settings-title {
            font-size: 16px;
            font-weight: 600;
            color: #fff;
        }

        .settings-close {
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: #fff;
            width: 32px;
            height: 32px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.15s;
        }

        .settings-close:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        .settings-content {
            flex: 1;
            padding: 16px;
            overflow-y: auto;
        }

        .menu-section-title {
            font-size: 11px;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.4);
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 12px;
            margin-top: 8px;
        }

        .menu-section-title:first-child {
            margin-top: 0;
        }

        .menu-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 14px;
            cursor: pointer;
            transition: background 0.1s;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 10px;
            margin-bottom: 8px;
        }

        .menu-item:hover {
            background: rgba(255, 255, 255, 0.08);
        }

        .menu-item-label {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.85);
        }

        .menu-toggle {
            width: 44px;
            height: 24px;
            background: rgba(255, 255, 255, 0.15);
            border-radius: 12px;
            position: relative;
            transition: background 0.2s;
        }

        .menu-toggle.on {
            background: var(--accent);
        }

        .menu-toggle::after {
            content: '';
            position: absolute;
            top: 3px;
            left: 3px;
            width: 18px;
            height: 18px;
            background: #fff;
            border-radius: 50%;
            transition: transform 0.2s;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }

        .menu-toggle.on::after {
            transform: translateX(20px);
        }

        .menu-divider {
            height: 1px;
            background: rgba(255, 255, 255, 0.08);
            margin: 16px 0;
        }

        /* Theme Button */
        .theme-btn {
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
            padding: 12px 14px;
            background: rgba(255, 255, 255, 0.03);
            border: none;
            border-radius: 10px;
            cursor: pointer;
            transition: background 0.15s;
        }

        .theme-btn:hover {
            background: rgba(255, 255, 255, 0.08);
        }

        .theme-btn-preview {
            font-size: 20px;
        }

        .theme-btn-info {
            flex: 1;
            text-align: left;
        }

        .theme-btn-label {
            font-size: 10px;
            color: rgba(255, 255, 255, 0.4);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .theme-btn-name {
            font-size: 13px;
            font-weight: 500;
            color: #fff;
        }

        .theme-btn-arrow {
            color: rgba(255, 255, 255, 0.4);
            font-size: 18px;
        }

        /* Theme Picker Panel */
        .theme-picker {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(8, 8, 12, 0.98);
            z-index: 1001;
            display: none;
            flex-direction: column;
        }

        .theme-picker.open {
            display: flex;
            animation: panelSlide 0.2s ease;
        }

        .theme-picker-header {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px 14px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            flex-shrink: 0;
        }

        .theme-picker-back {
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: #fff;
            width: 28px;
            height: 28px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.15s;
        }

        .theme-picker-back:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        .theme-picker-title {
            font-size: 14px;
            font-weight: 600;
            color: #fff;
        }

        .theme-grid {
            flex: 1;
            overflow-y: auto;
            padding: 10px;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            align-content: start;
        }

        .theme-grid::-webkit-scrollbar { width: 4px; }
        .theme-grid::-webkit-scrollbar-thumb { 
            background: rgba(255, 255, 255, 0.15); 
            border-radius: 2px; 
        }

        .theme-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            padding: 10px 4px;
            cursor: pointer;
            transition: all 0.15s;
            font-size: 10px;
            color: rgba(255, 255, 255, 0.6);
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.03);
            border: 2px solid transparent;
        }

        .theme-item:hover {
            background: rgba(255, 255, 255, 0.08);
            color: #fff;
        }

        .theme-item.active {
            background: rgba(255, 255, 255, 0.1);
            border-color: var(--accent);
            color: #fff;
        }

        .theme-emoji { font-size: 20px; }
        .theme-name { 
            font-weight: 500; 
            text-align: center;
            line-height: 1.2;
        }



        /* Controls */
        .controls {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            padding: 8px;
            background: ${t.controlsBg};
            flex-shrink: 0;
            -webkit-app-region: no-drag;
            app-region: no-drag;
        }

        .ctrl-btn {
            background: rgba(255, 255, 255, 0.08);
            border: none;
            color: #fff;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.15s ease;
        }

        .ctrl-btn:hover {
            background: rgba(255, 255, 255, 0.15);
            transform: scale(1.05);
        }

        .ctrl-btn:active {
            transform: scale(0.95);
        }

        .ctrl-btn svg {
            width: 14px;
            height: 14px;
            fill: currentColor;
        }

        .ctrl-btn.play-btn {
            width: 38px;
            height: 38px;
            background: var(--accent);
            color: #000;
        }

        .ctrl-btn.play-btn:hover {
            background: var(--accent-hover);
            transform: scale(1.06);
        }

        .ctrl-btn.play-btn svg {
            width: 16px;
            height: 16px;
        }

        .ctrl-btn.shuffle-on {
            color: var(--accent);
        }

        .ctrl-btn.liked {
            color: #1ed760;
        }

        .ctrl-btn.liked svg {
            fill: #1ed760;
        }

        .ctrl-btn.hidden {
            display: none;
        }

        /* Lyrics Container */
        .lyrics-wrap {
            flex: 1 1 auto;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 12px;
            scroll-behavior: smooth;
            -webkit-app-region: no-drag;
            app-region: no-drag;
            min-height: 0;
        }

        .lyrics-wrap.centered {
            text-align: center;
        }

        .lyrics-wrap.centered .lyric {
            transform-origin: center center;
        }

        .lyrics-wrap.collapsed {
            display: none;
        }

        .lyrics-wrap::-webkit-scrollbar {
            display: none;
        }

        .lyrics-wrap {
            scrollbar-width: none; /* Firefox */
            -ms-overflow-style: none; /* IE/Edge */
        }

        .lyric {
            padding: 5px 0;
            opacity: 0.3;
            transition: all 0.2s ease;
            cursor: pointer;
            line-height: 1.35;
            transform-origin: left center;
        }

        .lyric:hover {
            opacity: 0.5;
        }

        .lyric.active {
            opacity: 1;
            color: var(--accent);
            font-weight: 500;
            transform: scale(1.02);
            text-shadow: 0 0 20px var(--text-glow);
        }

        .lyric.past {
            opacity: 0.4;
        }

        /* No Lyrics / Loading */
        .status-msg {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            text-align: center;
            padding: 20px;
            opacity: 0.6;
        }

        .status-msg .icon {
            font-size: 40px;
            margin-bottom: 12px;
        }

        .status-msg .text {
            font-size: 15px;
            font-weight: 500;
        }

        .status-msg .subtext {
            font-size: 12px;
            opacity: 0.6;
            margin-top: 4px;
        }

        .spinner {
            width: 32px;
            height: 32px;
            border: 3px solid rgba(255, 255, 255, 0.1);
            border-top-color: var(--accent);
            border-radius: 50%;
            animation: spin 0.7s linear infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        /* Footer */
        .footer {
            background: ${t.footerBg};
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            flex-shrink: 0;
            padding: 6px 10px;
            -webkit-app-region: no-drag;
            app-region: no-drag;
        }

        /* Hide footer when all rows are collapsed */
        .footer:not(:has(.footer-row:not(.collapsed))) {
            display: none;
        }

        .footer-row {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .footer-row.collapsed {
            display: none;
        }

        .footer-row.collapsed + .footer-row:not(.collapsed) {
            /* No extra spacing when previous row is collapsed */
        }

        .footer-row:not(.collapsed) + .footer-row:not(.collapsed) {
            margin-top: 6px;
            padding-top: 6px;
            border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .control-label {
            font-size: 9px;
            color: rgba(255, 255, 255, 0.4);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            min-width: 24px;
        }

        .slider {
            -webkit-appearance: none;
            flex: 1;
            height: 3px;
            background: rgba(255, 255, 255, 0.15);
            border-radius: 2px;
            outline: none;
        }

        .slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 10px;
            height: 10px;
            background: var(--accent);
            border-radius: 50%;
            cursor: pointer;
            transition: transform 0.1s;
        }

        .slider::-webkit-slider-thumb:hover {
            transform: scale(1.2);
        }

        .volume-icon {
            width: 14px;
            height: 14px;
            fill: rgba(255, 255, 255, 0.5);
            flex-shrink: 0;
            cursor: pointer;
            transition: fill 0.15s;
        }

        .volume-icon:hover {
            fill: #fff;
        }

        .value-display {
            font-size: 10px;
            color: rgba(255, 255, 255, 0.5);
            min-width: 28px;
            text-align: right;
        }
    `;
  }

  // Pip window creation
  async function openPictureInPicture() {
    // Close existing PiP window if open
    if (pipWindow && !pipWindow.closed) {
      pipWindow.close();
      pipWindow = null;
      return;
    }

    // Reset track URI ???
    currentTrackUri = null;

    // Check for Document Picture-in-Picture API (Chrome 116+)
    if ("documentPictureInPicture" in window) {
      try {
        pipWindow = await window.documentPictureInPicture.requestWindow({
          width: CONFIG.pipWidth,
          height: CONFIG.pipHeight,
        });

        setupPipWindow(pipWindow);
        return;
      } catch (err) {
        console.log(
          "[Prettier Miniplayer] Document PiP failed, trying fallback:",
          err,
        );
      }
    }
    // Fallback: Regular popup window
    try {
      const left = window.screen.width - CONFIG.pipWidth - 30;
      const top = 30;
      pipWindow = window.open(
        "about:blank",
        "Prettier Miniplayer",
        `width=${CONFIG.pipWidth},height=${CONFIG.pipHeight},left=${left},top=${top},resizable=yes,scrollbars=no,toolbar=no,status=no`,
      );
      if (pipWindow) {
        setupPipWindow(pipWindow);
      } else {
        Spicetify.showNotification("Could not open miniplayer window", true);
      }
    } catch (err) {
      console.error("[Prettier Miniplayer] Fallback popup failed:", err);
      Spicetify.showNotification("Could not open miniplayer window", true);
    }
  }

  function generateThemeMenuItems() {
    return Object.entries(THEMES)
      .map(
        ([key, theme]) =>
          `<div class="theme-item ${key === currentTheme ? "active" : ""}" data-theme="${key}">
              <span class="theme-emoji">${theme.emoji}</span>
              <span class="theme-name">${theme.name}</span>
          </div>`,
      )
      .join("");
  }

  function setupPipWindow(win) {
    const doc = win.document;

    // Build the HTML
    doc.write(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>♫ Lyrics</title>
    <style id="themeStyles">${generateStyles(currentTheme)}</style>
</head>
<body>
    <div class="resize-handle" id="resizeHandle" title="Drag to resize"></div>
    <div class="header" id="dragHeader" title="Drag to move window">
        <img class="album-art" id="albumArt" src="" alt="">
        <div class="track-info">
            <div class="track-title" id="trackTitle">Loading...</div>
            <div class="track-artist" id="trackArtist">-</div>
        </div>
        <div class="header-btns">
            <button class="menu-btn" id="menuBtn" title="Settings">
                <div class="menu-row">
                    <div class="menu-dot"></div>
                    <div class="menu-dot"></div>
                </div>
                <div class="menu-row">
                    <div class="menu-dot"></div>
                    <div class="menu-dot"></div>
                </div>
                <div class="menu-row">
                    <div class="menu-dot"></div>
                    <div class="menu-dot"></div>
                </div>
            </button>
            <button class="close-btn" id="closeBtn" title="Close">×</button>
        </div>
    </div>
    <!-- Settings Panel - Full Screen -->
    <div class="settings-panel" id="settingsPanel">
        <div class="settings-header">
            <span class="settings-title">⚙️ Settings</span>
            <button class="settings-close" id="settingsClose">✕</button>
        </div>
        <div class="settings-content">
            <button class="theme-btn" id="openThemePicker">
                <span class="theme-btn-preview" id="currentThemeEmoji">${THEMES[currentTheme].emoji}</span>
                <div class="theme-btn-info">
                    <div class="theme-btn-label">Theme</div>
                    <div class="theme-btn-name" id="currentThemeName">${THEMES[currentTheme].name}</div>
                </div>
                <span class="theme-btn-arrow">›</span>
            </button>
            <div class="menu-divider"></div>
        </div>
    </div>

    <!-- Theme Picker Panel -->
    <div class="theme-picker" id="themePicker">
        <div class="theme-picker-header">
            <button class="theme-picker-back" id="themePickerBack">‹</button>
            <span class="theme-picker-title">Choose Theme</span>
        </div>
        <div class="theme-grid" id="themeGrid">
            ${generateThemeMenuItems()}
        </div>
    </div>

    <div class="controls">
        <button class="ctrl-btn" id="prevBtn" title="Previous">
            <svg viewBox="0 0 16 16"><path d="M3.3 1a.7.7 0 0 1 .7.7v5.15l9.95-5.744a.7.7 0 0 1 1.05.606v12.575a.7.7 0 0 1-1.05.607L4 9.149V14.3a.7.7 0 0 1-.7.7H1.7a.7.7 0 0 1-.7-.7V1.7a.7.7 0 0 1 .7-.7h1.6z"/></svg>
        </button>
        <button class="ctrl-btn play-btn" id="playBtn" title="Play/Pause">
            <svg viewBox="0 0 16 16" id="playIcon"><path d="M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288V1.713z"/></svg>
        </button>
        <button class="ctrl-btn" id="nextBtn" title="Next">
            <svg viewBox="0 0 16 16"><path d="M12.7 1a.7.7 0 0 0-.7.7v5.15L2.05 1.107A.7.7 0 0 0 1 1.712v12.575a.7.7 0 0 0 1.05.607L12 9.149V14.3a.7.7 0 0 0 .7.7h1.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7h-1.6z"/></svg>
        </button>
        <button class="ctrl-btn" id="shuffleBtn" title="Shuffle">
            <svg viewBox="0 0 16 16" id="shuffleIcon"><path d="M13.151.922a.75.75 0 1 0-1.06 1.06L13.109 3H11.16a3.75 3.75 0 0 0-2.873 1.34l-6.173 7.356A2.25 2.25 0 0 1 .39 12.5H0V14h.391a3.75 3.75 0 0 0 2.873-1.34l6.173-7.356a2.25 2.25 0 0 1 1.724-.804h1.947l-1.017 1.018a.75.75 0 0 0 1.06 1.06l2.306-2.306a.75.75 0 0 0 0-1.06L13.15.922zM.391 3.5H0V2h.391c1.109 0 2.16.49 2.873 1.34L4.89 5.277l-.979 1.167-1.796-2.14A2.25 2.25 0 0 0 .39 3.5z"/><path d="m7.5 10.723.98-1.167 1.796 2.14a2.25 2.25 0 0 0 1.724.804h1.947l-1.017-1.018a.75.75 0 1 1 1.06-1.06l2.306 2.306a.75.75 0 0 1 0 1.06l-2.306 2.306a.75.75 0 1 1-1.06-1.06L14.109 14H12.16a3.75 3.75 0 0 1-2.873-1.34l-1.787-2.14z"/></svg>
        </button>
        <button class="ctrl-btn" id="likeBtn" title="Save to Liked Songs">
            <svg viewBox="0 0 16 16" id="likeIcon"><path d="M1.69 2A4.582 4.582 0 0 1 8 2.023 4.583 4.583 0 0 1 11.88.817h.002a4.618 4.618 0 0 1 3.782 3.65v.003a4.543 4.543 0 0 1-1.011 3.84L9.35 14.629a1.765 1.765 0 0 1-2.093.464 1.762 1.762 0 0 1-.605-.463L1.348 8.309A4.582 4.582 0 0 1 1.689 2zm3.158.252A3.082 3.082 0 0 0 2.49 7.337l.005.005L7.8 13.664a.264.264 0 0 0 .311.069.262.262 0 0 0 .09-.069l5.312-6.33a3.043 3.043 0 0 0 .68-2.573 3.118 3.118 0 0 0-2.551-2.463 3.079 3.079 0 0 0-2.612.816l-.007.007a1.501 1.501 0 0 1-2.045 0l-.009-.008a3.082 3.082 0 0 0-2.121-.861z"/></svg>
        </button>
    </div>
</body>
</html>`);
    doc.close();
  }

  async function createButton() {
    let container;
    while (!container) {
      container = document.querySelector(
        '.spicetify-sc-scroller[role="list"] > [role="presentation"]',
      );
      if (!container) await new Promise((r) => setTimeout(r, 350));
    }

    const btn = document.createElement("button");
    btn.className =
      "Button-sc-1dqy6lx-0 Button-buttonTertiary-medium-iconOnly-isUsingKeyboard-useBrowserDefaultFocusStyle e-91000-overflow-wrap-anywhere e-91000-button-tertiary--icon-only link-subtle main-globalNav-navLink main-globalNav-link-icon custom-navlink";
    btn.ariaLabel = "Mini Player";
    btn.setAttribute("data-encore-id", "buttonTertiary");

    const spn = document.createElement("span");
    spn.setAttribute("aria-hidden", "true");
    spn.className = "e-91000-button__icon-wrapper";

    const outerSvg = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg",
    );
    outerSvg.setAttribute("data-encore-id", "icon");
    outerSvg.setAttribute("role", "img");
    outerSvg.setAttribute("aria-hidden", "true");
    outerSvg.setAttribute("class", "e-91000-icon e-91000-baseline");
    outerSvg.innerHTML = `
  <svg viewBox="0 0 24 24" fill="none" stroke="none" xmlns="http://www.w3.org/2000/svg" stroke-width="2">
    <rect width="20" height="16" x="2" y="4" rx="2" stroke="currentColor"/>
    <rect width="9" height="7" x="13" y="13" rx="2" stroke="currentColor"/>
  </svg>
`;

    const style = document.createElement("style");
    style.textContent = `
  .main-contextMenu-tippyEnter {
    opacity: 0;
  }
  .main-contextMenu-tippyEnterActive {
    opacity: 1;
    transition: opacity 200ms linear;
  }
`;
    document.head.appendChild(style);
    spn.appendChild(outerSvg);
    btn.appendChild(spn);

    Spicetify.Tippy(btn, {
      ...Spicetify.TippyProps,
      content: btn.ariaLabel,
      placement: "bottom",
    });

    function mouseEnter() {}
    function mouseLeave() {}

    btn.addEventListener("mouseenter", mouseEnter);
    btn.addEventListener("mouseleave", mouseLeave);
    btn.addEventListener("click", openPictureInPicture);

    container.appendChild(btn);
  }
  createButton();
})();
