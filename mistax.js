(() => {
    "use strict";

    /* =====================================
       MISTAX MINI STORE V2
       Floating Extension Manager
    ===================================== */

    const APP_ID = "mistax-floating-store";
    const DB_NAME = "MistaXStore";
    const DB_VERSION = 1;

    // Already loaded
    if (document.getElementById(APP_ID)) {
        const existing = document.getElementById(APP_ID);

        existing.shadowRoot
            ?.getElementById("mx-panel")
            ?.classList.toggle("hidden");

        return;
    }

    /* =====================================
       DATABASE
    ===================================== */

    let db;

    function openDatabase() {
        return new Promise((resolve, reject) => {

            const request = indexedDB.open(
                DB_NAME,
                DB_VERSION
            );

            request.onupgradeneeded = () => {
                const database = request.result;

                if (!database.objectStoreNames.contains("extensions")) {
                    database.createObjectStore("extensions", {
                        keyPath: "id"
                    });
                }
            };

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };

        });
    }

    function getAll() {
        return new Promise((resolve, reject) => {

            const request = db
                .transaction("extensions")
                .objectStore("extensions")
                .getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);

        });
    }

    function getExtension(id) {
        return new Promise((resolve, reject) => {

            const request = db
                .transaction("extensions")
                .objectStore("extensions")
                .get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);

        });
    }

    function saveExtension(data) {
        return new Promise((resolve, reject) => {

            const request = db
                .transaction("extensions", "readwrite")
                .objectStore("extensions")
                .put(data);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);

        });
    }

    function deleteExtension(id) {
        return new Promise((resolve, reject) => {

            const request = db
                .transaction("extensions", "readwrite")
                .objectStore("extensions")
                .delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);

        });
    }

    /* =====================================
       HOST + SHADOW DOM
    ===================================== */

    const host = document.createElement("div");

    host.id = APP_ID;

    host.style.cssText = `
        position:fixed;
        inset:0;
        z-index:2147483647;
        pointer-events:none;
    `;

    const shadow = host.attachShadow({
        mode: "open"
    });

    shadow.innerHTML = `

        <style>

            * {
                box-sizing:border-box;
            }

            .hidden {
                display:none !important;
            }

            button,input,textarea {
                font:inherit;
            }

            #mx-bubble {
                position:fixed;
                right:18px;
                bottom:85px;

                width:54px;
                height:54px;

                border-radius:50%;
                border:none;

                background:#4169e1;
                color:white;

                font-size:23px;
                font-weight:bold;

                box-shadow:0 5px 20px #0007;

                cursor:pointer;
                pointer-events:auto;

                display:flex;
                align-items:center;
                justify-content:center;

                touch-action:none;
            }

            #mx-panel {
                position:fixed;

                right:12px;
                bottom:150px;

                width:min(350px,calc(100vw - 24px));

                max-height:70vh;

                display:flex;
                flex-direction:column;

                background:#101522;
                color:#fff;

                border:1px solid #34415b;
                border-radius:17px;

                overflow:hidden;

                box-shadow:0 12px 40px #0009;

                font:14px Arial,sans-serif;

                pointer-events:auto;
            }

            #mx-header {
                padding:14px;

                background:#1d293d;

                display:flex;
                align-items:center;
                justify-content:space-between;

                cursor:move;
                touch-action:none;

                user-select:none;
            }

            #mx-title {
                font-size:17px;
                font-weight:bold;
            }

            .mx-header-actions {
                display:flex;
                gap:5px;
            }

            .mx-header-btn {
                border:0;
                border-radius:8px;

                background:#39465d;
                color:white;

                width:34px;
                height:32px;

                font-size:18px;
            }

            #mx-content {
                padding:12px;
                overflow-y:auto;
                overscroll-behavior:contain;
            }

            .mx-subtitle {
                font-size:11px;
                color:#9caac1;
                margin:0 0 12px;
            }

            .mx-card {
                background:#1d293d;
                border-radius:12px;
                padding:12px;
                margin-bottom:12px;
            }

            .mx-card h3 {
                margin:0 0 10px;
                font-size:15px;
            }

            .mx-input {
                width:100%;
                padding:11px;

                margin:5px 0 9px;

                background:#101827;
                color:white;

                border:1px solid #46536b;
                border-radius:8px;

                outline:none;
            }

            .mx-input:focus {
                border-color:#4169e1;
            }

            #mx-code {
                height:115px;
                resize:vertical;
                font-family:monospace;
                font-size:12px;
            }

            .mx-btn {
                padding:9px 12px;

                border:0;
                border-radius:8px;

                background:#4169e1;
                color:white;

                margin:3px;

                font-size:12px;
                font-weight:bold;
            }

            .mx-secondary {
                background:#39465d;
            }

            .mx-danger {
                background:#c0392b;
            }

            .mx-item {
                background:#28364c;
                padding:11px;
                border-radius:10px;
                margin:9px 0;
            }

            .mx-item-title {
                font-weight:bold;
                font-size:14px;
                overflow-wrap:anywhere;
            }

            .mx-description {
                color:#aab7ca;
                font-size:11px;
                margin-top:5px;
                overflow-wrap:anywhere;
            }

            .mx-status {
                font-size:10px;
                margin-top:7px;
                color:#8fd6a5;
            }

            .mx-status.off {
                color:#aab7ca;
            }

            .mx-actions {
                display:flex;
                flex-wrap:wrap;
                margin-top:8px;
            }

            .mx-empty {
                color:#aab7ca;
                font-size:12px;
                padding:10px 0;
            }

            .mx-footer {
                text-align:center;
                color:#8593aa;
                font-size:10px;
                padding:5px;
            }

            #mx-toast {
                position:fixed;
                left:50%;
                bottom:25px;

                transform:translateX(-50%);

                background:#293b59;
                color:white;

                padding:11px 16px;
                border-radius:10px;

                font-size:12px;

                box-shadow:0 5px 20px #0008;

                display:none;
                pointer-events:none;
            }

        </style>

        <button id="mx-bubble" title="Open MistaX">
            ✦
        </button>

        <div id="mx-panel" class="hidden">

            <div id="mx-header">

                <div id="mx-title">
                    ✦ MistaX Store
                </div>

                <div class="mx-header-actions">

                    <button class="mx-header-btn" id="mx-minimize">
                        −
                    </button>

                    <button class="mx-header-btn" id="mx-close">
                        ×
                    </button>

                </div>

            </div>

            <div id="mx-content">

                <p class="mx-subtitle">
                    Local JavaScript Extension Manager
                </p>

                <div class="mx-card">

                    <h3 id="mx-form-title">
                        Add Extension
                    </h3>

                    <input
                        class="mx-input"
                        id="mx-name"
                        placeholder="Extension Name"
                    >

                    <input
                        class="mx-input"
                        id="mx-description"
                        placeholder="Description"
                    >

                    <textarea
                        class="mx-input"
                        id="mx-code"
                        placeholder="api.toast('Hello MistaX!')"
                    ></textarea>

                    <button class="mx-btn" id="mx-save">
                        Save Extension
                    </button>

                    <button class="mx-btn mx-secondary" id="mx-clear">
                        Clear
                    </button>

                </div>

                <div class="mx-card">

                    <h3>
                        Installed Extensions
                    </h3>

                    <div id="mx-list">
                        Loading...
                    </div>

                </div>

                <div class="mx-card">

                    <h3>Backup</h3>

                    <button class="mx-btn" id="mx-export">
                        Export JSON
                    </button>

                    <button class="mx-btn mx-secondary" id="mx-import">
                        Import JSON
                    </button>

                    <input
                        type="file"
                        id="mx-file"
                        accept=".json,application/json"
                        hidden
                    >

                </div>

                <div class="mx-footer">
                    MistaX V2 • IndexedDB Storage
                </div>

            </div>

        </div>

        <div id="mx-toast"></div>

    `;

    document.documentElement.appendChild(host);

    /* =====================================
       ELEMENTS
    ===================================== */

    const $ = id => shadow.getElementById(id);

    const bubble = $("mx-bubble");
    const panel = $("mx-panel");
    const header = $("mx-header");

    let editingId = null;

    const activeCleanups = new Map();

    /* =====================================
       TOAST
    ===================================== */

    let toastTimer;

    function toast(message) {

        const element = $("mx-toast");

        element.textContent = message;
        element.style.display = "block";

        clearTimeout(toastTimer);

        toastTimer = setTimeout(() => {
            element.style.display = "none";
        }, 2200);

    }

    /* =====================================
       PANEL CONTROLS
    ===================================== */

    function openPanel() {
        panel.classList.remove("hidden");
        bubble.classList.add("hidden");
    }

    function minimizePanel() {
        panel.classList.add("hidden");
        bubble.classList.remove("hidden");
    }

    bubble.onclick = openPanel;

    $("mx-minimize").onclick = minimizePanel;

    $("mx-close").onclick = minimizePanel;

    /* =====================================
       DRAGGABLE BUBBLE
    ===================================== */

    function makeDraggable(element, target) {

        let startX = 0;
        let startY = 0;

        let initialX = 0;
        let initialY = 0;

        let dragging = false;

        element.addEventListener("pointerdown", event => {

            if (event.button !== 0 && event.pointerType === "mouse") {
                return;
            }

            dragging = true;

            const rect = target.getBoundingClientRect();

            startX = event.clientX;
            startY = event.clientY;

            initialX = rect.left;
            initialY = rect.top;

            element.setPointerCapture(event.pointerId);

        });

        element.addEventListener("pointermove", event => {

            if (!dragging) return;

            const dx = event.clientX - startX;
            const dy = event.clientY - startY;

            const rect = target.getBoundingClientRect();

            const width = rect.width;
            const height = rect.height;

            const left = Math.max(
                0,
                Math.min(
                    window.innerWidth - width,
                    initialX + dx
                )
            );

            const top = Math.max(
                0,
                Math.min(
                    window.innerHeight - height,
                    initialY + dy
                )
            );

            target.style.left = left + "px";
            target.style.top = top + "px";
            target.style.right = "auto";
            target.style.bottom = "auto";

        });

        const stop = () => {
            dragging = false;
        };

        element.addEventListener("pointerup", stop);
        element.addEventListener("pointercancel", stop);

    }

    makeDraggable(bubble, bubble);

    makeDraggable(header, panel);

    /* =====================================
       HELPERS
    ===================================== */

    function escapeHTML(value) {

        return String(value ?? "").replace(
            /[&<>"']/g,
            character => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            })[character]
        );

    }

    function clearForm() {

        editingId = null;

        $("mx-name").value = "";
        $("mx-description").value = "";
        $("mx-code").value = "";

        $("mx-form-title").textContent = "Add Extension";
        $("mx-save").textContent = "Save Extension";

    }

    /* =====================================
       EXTENSION RUNTIME
    ===================================== */

    async function executeExtension(id) {

        const extension = await getExtension(id);

        if (!extension) return;

        try {

            // Remove previous instance cleanup
            const previousCleanup = activeCleanups.get(id);

            if (previousCleanup) {
                try {
                    previousCleanup();
                } catch (error) {
                    console.error(error);
                }

                activeCleanups.delete(id);
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
                '"use strict";\n' + extension.code
            );

            const cleanup = execute(api);

            if (typeof cleanup === "function") {
                activeCleanups.set(id, cleanup);
            }

            toast("Executed: " + extension.name);

        } catch (error) {

            console.error("MistaX Extension Error:", error);

            toast("Error: " + error.message);

        }

    }

    /* =====================================
       SAVE EXTENSION
    ===================================== */

    $("mx-save").onclick = async () => {

        const name = $("mx-name").value.trim();

        const description =
            $("mx-description").value.trim();

        const code = $("mx-code").value.trim();

        if (!name || !code) {
            return toast("Name and code required");
        }

        try {

            const old = editingId
                ? await getExtension(editingId)
                : null;

            const data = {

                id: editingId || crypto.randomUUID(),

                name,
                description,
                code,

                enabled: old?.enabled || false,

                updatedAt: Date.now()

            };

            await saveExtension(data);

            clearForm();

            await renderExtensions();

            toast("Extension saved");

        } catch (error) {

            console.error(error);

            toast("Save failed");

        }

    };

    $("mx-clear").onclick = clearForm;

    /* =====================================
       EDIT EXTENSION
    ===================================== */

    async function editExtension(id) {

        const extension = await getExtension(id);

        if (!extension) return;

        editingId = id;

        $("mx-name").value = extension.name;

        $("mx-description").value =
            extension.description || "";

        $("mx-code").value = extension.code;

        $("mx-form-title").textContent = "Edit Extension";

        $("mx-save").textContent = "Update Extension";

        $("mx-content").scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }

    /* =====================================
       DELETE EXTENSION
    ===================================== */

    async function removeExtension(id) {

        if (!confirm("Delete this extension?")) {
            return;
        }

        try {

            const cleanup = activeCleanups.get(id);

            if (cleanup) cleanup();

        } catch (error) {
            console.error(error);
        }

        activeCleanups.delete(id);

        await deleteExtension(id);

        await renderExtensions();

        toast("Extension deleted");

    }

    /* =====================================
       ENABLE / DISABLE
    ===================================== */

    async function toggleExtension(id) {

        const extension = await getExtension(id);

        if (!extension) return;

        extension.enabled = !extension.enabled;

        await saveExtension(extension);

        if (extension.enabled) {

            await executeExtension(id);

        } else {

            try {

                activeCleanups.get(id)?.();

            } catch (error) {
                console.error(error);
            }

            activeCleanups.delete(id);

            toast("Extension disabled");

        }

        await renderExtensions();

    }

    /* =====================================
       RENDER EXTENSIONS
    ===================================== */

    async function renderExtensions() {

        const items = await getAll();

        const list = $("mx-list");

        if (!items.length) {

            list.innerHTML = `
                <div class="mx-empty">
                    No extensions installed.
                </div>
            `;

            return;
        }

        list.innerHTML = items.map(extension => `

            <div class="mx-item">

                <div class="mx-item-title">
                    ${escapeHTML(extension.name)}
                </div>

                <div class="mx-description">
                    ${escapeHTML(extension.description)}
                </div>

                <div class="mx-status ${extension.enabled ? "" : "off"}">
                    ${extension.enabled ? "● ENABLED" : "○ DISABLED"}
                </div>

                <div class="mx-actions">

                    <button
                        class="mx-btn"
                        data-action="run"
                        data-id="${escapeHTML(extension.id)}"
                    >
                        Run
                    </button>

                    <button
                        class="mx-btn mx-secondary"
                        data-action="toggle"
                        data-id="${escapeHTML(extension.id)}"
                    >
                        ${extension.enabled ? "Disable" : "Enable"}
                    </button>

                    <button
                        class="mx-btn mx-secondary"
                        data-action="edit"
                        data-id="${escapeHTML(extension.id)}"
                    >
                        Edit
                    </button>

                    <button
                        class="mx-btn mx-danger"
                        data-action="delete"
                        data-id="${escapeHTML(extension.id)}"
                    >
                        Delete
                    </button>

                </div>

            </div>

        `).join("");

    }

    /* =====================================
       LIST EVENTS
    ===================================== */

    $("mx-list").addEventListener("click", async event => {

        const button = event.target.closest("button[data-action]");

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

    /* =====================================
       EXPORT BACKUP
    ===================================== */

    $("mx-export").onclick = async () => {

        try {

            const items = await getAll();

            const backup = {

                app: "MistaX",

                version: 2,

                exportedAt: new Date().toISOString(),

                extensions: items

            };

            const blob = new Blob(
                [JSON.stringify(backup, null, 2)],
                {
                    type: "application/json"
                }
            );

            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");

            link.href = url;
            link.download = "mistax-backup.json";

            link.click();

            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 1500);

            toast("Backup exported");

        } catch (error) {

            console.error(error);

            toast("Export failed");

        }

    };

    /* =====================================
       IMPORT BACKUP
    ===================================== */

    $("mx-import").onclick = () => {
        $("mx-file").click();
    };

    $("mx-file").onchange = async event => {

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

                    await saveExtension({
                        id: item.id,
                        name: item.name,
                        description: item.description || "",
                        code: item.code,
                        enabled: Boolean(item.enabled),
                        updatedAt: Date.now()
                    });

                }

            }

            await renderExtensions();

            toast("Backup imported");

        } catch (error) {

            console.error(error);

            toast("Invalid backup file");

        }

        event.target.value = "";

    };

    /* =====================================
       INITIALIZE
    ===================================== */

    async function initialize() {

        try {

            db = await openDatabase();

            db.onversionchange = () => db.close();

            await renderExtensions();

            // Run previously enabled extensions
            const extensions = await getAll();

            for (const extension of extensions) {

                if (extension.enabled) {
                    await executeExtension(extension.id);
                }

            }

        } catch (error) {

            console.error("MistaX Initialization:", error);

            toast("Database initialization failed");

        }

    }

    initialize();

})();