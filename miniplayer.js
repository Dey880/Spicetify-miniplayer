// Pocket Player Miniplayer
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
    pipWidth: 400,
    pipHeight: 400,
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
    sunset: {
      name: "Sunset",
      emoji: "🌅",
      bg: "linear-gradient(155deg, #2f1338 0%, #a03a5f 45%, #f08a5d 100%)",
      accent: "#ffd166",
      accentHover: "#ffe08a",
      headerBg: "rgba(34, 12, 36, 0.45)",
      controlsBg: "rgba(34, 12, 36, 0.3)",
      footerBg: "rgba(34, 12, 36, 0.4)",
      textGlow: "rgba(255, 209, 102, 0.35)",
    },
    arctic: {
      name: "Arctic",
      emoji: "🧊",
      bg: "linear-gradient(160deg, #091b2e 0%, #134a68 45%, #8dd8ff 100%)",
      accent: "#8ef0ff",
      accentHover: "#b8f7ff",
      headerBg: "rgba(6, 22, 37, 0.45)",
      controlsBg: "rgba(6, 22, 37, 0.3)",
      footerBg: "rgba(6, 22, 37, 0.4)",
      textGlow: "rgba(142, 240, 255, 0.35)",
    },
    ember: {
      name: "Ember",
      emoji: "🔥",
      bg: "linear-gradient(150deg, #120903 0%, #4a1400 45%, #b33f00 100%)",
      accent: "#ff9e4a",
      accentHover: "#ffb36e",
      headerBg: "rgba(18, 9, 3, 0.5)",
      controlsBg: "rgba(18, 9, 3, 0.35)",
      footerBg: "rgba(18, 9, 3, 0.45)",
      textGlow: "rgba(255, 158, 74, 0.35)",
    },
    monochrome: {
      name: "Monochrome",
      emoji: "◼️",
      bg: "linear-gradient(160deg, #050505 0%, #1b1b1b 45%, #454545 100%)",
      accent: "#e8e8e8",
      accentHover: "#ffffff",
      headerBg: "rgba(0, 0, 0, 0.45)",
      controlsBg: "rgba(0, 0, 0, 0.3)",
      footerBg: "rgba(0, 0, 0, 0.4)",
      textGlow: "rgba(255, 255, 255, 0.22)",
    },
    neonCity: {
      name: "Neon City",
      emoji: "🌃",
      bg: "linear-gradient(160deg, #090014 0%, #1d0b3a 45%, #0b2347 100%)",
      accent: "#00f5d4",
      accentHover: "#4dffe5",
      headerBg: "rgba(7, 2, 20, 0.5)",
      controlsBg: "rgba(7, 2, 20, 0.35)",
      footerBg: "rgba(7, 2, 20, 0.45)",
      textGlow: "rgba(0, 245, 212, 0.35)",
    },
  };

  // State
  let pipWindow = null;
  let currentTrackUri = null;
  let updateIntervalId = null;
  let currentTheme = "forest";
  let isCdOverlayEnabled = false;
  let cdAssetsPromise = null;
  function logCd(...args) {}

  function logCdError(...args) {
    console.error("[Pocket Player][CD]", ...args);
  }

  // Load saved settings
  try {
    const savedTheme = localStorage.getItem("miniplayer-theme");
    if (savedTheme && THEMES[savedTheme]) currentTheme = savedTheme;
    const savedIsCdOverlayEnabled = localStorage.getItem(
      "miniplayer-cd-overlay",
    );
    if (savedIsCdOverlayEnabled !== null)
      isCdOverlayEnabled = savedIsCdOverlayEnabled === "true";
  } catch (e) {}

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        resolve(img);
      };
      img.onerror = (err) => {
        logCdError("loadImage:error", { src, err });
        reject(err);
      };
      img.src = src;
    });
  }

  function resolveCanvasImageUrl(src) {
    if (!src || typeof src !== "string") return "";

    if (src.startsWith("spotify:image:")) {
      const imageId = src.split(":")[2];
      if (!imageId) return "";
      const resolvedUrl = `https://i.scdn.co/image/${imageId}`;
      return resolvedUrl;
    }

    return src;
  }

  function getCdAssets() {
    if (!cdAssetsPromise) {
      const overlayUrl =
        "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/ce4378e8-006f-4db2-9d4b-d9be00237eba/d2emsdv-a5921ff2-1254-47d1-bd73-4222fcdd3d79.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiIvZi9jZTQzNzhlOC0wMDZmLTRkYjItOWQ0Yi1kOWJlMDAyMzdlYmEvZDJlbXNkdi1hNTkyMWZmMi0xMjU0LTQ3ZDEtYmQ3My00MjIyZmNkZDNkNzkucG5nIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.yjC6W8AmV_tgZ2EPluQ1wlDFAvOBAlXJkW2_GvRYevE";
      cdAssetsPromise = loadImage(overlayUrl)
        .then((overlay) => {
          return { overlay };
        })
        .catch((err) => {
          logCdError("getCdAssets:error", { err });
          throw err;
        });
    } else {
      logCd("getCdAssets:reuse-cache");
    }

    return cdAssetsPromise;
  }

  function renderPlainAlbum(ctx, canvas, albumImg) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(albumImg, 0, 0, canvas.width, canvas.height);
  }

  function renderCdAlbum(ctx, canvas, albumImg, overlayImg) {
    const size = canvas.width;
    const center = size / 2;
    const discRadius = size / 2;
    const holeRadius = size * 0.16;
    const offscreen = document.createElement("canvas");
    offscreen.width = size;
    offscreen.height = size;
    const offscreenCtx = offscreen.getContext("2d", { alpha: true });

    if (!offscreenCtx) {
      renderPlainAlbum(ctx, canvas, albumImg);
      return;
    }

    offscreenCtx.save();
    offscreenCtx.beginPath();
    offscreenCtx.arc(center, center, discRadius, 0, Math.PI * 2);
    offscreenCtx.clip();
    offscreenCtx.drawImage(albumImg, 0, 0, size, size);
    offscreenCtx.globalCompositeOperation = "destination-out";
    offscreenCtx.beginPath();
    offscreenCtx.arc(center, center, holeRadius, 0, Math.PI * 2);
    offscreenCtx.fill();
    offscreenCtx.restore();

    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(offscreen, 0, 0);
    ctx.drawImage(overlayImg, 0, 0, size, size);

    ctx.beginPath();
    ctx.arc(center, center, holeRadius + 3, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  function drawAlbumCanvas(canvas, albumUrl, options = {}) {
    if (!canvas) {
      logCd("drawAlbumCanvas:missing-canvas");
      return;
    }

    const { cdEffect = false } = options;
    const size = 500;
    canvas.width = size;
    canvas.height = size;
    const resolvedAlbumUrl = resolveCanvasImageUrl(albumUrl);

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) {
      logCd("drawAlbumCanvas:no-2d-context");
      return;
    }

    if (!resolvedAlbumUrl) {
      logCd("drawAlbumCanvas:no-album-url-clear");
      ctx.clearRect(0, 0, size, size);
      return;
    }

    const renderToken = `${Date.now()}-${Math.random()}`;
    canvas.dataset.renderToken = renderToken;

    const renderIfFresh = (renderer) => {
      if (canvas.dataset.renderToken !== renderToken) {
        logCd("drawAlbumCanvas:stale-render-skip", { renderToken });
        return;
      }
      renderer();
    };

    loadImage(resolvedAlbumUrl)
      .then((album) => {
        if (!cdEffect) {
          renderIfFresh(() => renderPlainAlbum(ctx, canvas, album));
          return;
        }

        getCdAssets()
          .then(({ overlay }) => {
            renderIfFresh(() => renderCdAlbum(ctx, canvas, album, overlay));
          })
          .catch((err) => {
            logCdError("drawAlbumCanvas:overlay-failed-fallback-plain", {
              err,
            });
            renderIfFresh(() => renderPlainAlbum(ctx, canvas, album));
          });
      })
      .catch((err) => {
        logCdError("drawAlbumCanvas:album-load-failed", {
          albumUrl,
          resolvedAlbumUrl,
          err,
        });
        if (canvas.dataset.renderToken !== renderToken) {
          logCd("drawAlbumCanvas:album-load-failed-stale-skip");
          return;
        }
        ctx.clearRect(0, 0, size, size);
      });
  }

  // Generate CSS with theme
  function generateStyles(theme) {
    const t = THEMES[theme] || THEMES.spotify;
    return `
@import url("https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap");

:root {
  --accent: ${t.accent};
  --accent-hover: ${t.accentHover};
  --text-glow: ${t.textGlow};
  --ui-scale: 1;
}

*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  min-height: 350px;
  height: 100%;
  overflow: hidden;
}

body {
  font-family:
    "DM Sans",
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  background: ${t.bg};
  color: #ffffff;
  display: flex;
  flex-direction: column;
  position: relative;
}

:root {
  --spice-star: #ffffff;
  --spice-star-glow: rgba(255, 255, 255, 0.55);
  --spice-shooting-star: #ffffff;
  --spice-rgb-shooting-star-glow: 255, 255, 255;
}

.starrynight-bg-container {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  background: transparent;
}

.star {
  position: absolute;
  border-radius: 50%;
  z-index: 0;
  background-color: var(--spice-star);
}

@keyframes twinkle1 {
  0% {
    box-shadow: 0 0 8px 2px var(--spice-star-glow);
  }
  20% {
    box-shadow: 0 0 -8px 2px var(--spice-star-glow);
  }
  40% {
    box-shadow: 0 0 -8px 2px var(--spice-star-glow);
  }
  60% {
    box-shadow: 0 0 -8px 2px var(--spice-star-glow);
  }
  80% {
    box-shadow: 0 0 8px 2px var(--spice-star-glow);
  }
  100% {
    box-shadow: 0 0 8px 2px var(--spice-star-glow);
  }
}

@keyframes twinkle2 {
  0% {
    box-shadow: 0 0 8px 2px var(--spice-star-glow);
  }
  20% {
    box-shadow: 0 0 8px 2px var(--spice-star-glow);
  }
  40% {
    box-shadow: 0 0 -8px 2px var(--spice-star-glow);
  }
  60% {
    box-shadow: 0 0 -8px 2px var(--spice-star-glow);
  }
  80% {
    box-shadow: 0 0 -8px 2px var(--spice-star-glow);
  }
  100% {
    box-shadow: 0 0 8px 2px var(--spice-star-glow);
  }
}

@keyframes twinkle3 {
  0% {
    box-shadow: 0 0 -8px 2px var(--spice-star-glow);
  }
  20% {
    box-shadow: 0 0 8px 2px var(--spice-star-glow);
  }
  40% {
    box-shadow: 0 0 8px 2px var(--spice-star-glow);
  }
  60% {
    box-shadow: 0 0 8px 2px var(--spice-star-glow);
  }
  80% {
    box-shadow: 0 0 -8px 2px var(--spice-star-glow);
  }
  100% {
    box-shadow: 0 0 -8px 2px var(--spice-star-glow);
  }
}

@keyframes twinkle4 {
  0% {
    box-shadow: 0 0 -8px 2px var(--spice-star-glow);
  }
  20% {
    box-shadow: 0 0 -8px 2px var(--spice-star-glow);
  }
  40% {
    box-shadow: 0 0 8px 2px var(--spice-star-glow);
  }
  60% {
    box-shadow: 0 0 8px 2px var(--spice-star-glow);
  }
  80% {
    box-shadow: 0 0 8px 2px var(--spice-star-glow);
  }
  100% {
    box-shadow: 0 0 -8px 2px var(--spice-star-glow);
  }
}

/*
        Pure CSS Shooting Star Animation Effect Copyright (c) 2021 by Delroy Prithvi (https://codepen.io/delroyprithvi/pen/LYyJROR)

        Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, includin[...]

        The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

        THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT[...]
        */

.shootingstar {
  position: absolute;
  width: 4px;
  height: 4px;
  background: var(--spice-shooting-star);
  border-radius: 50%;
  animation: shootingStar 3s linear;
  left: initial;
  z-index: 0;
}

.shootingstar::before {
  content: "";
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 300px;
  height: 1px;
  background: linear-gradient(90deg, var(--spice-shooting-star), transparent);
}

@keyframes shootingStar {
  0% {
    transform: rotate(315deg) translateX(0);
    opacity: 1;
  }
  70% {
    opacity: 1;
  }
  100% {
    transform: rotate(315deg) translateX(-1500px);
    opacity: 0;
  }
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
  justify-content: space-between;
  display: flex;
  align-items: center;
  gap: calc(10px * var(--ui-scale));
  padding: calc(10px * var(--ui-scale)) calc(12px * var(--ui-scale));
  background: ${t.headerBg};
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
  user-select: none;
  -webkit-app-region: drag;
  app-region: drag;
}

.running-animation {
  animation-play-state: running !important;
}

/* The rotation keyframes */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.album-art {
  animation: spin 25s linear infinite;
  animation-play-state: paused;
  margin: calc(15px * var(--ui-scale));
  width: calc(220px * var(--ui-scale));
  height: calc(220px * var(--ui-scale));
  border-radius: 50%;
  cursor: default;
  object-fit: cover;
  flex-shrink: 0;
  -webkit-app-region: no-drag;
  app-region: no-drag;
}

.track-info {
  flex: 1;
  min-width: 0;
}

.track-title {
  font-size: calc(12px * var(--ui-scale));
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 1px;
}

.track-link,
.artist-link {
  color: inherit;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  cursor: pointer;
}

.track-link:hover,
.artist-link:hover {
  color: var(--accent);
  border-bottom-color: currentColor;
}

.track-artist {
  font-size: calc(10px * var(--ui-scale));
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
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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
  height: 100vh;
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
  content: "";
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

.theme-grid::-webkit-scrollbar {
  width: 4px;
}
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

.theme-emoji {
  font-size: 20px;
}
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
  gap: calc(4px * var(--ui-scale));
  padding: calc(8px * var(--ui-scale));
  flex-shrink: 0;
  -webkit-app-region: no-drag;
  app-region: no-drag;
}

.ctrl-btn {
  background: rgba(255, 255, 255, 0.08);
  border: none;
  color: #fff;
  width: calc(32px * var(--ui-scale));
  height: calc(32px * var(--ui-scale));
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
  width: calc(14px * var(--ui-scale));
  height: calc(14px * var(--ui-scale));
  fill: currentColor;
}

.ctrl-btn.play-btn {
  width: calc(38px * var(--ui-scale));
  height: calc(38px * var(--ui-scale));
  background: var(--accent);
  color: #000;
}

.ctrl-btn.play-btn:hover {
  background: var(--accent-hover);
  transform: scale(1.06);
}

.ctrl-btn.play-btn svg {
  width: calc(16px * var(--ui-scale));
  height: calc(16px * var(--ui-scale));
}

.ctrl-btn.shuffle-on {
  color: var(--accent);
}

.ctrl-btn.repeat-on {
  color: var(--accent);
}

.ctrl-btn.hidden {
  display: none;
}

.main-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: calc(6px * var(--ui-scale));
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

    // Reset track URI
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
        logCdError("openPictureInPicture:document-pip-failed", { err });
      }
    }
    // Fallback: Regular popup window
    try {
      const left = window.screen.width - CONFIG.pipWidth - 30;
      const top = 30;
      pipWindow = window.open(
        "about:blank",
        "Pocket Player",
        `width=${CONFIG.pipWidth},height=${CONFIG.pipHeight},left=${left},top=${top},resizable=yes,scrollbars=no,toolbar=no,status=no`,
      );
      if (pipWindow) {
        logCd("openPictureInPicture:using-popup-fallback");
        setupPipWindow(pipWindow);
      } else {
        logCd("openPictureInPicture:popup-blocked");
        Spicetify.showNotification("Could not open miniplayer window", true);
      }
    } catch (err) {
      logCdError("openPictureInPicture:popup-failed", { err });
      console.error("[Pocket Player] Fallback popup failed:", err);
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

  function initStarryNightBackground(win) {
    const doc = win.document;
    const bg = doc.getElementById("starryBg");
    if (!bg) return;

    function random(min, max) {
      return Math.random() * (max - min) + min;
    }

    function clearBackground() {
      while (bg.firstChild) bg.removeChild(bg.firstChild);
    }

    function createStars() {
      const area = win.innerWidth * win.innerHeight;
      const starsFraction = area / 4000;

      for (let i = 0; i < starsFraction; i++) {
        const size = Math.random() < 0.5 ? 1 : 2;
        const star = doc.createElement("div");
        star.className = "star";
        star.style.left = `${random(0, 99)}%`;
        star.style.top = `${random(0, 99)}%`;
        star.style.opacity = random(0.5, 1);
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;

        if (Math.random() < 1 / 5) {
          star.style.setProperty(
            "animation",
            `twinkle${Math.floor(Math.random() * 4) + 1} 5s infinite`,
            "important",
          );
        }

        bg.appendChild(star);
      }
    }

    function createShootingStars() {
      for (let i = 0; i < 4; i++) {
        const shootingstar = doc.createElement("span");
        shootingstar.className = "shootingstar";

        if (Math.random() < 0.75) {
          shootingstar.style.top = "-4px";
          shootingstar.style.right = `${random(0, 90)}%`;
        } else {
          shootingstar.style.top = `${random(0, 50)}%`;
          shootingstar.style.right = "-4px";
        }

        const shootingStarGlowColor = "rgba(255,255,255,0.1)";
        shootingstar.style.boxShadow =
          `0 0 0 4px ${shootingStarGlowColor}, ` +
          `0 0 0 8px ${shootingStarGlowColor}, ` +
          `0 0 20px ${shootingStarGlowColor}`;

        shootingstar.style.animationDuration = `${Math.floor(Math.random() * 3) + 3}s`;
        shootingstar.style.animationDelay = `${Math.floor(Math.random() * 7)}s`;

        bg.appendChild(shootingstar);

        shootingstar.addEventListener("animationend", () => {
          if (Math.random() < 0.75) {
            shootingstar.style.top = "-4px";
            shootingstar.style.right = `${random(0, 90)}%`;
          } else {
            shootingstar.style.top = `${random(0, 50)}%`;
            shootingstar.style.right = "-4px";
          }

          shootingstar.style.animation = "none";
          void shootingstar.offsetWidth;
          shootingstar.style.animation = "";
          shootingstar.style.setProperty(
            "animation-duration",
            `${Math.floor(Math.random() * 4) + 3}s`,
            "important",
          );
        });
      }
    }

    function build() {
      clearBackground();
      createStars();
      createShootingStars();
    }

    build();
    win.addEventListener("resize", () => {
      if (pipWindow.innerHeight < 380) {
        pipWindow.resizeTo(pipWindow.innerWidth, 390);
      }
      build();
    });
  }

  function setupPipWindow(win) {
    const doc = win.document;

    function updateUiScale() {
      const widthScale = win.innerWidth / CONFIG.pipWidth;
      const heightScale = win.innerHeight / CONFIG.pipHeight;
      const scale = Math.max(1, Math.min(widthScale, heightScale));
      doc.documentElement.style.setProperty("--ui-scale", scale.toFixed(3));
    }

    // Build the HTML
    doc.write(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Pocket Player</title>
    <style id="themeStyles">
      ${generateStyles(currentTheme)}
    </style>
  </head>
  <body>
    <div class="starrynight-bg-container" id="starryBg"></div>
    <div class="resize-handle" id="resizeHandle"></div>
    <div class="header" id="dragHeader">
      <div>
        Pocket Player
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
          <span class="theme-btn-preview" id="currentThemeEmoji"
            >${THEMES[currentTheme].emoji}</span
          >
          <div class="theme-btn-info">
            <div class="theme-btn-label">Theme</div>
            <div class="theme-btn-name" id="currentThemeName">
              ${THEMES[currentTheme].name}
            </div>
          </div>
          <span class="theme-btn-arrow">›</span>
        </button>
        <div class="menu-divider"></div>

        <div class="menu-section-title">🖥️ Display</div>
        <div class="menu-item" id="toggleCdOverlayItem" role="switch" aria-label="CD overlay">
          <span class="menu-item-label">CD Overlay</span>
          <div class="menu-toggle ${isCdOverlayEnabled ? "on" : ""}" id="toggleCdOverlay" aria-checked="false"></div>
        </div>
      </div>
    </div>

    <!-- Theme Picker Panel -->
    <div class="theme-picker" id="themePicker">
      <div class="theme-picker-header">
        <button class="theme-picker-back" id="themePickerBack">‹</button>
        <span class="theme-picker-title">Choose Theme</span>
      </div>
      <div class="theme-grid" id="themeGrid">${generateThemeMenuItems()}</div>
    </div>

    <div class="main-content">
      <div class="trackInfo">
        <canvas class="album-art" id="cd-canvas" aria-label="Album art"></canvas>
        <div class="track-info">
          <div class="track-title" id="trackTitle">Loading...</div>
          <div class="track-artist" id="trackArtist">-</div>
        </div>
      </div>
      <div class="controls">
        <button class="ctrl-btn" id="shuffleBtn" title="Shuffle">
          <svg viewBox="0 0 16 16" id="shuffleIcon">
            <path
              d="M13.151.922a.75.75 0 1 0-1.06 1.06L13.109 3H11.16a3.75 3.75 0 0 0-2.873 1.34l-6.173 7.356A2.25 2.25 0 0 1 .39 12.5H0V14h.391a3.75 3.75 0 0 0 2.873-1.34l6.173-7.356a2.25 2.25 0 0 1 1.724-.804h1.947l-1.017 1.018a.75.75 0 0 0 1.06 1.06l2.306-2.306a.75.75 0 0 0 0-1.06L13.15.922zM.391 3.5H0V2h.391c1.109 0 2.16.49 2.873 1.34L4.89 5.277l-.979 1.167-1.796-2.14A2.25 2.25 0 0 0 .39 3.5z"
            />
            <path
              d="m7.5 10.723.98-1.167 1.796 2.14a2.25 2.25 0 0 0 1.724.804h1.947l-1.017-1.018a.75.75 0 1 1 1.06-1.06l2.306 2.306a.75.75 0 0 1 0 1.06l-2.306 2.306a.75.75 0 1 1-1.06-1.06L14.109 14H12.16a3.75 3.75 0 0 1-2.873-1.34l-1.787-2.14z"
            />
          </svg>
        </button>
        <button class="ctrl-btn" id="prevBtn" title="Previous">
          <svg viewBox="0 0 16 16">
            <path
              d="M3.3 1a.7.7 0 0 1 .7.7v5.15l9.95-5.744a.7.7 0 0 1 1.05.606v12.575a.7.7 0 0 1-1.05.607L4 9.149V14.3a.7.7 0 0 1-.7.7H1.7a.7.7 0 0 1-.7-.7V1.7a.7.7 0 0 1 .7-.7h1.6z"
            />
          </svg>
        </button>
        <button class="ctrl-btn play-btn" id="playBtn" title="Play/Pause">
          <svg viewBox="0 0 16 16" id="playIcon">
            <path
              d="M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288V1.713z"
            />
          </svg>
        </button>
        <button class="ctrl-btn" id="nextBtn" title="Next">
          <svg viewBox="0 0 16 16">
            <path
              d="M12.7 1a.7.7 0 0 0-.7.7v5.15L2.05 1.107A.7.7 0 0 0 1 1.712v12.575a.7.7 0 0 0 1.05.607L12 9.149V14.3a.7.7 0 0 0 .7.7h1.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7h-1.6z"
            />
          </svg>
        </button>
        <button class="ctrl-btn" id="repeatBtn" title="Repeat">
          <svg viewBox="0 0 16 16" id="repeatIcon">
            <path
              d="M0 4.75A3.75 3.75 0 0 1 3.75 1h8.5A3.75 3.75 0 0 1 16 4.75v5a3.75 3.75 0 0 1-3.75 3.75H9.81l1.018 1.018a.75.75 0 1 1-1.06 1.06L6.939 12.75l2.829-2.828a.75.75 0 1 1 1.06 1.06L9.811 12h2.439a2.25 2.25 0 0 0 2.25-2.25v-5a2.25 2.25 0 0 0-2.25-2.25h-8.5A2.25 2.25 0 0 0 1.5 4.75v5A2.25 2.25 0 0 0 3.75 12H5v1.5H3.75A3.75 3.75 0 0 1 0 9.75z"
            />
          </svg>
        </button>
      </div>
    </div>
  </body>
</html>`);
    doc.close();
    updateUiScale();
    initStarryNightBackground(win);

    // Get elements
    const menuBtn = doc.getElementById("menuBtn");
    const settingsPanel = doc.getElementById("settingsPanel");
    const settingsClose = doc.getElementById("settingsClose");
    const prevBtn = doc.getElementById("prevBtn");
    const playBtn = doc.getElementById("playBtn");
    const nextBtn = doc.getElementById("nextBtn");
    const shuffleBtn = doc.getElementById("shuffleBtn");
    const repeatBtn = doc.getElementById("repeatBtn");
    const themeStyles = doc.getElementById("themeStyles");
    const openThemePickerBtn = doc.getElementById("openThemePicker");
    const currentThemeEmoji = doc.getElementById("currentThemeEmoji");
    const currentThemeName = doc.getElementById("currentThemeName");
    const themePicker = doc.getElementById("themePicker");
    const themePickerBack = doc.getElementById("themePickerBack");
    const themeGrid = doc.getElementById("themeGrid");
    const closeBtn = doc.getElementById("closeBtn");
    const toggleCdOverlayItem = doc.getElementById("toggleCdOverlayItem");
    const toggleCdOverlay = doc.getElementById("toggleCdOverlay");

    function updateCdToggleUi() {
      if (!toggleCdOverlay) return;
      toggleCdOverlay.classList.toggle("on", isCdOverlayEnabled);
      toggleCdOverlay.setAttribute(
        "aria-checked",
        String(isCdOverlayEnabled),
      );
    }

    function refreshCurrentAlbumCanvas() {
      if (!pipWindow || pipWindow.closed) return;

      const activeTrack = Spicetify.Player.data?.item;
      if (!activeTrack) return;

      const canvas = doc.getElementById("cd-canvas");
      if (!canvas) return;

      const imageUrl =
        activeTrack.album?.images?.[2]?.url ||
        activeTrack.metadata?.image_url ||
        "";
      drawAlbumCanvas(canvas, imageUrl, { cdEffect: isCdOverlayEnabled });
    }

    win.addEventListener("resize", updateUiScale);
    updateCdToggleUi();

    // Close miniplayer
    closeBtn.onclick = () => {
      win.close();
    };

    // Settings panel toggle
    menuBtn.onclick = (e) => {
      e.stopPropagation();
      settingsPanel.classList.add("open");
    };

    // Close settings panel
    settingsClose.onclick = () => {
      settingsPanel.classList.remove("open");
    };

    // Open theme picker panel
    openThemePickerBtn.onclick = () => {
      themePicker.classList.add("open");
    };

    // Close theme picker panel (back to settings)
    themePickerBack.onclick = () => {
      themePicker.classList.remove("open");
    };

    // Theme selection
    themeGrid.onclick = (e) => {
      const themeItem = e.target.closest(".theme-item");
      if (themeItem) {
        const newTheme = themeItem.dataset.theme;
        if (newTheme && THEMES[newTheme]) {
          currentTheme = newTheme;
          localStorage.setItem("miniplayer-theme", currentTheme);

          // Update styles
          themeStyles.textContent = generateStyles(currentTheme);

          // Update theme button
          currentThemeEmoji.textContent = THEMES[currentTheme].emoji;
          currentThemeName.textContent = THEMES[currentTheme].name;

          // Update active state
          doc.querySelectorAll(".theme-item").forEach((item) => {
            item.classList.toggle(
              "active",
              item.dataset.theme === currentTheme,
            );
          });

          // Close picker after selection
          themePicker.classList.remove("open");
        }
      }
    };

    // Toggle handlers
    toggleCdOverlayItem.onclick = () => {
      isCdOverlayEnabled = !isCdOverlayEnabled;
      updateCdToggleUi();
      localStorage.setItem("miniplayer-cd-overlay", isCdOverlayEnabled);
      refreshCurrentAlbumCanvas();
    };

    // Control handlers
    prevBtn.onclick = () => Spicetify.Player.back();
    playBtn.onclick = () => Spicetify.Player.togglePlay();
    nextBtn.onclick = () => Spicetify.Player.next();

    const pendingControlSyncTimeouts = new Set();
    function scheduleControlSync(delayMs) {
      const timeoutId = win.setTimeout(() => {
        pendingControlSyncTimeouts.delete(timeoutId);
        syncControlStates();
      }, delayMs);
      pendingControlSyncTimeouts.add(timeoutId);
    }

    function clearPendingControlSyncs() {
      pendingControlSyncTimeouts.forEach((timeoutId) => {
        win.clearTimeout(timeoutId);
      });
      pendingControlSyncTimeouts.clear();
    }

    function queueDelayedControlSyncs() {
      scheduleControlSync(120);
      scheduleControlSync(300);
      scheduleControlSync(550);
    }

    shuffleBtn.onclick = () => {
      Spicetify.Player.toggleShuffle();
      queueDelayedControlSyncs();
    };
    repeatBtn.onclick = () => {
      Spicetify.Player.toggleRepeat();
      queueDelayedControlSyncs();
    };

    // Update shuffle button state
    function updateShuffleState() {
      const isShuffled = Spicetify.Player.getShuffle();
      shuffleBtn.classList.toggle("shuffle-on", isShuffled);
    }

    // Update repeat button state
    function updateRepeatState() {
      const repeatState = Spicetify.Player.getRepeat();
      const iconSvg = {
        0: `<svg viewBox="0 0 16 16" id="repeatIcon" state="${repeatState}"><path d="M0 4.75A3.75 3.75 0 0 1 3.75 1h8.5A3.75 3.75 0 0 1 16 4.75v5a3.75 3.75 0 0 1-3.75 3.75H9.81l1.018 1.018a.75.75 0 1 1-1.06 1.06L6.939 12.75l2.829-2.828a.75.75 0 1 1 1.06 1.06L9.811 12h2.439a2.25 2.25 0 0 0 2.25-2.25v-5a2.25 2.25 0 0 0-2.25-2.25h-8.5A2.25 2.25 0 0 0 1.5 4.75v5A2.25 2.25 0 0 0 3.75 12H5v1.5H3.75A3.75 3.75 0 0 1 0 9.75z"/></svg>`,
        1: `<svg viewBox="0 0 16 16" id="repeatIcon" state="${repeatState}"><path d="M0 4.75A3.75 3.75 0 0 1 3.75 1h8.5A3.75 3.75 0 0 1 16 4.75v5a3.75 3.75 0 0 1-3.75 3.75H9.81l1.018 1.018a.75.75 0 1 1-1.06 1.06L6.939 12.75l2.829-2.828a.75.75 0 1 1 1.06 1.06L9.811 12h2.439a2.25 2.25 0 0 0 2.25-2.25v-5a2.25 2.25 0 0 0-2.25-2.25h-8.5A2.25 2.25 0 0 0 1.5 4.75v5A2.25 2.25 0 0 0 3.75 12H5v1.5H3.75A3.75 3.75 0 0 1 0 9.75z"/></svg>`,
        2: `<svg viewBox="0 0 16 16" id="repeatIcon" state="${repeatState}"><path d="M0 4.75A3.75 3.75 0 0 1 3.75 1h.75v1.5h-.75A2.25 2.25 0 0 0 1.5 4.75v5A2.25 2.25 0 0 0 3.75 12H5v1.5H3.75A3.75 3.75 0 0 1 0 9.75zM12.25 2.5a2.25 2.25 0 0 1 2.25 2.25v5A2.25 2.25 0 0 1 12.25 12H9.81l1.018-1.018a.75.75 0 0 0-1.06-1.06L6.939 12.75l2.829 2.828a.75.75 0 1 0 1.06-1.06L9.811 13.5h2.439A3.75 3.75 0 0 0 16 9.75v-5A3.75 3.75 0 0 0 12.25 1h-.75v1.5z"></path><path d="m8 1.85.77.694H6.095V1.488q1.046-.077 1.507-.385.474-.308.583-.913h1.32V8H8z"></path><path d="M8.77 2.544 8 1.85v.693z"></path></svg>`,
      };
      repeatBtn.innerHTML = iconSvg[repeatState] || iconSvg[0];
      repeatBtn.classList.toggle("repeat-on", repeatState > 0);
      repeatBtn.title =
        repeatState === 2
          ? "Repeat One"
          : repeatState === 1
            ? "Repeat All"
            : "Repeat Off";
    }

    function syncControlStates() {
      updateShuffleState();
      updateRepeatState();
    }

    // Handle window close
    win.addEventListener("pagehide", () => {
      pipWindow = null;
    });

    // First initial load and retry after small delay if fail
    async function initialLoad() {
      const track = Spicetify.Player.data?.item;
      if (track?.uri) currentTrackUri = track.uri;
      else setTimeout(initialLoad, 200);
    }

    const controlSyncIntervalId = win.setInterval(syncControlStates, 500);
    win.addEventListener("beforeunload", () => {
      win.clearInterval(controlSyncIntervalId);
      win.removeEventListener("resize", updateUiScale);
      clearPendingControlSyncs();
    });

    initialLoad();
    updatePipContent();
    syncControlStates();
    startUpdateLoop();
  }

  function updatePipContent() {
    if (!pipWindow || pipWindow.closed) return;
    const doc = pipWindow.document;
    const data = Spicetify.Player.data;

    if (!data?.item) return;

    const track = data.item;

    // Update track info
    const titleEl = doc.getElementById("trackTitle");
    const artistEl = doc.getElementById("trackArtist");
    const albumCanvasEl = doc.getElementById("cd-canvas");
    const albumUri = track.album?.uri;
    const albumId = albumUri?.split(":")[2];
    const albumLink = albumId ? `/album/${albumId}` : null;
    const artists =
      track.artists
        ?.map((artist) => {
          const artistId = artist?.uri?.split(":")[2];
          if (!artistId || !artist?.name) return null;
          return {
            name: artist.name,
            link: `/artist/${artistId}`,
          };
        })
        .filter(Boolean) || [];

    const openSpotifyPath = (path) => {
      if (!path) return;
      Spicetify.Platform.History.push(path);
    };

    if (titleEl) {
      const trackName = track.name || "Unknown";
      titleEl.textContent = "";

      if (albumLink) {
        const albumAnchor = doc.createElement("a");
        albumAnchor.className = "track-link";
        albumAnchor.href = albumLink;
        albumAnchor.textContent = trackName;
        albumAnchor.title = "Open album";
        albumAnchor.addEventListener("click", (e) => {
          e.preventDefault();
          openSpotifyPath(albumLink);
        });
        titleEl.appendChild(albumAnchor);
      } else {
        titleEl.textContent = trackName;
      }
    }

    if (artistEl) {
      artistEl.textContent = "";

      if (artists.length > 0) {
        artists.forEach((artist, index) => {
          if (index > 0) artistEl.appendChild(doc.createTextNode(", "));

          const artistAnchor = doc.createElement("a");
          artistAnchor.className = "artist-link";
          artistAnchor.href = artist.link;
          artistAnchor.textContent = artist.name;
          artistAnchor.title = `Open ${artist.name}`;
          artistAnchor.addEventListener("click", (e) => {
            e.preventDefault();
            openSpotifyPath(artist.link);
          });

          artistEl.appendChild(artistAnchor);
        });
      } else {
        artistEl.textContent = "Unknown";
      }
    }
    if (albumCanvasEl) {
      const imgUrl =
        track.album?.images?.[2]?.url || track.metadata?.image_url || "";
      drawAlbumCanvas(albumCanvasEl, imgUrl, { cdEffect: isCdOverlayEnabled });
    } else {
      logCd("updatePipContent:album-canvas-missing");
    }

    if (track.uri !== currentTrackUri) currentTrackUri = track.uri;
  }

  function updatePipPlayButton() {
    if (!pipWindow || pipWindow.closed) return;

    const playIcon = pipWindow.document.getElementById("playIcon");
    if (!playIcon) return;

    const isPlaying = Spicetify.Player.isPlaying();
    const albumArt = pipWindow.document.getElementById("cd-canvas");
    if (isPlaying) {
      playIcon.innerHTML =
        '<path d="M2.7 1a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7H2.7zm8 0a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7h-2.6z"/>';
      albumArt?.classList.add("running-animation");
    } else {
      playIcon.innerHTML =
        '<path d="M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288V1.713z"/>';
      albumArt?.classList.remove("running-animation");
    }
  }

  function startUpdateLoop() {
    if (updateIntervalId) clearInterval(updateIntervalId);

    updateIntervalId = setInterval(() => {
      if (!pipWindow || pipWindow.closed) {
        clearInterval(updateIntervalId);
        updateIntervalId = null;
        return;
      }

      updatePipPlayButton();
    }, CONFIG.updateInterval);
  }

  // Button Creation
  async function createButton() {
    let container;
    while (!container) {
      container = document.querySelector(
        '.spicetify-sc-scroller[role="list"] > [role="presentation"]',
      );
      if (!container) await new Promise((r) => setTimeout(r, 200));
    }

    const btn = document.createElement("button");
    btn.className =
      "e-10180-legacy-button e-10180-legacy-button-tertiary e-10180-overflow-wrap-anywhere e-10180-button-tertiary--icon-only-medium e-10180-button-tertiary--icon-only e-10180-button-tertiary--text-subdued encore-internal-color-text-subdued link-subtle main-globalNav-navLink main-globalNav-link-icon custom-navlink";
    btn.ariaLabel = "Mini Player";
    btn.setAttribute("data-encore-id", "buttonTertiary");

    const spn = document.createElement("span");
    spn.setAttribute("aria-hidden", "true");
    spn.className = "e-10180-button__icon-wrapper";

    const outerSvg = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg",
    );
    outerSvg.setAttribute("data-encore-id", "icon");
    outerSvg.setAttribute("role", "img");
    outerSvg.setAttribute("aria-hidden", "true");
    outerSvg.setAttribute("class", "e-91000-icon e-91000-baseline");
    outerSvg.setAttribute("viewBox", "0 0 24 24");
    outerSvg.setAttribute("width", "24");
    outerSvg.setAttribute("height", "24");
    outerSvg.setAttribute("fill", "none");
    outerSvg.setAttribute("stroke", "currentColor");
    outerSvg.setAttribute("stroke-width", "2");
    outerSvg.innerHTML = `
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <rect width="9" height="7" x="13" y="13" rx="2" />
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

  // Event Listeners
  Spicetify.Player.addEventListener("songchange", () => {
    updatePipContent();
  });

  Spicetify.Player.addEventListener("onplaypause", () => {
    updatePipPlayButton();
  });

  // INIT
  createButton();
  console.log("[Pocket Player] Ready!");
})();
