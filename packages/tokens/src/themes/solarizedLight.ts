import { colorsFrom } from './colorsFrom'
import type { Theme } from './themes.types'

export const solarizedLight: Theme = {
  id: 'solarized-light',
  name: 'Solarized Light',
  scheme: 'light',
  source: { url: 'https://github.com/altercation/solarized', license: 'MIT' },
  colors: colorsFrom({
    scheme: 'light',
    shell: '#EEE8D5',
    canvas: '#FDF6E3',
    card: '#FFFBEF',
    sunken: '#F3ECD8',
    overlay: '#FFFBEF',
    stage: '#E8E1CD',
    primary: '#073642',
    secondary: '#3F565E',
    muted: '#55696F',
    accent: '#1A6498',
    solid: '#1A6498',
    onAccent: '#FDF6E3',
    success: '#566400',
    warning: '#7A5D00',
    danger: '#B3201E',
    type: {
      goal: '#5459A8',
      project: '#566400',
      task: '#7A5D00',
      adr: '#A82565',
      doc: '#1A6498',
      context: '#176B64',
      runbook: '#9E3A0E',
    },
    key: '#A82565',
    string: '#176B64',
    date: '#7A5D00',
  }),
}
