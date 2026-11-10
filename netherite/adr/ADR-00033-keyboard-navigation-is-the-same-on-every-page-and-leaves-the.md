---
id: ADR-00033
aliases: [ADR-00033]
type: adr
title: Keyboard navigation is the same on every page and leaves the browser's keys alone
created: 2026-11-10T11:00:42Z
created_by: "@vicentelyrio"
status: accepted
date: 2026-11-10
deciders: ["@vicentelyrio"]
project: PRJ-00014
---

# Keyboard navigation is the same on every page and leaves the browser's keys alone

## Context

Pages are reached with `mod+letter`. Some of those can never work: browsers keep `mod+t` for a new tab and the page never sees it. Others work by taking over something people use: `mod+l` is the address bar, `mod+p` print, `mod+d` bookmark and `mod+y` history. There is also no way to move between the sidebar and the page, or between a page's sections, without the mouse or a long run of the tab key.

Each `useShortcuts` call adds its own window listener, so the engine has no notion of a two-step key, of an open overlay or of where focus is. The conflict check compares whole key strings only.

## Decision

> We use one keyboard model in three layers, the first two identical on every page.
>
> - **Reach a page:** `g` then a letter. We drop the `mod+letter` page shortcuts, and anyone who wants one can rebind it in Settings.
> - **Move around:** `.` and `,` go to the next and previous section of the page and wrap inside the page. `;` jumps between the sidebar and the page, and returns to the section it left. `F6` and `shift+F6` do what `.` and `,` do and also work while typing.
> - **Act on the page:** single letters, with shared verbs where pages do the same thing, and keys of its own for each page.
> - Sections are declared by the page templates, so a page gets them without code of its own.
> - An open drawer or modal has its own sections. While it is open, `;` and the page's keys are paused.
> - Default shortcuts use `mod` only for `mod+k` search and `mod+s` save, and a test enforces it.
> - The Settings recorder refuses keys the browser owns.
> - Plain keys stay off inside inputs and the editor. `Esc` leaves an input first.
> - We use `.` and `,` rather than `[` and `]` because brackets need AltGr on Spanish keyboards.

## Consequences

- \+ No default shortcut is dead or takes over a browser feature.
- \+ The way around a page is learned once and works everywhere.
- \+ Two-step keys leave room for many more shortcuts.
- \- Reaching a page takes two key presses instead of one.
- \- Page keys do not work while typing, so `Esc` comes first.
- \- People used to the `mod+letter` shortcuts have to relearn them or rebind them.
- \- `.`, `,` and `;` are no longer free for a page to use.
