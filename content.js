console.log("[YAP EXT] Скрипт загружен", location.href);

function addCopyButton(menu) {
  if (menu.querySelector(".vjs-control-bar")) return;

  const newItem = document.createElement("button");
  newItem.className = "vjs-menu-item vjs-control vjs-button custom-copy-button";
  newItem.role = "";
  //set style
  newItem.style.cssText = `cursor: pointer;`;

  const span = document.createElement("span");
  span.className = "vjs-control vjs-button";
  span.textContent = "Copy";

  newItem.appendChild(span);

  newItem.addEventListener("click", () => {
    const video = document.querySelector("video");
    if (video && video.src) {
      fallbackCopyTextToClipboard(video.src);
    } else {
      alert("Видео не найдено или нет src.");
    }
  });

  const fullscreenControl = menu.querySelector(".vjs-fullscreen-control");
  if (fullscreenControl) {
    menu.insertBefore(newItem, fullscreenControl);
  } else {
    menu.appendChild(newItem); // На случай, если элемент .vjs-fullscreen-control не найден
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
        if (node.nodeType === 1 && node.matches(".vjs-control-bar")) {
          console.log("[YAP EXT] Меню найдено:", node);
          addCopyButton(node);
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
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