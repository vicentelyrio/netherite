import { color } from '../color'
import { catppuccinMocha } from './catppuccinMocha'
import { dracula } from './dracula'
import { gruvboxDark } from './gruvboxDark'
import { netheriteLight } from './netheriteLight'
import { nord } from './nord'
import { solarizedLight } from './solarizedLight'
import type { Theme } from './themes.types'
import { tokyoNight } from './tokyoNight'

export const defaultThemeId = 'netherite'

const netherite: Theme = { id: defaultThemeId, name: 'Netherite', scheme: 'dark', colors: color }

export const themes: ReadonlyArray<Theme> = [
  netherite,
  netheriteLight,
  dracula,
  nord,
  catppuccinMocha,
  tokyoNight,
  gruvboxDark,
  solarizedLight,
]

export const themeById = (id: string): Theme | undefined => themes.find((theme) => theme.id === id)

export const defaultTheme = netherite
