---
id: ADR-00031
aliases: [ADR-00031]
type: adr
title: Languages ship with the app and are chosen per browser
created: 2026-11-07T16:06:50Z
created_by: "@vicentelyrio"
status: accepted
date: 2026-11-07
deciders: ["@vicentelyrio"]
project: PRJ-00008
---

# Languages ship with the app and are chosen per browser

## Context

The app's words already live in `apps/web/src/infrastructure/i18n/en` with generated types, and adding a language means adding a folder next to it. We are adding Spanish (`es`) and Brazilian Portuguese (`pt-BR`). The choice has to be stored somewhere, and a first-time reader should not have to find a setting to get their language.

## Decision

- Every language is bundled and loaded up front, so a screen never waits for words.
- The Settings page has a language switcher listing English, Español and Português (Brasil), each named in its own language. A change applies at once, with no reload.
- The choice is per browser, stored in `netherite.settings` with the other personal settings. It is not written to `config.yml`, because two people sharing a repository can read different languages.
- With no stored choice, we use the closest match to the browser's language, and otherwise English. `pt` of any region resolves to `pt-BR` and `es` of any region to `es`.
- Dates and numbers follow the chosen language.
- Only the app's interface is translated. Item content, the CLI, MCP tool text, lint messages from the server and the documentation site stay in English.

## Consequences

- \+ A missing or misnamed message in any language is a type error.
- \+ No request or loading state is added.
- \- Each language adds to the bundle, and the budget has to allow for it.
- \- Screens mix languages where server text, such as lint messages, is shown.
- \- Every new message now needs three translations.
