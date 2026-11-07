import { Browser, map } from '../define'

export const shortcuts = {
  bindings: map(
    {},
    Browser,
    'Keys chosen for each action, over the defaults in the shortcut registry.',
    { locator: 'netherite.settings' },
  ),
} as const
