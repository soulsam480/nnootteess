# Migrate a vault from 0.33.5 to 0.37

This flow seeds real notes on GenosDB 0.33.5, switches the app to 0.37 on the same origin, and proves the sweep rewrites every encrypted note to the v3 format without losing content. It is the reproduction for the migration plan in `.opencode/plans/genosdb-0.37-migration.md`.

## Sub-features

- `migration-seed` creates a text note and a code snippet on 0.33.5.
- `migration-precheck` reads v2 `sec.type` from the graph before the switch.
- `migration-sweep` rewrites both notes to v3 during login on 0.37.
- `migration-content` confirms the original text and JSON survive.
- `migration-repeat` proves a second sweep migrates nothing.

## How to get to it (user POV)

- The user opens the 0.33.5 app, creates a vault, and writes notes.
- The operator deploys the 0.37 build and the user opens the same vault with the same key. No new button appears.
- The user reopens the notes from the drawer after login.

## Driving it with browse

Preconditions:

- The 0.33.5 checkout is running on port 5173 and `doctor.sh` reports genosdb `0.33.5`.
- The 0.37 checkout exists with the sweep wired into `user.ts`.
- The throwaway vault key from the seed run is in scratch state.

- **Seed.** On the 0.33.5 checkout, create a vault, then create `Migration note` and `Migration snippet` as described in their feature files. Wait for both drawer entries.
- **Precheck.** Run the graph diagnostic from `SKILL.md`. Both nodes must show `sec.type` `aes-gcm-self-ssm-v2`. Save the seeded screenshot and this result.
- **Stop the old server.** Kill only the Vite PID started for the 0.33.5 checkout. Confirm port 5173 is free.
- **Start the new server.** Start Vite from the 0.37 checkout on the same port. Run `doctor.sh` and require genosdb `0.37.0`.
- **Log in.** Open a fresh tab at the same origin, fill `Open vault with vault key` with the saved phrase, and choose `Open vault`. The shell and both note tabs return.
- **Postcheck.** Run the graph diagnostic. Both nodes must show `sec.type` `aes-gcm-self-ssm-v3` with the same ids and owners as the precheck. Save the migrated screenshot and this result.
- **Content.** Open each note from the UI. The text note still shows `hello legacy`. The snippet still shows the JSON with `"version": 2`.
- **Repeat.** Run the idempotency eval from `SKILL.md` with the owner address. The report is `{ "scanned": 2, "migrated": 0, "skipped": 2, "failed": 0 }`.
- **Proof.** Keep both screenshots, both graph results, and the repeat report together in the evidence directory.

## Gotchas

- OPFS is per origin. If the port or host changes between the two builds, the notes are gone and the proof is invalid.
- Do not run both servers at once. The second one serves the same vault and the sweep can race the old writer.
- A fresh tab is required on the 0.37 side. A tab still running the old bundle keeps old ciphertext in memory.
- A passkey-only account has no private key in this spike. Always enter the vault key for the migration lane.
- The app shows restored note tabs before login finishes in some runs. Wait for the shell and for the graph postcheck before reading content.
- A second sweep with all v3 notes does not call the legacy key derivation. That is why a dummy key is safe in the repeat lane.
