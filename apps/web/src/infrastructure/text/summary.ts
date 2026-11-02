/** The first plain paragraph of some Markdown, without headings, lists, code or link marks. */
export const summaryOf = (body: string): string => {
  const first = body
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.trim())
    .find((p) => p !== '' && !/^(#|[-*]\s|\d+\.\s|```)/.test(p))
  return (first ?? '')
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 400)
}
