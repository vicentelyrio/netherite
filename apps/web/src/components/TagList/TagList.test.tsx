import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { TagList } from './TagList'

describe('TagList', () => {
  test('shows each tag', () => {
    render(<TagList tags={['infra', 'setup']} />)
    expect(screen.getByText('infra')).toBeTruthy()
    expect(screen.getByText('setup')).toBeTruthy()
  })

  test('renders nothing without tags', () => {
    const { container } = render(<TagList tags={[]} />)
    expect(container.firstChild).toBeNull()
  })
})
