import { colorsFrom } from './colorsFrom'
import type { Theme } from './themes.types'

export const gruvboxDark: Theme = {
  id: 'gruvbox-dark',
  name: 'Gruvbox Dark',
  scheme: 'dark',
  source: { url: 'https://github.com/morhetz/gruvbox', license: 'MIT' },
  colors: colorsFrom({
    scheme: 'dark',
    shell: '#1D2021',
    canvas: '#282828',
    card: '#2E2C2B',
    sunken: '#1D2021',
    overlay: '#1D2021',
    stage: '#141617',
    primary: '#EBDBB2',
    secondary: '#D5C4A1',
    muted: '#B5A68F',
    accent: '#FABD2F',
    solid: '#FABD2F',
    onAccent: '#1D2021',
    success: '#B8BB26',
    warning: '#FE8019',
    danger: '#FB6A55',
    type: {
      goal: '#D3869B',
      project: '#B8BB26',
      task: '#FABD2F',
      adr: '#FE8019',
      doc: '#83A598',
      context: '#8EC07C',
      runbook: '#E2A488',
    },
    key: '#FB6A55',
    string: '#B8BB26',
    date: '#FABD2F',
  }),
}
