import { describe, expect, test } from 'vitest'
import { fillSelection } from './fill'

const front = '---\nid: RUN-00001\n# hint: not a title\n---\n\n'
const selected = (source: string) => {
  const { anchor, head } = fillSelection(source)
  return source.slice(anchor, head)
}

describe('fillSelection', () => {
  test('selects the first line of starter text, so typing replaces it', () => {
    expect(selected(`${front}# Deploy\n\nWhen to use this.\n\n## Steps\n\n1. One\n`)).toBe(
      'When to use this.',
    )
  })

  test('puts the cursor at the end of an empty document', () => {
    const source = `${front}# Deploy\n`
    expect(fillSelection(source)).toEqual({ anchor: source.length, head: source.length })
  })

  test('never selects a heading', () => {
    const source = `${front}# Deploy\n\n## Steps\n`
    expect(fillSelection(source)).toEqual({ anchor: source.length, head: source.length })
  })
})
