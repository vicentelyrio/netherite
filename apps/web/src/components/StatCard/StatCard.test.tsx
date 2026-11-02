import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { StatCard } from './StatCard'

describe('StatCard', () => {
  test('shows the value and its label', () => {
    render(<StatCard value={31} label="tasks done" />)
    expect(screen.getByText('31')).toBeTruthy()
    expect(screen.getByText('tasks done')).toBeTruthy()
  })
})
