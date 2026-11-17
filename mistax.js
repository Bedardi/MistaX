(() => {
"use strict";

/* =========================================
   MISTAX V3 - PREMIUM FLOATING STORE
========================================= */

const APP_ID = "mistax-floating-v3";
const DB_NAME = "MistaXStore";
const DB_VERSION = 1;

const OLD = document.getElementById(APP_ID);
if (OLD) OLD.remove();

/* =========================================
   DATABASE
========================================= */

let db;

function openDB() {
    return new Promise((resolve, reject) => {
        const r = indexedDB.open(DB_NAME, DB_VERSION);

        r.onupgradeneeded = () => {
            if (!r.result.objectStoreNames.contains("extensions")) {
                r.result.createObjectStore("extensions", {
                    keyPath: "id"
                });
            }
        };

        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
    });
}

function dbRequest(request) {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function getAll() {
    return dbRequest(
        db.transaction("extensions")
        .objectStore("extensions")
        .getAll()
    );
}

function getItem(id) {
    return dbRequest(
        db.transaction("extensions")
        .objectStore("extensions")
        .get(id)
    );
}

function saveItem(item) {
    return dbRequest(
        db.transaction("extensions", "readwrite")
        .objectStore("extensions")
        .put(item)
    );
}

function deleteItem(id) {
    return dbRequest(
        db.transaction("extensions", "readwrite")
        .objectStore("extensions")
        .delete(id)
    );
}

/* =========================================
   LOCAL POSITION STORAGE
========================================= */

const POSITION_KEY = "mistax_v3_bubble_position";

function loadPosition() {
    try {
        return JSON.parse(localStorage.getItem(POSITION_KEY)) || null;
    } catch {
        return null;
    }
}

function savePosition(x, y) {
    localStorage.setItem(
        POSITION_KEY,
        JSON.stringify({ x, y })
    );
}

/* =========================================
   HOST
========================================= */

const host = document.createElement("div");

host.id = APP_ID;

host.style.cssText = `
    position:fixed;
    inset:0;
    z-index:2147483647;
    pointer-events:none;
`;

const shadow = host.attachShadow({ mode: "open" });

shadow.innerHTML = `

<style>

* {
    box-sizing:border-box;
}

button,input,textarea {
    font:inherit;
}

.hidden {
    display:none !important;
}

/* FLOATING BUBBLE */

#bubble {
    position:fixed;
    width:58px;
    height:58px;

    border:2px solid #ffffff30;
    border-radius:20px;

    background:linear-gradient(145deg,#7665ff,#4266ed);

    color:white;
    font-size:25px;

    display:flex;
    align-items:center;
    justify-content:center;

    box-shadow:0 8px 30px #465fff70;

    cursor:grab;
    user-select:none;
    -webkit-user-select:none;

    touch-action:none;
    pointer-events:auto;

    transition:box-shadow .2s;
}

#bubble:active {
    cursor:grabbing;
    box-shadow:0 5px 18px #465fff90;
}

/* MAIN PANEL */

#panel {
    position:fixed;

    width:min(390px,calc(100vw - 22px));
    height:min(650px,calc(100dvh - 35px));

    display:flex;
    flex-direction:column;

    background:#101525;

    border:1px solid #394663;
    border-radius:22px;

    overflow:hidden;

    color:#f5f7ff;

    box-shadow:0 20px 70px #000b;

    pointer-events:auto;

    font-family:system-ui,-apple-system,sans-serif;
}

/* HEADER */

.header {
    padding:17px;

    background:
        radial-gradient(circle at 90% 0%,#5268ff55,transparent 45%),
        linear-gradient(130deg,#202c4b,#182139);

    border-bottom:1px solid #ffffff12;

    display:flex;
    align-items:center;
    justify-content:space-between;

    touch-action:none;
    user-select:none;
    -webkit-user-select:none;

    cursor:grab;
}

.brand {
    display:flex;
    align-items:center;
    gap:11px;
}

.logo {
    width:42px;
    height:42px;

    display:flex;
    align-items:center;
    justify-content:center;

    border-radius:14px;

    background:linear-gradient(145deg,#8876ff,#4668ff);

    font-size:23px;

    box-shadow:0 5px 18px #5065ff55;
}

.brand-name {
    font-size:18px;
    font-weight:800;
    letter-spacing:.3px;
}

.brand-sub {
    color:#9ba9c7;
    font-size:10px;
    margin-top:3px;
}

.header-actions {
    display:flex;
    gap:6px;
}

.icon-btn {
    width:35px;
    height:35px;

    border:0;
    border-radius:10px;

    background:#ffffff13;
    color:white;

    font-size:19px;
}

/* CONTENT */

.content {
    flex:1;
    min-height:0;
    overflow-y:auto;
    padding:14px;

    overscroll-behavior:contain;
    scrollbar-width:thin;
    scrollbar-color:#44547a transparent;
}

.hero {
    padding:17px;
    border-radius:16px;

    background:
        radial-gradient(circle at 100% 0%,#586aff44,transparent 45%),
        linear-gradient(135deg,#28395c,#1d2942);

    margin-bottom:14px;

    border:1px solid #ffffff12;
}

.hero-title {
    font-size:17px;
    font-weight:750;
}

.hero-description {
    color:#a9b7d1;
    font-size:11px;
    line-height:1.6;
    margin-top:5px;
}

.stats {
    display:flex;
    gap:9px;
    margin-top:15px;
}

.stat {
    flex:1;
    padding:10px;
    background:#ffffff0c;
    border-radius:11px;
}

.stat strong {
    display:block;
    font-size:19px;
}

.stat span {
    color:#aab6d0;
    font-size:10px;
}

/* CARDS */

.card {
    background:#1b263c;

    border:1px solid #ffffff0c;

    border-radius:15px;

    padding:14px;

    margin-bottom:13px;
}

.card-heading {
    display:flex;
    justify-content:space-between;
    align-items:center;

    margin-bottom:12px;
}

.card-heading h3 {
    font-size:14px;
    margin:0;
    font-weight:750;
}

.badge {
    background:#3c4c77;
    color:#c6d1ff;

    border-radius:20px;

    padding:5px 9px;

    font-size:10px;
}

/* INPUTS */

.input {
    display:block;
    width:100%;

    padding:12px;

    margin-bottom:9px;

    border:1px solid #394760;
    border-radius:10px;

    outline:none;

    background:#111a2b;
    color:white;

    font-size:13px;
}

.input:focus {
    border-color:#7180ff;
    box-shadow:0 0 0 2px #7180ff22;
}

textarea.input {
    height:130px;
    resize:vertical;
    font-family:monospace;
    line-height:1.6;
}

.input::placeholder {
    color:#7887a3;
}

/* BUTTONS */

.btn {
    padding:10px 13px;

    border:0;
    border-radius:10px;

    background:linear-gradient(135deg,#6e6bff,#4269ec);

    color:white;

    font-size:11px;
    font-weight:750;

    cursor:pointer;
}

.btn-secondary {
    background:#34425e;
}

.btn-danger {
    background:#9d354c;
}

.btn-full {
    width:100%;
}

.btn:active {
    transform:scale(.97);
}

/* SEARCH */

.search-wrap {
    position:relative;
    margin-bottom:12px;
}

.search-wrap input {
    padding-left:36px;
}

.search-icon {
    position:absolute;
    left:12px;
    top:12px;
    color:#91a0bd;
}

/* EXTENSION ITEMS */

.extension {
    padding:13px;

    background:#222f48;

    border:1px solid #ffffff0d;

    border-radius:13px;

    margin-bottom:10px;
}

.extension-top {
    display:flex;
    justify-content:space-between;
    align-items:center;
    gap:10px;
}

.extension-name {
    font-size:13px;
    font-weight:750;
    overflow-wrap:anywhere;
}

.extension-description {
    font-size:11px;
    color:#a7b4ce;
    margin-top:6px;
    line-height:1.5;
}

.status {
    padding:5px 8px;
    border-radius:20px;

    font-size:9px;
    font-weight:800;

    background:#174c3b;
    color:#79e3ae;
    white-space:nowrap;
}

.status.off {
    background:#38445c;
    color:#b5c0d7;
}

.extension-actions {
    display:flex;
    flex-wrap:wrap;
    gap:5px;
    margin-top:12px;
}

.extension-actions button {
    flex:1;
    min-width:55px;
}

/* EMPTY */

.empty {
    padding:25px 10px;
    text-align:center;
    color:#8d9bb6;
    font-size:12px;
}

.empty-icon {
    font-size:30px;
    margin-bottom:8px;
}

/* FOOTER */

.footer {
    padding:11px;

    border-top:1px solid #ffffff12;

    text-align:center;

    font-size:10px;
    color:#8492ad;

    background:#151e31;
}

/* TOAST */

#toast {
    position:fixed;

    bottom:25px;
    left:50%;

    transform:translateX(-50%);

    background:#303f60;
    color:white;

    padding:11px 16px;

    border-radius:10px;

    font-size:12px;

    display:none;

    box-shadow:0 5px 20px #0008;
}

/* POSITION MENU */

#position-menu {
    background:#263653;
    border-radius:12px;
    padding:12px;
    margin-bottom:12px;
}

.position-grid {
    display:grid;
    grid-template-columns:repeat(3,1fr);
    gap:7px;
    margin-top:10px;
}

.position-grid button {
    padding:9px 4px;
    font-size:10px;
}

</style>


<!-- BUBBLE -->

<button id="bubble" aria-label="Open MistaX">
    ✦
</button>


<!-- PANEL -->

<div id="panel" class="hidden">

    <div class="header" id="drag-handle">

        <div class="brand">

            <div class="logo">✦</div>

            <div>
                <div class="brand-name">MistaX Store</div>
                <div class="brand-sub">YOUR MOBILE EXTENSION HUB</div>
            </div>

        </div>

        <div class="header-actions">

            <button class="icon-btn" id="position-toggle" title="Bubble position">
                ⌖
            </button>

            <button class="icon-btn" id="minimize" title="Minimize">
                −
            </button>

            <button class="icon-btn" id="close" title="Close">
                ×
            </button>

        </div>

    </div>


    <div class="content" id="content">

        <div class="hero">

            <div class="hero-title">
                Welcome to MistaX
            </div>

            <div class="hero-description">
                Manage your JavaScript extensions locally.
                Your installed extensions stay in IndexedDB.
            </div>

            <div class="stats">

                <div class="stat">
                    <strong id="total-count">0</strong>
                    <span>Extensions</span>
                </div>

                <div class="stat">
                    <strong id="active-count">0</strong>
                    <span>Enabled</span>
                </div>

                <div class="stat">
                    <strong id="disabled-count">0</strong>
                    <span>Disabled</span>
                </div>

            </div>

        </div>


        <!-- POSITION SETTINGS -->

        <div id="position-menu" class="hidden">

            <div style="font-weight:750;font-size:13px">
                Bubble Position
            </div>

            <div class="hero-description">
                Choose a starting corner or drag the bubble anywhere.
            </div>

            <div class="position-grid">

                <button class="btn btn-secondary" data-position="top-left">
                    ↖ Top Left
                </button>

                <button class="btn btn-secondary" data-position="top-right">
                    ↗ Top Right
                </button>

                <button class="btn btn-secondary" data-position="bottom-left">
                    ↙ Bottom Left
                </button>

                <button class="btn btn-secondary" data-position="bottom-right">
                    ↘ Bottom Right
                </button>

                <button class="btn btn-secondary" id="reset-position">
                    Reset
                </button>

            </div>

        </div>


        <!-- ADD EXTENSION -->

        <div class="card">

            <div class="card-heading">

                <h3 id="form-title">＋ Add Extension</h3>

                <span class="badge">EDITOR</span>

            </div>

            <input
                class="input"
                id="extension-name"
                placeholder="Extension name"
                maxlength="80"
            >

            <input
                class="input"
                id="extension-description"
                placeholder="Short description"
                maxlength="180"
            >

            <textarea
                class="input"
                id="extension-code"
                placeholder="api.toast('Hello MistaX!')"
                spellcheck="false"
            ></textarea>

            <div style="font-size:10px;color:#91a0bc;line-height:1.5;margin-bottom:10px">
                JavaScript runs on the current webpage.
                Only install code you trust.
            </div>

            <button class="btn" id="save-extension">
                Save Extension
            </button>

            <button class="btn btn-secondary" id="clear-form">
                Clear
            </button>

        </div>


        <!-- INSTALLED -->

        <div class="card">

            <div class="card-heading">

                <h3>Installed Extensions</h3>

                <span class="badge" id="list-count">0 ITEMS</span>

            </div>

            <div class="search-wrap">

                <span class="search-icon">⌕</span>

                <input
                    class="input"
                    id="search"
                    placeholder="Search extensions..."
                    style="margin:0"
                >

            </div>

            <div id="extension-list">

                <div class="empty">
                    <div class="empty-icon">✦</div>
                    No extensions installed.
                </div>

            </div>

        </div>


        <!-- BACKUP -->

        <div class="card">

            <div class="card-heading">
                <h3>Data Management</h3>
                <span class="badge">LOCAL</span>
            </div>

            <div style="font-size:11px;color:#a5b3cb;margin-bottom:12px">
                Export your extensions or restore a previous backup.
            </div>

            <button class="btn" id="export">
                ↓ Export Backup
            </button>

            <button class="btn btn-secondary" id="import">
                ↑ Import Backup
            </button>

            <input
                type="file"
                id="import-file"
                accept=".json,application/json"
                hidden
            >

        </div>

    </div>


    <div class="footer">
        MistaX V3 · IndexedDB · Local Storage
    </div>

</div>


<div id="toast"></div>

`;

document.documentElement.appendChild(host);


/* =========================================
   ELEMENTS
========================================= */

const $ = id => shadow.getElementById(id);

const bubble = $("bubble");
const panel = $("panel");
const header = $("drag-handle");

let editingId = null;

const cleanups = new Map();


/* =========================================
   TOAST
========================================= */

let toastTimer;

function toast(message) {

    const el = $("toast");

    el.textContent = message;
    el.style.display = "block";

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        el.style.display = "none";
    }, 2300);

}


/* =========================================
   ESCAPE HTML
========================================= */

function escapeHTML(value) {

    return String(value ?? "").replace(
        /[&<>"']/g,
        c => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[c]
    );

}


/* =========================================
   BUBBLE POSITION
========================================= */

function clampPosition(x, y, element) {

    const rect = element.getBoundingClientRect();

    return {
        x: Math.max(
            0,
            Math.min(window.innerWidth - rect.width, x)
        ),

        y: Math.max(
            0,
            Math.min(window.innerHeight - rect.height, y)
        )
    };

}

function applyBubblePosition(x, y, persist = true) {

    const pos = clampPosition(x, y, bubble);

    bubble.style.left = pos.x + "px";
    bubble.style.top = pos.y + "px";

    bubble.style.right = "auto";
    bubble.style.bottom = "auto";

    if (persist) {
        savePosition(pos.x, pos.y);
    }

}

function setCorner(corner) {

    const margin = 18;

    const width = bubble.offsetWidth;
    const height = bubble.offsetHeight;

    let x = margin;
    let y = margin;

    if (corner.includes("right")) {
        x = window.innerWidth - width - margin;
    }

    if (corner.includes("bottom")) {
        y = window.innerHeight - height - margin;
    }

    applyBubblePosition(x, y);

    $("position-menu").classList.add("hidden");

    toast("Bubble position updated");

}

function initializeBubblePosition() {

    const saved = loadPosition();

    if (
        saved &&
        Number.isFinite(saved.x) &&
        Number.isFinite(saved.y)
    ) {

        applyBubblePosition(saved.x, saved.y, false);

    } else {

        setCorner("bottom-right");

    }

}

window.addEventListener("resize", () => {

    const rect = bubble.getBoundingClientRect();

    applyBubblePosition(rect.left, rect.top);

});


/* =========================================
   BUBBLE DRAGGING
========================================= */

let bubbleDragging = false;
let bubbleMoved = false;

let bubbleStartX = 0;
let bubbleStartY = 0;

let bubbleOriginX = 0;
let bubbleOriginY = 0;

bubble.addEventListener("pointerdown", event => {

    if (event.button !== 0 && event.pointerType === "mouse") {
        return;
    }

    bubbleDragging = true;
    bubbleMoved = false;

    const rect = bubble.getBoundingClientRect();

    bubbleStartX = event.clientX;
    bubbleStartY = event.clientY;

    bubbleOriginX = rect.left;
    bubbleOriginY = rect.top;

    bubble.setPointerCapture(event.pointerId);

});

bubble.addEventListener("pointermove", event => {

    if (!bubbleDragging) return;

    const dx = event.clientX - bubbleStartX;
    const dy = event.clientY - bubbleStartY;

    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        bubbleMoved = true;
    }

    if (!bubbleMoved) return;

    applyBubblePosition(
        bubbleOriginX + dx,
        bubbleOriginY + dy
    );

});

bubble.addEventListener("pointerup", () => {

    if (!bubbleDragging) return;

    bubbleDragging = false;

    if (!bubbleMoved) {
        openPanel();
    } else {
        toast("Bubble position saved");
    }

});

bubble.addEventListener("pointercancel", () => {
    bubbleDragging = false;
});


/* =========================================
   PANEL OPEN / CLOSE
========================================= */

function openPanel() {

    panel.classList.remove("hidden");
    bubble.classList.add("hidden");

}

function minimizePanel() {

    panel.classList.add("hidden");
    bubble.classList.remove("hidden");

}

$("minimize").onclick = minimizePanel;
$("close").onclick = minimizePanel;


/* =========================================
   PANEL DRAGGING
========================================= */

let panelDragging = false;

let panelStartX = 0;
let panelStartY = 0;

let panelOriginX = 0;
let panelOriginY = 0;

header.addEventListener("pointerdown", event => {

    if (event.target.closest("button")) return;

    panelDragging = true;

    const rect = panel.getBoundingClientRect();

    panelStartX = event.clientX;
    panelStartY = event.clientY;

    panelOriginX = rect.left;
    panelOriginY = rect.top;

    header.setPointerCapture(event.pointerId);

});

header.addEventListener("pointermove", event => {

    if (!panelDragging) return;

    const dx = event.clientX - panelStartX;
    const dy = event.clientY - panelStartY;

    const rect = panel.getBoundingClientRect();

    const x = Math.max(
        0,
        Math.min(
            window.innerWidth - rect.width,
            panelOriginX + dx
        )
    );

    const y = Math.max(
        0,
        Math.min(
            window.innerHeight - rect.height,
            panelOriginY + dy
        )
    );

    panel.style.left = x + "px";
    panel.style.top = y + "px";

    panel.style.right = "auto";
    panel.style.bottom = "auto";

});

header.addEventListener("pointerup", () => {
    panelDragging = false;
});

header.addEventListener("pointercancel", () => {
    panelDragging = false;
});


/* =========================================
   POSITION SETTINGS
========================================= */

$("position-toggle").onclick = () => {

    $("position-menu").classList.toggle("hidden");

};

$("position-menu").addEventListener("click", event => {

    const button = event.target.closest("[data-position]");

    if (!button) return;

    setCorner(button.dataset.position);

});

$("reset-position").onclick = () => {

    localStorage.removeItem(POSITION_KEY);

    setCorner("bottom-right");

};


/* =========================================
   FORM
========================================= */

function clearForm() {

    editingId = null;

    $("extension-name").value = "";
    $("extension-description").value = "";
    $("extension-code").value = "";

    $("form-title").textContent = "＋ Add Extension";
    $("save-extension").textContent = "Save Extension";

}

$("clear-form").onclick = clearForm;


/* =========================================
   SAVE
========================================= */

$("save-extension").onclick = async () => {

    const name = $("extension-name").value.trim();

    const description =
        $("extension-description").value.trim();

    const code = $("extension-code").value.trim();

    if (!name || !code) {
        return toast("Enter name and JavaScript code");
    }

    try {

        const old = editingId
            ? await getItem(editingId)
            : null;

        const item = {

            id: editingId || crypto.randomUUID(),

            name,
            description,
            code,

            enabled: old?.enabled || false,

            updatedAt: Date.now()

        };

        await saveItem(item);

        clearForm();

        await render();

        toast("Extension saved successfully");

    } catch (error) {

        console.error(error);

        toast("Could not save extension");

    }

};


/* =========================================
   EXTENSION RUNTIME
========================================= */

async function executeExtension(id) {

    const item = await getItem(id);

    if (!item) return;

    try {

        const previous = cleanups.get(id);

        if (previous) {

            try {
                previous();
            } catch (error) {
                console.error(error);
            }

            cleanups.delete(id);

        }

        const api = {

            window,
            document,

            toast,

            addStyle(css) {

                const style = document.createElement("style");

                style.textContent = css;

                document.documentElement.appendChild(style);

                return () => style.remove();

            },

            on(element, event, callback, options) {

                element.addEventListener(
                    event,
                    callback,
                    options
                );

                return () => {
                    element.removeEventListener(
                        event,
                        callback,
                        options
                    );
                };

            }

        };

        const execute = new Function(
            "api",
            '"use strict";\n' + item.code
        );

        const cleanup = execute(api);

        if (typeof cleanup === "function") {
            cleanups.set(id, cleanup);
        }

        toast("Executed: " + item.name);

    } catch (error) {

        console.error("MistaX Runtime:", error);

        toast(error.message);

    }

}


/* =========================================
   EDIT
========================================= */

async function editExtension(id) {

    const item = await getItem(id);

    if (!item) return;

    editingId = id;

    $("extension-name").value = item.name;

    $("extension-description").value =
        item.description || "";

    $("extension-code").value = item.code;

    $("form-title").textContent = "✎ Edit Extension";

    $("save-extension").textContent = "Update Extension";

    $("content").scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* =========================================
   DELETE
========================================= */

async function removeExtension(id) {

    if (!confirm("Are you sure you want to delete this extension?")) {
        return;
    }

    try {

        cleanups.get(id)?.();

    } catch (error) {
        console.error(error);
    }

    cleanups.delete(id);

    await deleteItem(id);

    await render();

    toast("Extension deleted");

}


/* =========================================
   ENABLE / DISABLE
========================================= */

async function toggleExtension(id) {

    const item = await getItem(id);

    if (!item) return;

    item.enabled = !item.enabled;

    await saveItem(item);

    if (item.enabled) {

        await executeExtension(id);

    } else {

        try {
            cleanups.get(id)?.();
        } catch (error) {
            console.error(error);
        }

        cleanups.delete(id);

        toast("Extension disabled");

    }

    await render();

}


/* =========================================
   RENDER
========================================= */

async function render() {

    const items = await getAll();

    const search = $("search").value
        .trim()
        .toLowerCase();

    const filtered = items.filter(item => {

        return (
            item.name.toLowerCase().includes(search) ||
            (item.description || "").toLowerCase().includes(search)
        );

    });

    const enabled = items.filter(item => item.enabled).length;

    $("total-count").textContent = items.length;
    $("active-count").textContent = enabled;
    $("disabled-count").textContent = items.length - enabled;

    $("list-count").textContent = items.length + " ITEMS";

    if (!filtered.length) {

        $("extension-list").innerHTML = `
            <div class="empty">
                <div class="empty-icon">✦</div>
                ${items.length ? "No matching extensions." : "No extensions installed yet."}
            </div>
        `;

        return;

    }

    $("extension-list").innerHTML = filtered.map(item => `

        <div class="extension">

            <div class="extension-top">

                <div class="extension-name">
                    ${escapeHTML(item.name)}
                </div>

                <div class="status ${item.enabled ? "" : "off"}">
                    ${item.enabled ? "ENABLED" : "DISABLED"}
                </div>

            </div>

            <div class="extension-description">
                ${escapeHTML(item.description || "No description")}
            </div>

            <div class="extension-actions">

                <button
                    class="btn"
                    data-action="run"
                    data-id="${escapeHTML(item.id)}"
                >
                    ▶ Run
                </button>

                <button
                    class="btn btn-secondary"
                    data-action="toggle"
                    data-id="${escapeHTML(item.id)}"
                >
                    ${item.enabled ? "Disable" : "Enable"}
                </button>

                <button
                    class="btn btn-secondary"
                    data-action="edit"
                    data-id="${escapeHTML(item.id)}"
                >
                    Edit
                </button>

                <button
                    class="btn btn-danger"
                    data-action="delete"
                    data-id="${escapeHTML(item.id)}"
                >
                    Delete
                </button>

            </div>

        </div>

    `).join("");

}


/* =========================================
   LIST ACTIONS
========================================= */

$("extension-list").addEventListener("click", async event => {

    const button = event.target.closest("[data-action]");

    if (!button) return;

    const id = button.dataset.id;
    const action = button.dataset.action;

    if (action === "run") {
        await executeExtension(id);
    }

    if (action === "toggle") {
        await toggleExtension(id);
    }

    if (action === "edit") {
        await editExtension(id);
    }

    if (action === "delete") {
        await removeExtension(id);
    }

});


/* =========================================
   SEARCH
========================================= */

$("search").addEventListener("input", render);


/* =========================================
   EXPORT
========================================= */

$("export").onclick = async () => {

    try {

        const items = await getAll();

        const backup = {

            app: "MistaX",

            version: 3,

            exportedAt: new Date().toISOString(),

            extensions: items

        };

        const blob = new Blob(
            [JSON.stringify(backup, null, 2)],
            { type: "application/json" }
        );

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;
        link.download = "mistax-backup.json";

        link.click();

        setTimeout(() => URL.revokeObjectURL(url), 1500);

        toast("Backup exported");

    } catch (error) {

        console.error(error);

        toast("Export failed");

    }

};


/* =========================================
   IMPORT
========================================= */

$("import").onclick = () => {
    $("import-file").click();
};

$("import-file").onchange = async event => {

    const file = event.target.files[0];

    if (!file) return;

    try {

        const backup = JSON.parse(await file.text());

        const items = Array.isArray(backup)
            ? backup
            : backup.extensions;

        if (!Array.isArray(items)) {
            throw new Error("Invalid backup");
        }

        for (const item of items) {

            if (
                item &&
                typeof item.id === "string" &&
                typeof item.name === "string" &&
                typeof item.code === "string"
            ) {

                await saveItem({

                    id: item.id,

                    name: item.name,

                    description: item.description || "",

                    code: item.code,

                    enabled: Boolean(item.enabled),

                    updatedAt: Date.now()

                });

            }

        }

        await render();

        toast("Backup imported");

    } catch (error) {

        console.error(error);

        toast("Invalid backup file");

    }

    event.target.value = "";

};


/* =========================================
   INITIALIZATION
========================================= */

async function initialize() {

    try {

        db = await openDB();

        db.onversionchange = () => db.close();

        initializeBubblePosition();

        await render();

        const items = await getAll();

        for (const item of items) {

            if (item.enabled) {
                await executeExtension(item.id);
            }

        }

        toast("MistaX ready");

    } catch (error) {

        console.error("MistaX initialization:", error);

        toast("Initialization failed");

    }

}

initialize();

})();