import type { Theme } from '@theme-ui/core'

const colors = {
  text: '#B4B8C4',
  textHighlight: '#F6F9FA',
  textMuted: '#8B8D9D',
  accent: '#858DD1',
  accentBlue: '#0092FE',
  accentGreen: '#0BA75D',
  accentYellow: '#FCBA06',
  box: '#32364A',
  boxLight: '#303548',
  boxDark: '#1E202F',
  background: '#2B2E44',
  backgroundDark: '#26293E',
  shadow: '#222436',
  shadowDark: '#1E202F',
  shadowDarkest: '#1A1B21',
} as const

export interface ThemeDS extends Theme {
  colors: typeof colors
}

export const theme: ThemeDS = {
  breakpoints: ['40em', '52em', '64em'],
  space: [0, 4, 8, 16, 32, 64, 128, 256, 512],
  sizes: [0, 4, 8, 16, 32, 64, 128, 256, 512],
  fonts: {
    body: '"Source Sans Pro", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    heading: 'inherit',
    monospace: '"Source Code Pro", Menlo, monospace',
  },
  fontSizes: [12, 14, 16, 20, 24, 36, 48, 64],
  fontWeights: {
    body: 400,
    heading: 700,
    bold: 600,
    avatar: 600,
  },
  lineHeights: {
    body: 1.4,
    heading: 1.2,
    avatar: 1,
  },
  colors: {
    text: '#B4B8C4',
    textHighlight: '#F6F9FA',
    textMuted: '#8B8D9D',
    accent: '#858DD1',
    accentBlue: '#0092FE',
    accentGreen: '#0BA75D',
    accentYellow: '#FCBA06',
    box: '#32364A',
    boxLight: '#303548',
    boxDark: '#1E202F',
    background: '#2B2E44',
    backgroundDark: '#26293E',
    shadow: '#222436',
    shadowDark: '#1E202F',
    shadowDarkest: '#1A1B21',
  },
  text: {
    heading: {
      fontFamily: 'heading',
      lineHeight: 'heading',
      fontWeight: 'heading',
    },
  },
  styles: {
    root: {
      fontFamily: 'body',
      lineHeight: 'body',
      fontWeight: 'body',
    },
    h1: {
      variant: 'text.heading',
      fontSize: 7,
    },
    h2: {
      variant: 'text.heading',
      fontSize: 6,
    },
    h3: {
      variant: 'text.heading',
      fontSize: 5,
    },
    h4: {
      variant: 'text.heading',
      fontSize: 4,
    },
    h5: {
      variant: 'text.heading',
      fontSize: 3,
    },
    h6: {
      variant: 'text.heading',
      fontSize: 2,
    },
    bodySmall: {
      variant: 'text.body',
      fontSize: 1,
    },
    bodyMedium: {
      variant: 'text.body',
      fontSize: 2,
    },
    bodyLarge: {
      variant: 'text.body',
      fontSize: 4,
    },
    pre: {
      fontFamily: 'monospace',
      overflowX: 'auto',
      code: {
        color: 'inherit',
      },
    },
    code: {
      fontFamily: 'monospace',
      fontSize: 'inherit',
    },
    table: {
      width: '100%',
      borderCollapse: 'separate',
      borderSpacing: 0,
    },
    th: {
      textAlign: 'left',
      borderBottomStyle: 'solid',
    },
    td: {
      textAlign: 'left',
      borderBottomStyle: 'solid',
    },
  },
}

