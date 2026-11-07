import { colorsFrom } from './colorsFrom'
import type { Theme } from './themes.types'

export const nord: Theme = {
  id: 'nord',
  name: 'Nord',
  scheme: 'dark',
  source: { url: 'https://github.com/nordtheme/nord', license: 'MIT' },
  colors: colorsFrom({
    scheme: 'dark',
    shell: '#272C36',
    canvas: '#2E3440',
    card: '#343B49',
    sunken: '#242933',
    overlay: '#242933',
    stage: '#1F232C',
    primary: '#ECEFF4',
    secondary: '#D8DEE9',
    muted: '#AEB7CA',
    accent: '#88C0D0',
    solid: '#88C0D0',
    onAccent: '#242933',
    success: '#A3BE8C',
    warning: '#EBCB8B',
    danger: '#E8949C',
    type: {
      goal: '#D0AECA',
      project: '#A3BE8C',
      task: '#EBCB8B',
      adr: '#E0A58E',
      doc: '#9BBCDC',
      context: '#8FBCBB',
      runbook: '#88C0D0',
    },
    key: '#E8949C',
    string: '#A3BE8C',
    date: '#EBCB8B',
  }),
}
