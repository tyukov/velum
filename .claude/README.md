# Навыки Claude Code для этого проекта

Claude Code подхватывает их автоматически в каждой сессии с этим репозиторием.

| Навык | Источник | Версия |
|---|---|---|
| `skills/frontend-design` | [anthropics/skills](https://github.com/anthropics/skills) (официальный, Anthropic) | `ca45fc4` |
| `skills/accessibility`, `skills/core-web-vitals`, `skills/performance` | [addyosmani/web-quality-skills](https://github.com/addyosmani/web-quality-skills) (MIT, Addy Osmani) | `afa8da9` (24.08.2026) |
| `skills/cro` | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) (MIT, Corey Haines) | `e88ace7` (08.10.2026) |

Файлы скопированы без изменений (у `cro` не взята папка `evals/` — тестовые данные авторов).
Перед добавлением проверены: нет скрытых символов Unicode, инструкций, меняющих поведение Claude,
скриптов, хуков и запросов ключей. Ссылки ведут только на документацию и примеры (`example.com`);
`fetch(`/`sendBeacon` встречаются лишь в примерах кода. `web-quality` ссылаются друг на друга
(`../performance/references/...`) — копировать все три вместе.

Обновлять осознанно: взять новый коммит, заново проверить изменения и записать версию в таблицу.

## Дополнительно: набор для Astro (ставится отдельно)

[JordiParraCrespo/astro-skills](https://github.com/JordiParraCrespo/astro-skills) — 17 навыков
и 5 агентов аудита (`/astro audit`, `/astro seo`, `/astro perf`, `/astro a11y`). Проверен
30.10.2026 (коммит `0d5ea70`): инъекций и вредного кода нет, сканер только читает файлы.
Это сторонний код, поэтому он не хранится в репозитории и ставится как плагин:

```
/plugin marketplace add JordiParraCrespo/astro-skills
```

После обновлений плагина стоит заново просмотреть изменения.
