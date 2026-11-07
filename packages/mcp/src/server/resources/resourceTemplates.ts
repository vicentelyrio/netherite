export const resourceTemplates = [
  {
    uriTemplate: 'netherite://item/{id}',
    name: 'Item',
    description: 'The raw Markdown file of an item, by ID.',
    mimeType: 'text/markdown',
  },
  {
    uriTemplate: 'netherite://stats/{period}',
    name: 'Stats',
    description: 'The same for a period: 30d, quarter or year. Needs git.',
    mimeType: 'application/json',
  },
  {
    uriTemplate: 'netherite://schema/{type}',
    name: 'Schema',
    description: 'JSON Schema for an item type.',
    mimeType: 'application/json',
  },
]
