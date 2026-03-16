(async function Miniplayer() {
  while (
    !Spicetify?.Player?.data ||
    !Spicetify?.Platform ||
    !Spicetify?.CosmosAsync ||
    !Spicetify?.Tippy ||
    !Spicetify?.TippyProps
  ) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // your code here
  console.log("Popout miniplayer is loaded");

//   async function openMiniplayer() {
//     const win = window.open(
//       "about:blank",
//       "NowPlaying",
//       "width=300,height=150,left=100,top=100,resizable=yes,toolbar=no,menubar=no",
//     );

//     const doc = win.document;
//     doc.write(`
// <!doctype html>
// <html lang="en">
//   <head>
//     <meta charset="UTF-8" />
//     <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//     <title>MiniPlayer</title>
//   </head>
//   <body>
//     <h1 id="track">LESGOOOOOOOOOOOO</h1>
//     <script>
//       const queue = Spicetify.Queue;
//       console.log(Spicetify.Queue);
//       const currentTrack = queue.track;
//       let element = document.getElementById('track');
//       element.textContent(currentTrack);
//       console.log(currentTrack);
//     </script>
//   </body>
// </html>
// `);
//     doc.close();
//   }

  let pipWindow = null;

  const CONFIG = {
    pipWidth: 350,
    pipHeight: 500,
    updateInterval: 100,
    defaultFontSize: 14,
    maxFontSize: 28,
    minFontSize: 10,
  };
  async function openPictureInPicture() {
    // Close existing PiP window if open
    if (pipWindow && !pipWindow.closed) {
      pipWindow.close();
      pipWindow = null;
      return;
    }

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
          "[Lyric Miniplayer] Document PiP failed, trying fallback:",
          err,
        );
      }
    }
  }

  function setupPipWindow(win) {
    const doc = win.document;
    doc.write(`
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MiniPlayer</title>
  </head>
  <body>
    <h1 id="track">LESGOOOOOOOOOOOO</h1>
    <script>
      const queue = Spicetify.Queue;
      console.log(Spicetify.Queue);
      const currentTrack = queue.track;
      let element = document.getElementById('track');
      element.textContent(currentTrack);
      console.log(currentTrack);
    </script>
  </body>
</html>
`);
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
