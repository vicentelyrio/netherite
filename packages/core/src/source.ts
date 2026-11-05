/**
 * Where an imported item came from (ADR-00026): a file in the repository, written as a path from
 * the repository root, or a URL. Anything else, such as an absolute path or one that climbs out
 * with `..`, cannot be looked for or moved, so it is not a file of this repository.
 */
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

/** One spelling for a source, so `./docs/a.md` and `docs/a.md` are the same one. */
export const normalizeSource = (source: string): string => {
  const kind = classifySource(source)
  return kind.kind === 'path' ? kind.path : source
}
