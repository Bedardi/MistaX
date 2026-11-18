(() => {
"use strict";

const VERSION = "4.0.0";
const DB_NAME = "MistaXStore";
const DB_VERSION = 4;
const REPO = "https://cdn.jsdelivr.net/gh/Bedardi/MistaX@main/";
const STORE_URL = REPO + "store.json";
const APP_ID = "mistax-host";

const CONTACT = {
    email: "support@mistahub.in",
    phone: "917870692939",
    telegram: "https://t.me/mistahub"
};

const previous = document.getElementById(APP_ID);
if (previous) previous.remove();

let db;

function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = event => {
            const database = event.target.result;

            const stores = [
                ["extensions", { keyPath: "id" }],
                ["settings", { keyPath: "key" }],
                ["storeCache", { keyPath: "key" }],
                ["scriptCache", { keyPath: "id" }],
                ["metadata", { keyPath: "key" }]
            ];

            stores.forEach(([name, options]) => {
                if (!database.objectStoreNames.contains(name)) {
                    database.createObjectStore(name, options);
                }
            });
        };

        request.onsuccess = () => {
            db = request.result;
            db.onversionchange = () => db.close();
            resolve(db);
        };

        request.onerror = () => reject(request.error);
        request.onblocked = () => console.warn("MistaX database upgrade blocked");
    });
}

function dbRequest(store, method, value) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(store, method === "get" || method === "getAll" ? "readonly" : "readwrite");
        const objectStore = tx.objectStore(store);
        let request;

        if (method === "getAll") request = objectStore.getAll();
        else if (method === "get") request = objectStore.get(value);
        else if (method === "delete") request = objectStore.delete(value);
        else if (method === "clear") request = objectStore.clear();
        else request = objectStore.put(value);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function dbBatch(stores, callback) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(stores, "readwrite");

        try {
            callback(tx);
        } catch (error) {
            tx.abort();
            reject(error);
            return;
        }

        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || new Error("Transaction aborted"));
    });
}

const DB = {
    all: () => dbRequest("extensions", "getAll"),
    get: id => dbRequest("extensions", "get", id),
    save: item => dbRequest("extensions", "put", item),
    remove: id => dbRequest("extensions", "delete", id),
    setting: key => dbRequest("settings", "get", key),
    setSetting: (key, value) => dbRequest("settings", "put", { key, value }),
    getStore: () => dbRequest("storeCache", "get", "catalogue"),
    setStore: data => dbRequest("storeCache", "put", {
        key: "catalogue",
        data,
        cachedAt: Date.now()
    }),
    getScript: id => dbRequest("scriptCache", "get", id),
    setScript: item => dbRequest("scriptCache", "put", item),
    reset: () => dbBatch(
        ["extensions", "settings", "storeCache", "scriptCache", "metadata"],
        tx => {
            ["extensions", "settings", "storeCache", "scriptCache", "metadata"]
                .forEach(name => tx.objectStore(name).clear());
        }
    )
};

const DEFAULT_SETTINGS = {
    theme: "light",
    accent: "#7155C8",
    autoRun: false,
    confirmDelete: true,
    bubble: true,
    bubbleSize: 58,
    bubbleOpacity: 100,
    bubblePosition: null,
    storeAutoRefresh: true
};

let settings = { ...DEFAULT_SETTINGS };
let catalogue = [];
let selectedCategory = "All";
let currentPage = "home";
let selectedExtension = null;
let storeLoading = false;
const runtime = new Map();

const host = document.createElement("div");
host.id = APP_ID;
host.style.cssText = "position:fixed;inset:0;z-index:2147483647;pointer-events:none;";
document.documentElement.appendChild(host);

const shadow = host.attachShadow({ mode: "open" });
const $ = id => shadow.getElementById(id);

function svg(name, size = 22) {
    const paths = {
        home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
        store: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M8 4v16M16 4v16M3 10h18"/>',
        extensions: '<path d="M12 3 21 12l-9 9-9-9z"/><circle cx="12" cy="12" r="2"/>',
        editor: '<path d="m15 5 4 4M4 20l4-.8L19 8a2.8 2.8 0 0 0-4-4L4 15z"/><path d="M13 20h8"/>',
        settings: '<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.5 2.6-1.7-.7a8 8 0 0 1-1.7 1l-.3 1.9h-3l-.3-1.9a8 8 0 0 1-1.7-1l-1.7.7-1.5-2.6 1.4-1.1a8 8 0 0 1 0-2l-1.4-1.1 1.5-2.6 1.7.7a8 8 0 0 1 1.7-1L12.7 7h3l.3 1.9a8 8 0 0 1 1.7 1l1.7-.7 1.5 2.6-1.4 1.1a8 8 0 0 1-.1 2z"/>',
        search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
        close: '<path d="m6 6 12 12M18 6 6 18"/>',
        back: '<path d="m15 18-6-6 6-6"/>',
        arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
        download: '<path d="M12 3v12m-5-5 5 5 5-5"/><path d="M4 17v3h16v-3"/>',
        check: '<path d="m5 12 4 4L19 6"/>',
        refresh: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.5 9a7 7 0 0 1 12-2L20 12M4 12l2.5 5a7 7 0 0 0 12-2"/>',
        trash: '<path d="M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3"/>',
        moon: '<path d="M20 15A8 8 0 0 1 9 4a8 8 0 1 0 11 11z"/>',
        sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
        menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
        info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-9h.01"/>'
    };

    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.info}</svg>`;
}

shadow.innerHTML = `
<style>
*{box-sizing:border-box}
:host{font-family:Inter,system-ui,-apple-system,sans-serif;color-scheme:light}
#bubble{position:fixed;right:20px;bottom:95px;width:58px;height:58px;border-radius:20px;background:var(--accent,#7155C8);color:white;display:flex;align-items:center;justify-content:center;font-size:23px;font-weight:900;box-shadow:0 8px 30px #0003;pointer-events:auto;cursor:grab;user-select:none;touch-action:none;z-index:10;transition:transform .25s,box-shadow .25s}
#bubble:active{transform:scale(.91)}
#app{--accent:#7155C8;--bg:#F7F5FC;--surface:#fff;--text:#211D2B;--muted:#817B8D;--border:#EAE6F1;position:fixed;inset:0;display:none;flex-direction:column;background:var(--bg);color:var(--text);overflow:hidden;pointer-events:auto;z-index:20;color-scheme:light}
#app.dark{--bg:#101018;--surface:#1B1A26;--text:#F5F1FC;--muted:#A9A3B5;--border:#302D3B;color-scheme:dark}
#app.show{display:flex;animation:appIn .28s ease}
@keyframes appIn{from{opacity:0;transform:translateY(15px) scale(.985)}to{opacity:1;transform:none}}
button,input,textarea{font:inherit}
button{cursor:pointer}
#header{height:68px;display:flex;align-items:center;justify-content:space-between;padding:0 18px;border-bottom:1px solid var(--border);flex-shrink:0;background:var(--surface)}
.brand{display:flex;align-items:center;gap:11px;font-size:21px;font-weight:850;letter-spacing:-.7px}
.logo{height:39px;width:39px;display:grid;place-items:center;border-radius:14px;background:linear-gradient(145deg,#9578EC,#5740A6);color:white;font-weight:900;font-size:22px;box-shadow:0 4px 13px #7155C844}
.header-actions{display:flex;gap:9px}
.iconbtn{width:39px;height:39px;border:0;border-radius:13px;background:var(--bg);color:var(--text);display:grid;place-items:center}
#content{flex:1;overflow-y:auto;padding:20px 18px 26px;overscroll-behavior:contain;scrollbar-width:thin}
.page{display:none}
.page.active{display:block;animation:pageIn .25s ease}
@keyframes pageIn{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:none}}
h1{font-size:27px;letter-spacing:-1px;margin:4px 0 7px}
h2{font-size:17px;margin:25px 0 13px;letter-spacing:-.3px}
p{font-size:13px;line-height:1.65;color:var(--muted)}
.hero{position:relative;overflow:hidden;padding:24px;border-radius:25px;background:linear-gradient(135deg,#34235F,#7659D1 70%,#9B80ED);color:white;margin-bottom:18px;box-shadow:0 10px 30px #7155C833}
.hero:after{content:"";position:absolute;width:170px;height:170px;border-radius:50%;right:-55px;top:-65px;background:#ffffff16;box-shadow:0 0 0 25px #ffffff09,0 0 0 50px #ffffff06}
.hero h1{font-size:27px;position:relative;z-index:1}
.hero p{color:#E6DFFF;max-width:230px;position:relative;z-index:1}
.hero .btn{position:relative;z-index:1;background:white;color:#493581}
.eyebrow{font-size:10px;font-weight:850;letter-spacing:1.5px;color:#E6DCFF}
.stats{display:grid;grid-template-columns:1fr 1fr;gap:11px}
.stat{padding:17px;border-radius:19px;background:var(--surface);border:1px solid var(--border);box-shadow:0 3px 12px #20143b06}
.stat strong{font-size:27px;display:block;letter-spacing:-1px}
.stat small{font-size:11px;color:var(--muted)}
.card{padding:16px;border-radius:20px;background:var(--surface);border:1px solid var(--border);margin-bottom:12px;box-shadow:0 4px 18px #21163c08;transition:transform .2s,border-color .2s,box-shadow .2s}
.card:active{transform:scale(.99)}
.extrow{display:flex;align-items:center;gap:12px;min-width:0}
.exticon{height:54px;width:54px;border-radius:17px;background:var(--bg);border:1px solid var(--border);display:grid;place-items:center;overflow:hidden;flex-shrink:0}
.exticon img{height:100%;width:100%;object-fit:cover}
.exticon .fallback{font-size:22px;font-weight:900;color:var(--accent)}
.extinfo{flex:1;min-width:0}
.extinfo strong{font-size:14px;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.extinfo small{font-size:11px;color:var(--muted);display:block;margin-top:5px}
.description{font-size:12px;margin:13px 0 0}
.btn{border:0;border-radius:13px;padding:12px 16px;background:var(--accent);color:white;font-size:12px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;gap:7px;transition:filter .2s,transform .2s}
.btn:active{transform:scale(.96)}
.btn.secondary{background:var(--bg);color:var(--text);border:1px solid var(--border)}
.btn.danger{background:#C43E59;color:white}
.btn:disabled{opacity:.55;cursor:not-allowed}
.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}
.input{display:block;width:100%;padding:14px 15px;border:1px solid var(--border);border-radius:14px;background:var(--surface);color:var(--text);outline:none;margin:10px 0;font-size:13px}
.input:focus{border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 15%,transparent)}
textarea.input{min-height:230px;resize:vertical;font:12px/1.65 monospace}
.searchbox{display:flex;align-items:center;gap:10px;padding:0 14px;border-radius:16px;background:var(--surface);border:1px solid var(--border);margin:18px 0}
.searchbox input{border:0;background:transparent;outline:0;flex:1;min-width:0;padding:15px 0;color:var(--text);font-size:13px}
.categories{display:flex;gap:8px;overflow-x:auto;padding:1px 0 12px;scrollbar-width:none}
.categories::-webkit-scrollbar{display:none}
.category{white-space:nowrap;border:1px solid var(--border);border-radius:12px;padding:10px 15px;background:var(--surface);color:var(--muted);font-size:11px;font-weight:750}
.category.active{background:var(--accent);border-color:var(--accent);color:white;box-shadow:0 5px 15px color-mix(in srgb,var(--accent) 28%,transparent)}
.badge{display:inline-flex;align-items:center;gap:4px;font-size:9px;font-weight:850;letter-spacing:.3px;padding:5px 8px;border-radius:8px;background:#EDE7FF;color:#6345B0}
.dark .badge{background:#342950;color:#D0BFFF}
.verified{color:#168B68;font-size:10px;font-weight:800}
.store-card{animation:cardIn .35s ease both}
@keyframes cardIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.store-card .exticon{height:58px;width:58px}
.store-card .btn{min-width:100px}
#navbar{height:73px;flex-shrink:0;display:grid;grid-template-columns:repeat(5,1fr);background:var(--surface);border-top:1px solid var(--border);padding-bottom:env(safe-area-inset-bottom)}
.navitem{border:0;background:transparent;color:var(--muted);font-size:9px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;font-weight:650}
.navitem .ico{display:grid;place-items:center;height:23px}
.navitem.active{color:var(--accent)}
.navitem.active .ico{transform:translateY(-2px)}
.switch{width:43px;height:25px;background:#AAA;border-radius:30px;position:relative;cursor:pointer;flex-shrink:0;transition:.2s}
.switch:after{content:"";position:absolute;left:3px;top:3px;width:19px;height:19px;background:white;border-radius:50%;transition:.2s;box-shadow:0 1px 3px #0002}
.switch.on{background:var(--accent)}
.switch.on:after{left:21px}
.setting-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 0}
.setting-row+.setting-row{border-top:1px solid var(--border)}
.setting-row strong{display:block;font-size:13px}
.setting-row small{display:block;color:var(--muted);font-size:11px;margin-top:4px}
.empty{text-align:center;padding:38px 15px;color:var(--muted);font-size:13px}
.empty-icon{margin:0 auto 13px;width:58px;height:58px;border-radius:20px;background:var(--surface);display:grid;place-items:center;color:var(--accent);border:1px solid var(--border)}
#toast{display:none;position:fixed;left:50%;bottom:88px;transform:translateX(-50%);padding:12px 17px;border-radius:14px;background:#252230;color:white;font-size:12px;z-index:100;max-width:90%;box-shadow:0 6px 25px #0003;animation:toastIn .2s ease}
@keyframes toastIn{from{opacity:0;transform:translate(-50%,10px)}to{opacity:1;transform:translate(-50%,0)}}
#detailOverlay{position:absolute;inset:0;background:var(--bg);z-index:40;display:none;flex-direction:column;overflow-y:auto}
#detailOverlay.show{display:flex;animation:pageIn .2s ease}
.detail-top{display:flex;align-items:center;gap:12px;padding:17px;border-bottom:1px solid var(--border);background:var(--surface)}
.detail-body{padding:20px}
.detail-icon{width:82px;height:82px;border-radius:24px;overflow:hidden;background:var(--surface);border:1px solid var(--border);display:grid;place-items:center;margin:12px 0}
.detail-icon img{width:100%;height:100%;object-fit:cover}
#detailTitle{font-size:24px;font-weight:850}
.detail-actions{display:flex;gap:9px;margin-top:18px}
.detail-actions button{flex:1}
#detailDescription{white-space:pre-wrap}
a{color:var(--accent)}
@media(min-width:650px){#app{inset:auto 22px 22px auto;width:430px;height:min(800px,90vh);border-radius:26px;border:1px solid var(--border);box-shadow:0 18px 80px #0005}#bubble{right:25px;bottom:25px}}
</style>

<div id="bubble">M</div>

<div id="app">
<header id="header">
    <div class="brand"><div class="logo">M</div><span>MistaX</span></div>
    <div class="header-actions">
        <button class="iconbtn" id="minimize">${svg("menu")}</button>
        <button class="iconbtn" id="close">${svg("close")}</button>
    </div>
</header>

<main id="content">
<section class="page active" id="home">
    <div class="hero">
        <div class="eyebrow">MISTAHUB ECOSYSTEM</div>
        <h1>Your web, your way.</h1>
        <p>Discover powerful extensions and customize your browsing experience.</p>
        <button class="btn" data-go="store">Explore Store ${svg("arrow",16)}</button>
    </div>
    <div class="stats">
        <div class="stat"><strong id="installedCount">0</strong><small>Installed Extensions</small></div>
        <div class="stat"><strong id="runningCount">0</strong><small>Running Extensions</small></div>
    </div>
    <h2>Quick Access</h2>
    <div class="card">
        <div class="extrow"><div class="exticon"><span class="fallback">${svg("store",25)}</span></div><div class="extinfo"><strong>Extension Store</strong><small>Discover verified extensions</small></div></div>
        <div class="actions"><button class="btn" data-go="store">Browse Store ${svg("arrow",15)}</button></div>
    </div>
    <div class="card">
        <div class="extrow"><div class="exticon"><span class="fallback">${svg("editor",25)}</span></div><div class="extinfo"><strong>Extension Editor</strong><small>Create your own JavaScript extensions</small></div></div>
        <div class="actions"><button class="btn secondary" data-go="editor">Open Editor</button></div>
    </div>
    <h2>Recently Installed</h2>
    <div id="recentList"></div>
</section>

<section class="page" id="store">
    <h1>Extension Store</h1>
    <p>Explore extensions reviewed and published by MistaHub.</p>
    <div class="searchbox">${svg("search")}<input id="storeSearch" placeholder="Search extensions..."></div>
    <div class="categories" id="categories"></div>
    <div id="storeList"><div class="empty">Loading extensions...</div></div>
    <button class="btn secondary" id="refreshStore">${svg("refresh",16)} Refresh Store</button>
    <p id="storeStatus"></p>
</section>

<section class="page" id="installed">
    <h1>My Extensions</h1>
    <p>Manage your installed extensions.</p>
    <div class="searchbox">${svg("search")}<input id="installedSearch" placeholder="Search installed extensions..."></div>
    <div id="installedList"></div>
</section>

<section class="page" id="editor">
    <h1>Extension Editor</h1>
    <p>Create your own JavaScript extensions.</p>
    <input class="input" id="editId" placeholder="Extension ID (my-extension)">
    <input class="input" id="editName" placeholder="Extension Name">
    <input class="input" id="editDescription" placeholder="Description">
    <textarea class="input" id="codeEditor" spellcheck="false" placeholder="api.toast('Hello MistaX!');&#10;&#10;return () => {&#10;    console.log('Extension stopped');&#10;};"></textarea>
    <div class="actions">
        <button class="btn" id="saveCode">Save Extension</button>
        <button class="btn secondary" id="testCode">Test Code</button>
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

<section class="page" id="settings">
    <h1>Settings</h1>
    <p>Personalize your MistaX experience.</p>
    <h2>Appearance</h2>
    <div class="card">
        <div class="setting-row"><div><strong>Dark Theme</strong><small>Switch appearance mode</small></div><div class="switch" id="themeSwitch"></div></div>
        <div class="setting-row"><div><strong>Accent Color</strong><small>Customize app color</small></div><input type="color" id="accentColor" style="width:43px;height:35px;border:0;background:transparent"></div>
    </div>
    <h2>Floating Bubble</h2>
    <div class="card">
        <div class="setting-row"><div><strong>Show Bubble</strong><small>Floating MistaX shortcut</small></div><div class="switch" id="bubbleSwitch"></div></div>
        <div class="setting-row"><div><strong>Bubble Size</strong><small>Adjust button size</small></div><input id="bubbleSize" type="range" min="42" max="80"></div>
        <div class="setting-row"><div><strong>Bubble Opacity</strong><small>Adjust transparency</small></div><input id="bubbleOpacity" type="range" min="30" max="100"></div>
        <button class="btn secondary" id="resetBubble">Reset Bubble Position</button>
    </div>
    <h2>Extension Settings</h2>
    <div class="card">
        <div class="setting-row"><div><strong>Auto Run</strong><small>Run enabled extensions on launch</small></div><div class="switch" id="autoSwitch"></div></div>
        <div class="setting-row"><div><strong>Confirm Uninstall</strong><small>Ask before deleting extensions</small></div><div class="switch" id="confirmSwitch"></div></div>
    </div>
    <h2>Backup & Restore</h2>
    <div class="card">
        <button class="btn" id="exportBackup">Export Backup</button>
        <button class="btn secondary" id="importBackup">Import Backup</button>
        <input id="backupFile" type="file" accept="application/json,.json" hidden>
    </div>
    <h2>Storage</h2>
    <div class="card"><strong id="storageInfo">Loading...</strong><p>Extensions and settings are stored locally in IndexedDB for this website origin.</p></div>
    <h2>Publish Your Extension</h2>
    <div class="card">
        <strong>Want your extension in MistaX Store?</strong>
        <p>Send your extension to MistaHub. It will be reviewed before publishing. Only approved extensions are added to the official Store.</p>
        <div class="actions">
            <a class="btn" href="https://wa.me/${CONTACT.phone}" target="_blank" rel="noopener">WhatsApp</a>
            <a class="btn secondary" href="mailto:${CONTACT.email}">Email</a>
            <a class="btn secondary" href="${CONTACT.telegram}" target="_blank" rel="noopener">Telegram</a>
        </div>
        <p>${CONTACT.email}<br>+91 78706 92939</p>
    </div>
    <h2>About</h2>
    <div class="card"><strong>MistaX ${VERSION}</strong><p>Developed by MistaHub.</p><a href="https://mistahub.in" target="_blank" rel="noopener">Visit MistaHub</a></div>
    <h2>Danger Zone</h2>
    <div class="card"><p>Factory Reset permanently deletes locally installed extensions, settings and caches.</p><button class="btn danger" id="factoryReset">Factory Reset</button></div>
</section>
</main>

<nav id="navbar">
    <button class="navitem active" data-page="home"><span class="ico">${svg("home")}</span>Home</button>
    <button class="navitem" data-page="store"><span class="ico">${svg("store")}</span>Store</button>
    <button class="navitem" data-page="installed"><span class="ico">${svg("extensions")}</span>Extensions</button>
    <button class="navitem" data-page="editor"><span class="ico">${svg("editor")}</span>Editor</button>
    <button class="navitem" data-page="settings"><span class="ico">${svg("settings")}</span>Settings</button>
</nav>

<div id="detailOverlay">
    <div class="detail-top">
        <button class="iconbtn" id="detailBack">${svg("back")}</button>
        <strong>Extension Details</strong>
    </div>
    <div class="detail-body">
        <div class="detail-icon" id="detailIcon"></div>
        <div class="badge" id="detailCategory"></div>
        <h1 id="detailTitle"></h1>
        <div class="verified">${svg("check",13)} MistaHub Reviewed</div>
        <p id="detailMeta"></p>
        <p id="detailDescription"></p>
        <div class="detail-actions">
            <button class="btn" id="detailInstall">Install</button>
            <button class="btn secondary" id="detailClose">Close</button>
        </div>
    </div>
</div>
</div>

<div id="toast"></div>
`;

function toast(message) {
    const element = $("toast");
    element.textContent = message;
    element.style.display = "block";
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => element.style.display = "none", 2600);
}

async function loadSettings() {
    for (const key of Object.keys(DEFAULT_SETTINGS)) {
        const item = await DB.setting(key);
        if (item) settings[key] = item.value;
    }
}

async function saveSetting(key, value) {
    settings[key] = value;
    await DB.setSetting(key, value);
    applySettings();
}

function applySettings() {
    const app = $("app");
    if (!app) return;

    app.classList.toggle("dark", settings.theme === "dark");
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

function showPage(page) {
    currentPage = page;

    shadow.querySelectorAll(".page").forEach(item => {
        item.classList.toggle("active", item.id === page);
    });

    shadow.querySelectorAll(".navitem").forEach(item => {
        item.classList.toggle("active", item.dataset.page === page);
    });

    $("detailOverlay").classList.remove("show");

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

function makeIcon(url, className = "exticon") {
    const holder = document.createElement("div");
    holder.className = className;

    if (url && typeof url === "string") {
        const image = document.createElement("img");
        image.src = url;
        image.alt = "";
        image.loading = "lazy";
        image.referrerPolicy = "no-referrer";
        image.onerror = () => {
            holder.innerHTML = '<span class="fallback">M</span>';
        };
        holder.appendChild(image);
    } else {
        holder.innerHTML = '<span class="fallback">M</span>';
    }

    return holder;
}

function createExtensionAPI(id) {
    const cleanups = [];
    let disposed = false;

    const api = {
        element: document.documentElement,

        toast,

        log: (...args) => console.log("[MistaX:" + id + "]", ...args),

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
            if (disposed) return;
            disposed = true;

            for (const callback of cleanups.reverse()) {
                try {
                    callback();
                } catch (error) {
                    console.error(error);
                }
            }
        }
    };

    return api;
}

async function executeExtension(item) {
    if (runtime.has(item.id)) {
        const existing = runtime.get(item.id);
        if (existing.status === "starting") {
            await existing.promise;
        }
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
            const execute = new Function("api", '"use strict";\n' + item.code);
            let result = execute(api);

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
            if (runtime.get(item.id) === state) runtime.delete(item.id);
            console.error(error);
            toast("Extension error: " + error.message);
        }
    })();

    await state.promise;
    renderHome();
    renderInstalled();
}

async function stopExtension(id) {
    const state = runtime.get(id);
    if (!state) return;

    if (state.status === "starting") {
        await state.promise;
    }

    if (runtime.get(id) !== state) return;

    try {
        if (state.cleanup) state.cleanup();
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
        toast("Extension stopped");
    } else {
        item.enabled = true;
        await DB.save(item);
        await executeExtension(item);
    }

    await DB.save(item);
    renderInstalled();
    renderHome();
}

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

    $("storeStatus").textContent = "Connecting to MistaX Store...";

    try {
        if (!force) {
            const cached = await DB.getStore();
            if (cached && cached.data) {
                catalogue = validateCatalogue(cached.data);
                renderCategories();
                await renderStoreCards();
            }
        }

        const response = await fetch(STORE_URL + "?_=" + Date.now(), {
            cache: "no-store"
        });

        if (!response.ok) throw new Error("Store request failed: " + response.status);

        const data = await response.json();
        catalogue = validateCatalogue(data);

        await DB.setStore({
            ...data,
            extensions: catalogue
        });

        await DB.setSetting("lastStoreSync", Date.now());

        $("storeStatus").textContent = "Store is up to date.";
        renderCategories();
        await renderStoreCards();
    } catch (error) {
        console.error(error);
        $("storeStatus").textContent = catalogue.length
            ? "Showing cached Store. Could not refresh."
            : "Unable to load Store. Check your connection.";

        if (!catalogue.length) {
            const cached = await DB.getStore().catch(() => null);
            if (cached && cached.data) {
                catalogue = validateCatalogue(cached.data);
                renderCategories();
                await renderStoreCards();
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

        const response = await fetch(item.script, { cache: "no-store" });
        if (!response.ok) throw new Error("Download failed");

        const code = await response.text();
        if (!code.trim()) throw new Error("Empty extension script");

        const installed = {
            id: item.id,
            name: item.name,
            description: item.description || "",
            icon: item.icon || "",
            category: item.category || "Other",
            version: item.version,
            code,
            enabled: false,
            source: "store",
            installedAt: Date.now(),
            updatedAt: Date.now(),
            script: item.script
        };

        await dbBatch(["extensions", "scriptCache"], tx => {
            tx.objectStore("extensions").put(installed);
            tx.objectStore("scriptCache").put({
                id: item.id,
                code,
                version: item.version,
                downloadedAt: Date.now(),
                url: item.script
            });
        });

        toast("Extension installed successfully");
        await renderStoreCards();
        await renderInstalled();
        await renderHome();
        updateDetailButton(item);
    } catch (error) {
        console.error(error);
        toast("Install failed: " + error.message);
    }
}

async function updateExtension(item) {
    try {
        const old = await DB.get(item.id);
        if (!old) return installExtension(item);

        const response = await fetch(item.script, { cache: "no-store" });
        if (!response.ok) throw new Error("Download failed");

        const code = await response.text();
        if (!code.trim()) throw new Error("Empty script");

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

        await dbBatch(["extensions", "scriptCache"], tx => {
            tx.objectStore("extensions").put(updated);
            tx.objectStore("scriptCache").put({
                id: item.id,
                code,
                version: item.version,
                downloadedAt: Date.now(),
                url: item.script
            });
        });

        toast("Extension updated");
        await renderInstalled();
        await renderStoreCards();
        updateDetailButton(item);
    } catch (error) {
        toast("Update failed: " + error.message);
    }
}

async function uninstallExtension(id) {
    if (settings.confirmDelete && !confirm("Uninstall this extension?")) return;

    await stopExtension(id);

    await dbBatch(["extensions", "scriptCache"], tx => {
        tx.objectStore("extensions").delete(id);
        tx.objectStore("scriptCache").delete(id);
    });

    toast("Extension uninstalled");
    await renderInstalled();
    await renderStoreCards();
    await renderHome();
}

async function renderStore() {
    if (!catalogue.length) {
        await loadStore();
    } else {
        await renderStoreCards();
    }
}

async function renderStoreCards() {
    const list = $("storeList");
    if (!list) return;

    const installed = await DB.all();
    const query = $("storeSearch").value.trim().toLowerCase();

    const filtered = catalogue.filter(item => {
        const text = [item.name, item.description, item.category].join(" ").toLowerCase();
        return text.includes(query) &&
            (selectedCategory === "All" || item.category === selectedCategory);
    });

    list.innerHTML = "";

    if (!filtered.length) {
        list.innerHTML = '<div class="empty">No extensions found.</div>';
        return;
    }

    filtered.forEach((item, index) => {
        const old = installed.find(x => x.id === item.id);
        const card = document.createElement("article");
        card.className = "card store-card";
        card.style.animationDelay = Math.min(index * 35, 280) + "ms";

        const row = document.createElement("div");
        row.className = "extrow";

        const icon = makeIcon(item.icon);
        const info = document.createElement("div");
        info.className = "extinfo";

        const name = document.createElement("strong");
        name.textContent = item.name;

        const meta = document.createElement("small");
        meta.textContent = (item.category || "Other") + " · v" + item.version;

        info.append(name, meta);
        row.append(icon, info);

        const description = document.createElement("p");
        description.className = "description";
        description.textContent = item.description || "No description available.";

        const verified = document.createElement("div");
        verified.className = "verified";
        verified.style.marginTop = "10px";
        verified.innerHTML = svg("check", 13) + " MistaHub Reviewed";

        const actions = document.createElement("div");
        actions.className = "actions";

        const details = document.createElement("button");
        details.className = "btn secondary";
        details.textContent = "Details";
        details.onclick = () => openDetails(item);

        const button = document.createElement("button");
        button.className = "btn";

        if (!old) {
            button.textContent = "Install";
            button.innerHTML = svg("download", 15) + " Install";
            button.onclick = () => installExtension(item);
        } else if (old.version !== item.version) {
            button.textContent = "Update";
            button.onclick = () => updateExtension(item);
        } else {
            button.textContent = "Installed";
            button.disabled = true;
        }

        actions.append(details, button);
        card.append(row, description, verified, actions);
        list.appendChild(card);
    });
}

function renderCategories() {
    const holder = $("categories");
    holder.innerHTML = "";

    const categories = [
        "All",
        ...new Set(catalogue.map(item => item.category || "Other"))
    ];

    categories.forEach(category => {
        const button = document.createElement("button");
        button.className = "category" + (selectedCategory === category ? " active" : "");
        button.textContent = category;

        button.onclick = () => {
            selectedCategory = category;
            renderCategories();
            renderStoreCards();
        };

        holder.appendChild(button);
    });
}

function openDetails(item) {
    selectedExtension = item;

    const icon = $("detailIcon");
    icon.innerHTML = "";

    const imageHolder = makeIcon(item.icon, "detail-icon");
    icon.replaceWith(imageHolder);
    imageHolder.id = "detailIcon";

    $("detailCategory").textContent = item.category || "Other";
    $("detailTitle").textContent = item.name;
    $("detailMeta").textContent = "Version " + item.version;
    $("detailDescription").textContent = item.description || "No description available.";

    updateDetailButton(item);
    $("detailOverlay").classList.add("show");
}

async function updateDetailButton(item) {
    const button = $("detailInstall");
    if (!button || selectedExtension?.id !== item.id) return;

    const old = await DB.get(item.id);

    button.disabled = false;

    if (!old) {
        button.textContent = "Install Extension";
        button.onclick = () => installExtension(item);
    } else if (old.version !== item.version) {
        button.textContent = "Update Extension";
        button.onclick = () => updateExtension(item);
    } else {
        button.textContent = "Already Installed";
        button.disabled = true;
    }
}

async function renderInstalled() {
    const all = await DB.all();
    const query = $("installedSearch").value.trim().toLowerCase();

    const filtered = all.filter(item =>
        (item.name + " " + item.description).toLowerCase().includes(query)
    );

    const holder = $("installedList");
    holder.innerHTML = "";

    if (!filtered.length) {
        holder.innerHTML = '<div class="empty"><div class="empty-icon">' + svg("extensions", 27) + '</div>No extensions installed yet.<br>Visit the Store to discover extensions.</div>';
        return;
    }

    filtered.forEach(item => {
        const running = runtime.has(item.id);
        const card = document.createElement("div");
        card.className = "card";

        const row = document.createElement("div");
        row.className = "extrow";

        const icon = makeIcon(item.icon);
        const info = document.createElement("div");
        info.className = "extinfo";

        const name = document.createElement("strong");
        name.textContent = item.name;

        const meta = document.createElement("small");
        meta.textContent = "v" + item.version + " · " + (running ? "Running" : "Stopped");

        info.append(name, meta);

        const sw = document.createElement("div");
        sw.className = "switch" + (running ? " on" : "");
        sw.onclick = () => toggleExtension(item.id);

        row.append(icon, info, sw);

        const description = document.createElement("p");
        description.className = "description";
        description.textContent = item.description || "";

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
        card.append(row, description, actions);
        holder.appendChild(card);
    });
}

async function renderHome() {
    const list = await DB.all();

    $("installedCount").textContent = list.length;
    $("runningCount").textContent = runtime.size;

    const recent = list.slice()
        .sort((a, b) => (b.installedAt || 0) - (a.installedAt || 0))
        .slice(0, 3);

    const holder = $("recentList");
    holder.innerHTML = "";

    if (!recent.length) {
        holder.innerHTML = '<div class="empty">Your installed extensions will appear here.</div>';
        return;
    }

    recent.forEach(item => {
        const card = document.createElement("div");
        card.className = "card extrow";

        const icon = makeIcon(item.icon);
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

async function saveCustomExtension() {
    const id = $("editId").value.trim().toLowerCase();
    const name = $("editName").value.trim();
    const description = $("editDescription").value.trim();
    const code = $("codeEditor").value;

    if (!/^[a-z0-9-]{2,60}$/.test(id)) return toast("Invalid extension ID");
    if (!name || !code.trim()) return toast("Name and code are required");

    const old = await DB.get(id);

    if (old && old.source === "store") {
        return toast("Store extensions cannot be overwritten in Editor");
    }

    await DB.save({
        id,
        name,
        description,
        code,
        icon: "",
        category: "Custom",
        version: old?.version || "1.0.0",
        source: "custom",
        enabled: false,
        installedAt: old?.installedAt || Date.now(),
        updatedAt: Date.now()
    });

    toast("Extension saved");
    renderInstalled();
    renderHome();
}

async function testCustomExtension() {
    const code = $("codeEditor").value;
    if (!code.trim()) return toast("Write code first");

    const api = createExtensionAPI("editor-test");

    try {
        let result = new Function("api", '"use strict";\n' + code)(api);

        if (result && typeof result.then === "function") {
            result = await result;
        }

        if (typeof result === "function") api.onCleanup(result);

        toast("Test executed. Cleaning temporary effects shortly.");
        setTimeout(() => api.cleanup(), 1200);
    } catch (error) {
        api.cleanup();
        toast("Error: " + error.message);
    }
}

function setSwitch(id, value) {
    $(id).classList.toggle("on", !!value);
}

async function renderSettings() {
    setSwitch("themeSwitch", settings.theme === "dark");
    setSwitch("bubbleSwitch", settings.bubble);
    setSwitch("autoSwitch", settings.autoRun);
    setSwitch("confirmSwitch", settings.confirmDelete);

    $("accentColor").value = settings.accent;
    $("bubbleSize").value = settings.bubbleSize;
    $("bubbleOpacity").value = settings.bubbleOpacity;

    const list = await DB.all();
    const bytes = new Blob(list.map(item => item.code || "")).size;
    $("storageInfo").textContent =
        list.length + " extensions · " + (bytes / 1024).toFixed(1) + " KB of script data";
}

async function exportBackup() {
    const extensions = await DB.all();

    const data = {
        app: "MistaX",
        version: VERSION,
        exportedAt: new Date().toISOString(),
        extensions,
        settings
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mistax-backup.json";
    link.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("Backup exported");
}

async function importBackup(file) {
    try {
        const data = JSON.parse(await file.text());

        if (!Array.isArray(data.extensions)) {
            throw new Error("Invalid backup");
        }

        const records = data.extensions.filter(item =>
            item &&
            typeof item.id === "string" &&
            /^[a-z0-9-]{2,60}$/.test(item.id) &&
            typeof item.code === "string"
        );

        await dbBatch(["extensions"], tx => {
            records.forEach(item => {
                tx.objectStore("extensions").put({
                    ...item,
                    source: item.source || "custom",
                    enabled: false
                });
            });
        });

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

        if (Math.abs(dx) + Math.abs(dy) > 7) moved = true;
        if (!moved) return;

        const x = Math.max(0, Math.min(innerWidth - settings.bubbleSize, originX + dx));
        const y = Math.max(0, Math.min(innerHeight - settings.bubbleSize, originY + dy));

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
            event.preventDefault();
            event.stopImmediatePropagation();
        }
    }, true);
}

async function runEnabledExtensions() {
    if (!settings.autoRun) return;

    const list = await DB.all();

    for (const item of list) {
        if (item.enabled) await executeExtension(item);
    }
}

function bindEvents() {
    bindNavigation();

    $("bubble").onclick = () => $("app").classList.toggle("show");
    $("close").onclick = () => $("app").classList.remove("show");
    $("minimize").onclick = () => $("app").classList.remove("show");

    $("detailBack").onclick = () => $("detailOverlay").classList.remove("show");
    $("detailClose").onclick = () => $("detailOverlay").classList.remove("show");

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
        await saveSetting("theme", settings.theme === "dark" ? "light" : "dark");
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
        $("bubble").style.bottom = "95px";

        toast("Bubble position reset");
    };

    $("autoSwitch").onclick = async () => {
        await saveSetting("autoRun", !settings.autoRun);
        renderSettings();
    };

    $("confirmSwitch").onclick = async () => {
        await saveSetting("confirmDelete", !settings.confirmDelete);
        renderSettings();
    };

    $("exportBackup").onclick = exportBackup;

    $("importBackup").onclick = () => $("backupFile").click();

    $("backupFile").onchange = event => {
        const file = event.target.files[0];
        if (file) importBackup(file);
        event.target.value = "";
    };

    $("factoryReset").onclick = async () => {
        if (!confirm("Factory Reset will permanently delete all extensions, settings and caches. Continue?")) return;

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

async function init() {
    try {
        await openDatabase();
        await loadSettings();

        applySettings();
        bindEvents();
        makeBubbleDraggable();

        renderSettings();
        renderHome();
        renderInstalled();

        await loadStore();
        await runEnabledExtensions();

        console.log("MistaX V" + VERSION + " initialized");
    } catch (error) {
        console.error("MistaX initialization error:", error);
        toast("MistaX initialization failed: " + error.message);
    }
}

init();

})();