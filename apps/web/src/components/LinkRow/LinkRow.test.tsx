import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { LinkRow } from './LinkRow'

describe('LinkRow', () => {
  test('a path-only link shows the path, and the kind reads as words', () => {
    render(<LinkRow link={{ kind: 'belongs_to', path: 'docs/a.md' }} />)
    expect(screen.getByText('docs/a.md')).toBeTruthy()
    expect(screen.getByText('belongs to')).toBeTruthy()
  })
})
