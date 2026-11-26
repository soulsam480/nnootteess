---
name: genosdb
description: Build applications on GenosDB — the serverless, peer-to-peer graph database for the browser with a zero-trust Security Manager. Use whenever code imports "genosdb", calls gdb(...), db.put / get / map / link, db.scope (a replica in parts of the graph), db.room channels, db.sm (roles, ownership, ACLs, passkeys, encrypted records, governance), or runs the Fallback Server (genossrv). Covers the frozen API, data modeling and realtime-UI patterns, the security model, how to prove peer-to-peer sync in tests, and how to diagnose "it doesn't sync".
---

# GenosDB — building applications

**This skill lives in its own repository**, [estebanrfp/genosdb-skill](https://github.com/estebanrfp/genosdb-skill), and follows the engine's releases. When it and the engine you run disagree, the [CHANGELOG](https://github.com/estebanrfp/gdb/blob/main/CHANGELOG.md) wins.

GenosDB is a graph database that runs entirely in the browser (OPFS, cross-tab), syncs peer to peer over WebRTC with Nostr signaling, and decides authorization on every device: **every operation is signed by its author and verified by every peer that receives it, and nothing a peer cannot verify is applied.** There is no server in the data path. The optional Fallback Server is an always-on peer that adds availability, never authority.

The public API is **frozen**. Never invent a method, an option or an operator: the surface an application may call is in these files, and `types/index.d.ts` in the package is that surface, verbatim. Its meaning, its edge cases and the reference applications are in the documentation; the section *The documentation, and when to read it* says when to open it.

**When GenosDB is the wrong tool** — say so instead of forcing it: a single authoritative server-side database with SQL, joins and transactions across tables; data that must be available when *no* client is online and nobody will run the always-on peer; authorization that must be enforced by a server rather than verified cryptographically at every peer; a dataset too large for a full replica in every browser, with no parts a browser could follow instead (`db.scope`); per-window UI state — open tabs, the active pane, scroll position — which must not follow the user to another device: keep it in localStorage or IndexedDB.

## Files

| file | read when |
|---|---|
| [API.md](API.md) | you write any call — boot options, nodes, queries, `db.scope`, `db.room`, `db.sm`, the Fallback Server |
| [PATTERNS.md](PATTERNS.md) | you model data, divide the graph into parts (`scope`), build a realtime UI, paginate, order a list, do presence, pick an app shape, bundle |
| [SECURITY.md](SECURITY.md) | the app has users — roles, ownership, ACLs, encryption, passkeys, governance, and the threat model |
| [IDENTITY.md](IDENTITY.md) | you build registration, login, recovery or passkeys — the identity door, its phases drawn from the security state, the phrase, the session chip |
| [GOVERNANCE.md](GOVERNANCE.md) | you design roles and how they are earned — the constitution from the app's actions, the rules, who runs the engine, the demo identities, how to test a promotion |
| [TESTING.md](TESTING.md) | you must prove that peers sync — Playwright, one browser context per peer, nothing faked |
| [PITFALLS.md](PITFALLS.md) | "it doesn't sync", clocks, relays, caches, and the traps that cost hours |

## The documentation, and when to read it

This skill is the map; the documentation is the territory, an order of magnitude larger: the guides under [docs/index.md](https://github.com/estebanrfp/gdb/blob/main/docs/index.md) and the reference applications under [examples/](https://github.com/estebanrfp/gdb/tree/main/examples), catalogued in [docs/genosdb-examples.md](https://github.com/estebanrfp/gdb/blob/main/docs/genosdb-examples.md). Do not read all of it for every task, and do not skip it either:

- **Before touching a module, read its guide.** Every file here names the guide and the reference example for its topic: API.md for each reference, PATTERNS.md for the application shapes, SECURITY.md, IDENTITY.md and GOVERNANCE.md for the Security Manager. Open them from `docs/index.md` before writing the first call to that module.
- **A detail that is not in these files is in the documentation.** Read the page; never guess, and never extrapolate from another database's API. If the documentation does not have it either, the engine does not do it.
- **A whole application, not a snippet:** read in full the [design guide](https://github.com/estebanrfp/gdb/blob/main/docs/genosdb-design-guide.md), the examples catalogue and the API reference of every module the application will use, before designing the graph. Then copy the reference example for the application's shape rather than redesigning it.
- **Where the files are.** In a clone of the public repository, `docs/` and `examples/` on disk; otherwise the raw GitHub URLs behind the links in these files. Offline, `node_modules/genosdb/types/index.d.ts` is the surface, complete and versioned with the engine you run.

## Boot — the one call

```js
import { gdb } from "genosdb"                 // CDN: https://cdn.jsdelivr.net/npm/genosdb@<version>/dist/index.min.js
const db = await gdb("room-name", {            // never `new GDB()`; top-level await is fine
  rtc: true,                                   // or { relayUrls, turnConfig, cells: true | { cellSize } }
  sm: { superAdmins: ["0x…"], acls: true },    // optional: identity, roles, ownership, ACLs, passkeys, governance
  debug: true,                                 // the only way to see the engine's own logs
})
```

The **name is the room**: every peer that opens the same name replicates the whole graph — unless it states a `scope` and is in parts of it instead, each a sync room of its own ([API.md](API.md), [PATTERNS.md](PATTERNS.md)). What must not be shared goes under another name: a `scope` is a choice any peer makes, never a boundary. One instance per page.

## Ten rules that prevent the usual disasters

1. **A node is the unit of concurrency.** One node per paragraph, card or item; order siblings with a fractional `rank` field, never by array position. Two edits to one node at the same instant keep both contributions (the loser's rescue), but separate nodes are simpler and always safe.
2. **`put` replaces the whole value.** Update one field by spreading the current value: `db.put({ ...node.value, done: true }, id)`.
3. **One subscription per view, for the life of the page.** Never re-subscribe inside a session callback. Handle `initial / added / updated / removed` explicitly and let the engine sort and window; the DOM is the state.
4. **A guest's write succeeds locally and every other peer refuses it.** With `sm`, a new identity is a `guest` until a superadmin's signed decision promotes it. "It doesn't sync" is almost always this: fix the constitution, not the `map` wiring.
5. **Give nodes an owner.** `value.owner = address` makes the engine name the id `${owner}:…`, and every peer enforces that only the owner and its collaborators may create, write, link or delete it.
6. **A collaborator writes content, never policy.** A non-owner's write must carry `owner`, `collaborators` and the envelope table unchanged, or every peer refuses it. Spreading the previous value does exactly that.
7. **The room replicates everything to everyone.** Confidentiality is cryptographic — encrypted records (`db.sm.put`) or a sealed field (`encryptDataForCurrentUser`) — never topological. A `scope` narrows what a replica syncs, never who may read it.
8. **Channel messages are transport, not facts.** Presence, cursors, typing go on `db.room.channel`; anything that must persist or be authorized goes in the graph. To label who is saying something *now*, `db.sm.sign` / `db.sm.verify`.
9. **A peer's value renders as text.** `textContent`, never `innerHTML`, for anything another peer wrote: no server sits between the writer and the reader.
10. **Never `alert()`, `confirm()` or `prompt()`** in a syncing page: they block the thread and the sync being demonstrated. A toast for results, `<dialog method="dialog">` for questions.

## Check the bundle you are building against

The engine ships minified; what it does is written down in [CRYPTOGRAPHY.md](https://github.com/estebanrfp/gdb/blob/main/CRYPTOGRAPHY.md) and checkable without trusting anyone. From a clone of the public repository:

```bash
npm pack genosdb@latest && tar xzf genosdb-*.tgz
node tests/vectors/verify.mjs --dist package/dist      # 98 checks re-derived from the spec, no GenosDB code
```

## Sources of truth, in order

1. `types/index.d.ts`, in the package — the surface.
2. [docs/index.md](https://github.com/estebanrfp/gdb/blob/main/docs/index.md) — the API reference and every module guide.
3. [CRYPTOGRAPHY.md](https://github.com/estebanrfp/gdb/blob/main/CRYPTOGRAPHY.md) and [SECURITY.md](https://github.com/estebanrfp/gdb/blob/main/SECURITY.md) — what is signed, verified and encrypted; the threat model; the verified guarantees.
4. [CHANGELOG.md](https://github.com/estebanrfp/gdb/blob/main/CHANGELOG.md) — what changed, when, and why.
5. [docs/genosdb-examples.md](https://github.com/estebanrfp/gdb/blob/main/docs/genosdb-examples.md) — the reference applications. When an example and a guide disagree, the example is right.
