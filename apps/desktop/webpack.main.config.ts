import type { WebpackConfiguration } from '@electron-forge/plugin-webpack/dist/Config'

import { rules } from './webpack.rules'

export const mainConfig: WebpackConfiguration = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  target: 'electron-main',
  entry: './src/main.ts',
  // Put your normal webpack config below here
  module: {
    rules,
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
  },
  experiments: {
    topLevelAwait: true
  },
}
