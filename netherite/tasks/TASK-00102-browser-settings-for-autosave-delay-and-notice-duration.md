---
id: TASK-00102
aliases: [TASK-00102]
type: task
title: Browser settings for autosave delay and notice duration
created: 2026-11-07T16:07:11Z
created_by: "@vicentelyrio"
project: PRJ-00008
state: backlog
depends_on: [TASK-00101]
---

# Browser settings for autosave delay and notice duration

Expose the personal timing settings that are fixed in code today, saved per browser.

## Checklist

- [ ] Autosave delay can be changed on the Editor tab, and the editor uses it
- [ ] Notice duration can be changed on the General tab, and notices use it
- [ ] Each setting honours the limits in the settings catalog, and an invalid stored value falls back to the default
- [ ] The catalog marks both as browser settings with a locator
- [ ] Tests cover saving, reloading and bad stored values

## Notes
