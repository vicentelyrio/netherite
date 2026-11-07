import { colorsFrom } from './colorsFrom'
import type { Theme } from './themes.types'

export const catppuccinMocha: Theme = {
  id: 'catppuccin-mocha',
  name: 'Catppuccin Mocha',
  scheme: 'dark',
  source: { url: 'https://github.com/catppuccin/catppuccin', license: 'MIT' },
  colors: colorsFrom({
    scheme: 'dark',
    shell: '#181825',
    canvas: '#1E1E2E',
    card: '#232334',
    sunken: '#181825',
    overlay: '#11111B',
    stage: '#11111B',
    primary: '#CDD6F4',
    secondary: '#BAC2DE',
    muted: '#A0A6BF',
    accent: '#CBA6F7',
    solid: '#CBA6F7',
    onAccent: '#1E1E2E',
    success: '#A6E3A1',
    warning: '#F9E2AF',
    danger: '#F38BA8',
    type: {
      goal: '#CBA6F7',
      project: '#A6E3A1',
      task: '#F9E2AF',
      adr: '#F5C2E7',
      doc: '#89B4FA',
      context: '#94E2D5',
      runbook: '#FAB387',
    },
    key: '#F38BA8',
    string: '#A6E3A1',
    date: '#FAB387',
  }),
}
