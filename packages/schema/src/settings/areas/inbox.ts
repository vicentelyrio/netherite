import { ConfigFile, Constant, integer, map } from '../define'

export const inbox = {
  rules: map({}, ConfigFile, 'Set a rule to false to stop the Inbox raising it.', {
    locator: 'inbox.rules',
  }),
  captureMaxLength: integer(500, Constant, 'Longest line accepted as a capture.', {
    unit: 'chars',
    min: 1,
  }),
  changesShown: integer(8, Constant, 'Rows shown per group before "show all".', {
    unit: 'items',
    min: 1,
  }),
} as const
