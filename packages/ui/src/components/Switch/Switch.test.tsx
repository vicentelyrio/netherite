import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import { renderUi } from '../../../test/helpers'
import { Switch } from './index'

describe('Switch', () => {
  test('Switch toggles and is named by its label', async () => {
    const onChange = vi.fn()
    renderUi(<Switch label="Include in context" onChange={onChange} />)
    await userEvent.click(screen.getByRole('switch', { name: 'Include in context' }))
    expect(onChange).toHaveBeenCalled()
  })
})
