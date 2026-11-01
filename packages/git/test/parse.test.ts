import { describe, expect, test } from 'vitest'
import { changedPaths, handleFrom, parseLog, parseStatus } from '../src/index'
import { fieldSeparator as f, logFormat, recordSeparator as r } from '../src/parse'

const z = (...fields: string[]) => `${fields.join('\0')}\0`

describe('parseStatus', () => {
  const header = [
    '# branch.oid 1234567890abcdef1234567890abcdef12345678',
    '# branch.head main',
    '# branch.upstream origin/main',
    '# branch.ab +2 -1',
  ]

  test('reads the branch header', () => {
    expect(parseStatus(z(...header))).toEqual({
      oid: '1234567890abcdef1234567890abcdef12345678',
      branch: 'main',
      upstream: 'origin/main',
      ahead: 2,
      behind: 1,
      entries: [],
    })
  })

  test('a repository with no commits has no oid, and a detached HEAD no branch', () => {
    const status = parseStatus(z('# branch.oid (initial)', '# branch.head (detached)'))
    expect(status.oid).toBeUndefined()
    expect(status.branch).toBeUndefined()
    expect(status.upstream).toBeUndefined()
  })

  test('reads ordinary, untracked and ignored entries', () => {
    const status = parseStatus(
      z(
        ...header,
        '1 .M N... 100644 100644 100644 aaaa bbbb src/app.ts',
        '1 A. N... 000000 100644 100644 0000 cccc new file.md',
        '? notes/todo.md',
        '! build/out.js',
      ),
    )
    expect(status.entries).toEqual([
      { path: 'src/app.ts', kind: 'ordinary', index: '.', worktree: 'M' },
      { path: 'new file.md', kind: 'ordinary', index: 'A', worktree: '.' },
      { path: 'notes/todo.md', kind: 'untracked', index: '.', worktree: '?' },
      { path: 'build/out.js', kind: 'ignored', index: '.', worktree: '!' },
    ])
    expect(changedPaths(status)).toEqual(['src/app.ts', 'new file.md', 'notes/todo.md'])
  })

  test('a rename carries the old path in the next field', () => {
    const status = parseStatus(
      z(
        '1 M. N... 100644 100644 100644 a b one.md',
        '2 R. N... 100644 100644 100644 a b R100 new name.md',
        'old name.md',
        '? x.md',
      ),
    )
    expect(status.entries).toEqual([
      { path: 'one.md', kind: 'ordinary', index: 'M', worktree: '.' },
      { path: 'new name.md', from: 'old name.md', kind: 'renamed', index: 'R', worktree: '.' },
      { path: 'x.md', kind: 'untracked', index: '.', worktree: '?' },
    ])
  })

  test('an unmerged entry', () => {
    const status = parseStatus(z('u UU N... 100644 100644 100644 100644 a b c conflict.md'))
    expect(status.entries).toEqual([
      { path: 'conflict.md', kind: 'unmerged', index: 'U', worktree: 'U' },
    ])
  })

  test('empty output is an empty status', () => {
    expect(parseStatus('').entries).toEqual([])
  })
})

describe('parseLog', () => {
  const header = (hash: string, subject: string) =>
    `${r}${hash}${f}Ada${f}ada@example.com${f}2026-01-01T09:00:00+00:00${f}2026-01-02T09:00:00+00:00${f}${subject}`

  test('reads commits without files', () => {
    const out = `${header('aaa', 'first')}\n${header('bbb', 'second: with a colon')}\n`
    const commits = parseLog(out, 'none')
    expect(commits.map((c) => [c.hash, c.subject])).toEqual([
      ['aaa', 'first'],
      ['bbb', 'second: with a colon'],
    ])
    expect(commits[0]).toMatchObject({
      author: { name: 'Ada', email: 'ada@example.com' },
      date: '2026-01-01T09:00:00+00:00',
      committerDate: '2026-01-02T09:00:00+00:00',
      files: [],
    })
  })

  test('reads file names', () => {
    const out = `${header('aaa', 's')}\n\nsrc/app.ts\nnotes/a b.md\n${header('bbb', 't')}\n\nsrc/util.ts\n`
    const commits = parseLog(out, 'names')
    expect(commits.map((c) => c.files.map((x) => x.path))).toEqual([
      ['src/app.ts', 'notes/a b.md'],
      ['src/util.ts'],
    ])
  })

  test('reads numstat, with binary files', () => {
    const out = `${header('aaa', 's')}\n\n3\t1\tsrc/app.ts\n-\t-\timage.png\n`
    expect(parseLog(out, 'numstat')[0]?.files).toEqual([
      { path: 'src/app.ts', added: 3, deleted: 1 },
      { path: 'image.png', added: undefined, deleted: undefined },
    ])
  })

  test('a commit with no files and a subject containing the field separator', () => {
    const commits = parseLog(`${header('aaa', `odd${f}subject`)}\n\n`, 'names')
    expect(commits[0]?.subject).toBe(`odd${f}subject`)
    expect(commits[0]?.files).toEqual([])
  })

  test('empty output is no commits', () => {
    expect(parseLog('', 'names')).toEqual([])
  })

  test('the format string and the parser agree on field order', () => {
    expect(logFormat.split(f)).toHaveLength(6)
  })
})

describe('handleFrom', () => {
  test.each([
    [{ github: 'octocat', email: 'o@x.com', name: 'The Octocat' }, '@octocat'],
    [{ github: undefined, email: 'ada.lovelace+work@example.com', name: 'Ada' }, '@ada.lovelace'],
    [{ github: undefined, email: undefined, name: 'Grace Hopper' }, '@Grace-Hopper'],
    [{ github: undefined, email: '123456+user@users.noreply.github.com', name: 'x' }, '@123456'],
    [{ github: undefined, email: '___@x.com', name: 'Ok Name' }, '@Ok-Name'],
  ])('%j -> %s', (identity, handle) => {
    expect(handleFrom(identity)).toBe(handle)
  })

  test('nothing usable gives undefined', () => {
    expect(handleFrom({ github: undefined, email: undefined, name: undefined })).toBeUndefined()
    expect(handleFrom({ github: ' ', email: '@x.com', name: '!!!' })).toBeUndefined()
  })
})

import { assertReadOnly, readOnlySubcommands } from '../src/index'

describe('assertReadOnly', () => {
  test.each([
    ['commit', '-m', 'x'],
    ['add', '.'],
    ['checkout', 'main'],
    ['switch', 'main'],
    ['reset', '--hard'],
    ['restore', 'file'],
    ['push'],
    ['pull'],
    ['fetch'],
    ['merge', 'x'],
    ['rebase', 'x'],
    ['cherry-pick', 'x'],
    ['revert', 'x'],
    ['stash'],
    ['clean', '-fd'],
    ['rm', 'x'],
    ['mv', 'a', 'b'],
    ['branch', 'x'],
    ['tag', 'x'],
    ['init'],
    ['clone', 'x'],
    ['gc'],
    ['update-ref', 'HEAD', 'x'],
    ['apply', 'p'],
    ['am'],
    ['remote', 'add', 'x', 'y'],
    ['submodule', 'update'],
    ['worktree', 'add', 'x'],
    ['hash-object', '-w', 'x'],
    ['symbolic-ref', 'HEAD', 'x'],
    ['', 'x'],
  ])('refuses %s', (...args) => {
    expect(assertReadOnly(args)).toMatchObject({ _tag: 'ForbiddenGitCommand' })
  })

  test.each([
    ['config', 'user.name', 'x'],
    ['config', '--global', '--get', 'user.name'],
    ['config', '--unset', 'user.name'],
    ['config', '--add', 'a.b', 'c'],
    ['config', '--edit'],
    ['config', '--file', '/tmp/x', '--get', 'a.b'],
    ['diff', '--output=/tmp/x'],
    ['diff', '--ext-diff'],
    ['log', '--output', '/tmp/x'],
    ['show', '--textconv', 'x'],
  ])('refuses %j', (...args) => {
    expect(assertReadOnly(args)).toMatchObject({ _tag: 'ForbiddenGitCommand' })
  })

  test.each([
    ['status', '--porcelain=v2', '-z'],
    ['log', '--format=%H', '--', 'src'],
    ['rev-parse', '--verify', '-q', 'HEAD'],
    ['config', '--get', 'user.name'],
    ['config', '--list'],
    ['diff', '--numstat', 'HEAD~1'],
    ['show', 'HEAD:file'],
    ['ls-files'],
    ['cat-file', '-p', 'HEAD'],
  ])('allows %j', (...args) => {
    expect(assertReadOnly(args)).toBeUndefined()
  })

  test('a path after -- is not mistaken for an option', () => {
    expect(assertReadOnly(['log', '--', '--output=x'])).toBeUndefined()
    expect(assertReadOnly(['log', '--output=x', '--', 'a'])).toMatchObject({
      _tag: 'ForbiddenGitCommand',
    })
  })

  test('the allow-list holds only commands that cannot change commits, the index or files', () => {
    for (const name of readOnlySubcommands) {
      expect([
        'commit',
        'add',
        'checkout',
        'reset',
        'push',
        'merge',
        'rebase',
        'rm',
        'mv',
        'clean',
      ]).not.toContain(name)
    }
  })
})
