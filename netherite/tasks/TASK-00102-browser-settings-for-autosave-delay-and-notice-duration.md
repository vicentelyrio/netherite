---
id: TASK-00102
aliases: [TASK-00102]
type: task
title: Browser settings for autosave delay and notice duration
created: 2026-11-07T16:07:11Z
created_by: "@vicentelyrio"
project: PRJ-00008
state: done
position: 48.0625
depends_on: [TASK-00101]
---

# Browser settings for autosave delay and notice duration

Expose the personal timing settings that are fixed in code today, saved per browser.

## Checklist

- [x] Autosave delay can be changed on the Editor tab, and the editor uses it
- [x] Notice duration can be changed on the General tab, and notices use it
- [x] Each setting honours the limits in the settings catalog, and an invalid stored value falls back to the default
- [x] The catalog marks both as browser settings with a locator
- [x] Tests cover saving, reloading and bad stored values

## Notes

Awaiting review. Both settings are presets on a segmented control, so a person cannot type an invalid value. A stored value that is inside the catalog's limits but not a preset still shows, as an extra option.

- General is now the first tab and the default.
- A notice with an action stays for the longer of the chosen duration and `notices.lifetimeWithActionsMs`.
- Limits added to the catalog: autosave 100 ms to 60 s, notices 1 s to 60 s.
