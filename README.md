MistaX

Your Browser. Your Extensions. Your Experience.

MistaX is a lightweight, bookmarklet-based JavaScript extension manager developed by MistaHub. It allows users to discover, install, manage, and create JavaScript extensions directly inside their browser without installing a traditional browser extension.

MistaX provides an app-like interface with an online extension store, local extension management, a JavaScript editor, and customizable floating controls.

---

✨ Features

🏠 App-Like Interface

- Modern mobile-first interface.
- Floating MistaX launcher.
- Draggable floating button.
- Smooth animations and transitions.
- Dark and light themes.
- Custom accent colors.
- Responsive layout.

🛍️ MistaX Store

- Online extension catalogue powered by "store.json".
- Verified extensions published by MistaHub.
- Extension descriptions, icons, categories, and versions.
- Search and category filtering.
- One-tap installation.
- Extension updates.
- Local store caching.

🧩 Extension Manager

- View installed extensions.
- Enable and disable extensions.
- Run extensions on the current webpage.
- Uninstall extensions.
- View extension information.
- Store-installed and custom extensions.

🛠️ Extension Editor

- Create custom JavaScript extensions.
- Edit extension information and source code.
- Save extensions locally.
- Test extension scripts.
- Built-in MistaX Extension API.

⚙️ Settings

- Dark and light themes.
- Accent color customization.
- Floating bubble controls.
- Bubble size and opacity.
- Automatic extension execution.
- Uninstall confirmation.
- Backup and restore.
- Factory reset.

💾 Local Storage

MistaX uses IndexedDB to store extension data locally.

Database: "MistaXStore"

Object Store| Purpose
"extensions"| Installed extension records and source code
"settings"| User preferences
"storeCache"| Cached online catalogue
"scriptCache"| Downloaded extension scripts
"metadata"| Database and synchronization metadata

Existing extension records are preserved during supported database upgrades.

---

🚀 Installation

MistaX works through a browser bookmarklet.

Step 1: Create a Bookmark

Create a new browser bookmark.

Name:

MistaX

URL:

javascript:(()=>{let s=document.createElement('script');s.src='https://cdn.jsdelivr.net/gh/Bedardi/MistaX@main/mistax.js';s.onload=()=>console.log('MistaX Ready');s.onerror=()=>alert('MistaX failed to load');document.documentElement.appendChild(s)})();

Step 2: Open a Website

Open any supported HTTPS website.

Step 3: Launch MistaX

Open your bookmarks and select MistaX.

The MistaX floating button should appear on the webpage.

---

📦 Repository Structure

MistaX/
│
├── mistax.js
├── store.json
├── README.md
│
└── extensions/
    │
    ├── dark-mode/
    │   └── main.js
    │
    ├── eruda/
    │   └── main.js
    │
    └── image-tools/
        └── main.js

---

🛍️ Store Configuration

The online store is managed through "store.json".

Example:

{
  "name": "MistaX Store",
  "version": "1.0.0",
  "publisher": "MistaHub",
  "extensions": [
    {
      "id": "dark-mode",
      "name": "Dark Mode",
      "description": "Enable a dark appearance on supported websites.",
      "version": "1.0.0",
      "category": "Appearance",
      "icon": "https://example.com/dark-mode.png",
      "script": "https://cdn.jsdelivr.net/gh/Bedardi/MistaX@main/extensions/dark-mode/main.js"
    }
  ]
}

Store Publishing Policy

MistaX follows a manually verified publishing system.

- Only MistaHub publishes extensions to the official store.
- Submitted extensions are reviewed before publication.
- Unverified extensions are not added to the official catalogue.
- Users can contact MistaHub to request extension publication.
- Store updates are distributed through the GitHub repository and jsDelivr CDN.

---

🧑‍💻 Creating an Extension

MistaX extensions are JavaScript files.

Example:

api.toast("Hello from MistaX!");

api.log("Extension started");

const style = api.addStyle(`
    body {
        background: #111 !important;
        color: #fff !important;
    }
`);

return () => {
    console.log("Extension stopped");
};

Available Extension API

API| Description
"api.toast(message)"| Display a notification
"api.log(...args)"| Log messages to the console
"api.addStyle(css)"| Add CSS to the webpage
"api.addElement(element)"| Add an element to the webpage
"api.onCleanup(callback)"| Register a cleanup callback
"api.element"| Access the webpage root element

Extension Lifecycle

Extensions can return a cleanup function:

const element = document.createElement("div");

element.textContent = "MistaX Extension Active";

api.addElement(element);

return () => {
    console.log("Cleaning up extension");
};

Cleanup callbacks are executed when an extension is stopped. However, arbitrary JavaScript side effects cannot always be automatically reversed.

---

🔄 Extension Lifecycle

MistaX separates extension management into three stages:

1. Store: Discover verified extensions.
2. Installed: Downloaded extensions stored locally in IndexedDB.
3. Runtime: Extensions currently executing on the active webpage.

Installing an extension does not automatically execute it.

Enabling an extension executes it on the current webpage. Disabling it runs its registered cleanup callbacks.

---

📱 Compatibility

MistaX is designed for modern browsers supporting:

- JavaScript ES6+
- IndexedDB
- Fetch API
- Shadow DOM
- Pointer Events
- CSS Custom Properties

MistaX is intended for use on HTTPS webpages.

Important: MistaX is a bookmarklet-based tool, not a native Chrome extension. It does not have access to privileged "chrome.*" extension APIs, and its local IndexedDB data is isolated by website origin.

---

🔐 Security

- Store extensions are downloaded from the configured CDN.
- Extensions execute JavaScript in the current webpage context.
- Extensions can potentially access or modify webpage content.
- Only install extensions from sources you trust.
- Review custom JavaScript before executing it.
- Store publication requires manual review by MistaHub.

MistaX does not provide a sandbox for untrusted extension code. Manual review reduces risk but does not guarantee that an extension is harmless.

---

📬 Submit Your Extension

Want your extension published in the official MistaX Store?

Contact MistaHub:

Contact| Details
Email| support@mistahub.in
Mobile / WhatsApp| +91 78706 92939
Telegram| https://t.me/mistahub
Website| https://mistahub.in

Send your extension source code, name, description, version, and functionality details.

Every submission is subject to manual review.

---

🏢 Developer

MistaX is developed and maintained by MistaHub.

Website: https://mistahub.in

GitHub: https://github.com/Bedardi/MistaX

---

📄 License

All rights reserved by MistaHub unless otherwise specified.

You may use MistaX for personal purposes. Redistribution, modification, or commercial distribution of the official project and its branding requires permission from MistaHub.

---
---

<p align="center">
  <strong>MistaX — Extend Your Web Experience.</strong>
  <br>
  Developed with ❤️ by MistaHub
</p>

---