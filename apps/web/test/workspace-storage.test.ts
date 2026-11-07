import { afterEach, describe, expect, test } from 'vitest'
import { readHidden, writeHidden } from '../src/features/inbox/triage'
import { lastSeen, markSeen } from '../src/features/inbox/waiting'
import { lastProject, rememberProject } from '../src/features/projects/ProjectsEntry/remember'

const openWorkspace = (root: string) => {
  document.head.querySelector('meta[name="netherite-workspace"]')?.remove()
  const tag = document.createElement('meta')
  tag.name = 'netherite-workspace'
  tag.content = root
  document.head.append(tag)
}

describe('what the browser remembers for a workspace', () => {
  afterEach(() => {
    document.head.querySelector('meta[name="netherite-workspace"]')?.remove()
    localStorage.clear()
  })

  test('another workspace on the same port does not see it', () => {
    openWorkspace('/repos/one')
    markSeen('2026-01-01')
    rememberProject('PROJ-00001')
    writeHidden({ 'orphan:DOC-00001': { kind: 'archive' } })

    openWorkspace('/repos/two')
    expect(lastSeen()).toBeUndefined()
    expect(lastProject()).toBeUndefined()
    expect(readHidden()).toEqual({})
  })

  test('the same workspace finds it again', () => {
    openWorkspace('/repos/one')
    markSeen('2026-01-01')
    rememberProject('PROJ-00001')
    writeHidden({ 'orphan:DOC-00001': { kind: 'archive' } })

    openWorkspace('/repos/two')
    openWorkspace('/repos/one')
    expect(lastSeen()).toBe('2026-01-01')
    expect(lastProject()).toBe('PROJ-00001')
    expect(readHidden()).toEqual({ 'orphan:DOC-00001': { kind: 'archive' } })
  })
})
