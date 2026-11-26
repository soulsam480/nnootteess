---
name: verify-notesx2
description: Drive the NOTESx2 Vue web app in Chromium to verify vault creation, notes, snippets, export, and the genosdb 0.33.5 to 0.37 data migration. Use when changing auth, storage, encryption, or note syncing in nnootteess.
---

# Verify NOTESx2

## Launch

Run from the checkout under test. `bun install` once per checkout, then start Vite in the background.

```
bun install
bunx vite -c vite.app.config.ts --host 127.0.0.1 --port 5173
```

Ready is the log line `Local: http://127.0.0.1:5173/`. Keep the PID you start. The repo's `bun run dev` also starts Caddy for `https://notesx2.test`, which binds port 443 and needs privileges. The Vite-only command is the one that was executed end to end.

Run one instance on port 5173 at a time. OPFS and localStorage are keyed by origin, so two Vite servers on the same port share one vault and corrupt each other's proof. For the migration reproduction, stop the first checkout's server before starting the second, and keep the origin identical.

Teardown is in Cleanup. Never kill by process name.

## Doctor

```
bash .agents/skills/verify-notesx2/scripts/doctor.sh <checkout-dir>
```

Pass when `http://127.0.0.1:5173/` returns `200` and the checkout's installed `genosdb` version is the one under test. The seeded reproduction expects `0.33.5`. The migration checkout expects `0.37.0`. A wrong version means the wrong checkout is serving the port.

Open the app with `tools.browse.navigate({ url: "http://127.0.0.1:5173/", waitUntil: "load" })`. The login card with heading `Welcome to NOTESx2` confirms the surface is alive.

## Drive

All browser actions go through the `browse` tools. Prefer the accessible names below over coordinates.

Stable handles found in this app.

- Login input `Open vault with vault key` and button `Open vault`.
- Empty state buttons `Create a new vault`, `Create a Note`, `Create a Snippet`.
- After vault creation, button `Copy vault key — don't lose it!`. Its input holds the generated 12-word phrase.
- Drawer toggle `Toggle drawer`, then buttons `Add new note`, `Add new code snippet`, `Export notes`.
- Note name input has placeholder `Please enter a name fo the note`. That misspelling is in the app.
- Note body is a `textbox`. The code note also has a language `combobox`, default `Json`.
- Command palette is `Meta+k` and exposes a `Search...` textbox.

Read-only graph diagnostic, used alongside UI proof and never instead of it. Replace the repo path with the checkout under test.

```
const expr = `(async () => {
  const mod = await import("/@fs/<checkout-dir>/src/storage/db.ts");
  const { results } = await mod.db().map({ query: { type: { $in: ["note", "code"] } } });
  return results.map((n) => ({
    id: n.id,
    name: n.value.name,
    secType: (() => { try { return JSON.parse(n.value.sec).type; } catch { return null; } })(),
    owner: n.value.owner,
  }));
})()`;
await tools.browse.eval({ tab, expression: expr, world: "main" });
```

Expect `aes-gcm-self-ssm-v2` on the seeded 0.33.5 checkout and `aes-gcm-self-ssm-v3` after migration. The UI must show the same note text on both sides.

Seed the old state:

1. On the 0.33.5 checkout, click `Create a new vault`, then `Copy vault key — don't lose it!`. Read the phrase from the password input with `browse.eval` and keep it in scratch state for the migration run.
2. Create two notes as a user would. Use `Create a Note` for a text note and the drawer's `Add new code snippet` for a JSON snippet. Fill the name and body textboxes. The app saves on a one second debounce, so wait for the drawer list to show both notes before reading the graph.
3. Run the graph diagnostic. Confirm two nodes, both `aes-gcm-self-ssm-v2`. Capture the seeded screenshot.

Apply the migration:

1. Stop the 0.33.5 server. Start the 0.37 checkout on the same port and origin.
2. Open the app in a new tab. Enter the saved phrase in `Open vault with vault key` and click `Open vault`. The verified spike calls `migrateCurrentVault` from `user.ts` during login. No extra button is needed.
3. Wait for the note list and restored tabs. Run the graph diagnostic. Both nodes must now be `aes-gcm-self-ssm-v3`, with unchanged ids and owners.
4. Open each note from the UI and confirm the original text and JSON are still there.
5. Prove idempotency with a second sweep. It must skip every v3 note and derive no key.

```
const expr = `(async () => {
  const mod = await import("/@fs/<checkout-dir>/src/storage/migration.ts");
  return await mod.migrateCurrentVault("<owner-address>", "0x" + "00".repeat(32));
})()`;
await tools.browse.eval({ tab, expression: expr, world: "main" });
```

Expect `{ "scanned": 2, "migrated": 0, "skipped": 2, "failed": 0 }`. A dummy private key is safe here because the sweep derives one only when a v2 note exists.

## Evidence

Write every artifact to `.agents/skills/verify-notesx2/evidence/`. The `browse` tools save only inside their file roots, so save there first and copy with the helper.

```
bash .agents/skills/verify-notesx2/scripts/keep-evidence.sh <browse-root-png> <evidence-name>.png
```

A proof for this app includes all of the following.

- A screenshot of the seeded 0.33.5 state with both notes in the drawer.
- The graph diagnostic result showing both `sec.type` values as `aes-gcm-self-ssm-v2`.
- A screenshot of the 0.37 state with both notes open.
- The graph diagnostic result showing both `sec.type` values as `aes-gcm-self-ssm-v3`.
- The idempotency report showing zero migrations on the second run.
- The note body read back from the UI, not from internal state.

Exercise the real path. Create and open notes through visible controls. The module import is a read-only check of the graph and the second-sweep report, not a substitute for clicking. Verify side effects, the persisted `sec.type` and the note text, alongside the screen. Do not mock GenosDB or WebCrypto.

## Cleanup

- Kill only the Vite PID this run started. Confirm port 5173 is free.
- Close only the tabs this run opened with `tools.browse.tabs({ action: "close", ... })`.
- Copy every screenshot out of the browse file root before closing tabs. Cleanup must not delete evidence.
- The seeded vault lives in OPFS in the browser profile. Leave it when a later lane needs it. To isolate the next run, clear it from the page before closing the tab.

```
const expr = `(async () => {
  const root = await navigator.storage.getDirectory();
  for await (const [name] of root.entries()) {
    if (name.startsWith("nnootteess")) await root.removeEntry(name, { recursive: true });
  }
  localStorage.clear();
  sessionStorage.clear();
  return "cleared";
})()`;
await tools.browse.eval({ tab, expression: expr, world: "main" });
```

Do not delete the browser profile.
- Remove scratch files that hold the throwaway vault key only after the migration proof is saved.

## Helpers

- `scripts/doctor.sh <checkout-dir>` checks the port and the installed GenosDB version.
- `scripts/keep-evidence.sh <browse-root-file> <evidence-name>` copies a captured artifact into the evidence directory.
