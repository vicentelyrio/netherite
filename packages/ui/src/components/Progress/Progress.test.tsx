import { screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { renderUi } from '../../../test/helpers'
import { ProgressRing } from '../ProgressRing'
import { Progress, percentOf } from './index'

describe('Progress', () => {
  test('counts the share done, and a checklist with nothing in it as nothing done', () => {
    expect(percentOf(3, 8)).toBe(38)
    expect(percentOf(8, 8)).toBe(100)
    expect(percentOf(0, 0)).toBe(0)
    expect(percentOf(9, 8)).toBe(100)
    expect(percentOf(-1, 8)).toBe(0)
  })

  test('the bar and the ring say how much is done, in words', () => {
    renderUi(
      <>
        <Progress done={3} total={8} label="Checklist" />
        <ProgressRing done={5} total={12} label="Project" showCount />
      </>,
    )
    expect(screen.getByLabelText('Checklist: 3 of 8 done')).toBeInTheDocument()
    expect(screen.getByLabelText('Project: 5 of 12 done')).toBeInTheDocument()
    expect(screen.getByText('5/12')).toBeInTheDocument()
  })
})
