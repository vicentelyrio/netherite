import { Browser, text } from '../define'

export const display = {
  language: text('', Browser, 'Language of the app. Empty follows the browser.', {
    locator: 'netherite.settings',
  }),
} as const
