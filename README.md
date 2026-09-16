### NOTESx2

[![GitHub Release](https://img.shields.io/github/v/release/soulsam480/nnootteess)](https://github.com/soulsam480/nnootteess/releases/latest)

> P2P synced and E2E encrypted note taking in all your browsers

### How to use

- Open the web app at https://notes.sambitsahoo.com and create a vault
- copy/save the vault key
- add notes/snippets

### Features

- Vaults open with a vault key, same key on any device, auto-unlock for 15m
- P2P sync over WebRTC, E2E encrypted, nothing stored on a server
- Markdown notes, JS/TS/JSON snippets
- Vim mode, Prettier with Mod-Shift-F
- Split panes, tabs, Cmd-K search, auto-save
- Sidebar and theme sync across devices
- Export all as zip

### Tech Stack

- Vue 3 + TypeScript
- Milkdown Crepe (markdown)
- CodeMirror 6 + Prettier (snippets)
- GenosDB (P2P sync + vault identity)

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

<img width="1276" height="1114" alt="image" src="https://github.com/user-attachments/assets/d4df34f3-ecb2-4084-b65c-e84c22c4668b" />
<img width="420" height="927" alt="image" src="https://github.com/user-attachments/assets/f7b05b64-9048-4d9b-b32e-bc7b602962e0" />
