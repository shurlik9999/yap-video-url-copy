function cleanVideoFilename(filename) {
  const basename = filename.split(/[\\/]/).pop().replace(/(?:www\.)?(?:yapfiles|yap)\.ru/gi, "");
  const extension = basename.match(/\.[a-z\d]{1,10}$/i)?.[0] || ".mp4";
  const stem = basename.endsWith(extension) ? basename.slice(0, -extension.length) : basename;
  const cleanStem = stem.replace(/^[\s._-]+|[\s._-]+$/g, "").replace(/([ _-])\1+/g, "$1");
  return (cleanStem || "video") + extension;
}

chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
  if (item.byExtensionId !== chrome.runtime.id) {
    suggest();
    return;
  }

  suggest({ filename: cleanVideoFilename(item.filename), conflictAction: "uniquify" });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "download-video") return;

  try {
    const url = new URL(message.url);
    const allowedHosts = ["yap.ru", "yapfiles.ru", "yapfiles.com"];
    const allowedHost = allowedHosts.some((host) => url.hostname === host || url.hostname.endsWith("." + host));
    if (!["http:", "https:"].includes(url.protocol) || !allowedHost) {
      throw new Error("Скачивание доступно только по ссылкам ЯП и YapFiles.");
    }

    chrome.downloads.download({ url: message.url, conflictAction: "uniquify" }, (downloadId) => {
      const error = chrome.runtime.lastError;
      if (error || typeof downloadId !== "number") {
        sendResponse({ ok: false, error: error?.message || "Не удалось начать скачивание." });
      } else {
        sendResponse({ ok: true });
      }
    });
  } catch (error) {
    sendResponse({ ok: false, error: error.message });
  }

  return true;
});
