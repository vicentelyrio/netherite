---
id: DOC-00003
aliases: [DOC-00003]
type: doc
title: Keyboard map
created: 2026-11-10T11:00:42Z
created_by: "@vicentelyrio"
project: PRJ-00014
explains: [ADR-00033]
covers: [apps/web/src/infrastructure/shortcuts/actions.ts, apps/web/src/infrastructure/shortcuts/reserved.ts]
reviewed_at: 2026-11-10
---

# Keyboard map

The default keys of the web app, and the rules any new shortcut has to follow. It is the target for [[PRJ-00014]] and the reasoning is in the project's decision record. Until that project is done, the app still uses the older keys.

## How it works

Keys come in three layers. The first two are the same on every page.

### Reach a page

| Keys | Page |
| --- | --- |
| `g` `i` | Inbox |
| `g` `g` | Goals |
| `g` `p` | Projects |
| `g` `k` | Knowledge |
| `g` `r` | Graph |
| `g` `l` | Timeline |
| `g` `t` | Tags |
| `g` `d` | Stats |
| `g` `s` | Settings |

`mod+k` opens search from anywhere, and `?` opens the cheat sheet.

### Move around

| Keys | What it does |
| --- | --- |
| `.` or `F6` | Next section of the page, wrapping inside the page |
| `,` or `shift+F6` | Previous section of the page |
| `;` | Jump between the sidebar and the page, back to the section left |
| `j` `k` or arrows | Move between the items of the section |
| `Enter` | Open the item |
| `Esc` | Climb one level: input, then section, then close the drawer |

Inside a drawer or modal, `.` and `,` go through its own sections, and `;` and the page's keys are paused.

### Act on the page

Shared verbs, wherever a page has the action:

| Keys | What it does |
| --- | --- |
| `n` | New item |
| `/` | Filter or search the page |
| `mod+s` | Save in the editor |

Keys per page. These are to be confirmed against each screen when built.

| Page | Keys |
| --- | --- |
| Inbox | `e` archive, `h` snooze |
| Project board | `h` `l` change column, `shift+h` `shift+l` move the card, `m` move to another project |
| Task drawer | `t` switch between text and code |
| Graph | `+` `-` zoom, `0` reset |

## How to use it

Adding a shortcut:

- Add the action to the registry in `actions.ts`, with the scope of the page it belongs to. It then appears in Settings and the cheat sheet.
- Use a plain key or a two-step key. `mod` is allowed for `mod+k` and `mod+s` only.
- Do not use `.`, `,`, `;`, `?` or `g` as the first key: those belong to the layers every page shares.
- The same key can mean different things on different pages, but not in a page and in the global scope.
