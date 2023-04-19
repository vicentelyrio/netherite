import type { Theme as ThemeUI } from '@theme-ui/core'

const makeTheme = <T extends ThemeUI>(t: T) => t

/*
*
* Colors
* */
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

/* Breakpoints (max values)
*  - 576px mobile
*  - 992px tablet
*  - 1920px desktop 2k
*  - 2800px desktop 4k
* */
const breakpoints = [36, 64, 120, 175].map((n) => n + 'em')

/*
*
* Sizes
* */
const sizes = [0, 4, 8, 16, 20, 32, 64, 96, 128, 256, 512]

/*
*
* Theme
* */
export const theme = makeTheme({
  breakpoints,
  sizes,
  space: sizes,
  radii: sizes,
  colors,
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
  grids: {
    page: {
      gridTemplateAreas: '"navigation workspace"',
      gridTemplateColumns: `${sizes[6]}px 1fr`,
      gridTemplateRows: 'auto',
      gap: 0,
    },
    pageWorkspace: {
      gap: [2, 3, 3, 4],
      gridTemplateColumns: [
        'repeat(8, 1fr)',
        'repeat(12, 1fr)',
        'repeat(18, 1fr)',
        'repeat(22, 1fr)',
      ],
    },
    workspace: {
      gap: [2, 3, 3, 4],
      gridTemplateColumns: [
        'repeat(6, 1fr)',
        'repeat(10, 1fr)',
        'repeat(16, 1fr)',
        'repeat(20, 1fr)',
      ],
      gridTemplateRows: 'repeat(12, 1fr)',
      my: [6, 6, 0, 0]
    },
    cardList: {
      gap: [2, 3, 3, 4],
      gridColumn: ['1/-1', null, 'span 5', null],
      gridRow: ['auto', null, '2/-2', null],
    }
  },
  cards: {
    primary: {
      borderRadius: 14,
      background: 'backgroundDark',
      padding: 3,
      display: 'flex',
      flexFlow: 'column',
    }
  },
})

export type Theme = typeof theme
