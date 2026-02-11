console.log("[YAP EXT] Скрипт загружен", location.href);

function addCopyButton(menu) {
  if (menu.querySelector(".custom-copy-button")) return;

  const newItem = document.createElement("button");
  newItem.className = "vjs-menu-item vjs-control vjs-button custom-copy-button";
  newItem.role = "";
  //set style
  newItem.style.cssText = `cursor: pointer; padding: 4px 8px; margin-left:6px; background: transparent; border: none; color: inherit;`;

  const span = document.createElement("span");
  span.className = "vjs-control vjs-button";
  span.textContent = "Copy";

  newItem.appendChild(span);

  newItem.addEventListener("click", () => {
    // ищем видео внутри текущего контекста (включая iframe)
    const video = menu.querySelector("video") || document.querySelector("video");
    if (video && (video.currentSrc || video.src)) {
      const src = video.currentSrc || video.src;
      fallbackCopyTextToClipboard(src);
    } else {
      alert("Видео не найдено или нет src.");
    }
  });

  const fullscreenControl = menu.querySelector(".vjs-fullscreen-control");
  if (fullscreenControl) {
    menu.insertBefore(newItem, fullscreenControl);
  } else {
    // пытаемся найти конец панели управления или просто добавляем в menu
    const controlBar = menu.querySelector(".vjs-control-bar");
    if (controlBar) controlBar.appendChild(newItem);
    else menu.appendChild(newItem); // На случай, если элемент .vjs-fullscreen-control не найден
  }
}

// function addCopyButton(menu) {
//   if (menu.querySelector(".custom-copy-button")) return;
//
//   const btn = document.createElement("div");
//   btn.textContent = "📋 Copy URL";
//   btn.className = "custom-copy-button";
//   btn.style.cssText = `
//     padding: 5px 10px;
//     cursor: pointer;
//     color: white;
//     background: #444;
//     font-size: 13px;
//     border-top: 1px solid #666;
//   `;
//
//   btn.addEventListener("click", () => {
//     const video = document.querySelector("video");
//     if (video && video.src) {
//       fallbackCopyTextToClipboard(video.src);
//     } else {
//       alert("Видео не найдено или нет src.");
//     }
//   });
//
//   // Добавляем не внутрь .context-menu-list, а рядом
//   menu.appendChild(btn);
// }


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
          // Иногда класс может называться vjs-control-bar, иногда добавляется обёртка с другим именем.
          if (node.matches && node.matches(".vjs-control-bar, .vjs-controls, .vjs-control-bar *")) {
            const menu = node.matches(".vjs-control-bar, .vjs-controls") ? node : node.closest('.vjs-control-bar') || node;
            console.log("[YAP EXT] Меню найдено (observer):", menu);
            addCopyButton(menu);
          }

          // Также на старте, если плеер уже загружен
          const existing = node.querySelector && (node.querySelector('.vjs-control-bar') || node.querySelector('.vjs-controls'));
          if (existing) {
            console.log("[YAP EXT] Меню найдено (existing inside added node):", existing);
            addCopyButton(existing);
          }
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Попробуем найти существующие элементы сразу
  const initial = document.querySelector('.vjs-control-bar, .vjs-controls');
  if (initial) {
    console.log('[YAP EXT] Меню найдено при инициализации:', initial);
    addCopyButton(initial);
  }
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