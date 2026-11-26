# Write a code snippet

A code snippet is a note with a language and a code body. The default language is JSON. The snippet is saved with the same auto-save and encryption as a text note.

## Sub-features

- `snippet-create` opens a blank snippet from the empty state or the drawer.
- `snippet-language` selects a language from the combobox.
- `snippet-body` edits the code and auto-saves it.
- `snippet-list` shows the snippet in the drawer with its own timestamp.

## How to get to it (user POV)

- Choose `Create a Snippet` on the empty state.
- Open the drawer and choose `Add new code snippet`.
- Press `Alt+c` while focus is outside a text field.

## Driving it with browse

Preconditions:

- A vault is open and the drawer can be opened.
- No snippet is named `Migration snippet`.

- **Open the editor.** Choose `Toggle drawer`, then `Add new code snippet`. A tab titled `Untitled snippet` appears.
- **Name the snippet.** Fill the name textbox with `Migration snippet`.
- **Choose a language.** The language combobox starts at `Json`. Leave it for the seeded fixture, or select another language with `tools.browse.select({ tab, ref, value })` for a separate lane.
- **Write the code.** Fill the body textbox with a small JSON object that includes `"version": 2` and a `note` field.
- **Wait for auto-save.** Wait until the drawer list has a second entry. The snippet tab title becomes `Migration snippet`.
- **Confirm the stored type.** Run the graph diagnostic. The node has `type: "code"`, `language: "json"`, and a `sec.type` of `aes-gcm-self-ssm-v2` on the old build or `aes-gcm-self-ssm-v3` after migration.
- **Proof.** Save a screenshot with the snippet body visible and capture the graph diagnostic row for this node.

## Gotchas

- The body textbox and the name textbox are both `textbox` roles. Use the snapshot refs, not role order.
- The drawer's `Add new code snippet` button is not in the ARIA tree while the drawer is closed.
- The keyboard shortcut depends on the browser not sending `Alt+c` to a menu. Prefer the drawer button.
- A snippet's `language` is stored in plaintext next to the encrypted `sec`. Both versions of the migration keep it unchanged.
