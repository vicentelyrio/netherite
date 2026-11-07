import { Browser, text } from '../define'

export const display = {
  theme: text('netherite', Browser, 'Colours of the app.', { locator: 'netherite.settings' }),
  language: text('', Browser, 'Language of the app. Empty follows the browser.', {
    locator: 'netherite.settings',
  }),
} as const
