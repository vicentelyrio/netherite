import { describe, expect, test } from 'vitest'
import { unifiedDiff } from '../src/index'

describe('unifiedDiff', () => {
  test('shows a changed line with context', () => {
    expect(
      unifiedDiff(
        'a.md',
        'one\ntwo\nthree\nfour\nfive\nsix\nseven\n',
        'one\ntwo\nthree\nFOUR\nfive\nsix\nseven\n',
      ),
    ).toBe(
      [
        '--- a/a.md',
        '+++ b/a.md',
        '@@ -1,7 +1,7 @@',
        ' one',
        ' two',
        ' three',
        '-four',
        '+FOUR',
        ' five',
        ' six',
        ' seven',
      ].join('\n'),
    )
  })

  test('limits context to three lines and splits distant changes into hunks', () => {
    const before = Array.from({ length: 20 }, (_, i) => `line ${i + 1}`).join('\n')
    const after = before.replace('line 2\n', 'LINE 2\n').replace('line 19', 'LINE 19')
    const diff = unifiedDiff('x', `${before}\n`, `${after}\n`)
    expect(diff.match(/^@@/gm)).toHaveLength(2)
    expect(diff).toContain('-line 2')
    expect(diff).toContain('+LINE 19')
    expect(diff).not.toContain(' line 10')
  })

  test('a new file diffs from /dev/null', () => {
    expect(unifiedDiff('n.md', null, 'a\nb\n')).toBe(
      ['--- /dev/null', '+++ b/n.md', '@@ -0,0 +1,2 @@', '+a', '+b'].join('\n'),
    )
  })

  test('a deleted file diffs to /dev/null', () => {
    expect(unifiedDiff('d.md', 'a\nb\n', null)).toBe(
      ['--- a/d.md', '+++ /dev/null', '@@ -1,2 +0,0 @@', '-a', '-b'].join('\n'),
    )
  })

  test('identical text has only the header', () => {
    expect(unifiedDiff('s.md', 'a\n', 'a\n')).toBe('--- a/s.md\n+++ b/s.md')
  })

  test('line ending differences do not show up as changes', () => {
    expect(unifiedDiff('c.md', 'a\r\nb\r\n', 'a\r\nB\r\n')).toContain('-b\n+B')
  })

  test('added and removed lines in the middle', () => {
    const diff = unifiedDiff('m', 'a\nb\nc\n', 'a\nx\ny\nc\n')
    expect(diff).toContain('-b')
    expect(diff).toContain('+x\n+y')
    expect(diff).toContain('@@ -1,3 +1,4 @@')
  })
})
