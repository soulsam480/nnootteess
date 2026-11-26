# NOTESx2 verification map

This directory is the maintained source for verifying the user-facing behavior of NOTESx2. Read the index before driving the app, then use the matching feature file as the recipe. The harness and stable handles live in the parent `SKILL.md`.

## Baseline preconditions

- Launch one checkout at `http://127.0.0.1:5173` as described in `SKILL.md`.
- Run `bash ../scripts/doctor.sh <checkout-dir>` and require a `200`, the expected port owner, and the expected GenosDB version.
- Use a fresh Chromium tab for each run. The app keeps the vault key in sessionStorage for 15 minutes, so a reused tab can skip the login screen.
- Seed a disposable vault with a 12-word key. Treat the key as throwaway data.
- Never drive an instance that was not started by this verification run.

## Driving conventions

- Start every recipe from the baseline state unless its preconditions say otherwise.
- Prefer accessible names over CSS selectors and coordinates.
- The app misspells the note-name placeholder as `Please enter a name fo the note`. Use the placeholder or its ref, not a corrected spelling.
- Auto-save runs on a one second debounce. Wait for the drawer list or the reopened note, not a fixed sleep.
- Drive the browser through `tools.browse.*`. The module import in `SKILL.md` is a read-only diagnostic, not a user action.
- Restore seeded data after a mutation. Do not remove proof artifacts during cleanup.

## Proof and skip reporting

- Capture the user action and the resulting state, not only the final screen.
- UI proof includes an ARIA snapshot and a screenshot with the note names visible.
- Storage proof includes the graph diagnostic showing `sec.type`, note id, and owner.
- Report the feature ID and entry point used with every artifact.
- Record an unreachable path with the attempted action and the unmet precondition.
- Do not report a skipped entry point as verified through a different path.

## Feature entry contract

Each feature file starts with an H1 title and one paragraph describing the user-visible behavior. It then uses exactly four H2 sections in this order.

1. `Sub-features` lists short IDs with one line for each behavior.
2. `How to get to it (user POV)` lists every user entry point.
3. `Driving it with browse` starts with `Preconditions:` and pairs each user action with an exact browse call and observable result.
4. `Gotchas` lists traps that can waste or invalidate a verification run.

Keep implementation details out of the map. Name only user paths, stable handles, required state, and observable proof.

## Features

- [Create and open a vault](./vault.md) covers vault creation, the vault key, opening an existing vault, and the persisted session.
- [Write a text note](./notes.md) covers creation, editing, auto-save, drawer listing, and reload persistence.
- [Write a code snippet](./snippets.md) covers snippet creation, language selection, and editing.
- [Export notes](./export.md) covers the zip export of all notes in the vault.
- [Migrate a vault from 0.33.5 to 0.37](./migration.md) covers seeding old data, applying the sweep, and proving the result and idempotency.
