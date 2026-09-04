### NNOOTTEESS

[![GitHub Release](https://img.shields.io/github/v/release/soulsam480/nnootteess)](https://github.com/soulsam480/nnootteess/releases/latest)

> P2P synced note taking in all your browsers

### How to use

- Open the web app at https://notes.sambitsahoo.com and register
- copy/save the passphrase
- add notes/snippets

> The web app is the recommended way to use NNOOTTEESS. Same passphrase, same
> notes, everywhere.

### Chrome extension (deprecated)

The new tab extension still works but is no longer the focus. Prefer the web
app.

- Download latest release https://github.com/soulsam480/nnootteess/releases
- turn on developer mode in chrome://extensions
- add and then enable new tab

### Features

- P2P realtime sync over WebRTC via GenosDB, note content end-to-end encrypted, no server stores your data
- Mnemonic passphrase auth, same phrase works on every device and browser, session kept for 15 minutes with auto-login
- Markdown notes with Milkdown Crepe
- Code snippets with CodeMirror 6, per-snippet language switcher for JSON, JavaScript, TypeScript
- Code editor with line numbers, folding, bracket matching and auto-close, active line highlight, search, undo history
- Optional Vim mode for snippets, persisted between sessions
- Prettier formatting for snippets with Mod-Shift-F
- Split panes and tabs, open notes stay in sync across devices, document title follows focused note
- Quick search with Cmd/Ctrl-K, filters by note name
- Collapsible sidebar to browse, create, rename inline, and delete notes with confirmation
- Auto-save with debounced writes
- Sidebar position and theme sync across devices
- Export all notes as zip, markdown notes as .md and snippets as .json/.js/.ts
- PWA web app with offline cache

### Tech Stack

- Vue 3 + TypeScript
- Vite + CRXJS (Chrome Extension) + vite-plugin-pwa (web app)
- Milkdown Crepe (markdown)
- CodeMirror 6 + Prettier (snippets)
- GenosDB (P2P sync + auth)

### Development

```bash
bun install
bun run dev:app
bun run dev:extension
```

### Build

```bash
bun run build:extension
bun run build:app
```

Release zip will be in `release/`.

### Screenshots
<img width="1276" height="1114" alt="image" src="https://github.com/user-attachments/assets/d4df34f3-ecb2-4084-b65c-e84c22c4668b" />
<img width="420" height="927" alt="image" src="https://github.com/user-attachments/assets/f7b05b64-9048-4d9b-b32e-bc7b602962e0" />

