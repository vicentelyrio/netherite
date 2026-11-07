import { colorsFrom } from './colorsFrom'
import type { Theme } from './themes.types'

export const dracula: Theme = {
  id: 'dracula',
  name: 'Dracula',
  scheme: 'dark',
  source: { url: 'https://github.com/dracula/dracula-theme', license: 'MIT' },
  colors: colorsFrom({
    scheme: 'dark',
    shell: '#21222C',
    canvas: '#282A36',
    card: '#242632',
    sunken: '#191A21',
    overlay: '#191A21',
    stage: '#14151B',
    primary: '#F8F8F2',
    secondary: '#DADAD4',
    muted: '#A7AECB',
    accent: '#BD93F9',
    solid: '#BD93F9',
    onAccent: '#21222C',
    success: '#50FA7B',
    warning: '#FFB86C',
    danger: '#FF7A7A',
    type: {
      goal: '#BD93F9',
      project: '#50FA7B',
      task: '#F1FA8C',
      adr: '#FF79C6',
      doc: '#8BE9FD',
      context: '#7DEBC8',
      runbook: '#FFB86C',
    },
    key: '#FF79C6',
    string: '#F1FA8C',
    date: '#FFB86C',
  }),
}
