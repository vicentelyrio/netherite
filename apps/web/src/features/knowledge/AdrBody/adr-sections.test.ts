import { describe, expect, test } from 'vitest'
import { adrSections, consequencesOf } from './adr-sections'

const adr =
  '# Title\n\n## Context\n\nWhy.\n\n## Decision\n\nDo it.\n\n## Consequences\n\n- \\+ Faster\n- \\- Costs more\n- + Plain plus\n'

describe('adrSections', () => {
  test('splits at the ## headings and keeps what comes before as the intro', () => {
    const { intro, sections } = adrSections(adr)
    expect(intro).toContain('# Title')
    expect(sections.map((s) => s.title)).toEqual(['Context', 'Decision', 'Consequences'])
  })

  test('a heading inside a code fence is not a section', () => {
    const { sections } = adrSections('## A\n\n```\n## not\n```\n')
    expect(sections.map((s) => s.title)).toEqual(['A'])
  })
})

describe('consequencesOf', () => {
  test('sorts signed items into good and bad', () => {
    const text = adrSections(adr).sections[2]?.text ?? ''
    expect(consequencesOf(text)).toEqual({
      lead: '',
      good: ['Faster', 'Plain plus'],
      bad: ['Costs more'],
    })
  })

  test('text that is not signed items is left to be shown as it is', () => {
    expect(consequencesOf('## Consequences\n\nJust prose.\n')).toBeUndefined()
    expect(consequencesOf('## Consequences\n\n- + Good\n\nand then prose\n')).toBeUndefined()
  })
})
