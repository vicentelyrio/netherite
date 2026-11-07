import { colorsFrom } from './colorsFrom'
import type { Theme } from './themes.types'

export const netheriteLight: Theme = {
  id: 'netherite-light',
  name: 'Netherite Light',
  scheme: 'light',
  colors: colorsFrom({
    scheme: 'light',
    shell: '#E9EAF4',
    canvas: '#F6F6FB',
    card: '#FFFFFF',
    sunken: '#EDEEF6',
    overlay: '#FFFFFF',
    stage: '#E3E4F0',
    primary: '#1E2032',
    secondary: '#40435C',
    muted: '#5A5E7A',
    accent: '#4A4DC0',
    solid: '#4F52C9',
    onAccent: '#FFFFFF',
    success: '#0F6E45',
    warning: '#7F5900',
    danger: '#B3243A',
    type: {
      goal: '#4F52C9',
      project: '#1B6E4C',
      task: '#7F5C00',
      adr: '#7C3AAF',
      doc: '#1C64A3',
      context: '#136E63',
      runbook: '#A3461E',
    },
    key: '#A82545',
    string: '#1B6E4C',
    date: '#7F5900',
  }),
}
