(() => {
  const EXTENSION_ID = "mistax-view-source";
  const existing = document.getElementById(EXTENSION_ID);

  if (existing) {
    existing.remove();
  }

  const style = api.addStyle(`
    #${EXTENSION_ID} {
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      background: #090d16;
      color: #e5e7eb;
      font-family: system-ui, sans-serif;
      display: flex;
      flex-direction: column;
      font-size: 14px;
    }

    #${EXTENSION_ID} * {
      box-sizing: border-box;
    }

    #${EXTENSION_ID} .vs-header {
      min-height: 58px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      background: #111827;
      border-bottom: 1px solid #263244;
    }

    #${EXTENSION_ID} .vs-title {
      font-size: 17px;
      font-weight: 700;
      color: #fff;
    }

    #${EXTENSION_ID} button {
      border: 1px solid #344155;
      background: #1b2638;
      color: #e5e7eb;
      padding: 9px 12px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 12px;
    }

    #${EXTENSION_ID} button:active {
      transform: scale(.96);
    }

    #${EXTENSION_ID} .vs-close {
      font-size: 20px;
      padding: 4px 12px;
    }

    #${EXTENSION_ID} .vs-tabs {
      display: flex;
      gap: 8px;
      padding: 12px;
      background: #111827;
      border-bottom: 1px solid #263244;
    }

    #${EXTENSION_ID} .vs-tab.active {
      background: #2563eb;
      border-color: #3b82f6;
      color: white;
    }

    #${EXTENSION_ID} .vs-toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 7px;
      padding: 10px;
      background: #0f172a;
      border-bottom: 1px solid #263244;
    }

    #${EXTENSION_ID} input {
      flex: 1;
      min-width: 120px;
      background: #080d17;
      color: white;
      border: 1px solid #344155;
      border-radius: 8px;
      padding: 9px 11px;
      outline: none;
    }

    #${EXTENSION_ID} input:focus {
      border-color: #3b82f6;
    }

    #${EXTENSION_ID} .vs-info {
      padding: 8px 12px;
      color: #94a3b8;
      font-size: 11px;
      background: #0b1220;
      border-bottom: 1px solid #263244;
      overflow-wrap: anywhere;
    }

    #${EXTENSION_ID} .vs-code {
      flex: 1;
      overflow: auto;
      background: #080d17;
      padding: 12px 0;
      font-family: Consolas, Monaco, monospace;
      font-size: 12px;
      line-height: 1.7;
      tab-size: 2;
    }

    #${EXTENSION_ID} .vs-line {
      display: flex;
      min-width: max-content;
      padding-right: 18px;
    }

    #${EXTENSION_ID} .vs-number {
      width: 48px;
      flex-shrink: 0;
      text-align: right;
      padding-right: 13px;
      color: #64748b;
      user-select: none;
      border-right: 1px solid #1e293b;
      margin-right: 14px;
    }

    #${EXTENSION_ID} .vs-content {
      white-space: pre;
      color: #cbd5e1;
    }

    #${EXTENSION_ID} .vs-tag {
      color: #60a5fa;
    }

    #${EXTENSION_ID} .vs-attr {
      color: #c084fc;
    }

    #${EXTENSION_ID} .vs-value {
      color: #86efac;
    }

    #${EXTENSION_ID} .vs-comment {
      color: #64748b;
    }

    #${EXTENSION_ID} .vs-doctype {
      color: #fbbf24;
    }

    #${EXTENSION_ID} .vs-error {
      padding: 20px;
      color: #fca5a5;
      white-space: pre-wrap;
    }

    #${EXTENSION_ID} .vs-status {
      padding: 9px 12px;
      background: #111827;
      border-top: 1px solid #263244;
      color: #94a3b8;
      font-size: 11px;
    }

    @media(max-width:480px) {
      #${EXTENSION_ID} .vs-toolbar button {
        padding: 8px;
      }

      #${EXTENSION_ID} .vs-code {
        font-size: 11px;
      }
    }
  `);

  const root = document.createElement("div");
  root.id = EXTENSION_ID;

  root.innerHTML = `
    <div class="vs-header">
      <div class="vs-title">⌘ View Source</div>
      <button class="vs-close">×</button>
    </div>

    <div class="vs-tabs">
      <button class="vs-tab active" data-type="source">Page Source</button>
      <button class="vs-tab" data-type="dom">Live DOM</button>
    </div>

    <div class="vs-toolbar">
      <input class="vs-search" placeholder="Search in source...">
      <button class="vs-refresh">Refresh</button>
      <button class="vs-format">Pretty</button>
      <button class="vs-copy">Copy</button>
      <button class="vs-download">Download</button>
    </div>

    <div class="vs-info">Loading page source...</div>
    <div class="vs-code"></div>
    <div class="vs-status">MistaX View Source</div>
  `;

  api.addElement(root);

  const $ = selector => root.querySelector(selector);

  let currentType = "source";
  let sourceCode = "";
  let liveCode = "";
  let displayedCode = "";
  let formatted = false;

  const codeBox = $(".vs-code");
  const info = $(".vs-info");
  const status = $(".vs-status");

  function escapeHTML(value) {
    return value.replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function highlightHTML(code) {
    const tokens = code.match(
      /<!--[\s\S]*?-->|<!DOCTYPE[^>]*>|<\/?[a-zA-Z][^>]*>|[^<]+|</gi
    ) || [];

    return tokens.map(token => {
      if (token.startsWith("<!--")) {
        return `<span class="vs-comment">${escapeHTML(token)}</span>`;
      }

      if (/^<!DOCTYPE/i.test(token)) {
        return `<span class="vs-doctype">${escapeHTML(token)}</span>`;
      }

      if (/^<\/?[a-zA-Z]/.test(token)) {
        const safe = escapeHTML(token);

        return safe.replace(
          /(&lt;\/?)([a-zA-Z][\w:-]*)|([\w:-]+)(=)(&quot;.*?&quot;|'[^']*'|[^\s>]+)/g,
          (match, open, tag, attr, equal, value) => {
            if (tag) {
              return `${open}<span class="vs-tag">${tag}</span>`;
            }

            if (attr) {
              return `<span class="vs-attr">${attr}</span>${equal}<span class="vs-value">${value}</span>`;
            }

            return match;
          }
        );
      }

      return escapeHTML(token);
    }).join("");
  }

  function formatHTML(html) {
    return html
      .replace(/>\s*</g, ">\n<")
      .replace(/(<\/(?:div|section|article|main|header|footer|nav|body|html|ul|ol|li|table|tr|form)>)/gi, "$1\n")
      .replace(/(<(?:html|head|body|div|section|article|main|header|footer|nav|ul|ol|li|table|tr|form)\b[^>]*>)/gi, "$1\n")
      .split("\n")
      .map(line => line.trim())
      .filter(Boolean)
      .join("\n");
  }

  function render(code) {
    displayedCode = code;
    const lines = code.split("\n");

    const fragment = document.createDocumentFragment();

    lines.forEach((line, index) => {
      const row = document.createElement("div");
      row.className = "vs-line";

      const number = document.createElement("span");
      number.className = "vs-number";
      number.textContent = index + 1;

      const content = document.createElement("span");
      content.className = "vs-content";
      content.innerHTML = highlightHTML(line);

      row.append(number, content);
      fragment.appendChild(row);
    });

    codeBox.replaceChildren(fragment);

    status.textContent =
      `${lines.length.toLocaleString()} lines · ${code.length.toLocaleString()} characters`;
  }

  function getCurrentCode() {
    return currentType === "source" ? sourceCode : liveCode;
  }

  function refreshLiveDOM() {
    liveCode = document.documentElement.outerHTML;
  }

  async function loadSource() {
    info.textContent = "Fetching original page source...";
    status.textContent = "Please wait...";

    try {
      const url = new URL(location.href);

      if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error("Source fetching is supported only on HTTP/HTTPS pages.");
      }

      const response = await fetch(url.href, {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        redirect: "follow"
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("html") && !contentType.includes("xml")) {
        throw new Error("The server did not return an HTML/XML document.");
      }

      sourceCode = await response.text();

      refreshLiveDOM();

      info.textContent =
        `Original source · ${response.status} · ${response.url}`;

      if (currentType === "source") {
        render(sourceCode);
      }

      api.toast("Page source loaded");
    } catch (error) {
      sourceCode = "";

      info.textContent = "Unable to fetch original source";

      codeBox.innerHTML = `
        <div class="vs-error">
          ${escapeHTML(error.message)}

          This website may restrict fetching its page source.
          You can still use the Live DOM tab.
        </div>
      `;

      status.textContent = "Source loading failed";
    }
  }

  function switchTab(type) {
    currentType = type;

    root.querySelectorAll(".vs-tab").forEach(tab => {
      tab.classList.toggle("active", tab.dataset.type === type);
    });

    if (type === "dom") {
      refreshLiveDOM();
      info.textContent = "Live DOM · Current browser document";
    } else {
      info.textContent = "Original page source";
    }

    formatted = false;
    render(getCurrentCode());
  }

  $(".vs-close").onclick = () => {
    root.remove();
  };

  root.querySelectorAll(".vs-tab").forEach(tab => {
    tab.onclick = () => switchTab(tab.dataset.type);
  });

  $(".vs-refresh").onclick = () => {
    if (currentType === "source") {
      loadSource();
    } else {
      refreshLiveDOM();
      render(liveCode);
      api.toast("Live DOM refreshed");
    }
  };

  $(".vs-format").onclick = () => {
    const code = getCurrentCode();

    if (!code) {
      api.toast("No source available");
      return;
    }

    formatted = !formatted;

    $(".vs-format").textContent = formatted ? "Original" : "Pretty";

    render(formatted ? formatHTML(code) : code);
  };

  $(".vs-copy").onclick = async () => {
    try {
      if (!displayedCode) {
        throw new Error("No source available");
      }

      await navigator.clipboard.writeText(displayedCode);
      api.toast("Source copied");
    } catch (error) {
      api.toast("Copy failed: " + error.message);
    }
  };

  $(".vs-download").onclick = () => {
    if (!displayedCode) {
      api.toast("No source available");
      return;
    }

    const blob = new Blob([displayedCode], {
      type: "text/html;charset=utf-8"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = currentType === "source"
      ? "page-source.html"
      : "live-dom.html";

    link.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
    api.toast("HTML downloaded");
  };

  $(".vs-search").addEventListener("input", event => {
    const query = event.target.value.toLowerCase();

    root.querySelectorAll(".vs-line").forEach(row => {
      const matches = row.textContent.toLowerCase().includes(query);
      row.style.display = !query || matches ? "flex" : "none";
    });
  });

  loadSource();

  api.onCleanup(() => {
    root.remove();
    if (style && typeof style.remove === "function") {
      style.remove();
    }
  });
})();