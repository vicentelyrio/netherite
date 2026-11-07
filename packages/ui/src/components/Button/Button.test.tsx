import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import { renderUi } from '../../../test/helpers'
import { Button } from './index'

describe('Button', () => {
  test('fires on click and shows its icon before the label', async () => {
    const onClick = vi.fn()
    renderUi(
      <Button icon="add" onClick={onClick}>
        New task
      </Button>,
    )
    const button = screen.getByRole('button', { name: /New task/ })
    expect(within(button).getByText('add')).toBeInTheDocument()
    await userEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  test('has the four looks, and the theme’s classes', () => {
    renderUi(
      <>
        <Button variant="primary">p</Button>
        <Button>s</Button>
        <Button variant="subtle">u</Button>
        <Button variant="danger">d</Button>
      </>,
    )
    const variants = screen.getAllByRole('button').map((b) => b.getAttribute('data-variant'))
    expect(variants).toEqual(['filled', 'default', 'subtle', 'filled'])
    for (const b of screen.getAllByRole('button')) expect(b).toHaveClass('nt-button')
  })

  test('does not fire when disabled or loading', async () => {
    const onClick = vi.fn()
    renderUi(
      <>
        <Button disabled onClick={onClick}>
          off
        </Button>
        <Button loading onClick={onClick}>
          busy
        </Button>
      </>,
    )
    for (const b of screen.getAllByRole('button')) await userEvent.click(b)
    expect(onClick).not.toHaveBeenCalled()
  })
})
