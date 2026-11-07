import type { TranslationFunctions } from './i18n-types'

const cluster = { other: 'Other' } as const

export const linkKindLabel = (LL: TranslationFunctions, kind: string) => {
  const edges: Readonly<Record<string, () => string>> = LL.components.graph.edges
  return Object.hasOwn(edges, kind)
    ? (edges[kind] as () => string)().toLocaleLowerCase()
    : kind.replace('_', ' ')
}

export const adrStatusLabel = (LL: TranslationFunctions, status: string) => {
  const words: Readonly<Record<string, () => string>> = LL.common.adrStatus
  return Object.hasOwn(words, status)
    ? (words[status] as () => string)().toLocaleLowerCase()
    : status
}

export const clusterLabel = (LL: TranslationFunctions, name: string) =>
  name === cluster.other ? LL.tags.overview.other() : name
