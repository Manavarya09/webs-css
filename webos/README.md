# WebOS - Mini Browser Desktop

This is a small prototype of a browser-based operating system built using only HTML, CSS and vanilla JavaScript.

Features:
- Boot animation and simple login
- Desktop with icons and taskbar
- Window manager with draggable/resizable windows
- Built-in apps: Notes, Calculator, Paint, Terminal
- Simple file system (localStorage), theme and wallpaper support

Added features:
- IndexedDB-backed file system with File Explorer (create/rename/move/delete, upload images)
- Notes and Paint apps can open and save files from the File Explorer
- Theme switcher (light/dark) and wallpaper upload via Settings
- Notifications (toasts) and a simple Task Manager to force-close windows

How to run locally:
1. Open `index.html` in a modern browser (Chrome/Edge/Firefox/Safari).
2. Register a username on first launch, then double-click icons to open apps.

Folder structure:
```
webos/
├── index.html
├── assets/
├── css/
├── js/
└── data/
```

This is a starting point. You can extend it by adding IndexedDB file storage, taskbar-window integration, more apps, and persistence improvements.

How to run locally:
1. Open `webos/index.html` in a modern browser (Chrome/Edge/Firefox/Safari).
2. Register a username on first launch, then double-click icons to open apps.
3. Open Files -> Load Sample Files to populate demo content.

Notes:
- IndexedDB is used for file storage (stored per-origin in the browser).
- Wallpapers uploaded via Settings are stored as object URLs and persisted by URL; refreshing will keep the wallpaper as long as the object URL is valid for the session — for permanent storage consider converting to data URLs or storing image blobs.

Running the automated smoke test
- You can run a basic automated smoke test that simulates a user flow (register, load sample files, open and save a note) by opening the app with the special query parameter `?autotest=1`.

Example:

Open this URL in your browser:

`file:///.../webos/index.html?autotest=1`

The test runner will show a small overlay while it runs and will print a step-by-step summary to the browser console. It's a lightweight end-to-end smoke test intended to quickly validate core flows; it runs in the same browser context and requires no external tooling.
