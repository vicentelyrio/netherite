export interface AdrSections {
  /** The title and whatever comes before the first `##` heading. */
  readonly intro: string
  readonly sections: ReadonlyArray<{ readonly title: string; readonly text: string }>
}

/** Splits an ADR's text at its `## ` headings, ignoring any inside a code fence. */
export const adrSections = (source: string): AdrSections => {
  const lines = source.split('\n')
  const intro: string[] = []
  const sections: Array<{ title: string; lines: string[] }> = []
  let fenced = false
  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced
    const heading = fenced ? null : /^##\s+(.+?)\s*$/.exec(line)
    if (heading) sections.push({ title: heading[1] as string, lines: [line] })
    else (sections.at(-1)?.lines ?? intro).push(line)
  }
  return {
    intro: intro.join('\n'),
    sections: sections.map((s) => ({ title: s.title, text: s.lines.join('\n') })),
  }
}

export interface Consequences {
  /** What is said before the first sign. */
  readonly lead: string
  readonly good: ReadonlyArray<string>
  readonly bad: ReadonlyArray<string>
}

/** `- + text` or `- \+ text` is a good consequence, `- - text` or `- \- text` a bad one. */
export const consequencesOf = (text: string): Consequences | undefined => {
  const good: string[] = []
  const bad: string[] = []
  const lead: string[] = []
  for (const line of text.split('\n').slice(1)) {
    const item = /^[-*]\s+\\?([+-])\s+(.*)$/.exec(line)
    if (item) (item[1] === '+' ? good : bad).push(item[2] as string)
    else if (good.length === 0 && bad.length === 0) lead.push(line)
    else if (line.trim() !== '') return undefined
  }
  return good.length + bad.length === 0 ? undefined : { lead: lead.join('\n').trim(), good, bad }
}
