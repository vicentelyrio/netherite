module.exports = {
  stories: [
    '../stories/**/*.stories.mdx',
    '../stories/**/*.stories.@(js|jsx|ts|tsx)'
  ],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-links',
    '@storybook/addon-interactions',
    '@storybook/addon-storysource',
    'storybook-addon-pseudo-states',
    'storybook-dark-mode',
    'storybook-design-token',
    '@storybook/addon-coverage',
  ],
  features: {
    interactionsDebugger: true, // 👈 Enable playback controls
  },
  framework: '@storybook/react',
  core: {
    builder: '@storybook/builder-webpack5'
  }
}
