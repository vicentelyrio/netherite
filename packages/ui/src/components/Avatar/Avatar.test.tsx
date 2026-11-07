import { screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { renderUi } from '../../../test/helpers'
import { Avatar, avatarColorOf, initialsOf } from './index'

describe('Avatar', () => {
  test('takes initials from a name or a handle', () => {
    expect(initialsOf('Grace Hopper')).toBe('GH')
    expect(initialsOf('@ada')).toBe('AD')
    expect(initialsOf('@vicente.lyrio')).toBe('VL')
    expect(initialsOf('x')).toBe('X')
    expect(initialsOf('')).toBe('')
  })

  test('the same person always has the same colour', () => {
    expect(avatarColorOf('@ada')).toBe(avatarColorOf('@ADA'))
    const colors = new Set(
      ['@ada', '@grace', '@linus', '@margaret', '@ken', '@barbara'].map(avatarColorOf),
    )
    expect(colors.size).toBeGreaterThan(1)
  })

  test('shows initials, and the full name on hover', () => {
    renderUi(<Avatar name="Grace Hopper" />)
    expect(screen.getByText('GH')).toBeInTheDocument()
    expect(screen.getAllByTitle('Grace Hopper').length).toBeGreaterThan(0)
  })
})
