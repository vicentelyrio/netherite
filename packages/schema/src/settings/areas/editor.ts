import { Browser, boolean, Constant, integer } from '../define'

export const editor = {
  autosaveDelayMs: integer(1000, Browser, 'Wait after typing stops before saving.', {
    locator: 'netherite.settings',
    unit: 'ms',
    min: 100,
    max: 60_000,
  }),
  lintDelayMs: integer(400, Constant, 'Wait after typing stops before checking the file.', {
    unit: 'ms',
    min: 0,
  }),
  vimMode: boolean(false, Browser, 'Edit with vim keys in the Markdown editor.', {
    locator: 'netherite.settings',
  }),
} as const
