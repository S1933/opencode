---
description: Sync les fichiers locaux vers le serveur SDEV via la skill rr-sync-dev
agent: build
---
Load the `rr-sync-dev` skill first, then sync to the SDEV server for: $ARGUMENTS

Reproduce the `rr` behaviour documented in the skill (do NOT invoke the interactive `rr` zsh function — its `(y/N)` prompt blocks in a non-interactive shell):

1. **Project** : if the first argument matches a project name (no path separator, no extension), use it as `<PROJECT>` under `/home/jnuel/sshfs/`; otherwise default to `ocms`. Remaining args are the file list.
2. **File list** : if no file args remain, build it from `git status --porcelain` (paths relative to repo root). If empty → report "Nothing to sync" and stop.
3. **Confirm** : print the resolved project and the exact file list, then ask the user to confirm in chat before running anything. Proceed only on explicit confirmation.
4. **Sync** : for each entry, run `rsync -avz` to `gw2sdev-docker.ovh.net:/home/jnuel/sshfs/<PROJECT>/<path>` — directories with a trailing `/` on the source, files directly. Skip missing local paths with `⚠️ Missing: <path>` (deletions are NOT propagated; sync is one-way, no `--delete`).
5. Report the final result per file.

Run from the repo root so relative paths match the remote tree.
