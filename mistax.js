(() => {
"use strict";

/* =====================================================
   MISTAX V3
   By MistaHub
===================================================== */

const VERSION = "3.0.0";
const DB_NAME = "MistaXStore";
const DB_VERSION = 3;

const REPO = "https://cdn.jsdelivr.net/gh/Bedardi/MistaX@main/";
const STORE_URL = REPO + "store.json";

const CONTACT = {
    email: "support@mistahub.in",
    phone: "917870692939",
    telegram: "https://t.me/mistahub"
};

const APP_ID = "mistax-host";

/* =====================================================
   DUPLICATE INSTANCE
===================================================== */

const previous = document.getElementById(APP_ID);

if (previous) {
    previous.remove();
}

/* =====================================================
   DATABASE
===================================================== */

let db;

function openDatabase() {
    return new Promise((resolve, reject) => {

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = event => {

            const database = event.target.result;

            const create = (name, options) => {
                if (!database.objectStoreNames.contains(name)) {
                    database.createObjectStore(name, options);
                }
            };

            // Preserve old extensions store and its records.
            create("extensions", { keyPath: "id" });
            create("settings", { keyPath: "key" });
            create("storeCache", { keyPath: "key" });
            create("scriptCache", { keyPath: "id" });
            create("metadata", { keyPath: "key" });

            const tx = event.target.transaction;

            tx.objectStore("metadata").put({
                key: "databaseVersion",
                value: DB_VERSION
            });
        };

        request.onsuccess = () => {
            db = request.result;

            db.onversionchange = () => db.close();

            resolve(db);
        };

        request.onerror = () => reject(request.error);

        request.onblocked = () => {
            console.warn("MistaX database upgrade is blocked by another tab.");
        };
    });
}

function transaction(storeNames, mode, callback) {
    return new Promise((resolve, reject) => {

        const tx = db.transaction(storeNames, mode);

        let result;

        try {
            result = callback(tx);
        } catch (error) {
            try { tx.abort(); } catch (_) {}
            reject(error);
            return;
        }

        tx.oncomplete = () => resolve(result);

        tx.onerror = () => reject(tx.error);

        tx.onabort = () => reject(
            tx.error || new Error("Database transaction aborted")
        );
    });
}

function dbGet(store, key) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(store, "readonly");
        const request = tx.objectStore(store).get(key);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function dbAll(store) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(store, "readonly");
        const request = tx.objectStore(store).getAll();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}

function dbPut(store, value) {
    return transaction(store, "readwrite", tx => {
        tx.objectStore(store).put(value);
    });
}

function dbDelete(store, key) {
    return transaction(store, "readwrite", tx => {
        tx.objectStore(store).delete(key);
    });
}

function dbClear(stores) {
    return transaction(stores, "readwrite", tx => {
        stores.forEach(name => tx.objectStore(name).clear());
    });
}

const DB = {
    all: () => dbAll("extensions"),
    get: id => dbGet("extensions", id),
    save: item => dbPut("extensions", item),
    remove: id => dbDelete("extensions", id),

    setting: key => dbGet("settings", key),

    setSetting: (key, value) => dbPut("settings", {
        key,
        value
    }),

    getStore: () => dbGet("storeCache", "catalogue"),

    setStore: data => dbPut("storeCache", {
        key: "catalogue",
        data,
        cachedAt: Date.now()
    }),

    getScript: id => dbGet("scriptCache", id),

    setScript: item => dbPut("scriptCache", item),

    metadata: key => dbGet("metadata", key),

    setMetadata: (key, value) => dbPut("metadata", {
        key,
        value
    }),

    reset: () => dbClear([
        "extensions",
        "settings",
        "storeCache",
        "scriptCache",
        "metadata"
    ])
};

/* =====================================================
   DEFAULT SETTINGS
===================================================== */

const DEFAULT_SETTINGS = {
    theme: "dark",
    accent: "#6750A4",
    autoRun: false,
    confirmDelete: true,
    bubble: true,
    bubbleSize: 56,
    bubbleOpacity: 100,
    bubblePosition: null,
    storeAutoRefresh: true
};

let settings = { ...DEFAULT_SETTINGS };

async function loadSettings() {

    for (const key of Object.keys(DEFAULT_SETTINGS)) {

        const result = await DB.setting(key);

        if (result) {
            settings[key] = result.value;
        }
    }
}

async function saveSetting(key, value) {

    settings[key] = value;

    await DB.setSetting(key, value);

    applySettings();
}

function applySettings() {

    const app = $("app");

    app.classList.toggle(
        "light",
        settings.theme === "light"
    );

    app.style.setProperty("--accent", settings.accent);

    const bubble = $("bubble");

    bubble.style.width = settings.bubbleSize + "px";
    bubble.style.height = settings.bubbleSize + "px";
    bubble.style.opacity = settings.bubbleOpacity / 100;

    bubble.style.display = settings.bubble ? "flex" : "none";

    if (settings.bubblePosition) {
        bubble.style.left = settings.bubblePosition.left;
        bubble.style.top = settings.bubblePosition.top;
        bubble.style.right = "auto";
        bubble.style.bottom = "auto";
    }
}

/* =====================================================
   SHADOW DOM
===================================================== */

const host = document.createElement("div");
host.id = APP_ID;

host.style.cssText = `
position:fixed;
inset:0;
z-index:2147483647;
pointer-events:none;
`;

document.documentElement.appendChild(host);

const shadow = host.attachShadow({ mode: "open" });

const $ = id => shadow.getElementById(id);

shadow.innerHTML = `

<style>

* {
    box-sizing:border-box;
}

:host {
    font-family:Inter,system-ui,Arial,sans-serif;
    color-scheme:dark;
}

#bubble {
    position:fixed;
    right:20px;
    bottom:90px;
    width:56px;
    height:56px;
    border-radius:19px;
    background:var(--accent,#6750A4);
    color:white;
    display:flex;
    align-items:center;
    justify-content:center;
    font-size:23px;
    font-weight:900;
    box-shadow:0 5px 25px #0005;
    pointer-events:auto;
    cursor:grab;
    user-select:none;
    touch-action:none;
    z-index:10;
}

#app {
    --accent:#6750A4;

    position:fixed;
    inset:0;
    display:none;
    flex-direction:column;
    pointer-events:auto;
    background:#101116;
    color:#f5f3fa;
    overflow:hidden;
    z-index:20;
}

#app.show {
    display:flex;
}

#app.light {
    background:#F6F4FA;
    color:#19171E;
    color-scheme:light;
}

#header {
    height:65px;
    padding:0 17px;
    display:flex;
    align-items:center;
    justify-content:space-between;
    flex-shrink:0;
    border-bottom:1px solid #ffffff14;
}

.light #header {
    border-color:#00000012;
}

.brand {
    display:flex;
    align-items:center;
    gap:10px;
    font-weight:850;
    font-size:20px;
}

.logo {
    width:38px;
    height:38px;
    background:var(--accent);
    border-radius:13px;
    display:grid;
    place-items:center;
    color:white;
    font-size:21px;
}

.header-actions {
    display:flex;
    gap:9px;
}

.iconbtn {
    width:40px;
    height:40px;
    border:0;
    border-radius:13px;
    background:#292A34;
    color:white;
    font-size:22px;
    cursor:pointer;
}

.light .iconbtn {
    background:#E9E5F0;
    color:#222;
}

#content {
    flex:1;
    overflow-y:auto;
    padding:19px;
    padding-bottom:25px;
    overscroll-behavior:contain;
}

.page {
    display:none;
}

.page.active {
    display:block;
    animation:fade .18s ease;
}

@keyframes fade {
    from {opacity:.3; transform:translateY(5px)}
    to {opacity:1; transform:translateY(0)}
}

h1 {
    margin:4px 0 8px;
    font-size:26px;
}

h2 {
    font-size:18px;
    margin:24px 0 13px;
}

p {
    color:#aaa7b5;
    font-size:13px;
    line-height:1.6;
}

.light p {
    color:#6c6874;
}

.hero {
    padding:22px;
    border-radius:23px;
    background:linear-gradient(135deg,#34255B,#6750A4);
    color:white;
    margin-bottom:17px;
}

.hero h1 {
    font-size:25px;
}

.hero p {
    color:#e3d9ff;
}

.hero button {
    background:white;
    color:#392766;
}

.stats {
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:11px;
}

.stat {
    padding:17px;
    background:#1D1F28;
    border-radius:18px;
}

.light .stat {
    background:white;
}

.stat strong {
    display:block;
    font-size:27px;
}

.stat small {
    color:#aaa7b5;
}

.card {
    padding:15px;
    border-radius:18px;
    background:#1D1F28;
    border:1px solid #ffffff0d;
    margin-bottom:12px;
}

.light .card {
    background:white;
    border-color:#00000010;
}

.extrow {
    display:flex;
    align-items:center;
    gap:12px;
}

.exticon {
    width:48px;
    height:48px;
    display:grid;
    place-items:center;
    flex-shrink:0;
    font-size:23px;
    background:#34313F;
    border-radius:15px;
}

.extinfo {
    flex:1;
    min-width:0;
}

.extinfo strong {
    font-size:14px;
    display:block;
}

.extinfo small {
    font-size:11px;
    color:#aaa7b5;
    display:block;
    margin-top:5px;
}

.btn {
    border:0;
    padding:11px 16px;
    border-radius:12px;
    background:var(--accent);
    color:white;
    font-weight:750;
    font-size:13px;
    cursor:pointer;
}

.btn.secondary {
    background:#333542;
    color:white;
}

.light .btn.secondary {
    background:#EAE6F1;
    color:#28232F;
}

.btn.danger {
    background:#A83248;
    color:white;
}

.btn:disabled {
    opacity:.5;
    cursor:not-allowed;
}

.actions {
    display:flex;
    gap:8px;
    flex-wrap:wrap;
    margin-top:13px;
}

.input {
    display:block;
    width:100%;
    padding:13px 14px;
    background:#252731;
    border:1px solid #ffffff18;
    border-radius:13px;
    color:inherit;
    outline:none;
    font:inherit;
    margin:9px 0;
}

.light .input {
    background:white;
    border-color:#00000020;
}

textarea.input {
    min-height:230px;
    resize:vertical;
    font-family:monospace;
    font-size:12px;
    line-height:1.6;
}

.search {
    margin:15px 0;
}

#navbar {
    height:69px;
    flex-shrink:0;
    display:grid;
    grid-template-columns:repeat(5,1fr);
    background:#171920;
    border-top:1px solid #ffffff14;
}

.light #navbar {
    background:white;
    border-color:#00000012;
}

.navitem {
    border:0;
    background:transparent;
    color:#92909C;
    font-size:10px;
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    gap:5px;
    cursor:pointer;
}

.navitem .ico {
    font-size:21px;
}

.navitem.active {
    color:#C4AEFF;
}

.light .navitem.active {
    color:var(--accent);
}

.switch {
    width:43px;
    height:25px;
    background:#555;
    border-radius:30px;
    position:relative;
    cursor:pointer;
    flex-shrink:0;
}

.switch:after {
    content:"";
    position:absolute;
    left:3px;
    top:3px;
    width:19px;
    height:19px;
    background:white;
    border-radius:50%;
    transition:.2s;
}

.switch.on {
    background:var(--accent);
}

.switch.on:after {
    left:21px;
}

.setting-row {
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:12px;
    padding:13px 0;
}

.setting-row + .setting-row {
    border-top:1px solid #ffffff12;
}

.setting-row strong {
    display:block;
    font-size:13px;
}

.setting-row small {
    color:#aaa7b5;
    font-size:11px;
    display:block;
    margin-top:4px;
}

.empty {
    padding:35px 12px;
    text-align:center;
    color:#9996A4;
    font-size:13px;
}

.badge {
    display:inline-block;
    padding:4px 8px;
    border-radius:8px;
    background:#34313F;
    color:#C4AEFF;
    font-size:10px;
}

#toast {
    display:none;
    position:fixed;
    left:50%;
    bottom:85px;
    transform:translateX(-50%);
    padding:12px 18px;
    border-radius:14px;
    background:#32313B;
    color:white;
    font-size:12px;
    z-index:100;
    max-width:90%;
    box-shadow:0 4px 20px #0005;
}

a.btn {
    text-decoration:none;
    display:inline-block;
}

@media(min-width:650px) {
    #app {
        inset:auto 22px 22px auto;
        width:430px;
        height:min(780px,90vh);
        border-radius:25px;
        border:1px solid #ffffff20;
        box-shadow:0 15px 70px #0008;
    }

    #bubble {
        right:25px;
        bottom:25px;
    }
}

</style>

<div id="bubble">M</div>

<div id="app">

    <header id="header">
        <div class="brand">
            <div class="logo">M</div>
            <span>MistaX</span>
        </div>

        <div class="header-actions">
            <button class="iconbtn" id="minimize">−</button>
            <button class="iconbtn" id="close">×</button>
        </div>
    </header>

    <main id="content">

        <!-- HOME -->

        <section class="page active" id="home">

            <div class="hero">
                <span class="badge">MISTAHUB ECOSYSTEM</span>
                <h1>Welcome to MistaX</h1>
                <p>Your personal JavaScript extension manager.</p>
                <button class="btn" data-go="store">Explore Store →</button>
            </div>

            <div class="stats">
                <div class="stat">
                    <strong id="installedCount">0</strong>
                    <small>Installed</small>
                </div>

                <div class="stat">
                    <strong id="runningCount">0</strong>
                    <small>Running</small>
                </div>
            </div>

            <h2>Quick Actions</h2>

            <div class="card">
                <div class="extrow">
                    <div class="exticon">▣</div>
                    <div class="extinfo">
                        <strong>Extension Store</strong>
                        <small>Discover verified extensions</small>
                    </div>
                </div>
                <div class="actions">
                    <button class="btn" data-go="store">Open Store</button>
                </div>
            </div>

            <div class="card">
                <div class="extrow">
                    <div class="exticon">✎</div>
                    <div class="extinfo">
                        <strong>Extension Editor</strong>
                        <small>Create your own JavaScript extension</small>
                    </div>
                </div>
                <div class="actions">
                    <button class="btn secondary" data-go="editor">Open Editor</button>
                </div>
            </div>

            <h2>Recently Installed</h2>
            <div id="recentList"></div>

        </section>

        <!-- STORE -->

        <section class="page" id="store">

            <h1>Extension Store</h1>
            <p>Explore extensions verified by MistaHub.</p>

            <input class="input search" id="storeSearch"
                placeholder="Search extensions...">

            <div id="categories"></div>

            <div id="storeList">
                <div class="empty">Loading Store...</div>
            </div>

            <button class="btn secondary" id="refreshStore">
                ↻ Refresh Store
            </button>

            <p id="storeStatus"></p>

        </section>

        <!-- INSTALLED -->

        <section class="page" id="installed">

            <h1>My Extensions</h1>
            <p>Manage your installed extensions.</p>

            <input class="input search" id="installedSearch"
                placeholder="Search extensions...">

            <div id="installedList"></div>

        </section>

        <!-- EDITOR -->

        <section class="page" id="editor">

            <h1>Extension Editor</h1>
            <p>Create and manage your custom JavaScript extensions.</p>

            <input class="input" id="editId"
                placeholder="Extension ID (my-extension)">

            <input class="input" id="editName"
                placeholder="Extension Name">

            <input class="input" id="editDescription"
                placeholder="Description">

            <textarea class="input" id="codeEditor"
                spellcheck="false"
                placeholder="// Write your JavaScript code here

api.toast('Hello MistaX!');

return () => {
    console.log('Extension stopped');
};"></textarea>

            <div class="actions">
                <button class="btn" id="saveCode">Save Extension</button>
                <button class="btn secondary" id="testCode">Test</button>
                <button class="btn secondary" id="clearCode">Clear</button>
            </div>

            <h2>Extension API</h2>

            <div class="card">
                <p><code>api.toast("Hello")</code></p>
                <p><code>api.log("Message")</code></p>
                <p><code>api.addStyle("body { ... }")</code></p>
                <p><code>api.addElement(element)</code></p>
                <p><code>api.onCleanup(callback)</code></p>
                <p><code>api.element</code></p>
            </div>

        </section>

        <!-- SETTINGS -->

        <section class="page" id="settings">

            <h1>Settings</h1>
            <p>Customize your MistaX experience.</p>

            <h2>Appearance</h2>

            <div class="card">

                <div class="setting-row">
                    <div>
                        <strong>Dark Theme</strong>
                        <small>Use dark appearance</small>
                    </div>
                    <div class="switch" id="themeSwitch"></div>
                </div>

                <div class="setting-row">
                    <div>
                        <strong>Accent Color</strong>
                        <small>Customize primary color</small>
                    </div>
                    <input type="color" id="accentColor"
                        style="width:42px;height:35px;border:0;background:transparent">
                </div>

            </div>

            <h2>Floating Bubble</h2>

            <div class="card">

                <div class="setting-row">
                    <div>
                        <strong>Show Bubble</strong>
                        <small>Floating MistaX button</small>
                    </div>
                    <div class="switch" id="bubbleSwitch"></div>
                </div>

                <div class="setting-row">
                    <div>
                        <strong>Bubble Size</strong>
                        <small>Adjust floating button size</small>
                    </div>
                    <input id="bubbleSize" type="range"
                        min="42" max="80" style="width:110px">
                </div>

                <div class="setting-row">
                    <div>
                        <strong>Bubble Opacity</strong>
                        <small>Adjust transparency</small>
                    </div>
                    <input id="bubbleOpacity" type="range"
                        min="30" max="100" style="width:110px">
                </div>

                <button class="btn secondary" id="resetBubble">
                    Reset Bubble Position
                </button>

            </div>

            <h2>Extension Settings</h2>

            <div class="card">

                <div class="setting-row">
                    <div>
                        <strong>Auto Run</strong>
                        <small>Run enabled extensions on launch</small>
                    </div>
                    <div class="switch" id="autoSwitch"></div>
                </div>

                <div class="setting-row">
                    <div>
                        <strong>Confirm Uninstall</strong>
                        <small>Ask before deleting extensions</small>
                    </div>
                    <div class="switch" id="confirmSwitch"></div>
                </div>

            </div>

            <h2>Backup & Restore</h2>

            <div class="card">
                <button class="btn" id="exportBackup">Export Backup</button>
                <button class="btn secondary" id="importBackup">Import Backup</button>
                <input id="backupFile" type="file"
                    accept="application/json,.json" hidden>
            </div>

            <h2>Storage</h2>

            <div class="card">
                <strong id="storageInfo">Loading...</strong>
                <p>All installed extensions are stored locally in IndexedDB.</p>
            </div>

            <h2>Contact MistaHub</h2>

            <div class="card">
                <strong>Want your extension published?</strong>
                <p>
                    Send your extension for manual review.
                    Only verified extensions are published in the MistaX Store.
                </p>

                <div class="actions">
                    <a class="btn"
                        href="https://wa.me/${CONTACT.phone}"
                        target="_blank">WhatsApp</a>

                    <a class="btn secondary"
                        href="mailto:${CONTACT.email}">Email</a>

                    <a class="btn secondary"
                        href="${CONTACT.telegram}"
                        target="_blank">Telegram</a>
                </div>

                <p>${CONTACT.email}</p>
                <p>Mobile / WhatsApp: +91 78706 92939</p>
            </div>

            <h2>About</h2>

            <div class="card">
                <strong>MistaX ${VERSION}</strong>
                <p>Developed by MistaHub.</p>
                <a href="https://mistahub.in" target="_blank">
                    Visit MistaHub
                </a>
            </div>

            <h2>Danger Zone</h2>

            <div class="card">
                <p>Factory Reset deletes all local extensions, settings and caches.</p>
                <button class="btn danger" id="factoryReset">
                    Factory Reset
                </button>
            </div>

        </section>

    </main>

    <nav id="navbar">

        <button class="navitem active" data-page="home">
            <span class="ico">⌂</span>Home
        </button>

        <button class="navitem" data-page="store">
            <span class="ico">▣</span>Store
        </button>

        <button class="navitem" data-page="installed">
            <span class="ico">◈</span>My Extensions
        </button>

        <button class="navitem" data-page="editor">
            <span class="ico">✎</span>Editor
        </button>

        <button class="navitem" data-page="settings">
            <span class="ico">⚙</span>Settings
        </button>

    </nav>

</div>

<div id="toast"></div>

`;

/* =====================================================
   TOAST
===================================================== */

function toast(message) {

    const element = $("toast");

    element.textContent = message;
    element.style.display = "block";

    clearTimeout(toast.timer);

    toast.timer = setTimeout(() => {
        element.style.display = "none";
    }, 2600);
}

/* =====================================================
   NAVIGATION
===================================================== */

let currentPage = "home";

function showPage(page) {

    currentPage = page;

    shadow.querySelectorAll(".page").forEach(item => {
        item.classList.toggle("active", item.id === page);
    });

    shadow.querySelectorAll(".navitem").forEach(item => {
        item.classList.toggle(
            "active",
            item.dataset.page === page
        );
    });

    if (page === "home") renderHome();
    if (page === "store") renderStore();
    if (page === "installed") renderInstalled();
    if (page === "settings") renderSettings();
}

function bindNavigation() {

    shadow.querySelectorAll("[data-page]").forEach(button => {
        button.onclick = () => showPage(button.dataset.page);
    });

    shadow.querySelectorAll("[data-go]").forEach(button => {
        button.onclick = () => showPage(button.dataset.go);
    });
}

/* =====================================================
   RUNTIME MANAGER
===================================================== */

const runtime = new Map();

function createExtensionAPI(id) {

    const cleanups = [];

    return {

        element: document.documentElement,

        toast,

        log: (...args) => {
            console.log("[MistaX:" + id + "]", ...args);
        },

        onCleanup(callback) {
            if (typeof callback === "function") {
                cleanups.push(callback);
            }
        },

        addStyle(css) {

            const style = document.createElement("style");

            style.textContent = css;

            document.documentElement.appendChild(style);

            cleanups.push(() => style.remove());

            return style;
        },

        addElement(element) {

            document.documentElement.appendChild(element);

            cleanups.push(() => element.remove());

            return element;
        },

        cleanup() {

            for (const callback of cleanups.reverse()) {

                try {
                    callback();
                } catch (error) {
                    console.error(error);
                }
            }
        }
    };
}

async function executeExtension(item) {

    if (runtime.has(item.id)) {
        toast("Extension already running");
        return;
    }

    const state = {
        status: "starting",
        cleanup: null,
        promise: null
    };

    runtime.set(item.id, state);

    state.promise = (async () => {

        const api = createExtensionAPI(item.id);

        try {

            const run = new Function(
                "api",
                '"use strict";\n' + item.code
            );

            let result = run(api);

            if (result && typeof result.then === "function") {
                result = await result;
            }

            if (typeof result === "function") {
                api.onCleanup(result);
            }

            if (runtime.get(item.id) !== state) {
                api.cleanup();
                return;
            }

            state.status = "running";
            state.cleanup = () => api.cleanup();

            toast(item.name + " started");

        } catch (error) {

            api.cleanup();

            if (runtime.get(item.id) === state) {
                runtime.delete(item.id);
            }

            console.error(error);

            toast("Extension error: " + error.message);

            throw error;
        }

    })();

    try {
        await state.promise;
    } catch (_) {}
}

async function stopExtension(id) {

    const state = runtime.get(id);

    if (!state) return;

    if (state.status === "starting") {
        try {
            await state.promise;
        } catch (_) {}
    }

    if (runtime.get(id) !== state) return;

    try {
        if (state.cleanup) {
            state.cleanup();
        }
    } catch (error) {
        console.error(error);
    }

    runtime.delete(id);
}

async function toggleExtension(id) {

    const item = await DB.get(id);

    if (!item) return;

    if (runtime.has(id)) {

        await stopExtension(id);

        item.enabled = false;

    } else {

        item.enabled = true;

        await DB.save(item);

        await executeExtension(item);
    }

    await DB.save(item);

    renderInstalled();
    renderHome();
}

/* =====================================================
   STORE MANAGER
===================================================== */

let catalogue = [];
let selectedCategory = "All";
let storeLoading = false;

function validateCatalogue(data) {

    if (!data || !Array.isArray(data.extensions)) {
        throw new Error("Invalid store.json");
    }

    return data.extensions.filter(item => {

        return (
            typeof item.id === "string" &&
            /^[a-z0-9-]{2,60}$/.test(item.id) &&
            typeof item.name === "string" &&
            typeof item.version === "string" &&
            typeof item.script === "string" &&
            item.script.startsWith("https://cdn.jsdelivr.net/")
        );

    });
}

async function loadStore(force = false) {

    if (storeLoading) return;

    storeLoading = true;

    $("storeStatus").textContent = "Loading Store...";

    try {

        if (!force) {

            const cached = await DB.getStore();

            if (cached && Array.isArray(cached.data.extensions)) {
                catalogue = validateCatalogue(cached.data);
                renderStoreCards();
            }
        }

        const response = await fetch(
            STORE_URL + "?_=" + Date.now(),
            { cache: "no-store" }
        );

        if (!response.ok) {
            throw new Error("Store request failed");
        }

        const data = await response.json();

        const valid = validateCatalogue(data);

        catalogue = valid;

        await DB.setStore({
            ...data,
            extensions: valid
        });

        await DB.setMetadata(
            "lastStoreSync",
            Date.now()
        );

        $("storeStatus").textContent =
            "Store updated successfully.";

        renderStoreCards();

    } catch (error) {

        console.error(error);

        $("storeStatus").textContent =
            catalogue.length
                ? "Showing cached Store."
                : "Unable to connect to Store.";

        if (!catalogue.length) {
            const cached = await DB.getStore().catch(() => null);

            if (cached) {
                catalogue = validateCatalogue(cached.data);
                renderStoreCards();
            }
        }

    } finally {
        storeLoading = false;
    }
}

async function installExtension(item) {

    try {

        const old = await DB.get(item.id);

        if (old) {
            toast("Already installed");
            return;
        }

        const response = await fetch(item.script, {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("Extension download failed");
        }

        const code = await response.text();

        if (!code.trim()) {
            throw new Error("Empty extension script");
        }

        const scriptRecord = {
            id: item.id,
            code,
            version: item.version,
            downloadedAt: Date.now(),
            url: item.script
        };

        const installedRecord = {
            id: item.id,
            name: item.name,
            description: item.description || "",
            icon: item.icon || "🧩",
            category: item.category || "Other",
            version: item.version,
            code,
            enabled: false,
            source: "store",
            installedAt: Date.now(),
            updatedAt: Date.now(),
            script: item.script
        };

        await transaction(
            ["extensions", "scriptCache"],
            "readwrite",
            tx => {
                tx.objectStore("extensions").put(installedRecord);
                tx.objectStore("scriptCache").put(scriptRecord);
            }
        );

        toast("Extension installed");

        renderStoreCards();
        renderInstalled();
        renderHome();

    } catch (error) {

        console.error(error);
        toast("Install failed: " + error.message);
    }
}

async function updateExtension(item) {

    try {

        const old = await DB.get(item.id);

        if (!old) {
            return installExtension(item);
        }

        const response = await fetch(item.script, {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("Download failed");
        }

        const code = await response.text();

        await stopExtension(item.id);

        const updated = {
            ...old,
            name: item.name,
            description: item.description || "",
            icon: item.icon || old.icon,
            category: item.category || old.category,
            version: item.version,
            code,
            script: item.script,
            enabled: false,
            updatedAt: Date.now()
        };

        await transaction(
            ["extensions", "scriptCache"],
            "readwrite",
            tx => {
                tx.objectStore("extensions").put(updated);

                tx.objectStore("scriptCache").put({
                    id: item.id,
                    code,
                    version: item.version,
                    downloadedAt: Date.now(),
                    url: item.script
                });
            }
        );

        toast("Extension updated");

        renderInstalled();
        renderStoreCards();

    } catch (error) {

        toast("Update failed: " + error.message);
    }
}

async function uninstallExtension(id) {

    if (
        settings.confirmDelete &&
        !confirm("Uninstall this extension?")
    ) return;

    await stopExtension(id);

    await transaction(
        ["extensions", "scriptCache"],
        "readwrite",
        tx => {
            tx.objectStore("extensions").delete(id);
            tx.objectStore("scriptCache").delete(id);
        }
    );

    toast("Extension uninstalled");

    renderInstalled();
    renderStoreCards();
    renderHome();
}

/* =====================================================
   STORE UI
===================================================== */

async function renderStore() {

    if (!catalogue.length) {
        await loadStore();
        return;
    }

    renderStoreCards();
}

async function renderStoreCards() {

    const list = $("storeList");

    if (!list) return;

    list.innerHTML = "";

    const installed = await DB.all();

    const query = $("storeSearch").value.toLowerCase();

    const filtered = catalogue.filter(item => {

        const matchesSearch =
            (item.name + " " + item.description + " " + item.category)
            .toLowerCase().includes(query);

        const matchesCategory =
            selectedCategory === "All" ||
            item.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    if (!filtered.length) {
        list.innerHTML = '<div class="empty">No extensions found.</div>';
        return;
    }

    filtered.forEach(item => {

        const old = installed.find(x => x.id === item.id);

        const card = document.createElement("div");

        card.className = "card";

        const row = document.createElement("div");
        row.className = "extrow";

        const icon = document.createElement("div");
        icon.className = "exticon";
        icon.textContent = item.icon || "🧩";

        const info = document.createElement("div");
        info.className = "extinfo";

        const name = document.createElement("strong");
        name.textContent = item.name;

        const meta = document.createElement("small");
        meta.textContent =
            (item.category || "Other") + " · v" + item.version;

        info.append(name, meta);
        row.append(icon, info);

        const desc = document.createElement("p");
        desc.textContent = item.description || "";

        const actions = document.createElement("div");
        actions.className = "actions";

        const button = document.createElement("button");
        button.className = "btn";

        if (!old) {

            button.textContent = "Install";
            button.onclick = () => installExtension(item);

        } else if (old.version !== item.version) {

            button.textContent = "Update";
            button.onclick = () => updateExtension(item);

        } else {

            button.textContent = "Installed";
            button.disabled = true;
        }

        actions.appendChild(button);

        card.append(row, desc, actions);

        list.appendChild(card);
    });
}

function renderCategories() {

    const categories = [
        "All",
        ...new Set(catalogue.map(x => x.category || "Other"))
    ];

    const holder = $("categories");

    holder.innerHTML = "";

    categories.forEach(category => {

        const button = document.createElement("button");

        button.className = "btn secondary";
        button.style.margin = "0 5px 8px 0";
        button.textContent = category;

        button.onclick = () => {
            selectedCategory = category;
            renderCategories();
            renderStoreCards();
        };

        if (selectedCategory === category) {
            button.style.background = "var(--accent)";
        }

        holder.appendChild(button);
    });
}

/* =====================================================
   INSTALLED UI
===================================================== */

async function renderInstalled() {

    const list = await DB.all();

    const query = $("installedSearch").value.toLowerCase();

    const filtered = list.filter(item =>
        (item.name + " " + item.description)
            .toLowerCase().includes(query)
    );

    const holder = $("installedList");

    holder.innerHTML = "";

    if (!filtered.length) {

        holder.innerHTML = `
            <div class="empty">
                No extensions installed yet.<br><br>
                Visit Store to discover extensions.
            </div>
        `;

        return;
    }

    filtered.forEach(item => {

        const running = runtime.has(item.id);

        const card = document.createElement("div");
        card.className = "card";

        const row = document.createElement("div");
        row.className = "extrow";

        const icon = document.createElement("div");
        icon.className = "exticon";
        icon.textContent = item.icon || "🧩";

        const info = document.createElement("div");
        info.className = "extinfo";

        const name = document.createElement("strong");
        name.textContent = item.name;

        const meta = document.createElement("small");
        meta.textContent =
            "v" + item.version + " · " +
            (running ? "Running" : "Stopped");

        info.append(name, meta);

        const sw = document.createElement("div");
        sw.className = "switch" + (running ? " on" : "");

        sw.onclick = () => toggleExtension(item.id);

        row.append(icon, info, sw);

        const desc = document.createElement("p");
        desc.textContent = item.description || "";

        const actions = document.createElement("div");
        actions.className = "actions";

        const edit = document.createElement("button");
        edit.className = "btn secondary";
        edit.textContent = "Edit";

        edit.onclick = () => {

            $("editId").value = item.id;
            $("editName").value = item.name;
            $("editDescription").value = item.description || "";
            $("codeEditor").value = item.code;

            showPage("editor");
        };

        const remove = document.createElement("button");
        remove.className = "btn danger";
        remove.textContent = "Uninstall";

        remove.onclick = () => uninstallExtension(item.id);

        actions.append(edit, remove);

        card.append(row, desc, actions);

        holder.appendChild(card);
    });
}

/* =====================================================
   HOME UI
===================================================== */

async function renderHome() {

    const list = await DB.all();

    $("installedCount").textContent = list.length;
    $("runningCount").textContent = runtime.size;

    const recent = list.slice()
        .sort((a, b) =>
            (b.installedAt || 0) - (a.installedAt || 0)
        )
        .slice(0, 3);

    const holder = $("recentList");

    holder.innerHTML = "";

    if (!recent.length) {
        holder.innerHTML = `
            <div class="empty">
                Your installed extensions will appear here.
            </div>
        `;
        return;
    }

    recent.forEach(item => {

        const card = document.createElement("div");
        card.className = "card extrow";

        const icon = document.createElement("div");
        icon.className = "exticon";
        icon.textContent = item.icon || "🧩";

        const info = document.createElement("div");
        info.className = "extinfo";

        const name = document.createElement("strong");
        name.textContent = item.name;

        const version = document.createElement("small");
        version.textContent = "Version " + item.version;

        info.append(name, version);

        card.append(icon, info);

        holder.appendChild(card);
    });
}

/* =====================================================
   EDITOR
===================================================== */

async function saveCustomExtension() {

    const id = $("editId").value.trim().toLowerCase();
    const name = $("editName").value.trim();
    const description = $("editDescription").value.trim();
    const code = $("codeEditor").value;

    if (!/^[a-z0-9-]{2,60}$/.test(id)) {
        return toast("Invalid extension ID");
    }

    if (!name || !code.trim()) {
        return toast("Name and code are required");
    }

    const old = await DB.get(id);

    if (old && old.source === "store") {
        return toast("Store extension cannot be overwritten here");
    }

    await DB.save({
        id,
        name,
        description,
        code,
        icon: "🧩",
        category: "Custom",
        version: old ? old.version : "1.0.0",
        source: "custom",
        enabled: false,
        installedAt: old ? old.installedAt : Date.now(),
        updatedAt: Date.now()
    });

    toast("Extension saved");

    renderInstalled();
    renderHome();
}

async function testCustomExtension() {

    const code = $("codeEditor").value;

    if (!code.trim()) {
        return toast("Write code first");
    }

    const api = createExtensionAPI("editor-test");

    try {

        let result = new Function(
            "api",
            '"use strict";\n' + code
        )(api);

        if (result && typeof result.then === "function") {
            result = await result;
        }

        if (typeof result === "function") {
            api.onCleanup(result);
        }

        toast("Test executed. Temporary effects will be cleaned up shortly.");

        setTimeout(() => api.cleanup(), 1200);

    } catch (error) {

        api.cleanup();

        toast("Error: " + error.message);
    }
}

/* =====================================================
   SETTINGS UI
===================================================== */

function setSwitch(id, value) {
    $(id).classList.toggle("on", !!value);
}

function renderSettings() {

    setSwitch("themeSwitch", settings.theme === "dark");
    setSwitch("bubbleSwitch", settings.bubble);
    setSwitch("autoSwitch", settings.autoRun);
    setSwitch("confirmSwitch", settings.confirmDelete);

    $("accentColor").value = settings.accent;
    $("bubbleSize").value = settings.bubbleSize;
    $("bubbleOpacity").value = settings.bubbleOpacity;

    DB.all().then(list => {
        $("storageInfo").textContent =
            list.length + " installed extensions";
    });
}

/* =====================================================
   BACKUP & RESTORE
===================================================== */

async function exportBackup() {

    const extensions = await DB.all();

    const data = {
        app: "MistaX",
        version: VERSION,
        exportedAt: new Date().toISOString(),
        extensions,
        settings
    };

    const blob = new Blob(
        [JSON.stringify(data, null, 2)],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;
    a.download = "mistax-backup.json";

    a.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);

    toast("Backup exported");
}

async function importBackup(file) {

    try {

        const data = JSON.parse(await file.text());

        if (!Array.isArray(data.extensions)) {
            throw new Error("Invalid backup");
        }

        for (const item of data.extensions) {

            if (
                !item.id ||
                typeof item.code !== "string"
            ) continue;

            await DB.save({
                ...item,
                source: item.source || "custom",
                enabled: false
            });
        }

        if (data.settings && typeof data.settings === "object") {

            for (const key of Object.keys(DEFAULT_SETTINGS)) {

                if (key in data.settings) {
                    await saveSetting(key, data.settings[key]);
                }
            }
        }

        toast("Backup imported");

        renderInstalled();
        renderHome();
        renderSettings();

    } catch (error) {

        toast("Import failed: " + error.message);
    }
}

/* =====================================================
   FLOATING BUBBLE DRAG
===================================================== */

function makeBubbleDraggable() {

    const bubble = $("bubble");

    let startX = 0;
    let startY = 0;
    let originX = 0;
    let originY = 0;
    let moved = false;

    bubble.addEventListener("pointerdown", event => {

        startX = event.clientX;
        startY = event.clientY;

        const rect = bubble.getBoundingClientRect();

        originX = rect.left;
        originY = rect.top;

        moved = false;

        bubble.setPointerCapture(event.pointerId);
    });

    bubble.addEventListener("pointermove", event => {

        if (!bubble.hasPointerCapture(event.pointerId)) return;

        const dx = event.clientX - startX;
        const dy = event.clientY - startY;

        if (Math.abs(dx) + Math.abs(dy) > 7) {
            moved = true;
        }

        if (!moved) return;

        const x = Math.max(
            0,
            Math.min(innerWidth - 60, originX + dx)
        );

        const y = Math.max(
            0,
            Math.min(innerHeight - 60, originY + dy)
        );

        bubble.style.left = x + "px";
        bubble.style.top = y + "px";
        bubble.style.right = "auto";
        bubble.style.bottom = "auto";
    });

    bubble.addEventListener("pointerup", async () => {

        if (!moved) return;

        const rect = bubble.getBoundingClientRect();

        await saveSetting("bubblePosition", {
            left: rect.left + "px",
            top: rect.top + "px"
        });
    });

    bubble.addEventListener("click", event => {

        if (moved) {
            event.stopImmediatePropagation();
            event.preventDefault();
        }
    }, true);
}

/* =====================================================
   AUTO RUN
===================================================== */

async function runEnabledExtensions() {

    if (!settings.autoRun) return;

    const list = await DB.all();

    for (const item of list) {

        if (item.enabled) {
            await executeExtension(item);
        }
    }
}

/* =====================================================
   EVENT HANDLERS
===================================================== */

function bindEvents() {

    bindNavigation();

    $("bubble").onclick = () => {
        $("app").classList.toggle("show");
    };

    $("close").onclick = () => {
        $("app").classList.remove("show");
    };

    $("minimize").onclick = () => {
        $("app").classList.remove("show");
    };

    $("storeSearch").oninput = renderStoreCards;
    $("installedSearch").oninput = renderInstalled;

    $("refreshStore").onclick = () => loadStore(true);

    $("saveCode").onclick = saveCustomExtension;
    $("testCode").onclick = testCustomExtension;

    $("clearCode").onclick = () => {

        if (!confirm("Clear editor?")) return;

        $("editId").value = "";
        $("editName").value = "";
        $("editDescription").value = "";
        $("codeEditor").value = "";
    };

    $("themeSwitch").onclick = async () => {

        await saveSetting(
            "theme",
            settings.theme === "dark" ? "light" : "dark"
        );

        renderSettings();
    };

    $("accentColor").oninput = event => {
        saveSetting("accent", event.target.value);
    };

    $("bubbleSwitch").onclick = async () => {
        await saveSetting("bubble", !settings.bubble);
        renderSettings();
    };

    $("bubbleSize").oninput = event => {
        saveSetting("bubbleSize", Number(event.target.value));
    };

    $("bubbleOpacity").oninput = event => {
        saveSetting("bubbleOpacity", Number(event.target.value));
    };

    $("resetBubble").onclick = async () => {

        await saveSetting("bubblePosition", null);

        $("bubble").style.left = "";
        $("bubble").style.top = "";
        $("bubble").style.right = "20px";
        $("bubble").style.bottom = "90px";

        toast("Bubble position reset");
    };

    $("autoSwitch").onclick = async () => {

        await saveSetting("autoRun", !settings.autoRun);

        renderSettings();
    };

    $("confirmSwitch").onclick = async () => {

        await saveSetting(
            "confirmDelete",
            !settings.confirmDelete
        );

        renderSettings();
    };

    $("exportBackup").onclick = exportBackup;

    $("importBackup").onclick = () => {
        $("backupFile").click();
    };

    $("backupFile").onchange = event => {

        const file = event.target.files[0];

        if (file) importBackup(file);

        event.target.value = "";
    };

    $("factoryReset").onclick = async () => {

        if (!confirm(
            "Factory Reset will delete all installed extensions, settings and caches. Continue?"
        )) return;

        for (const id of [...runtime.keys()]) {
            await stopExtension(id);
        }

        await DB.reset();

        settings = { ...DEFAULT_SETTINGS };

        applySettings();
        renderSettings();
        renderInstalled();
        renderHome();

        toast("Factory Reset completed");
    };
}

/* =====================================================
   INITIALIZATION
===================================================== */

async function init() {

    try {

        await openDatabase();

        await loadSettings();

        applySettings();

        bindEvents();

        makeBubbleDraggable();

        await loadStore();

        renderCategories();

        renderHome();

        renderInstalled();

        renderSettings();

        await runEnabledExtensions();

        console.log(
            "MistaX V" + VERSION + " initialized successfully"
        );

    } catch (error) {

        console.error("MistaX initialization error:", error);

        toast("MistaX initialization failed: " + error.message);
    }
}

init();

})();