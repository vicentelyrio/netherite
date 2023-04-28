import type IForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin'
import path from 'path'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ForkTsCheckerWebpackPlugin: typeof IForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')

// eslint-disable-next-line @typescript-eslint/no-var-requires
const CopyWebPackPlugin = require('copy-webpack-plugin')

const assets = ['server/']

export const plugins = [
  new ForkTsCheckerWebpackPlugin({
    logger: 'webpack-infrastructure',
  }),
  ...assets.map((asset) => (
    new CopyWebPackPlugin({
      patterns: [{
        from: path.resolve(__dirname, 'src', asset),
        to: path.resolve(__dirname, '.webpack/main', asset)
      }]
    })
  ))
]
