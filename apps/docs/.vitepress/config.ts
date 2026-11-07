import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Netherite Docs',
  description:
    'A typed, linked knowledge base in Markdown and git: a CLI, an MCP server for agents, and a local app.',
  base: '/netherite/',
  cleanUrls: true,
  appearance: 'dark',
  head: [
    ['meta', { name: 'theme-color', content: '#23253a' }],
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/netherite/favicon.svg' }],
  ],
  themeConfig: {
    nav: [
      { text: 'Getting started', link: '/getting-started' },
      { text: 'Reference', link: '/reference/cli' },
      { text: 'npm', link: 'https://www.npmjs.com/package/@vicentelyrio/netherite' },
    ],
    sidebar: [
      {
        text: 'Start',
        items: [
          { text: 'Getting started', link: '/getting-started' },
          { text: 'Install', link: '/install' },
          { text: 'Concepts', link: '/concepts' },
        ],
      },
      {
        text: 'Guides',
        items: [
          { text: 'Agents', link: '/agents' },
          { text: 'Templates', link: '/templates' },
          { text: 'Migrate a repository', link: '/migrate' },
          { text: 'Obsidian', link: '/obsidian' },
        ],
      },
      {
        text: 'Reference',
        items: [
          { text: 'CLI', link: '/reference/cli' },
          { text: 'Configuration', link: '/reference/config' },
          { text: 'Lint rules', link: '/reference/lint' },
          { text: 'Import', link: '/reference/import' },
          { text: 'MCP', link: '/reference/mcp' },
          { text: 'Item schemas', link: '/reference/schemas' },
        ],
      },
    ],
    socialLinks: [{ icon: 'github', link: 'https://github.com/vicentelyrio/netherite' }],
    search: { provider: 'local' },
    editLink: {
      pattern: 'https://github.com/vicentelyrio/netherite/edit/main/apps/docs/:path',
      text: 'Edit this page on GitHub',
    },
    outline: { level: [2, 3] },
    footer: { message: 'MIT licensed. Nothing is sent anywhere: it runs on your machine.' },
  },
})
