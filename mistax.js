(() => {
"use strict";

const APP = "MistaX";
const VERSION = "1.0.0";
const DB_NAME = "MistaXStore";
const DB_VERSION = 2;

const REPO = "https://cdn.jsdelivr.net/gh/Bedardi/MistaX@main/";
const STORE_URL = REPO + "store.json";

const CONTACT = {
    email: "support@mistahub.in",
    phone: "917870692939",
    telegram: "https://t.me/mistahub"
};

const existing = document.getElementById("mistax-host");

if (existing) {
    existing.shadowRoot.querySelector("#app").classList.add("show");
    return;
}

const host = document.createElement("div");
host.id = "mistax-host";

Object.assign(host.style, {
    position: "fixed",
    inset: "0",
    zIndex: "2147483647",
    pointerEvents: "none"
});

document.documentElement.appendChild(host);

const shadow = host.attachShadow({ mode: "open" });

shadow.innerHTML = `
<style>
* {
    box-sizing: border-box;
}

:host {
    font-family: Inter, system-ui, Arial, sans-serif;
}

#bubble {
    position: fixed;
    right: 18px;
    bottom: 85px;
    width: 55px;
    height: 55px;
    border-radius: 19px;
    background: #6750a4;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    font-weight: 900;
    box-shadow: 0 5px 25px #0005;
    cursor: pointer;
    pointer-events: auto;
    user-select: none;
    touch-action: none;
}

#app {
    display: none;
    position: fixed;
    inset: 0;
    background: #101114;
    color: #f5f3fa;
    pointer-events: auto;
    overflow: hidden;
    flex-direction: column;
}

#app.show {
    display: flex;
}

#app.light {
    background: #f6f4fa;
    color: #17151c;
}

#top {
    height: 62px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 17px;
    border-bottom: 1px solid #ffffff17;
}

.brand {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 19px;
    font-weight: 850;
}

.logo {
    width: 35px;
    height: 35px;
    display: grid;
    place-items: center;
    background: #6750a4;
    color: white;
    border-radius: 12px;
}

.iconbtn {
    background: transparent;
    border: 0;
    color: inherit;
    font-size: 23px;
    cursor: pointer;
}

#body {
    flex: 1;
    overflow-y: auto;
    padding: 18px;
    padding-bottom: 25px;
}

#nav {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    min-height: 66px;
    border-top: 1px solid #ffffff18;
    background: #17181d;
    flex-shrink: 0;
}

.light #nav {
    background: white;
}

.navitem {
    border: 0;
    background: transparent;
    color: #aaa5b5;
    font-size: 11px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
    cursor: pointer;
}

.navitem span:first-child {
    font-size: 21px;
}

.navitem.active {
    color: #c5aaff;
}

.light .navitem.active {
    color: #6750a4;
}

h1 {
    font-size: 25px;
    margin: 5px 0 8px;
}

h2 {
    font-size: 18px;
    margin: 23px 0 12px;
}

p {
    color: #aaa6b5;
    font-size: 13px;
    line-height: 1.6;
}

.light p {
    color: #686473;
}

.card {
    background: #1d1e24;
    border: 1px solid #ffffff12;
    padding: 15px;
    border-radius: 19px;
    margin-bottom: 12px;
}

.light .card {
    background: white;
    border-color: #00000010;
}

.grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 11px;
}

.stat {
    padding: 17px;
    border-radius: 17px;
    background: #22232b;
}

.light .stat {
    background: white;
}

.stat strong {
    display: block;
    font-size: 25px;
}

.stat small {
    color: #aaa6b5;
}

button, input, textarea, select {
    font: inherit;
}

.btn {
    border: 0;
    background: #6750a4;
    color: white;
    padding: 11px 16px;
    border-radius: 13px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 700;
}

.btn.secondary {
    background: #34313f;
}

.light .btn.secondary {
    background: #eae6f2;
    color: #292431;
}

.btn.danger {
    background: #a83248;
}

.input {
    width: 100%;
    background: #25262d;
    color: inherit;
    border: 1px solid #ffffff20;
    border-radius: 12px;
    padding: 13px;
    margin: 7px 0;
    outline: none;
}

.light .input {
    background: white;
    border-color: #00000020;
}

.extension {
    display: flex;
    align-items: center;
    gap: 12px;
}

.exticon {
    width: 47px;
    height: 47px;
    border-radius: 14px;
    background: #34313f;
    display: grid;
    place-items: center;
    font-size: 24px;
    flex-shrink: 0;
}

.extinfo {
    flex: 1;
    min-width: 0;
}

.extinfo strong {
    display: block;
    font-size: 14px;
}

.extinfo small {
    color: #aaa6b5;
    font-size: 11px;
}

.actions {
    display: flex;
    gap: 7px;
    margin-top: 12px;
    flex-wrap: wrap;
}

.switch {
    width: 43px;
    height: 25px;
    border-radius: 30px;
    background: #555;
    position: relative;
    cursor: pointer;
    flex-shrink: 0;
}

.switch.on {
    background: #6750a4;
}

.switch:after {
    content: "";
    position: absolute;
    top: 3px;
    left: 3px;
    width: 19px;
    height: 19px;
    border-radius: 50%;
    background: white;
    transition: .2s;
}

.switch.on:after {
    left: 21px;
}

.section {
    display: none;
}

.section.active {
    display: block;
}

.empty {
    padding: 35px 15px;
    text-align: center;
    color: #aaa6b5;
}

#toast {
    position: fixed;
    bottom: 85px;
    left: 50%;
    transform: translateX(-50%);
    background: #32313b;
    color: white;
    padding: 12px 18px;
    border-radius: 14px;
    font-size: 12px;
    display: none;
    z-index: 999;
    max-width: 85%;
}

#editor {
    width: 100%;
    min-height: 250px;
    resize: vertical;
    font-family: monospace;
    font-size: 12px;
    line-height: 1.6;
}

a {
    color: #c5aaff;
    text-decoration: none;
}

@media(min-width:650px) {
    #app {
        inset: auto 20px 20px auto;
        width: 430px;
        height: min(750px, 90vh);
        border-radius: 25px;
        border: 1px solid #ffffff20;
        box-shadow: 0 15px 70px #0008;
    }

    #bubble {
        right: 25px;
        bottom: 25px;
    }
}
</style>

<div id="bubble">M</div>

<div id="app">
    <div id="top">
        <div class="brand">
            <div class="logo">M</div>
            <span>MistaX</span>
        </div>
        <button class="iconbtn" id="close">×</button>
    </div>

    <div id="body">

        <section class="section active" id="home">
            <h1>Welcome to MistaX</h1>
            <p>Your mini extension manager. Customize your browsing experience.</p>

            <div class="grid">
                <div class="stat">
                    <strong id="installedCount">0</strong>
                    <small>Installed</small>
                </div>
                <div class="stat">
                    <strong id="activeCount">0</strong>
                    <small>Running</small>
                </div>
            </div>

            <h2>Quick Actions</h2>

            <div class="card">
                <strong>Discover Extensions</strong>
                <p>Explore verified extensions from the MistaX Store.</p>
                <button class="btn" data-go="store">Explore Store</button>
            </div>

            <div class="card">
                <strong>Create Extension</strong>
                <p>Write and save your own JavaScript extension.</p>
                <button class="btn" data-go="editor">Open Editor</button>
            </div>

            <h2>Recently Installed</h2>
            <div id="recent"></div>
        </section>

        <section class="section" id="store">
            <h1>Extension Store</h1>
            <p>Extensions verified and published by MistaHub.</p>

            <input class="input" id="storeSearch" placeholder="Search extensions...">

            <div id="storeList">
                <div class="empty">Loading Store...</div>
            </div>

            <button class="btn secondary" id="refreshStore">Refresh Store</button>
        </section>

        <section class="section" id="installed">
            <h1>My Extensions</h1>
            <p>Manage your installed extensions.</p>

            <input class="input" id="installedSearch" placeholder="Search installed extensions...">

            <div id="installedList"></div>
        </section>

        <section class="section" id="editorPage">
            <h1>Extension Editor</h1>
            <p>Create your own custom JavaScript extension.</p>

            <input class="input" id="editId" placeholder="Extension ID (e.g. my-tool)">
            <input class="input" id="editName" placeholder="Extension name">
            <input class="input" id="editDesc" placeholder="Description">
            <textarea class="input" id="editor" spellcheck="false"
                placeholder="// Write your JavaScript here

// Example:
console.log('My extension is running!');"></textarea>

            <div class="actions">
                <button class="btn" id="saveExtension">Save Extension</button>
                <button class="btn secondary" id="testExtension">Test Code</button>
                <button class="btn secondary" id="clearEditor">Clear</button>
            </div>

            <h2>Extension API</h2>
            <div class="card">
                <code>api.toast("Hello")</code><br><br>
                <code>api.log("Message")</code><br><br>
                <code>api.onCleanup(callback)</code><br><br>
                <code>api.element</code>
            </div>
        </section>

        <section class="section" id="settings">
            <h1>Settings</h1>

            <h2>Appearance</h2>
            <div class="card">
                <div class="extension">
                    <div class="extinfo">
                        <strong>Dark Mode</strong>
                        <small>Change MistaX appearance</small>
                    </div>
                    <div class="switch" id="themeSwitch"></div>
                </div>
            </div>

            <h2>Extension Settings</h2>
            <div class="card">
                <div class="extension">
                    <div class="extinfo">
                        <strong>Auto Run</strong>
                        <small>Run enabled extensions when MistaX starts</small>
                    </div>
                    <div class="switch" id="autoSwitch"></div>
                </div>
            </div>

            <div class="card">
                <div class="extension">
                    <div class="extinfo">
                        <strong>Confirm Before Uninstall</strong>
                        <small>Ask before deleting an extension</small>
                    </div>
                    <div class="switch" id="confirmSwitch"></div>
                </div>
            </div>

            <h2>Backup & Restore</h2>
            <div class="card">
                <button class="btn" id="exportData">Export Backup</button>
                <button class="btn secondary" id="importButton">Import Backup</button>
                <input type="file" id="importFile" accept=".json,application/json" hidden>
            </div>

            <h2>Storage</h2>
            <div class="card">
                <strong id="storageCount">0 extensions</strong>
                <p>Your extensions are stored locally in IndexedDB.</p>
            </div>

            <h2>Contact MistaHub</h2>
            <div class="card">
                <strong>Want your extension published?</strong>
                <p>Send your extension to MistaHub. Every submission is manually reviewed before publication.</p>

                <div class="actions">
                    <a class="btn" href="https://wa.me/${CONTACT.phone}" target="_blank">WhatsApp</a>
                    <a class="btn secondary" href="mailto:${CONTACT.email}">Email</a>
                    <a class="btn secondary" href="${CONTACT.telegram}" target="_blank">Telegram</a>
                </div>

                <p>${CONTACT.email}</p>
                <p>Mobile / WhatsApp: +91 78706 92939</p>
            </div>

            <h2>Danger Zone</h2>
            <div class="card">
                <p>Factory reset permanently deletes your locally installed extensions and settings.</p>
                <button class="btn danger" id="factoryReset">Factory Reset</button>
            </div>

            <p style="text-align:center">MistaX ${VERSION} · By MistaHub</p>
        </section>

    </div>

    <div id="nav">
        <button class="navitem active" data-page="home">
            <span>⌂</span>Home
        </button>
        <button class="navitem" data-page="store">
            <span>▣</span>Store
        </button>
        <button class="navitem" data-page="installed">
            <span>◈</span>Installed
        </button>
        <button class="navitem" data-page="editorPage">
            <span>✎</span>Editor
        </button>
        <button class="navitem" data-page="settings">
            <span>⚙</span>Settings
        </button>
    </div>
</div>

<div id="toast"></div>
`;

const $ = id => shadow.getElementById(id);

let db;
let catalogue = [];
let currentPage = "home";

const runtime = new Map();

const defaults = {
    dark: true,
    autoRun: false,
    confirmDelete: true
};

let settings = { ...defaults };

function toast(message) {
    const el = $("toast");
    el.textContent = message;
    el.style.display = "block";

    clearTimeout(toast.timer);

    toast.timer = setTimeout(() => {
        el.style.display = "none";
    }, 2600);
}

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = event => {
            const database = event.target.result;

            if (!database.objectStoreNames.contains("extensions")) {
                database.createObjectStore("extensions", {
                    keyPath: "id"
                });
            }

            if (!database.objectStoreNames.contains("settings")) {
                database.createObjectStore("settings", {
                    keyPath: "key"
                });
            }
        };

        request.onsuccess = () => {
            db = request.result;

            db.onversionchange = () => db.close();

            resolve(db);
        };

        request.onerror = () => reject(request.error);
    });
}

function request(store, mode, action) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(store, mode);
        const req = action(tx.objectStore(store));

        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

const DB = {
    all: () => request("extensions", "readonly", s => s.getAll()),
    get: id => request("extensions", "readonly", s => s.get(id)),
    save: item => request("extensions", "readwrite", s => s.put(item)),
    remove: id => request("extensions", "readwrite", s => s.delete(id)),

    getSetting: key => request("settings", "readonly", s => s.get(key)),

    saveSetting: (key, value) => request(
        "settings",
        "readwrite",
        s => s.put({ key, value })
    ),

    clear: async () => {
        await request("extensions", "readwrite", s => s.clear());
        await request("settings", "readwrite", s => s.clear());
    }
};

async function loadSettings() {
    for (const key of Object.keys(defaults)) {
        const result = await DB.getSetting(key);

        if (result) settings[key] = result.value;
    }

    applyTheme();

    updateSwitch("themeSwitch", settings.dark);
    updateSwitch("autoSwitch", settings.autoRun);
    updateSwitch("confirmSwitch", settings.confirmDelete);
}

function updateSwitch(id, value) {
    $(id).classList.toggle("on", !!value);
}

function applyTheme() {
    $("app").classList.toggle("light", !settings.dark);
}

async function setSetting(key, value) {
    settings[key] = value;

    await DB.saveSetting(key, value);

    applyTheme();
}

function showPage(page) {
    currentPage = page;

    shadow.querySelectorAll(".section").forEach(section => {
        section.classList.remove("active");
    });

    shadow.querySelectorAll(".navitem").forEach(item => {
        item.classList.toggle("active", item.dataset.page === page);
    });

    $(page).classList.add("active");

    if (page === "installed") renderInstalled();
    if (page === "store") renderStore();
    if (page === "home") renderHome();
    if (page === "settings") renderStats();
}

function makeAPI(id) {
    const cleanups = [];

    return {
        element: document.documentElement,

        toast,

        log: (...args) => console.log("[MistaX:" + id + "]", ...args),

        onCleanup(fn) {
            if (typeof fn === "function") cleanups.push(fn);
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
            for (const fn of cleanups.reverse()) {
                try {
                    fn();
                } catch (error) {
                    console.error(error);
                }
            }
        }
    };
}

async function executeExtension(item) {
    const id = item.id;

    if (runtime.has(id)) {
        const state = runtime.get(id);

        toast(state.status === "running"
            ? "Extension is already running"
            : "Extension is starting");

        return;
    }

    const state = {
        status: "starting",
        cleanup: null,
        promise: null
    };

    runtime.set(id, state);

    state.promise = (async () => {
        const api = makeAPI(id);

        try {
            const runner = new Function(
                "api",
                '"use strict";\n' + item.code
            );

            const result = runner(api);

            if (result && typeof result.then === "function") {
                const cleanup = await result;

                if (typeof cleanup === "function") {
                    api.onCleanup(cleanup);
                }
            } else if (typeof result === "function") {
                api.onCleanup(result);
            }

            if (runtime.get(id) !== state) {
                api.cleanup();
                return;
            }

            state.cleanup = () => api.cleanup();
            state.status = "running";

            toast(item.name + " is running");

        } catch (error) {
            api.cleanup();

            if (runtime.get(id) === state) {
                runtime.delete(id);
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
        if (state.cleanup) state.cleanup();
    } catch (error) {
        console.error(error);
    }

    runtime.delete(id);

    toast("Extension stopped");
}

async function toggleExtension(id) {
    const item = await DB.get(id);

    if (!item) return;

    if (runtime.has(id)) {
        await stopExtension(id);
    } else {
        await executeExtension(item);
    }

    renderInstalled();
    renderHome();
}

async function installExtension(extension) {
    try {
        const response = await fetch(extension.script, {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("Script download failed");
        }

        const code = await response.text();

        if (!code.trim()) throw new Error("Empty extension script");

        const item = {
            id: extension.id,
            name: extension.name,
            description: extension.description,
            icon: extension.icon || "🧩",
            version: extension.version,
            category: extension.category || "Other",
            code,
            enabled: false,
            installedAt: Date.now(),
            updatedAt: Date.now(),
            source: "store"
        };

        await DB.save(item);

        toast(extension.name + " installed");

        renderStore();
        renderInstalled();
        renderHome();

    } catch (error) {
        console.error(error);
        toast("Install failed: " + error.message);
    }
}

async function uninstallExtension(id) {
    if (settings.confirmDelete &&
        !confirm("Uninstall this extension?")) return;

    await stopExtension(id);
    await DB.remove(id);

    toast("Extension uninstalled");

    renderInstalled();
    renderHome();
}

async function updateExtension(extension) {
    const old = await DB.get(extension.id);

    if (!old) return installExtension(extension);

    try {
        const response = await fetch(extension.script, {
            cache: "no-store"
        });

        if (!response.ok) throw new Error("Download failed");

        const code = await response.text();

        await stopExtension(extension.id);

        await DB.save({
            ...old,
            name: extension.name,
            description: extension.description,
            icon: extension.icon || old.icon,
            version: extension.version,
            code,
            updatedAt: Date.now()
        });

        toast("Extension updated");
        renderInstalled();

    } catch (error) {
        toast("Update failed: " + error.message);
    }
}

async function loadStore() {
    try {
        const response = await fetch(
            STORE_URL + "?t=" + Date.now(),
            { cache: "no-store" }
        );

        if (!response.ok) throw new Error("Store unavailable");

        const data = await response.json();

        if (!Array.isArray(data.extensions)) {
            throw new Error("Invalid store.json");
        }

        catalogue = data.extensions.filter(item =>
            item.id &&
            item.name &&
            item.version &&
            typeof item.script === "string" &&
            item.script.startsWith("https://cdn.jsdelivr.net/")
        );

        renderStore();

    } catch (error) {
        console.error(error);

        $("storeList").innerHTML =
            '<div class="empty">Unable to load Store. Check your internet connection.</div>';
    }
}

async function renderStore() {
    if (!catalogue.length) {
        await loadStore();
        return;
    }

    const installed = await DB.all();

    const query = $("storeSearch").value.toLowerCase();

    const filtered = catalogue.filter(item =>
        (item.name + " " + item.description + " " + item.category)
            .toLowerCase().includes(query)
    );

    $("storeList").innerHTML = "";

    if (!filtered.length) {
        $("storeList").innerHTML =
            '<div class="empty">No extensions found.</div>';
        return;
    }

    for (const item of filtered) {
        const old = installed.find(x => x.id === item.id);

        const card = document.createElement("div");
        card.className = "card";

        card.innerHTML = `
            <div class="extension">
                <div class="exticon"></div>
                <div class="extinfo">
                    <strong></strong>
                    <small></small>
                </div>
            </div>
            <p></p>
            <div class="actions"></div>
        `;

        card.querySelector(".exticon").textContent = item.icon || "🧩";
        card.querySelector(".extinfo strong").textContent = item.name;
        card.querySelector(".extinfo small").textContent =
            item.category + " · v" + item.version;

        card.querySelector("p").textContent = item.description;

        const actions = card.querySelector(".actions");
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
            button.style.opacity = ".6";
        }

        actions.appendChild(button);
        $("storeList").appendChild(card);
    }
}

async function renderInstalled() {
    const list = await DB.all();

    const query = $("installedSearch").value.toLowerCase();

    const filtered = list.filter(item =>
        (item.name + " " + item.description)
            .toLowerCase().includes(query)
    );

    $("installedList").innerHTML = "";

    if (!filtered.length) {
        $("installedList").innerHTML =
            '<div class="empty">No extensions installed yet.</div>';
        return;
    }

    for (const item of filtered) {
        const running = runtime.has(item.id);

        const card = document.createElement("div");
        card.className = "card";

        card.innerHTML = `
            <div class="extension">
                <div class="exticon"></div>
                <div class="extinfo">
                    <strong></strong>
                    <small></small>
                </div>
                <div class="switch"></div>
            </div>
            <p></p>
            <div class="actions">
                <button class="btn secondary edit">Edit</button>
                <button class="btn danger delete">Uninstall</button>
            </div>
        `;

        card.querySelector(".exticon").textContent = item.icon || "🧩";
        card.querySelector(".extinfo strong").textContent = item.name;
        card.querySelector(".extinfo small").textContent =
            "v" + item.version + " · " + (running ? "Running" : "Stopped");

        card.querySelector("p").textContent = item.description || "";

        const sw = card.querySelector(".switch");

        sw.classList.toggle("on", running);

        sw.onclick = () => toggleExtension(item.id);

        card.querySelector(".delete").onclick =
            () => uninstallExtension(item.id);

        card.querySelector(".edit").onclick = () => {
            $("editId").value = item.id;
            $("editName").value = item.name;
            $("editDesc").value = item.description || "";
            $("editor").value = item.code;

            showPage("editorPage");
        };

        $("installedList").appendChild(card);
    }

    $("installedCount").textContent = list.length;
    $("activeCount").textContent = runtime.size;
}

async function renderHome() {
    const list = await DB.all();

    $("installedCount").textContent = list.length;
    $("activeCount").textContent = runtime.size;

    const recent = list.slice().sort((a, b) =>
        (b.installedAt || 0) - (a.installedAt || 0)
    ).slice(0, 3);

    $("recent").innerHTML = "";

    if (!recent.length) {
        $("recent").innerHTML =
            '<div class="empty">Your installed extensions will appear here.</div>';
        return;
    }

    recent.forEach(item => {
        const div = document.createElement("div");
        div.className = "card extension";

        const icon = document.createElement("div");
        icon.className = "exticon";
        icon.textContent = item.icon || "🧩";

        const info = document.createElement("div");
        info.className = "extinfo";

        const name = document.createElement("strong");
        name.textContent = item.name;

        const version = document.createElement("small");
        version.textContent = "v" + item.version;

        info.append(name, version);
        div.append(icon, info);

        $("recent").appendChild(div);
    });
}

async function renderStats() {
    const list = await DB.all();

    $("storageCount").textContent =
        list.length + " installed extensions";
}

async function saveCustomExtension() {
    const id = $("editId").value.trim().toLowerCase();
    const name = $("editName").value.trim();
    const description = $("editDesc").value.trim();
    const code = $("editor").value;

    if (!/^[a-z0-9-]{2,40}$/.test(id)) {
        return toast("Use a valid ID: letters, numbers and hyphens");
    }

    if (!name || !code.trim()) {
        return toast("Name and code are required");
    }

    const old = await DB.get(id);

    if (old && old.source === "store") {
        return toast("Store extensions cannot be overwritten in Editor");
    }

    await DB.save({
        id,
        name,
        description,
        code,
        icon: "🧩",
        version: old ? old.version : "1.0.0",
        enabled: false,
        installedAt: old ? old.installedAt : Date.now(),
        updatedAt: Date.now(),
        source: "custom"
    });

    toast("Extension saved");

    renderInstalled();
    renderHome();
}

async function testCustomExtension() {
    const code = $("editor").value;

    if (!code.trim()) return toast("Write some code first");

    const api = makeAPI("editor-test");

    try {
        const result = new Function("api", '"use strict";\n' + code)(api);

        if (result && typeof result.then === "function") {
            const cleanup = await result;
            if (typeof cleanup === "function") api.onCleanup(cleanup);
        } else if (typeof result === "function") {
            api.onCleanup(result);
        }

        toast("Test executed. Effects may remain until cleanup or page reload.");
        window.setTimeout(() => api.cleanup(), 1000);

    } catch (error) {
        api.cleanup();
        toast("Error: " + error.message);
    }
}

async function exportBackup() {
    const list = await DB.all();

    const data = {
        app: APP,
        version: VERSION,
        exportedAt: new Date().toISOString(),
        extensions: list,
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

    URL.revokeObjectURL(url);
    toast("Backup exported");
}

async function importBackup(file) {
    try {
        const data = JSON.parse(await file.text());

        if (!Array.isArray(data.extensions)) {
            throw new Error("Invalid backup file");
        }

        for (const item of data.extensions) {
            if (!item.id || typeof item.code !== "string") continue;

            await DB.save({
                ...item,
                source: item.source || "custom"
            });
        }

        if (data.settings && typeof data.settings === "object") {
            for (const key of Object.keys(defaults)) {
                if (typeof data.settings[key] === "boolean") {
                    await setSetting(key, data.settings[key]);
                }
            }
        }

        toast("Backup imported");

        renderInstalled();
        renderHome();

    } catch (error) {
        toast("Import failed: " + error.message);
    }
}

function bindEvents() {
    $("bubble").onclick = () => {
        $("app").classList.toggle("show");
    };

    $("close").onclick = () => {
        $("app").classList.remove("show");
    };

    shadow.querySelectorAll("[data-page]").forEach(button => {
        button.onclick = () => showPage(button.dataset.page);
    });

    shadow.querySelectorAll("[data-go]").forEach(button => {
        button.onclick = () => showPage(button.dataset.go);
    });

    $("storeSearch").oninput = renderStore;
    $("installedSearch").oninput = renderInstalled;

    $("refreshStore").onclick = () => {
        catalogue = [];
        loadStore();
    };

    $("saveExtension").onclick = saveCustomExtension;
    $("testExtension").onclick = testCustomExtension;

    $("clearEditor").onclick = () => {
        if (!confirm("Clear editor?")) return;

        $("editId").value = "";
        $("editName").value = "";
        $("editDesc").value = "";
        $("editor").value = "";
    };

    $("themeSwitch").onclick = async () => {
        await setSetting("dark", !settings.dark);
        updateSwitch("themeSwitch", settings.dark);
    };

    $("autoSwitch").onclick = async () => {
        await setSetting("autoRun", !settings.autoRun);
        updateSwitch("autoSwitch", settings.autoRun);
    };

    $("confirmSwitch").onclick = async () => {
        await setSetting("confirmDelete", !settings.confirmDelete);
        updateSwitch("confirmSwitch", settings.confirmDelete);
    };

    $("exportData").onclick = exportBackup;

    $("importButton").onclick = () => $("importFile").click();

    $("importFile").onchange = event => {
        const file = event.target.files[0];
        if (file) importBackup(file);
        event.target.value = "";
    };

    $("factoryReset").onclick = async () => {
        if (!confirm("Factory Reset? All installed extensions and settings will be deleted.")) return;

        for (const id of [...runtime.keys()]) {
            await stopExtension(id);
        }

        await DB.clear();

        settings = { ...defaults };

        await loadSettings();

        toast("Factory reset complete");

        renderInstalled();
        renderHome();
        renderStats();
    };
}

function makeDraggable() {
    const bubble = $("bubble");

    let startX = 0;
    let startY = 0;
    let initialX = 0;
    let initialY = 0;
    let dragging = false;

    const saved = localStorage.getItem("mistax-bubble-position");

    if (saved) {
        try {
            const pos = JSON.parse(saved);

            bubble.style.left = pos.left;
            bubble.style.top = pos.top;
            bubble.style.right = "auto";
            bubble.style.bottom = "auto";
        } catch (_) {}
    }

    bubble.addEventListener("pointerdown", event => {
        dragging = false;

        startX = event.clientX;
        startY = event.clientY;

        const rect = bubble.getBoundingClientRect();

        initialX = rect.left;
        initialY = rect.top;

        bubble.setPointerCapture(event.pointerId);
    });

    bubble.addEventListener("pointermove", event => {
        if (!bubble.hasPointerCapture(event.pointerId)) return;

        const dx = event.clientX - startX;
        const dy = event.clientY - startY;

        if (Math.abs(dx) + Math.abs(dy) > 6) dragging = true;

        if (!dragging) return;

        const x = Math.max(0, Math.min(innerWidth - 60, initialX + dx));
        const y = Math.max(0, Math.min(innerHeight - 60, initialY + dy));

        bubble.style.left = x + "px";
        bubble.style.top = y + "px";
        bubble.style.right = "auto";
        bubble.style.bottom = "auto";
    });

    bubble.addEventListener("pointerup", () => {
        if (dragging) {
            localStorage.setItem("mistax-bubble-position", JSON.stringify({
                left: bubble.style.left,
                top: bubble.style.top
            }));
        }
    });

    bubble.addEventListener("click", event => {
        if (dragging) {
            event.stopImmediatePropagation();
        }
    }, true);
}

async function autoRun() {
    if (!settings.autoRun) return;

    const list = await DB.all();

    for (const item of list) {
        if (item.enabled) {
            await executeExtension(item);
        }
    }
}

async function init() {
    try {
        await openDB();

        await loadSettings();

        bindEvents();
        makeDraggable();

        await loadStore();
        await renderHome();
        await renderInstalled();

        await autoRun();

        console.log("MistaX " + VERSION + " Ready");

    } catch (error) {
        console.error("MistaX initialization failed", error);
        toast("MistaX initialization failed");
    }
}

init();

})();