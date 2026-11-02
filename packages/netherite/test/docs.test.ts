import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

const repo = join(dirname(fileURLToPath(import.meta.url)), '../../..')

const markdownFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? markdownFiles(path) : name.endsWith('.md') ? [path] : []
  })

const pages = [join(repo, 'README.md'), ...markdownFiles(join(repo, 'docs'))]
const text = (path: string) => readFileSync(path, 'utf8')

describe('the documentation', () => {
  test('every relative link goes to a file that exists', () => {
    const broken: string[] = []
    for (const page of pages) {
      for (const match of text(page).matchAll(/\]\(([^)#\s]+)(?:#[^)]*)?\)/g)) {
        const target = match[1] as string
        if (/^[a-z]+:/i.test(target)) continue
        if (!existsSync(resolve(dirname(page), target)))
          broken.push(`${page.replace(repo, '')}: ${target}`)
      }
    }
    expect(broken).toEqual([])
  })

  test('every `netherite <command>` in a code block is a command the program has', () => {
    const known = new Set(['init', 'new', 'lint', 'renumber', 'mcp', 'context', 'serve'])
    const unknown: string[] = []
    for (const page of pages) {
      const blocks = [...text(page).matchAll(/```(?:sh|bash|text)?\n([\s\S]*?)```/g)]
      for (const block of blocks) {
        for (const line of (block[1] as string).split('\n')) {
          const match = /(?:^|\s)(?:npx )?netherite ([a-z][a-z-]*)/.exec(line)
          if (match && !(match[1] as string).startsWith('-') && !known.has(match[1] as string)) {
            unknown.push(`${page.replace(repo, '')}: ${line.trim()}`)
          }
        }
      }
    }
    expect(unknown).toEqual([])
  })

  test('the generated references are there, and the README points at all of them', () => {
    const readme = text(join(repo, 'README.md'))
    for (const name of ['cli', 'mcp', 'schemas', 'config', 'lint']) {
      expect(existsSync(join(repo, `docs/reference/${name}.md`))).toBe(true)
      expect(readme).toContain(`docs/reference/${name}.md`)
    }
    expect(readme).toContain('docs/obsidian.md')
  })
})
