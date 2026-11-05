import { BadMarkers } from './errors'

export interface Markers {
  readonly start: string
  readonly end: string
  readonly notice: string
}

export const renderMarkedBlock = (markers: Markers, text: string, eol = '\n') => {
  const body = text.replace(/\r\n/g, '\n').trim()
  return [markers.start, markers.notice, '', ...(body === '' ? [] : [body, '']), markers.end]
    .join('\n')
    .replace(/\n/g, eol)
}

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
