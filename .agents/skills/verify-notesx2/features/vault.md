# Create and open a vault

A vault is the unit of encrypted storage. A new vault generates a 12-word key the user must copy. An existing vault opens when that key is entered. A tab keeps the key unlocked for a chosen period.

## Sub-features

- `vault-create` generates a new vault and presents its key.
- `vault-copy` copies the key and enters the app shell.
- `vault-open` opens an existing vault with its key.
- `vault-ttl` keeps the vault unlocked in the tab for 15 minutes, 1 hour, 8 hours, or 1 day.

## How to get to it (user POV)

- Choose `Create a new vault` on the login card.
- Enter a phrase in `Open vault with vault key` and choose `Open vault`.
- Press Enter in the vault key input instead of clicking the button.
- Choose a duration in the `Keep vault unlocked in this tab for` dropdown before opening.

## Driving it with browse

Preconditions:

- The app is healthy and the login card with heading `Welcome to NOTESx2` is visible.
- No vault key is stored in this tab's sessionStorage.

- **Create vault.** Choose `Create a new vault`. Run `tools.browse.click({ tab, ref })` on the button. The key input becomes disabled, the TTL dropdown appears, and the button `Copy vault key — don't lose it!` appears.
- **Read the key.** Run `tools.browse.eval({ tab, expression: 'document.querySelector(\'input[type="password"]\').value', world: "main" })`. The result is twelve space-separated words. Save it in scratch state for later lanes.
- **Enter the shell.** Choose `Copy vault key — don't lose it!`. The login card is replaced by `Toggle drawer` and the empty-state buttons `Create a Note` and `Create a Snippet`.
- **Open the same vault.** Open a fresh tab at the same origin. Fill `Open vault with vault key` with the saved phrase, then choose `Open vault`. The note list and any restored note tabs return.
- **Keyboard entry.** Fill the vault key input and press Enter. The same shell appears.
- **TTL.** Open a new tab and select `1 Hour` in the dropdown before choosing `Open vault`. The shell appears and the vault stays unlocked in that tab.
- **Proof.** Save a screenshot of the shell with the note list visible and an ARIA snapshot of the login card taken before entry.

## Gotchas

- The generated key lives in a password input. The ARIA snapshot redacts its value, so read it with the read-only eval above.
- A reused tab can resume the session from sessionStorage and skip the login card. Use a new tab for the open lane.
- Opening the same origin in two builds at once shares OPFS. Stop the first server before starting the second.
- The key has no recovery path in this app. Keep the scratch copy until the migration proof is saved.
