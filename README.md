### NNOOTTEESS

[![GitHub Release](https://img.shields.io/github/v/release/soulsam480/nnootteess)](https://github.com/soulsam480/nnootteess/releases/latest)

> P2P synced note taking in all your browsers

### How to use

- Download latest release https://github.com/soulsam480/nnootteess/releases
- turn on developer mode in chrome://extensions
- add and then enable new tab
- register and copy/save the passphrase
- add notes/snippets

### Features

- **P2P Realtime Sync** — notes sync across devices via GenosDB, no server
  needed
- **New Tab Override** — replaces your browser's new tab with a note-taking
  workspace
- **Markdown Editor** — write in Milkdown (WYSIWYG Markdown) with full
  formatting support
- **Code Snippets** — Monaco editor with Shiki syntax highlighting for code
  blocks
- **Prettier Formatting** — auto-format code snippets with Prettier
- **Mnemonic Auth** — login once, store mnemonic in browser for 15 minutes, use
  across tabs
- **Tabbed Notes** — open and switch between multiple notes as tabs
- **Sidebar Navigation** — browse, create, rename, and delete notes from the
  sidebar
- **Light/Dark Theme** — Nord-based theming with CSS variables

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
bun run dev
```

### Build

```bash
bun run build
```

Release zip will be in `release/`.

### Screenshots
<img width="1470" height="832" alt="image" src="https://github.com/user-attachments/assets/32801df4-e9e3-43dc-af0f-b0e66fea03b8" />
<img width="1470" height="832" alt="image" src="https://github.com/user-attachments/assets/0b2fa7cc-0a60-4b79-8ba2-67755bb9a6c1" />

