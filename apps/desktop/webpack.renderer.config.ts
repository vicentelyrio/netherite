import type { WebpackConfiguration } from '@electron-forge/plugin-webpack/dist/Config'

import { rules } from './webpack.rules'
import { plugins } from './webpack.plugins'

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
})

export const rendererConfig: WebpackConfiguration = {
  module: {
    rules,
  },
  plugins: plugins as any,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
  },
}
