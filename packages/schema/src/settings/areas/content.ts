import { StateCategoryName } from '../../enums/StateCategoryName'
import { ConfigFile, Constant, integer, list, text } from '../define'

export const content = {
  folder: text('netherite', ConfigFile, 'Folder that holds the items.', { locator: 'content' }),
  idPadding: integer(5, ConfigFile, 'Digits in an item ID.', { locator: 'id_padding', min: 1 }),
  slugMaxLength: integer(60, Constant, 'Longest title part of a file name.', {
    unit: 'chars',
    min: 1,
  }),
  states: list(
    [
      { name: 'backlog', category: StateCategoryName.Todo },
      { name: 'doing', category: StateCategoryName.Active },
      { name: 'blocked', category: StateCategoryName.Blocked },
      { name: 'done', category: StateCategoryName.Done },
    ],
    ConfigFile,
    'Task states and the category each counts as.',
    { locator: 'states' },
  ),
} as const
