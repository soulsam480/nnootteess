# Export notes

Export downloads a zip file that contains every note in the vault as plaintext Markdown or code files. The file is the user's backup before a storage format change.

## Sub-features

- `export-open` opens the export action from the drawer.
- `export-files` writes one file per note with the right extension.
- `export-content` writes the decrypted body, not the ciphertext.

## How to get to it (user POV)

- Open the drawer and choose `Export notes`.

## Driving it with browse

Preconditions:

- A vault is open with at least one note and one snippet.
- The browser allows downloads to a known directory.

- **Start the export.** Choose `Toggle drawer`, then `Export notes`. The browser reports a download named `nnotesx2-export-<date>.zip`.
- **Inspect the archive.** Open the downloaded file outside the browser. A text note named `Migration note` becomes `migration-note.md`. A JSON snippet named `Migration snippet` becomes `migration-snippet.json`.
- **Check content.** The Markdown file contains `hello legacy`. The JSON file contains the same keys and values typed in the editor. Neither file contains a `0x` ciphertext string.
- **Proof.** Save a screenshot of the drawer with the Export button visible and record the archive path plus the two filenames and their contents.

## Gotchas

- `importNotes` is a stub in the app. Export is a backup, not a round trip.
- The zip uses the note name after kebab-case normalization. Assert the normalized filename.
- Export decrypts every note through the app's current reader. On a 0.37 build with v2 notes still present, it fails on the first stale note. Run it after the sweep.
- A download blocked by the browser produces no artifact. Check the download shelf before reporting a pass.
