import { BadMarkers } from './errors'

/** The comments that fence a generated block inside a file a person also edits. */
export interface Markers {
  readonly start: string
  readonly end: string
  /** A comment placed inside the block, saying it is generated. */
  readonly notice: string
}

/** The block's text, markers included, in the given line ending. */
export const renderMarkedBlock = (markers: Markers, text: string, eol = '\n') => {
  const body = text.replace(/\r\n/g, '\n').trim()
  return [markers.start, markers.notice, '', ...(body === '' ? [] : [body, '']), markers.end]
    .join('\n')
    .replace(/\n/g, eol)
}

/**
 * Puts a generated block into `existing`: replaces what is between the markers (and the markers),
 * or appends the block if there are none. Text outside the markers comes back byte for byte.
 * Returns `null` when the file does not exist and there is nothing to write. Throws `BadMarkers`
 * when the markers are damaged.
 */
export const applyMarkedBlock = (
  markers: Markers,
  path: string,
  existing: string | null,
  text: string,
): string | null => {
  const has = text.trim() !== ''
  if (existing === null) return has ? `${renderMarkedBlock(markers, text)}\n` : null
  const eol = existing.includes('\r\n') ? '\r\n' : '\n'
  const block = renderMarkedBlock(markers, text, eol)

  const starts = existing.split(markers.start).length - 1
  const ends = existing.split(markers.end).length - 1
  if (starts === 0 && ends === 0) {
    if (!has) return existing
    const gap = existing === '' ? '' : existing.endsWith(eol) ? eol : eol + eol
    return `${existing}${gap}${block}${eol}`
  }
  if (starts > 1 || ends > 1) throw new BadMarkers({ path, problem: 'repeated' })
  if (starts === 0) throw new BadMarkers({ path, problem: 'unopened' })
  if (ends === 0) throw new BadMarkers({ path, problem: 'unclosed' })
  const from = existing.indexOf(markers.start)
  const to = existing.indexOf(markers.end)
  if (to < from) throw new BadMarkers({ path, problem: 'out-of-order' })
  return existing.slice(0, from) + block + existing.slice(to + markers.end.length)
}
