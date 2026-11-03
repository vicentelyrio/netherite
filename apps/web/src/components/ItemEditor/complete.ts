/** An item a wikilink can point at. */
export interface LinkTarget {
  readonly id: string
  readonly title: string
  readonly type: string
}

export interface LinkOption {
  readonly label: string
  readonly detail: string
  readonly type: string
  /** Text that goes in after `[[`, closing the link. */
  readonly apply: string
}

/** Matches an unfinished wikilink before the cursor: `[[` and what has been typed of the target. */
export const openWikiLink = /\[\[([^\]\n|#]*)$/

const rank = (target: LinkTarget, query: string) => {
  const q = query.toLowerCase()
  const id = target.id.toLowerCase()
  const title = target.title.toLowerCase()
  if (q === '') return 3
  if (id === q) return 0
  if (id.startsWith(q)) return 1
  if (title.startsWith(q)) return 2
  if (id.includes(q)) return 3
  if (title.includes(q)) return 4
  // Every word of the query somewhere in the title, such as "git ADR".
  const words = q.split(/\s+/).filter(Boolean)
  return words.length > 1 && words.every((w) => id.includes(w) || title.includes(w)) ? 5 : undefined
}

/**
 * What to suggest after `[[`: items whose ID or title matches what was typed, best first, by
 * ID order within a rank. The suggestion completes the link: `[[ADR-00007]]`.
 */
export const linkOptions = (
  targets: ReadonlyArray<LinkTarget>,
  query: string,
  limit = 50,
): LinkOption[] =>
  targets
    .flatMap((t) => {
      const r = rank(t, query)
      return r === undefined ? [] : [{ t, r }]
    })
    .sort((a, b) => a.r - b.r || a.t.id.localeCompare(b.t.id))
    .slice(0, limit)
    .map(({ t }) => ({ label: t.id, detail: t.title, type: t.type, apply: `${t.id}]]` }))
