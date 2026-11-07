import { render } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { AdrDiamond } from './index'

describe('AdrDiamond', () => {
  test('is hollow only when asked', () => {
    const { container, rerender } = render(<AdrDiamond />)
    expect(container.querySelector('[data-hollow]')).toBeNull()
    rerender(<AdrDiamond hollow />)
    expect(container.querySelector('[data-hollow]')).not.toBeNull()
  })
})
