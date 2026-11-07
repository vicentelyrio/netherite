export type SourceKind =
  | { readonly kind: 'path'; readonly path: string }
  | { readonly kind: 'url'; readonly url: string }
  | { readonly kind: 'outside'; readonly source: string }

export const classifySource = (source: string): SourceKind => {
  if (/^[A-Za-z][A-Za-z0-9+.-]*:/u.test(source)) return { kind: 'url', url: source }
  const clean = source.replaceAll('\\', '/').replace(/^\.\//u, '')
  if (clean === '' || clean.startsWith('/') || clean.split('/').includes('..')) {
    return { kind: 'outside', source }
  }
  return { kind: 'path', path: clean }
}

export const normalizeSource = (source: string): string => {
  const kind = classifySource(source)
  return kind.kind === 'path' ? kind.path : source
}
