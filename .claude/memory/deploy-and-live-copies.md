---
name: deploy-and-live-copies
description: Где крутится живой MCP (Мак и Hermes kitezh), почему правки — только в worktree, как раскатывать
metadata:
  type: project
---

Живых копий две, обе собираются из `LameBaker/mcp-remnawave` (`origin`; `upstream` — TrackLine, только чтение, `git push` без аргументов даёт 403):

- **Мак:** Claude Code запускает `node ~/Code/mcp-remnawave/dist/index.js`. Поэтому `npm install`/`npm run build` в этой рабочей копии меняют живой MCP при следующем старте сессии — править в `git worktree` (например `~/Code/mcp-remnawave-<тема>`), в основной копии только `npm ci && npm run build` после слияния.
- **Hermes, профиль kitezh (сервер talaria):** `node ~/src/mcp-remnawave/dist/index.js`, `trust: untrusted` — тулы без `readOnlyHint` спрашивают кнопкой в Telegram. `dist/` не в git, сам не обновляется: `ssh bakerlame@34.179.237.205`, там `cd ~/src/mcp-remnawave && git pull && npm ci && npm run build`, затем `hermes gateway restart` — всё через `bash -lc "…"` (в неинтерактивном ssh `npm` и `hermes` из `~/.local/bin` нет в PATH; шлюз общий, ждёт конца текущих ходов). Агент делает это сам, с песочницей выкл. (проверено 15.10.2026).

Песочница Claude Code: `git push` и `git worktree add/remove` идут только вне песочницы; `npm test` тоже (поднимает локальный порт). npm — с `npm_config_cache=$TMPDIR/npmcache`.

**Why:** правка «на месте» уже ломала живой MCP; Hermes молча остаётся на старой сборке.
**How to apply:** перед любой правкой — worktree; после пуша — напомнить про `npm ci && npm run build` на обеих копиях. Связано: [[contract-coverage-policy]].
