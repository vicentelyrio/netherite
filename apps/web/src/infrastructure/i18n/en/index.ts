import type { BaseTranslation } from '../i18n-types'

/**
 * The app's words, in English, which is the base language: other languages are checked against
 * this shape. A message that needs a value takes it in braces, `{count:number}`, and plurals are
 * written `{{item|items}}` (see the typesafe-i18n docs). Group messages by screen, not by wording,
 * and run `pnpm --filter @netherite/web i18n` after changing this file to regenerate the types.
 */
const en = {
  status: {
    connecting: 'Connecting…',
    live: 'Live',
    offline: 'Offline: reconnecting',
    items: '{count:number} {{item|items}}',
    noGit: 'no git',
  },
} satisfies BaseTranslation

export default en
