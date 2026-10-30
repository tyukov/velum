# Навыки Claude Code для этого проекта

Claude Code подхватывает их автоматически в каждой сессии с этим репозиторием.

| Навык | Источник | Версия |
|---|---|---|
| `skills/frontend-design` | [anthropics/skills](https://github.com/anthropics/skills) (официальный, Anthropic) | `ca45fc4` |

Файлы скопированы без изменений. Перед добавлением проверены: нет скрытых символов Unicode,
спрятанных комментариев, внешних ссылок и инструкций, меняющих поведение Claude.

## Дополнительно: набор для Astro (ставится отдельно)

[JordiParraCrespo/astro-skills](https://github.com/JordiParraCrespo/astro-skills) — 17 навыков
и 5 агентов аудита (`/astro audit`, `/astro seo`, `/astro perf`, `/astro a11y`). Проверен
30.10.2026 (коммит `0d5ea70`): инъекций и вредного кода нет, сканер только читает файлы.
Это сторонний код, поэтому он не хранится в репозитории и ставится как плагин:

```
/plugin marketplace add JordiParraCrespo/astro-skills
```

После обновлений плагина стоит заново просмотреть изменения.
