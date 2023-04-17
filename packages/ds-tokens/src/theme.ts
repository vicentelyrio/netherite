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
  boxLight: '#434962',
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
  space: [0, 4, 8, 16, 20, 32, 64, 128, 256, 512],
  sizes: [0, 4, 8, 16, 20, 32, 64, 128, 256, 512],
  fonts: {
    body: '"Source Sans Pro", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    heading: 'inherit',
    monospace: '"Source Code Pro", Menlo, monospace',
  },
  fontSizes: [12, 14, 16, 20, 24, 36, 48, 64],
  fontWeights: {
    body: 400,
    heading: 400,
    bold: 700,
  },
  lineHeights: {
    body: 1.4,
    heading: 1.2,
    caption: 1,
  },
  colors,
  text: {
    heading: {
      fontFamily: 'heading',
      lineHeight: 'heading',
      fontWeight: 'heading',
    },
    bodySmall: {
      fontFamily: 'heading',
      lineHeight: 'body',
      fontWeight: 'body',
      fontSize: 1,
    },
    bodyMedium: {
      fontFamily: 'heading',
      lineHeight: 'body',
      fontWeight: 'body',
      fontSize: 2,
    },
    bodyLarge: {
      fontFamily: 'heading',
      lineHeight: 'body',
      fontWeight: 'body',
      fontSize: 4,
    },
    h1: {
      fontFamily: 'heading',
      lineHeight: 'heading',
      fontWeight: 'heading',
      fontSize: 7,
    },
    h2: {
      fontFamily: 'heading',
      lineHeight: 'heading',
      fontWeight: 'heading',
      fontSize: 6,
    },
    h3: {
      fontFamily: 'heading',
      lineHeight: 'heading',
      fontWeight: 'heading',
      fontSize: 5,
    },
    h4: {
      fontFamily: 'heading',
      lineHeight: 'heading',
      fontWeight: 'heading',
      fontSize: 4,
    },
    h5: {
      fontFamily: 'heading',
      lineHeight: 'heading',
      fontWeight: 'heading',
      fontSize: 3,
    },
    h6: {
      fontFamily: 'heading',
      lineHeight: 'heading',
      fontWeight: 'heading',
      fontSize: 2,
    },
    codeSmall: {
      fontFamily: 'monospace',
      lineHeight: 'body',
      fontWeight: 'body',
      fontSize: 1,
    },
    codeMedium: {
      fontFamily: 'monospace',
      lineHeight: 'body',
      fontWeight: 'body',
      fontSize: 2,
    },
    codeLarge: {
      fontFamily: 'monospace',
      lineHeight: 'body',
      fontWeight: 'body',
      fontSize: 4,
    },
    caption: {
      fontFamily: 'body',
      lineHeight: 'caption',
      fontWeight: 'body',
      fontSize: 1,
      textTransform: 'uppercase'
    },
    button: {
      fontFamily: 'body',
      lineHeight: 'caption',
      fontWeight: 'bold',
      fontSize: 1,
      textTransform: 'uppercase'
    },
  },
  styles: {
    root: {
      fontFamily: 'body',
      lineHeight: 'body',
      fontWeight: 'body',
    },
  },
  cards: {
    primary: {
      borderRadius: 14,
      background: 'backgroundDark',
      padding: 3,
      display: 'flex',
      flexFlow: 'column',
    }
  }
}

