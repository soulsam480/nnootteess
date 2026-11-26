# Write a text note

A text note has a name and a Markdown body. The app saves one second after the last edit. The note appears in the drawer list and reopens with the same content after a reload.

## Sub-features

- `note-create` opens a blank note from the empty state or the drawer.
- `note-name` sets the note name.
- `note-body` edits the body and auto-saves it.
- `note-list` shows the saved note in the drawer.
- `note-reopen` restores the body after a reload.

## How to get to it (user POV)

- Choose `Create a Note` on the empty state.
- Open the drawer and choose `Add new note`.
- Press `Alt+n` while focus is outside a text field.

## Driving it with browse

Preconditions:

- A vault is open and the app shell is visible.
- No note is named `Migration note`.

- **Open the editor.** Choose `Create a Note`, or open the drawer with `Toggle drawer` and choose `Add new note`. A tab titled `Untitled` appears with a name textbox and a body textbox.
- **Name the note.** Fill the textbox with placeholder `Please enter a name fo the note` with `Migration note`. Use `tools.browse.fill({ tab, ref, value })`.
- **Write the body.** Fill the body textbox with `hello legacy` followed by a blank line and `This note was created on genosdb 0.33.5.`.
- **Wait for auto-save.** Wait until the drawer list shows a second entry. Do not assert immediately after the fill.
- **Reopen from the drawer.** Close and reopen the note from the drawer list. The name and body match what was typed.
- **Survive reload.** Run `tools.browse.navigate({ tab, url: "http://127.0.0.1:5173/", waitUntil: "load" })`. Re-enter the vault key if the login card appears. Open the note again and confirm both values.
- **Proof.** Save a screenshot with the note open and capture the graph diagnostic showing the note id, owner, and `sec.type`.

## Gotchas

- The name placeholder is misspelled in the app. Match the rendered text.
- Filling a CodeMirror body with `browse.fill` replaces the whole document. Partial edits need typing at a caret.
- The drawer stays open between runs in local state. Close it when the note list would be covered.
- Auto-save is debounced. A read before the drawer updates can see the old value.
- The app stores both a plaintext `content` field and the encrypted `sec`. The proof is the body shown in the editor after reopen, plus the `sec.type` in the graph.
