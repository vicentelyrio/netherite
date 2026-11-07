import { screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { renderUi } from '../../../test/helpers'
import { ProgressRing } from './index'

describe('ProgressRing', () => {
  test('the ring shows a percentage by default', () => {
    renderUi(<ProgressRing done={3} total={8} />)
    expect(screen.getByRole('img', { name: /3 of 8 done/ })).toHaveTextContent('38%')
  })
})
