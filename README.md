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

- **P2P Realtime Sync** — notes sync peer-to-peer with end-to-end encryption, no
  server holds your data; changes and deletions propagate instantly across all
  your devices
- **New Tab Override** — replaces your browser's new tab with a note-taking
  workspace
- **Markdown Editor** — rich WYSIWYG markdown editing
- **Code Snippets** — JSON, JavaScript, and TypeScript with a per-snippet
  language switcher
- **Editor Extras** — line numbers, code folding, bracket matching/auto-close,
  active line highlighting, search, undo history
- **Vim Mode** — optional Vim keybindings for snippets, remembered between
  sessions
- **Prettier Formatting** — one-key formatting for code snippets
- **Mnemonic Auth** — register once and copy/save your passphrase, reuse it to
  log in on any device; stays valid in the browser for 15 minutes
- **Tabbed Notes** — open up to 10 notes as closable tabs; open tabs and active
  note stay in sync across devices
- **Sidebar Navigation** — browse, create, rename, and delete notes from the
  collapsible sidebar; auto-closes on small screens
- **Auto-save** — notes save as you type, rename inline
- **Synced State** — sidebar position and theme follow you across devices

### What more can be done?

- Web app? since the gdb namespace is same, users can use it as long as mnemonic
  is same
- better UI? sure

### Tech Stack

- Vue 3 + TypeScript
- Vite + CRXJS (Chrome Extension)
- Milkdown (Markdown editor)
- Monaco Editor + Shiki (code editing)
- GenosDB (P2P sync)

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

