import type IForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin'
import path from 'path'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ForkTsCheckerWebpackPlugin: typeof IForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')

// eslint-disable-next-line @typescript-eslint/no-var-requires
const CopyWebPackPlugin = require('copy-webpack-plugin')

export const plugins = [
  new ForkTsCheckerWebpackPlugin({
    logger: 'webpack-infrastructure',
  }),
  new CopyWebPackPlugin({
    patterns: [
      {
        from: path.resolve(__dirname, 'dist/server'),
        to: path.resolve(__dirname, '.webpack/main/server')
      },
      {
        from: path.resolve(__dirname, 'src/server/index.html'),
        to: path.resolve(__dirname, '.webpack/main/server/index.html')
      },
    ]
  })
]
