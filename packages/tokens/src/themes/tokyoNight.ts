import { colorsFrom } from './colorsFrom'
import type { Theme } from './themes.types'

export const tokyoNight: Theme = {
  id: 'tokyo-night',
  name: 'Tokyo Night',
  scheme: 'dark',
  source: { url: 'https://github.com/enkia/tokyo-night-vscode-theme', license: 'MIT' },
  colors: colorsFrom({
    scheme: 'dark',
    shell: '#16161E',
    canvas: '#1A1B26',
    card: '#1F2335',
    sunken: '#16161E',
    overlay: '#13131A',
    stage: '#101014',
    primary: '#C0CAF5',
    secondary: '#A9B1D6',
    muted: '#9AA2C9',
    accent: '#7AA2F7',
    solid: '#7AA2F7',
    onAccent: '#16161E',
    success: '#9ECE6A',
    warning: '#E0AF68',
    danger: '#F7768E',
    type: {
      goal: '#BB9AF7',
      project: '#9ECE6A',
      task: '#E0AF68',
      adr: '#F7A8C4',
      doc: '#7DCFFF',
      context: '#73DACA',
      runbook: '#FF9E64',
    },
    key: '#F7768E',
    string: '#9ECE6A',
    date: '#E0AF68',
  }),
}
