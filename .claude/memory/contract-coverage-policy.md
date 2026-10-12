---
name: contract-coverage-policy
description: Олег хочет «ультимативный» MCP — полное покрытие контракта Remnawave; как сверять при обновлении пакета
metadata:
  type: feedback
---

При обновлении `@remnawave/backend-contract` покрывать ВСЕ новые эндпоинты и поля, а не только чинить сломанное (просьба 12.10.2026: «у нас должен быть ултимативный mcp»).

Порядок: поднять пакет в worktree → `npm run check` (typecheck, regression, `check:contract` — непокрытые команды и поля, `check:requests` — каждый тул шлёт запрос, проходящий схему контракта, включая лишние ключи и числовые `:userId`, `docs:tools -- --check`) → покрыть всё из отчётов → `npm run docs:tools`.
Осознанно не покрываются только команды из `INTENTIONALLY_UNCOVERED` в `tests/contract-coverage.ts` (вход в веб-панель, passkey, OTT, веб-терминал ноды).

**Why:** при переходе 3.2→3.4 молча умирали поля (`excludedInternalSquads` → `internalSquads`, `userUuids` → `userIds`), а тулы отвечали успехом.
**How to apply:** зелёные проверки ≠ проверено на панели — новые тулы после обновления прогнать хотя бы чтением на живой панели. Связано: [[deploy-and-live-copies]].
