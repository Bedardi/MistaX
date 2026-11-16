(() => {
    const ID = "mistax-mini-store";

    document.getElementById(ID)?.remove();

    const css = `
        * { box-sizing: border-box; }

        #${ID} {
            position: fixed;
            inset: 0;
            z-index: 2147483647;
            background: #101522;
            color: #fff;
            font: 14px Arial, sans-serif;
            overflow: auto;
            padding: 15px;
        }

        #${ID} .app {
            max-width: 700px;
            margin: auto;
        }

        #${ID} .card {
            background: #1d293d;
            padding: 15px;
            border-radius: 13px;
            margin: 12px 0;
        }

        #${ID} input,
        #${ID} textarea {
            width: 100%;
            padding: 12px;
            margin: 7px 0;
            background: #101827;
            color: white;
            border: 1px solid #46536b;
            border-radius: 8px;
        }

        #${ID} textarea {
            height: 140px;
            font-family: monospace;
        }

        #${ID} button {
            padding: 10px 13px;
            border: 0;
            border-radius: 8px;
            background: #4169e1;
            color: white;
            margin: 4px;
        }

        #${ID} .danger {
            background: #c0392b;
        }

        #${ID} .secondary {
            background: #39465d;
        }

        #${ID} .item {
            background: #28364c;
            padding: 12px;
            border-radius: 10px;
            margin: 10px 0;
        }

        #${ID} .muted {
            color: #aab7ca;
            font-size: 12px;
        }
    `;

    const root = document.createElement("div");
    root.id = ID;

    root.innerHTML = `
        <style>${css}</style>

        <div class="app">

            <header style="display:flex;justify-content:space-between;align-items:center">
                <h2>✦ MistaX Store</h2>
                <button id="close">✕</button>
            </header>

            <p class="muted">Local JavaScript Extension Manager</p>

            <div class="card">
                <h3 id="title">Add Extension</h3>

                <input id="name" placeholder="Extension Name">

                <input id="desc" placeholder="Description">

                <textarea id="code" placeholder="api.toast('Hello MistaX!')"></textarea>

                <button id="save">Save Extension</button>
                <button class="secondary" id="cancel">Clear</button>
            </div>

            <div class="card">
                <h3>Installed Extensions</h3>
                <div id="list">Loading...</div>
            </div>

            <div class="card">
                <h3>Backup</h3>
                <button id="export">Export JSON</button>
                <button id="importBtn">Import JSON</button>
                <input id="file" type="file" accept=".json" hidden>
            </div>

            <p class="muted">MistaX • IndexedDB Storage</p>

        </div>
    `;

    document.documentElement.appendChild(root);

    const $ = id => root.querySelector("#" + id);

    let db;
    let editing = null;

    const cleanups = new Map();

    function toast(message) {
        const t = document.createElement("div");

        t.textContent = message;

        t.style.cssText = `
            position:fixed;
            bottom:20px;
            left:50%;
            transform:translateX(-50%);
            background:#293b59;
            padding:12px 18px;
            border-radius:10px;
            z-index:2147483647;
        `;

        root.appendChild(t);

        setTimeout(() => t.remove(), 2000);
    }

    function esc(value) {
        return String(value ?? "").replace(/[&<>"']/g, c => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[c]));
    }

    function request(req) {
        return new Promise((resolve, reject) => {
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    function all() {
        return request(
            db.transaction("extensions")
                .objectStore("extensions")
                .getAll()
        );
    }

    function get(id) {
        return request(
            db.transaction("extensions")
                .objectStore("extensions")
                .get(id)
        );
    }

    function put(data) {
        return request(
            db.transaction("extensions", "readwrite")
                .objectStore("extensions")
                .put(data)
        );
    }

    function del(id) {
        return request(
            db.transaction("extensions", "readwrite")
                .objectStore("extensions")
                .delete(id)
        );
    }

    function clear() {
        editing = null;

        $("name").value = "";
        $("desc").value = "";
        $("code").value = "";

        $("title").textContent = "Add Extension";
        $("save").textContent = "Save Extension";
    }

    $("cancel").onclick = clear;

    $("save").onclick = async () => {
        const name = $("name").value.trim();
        const code = $("code").value.trim();

        if (!name || !code) {
            return toast("Name and code required");
        }

        const old = editing ? await get(editing) : null;

        await put({
            id: editing || crypto.randomUUID(),
            name,
            description: $("desc").value.trim(),
            code,
            enabled: old?.enabled || false,
            updatedAt: Date.now()
        });

        clear();
        await render();

        toast("Saved successfully");
    };

    async function render() {
        const items = await all();

        $("list").innerHTML = items.length
            ? items.map(x => `
                <div class="item">

                    <b>${esc(x.name)}</b>

                    <p class="muted">
                        ${esc(x.description)}
                    </p>

                    <p>
                        ${x.enabled ? "🟢 Enabled" : "⚪ Disabled"}
                    </p>

                    <button data-run="${esc(x.id)}">▶ Run</button>

                    <button class="secondary" data-toggle="${esc(x.id)}">
                        ${x.enabled ? "Disable" : "Enable"}
                    </button>

                    <button class="secondary" data-edit="${esc(x.id)}">
                        Edit
                    </button>

                    <button class="danger" data-del="${esc(x.id)}">
                        Delete
                    </button>

                </div>
            `).join("")
            : '<p class="muted">No extensions installed.</p>';
    }

    async function execute(id) {
        const x = await get(id);

        if (!x) return;

        try {
            cleanups.get(id)?.();

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
                    element.addEventListener(event, callback, options);

                    return () => {
                        element.removeEventListener(event, callback, options);
                    };
                }
            };

            const fn = new Function(
                "api",
                '"use strict";\n' + x.code
            );

            const result = fn(api);

            if (typeof result === "function") {
                cleanups.set(id, result);
            }

            toast("Executed: " + x.name);

        } catch (error) {
            console.error(error);
            toast("Error: " + error.message);
        }
    }

    $("list").onclick = async event => {
        const button = event.target.closest("button");

        if (!button) return;

        const id =
            button.dataset.run ||
            button.dataset.toggle ||
            button.dataset.edit ||
            button.dataset.del;

        if (!id) return;

        if (button.dataset.run !== undefined) {
            return execute(id);
        }

        const item = await get(id);

        if (!item) return;

        if (button.dataset.toggle !== undefined) {

            item.enabled = !item.enabled;

            if (!item.enabled) {
                try {
                    cleanups.get(id)?.();
                } catch (e) {}

                cleanups.delete(id);

                await put(item);

            } else {
                await put(item);
                await execute(id);
            }

            await render();

        } else if (button.dataset.edit !== undefined) {

            editing = id;

            $("name").value = item.name;
            $("desc").value = item.description || "";
            $("code").value = item.code;

            $("title").textContent = "Edit Extension";
            $("save").textContent = "Update Extension";

            root.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        } else if (button.dataset.del !== undefined) {

            if (!confirm("Delete this extension?")) return;

            try {
                cleanups.get(id)?.();
            } catch (e) {}

            cleanups.delete(id);

            await del(id);
            await render();

            toast("Deleted");
        }
    };

    $("export").onclick = async () => {
        const blob = new Blob(
            [JSON.stringify(await all(), null, 2)],
            { type: "application/json" }
        );

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");

        a.href = url;
        a.download = "mistax-backup.json";
        a.click();

        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    $("importBtn").onclick = () => {
        $("file").click();
    };

    $("file").onchange = async event => {
        const file = event.target.files[0];

        if (!file) return;

        try {
            const data = JSON.parse(await file.text());

            if (!Array.isArray(data)) {
                throw new Error("Invalid backup");
            }

            for (const item of data) {
                if (item.id && item.name && item.code) {
                    await put(item);
                }
            }

            await render();

            toast("Imported successfully");

        } catch (error) {
            toast("Invalid backup");
        }

        event.target.value = "";
    };

    $("close").onclick = () => root.remove();

    const requestDB = indexedDB.open("MistaXStore", 1);

    requestDB.onupgradeneeded = () => {
        const database = requestDB.result;

        if (!database.objectStoreNames.contains("extensions")) {
            database.createObjectStore("extensions", {
                keyPath: "id"
            });
        }
    };

    requestDB.onsuccess = async () => {
        db = requestDB.result;

        db.onversionchange = () => db.close();

        try {
            await render();
        } catch (error) {
            console.error(error);
            toast("Database error");
        }
    };

    requestDB.onerror = () => {
        toast("IndexedDB unavailable");
    };

})();