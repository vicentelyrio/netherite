# i18n

Words live in `en/index.ts` (the base language) and are used as `const { LL } = useI18nContext()`,
then `LL.status.live()`. [typesafe-i18n](https://github.com/codingcommons/typesafe-i18n) generates
the types from `en/`, so a missing message, a wrong name or a missing value is a type error.

After changing a file in `en/` (or adding a language folder next to it), regenerate:

```sh
pnpm --filter @netherite/web i18n          # once
pnpm --filter @netherite/web i18n --watch  # while editing
```

The generated files (`i18n-*.ts`, `i18n-react.tsx`) are committed and are not linted or formatted.
`formatters.ts` is yours: add formatters there (for dates, see `infrastructure/datetime`).
