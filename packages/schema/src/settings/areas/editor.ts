import { Browser, boolean, Constant, integer } from '../define'

export const editor = {
  autosaveDelayMs: integer(1000, Constant, 'Wait after typing stops before saving.', {
    unit: 'ms',
    min: 0,
  }),
  lintDelayMs: integer(400, Constant, 'Wait after typing stops before checking the file.', {
    unit: 'ms',
    min: 0,
  }),
  vimMode: boolean(false, Browser, 'Edit with vim keys in the Markdown editor.', {
    locator: 'netherite.settings',
  }),
} as const
