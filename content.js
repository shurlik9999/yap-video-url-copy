console.log("[YAP EXT] Скрипт загружен", location.href);

function getVideoSource(menu) {
  const player = menu.closest(".video-js") || menu.parentElement;
  const videos = document.querySelectorAll("video");
  const video = player?.querySelector("video") || (videos.length === 1 ? videos[0] : null);
  return video && (video.currentSrc || video.src || video.querySelector("source[src]")?.src);
}

function createPlayerButton(className, label, title) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `vjs-menu-item vjs-control vjs-button ${className}`;
  button.textContent = label;
  button.title = title;
  button.setAttribute("aria-label", title);
  button.style.cssText = "cursor: pointer; padding: 4px 8px; margin-left: 6px; width: auto; flex: 0 0 auto; background: transparent; border: none; color: inherit;";
  return button;
}

async function downloadVideo(menu, button) {
  button.disabled = true;
  try {
    const src = getVideoSource(menu);
    if (!src) {
      throw new Error("Запустите видео и попробуйте ещё раз.");
    }
    if (!/^https?:\/\//i.test(src)) {
      throw new Error("Для этого видео нет прямой ссылки для скачивания.");
    }

    const response = await chrome.runtime.sendMessage({ type: "download-video", url: src });
    if (!response?.ok) {
      throw new Error(response?.error || "Не удалось начать скачивание.");
    }
  } catch (error) {
    console.error("[YAP EXT] Ошибка скачивания:", error);
    alert("Не удалось скачать видео. " + error.message);
  } finally {
    button.disabled = false;
  }
}

function addVideoButtons(menu) {
  const controls = menu.querySelector(".vjs-control-bar") || menu;
  let copyButton = controls.querySelector(".custom-copy-button");
  if (!copyButton) {
    copyButton = createPlayerButton("custom-copy-button", "Copy", "Копировать ссылку на видео");
    copyButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const src = getVideoSource(controls);
      if (src) fallbackCopyTextToClipboard(src);
      else alert("Видео не найдено или нет src.");
    });

    const fullscreenControl = controls.querySelector(".vjs-fullscreen-control");
    if (fullscreenControl) fullscreenControl.before(copyButton);
    else controls.appendChild(copyButton);
  }

  if (!controls.querySelector(".custom-download-button")) {
    const downloadButton = createPlayerButton("custom-download-button", "Скачать", "Скачать видео");
    downloadButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      downloadVideo(controls, downloadButton);
    });
    copyButton.after(downloadButton);
  }
}

function fallbackCopyTextToClipboard(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    const successful = document.execCommand("copy");
    console.log("[YAP EXT] Скопировано через execCommand:", successful);
    // alert("Скопировано: " + text);
  } catch (err) {
    console.error("[YAP EXT] Ошибка fallback-копирования:", err);
    alert("Не удалось скопировать.");
  }
  document.body.removeChild(textarea);
}

function watchForContextMenu() {
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType === 1) {
          if (node.matches(".vjs-control-bar, .vjs-controls")) {
            addVideoButtons(node);
          }

          node.querySelectorAll(".vjs-control-bar, .vjs-controls").forEach(addVideoButtons);
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Попробуем найти существующие элементы сразу
  document.querySelectorAll(".vjs-control-bar, .vjs-controls").forEach(addVideoButtons);
}

function waitForBodyAndRun() {
  if (document.body) {
    console.log("[YAP EXT] body найден, запускаем наблюдение за меню");
    watchForContextMenu();
  } else {
    requestAnimationFrame(waitForBodyAndRun);
  }
}

waitForBodyAndRun();
